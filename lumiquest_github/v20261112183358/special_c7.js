// 🇨🇦 c7 «Хокейний пас» — лід згори: ти з шайбою внизу, угорі 3 партнери зі словами. Завдання англійською
// (антонім / синонім / переклад канадського слова) — тапни партнера з правильним словом, і шайба полетить.
// Посередині катається воротар-Лось: якщо шайба влетить у нього — блок («Sorry, eh!»), комбо згорає.
import { makeGame, tr, esc, shuffle, pick, countryWords } from './_sp2kit.js?v=20261112183346';

export const meta = { topbar: false };

const OPP = [['hot', 'cold'], ['early', 'late'], ['cheap', 'expensive'], ['polite', 'rude'], ['quiet', 'loud'], ['win', 'lose'],
  ['full', 'empty'], ['safe', 'dangerous'], ['remember', 'forget'], ['arrive', 'leave'], ['strong', 'weak'], ['deep', 'shallow'],
  ['smooth', 'rough'], ['frozen', 'melted'], ['wide', 'narrow'], ['brave', 'scared'], ['tidy', 'messy'], ['north', 'south']];
const SYN = [['big', 'huge'], ['happy', 'glad'], ['fast', 'quick'], ['smart', 'clever'], ['scared', 'afraid'], ['tired', 'exhausted'],
  ['start', 'begin'], ['angry', 'mad'], ['small', 'tiny'], ['beautiful', 'gorgeous'], ['rich', 'wealthy'], ['cold', 'chilly'],
  ['friendly', 'kind'], ['shout', 'yell'], ['finish', 'end'], ['strange', 'weird']];
const CAN = [['лось', 'лось', 'moose'], ['бобер', 'бобр', 'beaver'], ['клен', 'клён', 'maple'], ['шайба', 'шайба', 'puck'],
  ['ковзани', 'коньки', 'skates'], ['каное', 'каноэ', 'canoe'], ['ведмідь', 'медведь', 'bear'], ['ковзанка', 'каток', 'rink'],
  ['вибачте', 'извините', 'sorry'], ['двомовний', 'двуязычный', 'bilingual'], ['водоспад', 'водопад', 'waterfall'],
  ['озеро', 'озеро', 'lake'], ['сироп', 'сироп', 'syrup'], ['хуртовина', 'метель', 'blizzard'], ['воротар', 'вратарь', 'goalie'],
  ['в\'язана шапка (канад.)', 'вязаная шапка (канад.)', 'toque'], ['монета в 1 долар (канад.)', 'монета в 1 доллар (канад.)', 'loonie']];

const SORRY = ['Sorry, eh! 🦌', 'Oops, sorry! 🦌', 'So sorry, buddy! 🦌'];

export function render(root, params, app) {
  const wid = 'c7';
  let G = null;

  function question() {
    const kind = pick(['opp', 'opp', 'syn', 'syn', 'can', 'can', ...(G.words.length ? ['w', 'w'] : [])]);
    let q, a, sub, pool, learnNat;
    if (kind === 'opp') { const p = pick(OPP); q = `OPPOSITE of “${p[0]}”`; a = p[1]; sub = { uk: 'протилежне за значенням', ru: 'противоположное по смыслу' }; pool = OPP.map((x) => x[1]); }
    else if (kind === 'syn') { const p = pick(SYN); q = `SAME MEANING as “${p[0]}”`; a = p[1]; sub = { uk: 'синонім — схоже значення', ru: 'синоним — похожее значение' }; pool = SYN.map((x) => x[1]); }
    else if (kind === 'can') { const p = pick(CAN); q = `In English: «${tr([p[0], p[1]])}»`; a = p[2]; sub = { uk: 'слово з Канади', ru: 'слово из Канады' }; pool = CAN.map((x) => x[2]); learnNat = tr([p[0], p[1]]); }
    else { const p = pick(G.words); q = `In English: «${p[0]}»`; a = p[1]; sub = { uk: 'слово країни', ru: 'слово страны' }; pool = G.words.map((x) => x[1]); learnNat = p[0]; }
    if (q === G.lastQ) return question();
    G.lastQ = q;
    const opts = shuffle([a, ...shuffle([...new Set(pool)].filter((w) => w !== a)).slice(0, 2)]);
    G.q = { q, a, opts, learnNat: learnNat || q.replace(/^[A-Z ]+of /, '') };
    G.card.innerHTML = `<b>🏒 Pass to: ${esc(q)}</b><small>${esc(tr(sub))}</small>`;
    G.card.classList.remove('sp2-in'); void G.card.offsetWidth; G.card.classList.add('sp2-in');
    G.mates.forEach((m, i) => {
      m.querySelector('em').textContent = opts[i];
      m.classList.remove('right', 'wrong', 'sp2-in'); void m.offsetWidth; m.classList.add('sp2-in');
    });
    G.busy = false;
  }

  function shoot(K, i) {
    if (!K.running || G.busy) return;
    G.busy = true;
    const m = G.mates[i];
    const fr = G.ice.getBoundingClientRect(), r = m.getBoundingClientRect();
    G.puck = { x0: G.px, y0: G.py, x1: r.left - fr.left + r.width / 2, y1: r.top - fr.top + r.height * 0.7, t: 0, dur: 0.5, i, blocked: false, back: false };
    K.sfx('shoot'); K.hap('medium');
    G.me.classList.remove('swing'); void G.me.offsetWidth; G.me.classList.add('swing');
  }

  function land(K) {
    const p = G.puck, m = G.mates[p.i];
    G.puck = null;
    const word = G.q.opts[p.i];
    if (word === G.q.a) {
      K.hit(m, 10, pick(['Nice pass!', 'Beauty! 🍁', 'Great hands!']));
      m.classList.add('right'); K.sfx('correct'); K.hap('success');
      K.learn(G.q.a, G.q.learnNat);
      K.speak(G.q.a);
      G.speed = Math.min(2.6, G.speed + 0.08);
    } else {
      const ri = G.q.opts.indexOf(G.q.a);
      K.miss(m, G.q.a, '✗'); m.classList.add('wrong'); G.mates[ri].classList.add('right'); K.sfx('wrong');
    }
    G.puckEl.style.opacity = '0';
    K.later(() => { G.puckEl.style.opacity = '1'; question(); }, word === G.q.a ? 650 : 1200);
  }

  const cleanup = makeGame(root, params, app, {
    wid, cls: 'sp2-c7', ico: '🏒', secs: 75, minOk: 10,
    title: { uk: 'Хокейний пас', ru: 'Хоккейный пас' },
    rules: [
      { uk: '🏒 Угорі — завдання англійською: антонім (OPPOSITE), синонім (SAME MEANING) або канадське слово.', ru: '🏒 Вверху — задание по-английски: антоним (OPPOSITE), синоним (SAME MEANING) или канадское слово.' },
      { uk: '👆 Тапни партнера з правильним словом — шайба полетить до нього.', ru: '👆 Тапни партнёра с правильным словом — шайба полетит к нему.' },
      { uk: '🦌 Воротар-Лось катається посередині! Лови момент, коли шлях вільний. Влучиш у лося — він вибачиться, але комбо згорить.', ru: '🦌 Вратарь-Лось катается посередине! Лови момент, когда путь свободен. Попадёшь в лося — он извинится, но комбо сгорит.' },
    ],
    build(K) {
      K.field.innerHTML = `<div class="sp2-c7-card"></div><div class="sp2-c7-ice"><i class="sp2-c7-mark"></i><i class="sp2-c7-circle"></i>
        <div class="sp2-c7-mates">${[0, 1, 2].map((i) => `<button class="sp2-c7-mate" data-m="${i}"><em></em><span class="sp2-c7-jersey">${[9, 19, 87][i]}</span></button>`).join('')}</div>
        <div class="sp2-c7-moose">🦌</div><div class="sp2-c7-me">⛸️<i>🏒</i></div><div class="sp2-c7-puck"></div></div>`;
      G = {
        K, card: K.$('.sp2-c7-card'), ice: K.$('.sp2-c7-ice'), mates: [...K.field.querySelectorAll('.sp2-c7-mate')],
        moose: K.$('.sp2-c7-moose'), me: K.$('.sp2-c7-me'), puckEl: K.$('.sp2-c7-puck'),
        words: countryWords(app, wid).filter((p) => !/\s/.test(p[1])), puck: null, busy: true, speed: 1, mx: 0, phase: 0, lastQ: '',
      };
      G.ice.addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-m]'); if (b) shoot(K, +b.dataset.m); });
      question(); G.busy = true;
    },
    start() { G.busy = false; },
    frame(K, now, dt) {
      const W = G.ice.clientWidth, H = G.ice.clientHeight;
      G.px = W / 2; G.py = H - 70;
      // лось: синус + ривки
      G.phase += dt * G.speed * 1.6;
      const mw = 64, my = H * 0.5;
      G.mx = W / 2 + Math.sin(G.phase) * (W / 2 - mw / 2 - 8) * (0.75 + 0.25 * Math.sin(G.phase * 0.37));
      G.moose.style.transform = `translate3d(${(G.mx - 32).toFixed(1)}px,${(my - 32).toFixed(1)}px,0) scaleX(${Math.cos(G.phase) > 0 ? 1 : -1})`;
      const p = G.puck;
      let x = G.px, y = G.py;
      if (p) {
        p.t += dt / p.dur;
        const k = Math.min(1, p.t);
        if (!p.back) {
          x = p.x0 + (p.x1 - p.x0) * k; y = p.y0 + (p.y1 - p.y0) * k;
          const crossed = (p.prevY ?? p.y0) >= my && y <= my;
          p.prevY = y;
          if (!p.blocked && crossed && Math.abs(x - G.mx) < mw / 2 + 6) { // блок!
            p.blocked = true; p.back = true; p.t = 0; p.dur = 0.35; p.bx = x; p.by = y;
            K.combo = 0; K.hud(); K.sfx('hit'); K.hap('error');
            G.moose.classList.remove('block'); void G.moose.offsetWidth; G.moose.classList.add('block');
            K.floatAt(G.mx, my - 40, pick(SORRY), 'bad', G.ice);
          } else if (k >= 1) land(K);
        } else {
          x = p.bx + (G.px - p.bx) * k; y = p.by + (G.py - p.by) * k;
          if (k >= 1) { G.puck = null; G.busy = false; }
        }
      }
      G.puckEl.style.transform = `translate3d(${(x - 11).toFixed(1)}px,${(y - 6).toFixed(1)}px,0)`;
    },
  });
  return cleanup;
}
