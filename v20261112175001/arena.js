// ⚔️ Бос-екзамен як карткова битва на арені. Порт game/arena.py + boss-run з engine.py.
import * as S from './state.js?v=20261112175001';
import { tr, tc, sfx, starSfx } from './i18n_modes.js?v=20261112175001';
import * as FX from './fx.js?v=20261112175001';
import * as UI from './ui.js?v=20261112175001';
import * as L from './lumi.js?v=20261112175001';
import { recordGame } from './games.js?v=20261112175001';
import { createCharacter } from './characters.js?v=20261112175001';
// v17 «соковитість»: спільний мікро-набір (лише transform/opacity, WAAPI; стилі .jx-* — у css/games3.css)
const JX = (() => {
  const de = document.documentElement;
  const lite = () => de.dataset.perf === 'lite';
  const red = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // composite:'add' (не ламає власний transform елемента) лише коли він є — інакше анімація йде на компоситорі
  const anim = (el, kf, o) => {
    try {
      if (!el || !el.animate || red()) return null;
      const own = el.style.transform || el.getAnimations?.().length || getComputedStyle(el).transform !== 'none';
      return el.animate(kf, own ? { composite: 'add', ...o } : o);
    } catch (e) { return null; }
  };
  const css = () => {
    if (document.querySelector('link[data-games3-css]')) return;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.games3Css = '1';
    l.href = new URL('./games3.css?v=20261112175001', import.meta.url).href;
    l.addEventListener('load', () => { l.dataset.ready = '1'; }, { once: true });
    document.head.append(l);
  };
  const tint = (el, rgb, kf) => { // кольоровий спалах поверх елемента (окремий шар, лише opacity)
    if (!el || red() || !el.getBoundingClientRect) return;
    const r = el.getBoundingClientRect(); if (!r.width) return;
    const d = document.createElement('div');
    d.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;pointer-events:none;z-index:9998;opacity:0;background:rgb(${rgb});border-radius:${getComputedStyle(el).borderRadius}`;
    document.body.appendChild(d);
    const a = d.animate(kf, { duration: 520, easing: 'ease-out' });
    a.onfinish = a.oncancel = () => d.remove();
  };
  return {
    css, lite,
    /** пружинне натискання для всіх кнопок у root; повертає відписку */
    press(root, sel = 'button,[data-jx]') {
      const h = (e) => {
        const b = e.target.closest?.(sel);
        if (!b || b.disabled || !root.contains(b)) return;
        anim(b, [{ transform: 'scale(1)' }, { transform: 'scale(.9)', offset: 0.3 }, { transform: 'scale(1.04)', offset: 0.7 }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' });
      };
      root.addEventListener('pointerdown', h, { passive: true });
      return () => root.removeEventListener('pointerdown', h);
    },
    /** правильно: зелений спалах + підскок + іскри */
    ok(el, n = 8, hop = true) {
      if (!el) return;
      tint(el, '80,215,120', [{ opacity: 0 }, { opacity: 0.5, offset: 0.2 }, { opacity: 0 }]);
      if (hop) anim(el, [{ transform: 'none' }, { transform: 'translateY(-8px) scale(1.08)', offset: 0.35 }, { transform: 'translateY(1px) scale(.97)', offset: 0.7 }, { transform: 'none' }], { duration: 480, easing: 'ease-out' });
      try { if (n) FX.sparkle?.(el, { count: lite() ? Math.min(3, n) : n }); } catch (e) { /* */ }
    },
    /** неправильно: тряска + червоний пульс */
    bad(el, shake = true) {
      if (!el) return;
      tint(el, '240,70,80', [{ opacity: 0 }, { opacity: 0.45, offset: 0.15 }, { opacity: 0.05, offset: 0.45 }, { opacity: 0.35, offset: 0.65 }, { opacity: 0 }]);
      if (shake) anim(el, [{ transform: 'none' }, { transform: 'translateX(-8px) rotate(-1deg)', offset: 0.2 }, { transform: 'translateX(8px) rotate(1deg)', offset: 0.4 }, { transform: 'translateX(-5px)', offset: 0.6 }, { transform: 'translateX(3px)', offset: 0.8 }, { transform: 'none' }], { duration: 420, easing: 'ease-out' });
    },
    /** емоція персонажа: 'joy' — радісний підскок, 'sad' — похнюплене хитання */
    emote(el, kind) {
      if (!el) return;
      if (kind === 'joy') anim(el, [{ transform: 'none' }, { transform: 'translateY(-14px) scale(1.06,.95)', offset: 0.3 }, { transform: 'translateY(0) scale(1.06,.92)', offset: 0.55 }, { transform: 'translateY(-5px)', offset: 0.75 }, { transform: 'none' }], { duration: 620, easing: 'ease-out' });
      else anim(el, [{ transform: 'none' }, { transform: 'translateY(4px) rotate(-6deg)', offset: 0.25 }, { transform: 'translateY(4px) rotate(5deg)', offset: 0.5 }, { transform: 'translateY(2px) rotate(-3deg)', offset: 0.75 }, { transform: 'none' }], { duration: 650, easing: 'ease-in-out' });
    },
    /** нагорода: FX.rewardBurst (якщо є) або «+N XP» */
    xp(el, xp, food) {
      try { if (typeof FX.rewardBurst === 'function') return FX.rewardBurst(el, { xp, food }); FX.floatText?.(el, `+${xp} XP`); } catch (e) { /* */ }
    },
    /** FLIP: плавне переміщення елементів (key = атрибут) після mutate(); src — {key: DOMRect} звідки «прилітають» нові */
    flip(root, sel, key, mutate, src = {}) {
      const old = {};
      if (!red()) root.querySelectorAll(sel).forEach((e) => { const k = e.getAttribute(key); if (k != null && !old[k]) old[k] = e.getBoundingClientRect(); });
      mutate();
      if (red()) return;
      const seen = {};
      root.querySelectorAll(sel).forEach((e) => {
        const k = e.getAttribute(key); if (k == null || seen[k]) return; seen[k] = 1;
        const p = old[k] || src[k]; if (!p) return;
        const n = e.getBoundingClientRect();
        const dx = p.left - n.left, dy = p.top - n.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        anim(e, [{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.2,.9,.3,1.15)' });
      });
    },
    /** стартова картка: поява + підскок іконки */
    intro(box, ico) { box?.classList.add('jx-in'); ico?.classList.add('jx-bob'); },
    /** екран результату: картка, зірки по черзі (звук star), лічильники [data-n], конфеті на 3⭐ */
    result(box, starsEl, n, { later = setTimeout, sfx = () => {} } = {}) {
      box?.classList.add('jx-in');
      if (starsEl) {
        starsEl.textContent = '';
        try { FX.starsDrop?.(starsEl, n, 3); } catch (e) { /* */ }
        for (let i = 0; i < n; i++) later(() => sfx('star'), 420 + i * 260);
      }
      box?.querySelectorAll('[data-n]').forEach((b, k) => later(() => { try { FX.countUp?.(b, 0, +b.dataset.n || 0, 700); } catch (e) { /* */ } }, 450 + k * 120));
      if (n >= 3) later(() => { try { if (lite()) FX.sparkle?.(starsEl || box, { count: 8 }); else FX.confetti?.(); } catch (e) { /* */ } }, 300 + n * 260);
    },
  };
})();

// ---------------------------------------------------------------- спільні дрібниці режимів
const CSS_HREF = new URL('./modes.css?v=20261112175001', import.meta.url).href;
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
// Летить вузол node від прямокутника a до центру прямокутника b (по дузі)
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

// ---------------------------------------------------------------- правила (arena.py)
export const DECK = Array.isArray(S.DECK) && S.DECK.length ? S.DECK : ['🗡 Лицар Дієслово', '🏹 Лучниця Артикль', '🔥 Вогняний Прийменник',
  '🛡 Голем Граматики', '⚡ Блискавка Лексики', '🧙 Маг Часів'];
const CARD_COLORS = ['#7aa7ff', '#ffb35c', '#ff6b6b', '#6fd08c', '#b98cff', '#8f7bff'];
export const TROPHY_WIN = 30;
export const TROPHY_LOSS = 10;
const XP_PER_CORRECT = 10;
const XP_BOSS = 50;
const ARENAS = [[0, "Дерев'яна арена"], [100, "Кам'яна арена"], [250, 'Срібна арена'], [500, 'Золота арена'], [900, 'Зоряна арена']];
export function arenaNameLocal(t) {
  let name = ARENAS[0][1];
  for (const [lim, nm] of ARENAS) if (t >= lim) name = nm;
  return name;
}
const arenaName = (t) => arenaTr(typeof S.arenaName === 'function' ? S.arenaName(t) : arenaNameLocal(t));
// v7: назви карт/арен/драконів — поточною мовою (дані лишаються українськими ключами)
const DECK_UK = ['🗡 Лицар Дієслово', '🏹 Лучниця Артикль', '🔥 Вогняний Прийменник', '🛡 Голем Граматики', '⚡ Блискавка Лексики', '🧙 Маг Часів'];
const cardName = (c) => { const k = DECK_UK.indexOf(c); return k >= 0 ? tr('arena.card' + k) : c; };
function arenaTr(nm) { const k = ARENAS.findIndex((a) => a[1] === nm); return k >= 0 ? tr('arena.arena' + k) : nm; }
export const bossNeed = (n) => Math.max(1, Math.ceil(n * 0.75));
export const bossTowers = (n) => Math.max(1, n - bossNeed(n) + 1);
// драконячі подарунки за босів (dragons.py)
const ELEMENTS = { get sun() { return tr('arena.el_sun'); }, get forest() { return tr('arena.el_forest'); }, get clock() { return tr('arena.el_clock'); }, get crystal() { return tr('arena.el_crystal'); }, get sky() { return tr('arena.el_sky'); } };
const ELEMENT_EMOJI = { sun: '☀️', forest: '🌿', clock: '⏰', crystal: '💎', sky: '🌌' };
const EGG_BY_WORLD = { w2: 'forest', w3: 'clock', w4: 'crystal', w5: 'sky' }; // v11: за id світу, не за індексом
const SUN_BONUS_GROWTH = 30;

const addXP = (st, n) => (typeof S.addXP === 'function' ? S.addXP(st, n) : (st.xp = (st.xp || 0) + n));
function onCorrect(st) {
  if (typeof S.onCorrectAnswer === 'function') return S.onCorrectAnswer(st);
  st.fireflies = (st.fireflies || 0) + 1;
  st.food = (st.food || 0) + 1;
}
function addTrophies(st, n) {
  const before = st.trophies || 0;
  const want = Math.max(0, before + n);
  if (typeof S.addTrophies === 'function') { try { S.addTrophies(st, n); } catch (e) { console.warn(e); } }
  if (st.trophies !== want) st.trophies = want;
}
function giveBadge(st, wid, label) {
  st.badges = st.badges || [];
  if (st.badges.includes(wid)) return false;
  if (typeof S.giveBadge === 'function') { try { S.giveBadge(st, wid, label); } catch (e) { console.warn(e); } }
  if (!st.badges.includes(wid)) st.badges.push(wid);
  return true;
}
function grantDragonForBoss(st, wid) {
  st.dragons = st.dragons || { sun: 0 };
  if (wid === 'w1') {
    if ((st.dragons.sun || 0) < SUN_BONUS_GROWTH) {
      st.dragons.sun = SUN_BONUS_GROWTH;
      return `🐉 ${ELEMENTS.sun} ${tr('arena.hatched')}`;
    }
    return null;
  }
  const elx = EGG_BY_WORLD[wid];
  if (elx && !(elx in st.dragons)) {
    if (typeof S.giveDragon === 'function') { try { S.giveDragon(st, elx); } catch (e) { console.warn(e); } }
    if (!(elx in st.dragons)) st.dragons[elx] = 0;
    return `${tr('arena.egg', { 0: ELEMENT_EMOJI[elx], 1: ELEMENTS[elx] })}`;
  }
  return null;
}
function unlockNext(st, worlds, wi) {
  const nw = worlds[wi + 1];
  if (!nw) return null;
  st.unlocked = st.unlocked || [];
  if (st.unlocked.includes(nw.id)) return null;
  if (typeof S.unlockNext === 'function') { try { S.unlockNext(st, worlds[wi].id); } catch (e) { console.warn(e); } }
  if (!st.unlocked.includes(nw.id)) st.unlocked.push(nw.id);
  const order = worlds.map((w) => w.id);
  st.unlocked = order.filter((id) => st.unlocked.includes(id)).concat(st.unlocked.filter((id) => !order.includes(id)));
  return nw;
}
function correctText(t) {
  if (t.type === 'choice') return String(t.options?.[t.answer] ?? '');
  if (t.type === 'type') {
    if (!t.answers?.length) return '';
    let a = String(t.answers[0]).replace(/\bi\b/g, 'I');
    if (!String(t.q || '').includes('___') && a.split(/\s+/).length >= 3) a = a[0].toUpperCase() + a.slice(1);
    return a;
  }
  return String(t.answer ?? '');
}
function localFinishBoss(st, worlds, wi, win, oldT) {
  if (!win) { const lost = Math.min(TROPHY_LOSS, oldT); addTrophies(st, -lost); return { trophies: -lost }; }
  addTrophies(st, TROPHY_WIN);
  const first = giveBadge(st, worlds[wi].id, worlds[wi].name);
  if (first) addXP(st, XP_BOSS);
  return { trophies: TROPHY_WIN, first, xp: first ? XP_BOSS : 0, gift: grantDragonForBoss(st, worlds[wi].id), unlocked: unlockNext(st, worlds, wi) };
}
const bossOpen = (st, w) => (w.quests || []).length > 0 && w.quests.every((q) => (st.stars?.[q.id] || 0) >= 1);

// ---------------------------------------------------------------- екран
export function render(root, params, app) {
  ensureCss(root);
  const inTg = mountHost(root, app);
  const st = app.state;
  const worlds = /^c\d+$/.test(String(params?.wid || '')) ? (app.content?.COUNTRIES || []) : (app.content?.WORLDS || []);  // v19: країни
  const wid = params?.wid;
  const wi = worlds.findIndex((w) => w.id === wid);
  const w = worlds[wi];
  const boss = w?.boss;
  let alive = true;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms));
  let lumiRef = null;

  const scr = el('div', 'm-screen m-arena');
  root.append(scr);

  const tasks = boss?.tasks || [];
  if (!w || !tasks.length || !(st.unlocked || []).includes(wid) || !bossOpen(st, w)) {
    const why = !w || !(st.unlocked || []).includes(wid) ? tr('arena.lock1') : tr('arena.lock2');
    scr.innerHTML = `<header class="m-head"><button class="m-back" ${tr('common.back_aria')}>‹</button><div class="m-title">${tr('arena.title')}</div></header>
      <div class="m-locked"><div class="m-locked-ico">🏰</div><p>${why}</p>
      <button class="m-btn" data-a="go">${w ? tr('common.to_world') : tr('common.map')}</button></div>`;
    scr.querySelector('.m-back').onclick = () => app.back();
    scr.querySelector('[data-a=go]').onclick = () => (w ? app.go('world', { wid }) : app.go('map'));
    return () => { alive = false; };
  }

  const n = tasks.length;
  const need = bossNeed(n);
  const towers = bossTowers(n);
  const r = { i: 0, correct: 0, mistakes: 0, combo: 0, busy: false, over: false };
  const bEmoji = boss.emoji || '👾';
  const bName = tc(boss, 'name') || tr('arena.boss');

  scr.innerHTML = `
    <header class="m-head">
      <button class="m-back" ${tr('common.back_aria')}${inTg ? ' hidden' : ''}>‹</button>
      <div class="m-title">⚔️ ${esc(arenaName(st.trophies || 0))}</div>
      <div class="m-chip m-ar-trophy">🏆 <b>${st.trophies || 0}</b></div>
    </header>
    <section class="m-ar-field">
      <div class="m-ar-river"></div>
      <div class="m-ar-boss">
        <div class="m-ar-bname"><span>${esc(bEmoji)}</span> ${esc(bName)}</div>
        <div class="m-ar-hp"><div class="m-ar-hpbar">${'<i></i>'.repeat(need)}</div><b class="m-ar-hpnum">${need}/${need}</b></div>
        <div class="m-ar-btower">
          <div class="m-ar-tw red"></div>
          <div class="m-ar-bchar"></div>
        </div>
      </div>
    </section>
    <section class="m-ar-mid">
      <div class="m-ar-turn"></div>
      <div class="m-ar-task"></div>
      <div class="m-ar-fb"></div>
    </section>
    <section class="m-ar-me">
      <div class="m-ar-towers">${Array.from({ length: towers }, () => '<div class="m-ar-ptower"><div class="m-ar-tw blue"></div><span class="m-ar-life">❤️</span></div>').join('')}</div>
      <div class="m-ar-hand"></div>
      <div class="m-ar-elixir"><span>⚡</span><div class="m-ar-elbar">${'<i></i>'.repeat(10)}</div><b class="m-ar-elnum"></b></div>
    </section>`;

  const $ = (q) => scr.querySelector(q);
  const turnEl = $('.m-ar-turn');
  const taskEl = $('.m-ar-task');
  const fbEl = $('.m-ar-fb');
  const btower = $('.m-ar-btower');
  const hpSegs = [...scr.querySelectorAll('.m-ar-hpbar i')];
  const hpNum = $('.m-ar-hpnum');
  const ptowers = [...scr.querySelectorAll('.m-ar-ptower')];
  const handEl = $('.m-ar-hand');
  const elSegs = [...scr.querySelectorAll('.m-ar-elbar i')];
  const elNum = $('.m-ar-elnum');
  $('.m-back').onclick = () => { hap(app); app.back(); };

  // живий бос над вежею (characters.js); idle після реакцій
  const chars = [];
  const mkChar = (box, size, mood) => {
    try { const c = createCharacter(box, `boss_${wid}`, { size, mood }); chars.push(c); return c; } catch (e) { console.warn('boss char', e); return null; }
  };
  const bossCh = mkChar($('.m-ar-bchar'), 118, 'idle');
  let moodT = 0;
  const bossMood = (m, back = 0) => {
    clearTimeout(moodT);
    bossCh?.set(m);
    if (back) moodT = setTimeout(() => { if (alive && !r.over) bossCh?.set('idle'); }, back);
  };

  // рука: 4 карти з колоди (для краси; кидається випадкова карта DECK, як у Python)
  const cardHtml = (name) => {
    const k = DECK.indexOf(name);
    const [emo, ...rest] = name.split(' ');
    return `<div class="m-ar-card" style="--cc:${CARD_COLORS[k] || '#8f7bff'}"><span class="m-ar-card-emo">${emo}</span><span class="m-ar-card-name">${esc(cardName(name).split(' ').slice(1).join(' ') || rest.join(' '))}</span></div>`;
  };
  const shuffled = [...DECK].sort(() => Math.random() - 0.5);
  let hand = shuffled.slice(0, 4);
  let queue = shuffled.slice(4);
  const paintHand = () => {
    handEl.innerHTML = hand.map(cardHtml).join('');
  };
  paintHand();

  const paintStatus = () => {
    const hits = Math.min(need, r.correct);
    hpSegs.forEach((s, k) => s.classList.toggle('gone', k >= need - hits));
    hpNum.textContent = `${need - hits}/${need}`;
    ptowers.forEach((t, k) => t.classList.toggle('ruined', k < r.mistakes));
    const elixir = Math.min(10, 2 + r.i + r.correct);
    elSegs.forEach((s, k) => s.classList.toggle('on', k < elixir));
    elNum.textContent = elixir;
    turnEl.innerHTML = `${tr('arena.turn', { 0: Math.min(r.i + 1, n), 1: n })}${r.combo >= 2 ? `${tr('arena.streak', { 0: r.combo })}` : `${tr('arena.hits_n', { 0: hits, 1: need })}`}`;
  };
  // (вежі руйнуються справа наліво: перша помилка — крайня права)
  ptowers.reverse();

  // ------------------------------------------------ intro
  function intro() {
    paintStatus();
    const ov = el('div', 'm-overlay m-ar-intro');
    ov.innerHTML = `<div class="m-ar-introcard">
      <div class="m-ar-introboss m-ar-introchar"></div>
      <div class="m-ar-vs">VS</div>
      <h2>${tr('arena.intro_h', { 0: esc(bName) })}</h2>
      <p>${esc(tc(boss, 'intro') || '')}</p>
      <div class="m-ar-rules">${tr('arena.rules', { 0: towers, 1: need })}</div>
      <button class="m-btn m-btn-big m-btn-alt" data-a="go">${tr('arena.fight')}</button>
      ${inTg ? '' : '<button class="m-btn m-btn-ghost m-ar-introback" data-a="back">' + tr('common.back') + '</button>'}</div>`;
    scr.append(ov);
    const introCh = mkChar(ov.querySelector('.m-ar-introboss'), 150, 'talk');
    introCh?.talk(tc(boss, 'intro') || bName);
    bossCh?.talk(tc(boss, 'intro') || bName);
    const bk = ov.querySelector('[data-a=back]');
    if (bk) bk.onclick = () => { hap(app); app.back(); };
    ov.querySelector('[data-a=go]').onclick = () => {
      hap(app, 'medium');
      introCh?.talk(0); bossCh?.talk(0);
      anim(ov, [{ opacity: 1 }, { opacity: 0 }], 250).then(() => { introCh?.destroy(); ov.remove(); });
      showTask();
    };
  }

  // ------------------------------------------------ task
  function showTask() {
    r.busy = false;
    paintStatus();
    fbEl.innerHTML = '';
    taskEl.innerHTML = '';
    taskEl.hidden = false;
    const t = tasks[r.i];
    const holder = el('div', 'm-ar-taskbox');
    taskEl.append(holder);
    let answered = false;
    const onResult = (ok, given, meta) => {
      if (answered || !alive) return;
      answered = true;
      answer(!!ok, given, !!meta?.skipped);
    };
    try {
      UI.renderTask(holder, t, { onResult });
    } catch (e) {
      console.error('renderTask', e);
      holder.textContent = t.q || '';
    }
    anim(taskEl, [{ opacity: 0, transform: 'translateY(14px) scale(.98)' }, { opacity: 1, transform: 'none' }], 320);
  }

  async function answer(ok, given, skipped) {
    if (r.busy) return;
    r.busy = true;
    const t = tasks[r.i];
    let card = null;
    if (ok) {
      r.correct += 1; r.combo += 1;
      addXP(st, XP_PER_CORRECT);
      onCorrect(st);
      card = DECK[Math.floor(Math.random() * DECK.length)];
    } else {
      r.mistakes += 1; r.combo = 0;
    }
    app.save?.();
    hap(app, ok ? 'success' : 'error');
    { const tb = taskEl.querySelector('.m-ar-taskbox'); if (ok) JX.ok(tb, 6, false); else JX.bad(tb, false); }
    const over = r.correct >= need || r.mistakes >= towers;
    const last = r.i + 1 >= n || over;

    await sleep(ok ? 350 : 500);
    if (!alive) return;
    if (ok) await throwCard(card);
    else await bossStrike();
    if (!alive) return;
    paintStatus();

    // фідбек (як _arena_feedback)
    const fb = el('div', 'm-ar-fbbox ' + (ok ? 'good' : 'bad'));
    if (ok) {
      fb.innerHTML = `<div>${tr('arena.throw', { 0: esc(cardName(card)) })}</div><div class="m-ar-gain">+10 XP · +1 🍀</div>`;
    } else {
      const right = correctText(t);
      fb.innerHTML = `<div>${tr('arena.tower_hit')}</div>${right ? `<div>${tr('arena.right')} <b>${esc(right)}</b></div>` : ''}` +
        (tc(t, 'explain') ? `<div class="m-ar-explain">💡 ${esc(tc(t, 'explain'))}</div>` : '') + '<div class="m-ar-cheer">' + tr('arena.cheer') + '</div>';
    }
    const next = el('button', 'm-btn m-btn-big ' + (last ? 'm-btn-alt' : ''), last ? tr('arena.result') : tr('common.next'));
    next.onclick = () => {
      if (!alive || next.disabled) return;
      next.disabled = true;
      hap(app);
      if (last) finish();
      else { r.i += 1; showTask(); }
    };
    fb.append(next);
    taskEl.hidden = true;
    fbEl.innerHTML = '';
    fbEl.append(fb);
    anim(fb, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], 300);
    if (last) {
      r.over = true;
      later(() => { if (!next.disabled) { next.disabled = true; finish(); } }, 2600);
    }
    later(() => fb.scrollIntoView?.({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }), 120);
  }

  async function throwCard(card) {
    sfx('card');
    // карта в руці: якщо її немає — підміняємо випадковий слот
    let idx = hand.indexOf(card);
    if (idx < 0) {
      idx = Math.floor(Math.random() * hand.length);
      queue.push(hand[idx]);
      hand[idx] = card;
      paintHand();
    }
    const src = handEl.children[idx];
    const a = src.getBoundingClientRect();
    src.classList.add('m-ar-card-out');
    const flying = el('div', 'm-ar-flycard', cardHtml(card));
    const b = btower.getBoundingClientRect();
    const target = { left: b.left + b.width / 2 - 20, top: b.top + b.height * 0.35, width: 40, height: 40 };
    anim(src, [{ transform: 'translateY(0)' }, { transform: 'translateY(-14px) scale(1.08)' }], 150);
    await fly(flying, a, target, { ms: 620, arc: -40, rot0: 0, rot1: 360, s0: 1.05, s1: 0.45 });
    if (!alive) return;
    // вибух
    boom(btower, '💥');
    bossCh?.react('hit');
    sfx('boss_hit');
    bossMood('hurt', 1000);
    btower.classList.remove('m-hit'); void btower.offsetWidth; btower.classList.add('m-hit');
    fx('shake', btower);
    const seg = hpSegs[need - r.correct];
    if (seg) { seg.classList.add('gone', 'm-seg-pop'); }
    hpNum.textContent = `${need - Math.min(need, r.correct)}/${need}`;
    floatText(btower, '💥 −1', 'm-float-gold');
    later(() => JX.xp(src.isConnected ? src : handEl, 10), 150);
    // нова карта в слот
    hand[idx] = queue.shift() || DECK[Math.floor(Math.random() * DECK.length)];
    queue.push(card);
    await sleep(380);
    if (!alive) return;
    paintHand();
    const nc = handEl.children[idx];
    anim(nc, [{ transform: 'translateY(60px) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.3,1.5,.5,1)' });
    if (r.combo >= 2) fx('sparkle', btower);
  }

  async function bossStrike() {
    const k = r.mistakes - 1;
    const tw = ptowers[k];
    if (!tw) return;
    sfx('hit');
    const a = btower.getBoundingClientRect();
    const src = { left: a.left + a.width / 2 - 24, top: a.top + a.height * 0.3, width: 48, height: 48 };
    bossMood('happy', 1700); // бос сміється з помилки
    bossCh?.react('jump');
    anim(btower, [{ transform: 'none' }, { transform: 'translateY(-10px) scale(1.06)' }, { transform: 'none' }], 300);
    const ball = el('div', 'm-ar-fireball', `<span>${esc(bEmoji)}</span>`);
    await fly(ball, src, tw.getBoundingClientRect(), { ms: 650, arc: 40, rot0: 0, rot1: -540, s0: 0.8, s1: 1.1 });
    if (!alive) return;
    boom(tw, '💥');
    tw.classList.add('ruined', 'm-crumble');
    fx('shake', scr);
    fx('flash', 'rgba(255,60,60,.35)');
    floatText(tw, '−1 🏰');
  }

  function boom(target, emoji) {
    const rr = target.getBoundingClientRect();
    const b = el('div', 'm-boom', `<span>${emoji}</span>${'<i></i>'.repeat(8)}`);
    b.style.left = rr.left + rr.width / 2 + 'px';
    b.style.top = rr.top + rr.height / 2 + 'px';
    document.body.append(b);
    setTimeout(() => b.remove(), 900);
  }

  // ------------------------------------------------ finish (_arena_finish)
  function finish() {
    if (scr.querySelector('.m-ar-end')) return;
    const oldT = st.trophies || 0;
    const oldArena = arenaName(oldT);
    const win = r.correct >= need;
    const lines = [];
    let nextWorld = null;
    let delta;
    const res = typeof S.finishBoss === 'function' ? S.finishBoss(st, wid, win) : localFinishBoss(st, worlds, wi, win, oldT);
    if (win) recordGame(st, `${wid}-boss`, r.mistakes === 0 ? 3 : r.mistakes === 1 ? 2 : 1);  // зірки боса на стежці
    if (win) {
      delta = `+${res.trophies}`;
      if (res.first) lines.push(`${tr('arena.badge', { 0: esc(tc(w, 'name') || ''), 1: res.xp })}`);
      if (res.gift) lines.push(esc(res.gift));
      const newArena = arenaName(st.trophies);
      if (newArena !== oldArena) lines.push(`<span class="m-ar-newarena">${tr('arena.new_arena', { 0: esc(newArena) })}</span>`);
      if (wi + 1 < worlds.length) {
        nextWorld = worlds[wi + 1];
        if (res.unlocked) lines.push(`${tr('arena.unlocked', { 0: esc(res.unlocked.emoji || ''), 1: esc(tc(res.unlocked, 'name') || '') })}`);
      } else {
        lines.push(tr('arena.all_done'));
      }
    } else {
      const lost = -res.trophies;
      delta = lost ? `−${lost}` : '±0';
      lines.push(lost ? `${tr('arena.lost', { 0: lost, 1: st.trophies })}` : tr('arena.cups_same'));
      lines.push(tr('arena.try_again'));
    }
    app.save?.();
    const newT = st.trophies || 0;

    const ov = el('div', `m-overlay m-ar-end ${win ? 'win' : 'lose'}`);
    ov.innerHTML = `
      <div class="m-ar-rays" aria-hidden="true"></div>
      <div class="m-ar-endcard">
        <div class="m-ar-banner">${win ? tr('arena.win') : tr('arena.lose')}</div>
        <div class="m-ar-endicon"><span class="m-ar-endboss"></span><span class="m-ar-endemo">${win ? '👑' : '💔'}</span></div>
        ${win ? '<div class="m-ar-stars" style="display:flex;justify-content:center;min-height:56px;transform:scale(.75);margin:-8px 0"></div>' : ''}
        <p class="m-ar-endsub">${win ? `${tr('arena.fell', { 0: esc(bName) })}` : `${tr('arena.all_fell', { 0: esc(bName) })}`}</p>
        <div class="m-ar-hits">${tr('arena.hits', { 0: r.correct, 1: need })}</div>
        <div class="m-ar-trophies"><span class="m-ar-cup">🏆</span><b class="m-ar-tcount">${oldT}</b><em>${delta}</em></div>
        <div class="m-ar-arena">${esc(arenaName(newT))}</div>
        <div class="m-ar-lines">${lines.map((x, k) => `<div style="animation-delay:${1.1 + k * 0.35}s">${x}</div>`).join('')}</div>
        <div class="m-ar-endlumi"></div>
        <div class="m-ar-endbtns">${win
          ? `${nextWorld ? `<button class="m-btn m-btn-alt m-btn-big" data-a="next">➡️ ${esc((tc(nextWorld, 'name') || tr('arena.next_def')).slice(0, 40))}</button>` : ''}
             <button class="m-btn" data-a="map">${tr('common.map')}</button><button class="m-btn m-btn-ghost" data-a="home">${tr('common.menu')}</button>`
          : `<button class="m-btn m-btn-red m-btn-big" data-a="again">${tr('arena.rematch')}</button>
             <button class="m-btn" data-a="world">${tr('common.to_world')}</button><button class="m-btn m-btn-ghost" data-a="home">${tr('common.menu')}</button>`}
        </div>
      </div>`;
    scr.append(ov);
    hap(app, win ? 'success' : 'error');
    sfx(win ? 'win' : 'lose');
    if (win) {
      starSfx(r.mistakes === 0 ? 3 : r.mistakes === 1 ? 2 : 1, 400, 260);
      fx('starsDrop', ov.querySelector('.m-ar-stars'), r.mistakes === 0 ? 3 : r.mistakes === 1 ? 2 : 1);
      later(() => (JX.lite() ? null : fx('confetti')), 300);
      if (!JX.lite() && r.mistakes === 0) later(() => fx('confetti'), 1400);
      btower.querySelector('.m-ar-tw')?.classList.add('m-fallen');
    }
    bossMood(win ? 'lose' : 'win');
    mkChar(ov.querySelector('.m-ar-endboss'), 104, win ? 'lose' : 'win');
    const tcEl = ov.querySelector('.m-ar-tcount');
    later(() => {
      countUp(tcEl, oldT, newT, 1000);
      fx('pop', ov.querySelector('.m-ar-cup'));
    }, 700);
    const emo = win ? 'proud' : 'sad';
    lumiRef = makeLumi(app, ov.querySelector('.m-ar-endlumi'), 72, emo);
    later(() => lumiRef?.say?.(win ? tr('arena.lumi_win') : tr('arena.lumi_lose')), 1600);
    const on = (a, fn) => { const b = ov.querySelector(`[data-a=${a}]`); if (b) b.onclick = () => { hap(app); fn(); }; };
    on('next', () => app.go('world', { wid: nextWorld.id }, { replace: true }));
    on('map', () => app.go('map', {}, { replace: true }));
    on('home', () => (typeof app.home === 'function' ? app.home() : app.go('home')));
    on('world', () => app.back());
    on('again', () => app.go('arena', { wid }, { replace: true }));
  }

  intro();

  JX.css();
  const unPress = JX.press(scr);
  return () => {
    unPress();
    alive = false;
    timers.forEach(clearTimeout);
    try { lumiRef?.destroy?.(); } catch (e) { /* */ }
    clearTimeout(moodT);
    chars.forEach((c) => { try { c.destroy(); } catch (e) { /* */ } });
    document.querySelectorAll('.m-flylayer > *, .m-boom').forEach((x) => x.remove());
  };
}
