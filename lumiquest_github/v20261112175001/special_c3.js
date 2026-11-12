// 🇯🇵 c3 «Суші-конвеєр» — дві стрічки везуть тарілки з англійськими словами. Шеф просить слово рідною мовою —
// хапай тарілку з правильним англійським словом, поки не поїхала! Швидкість зростає. 70 с, ⭐ за точність. id 'c3-special'.
// Слова — японська кухня/етикет (у файлі) + WORDS[c3] з контенту.
import { spGame } from './special_kit.js?v=20261112175001';

// [en, uk, ru, emoji]
const FOOD = [
  ['salmon', 'лосось', 'лосось', '🍣'], ['tuna', 'тунець', 'тунец', '🐟'], ['shrimp', 'креветка', 'креветка', '🍤'],
  ['rice', 'рис', 'рис', '🍚'], ['seaweed', 'морські водорості', 'морские водоросли', '🌿'], ['chopsticks', 'палички для їжі', 'палочки для еды', '🥢'],
  ['green tea', 'зелений чай', 'зелёный чай', '🍵'], ['soy sauce', 'соєвий соус', 'соевый соус', '🫙'], ['noodles', 'локшина', 'лапша', '🍜'],
  ['dumplings', 'пельмені', 'пельмени', '🥟'], ['rice ball', 'рисова кулька', 'рисовый шарик', '🍙'], ['octopus', 'восьминіг', 'осьминог', '🐙'],
  ['squid', 'кальмар', 'кальмар', '🦑'], ['crab', 'краб', 'краб', '🦀'], ['cucumber', 'огірок', 'огурец', '🥒'], ['avocado', 'авокадо', 'авокадо', '🥑'],
  ['egg', 'яйце', 'яйцо', '🥚'], ['lunch box', 'ланч-бокс (бенто)', 'ланч-бокс (бенто)', '🍱'], ['fish cake', 'рибний пиріжок', 'рыбная котлетка', '🍥'],
  ['skewer', 'шпажка', 'шпажка', '🍢'], ['raw fish', 'сира риба', 'сырая рыба', '🐠'], ['spicy', 'гострий', 'острый', '🌶️'],
  ['bow', 'уклін', 'поклон', '🙇'], ['cherry blossom', 'цвіт сакури', 'цветение сакуры', '🌸'], ['lantern', 'ліхтарик', 'фонарик', '🏮'],
  ['delicious', 'смачний', 'вкусный', '😋'], ['bowl', 'миска', 'миска', '🥣'], ['chef', 'шеф-кухар', 'шеф-повар', '👨‍🍳'],
];
const COLORS = ['#ff8a8a', '#ffd166', '#7fd1ff', '#9be89b', '#d7a6ff', '#ffb37f'];

export const meta = { topbar: false };

export function render(root, params, app) {
  return spGame(root, params, app, {
    wid: 'c3', ico: '🍣', cls: 'sp-sushi', secs: 70, minOk: 8, vocab: [],
    title: ['Суші-конвеєр', 'Суши-конвейер'],
    rules: [
      ['🇯🇵 Ти в суші-барі в Токіо. Тарілки їдуть по стрічках — на кожній англійське слово.', '🇯🇵 Ты в суши-баре в Токио. Тарелки едут по лентам — на каждой английское слово.'],
      ['👨‍🍳 Шеф просить слово рідною мовою — тапни тарілку з його англійським перекладом.', '👨‍🍳 Шеф просит слово на родном языке — тапни тарелку с его английским переводом.'],
      ['⚡ Стрічки щоразу швидші. Не та тарілка — помилка, тож не хапай навмання!', '⚡ Ленты всё быстрее. Не та тарелка — ошибка, так что не хватай наугад!'],
    ],
    mount(c) {
      const st = c.stage;
      // пул: [en, рідна, emoji] — власні + слова країни з контенту
      const pool = FOOD.map((f) => [f[0], c.L([f[1], f[2]]), f[3]]);
      const have = new Set(pool.map((p) => p[0]));
      for (const w of c.words) if (!have.has(w[0]) && w[0].length <= 16) { pool.push([w[0], w[1], '🍣']); have.add(w[0]); }
      st.innerHTML = `<div class="sp-sushi-hd"><span class="sp-chef">👨‍🍳</span><div class="sp-ticket"><small>${c.esc(c.L(['Подай:', 'Подай:']))}</small><b></b></div><span class="sp-sushi-got"></span></div>
        <div class="sp-belt" data-dir="1"></div><div class="sp-belt" data-dir="-1"></div><div class="sp-sushi-tip"></div>`;
      const q = (s) => st.querySelector(s);
      const belts = [...st.querySelectorAll('.sp-belt')];
      let want = null, spawnT = null, since = 0, served = 0, ci = 0, bag = [];
      const plates = new Set();
      const speed = () => Math.max(3600, 6400 - served * 230); // мс на проїзд стрічки
      function newWant() {
        if (!bag.length) bag = c.shuffle(pool);
        want = bag.pop(); since = 0;
        const t = q('.sp-ticket b'); t.textContent = want[1];
        c.anim(q('.sp-ticket'), [{ transform: 'rotate(-6deg) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.2,1.4,.4,1)' });
        q('.sp-sushi-tip').textContent = '';
      }
      function spawn() {
        if (!c.alive()) return;
        const belt = belts[ci++ % 2], dir = +belt.dataset.dir;
        // правильна тарілка гарантовано щонайменше кожна 3-тя
        const w = (since >= 2 || Math.random() < 0.3) ? want : c.pick(pool.filter((p) => p !== want));
        since = w === want ? 0 : since + 1;
        const p = document.createElement('button');
        p.className = 'sp-plate'; p.dataset.en = w[0];
        p.innerHTML = `<span class="sp-plate-e">${w[2]}</span><span class="sp-plate-w">${c.esc(w[0])}</span>`;
        p.style.setProperty('--pc', c.pick(COLORS));
        belt.appendChild(p);
        const W = belt.clientWidth + 140;
        const a = p.animate([{ transform: `translateX(${dir > 0 ? -130 : W}px)` }, { transform: `translateX(${dir > 0 ? W : -130}px)` }], { duration: speed(), easing: 'linear', fill: 'forwards' });
        p._a = a; plates.add(p);
        a.onfinish = () => { plates.delete(p); p.remove(); };
        spawnT = setTimeout(spawn, Math.max(520, 1000 - served * 25));
      }
      function next() { newWant(); spawn(); }
      st.addEventListener('click', (e) => {
        const p = e.target.closest('.sp-plate'); if (!p || p.dataset.used || !c.alive()) return;
        p.dataset.used = '1';
        if (p.dataset.en === want[0]) {
          served += 1; c.done(); c.ok(p, 10);
          c.speak(want[0]);
          p._a?.pause();
          const t = q('.sp-sushi-got'); t.textContent = '🍽️ ' + served;
          const r0 = p.getBoundingClientRect(), r1 = t.getBoundingClientRect();
          const cur = getComputedStyle(p).transform;
          p._a?.cancel(); p.style.transform = cur;
          const fly = c.anim(p, [{ transform: cur, opacity: 1 }, { transform: `${cur} translate(${r1.left - r0.left}px,${r1.top - r0.top}px) scale(.3)`, opacity: 0 }], { duration: 480, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
          const rm = () => { plates.delete(p); p.remove(); };
          if (fly) fly.onfinish = rm; else rm();
          // сусідні тарілки з тим самим словом лишаються «правильними» лише до зміни замовлення
          newWant();
        } else {
          c.bad(p, want[0]);
          p.classList.add('no');
          q('.sp-sushi-tip').textContent = `${p.dataset.en} ≠ ${want[1]}`;
        }
      });
      return { next, stop() { clearTimeout(spawnT); plates.forEach((p) => p._a?.pause()); } };
    },
  });
}
