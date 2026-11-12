// v19 Ігри А — спільний каркас унікальних міні-ігор країн (special_c1..c5).
// Дає: інтро-картку, HUD (таймер 60–90 с, рахунок, комбо), ok/bad-відгук (transform/opacity + звук + haptic),
// «словесний бонус» зі слів WORDS[cN] (або запасних слів гри), фінал із ⭐ за точність і recordGame('cN-special').
// Стилі — css/countries_games.css (префікс sp-), підвантажуються один раз.
import * as S from './state.js?v=20261112121905';
import * as FX from './fx.js?v=20261112121905';
import { recordGame, starsByRatio } from './games.js?v=20261112121905';

let I = {};
try { I = await import('./i18n.js?v=20261112121905'); } catch (e) { /* */ }
let A = {};
import('./audio.js?v=20261112121905').then((m) => { A = m; }).catch(() => { /* */ });

export const sfx = (n) => { try { A.sfx?.(n); } catch (e) { /* */ } };
export const speak = (x) => { try { A.speak?.(x, { rate: 0.95 }); } catch (e) { /* */ } };
export const hap = (app, k = 'light') => { try { app.tg?.tap?.(k); } catch (e) { /* */ } };
export const ru = () => { try { return I.lang?.() === 'ru'; } catch (e) { return false; } };
/** {uk, ru} | [uk, ru] | string → рядок поточною мовою */
export const L = (o) => (o == null ? '' : typeof o === 'string' ? o : Array.isArray(o) ? (ru() ? o[1] ?? o[0] : o[0]) : (ru() ? o.ru ?? o.uk : o.uk));
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const pick = (a) => a[(Math.random() * a.length) | 0];
const lite = () => document.documentElement.dataset.perf === 'lite';
const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
export const anim = (el, kf, o) => { try { if (!el?.animate || reduced()) return null; return el.animate(kf, o); } catch (e) { return null; } };

const UI_STR = {
  start: ['▶ Грати', '▶ Играть'], back: ['‹ Назад', '‹ Назад'], again: ['🔁 Ще раз', '🔁 Ещё раз'], next: ['➡️ Далі', '➡️ Дальше'],
  time: ['Час вийшов!', 'Время вышло!'], great: ['Чудова робота!', 'Отличная работа!'], try: ['Спробуй ще раз!', 'Попробуй ещё раз!'],
  acc: ['Точність', 'Точность'], done: ['Виконано', 'Выполнено'], score: ['Очки', 'Очки'], secs: ['{n} секунд — встигни якнайбільше!', '{n} секунд — успей как можно больше!'],
  bonus: ['📖 Слово-бонус', '📖 Слово-бонус'], bonusQ: ['Що означає?', 'Что значит?'], combo: ['комбо', 'комбо'],
  stars: ['⭐ — за точність: ≥95% → 3, ≥75% → 2, ≥50% → 1 (і щонайменше {m} виконаних).', '⭐ — за точность: ≥95% → 3, ≥75% → 2, ≥50% → 1 (и минимум {m} выполненных).'],
};
export const U = (k, v) => { let s = L(UI_STR[k]) || k; if (v) for (const [a, b] of Object.entries(v)) s = s.replaceAll(`{${a}}`, b); return s; };

function ensureCss() {
  if (document.querySelector('link[data-sp-css]')) return;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.spCss = '1';
  l.href = new URL('./countries_games.css?v=20261112121905', import.meta.url).href;
  document.head.append(l);
}

/** Пари слів [en, рідна] з WORDS[wid] (поточна мова) + запасні [en, uk, ru] гри. */
export function wordPairs(app, wid, extra = []) {
  let list = [];
  try { list = I.tw?.(wid) || []; } catch (e) { /* */ }
  if (!list.length) list = (app.content?.WORDS && app.content.WORDS[wid]) || [];
  const out = list.filter((p) => p && p[0] && p[1] && String(p[1]).length <= 22).map((p) => [String(p[1]), String(p[0])]);
  const seen = new Set(out.map((p) => p[0].toLowerCase()));
  for (const x of extra) if (!seen.has(x[0].toLowerCase())) { out.push([x[0], ru() ? x[2] : x[1]]); seen.add(x[0].toLowerCase()); }
  return out;
}

/**
 * cfg: { wid, id, ico, cls, title:[uk,ru], rules:[[uk,ru]×3], secs, minOk, vocab:[[en,uk,ru]], mount(ctx) → {next(), stop?()} }
 * ctx.ok(el, pts, label) / ctx.bad(el, en) / ctx.done() — одиниця «виконано» / ctx.bonus(cb) — слово-бонус / ctx.later / ctx.alive()
 */
export function spGame(root, params, app, cfg) {
  ensureCss();
  const wid = (params && params.wid) || cfg.wid;
  const gameId = (params && params.id) || `${wid}-special`;
  const st = app.state;
  const SECS = cfg.secs || 75, MIN = cfg.minOk || 6;
  let alive = true, g = null, game = null, tick = null;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); return t; };

  const scr = document.createElement('div');
  scr.className = `sp ${cfg.cls || ''}`;
  scr.dataset.world = wid;
  scr.innerHTML = `<div class="sp-deco" aria-hidden="true"></div>`;
  root.appendChild(scr);
  const $ = (q) => scr.querySelector(q);
  const words = wordPairs(app, wid, cfg.vocab || []);

  const onPress = (e) => {
    const b = e.target.closest?.('button,[data-jx]');
    if (b && !b.disabled && scr.contains(b)) anim(b, [{ transform: 'scale(1)' }, { transform: 'scale(.9)', offset: 0.3 }, { transform: 'scale(1.04)', offset: 0.7 }, { transform: 'scale(1)' }], { duration: 280, easing: 'ease-out', composite: 'add' });
  };
  scr.addEventListener('pointerdown', onPress, { passive: true });

  function overlay(html, onAct) {
    const ov = document.createElement('div'); ov.className = 'sp-ov';
    ov.innerHTML = `<div class="sp-box">${html}</div>`;
    scr.appendChild(ov);
    anim(ov.firstElementChild, [{ transform: 'translateY(24px) scale(.94)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
    ov.addEventListener('click', (e) => { const a = e.target.closest('[data-a]')?.dataset.a; if (a) onAct(a, ov); });
    return ov;
  }

  function intro() {
    overlay(`<div class="sp-ico">${cfg.ico}</div><h2>${esc(L(cfg.title))}</h2>
      ${cfg.rules.map((r) => `<p>${esc(L(r))}</p>`).join('')}
      <p class="sp-small">⏱ ${esc(U('secs', { n: SECS }))}<br>${esc(U('stars', { m: MIN }))}</p>
      <button class="sp-go" data-a="go">${esc(U('start'))}</button><button class="sp-go sec" data-a="back">${esc(U('back'))}</button>`,
    (a, ov) => { if (a === 'go') { sfx('open'); ov.remove(); start(); } else { sfx('back'); app.back(); } });
  }

  function hud() {
    const left = Math.max(0, g.left);
    $('.sp-time b').textContent = Math.ceil(left);
    $('.sp-bar i').style.transform = `scaleX(${(left / SECS).toFixed(3)})`;
    $('.sp-time').classList.toggle('low', left <= 10);
    $('.sp-score b').textContent = g.score;
    const c = $('.sp-combo'); c.textContent = g.combo >= 2 ? `×${g.combo} ${U('combo')}` : ''; c.classList.toggle('on', g.combo >= 2);
  }

  function start() {
    scr.querySelectorAll('.sp-top,.sp-bar,.sp-stage').forEach((n) => n.remove());
    scr.insertAdjacentHTML('beforeend', `<div class="sp-top"><button class="sp-btn" data-a="back" aria-label="back">‹</button>
      <span class="sp-chip sp-time">⏱ <b></b></span><span class="sp-chip sp-score">⭐ <b>0</b></span><span class="sp-combo"></span></div>
      <div class="sp-bar"><i></i></div><div class="sp-stage"></div>`);
    $('.sp-top [data-a=back]').onclick = () => { sfx('back'); app.back(); };
    g = { left: SECS, score: 0, ok: 0, bad: 0, done: 0, combo: 0, best: 0, over: false, last: performance.now(), bonusIdx: 0 };
    hud();
    sfx('go');
    game = cfg.mount(ctx) || {};
    tick = setInterval(() => {
      if (!g || g.over) return;
      const now = performance.now(); const dt = Math.min(0.5, (now - g.last) / 1000); g.last = now;
      if (document.hidden) return;
      const before = Math.ceil(g.left);
      g.left -= dt;
      if (g.left <= 5 && Math.ceil(g.left) !== before && g.left > 0) sfx('tick');
      hud();
      if (g.left <= 0) finish();
    }, 200);
    game.next?.();
  }

  const ctx = {
    scr, wid, app, words, later, L, esc, shuffle, pick, anim, sfx, speak, lite,
    get stage() { return $('.sp-stage'); },
    alive: () => alive && g && !g.over,
    ok(el, pts = 10, label) {
      if (!ctx.alive()) return;
      g.ok += 1; g.combo += 1; g.best = Math.max(g.best, g.combo);
      const add = pts + Math.min(5, g.combo - 1) * 2;
      g.score += add;
      try { S.onCorrectAnswer(st); S.addXP(st, 5); } catch (e) { /* */ }
      sfx(g.combo >= 3 ? 'combo' : 'correct'); hap(app, 'success');
      try { FX.sparkle?.(el, { count: lite() ? 3 : 9 }); FX.floatText?.(el, label || `+${add}`); } catch (e) { /* */ }
      anim(el, [{ transform: 'none' }, { transform: 'translateY(-8px) scale(1.08)', offset: 0.35 }, { transform: 'none' }], { duration: 420, easing: 'ease-out', composite: 'add' });
      anim($('.sp-score'), [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 300 });
      hud();
    },
    bad(el, en) {
      if (!ctx.alive()) return;
      g.bad += 1; g.combo = 0;
      if (en) try { S.noteMiss(st, wid, en); } catch (e) { /* */ }
      sfx('wrong'); hap(app, 'error');
      anim(el, [{ transform: 'none' }, { transform: 'translateX(-9px) rotate(-2deg)', offset: 0.2 }, { transform: 'translateX(9px) rotate(2deg)', offset: 0.45 }, { transform: 'translateX(-5px)', offset: 0.7 }, { transform: 'none' }], { duration: 420, easing: 'ease-out', composite: 'add' });
      hud();
    },
    done() { if (ctx.alive()) g.done += 1; },
    /** слово-бонус: англійське слово країни → обери переклад (3 варіанти) */
    bonus(cb) {
      if (!ctx.alive() || words.length < 3) { cb(); return; }
      if (!g.bag || !g.bag.length) g.bag = shuffle(words);
      const w = g.bag.pop();
      const opts = shuffle([w, ...shuffle(words.filter((x) => x[1] !== w[1])).slice(0, 2)]);
      const card = document.createElement('div'); card.className = 'sp-bonus';
      card.innerHTML = `<div class="sp-bonus-in"><div class="sp-bonus-h">${esc(U('bonus'))}</div><div class="sp-bonus-w">${esc(w[0])}</div>
        <div class="sp-bonus-q">${esc(U('bonusQ'))}</div><div class="sp-bonus-o">${opts.map((o, i) => `<button data-i="${i}">${esc(o[1])}</button>`).join('')}</div></div>`;
      ctx.stage.appendChild(card);
      anim(card.firstElementChild, [{ transform: 'scale(.6) rotate(-4deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,1.4,.4,1)' });
      later(() => speak(w[0]), 200);
      let used = false;
      card.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-i]'); if (!b || used || !ctx.alive()) return;
        used = true;
        const o = opts[+b.dataset.i];
        const good = o === w;
        if (good) { b.classList.add('ok'); ctx.ok(b, 8); } else {
          b.classList.add('no'); ctx.bad(b, w[0]);
          card.querySelectorAll('button')[opts.indexOf(w)].classList.add('ok');
        }
        later(() => { anim(card, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 }); later(() => { card.remove(); cb(); }, 190); }, good ? 650 : 1300);
      });
    },
  };

  function finish() {
    if (!g || g.over) return;
    g.over = true; g.left = 0; hud();
    clearInterval(tick); tick = null;
    try { game?.stop?.(); } catch (e) { /* */ }
    const total = g.ok + g.bad;
    const acc = total ? g.ok / total : 0;
    let stars = starsByRatio(acc);
    if (g.done < MIN) stars = Math.min(stars, g.done >= Math.ceil(MIN / 2) ? 1 : 0);
    try { recordGame(st, gameId, stars); app.save?.(); } catch (e) { /* */ }
    sfx(stars ? 'win' : 'lose'); hap(app, stars ? 'success' : 'warning');
    const ov = overlay(`<div class="sp-ico">${stars ? cfg.ico : '⏰'}</div><h2>${esc(stars ? U('great') : U('try'))}</h2>
      <div class="sp-sub">${esc(U('time'))}</div><div class="sp-stars"></div>
      <div class="sp-stats"><span>${esc(U('done'))}<b data-n="${g.done}">${g.done}</b></span><span>${esc(U('acc'))}<b>${Math.round(acc * 100)}%</b></span><span>${esc(U('score'))}<b data-n="${g.score}">${g.score}</b></span></div>
      <button class="sp-go" data-a="${stars ? 'back' : 'again'}">${esc(U(stars ? 'next' : 'again'))}</button>
      <button class="sp-go sec" data-a="${stars ? 'again' : 'back'}">${esc(U(stars ? 'again' : 'back'))}</button>`,
    (a, o) => { if (a === 'again') { sfx('open'); o.remove(); start(); } else { sfx('back'); app.back(); } });
    const se = ov.querySelector('.sp-stars');
    try { FX.starsDrop?.(se, stars, 3); } catch (e) { se.textContent = '⭐'.repeat(stars); }
    for (let i = 0; i < stars; i++) later(() => sfx('star'), 420 + i * 260);
    ov.querySelectorAll('[data-n]').forEach((b, k) => later(() => { try { FX.countUp?.(b, 0, +b.dataset.n || 0, 700); } catch (e) { /* */ } }, 450 + k * 120));
    if (stars >= 3) later(() => { try { if (lite()) FX.sparkle?.(se, { count: 8 }); else FX.confetti?.(); } catch (e) { /* */ } }, 1100);
  }

  intro();
  return () => {
    alive = false;
    if (g) g.over = true;
    clearInterval(tick);
    timers.forEach(clearTimeout); timers.clear();
    try { game?.stop?.(); } catch (e) { /* */ }
    scr.removeEventListener('pointerdown', onPress);
    scr.remove();
  };
}
