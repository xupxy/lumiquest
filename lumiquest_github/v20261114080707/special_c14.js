// 🇹🇭 c14 «Плавучий ринок» — човники-лотки пливуть каналом у два ряди, на кожному товар (емодзі).
// Угорі — список покупок АНГЛІЙСЬКОЮ (3 товари). Тапни човник із потрібним товаром — купуєш, він летить у твій кошик.
// Хибний товар — промах (і підказка: як він називається англійською + переклад поточного слова). Увесь список — бонус.
// Музика — оригінальний WebAudio-синт (100 BPM, «ранат»-ксилофон на пентатоніці).
import { makeGame, tr, esc, shuffle, pick, midi } from './_sp2kit.js?v=20261114080653';

export const meta = { topbar: false };

// [емодзі, english, uk, ru]
const GOODS = [['🥭', 'mango', 'манго', 'манго'], ['🥥', 'coconut', 'кокос', 'кокос'], ['🍌', 'banana', 'банан', 'банан'], ['🍍', 'pineapple', 'ананас', 'ананас'],
  ['🍚', 'rice', 'рис', 'рис'], ['🍜', 'noodles', 'локшина', 'лапша'], ['🦐', 'shrimp', 'креветка', 'креветка'], ['🐟', 'fish', 'риба', 'рыба'],
  ['🌶️', 'chili', 'перець чилі', 'перец чили'], ['🍋', 'lemon', 'лимон', 'лимон'], ['🥚', 'egg', 'яйце', 'яйцо'], ['🌽', 'corn', 'кукурудза', 'кукуруза'],
  ['🍵', 'tea', 'чай', 'чай'], ['🌸', 'flower', 'квітка', 'цветок'], ['👒', 'hat', 'капелюх', 'шляпа'], ['🏮', 'lantern', 'ліхтарик', 'фонарик'],
  ['🍉', 'watermelon', 'кавун', 'арбуз'], ['🍲', 'soup', 'суп', 'суп'], ['🥄', 'spoon', 'ложка', 'ложка'], ['🧺', 'basket', 'кошик', 'корзина'],
  ['🦀', 'crab', 'краб', 'краб'], ['🦑', 'squid', 'кальмар', 'кальмар'], ['🍗', 'chicken', 'курка', 'курица'], ['🥜', 'peanuts', 'арахіс', 'арахис'],
  ['🧄', 'garlic', 'часник', 'чеснок'], ['🧅', 'onion', 'цибуля', 'лук'], ['🥕', 'carrot', 'морква', 'морковь'], ['🥒', 'cucumber', 'огірок', 'огурец'],
  ['🍅', 'tomato', 'помідор', 'помидор'], ['🍨', 'ice cream', 'морозиво', 'мороженое'], ['🐘', 'elephant', 'слон', 'слон'], ['☂️', 'umbrella', 'парасолька', 'зонтик']];

const BPM = 100, BEAT = 60 / BPM;
const PENTA = [60, 62, 64, 67, 69, 72, 74, 76];
const MEL = [4, 5, 4, 3, 2, null, 3, 4, 5, 7, 6, 5, 4, null, 3, 2, 0, 2, 3, 4, 3, 2, 0, null, 2, 3, 4, 5, 4, 3, 2, null];
const ROOF = ['#c8102e', '#e6b422', '#1fa38a', '#e8336e', '#ff7a2e'];

export function render(root, params, app) {
  const wid = 'c14';
  let G = null;
  const nat = (g) => tr([g[2], g[3]]);

  function newList(K) {
    const recent = G.lastList || [];
    G.list = shuffle(GOODS.filter((g) => !recent.includes(g))).slice(0, 3);
    G.lastList = G.list; G.idx = 0; G.hint = false;
    drawList(K);
  }
  function drawList(K) {
    const cur = G.list[G.idx];
    G.card.innerHTML = `<small>🛒 ${esc(tr({ uk: 'Купи за списком:', ru: 'Купи по списку:' }))}</small>
      <div class="sp2-c14-list">${G.list.map((g, i) => `<span class="${i < G.idx ? 'done' : i === G.idx ? 'cur' : ''}">${i < G.idx ? `${g[0]} ` : ''}${esc(g[1])}</span>`).join('')}</div>
      <em class="sp2-c14-hint">${G.hint && cur ? `💡 ${esc(cur[1])} = ${esc(nat(cur))}` : '&nbsp;'}</em>
      <button class="sp2-c14-say" data-say="1" aria-label="say">🔊</button>`;
    G.card.classList.remove('sp2-in'); void G.card.offsetWidth; G.card.classList.add('sp2-in');
    G.since = 0;
  }

  function spawn(K) {
    const cur = G.list[G.idx];
    const busyLanes = [0, 1].map((l) => G.boats.some((b) => !b.gone && b.lane === l && b.x > G.W - 130));
    const lanes = [0, 1].filter((l) => !busyLanes[l]);
    if (!lanes.length) return;
    const onScreen = G.boats.some((b) => !b.gone && b.g === cur);
    const want = cur && !onScreen && (G.since >= 2 || Math.random() < 0.38);
    let g;
    if (want) { g = cur; G.since = 0; } else {
      g = pick(GOODS.filter((x) => x !== cur && !G.boats.some((b) => !b.gone && b.g === x))); G.since++;
    }
    const lane = pick(lanes);
    const el = document.createElement('button');
    el.className = 'sp2-c14-boat';
    el.style.setProperty('--roof', pick(ROOF));
    el.innerHTML = `<span class="sp2-c14-item">${g[0]}</span><i class="sp2-c14-hull"></i><i class="sp2-c14-vendor">${pick(['👩🏽', '👨🏽', '👵🏽', '👴🏽'])}</i>`;
    G.water.appendChild(el);
    const b = { el, g, lane, x: G.W + 10, y: G.laneY[lane], bob: Math.random() * 6, gone: false };
    G.boats.push(b);
    place(b, 0);
  }
  function place(b, t) {
    const y = b.y + Math.sin(t * 2.4 + b.bob) * 3;
    b.el.style.transform = `translate3d(${b.x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
  }

  function tapBoat(K, el) {
    const b = G.boats.find((x) => x.el === el && !x.gone);
    if (!b || !K.running) return;
    const cur = G.list[G.idx];
    if (b.g === cur) {
      b.gone = true; el.classList.add('sold');
      K.hit(el, 10, pick(['Khop khun! 🙏', 'Great buy!', 'Yes! ' + cur[1], 'Nice!']));
      K.sfx('coin'); K.hap('medium');
      K.learn(cur[1], nat(cur)); K.speak(cur[1]);
      fly(K, b);
      G.idx++; G.hint = false;
      if (G.idx >= G.list.length) {
        K.score += 30; K.hud(); K.sfx('combo'); K.toast('🛍️ +30 · Shopping done!', 'combo');
        G.bag.classList.remove('full'); void G.bag.offsetWidth; G.bag.classList.add('full');
        G.lists++; G.bagN.textContent = String(G.lists);
        K.later(() => { if (K.running) newList(K); }, 500);
      } else drawList(K);
      K.later(() => el.remove(), 400);
    } else {
      el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope');
      K.miss(el, cur && cur[1], `✗ ${b.g[0]} = ${b.g[1]}`); K.sfx('wrong');
      if (cur) { G.hint = true; drawList(K); }
    }
  }
  function fly(K, b) {
    const r = G.water.getBoundingClientRect(), br = G.bag.getBoundingClientRect(), er = b.el.getBoundingClientRect();
    const s = document.createElement('span'); s.className = 'sp2-c14-fly'; s.textContent = b.g[0];
    const x0 = er.left - r.left + er.width / 2 - 18, y0 = er.top - r.top;
    s.style.transform = `translate3d(${x0}px,${y0}px,0)`;
    G.water.appendChild(s);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      s.style.transform = `translate3d(${br.left - r.left + br.width / 2 - 18}px,${br.top - r.top}px,0) scale(.5)`; s.style.opacity = '.2';
    }));
    K.later(() => { s.remove(); G.bag.classList.remove('got'); void G.bag.offsetWidth; G.bag.classList.add('got'); }, 520);
  }

  const cleanup = makeGame(root, params, app, {
    wid, cls: 'sp2-c14', ico: '🛶', secs: 80, minOk: 12,
    title: { uk: 'Плавучий ринок', ru: 'Плавучий рынок' },
    rules: [
      { uk: '🛒 Угорі — список покупок англійською. Каналом пливуть човники-лотки з товарами.', ru: '🛒 Вверху — список покупок по-английски. По каналу плывут лодочки-лотки с товарами.' },
      { uk: '👆 Тапни човник із ПОТРІБНИМ товаром — він полетить у твій кошик. Не той товар — промах.', ru: '👆 Тапни лодочку с НУЖНЫМ товаром — он полетит в твою корзину. Не тот товар — промах.' },
      { uk: '🛍️ Увесь список куплено — +30 бонусу! 🔊 — послухати слово.', ru: '🛍️ Весь список куплен — +30 бонуса! 🔊 — послушать слово.' },
    ],
    beat: {
      bpm: BPM, steps: 2,
      fn(K, step, t) {
        const sy = K.synth; if (!sy) return;
        if (step % 4 === 0) sy.tone(midi(48 + (step % 16 === 8 ? 7 : 0)), t, 0.4, { w: 'sine', v: 0.22 });
        if (step % 2 === 0) sy.noise(t, 0.03, { v: step % 4 === 2 ? 0.1 : 0.05, f: 6000, type: 'highpass' }); // ching
        if (step % 8 === 6) sy.tone(midi(55), t, 0.12, { w: 'triangle', v: 0.08 }); // «chap»
        const m = MEL[step % 32];
        if (m != null && (step >> 5) % 2 === 1) { const f = midi(PENTA[m]); sy.tone(f, t, 0.22, { w: 'triangle', v: 0.11 }); sy.tone(f * 2, t, 0.08, { w: 'sine', v: 0.04 }); }
      },
    },
    build(K) {
      K.field.innerHTML = `<div class="sp2-c14-card"></div>
        <div class="sp2-c14-stage"><div class="sp2-c14-bank"><i class="sp2-c14-lanterns"></i><i class="sp2-c14-wat"></i><i class="sp2-c14-palm a">🌴</i><i class="sp2-c14-palm b">🌴</i></div>
          <div class="sp2-c14-water"><i class="sp2-c14-ripples"></i>
            <div class="sp2-c14-bag">🛶<b>🧺</b><em>0</em></div></div></div>`;
      G = {
        boats: [], list: [], idx: 0, lists: 0, since: 0, spawnT: 0, W: 300, laneY: [20, 110], hint: false,
        card: K.$('.sp2-c14-card'), water: K.$('.sp2-c14-water'), bag: K.$('.sp2-c14-bag'), bagN: K.$('.sp2-c14-bag em'), rip: K.$('.sp2-c14-ripples'),
      };
      G.card.innerHTML = `<small>🛶</small><b>${esc(tr({ uk: 'Ринок відкривається…', ru: 'Рынок открывается…' }))}</b>`;
      G.water.addEventListener('pointerdown', (e) => { const b = e.target.closest('.sp2-c14-boat'); if (b) { e.preventDefault(); tapBoat(K, b); } });
      G.card.addEventListener('click', (e) => { if (e.target.closest('[data-say]') && G.list[G.idx]) K.speakAlways(G.list[G.idx][1]); });
    },
    start(K) {
      G.W = G.water.clientWidth; const H = G.water.clientHeight;
      G.laneY = [H * 0.08, H * 0.48];
      newList(K); spawn(K);
    },
    frame(K, now, dt) {
      const speed = Math.min(105, 62 + now * 0.5);
      G.spawnT += dt;
      if (G.spawnT > 1.25) { G.spawnT = 0; spawn(K); }
      G.rip.style.transform = `translate3d(${(-(now * 30) % 80).toFixed(1)}px,0,0)`;
      for (const b of G.boats) {
        if (b.gone) continue;
        b.x -= (b.lane ? speed * 1.15 : speed) * dt;
        place(b, now);
        if (b.x < -110) { b.gone = true; b.el.remove(); }
      }
      if (G.boats.length > 16) G.boats = G.boats.filter((b) => !b.gone);
    },
  });
  return cleanup;
}
