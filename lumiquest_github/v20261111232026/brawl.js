// 💥 Зоряна Сутичка — аренний бій з видом зверху (canvas + rAF, delta-time).
// Лумі в центрі арени, до неї повзуть «Помилки» (кумедні клякси) з українськими словами.
// Знизу — 3 англійські варіанти для найближчого ворога: правильно — зоряний снаряд і вибух,
// неправильно — ворог робить ривок. 3 ❤️, хвилі, супер-атака за серію, таймер 90 с.
import * as S from './state.js?v=20261111232024';
import { tr, tc, twords, sfx, speak, starSfx } from './i18n_modes.js?v=20261111232024';
import * as FX from './fx.js?v=20261111232024';
import * as L from './lumi.js?v=20261111232024';
import { recordGame, starsByRatio, gameStars } from './games.js?v=20261111232024';
import { perfLite, fpsWatch, canvasGameOn } from './obby.js?v=20261111232024';

// ---------------------------------------------------------------- спільні дрібниці
const MODES_HREF = new URL('./modes.css?v=20261111232024', import.meta.url).href;
const G2_HREF = new URL('./games2.css?v=20261111232024', import.meta.url).href;
function loadCss(key, href) {
  let l = document.querySelector(`link[data-${key}-css]`);
  if (!l) {
    l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href; l.setAttribute(`data-${key}-css`, '1');
    l.addEventListener('load', () => { l.dataset.ready = '1'; }, { once: true });
    document.head.append(l);
  }
  return l;
}
function ensureCss(root) {
  const wait = [loadCss('modes', MODES_HREF), loadCss('games2', G2_HREF)].filter((l) => !l.dataset.ready && !l.sheet);
  if (!wait.length) return;
  root.style.visibility = 'hidden';
  let left = wait.length;
  const show = () => { if (--left <= 0) root.style.visibility = ''; };
  wait.forEach((l) => { l.addEventListener('load', show, { once: true }); l.addEventListener('error', show, { once: true }); });
  setTimeout(() => { root.style.visibility = ''; }, 1500);
}
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
function countUp(node, from, to, ms = 900) {
  if (typeof FX.countUp === 'function') { try { return FX.countUp(node, from, to, ms); } catch (e) { /* fallback */ } }
  node.textContent = to;
  return undefined;
}
function makeLumi(app, container, size, emotion) {
  try {
    if (typeof app?.makeLumi === 'function') return app.makeLumi(container, { size, emotion, global: false });
    if (typeof L.createLumi === 'function') { const l = L.createLumi(container, { size, emotion }); l?.set?.(emotion); return l; }
  } catch (e) { console.warn('lumi', e); }
  return null;
}
export const meta = { topbar: false };
const addXP = (st, n) => (typeof S.addXP === 'function' ? S.addXP(st, n) : (st.xp = (st.xp || 0) + n));
function onCorrect(st) {
  if (typeof S.onCorrectAnswer === 'function') return S.onCorrectAnswer(st);
  st.fireflies = (st.fireflies || 0) + 1;
  st.food = (st.food || 0) + 1;
}
const norm = (s) => (typeof S.norm === 'function' ? S.norm(s) : String(s || '').trim().toLowerCase());
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function seeded(seed) { // mulberry32 — стабільний декор між перемальовками
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5; let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- правила
export const GAME_TIME = 90;
export const MAX_HEARTS = 3;
export const SUPER_N = 5;          // серія правильних для супер-атаки
export const VOLUME_GOAL = 12;     // скільки правильних треба для «повного» результату
/** Зірки: точність × обсяг (12 правильних = повний), якщо Лумі втомилась — максимум 1⭐. */
export function brawlStars({ correct, wrong, leaks, dead }) {
  const acc = correct / Math.max(1, correct + wrong + leaks);
  const vol = Math.min(1, correct / VOLUME_GOAL);
  const s = starsByRatio(acc * vol);
  return dead ? Math.min(1, s) : s;
}

// Палітри світів: w1 ранкова галявина … w5 нічне небо
const PAL = {
  // v11: проміжні світи — пісок берега, пшеничне поле, дошки причалу в сутінках
  w1b: { g0: '#fff3cf', g1: '#f3dca0', g2: '#e2c27e', ring: 'rgba(255,255,240,.6)', tuft: '#d9b56e', dots: ['#ff9f8a', '#ffffff', '#7fd8d0', '#ffd27a'],
    deco: 'bush', bush: ['#2fb0a0', '#6fd8c0'], amb: 'pollen', ink: '#12475a', sun: 'rgba(255,245,190,.4)' },
  w2b: { g0: '#fff0a8', g1: '#ecd06a', g2: '#cfa846', ring: 'rgba(255,250,210,.55)', tuft: '#c29a3a', dots: ['#ff7f5a', '#ffffff', '#8fc8f5'],
    deco: 'bush', bush: ['#b9a03a', '#e8cf5a'], amb: 'pollen', ink: '#4a3712', sun: 'rgba(255,240,170,.3)' },
  w3b: { g0: '#3a5490', g1: '#22386e', g2: '#111c40', ring: 'rgba(255,200,110,.3)', tuft: '#2c467f', dots: ['#ffc65a', '#ffffff', '#8fb4ff'],
    deco: 'sky', bush: ['#3a5a9c', '#6f8fd8'], amb: 'stars', ink: '#eaf0ff', sun: 'rgba(255,190,90,.16)' },
  w4b: { g0: '#c9d1de', g1: '#8e9aac', g2: '#5a6678', ring: 'rgba(240,244,250,.45)', tuft: '#6e7a8c', dots: ['#8fe0d6', '#ffffff', '#d7ccf4'],
    deco: 'sky', bush: ['#4f7a88', '#8fe0d6'], amb: 'snow', ink: '#1f2b3a', sun: 'rgba(225,240,255,.22)' },
  w1: { g0: '#e4f9b8', g1: '#9fd97f', g2: '#79c266', ring: 'rgba(255,255,230,.55)', tuft: '#5fae55', dots: ['#ff8fb1', '#fff27a', '#ffffff', '#ffb36b'],
    deco: 'bush', bush: ['#56b45c', '#8be07c'], amb: 'pollen', ink: '#3b5a2a', sun: 'rgba(255,240,180,.35)' },
  w2: { g0: '#9ccc84', g1: '#5f9e63', g2: '#3a7449', ring: 'rgba(230,255,200,.28)', tuft: '#2c6338', dots: ['#e85a4f', '#f7f0d0', '#c8f08f'],
    deco: 'forest', bush: ['#2f7044', '#4f9b5a'], amb: 'firefly', ink: '#1e3d26', sun: 'rgba(200,255,180,.12)' },
  w3: { g0: '#fbe2bd', g1: '#e2b388', g2: '#b9835c', ring: 'rgba(255,240,210,.5)', tuft: '#a8724c', dots: ['#c98a4b', '#f0c49a', '#8a5a3a'],
    deco: 'town', bush: ['#c98a4b', '#e8ad6a'], amb: 'dust', ink: '#5a3a22', sun: 'rgba(255,220,160,.25)' },
  w4: { g0: '#ffffff', g1: '#d5ebff', g2: '#9cc4ee', ring: 'rgba(255,255,255,.7)', tuft: '#a9cdf0', dots: ['#ffffff', '#c6e4ff', '#d9c8ff'],
    deco: 'ice', bush: ['#8fd3ff', '#c6a2ff'], amb: 'snow', ink: '#3a5a86', sun: 'rgba(255,255,255,.2)' },
  w5: { g0: '#4b37a0', g1: '#2e1f63', g2: '#150d33', ring: 'rgba(185,162,255,.35)', tuft: '#5b47b8', dots: ['#fff3b0', '#ffffff', '#b9a2ff'],
    deco: 'sky', bush: ['#6b55c9', '#9a86ff'], amb: 'stars', ink: '#e8e0ff', sun: 'rgba(120,90,255,.15)' },
};
const GOO = [['#a46bff', '#6a37c9'], ['#ff6b9a', '#c23a6a'], ['#3fcf9f', '#1f8d6a'], ['#ff9f43', '#c96a14'], ['#4fa8ff', '#246ec4']];
const LUMI_C = { outline: '#482c56', eye: '#322044', cheek: '#ff8096', mouth: '#6e2846', starCore: '#fff7c8', starEdge: '#ffc440', foot: '#b09ce8',
  body: [[0, '#ffe8ac'], [0.45, '#ffc8ac'], [0.8, '#e2b8e4'], [1, '#beaaf2']] };

const glowCache = new Map();
function glow(color) {
  let c = glowCache.get(color);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, color); gr.addColorStop(0.35, color + 'aa'); gr.addColorStop(1, color + '00');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  glowCache.set(color, c);
  return c;
}
function starPath(ctx, x, y, r, rot = 0, inner = 0.48) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * inner : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// ---------------------------------------------------------------- екран
export function render(root, params, app) {
  ensureCss(root);
  root.classList.add('m-host');
  const inTg = !!app?.tg?.isTelegram;
  const st = app.state;
  const wid = params?.wid || 'w1';
  const world = (app.content?.WORLDS || []).find((w) => w.id === wid);
  const words = twords(app.content, wid).filter((p) => Array.isArray(p) && p[0] && p[1]);
  const hard = !!params?.hard;
  const gid = params?.id || `${wid}-brawl${hard ? 'x' : ''}`;
  // виклик: 75 с, вороги швидші й частіші, 4 варіанти відповіді
  const TIME = hard ? 75 : GAME_TIME;
  const NOPT = hard ? 4 : 3;
  const SPD_K = hard ? 1.3 : 1;
  const SPAWN_K = hard ? 0.7 : 1;
  const P = PAL[wid] || PAL.w1;
  let alive = true;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms));

  const scr = el('div', `m-screen g2-screen g2-brawl g2-${esc(wid)}${hard ? ' g2-hard' : ''}`);
  root.append(scr);

  if (!world || words.length < 4 || !(st.unlocked || []).includes(wid)) {
    scr.innerHTML = `<div class="m-locked"><div class="m-locked-ico">🔒</div>
      <p>${world ? tr('common.locked_world') : tr('brawl.building')}</p>
      <button class="m-btn" data-a="back">${tr('common.back')}</button></div>`;
    scr.querySelector('[data-a=back]').onclick = () => app.back();
    return () => { alive = false; };
  }

  scr.innerHTML = `
    <header class="m-head g2-head">
      <button class="m-back" ${tr('common.back_aria')}${inTg ? ' hidden' : ''}>‹</button>
      <div class="g2-hearts" ${tr('common.lives_aria')}>${'<span class="g2-heart">❤️</span>'.repeat(MAX_HEARTS)}</div>
      <div class="g2-timer" ${tr('brawl.time_aria')}><span>⏱</span><b>${TIME}</b></div>
      <div class="g2-score" ${tr('brawl.kills_aria')}>💥 <b>0</b></div>
      <button class="g2-pause" ${tr('common.pause_aria')}>⏸</button>
    </header>
    <div class="g2-arena"><canvas class="g2-bgl" aria-hidden="true"></canvas><canvas ${tr('brawl.arena_aria')}></canvas><div class="g2-banner" aria-live="polite"></div></div>
    <div class="g2-dock">
      <div class="g2-super">
        <div class="g2-super-bar"><i></i>${'<b></b>'.repeat(SUPER_N - 1)}</div>
        <button class="g2-super-btn" disabled>${tr('brawl.super')}</button>
      </div>
      <div class="g2-ask">${tr('brawl.ask')} <b>…</b></div>
      <div class="g2-answers">${Array.from({ length: NOPT }, (_, k) => k).map((k) => `<button class="g2-ans" data-k="${k}" disabled><small>${k + 1}</small><span>…</span></button>`).join('')}</div>
    </div>`;
  const $ = (q) => scr.querySelector(q);
  const canvas = $('canvas[aria-label]');
  const ctx = canvas.getContext('2d');
  const arenaEl = $('.g2-arena');
  const bannerEl = $('.g2-banner');
  const heartEls = [...scr.querySelectorAll('.g2-heart')];
  const timerEl = $('.g2-timer');
  const timerB = $('.g2-timer b');
  const scoreB = $('.g2-score b');
  const superBar = $('.g2-super-bar i');
  const superBtn = $('.g2-super-btn');
  const askB = $('.g2-ask b');
  const ansBtns = [...scr.querySelectorAll('.g2-ans')];

  // ------------------------------------------------ розміри / фон
  let W = 0; let H = 0; let dpr = 1; let cx = 0; let cy = 0; let LR = 28; let ER = 21;
  const bg = $('.g2-bgl'); // v6: статичний фон — окреме полотно під ареною (не копіюємо його щокадру)
  let bgShake = false;
  function resize() {
    const r = arenaEl.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = Math.min(perfLite() ? 1.5 : 2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    cx = W / 2; cy = H * 0.5;
    LR = clamp(Math.min(W, H) * 0.075, 22, 36);
    ER = LR * 0.78;
    paintBg();
    ['#ffd68c', '#ffe48a', '#f8ffb0'].forEach(glow); // v6: прогрів спрайтів сяйва до першого пострілу
    initAmbient();
    if (!raf) draw();
  }
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => alive && resize()) : null;
  ro?.observe(arenaEl);

  function paintBg() {
    bg.width = canvas.width; bg.height = canvas.height;
    bg.style.width = W + 'px'; bg.style.height = H + 'px';
    const g = bg.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const R = Math.hypot(W, H) / 2;
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R);
    gr.addColorStop(0, P.g0); gr.addColorStop(0.55, P.g1); gr.addColorStop(1, P.g2);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const rand = seeded(wid.charCodeAt(1) * 977 + 13);
    // дрібна фактура: травинки / камінці / іскри
    for (let i = 0; i < Math.round(W * H / 900); i++) {
      const x = rand() * W; const y = rand() * H;
      g.globalAlpha = 0.25 + rand() * 0.35;
      if (P.deco === 'town') { // бруківка
        g.strokeStyle = P.tuft; g.lineWidth = 1.2;
        rrect(g, x, y, 14 + rand() * 10, 9 + rand() * 5, 4); g.stroke();
      } else if (P.deco === 'sky') {
        g.fillStyle = P.dots[(rand() * 3) | 0]; g.beginPath(); g.arc(x, y, rand() * 1.4 + 0.3, 0, 7); g.fill();
      } else if (P.deco === 'ice') {
        g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8 + rand() * 8, y + rand() * 4 - 2); g.stroke();
      } else {
        g.strokeStyle = P.tuft; g.lineWidth = 1.6; g.lineCap = 'round';
        g.beginPath();
        g.moveTo(x, y); g.quadraticCurveTo(x - 2, y - 5, x - 4, y - 8);
        g.moveTo(x + 2, y); g.quadraticCurveTo(x + 3, y - 6, x + 5, y - 9);
        g.stroke();
      }
    }
    g.globalAlpha = 1;
    // квіточки / цятки
    for (let i = 0; i < Math.round(W * H / 6000); i++) {
      const x = rand() * W; const y = rand() * H; const c = P.dots[(rand() * P.dots.length) | 0];
      g.fillStyle = c;
      if (P.deco === 'bush') {
        for (let k = 0; k < 5; k++) { const a = k * 1.2566; g.beginPath(); g.arc(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2.2, 0, 7); g.fill(); }
        g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill();
      } else if (P.deco === 'sky') {
        g.globalAlpha = 0.8; starPath(g, x, y, 2.6 + rand() * 1.5, rand()); g.fill(); g.globalAlpha = 1;
      } else { g.globalAlpha = 0.6; g.beginPath(); g.arc(x, y, 2 + rand() * 2, 0, 7); g.fill(); g.globalAlpha = 1; }
    }
    // коло арени
    const ar = Math.min(W, H) * 0.4;
    g.fillStyle = P.ring; g.beginPath(); g.arc(cx, cy, ar, 0, 7); g.fill();
    g.setLineDash([10, 9]); g.lineWidth = 3; g.strokeStyle = P.ring; g.beginPath(); g.arc(cx, cy, ar + 10, 0, 7); g.stroke(); g.setLineDash([]);
    g.globalAlpha = 0.18; g.fillStyle = P.ink; g.beginPath(); g.arc(cx, cy, LR * 1.9, 0, 7); g.fill(); g.globalAlpha = 1;
    // декор по краях: кущі / ящики / кристали …
    const spots = [[0.1, 0.08], [0.88, 0.1], [0.06, 0.52], [0.93, 0.6], [0.14, 0.93], [0.84, 0.92], [0.5, 0.04]];
    spots.forEach(([nx, ny], i) => deco(g, nx * W, ny * H, LR * (0.9 + rand() * 0.4), i, rand));
    // світло зверху
    const sun = g.createLinearGradient(0, 0, 0, H * 0.6);
    sun.addColorStop(0, P.sun); sun.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sun; g.fillRect(0, 0, W, H);
    // віньєтка
    const vg = g.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 1.05);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, (wid === 'w5' || wid === 'w3b') ? 'rgba(5,0,20,.55)' : 'rgba(40,20,60,.22)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function deco(g, x, y, s, i, rand) {
    g.save(); g.translate(x, y);
    g.lineWidth = 2.5; g.strokeStyle = 'rgba(40,25,60,.55)';
    g.fillStyle = 'rgba(30,20,50,.18)'; g.beginPath(); g.ellipse(0, s * 0.55, s * 1.1, s * 0.35, 0, 0, 7); g.fill();
    const kind = P.deco;
    if (kind === 'bush' || (kind === 'forest' && i % 2 === 0)) {
      const [c0, c1] = P.bush;
      [[-0.55, 0.1, 0.62], [0.5, 0.15, 0.6], [0, -0.25, 0.75]].forEach(([dx, dy, rr]) => {
        g.fillStyle = c0; g.beginPath(); g.arc(dx * s, dy * s, rr * s, 0, 7); g.fill(); g.stroke();
      });
      g.fillStyle = c1; g.beginPath(); g.arc(-0.15 * s, -0.45 * s, 0.32 * s, 0, 7); g.fill();
      if (kind === 'bush') { g.fillStyle = '#ff5f7a'; [[-0.5, 0], [0.35, -0.05], [0.05, 0.25]].forEach(([dx, dy]) => { g.beginPath(); g.arc(dx * s, dy * s, s * 0.09, 0, 7); g.fill(); }); }
    } else if (kind === 'forest') { // гриб
      g.fillStyle = '#f7f0d0'; rrect(g, -s * 0.18, -s * 0.1, s * 0.36, s * 0.6, s * 0.12); g.fill(); g.stroke();
      g.fillStyle = '#e8574d'; g.beginPath(); g.ellipse(0, -s * 0.15, s * 0.6, s * 0.42, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#fff'; [[-0.25, -0.35], [0.2, -0.3], [0, -0.48]].forEach(([dx, dy]) => { g.beginPath(); g.arc(dx * s, dy * s, s * 0.08, 0, 7); g.fill(); });
    } else if (kind === 'town') {
      if (i % 2) { // ящик
        g.fillStyle = '#c98a4b'; rrect(g, -s * 0.6, -s * 0.6, s * 1.2, s * 1.1, 5); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(90,50,20,.6)'; g.beginPath(); g.moveTo(-s * 0.5, -s * 0.5); g.lineTo(s * 0.5, s * 0.4); g.moveTo(s * 0.5, -s * 0.5); g.lineTo(-s * 0.5, s * 0.4); g.stroke();
      } else { // шестерня
        g.fillStyle = '#d9a441';
        g.beginPath();
        for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8; const rr = k % 2 ? s * 0.55 : s * 0.72; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr - s * 0.1); }
        g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#8a5a3a'; g.beginPath(); g.arc(0, -s * 0.1, s * 0.2, 0, 7); g.fill();
      }
    } else if (kind === 'ice') {
      const cols = P.bush;
      [[-0.35, 0.7, -0.25], [0.05, 1.0, 0.05], [0.4, 0.6, 0.3]].forEach(([dx, hh, tilt], k) => {
        g.save(); g.translate(dx * s, s * 0.3); g.rotate(tilt);
        g.fillStyle = cols[k % 2]; g.beginPath();
        g.moveTo(-s * 0.18, 0); g.lineTo(-s * 0.18, -s * hh * 0.7); g.lineTo(0, -s * hh); g.lineTo(s * 0.18, -s * hh * 0.7); g.lineTo(s * 0.18, 0); g.closePath();
        g.fill(); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-s * 0.1, -s * hh * 0.65, s * 0.06, s * hh * 0.5);
        g.restore();
      });
    } else { // sky: хмаринка з книжками
      g.fillStyle = 'rgba(200,185,255,.85)';
      [[-0.5, 0.1, 0.4], [0, -0.05, 0.55], [0.5, 0.12, 0.38]].forEach(([dx, dy, rr]) => { g.beginPath(); g.arc(dx * s, dy * s, rr * s, 0, 7); g.fill(); });
      ['#ff8fb1', '#ffd84a', '#7fd1ff'].forEach((c, k) => { g.fillStyle = c; rrect(g, -s * 0.4, -s * (0.35 + k * 0.2), s * 0.8, s * 0.18, 3); g.fill(); g.stroke(); });
    }
    g.restore();
  }

  // ------------------------------------------------ амбієнт (пилок/світлячки/пил/сніг/зорі)
  let amb = [];
  function initAmbient() {
    const n = (P.amb === 'stars' ? 34 : P.amb === 'firefly' ? 16 : 26) >> (perfLite() ? 1 : 0);
    amb = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, s: rnd(0.6, 1.4), p: Math.random() * 6.28, v: rnd(0.6, 1.3) }));
  }
  function drawAmbient(dt, t) {
    ctx.save();
    for (const a of amb) {
      if (P.amb === 'pollen') { a.x += 8 * a.v * dt; a.y -= 10 * a.v * dt; a.x += Math.sin(t + a.p) * 0.2; }
      else if (P.amb === 'firefly') { a.x += Math.cos(t * 0.5 + a.p) * 12 * dt; a.y += Math.sin(t * 0.7 + a.p) * 10 * dt; }
      else if (P.amb === 'dust') { a.x += 18 * a.v * dt; a.y += Math.sin(t + a.p) * 6 * dt + 4 * dt; }
      else if (P.amb === 'snow') { a.y += 22 * a.v * dt; a.x += Math.sin(t * 1.3 + a.p) * 10 * dt; }
      if (a.x > W + 10) a.x = -10; if (a.x < -10) a.x = W + 10; if (a.y < -10) a.y = H + 10; if (a.y > H + 10) a.y = -10;
      if (P.amb === 'firefly') {
        const k = 0.5 + 0.5 * Math.sin(t * 2.4 + a.p * 3);
        ctx.globalAlpha = 0.3 + k * 0.7;
        ctx.drawImage(glow('#f8ffb0'), a.x - 9 * a.s, a.y - 9 * a.s, 18 * a.s, 18 * a.s);
      } else if (P.amb === 'stars') {
        ctx.globalAlpha = 0.25 + 0.75 * Math.abs(Math.sin(t * 1.2 * a.v + a.p));
        ctx.fillStyle = '#fff6d0'; starPath(ctx, a.x, a.y, 2.2 * a.s, a.p); ctx.fill();
      } else {
        ctx.globalAlpha = P.amb === 'snow' ? 0.9 : 0.65;
        ctx.fillStyle = P.amb === 'pollen' ? '#fff3a0' : P.amb === 'dust' ? '#e8a35c' : '#ffffff';
        ctx.beginPath(); ctx.arc(a.x, a.y, (P.amb === 'snow' ? 2.2 : 1.8) * a.s, 0, 7); ctx.fill();
      }
    }
    ctx.restore();
  }

  // ------------------------------------------------ стан гри
  let G;
  let deck = [];
  let seq = 0;
  function fresh() {
    G = { phase: 'intro', t: 0, timeLeft: TIME, hearts: MAX_HEARTS, correct: 0, wrong: 0, leaks: 0, kills: 0,
      streak: 0, bestStreak: 0, meter: 0, wave: 0, waveLeft: 0, spawnT: 0, waveBreak: 0, countdown: 0, endT: 0, reason: '',
      enemies: [], shots: [], parts: [], rings: [], texts: [], slime: [], shake: 0, flash: 0, flashColor: '#fff',
      lumi: { squash: 0, hurt: 0, inv: 0, spin: 0, happy: 0, look: -Math.PI / 2 },
      target: null, opts: [], lockUntil: 0, shownSec: -1, dirty: false };
    deck = [];
  }
  fresh();

  function nextWord() {
    const onScreen = new Set(G.enemies.filter((e) => !e.dead).map((e) => e.word[0]));
    for (let tries = 0; tries < 2; tries++) {
      if (!deck.length) deck = shuffle(words.slice());
      const i = deck.findIndex((w) => !onScreen.has(w[0]));
      if (i >= 0) return deck.splice(i, 1)[0];
      deck = [];
    }
    return words[(Math.random() * words.length) | 0];
  }
  function distractors(correct, n) {
    const c = norm(correct);
    const pool = shuffle([...new Set(words.map((w) => w[1]))].filter((w) => norm(w) !== c));
    return pool.slice(0, n);
  }

  // ------------------------------------------------ HUD
  function paintHearts(lost = -1) {
    heartEls.forEach((h, k) => {
      h.classList.toggle('off', k >= G.hearts);
      if (k === lost) { h.classList.remove('g2-crack'); void h.offsetWidth; h.classList.add('g2-crack'); }
    });
  }
  function paintHud() {
    const sec = Math.ceil(G.timeLeft);
    if (sec !== G.shownSec) {
      G.shownSec = sec;
      timerB.textContent = sec;
      timerEl.classList.toggle('low', sec <= 10 && G.phase === 'play');
    }
    if (G.kills !== G.shownKills) { G.shownKills = G.kills; scoreB.textContent = G.kills; }   // DOM — лише при зміні
    if (G.meter !== G.shownMeter) { G.shownMeter = G.meter; superBar.style.width = `${(G.meter / SUPER_N) * 100}%`; }
    const ready = G.meter >= SUPER_N && G.phase === 'play';
    if (superBtn.disabled === ready) {
      superBtn.disabled = !ready;
      superBtn.classList.toggle('ready', ready);
      if (ready) { banner(tr('brawl.ready'), 'gold'); hap(app, 'medium'); }
    }
  }
  let bannerT = null;
  function banner(text, cls = '') {
    bannerEl.className = 'g2-banner show ' + cls;
    bannerEl.textContent = text;
    clearTimeout(bannerT);
    bannerT = setTimeout(() => { if (alive) bannerEl.className = 'g2-banner'; }, 1400);
  }
  function setOptions() {
    const e = G.target;
    if (!e) {
      G.opts = [];
      askB.textContent = '…';
      ansBtns.forEach((b) => { b.disabled = true; b.classList.remove('ok', 'bad', 'g2-in'); b.querySelector('span').textContent = '…'; });
      return;
    }
    G.opts = shuffle([e.word[1], ...distractors(e.word[1], NOPT - 1)]);
    askB.textContent = e.word[0];
    ansBtns.forEach((b, k) => {
      b.classList.remove('ok', 'bad', 'g2-in');
      void b.offsetWidth;
      b.classList.add('g2-in');
      b.style.animationDelay = `${k * 40}ms`;
      b.disabled = !G.opts[k] || G.phase !== 'play';
      b.querySelector('span').textContent = G.opts[k] || '—';
    });
  }
  // Ціль «липка»: тримаємо поточну, поки жива; перемикаємо лише якщо інша клякса вже впритул.
  function pickTarget() {
    let best = null; let bd = Infinity;
    for (const e of G.enemies) {
      if (e.dead || e.doomed) continue;
      const d = Math.hypot(e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    const cur = G.target;
    if (cur && !cur.dead && !cur.doomed && best !== cur && !(bd < LR * 3.4 && Math.hypot(cur.x, cur.y) > bd + LR)) best = cur;
    if (best !== G.target) { G.target = best; if (performance.now() >= G.lockUntil) setOptions(); }
  }

  // ------------------------------------------------ спавн і хвилі
  function startWave(n) {
    G.wave = n;
    G.waveLeft = 3 + n * 2;
    G.spawnT = 0.5;
    banner(n === 1 ? tr('brawl.wave1') : `${tr('brawl.wave', { 0: n })}`);
    hap(app, 'medium');
  }
  function spawn() {
    const ang = Math.random() * Math.PI * 2;
    let best = null;
    for (let tries = 0; tries < 8; tries++) { // не поруч з іншими
      const a = ang + tries * 0.8;
      const x = clamp(Math.cos(a) * W, -W / 2 + ER * 1.4, W / 2 - ER * 1.4);
      const y = clamp(Math.sin(a) * H, -H / 2 + ER * 2.6, H / 2 - ER * 1.3 - 24); // знизу — панель відповідей
      const ok = G.enemies.every((e) => e.dead || Math.hypot(e.x - x, e.y - y) > ER * 4);
      best = { x, y };
      if (ok) break;
    }
    const speedBase = (Math.max(W, H) * 0.5) / 12.5;
    const goo = GOO[(seq + (Math.random() * 2 | 0)) % GOO.length];
    G.enemies.push({ id: ++seq, x: best.x, y: best.y, r: ER * rnd(0.92, 1.08), word: nextWord(), c0: goo[0], c1: goo[1],
      speed: speedBase * SPD_K * rnd(0.9, 1.1), dash: 0, age: 0, ph: Math.random() * 6.28,
      doomed: false, dead: false, trailT: 0, angry: 0 });
    G.waveLeft -= 1;
    burst(best.x, best.y, 10, goo[0], { speed: 90, size: 4, life: 0.5 });
  }

  // ------------------------------------------------ частинки
  function burst(x, y, n, color, { speed = 220, size = 5, life = 0.7, star = false, drag = 3.2 } = {}) {
    if (reduced()) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2; const v = speed * rnd(0.35, 1);
      G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * rnd(0.6, 1.1), age: 0, size: size * rnd(0.6, 1.3), color, star, rot: Math.random() * 6, drag });
    }
  }
  function floatTxt(x, y, txt, color = '#fff', size = 22) { G.texts.push({ x, y, txt, color, size, age: 0, life: 1 }); }

  // ------------------------------------------------ дії
  function shoot(e) {
    const a = Math.atan2(e.y, e.x);
    G.lumi.look = a;
    G.lumi.squash = 1;
    sfx('shoot');
    G.shots.push({ x: Math.cos(a) * LR * 0.6, y: Math.sin(a) * LR * 0.6 - LR * 0.4, v: 520, target: e, trail: [], rot: 0, age: 0 });
    burst(Math.cos(a) * LR, Math.sin(a) * LR - LR * 0.3, 6, '#ffe48a', { speed: 140, size: 3, life: 0.3, star: true });
  }
  function explode(e, { big = false, score = true } = {}) {
    if (e.dead) return;
    e.dead = true;
    if (!(G.t - (G.boomT ?? -9) < 0.07)) { G.boomT = G.t; sfx('explode'); }
    if (score) { G.kills += 1; floatTxt(e.x, e.y - e.r, big ? '💥' : '+1', '#fff', big ? 26 : 24); }
    burst(e.x, e.y, 22, e.c0, { speed: 260, size: 6, life: 0.75 });
    burst(e.x, e.y, 12, '#ffd84a', { speed: 330, size: 5, life: 0.6, star: true });
    G.rings.push({ x: e.x, y: e.y, r: e.r * 0.6, max: e.r * 3, age: 0, life: 0.45, color: '#ffffff', w: 6 });
    G.shake = Math.max(G.shake, big ? 9 : 6);
    if (G.target === e) G.target = null;
  }
  function answer(k) {
    if (G.phase !== 'play') return;
    const e = G.target; const b = ansBtns[k];
    if (!e || !b || b.disabled || performance.now() < G.lockUntil) return;
    const given = G.opts[k];
    if (norm(given) === norm(e.word[1])) {
      G.correct += 1; G.streak += 1; G.bestStreak = Math.max(G.bestStreak, G.streak);
      G.meter = Math.min(SUPER_N, G.meter + 1);
      onCorrect(st); addXP(st, 10); G.dirty = true;
      e.doomed = true;
      shoot(e);
      G.lumi.happy = 0.8;
      b.classList.add('ok');
      hap(app, 'light'); speak(e.word[1]);
      if (G.streak >= 3 && G.streak % 3 === 0) sfx('combo');
      if (G.streak >= 3 && G.streak % 3 === 0) floatTxt(0, -LR * 2.4, `🔥 ×${G.streak}`, '#ffd84a', 20);
      G.lockUntil = performance.now() + 170;
      ansBtns.forEach((x) => { x.disabled = true; });
      later(() => { G.lockUntil = 0; G.target = null; pickTarget(); if (!G.target) setOptions(); }, 170);
    } else {
      G.wrong += 1; G.streak = 0; G.meter = 0;
      try { S.noteMiss(st, wid, e.word[1]); } catch (e) { /* */ }
      e.dash = 0.45; e.angry = 1.2;
      b.classList.add('bad'); b.disabled = true;
      fx('shake', b);
      floatTxt(e.x, e.y - e.r * 2.2, '✗', '#ff5a6a', 26);
      G.shake = Math.max(G.shake, 4);
      hap(app, 'error'); sfx('wrong');
    }
    paintHud();
  }
  function superAttack() {
    if (G.phase !== 'play' || G.meter < SUPER_N) return;
    G.meter = 0;
    G.lumi.spin = 1; G.lumi.happy = 1.4;
    G.rings.push({ x: 0, y: 0, r: LR, max: Math.hypot(W, H) * 0.62, age: 0, life: 0.75, color: '#ffe48a', w: 16, nova: true });
    G.flash = 0.55; G.flashColor = '#fff6c8';
    G.shake = 16;
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      G.parts.push({ x: 0, y: 0, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, life: 0.8, age: 0, size: 8, color: '#ffd84a', star: true, rot: a, drag: 1.6 });
    }
    banner(tr('brawl.starfall'), 'gold');
    hap(app, 'heavy'); hap(app, 'success'); sfx('boss_hit');
    paintHud();
  }
  function hitLumi(e) {
    explode(e, { score: false });
    burst(e.x * 0.5, e.y * 0.5, 14, e.c1, { speed: 200, size: 7, life: 0.6 });
    if (G.lumi.inv > 0) return;
    G.hearts -= 1; G.leaks += 1; G.streak = 0; G.meter = 0;
    G.lumi.hurt = 0.9; G.lumi.inv = 1.1;
    G.shake = 16; G.flash = 0.45; G.flashColor = '#ff3b55';
    paintHearts(G.hearts);
    floatTxt(0, -LR * 2.2, '−❤️', '#ff5a6a', 24);
    hap(app, 'heavy'); hap(app, 'warning'); sfx('hit');
    if (G.hearts <= 0) endGame('dead');
  }

  // ------------------------------------------------ фази
  function startCountdown() {
    G.phase = 'count'; G.countdown = 3.2;
    G.target = null; setOptions(); paintHearts(); paintHud();
    startLoop();
  }
  function endGame(reason) {
    if (G.phase === 'end' || G.phase === 'result') return;
    G.phase = 'end'; G.reason = reason; G.endT = 1.5;
    timerB.textContent = Math.ceil(G.timeLeft); timerEl.classList.remove('low');
    G.target = null; setOptions();
    superBtn.disabled = true; superBtn.classList.remove('ready');
    if (reason === 'time') {
      banner(tr('brawl.time'), 'gold');
      G.enemies.forEach((e, i) => later(() => explode(e, { score: false }), 80 * i));
      hap(app, 'success');
    } else {
      banner(tr('brawl.tired'), 'bad');
    }
  }

  // ------------------------------------------------ цикл
  let raf = 0; let last = 0;
  const watch = fpsWatch(() => { if (alive) resize(); });
  const looping = () => alive && (G.phase === 'intro' || G.phase === 'count' || G.phase === 'play' || G.phase === 'end');
  function startLoop() {
    if (raf || !alive) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function frame(now) {
    raf = 0;
    if (!alive) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    if (G.phase === 'play') watch(now - last);
    last = now;
    if (!W) resize();
    update(dt);
    draw(dt);
    if (looping()) raf = requestAnimationFrame(frame);
  }

  function update(dt) {
    G.t += dt;
    const lu = G.lumi;
    lu.squash = Math.max(0, lu.squash - dt * 4);
    lu.hurt = Math.max(0, lu.hurt - dt);
    lu.inv = Math.max(0, lu.inv - dt);
    lu.spin = Math.max(0, lu.spin - dt * 1.4);
    lu.happy = Math.max(0, lu.happy - dt);
    if (G.target) { const a = Math.atan2(G.target.y, G.target.x); lu.look += Math.atan2(Math.sin(a - lu.look), Math.cos(a - lu.look)) * Math.min(1, dt * 8); }

    if (G.phase === 'count') {
      const before = Math.ceil(G.countdown);
      G.countdown -= dt;
      if (Math.ceil(G.countdown) !== before && G.countdown > 0) { hap(app, 'light'); sfx('countdown'); }
      if (G.countdown <= 0) { sfx('go'); G.phase = 'play'; startWave(1); paintHud(); }
    }
    if (G.phase === 'play') {
      G.timeLeft = Math.max(0, G.timeLeft - dt);
      if (G.timeLeft <= 0) endGame('time');
      // хвилі
      if (G.waveBreak > 0) {
        G.waveBreak -= dt;
        if (G.waveBreak <= 0) startWave(G.wave + 1);
      } else if (G.waveLeft > 0) {
        G.spawnT -= dt;
        const aliveN = G.enemies.filter((e) => !e.dead).length;
        if (!aliveN || (aliveN === 1 && G.enemies[0].doomed)) G.spawnT = Math.min(G.spawnT, 0.3); // без пауз «на порожній арені»
        if (G.spawnT <= 0 && aliveN < 2 + G.wave + (hard ? 1 : 0)) { spawn(); G.spawnT = SPAWN_K * Math.max(0.9, 2.9 - G.wave * 0.35); }
      } else if (!G.enemies.some((e) => !e.dead)) {
        G.waveBreak = 1.4;
        floatTxt(0, -LR * 2.6, tr('brawl.wave_done'), '#fff', 20);
      }
    }
    // вороги
    if (G.phase === 'play' || G.phase === 'end') {
      const live = G.enemies.filter((e) => !e.dead);
      for (const e of live) {
        e.age += dt; e.angry = Math.max(0, e.angry - dt);
        if (e.doomed || e.age < 0.45 || G.phase !== 'play') continue;
        const d = Math.hypot(e.x, e.y) || 1;
        const v = e.speed * (e.dash > 0 ? 5.5 : 1) * (0.75 + 0.35 * Math.max(0, Math.sin(G.t * 6 + e.ph))); // «повзе» поштовхами
        e.dash = Math.max(0, e.dash - dt);
        const nx = -e.x / d; const ny = -e.y / d;
        const wig = Math.sin(G.t * 2.2 + e.ph) * 0.35;
        e.x += (nx - ny * wig) * v * dt; e.y += (ny + nx * wig) * v * dt;
        e.trailT -= dt;
        if (e.trailT <= 0) { e.trailT = 0.14; G.slime.push({ x: e.x, y: e.y + e.r * 0.3, r: e.r * rnd(0.3, 0.5), c: e.c0, age: 0 }); }
        if (d < LR + e.r * 0.55) hitLumi(e);
      }
      // розштовхування, щоб не злипались
      for (let i = 0; i < live.length; i++) {
        for (let j = i + 1; j < live.length; j++) {
          const a = live[i]; const b = live[j];
          const dx = b.x - a.x; const dy = b.y - a.y; const d = Math.hypot(dx, dy) || 0.01; const m = (a.r + b.r) * 1.6;
          if (d < m) { const k = ((m - d) / d) * 0.5 * Math.min(1, dt * 10); a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k; }
        }
      }
      G.enemies = G.enemies.filter((e) => !e.dead);
      if (G.phase === 'play') pickTarget();
    }
    // снаряди
    for (const s of G.shots) {
      s.age += dt; s.rot += dt * 14;
      s.v = Math.min(1500, s.v + 2600 * dt);
      const tx = s.target.x; const ty = s.target.y;
      const dx = tx - s.x; const dy = ty - s.y; const d = Math.hypot(dx, dy) || 1;
      const step = s.v * dt;
      s.trail.push([s.x, s.y]); if (s.trail.length > 12) s.trail.shift();
      if (d <= step + s.target.r * 0.5 || s.target.dead) { explode(s.target); s.done = true; hap(app, 'medium'); continue; }
      s.x += (dx / d) * step; s.y += (dy / d) * step;
    }
    G.shots = G.shots.filter((s) => !s.done);
    // нова-кільця супер-атаки
    for (const r of G.rings) {
      r.age += dt;
      r.r = r.r + (r.max - r.r) * Math.min(1, dt * (r.nova ? 5 : 9));
      if (r.nova) for (const e of G.enemies) if (!e.dead && Math.hypot(e.x, e.y) <= r.r) explode(e, { big: true });
    }
    G.rings = G.rings.filter((r) => r.age < r.life);
    for (const p of G.parts) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; const f = Math.exp(-p.drag * dt); p.vx *= f; p.vy *= f; p.rot += dt * 6; }
    G.parts = G.parts.filter((p) => p.age < p.life);
    if (G.parts.length > 500) G.parts.splice(0, G.parts.length - 500);
    for (const t of G.texts) t.age += dt;
    G.texts = G.texts.filter((t) => t.age < t.life);
    for (const s of G.slime) s.age += dt;
    G.slime = G.slime.filter((s) => s.age < 2.2);
    G.shake = Math.max(0, G.shake - dt * 40);
    G.flash = Math.max(0, G.flash - dt * 1.8);

    if (G.phase === 'end') {
      G.endT -= dt;
      if (G.endT <= 0 && !G.parts.length) showResult();
      else if (G.endT < -1.5) showResult();
    }
    if (G.phase === 'play' || G.phase === 'count') paintHud();
  }

  // ------------------------------------------------ малювання
  function drawLumi(t) {
    const lu = G.lumi;
    const bob = Math.sin(t * 3) * 2.5;
    const sq = lu.squash;
    const sx = 1 + sq * 0.16; const sy = 1 - sq * 0.14;
    ctx.save();
    // тінь
    ctx.fillStyle = 'rgba(40,20,60,.25)';
    ctx.beginPath(); ctx.ellipse(0, LR * 0.95, LR * 0.95 - bob * 0.5, LR * 0.28, 0, 0, 7); ctx.fill();
    // німб
    const ga = (wid === 'w5' || wid === 'w3b') ? 0.95 : 0.65;
    ctx.globalAlpha = ga * (0.8 + 0.2 * Math.sin(t * 2));
    const gs = LR * (3.4 + lu.happy * 0.8);
    ctx.drawImage(glow('#ffd68c'), -gs / 2, -gs / 2 - LR * 0.1 + bob, gs, gs);
    ctx.globalAlpha = 1;
    if (lu.inv > 0 && Math.floor(lu.inv * 14) % 2 === 0) ctx.globalAlpha = 0.45;
    ctx.translate(0, bob);
    ctx.rotate(lu.spin * Math.PI * 2 * (1 - lu.spin));
    ctx.scale(sx, sy);
    // ніжки
    ctx.fillStyle = LUMI_C.foot; ctx.strokeStyle = LUMI_C.outline; ctx.lineWidth = 2.5;
    [-1, 1].forEach((k) => { ctx.beginPath(); ctx.ellipse(k * LR * 0.42, LR * 0.82, LR * 0.26, LR * 0.17, 0, 0, 7); ctx.fill(); ctx.stroke(); });
    // тіло
    const bgr = ctx.createRadialGradient(-LR * 0.3, -LR * 0.4, LR * 0.1, 0, 0, LR * 1.1);
    LUMI_C.body.forEach(([o, c]) => bgr.addColorStop(o, c));
    ctx.fillStyle = bgr; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 0, LR, LR * 0.94, 0, 0, 7); ctx.fill(); ctx.stroke();
    if (lu.hurt > 0) { ctx.fillStyle = `rgba(255,60,90,${lu.hurt * 0.45})`; ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,240,.7)'; ctx.beginPath(); ctx.ellipse(-LR * 0.38, -LR * 0.48, LR * 0.22, LR * 0.13, -0.5, 0, 7); ctx.fill();
    // зірочка на маківці
    ctx.strokeStyle = '#ffd678'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -LR * 0.9); ctx.quadraticCurveTo(LR * 0.1, -LR * 1.1, 0, -LR * 1.22); ctx.stroke();
    const sgr = ctx.createRadialGradient(-2, -LR * 1.38, 1, 0, -LR * 1.3, LR * 0.4);
    sgr.addColorStop(0, LUMI_C.starCore); sgr.addColorStop(1, LUMI_C.starEdge);
    ctx.fillStyle = sgr; ctx.strokeStyle = LUMI_C.outline; ctx.lineWidth = 2.2;
    starPath(ctx, 0, -LR * 1.32, LR * 0.36 * (1 + lu.happy * 0.25 + 0.06 * Math.sin(t * 5)), Math.sin(t * 1.5) * 0.2); ctx.fill(); ctx.stroke();
    // очі (дивляться на ціль)
    const lx = Math.cos(lu.look) * LR * 0.08; const ly = Math.sin(lu.look) * LR * 0.07;
    const blink = (t % 3.7) < 0.12;
    [-1, 1].forEach((k) => {
      const ex = k * LR * 0.33 + lx; const ey = -LR * 0.08 + ly;
      if (lu.hurt > 0.2) {
        ctx.strokeStyle = LUMI_C.eye; ctx.lineWidth = 2.6; ctx.beginPath();
        ctx.moveTo(ex - LR * 0.1, ey - LR * 0.08); ctx.lineTo(ex + LR * 0.1, ey + LR * 0.08);
        ctx.moveTo(ex + LR * 0.1, ey - LR * 0.08); ctx.lineTo(ex - LR * 0.1, ey + LR * 0.08); ctx.stroke();
      } else if (blink || lu.happy > 0.3) {
        ctx.strokeStyle = LUMI_C.eye; ctx.lineWidth = 2.8; ctx.beginPath();
        ctx.arc(ex, ey + (blink ? 0 : LR * 0.04), LR * 0.12, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      } else {
        ctx.fillStyle = LUMI_C.eye; ctx.beginPath(); ctx.ellipse(ex, ey, LR * 0.13, LR * 0.17, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex - LR * 0.04, ey - LR * 0.06, LR * 0.055, 0, 7); ctx.fill();
      }
    });
    // щічки і ротик
    ctx.fillStyle = 'rgba(255,128,150,.55)';
    [-1, 1].forEach((k) => { ctx.beginPath(); ctx.ellipse(k * LR * 0.6 + lx, LR * 0.16 + ly, LR * 0.15, LR * 0.09, 0, 0, 7); ctx.fill(); });
    ctx.strokeStyle = LUMI_C.mouth; ctx.lineWidth = 2.4; ctx.beginPath();
    if (lu.hurt > 0.2 || (G.phase === 'end' && G.reason === 'dead')) ctx.arc(lx, LR * 0.36 + ly, LR * 0.12, Math.PI * 1.15, Math.PI * 1.85);
    else if (lu.squash > 0.2 || lu.happy > 0.3) { ctx.fillStyle = LUMI_C.mouth; ctx.ellipse(lx, LR * 0.2 + ly, LR * 0.12, LR * 0.1, 0, 0, Math.PI); ctx.fill(); }
    else ctx.arc(lx, LR * 0.12 + ly, LR * 0.12, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.restore();
  }

  function drawEnemy(e, t) {
    const grow = Math.min(1, e.age / 0.45);
    const s = (grow < 1 ? 1 - (1 - grow) ** 3 * 1 + Math.sin(grow * Math.PI) * 0.25 : 1) * e.r;
    const crawl = Math.sin(t * 6 + e.ph);
    const sx = 1 + crawl * 0.08 + (e.dash > 0 ? 0.22 : 0); const sy = 1 - crawl * 0.08 - (e.dash > 0 ? 0.15 : 0);
    const shiver = e.doomed ? Math.sin(t * 60) * 1.5 : 0;
    ctx.save();
    ctx.translate(e.x + shiver, e.y);
    ctx.fillStyle = 'rgba(30,15,45,.22)';
    ctx.beginPath(); ctx.ellipse(0, s * 0.62, s * 1.05 * sx, s * 0.3, 0, 0, 7); ctx.fill();
    const toL = Math.atan2(-e.y, -e.x);
    ctx.scale(sx, sy);
    // тіло-клякса з хвилястим краєм
    const gr = ctx.createRadialGradient(-s * 0.3, -s * 0.45, s * 0.1, 0, 0, s * 1.2);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.18, e.c0); gr.addColorStop(1, e.c1);
    ctx.fillStyle = gr; ctx.strokeStyle = 'rgba(40,20,60,.85)'; ctx.lineWidth = 2.6;
    ctx.beginPath();
    const N = 14;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const drip = Math.sin(a) > 0.3 ? Math.sin(a * 3 + t * 3 + e.ph) * 0.1 : 0;
      const rr = s * (1 + Math.sin(a * 4 + t * 4 + e.ph) * 0.06 + drip);
      const px = Math.cos(a) * rr; const py = Math.sin(a) * rr * 0.86;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-s * 0.4, -s * 0.42, s * 0.2, s * 0.11, -0.6, 0, 7); ctx.fill();
    // очі
    const px = Math.cos(toL) * s * 0.07; const py = Math.sin(toL) * s * 0.07;
    [-1, 1].forEach((k) => {
      const ex = k * s * 0.32; const ey = -s * 0.18;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(40,20,60,.85)'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.ellipse(ex, ey, s * 0.22, s * (e.doomed ? 0.26 : 0.24), 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2b1d3a'; ctx.beginPath(); ctx.arc(ex + px, ey + py + (e.doomed ? 0 : s * 0.02), s * (e.doomed ? 0.07 : 0.11), 0, 7); ctx.fill();
      // сердиті брови
      ctx.strokeStyle = '#2b1d3a'; ctx.lineWidth = 2.6; ctx.beginPath();
      const up = e.doomed ? -0.12 : e.angry > 0 ? 0.16 : 0.08;
      ctx.moveTo(ex - k * s * 0.22, ey - s * 0.3 - up * s); ctx.lineTo(ex + k * s * 0.12, ey - s * 0.22 + up * s); ctx.stroke();
    });
    // ротик з зубчиком
    ctx.strokeStyle = '#2b1d3a'; ctx.lineWidth = 2.2; ctx.beginPath();
    if (e.doomed) { ctx.ellipse(0, s * 0.3, s * 0.12, s * 0.15, 0, 0, 7); ctx.stroke(); }
    else {
      ctx.moveTo(-s * 0.22, s * 0.28); ctx.quadraticCurveTo(0, s * (e.angry > 0 ? 0.18 : 0.42), s * 0.22, s * 0.28); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(s * 0.06, s * 0.31); ctx.lineTo(s * 0.12, s * 0.42); ctx.lineTo(s * 0.16, s * 0.3); ctx.fill();
    }
    ctx.restore();
  }

  function drawPill(e, t, isTarget) {
    const fsz = isTarget ? 15 : 13;
    ctx.font = `800 ${fsz}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    const maxW = Math.min(170, W * 0.45);
    // measureText — раз на слово/кегль/ширину (кеш на ворогові)
    const pk = `${fsz}|${maxW}`;
    let pc = e._pill?.[pk];
    if (!pc) {
      let txt = e.word[0];
      let tw = ctx.measureText(txt).width;
      if (tw > maxW) { while (txt.length > 3 && ctx.measureText(txt + '…').width > maxW) txt = txt.slice(0, -1); txt += '…'; tw = ctx.measureText(txt).width; }
      pc = (e._pill ||= {})[pk] = { txt, tw };
    }
    const { txt, tw } = pc;
    const w = tw + 16; const h = fsz + 10;
    let x = e.x - w / 2; let y = e.y - e.r * 1.25 - h - (isTarget ? 6 + Math.sin(t * 6) * 2 : 0);
    x = clamp(x, -cx + 4, W - cx - w - 4); y = Math.max(-cy + 4, y);
    const a = Math.min(1, e.age / 0.3);
    ctx.save();
    ctx.globalAlpha = e.doomed ? 0.5 : a;
    ctx.fillStyle = 'rgba(30,15,50,.35)'; rrect(ctx, x, y + 3, w, h, h / 2); ctx.fill();
    ctx.fillStyle = isTarget ? '#ffd84a' : 'rgba(255,255,255,.94)';
    ctx.strokeStyle = isTarget ? '#3d2852' : 'rgba(60,40,80,.5)'; ctx.lineWidth = isTarget ? 2.5 : 1.5;
    rrect(ctx, x, y, w, h, h / 2); ctx.fill(); ctx.stroke();
    if (isTarget) { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); const mx = clamp(e.x, x + 10, x + w - 10); ctx.moveTo(mx - 6, y + h - 1); ctx.lineTo(mx + 6, y + h - 1); ctx.lineTo(mx, y + h + 6); ctx.fill(); }
    ctx.fillStyle = '#2b1d3a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, x + w / 2, y + h / 2 + 1);
    ctx.restore();
  }
  function drawReticle(e, t) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(t * 2);
    const r = e.r * 1.45 + Math.sin(t * 7) * 2;
    ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(0, 0, r, i * Math.PI / 2 + 0.25, i * Math.PI / 2 + 1.1); ctx.stroke(); }
    ctx.restore();
  }

  function draw(dt = 0) {
    if (!W) return;
    const t = G.t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const sh = reduced() ? 0 : G.shake;
    const sx = (Math.random() - 0.5) * sh; const sy = (Math.random() - 0.5) * sh;
    // фон трусимо разом з ареною — зсувом шару (компоновщик), без перемальовування
    if (sh > 0) { bg.style.transform = `translate(${sx.toFixed(2)}px,${sy.toFixed(2)}px)`; bgShake = true; }
    else if (bgShake) { bg.style.transform = ''; bgShake = false; }
    ctx.save();
    ctx.translate(sx, sy);
    ctx.translate(cx, cy);
    // слиз
    for (const s of G.slime) { ctx.globalAlpha = 0.28 * (1 - s.age / 2.2); ctx.fillStyle = s.c; ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r, s.r * 0.6, 0, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    // вороги і Лумі — у порядку глибини
    const actors = G.enemies.filter((e) => !e.dead).map((e) => [e.y, e]);
    actors.push([0, null]);
    actors.sort((a, b) => a[0] - b[0]);
    for (const [, e] of actors) { if (e) drawEnemy(e, t); else drawLumi(t); }
    if (G.target && !G.target.dead && G.phase === 'play') drawReticle(G.target, t);
    // снаряди-трасери
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const s of G.shots) {
      for (let i = 1; i < s.trail.length; i++) {
        const k = i / s.trail.length;
        ctx.strokeStyle = `rgba(255,${200 + 40 * k | 0},120,${k * 0.9})`; ctx.lineWidth = 2 + k * 8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(s.trail[i - 1][0], s.trail[i - 1][1]); ctx.lineTo(s.trail[i][0], s.trail[i][1]); ctx.stroke();
      }
      ctx.drawImage(glow('#ffe48a'), s.x - 26, s.y - 26, 52, 52);
    }
    ctx.restore();
    for (const s of G.shots) {
      ctx.fillStyle = '#fff7c8'; ctx.strokeStyle = '#ffb52e'; ctx.lineWidth = 2;
      starPath(ctx, s.x, s.y, 10, s.rot); ctx.fill(); ctx.stroke();
    }
    // частинки
    for (const p of G.parts) {
      const k = 1 - p.age / p.life;
      ctx.globalAlpha = Math.min(1, k * 1.5);
      ctx.fillStyle = p.color;
      if (p.star) { starPath(ctx, p.x, p.y, p.size * (0.5 + k * 0.6), p.rot); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + k * 0.6), 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    // кільця
    for (const r of G.rings) {
      const k = 1 - r.age / r.life;
      ctx.globalAlpha = k; ctx.strokeStyle = r.color; ctx.lineWidth = r.w * k + 1;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7); ctx.stroke();
      if (r.nova) { ctx.globalAlpha = k * 0.25; ctx.fillStyle = '#fff3b0'; ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    // слова над ворогами
    for (const e of G.enemies) if (!e.dead && e !== G.target) drawPill(e, t, false);
    if (G.target && !G.target.dead) drawPill(G.target, t, G.phase === 'play');
    // тексти
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const tx of G.texts) {
      const k = tx.age / tx.life;
      const sc = k < 0.15 ? 0.6 + (k / 0.15) * 0.6 : 1.2 - Math.min(0.2, (k - 0.15));
      ctx.save();
      ctx.globalAlpha = 1 - Math.max(0, (k - 0.6) / 0.4);
      ctx.translate(tx.x, tx.y - k * 40); ctx.scale(sc, sc);
      ctx.font = `900 ${tx.size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(40,20,60,.85)'; ctx.strokeText(tx.txt, 0, 0);
      ctx.fillStyle = tx.color; ctx.fillText(tx.txt, 0, 0);
      ctx.restore();
    }
    ctx.restore();
    drawAmbient(dt, t);
    if (G.flash > 0) { ctx.globalAlpha = Math.min(0.6, G.flash); ctx.fillStyle = G.flashColor; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    if (G.phase === 'count') {
      const n = Math.ceil(G.countdown - 0.2);
      const f = (G.countdown - 0.2) % 1;
      const txt = n > 0 ? String(n) : tr('brawl.fight');
      const sc = 1 + Math.max(0, f - 0.5) * 1.2;
      ctx.save();
      ctx.translate(cx, cy - LR * 3); ctx.scale(sc, sc);
      ctx.font = '900 64px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 9; ctx.strokeStyle = '#3d2852'; ctx.strokeText(txt, 0, 0);
      ctx.fillStyle = n > 0 ? '#fff' : '#ffd84a'; ctx.fillText(txt, 0, 0);
      ctx.restore();
    }
  }

  // ------------------------------------------------ оверлеї: старт / пауза / результат
  let overlay = null;
  let lumiRef = null;
  function closeOverlay() {
    try { lumiRef?.destroy?.(); } catch (e) { /* */ }
    lumiRef = null;
    overlay?.remove(); overlay = null;
  }
  function showIntro() {
    closeOverlay();
    fresh(); paintHearts(); paintHud(); setOptions();
    const best = gameStars(st, gid);
    overlay = el('div', 'm-overlay g2-ov g2-intro');
    overlay.innerHTML = `
      <div class="m-end-card g2-card">
        <div class="g2-intro-ico">💥</div>
        ${hard ? `<div class="g-hard-tag">${tr('common.hard_tag')}</div>` : ''}
        ${tr('brawl.title')}
        <div class="g2-world">${esc(world.emoji || '')} ${esc(tc(world, 'name') || '')}</div>
        <div class="g2-intro-lumi"></div>
        <ul class="g2-rules">
          <li><span>🫧</span>${tr('brawl.r1')}</li>
          <li><span>🎯</span>${tr('brawl.r2')}</li>
          <li><span>💨</span>${tr('brawl.r3')}</li>
          <li><span>💫</span>${tr('brawl.r4', { 0: SUPER_N })}</li>
          <li><span>⏱</span>${tr('brawl.r5', { 0: TIME })}</li>
          ${hard ? `<li><span>🔥</span>${tr('brawl.r_hard', { 0: NOPT }).replace(/^🔥\s*/, '')}</li>` : ''}
        </ul>
        ${best ? `<div class="g2-best">${tr('brawl.best')} ${'⭐'.repeat(best)}${'☆'.repeat(3 - best)}</div>` : ''}
        <p class="g2-keys">${tr('brawl.keys')}</p>
        <div class="m-end-btns">
          <button class="m-btn m-btn-ghost g2-dark" data-a="back">${tr('common.back')}</button>
          <button class="m-btn m-btn-alt" data-a="go">${tr('brawl.start')}</button>
        </div>
      </div>`;
    scr.append(overlay);
    lumiRef = makeLumi(app, overlay.querySelector('.g2-intro-lumi'), 96, 'excited');
    overlay.querySelector('[data-a=go]').onclick = () => { hap(app, 'medium'); closeOverlay(); startCountdown(); };
    overlay.querySelector('[data-a=back]').onclick = () => { hap(app); app.back(); };
    startLoop();
  }
  function pause() {
    if (G.phase !== 'play' && G.phase !== 'count') return;
    G.prevPhase = G.phase; G.phase = 'pause';
    stopLoop();
    draw();
    hap(app);
    overlay = el('div', 'm-overlay g2-ov g2-pause-ov');
    overlay.innerHTML = `
      <div class="m-end-card g2-card">
        <div class="g2-intro-ico">⏸</div>
        ${tr('common.pause_h')}
        <p class="g2-pause-stats">💥 ${G.kills} · ✅ ${G.correct} · ⏱ ${tr('brawl.sec', { 0: Math.ceil(G.timeLeft) })}</p>
        <div class="g2-col">
          <button class="m-btn m-btn-alt m-btn-big" data-a="resume">${tr('common.resume')}</button>
          <button class="m-btn m-btn-big" data-a="restart">${tr('brawl.restart')}</button>
          <button class="m-btn m-btn-ghost g2-dark m-btn-big" data-a="exit">${tr('common.exit')}</button>
        </div>
      </div>`;
    scr.append(overlay);
    overlay.querySelector('[data-a=resume]').onclick = resume;
    overlay.querySelector('[data-a=restart]').onclick = () => { hap(app); closeOverlay(); fresh(); startCountdown(); };
    overlay.querySelector('[data-a=exit]').onclick = () => { hap(app); app.back(); };
  }
  function resume() {
    if (G.phase !== 'pause') return;
    hap(app);
    closeOverlay();
    G.phase = G.prevPhase || 'play';
    setOptions();
    startLoop();
  }

  function showResult() {
    if (G.phase === 'result') return;
    G.phase = 'result';
    stopLoop();
    const dead = G.reason === 'dead';
    const stars = brawlStars({ correct: G.correct, wrong: G.wrong, leaks: G.leaks, dead });
    const rec = recordGame(st, gid, stars);
    app.save?.(); G.dirty = false;
    const acc = Math.round((G.correct / Math.max(1, G.correct + G.wrong)) * 100);
    const title = stars === 3 ? tr('brawl.t3') : stars === 2 ? tr('brawl.t2') : stars === 1 ? tr('brawl.t1') : tr('brawl.t0');
    const big = stars === 3 ? '🏆' : stars ? '💥' : '🫧';
    const emo = stars === 3 ? 'proud' : stars ? 'happy' : 'sad';
    overlay = el('div', `m-overlay g2-ov g2-result s${stars}`);
    overlay.innerHTML = `
      <div class="m-end-card g2-card">
        <div class="m-end-big">${big}</div>
        <h2>${title}</h2>
        <div class="g2-sub">${dead ? tr('brawl.dead') : tr('brawl.timeup')}</div>
        <div class="g2-stars"></div>
        ${rec.isRecord ? '<div class="m-end-badge">' + tr('brawl.record') + '</div>' : ''}
        <div class="g2-stats">
          <div><b data-c="kills">0</b><small>${tr('brawl.s_kills')}</small></div>
          <div><b data-c="correct">0</b><small>${tr('brawl.s_right')}</small></div>
          <div><b>${acc}%</b><small>${tr('brawl.s_acc')}</small></div>
          <div><b>${G.bestStreak}</b><small>${tr('brawl.s_streak')}</small></div>
        </div>
        <div class="m-end-xp">+<b>0</b> XP</div>
        ${stars < 3 ? `<p class="m-end-tip">${G.correct < VOLUME_GOAL ? `${tr('brawl.tip1', { 0: VOLUME_GOAL })}` : tr('brawl.tip2')}</p>` : ''}
        <div class="m-end-lumi"></div>
        <div class="m-end-btns">
          <button class="m-btn" data-a="again">${tr('common.again')}</button>
          <button class="m-btn m-btn-alt" data-a="next">${tr('common.next')}</button>
        </div>
      </div>`;
    scr.append(overlay);
    hap(app, stars ? 'success' : 'warning');
    sfx(stars ? 'win' : 'lose'); starSfx(stars, 550);
    later(() => fx('starsDrop', overlay.querySelector('.g2-stars'), stars), 350);
    later(() => {
      countUp(overlay.querySelector('[data-c=kills]'), 0, G.kills, 700);
      countUp(overlay.querySelector('[data-c=correct]'), 0, G.correct, 700);
      countUp(overlay.querySelector('.m-end-xp b'), 0, G.correct * 10, 900);
    }, 500);
    if (stars === 3) later(() => fx('confetti'), 900);
    lumiRef = makeLumi(app, overlay.querySelector('.m-end-lumi'), 84, emo);
    later(() => lumiRef?.say?.(stars === 3 ? tr('brawl.l3') : stars ? tr('brawl.l2') : tr('brawl.l1')), 1100);
    overlay.querySelector('[data-a=again]').onclick = () => { hap(app, 'medium'); closeOverlay(); fresh(); startCountdown(); };
    overlay.querySelector('[data-a=next]').onclick = () => { hap(app); app.back(); };
  }

  // ------------------------------------------------ керування
  ansBtns.forEach((b, k) => b.addEventListener('click', () => answer(k)));
  superBtn.addEventListener('click', superAttack);
  $('.g2-pause').addEventListener('click', () => (G.phase === 'pause' ? resume() : pause()));
  $('.m-back').addEventListener('click', () => { hap(app); app.back(); });
  const onKey = (ev) => {
    if (ev.repeat) return;
    const k = ev.key;
    if (G.phase === 'play' && ['1', '2', '3', '4'].slice(0, NOPT).includes(k)) { ev.preventDefault(); answer(+k - 1); }
    else if (G.phase === 'play' && (k === ' ' || k === 'Spacebar')) { ev.preventDefault(); superAttack(); }
    else if (k === 'Escape' || k === 'p' || k === 'P' || k === 'з' || k === 'З') { if (G.phase === 'pause') resume(); else pause(); }
    else if (k === 'Enter' && G.phase === 'intro' && overlay) { ev.preventDefault(); overlay.querySelector('[data-a=go]')?.click(); }
  };
  window.addEventListener('keydown', onKey);
  const onVis = () => { if (document.hidden) pause(); };
  document.addEventListener('visibilitychange', onVis);
  canvasGameOn(true);

  requestAnimationFrame(() => { if (alive) { resize(); showIntro(); } });

  return () => {
    alive = false;
    stopLoop();
    ro?.disconnect();
    clearTimeout(bannerT);
    timers.forEach(clearTimeout);
    window.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVis);
    canvasGameOn(false);
    closeOverlay();
    if (G.dirty) { try { app.save?.(); } catch (e) { /* */ } }
  };
}
