// 🎓 Фінальний іспит — 25 питань (по 5 на A1, A2, B1, B2, C1), без підказок і без показу правильних відповідей.
// Наприкінці: «Було → Стало» (стартовий рівень із першого тесту vs результат), смуги за рівнями, статистика, сертифікат.
import * as S from './state.js?v=20261111235927';
import * as UI from './ui.js?v=20261111235927';
import { gameStars } from './games.js?v=20261111235927';
let I = {};
try { I = await import('./i18n.js?v=20261111235927'); } catch (e) { /* */ }
let A = {};
import('./audio.js?v=20261111235927').then((m) => { A = m; }).catch(() => { /* */ });
let FX = {};
import('./fx.js?v=20261111235927').then((m) => { FX = m; }).catch(() => { /* */ });

const LV = ['A1', 'A2', 'B1', 'B2', 'C1'];
const PER = 5;
const STR = {
  uk: {
    title: 'Фінальний іспит', intro: 'Великий тест, який покаже, наскільки виріс твій англійський з першого дня.',
    r1: '📝 25 питань: від A1 до C1, щоразу складніше.', r2: '🤫 Без підказок і без правильних відповідей — як на справжньому іспиті.',
    r3: '📈 Наприкінці побачиш: який рівень був на старті і який зараз.', locked: '🔒 Найкраще проходити після боса Небесної Бібліотеки (C1). Але можна спробувати й зараз!',
    start: '🎓 Почати іспит', back: '‹ Назад', q: 'Питання {i} з {n}', lvl: 'Рівень {l}',
    cert: 'Сертифікат LumiQuest', was: 'Було', now: 'Стало', grew: 'Твій англійський виріс на {n}! 🚀', same: 'Рівень стабільний — далі буде ще краще! 💪', down: 'Сьогодні не твій день — спробуй ще раз, коли відпочинеш 🌙',
    first: 'Це твій перший замір — порівнюй наступного разу!', start0: 'старт', words: 'слів-світлячків', stars: 'зірок', levels: 'рівнів пройдено', score: 'правильних',
    again: '🔁 Скласти ще раз', home: '🏠 На головну', best: 'Найкращий результат: {l}', below: 'нижче A1', step1: 'сходинку', steps: 'сходинки', steps5: 'сходинок',
    c2: 'Майже C2! 👑', date: 'Дата',
  },
  ru: {
    title: 'Финальный экзамен', intro: 'Большой тест, который покажет, насколько вырос твой английский с первого дня.',
    r1: '📝 25 вопросов: от A1 до C1, каждый раз сложнее.', r2: '🤫 Без подсказок и без правильных ответов — как на настоящем экзамене.',
    r3: '📈 В конце увидишь: какой уровень был на старте и какой сейчас.', locked: '🔒 Лучше проходить после босса Небесной Библиотеки (C1). Но можно попробовать и сейчас!',
    start: '🎓 Начать экзамен', back: '‹ Назад', q: 'Вопрос {i} из {n}', lvl: 'Уровень {l}',
    cert: 'Сертификат LumiQuest', was: 'Было', now: 'Стало', grew: 'Твой английский вырос на {n}! 🚀', same: 'Уровень стабилен — дальше будет ещё лучше! 💪', down: 'Сегодня не твой день — попробуй ещё раз, когда отдохнёшь 🌙',
    first: 'Это твой первый замер — сравни в следующий раз!', start0: 'старт', words: 'слов-светлячков', stars: 'звёзд', levels: 'уровней пройдено', score: 'правильных',
    again: '🔁 Сдать ещё раз', home: '🏠 На главную', best: 'Лучший результат: {l}', below: 'ниже A1', step1: 'ступеньку', steps: 'ступеньки', steps5: 'ступенек',
    c2: 'Почти C2! 👑', date: 'Дата',
  },
};
const ru = () => { try { return I.lang?.() === 'ru'; } catch (e) { return false; } };
const T = (k, v) => { let s = STR[ru() ? 'ru' : 'uk'][k] || k; if (v) for (const [a, b] of Object.entries(v)) s = s.replaceAll(`{${a}}`, b); return s; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [b[i], b[j]] = [b[j], b[i]]; } return b; };
const lvIdx = (l) => (l === '' || l == null ? -1 : LV.indexOf(l));
const lvName = (l) => (l === '' ? T('below') : l || '—');

const CSS = `
.ex{position:absolute;inset:0;overflow-y:auto;-webkit-overflow-scrolling:touch;color:#3a2433;
  background:radial-gradient(circle at 50% -10%,#fff3c4,transparent 55%),linear-gradient(180deg,#2c2156,#5b3f8f 45%,#f4c6d7);
  padding:calc(12px + env(safe-area-inset-top,0px)) 14px calc(24px + env(safe-area-inset-bottom,0px))}
.ex-top{display:flex;align-items:center;gap:10px;color:#fff;margin-bottom:10px}
.ex-btn{min-width:44px;height:44px;border-radius:14px;border:2px solid rgba(255,255,255,.4);background:rgba(255,255,255,.12);color:#fff;font-family:inherit;font-weight:800;font-size:18px}
.ex-tt{flex:1;font-weight:900;font-size:19px}
.ex-prog{height:10px;border-radius:99px;background:rgba(255,255,255,.2);overflow:hidden;margin:0 0 12px}
.ex-prog i{display:block;height:100%;background:linear-gradient(90deg,#ffe08a,#f7b733);transform-origin:left;transition:transform .35s}
.ex-card{background:#fffaf0;border:3px solid #3a2433;border-radius:24px;padding:18px 16px;box-shadow:0 6px 0 rgba(30,15,50,.35)}
.ex-chip{display:inline-block;padding:5px 12px;border-radius:99px;background:#3a2433;color:#ffe08a;font-weight:900;font-size:13px;margin-bottom:8px}
.ex-hero{text-align:center;color:#fff;margin:6px 0 14px}.ex-hero h1{font-size:30px;margin:8px 0 4px}.ex-hero p{opacity:.9;margin:0 10px}
.ex-cap{font-size:62px;line-height:1;animation:ex-bob 3s ease-in-out infinite}
@keyframes ex-bob{50%{transform:translateY(-8px) rotate(-6deg)}}
.ex-li{background:rgba(255,255,255,.92);border-radius:16px;padding:12px;margin:8px 0;font-size:15px;line-height:1.35}
.ex-li.lock{background:#ffe9b8}
.ex-go{display:block;width:100%;height:56px;margin-top:12px;border-radius:18px;border:3px solid #3a2433;background:linear-gradient(#ffe08a,#f7b733);font-family:inherit;font-weight:900;font-size:19px;color:#3a2433;box-shadow:0 5px 0 rgba(30,15,50,.35)}
.ex-go.sec{background:#fff;font-size:16px;height:50px;box-shadow:none;border-width:2px}
.ex-cert{position:relative;background:linear-gradient(160deg,#fffdf4,#fff1d2);border:4px double #b8862f;border-radius:22px;padding:18px 14px;text-align:center;box-shadow:0 8px 0 rgba(30,15,50,.35);animation:ex-in .6s cubic-bezier(.3,1.4,.5,1) both}
@keyframes ex-in{from{transform:scale(.85);opacity:0}to{transform:none;opacity:1}}
.ex-cert h2{margin:2px 0;font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:#8a5a12}
.ex-name{font-size:24px;font-weight:900;margin:4px 0}
.ex-vs{display:flex;align-items:center;justify-content:center;gap:12px;margin:12px 0 6px}
.ex-lv{min-width:84px;padding:8px 6px;border-radius:16px;border:3px solid #3a2433;background:#fff}
.ex-lv small{display:block;font-size:12px;font-weight:800;opacity:.6}.ex-lv b{font-size:30px;font-weight:900}
.ex-lv.now{background:linear-gradient(#bff3d2,#7be0a4);animation:ex-pop .6s .5s cubic-bezier(.3,1.7,.5,1) both}
@keyframes ex-pop{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}
.ex-arrow{font-size:30px}
.ex-msg{font-weight:800;margin:6px 0 2px}
.ex-track{position:relative;display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin:14px 0 4px}
.ex-st{height:16px;border-radius:6px;background:#e9e1f2;transform-origin:left;}
.ex-st.on{background:linear-gradient(90deg,#8f7bff,#ff8ab3);animation:ex-grow .5s both}
@keyframes ex-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.ex-tl{display:grid;grid-template-columns:repeat(5,1fr);font-size:12px;font-weight:800;opacity:.7}
.ex-bars{margin-top:12px}
.ex-bar{display:grid;grid-template-columns:34px 1fr 34px;align-items:center;gap:8px;margin:6px 0;font-weight:800;font-size:14px}
.ex-bar i{display:block;height:12px;border-radius:99px;background:#eee;overflow:hidden}.ex-bar i em{display:block;height:100%;background:#7be0a4;transform-origin:left;animation:ex-grow .7s both}
.ex-bar.fail i em{background:#ffb3bb}
.ex-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.ex-s{background:#fff;border:2px solid rgba(58,36,51,.15);border-radius:14px;padding:10px 6px;text-align:center}.ex-s b{display:block;font-size:22px}.ex-s small{font-size:12px;opacity:.7;font-weight:700}
.ex-date{font-size:12px;opacity:.6;margin-top:10px}
.ex-seal{position:absolute;right:10px;top:-14px;font-size:44px;transform:rotate(14deg)}
@media (prefers-reduced-motion:reduce){.ex *{animation:none!important}}
`;

export const meta = { topbar: false };

export function render(root, params, app) {
  if (!document.getElementById('ex-style')) { const s = document.createElement('style'); s.id = 'ex-style'; s.textContent = CSS; document.head.appendChild(s); }
  const st = app.state, C = app.content;
  const scr = document.createElement('div'); scr.className = 'ex';
  root.appendChild(scr);
  let alive = true;

  function pool() {
    const out = [];
    for (const L of LV) {
      const tasks = [];
      for (const w of C.WORLDS || []) {
        if (w.level !== L) continue;
        for (const q of w.quests || []) for (const t of q.tasks || []) if (t.type !== 'order' || (t.words || []).length <= 7) tasks.push(t);
        for (const t of (w.boss && w.boss.tasks) || []) tasks.push(t);
      }
      shuffle(tasks).slice(0, PER).forEach((t) => out.push({ L, t }));
    }
    return out;
  }

  function intro() {
    const beaten = (st.badges || []).includes('w5');
    scr.innerHTML = `<div class="ex-top"><button class="ex-btn" data-a="back" data-sfx="back">‹</button><div class="ex-tt"></div></div>
      <div class="ex-hero"><div class="ex-cap">🎓</div><h1>${esc(T('title'))}</h1><p>${esc(T('intro'))}</p></div>
      <div class="ex-li">${esc(T('r1'))}</div><div class="ex-li">${esc(T('r2'))}</div><div class="ex-li">${esc(T('r3'))}</div>
      ${beaten ? '' : `<div class="ex-li lock">${esc(T('locked'))}</div>`}
      ${st.exam ? `<div class="ex-li">🏅 ${esc(T('best', { l: lvName(st.exam.best) }))}</div>` : ''}
      <button class="ex-go" data-a="go" data-sfx="open">${esc(T('start'))}</button>`;
  }

  let run = null;
  function start() {
    run = { items: pool(), i: 0, ok: Object.fromEntries(LV.map((l) => [l, 0])) };
    step();
  }
  function step() {
    const it = run.items[run.i];
    scr.innerHTML = `<div class="ex-top"><button class="ex-btn" data-a="back" data-sfx="back">‹</button><div class="ex-tt">🎓 ${esc(T('q', { i: run.i + 1, n: run.items.length }))}</div></div>
      <div class="ex-prog"><i style="transform:scaleX(${run.i / run.items.length})"></i></div>
      <div class="ex-card"><span class="ex-chip">${esc(T('lvl', { l: it.L }))}</span><div class="ex-task"></div></div>`;
    UI.renderTask(scr.querySelector('.ex-task'), it.t, {
      onResult: (correct) => {
        if (!alive) return;
        if (correct) run.ok[it.L] += 1;
        try { A.sfx?.('tap'); } catch (e) { /* */ }
        run.i += 1;
        setTimeout(() => { if (alive) (run.i >= run.items.length ? result() : step()); }, 250);
      },
    });
  }

  function result() {
    let level = '';
    for (const L of LV) { if (run.ok[L] >= 3) level = L; else break; }
    const total = run.items.length, score = Object.values(run.ok).reduce((a, b) => a + b, 0);
    const start0 = st.start_level !== null && st.start_level !== undefined ? st.start_level : null;
    const prevBest = st.exam ? st.exam.best : null;
    const best = prevBest === null || lvIdx(level) > lvIdx(prevBest) ? level : prevBest;
    st.exam = { level, score, total, date: new Date().toISOString().slice(0, 10), best };
    try { S.addXP(st, score * 4); app.save?.(); } catch (e) { /* */ }
    const diff = start0 === null ? null : lvIdx(level) - lvIdx(start0);
    const word = (n) => (n === 1 ? T('step1') : n >= 2 && n <= 4 ? T('steps') : T('steps5'));
    const msg = diff === null ? T('first') : diff > 0 ? T('grew', { n: `${diff} ${word(diff)}` }) : diff < 0 ? T('down') : T('same');
    const nm = (() => { try { return app.tg?.userName?.() || ''; } catch (e) { return ''; } })();
    let starsN = 0, levelsN = 0;
    for (const k of Object.keys(st.stars || {})) { const s = gameStars(st, k); starsN += s; if (s > 0) levelsN += 1; }
    const from = lvIdx(start0 ?? level), to = lvIdx(level);
    scr.innerHTML = `<div class="ex-top"><button class="ex-btn" data-a="back" data-sfx="back">‹</button><div class="ex-tt">🎓 ${esc(T('title'))}</div></div>
      <div class="ex-cert"><div class="ex-seal">🏅</div><h2>${esc(T('cert'))}</h2>${nm ? `<div class="ex-name">${esc(nm)}</div>` : ''}
        <div class="ex-vs"><div class="ex-lv"><small>${esc(start0 === null ? T('start0') : T('was'))}</small><b>${esc(start0 === null ? '—' : lvName(start0))}</b></div>
          <div class="ex-arrow">➜</div><div class="ex-lv now"><small>${esc(T('now'))}</small><b>${esc(lvName(level))}</b></div></div>
        <div class="ex-msg">${esc(level === 'C1' && run.ok.C1 === PER ? T('c2') : msg)}</div>
        <div class="ex-track">${LV.map((l, i) => `<span class="ex-st${i <= to ? ' on' : ''}" style="animation-delay:${0.6 + Math.max(0, i - Math.max(0, from)) * 0.25}s;${i <= from && i <= to ? 'animation:none' : ''}"></span>`).join('')}</div>
        <div class="ex-tl">${LV.map((l) => `<span>${l}</span>`).join('')}</div>
        <div class="ex-bars">${LV.map((l, i) => `<div class="ex-bar${run.ok[l] < 3 ? ' fail' : ''}"><b>${l}</b><i><em style="transform:scaleX(${run.ok[l] / PER});animation-delay:${0.8 + i * 0.15}s"></em></i><span>${run.ok[l]}/${PER}</span></div>`).join('')}</div>
        <div class="ex-stats"><div class="ex-s"><b>${score}/${total}</b><small>${esc(T('score'))}</small></div><div class="ex-s"><b>${st.fireflies || 0}</b><small>${esc(T('words'))}</small></div>
          <div class="ex-s"><b>${starsN}</b><small>${esc(T('stars'))}</small></div><div class="ex-s"><b>${levelsN}</b><small>${esc(T('levels'))}</small></div></div>
        <div class="ex-date">${esc(T('date'))}: ${esc(st.exam.date)}</div></div>
      <button class="ex-go" data-a="go" data-sfx="open">${esc(T('again'))}</button><button class="ex-go sec" data-a="home" data-sfx="back">${esc(T('home'))}</button>`;
    try { A.sfx?.(diff === null || diff >= 0 ? 'win' : 'lose'); } catch (e) { /* */ }
    if (diff === null || diff > 0 || to >= 3) setTimeout(() => { try { FX.confetti?.(); } catch (e) { /* */ } }, 700);
  }

  function onClick(e) {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'back') app.back(); else if (a === 'go') start(); else if (a === 'home') app.home();
  }
  scr.addEventListener('click', onClick);
  intro();
  return () => { alive = false; scr.removeEventListener('click', onClick); scr.remove(); };
}
