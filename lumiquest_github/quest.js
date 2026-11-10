// 📜 Квест: сюжет → підказка-урок → 5 завдань → результат із зірками.
import { h, button, renderTask, feedbackSheet, progressBar, richText, correctText, fx, wait, englishOf, speakBtn, answerSpeech, audio } from './ui.js?v=20261110194247';
import { t, tc } from './i18n.js?v=20261110194247';
import { applyWorldTheme } from './theme.js?v=20261110194247';
import { addXP, onCorrectAnswer, questStars, recordQuest, getQuest, bossOpen, XP_PER_CORRECT } from './state.js?v=20261110194247';

const CHEERS = ['quest.cheer1', 'quest.cheer2', 'quest.cheer3', 'quest.cheer4'];

export function render(root, params, app) {
  const info = getQuest(params.qid);
  const st = app.state;
  if (!info || !st.unlocked.includes(info.world.id)) {
    setTimeout(() => app.back(), 0);
    return undefined;
  }
  const { world: w, quest: q } = info;
  const qTitle = tc(q, 'title');
  const tasks = q.tasks || [];
  const run = { i: 0, correct: 0, mistakes: 0, combo: 0, xp: 0, results: [] };
  let alive = true;
  const unTheme = applyWorldTheme(root, w.id, { page: true });

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
      h('span', { class: 'pill pill-lvl', text: `${w.emoji} ${tc(w, 'name')}` }),
      h('h1', { class: 'title-sticker', text: `${q.emoji} ${qTitle}` }),
      lumiBox,
      h('div', { class: 'card story-card' }, h('p', { text: tc(q, 'story') })),
      button(t('quest.help'), { variant: 'primary', onClick: lessonPhase }));
    swap(card);
    lumi = app.makeLumi(lumiBox, { size: 150, emotion: 'surprised' });
  }

  // ── 2. урок
  function lessonPhase() {
    const lines = String(tc(q, 'lesson') || '').split('\n').filter((s) => s.trim());
    const lumiBox = h('div', { class: 'lesson-lumi' });
    const card = h('div', { class: 'q-phase q-lesson' },
      h('div', { class: 'lesson-card' },
        h('div', { class: 'lesson-head' }, lumiBox, h('h2', { class: 'lesson-title', text: t('quest.lessonTitle') })),
        h('div', { class: 'lesson-body' }, lines.map((l, k) => {
          const en = englishOf(l);
          return h('p', { class: (k === 0 ? 'lesson-lead' : '') + (en ? ' has-say' : '') }, richText(l), en ? speakBtn(en, 'say-lesson') : null);
        }))),
      button(t('quest.toTasks'), { variant: 'primary', onClick: () => taskPhase() }));
    // тап по англійському фрагменту — озвучка саме його
    card.querySelector('.lesson-body').addEventListener('click', (e) => {
      const en = e.target.closest && e.target.closest('.en');
      if (en) audio.speak(en.textContent, { lang: 'en-US', rate: 0.9 });
    });
    swap(card);
    lumi = app.makeLumi(lumiBox, { size: 70, emotion: 'thinking' });
  }

  // ── 3. завдання
  const bar = progressBar(tasks.length);
  const counter = h('span', { class: 'q-count' });
  const combo = h('span', { class: 'combo', 'aria-live': 'polite' });
  const taskHead = h('div', { class: 'q-head' },
    h('div', { class: 'q-head-row' },
      h('span', { class: 'q-head-title', text: `${q.emoji} ${qTitle}` }), combo, counter),
    bar.el);

  function taskPhase() {
    const tk = tasks[run.i];
    counter.textContent = `${run.i + 1}/${tasks.length}`;
    bar.set(run.i, run.results);
    const holder = h('div', { class: 'q-phase q-task' });
    if (!taskHead.isConnected) wrap.prepend(taskHead);
    swapTask(holder);
    renderTask(holder, tk, { onResult: (ok, given, meta) => onResult(tk, ok, given, meta || {}) });
  }
  const swapTask = (node) => {
    const olds = [...wrap.children].filter((c) => c !== taskHead);
    olds.forEach((old) => { old.classList.add('leave-fwd'); setTimeout(() => old.remove(), 340); });
    node.classList.add('enter-fwd');
    wrap.append(node);
    requestAnimationFrame(() => requestAnimationFrame(() => node.classList.remove('enter-fwd')));
    root.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function onResult(task, ok, given, meta) {
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
      title = t(CHEERS[run.correct % CHEERS.length]);
      sub = t('quest.gain', { xp: XP_PER_CORRECT }) + (run.combo >= 3 ? t('quest.combo', { n: run.combo }) : '');
      if (run.combo >= 3) audio.sfx('combo');
      combo.textContent = run.combo >= 2 ? `🔥 ${run.combo}` : '';
      combo.classList.toggle('on', run.combo >= 2);
      if (run.combo >= 3) fx.confetti({ count: 30, y: innerHeight * 0.4 });
    } else {
      run.mistakes += 1; run.combo = 0;
      combo.textContent = ''; combo.classList.remove('on');
      emotion = meta.skipped ? 'sad' : 'cheer';
      title = meta.skipped ? t('quest.skipped') : t('quest.almost');
      sub = t('quest.mistakes');
    }
    const last = run.i + 1 >= tasks.length;
    await feedbackSheet(root, {
      app, ok, title, sub, emotion,
      right: ok ? null : correctText(task),
      yours: !ok && given ? given : null,
      explain: tc(task, 'explain'),
      say: answerSpeech(task),
      nextLabel: last ? t('quest.toResult') : t('common.next'),
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
    const starBox = h('div', { class: 'res-stars', 'aria-label': t('common.starsOf', { n: stars, total: 3 }) });
    const xpN = h('b', { text: '0' });
    const notes = [];
    if (rec.isRecord) notes.push(h('p', { class: 'res-note gold', text: t('quest.record') }));
    else if (rec.best > stars) notes.push(h('p', { class: 'res-note' }, t('quest.best'), h('span', { text: '⭐'.repeat(rec.best) })));
    if (stars < 3) notes.push(h('p', { class: 'res-note muted', text: t('quest.try3') }));
    if (!wasOpen && rec.bossOpened) notes.push(h('p', { class: 'res-note boss-open', text: t('quest.bossOpen') }));
    const unlockedNew = rec.best === 0 || (!wasOpen && rec.bossOpened);

    const qs = w.quests;
    const idx = qs.findIndex((x) => x.id === q.id);
    const btns = [];
    if (idx >= 0 && idx < qs.length - 1) {
      const nq = qs[idx + 1];
      btns.push(button(`➡️ ${tc(nq, 'title')}`, { variant: 'primary', sfx: 'open', onClick: () => app.go('quest', { qid: nq.id }, { replace: true }) }));
    } else if (bossOpen(st, w.id)) {
      btns.push(button(t('quest.toArena'), { variant: 'primary', sfx: 'open', onClick: () => app.go('arena', { wid: w.id }, { replace: true }) }));
    }
    btns.push(h('div', { class: 'btn-row' },
      button(t('quest.again'), { variant: 'secondary', onClick: () => app.go('quest', { qid: q.id }, { replace: true }) }),
      button(t('quest.toWorld'), { variant: 'secondary', sfx: 'back', onClick: () => app.back() })));

    const card = h('div', { class: 'q-phase q-result' },
      h('h1', { class: 'title-sticker big', text: t('quest.done') }),
      h('p', { class: 'res-name', text: `${q.emoji} ${qTitle}` }),
      starBox,
      lumiBox,
      h('div', { class: 'res-stats' },
        h('span', { class: 'stat' }, h('small', { text: t('quest.correct') }), h('b', { text: `${run.correct}/${tasks.length}` })),
        h('span', { class: 'stat stat-xp' }, h('small', { text: t('quest.xp') }), h('span', { class: 'xp-line' }, '+', xpN, ' XP')),
        h('span', { class: 'stat' }, h('small', { text: t('quest.food') }), h('b', { text: `+${run.correct} 🍀` }))),
      notes, h('div', { class: 'res-actions' }, btns));
    swap(card);
    lumi = app.makeLumi(lumiBox, { size: 120, emotion: { 3: 'proud', 2: 'happy', 1: 'cheer' }[stars] });
    app.tg.notify('success');
    await wait(150);
    fx.starsDrop(starBox, stars);
    await wait(500 + stars * 380);
    if (!alive) return;
    fx.countUp(xpN, 0, run.xp, 900);
    if (unlockedNew && stars > 0) setTimeout(() => alive && audio.sfx('unlock'), 700);
    if (stars === 3) { fx.confetti({ count: 120 }); fx.flash('rgba(255,236,170,.6)'); }
    else fx.confetti({ count: 50 });
    lumi.say(stars === 3 ? t('quest.say3') : stars === 2 ? t('quest.say2') : t('quest.say1'));
  }

  storyPhase();
  return () => { alive = false; unTheme(); };
}
