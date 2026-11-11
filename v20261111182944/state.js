/**
 * LumiQuest — стан гравця та ігрові правила (порт game/engine.py, arena.py, dragons.py, story.py).
 *
 * Стан — ОДИН JSON-обʼєкт (див. newState()). Змінюйте його лише через хелпери нижче
 * (або напряму для простих полів), а потім викликайте app.save() — це збереже стан
 * і анімовано оновить верхню панель (XP, 🍀, 🏆).
 *
 * ── Поля стану ───────────────────────────────────────────────────────────────
 *  version          номер схеми (STATE_VERSION), міграція — sanitize()
 *  savedAt          ms, час останнього збереження (для вибору новішої копії хмара/локально)
 *  name             імʼя гравця (з Telegram first_name або «друже»)
 *  xp               досвід; рівень гравця = levelOf(xp) (кожні 100 XP)
 *  fireflies        ✨ Слова-Світлячки = кількість правильних відповідей
 *  food             🍀 Світлячковий корм (1 за правильну відповідь будь-де)
 *  trophies         🏆 кубки арени (≥ 0)
 *  stars            {questId: 0..3} — найкращий результат квесту
 *  badges           [worldId] — переможені боси
 *  unlocked         [worldId] — відкриті світи (у порядку WORLDS)
 *  by_test          [worldId] — зараховані «за тестом»
 *  placement_result null — тест не проходив; '' — нижче A1; 'A1'..'C1'
 *  placement_done   bool
 *  story_best       {worldId: найбільше 💗}
 *  story_badges     [worldId] — good-кінцівка історії
 *  dragons          {element: ріст}, element ∈ ELEMENTS ('sun' є з початку)
 *  active_dragon    element
 *  durak_wins, durak_games
 *  last_day, streak стрік днів (markDay)
 *
 * ── Константи ────────────────────────────────────────────────────────────────
 *  XP_PER_CORRECT=10, XP_PER_LEVEL=100, XP_BOSS=50, XP_PER_HEART=5,
 *  TROPHY_WIN=30, TROPHY_LOSS=10, FOOD_COST=10, FEED_GROWTH=10, SUN_BONUS_GROWTH=30,
 *  ARENAS, STAGES, ELEMENTS {el: імʼя}, ELEMENT_EMOJI, EGG_BY_WORLD_INDEX, DECK (карти арени)
 *
 * ── Хелпери (усі мутують state і повертають корисний результат) ─────────────
 *  setContent(content)                 один раз в app.js; далі хелпери знають світи
 *  newState(name) / sanitize(raw)      дефолти / міграція будь-якого (битого) обʼєкта
 *  levelOf(xp) -> 1..                  рівень гравця
 *  xpProgress(xp) -> {level, into, need, pct}
 *  addXP(state, n) -> {levelUp:bool, level}
 *  addFood(state, n=1) -> state.food
 *  onCorrectAnswer(state) -> state     fireflies+1, food+1 (XP додавайте окремо addXP!)
 *  addTrophies(state, n) -> {delta, trophies, arenaChanged, arena}   (n<0 — не нижче 0)
 *  arenaName(trophies) -> 'Дерев'яна арена' ...
 *  giveBadge(state, wid) -> true, якщо бейдж новий
 *  giveStoryBadge(state, wid) -> true, якщо новий
 *  giveDragon(state, element) -> true, якщо нове яйце (ріст 0)
 *  grantDragonForBoss(state, wid) -> текст нагороди | null  (w1: sun ≥ 30; w2..w5: яйця; w1b/w2b/w3b: нічого, +15 🍀 дає finishBoss)
 *  unlockNext(state, wid) -> наступний world-обʼєкт, якщо його щойно відкрили, інакше null
 *  unlockWorld(state, wid) -> true, якщо відкрили
 *  stageOf(growth) -> [code, min, label]; nextStage(growth) -> [code,min,label] | null
 *  feedDragon(state) -> {ok, before, after, hatched, stageUp}   (−10 🍀, +10 росту)
 *  markDay(state, today?) -> {sleepy, streak}   стрік днів (як _touch_day у Python)
 *  questStars(mistakes) -> 3|2|1
 *  recordQuest(state, qid, stars) -> {best, isRecord, bossOpened}
 *  bossOpen(state, wid) -> bool        усі 4 квести мають ≥ 1 ⭐
 *  bossNeed(n)=ceil(n*0.75) (6 з 8), bossTowers(n)=n-need+1 (3)
 *  finishBoss(state, wid, won) -> {won, first, xp, trophies, gift, newArena, unlocked}
 *  storyEnding(hearts, n) -> 'good'|'ok'|'bad'
 *  finishStory(state, wid, hearts, n) -> {ending, xp, best, isRecord, badge}
 *  applyPlacement(state, passedLevels[]) -> {result, unlocked:[wid]}
 *  currentWorldId(state) -> wid        «де зараз Лумі» (останній відкритий світ)
 *  norm(s)                              нормалізація відповіді як у Python
 *  todayISO()
 */

import { t, tc } from './i18n.js?v=20261111182943';

export const STATE_VERSION = 1;
/** v7: глобальне одноразове скидання прогресу. Збереження з іншим epoch замінюється новим станом. */
export const RESET_EPOCH = 2;
export const XP_PER_CORRECT = 10;
export const XP_PER_LEVEL = 250;
export const XP_BOSS = 50;
export const XP_PER_HEART = 5;
export const TROPHY_WIN = 30;
export const TROPHY_LOSS = 10;
export const FOOD_COST = 10;
export const FEED_GROWTH = 10;
export const SUN_BONUS_GROWTH = 30;

export const ARENAS = [[0, "Дерев'яна арена"], [100, 'Кам\'яна арена'], [250, 'Срібна арена'],
  [500, 'Золота арена'], [900, 'Зоряна арена']];
export const STAGES = [['egg', 0, 'Яйце 🥚'], ['baby', 30, 'Малюк'], ['teen', 100, 'Підліток'],
  ['adult', 250, 'Дорослий'], ['legend', 500, 'Легенда ✨']];
export const ELEMENTS = { sun: 'Вогник', forest: 'Мох', clock: 'Тік-Так', crystal: 'Іскра', sky: 'Зорян' };
export const ELEMENT_EMOJI = { sun: '☀️', forest: '🌿', clock: '⏰', crystal: '💎', sky: '🌌' };
// v11: дракони — за id світу (не за індексом): проміжні світи w1b/w2b/w3b драконів не дають (за їхніх босів — бонус 🍀)
export const EGG_BY_WORLD = { w2: 'forest', w3: 'clock', w4: 'crystal', w5: 'sky' };
export const EGG_BY_WORLD_INDEX = { 1: 'forest', 2: 'clock', 3: 'crystal', 4: 'sky' }; // застаріле (до v11), не використовувати
export const SUN_WORLD = 'w1';
export const BONUS_BOSS_FOOD = 15;
/** Проміжний світ (рівень із «+»: A1+, A2+, B1+). */
export const isBonusWorld = (w) => !!w && /\+$/.test(String(w.level || ''));
export const DECK = ['🗡 Лицар Дієслово', '🏹 Лучниця Артикль', '🔥 Вогняний Прийменник',
  '🛡 Голем Граматики', '⚡ Блискавка Лексики', '🧙 Маг Часів'];
export const LEVELS_DEFAULT = ['A1', 'A2', 'B1', 'B2', 'C1'];

let C = { LEVELS: LEVELS_DEFAULT, WORLDS: [], PLACEMENT: [], WORDS: {} };
let worldById = {};
let worldIdx = {};
let questById = {};

export function setContent(content) {
  C = content || C;
  worldById = {}; worldIdx = {}; questById = {};
  (C.WORLDS || []).forEach((w, i) => {
    worldById[w.id] = w; worldIdx[w.id] = i;
    (w.quests || []).forEach((q) => { questById[q.id] = { world: w, quest: q }; });
  });
}
export const getWorld = (wid) => worldById[wid] || null;
/** Чи є в контенті «Фрази на щодень» для світу (part 2 потребує фраз 10+). */
export const hasPhrases = (wid, part = 1) => {
  const l = C && C.PHRASES && C.PHRASES[wid];
  return Array.isArray(l) && l.length >= (part === 2 ? 13 : 3);
};
/** Чи є в контенті «Неправильні дієслова» для світу (потрібно щонайменше 4 — на варіанти відповіді). */
export const hasVerbs = (wid) => {
  const l = C && C.VERBS && C.VERBS[wid];
  return Array.isArray(l) && l.length >= 4;
};
/** Назва рівня стежки (games.js) поточною мовою. */
export function gameTitle(g) {
  if (!g) return '';
  if (g.type === 'lesson') { const q = questById[g.id]; return q ? tc(q.quest, 'title') : g.title; }
  const w = worldById[g.wid] || {};
  if (g.type === 'story' && w.story) return tc(w.story, 'title') || t('game.story');
  if ((g.type === 'story2' || g.type === 'story3') && w[g.type]) return tc(w[g.type], 'title') || t('game.story');
  if (g.type === 'boss' && w.boss) return tc(w.boss, 'name') || t('game.boss');
  if (g.type === 'drama' && w.drama) return tc(w.drama, 'title') || t('game.drama');
  return t('game.' + g.type);
}
export const getQuest = (qid) => questById[qid] || null;   // {world, quest}
export const worldIndex = (wid) => (wid in worldIdx ? worldIdx[wid] : -1);

const MISS_MAX = 40; // слів з помилками на світ
const isNat = (v) => Number.isInteger(v) && v >= 0;

export function todayISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function dayDiff(a, b) { // b - a у днях, ISO-рядки
  const pa = Date.UTC(...a.split('-').map((x, i) => +x - (i === 1 ? 1 : 0)));
  const pb = Date.UTC(...b.split('-').map((x, i) => +x - (i === 1 ? 1 : 0)));
  return Math.round((pb - pa) / 86400000);
}

export function newState(name) {
  const first = C.WORLDS && C.WORLDS[0] ? [C.WORLDS[0].id] : [];
  return {
    version: STATE_VERSION,
    epoch: RESET_EPOCH,
    savedAt: 0,
    name: name || t('common.friend'),
    settings: { lang: null },
    onboarded: false,
    xp: 0,
    fireflies: 0,
    food: 0,
    trophies: 0,
    stars: {},
    badges: [],
    unlocked: first,
    by_test: [],
    placement_result: null,
    placement_done: false,
    story_best: {},
    story_badges: [],
    dragons: { sun: 0 },
    active_dragon: 'sun',
    durak_wins: 0,
    durak_games: 0,
    last_day: null,
    streak: 0,
    miss: {},
  };
}

/** Міграція/лагодження: будь-який обʼєкт -> валідний стан поточної версії. */
export function sanitize(raw) {
  const st = raw && typeof raw === 'object' ? raw : {};
  const out = newState(typeof st.name === 'string' && st.name.trim() ? st.name.slice(0, 40) : t('common.friend'));
  if (Number.isInteger(st.epoch)) out.epoch = st.epoch;
  out.onboarded = !!st.onboarded;
  if (st.settings && typeof st.settings === 'object') {
    out.settings.lang = st.settings.lang === 'uk' || st.settings.lang === 'ru' ? st.settings.lang : null;
  }
  for (const k of ['xp', 'fireflies', 'food', 'trophies', 'durak_wins', 'durak_games', 'streak', 'savedAt']) {
    if (isNat(st[k])) out[k] = st[k];
  }
  out.last_day = typeof st.last_day === 'string' && /^\d{4}-\d\d-\d\d$/.test(st.last_day) ? st.last_day : null;
  if (st.stars && typeof st.stars === 'object') {
    for (const [k, v] of Object.entries(st.stars)) if (isNat(v)) out.stars[k] = Math.min(3, v);
  }
  if (st.story_best && typeof st.story_best === 'object') {
    for (const [k, v] of Object.entries(st.story_best)) if (worldById[k] && isNat(v)) out.story_best[k] = v;
  }
  for (const key of ['badges', 'unlocked', 'by_test', 'story_badges']) {
    if (Array.isArray(st[key])) {
      out[key] = [...new Set(st[key].filter((x) => typeof x === 'string' && worldById[x]))];
    }
  }
  const w0 = C.WORLDS && C.WORLDS[0] && C.WORLDS[0].id;
  if (w0 && !out.unlocked.includes(w0)) out.unlocked.unshift(w0);
  migrateWorlds(out);
  sortUnlocked(out);
  const pr = st.placement_result;
  const levels = C.LEVELS || LEVELS_DEFAULT;
  out.placement_result = (pr === null || pr === undefined) ? null : (pr === '' || levels.includes(pr) ? pr : null);
  out.placement_done = !!st.placement_done || out.placement_result !== null;
  // дракони
  if (st.dragons && typeof st.dragons === 'object') {
    for (const [k, v] of Object.entries(st.dragons)) if (ELEMENTS[k] && isNat(v)) out.dragons[k] = v;
  }
  out.active_dragon = out.dragons[st.active_dragon] !== undefined ? st.active_dragon : 'sun';
  for (const wid of out.badges) grantDragonForBoss(out, wid); // старі збереження
  // облік помилок: { wid: { en: n } }, ≤ MISS_MAX слів на світ
  if (st.miss && typeof st.miss === 'object') {
    for (const [w, m] of Object.entries(st.miss)) {
      if (!worldById[w] || !m || typeof m !== 'object') continue;
      const ent = Object.entries(m).filter(([k, v]) => typeof k === 'string' && k && k.length <= 40 && isNat(v) && v > 0)
        .sort((a, b) => b[1] - a[1]).slice(0, MISS_MAX);
      if (ent.length) out.miss[w] = Object.fromEntries(ent.map(([k, v]) => [k, Math.min(9, v)]));
    }
  }
  out.version = STATE_VERSION;
  return out;
}

/** v11 (нові світи між наявними): бос світу X переможений → наступний за порядком відкритий; світ із «+» після
 *  зарахованого тестом базового — теж зарахований; у відкритих немає «дірок» (усе до найдальшого відкритого — відкрите). */
function migrateWorlds(st) {
  const W = C.WORLDS || [];
  W.forEach((w, i) => {
    const nx = W[i + 1];
    if (!nx) return;
    if (st.badges.includes(w.id) && !st.unlocked.includes(nx.id)) st.unlocked.push(nx.id);
    if (st.by_test.includes(w.id) && isBonusWorld(nx) && !isBonusWorld(w) && !st.by_test.includes(nx.id)) st.by_test.push(nx.id);
  });
  let last = -1;
  W.forEach((w, i) => { if (st.unlocked.includes(w.id) || st.by_test.includes(w.id)) last = i; });
  for (let i = 0; i <= last; i++) if (!st.unlocked.includes(W[i].id)) st.unlocked.push(W[i].id);
  // зарахований тестом світ → наступний відкритий
  W.forEach((w, i) => { if (st.by_test.includes(w.id) && W[i + 1] && !st.unlocked.includes(W[i + 1].id)) st.unlocked.push(W[i + 1].id); });
}

function sortUnlocked(st) {
  if (C.WORLDS && C.WORLDS.length) st.unlocked = C.WORLDS.map((w) => w.id).filter((id) => st.unlocked.includes(id));
}

// ── XP / рівні ─────────────────────────────────────────────────────────────
export const levelOf = (xp) => Math.floor((xp || 0) / XP_PER_LEVEL) + 1;
export function xpProgress(xp) {
  const into = (xp || 0) % XP_PER_LEVEL;
  return { level: levelOf(xp), into, need: XP_PER_LEVEL - into, pct: into / XP_PER_LEVEL };
}
export function addXP(state, n) {
  const before = levelOf(state.xp);
  state.xp = Math.max(0, (state.xp || 0) + (n | 0));
  const level = levelOf(state.xp);
  return { levelUp: level > before, level };
}
export function addFood(state, n = 1) {
  state.food = Math.max(0, (state.food || 0) + n);
  return state.food;
}
/** Правильна відповідь будь-де: +1 ✨ Слово-Світлячок, +1 🍀 корм. XP — окремо через addXP. */
export function onCorrectAnswer(state) {
  state.fireflies = (state.fireflies || 0) + 1;
  addFood(state, 1);
  return state;
}

// ── кубки / арени ──────────────────────────────────────────────────────────
export function arenaName(trophies) {
  let k = 0;
  ARENAS.forEach(([lim], i) => { if ((trophies || 0) >= lim) k = i; });
  return arenaLabel(k);
}
/** Назва арени за індексом поточною мовою. */
export const arenaLabel = (i) => t('arena.' + i);
/** Назва стадії дракона поточною мовою (code: egg|baby|teen|adult|legend). */
export const stageLabel = (code) => t('stage.' + code);
/** Імʼя дракона поточною мовою. */
export const elementName = (el) => t('el.' + el);
export function addTrophies(state, n) {
  const old = arenaName(state.trophies);
  const before = state.trophies || 0;
  state.trophies = Math.max(0, before + n);
  const arena = arenaName(state.trophies);
  return { delta: state.trophies - before, trophies: state.trophies, arenaChanged: arena !== old, arena };
}

// ── бейджі / світи ─────────────────────────────────────────────────────────
export function giveBadge(state, wid) {
  if (state.badges.includes(wid)) return false;
  state.badges.push(wid);
  return true;
}
export function giveStoryBadge(state, wid) {
  if (state.story_badges.includes(wid)) return false;
  state.story_badges.push(wid);
  return true;
}
export function unlockWorld(state, wid) {
  if (!worldById[wid] || state.unlocked.includes(wid)) return false;
  state.unlocked.push(wid);
  sortUnlocked(state);
  return true;
}
export function unlockNext(state, wid) {
  const i = worldIndex(wid);
  const nw = i >= 0 ? C.WORLDS[i + 1] : null;
  if (!nw) return null;
  return unlockWorld(state, nw.id) ? nw : null;
}
export function currentWorldId(state) {
  return state.unlocked[state.unlocked.length - 1] || (C.WORLDS[0] && C.WORLDS[0].id);
}

// ── дракони ────────────────────────────────────────────────────────────────
export function stageOf(growth) {
  let cur = STAGES[0];
  for (const s of STAGES) if ((growth || 0) >= s[1]) cur = s;
  return [cur[0], cur[1], stageLabel(cur[0])];
}
export const nextStage = (growth) => {
  const s = STAGES.find((x) => x[1] > (growth || 0));
  return s ? [s[0], s[1], stageLabel(s[0])] : null;
};

export function giveDragon(state, element) {
  if (!ELEMENTS[element] || state.dragons[element] !== undefined) return false;
  state.dragons[element] = 0;
  return true;
}
export function grantDragonForBoss(state, wid) {
  if (!worldById[wid]) return null;
  if (wid === SUN_WORLD) {
    if ((state.dragons.sun || 0) < SUN_BONUS_GROWTH) {
      state.dragons.sun = SUN_BONUS_GROWTH;
      return t('gift.sunHatch', { name: t('el.sun') });
    }
    return null;
  }
  const el = EGG_BY_WORLD[wid];
  if (el && giveDragon(state, el)) return t('gift.egg', { emoji: ELEMENT_EMOJI[el], name: t('el.' + el) });
  return null;
}
export function feedDragon(state) {
  const el = state.active_dragon;
  if ((state.food || 0) < FOOD_COST) return { ok: false, need: FOOD_COST };
  const before = stageOf(state.dragons[el]);
  state.food -= FOOD_COST;
  state.dragons[el] = (state.dragons[el] || 0) + FEED_GROWTH;
  const after = stageOf(state.dragons[el]);
  return { ok: true, before, after, stageUp: after[0] !== before[0], hatched: before[0] === 'egg' && after[0] !== 'egg' };
}

// ── стрік ──────────────────────────────────────────────────────────────────
/** Позначити сьогоднішній день. sleepy=true, якщо гравця не було ≥ 2 днів. */
export function markDay(state, today = todayISO()) {
  const last = state.last_day;
  let sleepy = false;
  if (last === today) return { sleepy, streak: state.streak };
  const diff = last ? dayDiff(last, today) : null;
  sleepy = diff !== null && diff >= 2;
  state.streak = diff === 1 ? (state.streak || 0) + 1 : 1;
  state.last_day = today;
  return { sleepy, streak: state.streak };
}

// ── квести / бос / історія ────────────────────────────────────────────────
export const questStars = (mistakes) => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);

export function bossOpen(state, wid) {
  const w = worldById[wid];
  const qs = (w && w.quests) || [];
  return qs.length > 0 && qs.every((q) => (state.stars[q.id] || 0) >= 1);
}
export function recordQuest(state, qid, stars) {
  const info = questById[qid];
  const best = state.stars[qid] || 0;
  const wasOpen = info ? bossOpen(state, info.world.id) : false;
  state.stars[qid] = Math.max(best, stars);
  const nowOpen = info ? bossOpen(state, info.world.id) : false;
  return { best, isRecord: best > 0 && stars > best, bossOpened: !wasOpen && nowOpen };
}

export const bossNeed = (n) => Math.max(1, Math.ceil(n * 0.75));
export const bossTowers = (n) => Math.max(1, n - bossNeed(n) + 1);

/** Підсумок бою з босом (XP за відповіді нараховуйте по ходу: addXP + onCorrectAnswer). */
export function finishBoss(state, wid, won) {
  if (!won) {
    const t = addTrophies(state, -TROPHY_LOSS);
    return { won: false, first: false, xp: 0, trophies: t.delta, total: state.trophies, gift: null, newArena: null, unlocked: null };
  }
  const tt = addTrophies(state, TROPHY_WIN);
  const first = giveBadge(state, wid);
  let xp = 0;
  if (first) { addXP(state, XP_BOSS); xp = XP_BOSS; }
  let gift = grantDragonForBoss(state, wid);
  if (first && !gift && isBonusWorld(worldById[wid])) { addFood(state, BONUS_BOSS_FOOD); gift = t('gift.food', { n: BONUS_BOSS_FOOD }); }
  const unlocked = unlockNext(state, wid);
  return { won: true, first, xp, trophies: tt.delta, total: state.trophies, gift,
    newArena: tt.arenaChanged ? tt.arena : null, unlocked };
}

export function storyEnding(hearts, n) {
  if (hearts >= n - 1) return 'good';
  if (hearts >= Math.floor((n + 1) / 2)) return 'ok';
  return 'bad';
}
export function finishStory(state, wid, hearts, n) {
  const ending = storyEnding(hearts, n);
  const xp = hearts * XP_PER_HEART;
  addXP(state, xp);
  const best = state.story_best[wid] || 0;
  state.story_best[wid] = Math.max(best, hearts);
  const badge = ending === 'good' ? giveStoryBadge(state, wid) : false;
  return { ending, xp, best, isRecord: hearts > best, badge };
}

// ── тест рівня ─────────────────────────────────────────────────────────────
export function applyPlacement(state, passed) {
  const levels = C.LEVELS || LEVELS_DEFAULT;
  const result = passed.length ? passed[passed.length - 1] : '';
  state.placement_result = result;
  state.placement_done = true;
  const lvlI = levels.indexOf(result);
  // v11: світ із «+» зараховується разом зі своїм базовим рівнем (A1 → w1 і w1b); відкривається ще й наступний після останнього зарахованого
  const W = C.WORLDS || [];
  let lastCred = -1;
  W.forEach((w, i) => {
    const bi = levels.indexOf(String(w.level || '').replace(/\+$/, ''));
    if (bi >= 0 && bi <= lvlI) {
      lastCred = i;
      if (!state.by_test.includes(w.id)) state.by_test.push(w.id);
    }
  });
  W.forEach((w, i) => { if (i <= lastCred + 1 && !state.unlocked.includes(w.id)) state.unlocked.push(w.id); });
  sortUnlocked(state);
  return { result, unlocked: [...state.unlocked] };
}

// ── відповіді ──────────────────────────────────────────────────────────────
/** Як norm() у game/ui.py: lower, strip, ’→', стиснути пробіли, прибрати кінцеві .!? */
export function norm(s) {
  return String(s ?? '')
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[.!?\s]+$/, '')
    .trim();
}

// ── Облік помилок (v9) ───────────────────────────────────────────────────────
const missKey = (en) => String(en || '').trim().toLowerCase().slice(0, 40);
/** Хибна відповідь на слово en у світі wid: state.miss[wid][en] += 1 (≤ 40 слів на світ). */
export function noteMiss(state, wid, en) {
  const k = missKey(en);
  if (!state || !wid || !k) return 0;
  if (!state.miss || typeof state.miss !== 'object') state.miss = {};
  const m = state.miss[wid] || (state.miss[wid] = {});
  if (!(k in m) && Object.keys(m).length >= MISS_MAX) {
    const low = Object.entries(m).sort((a, b) => a[1] - b[1])[0];
    if (low) delete m[low[0]];
  }
  m[k] = Math.min(9, (m[k] || 0) + 1);
  return m[k];
}
/** Правильна відповідь у «Роботі над помилками»: n -= 1, 0 → видалити. Повертає залишок. */
export function clearMiss(state, wid, en) {
  const k = missKey(en);
  const m = state && state.miss && state.miss[wid];
  if (!m || !(k in m)) return 0;
  m[k] -= 1;
  if (!(m[k] > 0)) { delete m[k]; if (!Object.keys(m).length) delete state.miss[wid]; return 0; }
  return m[k];
}
/** Слова світу з помилками (англійською, нижній регістр), найчастіші — першими. */
export function missList(state, wid) {
  const m = state && state.miss && state.miss[wid];
  if (!m || typeof m !== 'object') return [];
  return Object.entries(m).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([k]) => k);
}
