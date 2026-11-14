// 🇬🇧 c1 «Чаювання о 5-й» — британська черга клієнтів; кожен ввічливо просить напій англійською
// (Could I have…, May I…, I'd like…). Тапни правильну чашку (підписи — рідною мовою), поки не скінчилось терпіння.
// Кожен 4-й клієнт — слово-бонус із WORDS[c1]. 75 с, ⭐ за точність. id гри 'c1-special'.
import { spGame } from './special_kit.js?v=20261114080653';

// k, чашка, добавки, uk, ru
const CUPS = {
  milk: ['☕', '🥛', 'Чай з молоком', 'Чай с молоком'],
  lemon: ['☕', '🍋', 'Чай з лимоном', 'Чай с лимоном'],
  sugar: ['☕', '🍬🍬', 'Чай із двома цукрами', 'Чай с двумя кусочками сахара'],
  milksug: ['☕', '🥛🍬', 'Чай з молоком і цукром', 'Чай с молоком и сахаром'],
  black: ['☕', '', 'Чорний чай, нічого не додавати', 'Чёрный чай, ничего не добавлять'],
  green: ['🍵', '', 'Зелений чай', 'Зелёный чай'],
  earl: ['🫖', '🌸', 'Чайник «Ерл Грей»', 'Чайник «Эрл Грей»'],
  coffee: ['☕', '🫘', 'Кава', 'Кофе'],
  cocoa: ['☕', '🍫', 'Гарячий шоколад', 'Горячий шоколад'],
  scone: ['🧁', '🍓', 'Сконі з джемом і вершками', 'Сконы с джемом и сливками'],
  biscuit: ['🍪', '', 'Печиво (biscuit)', 'Печенье (biscuit)'],
  sandwich: ['🥪', '🥒', 'Сендвіч з огірком', 'Сэндвич с огурцом'],
  cake: ['🍰', '', 'Шматочок бісквіта', 'Кусочек бисквита'],
};
// [k, англійське прохання, uk, ru]
const ORDERS = [
  ['milk', 'Could I have a cup of tea with milk, please?', 'Можна мені чашку чаю з молоком, будь ласка?', 'Можно мне чашку чая с молоком, пожалуйста?'],
  ['milk', "I'd like a white tea, please.", 'Мені чай з молоком (white tea), будь ласка.', 'Мне чай с молоком (white tea), пожалуйста.'],
  ['lemon', 'May I have a tea with a slice of lemon?', 'Можна мені чай зі скибочкою лимона?', 'Можно мне чай с долькой лимона?'],
  ['sugar', 'Tea with two sugars, please. No milk.', 'Чай із двома цукрами, будь ласка. Без молока.', 'Чай с двумя кусочками сахара, пожалуйста. Без молока.'],
  ['milksug', 'Milk and one sugar, if you don\'t mind.', 'З молоком і цукром, якщо ваша ласка.', 'С молоком и сахаром, если не трудно.'],
  ['black', 'Just black tea for me, nothing in it, thanks.', 'Мені просто чорний чай, нічого не додавайте, дякую.', 'Мне просто чёрный чай, ничего не добавляйте, спасибо.'],
  ['black', 'Could I have it black, please?', 'Можна без молока (black), будь ласка?', 'Можно без молока (black), пожалуйста?'],
  ['green', 'Would it be possible to have a green tea?', 'Чи можна мені зелений чай?', 'Можно ли мне зелёный чай?'],
  ['earl', 'A pot of Earl Grey, if you would be so kind.', 'Чайник «Ерл Грей», якщо ваша ласка.', 'Чайник «Эрл Грей», будьте так любезны.'],
  ['coffee', 'Sorry, could I have a coffee instead?', 'Перепрошую, можна мені краще каву?', 'Извините, можно мне лучше кофе?'],
  ['cocoa', "I'd love a hot chocolate, please. It's freezing!", 'Я б випив гарячого шоколаду. Так холодно!', 'Я бы выпил горячего шоколада. Так холодно!'],
  ['scone', 'May I have a scone with jam and cream?', 'Можна мені скон із джемом і вершками?', 'Можно мне скон с джемом и сливками?'],
  ['biscuit', 'Could you pass me a biscuit, please?', 'Передайте мені печиво, будь ласка.', 'Передайте мне печенье, пожалуйста.'],
  ['sandwich', "I'll have a cucumber sandwich, please.", 'Мені сендвіч з огірком, будь ласка.', 'Мне сэндвич с огурцом, пожалуйста.'],
  ['cake', 'A slice of Victoria sponge would be lovely.', 'Шматочок бісквіта «Вікторія» був би чудовим.', 'Кусочек бисквита «Виктория» был бы чудесным.'],
  ['earl', "Could I trouble you for some Earl Grey?", 'Можна потурбувати вас — мені «Ерл Грей»?', 'Можно побеспокоить вас — мне «Эрл Грей»?'],
];
const GUESTS = ['👵', '👴', '🧑‍🦰', '👩‍🦳', '🤵', '💂', '👩‍💼', '🧔'];
const VOCAB = [
  ['queue', 'черга', 'очередь'], ['cuppa', 'чашечка чаю', 'чашечка чая'], ['kettle', 'чайник (для кип\'ятіння)', 'чайник (для кипячения)'],
  ['biscuit', 'печиво', 'печенье'], ['lovely', 'чудовий', 'чудесный'], ['cheers', 'дякую / будьмо', 'спасибо / будем'],
  ['teapot', 'заварник', 'заварочный чайник'], ['saucer', 'блюдце', 'блюдце'], ['sugar', 'цукор', 'сахар'], ['polite', 'ввічливий', 'вежливый'],
];
const PATIENCE = 13000;

export const meta = { topbar: false };

export function render(root, params, app) {
  return spGame(root, params, app, {
    wid: 'c1', ico: '🫖', cls: 'sp-tea', secs: 75, minOk: 7, vocab: VOCAB,
    title: ['Чаювання о 5-й', 'Чаепитие в 5 часов'],
    rules: [
      ['🇬🇧 О п\'ятій у Лондоні — час чаю! Клієнти стоять у черзі й ввічливо просять англійською.', '🇬🇧 В пять в Лондоне — время чая! Клиенты стоят в очереди и вежливо просят по-английски.'],
      ['☕ Прочитай (або послухай 🔊) прохання і тапни правильну чашку.', '☕ Прочитай (или послушай 🔊) просьбу и тапни правильную чашку.'],
      ['⏳ Не барися: терпіння клієнта тане! Кожен 4-й — слово-бонус.', '⏳ Не медли: терпение клиента тает! Каждый 4-й — слово-бонус.'],
    ],
    mount(c) {
      const st = c.stage;
      st.innerHTML = `<div class="sp-tea-shop"><div class="sp-tea-queue"></div><div class="sp-tea-guest"></div>
        <div class="sp-tea-bub"><div class="sp-tea-say"></div><div class="sp-tea-tr"></div><button class="sp-say" aria-label="listen">🔊</button></div>
        <div class="sp-pat"><i></i></div></div><div class="sp-tea-tray"></div>`;
      const q = (s) => st.querySelector(s);
      let bag = [], cur = null, n = 0, patA = null;
      q('.sp-say').onclick = () => cur && c.speak(cur[1]);
      const polite = (s) => c.esc(s).replace(/\b(please|Could|May|Would|thanks|if you don't mind|if you would be so kind|Sorry|lovely)\b/g, '<b>$1</b>');
      function queue() { q('.sp-tea-queue').innerHTML = [1, 2, 3].map((i) => `<span style="--i:${i}">${GUESTS[(n + i) % GUESTS.length]}</span>`).join(''); }
      function next() {
        if (!c.alive()) return;
        n += 1;
        if (n > 1 && n % 4 === 0) { q('.sp-tea-tray').innerHTML = ''; return c.bonus(order); }
        order();
      }
      function order() {
        if (!c.alive()) return;
        if (!bag.length) bag = c.shuffle(ORDERS);
        cur = bag.pop();
        queue();
        const gEl = q('.sp-tea-guest'); gEl.textContent = GUESTS[n % GUESTS.length];
        c.anim(gEl, [{ transform: 'translateX(-120%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
        q('.sp-tea-say').innerHTML = polite(cur[1]);
        q('.sp-tea-tr').textContent = '';
        c.anim(q('.sp-tea-bub'), [{ transform: 'scale(.7)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.2,1.4,.4,1)', delay: 150, fill: 'backwards' });
        c.later(() => c.speak(cur[1]), 350);
        const keys = c.shuffle([cur[0], ...c.shuffle(Object.keys(CUPS).filter((k) => k !== cur[0])).slice(0, 3)]);
        q('.sp-tea-tray').innerHTML = keys.map((k, i) => { const d = CUPS[k]; return `<button class="sp-cup" data-k="${k}" style="--d:${i * 70}ms">
          <span class="sp-cup-e">${d[0]}<small>${d[1]}</small></span><span class="sp-cup-l">${c.esc(c.L([d[2], d[3]]))}</span></button>`; }).join('');
        patA?.cancel();
        patA = c.anim(q('.sp-pat i'), [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: PATIENCE, easing: 'linear', fill: 'forwards' });
        const my = cur;
        c.later(() => { if (cur === my && c.alive()) leave(false); }, PATIENCE);
      }
      function leave(happy) {
        const gEl = q('.sp-tea-guest');
        q('.sp-tea-tr').textContent = c.L([cur[2], cur[3]]);
        if (!happy) { c.bad(gEl, null); gEl.textContent = '😤'; }
        cur = null;
        q('.sp-tea-tray').querySelectorAll('button').forEach((b) => { b.disabled = true; });
        c.later(() => {
          c.anim(gEl, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(140%)', opacity: 0 }], { duration: 380, easing: 'ease-in', fill: 'forwards' });
          c.later(next, 400);
        }, happy ? 900 : 1500);
      }
      st.addEventListener('click', (e) => {
        const b = e.target.closest('.sp-cup'); if (!b || b.disabled || !cur || !c.alive()) return;
        if (b.dataset.k === cur[0]) {
          b.classList.add('ok'); c.ok(b, 10); c.done();
          patA?.pause();
          const gEl = q('.sp-tea-guest');
          c.anim(b, [{ transform: 'none' }, { transform: `translate(${(gEl.getBoundingClientRect().left - b.getBoundingClientRect().left) * 0.6}px,-60px) scale(.7)`, opacity: 0.2 }], { duration: 520, easing: 'ease-in', fill: 'forwards' });
          c.later(() => { gEl.textContent = '😊'; c.anim(gEl, [{ transform: 'none' }, { transform: 'translateY(-14px) scale(1.1)' }, { transform: 'none' }], { duration: 450 }); }, 380);
          leave(true);
        } else { b.classList.add('no'); b.disabled = true; c.bad(b, null); }
      });
      return { next, stop() { patA?.cancel(); } };
    },
  });
}
