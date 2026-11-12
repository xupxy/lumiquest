// 💌 Історії — візуальна новела з виборами. Порт game/story.py.
import * as S from './state.js?v=20261112180927';
import * as FX from './fx.js?v=20261112180927';
import * as L from './lumi.js?v=20261112180927';
import { createCharacter, characterIdFor } from './characters.js?v=20261112180927';
import { recordGame } from './games.js?v=20261112180927';
import { tr, tc, lang, sfx, speak, speakAuto, longPressSpeak, starSfx } from './i18n_modes.js?v=20261112180927';
// v17 «соковитість»: спільний мікро-набір (лише transform/opacity, WAAPI; стилі .jx-* — у css/games3.css)
const JX = (() => {
  const de = document.documentElement;
  const lite = () => de.dataset.perf === 'lite';
  const red = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // composite:'add' (не ламає власний transform елемента) лише коли він є — інакше анімація йде на компоситорі
  const anim = (el, kf, o) => {
    try {
      if (!el || !el.animate || red()) return null;
      const own = el.style.transform || el.getAnimations?.().length || getComputedStyle(el).transform !== 'none';
      return el.animate(kf, own ? { composite: 'add', ...o } : o);
    } catch (e) { return null; }
  };
  const css = () => {
    if (document.querySelector('link[data-games3-css]')) return;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.games3Css = '1';
    l.href = new URL('./games3.css?v=20261112180927', import.meta.url).href;
    l.addEventListener('load', () => { l.dataset.ready = '1'; }, { once: true });
    document.head.append(l);
  };
  const tint = (el, rgb, kf) => { // кольоровий спалах поверх елемента (окремий шар, лише opacity)
    if (!el || red() || !el.getBoundingClientRect) return;
    const r = el.getBoundingClientRect(); if (!r.width) return;
    const d = document.createElement('div');
    d.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;pointer-events:none;z-index:9998;opacity:0;background:rgb(${rgb});border-radius:${getComputedStyle(el).borderRadius}`;
    document.body.appendChild(d);
    const a = d.animate(kf, { duration: 520, easing: 'ease-out' });
    a.onfinish = a.oncancel = () => d.remove();
  };
  return {
    css, lite,
    /** пружинне натискання для всіх кнопок у root; повертає відписку */
    press(root, sel = 'button,[data-jx]') {
      const h = (e) => {
        const b = e.target.closest?.(sel);
        if (!b || b.disabled || !root.contains(b)) return;
        anim(b, [{ transform: 'scale(1)' }, { transform: 'scale(.9)', offset: 0.3 }, { transform: 'scale(1.04)', offset: 0.7 }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' });
      };
      root.addEventListener('pointerdown', h, { passive: true });
      return () => root.removeEventListener('pointerdown', h);
    },
    /** правильно: зелений спалах + підскок + іскри */
    ok(el, n = 8, hop = true) {
      if (!el) return;
      tint(el, '80,215,120', [{ opacity: 0 }, { opacity: 0.5, offset: 0.2 }, { opacity: 0 }]);
      if (hop) anim(el, [{ transform: 'none' }, { transform: 'translateY(-8px) scale(1.08)', offset: 0.35 }, { transform: 'translateY(1px) scale(.97)', offset: 0.7 }, { transform: 'none' }], { duration: 480, easing: 'ease-out' });
      try { if (n) FX.sparkle?.(el, { count: lite() ? Math.min(3, n) : n }); } catch (e) { /* */ }
    },
    /** неправильно: тряска + червоний пульс */
    bad(el, shake = true) {
      if (!el) return;
      tint(el, '240,70,80', [{ opacity: 0 }, { opacity: 0.45, offset: 0.15 }, { opacity: 0.05, offset: 0.45 }, { opacity: 0.35, offset: 0.65 }, { opacity: 0 }]);
      if (shake) anim(el, [{ transform: 'none' }, { transform: 'translateX(-8px) rotate(-1deg)', offset: 0.2 }, { transform: 'translateX(8px) rotate(1deg)', offset: 0.4 }, { transform: 'translateX(-5px)', offset: 0.6 }, { transform: 'translateX(3px)', offset: 0.8 }, { transform: 'none' }], { duration: 420, easing: 'ease-out' });
    },
    /** емоція персонажа: 'joy' — радісний підскок, 'sad' — похнюплене хитання */
    emote(el, kind) {
      if (!el) return;
      if (kind === 'joy') anim(el, [{ transform: 'none' }, { transform: 'translateY(-14px) scale(1.06,.95)', offset: 0.3 }, { transform: 'translateY(0) scale(1.06,.92)', offset: 0.55 }, { transform: 'translateY(-5px)', offset: 0.75 }, { transform: 'none' }], { duration: 620, easing: 'ease-out' });
      else anim(el, [{ transform: 'none' }, { transform: 'translateY(4px) rotate(-6deg)', offset: 0.25 }, { transform: 'translateY(4px) rotate(5deg)', offset: 0.5 }, { transform: 'translateY(2px) rotate(-3deg)', offset: 0.75 }, { transform: 'none' }], { duration: 650, easing: 'ease-in-out' });
    },
    /** нагорода: FX.rewardBurst (якщо є) або «+N XP» */
    xp(el, xp, food) {
      try { if (typeof FX.rewardBurst === 'function') return FX.rewardBurst(el, { xp, food }); FX.floatText?.(el, `+${xp} XP`); } catch (e) { /* */ }
    },
    /** FLIP: плавне переміщення елементів (key = атрибут) після mutate(); src — {key: DOMRect} звідки «прилітають» нові */
    flip(root, sel, key, mutate, src = {}) {
      const old = {};
      if (!red()) root.querySelectorAll(sel).forEach((e) => { const k = e.getAttribute(key); if (k != null && !old[k]) old[k] = e.getBoundingClientRect(); });
      mutate();
      if (red()) return;
      const seen = {};
      root.querySelectorAll(sel).forEach((e) => {
        const k = e.getAttribute(key); if (k == null || seen[k]) return; seen[k] = 1;
        const p = old[k] || src[k]; if (!p) return;
        const n = e.getBoundingClientRect();
        const dx = p.left - n.left, dy = p.top - n.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        anim(e, [{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.2,.9,.3,1.15)' });
      });
    },
    /** стартова картка: поява + підскок іконки */
    intro(box, ico) { box?.classList.add('jx-in'); ico?.classList.add('jx-bob'); },
    /** екран результату: картка, зірки по черзі (звук star), лічильники [data-n], конфеті на 3⭐ */
    result(box, starsEl, n, { later = setTimeout, sfx = () => {} } = {}) {
      box?.classList.add('jx-in');
      if (starsEl) {
        starsEl.textContent = '';
        try { FX.starsDrop?.(starsEl, n, 3); } catch (e) { /* */ }
        for (let i = 0; i < n; i++) later(() => sfx('star'), 420 + i * 260);
      }
      box?.querySelectorAll('[data-n]').forEach((b, k) => later(() => { try { FX.countUp?.(b, 0, +b.dataset.n || 0, 700); } catch (e) { /* */ } }, 450 + k * 120));
      if (n >= 3) later(() => { try { if (lite()) FX.sparkle?.(starsEl || box, { count: 8 }); else FX.confetti?.(); } catch (e) { /* */ } }, 300 + n * 260);
    },
  };
})();

// ---------------------------------------------------------------- спільні дрібниці режимів
const CSS_HREF = new URL('./modes.css?v=20261112180927', import.meta.url).href;
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

// ---------------------------------------------------------------- правила (як у story.py)
const XP_PER_HEART = 5;
export function storyEndingKind(hearts, n) {
  if (hearts >= n - 1) return 'good';
  if (hearts >= Math.floor((n + 1) / 2)) return 'ok';
  return 'bad';
}

const addXP = (st, n) => (typeof S.addXP === 'function' ? S.addXP(st, n) : (st.xp = (st.xp || 0) + n));
function onCorrect(st) {
  if (typeof S.onCorrectAnswer === 'function') return S.onCorrectAnswer(st);
  st.fireflies = (st.fireflies || 0) + 1;
  if (typeof S.addFood === 'function') S.addFood(st, 1); else st.food = (st.food || 0) + 1;
}

// Типограф: друкує текст, тап — допечатати миттєво
function typewriter(node, text, speed = 26) {
  let i = 0; let timer = null; let resolve;
  const done = new Promise((r) => { resolve = r; });
  const chars = Array.from(String(text));
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
    timer = setTimeout(tick, /[.!?…]/.test(ch) ? speed * 6 : /[,;:]/.test(ch) ? speed * 3 : speed);
  };
  if (reduced() || !chars.length) finish(); else timer = setTimeout(tick, speed);
  return { done, finish, get typing() { return timer !== null; } };
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
  const wid = params?.wid;
  const world = (app.content?.WORLDS || []).concat(app.content?.COUNTRIES || []).find((w) => w.id === wid);
  const ep = params?.ep === 2 || params?.ep === 3 ? params.ep : 1;   // додаткові епізоди: world.story2 / story3
  const s = ep > 1 ? world?.['story' + ep] : world?.story;
  let alive = true;
  let tw = null;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms));

  const scr = el('div', `m-screen m-story m-bg-${esc(wid || 'w1')}`);
  root.append(scr);

  if (!s || !Array.isArray(s.scenes) || !s.scenes.length || !(st.unlocked || []).includes(wid)) {
    scr.innerHTML = `<div class="m-locked"><div class="m-locked-ico">🔒</div>
      <p>${tr('common.locked_world')}</p>
      <button class="m-btn" data-a="map">${tr('common.map')}</button></div>`;
    scr.querySelector('[data-a=map]').onclick = () => app.go('map');
    return () => { alive = false; };
  }

  const n = s.scenes.length;
  const cast = s.cast || '';
  const run = { i: 0, hearts: 0, good: 0, stage: 'intro' };

  scr.innerHTML = `
    <div class="m-st-sky" aria-hidden="true">${'<i></i>'.repeat(9)}</div>
    <header class="m-head">
      <button class="m-back" ${tr('common.back_aria')}${inTg ? ' hidden' : ''}>‹</button>
      <div class="m-title">${esc(s.emoji || '💌')} ${esc(tc(s, 'title') || tr('story.title_def'))}</div>
      <div class="m-st-count"></div>
    </header>
    <div class="m-st-hearts" aria-label="${tr('story.hearts_aria')}"></div>
    <div class="m-st-stage">
      <div class="m-st-glow"></div>
      <div class="m-st-portrait m-st-chr" aria-label="${esc(cast)}"></div>
    </div>
    <div class="m-st-box" role="button" tabindex="0">
      <div class="m-st-speaker"><span></span><button class="m-st-hintbtn" aria-label="${tr('common.translate_aria')}">${tr('common.flag')}</button><button class="m-st-hintbtn m-st-say" aria-label="${tr('common.listen')}">🔊</button></div>
      <div class="m-st-line"></div>
      <div class="m-st-hint"></div>
      <div class="m-st-more">▼</div>
    </div>
    <div class="m-st-choices"></div>`;

  const $ = (q) => scr.querySelector(q);
  const heartsEl = $('.m-st-hearts');
  const countEl = $('.m-st-count');
  const portrait = $('.m-st-portrait');
  const box = $('.m-st-box');
  const speaker = $('.m-st-speaker span');
  const hintBtn = $('.m-st-hintbtn:not(.m-st-say)');
  const sayBtn = $('.m-st-say');
  let curLine = '';
  const lineEl = $('.m-st-line');
  const hintEl = $('.m-st-hint');
  const choicesEl = $('.m-st-choices');
  $('.m-back').onclick = () => { hap(app); app.back(); };
  // герой історії — живий портрет (characters.js) замість PNG
  const castId = s.cast_id || characterIdFor(cast);
  let hero = null, endHero = null;
  try { hero = createCharacter(portrait, castId, { size: '100%' }); } catch (e) { console.warn('story char', e); }

  for (let k = 0; k < n; k++) heartsEl.append(el('span', 'm-heart', '🤍'));
  const heartNodes = [...heartsEl.children];
  const paintHearts = () => heartNodes.forEach((h, k) => {
    const on = k < run.hearts;
    h.classList.toggle('on', on);
    h.textContent = on ? '💗' : '🤍';
  });
  const paintCount = () => {
    countEl.innerHTML = run.stage === 'intro' ? '' :
      `<span>${tr('story.scene_n', { 0: Math.min(run.i + 1, n), 1: n })}</span><span class="m-dots">${
        Array.from({ length: n }, (_, k) => `<b class="${k < run.i ? 'done' : k === run.i ? 'cur' : ''}"></b>`).join('')}</span>`;
  };

  const say = (who, text, { italic = false, hint = '' } = {}) => {
    speaker.textContent = who;
    lineEl.classList.toggle('narr', italic);
    hintEl.textContent = hint;
    hintEl.classList.remove('show');
    hintBtn.hidden = !hint;
    curLine = who === cast ? text : '';
    sayBtn.hidden = !curLine;
    box.classList.add('typing');
    anim(box, [{ transform: 'translateY(6px)', opacity: 0.6 }, { transform: 'none', opacity: 1 }], 220);
    tw = typewriter(lineEl, text);
    if (who === cast && hero) {
      hero.talk(true);
      tw.done.then(() => hero?.talk(0));
    }
    tw.done.then(() => box.classList.remove('typing'));
    return tw.done;
  };
  box.addEventListener('click', (e) => {
    if (e.target === hintBtn || e.target === sayBtn) return;
    if (tw?.typing) tw.finish();
  });
  sayBtn.addEventListener('click', (e) => { e.stopPropagation(); hap(app); speak(curLine); });
  hintBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hap(app);
    hintEl.classList.toggle('show');
  });

  const react = (kind) => {
    portrait.classList.remove('m-react-good', 'm-react-bad');
    void portrait.offsetWidth;
    if (kind !== 'neutral') portrait.classList.add(kind === 'good' ? 'm-react-good' : 'm-react-bad');
    hero?.talk(0);
    hero?.set(kind === 'good' ? 'happy' : kind === 'neutral' ? 'idle' : 'sad');
  };

  // ------------------------------------------------ intro
  function showIntro() {
    run.stage = 'intro';
    paintCount(); paintHearts();
    say('📖', tc(s, 'intro') || '', { italic: true });
    choicesEl.innerHTML = `<p class="m-st-tip">${tr('story.tip')}</p>`;
    const b = el('button', 'm-btn m-btn-big m-st-go', tr('story.start'));
    b.onclick = () => { hap(app); if (tw?.typing) tw.finish(); showScene(); };
    choicesEl.append(b);
    anim(choicesEl, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], 400);
  }

  // ------------------------------------------------ scene
  async function showScene() {
    run.stage = 'scene';
    paintCount();
    const sc = s.scenes[run.i];
    choicesEl.innerHTML = '';
    hero?.set('idle');
    anim(portrait, [{ transform: 'scale(.94)', opacity: 0.6 }, { transform: 'none', opacity: 1 }], 350);
    sfx('page');
    await say(cast, sc.line || '', { hint: tc(sc, 'hint') || '' });
    if (!alive || run.stage !== 'scene') return;
    speakAuto(sc.line, 250);
    (sc.choices || []).forEach((c, k) => {
      const b = el('button', 'm-choice', esc(c.text || '…'));
      b.style.animationDelay = `${k * 90}ms`;
      b.onclick = () => pick(k, b);
      longPressSpeak(b, c.text);
      choicesEl.append(b);
    });
  }

  function pick(k, btn) {
    if (run.stage !== 'scene') return;
    if (tw?.typing) tw.finish();
    run.stage = 'feedback';
    const sc = s.scenes[run.i];
    const choices = sc.choices || [];
    const ch = choices[k];
    if (!ch) return;
    const btns = [...choicesEl.querySelectorAll('.m-choice')];
    btns.forEach((b, j) => {
      b.disabled = true;
      if (j !== k) b.classList.add(choices[j]?.good && !ch.good ? 'right' : 'dim');
    });
    let head;
    if (ch.good) {
      run.hearts = Math.min(n, run.hearts + 1);
      run.good += 1;
      onCorrect(st);
      btn.classList.add('ok');
      hap(app, 'success');
      react('good');
      const h = heartNodes[run.hearts - 1];
      paintHearts();
      if (h) {
        h.classList.add('m-heart-pop');
        setTimeout(() => h.classList.remove('m-heart-pop'), 700);
        fx('sparkle', h);
      }
      sfx('heart');
      JX.ok(btn, 0, false);
      floatText(portrait, '+1 💗', 'm-float-pink');
      spawnHearts(portrait, 6);
      head = `<div class="m-fb-head good">💗 <b>${tr('story.plus')}</b></div>`;
    } else if (ch.delta === 0) {
      // нейтральна відповідь: симпатія без змін
      btn.classList.add('neutral');
      sfx('page'); hap(app);
      react('neutral');
      head = `<div class="m-fb-head neutral">😐 <b>${tr('story.zero')}</b></div>`;
    } else {
      const lostIdx = run.hearts - 1;
      run.hearts = Math.max(0, run.hearts - 1);
      btn.classList.add('bad');
      sfx('wrong');
      JX.bad(btn);
      hap(app, 'error');
      react('bad');
      if (lostIdx >= 0) {
        const h = heartNodes[lostIdx];
        h.textContent = '💔';
        h.classList.add('m-heart-crack');
        setTimeout(() => { if (!alive) return; h.classList.remove('m-heart-crack'); paintHearts(); }, 750);
      } else {
        anim(heartsEl, [{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'none' }], 300);
      }
      const good = choices.find((c) => c.good)?.text || '';
      head = `<div class="m-fb-head bad">💔 <b>${tr('story.minus')}</b></div>` +
        (good ? `<div class="m-fb-better">${tr('story.better')} <b>${esc(good)}</b></div>` : '');
      if (tc(sc, 'explain')) head += `<div class="m-fb-explain">💡 ${esc(tc(sc, 'explain'))}</div>`;
    }
    app.save?.();
    const last = run.i + 1 >= n;
    setTimeout(() => {
      if (!alive) return;
      say('🎬', tc(ch, 'reaction') || '', { italic: true });
      const fb = el('div', 'm-st-fb ' + (ch.good ? 'good' : ch.delta === 0 ? 'neutral' : 'bad'), head);
      const next = el('button', 'm-btn m-btn-big', last ? tr('story.final') : tr('common.next'));
      next.onclick = () => {
        hap(app);
        if (tw?.typing) tw.finish();
        if (last) finish();
        else { run.i += 1; showScene(); }
      };
      fb.append(next);
      choicesEl.innerHTML = '';
      choicesEl.append(fb);
      anim(fb, [{ opacity: 0, transform: 'translateY(18px) scale(.97)' }, { opacity: 1, transform: 'none' }], 380);
    }, 650);
  }

  function spawnHearts(target, count) {
    if (reduced()) return;
    const r = target.getBoundingClientRect();
    for (let k = 0; k < count; k++) {
      const hEl = el('div', 'm-fly-heart', ['💗', '💖', '💕'][k % 3]);
      hEl.style.left = r.left + r.width * (0.2 + Math.random() * 0.6) + 'px';
      hEl.style.top = r.top + r.height * 0.55 + 'px';
      hEl.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`);
      hEl.style.animationDelay = `${k * 70}ms`;
      document.body.append(hEl);
      setTimeout(() => hEl.remove(), 1700);
    }
  }

  // ------------------------------------------------ ending (нагороди — як _story_finish)
  function finish() {
    run.stage = 'end';
    run.i = n;
    paintCount();
    const h = run.hearts;
    const kind = storyEndingKind(h, n);
    let xp; let badge;
    if (ep > 1) {
      // додатковий епізод: лише XP, без бейджа й запису story_best
      xp = h * XP_PER_HEART; if (xp) addXP(st, xp); badge = false;
    } else if (typeof S.finishStory === 'function') {
      const res = S.finishStory(st, wid, h, n);
      xp = res.xp; badge = !!res.badge;
    } else {
      xp = h * XP_PER_HEART;
      if (xp) addXP(st, xp);
      st.story_best = st.story_best || {};
      st.story_best[wid] = Math.max(st.story_best[wid] || 0, h);
      st.story_badges = st.story_badges || [];
      badge = kind === 'good' && !st.story_badges.includes(wid);
      if (badge) st.story_badges.push(wid);
    }
    // зірки рівня на стежці світу: good 3 / ok 2 / bad 1 (будь-яке завершення відкриває наступний рівень)
    recordGame(st, `${wid}-story${ep > 1 ? ep : ''}`, { good: 3, ok: 2, bad: 1 }[kind] || 1);
    app.save?.();

    const title = { good: tr('story.end_good'), ok: tr('story.end_ok'), bad: tr('story.end_bad') }[kind];
    const big = { good: '💞', ok: '🌤', bad: '🥀' }[kind];
    const emo = { good: 'proud', ok: 'happy', bad: 'sad' }[kind];
    const ov = el('div', `m-overlay m-st-end ${kind}`);
    ov.innerHTML = `
      <div class="m-end-fx" aria-hidden="true">${kind === 'bad' ? '<i></i>'.repeat(14) : '<i></i>'.repeat(12)}</div>
      <div class="m-end-card">
        <div class="m-end-big">${big}</div>
        <h2>${title}</h2>
        <div class="m-end-stars" style="display:flex;justify-content:center;min-height:60px;transform:scale(.8);margin:-6px 0"></div>
        <div class="m-end-portrait m-st-chr"></div>
        <p class="m-end-text">${esc((lang() === 'ru' && s.endings_ru?.[kind]) || tc(s.endings || {}, kind) || '')}</p>
        <div class="m-end-hearts">${Array.from({ length: n }, (_, k) => `<span class="${k < h ? 'on' : ''}" style="animation-delay:${400 + k * 160}ms">${k < h ? '💗' : '🤍'}</span>`).join('')}
          <small>(${h}/${n})</small></div>
        <div class="m-end-xp">+<b>0</b> XP</div>
        ${badge ? `<div class="m-end-badge">${tr('story.badge', { 0: esc(cast) })}</div>` : ''}
        ${kind !== 'good' ? '<p class="m-end-tip">' + tr('story.end_tip') + '</p>' : ''}
        <div class="m-end-lumi"></div>
        <div class="m-end-btns">
          <button class="m-btn" data-a="again">${tr('common.again')}</button>
          <button class="m-btn m-btn-alt" data-a="world">${tr('common.to_world')}</button>
        </div>
      </div>`;
    scr.append(ov);
    hero?.set(kind === 'good' ? 'win' : kind === 'bad' ? 'sad' : 'happy');
    try { endHero = createCharacter(ov.querySelector('.m-end-portrait'), castId, { size: '100%', mood: kind === 'good' ? 'happy' : kind === 'bad' ? 'sad' : 'idle' }); } catch (e) { /* */ }
    hap(app, kind === 'bad' ? 'warning' : 'success');
    sfx(kind === 'bad' ? 'lose' : 'win');
    starSfx({ good: 3, ok: 2, bad: 1 }[kind] || 1, 400, 260);
    fx('starsDrop', ov.querySelector('.m-end-stars'), { good: 3, ok: 2, bad: 1 }[kind] || 1);
    ov.querySelector('.m-end-card')?.classList.add('jx-in');
    later(() => countUp(ov.querySelector('.m-end-xp b'), 0, xp, 900), 400 + n * 160);
    if (kind === 'good') later(() => (JX.lite() ? fx('sparkle', ov.querySelector('.m-end-xp'), { count: 8 }) : fx('confetti')), 500);
    lumiRef = makeLumi(app, ov.querySelector('.m-end-lumi'), 84, emo);
    later(() => lumiRef?.say?.({ good: tr('story.lumi_good'), ok: tr('story.lumi_ok'), bad: tr('story.lumi_bad') }[kind]), 900);
    ov.querySelector('[data-a=again]').onclick = () => {
      hap(app);
      lumiRef?.destroy?.(); lumiRef = null;
      endHero?.destroy(); endHero = null;
      hero?.set('idle');
      ov.remove();
      run.i = 0; run.hearts = 0; run.good = 0;
      showIntro();
    };
    ov.querySelector('[data-a=world]').onclick = () => { hap(app); app.back(); }; // історію відкривають зі світу
  }
  let lumiRef = null;

  showIntro();

  skyCovered(true);
  JX.css();
  const unPress = JX.press(scr);
  return () => {
    unPress();
    skyCovered(false);
    alive = false;
    if (tw?.typing) tw.finish();
    timers.forEach(clearTimeout);
    try { lumiRef?.destroy?.(); } catch (e) { /* */ }
    try { hero?.destroy(); endHero?.destroy(); } catch (e) { /* */ }
    document.querySelectorAll('.m-fly-heart').forEach((x) => x.remove());
  };
}
