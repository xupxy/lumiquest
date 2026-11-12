/**
 * LumiQuest — спільні UI-компоненти.
 *
 *  h(tag, attrs?, ...children) -> HTMLElement
 *      attrs: {class, text, style, on:{click:fn}, data:{k:v}, ...інші атрибути}
 *  button(label, {variant:'primary'|'secondary'|'ghost'|'gold'|'danger', onClick, haptic, disabled, cls}) -> <button>
 *  topBar(app) -> {el, update(animate=true)}       XP-рівень, 🍀, 🏆 з анімованими лічильниками
 *  progressBar(total) -> {el, set(i, results[])}   сегменти завдань (ok/bad/current)
 *  starsRow(n, total=3) -> el                      статичний ряд зірок
 *  renderTask(container, task, {onResult(correct, given, meta), lumi}) -> {destroy()}
 *      choice / type / order (+ alts) + «🏳 Не знаю» (meta.skipped = true)
 *  feedbackSheet(host, {ok, skipped, title, sub, right, yours, explain, emotion, nextLabel, app}) -> Promise
 *      нижня панель-бульбашка Лумі з поясненням і кнопкою «Далі»; резолвиться при натисканні
 *  confirmDialog(text, {okLabel, cancelLabel, danger}) -> Promise<boolean>
 *  toast(text, ms)
 *  richText(str) -> DocumentFragment   англійські фрагменти й «___» підсвічені
 *  correctText(task), orderOk(task, given), plural(n, one, few, many)
 *  fx — проксі ефектів: викликає js/fx.js, якщо він є, інакше вбудовані фолбеки
 *  setFx(module), setHaptics(tg)                   (викликає app.js)
 */
import { norm, levelOf, xpProgress } from './state.js?v=20261112180927';
import { t, tc } from './i18n.js?v=20261112180927';

// ─────────────────────────────────────────────────────────── audio proxy (js/audio.js може ще не існувати)
const NOOP_AUDIO = {
  initAudio() {}, sfx() {}, music() {}, speak() {}, canSpeak: () => false,
  setSound() {}, setMusic() {}, getSettings: () => ({ sound: true, music: true }), duck() {},
};
let audioMod = null;
export function setAudio(mod) { audioMod = mod || null; }
/** Безпечний доступ до audio.js: будь-яка помилка/відсутність — тихий no-op. */
export const audio = new Proxy({}, {
  get(_, name) {
    return (...args) => {
      try {
        const f = audioMod && typeof audioMod[name] === 'function' ? audioMod[name] : NOOP_AUDIO[name];
        return f ? f(...args) : undefined;
      } catch (e) { return NOOP_AUDIO[name] ? NOOP_AUDIO[name](...args) : undefined; }
    };
  },
});
export const sfx = (name) => audio.sfx(name);

const CYR = /[А-Яа-яЁёІіЇїЄєҐґ]/;
const LATIN_RE = /[A-Za-z][A-Za-z'’]*(?:[ ,\-/][A-Za-z][A-Za-z'’]*)*(?:[.?!])?/g;
/** Англійська частина рядка для озвучки ('' — нема що читати). */
export function englishOf(str) {
  const s = String(str ?? '').trim();
  if (!s || !/[A-Za-z]{2,}/.test(s)) return '';
  if (!CYR.test(s)) return s.replace(/_{2,}/g, ' … ').replace(/\s+/g, ' ').trim();
  const parts = s.match(LATIN_RE) || [];
  return parts.filter((x) => /[A-Za-z]{2,}/.test(x)).join('. ');
}
/** Маленька кнопка 🔊 — озвучити англійський текст. */
export function speakBtn(text, cls = '') {
  const b = h('button', { class: `say-btn ${cls}`, type: 'button', 'aria-label': t('task.listen'), title: t('task.listen'), data: { sfx: 'none' } }, '🔊');
  const go = (e) => {
    e.preventDefault(); e.stopPropagation();
    const v = typeof text === 'function' ? text() : text;
    if (!v) return;
    b.classList.remove('talk'); void b.offsetWidth; b.classList.add('talk');
    audio.speak(v, { lang: 'en-US', rate: 0.9 });
  };
  b.addEventListener('click', go);
  b.addEventListener('pointerdown', (e) => e.stopPropagation());
  return b;
}

// ─────────────────────────────────────────────────────────── DOM helpers
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (tag === 'img') el.decoding = 'async'; // декодування картинок поза головним потоком
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
    kids.unshift(attrs); attrs = null;
  }
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style' && typeof v === 'object') {
        // CSS-змінні (--i тощо) через setProperty, решта — звичайно
        for (const [sk, sv] of Object.entries(v)) sk.startsWith('--') ? el.style.setProperty(sk, sv) : (el.style[sk] = sv);
      }
      else if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
      else if (k === 'data') for (const [dk, dv] of Object.entries(v)) el.dataset[dk] = dv;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let haptics = { tap() {}, notify() {}, select() {} };
export function setHaptics(tg) { haptics = tg || haptics; }

export function plural(n, one, few, many) {
  n = Math.abs(n);
  if (n % 10 === 1 && n % 100 !== 11) return one;
  if (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) return few;
  return many;
}

// ─────────────────────────────────────────────────────────── fx proxy
let fxMod = null;
export function setFx(mod) { fxMod = mod || null; }

const fallbackFx = {
  rewardBurst(_el, o = {}) { try { o.onLand && o.onLand(); } catch (e) { /* */ } return Promise.resolve(); },
  confetti(opts = {}) {
    if (reduced()) return;
    const layer = h('div', { class: 'fxf-layer' });
    document.body.append(layer);
    const colors = ['#FFC845', '#FF9EB5', '#A592F2', '#7FD6A4', '#FFB38F', '#8EC5FF'];
    const n = opts.count || 70;
    for (let i = 0; i < n; i++) {
      const p = h('i', { class: 'fxf-confetti' });
      const x = (opts.x ?? innerWidth / 2) + (Math.random() - 0.5) * 80;
      p.style.left = x + 'px';
      p.style.top = (opts.y ?? innerHeight * 0.38) + 'px';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', (Math.random() - 0.5) * innerWidth * 0.9 + 'px');
      p.style.setProperty('--dy', (Math.random() * 0.6 + 0.4) * innerHeight * 0.8 + 'px');
      p.style.setProperty('--up', -(Math.random() * 180 + 60) + 'px');
      p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      p.style.animationDelay = Math.random() * 120 + 'ms';
      layer.append(p);
    }
    setTimeout(() => layer.remove(), 2200);
  },
  sparkle(el) {
    if (!el || reduced()) return;
    const r = el.getBoundingClientRect();
    const layer = h('div', { class: 'fxf-layer' });
    document.body.append(layer);
    for (let i = 0; i < 10; i++) {
      const s = h('i', { class: 'fxf-spark', text: i % 3 ? '✦' : '✧' });
      const a = (i / 10) * Math.PI * 2;
      s.style.left = r.left + r.width / 2 + 'px';
      s.style.top = r.top + r.height / 2 + 'px';
      s.style.setProperty('--dx', Math.cos(a) * (r.width / 2 + 24) + 'px');
      s.style.setProperty('--dy', Math.sin(a) * (r.height / 2 + 24) + 'px');
      layer.append(s);
    }
    setTimeout(() => layer.remove(), 900);
  },
  floatText(el, text, cls = '') {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = h('div', { class: `fxf-float ${cls}`, text });
    t.style.left = r.left + r.width / 2 + 'px';
    t.style.top = r.top + 'px';
    document.body.append(t);
    setTimeout(() => t.remove(), 1300);
  },
  shake(el) {
    if (!el) return;
    el.classList.remove('fxf-shake');
    void el.offsetWidth;
    el.classList.add('fxf-shake');
    setTimeout(() => el.classList.remove('fxf-shake'), 520);
  },
  flash(color = '#fff') {
    if (reduced()) return;
    const f = h('div', { class: 'fxf-flash' });
    f.style.background = color;
    document.body.append(f);
    setTimeout(() => f.remove(), 600);
  },
  countUp(el, from, to, ms = 700) {
    if (!el) return;
    if (reduced() || from === to) { el.textContent = to; return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },
  starsDrop(container, n, total = 3) {
    container.classList.add('stars-drop');
    for (let i = 0; i < total; i++) {
      const s = h('span', { class: 'star' + (i < n ? ' on' : '') }, starSVG());
      s.style.animationDelay = (reduced() ? 0 : 350 + i * 380) + 'ms';
      container.append(s);
    }
  },
};

function fxSound(name, args) {
  try {
    if (name === 'confetti') audio.sfx('win');
    else if (name === 'starsDrop') {
      const n = args[1] | 0;
      for (let i = 0; i < n; i++) setTimeout(() => audio.sfx('star'), (reduced() ? 0 : 350 + i * 380) + 120);
    }
  } catch (e) { /* */ }
}

export const fx = new Proxy({}, {
  get(_, name) {
    return (...args) => {
      try {
        const f = fxMod && typeof fxMod[name] === 'function' ? fxMod[name] : fallbackFx[name];
        fxSound(name, args);
        return f ? f(...args) : undefined;
      } catch (e) {
        console.warn('[fx]', name, e);
        try { return fallbackFx[name] && fallbackFx[name](...args); } catch (_) { return undefined; }
      }
    };
  },
});

// ─────────────────────────────────────────────────────────── small pieces
export function starSVG(cls = '') {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  if (cls) svg.setAttribute('class', cls);
  svg.innerHTML = '<path d="M24 4.5l5.6 12 13 1.5-9.7 8.9 2.7 12.9L24 33.2l-11.6 6.6 2.7-12.9-9.7-8.9 13-1.5z" ' +
    'stroke-linejoin="round" stroke-width="3.2"/>' +
    '<path class="glint" d="M18 17.5l3-6" stroke-width="3" stroke-linecap="round" fill="none"/>';
  return svg;
}

export function starsRow(n, total = 3, cls = '') {
  const row = h('span', { class: `stars-row ${cls}`, 'aria-label': t('common.starsOf', { n, total }) });
  for (let i = 0; i < total; i++) row.append(h('span', { class: 'star' + (i < n ? ' on' : '') }, starSVG()));
  return row;
}

export function button(label, opts = {}) {
  const { variant = 'primary', onClick, haptic = 'light', disabled, cls = '', type = 'button', sfx: snd } = opts;
  const b = h('button', { class: `btn btn-${variant} ${cls}`, type, disabled: !!disabled });
  if (snd) b.dataset.sfx = snd;
  if (label instanceof Node) b.append(label); else b.append(h('span', { class: 'btn-label', text: label }));
  b.addEventListener('pointerdown', () => b.classList.add('is-pressed'));
  const up = () => b.classList.remove('is-pressed');
  b.addEventListener('pointerup', up);
  b.addEventListener('pointerleave', up);
  b.addEventListener('pointercancel', up);
  if (onClick) {
    b.addEventListener('click', (e) => {
      if (b.disabled) return;
      if (haptic) haptics.tap(haptic);
      onClick(e);
    });
  }
  return b;
}

/** Текст з підсвіченими англійськими фрагментами і «___». Безпечно (тільки textNode). */
export function richText(str) {
  const frag = document.createDocumentFragment();
  const s = String(str ?? '');
  const re = /(_{2,})|([A-Za-z][A-Za-z'’]*(?:[ ,\-/][A-Za-z][A-Za-z'’]*)*(?:[.?!])?)/g;
  let last = 0; let m;
  while ((m = re.exec(s))) {
    if (m.index > last) frag.append(s.slice(last, m.index));
    if (m[1]) frag.append(h('span', { class: 'blank', 'aria-label': t('task.blank') }));
    else frag.append(h('span', { class: 'en', lang: 'en', text: m[2] }));
    last = m.index + m[0].length;
  }
  if (last < s.length) frag.append(s.slice(last));
  return frag;
}

export function toast(text, ms = 2200) {
  const t = h('div', { class: 'toast', role: 'status', text });
  document.body.append(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, ms);
}

export function confirmDialog(text, { okLabel = t('common.yes'), cancelLabel = t('common.cancel'), danger = false, title = '' } = {}) {
  return new Promise((resolve) => {
    const close = (v) => {
      wrap.classList.remove('in');
      setTimeout(() => wrap.remove(), 250);
      document.removeEventListener('keydown', onKey);
      resolve(v);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    const okBtn = button(okLabel, { variant: danger ? 'danger' : 'primary', onClick: () => close(true), haptic: 'medium' });
    const wrap = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' },
      h('div', { class: 'modal-scrim', on: { click: () => close(false) } }),
      h('div', { class: 'modal-card' },
        title ? h('h3', { class: 'modal-title', text: title }) : null,
        h('p', { class: 'modal-text', text }),
        h('div', { class: 'modal-actions' },
          button(cancelLabel, { variant: 'secondary', onClick: () => close(false) }),
          okBtn)));
    document.body.append(wrap);
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => { wrap.classList.add('in'); okBtn.focus({ preventScroll: true }); });
  });
}

// ─────────────────────────────────────────────────────────── top bar
export function topBar(app) {
  const lvlNum = h('b', { class: 'lvl-num', text: '1' });
  const ring = h('span', { class: 'lvl-ring' }, lvlNum);
  const xpFill = h('i', { class: 'xp-fill' });
  const xpTxt = h('span', { class: 'xp-txt', text: '0 XP' });
  const lvl = h('button', { class: 'chip chip-lvl', type: 'button', 'aria-label': t('top.profile'), on: { click: () => app.go('profile') } },
    ring, h('span', { class: 'xp-col' }, xpTxt, h('span', { class: 'xp-bar' }, xpFill)));
  const foodN = h('b', { text: '0' });
  const trN = h('b', { text: '0' });
  const food = h('span', { class: 'chip chip-food', title: t('top.food') }, h('span', { class: 'chip-ico', text: '🍀' }), foodN);
  const tro = h('span', { class: 'chip chip-tro', title: t('top.trophies') }, h('span', { class: 'chip-ico', text: '🏆' }), trN);
  const backBtn = h('button', { class: 'chip chip-back', type: 'button', 'aria-label': t('common.back'), data: { sfx: 'back' }, on: { click: () => app.back() } }, '‹');
  const el = h('header', { class: 'topbar' }, backBtn, lvl, h('span', { class: 'topbar-gap' }), food, tro);

  let prev = null;
  function bump(node, chipEl, from, to, label) {
    fx.countUp(node, from, to, 650);
    if (to > from) {
      chipEl.classList.remove('bump'); void chipEl.offsetWidth; chipEl.classList.add('bump');
      if (label) fx.floatText(chipEl, label, 'float-' + (chipEl === lvl ? 'xp' : chipEl === food ? 'food' : 'tro'));
    } else if (to < from) {
      chipEl.classList.remove('dip'); void chipEl.offsetWidth; chipEl.classList.add('dip');
    }
  }
  function update(animate = true) {
    const st = app.state;
    if (!st) return;
    const cur = { xp: st.xp, food: st.food, tro: st.trophies };
    const p = xpProgress(st.xp);
    xpFill.style.transform = `scaleX(${p.pct})`;
    if (!prev || !animate) {
      lvlNum.textContent = p.level; xpTxt.textContent = `${st.xp} XP`;
      foodN.textContent = st.food; trN.textContent = st.trophies;
    } else {
      if (cur.xp !== prev.xp) {
        const span = h('span');
        xpTxt.textContent = ''; xpTxt.append(span, ' XP');
        bump(span, lvl, prev.xp, cur.xp, cur.xp > prev.xp ? `+${cur.xp - prev.xp} XP` : null);
        if (cur.xp > prev.xp && levelOf(cur.xp) <= levelOf(prev.xp)) setTimeout(() => audio.sfx('xp'), 180);
        if (levelOf(cur.xp) > levelOf(prev.xp)) {
          setTimeout(() => audio.sfx('levelup'), 200);
          lvlNum.textContent = p.level;
          ring.classList.remove('lvl-up'); void ring.offsetWidth; ring.classList.add('lvl-up');
          fx.sparkle(ring);
        } else lvlNum.textContent = p.level;
      }
      if (cur.food !== prev.food) bump(foodN, food, prev.food, cur.food, cur.food > prev.food ? `+${cur.food - prev.food}` : null);
      if (cur.tro !== prev.tro) bump(trN, tro, prev.tro, cur.tro, cur.tro > prev.tro ? `+${cur.tro - prev.tro}` : null);
    }
    prev = cur;
  }
  return { el, update, setBack(show) { el.classList.toggle('has-back', !!show); } };
}

// ─────────────────────────────────────────────────────────── progress
export function progressBar(total) {
  const segs = Array.from({ length: total }, () => h('i', { class: 'seg' }));
  const el = h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total }, segs);
  return {
    el,
    set(i, results = []) {
      el.setAttribute('aria-valuenow', i);
      segs.forEach((s, k) => {
        s.className = 'seg' + (results[k] === true ? ' ok' : results[k] === false ? ' bad' : '') + (k === i ? ' cur' : '');
      });
    },
  };
}

// ─────────────────────────────────────────────────────────── answers
export function orderOk(task, given) {
  const key = (x) => norm(String(x).replace(/,/g, ' '));
  const ok = [task.answer || '', ...(task.alts || [])].map(key);
  return ok.includes(key(given));
}

export function correctText(t) {
  if (t.type === 'choice') return String(t.options[t.answer]);
  if (t.type === 'type') {
    if (!t.answers || !t.answers.length) return '';
    let a = String(t.answers[0]).replace(/\bi\b/g, 'I');
    if (!String(t.q || '').includes('___') && a.split(' ').length >= 3) a = a[0].toUpperCase() + a.slice(1);
    return a;
  }
  return String(t.answer || '');
}

const TASK_HINT = { choice: 'task.hint.choice', type: 'task.hint.type', order: 'task.hint.order' };

/** Що озвучити після відповіді: повне англійське речення з правильною відповіддю. */
export function answerSpeech(task) {
  const right = correctText(task);
  const q = String(task.q || '');
  if (task.type === 'choice' && /_{2,}/.test(q) && !CYR.test(q)) return q.replace(/_{2,}/, right);
  return englishOf(right);
}

/**
 * Рендер одного завдання. Після відповіді блокується й підсвічує результат,
 * потім (≈0.5 с) викликає onResult(correct, given, {skipped}).
 */
export function renderTask(container, task, { onResult, lumi } = {}) {
  let done = false;
  const qText = tc(task, 'q');
  const root = h('div', { class: `task task-${task.type}` });
  const qEn = englishOf(qText);
  const qCard = h('div', { class: 'task-q' },
    h('span', { class: 'task-kind', text: TASK_HINT[task.type] ? t(TASK_HINT[task.type]) : '' }),
    h('p', { class: 'task-text' }, richText(qText), qEn ? speakBtn(qEn, 'say-q') : null));
  root.append(qCard);
  const body = h('div', { class: 'task-body' });
  root.append(body);

  const finish = (ok, given, meta = {}) => {
    if (done) return;
    done = true;
    root.classList.add('is-locked', ok ? 'is-ok' : 'is-bad');
    // v17: «соковитий» відгук — правильно: зелений спалах картки + підскок; неправильно: тряска + червоний пульс
    if (!reduced()) {
      root.classList.remove('fx-ok', 'fx-bad'); void root.offsetWidth;
      root.classList.add(ok ? 'fx-ok' : 'fx-bad');
      setTimeout(() => root.classList.remove('fx-ok', 'fx-bad'), 700);
      if (ok) fx.sparkle(qCard, { count: 6, spread: 1.4 });
    }
    haptics.notify(ok ? 'success' : 'error');
    audio.sfx(ok ? 'correct' : 'wrong');
    if (lumi) {
      try { lumi.set(ok ? 'happy' : (meta.skipped ? 'sad' : 'cheer')); } catch (e) { /* ignore */ }
    }
    setTimeout(() => onResult && onResult(ok, given, meta), ok ? 520 : 760);
  };

  // ── choice
  if (task.type === 'choice') {
    const short = task.options.every((o) => String(o).length <= 12) && task.options.length === 4;
    const grid = h('div', { class: 'choices' + (short ? ' grid2' : '') });
    const btns = task.options.map((o, i) => {
      const en = englishOf(o);
      let longPressed = false;
      const b = button(h('span', { class: 'btn-label', lang: 'en', text: o }), {
        variant: 'option',
        onClick: () => {
          if (longPressed) { longPressed = false; return; }
          if (done) return;
          const ok = i === task.answer;
          b.classList.add(ok ? 'is-right' : 'is-wrong');
          if (ok) fx.sparkle(b);
          else { fx.shake(b); btns[task.answer] && btns[task.answer].classList.add('is-answer'); }
          btns.forEach((x) => { x.disabled = true; });
          finish(ok, o);
        },
      });
      b.style.setProperty('--i', i);
      b.dataset.sfx = 'none';
      if (en) {
        b.classList.add('has-say');
        b.append(speakBtn(en, 'say-opt'));
        // довге натискання на варіант — теж озвучка
        let lp = null;
        b.addEventListener('pointerdown', () => { clearTimeout(lp); lp = setTimeout(() => { longPressed = true; audio.speak(en, { lang: 'en-US', rate: 0.9 }); haptics.tap('soft'); }, 550); });
        const stop = () => clearTimeout(lp);
        b.addEventListener('pointerup', stop); b.addEventListener('pointerleave', stop); b.addEventListener('pointercancel', stop);
        b.addEventListener('contextmenu', (e) => e.preventDefault());
      }
      return b;
    });
    grid.append(...btns);
    body.append(grid);
  }

  // ── type
  if (task.type === 'type') {
    const input = h('input', {
      class: 'type-input', type: 'text', lang: 'en', inputmode: 'text', autocomplete: 'off',
      autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done',
      placeholder: t('task.typePh'), 'aria-label': t('task.yourAnswer'), maxlength: '120',
    });
    const check = button(t('task.check'), {
      variant: 'primary', cls: 'type-check',
      onClick: () => submit(),
    });
    const submit = () => {
      if (done) return;
      const v = input.value;
      if (!norm(v)) { fx.shake(input); input.focus(); return; }
      const ok = (task.answers || []).map(norm).includes(norm(v));
      input.classList.add(ok ? 'is-right' : 'is-wrong');
      input.readOnly = true;
      check.disabled = true;
      if (ok) fx.sparkle(input); else fx.shake(input);
      input.blur();
      finish(ok, v.trim());
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    body.append(h('div', { class: 'type-wrap' }, input), check);
  }

  // ── order
  if (task.type === 'order') {
    const words = task.words.map(String);
    const picked = [];
    const line = h('div', { class: 'order-line', 'aria-label': t('task.yourSentence') });
    const placeholder = h('span', { class: 'order-ph', text: t('task.orderPh') });
    line.append(placeholder);
    const pool = h('div', { class: 'order-pool' });
    const slots = words.map(() => h('span', { class: 'slot' }));
    const tiles = words.map((w, i) => {
      const t = h('button', { class: 'tile', type: 'button', lang: 'en', text: w });
      t.addEventListener('click', () => {
        if (done) return;
        haptics.select();
        if (picked.includes(i)) unpick(i); else pick(i);
      });
      slots[i].append(t);
      return t;
    });
    pool.append(...slots);
    const undo = button(t('task.undo'), { variant: 'secondary', disabled: true, onClick: () => { if (picked.length) unpick(picked[picked.length - 1]); } });
    const check = button(t('task.checkOrder'), {
      variant: 'primary', disabled: true,
      onClick: () => {
        if (done || picked.length !== words.length) return;
        const built = picked.map((i) => words[i]).join(' ');
        const ok = orderOk(task, built);
        if (ok) fx.sparkle(line); else fx.shake(line);
        line.classList.add(ok ? 'is-right' : 'is-wrong');
        undo.disabled = true; check.disabled = true;
        // після перевірки — 🔊 речення (правильний варіант)
        const sent = String(task.answer || built);
        line.append(speakBtn(sent, 'say-line'));
        finish(ok, built);
      },
    });

    const flip = (tile, mutate) => {
      const a = tile.getBoundingClientRect();
      mutate();
      const b = tile.getBoundingClientRect();
      if (reduced()) return;
      const dx = a.left - b.left; const dy = a.top - b.top;
      tile.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(1)` },
        { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 18}px) scale(1.08)`, offset: 0.45 },
        { transform: 'translate(0,0) scale(1)' },
      ], { duration: 340, easing: 'cubic-bezier(.3,.7,.3,1)' });
    };
    const refresh = () => {
      placeholder.hidden = picked.length > 0;
      undo.disabled = done || picked.length === 0;
      check.disabled = done || picked.length !== words.length;
      line.classList.toggle('is-full', picked.length === words.length);
    };
    function pick(i) {
      const t = tiles[i];
      // інші плитки в рядку не рухаються — анімуємо лише цю
      slots[i].style.width = t.offsetWidth + 'px';
      flip(t, () => { picked.push(i); line.append(t); t.classList.add('in-line'); refresh(); });
    }
    function unpick(i) {
      const t = tiles[i];
      const others = picked.filter((k) => k !== i).map((k) => [tiles[k], tiles[k].getBoundingClientRect()]);
      flip(t, () => {
        picked.splice(picked.indexOf(i), 1);
        slots[i].append(t); t.classList.remove('in-line'); refresh();
      });
      if (!reduced()) {
        for (const [ot, r0] of others) {
          const r1 = ot.getBoundingClientRect();
          if (r0.left !== r1.left || r0.top !== r1.top) {
            ot.animate([{ transform: `translate(${r0.left - r1.left}px, ${r0.top - r1.top}px)` }, { transform: 'none' }],
              { duration: 240, easing: 'ease-out' });
          }
        }
      }
    }
    body.append(line, pool, h('div', { class: 'order-ctrl' }, undo, check));
  }

  // ── не знаю
  const skip = button(t('task.skip'), {
    variant: 'ghost', cls: 'skip-btn', haptic: 'soft',
    onClick: () => {
      if (done) return;
      root.querySelectorAll('button:not(.say-btn), input').forEach((x) => { x.disabled = true; });
      if (task.type === 'choice') {
        const b = root.querySelectorAll('.choices .btn')[task.answer];
        if (b) b.classList.add('is-answer');
      }
      finish(false, null, { skipped: true });
    },
  });
  root.append(skip);
  container.append(root);

  if (task.type === 'type') {
    // не відкриваємо клавіатуру на телефоні автоматично (перекриває питання); на ноуті — фокус
    if (window.matchMedia && matchMedia('(pointer: fine)').matches) {
      setTimeout(() => { const i = root.querySelector('input'); if (i && !done) i.focus({ preventScroll: true }); }, 350);
    }
  }
  return { el: root, destroy() { root.remove(); } };
}

// ─────────────────────────────────────────────────────────── feedback sheet
/**
 * Нижня панель після відповіді — «бульбашка» Лумі.
 * opts: {ok, skipped, title, sub, right, yours, explain, emotion, nextLabel, app, say}
 *   say — англійський текст правильної відповіді: озвучується автоматично + кнопка 🔊
 * Повертає Promise, що резолвиться після «Далі».
 */
export function feedbackSheet(host, opts) {
  return new Promise((resolve) => {
    const { ok, title, sub, right, yours, explain, nextLabel = t('common.next'), app, emotion, say } = opts;
    const lumiBox = h('div', { class: 'fb-lumi' });
    const next = button(nextLabel, {
      variant: ok ? 'primary' : 'gold', cls: 'fb-next', haptic: 'medium',
      onClick: () => {
        next.disabled = true;
        sheet.classList.remove('in');
        setTimeout(() => { if (lumi && lumi.destroy) try { lumi.destroy(); } catch (e) { /* */ } sheet.remove(); scrim.remove(); }, 260);
        resolve();
      },
    });
    const body = h('div', { class: 'fb-body' },
      h('p', { class: 'fb-title', text: title }),
      sub ? h('p', { class: 'fb-sub', text: sub }) : null,
      yours ? h('p', { class: 'fb-row' }, h('span', { class: 'fb-k', text: t('fb.yours') }), h('span', { class: 'fb-v en strike', lang: 'en', text: yours })) : null,
      right ? h('p', { class: 'fb-row' }, h('span', { class: 'fb-k', text: t('fb.right') }), h('span', { class: 'fb-v en', lang: 'en', text: right }), say ? speakBtn(say, 'say-fb') : null) : null,
      !right && say ? h('p', { class: 'fb-row fb-say' }, h('span', { class: 'fb-v en', lang: 'en', text: say }), speakBtn(say, 'say-fb')) : null,
      explain ? h('p', { class: 'fb-explain' }, h('span', { 'aria-hidden': 'true', text: '💡 ' }), richText(explain)) : null);
    const scrim = h('div', { class: 'fb-scrim' });
    const sheet = h('div', { class: `fb-sheet ${ok ? 'is-ok' : 'is-bad'}`, role: 'status', 'aria-live': 'polite' },
      lumiBox, h('div', { class: 'fb-bubble' }, body), next);
    host.append(scrim, sheet);
    let lumi = null;
    if (app && app.makeLumi) {
      lumi = app.makeLumi(lumiBox, { size: 76, emotion: emotion || (ok ? 'happy' : 'cheer') });
    }
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('in')));
    setTimeout(() => next.focus({ preventScroll: true }), 300);
    if (say) setTimeout(() => { if (sheet.isConnected) audio.speak(say, { lang: 'en-US', rate: 0.9 }); }, 420);
  });
}

export { wait, reduced };

/** v6: пауза CSS-анімацій елементів поза екраном (клас .lq-off). root — скрол-контейнер або null (вʼюпорт).
 *  Повертає disconnect(). */
//  delay — почати після вхідних (stagger) анімацій, щоб не заморозити їх на півдорозі.
export function pauseOffscreen(els, root = null, { margin = '120px', delay = 1900 } = {}) {
  const list = Array.from(els || []).filter(Boolean);
  if (!list.length || typeof IntersectionObserver !== 'function') return () => {};
  let io = null;
  const t = setTimeout(() => {
    io = new IntersectionObserver((entries) => {
      for (const e of entries) e.target.classList.toggle('lq-off', !e.isIntersecting);
    }, { root, rootMargin: margin });
    list.forEach((el) => io.observe(el));
  }, delay);
  return () => { clearTimeout(t); if (io) io.disconnect(); };
}
