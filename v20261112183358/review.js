// 🔁 Робота над помилками — спокійний режим: 10 питань без ❤️ і таймера. Спершу слова з S.missList(wid),
// решта — випадкові слова світу. Типи чергуються: переклад → 4 англ. варіанти; англ. (з 🔊) → 4 варіанти
// поточною мовою; набрати слово з літер. Хибне — показуємо правильне і повторюємо слово наприкінці (1 раз).
// Правильна відповідь зменшує лічильник помилок (S.clearMiss). Зірки — за першими спробами. DOM + CSS.
import * as S from './state.js?v=20261112183346';
import * as FX from './fx.js?v=20261112183346';
import { recordGame, starsByRatio } from './games.js?v=20261112183346';
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
    l.href = new URL('./games3.css?v=20261112183346', import.meta.url).href;
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
try { I = await import('./i18n.js?v=20261112183346'); } catch (e) { /* */ }
let A = {};
import('./audio.js?v=20261112183346').then((m) => { A = m; }).catch(() => { /* */ });
let TH = {};
try { TH = await import('./theme.js?v=20261112183346'); } catch (e) { /* */ }

const sfx = (n) => { try { A.sfx?.(n); } catch (e) { /* */ } };
const speak = (x, rate = 0.9) => { try { A.speak?.(x, { lang: 'en-US', rate })?.catch?.(() => {}); } catch (e) { /* */ } };
const hap = (app, k = 'light') => { try { app.tg?.tap?.(k); } catch (e) { /* */ } };

const STR = {
  uk: {
    'mode.review.title': 'Робота над помилками', 'mode.review.r1': '🔁 Повторимо слова, у яких були помилки.',
    'mode.review.r2': '🌿 Спокійний режим: без сердець і без таймера. Думай скільки хочеш!',
    'mode.review.r3': '💡 Помилився — побачиш правильну відповідь, а слово повернеться наприкінці.',
    'mode.review.have': '📝 Слів із помилками: {n}', 'mode.review.clean': '🌟 Помилок немає, просто повторимо слова!',
    'mode.review.start': '▶ Почати', 'mode.review.back': '‹ Назад',
    'mode.review.q_en': 'Як це англійською?', 'mode.review.q_nat': 'Що означає це слово?', 'mode.review.q_build': 'Склади слово з літер',
    'mode.review.rep': '🔁 Повторення', 'mode.review.right': '✅ {en} = {nat}', 'mode.review.wrong': 'Правильно: {en} = {nat}',
    'mode.review.win': 'МОЛОДЕЦЬ!', 'mode.review.again': '🔁 Ще раз', 'mode.review.next': '➡️ Далі',
    'mode.review.first': 'З першої спроби: {a}/{b}', 'mode.review.fixed': 'Виправлено помилок: {a}', 'mode.review.left': 'Ще повторити: {a}',
    'mode.review.none': 'Для цієї гри ще немає слів.',
  },
  ru: {
    'mode.review.title': 'Работа над ошибками', 'mode.review.r1': '🔁 Повторим слова, в которых были ошибки.',
    'mode.review.r2': '🌿 Спокойный режим: без сердец и без таймера. Думай сколько хочешь!',
    'mode.review.r3': '💡 Ошибся — увидишь правильный ответ, а слово вернётся в конце.',
    'mode.review.have': '📝 Слов с ошибками: {n}', 'mode.review.clean': '🌟 Ошибок нет, просто повторим слова!',
    'mode.review.start': '▶ Начать', 'mode.review.back': '‹ Назад',
    'mode.review.q_en': 'Как это по-английски?', 'mode.review.q_nat': 'Что значит это слово?', 'mode.review.q_build': 'Собери слово из букв',
    'mode.review.rep': '🔁 Повторение', 'mode.review.right': '✅ {en} = {nat}', 'mode.review.wrong': 'Правильно: {en} = {nat}',
    'mode.review.win': 'МОЛОДЕЦ!', 'mode.review.again': '🔁 Ещё раз', 'mode.review.next': '➡️ Дальше',
    'mode.review.first': 'С первой попытки: {a}/{b}', 'mode.review.fixed': 'Исправлено ошибок: {a}', 'mode.review.left': 'Ещё повторить: {a}',
    'mode.review.none': 'Для этой игры пока нет слов.',
  },
  // v22: «на ви» (решта рядків — автоматично в i18n.t)
  uk_vy: { 'mode.review.r3': '💡 Помилилися — побачите правильну відповідь, а слово повернеться наприкінці.' },
  ru_vy: { 'mode.review.r3': '💡 Ошиблись — увидите правильный ответ, а слово вернётся в конце.' },
};
try { I.addStrings?.(STR); } catch (e) { /* */ }
const T = (k, v) => {
  let s;
  try { s = I.t?.(k, v); } catch (e) { /* */ }
  if (!s || s === k) { s = (STR[(I.lang?.() === 'ru') ? 'ru' : 'uk'][k]) || k; if (v) for (const [a, b] of Object.entries(v)) s = s.replaceAll(`{${a}}`, b); }
  return s;
};

const CSS = `
.rv{position:absolute;inset:0;display:flex;flex-direction:column;padding:calc(10px + env(safe-area-inset-top,0px)) 12px calc(12px + env(safe-area-inset-bottom,0px));gap:10px;overflow:hidden;
  background:linear-gradient(180deg,var(--w-bg1,#c8f2e0),var(--w-bg2,#d9e4ff));color:#3a2433;user-select:none;-webkit-user-select:none}
.rv-top{display:flex;align-items:center;gap:8px}
.rv-btn{min-width:44px;height:44px;border-radius:14px;border:2px solid rgba(58,36,51,.35);background:#fffaf0;font-family:inherit;font-weight:800;font-size:18px;color:#3a2433}
.rv-chip{padding:8px 12px;border-radius:999px;background:#fffaf0;border:2px solid rgba(58,36,51,.25);font-weight:800;white-space:nowrap}
.rv-bar{flex:1;height:12px;border-radius:999px;background:rgba(58,36,51,.14);overflow:hidden}
.rv-bar b{display:block;height:100%;width:100%;border-radius:999px;background:linear-gradient(90deg,#3ecf8e,#58b7ff);transform-origin:left;transform:scaleX(0);transition:transform .4s ease-out}
.rv-card{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#fffaf0;border:3px solid #3a2433;border-radius:24px;
  box-shadow:0 5px 0 rgba(58,36,51,.25);padding:14px 12px;text-align:center;position:relative}
.rv-card.in{animation:rv-card .35s ease-out both}
@keyframes rv-card{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
.rv-tag{position:absolute;top:10px;left:12px;padding:4px 10px;border-radius:999px;background:#ffe08a;border:2px solid rgba(58,36,51,.35);font-size:12px;font-weight:800}
.rv-label{font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.65;font-weight:800}
.rv-word{font-size:32px;font-weight:900;line-height:1.15;overflow-wrap:anywhere}
.rv-say{width:56px;height:56px;border-radius:50%;border:3px solid #3a2433;background:#ffd84a;font-size:26px;padding:0;box-shadow:0 4px 0 rgba(58,36,51,.28);touch-action:manipulation;transition:transform .12s}
.rv-say:active{transform:scale(.92)}
.rv-slots{display:flex;justify-content:center;gap:5px;flex-wrap:wrap}
.rv-slot{width:34px;height:42px;border-radius:10px;background:rgba(58,36,51,.1);display:grid;place-items:center;font-family:inherit;font-weight:900;font-size:22px;text-transform:uppercase;transition:transform .25s,background .25s}
.rv-slot.next{outline:3px solid #f7b733}.rv-slot.on{background:#7be0a4;transform:scale(1.06)}
.rv-note{min-height:22px;font-weight:800;font-size:15px}
.rv-note.good{color:#1f8a4c}.rv-note.bad{color:#c23a4b}
.rv-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.rv-opts.tiles{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;min-height:146px;align-content:center}
.rv-opt{text-align:center;min-height:68px;padding:8px 10px;border-radius:18px;border:3px solid #3a2433;background:#fff;font-family:inherit;font-weight:900;font-size:19px;line-height:1.15;color:#3a2433;
  box-shadow:0 4px 0 rgba(58,36,51,.28);touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .12s,opacity .25s;animation:rv-in .4s cubic-bezier(.3,1.5,.5,1) both;overflow-wrap:anywhere}
.rv-opt:active{transform:translateY(3px)}
.rv-opt.ok{background:#7be0a4}
.rv-opt.bad{background:#ff9aa5}
.rv-opt.dim{opacity:.45}
.rv-tile{width:58px;height:62px;border-radius:16px;border:3px solid #3a2433;background:#fff;font-family:inherit;font-weight:900;font-size:28px;text-transform:uppercase;color:#3a2433;padding:0;
  box-shadow:0 4px 0 rgba(58,36,51,.28);touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .2s,opacity .2s;animation:rv-in .4s cubic-bezier(.3,1.5,.5,1) both}
.rv-tile.used{opacity:0;transform:scale(.4);pointer-events:none}
.rv-tile.bad{background:#ff9aa5}
.rv-tile.glow{box-shadow:0 0 0 5px rgba(247,183,51,.8),0 4px 0 rgba(58,36,51,.28)}
@keyframes rv-in{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes rv-ok{40%{transform:scale(1.08)}to{transform:scale(1)}}
@keyframes rv-bad{20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(5px)}}
.rv-ov{position:absolute;inset:0;display:grid;place-items:center;background:rgba(40,24,60,.45);padding:18px;z-index:5;animation:rv-fade .25s both}
@keyframes rv-fade{from{opacity:0}to{opacity:1}}
.rv-box{width:100%;max-width:360px;background:#fffaf0;border:3px solid #3a2433;border-radius:26px;padding:20px 18px;text-align:center;box-shadow:0 8px 0 rgba(58,36,51,.3)}
.rv-box h2{margin:4px 0 10px;font-size:25px}.rv-box p{margin:8px 0;padding:10px 12px;border-radius:14px;background:rgba(60,170,130,.12);text-align:left;font-size:15px;line-height:1.35}
.rv-box p.hl{background:#fff3c4;font-weight:800;text-align:center}
.rv-ico{font-size:54px;line-height:1}.rv-stars{min-height:84px;display:flex;justify-content:center;align-items:flex-end;margin:4px 0}.rv-stars i{font-style:normal;opacity:.2;display:inline-block}.rv-stars i.on{opacity:1;animation:rv-in .5s cubic-bezier(.3,1.6,.5,1) both}
.rv-go{display:block;width:100%;height:52px;margin-top:10px;border-radius:16px;border:3px solid #3a2433;background:linear-gradient(#ffe08a,#f7b733);font-family:inherit;font-weight:900;font-size:18px;color:#3a2433;box-shadow:0 4px 0 rgba(58,36,51,.3)}
.rv-go.sec{background:#fff;box-shadow:none;border-width:2px;font-weight:800}
@media (max-height:620px){.rv-word{font-size:26px}.rv-opt{min-height:58px;font-size:17px}.rv-tile{width:50px;height:54px;font-size:24px}}
@media (prefers-reduced-motion:reduce){.rv-opt,.rv-tile,.rv-card{animation:none!important}}
`;
function ensureCss() {
  if (document.getElementById('rv-style')) return;
  const st = document.createElement('style'); st.id = 'rv-style'; st.textContent = CSS; document.head.appendChild(st);
}

const QUESTIONS = 10;
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [b[i], b[j]] = [b[j], b[i]]; } return b; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const low = (s) => String(s).trim().toLowerCase();
const canBuild = (en) => /^[a-z]{2,9}$/i.test(en);

function pairsOf(app, wid) {
  let list = [];
  try { list = I.tw?.(wid) || []; } catch (e) { /* */ }
  if (!list.length) list = (app.content.WORDS && app.content.WORDS[wid]) || [];
  const seen = new Set();
  return list.filter((p) => Array.isArray(p) && p[0] && p[1] && !seen.has(low(p[1])) && seen.add(low(p[1])));
}

export const meta = { topbar: false };

const numT = (key, a, v = {}) => esc(T(key, { ...v, a: '\u0001' })).replace('\u0001', `<b data-n="${a}">${a}</b>`);

export function render(root, params, app) {
  ensureCss();
  const wid = (params && params.wid) || 'w1';
  const st = app.state;
  const gameId = (params && params.id) || `${wid}-review`;
  let alive = true;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); return t; };

  const scr = document.createElement('div');
  scr.className = 'rv';
  root.appendChild(scr);
  let unTheme = null;
  try { unTheme = TH.applyWorldTheme?.(scr, wid, { decor: false }) || null; } catch (e) { /* */ }

  let pool = pairsOf(app, wid);
  if (pool.length < 4) for (const w of Object.keys(app.content.WORDS || {})) if (w !== wid) pool = pool.concat(pairsOf(app, w));
  const missed = () => { try { return S.missList(st, wid); } catch (e) { return []; } };
  let g = null;

  function intro() {
    const ok = pool.length >= 4;
    const n = missed().length;
    const ov = document.createElement('div'); ov.className = 'rv-ov';
    ov.innerHTML = `<div class="rv-box"><div class="rv-ico">🔁</div><h2>${esc(T('mode.review.title'))}</h2>
      ${ok ? `<p class="hl">${esc(n ? T('mode.review.have', { n }) : T('mode.review.clean'))}</p>
      <p>${esc(T('mode.review.r2'))}</p><p>${esc(T('mode.review.r3'))}</p>
      <button class="rv-go" data-a="go" data-sfx="open">${esc(T('mode.review.start'))}</button>` : `<p>${esc(T('mode.review.none'))}</p>`}
      <button class="rv-go sec" data-a="back" data-sfx="back">${esc(T('mode.review.back'))}</button></div>`;
    scr.appendChild(ov);
    JX.intro(ov.firstElementChild, ov.querySelector('.rv-ico'));
    ov.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'go') { ov.remove(); start(); } else if (a === 'back') app.back();
    });
  }

  function start() {
    // спершу слова з помилками (найчастіші — першими), решта — випадкові слова світу
    const byEn = new Map(pool.map((p) => [low(p[1]), p]));
    const first = missed().map((k) => byEn.get(k)).filter(Boolean).slice(0, QUESTIONS);
    const used = new Set(first.map((p) => low(p[1])));
    const rest = shuffle(pool.filter((p) => !used.has(low(p[1]))));
    let words = first.concat(rest).slice(0, QUESTIONS);
    while (words.length < QUESTIONS) words = words.concat(shuffle(pool).slice(0, QUESTIONS - words.length));
    const queue = words.map((p, i) => {
      let type = i % 3; // 0: переклад → англ.; 1: англ. → переклад; 2: скласти з літер
      if (type === 2 && !canBuild(p[1])) type = 0;
      return { nat: p[0], en: p[1], type, rep: false };
    });
    g = { queue, qi: 0, first: 0, bad: 0, fixed: 0, busy: false, q: null };
    scr.querySelectorAll('.rv-top,.rv-card,.rv-opts').forEach((n) => n.remove());
    scr.insertAdjacentHTML('beforeend', `
      <div class="rv-top"><button class="rv-btn" data-a="back" data-sfx="back" aria-label="back">‹</button>
        <div class="rv-bar"><b></b></div><span class="rv-chip rv-prog"></span></div>
      <div class="rv-card"></div>
      <div class="rv-opts"></div>`);
    question();
  }
  const $ = (q) => scr.querySelector(q);
  function note(text, cls = '') { const n = $('.rv-note'); if (n) { n.className = `rv-note ${cls}`; n.textContent = text; } }
  function progress(done) {
    $('.rv-prog').textContent = `🔁 ${Math.min(g.qi + 1, g.queue.length)}/${g.queue.length}`;
    $('.rv-bar b').style.transform = `scaleX(${done / g.queue.length})`;
  }

  function question() {
    const q = g.queue[g.qi];
    g.q = q; g.busy = false; q.failed = false; q.pos = 0;
    progress(g.qi);
    const card = $('.rv-card'), box = $('.rv-opts');
    card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');
    const tag = q.rep ? `<span class="rv-tag">${esc(T('mode.review.rep'))}</span>` : '';
    const en = low(q.en);
    if (q.type === 2) {
      card.innerHTML = `${tag}<div class="rv-label">${esc(T('mode.review.q_build'))}</div><div class="rv-word">${esc(q.nat)}</div>
        <div class="rv-slots">${[...en].map((_, i) => `<span class="rv-slot${i === 0 ? ' next' : ''}"></span>`).join('')}</div><div class="rv-note"></div>`;
      box.className = 'rv-opts tiles';
      box.innerHTML = shuffle([...en]).map((ch, i) => `<button class="rv-tile" data-ch="${esc(ch)}" data-sfx="none" style="animation-delay:${i * 45}ms">${esc(ch)}</button>`).join('');
      return;
    }
    const toEn = q.type === 0;
    const usedOpt = new Set([low(toEn ? q.en : q.nat)]);
    const wrong = [];
    for (const p of shuffle(pool)) {
      if (wrong.length >= 3) break;
      const o = toEn ? p[1] : p[0];
      if (low(p[1]) === en || low(p[0]) === low(q.nat) || usedOpt.has(low(o))) continue;
      usedOpt.add(low(o)); wrong.push(o);
    }
    q.answer = toEn ? q.en : q.nat;
    card.innerHTML = `${tag}<div class="rv-label">${esc(T(toEn ? 'mode.review.q_en' : 'mode.review.q_nat'))}</div>
      <div class="rv-word">${esc(toEn ? q.nat : q.en)}</div>
      ${toEn ? '' : '<button class="rv-say" data-a="say" data-sfx="none" aria-label="🔊">🔊</button>'}<div class="rv-note"></div>`;
    box.className = 'rv-opts';
    box.innerHTML = shuffle([q.answer, ...wrong]).map((o, i) => `<button class="rv-opt" data-o="${esc(o)}" data-sfx="none" style="animation-delay:${i * 60}ms">${esc(o)}</button>`).join('');
    if (!toEn) later(() => speak(q.en), 350);
  }

  // підсумок питання: ok — без жодної помилки в цій спробі
  function settle(ok) {
    const q = g.q;
    g.busy = true;
    if (ok) {
      if (!q.rep) { g.first += 1; try { S.onCorrectAnswer(st); S.addXP(st, 10); } catch (e) { /* */ } }
      let had = false;
      try { had = S.missList(st, wid).includes(low(q.en)); S.clearMiss(st, wid, q.en); } catch (e) { /* */ }
      if (had) g.fixed += 1;
      sfx('correct'); hap(app, 'success');
      note(T('mode.review.right', { en: q.en, nat: q.nat }), 'good');
      if (!q.rep) JX.xp($('.rv-card'), 10);
      if ($('.rv-slots')) JX.ok($('.rv-slots'), 8);
      if (q.type !== 1) later(() => speak(q.en), 250);
    } else {
      if (!q.rep) { g.bad += 1; g.queue.push({ nat: q.nat, en: q.en, type: q.type === 2 ? 0 : q.type, rep: true }); } // повтор наприкінці, макс. 1 раз
      note(T('mode.review.wrong', { en: q.en, nat: q.nat }), 'bad');
      later(() => speak(q.en, 0.8), 400);
    }
    progress(g.qi + 1);
    later(() => { if (g.qi + 1 >= g.queue.length) finish(); else { g.qi += 1; question(); } }, ok ? 1300 : 2400);
  }

  function pick(b) {
    if (!g || g.busy) return;
    const q = g.q;
    const good = b.dataset.o === q.answer;
    scr.querySelectorAll('.rv-opt').forEach((n) => {
      n.style.animationDelay = '0ms';
      if (n.dataset.o === q.answer) n.classList.add('ok'); else if (n === b) n.classList.add('bad'); else n.classList.add('dim');
    });
    if (good) JX.ok(b, 8); else { sfx('wrong'); hap(app, 'error'); JX.bad(b); }
    settle(good);
  }

  function tile(b) {
    if (!g || g.busy || b.classList.contains('used')) return;
    const q = g.q, en = low(q.en);
    const slots = $('.rv-slots').children;
    if (b.dataset.ch === en[q.pos]) {
      slots[q.pos].textContent = en[q.pos]; slots[q.pos].classList.remove('next'); slots[q.pos].classList.add('on');
      flyIn(b, slots[q.pos]);
      q.pos += 1; slots[q.pos]?.classList.add('next');
      scr.querySelectorAll('.rv-tile.glow').forEach((n) => n.classList.remove('glow'));
      b.classList.add('used');
      sfx('pop'); hap(app, 'light');
      if (q.pos >= en.length) settle(!q.failed);
      else if (q.failed) glow();
    } else {
      q.failed = true;
      b.style.animationDelay = '0ms';
      b.classList.add('bad'); JX.bad(b);
      sfx('wrong'); hap(app, 'error');
      glow(); // показуємо правильну літеру
    }
  }
  function flyIn(from, to) { // літера «перелітає» з плитки у слот (transform)
    try {
      const a = from.getBoundingClientRect(), c = to.getBoundingClientRect();
      to.animate([{ transform: `translate(${a.left - c.left}px,${a.top - c.top}px) scale(1.25)` }, { transform: 'translateY(-4px) scale(1.1)', offset: 0.75 }, { transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.2,.8,.3,1)' });
    } catch (e) { /* */ }
  }
  function glow() {
    const q = g.q, en = low(q.en);
    const b = [...scr.querySelectorAll('.rv-tile:not(.used)')].find((n) => n.dataset.ch === en[q.pos]);
    if (b) b.classList.add('glow');
  }

  function finish() {
    const stars = Math.max(1, starsByRatio(g.first / QUESTIONS));
    try { recordGame(st, gameId, stars); app.save?.(); } catch (e) { /* */ }
    sfx('win');
    const left = missed().length;
    const ov = document.createElement('div'); ov.className = 'rv-ov';
    ov.innerHTML = `<div class="rv-box"><div class="rv-ico">🏆</div><h2>${esc(T('mode.review.win'))}</h2>
      <div class="rv-stars"></div>
      <p>${numT('mode.review.first', g.first, { b: QUESTIONS })}${g.fixed ? `<br>${numT('mode.review.fixed', g.fixed)}` : ''}${left ? `<br>${numT('mode.review.left', left)}` : ''}</p>
      <button class="rv-go" data-a="back" data-sfx="open">${esc(T('mode.review.next'))}</button>
      <button class="rv-go sec" data-a="again">${esc(T('mode.review.again'))}</button></div>`;
    scr.appendChild(ov);
    JX.result(ov.firstElementChild, ov.querySelector('.rv-stars'), stars, { later, sfx });
    JX.intro(null, ov.querySelector('.rv-ico'));
    ov.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'again') { ov.remove(); start(); } else if (a === 'back') app.back();
    });
  }

  function onClick(e) {
    const o = e.target.closest('.rv-opt');
    if (o && scr.contains(o)) { pick(o); return; }
    const t = e.target.closest('.rv-tile');
    if (t && scr.contains(t)) { tile(t); return; }
    const a = e.target.closest('.rv-top [data-a], .rv-card [data-a]')?.dataset.a;
    if (a === 'back') app.back(); else if (a === 'say' && g?.q) speak(g.q.en);
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
