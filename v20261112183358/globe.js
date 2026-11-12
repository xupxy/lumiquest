// 🌍 Глобус (v19) — «Навколосвітня подорож»: крутиться свайпом (інерція), точки-країни, маршрут літака між пройденими.
// Суша/сітка/маршрут — на canvas (перемальовується лише під час руху), точки-країни — DOM із transform/opacity.
// rAF зупиняється, коли глобус нерухомий, вкладка схована або екран закрито; у lite — без авто-обертання.
import { h } from './ui.js?v=20261112183346';
import { t, tc } from './i18n.js?v=20261112183346';
import * as S from './state.js?v=20261112183346';
import { worldGames, gameStars, nextGame } from './games.js?v=20261112183346';
import { geoOf, flagOf, anim, lite, reduced, planeIntro } from './travel.js?v=20261112183346';

export const meta = { topbar: true };

const RAD = Math.PI / 180;
// груба маска суші: широта центру смуги (крок 10°) → діапазони індексів довготи (i → −175 + 10·i)
const LAND = {
  75: [[6, 10], [12, 15], [19, 19], [23, 28], [32, 33]],
  65: [[1, 3], [4, 11], [13, 15], [16, 16], [19, 20], [21, 35]],
  55: [[2, 2], [5, 11], [17, 17], [19, 21], [22, 31], [33, 34]],
  45: [[5, 11], [17, 22], [23, 31], [32, 32]],
  35: [[5, 10], [17, 18], [21, 25], [26, 29], [30, 31]],
  25: [[7, 9], [16, 21], [22, 23], [25, 26], [27, 29]],
  15: [[8, 9], [16, 22], [25, 25], [27, 28]],
  5: [[9, 12], [17, 22], [27, 29]],
  [-5]: [[10, 14], [19, 21], [28, 32]],
  [-15]: [[10, 13], [19, 21], [22, 22], [30, 32]],
  [-25]: [[11, 13], [19, 21], [29, 33]],
  [-35]: [[11, 12], [20, 20], [31, 32], [35, 35]],
  [-45]: [[10, 11], [34, 34]],
  [-55]: [[11, 11]],
  [-75]: [[0, 35]],
};
const LAND_PTS = (() => {
  const out = [];
  for (const [lat, ranges] of Object.entries(LAND)) {
    for (const [a, b] of ranges) {
      for (let i = a; i <= b; i++) {
        for (const dl of [-2.5, 2.5]) for (const dn of [-2.5, 2.5]) out.push([(+lat + dl) * RAD, (-175 + 10 * i + dn) * RAD]);
      }
    }
  }
  return out;
})();

const vec = ([la, lo]) => [Math.cos(la * RAD) * Math.cos(lo * RAD), Math.cos(la * RAD) * Math.sin(lo * RAD), Math.sin(la * RAD)];
const unvec = ([x, y, z]) => [Math.asin(Math.max(-1, Math.min(1, z))), Math.atan2(y, x)];
/** Точки дуги великого кола між двома [lat, lon] (у радіанах на виході). */
function arc(a, b, n = 32) {
  const A = vec(a); const B = vec(b);
  const d = Math.acos(Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]))) || 1e-6;
  const out = [];
  for (let k = 0; k <= n; k++) {
    const f = k / n;
    const s1 = Math.sin((1 - f) * d) / Math.sin(d); const s2 = Math.sin(f * d) / Math.sin(d);
    const lift = 1 + Math.sin(f * Math.PI) * Math.min(0.12, d * 0.08);   // маршрут трохи «над» землею
    const p = unvec([A[0] * s1 + B[0] * s2, A[1] * s1 + B[1] * s2, A[2] * s1 + B[2] * s2]);
    out.push([p[0], p[1], lift]);
  }
  return out;
}

export function render(root, params, app) {
  const st = app.state;
  const open = S.travelOpen(st);
  const L = S.countryList();
  const doneL = L.filter((c) => S.countryDone(st, c.id));
  const cur = L.find((c) => st.unlocked.includes(c.id) && !S.countryDone(st, c.id)) || doneL[doneL.length - 1] || L[0] || null;

  let alive = true;
  const timers = [];
  // ── розмітка
  const canvas = h('canvas', { class: 'gl-cv', 'aria-hidden': 'true' });
  const pinsBox = h('div', { class: 'gl-pins' });
  const plane = h('div', { class: 'gl-plane', 'aria-hidden': 'true', text: '✈️' });
  const sphere = h('div', { class: 'gl-sphere' }, h('div', { class: 'gl-ocean', 'aria-hidden': 'true' }), canvas, pinsBox, plane, h('div', { class: 'gl-shine', 'aria-hidden': 'true' }));
  const info = h('div', { class: 'gl-info' });
  const chips = h('div', { class: 'gl-chips', role: 'list' });
  const quizOk = doneL.length >= 3;
  const actions = h('div', { class: 'gl-actions' },
    h('button', { class: 'gl-act', type: 'button', data: { sfx: 'open' }, on: { click: () => app.go('passport') } }, h('span', { text: '🛂' }), h('b', { text: t('travel.passport') }), h('small', { text: t('pp.stamps', { n: doneL.length, total: L.length || 10 }) })),
    h('button', { class: `gl-act${quizOk ? '' : ' locked'}`, type: 'button', data: { sfx: quizOk ? 'open' : 'none' }, on: { click: () => (quizOk ? app.go('quizwhere') : app.toast(t('travel.quizLock'))) } },
      h('span', { text: quizOk ? '🗺' : '🔒' }), h('b', { text: t('travel.quiz') }), h('small', { text: quizOk ? '⭐'.repeat(st.quiz_where || 0) || '—' : t('travel.quizLock') })));
  const wrap = h('div', { class: 'gl' },
    h('header', { class: 'gl-head' }, h('h1', { class: 'title-sticker', text: `🌍 ${t('travel.title')}` }),
      h('span', { class: 'pill', text: t('travel.sub', { n: doneL.length, total: L.length || 10 }) })),
    sphere, h('p', { class: 'gl-hint', text: t('travel.swipe') }), info, open ? actions : null, chips);
  root.append(wrap);

  // ── стан країни
  const statusOf = (c) => (S.countryDone(st, c.id) ? 'done' : st.unlocked.includes(c.id) ? 'open' : 'locked');
  const pins = L.map((c) => {
    const s = statusOf(c);
    const b = h('button', { class: `gl-pin ${s}${cur && c.id === cur.id ? ' cur' : ''}`, type: 'button', 'aria-label': tc(c, 'name') || c.id, data: { sfx: 'tap' } },
      h('span', { class: 'gl-pin-dot' }), h('span', { class: 'gl-pin-flag', text: flagOf(c) }));
    b.addEventListener('click', () => select(c, true));
    pinsBox.append(b);
    return { c, b, ll: geoOf(c).map((x) => x * RAD) };
  });
  L.forEach((c, i) => {
    const s = statusOf(c);
    const b = h('button', { class: `gl-chip ${s}`, type: 'button', role: 'listitem' }, h('span', { text: flagOf(c) }), h('small', { text: `${i + 1}` }));
    b.addEventListener('click', () => select(c, true));
    chips.append(b);
  });

  // ── маршрут: пройдені по черзі + пунктир до поточної
  const routePts = [];
  const legs = [];
  for (let i = 1; i < L.length; i++) {
    const a = L[i - 1]; const b = L[i];
    if (!S.countryDone(st, a.id) || !st.unlocked.includes(b.id)) break;
    legs.push({ pts: arc(geoOf(a), geoOf(b)), dash: !S.countryDone(st, b.id) });
  }
  legs.forEach((l) => routePts.push(...l.pts));

  // ── камера
  const ctx = canvas.getContext('2d');
  let W = 0; let R = 0; let dpr = 1;
  const startLL = cur ? geoOf(cur) : [30, 10];
  let lon0 = startLL[1] * RAD; let lat0 = Math.max(-0.6, Math.min(0.6, startLL[0] * RAD * 0.7));
  let vLon = 0; let vLat = 0; let target = null;
  let dragging = false; let last = null; let raf = 0; let dirty = true;
  let planeT = 0;
  const autoSpin = !lite() && !reduced();

  function resize() {
    W = sphere.clientWidth || 300;
    dpr = Math.min(window.devicePixelRatio || 1, lite() ? 1 : 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(W * dpr);
    R = W / 2 - 2;
    dirty = true; kick();
  }
  function proj(la, lo, lift = 1) {
    const cl = Math.cos(la); const dl = lo - lon0;
    const z = Math.sin(lat0) * Math.sin(la) + Math.cos(lat0) * cl * Math.cos(dl);
    const x = R * lift * cl * Math.sin(dl);
    const y = R * lift * (Math.cos(lat0) * Math.sin(la) - Math.sin(lat0) * cl * Math.cos(dl));
    return [W / 2 + x, W / 2 - y, z];
  }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, W);
    // сітка
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let lo = -180; lo < 180; lo += 30) {
      let pen = false;
      for (let la = -90; la <= 90; la += 6) { const [x, y, z] = proj(la * RAD, lo * RAD); if (z > 0) { pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; } else pen = false; }
    }
    for (let la = -60; la <= 60; la += 30) {
      let pen = false;
      for (let lo = -180; lo <= 180; lo += 6) { const [x, y, z] = proj(la * RAD, lo * RAD); if (z > 0) { pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; } else pen = false; }
    }
    ctx.stroke();
    // суша
    const sz = Math.max(2.4, R / 34);
    ctx.fillStyle = '#7fd68f';
    ctx.beginPath();
    for (const [la, lo] of LAND_PTS) {
      const [x, y, z] = proj(la, lo);
      if (z > 0.02) { const s = sz * (0.55 + 0.45 * z); ctx.moveTo(x + s, y); ctx.arc(x, y, s, 0, 6.2832); }
    }
    ctx.fill();
    // маршрут
    ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (const l of legs) {
      ctx.strokeStyle = l.dash ? 'rgba(255,216,74,.75)' : '#ffd84a';
      ctx.setLineDash(l.dash ? [5, 6] : []);
      ctx.beginPath();
      let pen = false;
      for (const [la, lo, lift] of l.pts) { const [x, y, z] = proj(la, lo, lift); if (z > -0.05) { pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; } else pen = false; }
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // точки-країни (DOM, лише transform/opacity)
    for (const p of pins) {
      const [x, y, z] = proj(p.ll[0], p.ll[1]);
      const vis = z > 0.05;
      p.b.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) scale(${(0.7 + 0.3 * Math.max(0, z)).toFixed(3)})`;
      p.b.style.opacity = vis ? String(Math.min(1, z * 3)) : '0';
      p.b.style.pointerEvents = vis ? 'auto' : 'none';
    }
    // літачок на останньому відрізку маршруту
    const leg = legs[legs.length - 1];
    if (leg) {
      const n = leg.pts.length - 1;
      const f = autoSpin ? (planeT % 1) : 1;
      const k = Math.min(n - 1, Math.floor(f * n));
      const [la, lo, lift] = leg.pts[k]; const nx = leg.pts[k + 1];
      const [x, y, z] = proj(la, lo, lift); const [x2, y2] = proj(nx[0], nx[1], nx[2]);
      const ang = Math.atan2(y2 - y, x2 - x) / RAD + 45;   // ✈️ дивиться вгору-вправо
      plane.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) rotate(${ang.toFixed(1)}deg)`;
      plane.style.opacity = z > 0 ? '1' : '0';
    } else plane.style.opacity = '0';
  }
  function frame(ts) {
    raf = 0;
    if (!alive) return;
    let moving = false;
    if (!dragging) {
      if (target) {
        let d = target[1] - lon0; d = Math.atan2(Math.sin(d), Math.cos(d));
        const dl = target[0] - lat0;
        lon0 += d * 0.14; lat0 += dl * 0.14;
        if (Math.abs(d) < 0.002 && Math.abs(dl) < 0.002) target = null;
        moving = true;
      } else if (Math.abs(vLon) > 0.0004 || Math.abs(vLat) > 0.0004) {
        lon0 += vLon; lat0 = clampLat(lat0 + vLat); vLon *= 0.94; vLat *= 0.9; moving = true;
      } else if (autoSpin) { lon0 += 0.0022; moving = true; }
    }
    if (autoSpin && legs.length) { planeT += 0.004; moving = true; }
    if (moving || dirty) { draw(); dirty = false; }
    if ((moving || dragging) && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && alive) raf = requestAnimationFrame(frame); };
  const clampLat = (v) => Math.max(-1.1, Math.min(1.1, v));

  // ── свайп
  sphere.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.gl-pin')) return;
    dragging = true; target = null; last = [e.clientX, e.clientY, performance.now()];
    vLon = 0; vLat = 0;
    try { sphere.setPointerCapture(e.pointerId); } catch (er) { /* */ }
    kick();
  });
  sphere.addEventListener('pointermove', (e) => {
    if (!dragging || !last) return;
    const dx = e.clientX - last[0]; const dy = e.clientY - last[1];
    const k = 1 / Math.max(60, R);
    lon0 -= dx * k; lat0 = clampLat(lat0 + dy * k);
    vLon = -dx * k; vLat = dy * k;
    last = [e.clientX, e.clientY, performance.now()];
    dirty = true; kick();
  });
  const up = () => { if (!dragging) return; dragging = false; if (last && performance.now() - last[2] > 90) { vLon = 0; vLat = 0; } kick(); };
  sphere.addEventListener('pointerup', up);
  sphere.addEventListener('pointercancel', up);
  const onVis = () => { if (!document.hidden) kick(); };
  document.addEventListener('visibilitychange', onVis);
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => resize()) : null;
  if (ro) ro.observe(sphere); else window.addEventListener('resize', resize);

  // ── інфо-картка
  function select(c, fly) {
    if (!c) return;
    const s = statusOf(c);
    pins.forEach((p) => p.b.classList.toggle('sel', p.c.id === c.id));
    [...chips.children].forEach((b, i) => b.classList.toggle('sel', L[i] && L[i].id === c.id));
    if (fly) { const g = geoOf(c); target = [clampLat(g[0] * RAD * 0.7), g[1] * RAD]; vLon = 0; vLat = 0; kick(); try { app.tg.tap('light'); } catch (e) { /* */ } }
    const i = L.indexOf(c);
    const games = s !== 'locked' ? worldGames(c.id) : [];
    const got = games.reduce((a, g) => a + gameStars(st, g.id), 0);
    const nx = s !== 'locked' ? nextGame(st, c.id) : null;
    const prev = L[i - 1];
    const sub = !open ? t('travel.notYet') : s === 'locked' ? t('travel.lockedC', { name: prev ? tc(prev, 'name') : '' })
      : !games.length ? t('travel.noData') : `⭐ ${got}/${games.length * 3}`;
    info.textContent = '';
    const card = h('div', { class: `gl-card ${s}` },
      h('span', { class: 'gl-card-flag', text: flagOf(c) }),
      h('div', { class: 'gl-card-txt' }, h('small', { text: t('travel.countryN', { n: i + 1, level: c.level || 'B1' }) }), h('b', { text: tc(c, 'name') || c.id }),
        h('span', { class: 'gl-card-sub', text: s === 'done' ? `✅ ${t('travel.done')} · ${sub}` : sub })),
      s !== 'locked' && open && games.length
        ? h('button', { class: 'btn btn-primary gl-fly', type: 'button', data: { sfx: 'open' }, on: { click: () => app.go('world', { wid: c.id }) } }, t('travel.fly'))
        : h('span', { class: 'gl-lock', 'aria-hidden': 'true', text: '🔒' }));
    if (nx && s === 'open') card.title = `${t('travel.next')}: ${nx.emoji}`;
    info.append(card);
    anim(card, [{ opacity: 0, transform: 'translate3d(0,10px,0)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'ease-out' });
  }

  resize();
  if (!open) info.append(h('div', { class: 'gl-card locked' }, h('span', { class: 'gl-card-flag', text: '🔒' }), h('p', { class: 'gl-card-txt', text: t('travel.teaser') })));
  else select(cur, false);
  if (cur) { const p = pins.find((x) => x.c.id === cur.id); if (p && !reduced()) anim(p.b.firstChild, [{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 1400, iterations: lite() ? 1 : Infinity }); }

  // ── заставка-літачок при першому відкритті подорожі
  if (open && !st.travel_seen) {
    timers.push(setTimeout(() => {
      if (!alive) return;
      planeIntro(app).then(() => { st.travel_seen = true; try { app.save(); } catch (e) { /* */ } });
    }, 250));
  }

  return () => {
    alive = false;
    if (raf) cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    document.removeEventListener('visibilitychange', onVis);
    if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
  };
}
