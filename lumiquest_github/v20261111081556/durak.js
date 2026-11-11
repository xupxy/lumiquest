// 🃏 «Словесний Дурень» у Картярні. Порт game/durak.py.
import * as S from './state.js?v=20261111081530';
import { tr, tc, twords, sfx, speak, starSfx } from './i18n_modes.js?v=20261111081530';
import * as FX from './fx.js?v=20261111081530';
import * as L from './lumi.js?v=20261111081530';
import { createCharacter } from './characters.js?v=20261111081530';
import { recordGame } from './games.js?v=20261111081530';

// ---------------------------------------------------------------- спільні дрібниці режимів
const CSS_HREF = new URL('./modes.css?v=20261111081530', import.meta.url).href;
function ensureCss(root) {
  let l = document.querySelector('link[data-modes-css]');
  if (!l) {
    l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = CSS_HREF; l.dataset.modesCss = '1';
    l.addEventListener('load', () => { l.dataset.ready = '1'; }, { once: true });
    document.head.append(l);
  }
  if (!l.dataset.ready && !l.sheet) {
    root.style.visibility = 'hidden';
    const show = () => { root.style.visibility = ''; };
    l.addEventListener('load', show, { once: true });
    l.addEventListener('error', show, { once: true });
    setTimeout(show, 1500);
  }
}
const asset = (p) => new URL('./' + p.replace(/\.png$/, '.webp').replace(/^covers\//, 'cover_').split('/').pop(), import.meta.url).href;
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
function floatText(target, text, cls = '') { // власний: по центру цілі
  const r = target.getBoundingClientRect();
  const d = el('div', 'm-float ' + cls, esc(text));
  d.style.left = r.left + r.width / 2 + 'px';
  d.style.top = r.top + r.height / 3 + 'px';
  document.body.append(d);
  setTimeout(() => d.remove(), 1200);
}
function countUp(node, from, to, ms = 900) {
  if (typeof FX.countUp === 'function') { try { return FX.countUp(node, from, to, ms); } catch (e) { /* fallback */ } }
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    node.textContent = Math.round(from + (to - from) * (1 - (1 - k) ** 3));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function hap(app, kind = 'light') {
  const t = app?.tg;
  if (!t) return;
  try {
    const note = kind === 'success' || kind === 'error' || kind === 'warning';
    if (note && typeof t.notify === 'function') return t.notify(kind);
    if (!note && typeof t.tap === 'function') return t.tap(kind);
    if (typeof t.haptic === 'function') return t.haptic(kind);
    const hf = t.webApp?.HapticFeedback || t.WebApp?.HapticFeedback || window.Telegram?.WebApp?.HapticFeedback;
    if (hf) note ? hf.notificationOccurred(kind) : hf.impactOccurred(kind);
  } catch (e) { /* без вібро */ }
}
function anim(node, frames, opts) {
  if (!node?.animate) return Promise.resolve();
  const o = typeof opts === 'number' ? { duration: opts } : { ...opts };
  if (reduced()) o.duration = Math.min(o.duration || 300, 120);
  try { return node.animate(frames, { easing: 'ease-out', fill: 'none', ...o }).finished.catch(() => {}); } catch (e) { return Promise.resolve(); }
}
// Лумі: через app.makeLumi (ядро), інакше напряму з lumi.js
function makeLumi(app, container, size, emotion) {
  try {
    if (typeof app?.makeLumi === 'function') return app.makeLumi(container, { size, emotion, global: false });
    if (typeof L.createLumi === 'function') { const l = L.createLumi(container, { size, emotion }); l?.set?.(emotion); return l; }
  } catch (e) { console.warn('lumi', e); }
  return null;
}
// Екран режиму займає весь .screen (власна шапка замість спільної topbar)
export const meta = { topbar: false };
function mountHost(root, app) {
  root.classList.add('m-host');
  return !!app?.tg?.isTelegram; // у Telegram — нативна BackButton
}
const sleep = (ms) => new Promise((r) => setTimeout(r, reduced() ? Math.min(ms, 80) : ms));
function flyLayer() {
  let f = document.querySelector('.m-flylayer');
  if (!f) { f = el('div', 'm-flylayer'); document.body.append(f); }
  return f;
}
async function fly(node, a, b, { ms = 600, arc = -60, rot0 = 0, rot1 = 0, s0 = 1, s1 = 1 } = {}) {
  const layer = flyLayer();
  layer.append(node);
  node.style.left = a.left + 'px';
  node.style.top = a.top + 'px';
  node.style.width = a.width + 'px';
  node.style.height = a.height + 'px';
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  await anim(node, [
    { transform: `translate(0,0) rotate(${rot0}deg) scale(${s0})` },
    { transform: `translate(${dx * 0.5}px, ${dy * 0.5 + arc}px) rotate(${(rot0 + rot1) / 2}deg) scale(${(s0 + s1) / 2 * 1.05})`, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) rotate(${rot1}deg) scale(${s1})` },
  ], { duration: ms, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' });
  node.remove();
}

// ---------------------------------------------------------------- правила (durak.py)
export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const HAND = 6;
export const MAX_HAND = 10;
export const MAX_TURNS = 15;
export const P_IN_HAND = 0.75;
export const XP_WIN = 20;
const FOX = 'Хитрий Лис Фокс';

export function norm(s) {
  return String(s).replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase().replace(/[.!?\s]+$/, '').trim();
}
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function sample(arr, k) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, k);
}
export function dkPool(content, unlocked, onlyWid = null) {
  const words = new Proxy({}, { get: (_, wid) => twords(content, wid) });
  const worlds = content?.WORLDS || [];
  const pairs = (wid) => (words[wid] || []).filter((p) => Array.isArray(p) && p.length === 2
    && p.every((x) => typeof x === 'string' && x.trim())).map((p) => [p[0], p[1]]);
  // зі стежки світу (params.wid) — колода тільки зі слів цього світу
  let pool = onlyWid ? pairs(onlyWid) : (unlocked || []).flatMap(pairs);
  if (new Set(pool.map((p) => norm(p[1]))).size < HAND + 2) pool = worlds.flatMap((w) => pairs(w.id));
  const seen = new Set();
  const uniq = [];
  for (const p of pool) { const k = norm(p[1]); if (!seen.has(k)) { seen.add(k); uniq.push(p); } }
  return uniq;
}
let uid = 0;
const randCard = (pair) => ({ ua: pair[0], en: pair[1], suit: pick(SUITS), rank: pick(RANKS), id: ++uid });
function dkAttack(pool, dk) {
  const handEn = new Set(dk.hand.map((c) => norm(c.en)));
  const prev = dk.atk ? norm(dk.atk.en) : null;
  const outside = pool.filter((p) => !handEn.has(norm(p[1])) && norm(p[1]) !== prev);
  if (dk.hand.length && (Math.random() < P_IN_HAND || !outside.length)) {
    const c = pick(dk.hand);
    dk.atk = randCard([c.ua, c.en]);
  } else {
    dk.atk = randCard(pick(outside));
  }
}
const addXP = (st, n) => (typeof S.addXP === 'function' ? S.addXP(st, n) : (st.xp = (st.xp || 0) + n));
function onCorrect(st) {
  if (typeof S.onCorrectAnswer === 'function') return S.onCorrectAnswer(st);
  st.fireflies = (st.fireflies || 0) + 1;
  st.food = (st.food || 0) + 1;
}
const isRed = (suit) => suit === '♥' || suit === '♦';

function cardHtml(c, { side = 'en', trump = '' } = {}) {
  const word = side === 'en' ? c.en : c.ua;
  const t = c.suit === trump;
  const long = word.length > 11 ? (word.length > 15 ? ' xl' : ' l') : '';
  return `<div class="m-card ${isRed(c.suit) ? 'red' : 'black'}${t ? ' trump' : ''}${side === 'ua' ? ' ua' : ''}" data-id="${c.id}" data-en="${esc(c.en)}">
    <span class="m-card-c tl">${c.rank}<br>${c.suit}</span>
    <span class="m-card-suit">${c.suit}</span>
    <span class="m-card-word${long}">${esc(word)}</span>
    <span class="m-card-c br">${c.rank}<br>${c.suit}</span>
    ${t ? '<span class="m-card-star">★</span>' : ''}
  </div>`;
}

// ---------------------------------------------------------------- екран
/** v6: екран повністю непрозорий — фонове небо застосунку (#sky) під ним не видно, ставимо його анімації на паузу. */
function skyCovered(on) {
  const h = document.documentElement, n = Math.max(0, (+h.dataset.gcanvas || 0) + (on ? 1 : -1));
  if (n) h.dataset.gcanvas = n; else delete h.dataset.gcanvas;
}

export function render(root, params, app) {
  ensureCss(root);
  const inTg = mountHost(root, app);
  const st = app.state;
  const wid = params?.wid && app.content?.WORDS?.[params.wid] ? params.wid : null;
  const wName = wid ? (tc((app.content?.WORLDS || []).find((w) => w.id === wid), 'name') || '') : '';
  let alive = true;
  let busy = false;
  let dk = null;
  let pool = [];
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms));
  let lumiRef = null;
  let ro = null;
  // Лис Фокс — живий персонаж (characters.js)
  let foxCh = null, endFox = null, foxT = 0;
  const foxMood = (m, back = 0) => {
    clearTimeout(foxT);
    foxCh?.set(m);
    if (back) foxT = setTimeout(() => { if (alive && !dk?.over) foxCh?.set('idle'); }, back);
  };
  const killFox = () => { clearTimeout(foxT); try { foxCh?.destroy(); endFox?.destroy(); } catch (e) { /* */ } foxCh = endFox = null; };

  const scr = el('div', 'm-screen m-durak');
  root.append(scr);
  const back = () => { hap(app); app.back(); };

  // ------------------------------------------------ лобі (_durak_lobby)
  function lobby(note) {
    busy = false;
    scr.className = 'm-screen m-durak m-dk-lobbymode';
    const wins = st.durak_wins || 0;
    const games = st.durak_games || 0;
    scr.innerHTML = `
      <header class="m-head"><button class="m-back" ${tr('common.back_aria')}${inTg ? ' hidden' : ''}>‹</button><div class="m-title">🃏 ${wid ? `${tr('durak.title_w', { 0: esc(wName) })}` : tr('durak.lobby')}</div></header>
      <div class="m-dk-banner"><img src="${asset('durak.png')}" ${tr('durak.banner_alt')} draggable="false"></div>
      ${note ? `<div class="m-dk-lnote">${esc(note)}</div>` : ''}
      <div class="m-dk-rules">
        <p>🦊 <b>${tr('durak.fox')}</b> ${tr('durak.rule1')}</p>
        <p>${tr('durak.rule2')}</p>
        <p>${tr('durak.rule3')}</p>
        <p class="m-dk-small">${tr('durak.rule4', { 0: MAX_HAND, 1: MAX_TURNS })}</p>
      </div>
      <div class="m-dk-stats">${tr('durak.wins', { 0: wins, 1: games })}</div>
      <button class="m-btn m-btn-alt m-btn-big" data-a="new">${tr('durak.new')}</button>`;
    scr.querySelector('.m-back').onclick = back;
    scr.querySelector('[data-a=new]').onclick = () => { hap(app, 'medium'); newGame(); };
    anim(scr.querySelector('.m-dk-banner img'), [{ transform: 'scale(.9) rotate(-2deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], 450);
  }

  // ------------------------------------------------ партія
  let $ = {};
  function newGame() {
    pool = dkPool(app.content, st.unlocked, wid);
    if (pool.length < HAND + 1) { lobby(tr('durak.no_words')); return; }
    const hand = sample(pool, HAND).map(randCard);
    dk = { trump: pick(SUITS), hand, atk: null, turn: 0, beaten: 0, xp: 0, taken: 0 };
    dkAttack(pool, dk);
    st.durak_games = (st.durak_games || 0) + 1;
    app.save?.();
    buildTable();
    deal();
  }

  function buildTable() {
    scr.className = 'm-screen m-durak';
    scr.innerHTML = `
      <header class="m-head">
        <button class="m-back" ${tr('common.back_aria')}${inTg ? ' hidden' : ''}>‹</button>
        <div class="m-title">${tr('durak.title')}</div>
        <div class="m-chip m-dk-trumpchip ${isRed(dk.trump) ? 'red' : ''}">${tr('durak.trump_chip', { 0: dk.trump })}</div>
      </header>
      <div class="m-dk-table">
        <div class="m-dk-top">
          <div class="m-dk-fox"><div class="m-dk-foxpic m-dk-foxchr" ${tr('durak.fox_aria')}></div><div class="m-dk-foxname">${tr('durak.fox_name')}</div></div>
          <div class="m-dk-bubble"></div>
          <div class="m-dk-deck">
            <div class="m-dk-trumpcard ${isRed(dk.trump) ? 'red' : ''}"><span>${dk.trump}</span></div>
            <div class="m-dk-back"></div><div class="m-dk-back"></div><div class="m-dk-back"></div>
          </div>
        </div>
        <div class="m-dk-info"></div>
        <div class="m-dk-battle">
          <div class="m-dk-bito"><div class="m-dk-back sm"></div><span>🗑 <b>0</b></span></div>
          <div class="m-dk-slot"></div>
          <div class="m-dk-turns"></div>
        </div>
        <div class="m-dk-note" aria-live="polite"></div>
        <div class="m-dk-hand"></div>
        <div class="m-dk-actions">
          <button class="m-btn m-dk-take">${tr('durak.take')}</button>
          <button class="m-btn m-btn-ghost m-dk-quit">${tr('durak.surrender')}</button>
        </div>
      </div>`;
    const q = (s) => scr.querySelector(s);
    killFox();
    try { foxCh = createCharacter(q('.m-dk-foxchr'), 'fox', { size: 84 }); } catch (e) { console.warn('fox', e); }
    $ = {
      info: q('.m-dk-info'), slot: q('.m-dk-slot'), hand: q('.m-dk-hand'), note: q('.m-dk-note'),
      bubble: q('.m-dk-bubble'), fox: q('.m-dk-fox'), deck: q('.m-dk-deck'), bito: q('.m-dk-bito'),
      bitoN: q('.m-dk-bito b'), turns: q('.m-dk-turns'), take: q('.m-dk-take'), quit: q('.m-dk-quit'),
    };
    q('.m-back').onclick = back;
    $.take.onclick = onTake;
    $.quit.onclick = () => {
      if (busy) return;
      hap(app, 'warning');
      end(false, tr('durak.gave_up'));
    };
    $.hand.addEventListener('click', (e) => {
      const c = e.target.closest('.m-card');
      if (c) onCard(Number(c.dataset.id));
    });
    ro?.disconnect();
    if (window.ResizeObserver) { ro = new ResizeObserver(() => layoutHand()); ro.observe($.hand); }
    paintInfo();
  }

  function paintInfo() {
    $.info.innerHTML = `${tr('durak.info', { 0: Math.min(dk.turn + 1, MAX_TURNS), 1: MAX_TURNS, 2: dk.hand.length, 3: MAX_HAND, 4: dk.beaten })}<span>⚡ <b>${dk.xp}</b> XP</span>`;
    $.bitoN.textContent = dk.beaten;
    $.info.classList.toggle('danger', dk.hand.length >= MAX_HAND - 2);
    $.turns.innerHTML = Array.from({ length: MAX_TURNS }, (_, k) => `<i class="${k < dk.turn ? 'done' : ''}"></i>`).join('');
  }
  function say(text) {
    $.bubble.textContent = text;
    $.bubble.classList.add('show');
    foxCh?.talk(text);
    anim($.bubble, [{ transform: 'scale(.7)', opacity: 0 }, { transform: 'scale(1.05)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }], 300);
  }
  function setNote(text, kind = '') {
    $.note.className = 'm-dk-note ' + kind;
    $.note.textContent = text;
    if (text) anim($.note, [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], 220);
  }

  // розкладка руки віялом (рядки по ≤5 карт)
  function handNodes() { return new Map([...$.hand.querySelectorAll('.m-card')].map((n) => [Number(n.dataset.id), n])); }
  function layoutHand({ fresh = [] } = {}) {
    if (!dk || !$.hand?.isConnected) return;
    const W = $.hand.clientWidth || 360;
    const nodes = handNodes();
    const cards = dk.hand;
    // DOM-синхронізація (keyed)
    for (const [id, node] of nodes) if (!cards.some((c) => c.id === id)) node.remove();
    for (const c of cards) {
      if (!nodes.has(c.id)) {
        const wrap = el('div', '', cardHtml(c, { trump: dk.trump }));
        const node = wrap.firstElementChild;
        if (fresh.includes(c.id)) node.style.opacity = '0';
        $.hand.append(node);
        nodes.set(c.id, node);
      }
    }
    const n = cards.length;
    const rows = n <= 5 ? [cards] : [cards.slice(0, Math.ceil(n / 2)), cards.slice(Math.ceil(n / 2))];
    const cw = Math.min(84, Math.floor((W - 12) / Math.max(4, rows[0].length)) - 4);
    const ch = Math.round(cw * 1.42);
    const rowGap = Math.round(ch * 0.72);
    $.hand.style.setProperty('--cw', cw + 'px');
    $.hand.style.setProperty('--ch', ch + 'px');
    $.hand.style.height = (ch + 22 + (rows.length - 1) * rowGap) + 'px';
    rows.forEach((row, ri) => {
      const m = row.length;
      const spacing = m > 1 ? Math.min(cw + 6, (W - cw - 8) / (m - 1)) : 0;
      const mid = (m - 1) / 2;
      row.forEach((c, k) => {
        const node = nodes.get(c.id);
        const d = k - mid;
        const x = W / 2 - cw / 2 + d * spacing;
        const y = 8 + ri * rowGap + Math.abs(d) * Math.abs(d) * 3;
        const rot = d * (m > 3 ? 5 : 6);
        node.style.setProperty('--x', `${x}px`);
        node.style.setProperty('--y', `${y}px`);
        node.style.setProperty('--r', `${rot}deg`);
        node.style.zIndex = String(10 + ri * 10 + k);
      });
    });
  }

  async function deal() {
    busy = true;
    sfx('deal');
    say(`${tr('durak.shuffle', { 0: dk.trump })}`);
    const ids = dk.hand.map((c) => c.id);
    layoutHand({ fresh: ids });
    const deckR = $.deck.getBoundingClientRect();
    const nodes = handNodes();
    for (const [k, c] of dk.hand.entries()) {
      const node = nodes.get(c.id);
      await sleep(90);
      if (!alive) return;
      const r = node.getBoundingClientRect();
      node.style.opacity = '';
      anim(node, [
        { transform: `translate(${deckR.left - r.left}px, ${deckR.top - r.top}px) rotate(-30deg) scale(.6)`, opacity: 0.4 },
        { transform: `translate(var(--x), var(--y)) rotate(var(--r))`, opacity: 1 },
      ], { duration: 420, easing: 'cubic-bezier(.3,1.3,.5,1)', composite: 'replace' });
      hap(app); sfx('card');
      void k;
    }
    await sleep(400);
    if (!alive) return;
    await attackIn();
    busy = false;
  }

  async function attackIn() {
    paintInfo();
    $.slot.innerHTML = '';
    const a = dk.atk;
    sfx('flip');
    const holder = el('div', 'm-dk-atk', cardHtml(a, { side: 'ua', trump: dk.trump }));
    if (a.suit === dk.trump) holder.append(el('div', 'm-dk-ribbon', tr('durak.ribbon')));
    $.slot.append(holder);
    const fr = $.fox.getBoundingClientRect();
    const r = holder.getBoundingClientRect();
    await anim(holder, [
      { transform: `translate(${fr.left + fr.width / 2 - r.left - r.width / 2}px, ${fr.top + fr.height / 2 - r.top - r.height / 2}px) rotate(160deg) scale(.4)`, opacity: 0 },
      { transform: 'translate(0,0) rotate(-6deg) scale(1.08)', opacity: 1, offset: 0.75 },
      { transform: 'rotate(-4deg)', opacity: 1 },
    ], { duration: 520, easing: 'cubic-bezier(.3,1,.5,1)' });
    holder.style.transform = 'rotate(-4deg)';
    anim($.fox, [{ transform: 'none' }, { transform: 'translateY(-6px) rotate(-4deg)' }, { transform: 'none' }], 320);
    if (foxCh?.mood !== 'idle') foxMood('idle');
    setNote(tr('durak.prompt'));
  }

  // ------------------------------------------------ хід гравця (_durak_action)
  async function onCard(id) {
    if (busy || !dk) return;
    const idx = dk.hand.findIndex((c) => c.id === id);
    if (idx < 0) return;
    busy = true;
    hap(app, 'medium'); sfx('card');
    const a = dk.atk;
    const c = dk.hand[idx];
    const node = handNodes().get(id);
    const atkNode = $.slot.querySelector('.m-dk-atk');
    const from = node.getBoundingClientRect();
    const ar = atkNode.getBoundingClientRect();
    node.style.visibility = 'hidden';
    const flying = el('div', '', cardHtml(c, { trump: dk.trump })).firstElementChild;
    const target = { left: ar.left + 18, top: ar.top + 14, width: ar.width, height: ar.height };
    await fly(flying, from, target, { ms: 420, arc: -30, rot0: 0, rot1: 12, s0: 1, s1: ar.width / from.width });
    if (!alive) return;
    // карта «лягла» зверху
    const def = el('div', 'm-dk-def', cardHtml(c, { trump: dk.trump }));
    $.slot.append(def);
    const ok = norm(c.en) === norm(a.en);
    let note;
    let gain = 0;
    if (ok) {
      dk.hand.splice(idx, 1);
      dk.beaten += 1;
      gain = a.suit === dk.trump ? 2 : 1;
      note = `${tr('durak.beat', { 0: a.ua, 1: a.en, 2: gain })}${gain === 2 ? tr('durak.trump_p') : ''}`;
      def.classList.add('good');
      hap(app, 'success'); sfx('correct'); speak(a.en);
      fx('sparkle', def);
      floatText(def, `+${gain} XP`, 'm-float-gold');
      setNote(note, 'good');
      foxMood(dk.beaten % 2 ? 'angry' : 'sad', 1400); foxCh?.react('shake');
      say([tr('durak.f1'), tr('durak.f2'), tr('durak.f3'), tr('durak.f4')][dk.beaten % 4]);
      await sleep(650);
      if (!alive) return;
      // «Бито» — пара відлітає
      const br = $.bito.getBoundingClientRect();
      const pair = [atkNode, def];
      await Promise.all(pair.map((p, k) => {
        const r = p.getBoundingClientRect();
        const clone = p.cloneNode(true);
        clone.classList.add('m-dk-flyout');
        p.style.visibility = 'hidden';
        return fly(clone, r, br, { ms: 520, arc: -50, rot0: k ? 12 : -4, rot1: 90 + k * 30, s0: 1, s1: 0.4 });
      }));
      if (!alive) return;
      $.slot.innerHTML = '';
      anim($.bito, [{ transform: 'scale(1.2)' }, { transform: 'none' }], 300);
      layoutHand();
    } else {
      // неправильна карта: береш атакуючу (у руку — її переклад)
      def.classList.add('bad');
      hap(app, 'error'); sfx('wrong'); speak(a.en);
      try { S.noteMiss(st, wid, a.en); } catch (e) { /* */ }
      fx('shake', $.slot);
      note = `${tr('durak.wrong', { 0: c.en, 1: a.ua, 2: a.en })}`;
      setNote(note, 'bad');
      foxMood('happy', 1600); foxCh?.react('jump');
      say([tr('durak.t1'), tr('durak.t2'), tr('durak.t3')][dk.turn % 3]);
      await sleep(750);
      if (!alive) return;
      def.remove();
      node.style.visibility = '';
      const taken = { ...a, id: ++uid };
      dk.hand.push(taken);
      dk.taken += 1;
      await cardToHand(atkNode, taken);
    }
    after(ok, gain, note);
  }

  async function onTake() {
    if (busy || !dk) return;
    busy = true;
    hap(app, 'medium'); sfx('card');
    const a = dk.atk;
    const inHand = dk.hand.find((c) => norm(c.en) === norm(a.en));
    const atkNode = $.slot.querySelector('.m-dk-atk');
    let ok = false;
    let note;
    if (inHand) {
      note = `${tr('durak.had', { 0: inHand.suit, 1: inHand.rank, 2: inHand.en })}`;
      const hn = handNodes().get(inHand.id);
      hn?.classList.add('m-card-hint');
      setNote(note, 'bad');
      hap(app, 'error'); sfx('wrong'); speak(inHand.en);
      foxMood('happy', 1600); foxCh?.react('jump');
      say(tr('durak.had_say'));
      await sleep(900);
      if (!alive) return;
      hn?.classList.remove('m-card-hint');
      const taken = { ...a, id: ++uid };
      dk.hand.push(taken);
      dk.taken += 1;
      await cardToHand(atkNode, taken);
    } else {
      ok = true;
      note = tr('durak.none');
      setNote(note, 'good');
      hap(app, 'success'); sfx('correct');
      floatText(atkNode, '+1 XP', 'm-float-gold');
      foxMood('surprised', 1200);
      say(tr('durak.none_say'));
      await sleep(450);
      if (!alive) return;
      const r = atkNode.getBoundingClientRect();
      const clone = atkNode.cloneNode(true);
      atkNode.style.visibility = 'hidden';
      await fly(clone, r, $.fox.getBoundingClientRect(), { ms: 480, arc: -40, rot0: -4, rot1: -200, s0: 1, s1: 0.3 });
      if (!alive) return;
      $.slot.innerHTML = '';
    }
    after(ok, ok ? 1 : 0, note);
  }

  // атакуюча карта їде в руку
  async function cardToHand(atkNode, taken) {
    layoutHand({ fresh: [taken.id] });
    const node = handNodes().get(taken.id);
    const r0 = atkNode.getBoundingClientRect();
    await sleep(30);
    const r1 = node.getBoundingClientRect();
    atkNode.style.visibility = 'hidden';
    const flying = el('div', '', cardHtml(taken, { side: 'ua', trump: dk.trump })).firstElementChild;
    await fly(flying, r0, r1, { ms: 520, arc: -20, rot0: -4, rot1: 0, s0: 1, s1: r1.width / r0.width });
    if (!alive) return;
    node.style.opacity = '';
    node.classList.add('m-card-new');
    setTimeout(() => node.classList.remove('m-card-new'), 900);
    $.slot.innerHTML = '';
  }

  async function after(ok, gain, note) {
    if (ok) {
      addXP(st, gain);
      dk.xp += gain;
      onCorrect(st);
    }
    dk.turn += 1;
    app.save?.();
    paintInfo();
    if (!dk.hand.length) return end(true, note);
    if (dk.hand.length >= MAX_HAND) return end(false, note + `${tr('durak.full', { 0: MAX_HAND })}`);
    if (dk.turn >= MAX_TURNS) return end(false, note + `${tr('durak.turns', { 0: MAX_TURNS })}`);
    dkAttack(pool, dk);
    await sleep(350);
    if (!alive) return;
    await attackIn();
    busy = false;
  }

  // ------------------------------------------------ кінець (_durak_end)
  function end(win, note) {
    busy = true;
    dk.over = true;
    foxMood(win ? 'lose' : 'win');
    if (win) {
      st.durak_wins = (st.durak_wins || 0) + 1;
      addXP(st, XP_WIN);
    }
    const stars = win ? (dk.taken <= 1 ? 3 : 2) : 0;
    if (wid) recordGame(st, `${wid}-durak`, stars);
    app.save?.();
    const total = win ? XP_WIN + dk.xp : dk.xp;
    const ov = el('div', `m-overlay m-dk-end ${win ? 'win' : 'lose'}`);
    ov.innerHTML = `
      <div class="m-dk-endcard">
        <div class="m-dk-endnote">${esc(note).replace(/\n/g, '<br>')}</div>
        <div class="m-dk-endpic"><div class="m-dk-foxpic m-dk-foxchr big"></div><span class="m-dk-clown">🤡</span></div>
        <h2>${win ? tr('durak.win_h') : tr('durak.lose_h')}</h2>
        <div class="m-dk-endxp">+<b>0</b> ${tr('durak.xp')}</div>
        <div class="m-dk-endstat">${tr('durak.endstat', { 0: dk.beaten, 1: st.durak_wins || 0, 2: st.durak_games || 0 })}</div>
        ${wid ? '<div class="m-dk-endstars" style="display:flex;justify-content:center;min-height:64px"></div>' : ''}
        ${win ? '' : '<p class="m-dk-endtip">' + tr('durak.tip') + '</p>'}
        <div class="m-dk-endlumi"></div>
        <div class="m-dk-endbtns">
          <button class="m-btn m-btn-alt m-btn-big" data-a="again">${tr('durak.again')}</button>
          ${wid ? '<button class="m-btn m-btn-big" data-a="next">' + tr('common.next') + '</button>' : `<button class="m-btn" data-a="dragons">${tr('durak.dragons')}</button>
          <button class="m-btn m-btn-ghost" data-a="home">${tr('common.menu')}</button>`}
        </div>
      </div>`;
    scr.append(ov);
    try { endFox = createCharacter(ov.querySelector('.m-dk-endpic .m-dk-foxchr'), 'fox', { size: 130, mood: win ? 'lose' : 'win' }); } catch (e) { /* */ }
    hap(app, win ? 'success' : 'error');
    sfx(win ? 'win' : 'lose');
    if (wid) starSfx(stars, 700);
    if (win) { later(() => fx('confetti'), 250); later(() => fx('confetti'), 1200); }
    // карти, що лишились у руці, розсипаються
    if (!win) {
      [...$.hand.querySelectorAll('.m-card')].forEach((n, k) => anim(n, [
        { transform: 'translate(var(--x), var(--y)) rotate(var(--r))' },
        { transform: `translate(calc(var(--x) + ${(k % 2 ? 1 : -1) * 40}px), calc(var(--y) + 140px)) rotate(${k * 37}deg)`, opacity: 0 },
      ], { duration: 900, delay: k * 50, fill: 'forwards' }));
    }
    later(() => countUp(ov.querySelector('.m-dk-endxp b'), 0, total, 800), 500);
    lumiRef = makeLumi(app, ov.querySelector('.m-dk-endlumi'), 64, win ? 'proud' : 'cheer');
    if (wid) fx('starsDrop', ov.querySelector('.m-dk-endstars'), stars);
    const on = (a, fn) => { const b = ov.querySelector(`[data-a=${a}]`); if (b) b.onclick = () => { hap(app); fn(); }; };
    on('next', () => app.back());
    on('again', () => { lumiRef?.destroy?.(); lumiRef = null; endFox?.destroy(); endFox = null; ov.remove(); newGame(); });
    on('dragons', () => app.go('dragons', {}, { replace: true }));
    on('home', () => (typeof app.home === 'function' ? app.home() : app.go('home')));
  }

  lobby();

  skyCovered(true);
  return () => {
    skyCovered(false);
    alive = false;
    timers.forEach(clearTimeout);
    ro?.disconnect();
    try { lumiRef?.destroy?.(); } catch (e) { /* */ }
    killFox();
    document.querySelectorAll('.m-flylayer > *').forEach((x) => x.remove());
  };
}
