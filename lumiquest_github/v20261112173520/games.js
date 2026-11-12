import { isAdmin as S_isAdmin } from './state.js?v=20261112173519';
// games.js — «стежка» з 13 рівнів у кожному світі (реєстр для world.js і міні-ігор).
//
// Кожен рівень: { id, idx, wid, type, screen, params, title, emoji, cover }
//   type:  lesson | story | durak | obby | brawl | drama | runner | boss
//   id:    для lesson — id квесту (w1q1…), для решти — `${wid}-${type}` (напр. w1-obby)
// Зірки всіх рівнів зберігаються в state.stars[id] (0..3), як у квестів.
// Рівень відкритий, якщо попередній має ≥ 1 ⭐ (або світ зараховано тестом рівня).
// Бос — завжди 13-й; додатково вимагає ≥ 1 ⭐ у всіх уроках (bossOpen у state.js).

import { getWorld, bossOpen, hasPhrases, hasVerbs, hasTrip, hasWords, isCountryId, stampPassport, syncCountries } from './state.js?v=20261112173519';

/** Порядок рівнів на стежці. 'L' — наступний урок зі списку world.quests. */
// v8: 23 рівні — 9 уроків, 8 міні-ігор, історія, драма, 3 «виклики» (складні версії), бос.
export const PATH = ['L', 'L', 'runner', 'L', 'memory', 'story', 'L', 'obby', 'phrases', 'wordle', 'verbs', 'L', 'durak', 'bubbles',
  'L', 'story2', 'brawl', 'listen', 'fishing', 'resto', 'L', 'drama', 'trip', 'phrases2', 'L', 'obbyx', 'runnerx', 'L', 'brawlx', 'story3', 'review', 'boss'];

// v19: стежка країни (≈25+ рівнів): на вході — Митниця, 10 уроків-квестів, культура, ігри, унікальна міні-гра, бос → штамп.
export const PATH_COUNTRY = ['customs', 'L', 'L', 'memory', 'slang', 'L', 'story', 'L', 'landmark', 'bubbles', 'L', 'phrases',
  'runner', 'L', 'festival', 'listen', 'L', 'resto', 'wordle', 'L', 'drama', 'trip', 'L', 'special', 'story2', 'review', 'boss'];
/** Рівні, що потребують слів WORDS[wid]. */
const NEED_WORDS = { memory: 8, bubbles: 6, runner: 8, wordle: 6, listen: 8, fishing: 8, durak: 8 };

export const GAME_META = {
  lesson: { emoji: '📘', label: 'Урок' },
  story:  { emoji: '💌', label: 'Історія',          screen: 'story' },
  durak:  { emoji: '🃏', label: 'Словесний Дурень', screen: 'durak' },
  obby:   { emoji: '🧗', label: 'Обі-Вежа',         screen: 'obby' },
  brawl:  { emoji: '💥', label: 'Зоряна Сутичка',   screen: 'brawl' },
  drama:  { emoji: '🎭', label: 'Шлях Вибору',      screen: 'drama' },
  runner: { emoji: '🏃', label: 'Словесний Забіг',  screen: 'runner' },
  boss:   { emoji: '⚔️', label: 'Бос-арена',        screen: 'arena' },
  memory: { emoji: '🧩', label: 'Словесна Пам\'ять', screen: 'memory' },
  wordle: { emoji: '🔤', label: 'Вгадай слово',     screen: 'wordle' },
  story2: { emoji: '💌', label: 'Історія: епізод 2', screen: 'story', ep: 2, base: 'story' },
  story3: { emoji: '💌', label: 'Історія: епізод 3', screen: 'story', ep: 3, base: 'story' },
  listen: { emoji: '🎧', label: 'Слухай і вибирай', screen: 'listen' },
  review: { emoji: '🔁', label: 'Робота над помилками', screen: 'review' },
  bubbles:{ emoji: '🫧', label: 'Бульбашки-Літери', screen: 'bubbles' },
  fishing:{ emoji: '🎣', label: 'Словесна Риболовля', screen: 'fishing' },
  resto:  { emoji: '🍽', label: 'Ресторан Лумі',     screen: 'resto' },
  phrases: { emoji: '🗣', label: 'Фрази на щодень',   screen: 'phrases', part: 1 },
  phrases2:{ emoji: '🗣', label: 'Фрази на щодень 2', screen: 'phrases', part: 2, base: 'phrases' },
  trip:   { emoji: '✈️', label: 'Подорож',          screen: 'trip' },
  verbs:  { emoji: '🔀', label: 'Неправильні дієслова', screen: 'verbs' },
  // v19: нові типи країн
  customs: { emoji: '🛂', label: 'Митниця',          screen: 'customs', cover: 'trip' },
  slang:   { emoji: '🗯', label: 'Сленг і акцент',   screen: 'slang', cover: 'phrases' },
  landmark:{ emoji: '🏛', label: 'Вгадай пам\'ятку', screen: 'landmark', cover: 'lesson' },
  festival:{ emoji: '🎉', label: 'Свято',            screen: 'festival', cover: 'drama' },
  special: { emoji: '🌟', label: 'Міні-гра країни',  screen: 'special', cover: 'runner', optional: true },
  // «виклики»: той самий екран з params.hard = true
  obbyx:  { emoji: '🔥', label: 'Обі-Вежа: Виклик',  screen: 'obby',   hard: true, base: 'obby' },
  runnerx:{ emoji: '🔥', label: 'Забіг: Виклик',     screen: 'runner', hard: true, base: 'runner' },
  brawlx: { emoji: '🔥', label: 'Сутичка: Виклик',   screen: 'brawl',  hard: true, base: 'brawl' },
};

/** Список рівнів світу (23 шт., якщо уроків 9). */
export function worldGames(wid) {
  const w = getWorld(wid);
  if (!w) return [];
  const lessons = [...(w.quests || [])];
  const out = [];
  const country = isCountryId(wid);
  for (const slot of (country ? PATH_COUNTRY : PATH)) {
    let g;
    if (slot === 'L') {
      const q = lessons.shift();
      if (!q) continue;
      g = { id: q.id, type: 'lesson', screen: 'quest', params: { qid: q.id }, title: q.title, emoji: q.emoji || '📘' };
    } else {
      const m = GAME_META[slot];
      if (m.ep && !w[slot]) continue;   // епізоду ще немає в контенті
      if (m.part && !hasPhrases(wid, m.part)) continue;   // фраз для світу ще немає в контенті
      if (slot === 'verbs' && !hasVerbs(wid)) continue;   // дієслів для світу ще немає в контенті
      if (slot === 'trip' && !hasTrip(wid)) continue;     // подорожі для світу ще немає в контенті
      if (country) {   // v19: пропускаємо слоти країни без даних
        if (NEED_WORDS[slot] && !hasWords(wid, NEED_WORDS[slot])) continue;
        if ((slot === 'story' || slot === 'drama') && !w[slot]) continue;
        if (slot === 'slang' && !((w.slang || []).length >= 4)) continue;
        if (slot === 'landmark' && !((w.landmarks || []).length >= 2)) continue;
        if (slot === 'festival' && !(w.festival && (w.festival.steps || []).length >= 3)) continue;
        if (slot === 'boss' && !(w.boss && (w.boss.tasks || []).length)) continue;
        if (slot === 'review' && !hasWords(wid, 4)) continue;
      }
      const title = m.ep ? (w[slot] && w[slot].title) || m.label : slot === 'story' ? (w.story && w.story.title) || m.label
        : slot === 'boss' ? (w.boss && w.boss.name) || m.label
        : slot === 'drama' ? (w.drama && w.drama.title) || m.label
        : m.label;
      const emoji = slot === 'boss' ? (w.boss && w.boss.emoji) || m.emoji : m.emoji;
      g = { id: `${wid}-${slot}`, type: slot, screen: m.screen, params: m.hard ? { wid, hard: true } : m.part ? { wid, part: m.part } : m.ep ? { wid, ep: m.ep } : { wid }, title, emoji };
      if (m.ep || (m.part && m.base)) g.base = m.base;
      if (m.hard) { g.hard = true; g.base = m.base; }
      if (m.optional) g.optional = true;   // необовʼязковий: не блокує наступні рівні
      if (country) g.params.cid = wid;
    }
    g.wid = wid;
    g.idx = out.length;
    g.cover = `covers/${(GAME_META[g.type] && GAME_META[g.type].cover) || g.base || g.type}.png`;   // assets/covers/<type>.webp (app.asset замінює .png → .webp)
    out.push(g);
  }
  return out;
}

export function gameStars(state, id) {
  const s = (state.stars && state.stars[id]) || 0;
  if (s) return s;
  // Сумісність зі старими збереженнями: історія/бос, пройдені до появи зірок на стежці.
  const m = /^(w\d+[bc]?|c\d+)-(story|boss)$/.exec(id);
  if (m && m[2] === 'story' && ((state.story_best && m[1] in state.story_best) || (state.story_badges || []).includes(m[1]))) return 1;
  if (m && m[2] === 'boss' && (state.badges || []).includes(m[1])) return 1;
  return 0;
}

/** Записати результат міні-гри (найкращий). Повертає {best, isRecord, first}. */
export function recordGame(state, id, stars) {
  state.stars = state.stars || {};
  const best = state.stars[id] || 0;
  state.stars[id] = Math.max(best, Math.max(0, Math.min(3, stars | 0)));
  // v19: бос країни → штамп у паспорт; будь-який результат може відкрити подорож/наступну країну
  const cm = /^(c\d+)-boss$/.exec(id);
  if (cm && stars >= 1) stampPassport(state, cm[1], stars);
  if (Array.isArray(state.unlocked)) syncCountries(state);
  return { best, isRecord: best > 0 && stars > best, first: best === 0 && stars > 0 };
}

/** Чи відкритий рівень з індексом idx у світі wid. */
export function isOpen(state, wid, idx) {
  if (S_isAdmin()) return true;
  const list = worldGames(wid);
  const g = list[idx];
  if (!g) return false;
  if (!(state.unlocked || []).includes(wid)) return false;
  if ((state.by_test || []).includes(wid)) return true;
  if (gameStars(state, g.id) >= 1) return true;   // уже пройдений рівень завжди можна переграти
  // суворий порядок: усі попередні рівні мають ≥ 1 ⭐
  for (let i = 0; i < idx; i++) if (!list[i].optional && gameStars(state, list[i].id) < 1) return false;
  return true;
}

/** Наступний непройдений відкритий рівень (для «Продовжити пригоду»). */
export function nextGame(state, wid) {
  const list = worldGames(wid);
  return list.find((g, i) => isOpen(state, wid, i) && gameStars(state, g.id) === 0) || null;
}

/** Зірки за результат міні-гри: частка правильних відповідей → 0..3. */
export const starsByRatio = (ratio) => (ratio >= 0.95 ? 3 : ratio >= 0.75 ? 2 : ratio >= 0.5 ? 1 : 0);
