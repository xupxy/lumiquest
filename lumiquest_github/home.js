// Головний екран: онбординг для нового гравця або «хаб» з плитками.
import { h, button, plural } from './ui.js';
import { applyPlacement, currentWorldId, getWorld, stageOf, ELEMENTS, levelOf } from './state.js';
import { worldGames, nextGame, gameStars } from './games.js';

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
        h('p', { class: 'onb-text', text: `Привіт, ${name}! Я — Лумі, маленька зірочка. Разом ми вивчатимемо англійську — як справжню пригоду.` }),
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
function hub(root, app) {
  const st = app.state;
  const name = st.name || 'друже';
  const wid = currentWorldId(st);
  const w = getWorld(wid);
  const games = w ? worldGames(wid) : [];
  const got = games.reduce((a, g) => a + gameStars(st, g.id), 0);
  const total = games.length * 3;
  const next = w ? nextGame(st, wid) : null;
  const sleepy = app.session.sleepy;

  const lumiBox = h('div', { class: 'hub-lumi' });
  const greet = sleepy ? `Ох, я задрімала, поки чекала тебе 😴` : (app.session.greeted ? `${name}, куди летимо? 🌟` : `З поверненням, ${name}! 🌟`);
  app.session.greeted = true;

  const streak = st.streak || 0;
  const head = h('div', { class: 'hub-head' },
    lumiBox,
    h('h1', { class: 'hub-title', text: `Привіт, ${name}!` }),
    h('p', { class: 'hub-sub' },
      h('span', { class: 'pill pill-fire', text: `🔥 ${streak} ${plural(streak, 'день', 'дні', 'днів')}` }),
      h('span', { class: 'pill', text: `✨ ${st.fireflies} ${plural(st.fireflies, 'світлячок', 'світлячки', 'світлячків')}` })));

  // «Продовжити пригоду» — одразу в наступний рівень стежки (або на стежку, якщо світ пройдено)
  const cont = h('button', {
    class: 'hero-card', type: 'button', style: { '--i': 1 },
    on: {
      click: () => {
        app.tg.tap('medium');
        jelly(cont);
        if (next) app.go(next.screen, next.params); else app.go('world', { wid });
      },
    },
  },
  next ? h('img', { class: 'hero-cover', src: app.asset(next.cover), alt: '' })
    : h('span', { class: 'hero-isle', 'aria-hidden': 'true', text: w ? w.emoji : '🌱' }),
  h('span', { class: 'hero-txt' },
    h('span', { class: 'hero-k', text: 'Продовжити пригоду' }),
    h('span', { class: 'hero-lvl', text: next ? `Рівень ${next.idx + 1}/${games.length} · ${next.emoji} ${next.title}` : 'Світ пройдено — обери рівень' }),
    h('span', { class: 'hero-name', text: w ? `${w.name} · ${w.level}` : '' }),
    h('span', { class: 'hero-prog' },
      h('span', { class: 'hero-bar' }, h('i', { style: { transform: `scaleX(${total ? got / total : 0})` } })),
      h('span', { class: 'hero-stars', text: `⭐ ${got}/${total}` }))),
  h('span', { class: 'hero-go', 'aria-hidden': 'true', text: '▶' }));

  const mapBtn = button('🗺 Карта світів', { variant: 'secondary', cls: 'hub-map', onClick: () => app.go('map') });
  mapBtn.style.setProperty('--i', 2);
  const pathBtn = button(`${w ? w.emoji : '🌍'} Стежка`, { variant: 'secondary', cls: 'hub-path', onClick: () => app.go('world', { wid }) });
  const navRow = h('div', { class: 'btn-row hub-nav', style: { '--i': 2 } }, pathBtn, mapBtn);

  const el = st.active_dragon;
  const stage = stageOf(st.dragons[el] || 0);
  let ti = 0;
  const tile = (cls, title, sub, onClick, art) => {
    const b = h('button', { class: `tile-card ${cls}`, type: 'button', style: { '--i': ti++ }, on: { click: () => { app.tg.tap('light'); jelly(b); onClick(); } } },
      art, h('span', { class: 'tile-title', text: title }), h('span', { class: 'tile-sub', text: sub }));
    return b;
  };

  const grid = h('div', { class: 'hub-grid', style: { '--i': 3 } },
    tile('t-durak', '🃏 Картярня', `Перемог над Лисом: ${st.durak_wins || 0}`, () => app.go('durak'),
      h('img', { class: 'tile-art', src: app.asset('durak.png'), alt: '', loading: 'lazy' })),
    tile('t-dragon', '🐉 Дракони', `${ELEMENTS[el]} · ${stage[2]} · 🍀 ${st.food}`, () => app.go('dragons'),
      h('img', { class: 'tile-art dragon-art', src: app.asset(`dragon/${el}_${stage[0]}.png`), alt: '', loading: 'lazy' })),
    tile('t-prof', '👤 Профіль', `Рівень ${levelOf(st.xp)} · 🏆 ${st.trophies}`, () => app.go('profile'),
      h('span', { class: 'tile-emoji', 'aria-hidden': 'true', text: '🏅' })),
    tile('t-test', '🔁 Тест знову', st.placement_result ? `Твій рівень: ${st.placement_result}` : 'Рівень: A1 з початку', () => app.go('placement'),
      h('span', { class: 'tile-emoji', 'aria-hidden': 'true', text: '🧭' })));

  const help = h('button', { class: 'link-btn', type: 'button', text: '❓ Як грати', style: { '--i': 4 }, on: { click: () => helpModal(app) } });

  root.append(h('div', { class: 'hub' }, head, cont, navRow, grid, help));
  const lumi = app.makeLumi(lumiBox, { size: 150, emotion: sleepy ? 'sleepy' : 'happy' });
  setTimeout(() => lumi.say(greet), 350);
  if (sleepy) {
    app.session.sleepy = false;
    setTimeout(() => { lumi.set('excited'); lumi.say('Летімо далі! ✨'); }, 3800);
  }
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
