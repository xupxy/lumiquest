// 🇳🇴 c11 «Драккар у фіорді» — веслуй у ритм барабана, керуй драккаром між трьома протоками.
// Угорі — слово рідною мовою; пливуть руни з англійськими словами: збирай ПРАВИЛЬНУ руну, оминай хибні руни й скелі.
// Гребок точно в долю (PERFECT/GOOD) розганяє човен → більше рядів і очок. Оригінальна музика — WebAudio-синт (ре-дорійський лад, 96 BPM).
import { makeGame, tr, esc, shuffle, pick, countryWords, midi } from './_sp2kit.js?v=20261114075109';

export const meta = { topbar: false };

const NO = [['фіорд', 'фьорд', 'fjord'], ['гора', 'гора', 'mountain'], ['сніг', 'снег', 'snow'], ['лижі', 'лыжи', 'skis'], ['лосось', 'лосось', 'salmon'],
  ['троль', 'тролль', 'troll'], ['човен', 'лодка', 'boat'], ['весло', 'весло', 'oar'], ['вітрило', 'парус', 'sail'], ['вікінг', 'викинг', 'Viking'],
  ['острів', 'остров', 'island'], ['хвиля', 'волна', 'wave'], ['хатинка', 'домик', 'cabin'], ['затишний', 'уютный', 'cozy'], ['зима', 'зима', 'winter'],
  ['лід', 'лёд', 'ice'], ['північний олень', 'северный олень', 'reindeer'], ['лось', 'лось', 'moose'], ['водоспад', 'водопад', 'waterfall'],
  ['светр', 'свитер', 'sweater'], ['вовна', 'шерсть', 'wool'], ['берег', 'берег', 'shore'], ['скеля', 'скала', 'cliff'], ['долина', 'долина', 'valley'],
  ['льодовик', 'ледник', 'glacier'], ['прапор', 'флаг', 'flag'], ['король', 'король', 'king'], ['вафля', 'вафля', 'waffle'], ['пором', 'паром', 'ferry'],
  ['маяк', 'маяк', 'lighthouse'], ['північне сяйво', 'северное сияние', 'northern lights'], ['ліс', 'лес', 'forest'], ['зірка', 'звезда', 'star'], ['холодний', 'холодный', 'cold']];

const BPM = 96, BEAT = 60 / BPM;
// мелодія на восьмих (null = пауза): ре-дорійський «народний» мотив, 2 такти × 8
const MEL = [62, null, 65, 67, 69, null, 67, 65, 64, null, 62, 64, 65, null, 64, 62, 69, null, 72, 71, 69, null, 67, 69, 65, 64, 62, null, 64, null, 62, null];
const BASS = [38, 38, 41, 36]; // D F C… по тактах

export function render(root, params, app) {
  const wid = 'c11';
  let G = null;

  const laneX = (l) => G.W * (l * 2 + 1) / 6;

  function newRow() {
    let t; do { t = pick(G.pairs); } while (G.pairs.length > 2 && G.recent.includes(t[1]));
    G.recent.push(t[1]); if (G.recent.length > 4) G.recent.shift();
    const wrong = pick(G.pairs.filter((p) => p[1] !== t[1]));
    const kinds = shuffle(['ok', 'bad', Math.random() < 0.7 ? 'rock' : 'none']);
    const row = { t, y: -60, items: [], done: false };
    kinds.forEach((k, lane) => {
      if (k === 'none') return;
      const el = document.createElement('div');
      el.className = `sp2-c11-obj ${k === 'rock' ? 'rock' : 'rune'}`;
      el.innerHTML = k === 'rock' ? '<span>🪨</span>' : `<span>ᚱ</span><em>${esc(k === 'ok' ? t[1] : wrong[1])}</em>`;
      G.river.appendChild(el);
      row.items.push({ lane, k, w: k === 'ok' ? t[1] : k === 'bad' ? wrong[1] : '', el, hit: false });
    });
    G.rows.push(row);
    showTarget();
  }
  function showTarget() {
    const row = G.rows.find((r) => !r.done);
    if (!row || row === G.shown) return;
    G.shown = row;
    G.card.innerHTML = `<small>${esc(tr({ uk: 'Пливи до руни:', ru: 'Плыви к руне:' }))}</small><b>«${esc(row.t[0])}»</b>`;
    G.card.classList.remove('sp2-in'); void G.card.offsetWidth; G.card.classList.add('sp2-in');
  }
  function steer(K, d) {
    if (!K.running) return;
    const n = Math.max(0, Math.min(2, G.lane + d));
    if (n === G.lane) return;
    G.lane = n; K.sfx('tap');
  }
  function row(K) {
    if (!K.running) return;
    const now = K.now();
    const ph = now / BEAT, off = Math.abs(ph - Math.round(ph)) * BEAT; // секунди до найближчої долі
    G.oar.classList.remove('row'); void G.oar.offsetWidth; G.oar.classList.add('row');
    const bx = laneX(G.lane), by = G.H - 120;
    if (off < 0.09) { G.boost = Math.min(0.32, G.boost + 0.07); K.score += 5; K.hud(); K.floatAt(bx, by, 'PERFECT!', 'ok', G.river); K.hap('light'); }
    else if (off < 0.18) { G.boost = Math.min(0.32, G.boost + 0.035); K.score += 2; K.hud(); K.floatAt(bx, by, 'GOOD', 'ok', G.river); }
    else { G.boost = Math.max(0, G.boost - 0.03); K.floatAt(bx, by, tr({ uk: 'Не в такт', ru: 'Не в такт' }), 'bad', G.river); }
  }
  function resolve(K, r) {
    r.done = true;
    const it = r.items.find((x) => x.lane === G.lane);
    const okItem = r.items.find((x) => x.k === 'ok');
    if (it && it.k === 'ok') {
      it.hit = true; it.el.classList.add('got');
      K.hit(G.boat, Math.round(10 * (1 + G.boost * 2)), pick(['Skål! 🛶', 'Flott!', 'Great rowing!', 'Rune found!']));
      K.sfx('coin'); K.learn(r.t[1], r.t[0]); K.speak(r.t[1]);
    } else {
      if (it && it.k === 'rock') {
        it.el.classList.add('crash'); G.boost = 0; G.slow = 0.6;
        G.boat.classList.remove('bump'); void G.boat.offsetWidth; G.boat.classList.add('bump');
        K.miss(null, null, '🪨 Ouch!'); K.sfx('wrong');
      } else if (it && it.k === 'bad') { it.el.classList.add('wrong'); K.miss(G.boat, r.t[1], `✗ ${it.w}`); K.sfx('wrong'); }
      if (okItem && !(it && it.k === 'rock')) { okItem.el.classList.add('missed'); if (!it) K.miss(null, r.t[1], `→ ${r.t[1]}`); }
      else if (okItem) okItem.el.classList.add('missed');
    }
    showTarget();
  }

  function onKey(e) {
    if (!G?.K.running) return;
    if (e.key === 'ArrowLeft') steer(G.K, -1); else if (e.key === 'ArrowRight') steer(G.K, 1);
    else if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); row(G.K); }
  }

  const cleanup = makeGame(root, params, app, {
    wid, cls: 'sp2-c11', ico: '🛶', secs: 75, minOk: 15,
    title: { uk: 'Драккар у фіорді', ru: 'Драккар во фьорде' },
    rules: [
      { uk: '🛶 Угорі — слово українською. Пливуть руни з англійськими словами — заплив у протоку з ПРАВИЛЬНОЮ руною.', ru: '🛶 Вверху — слово по-русски. Плывут руны с английскими словами — заплыви в протоку с ПРАВИЛЬНОЙ руной.' },
      { uk: '◀ ▶ — кермо (або тапни ліву/праву половину фіорду). Оминай хибні руни й скелі 🪨.', ru: '◀ ▶ — руль (или тапни левую/правую половину фьорда). Обходи ложные руны и скалы 🪨.' },
      { uk: '🥁 Тисни «Гребок» точно в удар барабана — драккар розганяється, очки ростуть!', ru: '🥁 Жми «Гребок» точно в удар барабана — драккар разгоняется, очки растут!' },
    ],
    beat: {
      bpm: BPM, steps: 2,
      fn(K, step, t) {
        const sy = K.synth; if (!sy) return;
        const bar = (step >> 3) % 4;
        if (step % 2 === 0) sy.tone(step % 8 === 0 ? 70 : 92, t, 0.32, { w: 'sine', v: step % 8 === 0 ? 0.7 : 0.45, f2: 40 });
        if (step % 4 === 2) sy.noise(t, 0.08, { v: 0.12, f: 900, q: 1.2 });
        if (step % 8 === 0) { sy.bass(midi(BASS[bar]), t, BEAT * 3.6, 0.2); sy.tone(midi(BASS[bar] + 12), t, BEAT * 3.6, { w: 'triangle', v: 0.05, a: 0.2 }); }
        const m = MEL[step % MEL.length];
        if (m && (step >> 5) % 2 === 1) sy.tone(midi(m + 12), t, 0.28, { w: 'triangle', v: 0.09, a: 0.01 }); // «скрипка-хардингфеле» — кожен другий цикл
        else if (m && step % 2 === 0) sy.pluck(midi(m), t, 0.1);
      },
    },
    build(K) {
      K.field.innerHTML = `<div class="sp2-c11-card"></div>
        <div class="sp2-c11-river"><i class="sp2-c11-sky"></i><i class="sp2-c11-wall l"></i><i class="sp2-c11-wall r"></i><i class="sp2-c11-flow"></i>
          <div class="sp2-c11-boat"><svg viewBox="0 0 80 110" aria-hidden="true"><path d="M40 4 C58 26 62 70 54 100 H26 C18 70 22 26 40 4Z" fill="#8a5a30" stroke="#4a2c14" stroke-width="3"/>
          <path d="M40 4 C46 12 48 20 46 26 H34 C32 20 34 12 40 4Z" fill="#ffc94a" stroke="#4a2c14" stroke-width="2"/>
          <rect x="18" y="38" width="44" height="34" rx="3" fill="#fff" stroke="#4a2c14" stroke-width="2"/><path d="M26 38 V72 M40 38 V72 M54 38 V72" stroke="#d7263d" stroke-width="6"/>
          <g fill="#ffc94a" stroke="#4a2c14" stroke-width="1.5"><circle cx="24" cy="84" r="4"/><circle cx="56" cy="84" r="4"/></g></svg>
          <i class="sp2-c11-oar"></i></div></div>
        <div class="sp2-c11-pads"><button class="sp2-c11-pad" data-a="l">◀</button><button class="sp2-c11-pad row" data-a="row"><i class="sp2-c11-drum"></i>🥁 ${esc(tr({ uk: 'Гребок', ru: 'Гребок' }))}</button><button class="sp2-c11-pad" data-a="r">▶</button></div>`;
      const extra = countryWords(app, wid).map((p) => [p[0], p[1]]);
      G = {
        K, pairs: [...NO.map((p) => [tr([p[0], p[1]]), p[2]]), ...extra], rows: [], recent: [], shown: null,
        lane: 1, bx: 0, boost: 0, slow: 0, dist: 0, flow: 0, W: 300, H: 420,
        card: K.$('.sp2-c11-card'), river: K.$('.sp2-c11-river'), boat: K.$('.sp2-c11-boat'), oar: K.$('.sp2-c11-oar'), drum: K.$('.sp2-c11-drum'), flowEl: K.$('.sp2-c11-flow'),
      };
      G.card.innerHTML = `<small>🛶</small><b>${esc(tr({ uk: 'Готуйся веслувати!', ru: 'Готовься грести!' }))}</b>`;
      K.$('.sp2-c11-pads').addEventListener('pointerdown', (e) => {
        const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
        e.preventDefault();
        if (a === 'l') steer(K, -1); else if (a === 'r') steer(K, 1); else row(K);
        e.target.closest('[data-a]').classList.remove('hit'); void e.target.offsetWidth; e.target.closest('[data-a]').classList.add('hit');
      });
      G.river.addEventListener('pointerdown', (e) => {
        const r = G.river.getBoundingClientRect();
        steer(K, e.clientX - r.left < r.width / 2 ? -1 : 1);
      });
      document.addEventListener('keydown', onKey);
    },
    start(K) {
      G.W = G.river.clientWidth; G.H = G.river.clientHeight; G.bx = laneX(1);
      G.rows.forEach((r) => r.items.forEach((i) => i.el.remove())); G.rows = []; G.dist = 0;
      newRow();
    },
    frame(K, now, dt) {
      G.W = G.river.clientWidth; G.H = G.river.clientHeight;
      G.boost = Math.max(0, G.boost - dt * 0.035);
      G.slow = Math.max(0, G.slow - dt);
      const speed = G.H * (0.3 + Math.min(0.12, now * 0.0016) + G.boost) * (G.slow > 0 ? 0.45 : 1);
      const dy = speed * dt;
      G.dist += dy;
      if (G.dist > G.H * 0.5) { G.dist = 0; newRow(); }
      // течія
      G.flow = (G.flow + dy) % 80;
      G.flowEl.style.transform = `translate3d(0,${G.flow.toFixed(1)}px,0)`;
      // човен — плавно до своєї протоки
      const tx = laneX(G.lane);
      G.bx += (tx - G.bx) * Math.min(1, dt * 12);
      const tilt = (tx - G.bx) * 0.12;
      G.boat.style.transform = `translate3d(${(G.bx - 40).toFixed(1)}px,0,0) rotate(${tilt.toFixed(1)}deg)`;
      // метроном барабана
      const ph = (now / BEAT) % 1;
      G.drum.style.transform = `scale(${(1 + 0.35 * Math.max(0, 1 - ph * 4)).toFixed(3)})`;
      const boatY = G.H - 96;
      for (const r of G.rows) {
        r.y += dy;
        for (const it of r.items) if (!it.hit) it.el.style.transform = `translate3d(${(laneX(it.lane) - 44).toFixed(1)}px,${r.y.toFixed(1)}px,0)`;
        if (!r.done && r.y + 30 >= boatY) resolve(K, r);
      }
      while (G.rows.length && G.rows[0].y > G.H + 20) { G.rows.shift().items.forEach((i) => i.el.remove()); }
    },
    cleanup() { document.removeEventListener('keydown', onKey); },
    end() { document.removeEventListener('keydown', onKey); },
  });
  return cleanup;
}
