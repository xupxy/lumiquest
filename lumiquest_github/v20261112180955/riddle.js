// 🧩 Слово дня із загадкою — нова загадка щодня о 9:00 (місцевий час). Відгадав — +15 🍀 (раз на день).
import { addFood } from './state.js?v=20261112180927';
let I = {};
try { I = await import('./i18n.js?v=20261112180927'); } catch (e) { /* */ }
let A = {};
import('./audio.js?v=20261112180927').then((m) => { A = m; }).catch(() => { /* */ });
let FX = {};
import('./fx.js?v=20261112180927').then((m) => { FX = m; }).catch(() => { /* */ });

// [english riddle, answer, uk, ru, emoji]
const R = [
  ['It has keys, but it opens no doors.', 'piano', 'піаніно', 'пианино', '🎹'],
  ['The more you take, the more you leave behind.', 'footsteps', 'сліди', 'следы', '👣'],
  ['It has hands, but it cannot clap.', 'clock', 'годинник', 'часы', '🕰'],
  ['It gets wetter the more it dries.', 'towel', 'рушник', 'полотенце', '🧺'],
  ['It has a neck, but no head.', 'bottle', 'пляшка', 'бутылка', '🍾'],
  ['It is full of holes, but it still holds water.', 'sponge', 'губка', 'губка', '🧽'],
  ['It goes up, but it never comes down.', 'age', 'вік', 'возраст', '🎂'],
  ['It has one eye, but it cannot see.', 'needle', 'голка', 'иголка', '🪡'],
  ['You break it when you say its name.', 'silence', 'тиша', 'тишина', '🤫'],
  ['It has many teeth, but it cannot bite.', 'comb', 'гребінець', 'расчёска', '🪮'],
  ['It runs, but it has no legs.', 'river', 'річка', 'река', '🏞'],
  ['It has a face and two hands, and it tells you the time.', 'watch', 'наручний годинник', 'наручные часы', '⌚'],
  ['It is yellow, it is in the sky, and it keeps you warm.', 'sun', 'сонце', 'солнце', '☀️'],
  ['You can catch it, but you cannot throw it.', 'cold', 'застуда', 'простуда', '🤧'],
  ['It has a bed, but it never sleeps.', 'river', 'річка', 'река', '🌊'],
  ['It has words, but it never speaks.', 'book', 'книга', 'книга', '📖'],
  ['It follows you all day, but it disappears at night.', 'shadow', 'тінь', 'тень', '👤'],
  ['It has a thumb and four fingers, but it is not alive.', 'glove', 'рукавичка', 'перчатка', '🧤'],
  ['It is cold and white, and it falls in winter.', 'snow', 'сніг', 'снег', '❄️'],
  ['You can hear it, but you cannot see or touch it.', 'voice', 'голос', 'голос', '🗣'],
  ['It has four legs, but it cannot walk.', 'table', 'стіл', 'стол', '🪑'],
  ['It has a ring, but no finger.', 'phone', 'телефон', 'телефон', '📱'],
  ['It is always in front of you, but you cannot see it.', 'future', 'майбутнє', 'будущее', '🔮'],
  ['It has a head and a tail, but no body.', 'coin', 'монета', 'монета', '🪙'],
  ['The more there is, the less you see.', 'darkness', 'темрява', 'темнота', '🌑'],
  ['It is light as a feather, but you cannot hold it for long.', 'breath', 'подих', 'дыхание', '🌬'],
  ['It has cities, but no houses, and water, but no fish.', 'map', 'мапа', 'карта', '🗺'],
  ['It is round, it is orange, and it is a fruit.', 'orange', 'апельсин', 'апельсин', '🍊'],
  ['It flies without wings and cries without eyes.', 'cloud', 'хмара', 'облако', '☁️'],
  ['It can fill a room, but it takes up no space.', 'light', 'світло', 'свет', '💡'],
  ['It has a spine, but no bones.', 'book', 'книга', 'книга', '📚'],
  ['It is white when it is dirty.', 'blackboard', 'шкільна дошка', 'школьная доска', '🧑‍🏫'],
  ['It sleeps by day and flies at night, but it has no feathers.', 'bat', 'кажан', 'летучая мышь', '🦇'],
  ['It is green, it hops, and it says ribbit.', 'frog', 'жаба', 'лягушка', '🐸'],
  ['It is sweet, bees make it, and you can eat it.', 'honey', 'мед', 'мёд', '🍯'],
  ['It has wheels and pedals, and you ride it.', 'bicycle', 'велосипед', 'велосипед', '🚲'],
  ['It shows you your face, but it has no eyes.', 'mirror', 'дзеркало', 'зеркало', '🪞'],
  ['It keeps the rain off your head.', 'umbrella', 'парасолька', 'зонт', '☂️'],
  ['It is a house for a car.', 'garage', 'гараж', 'гараж', '🚗'],
  ['It grows down, not up, and lives in winter.', 'icicle', 'бурулька', 'сосулька', '🧊'],
];

const STR = {
  uk: { t: 'Слово дня', sub: 'Нова загадка щодня о 9:00', solved: 'Відгадано ✓ · нова о 9:00', q: 'Що це?', hint: '💡 Підказка', reward: 'Правильно! +15 🍀', wrong: 'Ні, спробуй ще!', close: 'Закрити', again: 'Наступна загадка завтра о 9:00 ✨', ans: 'Перша літера' },
  ru: { t: 'Слово дня', sub: 'Новая загадка каждый день в 9:00', solved: 'Отгадано ✓ · новая в 9:00', q: 'Что это?', hint: '💡 Подсказка', reward: 'Правильно! +15 🍀', wrong: 'Нет, попробуй ещё!', close: 'Закрыть', again: 'Следующая загадка завтра в 9:00 ✨', ans: 'Первая буква' },
};
const ru = () => { try { return I.lang?.() === 'ru'; } catch (e) { return false; } };
const S = (k) => STR[ru() ? 'ru' : 'uk'][k];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Номер «дня загадки»: змінюється о 9:00 місцевого часу. */
export function riddleDay(now = new Date()) {
  const d = new Date(now.getTime() - 9 * 3600 * 1000);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}
export function todayRiddle() {
  const day = riddleDay();
  const r = R[((day * 7) % R.length + R.length) % R.length];
  return { day, en: r[0], ans: r[1], tr: ru() ? r[3] : r[2], emoji: r[4] };
}
const KEY = 'lq_riddle';
export function riddleSolved() {
  try { const j = JSON.parse(localStorage.getItem(KEY) || '{}'); return j.day === riddleDay(); } catch (e) { return false; }
}
function markSolved() { try { localStorage.setItem(KEY, JSON.stringify({ day: riddleDay() })); } catch (e) { /* */ } }
export const riddleLabel = () => S('t');
export const riddleSub = () => (riddleSolved() ? S('solved') : S('sub'));

const CSS = `
.rd-ov{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:18px;background:rgba(30,18,50,.5);animation:rd-f .2s both}
@keyframes rd-f{from{opacity:0}to{opacity:1}}
.rd-box{width:100%;max-width:380px;border-radius:28px;padding:22px 18px 18px;text-align:center;color:#3a2433;
  background:radial-gradient(circle at 50% 0%,#fff7e0,#ffe7f1 60%,#e9e0ff);border:3px solid #3a2433;box-shadow:0 8px 0 rgba(58,36,51,.3);
  animation:rd-in .45s cubic-bezier(.3,1.5,.5,1) both}
@keyframes rd-in{from{transform:scale(.8) translateY(20px);opacity:0}to{transform:none;opacity:1}}
.rd-tag{display:inline-block;padding:6px 14px;border-radius:999px;background:#3a2433;color:#ffe08a;font-weight:900;font-size:13px;letter-spacing:.08em;text-transform:uppercase}
.rd-q{font-size:22px;font-weight:800;line-height:1.3;margin:14px 4px 6px}
.rd-sp{border:0;background:none;font-size:22px;vertical-align:middle;padding:4px}
.rd-what{font-weight:800;opacity:.6;margin:2px 0 12px}
.rd-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.rd-o{min-height:56px;border-radius:16px;border:3px solid #3a2433;background:#fffaf0;font-family:inherit;font-weight:800;font-size:18px;color:#3a2433;box-shadow:0 4px 0 rgba(58,36,51,.25);transition:transform .12s}
.rd-o:active{transform:translateY(3px)}
.rd-o.ok{background:#7be0a4}.rd-o.bad{background:#ffb3bb;animation:rd-sh .4s}
@keyframes rd-sh{25%{transform:translateX(-6px)}50%{transform:translateX(6px)}75%{transform:translateX(-4px)}}
.rd-ans{display:none;margin:4px 0 6px}.rd-box.done .rd-ans{display:block}.rd-box.done .rd-opts{display:none}
.rd-big{font-size:64px;line-height:1;animation:rd-in .5s cubic-bezier(.3,1.7,.5,1) both}
.rd-word{font-size:34px;font-weight:900;margin:6px 0 0}.rd-tr{font-size:17px;opacity:.75;font-weight:700}
.rd-msg{min-height:22px;font-weight:800;margin:10px 0 4px}
.rd-row{display:flex;gap:8px;margin-top:8px}
.rd-b{flex:1;height:48px;border-radius:14px;border:2px solid rgba(58,36,51,.35);background:#fff;font-family:inherit;font-weight:800;font-size:15px;color:#3a2433}
.rd-trh{display:none;font-weight:700;opacity:.75;margin-bottom:10px}.rd-box.showtr .rd-trh{display:block}
@media (prefers-reduced-motion:reduce){.rd-ov,.rd-box,.rd-big{animation:none}}
`;

export function openRiddle(app, onChange) {
  if (!document.getElementById('rd-style')) { const s = document.createElement('style'); s.id = 'rd-style'; s.textContent = CSS; document.head.appendChild(s); }
  const r = todayRiddle();
  const pool = [...new Set(R.map((x) => x[1]))].filter((w) => w !== r.ans);
  for (let i = pool.length - 1; i > 0; i--) { const j = (r.day * 31 + i * 17) % (i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const opts = [r.ans, ...pool.slice(0, 3)].sort((a, b) => ((a.length * 13 + r.day) % 7) - ((b.length * 13 + r.day) % 7));
  const solved = riddleSolved();
  const ov = document.createElement('div'); ov.className = 'rd-ov';
  ov.innerHTML = `<div class="rd-box${solved ? ' done' : ''}">
    <span class="rd-tag">🧩 ${esc(S('t'))}</span>
    <div class="rd-q">${esc(r.en)} <button class="rd-sp" data-a="say" aria-label="speak">🔊</button></div>
    <div class="rd-what">${esc(S('q'))}</div>
    <div class="rd-trh">${esc(S('ans'))}: <b>${esc(r.ans[0].toUpperCase())}</b> · ${r.ans.length} ${ru() ? 'букв' : 'літер'}</div>
    <div class="rd-opts">${opts.map((o) => `<button class="rd-o" data-o="${esc(o)}" data-sfx="none">${esc(o)}</button>`).join('')}</div>
    <div class="rd-ans"><div class="rd-big">${r.emoji}</div><div class="rd-word">${esc(r.ans)}</div><div class="rd-tr">${esc(r.tr)}</div></div>
    <div class="rd-msg">${solved ? esc(S('again')) : ''}</div>
    <div class="rd-row">${solved ? '' : `<button class="rd-b" data-a="hint">${esc(S('hint'))}</button>`}<button class="rd-b" data-a="close" data-sfx="back">${esc(S('close'))}</button></div></div>`;
  document.body.appendChild(ov);
  const box = ov.querySelector('.rd-box'), msg = ov.querySelector('.rd-msg');
  const say = (x) => { try { A.speak?.(x, { rate: 0.85 }); } catch (e) { /* */ } };
  const close = () => { ov.remove(); onChange?.(); };
  ov.addEventListener('click', (e) => {
    if (e.target === ov) return close();
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'close') return close();
    if (a === 'say') return say(r.en);
    if (a === 'hint') { box.classList.add('showtr'); e.target.closest('[data-a]').remove(); return; }
    const b = e.target.closest('.rd-o');
    if (!b || box.classList.contains('done')) return;
    if (b.dataset.o === r.ans) {
      b.classList.add('ok');
      try { A.sfx?.('win'); } catch (err) { /* */ }
      try { app.tg?.notify?.('success'); } catch (err) { /* */ }
      if (!riddleSolved()) { markSolved(); try { addFood(app.state, 15); app.save?.(); } catch (err) { /* */ } }
      msg.textContent = S('reward');
      setTimeout(() => { box.classList.add('done'); say(r.ans); try { FX.confetti?.(); } catch (err) { /* */ } }, 350);
      ov.querySelector('[data-a=hint]')?.remove();
    } else {
      b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad');
      try { A.sfx?.('wrong'); } catch (err) { /* */ }
      msg.textContent = S('wrong');
    }
  });
  if (!solved) setTimeout(() => say(r.en), 300);
}
