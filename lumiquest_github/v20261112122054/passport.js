// 🛂 Паспорт мандрівника (v19) — сторінки зі штампами країн (дата, ⭐), фото гіда, «вивчено N слів».
import { h } from './ui.js?v=20261112122053';
import { t, tc } from './i18n.js?v=20261112122053';
import * as S from './state.js?v=20261112122053';
import { head, flagOf, anim, wordsLearned, lite } from './travel.js?v=20261112122053';

export const meta = { topbar: true };

export function render(root, params, app) {
  const st = app.state;
  const L = S.countryList();
  const pp = st.passport || {};
  const n = L.filter((c) => pp[c.id]).length;
  const chars = [];
  let alive = true;
  const cover = h('div', { class: 'pp-cover' },
    h('div', { class: 'pp-emb', 'aria-hidden': 'true', text: '🌍' }),
    h('div', { class: 'pp-who' }, h('small', { text: t('pp.holder') }), h('b', { text: st.name || '' })),
    h('div', { class: 'pp-sum' }, h('span', { text: t('pp.stamps', { n, total: L.length || 10 }) }), h('span', { text: t('pp.words', { n: wordsLearned(app) }) })));
  const pages = h('div', { class: 'pp-pages' });
  L.forEach((c, i) => {
    const s = pp[c.id];
    const guide = h('div', { class: 'pp-guide', 'aria-hidden': 'true' });
    const page = h('div', { class: `pp-page${s ? ' on' : ''}` },
      h('div', { class: 'pp-top' }, h('span', { class: 'pp-flag', text: flagOf(c) }), h('b', { text: tc(c, 'name') || c.id }), h('small', { text: `#${i + 1}` })),
      guide,
      s ? h('div', { class: 'pp-stamp', style: { '--r': `${((i * 37) % 24) - 12}deg` } },
        h('span', { class: 'pp-st-flag', text: flagOf(c) }), h('b', { text: (c.name || c.id).toUpperCase().slice(0, 14) }),
        h('small', { text: s.date }), h('i', { text: '⭐'.repeat(s.stars || 1) }))
        : h('div', { class: 'pp-none', text: t('pp.empty') }));
    if (s) page.addEventListener('click', () => app.go('world', { wid: c.id }));
    pages.append(page);
    if (s && c.guide) {
      import('./characters.js?v=20261112122053').then((m) => {
        if (!alive) return;
        try { chars.push(m.createCharacter(guide, String(c.guide).toLowerCase(), { size: 64, mood: 'idle' })); } catch (e) { /* */ }
      }).catch(() => {});
    }
  });
  root.append(h('div', { class: 'pp' }, head(app, `🛂 ${t('pp.title')}`), cover, pages,
    h('button', { class: 'btn btn-primary pp-globe', type: 'button', on: { click: () => app.go('globe') } }, t('pp.toGlobe'))));
  if (!lite()) [...pages.querySelectorAll('.pp-stamp')].forEach((el, k) => { const r = el.style.getPropertyValue('--r'); anim(el, [{ opacity: 0, transform: `scale(1.8) rotate(${r})` }, { opacity: 1, transform: `scale(1) rotate(${r})` }], { duration: 380, delay: 120 + k * 90, fill: 'backwards', easing: 'cubic-bezier(.3,1.4,.5,1)' }); });
  return () => { alive = false; chars.forEach((c) => { try { c.destroy?.(); } catch (e) { /* */ } }); };
}
