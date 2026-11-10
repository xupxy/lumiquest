// 🌍 Світ: інтро, 4 квести (⭐), 💌 історія, ⚔️ бос-арена.
import { h, starsRow, fx, toast } from './ui.js';
import { bossOpen, getWorld, worldIndex } from './state.js';

export function render(root, params, app) {
  const st = app.state;
  const w = getWorld(params.wid);
  if (!w || !st.unlocked.includes(w.id)) {
    toast('Цей світ ще спить 🔒');
    setTimeout(() => app.back(), 0);
    return undefined;
  }
  const qs = w.quests || [];
  const doneN = qs.filter((q) => (st.stars[q.id] || 0) > 0).length;
  const nextQ = qs.find((q) => !(st.stars[q.id] > 0));
  const wi = worldIndex(w.id);

  const lumiBox = h('div', { class: 'world-lumi' });
  const tag = st.badges.includes(w.id) ? h('span', { class: 'pill pill-gold', text: '🏅 Боса переможено' })
    : st.by_test.includes(w.id) ? h('span', { class: 'pill', text: '📘 Зараховано за тестом' }) : null;

  const head = h('div', { class: `world-head wh-${wi + 1}` },
    h('div', { class: 'world-emblem', 'aria-hidden': 'true', text: w.emoji }),
    h('div', { class: 'world-hd-txt' },
      h('span', { class: 'pill pill-lvl', text: `Світ ${wi + 1} · ${w.level}` }),
      h('h1', { class: 'title-sticker', text: w.name }),
      tag),
    lumiBox);

  const intro = h('p', { class: 'world-intro', text: w.intro });

  const list = h('ol', { class: 'quest-path' });
  qs.forEach((q, i) => {
    const s = st.stars[q.id] || 0;
    const isNext = nextQ && q.id === nextQ.id;
    list.append(h('li', h('button', {
      class: `quest-row${s ? ' done' : ''}${isNext ? ' next' : ''}`,
      type: 'button',
      style: { '--i': i },
      on: { click: () => { app.tg.tap('medium'); app.go('quest', { qid: q.id }); } },
    },
    h('span', { class: 'q-num', text: String(i + 1) }),
    h('span', { class: 'q-emoji', 'aria-hidden': 'true', text: q.emoji }),
    h('span', { class: 'q-txt' }, h('b', { text: q.title }), starsRow(s, 3, 'sm')),
    isNext ? h('span', { class: 'q-go', text: 'Грати' }) : h('span', { class: 'q-chev', 'aria-hidden': 'true', text: '›' }))));
  });

  // 💌 історія — відкрита одразу разом зі світом
  const story = w.story;
  const extra = h('div', { class: 'world-extra' });
  if (story) {
    const n = (story.scenes || []).length;
    const best = st.story_best[w.id] || 0;
    extra.append(h('button', {
      class: 'mode-row mode-story', type: 'button',
      on: { click: () => { app.tg.tap('medium'); app.go('story', { wid: w.id }); } },
    },
    h('span', { class: 'mode-ico', 'aria-hidden': 'true' }, h('img', { src: app.asset(`story/${w.id}.png`), alt: '', loading: 'lazy' })),
    h('span', { class: 'mode-txt' },
      h('span', { class: 'mode-k', text: '💌 Історія' }),
      h('b', { text: story.title }),
      h('span', { class: 'mode-sub', text: `${story.cast} · 💗 ${best}/${n}${st.story_badges.includes(w.id) ? ' · 🏅' : ''}` })),
    h('span', { class: 'q-chev', 'aria-hidden': 'true', text: '›' })));
  }

  // ⚔️ бос-арена — після 4 квестів
  const boss = w.boss || {};
  const open = bossOpen(st, w.id);
  const bossBtn = h('button', {
    class: `mode-row mode-boss${open ? '' : ' locked'}`, type: 'button',
    on: {
      click: () => {
        if (!open) {
          app.tg.notify('warning');
          fx.shake(bossBtn);
          toast(`Арена відкриється, коли пройдеш усі ${qs.length} квести 🔒`);
          return;
        }
        app.tg.tap('heavy');
        app.go('arena', { wid: w.id });
      },
    },
  },
  h('span', { class: 'mode-ico boss-ico', 'aria-hidden': 'true', text: open ? boss.emoji || '👾' : '🔒' }),
  h('span', { class: 'mode-txt' },
    h('span', { class: 'mode-k', text: '⚔️ Бос-арена' }),
    h('b', { text: boss.name || 'Бос' }),
    h('span', { class: 'mode-sub', text: open ? (st.badges.includes(w.id) ? 'Переможено 🏅 · можна ще раз за 🏆' : '6 ударів — і вежа впаде!') : `Квестів пройдено: ${doneN}/${qs.length}` })),
  open ? h('span', { class: 'q-go hot', text: 'В бій' }) : h('span', { class: 'boss-lock', 'aria-hidden': 'true' },
    h('i', { style: { transform: `scaleX(${qs.length ? doneN / qs.length : 0})` } })));
  extra.append(bossBtn);

  root.append(h('div', { class: 'world' }, head, intro,
    h('h2', { class: 'sec-title', text: 'Квести' }), list,
    h('h2', { class: 'sec-title', text: 'Пригоди світу' }), extra));

  app.makeLumi(lumiBox, { size: 92, emotion: nextQ ? 'excited' : 'proud' });
}
