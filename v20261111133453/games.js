// games.js — «стежка» з 13 рівнів у кожному світі (реєстр для world.js і міні-ігор).
//
// Кожен рівень: { id, idx, wid, type, screen, params, title, emoji, cover }
//   type:  lesson | story | durak | obby | brawl | drama | runner | boss
//   id:    для lesson — id квесту (w1q1…), для решти — `${wid}-${type}` (напр. w1-obby)
// Зірки всіх рівнів зберігаються в state.stars[id] (0..3), як у квестів.
// Рівень відкритий, якщо попередній має ≥ 1 ⭐ (або світ зараховано тестом рівня).
// Бос — завжди 13-й; додатково вимагає ≥ 1 ⭐ у всіх уроках (bossOpen у state.js).

import { getWorld, bossOpen, hasPhrases } from './state.js?v=20261111133439';

/** Порядок рівнів на стежці. 'L' — наступний урок зі списку world.quests. */
// v8: 23 рівні — 9 уроків, 8 міні-ігор, історія, драма, 3 «виклики» (складні версії), бос.
export const PATH = ['L', 'L', 'runner', 'L', 'memory', 'story', 'L', 'obby', 'phrases', 'wordle', 'L', 'durak', 'bubbles',
  'L', 'story2', 'brawl', 'listen', 'fishing', 'L', 'drama', 'phrases2', 'L', 'obbyx', 'runnerx', 'L', 'brawlx', 'story3', 'review', 'boss'];

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
  phrases: { emoji: '🗣', label: 'Фрази на щодень',   screen: 'phrases', part: 1 },
  phrases2:{ emoji: '🗣', label: 'Фрази на щодень 2', screen: 'phrases', part: 2, base: 'phrases' },
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
  for (const slot of PATH) {
    let g;
    if (slot === 'L') {
      const q = lessons.shift();
      if (!q) continue;
      g = { id: q.id, type: 'lesson', screen: 'quest', params: { qid: q.id }, title: q.title, emoji: q.emoji || '📘' };
    } else {
      const m = GAME_META[slot];
      if (m.ep && !w[slot]) continue;   // епізоду ще немає в контенті
      if (m.part && !hasPhrases(wid, m.part)) continue;   // фраз для світу ще немає в контенті
      const title = m.ep ? (w[slot] && w[slot].title) || m.label : slot === 'story' ? (w.story && w.story.title) || m.label
        : slot === 'boss' ? (w.boss && w.boss.name) || m.label
        : slot === 'drama' ? (w.drama && w.drama.title) || m.label
        : m.label;
      const emoji = slot === 'boss' ? (w.boss && w.boss.emoji) || m.emoji : m.emoji;
      g = { id: `${wid}-${slot}`, type: slot, screen: m.screen, params: m.hard ? { wid, hard: true } : m.part ? { wid, part: m.part } : m.ep ? { wid, ep: m.ep } : { wid }, title, emoji };
      if (m.ep || (m.part && m.base)) g.base = m.base;
      if (m.hard) { g.hard = true; g.base = m.base; }
    }
    g.wid = wid;
    g.idx = out.length;
    g.cover = `covers/${g.base || g.type}.png`;   // assets/covers/<type>.webp (app.asset замінює .png → .webp)
    out.push(g);
  }
  return out;
}

export function gameStars(state, id) {
  const s = (state.stars && state.stars[id]) || 0;
  if (s) return s;
  // Сумісність зі старими збереженнями: історія/бос, пройдені до появи зірок на стежці.
  const m = /^(w\d+b?)-(story|boss)$/.exec(id);
  if (m && m[2] === 'story' && ((state.story_best && m[1] in state.story_best) || (state.story_badges || []).includes(m[1]))) return 1;
  if (m && m[2] === 'boss' && (state.badges || []).includes(m[1])) return 1;
  return 0;
}

/** Записати результат міні-гри (найкращий). Повертає {best, isRecord, first}. */
export function recordGame(state, id, stars) {
  state.stars = state.stars || {};
  const best = state.stars[id] || 0;
  state.stars[id] = Math.max(best, Math.max(0, Math.min(3, stars | 0)));
  return { best, isRecord: best > 0 && stars > best, first: best === 0 && stars > 0 };
}

/** Чи відкритий рівень з індексом idx у світі wid. */
export function isOpen(state, wid, idx) {
  const list = worldGames(wid);
  const g = list[idx];
  if (!g) return false;
  if (!(state.unlocked || []).includes(wid)) return false;
  if ((state.by_test || []).includes(wid)) return true;
  // суворий порядок: усі попередні рівні мають ≥ 1 ⭐
  for (let i = 0; i < idx; i++) if (gameStars(state, list[i].id) < 1) return false;
  return true;
}

/** Наступний непройдений відкритий рівень (для «Продовжити пригоду»). */
export function nextGame(state, wid) {
  const list = worldGames(wid);
  return list.find((g, i) => isOpen(state, wid, i) && gameStars(state, g.id) === 0) || null;
}

/** Зірки за результат міні-гри: частка правильних відповідей → 0..3. */
export const starsByRatio = (ratio) => (ratio >= 0.95 ? 3 : ratio >= 0.75 ? 2 : ratio >= 0.5 ? 1 : 0);
