// 🎧 Слухай і вибирай — Лумі вимовляє англійське слово. Раунди 1–6: вибери переклад із 4 варіантів;
// раунди 7–10: вибери правильне написання з 4 схожих англійських слів. 3 ❤️, без таймера.
// Немає озвучки / звук вимкнено → підказка «Увімкни звук» і текстова підказка через 3 с. DOM + CSS (transform/opacity).
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
const speak = (x, rate = 0.9) => { try { A.speak?.(x, { lang: 'en-US', rate })?.catch?.(() => {}); } catch (e) { /* */ } };
const hap = (app, k = 'light') => { try { app.tg?.tap?.(k); } catch (e) { /* */ } };
const soundOff = () => { try { return !A.canSpeak || !A.canSpeak() || A.getSettings?.().sound === false; } catch (e) { return true; } };

const STR = {
  uk: {
    'mode.listen.title': 'Слухай і вибирай', 'mode.listen.r1': '🎧 Лумі вимовляє англійське слово. Слухай уважно!',
    'mode.listen.r2': '👆 Спершу вибери переклад, а в кінці — як це слово пишеться.',
    'mode.listen.r3': '❤️ У тебе {h} ❤️ і {n} слів. Можна слухати ще раз і повільно 🐢',
    'mode.listen.start': '▶ Грати', 'mode.listen.back': '‹ Назад', 'mode.listen.q_tr': 'Що сказав Лумі?',
    'mode.listen.q_sp': 'Як це пишеться?', 'mode.listen.again_s': '🔊 Ще раз', 'mode.listen.slow': '🐢 Повільно',
    'mode.listen.tap': 'Тапни, щоб послухати', 'mode.listen.nosound': '🔇 Увімкни звук, щоб чути Лумі',
    'mode.listen.hint': '💡 Підказка: {w}', 'mode.listen.right': '✅ {en} = {nat}', 'mode.listen.wrong': 'Це було: {en} = {nat}',
    'mode.listen.win': 'ПЕРЕМОГА!', 'mode.listen.lose': 'Спробуй ще раз!', 'mode.listen.again': '🔁 Ще раз',
    'mode.listen.next': '➡️ Далі', 'mode.listen.words': 'Слів: {a}/{b}', 'mode.listen.mist': 'Помилок: {a}',
    'mode.listen.none': 'Для цієї гри ще немає слів.',
  },
  ru: {
    'mode.listen.title': 'Слушай и выбирай', 'mode.listen.r1': '🎧 Луми произносит английское слово. Слушай внимательно!',
    'mode.listen.r2': '👆 Сначала выбери перевод, а в конце — как это слово пишется.',
    'mode.listen.r3': '❤️ У тебя {h} ❤️ и {n} слов. Можно слушать ещё раз и медленно 🐢',
    'mode.listen.start': '▶ Играть', 'mode.listen.back': '‹ Назад', 'mode.listen.q_tr': 'Что сказал Луми?',
    'mode.listen.q_sp': 'Как это пишется?', 'mode.listen.again_s': '🔊 Ещё раз', 'mode.listen.slow': '🐢 Медленно',
    'mode.listen.tap': 'Тапни, чтобы послушать', 'mode.listen.nosound': '🔇 Включи звук, чтобы слышать Луми',
    'mode.listen.hint': '💡 Подсказка: {w}', 'mode.listen.right': '✅ {en} = {nat}', 'mode.listen.wrong': 'Это было: {en} = {nat}',
    'mode.listen.win': 'ПОБЕДА!', 'mode.listen.lose': 'Попробуй ещё раз!', 'mode.listen.again': '🔁 Ещё раз',
    'mode.listen.next': '➡️ Дальше', 'mode.listen.words': 'Слов: {a}/{b}', 'mode.listen.mist': 'Ошибок: {a}',
    'mode.listen.none': 'Для этой игры пока нет слов.',
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
.ls{position:absolute;inset:0;display:flex;flex-direction:column;padding:calc(10px + env(safe-area-inset-top,0px)) 12px calc(12px + env(safe-area-inset-bottom,0px));gap:10px;overflow:hidden;
  background:linear-gradient(180deg,var(--w-bg1,#c9d6ff),var(--w-bg2,#ffe0f0));color:#3a2433;user-select:none;-webkit-user-select:none}
.ls-top{display:flex;align-items:center;gap:8px}
.ls-btn{min-width:44px;height:44px;border-radius:14px;border:2px solid rgba(58,36,51,.35);background:#fffaf0;font-family:inherit;font-weight:800;font-size:18px;color:#3a2433}
.ls-chip{padding:8px 12px;border-radius:999px;background:#fffaf0;border:2px solid rgba(58,36,51,.25);font-weight:800}
.ls-hearts i{font-style:normal;display:inline-block;transition:opacity .3s,transform .3s}.ls-hearts i.lost{opacity:.25;transform:scale(.8)}
.ls-bar{flex:1;height:12px;border-radius:999px;background:rgba(58,36,51,.14);overflow:hidden}
.ls-bar b{display:block;height:100%;width:100%;border-radius:999px;background:linear-gradient(90deg,#8f7bff,#ff8ac2);transform-origin:left;transform:scaleX(0);transition:transform .4s ease-out}
.ls-stage{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#fffaf0;border:3px solid #3a2433;border-radius:24px;
  box-shadow:0 5px 0 rgba(58,36,51,.25);padding:12px;position:relative}
.ls-label{font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.65;font-weight:800}
.ls-spk{position:relative;width:132px;height:132px;border-radius:50%;border:4px solid #3a2433;padding:0;background:radial-gradient(circle at 35% 30%,#fff,#d9d0ff 70%);
  box-shadow:0 6px 0 rgba(58,36,51,.3);-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform .12s}
.ls-spk:active{transform:scale(.94)}
.ls-spk img{position:absolute;inset:8px;width:calc(100% - 16px);height:calc(100% - 16px);object-fit:contain;border-radius:50%;pointer-events:none}
.ls-spk em{position:absolute;right:-8px;bottom:-6px;width:48px;height:48px;border-radius:50%;background:#ffd84a;border:3px solid #3a2433;display:grid;place-items:center;font-style:normal;font-size:24px}
.ls-spk::before,.ls-spk::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:4px solid #8f7bff;opacity:0;pointer-events:none}
.ls-spk.say::before{animation:ls-wave .9s ease-out}.ls-spk.say::after{animation:ls-wave .9s ease-out .25s}
.ls-spk.say img{animation:ls-bob .45s ease-in-out 2}
@keyframes ls-wave{from{transform:scale(1);opacity:.8}to{transform:scale(1.55);opacity:0}}
@keyframes ls-bob{50%{transform:translateY(-6px) scale(1.04)}}
.ls-ctl{display:flex;gap:8px}
.ls-pill{height:46px;padding:0 16px;border-radius:999px;border:2px solid rgba(58,36,51,.4);background:#fff;font-family:inherit;font-weight:800;font-size:15px;color:#3a2433;touch-action:manipulation;transition:transform .12s}
.ls-pill:active{transform:scale(.94)}
.ls-note{min-height:22px;font-weight:800;font-size:15px;text-align:center;transition:opacity .25s}
.ls-note.warn{color:#b3541e}.ls-note.good{color:#1f8a4c}.ls-note.bad{color:#c23a4b}
.ls-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ls-opt{text-align:center;min-height:68px;padding:8px 10px;border-radius:18px;border:3px solid #3a2433;background:#fff;font-family:inherit;font-weight:900;font-size:19px;line-height:1.15;color:#3a2433;
  box-shadow:0 4px 0 rgba(58,36,51,.28);touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .12s,opacity .25s;animation:ls-in .4s cubic-bezier(.3,1.5,.5,1) both;overflow-wrap:anywhere}
.ls-opt:active{transform:translateY(3px)}
.ls-opt.ok{background:#7be0a4}
.ls-opt.bad{background:#ff9aa5}
.ls-opt.dim{opacity:.45}
@keyframes ls-in{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes ls-ok{40%{transform:scale(1.08)}to{transform:scale(1)}}
@keyframes ls-bad{20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(5px)}}
.ls-ov{position:absolute;inset:0;display:grid;place-items:center;background:rgba(40,24,60,.45);padding:18px;z-index:5;animation:ls-fade .25s both}
@keyframes ls-fade{from{opacity:0}to{opacity:1}}
.ls-box{width:100%;max-width:360px;background:#fffaf0;border:3px solid #3a2433;border-radius:26px;padding:20px 18px;text-align:center;box-shadow:0 8px 0 rgba(58,36,51,.3)}
.ls-box h2{margin:4px 0 10px;font-size:26px}.ls-box p{margin:8px 0;padding:10px 12px;border-radius:14px;background:rgba(120,90,200,.1);text-align:left;font-size:15px;line-height:1.35}
.ls-ico{font-size:54px;line-height:1}.ls-stars{min-height:84px;display:flex;justify-content:center;align-items:flex-end;margin:4px 0}.ls-stars i{font-style:normal;opacity:.2;display:inline-block}.ls-stars i.on{opacity:1;animation:ls-in .5s cubic-bezier(.3,1.6,.5,1) both}
.ls-go{display:block;width:100%;height:52px;margin-top:10px;border-radius:16px;border:3px solid #3a2433;background:linear-gradient(#ffe08a,#f7b733);font-family:inherit;font-weight:900;font-size:18px;color:#3a2433;box-shadow:0 4px 0 rgba(58,36,51,.3)}
.ls-go.sec{background:#fff;box-shadow:none;border-width:2px;font-weight:800}
@media (max-height:620px){.ls-spk{width:104px;height:104px}.ls-opt{min-height:58px;font-size:17px}}
@media (prefers-reduced-motion:reduce){.ls-spk::before,.ls-spk::after,.ls-spk img,.ls-opt{animation:none!important}}
`;
function ensureCss() {
  if (document.getElementById('ls-style')) return;
  const st = document.createElement('style'); st.id = 'ls-style'; st.textContent = CSS; document.head.appendChild(st);
}

const HEARTS = 3, ROUNDS = 10, TR_ROUNDS = 6;
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [b[i], b[j]] = [b[j], b[i]]; } return b; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const low = (s) => String(s).trim().toLowerCase();

function pairsOf(app, wid) {
  let list = [];
  try { list = I.tw?.(wid) || []; } catch (e) { /* */ }
  if (!list.length) list = (app.content.WORDS && app.content.WORDS[wid]) || [];
  const seen = new Set();
  return list.filter((p) => Array.isArray(p) && p[0] && p[1] && !seen.has(low(p[1])) && seen.add(low(p[1])));
}
// відстань Левенштейна — щоб знайти «схожі» слова для раундів на написання
function dist(a, b) {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

export const meta = { topbar: false };

const numT = (key, a, v = {}) => esc(T(key, { ...v, a: '\u0001' })).replace('\u0001', `<b data-n="${a}">${a}</b>`);

export function render(root, params, app) {
  ensureCss();
  const wid = (params && params.wid) || 'w1';
  const st = app.state;
  const gameId = (params && params.id) || `${wid}-listen`;
  let alive = true;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); return t; };

  const scr = document.createElement('div');
  scr.className = 'ls';
  root.appendChild(scr);
  let unTheme = null;
  try { unTheme = TH.applyWorldTheme?.(scr, wid, { decor: false }) || null; } catch (e) { /* */ }

  let pool = pairsOf(app, wid);
  let wide = pool.slice(); // ширший набір для хибних варіантів
  for (const w of Object.keys(app.content.WORDS || {})) if (w !== wid) wide = wide.concat(pairsOf(app, w));
  if (pool.length < 4) pool = wide.slice();
  let g = null;
  let hintT = 0;

  function intro() {
    const ok = pool.length >= 4;
    const ov = document.createElement('div'); ov.className = 'ls-ov';
    ov.innerHTML = `<div class="ls-box"><div class="ls-ico">🎧</div><h2>${esc(T('mode.listen.title'))}</h2>
      ${ok ? `<p>${esc(T('mode.listen.r1'))}</p><p>${esc(T('mode.listen.r2'))}</p><p>${esc(T('mode.listen.r3', { h: HEARTS, n: ROUNDS }))}</p>
      <button class="ls-go" data-a="go" data-sfx="open">${esc(T('mode.listen.start'))}</button>` : `<p>${esc(T('mode.listen.none'))}</p>`}
      <button class="ls-go sec" data-a="back" data-sfx="back">${esc(T('mode.listen.back'))}</button></div>`;
    scr.appendChild(ov);
    JX.intro(ov.firstElementChild, ov.querySelector('.ls-ico'));
    ov.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'go') { ov.remove(); start(); } else if (a === 'back') app.back();
    });
  }

  function start() {
    let words = shuffle(pool).slice(0, ROUNDS);
    while (words.length < ROUNDS) words = words.concat(shuffle(pool).slice(0, ROUNDS - words.length));
    g = { words, wi: 0, hearts: HEARTS, ok: 0, bad: 0, busy: false };
    scr.querySelectorAll('.ls-top,.ls-stage,.ls-opts').forEach((n) => n.remove());
    let lumi = 'assets/lumi/happy.png';
    try { lumi = app.asset?.('lumi/happy.png') || lumi; } catch (e) { /* */ }
    scr.insertAdjacentHTML('beforeend', `
      <div class="ls-top"><button class="ls-btn" data-a="back" data-sfx="back" aria-label="back">‹</button>
        <span class="ls-chip ls-hearts"></span><div class="ls-bar"><b></b></div><span class="ls-chip ls-prog"></span></div>
      <div class="ls-stage"><div class="ls-label"></div>
        <button class="ls-spk" data-a="say" data-sfx="none" aria-label="${esc(T('mode.listen.again_s'))}"><img src="${esc(lumi)}" alt="" draggable="false"><em>🔊</em></button>
        <div class="ls-ctl"><button class="ls-pill" data-a="say" data-sfx="none">${esc(T('mode.listen.again_s'))}</button>
          <button class="ls-pill" data-a="slow" data-sfx="none">${esc(T('mode.listen.slow'))}</button></div>
        <div class="ls-note"></div></div>
      <div class="ls-opts"></div>`);
    $('.ls-spk img').addEventListener('error', (e) => { e.target.style.visibility = 'hidden'; }, { once: true });
    hearts(); question();
  }
  const $ = (q) => scr.querySelector(q);
  function hearts() { $('.ls-hearts').innerHTML = Array.from({ length: HEARTS }, (_, i) => `<i class="${i < g.hearts ? '' : 'lost'}">❤️</i>`).join(''); }
  function note(text, cls = '') { const n = $('.ls-note'); if (n) { n.className = `ls-note ${cls}`; n.textContent = text; } }

  function say(rate) {
    if (!g) return;
    const b = $('.ls-spk');
    if (b) { b.classList.remove('say'); void b.offsetWidth; b.classList.add('say'); }
    speak(g.en, rate);
    if (soundOff() && !g.busy) armHint();
  }
  function armHint() {
    clearTimeout(hintT); timers.delete(hintT);
    if (!g.hinted) note(T('mode.listen.nosound'), 'warn');
    const en = g.en;
    hintT = later(() => {
      if (!g || g.busy || g.en !== en) return;
      g.hinted = true;
      // у раундах на переклад підказуємо англійське слово, у раундах на написання — переклад
      note(T('mode.listen.hint', { w: g.mode === 'tr' ? g.en : g.nat }), 'warn');
    }, 3000);
  }

  function question() {
    const [nat, en] = g.words[g.wi];
    g.nat = nat; g.en = en; g.busy = false; g.hinted = false;
    g.mode = g.wi < TR_ROUNDS ? 'tr' : 'sp';
    $('.ls-prog').textContent = `🎧 ${g.wi + 1}/${ROUNDS}`;
    $('.ls-bar b').style.transform = `scaleX(${g.wi / ROUNDS})`;
    $('.ls-label').textContent = T(g.mode === 'tr' ? 'mode.listen.q_tr' : 'mode.listen.q_sp');
    note(T('mode.listen.tap'));
    let opts;
    if (g.mode === 'tr') {
      const used = new Set([low(nat)]);
      const wrong = [];
      for (const p of shuffle(pool).concat(shuffle(wide))) {
        if (wrong.length >= 3) break;
        if (low(p[1]) === low(en) || used.has(low(p[0]))) continue;
        used.add(low(p[0])); wrong.push(p[0]);
      }
      opts = [nat, ...wrong];
    } else {
      const t = low(en);
      const used = new Set([t]);
      const cand = [];
      for (const p of wide) { const k = low(p[1]); if (!used.has(k)) { used.add(k); cand.push([p[1], dist(t, k) - (k[0] === t[0] ? 1.5 : 0) + Math.random() * 0.5]); } }
      cand.sort((a, b) => a[1] - b[1]);
      opts = [en, ...cand.slice(0, 3).map((c) => c[0])];
    }
    g.answer = g.mode === 'tr' ? nat : en;
    const box = $('.ls-opts');
    box.innerHTML = shuffle(opts).map((o, i) => `<button class="ls-opt" data-o="${esc(o)}" data-sfx="none" style="animation-delay:${i * 60}ms">${esc(o)}</button>`).join('');
    later(() => say(), 350);
  }

  function pick(b) {
    if (!g || g.busy) return;
    g.busy = true;
    clearTimeout(hintT);
    const good = b.dataset.o === g.answer;
    scr.querySelectorAll('.ls-opt').forEach((n) => {
      n.style.animationDelay = '0ms';
      if (n.dataset.o === g.answer) n.classList.add('ok'); else if (n === b) n.classList.add('bad'); else n.classList.add('dim');
    });
    if (good) {
      g.ok += 1;
      try { S.onCorrectAnswer(st); S.addXP(st, 10); } catch (e) { /* */ }
      sfx('correct'); hap(app, 'success');
      note(T('mode.listen.right', { en: g.en, nat: g.nat }), 'good');
      JX.ok(b, 8); JX.xp($('.ls-spk'), 10); JX.emote($('.ls-spk img'), 'joy');
    } else {
      g.bad += 1; if (!S.calm?.()) g.hearts -= 1; hearts();   // v22 🐢
      try { S.noteMiss(st, wid, g.en, '', 'listening'); } catch (e) { /* */ }
      sfx('wrong'); hap(app, 'error'); JX.bad(b); JX.emote($('.ls-spk img'), 'sad');
      note(T('mode.listen.wrong', { en: g.en, nat: g.nat }), 'bad');
      later(() => speak(g.en, 0.8), 500);
    }
    $('.ls-bar b').style.transform = `scaleX(${(g.wi + 1) / ROUNDS})`;
    if (g.hearts <= 0) { later(() => finish(false), 1500); return; }
    later(() => { if (g.wi + 1 >= ROUNDS) finish(true); else { g.wi += 1; question(); } }, good ? 1200 : 2200);
  }

  function finish(win) {
    const total = g.ok + g.bad;
    const stars = win ? Math.max(1, starsByRatio(total ? g.ok / total : 1)) : 0;
    try { recordGame(st, gameId, stars); app.save?.(); } catch (e) { /* */ }
    sfx(win ? 'win' : 'lose');
    const ov = document.createElement('div'); ov.className = 'ls-ov';
    ov.innerHTML = `<div class="ls-box"><div class="ls-ico">${win ? '🏆' : '💔'}</div><h2>${esc(T(win ? 'mode.listen.win' : 'mode.listen.lose'))}</h2>
      <div class="ls-stars"></div>
      <p>${numT('mode.listen.words', g.ok, { b: ROUNDS })} · ${numT('mode.listen.mist', g.bad)}</p>
      <button class="ls-go" data-a="${win ? 'back' : 'again'}" data-sfx="open">${esc(T(win ? 'mode.listen.next' : 'mode.listen.again'))}</button>
      <button class="ls-go sec" data-a="${win ? 'again' : 'back'}">${esc(T(win ? 'mode.listen.again' : 'mode.listen.back'))}</button></div>`;
    scr.appendChild(ov);
    JX.result(ov.firstElementChild, ov.querySelector('.ls-stars'), stars, { later, sfx });
    JX.intro(null, ov.querySelector('.ls-ico'));
    ov.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'again') { ov.remove(); start(); } else if (a === 'back') app.back();
    });
  }

  function onClick(e) {
    const b = e.target.closest('.ls-opt');
    if (b && scr.contains(b)) { pick(b); return; }
    const a = e.target.closest('.ls-top [data-a], .ls-stage [data-a]')?.dataset.a;
    if (a === 'back') app.back(); else if (a === 'say') say(0.9); else if (a === 'slow') say(0.6);
  }
  scr.addEventListener('click', onClick);
  JX.css();
  const unPress = JX.press(scr);
  intro();

  return () => {
    alive = false;
    timers.forEach(clearTimeout); timers.clear();
    try { window.speechSynthesis?.cancel?.(); } catch (e) { /* */ }
    scr.removeEventListener('click', onClick);
    unPress();
    try { if (typeof unTheme === 'function') unTheme(); } catch (e) { /* */ }
    scr.remove();
  };
}
