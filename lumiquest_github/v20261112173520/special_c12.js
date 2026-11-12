// 🇲🇽 c12 «Піньята» — піньята-зірка гойдається на мотузці, на ній щоразу нове англійське слово.
// Угорі — слово рідною мовою. Бий палицею (тап), коли на піньяті ПРАВИЛЬНИЙ переклад; хибне — не чіпай.
// 3 влучні удари — піньята лопається, сиплються цукерки 🍬 (тапай їх — бонусні очки, ⭐ — більше). Музика — оригінальний WebAudio-синт (104 BPM, «ум-па-па»).
import { makeGame, tr, esc, pick, countryWords, midi } from './_sp2kit.js?v=20261112173519';

export const meta = { topbar: false };

const MX = [['тако', 'тако', 'taco'], ['кукурудза', 'кукуруза', 'corn'], ['квасоля', 'фасоль', 'beans'], ['гострий', 'острый', 'spicy'], ['перець чилі', 'перец чили', 'chili'],
  ['авокадо', 'авокадо', 'avocado'], ['шоколад', 'шоколад', 'chocolate'], ['цукерка', 'конфета', 'candy'], ['вечірка', 'вечеринка', 'party'],
  ['родина', 'семья', 'family'], ['бабуся', 'бабушка', 'grandmother'], ['пісня', 'песня', 'song'], ['гітара', 'гитара', 'guitar'], ['труба', 'труба', 'trumpet'],
  ['капелюх', 'шляпа', 'hat'], ['піраміда', 'пирамида', 'pyramid'], ['пустеля', 'пустыня', 'desert'], ['кактус', 'кактус', 'cactus'], ['сонце', 'солнце', 'sun'],
  ['метелик', 'бабочка', 'butterfly'], ['черепаха', 'черепаха', 'turtle'], ['свічка', 'свеча', 'candle'], ['квітка', 'цветок', 'flower'], ['череп', 'череп', 'skull'],
  ['пам\'ятати', 'помнить', 'remember'], ['предки', 'предки', 'ancestors'], ['ринок', 'рынок', 'market'], ['площа', 'площадь', 'square'], ['вулкан', 'вулкан', 'volcano'],
  ['змія', 'змея', 'snake'], ['пір\'я', 'перья', 'feathers'], ['барвистий', 'красочный', 'colorful'], ['святкувати', 'праздновать', 'celebrate'], ['танцювати', 'танцевать', 'dance']];

const PCOL = [['#e8336e', '#ffc21a', '#2ec4b6'], ['#8a4fff', '#ff7a2e', '#ffe14a'], ['#0f9d6a', '#e8336e', '#ffc21a'], ['#2ec4b6', '#ff5c8a', '#8a4fff']];
const BPM = 104, BEAT = 60 / BPM;
const PROG = [[45, 57, 61, 64], [52, 56, 59, 64], [52, 56, 59, 62], [45, 57, 61, 64]]; // A — E — E7 — A
const TRUMPET = [69, 73, 76, 73, 74, 71, 76, 74, 73, 71, 69, 68, 69, null, 76, 78];

function pinataSvg(c) {
  const pts = [];
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 7;
    pts.push([Math.cos(a) * 64, Math.sin(a) * 64]);
  }
  const cones = pts.map(([x, y], i) => {
    const a = Math.atan2(y, x), px = Math.cos(a + Math.PI / 2) * 13, py = Math.sin(a + Math.PI / 2) * 13;
    const bx = Math.cos(a) * 26, by = Math.sin(a) * 26;
    return `<path d="M${(bx + px).toFixed(1)} ${(by + py).toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)} L${(bx - px).toFixed(1)} ${(by - py).toFixed(1)}Z" fill="${c[i % 3]}" stroke="#3a1630" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M${x.toFixed(1)} ${y.toFixed(1)} l${(Math.cos(a + 0.5) * 12).toFixed(1)} ${(Math.sin(a + 0.5) * 12).toFixed(1)} M${x.toFixed(1)} ${y.toFixed(1)} l${(Math.cos(a - 0.5) * 12).toFixed(1)} ${(Math.sin(a - 0.5) * 12).toFixed(1)}" stroke="${c[(i + 1) % 3]}" stroke-width="3.5" stroke-linecap="round"/>`;
  }).join('');
  const fringe = Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return `<path d="M${(Math.cos(a) * 30).toFixed(1)} ${(Math.sin(a) * 30).toFixed(1)} L${(Math.cos(a) * 37).toFixed(1)} ${(Math.sin(a) * 37).toFixed(1)}" stroke="${c[i % 3]}" stroke-width="5" stroke-linecap="round"/>`; }).join('');
  return `<svg viewBox="-80 -80 160 160" aria-hidden="true">${cones}${fringe}<circle r="31" fill="#fff6e0" stroke="#3a1630" stroke-width="3"/>
    <circle r="24" fill="none" stroke="${c[0]}" stroke-width="4" stroke-dasharray="6 5"/></svg>`;
}

export function render(root, params, app) {
  const wid = 'c12';
  let G = null;

  function newTarget() {
    let p; do { p = pick(G.pairs); } while (G.pairs.length > 2 && G.used.includes(p[1]));
    G.used.push(p[1]); if (G.used.length > 5) G.used.shift();
    G.target = p;
    G.card.innerHTML = `<small>${esc(tr({ uk: 'Бий, коли на піньяті:', ru: 'Бей, когда на пиньяте:' }))}</small><b>«${esc(p[0])}»</b>`;
    G.card.classList.remove('sp2-in'); void G.card.offsetWidth; G.card.classList.add('sp2-in');
  }
  function newPinata() {
    G.hp = 3; G.cracks.textContent = '';
    G.pin.innerHTML = pinataSvg(PCOL[G.n++ % PCOL.length]);
    G.pend.classList.remove('drop'); void G.pend.offsetWidth; G.pend.classList.add('drop');
    newTarget(); nextWord();
  }
  function nextWord() {
    const right = G.sinceRight >= 2 || Math.random() < 0.4;
    const w = right ? G.target[1] : pick(G.pairs.filter((p) => p[1] !== G.target[1]))[1];
    G.sinceRight = right ? 0 : G.sinceRight + 1;
    G.word = w; G.wordHit = false;
    G.label.textContent = w;
    G.label.classList.remove('sp2-in'); void G.label.offsetWidth; G.label.classList.add('sp2-in');
  }
  function swing(K) {
    if (!K.running || G.burst) return;
    G.bat.classList.remove('go'); void G.bat.offsetWidth; G.bat.classList.add('go');
    if (G.wordHit) return;
    G.wordHit = true;
    if (G.word === G.target[1]) {
      G.hp--;
      K.hit(G.pin, 10, pick(['¡Olé! 🎉', '¡Muy bien!', 'Great hit!', 'Bravo!']));
      K.sfx('hit'); K.hap('medium');
      K.learn(G.target[1], G.target[0]); K.speak(G.target[1]);
      G.kick = 1;
      G.cracks.textContent = '✦'.repeat(3 - G.hp);
      if (G.hp <= 0) burst(K);
    } else {
      K.miss(G.pin, G.target[1], `✗ ${G.word}`); K.sfx('wrong');
    }
  }
  function burst(K) {
    G.burst = true; K.sfx('explode');
    G.pend.classList.add('pop');
    K.toast('🍬 ¡Dulces!', 'combo');
    const n = K.lite() ? 6 : 10;
    const r = G.stage.getBoundingClientRect(), pr = G.pin.getBoundingClientRect();
    const cx = pr.left - r.left + pr.width / 2, cy = pr.top - r.top + pr.height / 2;
    for (let i = 0; i < n; i++) {
      const star = i === 0 || Math.random() < 0.12;
      const el = document.createElement('button');
      el.className = `sp2-c12-candy${star ? ' star' : ''}`; el.textContent = star ? '⭐' : pick(['🍬', '🍭', '🍫', '🍬', '🌶️']);
      G.stage.appendChild(el);
      G.candies.push({ el, x: cx, y: cy, vx: (Math.random() * 2 - 1) * 170, vy: -160 - Math.random() * 200, star, life: 0 });
    }
    const g = G;
    K.later(() => { if (G !== g || !K.running) return; G.pend.classList.remove('pop'); G.burst = false; newPinata(); }, 1400);
  }
  function grab(K, el) {
    const c = G.candies.find((x) => x.el === el); if (!c || c.got) return;
    c.got = true; el.classList.add('got');
    K.score += c.star ? 15 : 5; K.hud(); K.sfx('coin');
    K.floatAt(c.x, c.y - 20, c.star ? '+15 ⭐' : '+5', 'ok', G.stage);
    K.later(() => el.remove(), 300);
  }

  const cleanup = makeGame(root, params, app, {
    wid, cls: 'sp2-c12', ico: '🎉', secs: 75, minOk: 12,
    title: { uk: 'Піньята', ru: 'Пиньята' },
    rules: [
      { uk: '🎉 Угорі — слово українською. Піньята гойдається, і на ній щоразу інше англійське слово.', ru: '🎉 Вверху — слово по-русски. Пиньята качается, и на ней каждый раз другое английское слово.' },
      { uk: '👆 Тапни (удар палицею), коли на піньяті ПРАВИЛЬНИЙ переклад. Хибне слово — не бий!', ru: '👆 Тапни (удар палкой), когда на пиньяте ПРАВИЛЬНЫЙ перевод. Ложное слово — не бей!' },
      { uk: '🍬 3 влучні удари — піньята лопається! Лови цукерки — бонусні очки, ⭐ — ще більше.', ru: '🍬 3 метких удара — пиньята лопается! Лови конфеты — бонусные очки, ⭐ — ещё больше.' },
    ],
    beat: {
      bpm: BPM, steps: 2,
      fn(K, step, t) {
        const sy = K.synth; if (!sy) return;
        const ch = PROG[(step >> 3) % 4];
        if (step % 4 === 0) sy.bass(midi(ch[0] - (step % 8 === 4 ? 5 : 0)), t, 0.22, 0.28); // «ум»
        if (step % 2 === 1) sy.chord(ch.slice(1).map(midi), t, 0.12, 0.045); // «па»
        if (step % 2 === 0) sy.hat(t, 0.06);
        if (step % 8 === 6) sy.noise(t, 0.06, { v: 0.1, f: 3000, type: 'highpass' }); // маракас
        const m = TRUMPET[step % 16];
        if (m && (step >> 4) % 2 === 1) sy.lead(midi(m), t, BEAT * 0.45, 0.07);
      },
    },
    build(K) {
      K.field.innerHTML = `<div class="sp2-c12-card"></div>
        <div class="sp2-c12-stage"><i class="sp2-c12-picado"></i><i class="sp2-c12-sun"></i><i class="sp2-c12-house a"></i><i class="sp2-c12-house b"></i><i class="sp2-c12-house c"></i>
          <div class="sp2-c12-pend"><i class="sp2-c12-rope"></i><div class="sp2-c12-pin"></div><b class="sp2-c12-cracks"></b><em class="sp2-c12-word"></em></div>
          <div class="sp2-c12-bat"></div><div class="sp2-c12-kid">🧒</div></div>`;
      const extra = countryWords(app, wid).map((p) => [p[0], p[1]]);
      G = {
        K, pairs: [...MX.map((p) => [tr([p[0], p[1]]), p[2]]), ...extra], used: [], n: 0, hp: 3, sinceRight: 0, word: '', wordHit: false,
        ang: 0, dir: 1, kick: 0, burst: false, candies: [],
        card: K.$('.sp2-c12-card'), stage: K.$('.sp2-c12-stage'), pend: K.$('.sp2-c12-pend'), pin: K.$('.sp2-c12-pin'),
        label: K.$('.sp2-c12-word'), cracks: K.$('.sp2-c12-cracks'), bat: K.$('.sp2-c12-bat'),
      };
      G.pin.innerHTML = pinataSvg(PCOL[0]);
      G.card.innerHTML = `<small>🎉</small><b>${esc(tr({ uk: '¡Fiesta! Готуйся…', ru: '¡Fiesta! Готовься…' }))}</b>`;
      G.stage.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const c = e.target.closest('.sp2-c12-candy');
        if (c) { grab(K, c); return; }
        swing(K);
      });
    },
    start(K) { G.t = 0; newPinata(); },
    frame(K, now, dt) {
      // маятник: період скорочується з часом; слово міняється на кожному крайньому положенні
      const per = Math.max(1.15, 1.9 - now * 0.009);
      const prev = G.ang;
      G.t += dt * (G.burst ? 0.3 : 1);
      G.ang = Math.sin((G.t / per) * Math.PI * 2) * 30;
      const v = G.ang - prev;
      if (v * G.dir < 0) { G.dir = -G.dir; if (!G.burst) nextWord(); }
      G.kick = Math.max(0, G.kick - dt * 4);
      G.pend.style.transform = `rotate(${(G.ang + G.kick * 8 * G.dir).toFixed(2)}deg)`;
      G.label.style.transform = `translateX(-50%) rotate(${(-G.ang).toFixed(2)}deg)`;
      G.pin.style.transform = `scale(${(1 - G.kick * 0.12).toFixed(3)}) rotate(${(G.kick * -14).toFixed(1)}deg)`;
      // цукерки
      const H = G.stage.clientHeight;
      for (const c of G.candies) {
        if (c.got) continue;
        c.vy += 520 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.life += dt;
        if (c.y > H - 30) { c.y = H - 30; c.vy *= -0.35; c.vx *= 0.7; }
        c.el.style.transform = `translate3d(${(c.x - 22).toFixed(1)}px,${(c.y - 22).toFixed(1)}px,0) rotate(${(c.life * 240).toFixed(0)}deg)`;
        if (c.life > 3.2) { c.got = true; c.el.classList.add('gone'); const el = c.el; K.later(() => el.remove(), 300); }
      }
      if (G.candies.length > 24) G.candies = G.candies.filter((c) => !c.got);
    },
  });
  return cleanup;
}
