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
import { tg } from './tg.js?v=20261114080653';

const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

export const WORLD_THEMES = {
  // v20 · w0 Ранкова Галявина (колишній дизайн w1) — світанок, м'ята/персик/сонячно-жовтий, округлі листочки, роса
  w0: {
    name: 'dawn', bg1: '#FFC6A5', bg2: '#FFE9B8', bg3: '#A8DD98',
    accent: '#FFC23D', accent2: '#3FB487', accentSoft: '#FFEBB0', soft: '#D8F3E2',
    ink: '#3A3150', ink2: '#6E6487', card: '#FFFCF3', card2: '#FFF1D6',
    glow: 'rgba(255, 210, 100, .75)', on: '#3A3150', on2: '#665B7E', onDark: '#FFF4E6', on2Dark: '#F4D9C8',
    btn1: '#FFE98C', btn2: '#FFB347', road: '#FFF2D2', roadEdge: '#3A3150', roadDone: '#FFD45E',
    r: '26px 10px 26px 10px', rBtn: '20px',
    font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['pollen', 'petal', 'pollen'], header: '#FFC6A5',
  },
  // v20 · w1 Долина Повітряних Куль — барвінкове небо, рожевий світанок, клаптикові поля, кульки-цукерки, індигова обводка
  w1: {
    name: 'balloon', bg1: '#B4C6FF', bg2: '#FFE4EE', bg3: '#A6D58C',
    accent: '#FF5D73', accent2: '#7A6CF0', accentSoft: '#FFD6DE', soft: '#E7E4FF',
    ink: '#2F2A5A', ink2: '#5E5890', card: '#FFFDF8', card2: '#FFEEF3',
    glow: 'rgba(255, 140, 170, .7)', on: '#2F2A5A', on2: '#57518A', onDark: '#FFF4FA', on2Dark: '#E2D6F2',
    btn1: '#FFC2CF', btn2: '#FF7A8E', road: '#FFF3DA', roadEdge: '#2F2A5A', roadDone: '#FF8FA3',
    r: '28px 28px 14px 28px', rBtn: '22px',
    font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['bln', 'pollen', 'bln'], header: '#B4C6FF',
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

// v20 · w1 Долина Повітряних Куль: кулі, кошик, флюгер, мотузковий місток, хмари-подушки
const GORE = (f) => `M60 4 C${60 - 36 * f} 4 ${60 - 56 * f} 30 ${60 - 56 * f} 60 C${60 - 56 * f} 88 ${60 - 30 * f} 104 ${60 - 18 * f} 124 H${60 + 18 * f} C${60 + 30 * f} 104 ${60 + 56 * f} 88 ${60 + 56 * f} 60 C${60 + 56 * f} 30 ${60 + 36 * f} 4 60 4Z`;
const BASKET = (x, y, w = 36, k = '#2F2A5A') => `
  <path d="M${x} ${y} H${x + w} L${x + w - 4} ${y + w * 0.72} H${x + 4}Z" fill="#C98B4E" stroke="${k}" stroke-width="2.5" stroke-linejoin="round"/>
  <g stroke="#9A6234" stroke-width="1.6"><path d="M${x + 3} ${y + w * 0.26} H${x + w - 3} M${x + 3.5} ${y + w * 0.48} H${x + w - 3.5}"/><path d="M${x + w * 0.33} ${y + 2} V${y + w * 0.7} M${x + w * 0.66} ${y + 2} V${y + w * 0.7}"/></g>
  <rect x="${x - 2}" y="${y - 3}" width="${w + 4}" height="6" rx="3" fill="#8A5A30" stroke="${k}" stroke-width="2"/>`;
const BIGBLN = (k = '#2F2A5A', cols = ['#FF5D73', '#FFD25A', '#5FC3E8', '#7A6CF0']) => `
  <path d="M60 4 V-10" stroke="${k}" stroke-width="2"/><path d="M60 -10 L74 -6 L60 -2Z" fill="${cols[1]}" stroke="${k}" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="${GORE(1)}" fill="${cols[0]}"/><path d="${GORE(0.7)}" fill="${cols[1]}"/><path d="${GORE(0.42)}" fill="${cols[2]}"/><path d="${GORE(0.15)}" fill="${cols[3]}"/>
  <path d="M6 70 C40 80 80 80 114 70" stroke="#FFFFFF" stroke-width="5" fill="none" opacity=".85"/>
  <g fill="#FFFFFF" opacity=".9">${[14, 32, 50, 70, 88, 106].map((x, i) => `<path d="M${x - 5} ${73 + (i % 5 ? 4 : 0)} L${x + 5} ${73 + (i % 5 ? 4 : 0)} L${x} ${84 + (i % 5 ? 3 : 0)}Z" fill="${cols[i % 4]}"/>`).join('')}</g>
  <path d="${GORE(1)}" fill="none" stroke="${k}" stroke-width="3.5" stroke-linejoin="round"/>
  <ellipse cx="30" cy="34" rx="8" ry="16" fill="#FFFFFF" opacity=".45" transform="rotate(24 30 34)"/>
  <path d="M43 124 L47 140 M77 124 L73 140 M55 124 V140 M65 124 V140" stroke="${k}" stroke-width="2"/>
  <ellipse class="fl" cx="60" cy="130" rx="4" ry="6" fill="#FFB347"/>
  ${BASKET(42, 140, 36, k)}
  <g fill="#EAD9AC" stroke="${k}" stroke-width="1.6"><ellipse cx="40" cy="150" rx="4" ry="5.5"/><ellipse cx="80" cy="150" rx="4" ry="5.5"/></g>`;
const BLN = (a, b, c = '#FFFFFF') => `
  <path d="M30 2 C12 2 2 16 2 30 C2 44 16 54 22 62 H38 C44 54 58 44 58 30 C58 16 48 2 30 2Z" fill="${a}"/>
  <path d="M30 2 C21 2 15 16 15 30 C15 44 20 54 24 62 H36 C40 54 45 44 45 30 C45 16 39 2 30 2Z" fill="${b}"/>
  <path d="M30 2 C27 2 25 16 25 30 C25 44 27 54 28 62 H32 C33 54 35 44 35 30 C35 16 33 2 30 2Z" fill="${c}"/>
  <ellipse cx="16" cy="20" rx="4.5" ry="9" fill="#FFFFFF" opacity=".45" transform="rotate(20 16 20)"/>
  <path d="M23 62 L25 72 M37 62 L35 72" stroke="#5E5890" stroke-width="1.6"/>
  <rect x="23" y="71" width="14" height="11" rx="3" fill="#C98B4E"/><path d="M24 75 H36 M24 78.5 H36" stroke="#9A6234" stroke-width="1.2"/>`;
const PILLOW = `
  <path d="M14 18 C10 6 22 2 32 8 C60 2 110 2 138 8 C148 2 160 6 156 18 C162 30 162 42 156 52 C160 64 148 68 138 62 C110 68 60 68 32 62 C22 68 10 64 14 52 C8 42 8 30 14 18Z" fill="#FFFFFF"/>
  <path d="M14 46 C40 56 130 56 156 46 C160 56 154 64 138 62 C110 68 60 68 32 62 C18 66 10 58 14 46Z" fill="#E4E0FA"/>
  <path d="M26 16 C60 11 110 11 144 16 M26 54 C60 59 110 59 144 54" stroke="#D2CBF2" stroke-width="2" stroke-dasharray="4 4" fill="none"/>
  <circle cx="85" cy="35" r="4" fill="#E4E0FA"/><path d="M80 31 L90 39 M90 31 L80 39" stroke="#FFFFFF" stroke-width="1.4"/>`;
const VANE = (k = '#4A4270') => `
  <path d="M30 110 V30" stroke="${k}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M19 50 H41 M30 44 V56" stroke="${k}" stroke-width="2.4" stroke-linecap="round"/>
  <g class="vn"><path d="M6 30 H52" stroke="${k}" stroke-width="3" stroke-linecap="round"/><path d="M57 30 L46 23 V37Z" fill="#FF5D73"/>
  <path d="M5 30 L-1 21 H11 L15 30 L11 39 H-1Z" fill="#7A6CF0"/>
  <path d="M22 30 C22 14 38 14 38 30 C38 24 34 22 30 24 C26 22 22 24 22 30Z" fill="#FFD25A"/></g>
  <circle cx="30" cy="30" r="3.5" fill="#FFC23D" stroke="${k}" stroke-width="1.5"/>`;
const RBRIDGE = () => {
  const u = (x) => 1 - ((x - 80) / 74) ** 2;
  let planks = '', hang = '';
  for (let x = 14; x <= 146; x += 9) {
    const d = 26 + 12 * u(x), t = 12 + 13 * u(x);
    planks += `<rect x="${x - 3}" y="${(d - 1).toFixed(1)}" width="6" height="5" rx="1" fill="#C98B4E"/>`;
    hang += `<path d="M${x} ${t.toFixed(1)} V${d.toFixed(1)}"/>`;
  }
  return `<g stroke="#7A5634" stroke-width="4" stroke-linecap="round"><path d="M6 50 V8 M154 50 V8"/></g>
  <g fill="none" stroke="#B98A54" stroke-width="2.2"><path d="M6 12 Q80 38 154 12"/><path d="M6 26 Q80 50 154 26"/></g>
  <g stroke="#B98A54" stroke-width="1.2">${hang}</g>${planks}
  <g fill="#FF5D73"><path d="M2 8 L6 2 L10 8Z"/><path d="M150 8 L154 2 L158 8Z" fill="#7A6CF0"/></g>`;
};

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

  w0: () => `
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

  // v20 · w1 Долина Повітряних Куль — клаптикові поля, кулі, що піднімаються, флюгер, кошик, мотузковий місток, хмари-подушки
  w1: () => `
    <div class="wd-pillow p1">${svg('0 0 170 70', PILLOW)}</div>
    <div class="wd-pillow p2">${svg('0 0 170 70', PILLOW)}</div>
    <div class="wd-bln b1">${svg('0 0 60 84', BLN('#FF8FA3', '#FFFFFF', '#FF5D73'))}</div>
    <div class="wd-bln b2">${svg('0 0 60 84', BLN('#7FD3F2', '#FFE07A', '#5FC3E8'))}</div>
    <div class="wd-bln b3">${svg('0 0 60 84', BLN('#B9A8FF', '#FFFFFF', '#7A6CF0'))}</div>
    <div class="wd-bigbln">${svg('0 -12 120 182', BIGBLN())}</div>
    <div class="wd-ground">${svg('0 0 400 160', `
      <path d="M0 40 C80 14 160 30 240 22 C310 16 360 30 400 22 V160 H0Z" fill="#BFE08E"/>
      <path d="M0 42 C40 30 70 26 100 26 L120 70 C80 72 40 76 0 80Z" fill="#F4D774"/>
      <path d="M100 26 C150 22 200 30 240 22 L250 64 C200 66 160 68 120 70Z" fill="#9ED39A"/>
      <path d="M240 22 C310 16 360 30 400 22 V60 C340 62 290 64 250 64Z" fill="#F2B7CB"/>
      <path d="M0 80 C40 76 80 72 120 70 L150 116 C100 118 50 120 0 122Z" fill="#7EC27C"/>
      <path d="M120 70 C160 68 200 66 250 64 L280 112 C230 114 190 115 150 116Z" fill="#E8C35A"/>
      <path d="M250 64 C300 63 350 61 400 60 V108 C360 110 320 111 280 112Z" fill="#B7DD8C"/>
      <path d="M0 122 C50 120 100 118 150 116 L170 160 H0Z" fill="#A9D46E"/>
      <path d="M150 116 C200 115 240 113 280 112 L300 160 H170Z" fill="#E59BB4"/>
      <path d="M280 112 C330 111 370 109 400 108 V160 H300Z" fill="#82C47E"/>
      <g stroke="#D9B640" stroke-width="2" opacity=".7"><path d="M18 52 L26 72 M38 44 L48 70 M58 38 L70 68 M78 32 L92 68"/><path d="M168 82 L176 110 M190 80 L200 110 M212 78 L224 110 M234 76 L248 110"/></g>
      <g fill="#FFFFFF" opacity=".85"><circle cx="270" cy="36" r="2.4"/><circle cx="300" cy="46" r="2.4"/><circle cx="340" cy="34" r="2.4"/><circle cx="196" cy="132" r="2.6"/><circle cx="232" cy="146" r="2.6"/><circle cx="258" cy="128" r="2.4"/></g>
      <g fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-dasharray="5 5" opacity=".75" stroke-linecap="round">
        <path d="M100 26 L120 70 L150 116 L170 160 M240 22 L250 64 L280 112 L300 160"/>
        <path d="M0 80 C40 76 80 72 120 70 C160 68 200 66 250 64 C300 63 350 61 400 60 M0 122 C50 120 100 118 150 116 C200 115 240 113 280 112 C330 111 370 109 400 108"/></g>
      <path d="M0 40 C80 14 160 30 240 22 C310 16 360 30 400 22" fill="none" stroke="#FFFFFF" stroke-width="3" opacity=".5"/>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-rbridge">${svg('0 0 160 54', RBRIDGE())}</div>
    <div class="wd-vane">${svg('-4 0 64 112', VANE())}</div>
    <div class="wd-basket">${svg('0 0 60 44', `${BASKET(10, 14, 40, '#5E4A7A')}<path d="M16 14 L22 2 M44 14 L38 2" stroke="#5E4A7A" stroke-width="1.6"/><g fill="#EAD9AC"><ellipse cx="8" cy="26" rx="4" ry="5.5"/><ellipse cx="52" cy="26" rx="4" ry="5.5"/></g>`)}</div>`,

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
    case 'w1': // v20 · кільце-гірлянда з повітряних кульок і мотузочки
      return svg('-60 -60 120 120', `
        <circle r="50" fill="${t.accent2}" stroke="${ink}" stroke-width="3"/>
        <circle r="50" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4 5" opacity=".7"/>
        ${Array.from({ length: 8 }, (_, i) => { const c = ['#FF5D73', '#FFD25A', '#5FC3E8', '#B9A8FF'][i % 4]; return `<g transform="rotate(${i * 45}) translate(0 -51)"><path d="M0 -10 C7 -10 9 -3 6 2 C4 6 2 8 0 9 C-2 8 -4 6 -6 2 C-9 -3 -7 -10 0 -10Z" fill="${c}" stroke="${ink}" stroke-width="2.2"/><circle cx="-2.5" cy="-5" r="2" fill="#fff" opacity=".7"/></g>`; }).join('')}`, 'wf');
    case 'w0': // вінок з округлих листочків і краплин роси
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
    w1: `<path d="M18 40 H222 L206 80 H34Z" fill="#C98B4E" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
      <g stroke="#9A6234" stroke-width="2.4"><path d="M24 54 H216 M29 67 H211"/><path d="M70 42 L74 78 M120 42 V80 M170 42 L166 78"/></g>
      <rect x="10" y="32" width="220" height="14" rx="7" fill="#8A5A30" stroke="${ink}" stroke-width="3.5"/>
      <path d="M22 38 C70 32 170 32 218 38" stroke="#FFFFFF" stroke-width="2.4" fill="none" opacity=".35"/>
      <g stroke="${ink}" stroke-width="2.2"><ellipse cx="22" cy="58" rx="8" ry="11" fill="#EAD9AC"/><ellipse cx="218" cy="58" rx="8" ry="11" fill="#EAD9AC"/></g>`,
    w0: `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#6DBE6A" stroke="${ink}" stroke-width="3.5"/>
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
    w1: `<path d="M24 3 C12 3 6 12 6 20 C6 29 15 34 19 39 H29 C33 34 42 29 42 20 C42 12 36 3 24 3Z" fill="#FF5D73" stroke="${ink}" stroke-width="2.4"/><path d="M24 3 C18 3 15 12 15 20 C15 29 18 34 20 39 H28 C30 34 33 29 33 20 C33 12 30 3 24 3Z" fill="#FFD25A"/><path d="M24 3 C22 3 21 12 21 20 C21 29 22 34 23 39 H25 C26 34 27 29 27 20 C27 12 26 3 24 3Z" fill="#5FC3E8"/><path d="M24 3 C12 3 6 12 6 20 C6 29 15 34 19 39 H29 C33 34 42 29 42 20 C42 12 36 3 24 3Z" fill="none" stroke="${ink}" stroke-width="2.4"/><rect x="18" y="39" width="12" height="7" rx="2" fill="#C98B4E" stroke="${ink}" stroke-width="2"/>`,
    w0: `<circle cx="24" cy="26" r="11" fill="#FFE07A" stroke="${ink}" stroke-width="2.5"/><path d="M24 8 V4 M38 14 L41 11 M10 14 L7 11 M42 26 H45 M6 26 H3" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/><path d="M6 40 C16 32 32 32 42 40 V44 H6Z" fill="#7CC775" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
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
      svg('0 0 60 84', BLN('#FF8FA3', '#FFFFFF', '#FF5D73')),
      svg('-4 0 64 112', VANE()),
      svg('0 0 60 44', `${BASKET(10, 14, 40)}<g fill="#EAD9AC"><ellipse cx="8" cy="26" rx="4" ry="5.5"/><ellipse cx="52" cy="26" rx="4" ry="5.5"/></g>`),
      svg('0 0 60 84', BLN('#7FD3F2', '#FFE07A', '#5FC3E8')),
    ],
    w0: [
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
    case 'w1': // v20 · повітряна куля-кошик із номером на «латці» поля
      return svg('0 0 64 64', `
        <g ${st}><path d="M6 60 C10 52 22 50 32 50 C42 50 54 52 58 60Z" fill="#F4D774"/>
        <path d="M32 3 C17 3 10 13 10 23 C10 33 20 38 25 44 H39 C44 38 54 33 54 23 C54 13 47 3 32 3Z" fill="#FF5D73"/>
        <path d="M32 3 C25 3 21 13 21 23 C21 33 25 38 28 44 H36 C39 38 43 33 43 23 C43 13 39 3 32 3Z" fill="#FFFDF8" stroke="none"/>
        <path d="M32 3 C17 3 10 13 10 23 C10 33 20 38 25 44 H39 C44 38 54 33 54 23 C54 13 47 3 32 3Z" fill="none"/>
        <rect x="26" y="47" width="12" height="9" rx="2" fill="#C98B4E"/></g>
        <path d="M27 44 V47 M37 44 V47" stroke="${ink}" stroke-width="1.6"/>${num(32, 28)}`);
    case 'w0': default: // w0 (і невідомі): прапорець на галявині
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

// ═════════════════════════════════════════════════════════ v20 · країни c11 🇳🇴 Норвегія · c12 🇲🇽 Мексика
// Ті самі хуки, що й c6–c10: палітра → WORLD_THEMES, сцена → SCENES, рамка/постамент/емблема/декор/розділ → CB_ART.
const AURORA = `<defs><linearGradient id="c11au" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7DFFC8" stop-opacity="0"/><stop offset=".55" stop-color="#3EF0A8" stop-opacity=".75"/><stop offset="1" stop-color="#B07CFF" stop-opacity="0"/></linearGradient></defs>
  <path class="au1" d="M0 70 C60 20 120 80 200 40 C270 6 330 60 400 24 V90 C330 120 270 70 200 104 C120 140 60 84 0 120Z" fill="url(#c11au)"/>
  <path class="au2" d="M0 40 C80 70 150 10 230 44 C300 70 350 20 400 46 V70 C350 44 300 96 230 70 C150 40 80 96 0 66Z" fill="url(#c11au)" opacity=".7"/>`;
const RORBU = (x, y, w, c = '#C8102E') => `<g transform="translate(${x} ${y})"><path d="M0 ${w * 0.9} V${w * 0.35} L${w / 2} 0 L${w} ${w * 0.35} V${w * 0.9}Z" fill="${c}"/>
  <path d="M-4 ${w * 0.38} L${w / 2} -3 L${w + 4} ${w * 0.38}" fill="none" stroke="#2A2A2E" stroke-width="5" stroke-linejoin="round"/>
  <rect x="${w * 0.18}" y="${w * 0.45}" width="${w * 0.2}" height="${w * 0.18}" fill="#FFE9A8"/><rect x="${w * 0.58}" y="${w * 0.5}" width="${w * 0.22}" height="${w * 0.4}" fill="#FFFFFF"/>
  <path d="M${w * 0.18} ${w * 0.54} H${w * 0.38}" stroke="#FFFFFF" stroke-width="1.6"/></g>`;
const DRAKKAR = `<path d="M10 40 C30 56 110 56 130 40 L120 36 H20Z" fill="#8A5A30"/><path d="M10 40 C4 30 6 18 14 14 C12 22 16 30 22 36Z M130 40 C136 30 134 18 126 14 C128 22 124 30 118 36Z" fill="#6A4220"/>
  <path d="M70 36 V4" stroke="#5A3A1A" stroke-width="3"/><path d="M48 8 H92 L88 32 H52Z" fill="#FFFFFF"/><g fill="#C8102E"><path d="M52 8 H60 L58 32 H54Z"/><path d="M66 8 H74 V32 H66Z"/><path d="M80 8 H88 L86 32 H82Z"/></g>
  <g fill="#FFC94A" stroke="#6A4220" stroke-width="1.2">${[34, 50, 66, 82, 98].map((x) => `<circle cx="${x + 6}" cy="42" r="4"/>`).join('')}</g>`;
const CACTUS = (c = '#2E9A5A', d = '#1E7A44') => `<path d="M32 120 V30 C32 18 48 18 48 30 V120Z" fill="${c}"/><path d="M32 74 H22 C14 74 12 66 12 58 V46 C12 38 24 38 24 46 V62 H32Z" fill="${c}"/>
  <path d="M48 64 H56 V40 C56 32 68 32 68 40 V58 C68 70 62 76 54 76 H48Z" fill="${c}"/><path d="M40 24 V118" stroke="${d}" stroke-width="2" opacity=".6"/>
  <circle cx="40" cy="20" r="5" fill="#FF5C8A"/><circle cx="62" cy="34" r="3.6" fill="#FFC21A"/>`;
const PYRAMID = (f = '#D9A55A', d = '#B07A3A') => `<g fill="${f}">${[0, 1, 2, 3, 4].map((i) => `<rect x="${10 + i * 14}" y="${100 - (i + 1) * 18}" width="${180 - i * 28}" height="19"/>`).join('')}<rect x="80" y="2" width="40" height="18"/></g>
  <path d="M86 100 L94 20 H106 L114 100Z" fill="${d}"/><g stroke="${d}" stroke-width="2" opacity=".55">${[0, 1, 2, 3, 4].map((i) => `<path d="M${10 + i * 14} ${100 - (i + 1) * 18 + 1} H${190 - i * 14}"/>`).join('')}</g>
  <rect x="88" y="6" width="24" height="12" fill="${d}" opacity=".6"/>`;
const PICADO = (cols, n = 10) => svg('0 0 400 50', `<path d="M0 4 Q200 18 400 4" fill="none" stroke="#5A3A3A" stroke-width="1.4"/>${Array.from({ length: n }, (_, i) => {
  const w = 400 / n, x = i * w + 4, y = 4 + Math.sin(((x + w / 2) / 400) * Math.PI) * 7, ww = w - 8;
  return `<g class="pp"><path d="M${x} ${y.toFixed(1)} h${ww} v26 l-${ww / 4} 5 l-${ww / 4} -5 l-${ww / 4} 5 l-${ww / 4} -5Z" fill="${cols[i % cols.length]}"/>
    <circle cx="${x + ww / 2}" cy="${(y + 12).toFixed(1)}" r="4" fill="#FFF8F0" opacity=".85"/><path d="M${x + 5} ${(y + 22).toFixed(1)} h${ww - 10}" stroke="#FFF8F0" stroke-width="2" stroke-dasharray="3 3" opacity=".8"/></g>`;
}).join('')}`, '', 'preserveAspectRatio="none"');
const SKULL = (ink) => `<path d="M24 6 C12 6 6 14 6 22 C6 30 10 33 14 35 V42 H34 V35 C38 33 42 30 42 22 C42 14 36 6 24 6Z" fill="#FFF8F0" stroke="${ink}" stroke-width="2.2"/>
  <circle cx="17" cy="23" r="5" fill="#2EC4B6" stroke="${ink}" stroke-width="1.6"/><circle cx="31" cy="23" r="5" fill="#E8336E" stroke="${ink}" stroke-width="1.6"/>
  <path d="M24 28 L21 33 H27Z" fill="${ink}"/><path d="M18 38 V42 M22 38 V42 M26 38 V42 M30 38 V42" stroke="${ink}" stroke-width="1.4"/>
  <g fill="#FFC21A">${[[24, 11], [12, 15], [36, 15]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2"/>`).join('')}</g>`;

Object.assign(WORLD_THEMES, {
  // 🇳🇴 Норвегія — полярні сутінки: фіорд, північне сяйво, червоні рорбу, сніжні гори
  c11: {
    name: 'fjord', bg1: '#0F2547', bg2: '#1F5470', bg3: '#5FD9B0',
    accent: '#2FD9A0', accent2: '#D7263D', accentSoft: '#C9F7E6', soft: '#E4F2FA',
    ink: '#10223A', ink2: '#44607A', card: '#FAFDFF', card2: '#E6F3FA',
    glow: 'rgba(80, 240, 180, .55)', on: '#F2FBFF', on2: '#BFE0EA', onDark: '#F2FBFF', on2Dark: '#BFE0EA',
    btn1: '#7DF0C8', btn2: '#1F8A9A', road: '#E8F2F8', roadEdge: '#10223A', roadDone: '#2FD9A0',
    r: '18px', rBtn: '16px', font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['snow', 'twinkle', 'snow'], header: '#0F2547',
  },
  // 🇲🇽 Мексика — сонячна пустеля: рожевий мексикано, бірюза, кукурудзяне жовте, папель-пікадо
  c12: {
    name: 'fiesta', bg1: '#FF9A4A', bg2: '#FFD978', bg3: '#2EC4B6',
    accent: '#E8336E', accent2: '#0F9D6A', accentSoft: '#FFD3E2', soft: '#FFF0DA',
    ink: '#3A1630', ink2: '#6E4560', card: '#FFFBF4', card2: '#FFEFD9',
    glow: 'rgba(255, 120, 170, .55)', on: '#3A1630', on2: '#6E4560', onDark: '#FFF6EE', on2Dark: '#F2D2DE',
    btn1: '#FF8AB4', btn2: '#E8336E', road: '#F6E2C2', roadEdge: '#3A1630', roadDone: '#2EC4B6',
    r: '22px 22px 10px 10px', rBtn: '18px', font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['petal', 'glint', 'pollen'], header: '#FF9A4A',
  },
});

Object.assign(SCENES, {
  c11: () => `
    <div class="wd-c11-aurora">${svg('0 0 400 140', AURORA, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c11-stars">${svg('0 0 400 100', Array.from({ length: 22 }, (_, i) => `<circle cx="${(i * 97) % 400}" cy="${(i * 53) % 90 + 4}" r="${i % 4 ? 1.1 : 1.8}" fill="#FFFFFF" opacity="${i % 3 ? 0.6 : 0.95}"/>`).join(''), '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c11-mts">${svg('0 0 400 140', `<path d="M0 140 L0 70 L40 40 L80 78 L130 14 L180 70 L220 50 L270 96 L320 20 L370 64 L400 46 V140Z" fill="#3E5E86"/>
      <path d="M130 14 L112 40 L124 36 L132 46 L142 34 L154 42Z M320 20 L302 46 L314 42 L322 52 L332 40 L344 48Z M40 40 L28 54 L40 52 L50 58Z" fill="#F4FAFF"/>
      <path d="M0 140 V98 L60 74 L110 104 L170 80 L240 110 L300 84 L360 108 L400 92 V140Z" fill="#2A4668"/>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c11-fjord">${svg('0 0 400 60', `<rect width="400" height="60" fill="#1E5A7A"/><rect width="400" height="14" fill="#3E86A8"/>
      <g fill="#7DF0C8" opacity=".25"><rect x="60" y="20" width="90" height="3" rx="1.5"/><rect x="220" y="30" width="120" height="3" rx="1.5"/></g>`, '', 'preserveAspectRatio="none"')}
      <div class="wd-wave wv1">${svg('0 0 480 20', WAVES('#BFE8F6', 0.5), '', 'preserveAspectRatio="none"')}</div>
      <div class="wd-c11-boat">${svg('0 0 140 60', DRAKKAR)}</div></div>
    <div class="wd-ground">${svg('0 0 400 150', `<path d="M0 30 C70 18 150 36 220 26 C300 16 350 32 400 24 V150 H0Z" fill="#EAF4FA"/>
      <path d="M0 76 C90 64 190 86 280 74 C340 66 380 78 400 74 V150 H0Z" fill="#D2E6F2"/>` + pines(400, 60, 10, '#1E4A3E', 0.9, 7), '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c11-houses">${svg('0 0 200 70', RORBU(6, 20, 46) + RORBU(60, 12, 54, '#E0A82E') + RORBU(124, 22, 44) + RORBU(170, 30, 30, '#F4F0E6'), '', 'preserveAspectRatio="xMidYMax meet"')}</div>`,

  c12: () => `${SUNB('#FFC23A')}
    <div class="wd-c12-picado">${PICADO(['#E8336E', '#2EC4B6', '#FFC21A', '#8A4FFF', '#FF7A2E', '#0F9D6A'])}</div>
    <div class="wd-c12-mesa">${svg('0 0 400 80', `<path d="M0 80 V44 L30 44 L40 30 H110 L120 46 H210 L224 26 H300 L312 44 H400 V80Z" fill="#E8A86A"/>
      <path d="M40 30 H110 L114 36 H36Z M224 26 H300 L304 32 H220Z" fill="#F6C890"/>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c12-pyramid">${svg('0 0 200 100', PYRAMID())}</div>
    <div class="wd-ground">${svg('0 0 400 150', `<path d="M0 24 C70 14 150 30 220 22 C300 14 350 28 400 20 V150 H0Z" fill="#F6D8A2"/>
      <path d="M0 80 C90 68 190 88 280 78 C340 72 380 82 400 78 V150 H0Z" fill="#EEC388"/>
      <g fill="#D99A5A" opacity=".55">${Array.from({ length: 12 }, (_, i) => `<ellipse cx="${18 + i * 34}" cy="${100 + (i % 3) * 14}" rx="6" ry="2"/>`).join('')}</g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c12-town">${svg('0 0 400 80', [[0, 30, 56, '#E8336E'], [56, 18, 50, '#2EC4B6'], [106, 34, 60, '#FFC21A'], [166, 22, 46, '#8A4FFF'], [212, 38, 58, '#FF7A2E'], [270, 26, 52, '#0F9D6A'], [322, 34, 78, '#3E8EE8']].map(([x, y, w, c]) =>
      `<rect x="${x}" y="${y}" width="${w}" height="${80 - y}" fill="${c}"/><rect x="${x}" y="${y}" width="${w}" height="5" fill="#FFF6E6" opacity=".7"/>
      <path d="M${x + w * 0.35} 80 V${y + 30} C${x + w * 0.35} ${y + 22} ${x + w * 0.65} ${y + 22} ${x + w * 0.65} ${y + 30} V80Z" fill="#5A2E1E"/>
      <rect x="${x + 6}" y="${y + 12}" width="9" height="11" rx="4.5" fill="#FFF6E6"/><rect x="${x + w - 15}" y="${y + 12}" width="9" height="11" rx="4.5" fill="#FFF6E6"/>`).join(''), '', 'preserveAspectRatio="xMidYMax slice"')}</div>
    <div class="wd-c12-cactus k1">${svg('0 0 80 120', CACTUS())}</div>
    <div class="wd-c12-cactus k2">${svg('0 0 80 120', CACTUS('#3EAE6A', '#2A8A50'))}</div>`,
});

Object.assign(CB_ART, {
  c11: {
    medal: (t, ink) => `<circle r="54" fill="#0F2547" stroke="${ink}" stroke-width="3"/>
      ${Array.from({ length: 16 }, (_, i) => `<g transform="rotate(${i * 22.5}) translate(0 -49)"><path d="M0 -4 V4 M-3.5 -2 L3.5 2 M-3.5 2 L3.5 -2" stroke="${i % 2 ? '#7DF0C8' : '#FFFFFF'}" stroke-width="1.8" stroke-linecap="round"/></g>`).join('')}
      <circle r="43" fill="#E6F6FA" stroke="${ink}" stroke-width="2.4"/>
      <g transform="translate(37 38)"><rect x="-9" y="-6" width="18" height="12" fill="#D7263D" stroke="${ink}" stroke-width="1.6"/><path d="M-4 -6 V6 M-9 0 H9" stroke="#FFFFFF" stroke-width="3.4"/><path d="M-4 -6 V6 M-9 0 H9" stroke="#1F3A8A" stroke-width="1.6"/></g>`,
    pedestal: (ink) => `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#3E5E86" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#F4FAFF" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="50" rx="50" ry="9" fill="#3E86A8" stroke="${ink}" stroke-width="2.4"/>
      <g stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M22 52 V36 L32 28 L42 36 V52Z" fill="#D7263D"/><path d="M196 50 L206 22 L216 50Z" fill="#1E4A3E"/></g>
      <path d="M60 34 C90 22 150 22 180 34" fill="none" stroke="#3EF0A8" stroke-width="3" opacity=".6"/>`,
    emblem: (ink) => `<path d="M6 40 L18 16 L26 28 L32 20 L42 40Z" fill="#3E5E86" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M18 16 L14 24 L19 23 L22 26Z" fill="#FFFFFF"/><path d="M4 12 C14 4 30 14 44 6" fill="none" stroke="#3EF0A8" stroke-width="3" stroke-linecap="round"/>
      <path d="M4 18 C16 12 30 20 44 12" fill="none" stroke="#B07CFF" stroke-width="2" stroke-linecap="round" opacity=".8"/>`,
    props: () => [
      svg('0 0 60 90', pines(60, 90, 2, '#1E4A3E', 0.95, 5)),
      svg('0 0 60 50', RORBU(4, 2, 50)),
      svg('0 0 140 60', DRAKKAR, '', 'opacity=".95"'),
    ],
    chapter: (st, num) => `<g ${st}><path d="M2 62 L20 22 L32 40 L42 26 L62 62Z" fill="#3E5E86"/></g><path d="M20 22 L14 34 L21 32 L25 36Z M42 26 L37 34 L43 33Z" fill="#FFFFFF"/>
      <path d="M2 10 C18 2 40 16 62 6" fill="none" stroke="#3EF0A8" stroke-width="3" stroke-linecap="round"/>
      <rect x="20" y="42" width="24" height="18" rx="5" fill="#FAFDFF" stroke="#10223A" stroke-width="2"/>${num(32, 56)}`,
  },
  c12: {
    medal: (t, ink) => `<circle r="54" fill="#E8336E" stroke="${ink}" stroke-width="3"/>
      ${Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30})" d="M-7 -53 H7 V-46 L3.5 -44 L0 -46 L-3.5 -44 L-7 -46Z" fill="${['#FFC21A', '#2EC4B6', '#FFFFFF', '#8A4FFF'][i % 4]}" stroke="${ink}" stroke-width="1.2"/>`).join('')}
      <circle r="42" fill="#FFF3DC" stroke="${ink}" stroke-width="2.4"/>
      <g transform="translate(26 26) scale(.5)">${SKULL(ink)}</g>`,
    pedestal: (ink) => `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#D99A5A" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#F6D8A2" stroke="${ink}" stroke-width="3.5"/>
      <g fill="none" stroke="#E8336E" stroke-width="3" opacity=".7"><path d="M44 46 l8 -5 l8 5 l8 -5 l8 5 l8 -5 l8 5 l8 -5 l8 5 l8 -5 l8 5 l8 -5 l8 5 l8 -5 l8 5 l8 -5 l8 5 l8 -5 l8 5"/></g>
      <g stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M24 54 V30 C24 24 32 24 32 30 V54Z M24 42 H18 V34" fill="#2E9A5A"/>
      <path d="M196 52 C196 40 220 40 220 52Z" fill="#8A4FFF"/><path d="M190 52 H226" fill="none"/></g>`,
    emblem: (ink) => `<path d="M8 22 C8 12 40 12 40 22 L44 26 H4Z" fill="#FFC21A" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M16 22 C16 8 32 8 32 22Z" fill="#E8336E" stroke="${ink}" stroke-width="2.2"/><path d="M4 26 H44" stroke="#2EC4B6" stroke-width="3"/>
      <path d="M10 34 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4" fill="none" stroke="#0F9D6A" stroke-width="2.4" stroke-linecap="round"/>`,
    props: () => [
      svg('0 0 80 120', CACTUS()),
      svg('0 0 48 48', SKULL('#3A1630')),
      svg('0 0 200 100', PYRAMID('#E3B470', '#C08A48'), '', 'opacity=".9"'),
    ],
    chapter: (st, num) => `<g ${st}><path d="M6 62 V50 H14 V40 H22 V30 H42 V40 H50 V50 H58 V62Z" fill="#D9A55A"/></g>
      <path d="M2 8 H62" stroke="#5A3A3A" stroke-width="1.2"/><g>${['#E8336E', '#2EC4B6', '#FFC21A', '#8A4FFF'].map((c, i) => `<path d="M${4 + i * 15} 8 h12 v12 l-6 3 l-6 -3Z" fill="${c}"/>`).join('')}</g>
      <rect x="20" y="42" width="24" height="18" rx="5" fill="#FFFBF4" stroke="#3A1630" stroke-width="2"/>${num(32, 56)}`,
  },
});

// ═════════════════════════════════════════════════════════ v23 · країни c13 🇬🇷 Греція · c14 🇹🇭 Таїланд
// Ті самі хуки, що й c11/c12: палітра → WORLD_THEMES, сцена → SCENES, рамка/постамент/емблема/декор/розділ → CB_ART.
const CYCLADIC = (x, y, w, h, dome = true) => `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" fill="#FFFFFF"/>
  <rect width="${w}" height="3" fill="#E4EEF8"/>${dome ? `<path d="M${w * 0.2} 0 C${w * 0.2} ${-w * 0.42} ${w * 0.8} ${-w * 0.42} ${w * 0.8} 0Z" fill="#1E5FB8"/><path d="M${w / 2} ${-w * 0.32} V${-w * 0.48}" stroke="#F2F6FA" stroke-width="2"/>` : ''}
  <rect x="${w * 0.18}" y="${h * 0.3}" width="${w * 0.2}" height="${h * 0.26}" rx="${w * 0.1}" fill="#1E5FB8"/><rect x="${w * 0.56}" y="${h * 0.48}" width="${w * 0.24}" height="${h * 0.52}" rx="${w * 0.12}" fill="#2E7BD6"/></g>`;
const RUINS = (f = '#E9DFC8', d = '#C9B998') => `<path d="M8 22 L100 2 L192 22Z" fill="${f}"/><rect x="6" y="22" width="188" height="10" fill="${d}"/>
  ${[18, 50, 82, 118, 150, 182].map((x, i) => (i === 4 ? `<rect x="${x - 7}" y="52" width="14" height="44" fill="${f}"/><path d="M${x - 7} 52 l5 -6 l4 4 l5 -5 V52Z" fill="${f}"/>`
    : `<rect x="${x - 7}" y="32" width="14" height="64" fill="${f}"/><rect x="${x - 10}" y="32" width="20" height="5" fill="${d}"/><path d="M${x - 2} 38 V94 M${x + 3} 38 V94" stroke="${d}" stroke-width="1.3" opacity=".7"/>`)).join('')}
  <rect x="0" y="94" width="200" height="6" fill="${d}"/>`;
const OLIVE = (c = '#6E8F4A', d = '#4E6A34') => `<path d="M38 100 C40 84 34 74 40 62 M40 72 C48 66 52 60 52 52" fill="none" stroke="#6A5236" stroke-width="5" stroke-linecap="round"/>
  <g fill="${c}"><ellipse cx="40" cy="38" rx="26" ry="18"/><ellipse cx="22" cy="50" rx="16" ry="11"/><ellipse cx="58" cy="48" rx="16" ry="12"/></g>
  <g fill="${d}" opacity=".7"><ellipse cx="30" cy="42" rx="9" ry="4"/><ellipse cx="52" cy="38" rx="8" ry="3.5"/><ellipse cx="44" cy="54" rx="9" ry="3.5"/></g>
  <g fill="#3A3A5A">${[[26, 46], [48, 44], [36, 56], [60, 52]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="3"/>`).join('')}</g>`;
const AMPHORA = (ink = '#5A2A14') => `<path d="M18 4 H30 V10 C40 16 42 30 36 40 L32 46 H16 L12 40 C6 30 8 16 18 10Z" fill="#D9792E" stroke="${ink}" stroke-width="2"/>
  <path d="M18 12 C10 12 8 20 14 22 M30 12 C38 12 40 20 34 22" fill="none" stroke="${ink}" stroke-width="2"/>
  <path d="M11 26 H37" stroke="${ink}" stroke-width="3"/><path d="M12 30 l4 -3 l4 3 l4 -3 l4 3 l4 -3 l4 3" fill="none" stroke="${ink}" stroke-width="1.6"/>`;
const WAT = (g = '#E6B422', r = '#C8102E', w = '#FFF4DA') => `<rect x="34" y="70" width="132" height="30" fill="${w}"/>
  ${[[20, 70, 160, 22], [36, 50, 128, 22], [56, 32, 88, 20]].map(([x, y, ww, h]) => `<path d="M${x} ${y} L${x + 10} ${y - h} H${x + ww - 10} L${x + ww} ${y}Z" fill="${r}"/><path d="M${x} ${y} L${x + 10} ${y - h} M${x + ww} ${y} L${x + ww - 10} ${y - h}" stroke="${g}" stroke-width="3"/>
    <path d="M${x - 2} ${y} q-6 -2 -6 -10 M${x + ww + 2} ${y} q6 -2 6 -10" fill="none" stroke="${g}" stroke-width="3" stroke-linecap="round"/>`).join('')}
  <path d="M100 2 V14" stroke="${g}" stroke-width="3"/><g fill="${g}">${[48, 72, 100, 128, 152].map((x) => `<rect x="${x - 4}" y="74" width="8" height="26"/>`).join('')}</g>
  <path d="M90 100 V84 C90 76 110 76 110 84 V100Z" fill="#5A2A14"/>`;
const CHEDI = (g = '#E6B422', d = '#B8860B') => `<path d="M50 2 C49 18 46 26 46 30 H54 C54 26 51 18 50 2Z" fill="${g}"/>
  ${[0, 1, 2, 3].map((i) => `<ellipse cx="50" cy="${32 + i * 4}" rx="${6 + i * 1.6}" ry="2" fill="${i % 2 ? d : g}"/>`).join('')}
  <path d="M28 76 C28 56 38 46 50 46 C62 46 72 56 72 76Z" fill="${g}"/><path d="M36 74 C36 58 44 50 50 50" fill="none" stroke="#FFF2B0" stroke-width="3" opacity=".6"/>
  <rect x="20" y="76" width="60" height="8" fill="${d}"/><rect x="14" y="84" width="72" height="16" fill="${g}"/><path d="M14 92 H86" stroke="${d}" stroke-width="2"/>`;
const TPALM = (c = '#1F9A6A', d = '#147A50') => `<path d="M44 120 C46 96 42 70 50 40" fill="none" stroke="#8A5A30" stroke-width="7" stroke-linecap="round"/>
  <path d="M44 120 C46 96 42 70 50 40" fill="none" stroke="#A8743E" stroke-width="7" stroke-dasharray="3 6" opacity=".6"/>
  ${[[-70, c], [-30, d], [10, c], [50, d], [90, c], [140, d]].map(([a, col]) => `<path transform="rotate(${a} 50 40)" d="M50 40 C64 26 84 24 98 34 C84 32 70 36 50 42Z" fill="${col}"/>`).join('')}
  <g fill="#7A4A1E"><circle cx="46" cy="46" r="4.5"/><circle cx="54" cy="47" r="4.5"/></g>`;
const LONGTAIL = (hull = '#8A4A1E', roof = '#E6B422', goods = ['#FFC21A', '#FF6B3D', '#3EAE6A']) => `<path d="M6 30 C24 42 96 42 124 26 L116 24 C90 32 34 32 14 26Z" fill="${hull}"/>
  <path d="M6 30 C2 22 4 14 10 10 C10 18 12 24 16 27Z" fill="${hull}"/><path d="M20 28 H112" stroke="#F2C14A" stroke-width="2"/>
  ${goods.map((g, i) => `<circle cx="${40 + i * 14}" cy="24" r="6" fill="${g}"/>`).join('')}
  <path d="M84 24 C84 12 106 12 106 24Z" fill="${roof}"/><path d="M95 14 V8" stroke="${roof}" stroke-width="2"/>`;
const LANTERNS = (cols, n = 9) => svg('0 0 400 60', `<path d="M0 6 Q200 26 400 6" fill="none" stroke="#5A2A14" stroke-width="1.4"/>${Array.from({ length: n }, (_, i) => {
  const x = (i + 0.5) * (400 / n), y = 6 + Math.sin((x / 400) * Math.PI) * 10, c = cols[i % cols.length];
  return `<g class="ln"><path d="M${x} ${y.toFixed(1)} v4" stroke="#5A2A14" stroke-width="1.2"/><ellipse cx="${x}" cy="${(y + 15).toFixed(1)}" rx="9" ry="11" fill="${c}"/>
    <path d="M${x - 9} ${(y + 15).toFixed(1)} h18" stroke="#FFF2B0" stroke-width="1" opacity=".6"/><rect x="${x - 4}" y="${(y + 3).toFixed(1)}" width="8" height="2.4" fill="#E6B422"/>
    <rect x="${x - 4}" y="${(y + 25).toFixed(1)}" width="8" height="2.4" fill="#E6B422"/><path d="M${x} ${(y + 27).toFixed(1)} v6" stroke="${c}" stroke-width="1.6"/></g>`;
}).join('')}`, '', 'preserveAspectRatio="none"');
const ELEPHANT = (c = '#E6B422', ink = '#5A2A14') => `<path d="M10 40 C8 22 20 10 36 10 C50 10 58 18 60 28 C64 28 66 34 64 40 V54 C64 58 58 58 58 54 V46 H48 V54 C48 58 42 58 42 54 V46 H26 V54 C26 58 20 58 20 54 V46 C14 46 10 44 10 40Z" fill="${c}" stroke="${ink}" stroke-width="2"/>
  <path d="M60 28 C68 32 70 44 66 52 C64 56 60 54 62 50 C64 44 62 38 58 36" fill="${c}" stroke="${ink}" stroke-width="2"/>
  <path d="M40 16 C30 16 26 26 30 34 C36 36 44 32 44 24" fill="#C8961E" stroke="${ink}" stroke-width="1.6"/><circle cx="52" cy="24" r="2.2" fill="${ink}"/>
  <path d="M20 12 H44 L40 6 H24Z" fill="#C8102E" stroke="${ink}" stroke-width="1.4"/>`;

Object.assign(WORLD_THEMES, {
  // 🇬🇷 Греція — Егейський полудень: білі будиночки з синіми куполами, море, оливи, руїни храму
  c13: {
    name: 'aegean', bg1: '#5AA6EC', bg2: '#A9D6F6', bg3: '#FFFFFF',
    accent: '#1E5FB8', accent2: '#F2B53A', accentSoft: '#D6E8FB', soft: '#EEF6FF',
    ink: '#0E2348', ink2: '#4A6080', card: '#FFFFFF', card2: '#EAF3FC',
    glow: 'rgba(80, 160, 255, .5)', on: '#0E2348', on2: '#3E5678', onDark: '#F4F9FF', on2Dark: '#C4D8F0',
    btn1: '#6FB4FF', btn2: '#1E5FB8', road: '#FAF6EC', roadEdge: '#0E2348', roadDone: '#F2B53A',
    r: '14px', rBtn: '14px', font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['glint', 'pollen', 'glint'], header: '#2E7BD6',
  },
  // 🇹🇭 Таїланд — золотий вечір: храми, пальми, плавучий ринок, ліхтарики
  c14: {
    name: 'siam', bg1: '#FF8A3D', bg2: '#FFC94A', bg3: '#1FA38A',
    accent: '#D9480F', accent2: '#1FA38A', accentSoft: '#FFE2B8', soft: '#FFF4E0',
    ink: '#3A1A08', ink2: '#7A4A2A', card: '#FFFBF2', card2: '#FFF0D6',
    glow: 'rgba(255, 190, 60, .55)', on: '#3A1A08', on2: '#6A3E1E', onDark: '#FFF6E6', on2Dark: '#F2D6B0',
    btn1: '#FFC94A', btn2: '#E07A10', road: '#F6E6C4', roadEdge: '#3A1A08', roadDone: '#1FA38A',
    r: '20px 6px 20px 6px', rBtn: '16px', font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['glint', 'petal', 'firefly'], header: '#FF8A3D',
  },
});

Object.assign(SCENES, {
  c13: () => `${SUNB('#FFD45A')}
    <div class="wd-c13-sea">${svg('0 0 400 60', `<rect width="400" height="60" fill="#1E6FC8"/><rect width="400" height="12" fill="#3E92E0"/>
      <g fill="#FFFFFF" opacity=".35"><rect x="40" y="22" width="80" height="3" rx="1.5"/><rect x="230" y="34" width="110" height="3" rx="1.5"/><rect x="150" y="46" width="60" height="2.5" rx="1.2"/></g>`, '', 'preserveAspectRatio="none"')}
      <div class="wd-wave wv1">${svg('0 0 480 20', WAVES('#E6F4FF', 0.6), '', 'preserveAspectRatio="none"')}</div>
      <div class="wd-c13-sail">${svg('0 0 60 50', '<path d="M8 38 H52 L46 46 H14Z" fill="#8A5A30"/><path d="M30 38 V4" stroke="#5A3A1A" stroke-width="2"/><path d="M31 6 L50 34 H31Z" fill="#FFFFFF"/><path d="M29 10 L14 34 H29Z" fill="#E4EEF8"/>')}</div></div>
    <div class="wd-c13-ruins">${svg('0 0 200 100', RUINS())}</div>
    <div class="wd-ground">${svg('0 0 400 150', `<path d="M0 22 C70 12 150 30 220 20 C300 12 350 26 400 18 V150 H0Z" fill="#E9DFC8"/>
      <path d="M0 78 C90 66 190 86 280 76 C340 70 380 80 400 76 V150 H0Z" fill="#D9C9A6"/>
      <g fill="#B8A684" opacity=".5">${Array.from({ length: 10 }, (_, i) => `<ellipse cx="${20 + i * 40}" cy="${98 + (i % 3) * 14}" rx="7" ry="2.4"/>`).join('')}</g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c13-town">${svg('0 0 200 80', `<path d="M0 80 V44 C30 36 60 40 90 30 C130 18 170 24 200 34 V80Z" fill="#D9C9A6"/>
      ${CYCLADIC(8, 46, 30, 30) + CYCLADIC(42, 40, 26, 22, false) + CYCLADIC(72, 30, 34, 32) + CYCLADIC(110, 26, 28, 26, false) + CYCLADIC(142, 32, 34, 30) + CYCLADIC(178, 44, 20, 24, false)}`, '', 'preserveAspectRatio="xMidYMax meet"')}</div>
    <div class="wd-c13-olive k1">${svg('0 0 80 100', OLIVE())}</div>
    <div class="wd-c13-olive k2">${svg('0 0 80 100', OLIVE('#86A85C', '#5E7E40'))}</div>`,

  c14: () => `${SUNB('#FFB23A')}
    <div class="wd-c14-lanterns">${LANTERNS(['#E8331E', '#FFC21A', '#FF7A2E', '#E8336E'])}</div>
    <div class="wd-c14-temples">${svg('0 0 400 100', `<g opacity=".95">${'<g transform="translate(10 6) scale(.9)">' + CHEDI() + '</g>'}<g transform="translate(110 0)">${WAT()}</g>
      <g transform="translate(300 10) scale(.85)">${CHEDI('#F2C14A', '#C8961E')}</g></g>`, '', 'preserveAspectRatio="xMidYMax meet"')}</div>
    <div class="wd-c14-canal">${svg('0 0 400 60', `<rect width="400" height="60" fill="#1F8A7A"/><rect width="400" height="10" fill="#3EB49A"/>
      <g fill="#FFE9A8" opacity=".3"><rect x="30" y="22" width="90" height="3" rx="1.5"/><rect x="240" y="38" width="100" height="3" rx="1.5"/></g>`, '', 'preserveAspectRatio="none"')}
      <div class="wd-wave wv1">${svg('0 0 480 20', WAVES('#BFF2E0', 0.5), '', 'preserveAspectRatio="none"')}</div>
      <div class="wd-c14-boat">${svg('0 0 130 46', LONGTAIL())}</div>
      <div class="wd-c14-boat b2">${svg('0 0 130 46', LONGTAIL('#6A3A1E', '#E8331E', ['#FF6B3D', '#B5179E', '#FFC21A']))}</div></div>
    <div class="wd-ground">${svg('0 0 400 150', `<path d="M0 26 C70 16 150 32 220 24 C300 16 350 30 400 22 V150 H0Z" fill="#7CC46A"/>
      <path d="M0 80 C90 68 190 88 280 78 C340 72 380 82 400 78 V150 H0Z" fill="#5EAE58"/>
      <g fill="#E8336E" opacity=".8">${Array.from({ length: 9 }, (_, i) => `<circle cx="${24 + i * 44}" cy="${100 + (i % 3) * 14}" r="3"/>`).join('')}</g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c14-palm k1">${svg('0 0 100 120', TPALM())}</div>
    <div class="wd-c14-palm k2">${svg('0 0 100 120', TPALM('#2EAE7A', '#1F8A5A'))}</div>`,
});

Object.assign(CB_ART, {
  c13: {
    medal: (t, ink) => `<circle r="54" fill="#1E5FB8" stroke="${ink}" stroke-width="3"/>
      <circle r="48" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-dasharray="7 3 3 3"/>
      <circle r="42" fill="#F4F9FF" stroke="${ink}" stroke-width="2.4"/>
      <g fill="#6E8F4A">${Array.from({ length: 7 }, (_, i) => `<ellipse transform="rotate(${-150 + i * 18}) translate(0 -36)" rx="3" ry="7"/><ellipse transform="rotate(${150 - i * 18}) translate(0 -36)" rx="3" ry="7"/>`).join('')}</g>
      <g transform="translate(37 38)"><rect x="-9" y="-6" width="18" height="12" fill="#1E5FB8" stroke="${ink}" stroke-width="1.6"/><path d="M-9 -2 H9 M-9 2 H9" stroke="#FFFFFF" stroke-width="1.4"/><rect x="-9" y="-6" width="8" height="6" fill="#1E5FB8"/><path d="M-5 -6 V0 M-9 -3 H-1" stroke="#FFFFFF" stroke-width="1.4"/></g>`,
    pedestal: (ink) => `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#1E6FC8" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#F4EEDD" stroke="${ink}" stroke-width="3.5"/>
      <g fill="none" stroke="#1E5FB8" stroke-width="3" opacity=".75"><path d="M40 46 h8 v-6 h-5 v3 M58 46 h8 v-6 h-5 v3 M76 46 h8 v-6 h-5 v3 M152 46 h8 v-6 h-5 v3 M170 46 h8 v-6 h-5 v3 M188 46 h8 v-6 h-5 v3"/></g>
      <g stroke="${ink}" stroke-width="2" stroke-linejoin="round"><rect x="18" y="26" width="10" height="28" fill="#FFFFFF"/><rect x="15" y="22" width="16" height="5" fill="#E9DFC8"/>
      <path d="M200 52 V36 H222 V52Z" fill="#FFFFFF"/><path d="M204 36 C204 26 218 26 218 36Z" fill="#1E5FB8"/></g>`,
    emblem: (ink) => `<path d="M6 16 L24 6 L42 16Z" fill="#F4EEDD" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>
      <g fill="#FFFFFF" stroke="${ink}" stroke-width="2">${[11, 21, 31].map((x) => `<rect x="${x}" y="17" width="6" height="18"/>`).join('')}</g>
      <path d="M4 36 H44" stroke="${ink}" stroke-width="2.4"/><path d="M4 42 q5 -4 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#1E5FB8" stroke-width="2.6" stroke-linecap="round"/>`,
    props: () => [
      svg('0 0 80 100', OLIVE()),
      svg('0 0 48 50', AMPHORA()),
      svg('0 0 200 100', RUINS(), '', 'opacity=".92"'),
    ],
    chapter: (st, num) => `<g ${st}><path d="M6 24 L32 10 L58 24Z" fill="#F4EEDD"/><g fill="#FFFFFF">${[10, 22, 36, 48].map((x) => `<rect x="${x}" y="25" width="6" height="16"/>`).join('')}</g></g>
      <path d="M2 6 q5 -4 10 0 t10 0 t10 0 t10 0 t10 0 t10 0" fill="none" stroke="#1E5FB8" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="20" y="42" width="24" height="18" rx="5" fill="#FFFFFF" stroke="#0E2348" stroke-width="2"/>${num(32, 56)}`,
  },
  c14: {
    medal: (t, ink) => `<circle r="54" fill="#E6B422" stroke="${ink}" stroke-width="3"/>
      ${Array.from({ length: 16 }, (_, i) => `<path transform="rotate(${i * 22.5})" d="M0 -53 C4 -48 4 -45 0 -42 C-4 -45 -4 -48 0 -53Z" fill="${i % 2 ? '#C8102E' : '#FFF4DA'}" stroke="${ink}" stroke-width="1"/>`).join('')}
      <circle r="40" fill="#FFF4DA" stroke="${ink}" stroke-width="2.4"/>
      <g transform="translate(22 24) scale(.42)">${ELEPHANT('#E6B422', ink)}</g>`,
    pedestal: (ink) => `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#1F8A7A" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#FFE2A8" stroke="${ink}" stroke-width="3.5"/>
      <g fill="none" stroke="#C8102E" stroke-width="2.6" opacity=".75"><path d="M40 46 c4 -6 8 -6 12 0 c4 -6 8 -6 12 0 c4 -6 8 -6 12 0 c4 -6 8 -6 12 0 M140 46 c4 -6 8 -6 12 0 c4 -6 8 -6 12 0 c4 -6 8 -6 12 0 c4 -6 8 -6 12 0"/></g>
      <g stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M16 54 C16 40 22 34 26 34 C30 34 36 40 36 54Z" fill="#E6B422"/><path d="M26 34 V20" fill="none"/>
      <ellipse cx="212" cy="40" rx="8" ry="10" fill="#E8331E"/><path d="M212 30 V22 M212 50 V56" fill="none"/></g>`,
    emblem: (ink) => `<path d="M24 2 V8" stroke="#E6B422" stroke-width="2.4"/><path d="M6 24 L12 14 H36 L42 24Z M10 34 L16 24 H32 L38 34Z" fill="#C8102E" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M14 14 L18 8 H30 L34 14Z" fill="#E6B422" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
      <rect x="12" y="34" width="24" height="10" fill="#FFF4DA" stroke="${ink}" stroke-width="2"/><path d="M4 24 q-2 -4 0 -8 M44 24 q2 -4 0 -8" fill="none" stroke="#E6B422" stroke-width="2.4" stroke-linecap="round"/>`,
    props: () => [
      svg('0 0 100 120', TPALM()),
      svg('0 0 74 60', ELEPHANT()),
      svg('0 0 100 100', CHEDI(), '', 'opacity=".95"'),
    ],
    chapter: (st, num) => `<g ${st}><path d="M32 4 C31 16 28 22 28 26 H36 C36 22 33 16 32 4Z M18 46 C18 34 24 28 32 28 C40 28 46 34 46 46Z" fill="#E6B422"/><rect x="12" y="46" width="40" height="6" fill="#B8860B"/></g>
      <path d="M2 6 Q32 16 62 6" fill="none" stroke="#5A2A14" stroke-width="1.2"/><g>${['#E8331E', '#FFC21A', '#FF7A2E'].map((c, i) => `<ellipse cx="${12 + i * 20}" cy="${12 + (i === 1 ? 3 : 0)}" rx="4" ry="5" fill="${c}"/>`).join('')}</g>
      <rect x="20" y="42" width="24" height="18" rx="5" fill="#FFFBF2" stroke="#3A1A08" stroke-width="2"/>${num(32, 56)}`,
  },
});

// ═════════════════════════════════════════════════════════ v24 · країна c19 🇬🇪 Грузія
// Гори Кавказу зі сніговими вершинами й церквою-силуетом, старе місто з різьбленими балконами, фортеця на пагорбі, виноградна лоза.
const KAVKAZ = (f = '#5A6FA8', d = '#3E5288', snow = '#FFFFFF') => `<path d="M0 100 L40 52 L62 66 L104 14 L132 44 L156 30 L200 78 L236 40 L270 60 L312 22 L350 58 L400 36 V100Z" fill="${f}"/>
  <path d="M104 14 L132 44 L120 40 L112 48 L104 38 L94 46 L88 36Z M312 22 L330 39 L322 38 L314 44 L306 36 L298 40Z M236 40 L250 50 L242 50 L234 54 L226 50Z M40 52 L50 60 L42 60 L34 62Z" fill="${snow}"/>
  <g transform="translate(170 52)" fill="#2E3A5E"><path d="M-14 26 C-6 18 6 18 14 26Z" fill="#6A8A5A"/><rect x="-7" y="6" width="14" height="14"/><path d="M-8 6 L0 -2 L8 6Z"/><rect x="-3" y="-10" width="6" height="9"/><path d="M-4 -10 L0 -15 L4 -10Z"/><rect x="8" y="10" width="7" height="10"/></g>`;
const BALCONY = (x, y, w, h, wall = '#F2D9B0', wood = '#8A4A22', roof = '#B5462A') => `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" fill="${wall}"/>
  <path d="M-3 0 L${w / 2} -10 L${w + 3} 0Z" fill="${roof}"/>
  <rect x="-2" y="${h * 0.26}" width="${w + 4}" height="${h * 0.34}" fill="${wood}"/><rect x="-2" y="${h * 0.26}" width="${w + 4}" height="2.4" fill="#5A2A12"/>
  ${Array.from({ length: Math.max(2, Math.floor(w / 6)) }, (_, i) => `<path d="M${2 + i * 6} ${h * 0.6} V${h * 0.36} M${i * 6 - 1} ${h * 0.4} q3 -3 6 0" fill="none" stroke="#E8C48A" stroke-width="1.3"/>`).join('')}
  <rect x="${w * 0.2}" y="${h * 0.68}" width="${w * 0.22}" height="${h * 0.32}" rx="${w * 0.1}" fill="#4A2A18"/><rect x="${w * 0.6}" y="${h * 0.7}" width="${w * 0.2}" height="${h * 0.18}" fill="#7AA6C8"/></g>`;
const FORTRESS = (f = '#B89A72', d = '#8A6A48') => `<path d="M0 60 C30 30 70 22 120 36 C150 44 170 50 180 60Z" fill="#7A9A5A"/>
  <path d="M30 38 V22 h6 v-4 h4 v4 h6 v-4 h4 v4 h6 V34 H94 V14 h6 v-4 h4 v4 h6 v-4 h4 v4 h6 V40 H140 V30 h5 v-3 h4 v3 h5 V46Z" fill="${f}"/>
  <path d="M30 38 H140 M94 22 H124" stroke="${d}" stroke-width="2" opacity=".7"/><g fill="#4A3220">${[40, 104, 116].map((x) => `<rect x="${x}" y="26" width="3" height="6" rx="1.5"/>`).join('')}</g>`;
const VINE = (leaf = '#5E9A3A', grape = '#6A2A6A') => `<path d="M0 6 C40 18 80 0 120 12 C160 24 200 6 240 14" fill="none" stroke="#6A4626" stroke-width="3.5" stroke-linecap="round"/>
  ${[[18, 12], [70, 8], [128, 14], [190, 14], [228, 14]].map(([x, y], i) => `<g class="vn" transform="translate(${x} ${y})"><path d="M0 0 C-10 2 -14 12 -6 16 C-2 22 8 18 6 10 C14 6 8 -2 0 0Z" fill="${i % 2 ? '#78B04A' : leaf}"/>
    ${i % 2 ? '' : `<g fill="${grape}" transform="translate(10 6)">${[[0, 0], [5, 0], [10, 0], [2.5, 4.5], [7.5, 4.5], [5, 9]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="2.8"/>`).join('')}<circle cx="1" cy="-1" r="1" fill="#E8C0E8"/></g>`}</g>`).join('')}`;
const GCROSS = (r = '#E8112D') => `<rect width="48" height="32" rx="3" fill="#FFFFFF"/><path d="M20 0 H28 V12 H48 V20 H28 V32 H20 V20 H0 V12 H20Z" fill="${r}"/>
  <g fill="${r}">${[[9, 6], [39, 6], [9, 26], [39, 26]].map(([x, y]) => `<path d="M${x - 1} ${y - 4} h2 v3 h3 v2 h-3 v3 h-2 v-3 h-3 v-2 h3Z"/>`).join('')}</g>`;

Object.assign(WORLD_THEMES, {
  // 🇬🇪 Грузія — ранок у Тбілісі: Кавказ, червоні дахи, дерев'яні балкони, виноград
  c19: {
    name: 'kartli', bg1: '#6E8CD8', bg2: '#C8D6F6', bg3: '#F6E9D6',
    accent: '#B3203A', accent2: '#6A2A6A', accentSoft: '#F6D6DC', soft: '#FBF2EE',
    ink: '#2A1420', ink2: '#6A4A56', card: '#FFFDF9', card2: '#F8ECE6',
    glow: 'rgba(179, 32, 58, .4)', on: '#2A1420', on2: '#5A3A46', onDark: '#FFF6F2', on2Dark: '#EAD0D6',
    btn1: '#E8506A', btn2: '#B3203A', road: '#F2E2CC', roadEdge: '#2A1420', roadDone: '#6A2A6A',
    r: '16px 16px 6px 16px', rBtn: '14px', font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['snow', 'glint', 'pollen'], header: '#B3203A',
  },
});

Object.assign(SCENES, {
  c19: () => `${SUNB('#FFE07A')}
    <div class="wd-c19-peaks">${svg('0 0 400 100', KAVKAZ(), '', 'preserveAspectRatio="xMidYMax slice"')}</div>
    <div class="wd-c19-eagle">${svg('0 0 60 24', '<path d="M30 14 C22 4 10 2 0 8 C10 8 18 12 24 18 L30 16 L36 18 C42 12 50 8 60 8 C50 2 38 4 30 14Z" fill="#3A2A2A"/><circle cx="30" cy="13" r="2.4" fill="#F2F2F2"/>')}</div>
    <div class="wd-c19-fort">${svg('0 0 180 60', FORTRESS(), '', 'preserveAspectRatio="xMidYMax meet"')}</div>
    <div class="wd-c19-town">${svg('0 0 220 90', `<path d="M0 90 V50 C40 42 90 46 130 38 C170 32 200 40 220 44 V90Z" fill="#C9A47A"/>
      ${BALCONY(8, 46, 34, 40) + BALCONY(46, 38, 30, 46, '#E8C8A0', '#6A3A1A') + BALCONY(82, 30, 40, 54, '#F6E2C4') + BALCONY(128, 36, 30, 48, '#E0B890', '#7A4422', '#9A3A22') + BALCONY(164, 42, 38, 44, '#F2D9B0', '#5A3A6A')}`, '', 'preserveAspectRatio="xMidYMax meet"')}</div>
    <div class="wd-ground">${svg('0 0 400 150', `<path d="M0 24 C70 14 150 30 220 22 C300 14 350 28 400 20 V150 H0Z" fill="#8AB65A"/>
      <path d="M0 80 C90 68 190 88 280 78 C340 72 380 82 400 78 V150 H0Z" fill="#6E9E48"/>
      <g stroke="#5A3A1E" stroke-width="2" opacity=".55">${Array.from({ length: 8 }, (_, i) => `<path d="M${30 + i * 48} 96 V112 M${22 + i * 48} 100 H${38 + i * 48}"/>`).join('')}</g>
      <g fill="#6A2A6A" opacity=".75">${Array.from({ length: 8 }, (_, i) => `<circle cx="${34 + i * 48}" cy="${104 + (i % 2) * 4}" r="3"/>`).join('')}</g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c19-vine">${svg('0 0 240 40', VINE(), '', 'preserveAspectRatio="none"')}</div>`,
});

Object.assign(CB_ART, {
  c19: {
    medal: (t, ink) => `<circle r="54" fill="#B3203A" stroke="${ink}" stroke-width="3"/>
      <circle r="47" fill="none" stroke="#FFF6F2" stroke-width="3" stroke-dasharray="2 5"/>
      <circle r="41" fill="#FFF6F2" stroke="${ink}" stroke-width="2.4"/>
      <g transform="translate(-26 -16) scale(.13)">${KAVKAZ('#5A6FA8', '#3E5288')}</g>
      <g transform="translate(26 26) scale(.5)">${GCROSS()}</g>`,
    pedestal: (ink) => `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#6A2A6A" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#F2E2CC" stroke="${ink}" stroke-width="3.5"/>
      <g fill="none" stroke="#B3203A" stroke-width="2.6" opacity=".7"><path d="M40 46 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 M150 46 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6"/></g>
      <g stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M14 54 L24 30 L34 54Z" fill="#5A6FA8"/><path d="M20 40 L24 30 L28 40Z" fill="#FFFFFF"/>
      <g fill="#6A2A6A"><circle cx="208" cy="40" r="4"/><circle cx="216" cy="40" r="4"/><circle cx="212" cy="47" r="4"/></g></g>`,
    emblem: (ink) => `<path d="M2 40 L16 12 L24 24 L32 6 L46 40Z" fill="#5A6FA8" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M32 6 L37 17 L32 15 L28 19 L27 16Z M16 12 L20 20 L16 19 L13 21Z" fill="#FFFFFF"/>
      <rect x="18" y="30" width="12" height="10" fill="#B3203A" stroke="${ink}" stroke-width="1.6"/><path d="M24 30 V40 M18 35 H30" stroke="#FFFFFF" stroke-width="1.6"/>`,
    props: () => [
      svg('0 0 240 40', VINE()),
      svg('0 0 180 60', FORTRESS()),
      svg('0 0 48 32', GCROSS()),
    ],
    chapter: (st, num) => `<g ${st}><path d="M2 40 L18 10 L28 24 L40 4 L62 40Z" fill="#5A6FA8"/><path d="M40 4 L46 15 L40 13 L35 17Z M18 10 L22 18 L17 17Z" fill="#FFFFFF"/></g>
      <path d="M4 4 C20 10 40 0 60 6" fill="none" stroke="#6A4626" stroke-width="2"/><g fill="#6A2A6A"><circle cx="14" cy="10" r="2.6"/><circle cx="19" cy="10" r="2.6"/><circle cx="16.5" cy="14" r="2.6"/></g>
      <rect x="20" y="42" width="24" height="18" rx="5" fill="#FFFDF9" stroke="#2A1420" stroke-width="2"/>${num(32, 56)}`,
  },
});

// ═════════════════════════════════════════════════════════ v24 · країни c17 🇮🇳 Індія · c18 🇹🇷 Туреччина
// Ті самі хуки, що й c13/c14: палітра → WORLD_THEMES, сцена → SCENES, рамка/постамент/емблема/декор/розділ → CB_ART.
const MAUSOLEUM = (w = '#FFFFFF', s = '#E6E0F0', ink = '#B8A8D0') => `<rect x="50" y="56" width="100" height="44" fill="${w}"/>
  <path d="M70 56 C66 30 84 18 100 8 C116 18 134 30 130 56Z" fill="${w}"/><path d="M100 8 V0" stroke="${ink}" stroke-width="2"/><circle cx="100" cy="2" r="2" fill="${ink}"/>
  <path d="M78 54 C78 38 90 28 100 22" fill="none" stroke="${s}" stroke-width="4" opacity=".8"/>
  ${[[58, 50], [142, 50]].map(([x, y]) => `<path d="M${x - 8} ${y + 6} C${x - 8} ${y - 6} ${x + 8} ${y - 6} ${x + 8} ${y + 6}Z" fill="${w}"/><rect x="${x - 8}" y="${y + 6}" width="16" height="4" fill="${s}"/>`).join('')}
  <path d="M88 100 V74 C88 64 112 64 112 74 V100Z" fill="${s}"/><path d="M92 100 V76 C92 70 108 70 108 76 V100" fill="none" stroke="${ink}" stroke-width="1.4"/>
  <g fill="${s}">${[62, 132].map((x) => `<path d="M${x} 96 V80 C${x} 74 ${x + 8} 74 ${x + 8} 80 V96Z"/>`).join('')}</g>
  ${[18, 182].map((x) => `<rect x="${x - 4}" y="20" width="8" height="80" fill="${w}"/><path d="M${x - 6} 20 H${x + 6} M${x - 6} 44 H${x + 6} M${x - 6} 68 H${x + 6}" stroke="${s}" stroke-width="3"/>
    <path d="M${x - 5} 20 C${x - 5} 12 ${x + 5} 12 ${x + 5} 20Z" fill="${w}"/><path d="M${x} 12 V7" stroke="${ink}" stroke-width="1.4"/>`).join('')}
  <rect x="0" y="98" width="200" height="4" fill="${s}"/>`;
const IELEPHANT = (c = '#8A8AA0', cloth = '#E8336E', gold = '#FFC21A', ink = '#3A2A4A') => `<g class="el-step">
  <path d="M14 44 C10 24 26 12 46 12 C62 12 72 22 72 34 V52 C72 56 66 56 66 52 V46 H56 V54 C56 58 50 58 50 54 V46 H30 V54 C30 58 24 58 24 54 V46 C18 48 14 48 14 44Z" fill="${c}" stroke="${ink}" stroke-width="2"/>
  <path d="M70 30 C80 34 82 48 78 56 C76 60 72 58 74 54 C76 48 74 40 70 38" fill="${c}" stroke="${ink}" stroke-width="2"/>
  <path d="M60 18 C50 16 46 28 52 34 C58 34 62 28 62 22" fill="${ltC17(c, 0.15)}" stroke="${ink}" stroke-width="1.4"/><circle cx="66" cy="24" r="2" fill="${ink}"/>
  <path d="M26 14 H54 V34 C46 38 34 38 26 34Z" fill="${cloth}" stroke="${ink}" stroke-width="1.4"/><path d="M26 34 C34 38 46 38 54 34" fill="none" stroke="${gold}" stroke-width="2.4" stroke-dasharray="2 3"/>
  <path d="M62 12 L66 6 L70 12Z" fill="${gold}"/><path d="M72 38 C76 40 78 42 76 44" stroke="#FFFBF2" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`;
const ltC17 = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.round(v + (255 - v) * k).toString(16).padStart(2, '0'); return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`; };
const GARLAND = (cols, n = 13) => svg('0 0 400 60', `<path d="M0 4 Q100 30 200 6 Q300 30 400 4" fill="none" stroke="#2E7A3A" stroke-width="1.6"/>${Array.from({ length: n }, (_, i) => {
  const x = (i + 0.5) * (400 / n), seg = (x % 200) / 200, y = 4 + Math.sin(seg * Math.PI) * 18, c = cols[i % cols.length];
  return `<g class="gf"><circle cx="${x.toFixed(1)}" cy="${(y + 3).toFixed(1)}" r="6" fill="${c}"/><circle cx="${x.toFixed(1)}" cy="${(y + 3).toFixed(1)}" r="2.4" fill="#FFF2B0" opacity=".8"/>
    ${i % 3 === 1 ? `<path d="M${x.toFixed(1)} ${(y + 9).toFixed(1)} v12" stroke="${c}" stroke-width="3" stroke-dasharray="4 2"/><circle cx="${x.toFixed(1)}" cy="${(y + 24).toFixed(1)}" r="3" fill="#FFF2B0"/>` : ''}</g>`;
}).join('')}`, '', 'preserveAspectRatio="none"');
const SPICES = () => `${[['#FF7A1A', 20], ['#E8336E', 64], ['#FFC21A', 108], ['#2EA05A', 152], ['#B5179E', 196]].map(([c, x]) => `<path d="M${x - 18} 44 C${x - 14} 26 ${x - 4} 16 ${x} 16 C${x + 4} 16 ${x + 14} 26 ${x + 18} 44Z" fill="${c}"/>
  <path d="M${x - 6} 24 C${x - 2} 20 ${x + 2} 20 ${x + 4} 22" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".5"/><path d="M${x - 22} 44 H${x + 22} L${x + 18} 56 H${x - 18}Z" fill="#8A4A1E"/><path d="M${x - 22} 44 H${x + 22}" stroke="#C8863E" stroke-width="2"/>`).join('')}`;
const DIYA = (ink = '#5A2A14') => `<path d="M6 30 C10 42 38 42 42 30Z" fill="#D9792E" stroke="${ink}" stroke-width="2"/><path d="M6 30 H42" stroke="${ink}" stroke-width="2"/>
  <path d="M24 28 C18 22 20 12 24 4 C28 12 30 22 24 28Z" fill="#FFC21A"/><path d="M24 26 C21 22 22 16 24 12 C26 16 27 22 24 26Z" fill="#FF6B1A"/><path d="M14 36 h20" stroke="#FFE2A8" stroke-width="1.6" stroke-dasharray="2 3"/>`;
const MOSQUE = (f = '#3A2E5A') => `<path d="M40 100 V64 H160 V100Z" fill="${f}"/><path d="M60 64 C60 30 140 30 140 64Z" fill="${f}"/><path d="M100 34 V20" stroke="${f}" stroke-width="2.4"/>
  <path d="M97 20 a4 4 0 1 0 6 -2" fill="none" stroke="${f}" stroke-width="1.6"/>
  ${[[52, 64, 14], [148, 64, 14], [76, 50, 10], [124, 50, 10]].map(([x, y, r]) => `<path d="M${x - r} ${y} C${x - r} ${y - r * 1.3} ${x + r} ${y - r * 1.3} ${x + r} ${y}Z" fill="${f}"/>`).join('')}
  ${[22, 178].map((x) => `<rect x="${x - 3.5}" y="16" width="7" height="84" fill="${f}"/><path d="M${x - 6} 40 H${x + 6} V44 H${x - 6}Z M${x - 6} 64 H${x + 6} V68 H${x - 6}Z" fill="${f}"/><path d="M${x - 3.5} 16 L${x} 0 L${x + 3.5} 16Z" fill="${f}"/>`).join('')}`;
const BALLOON = (a = '#E8331E', b = '#FFC21A', c = '#2E9ADB') => `<path d="M30 4 C12 4 2 18 4 32 C6 44 18 52 24 60 H36 C42 52 54 44 56 32 C58 18 48 4 30 4Z" fill="${a}"/>
  <path d="M30 4 C22 4 18 18 19 32 C20 44 24 52 26 60 H34 C36 52 40 44 41 32 C42 18 38 4 30 4Z" fill="${b}"/>
  <path d="M30 4 C27 4 26 18 26.5 32 C27 44 28.5 52 29 60 H31 C31.5 52 33 44 33.5 32 C34 18 33 4 30 4Z" fill="${c}"/>
  <path d="M6 28 C20 32 40 32 54 28" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".55"/>
  <path d="M25 60 L26 66 M35 60 L34 66" stroke="#5A3A1A" stroke-width="1.2"/><rect x="24" y="66" width="12" height="9" rx="2" fill="#A8743E" stroke="#5A3A1A" stroke-width="1.2"/>
  <ellipse cx="20" cy="18" rx="5" ry="8" fill="#FFFFFF" opacity=".3"/>`;
const CHIMNEYS = (f = '#E8B48A', d = '#C8865A', cap = '#8A5A3A') => `<path d="M0 100 V70 C10 62 14 40 22 34 C30 40 32 62 40 66 C46 50 50 22 60 16 C70 22 72 52 78 62 C84 56 88 44 96 42 C104 46 106 60 112 66 C120 40 124 26 134 20 C144 26 146 52 152 64 C160 56 166 50 172 50 C180 54 186 66 200 70 V100Z" fill="${f}"/>
  ${[[22, 34], [60, 16], [96, 42], [134, 20], [172, 50]].map(([x, y]) => `<path d="M${x - 9} ${y + 2} C${x - 8} ${y - 6} ${x + 8} ${y - 6} ${x + 9} ${y + 2}Z" fill="${cap}"/>`).join('')}
  <g fill="${d}">${[[58, 40], [64, 54], [130, 44], [138, 58], [24, 56], [98, 60], [170, 66]].map(([x, y]) => `<path d="M${x - 2.5} ${y + 5} V${y} C${x - 2.5} ${y - 3} ${x + 2.5} ${y - 3} ${x + 2.5} ${y} V${y + 5}Z"/>`).join('')}</g>
  <path d="M0 86 C40 80 80 92 120 84 C160 78 180 88 200 84 V100 H0Z" fill="${d}" opacity=".6"/>`;
const TEAGLASS = (ink = '#5A2A14') => `<ellipse cx="24" cy="50" rx="20" ry="5" fill="#E8331E" stroke="${ink}" stroke-width="1.6"/>
  <path d="M12 8 C10 18 16 24 16 30 C16 38 12 42 14 48 H34 C36 42 32 38 32 30 C32 24 38 18 36 8Z" fill="#FFFFFF" fill-opacity=".55" stroke="${ink}" stroke-width="2"/>
  <path d="M15 22 C17 26 17 28 17 30 C17 38 13 42 15 47 H33 C35 42 31 38 31 30 C31 28 31 26 33 22Z" fill="#C8401E"/><path d="M19 26 C20 32 18 38 19 42" stroke="#FFC9A0" stroke-width="2" fill="none" opacity=".6"/>
  <path d="M24 6 C20 0 28 -2 24 -8" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".6"/>`;
const FERRY = () => `<path d="M4 26 L12 36 H96 L104 26Z" fill="#FFFFFF" stroke="#2A2A4A" stroke-width="1.6"/><path d="M18 26 V16 H86 V26Z" fill="#F4F0E6" stroke="#2A2A4A" stroke-width="1.4"/>
  <g fill="#2E6AB8">${[24, 36, 48, 60, 72].map((x) => `<rect x="${x}" y="19" width="7" height="4" rx="1"/>`).join('')}</g><rect x="48" y="6" width="8" height="10" fill="#E8331E"/><path d="M4 30 H104" stroke="#E8331E" stroke-width="2"/>`;

Object.assign(WORLD_THEMES, {
  // 🇮🇳 Індія — святковий шафрановий ранок: білий мавзолей, слони, гірлянди чорнобривців, гори спецій
  c17: {
    name: 'holi', bg1: '#FF9A3D', bg2: '#FFD27A', bg3: '#E8336E',
    accent: '#C2185B', accent2: '#0F9D8A', accentSoft: '#FFDDE6', soft: '#FFF5E8',
    ink: '#3A1236', ink2: '#7A3A5A', card: '#FFFBF4', card2: '#FFEFD8',
    glow: 'rgba(255, 140, 60, .55)', on: '#3A1236', on2: '#6A2A50', onDark: '#FFF4EA', on2Dark: '#F6D0DC',
    btn1: '#FF9A3D', btn2: '#C2185B', road: '#FFE7C2', roadEdge: '#3A1236', roadDone: '#0F9D8A',
    r: '22px 22px 8px 8px', rBtn: '18px', font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['petal', 'glint', 'pollen'], header: '#FF7A1A',
  },
  // 🇹🇷 Туреччина — світанок над Каппадокією: кулі, скелі-«димарі», мечеті з мінаретами, Босфор, тюльпани
  c18: {
    name: 'anatolia', bg1: '#5A6AD8', bg2: '#F2A0B8', bg3: '#FFD8A0',
    accent: '#C8102E', accent2: '#1E7AB8', accentSoft: '#FFE0E4', soft: '#FFF6F0',
    ink: '#2A1A3A', ink2: '#6A4A6A', card: '#FFFCF8', card2: '#FCEEE6',
    glow: 'rgba(240, 120, 160, .5)', on: '#2A1A3A', on2: '#5A3A5A', onDark: '#FFF6F2', on2Dark: '#E8D0E0',
    btn1: '#FF6A6A', btn2: '#C8102E', road: '#F6E2CC', roadEdge: '#2A1A3A', roadDone: '#1E7AB8',
    r: '18px', rBtn: '999px', font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['glint', 'petal', 'glint'], header: '#7A6AD8',
  },
});

Object.assign(SCENES, {
  c17: () => `${SUNB('#FFB23A')}
    <div class="wd-c17-garland">${GARLAND(['#FF8A1A', '#FFC21A', '#E8336E', '#FF6B1A'])}</div>
    <div class="wd-c17-palace">${svg('0 0 200 102', MAUSOLEUM(), '', 'preserveAspectRatio="xMidYMax meet"')}</div>
    <div class="wd-c17-pool">${svg('0 0 400 30', `<rect width="400" height="30" fill="#5EC4C8"/><rect x="150" width="100" height="30" fill="#FFFFFF" opacity=".25"/>
      <g fill="#FFFFFF" opacity=".4"><rect x="40" y="10" width="70" height="2.4" rx="1"/><rect x="280" y="18" width="80" height="2.4" rx="1"/></g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-ground">${svg('0 0 400 150', `<path d="M0 24 C80 14 160 32 240 22 C310 14 360 28 400 20 V150 H0Z" fill="#E8B060"/>
      <path d="M0 78 C90 66 190 88 280 76 C340 70 380 82 400 76 V150 H0Z" fill="#D9963E"/>
      <g opacity=".85">${Array.from({ length: 10 }, (_, i) => `<circle cx="${20 + i * 40}" cy="${98 + (i % 3) * 14}" r="${3 + (i % 2)}" fill="${['#E8336E', '#FFC21A', '#2EA05A', '#B5179E', '#2E9ADB'][i % 5]}"/>`).join('')}</g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c17-elephant">${svg('0 0 84 60', IELEPHANT())}</div>
    <div class="wd-c17-elephant e2">${svg('0 0 84 60', IELEPHANT('#9A9AB0', '#0F9D8A', '#FFC21A'))}</div>
    <div class="wd-c17-spices">${svg('0 0 216 58', SPICES())}</div>`,

  c18: () => `${SUNB('#FFD08A')}
    <div class="wd-c18-balloon k1">${svg('0 0 60 76', BALLOON())}</div>
    <div class="wd-c18-balloon k2">${svg('0 0 60 76', BALLOON('#2E9ADB', '#FFFFFF', '#E8336E'))}</div>
    <div class="wd-c18-balloon k3">${svg('0 0 60 76', BALLOON('#FFC21A', '#E8331E', '#2EA05A'))}</div>
    <div class="wd-c18-mosque">${svg('0 0 400 100', `<g transform="translate(0 8) scale(.9)">${MOSQUE('#6A5A9A')}</g><g transform="translate(220 0)">${MOSQUE('#5A4A8A')}</g>`, '', 'preserveAspectRatio="xMidYMax meet"')}</div>
    <div class="wd-c18-strait">${svg('0 0 400 60', `<rect width="400" height="60" fill="#2E7AC8"/><rect width="400" height="10" fill="#5EA4E8"/>
      <g fill="#FFE0E8" opacity=".35"><rect x="30" y="22" width="90" height="3" rx="1.5"/><rect x="240" y="38" width="100" height="3" rx="1.5"/></g>`, '', 'preserveAspectRatio="none"')}
      <div class="wd-wave wv1">${svg('0 0 480 20', WAVES('#DCEBFF', 0.5), '', 'preserveAspectRatio="none"')}</div>
      <div class="wd-c18-ferry">${svg('0 0 108 40', FERRY())}</div></div>
    <div class="wd-c18-rocks">${svg('0 0 200 100', CHIMNEYS(), '', 'preserveAspectRatio="xMidYMax meet"')}</div>
    <div class="wd-ground">${svg('0 0 400 150', `<path d="M0 26 C70 16 150 32 220 24 C300 16 350 30 400 22 V150 H0Z" fill="#E8C49A"/>
      <path d="M0 80 C90 68 190 88 280 78 C340 72 380 82 400 78 V150 H0Z" fill="#D8A878"/>
      <g>${Array.from({ length: 9 }, (_, i) => `<path d="M${24 + i * 44} ${104 + (i % 3) * 12} v8" stroke="#3E8A3A" stroke-width="2"/><path d="M${20 + i * 44} ${104 + (i % 3) * 12} C${20 + i * 44} ${96 + (i % 3) * 12} ${28 + i * 44} ${96 + (i % 3) * 12} ${28 + i * 44} ${104 + (i % 3) * 12}Z" fill="${i % 2 ? '#E8331E' : '#E8336E'}"/>`).join('')}</g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c18-tea">${svg('0 -10 48 66', TEAGLASS())}</div>`,
});

Object.assign(CB_ART, {
  c17: {
    medal: (t, ink) => `<circle r="54" fill="#FF8A1A" stroke="${ink}" stroke-width="3"/>
      ${Array.from({ length: 16 }, (_, i) => `<path transform="rotate(${i * 22.5})" d="M0 -53 C7 -48 6 -42 0 -40 C-6 -42 -7 -48 0 -53Z" fill="${['#FFC21A', '#E8336E', '#0F9D8A', '#FFFBF4'][i % 4]}" stroke="${ink}" stroke-width="1"/>`).join('')}
      <circle r="40" fill="#FFFBF4" stroke="${ink}" stroke-width="2.4"/>
      <circle r="34" fill="none" stroke="#C2185B" stroke-width="2" stroke-dasharray="1 5" stroke-linecap="round"/>
      <g transform="translate(22 26) scale(.4)">${DIYA(ink)}</g>`,
    pedestal: (ink) => `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#C2185B" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#FFE7C2" stroke="${ink}" stroke-width="3.5"/>
      <g opacity=".85">${[40, 64, 88, 152, 176, 200].map((x, i) => `<circle cx="${x}" cy="46" r="7" fill="none" stroke="${['#FF8A1A', '#E8336E', '#0F9D8A'][i % 3]}" stroke-width="2.4"/><circle cx="${x}" cy="46" r="2.4" fill="${['#FF8A1A', '#E8336E', '#0F9D8A'][i % 3]}"/>`).join('')}</g>
      <g stroke="${ink}" stroke-width="2" stroke-linejoin="round"><g transform="translate(6 24) scale(.7)">${DIYA(ink)}</g>
      <path d="M200 54 C202 40 210 34 214 34 C218 34 226 40 228 54Z" fill="#FFC21A"/></g>`,
    emblem: (ink) => `<path d="M14 26 C12 12 24 4 24 2 C24 4 36 12 34 26Z" fill="#FFFFFF" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
      <rect x="10" y="26" width="28" height="14" fill="#FFFFFF" stroke="${ink}" stroke-width="2"/><path d="M20 40 V32 C20 28 28 28 28 32 V40" fill="#E6E0F0" stroke="${ink}" stroke-width="1.6"/>
      <path d="M5 40 V14 M43 40 V14" stroke="${ink}" stroke-width="2.6"/><path d="M2 44 H46" stroke="#FF8A1A" stroke-width="3" stroke-linecap="round"/>`,
    props: () => [
      svg('0 0 84 60', IELEPHANT()),
      svg('0 -4 48 46', DIYA()),
      svg('0 0 216 58', SPICES(), '', 'opacity=".95"'),
    ],
    chapter: (st, num) => `<g ${st}><path d="M20 30 C18 14 32 6 32 2 C32 6 46 14 44 30Z" fill="#FFFFFF"/><rect x="16" y="30" width="32" height="12" fill="#FFFFFF"/></g>
      <path d="M2 4 Q32 18 62 4" fill="none" stroke="#2E7A3A" stroke-width="1.2"/><g>${['#FF8A1A', '#FFC21A', '#E8336E', '#FF8A1A'].map((c, i) => `<circle cx="${8 + i * 16}" cy="${8 + (i === 1 || i === 2 ? 4 : 0)}" r="3.6" fill="${c}"/>`).join('')}</g>
      <rect x="20" y="42" width="24" height="18" rx="5" fill="#FFFBF4" stroke="#3A1236" stroke-width="2"/>${num(32, 56)}`,
  },
  c18: {
    medal: (t, ink) => `<circle r="54" fill="#C8102E" stroke="${ink}" stroke-width="3"/>
      <circle r="47" fill="none" stroke="#FFFFFF" stroke-width="3"/>
      ${Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30}) translate(0 -47)" d="M0 -5 L4 0 L0 5 L-4 0Z" fill="#2E9ADB" stroke="${ink}" stroke-width="1"/>`).join('')}
      <circle r="40" fill="#FFF6F0" stroke="${ink}" stroke-width="2.4"/>
      <g transform="translate(22 18) scale(.5)">${BALLOON()}</g>`,
    pedestal: (ink) => `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#1E7AB8" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#F6E2CC" stroke="${ink}" stroke-width="3.5"/>
      <g fill="none" stroke="#C8102E" stroke-width="2.4" opacity=".75"><path d="M40 46 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 M140 46 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6"/></g>
      <g stroke="${ink}" stroke-width="2" stroke-linejoin="round"><g transform="translate(10 18) scale(.7)">${TEAGLASS(ink)}</g>
      <path d="M208 54 C206 44 214 40 214 36 C214 40 222 44 220 54Z" fill="#E8336E"/></g>`,
    emblem: (ink) => `<path d="M10 40 V26 H38 V40Z" fill="#6A5A9A" stroke="${ink}" stroke-width="2"/><path d="M14 26 C14 12 34 12 34 26Z" fill="#6A5A9A" stroke="${ink}" stroke-width="2"/>
      <path d="M4 40 V12 L6 4 L8 12 V40 M40 40 V12 L42 4 L44 12 V40" fill="#6A5A9A" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M24 14 V8" stroke="${ink}" stroke-width="1.6"/><path d="M2 44 q5 -4 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#2E9ADB" stroke-width="2.6" stroke-linecap="round"/>`,
    props: () => [
      svg('0 0 60 76', BALLOON()),
      svg('0 -10 48 66', TEAGLASS()),
      svg('0 0 200 100', CHIMNEYS(), '', 'opacity=".92"'),
    ],
    chapter: (st, num) => `<g ${st}><path d="M32 4 C22 4 16 12 17 20 C18 28 26 32 29 38 H35 C38 32 46 28 47 20 C48 12 42 4 32 4Z" fill="#E8331E"/><path d="M32 4 C28 4 27 12 27.5 20 C28 28 30 32 31 38 H33 C34 32 36 28 36.5 20 C37 12 36 4 32 4Z" fill="#FFC21A"/></g>
      <path d="M2 50 L10 40 L16 48 L24 36 L30 50" fill="none" stroke="#C8865A" stroke-width="2"/>
      <rect x="20" y="42" width="24" height="18" rx="5" fill="#FFFCF8" stroke="#2A1A3A" stroke-width="2"/>${num(32, 56)}`,
  },
});

// ═════════════════════════════════════════════════════════ v24 · країни c15 🇩🇪 Німеччина · c16 🇪🇬 Єгипет
// Ті самі хуки, що й c13/c14: палітра → WORLD_THEMES, сцена → SCENES, рамка/постамент/емблема/декор/розділ → CB_ART.
const CASTLE = (w = '#E6E2D6', d = '#B8B2A6', roof = '#3E5A8A') => `<path d="M0 100 C30 74 60 70 100 68 C140 70 170 74 200 100Z" fill="#5E8A4A"/>
  <rect x="58" y="40" width="84" height="34" fill="${w}"/><rect x="58" y="40" width="84" height="4" fill="${d}"/>
  ${[[44, 22, 20, 54], [136, 30, 18, 46], [92, 8, 18, 40]].map(([x, y, ww, h]) => `<rect x="${x}" y="${y}" width="${ww}" height="${h}" fill="${w}"/><rect x="${x + ww * 0.36}" y="${y + h * 0.3}" width="${ww * 0.28}" height="${h * 0.18}" rx="${ww * 0.14}" fill="#3A3A4A"/>
    <path d="M${x - 3} ${y} L${x + ww / 2} ${y - ww * 1.25} L${x + ww + 3} ${y}Z" fill="${roof}"/><path d="M${x + ww / 2} ${y - ww * 1.25} v-7" stroke="#5A3A1A" stroke-width="1.4"/><path d="M${x + ww / 2} ${y - ww * 1.25 - 7} l7 2.5 l-7 2.5Z" fill="#DD0000"/>`).join('')}
  <g fill="${d}">${[62, 74, 86, 114, 126].map((x) => `<rect x="${x}" y="34" width="7" height="6"/>`).join('')}</g>
  <path d="M92 74 V60 C92 54 108 54 108 60 V74Z" fill="#5A3A1A"/><g fill="#3A3A4A">${[66, 124].map((x) => `<rect x="${x}" y="50" width="7" height="10" rx="3.5"/>`).join('')}</g>`;
const FACHWERK = (x, y, w, h, wall = '#FFF6E6', beam = '#5A2E18', roof = '#B8432A') => `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" fill="${wall}"/>
  <path d="M-3 0 L${w / 2} ${-h * 0.62} L${w + 3} 0Z" fill="${roof}"/><path d="M${w * 0.32} ${-h * 0.2} h${w * 0.36}" stroke="${beam}" stroke-width="1.6"/>
  <g fill="none" stroke="${beam}" stroke-width="2.2"><rect width="${w}" height="${h}"/><path d="M0 ${h / 2} H${w} M${w / 3} 0 V${h} M${w * 2 / 3} 0 V${h} M0 0 L${w / 3} ${h / 2} M${w} 0 L${w * 2 / 3} ${h / 2}"/></g>
  <g fill="#7FB6E0">${[w / 6, w * 5 / 6].map((cx) => `<rect x="${cx - w * 0.09}" y="${h * 0.62}" width="${w * 0.18}" height="${h * 0.22}"/>`).join('')}</g>
  <rect x="${w * 0.4}" y="${h * 0.6}" width="${w * 0.2}" height="${h * 0.4}" fill="${beam}"/><g fill="#E8336E">${[w / 6, w * 5 / 6].map((cx) => `<circle cx="${cx}" cy="${h * 0.88}" r="2"/>`).join('')}</g></g>`;
const FIR = (c = '#2E5A3A', d = '#1E4A2E') => `<path d="M30 100 V84" stroke="#5A3A1A" stroke-width="5"/>
  <path d="M30 4 L52 40 H42 L58 64 H46 L62 88 H-2 L14 64 H2 L18 40 H8Z" fill="${c}"/><path d="M30 4 L8 40 H18 L2 64 H14 L-2 88 H30Z" fill="${d}" opacity=".55"/>`;
const TRAIN = (body = '#DD0000', ink = '#1E1E1E') => `<rect x="4" y="12" width="44" height="22" rx="5" fill="${body}" stroke="${ink}" stroke-width="2"/><rect x="10" y="16" width="10" height="8" rx="2" fill="#CFE8FA"/><rect x="26" y="16" width="16" height="8" rx="2" fill="#CFE8FA"/>
  <path d="M48 16 H58 C64 16 66 26 66 34 H48Z" fill="${body}" stroke="${ink}" stroke-width="2"/><path d="M52 19 H58 C61 19 62 24 62 26 H52Z" fill="#CFE8FA"/>
  ${[[70, '#FFCE00'], [116, '#FFFFFF']].map(([x, c]) => `<rect x="${x}" y="14" width="42" height="20" rx="4" fill="${c}" stroke="${ink}" stroke-width="2"/><g fill="#CFE8FA">${[6, 18, 30].map((dx) => `<rect x="${x + dx}" y="18" width="7" height="7" rx="1.5"/>`).join('')}</g><path d="M${x - 4} 28 h4" stroke="${ink}" stroke-width="2"/>`).join('')}
  <path d="M2 38 H162" stroke="${ink}" stroke-width="2"/><g fill="${ink}">${[14, 38, 58, 80, 102, 126, 148].map((x) => `<circle cx="${x}" cy="36" r="4"/>`).join('')}</g>`;
const PYR16 = (s = '#E8C483', d = '#C99A4A', cap = '#F2D34A') => `<path d="M100 6 L196 96 H4Z" fill="${s}"/><path d="M100 6 L196 96 H112Z" fill="${d}"/>
  <g stroke="${d}" stroke-width="1.2" opacity=".6">${[30, 48, 66, 84].map((y) => `<path d="M${100 - (y - 6) * 1.067} ${y} H${100 + (y - 6) * 0.13}"/>`).join('')}</g><path d="M100 6 L112 17 H88Z" fill="${cap}"/>`;
const FELUCCA = (hull = '#8A4A1E', sail = '#FFFBF0') => `<path d="M4 34 C20 44 80 44 100 30 L92 28 C70 36 26 36 12 30Z" fill="${hull}"/><path d="M20 32 H90" stroke="#F2C14A" stroke-width="1.6"/>
  <path d="M54 32 V6" stroke="#5A3A1A" stroke-width="2"/><path d="M30 26 L82 2 C76 14 70 22 56 30Z" fill="${sail}"/><path d="M30 26 L82 2" stroke="#5A3A1A" stroke-width="1.6"/>`;
const DPALM = (c = '#2E8A4A', d = '#1E6A3A') => `<path d="M48 120 C50 96 46 70 52 40" fill="none" stroke="#9A6A34" stroke-width="6" stroke-linecap="round"/>
  <path d="M48 120 C50 96 46 70 52 40" fill="none" stroke="#C4904E" stroke-width="6" stroke-dasharray="2 5" opacity=".7"/>
  ${[[-80, c], [-40, d], [0, c], [40, d], [80, c], [130, d], [170, c]].map(([a, col]) => `<path transform="rotate(${a} 52 40)" d="M52 40 C62 30 80 28 94 36 L88 38 L90 42 C78 38 66 40 52 43Z" fill="${col}"/>`).join('')}
  <g fill="#B8541E"><circle cx="48" cy="45" r="3.5"/><circle cx="55" cy="46" r="3.5"/><circle cx="51" cy="50" r="3.5"/></g>`;
const ANKH = (g = '#D4A017', ink = '#3A2408') => `<path d="M24 22 C14 22 12 4 24 4 C36 4 34 22 24 22Z M24 22 V58 M10 28 H38" fill="none" stroke="${g}" stroke-width="7" stroke-linecap="round"/>
  <path d="M24 22 C14 22 12 4 24 4 C36 4 34 22 24 22Z" fill="none" stroke="${ink}" stroke-width="1.4"/>`;
const EYE_H = (ink = '#1E3A6A', g = '#D4A017') => `<path d="M2 20 C14 6 40 6 52 20 C40 30 14 30 2 20Z" fill="#FFFBF0" stroke="${ink}" stroke-width="3"/><circle cx="27" cy="19" r="7" fill="${ink}"/><circle cx="25" cy="17" r="2" fill="#FFFFFF"/>
  <path d="M6 12 C18 2 38 2 50 10" fill="none" stroke="${ink}" stroke-width="3.4" stroke-linecap="round"/><path d="M22 28 L18 42 C16 46 22 48 24 44 M34 28 C40 34 46 34 50 30" fill="none" stroke="${g}" stroke-width="3" stroke-linecap="round"/>`;

Object.assign(WORLD_THEMES, {
  // 🇩🇪 Німеччина — свіжий ранок над Рейном: замок на пагорбі, фахверк, смерековий ліс, червоний потяг
  c15: {
    name: 'rhine', bg1: '#6FA6D8', bg2: '#A9CDEA', bg3: '#7FB069',
    accent: '#DD0000', accent2: '#FFCE00', accentSoft: '#FFE9E2', soft: '#F2F6EE',
    ink: '#1E1E1E', ink2: '#4A4A4A', card: '#FFFFFF', card2: '#F2F0EA',
    glow: 'rgba(255, 206, 0, .45)', on: '#1E1E1E', on2: '#3E3E3E', onDark: '#F8F8F4', on2Dark: '#D6D6CE',
    btn1: '#FF4A3A', btn2: '#B80000', road: '#E6E2D6', roadEdge: '#1E1E1E', roadDone: '#FFCE00',
    r: '10px', rBtn: '12px', font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['pollen', 'leaf', 'glint'], header: '#3E6A3A',
  },
  // 🇪🇬 Єгипет — золотий полудень пустелі: піраміди, Ніл із фелуками, фінікові пальми
  c16: {
    name: 'nile', bg1: '#F2A24A', bg2: '#FFD38A', bg3: '#1E7FB8',
    accent: '#1E7FB8', accent2: '#D4A017', accentSoft: '#FFF0C8', soft: '#FFF8E6',
    ink: '#3A2408', ink2: '#7A5A2A', card: '#FFFAF0', card2: '#FFF0D2',
    glow: 'rgba(255, 210, 90, .55)', on: '#3A2408', on2: '#6A4A1E', onDark: '#FFF8E6', on2Dark: '#F2DCAE',
    btn1: '#3EA6E0', btn2: '#1E5F9A', road: '#F6E2B4', roadEdge: '#3A2408', roadDone: '#D4A017',
    r: '6px 18px 6px 18px', rBtn: '14px', font: "'Lumi', 'Inter', system-ui, sans-serif",
    particles: ['glint', 'pollen', 'glint'], header: '#D4A017',
  },
});

Object.assign(SCENES, {
  c15: () => `${SUNB('#FFE27A')}
    <div class="wd-c15-castle">${svg('0 0 200 100', CASTLE(), '', 'preserveAspectRatio="xMidYMax meet"')}</div>
    <div class="wd-c15-forest">${svg('0 0 400 80', `<path d="M0 80 V40 C60 28 120 44 200 34 C280 24 340 40 400 32 V80Z" fill="#3E6A3A"/>
      ${Array.from({ length: 14 }, (_, i) => `<g transform="translate(${i * 30 - 6} ${18 + (i % 3) * 6}) scale(.45)">${FIR(i % 2 ? '#2E5A3A' : '#3A6A44')}</g>`).join('')}`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-ground">${svg('0 0 400 150', `<path d="M0 22 C70 12 150 30 220 20 C300 12 350 26 400 18 V150 H0Z" fill="#7FB069"/>
      <path d="M0 74 C90 62 190 82 280 72 C340 66 380 76 400 72 V150 H0Z" fill="#6FA05C"/>
      <path d="M0 52 H400" stroke="#8A847A" stroke-width="5"/><path d="M0 52 H400" stroke="#E6E2D6" stroke-width="1.6" stroke-dasharray="8 6"/>
      <g fill="#FFCE00" opacity=".85">${Array.from({ length: 10 }, (_, i) => `<circle cx="${20 + i * 40}" cy="${96 + (i % 3) * 14}" r="2.6"/>`).join('')}</g>`, '', 'preserveAspectRatio="none"')}
      <div class="wd-c15-train">${svg('0 0 168 42', TRAIN())}</div></div>
    <div class="wd-c15-town">${svg('0 0 200 80', `${FACHWERK(6, 40, 34, 40) + FACHWERK(46, 30, 40, 50, '#FFF0D6', '#4A2A18', '#8A3A22') + FACHWERK(94, 44, 30, 36) + FACHWERK(132, 34, 38, 46, '#FFFBEA', '#5A2E18', '#3E5A8A') + FACHWERK(176, 48, 22, 32)}`, '', 'preserveAspectRatio="xMidYMax meet"')}</div>
    <div class="wd-c15-fir k1">${svg('0 0 60 100', FIR())}</div>
    <div class="wd-c15-fir k2">${svg('0 0 60 100', FIR('#3A6A44', '#2A5034'))}</div>`,

  c16: () => `${SUNB('#FFE08A')}
    <div class="wd-c16-pyr">${svg('0 0 400 100', `<g transform="translate(20 20) scale(.8)">${PYR16()}</g><g transform="translate(150 0)">${PYR16('#F2D39A', '#D4A85A')}</g><g transform="translate(320 46) scale(.5)">${PYR16()}</g>`, '', 'preserveAspectRatio="xMidYMax meet"')}</div>
    <div class="wd-c16-dunes">${svg('0 0 400 60', `<path d="M0 60 V30 C60 10 120 34 190 22 C260 10 330 30 400 18 V60Z" fill="#F2D39A"/><path d="M0 60 V44 C80 30 160 50 240 40 C320 30 360 44 400 38 V60Z" fill="#E8C483"/>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c16-nile">${svg('0 0 400 60', `<rect width="400" height="60" fill="#1E7FB8"/><rect width="400" height="10" fill="#3EA6E0"/>
      <g fill="#FFF6C8" opacity=".35"><rect x="40" y="22" width="80" height="3" rx="1.5"/><rect x="230" y="38" width="110" height="3" rx="1.5"/></g>`, '', 'preserveAspectRatio="none"')}
      <div class="wd-wave wv1">${svg('0 0 480 20', WAVES('#CFEAFA', 0.55), '', 'preserveAspectRatio="none"')}</div>
      <div class="wd-c16-boat">${svg('0 0 104 46', FELUCCA())}</div>
      <div class="wd-c16-boat b2">${svg('0 0 104 46', FELUCCA('#6A3A1E', '#F2E6C8'))}</div></div>
    <div class="wd-ground">${svg('0 0 400 150', `<path d="M0 24 C70 14 150 32 220 22 C300 14 350 28 400 20 V150 H0Z" fill="#6AAE5A"/>
      <path d="M0 78 C90 66 190 86 280 76 C340 70 380 80 400 76 V150 H0Z" fill="#F2D39A"/>
      <g fill="#D4A85A" opacity=".55">${Array.from({ length: 9 }, (_, i) => `<ellipse cx="${24 + i * 44}" cy="${102 + (i % 3) * 14}" rx="8" ry="2.4"/>`).join('')}</g>`, '', 'preserveAspectRatio="none"')}</div>
    <div class="wd-c16-palm k1">${svg('0 0 100 120', DPALM())}</div>
    <div class="wd-c16-palm k2">${svg('0 0 100 120', DPALM('#3E9A5A', '#2A7A44'))}</div>`,
});

Object.assign(CB_ART, {
  c15: {
    medal: (t, ink) => `<circle r="54" fill="#1E1E1E" stroke="${ink}" stroke-width="3"/>
      <circle r="49" fill="none" stroke="#DD0000" stroke-width="5"/><circle r="44" fill="none" stroke="#FFCE00" stroke-width="4"/>
      <circle r="40" fill="#F8F6F0" stroke="${ink}" stroke-width="2.4"/>
      <g transform="translate(-30 -26) scale(.3)">${CASTLE()}</g>
      <g fill="none" stroke="${ink}" stroke-width="2.4"><circle cx="0" cy="22" r="9"/><path d="M0 16 V22 L4 25"/></g>`,
    pedestal: (ink) => `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#3E6A3A" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#E6E2D6" stroke="${ink}" stroke-width="3.5"/>
      <g fill="none" stroke="#B8B2A6" stroke-width="2.4">${[40, 64, 88, 152, 176, 200].map((x) => `<path d="M${x} 38 h16 v14 h-16Z"/>`).join('')}</g>
      <g stroke="${ink}" stroke-width="2" stroke-linejoin="round"><rect x="16" y="28" width="14" height="26" fill="#E6E2D6"/><path d="M13 28 L23 14 L33 28Z" fill="#3E5A8A"/>
      <path d="M212 54 V40 L218 30 L224 40 V54Z" fill="#2E5A3A"/></g>`,
    emblem: (ink) => `<rect x="4" y="6" width="40" height="11" fill="#1E1E1E"/><rect x="4" y="17" width="40" height="11" fill="#DD0000"/><rect x="4" y="28" width="40" height="11" fill="#FFCE00"/>
      <rect x="4" y="6" width="40" height="33" rx="2" fill="none" stroke="${ink}" stroke-width="2.2"/><path d="M8 44 H40" stroke="${ink}" stroke-width="2.4"/>`,
    props: () => [
      svg('0 0 60 100', FIR()),
      svg('0 0 168 42', TRAIN()),
      svg('0 0 200 100', CASTLE(), '', 'opacity=".95"'),
    ],
    chapter: (st, num) => `<g ${st}>${FACHWERK(14, 18, 36, 26)}</g>
      <rect x="20" y="42" width="24" height="18" rx="5" fill="#FFFFFF" stroke="#1E1E1E" stroke-width="2"/>${num(32, 56)}`,
  },
  c16: {
    medal: (t, ink) => `<circle r="54" fill="#D4A017" stroke="${ink}" stroke-width="3"/>
      ${Array.from({ length: 24 }, (_, i) => `<rect transform="rotate(${i * 15}) translate(-2.5 -52)" width="5" height="9" fill="${i % 2 ? '#1E7FB8' : '#C8102E'}"/>`).join('')}
      <circle r="41" fill="#FFF6DA" stroke="${ink}" stroke-width="2.4"/>
      <g transform="translate(-30 -22) scale(.3)">${PYR16()}</g><g transform="translate(-26 12) scale(1)">${EYE_H()}</g>`,
    pedestal: (ink) => `<ellipse cx="120" cy="58" rx="112" ry="26" fill="#1E7FB8" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="120" cy="46" rx="108" ry="24" fill="#F2D39A" stroke="${ink}" stroke-width="3.5"/>
      <g fill="none" stroke="#C8102E" stroke-width="2.4" opacity=".7"><path d="M40 46 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 M140 46 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6"/></g>
      <g stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M12 54 L24 30 L36 54Z" fill="#E8C483"/><path d="M216 54 V30 L220 24 L224 30 V54Z" fill="#F2D39A"/></g>`,
    emblem: (ink) => `<path d="M24 4 L44 40 H4Z" fill="#E8C483" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/><path d="M24 4 L44 40 H28Z" fill="#C99A4A"/>
      <path d="M24 4 L28 11 H20Z" fill="#F2D34A"/><path d="M2 44 q5 -4 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#1E7FB8" stroke-width="2.6" stroke-linecap="round"/>`,
    props: () => [
      svg('0 0 100 120', DPALM()),
      svg('0 0 48 62', ANKH()),
      svg('0 0 200 100', PYR16(), '', 'opacity=".95"'),
    ],
    chapter: (st, num) => `<g ${st}><path d="M32 2 L60 40 H4Z" fill="#E8C483"/><path d="M32 2 L60 40 H38Z" fill="#C99A4A"/></g>
      <rect x="20" y="42" width="24" height="18" rx="5" fill="#FFFAF0" stroke="#3A2408" stroke-width="2"/>${num(32, 56)}`,
  },
});
