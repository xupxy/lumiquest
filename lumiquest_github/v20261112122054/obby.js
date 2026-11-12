// 🧗 Обі-Вежа — паркур-вежа з платформ. Питання (choice з уроків світу + слова WORDS[wid]),
// варіанти — платформи попереду. Правильна → стрибок угору; хибна → платформа розсипається,
// Лумі падає на чекпоінт (−1 ❤️). 12 стрибків до вершини, чекпоінти кожні 4 платформи.
// Рендер: <canvas> + rAF (зупиняється в cleanup/паузі), HUD і екрани — DOM (css/games.css).
import * as S from './state.js?v=20261112122053';
import * as FX from './fx.js?v=20261112122053';
import { recordGame, starsByRatio, gameStars } from './games.js?v=20261112122053';
import { tr, tc, twords, sfx, speak, starSfx } from './i18n_modes.js?v=20261112122053';
const isEn = (s) => !/[а-яіїєґё]/i.test(String(s || ''));

export const meta = { topbar: false };
/** Для тестів: кадри циклу, чи працює rAF, індекс правильного варіанта, фаза. */
export const _debug = { frames: 0, running: false, answer: -1, phase: '' };

const GOAL0 = 12;         // стрибків до вершини (виклик — 16)
const CP_EVERY = 4;       // чекпоінт кожні 4 платформи
const HEARTS0 = 3;        // ❤️ (виклик — 2)
const XP_PER_CORRECT = 10;
const G = 2700;           // гравітація, px/с²

// ---------------------------------------------------------------- дрібниці
const CSS_HREF = new URL('./games.css?v=20261112122053', import.meta.url).href;
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

// ---------------------------------------------------------------- теми світів
const THEMES = {
  // v11: проміжні світи — берег, вітряки, порт у сутінках
  w1b: { sky: ['#5fd0e0', '#b5ecf0', '#fff2cc'], high: '#2fb0cc', sun: '#fff3a8', far: '#7fd8d0', near: '#f0d59a', tower: '#e2bf80',
    top: '#f6dfa4', topHl: '#fff3cf', rock: '#c99a62', rockDk: '#96693c', accent: '#ff8e6b', part: 'pollen', deco: 'cloud', ink: '#12475a' },
  w1c: { sky: ['#ffc24a', '#ffe08e', '#fff3cf'], high: '#f2a818', sun: '#fff6c8', far: '#bfe07a', near: '#94cc58', tower: '#e8b54a',
    top: '#ffd866', topHl: '#fff1c4', rock: '#c98a1a', rockDk: '#8a5a12', accent: '#6baf3a', part: 'pollen', deco: 'cloud', ink: '#4a2c14' },
  // v19 · c6–c10
  c6: { sky: ['#ff9f4a', '#ffc27a', '#ffe9c2'], high: '#ff8a3a', sun: '#fff0b8', far: '#e8c27a', near: '#d2a060', tower: '#e3a86b',
    top: '#e9b98a', topHl: '#ffe3b0', rock: '#d2603a', rockDk: '#9a3a22', accent: '#e8323c', part: 'pollen', deco: 'cloud', ink: '#4a1e1a' },
  c7: { sky: ['#7fc0ec', '#b4dcf4', '#e6f4fb'], high: '#5ea8dc', sun: '#fff8d8', far: '#7c93b8', near: '#5e7aa2', tower: '#8a9bb4',
    top: '#7bb38a', topHl: '#e6f4fb', rock: '#6e7f8c', rockDk: '#4a5a66', accent: '#d52b1e', part: 'snow', deco: 'cloud', ink: '#1e2e3a' },
  c8: { sky: ['#3fc4e0', '#8fe0f0', '#ffe8c0'], high: '#1ba6b8', sun: '#fff3a8', far: '#c8552b', near: '#f6d294', tower: '#e8b872',
    top: '#ffe6b0', topHl: '#fff8e6', rock: '#c8552b', rockDk: '#8a3418', accent: '#f28a2e', part: 'pollen', deco: 'cloud', ink: '#3a2416' },
  c9: { sky: ['#3fbce6', '#8fdcf2', '#fff6c2'], high: '#2aa8d8', sun: '#fff6b0', far: '#5a7e6a', near: '#3e8e5a', tower: '#4cc86e',
    top: '#5cc27a', topHl: '#fff6c2', rock: '#3e8e5a', rockDk: '#1e5a34', accent: '#ffc21a', part: 'pollen', deco: 'cloud', ink: '#0e2a4a' },
  c10: { sky: ['#0e1030', '#3a2a6e', '#ff6fb5'], high: '#0a0c24', sun: '#fff4d6', far: '#22285a', near: '#1a1f48', tower: '#2a2e66',
    top: '#4a4e9a', topHl: '#ff9acd', rock: '#2a2e66', rockDk: '#14183a', accent: '#3ee6ff', part: 'stars', deco: 'star', ink: '#fff', dark: true },
  // v19 · Дизайн А — країни c1–c5
  c1: { sky: ['#9fb2cb', '#c6d2e2', '#eef0ea'], high: '#7f96b4', sun: '#fff6dc', far: '#b5c1d4', near: '#8db878', tower: '#4a5878',
    top: '#aeb6c4', topHl: '#e4eaf2', rock: '#7e8798', rockDk: '#555d6e', accent: '#d7263d', part: 'pollen', deco: 'cloud', ink: '#1c2742' },
  c2: { sky: ['#6fa8e0', '#a9cff2', '#ffe4bc'], high: '#4f8ad0', sun: '#fff0c8', far: '#9db3da', near: '#e2b85a', tower: '#4f6798',
    top: '#e2b85a', topHl: '#ffedb8', rock: '#9a6b3e', rockDk: '#6a4628', accent: '#ffc23c', part: 'pollen', deco: 'cloud', ink: '#1f2b4a' },
  c3: { sky: ['#ffc9d8', '#ffe2ea', '#fff3ec'], high: '#f7a1be', sun: '#ff8a7a', far: '#b6c0e6', near: '#9cc47a', tower: '#c8463a',
    top: '#9cc47a', topHl: '#d8f0c0', rock: '#c9c2b8', rockDk: '#8a8496', accent: '#e0452b', part: 'pollen', deco: 'leaf', ink: '#2b2a4c' },
  c4: { sky: ['#a9c0f0', '#d0dcf8', '#ffe8e4'], high: '#8aa6e6', sun: '#fff4ec', far: '#c9b6ff', near: '#9cc47a', tower: '#5c5470',
    top: '#c9b6ff', topHl: '#ede4ff', rock: '#f6e9d6', rockDk: '#b8a890', accent: '#8c6fd6', part: 'pollen', deco: 'cloud', ink: '#24224a' },
  c5: { sky: ['#ffa66e', '#ffc994', '#fff1d8'], high: '#f2885a', sun: '#fff0c8', far: '#b7c47a', near: '#8fae4e', tower: '#e2b07a',
    top: '#e8894e', topHl: '#ffd2b0', rock: '#b85a34', rockDk: '#7a3a20', accent: '#2e9aa6', part: 'pollen', deco: 'cloud', ink: '#4a2418' },
  w2b: { sky: ['#86c8f5', '#cfeaff', '#fff1c2'], high: '#5ba9e6', sun: '#fff6b8', far: '#e8cf7a', near: '#d2a94a', tower: '#d9b45c',
    top: '#f0cf62', topHl: '#fff0a8', rock: '#b08850', rockDk: '#7d5c30', accent: '#ff7f5a', part: 'pollen', deco: 'cloud', ink: '#4a3712' },
  w3b: { sky: ['#101c40', '#27407a', '#e89a5c'], high: '#0a1230', sun: '#ffe2a0', far: '#243a70', near: '#16254e', tower: '#2c467f',
    top: '#b98a5c', topHl: '#ffd79a', rock: '#5f4630', rockDk: '#3c2a1c', accent: '#ffc65a', part: 'stars', deco: 'star', ink: '#fff', dark: true },
  w4b: { sky: ['#5c6c82', '#95a4b8', '#dde4ec'], high: '#3a4658', sun: '#eef6ff', far: '#8a98ac', near: '#6a778a', tower: '#7c889a',
    top: '#aeb8c8', topHl: '#e6ebf3', rock: '#6e7a8c', rockDk: '#4a5668', accent: '#8fe0d6', part: 'snow', deco: 'cloud', ink: '#1f2b3a' },
  w1: { sky: ['#8fd3ff', '#cdeeff', '#fff3cf'], high: '#5fb6f5', sun: '#fff1a0', far: '#a6dc86', near: '#73c25c', tower: '#7fbf6a',
    top: '#8ee06a', topHl: '#c4f59a', rock: '#b98a5e', rockDk: '#8a6240', accent: '#ffcf3a', part: 'pollen', deco: 'cloud', ink: '#24401b' },
  w2: { sky: ['#a9d8b0', '#d6efcd', '#f3f8d6'], high: '#6fae86', sun: '#f6ffc4', far: '#5e9c6b', near: '#3c7350', tower: '#4e8a5c',
    top: '#6cbf5c', topHl: '#a9e38b', rock: '#7a5a3a', rockDk: '#553c25', accent: '#ffe66b', part: 'firefly', deco: 'leaf', ink: '#1f3a24' },
  w3: { sky: ['#f2b57a', '#ffd9ae', '#fff0db'], high: '#d98a52', sun: '#fff0c0', far: '#c98a5a', near: '#9c5e36', tower: '#b2703f',
    top: '#e9a95f', topHl: '#ffd79a', rock: '#9c5e36', rockDk: '#6f3e20', accent: '#ffd25e', part: 'spark', deco: 'gear', ink: '#4a2610' },
  w4: { sky: ['#9fcdfb', '#d8eeff', '#f6fbff'], high: '#6aa6e8', sun: '#ffffff', far: '#bcd9f4', near: '#8fb6e0', tower: '#9cc3ec',
    top: '#eef9ff', topHl: '#ffffff', rock: '#8db5e6', rockDk: '#5f86bf', accent: '#7fd4ff', part: 'snow', deco: 'crystal', ink: '#1d3557' },
  w5: { sky: ['#0f0a2e', '#2a1b63', '#5a3aa0'], high: '#070418', sun: '#fff6c8', far: '#2a1d5e', near: '#1b1340', tower: '#3a2a80',
    top: '#a593ff', topHl: '#e0d8ff', rock: '#4b3aa8', rockDk: '#2e2272', accent: '#ffe27a', part: 'stars', deco: 'star', ink: '#fff', dark: true },
};

// ---------------------------------------------------------------- Лумі-ліхтарик на canvas (v17)
// Готові офскрин-спрайти: крильця (4 кадри тріпотіння, з теплим сяйвом) + тільце з емоціями.
// У кадрі — лише 2 drawImage з масштабом/поворотом (squash&stretch, нахил). Без градієнтів/shadowBlur у кадрі.
const LQ = { ol: '#3e2a4e', eye: '#2e1d3e', iris: '#6a4fb0', cheek: 'rgba(255,120,150,.5)', mouth: '#7a2a4a', tongue: '#ff7f95',
  teal: '#2fae9f', tealL: '#82e3d2', gold: '#f6c443', goldL: '#fff0a0', pink: '#ffb1cc', pinkD: '#ff8fb8' };
const LUMI_MOODS = ['happy', 'joy', 'wow', 'hurt', 'sad', 'blink', 'back'];
const LBX = 2.05, LBT = 1.9, LBB = 1.85;          // межі спрайта в одиницях радіуса тільця
function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, Math.PI * 2); }
function starPath(ctx, x, y, r, rot = 0, inner = 0.48) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * inner : r, a = -Math.PI / 2 + rot + (i * Math.PI) / 5;
    ctx[i ? 'lineTo' : 'moveTo'](x + rr * Math.cos(a), y + rr * Math.sin(a));
  }
  ctx.closePath();
}
function lumiWings(x, a) {
  // сяйво-ореол
  const gl = x.createRadialGradient(0, 0.05, 0.5, 0, 0.05, 1.85);
  gl.addColorStop(0, 'rgba(255,226,150,.5)'); gl.addColorStop(1, 'rgba(255,226,150,0)');
  x.fillStyle = gl; x.beginPath(); x.arc(0, 0.05, 1.85, 0, 7); x.fill();
  for (const s of [-1, 1]) {
    x.save();
    x.translate(s * 0.62, -0.1); x.rotate(s * (-0.08 + a)); x.scale(s, 1 - a * 0.9);
    const wg = x.createLinearGradient(0, -0.7, 1.3, 0.6);
    wg.addColorStop(0, 'rgba(140,226,255,.9)'); wg.addColorStop(0.4, 'rgba(255,190,232,.88)');
    wg.addColorStop(0.75, 'rgba(255,240,160,.86)'); wg.addColorStop(1, 'rgba(180,165,255,.9)');
    x.fillStyle = wg; x.strokeStyle = 'rgba(62,42,78,.7)'; x.lineWidth = 0.045;
    ell(x, 0.62, -0.32, 0.66, 0.38, -0.32); x.fill(); x.stroke();
    ell(x, 0.5, 0.36, 0.44, 0.27, 0.3); x.fill(); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 0.035;
    x.beginPath(); x.moveTo(0.15, -0.2); x.quadraticCurveTo(0.6, -0.5, 1.05, -0.45); x.stroke();
    x.restore();
  }
}
function lumiBody(x, mood) {
  const back = mood === 'back';
  x.lineJoin = 'round'; x.lineCap = 'round';
  // вушка-пелюстки
  for (const s of [-1, 1]) {
    x.save(); x.translate(s * 0.68, -0.7); x.rotate(s * 0.88);
    x.fillStyle = '#fff6fa'; x.strokeStyle = LQ.ol; x.lineWidth = 0.055;
    x.beginPath(); x.moveTo(0, 0.2); x.quadraticCurveTo(-0.38, -0.22, 0, -0.62); x.quadraticCurveTo(0.38, -0.22, 0, 0.2); x.fill(); x.stroke();
    if (!back) { x.fillStyle = LQ.pink; x.beginPath(); x.moveTo(0, 0.12); x.quadraticCurveTo(-0.22, -0.2, 0, -0.48); x.quadraticCurveTo(0.22, -0.2, 0, 0.12); x.fill(); }
    x.restore();
  }
  // антенки з вогниками
  for (const s of [-1, 1]) {
    x.strokeStyle = LQ.ol; x.lineWidth = 0.06;
    x.beginPath(); x.moveTo(s * 0.16, -0.98); x.quadraticCurveTo(s * 0.22, -1.45, s * 0.5, -1.62); x.stroke();
    const bg = x.createRadialGradient(s * 0.5, -1.66, 0, s * 0.5, -1.66, 0.3);
    bg.addColorStop(0, 'rgba(255,240,160,.85)'); bg.addColorStop(1, 'rgba(255,240,160,0)');
    x.fillStyle = bg; x.beginPath(); x.arc(s * 0.5, -1.66, 0.3, 0, 7); x.fill();
    x.fillStyle = LQ.goldL; x.strokeStyle = LQ.ol; x.lineWidth = 0.045; x.beginPath(); x.arc(s * 0.5, -1.66, 0.11, 0, 7); x.fill(); x.stroke();
  }
  // ручки
  x.fillStyle = '#fbf7ff'; x.strokeStyle = LQ.ol; x.lineWidth = 0.05;
  for (const s of [-1, 1]) { ell(x, s * 1.0, 0.24, 0.16, 0.15); x.fill(); x.stroke(); }
  // нитка й зірочка-китиця
  x.strokeStyle = LQ.ol; x.lineWidth = 0.04; x.beginPath(); x.moveTo(0, 0.98); x.lineTo(0, 1.4); x.stroke();
  const sg = x.createRadialGradient(-0.05, 1.5, 0, 0, 1.56, 0.36);
  sg.addColorStop(0, 'rgba(255,230,140,.7)'); sg.addColorStop(1, 'rgba(255,230,140,0)');
  x.fillStyle = sg; x.beginPath(); x.arc(0, 1.56, 0.36, 0, 7); x.fill();
  starPath(x, 0, 1.58, 0.22, 0, 0.5); x.fillStyle = '#ffd54a'; x.strokeStyle = LQ.ol; x.lineWidth = 0.045; x.fill(); x.stroke();
  // тільце: перлина з теплим світлом
  const g = x.createRadialGradient(back ? 0 : 0, 0.08, 0.05, 0, 0, 1.02);
  if (mood === 'hurt') { g.addColorStop(0, '#ffd9cf'); g.addColorStop(0.6, '#f8e8f0'); g.addColorStop(1, '#e6c8e0'); }
  else if (mood === 'sad') { g.addColorStop(0, '#f2eefc'); g.addColorStop(0.6, '#ebe8f8'); g.addColorStop(1, '#cfcbee'); }
  else { g.addColorStop(0, '#fff2b8'); g.addColorStop(0.32, '#fff6dc'); g.addColorStop(0.7, '#fbf6fb'); g.addColorStop(1, '#e2d6f4'); }
  x.fillStyle = g; ell(x, 0, 0, 1, 0.96); x.fill();
  // ребра ліхтарика
  x.strokeStyle = 'rgba(150,128,190,.28)'; x.lineWidth = 0.035;
  for (const rx of [0.38, 0.74]) { ell(x, 0, 0, rx, 0.95); x.stroke(); }
  x.beginPath(); x.moveTo(0, -0.95); x.lineTo(0, 0.95); x.stroke();
  // перламутровий відблиск по краю
  const ir = x.createLinearGradient(-1, -1, 1, 1);
  ir.addColorStop(0, 'rgba(160,230,255,.35)'); ir.addColorStop(0.5, 'rgba(255,190,230,0)'); ir.addColorStop(1, 'rgba(200,170,255,.4)');
  x.strokeStyle = ir; x.lineWidth = 0.14; ell(x, 0, 0, 0.92, 0.88); x.stroke();
  x.strokeStyle = LQ.ol; x.lineWidth = 0.065; ell(x, 0, 0, 1, 0.96); x.stroke();
  x.fillStyle = 'rgba(255,255,255,.85)'; ell(x, back ? 0.42 : -0.44, -0.56, 0.26, 0.12, back ? 0.6 : -0.6); x.fill();
  // ковпачок і комірець
  const cap = (y0, y1, wt, wb) => {
    x.beginPath(); x.moveTo(-wt, y0); x.lineTo(wt, y0); x.lineTo(wb, y1); x.lineTo(-wb, y1); x.closePath();
    x.fillStyle = LQ.teal; x.fill(); x.strokeStyle = LQ.ol; x.lineWidth = 0.05; x.stroke();
  };
  cap(-1.1, -0.86, 0.26, 0.42);
  x.fillStyle = LQ.tealL; x.fillRect(-0.2, -1.07, 0.4, 0.06);
  x.fillStyle = LQ.gold; x.fillRect(-0.4, -0.9, 0.8, 0.05);
  cap(0.86, 1.0, 0.36, 0.24);
  x.fillStyle = LQ.gold; x.fillRect(-0.35, 0.87, 0.7, 0.04);
  if (back) return;
  // щічки
  x.fillStyle = LQ.cheek; ell(x, -0.56, 0.24, 0.15, 0.09); x.fill(); ell(x, 0.56, 0.24, 0.15, 0.09); x.fill();
  // очі
  const ex = 0.34, ey = 0.0;
  x.strokeStyle = LQ.eye; x.lineWidth = 0.07;
  if (mood === 'joy' || mood === 'blink') {
    for (const s of [-1, 1]) { x.beginPath(); if (mood === 'joy') x.arc(s * ex, ey + 0.08, 0.14, Math.PI * 1.15, Math.PI * 1.85); else { x.moveTo(s * ex - 0.13, ey + 0.02); x.quadraticCurveTo(s * ex, ey + 0.1, s * ex + 0.13, ey + 0.02); } x.stroke(); }
  } else if (mood === 'hurt') {
    for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * ex - s * 0.12, ey - 0.1); x.lineTo(s * ex + s * 0.1, ey); x.lineTo(s * ex - s * 0.12, ey + 0.1); x.stroke(); }
  } else {
    const big = mood === 'wow' ? 1.18 : mood === 'sad' ? 1.1 : 1;
    for (const s of [-1, 1]) {
      x.fillStyle = LQ.eye; ell(x, s * ex, ey, 0.15 * big, 0.2 * big); x.fill();
      x.fillStyle = LQ.iris; ell(x, s * ex, ey + 0.08 * big, 0.1 * big, 0.08 * big); x.fill();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(s * ex - 0.05, ey - 0.08 * big, 0.06 * big, 0, 7); x.fill();
      x.beginPath(); x.arc(s * ex + 0.06, ey + 0.05, 0.025, 0, 7); x.fill();
    }
    if (mood === 'sad') {
      x.lineWidth = 0.045; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 0.48, -0.28); x.lineTo(s * 0.2, -0.22); x.stroke(); }
      x.fillStyle = '#8fd0ff'; x.strokeStyle = '#3a6fa8'; x.lineWidth = 0.03;
      x.beginPath(); x.moveTo(-0.46, 0.14); x.quadraticCurveTo(-0.55, 0.3, -0.46, 0.33); x.quadraticCurveTo(-0.37, 0.3, -0.46, 0.14); x.fill(); x.stroke();
    }
  }
  // рот
  const my = 0.3;
  x.strokeStyle = LQ.mouth; x.fillStyle = LQ.mouth; x.lineWidth = 0.055;
  if (mood === 'joy' || mood === 'happy') {
    x.beginPath(); x.moveTo(-0.15, my - 0.04); x.quadraticCurveTo(0, my + (mood === 'joy' ? 0.26 : 0.2), 0.15, my - 0.04); x.closePath(); x.fill();
    x.fillStyle = LQ.tongue; ell(x, 0, my + 0.08, 0.07, 0.04); x.fill();
  } else if (mood === 'wow') { ell(x, 0, my + 0.03, 0.07, 0.09); x.fill(); }
  else if (mood === 'hurt') { x.beginPath(); x.moveTo(-0.14, my + 0.06); x.quadraticCurveTo(-0.07, my - 0.03, 0, my + 0.05); x.quadraticCurveTo(0.07, my + 0.12, 0.14, my + 0.03); x.stroke(); }
  else if (mood === 'sad') { x.beginPath(); x.arc(0, my + 0.12, 0.08, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }
  else { x.beginPath(); x.arc(0, my - 0.06, 0.11, Math.PI * 0.15, Math.PI * 0.85); x.stroke(); }
}
/** Набір спрайтів Лумі. draw(ctx, x, y, r, o): x,y — центр тільця, r — радіус тільця (CSS-пікселі).
 *  o.base — x,y це точка під китицею (опора, squash від неї). o: sx, sy (squash), rot, mood (happy|joy|wow|hurt|sad), blink (0..1), back, t (час, для крилець), alpha, flap (швидкість). */
export function lumiKit() {
  const S = { k: 0, wings: [], body: {} };
  function build(k) {
    S.k = k;
    const w = Math.ceil(LBX * 2 * k), h = Math.ceil((LBT + LBB) * k);
    const mk = (fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.setTransform(k, 0, 0, k, LBX * k, LBT * k); fn(x); return c; };
    S.wings = [0, 0.14, 0.28, 0.42].map((a) => mk((x) => lumiWings(x, a)));
    S.body = {}; for (const m of LUMI_MOODS) S.body[m] = mk((x) => lumiBody(x, m));
  }
  const FL = [0, 1, 2, 3, 2, 1];
  return {
    /** заздалегідь (на resize): k — пікселі пристрою на одиницю радіуса */
    prep(r, dpr) { const k = Math.round(r * dpr * 1.2); if (k !== S.k) build(k); },
    draw(ctx, x, y, r, o) {
      const k = Math.round(r * (o.dpr || 2) * 1.2); if (!S.k || (o.dpr && k !== S.k)) build(k);
      let m = o.back ? 'back' : (o.mood || 'happy');
      if (!S.body[m]) m = m === 'surprised' ? 'wow' : 'happy';
      if ((o.blink || 0) > 0.5 && (m === 'happy' || m === 'wow')) m = 'blink';
      const fr = FL[((((o.t || 0) * (o.flap || 14)) | 0) % 6 + 6) % 6];
      ctx.save();
      ctx.translate(x, y);
      if (o.rot) ctx.rotate(o.rot);
      ctx.scale(o.sx || 1, o.sy || 1);
      if (o.alpha != null) ctx.globalAlpha *= o.alpha;
      const L = -LBX * r, T = (o.base ? -LBT - 1.8 : -LBT) * r, W = LBX * 2 * r, H = (LBT + LBB) * r;
      ctx.drawImage(S.wings[fr], L, T, W, H);
      ctx.drawImage(S.body[m], L, T, W, H);
      ctx.restore();
    },
  };
}
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
/** v6: авто-«lite». Якщо кадри стабільно довші за ~21 мс (слабкий телефон), вмикаємо
 *  documentElement.dataset.perf = 'lite' (спільний прапорець застосунку) і викликаємо onSlow —
 *  гра знижує щільність пікселів полотна до 1.5 і прибирає зайві частинки. */
export const perfLite = () => document.documentElement.dataset.perf === 'lite';
// v17: якщо й у lite кадри довгі — ще знижуємо щільність пікселів полотна (1.5 → 1.25 → 1):
// на слабких телефонах головна ціна кадру — завантаження великого полотна в компоновщик.
let resStep = 0;
export const canvasDpr = () => Math.min(perfLite() ? [1.5, 1.25, 1][resStep] : 2, window.devicePixelRatio || 1);
export function fpsWatch(onSlow) {
  let acc = 0, n = 0, skip = 20;
  return (ms) => {
    if (resStep >= 2 || ms > 250) return;         // стрибок після паузи/вкладки — не рахуємо
    if (skip > 0) { skip -= 1; return; }          // прогрів перших кадрів
    acc += ms; n += 1;
    if (acc < 1500) return;
    const slow = acc / n > 21;
    acc = 0; n = 0;
    if (!slow) return;
    if (perfLite()) resStep += 1; else document.documentElement.dataset.perf = 'lite';
    skip = 20;
    onSlow();
  };
}
/** v6: поки йде canvas-гра — глобальне небо (#sky) під полотном ставимо на паузу (його й так не видно). */
export function canvasGameOn(on) {
  const h = document.documentElement, n = Math.max(0, (+h.dataset.gcanvas || 0) + (on ? 1 : -1));
  if (n) h.dataset.gcanvas = n; else delete h.dataset.gcanvas;
}
function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
/** Розбити текст на ≤2 рядки під ширину, підібравши кегль. */
function fitText(ctx, text, maxW, size, minSize = 10) {
  for (let fs = size; fs >= minSize; fs -= 1) {
    ctx.font = `800 ${fs}px ${FONT}`;
    if (ctx.measureText(text).width <= maxW) return { fs, lines: [text] };
    const words = text.split(' ');
    if (words.length > 1) {
      let best = null;
      for (let k = 1; k < words.length; k++) {
        const a = words.slice(0, k).join(' '), b = words.slice(k).join(' ');
        const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
        if (w <= maxW && (!best || w < best.w)) best = { w, lines: [a, b] };
      }
      if (best) return { fs, lines: best.lines };
    }
  }
  ctx.font = `800 ${minSize}px ${FONT}`;
  return { fs: minSize, lines: [text] };
}

// ---------------------------------------------------------------- питання
function buildPool(content, wid, hard = false) {
  const w = (content?.WORLDS || []).concat(content?.COUNTRIES || []).find((x) => x.id === wid);
  const choice = [];
  for (const q of w?.quests || []) {
    for (const t of q.tasks || []) {
      if (t.type !== 'choice' || !Array.isArray(t.options) || t.options[t.answer] == null) continue;
      const right = String(t.options[t.answer]);
      const wrong = shuffle(t.options.filter((_, i) => i !== t.answer).map(String)).slice(0, 3);
      // виклик: якщо в завданні мало варіантів — добираємо схожі з інших уроків світу
      if (hard && wrong.length < 3) {
        const extra = shuffle((w.quests || []).flatMap((qq) => (qq.tasks || []).filter((x) => x.type === 'choice' && Array.isArray(x.options)).flatMap((x) => x.options.map(String))))
          .filter((o) => o !== right && !wrong.includes(o) && isEn(o) === isEn(right) && Math.abs(o.length - right.length) <= 6);
        for (const o of extra) { if (wrong.length >= 3) break; if (!wrong.includes(o)) wrong.push(o); }
      }
      const opts = shuffle([right, ...wrong]);
      choice.push({ q: String(tc(t, 'q') || ''), opts, ans: opts.indexOf(right), explain: tc(t, 'explain') || '', kind: 'task' });
    }
  }
  const pairs = twords(content, wid).filter((p) => Array.isArray(p) && p.length === 2 && p[0] && p[1]);
  const words = pairs.map(([ua, en]) => {
    const others = shuffle(pairs.filter((p) => p[1].toLowerCase() !== en.toLowerCase()).map((p) => p[1]));
    const opts = shuffle([en, ...[...new Set(others)].slice(0, 3)]);
    return { q: `${tr('obby.word_q', { 0: ua })}`, opts, ans: opts.indexOf(en), explain: `${ua} = ${en}`, kind: 'word' };
  });
  return { choice: shuffle(choice), words: shuffle(words) };
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
  const gameId = params?.id || `${wid}-obby${hard ? 'x' : ''}`;
  const GOAL = hard ? 16 : GOAL0;
  const HEARTS = hard ? 2 : HEARTS0;
  let alive = true;
  let dirty = false;
  let lumiRefs = [];

  const scr = el('div', `g-screen g-obby g-th-${wid}${th.dark ? ' g-dark' : ''}${hard ? ' g-hard' : ''}`);
  root.append(scr);

  const pool = buildPool(app.content, wid, hard);
  if (!world || (!pool.choice.length && pool.words.length < 4)) {
    scr.innerHTML = `<div class="g-locked"><div class="g-locked-ico">🧗</div><p>${tr('obby.no_tasks')}</p>
      <button class="g-btn" data-a="back">${tr('common.back')}</button></div>`;
    scr.querySelector('[data-a=back]').onclick = () => app.back();
    return () => { alive = false; };
  }

  scr.innerHTML = `
    <div class="g-skyl" aria-hidden="true"><canvas></canvas><canvas class="g-skyb"></canvas><canvas class="g-sun"></canvas></div>
    <canvas class="g-canvas" aria-hidden="true"></canvas>
    <div class="g-hud">
      <div class="g-hud-row">
        <button class="g-ibtn g-back" ${tr('common.back_aria')}${inTg ? ' hidden' : ''}>‹</button>
        <div class="g-hearts" ${tr('common.lives_aria')}></div>
        <div class="g-chip g-ob-height">🧗 <b>0</b>/${GOAL}</div>
        <div class="g-chip g-combo" hidden>🔥 <b>0</b></div>
        <button class="g-ibtn g-pause" ${tr('common.pause_aria')}>⏸</button>
      </div>
      <div class="g-qcard" hidden>
        <div class="g-qlabel">${tr('obby.label')}</div>
        <div class="g-qtext"></div>
        <div class="g-qfb"></div>
      </div>
    </div>
    <div class="g-ob-prog" aria-hidden="true"><div class="g-ob-progfill"></div>${Array.from({ length: Math.ceil(GOAL / CP_EVERY) - 1 }, (_, i) => (i + 1) * CP_EVERY).map((k) => `<i style="bottom:${(k / GOAL) * 100}%">🚩</i>`).join('')}<b class="g-ob-progtop">🏁</b><span class="g-ob-progdot"></span></div>`;
  const $ = (q) => scr.querySelector(q);
  const cv = $('.g-canvas');
  const ctx = cv.getContext('2d');
  const hud = { hearts: $('.g-hearts'), height: $('.g-ob-height b'), combo: $('.g-combo'), comboN: $('.g-combo b'),
    q: $('.g-qcard'), qtext: $('.g-qtext'), qfb: $('.g-qfb'), qlabel: $('.g-qlabel'), fill: $('.g-ob-progfill'), dot: $('.g-ob-progdot') };
  $('.g-back').onclick = () => { hap(app); app.back(); };
  $('.g-pause').onclick = () => { hap(app); pause(); };

  // ------------------------------------------------ розміри
  let W = 390, H = 700, dpr = 1, LH = 150;
  function resize() {
    const r = scr.getBoundingClientRect();
    W = Math.max(280, r.width); H = Math.max(420, r.height);
    dpr = canvasDpr();
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    LH = clamp(H * 0.19, 112, 160);
    ensureBg();
    if (g) relayout();
    if (!running) draw();
  }
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => resize()) : null;

  // ------------------------------------------------ v6: кеш спрайтів (жодних градієнтів/тіней у кадрі)
  /** Спрайт 1:1 у пікселях пристрою (поточна матриця — лише масштаб dpr + зсув). */
  function blit(c, x, y) {
    const m = ctx.getTransform();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(c, Math.round(m.a * x + m.e), Math.round(m.d * y + m.f));
    ctx.setTransform(m);
  }
  let fontGen = 0; // шрифт довантажився — перемалювати спрайти з текстом
  const onFonts = () => { fontGen += 1; };
  document.fonts?.addEventListener?.('loadingdone', onFonts);
  canvasGameOn(true);
  const bgc = { key: '', k: -1, sy: -1, cloud: null, fly: null };
  const skyCs = scr.querySelectorAll('.g-skyl canvas'), skyB = skyCs[1], sunC = skyCs[2];
  const snap = (v) => Math.round(v * dpr) / dpr;
  function skyLayer(c, top, part = 1) {
    c.width = cv.width; c.height = Math.ceil(cv.height * part);
    c.style.width = W + 'px'; c.style.height = c.height / dpr + 'px';
    const x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = x.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, top); sky.addColorStop(0.55, th.sky[1]); sky.addColorStop(1, th.sky[2]);
    x.fillStyle = sky; x.fillRect(0, 0, W, H);
    return c;
  }
  function ensureBg() {
    const key = `${W}|${H}|${dpr}`;
    if (bgc.key === key) return;
    bgc.key = key;
    skyLayer(skyCs[0], th.sky[0]);
    skyLayer(skyB, mix(th.sky[0], th.high, 1), 0.56); // нижче 0.55 шари однакові
    bgc.k = bgc.sy = -1;
    // сонце/місяць
    const R = 120, sun = sunC, sx = sun.getContext('2d');
    sun.width = Math.ceil(2 * R * dpr); sun.height = Math.ceil(2 * R * dpr);
    sun.style.width = sun.width / dpr + 'px'; sun.style.height = sun.height / dpr + 'px';
    sx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sg = sx.createRadialGradient(R, R, 4, R, R, R);
    sg.addColorStop(0, th.sun); sg.addColorStop(0.25, hexA(th.sun, 0.55)); sg.addColorStop(1, hexA(th.sun, 0));
    sx.fillStyle = sg; sx.fillRect(0, 0, 2 * R, 2 * R);
    sx.fillStyle = th.sun; sx.beginPath(); sx.arc(R, R, th.dark ? 22 : 30, 0, 7); sx.fill();
    if (th.dark) { sx.fillStyle = th.sky[1]; sx.beginPath(); sx.arc(R + 10, R - 6, 19, 0, 7); sx.fill(); }
    // хмаринка (масштаб 1.25 — максимальний у декорі)
    if (th.deco === 'cloud') {
      const S = 1.25, c = mkCanvas(110 * S * dpr, 66 * S * dpr), x = c.getContext('2d');
      x.setTransform(dpr * S, 0, 0, dpr * S, 52 * S * dpr, 34 * S * dpr);
      x.fillStyle = 'rgba(255,255,255,.85)';
      for (const [cx, cy, r] of [[-30, 6, 20], [-8, -6, 26], [20, 2, 22], [40, 10, 14]]) { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); }
      x.fillRect(-48, 6, 98, 20);
      bgc.cloud = c;
    }
    // світлячок (повна яскравість; мерехтіння — globalAlpha)
    if (th.part === 'firefly') {
      const S = 1.3, c = mkCanvas(20 * S * dpr, 20 * S * dpr), x = c.getContext('2d');
      x.setTransform(dpr * S, 0, 0, dpr * S, 10 * S * dpr, 10 * S * dpr);
      const fg = x.createRadialGradient(0, 0, 0, 0, 0, 9);
      fg.addColorStop(0, 'rgba(240,255,150,0.9)'); fg.addColorStop(1, 'rgba(240,255,150,0)');
      x.fillStyle = fg; x.fillRect(-10, -10, 20, 20);
      bgc.fly = c;
    }
  }
  /** Спрайт бульбашки-варіанта (тінь, рамка, хвостик, текст) — малюється раз на зміну тексту/ширини/виділення. */
  function labelSprite(p, w, sel) {
    const key = `${p.label}|${w}|${sel ? 1 : 0}|${dpr}|${fontGen}`;
    if (p._lk === key) return p._ls;
    const fitC = labelSprite.m || (labelSprite.m = mkCanvas(2, 2).getContext('2d'));
    const { fs, lines } = fitText(fitC, p.label, w - 10, 16, 10);
    const lh = fs * 1.15, bh = lines.length * lh + 12;
    const PAD = 14, cw = w - 4 + PAD * 2, ch = bh + 7 + PAD * 2 + 4;
    const c = mkCanvas(cw * dpr, ch * dpr), x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.translate(PAD - 2, PAD);           // локальні координати: ліва межа платформи = 0, верх бульбашки = 0
    const cxm = w / 2;
    x.fillStyle = sel ? '#fff7c2' : 'rgba(255,255,255,.95)';
    x.shadowColor = 'rgba(40,20,70,.25)'; x.shadowBlur = 8; x.shadowOffsetY = 3;
    rrect(x, 2, 0, w - 4, bh, 12); x.fill();
    x.shadowColor = 'transparent';
    x.strokeStyle = sel ? th.accent : 'rgba(72,44,86,.25)'; x.lineWidth = sel ? 3 : 1.5; rrect(x, 2, 0, w - 4, bh, 12); x.stroke();
    x.fillStyle = sel ? '#fff7c2' : 'rgba(255,255,255,.95)';
    x.beginPath(); x.moveTo(cxm - 6, bh - 1); x.lineTo(cxm, bh + 7); x.lineTo(cxm + 6, bh - 1); x.fill();
    x.fillStyle = '#2b1d3a'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `800 ${fs}px ${FONT}`;
    lines.forEach((ln, k) => x.fillText(ln, cxm, 6 + lh * (k + 0.5)));
    x.font = `700 9px ${FONT}`; x.fillStyle = 'rgba(72,44,86,.35)';
    x.fillText(String(p.i + 1), 8, 6);
    p._lk = key; p._ls = { c, bh, ox: -(PAD - 2), oy: -PAD };
    return p._ls;
  }

  // ------------------------------------------------ стан гри
  let g = null;            // поточна партія
  let gt = 0;              // ігровий час (стоїть на паузі)
  let jobs = [];           // відкладені дії в ігровому часі
  const after = (sec, fn) => jobs.push({ at: gt + sec, fn });
  let phase = 'intro';     // intro | ask | busy | over
  let paused = false;
  let overlay = null;
  const parts = [];        // частинки у світових координатах
  const amb = [];          // ембієнт у координатах екрана
  const decos = [];
  let shake = 0;
  const lumi = lumiKit(), LO = { base: true, dpr: 1, sx: 1, sy: 1, rot: 0, blink: 0, mood: 'happy', t: 0, flap: 12 };
  let flash = 0;           // червоний спалах

  const surfY = (lvl) => -lvl * LH;
  const toScreenY = (wy) => wy - g.cam + H * 0.7;

  function newGame() {
    const q = [];
    // чергуємо завдання уроків і слова, щоб вистачило з запасом
    const a = [...pool.choice], b = [...pool.words];
    while (a.length || b.length) { if (a.length) q.push(a.shift()); if (b.length) q.push(b.shift()); if (b.length && !a.length) q.push(b.shift()); }
    g = {
      queue: q, used: [], q: null, lvl: 0, cp: 0, hearts: HEARTS, correct: 0, mistakes: 0, combo: 0, bestCombo: 0,
      xp: 0, cam: 0, plats: [], sel: -1,
      lumi: { x: W / 2, y: 0, vx: 0, vy: 0, sq: 0, sqv: 0, rot: 0, state: 'stand', target: null, mood: 'happy',
        blink: 0, blinkT: 2, look: 0, arms: 0, ant: 0, onLand: null, hop: 0 },
    };
    parts.length = 0;
    g.plats.push({ lvl: 0, x: W / 2, w: Math.min(W * 0.62, 260), kind: 'base', alpha: 1 });
    g.lumi.y = 0;
    g.cam = surfY(0);
    jobs = []; shake = 0; flash = 0;
    paintHud();
  }
  function relayout() {
    // перерахунок x платформ варіантів під нову ширину
    const opts = g.plats.filter((p) => p.kind === 'opt' && !p.dead);
    if (opts.length) placeOptions(opts);
    g.plats.forEach((p) => { if (p.kind === 'base') { p.x = W / 2; p.w = Math.min(W * 0.62, 260); } });
  }
  function placeOptions(opts) {
    const n = opts.length, m = 8 + Math.max(0, (W - 440) / 2);
    const cw = (W - 2 * m - 26) / n; // праворуч — смужка прогресу
    opts.forEach((p, i) => { p.x = m + cw * (i + 0.5); p.w = Math.min(cw - 8, 150); });
  }

  function nextQuestion() {
    if (!g.queue.length) g.queue = shuffle(g.used.length ? g.used : [...pool.choice, ...pool.words]), g.used = [];
    const q = g.queue.shift();
    g.used.push(q);
    g.q = q;
    g.sel = -1;
    _debug.answer = q.ans;
    const lvl = g.lvl + 1;
    const opts = q.opts.map((label, i) => ({ lvl, kind: 'opt', label, i, alpha: 0, born: gt + i * 0.07, press: 0, crack: 0, x: 0, w: 0 }));
    placeOptions(opts);
    g.plats.push(...opts);
    hud.qlabel.textContent = lvl === GOAL ? tr('obby.last') : (lvl % CP_EVERY === 0 ? tr('obby.cp_ahead') : tr('obby.label'));
    hud.qtext.textContent = q.q;
    hud.qtext.classList.toggle('g-long', q.q.length > 42);
    hud.qfb.innerHTML = '';
    hud.qfb.className = 'g-qfb';
    hud.q.hidden = false;
    hud.q.classList.remove('g-pop'); void hud.q.offsetWidth; hud.q.classList.add('g-pop');
    phase = 'ask';
    _debug.phase = 'ask';
    g.lumi.mood = 'happy';
  }

  function choose(i) {
    if (phase !== 'ask' || paused || !g.q) return;
    const p = g.plats.find((x) => x.kind === 'opt' && x.i === i && !x.dead);
    if (!p) return;
    phase = 'busy';
    _debug.phase = 'busy';
    const ok = i === g.q.ans;
    hap(app, 'medium');
    p.press = 1;
    jump(p, () => (ok ? landRight(p) : landWrong(p)));
  }

  // стрибок по параболі з присіданням
  function jump(p, onLand) {
    const L = g.lumi;
    L.sqv += 9; // присідання (sq>0 — сплющення)
    L.mood = 'wow';
    after(reduced() ? 0.02 : 0.11, () => {
      const x0 = L.x, y0 = L.y, x1 = p.x, y1 = surfY(p.lvl);
      const peak = Math.min(y0, y1) - 70;
      const h1 = y0 - peak, h2 = y1 - peak;
      const t1 = Math.sqrt((2 * h1) / G), t2 = Math.sqrt((2 * h2) / G);
      L.vy = -Math.sqrt(2 * G * h1);
      L.vx = (x1 - x0) / (t1 + t2);
      L.state = 'air'; L.target = p; L.onLand = onLand; L.arms = 1;
      L.sqv -= 14;
      dust(x0, y0, 7, 0.7);
      hap(app, 'light'); sfx('jump');
    });
  }

  function landRight(p) {
    const L = g.lumi;
    g.correct += 1; g.combo += 1; g.bestCombo = Math.max(g.bestCombo, g.combo);
    g.lvl = p.lvl;
    g.xp += XP_PER_CORRECT;
    try { S.onCorrectAnswer(st); S.addXP(st, XP_PER_CORRECT); } catch (e) { console.warn(e); }
    dirty = true; // зберігаємо в кінці/на виході: app.save() під час гри смикає приховану topbar
    L.mood = 'joy';
    p.kind = 'stand'; p.label = null; p.flag = 0;
    hap(app, 'success'); sfx('land'); sfx('correct');
    if (isEn(g.q.opts[g.q.ans])) speak(g.q.opts[g.q.ans]);
    sparkBurst(p.x, surfY(p.lvl) - 10, 14, [th.accent, '#fff', '#ffd84a', '#b9a2ff']);
    textPop(p.x, surfY(p.lvl) - 120, `+${XP_PER_CORRECT} XP`, '#ffd23f');
    if (g.combo >= 3) textPop(p.x, surfY(p.lvl) - 150, `${tr('arena.streak', { 0: g.combo })}`, '#ff7a3c');
    // інші варіанти зникають униз
    g.plats.forEach((o) => { if (o.kind === 'opt' && !o.dead) { o.dead = true; o.vy = -120; o.vr = rnd(-2, 2); } });
    hud.qfb.className = 'g-qfb good';
    hud.qfb.textContent = [tr('obby.g1'), tr('obby.g2'), tr('obby.g3'), tr('obby.g4')][g.correct % 4];
    paintHud();
    if (g.lvl >= GOAL) return summit(p);
    if (g.lvl % CP_EVERY === 0) {
      g.cp = g.lvl; p.flag = 0.001; p.cp = true;
      textPop(p.x, surfY(p.lvl) - 175, tr('obby.cp'), '#fff');
      after(0.25, () => { hap(app, 'medium'); sfx('star'); });
    }
    after(0.5, () => { if (alive) nextQuestion(); });
  }

  function landWrong(p) {
    const L = g.lumi;
    g.mistakes += 1; g.combo = 0;
    g.hearts -= 1;
    L.mood = 'wow';
    p.crack = 0.001;
    hap(app, 'warning'); sfx('wrong');
    if (isEn(g.q.opts[g.q.ans])) speak(g.q.opts[g.q.ans]);
    const right = g.plats.find((o) => o.kind === 'opt' && o.i === g.q.ans && !o.dead);
    if (right) right.glow = 1;
    hud.qfb.className = 'g-qfb bad';
    hud.qfb.innerHTML = `${tr('arena.right')} <b>${esc(g.q.opts[g.q.ans])}</b>${g.q.explain ? `<span>💡 ${esc(g.q.explain)}</span>` : ''}`;
    // повторимо це питання згодом
    g.queue.splice(Math.min(2, g.queue.length), 0, g.q);
    after(0.42, () => {
      crumble(p);
      hap(app, 'error'); sfx('fall');
      shake = Math.max(shake, 7);
      flash = 0.5;
      L.state = 'fall'; L.vy = -260; L.vx = 0; L.mood = 'hurt'; L.arms = 1;
      // розсипаються й пройдені платформи вище чекпоінта
      let k = 0;
      g.plats.filter((o) => o.kind === 'stand' && o.lvl > g.cp).sort((a, b) => b.lvl - a.lvl).forEach((o) => {
        after(0.12 + 0.1 * k++, () => crumble(o));
      });
      g.plats.forEach((o) => { if (o.kind === 'opt' && !o.dead && o !== p) { o.dead = true; o.vy = -60; o.vr = rnd(-2, 2); } });
      const cpPlat = g.plats.find((o) => o.lvl === g.cp && (o.kind === 'stand' || o.kind === 'base'));
      L.target = cpPlat;
      L.onLand = () => {
        g.lvl = g.cp;
        shake = Math.max(shake, 8);
        dust(L.x, L.y, 16, 1.4);
        hap(app, 'heavy');
        paintHud();
        if (g.hearts <= 0) { phase = 'over'; L.mood = 'hurt'; after(0.9, () => finish(false)); return; }
        textPop(L.x, L.y - 130, '−1 ❤️', '#ff5f6d');
        L.mood = 'happy';
        after(1.4, () => { if (alive) nextQuestion(); });
      };
      paintHud();
      bumpHeart();
    });
  }

  function summit(p) {
    phase = 'over';
    p.summit = true; p.flag = 0.001;
    hud.q.hidden = true;
    _debug.phase = 'summit';
    shake = 6;
    for (let k = 0; k < 6; k++) {
      after(0.2 + k * 0.32, () => {
        sparkBurst(p.x + rnd(-W * 0.35, W * 0.35), surfY(p.lvl) - rnd(140, 320), 26, ['#ffd84a', '#ff8fb1', '#9fd8ff', '#b9a2ff', '#fff'], 1.6);
        hap(app, 'light');
      });
    }
    for (let k = 0; k < 3; k++) after(0.3 + k * 0.55, () => { const L = g.lumi; L.state = 'air'; L.vy = -620; L.vx = 0; L.target = p; L.onLand = () => dust(L.x, L.y, 6, 0.6); L.arms = 1; });
    after(0.3, () => fx('confetti'));
    after(2.2, () => finish(true));
  }

  // ------------------------------------------------ частинки
  function dust(x, y, n, power = 1) {
    if (reduced()) n = Math.min(n, 3); else if (perfLite()) n = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) {
      const a = Math.PI + Math.random() * Math.PI;
      parts.push({ t: 'dust', x: x + rnd(-14, 14), y: y - 2, vx: Math.cos(a) * rnd(40, 140) * power * (Math.random() < 0.5 ? -1 : 1), vy: -rnd(20, 90) * power,
        life: 0, max: rnd(0.4, 0.8), s: rnd(4, 9) * Math.sqrt(power), c: th.dark ? '#dcd2ff' : '#ffffff' });
    }
  }
  function sparkBurst(x, y, n, colors, power = 1) {
    if (reduced()) n = Math.min(n, 5); else if (perfLite()) n = Math.ceil(n * 0.55);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = rnd(120, 360) * power;
      parts.push({ t: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: 0, max: rnd(0.6, 1.1), s: rnd(4, 8), c: colors[i % colors.length], r: rnd(0, 6), vr: rnd(-8, 8) });
    }
  }
  function textPop(x, y, text, c) { parts.push({ t: 'text', x, y, vx: 0, vy: -55, life: 0, max: 1.3, text, c }); }
  const starSpr = new Map(), popSpr = new Map();
  function starSprite(c) {
    let sp = starSpr.get(c);
    if (sp) return sp;
    sp = mkCanvas(24 * dpr, 24 * dpr); const x = sp.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 12 * dpr, 12 * dpr); x.fillStyle = c; starPath(x, 0, 0, 12, 0, 0.45); x.fill();
    starSpr.set(c, sp); return sp;
  }
  function popSprite(text, c) {
    const key = text + '|' + c;
    let sp = popSpr.get(key);
    if (sp) return sp;
    const m = mkCanvas(4, 4).getContext('2d'); m.font = `900 20px ${FONT}`;
    const w = Math.ceil(m.measureText(text).width) + 12, h = 30, S = dpr * 1.3;
    sp = mkCanvas(w * S, h * S); const x = sp.getContext('2d');
    x.setTransform(S, 0, 0, S, 0, 0); x.font = `900 20px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    x.lineWidth = 4; x.strokeStyle = 'rgba(40,20,60,.75)'; x.strokeText(text, w / 2, h / 2);
    x.fillStyle = c; x.fillText(text, w / 2, h / 2);
    sp.w = w; sp.h = h;
    if (popSpr.size > 40) popSpr.clear();
    popSpr.set(key, sp); return sp;
  }
  function crumble(p) {
    if (p.dead) return;
    p.dead = true; p.alpha = 0; p.gone = true;
    const y = surfY(p.lvl);
    const n = reduced() ? 4 : perfLite() ? 7 : 12;
    for (let i = 0; i < n; i++) {
      parts.push({ t: 'chunk', x: p.x + rnd(-p.w / 2, p.w / 2), y: y + rnd(0, 26), vx: rnd(-90, 90), vy: rnd(-180, 20), life: 0, max: 1.6,
        s: rnd(7, 15), c: i % 3 ? th.rock : th.top, r: rnd(0, 6), vr: rnd(-7, 7) });
    }
  }
  function initAmbient() {
    amb.length = 0;
    const n = reduced() ? 10 : (th.part === 'stars' ? 46 : 30) >> (perfLite() ? 1 : 0);
    for (let i = 0; i < n; i++) amb.push({ x: Math.random(), y: Math.random(), s: rnd(0.5, 1.3), ph: rnd(0, 6.28), sp: rnd(0.6, 1.4) });
    decos.length = 0;
    for (let i = 0; i < 16; i++) decos.push({ x: Math.random(), y: -i * 230 + rnd(-60, 60) - 120, s: rnd(0.6, 1.25), d: rnd(4, 14) * (Math.random() < 0.5 ? -1 : 1), ph: rnd(0, 6) });
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
    const T = gt;
    // відкладені дії
    if (jobs.length) {
      const due = jobs.filter((j) => j.at <= T);
      if (due.length) { jobs = jobs.filter((j) => j.at > T); due.forEach((j) => { try { j.fn(); } catch (e) { console.error(e); } }); }
    }
    if (!g) return;
    const L = g.lumi;
    // фізика Лумі
    if (L.state === 'air' || L.state === 'fall') {
      L.vy += G * dt;
      if (L.state === 'fall' && L.target) L.vx = (L.target.x - L.x) * 3;
      L.x += L.vx * dt; L.y += L.vy * dt;
      L.rot = L.state === 'fall' ? Math.sin(T * 14) * 0.25 : clamp(L.vx * 0.0006, -0.3, 0.3);
      const ty = L.target ? surfY(L.target.lvl) : 0;
      if (L.vy > 0 && L.y >= ty) {
        L.y = ty; L.vy = 0; L.vx = 0; L.state = 'stand'; L.rot = 0; L.arms = 0;
        if (L.target) L.x = L.target.x;
        L.sq = 0; L.sqv = 16;
        if (L.target && L.target.kind === 'opt') L.target.press = 1;
        dust(L.x, L.y, 8, 0.9);
        const cb = L.onLand; L.onLand = null;
        if (cb) cb();
      }
    } else if (phase === 'ask' && g.sel >= 0) {
      const p = g.plats.find((o) => o.kind === 'opt' && o.i === g.sel && !o.dead);
      L.look = lerp(L.look, p ? clamp((p.x - L.x) / 80, -1, 1) : 0, 1 - Math.exp(-dt * 10));
    } else {
      L.look = lerp(L.look, Math.sin(T * 0.7) * 0.5, 1 - Math.exp(-dt * 3));
    }
    // желейна пружина
    L.sqv += (-260 * L.sq - 13 * L.sqv) * dt;
    L.sq += L.sqv * dt;
    L.ant = lerp(L.ant, clamp(-L.vx / 900 - L.vy / 2600, -0.35, 0.35), 1 - Math.exp(-dt * 12));
    L.blinkT -= dt;
    if (L.blinkT < 0) { L.blink = 1; L.blinkT = rnd(1.8, 4); }
    L.blink = Math.max(0, L.blink - dt * 8);
    // камера
    const target = L.state === 'fall' ? L.y : Math.min(L.y, surfY(g.lvl));
    g.cam = lerp(g.cam, target, 1 - Math.exp(-dt * (L.state === 'fall' ? 7 : 3.2)));
    shake = Math.max(0, shake - dt * 30);
    flash = Math.max(0, flash - dt * 1.4);
    // платформи
    for (const p of g.plats) {
      if (p.kind === 'opt' && !p.dead) p.alpha = clamp((T - p.born) / 0.3, 0, 1);
      p.press = Math.max(0, (p.press || 0) - dt * 4);
      if (p.crack) p.crack = Math.min(1, p.crack + dt * 3);
      if (p.flag) p.flag = Math.min(1, p.flag + dt * 1.6);
      if (p.glow) p.glow = Math.max(0.35, p.glow - dt * 0.4);
      if (p.dead && !p.gone) {
        p.vy = (p.vy || 0) + 1600 * dt; p.dy = (p.dy || 0) + p.vy * dt; p.alpha = Math.max(0, (p.alpha ?? 1) - dt * 2.2);
        if (p.alpha <= 0) p.gone = true;
      }
    }
    g.plats = g.plats.filter((p) => !p.gone);
    // частинки
    for (const q of parts) {
      q.life += dt;
      if (q.t === 'chunk') { q.vy += 1500 * dt; q.r += q.vr * dt; } else if (q.t === 'spark') { q.vy += 380 * dt; q.vx *= 0.985; q.r += q.vr * dt; } else if (q.t === 'dust') { q.vx *= 0.92; q.vy *= 0.92; }
      q.x += q.vx * dt; q.y += q.vy * dt;
    }
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life >= parts[i].max) { parts[i] = parts[parts.length - 1]; parts.length -= 1; }
  }

  // ------------------------------------------------ малювання
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cam = g ? g.cam : 0;
    const prog = clamp(-cam / (GOAL * LH), 0, 1);
    // небо
    // v6: небо з кешу — шар «низ вежі» + шар «верх вежі» з альфою prog*0.7 (те саме, що mix у градієнті)
    ensureBg();
    // (шари неба/сонця — окремі полотна під грою, їх рухає компоновщик; тут лише прозорість/зсув за зміни)
    ctx.clearRect(0, 0, W, H);
    const kSky = Math.round(Math.min(1, prog * 0.7) * 255) / 255;
    if (kSky !== bgc.k) { bgc.k = kSky; skyB.style.opacity = kSky; }
    const sunY = snap(H * 0.34 + prog * 30 - 120);
    if (sunY !== bgc.sy) { bgc.sy = sunY; sunC.style.transform = `translate3d(${snap(W * 0.78 - 120)}px,${sunY}px,0)`; }
    const T = gt;
    // ембієнт-частинки (паралакс від камери)
    drawAmbient(T, cam);
    // декор (хмари / листя / шестерні / кристали / зорі)
    for (const d of decos) {
      const y = d.y - cam * 0.35 + H * 0.7 - H * 0.35;
      const yy = ((y % (H + 300)) + H + 300) % (H + 300) - 150;
      const x = ((d.x * (W + 200) + T * d.d) % (W + 200) + W + 200) % (W + 200) - 100;
      drawDeco(x, yy, d.s, T + d.ph);
    }
    // далекі пагорби біля підніжжя
    const groundS = g ? toScreenY(0) : H * 0.7;
    drawHills(H * 0.7 - 50 + (groundS - H * 0.7) * 0.5, th.far, 0.012, 46, 0);
    // силует вежі (паралакс 0.6)
    drawTower(cam);
    drawHills(groundS + 30, th.near, 0.02, 30, 1.7);
    if (!g) return;
    ctx.save();
    if (shake > 0 && !reduced()) ctx.translate(Math.sin(T * 83) * shake * 0.7, Math.cos(T * 61) * shake * 0.45); // v17: м'яка затухаюча тряска
    // земля під першою платформою
    ctx.fillStyle = th.near;
    ctx.fillRect(0, groundS + 26, W, Math.max(0, H - groundS));
    // вершина-ціль
    drawSummitBeacon();
    // примарні рівні попереду
    for (let k = g.lvl + 2; k <= Math.min(GOAL, g.lvl + 4); k++) {
      const y = toScreenY(surfY(k));
      if (y < -40) break;
      ctx.globalAlpha = 0.18; ctx.fillStyle = th.dark ? '#fff' : '#ffffff';
      rrect(ctx, W * 0.3, y, W * 0.4 - 26, 10, 5); ctx.fill(); ctx.globalAlpha = 1;
    }
    // платформи
    for (const p of g.plats) drawPlat(p, T);
    // частинки за Лумі
    drawParts(['chunk', 'dust']);
    // Лумі
    const L = g.lumi;
    const ly = toScreenY(L.y);
    const r = clamp(W * 0.065, 22, 30);
    const air = L.state === 'air' || L.state === 'fall';
    const stretch = air ? clamp(-L.vy / 2600, -0.14, 0.22) : 0;
    const sy = clamp(1 + stretch - L.sq * 0.4, 0.62, 1.35), sx = clamp(1 - stretch * 0.6 + L.sq * 0.4, 0.75, 1.4);
    // тінь
    if (L.state !== 'fall') {
      const base = L.target && air ? toScreenY(surfY(L.target.lvl)) : ly;
      const hgt = Math.max(0, base - ly);
      ctx.fillStyle = 'rgba(30,10,50,.22)'; ell(ctx, L.x, base + 1, r * 0.9 / (1 + hgt / 160), r * 0.22 / (1 + hgt / 160)); ctx.fill();
    }
    const idle = !air ? Math.sin(T * 3) * 0.02 : 0;
    LO.dpr = dpr; LO.sx = sx - idle; LO.sy = sy + idle; LO.rot = L.rot + L.ant * 0.25 + L.look * 0.06;
    LO.blink = L.blink; LO.mood = L.mood; LO.t = T; LO.flap = air ? 22 : 12;
    lumi.draw(ctx, L.x, ly - (air ? 0 : 1.5 + Math.sin(T * 2.6) * 1.5), r * 0.78, LO);
    drawParts(['spark', 'text']);
    ctx.restore();
    if (flash > 0) { ctx.fillStyle = `rgba(255,60,80,${flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
  }

  function drawAmbient(T, cam) {
    for (const a of amb) {
      let x = a.x * W, y = ((a.y * H - cam * 0.2 * a.s) % H + H) % H;
      if (th.part === 'pollen') {
        x = (x + T * 14 * a.sp + Math.sin(T + a.ph) * 10) % W;
        ctx.fillStyle = `rgba(255,236,140,${0.55 + 0.3 * Math.sin(T * 2 + a.ph)})`;
        ctx.beginPath(); ctx.arc(x, y, 2.2 * a.s, 0, 7); ctx.fill();
      } else if (th.part === 'firefly') {
        x += Math.sin(T * 0.8 * a.sp + a.ph) * 22; y += Math.cos(T * 0.6 * a.sp + a.ph) * 14;
        const k = 0.5 + 0.5 * Math.sin(T * 3 * a.sp + a.ph);
        if (bgc.fly && k > 0.003) {
          ctx.globalAlpha = k;
          ctx.drawImage(bgc.fly, x - 10 * a.s, y - 10 * a.s, 20 * a.s, 20 * a.s);
          ctx.globalAlpha = 1;
        }
      } else if (th.part === 'spark') {
        y = ((y - T * 26 * a.sp) % H + H) % H;
        ctx.fillStyle = `rgba(255,${190 + 40 * Math.sin(a.ph)},110,${0.5 + 0.4 * Math.sin(T * 4 + a.ph)})`;
        ctx.fillRect(x + Math.sin(T + a.ph) * 6, y, 2.5 * a.s, 2.5 * a.s);
      } else if (th.part === 'snow') {
        y = (y + T * 30 * a.sp) % H;
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.beginPath(); ctx.arc(x + Math.sin(T * 1.2 + a.ph) * 12, y, 2.4 * a.s, 0, 7); ctx.fill();
      } else {
        const k = 0.35 + 0.65 * Math.abs(Math.sin(T * 1.3 * a.sp + a.ph));
        ctx.fillStyle = `rgba(255,248,200,${k})`;
        starPath(ctx, x, y * 0.9, 2.2 * a.s + k * 1.2, 0, 0.4); ctx.fill();
      }
    }
  }
  function drawDeco(x, y, s, T) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (th.deco === 'cloud' || th.deco === 'crystal') {
      if (th.deco === 'crystal') {
        ctx.rotate(Math.sin(T * 0.5) * 0.2);
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.strokeStyle = 'rgba(120,170,230,.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(12, -4); ctx.lineTo(0, 24); ctx.lineTo(-12, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (bgc.cloud) {
        const S = 1.25;
        ctx.drawImage(bgc.cloud, -52, -34, bgc.cloud.width / dpr / S, bgc.cloud.height / dpr / S);
      }
    } else if (th.deco === 'leaf') {
      ctx.rotate(Math.sin(T * 1.3) * 0.8);
      ctx.fillStyle = 'rgba(90,160,80,.7)'; ell(ctx, 0, 0, 14, 6, 0.4); ctx.fill();
      ctx.strokeStyle = 'rgba(40,90,40,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-12, -4); ctx.lineTo(12, 4); ctx.stroke();
    } else if (th.deco === 'gear') {
      ctx.rotate(T * 0.4 * (s > 1 ? 1 : -1));
      ctx.fillStyle = 'rgba(160,90,45,.35)';
      ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, r = i % 2 ? 22 : 28; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = hexA(th.sky[1], 0.9); ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fill();
    } else {
      const k = 0.6 + 0.4 * Math.sin(T * 2);
      ctx.fillStyle = `rgba(255,236,150,${k})`; starPath(ctx, 0, 0, 7, T * 0.3, 0.42); ctx.fill();
    }
    ctx.restore();
  }
  function drawHills(baseY, color, freq, amp, seed) {
    if (baseY > H + 60) return;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 10; x += 10) {
      const y = baseY - amp * (0.6 + 0.4 * Math.sin(x * freq + seed) + 0.25 * Math.sin(x * freq * 2.7 + seed * 3));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  }
  function drawTower(cam) {
    const base = -cam * 0.6 + H * 0.7 + 40;
    const top = base - GOAL * LH * 0.6 - 60;
    if (top > H || base < -50) return;
    const cx = W / 2 - 13;
    ctx.save();
    ctx.globalAlpha = th.dark ? 0.4 : 0.2;
    ctx.fillStyle = th.tower;
    const bw = W * 0.2, tw = W * 0.14;
    ctx.beginPath();
    ctx.moveTo(cx - bw, base); ctx.lineTo(cx - tw, top);
    // зубці на верхівці
    for (let i = 0; i < 5; i++) { const x0 = cx - tw + (i * 2 * tw) / 5; ctx.lineTo(x0, top - 14); ctx.lineTo(x0 + tw / 5, top - 14); ctx.lineTo(x0 + tw / 5, top); }
    ctx.lineTo(cx + tw, top); ctx.lineTo(cx + bw, base); ctx.closePath(); ctx.fill();
    // арочні віконця
    ctx.fillStyle = th.dark ? '#ffe9a0' : th.rockDk;
    ctx.globalAlpha = th.dark ? 0.35 : 0.14;
    for (let y = base - 60, i = 0; y > top + 30; y -= 90, i++) {
      if (y > H + 30 || y < -30) continue;
      const x = cx + (i % 2 ? 18 : -18) - 7;
      ctx.beginPath(); ctx.moveTo(x, y + 22); ctx.lineTo(x, y + 7); ctx.arc(x + 7, y + 7, 7, Math.PI, 0); ctx.lineTo(x + 14, y + 22); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function drawSummitBeacon() {
    const y = toScreenY(surfY(GOAL));
    if (y < -260 || y > H + 50) return;
    const cx = W / 2 - 13;
    const bg = ctx.createLinearGradient(0, y - 220, 0, y + 20);
    bg.addColorStop(0, 'rgba(255,230,120,0)'); bg.addColorStop(1, 'rgba(255,230,120,.35)');
    ctx.fillStyle = bg; ctx.fillRect(cx - 60, y - 220, 120, 240);
    if (g.lvl < GOAL) {
      ctx.font = `30px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🏁', cx, y - 50 + Math.sin(gt * 2) * 5);
    }
  }
  function drawPlat(p, T) {
    if (p.alpha <= 0) return;
    const wy = surfY(p.lvl);
    let y = toScreenY(wy) + (p.dy || 0) + (p.press || 0) * 6;
    if (y < -120 || y > H + 80) return;
    const w = p.w, x = p.x - w / 2;
    let jx = 0;
    if (p.crack && !p.dead) jx = Math.sin(T * 60) * 3 * p.crack;
    if (p.kind === 'opt' && !p.dead) y += (1 - p.alpha) * 30 + Math.sin(T * 2 + p.i) * 2;
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(jx, 0);
    if (p.dead && p.vr) { ctx.translate(p.x, y); ctx.rotate((p.dy || 0) * 0.002 * p.vr); ctx.translate(-p.x, -y); }
    const sel = p.kind === 'opt' && g.sel === p.i && phase === 'ask';
    // підсвітка правильної після помилки
    if (p.glow) {
      ctx.fillStyle = `rgba(80,230,140,${0.45 * p.glow})`;
      rrect(ctx, x - 8, y - 8, w + 16, 46, 16); ctx.fill();
    }
    // кам'яна основа
    const base = p.kind === 'base';
    const depth = base ? 34 : 24;
    ctx.fillStyle = th.rock;
    ctx.beginPath(); ctx.moveTo(x + 4, y + 8); ctx.lineTo(x + w - 4, y + 8);
    ctx.lineTo(x + w * 0.62, y + 8 + depth); ctx.lineTo(x + w * 0.5, y + 14 + depth); ctx.lineTo(x + w * 0.38, y + 8 + depth); ctx.closePath(); ctx.fill();
    ctx.fillStyle = th.rockDk;
    ctx.beginPath(); ctx.moveTo(x + w * 0.5, y + 10); ctx.lineTo(x + w - 4, y + 8); ctx.lineTo(x + w * 0.62, y + 8 + depth); ctx.lineTo(x + w * 0.5, y + 14 + depth); ctx.closePath(); ctx.fill();
    // верх
    ctx.fillStyle = sel ? '#fff4b0' : th.top;
    rrect(ctx, x, y, w, 14, 7); ctx.fill();
    ctx.fillStyle = th.topHl; rrect(ctx, x + 6, y + 2, w - 12, 4, 2); ctx.fill();
    ctx.strokeStyle = 'rgba(40,20,60,.35)'; ctx.lineWidth = 2; rrect(ctx, x, y, w, 14, 7); ctx.stroke();
    if (p.crack) {
      ctx.strokeStyle = 'rgba(40,20,20,.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x - 4, y); ctx.lineTo(p.x + 6, y + 8 * p.crack); ctx.lineTo(p.x - 3, y + 16 * p.crack); ctx.lineTo(p.x + 5, y + 26 * p.crack); ctx.stroke();
    }
    // прапор чекпоінта / вершини
    if (p.flag || p.cp) drawFlag(p.x + w * 0.32, y, p.summit ? 1.5 : 1, p.flag || 1, T, p.summit);
    // напис-варіант
    if (p.kind === 'opt' && p.label && !p.dead) {
      const sp = labelSprite(p, w, sel);
      const by = y - sp.bh - 12;
      blit(sp.c, x + sp.ox, by + sp.oy);
    }
    ctx.restore();
  }
  function drawFlag(x, y, s, k, T, gold) {
    const h = 54 * s * Math.min(1, k * 1.4);
    ctx.strokeStyle = '#5b3b2a'; ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
    const fw = 30 * s * k, fh = 18 * s;
    ctx.fillStyle = gold ? '#ffd23f' : th.accent;
    ctx.beginPath(); ctx.moveTo(x, y - h);
    for (let i = 0; i <= 6; i++) { const t = i / 6; ctx.lineTo(x + fw * t, y - h + Math.sin(T * 6 - t * 4) * 3 * t + fh * 0.5 * t); }
    ctx.lineTo(x, y - h + fh); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,20,60,.4)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (gold) { ctx.fillStyle = '#fff'; starPath(ctx, x + fw * 0.4, y - h + fh * 0.5, 5 * s, T, 0.45); ctx.fill(); }
  }
  function drawParts(types) {
    for (const q of parts) {
      if (!types.includes(q.t)) continue;
      const k = q.life / q.max;
      const y = toScreenY(q.y);
      if (q.t === 'dust') {
        ctx.globalAlpha = 0.75 * (1 - k); ctx.fillStyle = q.c;
        ctx.beginPath(); ctx.arc(q.x, y, q.s * (0.6 + k), 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      } else if (q.t === 'chunk') {
        ctx.save(); ctx.translate(q.x, y); ctx.rotate(q.r); ctx.globalAlpha = 1 - k * k;
        ctx.fillStyle = q.c; ctx.fillRect(-q.s / 2, -q.s / 2, q.s, q.s * 0.8); ctx.restore();
      } else if (q.t === 'spark') {
        // v17: іскра — готовий спрайт-зірочка, у кадрі лише drawImage з поворотом
        const sp = q.img || (q.img = starSprite(q.c)), sz = q.s * (1 - k * 0.5);
        ctx.save(); ctx.globalAlpha = 1 - k; ctx.translate(q.x, y); ctx.rotate(q.r);
        ctx.drawImage(sp, -sz, -sz, sz * 2, sz * 2); ctx.restore();
      } else if (q.t === 'text') {
        // v17: «+10 XP» — кешований спрайт тексту, вилітає з пружинкою
        const sc = k < 0.15 ? 0.6 + k / 0.15 * 0.6 : 1.2 - Math.min(0.2, (k - 0.15));
        const sp = q.img || (q.img = popSprite(q.text, q.c));
        ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
        ctx.drawImage(sp, q.x - sp.w * sc / 2, y - sp.h * sc / 2, sp.w * sc, sp.h * sc); ctx.globalAlpha = 1;
      }
    }
  }

  // ------------------------------------------------ HUD
  function paintHud() {
    if (!g) return;
    hud.hearts.innerHTML = Array.from({ length: HEARTS }, (_, i) => `<i class="${i < g.hearts ? '' : 'lost'}">❤️</i>`).join('');
    hud.height.textContent = g.lvl;
    hud.combo.hidden = g.combo < 2;
    hud.comboN.textContent = g.combo;
    const pc = (g.lvl / GOAL) * 100;
    hud.fill.style.height = pc + '%';
    hud.dot.style.bottom = pc + '%';
  }
  function bumpHeart() {
    const h = hud.hearts.children[g.hearts];
    if (h) { h.classList.remove('g-bump'); void h.offsetWidth; h.classList.add('g-bump'); }
  }

  // ------------------------------------------------ керування
  function optAt(x, y) {
    if (!g || phase !== 'ask') return -1;
    const opts = g.plats.filter((p) => p.kind === 'opt' && !p.dead);
    for (const p of opts) {
      const py = toScreenY(surfY(p.lvl));
      if (Math.abs(x - p.x) <= p.w / 2 + 6 && y > py - 110 && y < py + 50) return p.i;
    }
    return -1;
  }
  let downOpt = -1;
  function onDown(e) {
    if (paused || phase !== 'ask') return;
    const r = cv.getBoundingClientRect();
    downOpt = optAt(e.clientX - r.left, e.clientY - r.top);
    if (downOpt >= 0) {
      g.sel = downOpt;
      const p = g.plats.find((o) => o.kind === 'opt' && o.i === downOpt && !o.dead);
      if (p) p.press = 1;
      hap(app, 'light');
    }
  }
  function onUp(e) {
    if (paused || phase !== 'ask') return;
    const r = cv.getBoundingClientRect();
    const i = optAt(e.clientX - r.left, e.clientY - r.top);
    if (i >= 0 && (i === downOpt || downOpt < 0)) choose(i);
    downOpt = -1;
  }
  function onKey(e) {
    if (!alive || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'p' || e.key === 'P' || (e.key === ' ' && phase !== 'ask')) { if (phase !== 'intro' && !overlay) { e.preventDefault(); pause(); } return; }
    if (paused || phase !== 'ask' || !g?.q) return;
    const n = g.q.opts.length;
    if (/^[1-4]$/.test(e.key) && +e.key <= n) { e.preventDefault(); g.sel = +e.key - 1; choose(+e.key - 1); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); g.sel = g.sel <= 0 ? n - 1 : g.sel - 1; hap(app); }
    if (e.key === 'ArrowRight') { e.preventDefault(); g.sel = g.sel < 0 || g.sel >= n - 1 ? 0 : g.sel + 1; hap(app); }
    if ((e.key === 'Enter' || e.key === ' ') && g.sel >= 0) { e.preventDefault(); choose(g.sel); }
  }
  function onVis() { if (document.hidden && phase !== 'intro' && !overlay && alive) pause(); }
  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointerup', onUp);
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVis);

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
      <div class="g-card-ico">🧗</div>
      ${hard ? `<div class="g-hard-tag">${tr('common.hard_tag')}</div>` : ''}
      ${tr('obby.title')}
      <div class="g-sub">${esc(world.emoji || '')} ${esc(tc(world, 'name') || '')}${best ? `${tr('obby.best')}${'⭐'.repeat(best)}` : ''}</div>
      <div class="g-intro-lumi"></div>
      <ul class="g-rules">
        <li>${tr('obby.r1')}</li>
        <li>${tr('obby.r2')}</li>
        <li>${tr('obby.r3', { 0: GOAL, 1: CP_EVERY, 2: HEARTS })}</li>
        ${hard ? `<li>${tr('obby.r_hard', { 0: GOAL, 1: HEARTS })}</li>` : ''}
      </ul>
      <div class="g-keys">${tr('obby.keys')}</div>
      <button class="g-btn g-btn-big g-btn-go" data-a="go">${tr('obby.start')}</button>
      ${inTg ? '' : '<button class="g-btn g-btn-ghost" data-a="back">' + tr('common.back') + '</button>'}
    </div>`;
    scr.append(overlay);
    lumiRefs.push(makeLumi(app, overlay.querySelector('.g-intro-lumi'), 88, 'excited'));
    const bk = overlay.querySelector('[data-a=back]');
    if (bk) bk.onclick = () => { hap(app); app.back(); };
    overlay.querySelector('[data-a=go]').onclick = () => { hap(app, 'medium'); closeOverlay(); begin(); };
  }
  function begin() {
    newGame();
    after(0.35, () => { if (alive) nextQuestion(); });
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
      <div class="g-sub">${tr('obby.height', { 0: g?.lvl || 0, 1: GOAL })} · ❤️ ${g?.hearts ?? HEARTS}</div>
      <button class="g-btn g-btn-big g-btn-go" data-a="resume">${tr('obby.resume')}</button>
      <button class="g-btn g-btn-big" data-a="restart">${tr('obby.restart')}</button>
      <button class="g-btn g-btn-big g-btn-ghost" data-a="exit">${tr('common.exit')}</button>
    </div>`;
    scr.append(overlay);
    const on = (a, fn) => { overlay.querySelector(`[data-a=${a}]`).onclick = () => { hap(app); fn(); }; };
    on('resume', () => { closeOverlay(); paused = false; _debug.phase = phase; start(); });
    on('restart', () => { closeOverlay(); paused = false; hud.q.hidden = true; begin(); });
    on('exit', () => app.back());
  }

  function finish(win) {
    if (!alive || overlay) return;
    phase = 'over'; _debug.phase = 'result';
    hud.q.hidden = true;
    const total = g.correct + g.mistakes;
    const stars = win ? starsByRatio(total ? g.correct / total : 1) : 0;
    const rec = recordGame(st, gameId, stars);
    app.save?.();
    dirty = false;
    hap(app, win ? 'success' : 'error');
    overlay = el('div', `g-over g-result ${win ? 'win' : 'lose'}`);
    overlay.innerHTML = `<div class="g-rays" aria-hidden="true"></div><div class="g-card">
      <div class="g-banner">${win ? tr('obby.win') : tr('obby.lose')}</div>
      <div class="g-stars"></div>
      <p class="g-sub">${win ? (stars === 3 ? tr('obby.perfect') : tr('obby.flag')) : tr('obby.out')}</p>
      ${rec.isRecord ? '<div class="g-record">' + tr('common.record') + '</div>' : ''}
      <div class="g-stats">
        <div><span>${tr('obby.s_height')}</span><strong><b data-n="${g.lvl}">0</b><em>/${GOAL}</em></strong></div>
        <div><span>${tr('obby.s_right')}</span><strong><b data-n="${g.correct}">0</b></strong></div>
        <div><span>${tr('obby.s_wrong')}</span><strong><b data-n="${g.mistakes}">0</b></strong></div>
        <div><span>${tr('obby.s_combo')}</span><strong><b data-n="${g.bestCombo}">0</b></strong></div>
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
  start(); // фон живе й під екраном старту

  return () => {
    alive = false;
    stop();
    if (dirty) { dirty = false; try { app.save?.(); } catch (e) { console.warn(e); } }
    ro?.disconnect();
    cv.removeEventListener('pointerdown', onDown);
    cv.removeEventListener('pointerup', onUp);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVis);
    document.fonts?.removeEventListener?.('loadingdone', onFonts);
    canvasGameOn(false);
    lumiRefs.forEach((l) => { try { l?.destroy?.(); } catch (e) { /* */ } });
    jobs = [];
  };
}

// ---------------------------------------------------------------- кольори
function hexRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function hexA(h, a) { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; }
function mix(a, b, k) {
  const A = hexRgb(a), B = hexRgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`;
}
