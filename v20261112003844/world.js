// 🌍 Світ: ігрова стежка-«змійка» з рівнів (games.js) — дорога петляє від краю до краю, вузли-медальйони з обкладинками,
// Лумі стоїть на поточному рівні, паралакс-фон і частинки під настрій світу.
import { h, starsRow, fx, toast, pauseOffscreen } from './ui.js?v=20261112003818';
import { getWorld, worldIndex, gameTitle } from './state.js?v=20261112003818';
import { t, tc } from './i18n.js?v=20261112003818';
import { worldGames, isOpen, nextGame, gameStars } from './games.js?v=20261112003818';
import { applyWorldTheme, worldProps, medalFrame, emblem, chapterMark } from './theme.js?v=20261112003818';

const ROW_GAP = 170;     // відстань по вертикалі між «рядами» змійки (через поворот дороги)
const TILT = 22;         // другий вузол ряду трохи нижче — ряд плавно «стікає» до повороту
const CUR_TOP = 60;      // додатковий простір над рядом поточного вузла (Лумі)
const CUR_BOT = 50;      // …і під ним (кнопка «Грати»)
const TOP = 98;          // центр першого вузла від верху стежки
const BOTTOM = 160;
const EDGE = 28;         // наскільки близько до краю екрана підходить петля дороги
const ROWS = [2, 2, 1];  // «розділ» із 5 рівнів: два ряди по два вузли й один вузол по центру, далі — акцент розділу
const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── геометрія стежки: S-подібна «змійка» від краю до краю
// Повертає для кожного вузла { row, dir (+1 зліва направо / −1 навпаки), fx (частка ширини), y }.
function snake(n, curIdx, bossAt) {
  const out = [];
  let i = 0; let row = 0; let y = TOP;
  while (i < n) {
    const cnt = Math.min(ROWS[row % ROWS.length], n - i);
    const dir = row % 2 === 0 ? 1 : -1;
    const hasCur = curIdx >= i && curIdx < i + cnt;
    const prevCur = row > 0 && curIdx < i && curIdx >= i - ROWS[(row - 1) % ROWS.length];
    if (row > 0) y += ROW_GAP + (prevCur ? CUR_BOT : 0);
    if (hasCur) y += CUR_TOP;
    if (bossAt(i)) y += 14;
    for (let k = 0; k < cnt; k++) {
      const fx = cnt === 1 ? 0.5 : (k === 0 ? 0.5 - dir * 0.22 : 0.5 + dir * 0.19);
      if (k > 0) y += TILT;
      out.push({ row, dir, fx, y });
    }
    i += cnt; row += 1;
  }
  return out;
}
// Дорога: у ряду — м'яка горизонтальна хвиля, між рядами — широка петля до краю екрана.
function roadPath(pts, W, upTo = pts.length - 1) {
  if (!pts.length) return '';
  const f = (v) => v.toFixed(1);
  const p0 = pts[0];
  let d = `M${f(p0.dir > 0 ? -24 : W + 24)} ${f(p0.y - 14)} Q${f(p0.x - p0.dir * 50)} ${f(p0.y)}, ${f(p0.x)} ${f(p0.y)}`;
  for (let i = 0; i < upTo; i++) {
    const a = pts[i]; const b = pts[i + 1];
    if (a.row === b.row) {
      const m = (a.x + b.x) / 2;
      d += ` C${f(m)} ${f(a.y)}, ${f(m)} ${f(b.y)}, ${f(b.x)} ${f(b.y)}`;
    } else {
      const e = turnX(a, b, W);
      d += ` C${f(e)} ${f(a.y)}, ${f(e)} ${f(b.y)}, ${f(b.x)} ${f(b.y)}`;
    }
  }
  return d;
}
// x контрольних точок петлі — так, щоб вершина петлі була рівно за EDGE від краю
function turnX(a, b, W) {
  const apex = a.dir > 0 ? W - EDGE : EDGE;
  return (apex - (a.x + b.x) / 8) / 0.75;
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
  const geo = snake(list.length, curIdx, (i) => list[i] && list[i].type === 'boss');
  const height = (geo.length ? geo[geo.length - 1].y : TOP) + BOTTOM;
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
  // акценти між «розділами»: на вершині петлі після кожного 5-го рівня
  const marks = [];
  for (let i = 4; i < list.length - 1; i += 5) {
    if (geo[i].row === geo[i + 1].row) continue;
    const el = h('span', { class: `wp-mark${isOpen(st, w.id, i + 1) ? '' : ' locked'}`, 'aria-hidden': 'true' }, svgFrom(chapterMark(w.id, marks.length + 2)));
    marks.push({ i, el });
    path.append(el);
  }

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
      class: cls, type: 'button', data: { sfx: open ? 'open' : 'none' },
      'aria-label': open ? t('world.nodeAria', { i: i + 1, title: gameTitle(g), n: s }) : t('world.nodeLocked', { i: i + 1, title: gameTitle(g) }),
    }, medal, label);
    if (isCur || isEnd) {
      lumiBox = h('span', { class: 'wp-lumi' });
      medal.append(lumiBox);
    }
    btn.addEventListener('click', () => onTap(g, i, open, btn));
    path.append(btn);
    return btn;
  });

  root.append(h('div', { class: 'world wp-world' }, head, intro, path));

  // ── Лумі на поточному вузлі
  let lumi = null;
  if (lumiBox) {
    const side = geo[curIdx].fx > 0.5 ? 'left' : 'right';
    lumi = app.makeLumi(lumiBox, { size: 66, emotion: next ? 'hello' : 'proud', bubble: side });
    setTimeout(() => lumi && lumi.say(next ? (gameStars(st, next.id) ? t('world.improve') : t('world.here')) : t('world.done')), 700);
  }

  function onTap(g, i, open, btn) {
    jelly(btn);
    if (open) {
      app.tg.tap(g.type === 'boss' ? 'heavy' : 'medium');
      app.go(g.screen, { ...g.params, id: g.id });
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
  const lite = document.documentElement.dataset.perf === 'lite';
  const layout = () => {
    const W = path.clientWidth || 360;
    pts = geo.map((g) => ({ ...g, x: Math.round(g.fx * W) }));
    nodes.forEach((n, i) => { n.style.left = `${pts[i].x}px`; n.style.top = `${pts[i].y}px`; });
    marks.forEach(({ i, el }) => {
      const a = pts[i]; const b = pts[i + 1];
      el.style.left = `${a.dir > 0 ? W - EDGE - 2 : EDGE + 2}px`;
      el.style.top = `${Math.round((a.y + b.y) / 2)}px`;
    });
    svg.setAttribute('viewBox', `0 0 ${W} ${height}`);
    svg.setAttribute('width', W);
    svg.setAttribute('height', height);
    const d = roadPath(pts, W);
    const dDone = roadPath(pts, W, curIdx);
    svg.innerHTML = `<path class="road-edge" d="${d}"/><path class="road" d="${d}"/><path class="road-deco" d="${d}"/><path class="road-dash" d="${d}"/>` +
      (curIdx > 0 ? `<path class="road-done" d="${dDone}"/>` : '');
    svgFx.setAttribute('viewBox', `0 0 ${W} ${height}`);
    svgFx.setAttribute('width', W);
    svgFx.setAttribute('height', height);
    svgFx.innerHTML = curIdx > 0 && !lite ? `<path class="road-done-dash" d="${dDone}"/>` : '';
  };
  layout();
  const ro = new ResizeObserver(() => layout());
  ro.observe(path);
  // v6: анімації вузлів і декору поза екраном — на паузі
  const unPause = pauseOffscreen([...nodes, ...path.querySelectorAll('.wp-deco')], root, { delay: 250 });

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
  // v17: у lite — без паралаксу (кожен кадр скролу = лише композитор)
  const isLite = () => document.documentElement.dataset.perf === 'lite';
  if (!reduced() && !isLite()) root.addEventListener('scroll', onScroll, { passive: true });

  // ── v17: автоскрол до поточного вузла — плавний: до першого кадру стрибаємо майже до цілі
  // (роутер скидає scrollTop після render), а останні ~30% висоти екрана докочуємо smooth-скролом після переходу.
  let smoothT = 0;
  const target = () => path.offsetTop + (pts[curIdx] ? pts[curIdx].y : 0) - root.clientHeight * 0.48;
  const jump = () => {
    const top = target();
    if (!(curIdx > 0 && top > 40)) return;
    if (reduced()) { root.scrollTop = top; return; }
    root.scrollTop = Math.max(0, top - root.clientHeight * 0.3);
    clearTimeout(smoothT);
    smoothT = setTimeout(() => {
      try { root.scrollTo({ top: target(), behavior: 'smooth' }); } catch (e) { root.scrollTop = target(); }
    }, 300);
  };
  const scrollR = requestAnimationFrame(jump);
  const scrollT = setTimeout(jump, 0);

  return () => {
    clearTimeout(scrollT);
    clearTimeout(smoothT);
    cancelAnimationFrame(scrollR);
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
