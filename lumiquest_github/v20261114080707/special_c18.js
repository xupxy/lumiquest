// 🇹🇷 c18 «Повітряні кулі Каппадокії» — твоя куля летить угору над скелями-«димарями».
// Угорі — слово рідною мовою (+емодзі). Згори опускається хвиля з 3 хмаринок з англійськими словами: одна правильна.
// Тапай (лопай) хмари з НЕПРАВИЛЬНИМИ словами. Коли хвиля долітає до кулі — правильна хмара підхоплює кулю вгору (+висота),
// а нелопнута хибна — штовхає вниз (промах). Лопнув правильну — промах. Музика — оригінальний WebAudio-синт (96 BPM, лад хіджаз).
import { makeGame, tr, esc, shuffle, pick, midi } from './_sp2kit.js?v=20261114080653';

export const meta = { topbar: false };

// [емодзі, english, uk, ru]
const WORDS = [['🍵', 'tea', 'чай', 'чай'], ['☕', 'coffee', 'кава', 'кофе'], ['🍞', 'bread', 'хліб', 'хлеб'], ['🧶', 'carpet', 'килим', 'ковёр'],
  ['🪔', 'lamp', 'лампа', 'лампа'], ['🐈', 'cat', 'кіт', 'кот'], ['🎈', 'balloon', 'повітряна куля', 'воздушный шар'], ['🪨', 'rock', 'скеля', 'скала'],
  ['☀️', 'sun', 'сонце', 'солнце'], ['☁️', 'cloud', 'хмара', 'облако'], ['⛰️', 'mountain', 'гора', 'гора'], ['🛍️', 'market', 'ринок', 'рынок'],
  ['🍬', 'candy', 'цукерка', 'конфета'], ['🌉', 'bridge', 'міст', 'мост'], ['🌊', 'sea', 'море', 'море'], ['🚢', 'ship', 'корабель', 'корабль'],
  ['🌷', 'tulip', 'тюльпан', 'тюльпан'], ['🥤', 'cup', 'чашка', 'чашка'], ['🐟', 'fish', 'риба', 'рыба'], ['🌹', 'rose', 'троянда', 'роза'],
  ['🍯', 'honey', 'мед', 'мёд'], ['🌙', 'moon', 'місяць', 'луна'], ['⭐', 'star', 'зірка', 'звезда'], ['💨', 'wind', 'вітер', 'ветер'],
  ['🐦', 'bird', 'пташка', 'птица'], ['🍉', 'watermelon', 'кавун', 'арбуз'], ['🧿', 'eye', 'око', 'глаз'], ['🥯', 'bagel', 'бублик', 'бублик'],
  ['🏰', 'castle', 'замок', 'замок'], ['🐢', 'turtle', 'черепаха', 'черепаха'], ['🫖', 'teapot', 'чайник', 'чайник'], ['🍋', 'lemon', 'лимон', 'лимон'],
  ['🔑', 'key', 'ключ', 'ключ'], ['🧺', 'basket', 'кошик', 'корзина'], ['🐕', 'dog', 'собака', 'собака'], ['🍎', 'apple', 'яблуко', 'яблоко']];

const BPM = 96;
const HIJAZ = [62, 63, 66, 67, 69, 70, 72, 74, 75, 78]; // лад хіджаз (оригінальна мелодія)
const MEL = [4, null, 3, 2, 1, 2, 3, null, 4, 5, 4, 3, 2, 1, 0, null, 0, 1, 2, 3, 4, 6, 7, null, 6, 5, 4, 3, 2, null, 1, null];
const DARBUKA = [1, 0, 2, 2, 1, 0, 2, 0, 1, 0, 2, 2, 1, 2, 2, 0];

export function render(root, params, app) {
  const wid = 'c18';
  let G = null;
  const nat = (w) => tr([w[2], w[3]]);

  function newWave(K) {
    const recent = G.recent || [];
    const cur = pick(WORDS.filter((w) => !recent.includes(w)));
    G.recent = [...recent, cur].slice(-6);
    G.cur = cur; G.hint = false;
    const wrong = shuffle(WORDS.filter((w) => w !== cur)).slice(0, 2);
    const items = shuffle([cur, ...wrong]);
    const slot = G.W / 3;
    G.wave = items.map((w, i) => {
      const el = document.createElement('button');
      el.className = 'sp2-c18-cloud';
      el.innerHTML = `<span>${esc(w[1])}</span>`;
      G.sky.appendChild(el);
      return { el, w, x: slot * i + slot / 2 - 58 + (Math.random() * 16 - 8), y: -70 - Math.random() * 20, ph: Math.random() * 6, popped: false };
    });
    drawCard(K);
  }
  function drawCard(K) {
    const w = G.cur;
    G.card.innerHTML = `<small>🎈 ${esc(tr({ uk: 'Лопни ЗАЙВІ хмари! Лишити:', ru: 'Лопни ЛИШНИЕ облака! Оставить:' }))}</small>
      <div class="sp2-c18-ask"><span>${w[0]}</span><b>${esc(nat(w))}</b></div>
      <em class="sp2-c18-hint">${G.hint ? `💡 ${esc(nat(w))} = <b>${esc(w[1])}</b>` : '&nbsp;'}</em>
      <button class="sp2-c18-say" data-say="1" aria-label="say">🔊</button>`;
    G.card.classList.remove('sp2-in'); void G.card.offsetWidth; G.card.classList.add('sp2-in');
  }

  function tap(K, el) {
    const c = G.wave && G.wave.find((x) => x.el === el && !x.popped);
    if (!c || !K.running || G.resolving) return;
    c.popped = true; el.classList.add('pop');
    K.later(() => el.remove(), 380);
    if (c.w !== G.cur) {
      K.hit(el, 10, pick(['Pop!', `✗ ${c.w[1]}`, 'Çok iyi!', 'Süper!']));
      K.sfx('pop'); K.hap('light');
      K.learn(c.w[1], nat(c.w));
    } else {
      K.miss(el, c.w[1], `✗ ${c.w[1]} = ${nat(c.w)} !`); K.sfx('wrong');
      G.hint = true; drawCard(K);
      G.bad = true;
    }
  }

  function resolve(K) {
    G.resolving = true;
    let pushed = 0;
    for (const c of G.wave) {
      if (c.popped) continue;
      if (c.w === G.cur) {
        if (!G.bad && G.wave.every((x) => x === c || x.popped)) {
          c.el.classList.add('lift');
          G.alt += 50; K.score += 15; K.hud(); K.ok++; K.combo++; K.best = Math.max(K.best, K.combo);
          K.learn(c.w[1], nat(c.w)); K.speak(c.w[1]);
          K.toast(pick(['⬆️ +50 m', 'Up, up! 🎈', 'Harika! ⬆️']), 'ok'); K.sfx('combo');
          G.ball.classList.remove('up', 'down'); void G.ball.offsetWidth; G.ball.classList.add('up');
        } else c.el.classList.add('pop');
      } else {
        pushed++;
        c.el.classList.add('bump');
        K.miss(G.ball, c.w[1], `💨 ${c.w[1]} = ${nat(c.w)}`);
      }
    }
    if (pushed) { G.alt = Math.max(0, G.alt - 20 * pushed); K.sfx('wrong'); G.ball.classList.remove('up', 'down'); void G.ball.offsetWidth; G.ball.classList.add('down'); }
    G.altEl.textContent = `${G.alt} m`;
    const old = G.wave;
    K.later(() => old.forEach((c) => c.el.remove()), 450);
    G.wave = null; G.bad = false;
    K.later(() => { G.resolving = false; if (K.running) newWave(K); }, 520);
  }

  const cleanup = makeGame(root, params, app, {
    wid, cls: 'sp2-c18', ico: '🎈', secs: 80, minOk: 14,
    title: { uk: 'Повітряні кулі Каппадокії', ru: 'Воздушные шары Каппадокии' },
    rules: [
      { uk: '🎈 Угорі — слово рідною мовою. Згори летять 3 хмаринки з англійськими словами — правильна лише одна.', ru: '🎈 Вверху — слово на родном языке. Сверху летят 3 облачка с английскими словами — правильное только одно.' },
      { uk: '👆 Лопай хмари з НЕПРАВИЛЬНИМИ словами! Правильну — не чіпай: вона підніме кулю вгору.', ru: '👆 Лопай облака с НЕПРАВИЛЬНЫМИ словами! Правильное — не трогай: оно поднимет шар вверх.' },
      { uk: '💨 Нелопнута хибна хмара штовхне кулю вниз. 🔊 — послухати слово.', ru: '💨 Нелопнутое неверное облако толкнёт шар вниз. 🔊 — послушать слово.' },
    ],
    beat: {
      bpm: BPM, steps: 2,
      fn(K, step, t) {
        const sy = K.synth; if (!sy) return;
        const d = DARBUKA[step % 16];
        if (d === 1) sy.tone(midi(45), t, 0.22, { w: 'sine', v: 0.22 }); // «дум»
        if (d === 2) sy.noise(t, 0.03, { v: 0.07, f: 4200, type: 'bandpass' }); // «тек»
        if (step % 32 === 0) sy.tone(midi(50), t, 2.4, { w: 'triangle', v: 0.035 });
        const m = MEL[step % 32];
        if (m != null && (step >> 5) % 2 === 1) { const f = midi(HIJAZ[m]); sy.tone(f, t, 0.26, { w: 'triangle', v: 0.1 }); sy.tone(f * 1.5, t, 0.08, { w: 'sine', v: 0.025 }); }
      },
    },
    build(K) {
      K.field.innerHTML = `<div class="sp2-c18-card"></div>
        <div class="sp2-c18-stage"><i class="sp2-c18-sun"></i><i class="sp2-c18-far a">🎈</i><i class="sp2-c18-far b">🎈</i><i class="sp2-c18-far c">🎈</i>
          <i class="sp2-c18-rocks"></i><div class="sp2-c18-sky"></div>
          <div class="sp2-c18-ball"><svg viewBox="0 0 60 78" aria-hidden="true"><path d="M30 4 C12 4 2 18 4 32 C6 44 18 52 24 60 H36 C42 52 54 44 56 32 C58 18 48 4 30 4Z" fill="#e8331e"/>
            <path d="M30 4 C22 4 18 18 19 32 C20 44 24 52 26 60 H34 C36 52 40 44 41 32 C42 18 38 4 30 4Z" fill="#ffc21a"/><path d="M30 4 C27 4 26 18 26.5 32 C27 44 28.5 52 29 60 H31 C31.5 52 33 44 33.5 32 C34 18 33 4 30 4Z" fill="#2e9adb"/>
            <ellipse cx="18" cy="18" rx="5" ry="8" fill="#fff" opacity=".35"/><path d="M25 60 L26 67 M35 60 L34 67" stroke="#5a3a1a" stroke-width="1.4"/><rect x="23" y="67" width="14" height="10" rx="2" fill="#a8743e" stroke="#5a3a1a" stroke-width="1.4"/></svg>
            <em class="sp2-c18-alt">0 m</em></div></div>`;
      G = {
        wave: null, cur: null, alt: 0, W: 300, H: 300, hint: false, bad: false, resolving: false,
        card: K.$('.sp2-c18-card'), sky: K.$('.sp2-c18-sky'), ball: K.$('.sp2-c18-ball'), altEl: K.$('.sp2-c18-alt'), rocks: K.$('.sp2-c18-rocks'),
      };
      G.card.innerHTML = `<small>🎈</small><b>${esc(tr({ uk: 'Куля надувається…', ru: 'Шар надувается…' }))}</b>`;
      G.sky.addEventListener('pointerdown', (e) => { const b = e.target.closest('.sp2-c18-cloud'); if (b) { e.preventDefault(); tap(K, b); } });
      G.card.addEventListener('click', (e) => { if (e.target.closest('[data-say]') && G.cur) K.speakAlways(G.cur[1]); });
    },
    start(K) {
      G.W = G.sky.clientWidth; G.H = G.sky.clientHeight;
      newWave(K);
    },
    frame(K, now, dt) {
      // рух хвилі: швидшає з часом; лінія кулі ≈ 72% висоти
      const speed = Math.min(78, 40 + now * 0.5);
      G.rocks.style.transform = `translate3d(0,${Math.min(60, G.alt / 20).toFixed(1)}px,0)`;
      if (!G.wave || G.resolving) return;
      const line = G.H * 0.66;
      let reached = false;
      const clear = G.wave.every((c) => c.popped || c.w === G.cur);
      for (const c of G.wave) {
        c.y += (clear ? speed * 3.2 : speed) * dt;
        const x = c.x + Math.sin(now * 1.6 + c.ph) * 6;
        if (!c.popped) c.el.style.transform = `translate3d(${x.toFixed(1)}px,${c.y.toFixed(1)}px,0)`;
        if (c.y >= line) reached = true;
      }
      if (reached) resolve(K);
    },
  });
  return cleanup;
}
