// 🎉 Свято (v19) — розстав кроки свята країни в правильному порядку (тап по черзі; помилка — тряска).
// Дані: country.festival = {name, name_ru, steps:[6 en у правильному порядку], why, why_ru}.
import { h } from './ui.js?v=20261112174832';
import { t } from './i18n.js?v=20261112174832';
import * as S from './state.js?v=20261112174832';
import { recordGame } from './games.js?v=20261112174832';
import { head, emptyScreen, flagOf, anim, shuffle, loc, say, lite } from './travel.js?v=20261112174832';

export function render(root, params, app) {
  const cid = params.cid || params.wid;
  const c = S.getWorld(cid);
  const fe = c && c.festival;
  const steps = ((fe && fe.steps) || []).filter((x) => typeof x === 'string' && x.trim());
  if (steps.length < 3) { emptyScreen(root, app, t('fe.title')); return undefined; }
  let alive = true;
  const timers = [];
  const box = h('div', { class: 'tq fe' });
  root.append(box);
  const stage = h('div', { class: 'tq-stage' });
  box.append(head(app, `${flagOf(c)} ${t('fe.title')}`), stage);
  let mistakes = 0;

  function play() {
    mistakes = 0;
    let next = 0;
    const slots = h('ol', { class: 'fe-slots' }, steps.map((_, i) => h('li', { class: 'fe-slot' }, h('i', { text: String(i + 1) }))));
    const pool = h('div', { class: 'fe-pool' });
    const card = h('div', { class: 'tq-card' },
      h('h2', { class: 'fe-name title-sticker', text: `🎉 ${loc(fe, 'name') || ''}` }),
      h('p', { class: 'fe-task', text: t('fe.intro') }), slots, pool);
    shuffle(steps.map((s, i) => [s, i])).forEach(([s, i]) => {
      const b = h('button', { class: 'fe-step en', type: 'button', data: { sfx: 'none' } }, s);
      b.addEventListener('click', () => {
        if (b.disabled) return;
        if (i !== next) {
          mistakes += 1;
          try { app.audio.sfx?.('wrong'); app.tg.tap?.('rigid'); } catch (e) { /* */ }
          anim(b, [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' }, { transform: 'none' }], { duration: 320 });
          return;
        }
        b.disabled = true;
        try { app.audio.sfx?.('pop'); app.tg.tap?.('light'); } catch (e) { /* */ }
        say(app, s);
        const slot = slots.children[next];
        const chip = h('span', { class: 'fe-chip en', text: s });
        slot.append(chip); slot.classList.add('on');
        anim(chip, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.06)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'ease-out' });
        anim(b, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.7)' }], { duration: 200, fill: 'forwards' });
        timers.push(setTimeout(() => { if (alive) b.remove(); }, 200));
        next += 1;
        if (next >= steps.length) timers.push(setTimeout(() => alive && finish(), 600));
      });
      pool.append(b);
    });
    swap(card);
  }
  function finish() {
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
    try { recordGame(app.state, `${cid}-festival`, stars); app.save(); } catch (e) { console.warn(e); }
    try { app.audio.sfx?.('win'); app.fx.confetti?.({ count: lite() ? 30 : 90 }); } catch (e) { /* */ }
    const why = loc(fe, 'why');
    const starsEl = h('div', { class: 'tq-stars' }, [0, 1, 2].map((k) => h('span', { class: k < stars ? 'on' : '', text: '⭐' })));
    swap(h('div', { class: 'tq-card tq-fin' },
      h('h2', { class: 'title-sticker', text: stars >= 3 ? t('tq.great') : t('tq.good') }), starsEl,
      why ? h('div', { class: 'fe-why' }, h('b', { text: t('fe.why') }), h('p', { text: why })) : null,
      h('div', { class: 'tq-row' },
        h('button', { class: 'btn btn-ghost', type: 'button', on: { click: play } }, t('tq.again')),
        h('button', { class: 'btn btn-primary', type: 'button', data: { sfx: 'back' }, on: { click: () => app.go('world', { wid: cid }) } }, t('tq.path')))));
    [...starsEl.children].forEach((s, k) => anim(s, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1.2)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: 200 + k * 150, fill: 'backwards' }));
  }
  function swap(node) {
    stage.textContent = ''; stage.append(node);
    anim(node, [{ opacity: 0, transform: 'translate3d(0,14px,0)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.22,.8,.3,1)' });
  }
  play();
  return () => { alive = false; timers.forEach(clearTimeout); };
}
