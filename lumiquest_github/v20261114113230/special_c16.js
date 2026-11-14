// 🇪🇬 c16 «Ієрогліфи» — на стіні гробниці зашифроване англійське слово: кожна літера — символ-ієрогліф.
// Угорі — підказка (емодзі + переклад). Нижче — «Розетський камінь»: плитки символ→літера (ключ щоразу новий).
// Тапай плитки в порядку літер слова. Частина символів у слові прихована «?» — тут треба ЗНАТИ, як пишеться слово.
// Помилка — промах (noteMiss) і всі символи слова проявляються. Розгадав — двері гробниці відчиняються, +бонус.
// Музика — оригінальний WebAudio-синт (90 BPM, «хіджаз»-лад, дарбука).
import { makeGame, tr, esc, shuffle, pick, midi } from './_sp2kit.js?v=20261114113225';

export const meta = { topbar: false };

// [емодзі, english, uk, ru]
const WORDS = [['🐈', 'cat', 'кіт', 'кот'], ['☀️', 'sun', 'сонце', 'солнце'], ['🏜️', 'sand', 'пісок', 'песок'], ['🏞️', 'river', 'річка', 'река'],
  ['⛵', 'boat', 'човен', 'лодка'], ['🐫', 'camel', 'верблюд', 'верблюд'], ['🤴', 'king', 'король', 'король'], ['👸', 'queen', 'королева', 'королева'],
  ['🪙', 'gold', 'золото', 'золото'], ['👁️', 'eye', 'око', 'глаз'], ['🐦', 'bird', 'птах', 'птица'], ['🐍', 'snake', 'змія', 'змея'],
  ['🌴', 'palm', 'пальма', 'пальма'], ['🗺️', 'map', 'мапа', 'карта'], ['🔑', 'key', 'ключ', 'ключ'], ['⭐', 'star', 'зірка', 'звезда'],
  ['🌙', 'moon', 'місяць', 'луна'], ['💧', 'water', 'вода', 'вода'], ['🍞', 'bread', 'хліб', 'хлеб'], ['🦁', 'lion', 'лев', 'лев'],
  ['🐟', 'fish', 'риба', 'рыба'], ['🔺', 'pyramid', 'піраміда', 'пирамида'], ['🏺', 'vase', 'ваза', 'ваза'], ['🐊', 'crocodile', 'крокодил', 'крокодил'],
  ['📜', 'scroll', 'сувій', 'свиток'], ['💎', 'jewel', 'коштовність', 'драгоценность'], ['🌵', 'desert', 'пустеля', 'пустыня'], ['🕌', 'market', 'ринок', 'рынок'],
  ['🌾', 'wheat', 'пшениця', 'пшеница'], ['🐪', 'hump', 'горб', 'горб'], ['⚰️', 'tomb', 'гробниця', 'гробница'], ['🍯', 'honey', 'мед', 'мёд']];
// оригінальні «ієрогліфи» (емодзі-символи, без справжніх знаків письма)
const GLYPHS = ['🦅', '🐍', '🪶', '👁️', '☀️', '🌙', '💧', '🪲', '🦉', '🐈‍⬛', '🌿', '🔺', '⚱️', '🐟', '🌾', '🦁', '🐊', '✋', '🦶', '🏺', '〰️', '⭕', '🔱', '🌀', '🐄', '🦆', '🌊', '🌼'];
const ABC = 'abcdefghijklmnoprstuvwy';

const BPM = 90;
const HIJAZ = [62, 63, 66, 67, 69, 70, 72, 74];
const MEL = [0, 1, 2, 1, 3, null, 2, 1, 0, null, 4, 3, 2, 1, 2, null, 4, 5, 4, 3, 2, null, 3, 2, 1, 0, 1, 2, 0, null, null, null];

export function render(root, params, app) {
  const wid = 'c16';
  let G = null;
  const nat = (w) => tr([w[2], w[3]]);

  function newWord(K) {
    let w; do w = pick(WORDS); while (G.recent.includes(w) || (G.n < 3 && w[1].length > 5));
    G.recent.push(w); if (G.recent.length > 10) G.recent.shift();
    G.w = w; G.letters = w[1].split(''); G.idx = 0; G.busy = false; G.miss = 0;
    const uniq = [...new Set(G.letters)];
    const extra = shuffle(ABC.split('').filter((l) => !uniq.includes(l))).slice(0, Math.max(3, 9 - uniq.length));
    const glyphs = shuffle(GLYPHS);
    G.key = {}; [...uniq, ...extra].forEach((l, i) => { G.key[l] = glyphs[i]; });
    // приховати частину символів у слові (з 3-го слова — кожен другий, крім першого)
    const hideEvery = G.n >= 2;
    G.hidden = G.letters.map((_, i) => hideEvery && i > 0 && i % 2 === 1);
    G.card.innerHTML = `<small>🔍 ${esc(tr({ uk: 'Розшифруй слово:', ru: 'Расшифруй слово:' }))}</small>
      <b><span class="sp2-c16-pic">${w[0]}</span> ${esc(nat(w))}</b><button class="sp2-c16-say" data-say="1" aria-label="say">🔊</button>`;
    G.card.classList.remove('sp2-in'); void G.card.offsetWidth; G.card.classList.add('sp2-in');
    drawSlots();
    G.stone.innerHTML = shuffle(Object.keys(G.key)).map((l) => `<button class="sp2-c16-tile" data-l="${l}"><span>${G.key[l]}</span><b>${l.toUpperCase()}</b></button>`).join('');
    G.door.classList.remove('open');
  }
  function drawSlots() {
    G.slots.innerHTML = G.letters.map((l, i) => `<span class="${i < G.idx ? 'done' : i === G.idx ? 'cur' : ''}">${i < G.idx ? `<b>${l.toUpperCase()}</b>` : `<i>${G.hidden[i] ? '❔' : G.key[l]}</i>`}</span>`).join('');
  }
  function tapTile(K, el) {
    if (!K.running || G.busy) return;
    const need = G.letters[G.idx], l = el.dataset.l;
    if (l === need) {
      G.idx++; drawSlots();
      K.hit(el, 6); K.sfx('tap'); K.hap('light');
      if (G.idx >= G.letters.length) solved(K);
    } else {
      K.miss(el, G.w[1], `✗ ${l.toUpperCase()} ≠ ${G.key[need] || '?'}`); K.sfx('wrong');
      G.miss++; G.hidden = G.hidden.map(() => false); drawSlots();
      if (G.miss >= 3) { G.busy = true; K.toast(`📜 ${G.w[1]}`, 'bad'); K.learn(G.w[1], nat(G.w)); K.later(() => { if (K.running) { G.n++; newWord(K); } }, 1200); }
    }
  }
  function solved(K) {
    G.busy = true; G.n++;
    const bonus = 10 + G.letters.length * 2 + (G.miss ? 0 : 10);
    K.score += bonus; K.hud(); K.sfx('combo'); K.hap('medium');
    K.toast(`🔓 ${pick(['Shukran!', 'Great!', 'Decoded!', 'Wonderful!'])} +${bonus}`, 'combo');
    K.learn(G.w[1], nat(G.w)); K.speak(G.w[1]);
    G.door.classList.add('open');
    K.later(() => { if (K.running) newWord(K); }, 1100);
  }

  const cleanup = makeGame(root, params, app, {
    wid, cls: 'sp2-c16', ico: '🔺', secs: 85, minOk: 16,
    title: { uk: 'Ієрогліфи', ru: 'Иероглифы' },
    rules: [
      { uk: '🔍 Угорі — що за слово (картинка й переклад). На стіні — це слово англійською, зашифроване символами.', ru: '🔍 Вверху — что за слово (картинка и перевод). На стене — это слово по-английски, зашифрованное символами.' },
      { uk: '🪨 Унизу — камінь-ключ: символ → літера. Тапай літери по порядку, щоб розшифрувати слово.', ru: '🪨 Внизу — камень-ключ: символ → буква. Тапай буквы по порядку, чтобы расшифровать слово.' },
      { uk: '❔ Деякі символи сховані — згадай, як пишеться слово! Без помилок — бонус, двері гробниці відчиняться.', ru: '❔ Некоторые символы спрятаны — вспомни, как пишется слово! Без ошибок — бонус, двери гробницы откроются.' },
    ],
    beat: {
      bpm: BPM, steps: 2,
      fn(K, step, t) {
        const sy = K.synth; if (!sy) return;
        const s8 = step % 8;
        if (s8 === 0 || s8 === 5) sy.tone(midi(38), t, 0.25, { w: 'sine', v: 0.24 }); // dum
        if (s8 === 2 || s8 === 6 || s8 === 7) sy.noise(t, 0.04, { v: 0.09, f: 3500, type: 'bandpass' }); // tak
        const m = MEL[step % 32];
        if (m != null && (step >> 5) % 2 === 1) { const f = midi(HIJAZ[m]); sy.tone(f, t, 0.3, { w: 'sawtooth', v: 0.035 }); sy.tone(f, t, 0.3, { w: 'triangle', v: 0.08 }); }
      },
    },
    build(K) {
      K.field.innerHTML = `<div class="sp2-c16-card"></div>
        <div class="sp2-c16-tomb"><i class="sp2-c16-torch a">🔥</i><i class="sp2-c16-torch b">🔥</i>
          <div class="sp2-c16-door"><i class="l"></i><i class="r"></i></div>
          <div class="sp2-c16-slots"></div></div>
        <div class="sp2-c16-stone"></div>`;
      G = {
        recent: [], n: 0, idx: 0, letters: [], key: {}, hidden: [], w: null, busy: true, miss: 0,
        card: K.$('.sp2-c16-card'), slots: K.$('.sp2-c16-slots'), stone: K.$('.sp2-c16-stone'), door: K.$('.sp2-c16-door'),
      };
      G.card.innerHTML = `<small>🔺</small><b>${esc(tr({ uk: 'Входимо в гробницю…', ru: 'Входим в гробницу…' }))}</b>`;
      G.stone.addEventListener('pointerdown', (e) => { const b = e.target.closest('.sp2-c16-tile'); if (b) { e.preventDefault(); tapTile(K, b); } });
      G.card.addEventListener('click', (e) => { if (e.target.closest('[data-say]') && G.w) K.speakAlways(G.w[1]); });
    },
    start(K) { newWord(K); },
    frame() {},
  });
  return cleanup;
}
