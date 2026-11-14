// 🇬🇪 c19 «Хачапурі-майстер» — на дошці тісто (човник-аджарулі / кругле імерулі / мегрулі).
// Угорі — рецепт АНГЛІЙСЬКОЮ (3–4 інгредієнти по черзі). Тапай на лотку інгредієнт (емодзі без підписів) — він лягає на тісто.
// Хибний — промах (і підказка: як він називається англійською + переклад потрібного). Рецепт готовий — хачапурі їде в піч, +30.
// Звичайний режим — раунд на час (і бонус за швидкість). 🐢 calm — без часу: 8 хачапурі у власному темпі.
// Музика — оригінальний WebAudio-синт: «поліфонія» з трьох голосів над бурдоном (84 BPM).
import { makeGame, tr, esc, shuffle, pick, midi } from './_sp2kit.js?v=20261114113225';
import * as S from './state.js?v=20261114113225';

export const meta = { topbar: false };

// [емодзі, english, uk, ru]
const INGR = [['🧀', 'cheese', 'сир', 'сыр'], ['🥚', 'egg', 'яйце', 'яйцо'], ['🧈', 'butter', 'масло', 'масло'], ['🍅', 'tomato', 'помідор', 'помидор'],
  ['🍄', 'mushroom', 'гриб', 'гриб'], ['🧅', 'onion', 'цибуля', 'лук'], ['🧄', 'garlic', 'часник', 'чеснок'], ['🫑', 'pepper', 'перець', 'перец'],
  ['🥬', 'spinach', 'шпинат', 'шпинат'], ['🥔', 'potato', 'картопля', 'картошка'], ['🥩', 'meat', "м'ясо", 'мясо'], ['🌽', 'corn', 'кукурудза', 'кукуруза'],
  ['🌿', 'herbs', 'зелень', 'зелень'], ['🫒', 'olive', 'оливка', 'оливка'], ['🧂', 'salt', 'сіль', 'соль'], ['🍯', 'honey', 'мед', 'мёд'],
  ['🫘', 'beans', 'квасоля', 'фасоль'], ['🥕', 'carrot', 'морква', 'морковь'], ['🌶️', 'chili', 'чилі', 'чили'], ['🌰', 'nuts', 'горіхи', 'орехи'],
  ['🍒', 'cherry', 'вишня', 'вишня'], ['🍎', 'apple', 'яблуко', 'яблоко'], ['🐟', 'fish', 'риба', 'рыба'], ['🥛', 'milk', 'молоко', 'молоко'],
  ['🍋', 'lemon', 'лимон', 'лимон'], ['🥒', 'cucumber', 'огірок', 'огурец'], ['🍇', 'grapes', 'виноград', 'виноград']];
const SHAPES = [
  { key: 'boat', en: 'Adjarian khachapuri', uk: 'аджарський (човник)', ru: 'аджарский (лодочка)' },
  { key: 'round', en: 'Imeretian khachapuri', uk: 'імеретинський (круглий)', ru: 'имеретинский (круглый)' },
  { key: 'mega', en: 'Megrelian khachapuri', uk: 'мегрельський (з сиром зверху)', ru: 'мегрельский (с сыром сверху)' },
];
const YUM = ['Gemrielia! 😋', 'Delicious!', 'Yummy!', 'Perfect bake!', 'Gaumarjos! 🎉'];
const SPOTS = [[-26, -8], [0, -14], [26, -8], [-14, 10], [14, 10], [0, 0]]; // % зсуву від центру тіста

const BPM = 84;
// три голоси (ступені від D): бас-бурдон, середній «мелодія», верхній — паралельні кварти/квінти, як у грузинському хорі
const MID = [0, 2, 3, 2, 0, null, -2, 0, 2, 3, 5, 3, 2, null, 0, -2];
const TOP = [7, 7, 8, 7, 5, null, 5, 7, 7, 8, 10, 8, 7, null, 5, 3];

export function render(root, params, app) {
  const wid = 'c19';
  const CALM = !!S.calm?.();
  const GOAL = 8; // calm: скільки хачапурі
  let G = null;
  const nat = (g) => tr([g[2], g[3]]);

  function newOrder(K) {
    const n = G.done >= 3 ? 4 : 3;
    const last = G.recipe || [];
    G.recipe = shuffle(INGR.filter((g) => !last.includes(g))).slice(0, n);
    G.shape = SHAPES[G.done % SHAPES.length];
    G.idx = 0; G.hint = false; G.t0 = K.now(); G.busy = false;
    const extra = shuffle(INGR.filter((g) => !G.recipe.includes(g))).slice(0, 8 - n);
    G.tray.innerHTML = shuffle([...G.recipe, ...extra]).map((g) => `<button class="sp2-c19-ing" data-en="${esc(g[1])}" aria-label="ingredient">${g[0]}</button>`).join('');
    G.dough.className = `sp2-c19-dough ${G.shape.key}`;
    G.dough.innerHTML = '<i class="sp2-c19-rim"></i>';
    G.dough.classList.remove('sp2-c19-in'); void G.dough.offsetWidth; G.dough.classList.add('sp2-c19-in');
    drawCard(K);
  }
  function drawCard(K) {
    const cur = G.recipe[G.idx];
    G.card.innerHTML = `<small>📜 ${esc(G.shape.en)} · <span>${esc(tr(G.shape))}</span></small>
      <div class="sp2-c19-steps">${G.recipe.map((g, i) => `<span class="${i < G.idx ? 'done' : i === G.idx ? 'cur' : ''}">${i < G.idx ? `${g[0]} ` : `${i + 1}. `}<em>add</em> ${esc(g[1])}</span>`).join('')}</div>
      <em class="sp2-c19-hint">${G.hint && cur ? `💡 ${esc(cur[1])} = ${esc(nat(cur))}` : '&nbsp;'}</em>
      <button class="sp2-c19-say" data-say="1" aria-label="say">🔊</button>`;
    G.card.classList.remove('sp2-in'); void G.card.offsetWidth; G.card.classList.add('sp2-in');
  }

  function tapIng(K, el) {
    if (!K.running || G.busy || el.classList.contains('used')) return;
    const cur = G.recipe[G.idx];
    const g = INGR.find((x) => x[1] === el.dataset.en);
    if (!cur || !g) return;
    if (g === cur) {
      el.classList.add('used');
      K.hit(el, 10, pick(['Good!', 'Yes! ' + cur[1], 'Nice!', 'Kargi! 👍']));
      K.sfx('pop'); K.hap('light');
      K.learn(cur[1], nat(cur)); K.speak(cur[1]);
      const [dx, dy] = SPOTS[G.idx % SPOTS.length];
      const t = document.createElement('span'); t.className = 'sp2-c19-top'; t.textContent = g[0];
      t.style.left = `${50 + dx}%`; t.style.top = `${50 + dy}%`;
      G.dough.appendChild(t);
      G.idx++; G.hint = false;
      if (G.idx >= G.recipe.length) bake(K); else drawCard(K);
    } else {
      el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope');
      K.miss(el, cur[1], `✗ ${g[0]} = ${g[1]}`); K.sfx('wrong');
      G.hint = true; drawCard(K);
    }
  }
  function bake(K) {
    G.busy = true; drawCard(K);
    const quick = !CALM && K.now() - G.t0 < G.recipe.length * 2.4;
    K.later(() => {
      G.dough.classList.add('bake'); G.oven.classList.add('on'); K.sfx('whoosh');
    }, 250);
    K.later(() => {
      G.dough.classList.remove('bake'); G.dough.classList.add('baked'); G.oven.classList.remove('on');
      const bonus = 30 + (quick ? 10 : 0);
      K.score += bonus; K.hud(); K.sfx('combo'); K.hap('medium');
      K.toast(`🥟 +${bonus} · ${pick(YUM)}${quick ? ' ⚡' : ''}`, 'combo');
      G.done++; G.cnt.textContent = CALM ? `${G.done}/${GOAL}` : String(G.done);
      G.plate.classList.remove('got'); void G.plate.offsetWidth; G.plate.classList.add('got');
    }, 1250);
    K.later(() => {
      if (!K.running) return;
      if (CALM && G.done >= GOAL) { K.end(); return; }
      newOrder(K);
    }, 2000);
  }

  const cleanup = makeGame(root, params, app, {
    wid, cls: 'sp2-c19', ico: '🥟', secs: CALM ? 900 : 90, minOk: 12,
    title: { uk: 'Хачапурі-майстер', ru: 'Хачапури-мастер' },
    rules: [
      { uk: '📜 Угорі — рецепт англійською: які інгредієнти покласти на тісто і в якому порядку.', ru: '📜 Вверху — рецепт по-английски: какие ингредиенты положить на тесто и в каком порядке.' },
      { uk: '👆 Тапни на лотку ПОТРІБНИЙ інгредієнт — він ляже на хачапурі. Не той — промах.', ru: '👆 Тапни на лотке НУЖНЫЙ ингредиент — он ляжет на хачапури. Не тот — промах.' },
      { uk: '🔥 Рецепт готовий — хачапурі в піч, +30 (швидко — ще +10)! 🔊 — послухати слово.', ru: '🔥 Рецепт готов — хачапури в печь, +30 (быстро — ещё +10)! 🔊 — послушать слово.' },
    ],
    beat: {
      bpm: BPM, steps: 2,
      fn(K, step, t) {
        const sy = K.synth; if (!sy) return;
        const D = 50; // D3
        if (step % 8 === 0) { sy.tone(midi(D - 12), t, BEATS(4), { w: 'sine', v: 0.16 }); sy.tone(midi(D - 5), t, BEATS(4), { w: 'sine', v: 0.06 }); }
        if (step % 4 === 2) sy.noise(t, 0.04, { v: 0.05, f: 2400, type: 'bandpass' }); // доли (дхол)
        if (step % 2) return;
        const i = (step >> 1) % 16, m = MID[i], tp = TOP[i];
        if (m != null) sy.tone(midi(D + 12 + m), t, 0.5, { w: 'triangle', v: 0.08 });
        if (tp != null && (step >> 5) % 2 === 1) sy.tone(midi(D + 12 + tp), t, 0.5, { w: 'sine', v: 0.06 });
      },
    },
    build(K) {
      K.field.innerHTML = `<div class="sp2-c19-card"></div>
        <div class="sp2-c19-stage"><i class="sp2-c19-vine"></i><i class="sp2-c19-peaks"></i>
          <div class="sp2-c19-oven"><i></i></div>
          <div class="sp2-c19-board"><div class="sp2-c19-dough boat"><i class="sp2-c19-rim"></i></div></div>
          <div class="sp2-c19-plate">🍽️<em>${CALM ? `0/${GOAL}` : '0'}</em></div></div>
        <div class="sp2-c19-tray"></div>`;
      G = {
        recipe: [], idx: 0, done: 0, hint: false, busy: true, shape: SHAPES[0], t0: 0,
        card: K.$('.sp2-c19-card'), tray: K.$('.sp2-c19-tray'), dough: K.$('.sp2-c19-dough'), oven: K.$('.sp2-c19-oven'),
        plate: K.$('.sp2-c19-plate'), cnt: K.$('.sp2-c19-plate em'),
      };
      G.card.innerHTML = `<small>🥟</small><b>${esc(tr({ uk: 'Піч розігрівається…', ru: 'Печь разогревается…' }))}</b>`;
      G.tray.addEventListener('pointerdown', (e) => { const b = e.target.closest('.sp2-c19-ing'); if (b) { e.preventDefault(); tapIng(K, b); } });
      G.card.addEventListener('click', (e) => { if (e.target.closest('[data-say]') && G.recipe[G.idx]) K.speakAlways(G.recipe[G.idx][1]); });
    },
    start(K) { newOrder(K); },
    frame() { /* усе на подіях і CSS-переходах */ },
  });
  // 🐢 calm: у вступі замість «⏱ 900 s» — «без часу»
  if (CALM) {
    const mini = root.querySelector('.sp2-mini');
    if (mini) mini.textContent = mini.textContent.replace(/⏱\s*\d+\s*s/, tr({ uk: `🐢 без часу · ${GOAL} хачапурі`, ru: `🐢 без времени · ${GOAL} хачапури` }));
  }
  return cleanup;
}
const BEATS = (n) => (60 / BPM) * n;
