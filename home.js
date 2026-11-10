// Головний екран: онбординг для нового гравця або «хаб» з плитками.
import { h, button, plural, fx } from './ui.js?v=20261110183712';
import { applyPlacement, currentWorldId, getWorld, worldIndex, stageOf, ELEMENTS, levelOf } from './state.js?v=20261110183712';
import { applyWorldTheme, emblem, pedestal, themeOf } from './theme.js?v=20261110183712';
import { worldGames, nextGame, gameStars } from './games.js?v=20261110183712';

const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function jelly(el) {
  if (reduced()) return;
  el.classList.remove('jelly'); void el.offsetWidth; el.classList.add('jelly');
}

export function render(root, params, app) {
  const st = app.state;
  if (!st.placement_done) return onboarding(root, app);
  return hub(root, app);
}

// ─────────────────────────────────────────────────────────── онбординг
function onboarding(root, app) {
  app.setTopbar(false);
  const st = app.state;
  const name = st.name || 'друже';
  const wrap = h('div', { class: 'onb' });
  const stage = h('div', { class: 'onb-stage' });
  const lumiBox = h('div', { class: 'onb-lumi' });
  const dots = h('div', { class: 'onb-dots', 'aria-hidden': 'true' }, [0, 1, 2].map(() => h('i')));
  const actions = h('div', { class: 'onb-actions' });
  wrap.append(stage, lumiBox, dots, actions);
  root.append(wrap);
  const lumi = app.makeLumi(lumiBox, { size: 170, emotion: 'hello' });
  let step = -1;

  const worlds = app.content.WORLDS;
  const steps = [
    () => ({
      emo: 'hello',
      say: `Привіт, ${name}! 👋`,
      body: [
        h('img', { class: 'onb-banner', src: app.asset('banner.png'), alt: 'LumiQuest — English adventure' }),
        h('p', { class: 'onb-text', text: `Привіт, ${name}! Я — Лумі, маленький дух-ліхтарик. Разом ми вивчатимемо англійську — як справжню пригоду.` }),
      ],
      buttons: [button('Далі', { variant: 'primary', onClick: () => go(1) })],
    }),
    () => ({
      emo: 'sad',
      say: 'Без світлячків я не можу додому… 🥺',
      body: [
        h('h2', { class: 'title-sticker', text: 'Куди зникли світлячки?' }),
        h('div', { class: 'onb-isles' }, worlds.map((w, i) => h('span', { class: 'onb-isle', style: { '--i': i } },
          h('b', { text: w.emoji }), h('small', { text: w.level })))),
        h('p', { class: 'onb-text', text: 'Я впала з неба, і мої Слова-Світлячки розлетілися по пʼяти землях. Кожне англійське слово, яке ти вгадаєш, — це спійманий світлячок.' }),
      ],
      buttons: [button('Я допоможу!', { variant: 'primary', onClick: () => go(2) })],
    }),
    () => ({
      emo: 'thinking',
      say: 'Звідки нам почати? 🤔',
      body: [
        h('h2', { class: 'title-sticker', text: 'Звідки почнемо?' }),
        h('p', { class: 'onb-text', text: 'Короткий тест: по 5 питань на кожен рівень, від A1 до C1. Це не екзамен — я просто шукаю землю, де тобі буде цікаво.' }),
      ],
      buttons: [
        button('🧭 Почати тест рівня', { variant: 'primary', onClick: () => app.go('placement') }),
        button('🌱 Почати з самого початку', {
          variant: 'secondary',
          onClick: () => { applyPlacement(st, []); app.save(); app.toast('Стартуємо з Ранкової Галявини 🌱'); app.go('map', {}, { replace: true }); },
        }),
      ],
    }),
  ];

  function go(i) {
    if (i === step) return;
    const s = steps[i]();
    const dir = i > step ? 'fwd' : 'back';
    step = i;
    const page = h('div', { class: `onb-page enter-${dir}` }, s.body);
    const old = stage.firstElementChild;
    if (old) { old.classList.add(`leave-${dir}`); setTimeout(() => old.remove(), 360); }
    stage.append(page);
    requestAnimationFrame(() => requestAnimationFrame(() => page.classList.remove(`enter-${dir}`)));
    actions.replaceChildren(...s.buttons);
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
    lumi.set(s.emo);
    setTimeout(() => lumi.say(s.say), 250);
  }
  go(0);
  return () => { app.setTopbar(true); };
}

// ─────────────────────────────────────────────────────────── хаб
// Сцена світу, де зараз гравець: Лумі на постаменті, ресурси, велика «Продовжити», плитки режимів.
const svgFrom = (str) => { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstChild; };
const setI = (el, i) => { el.style.setProperty('--i', i); return el; };

function flameSVG() {
  return svgFrom(`<svg class="flame" viewBox="0 0 40 48" aria-hidden="true">
    <path class="fl-out" d="M20 2 C26 12 36 18 36 30 C36 40 29 46 20 46 C11 46 4 40 4 30 C4 22 10 18 12 10 C15 16 17 18 18 18 C18 12 18 7 20 2Z"/>
    <path class="fl-in" d="M20 20 C24 26 28 29 28 35 C28 40 24 43 20 43 C16 43 12 40 12 35 C12 31 15 29 16 25 C17 28 18 29 19 29 C19 26 19 23 20 20Z"/></svg>`);
}
function pathArt(wid) {
  const t = themeOf(wid);
  return svgFrom(`<svg class="tile-svg" viewBox="0 0 120 90" aria-hidden="true">
    <path d="M14 82 C40 70 20 50 52 44 C86 38 70 18 104 10" fill="none" stroke="${t.ink}" stroke-width="14" stroke-linecap="round"/>
    <path d="M14 82 C40 70 20 50 52 44 C86 38 70 18 104 10" fill="none" stroke="${t.road}" stroke-width="9" stroke-linecap="round"/>
    <path d="M14 82 C40 70 20 50 52 44 C86 38 70 18 104 10" fill="none" stroke="${t.ink}" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round" opacity=".45"/>
    <g stroke="${t.ink}" stroke-width="3"><circle cx="18" cy="80" r="9" fill="${t.accent}"/><circle cx="52" cy="44" r="11" fill="${t.accent2}" class="tp-cur"/><circle cx="102" cy="11" r="8" fill="${t.card}"/></g>
    <path d="M48 44 l3 3 6 -7" stroke="${t.ink}" stroke-width="0" fill="none"/></svg>`);
}

/** Дні тижня (пн..нд), коли гравець грав — з last_day і streak. */
export function weekActivity(st) {
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const dow = (today.getDay() + 6) % 7; // 0 = пн
  const out = [];
  const last = st.last_day ? new Date(st.last_day + 'T12:00:00') : null;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(today.getDate() - dow + i);
    let on = false;
    if (last && st.streak) {
      const diff = Math.round((last - d) / 864e5);
      on = diff >= 0 && diff < st.streak;
    }
    out.push({ on, today: i === dow, future: i > dow });
  }
  return out;
}

function hub(root, app) {
  const st = app.state;
  const name = st.name || 'друже';
  const wid = currentWorldId(st);
  const w = getWorld(wid);
  const wi = worldIndex(wid) + 1;
  const games = w ? worldGames(wid) : [];
  const got = games.reduce((a, g) => a + gameStars(st, g.id), 0);
  const total = games.length * 3;
  const next = w ? nextGame(st, wid) : null;
  const sleepy = app.session.sleepy;
  const unTheme = applyWorldTheme(root, wid, { page: true });

  const allStars = Object.values(st.stars || {}).reduce((a, b) => a + (b || 0), 0);
  const greet = sleepy ? 'Ох, я задрімала, поки чекала тебе 😴'
    : app.session.greeted ? `${name}, куди летимо? 🌟` : `Привіт, ${name}! Я скучила ✨`;
  app.session.greeted = true;

  // ── сцена: світ + Лумі на постаменті
  const lumiBox = h('div', { class: 'hs-lumi' });
  const streak = st.streak || 0;
  const streakBtn = h('button', {
    class: `hs-streak${streak >= 2 ? ' hot' : ''}`, type: 'button',
    'aria-label': `Стрік: ${streak} ${plural(streak, 'день', 'дні', 'днів')} поспіль`,
    on: { click: () => { app.tg.tap('light'); jelly(streakBtn); lumi.say(streak >= 2 ? `${streak} ${plural(streak, 'день', 'дні', 'днів')} поспіль! Вогник горить 🔥` : 'Заходь завтра — і вогник розгориться 🔥'); } },
  }, flameSVG(), h('b', { text: String(streak) }));
  const worldChip = h('button', { class: 'hs-world', type: 'button', on: { click: () => { app.tg.tap('light'); app.go('map'); } } },
    h('span', { class: 'hs-emblem', 'aria-hidden': 'true' }, svgFrom(emblem(wid))),
    h('span', { class: 'hs-world-txt' }, h('small', { text: `Світ ${wi} · ${w ? w.level : ''}` }), h('b', { text: w ? w.name : '' })));
  const stage = setI(h('section', { class: 'home-stage' },
    h('div', { class: 'hs-top' }, worldChip, streakBtn),
    h('div', { class: 'hs-hero' }, h('div', { class: 'hs-halo', 'aria-hidden': 'true' }), lumiBox,
      h('div', { class: 'hs-pedestal', 'aria-hidden': 'true' }, svgFrom(pedestal(wid)))),
    h('h1', { class: 'home-hello title-sticker big', text: `Привіт, ${name}!` })), 0);

  // ── ресурси
  const res = (cls, ico, n, label) => h('div', { class: `res ${cls}` },
    h('span', { class: 'res-ico', 'aria-hidden': 'true', text: ico }),
    h('span', { class: 'res-txt' }, h('b', { class: 'res-n', data: { to: String(n) }, text: '0' }), h('small', { text: label })));
  const strip = setI(h('div', { class: 'res-strip' },
    res('r-ff', '✨', st.fireflies || 0, plural(st.fireflies || 0, 'слово', 'слова', 'слів')),
    res('r-star', '⭐', allStars, plural(allStars, 'зірка', 'зірки', 'зірок')),
    res('r-food', '🍀', st.food || 0, 'корм')), 1);

  // ── «Продовжити»
  const pct = total ? got / total : 0;
  const cont = setI(h('button', {
    class: 'cta', type: 'button',
    on: { click: () => { app.tg.tap('medium'); jelly(cont); if (next) app.go(next.screen, next.params); else app.go('world', { wid }); } },
  },
  h('span', { class: 'cta-cover' },
    next ? h('img', { src: app.asset(next.cover), alt: '' }) : svgFrom(emblem(wid)),
    next ? h('span', { class: 'cta-num', text: String(next.idx + 1) }) : null),
  h('span', { class: 'cta-txt' },
    h('span', { class: 'cta-k', text: next ? 'Продовжити' : 'Світ пройдено' }),
    h('span', { class: 'cta-lvl', text: next ? `${next.emoji} ${next.title}` : 'Обери рівень і збери всі зірки' }),
    h('span', { class: 'cta-prog' },
      h('span', { class: 'cta-bar' }, h('i', { style: { transform: `scaleX(${pct})` } })),
      h('span', { class: 'cta-stars', text: `⭐ ${got}/${total}` }))),
  h('span', { class: 'cta-go', 'aria-hidden': 'true' }, svgFrom('<svg viewBox="0 0 24 24"><path d="M8 5 L19 12 L8 19Z"/></svg>'))), 2);

  // ── плитки режимів
  const el = st.active_dragon;
  const dstage = stageOf(st.dragons[el] || 0);
  const tile = (cls, title, sub, onClick, art, i) => {
    const b = h('button', { class: `mode-tile ${cls}`, type: 'button', on: { click: () => { app.tg.tap('light'); jelly(b); onClick(); } } },
      h('span', { class: 'mt-art', 'aria-hidden': 'true' }, art),
      h('span', { class: 'mt-title', text: title }), h('span', { class: 'mt-sub', text: sub }));
    return setI(b, i);
  };
  const grid = setI(h('div', { class: 'mode-grid' },
    tile('mt-path', 'Стежка світу', next ? `Рівень ${next.idx + 1} з ${games.length}` : `Усі ${games.length} рівнів`, () => app.go('world', { wid }), pathArt(wid), 0),
    tile('mt-map', 'Карта світів', `Відкрито ${st.unlocked.length} з ${app.content.WORLDS.length}`, () => app.go('map'),
      h('img', { src: app.asset('map.png'), alt: '', loading: 'lazy' }), 1),
    tile('mt-durak', 'Картярня', `Перемог над Лисом: ${st.durak_wins || 0}`, () => app.go('durak'),
      h('img', { src: app.asset('durak.png'), alt: '', loading: 'lazy' }), 2),
    tile('mt-dragon', 'Дракони', `${ELEMENTS[el]} · ${dstage[2]}`, () => app.go('dragons'),
      h('img', { src: app.asset(`dragon/${el}_${dstage[0]}.png`), alt: '', loading: 'lazy' }), 3)), 3);

  const links = setI(h('nav', { class: 'home-links', 'aria-label': 'Ще' },
    h('button', { class: 'hl', type: 'button', on: { click: () => app.go('profile') } }, h('span', { 'aria-hidden': 'true', text: '👤' }), `Профіль · рів. ${levelOf(st.xp)}`),
    h('button', { class: 'hl', type: 'button', on: { click: () => app.go('placement') } }, h('span', { 'aria-hidden': 'true', text: '🧭' }), 'Тест рівня'),
    h('button', { class: 'hl', type: 'button', on: { click: () => helpModal(app) } }, h('span', { 'aria-hidden': 'true', text: '❓' }), 'Як грати')), 4);

  root.append(h('div', { class: 'home' }, stage, strip, cont, grid, links));

  const lumi = app.makeLumi(lumiBox, { size: 160, emotion: sleepy ? 'sleepy' : 'hello' });
  const timers = [];
  timers.push(setTimeout(() => lumi.say(greet), 450));
  timers.push(setTimeout(() => {
    strip.querySelectorAll('.res-n').forEach((n, k) => fx.countUp(n, 0, +n.dataset.to, 700 + k * 150));
  }, 380));
  if (sleepy) {
    app.session.sleepy = false;
    timers.push(setTimeout(() => { lumi.set('excited'); lumi.say('Летімо далі! ✨'); }, 3800));
  } else {
    timers.push(setTimeout(() => lumi.set('happy'), 2600));
  }
  return () => { timers.forEach(clearTimeout); unTheme(); };
}

function helpModal(app) {
  const lines = [
    ['🗺', 'Обери світ на карті — і йди стежкою: 13 рівнів, від уроку до боса.'],
    ['📖', 'Прочитай підказку Лумі — і до завдань!'],
    ['🧩', 'Тисни варіант, друкуй переклад або складай речення зі слів.'],
    ['⭐', '0 помилок — 3 зірки, 1–2 — дві, більше — одна.'],
    ['💌', 'Історії: обирай доречні відповіді — росте Симпатія 💗.'],
    ['🔓', 'Наступний рівень відкривається, коли попередній має хоча б 1 ⭐.'],
    ['⚔️', 'Пройди всі уроки світу — відкриється арена з босом.'],
    ['🍀', 'Кожна правильна відповідь — корм для дракона.'],
    ['🃏', 'Картярня: відбивайся від Лиса англійськими словами!'],
  ];
  const close = () => { m.classList.remove('in'); setTimeout(() => m.remove(), 250); };
  const m = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Як грати' },
    h('div', { class: 'modal-scrim', on: { click: close } }),
    h('div', { class: 'modal-card' },
      h('h3', { class: 'modal-title', text: 'Як грати' }),
      h('ul', { class: 'help-list' }, lines.map(([i, t]) => h('li', h('span', { class: 'help-i', text: i }), h('span', { text: t })))),
      h('div', { class: 'modal-actions one' }, button('Зрозуміло!', { variant: 'primary', onClick: close }))));
  document.body.append(m);
  requestAnimationFrame(() => m.classList.add('in'));
}
