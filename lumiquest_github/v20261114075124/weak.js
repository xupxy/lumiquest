// 🔍 «Слабкі місця» (v21) — рогатка зі світлячком. Лумі-детектив пояснює правило на дошці,
// далі раунди: угорі завдання, на полі 3–4 вежі «Плутанок» (оригінальні пустотливі клякси) з табличками-варіантами.
// Тягнеш рогатку → пунктир траєкторії → постріл (canvas, проста 2D-фізика: гравітація, AABB-зіткнення, падіння блоків).
// Правильна вежа розвалюється, Плутанка тікає; неправильна — хитається + «чому ні» і правило.
// 3 світлячки на раунд. ≥75% з першої спроби — пройдено, інакше «Лумі пояснює інакше» + 3 раунди. Потім фінальна перевірка.
import * as FX from './fx.js?v=20261114075109';
import { recordGame, starsByRatio } from './games.js?v=20261114075109';

let I = {};
try { I = await import('./i18n.js?v=20261114075109'); } catch (e) { /* */ }
let A = {};
import('./audio.js?v=20261114075109').then((m) => { A = m; }).catch(() => { /* */ });
let TH = {};
try { TH = await import('./theme.js?v=20261114075109'); } catch (e) { /* */ }
let WK = null; // модуль агента ЛОГІКА; поки його нема — фолбек-сесія
try { WK = await import('./weakspots.js?v=20261114075109'); } catch (e) { WK = null; }

const sfx = (n) => { try { A.sfx?.(n); } catch (e) { /* */ } };
const hap = (app, k = 'light') => { try { app.tg?.tap?.(k); } catch (e) { /* */ } };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lite = () => document.documentElement.dataset.perf === 'lite';
const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const STR = {
  uk: {
    'mode.weak.title': 'Слабкі місця', 'mode.weak.got': 'Зрозумів! 🎯', 'mode.weak.back': '‹ Назад',
    'mode.weak.detective': 'Лумі-детектив знайшов, де ти плутаєшся:', 'mode.weak.example': 'Приклад',
    'mode.weak.how': '👆 Тапни вежу з правильною відповіддю — Лумі сам натягне рогатку і влучить!',
    'mode.weak.round': 'Раунд {a}/{b}', 'mode.weak.final': '🔎 Перевірка: тепер виходить?', 'mode.weak.retry': '🔁 Ще раз',
    'mode.weak.ok': '💥 Так! Вежа впала!', 'mode.weak.no': '❌ «{x}» тут не підходить.', 'mode.weak.miss': '💨 Мимо! Тапни вежу — Лумі влучить сам', 'mode.weak.tap': '👆 Тапни вежу з правильною відповіддю',
    'mode.weak.reveal': 'Світлячки скінчились. Правильно: «{x}».', 'mode.weak.next': 'Далі ➜', 'mode.weak.rule': 'Правило',
    'mode.weak.other': 'Лумі пояснює інакше', 'mode.weak.other2': 'Спробуємо ще 3 раунди — тепер вийде!',
    'mode.weak.win': 'Плутанки розбіглися!', 'mode.weak.lose': 'Плутанки ще тримаються…', 'mode.weak.acc': 'З першої спроби: {a}/{b}',
    'mode.weak.go': '➡️ Далі', 'mode.weak.again': '🔁 Ще раз', 'mode.weak.finalok': '✅ Перевірку пройдено!', 'mode.weak.finalno': '🟠 Перевірка ще не вийшла',
  },
  ru: {
    'mode.weak.title': 'Слабые места', 'mode.weak.got': 'Понял! 🎯', 'mode.weak.back': '‹ Назад',
    'mode.weak.detective': 'Луми-детектив нашёл, где ты путаешься:', 'mode.weak.example': 'Пример',
    'mode.weak.how': '👆 Тапни башню с правильным ответом — Луми сам натянет рогатку и попадёт!',
    'mode.weak.round': 'Раунд {a}/{b}', 'mode.weak.final': '🔎 Проверка: теперь получается?', 'mode.weak.retry': '🔁 Ещё раз',
    'mode.weak.ok': '💥 Да! Башня упала!', 'mode.weak.no': '❌ «{x}» здесь не подходит.', 'mode.weak.miss': '💨 Мимо! Тапни башню — Луми попадёт сам', 'mode.weak.tap': '👆 Тапни башню с правильным ответом',
    'mode.weak.reveal': 'Светлячки закончились. Правильно: «{x}».', 'mode.weak.next': 'Дальше ➜', 'mode.weak.rule': 'Правило',
    'mode.weak.other': 'Луми объясняет иначе', 'mode.weak.other2': 'Попробуем ещё 3 раунда — теперь получится!',
    'mode.weak.win': 'Путаницы разбежались!', 'mode.weak.lose': 'Путаницы ещё держатся…', 'mode.weak.acc': 'С первой попытки: {a}/{b}',
    'mode.weak.go': '➡️ Дальше', 'mode.weak.again': '🔁 Ещё раз', 'mode.weak.finalok': '✅ Проверка пройдена!', 'mode.weak.finalno': '🟠 Проверка пока не вышла',
  },
};
try { I.addStrings?.(STR); } catch (e) { /* */ }
const isRu = () => { try { return I.lang?.() === 'ru'; } catch (e) { return false; } };
const T = (k, v) => {
  let s;
  try { s = I.t?.(k, v); } catch (e) { /* */ }
  if (!s || s === k) { s = STR[isRu() ? 'ru' : 'uk'][k] || k; if (v) for (const [a, b] of Object.entries(v)) s = s.replaceAll(`{${a}}`, b); }
  return s;
};
const L = (o, f) => (o && ((isRu() && o[f + '_ru']) || o[f])) || '';

// тимчасова сесія, поки js/weak.js (агент ЛОГІКА) не готовий
function fallbackSession() {
  return {
    topic: 'grammar:was_were', title: 'Was чи were?', title_ru: 'Was или were?',
    rule: 'was — з I / he / she / it та одним предметом. were — з you / we / they та кількома.',
    rule_ru: 'was — с I / he / she / it и одним предметом. were — с you / we / they и несколькими.',
    example: 'I was at home. They were at school.',
    example2: 'Один кіт — The cat was hungry. Багато котів — The cats were hungry.',
    example2_ru: 'Один кот — The cat was hungry. Много котов — The cats were hungry.',
    items: [
      { prompt: 'She ___ happy yesterday.', options: ['was', 'were', 'is'], answer: 'was', why: 'She — одна особа → was.', why_ru: 'She — одно лицо → was.' },
      { prompt: 'The dogs ___ in the garden.', options: ['was', 'were', 'be'], answer: 'were', why: 'dogs — багато → were.', why_ru: 'dogs — много → were.' },
    ],
    finalCheck: { prompt: 'We ___ at the zoo last Sunday.', options: ['was', 'were', 'are'], answer: 'were', why: 'We → were.', why_ru: 'We → were.' },
  };
}
function getSession(state, wid, n) {
  let s = null;
  try { if (WK && typeof WK.buildWeakSession === 'function') s = WK.buildWeakSession(state, wid, n); } catch (e) { console.warn('[weak] buildWeakSession', e); }
  if (!s || !Array.isArray(s.items) || !s.items.length) s = fallbackSession();
  return s;
}
const noteResult = (state, topic, ok) => { try { WK?.noteWeakResult?.(state, topic, ok); } catch (e) { /* */ } };
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const normItem = (it) => {
  if (!it || !Array.isArray(it.options) || !it.options.length) return null;
  // answer — індекс (js/weak.js) або рядок
  const ans = typeof it.answer === 'number' && it.options[it.answer] != null ? String(it.options[it.answer]) : String(it.answer);
  let opts = [...new Set(it.options.map(String))].filter((o) => o !== ans).slice(0, 3);
  opts.push(ans);
  return { ...it, answer: ans, options: shuffle(opts) };
};

// ---------- графіка ----------
const MAT = {
  wood: { f: '#d0904f', s: '#7a4a22', hi: 'rgba(255,230,190,.45)' },
  stone: { f: '#a3acb7', s: '#4d5560', hi: 'rgba(255,255,255,.35)' },
  glass: { f: 'rgba(175,228,255,.72)', s: '#4b8db3', hi: 'rgba(255,255,255,.85)' },
};
const MATS = ['stone', 'wood', 'glass'];
const BLOB_COLS = ['#8e5bd8', '#e0559b', '#2fb3a0', '#f08a2c'];
const FIRE = ['#fff3a0', '#ffd84a', '#ffb347', '#c8ff8a'];

function makeFireflySprite(r, dpr) {
  const S = Math.ceil(r * 5), c = document.createElement('canvas');
  c.width = S * dpr; c.height = S * dpr;
  const x = c.getContext('2d'); x.scale(dpr, dpr);
  const m = S / 2;
  const g = x.createRadialGradient(m, m, r * 0.3, m, m, S / 2);
  g.addColorStop(0, 'rgba(255,240,140,.9)'); g.addColorStop(0.35, 'rgba(255,220,90,.35)'); g.addColorStop(1, 'rgba(255,220,90,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  // крильця
  x.fillStyle = 'rgba(220,240,255,.85)'; x.strokeStyle = 'rgba(80,110,160,.6)'; x.lineWidth = 1.2;
  x.beginPath(); x.ellipse(m - r * 0.55, m - r * 0.95, r * 0.55, r * 0.32, -0.6, 0, 7); x.fill(); x.stroke();
  x.beginPath(); x.ellipse(m + r * 0.55, m - r * 0.95, r * 0.55, r * 0.32, 0.6, 0, 7); x.fill(); x.stroke();
  // тільце
  const b = x.createRadialGradient(m - r * 0.3, m - r * 0.3, 1, m, m, r);
  b.addColorStop(0, '#fffbd0'); b.addColorStop(0.6, '#ffd84a'); b.addColorStop(1, '#f2a818');
  x.fillStyle = b; x.strokeStyle = '#6b4310'; x.lineWidth = 2;
  x.beginPath(); x.arc(m, m, r, 0, 7); x.fill(); x.stroke();
  // вусики
  x.beginPath(); x.moveTo(m - r * 0.25, m - r * 0.9); x.quadraticCurveTo(m - r * 0.5, m - r * 1.6, m - r * 0.9, m - r * 1.6);
  x.moveTo(m + r * 0.25, m - r * 0.9); x.quadraticCurveTo(m + r * 0.5, m - r * 1.6, m + r * 0.9, m - r * 1.6); x.stroke();
  // обличчя
  x.fillStyle = '#3a2433';
  x.beginPath(); x.arc(m - r * 0.33, m - r * 0.1, r * 0.14, 0, 7); x.arc(m + r * 0.33, m - r * 0.1, r * 0.14, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(m - r * 0.29, m - r * 0.15, r * 0.05, 0, 7); x.arc(m + r * 0.37, m - r * 0.15, r * 0.05, 0, 7); x.fill();
  x.strokeStyle = '#3a2433'; x.lineWidth = 1.6; x.beginPath(); x.arc(m, m + r * 0.15, r * 0.3, 0.2, Math.PI - 0.2); x.stroke();
  x.fillStyle = 'rgba(255,120,140,.55)'; x.beginPath(); x.arc(m - r * 0.6, m + r * 0.2, r * 0.13, 0, 7); x.arc(m + r * 0.6, m + r * 0.2, r * 0.13, 0, 7); x.fill();
  return { c, S };
}

export const meta = { topbar: false };

export function render(root, params, app) {
  const wid = (params && params.wid) || 'w1';
  const st = app.state;
  const gameId = (params && params.id) || `${wid}-weak${(params && params.n) || 1}`;
  let alive = true;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); };

  const scr = document.createElement('div');
  scr.className = 'wk';
  scr.innerHTML = `<div class="wk-top"><button class="wk-btn" data-a="back">${esc(T('mode.weak.back'))}</button>
    <div class="wk-ttl"><b class="wk-name"></b><span class="wk-prog"></span></div><div class="wk-ammo"></div></div>
    <div class="wk-q"><div class="wk-badge"></div><div class="wk-prompt"></div></div>
    <div class="wk-field"><canvas class="wk-cv"></canvas><div class="wk-tip" hidden></div></div>`;
  root.appendChild(scr);
  let unTheme = null;
  try { unTheme = TH.applyWorldTheme?.(scr, wid, { decor: false }) || null; } catch (e) { /* */ }
  const $ = (s) => scr.querySelector(s);
  const field = $('.wk-field'), cv = $('.wk-cv'), ctx = cv.getContext('2d'), tip = $('.wk-tip');

  // ---------- сесія ----------
  let ses = null, queue = [], qi = 0, item = null, phase = 'main', retried = false;
  const res = { main: [], retry: [], final: null };

  // ---------- світ (усе виділено заздалегідь; у циклі — без алокацій) ----------
  let W = 0, H = 0, dpr = 1, ground = 0, sc = 1, ax = 0, ay = 0, maxPull = 90, kVel = 6, grav = 1000;
  let fly = null, fr = 12, bg = null;
  const towers = []; // {x0,x1,cx,blocks:[],blob,correct,down,wob,flash,label:{lines,size,w}}
  const proj = { x: 0, y: 0, vx: 0, vy: 0, on: false, hit: -1, rest: 0, done: false, out: 0, target: -1 };
  const pull = { on: false, t: 0, dx: 0, dy: 0, ti: -1 }; // автонатяг рогатки після тапу по вежі
  const TRL = 18, trail = new Float32Array(TRL * 2); let trN = 0, trI = 0;
  const PN = 48, parts = []; for (let i = 0; i < PN; i++) parts.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, col: '#fff', r: 2 });
  let drag = false, pullX = 0, pullY = 0, ammo = 3, mode = 'idle', wrongHit = false, roundOver = false, time = 0;

  function layout() {
    const r = field.getBoundingClientRect();
    W = Math.max(200, r.width | 0); H = Math.max(240, r.height | 0);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    sc = Math.min(1.4, Math.max(0.7, Math.min(W / 360, H / 470)));
    ground = H - Math.max(44, H * 0.15);
    maxPull = Math.max(55, Math.min(110, Math.min(W, H) * 0.22));
    fr = Math.round(11 * sc + 2);
    ax = Math.max(W * 0.18, 70, fr * 1.6 + maxPull * 0.75); ay = ground - Math.min(H * 0.25, 140 * sc);
    grav = 980 * sc;
    maxPull = Math.max(55, Math.min(110, Math.min(W, H) * 0.22));
    kVel = Math.sqrt(1.3 * (W * 0.86 - ax) * grav) / maxPull;
    fr = Math.round(11 * sc + 2);
    fly = makeFireflySprite(fr, dpr);
    bg = makeBg();
    if (item) buildTowers(false);
    if (!proj.on) resetProj();
    draw();
  }

  // статичний фон теми (хмари + пагорби + земля) — малюється 1 раз на layout, у кадрі лише drawImage
  function makeBg() {
    const c = document.createElement('canvas'); c.width = W * dpr; c.height = H * dpr;
    const x = c.getContext('2d'); x.scale(dpr, dpr);
    const cs = getComputedStyle(scr), v = (k, d) => (cs.getPropertyValue(k) || '').trim() || d;
    const acc = v('--w-accent', '#6bbf59'), acc2 = v('--w-accent2', '#3f9a4a');
    // сонечко-сяйво
    const g = x.createRadialGradient(W * 0.82, H * 0.12, 4, W * 0.82, H * 0.12, H * 0.32);
    g.addColorStop(0, 'rgba(255,248,200,.85)'); g.addColorStop(1, 'rgba(255,248,200,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // хмари
    x.fillStyle = 'rgba(255,255,255,.75)';
    const cl = lite() ? 2 : 4;
    for (let i = 0; i < cl; i++) {
      const cx = W * (0.12 + i * 0.27) + (i % 2) * 18, cy = H * (0.1 + (i % 3) * 0.09), r = (16 + (i % 2) * 8) * sc;
      x.beginPath(); x.arc(cx, cy, r, 0, 7); x.arc(cx + r * 1.1, cy - r * 0.35, r * 1.2, 0, 7); x.arc(cx + r * 2.2, cy, r * 0.95, 0, 7);
      x.rect(cx, cy - r * 0.2, r * 2.2, r * 1.05); x.fill();
    }
    // пагорби (2 шари, кольори теми)
    const hill = (col, base, amp, ph, alpha) => {
      x.globalAlpha = alpha; x.fillStyle = col; x.beginPath(); x.moveTo(0, ground);
      for (let px = 0; px <= W; px += 8) x.lineTo(px, base - amp * (0.6 + 0.4 * Math.sin(px / W * 6.3 + ph)) * (0.7 + 0.3 * Math.sin(px / W * 2.1 + ph * 2)));
      x.lineTo(W, ground); x.closePath(); x.fill(); x.globalAlpha = 1;
    };
    hill(acc, ground, H * 0.2, 0.8, 0.28);
    hill(acc2, ground, H * 0.11, 2.4, 0.38);
    // земля
    const gg = x.createLinearGradient(0, ground, 0, H);
    gg.addColorStop(0, '#6fbf4a'); gg.addColorStop(0.12, '#5aa63c'); gg.addColorStop(0.13, '#8a5a32'); gg.addColorStop(1, '#6b4325');
    x.fillStyle = gg; x.fillRect(0, ground, W, H - ground);
    x.fillStyle = 'rgba(255,255,255,.22)'; x.fillRect(0, ground, W, 3);
    x.fillStyle = 'rgba(0,0,0,.12)';
    for (let px = 10; px < W; px += 37) { x.beginPath(); x.arc(px, ground + (H - ground) * (0.45 + (px % 3) * 0.12), 3, 0, 7); x.fill(); }
    return c;
  }

  function fitLabel(text, maxW) {
    for (let size = Math.round(19 * sc); size >= 10; size--) {
      ctx.font = `800 ${size}px Inter, Poppins, system-ui, sans-serif`;
      if (ctx.measureText(text).width <= maxW) return { lines: [text], size };
    }
    const words = text.split(' ');
    if (words.length > 1) {
      const mid = Math.ceil(words.length / 2), l1 = words.slice(0, mid).join(' '), l2 = words.slice(mid).join(' ');
      for (let size = 15; size >= 9; size--) {
        ctx.font = `800 ${size}px Inter, Poppins, system-ui, sans-serif`;
        if (Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width) <= maxW) return { lines: [l1, l2], size };
      }
      return { lines: [l1, l2], size: 9 };
    }
    return { lines: [text], size: 9 };
  }

  function buildTowers(fresh) {
    const prev = fresh ? null : towers.map((t) => (t.down ? 1 : 0) + (t.ok ? 2 : 0));
    towers.length = 0;
    const n = item.options.length;
    const x0 = W * 0.36, x1 = W * 0.985, sp = (x1 - x0) / n;
    const bw = Math.max(26, Math.min(60 * sc, sp * 0.6)), bh = Math.min(bw * 0.8, 44 * sc);
    for (let i = 0; i < n; i++) {
      const cx = x0 + sp * (i + 0.5);
      const pw = sp * 0.92;
      const lab = fitLabel(item.options[i], pw - 10);
      const ph = Math.max(24 * sc, lab.lines.length * lab.size * 1.15 + 10);
      const hN = 2 + i; // сходинки: ближча до рогатки — нижча
      const topRoom = ground - 70 * sc - ph - 10;
      const cnt = Math.max(1, Math.min(hN, Math.floor(topRoom / bh) - (n - 1 - i)));
      const blocks = [];
      let y = ground;
      for (let k = 0; k < cnt; k++) {
        y -= bh;
        const twin = k === 0 && bw * 2.1 < pw; // нижній ряд — дві «ніжки»
        if (twin) {
          blocks.push({ x: cx - bw * 1.05, y, w: bw, h: bh, mat: MATS[(i + k) % 3], vx: 0, vy: 0, a: 0, va: 0, kind: 'b' });
          blocks.push({ x: cx + bw * 0.05, y, w: bw, h: bh, mat: MATS[(i + k) % 3], vx: 0, vy: 0, a: 0, va: 0, kind: 'b' });
        } else blocks.push({ x: cx - bw / 2, y, w: bw, h: bh, mat: MATS[(i + k + 1) % 3], vx: 0, vy: 0, a: 0, va: 0, kind: 'b' });
      }
      y -= ph;
      blocks.push({ x: cx - pw / 2, y, w: pw, h: ph, mat: 'sign', vx: 0, vy: 0, a: 0, va: 0, kind: 's' });
      const br = Math.max(13, Math.min(23 * sc, sp * 0.27));
      const blob = { x: cx, y: y - br * 0.85, r: br, col: BLOB_COLS[i % BLOB_COLS.length], ph: i * 1.9, flee: 0, vx: 0, vy: 0, by: y - br * 0.85 };
      towers.push({ x0: cx - pw / 2, x1: cx + pw / 2, cx, base: ground, blocks, blob, opt: item.options[i], correct: item.options[i] === item.answer, down: false, wob: 0, flash: 0, ok: 0, lab });
      if (prev && prev[i]) { collapse(i, 0, true); towers[i].ok = prev[i] & 2 ? 1 : 0; }
    }
  }

  function resetProj() {
    proj.on = false; proj.hit = -1; proj.rest = 0; proj.done = false; proj.out = 0;
    proj.x = ax; proj.y = ay; proj.vx = proj.vy = 0; trN = 0; proj.target = -1; pull.on = false;
  }

  function burst(x, y, n, cols) {
    if (reduced()) return;
    if (lite()) n = Math.min(n, 6);
    for (let i = 0, k = 0; i < PN && k < n; i++) {
      const p = parts[i]; if (p.life > 0) continue;
      const a = Math.random() * 6.283, v = (60 + Math.random() * 220) * sc;
      p.x = x; p.y = y; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v - 80 * sc; p.life = 0.5 + Math.random() * 0.5;
      p.col = cols[k % cols.length]; p.r = (1.5 + Math.random() * 2.5) * sc; k++;
    }
  }

  function collapse(ti, vx, instant) {
    const t = towers[ti]; t.down = true;
    for (const b of t.blocks) {
      b.vx = vx * 0.35 + (Math.random() - 0.3) * 160 * sc; b.vy = -(60 + Math.random() * 240) * sc;
      b.va = (Math.random() - 0.5) * 7;
      if (instant) { b.y = ground - b.h; b.vx = b.vy = b.va = 0; b.a = (Math.random() - 0.5) * 0.6; }
    }
    t.blob.flee = instant ? 9 : 0.001; t.blob.vx = 170 * sc; t.blob.vy = -260 * sc;
  }

  // ---------- фізика ----------
  function step(dt) {
    time += dt;
    if (pull.on) {
      pull.t += dt;
      const f = Math.min(1, pull.t / 0.25), e = 1 - (1 - f) * (1 - f) * (1 - f);
      proj.x = ax - pull.dx * e; proj.y = ay - pull.dy * e;
      if (f >= 1) fireAt(pull.ti);
    }
    if (proj.on) {
      proj.vy += grav * dt; proj.x += proj.vx * dt; proj.y += proj.vy * dt;
      if (proj.hit < 0) {
        const hitR = fr + 7 * sc; // щедрий хітбокс
        for (let ti = 0; ti < towers.length; ti++) {
          const t = towers[ti]; if (t.down || (proj.target >= 0 && ti !== proj.target)) continue;
          for (const b of t.blocks) {
            const nx = Math.max(b.x, Math.min(proj.x, b.x + b.w)), ny = Math.max(b.y, Math.min(proj.y, b.y + b.h));
            const dx = proj.x - nx, dy = proj.y - ny;
            if (dx * dx + dy * dy <= hitR * hitR) { onHit(ti); ti = towers.length; break; }
          }
          // клякса теж ціль
          if (proj.hit < 0 && !t.down) {
            const dx = proj.x - t.blob.x, dy = proj.y - t.blob.y, rr = hitR + t.blob.r;
            if (dx * dx + dy * dy <= rr * rr) onHit(ti);
          }
        }
      }
      if (proj.y + fr > ground) {
        proj.y = ground - fr; proj.vy *= -0.35; proj.vx *= 0.72;
        if (Math.abs(proj.vy) < 40 * sc) { proj.vy = 0; proj.rest += dt; }
      }
      if (proj.x > W + 60 || proj.x < -60 || proj.y > H + 60) proj.out = 1;
      if ((proj.rest > 0.45 || proj.out) && !proj.done) { proj.done = true; later(shotEnd, 120); }
    }
    for (const t of towers) {
      if (t.wob > 0) t.wob = Math.max(0, t.wob - dt);
      if (t.flash > 0) t.flash = Math.max(0, t.flash - dt);
      if (!t.down) continue;
      for (const b of t.blocks) {
        if (b.vx === 0 && b.vy === 0 && b.va === 0) continue;
        b.vy += grav * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
        if (b.y + b.h > ground) {
          b.y = ground - b.h; b.vy *= -0.28; b.vx *= 0.6; b.va *= 0.5;
          if (Math.abs(b.vy) < 30 * sc) { b.vy = 0; if (Math.abs(b.vx) < 8) b.vx = 0; if (Math.abs(b.va) < 0.2) b.va = 0; }
        }
      }
      const bl = t.blob;
      if (bl.flee > 0 && bl.flee < 9) {
        bl.flee += dt; bl.vy += grav * 0.9 * dt; bl.x += bl.vx * dt; bl.y += bl.vy * dt;
        if (bl.y + bl.r * 0.8 > ground) { bl.y = ground - bl.r * 0.8; bl.vy = -150 * sc; bl.vx = 230 * sc; }
        if (bl.x > W + 60) bl.flee = 9;
      }
    }
    for (const p of parts) {
      if (p.life <= 0) continue;
      p.life -= dt; p.vy += grav * 0.5 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    }
  }

  function onHit(ti) {
    const t = towers[ti];
    proj.hit = ti;
    if (t.correct) {
      collapse(ti, proj.vx);
      proj.vx *= 0.45; proj.vy *= 0.4;
      t.ok = 1;
      burst(proj.x, proj.y, 26, FIRE);
      sfx('explode'); later(() => sfx('correct'), 180); hap(app, 'medium');
      roundOver = true;
      showTip('ok');
    } else {
      wrongHit = true;
      proj.vx = -Math.abs(proj.vx) * 0.35; proj.vy *= 0.4;
      t.wob = 0.9; t.flash = 1.1;
      burst(proj.x, proj.y, 10, ['#ff8a8a', '#ffd0d0']);
      sfx('hit'); later(() => sfx('wrong'), 120); hap(app, 'heavy');
      showTip('no', t.opt);
    }
  }

  function shotEnd() {
    if (roundOver) return;
    if (proj.hit < 0) showTip('miss');
    resetProj(); mode = 'aim';
    kick();
  }

  // ---------- малювання ----------
  function drawBlock(b) {
    const m = MAT[b.mat];
    if (b.kind === 's') {
      ctx.fillStyle = '#f7e2b8'; ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2.5;
      roundRect(b.x, b.y, b.w, b.h, 7); ctx.fill(); ctx.stroke();
      return;
    }
    ctx.fillStyle = m.f; ctx.strokeStyle = m.s; ctx.lineWidth = 2;
    roundRect(b.x, b.y, b.w, b.h, 4); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = m.hi; ctx.lineWidth = 2; ctx.beginPath();
    if (b.mat === 'wood') { ctx.moveTo(b.x + 4, b.y + b.h * 0.35); ctx.lineTo(b.x + b.w - 4, b.y + b.h * 0.35); ctx.moveTo(b.x + 6, b.y + b.h * 0.68); ctx.lineTo(b.x + b.w * 0.6, b.y + b.h * 0.68); }
    else if (b.mat === 'glass') { ctx.moveTo(b.x + 5, b.y + b.h - 6); ctx.lineTo(b.x + b.w * 0.5, b.y + 5); }
    else { ctx.arc(b.x + b.w * 0.3, b.y + b.h * 0.35, 2, 0, 7); ctx.moveTo(b.x + b.w * 0.72, b.y + b.h * 0.62); ctx.arc(b.x + b.w * 0.7, b.y + b.h * 0.62, 2, 0, 7); }
    ctx.stroke();
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function drawLabel(t, b) {
    ctx.fillStyle = t.flash > 0 && ((t.flash * 8) | 0) % 2 ? '#d2343f' : (t.ok || (roundOver && t.correct) ? '#1f8a3a' : '#3a2433');
    ctx.font = `800 ${t.lab.size}px Inter, Poppins, system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const n = t.lab.lines.length, lh = t.lab.size * 1.15, cy = b.y + b.h / 2 - (n - 1) * lh / 2;
    for (let i = 0; i < n; i++) ctx.fillText(t.lab.lines[i], b.x + b.w / 2, cy + i * lh);
  }
  function drawBlob(bl, fleeing) {
    const wob = reduced() ? 0 : 1, r = bl.r, x = bl.x, y = bl.y + (fleeing ? 0 : Math.sin(time * 2.4 + bl.ph) * 1.5 * wob);
    ctx.fillStyle = bl.col; ctx.strokeStyle = '#2b1a33'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k <= 12; k++) {
      const a = (k / 12) * 6.2832, rr = r * (1 + 0.1 * wob * Math.sin(time * 3 + k * 1.7 + bl.ph)) * (k % 2 ? 0.94 : 1.04);
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.86;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // крапля-чубчик
    ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.95, r * 0.22, 0, 7); ctx.fill(); ctx.stroke();
    // очі — дивляться на світлячка
    const lx = proj.x - x, ly = proj.y - y, ll = Math.hypot(lx, ly) || 1, ox = (lx / ll) * r * 0.08, oy = (ly / ll) * r * 0.08;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - r * 0.33, y - r * 0.15, r * 0.24, 0, 7); ctx.arc(x + r * 0.3, y - r * 0.2, r * 0.3, 0, 7); ctx.fill();
    ctx.fillStyle = '#2b1a33';
    ctx.beginPath(); ctx.arc(x - r * 0.33 + ox, y - r * 0.15 + oy, r * 0.11, 0, 7); ctx.arc(x + r * 0.3 + ox, y - r * 0.2 + oy, r * 0.13, 0, 7); ctx.fill();
    // пустотлива усмішка з язиком (або «О!» при втечі)
    ctx.beginPath();
    if (fleeing) { ctx.arc(x, y + r * 0.35, r * 0.17, 0, 7); ctx.fill(); }
    else {
      ctx.lineWidth = 2; ctx.arc(x, y + r * 0.2, r * 0.38, 0.25, Math.PI - 0.6); ctx.stroke();
      ctx.fillStyle = '#ff7aa8'; ctx.beginPath(); ctx.ellipse(x + r * 0.12, y + r * 0.56, r * 0.12, r * 0.15, 0, 0, 7); ctx.fill();
    }
  }

  function draw() {
    if (!W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // земля
    if (bg) ctx.drawImage(bg, 0, 0, W, H);
    // вежі
    for (const t of towers) {
      ctx.save();
      if (!t.down && t.wob > 0) {
        const a = Math.sin(t.wob * 22) * 0.06 * t.wob;
        ctx.translate(t.cx, t.base); ctx.rotate(a); ctx.translate(-t.cx, -t.base);
      }
      for (const b of t.blocks) {
        if (t.down && b.a) { ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.rotate(b.a); ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2)); drawBlock(b); if (b.kind === 's') drawLabel(t, b); ctx.restore(); }
        else { drawBlock(b); if (b.kind === 's') drawLabel(t, b); }
      }
      if (!t.down || t.blob.flee < 9) drawBlob(t.blob, t.down);
      ctx.restore();
    }
    // рогатка (задня гумка → світлячок → передня гумка)
    const fx = ax - 14 * sc, bx = ax + 14 * sc, top = ay - 4 * sc;
    const loaded = !proj.on && mode === 'aim';
    ctx.lineCap = 'round';
    if (loaded) { ctx.strokeStyle = '#5a2f14'; ctx.lineWidth = 5 * sc; ctx.beginPath(); ctx.moveTo(bx, top); ctx.lineTo(proj.x, proj.y); ctx.stroke(); }
    ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 9 * sc;
    ctx.beginPath(); ctx.moveTo(ax, ground); ctx.lineTo(ax, ay + 34 * sc); ctx.lineTo(bx, top); ctx.moveTo(ax, ay + 34 * sc); ctx.lineTo(fx, top); ctx.stroke();
    // пунктир траєкторії
    if (drag && (pullX * pullX + pullY * pullY) > 144) {
      let x = proj.x, y = proj.y, vx = pullX * kVel, vy = pullY * kVel;
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      for (let i = 1; i <= 16; i++) {
        const d = 0.055; vy += grav * d; x += vx * d; y += vy * d;
        if (y > ground) break;
        ctx.globalAlpha = 1 - i / 18; ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, 3.6 * sc - i * 0.12), 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // слід
    for (let i = 0; i < trN; i++) {
      const k = (trI - 1 - i + TRL) % TRL;
      ctx.globalAlpha = 0.5 * (1 - i / TRL); ctx.fillStyle = '#ffe680';
      ctx.beginPath(); ctx.arc(trail[k * 2], trail[k * 2 + 1], Math.max(1, fr * 0.4 * (1 - i / TRL)), 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // світлячок
    if (fly && (loaded || proj.on) && !(proj.done && proj.out)) {
      const a = proj.on ? Math.atan2(proj.vy, proj.vx) * 0.25 : 0;
      ctx.save(); ctx.translate(proj.x, proj.y); ctx.rotate(a);
      if (proj.done) ctx.globalAlpha = 0.5;
      ctx.drawImage(fly.c, -fly.S / 2, -fly.S / 2, fly.S, fly.S); ctx.restore(); ctx.globalAlpha = 1;
    }
    if (loaded) { ctx.strokeStyle = '#5a2f14'; ctx.lineWidth = 5 * sc; ctx.beginPath(); ctx.moveTo(fx, top); ctx.lineTo(proj.x, proj.y); ctx.stroke(); }
    // частинки
    for (const p of parts) {
      if (p.life <= 0) continue;
      ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- цикл: працює лише коли щось рухається ----------
  let raf = 0, last = 0, tAcc = 0;
  const busy = () => {
    if (drag || proj.on || pull.on) return true;
    for (const p of parts) if (p.life > 0) return true;
    for (const t of towers) {
      if (t.wob > 0 || t.flash > 0) return true;
      if (t.down) { if (t.blob.flee > 0 && t.blob.flee < 9) return true; for (const b of t.blocks) if (b.vx || b.vy || b.va) return true; }
    }
    return !lite() && !reduced() && towers.length > 0; // ледь-ледь дихають клякси
  };
  function frame(ts) {
    raf = 0;
    if (!alive || document.hidden) return;
    let dt = last ? (ts - last) / 1000 : 0.016; last = ts;
    if (dt > 0.05) dt = 0.05;
    tAcc += dt;
    while (tAcc >= 1 / 120) { step(1 / 120); tAcc -= 1 / 120; }
    if (proj.on && !proj.done) { trail[trI * 2] = proj.x; trail[trI * 2 + 1] = proj.y; trI = (trI + 1) % TRL; if (trN < TRL) trN++; }
    else if (trN > 0) trN--;
    draw();
    if (busy()) raf = requestAnimationFrame(frame); else last = 0;
  }
  function kick() { if (!raf && alive && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
  const onVis = () => { if (!document.hidden) kick(); };
  document.addEventListener('visibilitychange', onVis);

  // ---------- керування рогаткою ----------
  const ptr = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  // ціль — центр таблички вежі; швидкість — під гарну дугу, що точно туди приходить
  function targetOf(ti) { const t = towers[ti]; const b = t.blocks.find((q) => q.kind === 's') || t.blocks[t.blocks.length - 1]; return [b.x + b.w / 2, b.y + b.h / 2]; }
  function aimAt(ti) {
    const [tx, ty] = targetOf(ti);
    const T0 = Math.min(1.0, Math.max(0.6, 0.5 + ((tx - ax) / W) * 0.6));
    const vx = (tx - ax) / T0, vy = (ty - ay - 0.5 * grav * T0 * T0) / T0, l = Math.hypot(vx, vy) || 1;
    let d = Math.min(maxPull, l / kVel);
    pull.dx = (vx / l) * d; pull.dy = (vy / l) * d;
    if (pull.dx > ax - fr - 4) { const k = (ax - fr - 4) / pull.dx; pull.dx *= k; pull.dy *= k; }
    pull.on = true; pull.t = 0; pull.ti = ti; proj.target = ti;
    hideTip(); sfx('tap'); hap(app, 'light'); kick();
  }
  function fireAt(ti) {
    pull.on = false;
    const [tx, ty] = targetOf(ti);
    const T0 = Math.min(1.0, Math.max(0.6, 0.5 + ((tx - proj.x) / W) * 0.6));
    proj.vx = (tx - proj.x) / T0; proj.vy = (ty - proj.y - 0.5 * grav * T0 * T0) / T0;
    proj.on = true; proj.hit = -1; proj.target = ti;
    sfx('shoot'); later(() => sfx('whoosh'), 60);
  }
  function towerAt(x, y) {
    const pad = 12 * sc;
    for (let i = 0; i < towers.length; i++) {
      const t = towers[i]; if (t.down) continue;
      if (x >= t.x0 - pad && x <= t.x1 + pad && y >= t.blob.y - t.blob.r - pad * 1.5 && y <= ground + pad) return i;
    }
    return -1;
  }
  function onDown(e) {
    if (mode !== 'aim' || proj.on || pull.on || roundOver) return;
    const [x, y] = ptr(e);
    const ti = towerAt(x, y);
    if (ti >= 0) { aimAt(ti); return; }
    if (Math.hypot(x - ax, y - ay) > Math.max(80, maxPull * 1.1) && x > W * 0.45) return;
    drag = true; hideTip(); try { cv.setPointerCapture(e.pointerId); } catch (er) { /* */ }
    onMove(e); sfx('tap'); kick();
  }
  function onMove(e) {
    if (!drag) return;
    const [x, y] = ptr(e);
    let dx = ax - x, dy = ay - y;
    const l = Math.hypot(dx, dy);
    if (l > maxPull) { dx *= maxPull / l; dy *= maxPull / l; }
    if (dx > ax - fr - 4) dx = ax - fr - 4; // світлячок не ховається за лівий край
    pullX = dx; pullY = dy; proj.x = ax - dx; proj.y = ay - dy;
  }
  function onUp() {
    if (!drag) return;
    drag = false;
    if (pullX * pullX + pullY * pullY < 144) { proj.x = ax; proj.y = ay; kick(); return; }
    proj.vx = pullX * kVel; proj.vy = pullY * kVel; proj.on = true; proj.hit = -1;
    sfx('shoot'); hap(app, 'light'); kick();
  }
  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerup', onUp);
  cv.addEventListener('pointercancel', onUp);

  // ---------- UI ----------
  function renderAmmo() {
    $('.wk-ammo').textContent = '';
  }
  function hideTip() { tip.hidden = true; tip.className = 'wk-tip'; }
  function showTip(kind, given) {
    const why = L(item, 'why'), rule = L(ses, 'rule');
    let h = '';
    if (kind === 'ok') h = `<b>${esc(T('mode.weak.ok'))}</b>${why ? `<p>${esc(why)}</p>` : ''}<button class="wk-go" data-a="next">${esc(T('mode.weak.next'))}</button>`;
    else if (kind === 'no') {
      const wn = item.whyNot?.[given] || (isRu() ? item.whyNot_ru?.[given] : null);
      h = `<b>${esc(T('mode.weak.no', { x: given }))}</b><p>${esc(wn || '')}${wn ? ' ' : ''}<span class="wk-rl">${esc(T('mode.weak.rule'))}:</span> ${esc(rule)}</p>`;
    } else if (kind === 'miss') h = `<b>${esc(T('mode.weak.miss', { n: ammo }))}</b>`;
    else h = `<b>${esc(T('mode.weak.reveal', { x: item.answer }))}</b>${why ? `<p>${esc(why)}</p>` : ''}<button class="wk-go" data-a="next">${esc(T('mode.weak.next'))}</button>`;
    tip.innerHTML = h; tip.className = `wk-tip ${kind}`; tip.hidden = false;
    if (kind === 'ok') { try { FX.sparkle?.(tip, { count: lite() ? 4 : 10 }); } catch (e) { /* */ } }
    if (kind === 'miss') later(() => { if (tip.classList.contains('miss')) hideTip(); }, 1400);
  }

  function setHeader() {
    $('.wk-name').textContent = `🔍 ${L(ses, 'title') || T('mode.weak.title')}`;
    const total = phase === 'main' ? queue.length : phase === 'retry' ? queue.length : 1;
    $('.wk-prog').textContent = phase === 'final' ? '' : T('mode.weak.round', { a: qi + 1, b: total });
    const bd = $('.wk-badge');
    bd.textContent = phase === 'final' ? T('mode.weak.final') : phase === 'retry' ? T('mode.weak.retry') : T('mode.weak.tap');
    bd.hidden = false;
    $('.wk-prompt').innerHTML = esc(L(item, 'prompt')).replace(/_{2,}/g, '<u>&nbsp;?&nbsp;</u>');
  }

  function startRound(it) {
    item = normItem(it); if (!item) { nextRound(false); return; }
    ammo = 3; wrongHit = false; roundOver = false; mode = 'aim';
    for (const p of parts) p.life = 0;
    resetProj(); hideTip(); renderAmmo(); setHeader();
    buildTowers(true); draw(); kick();
    try { $('.wk-q').animate([{ transform: 'translateY(-10px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'ease-out' }); } catch (e) { /* */ }
  }

  function nextRound() {
    const ok = !wrongHit && towers.some((t) => t.correct && t.ok);
    noteResult(st, ses.topic, ok);
    if (phase === 'final') res.final = ok; else res[phase].push(ok);
    try { app.save?.(); } catch (e) { /* */ }
    qi++;
    if (qi < queue.length) { startRound(queue[qi]); return; }
    if (phase === 'main') {
      const r = res.main.filter(Boolean).length / Math.max(1, res.main.length);
      if (r < 0.75 && !retried) { retried = true; otherWay(); return; }
    }
    if (phase !== 'final' && ses.finalCheck) { phase = 'final'; queue = [ses.finalCheck]; qi = 0; startRound(queue[0]); return; }
    finish();
  }

  function board(title, body, ex, btn, onGo, img = 'thinking') {
    mode = 'idle';
    const ov = document.createElement('div'); ov.className = 'wk-ov';
    ov.innerHTML = `<div class="wk-board"><div class="wk-lumi"><img alt="" src="${new URL(`../../assets/lumi/${img}.webp`, import.meta.url).href}"><span class="wk-glass">🔍</span></div>
      <div class="wk-chalk"><small>${esc(T('mode.weak.detective'))}</small><h2>${esc(title)}</h2><p class="wk-rule">${esc(body)}</p>
      ${ex ? `<p class="wk-ex"><span>${esc(T('mode.weak.example'))}:</span> ${esc(ex)}</p>` : ''}<p class="wk-how">${esc(T('mode.weak.how'))}</p></div>
      <button class="wk-go big" data-a="go">${esc(btn)}</button></div>`;
    scr.appendChild(ov);
    try { ov.firstElementChild.animate([{ transform: 'translateY(30px) scale(.94)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,1.3,.4,1)' }); } catch (e) { /* */ }
    sfx('open');
    ov.addEventListener('click', (e) => {
      if (e.target.closest('[data-a="go"]')) { sfx('tap'); ov.remove(); onGo(); }
    });
  }

  function otherWay() {
    const ex2 = L(ses, 'example2') || L(ses, 'other') || ses.items.map((x) => L(x, 'why')).filter(Boolean).slice(0, 2).join(' ');
    const missed = queue.filter((_, i) => !res.main[i]);
    const pool = [...missed, ...shuffle(ses.items.filter((x) => !missed.includes(x)))];
    const extra = Array.isArray(ses.extra) ? ses.extra : [];
    const rq = [...extra, ...pool].slice(0, 3);
    while (rq.length < 3 && ses.items.length) rq.push(ses.items[rq.length % ses.items.length]);
    board(T('mode.weak.other'), L(ses, 'rule'), `${ex2} ${T('mode.weak.other2')}`.trim(), T('mode.weak.got'), () => {
      phase = 'retry'; queue = rq; qi = 0; startRound(queue[0]);
    }, 'excited');
  }

  function start() {
    ses = getSession(st, wid, 7);
    queue = ses.items.slice(0, 8); qi = 0; phase = 'main'; retried = false;
    res.main = []; res.retry = []; res.final = null;
    item = normItem(queue[0]); towers.length = 0; setHeader(); renderAmmo(); draw();
    board(L(ses, 'title') || T('mode.weak.title'), L(ses, 'rule'), L(ses, 'example'), T('mode.weak.got'), () => startRound(queue[0]));
  }

  function finish() {
    mode = 'idle';
    const all = [...res.main, ...res.retry, ...(res.final == null ? [] : [res.final])];
    const okN = all.filter(Boolean).length, ratio = all.length ? okN / all.length : 0;
    let stars = starsByRatio(ratio);
    if (retried) stars = Math.min(stars, 2);
    const retryOk = res.retry.filter(Boolean).length;
    if (!stars && res.final && retried && retryOk >= 2) stars = 1; // навчився під час повтору
    if (res.final === false) stars = Math.min(stars, 1);
    try { recordGame(st, gameId, stars); app.save?.(); } catch (e) { /* */ }
    const win = stars >= 1;
    sfx(win ? 'win' : 'lose'); hap(app, win ? 'success' : 'warning');
    const ov = document.createElement('div'); ov.className = 'wk-ov';
    ov.innerHTML = `<div class="wk-res"><div class="wk-ico">${win ? '🏆' : '🫧'}</div><h2>${esc(T(win ? 'mode.weak.win' : 'mode.weak.lose'))}</h2>
      <div class="wk-stars"></div><p>${esc(T('mode.weak.acc', { a: okN, b: all.length }))}</p>
      ${res.final == null ? '' : `<p class="wk-fin ${res.final ? 'ok' : 'no'}">${esc(T(res.final ? 'mode.weak.finalok' : 'mode.weak.finalno'))}</p>`}
      <button class="wk-go big" data-a="${win ? 'back' : 'again'}">${esc(T(win ? 'mode.weak.go' : 'mode.weak.again'))}</button>
      <button class="wk-go sec" data-a="${win ? 'again' : 'back'}">${esc(T(win ? 'mode.weak.again' : 'mode.weak.back'))}</button></div>`;
    scr.appendChild(ov);
    try { FX.starsDrop?.(ov.querySelector('.wk-stars'), stars, 3); } catch (e) { /* */ }
    if (stars >= 3) later(() => { try { if (lite()) FX.sparkle?.(ov.firstElementChild, { count: 8 }); else FX.confetti?.(); } catch (e) { /* */ } }, 900);
    ov.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'again') { ov.remove(); start(); } else if (a === 'back') app.back();
    });
  }

  function onClick(e) {
    const a = e.target.closest('.wk-top [data-a], .wk-tip [data-a]')?.dataset.a;
    if (a === 'back') { sfx('back'); app.back(); } else if (a === 'next' && roundOver) { sfx('tap'); hideTip(); nextRound(); }
  }
  scr.addEventListener('click', onClick);

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (alive) layout(); }) : null;
  ro?.observe(field);
  layout();
  start();

  return () => {
    alive = false;
    if (raf) cancelAnimationFrame(raf);
    timers.forEach(clearTimeout); timers.clear();
    ro?.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove);
    cv.removeEventListener('pointerup', onUp); cv.removeEventListener('pointercancel', onUp);
    scr.removeEventListener('click', onClick);
    try { if (typeof unTheme === 'function') unTheme(); } catch (e) { /* */ }
    scr.remove();
  };
}
