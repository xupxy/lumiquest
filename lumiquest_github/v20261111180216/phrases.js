// 🗣 Фрази на щодень — складаємо корисні побутові речення з плиток-слів.
// Угорі фраза мовою інтерфейсу; тап по плитці — слово летить у рядок, тап у рядку — назад.
// «Перевірити» / «Підказка» (пів-помилки) / 🔊. Без сердець і таймера. DOM + CSS (transform).
// params: { wid, part: 1|2 } — part 1 бере фрази 0–9, part 2 — 10–19 (8 раундів).
import * as S from './state.js?v=20261111180208';
import * as FX from './fx.js?v=20261111180208';
import { recordGame, starsByRatio } from './games.js?v=20261111180208';

let I = {};
try { I = await import('./i18n.js?v=20261111180208'); } catch (e) { /* */ }
let A = {};
import('./audio.js?v=20261111180208').then((m) => { A = m; }).catch(() => { /* */ });
let TH = {};
try { TH = await import('./theme.js?v=20261111180208'); } catch (e) { /* */ }

const sfx = (n) => { try { A.sfx?.(n); } catch (e) { /* */ } };
const speak = (x) => { try { A.speak?.(x); } catch (e) { /* */ } };
const hap = (app, k = 'light') => { try { app.tg?.tap?.(k); } catch (e) { /* */ } };

const STR = {
  uk: {
    'mode.phrases.title': 'Фрази на щодень', 'mode.phrases.r1': '🗣 Угорі — фраза. Склади її англійською зі слів-плиток!',
    'mode.phrases.r2': '👆 Тапни слово — воно стане в рядок. Тапни в рядку — повернеться назад. Дві плитки зайві!',
    'mode.phrases.r3': '💡 Є підказка, а часу — скільки завгодно. Попереду {n} фраз.',
    'mode.phrases.start': '▶ Грати', 'mode.phrases.back': '‹ Назад', 'mode.phrases.label': 'Склади англійською',
    'mode.phrases.check': '✅ Перевірити', 'mode.phrases.hint': '💡 Підказка', 'mode.phrases.next': 'Далі ➡️',
    'mode.phrases.place': 'Тапай слова нижче', 'mode.phrases.good': 'Чудово! +10 XP', 'mode.phrases.try': 'Майже! Виправ червоні слова',
    'mode.phrases.shown': 'Правильно ось так:', 'mode.phrases.done': 'Фрази зібрано!', 'mode.phrases.remember': 'Запам\'ятай ці фрази',
    'mode.phrases.clean': 'Без помилок: {a}/{b}', 'mode.phrases.again': '🔁 Ще раз', 'mode.phrases.cont': '➡️ Далі',
    'mode.phrases.none': 'Для цього світу ще немає фраз.', 'mode.phrases.say': 'Послухати',
  },
  ru: {
    'mode.phrases.title': 'Фразы на каждый день', 'mode.phrases.r1': '🗣 Вверху — фраза. Собери её по-английски из слов-плиток!',
    'mode.phrases.r2': '👆 Тапни слово — оно встанет в строку. Тапни в строке — вернётся назад. Две плитки лишние!',
    'mode.phrases.r3': '💡 Есть подсказка, а времени — сколько угодно. Впереди {n} фраз.',
    'mode.phrases.start': '▶ Играть', 'mode.phrases.back': '‹ Назад', 'mode.phrases.label': 'Собери по-английски',
    'mode.phrases.check': '✅ Проверить', 'mode.phrases.hint': '💡 Подсказка', 'mode.phrases.next': 'Дальше ➡️',
    'mode.phrases.place': 'Тапай слова ниже', 'mode.phrases.good': 'Отлично! +10 XP', 'mode.phrases.try': 'Почти! Исправь красные слова',
    'mode.phrases.shown': 'Правильно вот так:', 'mode.phrases.done': 'Фразы собраны!', 'mode.phrases.remember': 'Запомни эти фразы',
    'mode.phrases.clean': 'Без ошибок: {a}/{b}', 'mode.phrases.again': '🔁 Ещё раз', 'mode.phrases.cont': '➡️ Дальше',
    'mode.phrases.none': 'Для этого мира пока нет фраз.', 'mode.phrases.say': 'Послушать',
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
.ph{position:absolute;inset:0;display:flex;flex-direction:column;padding:calc(10px + env(safe-area-inset-top,0px)) 12px calc(12px + env(safe-area-inset-bottom,0px));gap:10px;overflow:hidden;
  background:linear-gradient(180deg,var(--w-bg1,#ffe3b0),var(--w-bg2,#ffd0e0));color:#3a2433;user-select:none;-webkit-user-select:none}
.ph button{font-family:inherit;color:#3a2433;-webkit-tap-highlight-color:transparent;touch-action:manipulation;cursor:pointer}
.ph-top{display:flex;align-items:center;gap:8px}
.ph-btn{min-width:44px;height:44px;border-radius:14px;border:2px solid rgba(58,36,51,.35);background:#fffaf0;font-weight:800;font-size:18px}
.ph-chip{padding:8px 12px;border-radius:999px;background:#fffaf0;border:2px solid rgba(58,36,51,.25);font-weight:800;white-space:nowrap}
.ph-bar{flex:1;height:14px;border-radius:999px;background:rgba(255,255,255,.6);border:2px solid rgba(58,36,51,.3);overflow:hidden}
.ph-bar i{display:block;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,#ffd35c,#ff9f43);transition:width .45s cubic-bezier(.3,1.3,.5,1)}
.ph-card{position:relative;background:#fffaf0;border:3px solid #3a2433;border-radius:22px;padding:10px 14px 14px;text-align:center;box-shadow:0 5px 0 rgba(58,36,51,.25)}
.ph-card:after{content:'';position:absolute;left:34px;bottom:-13px;width:20px;height:20px;background:#fffaf0;border:3px solid #3a2433;border-top:0;border-left:0;transform:rotate(45deg);border-radius:0 0 5px 0}
.ph-label{font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.6;font-weight:800}
.ph-nat{font-size:22px;font-weight:900;line-height:1.25;margin-top:4px;overflow-wrap:anywhere}
.ph-mid{flex:1;min-height:0;display:flex;flex-direction:column;gap:12px;overflow-y:auto;padding:8px 2px 2px}
.ph-line{position:relative;display:flex;flex-wrap:wrap;align-content:flex-start;gap:8px;min-height:120px;padding:10px;border-radius:20px;background:rgba(255,255,255,.55);border:3px dashed rgba(58,36,51,.35);transition:background .3s,border-color .3s}
.ph-line:empty:before{content:attr(data-ph);margin:auto;align-self:center;font-weight:800;opacity:.45;font-size:15px}
.ph-line.ok{background:#c9f5d6;border:3px solid #2fae66}
.ph-line.shown{background:#fff0c4;border:3px solid #e0a020}
.ph-line.shake{animation:ph-shake .45s ease-in-out}
.ph-msg{min-height:22px;text-align:center;font-weight:800;font-size:15px}
.ph-msg.ok{color:#1f8a4d}.ph-msg.bad{color:#c9364a}
.ph-bank{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;padding:2px}
.ph-slot{display:inline-flex;min-height:50px;border-radius:15px;background:rgba(58,36,51,.1);box-shadow:inset 0 2px 0 rgba(58,36,51,.08)}
.ph-t{min-height:50px;min-width:50px;padding:0 15px;border-radius:15px;border:2.5px solid #3a2433;background:#fff;font-weight:800;font-size:19px;line-height:1;
  box-shadow:0 4px 0 rgba(58,36,51,.3);transition:transform .28s cubic-bezier(.3,1.25,.5,1),background .2s,border-color .2s,box-shadow .2s;will-change:transform}
.ph-t:active{box-shadow:0 1px 0 rgba(58,36,51,.3)}
.ph-line .ph-t{background:#fff6d8}
.ph-t.bad{background:#ffd5d9;border-color:#d8405a;color:#a31f37}
.ph-t.hinted{background:#fff0b8;border-color:#e0a020}
.ph-line.ok .ph-t{background:#7be0a4;border-color:#1f8a4d;box-shadow:0 4px 0 rgba(31,138,77,.4)}
.ph-line.shown .ph-t{background:#ffe08a;border-color:#b97f10}
.ph.locked .ph-t{pointer-events:none}
.ph.locked .ph-bank{opacity:.45}
@keyframes ph-shake{15%{transform:translateX(-9px)}35%{transform:translateX(9px)}55%{transform:translateX(-6px)}75%{transform:translateX(5px)}}
.ph-bot{display:flex;gap:8px}
.ph-b{height:54px;padding:0 14px;border-radius:16px;border:2px solid rgba(58,36,51,.35);background:#fffaf0;font-weight:800;font-size:16px;white-space:nowrap}
.ph-b.main{flex:1;border:3px solid #3a2433;background:linear-gradient(#ffe08a,#f7b733);font-weight:900;font-size:18px;box-shadow:0 4px 0 rgba(58,36,51,.3)}
.ph-b.main.go{background:linear-gradient(#a6efc0,#52cf86)}
.ph-b.spk{min-width:54px;font-size:22px;padding:0}
.ph-b:disabled{opacity:.4;box-shadow:none}
.ph-ov{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(40,24,60,.45);padding:calc(14px + env(safe-area-inset-top,0px)) 14px calc(14px + env(safe-area-inset-bottom,0px));z-index:5;animation:ph-fade .25s both}
@keyframes ph-fade{from{opacity:0}to{opacity:1}}
@keyframes ph-in{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
.ph-box{width:100%;max-width:380px;max-height:100%;min-height:0;box-sizing:border-box;display:flex;flex-direction:column;background:#fffaf0;border:3px solid #3a2433;border-radius:26px;padding:18px 16px;text-align:center;box-shadow:0 8px 0 rgba(58,36,51,.3)}
.ph-box h2{margin:4px 0 8px;font-size:24px}.ph-box h3{margin:6px 0;font-size:16px}
.ph-box p{margin:6px 0;padding:10px 12px;border-radius:14px;background:rgba(255,170,60,.16);text-align:left;font-size:15px;line-height:1.35}
.ph-box p.c{text-align:center;font-weight:800}
.ph-ico{font-size:50px;line-height:1}.ph-stars{font-size:38px;letter-spacing:6px;margin:2px 0}.ph-stars i{font-style:normal;opacity:.2;display:inline-block}.ph-stars i.on{opacity:1;animation:ph-in .5s cubic-bezier(.3,1.6,.5,1) both}
.ph-list{flex:1;min-height:90px;overflow-y:auto;margin:4px 0;padding:0;list-style:none;text-align:left;-webkit-overflow-scrolling:touch}
.ph-list li{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:2px dashed rgba(58,36,51,.15)}
.ph-list li:last-child{border-bottom:0}
.ph-list b{display:block;font-size:16px;line-height:1.2}.ph-list span{display:block;font-size:13px;opacity:.7;line-height:1.25;margin-top:2px}
.ph-list div{flex:1;min-width:0}
.ph-say{flex:none;width:46px;height:46px;border-radius:14px;border:2px solid rgba(58,36,51,.35);background:#fff;font-size:20px;padding:0}
.ph-go{display:block;width:100%;flex:none;height:52px;margin-top:8px;border-radius:16px;border:3px solid #3a2433;background:linear-gradient(#ffe08a,#f7b733);font-weight:900;font-size:18px;box-shadow:0 4px 0 rgba(58,36,51,.3)}
.ph-go.sec{background:#fff;box-shadow:none;border-width:2px;font-weight:800;height:46px}
@media (max-height:640px){.ph-nat{font-size:19px}.ph-line{min-height:112px}.ph-t,.ph-slot{min-height:46px}.ph-t{font-size:17px;padding:0 12px}}
@media (prefers-reduced-motion:reduce){.ph-t{transition:none}.ph-line.shake{animation:none}}
`;
function ensureCss() {
  if (document.getElementById('ph-style')) return;
  const st = document.createElement('style'); st.id = 'ph-style'; st.textContent = CSS; document.head.appendChild(st);
}

const ROUNDS = 8, MAX_FAILS = 3, DISTRACTORS = 2;
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [b[i], b[j]] = [b[j], b[i]]; } return b; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const low = (s) => String(s).toLowerCase().replace(/[’`]/g, "'");
const wordsOf = (en) => String(en).trim().split(/\s+/).filter(Boolean);
// перше слово фрази на плитці — малими (щоб велика літера не видавала початок), окрім «I», «I'm»…; власні назви лишаються
const face = (w, first) => (/^i($|['’])/i.test(w) ? 'I' + w.slice(1).toLowerCase() : first ? w.toLowerCase() : w);

/** Фрази світу: [{nat, en}] мовою інтерфейсу (ru → PHRASES_RU, інакше/фолбек — укр). */
function phrasesOf(app, wid) {
  const c = app.content || {};
  const base = (c.PHRASES && c.PHRASES[wid]) || [];
  const ru = (I.lang?.() === 'ru' && c.PHRASES_RU && c.PHRASES_RU[wid]) || null;
  return base.map((p, i) => {
    const r = ru && ru[i];
    const nat = (Array.isArray(r) ? r[0] : r) || p[0];
    return { nat: String(nat), en: String(p[1] || '').trim() };
  });
}

export const meta = { topbar: false };

export function render(root, params, app) {
  ensureCss();
  const wid = (params && params.wid) || 'w1';
  const part = params && +params.part === 2 ? 2 : 1;
  const st = app.state;
  const gameId = (params && params.id) || `${wid}-phrases${part === 2 ? '2' : ''}`;
  let alive = true;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); };

  const scr = document.createElement('div');
  scr.className = 'ph';
  root.appendChild(scr);
  let unTheme = null;
  try { unTheme = TH.applyWorldTheme?.(scr, wid, { decor: false }) || null; } catch (e) { /* */ }

  const all = phrasesOf(app, wid).filter((p) => wordsOf(p.en).length >= 2);
  let pool = part === 2 ? all.slice(10, 20) : all.slice(0, 10);
  if (!pool.length) pool = all.slice(0, 10);
  const allWords = [...new Set(all.flatMap((p) => wordsOf(p.en).map(low)))];
  let g = null;
  const $ = (q) => scr.querySelector(q);

  function intro() {
    const ov = document.createElement('div'); ov.className = 'ph-ov';
    ov.innerHTML = `<div class="ph-box"><div class="ph-ico">🗣</div><h2>${esc(T('mode.phrases.title'))}${part === 2 ? ' 2' : ''}</h2>
      ${pool.length ? `<p>${esc(T('mode.phrases.r1'))}</p><p>${esc(T('mode.phrases.r2'))}</p><p>${esc(T('mode.phrases.r3', { n: Math.min(ROUNDS, pool.length) }))}</p>
      <button class="ph-go" data-a="go" data-sfx="open">${esc(T('mode.phrases.start'))}</button>` : `<p>${esc(T('mode.phrases.none'))}</p>`}
      <button class="ph-go sec" data-a="back" data-sfx="back">${esc(T('mode.phrases.back'))}</button></div>`;
    scr.appendChild(ov);
    ov.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'go') { ov.remove(); start(); } else if (a === 'back') app.back();
    });
  }

  function start() {
    g = { list: shuffle(pool).slice(0, ROUNDS), ri: 0, score: 0, clean: 0, r: null };
    scr.querySelectorAll('.ph-top,.ph-card,.ph-mid,.ph-bot').forEach((n) => n.remove());
    scr.insertAdjacentHTML('beforeend', `
      <div class="ph-top"><button class="ph-btn" data-a="back" data-sfx="back" aria-label="back">‹</button>
        <div class="ph-bar"><i></i></div><span class="ph-chip ph-prog"></span></div>
      <div class="ph-card"><div class="ph-label">${esc(T('mode.phrases.label'))}</div><div class="ph-nat"></div></div>
      <div class="ph-mid"><div class="ph-line" data-ph="${esc(T('mode.phrases.place'))}"></div><div class="ph-msg"></div><div class="ph-bank"></div></div>
      <div class="ph-bot"><button class="ph-b" data-a="hint" data-sfx="none">${esc(T('mode.phrases.hint'))}</button>
        <button class="ph-b spk" data-a="say" data-sfx="none" aria-label="${esc(T('mode.phrases.say'))}" disabled>🔊</button>
        <button class="ph-b main" data-a="check" data-sfx="none" disabled>${esc(T('mode.phrases.check'))}</button></div>`);
    round();
  }

  function round() {
    const p = g.list[g.ri];
    const target = wordsOf(p.en);
    const tl = target.map(low);
    const extra = shuffle(allWords.filter((w) => !tl.includes(w))).slice(0, DISTRACTORS);
    const tiles = shuffle([...target.map((w, k) => ({ w, extra: false, first: k === 0 })), ...extra.map((w) => ({ w, extra: true }))]);
    g.r = { p, target, tl, tiles, ans: [], fails: 0, mist: 0, done: false };
    scr.classList.remove('locked');
    $('.ph-prog').textContent = `🗣 ${g.ri + 1}/${g.list.length}`;
    $('.ph-bar i').style.width = `${(g.ri / g.list.length) * 100}%`;
    $('.ph-nat').textContent = p.nat;
    const line = $('.ph-line'), bank = $('.ph-bank');
    line.className = 'ph-line'; line.innerHTML = ''; bank.innerHTML = '';
    msg('');
    tiles.forEach((t, i) => {
      const slot = document.createElement('span'); slot.className = 'ph-slot';
      const b = document.createElement('button'); b.className = 'ph-t'; b.dataset.i = i; b.dataset.sfx = 'none';
      b.textContent = face(t.w, t.first);
      slot.appendChild(b); bank.appendChild(slot);
      t.el = b; t.slot = slot;
    });
    // місце в банку лишається за плиткою, коли вона полетіла в рядок
    tiles.forEach((t) => { t.slot.style.width = `${t.el.offsetWidth}px`; t.slot.style.height = `${t.el.offsetHeight}px`; });
    const main = $('[data-a="check"],[data-a="next"]');
    main.dataset.a = 'check'; main.textContent = T('mode.phrases.check'); main.classList.remove('go');
    $('[data-a="hint"]').disabled = false; $('[data-a="say"]').disabled = true;
    sync();
  }

  function msg(text, cls) { const m = $('.ph-msg'); m.textContent = text; m.className = 'ph-msg' + (cls ? ' ' + cls : ''); }
  function sync() { const b = $('[data-a="check"]'); if (b) b.disabled = !g.r.ans.length; }
  function clearMarks() {
    scr.querySelectorAll('.ph-t.bad').forEach((n) => n.classList.remove('bad'));
    if (!g.r.done) msg('');
  }

  /** Перекласти плитки (FLIP: запам'ятали місця → переставили DOM → анімували transform). */
  function relayout(change) {
    const r = g.r;
    const before = r.tiles.map((t) => t.el.getBoundingClientRect());
    change();
    const line = $('.ph-line');
    r.tiles.forEach((t, i) => {
      const at = r.ans.indexOf(i);
      if (at < 0 && t.el.parentNode !== t.slot) { t.el.classList.remove('hinted'); t.slot.appendChild(t.el); }
    });
    r.ans.forEach((i) => line.appendChild(r.tiles[i].el));
    r.tiles.forEach((t, i) => {
      const a = before[i], b = t.el.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (!dx && !dy) return;
      t.el.style.transition = 'none';
      t.el.style.transform = `translate(${dx}px,${dy}px)`;
      void t.el.offsetWidth;
      t.el.style.transition = '';
      t.el.style.transform = '';
    });
    sync();
  }

  function tapTile(b) {
    const r = g && g.r;
    if (!r || r.done) return;
    const i = +b.dataset.i;
    clearMarks();
    const at = r.ans.indexOf(i);
    relayout(() => { if (at >= 0) r.ans.splice(at, 1); else r.ans.push(i); });
    sfx(at >= 0 ? 'back' : 'pop'); hap(app, 'light');
  }

  function check() {
    const r = g.r;
    if (r.done || !r.ans.length) return;
    const got = r.ans.map((i) => low(r.tiles[i].w));
    if (got.length === r.tl.length && got.every((w, k) => w === r.tl[k])) { solved(); return; }
    r.fails += 1; r.mist += 1;
    r.ans.forEach((i, k) => { if (got[k] !== r.tl[k]) r.tiles[i].el.classList.add('bad'); });
    const line = $('.ph-line');
    line.classList.remove('shake'); void line.offsetWidth; line.classList.add('shake');
    sfx('wrong'); hap(app, 'error');
    if (r.fails >= MAX_FAILS) { later(reveal, 650); r.done = true; scr.classList.add('locked'); } else msg(T('mode.phrases.try'), 'bad');
  }

  function hint() {
    const r = g.r;
    if (r.done) return;
    clearMarks();
    // перша позиція, де відповідь розходиться з фразою: усе після неї — назад, а туди ставимо правильне слово
    let k = 0;
    while (k < r.ans.length && k < r.tl.length && low(r.tiles[r.ans[k]].w) === r.tl[k]) k += 1;
    if (k >= r.tl.length && r.ans.length === r.tl.length) return;
    const keep = r.ans.slice(0, k);
    const idx = r.tiles.findIndex((t, i) => !keep.includes(i) && low(t.w) === r.tl[k]);
    if (idx < 0) return;
    r.mist += 0.5;
    relayout(() => { r.ans = k < r.tl.length ? [...keep, idx] : keep; });
    r.tiles[idx].el.classList.add('hinted');
    sfx('sparkle'); hap(app, 'light');
  }

  function endRound(ok) {
    const r = g.r;
    r.done = true; scr.classList.add('locked');
    const sc = ok ? (r.mist === 0 ? 1 : r.mist <= 0.5 ? 0.5 : 0) : 0;
    g.score += sc; if (sc === 1) g.clean += 1;
    $('.ph-bar i').style.width = `${((g.ri + 1) / g.list.length) * 100}%`;
    const main = $('[data-a="check"]');
    main.dataset.a = 'next'; main.textContent = T('mode.phrases.next'); main.classList.add('go'); main.disabled = false;
    $('[data-a="hint"]').disabled = true; $('[data-a="say"]').disabled = false;
    later(() => speak(r.p.en), 300);
  }
  function solved() {
    const r = g.r;
    $('.ph-line').classList.add('ok');
    scr.querySelectorAll('.ph-t.hinted').forEach((n) => n.classList.remove('hinted'));
    msg(T('mode.phrases.good'), 'ok');
    try { S.onCorrectAnswer(st); S.addXP(st, 10); app.save?.(); } catch (e) { /* */ }
    sfx('correct'); hap(app, 'success');
    try { FX.floatText?.($('.ph-line'), '+10 XP'); } catch (e) { /* */ }
    try { FX.sparkle?.($('.ph-line'), { count: 8 }); } catch (e) { /* */ }
    endRound(true);
    void r;
  }
  function reveal() {
    const r = g.r;
    scr.querySelectorAll('.ph-t.bad,.ph-t.hinted').forEach((n) => n.classList.remove('bad', 'hinted'));
    const used = [];
    r.tl.forEach((w) => { const i = r.tiles.findIndex((t, j) => !used.includes(j) && low(t.w) === w); if (i >= 0) used.push(i); });
    relayout(() => { r.ans = used; });
    $('.ph-line').classList.remove('shake'); $('.ph-line').classList.add('shown');
    msg(T('mode.phrases.shown'), 'bad');
    endRound(false);
  }
  function next() {
    if (!g.r.done) return;
    if (g.ri + 1 >= g.list.length) finish(); else { g.ri += 1; round(); }
  }

  function finish() {
    const total = g.list.length;
    const stars = Math.max(1, starsByRatio(total ? g.score / total : 1));
    try { recordGame(st, gameId, stars); app.save?.(); } catch (e) { /* */ }
    sfx('win');
    if (stars === 3) { try { FX.confetti?.(); } catch (e) { /* */ } }
    const ov = document.createElement('div'); ov.className = 'ph-ov';
    ov.innerHTML = `<div class="ph-box"><h2>🏆 ${esc(T('mode.phrases.done'))}</h2>
      <div class="ph-stars">${[0, 1, 2].map((i) => `<i class="${i < stars ? 'on' : ''}" style="animation-delay:${300 + i * 300}ms">⭐</i>`).join('')}</div>
      <p class="c">${esc(T('mode.phrases.clean', { a: g.clean, b: total }))}</p>
      <h3>📌 ${esc(T('mode.phrases.remember'))}</h3>
      <ul class="ph-list">${g.list.map((p, i) => `<li><div><b>${esc(p.en)}</b><span>${esc(p.nat)}</span></div>
        <button class="ph-say" data-say="${i}" data-sfx="none" aria-label="${esc(T('mode.phrases.say'))}">🔊</button></li>`).join('')}</ul>
      <button class="ph-go" data-a="back" data-sfx="open">${esc(T('mode.phrases.cont'))}</button>
      <button class="ph-go sec" data-a="again">${esc(T('mode.phrases.again'))}</button></div>`;
    scr.appendChild(ov);
    for (let i = 0; i < stars; i++) later(() => sfx('star'), 350 + i * 300);
    ov.addEventListener('click', (e) => {
      const say = e.target.closest('[data-say]');
      if (say) { speak(g.list[+say.dataset.say].en); return; }
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'again') { ov.remove(); start(); } else if (a === 'back') app.back();
    });
  }

  function onClick(e) {
    if (e.target.closest('.ph-ov')) return;
    const b = e.target.closest('.ph-t');
    if (b && scr.contains(b)) { tapTile(b); return; }
    const a = e.target.closest('.ph-top [data-a], .ph-bot [data-a]')?.dataset.a;
    if (a === 'back') app.back();
    else if (!g || !g.r) return;
    else if (a === 'hint') hint();
    else if (a === 'check') check();
    else if (a === 'next') next();
    else if (a === 'say') speak(g.r.p.en);
  }
  scr.addEventListener('click', onClick);
  intro();

  return () => {
    alive = false;
    timers.forEach(clearTimeout); timers.clear();
    scr.removeEventListener('click', onClick);
    try { if (typeof unTheme === 'function') unTheme(); } catch (e) { /* */ }
    scr.remove();
  };
}
