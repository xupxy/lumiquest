// 📜 Квест: сюжет → підказка-урок → 5 завдань → результат із зірками.
import { h, button, renderTask, feedbackSheet, progressBar, richText, correctText, fx, wait } from '../ui.js';
import { addXP, onCorrectAnswer, questStars, recordQuest, getQuest, bossOpen, XP_PER_CORRECT } from '../state.js';

const CHEERS = ['Так! Світлячок спійманий ✨', 'Блискуче! 🌟', 'Ти сяєш! 💫', 'Ура, правильно! 🎉'];

export function render(root, params, app) {
  const info = getQuest(params.qid);
  const st = app.state;
  if (!info || !st.unlocked.includes(info.world.id)) {
    setTimeout(() => app.back(), 0);
    return undefined;
  }
  const { world: w, quest: q } = info;
  const tasks = q.tasks || [];
  const run = { i: 0, correct: 0, mistakes: 0, combo: 0, xp: 0, results: [] };
  let alive = true;

  const wrap = h('div', { class: 'quest' });
  root.append(wrap);
  let lumi = null;

  const swap = (node) => {
    const old = wrap.firstElementChild;
    if (old) { old.classList.add('leave-fwd'); setTimeout(() => old.remove(), 340); }
    node.classList.add('enter-fwd');
    wrap.append(node);
    requestAnimationFrame(() => requestAnimationFrame(() => node.classList.remove('enter-fwd')));
    root.scrollTo({ top: 0 });
  };

  // ── 1. сюжет
  function storyPhase() {
    const lumiBox = h('div', { class: 'q-lumi-big' });
    const card = h('div', { class: 'q-phase q-story' },
      h('span', { class: 'pill pill-lvl', text: `${w.emoji} ${w.name}` }),
      h('h1', { class: 'title-sticker', text: `${q.emoji} ${q.title}` }),
      lumiBox,
      h('div', { class: 'card story-card' }, h('p', { text: q.story })),
      button('Допоможемо Лумі!', { variant: 'primary', onClick: lessonPhase }));
    swap(card);
    lumi = app.makeLumi(lumiBox, { size: 150, emotion: 'surprised' });
  }

  // ── 2. урок
  function lessonPhase() {
    const lines = String(q.lesson || '').split('\n').filter((s) => s.trim());
    const lumiBox = h('div', { class: 'lesson-lumi' });
    const card = h('div', { class: 'q-phase q-lesson' },
      h('div', { class: 'lesson-card' },
        h('div', { class: 'lesson-head' }, lumiBox, h('h2', { class: 'lesson-title', text: 'Підказка Лумі' })),
        h('div', { class: 'lesson-body' }, lines.map((l, k) => h('p', { class: k === 0 ? 'lesson-lead' : '' }, richText(l))))),
      button('✅ Готово, до завдань!', { variant: 'primary', onClick: () => taskPhase() }));
    swap(card);
    lumi = app.makeLumi(lumiBox, { size: 70, emotion: 'thinking' });
  }

  // ── 3. завдання
  const bar = progressBar(tasks.length);
  const counter = h('span', { class: 'q-count' });
  const combo = h('span', { class: 'combo', 'aria-live': 'polite' });
  const taskHead = h('div', { class: 'q-head' },
    h('div', { class: 'q-head-row' },
      h('span', { class: 'q-head-title', text: `${q.emoji} ${q.title}` }), combo, counter),
    bar.el);

  function taskPhase() {
    const t = tasks[run.i];
    counter.textContent = `${run.i + 1}/${tasks.length}`;
    bar.set(run.i, run.results);
    const holder = h('div', { class: 'q-phase q-task' });
    if (!taskHead.isConnected) wrap.prepend(taskHead);
    swapTask(holder);
    renderTask(holder, t, { onResult: (ok, given, meta) => onResult(t, ok, given, meta || {}) });
  }
  const swapTask = (node) => {
    const olds = [...wrap.children].filter((c) => c !== taskHead);
    olds.forEach((old) => { old.classList.add('leave-fwd'); setTimeout(() => old.remove(), 340); });
    node.classList.add('enter-fwd');
    wrap.append(node);
    requestAnimationFrame(() => requestAnimationFrame(() => node.classList.remove('enter-fwd')));
    root.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function onResult(t, ok, given, meta) {
    if (!alive) return;
    run.results[run.i] = ok;
    bar.set(run.i, run.results);
    let title; let sub = null; let emotion;
    if (ok) {
      run.correct += 1; run.combo += 1; run.xp += XP_PER_CORRECT;
      onCorrectAnswer(st);
      addXP(st, XP_PER_CORRECT);
      app.save();
      emotion = run.combo >= 3 ? 'excited' : 'happy';
      title = CHEERS[run.correct % CHEERS.length];
      sub = `+${XP_PER_CORRECT} XP · +1 🍀` + (run.combo >= 3 ? ` · 🔥 Серія: ${run.combo} поспіль!` : '');
      combo.textContent = run.combo >= 2 ? `🔥 ${run.combo}` : '';
      combo.classList.toggle('on', run.combo >= 2);
      if (run.combo >= 3) fx.confetti({ count: 30, y: innerHeight * 0.4 });
    } else {
      run.mistakes += 1; run.combo = 0;
      combo.textContent = ''; combo.classList.remove('on');
      emotion = meta.skipped ? 'sad' : 'cheer';
      title = meta.skipped ? '🏳 Нічого страшного!' : '💛 Майже!';
      sub = 'Помилки — це теж світло: так ми вчимося 🌟';
    }
    const last = run.i + 1 >= tasks.length;
    await feedbackSheet(root, {
      app, ok, title, sub, emotion,
      right: ok ? null : correctText(t),
      yours: !ok && given ? given : null,
      explain: t.explain,
      nextLabel: last ? 'До результату ✨' : 'Далі',
    });
    if (!alive) return;
    if (last) return resultPhase();
    run.i += 1;
    taskPhase();
  }

  // ── 4. результат
  async function resultPhase() {
    const stars = questStars(run.mistakes);
    const wasOpen = bossOpen(st, w.id);
    const rec = recordQuest(st, q.id, stars);
    app.save();
    taskHead.remove();
    const lumiBox = h('div', { class: 'res-lumi' });
    const starBox = h('div', { class: 'res-stars', 'aria-label': `${stars} з 3 зірок` });
    const xpN = h('b', { text: '0' });
    const notes = [];
    if (rec.isRecord) notes.push(h('p', { class: 'res-note gold', text: '🆕 Новий рекорд!' }));
    else if (rec.best > stars) notes.push(h('p', { class: 'res-note' }, 'Твій найкращий результат: ', h('span', { text: '⭐'.repeat(rec.best) })));
    if (stars < 3) notes.push(h('p', { class: 'res-note muted', text: 'Хочеш 3 зірки? Спробуй ще раз без помилок!' }));
    if (!wasOpen && rec.bossOpened) notes.push(h('p', { class: 'res-note boss-open', text: '⚔️ Арена боса відкрита! Тепер можна кинути йому виклик.' }));

    const qs = w.quests;
    const idx = qs.findIndex((x) => x.id === q.id);
    const btns = [];
    if (idx >= 0 && idx < qs.length - 1) {
      const nq = qs[idx + 1];
      btns.push(button(`➡️ ${nq.title}`, { variant: 'primary', onClick: () => app.go('quest', { qid: nq.id }, { replace: true }) }));
    } else if (bossOpen(st, w.id)) {
      btns.push(button('⚔️ На арену!', { variant: 'primary', onClick: () => app.go('arena', { wid: w.id }, { replace: true }) }));
    }
    btns.push(h('div', { class: 'btn-row' },
      button('🔁 Ще раз', { variant: 'secondary', onClick: () => app.go('quest', { qid: q.id }, { replace: true }) }),
      button('🌍 До світу', { variant: 'secondary', onClick: () => app.back() })));

    const card = h('div', { class: 'q-phase q-result' },
      h('h1', { class: 'title-sticker big', text: 'Квест пройдено!' }),
      h('p', { class: 'res-name', text: `${q.emoji} ${q.title}` }),
      starBox,
      lumiBox,
      h('div', { class: 'res-stats' },
        h('span', { class: 'stat' }, h('small', { text: 'Правильно' }), h('b', { text: `${run.correct}/${tasks.length}` })),
        h('span', { class: 'stat stat-xp' }, h('small', { text: 'Досвід' }), h('span', { class: 'xp-line' }, '+', xpN, ' XP')),
        h('span', { class: 'stat' }, h('small', { text: 'Корм' }), h('b', { text: `+${run.correct} 🍀` }))),
      notes, h('div', { class: 'res-actions' }, btns));
    swap(card);
    lumi = app.makeLumi(lumiBox, { size: 120, emotion: { 3: 'proud', 2: 'happy', 1: 'cheer' }[stars] });
    app.tg.notify('success');
    await wait(150);
    fx.starsDrop(starBox, stars);
    await wait(500 + stars * 380);
    if (!alive) return;
    fx.countUp(xpN, 0, run.xp, 900);
    if (stars === 3) { fx.confetti({ count: 120 }); fx.flash('rgba(255,236,170,.6)'); }
    else fx.confetti({ count: 50 });
    lumi.say(stars === 3 ? 'Ідеально! Ти — зірка! 🌟' : stars === 2 ? 'Чудово! Ще трошки — і три зірки ✨' : 'Ми впоралися! Спробуємо ще? 💪');
  }

  storyPhase();
  return () => { alive = false; };
}
