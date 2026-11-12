// 🗯 Сленг і акцент (v19) — місцеве слово (з озвучкою) → що воно означає англійською. Дані: country.slang = [{w, en, uk, ru, ex}].
import { h } from './ui.js?v=20261112180927';
import { t } from './i18n.js?v=20261112180927';
import * as S from './state.js?v=20261112180927';
import { runQuiz, emptyScreen, flagOf, optionsWith, shuffle, isRu } from './travel.js?v=20261112180927';

export function render(root, params, app) {
  const cid = params.cid || params.wid;
  const c = S.getWorld(cid);
  const list = ((c && c.slang) || []).filter((x) => x && x.w && x.en);
  if (list.length < 4) { emptyScreen(root, app, t('sl.title')); return undefined; }
  const pool = list.map((x) => x.en);
  const rounds = shuffle(list).slice(0, 10).map((x) => {
    const { opts, a } = optionsWith(x.en, pool);
    const tr = isRu() ? (x.ru || x.uk) : x.uk;
    return {
      prompt: h('div', { class: 'sl-word' },
        h('button', { class: 'sl-say', type: 'button', on: { click: () => { try { app.audio.speak?.(x.w, { lang: 'en-US', rate: 0.85 }); } catch (e) { /* */ } } } },
          h('span', { class: 'sl-w en', text: x.w }), h('span', { 'aria-hidden': 'true', text: ' 🔊' })),
        h('p', { class: 'sl-q', text: t('sl.q', { w: x.w }) })),
      opts, a, speak: x.w,
      note: [tr ? `(${tr})` : '', x.ex ? `— “${x.ex}”` : ''].filter(Boolean).join(' '),
    };
  });
  return runQuiz(root, app, { title: `${flagOf(c)} ${t('sl.title')}`, intro: t('sl.intro'), rounds, gameId: `${cid}-slang`, wid: cid });
}
