// 👤 Профіль: картка гравця (Лумі в рамці арени, кільце XP, звання), лічильники, медалі світів, драконяча колекція,
// кубки і шкала арен, стрік-календар тижня, налаштування.
import { h, button, plural, fx, confirmDialog, toast } from './ui.js?v=20261110183712';
import { xpProgress, ARENAS, stageOf, ELEMENTS, ELEMENT_EMOJI } from './state.js?v=20261110183712';
import { worldGames, gameStars } from './games.js?v=20261110183712';
import { emblem, themeOf } from './theme.js?v=20261110183712';
import { weekActivity } from './home.js?v=20261110183712';

const svgFrom = (str) => { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstChild; };
const setI = (el, i) => { el.style.setProperty('--i', i); return el; };

// звання за рівнем
const RANKS = [[1, 'Іскорка'], [3, 'Ловець світлячків'], [5, 'Юний мандрівник'], [8, 'Знавець слів'],
  [12, 'Хранитель світла'], [17, 'Зоряний мудрець'], [25, 'Легенда неба']];
const rankOf = (lvl) => RANKS.reduce((r, x) => (lvl >= x[0] ? x[1] : r), RANKS[0][1]);
// рамка аватара — матеріал арени
const ARENA_SKIN = ['wood', 'stone', 'silver', 'gold', 'star'];
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

function medalSVG(wid, got) {
  const t = themeOf(wid);
  const ink = got ? t.ink : '#000';
  const em = emblem(wid).replace(/^<svg[^>]*>|<\/svg>$/g, '');
  return `<svg viewBox="0 0 64 76" aria-hidden="true">
    <path d="M18 2 H30 L36 22 H24Z" fill="${got ? t.accent2 : '#000'}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M46 2 H34 L28 22 H40Z" fill="${got ? t.accent : '#000'}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="32" cy="46" r="27" fill="${got ? t.accent : '#000'}" stroke="${ink}" stroke-width="3"/>
    <circle cx="32" cy="46" r="20" fill="${got ? t.card : '#000'}" stroke="${ink}" stroke-width="2"/>
    ${got ? `<g transform="translate(18 32) scale(.58)">${em}</g><path d="M14 36 A20 20 0 0 1 26 24" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>` : ''}
  </svg>`;
}
function storyMedalSVG(got) {
  return `<svg viewBox="0 0 64 76" aria-hidden="true">
    <path d="M32 70 C12 56 4 44 4 32 C4 20 13 13 22 13 C27 13 30 16 32 19 C34 16 37 13 42 13 C51 13 60 20 60 32 C60 44 52 56 32 70Z"
      fill="${got ? '#FF9EB8' : '#000'}" stroke="${got ? '#5A2140' : '#000'}" stroke-width="3" stroke-linejoin="round"/>
    ${got ? '<path d="M14 30 C14 24 18 21 22 21" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".85"/><path d="M32 30 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="#FFE07A" stroke="#5A2140" stroke-width="2" stroke-linejoin="round"/>' : ''}
  </svg>`;
}

export function render(root, params, app) {
  const st = app.state;
  const worlds = app.content.WORLDS;
  const p = xpProgress(st.xp);
  const allStars = worlds.reduce((a, w) => a + worldGames(w.id).reduce((b, g) => b + gameStars(st, g.id), 0), 0);
  const maxStars = worlds.reduce((a, w) => a + worldGames(w.id).length * 3, 0);
  const pr = st.placement_result;
  const eng = pr === null ? '—' : (pr || 'A1');
  const tr = st.trophies || 0;
  const ai = ARENAS.reduce((k, a, i) => (tr >= a[0] ? i : k), 0);
  const timers = [];

  // ── картка гравця
  const lumiBox = h('div', { class: 'pc-lumi' });
  const R = 46; const C = 2 * Math.PI * R;
  const ring = svgFrom(`<svg class="pc-ring" viewBox="0 0 108 108" aria-hidden="true">
    <circle cx="54" cy="54" r="${R}" class="pc-ring-bg"/>
    <circle cx="54" cy="54" r="${R}" class="pc-ring-fg" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}" transform="rotate(-90 54 54)"/></svg>`);
  const lvlN = h('b', { text: '0' });
  const card = setI(h('section', { class: 'pcard' },
    h('div', { class: `pc-avatar skin-${ARENA_SKIN[ai] || 'wood'}` },
      h('span', { class: 'pc-frame', 'aria-hidden': 'true' }), lumiBox,
      h('span', { class: 'pc-arena-tag', text: ARENAS[ai][1] })),
    h('div', { class: 'pc-id' },
      h('h1', { class: 'pc-name title-sticker', text: st.name }),
      h('p', { class: 'pc-rank', text: rankOf(p.level) }),
      h('div', { class: 'pc-lvl' },
        h('span', { class: 'pc-lvl-ring' }, ring, h('span', { class: 'pc-lvl-n' }, h('small', { text: 'рівень' }), lvlN)),
        h('span', { class: 'pc-xp' }, h('b', { text: `${st.xp} XP` }), h('small', { text: `ще ${p.need} XP до рівня ${p.level + 1}` }))))), 0);

  // ── статистика
  const stat = (cls, ico, n, label, suffix = '') => h('div', { class: `pst ${cls}` },
    h('span', { class: 'pst-ico', 'aria-hidden': 'true', text: ico }),
    h('b', h('span', { class: 'cnt', data: { to: String(n) }, text: '0' }), suffix),
    h('small', { text: label }));
  const streak = st.streak || 0;
  const stats = setI(h('div', { class: 'pstat-grid' },
    stat('ps-ff', '✨', st.fireflies || 0, plural(st.fireflies || 0, 'слово-світлячок', 'слова-світлячки', 'слів-світлячків')),
    stat('ps-star', '⭐', allStars, `зірок із ${maxStars}`),
    stat('ps-fox', '🃏', st.durak_wins || 0, `${plural(st.durak_wins || 0, 'перемога', 'перемоги', 'перемог')} над Лисом`),
    h('div', { class: 'pst ps-eng' }, h('span', { class: 'pst-ico', 'aria-hidden': 'true', text: '🇬🇧' }), h('b', { text: eng }), h('small', { text: 'рівень за тестом' }))), 1);

  // ── стрік-календар тижня
  const week = weekActivity(st);
  const cal = setI(h('section', { class: 'psec streak-cal' },
    h('div', { class: 'sc-head' },
      h('span', { class: 'sc-flame', 'aria-hidden': 'true', text: '🔥' }),
      h('b', { text: `${streak} ${plural(streak, 'день', 'дні', 'днів')} поспіль` }),
      h('small', { text: streak >= 7 ? 'Тиждень без перерви!' : 'Грай щодня, щоб вогник ріс' })),
    h('ol', { class: 'sc-days' }, week.map((d, i) => setI(h('li', { class: `${d.on ? 'on' : ''}${d.today ? ' today' : ''}${d.future ? ' future' : ''}` },
      h('span', { class: 'sc-dot', 'aria-hidden': 'true' }), h('small', { text: DAYS[i] })), i)))), 2);

  // ── медалі
  const medals = h('div', { class: 'medal-grid' });
  let mi = 0;
  worlds.forEach((w) => {
    const got = st.badges.includes(w.id);
    medals.append(setI(h('div', { class: `pmedal${got ? ' got' : ''}`, title: got ? `Переможено: ${w.boss && w.boss.name}` : 'Ще не здобуто' },
      h('span', { class: 'medal-art' }, svgFrom(medalSVG(w.id, got))),
      h('small', { text: got ? w.name : '???' })), mi++));
  });
  worlds.forEach((w) => {
    if (!w.story) return;
    const got = st.story_badges.includes(w.id);
    medals.append(setI(h('div', { class: `pmedal story${got ? ' got' : ''}` },
      h('span', { class: 'medal-art' }, svgFrom(storyMedalSVG(got))),
      h('small', { text: got ? w.story.cast : '???' })), mi++));
  });
  const badgeCount = st.badges.length + st.story_badges.length;

  // ── дракони
  const drag = h('div', { class: 'dragon-row' });
  Object.keys(ELEMENTS).forEach((el, i) => {
    const has = st.dragons[el] !== undefined;
    const sg = stageOf(st.dragons[el] || 0);
    drag.append(setI(h('button', {
      class: `dcard${has ? ' has' : ''}${st.active_dragon === el ? ' active' : ''}`, type: 'button',
      'aria-label': has ? `${ELEMENTS[el]}, ${sg[2]}` : 'Ще не знайдено',
      on: { click: () => { app.tg.tap('light'); if (has) app.go('dragons'); else toast('Цей дракон чекає в яйці за босом одного зі світів 🥚'); } },
    },
    h('img', { src: app.asset(`dragon/${el}_${has ? sg[0] : 'adult'}.png`), alt: '', loading: 'lazy' }),
    h('b', { text: has ? `${ELEMENT_EMOJI[el]} ${ELEMENTS[el]}` : '???' }),
    h('small', { text: has ? sg[2] : 'не знайдено' })), i));
  });

  // ── кубки й арени
  const next = ARENAS[ai + 1];
  const span = ARENAS[ARENAS.length - 1][0];
  const posOf = (v) => Math.min(1, v / span);
  const arenaTrack = h('div', { class: 'ar-track' },
    h('span', { class: 'ar-fill', style: { transform: 'scaleX(0)' } }),
    ARENAS.map((a, i) => {
      const n = h('span', { class: `ar-node${i <= ai ? ' on' : ''}${i === ai ? ' cur' : ''}`, title: a[1] },
        h('i', { 'aria-hidden': 'true' }), h('small', { text: String(a[0]) }));
      n.style.left = `${posOf(a[0]) * 100}%`;
      return n;
    }));
  const trN = h('b', { class: 'ar-n', text: '0' });
  const arena = setI(h('section', { class: 'psec arena-card' },
    h('div', { class: 'ar-head' },
      h('span', { class: 'ar-cup', 'aria-hidden': 'true', text: '🏆' }),
      h('div', h('div', { class: 'ar-count' }, trN, h('span', { text: ` ${plural(tr, 'кубок', 'кубки', 'кубків')}` })),
        h('p', { class: 'ar-name', text: ARENAS[ai][1] }))),
    arenaTrack,
    h('p', { class: 'ar-next', text: next ? `До «${next[1]}» — ще ${next[0] - tr} 🏆. Перемагай босів на арені.` : 'Найвища арена! Ти — легенда неба 🌟' })), 4);

  // ── налаштування
  const settings = h('div', { class: 'prof-actions' },
    button('🧭 Пройти тест рівня знову', { variant: 'secondary', onClick: () => app.go('placement') }),
    button('Скинути прогрес', {
      variant: 'ghost-danger', haptic: 'medium',
      onClick: async () => {
        const ok = await confirmDialog('Усі зірки, XP, медалі, кубки й дракони зникнуть назавжди. Почати гру з нуля?', {
          title: 'Скинути прогрес?', okLabel: 'Так, скинути', cancelLabel: 'Ні, залишити', danger: true,
        });
        if (!ok) return;
        await app.reset();
        toast('Прогрес скинуто. Нова пригода! 🌱');
      },
    }));

  const sec = (title, extra, i) => setI(h('h2', { class: 'sec-title' }, title, extra ? h('span', { class: 'sec-extra', text: extra }) : null), i);
  root.append(h('div', { class: 'profile' },
    card, stats, cal,
    sec('Медалі', `${badgeCount}/${worlds.length * 2}`, 3), setI(medals, 3),
    sec('Арени й кубки', null, 4), arena,
    sec('Колекція драконів', `${Object.keys(st.dragons).length}/${Object.keys(ELEMENTS).length}`, 5), setI(drag, 5),
    sec('Налаштування', null, 6), setI(settings, 6)));

  const lumi = app.makeLumi(lumiBox, { size: 96, emotion: 'proud' });
  lumi.react && lumi.react('jump');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fx.countUp(lvlN, 0, p.level, 700);
    fx.countUp(trN, 0, tr, 900);
    ring.querySelector('.pc-ring-fg').style.strokeDashoffset = (C * (1 - p.pct)).toFixed(1);
    root.querySelectorAll('.pst .cnt').forEach((n, k) => fx.countUp(n, 0, +n.dataset.to, 800 + k * 120));
    arenaTrack.querySelector('.ar-fill').style.transform = `scaleX(${posOf(tr)})`;
  }));
  return () => timers.forEach(clearTimeout);
}
