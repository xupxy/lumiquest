// 🇧🇷 c9 «Футбол-фрістайл» — чеканка: м'яч злітає з англійським словом. Угорі — слово рідною мовою.
// Коли м'яч падає в зону удару (низ поля): тапай, якщо на ньому ПРАВИЛЬНИЙ переклад; якщо ні — дай йому впасти.
// Кожні 5 у комбо — карнавальна хода 🥁💃🦜 проходить полем.
import { makeGame, tr, esc, shuffle, pick, countryWords } from './_sp2kit.js?v=20261112121516';

export const meta = { topbar: false };

const BR = [['карнавал', 'карнавал', 'carnival'], ['барабан', 'барабан', 'drum'], ['костюм', 'костюм', 'costume'], ['маска', 'маска', 'mask'],
  ['пір\'я', 'перья', 'feathers'], ['хода, парад', 'шествие, парад', 'parade'], ['танець', 'танец', 'dance'], ['пляж', 'пляж', 'beach'],
  ['тропічний ліс', 'тропический лес', 'rainforest'], ['річка', 'река', 'river'], ['папуга', 'попугай', 'parrot'], ['тукан', 'тукан', 'toucan'],
  ['ягуар', 'ягуар', 'jaguar'], ['мавпа', 'обезьяна', 'monkey'], ['кава', 'кофе', 'coffee'], ['гол; ворота', 'гол; ворота', 'goal'],
  ['стадіон', 'стадион', 'stadium'], ['вболівальники', 'болельщики', 'fans'], ['команда', 'команда', 'team'], ['свисток', 'свисток', 'whistle'],
  ['суддя', 'судья', 'referee'], ['гітара', 'гитара', 'guitar'], ['свято', 'праздник', 'festival'], ['чемпіон', 'чемпион', 'champion'],
  ['водоспад', 'водопад', 'waterfall'], ['метелик', 'бабочка', 'butterfly'], ['ананас', 'ананас', 'pineapple'], ['святкувати', 'праздновать', 'celebrate']];
const PARADE = ['🥁', '💃', '🎭', '🦜', '🎺', '🕺', '🪇', '🎉'];

export function render(root, params, app) {
  const wid = 'c9';
  let G = null;

  function newTarget() {
    let p; do { p = pick(G.pairs); } while (G.pairs.length > 1 && p === G.target);
    G.target = p; G.streak = 0;
    G.card.innerHTML = `<small>${esc(tr({ uk: 'Чекань лише слово:', ru: 'Чекань только слово:' }))}</small><b>«${esc(p[0])}»</b>`;
    G.card.classList.remove('sp2-in'); void G.card.offsetWidth; G.card.classList.add('sp2-in');
  }
  function launch(fromSide) {
    const right = Math.random() < 0.45 || G.sinceRight >= 2;
    const w = right ? G.target[1] : pick(G.pairs.filter((p) => p[1] !== G.target[1]))[1];
    G.sinceRight = right ? 0 : G.sinceRight + 1;
    G.ball = { w, t: 0, T: Math.max(1.15, 1.75 - G.kicks * 0.012), x0: fromSide ? -60 : G.bx, x1: G.W / 2 + (Math.random() * 2 - 1) * G.W * 0.18, spin: 0, done: false };
    G.label.textContent = w;
    G.ballEl.classList.remove('kick'); void G.ballEl.offsetWidth; G.ballEl.classList.add('kick');
  }
  function inZone() { return G.ball && !G.ball.done && G.ball.t > 0.5 && G.by > G.H * 0.52; }

  function tap(K) {
    if (!K.running || !G.ball || G.ball.done) return;
    if (!inZone()) { K.floatAt(G.bx, G.by - 50, tr({ uk: 'Зарано!', ru: 'Рано!' }), 'bad', G.pitch); return; }
    const b = G.ball; b.done = true;
    G.kicker.classList.remove('kick'); void G.kicker.offsetWidth; G.kicker.classList.add('kick');
    if (b.w === G.target[1]) {
      G.kicks++; G.streak++;
      K.hit(G.ballEl, 10, pick(['Golaço! ⚽', 'Show de bola!', 'Nice touch!']));
      K.sfx('jump'); K.hap('medium');
      K.learn(G.target[1], G.target[0]); K.speak(G.target[1]);
      if (K.combo > 0 && K.combo % 5 === 0) parade();
      if (G.streak >= 3) newTarget();
    } else {
      K.miss(G.ballEl, G.target[1], `✗ ${b.w}`); K.sfx('wrong');
    }
    launch(false);
  }
  function landed(K) {
    const b = G.ball; b.done = true;
    K.sfx('land');
    if (b.w === G.target[1]) { K.miss(G.ballEl, G.target[1], tr({ uk: 'Упустив!', ru: 'Упустил!' })); }
    else { K.hit(null, 5); K.floatAt(G.bx, G.H - 120, '👀 Good eye!', 'ok', G.pitch); }
    G.ballEl.classList.remove('bounce'); void G.ballEl.offsetWidth; G.ballEl.classList.add('bounce');
    G.ball = null;
    K.later(() => launch(true), 350);
  }
  function parade() {
    const p = document.createElement('div'); p.className = 'sp2-c9-parade';
    p.innerHTML = shuffle(PARADE).concat(shuffle(PARADE)).slice(0, G.K.lite() ? 5 : 10).map((e, i) => `<span style="animation-delay:${(i * 0.09).toFixed(2)}s">${e}</span>`).join('');
    G.pitch.appendChild(p); G.K.later(() => p.remove(), 3200);
    G.K.toast('🎉 Carnaval!', 'combo');
  }

  const cleanup = makeGame(root, params, app, {
    wid, cls: 'sp2-c9', ico: '⚽', secs: 75, minOk: 14,
    title: { uk: 'Футбол-фрістайл', ru: 'Футбол-фристайл' },
    rules: [
      { uk: '⚽ Угорі — слово українською. На м\'ячі щоразу нове англійське слово.', ru: '⚽ Вверху — слово по-русски. На мяче каждый раз новое английское слово.' },
      { uk: '👆 Коли м\'яч у зеленій зоні — тапни, якщо на ньому правильний переклад. Неправильне — НЕ чіпай, хай падає.', ru: '👆 Когда мяч в зелёной зоне — тапни, если на нём правильный перевод. Неправильное — НЕ трогай, пусть падает.' },
      { uk: '🥁 Комбо ×5 — карнавальна хода! Темп росте, будь уважним.', ru: '🥁 Комбо ×5 — карнавальное шествие! Темп растёт, будь внимателен.' },
    ],
    build(K) {
      K.field.innerHTML = `<div class="sp2-c9-card"></div><div class="sp2-c9-pitch"><i class="sp2-c9-sun"></i><i class="sp2-c9-hill"></i><div class="sp2-c9-zone"></div>
        <div class="sp2-c9-kicker">🏃</div><div class="sp2-c9-ball"><span>⚽</span><em></em></div></div>`;
      const extra = countryWords(app, wid).map((p) => [p[0], p[1]]);
      G = {
        K, pairs: [...BR.map((p) => [tr([p[0], p[1]]), p[2]]), ...extra], kicks: 0, streak: 0, sinceRight: 0, ball: null, bx: 0, by: 0, W: 300, H: 400,
        card: K.$('.sp2-c9-card'), pitch: K.$('.sp2-c9-pitch'), ballEl: K.$('.sp2-c9-ball'), label: K.$('.sp2-c9-ball em'), kicker: K.$('.sp2-c9-kicker'),
      };
      G.pitch.addEventListener('pointerdown', () => tap(K));
      newTarget();
    },
    start(K) { G.W = G.pitch.clientWidth; G.H = G.pitch.clientHeight; G.bx = G.W / 2; launch(true); },
    frame(K, now, dt) {
      G.W = G.pitch.clientWidth; G.H = G.pitch.clientHeight;
      G.ballEl.parentNode && G.pitch.classList.toggle('hot', inZone());
      if (!G.ball) return;
      const b = G.ball;
      b.t += dt / b.T;
      const k = Math.min(1, b.t);
      const foot = G.H - 92, top = G.H * 0.12;
      G.bx = b.x0 + (b.x1 - b.x0) * Math.min(1, k * 2);
      G.by = foot - (foot - top) * 4 * k * (1 - k) + (k > 0.5 ? (k - 0.5) * 2 * 70 : 0); // падає трохи нижче ноги
      b.spin += dt * 400;
      G.ballEl.style.transform = `translate3d(${(G.bx - 40).toFixed(1)}px,${(G.by - 40).toFixed(1)}px,0)`;
      G.ballEl.firstElementChild.style.transform = `rotate(${b.spin.toFixed(0)}deg)`;
      if (k >= 1 && !b.done) landed(K);
    },
  });
  return cleanup;
}
