// 🧭 Тест рівня: 5 питань на рівень, рівень зараховано при ≥ 4/5, інакше тест завершується.
import { h, button, richText, fx, wait } from './ui.js?v=20261111180135';
import { applyPlacement, getWorld } from './state.js?v=20261111180135';
import { t, tc } from './i18n.js?v=20261111180135';
import { englishOf, speakBtn, audio } from './ui.js?v=20261111180135';

export const meta = { topbar: false };

export function render(root, params, app) {
  const levels = app.content.LEVELS;
  const groups = levels.map((lv) => [lv, app.content.PLACEMENT.filter((p) => p.level === lv)]).filter(([, g]) => g.length);
  const pl = { lv: 0, j: 0, ok: 0, passed: [] };
  let alive = true;
  let finished = false;

  const wrap = h('div', { class: 'pl' });
  const ladder = h('div', { class: 'pl-ladder', 'aria-label': t('pl.levels') },
    groups.map(([lv]) => h('span', { class: 'rung', text: lv })));
  const dots = h('div', { class: 'pl-dots', 'aria-hidden': 'true' });
  const head = h('div', { class: 'pl-head' },
    h('div', { class: 'pl-title-row' }, h('h1', { class: 'title-sticker', text: t('pl.title') }), h('div', { class: 'pl-lumi' })),
    ladder, dots);
  const body = h('div', { class: 'pl-body' });
  wrap.append(head, body);
  root.append(wrap);
  const lumi = app.makeLumi(head.querySelector('.pl-lumi'), { size: 84, emotion: 'thinking' });

  const setLadder = () => {
    [...ladder.children].forEach((r, i) => {
      r.className = 'rung' + (i < pl.lv ? ' done' : i === pl.lv && !finished ? ' cur' : '');
      if (i < pl.lv) r.textContent = `✓ ${groups[i][0]}`;
    });
    const n = groups[pl.lv] ? groups[pl.lv][1].length : 5;
    dots.replaceChildren(...Array.from({ length: n }, (_, k) => h('i', { class: k < pl.j ? 'done' : k === pl.j ? 'cur' : '' })));
  };

  const swap = (node) => {
    const old = body.firstElementChild;
    if (old) { old.classList.add('leave-fwd'); setTimeout(() => old.remove(), 340); }
    node.classList.add('enter-fwd');
    body.append(node);
    requestAnimationFrame(() => requestAnimationFrame(() => node.classList.remove('enter-fwd')));
  };

  // ── інтро
  function intro() {
    head.classList.add('is-intro');
    const card = h('div', { class: 'card pl-intro' },
      h('p', { class: 'lead', text: t('pl.lead') }),
      h('ul', { class: 'pl-rules' },
        h('li', { text: t('pl.rule1') }),
        h('li', { text: t('pl.rule2') })),
      button(t('pl.go'), { variant: 'primary', onClick: () => { head.classList.remove('is-intro'); question(); } }));
    swap(card);
    setLadder();
  }

  // ── питання
  function question() {
    setLadder();
    const [lv, items] = groups[pl.lv];
    const p = items[pl.j];
    const short = p.options.every((o) => String(o).length <= 12) && p.options.length === 4;
    let picked = false;
    const opts = p.options.map((o, i) => {
      const b = button(h('span', { class: 'btn-label', lang: 'en', text: o }), {
        variant: 'option', sfx: 'tap',
        onClick: async () => {
          if (picked) return;
          picked = true;
          b.classList.add('is-picked');
          opts.forEach((x) => { x.disabled = true; });
          if (i === p.answer) pl.ok += 1;
          pl.j += 1;
          await wait(380);
          if (alive) afterAnswer(lv, items);
        },
      });
      b.style.setProperty('--i', i);
      return b;
    });
    const card = h('div', { class: 'pl-q' },
      h('div', { class: 'task-q' },
        h('span', { class: 'task-kind', text: t('pl.qOf', { lv, n: pl.j + 1, total: items.length }) }),
        h('p', { class: 'task-text' }, richText(tc(p, 'q')), englishOf(tc(p, 'q')) ? speakBtn(englishOf(tc(p, 'q')), 'say-q') : null)),
      h('div', { class: 'choices' + (short ? ' grid2' : '') }, opts));
    swap(card);
  }

  function afterAnswer(lv, items) {
    if (pl.j < items.length) return question();
    if (pl.ok < Math.ceil(items.length * 0.8)) return finish();
    pl.passed.push(lv);
    pl.lv += 1; pl.j = 0; pl.ok = 0;
    if (pl.lv >= groups.length) return finish();
    levelUp(lv);
  }

  function levelUp(lv) {
    setLadder();
    lumi.set('excited');
    lumi.react('jump');
    app.tg.notify('success');
    audio.sfx('levelup');
    const rung = ladder.children[pl.lv - 1];
    fx.sparkle(rung);
    const card = h('div', { class: 'card pl-pass' },
      h('div', { class: 'medal small' }, h('span', { text: lv })),
      h('h2', { class: 'title-sticker', text: t('pl.passed', { lv }) }),
      h('p', { class: 'muted', text: t('pl.higher', { lv: groups[pl.lv][0] }) }),
      button(t('pl.higherBtn'), { variant: 'primary', onClick: () => { lumi.set('thinking'); question(); } }));
    swap(card);
    fx.confetti({ count: 40, y: innerHeight * 0.3 });
  }

  function finish() {
    finished = true;
    const res = applyPlacement(app.state, pl.passed);
    app.save();
    setLadder();
    wrap.classList.add('is-done');
    const result = res.result;
    lumi.set(result ? 'proud' : 'excited');
    app.tg.notify('success');
    const medal = h('div', { class: 'medal big drop' }, h('span', { text: result || 'A1' }));
    const worlds = res.unlocked.map(getWorld).filter(Boolean);
    const card = h('div', { class: 'pl-result' },
      medal,
      h('h2', { class: 'title-sticker big', text: result ? t('pl.yourLevel', { lv: result }) : t('pl.fromStart') }),
      h('p', { class: 'lead', text: result
        ? t('pl.wow', { name: app.state.name })
        : t('pl.fine') }),
      h('p', { class: 'muted', text: worlds.length > 1 ? t('pl.worldsOpen') : t('pl.worldOpen') }),
      h('div', { class: 'world-chips' }, worlds.map((w, i) => h('span', { class: 'world-chip', style: { '--i': i } },
        h('b', { text: w.emoji }), `${tc(w, 'name')} · ${w.level}`))),
      button(t('pl.toMap'), { sfx: 'open', variant: 'primary', onClick: () => app.go('map', {}, { replace: true }) }));
    swap(card);
    if (worlds.length > 1) setTimeout(() => alive && audio.sfx('unlock'), 1200);
    setTimeout(() => { if (alive) { fx.flash('rgba(255,236,170,.7)'); fx.confetti({ count: 110 }); fx.sparkle(medal); } }, 450);
    setTimeout(() => alive && lumi.react('love'), 900);
  }

  intro();
  return () => { alive = false; };
}
