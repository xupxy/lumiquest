// theme.js — у кожного світу свій дизайн: палітра, фактури, рамки, кнопки, стиль заголовків, фон із шарами й частинками.
//
//   applyWorldTheme(el, wid, { decor = false, page = false, particles = true }) -> cleanup()
//     • ставить el.dataset.world = 'w1'…'w5' (v11: ще 'w1b','w2b','w3b'; v18: 'w1c'; v19: країни 'c1'…'c10') і CSS-змінні (--w-bg1, --w-bg2, --w-accent, --w-accent2, --w-ink,
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
//   chapterMark(wid, n) -> SVG-рядок декоративного акценту між «розділами» стежки (n — номер розділу)
import { tg } from './tg.js?v=20261112171845';

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
  // v11 · Сонячний Берег — бірюзове море, пісок, пальми, хвилі, мушлі
  w1b: {
    name: 'beach', bg1: '#6FD6E2', bg2: '#C4F1EE', bg3: '#F6DDA3',
    accent: '#FF8E6B', accent2: '#12A3B8', accentSoft: '#FFE3C9', soft: '#D3F4F2',
    ink: '#143E52', ink2: '#4B7384', card: '#FFFDF4', card2: '#FFEFCB',
    glow: 'rgba(255, 200, 120, .75)', on: '#143E52', on2: '#3F6E80', onDark: '#F2FCFF', on2Dark: '#BFE3EA',
    btn1: '#FFDCA6', btn2: '#FF9D6B', road: '#EBC78E', roadEdge: '#143E52', roadDone: '#FFC857',
    r: '24px 24px 12px 12px', rBtn: '18px',
    font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['pollen', 'glint', 'pollen'], header: '#6FD6E2',
  },
  // v18 · Медові Соти — мед/бурштин, віск, соняшникова зелень, шоколадна обводка; вулики-соти, бджілки
  w1c: {
    name: 'honey', bg1: '#FFCB5C', bg2: '#FFF1C4', bg3: '#A9D86E',
    accent: '#F2A818', accent2: '#6BAF3A', accentSoft: '#FFE7A3', soft: '#E7F5D2',
    ink: '#4A2C14', ink2: '#7A5634', card: '#FFFBEA', card2: '#FFEFC0',
    glow: 'rgba(255, 196, 60, .75)', on: '#4A2C14', on2: '#76522E', onDark: '#FFF6DC', on2Dark: '#F0D9A8',
    btn1: '#FFE38A', btn2: '#F2A818', road: '#FFE7A3', roadEdge: '#4A2C14', roadDone: '#F2A818',
    r: '22px 8px 22px 8px', rBtn: '16px',
    font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['pollen', 'petal', 'pollen'], header: '#FFCB5C',
  },
  // v11 · Долина Вітряків — пшеничне золото й небесна блакить, пагорби, вітряки, хмари
  w2b: {
    name: 'windmill', bg1: '#8CCBF7', bg2: '#D4EDFF', bg3: '#F0D270',
    accent: '#F2B93B', accent2: '#3F8FD8', accentSoft: '#FFEFB8', soft: '#DCEEFF',
    ink: '#3A2C14', ink2: '#77623A', card: '#FFFBEA', card2: '#FBEBB8',
    glow: 'rgba(255, 215, 110, .75)', on: '#3A2C14', on2: '#6B5A38', onDark: '#FFF7DD', on2Dark: '#EAD9A8',
    btn1: '#FFE68A', btn2: '#F0A63A', road: '#EAD6A0', roadEdge: '#3A2C14', roadDone: '#FFD45E',
    r: '18px 18px 8px 8px', rBtn: '16px',
    font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['pollen', 'dust', 'petal'], header: '#8CCBF7',
  },
  // v11 · Порт Ліхтарів — сутінковий синьо-бурштиновий, маяк із променем, кораблі, ліхтарі, хвилі
  w3b: {
    name: 'harbor', bg1: '#0E1A3C', bg2: '#27407A', bg3: '#E0935A',
    accent: '#FFC65A', accent2: '#6FA8FF', accentSoft: '#FFE7B0', soft: '#DCE7FF',
    ink: '#101A38', ink2: '#4E5C86', card: '#FFF6E4', card2: '#F6E3BE',
    glow: 'rgba(255, 190, 90, .6)', on: '#F4EBD8', on2: '#B9C6E8', onDark: '#F4EBD8', on2Dark: '#B9C6E8',
    btn1: '#FFE1A0', btn2: '#F0A040', road: '#A07A50', roadEdge: '#0A1228', roadDone: '#FFC65A',
    r: '10px', rBtn: '12px',
    font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['spark', 'dust', 'twinkle'], header: '#0E1A3C',
  },
  // v15 · Туманні Острови — перламутрово-сірий туман, бірюзово-сизе море, срібло й бузкове світло, маяк, сосни
  w4b: {
    name: 'mist', bg1: '#3A4658', bg2: '#7D90A6', bg3: '#CFC6E0',
    accent: '#8FE0D6', accent2: '#B9A6EC', accentSoft: '#DDF5F1', soft: '#E6EAF4',
    ink: '#1F2B3A', ink2: '#56647A', card: '#F5F7FB', card2: '#E3E8F1',
    glow: 'rgba(190, 220, 235, .6)', on: '#F2F5FA', on2: '#C3CCDD', onDark: '#F2F5FA', on2Dark: '#C3CCDD',
    btn1: '#C8F1EA', btn2: '#6FC2BA', road: '#8E96A3', roadEdge: '#2A3442', roadDone: '#9EE6DC',
    r: '14px', rBtn: '16px',
    font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['dust', 'twinkle', 'dust'], header: '#3A4658',
  },
  // v19 · Дизайн А — країни c1–c5 (палітра + стиль; фон і орієнтир — у SCENES)
  // c1 🇬🇧 — туманний Лондон: димчасто-блакитний, королівський синій, червоні автобуси й будки
  c1: {
    name: 'london', bg1: '#A9BAD0', bg2: '#E4EAF2', bg3: '#7FA36A',
    accent: '#D7263D', accent2: '#2B4C8C', accentSoft: '#F6D3D8', soft: '#DCE5F0',
    ink: '#1C2742', ink2: '#4E5B78', card: '#FBFCFE', card2: '#E8EEF6',
    glow: 'rgba(215, 38, 61, .45)', on: '#1C2742', on2: '#4A5672', onDark: '#F4F7FC', on2Dark: '#C9D4E6',
    btn1: '#F25A6A', btn2: '#C21E34', road: '#D9DEE6', roadEdge: '#1C2742', roadDone: '#D7263D',
    r: '14px', rBtn: '12px',
    font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['dust', 'glint', 'dust'], header: '#A9BAD0',
  },
  // c2 🇺🇸 — хмарочоси й прерія на заході сонця: небесний синій, червоний, кукурудзяне золото, таксі-жовтий
  c2: {
    name: 'usa', bg1: '#7DB2E8', bg2: '#FFE4BC', bg3: '#E2B85A',
    accent: '#FFC23C', accent2: '#C8323C', accentSoft: '#FFEDB8', soft: '#DDEBFA',
    ink: '#1F2B4A', ink2: '#52607E', card: '#FFFDF6', card2: '#FFF0D2',
    glow: 'rgba(255, 194, 60, .7)', on: '#1F2B4A', on2: '#4D5A78', onDark: '#FFF8EA', on2Dark: '#E8D9BC',
    btn1: '#FFD866', btn2: '#F2A21C', road: '#5E6878', roadEdge: '#1F2B4A', roadDone: '#FFC23C',
    r: '18px 18px 6px 6px', rBtn: '14px',
    font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['dust', 'pollen', 'glint'], header: '#7DB2E8',
  },
  // c3 🇯🇵 — сакура, гора під снігом, пагода, червоне сонце: рожевий, кіновар, індиго, матча
  c3: {
    name: 'japan', bg1: '#FFD3DF', bg2: '#FFF3EC', bg3: '#9CC47A',
    accent: '#E0452B', accent2: '#F48FB1', accentSoft: '#FFE0E8', soft: '#EAF4E0',
    ink: '#2B2A4C', ink2: '#5E5A7E', card: '#FFFBF8', card2: '#FFEDF1',
    glow: 'rgba(244, 143, 177, .7)', on: '#2B2A4C', on2: '#5A5678', onDark: '#FFF6F8', on2Dark: '#F0CFDA',
    btn1: '#FFB3C8', btn2: '#E8607E', road: '#F3E6D8', roadEdge: '#2B2A4C', roadDone: '#F48FB1',
    r: '22px 6px 22px 6px', rBtn: '18px',
    font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['petal', 'petal', 'glint'], header: '#FFD3DF',
  },
  // c4 🇫🇷 — Париж: дахи-мансарди, ажурна вежа, лавандові поля, повітряна куля: лаванда, синій, крем, троянда
  c4: {
    name: 'paris', bg1: '#B6C8F2', bg2: '#FFE8E4', bg3: '#A88BD8',
    accent: '#8C6FD6', accent2: '#E86A7A', accentSoft: '#EDE4FF', soft: '#FDE8EC',
    ink: '#24224A', ink2: '#5A5680', card: '#FFFBF6', card2: '#F4EEFF',
    glow: 'rgba(168, 139, 216, .7)', on: '#24224A', on2: '#57537C', onDark: '#FBF8FF', on2Dark: '#DCD2F2',
    btn1: '#C9B6FF', btn2: '#8C6FD6', road: '#EFE4D2', roadEdge: '#24224A', roadDone: '#B9A2F2',
    r: '24px', rBtn: '20px',
    font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['petal', 'glint', 'pollen'], header: '#B6C8F2',
  },
  // c5 🇮🇹 — тосканське сонце, кипариси, амфітеатр, канал із гондолою: теракота, олива, крем, лагуна
  c5: {
    name: 'italy', bg1: '#FFB27A', bg2: '#FFF0D6', bg3: '#8FAE4E',
    accent: '#D9663B', accent2: '#2E9AA6', accentSoft: '#FFE2CC', soft: '#E6F2DA',
    ink: '#4A2418', ink2: '#7A5040', card: '#FFFAF0', card2: '#FFEBD2',
    glow: 'rgba(255, 160, 90, .7)', on: '#4A2418', on2: '#74503E', onDark: '#FFF5E8', on2Dark: '#F0D2B8',
    btn1: '#FFB27A', btn2: '#D9663B', road: '#F2DEC0', roadEdge: '#4A2418', roadDone: '#E8894E',
    r: '20px 20px 8px 8px', rBtn: '16px',
    font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['pollen', 'dust', 'glint'], header: '#FFB27A',
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
  // v19: країни 'c1'…'c10' (+ id ігор/квестів виду 'c10-q3', 'c2q1'); ще не оформлена країна -> 'w3' (рівень B1)
  const cm = /^c(\d+)/.exec(s);
  if (cm) return WORLD_THEMES[`c${cm[1]}`] ? `c${cm[1]}` : 'w3';
  const m = /(\d+)([bc]?)/.exec(s);
  if (m && WORLD_THEMES[`w${m[1]}${m[2]}`]) return `w${m[1]}${m[2]}`;
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

// v11: спільні шматки нових сцен (берег, вітряки, порт)
const CLOUD = '<path d="M18 56 C2 56 2 36 20 36 C18 18 44 12 54 26 C60 6 96 4 102 26 C112 14 140 20 136 38 C154 38 156 56 140 56Z"/>';
const WAVES = (c, o) => `<path d="M0 10 q15 -9 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="${o}"/>`;
const PALM = (c1, c2) => `
  <path d="M56 200 C50 150 54 110 66 66" stroke="#9A6B3E" stroke-width="11" fill="none" stroke-linecap="round"/>
  <path d="M56 200 C50 150 54 110 66 66" stroke="#7A5230" stroke-width="11" fill="none" stroke-dasharray="2 13"/>
  <g><path d="M66 66 C40 40 16 44 4 62 C26 54 46 58 66 66Z" fill="${c1}"/><path d="M66 66 C92 38 112 44 118 64 C100 54 84 58 66 66Z" fill="${c1}"/>
  <path d="M66 66 C52 30 30 18 12 24 C34 30 52 44 66 66Z" fill="${c2}"/><path d="M66 66 C78 30 98 18 114 26 C94 32 80 44 66 66Z" fill="${c2}"/>
  <path d="M66 66 C62 36 66 16 74 6 C76 26 74 46 66 66Z" fill="${c1}"/></g>
  <circle cx="62" cy="70" r="5" fill="#7A5230"/><circle cx="71" cy="72" r="4.5" fill="#8A5E36"/>`;
const MILL = `
  <path d="M30 160 L38 58 H62 L70 160Z" fill="#FBF3DE"/><path d="M50 58 H62 L70 160 H56Z" fill="#E9DDBE"/>
  <path d="M34 60 L50 34 L66 60Z" fill="#C4503C"/><rect x="44" y="124" width="12" height="36" rx="6" fill="#8A5E36"/>
  <rect x="45" y="84" width="10" height="13" rx="2" fill="#7FB8E8"/>`;
const BLADES = `<g>${[0, 90, 180, 270].map((a) => `<g transform="rotate(${a})"><rect x="-2" y="-46" width="4" height="46" fill="#7A5230"/><path d="M2 -44 H15 V-12 H2Z" fill="#FFF8E6" stroke="#B99258" stroke-width="1.6"/><path d="M2 -33 H15 M2 -23 H15" stroke="#B99258" stroke-width="1.4"/></g>`).join('')}<circle r="5" fill="#C4503C"/></g>`;

// v18: медові шматки (вулик, соти, соняшник, бджілка)
const HEXP = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 180) * (60 * i - 90); return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(' ');
const SKEP = (c1 = '#FFC94A', c2 = '#E59A12') => `
  <path d="M10 112 C6 70 20 26 50 18 C80 26 94 70 90 112Z" fill="${c1}"/>
  <path d="M50 18 C80 26 94 70 90 112 H62 C70 80 66 40 50 18Z" fill="${c2}" opacity=".45"/>
  <g fill="none" stroke="${c2}" stroke-width="4" stroke-linecap="round"><path d="M30 34 C42 30 58 30 70 34"/><path d="M19 54 C38 48 62 48 81 54"/><path d="M13 74 C36 68 64 68 87 74"/><path d="M10 94 C36 88 64 88 90 94"/></g>
  <path d="M40 112 V100 C40 90 60 90 60 100 V112Z" fill="#6B3F18"/><rect x="2" y="110" width="96" height="10" rx="4" fill="#9A6B3E"/>
  <path d="M46 14 C46 6 54 6 54 14Z" fill="${c2}"/>`;
const COMB = () => {
  const cells = [[35, 96, 'door'], [69.6, 96, 'honey'], [104.2, 96, 'win'], [52.3, 66, 'win'], [86.9, 66, 'honey'], [69.6, 36, 'win']];
  return cells.map(([x, y, k]) => `<polygon points="${HEXP(x, y, 19)}" fill="${k === 'honey' ? '#F2A818' : '#FFD866'}" stroke="#C98A1A" stroke-width="3.5" stroke-linejoin="round"/>${
    k === 'door' ? `<path d="M${x - 6} ${y + 15} V${y + 3} C${x - 6} ${y - 6} ${x + 6} ${y - 6} ${x + 6} ${y + 3} V${y + 15}Z" fill="#6B3F18"/>`
      : k === 'win' ? `<circle cx="${x}" cy="${y}" r="7" fill="#FFF4C2"/><path d="M${x - 7} ${y} H${x + 7} M${x} ${y - 7} V${y + 7}" stroke="#C98A1A" stroke-width="1.8"/>`
        : `<path d="M${x - 8} ${y - 4} C${x - 2} ${y - 9} ${x + 4} ${y - 9} ${x + 9} ${y - 4}" fill="none" stroke="#FFE7A3" stroke-width="3" stroke-linecap="round" opacity=".8"/>`}`).join('');
};
const SUNF = `
  <path d="M30 140 C27 110 33 80 30 46" stroke="#5E9A33" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M30 104 C18 92 8 96 4 104 C14 108 22 108 30 104Z M31 86 C42 74 52 78 56 86 C46 90 38 90 31 86Z" fill="#6BAF3A"/>
  <g transform="translate(30 32)">${Array.from({ length: 12 }, (_, i) => `<ellipse cx="0" cy="-17" rx="5" ry="11" fill="${i % 2 ? '#FFC21A' : '#FFD84A'}" transform="rotate(${i * 30})"/>`).join('')}
  <circle r="11" fill="#7A4A1E"/><g fill="#4A2C14"><circle cx="-4" cy="-3" r="1.6"/><circle cx="3" cy="-5" r="1.6"/><circle cx="4" cy="3" r="1.6"/><circle cx="-3" cy="5" r="1.6"/></g></g>`;
const BEE = `
  <ellipse class="bw" cx="-1" cy="-7" rx="5" ry="7" fill="#FFFFFF" opacity=".85" transform="rotate(-20 -1 -7)"/>
  <ellipse class="bw" cx="5" cy="-7" rx="4" ry="6" fill="#EAF8FF" opacity=".8" transform="rotate(18 5 -7)"/>
  <ellipse cx="0" cy="0" rx="9" ry="6.5" fill="#FFC21A" stroke="#4A2C14" stroke-width="1.8"/>
  <path d="M-3 -6 V6 M3 -6 V6" stroke="#4A2C14" stroke-width="2.6"/><circle cx="7" cy="-1" r="1.4" fill="#4A2C14"/><path d="M-9 0 L-13 1" stroke="#4A2C14" stroke-width="1.8" stroke-linecap="round"/>`;

// v19 · Дизайн А — силуети країн c1–c5 (узагальнені, без логотипів)
const C_TOWER = (c = '#4A5878', face = '#FFF3C8') => `
  <rect x="16" y="70" width="28" height="118" fill="${c}"/><rect x="11" y="186" width="38" height="14" fill="${c}"/>
  <g stroke="${face}" stroke-width="1.4" opacity=".35"><path d="M22 80 V182 M30 80 V182 M38 80 V182"/></g>
  <rect x="12" y="38" width="36" height="36" fill="${c}"/><circle cx="30" cy="56" r="13" fill="${face}"/>
  <path d="M30 56 V47 M30 56 L37 59" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M10 38 L30 4 L50 38Z" fill="${c}"/><rect x="28.5" y="-6" width="3" height="12" fill="${c}"/>
  <path d="M14 30 H46 M18 22 H42" stroke="${face}" stroke-width="1.2" opacity=".3"/>`;
const C_BUS = `
  <rect x="4" y="4" width="112" height="56" rx="9" fill="#D7263D"/><rect x="4" y="30" width="112" height="5" fill="#9E1A2C"/>
  ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${10 + i * 17.5}" y="11" width="13" height="14" rx="2.5" fill="#D4E6F4"/>`).join('')}
  ${[0, 1, 2, 3, 4].map((i) => `<rect x="${28 + i * 17.5}" y="39" width="13" height="12" rx="2.5" fill="#D4E6F4"/>`).join('')}
  <rect x="9" y="39" width="14" height="21" rx="2" fill="#2B2B3A"/><rect x="104" y="44" width="10" height="5" rx="2" fill="#FFE58A"/>
  <g fill="#2B2B3A"><circle cx="28" cy="62" r="9"/><circle cx="94" cy="62" r="9"/></g><g fill="#AEB6C4"><circle cx="28" cy="62" r="4"/><circle cx="94" cy="62" r="4"/></g>`;
const C_BOX = `
  <path d="M3 14 C3 4 27 4 27 14 V66 H3Z" fill="#D7263D"/><rect x="1" y="64" width="28" height="6" fill="#9E1A2C"/>
  <rect x="6" y="14" width="18" height="5" fill="#2B2B3A"/>
  <g fill="#D4E6F4">${[0, 1, 2].map((r) => [0, 1].map((k) => `<rect x="${7 + k * 8.5}" y="${23 + r * 10}" width="7" height="8" rx="1"/>`).join('')).join('')}</g>`;
const C_SPIRE = (c = '#4F6798', w = '#FFE7A0') => `
  <path d="M8 260 V120 H16 V96 H24 V70 H30 V44 L35 22 L40 44 V70 H46 V96 H54 V120 H62 V260Z" fill="${c}"/>
  <rect x="34" y="0" width="2" height="24" fill="${c}"/>
  <path d="M30 56 Q35 46 40 56 M24 82 Q35 70 46 82" fill="none" stroke="${w}" stroke-width="1.6" opacity=".7"/>
  <g fill="${w}" opacity=".8">${Array.from({ length: 9 }, (_, r) => [0, 1, 2, 3].map((k) => `<rect x="${14 + k * 11}" y="${132 + r * 13}" width="5" height="6"/>`).join('')).join('')}</g>`;
const C_SKY = (back = '#9DB3DA', front = '#6E86B5', win = '#FFE7A0') => `
  <g fill="${back}"><rect x="10" y="40" width="34" height="90"/><rect x="60" y="20" width="26" height="110"/><rect x="150" y="34" width="30" height="96"/><rect x="236" y="14" width="28" height="116"/><rect x="300" y="44" width="40" height="86"/><rect x="360" y="28" width="30" height="102"/></g>
  <g fill="${front}"><rect x="30" y="60" width="38" height="70"/><rect x="96" y="36" width="34" height="94"/><path d="M110 36 L113 18 L116 36Z"/><rect x="190" y="52" width="44" height="78"/><rect x="270" y="30" width="30" height="100"/><rect x="330" y="66" width="44" height="64"/></g>
  <g fill="${win}" opacity=".75">${[[36, 70], [102, 46], [198, 62], [276, 40], [338, 76]].map(([x, y]) => Array.from({ length: 4 }, (_, r) => `<rect x="${x}" y="${y + r * 14}" width="5" height="6"/><rect x="${x + 12}" y="${y + r * 14}" width="5" height="6"/>`).join('')).join('')}</g>`;
const C_TAXI = `
  <path d="M8 34 C8 26 14 24 22 24 L34 10 H74 L88 24 H100 C106 24 108 28 108 34 V44 H8Z" fill="#FFC23C"/>
  <path d="M38 14 H54 V24 H30Z M58 14 H72 L82 24 H58Z" fill="#D4E6F4"/><rect x="46" y="4" width="16" height="6" rx="2" fill="#FFE58A"/>
  <path d="M8 32 H108" stroke="#2B2B3A" stroke-width="3" stroke-dasharray="4 4"/>
  <g fill="#2B2B3A"><circle cx="28" cy="46" r="8"/><circle cx="86" cy="46" r="8"/></g><g fill="#AEB6C4"><circle cx="28" cy="46" r="3.5"/><circle cx="86" cy="46" r="3.5"/></g>`;
const C_PUMP = `
  <path d="M22 140 L28 40 H32 L38 140" fill="none" stroke="#7A5638" stroke-width="3"/><path d="M24 110 L36 80 M36 110 L24 80 M26 70 L34 50" stroke="#7A5638" stroke-width="1.8"/>
  <g class="cx-fan" style="transform-origin:30px 34px">${Array.from({ length: 12 }, (_, i) => `<path d="M30 34 L28 10 H32Z" fill="#E9EEF4" stroke="#7A5638" stroke-width="1" transform="rotate(${i * 30} 30 34)"/>`).join('')}<circle cx="30" cy="34" r="3" fill="#C8323C"/></g>
  <path d="M34 34 H54 L50 40 H34Z" fill="#C8323C"/>`;
const C_FUJI = `
  <path d="M0 160 C60 150 110 110 160 46 C170 36 190 34 200 34 C214 34 230 38 240 46 C290 110 340 150 400 160Z" fill="#9AA6D8"/>
  <path d="M160 46 C170 36 190 34 200 34 C214 34 230 38 240 46 L254 66 L240 60 L230 72 L216 62 L200 74 L186 62 L172 72 L162 60 L146 66Z" fill="#FFFFFF"/>
  <path d="M200 34 C214 34 230 38 240 46 L254 66 L240 60 L230 72 L216 62 L200 74Z" fill="#E4E8F8"/>
  <path d="M240 46 C290 110 340 150 400 160 H300 C270 130 250 90 240 60Z" fill="#8592C8" opacity=".55"/>`;
const C_PAGODA = (roof = '#3A2E4A', wall = '#C8463A') => {
  let s = '<rect x="38" y="0" width="4" height="22" fill="' + roof + '"/>';
  for (let i = 0; i < 5; i++) {
    const y = 22 + i * 34, w = 22 + i * 7;
    s += `<rect x="${40 - w * 0.62}" y="${y + 10}" width="${w * 1.24}" height="24" fill="${wall}"/><rect x="${40 - w * 0.3}" y="${y + 15}" width="${w * 0.6}" height="14" fill="#FFE7C8" opacity=".55"/>`;
    s += `<path d="M${40 - w - 6} ${y + 14} Q${40 - w * 0.6} ${y + 8} ${40 - w * 0.5} ${y} H${40 + w * 0.5} Q${40 + w * 0.6} ${y + 8} ${40 + w + 6} ${y + 14} Q${40} ${y + 6} ${40 - w - 6} ${y + 14}Z" fill="${roof}"/>`;
  }
  return s + `<rect x="${40 - 34}" y="192" width="68" height="8" fill="${roof}"/>`;
};
const C_TORII = (c = '#E0452B', d = '#2B2A4C') => `
  <path d="M2 10 Q45 2 88 10 L86 18 Q45 11 4 18Z" fill="${d}"/><rect x="8" y="18" width="74" height="8" fill="${c}"/>
  <rect x="16" y="26" width="8" height="54" fill="${c}"/><rect x="66" y="26" width="8" height="54" fill="${c}"/><rect x="40" y="18" width="10" height="20" fill="${c}"/>
  <rect x="12" y="34" width="66" height="6" fill="${c}"/>`;
const C_SAKURA = (p1 = '#FFB7CC', p2 = '#F48FB1') => `
  <path d="M58 120 C56 96 60 80 54 64 M56 86 C44 76 36 74 28 66 M58 78 C70 70 78 62 88 58" fill="none" stroke="#6B4A4A" stroke-width="6" stroke-linecap="round"/>
  <g fill="${p1}"><circle cx="30" cy="54" r="20"/><circle cx="54" cy="38" r="26"/><circle cx="84" cy="48" r="22"/><circle cx="68" cy="64" r="18"/><circle cx="40" cy="70" r="14"/></g>
  <g fill="${p2}" opacity=".7"><circle cx="38" cy="62" r="10"/><circle cx="74" cy="56" r="11"/><circle cx="58" cy="30" r="9"/></g>
  <g fill="#FFFFFF" opacity=".6"><circle cx="46" cy="30" r="5"/><circle cx="80" cy="40" r="4"/></g>`;
const C_LATTICE = (c = '#5C5470', l = '#C9BEDF') => `
  <path d="M8 260 C28 200 38 150 44 64 L47 22 H53 L56 64 C62 150 72 200 92 260 H74 C66 238 58 228 50 228 C42 228 34 238 26 260Z" fill="${c}"/>
  <rect x="49" y="0" width="2" height="24" fill="${c}"/><rect x="44" y="18" width="12" height="6" fill="${c}"/>
  <rect x="26" y="168" width="48" height="8" fill="${c}"/><rect x="36" y="108" width="28" height="6" fill="${c}"/>
  <g stroke="${l}" stroke-width="1.2" opacity=".55" fill="none"><path d="M38 176 L62 200 M62 176 L38 200 M42 120 L58 160 M58 120 L42 160 M45 70 L55 104 M55 70 L45 104"/></g>`;
const C_ROOFS = (wall = '#F6E9D6', roof = '#7C88A8', win = '#5A6A90') => {
  let s = '';
  const xs = [0, 46, 96, 140, 196, 242, 290, 340];
  xs.forEach((x, i) => {
    const h = 54 + ((i * 37) % 30), w = i % 2 ? 50 : 46, top = 120 - h;
    s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${wall}"/>`;
    s += `<path d="M${x - 2} ${top} L${x + 6} ${top - 16} H${x + w - 6} L${x + w + 2} ${top}Z" fill="${roof}"/>`;
    s += `<rect x="${x + w - 14}" y="${top - 26}" width="7" height="12" fill="#C9826A"/>`;
    s += [0, 1, 2].map((k) => `<rect x="${x + 7 + k * 13}" y="${top + 10}" width="7" height="11" fill="${win}"/><rect x="${x + 7 + k * 13}" y="${top + 30}" width="7" height="11" fill="${win}"/>`).join('');
  });
  return s;
};
const C_BALLOON = `
  <path d="M30 4 C10 4 2 20 2 32 C2 46 18 56 24 64 H36 C42 56 58 46 58 32 C58 20 50 4 30 4Z" fill="#FFB3C1"/>
  <path d="M30 4 C22 4 16 20 16 32 C16 46 22 56 26 64 H34 C38 56 44 46 44 32 C44 20 38 4 30 4Z" fill="#FFF4E6"/>
  <path d="M30 4 C27 4 25 20 25 32 C25 46 27 56 28 64 H32 C33 56 35 46 35 32 C35 20 33 4 30 4Z" fill="#A88BD8"/>
  <path d="M24 64 L25 72 M36 64 L35 72" stroke="#7A5638" stroke-width="1.4"/><rect x="23" y="71" width="14" height="9" rx="2" fill="#B98A54"/>`;
const C_ARENA = (c = '#E2B07A', d = '#A86A3E') => {
  let s = `<path d="M4 110 V36 C40 20 120 20 156 36 V110Z" fill="${c}"/><path d="M120 24 C134 26 148 30 156 36 V54 C150 48 140 46 132 50 C128 40 124 32 120 24Z" fill="${d}" opacity=".35"/>`;
  [[44, 14, 9], [70, 13, 12], [94, 12, 12]].forEach(([y, w, n], row) => {
    for (let i = 0; i < n; i++) {
      const x = 10 + i * (146 / n);
      if (row === 0 && i > 6) continue;
      s += `<path d="M${x.toFixed(1)} ${y + 12} V${y} Q${(x + w / 2).toFixed(1)} ${y - 7} ${(x + w).toFixed(1)} ${y} V${y + 12}Z" fill="${d}"/>`;
    }
  });
  return s + `<path d="M4 58 H156 M4 84 H156" stroke="${d}" stroke-width="2" opacity=".6"/><path d="M118 36 L128 30 L134 38 L146 32" fill="none" stroke="${d}" stroke-width="2"/>`;
};
const C_CYPRESS = (c = '#3F6B3A', h = '#5E8A48') => `<path d="M15 100 C4 70 6 30 15 2 C24 30 26 70 15 100Z" fill="${c}"/><path d="M15 6 C20 30 21 64 15 96" fill="none" stroke="${h}" stroke-width="3" opacity=".6"/><rect x="13" y="96" width="4" height="8" fill="#6B4A2A"/>`;
const C_HOUSES = () => {
  const cols = ['#E8894E', '#F2C46A', '#E86A7A', '#D9663B', '#F6D8A8', '#C8A0D0', '#E8A85A', '#F28C6A'];
  return cols.map((col, i) => { const x = i * 50, h = 46 + ((i * 29) % 26); return `<rect x="${x}" y="${80 - h}" width="50" height="${h}" fill="${col}"/><path d="M${x - 2} ${80 - h} H${x + 52} V${84 - h} H${x - 2}Z" fill="#A8502E"/>${[0, 1, 2].map((k) => `<path d="M${x + 8 + k * 14} ${92 - h + 18} V${92 - h + 8} Q${x + 12 + k * 14} ${92 - h + 3} ${x + 16 + k * 14} ${92 - h + 8} V${92 - h + 18}Z" fill="#5A3A2A" opacity=".75"/>`).join('')}`; }).join('');
};
const C_GONDOLA = `
  <path d="M2 30 C20 40 90 40 112 30 C116 26 118 18 116 10 C112 22 104 28 96 30 H14 C8 28 4 24 2 18Z" fill="#1F1A24"/>
  <path d="M110 12 L118 8 L116 14Z" fill="#E9D8A8"/><rect x="40" y="22" width="22" height="8" rx="2" fill="#C8323C"/>
  <path d="M86 28 L98 -10" stroke="#9A6B3E" stroke-width="2.4"/>
  <g transform="translate(86 4)"><rect x="-4" y="0" width="8" height="18" fill="#FFFFFF"/><path d="M-4 4 H4 M-4 9 H4 M-4 14 H4" stroke="#2B3A6A" stroke-width="2"/><circle cy="-4" r="4" fill="#F2C9A8"/><ellipse cy="-8" rx="7" ry="2" fill="#F3D58A"/><rect x="-3.5" y="-12" width="7" height="4" fill="#F3D58A"/></g>`;

const SCENES = {
  // v19 · Дизайн А — c1 🇬🇧 туман над річкою, вежа з годинником, червоні автобус і будка
  c1: () => `
    <div class="wd-cloud wc1">${svg('0 0 160 60', CLOUD)}</div>
    <div class="wd-cloud wc2">${svg('0 0 160 60', CLOUD)}</div>
    <div class="cx-city">${svg('0 0 400 120', `${C_SKY('#CCD5E3', '#B5C1D4', '#E8EEF6')}
      <g transform="translate(300 30)"><circle cx="40" cy="40" r="38" fill="none" stroke="#9FAEC4" stroke-width="3"/>${Array.from({ length: 8 }, (_, i) => `<path d="M40 40 L${(40 + 38 * Math.cos(i * Math.PI / 4)).toFixed(1)} ${(40 + 38 * Math.sin(i * Math.PI / 4)).toFixed(1)}" stroke="#9FAEC4" stroke-width="1.4"/>`).join('')}<path d="M30 90 L40 40 L50 90Z" fill="#9FAEC4"/></g>`, '', 'preserveAspectRatio="xMidYMax slice"')}</div>
    <div class="cx-lm">${svg('0 -8 60 208', C_TOWER())}</div>
    <div class="cx-river">${svg('0 0 400 60', `<rect width="400" height="60" fill="#7F9BB8"/><rect width="400" height="16" fill="#9DB4CC"/>`, '', 'preserveAspectRatio="none"')}
      <div class="wd-wave wv1">${svg('0 0 480 20', WAVES('#E4EAF2', 0.7), '', 'preserveAspectRatio="none"')}</div></div>
    <div class="wd-ground">${svg('0 0 400 150', `
      <path d="M0 20 C80 8 160 26 240 16 C310 8 360 22 400 14 V150 H0Z" fill="#8DB878"/>
      <path d="M0 64 C90 50 190 70 280 58 C340 52 380 62 400 58 V150 H0Z" fill="#6E9E5A"/>
      <path d="M0 116 C120 104 260 124 400 108 V150 H0Z" fill="#9AA3B2"/><path d="M0 120 C120 108 260 128 400 112" fill="none" stroke="#C4CAD4" stroke-width="3" stroke-dasharray="12 8"/>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="cx-box">${svg('0 0 30 70', C_BOX)}</div>
    <div class="cx-veh">${svg('0 0 120 72', C_BUS)}</div>
    <div class="cx-mist m1"></div><div class="cx-mist m2"></div>`,

  // c2 🇺🇸 місто-хмарочоси на тлі заходу, прерія, вітряк-насос, жовте таксі
  c2: () => `
    <div class="wd-sun">${svg('-100 -100 200 200', `
      <g class="wd-rays">${Array.from({ length: 12 }, (_, i) => `<rect x="-7" y="-96" width="14" height="34" rx="7" transform="rotate(${i * 30})"/>`).join('')}</g>
      <circle r="52" fill="#FFC95C"/>`)}<i class="wd-sun-core"></i></div>
    <div class="wd-cloud wc1">${svg('0 0 160 60', CLOUD)}</div>
    <div class="cx-city">${svg('0 0 400 130', C_SKY(), '', 'preserveAspectRatio="xMidYMax slice"')}</div>
    <div class="cx-lm">${svg('0 0 70 260', C_SPIRE())}</div>
    <div class="wd-ground">${svg('0 0 400 150', `
      <path d="M0 22 C70 6 150 28 230 16 C300 6 360 24 400 12 V150 H0Z" fill="#F0D27A"/>
      <path d="M0 58 C90 40 180 64 270 50 C330 42 370 54 400 50 V150 H0Z" fill="#E2B85A"/>
      <path d="M0 96 H400 V124 H0Z" fill="#5E6878"/><path d="M0 110 H400" stroke="#FFD866" stroke-width="2.5" stroke-dasharray="14 12"/>
      <path d="M0 124 H400 V150 H0Z" fill="#C99A44"/>
      <g stroke="#9A6B3E" stroke-width="2.5"><path d="M20 92 V76 M60 90 V74 M100 88 V72 M140 88 V72 M180 90 V74"/><path d="M14 80 C60 76 120 74 186 78" fill="none"/></g>
      <g fill="#C99A44">${Array.from({ length: 14 }, (_, i) => `<path d="M${16 + i * 28} 60 l3 -10 l3 10Z"/>`).join('')}</g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="cx-pump">${svg('0 0 60 140', C_PUMP)}</div>
    <div class="cx-veh">${svg('0 0 110 56', C_TAXI)}</div>`,

  // c3 🇯🇵 червоне сонце, гора під снігом, пагода, ворота торії, сакура
  c3: () => `
    <div class="cx-sun">${svg('0 0 100 100', '<circle cx="50" cy="50" r="46" fill="#E8463A"/><circle cx="50" cy="50" r="46" fill="none" stroke="#FFB0A0" stroke-width="3" opacity=".6"/>')}</div>
    <div class="wd-cloud wc1">${svg('0 0 160 60', CLOUD)}</div>
    <div class="cx-mount">${svg('0 0 400 160', C_FUJI, '', 'preserveAspectRatio="xMidYMax slice"')}</div>
    <div class="cx-lm">${svg('0 0 80 200', C_PAGODA())}</div>
    <div class="wd-ground">${svg('0 0 400 150', `
      <path d="M0 26 C70 10 140 30 220 18 C300 8 350 26 400 16 V150 H0Z" fill="#B8D88E"/>
      <path d="M0 64 C90 46 180 70 270 56 C330 48 370 60 400 56 V150 H0Z" fill="#8DBA6A"/>
      <path d="M150 150 C170 110 200 80 230 64" fill="none" stroke="#F3E6D8" stroke-width="18" stroke-linecap="round"/>
      <g fill="#C9C2B8">${[[70, 72], [330, 70]].map(([x, y]) => `<rect x="${x - 4}" y="${y}" width="8" height="18"/><path d="M${x - 10} ${y} H${x + 10} L${x + 6} ${y - 6} H${x - 6}Z"/><rect x="${x - 6}" y="${y - 14}" width="12" height="8"/><path d="M${x - 9} ${y - 14} L${x} ${y - 22} L${x + 9} ${y - 14}Z"/>`).join('')}</g>
      <g fill="#FFB7CC" opacity=".9"><circle cx="40" cy="110" r="3"/><circle cx="120" cy="96" r="2.5"/><circle cx="260" cy="120" r="3"/><circle cx="360" cy="100" r="2.5"/></g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="cx-torii">${svg('0 0 90 80', C_TORII())}</div>
    <div class="cx-tree t1">${svg('0 0 120 120', C_SAKURA())}</div>
    <div class="cx-tree t2">${svg('0 0 120 120', C_SAKURA('#FFC9D8', '#F7A1BE'))}</div>`,

  // c4 🇫🇷 дахи-мансарди, ажурна вежа, лавандове поле, повітряна куля
  c4: () => `
    <div class="wd-cloud wc1">${svg('0 0 160 60', CLOUD)}</div>
    <div class="wd-cloud wc2">${svg('0 0 160 60', CLOUD)}</div>
    <div class="cx-balloon">${svg('0 0 60 80', C_BALLOON)}</div>
    <div class="cx-lm">${svg('0 -2 100 262', C_LATTICE())}</div>
    <div class="cx-city">${svg('0 0 400 120', C_ROOFS(), '', 'preserveAspectRatio="xMidYMax slice"')}</div>
    <div class="wd-ground">${svg('0 0 400 150', `
      <path d="M0 14 C80 4 160 20 240 12 C310 6 360 18 400 10 V150 H0Z" fill="#9CC47A"/>
      <path d="M0 40 C90 28 180 46 270 36 C330 30 370 40 400 36 V150 H0Z" fill="#7FA85E"/>
      <g stroke="#A88BD8" stroke-width="9" stroke-linecap="round">${Array.from({ length: 9 }, (_, i) => `<path d="M${200 + (i - 4) * 30} 52 L${200 + (i - 4) * 70} 160"/>`).join('')}</g>
      <g stroke="#C9B6FF" stroke-width="3" stroke-linecap="round" opacity=".8">${Array.from({ length: 9 }, (_, i) => `<path d="M${200 + (i - 4) * 30} 52 L${200 + (i - 4) * 70} 160" stroke-dasharray="2 9"/>`).join('')}</g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="cx-tree t1">${svg('0 0 60 80', '<rect x="27" y="44" width="6" height="36" fill="#7A5638"/><circle cx="30" cy="30" r="24" fill="#6E9E5A"/><circle cx="22" cy="22" r="10" fill="#8DBA6A"/>')}</div>`,

  // c5 🇮🇹 тосканські пагорби з кипарисами, амфітеатр, кольорові будиночки, канал із гондолою
  c5: () => `
    <div class="wd-sun">${svg('-100 -100 200 200', `
      <g class="wd-rays">${Array.from({ length: 12 }, (_, i) => `<rect x="-7" y="-96" width="14" height="34" rx="7" transform="rotate(${i * 30})"/>`).join('')}</g>
      <circle r="52" fill="#FFB866"/>`)}<i class="wd-sun-core"></i></div>
    <div class="wd-cloud wc1">${svg('0 0 160 60', CLOUD)}</div>
    <div class="cx-hills">${svg('0 0 400 120', `
      <path d="M0 60 C60 30 120 40 180 54 C240 30 320 26 400 48 V120 H0Z" fill="#B7C47A"/>
      <path d="M0 86 C80 62 160 70 240 84 C300 70 360 66 400 78 V120 H0Z" fill="#8FAE4E"/>
      ${[[40, 44], [56, 48], [210, 40], [226, 44], [242, 48]].map(([x, y]) => `<g transform="translate(${x} ${y}) scale(.34)">${C_CYPRESS()}</g>`).join('')}`, '', 'preserveAspectRatio="xMidYMax slice"')}</div>
    <div class="cx-lm">${svg('0 0 160 112', C_ARENA())}</div>
    <div class="cx-houses">${svg('0 0 400 84', C_HOUSES(), '', 'preserveAspectRatio="xMidYMax slice"')}</div>
    <div class="cx-river">${svg('0 0 400 60', `<rect width="400" height="60" fill="#2E9AA6"/><rect width="400" height="14" fill="#4FB6BE"/>`, '', 'preserveAspectRatio="none"')}
      <div class="wd-wave wv1">${svg('0 0 480 20', WAVES('#BFF0EA', 0.7), '', 'preserveAspectRatio="none"')}</div></div>
    <div class="wd-ground">${svg('0 0 400 40', `<rect width="400" height="40" fill="#E2C49A"/><path d="M0 4 H400" stroke="#C9A478" stroke-width="5"/><g stroke="#C9A478" stroke-width="2">${Array.from({ length: 20 }, (_, i) => `<path d="M${i * 20 + 10} 8 V40"/>`).join('')}</g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="cx-veh">${svg('0 -14 120 56', C_GONDOLA)}</div>
    <div class="cx-tree t1">${svg('0 0 30 104', C_CYPRESS())}</div>`,
  // v11 · Сонячний Берег
  w1b: () => `
    <div class="wd-sun">${svg('-100 -100 200 200', `
      <g class="wd-rays">${Array.from({ length: 12 }, (_, i) => `<rect x="-7" y="-96" width="14" height="34" rx="7" transform="rotate(${i * 30})"/>`).join('')}</g>
      <circle r="52" fill="#FFC95C"/>`)}<i class="wd-sun-core"></i></div>
    <div class="wd-cloud wc1">${svg('0 0 160 60', CLOUD)}</div>
    <div class="wd-sea">${svg('0 0 400 100', `
      <rect width="400" height="100" fill="#2FB9CC"/><rect width="400" height="34" fill="#55CFDA"/>
      <path d="M0 78 C50 66 100 90 150 78 C200 66 250 90 300 78 C350 66 380 84 400 78 V100 H0Z" fill="#8FE6E4"/>`, '', 'preserveAspectRatio="none"')}
      <div class="wd-wave wv1">${svg('0 0 480 20', WAVES('#fff', 0.75), '', 'preserveAspectRatio="none"')}</div>
      <div class="wd-wave wv2">${svg('0 0 480 20', WAVES('#DFFBFA', 0.6), '', 'preserveAspectRatio="none"')}</div></div>
    <div class="wd-ground">${svg('0 0 400 150', `
      <path d="M0 26 C60 6 130 30 200 20 C270 10 340 30 400 14 V150 H0Z" fill="#FFF3CF"/>
      <path d="M0 50 C80 32 160 56 240 44 C310 34 360 50 400 42 V150 H0Z" fill="#F6DDA3"/>
      <path d="M0 100 C90 84 190 104 280 94 C340 88 380 98 400 94 V150 H0Z" fill="#EBCB88"/>
      <g fill="#E2B96E" opacity=".7"><circle cx="40" cy="74" r="2.5"/><circle cx="150" cy="118" r="2.5"/><circle cx="262" cy="70" r="2"/><circle cx="350" cy="120" r="2.5"/><circle cx="210" cy="84" r="2"/></g>
      <g transform="translate(84 84)"><path d="M-13 6 C-13 -12 13 -12 13 6Z" fill="#FFB7A0"/><path d="M0 6 V-7 M-6 6 L-8 -4 M6 6 L8 -4" stroke="#F08A70" stroke-width="2" fill="none" stroke-linecap="round"/></g>
      <g transform="translate(318 76)"><path d="M0 -12 L3.5 -4 L12 -3.5 L5.5 2 L8 11 L0 6 L-8 11 L-5.5 2 L-12 -3.5 L-3.5 -4Z" fill="#FF8E6B"/><circle r="2" fill="#FFD9C4"/></g>
      <g transform="translate(232 124)"><path d="M-10 5 C-10 -9 10 -9 10 5Z" fill="#fff"/><path d="M0 5 V-5 M-5 5 L-6 -3 M5 5 L6 -3" stroke="#E7CFA0" stroke-width="1.8" fill="none"/></g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-palm p1">${svg('0 0 120 200', PALM('#2FA58C', '#57C9A4'))}</div>
    <div class="wd-palm p2">${svg('0 0 120 200', PALM('#278F7C', '#49B896'))}</div>`,

  // v18 · Медові Соти
  w1c: () => `
    <div class="wd-sun">${svg('-100 -100 200 200', `
      <g class="wd-rays">${Array.from({ length: 12 }, (_, i) => `<rect x="-7" y="-96" width="14" height="34" rx="7" transform="rotate(${i * 30})"/>`).join('')}</g>
      <circle r="52" fill="#FFC95C"/>`)}<i class="wd-sun-core"></i></div>
    <div class="wd-cloud wc1">${svg('0 0 160 60', CLOUD)}</div>
    <div class="wd-cloud wc2">${svg('0 0 160 60', CLOUD)}</div>
    <div class="wd-ground">${svg('0 0 400 150', `
      <path d="M0 30 C60 8 130 26 200 18 C270 10 340 30 400 16 V150 H0Z" fill="#BFE07A"/>
      <path d="M0 56 C80 36 160 60 240 48 C310 38 360 54 400 46 V150 H0Z" fill="#94CC58"/>
      <path d="M0 108 C90 92 190 112 280 102 C340 96 380 106 400 102 V150 H0Z" fill="#6BAF3A"/>
      <g fill="#FFE7A3"><circle cx="40" cy="74" r="3"/><circle cx="150" cy="120" r="3"/><circle cx="262" cy="70" r="2.6"/><circle cx="350" cy="124" r="3"/><circle cx="210" cy="84" r="2.6"/><circle cx="110" cy="66" r="2.4"/></g>
      <g fill="#FFFFFF" opacity=".85"><circle cx="70" cy="96" r="2.4"/><circle cx="300" cy="90" r="2.4"/><circle cx="190" cy="132" r="2.2"/></g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-honey">${svg('0 0 400 60', `
      <path d="M0 18 C70 4 130 30 200 18 C270 6 330 28 400 16 V48 C330 60 270 38 200 50 C130 62 70 40 0 50Z" fill="#E59A12"/>
      <path d="M0 22 C70 8 130 34 200 22 C270 10 330 32 400 20 V40 C330 52 270 30 200 42 C130 54 70 32 0 42Z" fill="#F2A818"/>`, '', 'preserveAspectRatio="none"')}
      <div class="wd-wave wv1">${svg('0 0 480 20', WAVES('#FFE7A3', 0.85), '', 'preserveAspectRatio="none"')}</div></div>
    <div class="wd-comb">${svg('0 0 140 120', COMB())}</div>
    <div class="wd-hive">${svg('0 0 100 120', SKEP())}</div>
    <div class="wd-sunf s1">${svg('0 0 60 140', SUNF)}</div>
    <div class="wd-sunf s2">${svg('0 0 60 140', SUNF)}</div>
    <div class="wd-sunf s3">${svg('0 0 60 140', SUNF)}</div>
    <div class="wd-bee b1">${svg('-14 -16 28 24', BEE)}</div>
    <div class="wd-bee b2">${svg('-14 -16 28 24', BEE)}</div>`,
  // v11 · Долина Вітряків
  w2b: () => `
    <div class="wd-cloud wc1">${svg('0 0 160 60', CLOUD)}</div>
    <div class="wd-cloud wc2">${svg('0 0 160 60', CLOUD)}</div>
    <div class="wd-cloud wc3">${svg('0 0 160 60', CLOUD)}</div>
    <div class="wd-ground">${svg('0 0 400 200', `
      <path d="M0 60 C60 26 130 30 200 56 C260 78 330 40 400 50 V200 H0Z" fill="#A9D48A"/>
      <path d="M0 96 C80 62 150 70 230 96 C300 118 350 84 400 88 V200 H0Z" fill="#F5DC84"/>
      <path d="M0 136 C90 108 170 118 250 138 C320 154 360 130 400 132 V200 H0Z" fill="#EBC65A"/>
      <path d="M0 170 C90 152 190 164 280 174 C340 180 380 168 400 168 V200 H0Z" fill="#DDB046"/>
      <g stroke="#C99A30" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".8">
        <path d="M40 132 v-14 M48 134 v-16 M56 133 v-13 M300 124 v-14 M308 126 v-16 M316 125 v-13 M150 160 v-14 M158 162 v-16 M166 161 v-13 M352 162 v-13 M360 164 v-15"/></g>
      <g fill="#F7E08A"><ellipse cx="48" cy="116" rx="2.6" ry="5"/><ellipse cx="308" cy="108" rx="2.6" ry="5"/><ellipse cx="158" cy="144" rx="2.6" ry="5"/><ellipse cx="360" cy="147" rx="2.6" ry="5"/></g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-mill m1">${svg('0 0 100 160', MILL)}<div class="wd-blades">${svg('-50 -50 100 100', BLADES)}</div></div>
    <div class="wd-mill m2">${svg('0 0 100 160', MILL)}<div class="wd-blades">${svg('-50 -50 100 100', BLADES)}</div></div>`,

  // v11 · Порт Ліхтарів
  w3b: () => `
    <div class="wd-lh"><div class="wd-lh-beam"></div>${svg('0 0 100 240', `
      <path d="M8 240 C14 214 30 204 50 204 C72 204 90 216 96 240Z" fill="#0B1430"/>
      <path d="M34 206 L40 78 H62 L68 206Z" fill="#E9E2D2"/><path d="M38.5 110 H63.5 L65 142 H37Z M35.5 174 H66.5 L68 206 H34Z" fill="#C4503C"/>
      <rect x="34" y="70" width="34" height="9" rx="2" fill="#16224A"/><rect x="41" y="48" width="20" height="23" fill="#FFD27A"/>
      <path d="M41 48 H61 M51 48 V71" stroke="#16224A" stroke-width="2.5"/><path d="M37 48 L51 32 L65 48Z" fill="#16224A"/>`)}<i class="wd-lh-glow"></i></div>
    <div class="wd-sea">${svg('0 0 400 100', `
      <rect width="400" height="100" fill="#1B2F66"/><rect width="400" height="30" fill="#2A4686"/>
      <path d="M120 0 H280 L240 100 H160Z" fill="#F0A45E" opacity=".28"/>
      <path d="M0 76 C50 66 100 86 150 76 C200 66 250 86 300 76 C350 66 380 82 400 76 V100 H0Z" fill="#13224E"/>`, '', 'preserveAspectRatio="none"')}
      <div class="wd-wave wv1">${svg('0 0 480 20', WAVES('#FFD9A0', 0.45), '', 'preserveAspectRatio="none"')}</div>
      <div class="wd-wave wv2">${svg('0 0 480 20', WAVES('#9DB8F5', 0.4), '', 'preserveAspectRatio="none"')}</div></div>
    <div class="wd-ship">${svg('0 0 120 100', `
      <path d="M58 8 V70" stroke="#0B1430" stroke-width="4"/><path d="M62 12 C92 24 96 50 64 64Z" fill="#F4E6C8"/><path d="M54 18 C32 28 28 50 54 62Z" fill="#E3D2AE"/>
      <path d="M58 8 L74 13 L58 18Z" fill="#C4503C"/>
      <path d="M12 68 H108 L94 92 H26Z" fill="#0B1430"/><path d="M16 74 H104" stroke="#FFC65A" stroke-width="2.5" opacity=".8"/>
      <circle cx="40" cy="82" r="3" fill="#FFD27A"/><circle cx="60" cy="82" r="3" fill="#FFD27A"/><circle cx="80" cy="82" r="3" fill="#FFD27A"/>`)}</div>
    <div class="wd-ground">${svg('0 0 400 120', `
      <rect y="44" width="400" height="76" fill="#6B4E34"/>
      <path d="M0 44 H400 M0 68 H400 M0 94 H400" stroke="#3E2B1C" stroke-width="3"/>
      <path d="M60 44 V68 M190 44 V68 M320 44 V68 M120 68 V94 M260 68 V94 M380 68 V94 M40 94 V120 M200 94 V120 M330 94 V120" stroke="#3E2B1C" stroke-width="2.5"/>
      <rect y="40" width="400" height="7" fill="#8A6844"/>
      <g fill="#2A1C12"><rect x="26" y="10" width="7" height="36"/><rect x="366" y="10" width="7" height="36"/><rect x="196" y="18" width="6" height="28"/></g>
      <g class="wd-lamps"><circle cx="29.5" cy="8" r="7" fill="#FFD27A"/><circle cx="369.5" cy="8" r="7" fill="#FFD27A"/><circle cx="199" cy="16" r="5.5" fill="#FFC65A"/></g>
      <g fill="#FFD27A" opacity=".22"><circle cx="29.5" cy="8" r="17"/><circle cx="369.5" cy="8" r="17"/><circle cx="199" cy="16" r="13"/></g>`, '', 'preserveAspectRatio="none"')}</div>`,

  // v15 · Туманні Острови
  w4b: () => `
    <div class="wd-whale"><div class="wd-whale-b">${svg('0 0 200 70', `
      <path d="M6 40 C18 22 58 13 98 16 C138 19 160 31 170 38 C176 31 184 22 196 19 C191 30 189 37 194 48 C184 46 177 44 170 43 C150 56 110 62 70 58 C40 55 14 52 6 40Z" fill="#3E5266"/><path d="M14 46 C40 54 90 56 130 50" fill="none" stroke="#7E95A8" stroke-width="3" stroke-linecap="round" opacity=".6"/><path d="M64 50 C70 60 84 66 96 64 C88 58 80 54 74 50Z" fill="#33465A"/><circle cx="28" cy="37" r="2.4" fill="#DDE4EC"/><path d="M40 14 C40 6 34 2 30 4 M40 14 C42 6 48 3 52 6" fill="none" stroke="#EEF2F8" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`)}</div></div>
    <div class="wd-ruin">${svg('0 0 120 150', `
      <path d="M2 150 C8 124 24 112 60 112 C96 112 112 124 118 150Z" fill="#4A5668"/><path d="M16 150 C22 132 36 124 54 126 L58 150Z" fill="#5E6B7E"/>
      <path d="M22 116 V46 C22 18 40 6 60 6 C80 6 98 18 98 46 V116 H80 V50 C80 36 72 26 60 26 C48 26 40 36 40 50 V116Z" fill="#A4AEBE"/>
      <path d="M22 46 C22 18 40 6 60 6 C80 6 98 18 98 46 H80 C80 36 72 26 60 26 C48 26 40 36 40 50Z" fill="#C2CAD6"/>
      <path d="M52 7 L56 26 M68 7 L64 26 M26 30 L42 38 M94 30 L78 38" stroke="#7C889A" stroke-width="2"/>
      <path d="M22 70 H40 M80 84 H98 M22 96 H40" stroke="#7C889A" stroke-width="2"/>
      <path d="M86 6 L94 2 L100 12 L92 16Z" fill="#8E9AAC"/><path d="M28 112 C30 100 34 96 38 98 M84 112 C84 104 90 100 94 104" fill="none" stroke="#5E8A78" stroke-width="3" stroke-linecap="round"/>
      <path d="M104 116 V78 H116 V116Z" fill="#8E9AAC"/><path d="M102 78 H118 V72 H102Z" fill="#A4AEBE"/>`)}</div>
    <div class="wd-sail">${svg('0 0 60 60', `
      <path d="M30 4 V44" stroke="#3A4658" stroke-width="2.4"/><path d="M32 6 C46 18 50 32 50 40 H32Z" fill="#EEF2F8"/><path d="M28 12 C20 22 16 32 16 40 H28Z" fill="#D7CCF4"/>
      <path d="M8 44 H54 L46 54 H16Z" fill="#5A6678"/><path d="M30 4 L40 7 L30 10Z" fill="#8FE0D6"/>`)}</div>
    <div class="wd-jelly">${[[12, 40], [27, 30], [46, 44], [63, 34], [80, 42], [91, 30]].map(([x, y], i) => `<i style="left:${x}%;top:${y}%;animation-delay:${-i * 1.3}s"></i>`).join('')}</div>
    <div class="wd-sea">${svg('0 0 400 100', `
      <rect width="400" height="100" fill="#4F7A88"/><rect width="400" height="34" fill="#7FA6B0"/>
      <path d="M0 78 C60 70 120 86 200 78 C280 70 340 86 400 78 V100 H0Z" fill="#3D6070"/>`, '', 'preserveAspectRatio="none"')}
      <div class="wd-wave wv1">${svg('0 0 480 20', WAVES('#E8F2F6', 0.45), '', 'preserveAspectRatio="none"')}</div>
      <div class="wd-wave wv2">${svg('0 0 480 20', WAVES('#C9BCEB', 0.4), '', 'preserveAspectRatio="none"')}</div></div>
    <div class="wd-isle i1">${svg('0 0 140 110', `
      <path d="M4 110 C10 84 24 70 40 66 L58 50 C70 46 84 54 94 64 C112 68 128 86 136 110Z" fill="#5A6678"/>
      <path d="M40 66 L58 50 C66 47 74 50 80 55 L66 74Z" fill="#7C889A"/>
      <g fill="#B4BDCA"><path d="M50 52 V20 H58 V52Z"/><path d="M48 20 H60 V15 H48Z"/><path d="M66 52 V30 L70 26 L74 31 V52Z"/><path d="M48 18 H76 V12 H48Z" opacity=".9"/><path d="M86 64 V44 H93 V64Z"/></g><path d="M50 30 H58 M50 40 H58 M66 40 H74" stroke="#7C889A" stroke-width="1.6"/>`)}</div>
    <div class="wd-isle i2">${svg('0 0 140 110', `
      <path d="M8 110 C16 88 30 78 48 76 C60 62 82 60 96 74 C114 78 128 92 134 110Z" fill="#6A7688"/>
      <g fill="#3A5456"><path d="M58 70 L65 40 L72 70Z"/><path d="M80 72 L86 50 L92 72Z"/></g>`)}</div>
    <div class="wd-fog f1"></div><div class="wd-fog f2"></div><div class="wd-fog f3"></div>
    <div class="wd-ground">${svg('0 0 400 120', `
      <path d="M0 50 C60 36 120 46 200 40 C280 34 340 46 400 38 V120 H0Z" fill="#6E7A8C"/>
      <path d="M0 64 C80 54 160 62 240 56 C310 50 360 58 400 54 V120 H0Z" fill="#525E70"/>
      <g fill="#8E9AAC"><ellipse cx="60" cy="58" rx="18" ry="6"/><ellipse cx="210" cy="50" rx="14" ry="5"/><ellipse cx="330" cy="54" rx="20" ry="6"/></g>
      <g fill="#2F4A4C"><path d="M24 50 L32 16 L40 50Z"/><path d="M362 46 L370 14 L378 46Z"/><path d="M380 50 L386 28 L392 50Z"/></g>`, '', 'preserveAspectRatio="none"')}</div>`,

  w1: () => `
    <div class="wd-sun">${svg('-100 -100 200 200', `
      <g class="wd-rays">${Array.from({ length: 12 }, (_, i) => `<rect x="-7" y="-96" width="14" height="34" rx="7" transform="rotate(${i * 30})"/>`).join('')}</g>
      <circle r="52" fill="#FFC95C"/>`)}<i class="wd-sun-core"></i></div>
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
    <div class="wd-moon">${svg('0 0 100 100', '<path d="M79.26 70.38 A38 38 0 1 1 41.82 14.24 A34 34 0 0 0 79.26 70.38Z" fill="#FFE6A0"/>')}</div>
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
  if (CB_ART[key]) return svg('-60 -60 120 120', CB_ART[key].medal(t, ink), 'wf'); // v19 c6–c10
  switch (key) {
    case 'c1': // v19 · королівсько-синє кільце з червоно-білим кантом і годинником
      return svg('-60 -60 120 120', `
        <circle r="54" fill="#2B4C8C" stroke="${ink}" stroke-width="3"/><circle r="49" fill="none" stroke="#FFFFFF" stroke-width="3"/>
        <circle r="46" fill="#D7263D" stroke="${ink}" stroke-width="2"/>
        <g transform="translate(37 37)"><circle r="11" fill="#FFF3C8" stroke="${ink}" stroke-width="2.4"/><path d="M0 0 V-7 M0 0 L5 2" stroke="${ink}" stroke-width="2" stroke-linecap="round"/></g>`, 'wf');
    case 'c2': // v19 · синє кільце з білими зірками й червоним кантом
      return svg('-60 -60 120 120', `
        <circle r="54" fill="#C8323C" stroke="${ink}" stroke-width="3"/><circle r="50" fill="#2D5DA8" stroke="${ink}" stroke-width="2"/>
        ${Array.from({ length: 10 }, (_, i) => { const a = (i * Math.PI) / 5; return `<path transform="translate(${(Math.cos(a) * 48).toFixed(1)} ${(Math.sin(a) * 48).toFixed(1)})" d="M0 -4.5 L1.3 -1.4 L4.5 -1.4 L1.9 .6 L2.8 3.8 L0 1.9 L-2.8 3.8 L-1.9 .6 L-4.5 -1.4 L-1.3 -1.4Z" fill="#fff"/>`; }).join('')}
        <circle r="44" fill="#FFF8EA" stroke="${ink}" stroke-width="2"/>`, 'wf');
    case 'c3': // v19 · кіноварне кільце з квітами сакури
      return svg('-60 -60 120 120', `
        <circle r="53" fill="#E0452B" stroke="${ink}" stroke-width="3"/><circle r="45" fill="#FFF6F8" stroke="${ink}" stroke-width="2"/>
        ${Array.from({ length: 6 }, (_, i) => { const a = (i * Math.PI) / 3 + 0.5; return `<g transform="translate(${(Math.cos(a) * 49).toFixed(1)} ${(Math.sin(a) * 49).toFixed(1)})">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="0" cy="-4.4" rx="3.2" ry="4.6" fill="#FFB7CC" stroke="${ink}" stroke-width="1" transform="rotate(${r})"/>`).join('')}<circle r="1.8" fill="#E0452B"/></g>`; }).join('')}`, 'wf');
    case 'c4': // v19 · лавандовий вінок із золотою ниткою
      return svg('-60 -60 120 120', `
        <circle r="52" fill="#EDE4FF" stroke="${ink}" stroke-width="3"/>
        ${Array.from({ length: 16 }, (_, i) => `<g transform="rotate(${i * 22.5}) translate(0 -50)"><ellipse rx="3" ry="7" fill="${i % 2 ? '#A88BD8' : '#8C6FD6'}" stroke="${ink}" stroke-width="1.6"/></g>`).join('')}
        <circle r="44" fill="none" stroke="#E8B04A" stroke-width="2.5"/>`, 'wf');
    case 'c5': // v19 · теракотове кільце з оливковим вінком
      return svg('-60 -60 120 120', `
        <circle r="53" fill="#D9663B" stroke="${ink}" stroke-width="3"/><circle r="45" fill="#FFF5E8" stroke="${ink}" stroke-width="2"/>
        ${Array.from({ length: 12 }, (_, i) => `<g transform="rotate(${i * 30 + 15}) translate(0 -49)"><ellipse rx="3" ry="6.5" transform="rotate(35)" fill="#8FAE4E" stroke="${ink}" stroke-width="1.4"/>${i % 3 ? '' : '<circle cx="4" cy="2" r="2.2" fill="#3F4A2A"/>'}</g>`).join('')}`, 'wf');
    case 'w1b': // рятувальний круг: біло-коралові сегменти і мушля
      return svg('-60 -60 120 120', `
        <circle r="52" fill="#FFFDF4" stroke="${ink}" stroke-width="3"/>
        ${[0, 90, 180, 270].map((r) => `<path transform="rotate(${r + 22})" d="M0 -52 A52 52 0 0 1 36.8 -36.8 L31.1 -31.1 A44 44 0 0 0 0 -44Z" fill="${t.accent}" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>`).join('')}
        <circle r="44" fill="none" stroke="${ink}" stroke-width="2"/>
        <g transform="translate(36 38)"><path d="M-11 6 C-11 -11 11 -11 11 6Z" fill="#FFE3C9" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/><path d="M0 6 V-5 M-5 6 L-6 -3 M5 6 L6 -3" stroke="${ink}" stroke-width="1.6" fill="none"/></g>`, 'wf');
    case 'w1c': // восковий шестикутник-сота з медовими комірками і бджілкою
      return svg('-60 -60 120 120', `
        <polygon points="${HEXP(0, 0, 56)}" fill="${t.accent}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
        <circle r="45" fill="#FFE7A3" stroke="${ink}" stroke-width="2.5"/>
        ${Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 180) * (60 * i - 90); return `<polygon points="${HEXP(Math.cos(a) * 49, Math.sin(a) * 49, 7)}" fill="${i % 2 ? '#FFD866' : '#E59A12'}" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>`; }).join('')}
        <g transform="translate(38 36)">${BEE}</g>`, 'wf');
    case 'w2b': // вінок із колосків і маленькі лопаті вітряка
      return svg('-60 -60 120 120', `
        <circle r="50" fill="#8CCBF7" stroke="${ink}" stroke-width="3"/>
        ${Array.from({ length: 14 }, (_, i) => `<g transform="rotate(${i * 25.7 + 12}) translate(0 -51)"><ellipse rx="4.2" ry="8.5" transform="rotate(28)" fill="${i % 2 ? '#F2B93B' : '#FFD96A'}" stroke="${ink}" stroke-width="2"/></g>`).join('')}
        <g transform="translate(36 38)">${[0, 90, 180, 270].map((r) => `<path transform="rotate(${r + 20})" d="M0 0 L3 -13 H-3Z" fill="#FFFBEA" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>`).join('')}<circle r="3" fill="#C4503C" stroke="${ink}" stroke-width="1.6"/></g>`, 'wf');
    case 'w3b': // латунний ілюмінатор із заклепками й ліхтариком
      return svg('-60 -60 120 120', `
        <circle r="54" fill="#C9903C" stroke="${ink}" stroke-width="3"/>
        <circle r="46" fill="#27407A" stroke="${ink}" stroke-width="2.5"/>
        ${Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4 + 0.39; return `<circle cx="${(Math.cos(a) * 50).toFixed(1)}" cy="${(Math.sin(a) * 50).toFixed(1)}" r="2.6" fill="#FFE1A0" stroke="${ink}" stroke-width="1.2"/>`; }).join('')}
        <g transform="translate(37 38)"><circle r="12" fill="#FFC65A" opacity=".35"/><rect x="-5" y="-7" width="10" height="13" rx="2" fill="#FFD27A" stroke="${ink}" stroke-width="2"/><path d="M-6 -7 L0 -13 L6 -7Z M-6 6 H6" fill="#16224A" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/></g>`, 'wf');
    case 'w4b': // срібне кільце туману з бірюзовими перлинами й китом над хвилею
      return svg('-60 -60 120 120', `
        <circle r="54" fill="#C9D1DE" stroke="${ink}" stroke-width="3"/>
        <circle r="46" fill="#7D90A6" stroke="${ink}" stroke-width="2.5"/>
        <path d="M-46 8 C-24 0 -8 14 10 6 C26 -1 38 8 46 4" fill="none" stroke="#EEF2F8" stroke-width="5" stroke-linecap="round" opacity=".6"/>
        ${Array.from({ length: 10 }, (_, i) => { const a = (i * Math.PI) / 5 + 0.3; return `<circle cx="${(Math.cos(a) * 50).toFixed(1)}" cy="${(Math.sin(a) * 50).toFixed(1)}" r="2.8" fill="${i % 2 ? '#8FE0D6' : '#D7CCF4'}" stroke="${ink}" stroke-width="1.2"/>`; }).join('')}
        <g transform="translate(-26 -22) scale(.26)" stroke="${ink}" stroke-width="7" stroke-linejoin="round"><path d="M6 40 C18 22 58 13 98 16 C138 19 160 31 170 38 C176 31 184 22 196 19 C191 30 189 37 194 48 C184 46 177 44 170 43 C150 56 110 62 70 58 C40 55 14 52 6 40Z" fill="#4E667C"/><path d="M14 46 C40 54 90 56 130 50" fill="none" stroke="#7E95A8" stroke-width="5" stroke-linecap="round" opacity=".6"/><path d="M64 50 C70 60 84 66 96 64 C88 58 80 54 74 50Z" fill="#33465A"/><circle cx="28" cy="37" r="2.4" fill="#DDE4EC"/><path stroke-width="6" d="M40 14 C40 6 34 2 30 4 M40 14 C42 6 48 3 52 6" fill="none" stroke="#EEF2F8" stroke-width="2.4" stroke-linecap="round" opacity=".55"/></g>
        <path d="M-40 22 C-28 14 -16 28 -2 20 C10 13 22 26 40 18" fill="none" stroke="#EEF2F8" stroke-width="5" stroke-linecap="round"/>`, 'wf');
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
  if (CB_ART[key]) return svg('0 0 240 90', CB_ART[key].pedestal(ink), 'pedestal'); // v19 c6–c10
  const P = {
    c1: `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#7E8798" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#AEB6C4" stroke="${ink}" stroke-width="3.5"/>
      <g fill="none" stroke="#8A93A4" stroke-width="2" opacity=".8"><path d="M40 46 H200 M60 38 H180 M60 54 H180"/><path d="M80 38 V46 M120 38 V46 M160 38 V46 M100 46 V54 M140 46 V54"/></g>
      <g stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"><path d="M22 54 V34 C22 28 34 28 34 34 V54Z" fill="#D7263D"/><path d="M200 50 C200 36 222 36 222 50Z" fill="#2B4C8C"/><path d="M211 50 V58" fill="none"/></g>`,
    c2: `<path d="M12 50 L28 76 H212 L228 50Z" fill="#9A6B3E" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
      <ellipse cx="120" cy="48" rx="108" ry="20" fill="#E2B85A" stroke="${ink}" stroke-width="3.5"/>
      <path d="M40 48 H200" stroke="#C99A44" stroke-width="2" stroke-dasharray="10 8"/>
      <g stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"><path d="M20 46 l4.5 -10 l4.5 10Z M210 44 l4 -12 l4 12Z" fill="#C99A44"/><path d="M196 40 L200 31 L204 40 L213 41 L206 47 L208 56 L200 51 L192 56 L194 47 L187 41Z" fill="#FFC23C"/></g>`,
    c3: `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#8DBA6A" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="104" ry="22" fill="#E9E2D6" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="72" ry="13" fill="none" stroke="#C9C2B8" stroke-width="2.5"/>
      <g stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"><rect x="24" y="30" width="12" height="18" fill="#C9C2B8"/><path d="M18 30 L30 20 L42 30Z" fill="#8A8496"/>
      <g transform="translate(206 42)">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="0" cy="-5" rx="4" ry="6" fill="#FFB7CC" transform="rotate(${r})"/>`).join('')}<circle r="2.4" fill="#E0452B"/></g></g>`,
    c4: `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#8C6FD6" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#F6E9D6" stroke="${ink}" stroke-width="3.5"/>
      <g fill="#EDE4FF" stroke="#C9B6FF" stroke-width="1.6">${[60, 96, 132, 168].map((x) => `<path d="M${x} 46 l9 -6 l9 6 l-9 6Z"/>`).join('')}</g>
      <g stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"><path d="M18 48 C22 38 40 36 46 46 C38 52 26 54 18 48Z" fill="#E8A85A"/><path d="M200 34 V54 M192 54 H208" fill="none"/><circle cx="200" cy="32" r="7" fill="#FFE7A0"/></g>`,
    c5: `<path d="M12 56 C12 32 228 32 228 56 C228 78 12 78 12 56Z" fill="#B85A34" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="106" ry="22" fill="#F2DEC0" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="60" ry="11" fill="#7FCBD0" stroke="#2E9AA6" stroke-width="2.5"/>
      <g stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"><path d="M26 50 C20 34 26 12 32 4 C38 12 44 34 38 50Z" fill="#3F6B3A"/><circle cx="208" cy="44" r="9" fill="#F2C46A"/><path d="M208 44 L214 38 M208 44 L201 40" stroke="#D9663B"/></g>`,
    w1b: `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#E2BF80" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#F6DDA3" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="96" cy="38" rx="44" ry="7" fill="#fff" opacity=".45"/>
      <g stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"><path d="M24 54 C24 40 44 40 44 54Z" fill="#FFB7A0"/><path d="M204 38 L207 45 L215 45.500 L209 50.500 L211 58 L204 54 L197 58 L199 50.500 L193 45.500 L201 45Z" fill="#FF8E6B"/><circle cx="178" cy="34" r="4" fill="#fff"/></g>`,
    w1c: `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#E59A12" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#FFD866" stroke="${ink}" stroke-width="3.5"/>
      <g fill="none" stroke="#E59A12" stroke-width="2.2" opacity=".75">${[[60, 44], [86, 52], [112, 42], [140, 52], [166, 44], [188, 50]].map(([x, y]) => `<polygon points="${HEXP(x, y, 8)}"/>`).join('')}</g>
      <ellipse cx="96" cy="38" rx="44" ry="6" fill="#fff" opacity=".4"/>
      <g stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"><path d="M22 58 C22 46 30 40 36 40 C42 40 50 46 50 58Z" fill="#F2A818"/><path d="M28 44 H44" fill="none"/>
      <g transform="translate(208 40)">${Array.from({ length: 8 }, (_, i) => `<ellipse cx="0" cy="-8" rx="3.2" ry="6" fill="#FFC21A" transform="rotate(${i * 45})"/>`).join('')}<circle r="5" fill="#7A4A1E"/></g></g>`,
    w2b: `<path d="M12 56 C12 30 228 30 228 56 C228 78 12 78 12 56Z" fill="#DDB046" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="106" ry="22" fill="#F5DC84" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="96" cy="39" rx="44" ry="6" fill="#fff" opacity=".4"/>
      <g stroke="${ink}" stroke-width="2.2" stroke-linecap="round"><path d="M30 56 V40 M40 58 V42 M200 56 V40 M210 58 V44" fill="none"/><g fill="#F2B93B"><ellipse cx="30" cy="36" rx="3.4" ry="6.5"/><ellipse cx="40" cy="38" rx="3.4" ry="6.5"/><ellipse cx="200" cy="36" rx="3.4" ry="6.5"/><ellipse cx="210" cy="40" rx="3.4" ry="6.5"/></g></g>`,
    w3b: `<path d="M34 60 V88 M206 60 V88 M120 62 V88" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>
      <path d="M16 36 H224 L212 66 H28Z" fill="#8A6844" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M16 36 H224 L220 46 H20Z" fill="#B58C5E" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M70 46 L74 66 M120 46 V66 M170 46 L166 66" stroke="${ink}" stroke-width="2" opacity=".55"/>
      <g fill="#FFD27A" stroke="${ink}" stroke-width="2"><circle cx="34" cy="30" r="6"/><circle cx="206" cy="30" r="6"/></g>`,
    w4b: `<path d="M10 62 C14 44 36 34 64 36 C90 26 150 26 176 36 C206 34 228 46 230 62 C226 80 14 80 10 62Z" fill="#6E7A8C" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M22 50 C40 38 80 36 120 40 C160 36 200 38 218 50 C200 58 40 58 22 50Z" fill="#AEB8C8" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M4 68 C40 60 80 72 120 66 C160 60 200 72 236 66" fill="none" stroke="#EEF2F8" stroke-width="6" stroke-linecap="round" opacity=".7"/>
      <g fill="#2F4A4C" stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M26 44 L33 18 L40 44Z"/><path d="M200 44 L207 20 L214 44Z"/></g>`,
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
  if (CB_ART[key]) return svg('0 0 48 48', CB_ART[key].emblem(ink), 'emblem'); // v19 c6–c10
  const E = {
    c1: `<rect x="17" y="18" width="14" height="26" fill="#4A5878" stroke="${ink}" stroke-width="2.2"/><rect x="15" y="10" width="18" height="10" fill="#4A5878" stroke="${ink}" stroke-width="2.2"/><circle cx="24" cy="15" r="3.6" fill="#FFF3C8"/><path d="M15 10 L24 2 L33 10Z" fill="#4A5878" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/><rect x="3" y="30" width="12" height="14" rx="2" fill="#D7263D" stroke="${ink}" stroke-width="2"/><rect x="33" y="28" width="12" height="16" rx="2" fill="#D7263D" stroke="${ink}" stroke-width="2"/>`,
    c2: `<path d="M18 44 V18 H22 V10 H26 V18 H30 V44Z" fill="#4F6798" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/><rect x="23.5" y="2" width="1.6" height="9" fill="${ink}"/><rect x="4" y="26" width="12" height="18" fill="#9DB3DA" stroke="${ink}" stroke-width="2"/><rect x="32" y="22" width="12" height="22" fill="#9DB3DA" stroke="${ink}" stroke-width="2"/><path d="M38 6 L39.6 10 L44 10 L40.5 12.6 L41.8 17 L38 14.4 L34.2 17 L35.5 12.6 L32 10 L36.4 10Z" fill="#FFC23C" stroke="${ink}" stroke-width="1.4"/>`,
    c3: `<circle cx="34" cy="13" r="9" fill="#E8463A"/><path d="M2 44 L18 18 C20 15 24 15 26 18 L42 44Z" fill="#9AA6D8" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/><path d="M14 25 L18 18 C20 15 24 15 26 18 L30 25 L26 23 L22 27 L18 23Z" fill="#fff"/><g transform="translate(9 34)">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="0" cy="-3.6" rx="2.6" ry="3.8" fill="#FFB7CC" stroke="${ink}" stroke-width="1" transform="rotate(${r})"/>`).join('')}</g>`,
    c4: `<path d="M10 44 C17 34 21 24 23 10 L24 3 L25 10 C27 24 31 34 38 44 H32 C29 38 26 36 24 36 C22 36 19 38 16 44Z" fill="#5C5470" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/><path d="M17 30 H31 M20 20 H28" stroke="${ink}" stroke-width="2"/><path d="M36 14 C30 8 30 2 36 2 C42 2 42 8 36 14Z" fill="#A88BD8" stroke="${ink}" stroke-width="1.6"/>`,
    c5: `<path d="M4 30 V18 C16 12 32 12 44 18 V30Z" fill="#E2B07A" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/><g fill="#A86A3E">${[8, 16, 24, 32].map((x) => `<path d="M${x} 28 V22 Q${x + 3} 18 ${x + 6} 22 V28Z"/>`).join('')}</g><path d="M2 38 C14 46 34 46 46 38 C47 35 47 32 46 30 C44 36 40 38 36 38 H8 C5 37 3 35 2 33Z" fill="#1F1A24" stroke="${ink}" stroke-width="1.6"/><path d="M2 44 q5 -3 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#2E9AA6" stroke-width="2.4" stroke-linecap="round"/>`,
    w1b: `<circle cx="34" cy="12" r="7" fill="#FFD25A" stroke="${ink}" stroke-width="2.2"/><path d="M22 40 C20 30 21 22 25 15" stroke="${ink}" stroke-width="5.5" fill="none" stroke-linecap="round"/><path d="M22 40 C20 30 21 22 25 15" stroke="#B98A54" stroke-width="2.6" fill="none" stroke-linecap="round"/><g fill="#3FB99A" stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M25 15 C16 6 8 8 4 14 C12 12 18 13 25 15Z"/><path d="M25 15 C32 7 40 10 43 18 C36 14 31 14 25 15Z"/><path d="M25 15 C22 7 15 3 9 4 C16 7 21 10 25 15Z"/></g><path d="M3 41 q5.500 -5 10.500 0 t10.500 0 t10.500 0 t10.500 0 V46 H3Z" fill="#55CFDA" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>`,
    w1c: `<polygon points="${HEXP(24, 26, 19)}" fill="#FFD866" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><polygon points="${HEXP(24, 26, 11)}" fill="#F2A818" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/><path d="M24 18 C28 24 30 27 30 30 C30 34 27 36 24 36 C21 36 18 34 18 30 C18 27 20 24 24 18Z" fill="#FFE7A3" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/><g transform="translate(38 9) scale(.7)">${BEE}</g>`,
    w2b: `<path d="M17 44 L20 20 H28 L31 44Z" fill="#FBF3DE" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M18 21 L24 13 L30 21Z" fill="#C4503C" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/><g transform="translate(24 20) rotate(24)">${[0, 90, 180, 270].map((r) => `<path transform="rotate(${r})" d="M0 0 V-18 H6 V-5Z" fill="#FFE68A" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`).join('')}<circle r="2.6" fill="${ink}"/></g>`,
    w3b: `<path d="M8 20 L24 12 L40 20" fill="none" stroke="#FFE1A0" stroke-width="2.5" stroke-linecap="round" opacity=".9"/><path d="M17 44 L20 20 H28 L31 44Z" fill="#FBF3DE" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M19 29 H29 L30 37 H18Z" fill="#C4503C" stroke="${ink}" stroke-width="2"/><rect x="19" y="11" width="10" height="9" fill="#FFC65A" stroke="${ink}" stroke-width="2.2"/><path d="M17 11 L24 4 L31 11Z" fill="#27407A" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/><path d="M4 44 q5 -4 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#6FA8FF" stroke-width="2.5" stroke-linecap="round"/>`,
    w4b: `<path d="M4 26 C8 18 20 14 30 15 C38 16 42 20 44 23 C45 19 47 16 50 15 C49 19 48 22 50 26 C47 26 45 25 44 25 C40 31 30 34 20 33 C12 32 6 30 4 26Z" transform="translate(-3 2)" fill="#4E667C" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/><circle cx="8" cy="26" r="1.4" fill="#fff"/><path d="M2 38 C12 33 20 41 30 37 C38 34 42 39 46 37 M6 44 C16 40 26 46 42 42" fill="none" stroke="#DCE3EE" stroke-width="3" stroke-linecap="round"/><circle cx="40" cy="8" r="3" fill="#D7CCF4"/>`,
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
  if (CB_ART[key]) return CB_ART[key].props(); // v19 c6–c10
  const P = {
    c1: [
      svg('0 0 30 70', C_BOX),
      svg('0 0 50 70', '<path d="M25 70 V30" stroke="#2B2F45" stroke-width="3"/><path d="M4 32 C4 8 46 8 46 32 Q41 28 36 32 Q31 28 25 32 Q20 28 14 32 Q9 28 4 32Z" fill="#2B2F45"/><path d="M25 70 Q25 76 20 74" fill="none" stroke="#2B2F45" stroke-width="3"/>'),
      svg('0 0 60 70', '<path d="M30 70 V40" stroke="#5E4329" stroke-width="5"/><circle cx="30" cy="26" r="22" fill="#6E9E5A"/><circle cx="22" cy="18" r="9" fill="#8DB878"/>'),
    ],
    c2: [
      svg('0 0 110 56', C_TAXI),
      svg('0 0 60 140', C_PUMP),
      svg('0 0 50 50', '<path d="M25 2 L31 18 L48 18 L34 28 L39 46 L25 35 L11 46 L16 28 L2 18 L19 18Z" fill="#FFC23C"/>'),
    ],
    c3: [
      svg('0 0 120 120', C_SAKURA()),
      svg('0 0 40 70', '<path d="M20 0 V8" stroke="#2B2A4C" stroke-width="2"/><rect x="8" y="8" width="24" height="4" rx="2" fill="#2B2A4C"/><path d="M6 14 C6 10 34 10 34 14 V46 C34 50 6 50 6 46Z" fill="#E0452B"/><path d="M6 22 H34 M6 30 H34 M6 38 H34" stroke="#B5301E" stroke-width="1.6"/><rect x="8" y="48" width="24" height="4" rx="2" fill="#2B2A4C"/><circle cx="20" cy="30" r="22" fill="#FFB03A" opacity=".18"/>'),
      svg('0 0 90 80', C_TORII()),
    ],
    c4: [
      svg('0 0 60 80', C_BALLOON),
      svg('0 0 60 60', '<path d="M30 60 V20" stroke="#6E9E5A" stroke-width="3"/>' + [0, 1, 2, 3, 4].map((i) => `<ellipse cx="${30 + (i % 2 ? 5 : -5)}" cy="${10 + i * 6}" rx="4" ry="5" fill="#A88BD8"/>`).join('')),
      svg('0 0 70 40', '<path d="M4 30 C10 10 30 4 35 4 C40 4 60 10 66 30 C56 36 44 26 35 26 C26 26 14 36 4 30Z" fill="#E8A85A"/><path d="M20 14 L24 28 M35 8 V26 M50 14 L46 28" stroke="#C07A2A" stroke-width="2.5"/>'),
    ],
    c5: [
      svg('0 0 30 104', C_CYPRESS()),
      svg('0 -14 120 56', C_GONDOLA),
      svg('0 0 60 60', '<circle cx="30" cy="30" r="27" fill="#F2C46A"/><circle cx="30" cy="30" r="22" fill="#E8634A"/><g fill="#FFF4D6"><circle cx="22" cy="22" r="5"/><circle cx="38" cy="26" r="5"/><circle cx="28" cy="40" r="5"/></g><g fill="#3F8A3A"><ellipse cx="34" cy="16" rx="3" ry="2"/><ellipse cx="18" cy="34" rx="3" ry="2"/><ellipse cx="42" cy="40" rx="3" ry="2"/></g>'),
    ],
    w1b: [
      svg('0 0 70 50', '<path d="M6 44 C6 8 64 8 64 44Z" fill="#FFB7A0"/><path d="M35 44 V16 M22 44 L16 22 M48 44 L54 22" stroke="#F08A70" stroke-width="3" fill="none" stroke-linecap="round"/>'),
      svg('0 0 60 60', '<path d="M30 4 L37 22 L56 23 L41 35 L46 54 L30 43 L14 54 L19 35 L4 23 L23 22Z" fill="#FF8E6B"/><circle cx="30" cy="30" r="4" fill="#FFD9C4"/>'),
      svg('0 0 80 60', '<path d="M40 58 V26" stroke="#B98A54" stroke-width="4"/><path d="M6 28 C6 -2 74 -2 74 28Z" fill="#FF8E6B"/><path d="M28 28 C28 6 34 2 40 2 C46 2 52 6 52 28Z" fill="#FFFDF4"/>'),
    ],
    w1c: [
      svg('0 0 60 140', SUNF),
      svg('0 0 70 60', '<path d="M12 22 H58 C62 34 60 50 50 56 H20 C10 50 8 34 12 22Z" fill="#E59A12"/><path d="M8 16 H62 V24 H8Z" fill="#C98A1A"/><path d="M14 10 C22 2 48 2 56 10 V16 H14Z" fill="#F2A818"/><path d="M30 24 C30 34 26 36 26 40 C26 44 32 44 32 40 C32 36 30 34 30 24Z" fill="#FFD866"/>'),
      svg('0 0 140 120', COMB(), '', 'opacity=".9"'),
    ],
    w2b: [
      svg('0 0 60 70', '<g stroke="#C99A30" stroke-width="3" stroke-linecap="round" fill="none"><path d="M18 70 C18 50 16 40 14 28 M30 70 V22 M42 70 C42 50 44 40 46 28"/></g><g fill="#F2B93B"><ellipse cx="13" cy="18" rx="5" ry="11"/><ellipse cx="30" cy="12" rx="5" ry="11"/><ellipse cx="47" cy="18" rx="5" ry="11"/></g>'),
      svg('0 0 80 56', '<ellipse cx="40" cy="34" rx="36" ry="21" fill="#EBC65A"/><ellipse cx="40" cy="34" rx="24" ry="13" fill="none" stroke="#C99A30" stroke-width="3"/><ellipse cx="40" cy="34" rx="10" ry="5" fill="none" stroke="#C99A30" stroke-width="3"/>'),
      svg('0 0 50 60', '<path d="M25 60 V28" stroke="#6FA84A" stroke-width="4"/><g fill="#E0566B"><circle cx="25" cy="12" r="9"/><circle cx="35" cy="22" r="9"/><circle cx="15" cy="22" r="9"/><circle cx="25" cy="28" r="9"/></g><circle cx="25" cy="21" r="5" fill="#3A2C14"/>'),
    ],
    w3b: [
      svg('0 0 50 80', '<circle cx="25" cy="22" r="20" fill="#FFC65A" opacity=".25"/><rect x="22" y="34" width="6" height="46" fill="#1A2550"/><rect x="16" y="12" width="18" height="22" rx="3" fill="#FFD27A"/><path d="M13 12 L25 2 L37 12Z M14 34 H36" fill="#1A2550" stroke="#1A2550" stroke-width="3" stroke-linejoin="round"/>'),
      svg('0 0 70 60', '<path d="M35 4 V46 M20 16 H50" stroke="#B9C6E8" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="35" cy="6" r="5" fill="none" stroke="#B9C6E8" stroke-width="4"/><path d="M8 34 C12 56 58 56 62 34" fill="none" stroke="#B9C6E8" stroke-width="6" stroke-linecap="round"/>'),
      svg('0 0 70 56', '<ellipse cx="35" cy="14" rx="26" ry="9" fill="#B58C5E"/><path d="M9 14 V42 C9 54 61 54 61 42 V14Z" fill="#8A6844"/><path d="M9 26 C20 34 50 34 61 26 M9 38 C20 46 50 46 61 38" fill="none" stroke="#3E2B1C" stroke-width="3"/>'),
    ],
    w4b: [
      svg('0 0 60 80', '<path d="M2 80 C6 62 16 56 30 56 C44 56 54 62 58 80Z" fill="#6E7A8C"/><path d="M22 58 L30 8 L38 58Z" fill="#2F4A4C"/><path d="M24 40 L30 20 L36 40Z" fill="#3E6062"/>'),
      svg('0 0 60 80', '<path d="M2 80 C6 70 16 66 30 66 C44 66 54 70 58 80Z" fill="#6E7A8C"/><path d="M10 70 V30 C10 14 18 6 30 6 C42 6 50 14 50 30 V70 H40 V32 C40 24 36 18 30 18 C24 18 20 24 20 32 V70Z" fill="#B4BDCA"/><circle cx="30" cy="40" r="3" fill="#BFF0EA" opacity=".8"/>'),
      svg('0 0 90 40', '<path d="M4 26 C14 14 30 18 40 22 C52 10 74 12 86 24 C76 34 18 36 4 26Z" fill="#EEF2F8" opacity=".85"/><path d="M14 30 C30 24 60 26 78 30" fill="none" stroke="#D7CCF4" stroke-width="3" stroke-linecap="round" opacity=".7"/>'),
    ],
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

/** Акцент між «розділами» стежки світу: простий SVG у стилі світу з номером розділу. Без id/градієнтів (iOS-safe). */
export function chapterMark(wid, n) {
  const key = worldKey(wid);
  const ink = WORLD_THEMES[key].ink;
  const num = (x, y, fill = ink) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="15" font-weight="800" fill="${fill}" font-family="inherit">${n}</text>`;
  const st = `stroke="${ink}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;
  if (CB_ART[key]) return svg('0 0 64 64', CB_ART[key].chapter(st, num)); // v19 c6–c10
  switch (key) {
    case 'c1': // v19 · червона телефонна будка з номером у віконці
      return svg('0 0 64 64', `
        <g ${st}><path d="M14 62 V14 C14 4 50 4 50 14 V62Z" fill="#D7263D"/><rect x="20" y="20" width="24" height="26" rx="3" fill="#FFF3C8"/><rect x="18" y="10" width="28" height="6" fill="#2B2B3A"/></g>${num(32, 39)}`);
    case 'c2': // v19 · дорожній щит-покажчик на стовпчику
      return svg('0 0 64 64', `
        <g ${st}><path d="M32 46 V62" fill="none" stroke-width="4.5"/><path d="M10 8 H54 V22 C54 36 44 44 32 48 C20 44 10 36 10 22Z" fill="#2D5DA8"/><path d="M10 8 H54 V16 H10Z" fill="#C8323C"/></g>${num(32, 36, '#fff')}`);
    case 'c3': // v19 · паперовий ліхтар-тьочін
      return svg('0 0 64 64', `
        <circle cx="32" cy="32" r="26" fill="#FFB03A" opacity=".22"/>
        <g ${st}><rect x="20" y="4" width="24" height="6" rx="2" fill="#2B2A4C"/><path d="M14 14 C14 8 50 8 50 14 V48 C50 54 14 54 14 48Z" fill="#E0452B"/><rect x="20" y="54" width="24" height="6" rx="2" fill="#2B2A4C"/></g>
        <circle cx="32" cy="31" r="11" fill="#FFF6F8"/>${num(32, 36)}`);
    case 'c4': // v19 · вивіска кафе з навісом у смужку
      return svg('0 0 64 64', `
        <g ${st}><path d="M32 44 V62" fill="none" stroke-width="4"/><rect x="10" y="18" width="44" height="28" rx="5" fill="#FFF8EE"/>
        <path d="M6 6 H58 L54 18 H10Z" fill="#8C6FD6"/><path d="M19 6 L18 18 M32 6 V18 M45 6 L46 18" fill="none" stroke="#FFF8EE" stroke-width="4"/></g>${num(32, 38)}`);
    case 'c5': // v19 · арка амфітеатру
      return svg('0 0 64 64', `
        <g ${st}><path d="M6 62 V20 C20 12 44 12 58 20 V62 H44 V40 C44 32 38 28 32 28 C26 28 20 32 20 40 V62Z" fill="#E2B07A"/>
        <path d="M6 20 C20 12 44 12 58 20" fill="none" stroke="#A86A3E" stroke-width="3"/></g>
        <circle cx="32" cy="22" r="9" fill="#FFF5E8"/>${num(32, 27)}`);
    case 'w1b': // рятувальна вежа з прапорцем
      return svg('0 0 64 64', `
        <g ${st}><path d="M14 60 L20 34 M50 60 L44 34 M17 48 H47" fill="none" stroke-width="3.5"/>
        <rect x="12" y="14" width="40" height="22" rx="4" fill="#FFFDF4"/><path d="M8 16 L32 3 L56 16Z" fill="#FF8E6B"/></g>${num(32, 31)}`);
    case 'w1c': // вулик-орієнтир (солом'яний «скеп») із номером
      return svg('0 0 64 64', `
        <g ${st}><path d="M6 60 C4 38 14 12 32 8 C50 12 60 38 58 60Z" fill="#FFC94A"/>
        <path d="M14 26 C26 22 38 22 50 26 M9 42 C24 38 40 38 55 42" fill="none" stroke="#E59A12" stroke-width="3"/>
        <path d="M26 60 V54 C26 48 38 48 38 54 V60Z" fill="#6B3F18"/></g>
        <g transform="translate(52 10) scale(.62)">${BEE}</g>${num(32, 36)}`);
    case 'w2b': // покажчик-вітрячок
      return svg('0 0 64 64', `
        <g ${st}><path d="M32 62 V30" fill="none" stroke-width="4.5"/>
        ${[0, 90, 180, 270].map((r) => `<path transform="rotate(${r + 18} 32 24)" d="M32 24 V2 H42 V18Z" fill="${r % 180 ? '#8CCBF7' : '#FFE68A'}"/>`).join('')}
        <circle cx="32" cy="24" r="11" fill="#FFFBEA"/></g>${num(32, 29)}`);
    case 'w3b': // причальний ліхтар-буй
      return svg('0 0 64 64', `
        <circle cx="32" cy="24" r="22" fill="#FFC65A" opacity=".28"/>
        <g ${st}><path d="M32 44 V60 M22 60 H42" fill="none" stroke-width="4.5"/>
        <rect x="16" y="10" width="32" height="32" rx="6" fill="#FFD27A"/><path d="M12 10 L32 0 L52 10Z" fill="#27407A"/></g>${num(32, 32)}`);
    case 'w4b': // кам'яна арка на острівці в тумані
      return svg('0 0 64 64', `
        <circle cx="32" cy="24" r="20" fill="#BFF0EA" opacity=".25"/>
        <g ${st}><path d="M6 62 C8 52 18 48 32 48 C46 48 56 52 58 62Z" fill="#7C889A"/>
        <path d="M12 50 V22 C12 10 20 4 32 4 C44 4 52 10 52 22 V50 H44 V24 C44 17 39 12 32 12 C25 12 20 17 20 24 V50Z" fill="#C2CAD6"/></g>
        <path d="M27 5 L29 12 M37 5 L35 12" stroke="#7C889A" stroke-width="2"/>${num(32, 34)}`);
    case 'w2': // дерев'яний місток із ліхтариком
      return svg('0 0 64 64', `
        <path d="M6 50 C18 26 46 26 58 50" fill="none" stroke="${ink}" stroke-width="11"/>
        <path d="M6 50 C18 26 46 26 58 50" fill="none" stroke="#B88A5E" stroke-width="6"/>
        <g ${st}><rect x="3" y="30" width="8" height="26" rx="3" fill="#8A6240"/><rect x="53" y="30" width="8" height="26" rx="3" fill="#8A6240"/>
        <circle cx="32" cy="20" r="14" fill="#46D3A0"/></g>${num(32, 25, '#fff')}`);
    case 'w3': // семафор-арка з шестернею
      return svg('0 0 64 64', `
        <g ${st}><path d="M8 60 V26 C8 6 56 6 56 26 V60 H46 V28 C46 18 18 18 18 28 V60Z" fill="#C9864A"/>
        <circle cx="32" cy="14" r="12" fill="#F2C76B"/></g>
        <circle cx="13" cy="44" r="2.2" fill="${ink}"/><circle cx="51" cy="44" r="2.2" fill="${ink}"/>${num(32, 19)}`);
    case 'w4': // крижана арка-кристал
      return svg('0 0 64 64', `
        <g ${st}><path d="M6 60 L10 26 L20 14 L26 30 L24 60Z" fill="#BFF3FF"/><path d="M58 60 L54 26 L44 14 L38 30 L40 60Z" fill="#D9C8FF"/>
        <path d="M32 2 L46 18 L32 34 L18 18Z" fill="#fff"/></g>
        <path d="M32 2 L46 18 L32 34Z" fill="#9FE6FF" opacity=".7"/>${num(32, 23)}`);
    case 'w5': // зоряна брама
      return svg('0 0 64 64', `
        <path d="M10 60 V30 C10 10 54 10 54 30 V60" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>
        <path d="M10 60 V30 C10 10 54 10 54 30 V60" fill="none" stroke="#F5C451" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 9"/>
        <path d="M32 2 L37 13 L49 14 L40 22 L43 34 L32 28 L21 34 L24 22 L15 14 L27 13Z" fill="#FFE07A" ${st}/>${num(32, 24)}`);
    default: // w1: прапорець на галявині
      return svg('0 0 64 64', `
        <g ${st}><ellipse cx="32" cy="56" rx="22" ry="6" fill="#8ED67B"/>
        <path d="M22 56 V8" fill="none" stroke-width="4"/>
        <path d="M22 8 H54 L46 20 L54 32 H22Z" fill="#FFC23D"/></g>
        <circle cx="12" cy="52" r="4" fill="#FF9EB5"/><circle cx="50" cy="53" r="3.5" fill="#fff"/>${num(36, 25)}`);
  }
}

// ═════════════════════════════════════════════════════════ v19 · країни c6–c10 (Дизайн Б)
// Реєстр COUNTRY_ART_B: палітра, сцена фону, рамка, постамент, емблема, декор стежки, акцент розділу.
// Підключено хуками на початку medalFrame/pedestal/emblem/worldProps/chapterMark; тему й сцену — Object.assign нижче.
const MAPLE = 'M0 -20 L4 -11 L9 -14 L8 -5 L16 -8 L13 -1 L19 2 L9 6 L11 12 L2 9 L1 20 L-1 20 L-2 9 L-11 12 L-9 6 L-19 2 L-13 -1 L-16 -8 L-8 -5 L-9 -14 L-4 -11Z';
const ROO = 'M4 64 C14 66 26 62 34 54 C30 42 34 28 46 24 C52 22 55 17 56 11 L57 3 L61 10 L64 4 L65 13 C71 15 75 19 73 23 C69 25 63 25 61 29 C63 36 61 44 57 50 C61 56 65 60 72 62 L72 66 L50 66 C46 62 44 59 42 57 C36 62 22 68 4 66Z';
const SPIRE = (x, y, w, h) => `<path d="M${x - w} 150 V${y} C${x - w} ${y - h * 0.5} ${x - 1} ${y - h * 0.85} ${x} ${y - h} C${x + 1} ${y - h * 0.85} ${x + w} ${y - h * 0.5} ${x + w} ${y} V150Z"/>`;
const BASILICA = (f = '#E3A86B', d = '#B9773E') => `<g fill="${f}">${SPIRE(20, 70, 8, 40)}${SPIRE(38, 56, 8, 48)}${SPIRE(60, 40, 10, 40)}${SPIRE(82, 56, 8, 48)}${SPIRE(100, 70, 8, 40)}
  <path d="M6 104 H114 V150 H6Z"/></g><g fill="${d}" opacity=".7"><path d="M50 150 V124 C50 110 70 110 70 124 V150Z"/>
  ${[20, 38, 60, 82, 100].map((x, i) => `<ellipse cx="${x}" cy="${[78, 66, 52, 66, 78][i]}" rx="2.4" ry="4"/><ellipse cx="${x}" cy="${[92, 84, 72, 84, 92][i]}" rx="2.4" ry="4"/>`).join('')}</g>
  <g fill="#FFC400">${[[20, 30], [38, 8], [60, 0], [82, 8], [100, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y + 2}" r="2.6"/>`).join('')}</g>`;
const SAILS = `<path d="M6 72 H154 V84 H6Z" fill="#E7D5B5"/><g fill="#FFFFFF" stroke="#C9D6DE" stroke-width="1.6" stroke-linejoin="round">
  <path d="M16 72 C22 46 38 28 62 18 C54 38 52 54 56 72Z"/><path d="M48 72 C56 40 76 22 102 12 C90 34 86 52 90 72Z"/>
  <path d="M84 72 C92 48 110 32 132 26 C122 42 120 56 124 72Z"/><path d="M118 72 C124 56 136 46 152 42 C146 52 144 62 146 72Z"/></g>
  <g fill="none" stroke="#C9D6DE" stroke-width="1.2" opacity=".8"><path d="M30 70 C34 52 44 38 58 28 M64 70 C70 46 82 32 98 20 M98 70 C104 52 114 40 128 32"/></g>`;
const LOAF = `<path d="M0 140 C10 108 36 82 70 80 C96 80 110 108 116 140Z" fill="#3E8E5A"/><path d="M98 140 C102 90 122 30 156 18 C186 12 204 70 214 140Z" fill="#5A7E6A"/>
  <path d="M128 60 C136 36 148 24 160 22" fill="none" stroke="#86A894" stroke-width="5" stroke-linecap="round" opacity=".7"/>
  <path d="M30 104 C40 96 54 92 66 94 M140 100 C150 92 170 90 184 96" fill="none" stroke="#2F7448" stroke-width="6" stroke-linecap="round" opacity=".6"/>
  <path d="M70 80 L158 20" stroke="#3A3A3A" stroke-width="1.2"/>
  <g class="wd-gondola"><path d="M84 71 V75" stroke="#3A3A3A" stroke-width="1.4"/><rect x="78" y="75" width="12" height="9" rx="2.5" fill="#FFDF00" stroke="#3A3A3A" stroke-width="1.2"/><rect x="80" y="77" width="8" height="3" fill="#BFE9FF"/></g>`;
const HANOK = (tile = '#2E3550', beam = '#1F9C8A', red = '#C8343B') => `
  <path d="M30 98 V52 M130 98 V52 M58 98 V52 M102 98 V52" stroke="${red}" stroke-width="6"/><path d="M24 98 H136" stroke="#5A4A44" stroke-width="5"/>
  <path d="M26 50 H134 V56 H26Z" fill="${beam}"/><path d="M26 56 H134" stroke="#F2C94C" stroke-width="2" stroke-dasharray="4 3"/>
  <path d="M4 44 C28 48 50 40 80 30 C110 40 132 48 156 44 C142 52 128 54 118 54 H42 C32 54 18 52 4 44Z" fill="${tile}"/>
  <path d="M40 30 C54 30 66 22 80 14 C94 22 106 30 120 30 C110 36 50 36 40 30Z" fill="${tile}"/><path d="M58 30 V40 H102 V30" fill="${beam}"/>
  <path d="M8 44 C30 48 52 41 80 32 C108 41 130 48 152 44" fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity=".35"/>`;
const NTOWER = `<path d="M0 170 C18 142 38 124 60 122 C82 124 102 142 120 170Z" fill="#1E2450"/><path d="M8 170 C26 150 44 138 60 136 C76 138 94 150 112 170Z" fill="#283068"/>
  <rect x="57" y="62" width="6" height="62" fill="#3A4290"/><path d="M60 8 V44" stroke="#9AA4FF" stroke-width="2"/>
  <path d="M48 52 H72 L68 66 H52Z" fill="#4A54B0"/><rect x="47" y="44" width="26" height="9" rx="4" fill="#5E68D0"/>
  <g class="wd-c10-blink"><circle cx="60" cy="8" r="3.2" fill="#FF4FA3"/><path d="M50 48 H70" stroke="#3EE6FF" stroke-width="2.4" stroke-linecap="round"/></g>`;
const SKYLINE = (() => {
  const B = [[0, 70, 26], [24, 46, 22], [44, 80, 18], [60, 30, 26], [84, 58, 20], [102, 40, 24], [124, 72, 18], [140, 24, 30], [168, 54, 22], [188, 36, 26],
    [212, 66, 20], [230, 44, 24], [252, 28, 28], [278, 60, 20], [296, 40, 26], [320, 74, 18], [336, 50, 24], [358, 34, 22], [378, 62, 22]];
  const win = ['#FF4FA3', '#3EE6FF', '#FFE27A', '#B98CFF'];
  let s = '';
  B.forEach(([x, top, w], i) => {
    s += `<rect x="${x}" y="${top}" width="${w}" height="${120 - top}" fill="${i % 2 ? '#22285A' : '#1A1F48'}"/>`;
    for (let y = top + 8; y < 112; y += 12) for (let k = 4; k < w - 4; k += 7) if ((x + y + k) % 5 < 2) s += `<rect x="${x + k}" y="${y}" width="3" height="4" fill="${win[(x + y) % 4]}" opacity=".85"/>`;
  });
  return s + `<rect x="140" y="34" width="30" height="5" fill="#FF4FA3" opacity=".8"/><rect x="252" y="40" width="28" height="4" fill="#3EE6FF" opacity=".8"/>`;
})();
const SUNB = (fill = '#FFC95C', rays = '') => `<div class="wd-sun">${svg('-100 -100 200 200', `
  <g class="wd-rays"${rays}>${Array.from({ length: 12 }, (_, i) => `<rect x="-7" y="-96" width="14" height="34" rx="7" transform="rotate(${i * 30})"/>`).join('')}</g>
  <circle r="52" fill="${fill}"/>`)}<i class="wd-sun-core"></i></div>`;
const BUNTING = (cols) => svg('0 0 400 40', `<path d="M0 6 Q200 26 400 6" fill="none" stroke="#6B4A3A" stroke-width="1.6"/>${Array.from({ length: 16 }, (_, i) => {
  const x = 6 + i * 25, y = 6 + Math.sin((x / 400) * Math.PI) * 10;
  return `<path d="M${x} ${y.toFixed(1)} h16 l-8 14Z" fill="${cols[i % cols.length]}"/>`;
}).join('')}`, '', 'preserveAspectRatio="none"');

const CB_THEMES = {
  // 🇪🇸 Іспанія — сонце-шафран, червоний фієсти, теракота, білі стіни, апельсини
  c6: {
    name: 'fiesta', bg1: '#FFB45A', bg2: '#FFE9C2', bg3: '#E8C27A',
    accent: '#E8323C', accent2: '#FFC400', accentSoft: '#FFE3B0', soft: '#FFF0DC',
    ink: '#4A1E1A', ink2: '#7A4A3A', card: '#FFFBF3', card2: '#FFEBD2',
    glow: 'rgba(255, 170, 80, .7)', on: '#4A1E1A', on2: '#7A4A3A', onDark: '#FFF4E6', on2Dark: '#F2CDB0',
    btn1: '#FFD45A', btn2: '#F2703A', road: '#F3D9B0', roadEdge: '#4A1E1A', roadDone: '#FFC400',
    r: '22px 6px 22px 6px', rBtn: '16px', font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['petal', 'pollen', 'petal'], header: '#FFB45A',
  },
  // 🇨🇦 Канада — кленовий червоний, хвоя, озерна синь, сніг на вершинах
  c7: {
    name: 'maple', bg1: '#9ED2F2', bg2: '#E6F4FB', bg3: '#7BB38A',
    accent: '#D52B1E', accent2: '#2F7D5A', accentSoft: '#FFD9D2', soft: '#E3F2EA',
    ink: '#1E2E3A', ink2: '#4A5E6C', card: '#FFFFFF', card2: '#EEF5F8',
    glow: 'rgba(230, 80, 60, .45)', on: '#1E2E3A', on2: '#4A5E6C', onDark: '#F4FAFF', on2Dark: '#C8DCE8',
    btn1: '#FF8A72', btn2: '#D52B1E', road: '#E8DCC8', roadEdge: '#1E2E3A', roadDone: '#E8473A',
    r: '12px', rBtn: '14px', font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['petal', 'snow', 'petal'], header: '#9ED2F2',
  },
  // 🇦🇺 Австралія — океанська бірюза, пісок, вохра пустелі, евкаліпт
  c8: {
    name: 'outback', bg1: '#5FD3E8', bg2: '#E8FAFF', bg3: '#F2D29A',
    accent: '#F28A2E', accent2: '#1BA6B8', accentSoft: '#FFE2C2', soft: '#DDF6F8',
    ink: '#3A2416', ink2: '#6E5242', card: '#FFFDF6', card2: '#FFF0D8',
    glow: 'rgba(255, 170, 90, .6)', on: '#3A2416', on2: '#6E5242', onDark: '#FFF6EA', on2Dark: '#F2D6B8',
    btn1: '#FFD27A', btn2: '#F28A2E', road: '#F2D29A', roadEdge: '#3A2416', roadDone: '#F2A03A',
    r: '20px 20px 10px 10px', rBtn: '18px', font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['pollen', 'glint', 'pollen'], header: '#5FD3E8',
  },
  // 🇧🇷 Бразилія — тропічна зелень, жовтий, синій, карнавальні конфеті
  c9: {
    name: 'carnival', bg1: '#4FC8E8', bg2: '#FFF6C2', bg3: '#5CC27A',
    accent: '#FFC21A', accent2: '#13A453', accentSoft: '#FFF0A8', soft: '#DDF7E4',
    ink: '#0E2A4A', ink2: '#3E5A76', card: '#FFFFF4', card2: '#F2FBE6',
    glow: 'rgba(255, 220, 60, .65)', on: '#0E2A4A', on2: '#3E5A76', onDark: '#F4FFF6', on2Dark: '#CBE8D4',
    btn1: '#FFE45A', btn2: '#13A453', road: '#F6EBD0', roadEdge: '#0E2A4A', roadDone: '#FFC21A',
    r: '24px', rBtn: '20px', font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['petal', 'pollen', 'petal'], header: '#4FC8E8',
  },
  // 🇰🇷 Південна Корея — нічний неон: рожевий і ціан на темно-синьому, ліхтарики, палацовий дах
  c10: {
    name: 'neon', bg1: '#1A1F48', bg2: '#4A2E78', bg3: '#FF6FB5',
    accent: '#FF4FA3', accent2: '#3EE6FF', accentSoft: '#FFD6EC', soft: '#E6E8FF',
    ink: '#1A1838', ink2: '#4E4A78', card: '#FBF9FF', card2: '#EEE8FF',
    glow: 'rgba(255, 90, 180, .6)', on: '#F6F2FF', on2: '#C9C2EE', onDark: '#F6F2FF', on2Dark: '#C9C2EE',
    btn1: '#FF9ACD', btn2: '#B05CFF', road: '#3A3E78', roadEdge: '#0E1030', roadDone: '#3EE6FF',
    r: '16px', rBtn: '16px', font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['twinkle', 'dust', 'twinkle'], header: '#1A1F48',
  },
};

const CB_SCENES = {
  c6: () => `${SUNB('#FFB23A')}
    <div class="wd-cloud wc1">${svg('0 0 160 60', CLOUD)}</div>
    <div class="wd-c6-flags">${BUNTING(['#E8323C', '#FFC400', '#FFFFFF', '#F2703A', '#3FA0D8'])}</div>
    <div class="wd-c6-hills">${svg('0 0 400 80', `<path d="M0 40 C60 18 120 34 180 26 C250 16 320 34 400 22 V80 H0Z" fill="#E8C27A"/>
      <g fill="#8AA25A">${Array.from({ length: 14 }, (_, i) => `<circle cx="${14 + i * 28}" cy="${44 + (i % 3) * 8}" r="${4 + (i % 2)}"/>`).join('')}</g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c6-basilica">${svg('0 0 120 150', BASILICA())}</div>
    <div class="wd-ground">${svg('0 0 400 150', `<path d="M0 20 H400 V150 H0Z" fill="#E9B98A"/>
      <g stroke="#D69A68" stroke-width="2" opacity=".7">${Array.from({ length: 8 }, (_, i) => `<path d="M0 ${36 + i * 16} H400"/>`).join('')}</g>
      <path d="M0 20 H400" stroke="#C9874E" stroke-width="5"/>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c6-town">${svg('0 0 400 90', [[0, 40, 70], [66, 28, 56], [118, 46, 64], [178, 34, 50], [224, 22, 70], [290, 44, 54], [340, 30, 60]].map(([x, y, w], i) =>
      `<rect x="${x}" y="${y}" width="${w}" height="${90 - y}" fill="${i % 3 === 1 ? '#FFF6E6' : '#FFFFFF'}"/><path d="M${x - 4} ${y + 2} L${x + w / 2} ${y - 14} L${x + w + 4} ${y + 2}Z" fill="#D2603A"/>
      <path d="M${x + w * 0.3} 90 V${y + 34} C${x + w * 0.3} ${y + 24} ${x + w * 0.7} ${y + 24} ${x + w * 0.7} ${y + 34} V90Z" fill="#7A4A2E"/>
      <rect x="${x + 6}" y="${y + 10}" width="10" height="12" rx="5" fill="#3FA0D8"/><rect x="${x + w - 16}" y="${y + 10}" width="10" height="12" rx="5" fill="#3FA0D8"/>
      <circle cx="${x + 11}" cy="${y + 26}" r="3" fill="#E8323C"/><circle cx="${x + w - 11}" cy="${y + 26}" r="3" fill="#FF8FB5"/>`).join(''), '', 'preserveAspectRatio="xMidYMax slice"')}</div>
    <div class="wd-c6-orange o1">${svg('0 0 70 100', `<path d="M35 100 V58" stroke="#7A4A2E" stroke-width="6"/><circle cx="35" cy="40" r="30" fill="#4E8E3A"/><circle cx="26" cy="32" r="16" fill="#68A84A"/>
      <g fill="#FF9A1A">${[[20, 44], [44, 30], [50, 52], [30, 22], [36, 56]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5"/>`).join('')}</g>`)}</div>
    <div class="wd-c6-orange o2">${svg('0 0 70 100', `<path d="M35 100 V58" stroke="#7A4A2E" stroke-width="6"/><circle cx="35" cy="40" r="30" fill="#4E8E3A"/><circle cx="26" cy="32" r="16" fill="#68A84A"/>
      <g fill="#FF9A1A">${[[22, 48], [46, 34], [40, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5"/>`).join('')}</g>`)}</div>`,

  c7: () => `
    <div class="wd-cloud wc1">${svg('0 0 160 60', CLOUD)}</div>
    <div class="wd-cloud wc2">${svg('0 0 160 60', CLOUD)}</div>
    <div class="wd-c7-mts">${svg('0 0 400 120', `<path d="M0 120 L40 60 L70 84 L120 20 L170 80 L210 46 L260 92 L310 30 L360 76 L400 50 V120Z" fill="#7C93B8"/>
      <path d="M120 20 L102 44 L112 42 L120 50 L128 40 L138 46Z M310 30 L292 54 L304 50 L312 58 L320 48 L330 56Z M210 46 L198 62 L212 60 L222 64Z" fill="#FFFFFF"/>
      <path d="M0 120 L50 86 L90 100 L150 70 L200 100 L250 76 L300 104 L350 82 L400 96 V120Z" fill="#5E7AA2"/>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c7-tower">${svg('0 0 40 170', `<path d="M17 170 L19 40 H21 L23 170Z" fill="#8A9BB4"/><path d="M20 0 V40" stroke="#8A9BB4" stroke-width="2"/>
      <ellipse cx="20" cy="62" rx="9" ry="6" fill="#9AABC4"/><rect x="14" y="56" width="12" height="3" fill="#C8D6EA"/><circle cx="20" cy="2" r="2" fill="#D52B1E" class="wd-c10-blink"/>`)}</div>
    <div class="wd-c7-lake">${svg('0 0 400 60', `<rect width="400" height="60" fill="#3F8FC8"/><rect width="400" height="16" fill="#6FB4E0"/>`, '', 'preserveAspectRatio="none"')}
      <div class="wd-wave wv1">${svg('0 0 480 20', WAVES('#fff', 0.6), '', 'preserveAspectRatio="none"')}</div>
      <div class="wd-c7-canoe">${svg('0 0 80 30', `<path d="M2 12 C20 24 60 24 78 12 C60 16 20 16 2 12Z" fill="#D52B1E"/><path d="M30 14 L44 2 M44 2 L48 6" stroke="#7A4A2E" stroke-width="2.4" stroke-linecap="round"/><circle cx="36" cy="8" r="3.4" fill="#FFD9B8"/>`)}</div></div>
    <div class="wd-ground">${svg('0 0 400 150', pines(400, 70, 14, '#2F6E4E', 0.95, 3) + `<path d="M0 62 C80 54 160 70 240 60 C310 52 360 64 400 58 V150 H0Z" fill="#4E9A6A"/>
      <path d="M0 104 C90 92 190 112 280 102 C340 96 380 106 400 102 V150 H0Z" fill="#3E8A5A"/>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c7-maple">${svg('-24 -24 48 48', `<path d="${MAPLE}" fill="#D52B1E"/>`)}</div>`,

  c8: () => `${SUNB('#FFC24A')}
    <div class="wd-cloud wc1">${svg('0 0 160 60', CLOUD)}</div>
    <div class="wd-c8-rock">${svg('0 0 200 60', `<path d="M4 58 C10 40 22 28 42 24 C72 18 122 16 160 22 C180 26 192 40 196 58Z" fill="#C8552B"/>
      <path d="M50 26 C52 38 50 48 46 58 M96 20 C98 34 96 46 92 58 M140 22 C144 36 142 48 138 58" fill="none" stroke="#9E3E1E" stroke-width="3" opacity=".6"/>
      <path d="M42 24 C72 18 122 16 160 22 C130 22 80 24 50 30Z" fill="#E8794A"/>`)}</div>
    <div class="wd-c8-sea">${svg('0 0 400 100', `<rect width="400" height="100" fill="#1BA6B8"/><rect width="400" height="30" fill="#4FCFDC"/>
      <path d="M0 80 C50 68 100 92 150 80 C200 68 250 92 300 80 C350 68 380 86 400 80 V100 H0Z" fill="#9AEBE8"/>`, '', 'preserveAspectRatio="none"')}
      <div class="wd-wave wv1">${svg('0 0 480 20', WAVES('#fff', 0.75), '', 'preserveAspectRatio="none"')}</div>
      <div class="wd-wave wv2">${svg('0 0 480 20', WAVES('#E6FFFC', 0.6), '', 'preserveAspectRatio="none"')}</div></div>
    <div class="wd-c8-sails">${svg('0 0 160 90', SAILS)}</div>
    <div class="wd-ground">${svg('0 0 400 150', `<path d="M0 26 C60 8 130 30 200 20 C270 10 340 30 400 16 V150 H0Z" fill="#FFE6B0"/>
      <path d="M0 60 C80 42 160 64 240 52 C310 42 360 58 400 50 V150 H0Z" fill="#F6D294"/><path d="M0 110 C90 94 190 114 280 104 C340 98 380 108 400 104 V150 H0Z" fill="#E8B872"/>
      <g transform="translate(300 70)"><path d="M0 0 C-4 -30 4 -50 10 -52 C16 -50 18 -30 12 0Z" fill="#FFFFFF" stroke="#F28A2E" stroke-width="3"/><path d="M4 -46 L10 0" stroke="#1BA6B8" stroke-width="4"/></g>
      <g transform="translate(90 92)"><path d="M0 0 V-40" stroke="#7A5A3A" stroke-width="3"/><path d="M-26 -36 C-20 -54 20 -54 26 -36Z" fill="#F2503A"/><path d="M-8 -36 C-6 -52 6 -52 8 -36Z" fill="#FFFFFF"/></g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c8-gum">${svg('0 0 90 150', `<path d="M45 150 C42 120 48 90 44 60 M44 90 C34 80 26 70 22 58 M46 80 C56 70 64 62 70 50" stroke="#E8E0D0" stroke-width="7" fill="none" stroke-linecap="round"/>
      <g fill="#6FA88A"><ellipse cx="22" cy="48" rx="20" ry="14"/><ellipse cx="68" cy="42" rx="20" ry="14"/><ellipse cx="44" cy="30" rx="26" ry="18"/></g><g fill="#8CC7A0"><ellipse cx="38" cy="24" rx="12" ry="7"/><ellipse cx="62" cy="38" rx="9" ry="5"/></g>`)}</div>
    <div class="wd-c8-roo">${svg('0 0 80 70', `<path d="${ROO}" fill="#9E4A22"/>`)}</div>`,

  c9: () => `${SUNB('#FFD23A')}
    <div class="wd-cloud wc1">${svg('0 0 160 60', CLOUD)}</div>
    <div class="wd-c9-sea">${svg('0 0 400 60', `<rect width="400" height="60" fill="#1E9FC8"/><rect width="400" height="18" fill="#5CCBE6"/>`, '', 'preserveAspectRatio="none"')}
      <div class="wd-wave wv1">${svg('0 0 480 20', WAVES('#fff', 0.7), '', 'preserveAspectRatio="none"')}</div></div>
    <div class="wd-c9-loaf">${svg('0 0 240 140', LOAF)}</div>
    <div class="wd-ground">${svg('0 0 400 150', `<path d="M0 22 C70 10 140 28 200 20 C270 12 340 28 400 16 V150 H0Z" fill="#FFF2CC"/>
      <path d="M0 70 H400 V150 H0Z" fill="#FFFFFF"/>
      <g fill="none" stroke="#1E2A3A" stroke-width="7">${[84, 108, 132].map((y) => `<path d="M0 ${y} q12.5 -12 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0"/>`).join('')}</g>
      <path d="M0 70 H400" stroke="#13A453" stroke-width="5"/>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-palm p1">${svg('0 0 120 200', PALM('#13A453', '#4CC86E'))}</div>
    <div class="wd-palm p2">${svg('0 0 120 200', PALM('#0E8A44', '#3CB860'))}</div>
    <div class="wd-c9-ball">${svg('-12 -12 24 24', `<circle r="11" fill="#FFFFFF" stroke="#1E2A3A" stroke-width="1.6"/><path d="M0 -5 L4.8 -1.5 L3 4 H-3 L-4.8 -1.5Z" fill="#1E2A3A"/><path d="M0 -5 V-11 M4.8 -1.5 L10.5 -3.5 M3 4 L6.5 9 M-3 4 L-6.5 9 M-4.8 -1.5 L-10.5 -3.5" stroke="#1E2A3A" stroke-width="1.4"/>`)}</div>`,

  c10: () => `
    <div class="wd-c10-moon">${svg('-30 -30 60 60', '<circle r="24" fill="#FFF4D6"/><circle cx="9" cy="-6" r="20" fill="#2A2E66" opacity=".55"/>')}</div>
    <div class="wd-c10-city">${svg('0 0 400 120', SKYLINE, '', 'preserveAspectRatio="xMidYMax slice"')}</div>
    <div class="wd-c10-tower">${svg('0 0 120 170', NTOWER)}</div>
    <div class="wd-ground">${svg('0 0 400 150', `<path d="M0 20 H400 V150 H0Z" fill="#14183A"/><path d="M0 20 H400" stroke="#FF4FA3" stroke-width="3" opacity=".7"/>
      <g stroke="#3EE6FF" stroke-width="2" opacity=".35">${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 50} 150 L${200 + (i * 50 - 200) * 0.3} 22"/>`).join('')}</g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c10-gate">${svg('0 0 160 100', HANOK())}</div>
    <div class="wd-c10-lamps">${svg('0 0 400 50', `<path d="M0 6 Q200 30 400 6" fill="none" stroke="#6E6AA8" stroke-width="1.4"/>${Array.from({ length: 9 }, (_, i) => {
      const x = 22 + i * 45, y = 6 + Math.sin((x / 400) * Math.PI) * 12;
      return `<g class="lp"><path d="M${x} ${y.toFixed(1)} V${(y + 5).toFixed(1)}" stroke="#6E6AA8" stroke-width="1.2"/><ellipse cx="${x}" cy="${(y + 13).toFixed(1)}" rx="7" ry="9" fill="${['#FF4FA3', '#3EE6FF', '#FFB23A'][i % 3]}"/><path d="M${x - 4} ${(y + 22).toFixed(1)} H${x + 4}" stroke="#C8343B" stroke-width="2.4"/></g>`;
    }).join('')}`, '', 'preserveAspectRatio="none"')}</div>`,
};

const CB_ART = {
  c6: {
    medal: (t, ink) => `<circle r="54" fill="${t.accent}" stroke="${ink}" stroke-width="3"/>
      ${Array.from({ length: 16 }, (_, i) => `<path transform="rotate(${i * 22.5})" d="M-9 -53 Q0 -60 9 -53 L0 -45Z" fill="${i % 2 ? '#FFC400' : '#FFFFFF'}" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>`).join('')}
      <circle r="45" fill="#FFE3B0" stroke="${ink}" stroke-width="2.4"/>
      <g transform="translate(38 38)"><circle r="8" fill="#E8323C" stroke="${ink}" stroke-width="1.8"/><circle r="3" fill="#FFC400"/></g>`,
    pedestal: (ink) => `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#C9874E" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#E9B98A" stroke="${ink}" stroke-width="3.5"/>
      <g fill="none" stroke="#D69A68" stroke-width="2" opacity=".8"><path d="M40 46 H200 M60 38 H180 M60 54 H180"/></g>
      <ellipse cx="96" cy="38" rx="44" ry="6" fill="#fff" opacity=".35"/>
      <g stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"><path d="M22 50 L36 30 L50 50 Q36 56 22 50Z" fill="#E8323C"/><path d="M36 30 V50" fill="none"/>
      <circle cx="206" cy="44" r="8" fill="#FF9A1A"/><path d="M206 36 l4 -5" fill="none"/></g>`,
    emblem: (ink) => `<path d="M24 40 L6 18 C12 8 36 8 42 18Z" fill="#E8323C" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M24 40 L12 12 M24 40 L24 9 M24 40 L36 12" stroke="#FFC400" stroke-width="2"/><path d="M8 17 Q24 7 40 17" fill="none" stroke="#FFC400" stroke-width="2.6"/>
      <circle cx="24" cy="40" r="3.4" fill="#FFC400" stroke="${ink}" stroke-width="1.8"/>`,
    props: () => [
      svg('0 0 70 100', `<path d="M35 100 V58" stroke="#7A4A2E" stroke-width="6"/><circle cx="35" cy="40" r="30" fill="#68A84A"/><g fill="#FF9A1A"><circle cx="22" cy="44" r="5"/><circle cx="46" cy="32" r="5"/><circle cx="42" cy="54" r="5"/></g>`),
      svg('0 0 60 60', `<path d="M30 54 L4 20 C12 6 48 6 56 20Z" fill="#E8323C"/><path d="M30 54 L16 12 M30 54 V8 M30 54 L44 12" stroke="#FFC400" stroke-width="2.5"/>`),
      svg('0 0 120 150', BASILICA('#EBC08E', '#C9874E'), '', 'opacity=".9"'),
    ],
    chapter: (st, num) => `<g ${st}><path d="M10 62 V30 C10 18 18 10 20 4 C22 10 30 18 30 30 V62Z" fill="#E3A86B"/><path d="M34 62 V24 C34 12 42 4 44 0 C46 4 54 12 54 24 V62Z" fill="#E3A86B"/>
      <path d="M6 62 H58" fill="none" stroke-width="3.5"/></g><circle cx="20" cy="6" r="2.6" fill="#FFC400"/><circle cx="44" cy="2" r="2.6" fill="#FFC400"/>
      <rect x="22" y="34" width="20" height="18" rx="5" fill="#FFFBF3" stroke="#4A1E1A" stroke-width="2"/>${num(32, 48)}`,
  },
  c7: {
    medal: (t, ink) => `<circle r="54" fill="#FFFFFF" stroke="${ink}" stroke-width="3"/>
      <path d="M0 -54 A54 54 0 0 1 0 54 A54 54 0 0 1 0 -54Z" fill="none"/>
      ${Array.from({ length: 10 }, (_, i) => `<g transform="rotate(${i * 36}) translate(0 -49) scale(.32)"><path d="${MAPLE}" fill="${i % 2 ? '#D52B1E' : '#E8673A'}" stroke="${ink}" stroke-width="4"/></g>`).join('')}
      <circle r="43" fill="#E6F4FB" stroke="${ink}" stroke-width="2.4"/>
      <g transform="translate(38 38) scale(.5)"><path d="${MAPLE}" fill="#D52B1E" stroke="${ink}" stroke-width="3.6"/></g>`,
    pedestal: (ink) => `<path d="M10 60 C14 42 40 34 70 36 C100 26 150 26 176 36 C206 34 228 46 230 60 C226 80 14 80 10 60Z" fill="#6E7F8C" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
      <ellipse cx="120" cy="46" rx="104" ry="20" fill="#7BB38A" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="50" rx="46" ry="9" fill="#6FB4E0" stroke="${ink}" stroke-width="2.4"/>
      <g fill="#2F6E4E" stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M26 48 L34 18 L42 48Z"/><path d="M198 48 L206 20 L214 48Z"/></g>
      <g transform="translate(170 40) scale(.4)"><path d="${MAPLE}" fill="#D52B1E" stroke="${ink}" stroke-width="4"/></g>`,
    emblem: (ink) => `<g transform="translate(24 24) scale(1.05)"><path d="${MAPLE}" fill="#D52B1E" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/></g>`,
    props: () => [
      svg('0 0 60 90', pines(60, 90, 2, '#2F6E4E', 0.95, 2)),
      svg('-24 -24 48 48', `<path d="${MAPLE}" fill="#E8473A"/>`),
      svg('0 0 80 30', `<path d="M2 12 C20 26 60 26 78 12 C60 16 20 16 2 12Z" fill="#D52B1E"/><path d="M28 18 L50 2" stroke="#7A4A2E" stroke-width="3" stroke-linecap="round"/>`),
    ],
    chapter: (st, num) => `<g ${st}><path d="M32 62 V40" fill="none" stroke-width="4.5"/>
      <path d="M8 40 H56 V12 H8Z" fill="#FFFFFF"/></g><g transform="translate(32 26) scale(.62)"><path d="${MAPLE}" fill="#D52B1E"/></g>
      <circle cx="32" cy="26" r="8" fill="#FFFFFF" opacity=".9"/>${num(32, 31)}`,
  },
  c8: {
    medal: (t, ink) => `<circle r="54" fill="#C8552B" stroke="${ink}" stroke-width="3"/>
      ${Array.from({ length: 24 }, (_, i) => { const a = (i * Math.PI) / 12; return `<circle cx="${(Math.cos(a) * 49.5).toFixed(1)}" cy="${(Math.sin(a) * 49.5).toFixed(1)}" r="2.6" fill="${i % 2 ? '#FFE2C2' : '#F2A03A'}"/>`; }).join('')}
      <circle r="44" fill="#DDF6F8" stroke="${ink}" stroke-width="2.4"/>
      <g transform="translate(36 40)"><path d="M-12 4 C-6 -8 6 -8 12 4" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round"/><path d="M-12 4 C-6 -8 6 -8 12 4" fill="none" stroke="#F28A2E" stroke-width="3" stroke-linecap="round"/></g>`,
    pedestal: (ink) => `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#E8B872" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#FFE6B0" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="96" cy="38" rx="44" ry="6" fill="#fff" opacity=".45"/>
      <g stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"><path d="M24 56 C20 34 26 18 32 16 C38 18 40 34 36 56Z" fill="#FFFFFF"/><path d="M28 20 L32 56" fill="none" stroke="#1BA6B8" stroke-width="3"/>
      <path d="M196 44 C204 34 216 34 222 44" fill="none" stroke-width="6"/><path d="M196 44 C204 34 216 34 222 44" fill="none" stroke="#F28A2E" stroke-width="3"/></g>`,
    emblem: (ink) => `<path d="M8 34 C10 18 22 10 30 12 C24 16 18 24 16 36Z M30 12 C38 12 42 18 40 22 C34 20 28 20 24 22Z" fill="#F28A2E" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>
      <circle cx="36" cy="34" r="8" fill="#FFC24A" stroke="${ink}" stroke-width="2"/><path d="M4 44 q5 -4 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#1BA6B8" stroke-width="2.6" stroke-linecap="round"/>`,
    props: () => [
      svg('0 0 80 70', `<path d="${ROO}" fill="#C26A3A" opacity=".9"/>`),
      svg('0 0 40 90', '<path d="M8 86 C2 50 10 16 20 4 C30 16 38 50 32 86Z" fill="#FFFFFF" stroke="#F28A2E" stroke-width="3"/><path d="M20 6 V86" stroke="#1BA6B8" stroke-width="4"/>'),
      svg('0 0 200 60', '<path d="M4 58 C10 40 22 28 42 24 C72 18 122 16 160 22 C180 26 192 40 196 58Z" fill="#D2693A"/>', '', 'opacity=".85"'),
    ],
    chapter: (st, num) => `<g ${st}><path d="M4 56 C8 40 16 32 28 30 C40 28 52 32 60 56Z" fill="#C8552B"/><path d="M2 60 H62" fill="none" stroke-width="3.5"/></g>
      <circle cx="46" cy="12" r="8" fill="#FFC24A"/><rect x="18" y="34" width="22" height="18" rx="5" fill="#FFFDF6" stroke="#3A2416" stroke-width="2"/>${num(29, 48)}`,
  },
  c9: {
    medal: (t, ink) => `<circle r="54" fill="#13A453" stroke="${ink}" stroke-width="3"/>
      <path d="M0 -50 L50 0 L0 50 L-50 0Z" fill="#FFC21A" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
      <circle r="42" fill="#FFF6C2" stroke="${ink}" stroke-width="2.4"/>
      ${Array.from({ length: 8 }, (_, i) => `<circle transform="rotate(${i * 45 + 22})" cx="0" cy="-48" r="3" fill="${['#FF4F8A', '#2F6FE0', '#FFFFFF', '#FF8A1A'][i % 4]}" stroke="${ink}" stroke-width="1.2"/>`).join('')}
      <g transform="translate(38 38)"><circle r="9" fill="#fff" stroke="${ink}" stroke-width="1.8"/><path d="M0 -4 L3.8 -1.2 L2.4 3.2 H-2.4 L-3.8 -1.2Z" fill="${ink}"/></g>`,
    pedestal: (ink) => `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#13A453" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#FFFFFF" stroke="${ink}" stroke-width="3.5"/>
      <path d="M30 46 q11 -8 22 0 t22 0 t22 0 t22 0 t22 0 t22 0 t22 0 t22 0" fill="none" stroke="#1E2A3A" stroke-width="5" opacity=".85"/>
      <ellipse cx="96" cy="36" rx="40" ry="5" fill="#FFF6C2" opacity=".6"/>
      <g stroke="${ink}" stroke-width="2"><circle cx="30" cy="40" r="4" fill="#FF4F8A"/><circle cx="210" cy="36" r="4" fill="#FFC21A"/><circle cx="196" cy="48" r="3" fill="#2F6FE0"/></g>`,
    emblem: (ink) => `<circle cx="24" cy="26" r="16" fill="#FFFFFF" stroke="${ink}" stroke-width="2.4"/><path d="M24 18 L31.6 23.6 L28.8 32.4 H19.2 L16.4 23.6Z" fill="#13A453" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M24 18 V10 M31.6 23.6 L39 21 M28.8 32.4 L33 39 M19.2 32.4 L15 39 M16.4 23.6 L9 21" stroke="${ink}" stroke-width="1.8"/><circle cx="40" cy="8" r="3" fill="#FFC21A"/><circle cx="8" cy="8" r="2.4" fill="#FF4F8A"/>`,
    props: () => [
      svg('0 0 120 200', PALM('#13A453', '#4CC86E')),
      svg('0 0 70 60', '<g fill="#FF4F8A"><path d="M35 30 C20 4 4 14 10 30 C4 46 20 56 35 30Z"/></g><g fill="#2F6FE0"><path d="M35 30 C50 4 66 14 60 30 C66 46 50 56 35 30Z"/></g><circle cx="35" cy="30" r="6" fill="#FFC21A"/>'),
      svg('0 0 240 140', LOAF, '', 'opacity=".9"'),
    ],
    chapter: (st, num) => `<g ${st}><path d="M2 62 C4 48 12 40 22 40 C30 40 34 50 36 62Z" fill="#3E8E5A"/><path d="M28 62 C30 34 38 12 50 10 C60 10 62 36 62 62Z" fill="#5A7E6A"/></g>
      <path d="M20 40 L50 10" stroke="#1E2A3A" stroke-width="1.2"/><rect x="31" y="25" width="9" height="7" rx="2" fill="#FFDF00" stroke="#1E2A3A" stroke-width="1.2"/>
      <rect x="8" y="44" width="22" height="16" rx="5" fill="#FFFFF4" stroke="#0E2A4A" stroke-width="2"/>${num(19, 57)}`,
  },
  c10: {
    medal: (t, ink) => `<circle r="54" fill="#1A1F48" stroke="${ink}" stroke-width="3"/>
      <circle r="49" fill="none" stroke="#FF4FA3" stroke-width="3"/><circle r="45.5" fill="none" stroke="#3EE6FF" stroke-width="2"/>
      ${Array.from({ length: 12 }, (_, i) => `<circle transform="rotate(${i * 30})" cx="0" cy="-49" r="2.4" fill="${i % 2 ? '#3EE6FF' : '#FFE27A'}"/>`).join('')}
      <circle r="42" fill="#EEE8FF" stroke="${ink}" stroke-width="2.2"/>
      <g transform="translate(37 36)"><path d="M0 -12 V-8" stroke="${ink}" stroke-width="1.6"/><ellipse cx="0" cy="0" rx="7" ry="9" fill="#FF4FA3" stroke="${ink}" stroke-width="1.8"/><path d="M-4 9 H4" stroke="#C8343B" stroke-width="2.4"/></g>`,
    pedestal: (ink) => `<path d="M14 54 L30 34 H210 L226 54 L210 74 H30Z" fill="#2A2E66" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M14 54 L30 34 H210 L226 54Z" fill="#4A4E9A" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M30 64 H210" stroke="#FF4FA3" stroke-width="3" opacity=".9"/><path d="M40 70 H200" stroke="#3EE6FF" stroke-width="2" opacity=".8"/>
      <g stroke="${ink}" stroke-width="2"><ellipse cx="34" cy="28" rx="7" ry="9" fill="#FF4FA3"/><ellipse cx="206" cy="28" rx="7" ry="9" fill="#3EE6FF"/></g>`,
    emblem: (ink) => `<path d="M4 44 C10 32 18 26 24 26 C30 26 38 32 44 44Z" fill="#2A2E66" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>
      <rect x="22" y="12" width="4" height="16" fill="#5E68D0" stroke="${ink}" stroke-width="1.6"/><rect x="17" y="13" width="14" height="5" rx="2.4" fill="#FF4FA3" stroke="${ink}" stroke-width="1.8"/>
      <path d="M24 3 V12" stroke="${ink}" stroke-width="1.8"/><circle cx="24" cy="3" r="2.2" fill="#3EE6FF"/><circle cx="40" cy="10" r="2" fill="#FFE27A"/>`,
    props: () => [
      svg('0 0 30 50', '<path d="M15 0 V8" stroke="#6E6AA8" stroke-width="1.6"/><ellipse cx="15" cy="22" rx="12" ry="15" fill="#FF4FA3" opacity=".9"/><path d="M8 38 H22" stroke="#C8343B" stroke-width="3"/>'),
      svg('0 0 160 100', HANOK('#3A3F6A'), '', 'opacity=".85"'),
      svg('0 0 30 50', '<path d="M15 0 V8" stroke="#6E6AA8" stroke-width="1.6"/><ellipse cx="15" cy="22" rx="12" ry="15" fill="#3EE6FF" opacity=".9"/><path d="M8 38 H22" stroke="#C8343B" stroke-width="3"/>'),
    ],
    chapter: (st, num) => `<circle cx="32" cy="30" r="24" fill="#FF4FA3" opacity=".18"/><g ${st}><path d="M14 62 V36 M50 62 V36" fill="none" stroke="#C8343B" stroke-width="5"/>
      <path d="M2 30 C14 34 24 28 32 20 C40 28 50 34 62 30 C56 38 50 40 46 40 H18 C14 40 8 38 2 30Z" fill="#2E3550"/></g>
      <rect x="18" y="40" width="28" height="18" rx="5" fill="#FBF9FF" stroke="#1A1838" stroke-width="2"/>${num(32, 54)}`,
  },
};
Object.assign(WORLD_THEMES, CB_THEMES);
Object.assign(SCENES, CB_SCENES);
