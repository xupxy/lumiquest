// v19 «Ігри Б» — спільний каркас унікальних міні-ігор країн c6–c10 (special_c6..c10.js).
// Інтро → відлік 3-2-1 → гра (60–90 с, rAF, лише transform/opacity) → результат (⭐ за точність, recordGame).
// Власний WebAudio-синт (ритм/музика гри) — окремий AudioContext, поважає налаштування звуку з audio.js.
// Стилі — css/countries_games2.css (префікс sp2-).
import * as S from './state.js?v=20261112181924';
import * as FX from './fx.js?v=20261112181924';
import { recordGame, starsByRatio } from './games.js?v=20261112181924';

let I = {};
try { I = await import('./i18n.js?v=20261112181924'); } catch (e) { /* */ }
let A = {};
import('./audio.js?v=20261112181924').then((m) => { A = m; }).catch(() => { /* */ });

const STR = {
  uk: {
    'sp2.go': '▶ Грати', 'sp2.back': '‹ Назад', 'sp2.again': '🔁 Ще раз', 'sp2.next': '➡️ Далі',
    'sp2.win': 'Браво!', 'sp2.lose': 'Ще трохи практики!', 'sp2.acc': 'Точність', 'sp2.ok': 'Влучно', 'sp2.bad': 'Помилки',
    'sp2.combo': 'Найкраще комбо', 'sp2.learn': '📒 Слова гри (тапни — почуєш):', 'sp2.need': 'Для ⭐ — щонайменше {n} влучних',
    'sp2.time': '⏱ {s} с', 'sp2.perfect': 'PERFECT!', 'sp2.good': 'GOOD', 'sp2.miss': 'MISS',
  },
  ru: {
    'sp2.go': '▶ Играть', 'sp2.back': '‹ Назад', 'sp2.again': '🔁 Ещё раз', 'sp2.next': '➡️ Дальше',
    'sp2.win': 'Браво!', 'sp2.lose': 'Ещё немного практики!', 'sp2.acc': 'Точность', 'sp2.ok': 'Метко', 'sp2.bad': 'Ошибки',
    'sp2.combo': 'Лучшее комбо', 'sp2.learn': '📒 Слова игры (тапни — услышишь):', 'sp2.need': 'Для ⭐ — минимум {n} метких',
    'sp2.time': '⏱ {s} с', 'sp2.perfect': 'PERFECT!', 'sp2.good': 'GOOD', 'sp2.miss': 'MISS',
  },
};
try { I.addStrings?.(STR); } catch (e) { /* */ }

export const lang = () => { try { return I.lang?.() === 'ru' ? 'ru' : 'uk'; } catch (e) { return 'uk'; } };
export const T = (k, v) => {
  let s;
  try { s = I.t?.(k, v); } catch (e) { /* */ }
  if (!s || s === k) { s = STR[lang()][k] || k; if (v) for (const [a, b] of Object.entries(v)) s = s.replaceAll(`{${a}}`, b); }
  return s;
};
/** {uk, ru} | [uk, ru] | string → рядок поточною мовою */
export const tr = (o) => (o == null ? '' : typeof o === 'string' ? o : Array.isArray(o) ? (lang() === 'ru' ? o[1] ?? o[0] : o[0]) : (o[lang()] ?? o.uk ?? ''));
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const pick = (a) => a[(Math.random() * a.length) | 0];
export const lite = () => document.documentElement.dataset.perf === 'lite';
const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Пари [рідна, english] зі словника країни (WORDS[cN] / WORDS_RU[cN]), якщо є */
export function countryWords(app, wid, re = /^[a-z][a-z' -]{1,16}$/i) {
  let list = [];
  try { list = I.tw?.(wid) || []; } catch (e) { /* */ }
  if (!list.length) list = (app?.content?.WORDS && app.content.WORDS[wid]) || [];
  return list.filter((p) => Array.isArray(p) && p[0] && p[1] && re.test(p[1]));
}
/** Поле країни з content.json (COUNTRIES), напр. slang */
export function country(app, wid) {
  try { return (app?.content?.COUNTRIES || []).find((c) => c.id === wid) || null; } catch (e) { return null; }
}

export function ensureCss() {
  if (document.querySelector('link[href$="countries_games2.css"]')) return;
  const l = document.createElement('link'); l.rel = 'stylesheet';
  l.href = new URL('./countries_games2.css?v=20261112181924', import.meta.url).href;
  document.head.append(l);
}

// ───────────────────────────── власний синт (WebAudio)
function makeSynth() {
  let sound = true;
  try { sound = A.getSettings ? A.getSettings().sound !== false : true; } catch (e) { /* */ }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!sound || !AC) return null;
  let ctx;
  try { ctx = new AC(); } catch (e) { return null; }
  try { ctx.resume?.(); } catch (e) { /* */ }
  const out = ctx.createGain(); out.gain.value = 0.55;
  const comp = ctx.createDynamicsCompressor(); out.connect(comp); comp.connect(ctx.destination);
  let nbuf = null;
  const noiseBuf = () => {
    if (nbuf) return nbuf;
    nbuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return nbuf;
  };
  const env = (g, t, a, d, v) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  const tone = (f, t, d = 0.2, { w = 'triangle', v = 0.2, a = 0.005, f2 = 0, lp = 0 } = {}) => {
    try {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = w; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      let n = o;
      if (lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); n = fl; }
      n.connect(g); g.connect(out); env(g, t, a, d, v); o.start(t); o.stop(t + a + d + 0.05);
    } catch (e) { /* */ }
  };
  const noise = (t, d = 0.08, { v = 0.2, f = 2000, type = 'bandpass', q = 1 } = {}) => {
    try {
      const s = ctx.createBufferSource(); s.buffer = noiseBuf();
      const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
      const g = ctx.createGain(); s.connect(fl); fl.connect(g); g.connect(out); env(g, t, 0.002, d, v); s.start(t); s.stop(t + d + 0.05);
    } catch (e) { /* */ }
  };
  return {
    ctx,
    now: () => ctx.currentTime,
    tone, noise,
    kick: (t, v = 0.8) => tone(150, t, 0.25, { w: 'sine', v, f2: 42 }),
    snare: (t, v = 0.35) => { noise(t, 0.14, { v, f: 1900, q: 0.7 }); tone(190, t, 0.07, { v: v * 0.6 }); },
    hat: (t, v = 0.12) => noise(t, 0.035, { v, f: 8000, type: 'highpass' }),
    clap: (t, v = 0.35) => { [0, 0.011, 0.022].forEach((o) => noise(t + o, 0.05, { v: v * 0.8, f: 1300, q: 1.4 })); noise(t + 0.03, 0.12, { v: v * 0.5, f: 1100, q: 1 }); },
    pluck: (f, t, v = 0.2) => { tone(f, t, 0.35, { w: 'sawtooth', v: v * 0.6, lp: f * 3 }); tone(f * 2, t, 0.12, { w: 'triangle', v: v * 0.25 }); },
    bass: (f, t, d = 0.25, v = 0.3) => { tone(f, t, d, { w: 'sawtooth', v, lp: 420 }); tone(f, t, d, { w: 'sine', v: v * 0.7 }); },
    lead: (f, t, d = 0.2, v = 0.12) => { tone(f, t, d, { w: 'square', v, lp: 2600 }); tone(f * 1.005, t, d, { w: 'sawtooth', v: v * 0.5, lp: 2200 }); },
    chord: (fs, t, d = 0.4, v = 0.05) => fs.forEach((f) => tone(f, t, d, { w: 'sawtooth', v, a: 0.02, lp: 1600 })),
    stop: () => { try { ctx.close(); } catch (e) { /* */ } },
  };
}
export const midi = (m) => 440 * 2 ** ((m - 69) / 12);

/**
 * Каркас гри. cfg: { wid, id, cls, ico, title:{uk,ru}, rules:[{uk,ru}…], secs, minOk,
 *   build(K) — побудувати поле (K.field), start(K), frame(K, now, dt), beat?:{bpm, steps, fn(K, step, t)} , end?(K) }
 */
export function makeGame(root, params, app, cfg) {
  ensureCss();
  const wid = params?.wid || cfg.wid;
  const st = app.state;
  const gameId = params?.id || `${wid}-special`;
  let alive = true, rafId = 0, schedT = 0;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); return t; };
  const scr = document.createElement('div');
  scr.className = `sp2 ${cfg.cls || ''}`;
  root.appendChild(scr);
  const $ = (q) => scr.querySelector(q);

  const K = {
    app, st, wid, scr, $, later, lite, field: null, running: false, synth: null,
    ok: 0, bad: 0, combo: 0, best: 0, score: 0, learned: new Map(),
    get alive() { return alive; },
    sfx: (n) => { try { A.sfx?.(n); } catch (e) { /* */ } },
    speak: (x, o) => { try { if (!K.synth || !K.running) A.speak?.(x, o); } catch (e) { /* */ } },
    speakAlways: (x, o) => { try { A.speak?.(x, o); } catch (e) { /* */ } },
    hap: (k = 'light') => { try { app.tg?.tap?.(k); } catch (e) { /* */ } },
    learn: (en, nat) => { if (en && !K.learned.has(en)) K.learned.set(en, nat || ''); },
    /** влучання: +очки, комбо, іскри */
    hit(el, pts = 10, label) {
      K.ok++; K.combo++; K.best = Math.max(K.best, K.combo);
      const mult = 1 + Math.min(4, (K.combo / 5) | 0);
      K.score += pts * mult;
      try { S.onCorrectAnswer?.(st); } catch (e) { /* */ }
      if (el) { try { FX.sparkle?.(el, { count: lite() ? 3 : 8 }); } catch (e) { /* */ } pop(el, 'sp2-ok'); }
      if (label) K.toast(label, 'ok');
      if (K.combo > 0 && K.combo % 5 === 0) { K.sfx('combo'); K.toast(`🔥 x${mult}`, 'combo'); }
      K.hud();
    },
    /** промах; en — англ. слово для повторення (review) */
    miss(el, en, label) {
      K.bad++; K.combo = 0;
      if (en) { try { S.noteMiss?.(st, wid, en); } catch (e) { /* */ } }
      if (el) pop(el, 'sp2-bad');
      if (label) K.toast(label, 'bad');
      K.hap('error');
      K.hud();
    },
    toast(text, kind = '') {
      const t = document.createElement('div'); t.className = `sp2-toast ${kind}`; t.textContent = text;
      scr.appendChild(t); later(() => t.remove(), 900);
    },
    floatAt(x, y, text, kind = '', parent = K.field) {
      const t = document.createElement('div'); t.className = `sp2-float ${kind}`; t.textContent = text;
      t.style.left = `${x}px`; t.style.top = `${y}px`; (parent || K.field).appendChild(t); later(() => t.remove(), 800);
    },
    hud() {
      const s = $('.sp2-score'); if (s) s.textContent = `⭐ ${K.score}`;
      const c = $('.sp2-combo'); if (c) { c.textContent = K.combo > 1 ? `🔥 ${K.combo}` : ''; c.classList.toggle('on', K.combo > 1); }
    },
    now: () => 0,
    end: () => finish(),
  };
  function pop(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  function intro() {
    const ov = document.createElement('div'); ov.className = 'sp2-ov';
    ov.innerHTML = `<div class="sp2-box"><div class="sp2-ico">${cfg.ico}</div><h2>${esc(tr(cfg.title))}</h2>
      ${cfg.rules.map((r) => `<p>${esc(tr(r))}</p>`).join('')}
      <p class="sp2-mini">⏱ ${cfg.secs} s · ${esc(T('sp2.need', { n: cfg.minOk }))}</p>
      <button class="sp2-go" data-a="go">${esc(T('sp2.go'))}</button>
      <button class="sp2-go sec" data-a="back">${esc(T('sp2.back'))}</button></div>`;
    scr.appendChild(ov);
    ov.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'go') { K.sfx('open'); ov.remove(); start(); } else if (a === 'back') app.back();
    });
  }

  function start() {
    Object.assign(K, { ok: 0, bad: 0, combo: 0, best: 0, score: 0, learned: new Map(), running: false });
    scr.querySelectorAll('.sp2-top,.sp2-field,.sp2-ov').forEach((n) => n.remove());
    scr.insertAdjacentHTML('beforeend', `<div class="sp2-top"><button class="sp2-btn" data-a="back" aria-label="back">‹</button>
      <span class="sp2-chip sp2-time"></span><span class="sp2-chip sp2-score">⭐ 0</span><span class="sp2-chip sp2-combo"></span>
      <i class="sp2-bar"><b></b></i></div><div class="sp2-field"></div>`);
    K.field = $('.sp2-field');
    try { A.duck?.(true); } catch (e) { /* */ }
    if (cfg.beat && !K.synth) K.synth = makeSynth();
    cfg.build(K);
    $('.sp2-time').textContent = T('sp2.time', { s: cfg.secs });
    // відлік
    const cd = document.createElement('div'); cd.className = 'sp2-cd'; scr.appendChild(cd);
    [3, 2, 1, 0].forEach((n, i) => later(() => {
      cd.textContent = n ? String(n) : 'GO!'; pop(cd, 'on'); K.sfx(n ? 'countdown' : 'go');
      if (!n) later(() => { cd.remove(); run(); }, 450);
    }, i * 600));
  }

  function run() {
    K.running = true;
    let acc = 0, last = performance.now();
    const sy = K.synth;
    const t0 = sy ? sy.now() + 0.05 : 0;
    K.now = sy ? () => sy.now() - t0 : () => acc;
    K.t0 = t0;
    if (cfg.beat && sy) { // планувальник із запасом 0.15 с
      const spb = 60 / cfg.beat.bpm / (cfg.beat.steps || 2);
      let step = 0;
      const tick = () => {
        if (!alive || !K.running) return;
        while (t0 + step * spb < sy.now() + 0.15) { cfg.beat.fn(K, step, t0 + step * spb); step++; }
      };
      schedT = setInterval(tick, 25); tick();
    }
    cfg.start(K);
    let lastSec = -1;
    const bar = $('.sp2-bar b');
    const loop = (ts) => {
      if (!alive || !K.running) return;
      const dt = Math.min(0.1, (ts - last) / 1000); last = ts; acc += dt;
      const now = K.now();
      const left = Math.max(0, cfg.secs - now);
      const s = Math.ceil(left);
      if (s !== lastSec) { lastSec = s; $('.sp2-time').textContent = T('sp2.time', { s }); if (s <= 5 && s > 0) K.sfx('tick'); }
      if (bar) bar.style.transform = `scaleX(${left / cfg.secs})`;
      cfg.frame(K, now, dt);
      if (left <= 0) { finish(); return; }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame((ts) => { last = ts; loop(ts); });
  }

  function onVis() {
    const sy = K.synth; if (!sy) return;
    try { if (document.hidden) sy.ctx.suspend(); else if (K.running) sy.ctx.resume(); } catch (e) { /* */ }
  }
  document.addEventListener('visibilitychange', onVis);

  function finish() {
    if (!K.running) return;
    K.running = false;
    cancelAnimationFrame(rafId); clearInterval(schedT);
    if (K.synth) { const s = K.synth; K.synth = null; later(() => s.stop(), 400); }
    try { A.duck?.(false); } catch (e) { /* */ }
    try { cfg.end?.(K); } catch (e) { /* */ }
    const total = K.ok + K.bad;
    const accp = total ? K.ok / total : 0;
    const win = K.ok >= cfg.minOk;
    const stars = win ? Math.max(1, starsByRatio(accp)) : 0;
    try { recordGame(st, gameId, stars); S.addXP?.(st, Math.min(60, K.ok * 2)); app.save?.(); } catch (e) { /* */ }
    K.sfx(win ? 'win' : 'lose');
    const words = [...K.learned.entries()].slice(-8);
    const ov = document.createElement('div'); ov.className = 'sp2-ov';
    ov.innerHTML = `<div class="sp2-box"><div class="sp2-ico">${win ? '🏆' : cfg.ico}</div><h2>${esc(T(win ? 'sp2.win' : 'sp2.lose'))}</h2>
      <div class="sp2-stars">${[0, 1, 2].map((i) => `<i class="${i < stars ? 'on' : ''}" style="animation-delay:${0.35 + i * 0.25}s">⭐</i>`).join('')}</div>
      <div class="sp2-res"><span>${esc(T('sp2.acc'))}<b>${Math.round(accp * 100)}%</b></span><span>${esc(T('sp2.ok'))}<b>${K.ok}</b></span>
      <span>${esc(T('sp2.bad'))}<b>${K.bad}</b></span><span>${esc(T('sp2.combo'))}<b>${K.best}</b></span></div>
      ${words.length ? `<div class="sp2-learn"><small>${esc(T('sp2.learn'))}</small>${words.map(([en, nat]) => `<button data-say="${esc(en)}"><b>${esc(en)}</b>${nat ? ` — ${esc(nat)}` : ''}</button>`).join('')}</div>` : ''}
      <button class="sp2-go" data-a="${win ? 'back' : 'again'}">${esc(T(win ? 'sp2.next' : 'sp2.again'))}</button>
      <button class="sp2-go sec" data-a="${win ? 'again' : 'back'}">${esc(T(win ? 'sp2.again' : 'sp2.back'))}</button></div>`;
    scr.appendChild(ov);
    for (let i = 0; i < stars; i++) later(() => K.sfx('star'), 420 + i * 250);
    if (stars >= 3) later(() => { try { if (lite() || reduced()) FX.sparkle?.(ov.querySelector('.sp2-stars'), { count: 8 }); else FX.confetti?.(); } catch (e) { /* */ } }, 1100);
    ov.addEventListener('click', (e) => {
      const say = e.target.closest('[data-say]')?.dataset.say;
      if (say) { K.speakAlways(say); return; }
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'again') { ov.remove(); start(); } else if (a === 'back') app.back();
    });
  }

  function onTop(e) { if (e.target.closest('.sp2-top [data-a="back"]')) app.back(); }
  scr.addEventListener('click', onTop);
  intro();

  return () => {
    alive = false; K.running = false;
    cancelAnimationFrame(rafId); clearInterval(schedT);
    timers.forEach(clearTimeout); timers.clear();
    document.removeEventListener('visibilitychange', onVis);
    scr.removeEventListener('click', onTop);
    try { cfg.cleanup?.(K); } catch (e) { /* */ }
    if (K.synth) { K.synth.stop(); K.synth = null; }
    try { A.duck?.(false); } catch (e) { /* */ }
    scr.remove();
  };
}
