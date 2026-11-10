// theme.js — у кожного світу свій дизайн: палітра, фактури, рамки, кнопки, стиль заголовків, фон із шарами й частинками.
//
//   applyWorldTheme(el, wid, { decor = false, page = false, particles = true }) -> cleanup()
//     • ставить el.dataset.world = 'w1'…'w5' і CSS-змінні (--w-bg1, --w-bg2, --w-accent, --w-accent2, --w-ink,
//       --w-card, --w-glow, --w-font-display, …). style.css перетворює їх на базові токени (--ink, --paper, --gold…),
//       тож картки/кнопки/завдання всередині el автоматично стають «у стилі світу».
//     • decor: true — додає всередину el абсолютний шар фону (небо-шари + SVG-декор + частинки), el отримує position.
//     • page:  true — тема на всю сторінку: body[data-world], фіксований шар фону за #app (плавна зміна між світами),
//       колір шапки Telegram. Повертає cleanup — викликати при виході з екрана.
//   themeOf(wid) -> обʼєкт палітри (для canvas-ігор);  worldKey(wid) -> 'w1'…'w5'
//   worldDecor(wid, {particles}) -> HTMLElement шару фону
//   worldProps(wid) -> масив SVG-рядків (дрібний декор уздовж стежки)
//   medalFrame(wid) -> SVG-рядок рамки вузла стежки;  pedestal(wid) -> SVG-рядок постаменту для Лумі
//   emblem(wid) -> SVG-рядок маленької емблеми світу
import { tg } from './tg.js?v=20261110123941';

const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

export const WORLD_THEMES = {
  // Ранкова Галявина — світанок, м'ята/персик/сонячно-жовтий, округлі листочки, роса
  w1: {
    name: 'dawn', bg1: '#FFC6A5', bg2: '#FFE9B8', bg3: '#A8DD98',
    accent: '#FFC23D', accent2: '#3FB487', accentSoft: '#FFEBB0', soft: '#D8F3E2',
    ink: '#3A3150', ink2: '#6E6487', card: '#FFFCF3', card2: '#FFF1D6',
    glow: 'rgba(255, 210, 100, .75)', on: '#3A3150', on2: '#665B7E', onDark: '#FFF4E6', on2Dark: '#F4D9C8',
    btn1: '#FFE98C', btn2: '#FFB347', road: '#FFF2D2', roadEdge: '#3A3150', roadDone: '#FFD45E',
    r: '26px 10px 26px 10px', rBtn: '20px',
    font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['pollen', 'petal', 'pollen'], header: '#FFC6A5',
  },
  // Шепітний Ліс — смарагд/бірюза, туманні шари, мох, гриби, світлячки
  w2: {
    name: 'forest', bg1: '#0C3530', bg2: '#17574A', bg3: '#2E7A5C',
    accent: '#F4D86B', accent2: '#5FE0B0', accentSoft: '#FFF3C2', soft: '#CFF3E2',
    ink: '#0D2E28', ink2: '#3F6B5E', card: '#F1FAF2', card2: '#DDF1E3',
    glow: 'rgba(120, 255, 200, .55)', on: '#E6FFF3', on2: '#A9D9C4', onDark: '#E6FFF3', on2Dark: '#A9D9C4',
    btn1: '#B4F7D6', btn2: '#38BE8C', road: '#2D5E49', roadEdge: '#0A2620', roadDone: '#6FE0B4',
    r: '28px 14px 28px 14px', rBtn: '22px 12px 22px 12px',
    font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['firefly', 'firefly', 'spore'], header: '#0C3530',
  },
  // Місто Годинників — мідь/латунь/бордо, стимпанк-шестерні, ар-деко рамки
  w3: {
    name: 'clockwork', bg1: '#2A0F17', bg2: '#62252A', bg3: '#C27A3E',
    accent: '#E9B44C', accent2: '#B4553A', accentSoft: '#F8E1B0', soft: '#F3D9C4',
    ink: '#2A1216', ink2: '#73473C', card: '#FBF1DD', card2: '#F1DDBA',
    glow: 'rgba(255, 190, 90, .6)', on: '#FCEBD0', on2: '#E2B98E', onDark: '#FCEBD0', on2Dark: '#E2B98E',
    btn1: '#FBE0A0', btn2: '#C98A3A', road: '#8A4B2C', roadEdge: '#1E0B0F', roadDone: '#E9B44C',
    r: '6px', rBtn: '8px',
    font: "'Didot', 'Bodoni 72', 'Playfair Display', 'Georgia', 'DejaVu Serif', serif",
    particles: ['spark', 'steam', 'cog'], header: '#2A0F17',
  },
  // Кришталеві Гори — крижаний блакитний/бузковий, грані, полярне сяйво, сніг
  w4: {
    name: 'crystal', bg1: '#111A46', bg2: '#2D4392', bg3: '#BCD4FF',
    accent: '#7FE6FF', accent2: '#B79CFF', accentSoft: '#DDF8FF', soft: '#E7E0FF',
    ink: '#1B2152', ink2: '#56609A', card: '#F4F8FF', card2: '#E2ECFF',
    glow: 'rgba(130, 230, 255, .6)', on: '#EEF6FF', on2: '#B9CBF2', onDark: '#EEF6FF', on2Dark: '#B9CBF2',
    btn1: '#E9FCFF', btn2: '#8ED8FF', road: '#DCEFFF', roadEdge: '#1B2152', roadDone: '#8EE9FF',
    r: '4px 22px 4px 22px', rBtn: '6px 18px 6px 18px',
    font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['snow', 'snow', 'glint'], header: '#111A46',
  },
  // Небесна Бібліотека — нічний індиго/золото, сузір'я, книги, що летять, пергамент
  w5: {
    name: 'library', bg1: '#080624', bg2: '#1C1552', bg3: '#43307F',
    accent: '#F5C451', accent2: '#8F9CFF', accentSoft: '#FFEDB8', soft: '#E4E3FF',
    ink: '#16113A', ink2: '#5B4E7E', card: '#FAF1DC', card2: '#F0E2C0',
    glow: 'rgba(255, 210, 110, .55)', on: '#F8ECCF', on2: '#C9BCE8', onDark: '#F8ECCF', on2Dark: '#C9BCE8',
    btn1: '#FFE9A6', btn2: '#E3A637', road: '#F5C451', roadEdge: '#16113A', roadDone: '#FFE08A',
    r: '16px', rBtn: '999px',
    font: "'Palatino Linotype', 'Book Antiqua', 'Palatino', 'Georgia', 'DejaVu Serif', serif",
    particles: ['twinkle', 'twinkle', 'shoot', 'dust'], header: '#080624',
  },
};

const VAR_MAP = {
  bg1: '--w-bg1', bg2: '--w-bg2', bg3: '--w-bg3', accent: '--w-accent', accent2: '--w-accent2', accentSoft: '--w-accent-soft',
  soft: '--w-soft', ink: '--w-ink', ink2: '--w-ink2', card: '--w-card', card2: '--w-card2', glow: '--w-glow',
  on: '--w-on', on2: '--w-on2', onDark: '--w-on-dark', on2Dark: '--w-on2-dark', btn1: '--w-btn1', btn2: '--w-btn2',
  road: '--w-road', roadEdge: '--w-road-edge', roadDone: '--w-road-done', r: '--w-r', rBtn: '--w-r-btn', font: '--w-font-display',
};

/** 'w3' | 3 | '3' -> 'w3' (невідоме -> 'w1') */
export function worldKey(wid) {
  if (typeof wid === 'number') return WORLD_THEMES[`w${wid}`] ? `w${wid}` : 'w1';
  const s = String(wid || '');
  if (WORLD_THEMES[s]) return s;
  const m = /(\d+)/.exec(s);
  return m && WORLD_THEMES[`w${m[1]}`] ? `w${m[1]}` : 'w1';
}
export const themeOf = (wid) => WORLD_THEMES[worldKey(wid)];

function setVars(el, t) {
  for (const k in VAR_MAP) el.style.setProperty(VAR_MAP[k], t[k]);
}
function clearVars(el) {
  for (const k in VAR_MAP) el.style.removeProperty(VAR_MAP[k]);
}

// ─────────────────────────────────────────────────────────── SVG-декор
const svg = (vb, body, cls = '', extra = '') => `<svg class="${cls}" viewBox="${vb}" ${extra} aria-hidden="true" focusable="false">${body}</svg>`;

const GEAR = (r, teeth = 12, hole = 0.38) => {
  // шестерня з центром (0,0)
  const pts = [];
  const n = teeth * 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = (i % 4 === 0 || i % 4 === 1) ? r : r * 0.8;
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}"/><circle r="${(r * hole).toFixed(1)}" class="hole"/>`;
};

const SCENES = {
  w1: () => `
    <div class="wd-sun">${svg('-100 -100 200 200', `
      <g class="wd-rays">${Array.from({ length: 12 }, (_, i) => `<rect x="-7" y="-96" width="14" height="34" rx="7" transform="rotate(${i * 30})"/>`).join('')}</g>
      <circle r="52" fill="url(#w1sun)"/>
      <defs><radialGradient id="w1sun" cx=".4" cy=".38" r=".7"><stop offset="0" stop-color="#FFFBE0"/><stop offset=".55" stop-color="#FFE07A"/><stop offset="1" stop-color="#FFB547"/></radialGradient></defs>`)}</div>
    <div class="wd-cloud wc1">${svg('0 0 160 60', '<path d="M18 56 C2 56 2 36 20 36 C18 18 44 12 54 26 C60 6 96 4 102 26 C112 14 140 20 136 38 C154 38 156 56 140 56Z"/>')}</div>
    <div class="wd-cloud wc2">${svg('0 0 160 60', '<path d="M18 56 C2 56 2 36 20 36 C18 18 44 12 54 26 C60 6 96 4 102 26 C112 14 140 20 136 38 C154 38 156 56 140 56Z"/>')}</div>
    <div class="wd-ground">${svg('0 0 400 170', `
      <path d="M0 70 C70 30 140 40 210 66 C280 92 340 50 400 60 V170 H0Z" fill="#C6EBB0"/>
      <path d="M0 104 C80 70 160 82 230 104 C300 126 350 92 400 98 V170 H0Z" fill="#9FD98A"/>
      <path d="M0 138 C90 116 170 124 250 140 C320 152 360 132 400 134 V170 H0Z" fill="#7CC775"/>
      <g class="wd-flowers"><g fill="#fff"><circle cx="60" cy="92" r="4"/><circle cx="66" cy="96" r="4"/><circle cx="60" cy="100" r="4"/><circle cx="54" cy="96" r="4"/></g><circle cx="60" cy="96" r="3" fill="#FFC23D"/>
      <g fill="#FF9EB5"><circle cx="300" cy="118" r="4"/><circle cx="306" cy="122" r="4"/><circle cx="300" cy="126" r="4"/><circle cx="294" cy="122" r="4"/></g><circle cx="300" cy="122" r="3" fill="#FFE07A"/>
      <g fill="#FFE07A"><circle cx="170" cy="138" r="3.5"/><circle cx="176" cy="142" r="3.5"/><circle cx="170" cy="146" r="3.5"/><circle cx="164" cy="142" r="3.5"/></g></g>
      <g class="wd-dew" fill="#fff"><circle cx="120" cy="96" r="3" opacity=".9"/><circle cx="352" cy="88" r="2.5" opacity=".9"/><circle cx="226" cy="128" r="2.2" opacity=".9"/></g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-leaf l1">${svg('0 0 40 40', '<path d="M6 34 C6 14 18 4 36 4 C36 22 26 34 6 34Z" fill="#7CCB78"/><path d="M8 32 L30 10" stroke="#5AAE62" stroke-width="2" fill="none"/>')}</div>
    <div class="wd-leaf l2">${svg('0 0 40 40', '<path d="M6 34 C6 14 18 4 36 4 C36 22 26 34 6 34Z" fill="#A6DD8E"/><path d="M8 32 L30 10" stroke="#7CC775" stroke-width="2" fill="none"/>')}</div>`,

  w2: () => `
    <div class="wd-beams"><i></i><i></i><i></i></div>
    <div class="wd-trees far">${svg('0 0 400 240', pines(400, 240, 14, '#1D5B4C', 0.55, 3), '', 'preserveAspectRatio="xMidYMax slice"')}</div>
    <div class="wd-fog f1"></div>
    <div class="wd-trees mid">${svg('0 0 400 240', pines(400, 240, 9, '#123F35', 0.75, 7), '', 'preserveAspectRatio="xMidYMax slice"')}</div>
    <div class="wd-fog f2"></div>
    <div class="wd-trunk tl">${svg('0 0 80 400', '<path d="M0 0 H50 C44 120 46 260 64 400 H0Z" fill="#0A2722"/><path d="M50 0 C44 120 46 260 64 400" stroke="#2F7A55" stroke-width="7" fill="none" stroke-dasharray="26 40" stroke-linecap="round"/>', '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-trunk tr">${svg('0 0 80 400', '<path d="M80 0 H34 C42 140 36 280 18 400 H80Z" fill="#0A2722"/><path d="M34 0 C42 140 36 280 18 400" stroke="#2F7A55" stroke-width="7" fill="none" stroke-dasharray="18 50" stroke-linecap="round"/>', '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-ground">${svg('0 0 400 120', `
      <path d="M0 50 C80 30 160 58 240 44 C310 32 360 46 400 40 V120 H0Z" fill="#0B2B25"/>
      <g class="wd-shrooms">
        <rect x="58" y="44" width="8" height="18" rx="3" fill="#EADBC4"/><path d="M46 48 C46 30 78 30 78 48Z" fill="#E0566B"/><circle cx="56" cy="40" r="2.6" fill="#BFFFE6"/><circle cx="68" cy="42" r="2" fill="#BFFFE6"/>
        <rect x="330" y="30" width="7" height="16" rx="3" fill="#EADBC4"/><path d="M320 34 C320 18 348 18 348 34Z" fill="#46D3A0"/><circle cx="330" cy="27" r="2.2" fill="#F4FFDA"/>
        <rect x="350" y="36" width="5" height="11" rx="2" fill="#EADBC4"/><path d="M344 39 C344 28 361 28 361 39Z" fill="#46D3A0"/>
      </g>
      <g fill="#1E5A45"><path d="M120 60 q10 -30 24 -6 q8 -24 18 2 q6 -12 12 4Z"/><path d="M250 50 q8 -22 18 -4 q8 -18 16 2Z"/></g>`, '', 'preserveAspectRatio="xMidYMax slice"')}</div>`,

  w3: () => `
    <div class="wd-burst"></div>
    <div class="wd-gear g1">${svg('-100 -100 200 200', `<g fill="none" stroke="#E9B44C" stroke-width="4">${GEAR(90, 14)}</g><g fill="none" stroke="#E9B44C" stroke-width="3" opacity=".7">${Array.from({ length: 6 }, (_, i) => `<line x1="0" y1="0" x2="${(Math.cos(i * Math.PI / 3) * 62).toFixed(1)}" y2="${(Math.sin(i * Math.PI / 3) * 62).toFixed(1)}"/>`).join('')}</g>`)}</div>
    <div class="wd-gear g2">${svg('-100 -100 200 200', `<g fill="#E9B44C">${GEAR(90, 10, 0.3)}</g>`)}</div>
    <div class="wd-gear g3">${svg('-100 -100 200 200', `<g fill="none" stroke="#C97B45" stroke-width="6">${GEAR(88, 9)}</g>`)}</div>
    <div class="wd-clock">${svg('-60 -60 120 120', `
      <circle r="56" fill="#3A1820" stroke="#E9B44C" stroke-width="4"/><circle r="47" fill="#F8E1B0" opacity=".14"/>
      ${Array.from({ length: 12 }, (_, i) => `<rect x="-2" y="-46" width="4" height="${i % 3 ? 6 : 11}" fill="#E9B44C" transform="rotate(${i * 30})"/>`).join('')}
      <g class="wd-hand-h"><rect x="-2.5" y="-26" width="5" height="28" rx="2" fill="#F8E1B0"/></g>
      <g class="wd-hand-m"><rect x="-1.6" y="-40" width="3.2" height="42" rx="1.6" fill="#E9B44C"/></g>
      <circle r="5" fill="#E9B44C"/>`)}</div>
    <div class="wd-ground">${svg('0 0 400 200', `
      <g fill="#24090F">
        <path d="M0 200 V120 H30 V96 H40 V80 H50 V96 H60 V120 H86 V200Z"/>
        <path d="M84 200 V70 L104 50 L124 70 V200Z"/>
        <path d="M120 200 V106 H140 V90 H170 V106 H190 V200Z"/>
        <path d="M186 200 V60 H200 V30 L214 12 L228 30 V60 H242 V200Z"/>
        <path d="M240 200 V96 H262 V78 H292 V96 H312 V200Z"/>
        <path d="M310 200 V64 L330 40 L350 64 V200Z"/>
        <path d="M348 200 V110 H400 V200Z"/>
      </g>
      <circle cx="214" cy="52" r="11" fill="#F3C877" class="wd-win"/>
      <g fill="#F3C877" class="wd-win"><rect x="96" y="80" width="6" height="9"/><rect x="106" y="96" width="6" height="9"/><rect x="146" y="116" width="6" height="8"/><rect x="270" y="104" width="6" height="8"/><rect x="326" y="76" width="6" height="9"/><rect x="40" y="130" width="6" height="8"/></g>`, '', 'preserveAspectRatio="xMidYMax slice"')}</div>`,

  w4: () => `
    <div class="wd-aurora"><i></i><i></i><i></i></div>
    <div class="wd-stars"></div>
    <div class="wd-ground">${svg('0 0 400 220', `
      <path d="M-10 220 L60 70 L120 150 L180 40 L250 140 L310 60 L410 200 V220Z" fill="#3A4E9C"/>
      <path d="M60 70 L80 150 L120 150Z M180 40 L200 140 L250 140Z M310 60 L330 160 L410 200Z" fill="#4E64B6"/>
      <path d="M60 70 L46 100 L66 96 L74 112 Z M180 40 L166 74 L184 68 L194 84Z M310 60 L298 86 L314 82 L322 96Z" fill="#EAF4FF"/>
      <path d="M-10 220 L40 150 L100 196 L160 120 L230 200 L300 130 L370 190 L410 160 V220Z" fill="#9FB7F2"/>
      <path d="M160 120 L170 200 L230 200Z M300 130 L312 200 L370 190Z M40 150 L52 200 L100 196Z" fill="#C3D5FF"/>
      <g class="wd-crys">
        <path d="M20 220 L14 170 L28 150 L40 170 L36 220Z" fill="#BFF3FF"/><path d="M28 150 L40 170 L36 220 L28 220Z" fill="#8FDDFB"/>
        <path d="M44 220 L42 184 L52 170 L62 186 L58 220Z" fill="#D9C8FF"/>
        <path d="M352 220 L348 160 L362 138 L376 160 L372 220Z" fill="#BFF3FF"/><path d="M362 138 L376 160 L372 220 L362 220Z" fill="#8FDDFB"/>
        <path d="M378 220 L376 190 L386 178 L396 192 L392 220Z" fill="#D9C8FF"/>
      </g>`, '', 'preserveAspectRatio="xMidYMax slice"')}</div>`,

  w5: () => `
    <div class="wd-stars"></div>
    <div class="wd-moon">${svg('0 0 100 100', '<defs><mask id="w5moon"><rect width="100" height="100" fill="#fff"/><circle cx="64" cy="40" r="34" fill="#000"/></mask></defs><circle cx="46" cy="52" r="38" fill="#FFE6A0" mask="url(#w5moon)"/>')}</div>
    <div class="wd-const c1">${svg('0 0 160 110', `<polyline points="10,80 44,52 78,62 112,24 150,36" fill="none" stroke="#F5C451" stroke-width="1.6" stroke-dasharray="3 4" opacity=".7"/>
      <g fill="#FFE9A6">${[[10, 80], [44, 52], [78, 62], [112, 24], [150, 36]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 3.4 : 2.6}" class="tw" style="animation-delay:${i * 0.5}s"/>`).join('')}</g>`)}</div>
    <div class="wd-const c2">${svg('0 0 140 120', `<polyline points="14,20 50,40 40,84 90,96 126,70 90,40 50,40" fill="none" stroke="#C9BCE8" stroke-width="1.4" stroke-dasharray="3 4" opacity=".6"/>
      <g fill="#FFF3D0">${[[14, 20], [50, 40], [40, 84], [90, 96], [126, 70], [90, 40]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 2.6 : 3.4}" class="tw" style="animation-delay:${i * 0.4}s"/>`).join('')}</g>`)}</div>
    ${[1, 2, 3].map((k) => `<div class="wd-book b${k}">${svg('0 0 80 56', `
      <path d="M40 14 L40 52 L6 46 L6 8Z" fill="${['#8F9CFF', '#E0566B', '#46B98A'][k - 1]}"/><path d="M40 14 L40 52 L74 46 L74 8Z" fill="${['#7280F0', '#C8475A', '#2F9A70'][k - 1]}"/>
      <g class="pg-l"><path d="M40 12 Q24 4 10 8 V44 Q24 40 40 48Z" fill="#FAF1DC"/></g>
      <g class="pg-r"><path d="M40 12 Q56 4 70 8 V44 Q56 40 40 48Z" fill="#F0E2C0"/></g>
      <path d="M16 16 L34 18 M16 24 L34 26 M46 18 L64 16 M46 26 L64 24" stroke="#C9A35A" stroke-width="1.6" stroke-linecap="round"/>`)}</div>`).join('')}
    <div class="wd-ground">${svg('0 0 400 120', `
      <path d="M0 120 V70 C30 50 60 64 80 72 C100 44 150 44 170 70 C196 50 236 54 250 74 C280 54 330 56 350 76 C370 64 390 66 400 70 V120Z" fill="#2B2068"/>
      <path d="M0 70 C30 50 60 64 80 72 C100 44 150 44 170 70 C196 50 236 54 250 74 C280 54 330 56 350 76 C370 64 390 66 400 70" fill="none" stroke="#F5C451" stroke-width="2" opacity=".55"/>
      <path d="M0 120 V94 C50 80 100 92 150 98 C220 82 300 86 400 96 V120Z" fill="#1E1650"/>`, '', 'preserveAspectRatio="xMidYMax slice"')}</div>`,
};

function pines(W, H, n, fill, scale, seed) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = ((i + 0.5) / n) * W + (((i * seed * 37) % 23) - 11);
    const h = H * scale * (0.7 + (((i * seed * 13) % 10) / 30));
    const w = h * 0.42;
    const y = H;
    out += `<path d="M${x.toFixed(0)} ${(y - h).toFixed(0)} L${(x + w * 0.5).toFixed(0)} ${(y - h * 0.55).toFixed(0)} L${(x + w * 0.32).toFixed(0)} ${(y - h * 0.55).toFixed(0)} L${(x + w * 0.62).toFixed(0)} ${(y - h * 0.15).toFixed(0)} L${(x - w * 0.62).toFixed(0)} ${(y - h * 0.15).toFixed(0)} L${(x - w * 0.32).toFixed(0)} ${(y - h * 0.55).toFixed(0)} L${(x - w * 0.5).toFixed(0)} ${(y - h * 0.55).toFixed(0)}Z"/><rect x="${(x - 3).toFixed(0)}" y="${(y - h * 0.16).toFixed(0)}" width="6" height="${(h * 0.16).toFixed(0)}"/>`;
  }
  return `<g fill="${fill}">${out}</g><rect y="${H - 8}" width="${W}" height="8" fill="${fill}"/>`;
}

const rnd = (i, n) => ((Math.sin((i + 1) * 12.9898 * n) * 43758.5453) % 1 + 1) % 1;

function particleLayer(t, count) {
  const fxl = document.createElement('div');
  fxl.className = 'wd-fx';
  if (reduced()) return fxl;
  const kinds = t.particles;
  let html = '';
  for (let i = 0; i < count; i++) {
    const k = kinds[i % kinds.length];
    html += `<i class="pt pt-${k}" style="--x:${(rnd(i, 1) * 100).toFixed(1)}%;--y:${(rnd(i, 2) * 100).toFixed(1)}%;--s:${(0.6 + rnd(i, 3) * 0.8).toFixed(2)};--d:${(6 + rnd(i, 4) * 8).toFixed(1)}s;--dl:${(-rnd(i, 5) * 14).toFixed(1)}s;--dx:${((rnd(i, 6) - 0.5) * 80).toFixed(0)}px"></i>`;
  }
  fxl.innerHTML = html;
  return fxl;
}

/** Шар фону світу (абсолютний, на весь батьківський блок). */
export function worldDecor(wid, { particles = true, count = 16 } = {}) {
  const key = worldKey(wid);
  const t = WORLD_THEMES[key];
  const layer = document.createElement('div');
  layer.className = 'w-decor';
  layer.dataset.world = key;
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = `<div class="wd-sky"></div>${SCENES[key]()}`;
  if (particles) layer.append(particleLayer(t, count));
  return layer;
}

// ─────────────────────────────────────────────────────────── page-тема
let pageLayer = null;
let pageOwner = null;

function setPage(key, owner) {
  const t = WORLD_THEMES[key];
  const body = document.body;
  if (pageLayer && pageLayer.dataset.world === key) {
    pageOwner = owner;
    return;
  }
  const old = pageLayer;
  const layer = worldDecor(key, { particles: true, count: 18 });
  layer.classList.add('w-page');
  body.insertBefore(layer, document.getElementById('app'));
  pageLayer = layer;
  pageOwner = owner;
  body.dataset.world = key;
  setVars(body, t);
  try { tg.setColors(t.header, t.bg1); } catch (e) { /* поза Telegram */ }
  if (old) fadeOut(old);
}
function fadeOut(layer) {
  layer.classList.add('out');
  setTimeout(() => layer.remove(), reduced() ? 0 : 520);
}
function clearPage(owner) {
  if (pageOwner !== owner) return;
  const body = document.body;
  // дати новому екрану шанс поставити свою тему до того, як гасимо стару (уникаємо «блимання» між світами)
  setTimeout(() => {
    if (pageOwner !== owner) return;
    delete body.dataset.world;
    clearVars(body);
    if (pageLayer) fadeOut(pageLayer);
    pageLayer = null;
    pageOwner = null;
    try {
      const cs = getComputedStyle(document.documentElement);
      tg.setColors(cs.getPropertyValue('--sky-top').trim() || '#C8D2FF', cs.getPropertyValue('--sky-bottom').trim() || '#FFE2CF');
    } catch (e) { /* */ }
  }, 60);
}

/**
 * Застосувати тему світу до елемента.
 * @returns {() => void} cleanup
 */
export function applyWorldTheme(el, wid, { decor = false, page = false, particles = true } = {}) {
  const key = worldKey(wid);
  const t = WORLD_THEMES[key];
  if (!el) return () => {};
  el.dataset.world = key;
  el.classList.add('w-themed');
  setVars(el, t);
  let layer = null;
  if (decor && !page) {
    layer = worldDecor(key, { particles });
    el.classList.add('w-has-decor');
    el.prepend(layer);
  }
  const owner = {};
  if (page) setPage(key, owner);
  let done = false;
  return () => {
    if (done) return;
    done = true;
    if (layer) layer.remove();
    if (page) clearPage(owner);
  };
}

// ─────────────────────────────────────────────────────────── дрібні SVG для екранів

/** Рамка медальйона вузла стежки (viewBox -60..60, медальйон радіуса ~44 у центрі). */
export function medalFrame(wid) {
  const key = worldKey(wid);
  const t = WORLD_THEMES[key];
  const ink = t.ink;
  switch (key) {
    case 'w1': // вінок з округлих листочків і краплин роси
      return svg('-60 -60 120 120', `
        <circle r="50" fill="${t.accent}" stroke="${ink}" stroke-width="3"/>
        ${Array.from({ length: 10 }, (_, i) => `<g transform="rotate(${i * 36}) translate(0 -51)"><path d="M0 -9 C7 -9 9 0 0 8 C-9 0 -7 -9 0 -9Z" fill="${i % 2 ? '#8ED67B' : '#5FBF7A'}" stroke="${ink}" stroke-width="2.2"/></g>`).join('')}
        <circle cx="-30" cy="-36" r="3" fill="#fff"/>`, 'wf');
    case 'w2': // мохове кільце з грибочком
      return svg('-60 -60 120 120', `
        <path d="${blob(51, 14, 3.5)}" fill="#2E8A62" stroke="${ink}" stroke-width="3"/>
        <path d="${blob(48, 14, 2.5, 1)}" fill="#46A876"/>
        ${Array.from({ length: 7 }, (_, i) => { const a = i * 0.9 + 0.3; return `<circle cx="${(Math.cos(a) * 49).toFixed(1)}" cy="${(Math.sin(a) * 49).toFixed(1)}" r="2.6" fill="#BFFFE0" opacity=".85"/>`; }).join('')}
        <g transform="translate(36 38)"><rect x="-3" y="-4" width="6" height="12" rx="2" fill="#F0E2CC" stroke="${ink}" stroke-width="2"/><path d="M-11 -2 C-11 -15 11 -15 11 -2Z" fill="#E0566B" stroke="${ink}" stroke-width="2.2"/><circle cx="-3" cy="-8" r="1.8" fill="#fff"/><circle cx="4" cy="-6" r="1.4" fill="#fff"/></g>`, 'wf');
    case 'w3': // латунна шестерня з заклепками
      return svg('-60 -60 120 120', `
        <g class="wf-gear"><g fill="${t.accent}" stroke="${ink}" stroke-width="3" stroke-linejoin="round">${GEAR(58, 14, 0)}</g></g>
        <circle r="49" fill="#B4553A" stroke="${ink}" stroke-width="3"/>
        ${Array.from({ length: 8 }, (_, i) => `<circle cx="${(Math.cos(i * Math.PI / 4) * 47).toFixed(1)}" cy="${(Math.sin(i * Math.PI / 4) * 47).toFixed(1)}" r="2.2" fill="#F8E1B0"/>`).join('')}`, 'wf');
    case 'w4': // кристальний шестикутник з гранями
      return svg('-60 -60 120 120', `
        <polygon points="${hex(57)}" fill="#C8F4FF" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
        ${Array.from({ length: 6 }, (_, i) => { const a1 = (i * Math.PI) / 3 - Math.PI / 2; const a2 = a1 + Math.PI / 3; return `<polygon points="${(Math.cos(a1) * 57).toFixed(1)},${(Math.sin(a1) * 57).toFixed(1)} ${(Math.cos(a2) * 57).toFixed(1)},${(Math.sin(a2) * 57).toFixed(1)} ${(Math.cos(a2) * 47).toFixed(1)},${(Math.sin(a2) * 47).toFixed(1)} ${(Math.cos(a1) * 47).toFixed(1)},${(Math.sin(a1) * 47).toFixed(1)}" fill="${['#E9FCFF', '#9FE6FF', '#C8B4FF', '#E9FCFF', '#8ED8FF', '#B79CFF'][i]}"/>`; }).join('')}
        <polygon points="${hex(47)}" fill="none" stroke="${ink}" stroke-width="2"/>`, 'wf');
    default: // w5 — астролябія: подвійне золоте кільце з поділками і чотирма зірочками
      return svg('-60 -60 120 120', `
        <circle r="53" fill="#2B2068" stroke="${ink}" stroke-width="3"/>
        <circle r="50" fill="none" stroke="${t.accent}" stroke-width="3"/>
        ${Array.from({ length: 24 }, (_, i) => `<rect x="-.8" y="-52" width="1.6" height="${i % 6 ? 3 : 6}" fill="${t.accent}" transform="rotate(${i * 15})"/>`).join('')}
        ${[0, 90, 180, 270].map((r) => `<path transform="rotate(${r}) translate(0 -54)" d="M0 -8 L2.4 -2.4 L8 0 L2.4 2.4 L0 8 L-2.4 2.4 L-8 0 L-2.4 -2.4Z" fill="${t.accent}" stroke="${ink}" stroke-width="1.6"/>`).join('')}`, 'wf');
  }
}
function hex(r) {
  return Array.from({ length: 6 }, (_, i) => { const a = (i * Math.PI) / 3 - Math.PI / 2; return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(' ');
}
function blob(r, n, amp, phase = 0) {
  let d = '';
  const N = n * 4;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rr = r + Math.sin(a * n + phase) * amp;
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
  }
  return d + 'Z';
}

/** Постамент для Лумі на головному екрані (viewBox 0 0 240 90). */
export function pedestal(wid) {
  const key = worldKey(wid);
  const ink = WORLD_THEMES[key].ink;
  const P = {
    w1: `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#6DBE6A" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#9BDB7E" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="96" cy="38" rx="44" ry="7" fill="#fff" opacity=".35"/>
      <g stroke="${ink}" stroke-width="2.2"><circle cx="34" cy="48" r="6" fill="#FF9EB5"/><circle cx="206" cy="52" r="6" fill="#FFE07A"/><circle cx="182" cy="34" r="4.5" fill="#fff"/></g>`,
    w2: `<path d="M18 52 C18 30 222 30 222 52 L214 74 C160 90 80 90 26 74Z" fill="#7A5238" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="44" rx="104" ry="20" fill="#C79B6E" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="44" rx="70" ry="12" fill="none" stroke="#9C7150" stroke-width="2.5"/><ellipse cx="120" cy="44" rx="36" ry="6" fill="none" stroke="#9C7150" stroke-width="2.5"/>
      <path d="M22 46 C40 30 70 30 86 40 C70 46 40 50 22 46Z M150 36 C170 28 206 32 218 46 C196 48 170 46 150 36Z" fill="#46A876" stroke="${ink}" stroke-width="2.5"/>`,
    w3: `<path d="M20 50 L40 76 H200 L220 50Z" fill="#7C3A2A" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
      <ellipse cx="120" cy="48" rx="100" ry="18" fill="#E9B44C" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="48" rx="80" ry="12" fill="none" stroke="#B57A2A" stroke-width="3" stroke-dasharray="6 6"/>
      <g fill="#F8E1B0">${[50, 80, 120, 160, 190].map((x) => `<circle cx="${x}" cy="66" r="3"/>`).join('')}</g>`,
    w4: `<path d="M14 50 L44 30 H196 L226 50 L196 78 H44Z" fill="#9FE6FF" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M14 50 L44 30 H196 L226 50Z" fill="#E9FCFF" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M44 30 L64 50 L14 50Z M196 30 L176 50 L226 50Z M120 30 L100 50 H140Z" fill="#C8B4FF" opacity=".75"/>
      <path d="M64 50 L44 78 M176 50 L196 78 M120 50 V78" stroke="${ink}" stroke-width="2" opacity=".5"/>`,
    w5: `<path d="M14 62 C4 62 4 44 20 44 C22 30 46 28 54 38 C64 22 96 22 104 36 C116 24 144 24 152 38 C164 26 194 30 196 44 C214 40 232 58 214 64Z" fill="#E4E3FF" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
      <g stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"><rect x="70" y="30" width="100" height="14" rx="3" fill="#8F9CFF"/><rect x="78" y="18" width="86" height="13" rx="3" fill="#E0566B"/><rect x="88" y="7" width="66" height="12" rx="3" fill="#F5C451"/></g>
      <path d="M70 37 H170 M78 24 H164" stroke="#FFE9A6" stroke-width="1.6"/>`,
  };
  return svg('0 0 240 90', P[key], 'pedestal');
}

/** Маленька емблема світу (viewBox 0 0 48 48). */
export function emblem(wid) {
  const key = worldKey(wid);
  const t = WORLD_THEMES[key];
  const ink = t.ink;
  const E = {
    w1: `<circle cx="24" cy="26" r="11" fill="#FFE07A" stroke="${ink}" stroke-width="2.5"/><path d="M24 8 V4 M38 14 L41 11 M10 14 L7 11 M42 26 H45 M6 26 H3" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/><path d="M6 40 C16 32 32 32 42 40 V44 H6Z" fill="#7CC775" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
    w2: `<path d="M24 4 L36 22 H30 L38 36 H10 L18 22 H12Z" fill="#46A876" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/><rect x="21" y="36" width="6" height="8" fill="#7A5238" stroke="${ink}" stroke-width="2"/><circle cx="40" cy="10" r="2.6" fill="#F4FF9A"/>`,
    w3: `<g transform="translate(24 24)"><g fill="${t.accent}" stroke="${ink}" stroke-width="2.2">${GEAR(19, 10, 0)}</g><circle r="12" fill="#FBF1DD" stroke="${ink}" stroke-width="2.2"/><path d="M0 0 V-8 M0 0 L5 3" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/></g>`,
    w4: `<path d="M24 3 L36 16 L30 44 H18 L12 16Z" fill="#9FE6FF" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/><path d="M24 3 L24 44 M12 16 H36" stroke="${ink}" stroke-width="1.8" opacity=".6"/><path d="M24 3 L36 16 L24 16Z" fill="#E9FCFF"/>`,
    w5: `<path d="M24 12 Q14 6 5 9 V38 Q14 35 24 40 Q34 35 43 38 V9 Q34 6 24 12Z" fill="#FAF1DC" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/><path d="M24 12 V40" stroke="${ink}" stroke-width="2"/><path d="M34 2 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" fill="${t.accent}"/>`,
  };
  return svg('0 0 48 48', E[key], 'emblem');
}

/** Дрібний декор уздовж стежки (без обвідки — фон, щоб не сперечався з вузлами). */
export function worldProps(wid) {
  const key = worldKey(wid);
  const P = {
    w1: [
      svg('0 0 80 60', '<circle cx="24" cy="40" r="20" fill="#8ED67B"/><circle cx="48" cy="30" r="24" fill="#A6DD8E"/><circle cx="40" cy="22" r="6" fill="#fff" opacity=".4"/><circle cx="30" cy="34" r="4" fill="#FF9EB5"/><circle cx="56" cy="40" r="4" fill="#FFE07A"/>'),
      svg('0 0 50 70', '<path d="M25 70 V30" stroke="#5FBF7A" stroke-width="4"/><g fill="#fff"><circle cx="25" cy="14" r="9"/><circle cx="36" cy="24" r="9"/><circle cx="25" cy="34" r="9"/><circle cx="14" cy="24" r="9"/></g><circle cx="25" cy="24" r="7" fill="#FFC23D"/>'),
      svg('0 0 40 40', '<path d="M6 34 C6 14 18 4 36 4 C36 22 26 34 6 34Z" fill="#7CCB78"/><circle cx="28" cy="12" r="3" fill="#fff" opacity=".9"/>'),
    ],
    w2: [
      svg('0 0 70 70', '<rect x="30" y="34" width="10" height="30" rx="4" fill="#EADBC4"/><path d="M8 38 C8 8 62 8 62 38Z" fill="#46D3A0"/><circle cx="24" cy="24" r="4" fill="#E6FFF3"/><circle cx="44" cy="20" r="3" fill="#E6FFF3"/><circle cx="50" cy="32" r="2.5" fill="#E6FFF3"/>'),
      svg('0 0 80 80', '<g fill="#2E8A62"><path d="M40 80 C30 50 10 40 0 36 C20 30 34 44 40 60Z"/><path d="M40 80 C50 50 70 40 80 36 C60 30 46 44 40 60Z"/><path d="M40 78 C36 40 40 20 40 0 C46 20 46 50 40 78Z"/></g>'),
      svg('0 0 90 50', '<path d="M6 50 V30 C6 20 84 20 84 30 V50Z" fill="#6B4A30"/><ellipse cx="45" cy="28" rx="39" ry="9" fill="#B88A5E"/><path d="M10 26 C30 14 60 16 80 26 C62 30 30 30 10 26Z" fill="#46A876"/>'),
    ],
    w3: [
      svg('-50 -50 100 100', `<g fill="#E9B44C" opacity=".9">${GEAR(46, 10, 0.34)}</g>`, 'spin-slow'),
      svg('0 0 40 100', '<rect x="17" y="30" width="6" height="70" fill="#3A1820"/><path d="M8 30 H32 L28 10 H12Z" fill="#3A1820"/><rect x="13" y="13" width="14" height="15" fill="#FFD27A"/><circle cx="20" cy="6" r="4" fill="#3A1820"/>'),
      svg('-40 -40 80 80', `<circle r="34" fill="#3A1820"/><circle r="28" fill="#F8E1B0"/>${Array.from({ length: 12 }, (_, i) => `<rect x="-1.5" y="-26" width="3" height="5" fill="#3A1820" transform="rotate(${i * 30})"/>`).join('')}<path d="M0 0 V-18 M0 0 L12 6" stroke="#3A1820" stroke-width="3" stroke-linecap="round"/>`),
    ],
    w4: [
      svg('0 0 60 80', '<path d="M12 80 L8 36 L20 18 L32 36 L28 80Z" fill="#BFF3FF"/><path d="M20 18 L32 36 L28 80 L20 80Z" fill="#8FDDFB"/><path d="M30 80 L30 46 L42 30 L54 46 L50 80Z" fill="#D9C8FF"/><path d="M42 30 L54 46 L50 80 L42 80Z" fill="#B79CFF"/>'),
      svg('0 0 60 90', '<path d="M30 0 L52 40 H42 L58 74 H2 L18 40 H8Z" fill="#E9F3FF"/><path d="M30 0 L52 40 H42 L58 74 H30Z" fill="#B9CCF5"/><rect x="26" y="74" width="8" height="16" fill="#56609A"/>'),
      svg('0 0 50 50', '<path d="M25 2 V48 M5 13 L45 37 M45 13 L5 37" stroke="#E9FCFF" stroke-width="4" stroke-linecap="round"/><circle cx="25" cy="25" r="5" fill="#9FE6FF"/>'),
    ],
    w5: [
      svg('0 0 80 56', '<path d="M40 12 Q24 4 8 8 V46 Q24 42 40 50Z" fill="#FAF1DC"/><path d="M40 12 Q56 4 72 8 V46 Q56 42 40 50Z" fill="#F0E2C0"/><path d="M16 18 L34 20 M16 26 L34 28 M46 20 L64 18 M46 28 L64 26" stroke="#C9A35A" stroke-width="2" stroke-linecap="round"/>'),
      svg('0 0 50 80', '<path d="M25 0 V10" stroke="#F5C451" stroke-width="3"/><path d="M12 14 H38 L34 60 H16Z" fill="#2B2068" stroke="#F5C451" stroke-width="3"/><circle cx="25" cy="36" r="9" fill="#FFE08A"/><path d="M14 60 H36 L32 70 H18Z" fill="#F5C451"/>'),
      svg('0 0 60 60', '<path d="M30 2 l6 20 20 8 -20 8 -6 20 -6 -20 -20 -8 20 -8z" fill="#FFE08A"/>'),
    ],
  };
  return P[key];
}
