// 🌍 Світ: ігрова стежка з 13 рівнів (games.js) — звивиста дорога, вузли-медальйони з обкладинками,
// Лумі стоїть на поточному рівні, паралакс-фон і частинки під настрій світу.
import { h, starsRow, fx, toast } from './ui.js?v=20261110022322';
import { getWorld, worldIndex } from './state.js?v=20261110022322';
import { worldGames, isOpen, nextGame, gameStars } from './games.js?v=20261110022322';

const STEP = 186;        // відстань між вузлами по вертикалі
const CUR_GAP = 56;      // додатковий простір навколо поточного (Лумі зверху, «Грати» знизу)
const TOP = 100;         // центр першого вузла від верху стежки
const BOTTOM = 170;
const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── фон світу: дві паралакс-смуги з мотивами світу (SVG-наліпки без обвідки — щоб не сперечались з вузлами)
const DECO = {
  1: [ // Ранкова Галявина — пагорби, квіти, кущики
    (c) => `<svg viewBox="0 0 120 60"><ellipse cx="60" cy="60" rx="60" ry="40" fill="${c[0]}"/><circle cx="40" cy="30" r="5" fill="#FF9EB5"/><circle cx="72" cy="26" r="4" fill="#FFD25A"/></svg>`,
    (c) => `<svg viewBox="0 0 60 60"><circle cx="20" cy="40" r="18" fill="${c[1]}"/><circle cx="38" cy="32" r="20" fill="${c[1]}"/><circle cx="30" cy="22" r="6" fill="#fff" opacity=".35"/></svg>`,
    () => `<svg viewBox="0 0 40 40"><g fill="#FFF"><circle cx="20" cy="10" r="7"/><circle cx="30" cy="20" r="7"/><circle cx="20" cy="30" r="7"/><circle cx="10" cy="20" r="7"/></g><circle cx="20" cy="20" r="6" fill="#FFD25A"/></svg>`,
  ],
  2: [ // Шепітний Ліс — ялинки
    (c) => `<svg viewBox="0 0 60 100"><path d="M30 0 L54 44 H42 L60 84 H0 L18 44 H6Z" fill="${c[0]}"/><rect x="26" y="84" width="8" height="16" fill="${c[2]}"/></svg>`,
    (c) => `<svg viewBox="0 0 60 100"><path d="M30 6 L52 50 H40 L56 86 H4 L20 50 H8Z" fill="${c[1]}"/><rect x="26" y="86" width="8" height="14" fill="${c[2]}"/></svg>`,
    (c) => `<svg viewBox="0 0 80 40"><ellipse cx="40" cy="30" rx="40" ry="16" fill="${c[1]}"/><circle cx="22" cy="22" r="12" fill="${c[1]}"/><circle cx="52" cy="18" r="15" fill="${c[1]}"/></svg>`,
  ],
  3: [ // Місто Годинників — будиночки й шестерні
    (c) => `<svg viewBox="0 0 60 70"><rect x="6" y="26" width="48" height="44" fill="${c[0]}"/><path d="M0 28 L30 0 L60 28Z" fill="${c[2]}"/><rect x="22" y="38" width="14" height="14" fill="#FFE7A0"/></svg>`,
    (c) => `<svg viewBox="0 0 40 100"><rect x="6" y="24" width="28" height="76" fill="${c[1]}"/><path d="M2 26 L20 0 L38 26Z" fill="${c[2]}"/><circle cx="20" cy="44" r="10" fill="#FFF8EC"/><path d="M20 37 V44 L25 47" stroke="${c[2]}" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`,
    (c) => `<svg viewBox="0 0 60 60" class="spin-slow"><path d="M30 2l5 8 9-3 1 9 9 1-3 9 8 5-8 5 3 9-9 1-1 9-9-3-5 8-5-8-9 3-1-9-9-1 3-9-8-5 8-5-3-9 9-1 1-9 9 3z" fill="${c[1]}"/><circle cx="30" cy="30" r="9" fill="${c[0]}"/></svg>`,
  ],
  4: [ // Кришталеві Гори — вершини зі снігом, кристали
    (c) => `<svg viewBox="0 0 120 80"><path d="M0 80 L48 8 L96 80Z" fill="${c[0]}"/><path d="M34 30 L48 8 L62 30 L54 26 L48 34 L41 26Z" fill="#fff"/><path d="M56 80 L90 30 L120 80Z" fill="${c[1]}"/></svg>`,
    (c) => `<svg viewBox="0 0 50 70"><path d="M10 70 L6 30 L18 14 L28 30 L24 70Z" fill="#B9E6FF" opacity=".8"/><path d="M26 70 L24 24 L36 6 L48 24 L42 70Z" fill="${c[2]}" opacity=".8"/></svg>`,
    (c) => `<svg viewBox="0 0 100 50"><path d="M0 50 L30 10 L52 36 L70 18 L100 50Z" fill="${c[1]}"/></svg>`,
  ],
  5: [ // Небесна Бібліотека — хмари й книжки
    () => `<svg viewBox="0 0 120 50"><path d="M14 48 C0 48 0 30 16 30 C14 14 36 10 44 22 C50 4 80 4 84 22 C94 12 116 18 112 34 C124 36 124 48 110 48Z" fill="#fff" opacity=".85"/></svg>`,
    (c) => `<svg viewBox="0 0 60 40"><path d="M2 8 Q16 2 30 10 V38 Q16 30 2 36Z" fill="#FFF8EC"/><path d="M58 8 Q44 2 30 10 V38 Q44 30 58 36Z" fill="#FFF8EC"/><path d="M0 36 L30 40 L60 36" stroke="${c[2]}" stroke-width="4" fill="none"/></svg>`,
    () => `<svg viewBox="0 0 40 40"><path d="M20 2l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill="#FFE07A"/></svg>`,
  ],
};
const DECO_COL = {
  1: ['#BFE8A4', '#9ED884', '#9B6B4A'],
  2: ['#6FB582', '#4F9A62', '#7A5238'],
  3: ['#FFE1BC', '#F3C894', '#E68B78'],
  4: ['#B4B6F0', '#9599DD', '#D4B8FF'],
  5: ['#F4F0FF', '#E2DAFF', '#9C7CE0'],
};
const PARTICLES = { 1: ['pollen'], 2: ['firefly'], 3: ['gear', 'spark'], 4: ['snow'], 5: ['twinkle', 'shoot'] };

// ── геометрія стежки
const xAt = (i) => 0.5 + 0.27 * Math.sin(i * 0.92 + 0.35);
function roadPath(pts) {
  if (!pts.length) return '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]; const p1 = pts[i]; const p2 = pts[i + 1]; const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

// маленький «желейний» відгук на тап
function jelly(el) {
  if (reduced()) return;
  el.classList.remove('jelly'); void el.offsetWidth; el.classList.add('jelly');
}

export function render(root, params, app) {
  const st = app.state;
  const w = getWorld(params.wid);
  if (!w || !st.unlocked.includes(w.id)) {
    toast('Цей світ ще спить 🔒');
    setTimeout(() => app.back(), 0);
    return undefined;
  }
  const wi = worldIndex(w.id) + 1;
  const list = worldGames(w.id);
  const next = nextGame(st, w.id);
  const curIdx = next ? next.idx : list.length - 1;   // усе пройдено — Лумі чекає на фіналі
  const got = list.reduce((a, g) => a + gameStars(st, g.id), 0);
  const total = list.length * 3;
  const doneN = list.filter((g) => gameStars(st, g.id) > 0).length;

  // ── частинки: липкий шар на висоту вікна (не скролиться разом зі стежкою)
  const fxLayer = h('div', { class: `wp-fx fx-w${wi}`, 'aria-hidden': 'true' });
  const kinds = PARTICLES[wi] || PARTICLES[1];
  const nPart = reduced() ? 0 : 18;
  for (let i = 0; i < nPart; i++) {
    const k = kinds[i % kinds.length];
    const r = (n) => ((Math.sin((i + 1) * 12.9898 * n) * 43758.5453) % 1 + 1) % 1;   // стабільний «рандом»
    fxLayer.append(h('i', {
      class: `pt pt-${k}`,
      style: { '--x': `${(r(1) * 100).toFixed(1)}%`, '--y': `${(r(2) * 100).toFixed(1)}%`, '--s': (0.6 + r(3) * 0.8).toFixed(2),
        '--d': `${(6 + r(4) * 8).toFixed(1)}s`, '--dl': `${(-r(5) * 14).toFixed(1)}s`, '--dx': `${((r(6) - 0.5) * 80).toFixed(0)}px` },
    }));
  }

  // ── шапка світу
  const tag = st.badges.includes(w.id) ? h('span', { class: 'pill pill-gold', text: '🏅 Боса переможено' })
    : st.by_test.includes(w.id) ? h('span', { class: 'pill', text: '📘 Зараховано за тестом' }) : null;
  const counter = h('b', { class: 'wp-count-n', text: `${got}/${total}` });
  const head = h('header', { class: `wp-head wh-${wi}` },
    h('div', { class: 'world-emblem', 'aria-hidden': 'true', text: w.emoji }),
    h('div', { class: 'world-hd-txt' },
      h('span', { class: 'pill pill-lvl', text: `Світ ${wi} · ${w.level}` }),
      h('h1', { class: 'title-sticker', text: w.name }),
      tag),
    h('div', { class: 'wp-count', 'aria-label': `Зірок: ${got} з ${total}` },
      h('span', { class: 'wp-count-star', 'aria-hidden': 'true', text: '⭐' }), counter,
      h('span', { class: 'wp-count-bar' }, h('i', { style: { transform: `scaleX(${total ? got / total : 0})` } })),
      h('small', { text: `рівнів: ${doneN}/${list.length}` })));
  const intro = h('p', { class: 'wp-intro', text: w.intro });

  // ── стежка
  const ys = [];
  list.forEach((_, i) => {
    if (i === 0) { ys.push(TOP + (curIdx === 0 ? CUR_GAP * 0.6 : 0)); return; }
    ys.push(ys[i - 1] + STEP + (i === curIdx ? CUR_GAP : 0) + (i - 1 === curIdx ? CUR_GAP * 0.6 : 0));
  });
  const height = (ys[ys.length - 1] || TOP) + BOTTOM;
  const path = h('div', { class: `wp wv-${wi}`, style: { height: height + 'px' } });
  const parFar = h('div', { class: 'wp-par far', 'aria-hidden': 'true' });
  const parNear = h('div', { class: 'wp-par near', 'aria-hidden': 'true' });
  const deco = DECO[wi] || DECO[1];
  const col = DECO_COL[wi] || DECO_COL[1];
  const nDeco = Math.ceil(height / 150);
  for (let i = 0; i < nDeco; i++) {
    const left = i % 2 === 0;
    const far = i % 3 !== 0;
    const sz = far ? 54 + (i * 17) % 40 : 70 + (i * 23) % 50;
    (far ? parFar : parNear).append(h('span', {
      class: 'wp-deco',
      style: { top: `${i * 150 + (i * 37) % 60}px`, [left ? 'left' : 'right']: `${-14 + (i * 13) % 26}px`, width: `${sz}px`, '--r': `${((i * 7) % 11) - 5}deg` },
    }, svgFrom(deco[i % deco.length](col))));
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'wp-road');
  svg.setAttribute('aria-hidden', 'true');
  path.append(parFar, parNear, svg);

  let lumiBox = null;
  const nodes = list.map((g, i) => {
    const s = gameStars(st, g.id);
    const open = isOpen(st, w.id, i);
    const isCur = !!next && g.idx === next.idx;
    const isEnd = !next && i === curIdx;
    const cls = ['wp-node', `t-${g.type}`, open ? 'open' : 'locked', s ? 'done' : '', isCur ? 'current' : '', isEnd ? 'end' : '']
      .filter(Boolean).join(' ');
    const medal = h('span', { class: 'wp-medal' },
      h('img', { src: app.asset(g.cover), alt: '', loading: i > curIdx + 3 ? 'lazy' : 'eager', draggable: 'false' }),
      h('span', { class: 'wp-num', 'aria-hidden': 'true', text: String(i + 1) }),
      open ? h('span', { class: 'wp-stars' }, starsRow(s, 3, 'sm')) : h('span', { class: 'wp-lock', 'aria-hidden': 'true', text: '🔒' }));
    const label = h('span', { class: 'wp-label' },
      h('span', { class: 'wp-title', text: `${g.emoji} ${g.title}` }),
      isCur ? h('span', { class: 'wp-play', text: s ? 'Ще раз' : 'Грати' }) : null);
    const btn = h('button', {
      class: cls, type: 'button', style: { '--i': i },
      'aria-label': `${i + 1}. ${g.title}${open ? `, зірок ${s} з 3` : ', закрито'}`,
    }, medal, label);
    if (isCur || isEnd) {
      lumiBox = h('span', { class: 'wp-lumi' });
      medal.append(lumiBox);
    }
    btn.addEventListener('click', () => onTap(g, i, open, btn));
    path.append(btn);
    return btn;
  });

  root.append(fxLayer, h('div', { class: 'world wp-world' }, head, intro, path));

  // ── Лумі на поточному вузлі
  let lumi = null;
  if (lumiBox) {
    const side = xAt(curIdx) > 0.5 ? 'left' : 'right';
    lumi = app.makeLumi(lumiBox, { size: 66, emotion: next ? 'hello' : 'proud', bubble: side });
    setTimeout(() => lumi && lumi.say(next ? (gameStars(st, next.id) ? 'Покращимо рекорд?' : 'Нам сюди! ✨') : 'Світ пройдено! 🏅'), 1100);
  }

  function onTap(g, i, open, btn) {
    jelly(btn);
    if (open) {
      app.tg.tap(g.type === 'boss' ? 'heavy' : 'medium');
      app.go(g.screen, g.params);
      return;
    }
    app.tg.notify('warning');
    fx.shake(btn);
    const prevDone = i > 0 && gameStars(st, list[i - 1].id) >= 1;
    const msg = g.type === 'boss' && (prevDone || st.by_test.includes(w.id)) ? 'Спочатку пройди всі уроки!' : 'Спочатку пройди попередній!';
    if (lumi) {
      lumi.set('thinking');
      lumi.react('shake');
      lumi.say(msg);
      setTimeout(() => lumi && lumi.set(next ? 'hello' : 'proud'), 1600);
    }
    // якщо Лумі не видно — підказка тостом
    const r = lumiBox && lumiBox.getBoundingClientRect();
    const vr = root.getBoundingClientRect();
    if (!r || r.bottom < vr.top || r.top > vr.bottom) toast(`🔒 ${msg}`);
  }

  // ── розкладка (залежить від ширини)
  let pts = [];
  const layout = () => {
    const W = path.clientWidth || 360;
    pts = list.map((_, i) => [Math.round(xAt(i) * W), ys[i]]);
    nodes.forEach((n, i) => { n.style.left = `${pts[i][0]}px`; n.style.top = `${pts[i][1]}px`; });
    svg.setAttribute('viewBox', `0 0 ${W} ${height}`);
    svg.setAttribute('width', W);
    svg.setAttribute('height', height);
    const d = roadPath(pts);
    const dDone = roadPath(pts.slice(0, curIdx + 1));
    svg.innerHTML = `<path class="road-edge" d="${d}"/><path class="road" d="${d}"/><path class="road-dash" d="${d}"/>` +
      (curIdx > 0 ? `<path class="road-done" d="${dDone}" pathLength="1"/><path class="road-done-dash" d="${dDone}"/>` : '');
  };
  layout();
  const ro = new ResizeObserver(() => {
    layout();
    fxLayer.style.setProperty('--vh', `${root.clientHeight}px`);
  });
  ro.observe(path);
  fxLayer.style.setProperty('--vh', `${root.clientHeight || window.innerHeight}px`);

  // ── паралакс: фон стежки рухається повільніше за дорогу
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const y = root.scrollTop;
      parFar.style.transform = `translate3d(0, ${(y * 0.45).toFixed(1)}px, 0)`;
      parNear.style.transform = `translate3d(0, ${(y * 0.2).toFixed(1)}px, 0)`;
    });
  };
  if (!reduced()) root.addEventListener('scroll', onScroll, { passive: true });

  // ── автоскрол до поточного вузла (роутер скидає scrollTop після render — тому з паузою)
  const scrollT = setTimeout(() => {
    const top = path.offsetTop + (pts[curIdx] ? pts[curIdx][1] : 0) - root.clientHeight * 0.48;
    if (curIdx > 0 && top > 40) root.scrollTo({ top, behavior: reduced() ? 'auto' : 'smooth' });
  }, 420);

  return () => {
    clearTimeout(scrollT);
    cancelAnimationFrame(raf);
    root.removeEventListener('scroll', onScroll);
    ro.disconnect();
    lumi = null;
  };
}

function svgFrom(str) {
  const t = document.createElement('template');
  t.innerHTML = str.trim();
  return t.content.firstChild;
}
