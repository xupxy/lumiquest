// 🇰🇷 c10 «K-pop денс-баттл» — ритм-гра на 4 доріжки під ОРИГІНАЛЬНИЙ трек (WebAudio-синт, 112 BPM, ля-мінор).
// Стрілки — танцювальні рухи (тапай доріжку вчасно). Кожні 4 такти — рядок пісні англійською з пропуском:
// летять дві ноти-слова, тапни доріжку з правильним словом. ⭐ за точність.
import { makeGame, tr, esc, shuffle, pick, midi } from './_sp2kit.js?v=20261112121905';

export const meta = { topbar: false };

const LYRICS = [
  ['Shine like the ___ lights', 'city', 'bitter', 'Сяй, як вогні міста', 'Сияй, как огни города'],
  ['We dance until the ___ comes up', 'sun', 'soup', 'Ми танцюємо, поки не зійде сонце', 'Мы танцуем, пока не взойдёт солнце'],
  ['Text me when you ___ home', 'get', 'eat', 'Напиши мені, коли дістанешся додому', 'Напиши мне, когда доберёшься домой'],
  ['Street food tastes ___ at night', 'better', 'louder', 'Вулична їжа смачніша вночі', 'Уличная еда вкуснее ночью'],
  ['Hold my hand and ___ let go', 'don\'t', 'doesn\'t', 'Тримай мене за руку й не відпускай', 'Держи меня за руку и не отпускай'],
  ['Every ___ we practise harder', 'day', 'dog', 'Щодня ми тренуємося старанніше', 'Каждый день мы тренируемся усерднее'],
  ['The fans are ___ our name', 'shouting', 'sleeping', 'Фанати вигукують наше ім\'я', 'Фанаты выкрикивают наше имя'],
  ['My phone is ___ of selfies', 'full', 'fill', 'Мій телефон повний селфі', 'Мой телефон полон селфи'],
  ['Let\'s take the ___ to Gangnam', 'subway', 'spoon', 'Поїхали метро до Каннаму', 'Поехали на метро в Каннам'],
  ['Spicy rice cakes are called ___', 'tteokbokki', 'kimchi', 'Гострі рисові палички звуться токпоккі', 'Острые рисовые палочки называются токпокки'],
  ['Fried ___ and a cold soda', 'chicken', 'kitchen', 'Смажена курка й холодна газованка', 'Жареная курица и холодная газировка'],
  ['Bow when you ___ someone older', 'greet', 'great', 'Вклоняйся, коли вітаєшся зі старшими', 'Кланяйся, когда здороваешься со старшими'],
  ['Never give ___ on your dream', 'up', 'out', 'Ніколи не відмовляйся від мрії', 'Никогда не отказывайся от мечты'],
  ['Neon signs are ___ everywhere', 'glowing', 'growing', 'Неонові вивіски сяють усюди', 'Неоновые вывески светятся повсюду'],
  ['We ___ hard for our debut', 'trained', 'rained', 'Ми важко тренувалися до дебюту', 'Мы усердно тренировались к дебюту'],
  ['Say ___ to the camera', 'kimchi', 'kitchen', 'Скажи «кімчі» на камеру (як «cheese»)', 'Скажи «кимчи» на камеру (как «cheese»)'],
];

const BPM = 112, B = 60 / BPM, TRAVEL = 1.55, PERF = 0.075, GOOD = 0.15, SECS = 80;
const ARW = ['←', '↓', '↑', '→'];
const PAT = [0, 1, 2, 3, 3, 2, 1, 0, 0, 3, 1, 2, 2, 1, 3, 0];
const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
// власний мотив (ля-мінорна пентатоніка), 32 шістнадцятих = 2 такти
const MEL = [76, 0, 0, 74, 0, 72, 0, 69, 0, 0, 72, 0, 74, 0, 76, 0, 79, 0, 0, 76, 0, 74, 0, 72, 74, 0, 72, 0, 69, 0, 0, 0];
const MEL2 = [69, 0, 72, 0, 74, 0, 76, 74, 0, 72, 0, 69, 0, 67, 69, 0, 72, 0, 0, 0, 76, 0, 79, 0, 81, 0, 79, 76, 0, 74, 0, 0];

function chart() {
  const notes = [];
  const end = Math.floor((SECS - 1.5) / B);
  for (let b = 4; b < end; b++) {
    const ph = b % 16, bar = (b / 4) | 0;
    if (ph === 12) { notes.push({ t: b * B, word: true }); continue; }
    if (ph === 13) continue;
    notes.push({ t: b * B, lane: PAT[(b + bar * 3) % 16] });
    if (b > 36 && (b % 4 === 1 || (b > 90 && b % 4 === 3))) notes.push({ t: (b + 0.5) * B, lane: PAT[(b * 7 + 5) % 16] });
  }
  return notes;
}

export function render(root, params, app) {
  const wid = 'c10';
  let G = null;
  const KEYS = { ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3, d: 0, f: 1, j: 2, k: 3 };
  const onKey = (e) => { const k = KEYS[e.key]; if (k != null && G && !e.repeat) { e.preventDefault(); lane(G.K, k); } };

  function judge(K, n, now, li) {
    const d = Math.abs(n.t - now);
    n.done = true; n.el.classList.add('gone');
    if (d <= PERF) { K.hit(null, 12); K.floatAt(G.lx(li), G.lineY - 50, 'PERFECT!', 'ok', G.stage); }
    else { K.hit(null, 8); K.floatAt(G.lx(li), G.lineY - 50, 'GOOD', 'ok', G.stage); }
    G.dancer.className = `sp2-c10-dancer m${li}`; void G.dancer.offsetWidth; G.dancer.classList.add('go');
  }
  function lane(K, li) {
    if (!K.running) return;
    const pad = G.pads[li]; pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit');
    const now = K.now();
    let best = null;
    for (const n of G.live) if (!n.done && n.lane === li && Math.abs(n.t - now) <= GOOD && (!best || n.t < best.t)) best = n;
    if (!best) { K.hap('light'); return; }
    if (best.group) { wordPick(K, best.group, best, now); return; }
    K.hap('light');
    judge(K, best, now, li);
  }
  function wordPick(K, gr, n, now) {
    gr.notes.forEach((x) => { x.done = true; x.el.classList.add('gone'); });
    const L = gr.line;
    if (n && n.ok) {
      K.hit(null, 25); K.floatAt(G.lx(n.lane), G.lineY - 60, `✨ ${L[1]}`, 'ok', G.stage); K.sfx('combo');
      G.dancer.className = 'sp2-c10-dancer m2'; void G.dancer.offsetWidth; G.dancer.classList.add('go');
    } else {
      K.miss(null, L[1], n ? `✗ ${L[2]}` : 'MISS'); K.sfx('wrong');
    }
    showLyric(L, true);
    K.learn(L[0].replace('___', L[1]), tr([L[3], L[4]]));
  }
  function showLyric(L, filled) {
    G.lyr.innerHTML = `<b>🎤 ${L[0].split('___').map(esc).join(filled ? `<u>${esc(L[1])}</u>` : '<u>____</u>')}</b><small>${filled ? esc(tr([L[3], L[4]])) : esc(tr({ uk: 'Обери слово, що летить!', ru: 'Выбери слово, которое летит!' }))}</small>`;
    G.lyr.classList.remove('sp2-in'); void G.lyr.offsetWidth; G.lyr.classList.add('sp2-in');
  }
  function spawn(n, K) {
    if (n.word) {
      const L = G.lines.pop() || (G.lines = shuffle(LYRICS)).pop();
      const lanes = shuffle([0, 1, 2, 3]).slice(0, 2);
      const gr = { line: L, notes: [] };
      [L[1], L[2]].forEach((w, i) => {
        const el = document.createElement('div'); el.className = `sp2-c10-note word l${lanes[i]}`; el.innerHTML = `<em>${esc(w)}</em>`;
        el.style.left = `${(lanes[i] + 0.5) * 25}%`;
        const x = { t: n.t, lane: lanes[i], el, group: gr, ok: i === 0, done: false };
        gr.notes.push(x); G.live.push(x); G.stage.appendChild(el);
      });
      showLyric(L, false);
      return;
    }
    const el = document.createElement('div'); el.className = `sp2-c10-note l${n.lane}`; el.innerHTML = `<em>${ARW[n.lane]}</em>`;
    el.style.left = `${(n.lane + 0.5) * 25}%`;
    G.live.push({ ...n, el, done: false }); G.stage.appendChild(el);
  }

  const cleanup = makeGame(root, params, app, {
    wid, cls: 'sp2-c10', ico: '🎤', secs: SECS, minOk: 60,
    title: { uk: 'K-pop денс-баттл', ru: 'K-pop дэнс-баттл' },
    rules: [
      { uk: '🕺 Стрілки падають у ритм пісні — тапай доріжку (або ← ↓ ↑ →), коли стрілка на неоновій лінії.', ru: '🕺 Стрелки падают в ритм песни — тапай дорожку (или ← ↓ ↑ →), когда стрелка на неоновой линии.' },
      { uk: '🎤 Кожні 4 такти — рядок пісні англійською з пропуском. Летять ДВА слова — тапни правильне!', ru: '🎤 Каждые 4 такта — строка песни по-английски с пропуском. Летят ДВА слова — тапни правильное!' },
      { uk: '🎧 Увімкни звук — музика оригінальна, написана для LumiQuest.', ru: '🎧 Включи звук — музыка оригинальная, написана для LumiQuest.' },
    ],
    beat: {
      bpm: BPM, steps: 4,
      fn(K, s, t) {
        const sy = K.synth; if (!sy) return;
        const q = s % 16, bar = (s / 16) | 0, ch = PROG[bar % 4], intro = bar < 1;
        if (q === 0 || q === 8 || (q === 14 && bar % 2)) sy.kick(t, 0.75);
        if (q === 4 || q === 12) { sy.snare(t, 0.3); sy.clap(t, 0.18); }
        if (q % 2 === 0) sy.hat(t, q % 4 ? 0.07 : 0.11); else if (bar > 3) sy.hat(t, 0.04);
        if (intro) return;
        if ([0, 3, 6, 8, 11, 14].includes(q)) sy.bass(midi(ch[0] - 24), t, 0.18, 0.26);
        if (q === 2 || q === 10) sy.chord(ch.map(midi), t, 0.16, 0.045);
        if (bar >= 2) { const m = (bar >> 1) % 2 ? MEL2 : MEL; const n = m[(bar % 2) * 16 + q]; if (n) sy.lead(midi(n), t, 0.16, 0.07); }
        if (q === 0 && bar % 4 === 0 && bar) sy.noise(t, 0.6, { v: 0.08, f: 3000, type: 'highpass' }); // крэш
      },
    },
    build(K) {
      K.field.innerHTML = `<div class="sp2-c10-lyr"></div><div class="sp2-c10-stage"><i class="sp2-c10-lights"></i>
        <div class="sp2-c10-dancer">🕺</div>${[0, 1, 2, 3].map((i) => `<i class="sp2-c10-lane" style="left:${i * 25}%"></i>`).join('')}<div class="sp2-c10-line"></div></div>
        <div class="sp2-c10-pads">${[0, 1, 2, 3].map((i) => `<button class="sp2-c10-pad l${i}" data-l="${i}">${ARW[i]}</button>`).join('')}</div>`;
      G = {
        K, chart: chart(), ci: 0, live: [], lines: shuffle(LYRICS),
        stage: K.$('.sp2-c10-stage'), lyr: K.$('.sp2-c10-lyr'), dancer: K.$('.sp2-c10-dancer'), lights: K.$('.sp2-c10-lights'),
        pads: [...K.field.querySelectorAll('.sp2-c10-pad')], lineY: 300,
      };
      G.lx = (li) => (li + 0.5) * G.stage.clientWidth / 4;
      G.lyr.innerHTML = `<b>🎤 Seoul Nights</b><small>${esc(tr({ uk: 'Готуйся… 1 такт розминки', ru: 'Готовься… 1 такт разминки' }))}</small>`;
      K.field.querySelector('.sp2-c10-pads').addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-l]'); if (b) lane(K, +b.dataset.l); });
      window.addEventListener('keydown', onKey);
    },
    start() {},
    frame(K, now) {
      const H = G.stage.clientHeight; G.lineY = H - 40;
      while (G.ci < G.chart.length && G.chart[G.ci].t - TRAVEL <= now) spawn(G.chart[G.ci++], K);
      const ph = (now / B) % 1;
      G.lights.style.opacity = (0.35 + 0.65 * (1 - ph) ** 2).toFixed(2);
      for (let i = G.live.length - 1; i >= 0; i--) {
        const n = G.live[i];
        const y = G.lineY * (1 - (n.t - now) / TRAVEL) - 22;
        n.el.style.transform = `translate3d(-50%,${y.toFixed(1)}px,0)`;
        if (!n.done && now - n.t > GOOD) {
          if (n.group) wordPick(K, n.group, null, now);
          else { n.done = true; n.el.classList.add('gone', 'missed'); K.miss(null, null); K.floatAt(G.lx(n.lane), G.lineY - 50, 'MISS', 'bad', G.stage); }
        }
        if (now - n.t > 0.6) { n.el.remove(); G.live.splice(i, 1); }
      }
    },
    cleanup() { window.removeEventListener('keydown', onKey); },
  });
  return cleanup;
}
