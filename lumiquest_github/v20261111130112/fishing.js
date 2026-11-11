// 🎣 Словесна Риболовля — підводна сцена з паралаксом; рибки пливуть з англійськими словами.
// Показано слово поточною мовою — тапни рибку з правильним перекладом: гачок летить дугою,
// рибку витягують з бризками. Хибна — тікає, −❤️. 12 слів, таймер 60 с, 3 ❤️.
// v6: DPR ≤ 2, фон/шари/рибки/підписи — офскрин-спрайти, частинки й бульбашки — пули, без shadowBlur.
import * as S from './state.js?v=20261111130040';
import * as FX from './fx.js?v=20261111130040';
import { recordGame, starsByRatio, gameStars } from './games.js?v=20261111130040';
import { themeOf } from './theme.js?v=20261111130040';

// ---------------------------------------------------------------- безпечні мости (i18n, звук, Лумі)
let I = {};
try { I = await import('./i18n.js?v=20261111130040'); } catch (e) { /* без ядра i18n — власні словники */ }
let A = {};
import('./audio.js?v=20261111130040').then((m) => { A = m; }).catch(() => { /* без звуку */ });
let LM = null;
try { LM = await import('./lumi.js?v=20261111130040'); } catch (e) { /* фолбек через app.makeLumi */ }

const DICT = {
  uk: {
    'mode.fishing.title': '🎣 Словесна Риболовля',
    'mode.fishing.r1': 'Угорі — слово. Знайди рибку з його <b>англійським перекладом</b> і тапни її!',
    'mode.fishing.r2': 'Гачок полетить — і рибка твоя 🐟',
    'mode.fishing.r3': 'Хибна рибка втече і забере ❤️. У тебе {h} ❤️.',
    'mode.fishing.r4': 'Злови {n} слів за {s} секунд!',
    'mode.fishing.keys': 'P — пауза',
    'mode.fishing.start': '🎣 Закидаємо!',
    'mode.fishing.label': 'Злови переклад',
    'mode.fishing.hi': 'Шукай правильну рибку! 🎣',
    'mode.fishing.wrong': 'Це «{w}» — не те! 🙈',
    'mode.fishing.hurry': 'Швидше, час спливає! ⏳',
    'mode.fishing.win': 'ПЕРЕМОГА!',
    'mode.fishing.lose': 'Рибки втекли…',
    'mode.fishing.time': 'Час вийшов!',
    'mode.fishing.perfect': 'Ідеальний улов! 🌟',
    'mode.fishing.good': 'Гарний улов! 🐟',
    'mode.fishing.out': 'Наступного разу наловимо більше! 💛',
    'mode.fishing.s_fish': 'улов',
    'mode.fishing.s_wrong': 'помилки',
    'mode.fishing.s_time': 'секунд',
    'mode.fishing.caught': 'Улов: {n}/{g}',
    'mode.fishing.learned': 'Спіймані слова:',
    'mode.g4.best': ' · найкраще: ',
    'mode.g4.pause': '⏸ Пауза',
    'mode.g4.resume': '▶ Далі',
    'mode.g4.restart': '🔁 Почати знову',
    'mode.g4.exit': '🚪 Вийти',
    'mode.g4.again': '🔁 Ще раз',
    'mode.g4.next': 'Далі ➜',
    'mode.g4.back': '‹ Назад',
    'mode.g4.record': '🏆 Новий рекорд!',
    'mode.g4.nowords': 'У цьому світі поки замало слів для гри.',
    'mode.g4.praise': ['Супер! 🎉', 'Клас! ✨', 'Так тримати! 💪', 'Чудово! 🌟', 'Вау! 🤩'],
  },
  ru: {
    'mode.fishing.title': '🎣 Словесная Рыбалка',
    'mode.fishing.r1': 'Наверху — слово. Найди рыбку с его <b>английским переводом</b> и тапни её!',
    'mode.fishing.r2': 'Крючок полетит — и рыбка твоя 🐟',
    'mode.fishing.r3': 'Неверная рыбка уплывёт и заберёт ❤️. У тебя {h} ❤️.',
    'mode.fishing.r4': 'Поймай {n} слов за {s} секунд!',
    'mode.fishing.keys': 'P — пауза',
    'mode.fishing.start': '🎣 Забрасываем!',
    'mode.fishing.label': 'Поймай перевод',
    'mode.fishing.hi': 'Ищи правильную рыбку! 🎣',
    'mode.fishing.wrong': 'Это «{w}» — не то! 🙈',
    'mode.fishing.hurry': 'Быстрее, время уходит! ⏳',
    'mode.fishing.win': 'ПОБЕДА!',
    'mode.fishing.lose': 'Рыбки уплыли…',
    'mode.fishing.time': 'Время вышло!',
    'mode.fishing.perfect': 'Идеальный улов! 🌟',
    'mode.fishing.good': 'Хороший улов! 🐟',
    'mode.fishing.out': 'В следующий раз наловим больше! 💛',
    'mode.fishing.s_fish': 'улов',
    'mode.fishing.s_wrong': 'ошибки',
    'mode.fishing.s_time': 'секунд',
    'mode.fishing.caught': 'Улов: {n}/{g}',
    'mode.fishing.learned': 'Пойманные слова:',
    'mode.g4.best': ' · лучшее: ',
    'mode.g4.pause': '⏸ Пауза',
    'mode.g4.resume': '▶ Дальше',
    'mode.g4.restart': '🔁 Начать заново',
    'mode.g4.exit': '🚪 Выйти',
    'mode.g4.again': '🔁 Ещё раз',
    'mode.g4.next': 'Дальше ➜',
    'mode.g4.back': '‹ Назад',
    'mode.g4.record': '🏆 Новый рекорд!',
    'mode.g4.nowords': 'В этом мире пока мало слов для игры.',
    'mode.g4.praise': ['Супер! 🎉', 'Класс! ✨', 'Так держать! 💪', 'Отлично! 🌟', 'Вау! 🤩'],
  },
};
try { I.addStrings?.(DICT); } catch (e) { /* */ }
const lang = () => { try { return I.lang?.() === 'ru' ? 'ru' : 'uk'; } catch (e) { return 'uk'; } };
function T(key, vars) {
  let v = DICT[lang()][key] ?? DICT.uk[key];
  if (v == null) { try { return I.t ? I.t(key, vars) : key; } catch (e) { return key; } }
  if (Array.isArray(v)) v = v[(Math.random() * v.length) | 0];
  return vars ? String(v).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : v;
}
function sfx(n) { try { A.sfx?.(n); } catch (e) { /* */ } }
function speak(text) {
  try { if (A.canSpeak && !A.canSpeak()) return; A.speak?.(String(text), { lang: 'en-US', rate: 0.9 }); } catch (e) { /* */ }
}

export const meta = { topbar: false };
/** Для тестів: стан гри (не впливає на гру). */
export const _debug = { frames: 0, running: false, phase: '', g: null, fish: null };

const GOAL = 12;
const TIME = 60;
const HEARTS = 3;
const XP_PER = 10;
const NFISH = 4;

// ---------------------------------------------------------------- дрібниці
const CSS_HREF = new URL('./games4.css?v=20261111130040', import.meta.url).href;
function ensureCss(root) {
  let l = document.querySelector('link[data-games4-css]');
  if (!l) {
    l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = CSS_HREF; l.dataset.games4Css = '1';
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
const perfLite = () => document.documentElement.dataset.perf === 'lite';
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
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
function fx(name, ...a) { try { const f = FX[name]; if (typeof f === 'function') return f(...a); } catch (e) { /* */ } return undefined; }
function hap(app, kind = 'light') {
  const t = app?.tg;
  if (!t) return;
  try {
    const note = kind === 'success' || kind === 'error' || kind === 'warning';
    if (note && typeof t.notify === 'function') return t.notify(kind);
    if (!note && typeof t.tap === 'function') return t.tap(kind);
    if (typeof t.haptic === 'function') return t.haptic(kind);
  } catch (e) { /* */ }
}
function makeLumi(app, box, size, emotion, bubble = 'top') {
  try { if (LM?.createLumi) return LM.createLumi(box, { size, emotion, bubble }); } catch (e) { console.warn('lumi', e); }
  try { return app?.makeLumi?.(box, { size, emotion, global: false, bubble }) || null; } catch (e) { return null; }
}
const lumiCall = (l, fn, ...a) => { try { return l?.[fn]?.(...a); } catch (e) { return undefined; } };
function hexRgb(h) {
  const s = String(h || '#888888').replace('#', '');
  const n = parseInt(s.length === 3 ? s.replace(/./g, '$&$&') : s.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a, b, k) { const x = hexRgb(a), y = hexRgb(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join(''); }
function rgba(h, a) { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; }
/** v6: поки гра на екрані — глобальне небо (#sky) під непрозорим екраном ховаємо (лічильник екранів). */
function skyOff(on) {
  const h = document.documentElement, n = Math.max(0, (+h.dataset.g4 || 0) + (on ? 1 : -1));
  if (n) h.dataset.g4 = n; else delete h.dataset.g4;
}
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
const FONT = '"Poppins", Lumi, "Segoe UI", system-ui, sans-serif';
const FISH_COLS = ['#ff8a5c', '#ffd14a', '#5cc8ff', '#ff6fa8', '#8be07a', '#b48cff', '#ffb347', '#4fe0c8'];
const SHAPES = 4; // 0 класична, 1 кругла-їжачок, 2 довга смугаста, 3 скалярія

// ---------------------------------------------------------------- екран
export function render(root, params, app) {
  ensureCss(root);
  root.classList.add('g4-host');
  const inTg = !!app?.tg?.isTelegram;
  const st = app.state;
  const wid = params?.wid || 'w1';
  const th = themeOf(wid);
  const world = (app.content?.WORLDS || []).find((w) => w.id === wid);
  const gameId = `${wid}-fishing`;
  let alive = true, dirty = false, overlay = null, lumiRefs = [];

  const scr = el('div', 'g4 g4-fish');
  scr.dataset.world = wid;
  for (const [k, v] of [['--w-bg1', th.bg1], ['--w-accent', th.accent], ['--w-accent2', th.accent2], ['--w-ink', th.ink],
    ['--w-card', th.card], ['--w-btn1', th.btn1], ['--w-btn2', th.btn2], ['--w-r', th.r], ['--w-r-btn', th.rBtn], ['--w-font-display', th.font]]) scr.style.setProperty(k, v);
  root.append(scr);
  skyOff(true);

  let pairs = [];
  try { pairs = I.tw?.(wid) || app.tw?.(wid) || []; } catch (e) { pairs = []; }
  if (!pairs.length) pairs = app.content?.WORDS?.[wid] || [];
  pairs = pairs.filter((p) => Array.isArray(p) && p[0] && p[1]).map(([n, e]) => ({ nat: String(n), en: String(e).trim() }));
  if (pairs.length < NFISH) {
    scr.innerHTML = `<div class="g4-locked"><div>🎣</div><p>${T('mode.g4.nowords')}</p><button class="g4-btn" data-a="back">${T('mode.g4.back')}</button></div>`;
    scr.querySelector('[data-a=back]').onclick = () => app.back();
    skyOff(false);
    return () => { alive = false; };
  }

  scr.innerHTML = `
    <div class="g4-stage" aria-hidden="true">
      <canvas class="g4-cv g4-bgc"></canvas>
      <canvas class="g4-cv g4-fg"></canvas>
    </div>
    <div class="g4-flash"></div>
    <div class="g4-boatlumi"></div>
    <div class="g4-hud">
      <div class="g4-row">
        <button class="g4-ibtn g4-back" aria-label="back"${inTg ? ' hidden' : ''}>‹</button>
        <div class="g4-hearts" aria-label="lives"></div>
        <div class="g4-chip g4-catch">🐟 <b>0</b>/${GOAL}</div>
        <div class="g4-chip g4-timer">⏱ <b>${TIME}</b></div>
        <button class="g4-ibtn g4-pause" aria-label="pause">⏸</button>
      </div>
      <div class="g4-card-q" hidden>
        <div class="g4-qlabel">${T('mode.fishing.label')}</div>
        <div class="g4-qword"></div>
      </div>
    </div>`;
  const $ = (q) => scr.querySelector(q);
  const cv = $('.g4-fg'), stage = $('.g4-stage'), flashEl = $('.g4-flash');
  const ctx = cv.getContext('2d');
  const hud = { hearts: $('.g4-hearts'), catchN: $('.g4-catch b'), catchC: $('.g4-catch'), timer: $('.g4-timer'), timerN: $('.g4-timer b'),
    card: $('.g4-card-q'), word: $('.g4-qword'), lumiBox: $('.g4-boatlumi') };
  $('.g4-back').onclick = () => { hap(app); app.back(); };
  $('.g4-pause').onclick = () => { hap(app); pause(); };
  const boatLumi = makeLumi(app, hud.lumiBox, 64, 'happy', 'right');
  // v6: Лумі-коментатор «оживає» (CSS-анімації) лише коли говорить/реагує, решту часу гри — стоїть (дешевше для кадру)
  let lumiNap = 0;
  const lumiWake = () => {
    const e = boatLumi?.el;
    if (!e) return;
    e.classList.remove('lq-paused');
    clearTimeout(lumiNap);
    lumiNap = setTimeout(() => { if (alive && phase === 'play') e.classList.add('lq-paused'); }, 2600);
  };
  const lumiSay = (txt, emo, react) => {
    if (!boatLumi) return;
    lumiWake();
    if (emo) lumiCall(boatLumi, 'set', emo);
    if (react) lumiCall(boatLumi, 'react', react);
    if (txt) lumiCall(boatLumi, 'say', txt, { ms: 1700 });
  };

  // ------------------------------------------------ розміри, кольори, спрайти
  let W = 390, H = 800, dpr = 1, surf = 200, floor = 700, fishTop = 260, fishBot = 640;
  const water1 = mix('#57c7ea', th.bg3, 0.22), water2 = mix('#1d6fa8', th.bg2, 0.3), water3 = mix('#0a2d55', th.bg1, 0.45);
  const sky1 = mix(th.bg1, '#9fdcff', 0.35), sky2 = mix(th.bg3, '#ffffff', 0.4);
  const sand = mix('#e9d49a', th.accent, 0.18);
  const spr = { key: '', bg: $('.g4-bgc'), far: mkCanvas(1, 1), mid: mkCanvas(1, 1), sand: mkCanvas(1, 1), bandY: 0, sandY: 0, boat: null, bubble: null, dots: [], fish: [] };
  const labels = new Map();
  const PCOL = ['#ffffff', '#bdf1ff', th.accent, '#7fe0ff', '#ffd84a'];

  function layout() {
    const r = scr.getBoundingClientRect();
    W = Math.max(280, r.width); H = Math.max(420, r.height);
    dpr = Math.min(perfLite() ? 1.5 : 2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const cardR = hud.card.hidden ? null : hud.card.getBoundingClientRect();
    surf = Math.round(Math.max(cardR ? cardR.bottom - r.top + 86 : 200, H * 0.2));
    floor = Math.round(H - 58);
    fishTop = surf + 70; fishBot = floor - 46;
    hud.lumiBox.style.top = (surf - 58) + 'px';
    buildSprites();
    if (g) relane();
  }
  function hills(x, w, h, base, amp, seeds, col) {
    x.fillStyle = col;
    x.beginPath(); x.moveTo(0, h);
    for (let i = 0; i <= 64; i++) {
      const px = (i / 64) * w, a = (i / 64) * Math.PI * 2;
      let y = base;
      for (let k = 0; k < seeds.length; k++) y -= Math.sin(a * seeds[k][0] + seeds[k][1]) * amp * seeds[k][2];
      x.lineTo(px, y);
    }
    x.lineTo(w, h); x.closePath(); x.fill();
  }
  function buildSprites() {
    const key = `${W}|${H}|${dpr}|${surf}`;
    if (spr.key === key) return;
    spr.key = key;
    labels.clear();
    // статичний фон: небо, вода, пісок
    const bg = spr.bg;
    bg.width = cv.width; bg.height = cv.height;
    let x = bg.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    let gr = x.createLinearGradient(0, 0, 0, surf);
    gr.addColorStop(0, sky1); gr.addColorStop(1, sky2);
    x.fillStyle = gr; x.fillRect(0, 0, W, surf + 2);
    gr = x.createLinearGradient(0, surf, 0, H);
    gr.addColorStop(0, water1); gr.addColorStop(0.45, water2); gr.addColorStop(1, water3);
    x.fillStyle = gr; x.fillRect(0, surf, W, H - surf);
    // промені світла — статично у фоні (м'які, без анімації filter)
    for (let i = 0; i < 5; i++) {
      const rx = W * (0.08 + i * 0.22), rw = 26 + (i % 3) * 16, rh = (H - surf) * 0.85;
      const rg = x.createLinearGradient(0, surf, 0, surf + rh);
      rg.addColorStop(0, 'rgba(255,255,255,.22)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = rg;
      x.beginPath(); x.moveTo(rx, surf); x.lineTo(rx + rw, surf); x.lineTo(rx + rw * 2.6 + 50, surf + rh); x.lineTo(rx + 40, surf + rh); x.closePath(); x.fill();
    }
    // паралакс: два безшовні шари-смуги (лише там, де є малюнок) — малюються в кадрі двома drawImage
    const top = Math.round(floor - 140);
    spr.bandY = top;
    const band = (c) => {
      c.width = Math.ceil(W * dpr); c.height = Math.ceil((H - top) * dpr);
      const cx = c.getContext('2d'); cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return cx;
    };
    x = band(spr.far);
    hills(x, W, H - top, floor - 60 - top, 34, [[2, 0.3, 1], [5, 1.1, 0.5], [9, 2, 0.2]], rgba(water3, 0.45));
    x = band(spr.mid);
    hills(x, W, H - top, floor - 18 - top, 30, [[3, 2.2, 1], [7, 0.4, 0.45], [13, 1, 0.15]], rgba(mix(water3, th.accent2, 0.2), 0.6));
    for (let i = 0; i < 5; i++) {
      const cx = ((i + 0.5) / 5) * W, cy = floor - 12 - top, col = rgba(i % 2 ? '#ff7a9c' : th.accent2, 0.55);
      x.strokeStyle = col; x.lineCap = 'round'; x.lineWidth = 6;
      x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx, cy - 34); x.moveTo(cx, cy - 16); x.lineTo(cx - 14, cy - 30); x.moveTo(cx, cy - 22); x.lineTo(cx + 12, cy - 40); x.stroke();
    }
    // пісок, камінці, мушлі — окрема смуга поверх паралаксу
    const sTop = Math.round(floor - 24);
    spr.sandY = sTop;
    spr.sand.width = Math.ceil(W * dpr); spr.sand.height = Math.ceil((H - sTop) * dpr);
    x = spr.sand.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, -sTop * dpr);
    x.fillStyle = mix(sand, water3, 0.35);
    x.beginPath(); x.moveTo(0, H);
    for (let i = 0; i <= 32; i++) x.lineTo((i / 32) * W, floor - 6 + Math.sin(i * 0.9) * 6 + Math.sin(i * 0.37) * 8);
    x.lineTo(W, H); x.closePath(); x.fill();
    x.fillStyle = sand;
    x.beginPath(); x.moveTo(0, H);
    for (let i = 0; i <= 32; i++) x.lineTo((i / 32) * W, floor + 8 + Math.sin(i * 1.3 + 1) * 5 + Math.sin(i * 0.5) * 6);
    x.lineTo(W, H); x.closePath(); x.fill();
    for (let i = 0; i < 26; i++) {
      const px = (i * 61.7) % W, py = floor + 18 + ((i * 37) % 40);
      x.fillStyle = i % 3 ? rgba(mix(sand, '#000000', 0.25), 0.6) : rgba('#ffffff', 0.5);
      x.beginPath(); x.ellipse(px, py, 3 + (i % 4), 2 + (i % 3), 0, 0, 7); x.fill();
    }
    // мушлі та морська зірка
    const star = (cx, cy, r, col) => {
      x.fillStyle = col; x.beginPath();
      for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, a = -Math.PI / 2 + (i * Math.PI) / 5; x[i ? 'lineTo' : 'moveTo'](cx + rr * Math.cos(a), cy + rr * Math.sin(a)); }
      x.closePath(); x.fill();
    };
    star(W * 0.72, floor + 26, 11, '#ff8a7a'); star(W * 0.18, floor + 34, 8, th.accent);
    x.fillStyle = '#ffe1d2'; x.beginPath(); x.arc(W * 0.45, floor + 30, 7, Math.PI, 0); x.fill();
    // човен
    const boat = spr.boat || mkCanvas(1, 1);
    boat.width = Math.ceil(110 * dpr); boat.height = Math.ceil(46 * dpr);
    x = boat.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.lineJoin = 'round';
    x.fillStyle = mix('#a8673a', th.accent2, 0.15); x.strokeStyle = '#4a2a18'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(4, 10); x.lineTo(106, 10); x.quadraticCurveTo(98, 42, 70, 42); x.lineTo(34, 42); x.quadraticCurveTo(10, 42, 4, 10); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(10, 14, 90, 4);
    x.fillStyle = th.accent; x.fillRect(12, 24, 86, 5);
    spr.boat = boat;
    // бульбашка
    const b = spr.bubble || mkCanvas(1, 1);
    b.width = b.height = Math.ceil(24 * dpr);
    x = b.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 12 * dpr, 12 * dpr);
    const bgG = x.createRadialGradient(-3, -3, 1, 0, 0, 11);
    bgG.addColorStop(0, 'rgba(255,255,255,.15)'); bgG.addColorStop(0.8, 'rgba(255,255,255,.12)'); bgG.addColorStop(1, 'rgba(255,255,255,.6)');
    x.fillStyle = bgG; x.beginPath(); x.arc(0, 0, 11, 0, 7); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 1.2; x.stroke();
    x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.ellipse(-4, -4, 3, 2, -0.6, 0, 7); x.fill();
    spr.bubble = b;
    spr.dots = PCOL.map((col) => {
      const d = mkCanvas(16 * dpr, 16 * dpr), dx = d.getContext('2d');
      dx.setTransform(dpr, 0, 0, dpr, 8 * dpr, 8 * dpr);
      const dg = dx.createRadialGradient(0, 0, 0, 0, 0, 8);
      dg.addColorStop(0, '#ffffff'); dg.addColorStop(0.4, col); dg.addColorStop(1, rgba(col, 0));
      dx.fillStyle = dg; dx.beginPath(); dx.arc(0, 0, 8, 0, 7); dx.fill();
      return d;
    });
    // тіла рибок: [shape][color], розмір 1 = 64px, дивляться вправо, центр спрайта — центр тіла
    spr.fish = [];
    for (let s = 0; s < SHAPES; s++) {
      spr.fish[s] = FISH_COLS.map((col) => fishSprite(s, col));
    }
  }
  const FS = 64; // базовий розмір рибки (CSS px)
  function fishSprite(shape, col) {
    const w = FS * 1.5, h = FS * 1.3;
    const c = mkCanvas(w * dpr, h * dpr), x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, (w / 2) * dpr, (h / 2) * dpr);
    x.lineJoin = 'round'; x.lineCap = 'round';
    const dark = mix(col, '#2a1640', 0.55), light = mix(col, '#ffffff', 0.5), out = '#2a1a3a';
    const body = (rx, ry) => { x.beginPath(); x.ellipse(0, 0, rx, ry, 0, 0, 7); };
    let rx = 26, ry = 17, eyeX = 13, eyeY = -4;
    if (shape === 1) { rx = 21; ry = 20; eyeX = 9; eyeY = -5; }
    if (shape === 2) { rx = 34; ry = 11; eyeX = 22; eyeY = -2; }
    if (shape === 3) { rx = 20; ry = 22; eyeX = 9; eyeY = -6; }
    // плавці (спинний/черевний)
    x.fillStyle = dark; x.strokeStyle = out; x.lineWidth = 2.2;
    if (shape === 3) {
      x.beginPath(); x.moveTo(-6, -ry + 4); x.quadraticCurveTo(-2, -ry - 22, 12, -ry - 18); x.quadraticCurveTo(6, -ry + 2, 6, -ry + 6); x.closePath(); x.fill(); x.stroke();
      x.beginPath(); x.moveTo(-6, ry - 4); x.quadraticCurveTo(-2, ry + 22, 12, ry + 18); x.quadraticCurveTo(6, ry - 2, 6, ry - 6); x.closePath(); x.fill(); x.stroke();
    } else if (shape === 1) {
      for (let i = 0; i < 9; i++) { const a = -2.6 + i * 0.65; x.beginPath(); x.moveTo(Math.cos(a) * rx * 0.9, Math.sin(a) * ry * 0.9); x.lineTo(Math.cos(a) * (rx + 7), Math.sin(a) * (ry + 7)); x.stroke(); }
    } else {
      x.beginPath(); x.moveTo(-rx * 0.5, -ry + 3); x.quadraticCurveTo(-rx * 0.1, -ry - 13, rx * 0.35, -ry + 2); x.closePath(); x.fill(); x.stroke();
    }
    // тіло
    const bg = x.createLinearGradient(0, -ry, 0, ry);
    bg.addColorStop(0, light); bg.addColorStop(0.5, col); bg.addColorStop(1, dark);
    x.fillStyle = bg; body(rx, ry); x.fill(); x.lineWidth = 2.4; x.strokeStyle = out; x.stroke();
    // смужки / плямки
    x.save(); body(rx - 1, ry - 1); x.clip();
    if (shape === 2) { x.fillStyle = rgba('#ffffff', 0.45); for (let i = -2; i <= 2; i++) x.fillRect(i * 11 - 2, -ry, 5, ry * 2); }
    else if (shape === 3) { x.fillStyle = rgba(dark, 0.55); x.fillRect(-8, -ry, 5, ry * 2); x.fillRect(4, -ry, 4, ry * 2); }
    else if (shape === 1) { x.fillStyle = rgba('#ffffff', 0.4); for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(-12 + (i % 3) * 9, -6 + ((i / 3) | 0) * 11, 2.6, 0, 7); x.fill(); } }
    else { x.fillStyle = rgba('#ffffff', 0.35); x.beginPath(); x.ellipse(-4, 8, rx * 0.7, ry * 0.35, 0, 0, 7); x.fill(); }
    x.restore();
    // зябра, відблиск
    x.strokeStyle = rgba(out, 0.5); x.lineWidth = 1.6;
    x.beginPath(); x.arc(eyeX - 8, 0, ry * 0.55, -1.0, 1.0); x.stroke();
    x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(-rx * 0.25, -ry * 0.55, rx * 0.3, ry * 0.16, -0.2, 0, 7); x.fill();
    // око
    x.fillStyle = '#fff'; x.strokeStyle = out; x.lineWidth = 1.8;
    x.beginPath(); x.arc(eyeX, eyeY, 5.6, 0, 7); x.fill(); x.stroke();
    x.fillStyle = '#1c1233'; x.beginPath(); x.arc(eyeX + 1.4, eyeY + 0.4, 3, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(eyeX + 0.4, eyeY - 1.2, 1.2, 0, 7); x.fill();
    // ротик і щічка
    x.strokeStyle = out; x.lineWidth = 1.6; x.beginPath(); x.arc(rx - 6, 4, 3, 0.2, 1.8); x.stroke();
    x.fillStyle = 'rgba(255,120,150,.5)'; x.beginPath(); x.arc(eyeX - 2, eyeY + 8, 3, 0, 7); x.fill();
    c.meta = { rx, ry };
    return c;
  }
  function labelSprite(word) {
    let c = labels.get(word);
    if (c) return c;
    const m = mkCanvas(4, 4).getContext('2d');
    m.font = `800 15px ${FONT}`;
    const tw = Math.ceil(m.measureText(word).width), w = tw + 20, h = 26;
    c = mkCanvas((w + 4) * dpr, (h + 5) * dpr);
    const x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 2 * dpr, 1 * dpr);
    x.fillStyle = 'rgba(10,30,60,.28)'; rrect(x, 0, 3, w, h, 13); x.fill();
    x.fillStyle = '#ffffff'; rrect(x, 0, 0, w, h, 13); x.fill();
    x.lineWidth = 2; x.strokeStyle = '#2a1a3a'; x.stroke();
    x.fillStyle = '#2a1a3a'; x.font = `800 15px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(word, w / 2, h / 2 + 1);
    labels.set(word, c);
    return c;
  }
  const onFonts = () => { labels.clear(); };
  document.fonts?.addEventListener?.('loadingdone', onFonts);

  // ------------------------------------------------ пули: частинки, бульбашки, кола на воді
  const PN = 200;
  const P = { x: new Float32Array(PN), y: new Float32Array(PN), vx: new Float32Array(PN), vy: new Float32Array(PN),
    life: new Float32Array(PN), max: new Float32Array(PN), sz: new Float32Array(PN), c: new Uint8Array(PN), gr: new Float32Array(PN) };
  let pHead = 0;
  function burst(x, y, n, speed, up, col = -1, grav = 600) {
    n = perfLite() ? n >> 1 : n;
    for (let k = 0; k < n; k++) {
      const i = pHead; pHead = (pHead + 1) % PN;
      const a = up ? -Math.PI / 2 + rnd(-0.9, 0.9) : Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random() * 0.8);
      P.x[i] = x + rnd(-10, 10); P.y[i] = y; P.vx[i] = Math.cos(a) * v; P.vy[i] = Math.sin(a) * v;
      P.max[i] = P.life[i] = 0.5 + Math.random() * 0.5; P.sz[i] = 4 + Math.random() * 7;
      P.c[i] = col >= 0 ? col : (Math.random() * 2) | 0; P.gr[i] = grav;
    }
  }
  const BN = 26;
  const B = { x: new Float32Array(BN), y: new Float32Array(BN), r: new Float32Array(BN), v: new Float32Array(BN), ph: new Float32Array(BN) };
  function resetBubble(i, anyY) {
    B.x[i] = Math.random() * W; B.y[i] = anyY ? rnd(surf + 20, floor) : floor + rnd(0, 30);
    B.r[i] = rnd(3, 9); B.v[i] = rnd(28, 60); B.ph[i] = Math.random() * 6.28;
  }
  function bubbleAt(x, y, n) {
    for (let k = 0; k < n; k++) { const i = (Math.random() * BN) | 0; B.x[i] = x + rnd(-8, 8); B.y[i] = y + rnd(-6, 6); B.r[i] = rnd(2.5, 6); B.v[i] = rnd(50, 90); }
  }
  const RN = 5;
  const R = { x: new Float32Array(RN), t: new Float32Array(RN) };
  let rHead = 0;
  function ripple(x) { R.x[rHead] = x; R.t[rHead] = 1; rHead = (rHead + 1) % RN; }
  // водорості
  const WEEDS = Array.from({ length: 9 }, (_, i) => ({ x: 0, h: 0, ph: Math.random() * 6.28, sp: rnd(0.7, 1.3), w: rnd(5, 9), dark: i % 2 === 0 }));
  function placeWeeds() {
    WEEDS.forEach((wd, i) => { wd.x = ((i + 0.3 + Math.random() * 0.4) / WEEDS.length) * W; wd.h = rnd(70, 150) * (H > 700 ? 1 : 0.8); });
  }
  const weedC1 = mix(th.accent2, '#1a6b3a', 0.35), weedC2 = mix(th.accent2, '#7fe08a', 0.35);

  // ------------------------------------------------ стан
  const FISH = Array.from({ length: NFISH * 3 }, () => ({ on: false, word: '', ok: false, shape: 0, col: 0, x: 0, y: 0, lane: 0, dir: 1, v: 50, size: 1,
    ph: 0, boost: 1, state: 'swim', t: 0, vy: 0, rot: 0, sx: 0, sy: 0 }));
  _debug.fish = FISH;
  const hook = { state: 'idle', x: 0, y: 0, t: 0, fx: 0, fy: 0, fish: null, dur: 0.3 };
  let g = null, phase = 'intro', paused = false;

  function newGame() {
    const targets = shuffle(pairs).slice(0, GOAL);
    while (targets.length < GOAL) targets.push(pairs[(Math.random() * pairs.length) | 0]);
    g = { targets, ri: 0, caught: 0, mistakes: 0, hearts: HEARTS, time: TIME, shownT: TIME, combo: 0, xp: 0,
      shake: 0, clock: 0, roundT: 0, hurried: false, got: [] };
    _debug.g = g;
    for (const f of FISH) f.on = false;
    stage.style.transform = '';
    hook.state = 'idle'; hook.fish = null;
    renderHearts();
    hud.catchN.textContent = 0;
    hud.timerN.textContent = TIME;
    hud.timer.classList.remove('g4-warn');
  }
  const target = () => g.targets[g.ri];
  function relane() {
    for (const f of FISH) if (f.on && f.state === 'swim') f.y = laneY(f.lane);
  }
  const laneY = (k) => fishTop + ((k + 0.5) / NFISH) * (fishBot - fishTop);
  function setupRound(first) {
    const t = target();
    hud.word.textContent = t.nat;
    hud.word.classList.toggle('g4-long', t.nat.length > 18);
    hud.card.hidden = false;
    hud.card.classList.remove('g4-in'); void hud.card.offsetWidth; hud.card.classList.add('g4-in');
    if (first) layout();
    // старі рибки відпливають
    for (const f of FISH) if (f.on && f.state === 'swim') { f.state = 'leave'; }
    const wrong = shuffle(pairs.filter((p) => p.en.toLowerCase() !== t.en.toLowerCase()).map((p) => p.en));
    const opts = shuffle([t.en, ...[...new Set(wrong)].slice(0, NFISH - 1)]);
    const lanes = shuffle([0, 1, 2, 3].slice(0, NFISH));
    const shapes = shuffle([0, 1, 2, 3]);
    const cols = shuffle(FISH_COLS.map((_, i) => i));
    opts.forEach((w, i) => {
      const f = FISH.find((o) => !o.on);
      if (!f) return;
      f.on = true; f.word = w; f.ok = w === t.en; f.shape = shapes[i % SHAPES]; f.col = cols[i % cols.length];
      f.lane = lanes[i]; f.dir = Math.random() < 0.5 ? 1 : -1;
      f.size = rnd(0.88, 1.05);
      f.v = rnd(42, 62) + g.ri * 3.5;
      // розставити по ширині: частина вже на екрані, частина на підході
      const spread = (i + Math.random() * 0.6) / NFISH;
      f.x = f.dir > 0 ? -50 - spread * W * 0.4 + (first ? W * 0.4 : 0) : W + 50 + spread * W * 0.4 - (first ? W * 0.4 : 0);
      f.boost = first ? 1 : 2.6; // нові рибки швидко запливають, потім сповільнюються
      f.y = laneY(f.lane); f.ph = Math.random() * 6.28; f.state = 'swim'; f.t = 0; f.rot = 0; f.vy = 0;
    });
    g.roundT = 0;
  }
  function renderHearts() {
    hud.hearts.innerHTML = Array.from({ length: HEARTS }, (_, i) => `<i class="${i < g.hearts ? '' : 'lost'}">❤️</i>`).join('');
  }

  // ------------------------------------------------ гачок
  const tipX = () => 112, tipY = () => surf - 50;
  function hookIdle(out) {
    out.x = tipX() + 18; out.y = surf + 34 + Math.sin(g ? g.clock * 2 : 0) * 4;
  }
  const tmpP = { x: 0, y: 0 };
  function cast(f) {
    hook.state = 'cast'; hook.t = 0; hook.fish = f; hook.sx = hook.x; hook.sy = hook.y;
    hook.dur = clamp(Math.hypot(f.x - hook.x, f.y - hook.y) / 1100, 0.22, 0.42);
    sfx('whoosh'); hap(app, 'light');
  }
  function onArrive(f) {
    if (f.ok) {
      f.state = 'hooked'; f.t = 0;
      hook.state = 'reel'; hook.t = 0; hook.sx = f.x; hook.sy = f.y;
      g.caught += 1; g.combo += 1; g.xp += XP_PER; g.got.push(f.word);
      try { S.onCorrectAnswer(st); S.addXP(st, XP_PER); } catch (e) { console.warn(e); }
      dirty = true;
      bubbleAt(f.x, f.y, 6);
      burst(f.x, f.y, 14, 160, false, 4, 0);
      sfx(g.combo >= 3 ? 'combo' : 'correct'); hap(app, 'success');
      setTimeout(() => { if (alive) speak(f.word); }, 280);
      hud.catchN.textContent = g.caught;
      hud.catchC.classList.toggle('g4-hot', g.combo >= 3);
      hud.catchC.classList.remove('g4-bump'); void hud.catchC.offsetWidth; hud.catchC.classList.add('g4-bump');
      // коментар — не на кожну рибку (менше шуму й перемальовок)
      if (g.caught === 1 || g.combo % 3 === 0 || g.caught === GOAL) lumiSay(`${T('mode.g4.praise')} ${f.word}`, 'happy', 'jump');
      // інші рибки лякаються й відпливають
      for (const o of FISH) if (o.on && o !== f && o.state === 'swim') o.state = 'leave';
    } else {
      f.state = 'flee'; f.t = 0; f.dir = f.x < W / 2 ? -1 : 1;
      hook.state = 'back'; hook.t = 0; hook.sx = hook.x; hook.sy = hook.y; hook.fish = null;
      g.hearts -= 1; g.mistakes += 1; g.combo = 0;
      try { S.noteMiss(st, wid, target().en); } catch (e) { /* */ }
      dirty = true;
      hud.catchC.classList.remove('g4-hot');
      renderHearts();
      const h = hud.hearts.children[g.hearts];
      if (h) h.classList.add('g4-bump');
      bubbleAt(f.x, f.y, 10);
      g.shake = 0.4;
      flashEl.className = 'g4-flash'; void flashEl.offsetWidth; flashEl.className = 'g4-flash g4-flash-bad';
      sfx('wrong'); hap(app, 'error');
      hud.card.classList.remove('g4-shake'); void hud.card.offsetWidth; hud.card.classList.add('g4-shake');
      lumiSay(T('mode.fishing.wrong', { w: f.word }), 'surprised', 'shake');
      if (g.hearts <= 0) { phase = 'ending'; setTimeout(() => alive && finish('hearts'), 800); }
    }
  }
  function landed(f) {
    // рибка вилітає з води: бризки, кола, стрибок у човен
    f.state = 'jump'; f.t = 0; f.sx = f.x; f.sy = surf;
    burst(f.x, surf, 26, 330, true, -1, 900);
    burst(f.x, surf, 8, 200, true, 4, 600);
    ripple(f.x); ripple(f.x + 12);
    sfx('pop');
    hook.state = 'back'; hook.t = 0; hook.sx = hook.x; hook.sy = hook.y; hook.fish = null;
    if (g.caught >= GOAL) { phase = 'ending'; setTimeout(() => alive && finish('win'), 900); return; }
    g.ri += 1;
    setTimeout(() => { if (alive && phase === 'play') setupRound(false); }, 450);
  }

  // ------------------------------------------------ цикл
  let raf = 0, last = 0, running = false, slowAcc = 0, slowN = 0, slowSkip = 20;
  function start() { if (running || !alive) return; running = true; _debug.running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; _debug.running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const ms = now - last; last = now;
    const dt = Math.min(0.05, ms / 1000);
    _debug.frames += 1;
    if (!perfLite() && ms < 250) {
      if (slowSkip > 0) slowSkip -= 1;
      else { slowAcc += ms; slowN += 1; if (slowAcc > 1500) { if (slowAcc / slowN > 21) { document.documentElement.dataset.perf = 'lite'; spr.key = ''; layout(); } slowAcc = 0; slowN = 0; } }
    }
    update(dt);
    draw();
  }
  let lumiBob = -999;
  function update(dt) {
    g.clock += dt;
    if (phase === 'play') {
      g.time = Math.max(0, g.time - dt);
      const sec = Math.ceil(g.time);
      if (sec !== g.shownT) {
        g.shownT = sec; hud.timerN.textContent = sec;
        if (sec <= 10) { hud.timer.classList.add('g4-warn'); if (sec <= 5 && sec > 0) sfx('tick'); }
        if (sec === 10 && !g.hurried) { g.hurried = true; lumiSay(T('mode.fishing.hurry'), 'surprised'); }
      }
      if (g.time <= 0) { phase = 'ending'; finish('time'); return; }
    }
    if (g.shake > 0) {
      g.shake = Math.max(0, g.shake - dt);
      const k = g.shake / 0.4;
      stage.style.transform = g.shake > 0 ? `translate3d(${(Math.sin(g.clock * 70) * 7 * k).toFixed(1)}px,${(Math.cos(g.clock * 55) * 4 * k).toFixed(1)}px,0)` : '';
    }
    // рибки
    for (let i = 0; i < FISH.length; i++) {
      const f = FISH[i];
      if (!f.on) continue;
      f.ph += dt * (f.state === 'flee' || f.state === 'leave' ? 16 : 6);
      f.t += dt;
      if (f.state === 'swim' || f.state === 'leave' || f.state === 'flee') {
        if (f.boost > 1) f.boost = Math.max(1, f.boost - dt * 1.6);
        const sp = f.state === 'flee' ? 520 : f.state === 'leave' ? Math.max(f.v * 3, 170) : f.v * f.boost;
        f.x += f.dir * sp * dt;
        f.y += (laneY(f.lane) + Math.sin(f.ph * 0.25 + i) * 10 - f.y) * Math.min(1, dt * 3);
        if (f.state === 'flee') f.y -= dt * 30;
        const off = f.dir > 0 ? f.x > W + 70 : f.x < -70;
        if (off) {
          if (f.state === 'swim') { f.dir = -f.dir; f.lane = (f.lane + 1 + ((Math.random() * (NFISH - 1)) | 0)) % NFISH; }
          else f.on = false;
        }
      } else if (f.state === 'hooked') {
        // висить на гачку, тріпочеться
        f.x = hook.x; f.y = hook.y + 20 * f.size;
      } else if (f.state === 'jump') {
        const k = Math.min(1, f.t / 0.7), bx = 64, by = surf - 18;
        f.x = f.sx + (bx - f.sx) * k; f.y = f.sy + (by - f.sy) * k - Math.sin(k * Math.PI) * 90;
        f.rot = k * Math.PI * 2 * -Math.sign(f.sx - bx || 1);
        if (k >= 1) { f.on = false; burst(bx, by, 10, 150, true, 2, 500); sfx('star'); }
      }
    }
    // гачок
    if (hook.state === 'idle') { hookIdle(tmpP); hook.x += (tmpP.x - hook.x) * Math.min(1, dt * 8); hook.y += (tmpP.y - hook.y) * Math.min(1, dt * 8); }
    else if (hook.state === 'cast') {
      hook.t += dt / hook.dur;
      const f = hook.fish, k = Math.min(1, hook.t);
      const cx = (hook.sx + f.x) / 2, cy = Math.min(hook.sy, f.y) - 90;
      const u = 1 - k;
      hook.x = u * u * hook.sx + 2 * u * k * cx + k * k * f.x;
      hook.y = u * u * hook.sy + 2 * u * k * cy + k * k * f.y;
      if (k >= 1) onArrive(f);
    } else if (hook.state === 'reel') {
      hook.t += dt / 0.6;
      const k = Math.min(1, hook.t), e = k * k;
      hook.x = hook.sx + (tipX() + 30 - hook.sx) * e; hook.y = hook.sy + (surf - 6 - hook.sy) * e;
      if (k >= 1 && hook.fish) { const f = hook.fish; hook.fish = null; landed(f); }
    } else if (hook.state === 'back') {
      hook.t += dt / 0.3;
      hookIdle(tmpP);
      const k = Math.min(1, hook.t);
      hook.x = hook.sx + (tmpP.x - hook.sx) * k; hook.y = hook.sy + (tmpP.y - hook.sy) * k;
      if (k >= 1) hook.state = 'idle';
    }
    // частинки
    for (let i = 0; i < PN; i++) {
      if (P.life[i] <= 0) continue;
      P.life[i] -= dt; P.vy[i] += P.gr[i] * dt; P.vx[i] *= 0.99;
      P.x[i] += P.vx[i] * dt; P.y[i] += P.vy[i] * dt;
    }
    const bn = perfLite() ? BN >> 1 : BN;
    for (let i = 0; i < bn; i++) {
      B.y[i] -= B.v[i] * dt; B.ph[i] += dt * 3;
      if (B.y[i] < surf + 4) resetBubble(i, false);
    }
    for (let i = 0; i < RN; i++) if (R.t[i] > 0) R.t[i] = Math.max(0, R.t[i] - dt * 1.2);
    // Лумі гойдається в човні разом із хвилею (лише transform)
    const lb = Math.round(Math.sin(g.clock * 1.6) * 3 * 2) / 2;
    if (lb !== lumiBob) { lumiBob = lb; hud.lumiBox.style.transform = `translate3d(0,${lb}px,0)`; }
  }
  const waveY = (x, t) => surf + Math.sin(x * 0.035 + t * 1.6) * 3 + Math.sin(x * 0.09 - t * 2.3) * 1.6;
  function draw() {
    const t = g.clock;
    const shx = 0, shy = 0; // тряска — transform усієї сцени (stage)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    const ow = spr.far.width, by = Math.round(spr.bandY * dpr);
    const o1 = Math.round((t * 8 * dpr) % ow), o2 = Math.round((t * 20 * dpr) % ow);
    ctx.drawImage(spr.far, -o1, by); ctx.drawImage(spr.far, ow - o1, by);
    ctx.drawImage(spr.mid, -o2, by); ctx.drawImage(spr.mid, ow - o2, by);
    ctx.drawImage(spr.sand, 0, Math.round(spr.sandY * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // бульбашки
    const bn = perfLite() ? BN >> 1 : BN;
    for (let i = 0; i < bn; i++) {
      const r = B.r[i], x = B.x[i] + Math.sin(B.ph[i]) * 4;
      ctx.drawImage(spr.bubble, x - r, B.y[i] - r, r * 2, r * 2);
    }
    // водорості позаду (темні)
    ctx.lineCap = 'round';
    drawWeeds(true, t);
    // рибки
    for (let i = 0; i < FISH.length; i++) if (FISH[i].on) drawFish(FISH[i], shx, shy);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWeeds(false, t);
    // поверхня води: світла смуга з хвилею
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath(); ctx.moveTo(0, surf + 16);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, waveY(x, t));
    ctx.lineTo(W, surf + 16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, waveY(0, t));
    for (let x = 16; x <= W; x += 16) ctx.lineTo(x, waveY(x, t));
    ctx.stroke();
    // кола на воді
    ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff';
    for (let i = 0; i < RN; i++) {
      if (R.t[i] <= 0) continue;
      const k = 1 - R.t[i];
      ctx.globalAlpha = R.t[i] * 0.8;
      ctx.beginPath(); ctx.ellipse(R.x[i], surf + 2, 8 + k * 46, 2 + k * 8, 0, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // човен (гойдається)
    const bob = Math.sin(t * 1.6) * 3;
    ctx.drawImage(spr.boat, 6, surf - 30 + bob, 110, 46);
    // вудка і волосінь дугою
    const tx = tipX(), ty = tipY() + bob;
    ctx.strokeStyle = '#5a3420'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(52, surf - 18 + bob); ctx.quadraticCurveTo(84, ty + 12, tx, ty); ctx.stroke();
    ctx.fillStyle = th.accent; ctx.beginPath(); ctx.arc(tx, ty, 3.5, 0, 7); ctx.fill();
    const hx = hook.x, hy = hook.y;
    const sag = hook.state === 'reel' ? 6 : hook.state === 'cast' ? 18 : 34;
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo((tx + hx) / 2 + 8, Math.max(ty, hy) + sag - Math.abs(hx - tx) * 0.1, hx, hy - 8); ctx.stroke();
    // поплавок на волосіні, коли гачок чекає
    if (hook.state === 'idle') {
      const fxp = tx + (hx - tx) * 0.55, fyp = waveY(fxp, t) - 3;
      ctx.fillStyle = '#ff4d5a'; ctx.beginPath(); ctx.arc(fxp, fyp, 5, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(fxp, fyp, 5, 0, Math.PI); ctx.fill();
    }
    // гачок
    ctx.strokeStyle = '#d9e2ee'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(hx, hy - 9); ctx.lineTo(hx, hy + 2); ctx.arc(hx - 5, hy + 2, 5, 0, Math.PI * 0.95); ctx.stroke();
    ctx.strokeStyle = '#7d8798'; ctx.lineWidth = 1; ctx.stroke();
    // частинки
    for (let i = 0; i < PN; i++) {
      if (P.life[i] <= 0) continue;
      const k = P.life[i] / P.max[i], s = P.sz[i] * (0.4 + 0.6 * k);
      ctx.globalAlpha = k;
      ctx.drawImage(spr.dots[P.c[i]], P.x[i] - s, P.y[i] - s, s * 2, s * 2);
    }
    ctx.globalAlpha = 1;
  }
  function drawWeeds(back, t) {
    for (let i = 0; i < WEEDS.length; i++) {
      const wd = WEEDS[i];
      if (wd.dark !== back) continue;
      const sway = Math.sin(t * wd.sp + wd.ph) * 16, sway2 = Math.sin(t * wd.sp * 1.3 + wd.ph + 1) * 10;
      const bx = wd.x, by = floor + 14, h = wd.h;
      ctx.strokeStyle = back ? weedC1 : weedC2; ctx.lineWidth = wd.w;
      ctx.beginPath(); ctx.moveTo(bx, by);
      ctx.bezierCurveTo(bx + sway2 * 0.5, by - h * 0.35, bx - sway * 0.6 + sway2, by - h * 0.7, bx + sway, by - h);
      ctx.stroke();
      ctx.lineWidth = wd.w * 0.6;
      ctx.beginPath(); ctx.moveTo(bx + 4, by);
      ctx.bezierCurveTo(bx + 10 + sway2 * 0.4, by - h * 0.3, bx + 2 - sway * 0.4, by - h * 0.5, bx + 6 + sway * 0.7, by - h * 0.62);
      ctx.stroke();
    }
  }
  function drawFish(f, shx, shy) {
    const s = f.size;
    const body = spr.fish[f.shape][f.col];
    const bw = body.width / dpr, bh = body.height / dpr;
    const wob = f.state === 'hooked' ? Math.sin(f.t * 30) * 0.5 : Math.sin(f.ph) * 0.06;
    const rot = f.state === 'hooked' ? -f.dir * 1.2 + wob : f.state === 'jump' ? f.rot : wob;
    const c = Math.cos(rot) * s, sn = Math.sin(rot) * s;
    const dx = f.dir;
    ctx.setTransform(dpr * c * dx, dpr * sn * dx, -dpr * sn, dpr * c, (f.x + shx) * dpr, (f.y + shy) * dpr);
    // хвіст із помахом
    const rx = body.meta.rx;
    const wag = Math.sin(f.ph * 1.4) * (f.state === 'swim' ? 5 : 9);
    ctx.fillStyle = mix(FISH_COLS[f.col], '#2a1640', 0.35); ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-rx + 4, 0); ctx.lineTo(-rx - 16, -13 + wag); ctx.quadraticCurveTo(-rx - 10, wag * 0.5, -rx - 16, 13 + wag); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.drawImage(body, -bw / 2, -bh / 2, bw, bh);
    // підпис — не перевертається
    if (f.state === 'swim' || f.state === 'leave' || f.state === 'flee' || f.state === 'hooked') {
      const lab = labelSprite(f.word);
      const lw = lab.width / dpr, lh = lab.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, (f.x + shx) * dpr, (f.y + shy) * dpr);
      if (f.state !== 'swim') ctx.globalAlpha = f.state === 'hooked' ? 1 : 0.6;
      ctx.drawImage(lab, -lw / 2, 22 * s, lw, lh);
      ctx.globalAlpha = 1;
    }
  }

  // ------------------------------------------------ керування
  function fishAt(x, y) {
    let best = null, bd = 1e9;
    for (const f of FISH) {
      if (!f.on || f.state !== 'swim') continue;
      if (f.x < -10 || f.x > W + 10) continue;
      const dx = Math.abs(x - f.x), dy = y - f.y;
      if (dx > 52 * f.size + 8 || dy < -34 || dy > 54) continue;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = f; }
    }
    return best;
  }
  function onDown(e) {
    if (paused || phase !== 'play' || hook.state !== 'idle') return;
    if (e.target.closest('button, .g4-over, .g4-boatlumi, .g4-card-q')) return;
    const r = cv.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const f = fishAt(x, y);
    if (f) cast(f);
    else if (y > surf) { bubbleAt(x, y, 3); }
  }
  function onKey(e) {
    if (!alive || e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && phase === 'play' && !overlay) { e.preventDefault(); pause(); }
  }
  function onVis() { if (document.hidden && phase === 'play' && !overlay && alive) pause(); }
  scr.addEventListener('pointerdown', onDown);
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVis);

  // ------------------------------------------------ оверлеї
  function closeOverlay() {
    if (!overlay) return;
    const o = overlay; overlay = null;
    lumiRefs.forEach((l) => lumiCall(l, 'destroy'));
    lumiRefs = [];
    o.classList.add('g4-out');
    setTimeout(() => o.remove(), 220);
  }
  function intro() {
    phase = 'intro'; _debug.phase = 'intro';
    const best = gameStars(st, gameId);
    overlay = el('div', 'g4-over');
    overlay.innerHTML = `<div class="g4-box">
      <div class="g4-ico">🎣</div>
      <h2>${T('mode.fishing.title')}</h2>
      <div class="g4-sub">${esc(world?.emoji || '')} ${esc((I.tc ? I.tc(world, 'name') : world?.name) || '')}${best ? T('mode.g4.best') + '⭐'.repeat(best) : ''}</div>
      <div class="g4-ilumi"></div>
      <ul class="g4-rules">
        <li>${T('mode.fishing.r1')}</li><li>${T('mode.fishing.r2')}</li>
        <li>${T('mode.fishing.r3', { h: HEARTS })}</li><li>${T('mode.fishing.r4', { n: GOAL, s: TIME })}</li>
      </ul>
      <div class="g4-keys">${T('mode.fishing.keys')}</div>
      <div class="g4-btns">
        <button class="g4-btn g4-go" data-a="go">${T('mode.fishing.start')}</button>
        ${inTg ? '' : `<button class="g4-btn g4-ghost" data-a="back">${T('mode.g4.back')}</button>`}
      </div>
    </div>`;
    scr.append(overlay);
    lumiRefs.push(makeLumi(app, overlay.querySelector('.g4-ilumi'), 96, 'excited'));
    const bk = overlay.querySelector('[data-a=back]');
    if (bk) bk.onclick = () => { hap(app); app.back(); };
    overlay.querySelector('[data-a=go]').onclick = () => { hap(app, 'medium'); closeOverlay(); begin(); };
  }
  function begin() {
    newGame();
    phase = 'play'; _debug.phase = 'play'; paused = false;
    setupRound(true);
    lumiSay(T('mode.fishing.hi'), 'happy', 'nod');
    sfx('whoosh');
    start();
  }
  function pause() {
    if (paused || overlay || phase !== 'play' || !alive) return;
    paused = true; stop(); _debug.phase = 'paused';
    overlay = el('div', 'g4-over');
    overlay.innerHTML = `<div class="g4-box g4-box-sm">
      <h2>${T('mode.g4.pause')}</h2>
      <div class="g4-sub">${T('mode.fishing.caught', { n: g?.caught || 0, g: GOAL })} · ❤️ ${g?.hearts ?? HEARTS} · ⏱ ${Math.ceil(g?.time ?? TIME)}</div>
      <div class="g4-btns">
        <button class="g4-btn g4-go" data-a="resume">${T('mode.g4.resume')}</button>
        <button class="g4-btn" data-a="restart">${T('mode.g4.restart')}</button>
        <button class="g4-btn g4-ghost" data-a="exit">${T('mode.g4.exit')}</button>
      </div></div>`;
    scr.append(overlay);
    const on = (a, fn) => { overlay.querySelector(`[data-a=${a}]`).onclick = () => { hap(app); fn(); }; };
    on('resume', () => { closeOverlay(); paused = false; _debug.phase = 'play'; start(); });
    on('restart', () => { closeOverlay(); paused = false; begin(); });
    on('exit', () => app.back());
  }
  function finish(why) {
    if (!alive || overlay || phase === 'over') return;
    phase = 'over'; _debug.phase = 'result';
    const acc = g.caught / Math.max(1, g.caught + g.mistakes);
    const stars = why === 'hearts' ? 0 : starsByRatio((g.caught / GOAL) * acc);
    const win = stars > 0;
    const rec = recordGame(st, gameId, stars);
    try { app.save?.(); } catch (e) { /* */ }
    dirty = false;
    _debug.stars = stars;
    hap(app, win ? 'success' : 'error');
    const learned = [...new Set(g.got)].map((w) => `<i>${esc(w)}</i>`).join('');
    const used = Math.round(TIME - g.time);
    overlay = el('div', `g4-over ${win ? 'g4-win' : 'g4-lose'}`);
    overlay.innerHTML = `<div class="g4-box">
      <div class="g4-banner">${win ? T('mode.fishing.win') : why === 'time' ? T('mode.fishing.time') : T('mode.fishing.lose')}</div>
      <div class="g4-stars"></div>
      <p class="g4-sub">${win ? (stars === 3 ? T('mode.fishing.perfect') : T('mode.fishing.good')) : T('mode.fishing.out')}</p>
      ${rec.isRecord ? `<div class="g4-record">${T('mode.g4.record')}</div>` : ''}
      <div class="g4-stats">
        <div><span>${T('mode.fishing.s_fish')}</span><strong><b data-n="${g.caught}">0</b><em>/${GOAL}</em></strong></div>
        <div><span>${T('mode.fishing.s_wrong')}</span><strong><b data-n="${g.mistakes}">0</b></strong></div>
        <div><span>${T('mode.fishing.s_time')}</span><strong><b data-n="${used}">0</b></strong></div>
      </div>
      ${learned ? `<div class="g4-learned">${T('mode.fishing.learned')} ${learned}</div>` : ''}
      <div class="g4-res"><div class="g4-rlumi"></div><div class="g4-xp">+<b data-n="${g.xp}">0</b> XP</div></div>
      <div class="g4-btns g4-two">
        <button class="g4-btn" data-a="again">${T('mode.g4.again')}</button>
        <button class="g4-btn g4-go" data-a="next">${T('mode.g4.next')}</button>
      </div></div>`;
    scr.append(overlay);
    const ov = overlay;
    fx('starsDrop', ov.querySelector('.g4-stars'), stars);
    sfx(win ? 'win' : 'lose');
    for (let i = 0; i < stars; i++) setTimeout(() => alive && sfx('star'), 450 + i * 320);
    ov.querySelectorAll('[data-n]').forEach((b, k) => setTimeout(() => alive && fx('countUp', b, 0, +b.dataset.n, 700), 500 + k * 120));
    if (stars === 3) setTimeout(() => alive && fx('confetti'), 700);
    const lr = makeLumi(app, ov.querySelector('.g4-rlumi'), 72, win ? 'proud' : 'sad');
    lumiRefs.push(lr);
    setTimeout(() => alive && lumiCall(lr, 'react', win ? 'jump' : 'nod'), 1300);
    setTimeout(() => { if (alive && phase === 'over') stop(); }, 1200);
    const on = (a, fn) => { ov.querySelector(`[data-a=${a}]`).onclick = () => { hap(app); fn(); }; };
    on('again', () => { closeOverlay(); begin(); });
    on('next', () => app.back());
  }

  // ------------------------------------------------ старт
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { const k = spr.key; layout(); if (k !== spr.key) placeWeeds(); if (!running && g) draw(); }) : null;
  newGame();
  layout();
  placeWeeds();
  for (let i = 0; i < BN; i++) resetBubble(i, true);
  hookIdle(hook);
  ro?.observe(scr);
  intro();
  start(); // сцена живе під стартовим екраном; таймер іде лише в грі
  // під стартовим екраном достатньо кількох секунд «живої» сцени — далі заморожуємо (економія батареї)
  const idleStop = setTimeout(() => { if (alive && phase === 'intro') { stop(); } }, 4000);

  return () => {
    alive = false;
    stop();
    skyOff(false);
    clearTimeout(idleStop);
    if (dirty) { dirty = false; try { app.save?.(); } catch (e) { /* */ } }
    ro?.disconnect();
    scr.removeEventListener('pointerdown', onDown);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVis);
    document.fonts?.removeEventListener?.('loadingdone', onFonts);
    clearTimeout(lumiNap);
    lumiRefs.forEach((l) => lumiCall(l, 'destroy'));
    lumiCall(boatLumi, 'destroy');
    lumiRefs = [];
  };
}
