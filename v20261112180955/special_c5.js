// 🇮🇹 c5 «Піцайоло» — піцерія в Неаполі. Замовлення й рецепт — англійською (Capricciosa: tomato sauce, mozzarella, ham…),
// інгредієнти в мисках — лише картинки. Тапай потрібні — вони падають на піцу; все зібрано → піч 🔥.
// Кожна 3-тя піца — слово-бонус. 90 с, ⭐ за точність. id 'c5-special'.
import { spGame } from './special_kit.js?v=20261112180927';

// k, emoji, en, uk, ru
const ING = [
  ['sauce', '🍅', 'tomato sauce', 'томатний соус', 'томатный соус'], ['mozz', '🧀', 'mozzarella', 'моцарела', 'моцарелла'],
  ['basil', '🌿', 'basil', 'базилік', 'базилик'], ['mush', '🍄', 'mushrooms', 'гриби', 'грибы'], ['ham', '🥓', 'ham', 'шинка', 'ветчина'],
  ['olive', '🫒', 'olives', 'оливки', 'оливки'], ['pepper', '🫑', 'peppers', 'перець', 'перец'], ['onion', '🧅', 'onions', 'цибуля', 'лук'],
  ['pine', '🍍', 'pineapple', 'ананас', 'ананас'], ['saus', '🌭', 'sausage', 'ковбаска', 'колбаска'], ['chilli', '🌶️', 'chilli', 'гострий перчик', 'острый перчик'],
  ['corn', '🌽', 'sweetcorn', 'кукурудза', 'кукуруза'], ['garlic', '🧄', 'garlic', 'часник', 'чеснок'], ['egg', '🥚', 'egg', 'яйце', 'яйцо'],
  ['prawn', '🍤', 'prawns', 'креветки', 'креветки'], ['tuna', '🐟', 'tuna', 'тунець', 'тунец'], ['aub', '🍆', 'aubergine', 'баклажан', 'баклажан'],
];
const I = Object.fromEntries(ING.map((x) => [x[0], x]));
const PIZZAS = [
  ['Margherita', ['sauce', 'mozz', 'basil']], ['Marinara', ['sauce', 'garlic', 'basil']], ['Diavola', ['sauce', 'mozz', 'saus', 'chilli']],
  ['Capricciosa', ['sauce', 'mozz', 'ham', 'mush', 'olive']], ['Vegetariana', ['sauce', 'mozz', 'pepper', 'onion', 'aub']],
  ['Hawaiian', ['sauce', 'mozz', 'ham', 'pine']], ['Frutti di Mare', ['sauce', 'garlic', 'prawn', 'tuna']], ['Tonno', ['sauce', 'mozz', 'tuna', 'onion']],
  ['Funghi', ['sauce', 'mozz', 'mush']], ['Fiorentina', ['sauce', 'mozz', 'egg', 'garlic']],
];
const ASKS = ['One {p}, please!', "I'd like a {p}, please.", 'Could you make me a {p}?', 'A {p} for table five!', "We'll have a {p}, grazie!"];
const CUSTOM = ['Can I have a pizza with {l}?', "I'd like a pizza with {l}, please.", 'Make me something special: {l}!'];
const VOCAB = [
  ['dough', 'тісто', 'тесто'], ['oven', 'піч', 'печь'], ['crust', 'скоринка', 'корочка'], ['slice', 'шматок', 'кусок'], ['topping', 'начинка', 'начинка'],
  ['delicious', 'смачний', 'вкусный'], ['recipe', 'рецепт', 'рецепт'], ['waiter', 'офіціант', 'официант'], ['tip', 'чайові', 'чаевые'], ['bill', 'рахунок', 'счёт'],
];
const BINS = 9;

export const meta = { topbar: false };

export function render(root, params, app) {
  return spGame(root, params, app, {
    wid: 'c5', ico: '🍕', cls: 'sp-pizza', secs: 90, minOk: 5, vocab: VOCAB,
    title: ['Піцайоло', 'Пиццайоло'],
    rules: [
      ['🇮🇹 Ти — піцайоло в Неаполі! Замовлення і рецепт — англійською.', '🇮🇹 Ты — пиццайоло в Неаполе! Заказ и рецепт — по-английски.'],
      ['🍄 Миски з інгредієнтами без підписів: тапай лише ті, що є в рецепті.', '🍄 Миски с ингредиентами без подписей: тапай только те, что есть в рецепте.'],
      ['🔥 Зібрав усе — піца летить у піч. Зайвий інгредієнт — помилка!', '🔥 Собрал всё — пицца летит в печь. Лишний ингредиент — ошибка!'],
    ],
    mount(c) {
      const st = c.stage;
      st.innerHTML = `<div class="sp-pz-card"><div class="sp-pz-ask"></div><ul class="sp-pz-rec"></ul><button class="sp-say" aria-label="listen">🔊</button></div>
        <div class="sp-pz-mid"><div class="sp-pz"><div class="sp-pz-top"></div></div><div class="sp-oven">🔥</div></div>
        <div class="sp-bins"></div><div class="sp-pz-tip"></div>`;
      const q = (s) => st.querySelector(s);
      let ord = null, n = 0, busy = true, bag = [];
      q('.sp-say').onclick = () => ord && c.speak(ord.say);
      function makeOrder() {
        if (n % 2 === 1 || Math.random() < 0.65) {
          if (!bag.length) bag = c.shuffle(PIZZAS);
          const [name, need] = bag.pop();
          return { need, title: name, say: `${c.pick(ASKS).replace('{p}', name)} ${name}: ${need.map((k) => I[k][2]).join(', ')}.` };
        }
        const need = ['sauce', 'mozz', ...c.shuffle(ING.filter((x) => !['sauce', 'mozz'].includes(x[0]))).slice(0, 2 + ((Math.random() * 2) | 0)).map((x) => x[0])];
        const extra = need.slice(2).map((k) => I[k][2]);
        const l = `${extra.slice(0, -1).join(', ')} and ${extra[extra.length - 1]}`;
        return { need, title: '✨ Special', say: c.pick(CUSTOM).replace('{l}', l) };
      }
      function next() {
        if (!c.alive()) return;
        n += 1;
        if (n > 1 && n % 3 === 0) { busy = true; return c.bonus(order); }
        order();
      }
      function order() {
        ord = makeOrder(); ord.got = new Set(); busy = false;
        q('.sp-pz-ask').innerHTML = `<b>${c.esc(ord.title)}</b> · ${c.esc(ord.say)}`;
        q('.sp-pz-rec').innerHTML = ord.need.map((k) => `<li data-k="${k}">${c.esc(I[k][2])}</li>`).join('');
        q('.sp-pz-top').innerHTML = ''; q('.sp-pz-tip').textContent = '';
        const pz = q('.sp-pz');
        c.anim(pz, [{ transform: 'translateX(-120%) rotate(-90deg)' }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
        // миски: усі потрібні + відволікачі
        const others = c.shuffle(ING.filter((x) => !ord.need.includes(x[0]))).slice(0, BINS - ord.need.length).map((x) => x[0]);
        q('.sp-bins').innerHTML = c.shuffle([...ord.need, ...others]).map((k) => `<button class="sp-bin" data-k="${k}" aria-label="${c.esc(I[k][2])}">${I[k][1]}</button>`).join('');
        c.later(() => c.speak(ord.say), 300);
      }
      function drop(b, k) {
        const top = q('.sp-pz-top');
        const cnt = c.lite() ? 3 : k === 'sauce' || k === 'mozz' ? 1 : 5;
        const r0 = b.getBoundingClientRect();
        for (let i = 0; i < cnt; i++) {
          const s = document.createElement('span');
          const big = k === 'sauce' || k === 'mozz';
          s.className = 'sp-pz-bit' + (big ? ' layer-' + k : '');
          if (!big) {
            const a = Math.random() * Math.PI * 2, r = 12 + Math.random() * 28;
            s.style.left = `${50 + Math.cos(a) * r}%`; s.style.top = `${50 + Math.sin(a) * r}%`;
            s.textContent = I[k][1];
          }
          top.appendChild(s);
          const sr = s.getBoundingClientRect();
          c.anim(s, big ? [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'none', opacity: 1 }]
            : [{ transform: `translate(${r0.left - sr.left}px,${r0.top - sr.top}px) scale(1.4)` }, { transform: `rotate(${(Math.random() * 60 - 30) | 0}deg)` }],
          { duration: 380 + i * 60, easing: 'cubic-bezier(.3,.8,.4,1.2)', fill: 'both' });
        }
      }
      function bake() {
        busy = true;
        const pz = q('.sp-pz'), ov = q('.sp-oven');
        c.sfx('whoosh');
        const dx = ov.getBoundingClientRect().left - pz.getBoundingClientRect().left;
        c.anim(pz, [{ transform: 'none' }, { transform: `translateX(${dx}px) scale(.45)`, opacity: 0.3 }], { duration: 520, easing: 'ease-in', fill: 'forwards' });
        c.anim(ov, [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 500, delay: 420 });
        c.later(() => { c.done(); c.ok(ov, 15, '🍕 Bellissima!'); }, 600);
        c.later(() => { const a = pz.getAnimations?.() || []; a.forEach((x) => x.cancel()); next(); }, 1250);
      }
      st.addEventListener('click', (e) => {
        const b = e.target.closest('.sp-bin'); if (!b || busy || !ord || !c.alive() || b.disabled) return;
        const k = b.dataset.k;
        if (ord.need.includes(k) && !ord.got.has(k)) {
          ord.got.add(k); b.disabled = true; b.classList.add('ok');
          c.sfx('pop'); c.ok(b, 5, I[k][2]);
          st.querySelector(`.sp-pz-rec li[data-k="${k}"]`)?.classList.add('on');
          drop(b, k);
          if (ord.got.size === ord.need.length) bake();
        } else {
          b.classList.add('no'); b.disabled = true;
          c.bad(b, I[k][2]);
          q('.sp-pz-tip').textContent = `${I[k][1]} = ${I[k][2]} (${c.L([I[k][3], I[k][4]])}) — ✗`;
        }
      });
      return { next };
    },
  });
}
