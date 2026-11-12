/**
 * LumiQuest Mini App — точка входу, роутер екранів, спільний контекст.
 *
 *  app.content            розпарсений content.json
 *  app.state              стан гравця (див. state.js)
 *  app.save()             зберегти (localStorage одразу, CloudStorage з debounce) + оновити topBar
 *  app.go(name, params, {replace})   перейти на js/screens/<name>.js (анімація, історія, BackButton)
 *  app.back()             назад (або на home)
 *  app.home()             очистити історію і на home
 *  app.lumi               Лумі поточного екрана (останній створений makeLumi) або null
 *  app.makeLumi(container, {size, emotion, bubble:'top'|'right'|'left', global=true}) -> {set, say, react, destroy}
 *                         справжній createLumi з js/lumi.js або фолбек на PNG
 *  app.tg                 обгортка tg.js;  app.fx — ефекти (js/fx.js або фолбеки)
 *  app.ui, app.S          модулі ui.js і state.js (для зручності)
 *  app.world(wid), app.quest(qid) -> {world, quest}
 *  app.asset(path)        'assets/' + path
 *  app.toast(text), app.confirm(text, opts) -> Promise<bool>
 *  app.session            {sleepy, firstRun} — прапорці поточного запуску
 *  app.setTopbar(visible) показати/сховати верхню панель (екран може експортувати meta = {topbar:false})
 *  app.reset()            скинути прогрес (новий стан, онбординг знову)
 *  app.t, app.tc, app.tw  i18n (js/i18n.js);  app.setLang(l) — миттєве перемикання (перерендер екрана)
 *  app.audio              безпечний проксі js/audio.js (sfx, music, speak…; без файла — no-op);  app.sfx(name)
 *  app.rerender()         перемалювати поточний екран без анімації (напр. після зміни мови)
 *
 * Звук кнопок — глобальний делегат кліків: data-sfx="tap|back|open|none" на кнопці (за замовчуванням tap).
 * Музика — у роутері за назвою екрана (MUSIC нижче).
 *
 * Екран: export function render(root, params, app) { ...; return cleanup? }
 *        export const meta = { topbar: true }   // необов'язково
 */
import { tg, waitTelegram } from './tg.js?v=20261112121326';
import { loadState, saveState, flushState, clearState } from './storage.js?v=20261112121326';
import * as S from './state.js?v=20261112121326';
import * as UI from './ui.js?v=20261112121326';
import * as I18N from './i18n.js?v=20261112121326';
import './travel.js';   // v19: рядки i18n і ядро подорожі (глобус, паспорт, митниця…)
const { t } = I18N;

const stageEl = document.getElementById('stage');
{ const m = document.querySelector('#splash .splash-msg'); if (m) m.textContent = t('app.loading'); }
const shell = document.getElementById('app');

let lumiMod = null;
const stack = [];          // [{name, params}]
let current = null;        // {name, params, el, cleanup}
let navToken = 0;
let screenLumis = [];      // усі Лумі поточного екрана — знищуємо при переході

export const app = {
  content: null,
  state: null,
  tg,
  fx: UI.fx,
  ui: UI,
  S,
  lumi: null,
  t: I18N.t,
  tc: I18N.tc,
  tw: I18N.tw,
  audio: UI.audio,
  sfx: (n) => UI.audio.sfx(n),
  session: { sleepy: false, firstRun: false },
  topbar: null,

  asset: (p) => p.replace(/\.png$/, '.webp').replace(/^covers\//, 'cover_').split('/').pop(),
  world: (wid) => S.getWorld(wid),
  quest: (qid) => S.getQuest(qid),
  toast: (t, ms) => UI.toast(t, ms),
  confirm: (t, o) => UI.confirmDialog(t, o),

  save() {
    if (!this.state) return;
    S.markDay(this.state);
    this.state.savedAt = Date.now();
    saveState(this.state);
    if (this.topbar) this.topbar.update(true);
  },

  makeLumi(container, opts = {}) {
    const { size = 140, emotion, global = true, bubble = 'top' } = opts;
    let l = null;
    if (lumiMod && typeof lumiMod.createLumi === 'function') {
      try { l = lumiMod.createLumi(container, { size, emotion: emotion || 'happy', bubble }); } catch (e) { console.warn('[lumi] createLumi failed', e); }
    }
    if (!l) l = fallbackLumi(container, { size });
    const safeL = guardLumi(l);
    screenLumis.push(safeL);
    if (emotion) safeL.set(emotion);
    if (global) this.lumi = safeL;
    return safeL;
  },

  setTopbar(visible) {
    shell.classList.toggle('no-topbar', !visible);
  },

  go(name, params = {}, { replace = false } = {}) {
    if (replace && stack.length) stack.pop();
    // екран уже є в історії (напр. «🗺 Карта» з результату арени) — повертаємося до нього, без дублів
    const key = (e) => e.name + JSON.stringify(e.params || {});
    const idx = stack.findIndex((e) => key(e) === key({ name, params }));
    if (idx >= 0) {
      stack.length = idx + 1;
      return show(name, params, 'back');
    }
    stack.push({ name, params });
    return show(name, params, 'fwd');
  },
  back() {
    if (stack.length <= 1) return this.home();
    stack.pop();
    const prev = stack[stack.length - 1];
    return show(prev.name, prev.params, 'back');
  },
  home() {
    const dir = stack.length > 1 ? 'back' : 'fade';
    stack.length = 0;
    stack.push({ name: 'home', params: {} });
    return show('home', {}, dir);
  },

  async reset() {
    await clearState();
    const name = this.state ? this.state.name : (tg.userName() || t('common.friend'));
    this.state = S.newState(name);
    this.state.settings.lang = I18N.lang();
    this.session.firstRun = true;
    this.session.greeted = false;
    this.save();
    flushState();
    this.topbar.update(false);
    return this.home();
  },

  setLang(l) {
    I18N.setLang(l); // пише state.settings.lang + зберігає; подія 'langchange' → rerender
  },

  /** Перебудувати верхню панель і заголовок під поточну мову. */
  refreshChrome() {
    document.title = t('app.title');
    if (!this.topbar) return;
    const old = this.topbar.el;
    this.topbar = UI.topBar(this);
    old.replaceWith(this.topbar.el);
    this.topbar.update(false);
    updateBack();
  },

  rerender() {
    if (!current) return;
    show(current.name, current.params, 'none');
  },
};

// ─────────────────────────────────────────────────────────── Lumi
function guardLumi(l) {
  const call = (fn, ...a) => { try { return l && typeof l[fn] === 'function' ? l[fn](...a) : undefined; } catch (e) { console.warn('[lumi]', fn, e); return undefined; } };
  return {
    set: (e) => call('set', e),
    say: (t, ...a) => call('say', t, ...a),
    react: (k) => call('react', k),
    destroy: () => call('destroy'),
    raw: l,
  };
}

const EMOTIONS = ['hello', 'happy', 'excited', 'thinking', 'surprised', 'sad', 'proud', 'cheer', 'sleepy'];
function fallbackLumi(container, { size }) {
  const img = UI.h('img', { class: 'lumi-img', alt: t('common.lumi'), draggable: 'false', src: app.asset('lumi/happy.png') });
  const bubble = UI.h('div', { class: 'lumi-say', role: 'status', 'aria-live': 'polite' });
  const wrap = UI.h('div', { class: 'lumi-fallback' }, img, bubble);
  wrap.style.setProperty('--size', size + 'px');
  container.append(wrap);
  let sayT = null; let typeT = null;
  const phrases = [t('lumi.tickle1'), t('lumi.tickle2'), t('lumi.tickle3'), t('lumi.tickle4')];
  wrap.addEventListener('click', () => {
    wrap.classList.remove('hop'); void wrap.offsetWidth; wrap.classList.add('hop');
    api.say(phrases[Math.floor(Math.random() * phrases.length)]);
    tg.tap('soft');
  });
  const api = {
    set(e) {
      if (!EMOTIONS.includes(e)) return;
      const src = app.asset(`lumi/${e}.png`);
      if (img.getAttribute('src') === src) return;
      img.classList.add('swap');
      setTimeout(() => { img.src = src; img.classList.remove('swap'); }, 140);
      wrap.dataset.emotion = e;
    },
    say(text, o) {
      const ms = (o && o.ms) || (typeof o === 'number' ? o : 3200);
      clearTimeout(sayT); clearInterval(typeT);
      if (!text) { bubble.classList.remove('in'); return; }
      bubble.textContent = '';
      bubble.classList.add('in');
      const chars = Array.from(String(text));
      let i = 0;
      typeT = setInterval(() => { bubble.textContent += chars[i++] || ''; if (i >= chars.length) clearInterval(typeT); }, 22);
      sayT = setTimeout(() => bubble.classList.remove('in'), ms + chars.length * 22);
    },
    react() { wrap.classList.remove('hop'); void wrap.offsetWidth; wrap.classList.add('hop'); },
    destroy() { clearTimeout(sayT); clearInterval(typeT); wrap.remove(); },
  };
  return api;
}

// ─────────────────────────────────────────────────────────── router
const screenCache = {};
async function loadScreen(name) {
  if (screenCache[name]) return screenCache[name];
  if (!/^[a-z_0-9]+$/.test(name)) throw new Error('bad screen name');
  const mod = await import(`./${name}.js?v=20261112121326`);
  screenCache[name] = mod;
  return mod;
}

function placeholder(root, name, err) {
  const titles = { story: t('ph.story'), arena: t('ph.arena'), dragons: t('ph.dragons'), durak: t('ph.durak') };
  const box = UI.h('div', { class: 'ph-wrap' });
  const lumiBox = UI.h('div', { class: 'ph-lumi' });
  box.append(lumiBox,
    UI.h('h2', { class: 'title-sticker', text: titles[name] || t('ph.soon') }),
    UI.h('p', { class: 'muted', text: t('ph.building') }),
    UI.button(t('ph.return'), { variant: 'primary', sfx: 'back', onClick: () => app.back() }));
  root.append(box);
  app.makeLumi(lumiBox, { size: 150, emotion: 'sleepy' });
  if (err) console.warn(`[router] screen "${name}" unavailable:`, err);
}

// ─────────────────────────────────────────────────────────── music
const MENU = new Set(['home', 'map', 'profile', 'dragons', 'verbsbook', 'exam', 'globe', 'passport', 'quizwhere']);   // v19: подорож
const GAME = new Set(['obby', 'runner', 'brawl']);
const COUNTRY_TRACK = { c1: 'w3', c2: 'w1', c3: 'w2', c4: 'w5', c5: 'w1', c6: 'w4', c7: 'w2', c8: 'w1', c9: 'w4', c10: 'w3' }; // v19 (c6–c10 — Дизайн Б: додати сюди)
function trackFor(name, params = {}) {
  if (MENU.has(name)) return 'menu';
  if (name === 'arena') return 'boss';
  if (GAME.has(name)) return 'game';
  let wid = params.wid;
  if (!wid && params.qid) { const q = S.getQuest(params.qid); wid = q && q.world.id; }
  if (!wid && app.state) wid = S.currentWorldId(app.state);
  // v19: країни — трек одного зі світів за настроєм (c1 туманне місто → годинники, c2 → ранок, c3 → ліс, c4 → вечірня арфа, c5 → ранок)
  const cm = /^c(\d+)(?!\d)/.exec(String(params.wid || params.qid || wid || ''));
  if (cm) return COUNTRY_TRACK[`c${cm[1]}`] || 'w3';
  if (S.worldIndex(wid) < 0) return 'menu';
  // v11: трек — за id світу; проміжні світи (w1b/w1c/w2b/w3b) грають трек свого базового (w1/w2/w3)
  const m = /^w([1-5])[bc]?$/.exec(String(wid));
  return m ? `w${m[1]}` : 'menu';
}

// v17: перехід між екранами — новий екран рендериться під/над старим ще до анімації (старий видно до кінця
// рендера → без «порожнього» кадру), далі ОДИН короткий slide/fade (≤ 260 мс, лише transform/opacity, WAAPI → композитор),
// старий знімається одразу по завершенні. Ніколи не тримаємо більше двох екранів: новий перехід миттєво добиває попередній.
const NAV_MS = 260;
const NAV_EASE = 'cubic-bezier(.22,.8,.3,1)';
let leaving = [];          // [{el, lumis, anims}] — екрани, що зараз зникають
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function dropLeaving() {
  const l = leaving; leaving = [];
  l.forEach((o) => {
    o.anims.forEach((a) => { try { a.cancel(); } catch (e) { /* */ } });
    o.el.remove();
    o.lumis.forEach((x) => { try { x.destroy(); } catch (e) { /* */ } });
  });
}

function animateSwap(oldEl, newEl, dir, done) {
  const fade = dir === 'fade' || reducedMotion();
  const sx = dir === 'back' ? -1 : 1;
  const D = fade ? 220 : NAV_MS;
  const anims = [];
  if (typeof newEl.animate !== 'function') { done(); return anims; }
  anims.push(newEl.animate(fade
    ? [{ opacity: 0, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' }]
    : [{ opacity: 0, transform: `translate3d(${sx * 36}px,0,0)` }, { opacity: 1, transform: 'none' }],
  { duration: D, easing: NAV_EASE }));
  if (oldEl) {
    anims.push(oldEl.animate(fade
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translate3d(${-sx * 28}px,0,0)` }],
    { duration: Math.round(D * 0.8), easing: 'ease-in', fill: 'forwards' }));
  }
  let fin = false;
  const end = () => { if (fin) return; fin = true; done(); };
  anims[0].finished.then(end, end);
  setTimeout(end, D + 400); // страховка (вкладка у фоні тощо)
  return anims;
}

async function show(name, params, dir) {
  const token = ++navToken;
  tg.tap('soft');
  if (dir === 'fwd' || dir === 'back') UI.audio.sfx('whoosh');
  UI.audio.music(trackFor(name, params));
  let mod = null; let err = null;
  // v19: 'special' → унікальна міні-гра країни screens/special_<wid>.js
  try { mod = await loadScreen(name === 'special' ? `special_${(params && params.wid) || ''}` : name); } catch (e) { err = e; }
  if (token !== navToken) return;

  dropLeaving(); // попередній перехід ще йде — добиваємо (не більше двох екранів одночасно)
  // старий екран: стоп логіки одразу, але DOM лишається видимим, поки новий рендериться
  const old = current;
  const oldLumis = screenLumis;
  if (old) {
    try { old.cleanup && old.cleanup(); } catch (e) { console.warn('[router] cleanup', e); }
    old.el.setAttribute('aria-hidden', 'true');
    old.el.inert = true;
    old.el.classList.add('is-leaving');
  }
  screenLumis = [];
  app.lumi = null;
  const el = UI.h('section', { class: `screen screen-${name}`, data: { screen: name, nav: dir } });
  stageEl.append(el);
  const meta = (mod && mod.meta) || {};
  app.setTopbar(meta.topbar !== false);
  current = { name, params, el, cleanup: null };
  updateBack();
  if (!mod) {
    placeholder(el, name, err);
  } else {
    try {
      const c = await mod.render(el, params || {}, app);
      if (token === navToken) current.cleanup = typeof c === 'function' ? c : null;
      else if (typeof c === 'function') c();
    } catch (e) {
      console.error(`[router] render "${name}" failed`, e);
      el.textContent = '';
      placeholder(el, name, null);
    }
  }
  el.scrollTop = 0;
  const kill = () => { old.el.remove(); oldLumis.forEach((l) => l.destroy()); };
  if (!old) { if (dir !== 'none') animateSwap(null, el, 'fade', () => {}); return; }
  if (dir === 'none' || document.hidden) { kill(); return; }
  if (token !== navToken) { kill(); return; } // уже йде наступний перехід
  const rec = { el: old.el, lumis: oldLumis, anims: [] };
  leaving.push(rec);
  rec.anims = animateSwap(old.el, el, dir, () => {
    const i = leaving.indexOf(rec);
    if (i < 0) return; // уже прибрано dropLeaving()
    leaving.splice(i, 1);
    kill();
  });
}

function updateBack() {
  const can = stack.length > 1 || (current && current.name !== 'home');
  if (can) tg.back.show(() => app.back()); else tg.back.hide();
  if (app.topbar) app.topbar.setBack(can && !tg.isTelegram);
}

// ─────────────────────────────────────────────────────────── theme
function applyTheme() {
  const dark = tg.scheme === 'dark';
  document.documentElement.dataset.scheme = dark ? 'dark' : 'light';
  const cs = getComputedStyle(document.documentElement);
  tg.setColors(cs.getPropertyValue('--sky-top').trim() || '#C8D2FF', cs.getPropertyValue('--sky-bottom').trim() || '#FFE2CF');
}

// ─────────────────────────────────────────────────────────── sfx: глобальний делегат кліків
function wireSound() {
  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    UI.audio.initAudio();
    if (current) UI.audio.music(trackFor(current.name, current.params)); // iOS: музика лише після першого жесту
  };
  document.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  document.addEventListener('keydown', unlock, { capture: true });
  document.addEventListener('click', (e) => {
    const b = e.target && e.target.closest && e.target.closest('[data-sfx], button, [role="button"], .tile');
    if (!b || b.disabled) return;
    let kind = b.dataset.sfx;
    if (!kind) kind = b.matches('.chip-back, .m-back, [aria-label="Назад"], [aria-label="Назад "]') ? 'back' : 'tap';
    if (kind !== 'none') UI.audio.sfx(kind);
  }, { capture: true });
}

// ─────────────────────────────────────────────────────────── boot
async function boot() {
  const [content] = await Promise.all([
    fetch('content.json?v=20261112121326').then((r) => { if (!r.ok) throw new Error('content.json ' + r.status); return r.json(); }),
    waitTelegram(),
  ]);
  tg.init();
  applyTheme();
  tg.onTheme(applyTheme);
  UI.setHaptics(tg);

  // необовʼязкові модулі інших агентів — безпечно
  const [fxM, lumiM] = await Promise.all([
    import('./fx.js?v=20261112121326').catch((e) => { console.info('[app] fx.js not loaded, using fallbacks', e && e.message); return null; }),
    import('./lumi.js?v=20261112121326').catch((e) => { console.info('[app] lumi.js not loaded, using PNG fallback', e && e.message); return null; }),
  ]);
  UI.setFx(fxM);
  lumiMod = lumiM;

  // аудіо — модуль іншого агента; немає файла → no-op заглушка
  import('./audio.js?v=20261112121326').then((m) => { UI.setAudio(m); if (current) UI.audio.music(trackFor(current.name, current.params)); })
    .catch((e) => console.info('[app] audio.js not loaded, silent mode', e && e.message));
  wireSound();

  app.content = content;
  S.setContent(content);
  I18N.setContent(content);
  I18N.bindState(() => app.state, () => app.save());
  let raw = await loadState();
  // v7: одноразове глобальне скидання — збереження іншої «епохи» замінюємо новим станом (і локально, і в хмарі)
  let epochReset = false;
  if (raw && raw.epoch !== S.RESET_EPOCH) { raw = null; epochReset = true; }
  app.state = S.sanitize(raw || S.newState(tg.userName()));
  app.session.firstRun = !raw;
  app.session.epochReset = epochReset;
  if (app.state.settings.lang) I18N.setLang(app.state.settings.lang, { silent: true });
  else app.state.settings.lang = I18N.lang();
  const tgName = tg.userName();
  if (tgName) app.state.name = tgName.slice(0, 40);
  app.session.sleepy = S.markDay(app.state).sleepy;
  app.save();
  if (epochReset) flushState();
  window.addEventListener('langchange', () => { app.refreshChrome(); app.rerender(); });
  document.title = t('app.title');

  app.topbar = UI.topBar(app);
  shell.insertBefore(app.topbar.el, stageEl);
  app.topbar.update(false);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushState();
    // v6: прихована вкладка/WebView — усі CSS-анімації на паузі
    document.documentElement.classList.toggle('lq-hidden', document.hidden);
  });
  window.addEventListener('pagehide', () => flushState());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.querySelector('.modal') && !document.querySelector('.fb-sheet')) app.back();
  });

  document.getElementById('splash')?.classList.add('out');
  setTimeout(() => document.getElementById('splash')?.remove(), 600);
  window.app = app; // для налагодження й тестів
  app.home();
  perfProbe();
}

// ─────────────────────────────────────────────────────────── v6: авто-«lite»
// Перші ~2 с після старту міряємо rAF-fps; якщо < 45 — html[data-perf=lite] (CSS зменшує частинки, тіні, фонові анімації).
// Ручне перемикання: ?perf=lite | ?perf=full.
function perfProbe() {
  const root = document.documentElement;
  const force = /[?&]perf=(lite|full)\b/.exec(location.search);
  if (force) { if (force[1] === 'lite') root.dataset.perf = 'lite'; return; }
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // v10: на телефонах одразу «легкий» режим ефектів — плавність важливіша за декор
  if (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) { root.dataset.perf = 'lite'; return; }
  const WARM = 400, SPAN = 2000;
  let t0 = 0; let frames = 0; let start = 0;
  const tick = (t) => {
    if (document.hidden) return; // вкладку сховано — замір недостовірний
    if (!start) start = t;
    if (t - start < WARM) { requestAnimationFrame(tick); return; }
    if (!t0) { t0 = t; frames = 0; requestAnimationFrame(tick); return; }
    frames++;
    if (t - t0 < SPAN) { requestAnimationFrame(tick); return; }
    const fps = (frames * 1000) / (t - t0);
    app.session.fps = Math.round(fps);
    if (fps < 45) root.dataset.perf = 'lite';
  };
  requestAnimationFrame(tick);
}

boot().catch((e) => {
  console.error('[app] boot failed', e);
  const s = document.getElementById('splash');
  if (s) s.querySelector('.splash-msg').textContent = t('app.bootFail');
});

// v18: офлайн-режим — гра закешована service worker'ом; прогрес пишеться локально й синхронізується з хмарою, щойно є мережа
I18N.addStrings({
  uk: { 'net.off': '📴 Без інтернету — граємо далі, прогрес збережеться', 'net.on': '📶 Інтернет є — прогрес синхронізовано' },
  ru: { 'net.off': '📴 Без интернета — играем дальше, прогресс сохранится', 'net.on': '📶 Интернет есть — прогресс синхронизирован' },
});
try {
  addEventListener('offline', () => UI.toast(I18N.t('net.off'), 3200));
  addEventListener('online', () => UI.toast(I18N.t('net.on'), 2200));
} catch (e) { /* ignore */ }
