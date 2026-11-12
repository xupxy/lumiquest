// v19 «🌍 Навколосвітня подорож» — спільне ядро екранів країн: рядки i18n, координати країн,
// маленький каркас вікторини (customs/slang/landmark/quizwhere), фінал із ⭐ і заставка-літачок.
// Анімації — лише transform/opacity (WAAPI), у html[data-perf='lite'] і reduced-motion — мінімум.
import * as S from './state.js?v=20261112121114';
import { addStrings, t, tc, lang } from './i18n.js?v=20261112121114';
import { h } from './ui.js?v=20261112121114';
import { recordGame, starsByRatio } from './games.js?v=20261112121114';

addStrings({
  uk: {
    'travel.btn': 'Подорож', 'travel.sub': 'Країн: {n}/{total}', 'travel.lockSub': 'Після боса світу 3 (B1)',
    'travel.teaser': '🔒 10 країн чекають на тебе! Перемож боса світу 3 (рівень B1) або здай тест рівня на B1 — і Лумі полетить у подорож.',
    'travel.countryN': 'Країна {n} · {level}', 'travel.title': 'Навколосвітня подорож',
    'travel.introTitle': 'Навколосвітня подорож починається!', 'travel.introSub': 'Лумі сідає в літачок: 10 країн, нові друзі, слова й традиції.',
    'travel.go': 'Летимо! ✈️', 'travel.fly': 'Летіти ✈️', 'travel.done': 'Пройдено', 'travel.open': 'Відкрито', 'travel.closed': 'Закрито',
    'travel.lockedC': 'Спершу пройди країну «{name}»', 'travel.passport': 'Паспорт', 'travel.quiz': 'Звідки це?', 'travel.quizLock': 'Після 3 країн',
    'travel.noData': 'Ця країна ще готується до прийому гостей 🧳', 'travel.swipe': 'Крути глобус пальцем 👆',
    'travel.notYet': 'Подорож ще не відкрита', 'travel.next': 'Наступна зупинка',
    'pp.title': 'Паспорт мандрівника', 'pp.holder': 'Власник', 'pp.words': 'Вивчено слів: {n}', 'pp.stamps': 'Штампів: {n}/{total}',
    'pp.empty': 'Ще не відвідано', 'pp.guide': 'Гід', 'pp.toGlobe': '🌍 До глобуса',
    'game.customs': 'Митниця', 'game.slang': 'Сленг і акцент', 'game.landmark': 'Вгадай пам\'ятку', 'game.festival': 'Свято', 'game.special': 'Міні-гра країни',
    'tq.start': '▶ Почати', 'tq.next': 'Далі ➡️', 'tq.again': '🔁 Ще раз', 'tq.path': '🗺 До стежки', 'tq.score': '{ok} з {n}',
    'tq.great': 'Чудово! 🎉', 'tq.good': 'Непогано! 👍', 'tq.try': 'Спробуй ще раз 💪', 'tq.right': 'Правильно!', 'tq.wrong': 'Правильна відповідь:',
    'tq.listen': '🔊 Послухати', 'tq.empty': 'Для цієї гри ще немає даних 🧳',
    'cu.title': '🛂 Митниця', 'cu.intro': 'Офіцер на кордоні ставить питання англійською. Відповідай ввічливо — і отримаєш штамп в\'їзду!',
    'cu.officer': 'Офіцер', 'cu.stamp': 'Штамп в\'їзду отримано!', 'cu.denied': 'Офіцер просить спробувати ще раз',
    'sl.title': '🗯 Сленг і акцент', 'sl.intro': 'Місцеві кажуть по-своєму! Що означає слово?', 'sl.q': 'Що означає «{w}»?',
    'lm.title': '🏛 Вгадай пам\'ятку', 'lm.intro': 'Силует і підказки англійською. Чим менше підказок — тим краще!', 'lm.q': 'Що це за пам\'ятка?', 'lm.more': '💡 Ще підказка',
    'fe.title': '🎉 Свято', 'fe.intro': 'Розстав кроки свята в правильному порядку: тапай їх по черзі.', 'fe.check': '✅ Перевірити', 'fe.why': 'Чому так?', 'fe.undo': '↩️ Назад',
    'qw.title': '🗺 Звідки це?', 'qw.intro': 'Слово, пам\'ятка чи свято — вгадай країну!', 'qw.slang': 'Де так кажуть?', 'qw.landmark': 'Де ця пам\'ятка?', 'qw.fest': 'Де це свято?', 'qw.fact': 'Про яку країну це?',
  },
  ru: {
    'travel.btn': 'Путешествие', 'travel.sub': 'Стран: {n}/{total}', 'travel.lockSub': 'После босса мира 3 (B1)',
    'travel.teaser': '🔒 10 стран ждут тебя! Победи босса мира 3 (уровень B1) или сдай тест уровня на B1 — и Луми полетит в путешествие.',
    'travel.countryN': 'Страна {n} · {level}', 'travel.title': 'Кругосветное путешествие',
    'travel.introTitle': 'Кругосветное путешествие начинается!', 'travel.introSub': 'Луми садится в самолётик: 10 стран, новые друзья, слова и традиции.',
    'travel.go': 'Летим! ✈️', 'travel.fly': 'Лететь ✈️', 'travel.done': 'Пройдено', 'travel.open': 'Открыто', 'travel.closed': 'Закрыто',
    'travel.lockedC': 'Сначала пройди страну «{name}»', 'travel.passport': 'Паспорт', 'travel.quiz': 'Откуда это?', 'travel.quizLock': 'После 3 стран',
    'travel.noData': 'Эта страна ещё готовится к приёму гостей 🧳', 'travel.swipe': 'Крути глобус пальцем 👆',
    'travel.notYet': 'Путешествие ещё не открыто', 'travel.next': 'Следующая остановка',
    'pp.title': 'Паспорт путешественника', 'pp.holder': 'Владелец', 'pp.words': 'Выучено слов: {n}', 'pp.stamps': 'Штампов: {n}/{total}',
    'pp.empty': 'Ещё не посещено', 'pp.guide': 'Гид', 'pp.toGlobe': '🌍 К глобусу',
    'game.customs': 'Таможня', 'game.slang': 'Сленг и акцент', 'game.landmark': 'Угадай достопримечательность', 'game.festival': 'Праздник', 'game.special': 'Мини-игра страны',
    'tq.start': '▶ Начать', 'tq.next': 'Дальше ➡️', 'tq.again': '🔁 Ещё раз', 'tq.path': '🗺 К тропе', 'tq.score': '{ok} из {n}',
    'tq.great': 'Отлично! 🎉', 'tq.good': 'Неплохо! 👍', 'tq.try': 'Попробуй ещё раз 💪', 'tq.right': 'Правильно!', 'tq.wrong': 'Правильный ответ:',
    'tq.listen': '🔊 Послушать', 'tq.empty': 'Для этой игры ещё нет данных 🧳',
    'cu.title': '🛂 Таможня', 'cu.intro': 'Офицер на границе задаёт вопросы по-английски. Отвечай вежливо — и получишь штамп въезда!',
    'cu.officer': 'Офицер', 'cu.stamp': 'Штамп въезда получен!', 'cu.denied': 'Офицер просит попробовать ещё раз',
    'sl.title': '🗯 Сленг и акцент', 'sl.intro': 'Местные говорят по-своему! Что значит слово?', 'sl.q': 'Что значит «{w}»?',
    'lm.title': '🏛 Угадай достопримечательность', 'lm.intro': 'Силуэт и подсказки на английском. Чем меньше подсказок — тем лучше!', 'lm.q': 'Что это за место?', 'lm.more': '💡 Ещё подсказка',
    'fe.title': '🎉 Праздник', 'fe.intro': 'Расставь шаги праздника в правильном порядке: тапай их по очереди.', 'fe.check': '✅ Проверить', 'fe.why': 'Почему так?', 'fe.undo': '↩️ Назад',
    'qw.title': '🗺 Откуда это?', 'qw.intro': 'Слово, достопримечательность или праздник — угадай страну!', 'qw.slang': 'Где так говорят?', 'qw.landmark': 'Где это место?', 'qw.fest': 'Где этот праздник?', 'qw.fact': 'О какой стране это?',
  },
});

/** Координати (lat, lon) за замовчуванням — порядок v19 ФІНАЛ; контент може дати country.geo = {lat, lon}. */
const GEO = {
  c1: [51.5, -0.1], c2: [39.5, -98.0], c3: [36.2, 138.3], c4: [46.6, 2.3], c5: [42.5, 12.6],
  c6: [40.4, -3.7], c7: [56.1, -106.3], c8: [-25.3, 133.8], c9: [-14.2, -51.9], c10: [36.5, 127.9],
};
const FLAG = { c1: '🇬🇧', c2: '🇺🇸', c3: '🇯🇵', c4: '🇫🇷', c5: '🇮🇹', c6: '🇪🇸', c7: '🇨🇦', c8: '🇦🇺', c9: '🇧🇷', c10: '🇰🇷' };
export function geoOf(c) {
  const g = c && c.geo;
  if (g && Number.isFinite(+g.lat) && Number.isFinite(+g.lon)) return [+g.lat, +g.lon];
  return GEO[c && c.id] || [0, 0];
}
export const flagOf = (c) => (c && (c.emoji || c.flag)) || FLAG[c && c.id] || '🏳️';
export const isRu = () => { try { return lang() === 'ru'; } catch (e) { return false; } };
/** Поле з *_ru (або uk/ru для slang/facts). */
export const loc = (o, f) => (o ? (isRu() ? (o[f + '_ru'] ?? o.ru ?? o[f]) : (o[f] ?? o.uk)) : '');

export const lite = () => document.documentElement.dataset.perf === 'lite';
export const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
export const anim = (el, kf, o) => { try { if (!el || !el.animate || reduced()) return null; return el.animate(kf, o); } catch (e) { return null; } };
export const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const say = (app, txt) => { try { app.audio.speak?.(txt, { lang: 'en-US', rate: 0.92 })?.catch?.(() => {}); } catch (e) { /* */ } };
const sfx = (app, n) => { try { app.audio.sfx?.(n); } catch (e) { /* */ } };
const tap = (app, k) => { try { app.tg.tap?.(k); } catch (e) { /* */ } };

/** Сторінка-«шапка» екрана країни. */
export function head(app, title) {
  return h('header', { class: 'tq-head' },
    h('button', { class: 'tq-back', type: 'button', 'aria-label': '‹', data: { sfx: 'back' }, on: { click: () => app.back() } }, '‹'),
    h('div', { class: 'tq-title', text: title }));
}
export function emptyScreen(root, app, title) {
  root.append(h('div', { class: 'tq' }, head(app, title), h('div', { class: 'tq-card tq-empty' }, h('p', { text: t('tq.empty') }))));
}

/**
 * Каркас вікторини: rounds = [{ prompt: Node, opts: [str], a: idx, speak?: str, note?: str, onShow?(card) , onAnswer?(ok, card) }]
 * opts.gameId → recordGame; opts.onFinish(stars, ok, n) — додаткова дія (наприклад, штамп).
 * Повертає cleanup.
 */
export function runQuiz(root, app, { title, intro, rounds, gameId, wid, onFinish, finishExtra }) {
  let alive = true;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms));
  const box = h('div', { class: 'tq' });
  root.append(box);
  const stage = h('div', { class: 'tq-stage' });
  const bar = h('div', { class: 'tq-bar' }, h('i'));
  box.append(head(app, title), bar, stage);
  let i = 0; let ok = 0;
  const n = rounds.length;

  const swap = (node) => {
    stage.textContent = '';
    stage.append(node);
    anim(node, [{ opacity: 0, transform: 'translate3d(0,14px,0)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.22,.8,.3,1)' });
  };
  const setBar = () => { bar.firstChild.style.transform = `scaleX(${n ? i / n : 0})`; };

  function start() {
    const c = h('div', { class: 'tq-card tq-intro' }, h('p', { text: intro }),
      h('button', { class: 'btn btn-primary tq-go', type: 'button', data: { sfx: 'open' }, on: { click: () => { tap(app, 'medium'); question(); } } }, t('tq.start')));
    swap(c);
  }
  function question() {
    setBar();
    const r = rounds[i];
    const opts = h('div', { class: 'tq-opts' });
    const note = h('div', { class: 'tq-note' });
    const card = h('div', { class: 'tq-card' }, h('div', { class: 'tq-n', text: `${i + 1}/${n}` }), r.prompt, opts, note);
    let done = false;
    r.opts.forEach((o, k) => {
      const b = h('button', { class: 'tq-opt', type: 'button', data: { sfx: 'none' } }, String(o));
      b.addEventListener('click', () => {
        if (done) return;
        if (r.retry && k !== r.a && !b.disabled && r.retry(card)) {   // landmark: нова підказка замість поразки
          b.disabled = true; b.classList.add('bad');
          anim(b, [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 320 });
          sfx(app, 'wrong'); tap(app, 'rigid');
          return;
        }
        done = true;
        const good = k === r.a;
        if (good) ok += r.weight ? r.weight() : 1;
        b.classList.add(good ? 'ok' : 'bad');
        opts.children[r.a]?.classList.add('ok');
        [...opts.children].forEach((x) => { x.disabled = true; });
        anim(b, good ? [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }]
          : [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' }, { transform: 'none' }], { duration: 340, easing: 'ease-out' });
        sfx(app, good ? 'correct' : 'wrong'); tap(app, good ? 'light' : 'rigid');
        if (good) { try { app.fx.sparkle?.(b, { count: lite() ? 3 : 8 }); } catch (e) { /* */ } }
        note.textContent = '';
        note.append(h('b', { text: good ? t('tq.right') : `${t('tq.wrong')} ${r.opts[r.a]}` }));
        if (r.note) note.append(h('span', { text: ' ' + r.note }));
        anim(note, [{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
        if (r.onAnswer) r.onAnswer(good, card);
        const nx = h('button', { class: 'btn btn-primary tq-go', type: 'button', on: { click: () => { i += 1; if (i >= n) finish(); else question(); } } }, t('tq.next'));
        later(() => card.append(nx), good ? 250 : 500);
      });
      opts.append(b);
    });
    swap(card);
    if (r.onShow) r.onShow(card);
    if (r.speak) later(() => say(app, r.speak), 350);
  }
  function finish() {
    i = n; setBar();
    const ratio = n ? Math.min(1, ok / n) : 0;
    const stars = starsByRatio(ratio);
    if (gameId) { try { recordGame(app.state, gameId, stars); } catch (e) { console.warn(e); } }
    if (onFinish) { try { onFinish(stars, ok, n); } catch (e) { console.warn(e); } }
    try { app.save(); } catch (e) { /* */ }
    sfx(app, stars ? 'win' : 'lose');
    const starsEl = h('div', { class: 'tq-stars' }, [0, 1, 2].map((k) => h('span', { class: k < stars ? 'on' : '', text: '⭐' })));
    const c = h('div', { class: 'tq-card tq-fin' },
      h('h2', { class: 'title-sticker', text: stars >= 3 ? t('tq.great') : stars ? t('tq.good') : t('tq.try') }),
      starsEl, h('p', { class: 'tq-score', text: t('tq.score', { ok: Math.round(ok * 10) / 10, n }) }),
      finishExtra ? finishExtra(stars) : null,
      h('div', { class: 'tq-row' },
        h('button', { class: 'btn btn-ghost', type: 'button', on: { click: () => { i = 0; ok = 0; question(); } } }, t('tq.again')),
        h('button', { class: 'btn btn-primary', type: 'button', data: { sfx: 'back' }, on: { click: () => (wid ? app.go('world', { wid }) : app.back()) } }, wid ? t('tq.path') : t('tq.next'))));
    swap(c);
    [...starsEl.children].forEach((s, k) => anim(s, [{ opacity: 0, transform: 'scale(.3) rotate(-30deg)' }, { opacity: 1, transform: 'scale(1.2)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 200 + k * 160, fill: 'backwards', easing: 'ease-out' }));
    if (stars) later(() => { try { app.fx.confetti?.({ count: lite() ? 30 : 80 }); } catch (e) { /* */ } }, 300);
  }
  start();
  return () => { alive = false; timers.forEach(clearTimeout); };
}

/** Варіанти: правильний + 3 інших (унікальні), перемішані. → {opts, a} */
export function optionsWith(right, pool, k = 4) {
  const others = shuffle([...new Set(pool.filter((x) => x && x !== right))]).slice(0, k - 1);
  const opts = shuffle([right, ...others]);
  return { opts, a: opts.indexOf(right) };
}

/** Заставка-літачок (перше відкриття подорожі). Повертає Promise, що завершується після «Летимо!». */
export function planeIntro(app) {
  return new Promise((resolve) => {
    const plane = h('div', { class: 'gl-intro-plane', 'aria-hidden': 'true' }, h('span', { class: 'gl-ip-lumi' }), h('span', { class: 'gl-ip-ico', text: '✈️' }));
    const lumiBox = plane.firstChild;
    const clouds = h('div', { class: 'gl-intro-clouds', 'aria-hidden': 'true' }, ['☁️', '☁️', '☁️', '☁️'].map((c, k) => h('span', { class: `c${k}`, text: c })));
    const go = h('button', { class: 'btn btn-primary gl-intro-go', type: 'button', data: { sfx: 'open' } }, t('travel.go'));
    const ov = h('div', { class: 'gl-intro', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('travel.introTitle') },
      clouds, plane,
      h('h2', { class: 'title-sticker big', text: t('travel.introTitle') }),
      h('p', { text: t('travel.introSub') }), go);
    document.body.append(ov);
    let lumi = null;
    try { lumi = app.makeLumi(lumiBox, { size: 70, emotion: 'excited', global: false }); } catch (e) { /* */ }
    sfx(app, 'unlock');
    anim(ov, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    anim(plane, [{ transform: 'translate3d(-60vw,40px,0) rotate(-8deg)' }, { transform: 'translate3d(0,0,0) rotate(0)' }], { duration: 1400, easing: 'cubic-bezier(.2,.8,.25,1)' });
    go.addEventListener('click', () => {
      tap(app, 'medium');
      const a = anim(plane, [{ transform: 'none' }, { transform: 'translate3d(70vw,-120px,0) rotate(-12deg)' }], { duration: 700, easing: 'ease-in', fill: 'forwards' });
      const b = anim(ov, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: 450, fill: 'forwards' });
      const end = () => { ov.remove(); try { lumi && lumi.destroy(); } catch (e) { /* */ } resolve(); };
      if (b) b.onfinish = end; else end();
      void a;
    }, { once: true });
  });
}

/** Скільки слів країн «вивчено» (сума WORDS[cid] пройдених країн). */
export function wordsLearned(app) {
  const st = app.state;
  return S.countryList().filter((c) => S.countryDone(st, c.id)).reduce((a, c) => a + (((app.content.WORDS || {})[c.id] || []).length), 0);
}
export { tc };
