// 🏛 Вгадай пам'ятку (v19) — силует + 3 підказки англійською, 4 варіанти. Помилка відкриває наступну підказку (менше балів).
// Дані: country.landmarks = [{id, name, hints:[3], opts:[4], a, emoji?}] (a — індекс або назва).
import { h } from './ui.js?v=20261112122053';
import { t } from './i18n.js?v=20261112122053';
import * as S from './state.js?v=20261112122053';
import { runQuiz, emptyScreen, flagOf, anim, shuffle, say } from './travel.js?v=20261112122053';

const ICONS = [[/big ben|clock|elizabeth tower/i, '🕰'], [/eiffel|tokyo tower|n seoul|namsan|cn tower|tower/i, '🗼'], [/liberty/i, '🗽'], [/fuji|mount|mt\.?\b|peak|hill|rock|uluru/i, '🗻'],
  [/colosse|arena|stadium|maracan/i, '🏟'], [/bridge/i, '🌉'], [/shrine|temple|torii|gate|gyeongbok|palace/i, '⛩'], [/castle|fort/i, '🏰'],
  [/church|cathedral|sagrada|notre|abbey|basilica|duomo|christ|cristo/i, '⛪'], [/opera/i, '🎭'], [/fall|niagara/i, '🌊'], [/canyon|desert/i, '🏜'],
  [/statue|david/i, '🗿'], [/beach|bondi|copacabana/i, '🏖'], [/reef/i, '🐠'], [/pisa|lean/i, '🗼'], [/square|street|market/i, '🏙'], [/museum|louvre|gallery/i, '🖼'], [/park|garden/i, '🌳']];
const iconOf = (l) => l.emoji || (ICONS.find(([re]) => re.test(`${l.name} ${l.id || ''}`)) || [0, '🏛'])[1];
const ansIdx = (l) => (Number.isInteger(l.a) ? l.a : Math.max(0, (l.opts || []).indexOf(l.a ?? l.name)));

export function render(root, params, app) {
  const cid = params.cid || params.wid;
  const c = S.getWorld(cid);
  const list = ((c && c.landmarks) || []).filter((l) => l && l.name && Array.isArray(l.hints) && l.hints.length);
  if (list.length < 2) { emptyScreen(root, app, t('lm.title')); return undefined; }
  const names = list.map((l) => l.name);
  const rounds = shuffle(list).slice(0, 8).map((l) => {
    let right = Array.isArray(l.opts) && l.opts.length >= 2 ? l.opts[ansIdx(l)] : l.name;
    let base = Array.isArray(l.opts) && l.opts.length >= 2 ? l.opts.slice() : [l.name, ...shuffle(names.filter((n) => n !== l.name)).slice(0, 3)];
    if (!base.includes(right)) right = base[0];
    const opts = shuffle(base);
    let shown = 1;
    const hints = h('ol', { class: 'lm-hints' });
    const addHint = () => {
      const li = h('li', { class: 'en', text: l.hints[shown - 1] });
      hints.append(li);
      anim(li, [{ opacity: 0, transform: 'translate3d(0,8px,0)' }, { opacity: 1, transform: 'none' }], { duration: 240 });
      say(app, l.hints[shown - 1]);
    };
    const ico = iconOf(l);
    const sil = h('div', { class: 'lm-sil', 'aria-hidden': 'true' }, h('span', { class: 'lm-dark', text: ico }), h('span', { class: 'lm-color', text: ico }));
    return {
      prompt: h('div', { class: 'lm-box' }, sil, h('p', { class: 'lm-q', text: t('lm.q') }), hints),
      opts, a: opts.indexOf(right),
      onShow: () => { hints.append(h('li', { class: 'en', text: l.hints[0] })); },
      retry: () => { if (shown >= l.hints.length) return false; shown += 1; addHint(); return true; },
      weight: () => [1, 0.75, 0.5][shown - 1] ?? 0.5,
      onAnswer: () => { sil.classList.add('on'); },
      note: '',
    };
  });
  return runQuiz(root, app, { title: `${flagOf(c)} ${t('lm.title')}`, intro: t('lm.intro'), rounds, gameId: `${cid}-landmark`, wid: cid });
}
