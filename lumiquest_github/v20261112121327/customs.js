// 🛂 Митниця (v19) — на вході в кожну країну: офіцер питає англійською (Purpose of your visit?…), гравець обирає відповідь.
// Дані: country.customs = [{q, opts:[3], a}] (a — індекс або текст правильної відповіді); немає — загальні питання нижче.
import { h } from './ui.js?v=20261112121326';
import { t, tc } from './i18n.js?v=20261112121326';
import * as S from './state.js?v=20261112121326';
import { runQuiz, emptyScreen, flagOf, anim, shuffle, lite } from './travel.js?v=20261112121326';

const GENERIC = [
  { q: 'Good morning! May I see your passport, please?', opts: ['Sure, here you are.', 'No, I am a passport.', 'Yes, I see it.'], a: 0 },
  { q: 'What is the purpose of your visit?', opts: ['I\'m here on holiday.', 'It is purple.', 'I visited yesterday.'], a: 0 },
  { q: 'How long are you going to stay?', opts: ['For two weeks.', 'Very long hair.', 'I stay at the tall.'], a: 0 },
  { q: 'Where will you be staying?', opts: ['At a hotel in the city centre.', 'I will be stay.', 'On Monday.'], a: 0 },
  { q: 'Do you have anything to declare?', opts: ['No, nothing to declare.', 'Yes, I declare you.', 'I have a declare.'], a: 0 },
];
const ansIdx = (it) => (Number.isInteger(it.a) ? it.a : Math.max(0, (it.opts || []).indexOf(it.a)));

export function render(root, params, app) {
  const cid = params.cid || params.wid;
  const c = S.getWorld(cid);
  if (!c) { emptyScreen(root, app, t('cu.title')); return undefined; }
  const src = (Array.isArray(c.customs) && c.customs.length >= 3 ? c.customs : GENERIC)
    .filter((it) => it && it.q && Array.isArray(it.opts) && it.opts.length >= 2);
  const rounds = src.slice(0, 6).map((it) => {
    const right = it.opts[ansIdx(it)];
    const opts = shuffle(it.opts);
    return {
      prompt: h('div', { class: 'cu-desk' },
        h('div', { class: 'cu-officer', 'aria-hidden': 'true' }, h('span', { text: '👮' }), h('small', { text: t('cu.officer') })),
        h('div', { class: 'cu-bubble' }, h('p', { class: 'en', text: it.q }),
          h('button', { class: 'cu-say', type: 'button', 'aria-label': '🔊', on: { click: () => { try { app.audio.speak?.(it.q, { lang: 'en-US', rate: 0.9 }); } catch (e) { /* */ } } } }, '🔊'))),
      opts, a: opts.indexOf(right), speak: it.q,
    };
  });
  return runQuiz(root, app, {
    title: `${flagOf(c)} ${t('cu.title')}`, intro: t('cu.intro'), rounds, gameId: `${cid}-customs`, wid: cid,
    finishExtra: (stars) => {
      const stamp = h('div', { class: `cu-stamp${stars ? '' : ' no'}` },
        h('span', { class: 'cu-st-flag', text: flagOf(c) }), h('b', { text: stars ? 'ENTRY' : 'DENIED' }), h('small', { text: tc(c, 'name') || '' }));
      const wrap = h('div', { class: 'cu-stamp-wrap' }, stamp, h('p', { text: stars ? t('cu.stamp') : t('cu.denied') }));
      setTimeout(() => anim(stamp, [{ opacity: 0, transform: 'scale(2.4) rotate(-24deg)' }, { opacity: 1, transform: 'scale(.92) rotate(-12deg)', offset: 0.7 }, { opacity: 1, transform: 'rotate(-12deg)' }],
        { duration: lite() ? 260 : 520, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' }), 60);
      return wrap;
    },
  });
}
