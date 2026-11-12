// 🇫🇷 c4 «Пекарня-круасан» — паризька boulangerie. Клієнт замовляє англійською (Two croissants and a baguette, please),
// ти викладаєш випічку на тацю, тиснеш «Serve», а потім називаєш суму англійською (That's seven euros fifty).
// Кожен 3-й клієнт — слово-бонус. 85 с, ⭐ за точність. id 'c4-special'.
import { spGame } from './special_kit.js?v=20261112180927';

// k, emoji, en (однина), en (множина), ціна €, uk, ru
const GOODS = [
  ['cro', '🥐', 'croissant', 'croissants', 2, 'круасан', 'круассан'],
  ['bag', '🥖', 'baguette', 'baguettes', 1.5, 'багет', 'багет'],
  ['pac', '🍫', 'pain au chocolat', 'pains au chocolat', 2.5, 'булочка з шоколадом', 'булочка с шоколадом'],
  ['mac', '🍪', 'macaron', 'macarons', 1, 'макарон (тістечко)', 'макарон (пирожное)'],
  ['ecl', '🧁', 'éclair', 'éclairs', 3, 'еклер', 'эклер'],
  ['tar', '🥧', 'fruit tart', 'fruit tarts', 4, 'фруктовий тарт', 'фруктовый тарт'],
  ['bri', '🍞', 'brioche', 'brioches', 3, 'бріош', 'бриошь'],
  ['cre', '🥞', 'crêpe', 'crêpes', 2, 'млинець', 'блин'],
];
const G = Object.fromEntries(GOODS.map((g) => [g[0], g]));
const NUMS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const QN = ['', 'a', 'two', 'three'];
const OPEN = ['Bonjour! ', 'Hello! ', 'Good morning! ', 'Hi! '];
const ASK = ["I'd like ", 'Could I have ', "I'll take ", 'Can I get ', 'May I have '];
const END = [', please.', ', please. To take away.', ', please. For here.', ', s\'il vous plaît!'];
const CLIENTS = ['👩‍🦰', '🧑‍🎨', '👨‍🦳', '👩', '🧒', '🕵️', '👨‍🎤', '👵'];
const VOCAB = [
  ['bakery', 'пекарня', 'пекарня'], ['pastry', 'випічка', 'выпечка'], ['flour', 'борошно', 'мука'], ['butter', 'масло', 'сливочное масло'],
  ['dough', 'тісто', 'тесто'], ['change', 'решта', 'сдача'], ['receipt', 'чек', 'чек'], ['to take away', 'з собою', 'с собой'],
  ['crispy', 'хрусткий', 'хрустящий'], ['fresh', 'свіжий', 'свежий'], ['cashier', 'касир', 'кассир'],
];
const say = (v) => { const e = Math.floor(v + 1e-9), c = Math.round((v - e) * 100); return `${NUMS[e] || e} euro${e === 1 ? '' : 's'}${c ? ` ${c === 50 ? 'fifty' : c}` : ''}`; };

export const meta = { topbar: false };

export function render(root, params, app) {
  return spGame(root, params, app, {
    wid: 'c4', ico: '🥐', cls: 'sp-bake', secs: 85, minOk: 5, vocab: VOCAB,
    title: ['Пекарня-круасан', 'Пекарня-круассан'],
    rules: [
      ['🇫🇷 Ранок у паризькій пекарні! Клієнти замовляють англійською.', '🇫🇷 Утро в парижской пекарне! Клиенты заказывают по-английски.'],
      ['🥐 Тапай випічку на полиці — вона лягає на тацю (тап по таці — прибрати). Потім «Serve».', '🥐 Тапай выпечку на полке — она ложится на поднос (тап по подносу — убрать). Потом «Serve».'],
      ['💶 Наостанок обери суму англійською — рахуй ціни на ярликах!', '💶 Напоследок выбери сумму по-английски — считай цены на ярлыках!'],
    ],
    mount(c) {
      const st = c.stage;
      st.innerHTML = `<div class="sp-bake-hd"><span class="sp-bake-who"></span><div class="sp-bake-bub"><div class="sp-bake-say"></div><div class="sp-bake-tr"></div></div><button class="sp-say" aria-label="listen">🔊</button></div>
        <div class="sp-shelf">${GOODS.map((g) => `<button class="sp-good" data-k="${g[0]}"><span class="sp-good-e">${g[1]}</span><span class="sp-good-n">${c.esc(g[2])}</span><span class="sp-tag">€${g[4].toFixed(2)}</span></button>`).join('')}</div>
        <div class="sp-tray"><div class="sp-tray-in"></div><button class="sp-serve" disabled>🛎 Serve</button></div><div class="sp-pay"></div>`;
      const q = (s) => st.querySelector(s);
      let ord = null, tray = [], n = 0, phase = 'off';
      q('.sp-say').onclick = () => ord && c.speak(ord.en);
      function makeOrder() {
        const kinds = c.shuffle(GOODS).slice(0, 1 + ((Math.random() * Math.min(3, 1 + n / 3)) | 0));
        const items = kinds.map((g) => [g[0], 1 + ((Math.random() * (kinds.length > 2 ? 2 : 3)) | 0)]);
        const parts = items.map(([k, m]) => `${QN[m]} ${m > 1 ? G[k][3] : G[k][2]}`.replace(/^a (é|e)/, 'an $1'));
        const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
        const total = items.reduce((s, [k, m]) => s + G[k][4] * m, 0);
        const tr = items.map(([k, m]) => `${m} × ${c.L([G[k][5], G[k][6]])}`).join(', ');
        return { items, total, en: c.pick(OPEN) + c.pick(ASK) + list + c.pick(END), tr };
      }
      function next() {
        if (!c.alive()) return;
        n += 1;
        if (n > 1 && n % 3 === 0) { phase = 'off'; return c.bonus(order); }
        order();
      }
      function order() {
        ord = makeOrder(); tray = []; phase = 'pick'; drawTray();
        q('.sp-pay').innerHTML = '';
        const who = q('.sp-bake-who'); who.textContent = CLIENTS[n % CLIENTS.length];
        c.anim(who, [{ transform: 'translateX(-80px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
        q('.sp-bake-say').textContent = ord.en; q('.sp-bake-tr').textContent = '';
        c.anim(q('.sp-bake-bub'), [{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'none' }], { duration: 300 });
        c.later(() => c.speak(ord.en), 300);
      }
      function drawTray() {
        q('.sp-tray-in').innerHTML = tray.map((k, i) => `<button class="sp-tray-it" data-i="${i}">${G[k][1]}</button>`).join('');
        q('.sp-serve').disabled = phase !== 'pick' || !tray.length;
      }
      function serve() {
        const need = {}; ord.items.forEach(([k, m]) => { need[k] = m; });
        const got = {}; tray.forEach((k) => { got[k] = (got[k] || 0) + 1; });
        const keys = new Set([...Object.keys(need), ...Object.keys(got)]);
        const good = [...keys].every((k) => need[k] === got[k]);
        q('.sp-bake-tr').textContent = ord.tr;
        if (!good) {
          c.bad(q('.sp-tray'), ord.items.map(([k]) => G[k][2])[0]);
          q('.sp-bake-say').textContent = "Hmm, that's not what I ordered…";
          tray = ord.items.flatMap(([k, m]) => Array(m).fill(k)); drawTray(); // показуємо правильне
        } else c.ok(q('.sp-tray'), 10);
        phase = 'pay'; q('.sp-serve').disabled = true;
        c.later(pay, good ? 400 : 1300);
      }
      function pay() {
        if (!c.alive()) return;
        const t = ord.total;
        const alts = new Set([t]);
        const pool = c.shuffle([t + 1, t - 1, t + 0.5, t - 0.5, t + 2, t * 2, t + 1.5].filter((v) => v > 0 && v <= 20));
        for (const v of pool) { if (alts.size >= 3) break; alts.add(v); }
        const opts = c.shuffle([...alts]);
        q('.sp-bake-say').textContent = 'How much is that?';
        q('.sp-pay').innerHTML = `<div class="sp-pay-q">💶 ${c.esc(c.L(['Скільки з клієнта?', 'Сколько с клиента?']))}</div>` +
          opts.map((v) => `<button class="sp-pay-o" data-v="${v}">That's ${say(v)}</button>`).join('');
        c.anim(q('.sp-pay'), [{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.2,1.2,.4,1)' });
      }
      st.addEventListener('click', (e) => {
        if (!c.alive()) return;
        const g = e.target.closest('.sp-good');
        if (g && phase === 'pick') {
          if (tray.length >= 9) return;
          tray.push(g.dataset.k); c.sfx('pop');
          drawTray();
          const it = q('.sp-tray-in').lastElementChild;
          const r0 = g.getBoundingClientRect(), r1 = it.getBoundingClientRect();
          c.anim(it, [{ transform: `translate(${r0.left - r1.left}px,${r0.top - r1.top}px) scale(1.4)` }, { transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.9,.3,1.15)' });
          return;
        }
        const ti = e.target.closest('.sp-tray-it');
        if (ti && phase === 'pick') { tray.splice(+ti.dataset.i, 1); c.sfx('tap'); drawTray(); return; }
        if (e.target.closest('.sp-serve') && phase === 'pick' && tray.length) { serve(); return; }
        const o = e.target.closest('.sp-pay-o');
        if (o && phase === 'pay') {
          phase = 'off';
          const good = Math.abs(+o.dataset.v - ord.total) < 0.01;
          if (good) { o.classList.add('ok'); c.ok(o, 10, '💶'); c.done(); c.speak(o.textContent); q('.sp-bake-say').textContent = 'Merci! Have a lovely day!'; }
          else { o.classList.add('no'); c.bad(o, null); st.querySelector(`.sp-pay-o[data-v="${ord.total}"]`)?.classList.add('ok'); q('.sp-bake-say').textContent = `No, that's ${say(ord.total)}.`; }
          c.later(() => { tray = []; drawTray(); next(); }, good ? 1000 : 1800);
        }
      });
      return { next };
    },
  });
}
