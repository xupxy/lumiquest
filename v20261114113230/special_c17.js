// 🇮🇳 c17 «Холі-фарби» — фестиваль кольорів: подвір'ям палацу в три ряди йдуть люди з табличками-словами англійською.
// Угорі — підказка рідною мовою (колір-плямка або емоція-емодзі). Тапни людину з ПРАВИЛЬНИМ англійським словом —
// кидаєш у неї хмару кольорового порошку (gulal), вона стає різнобарвною. Хибне слово — промах + підказка з перекладом.
// 5 влучних поспіль — «Holi Hai!» бонус. Музика — оригінальний WebAudio-синт (112 BPM, «табла» + мелодія на ладі бгайрав).
import { makeGame, tr, esc, shuffle, pick, midi } from './_sp2kit.js?v=20261114113225';

export const meta = { topbar: false };

// [знак, english, uk, ru, колір порошку|null]; кольори показуємо плямкою, емоції — емодзі
const COLORS = [['🔴', 'red', 'червоний', 'красный', '#e8331e'], ['🔵', 'blue', 'синій', 'синий', '#2e6ae0'], ['🟢', 'green', 'зелений', 'зелёный', '#2ea05a'],
  ['🟡', 'yellow', 'жовтий', 'жёлтый', '#ffc21a'], ['🩷', 'pink', 'рожевий', 'розовый', '#ff5aa8'], ['🟣', 'purple', 'фіолетовий', 'фиолетовый', '#9a3ad8'],
  ['🟠', 'orange', 'помаранчевий', 'оранжевый', '#ff8a1a'], ['⚪', 'white', 'білий', 'белый', '#ffffff'], ['🟤', 'brown', 'коричневий', 'коричневый', '#8a5a30'],
  ['⚫', 'black', 'чорний', 'чёрный', '#2a2a3a'], ['🩵', 'light blue', 'блакитний', 'голубой', '#5ec4f0'], ['🩶', 'grey', 'сірий', 'серый', '#9a9aa8']];
const MOODS = [['😊', 'happy', 'щасливий', 'счастливый'], ['😢', 'sad', 'сумний', 'грустный'], ['😠', 'angry', 'сердитий', 'сердитый'],
  ['😨', 'scared', 'наляканий', 'испуганный'], ['😲', 'surprised', 'здивований', 'удивлённый'], ['😴', 'sleepy', 'сонний', 'сонный'],
  ['🤩', 'excited', 'у захваті', 'в восторге'], ['😌', 'calm', 'спокійний', 'спокойный'], ['😳', 'shy', "сором'язливий", 'стеснительный'],
  ['😂', 'funny', 'смішний', 'смешной'], ['🥰', 'kind', 'добрий', 'добрый'], ['😎', 'cool', 'крутий', 'крутой'], ['😋', 'hungry', 'голодний', 'голодный'],
  ['🥱', 'tired', 'втомлений', 'уставший'], ['💪', 'brave', 'хоробрий', 'смелый'], ['🤗', 'friendly', 'привітний', 'дружелюбный']];
const HOLI = ['#ff3d8a', '#ffc21a', '#2ea0ff', '#2ec46a', '#b23ae0', '#ff7a1a'];
const PEOPLE = ['🧑🏽', '👩🏽', '👨🏽', '👧🏽', '👦🏽', '👵🏽', '👴🏽', '🧔🏽', '👩🏾', '👨🏾'];

const BPM = 112;
const RAGA = [60, 61, 64, 65, 67, 68, 71, 72, 73, 76]; // бгайрав (оригінальна мелодія)
const MEL = [0, 2, 3, 4, 3, 2, 1, 0, null, 4, 5, 7, 5, 4, 3, null, 4, 6, 7, 9, 7, 6, 5, 4, 3, 4, 3, 2, 1, 0, null, null];
const TABLA = [1, 0, 2, 0, 1, 1, 2, 0, 1, 0, 2, 2, 1, 0, 2, 0]; // 1 — «дга» (низ), 2 — «на» (верх)

export function render(root, params, app) {
  const wid = 'c17';
  let G = null;
  const nat = (w) => tr([w[2], w[3]]);
  const isColor = (w) => !!w[4];

  function newTarget(K) {
    const pool = (G.n % 2 ? MOODS : COLORS).filter((w) => w !== G.cur && !(G.recent || []).includes(w[1]));
    G.cur = pick(pool); G.n++; G.since = 0; G.hint = false;
    G.recent = [...(G.recent || []), G.cur[1]].slice(-5);
    drawCard(K);
  }
  function drawCard(K) {
    const w = G.cur;
    const sign = isColor(w) ? `<i class="sp2-c17-dot" style="--pc:${w[4]}"></i>` : `<span class="sp2-c17-emo">${w[0]}</span>`;
    G.card.innerHTML = `<small>🎨 ${esc(tr(isColor(w) ? { uk: 'Знайди колір:', ru: 'Найди цвет:' } : { uk: 'Знайди настрій:', ru: 'Найди настроение:' }))}</small>
      <div class="sp2-c17-ask">${sign}<b>${esc(nat(w))}</b></div>
      <em class="sp2-c17-hint">${G.hint ? `💡 ${esc(nat(w))} = <b>${esc(w[1])}</b>` : '&nbsp;'}</em>
      <button class="sp2-c17-say" data-say="1" aria-label="say">🔊</button>`;
    G.card.classList.remove('sp2-in'); void G.card.offsetWidth; G.card.classList.add('sp2-in');
  }

  function spawn(K) {
    const free = [0, 1, 2].filter((l) => !G.ppl.some((p) => !p.gone && p.lane === l && (p.dir > 0 ? p.x < 110 : p.x > G.W - 190)));
    if (!free.length) return;
    const cur = G.cur;
    const onScreen = G.ppl.some((p) => !p.gone && !p.done && p.w === cur);
    const want = cur && !onScreen && (G.since >= 2 || Math.random() < 0.4);
    let w;
    if (want) { w = cur; G.since = 0; } else {
      const same = isColor(cur) ? COLORS : MOODS;
      const pool = (Math.random() < 0.75 ? same : COLORS.concat(MOODS)).filter((x) => x !== cur && !G.ppl.some((p) => !p.gone && p.w === x));
      w = pick(pool); G.since++;
    }
    const lane = pick(free), dir = lane === 1 ? -1 : 1;
    const el = document.createElement('button');
    el.className = 'sp2-c17-guy';
    el.innerHTML = `<span class="sp2-c17-face">${pick(PEOPLE)}</span><span class="sp2-c17-sign">${esc(w[1])}</span><i class="sp2-c17-splash"></i>`;
    G.yard.appendChild(el);
    const p = { el, w, lane, dir, x: dir > 0 ? -100 : G.W + 10, y: G.laneY[lane], ph: Math.random() * 6, gone: false, done: false };
    G.ppl.push(p); place(p, 0);
  }
  function place(p, t) {
    const y = p.y + (p.done ? 0 : Math.abs(Math.sin(t * 5 + p.ph)) * -5);
    p.el.style.transform = `translate3d(${p.x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
  }

  function tap(K, el) {
    const p = G.ppl.find((x) => x.el === el && !x.gone && !x.done);
    if (!p || !K.running) return;
    const cur = G.cur;
    if (p.w === cur) {
      p.done = true;
      const col = cur[4] || pick(HOLI);
      el.style.setProperty('--pc', col); el.style.setProperty('--pc2', pick(HOLI));
      el.classList.add('holi');
      throwPowder(K, p, col);
      K.hit(el, 10, pick(['Holi Hai! 🎉', 'Shabash!', `Yes — ${cur[1]}!`, 'Bahut accha!']));
      K.sfx('coin'); K.hap('medium');
      K.learn(cur[1], nat(cur)); K.speak(cur[1]);
      G.got++; G.cntEl.textContent = String(G.got);
      if (K.combo && K.combo % 5 === 0) { K.score += 20; K.hud(); G.stage.classList.remove('boom'); void G.stage.offsetWidth; G.stage.classList.add('boom'); }
      K.later(() => { if (K.running) newTarget(K); }, 380);
    } else {
      el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope');
      K.miss(el, cur && cur[1], `✗ ${p.w[1]} = ${nat(p.w)}`); K.sfx('wrong');
      G.hint = true; drawCard(K);
    }
  }
  function throwPowder(K, p, col) {
    const r = G.yard.getBoundingClientRect(), er = p.el.getBoundingClientRect();
    const s = document.createElement('i'); s.className = 'sp2-c17-puff'; s.style.setProperty('--pc', col);
    const x0 = r.width / 2 - 20, y0 = r.height - 30;
    s.style.transform = `translate3d(${x0}px,${y0}px,0) scale(.4)`;
    G.yard.appendChild(s);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      s.style.transform = `translate3d(${(er.left - r.left + er.width / 2 - 20).toFixed(0)}px,${(er.top - r.top + 6).toFixed(0)}px,0) scale(1.6)`; s.style.opacity = '0';
    }));
    K.later(() => s.remove(), 560);
  }

  const cleanup = makeGame(root, params, app, {
    wid, cls: 'sp2-c17', ico: '🎨', secs: 80, minOk: 12,
    title: { uk: 'Холі-фарби', ru: 'Холи-краски' },
    rules: [
      { uk: '🎨 Угорі — колір або настрій рідною мовою. Подвір\'ям ідуть люди з англійськими словами.', ru: '🎨 Вверху — цвет или настроение на родном языке. По двору идут люди с английскими словами.' },
      { uk: '👆 Тапни людину з ПРАВИЛЬНИМ словом — кинеш у неї кольоровий порошок! Хибне слово — промах.', ru: '👆 Тапни человека с ПРАВИЛЬНЫМ словом — бросишь в него цветной порошок! Неверное слово — промах.' },
      { uk: '🎉 5 влучних поспіль — «Holi Hai!» +20. 🔊 — послухати слово.', ru: '🎉 5 метких подряд — «Holi Hai!» +20. 🔊 — послушать слово.' },
    ],
    beat: {
      bpm: BPM, steps: 2,
      fn(K, step, t) {
        const sy = K.synth; if (!sy) return;
        const tb = TABLA[step % 16];
        if (tb === 1) { sy.tone(midi(43), t, 0.28, { w: 'sine', v: 0.24 }); sy.tone(midi(50), t, 0.12, { w: 'sine', v: 0.06 }); }
        if (tb === 2) { sy.tone(midi(74), t, 0.06, { w: 'triangle', v: 0.07 }); sy.noise(t, 0.02, { v: 0.05, f: 3000, type: 'bandpass' }); }
        if (step % 16 === 0) sy.tone(midi(48), t, 1.6, { w: 'sawtooth', v: 0.025 }); // «тампура»-гул
        const m = MEL[step % 32];
        if (m != null && (step >> 5) % 2 === 1) { const f = midi(RAGA[m]); sy.tone(f, t, 0.24, { w: 'triangle', v: 0.1 }); sy.tone(f * 2, t, 0.1, { w: 'sine', v: 0.03 }); }
      },
    },
    build(K) {
      K.field.innerHTML = `<div class="sp2-c17-card"></div>
        <div class="sp2-c17-stage"><div class="sp2-c17-top"><i class="sp2-c17-garl"></i><i class="sp2-c17-palace"></i><i class="sp2-c17-cloud a"></i><i class="sp2-c17-cloud b"></i></div>
          <div class="sp2-c17-yard"><div class="sp2-c17-bowls"><span>🥣</span><b>0</b></div></div></div>`;
      G = {
        ppl: [], cur: null, n: 0, since: 0, got: 0, spawnT: 0, W: 300, laneY: [10, 70, 130], hint: false,
        card: K.$('.sp2-c17-card'), stage: K.$('.sp2-c17-stage'), yard: K.$('.sp2-c17-yard'), cntEl: K.$('.sp2-c17-bowls b'),
      };
      G.card.innerHTML = `<small>🎨</small><b>${esc(tr({ uk: 'Фестиваль починається…', ru: 'Фестиваль начинается…' }))}</b>`;
      G.yard.addEventListener('pointerdown', (e) => { const b = e.target.closest('.sp2-c17-guy'); if (b) { e.preventDefault(); tap(K, b); } });
      G.card.addEventListener('click', (e) => { if (e.target.closest('[data-say]') && G.cur) K.speakAlways(G.cur[1]); });
    },
    start(K) {
      G.W = G.yard.clientWidth; const H = G.yard.clientHeight;
      G.laneY = [H * 0.04, H * 0.34, H * 0.62].map((y) => Math.round(y));
      newTarget(K); spawn(K);
    },
    frame(K, now, dt) {
      const speed = Math.min(88, 50 + now * 0.45);
      G.spawnT += dt;
      if (G.spawnT > 1.15) { G.spawnT = 0; spawn(K); }
      for (const p of G.ppl) {
        if (p.gone) continue;
        p.x += p.dir * (p.done ? speed * 1.6 : speed * (p.lane === 1 ? 1.12 : 1)) * dt;
        place(p, now);
        if (p.x < -120 || p.x > G.W + 30) { p.gone = true; p.el.remove(); }
      }
      if (G.ppl.length > 18) G.ppl = G.ppl.filter((p) => !p.gone);
    },
  });
  return cleanup;
}
