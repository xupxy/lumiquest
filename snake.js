// 🐍 Змійка-Слово — canvas-змійка на полі. Показано переклад, треба з'їсти літери англійського
// слова ПО ПОРЯДКУ (на полі є й зайві літери). Свайп/стрілки, швидкість росте зі словом.
// 5 слів, 3 ❤️ (зіткнення зі стіною/собою або неправильна літера). З'їдене слово озвучується.
// v6: DPR ≤ 2, фон і плитки — офскрин-спрайти, частинки — пул на типізованих масивах, без shadowBlur.
import * as S from './state.js?v=20261111000115';
import * as FX from './fx.js?v=20261111000115';
import { recordGame, starsByRatio, gameStars } from './games.js?v=20261111000115';
import { themeOf } from './theme.js?v=20261111000115';

// ---------------------------------------------------------------- безпечні мости (i18n, звук, Лумі)
let I = {};
try { I = await import('./i18n.js?v=20261111000115'); } catch (e) { /* без ядра i18n — власні словники */ }
let A = {};
import('./audio.js?v=20261111000115').then((m) => { A = m; }).catch(() => { /* без звуку */ });
let LM = null;
try { LM = await import('./lumi.js?v=20261111000115'); } catch (e) { /* фолбек через app.makeLumi */ }

const DICT = {
  uk: {
    'mode.snake.title': '🐍 Змійка-Слово',
    'mode.snake.r1': 'Угорі — слово. Збери його англійською: їж літери <b>по порядку</b>.',
    'mode.snake.r2': 'Керуй свайпом або тапом у потрібний бік (чи стрілками). Крізь стіни можна проходити!',
    'mode.snake.r3': 'Зайва літера — мінус ❤️. У тебе {h} ❤️ і {n} слів.',
    'mode.snake.r4': 'Кожне слово — швидше! 🚀',
    'mode.snake.keys': 'Клавіші: ← ↑ → ↓ / WASD, P — пауза',
    'mode.snake.start': '▶ Повзімо!',
    'mode.snake.label': 'Збери англійською',
    'mode.snake.tip': '👆 Свайпни або тапни збоку, щоб повернути',
    'mode.snake.hi': 'Їж літери по порядку! 🐍',
    'mode.snake.wrong': 'Не та літера! Потрібна «{c}»',
    'mode.snake.wall': 'Ой, стіна! 🙈',
    'mode.snake.self': 'Не кусай себе за хвіст! 😅',
    'mode.snake.word': 'Слово {i}/{n}',
    'mode.snake.win': 'ПЕРЕМОГА!',
    'mode.snake.lose': 'Змійка втомилась…',
    'mode.snake.perfect': 'Ідеально! Жодної помилки 🌟',
    'mode.snake.good': 'Усі слова зібрано! 🐍',
    'mode.snake.out': 'Наступного разу вийде — спробуй ще! 💛',
    'mode.snake.s_words': 'слова',
    'mode.snake.s_letters': 'літери',
    'mode.snake.s_wrong': 'помилки',
    'mode.snake.learned': 'Слова гри:',
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
    'mode.snake.title': '🐍 Змейка-Слово',
    'mode.snake.r1': 'Наверху — слово. Собери его по-английски: ешь буквы <b>по порядку</b>.',
    'mode.snake.r2': 'Управляй свайпом или тапом в нужную сторону (или стрелками). Сквозь стены можно проходить!',
    'mode.snake.r3': 'Лишняя буква — минус ❤️. У тебя {h} ❤️ и {n} слов.',
    'mode.snake.r4': 'С каждым словом — быстрее! 🚀',
    'mode.snake.keys': 'Клавиши: ← ↑ → ↓ / WASD, P — пауза',
    'mode.snake.start': '▶ Ползём!',
    'mode.snake.label': 'Собери по-английски',
    'mode.snake.tip': '👆 Свайпни или тапни сбоку, чтобы повернуть',
    'mode.snake.hi': 'Ешь буквы по порядку! 🐍',
    'mode.snake.wrong': 'Не та буква! Нужна «{c}»',
    'mode.snake.wall': 'Ой, стена! 🙈',
    'mode.snake.self': 'Не кусай себя за хвост! 😅',
    'mode.snake.word': 'Слово {i}/{n}',
    'mode.snake.win': 'ПОБЕДА!',
    'mode.snake.lose': 'Змейка устала…',
    'mode.snake.perfect': 'Идеально! Ни одной ошибки 🌟',
    'mode.snake.good': 'Все слова собраны! 🐍',
    'mode.snake.out': 'В следующий раз получится — попробуй ещё! 💛',
    'mode.snake.s_words': 'слова',
    'mode.snake.s_letters': 'буквы',
    'mode.snake.s_wrong': 'ошибки',
    'mode.snake.learned': 'Слова игры:',
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
export const _debug = { frames: 0, running: false, phase: '', g: null };

const WORDS_N = 5;
const HEARTS = 3;
const XP_PER = 10;
const COLS = 11;
const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
const MAXN = 256;

// ---------------------------------------------------------------- дрібниці
const CSS_HREF = new URL('./games4.css?v=20261111000115', import.meta.url).href;
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
const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
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
const lumiCall = (l, fn, ...a) => { try { return l?.[fn]?.(...a); } catch (e) { return undefined; } };

function pickWords(pairs) {
  const ok = pairs.filter((p) => Array.isArray(p) && p[0] && /^[a-z]{3,6}$/i.test(String(p[1]).trim()));
  const pool = ok.length >= WORDS_N ? ok : pairs.filter((p) => Array.isArray(p) && p[0] && /^[a-z]{2,8}$/i.test(String(p[1]).trim()));
  return shuffle(pool).slice(0, WORDS_N).sort((a, b) => a[1].length - b[1].length)
    .map(([nat, en]) => ({ nat: String(nat), en: String(en).trim().toUpperCase() }));
}

// ---------------------------------------------------------------- екран
export function render(root, params, app) {
  ensureCss(root);
  root.classList.add('g4-host');
  const inTg = !!app?.tg?.isTelegram;
  const st = app.state;
  const wid = params?.wid || 'w1';
  const th = themeOf(wid);
  const world = (app.content?.WORLDS || []).find((w) => w.id === wid);
  const gameId = `${wid}-snake`;
  let alive = true, dirty = false, overlay = null, lumiRefs = [];

  const scr = el('div', 'g4 g4-snake');
  scr.dataset.world = wid;
  for (const [k, v] of [['--w-bg1', th.bg1], ['--w-accent', th.accent], ['--w-accent2', th.accent2], ['--w-ink', th.ink],
    ['--w-card', th.card], ['--w-btn1', th.btn1], ['--w-btn2', th.btn2], ['--w-r', th.r], ['--w-r-btn', th.rBtn], ['--w-font-display', th.font]]) scr.style.setProperty(k, v);
  root.append(scr);
  skyOff(true);

  let pairs = [];
  try { pairs = I.tw?.(wid) || app.tw?.(wid) || []; } catch (e) { pairs = []; }
  if (!pairs.length) pairs = app.content?.WORDS?.[wid] || [];
  if (pickWords(pairs).length < 3) {
    scr.innerHTML = `<div class="g4-locked"><div>🐍</div><p>${T('mode.g4.nowords')}</p><button class="g4-btn" data-a="back">${T('mode.g4.back')}</button></div>`;
    scr.querySelector('[data-a=back]').onclick = () => app.back();
    skyOff(false);
    return () => { alive = false; };
  }

  scr.innerHTML = `
    <div class="g4-stage" aria-hidden="true"><canvas class="g4-cv g4-bgc"></canvas><canvas class="g4-cv g4-fg"></canvas></div>
    <div class="g4-flash"></div>
    <div class="g4-hud">
      <div class="g4-row">
        <button class="g4-ibtn g4-back" aria-label="back"${inTg ? ' hidden' : ''}>‹</button>
        <div class="g4-hearts" aria-label="lives"></div>
        <div class="g4-chip g4-wchip">🐍 <b>1</b>/${WORDS_N}</div>
        <div class="g4-chip g4-spd" hidden>⚡ <b>1</b></div>
        <button class="g4-ibtn g4-pause" aria-label="pause">⏸</button>
      </div>
      <div class="g4-card-q" hidden>
        <div class="g4-qlabel">${T('mode.snake.label')}</div>
        <div class="g4-qword"></div>
        <div class="g4-slots"></div>
        <div class="g4-lumi"></div>
      </div>
    </div>
    <div class="g4-tip g4-hide">${T('mode.snake.tip')}</div>`;
  const $ = (q) => scr.querySelector(q);
  const cv = $('.g4-fg'), bgCv = $('.g4-bgc'), stage = $('.g4-stage'), flashEl = $('.g4-flash');
  const ctx = cv.getContext('2d');
  function flash(kind) { flashEl.className = 'g4-flash'; void flashEl.offsetWidth; flashEl.className = `g4-flash g4-flash-${kind}`; }
  const hud = { hearts: $('.g4-hearts'), wn: $('.g4-wchip b'), wchip: $('.g4-wchip'), spd: $('.g4-spd'), spdN: $('.g4-spd b'),
    card: $('.g4-card-q'), word: $('.g4-qword'), slots: $('.g4-slots'), tip: $('.g4-tip') };
  $('.g4-back').onclick = () => { hap(app); app.back(); };
  $('.g4-pause').onclick = () => { hap(app); pause(); };
  const cardLumi = makeLumi(app, $('.g4-lumi'), 58, 'happy', 'left');
  // v6: Лумі-коментатор «оживає» (CSS-анімації) лише коли говорить/реагує, решту часу гри — стоїть (дешевше для кадру)
  let lumiNap = 0;
  const lumiWake = () => {
    const e = cardLumi?.el;
    if (!e) return;
    e.classList.remove('lq-paused');
    clearTimeout(lumiNap);
    lumiNap = setTimeout(() => { if (alive && phase === 'play') e.classList.add('lq-paused'); }, 2600);
  };
  const lumiSay = (txt, emo, react) => {
    if (!cardLumi) return;
    lumiWake();
    if (emo) lumiCall(cardLumi, 'set', emo);
    if (react) lumiCall(cardLumi, 'react', react);
    if (txt) lumiCall(cardLumi, 'say', txt, { ms: 1700 });
  };

  // ------------------------------------------------ розміри та поле
  let W = 390, H = 800, dpr = 1, cell = 30, rows = 14, ox = 0, oy = 0;
  const bg = { c: bgCv, key: '' };
  const tiles = new Map(); // спрайти літер
  let headSpr = null, dotSpr = [], fontGen = 0;
  const PCOL = [th.accent, th.accent2, '#ffffff', mix(th.accent, '#ffffff', 0.5), '#ff7a8a'];

  function layout() {
    const r = scr.getBoundingClientRect();
    W = Math.max(280, r.width); H = Math.max(420, r.height);
    dpr = Math.min(perfLite() ? 1.5 : 2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const cardR = hud.card.hidden ? null : hud.card.getBoundingClientRect();
    const top = (cardR ? cardR.bottom - r.top : 150) + 12;
    const bottom = H - 16 - (parseFloat(getComputedStyle(scr).getPropertyValue('--safe-bottom')) || 0);
    const availW = W - 16, availH = Math.max(200, bottom - top);
    cell = Math.floor(Math.min(availW / COLS, 44));
    rows = clamp(Math.floor(availH / cell), 9, 22);
    if (rows * cell > availH) cell = Math.floor(availH / rows);
    ox = Math.round((W - COLS * cell) / 2);
    oy = Math.round(top + (availH - rows * cell) / 2);
    buildBg();
    buildSprites();
    if (g && g.len) clampSnake();
  }
  function buildBg() {
    const key = `${W}|${H}|${dpr}|${cell}|${rows}|${ox}|${oy}`;
    if (bg.key === key) return;
    bg.key = key;
    const c = bg.c;
    c.width = cv.width; c.height = cv.height;
    const x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gr = x.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, th.bg1); gr.addColorStop(0.6, th.bg2); gr.addColorStop(1, th.bg3);
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    // боке-плями
    for (let i = 0; i < 14; i++) {
      const bx = (i * 97.3) % W, by = (i * 151.7) % H, br = 20 + (i * 13) % 50;
      const rg = x.createRadialGradient(bx, by, 0, bx, by, br);
      rg.addColorStop(0, rgba(i % 2 ? th.accent : th.accent2, 0.22)); rg.addColorStop(1, rgba(th.accent, 0));
      x.fillStyle = rg; x.fillRect(bx - br, by - br, br * 2, br * 2);
    }
    const fw = COLS * cell, fh = rows * cell;
    // тінь поля (зсунута форма, без blur)
    x.fillStyle = 'rgba(0,0,0,.22)'; rrect(x, ox - 4, oy + 2, fw + 8, fh + 10, 18); x.fill();
    x.fillStyle = mix(th.roadEdge || th.ink, th.bg2, 0.35); rrect(x, ox - 6, oy - 6, fw + 12, fh + 12, 18); x.fill();
    x.save(); rrect(x, ox, oy, fw, fh, 13); x.clip();
    const c1 = mix(th.soft, th.card, 0.5), c2 = mix(th.soft, th.accent2, 0.12);
    x.fillStyle = c1; x.fillRect(ox, oy, fw, fh);
    x.fillStyle = c2;
    for (let yy = 0; yy < rows; yy++) for (let xx = 0; xx < COLS; xx++) if ((xx + yy) & 1) x.fillRect(ox + xx * cell, oy + yy * cell, cell, cell);
    // м'яке віньєтування
    const vg = x.createRadialGradient(ox + fw / 2, oy + fh / 2, Math.min(fw, fh) * 0.3, ox + fw / 2, oy + fh / 2, Math.max(fw, fh) * 0.75);
    vg.addColorStop(0, 'rgba(255,255,255,0)'); vg.addColorStop(1, rgba(th.ink, 0.14));
    x.fillStyle = vg; x.fillRect(ox, oy, fw, fh);
    x.restore();
    x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.55)'; rrect(x, ox - 1, oy - 1, fw + 2, fh + 2, 14); x.stroke();
  }
  function buildSprites() {
    tiles.clear();
    const s = Math.ceil(cell * 1.7 * dpr);
    headSpr = mkCanvas(s, s);
    const hx = headSpr.getContext('2d');
    hx.setTransform(dpr, 0, 0, dpr, s / 2, s / 2);
    const r = cell * 0.5;
    hx.fillStyle = th.ink; hx.beginPath(); hx.arc(0, 0, r + 1.5, 0, 7); hx.fill();
    const hg = hx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
    hg.addColorStop(0, mix(th.accent2, '#ffffff', 0.45)); hg.addColorStop(1, th.accent2);
    hx.fillStyle = hg; hx.beginPath(); hx.arc(0, 0, r, 0, 7); hx.fill();
    hx.fillStyle = 'rgba(255,255,255,.35)'; hx.beginPath(); hx.ellipse(-r * 0.35, -r * 0.45, r * 0.32, r * 0.18, -0.5, 0, 7); hx.fill();
    // частинки — кружечки кожного кольору
    dotSpr = PCOL.map((col) => {
      const d = mkCanvas(16 * dpr, 16 * dpr), dx = d.getContext('2d');
      dx.setTransform(dpr, 0, 0, dpr, 8 * dpr, 8 * dpr);
      const dg = dx.createRadialGradient(0, 0, 0, 0, 0, 8);
      dg.addColorStop(0, '#ffffff'); dg.addColorStop(0.35, col); dg.addColorStop(1, rgba(col, 0));
      dx.fillStyle = dg; dx.beginPath(); dx.arc(0, 0, 8, 0, 7); dx.fill();
      return d;
    });
  }
  function tileSprite(ch) {
    let c = tiles.get(ch);
    if (c) return c;
    const s = Math.ceil(cell * 1.7 * dpr);
    c = mkCanvas(s, s);
    const x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, s / 2, s / 2);
    const r = cell * 0.42;
    const gl = x.createRadialGradient(0, 0, r * 0.6, 0, 0, cell * 0.82);
    gl.addColorStop(0, rgba(th.accent, 0.55)); gl.addColorStop(1, rgba(th.accent, 0));
    x.fillStyle = gl; x.beginPath(); x.arc(0, 0, cell * 0.82, 0, 7); x.fill();
    x.fillStyle = 'rgba(0,0,0,.2)'; x.beginPath(); x.arc(0, r * 0.18, r, 0, 7); x.fill();
    const g2 = x.createLinearGradient(0, -r, 0, r);
    g2.addColorStop(0, mix(th.accentSoft, '#ffffff', 0.4)); g2.addColorStop(1, th.accent);
    x.fillStyle = g2; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill();
    x.lineWidth = 2; x.strokeStyle = th.ink; x.stroke();
    x.fillStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.ellipse(-r * 0.38, -r * 0.48, r * 0.3, r * 0.15, -0.5, 0, 7); x.fill();
    x.fillStyle = th.ink; x.font = `900 ${Math.round(cell * 0.56)}px ${FONT}`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(ch, 0, cell * 0.04);
    tiles.set(ch, c);
    return c;
  }
  const onFonts = () => { fontGen += 1; tiles.clear(); };
  document.fonts?.addEventListener?.('loadingdone', onFonts);

  // ------------------------------------------------ частинки (пул)
  const PN = 220;
  const P = { x: new Float32Array(PN), y: new Float32Array(PN), vx: new Float32Array(PN), vy: new Float32Array(PN),
    life: new Float32Array(PN), max: new Float32Array(PN), sz: new Float32Array(PN), c: new Uint8Array(PN) };
  let pHead = 0;
  function burst(x, y, n, speed = 160, colors = -1) {
    n = perfLite() ? n >> 1 : n;
    for (let k = 0; k < n; k++) {
      const i = pHead; pHead = (pHead + 1) % PN;
      const a = Math.random() * Math.PI * 2, v = speed * (0.35 + Math.random() * 0.8);
      P.x[i] = x; P.y[i] = y; P.vx[i] = Math.cos(a) * v; P.vy[i] = Math.sin(a) * v - speed * 0.3;
      P.max[i] = P.life[i] = 0.5 + Math.random() * 0.5; P.sz[i] = 6 + Math.random() * 9;
      P.c[i] = colors >= 0 ? colors : (Math.random() * PCOL.length) | 0;
    }
  }
  function stepParticles(dt) {
    for (let i = 0; i < PN; i++) {
      if (P.life[i] <= 0) continue;
      P.life[i] -= dt;
      P.vy[i] += 320 * dt; P.vx[i] *= 0.985;
      P.x[i] += P.vx[i] * dt; P.y[i] += P.vy[i] * dt;
    }
  }
  function drawParticles() {
    for (let i = 0; i < PN; i++) {
      if (P.life[i] <= 0) continue;
      const k = P.life[i] / P.max[i], s = P.sz[i] * (0.4 + k * 0.6);
      ctx.globalAlpha = k;
      ctx.drawImage(dotSpr[P.c[i]], P.x[i] - s, P.y[i] - s, s * 2, s * 2);
    }
    ctx.globalAlpha = 1;
  }
  // спливаючі літери, що летять у картку
  const FLY = Array.from({ length: 6 }, () => ({ on: false, ch: '', x: 0, y: 0, tx: 0, ty: 0, t: 0 }));
  function flyLetter(ch, x, y) {
    const f = FLY.find((o) => !o.on) || FLY[0];
    const sr = scr.getBoundingClientRect(), slot = hud.slots.children[g.pos];
    const br = slot ? slot.getBoundingClientRect() : { left: W / 2, top: 80, width: 0, height: 0 };
    f.on = true; f.ch = ch; f.x = x; f.y = y; f.tx = br.left - sr.left + br.width / 2; f.ty = br.top - sr.top + br.height / 2; f.t = 0;
  }

  // ------------------------------------------------ стан гри
  const sx = new Int16Array(MAXN), sy = new Int16Array(MAXN), qx = new Int16Array(MAXN), qy = new Int16Array(MAXN);
  const TL = Array.from({ length: 10 }, () => ({ on: false, x: 0, y: 0, ch: '', t: 0, die: 0 }));
  let g = null;
  let phase = 'intro', paused = false;
  const look = { x: 1, y: 0 };

  function newGame() {
    g = { words: pickWords(pairs), wi: 0, pos: 0, hearts: HEARTS, len: 0, dir: 0, q: [], grow: 0, acc: 0, step: 0.30,
      letters: 0, mistakes: 0, wordsDone: 0, wordMiss: 0, xp: 0, hold: 0, hurt: 0, shake: 0,
      blink: 2, tongue: 0, tongueT: 1.5, time: 0, celebrate: 0, swiped: false };
    stage.style.transform = '';
    _debug.g = g;
    _debug.api = { sx, sy, TL, cols: COLS, rows: () => rows, need };
    for (const t of TL) t.on = false;
    resetSnake(4);
    renderHearts();
  }
  function resetSnake(n) {
    n = clamp(n, 3, Math.min(MAXN - 1, COLS - 3));
    const y = Math.floor(rows / 2);
    for (let i = 0; i < n; i++) { sx[i] = qx[i] = n - 1 - i + 1; sy[i] = qy[i] = y; }
    g.len = n; g.dir = 0; g.q.length = 0; g.acc = 0; look.x = 1; look.y = 0;
  }
  function clampSnake() {
    for (let i = 0; i < g.len; i++) {
      if (sx[i] >= COLS || sy[i] >= rows) { resetSnake(Math.min(g.len, 6)); for (const t of TL) if (t.on && (t.y >= rows)) t.y = rows - 1; return; }
    }
    for (const t of TL) if (t.on && t.y >= rows) t.on = false;
    ensureNeed();
  }
  const word = () => g.words[g.wi];
  const need = () => word()?.en[g.pos] || '';
  function occupied(x, y) {
    for (let i = 0; i < g.len; i++) if (sx[i] === x && sy[i] === y) return true;
    for (const t of TL) if (t.on && !t.die && t.x === x && t.y === y) return true;
    return false;
  }
  function freeCell() {
    const hx = sx[0], hy = sy[0];
    for (let k = 0; k < 200; k++) {
      const x = (Math.random() * COLS) | 0, y = (Math.random() * rows) | 0;
      if (occupied(x, y)) continue;
      if (Math.abs(x - hx) + Math.abs(y - hy) < 3) continue;
      if (Math.abs(x - (hx + DX[g.dir] * 2)) + Math.abs(y - (hy + DY[g.dir] * 2)) < 2) continue; // не прямо під носом
      return [x, y];
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < COLS; x++) if (!occupied(x, y)) return [x, y];
    return null;
  }
  function spawn(ch) {
    const c = freeCell();
    const t = TL.find((o) => !o.on);
    if (!c || !t) return;
    t.on = true; t.x = c[0]; t.y = c[1]; t.ch = ch; t.t = 0; t.die = 0;
  }
  const ABC = 'ABCDEFGHIJKLMNOPRSTUVWY';
  function decoyLetter() {
    const n = need(), w = word()?.en || '';
    for (let k = 0; k < 30; k++) {
      // половина приманок — інші літери цього ж слова (щоб думати про порядок)
      const ch = Math.random() < 0.5 && w.length > 1 ? w[(Math.random() * w.length) | 0] : ABC[(Math.random() * ABC.length) | 0];
      if (ch !== n) return ch;
    }
    return n === 'Z' ? 'Q' : 'Z';
  }
  const decoyCount = () => Math.min(3 + g.wi, 7);
  function ensureNeed() {
    const n = need();
    if (!n) return;
    let has = false, cnt = 0;
    for (const t of TL) if (t.on && !t.die) { cnt += 1; if (t.ch === n) has = true; }
    if (!has) { spawn(n); cnt += 1; }
    while (cnt < decoyCount() + 1) { const before = cnt; spawn(decoyLetter()); cnt += 1; if (before === cnt) break; }
  }
  function setupWord() {
    for (const t of TL) if (t.on) t.die = t.die || 0.001;
    g.pos = 0; g.wordMiss = 0;
    g.step = Math.max(0.19, 0.30 - g.wi * 0.022);
    const w = word();
    hud.word.textContent = w.nat;
    hud.word.classList.toggle('g4-long', w.nat.length > 16);
    hud.slots.innerHTML = [...w.en].map((_, i) => `<b class="${i === 0 ? 'next' : ''}"></b>`).join('');
    hud.card.hidden = false;
    hud.card.classList.remove('g4-done', 'g4-in'); void hud.card.offsetWidth; hud.card.classList.add('g4-in');
    hud.wn.textContent = g.wi + 1;
    hud.wchip.classList.remove('g4-bump'); void hud.wchip.offsetWidth; hud.wchip.classList.add('g4-bump');
    hud.spd.hidden = g.wi === 0; hud.spdN.textContent = g.wi + 1;
    layout();
    setTimeout(() => { if (alive && g) ensureNeed(); }, 260);
    g.hold = 0.9;
    sfx('whoosh');
  }
  function renderHearts() {
    hud.hearts.innerHTML = Array.from({ length: HEARTS }, (_, i) => `<i class="${i < g.hearts ? '' : 'lost'}">❤️</i>`).join('');
  }
  function loseHeart(reason) {
    g.hearts -= 1; g.mistakes += 1; g.wordMiss += 1;
    dirty = true;
    renderHearts();
    const h = hud.hearts.children[g.hearts];
    if (h) { h.classList.add('g4-bump'); }
    g.shake = 0.45; g.hurt = 0.9; flash('bad');
    sfx('wrong'); hap(app, 'error');
    hud.card.classList.remove('g4-shake'); void hud.card.offsetWidth; hud.card.classList.add('g4-shake');
    if (reason) lumiSay(reason, 'surprised', 'shake');
    if (g.hearts <= 0) { g.hold = 99; setTimeout(() => alive && finish(false), 900); }
  }

  // ------------------------------------------------ крок сітки
  function tick() {
    if (g.q.length) {
      const nd = g.q.shift();
      if ((nd + 2) % 4 !== g.dir) g.dir = nd;
    }
    // v9: поле «зациклене» — змійка проходить крізь стіни (і крізь себе) без штрафу
    const nx = (sx[0] + DX[g.dir] + COLS) % COLS, ny = (sy[0] + DY[g.dir] + rows) % rows;
    const grow = g.grow > 0;
    for (let i = 0; i < g.len; i++) { qx[i] = sx[i]; qy[i] = sy[i]; }
    let n = g.len;
    if (grow && n < MAXN - 1) { sx[n] = qx[n] = sx[n - 1]; sy[n] = qy[n] = sy[n - 1]; n += 1; g.grow -= 1; }
    const last = grow ? n - 2 : n - 1;
    for (let i = last; i >= 1; i--) { sx[i] = sx[i - 1]; sy[i] = sy[i - 1]; }
    sx[0] = nx; sy[0] = ny; g.len = n;
    // з'їли?
    for (const t of TL) {
      if (!t.on || t.die || t.x !== nx || t.y !== ny) continue;
      eat(t);
      break;
    }
  }
  function cellCx(x) { return ox + (x + 0.5) * cell; }
  function cellCy(y) { return oy + (y + 0.5) * cell; }
  function eat(t) {
    const px = cellCx(t.x), py = cellCy(t.y);
    t.die = 0.001;
    if (t.ch === need()) {
      g.letters += 1; g.grow += 1;
      burst(px, py, 16, 170);
      flyLetter(t.ch, px, py);
      const slot = hud.slots.children[g.pos];
      if (slot) { slot.textContent = t.ch; slot.classList.remove('next'); slot.classList.add('on'); }
      g.pos += 1;
      const nx = hud.slots.children[g.pos];
      if (nx) nx.classList.add('next');
      sfx('pop'); hap(app, 'light');
      g.tongue = 0.25;
      if (g.pos >= word().en.length) wordDone(px, py);
      else ensureNeed();
    } else {
      burst(px, py, 10, 120, 4);
      loseHeart(T('mode.snake.wrong', { c: need() }));
      if (g.hearts > 0) { g.hold = 0.55; ensureNeed(); }
    }
  }
  function crash(msg) {
    burst(cellCx(sx[0]), cellCy(sy[0]), 18, 200, 4);
    loseHeart(msg);
    if (g.hearts > 0) {
      g.hold = 1.0;
      g.respawn = true;
    }
  }
  function wordDone(px, py) {
    const w = word();
    g.wordsDone += 1;
    g.xp += XP_PER;
    try { S.onCorrectAnswer(st); S.addXP(st, XP_PER); } catch (e) { console.warn(e); }
    dirty = true;
    hud.card.classList.add('g4-done');
    burst(px, py, 34, 260);
    flash('good');
    sfx(g.wordMiss === 0 ? 'combo' : 'correct');
    setTimeout(() => { if (alive) speak(w.en.toLowerCase()); }, 350);
    hap(app, 'success');
    lumiSay(`${T('mode.g4.praise')} ${w.en.toLowerCase()}`, 'happy', 'jump');
    for (const t of TL) if (t.on) t.die = t.die || 0.001;
    g.hold = 1.5;
    g.celebrate = 1.5;
    if (g.wi + 1 >= g.words.length) { g.hold = 99; setTimeout(() => alive && finish(true), 1300); }
    else setTimeout(() => { if (alive && g && phase === 'play') { g.wi += 1; setupWord(); } }, 1250);
  }

  // ------------------------------------------------ кадр
  let raf = 0, last = 0, running = false;
  let slowAcc = 0, slowN = 0, slowSkip = 20;
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
      else { slowAcc += ms; slowN += 1; if (slowAcc > 1500) { if (slowAcc / slowN > 21) { document.documentElement.dataset.perf = 'lite'; layout(); } slowAcc = 0; slowN = 0; } }
    }
    update(dt);
    draw(dt);
  }
  function update(dt) {
    if (!g) return;
    g.time += dt;
    if (phase === 'play') {
      if (g.hold > 0) {
        g.hold -= dt;
        if (g.hold <= 0 && g.respawn) { g.respawn = false; resetSnake(Math.min(4 + g.pos, 8)); for (const t of TL) if (t.on && !t.die && t.y === sy[0]) t.die = 0.001; ensureNeed(); }
        if (g.hold <= 0 && !g.swiped && g.wi === 0) hud.tip.classList.remove('g4-hide');
      } else {
        g.acc += dt;
        while (g.acc >= g.step && g.hold <= 0 && phase === 'play') { g.acc -= g.step; tick(); }
        if (g.hold > 0) g.acc = 0;
      }
    }
    if (g.shake > 0) {
      g.shake = Math.max(0, g.shake - dt);
      const k = g.shake / 0.45;
      stage.style.transform = g.shake > 0 ? `translate3d(${(Math.sin(g.time * 70) * 7 * k).toFixed(1)}px,${(Math.cos(g.time * 53) * 4 * k).toFixed(1)}px,0)` : '';
    } g.hurt = Math.max(0, g.hurt - dt);
    g.celebrate = Math.max(0, g.celebrate - dt);
    g.blink -= dt; if (g.blink < -0.12) g.blink = 2 + Math.random() * 2.5;
    g.tongueT -= dt; if (g.tongueT <= 0) { g.tongue = 0.3; g.tongueT = 1.6 + Math.random() * 2; }
    g.tongue = Math.max(0, g.tongue - dt);
    for (let i = 0; i < TL.length; i++) {
      const t = TL[i];
      if (!t.on) continue;
      t.t += dt;
      if (t.die) { t.die += dt; if (t.die > 0.22) t.on = false; }
    }
    // очі — плавно в напрямку руху
    const k = Math.min(1, dt * 14);
    look.x += (DX[g.dir] - look.x) * k; look.y += (DY[g.dir] - look.y) * k;
    stepParticles(dt);
    for (let i = 0; i < FLY.length; i++) {
      const f = FLY[i];
      if (!f.on) continue;
      f.t += dt * 2.4;
      if (f.t >= 1) f.on = false;
    }
  }
  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!g) return;
    // літери
    for (let i = 0; i < TL.length; i++) {
      const t = TL[i];
      if (!t.on) continue;
      const spr = tileSprite(t.ch);
      let s = t.t < 0.3 ? easeBack(t.t / 0.3) : 1 + Math.sin(g.time * 3 + i * 1.7) * 0.04;
      if (t.die) s *= Math.max(0, 1 - t.die / 0.22) * 1.3;
      if (s <= 0.01) continue;
      const w = (spr.width / dpr) * s, y = cellCy(t.y) + Math.sin(g.time * 2.4 + i) * 1.6;
      ctx.drawImage(spr, cellCx(t.x) - w / 2, y - w / 2, w, w);
    }
    drawSnake();
    drawParticles();
    // літери, що летять у слот
    for (let i = 0; i < FLY.length; i++) {
      const f = FLY[i];
      if (!f.on) continue;
      const e = f.t * f.t * (3 - 2 * f.t);
      const x = f.x + (f.tx - f.x) * e, y = f.y + (f.ty - f.y) * e - Math.sin(f.t * Math.PI) * 60;
      const spr = tileSprite(f.ch), w = (spr.width / dpr) * (1 - e * 0.45);
      ctx.globalAlpha = 1 - e * 0.5;
      ctx.drawImage(spr, x - w / 2, y - w / 2, w, w);
    }
    ctx.globalAlpha = 1;
  }
  const easeBack = (k) => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const COL = { out: th.ink, body: th.accent2, light: mix(th.accent2, '#ffffff', 0.42), spot: mix(th.accent, '#ffffff', 0.15), shadow: 'rgba(0,0,0,.2)' };
  const wrapD = (d) => (d > 1 ? -1 : d < -1 ? 1 : d);   // крок через край поля
  function segX(i, a) { return ox + (qx[i] + wrapD(sx[i] - qx[i]) * a + 0.5) * cell; }
  function segY(i, a) { return oy + (qy[i] + wrapD(sy[i] - qy[i]) * a + 0.5) * cell; }
  function snakePath(a, dx, dy) {
    ctx.beginPath();
    let px0 = segX(g.len - 1, a), py0 = segY(g.len - 1, a);
    ctx.moveTo(px0 + dx, py0 + dy);
    const gap = cell * 1.6;
    for (let i = g.len - 2; i >= 0; i--) {
      const x = segX(i, a), y = segY(i, a);
      if (Math.abs(x - px0) > gap || Math.abs(y - py0) > gap) { ctx.lineTo(px0 + dx + 0.01, py0 + dy); ctx.moveTo(x + dx, y + dy); }
      else ctx.lineTo(x + dx, y + dy);
      px0 = x; py0 = y;
    }
    ctx.lineTo(px0 + dx + 0.01, py0 + dy);
  }
  // Змійка малюється в межах поля; під час переходу через край — ще й «дзеркальна» копія з іншого боку.
  function drawSnake() {
    const fw = COLS * cell, fh = rows * cell;
    ctx.save();
    ctx.beginPath(); ctx.rect(ox, oy, fw, fh); ctx.clip();
    drawSnakeOnce();
    const moving = phase === 'play' && g.hold <= 0;
    if (moving) {
      let ex = 0, ey = 0;
      for (let i = 0; i < g.len; i++) {
        const d1 = sx[i] - qx[i], d2 = sy[i] - qy[i];
        if (d1 > 1) ex = 1; else if (d1 < -1) ex = -1;
        if (d2 > 1) ey = 1; else if (d2 < -1) ey = -1;
      }
      if (ex) { ctx.translate(ex * fw, 0); drawSnakeOnce(); ctx.translate(-ex * fw, 0); }
      if (ey) { ctx.translate(0, ey * fh); drawSnakeOnce(); ctx.translate(0, -ey * fh); }
    }
    ctx.restore();
  }
  function drawSnakeOnce() {
    const moving = phase === 'play' && g.hold <= 0;
    const a = moving ? Math.min(1, g.acc / g.step) : 1;
    if (g.hurt > 0 && ((g.hurt * 10) | 0) % 2 === 0) ctx.globalAlpha = 0.45;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // тінь, обвідка, тіло, відблиск — один і той самий шлях
    snakePath(a, 0, 4); ctx.strokeStyle = COL.shadow; ctx.lineWidth = cell * 0.8; ctx.stroke();
    snakePath(a, 0, 0);
    ctx.strokeStyle = COL.out; ctx.lineWidth = cell * 0.8; ctx.stroke();
    ctx.strokeStyle = COL.body; ctx.lineWidth = cell * 0.66; ctx.stroke();
    snakePath(a, -cell * 0.06, -cell * 0.12);
    ctx.strokeStyle = COL.light; ctx.lineWidth = cell * 0.2; ctx.stroke();
    // плямки на спинці (кожен другий сегмент), з легкою «хвилею»
    ctx.fillStyle = COL.spot;
    for (let i = 2; i < g.len; i += 2) {
      const r = cell * (0.13 - 0.04 * (i / g.len)) * (g.celebrate > 0 ? 1 + 0.4 * Math.sin(g.time * 18 - i) : 1);
      ctx.beginPath(); ctx.arc(segX(i, a), segY(i, a) + cell * 0.04, Math.max(1, r), 0, 7); ctx.fill();
    }
    // голова
    const hx = segX(0, a), hy = segY(0, a);
    const fx2 = look.x, fy2 = look.y, px = -fy2, py = fx2;
    // язичок
    if (g.tongue > 0 && g.hurt <= 0) {
      const L = cell * (0.55 + 0.25 * Math.sin((g.tongue / 0.3) * Math.PI));
      const bx = hx + fx2 * cell * 0.4, by = hy + fy2 * cell * 0.4;
      const ex = hx + fx2 * L, ey = hy + fy2 * L;
      ctx.strokeStyle = '#ff4d6d'; ctx.lineWidth = Math.max(1.5, cell * 0.07);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey);
      ctx.lineTo(ex + (fx2 + px) * cell * 0.12, ey + (fy2 + py) * cell * 0.12);
      ctx.moveTo(ex, ey); ctx.lineTo(ex + (fx2 - px) * cell * 0.12, ey + (fy2 - py) * cell * 0.12);
      ctx.stroke();
    }
    const hs = headSpr.width / dpr * (g.celebrate > 0 ? 1 + 0.08 * Math.sin(g.time * 20) : 1);
    ctx.drawImage(headSpr, hx - hs / 2, hy - hs / 2, hs, hs);
    // щічки
    ctx.fillStyle = 'rgba(255,110,140,.45)';
    for (let s = -1; s <= 1; s += 2) { ctx.beginPath(); ctx.arc(hx + px * s * cell * 0.3 - fx2 * cell * 0.06, hy + py * s * cell * 0.3 - fy2 * cell * 0.06, cell * 0.09, 0, 7); ctx.fill(); }
    // очі — дивляться в напрямку руху
    const er = cell * 0.15;
    const blink = g.blink < 0 ? 0.15 : 1;
    for (let s = -1; s <= 1; s += 2) {
      const ex = hx + px * s * cell * 0.2 + fx2 * cell * 0.12, ey = hy + py * s * cell * 0.2 + fy2 * cell * 0.12;
      if (g.hurt > 0) {
        ctx.strokeStyle = COL.out; ctx.lineWidth = Math.max(1.5, cell * 0.06);
        ctx.beginPath(); ctx.moveTo(ex - er * 0.7, ey - er * 0.7); ctx.lineTo(ex + er * 0.7, ey + er * 0.7);
        ctx.moveTo(ex + er * 0.7, ey - er * 0.7); ctx.lineTo(ex - er * 0.7, ey + er * 0.7); ctx.stroke();
        continue;
      }
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = COL.out; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(ex, ey, er, er * blink, 0, 0, 7); ctx.fill(); ctx.stroke();
      if (blink > 0.5) {
        ctx.fillStyle = '#1c1233';
        ctx.beginPath(); ctx.arc(ex + fx2 * er * 0.45, ey + fy2 * er * 0.45, er * 0.55, 0, 7); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(ex + fx2 * er * 0.45 - er * 0.2, ey + fy2 * er * 0.45 - er * 0.22, er * 0.2, 0, 7); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------ керування
  function turn(d) {
    if (!g || paused || phase !== 'play') return;
    const lastD = g.q.length ? g.q[g.q.length - 1] : g.dir;
    if (d === lastD || (d + 2) % 4 === lastD) return;
    if (g.q.length < 3) g.q.push(d);
    if (!g.swiped) { g.swiped = true; hud.tip.classList.add('g4-hide'); }
    hap(app, 'light');
  }
  let sw = null;
  function onDown(e) {
    if (e.target.closest('button, .g4-over, .g4-lumi')) return;
    sw = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false, x0: e.clientX, y0: e.clientY };
  }
  function onMove(e) {
    if (!sw || e.pointerId !== sw.id) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if (dx * dx + dy * dy < 12 * 12) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3));
    sw.x = e.clientX; sw.y = e.clientY; sw.moved = true;
  }
  // Тап без свайпу: змійка повертає в бік дотику відносно голови (ліворуч/праворуч або вгору/вниз).
  function onUp(e) {
    const s0 = sw; sw = null;
    if (!s0 || s0.moved || !g || !e || e.type === 'pointercancel') return;
    const r = cv.getBoundingClientRect();
    const hx = r.left + cellCx(sx[0]), hy = r.top + cellCy(sy[0]);
    const dx = e.clientX - hx, dy = e.clientY - hy;
    const horiz = g.dir === 0 || g.dir === 2;
    // якщо рухаємось горизонтально — тап вирішує «вгору чи вниз», і навпаки
    if (horiz) { if (Math.abs(dy) > cell * 0.4) turn(dy > 0 ? 1 : 3); else turn(dx > 0 ? 0 : 2); }
    else if (Math.abs(dx) > cell * 0.4) turn(dx > 0 ? 0 : 2); else turn(dy > 0 ? 1 : 3);
  }
  const KEYS = { ArrowRight: 0, d: 0, D: 0, ArrowDown: 1, s: 1, S: 1, ArrowLeft: 2, a: 2, A: 2, ArrowUp: 3, w: 3, W: 3 };
  function onKey(e) {
    if (!alive || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (phase === 'play' && !overlay) { e.preventDefault(); pause(); }
      return;
    }
    if (e.key in KEYS && phase === 'play' && !paused) { e.preventDefault(); turn(KEYS[e.key]); }
  }
  function onVis() { if (document.hidden && phase === 'play' && !overlay && alive) pause(); }
  scr.addEventListener('pointerdown', onDown);
  scr.addEventListener('pointermove', onMove);
  scr.addEventListener('pointerup', onUp);
  scr.addEventListener('pointercancel', onUp);
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
      <div class="g4-ico">🐍</div>
      <h2>${T('mode.snake.title')}</h2>
      <div class="g4-sub">${esc(world?.emoji || '')} ${esc((I.tc ? I.tc(world, 'name') : world?.name) || '')}${best ? T('mode.g4.best') + '⭐'.repeat(best) : ''}</div>
      <div class="g4-ilumi"></div>
      <ul class="g4-rules">
        <li>${T('mode.snake.r1')}</li><li>${T('mode.snake.r2')}</li>
        <li>${T('mode.snake.r3', { h: HEARTS, n: WORDS_N })}</li><li>${T('mode.snake.r4')}</li>
      </ul>
      <div class="g4-keys">${T('mode.snake.keys')}</div>
      <div class="g4-btns">
        <button class="g4-btn g4-go" data-a="go">${T('mode.snake.start')}</button>
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
    setupWord();
    lumiSay(T('mode.snake.hi'), 'happy', 'nod');
    start();
  }
  function pause() {
    if (paused || overlay || phase !== 'play' || !alive) return;
    paused = true; stop(); _debug.phase = 'paused';
    overlay = el('div', 'g4-over');
    overlay.innerHTML = `<div class="g4-box g4-box-sm">
      <h2>${T('mode.g4.pause')}</h2>
      <div class="g4-sub">${T('mode.snake.word', { i: (g?.wi || 0) + 1, n: WORDS_N })} · ❤️ ${g?.hearts ?? HEARTS}</div>
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
  function finish(win) {
    if (!alive || overlay || phase === 'over') return;
    phase = 'over'; _debug.phase = 'result';
    hud.tip.classList.add('g4-hide');
    const stars = win ? Math.max(1, starsByRatio(g.letters / Math.max(1, g.letters + g.mistakes))) : 0;
    const rec = recordGame(st, gameId, stars);
    try { app.save?.(); } catch (e) { /* */ }
    dirty = false;
    _debug.stars = stars;
    hap(app, win ? 'success' : 'error');
    const learned = g.words.slice(0, g.wordsDone).map((w) => `<i>${esc(w.en.toLowerCase())}</i>`).join('');
    overlay = el('div', `g4-over ${win ? 'g4-win' : 'g4-lose'}`);
    overlay.innerHTML = `<div class="g4-box">
      <div class="g4-banner">${win ? T('mode.snake.win') : T('mode.snake.lose')}</div>
      <div class="g4-stars"></div>
      <p class="g4-sub">${win ? (stars === 3 ? T('mode.snake.perfect') : T('mode.snake.good')) : T('mode.snake.out')}</p>
      ${rec.isRecord ? `<div class="g4-record">${T('mode.g4.record')}</div>` : ''}
      <div class="g4-stats">
        <div><span>${T('mode.snake.s_words')}</span><strong><b data-n="${g.wordsDone}">0</b><em>/${WORDS_N}</em></strong></div>
        <div><span>${T('mode.snake.s_letters')}</span><strong><b data-n="${g.letters}">0</b></strong></div>
        <div><span>${T('mode.snake.s_wrong')}</span><strong><b data-n="${g.mistakes}">0</b></strong></div>
      </div>
      ${learned ? `<div class="g4-learned">${T('mode.snake.learned')} ${learned}</div>` : ''}
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
    // поле під результатом застигає — rAF не потрібен
    setTimeout(() => { if (alive && phase === 'over') stop(); }, 1200);
    const on = (a, fn) => { ov.querySelector(`[data-a=${a}]`).onclick = () => { hap(app); fn(); }; };
    on('again', () => { closeOverlay(); begin(); });
    on('next', () => app.back());
  }

  // ------------------------------------------------ старт
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { layout(); if (!running) draw(); }) : null;
  ro?.observe(scr);
  newGame(); // показове поле під стартовим екраном
  layout();
  ensureNeed();
  draw();
  intro();

  return () => {
    alive = false;
    stop();
    skyOff(false);
    if (dirty) { dirty = false; try { app.save?.(); } catch (e) { /* */ } }
    ro?.disconnect();
    scr.removeEventListener('pointerdown', onDown);
    scr.removeEventListener('pointermove', onMove);
    scr.removeEventListener('pointerup', onUp);
    scr.removeEventListener('pointercancel', onUp);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVis);
    document.fonts?.removeEventListener?.('loadingdone', onFonts);
    clearTimeout(lumiNap);
    lumiRefs.forEach((l) => lumiCall(l, 'destroy'));
    lumiCall(cardLumi, 'destroy');
    lumiRefs = [];
  };
}
