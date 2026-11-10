// 👤 Профіль: рівень, XP, світлячки, бейджі, кубки й арена, дракон, стрік.
import { h, button, plural, fx, confirmDialog, toast } from './ui.js';
import { xpProgress, arenaName, ARENAS, stageOf, ELEMENTS, ELEMENT_EMOJI } from './state.js';

export function render(root, params, app) {
  const st = app.state;
  const worlds = app.content.WORLDS;
  const p = xpProgress(st.xp);
  const totalQ = worlds.reduce((a, w) => a + (w.quests || []).length, 0);
  const gotStars = worlds.reduce((a, w) => a + (w.quests || []).reduce((b, q) => b + (st.stars[q.id] || 0), 0), 0);
  const pr = st.placement_result;
  const eng = pr === null ? '—' : (pr || 'A1');

  const lumiBox = h('div', { class: 'prof-lumi' });
  const xpFill = h('i');
  const lvlN = h('b', { class: 'prof-lvl-n', text: '0' });
  const head = h('div', { class: 'prof-head' },
    lumiBox,
    h('div', { class: 'prof-id' },
      h('h1', { class: 'title-sticker', text: st.name }),
      h('div', { class: 'prof-lvl' },
        h('span', { class: 'lvl-badge' }, h('small', { text: 'рівень' }), lvlN),
        h('div', { class: 'prof-xp' },
          h('span', { class: 'prof-xp-txt', text: `${st.xp} XP · до наступного ${p.need}` }),
          h('span', { class: 'xp-bar big' }, xpFill)))));

  const stat = (ico, val, label, cls = '') => h('div', { class: `pstat ${cls}` },
    h('span', { class: 'pstat-ico', 'aria-hidden': 'true', text: ico }), h('b', { text: val }), h('small', { text: label }));
  const streak = st.streak || 0;
  const stats = h('div', { class: 'pstats' },
    stat('✨', st.fireflies, plural(st.fireflies, 'Слово-Світлячок', 'Слова-Світлячки', 'Слів-Світлячків'), 'wide'),
    stat('⭐', `${gotStars}/${totalQ * 3}`, 'зірок'),
    stat('🔥', streak, `${plural(streak, 'день', 'дні', 'днів')} поспіль`),
    stat('🇬🇧', eng, 'рівень за тестом'),
    stat('🃏', st.durak_wins || 0, `${plural(st.durak_wins || 0, 'перемога', 'перемоги', 'перемог')} над Лисом`));

  // арена
  const tr = st.trophies || 0;
  const ai = ARENAS.reduce((k, a, i) => (tr >= a[0] ? i : k), 0);
  const next = ARENAS[ai + 1];
  const arenaPct = next ? (tr - ARENAS[ai][0]) / (next[0] - ARENAS[ai][0]) : 1;
  const arena = h('div', { class: 'p-arena card' },
    h('div', { class: 'p-arena-top' },
      h('span', { class: 'p-trophy', 'aria-hidden': 'true', text: '🏆' }),
      h('div', h('b', { class: 'p-tr-n', text: String(tr) }), h('span', { class: 'muted', text: ` ${plural(tr, 'кубок', 'кубки', 'кубків')}` }),
        h('p', { class: 'p-arena-name', text: arenaName(tr) }))),
    h('div', { class: 'arena-ladder', 'aria-hidden': 'true' }, ARENAS.map((a, i) => h('i', { class: i <= ai ? 'on' : '' }))),
    h('p', { class: 'muted small', text: next ? `До «${next[1]}» — ще ${next[0] - tr} 🏆` : 'Найвища арена! 🌟' }));
  arena.querySelector('.arena-ladder').style.setProperty('--pct', arenaPct);

  // дракон
  const el = st.active_dragon;
  const g = st.dragons[el] || 0;
  const sg = stageOf(g);
  const dragon = h('button', { class: 'p-dragon card', type: 'button', on: { click: () => app.go('dragons') } },
    h('img', { src: app.asset(`dragon/${el}_${sg[0]}.png`), alt: '' }),
    h('span', h('small', { class: 'muted', text: 'Твій дракон' }), h('b', { text: `${ELEMENT_EMOJI[el]} ${ELEMENTS[el]}` }),
      h('span', { class: 'muted', text: `${sg[2]} · драконів: ${Object.keys(st.dragons).length}` })),
    h('span', { class: 'q-chev', 'aria-hidden': 'true', text: '›' }));

  // бейджі
  const badges = h('div', { class: 'badges' });
  worlds.forEach((w, i) => {
    const got = st.badges.includes(w.id);
    badges.append(h('div', { class: `badge${got ? ' got' : ''}`, style: { '--i': i }, title: got ? `Переможено: ${w.boss && w.boss.name}` : 'Ще не здобуто' },
      h('span', { class: 'badge-medal', text: got ? w.emoji : '?' }), h('small', { text: w.name })));
  });
  worlds.forEach((w, i) => {
    if (!w.story) return;
    const got = st.story_badges.includes(w.id);
    badges.append(h('div', { class: `badge story${got ? ' got' : ''}`, style: { '--i': i + 5 } },
      h('span', { class: 'badge-medal', text: got ? '💌' : '?' }), h('small', { text: w.story.cast })));
  });
  const badgeCount = st.badges.length + st.story_badges.length;

  const actions = h('div', { class: 'prof-actions' },
    button('🔁 Пройти тест знову', { variant: 'secondary', onClick: () => app.go('placement') }),
    button('Скинути прогрес', {
      variant: 'ghost-danger', haptic: 'medium',
      onClick: async () => {
        const ok = await confirmDialog('Усі зірки, XP, бейджі, кубки й дракони зникнуть назавжди. Почати гру з нуля?', {
          title: 'Скинути прогрес?', okLabel: 'Так, скинути', cancelLabel: 'Ні, залишити', danger: true,
        });
        if (!ok) return;
        await app.reset();
        toast('Прогрес скинуто. Нова пригода! 🌱');
      },
    }));

  root.append(h('div', { class: 'profile' }, head, stats,
    h('h2', { class: 'sec-title', text: 'Арена' }), arena,
    h('h2', { class: 'sec-title', text: 'Дракон' }), dragon,
    h('h2', { class: 'sec-title' }, 'Бейджі ', h('span', { class: 'muted', text: `${badgeCount}/${worlds.length * 2}` })), badges,
    actions));

  app.makeLumi(lumiBox, { size: 104, emotion: 'proud' });
  requestAnimationFrame(() => {
    fx.countUp(lvlN, 0, p.level, 600);
    xpFill.style.transform = `scaleX(${p.pct})`;
  });
}
