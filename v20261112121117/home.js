// Головний екран: онбординг для нового гравця або «хаб» з плитками.
import { h, button, plural, fx } from './ui.js?v=20261112121114';
import { applyPlacement, currentWorldId, getWorld, worldIndex, stageOf, ELEMENTS, levelOf } from './state.js?v=20261112121114';
import { applyWorldTheme, emblem, pedestal, themeOf } from './theme.js?v=20261112121114';
import { worldGames, nextGame, gameStars } from './games.js?v=20261112121114';
import * as I18N from './i18n.js?v=20261112121114';
import { t, tc } from './i18n.js?v=20261112121114';
import { gameTitle } from './state.js?v=20261112121114';
import * as RD from './riddle.js?v=20261112121114';
import { countryList, countryDone, travelOpen } from './state.js?v=20261112121114';
import './travel.js';   // v19: рядки i18n подорожі

const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function jelly(el) {
  if (reduced()) return;
  el.classList.remove('jelly'); void el.offsetWidth; el.classList.add('jelly');
}

export function render(root, params, app) {
  const st = app.state;
  if (!st.onboarded) return onboarding(root, app);
  return hub(root, app);
}

// ─────────────────────────────────────────────────────────── онбординг (v7)
// 1 мова → 2 знайомство → 3 як грати → 4 звук і музика → 5 тест рівня / з початку
const svgOnb = (str) => { const t0 = document.createElement('template'); t0.innerHTML = str.trim(); return t0.content.firstChild; };

/** Перемикач-рядок (використовує й профіль). onChange(on) */
export function toggleRow(label, sub, on, onChange, cls = '') {
  const knob = h('span', { class: 'sw-knob' });
  const sw = h('button', { class: `sw${on ? ' on' : ''}`, type: 'button', role: 'switch', 'aria-checked': on ? 'true' : 'false', 'aria-label': label, data: { sfx: 'none' } }, knob);
  const row = h('div', { class: `set-row ${cls}` },
    h('span', { class: 'set-txt' }, h('b', { text: label }), sub ? h('small', { text: sub }) : null), sw);
  const flip = () => {
    on = !on;
    sw.classList.toggle('on', on);
    sw.setAttribute('aria-checked', on ? 'true' : 'false');
    onChange(on);
  };
  row.addEventListener('click', flip);
  return row;
}
export function audioSettings(app) {
  const s = (app.audio.getSettings && app.audio.getSettings()) || {};
  return { sound: s.sound !== false, music: s.music !== false };
}
/** «Перевірити звук»: дзинь + Лумі каже англійською. */
export function testSound(app, lumi) {
  app.audio.initAudio();
  app.audio.sfx('correct');
  setTimeout(() => app.audio.sfx('star'), 260);
  setTimeout(() => app.audio.speak(t('onb.testPhrase'), { lang: 'en-US', rate: 0.9 }), 650);
  if (lumi) { lumi.set('excited'); lumi.react('jump'); lumi.say(t('onb.testSay')); }
}

function onboarding(root, app) {
  app.setTopbar(false);
  const st = app.state;
  const nameOf = () => (app.session.tgName || (st.name && st.name !== 'друже' && st.name !== 'друг' ? st.name : t('common.friend')));
  const wrap = h('div', { class: 'onb onb7' });
  const glow = h('div', { class: 'onb-glow', 'aria-hidden': 'true' }, [0, 1, 2, 3, 4, 5].map((i) => h('i', { style: { '--i': i } })));
  const lumiBox = h('div', { class: 'onb-lumi' });
  const stage = h('div', { class: 'onb-stage' });
  const dots = h('div', { class: 'onb-dots', 'aria-hidden': 'true' }, [0, 1, 2, 3, 4].map(() => h('i')));
  const actions = h('div', { class: 'onb-actions' });
  wrap.append(glow, lumiBox, stage, dots, actions);
  root.append(wrap);
  const lumi = app.makeLumi(lumiBox, { size: 116, emotion: 'hello' });
  let step = -1;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const stagger = (els) => els.map((e, i) => { e.style.setProperty('--i', i); e.classList.add('onb-pop'); return e; });
  const backBtn = () => button(t('onb.back'), { variant: 'ghost', cls: 'onb-back', sfx: 'back', onClick: () => go(step - 1) });

  const finish = () => {
    st.onboarded = true;
    app.save();
  };

  const steps = [
    // 1 — мова
    () => {
      const card = (code, flag, name, sub, hello) => {
        const b = h('button', { class: `lang-card${I18N.lang() === code ? ' on' : ''}`, type: 'button', data: { lang: code, sfx: 'none' } },
          h('span', { class: 'lc-flag', 'aria-hidden': 'true', text: flag }),
          h('span', { class: 'lc-txt' }, h('b', { text: name }), h('small', { text: sub })),
          h('span', { class: 'lc-hello', 'aria-hidden': 'true', text: hello }),
          h('span', { class: 'lc-check', 'aria-hidden': 'true', text: '✓' }));
        b.addEventListener('click', () => pickLang(code, b));
        return b;
      };
      return {
        emo: 'hello',
        say: t('onb.hello'),
        body: [
          h('h1', { class: 'title-sticker big onb-h' }, h('span', { text: 'Привіт!' }), ' ', h('span', { class: 'alt', text: 'Привет!' })),
          h('p', { class: 'onb-text', text: 'Обери мову · Выбери язык' }),
          h('div', { class: 'lang-cards' }, stagger([
            card('uk', '🇺🇦', 'Українська', 'Граймо українською', 'Привіт!'),
            card('ru', '🇷🇺', 'Русский', 'Играем на русском', 'Привет!'),
          ])),
          h('p', { class: 'onb-note', text: t('onb.langNote') }),
        ],
        buttons: [button(t('onb.next'), { variant: 'primary', cls: 'onb-next', onClick: () => go(1) })],
      };
    },
    // 2 — знайомство
    () => ({
      emo: 'excited',
      say: t('onb.meetSay'),
      body: [
        h('h2', { class: 'title-sticker onb-h', text: t('onb.meetTitle', { name: nameOf() }) }),
        h('p', { class: 'onb-text', text: t('onb.meetText') }),
        h('div', { class: 'onb-feats' }, stagger([
          ['🌍', 'onb.f.worlds'], ['🪜', 'onb.f.levels'], ['📘', 'onb.f.lessons'],
          ['⚔️', 'onb.f.boss'], ['🐉', 'onb.f.dragons'], ['🃏', 'onb.f.durak'],
        ].map(([i, k]) => h('div', { class: 'onb-feat' }, h('span', { class: 'of-i', text: i }), h('span', { text: t(k) }))))),
      ],
      buttons: [h('div', { class: 'btn-row' }, backBtn(), button(t('onb.meetBtn'), { variant: 'primary', onClick: () => go(2) }))],
    }),
    // 3 — як грати
    () => ({
      emo: 'thinking',
      say: t('onb.howSay'),
      body: [
        h('h2', { class: 'title-sticker onb-h', text: t('onb.howTitle') }),
        h('ul', { class: 'onb-how' }, stagger([
          ['👆', 'onb.h.tap'], ['🔊', 'onb.h.listen'], ['⭐', 'onb.h.stars'], ['🍀', 'onb.h.food'], ['🔥', 'onb.h.fire'],
        ].map(([i, k]) => h('li', h('span', { class: 'oh-i', text: i }), h('span', { text: t(k) }))))),
      ],
      buttons: [h('div', { class: 'btn-row' }, backBtn(), button(t('onb.howBtn'), { variant: 'primary', onClick: () => go(3) }))],
    }),
    // 4 — звук і музика
    () => {
      const a = audioSettings(app);
      return {
        emo: 'happy',
        say: t('onb.soundSay'),
        body: [
          h('h2', { class: 'title-sticker onb-h', text: t('onb.soundTitle') }),
          h('p', { class: 'onb-text', text: t('onb.soundText') }),
          h('div', { class: 'onb-sound card' }, stagger([
            toggleRow(`🔔 ${t('onb.sound')}`, t('set.soundSub'), a.sound, (on) => { app.audio.setSound(on); if (on) app.audio.sfx('tap'); }),
            toggleRow(`🎵 ${t('onb.music')}`, t('set.musicSub'), a.music, (on) => { app.audio.setMusic(on); if (on) app.audio.music('menu'); }),
          ]),
          button(t('onb.test'), { variant: 'gold', cls: 'onb-test', sfx: 'none', onClick: () => testSound(app, lumi) })),
        ],
        buttons: [h('div', { class: 'btn-row' }, backBtn(), button(t('onb.next'), { variant: 'primary', onClick: () => go(4) }))],
      };
    },
    // 5 — звідки почнемо
    () => ({
      emo: 'thinking',
      say: t('onb.startSay'),
      body: [
        h('h2', { class: 'title-sticker onb-h', text: t('onb.startTitle') }),
        h('div', { class: 'onb-ladder', 'aria-hidden': 'true' }, stagger((app.content.LEVELS || []).map((lv) => h('span', { text: lv })))),
        h('p', { class: 'onb-text', text: t('onb.startText') }),
      ],
      buttons: [
        button(t('onb.placement'), { variant: 'primary', sfx: 'open', onClick: () => { finish(); app.go('placement', {}, { replace: true }); } }),
        st.placement_done
          ? button(t('onb.continue'), { variant: 'secondary', onClick: () => { finish(); app.rerender(); } })
          : button(t('onb.fromStart'), {
            variant: 'secondary',
            onClick: () => { finish(); applyPlacement(st, []); app.save(); app.toast(t('onb.startToast')); app.go('map', {}, { replace: true }); },
          }),
        backBtn(),
      ],
    }),
  ];

  function pickLang(code, card) {
    app.audio.sfx('pop');
    app.tg.tap('light');
    stage.querySelectorAll('.lang-card').forEach((c) => c.classList.toggle('on', c === card));
    jelly(card);
    fx.sparkle(card);
    if (code !== I18N.lang()) {
      I18N.setLang(code, { silent: true });
      app.refreshChrome && app.refreshChrome();
      // перекласти поточний крок без анімації
      const s = steps[0]();
      stage.querySelector('.onb-note').textContent = t('onb.langNote');
      actions.replaceChildren(...s.buttons);
    }
    lumi.set('happy');
    lumi.react && lumi.react('jump');
    lumi.say(code === 'ru' ? 'Отлично! По-русски 💛' : 'Чудово! Українською 💛');
  }

  function go(i) {
    if (i === step || i < 0 || i >= steps.length) return;
    const s = steps[i]();
    const dir = i > step ? 'fwd' : 'back';
    if (step >= 0) app.audio.sfx('whoosh');
    step = i;
    const page = h('div', { class: `onb-page enter-${dir}` }, s.body);
    const old = stage.firstElementChild;
    if (old) { old.classList.add(`leave-${dir}`); setTimeout(() => old.remove(), 360); }
    stage.append(page);
    requestAnimationFrame(() => requestAnimationFrame(() => page.classList.remove(`enter-${dir}`)));
    actions.replaceChildren(...s.buttons);
    [...dots.children].forEach((d, k) => { d.classList.toggle('on', k === i); d.classList.toggle('done', k < i); });
    wrap.dataset.step = String(i + 1);
    lumi.set(s.emo);
    lumi.react && lumi.react(i % 2 ? 'jump' : 'wiggle');
    later(() => lumi.say(s.say), 260);
    root.scrollTo && root.scrollTo({ top: 0 });
  }
  go(0);
  if (app.session.epochReset) { app.session.epochReset = false; later(() => app.toast(t('onb.resetToast'), 3200), 900); }
  return () => { timers.forEach(clearTimeout); app.setTopbar(true); };
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
  const name = st.name && st.name !== 'друже' && st.name !== 'друг' ? st.name : t('common.friend');
  const wid = currentWorldId(st);
  const w = getWorld(wid);
  const wi = worldIndex(wid) + 1;
  const games = w ? worldGames(wid) : [];
  const got = games.reduce((a, g) => a + gameStars(st, g.id), 0);
  const total = games.length * 3;
  const next = w ? nextGame(st, wid) : null;
  const sleepy = app.session.sleepy;
  const unTheme = applyWorldTheme(root, wid, { page: true });

  // як у профілі: сума зірок усіх рівнів стежок (без застарілих id, з сумісністю старих збережень)
  const allStars = app.content.WORLDS.reduce((a, ww) => a + worldGames(ww.id).reduce((b, g) => b + gameStars(st, g.id), 0), 0);
  const greet = sleepy ? t('home.sleepy')
    : app.session.greeted ? t('home.whereTo', { name }) : t('home.missed', { name });
  app.session.greeted = true;

  // ── сцена: світ + Лумі на постаменті
  const lumiBox = h('div', { class: 'hs-lumi' });
  const streak = st.streak || 0;
  const streakBtn = h('button', {
    class: `hs-streak${streak >= 2 ? ' hot' : ''}`, type: 'button',
    'aria-label': t('home.streakAria', { n: streak, days: t('plural.days', { n: streak }) }),
    on: { click: () => { app.tg.tap('light'); jelly(streakBtn); lumi.say(streak >= 2 ? t('home.streakHot', { n: streak, days: t('plural.days', { n: streak }) }) : t('home.streakCold')); } },
  }, flameSVG(), h('b', { text: String(streak) }));
  const worldChip = h('button', { class: 'hs-world', type: 'button', data: { sfx: 'open' }, on: { click: () => { app.tg.tap('light'); app.go('map'); } } },
    h('span', { class: 'hs-emblem', 'aria-hidden': 'true' }, svgFrom(emblem(wid))),
    h('span', { class: 'hs-world-txt' }, h('small', { text: t('home.worldN', { n: wi, level: w ? w.level : '' }) }), h('b', { text: w ? tc(w, 'name') : '' })));
  const stage = setI(h('section', { class: 'home-stage' },
    h('div', { class: 'hs-top' }, worldChip, streakBtn),
    h('div', { class: 'hs-hero' }, h('div', { class: 'hs-halo', 'aria-hidden': 'true' }), lumiBox,
      h('div', { class: 'hs-pedestal', 'aria-hidden': 'true' }, svgFrom(pedestal(wid)))),
    h('h1', { class: 'home-hello title-sticker big', text: t('home.hello', { name }) })), 0);

  // ── ресурси
  const res = (cls, ico, n, label) => h('div', { class: `res ${cls}` },
    h('span', { class: 'res-ico', 'aria-hidden': 'true', text: ico }),
    h('span', { class: 'res-txt' }, h('b', { class: 'res-n', data: { to: String(n) }, text: '0' }), h('small', { text: label })));
  const strip = setI(h('div', { class: 'res-strip' },
    res('r-ff', '✨', st.fireflies || 0, t('plural.words', { n: st.fireflies || 0 })),
    res('r-star', '⭐', allStars, t('plural.stars', { n: allStars })),
    res('r-food', '🍀', st.food || 0, t('home.food'))), 1);

  // ── «Продовжити»
  const pct = total ? got / total : 0;
  const cont = setI(h('button', {
    class: 'cta', type: 'button', data: { sfx: 'open' },
    on: { click: () => { app.tg.tap('medium'); jelly(cont); if (next) app.go(next.screen, next.params); else app.go('world', { wid }); } },
  },
  h('span', { class: 'cta-cover' },
    next ? h('img', { src: app.asset(next.cover), alt: '' }) : svgFrom(emblem(wid)),
    next ? h('span', { class: 'cta-num', text: String(next.idx + 1) }) : null),
  h('span', { class: 'cta-txt' },
    h('span', { class: 'cta-k', text: next ? t('home.continue') : t('home.worldDone') }),
    h('span', { class: 'cta-lvl', text: next ? `${next.emoji} ${gameTitle(next)}` : t('home.pickLevel') }),
    h('span', { class: 'cta-prog' },
      h('span', { class: 'cta-bar' }, h('i', { style: { transform: `scaleX(${pct})` } })),
      h('span', { class: 'cta-stars', text: `⭐ ${got}/${total}` }))),
  h('span', { class: 'cta-go', 'aria-hidden': 'true' }, svgFrom('<svg viewBox="0 0 24 24"><path d="M8 5 L19 12 L8 19Z"/></svg>'))), 2);

  // ── плитки режимів
  const el = st.active_dragon;
  const dstage = stageOf(st.dragons[el] || 0);
  const tile = (cls, title, sub, onClick, art, i) => {
    const b = h('button', { class: `mode-tile ${cls}`, type: 'button', data: { sfx: 'open' }, on: { click: () => { app.tg.tap('light'); jelly(b); onClick(); } } },
      h('span', { class: 'mt-art', 'aria-hidden': 'true' }, art),
      h('span', { class: 'mt-title', text: title }), h('span', { class: 'mt-sub', text: sub }));
    return setI(b, i);
  };
  const grid = setI(h('div', { class: 'mode-grid' },
    tile('mt-path mt-riddle', RD.riddleLabel(), RD.riddleSub(), () => RD.openRiddle(app, () => app.home()),
      h('div', { class: 'rd-art', 'aria-hidden': 'true' }, h('span', { text: RD.riddleSolved() ? RD.todayRiddle().emoji : '🧩' }), h('b', { text: RD.riddleSolved() ? '✓' : '?' })), 0),
    tile('mt-map', t('home.map'), t('home.opened', { n: st.unlocked.filter((id) => getWorld(id) && !/^c\d+$/.test(id)).length, total: app.content.WORLDS.length }), () => app.go('map'),
      h('img', { src: app.asset('map.png'), alt: '', loading: 'lazy' }), 1),
    tile('mt-durak', t('home.verbs'), t('home.verbsSub'), () => app.go('verbsbook'),
      h('img', { src: app.asset('covers/verbs.png'), alt: '', loading: 'lazy' }), 2),
    tile('mt-dragon', t('home.dragons'), `${t('el.' + el)} · ${dstage[2]}`, () => app.go('dragons'),
      h('img', { src: app.asset(`dragon/${el}_${dstage[0]}.png`), alt: '', loading: 'lazy' }), 3)), 3);

  const links = setI(h('nav', { class: 'home-links', 'aria-label': t('home.more') },
    h('button', { class: 'hl', type: 'button', on: { click: () => app.go('profile') } }, h('span', { 'aria-hidden': 'true', text: '👤' }), t('home.profileLvl', { n: levelOf(st.xp) })),
    h('button', { class: 'hl hl-exam', type: 'button', data: { sfx: 'open' }, on: { click: () => app.go('exam') } }, h('span', { 'aria-hidden': 'true', text: '🎓' }), t('home.exam')),
    h('button', { class: 'hl', type: 'button', on: { click: () => app.go('placement') } }, h('span', { 'aria-hidden': 'true', text: '🧭' }), t('home.placement')),
    h('button', { class: 'hl', type: 'button', data: { sfx: 'open' }, on: { click: () => helpModal(app) } }, h('span', { 'aria-hidden': 'true', text: '❓' }), t('home.howTo'))), 5);

  // v19: «🌍 Подорож» — поряд зі світами (до B1 — замок і тизер)
  const tOpen = travelOpen(st);
  const cl = countryList();
  const cDone = cl.filter((c) => countryDone(st, c.id)).length;
  const travel = setI(h('button', {
    class: `home-travel${tOpen ? '' : ' locked'}`, type: 'button', data: { sfx: tOpen ? 'open' : 'none' },
    on: { click: () => { app.tg.tap('light'); jelly(travel); if (tOpen) app.go('globe'); else app.toast(t('travel.teaser'), 4200); } },
  }, h('span', { class: 'ht-globe', 'aria-hidden': 'true', text: tOpen ? '🌍' : '🔒' }),
  h('span', { class: 'ht-txt' }, h('b', { text: t('travel.btn') }),
    h('small', { text: tOpen ? t('travel.sub', { n: cDone, total: cl.length || 10 }) : t('travel.lockSub') })),
  h('span', { class: 'ht-plane', 'aria-hidden': 'true', text: '✈️' })), 3);

  root.append(h('div', { class: 'home' }, stage, strip, cont, travel, grid, links));

  const lumi = app.makeLumi(lumiBox, { size: 160, emotion: sleepy ? 'sleepy' : 'hello' });
  const timers = [];
  timers.push(setTimeout(() => lumi.say(greet), 450));
  timers.push(setTimeout(() => {
    strip.querySelectorAll('.res-n').forEach((n, k) => fx.countUp(n, 0, +n.dataset.to, 700 + k * 150));
  }, 380));
  if (sleepy) {
    app.session.sleepy = false;
    timers.push(setTimeout(() => { lumi.set('excited'); lumi.say(t('home.letsGo')); }, 3800));
  } else {
    timers.push(setTimeout(() => lumi.set('happy'), 2600));
  }
  return () => { timers.forEach(clearTimeout); unTheme(); };
}

function helpModal(app) {
  const ICONS = ['🗺', '📖', '🧩', '🔊', '⭐', '💌', '🔓', '⚔️', '🍀', '🃏'];
  const lines = ICONS.map((ic, i) => [ic, t(`help.${i + 1}`)]);

  const close = () => { m.classList.remove('in'); setTimeout(() => m.remove(), 250); };
  const m = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('home.howTo') },
    h('div', { class: 'modal-scrim', on: { click: close } }),
    h('div', { class: 'modal-card' },
      h('h3', { class: 'modal-title', text: t('home.howTo') }),
      h('ul', { class: 'help-list' }, lines.map(([i, t]) => h('li', h('span', { class: 'help-i', text: i }), h('span', { text: t })))),
      h('div', { class: 'modal-actions one' }, button(t('common.ok'), { variant: 'primary', onClick: close }))));
  document.body.append(m);
  requestAnimationFrame(() => m.classList.add('in'));
}
