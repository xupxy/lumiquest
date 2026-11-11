// LumiQuest — visual effects. Vanilla JS, no dependencies.
//
//   import * as fx from './fx.js?v=20261111175613';
//   fx.confetti();                         // burst from screen centre
//   fx.sparkle(button);                    // star sparkles around an element
//   fx.floatText(el, '+10 XP');            // text that flies up and fades
//   fx.shake(el); fx.pop(el); fx.pulse(el); fx.flash('#7CFFB2');
//   await fx.countUp(el, 0, 120);          // animated number
//   await fx.starsDrop(box, 2, 3);         // result stars
//   await fx.flyTo(card, tower, { html: '🔥' });
//   await fx.screenTransition(oldScreen, newScreen, 'left');
//
// Every function returns a Promise that resolves when the effect is over
// (or immediately, if prefers-reduced-motion is on).

const DEFAULT_COLORS = ['#ff788c', '#6eb4ff', '#ffce50', '#8cdca0', '#be96ff', '#ffa0be'];

const CSS = `
.fx-layer{position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden}
.fx-spark{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;will-change:transform,opacity}
.fx-spark svg{display:block;width:100%;height:100%;overflow:visible}
.fx-float{position:absolute;left:0;top:0;transform:translate(-50%,-50%);white-space:nowrap;
  font:800 22px/1 Inter,'Nunito',system-ui,-apple-system,sans-serif;color:#ffd84a;letter-spacing:.3px;
  -webkit-text-stroke:5px #482c56;paint-order:stroke fill;text-shadow:0 3px 0 rgba(72,44,86,.35);
  animation:fxFloat 1.1s cubic-bezier(.2,.8,.3,1) forwards}
@keyframes fxFloat{0%{transform:translate(-50%,-30%) scale(.4);opacity:0}18%{transform:translate(-50%,-60%) scale(1.15);opacity:1}
  35%{transform:translate(-50%,-75%) scale(1)}75%{opacity:1}100%{transform:translate(-50%,-260%) scale(.95);opacity:0}}
.fx-shake{animation:fxShake .45s cubic-bezier(.36,.07,.19,.97) both}
@keyframes fxShake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(5px)}30%,50%,70%{transform:translateX(-9px) rotate(-1deg)}40%,60%{transform:translateX(9px) rotate(1deg)}}
.fx-pop{animation:fxPop .5s cubic-bezier(.3,1.6,.5,1) both}
@keyframes fxPop{0%{transform:scale(1)}30%{transform:scale(1.22)}55%{transform:scale(.93)}75%{transform:scale(1.05)}100%{transform:scale(1)}}
.fx-pulse{animation:fxPulse .7s ease-out both}
@keyframes fxPulse{0%{transform:scale(1);box-shadow:0 0 0 0 var(--fx-pulse,rgba(255,206,80,.85))}
  35%{transform:scale(1.07)}100%{transform:scale(1);box-shadow:0 0 0 18px rgba(255,206,80,0)}}
.fx-flash{position:absolute;inset:0;animation:fxFlash .45s ease-out forwards}
@keyframes fxFlash{0%{opacity:0}15%{opacity:.75}100%{opacity:0}}
.fx-stars{display:flex;align-items:flex-end;justify-content:center;gap:6px}
.fx-star{position:relative;width:56px;height:56px;flex:none}
.fx-star.mid{width:72px;height:72px;margin-bottom:12px}
.fx-star svg{display:block;width:100%;height:100%;overflow:visible}
.fx-star.empty{opacity:0;animation:fxStarEmpty .35s ease-out forwards}
.fx-star.full{opacity:0}
.fx-star.full.drop{animation:fxStarDrop .62s cubic-bezier(.3,0,.4,1) forwards}
@keyframes fxStarEmpty{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
@keyframes fxStarDrop{0%{opacity:0;transform:translateY(-160px) scale(1.7) rotate(-160deg)}
  45%{opacity:1;transform:translateY(0) scale(1.05) rotate(0)}62%{transform:translateY(-18px) scale(1.12,.92)}
  78%{transform:translateY(0) scale(.95,1.05)}90%{transform:translateY(-4px) scale(1.02)}100%{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){
  .fx-shake,.fx-pop,.fx-pulse,.fx-star.full.drop,.fx-star.empty{animation:none!important;opacity:1}
  .fx-float{animation-duration:.9s}
}
`;

function ensureStyle() {
  if (document.getElementById('fx-style')) return;
  const s = document.createElement('style');
  s.id = 'fx-style';
  s.textContent = CSS;
  document.head.appendChild(s);
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
// v6: html[data-perf=lite] (авто-режим для слабких телефонів) — менше частинок
const lite = () => document.documentElement.dataset.perf === 'lite';
const MAX_CONFETTI = 260;

function layer() {
  ensureStyle();
  const d = document.createElement('div');
  d.className = 'fx-layer';
  document.body.appendChild(d);
  return d;
}

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
}

// restart a CSS class animation on an element, resolve on animationend
function classAnim(el, cls, fallbackMs) {
  ensureStyle();
  if (!el) return Promise.resolve();
  return new Promise((resolve) => {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    let done = false;
    const end = (e) => {
      if (done || (e && e.target !== el)) return;
      done = true;
      el.removeEventListener('animationend', end);
      el.classList.remove(cls);
      resolve();
    };
    el.addEventListener('animationend', end);
    setTimeout(end, fallbackMs);
  });
}

function starSVG(fill, points = 5, inner = 0.45, stroke = '#482c56') {
  const p = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? 10 * inner : 10, a = -Math.PI / 2 + (i * Math.PI) / points;
    p.push(`${(12 + r * Math.cos(a)).toFixed(2)},${(12 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `<svg viewBox="0 0 24 24"><polygon points="${p.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" paint-order="stroke"/></svg>`;
}

// ---------------------------------------------------------------- confetti

let confettiState = null;

export function confetti({ x, y, count = 90, colors = DEFAULT_COLORS, spread = 1, power = 1 } = {}) {
  if (reduced()) return Promise.resolve();
  const W = window.innerWidth, H = window.innerHeight;
  x = x ?? W / 2;
  y = y ?? H * 0.38;
  if (!confettiState) {
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:10000';
    document.body.appendChild(cv);
    confettiState = { cv, ctx: cv.getContext('2d'), parts: [], waiters: [], raf: 0, last: 0 };
  }
  const S = confettiState;
  const dpr = Math.min(lite() ? 1.5 : 2, window.devicePixelRatio || 1);
  if (S.cv.width !== Math.round(W * dpr) || S.cv.height !== Math.round(H * dpr)) {
    S.cv.width = Math.round(W * dpr); S.cv.height = Math.round(H * dpr);
  }
  S.dpr = dpr;
  if (lite()) count = Math.ceil(count * 0.5);
  count = Math.max(0, Math.min(count, MAX_CONFETTI - S.parts.length));
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + rnd(-1.1, 1.1) * spread;
    const v = rnd(7, 15) * power;
    S.parts.push({
      x, y, vx: Math.cos(a) * v + rnd(-2, 2), vy: Math.sin(a) * v - rnd(0, 3),
      w: rnd(6, 11), h: rnd(9, 16), rot: rnd(0, Math.PI * 2), vr: rnd(-0.3, 0.3),
      tilt: rnd(0, Math.PI * 2), vt: rnd(0.08, 0.25), color: pick(colors),
      shape: Math.random() < 0.25 ? 'circle' : Math.random() < 0.15 ? 'star' : 'rect',
      life: 0, max: rnd(110, 170),
    });
  }
  const p = new Promise((r) => S.waiters.push(r));
  if (!S.raf) {
    S.last = performance.now();
    const tick = (now) => {
      const dt = Math.min(2.5, (now - S.last) / 16.67);
      S.last = now;
      const { ctx, dpr: k } = S;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // компактизація на місці — без нового масиву щокадру
      const P = S.parts;
      let n = 0;
      for (let i = 0; i < P.length; i++) { const q = P[i]; if (q.life < q.max && q.y < H + 40) P[n++] = q; }
      P.length = n;
      for (let i = 0; i < n; i++) {
        const q = P[i];
        q.life += dt;
        q.vx *= Math.pow(0.985, dt); q.vy = q.vy * Math.pow(0.985, dt) + 0.32 * dt;
        q.vx += Math.sin(q.tilt) * 0.05 * dt;
        q.x += q.vx * dt; q.y += q.vy * dt;
        q.rot += q.vr * dt; q.tilt += q.vt * dt;
        const fade = Math.min(1, (q.max - q.life) / 30);
        ctx.globalAlpha = Math.max(0, fade);
        // translate·rotate·scale(1, cos tilt) одним setTransform (без save/restore)
        const c = Math.cos(q.rot), sn = Math.sin(q.rot), sy = Math.cos(q.tilt);
        ctx.setTransform(k * c, k * sn, -k * sn * sy, k * c * sy, k * q.x, k * q.y);
        ctx.fillStyle = q.color;
        if (q.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, q.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else if (q.shape === 'star') {
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const r = i % 2 ? q.w * 0.35 : q.w * 0.8, a = -Math.PI / 2 + (i * Math.PI) / 5;
            ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
          }
          ctx.closePath(); ctx.fill();
        } else ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h);
      }
      ctx.globalAlpha = 1;
      if (S.parts.length) S.raf = requestAnimationFrame(tick);
      else {
        S.cv.remove();
        const w = S.waiters;
        confettiState = null;
        w.forEach((r) => r());
      }
    };
    S.raf = requestAnimationFrame(tick);
  }
  return p;
}

// ---------------------------------------------------------------- sparkles

export function sparkle(el, { count = 10, colors = ['#ffd84a', '#fff1a8', '#ffa0be', '#a0c8ff', '#be96ff'], spread = 1 } = {}) {
  if (!el || reduced()) return Promise.resolve();
  if (lite()) count = Math.ceil(count / 2);
  const L = layer();
  const { x, y, r } = centerOf(el);
  const rx = r.width / 2 + 6, ry = r.height / 2 + 6;
  const anims = [];
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'fx-spark';
    const size = rnd(12, 24);
    s.style.width = s.style.height = size + 'px';
    s.style.margin = `${-size / 2}px 0 0 ${-size / 2}px`;
    s.innerHTML = starSVG(pick(colors), 4, 0.32, Math.random() < 0.6 ? '#482c56' : 'none');
    L.appendChild(s);
    const a = (i / count) * Math.PI * 2 + rnd(-0.3, 0.3);
    const x0 = x + Math.cos(a) * rx * 0.75, y0 = y + Math.sin(a) * ry * 0.75;
    const d = rnd(18, 42) * spread;
    const x1 = x + Math.cos(a) * (rx + d), y1 = y + Math.sin(a) * (ry + d);
    const rot = rnd(-120, 120);
    anims.push(s.animate([
      { transform: `translate(${x0}px,${y0}px) scale(0) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${(x0 + x1) / 2}px,${(y0 + y1) / 2}px) scale(1.15) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${x1}px,${y1}px) scale(0) rotate(${rot}deg)`, opacity: 0.6 },
    ], { duration: rnd(550, 850), delay: rnd(0, 140), easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' }).finished);
  }
  return Promise.all(anims).catch(() => {}).then(() => L.remove());
}

// ---------------------------------------------------------------- floating text

export function floatText(el, text, cls = '') {
  if (!el) return Promise.resolve();
  const L = layer();
  const { x, r } = centerOf(el);
  const t = document.createElement('div');
  t.className = 'fx-float' + (cls ? ' ' + cls : '');
  t.textContent = text;
  t.style.left = x + 'px';
  t.style.top = r.top + 'px';
  L.appendChild(t);
  return new Promise((res) => {
    const done = () => { L.remove(); res(); };
    t.addEventListener('animationend', done, { once: true });
    setTimeout(done, 1600);
  });
}

// ---------------------------------------------------------------- one-shot element animations

export const shake = (el) => (reduced() ? Promise.resolve() : classAnim(el, 'fx-shake', 600));
export const pop = (el) => (reduced() ? Promise.resolve() : classAnim(el, 'fx-pop', 650));
export function pulse(el, { color } = {}) {
  if (!el || reduced()) return Promise.resolve();
  if (color) el.style.setProperty('--fx-pulse', color);
  return classAnim(el, 'fx-pulse', 850);
}

export function flash(color = '#ffffff') {
  if (reduced()) return Promise.resolve();
  const L = layer();
  const d = document.createElement('div');
  d.className = 'fx-flash';
  d.style.background = color;
  L.appendChild(d);
  return new Promise((res) => {
    const done = () => { L.remove(); res(); };
    d.addEventListener('animationend', done, { once: true });
    setTimeout(done, 700);
  });
}

// ---------------------------------------------------------------- counters

export function countUp(el, from, to, ms = 800) {
  if (!el) return Promise.resolve();
  const fmt = (v) => String(Math.round(v));
  if (reduced() || ms <= 0 || from === to) { el.textContent = fmt(to); return Promise.resolve(); }
  if (el._fxCount) cancelAnimationFrame(el._fxCount);
  return new Promise((res) => {
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (t < 1) el._fxCount = requestAnimationFrame(step);
      else { el._fxCount = 0; res(); }
    };
    el._fxCount = requestAnimationFrame(step);
  });
}

// ---------------------------------------------------------------- result stars

export async function starsDrop(container, n, total = 3) {
  ensureStyle();
  if (!container) return;
  n = Math.max(0, Math.min(total, n | 0));
  const row = document.createElement('div');
  row.className = 'fx-stars';
  const stars = [];
  for (let i = 0; i < total; i++) {
    const s = document.createElement('div');
    const full = i < n;
    s.className = 'fx-star ' + (full ? 'full' : 'empty') + (total === 3 && i === 1 ? ' mid' : '');
    s.innerHTML = full
      ? `<svg viewBox="0 0 24 24"><defs><radialGradient id="fxsg${i}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff7c8"/><stop offset=".5" stop-color="#ffd84a"/><stop offset="1" stop-color="#ffb52e"/></radialGradient></defs>
         ${starSVG('url(#fxsg' + i + ')', 5, 0.5).replace(/<\/?svg[^>]*>/g, '')}<ellipse cx="9.5" cy="8.5" rx="2.2" ry="1.4" fill="#fff" opacity=".85"/></svg>`
      : starSVG('#d9d3e6', 5, 0.5, '#9b91ad');
    if (!full) s.style.animationDelay = `${i * 0.08}s`;
    row.appendChild(s);
    stars.push(s);
  }
  container.appendChild(row);
  if (reduced()) { stars.forEach((s) => (s.style.opacity = 1)); return; }
  for (let i = 0; i < n; i++) {
    await sleep(i ? 260 : 120);
    stars[i].classList.add('drop');
    setTimeout(() => sparkle(stars[i], { count: 8 }), 290);
  }
  await sleep(650);
}

// ---------------------------------------------------------------- fly along an arc

export function flyTo(fromEl, toEl, { html, ms = 650, arc = 0.35, scale = 0.6, rotate = 0 } = {}) {
  if (!fromEl || !toEl) return Promise.resolve();
  const L = layer();
  const a = centerOf(fromEl), b = centerOf(toEl);
  const node = document.createElement('div');
  node.style.cssText = 'position:absolute;left:0;top:0;will-change:transform';
  let w, h;
  if (html != null) {
    node.innerHTML = html;
    node.style.font = '700 28px/1 system-ui,sans-serif';
    L.appendChild(node);
    const r = node.getBoundingClientRect();
    w = r.width; h = r.height;
  } else {
    const clone = fromEl.cloneNode(true);
    clone.removeAttribute('id');
    clone.style.margin = '0';
    clone.style.width = a.r.width + 'px';
    clone.style.height = a.r.height + 'px';
    clone.style.boxSizing = 'border-box';
    node.appendChild(clone);
    L.appendChild(node);
    w = a.r.width; h = a.r.height;
  }
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  // control point: above the middle of the segment
  const cx = a.x + dx / 2, cy = Math.min(a.y, b.y) - dist * arc;
  const frames = [];
  const N = 24;
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const x = u * u * a.x + 2 * u * t * cx + t * t * b.x;
    const y = u * u * a.y + 2 * u * t * cy + t * t * b.y;
    const s = 1 + (scale - 1) * t + Math.sin(Math.PI * t) * 0.15;
    frames.push({ transform: `translate(${x - w / 2}px,${y - h / 2}px) scale(${s}) rotate(${rotate * t}deg)`, offset: t });
  }
  if (reduced()) ms = Math.min(ms, 200);
  const anim = node.animate(frames, { duration: ms, easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'forwards' });
  return anim.finished.catch(() => {}).then(() => L.remove());
}

// ---------------------------------------------------------------- screen transitions

export function screenTransition(oldEl, newEl, dir = 'left', { ms = 340, removeOld = true } = {}) {
  if (!newEl) return Promise.resolve();
  const parent = newEl.parentElement;
  if (parent && getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
  const fade = dir === 'fade' || reduced();
  const vec = { left: [1, 0], right: [-1, 0], up: [0, 1], down: [0, -1] }[dir] || [1, 0];
  const off = (k) => `translate(${vec[0] * k}%, ${vec[1] * k}%)`;
  const easing = 'cubic-bezier(.25,.8,.3,1)';
  const anims = [];
  if (oldEl && oldEl !== newEl) {
    const r = oldEl.getBoundingClientRect(), pr = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };
    Object.assign(oldEl.style, { position: 'absolute', left: r.left - pr.left + 'px', top: r.top - pr.top + 'px', width: r.width + 'px', height: r.height + 'px', pointerEvents: 'none', zIndex: 0 });
    anims.push(oldEl.animate(fade
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [{ transform: 'none', opacity: 1 }, { transform: off(-28), opacity: 0 }],
    { duration: ms, easing, fill: 'forwards' }).finished);
  }
  newEl.style.position = newEl.style.position || 'relative';
  newEl.style.zIndex = 1;
  anims.push(newEl.animate(fade
    ? [{ opacity: 0, transform: 'scale(.98)' }, { opacity: 1, transform: 'none' }]
    : [{ transform: off(100), opacity: 0.6 }, { transform: 'none', opacity: 1 }],
  { duration: ms, easing }).finished);
  return Promise.all(anims).catch(() => {}).then(() => {
    newEl.style.zIndex = '';
    if (oldEl && oldEl !== newEl && removeOld) oldEl.remove();
  });
}
