// 🇩🇪 c15 «Потяг вчасно» — на перон прибуває локомотив, на запасній колії стоять вагони-слова.
// Угорі — речення рідною мовою. Зчіплюй вагони в ПРАВИЛЬНОМУ порядку англійського речення, поки стрілка вокзального годинника
// не дійшла до відправлення. Встиг — потяг рушає вчасно (бонус за запас часу). Не той вагон — промах (noteMiss).
// 🐢 calm: годинник не підганяє (без відправлення за часом). Музика — оригінальний WebAudio-синт (112 BPM, «чух-чух» + духові).
import { makeGame, tr, esc, shuffle, pick, midi } from './_sp2kit.js?v=20261114080653';

export const meta = { topbar: false };

// [english, uk, ru] — пунктуальність, замки, хліб, велосипеди, сортування сміття, ліс
const SENT = [
  ['The train is on time', 'Потяг прибуває вчасно', 'Поезд приходит вовремя'],
  ['I love fresh bread', 'Я люблю свіжий хліб', 'Я люблю свежий хлеб'],
  ['The castle is on the hill', 'Замок стоїть на пагорбі', 'Замок стоит на холме'],
  ['Please do not be late', 'Будь ласка, не запізнюйся', 'Пожалуйста, не опаздывай'],
  ['We ride our bikes', 'Ми їдемо на велосипедах', 'Мы едем на велосипедах'],
  ['Put paper in the blue bin', 'Клади папір у синій бак', 'Клади бумагу в синий бак'],
  ['The forest is very green', 'Ліс дуже зелений', 'Лес очень зелёный'],
  ['My ticket is here', 'Мій квиток тут', 'Мой билет здесь'],
  ['The train leaves at nine', 'Потяг відправляється о дев\'ятій', 'Поезд отправляется в девять'],
  ['Can I have a pretzel', 'Можна мені брецель?', 'Можно мне брецель?'],
  ['The knight has a shield', 'Лицар має щит', 'У рыцаря есть щит'],
  ['Where is platform two', 'Де другий перон?', 'Где вторая платформа?'],
  ['I am never late', 'Я ніколи не запізнююсь', 'Я никогда не опаздываю'],
  ['Bottles go in this bin', 'Пляшки — у цей бак', 'Бутылки — в этот бак'],
  ['The river is long', 'Річка довга', 'Река длинная'],
  ['We visit an old castle', 'Ми відвідуємо старий замок', 'Мы посещаем старый замок'],
  ['The clock says ten', 'Годинник показує десяту', 'Часы показывают десять'],
  ['My bike is red', 'Мій велосипед червоний', 'Мой велосипед красный'],
  ['The bakery opens early', 'Пекарня відкривається рано', 'Пекарня открывается рано'],
  ['Sit down the train is fast', 'Сідай, потяг швидкий', 'Садись, поезд быстрый'],
  ['I see a big tower', 'Я бачу велику вежу', 'Я вижу большую башню'],
  ['Thank you very much', 'Дуже дякую', 'Большое спасибо'],
  ['The festival has music', 'На фестивалі є музика', 'На фестивале есть музыка'],
  ['Good morning my friend', 'Доброго ранку, друже', 'Доброе утро, друг'],
];
const CARS = ['#dd0000', '#ffce00', '#3e6a3a', '#1e5fb8', '#8a4a2a', '#e8336e', '#2ec4b6'];

const BPM = 112;
const MEL = [7, null, 9, 7, 5, null, 4, 5, 7, null, 12, null, 11, 9, 7, null, 5, null, 7, 5, 4, null, 2, 4, 5, 7, 9, null, 7, null, null, null];
const SCALE = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81];

export function render(root, params, app) {
  const wid = 'c15';
  let G = null;
  const nat = (s) => tr([s[1], s[2]]);
  const words = (s) => s[0].split(' ');

  function newSentence(K) {
    let s; do s = pick(SENT); while (G.recent.includes(s));
    G.recent.push(s); if (G.recent.length > 8) G.recent.shift();
    G.s = s; G.w = words(s); G.idx = 0; G.hint = false; G.left = G.limit;
    G.card.innerHTML = `<small>🚉 ${esc(tr({ uk: 'Збери речення англійською:', ru: 'Собери предложение по-английски:' }))}</small>
      <b>${esc(nat(s))}</b><em class="sp2-c15-hint">&nbsp;</em><button class="sp2-c15-say" data-say="1" aria-label="say">🔊</button>`;
    G.card.classList.remove('sp2-in'); void G.card.offsetWidth; G.card.classList.add('sp2-in');
    // локомотив повертається на перон
    G.train.querySelectorAll('.sp2-c15-car').forEach((n) => n.remove());
    G.train.classList.remove('go'); G.train.classList.add('back'); void G.train.offsetWidth; G.train.classList.remove('back');
    let pool = G.w.slice();
    if (G.n >= 2) { const dec = words(pick(SENT.filter((x) => x !== s))).filter((x) => !G.w.includes(x)); if (dec.length) pool.push(pick(dec)); }
    G.yard.innerHTML = shuffle(pool).map((w) => `<button class="sp2-c15-car" style="--car:${pick(CARS)}"><span>${esc(w)}</span><i></i><i class="r"></i></button>`).join('');
    G.busy = false;
  }
  function tapCar(K, el) {
    if (!K.running || G.busy || el.classList.contains('on')) return;
    const need = G.w[G.idx], got = el.textContent;
    if (got === need) {
      el.classList.add('on');
      G.train.appendChild(el);
      el.classList.remove('sp2-in'); void el.offsetWidth; el.classList.add('sp2-in');
      K.hit(el, 8); K.sfx('tap'); K.hap('light');
      G.idx++;
      if (G.idx >= G.w.length) depart(K, true);
    } else {
      K.miss(el, need, `✗ ${got}`); K.sfx('wrong');
      G.hint = true; G.card.querySelector('.sp2-c15-hint').textContent = `💡 ${G.w.slice(0, G.idx + 1).join(' ')} …`;
    }
  }
  function depart(K, ok) {
    G.busy = true; G.n++;
    if (ok) {
      const bonus = 10 + Math.round(20 * Math.max(0, G.left / G.limit));
      K.score += bonus; K.hud(); K.sfx('combo'); K.hap('medium');
      K.toast(`🚄 ${pick(['Pünktlich!', 'On time!', 'All aboard!', 'Gute Fahrt!'])} +${bonus}`, 'combo');
      K.learn(G.s[0], nat(G.s)); K.speak(G.s[0]);
    } else {
      K.miss(null, G.w[G.idx], `⏰ ${G.s[0]}`); K.sfx('wrong');
      K.learn(G.s[0], nat(G.s));
      G.yard.innerHTML = '';
    }
    G.train.classList.add('go');
    K.later(() => { if (K.running) newSentence(K); }, ok ? 1300 : 1600);
  }

  const cleanup = makeGame(root, params, app, {
    wid, cls: 'sp2-c15', ico: '🚂', secs: 85, minOk: 14,
    title: { uk: 'Потяг вчасно', ru: 'Поезд вовремя' },
    rules: [
      { uk: '🚉 Угорі — речення рідною мовою. На колії чекають вагони з англійськими словами.', ru: '🚉 Вверху — предложение на родном языке. На путях ждут вагоны с английскими словами.' },
      { uk: '👆 Тапай вагони по ПОРЯДКУ речення — вони зчіплюються з локомотивом. Зайвий вагон не бери!', ru: '👆 Тапай вагоны по ПОРЯДКУ предложения — они сцепляются с локомотивом. Лишний вагон не бери!' },
      { uk: '⏰ Встигни до відправлення — потяг рушить вчасно, бонус за кожну секунду запасу.', ru: '⏰ Успей до отправления — поезд тронется вовремя, бонус за каждую секунду запаса.' },
    ],
    beat: {
      bpm: BPM, steps: 2,
      fn(K, step, t) {
        const sy = K.synth; if (!sy) return;
        if (step % 2 === 0) sy.noise(t, 0.05, { v: step % 4 === 0 ? 0.12 : 0.06, f: 1800, type: 'bandpass' }); // «чух»
        if (step % 4 === 0) sy.tone(midi(step % 16 < 8 ? 43 : 38), t, 0.3, { w: 'triangle', v: 0.2 });
        const m = MEL[step % 32];
        if (m != null && (step >> 5) % 2 === 1) { const f = midi(SCALE[m] || 72); sy.tone(f, t, 0.24, { w: 'square', v: 0.05 }); sy.tone(f / 2, t, 0.24, { w: 'sine', v: 0.06 }); }
      },
    },
    build(K) {
      K.field.innerHTML = `<div class="sp2-c15-card"></div>
        <div class="sp2-c15-stage"><div class="sp2-c15-sky"><i class="sp2-c15-castle"></i><i class="sp2-c15-firs"></i>
          <div class="sp2-c15-clock"><i class="h"></i><i class="m"></i></div></div>
          <div class="sp2-c15-platform"><div class="sp2-c15-train"><span class="sp2-c15-loco"><svg viewBox="0 0 84 52" aria-hidden="true"><path d="M2 40 L10 30 H14 V40Z" fill="#54504a" stroke="#1e1e1e" stroke-width="2"/><rect x="12" y="20" width="44" height="20" rx="9" fill="#1e1e1e"/><rect x="18" y="8" width="8" height="14" fill="#1e1e1e"/><rect x="15" y="5" width="14" height="5" rx="2" fill="#dd0000"/>
            <rect x="34" y="14" width="8" height="8" rx="4" fill="#ffce00" stroke="#1e1e1e" stroke-width="2"/><rect x="54" y="6" width="28" height="34" rx="3" fill="#dd0000" stroke="#1e1e1e" stroke-width="2.4"/><rect x="51" y="3" width="33" height="6" rx="2" fill="#1e1e1e"/><rect x="60" y="13" width="16" height="11" rx="2" fill="#cfe8fa" stroke="#1e1e1e" stroke-width="2"/>
            <path d="M12 30 H56" stroke="#ffce00" stroke-width="2.4"/><circle cx="8" cy="30" r="3.4" fill="#fff6c2" stroke="#1e1e1e" stroke-width="1.6"/><g fill="#54504a" stroke="#1e1e1e" stroke-width="2.4"><circle cx="24" cy="42" r="8"/><circle cx="44" cy="42" r="8"/><circle cx="70" cy="44" r="6"/></g>
            <path d="M24 42 H44" stroke="#dd0000" stroke-width="3"/></svg></span></div><i class="sp2-c15-rail"></i></div>
          <div class="sp2-c15-yard"></div></div>`;
      G = {
        recent: [], n: 0, idx: 0, w: [], s: null, busy: true, limit: K.calm ? 1e9 : 16, left: 16,
        card: K.$('.sp2-c15-card'), train: K.$('.sp2-c15-train'), yard: K.$('.sp2-c15-yard'), hand: K.$('.sp2-c15-clock .m'),
      };
      G.card.innerHTML = `<small>🚉</small><b>${esc(tr({ uk: 'Потяг прибуває…', ru: 'Поезд прибывает…' }))}</b>`;
      G.yard.addEventListener('pointerdown', (e) => { const b = e.target.closest('.sp2-c15-car'); if (b) { e.preventDefault(); tapCar(K, b); } });
      G.card.addEventListener('click', (e) => { if (e.target.closest('[data-say]') && G.s) K.speakAlways(G.s[0]); });
    },
    start(K) { newSentence(K); },
    frame(K, now, dt) {
      if (G.busy || !G.s) return;
      if (!K.calm) {
        G.left -= dt;
        G.hand.style.transform = `rotate(${(360 * (1 - G.left / G.limit)).toFixed(1)}deg)`;
        if (G.left <= 0) depart(K, false);
      } else G.hand.style.transform = `rotate(${((now * 20) % 360).toFixed(1)}deg)`;
    },
  });
  return cleanup;
}
