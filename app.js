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
 *  app.reset()            скинути прогрес
 *
 * Екран: export function render(root, params, app) { ...; return cleanup? }
 *        export const meta = { topbar: true }   // необов'язково
 */
import { tg, waitTelegram } from './tg.js';
import { loadState, saveState, flushState, clearState } from './storage.js';
import * as S from './state.js';
import * as UI from './ui.js';

const stageEl = document.getElementById('stage');
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
  session: { sleepy: false, firstRun: false },
  topbar: null,

  asset: (p) => `assets/${p.replace(/\.png$/, '.webp')}`,
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
    const name = this.state ? this.state.name : (tg.userName() || 'друже');
    this.state = S.newState(name);
    this.session.firstRun = true;
    this.save();
    this.topbar.update(false);
    return this.home();
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
  const img = UI.h('img', { class: 'lumi-img', alt: 'Лумі', draggable: 'false', src: app.asset('lumi/happy.png') });
  const bubble = UI.h('div', { class: 'lumi-say', role: 'status', 'aria-live': 'polite' });
  const wrap = UI.h('div', { class: 'lumi-fallback' }, img, bubble);
  wrap.style.setProperty('--size', size + 'px');
  container.append(wrap);
  let sayT = null; let typeT = null;
  const phrases = ['Хі-хі! 🤭', 'Лоскотно! ✨', 'Я сяю для тебе 🌟', 'Летімо далі? 💫'];
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
  if (!/^[a-z_]+$/.test(name)) throw new Error('bad screen name');
  const mod = await import(`./screens/${name}.js`);
  screenCache[name] = mod;
  return mod;
}

function placeholder(root, name, err) {
  const titles = { story: '💌 Історії', arena: '⚔️ Бос-арена', dragons: '🐉 Дракони', durak: '🃏 Картярня' };
  const box = UI.h('div', { class: 'ph-wrap' });
  const lumiBox = UI.h('div', { class: 'ph-lumi' });
  box.append(lumiBox,
    UI.h('h2', { class: 'title-sticker', text: titles[name] || 'Скоро тут буде диво' }),
    UI.h('p', { class: 'muted', text: 'Цей куточок світу ще будується. Лумі вже несе туди ліхтарики!' }),
    UI.button('Повернутися', { variant: 'primary', onClick: () => app.back() }));
  root.append(box);
  app.makeLumi(lumiBox, { size: 150, emotion: 'sleepy' });
  if (err) console.warn(`[router] screen "${name}" unavailable:`, err);
}

async function show(name, params, dir) {
  const token = ++navToken;
  tg.tap('soft');
  let mod = null; let err = null;
  try { mod = await loadScreen(name); } catch (e) { err = e; }
  if (token !== navToken) return;

  // прибрати попередній екран
  if (current) {
    const old = current;
    try { old.cleanup && old.cleanup(); } catch (e) { console.warn('[router] cleanup', e); }
    if (app.lumi) { /* екран сам знищує свою Лумі разом з DOM */ }
    old.el.classList.add(`leave-${dir}`);
    old.el.setAttribute('aria-hidden', 'true');
    old.el.inert = true;
    const oldLumis = screenLumis;
    setTimeout(() => { old.el.remove(); oldLumis.forEach((l) => l.destroy()); }, 380);
  }
  screenLumis = [];
  app.lumi = null;
  const el = UI.h('section', { class: `screen screen-${name} enter-${dir}`, data: { screen: name } });
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
  requestAnimationFrame(() => el.classList.remove(`enter-${dir}`));
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

// ─────────────────────────────────────────────────────────── boot
async function boot() {
  const [content] = await Promise.all([
    fetch('content.json').then((r) => { if (!r.ok) throw new Error('content.json ' + r.status); return r.json(); }),
    waitTelegram(),
  ]);
  tg.init();
  applyTheme();
  tg.onTheme(applyTheme);
  UI.setHaptics(tg);

  // необовʼязкові модулі інших агентів — безпечно
  const [fxM, lumiM] = await Promise.all([
    import('./fx.js').catch((e) => { console.info('[app] fx.js not loaded, using fallbacks', e && e.message); return null; }),
    import('./lumi.js').catch((e) => { console.info('[app] lumi.js not loaded, using PNG fallback', e && e.message); return null; }),
  ]);
  UI.setFx(fxM);
  lumiMod = lumiM;

  app.content = content;
  S.setContent(content);
  const raw = await loadState();
  app.state = S.sanitize(raw || S.newState(tg.userName()));
  app.session.firstRun = !raw;
  const tgName = tg.userName();
  if (tgName) app.state.name = tgName.slice(0, 40);
  app.session.sleepy = S.markDay(app.state).sleepy;
  app.save();

  app.topbar = UI.topBar(app);
  shell.insertBefore(app.topbar.el, stageEl);
  app.topbar.update(false);

  document.addEventListener('visibilitychange', () => { if (document.hidden) flushState(); });
  window.addEventListener('pagehide', () => flushState());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.querySelector('.modal') && !document.querySelector('.fb-sheet')) app.back();
  });

  document.getElementById('splash')?.classList.add('out');
  setTimeout(() => document.getElementById('splash')?.remove(), 600);
  window.app = app; // для налагодження й тестів
  app.home();
}

boot().catch((e) => {
  console.error('[app] boot failed', e);
  const s = document.getElementById('splash');
  if (s) s.querySelector('.splash-msg').textContent = 'Ой, не вдалося завантажити гру. Перевір інтернет і відкрий ще раз 🌙';
});
