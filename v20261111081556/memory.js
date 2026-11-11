// 🧩 Словесна Пам'ять — сітка 4×3 (6 пар: слово поточною мовою ↔ англ.), 3D-flip карток,
// пара — сяйво + озвучка англ. слова, не пара — тряска й закриття. 2 раунди.
// Зірки — за кількістю помилкових відкриттів; забагато помилок — поразка.
// Без canvas/rAF: лише CSS-анімації transform/opacity + відстежувані таймери (cleanup чистить усе).
import * as S from './state.js?v=20261111081530';
import * as FX from './fx.js?v=20261111081530';
import { recordGame, gameStars } from './games.js?v=20261111081530';

// ---------------------------------------------------------------- безпечні мости
let I = {};
try { I = await import('./i18n.js?v=20261111081530'); } catch (e) { /* без i18n — власні словники */ }
let A = {};
import('./audio.js?v=20261111081530').then((m) => { A = m; }).catch(() => { /* без звуку */ });
let TH = {};
try { TH = await import('./theme.js?v=20261111081530'); } catch (e) { /* без теми */ }
let LM = {};
try { LM = await import('./lumi.js?v=20261111081530'); } catch (e) { /* без Лумі */ }

const sfx = (n) => { try { A.sfx?.(n); } catch (e) { /* */ } };
const speak = (txt) => {
  const s = String(txt || '').trim();
  if (!s) return;
  try { if (A.canSpeak && !A.canSpeak()) return; A.speak?.(s, { lang: 'en-US', rate: 0.9 })?.catch?.(() => {}); } catch (e) { /* */ }
};

const P = 'mode.memory.';
const DICT = {
  uk: {
    title: "Словесна Пам'ять",
    r1: '🃏 Під картками ховаються 6 пар: слово українською ↔ англійською.',
    r2: '👆 Відкривай по дві картки. Знайшов пару — вона засяє, а я вимовлю слово!',
    r3: '⭐ {0} раунди. Що менше помилок — то більше зірок. {1} помилок — і гру програно.',
    keys: '⌨️ Пробіл/Esc — пауза',
    start: '▶️ Грати',
    best: ' · рекорд ',
    hello: "Перевіримо твою пам'ять? 🧩",
    round: 'Раунд {0}/{1}',
    remember: "Запам'ятовуй! 👀",
    go: 'Шукай пари! 🔍',
    match1: 'Так! {0} — {1} ✨',
    match2: 'Пара! 💛',
    match3: "Чудова пам'ять! 🧠",
    miss1: 'Ой, не пара 🙈',
    miss2: "Майже! Запам'ятай, де вони 👀",
    miss3: 'Нічого, ще раз! 💪',
    danger: 'Обережно, помилок уже {0}! 😬',
    combo: 'Комбо ×{0}! 🔥',
    round_done: 'Раунд пройдено! Далі — нові слова 🎉',
    pause: 'Пауза',
    resume: '▶️ Продовжити',
    restart: '🔄 Почати заново',
    exit: '🚪 Вийти',
    back: 'Назад',
    win: 'ПЕРЕМОГА!',
    lose: 'ОЙ-ОЙ…',
    perfect: "Неймовірна пам'ять! 🧠✨",
    good: 'Усі пари знайдено! 🎉',
    out: 'Забагато помилок. Спробуй ще — у тебе вийде! 💪',
    s_pairs: '🧩 Пар',
    s_wrong: '❌ Помилок',
    s_combo: '🔥 Найдовше комбо',
    s_time: '⏱ Час, с',
    again: '🔄 Ще раз',
    next: 'Далі ▶',
    record: '🏆 Новий рекорд!',
    lumi_win: 'Ми команда! 💛',
    lumi_lose: 'Наступного разу вийде! 💪',
    no_words: 'У цьому світі поки замало слів 🌱',
    tag: 'УКР',
    a_back: 'Назад',
    a_pause: 'Пауза',
    a_card: 'Картка {0}',
  },
  ru: {
    title: 'Словесная Память',
    r1: '🃏 Под карточками прячутся 6 пар: слово на русском ↔ на английском.',
    r2: '👆 Открывай по две карточки. Нашёл пару — она засияет, а я произнесу слово!',
    r3: '⭐ {0} раунда. Чем меньше ошибок — тем больше звёзд. {1} ошибок — и игра проиграна.',
    keys: '⌨️ Пробел/Esc — пауза',
    start: '▶️ Играть',
    best: ' · рекорд ',
    hello: 'Проверим твою память? 🧩',
    round: 'Раунд {0}/{1}',
    remember: 'Запоминай! 👀',
    go: 'Ищи пары! 🔍',
    match1: 'Да! {0} — {1} ✨',
    match2: 'Пара! 💛',
    match3: 'Отличная память! 🧠',
    miss1: 'Ой, не пара 🙈',
    miss2: 'Почти! Запомни, где они 👀',
    miss3: 'Ничего, ещё раз! 💪',
    danger: 'Осторожно, ошибок уже {0}! 😬',
    combo: 'Комбо ×{0}! 🔥',
    round_done: 'Раунд пройден! Дальше — новые слова 🎉',
    pause: 'Пауза',
    resume: '▶️ Продолжить',
    restart: '🔄 Начать заново',
    exit: '🚪 Выйти',
    back: 'Назад',
    win: 'ПОБЕДА!',
    lose: 'ОЙ-ОЙ…',
    perfect: 'Невероятная память! 🧠✨',
    good: 'Все пары найдены! 🎉',
    out: 'Слишком много ошибок. Попробуй ещё — у тебя получится! 💪',
    s_pairs: '🧩 Пар',
    s_wrong: '❌ Ошибок',
    s_combo: '🔥 Самое длинное комбо',
    s_time: '⏱ Время, с',
    again: '🔄 Ещё раз',
    next: 'Дальше ▶',
    record: '🏆 Новый рекорд!',
    lumi_win: 'Мы команда! 💛',
    lumi_lose: 'В следующий раз получится! 💪',
    no_words: 'В этом мире пока мало слов 🌱',
    tag: 'РУС',
    a_back: 'Назад',
    a_pause: 'Пауза',
    a_card: 'Карточка {0}',
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

// ---------------------------------------------------------------- константи
export const meta = { topbar: false };
/** Для тестів: фаза, розклад пар, кількість живих таймерів. */
export const _debug = { phase: '', layout: [], timers: 0, mistakes: 0 };

const ROUNDS = 2;
const PAIRS = 6;
const LOSE_AT = 20;                 // помилок → поразка
const STAR_AT = [6, 12, 19];        // ≤6 → 3⭐, ≤12 → 2⭐, ≤19 → 1⭐
const XP_PER_PAIR = 10;
const starsFor = (m) => (m <= STAR_AT[0] ? 3 : m <= STAR_AT[1] ? 2 : m < LOSE_AT ? 1 : 0);

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
/** Слово з дужками: «пішов (Past)» → пішов <small>(Past)</small> */
const wordHtml = (w) => esc(w).replace(/\s*\(([^)]*)\)/, ' <small>($1)</small>');
const sizeCls = (w) => { const n = String(w).replace(/\s*\([^)]*\)/, '').length; return n > 13 ? ' mm-xs' : n > 9 ? ' mm-sm' : ''; };

/** Темний світ (світлий текст на фоні) — за яскравістю bg1 теми. */
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
  return w.filter((p) => Array.isArray(p) && p[0] && p[1]).map((p) => [String(p[0]), String(p[1])]);
}
function buildPool(app, wid) {
  const seen = new Set(); const seenN = new Set();
  const out = [];
  const add = (list) => {
    for (const [n, en] of shuffle(list)) {
      const k = en.toLowerCase(), kn = n.toLowerCase();
      if (seen.has(k) || seenN.has(kn)) continue;
      seen.add(k); seenN.add(kn); out.push([n, en]);
    }
  };
  add(wordsOf(app, wid));
  if (out.length < PAIRS * ROUNDS) {
    const others = (app?.state?.unlocked || []).filter((x) => x !== wid);
    for (const o of others) { if (out.length >= PAIRS * ROUNDS) break; add(wordsOf(app, o)); }
  }
  return out;
}

// ---------------------------------------------------------------- екран
export function render(root, params, app) {
  ensureCss(root);
  root.classList.add('g-host');
  const inTg = !!app?.tg?.isTelegram;
  const st = app.state;
  const wid = params?.wid || 'w1';
  const world = (app.content?.WORLDS || []).find((w) => w.id === wid) || {};
  const gameId = `${wid}-memory`;
  let alive = true;
  let dirty = false;
  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => { timers.delete(id); _debug.timers = timers.size; if (alive) fn(); }, ms);
    timers.add(id); _debug.timers = timers.size;
    return id;
  };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); _debug.timers = 0; };

  const scr = el('div', 'g-screen m3-screen mm-screen');
  root.append(scr);
  let unTheme = () => {};
  try { unTheme = TH.applyWorldTheme?.(scr, wid, { decor: true, particles: true }) || unTheme; } catch (e) { /* */ }
  const dark = isDark(wid);
  if (dark) scr.classList.add('m3-dark');

  const pool = buildPool(app, wid);
  if (pool.length < PAIRS) {
    scr.innerHTML += `<div class="g-locked m3-locked"><div class="g-locked-ico">🧩</div><p>${T('no_words')}</p>
      <button class="g-btn" data-a="back">${T('back')}</button></div>`;
    scr.querySelector('[data-a=back]').onclick = () => app.back();
    return () => { alive = false; unTheme(); };
  }

  const ui = el('div', 'm3-ui');
  ui.innerHTML = `
    <div class="m3-hud">
      <button class="m3-ibtn m3-back" aria-label="${T('a_back')}"${inTg ? ' hidden' : ''}>‹</button>
      <div class="m3-chip mm-round">🧩 <b></b></div>
      <div class="m3-chip mm-miss">❌ <b>0</b></div>
      <div class="m3-chip mm-stars" aria-hidden="true"><i>★</i><i>★</i><i>★</i></div>
      <button class="m3-ibtn m3-pause" aria-label="${T('a_pause')}">⏸</button>
    </div>
    <div class="mm-progress" aria-hidden="true"><div class="mm-pfill"></div></div>
    <div class="mm-board"><div class="mm-grid"></div></div>
    <div class="mm-foot"><div class="mm-lumi"></div><div class="mm-pairs"></div></div>`;
  scr.append(ui);
  const $ = (q) => scr.querySelector(q);
  const grid = $('.mm-grid');
  const hud = { round: $('.mm-round b'), miss: $('.mm-miss b'), missChip: $('.mm-miss'), stars: [...scr.querySelectorAll('.mm-stars i')],
    fill: $('.mm-pfill'), pairs: $('.mm-pairs') };
  $('.m3-back').onclick = () => { hap(app); app.back(); };
  $('.m3-pause').onclick = () => { hap(app); pause(); };

  const lumi = makeLumi(app, $('.mm-lumi'), 76, 'happy', 'right');
  const lumiSay = (txt, emo, react) => { if (!lumi || !alive) return; try { if (emo) lumi.set(emo); if (react) lumi.react(react); if (txt) lumi.say(txt); } catch (e) { /* */ } };
  let overLumis = [];

  // ------------------------------------------------ стан
  let g = null;           // гра
  let phase = 'intro';
  let overlay = null;
  let paused = false;
  let lastTalk = 0;

  function newGame() {
    const p = shuffle(pool);
    const rounds = [];
    for (let r = 0; r < ROUNDS; r++) {
      let part = p.slice(r * PAIRS, r * PAIRS + PAIRS);
      if (part.length < PAIRS) part = part.concat(shuffle(p.filter((x) => !part.includes(x))).slice(0, PAIRS - part.length));
      rounds.push(part);
    }
    g = { rounds, round: 0, mistakes: 0, found: 0, combo: 0, bestCombo: 0, xp: 0, t0: performance.now(), open: [], lock: true, cards: [] };
    _debug.mistakes = 0;
    paintHud();
  }

  function paintHud() {
    if (!g) return;
    hud.round.textContent = T('round', { 0: g.round + 1, 1: ROUNDS });
    hud.miss.textContent = String(g.mistakes);
    const s = Math.max(0, starsFor(g.mistakes));
    hud.stars.forEach((i, k) => i.classList.toggle('off', k >= s));
    hud.missChip.classList.toggle('hot', g.mistakes >= STAR_AT[1]);
    hud.fill.style.transform = `scaleX(${(g.found / (PAIRS * ROUNDS)).toFixed(3)})`;
    hud.pairs.innerHTML = Array.from({ length: PAIRS }, (_, k) => `<i class="${k < g.cards.filter((c) => c.done).length / 2 ? 'on' : ''}">✦</i>`).join('');
  }

  function deal() {
    const pairs = g.rounds[g.round];
    const cards = [];
    pairs.forEach(([n, en], pid) => {
      cards.push({ pid, side: 'n', text: n, en });
      cards.push({ pid, side: 'e', text: en, en });
    });
    g.cards = shuffle(cards);
    g.open = []; g.lock = true;
    _debug.layout = g.cards.map((c) => c.pid);
    grid.innerHTML = '';
    const emoji = esc(world.emoji || '✨');
    g.cards.forEach((c, i) => {
      const slot = el('button', 'mm-slot');
      slot.type = 'button';
      slot.setAttribute('aria-label', T('a_card', { 0: i + 1 }));
      slot.style.setProperty('--d', `${i * 45}ms`);
      slot.innerHTML = `<span class="mm-glow" aria-hidden="true"></span>
        <span class="mm-card">
          <span class="mm-face mm-back"><span class="mm-emb">${emoji}</span><span class="mm-q">?</span></span>
          <span class="mm-face mm-front mm-${c.side}">
            <span class="mm-tag">${c.side === 'e' ? 'ENG 🔊' : T('tag')}</span>
            <span class="mm-word${sizeCls(c.text)}">${wordHtml(c.text)}</span>
          </span>
        </span>`;
      slot.addEventListener('click', () => tapCard(i));
      c.el = slot;
      grid.append(slot);
    });
    sfx('deal');
    paintHud();
    _debug.phase = 'deal';
    // коротке підглядання: усі картки відкриваються на мить
    later(() => {
      lumiSay(T('remember'), 'excited');
      sfx('flip');
      g.cards.forEach((c, i) => later(() => c.el.classList.add('open'), i * 30));
    }, 900);
    later(() => {
      sfx('flip');
      g.cards.forEach((c) => c.el.classList.remove('open'));
      later(() => { g.lock = false; phase = 'play'; _debug.phase = 'play'; lumiSay(T('go'), 'cheer'); }, 450);
    }, 900 + 1700);
  }

  function tapCard(i) {
    if (!alive || paused || overlay || phase !== 'play' || g.lock) return;
    const c = g.cards[i];
    if (!c || c.done || g.open.includes(c)) return;
    hap(app);
    sfx('flip');
    c.el.classList.add('open');
    if (c.side === 'e') speak(c.en);
    g.open.push(c);
    if (g.open.length < 2) return;
    g.lock = true;
    const [a, b] = g.open;
    if (a.pid === b.pid) later(() => match(a, b), 420);
    else later(() => miss(a, b), 650);
  }

  function match(a, b) {
    a.done = b.done = true;
    g.open = []; g.lock = false;
    g.found++; g.combo++; g.bestCombo = Math.max(g.bestCombo, g.combo);
    g.xp += XP_PER_PAIR;
    try { S.onCorrectAnswer(st); S.addXP(st, XP_PER_PAIR); } catch (e) { /* */ }
    dirty = true;
    for (const c of [a, b]) c.el.classList.add('matched');
    sfx('correct');
    later(() => sfx('pop'), 160);
    hap(app, 'success');
    speak(a.en);
    for (const c of [a, b]) fx('sparkle', c.el, { count: 8 });
    const native = a.side === 'n' ? a.text : b.text;
    if (g.combo >= 3) lumiSay(T('combo', { 0: g.combo }), 'excited', 'spin');
    else if (performance.now() - lastTalk > 2500 || g.combo === 1) {
      lastTalk = performance.now();
      lumiSay(pick([T('match1', { 0: a.en, 1: native.replace(/\s*\([^)]*\)/, '') }), T('match2'), T('match3')]), 'happy', 'love');
    } else lumi?.react?.('jump');
    paintHud();
    if (g.cards.every((c) => c.done)) later(roundDone, 900);
  }

  function miss(a, b) {
    g.mistakes++; g.combo = 0;
    try { S.noteMiss(st, wid, a.en); if (b.en !== a.en) S.noteMiss(st, wid, b.en); } catch (e) { /* */ }
    _debug.mistakes = g.mistakes;
    sfx('wrong');
    hap(app, 'error');
    for (const c of [a, b]) { c.el.classList.remove('shake'); void c.el.offsetWidth; c.el.classList.add('shake'); }
    anim(hud.missChip, [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
    if (g.mistakes === STAR_AT[1] + 3) lumiSay(T('danger', { 0: g.mistakes }), 'surprised', 'shake');
    else if (performance.now() - lastTalk > 2600) { lastTalk = performance.now(); lumiSay(pick([T('miss1'), T('miss2'), T('miss3')]), 'thinking', 'shake'); }
    else lumi?.react?.('shake');
    paintHud();
    later(() => {
      for (const c of [a, b]) c.el.classList.remove('open', 'shake');
      g.open = [];
      if (g.mistakes >= LOSE_AT) { later(() => finish(false), 450); return; }
      g.lock = false;
    }, 620);
  }

  function roundDone() {
    if (g.round + 1 >= ROUNDS) { finish(true); return; }
    phase = 'between'; _debug.phase = 'between';
    sfx('star');
    lumiSay(T('round_done'), 'excited', 'jump');
    fx('confetti', { count: 40, power: 0.7 });
    g.cards.forEach((c, i) => later(() => c.el.classList.add('leave'), i * 35));
    later(() => { g.round++; deal(); }, 1300);
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
      <div class="g-card-ico m3-ico">🧩</div>
      <h2>${T('title')}</h2>
      <div class="g-sub">${esc(world.emoji || '')} ${esc(tcw(world, 'name'))}${best ? `${T('best')}${'⭐'.repeat(best)}` : ''}</div>
      <div class="g-intro-lumi"></div>
      <ul class="g-rules">
        <li>${T('r1')}</li>
        <li>${T('r2')}</li>
        <li>${T('r3', { 0: ROUNDS, 1: LOSE_AT })}</li>
      </ul>
      <div class="g-keys">${T('keys')}</div>
      <button class="g-btn g-btn-big g-btn-go" data-a="go">${T('start')}</button>
      ${inTg ? '' : `<button class="g-btn g-btn-ghost" data-a="back">${T('back')}</button>`}
    </div>`;
    scr.append(overlay);
    const l = makeLumi(app, overlay.querySelector('.g-intro-lumi'), 88, 'excited');
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
    phase = 'deal';
    deal();
  }
  function pause() {
    if (paused || overlay || phase === 'intro' || phase === 'over' || !alive) return;
    paused = true;
    scr.classList.add('m3-paused');
    _debug.phase = 'paused';
    overlay = el('div', 'g-over g-pausebox m3-over');
    overlay.innerHTML = `<div class="g-card g-card-sm m3-card">
      <h2>${T('pause')}</h2>
      <div class="g-sub">${T('round', { 0: g.round + 1, 1: ROUNDS })} · ❌ ${g.mistakes}</div>
      <button class="g-btn g-btn-big g-btn-go" data-a="resume">${T('resume')}</button>
      <button class="g-btn g-btn-big" data-a="restart">${T('restart')}</button>
      <button class="g-btn g-btn-big g-btn-ghost" data-a="exit">${T('exit')}</button>
    </div>`;
    scr.append(overlay);
    const on = (a, fn) => { overlay.querySelector(`[data-a=${a}]`).onclick = () => { hap(app); sfx('tap'); fn(); }; };
    on('resume', () => { closeOverlay(); paused = false; scr.classList.remove('m3-paused'); _debug.phase = phase; });
    on('restart', () => { closeOverlay(); begin(); });
    on('exit', () => app.back());
  }
  function finish(win) {
    if (!alive || phase === 'over') return;
    phase = 'over'; _debug.phase = 'result';
    g.lock = true;
    const stars = win ? starsFor(g.mistakes) : 0;
    const secs = Math.round((performance.now() - g.t0) / 1000);
    const rec = recordGame(st, gameId, stars);
    try { app.save?.(); } catch (e) { /* */ }
    dirty = false;
    hap(app, win ? 'success' : 'error');
    if (overlay) { overlay.remove(); overlay = null; }
    overlay = el('div', `g-over g-result m3-over ${win ? 'win' : 'lose'}`);
    overlay.innerHTML = `<div class="g-rays" aria-hidden="true"></div><div class="g-card m3-card">
      <div class="g-banner">${win ? T('win') : T('lose')}</div>
      <div class="g-stars"></div>
      <p class="g-sub">${win ? (stars === 3 ? T('perfect') : T('good')) : T('out')}</p>
      ${rec.isRecord ? `<div class="g-record">${T('record')}</div>` : ''}
      <div class="g-stats">
        <div><span>${T('s_pairs')}</span><strong><b data-n="${g.found}">0</b><em>/${PAIRS * ROUNDS}</em></strong></div>
        <div><span>${T('s_wrong')}</span><strong><b data-n="${g.mistakes}">0</b></strong></div>
        <div><span>${T('s_combo')}</span><strong><b data-n="${g.bestCombo}">0</b></strong></div>
        <div><span>${T('s_time')}</span><strong><b data-n="${secs}">0</b></strong></div>
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

  // ------------------------------------------------ клавіші/видимість
  function onKey(e) {
    if (!alive) return;
    if ((e.key === ' ' || e.key === 'p' || e.key === 'P') && phase !== 'intro' && phase !== 'over') {
      e.preventDefault();
      if (paused) overlay?.querySelector('[data-a=resume]')?.click(); else pause();
    }
  }
  function onVis() { if (document.hidden && alive && phase !== 'intro' && phase !== 'over') pause(); }
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVis);

  intro();

  return () => {
    alive = false;
    clearTimers();
    if (dirty) { dirty = false; try { app.save?.(); } catch (e) { /* */ } }
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVis);
    overLumis.forEach((l) => { try { l?.destroy?.(); } catch (e) { /* */ } });
    try { lumi?.destroy?.(); } catch (e) { /* */ }
    try { unTheme(); } catch (e) { /* */ }
    _debug.phase = 'gone';
  };
}
