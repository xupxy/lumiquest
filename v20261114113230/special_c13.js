// 🇬🇷 c13 «Олімпійські ігри» — метання диска / списа на античному стадіоні.
// Угорі — слово рідною мовою, внизу — 3 англійські варіанти. Шкала сили гойдається: тапни ПРАВИЛЬНЕ слово —
// атлет кидає (дальність = сила шкали в момент тапу), хибне — «FOUL». Кожні 4 спроби — нова дисципліна.
// Музика — оригінальний WebAudio-синт (112 BPM, «бузукі» на ре-фригійській домінанті).
import { makeGame, tr, esc, shuffle, pick, countryWords, midi } from './_sp2kit.js?v=20261114113225';

export const meta = { topbar: false };

const GR = [['оливка', 'оливка', 'olive'], ['храм', 'храм', 'temple'], ['острів', 'остров', 'island'], ['море', 'море', 'sea'], ['міф', 'миф', 'myth'],
  ['герой', 'герой', 'hero'], ['колона', 'колонна', 'column'], ['човен', 'лодка', 'boat'], ['риба', 'рыба', 'fish'], ['салат', 'салат', 'salad'],
  ['сир', 'сыр', 'cheese'], ['хліб', 'хлеб', 'bread'], ['мед', 'мёд', 'honey'], ['лимон', 'лимон', 'lemon'], ['бігти', 'бежать', 'run'],
  ['стрибати', 'прыгать', 'jump'], ['кидати', 'бросать', 'throw'], ['перемагати', 'побеждать', 'win'], ['медаль', 'медаль', 'medal'], ['золото', 'золото', 'gold'],
  ['срібло', 'серебро', 'silver'], ['перегони', 'забег', 'race'], ['стадіон', 'стадион', 'stadium'], ['смолоскип', 'факел', 'torch'], ['вінок', 'венок', 'wreath'],
  ['статуя', 'статуя', 'statue'], ['корабель', 'корабль', 'ship'], ['пляж', 'пляж', 'beach'], ['друг', 'друг', 'friend'], ['сонце', 'солнце', 'sun'],
  ['сильний', 'сильный', 'strong'], ['швидкий', 'быстрый', 'fast'], ['далеко', 'далеко', 'far'], ['вітер', 'ветер', 'wind'], ['руїни', 'руины', 'ruins'],
  ['лабіринт', 'лабиринт', 'maze'], ['історія', 'история', 'history'], ['гора', 'гора', 'mountain'], ['виноград', 'виноград', 'grapes'], ['чемпіон', 'чемпион', 'champion']];

const EVENTS = [{ ico: '🥏', en: 'Discus' }, { ico: '🎯', en: 'Javelin' }];
const BPM = 112, BEAT = 60 / BPM;
// ре-фригійська домінанта (D Eb F# G A Bb C) — «бузукі» на восьмих, 2 такти × 8
const MEL = [62, 63, 66, 67, 69, null, 67, 66, 67, 69, 70, 69, 67, 66, 63, 62, 69, 70, 72, 70, 69, 67, 66, 67, 66, 63, 62, null, 63, 66, 62, null];
const BASS = [38, 38, 36, 38];

const athlete = () => `<svg viewBox="0 0 60 100" aria-hidden="true"><g fill="#f4eedd" stroke="#0e2348" stroke-width="2.4" stroke-linejoin="round">
  <circle cx="30" cy="16" r="10"/><path d="M20 30 C22 26 38 26 40 30 L42 60 H18Z"/><path d="M22 60 L16 94 H24 L30 66 L36 94 H44 L38 60Z"/></g>
  <path d="M22 10 C26 4 34 4 38 10" fill="none" stroke="#6e8f4a" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M18 34 L36 50" stroke="#1e5fb8" stroke-width="3"/></svg>`;

export function render(root, params, app) {
  const wid = 'c13';
  let G = null;

  function newRound(K) {
    if (!K.running) return;
    let t; do { t = pick(G.pairs); } while (G.pairs.length > 3 && G.recent.includes(t[1]));
    G.recent.push(t[1]); if (G.recent.length > 6) G.recent.shift();
    const wrong = shuffle(G.pairs.filter((p) => p[1] !== t[1])).slice(0, 2).map((p) => p[1]);
    G.t = t; G.busy = false;
    if (G.round % 4 === 0) {
      G.ev = EVENTS[(G.round / 4) % EVENTS.length];
      G.evChip.textContent = `${G.ev.ico} ${G.ev.en}`;
      G.evChip.classList.remove('sp2-in'); void G.evChip.offsetWidth; G.evChip.classList.add('sp2-in');
    }
    G.round++;
    G.card.innerHTML = `<small>${esc(tr({ uk: 'Як англійською:', ru: 'Как по-английски:' }))}</small><b>«${esc(t[0])}»</b>`;
    G.card.classList.remove('sp2-in'); void G.card.offsetWidth; G.card.classList.add('sp2-in');
    G.opts.innerHTML = shuffle([t[1], ...wrong]).map((w) => `<button class="sp2-c13-opt" data-w="${esc(w)}">${esc(w)}</button>`).join('');
    G.proj.className = `sp2-c13-proj ${G.ev.ico === '🎯' ? 'jav' : ''}`;
    G.proj.style.opacity = '0';
  }

  function answer(K, btn) {
    if (!K.running || G.busy || !G.t) return;
    const w = btn.dataset.w;
    G.busy = true;
    const power = G.m;
    G.ath.classList.remove('throw'); void G.ath.offsetWidth; G.ath.classList.add('throw');
    if (w === G.t[1]) {
      btn.classList.add('ok');
      const p = 0.45 + 0.55 * power;
      const dist = Math.round((18 + p * 62) * 10) / 10;
      const perfect = power > 0.85;
      K.hit(btn, Math.round(6 + p * 14), perfect ? `PERFECT! ${dist} m` : `${dist} m`);
      K.sfx('whoosh'); K.hap('medium');
      K.learn(G.t[1], G.t[0]); K.speak(G.t[1]);
      throwIt(K, p, dist, true);
    } else {
      btn.classList.add('bad');
      G.opts.querySelector(`[data-w="${CSS.escape(G.t[1])}"]`)?.classList.add('ok');
      K.miss(btn, G.t[1], `FOUL ✗ ${G.t[1]}`); K.sfx('wrong');
      throwIt(K, 0.12, 0, false);
    }
  }

  function throwIt(K, p, dist, good) {
    const W = G.stage.clientWidth, H = G.stage.clientHeight;
    const x0 = W * 0.16, y0 = H * 0.62, x1 = W * (0.24 + 0.68 * p), y1 = H * 0.8;
    G.fly = { t: 0, dur: 0.55 + p * 0.6, x0, y0, x1, y1, h: H * (0.15 + p * 0.38), good, dist };
    G.proj.style.opacity = '1';
  }

  function land(K) {
    const f = G.fly; G.fly = null;
    if (f.good) {
      K.sfx('land');
      const mk = document.createElement('i'); mk.className = 'sp2-c13-mark'; mk.style.transform = `translate3d(${(f.x1 - 2).toFixed(0)}px,0,0)`;
      G.stage.appendChild(mk); K.later(() => mk.remove(), 2400);
      K.floatAt(f.x1, f.y1 - 34, `${f.dist} m`, 'ok', G.stage);
      if (f.dist > G.best) {
        G.best = f.dist; G.bestEl.textContent = `🏅 ${G.best} m`;
        G.bestEl.style.transform = `translate3d(${(f.x1 - 30).toFixed(0)}px,0,0)`;
        if (G.round > 1) { K.toast('🏅 New record!', 'combo'); K.sfx('star'); K.score += 10; K.hud(); }
      }
    }
    K.later(() => newRound(K), f.good ? 450 : 700);
  }

  const cleanup = makeGame(root, params, app, {
    wid, cls: 'sp2-c13', ico: '🏛️', secs: 80, minOk: 12,
    title: { uk: 'Олімпійські ігри', ru: 'Олимпийские игры' },
    rules: [
      { uk: '🏛️ Угорі — слово українською, внизу — три англійські слова.', ru: '🏛️ Вверху — слово по-русски, внизу — три английских слова.' },
      { uk: '💪 Шкала сили гойдається. Тапни ПРАВИЛЬНЕ слово, коли шкала повна, — атлет кине диск далеко!', ru: '💪 Шкала силы качается. Тапни ПРАВИЛЬНОЕ слово, когда шкала полная, — атлет бросит диск далеко!' },
      { uk: '🏅 Хибне слово — «FOUL». Бий рекорди стадіону — бонусні очки!', ru: '🏅 Неверное слово — «FOUL». Бей рекорды стадиона — бонусные очки!' },
    ],
    beat: {
      bpm: BPM, steps: 2,
      fn(K, step, t) {
        const sy = K.synth; if (!sy) return;
        if (step % 4 === 0) sy.bass(midi(BASS[(step >> 4) % 4]), t, 0.3, 0.26);
        if (step % 4 === 2) sy.chord([midi(62), midi(66), midi(69)], t, 0.1, 0.04);
        if (step % 2 === 0) sy.hat(t, 0.05);
        if (step % 8 === 4) sy.clap(t, 0.16);
        const m = MEL[step % 32];
        if (m && (step >> 5) % 2 === 1) { sy.pluck(midi(m), t, 0.16); if (step % 2) sy.pluck(midi(m), t + BEAT / 4, 0.08); }
      },
    },
    build(K) {
      K.field.innerHTML = `<div class="sp2-c13-card"></div>
        <div class="sp2-c13-stage"><i class="sp2-c13-sun"></i><i class="sp2-c13-sea"></i>
          <div class="sp2-c13-cols">${'<i></i>'.repeat(7)}</div><i class="sp2-c13-track"></i>
          ${[20, 40, 60, 80].map((m) => `<b class="sp2-c13-flag" style="left:${(24 + 68 * (m - 18) / 62).toFixed(1)}%">${m}</b>`).join('')}
          <span class="sp2-c13-ev"></span><b class="sp2-c13-best">🏅 —</b>
          <div class="sp2-c13-ath">${athlete()}</div><i class="sp2-c13-proj"></i></div>
        <div class="sp2-c13-meter"><small>💪</small><i><b></b></i></div>
        <div class="sp2-c13-opts"></div>`;
      const extra = countryWords(app, wid).map((p) => [p[0], p[1]]);
      G = {
        pairs: [...GR.map((p) => [tr([p[0], p[1]]), p[2]]), ...extra], recent: [], round: 0, ev: EVENTS[0], t: null, busy: true,
        m: 0, mt: 0, fly: null, best: 0,
        card: K.$('.sp2-c13-card'), stage: K.$('.sp2-c13-stage'), opts: K.$('.sp2-c13-opts'), needle: K.$('.sp2-c13-meter b'),
        ath: K.$('.sp2-c13-ath'), proj: K.$('.sp2-c13-proj'), evChip: K.$('.sp2-c13-ev'), bestEl: K.$('.sp2-c13-best'),
      };
      G.card.innerHTML = `<small>🏛️</small><b>${esc(tr({ uk: 'Атлети, на старт…', ru: 'Атлеты, на старт…' }))}</b>`;
      G.opts.addEventListener('pointerdown', (e) => { const b = e.target.closest('.sp2-c13-opt'); if (b) { e.preventDefault(); answer(K, b); } });
    },
    start(K) { newRound(K); },
    frame(K, now, dt) {
      // шкала сили: «пилка» з плавними краями; з часом трохи швидша (спокійний режим — і так ×0.6)
      if (!G.busy) G.mt += dt * Math.min(1.9, 1.1 + now * 0.01);
      G.m = (1 - Math.cos(G.mt * Math.PI)) / 2;
      G.needle.style.transform = `scaleX(${G.m.toFixed(3)})`;
      G.needle.classList.toggle('hot', G.m > 0.85);
      const f = G.fly;
      if (f) {
        f.t += dt;
        const p = Math.min(1, f.t / f.dur);
        const x = f.x0 + (f.x1 - f.x0) * p, y = f.y0 + (f.y1 - f.y0) * p - f.h * 4 * p * (1 - p);
        const rot = G.ev.ico === '🎯' ? (-35 + 70 * p) : p * 900;
        G.proj.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rot.toFixed(0)}deg)`;
        if (p >= 1) land(K);
      }
    },
  });
  return cleanup;
}
