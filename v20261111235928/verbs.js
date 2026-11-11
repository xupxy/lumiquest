// 🔀 Неправильні дієслова — дві частини:
//   а) «Вивчи»: таблиця з 10 дієслів (V1 – V2 – V3 + переклад), тап по рядку — озвучка трьох форм;
//   б) «Тренування»: 12 питань — вибір Past Simple (V2) / Past Participle (V3) з 4 варіантів і набір з клавіатури.
// Без сердець і таймера. Помилка — показуємо три форми, дієслово повертається наприкінці (макс. 1 раз).
// Контент: app.content.VERBS[wid] = [{v1, v2, v3, uk, ru}]; «/» у формі — кілька прийнятних варіантів.
import * as S from './state.js?v=20261111235927';
import * as FX from './fx.js?v=20261111235927';
import { recordGame, starsByRatio } from './games.js?v=20261111235927';

let I = {};
try { I = await import('./i18n.js?v=20261111235927'); } catch (e) { /* */ }
let A = {};
import('./audio.js?v=20261111235927').then((m) => { A = m; }).catch(() => { /* */ });
let TH = {};
try { TH = await import('./theme.js?v=20261111235927'); } catch (e) { /* */ }

const sfx = (n) => { try { A.sfx?.(n); } catch (e) { /* */ } };
const speak = (x) => { try { A.speak?.(x); } catch (e) { /* */ } };
const hap = (app, k = 'light') => { try { app.tg?.tap?.(k); } catch (e) { /* */ } };

const STR = {
  uk: {
    'mode.verbs.title': 'Неправильні дієслова', 'mode.verbs.learn': '📖 Вивчи',
    'mode.verbs.tip': '👆 Тапни рядок — Лумі вимовить усі три форми. Запамʼятай їх!',
    'mode.verbs.h1': 'Основа', 'mode.verbs.h2': 'Past Simple', 'mode.verbs.h3': 'Past Participle',
    'mode.verbs.ready': '✅ Готово, тренуймось!', 'mode.verbs.back': '‹ Назад',
    'mode.verbs.q2': 'Вибери Past Simple (V2)', 'mode.verbs.q3': 'Вибери Past Participle (V3)',
    'mode.verbs.t2': 'Напиши Past Simple (V2)', 'mode.verbs.t3': 'Напиши Past Participle (V3)',
    'mode.verbs.ph': 'Введи форму…', 'mode.verbs.check': 'Перевірити', 'mode.verbs.cont': 'Далі ➜',
    'mode.verbs.good': '✅ Правильно!', 'mode.verbs.bad': '❌ Запамʼятай:', 'mode.verbs.retry': '🔁 Повторімо ще раз',
    'mode.verbs.win': 'МОЛОДЕЦЬ!', 'mode.verbs.first': 'З першої спроби: {a}/{b}',
    'mode.verbs.again': '🔁 Ще раз', 'mode.verbs.next': '➡️ Далі', 'mode.verbs.table': '📖 До таблиці',
    'mode.verbs.none': 'Для цього світу ще немає дієслів.',
  },
  ru: {
    'mode.verbs.title': 'Неправильные глаголы', 'mode.verbs.learn': '📖 Выучи',
    'mode.verbs.tip': '👆 Тапни строку — Луми произнесёт все три формы. Запомни их!',
    'mode.verbs.h1': 'Основа', 'mode.verbs.h2': 'Past Simple', 'mode.verbs.h3': 'Past Participle',
    'mode.verbs.ready': '✅ Готово, тренируемся!', 'mode.verbs.back': '‹ Назад',
    'mode.verbs.q2': 'Выбери Past Simple (V2)', 'mode.verbs.q3': 'Выбери Past Participle (V3)',
    'mode.verbs.t2': 'Напиши Past Simple (V2)', 'mode.verbs.t3': 'Напиши Past Participle (V3)',
    'mode.verbs.ph': 'Введи форму…', 'mode.verbs.check': 'Проверить', 'mode.verbs.cont': 'Дальше ➜',
    'mode.verbs.good': '✅ Правильно!', 'mode.verbs.bad': '❌ Запомни:', 'mode.verbs.retry': '🔁 Повторим ещё раз',
    'mode.verbs.win': 'МОЛОДЕЦ!', 'mode.verbs.first': 'С первой попытки: {a}/{b}',
    'mode.verbs.again': '🔁 Ещё раз', 'mode.verbs.next': '➡️ Дальше', 'mode.verbs.table': '📖 К таблице',
    'mode.verbs.none': 'Для этого мира пока нет глаголов.',
  },
};
try { I.addStrings?.(STR); } catch (e) { /* */ }
const T = (k, v) => {
  let s;
  try { s = I.t?.(k, v); } catch (e) { /* */ }
  if (!s || s === k) { s = (STR[(I.lang?.() === 'ru') ? 'ru' : 'uk'][k]) || k; if (v) for (const [a, b] of Object.entries(v)) s = s.replaceAll(`{${a}}`, b); }
  return s;
};

const CSS = `
.vb{position:absolute;inset:0;display:flex;flex-direction:column;padding:calc(10px + env(safe-area-inset-top,0px)) 12px calc(12px + env(safe-area-inset-bottom,0px));gap:10px;overflow:hidden;
  background:linear-gradient(180deg,var(--w-bg1,#c9f0ff),var(--w-bg2,#e6dcff));color:#3a2433}
.vb-top{display:flex;align-items:center;gap:8px}
.vb-btn{min-width:44px;height:44px;border-radius:14px;border:2px solid rgba(58,36,51,.35);background:#fffaf0;font-family:inherit;font-weight:800;font-size:18px;color:#3a2433}
.vb-chip{padding:8px 12px;border-radius:999px;background:#fffaf0;border:2px solid rgba(58,36,51,.25);font-weight:800;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vb-chip.grow{flex:1;min-width:0;text-align:center}
.vb-tip{margin:0;padding:9px 12px;border-radius:14px;background:rgba(255,255,255,.6);font-size:14px;line-height:1.3;font-weight:700}
.vb-table{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;background:#fffaf0;border:3px solid #3a2433;border-radius:22px;box-shadow:0 5px 0 rgba(58,36,51,.25)}
.vb-head,.vb-forms{display:grid;grid-template-columns:1fr 1fr 1.15fr;gap:6px;align-items:center}
.vb-head{position:sticky;top:0;z-index:1;padding:8px 10px;background:#3a2433;color:#fffaf0;border-radius:18px 18px 0 0;font-size:11px;font-weight:800;letter-spacing:.03em;text-align:center}
.vb-head b{display:block;font-size:15px}
.vb-row{display:block;width:100%;padding:8px 10px 7px;border:0;border-bottom:2px dashed rgba(58,36,51,.14);background:none;font-family:inherit;color:inherit;text-align:center;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:background .2s}
.vb-row:last-child{border-bottom:0}
.vb-row:nth-child(odd){background:rgba(92,200,232,.09)}
.vb-row.on{background:rgba(247,183,51,.3)}
.vb-f{padding:6px 4px;border-radius:11px;font-weight:900;font-size:16px;line-height:1.15;overflow-wrap:anywhere}
.vb-f.f1{background:#fff;border:2px solid rgba(58,36,51,.25)}
.vb-f.f2{background:#cdefff;border:2px solid #5cc8e8}
.vb-f.f3{background:#e6dbff;border:2px solid #a78bfa}
.vb-tr{margin-top:5px;font-size:13px;font-weight:700;opacity:.72}
.vb-go{display:block;width:100%;min-height:52px;padding:6px 12px;border-radius:16px;border:3px solid #3a2433;background:linear-gradient(#ffe08a,#f7b733);font-family:inherit;font-weight:900;font-size:18px;color:#3a2433;box-shadow:0 4px 0 rgba(58,36,51,.3);flex-shrink:0}
.vb-go.sec{background:#fff;box-shadow:none;border-width:2px;font-weight:800;margin-top:10px}
.vb-go:disabled{opacity:.5}
.vb-bar{height:10px;border-radius:99px;background:rgba(58,36,51,.15);overflow:hidden;flex-shrink:0}
.vb-bar i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#5cc8e8,#7be0a4);transition:width .35s}
.vb-body{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:10px}
.vb-card{position:relative;background:#fffaf0;border:3px solid #3a2433;border-radius:22px;padding:12px 12px 14px;text-align:center;box-shadow:0 5px 0 rgba(58,36,51,.25);animation:vb-in .3s both}
.vb-label{font-size:13px;letter-spacing:.04em;text-transform:uppercase;opacity:.65;font-weight:800}
.vb-v1{font-size:34px;font-weight:900;line-height:1.15;margin-top:2px}
.vb-nat{font-size:16px;font-weight:700;opacity:.75;margin-bottom:10px}
.vb-slot{min-height:36px;display:grid;place-items:center}
.vb-slot.ask{background:#fff7d6;border:2px dashed #f7b733;color:#b47a00}
.vb-slot.dim{opacity:.4}
.vb-slot.hit{background:#7be0a4;border:2px solid #2f9e62;color:#3a2433;animation:vb-pop .4s}
.vb-slot.miss{background:#ffe1e4;border:2px solid #e2596a;color:#3a2433}
.vb-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.vb-opt{min-height:60px;padding:6px 8px;border-radius:18px;border:3px solid #3a2433;background:#fff;font-family:inherit;font-weight:900;font-size:19px;color:#3a2433;box-shadow:0 4px 0 rgba(58,36,51,.25);overflow-wrap:anywhere;touch-action:manipulation;animation:vb-in .3s both}
.vb-opt:active{transform:translateY(2px);box-shadow:0 2px 0 rgba(58,36,51,.25)}
.vb-opt.ok{background:#7be0a4;border-color:#2f9e62}
.vb-opt.no{background:#ffb3bb;border-color:#e2596a;animation:vb-bad .4s}
.vb-opt:disabled{opacity:1}.vb-opt.off{opacity:.5}
.vb-type{display:flex;gap:8px}
.vb-in{flex:1;min-width:0;height:56px;padding:0 14px;border-radius:16px;border:3px solid #3a2433;background:#fff;font-family:inherit;font-weight:800;font-size:20px;color:#3a2433;text-align:center;outline:none;user-select:text;-webkit-user-select:text}
.vb-in:focus{border-color:#5cc8e8;box-shadow:0 0 0 4px rgba(92,200,232,.35)}
.vb-in.ok{background:#d6f7e3;border-color:#2f9e62}.vb-in.no{background:#ffe1e4;border-color:#e2596a;animation:vb-bad .4s}
.vb-chk{width:auto;padding:0 16px;font-size:16px}
.vb-fb{border-radius:18px;padding:10px 12px;text-align:center;font-weight:800;font-size:16px;animation:vb-in .25s both}
.vb-fb.ok{background:#d6f7e3;border:2px solid #2f9e62}.vb-fb.no{background:#ffe9eb;border:2px solid #e2596a}
.vb-fb .vb-three{margin:6px 0 2px;font-size:20px;font-weight:900;overflow-wrap:anywhere}
.vb-fb small{display:block;font-size:13px;opacity:.7;font-weight:700}
.vb-fb .vb-go{margin-top:10px}
.vb-ov{position:absolute;inset:0;display:grid;place-items:center;background:rgba(40,24,60,.45);padding:18px;z-index:5;animation:vb-fade .25s both}
.vb-box{width:100%;max-width:360px;background:#fffaf0;border:3px solid #3a2433;border-radius:26px;padding:20px 18px;text-align:center;box-shadow:0 8px 0 rgba(58,36,51,.3)}
.vb-box h2{margin:4px 0 10px;font-size:26px}.vb-box p{margin:8px 0 12px;padding:10px 12px;border-radius:14px;background:rgba(92,200,232,.16);font-size:16px;font-weight:700}
.vb-ico{font-size:54px;line-height:1}.vb-stars{font-size:40px;letter-spacing:6px;margin:6px 0}.vb-stars i{font-style:normal;opacity:.2;display:inline-block}.vb-stars i.on{opacity:1;animation:vb-pop .5s cubic-bezier(.3,1.6,.5,1) both}
@keyframes vb-fade{from{opacity:0}to{opacity:1}}
@keyframes vb-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes vb-pop{from{transform:scale(.4)}60%{transform:scale(1.15)}to{transform:scale(1)}}
@keyframes vb-bad{20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(4px)}}
@media (prefers-reduced-motion:reduce){.vb *{animation:none!important}}
`;
function ensureCss() {
  if (document.getElementById('vb-style')) return;
  const st = document.createElement('style'); st.id = 'vb-style'; st.textContent = CSS; document.head.appendChild(st);
}

const QUESTIONS = 12;
const EARLY = new Set(['w1', 'w1b']);   // A1/A1+: тренуємо лише Past Simple (V2)
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [b[i], b[j]] = [b[j], b[i]]; } return b; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
const variants = (s) => String(s || '').split('/').map((x) => x.trim()).filter(Boolean);
const show = (s) => esc(variants(s).join(' / '));
const three = (v) => `${v.v1}, ${variants(v.v2).join(', ')}, ${variants(v.v3).join(', ')}`;
/** Чи відповідь збігається з будь-яким варіантом форми (без регістру й пробілів). */
export const accepts = (form, answer) => { const a = norm(answer); return !!a && (variants(form).some((x) => norm(x) === a) || norm(form) === a); };
/** «Правильна» (хибна для неправильних дієслів) форма на -ed: go → goed, make → maked, fly → flied. */
const regular = (v) => (/e$/.test(v) ? `${v}d` : /[^aeiou]y$/.test(v) ? `${v.slice(0, -1)}ied` : `${v}ed`);

/** 4 варіанти для форми form ('v2' | 'v3'): правильна + 3 правдоподібні хибні (goed, wented/wenten, сусідня форма, чуже дієслово). */
export function buildOptions(verb, form, all) {
  const right = verb[form];
  const used = new Set([norm(right), ...variants(right).map(norm)]);
  const v2 = variants(verb.v2)[0], v3 = variants(verb.v3)[0];
  const twisted = /(ed|en)$/.test(v2) ? null : form === 'v2' ? regular(v2) : `${v2}${/e$/.test(v2) ? 'n' : 'en'}`;
  const foreign = shuffle(all.filter((x) => x !== verb)).map((x) => variants(x[form])[0]);
  const cands = [regular(verb.v1), form === 'v2' ? v3 : v2, ...(Math.random() < 0.5 ? [twisted, foreign[0]] : [foreign[0], twisted]), ...foreign.slice(1)];
  const wrong = [];
  for (const c of cands) {
    if (!c || used.has(norm(c))) continue;
    used.add(norm(c)); wrong.push(c);
    if (wrong.length === 3) break;
  }
  return shuffle([right, ...wrong]);
}

/** Черга з QUESTIONS питань: типи чергуються; у ранніх світах — тільки V2. */
function buildQueue(verbs, early) {
  const base = shuffle(verbs).slice(0, 10);
  const cycle = early ? ['mc2', 'type2'] : ['mc2', 'mc3', 'type2', 'mc2', 'mc3', 'type3'];
  const out = [];
  for (let i = 0; i < QUESTIONS; i++) {
    const verb = base[i % base.length];
    // повтор дієслова (питання 11–12) — іншим типом, ніж першого разу
    const kind = cycle[(i + (early && i >= base.length ? 1 : 0)) % cycle.length];
    out.push({ verb, kind, form: kind.endsWith('3') ? 'v3' : 'v2', typed: kind.startsWith('type'), retry: false });
  }
  return out;
}

export const meta = { topbar: false };

export function render(root, params, app) {
  ensureCss();
  const wid = (params && params.wid) || 'w1';
  const st = app.state;
  const gameId = (params && params.id) || `${wid}-verbs`;
  const natKey = () => ((I.lang?.() === 'ru') ? 'ru' : 'uk');
  const nat = (v) => v[natKey()] || v.uk || '';
  let alive = true;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); };

  const scr = document.createElement('div');
  scr.className = 'vb';
  root.appendChild(scr);
  let unTheme = null;
  try { unTheme = TH.applyWorldTheme?.(scr, wid, { decor: false }) || null; } catch (e) { /* */ }

  const verbs = ((app.content.VERBS && app.content.VERBS[wid]) || []).filter((v) => v && v.v1 && v.v2 && v.v3);
  const early = EARLY.has(wid);
  let g = null;
  const $ = (q) => scr.querySelector(q);
  const top = (chip, prog = '') => `<div class="vb-top"><button class="vb-btn" data-a="back" data-sfx="back" aria-label="back">‹</button>
    <span class="vb-chip grow">${esc(chip)}</span>${prog}</div>`;

  // ── а) «Вивчи» ────────────────────────────────────────────────────────────
  function learn() {
    g = null;
    scr.innerHTML = top(`🔀 ${T('mode.verbs.title')}`) + (verbs.length < 4
      ? `<p class="vb-tip">${esc(T('mode.verbs.none'))}</p><button class="vb-go sec" data-a="back" data-sfx="back">${esc(T('mode.verbs.back'))}</button>`
      : `<p class="vb-tip">${esc(T('mode.verbs.tip'))}</p>
      <div class="vb-table"><div class="vb-head"><span><b>V1</b>${esc(T('mode.verbs.h1'))}</span><span><b>V2</b>${esc(T('mode.verbs.h2'))}</span><span><b>V3</b>${esc(T('mode.verbs.h3'))}</span></div>
      ${verbs.map((v, i) => `<button class="vb-row" data-i="${i}" data-sfx="none"><span class="vb-forms">
        <span class="vb-f f1">${show(v.v1)}</span><span class="vb-f f2">${show(v.v2)}</span><span class="vb-f f3">${show(v.v3)}</span></span>
        <span class="vb-tr">🔊 ${esc(nat(v))}</span></button>`).join('')}</div>
      <button class="vb-go" data-a="train" data-sfx="open">${esc(T('mode.verbs.ready'))}</button>`);
  }
  function sayRow(row) {
    const v = verbs[+row.dataset.i];
    if (!v) return;
    scr.querySelectorAll('.vb-row.on').forEach((n) => n.classList.remove('on'));
    row.classList.add('on');
    sfx('tap'); hap(app, 'light'); speak(three(v));
    later(() => row.classList.remove('on'), 1800);
  }

  // ── б) «Тренування» ───────────────────────────────────────────────────────
  function train() {
    g = { queue: buildQueue(verbs, early), qi: 0, total: QUESTIONS, first: 0, bad: 0, busy: false, q: null };
    scr.innerHTML = `${top(`🔀 ${T('mode.verbs.title')}`, '<span class="vb-chip vb-prog"></span>')}
      <div class="vb-bar"><i></i></div><div class="vb-body"></div>`;
    question();
  }
  function question() {
    const q = g.queue[g.qi];
    g.q = q; g.busy = false;
    const v = q.verb;
    $('.vb-prog').textContent = `${g.qi + 1}/${g.queue.length}`;
    $('.vb-bar i').style.width = `${(g.qi / g.queue.length) * 100}%`;
    const slot = (f) => (f === q.form ? '<span class="vb-f vb-slot ask">?</span>' : '<span class="vb-f vb-slot dim">···</span>');
    const label = T(`mode.verbs.${q.typed ? 't' : 'q'}${q.form === 'v3' ? 3 : 2}`);
    $('.vb-body').innerHTML = `<div class="vb-card">
        <div class="vb-label">${q.retry ? `${esc(T('mode.verbs.retry'))} · ` : ''}${esc(label)}</div>
        <div class="vb-v1">${esc(v.v1)}</div><div class="vb-nat">${esc(nat(v))}</div>
        <div class="vb-forms"><span class="vb-f f1 vb-slot">${esc(v.v1)}</span>${slot('v2')}${slot('v3')}</div></div>
      ${q.typed
    ? `<div class="vb-type"><input class="vb-in" type="text" inputmode="text" enterkeyhint="done" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="24" placeholder="${esc(T('mode.verbs.ph'))}" aria-label="${esc(label)}">
        <button class="vb-go vb-chk" data-a="check" data-sfx="none">${esc(T('mode.verbs.check'))}</button></div>`
    : `<div class="vb-opts">${buildOptions(v, q.form, verbs).map((o, i) => `<button class="vb-opt" data-o="${esc(o)}" data-sfx="none" style="animation-delay:${i * 50}ms">${show(o)}</button>`).join('')}</div>`}`;
    if (q.typed) { try { $('.vb-in').focus({ preventScroll: true }); } catch (e) { /* */ } }
  }
  function reveal(ok) {
    const q = g.q, v = q.verb;
    const slots = scr.querySelectorAll('.vb-card .vb-slot');
    [v.v1, v.v2, v.v3].forEach((f, i) => {
      const s = slots[i]; if (!s) return;
      s.innerHTML = show(f); s.classList.remove('ask', 'dim');
      if (i === (q.form === 'v3' ? 2 : 1)) s.classList.add(ok ? 'hit' : 'miss'); else if (i) s.classList.add(i === 1 ? 'f2' : 'f3');
    });
  }
  function answer(val, btn) {
    if (!g || g.busy) return;
    const q = g.q, v = q.verb;
    const ok = accepts(v[q.form], val);
    g.busy = true;
    const input = $('.vb-in');
    if (input) { input.readOnly = true; input.classList.add(ok ? 'ok' : 'no'); const c = $('.vb-chk'); if (c) c.disabled = true; }
    scr.querySelectorAll('.vb-opt').forEach((b) => {
      b.disabled = true;
      if (accepts(v[q.form], b.dataset.o)) b.classList.add('ok'); else if (b === btn) b.classList.add('no'); else b.classList.add('off');
    });
    reveal(ok);
    const fb = document.createElement('div');
    if (ok) {
      if (!q.retry) g.first += 1;
      try { S.onCorrectAnswer(st); S.addXP(st, 10); } catch (e) { /* */ }
      sfx('correct'); hap(app, 'success');
      try { FX.floatText?.($('.vb-card'), '+10 XP'); } catch (e) { /* */ }
      later(() => speak(three(v)), 250);
      fb.className = 'vb-fb ok';
      fb.innerHTML = `${esc(T('mode.verbs.good'))}<div class="vb-three">${show(v.v1)} → ${show(v.v2)} → ${show(v.v3)}</div>`;
      $('.vb-body').appendChild(fb);
      later(next, 1500);
    } else {
      g.bad += 1;
      try { S.noteMiss?.(st, wid, v.v1); } catch (e) { /* */ }
      if (!q.retry) g.queue.push({ ...q, retry: true });   // повертається наприкінці — лише один раз
      sfx('wrong'); hap(app, 'error');
      fb.className = 'vb-fb no';
      fb.innerHTML = `${esc(T('mode.verbs.bad'))}<div class="vb-three">${show(v.v1)} → ${show(v.v2)} → ${show(v.v3)}</div><small>${esc(nat(v))}</small>
        <button class="vb-go" data-a="next" data-sfx="tap">${esc(T('mode.verbs.cont'))}</button>`;
      $('.vb-body').appendChild(fb);
      try { input?.blur(); fb.scrollIntoView({ block: 'nearest' }); } catch (e) { /* */ }
    }
  }
  function next() {
    if (!g) return;
    if (g.qi + 1 >= g.queue.length) { finish(); return; }
    g.qi += 1; question();
  }

  function finish() {
    const bar = $('.vb-bar i'); if (bar) bar.style.width = '100%';
    const stars = Math.max(1, starsByRatio(g.total ? g.first / g.total : 1));   // гру пройдено — мінімум 1 ⭐
    try { recordGame(st, gameId, stars); app.save?.(); } catch (e) { /* */ }
    sfx('win');
    if (stars === 3) { try { FX.confetti?.(); } catch (e) { /* */ } }
    const ov = document.createElement('div'); ov.className = 'vb-ov';
    ov.innerHTML = `<div class="vb-box"><div class="vb-ico">🏆</div><h2>${esc(T('mode.verbs.win'))}</h2>
      <div class="vb-stars">${[0, 1, 2].map((i) => `<i class="${i < stars ? 'on' : ''}" style="animation-delay:${300 + i * 300}ms">⭐</i>`).join('')}</div>
      <p>${esc(T('mode.verbs.first', { a: g.first, b: g.total }))}</p>
      <button class="vb-go" data-a="back" data-sfx="open">${esc(T('mode.verbs.next'))}</button>
      <button class="vb-go sec" data-a="train">${esc(T('mode.verbs.again'))}</button>
      <button class="vb-go sec" data-a="learn">${esc(T('mode.verbs.table'))}</button></div>`;
    scr.appendChild(ov);
    for (let i = 0; i < stars; i++) later(() => sfx('star'), 350 + i * 300);
  }

  function onClick(e) {
    const row = e.target.closest('.vb-row');
    if (row) { sayRow(row); return; }
    const opt = e.target.closest('.vb-opt');
    if (opt) { answer(opt.dataset.o, opt); return; }
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'back') app.back();
    else if (a === 'train') train();
    else if (a === 'learn') learn();
    else if (a === 'check') { const v = $('.vb-in')?.value; if (norm(v)) answer(v); else $('.vb-in')?.focus(); }
    else if (a === 'next') next();
  }
  function onKey(e) {
    if (e.key !== 'Enter' || !g || !e.target.classList?.contains('vb-in')) return;
    e.preventDefault();
    if (!g.busy) { if (norm(e.target.value)) answer(e.target.value); } else if ($('.vb-fb [data-a="next"]')) next();
  }
  scr.addEventListener('click', onClick);
  scr.addEventListener('keydown', onKey);
  learn();

  return () => {
    alive = false;
    timers.forEach(clearTimeout); timers.clear();
    scr.removeEventListener('click', onClick);
    scr.removeEventListener('keydown', onKey);
    try { if (typeof unTheme === 'function') unTheme(); } catch (e) { /* */ }
    scr.remove();
  };
}
