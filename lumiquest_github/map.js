// 🗺 Карта світів: вертикальна мальовнича карта, світ 1 внизу → світ 5 у небі.
import { h, fx, toast } from './ui.js?v=20261110022322';
import { currentWorldId } from './state.js?v=20261110022322';
import { worldGames, gameStars } from './games.js?v=20261110022322';

const INK = '#3B2A55';

// Острови в стилі assets/map.png: пласкі пастельні форми з товстою сливовою обвідкою.
const disc = (top, side) => `
  <ellipse cx="100" cy="118" rx="84" ry="24" fill="${side}" stroke="${INK}" stroke-width="3.5"/>
  <rect x="16" y="104" width="168" height="14" fill="${side}"/>
  <path d="M16 104 V118 M184 104 V118" stroke="${INK}" stroke-width="3.5"/>
  <ellipse cx="100" cy="104" rx="84" ry="22" fill="${top}" stroke="${INK}" stroke-width="3.5"/>
  <ellipse cx="78" cy="98" rx="30" ry="6" fill="#fff" opacity=".28"/>`;

const ISLES = [
  // 1 Ранкова Галявина — галявина з паростком і квітами
  () => `${disc('#9EDC7E', '#6CB65A')}
    <g class="sway"><path d="M100 100 C100 84 100 74 100 62" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M100 70 C88 56 70 58 64 66 C74 76 90 76 100 70Z" fill="#7ACB62" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M100 66 C112 50 132 52 138 60 C128 72 110 72 100 66Z" fill="#8BD86F" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>
    <g stroke="${INK}" stroke-width="2.5" class="bob"><circle cx="52" cy="106" r="7" fill="#FF9EB5"/><circle cx="52" cy="106" r="2.6" fill="#FFD25A"/>
    <circle cx="140" cy="110" r="7" fill="#FFD25A"/><circle cx="140" cy="110" r="2.6" fill="#FF9F6B"/>
    <circle cx="76" cy="114" r="6" fill="#fff"/><circle cx="76" cy="114" r="2.2" fill="#FFD25A"/></g>`,
  // 2 Шепітний Ліс — ялинки і світлячки
  () => `${disc('#4F9A62', '#3C7C4E')}
    <g stroke="${INK}" stroke-width="3" stroke-linejoin="round">
      <g class="sway"><rect x="54" y="88" width="8" height="14" fill="#9B6B4A"/><path d="M58 30 L80 66 H70 L86 92 H30 L46 66 H36Z" fill="#5DAF73"/></g>
      <g class="sway d2"><rect x="138" y="88" width="8" height="14" fill="#9B6B4A"/><path d="M142 36 L162 68 H153 L168 92 H116 L131 68 H122Z" fill="#57A56C"/></g>
      <g class="sway"><rect x="96" y="92" width="9" height="14" fill="#9B6B4A"/><path d="M100 12 L126 54 H114 L132 96 H68 L86 54 H74Z" fill="#6CBF80"/></g>
    </g>
    <g fill="#FFE07A" class="glow"><circle cx="34" cy="40" r="4"/><circle cx="170" cy="26" r="4"/><circle cx="128" cy="20" r="3"/></g>`,
  // 3 Місто Годинників — будиночки і годинникова вежа
  () => `${disc('#F2CC94', '#D9A86E')}
    <g stroke="${INK}" stroke-width="3" stroke-linejoin="round">
      <rect x="36" y="66" width="40" height="36" fill="#FFE6C2"/><path d="M30 68 L56 44 L82 68Z" fill="#F07B6E"/>
      <rect x="48" y="76" width="10" height="10" fill="#FFD25A"/>
      <rect x="124" y="64" width="42" height="38" fill="#FFE6C2"/><path d="M118 66 L145 42 L172 66Z" fill="#7C8CE8"/>
      <rect x="146" y="74" width="10" height="10" fill="#FFD25A"/>
      <rect x="82" y="34" width="38" height="70" fill="#FFF3E2"/><path d="M76 36 L101 6 L126 36Z" fill="#9C7CE0"/>
      <circle cx="101" cy="56" r="13" fill="#fff"/><path d="M101 56 L108 60" fill="none" stroke-linecap="round"/><path class="spin" d="M101 56 V47" fill="none" stroke-linecap="round"/>
      <path d="M94 104 V88 a7 7 0 0 1 14 0 V104Z" fill="#A9774F"/>
    </g>`,
  // 4 Кришталеві Гори — гори зі снігом і кристали
  () => `${disc('#A4A8EA', '#8287D2')}
    <g stroke="${INK}" stroke-width="3" stroke-linejoin="round">
      <path d="M22 100 L64 26 L104 100Z" fill="#8F93D8"/><path d="M50 50 L64 26 L78 50 L70 46 L64 54 L57 46Z" fill="#fff"/>
      <path d="M96 100 L140 34 L182 100Z" fill="#8187D0"/><path d="M127 54 L140 34 L153 54 L146 50 L140 58 L133 50Z" fill="#fff"/>
      <g class="shimmer"><path d="M84 100 L80 64 L92 50 L102 64 L98 100Z" fill="#B9E6FF"/>
      <path d="M100 100 L98 58 L110 40 L122 58 L116 100Z" fill="#9FDDFB"/>
      <path d="M114 100 L116 72 L128 62 L136 74 L130 100Z" fill="#D4B8FF"/></g>
    </g>
    <path d="M104 60 L108 54" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  // 5 Небесна Бібліотека — хмара з розкритою книгою
  () => `
    <path d="M30 116 C10 116 10 90 32 90 C30 70 56 64 66 78 C72 58 104 54 112 76 C122 62 150 66 150 86 C174 82 186 108 168 116Z"
      fill="#F4F0FF" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M40 112 H160" stroke="#D8CFF5" stroke-width="5" stroke-linecap="round"/>
    <g class="bob"><g stroke="${INK}" stroke-width="3" stroke-linejoin="round">
      <path d="M58 86 L100 92 L142 86 L142 92 L100 98 L58 92Z" fill="#8E6CE0"/>
      <path d="M62 40 Q82 34 100 44 V90 Q82 80 62 86Z" fill="#FFF8EC"/>
      <path d="M138 40 Q118 34 100 44 V90 Q118 80 138 86Z" fill="#FFF8EC"/>
    </g>
    <g stroke="#B8A5EA" stroke-width="2.5" stroke-linecap="round"><path d="M70 52 L92 56 M70 62 L92 66 M70 72 L88 75 M108 56 L130 52 M108 66 L130 62 M108 75 L126 72"/></g></g>
    <g fill="#FFD25A" stroke="${INK}" stroke-width="2" class="glow">
      <path d="M100 6 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/><path d="M74 16 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/><path d="M128 18 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/>
    </g>`,
];

const LAYOUT = [0.3, 0.7, 0.32, 0.68, 0.5]; // x-позиція (частка ширини) для світів 1..5
const GAP = 238;
const TOP = 150;
const BOTTOM = 190;

export function render(root, params, app) {
  const st = app.state;
  const worlds = app.content.WORLDS;
  const cur = currentWorldId(st);
  const n = worlds.length;
  const height = TOP + (n - 1) * GAP + BOTTOM;

  const map = h('div', { class: 'map', style: { height: height + 'px' } });
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  path.setAttribute('class', 'map-path');
  path.setAttribute('aria-hidden', 'true');
  map.append(
    h('div', { class: 'map-deco', 'aria-hidden': 'true' },
      h('i', { class: 'm-cloud mc1' }), h('i', { class: 'm-cloud mc2' }), h('i', { class: 'm-cloud mc3' }), h('i', { class: 'm-cloud mc4' }),
      Array.from({ length: 14 }, (_, i) => h('i', { class: 'm-star', style: { left: `${(i * 37) % 96 + 2}%`, top: `${(i * 53) % 420 + 20}px`, animationDelay: `${(i % 5) * 0.6}s` } }))),
    path,
    h('h1', { class: 'map-title title-sticker', text: 'Карта світів' }));

  const pos = (i) => ({ x: LAYOUT[i % LAYOUT.length], y: TOP + (n - 1 - i) * GAP });
  let lumiBox = null;

  worlds.forEach((w, i) => {
    const open = st.unlocked.includes(w.id);
    const games = worldGames(w.id);
    const got = games.reduce((a, g) => a + gameStars(st, g.id), 0);
    const total = games.length * 3;
    const badge = st.badges.includes(w.id);
    const byTest = st.by_test.includes(w.id);
    const p = pos(i);
    const art = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    art.setAttribute('viewBox', '0 0 200 150');
    art.setAttribute('class', 'isle-art');
    art.innerHTML = (ISLES[i] || ISLES[0])();
    const status = !open ? h('span', { class: 'isle-meta', text: '🔒 Закрито' })
      : h('span', { class: 'isle-meta isle-prog' },
        h('span', { text: `⭐ ${got}/${total}${badge ? ' 🏅' : byTest ? ' 📘' : ''}` }),
        h('span', { class: 'isle-bar', 'aria-hidden': 'true' }, h('i', { style: { transform: `scaleX(${total ? got / total : 0})` } })));
    const isle = h('button', {
      class: `isle${open ? '' : ' locked'}${w.id === cur ? ' current' : ''}`,
      type: 'button',
      style: { left: `${p.x * 100}%`, top: `${p.y}px`, '--d': `${i * -0.9}s`, '--n': n - 1 - i },
      'aria-label': `${w.name}, ${w.level}${open ? '' : ', закрито'}`,
      on: {
        click: () => {
          if (!open) {
            app.tg.notify('warning');
            fx.shake(isle);
            toast('Цей світ ще спить 🔒 Переможи боса попереднього світу!');
            return;
          }
          app.tg.tap('medium');
          app.go('world', { wid: w.id });
        },
      },
    },
    h('span', { class: 'isle-float' },
      art,
      !open ? h('span', { class: 'isle-fog', 'aria-hidden': 'true' }, h('b', { text: '🔒' })) : null,
      w.id === cur ? (lumiBox = h('span', { class: 'isle-lumi' })) : null),
    h('span', { class: 'isle-label' },
      h('span', { class: 'isle-num', text: String(i + 1) }),
      h('span', { class: 'isle-name' }, h('b', { text: w.name }), status)));
    map.append(isle);
  });

  const wrap = h('div', { class: 'map-wrap' }, map,
    h('p', { class: 'map-legend', text: '🏅 бос переможений · 📘 зараховано за тестом' }));
  root.append(wrap);

  // стежка між островами — у пікселях, щоб пунктир не розтягувався
  const drawPath = () => {
    const W = map.clientWidth;
    path.setAttribute('viewBox', `0 0 ${W} ${height}`);
    path.setAttribute('width', W);
    path.setAttribute('height', height);
    const pts = worlds.map((_, i) => { const p = pos(i); return [p.x * W, p.y + 70]; });
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i];
      const my = (y0 + y1) / 2;
      d += ` C${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`;
    }
    // відкрита частина стежки — золота, закрита — бліда
    const openIdx = Math.max(0, worlds.findIndex((w) => w.id === cur));
    let dOpen = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i <= openIdx; i++) {
      const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i];
      const my = (y0 + y1) / 2;
      dOpen += ` C${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`;
    }
    path.innerHTML = `<path d="${d}" class="trail-bg"/><path d="${d}" class="trail-dash"/>` +
      (openIdx > 0 ? `<path d="${dOpen}" class="trail-open"/>` : '');
  };
  drawPath();
  const ro = new ResizeObserver(drawPath);
  ro.observe(map);

  if (lumiBox) {
    const lumi = app.makeLumi(lumiBox, { size: 78, emotion: 'hello', bubble: ((x) => (x > 0.5 ? 'left' : x < 0.5 ? 'right' : 'top'))(LAYOUT[Math.max(0, worlds.findIndex((w) => w.id === cur)) % LAYOUT.length]) });
    const cw = app.world(cur);
    setTimeout(() => lumi.say(cw ? `Ми тут: ${cw.name}!` : 'Летімо!'), 700);
  }

  // прокрутити до поточного світу
  const ci = Math.max(0, worlds.findIndex((w) => w.id === cur));
  requestAnimationFrame(() => {
    const y = pos(ci).y + 80 - root.clientHeight / 2;
    root.scrollTop = Math.max(0, Math.min(y, root.scrollHeight));
  });

  return () => ro.disconnect();
}
