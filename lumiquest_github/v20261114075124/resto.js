// 🍽 Ресторан Лумі — Лумі-офіціантка приймає замовлення АНГЛІЙСЬКОЮ (текст у бульбашці + озвучка).
// Збери на тацю потрібні страви й кількість і натисни «Подати». Хибна подача — −❤️ і можна переробити.
// Шкала терпіння не штрафує — лише забирає бонус ⚡ за швидкість; «Переклад» теж знімає бонус.
// Замовлення генеруються процедурно з шаблонів за рівнем світу (A1 → C1). DOM + CSS (transform/opacity).
import * as S from './state.js?v=20261114075109';
import * as FX from './fx.js?v=20261114075109';
import { recordGame, starsByRatio } from './games.js?v=20261114075109';
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
    l.href = new URL('./games3.css?v=20261114075109', import.meta.url).href;
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
try { I = await import('./i18n.js?v=20261114075109'); } catch (e) { /* */ }
let A = {};
import('./audio.js?v=20261114075109').then((m) => { A = m; }).catch(() => { /* */ });
let TH = {};
try { TH = await import('./theme.js?v=20261114075109'); } catch (e) { /* */ }

const sfx = (n) => { try { A.sfx?.(n); } catch (e) { /* */ } };
const speak = (x) => { try { A.speak?.(x); } catch (e) { /* */ } };
const hap = (app, k = 'light') => { try { app.tg?.tap?.(k); } catch (e) { /* */ } };

const STR = {
  uk: {
    'mode.resto.title': 'Ресторан Лумі',
    'mode.resto.r1': '👩‍🍳 Лумі сьогодні — офіціантка! Гості замовляють англійською: читай бульбашку або тисни 🔊.',
    'mode.resto.r2': '🍽 Тапай страви в меню — вони лягають на тацю. Тап по страві на таці — прибрати. Готово? 🛎 Подати!',
    'mode.resto.r3': '❤️ Помилка в замовленні — мінус серце (їх {h}). ⚡ Швидко і без перекладу — бонус. Гостей: {n}.',
    'mode.resto.start': '▶ Відкрити ресторан', 'mode.resto.back': '‹ Назад',
    'mode.resto.tr': 'Переклад', 'mode.resto.tray': 'Таця', 'mode.resto.empty': 'Таця порожня — тапни страву в меню 👇',
    'mode.resto.serve': '🛎 Подати', 'mode.resto.menu': 'Меню',
    'mode.resto.need': 'Не вистачає', 'mode.resto.extra': 'Зайве', 'mode.resto.retry': 'Спробуй ще раз!',
    'mode.resto.yum': 'Смакота! Дякую!', 'mode.resto.bonus': '⚡ Бонус!',
    'mode.resto.win': 'Ресторан закрито — успіх!', 'mode.resto.lose': 'Гості засмутились…',
    'mode.resto.again': '🔁 Ще раз', 'mode.resto.next': '➡️ Далі',
    'mode.resto.guests': 'Гостей обслуговано: {a}/{b}', 'mode.resto.first': 'З першої спроби: {a}', 'mode.resto.bon': 'Бонусів ⚡: {a}',
  },
  ru: {
    'mode.resto.title': 'Ресторан Луми',
    'mode.resto.r1': '👩‍🍳 Луми сегодня — официантка! Гости заказывают по-английски: читай пузырь или жми 🔊.',
    'mode.resto.r2': '🍽 Тапай блюда в меню — они ложатся на поднос. Тап по блюду на подносе — убрать. Готово? 🛎 Подать!',
    'mode.resto.r3': '❤️ Ошибка в заказе — минус сердце (их {h}). ⚡ Быстро и без перевода — бонус. Гостей: {n}.',
    'mode.resto.start': '▶ Открыть ресторан', 'mode.resto.back': '‹ Назад',
    'mode.resto.tr': 'Перевод', 'mode.resto.tray': 'Поднос', 'mode.resto.empty': 'Поднос пуст — тапни блюдо в меню 👇',
    'mode.resto.serve': '🛎 Подать', 'mode.resto.menu': 'Меню',
    'mode.resto.need': 'Не хватает', 'mode.resto.extra': 'Лишнее', 'mode.resto.retry': 'Попробуй ещё раз!',
    'mode.resto.yum': 'Вкуснятина! Спасибо!', 'mode.resto.bonus': '⚡ Бонус!',
    'mode.resto.win': 'Ресторан закрыт — успех!', 'mode.resto.lose': 'Гости расстроились…',
    'mode.resto.again': '🔁 Ещё раз', 'mode.resto.next': '➡️ Дальше',
    'mode.resto.guests': 'Гостей обслужено: {a}/{b}', 'mode.resto.first': 'С первой попытки: {a}', 'mode.resto.bon': 'Бонусов ⚡: {a}',
  },
};
try { I.addStrings?.(STR); } catch (e) { /* */ }
const LG = () => { try { return I.lang?.() === 'ru' ? 'ru' : 'uk'; } catch (e) { return 'uk'; } };
const T = (k, v) => {
  let s;
  try { s = I.t?.(k, v); } catch (e) { /* */ }
  if (!s || s === k) { s = (STR[LG()][k]) || k; if (v) for (const [a, b] of Object.entries(v)) s = s.replaceAll(`{${a}}`, b); }
  return s;
};

// ── меню ────────────────────────────────────────────────────────────────────
// sg/pl — форма після числівника; a — артикль для 1 шт; mass — лише «some X» (1 шт);
// bare — «the X»; p — ціна; uk/ru: [називний од., форма для 2–4, рід], ub/rb — коротка назва.
const D = [
  { k: 'apple', e: '🍎', sg: 'apple', pl: 'apples', a: 'an', p: 1, uk: ['яблуко', 'яблука', 'n'], ru: ['яблоко', 'яблока', 'n'] },
  { k: 'banana', e: '🍌', sg: 'banana', pl: 'bananas', p: 1, uk: ['банан', 'банани', 'm'], ru: ['банан', 'банана', 'm'] },
  { k: 'orange', e: '🍊', sg: 'orange', pl: 'oranges', a: 'an', p: 1, uk: ['апельсин', 'апельсини', 'm'], ru: ['апельсин', 'апельсина', 'm'] },
  { k: 'bread', e: '🍞', sg: 'bread', mass: 1, p: 1, uk: ['хліб'], ru: ['хлеб'] },
  { k: 'cake', e: '🍰', sg: 'cake', pl: 'cakes', p: 4, uk: ['тістечко', 'тістечка', 'n'], ru: ['пирожное', 'пирожных', 'n'] },
  { k: 'coffee', e: '☕', sg: 'coffee', pl: 'coffees', p: 3, uk: ['кава', 'кави', 'f'], ru: ['кофе', 'кофе', 'm'],
    cup: { sg: 'cup of coffee', pl: 'cups of coffee', uk: ['чашка кави', 'чашки кави', 'f'], ru: ['чашка кофе', 'чашки кофе', 'f'] } },
  { k: 'tea', e: '🍵', sg: 'tea', pl: 'teas', p: 2, uk: ['чай', 'чаї', 'm'], ru: ['чай', 'чая', 'm'],
    cup: { sg: 'cup of tea', pl: 'cups of tea', uk: ['чашка чаю', 'чашки чаю', 'f'], ru: ['чашка чая', 'чашки чая', 'f'] } },
  { k: 'juice', e: '🧃', sg: 'juice', pl: 'juices', p: 2, uk: ['сік', 'соки', 'm'], ru: ['сок', 'сока', 'm'],
    cup: { sg: 'glass of juice', pl: 'glasses of juice', uk: ['склянка соку', 'склянки соку', 'f'], ru: ['стакан сока', 'стакана сока', 'm'] } },
  { k: 'water', e: '💧', sg: 'bottle of water', pl: 'bottles of water', bare: 'water', p: 1, uk: ['пляшка води', 'пляшки води', 'f'], ru: ['бутылка воды', 'бутылки воды', 'f'], ub: 'вода', rb: 'вода' },
  { k: 'milk', e: '🥛', sg: 'glass of milk', pl: 'glasses of milk', bare: 'milk', p: 2, uk: ['склянка молока', 'склянки молока', 'f'], ru: ['стакан молока', 'стакана молока', 'm'], ub: 'молоко', rb: 'молоко' },
  { k: 'soup', e: '🍲', sg: 'bowl of soup', pl: 'bowls of soup', bare: 'soup', p: 5, uk: ['тарілка супу', 'тарілки супу', 'f'], ru: ['тарелка супа', 'тарелки супа', 'f'], ub: 'суп', rb: 'суп' },
  { k: 'salad', e: '🥗', sg: 'salad', pl: 'salads', p: 6, uk: ['салат', 'салати', 'm'], ru: ['салат', 'салата', 'm'] },
  { k: 'pizza', e: '🍕', sg: 'pizza', pl: 'pizzas', p: 9, uk: ['піца', 'піци', 'f'], ru: ['пицца', 'пиццы', 'f'] },
  { k: 'burger', e: '🍔', sg: 'burger', pl: 'burgers', p: 8, uk: ['бургер', 'бургери', 'm'], ru: ['бургер', 'бургера', 'm'] },
  { k: 'sandwich', e: '🥪', sg: 'sandwich', pl: 'sandwiches', p: 5, uk: ['сендвіч', 'сендвічі', 'm'], ru: ['сэндвич', 'сэндвича', 'm'] },
  { k: 'pasta', e: '🍝', sg: 'plate of pasta', pl: 'plates of pasta', bare: 'pasta', p: 7, uk: ['тарілка пасти', 'тарілки пасти', 'f'], ru: ['тарелка пасты', 'тарелки пасты', 'f'], ub: 'паста', rb: 'паста' },
  { k: 'rice', e: '🍚', sg: 'bowl of rice', pl: 'bowls of rice', bare: 'rice', p: 3, uk: ['миска рису', 'миски рису', 'f'], ru: ['миска риса', 'миски риса', 'f'], ub: 'рис', rb: 'рис' },
  { k: 'fish', e: '🐟', sg: 'fish', pl: 'fish', a: 'one', p: 10, uk: ['риба', 'риби', 'f'], ru: ['рыба', 'рыбы', 'f'] },
  { k: 'chicken', e: '🍗', sg: 'chicken', mass: 1, p: 9, uk: ['курка'], ru: ['курица'] },
  { k: 'egg', e: '🥚', sg: 'egg', pl: 'eggs', a: 'an', p: 1, uk: ['яйце', 'яйця', 'n'], ru: ['яйцо', 'яйца', 'n'] },
  { k: 'cheese', e: '🧀', sg: 'cheese', mass: 1, p: 4, uk: ['сир'], ru: ['сыр'] },
  { k: 'cookie', e: '🍪', sg: 'cookie', pl: 'cookies', p: 2, uk: ['печивко', 'печивка', 'n'], ru: ['печенье', 'печенья', 'n'] },
  { k: 'icecream', e: '🍦', sg: 'ice cream', pl: 'ice creams', a: 'an', p: 3, uk: ['морозиво', 'морозива', 'n'], ru: ['мороженое', 'мороженых', 'n'] },
];
// модифікатори — окремі позиції меню («🍬 sugar»): «with sugar» → покласти 1, «no sugar» → НЕ класти.
const M = [
  { k: 'sugar', e: '🍬', en: 'sugar', hosts: ['tea', 'coffee'], prep: 'in', p: 0,
    uk: ['без цукру', 'з цукром'], ru: ['без сахара', 'с сахаром'] },
  { k: 'onion', e: '🧅', en: 'onions', hosts: ['burger', 'sandwich', 'salad'], prep: { burger: 'on', sandwich: 'in', salad: 'in' }, p: 0,
    uk: ['без цибулі', 'з цибулею'], ru: ['без лука', 'с луком'] },
  { k: 'ice', e: '🧊', en: 'ice', hosts: ['juice', 'water'], prep: 'in', p: 0,
    uk: ['без льоду', 'з льодом'], ru: ['без льда', 'со льдом'] },
  { k: 'ketchup', e: '🥫', en: 'ketchup', hosts: ['burger', 'fish'], prep: 'on', p: 0,
    uk: ['без кетчупу', 'з кетчупом'], ru: ['без кетчупа', 'с кетчупом'] },
];
const ALL = Object.fromEntries([...D, ...M].map((d) => [d.k, d]));
const menuName = (d) => d.en || d.bare || d.sg;
const DRINKS = ['coffee', 'tea', 'juice', 'water', 'milk'];
const MAINS = ['soup', 'salad', 'pizza', 'burger', 'sandwich', 'pasta', 'fish', 'rice'];
const CHEAP_SET = [['tea', 'coffee', 'juice', 'milk', 'water'], ['cake', 'cookie', 'icecream'], ['pizza', 'burger', 'sandwich', 'salad', 'soup', 'pasta', 'fish']];

const NUM = ['zero', 'one', 'two', 'three', 'four'];
const NUM_UK = { m: ['', 'один', 'два', 'три', 'чотири'], f: ['', 'одна', 'дві', 'три', 'чотири'], n: ['', 'одне', 'два', 'три', 'чотири'] };
const NUM_RU = { m: ['', 'один', 'два', 'три', 'четыре'], f: ['', 'одна', 'две', 'три', 'четыре'], n: ['', 'одно', 'два', 'три', 'четыре'] };
const PORT = { uk: ['', 'одна порція', 'дві порції', 'три порції'], ru: ['', 'одна порция', 'две порции', 'три порции'] };

const rnd = (n) => (Math.random() * n) | 0;
const pick = (a) => a[rnd(a.length)];
const chance = (p) => Math.random() < p;
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const bareEn = (d) => d.bare || d.sg;
const orEn = (d) => (DRINKS.includes(d.k) ? bareEn(d) : MAINS.includes(d.k) ? `the ${bareEn(d)}` : `${d.a || 'a'} ${d.sg}`);
const bareL = (d, l) => (l === 'uk' ? d.ub || d.uk[0] : d.rb || d.ru[0]);

/** Одна позиція замовлення: { k, n, cup, art } → англ. фраза */
function en1(it) {
  const d = ALL[it.k]; const f = it.cup && d.cup ? d.cup : d;
  if (d.mass) return `some ${d.sg}`;
  if (it.n === 1) return it.art ? `${f === d ? d.a || 'a' : 'a'} ${f.sg}` : `one ${f.sg}`;
  return `${NUM[it.n]} ${f.pl}`;
}
function tr1(it, l) {
  const d = ALL[it.k]; const f = it.cup && d.cup ? d.cup : d; const w = f[l];
  if (d.mass || it.n === 1) return w[0];
  return `${(l === 'uk' ? NUM_UK : NUM_RU)[w[2]][it.n]} ${w[1]}`;
}
const join = (arr, and) => (arr.length < 2 ? arr[0] || '' : `${arr.slice(0, -1).join(', ')} ${and} ${arr[arr.length - 1]}`);
const Len = (items) => join(items.map(en1), 'and');
const Ltr = (items, l) => join(items.map((i) => tr1(i, l)), l === 'uk' ? 'і' : 'и');

/** Вибрати k різних страв (без модифікаторів) з обмеженнями. */
function dishes(k, { from, not = [] } = {}) {
  const pool = shuffle((from || D.map((d) => d.k)).filter((x) => !not.includes(x)));
  return pool.slice(0, k);
}
function item(k, nMax, { art = chance(0.5), cup = false } = {}) {
  const d = ALL[k];
  const n = d.mass ? 1 : 1 + rnd(nMax);
  return { k, n, art, cup };
}
const ansOf = (items) => { const a = {}; for (const i of items) a[i.k] = (a[i.k] || 0) + i.n; return a; };
const tri = (en, uk, ru) => ({ en, uk, ru });

// ── шаблони за рівнями ────────────────────────────────────────────────────
function tier0(odd) {
  const k = odd ? (chance(0.8) ? 2 : 1) : (chance(0.55) ? 1 : 2);
  const items = dishes(k).map((x) => item(x, k === 1 ? 3 : 2));
  const L = Len(items), U = Ltr(items, 'uk'), R = Ltr(items, 'ru');
  const t = pick([
    () => tri(`${cap(L)}, please.`, `${cap(U)}, будь ласка.`, `${cap(R)}, пожалуйста.`),
    () => tri(`Hello! ${cap(L)}, please.`, `Привіт! ${cap(U)}, будь ласка.`, `Привет! ${cap(R)}, пожалуйста.`),
    () => tri(`${cap(L)} for me, please.`, `Мені ${U}, будь ласка.`, `Мне ${R}, пожалуйста.`),
  ])();
  return { ...t, ans: ansOf(items) };
}
function tier1(odd) {
  const k = odd ? (chance(0.6) ? 3 : 2) : (chance(0.7) ? 2 : 3);
  const items = dishes(k).map((x) => item(x, 3, { cup: chance(0.6) }));
  const L = Len(items), U = Ltr(items, 'uk'), R = Ltr(items, 'ru');
  const t = pick([
    () => tri(`I'd like ${L}, please.`, `Мені, будь ласка, ${U}.`, `Мне, пожалуйста, ${R}.`),
    () => tri(`Can I have ${L}, please?`, `Можна мені: ${U}?`, `Можно мне: ${R}?`),
    () => tri(`Hi! I'd like ${L}.`, `Привіт! Мені ${U}.`, `Привет! Мне ${R}.`),
    () => tri(`Good morning! Can I have ${L}?`, `Доброго ранку! Можна мені: ${U}?`, `Доброе утро! Можно мне: ${R}?`),
  ])();
  return { ...t, ans: ansOf(items) };
}
const prepOf = (m, h) => (typeof m.prep === 'string' ? m.prep : m.prep[h]);
function modPick() {
  const m = pick(M); const h = pick(m.hosts);
  return { m, h };
}
function tier2(odd) {
  const { m, h } = modPick();
  const others = dishes(2, { not: m.hosts }).map((x) => item(x, odd ? 3 : 2, { cup: chance(0.4) }));
  const withMod = chance(0.4);
  if (withMod) {
    const host = { k: h, n: 1, art: true };
    const L = join([...others.map(en1), `${en1(host)} with ${m.en}`], 'and');
    const U = join([...others.map((i) => tr1(i, 'uk')), `${tr1(host, 'uk')} ${m.uk[1]}`], 'і');
    const R = join([...others.map((i) => tr1(i, 'ru')), `${tr1(host, 'ru')} ${m.ru[1]}`], 'и');
    const t = pick([
      () => tri(`Could I get ${L}, please?`, `Можна мені: ${U}?`, `Можно мне: ${R}?`),
      () => tri(`I'd like ${L}, please.`, `Мені, будь ласка, ${U}.`, `Мне, пожалуйста, ${R}.`),
    ])();
    const ans = ansOf([...others, host]); ans[m.k] = 1;
    return { ...t, ans, traps: [] };
  }
  const host = item(h, 2, { art: true });
  const items = shuffle([...others, host]);
  const L = Len(items), U = Ltr(items, 'uk'), R = Ltr(items, 'ru');
  const hb = host.n > 1 ? (ALL[h].bare || ALL[h].pl) : bareEn(ALL[h]);
  const HU = cap(bareL(ALL[h], 'uk')), HR = cap(bareL(ALL[h], 'ru'));
  const t = pick([
    () => tri(`Could I get ${L}? No ${m.en} ${prepOf(m, h)} the ${hb}, please.`, `Можна мені: ${U}? ${HU} — ${m.uk[0]}, будь ласка.`, `Можно мне: ${R}? ${HR} — ${m.ru[0]}, пожалуйста.`),
    () => tri(`I'd like ${L}, but no ${m.en} ${prepOf(m, h)} the ${hb}, please.`, `Мені ${U}, але ${bareL(ALL[h], 'uk')} — ${m.uk[0]}, будь ласка.`, `Мне ${R}, но ${bareL(ALL[h], 'ru')} — ${m.ru[0]}, пожалуйста.`),
  ])();
  return { ...t, ans: ansOf(items), traps: [m.k] };
}
function tier3(odd) {
  const r = Math.random();
  if (r < (odd ? 0.15 : 0.25)) return tier2(true);
  const kind = pick(['cheap', 'same', 'more', 'swap']);
  if (kind === 'cheap') {
    let a, b;
    const grp = pick(CHEAP_SET);
    do { [a, b] = dishes(2, { from: grp }); } while (ALL[a].p === ALL[b].p);
    const n = odd && chance(0.5) ? 3 : 2;
    const win = ALL[a].p < ALL[b].p ? a : b;
    const extra = chance(odd ? 0.7 : 0.4) ? [item(dishes(1, { not: [a, b] })[0], 1, { art: true })] : [];
    const XE = extra.length ? ` And ${en1(extra[0])}, please.` : '';
    const XU = extra.length ? ` І ще ${tr1(extra[0], 'uk')}, будь ласка.` : '';
    const XR = extra.length ? ` И ещё ${tr1(extra[0], 'ru')}, пожалуйста.` : '';
    const ans = ansOf(extra); ans[win] = n;
    return { ...tri(`I'll have whatever is cheaper: ${orEn(ALL[a])} or ${orEn(ALL[b])} — make it ${NUM[n]}.${XE}`,
      `Мені те, що дешевше: ${bareL(ALL[a], 'uk')} чи ${bareL(ALL[b], 'uk')} — ${PORT.uk[n]}.${XU}`,
      `Мне то, что дешевле: ${bareL(ALL[a], 'ru')} или ${bareL(ALL[b], 'ru')} — ${PORT.ru[n]}.${XR}`), ans, traps: [a, b], prices: true };
  }
  if (kind === 'same') {
    const items = dishes(odd ? 2 : pick([1, 2]), { from: D.filter((d) => !d.mass).map((d) => d.k) }).map((x) => ({ k: x, n: 1, art: true }));
    const who = pick([['My daughter wants', 'Моя донька хоче', 'Моя дочка хочет'], ['My son wants', 'Мій син хоче', 'Мой сын хочет'], ['My friend wants', 'Мій друг хоче', 'Мой друг хочет']]);
    const ans = ansOf(items); for (const x in ans) ans[x] *= 2;
    return { ...tri(`I'd like ${Len(items)}. ${who[0]} the same as me.`, `Мені ${Ltr(items, 'uk')}. ${who[1]} те саме, що й я.`, `Мне ${Ltr(items, 'ru')}. ${who[2]} то же самое, что и я.`), ans };
  }
  if (kind === 'more') {
    const [x, y] = dishes(2, { from: D.filter((d) => !d.mass).map((d) => d.k) });
    const items = [item(x, 2, { art: true }), item(y, 1, { art: true })];
    const ans = ansOf(items); ans[x] += 1;
    const one = { k: x, n: 1 };
    return { ...tri(`Can we have ${Len(items)}? Oh, and one more ${ALL[x].sg} for my friend.`,
      `Можна нам: ${Ltr(items, 'uk')}? Ой, і ще одна порція для мого друга: ${tr1(one, 'uk')}.`,
      `Можно нам: ${Ltr(items, 'ru')}? Ой, и ещё одна порция для моего друга: ${tr1(one, 'ru')}.`), ans };
  }
  const [x, y, z] = dishes(3);
  const A1 = [item(x, 2, { art: true })], Y = { k: y, n: 1, art: true }, Z = { k: z, n: 1, art: true };
  const ans = ansOf([...A1, Z]);
  return { ...tri(`I'd like ${en1(A1[0])} and ${en1(Y)}… Actually, forget the ${bareEn(ALL[y])}. Make it ${en1(Z)} instead.`,
    `Мені ${tr1(A1[0], 'uk')} і ${tr1(Y, 'uk')}… Ой, ні — ${bareL(ALL[y], 'uk')} не треба, краще ${tr1(Z, 'uk')}.`,
    `Мне ${tr1(A1[0], 'ru')} и ${tr1(Y, 'ru')}… Ой, нет — ${bareL(ALL[y], 'ru')} не надо, лучше ${tr1(Z, 'ru')}.`), ans, traps: [y] };
}
function tier4() {
  if (chance(0.3)) return tier3(true);
  const kind = pick(['torn', 'hold', 'trouble', 'dying', 'pass']);
  if (kind === 'torn') {
    const [a, b] = dishes(2, { from: MAINS });
    const dr = { k: pick(DRINKS), n: 1, art: true, cup: chance(0.5) };
    const ans = { [a]: 1 }; ans[dr.k] = 1;
    return { ...tri(`I'm torn between the ${bareEn(ALL[a])} and the ${bareEn(ALL[b])} — surprise me with the ${bareEn(ALL[a])}. And ${en1(dr)} to drink, please.`,
      `Вагаюся: ${bareL(ALL[a], 'uk')} чи ${bareL(ALL[b], 'uk')}… Хай буде ${bareL(ALL[a], 'uk')}! А попити — ${tr1(dr, 'uk')}, будь ласка.`,
      `Сомневаюсь: ${bareL(ALL[a], 'ru')} или ${bareL(ALL[b], 'ru')}… Пусть будет ${bareL(ALL[a], 'ru')}! А попить — ${tr1(dr, 'ru')}, пожалуйста.`), ans, traps: [b] };
  }
  if (kind === 'hold') {
    const { m, h } = modPick();
    const host = { k: h, n: 1, art: true };
    const other = item(dishes(1, { not: [...m.hosts] })[0], 2, { art: true });
    const items = [host, other];
    return { ...tri(`I'll have ${Len(items)}, but hold the ${m.en} ${prepOf(m, h)} the ${bareEn(ALL[h])}.`,
      `Мені ${Ltr(items, 'uk')}, але ${bareL(ALL[h], 'uk')} — ${m.uk[0]}.`,
      `Мне ${Ltr(items, 'ru')}, но ${bareL(ALL[h], 'ru')} — ${m.ru[0]}.`), ans: ansOf(items), traps: [m.k] };
  }
  if (kind === 'trouble') {
    const items = dishes(3).map((x) => item(x, 2, { art: true, cup: chance(0.5) }));
    return { ...tri(`Would you mind bringing me ${Len(items)}, if it's no trouble?`,
      `Чи не могли б ви принести: ${Ltr(items, 'uk')}? Якщо вам не складно.`,
      `Не могли бы вы принести: ${Ltr(items, 'ru')}? Если вам не трудно.`), ans: ansOf(items) };
  }
  if (kind === 'dying') {
    const dr = { k: pick(DRINKS), n: 1, art: true, cup: chance(0.5) };
    const rest = dishes(2, { not: DRINKS }).map((x) => item(x, 2, { art: true }));
    return { ...tri(`I'm dying for ${en1(dr)}! Oh, and ${Len(rest)} would be lovely too.`,
      `Страшенно хочу: ${tr1(dr, 'uk')}! І ще ${Ltr(rest, 'uk')} — було б чудово.`,
      `Ужасно хочу: ${tr1(dr, 'ru')}! И ещё ${Ltr(rest, 'ru')} — было бы чудесно.`), ans: ansOf([dr, ...rest]) };
  }
  const [y, ...xs] = dishes(3, { from: D.filter((d) => !d.mass).map((d) => d.k) });
  const items = xs.map((x) => item(x, 2, { art: true }));
  return { ...tri(`I'll pass on the ${bareEn(ALL[y])}, thanks — but I'd love ${Len(items)}.`,
    `${cap(bareL(ALL[y], 'uk'))} — не треба, дякую, а от ${Ltr(items, 'uk')} — із задоволенням.`,
    `${cap(bareL(ALL[y], 'ru'))} — не надо, спасибо, а вот ${Ltr(items, 'ru')} — с удовольствием.`), ans: ansOf(items), traps: [y] };
}

/** Згенерувати замовлення для індексу світу 0..8. */
export function makeOrder(wi) {
  const tier = Math.min(4, Math.floor(wi / 2)), odd = wi % 2 === 1;
  const o = [tier0, tier1, tier2, tier3, tier4][tier](odd);
  const size = tier === 0 ? 8 : 12;
  const keys = new Set([...Object.keys(o.ans), ...(o.traps || [])]);
  if (tier >= 2) for (const m of shuffle(M).slice(0, 2)) keys.add(m.k);
  for (const k of shuffle(D.map((d) => d.k))) { if (keys.size >= size) break; keys.add(k); }
  o.menu = shuffle([...keys]);
  o.prices = tier >= 3 || !!o.prices;
  return o;
}

// ── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
.rs{position:absolute;inset:0;display:flex;flex-direction:column;padding:calc(8px + env(safe-area-inset-top,0px)) 10px calc(10px + env(safe-area-inset-bottom,0px));gap:8px;overflow:hidden;
  background:linear-gradient(180deg,var(--w-bg1,#ffe3c8),var(--w-bg2,#ffd0d8));color:#3a2433;user-select:none;-webkit-user-select:none}
.rs-top{display:flex;align-items:center;gap:6px}
.rs-btn{min-width:44px;height:44px;border-radius:14px;border:2px solid rgba(58,36,51,.35);background:#fffaf0;font-family:inherit;font-weight:800;font-size:18px;color:#3a2433}
.rs-chip{padding:7px 10px;border-radius:999px;background:#fffaf0;border:2px solid rgba(58,36,51,.25);font-weight:800;font-size:14px;white-space:nowrap}
.rs-sp{flex:1}
.rs-hearts i{font-style:normal;display:inline-block;transition:opacity .3s,transform .3s}.rs-hearts i.lost{opacity:.25;transform:scale(.75)}
.rs-coin{display:inline-block}
.rs-scene{position:relative;display:flex;gap:10px;align-items:flex-start;background:rgba(255,250,240,.55);border:3px solid rgba(58,36,51,.2);border-radius:22px;padding:10px;
  background-image:repeating-linear-gradient(90deg,rgba(255,138,101,.18) 0 18px,rgba(255,255,255,0) 18px 36px)}
.rs-guest{position:relative;flex:none;width:84px;height:84px}
.rs-face{position:absolute;inset:0;border-radius:50%;display:grid;place-items:center;font-size:50px;line-height:1;background:radial-gradient(circle at 35% 30%,#fff,#ffe1c9 70%);
  border:3px solid #3a2433;box-shadow:0 4px 0 rgba(58,36,51,.25)}
.rs-guest.in .rs-face{animation:rs-in .55s cubic-bezier(.3,1.5,.5,1) both}
.rs-guest.idle .rs-face{animation:rs-bob 2.6s ease-in-out infinite}
.rs-guest.happy .rs-face{animation:rs-joy .7s ease-out}
.rs-guest.sad .rs-face{animation:rs-no .45s ease-in-out}
.rs-guest.out .rs-face{animation:rs-out .45s ease-in forwards}
.rs-mood{position:absolute;right:-6px;top:-6px;font-size:26px;opacity:0;transform:scale(.4);transition:opacity .2s,transform .25s cubic-bezier(.3,1.6,.5,1)}
.rs-mood.on{opacity:1;transform:scale(1)}
@keyframes rs-in{from{transform:translateX(-120px) scale(.6);opacity:0}to{transform:none;opacity:1}}
@keyframes rs-out{to{transform:translateX(140px) scale(.7);opacity:0}}
@keyframes rs-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes rs-joy{30%{transform:translateY(-14px) scale(1.12)}60%{transform:translateY(0) scale(.96)}100%{transform:none}}
@keyframes rs-no{20%{transform:translateX(-7px) rotate(-6deg)}50%{transform:translateX(7px) rotate(6deg)}80%{transform:translateX(-4px)}}
.rs-say{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.rs-bub{position:relative;background:#fff;border:3px solid #3a2433;border-radius:18px;padding:8px 11px;font-weight:800;font-size:17px;line-height:1.3;min-height:48px}
.rs-bub::before{content:'';position:absolute;left:-11px;top:22px;width:16px;height:16px;background:#fff;border-left:3px solid #3a2433;border-bottom:3px solid #3a2433;transform:rotate(45deg)}
.rs-bub.in{animation:rs-pop .35s cubic-bezier(.3,1.5,.5,1) both}
@keyframes rs-pop{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}
.rs-tr{margin-top:5px;padding-top:5px;border-top:2px dashed rgba(58,36,51,.2);font-weight:700;font-size:14px;opacity:.8}
.rs-acts{display:flex;gap:6px;align-items:center}
.rs-sm{height:36px;padding:0 11px;border-radius:12px;border:2px solid rgba(58,36,51,.35);background:#fffaf0;font-family:inherit;font-weight:800;font-size:14px;color:#3a2433}
.rs-sm[disabled]{opacity:.45}
.rs-pat{flex:1;height:10px;border-radius:99px;background:rgba(58,36,51,.12);overflow:hidden;position:relative}
.rs-pat i{position:absolute;inset:0;border-radius:99px;background:linear-gradient(90deg,#7be0a4,#f7b733);transform-origin:left center}
.rs-pat.gone i{opacity:0}.rs-pat.off{opacity:.35}
.rs-bolt{font-size:15px;transition:opacity .3s}.rs-bolt.gone{opacity:.25}
.rs-diff{display:flex;flex-wrap:wrap;gap:4px;font-weight:800;font-size:13px}
.rs-diff span{padding:3px 8px;border-radius:99px;background:#ffd5d9}.rs-diff span.add{background:#d9ffd0}
.rs-diff.in{animation:rs-pop .3s both}
.rs-trayrow{display:flex;gap:8px;align-items:stretch}
.rs-tray{flex:1;min-height:58px;border-radius:999px;background:linear-gradient(#e9eef5,#c9d3df);border:3px solid #3a2433;box-shadow:0 4px 0 rgba(58,36,51,.25);
  display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px;padding:4px 12px}
.rs-tray .ph{font-size:12px;font-weight:700;opacity:.6;text-align:center}
.rs-ti{position:relative;border:0;background:none;padding:0 2px;font-size:30px;line-height:1.1;font-family:inherit}
.rs-ti b{position:absolute;right:-5px;bottom:-3px;min-width:20px;height:20px;border-radius:10px;background:#3a2433;color:#fff;font-size:12px;display:grid;place-items:center;padding:0 4px}
.rs-serve{flex:none;width:100px;border-radius:18px;border:3px solid #3a2433;background:linear-gradient(#ffe08a,#f7b733);font-family:inherit;font-weight:900;font-size:16px;color:#3a2433;box-shadow:0 4px 0 rgba(58,36,51,.3)}
.rs-serve:active{transform:translateY(2px)}
.rs-lumi{flex:none;width:58px;height:58px;border-radius:50%;background:#fff4d6;border:3px solid #3a2433;overflow:hidden;display:grid;place-items:center}
.rs-lumi img{width:118%;height:118%;object-fit:contain;transform:translateY(4px)}
.rs-lumi.ok img{animation:rs-joy .6s ease-out}
.rs-mlabel{align-self:flex-start;font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:900;margin:0 0 -4px 4px;padding:2px 10px;border-radius:99px;background:rgba(255,250,240,.85);color:#3a2433}
.rs-menu{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:minmax(64px,1fr);gap:7px;align-content:start}
.rs-d{position:relative;border-radius:16px;border:2px solid rgba(58,36,51,.4);background:#fffaf0;font-family:inherit;color:#3a2433;padding:4px 2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
  box-shadow:0 3px 0 rgba(58,36,51,.2);touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .12s}
.rs-d:active{transform:scale(.93)}
.rs-d .em{font-size:30px;line-height:1.05}.rs-d .nm{font-size:12.5px;font-weight:800;line-height:1.1}
.rs-d .pr{position:absolute;top:3px;right:5px;font-size:10.5px;font-weight:900;opacity:.6}
.rs-d.mod{background:#f3ecff;border-style:dashed}
.rs-d.tap{animation:rs-tap .25s ease-out}
@keyframes rs-tap{40%{transform:scale(1.1)}}
.rs-ov{position:absolute;inset:0;display:grid;place-items:center;background:rgba(40,24,60,.45);padding:18px;z-index:5;animation:rs-fade .25s both}
@keyframes rs-fade{from{opacity:0}to{opacity:1}}
.rs-box{width:100%;max-width:360px;background:#fffaf0;border:3px solid #3a2433;border-radius:26px;padding:20px 18px;text-align:center;box-shadow:0 8px 0 rgba(58,36,51,.3)}
.rs-box h2{margin:4px 0 10px;font-size:25px}.rs-box p{margin:8px 0;padding:10px 12px;border-radius:14px;background:rgba(255,138,101,.13);text-align:left;font-size:15px;line-height:1.35}
.rs-ico{font-size:54px;line-height:1}.rs-stars{min-height:84px;display:flex;justify-content:center;align-items:flex-end;margin:6px 0}.rs-stars i{font-style:normal;opacity:.2;display:inline-block}.rs-stars i.on{opacity:1;animation:rs-pop .5s cubic-bezier(.3,1.6,.5,1) both}
.rs-go{display:block;width:100%;height:52px;margin-top:10px;border-radius:16px;border:3px solid #3a2433;background:linear-gradient(#ffe08a,#f7b733);font-family:inherit;font-weight:900;font-size:18px;color:#3a2433;box-shadow:0 4px 0 rgba(58,36,51,.3)}
.rs-go.sec{background:#fff;box-shadow:none;border-width:2px;font-weight:800}
.rs-fly{position:absolute;z-index:6;font-size:26px;pointer-events:none;transition:transform .7s cubic-bezier(.4,-.3,.6,1),opacity .7s}
@media (max-height:700px){.rs-menu{grid-auto-rows:minmax(56px,1fr)}.rs-d .em{font-size:26px}.rs-guest{width:70px;height:70px}.rs-face{font-size:42px}.rs-bub{font-size:15px}}
@media (prefers-reduced-motion:reduce){.rs *{animation:none!important;transition:none!important}}
html[data-perf='lite'] .rs-guest.idle .rs-face,html[data-perf='lite'] .rs-ti,html[data-perf='lite'] .rs-d.tap,html[data-perf='lite'] .rs-bub.in{animation:none}
html[data-perf='lite'] .rs-scene{background-image:none}
html.lq-hidden .rs-guest .rs-face{animation-play-state:paused}
`;
function ensureCss() {
  if (document.getElementById('rs-style')) return;
  const st = document.createElement('style'); st.id = 'rs-style'; st.textContent = CSS; document.head.appendChild(st);
}

const HEARTS = 3, GUESTS = 8;
const numT = (key, a) => esc(T(key, { a: '\u0001' })).replace('\u0001', `<b data-n="${a}">${a}</b>`);
const FACES = ['🧑‍🦱', '👵', '🧔', '👧', '🐻', '🦊', '👨‍🦳', '👩', '🐼', '🐱', '👦', '🐰', '🧑‍🎤', '🐨'];

/** Відладка/тести: поточне замовлення та правильна відповідь. */
export const _debug = { order: null, answer: null, g: null };
try { globalThis.__lqResto = _debug; } catch (e) { /* */ }

export const meta = { topbar: false };

export function render(root, params, app) {
  ensureCss();
  const wid = (params && params.wid) || 'w1';
  const st = app.state;
  const gameId = (params && params.id) || `${wid}-resto`;
  let wi = 0;
  try { wi = Math.max(0, (app.content?.WORLDS || []).findIndex((w) => w.id === wid)); } catch (e) { /* */ }
  const PATIENCE = Math.round(25 + (Math.min(8, wi) / 8) * 10);
  let alive = true;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); };

  const scr = document.createElement('div');
  scr.className = 'rs';
  root.appendChild(scr);
  let unTheme = null;
  try { unTheme = TH.applyWorldTheme?.(scr, wid, { decor: false }) || null; } catch (e) { /* */ }
  let lumiSrc = 'assets/lumi/happy.png';
  try { lumiSrc = app.asset?.('lumi/happy.png') || lumiSrc; } catch (e) { /* */ }

  let g = null;
  const $ = (q) => scr.querySelector(q);

  function intro() {
    const ov = document.createElement('div'); ov.className = 'rs-ov';
    ov.innerHTML = `<div class="rs-box"><div class="rs-ico">🍽</div><h2>${esc(T('mode.resto.title'))}</h2>
      <p>${esc(T('mode.resto.r1'))}</p><p>${esc(T('mode.resto.r2'))}</p><p>${esc(T('mode.resto.r3', { h: HEARTS, n: GUESTS }))}</p>
      <button class="rs-go" data-a="go" data-sfx="open">${esc(T('mode.resto.start'))}</button>
      <button class="rs-go sec" data-a="back" data-sfx="back">${esc(T('mode.resto.back'))}</button></div>`;
    scr.appendChild(ov);
    JX.intro(ov.firstElementChild, ov.querySelector('.rs-ico'));
    ov.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'go') { ov.remove(); start(); } else if (a === 'back') app.back();
    });
  }

  function start() {
    const faces = shuffle(FACES);
    g = { i: 0, hearts: HEARTS, first: 0, bonus: 0, served: 0, bad: 0, coins: 0, faces, tray: {}, busy: true, o: null };
    _debug.g = g;
    scr.querySelectorAll(':scope > :not(.rs-ov)').forEach((n) => n.remove());
    const flag = LG() === 'ru' ? '🇷🇺' : '🇺🇦';
    scr.insertAdjacentHTML('beforeend', `
      <div class="rs-top"><button class="rs-btn" data-a="back" data-sfx="back" aria-label="back">‹</button>
        <span class="rs-chip rs-hearts"></span><span class="rs-sp"></span>
        <span class="rs-chip rs-coins"><span class="rs-coin">🪙</span> <b>0</b></span><span class="rs-chip rs-prog"></span></div>
      <div class="rs-scene">
        <div class="rs-guest"><div class="rs-face"></div><div class="rs-mood"></div></div>
        <div class="rs-say"><div class="rs-bub"></div>
          <div class="rs-acts"><button class="rs-sm" data-a="say" data-sfx="none">🔊</button>
            <button class="rs-sm" data-a="tr" data-sfx="tap">${flag} ${esc(T('mode.resto.tr'))}</button>
            <span class="rs-bolt">⚡</span><div class="rs-pat"><i></i></div></div>
          <div class="rs-diff"></div></div>
      </div>
      <div class="rs-trayrow"><div class="rs-lumi"><img alt="" draggable="false" src="${esc(lumiSrc)}"></div>
        <div class="rs-tray"></div><button class="rs-serve" data-a="serve" data-sfx="none">${esc(T('mode.resto.serve'))}</button></div>
      <div class="rs-mlabel">${esc(T('mode.resto.menu'))}</div>
      <div class="rs-menu"></div>`);
    $('.rs-lumi img').addEventListener('error', (e) => { e.target.replaceWith(Object.assign(document.createElement('span'), { textContent: '👩‍🍳', style: 'font-size:34px' })); }, { once: true });
    hearts(); guest();
  }
  function hearts() { $('.rs-hearts').innerHTML = Array.from({ length: HEARTS }, (_, i) => `<i class="${i < g.hearts ? '' : 'lost'}">❤️</i>`).join(''); }

  function guest() {
    const o = makeOrder(wi);
    g.o = o; g.tray = {}; g.tries = 0; g.translated = false; g.t0 = Date.now(); g.busy = false;
    _debug.order = o; _debug.answer = { ...o.ans };
    $('.rs-prog').textContent = `🍽 ${g.i + 1}/${GUESTS}`;
    const gu = $('.rs-guest');
    gu.className = 'rs-guest'; void gu.offsetWidth; gu.className = 'rs-guest in';
    later(() => { if (gu.classList.contains('in')) gu.className = 'rs-guest idle'; }, 600);
    $('.rs-face').textContent = g.faces[g.i % g.faces.length];
    $('.rs-mood').className = 'rs-mood';
    const bub = $('.rs-bub');
    bub.classList.remove('in'); void bub.offsetWidth; bub.classList.add('in');
    bub.innerHTML = esc(o.en);
    $('.rs-diff').innerHTML = '';
    const trb = scr.querySelector('[data-a="tr"]'); trb.disabled = false;
    $('.rs-bolt').classList.remove('gone');
    // шкала терпіння: лише бонус ⚡
    const pat = $('.rs-pat'), bar = pat.firstElementChild;
    pat.className = 'rs-pat';
    bar.style.transition = 'none'; bar.style.transform = 'scaleX(1)'; void bar.offsetWidth;
    bar.style.transition = `transform ${PATIENCE}s linear`; bar.style.transform = 'scaleX(0)';
    const gi = g.i;
    later(() => { if (g && g.i === gi && !g.busy) { pat.classList.add('gone'); $('.rs-bolt').classList.add('gone'); } }, PATIENCE * 1000);
    menu(); tray();
    later(() => speak(o.en), 450);
  }

  function menu() {
    const o = g.o;
    $('.rs-menu').innerHTML = o.menu.map((k, j) => {
      const d = ALL[k];
      return `<button class="rs-d${d.hosts ? ' mod' : ''}" data-k="${k}" data-sfx="none" style="animation-delay:${j * 25}ms">
        ${o.prices && !d.hosts ? `<span class="pr">$${d.p}</span>` : ''}<span class="em">${d.e}</span><span class="nm">${esc(menuName(d))}</span></button>`;
    }).join('');
  }
  function tray() {
    const ks = Object.keys(g.tray).filter((k) => g.tray[k] > 0);
    $('.rs-tray').innerHTML = ks.length
      ? ks.map((k) => `<button class="rs-ti" data-t="${k}" data-sfx="none" aria-label="${esc(menuName(ALL[k]))}">${ALL[k].e}${g.tray[k] > 1 ? `<b>×${g.tray[k]}</b>` : ''}</button>`).join('')
      : `<span class="ph">${esc(T('mode.resto.empty'))}</span>`;
  }
  function add(k, btn) {
    if (!g || g.busy) return;
    const total = Object.values(g.tray).reduce((a, b) => a + b, 0);
    if (total >= 12 || (g.tray[k] || 0) >= 6) { sfx('wrong'); return; }
    g.tray[k] = (g.tray[k] || 0) + 1;
    sfx('pop'); hap(app, 'light');
    if (btn) { btn.classList.remove('tap'); void btn.offsetWidth; btn.classList.add('tap'); }
    JX.flip($('.rs-tray'), '.rs-ti', 'data-t', tray, btn ? { [k]: btn.querySelector('.em')?.getBoundingClientRect() || btn.getBoundingClientRect() } : {});
  }
  function remove(k) {
    if (!g || g.busy || !g.tray[k]) return;
    g.tray[k] -= 1; if (g.tray[k] <= 0) delete g.tray[k];
    sfx('tap'); JX.flip($('.rs-tray'), '.rs-ti', 'data-t', tray);
  }
  function translate() {
    if (!g || g.busy || g.translated) return;
    g.translated = true;
    $('.rs-bub').insertAdjacentHTML('beforeend', `<div class="rs-tr">${esc(g.o[LG()])}</div>`);
    scr.querySelector('[data-a="tr"]').disabled = true;
    $('.rs-pat').classList.add('off'); $('.rs-bolt').classList.add('gone');
  }

  function serve() {
    if (!g || g.busy) return;
    const ans = g.o.ans, tr = g.tray;
    const keys = new Set([...Object.keys(ans), ...Object.keys(tr)]);
    const need = [], extra = [];
    for (const k of keys) {
      const d = (ans[k] || 0) - (tr[k] || 0);
      if (d > 0) need.push([k, d]); else if (d < 0) extra.push([k, -d]);
    }
    g.tries += 1;
    if (!need.length && !extra.length) return good();
    // хибна подача
    g.bad += 1; if (!S.calm?.()) g.hearts -= 1; hearts();   // v22 🐢
    try { S.noteMiss?.(st, wid, menuName(ALL[(need[0] || extra[0])[0]])); } catch (e) { /* */ }
    const gu = $('.rs-guest'); gu.className = 'rs-guest'; void gu.offsetWidth; gu.className = 'rs-guest sad';
    const md = $('.rs-mood'); md.textContent = '😠'; md.className = 'rs-mood on';
    const cnt = (n) => (n > 1 ? ` ×${n}` : '');
    const df = $('.rs-diff');
    df.className = 'rs-diff'; void df.offsetWidth; df.className = 'rs-diff in';
    df.innerHTML = [
      ...need.map(([k, n]) => `<span class="add">${esc(T('mode.resto.need'))}: ${ALL[k].e} ${esc(menuName(ALL[k]))}${cnt(n)}</span>`),
      ...extra.map(([k, n]) => `<span>${esc(T('mode.resto.extra'))}: ${ALL[k].e} ${esc(menuName(ALL[k]))}${cnt(n)}</span>`),
    ].join('');
    sfx('wrong'); hap(app, 'error');
    JX.bad($('.rs-tray')); JX.emote($('.rs-lumi img'), 'sad');
    if (g.hearts <= 0) { g.busy = true; later(() => finish(false), 1100); return; }
    later(() => { if (g && !g.busy) $('.rs-mood').className = 'rs-mood'; }, 1400);
  }

  function good() {
    g.busy = true; g.served += 1;
    const first = g.tries === 1; if (first) g.first += 1;
    const fast = !g.translated && (Date.now() - g.t0) <= PATIENCE * 1000;
    if (fast) g.bonus += 1;
    const xp = 10 + (fast ? 5 : 0);
    try { S.onCorrectAnswer(st); S.addXP(st, xp); } catch (e) { /* */ }
    const gu = $('.rs-guest'); gu.className = 'rs-guest'; void gu.offsetWidth; gu.className = 'rs-guest happy';
    const md = $('.rs-mood'); md.textContent = '😍'; md.className = 'rs-mood on';
    $('.rs-diff').innerHTML = `<span class="add">${esc(T('mode.resto.yum'))}</span>${fast ? `<span class="add">${esc(T('mode.resto.bonus'))}</span>` : ''}`;
    $('.rs-pat').firstElementChild.style.transition = 'none';
    const lu = $('.rs-lumi'); lu.classList.remove('ok'); void lu.offsetWidth; lu.classList.add('ok');
    sfx('correct'); hap(app, 'success');
    later(() => sfx('coin'), 250);
    JX.ok($('.rs-tray'), 10);
    JX.xp($('.rs-guest'), xp);
    coins(fast ? 5 : 3);
    later(() => { gu.className = 'rs-guest out'; }, 1100);
    later(() => { if (g.i + 1 >= GUESTS) finish(true); else { g.i += 1; guest(); } }, 1600);
  }

  function coins(n) {
    const from = $('.rs-guest').getBoundingClientRect(), to = $('.rs-coins').getBoundingClientRect(), base = scr.getBoundingClientRect();
    const lite = document.documentElement.dataset.perf === 'lite';
    for (let j = 0; j < (lite ? 1 : n); j++) {
      const c = document.createElement('span'); c.className = 'rs-fly'; c.textContent = '🪙';
      const x0 = from.left - base.left + from.width / 2 - 13 + (Math.random() * 30 - 15), y0 = from.top - base.top + from.height / 2 - 13;
      c.style.left = `${x0}px`; c.style.top = `${y0}px`;
      scr.appendChild(c);
      const dx = to.left - base.left + 8 - x0, dy = to.top - base.top + 2 - y0;
      later(() => { c.style.transform = `translate(${dx}px,${dy}px) scale(.7)`; c.style.opacity = '.3'; }, 30 + j * 90);
      later(() => {
        c.remove(); g.coins += lite ? n : 1;
        const b = $('.rs-coins b'); if (b) b.textContent = String(g.coins);
        if (j === n - 1 || lite) { try { FX.pop?.($('.rs-coin')); } catch (e) { /* */ } }
      }, 760 + j * 90);
    }
  }

  function finish(win) {
    g.busy = true;
    const stars = win ? Math.max(1, starsByRatio(g.first / GUESTS)) : 0;
    try { recordGame(st, gameId, stars); app.save?.(); } catch (e) { /* */ }
    sfx(win ? 'win' : 'lose');
    const ov = document.createElement('div'); ov.className = 'rs-ov';
    ov.innerHTML = `<div class="rs-box"><div class="rs-ico">${win ? '🏆' : '💔'}</div><h2>${esc(T(win ? 'mode.resto.win' : 'mode.resto.lose'))}</h2>
      <div class="rs-stars"></div>
      <p>${esc(T('mode.resto.guests', { a: g.served, b: GUESTS }))}<br>${numT('mode.resto.first', g.first)} · ${numT('mode.resto.bon', g.bonus)} · 🪙 <b data-n="${g.coins}">${g.coins}</b></p>
      <button class="rs-go" data-a="${win ? 'back' : 'again'}" data-sfx="open">${esc(T(win ? 'mode.resto.next' : 'mode.resto.again'))}</button>
      <button class="rs-go sec" data-a="${win ? 'again' : 'back'}">${esc(T(win ? 'mode.resto.again' : 'mode.resto.back'))}</button></div>`;
    scr.appendChild(ov);
    JX.result(ov.firstElementChild, ov.querySelector('.rs-stars'), stars, { later, sfx });
    JX.intro(null, ov.querySelector('.rs-ico'));
    ov.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'again') { ov.remove(); start(); } else if (a === 'back') app.back();
    });
  }

  function onClick(e) {
    if (e.target.closest('.rs-ov')) return;
    const d = e.target.closest('.rs-d'); if (d) { add(d.dataset.k, d); return; }
    const t = e.target.closest('.rs-ti'); if (t) { remove(t.dataset.t); return; }
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'back') app.back();
    else if (a === 'say') { if (g?.o) speak(g.o.en); }
    else if (a === 'tr') translate();
    else if (a === 'serve') serve();
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
    _debug.g = null; _debug.order = null; _debug.answer = null;
    scr.remove();
  };
}
