// 🌍 Світ: ігрова стежка з 23 рівнів (games.js) — звивиста дорога, вузли-медальйони з обкладинками,
// Лумі стоїть на поточному рівні, паралакс-фон і частинки під настрій світу.
import { h, starsRow, fx, toast, pauseOffscreen } from './ui.js?v=20261110194247';
import { getWorld, worldIndex, gameTitle } from './state.js?v=20261110194247';
import { t, tc } from './i18n.js?v=20261110194247';
import { worldGames, isOpen, nextGame, gameStars } from './games.js?v=20261110194247';
import { applyWorldTheme, worldProps, medalFrame, emblem } from './theme.js?v=20261110194247';

const STEP = 186;        // відстань між вузлами по вертикалі
const CUR_GAP = 56;      // додатковий простір навколо поточного (Лумі зверху, «Грати» знизу)
const TOP = 100;         // центр першого вузла від верху стежки
const BOTTOM = 170;
const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    toast(t('world.sleeps'));
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

  // ── тема світу на всю сторінку: фон із шарами, частинки, палітра, рамки
  const unTheme = applyWorldTheme(root, w.id, { page: true });

  // ── шапка світу
  const tag = st.badges.includes(w.id) ? h('span', { class: 'pill pill-gold', text: t('world.bossBeaten') })
    : st.by_test.includes(w.id) ? h('span', { class: 'pill', text: t('world.byTest') }) : null;
  const counter = h('b', { class: 'wp-count-n', text: `${got}/${total}` });
  const head = h('header', { class: `wp-head wh-${wi}` },
    h('div', { class: 'world-emblem', 'aria-hidden': 'true' }, svgFrom(emblem(w.id))),
    h('div', { class: 'world-hd-txt' },
      h('span', { class: 'pill pill-lvl', text: t('home.worldN', { n: wi, level: w.level }) }),
      h('h1', { class: 'title-sticker', text: tc(w, 'name') }),
      tag),
    h('div', { class: 'wp-count', 'aria-label': t('world.starsAria', { n: got, total }) },
      h('span', { class: 'wp-count-star', 'aria-hidden': 'true', text: '⭐' }), counter,
      h('span', { class: 'wp-count-bar' }, h('i', { style: { transform: `scaleX(${total ? got / total : 0})` } })),
      h('small', { text: t('world.levels', { n: doneN, total: list.length }) })));
  const intro = h('p', { class: 'wp-intro', text: tc(w, 'intro') });

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
  const deco = worldProps(w.id);
  const nDeco = Math.ceil(height / 150);
  for (let i = 0; i < nDeco; i++) {
    const left = i % 2 === 0;
    const far = i % 3 !== 0;
    const sz = far ? 54 + (i * 17) % 40 : 70 + (i * 23) % 50;
    (far ? parFar : parNear).append(h('span', {
      class: 'wp-deco',
      style: { top: `${i * 150 + (i * 37) % 60}px`, [left ? 'left' : 'right']: `${-14 + (i * 13) % 26}px`, width: `${sz}px`, rotate: `${((i * 7) % 11) - 5}deg` },
    }, svgFrom(deco[i % deco.length])));
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'wp-road');
  svg.setAttribute('aria-hidden', 'true');
  // v6: «марширувальний» пунктир — в окремому SVG-шарі, щоб його анімація не перемальовувала всю дорогу з тінями
  const svgFx = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgFx.setAttribute('class', 'wp-road wp-road-fx');
  svgFx.setAttribute('aria-hidden', 'true');
  path.append(parFar, parNear, svg, svgFx);

  let lumiBox = null;
  const nodes = list.map((g, i) => {
    const s = gameStars(st, g.id);
    const open = isOpen(st, w.id, i);
    const isCur = !!next && g.idx === next.idx;
    const isEnd = !next && i === curIdx;
    const cls = ['wp-node', `t-${g.type}`, g.hard ? 'hard' : '', open ? 'open' : 'locked', s ? 'done' : '', isCur ? 'current' : '', isEnd ? 'end' : '']
      .filter(Boolean).join(' ');
    const medal = h('span', { class: 'wp-medal' },
      h('span', { class: 'wp-frame', 'aria-hidden': 'true' }, frameLayers(medalFrame(w.id), isCur)),
      h('img', { src: app.asset(g.cover), alt: '', loading: i > curIdx + 3 ? 'lazy' : 'eager', draggable: 'false' }),
      g.hard ? h('span', { class: 'wp-fire', 'aria-hidden': 'true' }) : null,
      h('span', { class: 'wp-num', 'aria-hidden': 'true', text: String(i + 1) }),
      g.hard ? h('span', { class: 'wp-hard', 'aria-hidden': 'true', text: '🔥' }) : null,
      open ? h('span', { class: 'wp-stars' }, starsRow(s, 3, 'sm')) : h('span', { class: 'wp-lock', 'aria-hidden': 'true', text: '🔒' }));
    const label = h('span', { class: 'wp-label' },
      h('span', { class: 'wp-title', text: `${g.emoji} ${gameTitle(g)}` }),
      isCur ? h('span', { class: 'wp-play', text: s ? t('world.again') : t('world.play') }) : null);
    const btn = h('button', {
      class: cls, type: 'button', style: { '--i': i }, data: { sfx: open ? 'open' : 'none' },
      'aria-label': open ? t('world.nodeAria', { i: i + 1, title: gameTitle(g), n: s }) : t('world.nodeLocked', { i: i + 1, title: gameTitle(g) }),
    }, medal, label);
    if (isCur || isEnd) {
      lumiBox = h('span', { class: 'wp-lumi' });
      medal.append(lumiBox);
    }
    btn.style.setProperty('--i', i);
    btn.addEventListener('click', () => onTap(g, i, open, btn));
    path.append(btn);
    return btn;
  });

  root.append(h('div', { class: 'world wp-world' }, head, intro, path));

  // ── Лумі на поточному вузлі
  let lumi = null;
  if (lumiBox) {
    const side = xAt(curIdx) > 0.5 ? 'left' : 'right';
    lumi = app.makeLumi(lumiBox, { size: 66, emotion: next ? 'hello' : 'proud', bubble: side });
    setTimeout(() => lumi && lumi.say(next ? (gameStars(st, next.id) ? t('world.improve') : t('world.here')) : t('world.done')), 1100);
  }

  function onTap(g, i, open, btn) {
    jelly(btn);
    if (open) {
      app.tg.tap(g.type === 'boss' ? 'heavy' : 'medium');
      app.go(g.screen, g.params);
      return;
    }
    app.tg.notify('warning');
    app.audio.sfx('wrong');
    fx.shake(btn);
    const prevDone = i > 0 && gameStars(st, list[i - 1].id) >= 1;
    const msg = g.type === 'boss' && (prevDone || st.by_test.includes(w.id)) ? t('world.lessonsFirst') : t('world.prevFirst');
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

  // ── щойно відкритий рівень (з минулого візиту) — звук і блиск
  const seen = (app.session.seenCur = app.session.seenCur || {});
  let unlockT = 0;
  if (next && seen[w.id] !== undefined && next.idx > seen[w.id]) {
    unlockT = setTimeout(() => { app.audio.sfx('unlock'); fx.sparkle(nodes[next.idx]); }, 900);
  }
  seen[w.id] = next ? next.idx : list.length;

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
    svg.innerHTML = `<path class="road-edge" d="${d}"/><path class="road" d="${d}"/><path class="road-deco" d="${d}"/><path class="road-dash" d="${d}"/>` +
      (curIdx > 0 ? `<path class="road-done" d="${dDone}" pathLength="1"/>` : '');
    svgFx.setAttribute('viewBox', `0 0 ${W} ${height}`);
    svgFx.setAttribute('width', W);
    svgFx.setAttribute('height', height);
    svgFx.innerHTML = curIdx > 0 ? `<path class="road-done-dash" d="${dDone}"/>` : '';
  };
  layout();
  const ro = new ResizeObserver(() => layout());
  ro.observe(path);
  // v6: анімації вузлів і декору поза екраном — на паузі
  const unPause = pauseOffscreen([...nodes, ...path.querySelectorAll('.wp-deco')], root);

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
    clearTimeout(unlockT);
    cancelAnimationFrame(raf);
    root.removeEventListener('scroll', onScroll);
    ro.disconnect();
    unPause();
    unTheme();
    lumi = null;
  };
}

// v6: поточний вузол із шестернею (w3): шестерню обертаємо окремими HTML-шарами на компоновнику, без фільтра над анімацією.
//   [тінь-копія (чорнило, зсув 5px — те саме, що drop-shadow обертової шестерні)] [шестерня + сяйво] [статична рамка]
function frameLayers(str, animated) {
  const main = svgFrom(str);
  const gear = animated && main && main.querySelector && main.querySelector('.wf-gear');
  if (!gear) return main;
  const ink = gear.querySelector('[stroke]') ? gear.querySelector('[stroke]').getAttribute('stroke') : '#000';
  const gsvg = main.cloneNode(false);
  gsvg.append(gear);
  const ssvg = main.cloneNode(false);
  const sg = gear.cloneNode(true);
  sg.querySelectorAll('[fill]').forEach((n) => n.setAttribute('fill', ink));
  ssvg.innerHTML = `<circle r="49" fill="${ink}"/>`;
  ssvg.prepend(sg);
  return [h('span', { class: 'wf-gear-l sh' }, ssvg), h('span', { class: 'wf-gear-l' }, gsvg), main];
}

function svgFrom(str) {
  const t = document.createElement('template');
  t.innerHTML = str.trim();
  return t.content.firstChild;
}
