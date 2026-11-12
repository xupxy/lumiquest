// 📖 Картки неправильних дієслів — окремий розділ у меню: усі дієслова відкритих світів,
// тап по рядку — озвучка трьох форм, кнопка «Тренувати» запускає тренування світу.
let I = {};
try { I = await import('./i18n.js?v=20261112183346'); } catch (e) { /* */ }
let A = {};
import('./audio.js?v=20261112183346').then((m) => { A = m; }).catch(() => { /* */ });

const STR = {
  uk: { 'mode.vb.title': 'Неправильні дієслова', 'mode.vb.tip': '👆 Тапни рядок — Лумі вимовить три форми.', 'mode.vb.train': '🎯 Тренувати',
    'mode.vb.search': 'Пошук дієслова…', 'mode.vb.locked': '🔒 Відкриється разом зі світом', 'mode.vb.none': 'Нічого не знайдено', 'mode.vb.all': 'Усього дієслів: {n}' },
  ru: { 'mode.vb.title': 'Неправильные глаголы', 'mode.vb.tip': '👆 Тапни строку — Луми произнесёт три формы.', 'mode.vb.train': '🎯 Тренировать',
    'mode.vb.search': 'Поиск глагола…', 'mode.vb.locked': '🔒 Откроется вместе с миром', 'mode.vb.none': 'Ничего не найдено', 'mode.vb.all': 'Всего глаголов: {n}' },
};
try { I.addStrings?.(STR); } catch (e) { /* */ }
const ru = () => { try { return I.lang?.() === 'ru'; } catch (e) { return false; } };
const T = (k, v) => { let s = STR[ru() ? 'ru' : 'uk'][k] || k; if (I.vy) s = I.vy(s, k); if (v) for (const [a, b] of Object.entries(v)) s = s.replaceAll(`{${a}}`, b); return s; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CSS = `
.vbk{position:absolute;inset:0;display:flex;flex-direction:column;background:linear-gradient(180deg,#efe6ff,#ffe9d6);color:#3a2433;
  padding:calc(10px + env(safe-area-inset-top,0px)) 12px 0}
.vbk-top{display:flex;gap:8px;align-items:center;margin-bottom:8px}
.vbk-btn{min-width:44px;height:44px;border-radius:14px;border:2px solid rgba(58,36,51,.35);background:#fffaf0;font-family:inherit;font-weight:800;font-size:18px;color:#3a2433}
.vbk-h{flex:1;font-weight:900;font-size:20px}
.vbk-s{width:100%;height:46px;border-radius:14px;border:2px solid rgba(58,36,51,.3);padding:0 14px;font-family:inherit;font-size:16px;background:#fff;color:#3a2433;margin-bottom:6px}
.vbk-tip{font-size:13px;opacity:.7;margin:2px 4px 8px}
.vbk-list{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-bottom:calc(20px + env(safe-area-inset-bottom,0px))}
.vbk-w{display:flex;align-items:center;gap:8px;margin:14px 2px 6px;font-weight:900;font-size:16px}
.vbk-w span{flex:1}
.vbk-go{height:38px;padding:0 14px;border-radius:12px;border:2px solid #3a2433;background:linear-gradient(#ffe08a,#f7b733);font-family:inherit;font-weight:800;font-size:14px;color:#3a2433}
.vbk-lock{font-size:13px;opacity:.6;font-weight:600}
.vbk-r{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;width:100%;border:0;background:#fffaf0;border-radius:14px;padding:8px;margin-bottom:6px;text-align:center;
  font-family:inherit;color:#3a2433;box-shadow:0 2px 0 rgba(58,36,51,.15)}
.vbk-r:active{transform:scale(.98)}
.vbk-r b{display:block;padding:6px 2px;border-radius:9px;font-size:15px;font-weight:800;background:#fff;border:2px solid rgba(58,36,51,.15)}
.vbk-r b:nth-child(2){background:#d6f1fb}.vbk-r b:nth-child(3){background:#e6dcff}
.vbk-r i{grid-column:1/-1;font-style:normal;font-size:13px;opacity:.75}
.vbk-empty{text-align:center;opacity:.6;margin-top:30px}
`;
export const meta = { topbar: false };

export function render(root, params, app) {
  if (!document.getElementById('vbk-style')) { const s = document.createElement('style'); s.id = 'vbk-style'; s.textContent = CSS; document.head.appendChild(s); }
  const st = app.state, C = app.content;
  const V = C.VERBS || {};
  const scr = document.createElement('div'); scr.className = 'vbk';
  const total = Object.values(V).reduce((n, l) => n + l.length, 0);
  scr.innerHTML = `<div class="vbk-top"><button class="vbk-btn" data-a="back" data-sfx="back">‹</button><div class="vbk-h">🔀 ${esc(T('mode.vb.title'))}</div></div>
    <input class="vbk-s" type="search" placeholder="${esc(T('mode.vb.search'))}" autocomplete="off" autocapitalize="off">
    <div class="vbk-tip">${esc(T('mode.vb.tip'))} ${esc(T('mode.vb.all', { n: total }))}</div><div class="vbk-list"></div>`;
  root.appendChild(scr);
  const list = scr.querySelector('.vbk-list'), inp = scr.querySelector('.vbk-s');
  const wname = (w) => { try { return I.tc?.(w, 'name') || w.name; } catch (e) { return w.name; } };

  function paint() {
    const q = inp.value.trim().toLowerCase();
    let html = '';
    for (const w of C.WORLDS) {
      const vs = V[w.id] || [];
      if (!vs.length) continue;
      const open = (st.unlocked || []).includes(w.id);
      const rows = vs.filter((v) => !q || [v.v1, v.v2, v.v3, v.uk, v.ru].some((x) => String(x || '').toLowerCase().includes(q)));
      if (q && (!rows.length || !open)) continue;
      html += `<div class="vbk-w"><span>${esc(w.emoji || '')} ${esc(wname(w))} · ${esc(w.level)}</span>${open ? `<button class="vbk-go" data-w="${esc(w.id)}" data-sfx="open">${esc(T('mode.vb.train'))}</button>` : ''}</div>`;
      if (!open) { html += `<div class="vbk-lock">${esc(T('mode.vb.locked'))}</div>`; continue; }
      for (const v of rows) html += `<button class="vbk-r" data-sfx="none" data-say="${esc([v.v1, v.v2, v.v3].join(', ').replace(/\//g, ' or '))}"><b>${esc(v.v1)}</b><b>${esc(v.v2)}</b><b>${esc(v.v3)}</b><i>🔊 ${esc(ru() ? v.ru : v.uk)}</i></button>`;
    }
    list.innerHTML = html || `<div class="vbk-empty">${esc(T('mode.vb.none'))}</div>`;
  }
  function onClick(e) {
    if (e.target.closest('[data-a=back]')) { app.back(); return; }
    const go = e.target.closest('.vbk-go');
    if (go) { app.go('verbs', { wid: go.dataset.w, id: 'free-verbs-' + go.dataset.w }); return; }
    const r = e.target.closest('.vbk-r');
    if (r) { try { A.speak?.(r.dataset.say, { rate: 0.8 }); } catch (err) { /* */ } }
  }
  scr.addEventListener('click', onClick);
  inp.addEventListener('input', paint);
  paint();
  return () => { scr.removeEventListener('click', onClick); inp.removeEventListener('input', paint); scr.remove(); };
}
