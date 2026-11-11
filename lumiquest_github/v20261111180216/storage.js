// Збереження стану: Telegram CloudStorage (синхронізація айфон ↔ ноут) + localStorage (кеш/фолбек).
//
//   import { loadState, saveState, clearState } from './storage.js?v=20261111180208';
//   const raw = await loadState();     // обʼєкт або null (новий гравець)
//   saveState(obj);                    // localStorage одразу, хмара — з debounce
//   await clearState();
//
// Хмара: ліміт 4096 символів на значення, тому JSON ріжемо на шматки по 3800.
// Пишемо по черзі у слот «a» або «b» і лише потім оновлюємо lq_meta → обрив запису
// не ламає попередню копію. Новішу копію (локальну чи хмарну) обираємо за savedAt.
import { tg } from './tg.js?v=20261111180208';

const LS_KEY = 'lumiquest_state_v1';
const META = 'lq_meta';
const CHUNK = 3800;

function lsGet() {
  try {
    const s = localStorage.getItem(LS_KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) { return null; }
}
function lsSet(obj) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch (e) { /* приватний режим */ }
}

async function cloudGet() {
  const c = tg.cloud;
  if (!c) return null;
  const m = await c.get([META]);
  if (!m || !m[META]) return null;
  const meta = JSON.parse(m[META]);
  if (!meta || !(meta.n > 0) || !/^[ab]$/.test(meta.s)) return null;
  lastSlot = meta.s;
  const keys = Array.from({ length: meta.n }, (_, i) => `lq_${meta.s}${i}`);
  const parts = await c.get(keys);
  const json = keys.map((k) => parts[k] || '').join('');
  return JSON.parse(json);
}

let lastSlot = null;
let cloudTimer = null;
let pending = null;
let writing = false;

async function cloudWrite(obj) {
  const c = tg.cloud;
  if (!c) return;
  const json = JSON.stringify(obj);
  const slot = lastSlot === 'a' ? 'b' : 'a';
  const n = Math.ceil(json.length / CHUNK) || 1;
  for (let i = 0; i < n; i++) {
    await c.set(`lq_${slot}${i}`, json.slice(i * CHUNK, (i + 1) * CHUNK));
  }
  await c.set(META, JSON.stringify({ s: slot, n, t: obj.savedAt || Date.now() }));
  lastSlot = slot;
}

async function flushCloud() {
  if (writing || !pending) return;
  writing = true;
  const obj = pending;
  pending = null;
  try { await cloudWrite(obj); } catch (e) { console.warn('[storage] cloud save failed', e); }
  writing = false;
  if (pending) flushCloud();
}

export async function loadState() {
  const local = lsGet();
  let cloud = null;
  try {
    cloud = await cloudGet();
  } catch (e) { console.warn('[storage] cloud load failed', e); }
  if (local && cloud) return (cloud.savedAt || 0) > (local.savedAt || 0) ? cloud : local;
  return cloud || local || null;
}

export function saveState(obj, { immediate = false } = {}) {
  lsSet(obj);
  if (!tg.cloud) return;
  pending = obj;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(flushCloud, immediate ? 0 : 1200);
}

/** Негайно дописати хмару (напр. при згортанні застосунку). */
export function flushState() {
  clearTimeout(cloudTimer);
  return flushCloud();
}

export async function clearState() {
  try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
  const c = tg.cloud;
  if (!c) return;
  try { await c.remove([META]); } catch (e) { /* ignore */ }
}
