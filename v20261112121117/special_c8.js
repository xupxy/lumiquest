// 🇦🇺 c8 «Серф-хвиля» — тримай баланс дошки: затискай ліву/праву половину екрана, щоб нахилитися.
// Угорі — aussie-сленг із прикладом; ліворуч і праворуч — два значення англійською. Нахилишся до кінця — обереш бік.
// Хвиля росте з кожним правильним, пориви вітру штовхають дошку. Неправильний бік або «заснув» — wipeout!
import { makeGame, tr, esc, shuffle, pick, country } from './_sp2kit.js?v=20261112121114';

export const meta = { topbar: false };

const SLANG = [
  ['arvo', 'afternoon', 'See you this arvo!'], ['brekkie', 'breakfast', 'Brekkie is ready, mate!'],
  ['barbie', 'barbecue', 'Let\'s have a barbie on the beach.'], ['servo', 'petrol station', 'Stop at the servo for snacks.'],
  ['thongs', 'flip-flops', 'Don\'t forget your thongs!'], ['sunnies', 'sunglasses', 'Grab your sunnies, it\'s bright.'],
  ['mate', 'friend', 'G\'day, mate!'], ['no worries', 'it\'s no problem', 'Thanks! — No worries.'],
  ['heaps', 'a lot', 'There are heaps of waves today.'], ['stoked', 'very happy', 'I\'m stoked with my new board!'],
  ['ute', 'pickup truck', 'Put the boards in the ute.'], ['footy', 'football', 'Are you watching the footy?'],
  ['mozzie', 'mosquito', 'A mozzie bit me!'], ['roo', 'kangaroo', 'Look, a roo by the road!'],
  ['crikey', 'wow!', 'Crikey, that wave is huge!'], ['fair dinkum', 'really true', 'Is that fair dinkum?'],
  ['G\'day', 'hello', 'G\'day! How ya going?'], ['ripper', 'excellent', 'What a ripper of a day!'],
  ['the bush', 'the countryside', 'They live out in the bush.'], ['chockers', 'very full', 'The beach is chockers today.'],
  ['togs', 'swimsuit', 'Put your togs on, we\'re swimming.'], ['avo', 'avocado', 'Avo on toast, please.'],
  ['sanga', 'sandwich', 'I made you a sanga.'], ['bikkie', 'biscuit', 'Want a bikkie with your tea?'],
  ['cuppa', 'cup of tea', 'Fancy a cuppa?'], ['ta', 'thanks', 'Ta for the help!'],
  ['how ya going?', 'how are you?', 'G\'day! How ya going?'], ['she\'ll be right', 'it will be OK', 'Don\'t stress — she\'ll be right.'],
  ['brolly', 'umbrella', 'Take a brolly, it might rain.'], ['uni', 'university', 'She studies at uni.'],
  ['rellies', 'relatives', 'The rellies are coming for Christmas.'], ['postie', 'postman', 'The postie brought a parcel.'],
  ['tradie', 'builder or plumber', 'We called a tradie to fix the sink.'], ['flat out', 'very busy', 'I\'m flat out at work.'],
];

export function render(root, params, app) {
  const wid = 'c8';
  let G = null;
  const held = { L: false, R: false };
  const keyDn = (e) => { if (e.key === 'ArrowLeft') held.L = true; else if (e.key === 'ArrowRight') held.R = true; };
  const keyUp = (e) => { if (e.key === 'ArrowLeft') held.L = false; else if (e.key === 'ArrowRight') held.R = false; };

  function next() {
    let s; do { s = pick(G.list); } while (G.list.length > 1 && s === G.cur);
    const wrong = pick(G.list.filter((x) => x[1] !== s[1] && x !== s))[1];
    G.cur = s; G.right = Math.random() < 0.5 ? 0 : 1;
    const opts = G.right ? [wrong, s[1]] : [s[1], wrong];
    G.card.innerHTML = `<b>🏄 “${esc(s[0])}”</b><small>${esc(s[2] || '')}</small><i>${esc(tr({ uk: 'Що це означає? Нахиляйся до відповіді!', ru: 'Что это значит? Наклоняйся к ответу!' }))}</i>`;
    G.card.classList.remove('sp2-in'); void G.card.offsetWidth; G.card.classList.add('sp2-in');
    G.opt.forEach((o, i) => { o.textContent = opts[i]; o.classList.remove('right', 'wrong', 'sp2-in'); void o.offsetWidth; o.classList.add('sp2-in'); });
    G.tilt = 0; G.v = 0; G.left = Math.max(4.5, 8 - G.level * 0.25); G.lock = false;
  }

  function choose(K, side) {
    G.lock = true;
    const el = G.opt[side];
    if (side === G.right) {
      K.hit(el, 10 + G.level, pick(['Ripper! 🤙', 'Stoked! 🏄', 'Bonzer ride!']));
      el.classList.add('right'); K.sfx('correct'); K.hap('success');
      K.learn(G.cur[0], G.cur[1]); K.speak(G.cur[0]);
      G.level++; G.surfer.classList.remove('wipe', 'ride'); void G.surfer.offsetWidth; G.surfer.classList.add('ride');
      K.later(next, 700);
    } else wipe(K, el);
  }
  function wipe(K, el) {
    G.lock = true;
    K.miss(el, G.cur[0], 'Wipeout! 🌊');
    el?.classList.add('wrong'); G.opt[G.right].classList.add('right');
    K.sfx('fall');
    G.surfer.classList.remove('wipe', 'ride'); void G.surfer.offsetWidth; G.surfer.classList.add('wipe');
    G.level = Math.max(0, G.level - 2);
    K.later(next, 1300);
  }

  const cleanup = makeGame(root, params, app, {
    wid, cls: 'sp2-c8', ico: '🏄', secs: 80, minOk: 8,
    title: { uk: 'Серф-хвиля', ru: 'Серф-волна' },
    rules: [
      { uk: '🏄 Угорі — австралійський сленг (aussie slang) і приклад. Ліворуч і праворуч — два значення англійською.', ru: '🏄 Вверху — австралийский сленг (aussie slang) и пример. Слева и справа — два значения по-английски.' },
      { uk: '👈👉 Затискай ліву чи праву половину екрана — серфер нахиляється. Нахилися до кінця в бік правильного значення!', ru: '👈👉 Зажимай левую или правую половину экрана — сёрфер наклоняется. Наклонись до конца в сторону правильного значения!' },
      { uk: '💨 Вітер хитає дошку, а хвиля росте. Тримай баланс і не барися — інакше wipeout!', ru: '💨 Ветер качает доску, а волна растёт. Держи баланс и не медли — иначе wipeout!' },
    ],
    build(K) {
      K.field.innerHTML = `<div class="sp2-c8-card"></div><div class="sp2-c8-sea"><i class="sp2-c8-sun"></i><div class="sp2-c8-wave"></div>
        <div class="sp2-c8-opt l"></div><div class="sp2-c8-opt r"></div><div class="sp2-c8-meter"><b></b></div><div class="sp2-c8-time"><b></b></div>
        <div class="sp2-c8-surfer"><div class="sp2-c8-rider"><span>🏄</span><i class="sp2-c8-board"></i></div></div>
        <div class="sp2-c8-touch l">◀</div><div class="sp2-c8-touch r">▶</div></div>`;
      const extra = (country(app, wid)?.slang || []).filter((x) => x && x.w && x.en).map((x) => [x.w, x.en, x.ex || '']);
      const seen = new Set(); const list = [];
      for (const s of [...SLANG, ...extra]) { const k = s[0].toLowerCase(); if (!seen.has(k)) { seen.add(k); list.push(s); } }
      G = {
        K, list, level: 0, tilt: 0, v: 0, gust: 0, gustT: 0, lock: true, left: 8,
        card: K.$('.sp2-c8-card'), sea: K.$('.sp2-c8-sea'), wave: K.$('.sp2-c8-wave'), surfer: K.$('.sp2-c8-surfer'), rider: K.$('.sp2-c8-rider'),
        opt: [K.$('.sp2-c8-opt.l'), K.$('.sp2-c8-opt.r')], meter: K.$('.sp2-c8-meter b'), tbar: K.$('.sp2-c8-time b'), touch: [K.$('.sp2-c8-touch.l'), K.$('.sp2-c8-touch.r')],
      };
      const ptr = new Map();
      const upd = () => { held.L = [...ptr.values()].includes('L'); held.R = [...ptr.values()].includes('R'); };
      G.sea.addEventListener('pointerdown', (e) => { const r = G.sea.getBoundingClientRect(); ptr.set(e.pointerId, e.clientX - r.left < r.width / 2 ? 'L' : 'R'); upd(); try { G.sea.setPointerCapture(e.pointerId); } catch (x) { /* */ } });
      const off = (e) => { ptr.delete(e.pointerId); upd(); };
      G.sea.addEventListener('pointerup', off); G.sea.addEventListener('pointercancel', off);
      window.addEventListener('keydown', keyDn); window.addEventListener('keyup', keyUp);
      next(); G.lock = true;
    },
    start() { G.lock = false; },
    frame(K, now, dt) {
      const W = G.sea.clientWidth;
      const inp = (held.R ? 1 : 0) - (held.L ? 1 : 0);
      G.touch[0].classList.toggle('on', held.L); G.touch[1].classList.toggle('on', held.R);
      G.gustT -= dt;
      if (G.gustT <= 0) { G.gustT = 0.6 + Math.random() * 0.8; G.gust = (Math.random() * 2 - 1) * (0.9 + G.level * 0.12); }
      if (!G.lock) {
        G.v += (inp * 3.4 + G.gust - G.tilt * 0.6) * dt;
        G.v *= Math.pow(0.35, dt);
        G.tilt += G.v * dt;
        G.left -= dt;
        if (G.tilt <= -1) choose(K, 0); else if (G.tilt >= 1) choose(K, 1);
        else if (G.left <= 0) { K.toast('Too slow! ⏳', 'bad'); wipe(K, null); }
      } else G.tilt *= Math.pow(0.05, dt);
      const t = Math.max(-1, Math.min(1, G.tilt));
      const bob = Math.sin(now * 3.1) * 6;
      G.surfer.style.transform = `translate3d(${(t * W * 0.28).toFixed(1)}px,${bob.toFixed(1)}px,0)`;
      G.rider.style.transform = `rotate(${(t * 32).toFixed(1)}deg)`;
      G.meter.style.transform = `translateX(${(t * 50).toFixed(1)}%)`;
      G.tbar.style.transform = `scaleX(${G.lock ? 1 : Math.max(0, G.left / Math.max(4.5, 8 - G.level * 0.25))})`;
      G.opt[0].style.opacity = String(0.55 + Math.max(0, -t) * 0.45);
      G.opt[1].style.opacity = String(0.55 + Math.max(0, t) * 0.45);
      const h = 0.55 + Math.min(0.6, G.level * 0.06);
      G.wave.style.transform = `translate3d(${(Math.sin(now * 0.8) * 14).toFixed(1)}px,0,0) scaleY(${(h + Math.sin(now * 2) * 0.04).toFixed(3)})`;
    },
    cleanup() { window.removeEventListener('keydown', keyDn); window.removeEventListener('keyup', keyUp); },
  });
  return cleanup;
}
