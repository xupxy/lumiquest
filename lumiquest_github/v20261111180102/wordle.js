// 🔤 Вгадай слово — англ. слово 4–6 літер зі слів світу, підказка — переклад; 6 спроб,
// екранна QWERTY (і фізична клавіатура), літери фарбуються (на місці / є в слові / немає)
// з flip-анімацією; 3 слова за гру. Зірки — за кількістю спроб.
// Без canvas/rAF: CSS/WAAPI-анімації transform/opacity + відстежувані таймери (cleanup чистить усе).
import * as S from './state.js?v=20261111180051';
import * as FX from './fx.js?v=20261111180051';
import { recordGame, gameStars } from './games.js?v=20261111180051';

// ---------------------------------------------------------------- безпечні мости
let I = {};
try { I = await import('./i18n.js?v=20261111180051'); } catch (e) { /* без i18n — власні словники */ }
let A = {};
import('./audio.js?v=20261111180051').then((m) => { A = m; }).catch(() => { /* без звуку */ });
let TH = {};
try { TH = await import('./theme.js?v=20261111180051'); } catch (e) { /* без теми */ }
let LM = {};
try { LM = await import('./lumi.js?v=20261111180051'); } catch (e) { /* без Лумі */ }

const sfx = (n) => { try { A.sfx?.(n); } catch (e) { /* */ } };
const speak = (txt) => {
  const s = String(txt || '').trim();
  if (!s) return;
  try { if (A.canSpeak && !A.canSpeak()) return; A.speak?.(s, { lang: 'en-US', rate: 0.85 })?.catch?.(() => {}); } catch (e) { /* */ }
};

const P = 'mode.wordle.';
const DICT = {
  uk: {
    title: 'Вгадай слово',
    r1: '🔤 Вгадай англійське слово за перекладом. На кожне слово — {0} спроб.',
    r2: '🟩 — літера на місці, 🟨 — є в слові, але деінде, ⬜ — такої літери немає.',
    r3: '⭐ {0} слова за гру. Що менше спроб — то більше зірок! Вгадай хоча б {1}.',
    keys: '⌨️ Можна друкувати й на клавіатурі: Enter — перевірити, Backspace — стерти',
    start: '▶️ Грати',
    best: ' · рекорд ',
    hello: 'Вгадаєш слово? 🔤',
    word_n: 'Слово {0}/{1}',
    hint: 'Переклад',
    letters_few: '{0} літери',
    letters_many: '{0} літер',
    short: 'Потрібно {0}! ✏️',
    hot: 'Гаряче! 🔥',
    warm: 'Тепліше! 🙂',
    cold: 'Спробуй інші літери 🤔',
    first: 'Підказка: перша літера — «{0}» 💡',
    solved: 'Так! {0} — {1} 🎉',
    genius: 'З першої спроби! Геніально! 🤯',
    tries: 'Спроба {0}/{1}',
    got: 'Вгадано за {0} спр.',
    was: 'Це було слово',
    lumi_fail: 'Нічого, тепер ти його знаєш! 💛',
    next_word: 'Наступне слово ▶',
    to_result: 'Результат 🏁',
    pause: 'Пауза',
    resume: '▶️ Продовжити',
    restart: '🔄 Почати заново',
    exit: '🚪 Вийти',
    back: 'Назад',
    win: 'ПЕРЕМОГА!',
    lose: 'ОЙ-ОЙ…',
    perfect: 'Ти справжній знавець слів! 🏆',
    good: 'Слова вгадано! 🎉',
    out: 'Вгадано замало слів. Спробуй ще! 💪',
    s_solved: '✅ Вгадано',
    s_tries: '🔤 Спроб усього',
    s_best: '⚡ Найшвидше',
    s_letters: '🟩 Влучних літер',
    again: '🔄 Ще раз',
    next: 'Далі ▶',
    record: '🏆 Новий рекорд!',
    lumi_win: 'Ми команда! 💛',
    lumi_lose: 'Наступного разу вийде! 💪',
    no_words: 'Тут поки замало слів для гри 🌱',
    a_back: 'Назад',
    a_pause: 'Пауза',
    a_enter: 'Перевірити',
    a_del: 'Стерти',
    a_speak: 'Озвучити',
  },
  ru: {
    title: 'Угадай слово',
    r1: '🔤 Угадай английское слово по переводу. На каждое слово — {0} попыток.',
    r2: '🟩 — буква на месте, 🟨 — есть в слове, но в другом месте, ⬜ — такой буквы нет.',
    r3: '⭐ {0} слова за игру. Чем меньше попыток — тем больше звёзд! Угадай хотя бы {1}.',
    keys: '⌨️ Можно печатать и на клавиатуре: Enter — проверить, Backspace — стереть',
    start: '▶️ Играть',
    best: ' · рекорд ',
    hello: 'Угадаешь слово? 🔤',
    word_n: 'Слово {0}/{1}',
    hint: 'Перевод',
    letters_few: '{0} буквы',
    letters_many: '{0} букв',
    short: 'Нужно {0}! ✏️',
    hot: 'Горячо! 🔥',
    warm: 'Теплее! 🙂',
    cold: 'Попробуй другие буквы 🤔',
    first: 'Подсказка: первая буква — «{0}» 💡',
    solved: 'Да! {0} — {1} 🎉',
    genius: 'С первой попытки! Гениально! 🤯',
    tries: 'Попытка {0}/{1}',
    got: 'Угадано за {0} поп.',
    was: 'Это было слово',
    lumi_fail: 'Ничего, теперь ты его знаешь! 💛',
    next_word: 'Следующее слово ▶',
    to_result: 'Результат 🏁',
    pause: 'Пауза',
    resume: '▶️ Продолжить',
    restart: '🔄 Начать заново',
    exit: '🚪 Выйти',
    back: 'Назад',
    win: 'ПОБЕДА!',
    lose: 'ОЙ-ОЙ…',
    perfect: 'Ты настоящий знаток слов! 🏆',
    good: 'Слова угаданы! 🎉',
    out: 'Угадано слишком мало слов. Попробуй ещё! 💪',
    s_solved: '✅ Угадано',
    s_tries: '🔤 Попыток всего',
    s_best: '⚡ Быстрее всего',
    s_letters: '🟩 Точных букв',
    again: '🔄 Ещё раз',
    next: 'Дальше ▶',
    record: '🏆 Новый рекорд!',
    lumi_win: 'Мы команда! 💛',
    lumi_lose: 'В следующий раз получится! 💪',
    no_words: 'Здесь пока мало слов для игры 🌱',
    a_back: 'Назад',
    a_pause: 'Пауза',
    a_enter: 'Проверить',
    a_del: 'Стереть',
    a_speak: 'Озвучить',
  },
};
const pref = (d) => Object.fromEntries(Object.entries(d).map(([k, v]) => [P + k, v]));
try { I.addStrings?.({ uk: pref(DICT.uk), ru: pref(DICT.ru) }); } catch (e) { /* */ }

const lang = () => { try { const l = I.lang?.(); if (l === 'uk' || l === 'ru') return l; } catch (e) { /* */ } return 'uk'; };
const fill = (s, p) => (p ? String(s).replace(/\{(\w+)\}/g, (m, k) => (k in p ? String(p[k]) : m)) : String(s));
function T(k, p) {
  const s = DICT[lang()]?.[k] ?? DICT.uk[k];
  if (s == null) { try { return I.t(P + k, p); } catch (e) { return k; } }
  return fill(s, p);
}
const tcw = (w, f) => { try { if (I.tc) return I.tc(w, f) || ''; } catch (e) { /* */ } return (lang() === 'ru' && w?.[f + '_ru']) || w?.[f] || ''; };
const lettersLabel = (n) => T(n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'letters_few' : 'letters_many', { 0: n });

// ---------------------------------------------------------------- константи
export const meta = { topbar: false };
/** Для тестів: фаза, поточне слово, кількість живих таймерів. */
export const _debug = { phase: '', answer: '', timers: 0, words: [] };

const WORDS_PER_GAME = 3;
const TRIES = 6;
const NEED_SOLVED = 2;
const PTS = [0, 3, 3, 3, 2, 1.5, 1];           // очки за слово, вгадане з k-ї спроби
const XP_PER_WORD = 10;
const FLIP_STEP = 260, FLIP_MS = 520;
const ROWS_KB = ['qwertyuiop', 'asdfghjkl', '⏎zxcvbnm⌫'];
const RANK = { absent: 1, present: 2, correct: 3 };

// ---------------------------------------------------------------- дрібниці
function ensureCss(root) {
  const hrefs = [['gamesCss', './games.css'], ['games3Css', './games3.css']];
  let pending = 0;
  const show = () => { if (--pending <= 0) root.style.visibility = ''; };
  for (const [key, rel] of hrefs) {
    let l = document.querySelector(`link[data-${key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}]`);
    if (!l) {
      l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = new URL(rel, import.meta.url).href; l.dataset[key] = '1';
      l.addEventListener('load', () => { l.dataset.ready = '1'; }, { once: true });
      document.head.append(l);
    }
    if (!l.dataset.ready && !l.sheet) {
      pending++;
      l.addEventListener('load', show, { once: true });
      l.addEventListener('error', show, { once: true });
    }
  }
  if (pending) { root.style.visibility = 'hidden'; setTimeout(() => { root.style.visibility = ''; }, 1500); }
}
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
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
    if (kind === 'success' || kind === 'error' || kind === 'warning') t.notify?.(kind);
    else t.tap?.(kind);
  } catch (e) { /* */ }
}
function makeLumi(app, box, size, emotion, bubble = 'top') {
  try { if (typeof app?.makeLumi === 'function') return app.makeLumi(box, { size, emotion, bubble, global: false }); } catch (e) { /* */ }
  try { if (LM.createLumi) return LM.createLumi(box, { size, emotion, bubble }); } catch (e) { /* */ }
  return null;
}
const anim = (node, frames, opts) => { try { if (!reduced() && node?.animate) return node.animate(frames, opts); } catch (e) { /* */ } return null; };
const cleanNative = (w) => String(w).replace(/\s*\(([^)]*)\)/, ' <small>($1)</small>');
function isDark(wid) {
  try {
    const h = String(TH.themeOf?.(wid)?.bg1 || '').replace('#', '');
    if (h.length < 6) return wid !== 'w1';
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return 0.299 * r + 0.587 * g + 0.114 * b < 140;
  } catch (e) { return wid !== 'w1'; }
}
function wordsOf(app, wid) {
  let w = [];
  try { w = I.tw?.(wid) || []; } catch (e) { /* */ }
  if (!Array.isArray(w) || !w.length) {
    const c = app?.content;
    w = (lang() === 'ru' && c?.WORDS_RU?.[wid]?.length ? c.WORDS_RU[wid] : c?.WORDS?.[wid]) || [];
  }
  return w.filter((p) => Array.isArray(p) && p[0] && p[1]).map((p) => [String(p[0]), String(p[1]).trim()]);
}
const okWord = (en) => /^[a-z]{4,6}$/i.test(en);
/** Слова 4–6 латинських літер зі світу; якщо їх < 3 — докладаємо з інших відкритих світів. */
function buildPool(app, wid) {
  const seen = new Set();
  const take = (w) => wordsOf(app, w).filter(([, en]) => okWord(en)).filter(([, en]) => {
    const k = en.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true;
  }).map(([n, en]) => ({ n, en: en.toLowerCase(), wid: w }));
  let pool = take(wid);
  if (pool.length < WORDS_PER_GAME) {
    for (const o of (app?.state?.unlocked || []).filter((x) => x !== wid)) {
      pool = pool.concat(take(o));
      if (pool.length >= WORDS_PER_GAME + 3) break;
    }
  }
  return pool;
}
/** Фарбування спроби з урахуванням повторів літер. */
function score(guess, ans) {
  const res = Array(ans.length).fill('absent');
  const left = {};
  for (let i = 0; i < ans.length; i++) {
    if (guess[i] === ans[i]) res[i] = 'correct';
    else left[ans[i]] = (left[ans[i]] || 0) + 1;
  }
  for (let i = 0; i < ans.length; i++) {
    if (res[i] === 'correct') continue;
    if (left[guess[i]] > 0) { res[i] = 'present'; left[guess[i]]--; }
  }
  return res;
}

// ---------------------------------------------------------------- екран
export function render(root, params, app) {
  ensureCss(root);
  root.classList.add('g-host');
  const inTg = !!app?.tg?.isTelegram;
  const st = app.state;
  const wid = params?.wid || 'w1';
  const world = (app.content?.WORLDS || []).find((w) => w.id === wid) || {};
  const gameId = `${wid}-wordle`;
  let alive = true;
  let dirty = false;
  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => { timers.delete(id); _debug.timers = timers.size; if (alive) fn(); }, ms);
    timers.add(id); _debug.timers = timers.size;
    return id;
  };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); _debug.timers = 0; };

  const scr = el('div', 'g-screen m3-screen wr-screen');
  root.append(scr);
  let unTheme = () => {};
  try { unTheme = TH.applyWorldTheme?.(scr, wid, { decor: true, particles: true }) || unTheme; } catch (e) { /* */ }
  if (isDark(wid)) scr.classList.add('m3-dark');

  const pool = buildPool(app, wid);
  if (pool.length < WORDS_PER_GAME) {
    scr.innerHTML += `<div class="g-locked m3-locked"><div class="g-locked-ico">🔤</div><p>${T('no_words')}</p>
      <button class="g-btn" data-a="back">${T('back')}</button></div>`;
    scr.querySelector('[data-a=back]').onclick = () => app.back();
    return () => { alive = false; unTheme(); };
  }

  const ui = el('div', 'm3-ui');
  ui.innerHTML = `
    <div class="m3-hud">
      <button class="m3-ibtn m3-back" aria-label="${T('a_back')}"${inTg ? ' hidden' : ''}>‹</button>
      <div class="m3-chip wr-wordn">🔤 <b></b></div>
      <div class="wr-dots" aria-hidden="true">${'<i></i>'.repeat(WORDS_PER_GAME)}</div>
      <button class="m3-ibtn m3-pause" aria-label="${T('a_pause')}">⏸</button>
    </div>
    <div class="wr-hintrow">
      <div class="wr-lumi"></div>
      <div class="wr-hint">
        <div class="wr-hlabel">${T('hint')} · <span class="wr-len"></span></div>
        <div class="wr-htext"></div>
        <div class="wr-tries"></div>
      </div>
    </div>
    <div class="wr-boardwrap"><div class="wr-board" role="grid"></div></div>
    <div class="wr-bottom">
      <div class="wr-kb">${ROWS_KB.map((r) => `<div class="wr-kbrow">${[...r].map((ch) => {
        if (ch === '⏎') return `<button type="button" class="wr-key wr-wide wr-enter" data-k="enter" aria-label="${T('a_enter')}">⏎</button>`;
        if (ch === '⌫') return `<button type="button" class="wr-key wr-wide wr-del" data-k="back" aria-label="${T('a_del')}">⌫</button>`;
        return `<button type="button" class="wr-key" data-k="${ch}">${ch}</button>`;
      }).join('')}</div>`).join('')}</div>
      <div class="wr-panel" hidden></div>
    </div>`;
  scr.append(ui);
  const $ = (q) => scr.querySelector(q);
  const board = $('.wr-board');
  const wrap = $('.wr-boardwrap');
  const kb = $('.wr-kb');
  const panel = $('.wr-panel');
  const keyEls = Object.fromEntries([...scr.querySelectorAll('.wr-key')].map((b) => [b.dataset.k, b]));
  const hud = { wordn: $('.wr-wordn b'), dots: [...scr.querySelectorAll('.wr-dots i')], len: $('.wr-len'), htext: $('.wr-htext'), tries: $('.wr-tries'), hint: $('.wr-hint') };
  $('.m3-back').onclick = () => { hap(app); app.back(); };
  $('.m3-pause').onclick = () => { hap(app); pause(); };

  const lumi = makeLumi(app, $('.wr-lumi'), 64, 'happy', 'right');
  const lumiSay = (txt, emo, react) => { if (!lumi || !alive) return; try { if (emo) lumi.set(emo); if (react) lumi.react(react); if (txt) lumi.say(txt); } catch (e) { /* */ } };
  let overLumis = [];

  // ------------------------------------------------ стан
  let g = null;
  let phase = 'intro';     // intro | play | reveal | done | over
  let overlay = null;
  let paused = false;
  let tiles = [];          // [row][col] -> el
  let ro = null;

  function newGame() {
    const words = shuffle(pool.filter((p) => p.wid === wid));
    const extra = shuffle(pool.filter((p) => p.wid !== wid));
    const list = words.concat(extra).slice(0, WORDS_PER_GAME);
    g = { list, idx: -1, results: [], xp: 0, greens: 0 };
    _debug.words = list.map((w) => w.en);
  }

  function setupWord() {
    g.idx++;
    const w = g.list[g.idx];
    g.cur = { w, row: 0, guess: '', keys: {}, hinted: false };
    _debug.answer = w.en;
    const n = w.en.length;
    board.style.setProperty('--n', n);
    board.innerHTML = '';
    tiles = [];
    for (let r = 0; r < TRIES; r++) {
      const row = el('div', 'wr-row');
      row.setAttribute('role', 'row');
      const rowTiles = [];
      for (let c = 0; c < n; c++) {
        const t = el('div', 'wr-tile', '<span class="wr-in"><span class="wr-l"></span></span>');
        t.style.setProperty('--i', c);
        row.append(t); rowTiles.push(t);
      }
      board.append(row);
      tiles.push(rowTiles);
    }
    for (const k in keyEls) keyEls[k].classList.remove('correct', 'present', 'absent');
    hud.wordn.textContent = T('word_n', { 0: g.idx + 1, 1: WORDS_PER_GAME });
    hud.dots.forEach((d, i) => { d.className = i < g.results.length ? (g.results[i].solved ? 'ok' : 'bad') : i === g.idx ? 'cur' : ''; });
    hud.len.textContent = lettersLabel(n);
    hud.htext.innerHTML = cleanNative(esc(w.n));
    hud.hint.classList.remove('wr-hint-in'); void hud.hint.offsetWidth; hud.hint.classList.add('wr-hint-in');
    paintTries();
    panel.hidden = true; kb.hidden = false;
    fitTiles();
    board.classList.remove('wr-in-anim'); void board.offsetWidth; board.classList.add('wr-in-anim');
    phase = 'play'; _debug.phase = 'play';
    sfx('whoosh');
  }
  function paintTries() { hud.tries.innerHTML = Array.from({ length: TRIES }, (_, i) => `<i class="${i < g.cur.row ? 'used' : ''}"></i>`).join(''); }

  function fitTiles() {
    const n = g?.cur?.w?.en.length || 5;
    const gap = 6;
    const W = wrap.clientWidth - 16, H = wrap.clientHeight - 6;
    if (W <= 0 || H <= 0) return;
    const ts = Math.floor(Math.max(30, Math.min(64, (W - (n - 1) * gap) / n, (H - (TRIES - 1) * gap) / TRIES)));
    board.style.setProperty('--ts', ts + 'px');
  }
  try { ro = new ResizeObserver(() => fitTiles()); ro.observe(wrap); } catch (e) { /* */ }

  // ------------------------------------------------ введення
  function press(k) {
    if (!alive || paused || overlay || !g?.cur) return;
    if (phase === 'done') { if (k === 'enter') panel.querySelector('[data-a=next]')?.click(); return; }
    if (phase !== 'play') return;
    const cur = g.cur;
    const n = cur.w.en.length;
    const row = tiles[cur.row];
    if (k === 'back') {
      if (!cur.guess.length) return;
      sfx('type');
      cur.guess = cur.guess.slice(0, -1);
      const t = row[cur.guess.length];
      t.classList.remove('filled');
      t.querySelector('.wr-l').textContent = '';
      return;
    }
    if (k === 'enter') { submit(); return; }
    if (!/^[a-z]$/.test(k) || cur.guess.length >= n) return;
    sfx('type');
    const t = row[cur.guess.length];
    cur.guess += k;
    t.querySelector('.wr-l').textContent = k;
    t.classList.add('filled');
    anim(t, [{ transform: 'scale(1)' }, { transform: 'scale(1.16) translateY(-4px)' }, { transform: 'scale(1)' }], { duration: 170, easing: 'ease-out' });
  }
  function onKbClick(e) {
    const b = e.target.closest('.wr-key');
    if (!b) return;
    hap(app);
    anim(b, [{ transform: 'scale(.9)' }, { transform: 'scale(1)' }], { duration: 140 });
    press(b.dataset.k);
  }
  kb.addEventListener('click', onKbClick);
  function onKey(e) {
    if (!alive || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape' || (e.key === ' ' && phase === 'play')) {
      if (phase === 'intro' || phase === 'over') return;
      e.preventDefault(); e.stopPropagation();
      if (paused) overlay?.querySelector('[data-a=resume]')?.click(); else pause();
      return;
    }
    if (overlay) { if (e.key === 'Enter') { e.preventDefault(); overlay.querySelector('.g-btn-go')?.click(); } return; }
    let k = null;
    if (e.key === 'Enter') k = 'enter';
    else if (e.key === 'Backspace') k = 'back';
    else if (/^[a-zA-Z]$/.test(e.key)) k = e.key.toLowerCase();
    if (!k) return;
    e.preventDefault();
    const b = keyEls[k];
    if (b) { b.classList.add('down'); later(() => b.classList.remove('down'), 110); }
    press(k);
  }
  document.addEventListener('keydown', onKey, true);

  function shakeRow(r) {
    const rowEl = board.children[r];
    rowEl.classList.remove('wr-shake'); void rowEl.offsetWidth; rowEl.classList.add('wr-shake');
  }

  function submit() {
    const cur = g.cur;
    const n = cur.w.en.length;
    if (cur.guess.length < n) {
      sfx('wrong'); hap(app, 'warning');
      shakeRow(cur.row);
      lumiSay(T('short', { 0: lettersLabel(n) }), 'thinking', 'shake');
      return;
    }
    phase = 'reveal'; _debug.phase = 'reveal';
    const res = score(cur.guess, cur.w.en);
    const row = tiles[cur.row];
    const guess = cur.guess;
    row.forEach((t, i) => {
      later(() => {
        t.classList.add('flip');
        sfx('flip');
        later(() => { t.classList.add(res[i]); t.classList.remove('filled'); }, FLIP_MS / 2);
      }, i * FLIP_STEP);
    });
    later(() => {
      res.forEach((r, i) => {
        const ch = guess[i];
        if ((RANK[r] || 0) > (RANK[cur.keys[ch]] || 0)) {
          cur.keys[ch] = r;
          const b = keyEls[ch];
          if (b) { b.classList.remove('correct', 'present', 'absent'); b.classList.add(r); }
        }
      });
      const greens = res.filter((r) => r === 'correct').length;
      cur.row++;
      cur.guess = '';
      paintTries();
      if (greens === n) { solved(cur.row); return; }
      if (cur.row >= TRIES) { failed(); return; }
      phase = 'play'; _debug.phase = 'play';
      const yell = res.filter((r) => r === 'present').length;
      if (cur.row === 3 && !cur.hinted) {
        cur.hinted = true;
        lumiSay(T('first', { 0: cur.w.en[0].toUpperCase() }), 'cheer', 'nod');
        const t = tiles[cur.row][0];
        t.classList.add('wr-ghost');
        t.querySelector('.wr-l').dataset.ghost = cur.w.en[0];
      } else if (greens >= n - 1) lumiSay(T('hot'), 'excited', 'wow');
      else if (greens + yell >= Math.ceil(n / 2)) lumiSay(T('warm'), 'happy', 'nod');
      else lumiSay(T('cold'), 'thinking', 'tap');
    }, (n - 1) * FLIP_STEP + FLIP_MS + 40);
  }

  function solved(tries) {
    phase = 'done'; _debug.phase = 'done';
    const w = g.cur.w;
    g.results.push({ solved: true, tries });
    g.greens += w.en.length;
    g.xp += XP_PER_WORD;
    try { S.onCorrectAnswer(st); S.addXP(st, XP_PER_WORD); } catch (e) { /* */ }
    dirty = true;
    sfx('correct'); hap(app, 'success');
    const row = tiles[tries - 1];
    row.forEach((t, i) => later(() => { t.classList.add('wr-win'); if (i === 0) sfx('pop'); }, i * 90));
    later(() => sfx('star'), 450);
    later(() => speak(w.en), 350);
    try {
      const r = board.children[tries - 1].getBoundingClientRect();
      later(() => fx('confetti', { x: r.left + r.width / 2, y: r.top + r.height / 2, count: 46, power: 0.75 }), 300);
    } catch (e) { /* */ }
    lumiSay(tries === 1 ? T('genius') : T('solved', { 0: w.en.toUpperCase(), 1: w.n.replace(/\s*\([^)]*\)/, '') }), 'excited', tries <= 2 ? 'spin' : 'love');
    later(() => showPanel(true, tries), 900);
  }
  function failed() {
    phase = 'done'; _debug.phase = 'done';
    const w = g.cur.w;
    g.results.push({ solved: false, tries: TRIES });
    try { S.noteMiss(st, wid, w.en); } catch (e) { /* */ }
    sfx('lose'); hap(app, 'error');
    shakeRow(TRIES - 1);
    lumiSay(T('lumi_fail'), 'sad', 'shake');
    later(() => speak(w.en), 500);
    later(() => showPanel(false, TRIES), 700);
  }
  function showPanel(ok, tries) {
    const w = g.cur.w;
    const last = g.idx + 1 >= WORDS_PER_GAME;
    hud.dots[g.idx].className = ok ? 'ok' : 'bad';
    panel.className = `wr-panel ${ok ? 'ok' : 'bad'}`;
    panel.innerHTML = `
      <div class="wr-pword">${ok ? '' : `<span class="wr-pwas">${T('was')}</span>`}
        <span class="wr-ptiles">${[...w.en].map((ch, i) => `<i style="--i:${i}">${ch}</i>`).join('')}</span>
        <button type="button" class="wr-say" data-a="say" aria-label="${T('a_speak')}">🔊</button></div>
      <div class="wr-pmeta">= ${cleanNative(esc(w.n))}${ok ? ` · ${T('got', { 0: tries })}` : ''}</div>
      <button type="button" class="g-btn g-btn-big g-btn-go" data-a="next">${last ? T('to_result') : T('next_word')}</button>`;
    kb.hidden = true;
    panel.hidden = false;
    panel.querySelector('[data-a=say]').onclick = () => { hap(app); sfx('tap'); speak(w.en); };
    panel.querySelector('[data-a=next]').onclick = () => {
      hap(app, 'medium'); sfx('tap');
      if (last) finish(); else setupWord();
    };
  }

  // ------------------------------------------------ оверлеї
  function closeOverlay() {
    if (!overlay) return;
    const o = overlay; overlay = null;
    overLumis.forEach((l) => { try { l?.destroy?.(); } catch (e) { /* */ } });
    overLumis = [];
    o.classList.add('g-out');
    setTimeout(() => o.remove(), 220);
  }
  function intro() {
    phase = 'intro'; _debug.phase = 'intro';
    const best = gameStars(st, gameId);
    overlay = el('div', 'g-over g-intro m3-over');
    overlay.innerHTML = `<div class="g-card m3-card">
      <div class="g-card-ico m3-ico">🔤</div>
      <h2>${T('title')}</h2>
      <div class="g-sub">${esc(world.emoji || '')} ${esc(tcw(world, 'name'))}${best ? `${T('best')}${'⭐'.repeat(best)}` : ''}</div>
      <div class="wr-demo" aria-hidden="true"><i class="correct">l</i><i class="present">u</i><i class="absent">m</i><i class="correct">i</i></div>
      <div class="g-intro-lumi"></div>
      <ul class="g-rules">
        <li>${T('r1', { 0: TRIES })}</li>
        <li>${T('r2')}</li>
        <li>${T('r3', { 0: WORDS_PER_GAME, 1: NEED_SOLVED })}</li>
      </ul>
      <div class="g-keys">${T('keys')}</div>
      <button class="g-btn g-btn-big g-btn-go" data-a="go">${T('start')}</button>
      ${inTg ? '' : `<button class="g-btn g-btn-ghost" data-a="back">${T('back')}</button>`}
    </div>`;
    scr.append(overlay);
    const l = makeLumi(app, overlay.querySelector('.g-intro-lumi'), 80, 'excited');
    overLumis.push(l);
    later(() => { try { l?.say?.(T('hello')); } catch (e) { /* */ } }, 500);
    const bk = overlay.querySelector('[data-a=back]');
    if (bk) bk.onclick = () => { hap(app); app.back(); };
    overlay.querySelector('[data-a=go]').onclick = () => { hap(app, 'medium'); sfx('go'); closeOverlay(); begin(); };
  }
  function begin() {
    clearTimers();
    paused = false;
    scr.classList.remove('m3-paused');
    newGame();
    setupWord();
    lumiSay('', 'happy', 'jump');
  }
  function pause() {
    if (paused || overlay || phase === 'intro' || phase === 'over' || !alive) return;
    paused = true;
    scr.classList.add('m3-paused');
    overlay = el('div', 'g-over g-pausebox m3-over');
    overlay.innerHTML = `<div class="g-card g-card-sm m3-card">
      <h2>${T('pause')}</h2>
      <div class="g-sub">${T('word_n', { 0: g.idx + 1, 1: WORDS_PER_GAME })} · ${T('tries', { 0: Math.min(TRIES, g.cur.row + 1), 1: TRIES })}</div>
      <button class="g-btn g-btn-big g-btn-go" data-a="resume">${T('resume')}</button>
      <button class="g-btn g-btn-big" data-a="restart">${T('restart')}</button>
      <button class="g-btn g-btn-big g-btn-ghost" data-a="exit">${T('exit')}</button>
    </div>`;
    scr.append(overlay);
    const on = (a, fn) => { overlay.querySelector(`[data-a=${a}]`).onclick = () => { hap(app); sfx('tap'); fn(); }; };
    on('resume', () => { closeOverlay(); paused = false; scr.classList.remove('m3-paused'); });
    on('restart', () => { closeOverlay(); begin(); });
    on('exit', () => app.back());
  }
  function finish() {
    if (!alive || phase === 'over') return;
    phase = 'over'; _debug.phase = 'result';
    const solvedN = g.results.filter((r) => r.solved).length;
    const win = solvedN >= NEED_SOLVED;
    const pts = g.results.reduce((s, r) => s + (r.solved ? PTS[r.tries] : 0), 0);
    const ratio = pts / (WORDS_PER_GAME * 3);
    const stars = win ? (ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1) : 0;
    const triesAll = g.results.reduce((s, r) => s + r.tries, 0);
    const fastest = Math.min(...g.results.filter((r) => r.solved).map((r) => r.tries), Infinity);
    const rec = recordGame(st, gameId, stars);
    try { app.save?.(); } catch (e) { /* */ }
    dirty = false;
    hap(app, win ? 'success' : 'error');
    overlay = el('div', `g-over g-result m3-over ${win ? 'win' : 'lose'}`);
    overlay.innerHTML = `<div class="g-rays" aria-hidden="true"></div><div class="g-card m3-card">
      <div class="g-banner">${win ? T('win') : T('lose')}</div>
      <div class="g-stars"></div>
      <p class="g-sub">${win ? (stars === 3 ? T('perfect') : T('good')) : T('out')}</p>
      ${rec.isRecord ? `<div class="g-record">${T('record')}</div>` : ''}
      <div class="wr-reswords">${g.list.map((w, i) => `<span class="${g.results[i]?.solved ? 'ok' : 'bad'}">${esc(w.en.toUpperCase())}</span>`).join('')}</div>
      <div class="g-stats">
        <div><span>${T('s_solved')}</span><strong><b data-n="${solvedN}">0</b><em>/${WORDS_PER_GAME}</em></strong></div>
        <div><span>${T('s_tries')}</span><strong><b data-n="${triesAll}">0</b></strong></div>
        <div><span>${T('s_best')}</span><strong>${Number.isFinite(fastest) ? `<b data-n="${fastest}">0</b>` : '<b>—</b>'}</strong></div>
        <div><span>${T('s_letters')}</span><strong><b data-n="${g.greens}">0</b></strong></div>
      </div>
      <div class="g-res-row"><div class="g-res-lumi"></div><div class="g-xp">+<b data-n="${g.xp}">0</b> XP</div></div>
      <div class="g-btns">
        <button class="g-btn g-btn-big" data-a="again">${T('again')}</button>
        <button class="g-btn g-btn-big g-btn-go" data-a="next">${T('next')}</button>
      </div>
    </div>`;
    scr.append(overlay);
    const ov = overlay;
    fx('starsDrop', ov.querySelector('.g-stars'), stars);
    sfx(win ? 'win' : 'lose');
    for (let i = 0; i < stars; i++) later(() => sfx('star'), 450 + i * 320);
    ov.querySelectorAll('[data-n]').forEach((b, k) => later(() => fx('countUp', b, 0, +b.dataset.n, 700), 500 + k * 120));
    if (win) { later(() => fx('confetti'), 600); if (stars === 3) later(() => fx('confetti', { x: innerWidth * 0.3 }), 1400); }
    const lr = makeLumi(app, ov.querySelector('.g-res-lumi'), 74, win ? 'proud' : 'sad', 'top');
    overLumis.push(lr);
    later(() => { try { lr?.react?.(win ? 'jump' : 'shake'); lr?.say?.(win ? T('lumi_win') : T('lumi_lose'), { ms: 2200 }); } catch (e) { /* */ } }, 1200);
    lumiSay('', win ? 'proud' : 'sad');
    const on = (a, fn) => { ov.querySelector(`[data-a=${a}]`).onclick = () => { hap(app); sfx('tap'); fn(); }; };
    on('again', () => { closeOverlay(); begin(); });
    on('next', () => app.back());
  }

  function onVis() { if (document.hidden && alive && phase !== 'intro' && phase !== 'over') pause(); }
  document.addEventListener('visibilitychange', onVis);

  intro();

  return () => {
    alive = false;
    clearTimers();
    if (dirty) { dirty = false; try { app.save?.(); } catch (e) { /* */ } }
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('visibilitychange', onVis);
    kb.removeEventListener('click', onKbClick);
    try { ro?.disconnect(); } catch (e) { /* */ }
    overLumis.forEach((l) => { try { l?.destroy?.(); } catch (e) { /* */ } });
    try { lumi?.destroy?.(); } catch (e) { /* */ }
    try { unTheme(); } catch (e) { /* */ }
    _debug.phase = 'gone';
  };
}
