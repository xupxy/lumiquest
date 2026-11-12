// 🇪🇸 c6 «Фламенко-ритм» — ритм-гра: у 3 доріжках падають віяла-ноти зі словами під палмас і гітару (WebAudio).
// Збираєш англійське речення: у такт тапаєш доріжку з НАСТУПНИМ словом, коли нота на лінії. Помилка/пропуск — слово повториться.
import { makeGame, tr, esc, shuffle, pick, countryWords, midi } from './_sp2kit.js?v=20261112180927';

export const meta = { topbar: false };

const SENT = [
  ['Many shops close for a siesta', 'Багато крамниць зачиняються на сієсту', 'Многие магазины закрываются на сиесту'],
  ['The fiesta starts at midnight', 'Фієста починається опівночі', 'Фиеста начинается в полночь'],
  ['We share tapas with friends', 'Ми ділимо тапас із друзями', 'Мы делим тапас с друзьями'],
  ['Flamenco is full of passion', 'Фламенко сповнене пристрасті', 'Фламенко полно страсти'],
  ['Real fans never miss a match', 'Справжні фанати не пропускають жодного матчу', 'Настоящие фанаты не пропускают ни одного матча'],
  ['Dinner in Spain is very late', 'Вечеря в Іспанії дуже пізня', 'Ужин в Испании очень поздний'],
  ['The whole town dances in the street', 'Усе місто танцює на вулиці', 'Весь город танцует на улице'],
  ['Paella is cooked in a wide pan', 'Паелью готують у широкій пательні', 'Паэлью готовят на широкой сковороде'],
  ['Let us watch the football tonight', 'Давай подивимося футбол сьогодні ввечері', 'Давай посмотрим футбол сегодня вечером'],
  ['La Tomatina is a tomato fight', 'Ла Томатіна — це томатна битва', 'Ла Томатина — это томатная битва'],
  ['The guitar plays and we clap', 'Гітара грає, а ми плескаємо', 'Гитара играет, а мы хлопаем'],
];
const EXTRA = ['sun', 'beach', 'bull', 'goal', 'dance', 'late', 'early', 'quiet', 'cold', 'rain', 'sleep', 'river', 'plate', 'song', 'slowly'];

const BPM = 100, BEAT = 60 / BPM, ROW_EVERY = 2 * BEAT, TRAVEL = 4 * BEAT, WIN = 0.24, PERF = 0.09, LEAD = 1.2;
// андалузька каденція Am–G–F–E
const CHORDS = [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]];

export function render(root, params, app) {
  const wid = 'c6';
  let G = null;
  const onKey = (e) => { const k = { ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2, 1: 0, 2: 1, 3: 2 }[e.key]; if (k != null && G) { e.preventDefault(); lane(G.K, k); } };

  function lane(K, li) {
    if (!K.running) return;
    const pad = G.pads[li]; pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit');
    const now = K.now();
    const row = G.rows.find((r) => !r.done && Math.abs(r.at - now) <= WIN);
    if (!row) { K.sfx('tap'); return; }
    row.done = true;
    const note = row.el.children[li];
    const ok = row.words[li] === G.stream[row.g].w;
    if (ok) {
      const perfect = Math.abs(row.at - now) <= PERF;
      K.hit(note, perfect ? 15 : 10, perfect ? 'PERFECT!' : 'GOOD');
      row.el.classList.add('gone'); note.classList.add('win');
      if (K.synth) K.synth.pluck(midi(76 - li * 3), K.synth.now(), 0.18); else K.sfx('pop');
      K.hap('light');
      G.dancer.classList.remove('twirl'); void G.dancer.offsetWidth; G.dancer.classList.add('twirl');
      advance(K);
    } else {
      K.miss(note, G.stream[row.g].w, '✗');
      row.el.classList.add('gone'); K.sfx('wrong');
      replan(row.g);
    }
  }
  function advance(K) {
    const cur = G.stream[G.cur];
    G.cur++;
    paintSentence(K);
    if (cur.last) {
      const s = SENT[cur.si];
      K.learn(s[0], tr([s[1], s[2]]));
      K.toast(`💃 Olé!  ${s[0]}`, 'combo');
      K.score += 20; K.hud();
      K.sfx('combo');
    }
  }
  function replan(g) { // слово g не зібрано — переписуємо ноти, що летять, починаючи з g
    G.plan = g;
    G.rows.filter((r) => !r.done && r.g >= g).sort((a, b) => a.at - b.at).forEach((r) => fill(r, G.plan++));
  }
  function fill(r, g) {
    while (G.stream.length <= g + 2) pushSentence();
    r.g = g;
    const right = G.stream[g].w;
    const sameSent = G.stream.filter((x) => x.si === G.stream[g].si && x.w !== right).map((x) => x.w);
    const others = shuffle([...new Set([...sameSent, ...G.pool])].filter((w) => w.toLowerCase() !== right.toLowerCase())).slice(0, 2);
    r.words = shuffle([right, ...others]);
    r.el.innerHTML = r.words.map((w, i) => `<span class="sp2-c6-note n${i}"><em>${esc(w)}</em></span>`).join('');
  }
  function pushSentence() {
    if (!G.order.length) G.order = shuffle(SENT.map((_, i) => i));
    const si = G.order.pop();
    const ws = SENT[si][0].split(' ');
    ws.forEach((w, i) => G.stream.push({ w, si, wi: i, last: i === ws.length - 1 }));
  }
  function paintSentence() {
    while (G.stream.length <= G.cur) pushSentence();
    const cur = G.stream[G.cur];
    const s = SENT[cur.si];
    if (G.shownSi !== cur.si) {
      G.shownSi = cur.si;
      G.card.querySelector('.sp2-c6-tr').textContent = tr([s[1], s[2]]);
      G.card.classList.remove('sp2-in'); void G.card.offsetWidth; G.card.classList.add('sp2-in');
    }
    const ws = s[0].split(' ');
    const done = cur.wi;
    G.card.querySelector('.sp2-c6-slots').innerHTML = ws.map((w, i) => `<span class="${i < done ? 'on' : i === done ? 'next' : ''}">${i < done ? esc(w) : '•••'}</span>`).join('');
  }

  const cleanup = makeGame(root, params, app, {
    wid, cls: 'sp2-c6', ico: '💃', secs: 75, minOk: 12,
    title: { uk: 'Фламенко-ритм', ru: 'Фламенко-ритм' },
    rules: [
      { uk: '🪭 Угорі — речення українською. Збери його англійською, слово за словом!', ru: '🪭 Вверху — предложение по-русски. Собери его по-английски, слово за словом!' },
      { uk: '🎶 Віяла-ноти падають у такт. Коли ряд торкнеться золотої лінії — тапни доріжку з НАСТУПНИМ словом.', ru: '🎶 Веера-ноты падают в такт. Когда ряд коснётся золотой линии — тапни дорожку со СЛЕДУЮЩИМ словом.' },
      { uk: '⭐ Точність і влучання в ритм = більше зірок. Olé!', ru: '⭐ Точность и попадание в ритм = больше звёзд. Olé!' },
    ],
    beat: {
      bpm: BPM, steps: 2,
      fn(K, step, t) {
        const sy = K.synth; if (!sy) return;
        const beat = step >> 1, off = step & 1, c = beat % 12 + 1; // компас на 12
        if (!off) {
          const acc = [3, 6, 8, 10, 12].includes(c);
          sy.clap(t, acc ? 0.42 : 0.14);
          if (c === 1 || c === 7) sy.kick(t, 0.6);
          const ch = CHORDS[((beat / 3) | 0) % 4];
          if (acc || c === 1) ch.forEach((m, i) => sy.pluck(midi(m - 12 + (i ? 12 : 0)), t + i * 0.018, 0.16)); // расгеадо
          else if (c % 2) sy.pluck(midi(ch[0] - 12), t, 0.1);
        } else if ([2, 5, 9, 11].includes(c)) sy.pluck(midi(CHORDS[((beat / 3) | 0) % 4][1] + 12), t, 0.06);
      },
    },
    build(K) {
      K.field.innerHTML = `<div class="sp2-c6-card"><div class="sp2-c6-tr"></div><div class="sp2-c6-slots"></div></div>
        <div class="sp2-c6-stage"><i class="sp2-c6-lane"></i><i class="sp2-c6-lane"></i><i class="sp2-c6-lane"></i><div class="sp2-c6-line"></div>
        <div class="sp2-c6-dancer">💃</div></div>
        <div class="sp2-c6-pads">${[0, 1, 2].map((i) => `<button class="sp2-c6-pad p${i}" data-l="${i}">${['◀', '▼', '▶'][i]}</button>`).join('')}</div>`;
      const extra = countryWords(app, wid).map((p) => p[1]).filter((w) => !/\s/.test(w));
      G = {
        K, rows: [], stream: [], order: [], cur: 0, plan: 0, nextAt: LEAD + TRAVEL, shownSi: -1,
        pool: [...EXTRA, ...extra.slice(0, 40)],
        stage: K.$('.sp2-c6-stage'), card: K.$('.sp2-c6-card'), dancer: K.$('.sp2-c6-dancer'), pads: [...K.field.querySelectorAll('.sp2-c6-pad')],
      };
      pushSentence(); paintSentence(K);
      K.field.querySelector('.sp2-c6-pads').addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-l]'); if (b) lane(K, +b.dataset.l); });
      G.stage.addEventListener('pointerdown', (e) => { const n = e.target.closest('.sp2-c6-note'); if (n) lane(K, [...n.parentNode.children].indexOf(n)); });
      window.addEventListener('keydown', onKey);
    },
    start() { G.lineY = 0; },
    frame(K, now) {
      const H = G.stage.clientHeight, lineY = H - 46;
      while (G.nextAt - TRAVEL <= now) {
        const el = document.createElement('div'); el.className = 'sp2-c6-row';
        const r = { at: G.nextAt, el, done: false };
        fill(r, G.plan++);
        G.stage.appendChild(el); G.rows.push(r);
        G.nextAt += ROW_EVERY;
      }
      for (let i = G.rows.length - 1; i >= 0; i--) {
        const r = G.rows[i];
        const y = lineY * (1 - (r.at - now) / TRAVEL) - 24;
        r.el.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
        if (!r.done && now - r.at > WIN) { // пропуск
          r.done = true; r.el.classList.add('gone', 'missed');
          K.miss(null, G.stream[r.g].w, 'MISS'); K.sfx('wrong');
          replan(r.g);
        }
        if (now - r.at > 1.2 || (r.done && r.el.classList.contains('gone') && now - r.at > 0.5)) { r.el.remove(); G.rows.splice(i, 1); }
      }
    },
    cleanup() { window.removeEventListener('keydown', onKey); },
  });
  return cleanup;
}
