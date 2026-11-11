// 🐉 Мій дракон — вихованець. Порт game/dragons.py.
import * as S from './state.js?v=20261111180051';
import * as FX from './fx.js?v=20261111180051';
import * as L from './lumi.js?v=20261111180051';
import { t } from './i18n.js?v=20261111180051';

// ---------------------------------------------------------------- спільні дрібниці режимів
const CSS_HREF = new URL('./modes.css?v=20261111180051', import.meta.url).href;
function ensureCss(root) {
  let l = document.querySelector('link[data-modes-css]');
  if (!l) {
    l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = CSS_HREF; l.dataset.modesCss = '1';
    l.addEventListener('load', () => { l.dataset.ready = '1'; }, { once: true });
    document.head.append(l);
  }
  if (!l.dataset.ready && !l.sheet) {
    root.style.visibility = 'hidden';
    const show = () => { root.style.visibility = ''; };
    l.addEventListener('load', show, { once: true });
    l.addEventListener('error', show, { once: true });
    setTimeout(show, 1500);
  }
}
const asset = (p) => new URL('./' + p.replace(/\.png$/, '.webp').replace(/^covers\//, 'cover_').split('/').pop(), import.meta.url).href;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function fx(name, ...a) {
  try { const f = FX[name]; if (typeof f === 'function') return f(...a); } catch (e) { console.warn('fx', name, e); }
  return undefined;
}
function floatText(target, text, cls = '') { // власний: по центру цілі
  const r = target.getBoundingClientRect();
  const d = el('div', 'm-float ' + cls, esc(text));
  d.style.left = r.left + r.width / 2 + 'px';
  d.style.top = r.top + r.height / 3 + 'px';
  document.body.append(d);
  setTimeout(() => d.remove(), 1200);
}
function countUp(node, from, to, ms = 900) {
  if (typeof FX.countUp === 'function') { try { return FX.countUp(node, from, to, ms); } catch (e) { /* fallback */ } }
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    node.textContent = Math.round(from + (to - from) * (1 - (1 - k) ** 3));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function hap(app, kind = 'light') {
  const t = app?.tg;
  if (!t) return;
  try {
    const note = kind === 'success' || kind === 'error' || kind === 'warning';
    if (note && typeof t.notify === 'function') return t.notify(kind);
    if (!note && typeof t.tap === 'function') return t.tap(kind);
    if (typeof t.haptic === 'function') return t.haptic(kind);
    const hf = t.webApp?.HapticFeedback || t.WebApp?.HapticFeedback || window.Telegram?.WebApp?.HapticFeedback;
    if (hf) note ? hf.notificationOccurred(kind) : hf.impactOccurred(kind);
  } catch (e) { /* без вібро */ }
}
function anim(node, frames, opts) {
  if (!node?.animate) return Promise.resolve();
  const o = typeof opts === 'number' ? { duration: opts } : { ...opts };
  if (reduced()) o.duration = Math.min(o.duration || 300, 120);
  try { return node.animate(frames, { easing: 'ease-out', fill: 'none', ...o }).finished.catch(() => {}); } catch (e) { return Promise.resolve(); }
}
// Лумі: через app.makeLumi (ядро), інакше напряму з lumi.js
function makeLumi(app, container, size, emotion) {
  try {
    if (typeof app?.makeLumi === 'function') return app.makeLumi(container, { size, emotion, global: false });
    if (typeof L.createLumi === 'function') { const l = L.createLumi(container, { size, emotion }); l?.set?.(emotion); return l; }
  } catch (e) { console.warn('lumi', e); }
  return null;
}
// Екран режиму займає весь .screen (власна шапка замість спільної topbar)
export const meta = { topbar: false };
function mountHost(root, app) {
  root.classList.add('m-host');
  return !!app?.tg?.isTelegram; // у Telegram — нативна BackButton
}
const sleep = (ms) => new Promise((r) => setTimeout(r, reduced() ? Math.min(ms, 80) : ms));
function flyLayer() {
  let f = document.querySelector('.m-flylayer');
  if (!f) { f = el('div', 'm-flylayer'); document.body.append(f); }
  return f;
}
async function fly(node, a, b, { ms = 600, arc = -60, rot0 = 0, rot1 = 0, s0 = 1, s1 = 1 } = {}) {
  const layer = flyLayer();
  layer.append(node);
  node.style.left = a.left + 'px';
  node.style.top = a.top + 'px';
  node.style.width = a.width + 'px';
  node.style.height = a.height + 'px';
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  await anim(node, [
    { transform: `translate(0,0) rotate(${rot0}deg) scale(${s0})` },
    { transform: `translate(${dx * 0.5}px, ${dy * 0.5 + arc}px) rotate(${(rot0 + rot1) / 2}deg) scale(${(s0 + s1) / 2 * 1.1})`, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) rotate(${rot1}deg) scale(${s1})` },
  ], { duration: ms, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' });
  node.remove();
}

// ---------------------------------------------------------------- правила (dragons.py)
export const FOOD_COST = 10;
export const FEED_GROWTH = 10;
export const STAGES = [['egg', 0, 'Яйце 🥚'], ['baby', 30, 'Малюк'], ['teen', 100, 'Підліток'],
  ['adult', 250, 'Дорослий'], ['legend', 500, 'Легенда ✨']];
export const ELEMENTS = { sun: 'Вогник', forest: 'Мох', clock: 'Тік-Так', crystal: 'Іскра', sky: 'Зорян' };
export const ELEMENT_EMOJI = { sun: '☀️', forest: '🌿', clock: '⏰', crystal: '💎', sky: '🌌' };
const UNLOCK_HINT = new Proxy({}, { get: (_, k) => t('dr.unlock.' + String(k)) });
const NAME = (elx) => t('el.' + elx);
const SLABEL = (code) => t('stage.' + code);
const ELEMENT_COLOR = { sun: '#ffb347', forest: '#6fcf7f', clock: '#d9a066', crystal: '#7fd3ff', sky: '#9f8cff' };
export function stageOf(g) {
  let cur = STAGES[0];
  for (const s of STAGES) if (g >= s[1]) cur = s;
  return [cur[0], cur[1], SLABEL(cur[0])];
}
const isNat = (v) => Number.isInteger(v) && v >= 0;
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Силует для закритого дракона: заливка фону від країв (до темної обвідки) -> прозоро, решта -> темна
const silCache = {};
function silhouette(src) {
  if (silCache[src]) return silCache[src];
  silCache[src] = new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      try {
        const N = 160;
        const c = document.createElement('canvas');
        c.width = N; c.height = N;
        const x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(im, 0, 0, N, N);
        const d = x.getImageData(0, 0, N, N);
        const p = d.data;
        // ріст області від країв: крок дозволено, якщо сусідній піксель схожий за кольором (фон — плавний градієнт);
        // поріг зменшуємо, доки силует не вийде правдоподібним (12–70% площі)
        const grow = (T) => {
          const seen = new Uint8Array(N * N);
          const near = (a, b) => Math.abs(p[a * 4] - p[b * 4]) + Math.abs(p[a * 4 + 1] - p[b * 4 + 1]) + Math.abs(p[a * 4 + 2] - p[b * 4 + 2]) < T;
          const stack = [];
          for (let k = 0; k < N; k++) stack.push(k, -1, (N - 1) * N + k, -1, k * N, -1, k * N + N - 1, -1);
          while (stack.length) {
            const from = stack.pop(); const i = stack.pop();
            if (seen[i] || (from >= 0 && !near(i, from))) continue;
            seen[i] = 1;
            const cx = i % N; const cy = (i / N) | 0;
            if (cx > 0) stack.push(i - 1, i);
            if (cx < N - 1) stack.push(i + 1, i);
            if (cy > 0) stack.push(i - N, i);
            if (cy < N - 1) stack.push(i + N, i);
          }
          let filled = 0;
          for (let i = 0; i < N * N; i++) filled += seen[i];
          return { seen, frac: 1 - filled / (N * N) };
        };
        let best = null;
        for (const T of [48, 32, 22, 14]) {
          const r = grow(T);
          if (!best || Math.abs(r.frac - 0.3) < Math.abs(best.frac - 0.3)) best = r;
          if (r.frac > 0.12 && r.frac < 0.7) { best = r; break; }
        }
        const seen = best.seen;
        // прибрати дрібні «зірочки»/відблиски фону
        for (let pass = 0; pass < 3; pass++) {
          const nx = seen.slice();
          for (let cy = 1; cy < N - 1; cy++) for (let cx = 1; cx < N - 1; cx++) {
            const i = cy * N + cx;
            if (seen[i]) continue;
            let f = 0;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) f += seen[i + dy * N + dx];
            if (f >= 5) nx[i] = 1;
          }
          seen.set(nx);
        }
        for (let i = 0; i < N * N; i++) {
          if (seen[i]) { p[i * 4 + 3] = 0; } else { p[i * 4] = 74; p[i * 4 + 1] = 58; p[i * 4 + 2] = 102; p[i * 4 + 3] = 255; }
        }
        x.putImageData(d, 0, 0);
        resolve(c.toDataURL());
      } catch (e) { resolve(null); }
    };
    im.onerror = () => resolve(null);
    im.src = src;
  });
  return silCache[src];
}

function ensureDragons(st) {
  if (!st.dragons || typeof st.dragons !== 'object') st.dragons = { sun: 0 };
  if (!('sun' in st.dragons)) st.dragons.sun = 0;
  if (!isNat(st.food)) st.food = 0;
  if (!(st.active_dragon in st.dragons)) st.active_dragon = 'sun';
}

// ---------------------------------------------------------------- екран
export function render(root, params, app) {
  ensureCss(root);
  const inTg = mountHost(root, app);
  const st = app.state;
  ensureDragons(st);
  let alive = true;
  let busy = false;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms));

  const scr = el('div', 'm-screen m-dragons');
  root.append(scr);
  scr.innerHTML = `
    <div class="m-dr-bgstars" aria-hidden="true">${'<i></i>'.repeat(10)}</div>
    <header class="m-head">
      <button class="m-back" aria-label="${esc(t('common.back'))}" data-sfx="back"${inTg ? ' hidden' : ''}>‹</button>
      <div class="m-title">${esc(t('dr.title'))}</div>
      <div class="m-chip m-dr-food">🍀 <b>${st.food}</b></div>
    </header>
    <div class="m-dr-hero">
      <div class="m-dr-halo"></div>
      <div class="m-dr-pet" role="button" aria-label="${esc(t('dr.pet'))}">
        <div class="m-dr-body"><img alt="" draggable="false"></div>
        <svg class="m-dr-cracks" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M50 28 L46 38 L54 44 L47 52 L55 60" />
          <path d="M38 46 L44 50 L40 58" />
          <path d="M62 40 L57 47 L63 53" />
        </svg>
      </div>
      <div class="m-dr-shadow"></div>
    </div>
    <div class="m-dr-info">
      <div class="m-dr-name"></div>
      <div class="m-dr-stage"></div>
      <div class="m-dr-grow"><div class="m-dr-growbar"><i></i></div><div class="m-dr-growtxt"></div></div>
    </div>
    <div class="m-dr-note" aria-live="polite"></div>
    <button class="m-btn m-btn-alt m-btn-big m-dr-feed" data-sfx="none">${esc(t('dr.feed', { n: FOOD_COST }))}</button>
    <p class="m-dr-hintline">${esc(t('dr.hint'))}</p>
    <h3 class="m-dr-colh">${esc(t('dr.mine'))}</h3>
    <div class="m-dr-grid"></div>`;

  const $ = (q) => scr.querySelector(q);
  const pet = $('.m-dr-pet');
  const body = $('.m-dr-body');
  const img = $('.m-dr-body img');
  const foodEl = $('.m-dr-food b');
  const nameEl = $('.m-dr-name');
  const stageEl = $('.m-dr-stage');
  const barI = $('.m-dr-growbar i');
  const growTxt = $('.m-dr-growtxt');
  const noteEl = $('.m-dr-note');
  const feedBtn = $('.m-dr-feed');
  const grid = $('.m-dr-grid');
  const hero = $('.m-dr-hero');
  $('.m-back').onclick = () => { hap(app); app.back(); };

  const imgOf = (elx, g) => asset(`dragon/${elx}_${stageOf(g)[0]}.png`);
  const progress = (g) => {
    const nxt = STAGES.find((s) => s[1] > g);
    if (!nxt) return { pct: 100, txt: t('dr.top', { g }) };
    const prev = stageOf(g)[1];
    const span = nxt[1] - prev;
    return { pct: span ? (100 * (g - prev)) / span : 100, txt: t('dr.to', { g, need: nxt[1], stage: SLABEL(nxt[0]) }) };
  };

  function paint({ animateBar = false } = {}) {
    const elx = st.active_dragon;
    const g = st.dragons[elx] || 0;
    const [code, , sname] = stageOf(g);
    scr.style.setProperty('--dr-color', ELEMENT_COLOR[elx]);
    pet.dataset.stage = code;
    if (!img.src || img.dataset.key !== `${elx}_${code}`) {
      img.src = imgOf(elx, g);
      img.dataset.key = `${elx}_${code}`;
    }
    nameEl.textContent = `${ELEMENT_EMOJI[elx]} ${NAME(elx)}`;
    stageEl.textContent = sname;
    const p = progress(g);
    barI.style.transition = animateBar ? '' : 'none';
    barI.style.transform = `scaleX(${p.pct / 100})`;
    if (!animateBar) { void barI.offsetWidth; barI.style.transition = ''; }
    growTxt.textContent = t('dr.grow', { txt: p.txt });
    foodEl.textContent = st.food;
    feedBtn.classList.toggle('m-dr-poor', st.food < FOOD_COST);
    paintGrid();
  }

  function paintGrid() {
    grid.innerHTML = '';
    for (const elx of Object.keys(ELEMENTS)) {
      const owned = elx in st.dragons;
      const g = st.dragons[elx] || 0;
      const active = elx === st.active_dragon;
      const c = el('button', `m-dr-cell${owned ? '' : ' locked'}${active ? ' active' : ''}`);
      c.style.setProperty('--cc', ELEMENT_COLOR[elx]);
      c.dataset.el = elx;
      c.innerHTML = `<span class="m-dr-thumb"><img src="${owned ? imgOf(elx, g) : BLANK}" alt="" draggable="false"></span>
        <span class="m-dr-cname">${owned ? `${ELEMENT_EMOJI[elx]} ${esc(NAME(elx))}` : '🔒 ???'}</span>
        <span class="m-dr-cstage">${owned ? esc(stageOf(g)[2]) : esc(UNLOCK_HINT[elx])}</span>
        ${active ? '<span class="m-dr-check">✅</span>' : ''}`;
      c.onclick = () => select(elx, c);
      if (!owned) {
        const im = c.querySelector('.m-dr-thumb img');
        // силует рахуємо з окремого Image; у <img> одразу не ставимо яйце (інакше «спойлер» і обірваний запит)
        silhouette(asset(`dragon/${elx}_egg.png`)).then((url) => { if (im.isConnected) { im.src = url || asset(`dragon/${elx}_egg.png`); im.classList.add('sil'); } });
      }
      grid.append(c);
    }
  }

  function note(txt, kind = '') {
    noteEl.className = 'm-dr-note show ' + kind;
    noteEl.textContent = txt;
    anim(noteEl, [{ opacity: 0, transform: 'translateY(-6px) scale(.96)' }, { opacity: 1, transform: 'none' }], 260);
  }

  function select(elx, cell) {
    if (busy) return;
    if (!(elx in st.dragons)) {
      hap(app, 'warning');
      fx('shake', cell);
      app.audio?.sfx?.('wrong');
      note(t('dr.earn', { hint: UNLOCK_HINT[elx] }));
      return;
    }
    hap(app);
    if (elx === st.active_dragon) { tapPet(); return; }
    st.active_dragon = elx;
    app.save?.();
    anim(body, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.4) rotate(-20deg)', opacity: 0 }], 200).then(() => {
      if (!alive) return;
      paint();
      anim(body, [{ transform: 'scale(.4) rotate(20deg)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }], { duration: 420 });
      app.audio?.sfx?.('pop');
      note(t('dr.withYou', { name: NAME(elx) }));
    });
    scr.scrollTo?.({ top: 0, behavior: 'smooth' });
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  // тап — підстрибує з сердечками
  let tapN = 0;
  function tapPet() {
    if (busy) return;
    hap(app);
    tapN += 1;
    pet.classList.remove('m-dr-jump'); void pet.offsetWidth; pet.classList.add('m-dr-jump');
    hearts(pet, 5);
    if (tapN % 4 === 0) {
      const code = stageOf(st.dragons[st.active_dragon] || 0)[0];
      app.audio?.sfx?.('heart');
      note(code === 'egg' ? t('dr.eggWarm') : t('dr.purr', { name: NAME(st.active_dragon) }));
    }
  }
  pet.addEventListener('click', tapPet);

  function hearts(target, count) {
    if (reduced()) return;
    const r = target.getBoundingClientRect();
    for (let k = 0; k < count; k++) {
      const h = el('div', 'm-fly-heart', ['💚', '💖', '✨', '💛'][k % 4]);
      h.style.left = r.left + r.width * (0.25 + Math.random() * 0.5) + 'px';
      h.style.top = r.top + r.height * 0.35 + 'px';
      h.style.setProperty('--dx', `${(Math.random() - 0.5) * 140}px`);
      h.style.animationDelay = `${k * 60}ms`;
      document.body.append(h);
      setTimeout(() => h.remove(), 1700);
    }
  }

  // годування (feed з dragons.py)
  feedBtn.addEventListener('click', async () => {
    if (busy) return;
    if (st.food < FOOD_COST) {
      hap(app, 'warning');
      fx('shake', feedBtn);
      app.audio?.sfx?.('wrong');
      note(t('dr.noFood', { n: FOOD_COST }), 'warn');
      return;
    }
    busy = true;
    hap(app, 'medium');
    app.audio?.sfx?.('coin');
    const elx = st.active_dragon;
    const g0 = st.dragons[elx];
    const before = stageOf(g0)[0];
    const food0 = st.food;
    let after;
    if (typeof S.feedDragon === 'function') {
      after = S.feedDragon(st).after;
    } else {
      st.food -= FOOD_COST;
      st.dragons[elx] += FEED_GROWTH;
      after = stageOf(st.dragons[elx]);
    }
    app.save?.();
    countUp(foodEl, food0, st.food, 450);

    // їжа летить у дракона
    const fb = feedBtn.getBoundingClientRect();
    const tgt = body.getBoundingClientRect();
    const target = { left: tgt.left + tgt.width * 0.35, top: tgt.top + tgt.height * 0.4, width: tgt.width * 0.3, height: tgt.height * 0.2 };
    const items = ['🍖', '🍀', '🍖'];
    await Promise.all(items.map((it, k) => sleep(k * 110).then(() => fly(el('div', 'm-dr-food-fly', it),
      { left: fb.left + fb.width / 2 - 22 + (k - 1) * 30, top: fb.top, width: 44, height: 44 }, target,
      { ms: 620, arc: -90, rot0: -20, rot1: 30, s0: 1, s1: 0.5 }))));
    if (!alive) return;
    pet.classList.remove('m-dr-chomp'); void pet.offsetWidth; pet.classList.add('m-dr-chomp');
    floatText(pet, `+${FEED_GROWTH} 🌱`, 'm-float-gold');

    if (after[0] !== before) {
      // нова стадія: ріст до 100%, тремтіння, (тріщини), спалах, нова картинка
      barI.style.transform = 'scaleX(1)';
      await sleep(350);
      pet.classList.add('m-dr-evolve');
      if (before === 'egg') pet.classList.add('m-dr-cracking');
      hap(app, 'heavy');
      await sleep(1300);
      if (!alive) return;
      const flashEl = el('div', 'm-dr-flash');
      hero.append(flashEl);
      fx('flash', '#fff');
      await sleep(260);
      if (!alive) return;
      pet.classList.remove('m-dr-evolve', 'm-dr-cracking');
      paint();
      if (before === 'egg') shards(pet);
      anim(body, [{ transform: 'scale(.3)', filter: 'brightness(3)' }, { transform: 'scale(1.18)', filter: 'brightness(1.4)', offset: 0.6 }, { transform: 'none', filter: 'none' }], { duration: 650, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      setTimeout(() => flashEl.remove(), 900);
      fx('confetti');
      app.audio?.sfx?.('levelup');
      app.audio?.sfx?.('win');
      hap(app, 'success');
      hearts(pet, 8);
      note(before === 'egg'
        ? t('dr.crack', { name: NAME(elx), stage: after[2] })
        : t('dr.stageUp', { name: NAME(elx), stage: after[2] }), 'big');
    } else {
      paint({ animateBar: true });
      app.audio?.sfx?.('pop');
      note(t('dr.yum', { n: FEED_GROWTH }));
    }
    busy = false;
  });

  function shards(target) {
    if (reduced()) return;
    const r = target.getBoundingClientRect();
    for (let k = 0; k < 8; k++) {
      const s = el('div', 'm-dr-shard');
      s.style.left = r.left + r.width / 2 + 'px';
      s.style.top = r.top + r.height * 0.55 + 'px';
      const ang = (Math.PI * 2 * k) / 8;
      s.style.setProperty('--sx', `${Math.cos(ang) * 120}px`);
      s.style.setProperty('--sy', `${Math.sin(ang) * 90 - 40}px`);
      s.style.setProperty('--sr', `${(Math.random() - 0.5) * 540}deg`);
      document.body.append(s);
      setTimeout(() => s.remove(), 1100);
    }
  }

  // кліпання: випадковий «мерехт» (сквош картинки)
  (function blinkLoop() {
    later(() => {
      if (!busy) { body.classList.remove('m-dr-blink'); void body.offsetWidth; body.classList.add('m-dr-blink'); }
      blinkLoop();
    }, 2200 + Math.random() * 3000);
  }());

  paint();
  if (st.food >= FOOD_COST) { const nf = Math.floor(st.food / FOOD_COST); note(t('dr.enough', { n: nf, feeds: t('plural.feeds', { n: nf }) })); }

  return () => {
    alive = false;
    timers.forEach(clearTimeout);
    document.querySelectorAll('.m-flylayer > *, .m-dr-shard').forEach((x) => x.remove());
  };
}
