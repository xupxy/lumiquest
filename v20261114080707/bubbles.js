// 🫧 Бульбашки-Літери — показано слово поточною мовою; на полі плавають бульбашки з літерами.
// Тапай літери англійського слова ПО ПОРЯДКУ. Правильна — бульбашка лускає, літера стає у слово;
// хибна — бульбашка трясеться, −❤️. Лише тапи, без свайпів і таймера. DOM + CSS (transform/opacity).
import * as S from './state.js?v=20261114080653';
import * as FX from './fx.js?v=20261114080653';
import { recordGame, starsByRatio } from './games.js?v=20261114080653';
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
    l.href = new URL('./games3.css?v=20261114080653', import.meta.url).href;
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

let I = {};
try { I = await import('./i18n.js?v=20261114080653'); } catch (e) { /* */ }
let A = {};
import('./audio.js?v=20261114080653').then((m) => { A = m; }).catch(() => { /* */ });
let TH = {};
try { TH = await import('./theme.js?v=20261114080653'); } catch (e) { /* */ }

const sfx = (n) => { try { A.sfx?.(n); } catch (e) { /* */ } };
const speak = (x) => { try { A.speak?.(x); } catch (e) { /* */ } };
const hap = (app, k = 'light') => { try { app.tg?.tap?.(k); } catch (e) { /* */ } };

const STR = {
  uk: {
    'mode.bubbles.title': 'Бульбашки-Літери', 'mode.bubbles.r1': '🫧 Угорі — слово. Склади його англійською!',
    'mode.bubbles.r2': '👆 Тапай бульбашки з літерами по порядку — від першої до останньої.',
    'mode.bubbles.r3': '❤️ Не та літера — мінус серце. У тебе {h} ❤️ і {n} слів. Часу — скільки завгодно!',
    'mode.bubbles.start': '▶ Грати', 'mode.bubbles.back': '‹ Назад', 'mode.bubbles.label': 'Склади англійською',
    'mode.bubbles.hint': '💡 Підказка', 'mode.bubbles.win': 'ПЕРЕМОГА!', 'mode.bubbles.lose': 'Спробуй ще раз!',
    'mode.bubbles.again': '🔁 Ще раз', 'mode.bubbles.next': '➡️ Далі', 'mode.bubbles.words': 'Слів: {a}/{b}',
    'mode.bubbles.mist': 'Помилок: {a}', 'mode.bubbles.none': 'Для цієї гри ще немає слів.',
  },
  ru: {
    'mode.bubbles.title': 'Пузырьки-Буквы', 'mode.bubbles.r1': '🫧 Вверху — слово. Собери его по-английски!',
    'mode.bubbles.r2': '👆 Тапай пузырьки с буквами по порядку — от первой до последней.',
    'mode.bubbles.r3': '❤️ Не та буква — минус сердце. У тебя {h} ❤️ и {n} слов. Времени — сколько угодно!',
    'mode.bubbles.start': '▶ Играть', 'mode.bubbles.back': '‹ Назад', 'mode.bubbles.label': 'Собери по-английски',
    'mode.bubbles.hint': '💡 Подсказка', 'mode.bubbles.win': 'ПОБЕДА!', 'mode.bubbles.lose': 'Попробуй ещё раз!',
    'mode.bubbles.again': '🔁 Ещё раз', 'mode.bubbles.next': '➡️ Дальше', 'mode.bubbles.words': 'Слов: {a}/{b}',
    'mode.bubbles.mist': 'Ошибок: {a}', 'mode.bubbles.none': 'Для этой игры пока нет слов.',
  },
};
try { I.addStrings?.(STR); } catch (e) { /* */ }
const T = (k, v) => {
  let s;
  try { s = I.t?.(k, v); } catch (e) { /* */ }
  if (!s || s === k) { s = (STR[(I.lang?.() === 'ru') ? 'ru' : 'uk'][k]) || k; if (v) for (const [a, b] of Object.entries(v)) s = s.replaceAll(`{${a}}`, b); }
  return s;
};

const CSS = `
.bb{position:absolute;inset:0;display:flex;flex-direction:column;padding:calc(10px + env(safe-area-inset-top,0px)) 12px calc(12px + env(safe-area-inset-bottom,0px));gap:10px;overflow:hidden;
  background:linear-gradient(180deg,var(--w-bg1,#bfe6ff),var(--w-bg2,#e9d8ff));color:#3a2433;user-select:none;-webkit-user-select:none}
.bb-top{display:flex;align-items:center;gap:8px}
.bb-btn{min-width:44px;height:44px;border-radius:14px;border:2px solid rgba(58,36,51,.35);background:#fffaf0;font-family:inherit;font-weight:800;font-size:18px;color:#3a2433}
.bb-chip{padding:8px 12px;border-radius:999px;background:#fffaf0;border:2px solid rgba(58,36,51,.25);font-weight:800}
.bb-hearts i{font-style:normal;transition:opacity .3s,transform .3s}.bb-hearts i.lost{opacity:.25;transform:scale(.8)}
.bb-card{background:#fffaf0;border:3px solid #3a2433;border-radius:22px;padding:10px 12px 12px;text-align:center;box-shadow:0 5px 0 rgba(58,36,51,.25)}
.bb-label{font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.6;font-weight:800}
.bb-word{font-size:26px;font-weight:900;margin:2px 0 8px}
.bb-slots{display:flex;justify-content:center;gap:5px;flex-wrap:wrap}
.bb-slot{width:34px;height:40px;border-radius:10px;background:rgba(58,36,51,.1);display:grid;place-items:center;font-family:inherit;font-weight:900;font-size:22px;text-transform:uppercase;transition:transform .25s,background .25s}
.bb-slot.next{outline:3px solid #f7b733}.bb-slot.on{background:#7be0a4;transform:scale(1.06)}
.bb-field{position:relative;flex:1;min-height:0;border-radius:24px;background:rgba(255,255,255,.35);border:3px solid rgba(58,36,51,.25);overflow:hidden}
.bb-b{position:absolute;width:84px;height:84px;margin:-42px 0 0 -42px;border:0;padding:0;background:none;-webkit-tap-highlight-color:transparent;animation:bb-float 4s ease-in-out infinite;touch-action:manipulation}
.bb-b span{position:absolute;inset:0;border-radius:50%;display:grid;place-items:center;font-family:inherit;font-weight:900;font-size:38px;text-transform:uppercase;color:#3a2433;
  background:radial-gradient(circle at 32% 28%,#fff 0 12%,rgba(255,255,255,.75) 13% 30%,var(--bc,#bfe9ff) 75%);border:3px solid rgba(58,36,51,.55);
  box-shadow:inset -6px -8px 0 rgba(58,36,51,.08);transition:transform .15s}
.bb-b:active span{transform:scale(.9)}
.bb-b.in span{animation:bb-in .45s cubic-bezier(.3,1.5,.5,1) both}
.bb-b.pop span{animation:bb-pop .32s ease-out forwards}
.bb-b.bad span{animation:bb-bad .4s ease-in-out;background:radial-gradient(circle at 32% 28%,#fff 0 12%,#ffd5d9 30%,#ff9aa5 75%)}
.bb-b.glow span{box-shadow:0 0 0 6px rgba(247,183,51,.75),inset -6px -8px 0 rgba(58,36,51,.08)}
@keyframes bb-float{0%,100%{transform:translate(0,0)}25%{transform:translate(5px,-9px)}50%{transform:translate(-4px,-14px)}75%{transform:translate(-6px,-5px)}}
@keyframes bb-in{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes bb-pop{40%{transform:scale(1.25);opacity:1}to{transform:scale(1.6);opacity:0}}
@keyframes bb-bad{20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(5px)}}
.bb-bot{display:flex;justify-content:center}
.bb-hint{height:48px;padding:0 22px;border-radius:16px;border:2px solid rgba(58,36,51,.35);background:#fffaf0;font-family:inherit;font-weight:800;font-size:16px;color:#3a2433}
.bb-ov{position:absolute;inset:0;display:grid;place-items:center;background:rgba(40,24,60,.45);padding:18px;z-index:5;animation:bb-fade .25s both}
@keyframes bb-fade{from{opacity:0}to{opacity:1}}
.bb-box{width:100%;max-width:360px;background:#fffaf0;border:3px solid #3a2433;border-radius:26px;padding:20px 18px;text-align:center;box-shadow:0 8px 0 rgba(58,36,51,.3)}
.bb-box h2{margin:4px 0 10px;font-size:26px}.bb-box p{margin:8px 0;padding:10px 12px;border-radius:14px;background:rgba(120,90,200,.1);text-align:left;font-size:15px;line-height:1.35}
.bb-ico{font-size:54px;line-height:1}.bb-stars{min-height:84px;display:flex;justify-content:center;align-items:flex-end;margin:4px 0}.bb-stars i{font-style:normal;opacity:.2;display:inline-block}.bb-stars i.on{opacity:1;animation:bb-in .5s cubic-bezier(.3,1.6,.5,1) both}
.bb-go{display:block;width:100%;height:52px;margin-top:10px;border-radius:16px;border:3px solid #3a2433;background:linear-gradient(#ffe08a,#f7b733);font-family:inherit;font-weight:900;font-size:18px;color:#3a2433;box-shadow:0 4px 0 rgba(58,36,51,.3)}
.bb-go.sec{background:#fff;box-shadow:none;border-width:2px;font-weight:800}
@media (prefers-reduced-motion:reduce){.bb-b,.bb-b span{animation:none!important}}
html.lq-hidden .bb-b{animation-play-state:paused}
`;
function ensureCss() {
  if (document.getElementById('bb-style')) return;
  const st = document.createElement('style'); st.id = 'bb-style'; st.textContent = CSS; document.head.appendChild(st);
}

const HEARTS = 4, WORDS_N = 6;
const COLORS = ['#bfe9ff', '#ffd9ec', '#d9ffd0', '#fff0b8', '#e2d6ff', '#ffdcc2'];
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [b[i], b[j]] = [b[j], b[i]]; } return b; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function pairsOf(app, wid) {
  let list = [];
  try { list = I.tw?.(wid) || []; } catch (e) { /* */ }
  if (!list.length) list = (app.content.WORDS && app.content.WORDS[wid]) || [];
  return list.filter((p) => /^[a-z]{3,8}$/i.test(p[1]));
}

export const meta = { topbar: false };

const numT = (key, a, v = {}) => esc(T(key, { ...v, a: '\u0001' })).replace('\u0001', `<b data-n="${a}">${a}</b>`);

export function render(root, params, app) {
  ensureCss();
  const wid = (params && params.wid) || 'w1';
  const st = app.state;
  const gameId = (params && params.id) || `${wid}-bubbles`;
  let alive = true;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); };

  const scr = document.createElement('div');
  scr.className = 'bb';
  root.appendChild(scr);
  let unTheme = null;
  try { unTheme = TH.applyWorldTheme?.(scr, wid, { decor: false }) || null; } catch (e) { /* */ }

  let pool = pairsOf(app, wid);
  if (pool.length < 3) for (const w of (st.unlocked || [])) if (w !== wid) pool = pool.concat(pairsOf(app, w));
  let g = null;

  function intro() {
    const ov = document.createElement('div'); ov.className = 'bb-ov';
    ov.innerHTML = `<div class="bb-box"><div class="bb-ico">🫧</div><h2>${esc(T('mode.bubbles.title'))}</h2>
      ${pool.length ? `<p>${esc(T('mode.bubbles.r1'))}</p><p>${esc(T('mode.bubbles.r2'))}</p><p>${esc(T('mode.bubbles.r3', { h: HEARTS, n: Math.min(WORDS_N, pool.length) }))}</p>
      <button class="bb-go" data-a="go" data-sfx="open">${esc(T('mode.bubbles.start'))}</button>` : `<p>${esc(T('mode.bubbles.none'))}</p>`}
      <button class="bb-go sec" data-a="back" data-sfx="back">${esc(T('mode.bubbles.back'))}</button></div>`;
    scr.appendChild(ov);
    JX.intro(ov.firstElementChild, ov.querySelector('.bb-ico'));
    ov.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'go') { ov.remove(); start(); } else if (a === 'back') app.back();
    });
  }

  function start() {
    g = { words: shuffle(pool).slice(0, WORDS_N), wi: 0, pos: 0, hearts: HEARTS, ok: 0, bad: 0, done: 0, busy: false };
    scr.querySelectorAll('.bb-top,.bb-card,.bb-field,.bb-bot').forEach((n) => n.remove());
    scr.insertAdjacentHTML('beforeend', `
      <div class="bb-top"><button class="bb-btn" data-a="back" data-sfx="back" aria-label="back">‹</button>
        <span class="bb-chip bb-hearts"></span><span class="bb-chip bb-prog"></span></div>
      <div class="bb-card"><div class="bb-label">${esc(T('mode.bubbles.label'))}</div><div class="bb-word"></div><div class="bb-slots"></div></div>
      <div class="bb-field"></div>
      <div class="bb-bot"><button class="bb-hint" data-a="hint" data-sfx="none">${esc(T('mode.bubbles.hint'))}</button></div>`);
    hearts(); word();
  }
  const $ = (q) => scr.querySelector(q);
  function hearts() { $('.bb-hearts').innerHTML = Array.from({ length: HEARTS }, (_, i) => `<i class="${i < g.hearts ? '' : 'lost'}">❤️</i>`).join(''); }

  function word() {
    const [nat, en] = g.words[g.wi];
    g.en = en.toLowerCase(); g.pos = 0; g.busy = false;
    $('.bb-prog').textContent = `🫧 ${g.wi + 1}/${g.words.length}`;
    $('.bb-word').textContent = nat;
    $('.bb-slots').innerHTML = [...g.en].map((_, i) => `<span class="bb-slot${i === 0 ? ' next' : ''}"></span>`).join('');
    // літери слова + 2–3 зайві, розкладені по сітці без накладань
    const abc = 'abcdefghiklmnoprstuwy';
    const extra = [];
    while (extra.length < Math.min(3, 12 - g.en.length)) { const c = abc[(Math.random() * abc.length) | 0]; if (!g.en.includes(c) && !extra.includes(c)) extra.push(c); }
    const letters = shuffle([...g.en, ...extra]);
    const field = $('.bb-field');
    field.innerHTML = '';
    const cols = letters.length > 9 ? 4 : 3, rows = Math.ceil(letters.length / cols);
    const cells = shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, letters.length);
    letters.forEach((ch, k) => {
      const c = cells[k], cx = c % cols, cy = (c / cols) | 0;
      const b = document.createElement('button');
      b.className = 'bb-b in'; b.dataset.ch = ch; b.dataset.sfx = 'none';
      b.style.left = `${((cx + 0.5) / cols) * 100 + (Math.random() * 6 - 3)}%`;
      b.style.top = `${((cy + 0.5) / rows) * 100 + (Math.random() * 6 - 3)}%`;
      b.style.animationDelay = `${-(Math.random() * 4).toFixed(2)}s`;
      b.style.animationDuration = `${(3.4 + Math.random() * 1.6).toFixed(2)}s`;
      b.innerHTML = `<span style="--bc:${COLORS[k % COLORS.length]};animation-delay:${k * 45}ms">${esc(ch)}</span>`;
      field.appendChild(b);
    });
  }

  function tap(b) {
    if (!g || g.busy || b.classList.contains('pop')) return;
    const ch = b.dataset.ch;
    if (ch === g.en[g.pos]) {
      g.ok += 1;
      const slot = $('.bb-slots').children[g.pos];
      slot.textContent = ch; slot.classList.remove('next'); slot.classList.add('on');
      g.pos += 1;
      $('.bb-slots').children[g.pos]?.classList.add('next');
      scr.querySelectorAll('.bb-b.glow').forEach((n) => n.classList.remove('glow'));
      b.classList.remove('in'); b.classList.add('pop');
      sfx('pop'); hap(app, 'light');
      try { FX.sparkle?.(b, { count: 6 }); } catch (e) { /* */ }
      try { const r0 = b.getBoundingClientRect(), r1 = slot.getBoundingClientRect(); slot.animate([{ transform: `translate(${r0.left - r1.left}px,${r0.top - r1.top}px) scale(1.3)` }, { transform: 'translateY(-4px) scale(1.12)', offset: 0.75 }, { transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.3,1)' }); } catch (e) { /* */ }
      later(() => b.remove(), 330);
      if (g.pos >= g.en.length) wordDone();
    } else {
      g.bad += 1; if (!S.calm?.()) g.hearts -= 1; hearts();   // v22 🐢
      try { S.noteMiss(st, wid, g.en); } catch (e) { /* */ }
      b.classList.remove('in', 'bad'); void b.offsetWidth; b.classList.add('bad');
      sfx('wrong'); hap(app, 'error'); JX.bad($('.bb-slots'));
      if (g.hearts <= 0) { g.busy = true; later(() => finish(false), 700); }
    }
  }
  function wordDone() {
    g.busy = true; g.done += 1;
    try { S.onCorrectAnswer(st); S.addXP(st, 10); } catch (e) { /* */ }
    sfx('correct'); hap(app, 'success');
    JX.ok($('.bb-slots'), 10); JX.xp($('.bb-card'), 10);
    later(() => speak(g.en), 250);
    scr.querySelectorAll('.bb-b').forEach((n) => { n.classList.remove('in'); n.classList.add('pop'); });
    later(() => { if (g.wi + 1 >= g.words.length) finish(true); else { g.wi += 1; word(); } }, 1300);
  }
  function hint() {
    if (!g || g.busy) return;
    const b = [...scr.querySelectorAll('.bb-b:not(.pop)')].find((n) => n.dataset.ch === g.en[g.pos]);
    if (b) { b.classList.add('glow'); sfx('sparkle'); }
  }

  function finish(win) {
    const total = g.ok + g.bad;
    const stars = win ? Math.max(1, starsByRatio(total ? g.ok / total : 1)) : 0;
    try { recordGame(st, gameId, stars); app.save?.(); } catch (e) { /* */ }
    sfx(win ? 'win' : 'lose');
    const ov = document.createElement('div'); ov.className = 'bb-ov';
    ov.innerHTML = `<div class="bb-box"><div class="bb-ico">${win ? '🏆' : '💔'}</div><h2>${esc(T(win ? 'mode.bubbles.win' : 'mode.bubbles.lose'))}</h2>
      <div class="bb-stars"></div>
      <p>${numT('mode.bubbles.words', g.done, { b: g.words.length })} · ${numT('mode.bubbles.mist', g.bad)}</p>
      <button class="bb-go" data-a="${win ? 'back' : 'again'}" data-sfx="open">${esc(T(win ? 'mode.bubbles.next' : 'mode.bubbles.again'))}</button>
      <button class="bb-go sec" data-a="${win ? 'again' : 'back'}">${esc(T(win ? 'mode.bubbles.again' : 'mode.bubbles.back'))}</button></div>`;
    scr.appendChild(ov);
    JX.result(ov.firstElementChild, ov.querySelector('.bb-stars'), stars, { later, sfx });
    JX.intro(null, ov.querySelector('.bb-ico'));
    ov.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'again') { ov.remove(); start(); } else if (a === 'back') app.back();
    });
  }

  function onClick(e) {
    const b = e.target.closest('.bb-b');
    if (b && scr.contains(b)) { tap(b); return; }
    const a = e.target.closest('.bb-top [data-a], .bb-bot [data-a]')?.dataset.a;
    if (a === 'back') app.back(); else if (a === 'hint') hint();
  }
  scr.addEventListener('click', onClick);
  JX.css();
  const unPress = JX.press(scr);
  intro();

  return () => {
    alive = false;
    timers.forEach(clearTimeout); timers.clear();
    scr.removeEventListener('click', onClick);
    unPress();
    try { if (typeof unTheme === 'function') unTheme(); } catch (e) { /* */ }
    scr.remove();
  };
}
