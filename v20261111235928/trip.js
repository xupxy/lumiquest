// ✈️ Подорож — Лумі й гравець мандрують англомовною країною (TRIPS[wid] у content.json).
// Старт — посадковий талон; маршрут-стрічка з 8 кроків (літачок летить); кожен крок — сцена, NPC англійською
// (автоозвучка, 🔊, переклад) і відповідь: choice — 3 репліки (довге натискання → озвучка), build — плитки слів.
// Фінал — штамп у паспорт, «Розмовник подорожі» (6 фраз з 🔊), зірки за відповіді з першої спроби.
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
    'mode.trip.title': 'Подорож', 'mode.trip.pass': 'ПОСАДКОВИЙ ТАЛОН', 'mode.trip.from': 'Звідки', 'mode.trip.to': 'Куди',
    'mode.trip.steps': 'Кроків', 'mode.trip.gate': 'Вихід', 'mode.trip.seat': 'Місце', 'mode.trip.go': '✈️ В дорогу!', 'mode.trip.back': '‹ Назад',
    'mode.trip.r1': '💬 Відповідай людям англійською — обирай доречну репліку або склади її з плиток.',
    'mode.trip.r2': '👆 Довге натискання на репліку — послухати її.',
    'mode.trip.translate': '🌐 Переклад', 'mode.trip.listen': '🔊', 'mode.trip.choose': 'Що ти відповіси?',
    'mode.trip.build': 'Склади відповідь із плиток', 'mode.trip.check': '✔ Перевірити', 'mode.trip.clear': '↩ Очистити',
    'mode.trip.next': 'Далі ➡️', 'mode.trip.finishBtn': '🛬 До фіналу', 'mode.trip.ok': 'Чудово!', 'mode.trip.badBuild': 'Не зовсім — перевір порядок і зайві слова.',
    'mode.trip.reveal': 'Підказка: {a}', 'mode.trip.mist': 'Помилок: {a}', 'mode.trip.first': 'З першої спроби: {a}/{b}',
    'mode.trip.win': 'Подорож завершено!', 'mode.trip.stamp': 'ВІДВІДАНО', 'mode.trip.box': '🧳 Розмовник подорожі',
    'mode.trip.again': '🔁 Ще раз', 'mode.trip.done': '➡️ Далі', 'mode.trip.none': 'Для цього світу ще немає подорожі.',
    'mode.trip.long': 'утримуй — послухати',
  },
  ru: {
    'mode.trip.title': 'Путешествие', 'mode.trip.pass': 'ПОСАДОЧНЫЙ ТАЛОН', 'mode.trip.from': 'Откуда', 'mode.trip.to': 'Куда',
    'mode.trip.steps': 'Шагов', 'mode.trip.gate': 'Выход', 'mode.trip.seat': 'Место', 'mode.trip.go': '✈️ В путь!', 'mode.trip.back': '‹ Назад',
    'mode.trip.r1': '💬 Отвечай людям по-английски — выбирай уместную реплику или собери её из плиток.',
    'mode.trip.r2': '👆 Долгое нажатие на реплику — послушать её.',
    'mode.trip.translate': '🌐 Перевод', 'mode.trip.listen': '🔊', 'mode.trip.choose': 'Что ты ответишь?',
    'mode.trip.build': 'Собери ответ из плиток', 'mode.trip.check': '✔ Проверить', 'mode.trip.clear': '↩ Очистить',
    'mode.trip.next': 'Дальше ➡️', 'mode.trip.finishBtn': '🛬 К финалу', 'mode.trip.ok': 'Отлично!', 'mode.trip.badBuild': 'Не совсем — проверь порядок и лишние слова.',
    'mode.trip.reveal': 'Подсказка: {a}', 'mode.trip.mist': 'Ошибок: {a}', 'mode.trip.first': 'С первой попытки: {a}/{b}',
    'mode.trip.win': 'Путешествие завершено!', 'mode.trip.stamp': 'ПОСЕЩЕНО', 'mode.trip.box': '🧳 Разговорник путешествия',
    'mode.trip.again': '🔁 Ещё раз', 'mode.trip.done': '➡️ Дальше', 'mode.trip.none': 'Для этого мира пока нет путешествия.',
    'mode.trip.long': 'удерживай — послушать',
  },
};
try { I.addStrings?.(STR); } catch (e) { /* */ }
const isRu = () => { try { return I.lang?.() === 'ru'; } catch (e) { return false; } };
const T = (k, v) => {
  let s;
  try { s = I.t?.(k, v); } catch (e) { /* */ }
  if (!s || s === k) { s = (STR[isRu() ? 'ru' : 'uk'][k]) || k; if (v) for (const [a, b] of Object.entries(v)) s = s.replaceAll(`{${a}}`, b); }
  return s;
};
const L = (o, f) => (isRu() && o[`${f}_ru`]) || o[f] || '';

const CSS = `
.tp{position:absolute;inset:0;display:flex;flex-direction:column;padding:calc(10px + env(safe-area-inset-top,0px)) 12px calc(12px + env(safe-area-inset-bottom,0px));gap:9px;overflow:hidden;
  background:linear-gradient(180deg,var(--w-bg1,#bfe6ff),var(--w-bg2,#e9d8ff));color:#3a2433;user-select:none;-webkit-user-select:none}
.tp-top{display:flex;align-items:center;gap:8px}
.tp-btn{min-width:44px;height:44px;border-radius:14px;border:2px solid rgba(58,36,51,.35);background:#fffaf0;font-family:inherit;font-weight:800;font-size:18px;color:#3a2433}
.tp-chip{padding:8px 12px;border-radius:999px;background:#fffaf0;border:2px solid rgba(58,36,51,.25);font-weight:800;font-size:15px}
.tp-sp{flex:1}
.tp-route{position:relative;display:flex;justify-content:space-between;align-items:center;padding:14px 6px 4px;background:rgba(255,255,255,.45);border:2px solid rgba(58,36,51,.2);border-radius:18px}
.tp-route:before{content:'';position:absolute;left:22px;right:22px;top:calc(50% + 5px);border-top:3px dashed rgba(58,36,51,.3)}
.tp-st{position:relative;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-size:17px;background:#fff;border:2px solid rgba(58,36,51,.25);filter:grayscale(1);opacity:.55;transition:all .35s}
.tp-st.on{filter:none;opacity:1;background:#c8f7d8;border-color:#2e9e5b}
.tp-st.cur{filter:none;opacity:1;background:#fff3c4;border-color:#f7b733;transform:scale(1.15)}
.tp-plane{position:absolute;top:-6px;font-size:22px;transform:translateX(-50%) rotate(8deg);transition:left .8s cubic-bezier(.5,0,.3,1);pointer-events:none;filter:drop-shadow(0 2px 0 rgba(58,36,51,.25))}
.tp-main{flex:1;min-height:0;display:flex;flex-direction:column;gap:9px;overflow-y:auto;-webkit-overflow-scrolling:touch}
.tp-scene{display:flex;gap:10px;align-items:center;background:#fffaf0;border:3px solid #3a2433;border-radius:20px;padding:9px 12px;box-shadow:0 4px 0 rgba(58,36,51,.22);animation:tp-in .4s both}
.tp-icon{font-size:46px;line-height:1;flex:none;animation:tp-bob 3s ease-in-out infinite}
.tp-desc{font-size:15px;line-height:1.3;font-weight:600}
.tp-npc{display:flex;gap:8px;align-items:flex-end;animation:tp-in .4s .1s both}
.tp-ava{flex:none;width:44px;height:44px;border-radius:50%;background:#fff;border:2px solid #3a2433;display:grid;place-items:center;font-size:24px;transition:transform .3s}
.tp-ava.happy{animation:tp-jump .6s}
.tp-bub{position:relative;flex:1;background:#fff;border:3px solid #3a2433;border-radius:18px 18px 18px 4px;padding:8px 11px}
.tp-who{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.55}
.tp-line{font-size:18px;font-weight:800;line-height:1.3;margin:2px 0}
.tp-tr{font-size:14px;color:#6b4f63;font-style:italic;margin-top:3px}
.tp-tools{display:flex;gap:6px;margin-top:6px}
.tp-mini{height:34px;padding:0 11px;border-radius:11px;border:2px solid rgba(58,36,51,.3);background:#f3ecff;font-family:inherit;font-weight:800;font-size:14px;color:#3a2433}
.tp-ask{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.6;text-align:center}
.tp-ch{display:block;width:100%;text-align:left;padding:11px 13px;margin-bottom:7px;border-radius:15px;border:2px solid rgba(58,36,51,.4);background:#fffaf0;font-family:inherit;font-weight:700;font-size:16px;line-height:1.3;color:#3a2433;box-shadow:0 3px 0 rgba(58,36,51,.2);transition:transform .12s,background .2s;-webkit-touch-callout:none;animation:tp-in .35s both}
.tp-ch:active{transform:translateY(2px)}
.tp-ch.bad{background:#ffe0e3;border-color:#d9475a;opacity:.7;animation:tp-shake .4s}
.tp-ch.good{background:#c8f7d8;border-color:#2e9e5b}
.tp-ch.talk{background:#e6f6ff}
.tp-note{padding:9px 12px;border-radius:14px;font-size:14px;font-weight:600;line-height:1.35;animation:tp-in .3s both}
.tp-note.bad{background:#ffe0e3;border:2px solid #d9475a}.tp-note.ok{background:#c8f7d8;border:2px solid #2e9e5b}
.tp-row{min-height:52px;display:flex;flex-wrap:wrap;gap:6px;padding:7px;border-radius:15px;background:#fff;border:2px dashed rgba(58,36,51,.35)}
.tp-row.ok{border:2px solid #2e9e5b;background:#effdf3}.tp-row.shake{animation:tp-shake .4s}
.tp-bank{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:4px 0}
.tp-t{height:42px;padding:0 13px;border-radius:12px;border:2px solid #3a2433;background:#fff3c4;font-family:inherit;font-weight:800;font-size:16px;color:#3a2433;box-shadow:0 3px 0 rgba(58,36,51,.25);animation:tp-pop .22s both}
.tp-t.bad{background:#ffd5d9}
.tp-acts{display:flex;gap:8px}
.tp-go{flex:1;height:50px;border-radius:16px;border:3px solid #3a2433;background:linear-gradient(#ffe08a,#f7b733);font-family:inherit;font-weight:900;font-size:17px;color:#3a2433;box-shadow:0 4px 0 rgba(58,36,51,.3)}
.tp-go:disabled{opacity:.45}
.tp-go.sec{flex:0 0 auto;padding:0 14px;background:#fff;box-shadow:none;border-width:2px;font-weight:800;font-size:15px}
.tp-ov{position:absolute;inset:0;display:grid;place-items:center;background:rgba(30,30,70,.5);padding:16px;z-index:5;overflow-y:auto;animation:tp-fade .25s both}
.tp-box{width:100%;max-width:370px;text-align:center}
.tp-ticket{position:relative;background:#fffaf0;border:3px solid #3a2433;border-radius:22px;overflow:hidden;box-shadow:0 8px 0 rgba(58,36,51,.3);animation:tp-drop .55s cubic-bezier(.3,1.4,.5,1) both}
.tp-th{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;background:linear-gradient(90deg,#4FC3F7,#7c8cff);color:#fff;font-weight:900;font-size:13px;letter-spacing:.12em}
.tp-tb{padding:12px 14px 10px;text-align:left}
.tp-city{display:flex;align-items:center;gap:10px}.tp-flag{font-size:46px;line-height:1}
.tp-cn{font-size:28px;font-weight:900;line-height:1.05}.tp-tt{font-size:15px;font-weight:700;opacity:.7}
.tp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:10px 0 2px}
.tp-grid div{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.55}.tp-grid b{display:block;font-size:15px;opacity:1;color:#3a2433;letter-spacing:0}
.tp-perf{position:relative;border-top:3px dashed rgba(58,36,51,.35);margin:0 10px}
.tp-perf:before,.tp-perf:after{content:'';position:absolute;top:-14px;width:24px;height:24px;border-radius:50%;background:#6b6b9a;border:3px solid #3a2433}
.tp-perf:before{left:-26px}.tp-perf:after{right:-26px}
.tp-tf{display:flex;gap:10px;align-items:center;padding:10px 14px 12px;text-align:left}
.tp-tf img{width:56px;height:56px;object-fit:contain;flex:none}
.tp-tf p{margin:0;font-size:14px;line-height:1.35}
.tp-bar{height:30px;margin:0 14px 12px;background:repeating-linear-gradient(90deg,#3a2433 0 2px,transparent 2px 5px,#3a2433 5px 6px,transparent 6px 9px);opacity:.6;border-radius:3px}
.tp-rules{margin-top:10px;background:#fffaf0;border:3px solid #3a2433;border-radius:18px;padding:6px 10px}
.tp-rules p{margin:6px 0;text-align:left;font-size:14px;line-height:1.35}
.tp-big{display:block;width:100%;height:52px;margin-top:10px;border-radius:16px;border:3px solid #3a2433;background:linear-gradient(#ffe08a,#f7b733);font-family:inherit;font-weight:900;font-size:18px;color:#3a2433;box-shadow:0 4px 0 rgba(58,36,51,.3)}
.tp-big.sec{background:#fff;box-shadow:none;border-width:2px;font-weight:800}
.tp-pp{position:relative;background:#f4ecd8;border:3px solid #3a2433;border-radius:20px;padding:14px 14px 12px;box-shadow:0 8px 0 rgba(58,36,51,.3);animation:tp-drop .5s both}
.tp-pp h2{margin:0 0 4px;font-size:23px}
.tp-pph{font-size:11px;font-weight:900;letter-spacing:.18em;opacity:.5}
.tp-stampwrap{height:128px;display:grid;place-items:center}
.tp-stamp{width:150px;height:110px;border:5px double #c0392b;border-radius:16px;color:#c0392b;display:grid;place-items:center;align-content:center;gap:1px;transform:rotate(-12deg) scale(2.4);opacity:0;font-weight:900;text-transform:uppercase;line-height:1.05}
.tp-stamp.down{animation:tp-stamp .5s cubic-bezier(.6,0,.9,.6) forwards}
.tp-stamp small{font-size:10px;letter-spacing:.2em}.tp-stamp b{font-size:19px;padding:0 6px}.tp-stamp i{font-style:normal;font-size:20px}
.tp-hand{position:absolute;left:50%;top:-6px;font-size:40px;transform:translateX(-50%);animation:tp-hand .9s both;pointer-events:none}
.tp-stars{font-size:38px;letter-spacing:6px;margin:2px 0}.tp-stars i{font-style:normal;opacity:.2;display:inline-block}.tp-stars i.on{opacity:1;animation:tp-pop .5s cubic-bezier(.3,1.6,.5,1) both}
.tp-res{font-size:14px;font-weight:700;opacity:.8}
.tp-pb{margin-top:10px;background:#fffaf0;border:3px solid #3a2433;border-radius:18px;padding:8px 10px;text-align:left}
.tp-pb h3{margin:2px 0 6px;font-size:16px}
.tp-ph{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px dashed rgba(58,36,51,.2)}
.tp-ph:first-of-type{border-top:0}
.tp-ph div{flex:1;min-width:0}.tp-ph b{display:block;font-size:15px}.tp-ph span{font-size:13px;opacity:.7}
.tp-ph button{flex:none;width:38px;height:38px;border-radius:12px;border:2px solid rgba(58,36,51,.3);background:#e6f6ff;font-size:17px}
@keyframes tp-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes tp-fade{from{opacity:0}to{opacity:1}}
@keyframes tp-pop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes tp-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes tp-jump{30%{transform:translateY(-10px) scale(1.1)}60%{transform:translateY(0) scale(.95)}}
@keyframes tp-shake{20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(4px)}}
@keyframes tp-drop{from{opacity:0;transform:translateY(-30px) rotate(-3deg)}to{opacity:1;transform:none}}
@keyframes tp-stamp{0%{opacity:0;transform:rotate(-12deg) scale(2.4)}70%{opacity:1;transform:rotate(-12deg) scale(.92)}100%{opacity:.92;transform:rotate(-12deg) scale(1)}}
@keyframes tp-hand{0%{opacity:0;transform:translate(-50%,-30px)}35%{opacity:1;transform:translate(-50%,40px)}55%{transform:translate(-50%,40px)}100%{opacity:0;transform:translate(-50%,-40px)}}
@media (prefers-reduced-motion:reduce){.tp *,.tp-ov *{animation-duration:.01ms!important}}
html.lq-hidden .tp-icon{animation-play-state:paused}
`;
function ensureCss() {
  if (document.getElementById('tp-style')) return;
  const st = document.createElement('style'); st.id = 'tp-style'; st.textContent = CSS; document.head.appendChild(st);
}

const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [b[i], b[j]] = [b[j], b[i]]; } return b; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NPC_EMO = ['🙂', '😊', '🧑', '👩', '👨', '🧔', '👱', '🧕'];
const CHEERS = ['Great!', 'Perfect!', 'Lovely!', 'Wonderful!', 'Brilliant!', 'Excellent!'];
const sentence = (a) => { const s = a.charAt(0).toUpperCase() + a.slice(1); return /[.!?]$/.test(s) ? s : `${s}${/^(what|where|which|how|is|do|does|could|can|should|would|are)\b/i.test(a) ? '?' : '.'}`; };

export const meta = { topbar: false };

export function render(root, params, app) {
  ensureCss();
  const wid = (params && params.wid) || 'w1';
  const st = app.state;
  const gameId = (params && params.id) || `${wid}-trip`;
  const trip = (app.content && app.content.TRIPS && app.content.TRIPS[wid]) || null;
  let alive = true;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); };

  const scr = document.createElement('div');
  scr.className = 'tp';
  root.appendChild(scr);
  let unTheme = null;
  try { unTheme = TH.applyWorldTheme?.(scr, wid, { decor: false }) || null; } catch (e) { /* */ }
  let lumiSrc = '';
  try { lumiSrc = app.asset?.('lumi/happy.png') || ''; } catch (e) { /* */ }
  const $ = (q) => scr.querySelector(q);
  let g = null;

  function intro() {
    const ov = document.createElement('div'); ov.className = 'tp-ov';
    if (!trip || !Array.isArray(trip.steps) || !trip.steps.length) {
      ov.innerHTML = `<div class="tp-box"><div class="tp-rules"><p>${esc(T('mode.trip.none'))}</p></div>
        <button class="tp-big sec" data-a="back" data-sfx="back">${esc(T('mode.trip.back'))}</button></div>`;
    } else {
      const seat = `${(Math.random() * 30 + 1) | 0}${'ABCDEF'[(Math.random() * 6) | 0]}`;
      ov.innerHTML = `<div class="tp-box"><div class="tp-ticket">
        <div class="tp-th"><span>✈️ ${esc(T('mode.trip.pass'))}</span><span>LQ-${esc(String(trip.id || wid).toUpperCase())}</span></div>
        <div class="tp-tb"><div class="tp-city"><span class="tp-flag">${esc(trip.emoji || '🌍')}</span>
          <div><div class="tp-cn">${esc(trip.place || '')}</div><div class="tp-tt">${esc(L(trip, 'title'))}</div></div></div>
          <div class="tp-grid"><div>${esc(T('mode.trip.from'))}<b>LumiQuest</b></div><div>${esc(T('mode.trip.to'))}<b>${esc((trip.place || '').slice(0, 10))}</b></div>
            <div>${esc(T('mode.trip.steps'))}<b>${trip.steps.length}</b></div><div>${esc(T('mode.trip.seat'))}<b>${seat}</b></div></div></div>
        <div class="tp-perf"></div>
        <div class="tp-tf">${lumiSrc ? `<img src="${esc(lumiSrc)}" alt="">` : '<span style="font-size:44px">🌟</span>'}<p>${esc(L(trip, 'intro'))}</p></div>
        <div class="tp-bar"></div></div>
        <div class="tp-rules"><p>${esc(T('mode.trip.r1'))}</p><p>${esc(T('mode.trip.r2'))}</p></div>
        <button class="tp-big" data-a="go" data-sfx="open">${esc(T('mode.trip.go'))}</button>
        <button class="tp-big sec" data-a="back" data-sfx="back">${esc(T('mode.trip.back'))}</button></div>`;
    }
    scr.appendChild(ov);
    ov.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'go') { ov.remove(); sfx('whoosh'); start(); } else if (a === 'back') app.back();
    });
  }

  function start() {
    g = { si: 0, first: 0, mist: 0, step: null };
    scr.querySelectorAll('.tp-top,.tp-route,.tp-main').forEach((n) => n.remove());
    scr.insertAdjacentHTML('beforeend', `
      <div class="tp-top"><button class="tp-btn" data-a="back" data-sfx="back" aria-label="back">‹</button>
        <span class="tp-chip">${esc(trip.emoji || '✈️')} ${esc(trip.place || '')}</span><span class="tp-sp"></span><span class="tp-chip tp-mc">❌ 0</span></div>
      <div class="tp-route">${trip.steps.map((s, i) => `<span class="tp-st" data-i="${i}">${esc(s.icon || '📍')}</span>`).join('')}<span class="tp-plane">✈️</span></div>
      <div class="tp-main"></div>`);
    step();
  }

  function route() {
    scr.querySelectorAll('.tp-st').forEach((n, i) => { n.classList.toggle('on', i < g.si); n.classList.toggle('cur', i === g.si); });
    const cur = scr.querySelectorAll('.tp-st')[Math.min(g.si, trip.steps.length - 1)];
    const r = $('.tp-route');
    if (cur && r) $('.tp-plane').style.left = `${cur.offsetLeft + cur.offsetWidth / 2}px`;
  }

  function step() {
    const s = trip.steps[g.si];
    g.step = { s, tries: 0, done: false, ans: [], showTr: false };
    route();
    const main = $('.tp-main');
    main.scrollTop = 0;
    main.innerHTML = `
      <div class="tp-scene"><div class="tp-icon">${esc(s.icon || '📍')}</div><div class="tp-desc">${esc(L(s, 'scene'))}</div></div>
      <div class="tp-npc"><div class="tp-ava">${NPC_EMO[g.si % NPC_EMO.length]}</div>
        <div class="tp-bub"><div class="tp-who">${esc(s.npc || '')}</div><div class="tp-line">${esc(s.line)}</div>
          <div class="tp-tr" hidden>${esc(L(s, 'hint'))}</div>
          <div class="tp-tools"><button class="tp-mini" data-a="say" data-sfx="none">🔊</button><button class="tp-mini" data-a="tr" data-sfx="none">${esc(T('mode.trip.translate'))}</button></div></div></div>
      <div class="tp-ans"></div>`;
    const ans = $('.tp-ans');
    if (s.kind === 'build') {
      g.step.tiles = shuffle([...(s.words || s.answer.split(' ')), ...(s.extra || [])]).map((w, i) => ({ w, i }));
      ans.innerHTML = `<div class="tp-ask">${esc(T('mode.trip.build'))}</div><div class="tp-row"></div><div class="tp-bank"></div><div class="tp-fb"></div>
        <div class="tp-acts"><button class="tp-go sec" data-a="clear" data-sfx="none">${esc(T('mode.trip.clear'))}</button><button class="tp-go" data-a="check" data-sfx="none" disabled>${esc(T('mode.trip.check'))}</button></div>`;
      tiles();
    } else {
      ans.innerHTML = `<div class="tp-ask">${esc(T('mode.trip.choose'))} · <span style="text-transform:none">${esc(T('mode.trip.long'))}</span></div>
        ${shuffle(s.choices.map((c, i) => ({ c, i }))).map(({ c, i }, k) => `<button class="tp-ch" data-c="${i}" data-sfx="none" style="animation-delay:${150 + k * 80}ms">${esc(c.en)}</button>`).join('')}
        <div class="tp-fb"></div>`;
    }
    later(() => speak(s.line), 450);
  }

  function tiles() {
    const r = g.step;
    const row = $('.tp-row'), bank = $('.tp-bank');
    row.innerHTML = r.ans.map((i) => `<button class="tp-t" data-t="${i}" data-sfx="none">${esc(r.tiles[i].w)}</button>`).join('');
    bank.innerHTML = r.tiles.filter((t) => !r.ans.includes(t.i)).map((t) => `<button class="tp-t" data-t="${t.i}" data-sfx="none">${esc(t.w)}</button>`).join('');
    const c = $('[data-a="check"]'); if (c) c.disabled = !r.ans.length || r.done;
  }

  function fb(text, cls) { const f = $('.tp-fb'); if (f) f.innerHTML = text ? `<div class="tp-note ${cls}">${esc(text)}</div>` : ''; }
  function mistake() {
    g.step.tries += 1; g.mist += 1;
    $('.tp-mc').textContent = `❌ ${g.mist}`;
    sfx('wrong'); hap(app, 'error');
  }

  function pick(btn) {
    const r = g.step;
    if (r.done || btn.classList.contains('bad')) return;
    const c = r.s.choices[+btn.dataset.c];
    if (c.good) { btn.classList.add('good'); success(c.en, L(c, 'note')); } else {
      btn.classList.remove('bad'); void btn.offsetWidth; btn.classList.add('bad');
      mistake(); fb(`🙈 ${L(c, 'note')}`, 'bad');
    }
  }

  function check() {
    const r = g.step;
    if (r.done || !r.ans.length) return;
    const got = r.ans.map((i) => r.tiles[i].w);
    const want = r.s.answer.split(' ');
    if (got.join(' ').toLowerCase() === want.join(' ').toLowerCase()) { $('.tp-row').classList.add('ok'); success(r.s.answer, ''); return; }
    mistake();
    scr.querySelectorAll('.tp-row .tp-t').forEach((n, k) => { if ((got[k] || '').toLowerCase() !== (want[k] || '').toLowerCase()) n.classList.add('bad'); });
    const row = $('.tp-row'); row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake');
    fb(r.tries >= 2 ? T('mode.trip.reveal', { a: sentence(r.s.answer) }) : T('mode.trip.badBuild'), 'bad');
  }

  function success(en, note) {
    const r = g.step;
    r.done = true;
    if (r.tries === 0) g.first += 1;
    try { S.onCorrectAnswer(st); S.addXP(st, 10); app.save?.(); } catch (e) { /* */ }
    sfx('correct'); hap(app, 'success');
    const ava = $('.tp-ava'); ava.textContent = '😄'; ava.classList.add('happy');
    $('.tp-line').textContent = CHEERS[g.si % CHEERS.length];
    $('.tp-tr').hidden = true;
    try { FX.floatText?.($('.tp-npc'), '+10 XP'); FX.sparkle?.(ava, { count: 8 }); } catch (e) { /* */ }
    scr.querySelectorAll('.tp-ch:not(.good)').forEach((n) => { n.disabled = true; });
    const last = g.si + 1 >= trip.steps.length;
    fb(`✅ ${T('mode.trip.ok')} ${note || sentence(en)}`, 'ok');
    const acts = $('.tp-acts');
    const html = `<div class="tp-acts"><button class="tp-go" data-a="next" data-sfx="open">${esc(T(last ? 'mode.trip.finishBtn' : 'mode.trip.next'))}</button></div>`;
    if (acts) acts.outerHTML = html; else $('.tp-ans').insertAdjacentHTML('beforeend', html);
    later(() => speak(r.s.kind === 'build' ? sentence(en) : en), 300);
    later(() => { const m = $('.tp-main'); if (m) m.scrollTo?.({ top: m.scrollHeight, behavior: 'smooth' }); }, 80);
  }

  function next() {
    if (!g.step.done) return;
    if (g.si + 1 >= trip.steps.length) { g.si += 1; route(); sfx('whoosh'); later(finish, 700); return; }
    g.si += 1; sfx('whoosh'); step();
  }

  function finish() {
    const total = trip.steps.length;
    const stars = Math.max(1, starsByRatio(total ? g.first / total : 1));
    try { recordGame(st, gameId, stars); app.save?.(); } catch (e) { /* */ }
    sfx('win');
    const box = (isRu() && trip.phrase_box_ru) || trip.phrase_box || [];
    const d = new Date();
    const date = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    const ov = document.createElement('div'); ov.className = 'tp-ov';
    ov.innerHTML = `<div class="tp-box"><div class="tp-pp"><div class="tp-pph">PASSPORT · ПАСПОРТ</div><h2>${esc(T('mode.trip.win'))}</h2>
        <div class="tp-stampwrap"><div class="tp-stamp"><small>${esc(T('mode.trip.stamp'))}</small><i>${esc(trip.emoji || '✈️')}</i><b>${esc(trip.place || '')}</b><small>${date}</small></div></div>
        <span class="tp-hand">🖐</span>
        <div class="tp-stars">${[0, 1, 2].map((i) => `<i class="${i < stars ? 'on' : ''}" style="animation-delay:${1100 + i * 300}ms">⭐</i>`).join('')}</div>
        <div class="tp-res">${esc(T('mode.trip.first', { a: g.first, b: total }))} · ${esc(T('mode.trip.mist', { a: g.mist }))}</div></div>
      <div class="tp-pb"><h3>${esc(T('mode.trip.box'))}</h3>${box.map((p, i) => `<div class="tp-ph"><div><b>${esc(p[1])}</b><span>${esc(p[0])}</span></div><button data-p="${i}" data-sfx="none" aria-label="say">🔊</button></div>`).join('')}</div>
      <button class="tp-big" data-a="back" data-sfx="open">${esc(T('mode.trip.done'))}</button>
      <button class="tp-big sec" data-a="again">${esc(T('mode.trip.again'))}</button></div>`;
    scr.appendChild(ov);
    later(() => { const s = ov.querySelector('.tp-stamp'); if (s) s.classList.add('down'); }, 250);
    later(() => { sfx('hit'); hap(app, 'heavy'); try { FX.sparkle?.(ov.querySelector('.tp-stamp'), { count: 12 }); } catch (e) { /* */ } }, 650);
    for (let i = 0; i < stars; i++) later(() => sfx('star'), 1150 + i * 300);
    if (stars === 3) later(() => { try { FX.confetti?.(); } catch (e) { /* */ } }, 1200);
    ov.addEventListener('click', (e) => {
      const p = e.target.closest('[data-p]');
      if (p) { speak(box[+p.dataset.p][1]); return; }
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'again') { ov.remove(); start(); } else if (a === 'back') app.back();
    });
  }

  // довге натискання на репліку → озвучка (без вибору)
  let press = null;
  function onDown(e) {
    const b = e.target.closest('.tp-ch');
    if (!b || !scr.contains(b)) return;
    clearTimeout(press?.t);
    press = { b, long: false, t: setTimeout(() => { press.long = true; b.classList.add('talk'); speak(b.textContent); hap(app, 'soft'); }, 480) };
  }
  function onUp() { if (press) { clearTimeout(press.t); const b = press.b; later(() => b.classList.remove('talk'), 400); } }
  function onClick(e) {
    const ch = e.target.closest('.tp-ch');
    if (ch && scr.contains(ch)) {
      if (press && press.b === ch && press.long) { press = null; return; }
      press = null; pick(ch); return;
    }
    const t = e.target.closest('.tp-t');
    if (t && g && g.step && !g.step.done) {
      const i = +t.dataset.t, r = g.step;
      const at = r.ans.indexOf(i);
      if (at >= 0) r.ans.splice(at, 1); else r.ans.push(i);
      sfx(at >= 0 ? 'back' : 'pop'); hap(app, 'light');
      fb('');
      tiles(); return;
    }
    const a = e.target.closest('.tp [data-a]')?.dataset.a;
    if (!a || e.target.closest('.tp-ov')) return;
    if (a === 'back') app.back();
    else if (a === 'say') speak(g.step.s.line);
    else if (a === 'tr') { const tr = $('.tp-tr'); if (tr) tr.hidden = !tr.hidden; sfx('page'); }
    else if (a === 'clear') { if (!g.step.done) { g.step.ans = []; fb(''); tiles(); sfx('back'); } }
    else if (a === 'check') check();
    else if (a === 'next') next();
  }
  const onCtx = (e) => { if (e.target.closest('.tp-ch')) e.preventDefault(); };
  const onResize = () => { if (g) route(); };
  scr.addEventListener('pointerdown', onDown);
  scr.addEventListener('pointerup', onUp);
  scr.addEventListener('pointercancel', onUp);
  scr.addEventListener('contextmenu', onCtx);
  scr.addEventListener('click', onClick);
  window.addEventListener('resize', onResize);
  intro();

  return () => {
    alive = false;
    clearTimeout(press?.t);
    timers.forEach(clearTimeout); timers.clear();
    scr.removeEventListener('pointerdown', onDown);
    scr.removeEventListener('pointerup', onUp);
    scr.removeEventListener('pointercancel', onUp);
    scr.removeEventListener('contextmenu', onCtx);
    scr.removeEventListener('click', onClick);
    window.removeEventListener('resize', onResize);
    try { if (typeof unTheme === 'function') unTheme(); } catch (e) { /* */ }
    scr.remove();
  };
}
