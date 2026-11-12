// 🗺 Вікторина «Звідки це?» (v19) — на глобусі, відкривається після 3 пройдених країн.
// Сленг / пам'ятка / свято відкритих країн → обери країну з 4 (прапор + назва). Результат — state.quiz_where (0..3 ⭐).
import { h } from './ui.js?v=20261112171845';
import { t, tc } from './i18n.js?v=20261112171845';
import * as S from './state.js?v=20261112171845';
import { runQuiz, emptyScreen, flagOf, shuffle, loc } from './travel.js?v=20261112171845';

export const meta = { topbar: true };

export function render(root, params, app) {
  const st = app.state;
  const all = S.countryList();
  const done = all.filter((c) => S.countryDone(st, c.id));
  if (done.length < 3) { app.toast(t('travel.quizLock')); setTimeout(() => app.back(), 0); return undefined; }
  const open = S.openCountries(st);
  const label = (c) => `${flagOf(c)} ${tc(c, 'name') || c.id}`;
  const items = [];
  for (const c of open) {
    for (const s of (c.slang || []).slice(0, 15)) if (s && s.w) items.push({ c, kind: 'slang', main: s.w, sub: s.en, say: s.w });
    for (const l of (c.landmarks || [])) if (l && l.name) items.push({ c, kind: 'landmark', main: l.name, sub: (l.hints || [])[0] || '', say: l.name });
    if (c.festival && c.festival.name) items.push({ c, kind: 'fest', main: loc(c.festival, 'name'), sub: (c.festival.steps || [])[0] || '' });
  }
  if (items.length < 4 || all.length < 2) { emptyScreen(root, app, t('qw.title')); return undefined; }
  // по черзі з різних країн, щоб не було 10 питань про одну
  const byC = new Map();
  shuffle(items).forEach((it) => { if (!byC.has(it.c.id)) byC.set(it.c.id, []); byC.get(it.c.id).push(it); });
  const picked = [];
  while (picked.length < 10 && [...byC.values()].some((l) => l.length)) for (const l of shuffle([...byC.values()])) if (l.length && picked.length < 10) picked.push(l.pop());
  const rounds = picked.map((it) => {
    const others = shuffle(all.filter((c) => c.id !== it.c.id)).slice(0, 3);
    const opts = shuffle([it.c, ...others]);
    return {
      prompt: h('div', { class: 'qw-item' },
        h('small', { class: 'qw-kind', text: t('qw.' + it.kind) }),
        h('b', { class: 'qw-main en', text: it.main }),
        it.sub ? h('p', { class: 'qw-sub en', text: it.sub }) : null),
      opts: opts.map(label), a: opts.indexOf(it.c), speak: it.say,
    };
  });
  return runQuiz(root, app, {
    title: t('qw.title'), intro: t('qw.intro'), rounds,
    onFinish: (stars) => { st.quiz_where = Math.max(st.quiz_where || 0, stars); },
  });
}
