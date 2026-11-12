// 🏃 Словесний Забіг — раннер по 3 доріжках у псевдо-3D. Згори — укр. слово, на доріжках
// набігають 3 ворота з англ. словами. Свайп/тап/стрілки — зміна доріжки. Правильні ворота —
// бонус і швидкість росте; неправильні — спотикання (−❤️). 15 слів, потім фініш.
// Рендер: <canvas> + rAF (зупиняється в cleanup/паузі), HUD і екрани — DOM (css/games.css).
import * as S from './state.js?v=20261112181924';
import * as FX from './fx.js?v=20261112181924';
import { recordGame, starsByRatio, gameStars } from './games.js?v=20261112181924';
import { tr, tc, twords, sfx, speak, starSfx } from './i18n_modes.js?v=20261112181924';
import { perfLite, fpsWatch, canvasGameOn, lumiKit, canvasDpr } from './obby.js?v=20261112181924';

export const meta = { topbar: false };
/** Для тестів: кадри циклу, чи працює rAF, доріжка правильних воріт (0..2), фаза. */
export const _debug = { frames: 0, running: false, answer: -1, phase: '' };

const WORDS_N0 = 15;       // слів за забіг (виклик — 20)
const HEARTS = 3;
const XP_PER_CORRECT = 10;
const SPEED00 = 7;         // од./с (виклик — 9)
const SPEED_MAX0 = 12.5;   // (виклик — 15)
const Z_SPAWN = 36;
const Z_FAR = 70;

// ---------------------------------------------------------------- дрібниці
const CSS_HREF = new URL('./games.css?v=20261112181924', import.meta.url).href;
function ensureCss(root) {
  let l = document.querySelector('link[data-games-css]');
  if (!l) {
    l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = CSS_HREF; l.dataset.gamesCss = '1';
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
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, k) => a + (b - a) * k;
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
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
function hap(app, kind = 'light') {
  const t = app?.tg;
  if (!t) return;
  try {
    const note = kind === 'success' || kind === 'error' || kind === 'warning';
    if (note && typeof t.notify === 'function') return t.notify(kind);
    if (!note && typeof t.tap === 'function') return t.tap(kind);
    if (typeof t.haptic === 'function') return t.haptic(kind);
  } catch (e) { /* без вібро */ }
}
function makeLumi(app, container, size, emotion) {
  try {
    if (typeof app?.makeLumi === 'function') return app.makeLumi(container, { size, emotion, global: false });
  } catch (e) { console.warn('lumi', e); }
  return null;
}
const FONT = 'Lumi, "Segoe UI", system-ui, -apple-system, sans-serif';
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function hexA(h, a) { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; }

// ---------------------------------------------------------------- теми світів
const THEMES = {
  // v11: проміжні світи — берег, вітряки, порт у сутінках
  w1b: { sky: ['#5fd0e0', '#b5ecf0', '#fff2cc'], sun: '#fff3a8', far: '#7fd8d0', near: '#4fc0c8', land: 'hills',
    g1: '#f3dca0', g2: '#ecd292', r1: '#c9a06a', r2: '#bf955f', rum1: '#ffffff', rum2: '#ff8e6b', lane: '#fff3d6',
    gate: '#12a3b8', gateDk: '#0b6d80', prop: 'tree', part: 'pollen', accent: '#ff8e6b' },
  w1c: { sky: ['#ffc24a', '#ffe08e', '#fff3cf'], sun: '#fff6c8', far: '#bfe07a', near: '#94cc58', land: 'hills',
    g1: '#a9d86e', g2: '#9ccd60', r1: '#f2c25a', r2: '#e8b54a', rum1: '#fffbea', rum2: '#f2a818', lane: '#fff1c4',
    gate: '#6baf3a', gateDk: '#3f7a1e', prop: 'tree', part: 'pollen', accent: '#f2a818' },
  // v19 · c6–c10: Іспанія, Канада, Австралія, Бразилія, Корея
  c6: { sky: ['#ff9f4a', '#ffc27a', '#ffe9c2'], sun: '#fff0b8', far: '#e8c27a', near: '#d2a060', land: 'hills',
    g1: '#e9b98a', g2: '#dfae7e', r1: '#d2603a', r2: '#c45632', rum1: '#fffbf3', rum2: '#e8323c', lane: '#ffe3b0',
    gate: '#e8323c', gateDk: '#9a1a22', prop: 'tree', part: 'pollen', accent: '#ffc400' },
  c7: { sky: ['#7fc0ec', '#b4dcf4', '#e6f4fb'], sun: '#fff8d8', far: '#7c93b8', near: '#5e7aa2', land: 'peaks',
    g1: '#4e9a6a', g2: '#46905f', r1: '#b89a6e', r2: '#ad8f63', rum1: '#ffffff', rum2: '#d52b1e', lane: '#f4ece0',
    gate: '#d52b1e', gateDk: '#8a1a12', prop: 'pine', part: 'snow', accent: '#d52b1e' },
  c8: { sky: ['#3fc4e0', '#8fe0f0', '#ffe8c0'], sun: '#fff3a8', far: '#c8552b', near: '#e8794a', land: 'hills',
    g1: '#f6d294', g2: '#ecc888', r1: '#c9a06a', r2: '#bf955f', rum1: '#ffffff', rum2: '#f28a2e', lane: '#fff3d6',
    gate: '#1ba6b8', gateDk: '#0e6d7a', prop: 'tree', part: 'pollen', accent: '#f28a2e' },
  c9: { sky: ['#3fbce6', '#8fdcf2', '#fff6c2'], sun: '#fff6b0', far: '#5a7e6a', near: '#3e8e5a', land: 'hills',
    g1: '#5cc27a', g2: '#52b670', r1: '#f6ebd0', r2: '#ece0c2', rum1: '#ffffff', rum2: '#1e2a3a', lane: '#fff6c2',
    gate: '#13a453', gateDk: '#0a6a34', prop: 'tree', part: 'pollen', accent: '#ffc21a' },
  c10: { sky: ['#0e1030', '#3a2a6e', '#ff6fb5'], sun: '#fff4d6', far: '#22285a', near: '#1a1f48', land: 'towers',
    g1: '#22264e', g2: '#1c2046', r1: '#3a3e78', r2: '#34386e', rum1: '#3ee6ff', rum2: '#ff4fa3', lane: '#ff9acd',
    gate: '#ff4fa3', gateDk: '#a8306e', prop: 'lantern', part: 'stars', accent: '#3ee6ff', dark: true },
  // v20 · c11 Норвегія (фіорд, сяйво), c12 Мексика (пустеля, фієста)
  c11: { sky: ['#0f2547', '#1f5470', '#7fd8c0'], sun: '#e6fff4', far: '#3e5e86', near: '#2a4668', land: 'peaks',
    g1: '#eaf4fa', g2: '#dcecf6', r1: '#9fb4c8', r2: '#93a8bc', rum1: '#ffffff', rum2: '#d7263d', lane: '#f4faff',
    gate: '#d7263d', gateDk: '#8a1424', prop: 'pine', part: 'snow', accent: '#2fd9a0' },
  c12: { sky: ['#ff9a4a', '#ffc070', '#fff2d2'], sun: '#fff3b0', far: '#e8a86a', near: '#d99a5a', land: 'hills',
    g1: '#f6d8a2', g2: '#eec388', r1: '#e8336e', r2: '#d42a62', rum1: '#fffbf4', rum2: '#2ec4b6', lane: '#ffe9a8',
    gate: '#0f9d6a', gateDk: '#0a6a48', prop: 'tree', part: 'pollen', accent: '#e8336e' },
  // v19 · Дизайн А — країни c1–c5
  c1: { sky: ['#9fb2cb', '#c6d2e2', '#eef0ea'], sun: '#fff6dc', far: '#b5c1d4', near: '#8a98b0', land: 'towers',
    g1: '#8db878', g2: '#80ab6c', r1: '#aeb6c4', r2: '#a2aab8', rum1: '#ffffff', rum2: '#d7263d', lane: '#e4eaf2',
    gate: '#d7263d', gateDk: '#9e1a2c', prop: 'lamp', part: 'pollen', accent: '#d7263d' },
  c2: { sky: ['#6fa8e0', '#a9cff2', '#ffe4bc'], sun: '#fff0c8', far: '#9db3da', near: '#6e86b5', land: 'towers',
    g1: '#e2b85a', g2: '#d8ad4e', r1: '#5e6878', r2: '#565f6e', rum1: '#ffd866', rum2: '#2f3644', lane: '#ffd866',
    gate: '#2d5da8', gateDk: '#1c3c74', prop: 'lamp', part: 'pollen', accent: '#ffc23c' },
  c3: { sky: ['#ffc9d8', '#ffe2ea', '#fff3ec'], sun: '#ff8a7a', far: '#b6c0e6', near: '#9aa6d8', land: 'peaks',
    g1: '#9cc47a', g2: '#8dba6a', r1: '#e9e2d6', r2: '#ddd5c8', rum1: '#ffffff', rum2: '#e0452b', lane: '#fff3ec',
    gate: '#e0452b', gateDk: '#9c2a18', prop: 'lantern', part: 'pollen', accent: '#f48fb1' },
  c4: { sky: ['#a9c0f0', '#d0dcf8', '#ffe8e4'], sun: '#fff4ec', far: '#c9b6ff', near: '#a88bd8', land: 'domes',
    g1: '#9cc47a', g2: '#a88bd8', r1: '#f6e9d6', r2: '#eadcc6', rum1: '#ffffff', rum2: '#8c6fd6', lane: '#fff8ee',
    gate: '#8c6fd6', gateDk: '#5a44a0', prop: 'tree', part: 'pollen', accent: '#e86a7a' },
  c5: { sky: ['#ffa66e', '#ffc994', '#fff1d8'], sun: '#fff0c8', far: '#b7c47a', near: '#8fae4e', land: 'hills',
    g1: '#b7c47a', g2: '#a9b86c', r1: '#e2c49a', r2: '#d6b88c', rum1: '#fff5e8', rum2: '#d9663b', lane: '#fff1d8',
    gate: '#2e9aa6', gateDk: '#1c6a74', prop: 'tree', part: 'pollen', accent: '#d9663b' },
  w2b: { sky: ['#86c8f5', '#cfeaff', '#fff1c2'], sun: '#fff6b8', far: '#e8cf7a', near: '#d2a94a', land: 'hills',
    g1: '#e9c85c', g2: '#dfbc50', r1: '#b9976a', r2: '#ae8c60', rum1: '#fff6d8', rum2: '#d96a3a', lane: '#fff0c0',
    gate: '#3f8fd8', gateDk: '#235f9c', prop: 'tree', part: 'pollen', accent: '#ff7f5a' },
  w3b: { sky: ['#101c40', '#27407a', '#e89a5c'], sun: '#ffe2a0', far: '#243a70', near: '#16254e', land: 'towers',
    g1: '#1f3466', g2: '#1b2d5a', r1: '#7a5a3e', r2: '#705238', rum1: '#ffc65a', rum2: '#3c2a1c', lane: '#ffd79a',
    gate: '#e0793a', gateDk: '#9c4a1c', prop: 'lamp', part: 'spark', accent: '#ffc65a', dark: true },
  w4b: { sky: ['#5c6c82', '#95a4b8', '#dde4ec'], sun: '#eef6ff', far: '#8a98ac', near: '#6a778a', land: 'peaks',
    g1: '#7c889a', g2: '#727e90', r1: '#aeb8c8', r2: '#a2adbe', rum1: '#e6ebf3', rum2: '#4a5668', lane: '#dde4ec',
    gate: '#b9a6ec', gateDk: '#6f5cb0', prop: 'lamp', part: 'snow', accent: '#8fe0d6' },
  w0: { sky: ['#7fcbff', '#c9ecff', '#fff1c4'], sun: '#fff1a0', far: '#a6dc86', near: '#79c45f', land: 'hills',
    g1: '#8fd46c', g2: '#80c75f', r1: '#d9c2a0', r2: '#cfb795', rum1: '#ffffff', rum2: '#ff9f6b', lane: '#fff8e6',
    gate: '#7b5cff', gateDk: '#4a2fb8', prop: 'tree', part: 'pollen', accent: '#ffcf3a' },
  // v20 · w1 Долина Повітряних Куль: барвінкове небо → рожевий світанок, клаптикові поля, дощата стежка
  w1: { sky: ['#a9bcff', '#d9dcff', '#ffe4ee'], sun: '#fff4d6', far: '#f2b7cb', near: '#9ed39a', land: 'hills',
    g1: '#b7dd8c', g2: '#f4d774', r1: '#d9a86e', r2: '#c98b4e', rum1: '#fffdf8', rum2: '#ff5d73', lane: '#fff3da',
    gate: '#7a6cf0', gateDk: '#4a3fb0', prop: 'tree', part: 'pollen', accent: '#ff5d73' },
  w2: { sky: ['#9fd4a8', '#d3efc8', '#f2f8d2'], sun: '#f4ffc6', far: '#5e9c6b', near: '#3c7350', land: 'pines',
    g1: '#4f8f55', g2: '#47844d', r1: '#a98c69', r2: '#9e8160', rum1: '#f1f7d6', rum2: '#6b4a2e', lane: '#efe4c4',
    gate: '#e0793a', gateDk: '#9c4a1c', prop: 'pine', part: 'firefly', accent: '#ffe66b' },
  w3: { sky: ['#eea86c', '#ffd4a6', '#ffefd8'], sun: '#fff0c0', far: '#c98a5a', near: '#9c5e36', land: 'towers',
    g1: '#b9875c', g2: '#ad7c52', r1: '#7d6a5c', r2: '#745f52', rum1: '#ffd25e', rum2: '#7a3f1d', lane: '#ffe2a6',
    gate: '#2f8f8a', gateDk: '#1b5c58', prop: 'lamp', part: 'spark', accent: '#ffd25e' },
  w4: { sky: ['#8cc4fb', '#d3ebff', '#f6fbff'], sun: '#ffffff', far: '#c4def6', near: '#94bbe4', land: 'peaks',
    g1: '#eef7ff', g2: '#e1effc', r1: '#9fc2e6', r2: '#93b8de', rum1: '#ffffff', rum2: '#5f86bf', lane: '#ffffff',
    gate: '#9b5de5', gateDk: '#5e2fa3', prop: 'crystal', part: 'snow', accent: '#7fd4ff' },
  w5: { sky: ['#0d0828', '#2a1b63', '#5a3aa0'], sun: '#fff6c8', far: '#2a1d5e', near: '#1b1340', land: 'domes',
    g1: '#231a52', g2: '#1e1648', r1: '#3b2d7c', r2: '#352872', rum1: '#ffe27a', rum2: '#7b5cff', lane: '#c9b8ff',
    gate: '#ff7ab6', gateDk: '#a83a73', prop: 'lantern', part: 'stars', accent: '#ffe27a', dark: true },
};

// ---------------------------------------------------------------- Лумі — спрайти з obby.js (lumiKit)
function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); }
function starPath(ctx, x, y, r, rot = 0, inner = 0.48) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * inner : r, a = -Math.PI / 2 + rot + (i * Math.PI) / 5;
    ctx[i ? 'lineTo' : 'moveTo'](x + rr * Math.cos(a), y + rr * Math.sin(a));
  }
  ctx.closePath();
}
function rrect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function fitFont(ctx, text, maxW, size, minSize = 7) {
  let fs = Math.floor(size);
  for (; fs > minSize; fs--) { ctx.font = `800 ${fs}px ${FONT}`; if (ctx.measureText(text).width <= maxW) break; }
  ctx.font = `800 ${fs}px ${FONT}`;
  return fs;
}

// ---------------------------------------------------------------- слова
function buildRounds(content, wid, WORDS_N = WORDS_N0) {
  const pairs = twords(content, wid).filter((p) => Array.isArray(p) && p.length === 2 && p[0] && p[1]);
  const uniq = [];
  const seen = new Set();
  for (const p of pairs) { const k = String(p[1]).toLowerCase(); if (!seen.has(k)) { seen.add(k); uniq.push(p); } }
  if (uniq.length < 3) return [];
  const pick = shuffle(uniq);
  const rounds = [];
  for (let i = 0; i < WORDS_N; i++) {
    const [ua, en] = pick[i % pick.length];
    const wrong = shuffle(uniq.filter((p) => p[1] !== en)).slice(0, 2).map((p) => p[1]);
    const words = shuffle([en, ...wrong]);
    rounds.push({ ua, en, words, ans: words.indexOf(en) });
  }
  return rounds;
}

// ---------------------------------------------------------------- екран
export function render(root, params, app) {
  ensureCss(root);
  root.classList.add('g-host');
  const inTg = !!app?.tg?.isTelegram;
  const st = app.state;
  const wid = params?.wid || 'w1';
  const world = (app.content?.WORLDS || []).concat(app.content?.COUNTRIES || []).find((w) => w.id === wid);
  const th = THEMES[wid] || THEMES.w1;
  const hard = !!params?.hard;
  const gameId = params?.id || `${wid}-runner${hard ? 'x' : ''}`;
  const WORDS_N = hard ? 20 : WORDS_N0;
  const SPEED0 = hard ? 9 : SPEED00;
  const SPEED_MAX = hard ? 15 : SPEED_MAX0;
  const SPEED_STEP = hard ? 0.7 : 0.45;   // прискорення за правильну відповідь
  let alive = true;
  let dirty = false;
  let lumiRefs = [];

  const scr = el('div', `g-screen g-runner g-th-${wid}${th.dark ? ' g-dark' : ''}${hard ? ' g-hard' : ''}`);
  root.append(scr);

  if (!world || buildRounds(app.content, wid, WORDS_N).length === 0) {
    scr.innerHTML = `<div class="g-locked"><div class="g-locked-ico">🏃</div><p>${tr('runner.no_words')}</p>
      <button class="g-btn" data-a="back">${tr('common.back')}</button></div>`;
    scr.querySelector('[data-a=back]').onclick = () => app.back();
    return () => { alive = false; };
  }

  scr.innerHTML = `
    <div class="g-skyl" aria-hidden="true"><canvas></canvas></div>
    <canvas class="g-canvas" aria-hidden="true"></canvas>
    <div class="g-hud">
      <div class="g-hud-row">
        <button class="g-ibtn g-back" ${tr('common.back_aria')}${inTg ? ' hidden' : ''}>‹</button>
        <div class="g-hearts" ${tr('common.lives_aria')}></div>
        <div class="g-chip g-rn-prog">🏃 <b>0</b>/${WORDS_N}</div>
        <div class="g-chip g-rn-score">✨ <b>0</b></div>
        <button class="g-ibtn g-pause" ${tr('common.pause_aria')}>⏸</button>
      </div>
      <div class="g-qcard g-rn-card" hidden>
        <div class="g-qlabel">${tr('runner.label')}</div>
        <div class="g-rn-word"></div>
        <div class="g-qfb"></div>
      </div>
      <div class="g-chip g-combo g-rn-combo" hidden>🔥 x<b>0</b></div>
    </div>
    <div class="g-rn-pad" aria-hidden="true"><span>‹</span><span>›</span></div>
    <div class="g-rn-opts" aria-hidden="true"><b></b><b></b><b></b></div>`;
  const $ = (q) => scr.querySelector(q);
  const cv = $('.g-canvas');
  const ctx = cv.getContext('2d');
  const hud = { hearts: $('.g-hearts'), prog: $('.g-rn-prog b'), score: $('.g-rn-score b'), scoreChip: $('.g-rn-score'),
    card: $('.g-rn-card'), word: $('.g-rn-word'), fb: $('.g-rn-card .g-qfb'), combo: $('.g-rn-combo'), comboN: $('.g-rn-combo b'),
    opts: $('.g-rn-opts'), optB: [...scr.querySelectorAll('.g-rn-opts b')] };
  // v17: варіанти на воротах — великі плашки над трьома доріжками, видно одразу, як ворота з'являються
  let optLane = -9, optHideT = 0;
  function optsShow(words) {
    clearTimeout(optHideT);
    hud.optB.forEach((b, i) => {
      const w = String(words[i] ?? '');
      b.textContent = w;
      b.className = w.length > 14 ? 'xl' : w.length > 9 ? 'l' : '';
    });
    optLane = -9;
    hud.opts.classList.add('show');
  }
  function optsJudge(ans, hit) {
    hud.optB.forEach((b, i) => { b.classList.toggle('good', i === ans); b.classList.toggle('bad', i === hit && hit !== ans); b.classList.remove('on'); });
    optLane = -9;
    optHideT = setTimeout(() => hud.opts.classList.remove('show'), 550);
  }
  function optsHide() { clearTimeout(optHideT); hud.opts.classList.remove('show'); optLane = -9; }
  $('.g-back').onclick = () => { hap(app); app.back(); };
  $('.g-pause').onclick = () => { hap(app); pause(); };

  // ------------------------------------------------ розміри й проєкція
  let W = 390, H = 700, dpr = 1, hy = 260, hb = 600, LW = 120, zNear = 1.4;
  const zP = 2;
  function resize() {
    const r = scr.getBoundingClientRect();
    W = Math.max(280, r.width); H = Math.max(420, r.height);
    dpr = canvasDpr();
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    hy = H * 0.4; hb = H * 0.85; LW = Math.min(W * 0.29, 140);
    hud.opts.style.top = Math.round(Math.min(hb + 10, H - 104)) + 'px';
    zNear = (zP * (hb - hy)) / (H - hy);
    buildLand();
    buildCache();
    if (!running) draw();
  }
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => resize()) : null;
  let camX = 0, curve = 0, curveAcc = 0;
  const curveOff = (z) => curve * (z - zP) * (z - zP) * 0.006;
  const kz = (z) => (LW * zP) / Math.max(0.2, z);                 // px на одиницю на глибині z
  const SX = (x, z) => W / 2 + (x - camX + curveOff(z)) * kz(z);
  const SY = (z, h = 0) => hy + ((hb - hy) * zP) / Math.max(0.2, z) - h * kz(z);

  // ------------------------------------------------ v6: кеш (небо — окреме полотно під грою; сяйва/туман/віньєтка — спрайти)
  const skyC = scr.querySelector('.g-skyl canvas');
  const spr = {};
  const mkC = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  /** Спрайт 1:1 у пікселях пристрою (поточна матриця — масштаб dpr + зсув). */
  function blit(c, x, y) {
    const m = ctx.getTransform();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(c, Math.round(m.a * x + m.e), Math.round(m.d * y + m.f));
    ctx.setTransform(m);
  }
  function radialSprite(R, stops, S = 1) {
    const c = mkC(2 * R * S * dpr, 2 * R * S * dpr), x = c.getContext('2d');
    x.setTransform(dpr * S, 0, 0, dpr * S, R * S * dpr, R * S * dpr);
    const gr = x.createRadialGradient(0, 0, 0, 0, 0, R);
    stops.forEach(([o, col]) => gr.addColorStop(o, col));
    x.fillStyle = gr; x.fillRect(-R, -R, 2 * R, 2 * R);
    return c;
  }
  function buildCache() {
    // небо: рівно як fillRect(-20,-20,W+40,hy+22) з градієнтом 0..hy
    skyC.width = cv.width; skyC.height = Math.ceil((hy + 2) * dpr);
    skyC.style.width = W + 'px'; skyC.style.height = skyC.height / dpr + 'px';
    let x = skyC.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = x.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, th.sky[0]); sky.addColorStop(0.6, th.sky[1]); sky.addColorStop(1, th.sky[2]);
    x.fillStyle = sky; x.fillRect(0, 0, W, hy + 2);
    // сонце/місяць (сяйво + диск)
    const R = 130;
    spr.sun = mkC(2 * R * dpr, 2 * R * dpr); x = spr.sun.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, R * dpr, R * dpr);
    const sg = x.createRadialGradient(0, 0, 4, 0, 0, R);
    sg.addColorStop(0, th.sun); sg.addColorStop(0.25, hexA(th.sun, 0.5)); sg.addColorStop(1, hexA(th.sun, 0));
    x.fillStyle = sg; x.fillRect(-R, -R, 2 * R, 2 * R);
    x.fillStyle = th.sun; x.beginPath(); x.arc(0, 0, th.dark ? 20 : 28, 0, 7); x.fill();
    if (th.dark) { x.fillStyle = th.sky[1]; x.beginPath(); x.arc(9, -6, 17, 0, 7); x.fill(); }
    // туман на горизонті
    spr.fog = mkC((W + 40) * dpr, 48 * dpr); x = spr.fog.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fog = x.createLinearGradient(0, 0, 0, 48);
    fog.addColorStop(0, hexA(th.sky[2], 0.95)); fog.addColorStop(1, hexA(th.sky[2], 0));
    x.fillStyle = fog; x.fillRect(0, 0, W + 40, 48);
    // віньєтки спалаху (повна сила; яскравість — globalAlpha)
    spr.vig = {};
    // сяйва: світлячок, кулька, ліхтарик
    spr.fly = radialSprite(8, [[0, 'rgba(240,255,150,0.9)'], [1, 'rgba(240,255,150,0)']], 1.3);
    spr.orb = radialSprite(30, [[0, 'rgba(255,246,170,.9)'], [1, 'rgba(255,220,120,0)']]);
    spr.lan = radialSprite(50, [[0, 'rgba(255,236,150,0.8)'], [1, 'rgba(255,236,150,0)']], 0.5);
    spr.k = dpr;
  }
  function vignette(c) {
    if (spr.vig[c]) return spr.vig[c];
    const v = mkC(cv.width, cv.height), x = v.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gr = x.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
    gr.addColorStop(0, `rgba(${c},0)`); gr.addColorStop(1, `rgba(${c},1)`);
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    return (spr.vig[c] = v);
  }
  const WS_BASE = 56;            // розмір шрифту спрайта слова
  const wordSpr = new Map();
  function wordSprite(text) {
    let sp = wordSpr.get(text);
    if (sp) return sp;
    const m = document.createElement('canvas').getContext('2d');
    m.font = `800 ${WS_BASE}px ${FONT}`;
    const tw = Math.max(4, m.measureText(text).width);
    const pad = WS_BASE * 0.3;
    const c = document.createElement('canvas');
    c.width = Math.ceil(tw + pad * 2); c.height = Math.ceil(WS_BASE * 1.5);
    const x = c.getContext('2d');
    x.font = `800 ${WS_BASE}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineJoin = 'round'; x.lineWidth = WS_BASE * 0.18; x.strokeStyle = 'rgba(30,15,45,.55)';
    x.strokeText(text, c.width / 2, c.height / 2);
    x.fillStyle = '#fff'; x.fillText(text, c.width / 2, c.height / 2);
    sp = { c, w1: tw / WS_BASE };
    wordSpr.set(text, sp);
    return sp;
  }
  const wordW = new Map(); // ширина слова при 100px — measureText раз на слово
  function fitFontC(text, maxW, size, minSize = 7) {
    let w1 = wordW.get(text);
    if (w1 == null) { ctx.font = `800 100px ${FONT}`; w1 = ctx.measureText(text).width / 100; wordW.set(text, w1); }
    let fs = Math.floor(size);
    for (; fs > minSize; fs--) if (w1 * fs <= maxW) break;
    ctx.font = `800 ${fs}px ${FONT}`;
    return fs;
  }

  // ------------------------------------------------ стан
  let g = null;
  let gt = 0;
  let jobs = [];
  const after = (sec, fn) => jobs.push({ at: gt + sec, fn });
  let phase = 'intro';      // intro | count | run | end
  let paused = false;
  let overlay = null;
  const parts = [];         // екранні частинки
  const amb = [];
  let land = { far: [], near: [] };
  const lumi = lumiKit(), LO = { base: true, dpr: 1, sx: 1, sy: 1, rot: 0, blink: 0, mood: 'happy', t: 0, flap: 14, back: false };
  const objs = [], objCmp = (a, b) => b.z - a.z || (a.k === 0 ? 1 : b.k === 0 ? -1 : 0);
  let shX = 0, shY = 0;
  let shake = 0, flash = 0, flashC = '255,60,80', countT = 0;

  function newGame() {
    g = {
      rounds: buildRounds(app.content, wid, WORDS_N), idx: 0, row: null, rows: [], orbs: [], props: [],
      hearts: HEARTS, correct: 0, wrong: 0, combo: 0, bestCombo: 0, score: 0, orbsN: 0, xp: 0,
      speed: 0, want: SPEED0, dist: 0, spawnT: 0, finishSpawned: false,
      lumi: { x: 0, lane: 0, h: 0, vh: 0, step: 0, rot: 0, tilt: 0, sq: 0, sqv: 0, trip: 0, glance: 0, mood: 'happy', blink: 0, blinkT: 2, ant: 0, cheer: 0 },
    };
    // прогрів: усі слова партії малюються в спрайти до старту (без фризів під час бігу)
    try { for (const r of g.rounds) r.words.forEach(wordSprite); } catch (e) { /* ignore */ }
    // декор обабіч дороги
    for (let z = 3; z < Z_FAR; z += 3.2) {
      for (const side of [-1, 1]) if (Math.random() < 0.8) g.props.push(newProp(z + rnd(-1, 1), side));
    }
    parts.length = 0;
    jobs = []; shake = 0; flash = 0;
    paintHud();
  }
  const newProp = (z, side) => ({ z, side, x: side * rnd(2.3, 4.2), s: rnd(0.8, 1.25), v: Math.floor(rnd(0, 3)) });

  function spawnRow() {
    const rd = g.rounds[g.idx];
    g.row = { z: Z_SPAWN, ...rd, judged: false, hit: -1, fade: 1, kind: 'gate', t: 0 };
    g.rows.push(g.row);
    _debug.answer = rd.ans;
    optsShow(rd.words);
    // світлячки-бонуси перед воротами
    const lane = Math.floor(rnd(0, 3)) - 1;
    for (let k = 0; k < 4; k++) g.orbs.push({ z: Z_SPAWN - 12 - k * 1.6, lane, taken: false, ph: rnd(0, 6) });
    hud.word.textContent = rd.ua;
    hud.word.classList.toggle('g-long', rd.ua.length > 14);
    hud.fb.textContent = '';
    hud.fb.className = 'g-qfb';
    hud.card.hidden = false;
    hud.card.classList.remove('g-pop'); void hud.card.offsetWidth; hud.card.classList.add('g-pop');
  }
  function spawnFinish() {
    g.finishSpawned = true;
    g.row = { z: Z_SPAWN, kind: 'finish', judged: false, fade: 1, t: 0 };
    g.rows.push(g.row);
    hud.word.textContent = tr('runner.finish');
    hud.fb.textContent = tr('runner.last');
    hud.fb.className = 'g-qfb';
    _debug.answer = -1;
  }

  function judge(row) {
    row.judged = true;
    const L = g.lumi;
    if (row.kind === 'finish') return win();
    const lane = L.lane + 1;
    row.hit = lane;
    const ok = lane === row.ans;
    if (row.kind !== 'finish') optsJudge(row.ans, lane);
    const gx = SX(lane - 1, zP + 0.3), gy = SY(zP + 0.3, 1.2);
    if (ok) {
      g.correct += 1; g.combo += 1; g.bestCombo = Math.max(g.bestCombo, g.combo);
      const pts = 100 + Math.min(10, g.combo - 1) * 20;
      g.score += pts; g.xp += XP_PER_CORRECT;
      try { S.onCorrectAnswer(st); S.addXP(st, XP_PER_CORRECT); } catch (e) { console.warn(e); }
      dirty = true; // зберігаємо в кінці/на виході: app.save() під час гри смикає приховану topbar
      // v10: швидкість стала — без прискорення після кожних воріт
      hap(app, 'success'); sfx('correct');
      burst(gx, gy, 26, ['#ffd84a', '#fff', th.accent, '#9cf5b8', '#b9a2ff'], 1.2);
      ring(gx, gy, '#9cf5b8');
      textPop(gx, gy - 30, `+${pts}`, '#ffd23f');
      textPop(SX(L.x, zP), SY(zP) - LW * 0.75, `+${XP_PER_CORRECT} XP`, '#9cf5b8', 0.9, -150);
      if (g.combo >= 3 && g.combo % 3 === 0) { textPop(W / 2, hy + 40, `${tr('runner.combo', { 0: g.combo })}`, '#ff8a3c', 1.3); flash = 0.25; flashC = '255,220,120'; }
      L.vh = 4.2; L.glance = 0.7; L.mood = 'joy'; L.sqv -= 6;
      hud.fb.className = 'g-qfb good';
      hud.fb.textContent = `✅ ${row.ua} = ${row.en}`;
      bumpScore();
    } else {
      g.wrong += 1; g.combo = 0; g.hearts -= 1;
      try { S.noteMiss(st, wid, row.en); } catch (e) { /* */ }
      g.want = SPEED0;
      g.speed = Math.max(SPEED0 * 0.55, g.speed * 0.5);
      hap(app, 'error'); sfx('wrong');
      shake = 7; flash = 0.45; flashC = '255,60,80';
      burst(gx, gy, 16, ['#ff6b6b', '#ffb3b3', '#fff'], 1);
      L.trip = 0.75; L.vh = 3.2; L.mood = 'hurt'; L.glance = 1.1;
      hud.fb.className = 'g-qfb bad';
      hud.fb.innerHTML = `${tr('runner.oops')} <b>${esc(row.ua)}</b> = <b>${esc(row.en)}</b>`;
      textPop(SX(L.x, zP), SY(zP) - LW * 0.9, '−1 ❤️', '#ff5f6d');
      bumpHeart();
    }
    paintHud();
    g.idx += 1;
    g.row = null;
    if (g.hearts <= 0) return lose();
    g.spawnT = ok ? 0.45 : 1.1;
  }

  function win() {
    phase = 'end'; _debug.phase = 'end';
    const L = g.lumi;
    g.want = 0;
    L.cheer = 1; L.vh = 5; L.glance = 9; L.mood = 'joy';
    hud.card.hidden = true; optsHide();
    for (let k = 0; k < 5; k++) after(0.1 + k * 0.28, () => { burst(rnd(W * 0.15, W * 0.85), rnd(hy - 80, hy + 60), 24, ['#ffd84a', '#ff8fb1', '#9fd8ff', '#b9a2ff', '#fff'], 1.5); hap(app, 'light'); });
    after(0.2, () => fx('confetti'));
    after(1.9, () => finish(true));
  }
  function lose() {
    phase = 'end'; _debug.phase = 'end';
    g.want = 0;
    hud.card.hidden = true; optsHide();
    g.lumi.trip = 9; g.lumi.mood = 'hurt'; g.lumi.glance = 9;
    after(1.5, () => finish(false));
  }

  // ------------------------------------------------ частинки (екранні)
  // v17: пул частинок (без алокацій у кадрі), іскри й тексти — готові спрайти
  const pool = [];
  function part(t, x, y, vx, vy, max) {
    const q = pool.pop() || { t: '', x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, s: 0, c: '', r: 0, vr: 0, text: '', size: 1, img: null };
    q.t = t; q.x = x; q.y = y; q.vx = vx; q.vy = vy; q.life = 0; q.max = max; q.img = null;
    if (parts.length < 160) parts.push(q); else pool.push(q);
    return q;
  }
  const starSpr = new Map();
  function starSprite(c) {
    let sp = starSpr.get(c);
    if (sp) return sp;
    sp = mkC(24 * dpr, 24 * dpr); const x = sp.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 12 * dpr, 12 * dpr); x.fillStyle = c; starPath(x, 0, 0, 11, 0, 0.45); x.fill();
    starSpr.set(c, sp); return sp;
  }
  const popSpr = new Map();
  function popSprite(text, c) {
    const key = text + '|' + c;
    let sp = popSpr.get(key);
    if (sp) return sp;
    const m = mkC(4, 4).getContext('2d'); m.font = `900 22px ${FONT}`;
    const w = Math.ceil(m.measureText(text).width) + 14, h = 34;
    sp = mkC(w * dpr * 1.3, h * dpr * 1.3); const x = sp.getContext('2d');
    x.setTransform(dpr * 1.3, 0, 0, dpr * 1.3, 0, 0);
    x.font = `900 22px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    x.lineWidth = 5; x.strokeStyle = 'rgba(40,20,60,.75)'; x.strokeText(text, w / 2, h / 2);
    x.fillStyle = c; x.fillText(text, w / 2, h / 2);
    sp.w = w; sp.h = h;
    if (popSpr.size > 60) popSpr.clear();
    popSpr.set(key, sp); return sp;
  }
  function burst(x, y, n, colors, power = 1) {
    if (reduced()) n = Math.min(n, 5); else if (perfLite()) n = Math.ceil(n * 0.55);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = rnd(120, 380) * power;
      const q = part('spark', x, y, Math.cos(a) * v, Math.sin(a) * v - 120, rnd(0.6, 1.1));
      q.s = rnd(4, 9); q.c = colors[i % colors.length]; q.r = rnd(0, 6); q.vr = rnd(-8, 8);
    }
  }
  function ring(x, y, c) { part('ring', x, y, 0, 0, 0.5).c = c; }
  function textPop(x, y, text, c, size = 1, vy = -60) { const q = part('text', x, y, 0, vy, 1.2); q.text = text; q.c = c; q.size = size; }
  function dust(x, y, n) {
    if (perfLite()) n = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) part('dust', x + rnd(-10, 10), y, rnd(-80, 80), rnd(10, 60), rnd(0.3, 0.6)).s = rnd(3, 7);
  }
  function initAmbient() {
    amb.length = 0;
    const n = reduced() ? 10 : (th.part === 'stars' ? 50 : 28) >> (perfLite() ? 1 : 0);
    for (let i = 0; i < n; i++) amb.push({ x: Math.random(), y: Math.random(), s: rnd(0.5, 1.3), ph: rnd(0, 6.28), sp: rnd(0.6, 1.4) });
  }
  function buildLand() {
    if (land && land.W === W) return; // той самий розмір — силуети не перегенеровуємо
    // силуети на горизонті: два шари, період P (повторюються)
    const P = W * 1.6;
    const mk = (n, hmin, hmax) => Array.from({ length: n }, (_, i) => ({ x: (i / n) * P + rnd(-10, 10), w: rnd(0.6, 1.3), h: rnd(hmin, hmax), v: Math.random() }));
    land = { P, W, far: mk(9, 40, 90), near: mk(12, 22, 55) };
  }

  // ------------------------------------------------ цикл
  let raf = 0, last = 0, running = false;
  const watch = fpsWatch(() => { if (alive) { amb.length = Math.ceil(amb.length / 2); resize(); } });
  function start() {
    if (running || !alive) return;
    running = true; _debug.running = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    running = false; _debug.running = false;
    cancelAnimationFrame(raf); raf = 0;
  }
  function loop(now) {
    if (!running || !alive) return;
    _debug.frames += 1;
    const dt = Math.min(0.033, Math.max(0, (now - last) / 1000));
    watch(now - last);
    last = now;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function update(dt) {
    gt += dt;
    if (jobs.length) {
      const due = jobs.filter((j) => j.at <= gt);
      if (due.length) { jobs = jobs.filter((j) => j.at > gt); due.forEach((j) => { try { j.fn(); } catch (e) { console.error(e); } }); }
    }
    // фон живе навіть без партії
    const spd = g ? g.speed : 2.5;
    curve = Math.sin(((g ? g.dist : gt * 2.5) * 0.018)) * 1.1;
    curveAcc += curve * spd * dt * 0.02;
    shake = Math.max(0, shake - dt * 30);
    flash = Math.max(0, flash - dt * 1.6);
    for (const q of parts) {
      q.life += dt;
      if (q.t === 'spark') { q.vy += 520 * dt; q.vx *= 0.985; q.r += q.vr * dt; }
      q.x += q.vx * dt; q.y += q.vy * dt;
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i].life < parts[i].max) continue;
      pool.push(parts[i]); parts[i] = parts[parts.length - 1]; parts.length -= 1;
    }
    if (!g) { idleDist += spd * dt; return; }
    const L = g.lumi;
    // швидкість
    if (phase === 'count') g.want = SPEED0 * clamp((gt - countT) / 2.4, 0.15, 1);
    g.speed = lerp(g.speed, g.want, 1 - Math.exp(-dt * (g.want < g.speed ? 2.2 : 1.2)));
    const dz = g.speed * dt;
    g.dist += dz;
    for (const r of g.rows) {
      r.z -= dz; r.t += dt;
      if (r.judged) r.fade = Math.max(0, r.fade - dt * 4);
    }
    g.rows = g.rows.filter((r) => r.z > 0.4 && r.fade > 0);
    for (const o of g.orbs) {
      o.z -= dz;
      if (!o.taken && o.z <= zP + 0.05 && o.z > zP - 0.6 && Math.abs(L.x - o.lane) < 0.45 && L.trip <= 0) {
        o.taken = true; g.orbsN += 1; g.score += 10;
        const x = SX(o.lane, zP), y = SY(zP, 0.45);
        burst(x, y, 7, ['#fff6a8', '#ffd84a', '#fff'], 0.5);
        if (g.orbsN % 2) hap(app, 'light');
        sfx('coin');
        bumpScore();
      }
    }
    g.orbs = g.orbs.filter((o) => o.z > 0.5 && !o.taken);
    for (const p of g.props) { p.z -= dz; if (p.z < 0.6) { p.z += Z_FAR - 4; p.x = p.side * rnd(2.3, 4.2); p.v = Math.floor(rnd(0, 3)); } }
    // ворота
    if (phase === 'run') {
      if (g.row && !g.row.judged && g.row.z <= zP + 0.05) judge(g.row);
      if (phase === 'run' && !g.row) {
        g.spawnT -= dt;
        if (g.spawnT <= 0) {
          if (g.idx < WORDS_N && g.idx < g.rounds.length) spawnRow();
          else if (!g.finishSpawned) spawnFinish();
        }
      }
    }
    // Лумі
    if (g.row && !g.row.judged && optLane !== L.lane) { optLane = L.lane; hud.optB.forEach((b, i) => b.classList.toggle('on', i === L.lane + 1)); }
    L.x = lerp(L.x, L.lane, 1 - Math.exp(-dt * 13));
    L.tilt = lerp(L.tilt, (L.lane - L.x) * 0.55, 1 - Math.exp(-dt * 18));
    L.step += dt * (4 + g.speed * 1.1);
    L.vh -= 14 * dt; L.h += L.vh * dt;
    if (L.h <= 0) {
      if (L.vh < -2) { L.sqv += 8; dust(SX(L.x, zP), SY(zP), 4); }
      L.h = 0; L.vh = 0;
      if (L.cheer > 0 && phase === 'end') L.vh = 3.6; // радісні підскоки на фініші
    }
    L.sqv += (-260 * L.sq - 13 * L.sqv) * dt;
    L.sq += L.sqv * dt;
    if (L.trip > 0) { L.trip -= dt; L.rot = phase === 'end' && g.hearts <= 0 ? lerp(L.rot, 1.35, 1 - Math.exp(-dt * 6)) : Math.sin(L.trip * 18) * 0.5 * Math.min(1, L.trip * 2); }
    else L.rot = lerp(L.rot, L.tilt, 1 - Math.exp(-dt * 12));
    L.glance = Math.max(0, L.glance - dt);
    if (L.glance <= 0 && L.trip <= 0) L.mood = 'happy';
    L.ant = lerp(L.ant, clamp(-(L.lane - L.x) * 0.4 - L.vh * 0.03, -0.35, 0.35), 1 - Math.exp(-dt * 12));
    L.blinkT -= dt; if (L.blinkT < 0) { L.blink = 1; L.blinkT = rnd(1.8, 4); }
    L.blink = Math.max(0, L.blink - dt * 8);
    camX = lerp(camX, L.x * 0.35, 1 - Math.exp(-dt * 6));
  }
  let idleDist = 0;

  // ------------------------------------------------ малювання
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const T = gt;
    const dist = g ? g.dist : idleDist;
    ctx.save();
    // v17: коротка затухаюча тряска (синус, без рандомного «тремтіння»)
    if (shake > 0 && !reduced()) { shX = Math.sin(T * 83) * shake * 0.7; shY = Math.cos(T * 61) * shake * 0.45; ctx.translate(shX, shY); }
    else shX = shY = 0;
    // небо — окреме статичне полотно під грою (.g-skyl); тут лише чистимо кадр
    if (spr.k !== dpr) buildCache();
    ctx.clearRect(-20, -20, W + 40, H + 40);
    const sunX = W * 0.74 - curveAcc * 40 % W - camX * 6, sunY = hy * 0.42;
    blit(spr.sun, sunX - 130, sunY - 130);
    drawSkyAmbient(T);
    drawLand(land.far, th.far, 0.25, 1);
    drawLand(land.near, th.near, 0.6, 0.7);
    // земля і дорога
    drawRoad(dist);
    // об'єкти від далеких до близьких
    let on = 0;
    const put = (z, k, o) => { const e = objs[on] || (objs[on] = { z: 0, k: 0, o: null }); e.z = z; e.k = k; e.o = o; on += 1; };
    if (g) {
      for (const p of g.props) put(p.z, 1, p);
      for (const o of g.orbs) put(o.z, 2, o);
      for (const r of g.rows) put(r.z, 3, r);
    }
    put(zP, 0, null);
    objs.length = on;
    objs.sort(objCmp);
    for (let i = 0; i < on; i++) {
      const o = objs[i];
      if (o.z <= zNear * 0.55) continue;
      if (o.k === 1) drawProp(o.o, T); else if (o.k === 2) drawOrb(o.o, T); else if (o.k === 3) drawRow(o.o, T); else drawPlayer();
    }
    // лінії швидкості
    if (g && g.speed > 9.5 && !reduced()) {
      const k = clamp((g.speed - 9.5) / 4, 0, 1);
      ctx.strokeStyle = `rgba(255,255,255,${0.35 * k})`; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const side = i % 2 ? 1 : -1;
        const a = ((T * 3 + i * 0.37) % 1);
        const y = hy + (H - hy) * (0.15 + ((i * 0.29 + T * 1.7) % 0.8));
        const x = W / 2 + side * (W * 0.38 + a * W * 0.2);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + side * 40 * (0.5 + a), y + 18 * (0.5 + a)); ctx.stroke();
      }
    }
    drawParts();
    ctx.restore();
    // відлік
    if (phase === 'count') {
      const t = gt - countT;
      const n = 3 - Math.floor(t / 0.8);
      const k = (t % 0.8) / 0.8;
      const label = n > 0 ? String(n) : tr('runner.go');
      ctx.save();
      ctx.globalAlpha = 1 - Math.max(0, k - 0.6) / 0.4;
      ctx.translate(W / 2, H * 0.42);
      const sc = 0.6 + Math.min(1, k * 4) * 0.6 - Math.max(0, k - 0.25) * 0.2;
      ctx.scale(sc, sc);
      ctx.font = `900 ${n > 0 ? 96 : 52}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(43,29,58,.8)'; ctx.strokeText(label, 0, 0);
      ctx.fillStyle = n > 0 ? '#fff' : '#ffd23f'; ctx.fillText(label, 0, 0);
      ctx.restore();
    }
    if (flash > 0) {
      ctx.globalAlpha = Math.min(1, flash * 0.8);
      blit(vignette(flashC), 0, 0);
      ctx.globalAlpha = 1;
    }
  }

  function drawSkyAmbient(T) {
    for (const a of amb) {
      const x = a.x * W, y = a.y * hy;
      if (th.part === 'stars') {
        const k = 0.3 + 0.7 * Math.abs(Math.sin(T * 1.3 * a.sp + a.ph));
        ctx.fillStyle = `rgba(255,248,200,${k})`; starPath(ctx, x, y * 0.95, 1.6 * a.s + k, 0, 0.4); ctx.fill();
      } else if (th.part === 'snow') {
        const yy = (a.y * H + T * 40 * a.sp) % H;
        ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc((x + Math.sin(T + a.ph) * 14 + W) % W, yy, 2.2 * a.s, 0, 7); ctx.fill();
      } else if (th.part === 'pollen') {
        const xx = (x + T * 18 * a.sp) % W, yy = a.y * H * 0.9 + Math.sin(T + a.ph) * 8;
        ctx.fillStyle = `rgba(255,236,140,${0.5 + 0.3 * Math.sin(T * 2 + a.ph)})`; ctx.beginPath(); ctx.arc(xx, yy, 2 * a.s, 0, 7); ctx.fill();
      } else if (th.part === 'firefly') {
        const xx = x + Math.sin(T * 0.8 * a.sp + a.ph) * 20, yy = hy * 0.6 + a.y * H * 0.5 + Math.cos(T * 0.6 + a.ph) * 12;
        const k = 0.5 + 0.5 * Math.sin(T * 3 * a.sp + a.ph);
        if (k > 0.003) { ctx.globalAlpha = k; ctx.drawImage(spr.fly, xx - 8 * a.s, yy - 8 * a.s, 16 * a.s, 16 * a.s); ctx.globalAlpha = 1; }
      } else {
        const yy = (((a.y * H - T * 30 * a.sp) % H) + H) % H;
        ctx.fillStyle = `rgba(255,${190 + 40 * Math.sin(a.ph)},110,${0.45 + 0.4 * Math.sin(T * 4 + a.ph)})`;
        ctx.fillRect(x + Math.sin(T + a.ph) * 6, yy, 2.4 * a.s, 2.4 * a.s);
      }
    }
  }
  function drawLand(items, color, par, sc) {
    const P = land.P;
    const off = (((-curveAcc * 300 * par - camX * 40 * par) % P) + P) % P;
    ctx.fillStyle = color;
    const base = hy + 1;
    for (let rep = -1; rep <= 1; rep++) {
      for (const it of items) {
        const x = it.x + off + rep * P - P * 0.3;
        if (x < -150 || x > W + 150) continue;
        const h = it.h * sc, w = 60 * it.w * (sc + 0.3);
        ctx.fillStyle = color;
        switch (th.land) {
          case 'pines':
            for (const dx of [-w * 0.4, 0, w * 0.4]) {
              const hh = h * (dx ? 0.75 : 1);
              ctx.beginPath(); ctx.moveTo(x + dx - w * 0.28, base); ctx.lineTo(x + dx, base - hh); ctx.lineTo(x + dx + w * 0.28, base); ctx.fill();
            }
            break;
          case 'towers': {
            ctx.fillRect(x - w * 0.3, base - h, w * 0.6, h);
            ctx.beginPath(); ctx.moveTo(x - w * 0.36, base - h); ctx.lineTo(x, base - h - w * 0.35); ctx.lineTo(x + w * 0.36, base - h); ctx.fill();
            if (it.v > 0.4) {
              ctx.fillStyle = hexA('#fff3d6', 0.75); ctx.beginPath(); ctx.arc(x, base - h * 0.7, w * 0.16, 0, 7); ctx.fill();
              ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, base - h * 0.7); ctx.lineTo(x + w * 0.1, base - h * 0.7 - w * 0.06); ctx.stroke();
            }
            break;
          }
          case 'peaks':
            ctx.beginPath(); ctx.moveTo(x - w, base); ctx.lineTo(x, base - h * 1.3); ctx.lineTo(x + w, base); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,.9)';
            ctx.beginPath(); ctx.moveTo(x - w * 0.3, base - h * 0.91); ctx.lineTo(x, base - h * 1.3); ctx.lineTo(x + w * 0.3, base - h * 0.91);
            ctx.lineTo(x + w * 0.1, base - h * 0.97); ctx.lineTo(x - w * 0.08, base - h * 0.9); ctx.closePath(); ctx.fill();
            break;
          case 'domes':
            ctx.beginPath(); ctx.ellipse(x, base, w, h * 0.8, 0, Math.PI, 0); ctx.fill();
            if (it.v > 0.7) { ctx.fillStyle = 'rgba(255,230,140,.85)'; ctx.fillRect(x - 3, base - h * 0.55, 6, 8); }
            break;
          default:
            ctx.beginPath(); ctx.ellipse(x, base, w * 1.1, h * 0.8, 0, Math.PI, 0); ctx.fill();
            if (it.v > 0.5) { ctx.beginPath(); ctx.arc(x + w * 0.3, base - h * 0.75, h * 0.18, 0, 7); ctx.fill(); }
        }
      }
    }
  }
  function drawRoad(dist) {
    const seg = 1.6;
    const off = dist % seg;
    const base = Math.floor(dist / seg);
    const N = Math.ceil(Z_FAR / seg);
    for (let i = N; i >= 0; i--) {
      const a = i * seg - off;
      const z0 = Math.max(zNear * 0.9, a), z1 = a + seg;
      if (z1 <= zNear * 0.9) continue;
      const y0 = Math.min(H + 2, SY(z0)), y1 = SY(z1);
      if (y0 - y1 < 0.3 && z1 > 10) { /* дуже далеко — тонко */ }
      const par = (i + base) % 2;
      ctx.fillStyle = par ? th.g1 : th.g2;
      ctx.fillRect(-20, y1, W + 40, y0 - y1 + 1);
      const quad = (xa, xb, c) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(SX(xa, z1), y1); ctx.lineTo(SX(xb, z1), y1); ctx.lineTo(SX(xb, z0), y0); ctx.lineTo(SX(xa, z0), y0); ctx.closePath(); ctx.fill();
      };
      quad(-1.72, 1.72, par ? th.rum1 : th.rum2);
      quad(-1.5, 1.5, par ? th.r1 : th.r2);
      if (par) { quad(-0.53, -0.47, th.lane); quad(0.47, 0.53, th.lane); }
    }
    // туман на горизонті
    blit(spr.fog, -20, hy - 2);
  }
  function fogA(z) { return clamp((Z_FAR * 0.75 - z) / (Z_FAR * 0.3), 0, 1); }
  function drawProp(p, T) {
    const k = kz(p.z) * p.s;
    const x = SX(p.x, p.z), y = SY(p.z);
    if (y < hy || x < -k * 2 || x > W + k * 2) return;
    ctx.save();
    ctx.globalAlpha = fogA(p.z);
    ctx.translate(x, y);
    ctx.scale(k / 100, k / 100);   // малюємо в «сотих одиниці»
    switch (th.prop) {
      case 'pine':
        ctx.fillStyle = '#5a3b22'; ctx.fillRect(-7, -30, 14, 30);
        for (const [w, yy, c] of [[70, -30, '#2f6b3d'], [56, -70, '#37794a'], [40, -105, '#418a55']]) {
          ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-w, yy); ctx.lineTo(0, yy - 70); ctx.lineTo(w, yy); ctx.closePath(); ctx.fill();
        }
        break;
      case 'lamp':
        ctx.fillStyle = '#6f3e20'; ctx.fillRect(-5, -150, 10, 150);
        ctx.fillStyle = '#d98a45'; ctx.beginPath(); ctx.arc(0, -165, 24, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff3d6'; ctx.beginPath(); ctx.arc(0, -165, 17, 0, 7); ctx.fill();
        ctx.strokeStyle = '#6f3e20'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -165); ctx.lineTo(0, -177); ctx.moveTo(0, -165); ctx.lineTo(9 * Math.cos(T), -165 + 9 * Math.sin(T)); ctx.stroke();
        break;
      case 'crystal':
        for (const [dx, h, c] of [[-22, 70, '#bfe6ff'], [16, 100, '#e6f6ff'], [40, 55, '#9fd3ff']]) {
          ctx.fillStyle = c; ctx.strokeStyle = 'rgba(80,130,200,.6)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(dx - 14, 0); ctx.lineTo(dx - 12, -h * 0.75); ctx.lineTo(dx, -h); ctx.lineTo(dx + 12, -h * 0.75); ctx.lineTo(dx + 14, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        break;
      case 'lantern': {
        ctx.fillStyle = '#3a2a80'; ctx.fillRect(-4, -120, 8, 120);
        const k2 = 0.6 + 0.4 * Math.sin(T * 3 + p.x);
        ctx.globalAlpha *= k2; ctx.drawImage(spr.lan, -50, -185, 100, 100); ctx.globalAlpha /= k2;
        ctx.fillStyle = '#ffe27a'; starPath(ctx, 0, -135, 18, T * 0.5, 0.45); ctx.fill();
        break;
      }
      default: // дерево-кулька + квіточки
        ctx.fillStyle = '#8a6240'; ctx.fillRect(-8, -60, 16, 60);
        ctx.fillStyle = p.v === 1 ? '#6cc05a' : '#5fb44f';
        for (const [dx, dy, r] of [[-26, -80, 34], [24, -82, 32], [0, -112, 40]]) { ctx.beginPath(); ctx.arc(dx, dy, r, 0, 7); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(-10, -125, 14, 0, 7); ctx.fill();
        if (p.v === 2) { ctx.fillStyle = '#ff7aa8'; for (const dx of [-40, 30, 48]) { ctx.beginPath(); ctx.arc(dx, -6, 8, 0, 7); ctx.fill(); } }
    }
    ctx.restore();
  }
  function drawOrb(o, T) {
    if (o.taken) return;
    const k = kz(o.z);
    const x = SX(o.lane, o.z), y = SY(o.z, 0.42 + Math.sin(T * 4 + o.ph) * 0.05);
    if (y < hy) return;
    const r = k * 0.11;
    ctx.save(); ctx.globalAlpha = fogA(o.z);
    ctx.drawImage(spr.orb, x - r * 3, y - r * 3, r * 6, r * 6);
    ctx.fillStyle = '#fff6c8'; starPath(ctx, x, y, r * 1.2, T * 2 + o.ph, 0.5); ctx.fill();
    ctx.fillStyle = 'rgba(40,20,60,.18)'; ell(ctx, x, SY(o.z), r * 0.9, r * 0.25); ctx.fill();
    ctx.restore();
  }
  function drawRow(r, T) {
    const z = r.z;
    const k = kz(z);
    const yG = SY(z);
    if (yG < hy - 2) return;
    ctx.save();
    ctx.globalAlpha = clamp((Z_SPAWN - z) / 5, 0, 1) * r.fade;
    if (r.kind === 'finish') {
      const xl = SX(-1.6, z), xr = SX(1.6, z), top = SY(z, 1.7), bh = k * 0.36;
      ctx.fillStyle = '#5b3b2a'; ctx.fillRect(xl - k * 0.05, top, k * 0.1, yG - top); ctx.fillRect(xr - k * 0.05, top, k * 0.1, yG - top);
      const cells = 16, cw = (xr - xl) / cells;
      for (let i = 0; i < cells; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#2b1d3a' : '#fff'; ctx.fillRect(xl + i * cw, top + j * bh / 2, cw + 0.5, bh / 2 + 0.5); }
      ctx.restore();
      return;
    }
    if (r.judged && z < zP + 0.25) { ctx.restore(); return; } // пройдені ворота не перекривають Лумі
    const ws = r.words;
    for (let i = 0; i < 3; i++) {
      const cx = i - 1;
      const xl = SX(cx - 0.46, z), xr = SX(cx + 0.46, z);
      const top = SY(z, 1.5), bTop = SY(z, 1.48), bBot = SY(z, 1.05);
      const judged = r.judged;
      const good = judged && i === r.ans, bad = judged && i === r.hit && i !== r.ans;
      const wob = bad ? Math.sin(T * 50) * k * 0.03 : 0;
      // стовпчики
      ctx.fillStyle = th.gateDk;
      ctx.fillRect(xl - k * 0.04 + wob, top, k * 0.08, yG - top);
      ctx.fillRect(xr - k * 0.04 + wob, top, k * 0.08, yG - top);
      // табличка
      const bw = xr - xl, bh = bBot - bTop;
      ctx.fillStyle = good ? '#2fbf71' : bad ? '#ef4f5f' : th.gate;
      rrect(ctx, xl - k * 0.02 + wob, bTop, bw + k * 0.04, bh, Math.max(2, k * 0.08)); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      rrect(ctx, xl + k * 0.03 + wob, bTop + bh * 0.1, bw - k * 0.06, bh * 0.22, Math.max(1, k * 0.04)); ctx.fill();
      ctx.strokeStyle = 'rgba(40,20,60,.45)'; ctx.lineWidth = Math.max(1, k * 0.018);
      rrect(ctx, xl - k * 0.02 + wob, bTop, bw + k * 0.04, bh, Math.max(2, k * 0.08)); ctx.stroke();
      // зірочка на арці
      ctx.fillStyle = th.accent; starPath(ctx, (xl + xr) / 2 + wob, bTop - k * 0.04, k * 0.07, T * 2, 0.45); ctx.fill();
      // слово
      if (k > 9) {
        // v9-perf: слово — готовий спрайт (малюється раз), у кадрі лише drawImage з масштабом.
        // v17: видно здалеку — мінімум ~12px (але не ширше за відстань між доріжками)
        const sp = wordSprite(ws[i]);
        const lo = Math.max(8, Math.min(12, (k * 0.98) / sp.w1));
        const fs = Math.max(lo, Math.min(Math.min(26, bh * 0.62), (bw - k * 0.06) / sp.w1));
        const sc = fs / WS_BASE;
        const dw = sp.c.width * sc, dh = sp.c.height * sc;
        ctx.drawImage(sp.c, (xl + xr) / 2 + wob - dw / 2, (bTop + bBot) / 2 + fs * 0.05 - dh / 2, dw, dh);
      }
      // легке сяйво під воротами (доріжка-ціль)
      if (!judged && z < 14) {
        ctx.fillStyle = hexA('#ffffff', 0.12 * (1 - z / 14));
        ctx.beginPath(); ctx.moveTo(xl, yG); ctx.lineTo(xr, yG); ctx.lineTo(SX(cx + 0.46, z - 1), SY(z - 1)); ctx.lineTo(SX(cx - 0.46, z - 1), SY(z - 1)); ctx.fill();
      }
    }
    ctx.restore();
  }
  function drawPlayer() {
    if (!g) {
      // на екрані старту — Лумі підстрибує на місці
      const r = LW * 0.26;
      LO.dpr = dpr; LO.sx = LO.sy = 1; LO.rot = Math.sin(gt * 2) * 0.06; LO.mood = 'happy'; LO.back = false; LO.t = gt; LO.flap = 14;
      LO.blink = (gt % 3) < 0.1 ? 1 : 0;
      lumi.draw(ctx, SX(0, zP), SY(zP) - 2 - Math.abs(Math.sin(gt * 3)) * r * 0.25, r * 0.78, LO);
      return;
    }
    const L = g.lumi;
    const r = LW * 0.26;
    const x = SX(L.x, zP), yG = SY(zP);
    const hpx = L.h * kz(zP) * 0.35;
    // тінь
    ctx.fillStyle = 'rgba(30,10,50,.25)';
    ell(ctx, x, yG + 2, r * 0.95 / (1 + hpx / 120), r * 0.24 / (1 + hpx / 120)); ctx.fill();
    const bounce = phase === 'intro' ? 0 : Math.abs(Math.sin(L.step * 0.5)) * r * 0.16 * (g.speed > 1 ? 1 : 0);
    const run = g.speed > 1 && L.h <= 0.01;
    const sqRun = run ? (1 - Math.abs(Math.sin(L.step * 0.5))) * 0.08 : 0;
    const sy = clamp(1 - L.sq * 0.4 - sqRun + (L.vh > 0 ? 0.08 : 0), 0.62, 1.3), sx = clamp(1 + L.sq * 0.4 + sqRun * 0.8, 0.75, 1.4);
    const back = L.glance <= 0 && L.trip <= 0 && phase !== 'intro';
    LO.dpr = dpr; LO.sx = sx; LO.sy = sy; LO.rot = L.rot + L.ant * 0.3; LO.blink = L.blink; LO.mood = L.mood; LO.t = gt; LO.back = back;
    LO.flap = run ? 20 : 12;
    lumi.draw(ctx, x, yG - hpx - bounce - 2, r * 0.78, LO);
  }
  function drawParts() {
    for (const q of parts) {
      const k = q.life / q.max;
      if (q.t === 'spark') {
        const sz = q.s * (1 - k * 0.5), c = Math.cos(q.r) * sz / 11, sn = Math.sin(q.r) * sz / 11;
        ctx.globalAlpha = 1 - k;
        ctx.setTransform(dpr * c, dpr * sn, -dpr * sn, dpr * c, q.x * dpr + shX * dpr, q.y * dpr + shY * dpr);
        ctx.drawImage(q.img || (q.img = starSprite(q.c)), -12, -12, 24, 24);
        ctx.setTransform(dpr, 0, 0, dpr, shX * dpr, shY * dpr); ctx.globalAlpha = 1;
      } else if (q.t === 'dust') {
        ctx.globalAlpha = 0.7 * (1 - k); ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(q.x, q.y, q.s * (0.6 + k), 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      } else if (q.t === 'ring') {
        ctx.globalAlpha = 1 - k; ctx.strokeStyle = q.c; ctx.lineWidth = 6 * (1 - k) + 1;
        ctx.beginPath(); ctx.arc(q.x, q.y, 20 + k * 90, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      } else if (q.t === 'text') {
        const sc = (k < 0.15 ? 0.6 + (k / 0.15) * 0.6 : 1.2 - Math.min(0.2, k - 0.15)) * (q.size || 1);
        const sp = q.img || (q.img = popSprite(q.text, q.c));
        ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
        ctx.drawImage(sp, q.x - sp.w * sc / 2, q.y - sp.h * sc / 2, sp.w * sc, sp.h * sc);
        ctx.globalAlpha = 1;
      }
    }
  }

  // ------------------------------------------------ HUD
  function paintHud() {
    if (!g) return;
    hud.hearts.innerHTML = Array.from({ length: HEARTS }, (_, i) => `<i class="${i < g.hearts ? '' : 'lost'}">❤️</i>`).join('');
    hud.prog.textContent = Math.min(WORDS_N, g.idx);
    hud.score.textContent = g.score;
    hud.combo.hidden = g.combo < 2;
    hud.comboN.textContent = g.combo;
  }
  function bumpScore() {
    hud.score.textContent = g.score;
    hud.scoreChip.classList.remove('g-bump'); void hud.scoreChip.offsetWidth; hud.scoreChip.classList.add('g-bump');
  }
  function bumpHeart() {
    const h = hud.hearts.children[g.hearts];
    if (h) { h.classList.remove('g-bump'); void h.offsetWidth; h.classList.add('g-bump'); }
  }

  // ------------------------------------------------ керування
  function setLane(l) {
    if (!g || paused || (phase !== 'run' && phase !== 'count')) return;
    if (g.lumi.trip > 0.4) return;
    const n = clamp(l, -1, 1);
    if (n === g.lumi.lane) return;
    g.lumi.lane = n;
    g.lumi.sqv -= 3;
    dust(SX(g.lumi.x, zP), SY(zP), 3);
    hap(app, 'light'); sfx('whoosh');
  }
  let ptr = null;
  function onDown(e) {
    if (paused || !g) return;
    ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), swiped: false };
  }
  function onMove(e) {
    if (!ptr || ptr.id !== e.pointerId || ptr.swiped) return;
    const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
    if (Math.abs(dx) > 26 && Math.abs(dx) > Math.abs(dy)) {
      ptr.swiped = true;
      setLane(g.lumi.lane + (dx > 0 ? 1 : -1));
    }
  }
  function onUp(e) {
    if (!ptr || ptr.id !== e.pointerId) return;
    const p = ptr; ptr = null;
    if (p.swiped || !g) return;
    if (Math.abs(e.clientX - p.x) > 14 || Math.abs(e.clientY - p.y) > 20) return;
    const r = cv.getBoundingClientRect();
    const x = e.clientX - r.left;
    // тап по доріжці: яка доріжка ближча на рівні Лумі
    const lane = Math.round((x - SX(0, zP)) / kz(zP));
    setLane(lane);
  }
  function onKey(e) {
    if (!alive || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'p' || e.key === 'P' || e.key === ' ') { if (phase !== 'intro' && !overlay) { e.preventDefault(); pause(); } return; }
    if (paused || !g) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); setLane(g.lumi.lane - 1); }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); setLane(g.lumi.lane + 1); }
    else if (/^[1-3]$/.test(e.key)) { e.preventDefault(); setLane(+e.key - 2); }
  }
  function onVis() { if (document.hidden && phase !== 'intro' && !overlay && alive) pause(); }
  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerup', onUp);
  cv.addEventListener('pointercancel', onUp);
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVis);
  canvasGameOn(true);

  // ------------------------------------------------ оверлеї
  function closeOverlay() {
    if (!overlay) return;
    const o = overlay; overlay = null;
    lumiRefs.forEach((l) => { try { l?.destroy?.(); } catch (e) { /* */ } });
    lumiRefs = [];
    o.classList.add('g-out');
    setTimeout(() => o.remove(), 220);
  }
  function intro() {
    phase = 'intro'; _debug.phase = 'intro';
    const best = gameStars(st, gameId);
    overlay = el('div', 'g-over g-intro');
    overlay.innerHTML = `<div class="g-card">
      <div class="g-card-ico">🏃</div>
      ${hard ? `<div class="g-hard-tag">${tr('common.hard_tag')}</div>` : ''}
      ${tr('runner.title')}
      <div class="g-sub">${esc(world.emoji || '')} ${esc(tc(world, 'name') || '')}${best ? `${tr('obby.best')}${'⭐'.repeat(best)}` : ''}</div>
      <div class="g-intro-lumi"></div>
      <ul class="g-rules">
        <li>${tr('runner.r1')}</li>
        <li>${tr('runner.r2')}</li>
        <li>${tr('runner.r3')}</li>
        <li>${tr('runner.r4', { 0: WORDS_N, 1: HEARTS })}</li>
        ${hard ? `<li>${tr('runner.r_hard', { 0: WORDS_N })}</li>` : ''}
      </ul>
      <div class="g-keys">${tr('runner.keys')}</div>
      <button class="g-btn g-btn-big g-btn-go" data-a="go">${tr('runner.run')}</button>
      ${inTg ? '' : '<button class="g-btn g-btn-ghost" data-a="back">' + tr('common.back') + '</button>'}
    </div>`;
    scr.append(overlay);
    lumiRefs.push(makeLumi(app, overlay.querySelector('.g-intro-lumi'), 88, 'cheer'));
    const bk = overlay.querySelector('[data-a=back]');
    if (bk) bk.onclick = () => { hap(app); app.back(); };
    overlay.querySelector('[data-a=go]').onclick = () => { hap(app, 'medium'); closeOverlay(); begin(); };
  }
  function begin() {
    newGame();
    phase = 'count'; _debug.phase = 'count';
    countT = gt;
    hud.card.hidden = true; optsHide();
    [0, 0.8, 1.6].forEach((s) => after(s, () => { hap(app, 'light'); sfx('countdown'); }));
    after(2.4, () => { if (!alive || !g) return; hap(app, 'medium'); sfx('go'); phase = 'run'; _debug.phase = 'run'; g.spawnT = 0.2; });
    start();
  }
  function pause() {
    if (paused || overlay || phase === 'intro' || !alive) return;
    paused = true;
    stop();
    _debug.phase = 'paused';
    overlay = el('div', 'g-over g-pausebox');
    overlay.innerHTML = `<div class="g-card g-card-sm">
      ${tr('obby.pause')}
      <div class="g-sub">${tr('runner.word_n', { 0: Math.min(WORDS_N, (g?.idx || 0) + 1), 1: WORDS_N })} · ❤️ ${g?.hearts ?? HEARTS} · ✨ ${g?.score || 0}</div>
      <button class="g-btn g-btn-big g-btn-go" data-a="resume">${tr('obby.resume')}</button>
      <button class="g-btn g-btn-big" data-a="restart">${tr('obby.restart')}</button>
      <button class="g-btn g-btn-big g-btn-ghost" data-a="exit">${tr('common.exit')}</button>
    </div>`;
    scr.append(overlay);
    const on = (a, fn) => { overlay.querySelector(`[data-a=${a}]`).onclick = () => { hap(app); fn(); }; };
    on('resume', () => { closeOverlay(); paused = false; _debug.phase = phase; start(); });
    on('restart', () => { closeOverlay(); paused = false; begin(); });
    on('exit', () => app.back());
  }

  function finish(win) {
    if (!alive || overlay) return;
    _debug.phase = 'result';
    hud.card.hidden = true; optsHide();
    const stars = win ? starsByRatio(g.correct / WORDS_N) : 0;
    const rec = recordGame(st, gameId, stars);
    app.save?.();
    dirty = false;
    hap(app, win ? 'success' : 'error');
    overlay = el('div', `g-over g-result ${win ? 'win' : 'lose'}`);
    overlay.innerHTML = `<div class="g-rays" aria-hidden="true"></div><div class="g-card">
      <div class="g-banner">${win ? tr('runner.win') : tr('runner.lose')}</div>
      <div class="g-stars"></div>
      <p class="g-sub">${win ? (stars === 3 ? tr('runner.perfect') : tr('runner.made')) : tr('runner.out')}</p>
      ${rec.isRecord ? '<div class="g-record">' + tr('common.record') + '</div>' : ''}
      <div class="g-stats">
        <div><span>${tr('runner.s_words')}</span><strong><b data-n="${g.correct}">0</b><em>/${WORDS_N}</em></strong></div>
        <div><span>${tr('runner.s_score')}</span><strong><b data-n="${g.score}">0</b></strong></div>
        <div><span>${tr('runner.s_combo')}</span><strong><b data-n="${g.bestCombo}">0</b></strong></div>
        <div><span>${tr('runner.s_orbs')}</span><strong><b data-n="${g.orbsN}">0</b></strong></div>
      </div>
      <div class="g-res-row"><div class="g-res-lumi"></div><div class="g-xp">+<b data-n="${g.xp}">0</b> XP</div></div>
      <div class="g-btns">
        <button class="g-btn g-btn-big" data-a="again">${tr('common.again')}</button>
        <button class="g-btn g-btn-big g-btn-go" data-a="next">${tr('common.next')}</button>
      </div>
    </div>`;
    scr.append(overlay);
    const ov = overlay;
    fx('starsDrop', ov.querySelector('.g-stars'), stars);
    sfx(win ? 'win' : 'lose'); starSfx(stars, 450);
    ov.querySelectorAll('[data-n]').forEach((b, k) => setTimeout(() => alive && fx('countUp', b, 0, +b.dataset.n, 700), 500 + k * 120));
    if (stars === 3) { setTimeout(() => alive && fx('confetti'), 700); setTimeout(() => alive && fx('confetti', { x: W * 0.3 }), 1500); }
    const lr = makeLumi(app, ov.querySelector('.g-res-lumi'), 70, win ? 'proud' : 'sad');
    lumiRefs.push(lr);
    setTimeout(() => alive && lr?.react?.('jump'), 1300);
    const on = (a, fn) => { ov.querySelector(`[data-a=${a}]`).onclick = () => { hap(app); fn(); }; };
    on('again', () => { closeOverlay(); begin(); });
    on('next', () => app.back());
  }

  // ------------------------------------------------ старт
  initAmbient();
  ro?.observe(scr);
  resize();
  intro();
  start();

  return () => {
    alive = false;
    stop();
    if (dirty) { dirty = false; try { app.save?.(); } catch (e) { console.warn(e); } }
    ro?.disconnect();
    cv.removeEventListener('pointerdown', onDown);
    cv.removeEventListener('pointermove', onMove);
    cv.removeEventListener('pointerup', onUp);
    cv.removeEventListener('pointercancel', onUp);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVis);
    canvasGameOn(false);
    lumiRefs.forEach((l) => { try { l?.destroy?.(); } catch (e) { /* */ } });
    jobs = [];
  };
}
