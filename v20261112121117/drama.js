// 🎭 Шлях Вибору — інтерактивна кінодрама (letterbox, субтитри, рішення з таймером,
// гілки й кінцівки) і наприкінці анімована СХЕМА ШЛЯХУ (flowchart графа вузлів).
// Контент: WORLDS[i].drama (див. WEBAPP_SPEC v4). Відкриті вузли: state.drama_seen[wid] = [ids].
import * as S from './state.js?v=20261112121114';
import * as FX from './fx.js?v=20261112121114';
import * as L from './lumi.js?v=20261112121114';
import { recordGame, gameStars } from './games.js?v=20261112121114';
import { tr, tc, lang, sfx, speak, speakAuto, longPressSpeak, starSfx } from './i18n_modes.js?v=20261112121114';
import { createCharacter, characterIdFor } from './characters.js?v=20261112121114';

// ---------------------------------------------------------------- спільні дрібниці
const MODES_HREF = new URL('./modes.css?v=20261112121114', import.meta.url).href;
const G2_HREF = new URL('./games2.css?v=20261112121114', import.meta.url).href;
function loadCss(key, href) {
  let l = document.querySelector(`link[data-${key}-css]`);
  if (!l) {
    l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href; l.setAttribute(`data-${key}-css`, '1');
    l.addEventListener('load', () => { l.dataset.ready = '1'; }, { once: true });
    document.head.append(l);
  }
  return l;
}
function ensureCss(root) {
  const wait = [loadCss('modes', MODES_HREF), loadCss('games2', G2_HREF)].filter((l) => !l.dataset.ready && !l.sheet);
  if (!wait.length) return;
  root.style.visibility = 'hidden';
  let left = wait.length;
  const show = () => { if (--left <= 0) root.style.visibility = ''; };
  wait.forEach((l) => { l.addEventListener('load', show, { once: true }); l.addEventListener('error', show, { once: true }); });
  setTimeout(() => { root.style.visibility = ''; }, 1500);
}
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function fx(name, ...a) {
  try { const f = FX[name]; if (typeof f === 'function') return f(...a); } catch (e) { console.warn('fx', name, e); }
  return undefined;
}
function hap(app, kind = 'light') {
  const t = app?.tg;
  if (!t) return;
  try {
    const note = kind === 'success' || kind === 'error' || kind === 'warning';
    if (note && typeof t.notify === 'function') return t.notify(kind);
    if (!note && typeof t.tap === 'function') return t.tap(kind);
    if (typeof t.haptic === 'function') return t.haptic(kind);
  } catch (e) { /* без вібро */ }
}
function countUp(node, from, to, ms = 900) {
  if (typeof FX.countUp === 'function') { try { return FX.countUp(node, from, to, ms); } catch (e) { /* fallback */ } }
  node.textContent = to;
  return undefined;
}
function anim(node, frames, opts) {
  if (!node?.animate) return Promise.resolve();
  const o = typeof opts === 'number' ? { duration: opts } : { ...opts };
  if (reduced()) o.duration = Math.min(o.duration || 300, 120);
  try { return node.animate(frames, { easing: 'ease-out', fill: 'none', ...o }).finished.catch(() => {}); } catch (e) { return Promise.resolve(); }
}
function makeLumi(app, container, size, emotion) {
  try {
    if (typeof app?.makeLumi === 'function') return app.makeLumi(container, { size, emotion, global: false });
    if (typeof L.createLumi === 'function') { const l = L.createLumi(container, { size, emotion }); l?.set?.(emotion); return l; }
  } catch (e) { console.warn('lumi', e); }
  return null;
}
export const meta = { topbar: false };
const addXP = (st, n) => (typeof S.addXP === 'function' ? S.addXP(st, n) : (st.xp = (st.xp || 0) + n));
function onCorrect(st) {
  if (typeof S.onCorrectAnswer === 'function') return S.onCorrectAnswer(st);
  st.fireflies = (st.fireflies || 0) + 1;
  st.food = (st.food || 0) + 1;
}

// Типограф субтитрів: тап — допечатати миттєво
function typewriter(node, text, speed = 30) {
  let i = 0; let timer = null; let resolve;
  const done = new Promise((r) => { resolve = r; });
  const chars = Array.from(String(text || ''));
  node.textContent = '';
  node.classList.add('typing');
  const finish = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    node.textContent = chars.join('');
    node.classList.remove('typing');
    resolve();
  };
  const tick = () => {
    i += 1;
    node.textContent = chars.slice(0, i).join('');
    if (i >= chars.length) return finish();
    const ch = chars[i - 1];
    timer = setTimeout(tick, /[.!?…]/.test(ch) ? speed * 7 : /[,;:]/.test(ch) ? speed * 3 : speed);
  };
  if (reduced() || !chars.length) finish(); else timer = setTimeout(tick, speed);
  return { done, finish, get typing() { return timer !== null; } };
}

// ---------------------------------------------------------------- граф
export const ENDING_STARS = { good: 3, ok: 2, bad: 1 };
const ENDING_ICON = { good: '🌟', ok: '🌤', bad: '🥀' };
const ENDING_NAME = { get good() { return tr('drama.end_good'); }, get ok() { return tr('story.end_ok'); }, get bad() { return tr('story.end_bad'); } };

/** Ребра графа: [{from, to, timeout}] (timeout — лише якщо веде туди, куди не веде жоден вибір). */
export function dramaEdges(d) {
  const out = [];
  const nodes = d?.nodes || {};
  for (const [id, n] of Object.entries(nodes)) {
    if (n.ending) continue;
    const seen = new Set();
    for (const c of n.choices || []) if (c?.next && nodes[c.next] && !seen.has(c.next)) { seen.add(c.next); out.push({ from: id, to: c.next, timeout: false }); }
    if (n.timeout && nodes[n.timeout] && !seen.has(n.timeout)) out.push({ from: id, to: n.timeout, timeout: true });
  }
  return out;
}
/** Розкладка flowchart: шари = найдовший шлях від start, кінцівки — в останньому шарі. */
export function dramaLayout(d) {
  const nodes = d?.nodes || {};
  const ids = Object.keys(nodes);
  const edges = dramaEdges(d);
  const kids = {}; const parents = {};
  ids.forEach((id) => { kids[id] = []; parents[id] = []; });
  edges.forEach((e) => { kids[e.from].push(e.to); parents[e.to].push(e.from); });
  const layer = {};
  const visiting = new Set();
  const start = nodes[d.start] ? d.start : ids[0];
  // найдовший шлях (DAG; цикли ігноруємо)
  const order = []; const mark = {};
  const dfs = (id) => {
    if (mark[id] === 2 || visiting.has(id)) return;
    visiting.add(id);
    kids[id].forEach(dfs);
    visiting.delete(id);
    mark[id] = 2; order.push(id);
  };
  dfs(start);
  ids.forEach((id) => { if (!mark[id]) dfs(id); });
  order.reverse();
  order.forEach((id) => { if (layer[id] == null) layer[id] = id === start ? 0 : 0; });
  layer[start] = 0;
  for (const id of order) for (const k of kids[id]) if (order.indexOf(k) > order.indexOf(id)) layer[k] = Math.max(layer[k] || 0, layer[id] + 1);
  let maxL = 0;
  ids.forEach((id) => { if (!nodes[id].ending) maxL = Math.max(maxL, layer[id] || 0); });
  ids.forEach((id) => { if (nodes[id].ending) layer[id] = maxL + 1; });
  const layers = [];
  ids.forEach((id) => { (layers[layer[id]] = layers[layer[id]] || []).push(id); });
  for (let i = 0; i < layers.length; i++) layers[i] = layers[i] || [];
  // кінцівки: good → ok → bad
  const endRank = { good: 0, ok: 1, bad: 2 };
  const last = layers[layers.length - 1];
  if (last) last.sort((a, b) => (endRank[nodes[a].ending] ?? 3) - (endRank[nodes[b].ending] ?? 3));
  // барицентри (2 проходи) — менше перетинів
  const pos = {};
  const setPos = () => layers.forEach((ls) => ls.forEach((id, i) => { pos[id] = (i + 1) / (ls.length + 1); }));
  setPos();
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i < layers.length - 1; i++) {
      const bc = (id) => { const p = parents[id]; return p.length ? p.reduce((s, x) => s + pos[x], 0) / p.length : pos[id]; };
      layers[i].sort((a, b) => bc(a) - bc(b));
      setPos();
    }
  }
  return { layers, layer, pos, edges, kids, start };
}

// ---------------------------------------------------------------- екран
/** v6: екран повністю непрозорий — фонове небо застосунку (#sky) під ним не видно, ставимо його анімації на паузу. */
function skyCovered(on) {
  const h = document.documentElement, n = Math.max(0, (+h.dataset.gcanvas || 0) + (on ? 1 : -1));
  if (n) h.dataset.gcanvas = n; else delete h.dataset.gcanvas;
}

export function render(root, params, app) {
  ensureCss(root);
  root.classList.add('m-host');
  const inTg = !!app?.tg?.isTelegram;
  const st = app.state;
  const wid = params?.wid || 'w1';
  const world = (app.content?.WORLDS || []).concat(app.content?.COUNTRIES || []).find((w) => w.id === wid);
  const d = world?.drama;
  const gid = `${wid}-drama`;
  let alive = true;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms));
  const wait = (ms) => new Promise((r) => later(r, reduced() ? Math.min(ms, 80) : ms));

  const scr = el('div', `m-screen g2-screen g2-drama g2-${esc(wid)}`);
  root.append(scr);

  const valid = d && d.nodes && typeof d.nodes === 'object' && Object.keys(d.nodes).length;
  if (!world || !valid || !(st.unlocked || []).includes(wid)) {
    scr.innerHTML = `<div class="m-locked g2-dr-locked"><div class="m-locked-ico">${world && !valid ? '🎬' : '🔒'}</div>
      <p>${!world ? tr('drama.no_world') : !(st.unlocked || []).includes(wid) ? tr('common.locked_world') : tr('drama.no_script')}</p>
      <button class="m-btn" data-a="back">${tr('common.back')}</button></div>`;
    scr.querySelector('[data-a=back]').onclick = () => app.back();
    return () => { alive = false; };
  }
  const nodes = d.nodes;
  const allIds = Object.keys(nodes);
  const startId = nodes[d.start] ? d.start : allIds[0];
  const endingIds = allIds.filter((id) => nodes[id].ending);

  // відкриті вузли за всі проходження
  st.drama_seen = st.drama_seen && typeof st.drama_seen === 'object' ? st.drama_seen : {};
  const seenSet = () => new Set((st.drama_seen[wid] || []).filter((id) => nodes[id]));
  const markSeen = (id) => {
    const arr = Array.isArray(st.drama_seen[wid]) ? st.drama_seen[wid] : (st.drama_seen[wid] = []);
    if (!arr.includes(id)) { arr.push(id); dirty = true; }
  };
  const pctOpen = () => Math.round((seenSet().size / allIds.length) * 100);
  let dirty = false;

  scr.innerHTML = `
    <div class="g2-film">
      <div class="g2-film-bg"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="g2-grain"></div>
    </div>
    <div class="g2-lb top"><header class="m-head g2-dr-head">
      <button class="m-back" ${tr('common.back_aria')}${inTg ? ' hidden' : ''}>‹</button>
      <div class="m-title">🎭 ${esc(tc(d, 'title') || tr('drama.title_def'))}</div>
      <div class="g2-dr-step"></div>
      <button class="g2-pause" ${tr('common.pause_aria')}>⏸</button>
    </header></div>
    <div class="g2-stage">
      <div class="g2-scene"><span class="g2-scene-txt"></span></div>
      <div class="g2-cast">
        <div class="g2-dr-lumi"></div>
        <div class="g2-actor"><div class="g2-actor-face"></div><div class="g2-actor-name"></div></div>
      </div>
      <div class="g2-subs" role="button" tabindex="0">
        <div class="g2-subs-who"><span></span><button class="g2-hintbtn" aria-label="${tr('common.translate_aria')}">${tr('common.flag')}</button><button class="g2-hintbtn g2-say" aria-label="${tr('common.listen')}">🔊</button></div>
        <div class="g2-subs-line"></div>
        <div class="g2-subs-hint"></div>
      </div>
      <div class="g2-stamp"></div>
      <div class="g2-cut"></div>
    </div>
    <div class="g2-lb bot">
      <div class="g2-decide">
        <div class="g2-ring" hidden><svg viewBox="0 0 44 44"><circle class="bg" cx="22" cy="22" r="19"/><circle class="fg" cx="22" cy="22" r="19"/></svg><b></b></div>
        <div class="g2-choices"></div>
      </div>
    </div>`;
  const $ = (q) => scr.querySelector(q);
  const film = $('.g2-film');
  const sceneEl = $('.g2-scene');
  const sceneTxt = $('.g2-scene-txt');
  const subs = $('.g2-subs');
  const whoEl = $('.g2-subs-who span');
  const hintBtn = $('.g2-hintbtn:not(.g2-say)');
  const sayBtn = $('.g2-say');
  const lineEl = $('.g2-subs-line');
  const hintEl = $('.g2-subs-hint');
  const stampEl = $('.g2-stamp');
  const cutEl = $('.g2-cut');
  const actor = $('.g2-actor');
  const actorFace = $('.g2-actor-face');
  const actorName = $('.g2-actor-name');
  const stepEl = $('.g2-dr-step');
  const ringEl = $('.g2-ring');
  const ringFg = $('.g2-ring .fg');
  const ringNum = $('.g2-ring b');
  const choicesEl = $('.g2-choices');
  const pauseBtn = $('.g2-pause');
  const stageEl = $('.g2-stage');
  // підлаштування під висоту: спершу стискаємо каст, потім ховаємо його
  function fit() {
    if (!alive) return;
    stageEl.classList.remove('tight', 'tighter');
    const over = () => stageEl.scrollHeight > stageEl.clientHeight + 2;
    if (over()) stageEl.classList.add('tight');
    if (over()) stageEl.classList.add('tighter');
  }
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => fit()) : null;
  ro?.observe(stageEl);
  const RING_LEN = 2 * Math.PI * 19;
  ringFg.style.strokeDasharray = `${RING_LEN}`;

  let lumi = makeLumi(app, $('.g2-dr-lumi'), 92, 'thinking');
  let tw = null;
  let overlay = null;
  let ovLumi = null;
  let raf = 0;
  const run = { gen: 0, stage: 'intro', id: startId, path: [], good: 0, total: 0, timeLeft: 0, timerMax: 0, paused: false, lastTick: 0, prevSec: 0 };

  // ------------------------------------------------ дрібниці UI
  const ACTOR_COLORS = ['#ff8fb1', '#7fd1ff', '#ffd84a', '#9be38a', '#c6a2ff', '#ffab6b'];
  const actorColor = (name) => ACTOR_COLORS[[...String(name)].reduce((s, c) => s + c.charCodeAt(0), 0) % ACTOR_COLORS.length];
  // актор вузла — живий персонаж (characters.js); кешуємо за ім'ям
  let actorCh = null;
  function setActor(name) {
    if (!name) { actor.classList.remove('on'); actorCh?.talk(0); return; }
    if (actorName.textContent !== name || !actorCh) {
      actorName.textContent = name;
      actor.style.setProperty('--actor', actorColor(name));
      try { actorCh?.destroy(); } catch (e) { /* */ }
      actorCh = null;
      actorFace.textContent = '';
      try { actorCh = createCharacter(actorFace, (world && world.guide && characterIdFor(name) === 'mia' && wid === 'c8' ? 'mia_au' : characterIdFor(name)), { size: '100%' }); actorFace.classList.add('g2-actor-chr'); } catch (e) {
        console.warn('drama char', e);
        actorFace.textContent = [...name][0]?.toUpperCase() || '?';
      }
    }
    actorCh?.set('idle');
    actor.classList.add('on');
  }
  function lumiSet(emo) { try { lumi?.set?.(emo); } catch (e) { /* */ } }
  function stepInfo() {
    const n = run.path.filter((p) => !nodes[p.id]?.ending).length;
    stepEl.innerHTML = run.stage === 'intro' || run.stage === 'end' ? '' : `<span>${tr('drama.decision_n', { 0: n + (run.stage === 'decide' || run.stage === 'line' ? 1 : 0) })}</span>`;
  }
  hintBtn.addEventListener('click', (e) => { e.stopPropagation(); hap(app); hintEl.classList.toggle('show'); });
  sayBtn.addEventListener('click', (e) => { e.stopPropagation(); hap(app); speak(nodes[run.id]?.line); });
  subs.addEventListener('click', () => { if (tw?.typing) tw.finish(); });

  // ------------------------------------------------ таймер-кільце (rAF; на паузі стоїть)
  function startTimer(sec) {
    run.timerMax = sec; run.timeLeft = sec; run.prevSec = Math.ceil(sec);
    ringEl.hidden = false;
    ringEl.classList.remove('low');
    run.shownSec = run.shownLow = undefined;
    paintRing();
    run.lastTick = performance.now();
    loop();
  }
  function stopTimer() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function loop() {
    stopTimer();
    raf = requestAnimationFrame(tick);
  }
  function tick(now) {
    raf = 0;
    if (!alive || run.stage !== 'decide' || run.paused) return;
    const dt = Math.min(0.1, Math.max(0, (now - run.lastTick) / 1000));
    run.lastTick = now;
    run.timeLeft = Math.max(0, run.timeLeft - dt);
    paintRing();
    const sec = Math.ceil(run.timeLeft);
    if (sec !== run.prevSec) { run.prevSec = sec; if (sec <= 3 && sec > 0) { hap(app, 'light'); sfx('tick'); } }
    if (run.timeLeft <= 0) { timeout(); return; }
    raf = requestAnimationFrame(tick);
  }
  function paintRing() {
    const k = run.timerMax ? run.timeLeft / run.timerMax : 0;
    ringFg.style.strokeDashoffset = `${(RING_LEN * (1 - k)).toFixed(2)}`;
    // v6: DOM-текст і клас — лише при зміні (не щокадру)
    const sec = Math.ceil(run.timeLeft);
    if (sec !== run.shownSec) { run.shownSec = sec; ringNum.textContent = sec; }
    const low = run.timeLeft <= 3.05;
    if (low !== run.shownLow) { run.shownLow = low; ringEl.classList.toggle('low', low); }
  }

  // ------------------------------------------------ сцени
  async function cut() {
    cutEl.classList.add('on');
    await wait(380);
  }
  async function playNode(id) {
    if (!alive) return;
    const gen = run.gen;
    const stale = () => !alive || run.gen !== gen || run.id !== id;
    const n = nodes[id];
    if (!n) { console.warn('drama: немає вузла', id); return finishRun(null); }
    run.id = id;
    markSeen(id);
    if (n.ending) { run.path.push({ id, choice: null, good: null }); return finishRun(id); }
    run.stage = 'line';
    stepInfo();
    choicesEl.innerHTML = '';
    ringEl.hidden = true;
    subs.classList.remove('show');
    hintEl.classList.remove('show');
    film.classList.remove('good', 'bad');
    if (run.path.length) await cut();
    if (stale()) return;
    // нова сцена: Кен Бернс, опис сцени, актор
    film.style.setProperty('--kb', `${(run.path.length % 3) - 1}`);
    film.classList.remove('kb'); void film.offsetWidth; film.classList.add('kb');
    sceneTxt.textContent = tc(n, 'scene') || '';
    sfx('page');
    sceneEl.classList.remove('show'); void sceneEl.offsetWidth; sceneEl.classList.add('show');
    setActor(n.speaker || '');
    lumiSet('thinking');
    cutEl.classList.remove('on');
    await wait(n.scene ? 900 : 300);
    if (stale()) return;
    whoEl.textContent = n.speaker || '';
    hintBtn.hidden = !tc(n, 'hint');
    hintEl.textContent = tc(n, 'hint') || '';
    sayBtn.hidden = !n.line;
    lineEl.classList.toggle('long', String(n.line || '').length > 70);
    lineEl.textContent = n.line || '';
    fit();
    subs.classList.add('show');
    tw = typewriter(lineEl, n.line || '');
    if (n.speaker) actorCh?.talk(true);
    await tw.done;
    actorCh?.talk(0);
    if (stale() || run.stage !== 'line') return;
    speakAuto(n.line, 200);
    showChoices(n);
  }
  function showChoices(n) {
    run.stage = 'decide';
    stepInfo();
    choicesEl.innerHTML = '';
    (n.choices || []).forEach((c, k) => {
      const b = el('button', 'g2-choice', `<small>${k + 1}</small><span>${esc(c.text || '…')}</span>`);
      b.style.animationDelay = `${k * 90}ms`;
      b.onclick = () => pick(k);
      longPressSpeak(b, c.text);
      choicesEl.append(b);
    });
    choicesEl.classList.toggle('long', (n.choices || []).some((c) => String(c.text || '').length > 45));
    fit();
    const sec = Math.max(3, Math.min(30, Number(n.timer) || 12));
    startTimer(sec);
  }
  function pick(k) {
    if (run.stage !== 'decide' || run.paused) return;
    const n = nodes[run.id];
    const c = (n.choices || [])[k];
    if (!c) return;
    stopTimer();
    run.stage = 'feedback';
    run.total += 1;
    const btns = [...choicesEl.querySelectorAll('.g2-choice')];
    btns.forEach((b, j) => { b.disabled = true; b.classList.add(j === k ? (c.good ? 'ok' : 'bad') : 'dim'); });
    run.path.push({ id: run.id, choice: k, good: !!c.good });
    if (c.good) {
      run.good += 1;
      onCorrect(st); addXP(st, 10); dirty = true;
      hap(app, 'success');
      sfx('heart');
      lumiSet('happy');
      actorCh?.set('happy');
      film.classList.add('good');
      fx('sparkle', btns[k]);
    } else {
      hap(app, 'error');
      sfx('wrong');
      lumiSet('sad');
      actorCh?.set('sad');
      film.classList.add('bad');
      fx('shake', btns[k]);
    }
    showNote(c.good ? 'good' : 'bad', tc(c, 'note') || '', c.next, c.good ? '+10 XP' : '');
  }
  function timeout() {
    if (run.stage !== 'decide') return;
    stopTimer();
    run.stage = 'feedback';
    run.total += 1;
    const n = nodes[run.id];
    const next = nodes[n.timeout] ? n.timeout : ((n.choices || []).find((c) => !c.good) || (n.choices || [])[0] || {}).next;
    run.path.push({ id: run.id, choice: 'timeout', good: false });
    [...choicesEl.querySelectorAll('.g2-choice')].forEach((b) => { b.disabled = true; b.classList.add('dim'); });
    stampEl.textContent = tr('drama.timeout');
    stampEl.classList.remove('show'); void stampEl.offsetWidth; stampEl.classList.add('show');
    hap(app, 'warning');
    lumiSet('surprised');
    actorCh?.set('surprised');
    film.classList.add('bad');
    showNote('time', tr('drama.timeout_note'), next, '');
  }
  function showNote(kind, note, next, bonus) {
    later(() => {
      ringEl.hidden = true;
      const head = kind === 'good' ? tr('drama.good') : kind === 'time' ? tr('drama.time') : tr('drama.bad');
      const fb = el('div', `g2-note ${kind}`, `
        <div class="g2-note-head">${head}${bonus ? ` <em>${esc(bonus)}</em>` : ''}</div>
        ${note ? `<div class="g2-note-txt">${esc(note)}</div>` : ''}`);
      const go = el('button', 'm-btn m-btn-big g2-next', nodes[next]?.ending ? tr('drama.to_final') : tr('drama.next'));
      go.onclick = () => { if (run.stage !== 'feedback') return; hap(app); run.stage = 'line'; playNode(next); };
      fb.append(go);
      choicesEl.innerHTML = '';
      choicesEl.append(fb);
      fit();
      anim(fb, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], 320);
    }, kind === 'time' ? 900 : 550);
  }

  // ------------------------------------------------ старт / пауза
  function closeOverlay() {
    try { ovLumi?.destroy?.(); } catch (e) { /* */ }
    ovLumi = null;
    overlay?.remove(); overlay = null;
  }
  function showIntro() {
    closeOverlay();
    run.stage = 'intro';
    stepInfo();
    scr.classList.remove('rolling');
    const seen = seenSet();
    const best = gameStars(st, gid);
    const endsFound = endingIds.filter((id) => seen.has(id));
    overlay = el('div', 'g2-dr-intro');
    overlay.innerHTML = `
      <div class="g2-dr-intro-in">
        <div class="g2-dr-kicker">${tr('drama.kicker')} ${esc(world.emoji || '')} ${esc(tc(world, 'name') || '')}</div>
        <h1>${esc(tc(d, 'title') || tr('drama.untitled'))}</h1>
        <p class="g2-dr-logline">${esc(tc(d, 'intro') || '')}</p>
        <ul class="g2-rules g2-rules-dark">
          <li><span>💬</span>${tr('drama.r1')}</li>
          <li><span>⏳</span>${tr('drama.r2')}</li>
          <li><span>🎬</span>${tr('drama.r3', { 0: endingIds.length || 3 })}</li>
          <li><span>🗺</span>${tr('drama.r4')}</li>
        </ul>
        ${seen.size ? `<div class="g2-dr-progress"><div><b>${pctOpen()}%</b> ${tr('drama.paths_open')}</div>
          <div class="g2-dr-ends">${endingIds.map((id) => `<span title="${esc(tc(nodes[id], 'title') || '')}">${seen.has(id) ? ENDING_ICON[nodes[id].ending] || '🎬' : '🔒'}</span>`).join('')}</div>
          ${best ? `<div class="g2-best">${'⭐'.repeat(best)}${'☆'.repeat(3 - best)}</div>` : ''}</div>` : ''}
        <div class="g2-dr-btns">
          <button class="m-btn m-btn-alt m-btn-big" data-a="go">▶ ${seen.size ? tr('drama.play_again') : tr('drama.start')}</button>
          ${seen.size ? '<button class="m-btn m-btn-ghost m-btn-big" data-a="map">' + tr('drama.map_btn') + '</button>' : ''}
          <button class="m-btn m-btn-ghost m-btn-big" data-a="back">${tr('common.back')}</button>
        </div>
        <p class="g2-keys">${tr('drama.keys')}</p>
      </div>`;
    scr.append(overlay);
    overlay.querySelector('[data-a=go]').onclick = () => { hap(app, 'medium'); begin(); };
    overlay.querySelector('[data-a=back]').onclick = () => { hap(app); app.back(); };
    overlay.querySelector('[data-a=map]')?.addEventListener('click', () => { hap(app); showResult(null, { browse: true }); });
  }
  async function begin() {
    closeOverlay();
    if (tw?.typing) tw.finish();
    stopTimer();
    choicesEl.innerHTML = '';
    ringEl.hidden = true;
    subs.classList.remove('show');
    sceneEl.classList.remove('show');
    film.classList.remove('good', 'bad');
    const gen = run.gen + 1;
    Object.assign(run, { gen, stage: 'line', id: startId, path: [], good: 0, total: 0, paused: false });
    scr.classList.add('rolling'); // letterbox-смуги наїжджають
    lumiSet('thinking');
    sceneTxt.textContent = '';
    cutEl.classList.add('on');
    await wait(500);
    if (!alive || run.gen !== gen) return;
    playNode(startId);
  }
  function pause() {
    if (run.paused || !['line', 'decide', 'feedback'].includes(run.stage)) return;
    run.paused = true;
    stopTimer();
    if (tw?.typing) tw.finish();
    hap(app);
    overlay = el('div', 'm-overlay g2-ov g2-pause-ov');
    overlay.innerHTML = `
      <div class="m-end-card g2-card">
        <div class="g2-intro-ico">⏸</div>
        ${tr('common.pause_h')}
        <p class="g2-pause-stats">${tr('drama.pause_stats', { 0: run.total, 1: run.good })}</p>
        <div class="g2-col">
          <button class="m-btn m-btn-alt m-btn-big" data-a="resume">${tr('common.resume')}</button>
          <button class="m-btn m-btn-big" data-a="restart">${tr('common.restart')}</button>
          <button class="m-btn m-btn-ghost g2-dark m-btn-big" data-a="exit">${tr('common.exit')}</button>
        </div>
      </div>`;
    scr.append(overlay);
    overlay.querySelector('[data-a=resume]').onclick = resume;
    overlay.querySelector('[data-a=restart]').onclick = () => { hap(app); run.paused = false; closeOverlay(); begin(); };
    overlay.querySelector('[data-a=exit]').onclick = () => { hap(app); app.back(); };
  }
  function resume() {
    if (!run.paused) return;
    hap(app);
    closeOverlay();
    run.paused = false;
    if (run.stage === 'decide') { run.lastTick = performance.now(); loop(); }
  }

  // ------------------------------------------------ фінал + схема шляху
  function finishRun(endId) {
    run.stage = 'end';
    stopTimer();
    stepInfo();
    const kind = endId ? nodes[endId].ending : 'bad';
    const stars = ENDING_STARS[kind] || 1;
    const rec = recordGame(st, gid, stars);
    app.save?.(); dirty = false;
    lumiSet(kind === 'bad' ? 'sad' : 'proud');
    cutEl.classList.add('on');
    later(() => showResult(endId, { stars, rec }), 450);
  }

  function showResult(endId, { stars = 0, rec = null, browse = false } = {}) {
    closeOverlay();
    const seen = seenSet();
    const end = endId ? nodes[endId] : null;
    const kind = end?.ending || 'bad';
    const pathIds = browse ? [] : run.path.map((p) => p.id);
    const pathSet = new Set(pathIds);
    const pct = pctOpen();
    const endsFound = endingIds.filter((id) => seen.has(id)).length;
    overlay = el('div', `g2-dr-result ${browse ? 'browse' : kind}`);
    overlay.innerHTML = `
      <div class="g2-dr-res-in">
        ${browse ? '<div class="g2-dr-kicker">' + tr('drama.map_btn') + '</div>' : `
        <div class="g2-dr-end">
          <div class="g2-dr-kicker">${tr('drama.end_kicker')}${ENDING_NAME[kind] || ''}</div>
          <div class="g2-dr-end-ico">${ENDING_ICON[kind] || '🎬'}</div>
          <h2>${esc(tc(end, 'title') || tr('drama.the_end'))}</h2>
          <p class="g2-dr-end-txt">${esc(tc(end, 'text') || '')}</p>
          <div class="g2-stars"></div>
          ${rec?.isRecord ? '<div class="m-end-badge">' + tr('drama.record') + '</div>' : ''}
          <div class="g2-dr-sum"><span>${tr('drama.hits')} <b>${run.good}/${run.total}</b></span><span class="g2-xp">+<b>0</b> XP</span></div>
        </div>`}
        <div class="g2-map">
          <div class="g2-map-head">
            <div class="g2-map-title">${browse ? esc(tc(d, 'title') || '') : tr('drama.your_path')}</div>
            <div class="g2-map-pct"><b>0</b>% ${tr('drama.paths_open')}</div>
          </div>
          <div class="g2-map-bar"><i></i></div>
          <div class="g2-map-ends">${tr('drama.endings')} ${endingIds.map((id) => `<span class="${seen.has(id) ? 'on' : ''}">${seen.has(id) ? ENDING_ICON[nodes[id].ending] || '🎬' : '🔒'}</span>`).join('')} <small>${endsFound}/${endingIds.length}</small></div>
          <div class="g2-map-svg"></div>
          <div class="g2-map-cap">${tr('drama.map_cap')}</div>
        </div>
        ${!browse && kind !== 'good' ? '<p class="g2-dr-tip">' + tr('drama.tip') + '</p>' : ''}
      </div>
      <div class="g2-dr-res-btns">
        ${browse
    ? '<button class="m-btn m-btn-ghost" data-a="close">' + tr('common.back') + '</button><button class="m-btn m-btn-alt" data-a="again">' + tr('drama.play') + '</button>'
    : '<button class="m-btn" data-a="again">' + tr('common.again') + '</button><button class="m-btn m-btn-alt" data-a="next">' + tr('common.next') + '</button>'}
      </div>`;
    scr.append(overlay);
    cutEl.classList.remove('on');
    const svgBox = overlay.querySelector('.g2-map-svg');
    const cap = overlay.querySelector('.g2-map-cap');
    const drawn = drawMap(svgBox, seen, pathIds, browse ? 300 : 1900, (id) => {
      const n = nodes[id];
      hap(app);
      if (!seen.has(id)) { cap.innerHTML = tr('drama.locked_scene'); return; }
      cap.innerHTML = n.ending
        ? `${ENDING_ICON[n.ending] || '🎬'} <b>${esc(tc(n, 'title') || '')}</b> — ${esc(tc(n, 'text') || '')}`
        : `🎬 ${esc(tc(n, 'scene') || '')}${n.line ? ` <i>«${esc(n.line)}»</i>` : ''}`;
    });
    const pctB = overlay.querySelector('.g2-map-pct b');
    const bar = overlay.querySelector('.g2-map-bar i');
    later(() => { countUp(pctB, 0, pct, 1100); bar.style.width = pct + '%'; }, browse ? 200 : drawn);
    if (!browse) {
      later(() => fx('starsDrop', overlay.querySelector('.g2-stars'), stars), 450);
      sfx(kind === 'bad' ? 'lose' : 'win');
      starSfx(stars, 650);
      later(() => countUp(overlay.querySelector('.g2-xp b'), 0, run.good * 10, 800), 700);
      if (stars === 3) later(() => fx('confetti'), 1100);
      // схема — під фіналом: плавно прокручуємо до неї, коли вона почне «малюватись»
      later(() => {
        const box = overlay?.querySelector('.g2-map');
        if (!box) return;
        const top = box.offsetTop - 12;
        try { overlay.scrollTo({ top, behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { overlay.scrollTop = top; }
      }, 1500);
      hap(app, kind === 'bad' ? 'warning' : 'success');
      lumiSet(kind === 'bad' ? 'sad' : kind === 'good' ? 'proud' : 'happy');
    }
    overlay.querySelector('[data-a=again]').onclick = () => { hap(app, 'medium'); begin(); };
    overlay.querySelector('[data-a=next]')?.addEventListener('click', () => { hap(app); app.back(); });
    overlay.querySelector('[data-a=close]')?.addEventListener('click', () => { hap(app); showIntro(); });
  }

  // SVG-схема: пройдений шлях «малюється» лінією, невідкриті вузли — 🔒. Повертає тривалість анімації (мс).
  function drawMap(box, seen, pathIds, BASE, onTap) {
    const lay = dramaLayout(d);
    const nL = lay.layers.length;
    const maxW = Math.max(...lay.layers.map((l) => l.length));
    const VW = Math.max(320, maxW * 74);
    const GAP = 64; const TOP = 30;
    const VH = TOP * 2 + (nL - 1) * GAP;
    const P = {};
    allIds.forEach((id) => { P[id] = [lay.pos[id] * VW, TOP + lay.layer[id] * GAP]; });
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    svg.setAttribute('class', 'g2-flow');
    svg.innerHTML = `<defs>
      <filter id="g2glow" filterUnits="userSpaceOnUse" x="0" y="0" width="${VW}" height="${VH}"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>`;
    const R = 17;
    const curve = (a, b) => {
      const [x1, y1] = P[a]; const [x2, y2] = P[b];
      const sy = y1 + R; const ey = y2 - (nodes[b].ending ? 15 : R);
      const my = (sy + ey) / 2;
      return `M${x1.toFixed(1)},${sy.toFixed(1)} C${x1.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${ey.toFixed(1)}`;
    };
    const gE = document.createElementNS(NS, 'g');
    lay.edges.forEach((e) => {
      const p = document.createElementNS(NS, 'path');
      const known = seen.has(e.from) && seen.has(e.to);
      p.setAttribute('d', curve(e.from, e.to));
      p.setAttribute('class', `g2-edge${known ? ' known' : ''}${e.timeout ? ' tmo' : ''}`);
      gE.append(p);
    });
    svg.append(gE);
    // пройдений шлях
    const steps = [];
    for (let i = 1; i < pathIds.length; i++) if (P[pathIds[i - 1]] && P[pathIds[i]]) steps.push([pathIds[i - 1], pathIds[i]]);
    const STEP_MS = reduced() ? 60 : 420;
    const gP = document.createElementNS(NS, 'g');
    gP.setAttribute('filter', 'url(#g2glow)');
    steps.forEach(([a, b], i) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', curve(a, b));
      p.setAttribute('class', 'g2-walk');
      p.setAttribute('pathLength', '100');
      gP.append(p);
      p.style.animationDelay = `${BASE + i * STEP_MS}ms`;
      p.style.animationDuration = `${STEP_MS}ms`;
    });
    svg.append(gP);
    // вузли
    const order = {};
    pathIds.forEach((id, i) => { if (order[id] == null) order[id] = i; });
    let num = 0;
    const numOf = {};
    lay.layers.forEach((ls) => ls.forEach((id) => { if (!nodes[id].ending) numOf[id] = ++num; }));
    allIds.forEach((id) => {
      const n = nodes[id];
      const [x, y] = P[id];
      const g = document.createElementNS(NS, 'g');
      const onPath = order[id] != null;
      const known = seen.has(id);
      g.setAttribute('class', `g2-node${n.ending ? ` end ${n.ending}` : ''}${known ? ' known' : ' locked'}${onPath ? ' path' : ''}${id === startId ? ' start' : ''}`);
      g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      const label = n.ending ? (known ? ENDING_ICON[n.ending] || '🎬' : '🔒') : known ? String(numOf[id]) : '🔒';
      g.innerHTML = n.ending
        ? `<rect x="-25" y="-15" width="50" height="30" rx="12"/><text y="1">${label}</text>`
        : `<circle r="${R}"/><text y="1">${label}</text>`;
      const inner = document.createElementNS(NS, 'g');
      inner.setAttribute('class', 'g2-node-in');
      while (g.firstChild) inner.append(g.firstChild);
      g.append(inner);
      if (onPath) inner.style.setProperty('--d', `${BASE + Math.max(0, order[id] - 1) * STEP_MS + (order[id] ? STEP_MS * 0.8 : 0)}ms`);
      g.addEventListener('click', () => {
        svg.querySelectorAll('.g2-node.sel').forEach((x) => x.classList.remove('sel'));
        g.classList.add('sel');
        onTap(id);
      });
      svg.append(g);
    });
    box.append(svg);
    return BASE + steps.length * STEP_MS + 200;
  }

  // ------------------------------------------------ керування
  $('.m-back').addEventListener('click', () => { hap(app); app.back(); });
  pauseBtn.addEventListener('click', () => (run.paused ? resume() : pause()));
  const onKey = (ev) => {
    if (ev.repeat) return;
    const k = ev.key;
    if (k === 'Escape' || k === 'p' || k === 'P' || k === 'з' || k === 'З') {
      if (run.paused) resume(); else pause();
      return;
    }
    if (run.paused) return;
    if (run.stage === 'decide' && /^[1-9]$/.test(k)) { ev.preventDefault(); pick(+k - 1); }
    else if (k === 'Enter' || k === ' ') {
      if (run.stage === 'line' && tw?.typing) { ev.preventDefault(); tw.finish(); }
      else if (run.stage === 'feedback') { const b = choicesEl.querySelector('.g2-next'); if (b) { ev.preventDefault(); b.click(); } }
      else if (run.stage === 'intro' && overlay) { ev.preventDefault(); overlay.querySelector('[data-a=go]')?.click(); }
    }
  };
  window.addEventListener('keydown', onKey);
  const onVis = () => { if (document.hidden && run.stage === 'decide') pause(); };
  document.addEventListener('visibilitychange', onVis);

  showIntro();

  skyCovered(true);
  return () => {
    skyCovered(false);
    alive = false;
    stopTimer();
    ro?.disconnect();
    if (tw?.typing) tw.finish();
    timers.forEach(clearTimeout);
    window.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVis);
    closeOverlay();
    try { lumi?.destroy?.(); } catch (e) { /* */ }
    lumi = null;
    try { actorCh?.destroy(); } catch (e) { /* */ }
    actorCh = null;
    if (dirty) { try { app.save?.(); } catch (e) { /* */ } }
  };
}
