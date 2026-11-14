// ✏️ Кросворд (v23) — 6–8 слів світу WORDS[wid], автоматично розміщених перетинами (сітка ≤ 10×10).
// Підказки — переклад поточною мовою; власна велика екранна клавіатура A–Z, ⌫, «💡 Літера».
// Без таймера (calm не потрібен), ⭐ за точністю/підказками, noteMiss('spelling') за хибні слова.
// DOM + CSS (css/crossword.css, префікс cw-), анімації лише transform/opacity; cleanup чистить усе.
import * as S from './state.js?v=20261114075109';
import * as FX from './fx.js?v=20261114075109';
import { recordGame, starsByRatio } from './games.js?v=20261114075109';

let I = {};
try { I = await import('./i18n.js?v=20261114075109'); } catch (e) { /* без i18n — власні словники */ }
let A = {};
import('./audio.js?v=20261114075109').then((m) => { A = m; }).catch(() => { /* без звуку */ });
let TH = {};
try { TH = await import('./theme.js?v=20261114075109'); } catch (e) { /* без теми */ }

const de = document.documentElement;
const lite = () => de.dataset.perf === 'lite';
const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const sfx = (n) => { try { A.sfx?.(n); } catch (e) { /* */ } };
const speak = (x) => { try { A.speak?.(x); } catch (e) { /* */ } };
const hap = (app, k = 'light') => { try { app.tg?.tap?.(k); } catch (e) { /* */ } };
const anim = (el, kf, o) => { try { if (el && el.animate && !reduced()) return el.animate(kf, o); } catch (e) { /* */ } return null; };
function games3Css() {   // .jx-in / .jx-bob (спільні анімації карток)
  if (document.querySelector('link[data-games3-css]')) return;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.games3Css = '1';
  l.href = new URL('./games3.css?v=20261114075109', import.meta.url).href;
  document.head.append(l);
}

const STR = {
  uk: {
    'mode.cw.title': 'Кросворд', 'mode.cw.r1': '✏️ Тапни клітинку або підказку — підсвітиться слово.',
    'mode.cw.r2': '⌨️ Набирай англійське слово на великій клавіатурі. Правильне — зеленіє!',
    'mode.cw.r3': '💡 Застряг? «Літера» відкриє одну літеру (трохи менше зірок). Часу — скільки завгодно.',
    'mode.cw.start': '▶ Грати', 'mode.cw.back': '‹ Назад', 'mode.cw.across': 'По горизонталі', 'mode.cw.down': 'По вертикалі',
    'mode.cw.hint': '💡 Літера', 'mode.cw.win': 'КРОСВОРД РОЗГАДАНО!', 'mode.cw.again': '🔁 Ще раз', 'mode.cw.next': '➡️ Далі',
    'mode.cw.words': 'Слів: {a}', 'mode.cw.mist': 'Помилок: {a}', 'mode.cw.hints': 'Підказок: {a}',
    'mode.cw.none': 'Для цієї гри ще немає слів.', 'mode.cw.wrong': 'Майже! Спробуй ще раз 🙂', 'mode.cw.letters': '{n} літер',
  },
  ru: {
    'mode.cw.title': 'Кроссворд', 'mode.cw.r1': '✏️ Тапни клетку или подсказку — подсветится слово.',
    'mode.cw.r2': '⌨️ Набирай английское слово на большой клавиатуре. Правильное — зеленеет!',
    'mode.cw.r3': '💡 Застрял? «Буква» откроет одну букву (чуть меньше звёзд). Времени — сколько угодно.',
    'mode.cw.start': '▶ Играть', 'mode.cw.back': '‹ Назад', 'mode.cw.across': 'По горизонтали', 'mode.cw.down': 'По вертикали',
    'mode.cw.hint': '💡 Буква', 'mode.cw.win': 'КРОССВОРД РАЗГАДАН!', 'mode.cw.again': '🔁 Ещё раз', 'mode.cw.next': '➡️ Дальше',
    'mode.cw.words': 'Слов: {a}', 'mode.cw.mist': 'Ошибок: {a}', 'mode.cw.hints': 'Подсказок: {a}',
    'mode.cw.none': 'Для этой игры пока нет слов.', 'mode.cw.wrong': 'Почти! Попробуй ещё раз 🙂', 'mode.cw.letters': 'букв: {n}',
  },
  uk_vy: {
    'mode.cw.r1': '✏️ Тапніть клітинку або підказку — підсвітиться слово.',
    'mode.cw.r2': '⌨️ Набирайте англійське слово на великій клавіатурі. Правильне — зеленіє!',
    'mode.cw.r3': '💡 Не виходить? «Літера» відкриє одну літеру (трохи менше зірок). Часу — скільки завгодно.',
    'mode.cw.wrong': 'Майже! Спробуйте ще раз 🙂',
  },
  ru_vy: {
    'mode.cw.r1': '✏️ Тапните клетку или подсказку — подсветится слово.',
    'mode.cw.r2': '⌨️ Набирайте английское слово на большой клавиатуре. Правильное — зеленеет!',
    'mode.cw.r3': '💡 Не получается? «Буква» откроет одну букву (чуть меньше звёзд). Времени — сколько угодно.',
    'mode.cw.wrong': 'Почти! Попробуйте ещё раз 🙂',
  },
};
try { I.addStrings?.(STR); } catch (e) { /* */ }
const T = (k, v) => {
  let s;
  try { s = I.t?.(k, v); } catch (e) { /* */ }
  if (!s || s === k) { s = (STR[(I.lang?.() === 'ru') ? 'ru' : 'uk'][k]) || k; if (v) for (const [a, b] of Object.entries(v)) s = s.replaceAll(`{${a}}`, b); }
  return s;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [b[i], b[j]] = [b[j], b[i]]; } return b; };

// ─────────────────────────────────────────────────────────── генератор
const MAX = 10, TARGET = 8, MIN_OK = 6;

function pairsOf(app, wid) {
  let list = [];
  try { list = I.tw?.(wid) || []; } catch (e) { /* */ }
  if (!list.length) list = (app.content.WORDS && app.content.WORDS[wid]) || [];
  const seen = new Set(), seenNat = new Set(), out = [];
  for (const p of list) {
    const en = String(p[1] || '').trim().toLowerCase(), nat = String(p[0] || '').trim();
    if (!/^[a-z]{3,8}$/.test(en) || seen.has(en) || seenNat.has(nat.toLowerCase())) continue;   // без дублів
    seen.add(en); seenNat.add(nat.toLowerCase()); out.push({ en, nat });
  }
  return out;
}

/** Одна спроба: жадібне розміщення з перетинами. Повертає [{en,nat,r,c,dir}] або null. */
function tryBuild(cands) {
  const grid = new Map();   // "r,c" → {ch, dirs:Set}
  const placed = [];
  let r0 = 0, r1 = 0, c0 = 0, c1 = 0;
  const get = (r, c) => grid.get(`${r},${c}`);
  const put = (w, r, c, dir) => {
    const [dr, dc] = dir === 'a' ? [0, 1] : [1, 0];
    for (let i = 0; i < w.en.length; i++) {
      const k = `${r + dr * i},${c + dc * i}`;
      const cell = grid.get(k) || { ch: w.en[i], dirs: new Set() };
      cell.dirs.add(dir); grid.set(k, cell);
    }
    r0 = Math.min(r0, r); c0 = Math.min(c0, c);
    r1 = Math.max(r1, r + dr * (w.en.length - 1)); c1 = Math.max(c1, c + dc * (w.en.length - 1));
    placed.push({ ...w, r, c, dir });
  };
  const fits = (en, r, c, dir) => {
    const [dr, dc] = dir === 'a' ? [0, 1] : [1, 0];
    const L = en.length;
    if (get(r - dr, c - dc) || get(r + dr * L, c + dc * L)) return -1;   // кінці слова вільні
    const nr0 = Math.min(r0, r), nc0 = Math.min(c0, c);
    const nr1 = Math.max(r1, r + dr * (L - 1)), nc1 = Math.max(c1, c + dc * (L - 1));
    if (nr1 - nr0 + 1 > MAX || nc1 - nc0 + 1 > MAX) return -1;
    let cross = 0;
    for (let i = 0; i < L; i++) {
      const rr = r + dr * i, cc = c + dc * i, cell = get(rr, cc);
      if (cell) {
        if (cell.ch !== en[i] || cell.dirs.has(dir)) return -1;
        cross += 1;
      } else if (get(rr + dc, cc + dr) || get(rr - dc, cc - dr)) return -1;   // жодних випадкових «доторків»
    }
    return cross;
  };
  const [first, ...rest] = cands;
  put(first, 0, 0, Math.random() < 0.5 ? 'a' : 'd');
  const queue = rest.slice();
  let progress = true;
  while (placed.length < TARGET && progress) {   // кілька проходів: слово, що не влізло зараз, може влізти пізніше
    progress = false;
    for (let qi = 0; qi < queue.length && placed.length < TARGET; qi++) {
      const w = queue[qi];
      let best = [], bestScore = 0;
      for (const [k, cell] of grid) {
        if (cell.dirs.size > 1) continue;
        const [cr, cc] = k.split(',').map(Number);
        const dir = cell.dirs.has('a') ? 'd' : 'a';
        const [dr, dc] = dir === 'a' ? [0, 1] : [1, 0];
        for (let i = 0; i < w.en.length; i++) {
          if (w.en[i] !== cell.ch) continue;
          const r = cr - dr * i, c = cc - dc * i;
          const sc = fits(w.en, r, c, dir);
          if (sc <= 0) continue;
          if (sc > bestScore) { bestScore = sc; best = [[r, c, dir]]; } else if (sc === bestScore) best.push([r, c, dir]);
        }
      }
      if (best.length) {
        const [r, c, dir] = best[(Math.random() * best.length) | 0];
        put(w, r, c, dir); queue.splice(qi, 1); qi -= 1; progress = true;
      }
    }
  }
  // нормалізація до (0,0) + перевірка: кожен ряд/стовпчик літер довжиною ≥ 2 — це саме розміщене слово
  const words = placed.map((p) => ({ ...p, r: p.r - r0, c: p.c - c0 }));
  const rows = r1 - r0 + 1, cols = c1 - c0 + 1;
  const g = Array.from({ length: rows }, () => Array(cols).fill(''));
  for (const w of words) for (let i = 0; i < w.en.length; i++) {
    const r = w.r + (w.dir === 'd' ? i : 0), c = w.c + (w.dir === 'a' ? i : 0);
    if (g[r][c] && g[r][c] !== w.en[i]) return null;
    g[r][c] = w.en[i];
  }
  const runs = new Set();
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (!g[r][c]) continue;
    if (!(c && g[r][c - 1])) { let s = ''; for (let k = c; k < cols && g[r][k]; k++) s += g[r][k]; if (s.length > 1) runs.add(`a${r},${c}:${s}`); }
    if (!(r && g[r - 1][c])) { let s = ''; for (let k = r; k < rows && g[k][c]; k++) s += g[k][c]; if (s.length > 1) runs.add(`d${r},${c}:${s}`); }
  }
  const want = new Set(words.map((w) => `${w.dir}${w.r},${w.c}:${w.en}`));
  if (runs.size !== want.size || [...runs].some((x) => !want.has(x))) return null;
  return { words, rows, cols };
}

/** Надійний генератор: до 120 спроб, найкраща (найбільше слів); фолбек — менше слів (≥ 3). */
export function buildCrossword(pool, tries = 120) {
  let best = null;
  for (let t = 0; t < tries; t++) {
    const pick = shuffle(pool).slice(0, 16);
    // довше слово — першим (більше точок перетину); решта — від довших до коротших з домішкою випадковості
    pick.sort((a, b) => (b.en.length + Math.random() * 2.5) - (a.en.length + Math.random() * 2.5));
    const res = tryBuild(pick);
    if (!res) continue;
    if (!best || res.words.length > best.words.length) best = res;
    if (best.words.length >= TARGET || (t > 60 && best.words.length >= MIN_OK)) break;
  }
  if (!best || best.words.length < 3) return null;
  // нумерація: зліва-направо, згори-вниз; спільний номер для «→» і «↓» з однієї клітинки
  const starts = [...new Set(best.words.map((w) => `${w.r},${w.c}`))]
    .map((k) => k.split(',').map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const num = new Map(starts.map(([r, c], i) => [`${r},${c}`, i + 1]));
  best.words.forEach((w, i) => {
    w.i = i; w.n = num.get(`${w.r},${w.c}`);
    w.cells = Array.from(w.en, (_, k) => `${w.r + (w.dir === 'd' ? k : 0)},${w.c + (w.dir === 'a' ? k : 0)}`);
  });
  best.words.sort((a, b) => (a.dir === b.dir ? a.n - b.n : a.dir === 'a' ? -1 : 1)).forEach((w, i) => { w.i = i; });
  return best;
}

// ─────────────────────────────────────────────────────────── екран
export const meta = { topbar: false };
const KB = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

export function render(root, params, app) {
  const wid = (params && params.wid) || 'w1';
  const st = app.state;
  const gameId = (params && params.id) || `${wid}-crossword`;
  let alive = true;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); };

  const scr = document.createElement('div');
  scr.className = 'cw';
  root.appendChild(scr);
  let unTheme = null;
  try { unTheme = TH.applyWorldTheme?.(scr, wid, { decor: false }) || null; } catch (e) { /* */ }
  games3Css();

  let pool = pairsOf(app, wid);
  if (pool.length < MIN_OK) for (const w of (st.unlocked || [])) if (w !== wid) pool = pool.concat(pairsOf(app, w));
  let g = null;
  const $ = (q) => scr.querySelector(q);

  function overlay(html, onAct) {
    const ov = document.createElement('div'); ov.className = 'cw-ov';
    ov.innerHTML = `<div class="cw-box jx-in">${html}</div>`;
    scr.appendChild(ov);
    ov.querySelector('.cw-ico')?.classList.add('jx-bob');
    ov.addEventListener('click', (e) => { const a = e.target.closest('[data-a]')?.dataset.a; if (a) onAct(a, ov); });
    return ov;
  }

  function intro() {
    overlay(`<div class="cw-ico">✏️</div><h2>${esc(T('mode.cw.title'))}</h2>
      ${pool.length >= 3 ? `<p>${esc(T('mode.cw.r1'))}</p><p>${esc(T('mode.cw.r2'))}</p><p>${esc(T('mode.cw.r3'))}</p>
      <button class="cw-go" data-a="go" data-sfx="open">${esc(T('mode.cw.start'))}</button>` : `<p>${esc(T('mode.cw.none'))}</p>`}
      <button class="cw-go sec" data-a="back" data-sfx="back">${esc(T('mode.cw.back'))}</button>`,
    (a, ov) => { if (a === 'go') { ov.remove(); start(); } else if (a === 'back') app.back(); });
  }

  function start() {
    const cw = buildCrossword(pool);
    if (!cw) { intro(); return; }
    g = { ...cw, cur: 0, pos: 0, val: new Map(), lock: new Set(), solved: new Set(), bad: 0, hints: 0, busy: false, missed: new Set() };
    scr._cw = g;   // для автотестів
    scr.querySelectorAll('.cw-top,.cw-board,.cw-clue,.cw-list,.cw-kb').forEach((n) => n.remove());
    const clueList = (dir) => g.words.filter((w) => w.dir === dir)
      .map((w) => `<li data-w="${w.i}"><b>${w.n}</b><span>${esc(w.nat)}</span><em>${w.en.length}</em></li>`).join('');
    scr.insertAdjacentHTML('beforeend', `
      <div class="cw-top"><button class="cw-btn" data-a="back" data-sfx="back" aria-label="back">‹</button>
        <span class="cw-chip cw-ttl">✏️ ${esc(T('mode.cw.title'))}</span><span class="cw-chip cw-prog"></span></div>
      <div class="cw-board"><div class="cw-grid" style="--cols:${g.cols};--rows:${g.rows}"></div></div>
      <div class="cw-clue"><span class="cw-cn"></span><span class="cw-ct"></span><button class="cw-hint" data-a="hint" data-sfx="none">${esc(T('mode.cw.hint'))}</button></div>
      <div class="cw-list"><h4>→ ${esc(T('mode.cw.across'))}</h4><ol>${clueList('a')}</ol><h4>↓ ${esc(T('mode.cw.down'))}</h4><ol>${clueList('d')}</ol></div>
      <div class="cw-kb">${KB.map((row, i) => `<div class="cw-kr">${[...row].map((ch) => `<button class="cw-k" data-key="${ch}" data-sfx="none">${ch}</button>`).join('')}${i === 2 ? '<button class="cw-k cw-del" data-key="del" data-sfx="none" aria-label="delete">⌫</button>' : ''}</div>`).join('')}</div>`);
    const cells = new Map();
    for (const w of g.words) w.cells.forEach((k, i) => { if (!cells.has(k)) cells.set(k, { ch: w.en[i], n: 0 }); });
    for (const w of g.words) cells.get(w.cells[0]).n = w.n;
    g.cellCh = cells;
    const grid = $('.cw-grid');
    let html = '';
    for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
      const k = `${r},${c}`, cell = cells.get(k);
      html += cell ? `<div class="cw-c" data-k="${k}">${cell.n ? `<i>${cell.n}</i>` : ''}<span></span></div>` : '<div class="cw-x"></div>';
    }
    grid.innerHTML = html;
    grid.querySelectorAll('.cw-c').forEach((el, i) => { el.style.animationDelay = `${Math.min(i * 18, 600)}ms`; });
    sizeGrid();
    select(0, true);
    prog();
  }

  function sizeGrid() {
    const board = $('.cw-board'); if (!board || !g) return;
    const W = board.clientWidth - 8, H = board.clientHeight - 8;
    const cs = Math.max(26, Math.min(48, Math.floor((W - (g.cols - 1) * 3) / g.cols), H > 60 ? Math.floor((H - (g.rows - 1) * 3) / g.rows) : 48));
    $('.cw-grid').style.setProperty('--cs', `${cs}px`);
  }

  const cellEl = (k) => scr.querySelector(`.cw-c[data-k="${k}"]`);
  const word = () => g.words[g.cur];
  function prog() { $('.cw-prog').textContent = `✅ ${g.solved.size}/${g.words.length}`; }

  function paint() {
    const w = word();
    scr.querySelectorAll('.cw-c.on,.cw-c.cur').forEach((n) => n.classList.remove('on', 'cur'));
    w.cells.forEach((k, i) => { const el = cellEl(k); el.classList.add('on'); if (i === g.pos) el.classList.add('cur'); });
    $('.cw-cn').textContent = `${w.n} ${w.dir === 'a' ? '→' : '↓'}`;
    $('.cw-ct').textContent = `${w.nat} · ${T('mode.cw.letters', { n: w.en.length })}`;
    scr.querySelectorAll('.cw-list li').forEach((li) => li.classList.toggle('on', +li.dataset.w === g.cur));
    const li = scr.querySelector(`.cw-list li[data-w="${g.cur}"]`);
    try { li?.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { /* */ }
  }
  function firstFree(w) { const i = w.cells.findIndex((k) => !g.lock.has(k) && !g.val.get(k)); return i >= 0 ? i : Math.max(0, w.cells.findIndex((k) => !g.lock.has(k))); }
  function select(i, fresh) {
    g.cur = i;
    if (fresh) g.pos = firstFree(word());
    paint();
  }
  function nextUnsolved() {
    for (let d = 1; d <= g.words.length; d++) { const j = (g.cur + d) % g.words.length; if (!g.solved.has(j)) return j; }
    return -1;
  }

  function setCell(k, ch) {
    if (ch) g.val.set(k, ch); else g.val.delete(k);
    const sp = cellEl(k)?.querySelector('span');
    if (sp) {
      sp.textContent = ch || '';
      if (ch) anim(sp, [{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'ease-out' });
    }
  }

  function type(ch) {
    if (!g || g.busy) return;
    const w = word();
    if (g.solved.has(w.i)) return;
    let p = g.pos;
    while (p < w.cells.length && g.lock.has(w.cells[p])) p += 1;
    if (p >= w.cells.length) return;
    setCell(w.cells[p], ch);
    sfx('type'); hap(app, 'light');
    p += 1;
    while (p < w.cells.length && g.lock.has(w.cells[p])) p += 1;
    g.pos = Math.min(p, w.cells.length - 1);
    paint();
    if (w.cells.every((k) => g.val.get(k))) check(w, true);
  }
  function del() {
    if (!g || g.busy) return;
    const w = word();
    let p = g.pos;
    const k = w.cells[p];
    if (!(g.val.get(k) && !g.lock.has(k))) {   // поточна порожня/зафіксована → крок назад
      p -= 1;
      while (p >= 0 && g.lock.has(w.cells[p])) p -= 1;
      if (p < 0) return;
    }
    setCell(w.cells[p], '');
    g.pos = p; sfx('tap'); paint();
  }

  /** Перевірка заповненого слова. strict — це активне слово (хибне → помилка). */
  function check(w, strict) {
    const given = w.cells.map((k) => g.val.get(k) || '').join('');
    if (given === w.en) { solve(w); return true; }
    if (!strict) return false;
    g.bad += 1;
    if (!g.missed.has(w.i)) { g.missed.add(w.i); try { S.noteMiss(st, wid, w.en, given, 'spelling'); } catch (e) { /* */ } }
    sfx('wrong'); hap(app, 'error');
    g.busy = true;
    const els = w.cells.map(cellEl);
    els.forEach((el) => el.classList.add('bad'));
    anim($('.cw-grid'), [{ transform: 'none' }, { transform: 'translateX(-7px)', offset: 0.2 }, { transform: 'translateX(7px)', offset: 0.45 }, { transform: 'translateX(-4px)', offset: 0.7 }, { transform: 'none' }], { duration: 400, easing: 'ease-out' });
    try { FX.floatText?.($('.cw-clue'), T('mode.cw.wrong')); } catch (e) { /* */ }
    later(() => {
      els.forEach((el) => el.classList.remove('bad'));
      w.cells.forEach((k, i) => { if (!g.lock.has(k) && g.val.get(k) !== w.en[i]) setCell(k, ''); });   // хибні літери зникають, правильні лишаються
      g.busy = false; g.pos = firstFree(w); paint();
    }, 650);
    return false;
  }

  function solve(w) {
    if (g.solved.has(w.i)) return;
    g.solved.add(w.i);
    w.cells.forEach((k, i) => {
      g.lock.add(k);
      const el = cellEl(k);
      el.classList.add('ok');
      el.style.setProperty('--d', `${i * 60}ms`);
    });
    scr.querySelector(`.cw-list li[data-w="${w.i}"]`)?.classList.add('ok');
    try { S.onCorrectAnswer?.(st); S.addXP?.(st, 5); } catch (e) { /* */ }
    sfx('correct'); hap(app, 'success');
    try { FX.sparkle?.(cellEl(w.cells[w.cells.length >> 1]), { count: lite() ? 3 : 9 }); } catch (e) { /* */ }
    later(() => speak(w.en), 200);
    prog();
    // перехресні слова могли заповнитись повністю — перевіряємо мовчки
    for (const o of g.words) if (!g.solved.has(o.i) && o.cells.every((k) => g.val.get(k))) check(o, false);
    if (g.solved.size >= g.words.length) { g.busy = true; later(finish, 1100); return; }
    if (g.cur === w.i) { const j = nextUnsolved(); if (j >= 0) later(() => { if (!g.busy) select(j, true); }, 380); }
  }

  function hint() {
    if (!g || g.busy) return;
    const w = word();
    if (g.solved.has(w.i)) return;
    let p = w.cells.findIndex((k, i) => !g.lock.has(k) && g.val.get(k) !== w.en[i]);
    if (p < 0) return;
    if (!g.lock.has(w.cells[g.pos]) && g.val.get(w.cells[g.pos]) !== w.en[g.pos]) p = g.pos;
    const k = w.cells[p];
    g.hints += 1;
    setCell(k, w.en[p]); g.lock.add(k);
    const el = cellEl(k); el.classList.add('hinted');
    sfx('sparkle'); hap(app, 'light');
    try { FX.sparkle?.(el, { count: lite() ? 2 : 5 }); } catch (e) { /* */ }
    g.pos = firstFree(w);
    paint();
    if (w.cells.every((x) => g.val.get(x))) check(w, true);
  }

  function finish() {
    const n = g.words.length;
    const stars = Math.max(1, starsByRatio(n / (n + g.bad + g.hints * 0.5)));
    try { recordGame(st, gameId, stars); app.save?.(); } catch (e) { /* */ }
    sfx('win');
    const ov = overlay(`<div class="cw-ico">🏆</div><h2>${esc(T('mode.cw.win'))}</h2><div class="cw-stars"></div>
      <p>${esc(T('mode.cw.words', { a: n }))} · ${esc(T('mode.cw.mist', { a: g.bad }))} · ${esc(T('mode.cw.hints', { a: g.hints }))}</p>
      <button class="cw-go" data-a="back" data-sfx="open">${esc(T('mode.cw.next'))}</button>
      <button class="cw-go sec" data-a="again">${esc(T('mode.cw.again'))}</button>`,
    (a, o) => { if (a === 'again') { o.remove(); start(); } else if (a === 'back') app.back(); });
    const se = ov.querySelector('.cw-stars');
    try { if (FX.starsDrop) FX.starsDrop(se, stars, 3); else se.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars); } catch (e) { se.textContent = '⭐'.repeat(stars); }
    for (let i = 0; i < stars; i++) later(() => sfx('star'), 420 + i * 260);
    if (stars >= 3) later(() => { try { if (lite()) FX.sparkle?.(se, { count: 8 }); else FX.confetti?.(); } catch (e) { /* */ } }, 1100);
  }

  function onClick(e) {
    const t = e.target;
    const key = t.closest('.cw-k');
    if (key) { if (key.dataset.key === 'del') del(); else type(key.dataset.key); return; }
    const c = t.closest('.cw-c');
    if (c && g && !g.busy) {
      const k = c.dataset.k;
      const own = g.words.filter((w) => w.cells.includes(k));
      let w = own.find((x) => x.i === g.cur);
      if (w && own.length > 1 && word().cells[g.pos] === k) w = own.find((x) => x.i !== g.cur);   // повторний тап → інший напрям
      else if (!w) w = own.find((x) => !g.solved.has(x.i)) || own[0];
      g.cur = w.i; g.pos = w.cells.indexOf(k);
      sfx('tap'); paint();
      return;
    }
    const li = t.closest('.cw-list li');
    if (li && g && !g.busy) { select(+li.dataset.w, true); sfx('tap'); return; }
    const a = t.closest('.cw-top [data-a], .cw-clue [data-a]')?.dataset.a;
    if (a === 'back') app.back(); else if (a === 'hint') hint();
  }
  function onKey(e) {   // фізична клавіатура (десктоп) — бонус до екранної
    if (!g || !scr.isConnected || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[a-z]$/i.test(e.key)) { type(e.key.toLowerCase()); e.preventDefault(); } else if (e.key === 'Backspace') { del(); e.preventDefault(); }
  }
  scr.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', sizeGrid);
  intro();

  return () => {
    alive = false;
    timers.forEach(clearTimeout); timers.clear();
    scr.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', sizeGrid);
    try { if (typeof unTheme === 'function') unTheme(); } catch (e) { /* */ }
    scr.remove();
  };
}
