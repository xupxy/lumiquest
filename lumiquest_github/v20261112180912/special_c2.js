// 🇺🇸 c2 «Таксі-ралі» — ти водій жовтого таксі в Нью-Йорку. Пасажир дає напрямок англійською
// (Go two blocks north / Turn left and go one block…). Тапни перехрестя, де треба зупинитись — таксі їде туди.
// Кожна 4-та поїздка — слово-бонус. 75 с, ⭐ за точність. id 'c2-special'.
import { spGame } from './special_kit.js';

const N = 5; // 5×5 перехресть
const DIRS = { north: [0, -1], east: [1, 0], south: [0, 1], west: [-1, 0] };
const ORDER = ['north', 'east', 'south', 'west'];
const DIR_T = { north: ['на північ', 'на север'], east: ['на схід', 'на восток'], south: ['на південь', 'на юг'], west: ['на захід', 'на запад'] };
const NUM = ['', 'one', 'two', 'three', 'four'];
const NUM_T = ['', ['один квартал', 'один квартал'], ['два квартали', 'два квартала'], ['три квартали', 'три квартала'], ['чотири квартали', 'четыре квартала']];
const blocks = (k) => `${NUM[k]} block${k > 1 ? 's' : ''}`;
const HELLO = ['Hi there!', 'Hey, driver!', 'Excuse me!', 'Good morning!', "Howdy!"];
const THANKS = [
  ["Thanks a lot! Keep the change.", 'Дуже дякую! Решту залиште собі.', 'Большое спасибо! Сдачу оставьте себе.'],
  ["Here's a 20% tip. Have a nice day!", 'Ось 20% чайових. Гарного дня!', 'Вот 20% чаевых. Хорошего дня!'],
  ['Awesome ride, man!', 'Класна поїздка, друже!', 'Классная поездка, друг!'],
  ['You can drop me off here. Thanks!', 'Можете висадити мене тут. Дякую!', 'Можете высадить меня здесь. Спасибо!'],
];
const RIDERS = ['🧑‍💼', '👩‍🎤', '🤠', '👨‍🍳', '👩‍🚀', '🧑‍🎓', '👮', '🧑‍🎨'];
const SPOTS = ['🏦', '🏨', '🍔', '🏛️', '☕', '🎭', '🏥', '🗽', '🍕', '🏟️', '🌳', '🏬', '⛪', '🚒', '🎡', '🏫'];
const VOCAB = [
  ['block', 'квартал', 'квартал'], ['tip', 'чайові', 'чаевые'], ['downtown', 'центр міста', 'центр города'], ['sidewalk', 'тротуар', 'тротуар'],
  ['traffic light', 'світлофор', 'светофор'], ['crosswalk', 'пішохідний перехід', 'пешеходный переход'], ['corner', 'ріг (вулиці)', 'угол (улицы)'],
  ['cab', 'таксі', 'такси'], ['fare', 'плата за проїзд', 'плата за проезд'], ['subway', 'метро', 'метро'], ['gas station', 'заправка', 'заправка'],
];

export const meta = { topbar: false };

export function render(root, params, app) {
  return spGame(root, params, app, {
    wid: 'c2', ico: '🚕', cls: 'sp-taxi', secs: 80, minOk: 6, vocab: VOCAB,
    title: ['Таксі-ралі', 'Такси-ралли'],
    rules: [
      ['🇺🇸 Ти — таксист у Нью-Йорку. Пасажир каже, куди їхати, англійською.', '🇺🇸 Ты — таксист в Нью-Йорке. Пассажир говорит по-английски, куда ехать.'],
      ['🧭 Північ (north) — вгору. Turn left / right — від того, куди дивиться таксі.', '🧭 Север (north) — вверх. Turn left / right — относительно того, куда смотрит такси.'],
      ['👆 Тапни перехрестя, де треба зупинитись. Правильно — отримаєш чайові 💵!', '👆 Тапни перекрёсток, где нужно остановиться. Правильно — получишь чаевые 💵!'],
    ],
    mount(c) {
      const st = c.stage;
      st.innerHTML = `<div class="sp-taxi-hd"><span class="sp-taxi-who"></span><div class="sp-taxi-bub"><div class="sp-taxi-say"></div><div class="sp-taxi-tr"></div></div><button class="sp-say" aria-label="listen">🔊</button></div>
        <div class="sp-city"><div class="sp-compass">N<br>↑</div><div class="sp-blocks"></div><div class="sp-nodes"></div><div class="sp-cab"><i></i></div></div>`;
      const q = (s) => st.querySelector(s);
      const city = q('.sp-city'), cab = q('.sp-cab');
      q('.sp-blocks').innerHTML = Array.from({ length: (N - 1) * (N - 1) }, (_, i) => `<span style="left:${((i % (N - 1)) + 0.5) / (N - 1) * 100}%;top:${(((i / (N - 1)) | 0) + 0.5) / (N - 1) * 100}%">${c.pick(SPOTS)}</span>`).join('');
      let nodesHtml = '';
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) nodesHtml += `<button class="sp-node" data-x="${x}" data-y="${y}" style="left:${x / (N - 1) * 100}%;top:${y / (N - 1) * 100}%"></button>`;
      q('.sp-nodes').innerHTML = nodesHtml;
      let pos = [2, 4], head = 'north', ride = null, n = 0, busy = false, driveA = null, ang = 0;
      q('.sp-say').onclick = () => ride && c.speak(ride.en);
      const rot = (h) => ORDER.indexOf(h) * 90;
      const px = (p) => { const w = city.clientWidth, h = city.clientHeight; return [p[0] / (N - 1) * w, p[1] / (N - 1) * h]; };
      function place() { const [x, y] = px(pos); cab.style.transform = `translate(${x}px,${y}px) rotate(${ang}deg)`; }
      const inb = (p) => p[0] >= 0 && p[1] >= 0 && p[0] < N && p[1] < N;
      const turn = (h, s) => ORDER[(ORDER.indexOf(h) + s + 4) % 4];
      function makeRide() {
        for (let t = 0; t < 60; t++) {
          const legs = [];
          const rel = Math.random() < 0.5;
          const two = Math.random() < Math.min(0.75, 0.25 + n * 0.08);
          let h = head, en = '', uk = '', ruS = '';
          if (rel) {
            const s = c.pick([-1, 1, 0]);
            h = turn(head, s); const k = 1 + ((Math.random() * 3) | 0);
            legs.push([h, k]);
            en = s ? `Turn ${s < 0 ? 'left' : 'right'} and go ${blocks(k)}` : `Go straight for ${blocks(k)}`;
            uk = s ? `Поверніть ${s < 0 ? 'ліворуч' : 'праворуч'} і проїдьте ${NUM_T[k][0]}` : `Їдьте прямо ${NUM_T[k][0]}`;
            ruS = s ? `Поверните ${s < 0 ? 'налево' : 'направо'} и проедьте ${NUM_T[k][1]}` : `Езжайте прямо ${NUM_T[k][1]}`;
            if (two) { const s2 = c.pick([-1, 1]); const h2 = turn(h, s2), k2 = 1 + ((Math.random() * 2) | 0); legs.push([h2, k2]);
              en += `, then turn ${s2 < 0 ? 'left' : 'right'} and go ${blocks(k2)}`; uk += `, потім ${s2 < 0 ? 'ліворуч' : 'праворуч'} ${NUM_T[k2][0]}`; ruS += `, потом ${s2 < 0 ? 'налево' : 'направо'} ${NUM_T[k2][1]}`; }
          } else {
            const d = c.pick(ORDER), k = 1 + ((Math.random() * 3) | 0); legs.push([d, k]);
            en = `Go ${blocks(k)} ${d}`; uk = `Їдьте ${NUM_T[k][0]} ${DIR_T[d][0]}`; ruS = `Езжайте ${NUM_T[k][1]} ${DIR_T[d][1]}`;
            if (two) { const d2 = turn(d, c.pick([-1, 1])), k2 = 1 + ((Math.random() * 2) | 0); legs.push([d2, k2]);
              en += `, then ${blocks(k2)} ${d2}`; uk += `, потім ${NUM_T[k2][0]} ${DIR_T[d2][0]}`; ruS += `, потом ${NUM_T[k2][1]} ${DIR_T[d2][1]}`; }
          }
          const path = []; let p = pos.slice(), ok = true;
          for (const [d, k] of legs) for (let i = 0; i < k; i++) { p = [p[0] + DIRS[d][0], p[1] + DIRS[d][1]]; if (!inb(p)) ok = false; path.push([p.slice(), d]); }
          if (ok) return { en: `${c.pick(HELLO)} ${en}, please.`, tr: [uk + '.', ruS + '.'], path, end: p };
        }
        return null;
      }
      function next() {
        if (!c.alive()) return;
        n += 1; busy = false;
        st.querySelectorAll('.sp-node').forEach((b) => b.classList.remove('ok', 'no', 'hint'));
        if (n > 1 && n % 4 === 0) { busy = true; return c.bonus(() => { busy = false; order(); }); }
        order();
      }
      function order() {
        ride = makeRide();
        if (!ride) { pos = [2, 2]; place(); ride = makeRide(); }
        const who = q('.sp-taxi-who'); who.textContent = RIDERS[n % RIDERS.length];
        c.anim(who, [{ transform: 'scale(0)' }, { transform: 'scale(1.15)' }, { transform: 'none' }], { duration: 380 });
        q('.sp-taxi-say').textContent = ride.en; q('.sp-taxi-tr').textContent = '';
        c.anim(q('.sp-taxi-bub'), [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300 });
        c.later(() => c.speak(ride.en), 250);
      }
      function drive(cb) {
        const pts = [[pos, head], ...ride.path];
        // кут повороту — неперервний (найкоротший розворот, без «прокруток» на 270°)
        const kf = pts.map(([p, d]) => { const dd = ((rot(d) - ang) % 360 + 540) % 360 - 180; ang += dd; const [x, y] = px(p); return { transform: `translate(${x}px,${y}px) rotate(${ang}deg)` }; });
        driveA?.cancel();
        driveA = c.anim(cab, kf, { duration: 260 * ride.path.length + 200, easing: 'ease-in-out', fill: 'forwards' });
        const last = ride.path[ride.path.length - 1];
        pos = ride.end; head = last[1];
        c.later(() => { driveA?.cancel(); driveA = null; place(); cb(); }, 260 * ride.path.length + 260);
      }
      st.addEventListener('click', (e) => {
        const b = e.target.closest('.sp-node'); if (!b || busy || !ride || !c.alive()) return;
        busy = true;
        const good = +b.dataset.x === ride.end[0] && +b.dataset.y === ride.end[1];
        const target = st.querySelector(`.sp-node[data-x="${ride.end[0]}"][data-y="${ride.end[1]}"]`);
        q('.sp-taxi-tr').textContent = c.L(ride.tr);
        if (good) { b.classList.add('ok'); c.ok(b, 12, '💵'); c.done(); } else { b.classList.add('no'); target.classList.add('hint'); c.bad(b, null); }
        drive(() => {
          const th = c.pick(THANKS);
          if (good) { q('.sp-taxi-say').textContent = th[0]; q('.sp-taxi-tr').textContent = c.L([th[1], th[2]]); c.sfx('coin'); }
          c.later(next, good ? 1300 : 1600);
        });
      });
      const onR = () => { if (!driveA) place(); };
      window.addEventListener('resize', onR);
      requestAnimationFrame(place);
      return { next, stop() { driveA?.cancel(); window.removeEventListener('resize', onR); } };
    },
  });
}
