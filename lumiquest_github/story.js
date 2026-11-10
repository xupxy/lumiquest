// 💌 Історії — візуальна новела з виборами. Порт game/story.py.
import * as S from './state.js';
import * as FX from './fx.js';
import * as L from './lumi.js';
import { recordGame } from './games.js';

// ---------------------------------------------------------------- спільні дрібниці режимів
const CSS_HREF = new URL('./modes.css', import.meta.url).href;
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

// ---------------------------------------------------------------- правила (як у story.py)
const XP_PER_HEART = 5;
export function storyEndingKind(hearts, n) {
  if (hearts >= n - 1) return 'good';
  if (hearts >= Math.floor((n + 1) / 2)) return 'ok';
  return 'bad';
}

const addXP = (st, n) => (typeof S.addXP === 'function' ? S.addXP(st, n) : (st.xp = (st.xp || 0) + n));
function onCorrect(st) {
  if (typeof S.onCorrectAnswer === 'function') return S.onCorrectAnswer(st);
  st.fireflies = (st.fireflies || 0) + 1;
  if (typeof S.addFood === 'function') S.addFood(st, 1); else st.food = (st.food || 0) + 1;
}

// Типограф: друкує текст, тап — допечатати миттєво
function typewriter(node, text, speed = 26) {
  let i = 0; let timer = null; let resolve;
  const done = new Promise((r) => { resolve = r; });
  const chars = Array.from(String(text));
  node.textContent = '';
  node.classList.add('typing');
  const finish = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    node.textContent = chars.join('');
    node.classList.remove('typing');
    resolve();
  };
  const tick = () => {
    i += 1;
    node.textContent = chars.slice(0, i).join('');
    if (i >= chars.length) return finish();
    const ch = chars[i - 1];
    timer = setTimeout(tick, /[.!?…]/.test(ch) ? speed * 6 : /[,;:]/.test(ch) ? speed * 3 : speed);
  };
  if (reduced() || !chars.length) finish(); else timer = setTimeout(tick, speed);
  return { done, finish, get typing() { return timer !== null; } };
}

// ---------------------------------------------------------------- екран
export function render(root, params, app) {
  ensureCss(root);
  const inTg = mountHost(root, app);
  const st = app.state;
  const wid = params?.wid;
  const world = (app.content?.WORLDS || []).find((w) => w.id === wid);
  const s = world?.story;
  let alive = true;
  let tw = null;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms));

  const scr = el('div', `m-screen m-story m-bg-${esc(wid || 'w1')}`);
  root.append(scr);

  if (!s || !Array.isArray(s.scenes) || !s.scenes.length || !(st.unlocked || []).includes(wid)) {
    scr.innerHTML = `<div class="m-locked"><div class="m-locked-ico">🔒</div>
      <p>Цей світ ще спить. Переможи боса попереднього світу!</p>
      <button class="m-btn" data-a="map">🗺 Карта</button></div>`;
    scr.querySelector('[data-a=map]').onclick = () => app.go('map');
    return () => { alive = false; };
  }

  const n = s.scenes.length;
  const cast = s.cast || '';
  const run = { i: 0, hearts: 0, good: 0, stage: 'intro' };

  scr.innerHTML = `
    <div class="m-st-sky" aria-hidden="true">${'<i></i>'.repeat(9)}</div>
    <header class="m-head">
      <button class="m-back" aria-label="Назад"${inTg ? ' hidden' : ''}>‹</button>
      <div class="m-title">${esc(s.emoji || '💌')} ${esc(s.title || 'Історія')}</div>
      <div class="m-st-count"></div>
    </header>
    <div class="m-st-hearts" aria-label="Симпатія"></div>
    <div class="m-st-stage">
      <div class="m-st-glow"></div>
      <div class="m-st-portrait"><img alt="${esc(cast)}" src="${asset(`story/${wid}.png`)}" draggable="false"></div>
    </div>
    <div class="m-st-box" role="button" tabindex="0">
      <div class="m-st-speaker"><span></span><button class="m-st-hintbtn" aria-label="Переклад">🇺🇦</button></div>
      <div class="m-st-line"></div>
      <div class="m-st-hint"></div>
      <div class="m-st-more">▼</div>
    </div>
    <div class="m-st-choices"></div>`;

  const $ = (q) => scr.querySelector(q);
  const heartsEl = $('.m-st-hearts');
  const countEl = $('.m-st-count');
  const portrait = $('.m-st-portrait');
  const box = $('.m-st-box');
  const speaker = $('.m-st-speaker span');
  const hintBtn = $('.m-st-hintbtn');
  const lineEl = $('.m-st-line');
  const hintEl = $('.m-st-hint');
  const choicesEl = $('.m-st-choices');
  $('.m-back').onclick = () => { hap(app); app.back(); };

  for (let k = 0; k < n; k++) heartsEl.append(el('span', 'm-heart', '🤍'));
  const heartNodes = [...heartsEl.children];
  const paintHearts = () => heartNodes.forEach((h, k) => {
    const on = k < run.hearts;
    h.classList.toggle('on', on);
    h.textContent = on ? '💗' : '🤍';
  });
  const paintCount = () => {
    countEl.innerHTML = run.stage === 'intro' ? '' :
      `<span>Сцена ${Math.min(run.i + 1, n)}/${n}</span><span class="m-dots">${
        Array.from({ length: n }, (_, k) => `<b class="${k < run.i ? 'done' : k === run.i ? 'cur' : ''}"></b>`).join('')}</span>`;
  };

  const say = (who, text, { italic = false, hint = '' } = {}) => {
    speaker.textContent = who;
    lineEl.classList.toggle('narr', italic);
    hintEl.textContent = hint;
    hintEl.classList.remove('show');
    hintBtn.hidden = !hint;
    box.classList.add('typing');
    anim(box, [{ transform: 'translateY(6px)', opacity: 0.6 }, { transform: 'none', opacity: 1 }], 220);
    tw = typewriter(lineEl, text);
    tw.done.then(() => box.classList.remove('typing'));
    return tw.done;
  };
  box.addEventListener('click', (e) => {
    if (e.target === hintBtn) return;
    if (tw?.typing) tw.finish();
  });
  hintBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hap(app);
    hintEl.classList.toggle('show');
  });

  const react = (kind) => {
    portrait.classList.remove('m-react-good', 'm-react-bad');
    void portrait.offsetWidth;
    portrait.classList.add(kind === 'good' ? 'm-react-good' : 'm-react-bad');
  };

  // ------------------------------------------------ intro
  function showIntro() {
    run.stage = 'intro';
    paintCount(); paintHearts();
    say('📖', s.intro || '', { italic: true });
    choicesEl.innerHTML = `<p class="m-st-tip">Обирай відповіді англійською. Доречна і правильна — 💗 Симпатія росте!</p>`;
    const b = el('button', 'm-btn m-btn-big m-st-go', '💬 Почати');
    b.onclick = () => { hap(app); if (tw?.typing) tw.finish(); showScene(); };
    choicesEl.append(b);
    anim(choicesEl, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], 400);
  }

  // ------------------------------------------------ scene
  async function showScene() {
    run.stage = 'scene';
    paintCount();
    const sc = s.scenes[run.i];
    choicesEl.innerHTML = '';
    anim(portrait, [{ transform: 'scale(.94)', opacity: 0.6 }, { transform: 'none', opacity: 1 }], 350);
    await say(cast, sc.line || '', { hint: sc.hint || '' });
    if (!alive || run.stage !== 'scene') return;
    (sc.choices || []).forEach((c, k) => {
      const b = el('button', 'm-choice', esc(c.text || '…'));
      b.style.animationDelay = `${k * 90}ms`;
      b.onclick = () => pick(k, b);
      choicesEl.append(b);
    });
  }

  function pick(k, btn) {
    if (run.stage !== 'scene') return;
    if (tw?.typing) tw.finish();
    run.stage = 'feedback';
    const sc = s.scenes[run.i];
    const choices = sc.choices || [];
    const ch = choices[k];
    if (!ch) return;
    const btns = [...choicesEl.querySelectorAll('.m-choice')];
    btns.forEach((b, j) => {
      b.disabled = true;
      if (j !== k) b.classList.add(choices[j]?.good && !ch.good ? 'right' : 'dim');
    });
    let head;
    if (ch.good) {
      run.hearts = Math.min(n, run.hearts + 1);
      run.good += 1;
      onCorrect(st);
      btn.classList.add('ok');
      hap(app, 'success');
      react('good');
      const h = heartNodes[run.hearts - 1];
      paintHearts();
      if (h) {
        h.classList.add('m-heart-pop');
        setTimeout(() => h.classList.remove('m-heart-pop'), 700);
        fx('sparkle', h);
      }
      floatText(portrait, '+1 💗', 'm-float-pink');
      spawnHearts(portrait, 6);
      head = `<div class="m-fb-head good">💗 <b>+1 Симпатія!</b></div>`;
    } else {
      const lostIdx = run.hearts - 1;
      run.hearts = Math.max(0, run.hearts - 1);
      btn.classList.add('bad');
      fx('shake', btn);
      hap(app, 'error');
      react('bad');
      if (lostIdx >= 0) {
        const h = heartNodes[lostIdx];
        h.textContent = '💔';
        h.classList.add('m-heart-crack');
        setTimeout(() => { if (!alive) return; h.classList.remove('m-heart-crack'); paintHearts(); }, 750);
      } else {
        anim(heartsEl, [{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'none' }], 300);
      }
      const good = choices.find((c) => c.good)?.text || '';
      head = `<div class="m-fb-head bad">💔 <b>Симпатія −1</b></div>` +
        (good ? `<div class="m-fb-better">Краще було: <b>${esc(good)}</b></div>` : '');
      if (sc.explain) head += `<div class="m-fb-explain">💡 ${esc(sc.explain)}</div>`;
    }
    app.save?.();
    const last = run.i + 1 >= n;
    setTimeout(() => {
      if (!alive) return;
      say('🎬', ch.reaction || '', { italic: true });
      const fb = el('div', 'm-st-fb ' + (ch.good ? 'good' : 'bad'), head);
      const next = el('button', 'm-btn m-btn-big', last ? '✨ Фінал' : '➡️ Далі');
      next.onclick = () => {
        hap(app);
        if (tw?.typing) tw.finish();
        if (last) finish();
        else { run.i += 1; showScene(); }
      };
      fb.append(next);
      choicesEl.innerHTML = '';
      choicesEl.append(fb);
      anim(fb, [{ opacity: 0, transform: 'translateY(18px) scale(.97)' }, { opacity: 1, transform: 'none' }], 380);
    }, 650);
  }

  function spawnHearts(target, count) {
    if (reduced()) return;
    const r = target.getBoundingClientRect();
    for (let k = 0; k < count; k++) {
      const hEl = el('div', 'm-fly-heart', ['💗', '💖', '💕'][k % 3]);
      hEl.style.left = r.left + r.width * (0.2 + Math.random() * 0.6) + 'px';
      hEl.style.top = r.top + r.height * 0.55 + 'px';
      hEl.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`);
      hEl.style.animationDelay = `${k * 70}ms`;
      document.body.append(hEl);
      setTimeout(() => hEl.remove(), 1700);
    }
  }

  // ------------------------------------------------ ending (нагороди — як _story_finish)
  function finish() {
    run.stage = 'end';
    run.i = n;
    paintCount();
    const h = run.hearts;
    const kind = storyEndingKind(h, n);
    let xp; let badge;
    if (typeof S.finishStory === 'function') {
      const res = S.finishStory(st, wid, h, n);
      xp = res.xp; badge = !!res.badge;
    } else {
      xp = h * XP_PER_HEART;
      if (xp) addXP(st, xp);
      st.story_best = st.story_best || {};
      st.story_best[wid] = Math.max(st.story_best[wid] || 0, h);
      st.story_badges = st.story_badges || [];
      badge = kind === 'good' && !st.story_badges.includes(wid);
      if (badge) st.story_badges.push(wid);
    }
    // зірки рівня на стежці світу: good 3 / ok 2 / bad 1 (будь-яке завершення відкриває наступний рівень)
    recordGame(st, `${wid}-story`, { good: 3, ok: 2, bad: 1 }[kind] || 1);
    app.save?.();

    const title = { good: 'Чудова кінцівка!', ok: 'Непогана кінцівка', bad: 'Сумна кінцівка' }[kind];
    const big = { good: '💞', ok: '🌤', bad: '🥀' }[kind];
    const emo = { good: 'proud', ok: 'happy', bad: 'sad' }[kind];
    const ov = el('div', `m-overlay m-st-end ${kind}`);
    ov.innerHTML = `
      <div class="m-end-fx" aria-hidden="true">${kind === 'bad' ? '<i></i>'.repeat(14) : '<i></i>'.repeat(12)}</div>
      <div class="m-end-card">
        <div class="m-end-big">${big}</div>
        <h2>${title}</h2>
        <div class="m-end-portrait"><img src="${asset(`story/${wid}.png`)}" alt=""></div>
        <p class="m-end-text">${esc(s.endings?.[kind] || '')}</p>
        <div class="m-end-hearts">${Array.from({ length: n }, (_, k) => `<span class="${k < h ? 'on' : ''}" style="animation-delay:${400 + k * 160}ms">${k < h ? '💗' : '🤍'}</span>`).join('')}
          <small>(${h}/${n})</small></div>
        <div class="m-end-xp">+<b>0</b> XP</div>
        ${badge ? `<div class="m-end-badge">🏅 Новий бейдж: 💌 ${esc(cast)}!</div>` : ''}
        ${kind !== 'good' ? '<p class="m-end-tip">Спробуй ще раз — може, вийде найкраща кінцівка? 💌</p>' : ''}
        <div class="m-end-lumi"></div>
        <div class="m-end-btns">
          <button class="m-btn" data-a="again">🔁 Ще раз</button>
          <button class="m-btn m-btn-alt" data-a="world">🌍 До світу</button>
        </div>
      </div>`;
    scr.append(ov);
    hap(app, kind === 'bad' ? 'warning' : 'success');
    later(() => countUp(ov.querySelector('.m-end-xp b'), 0, xp, 900), 400 + n * 160);
    if (kind === 'good') later(() => fx('confetti'), 500);
    lumiRef = makeLumi(app, ov.querySelector('.m-end-lumi'), 84, emo);
    later(() => lumiRef?.say?.({ good: 'Ти чарівний співрозмовник! 💞', ok: 'Непогано! Ще трохи — і буде 💞', bad: 'Нічого, спробуємо ще раз! 💛' }[kind]), 900);
    ov.querySelector('[data-a=again]').onclick = () => {
      hap(app);
      lumiRef?.destroy?.(); lumiRef = null;
      ov.remove();
      run.i = 0; run.hearts = 0; run.good = 0;
      showIntro();
    };
    ov.querySelector('[data-a=world]').onclick = () => { hap(app); app.back(); }; // історію відкривають зі світу
  }
  let lumiRef = null;

  showIntro();

  return () => {
    alive = false;
    if (tw?.typing) tw.finish();
    timers.forEach(clearTimeout);
    try { lumiRef?.destroy?.(); } catch (e) { /* */ }
    document.querySelectorAll('.m-fly-heart').forEach((x) => x.remove());
  };
}
