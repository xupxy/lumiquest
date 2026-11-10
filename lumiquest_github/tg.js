// Обгортка Telegram WebApp. Безпечна поза Telegram: усі методи — no-op/фолбеки.
//
//   import { tg, waitTelegram } from './tg.js?v=20261110190353';
//   await waitTelegram();          // дочекатися SDK (≤1.5 с), потім tg.init()
//   tg.isTelegram                  // true лише всередині Telegram (є initData)
//   tg.userName()                  // first_name або ''
//   tg.tap('light'|'medium'|'heavy'|'soft'|'rigid')   // HapticFeedback.impactOccurred
//   tg.notify('success'|'error'|'warning')            // notificationOccurred
//   tg.select()                    // selectionChanged
//   tg.back.show(cb) / tg.back.hide()                 // BackButton
//   tg.cloud — null або {get(keys)->Promise<obj>, set(key,val)->Promise, remove(keys)->Promise}
//   tg.scheme                      // 'light' | 'dark'
//   tg.onTheme(cb)

function wa() {
  return (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) || null;
}

export function waitTelegram(ms = 1500) {
  return new Promise((res) => {
    if (wa()) return res();
    const s = document.getElementById('tg-sdk');
    if (!s) return res();
    let done = false;
    const fin = () => { if (!done) { done = true; res(); } };
    s.addEventListener('load', fin);
    s.addEventListener('error', fin);
    setTimeout(fin, ms);
  });
}

function safe(fn) {
  try { return fn(); } catch (e) { return undefined; }
}

let backCb = null;

export const tg = {
  get webapp() { return wa(); },
  get isTelegram() { const w = wa(); return !!(w && w.initData); },
  get scheme() {
    const w = wa();
    if (w && w.initData && w.colorScheme) return w.colorScheme;
    return (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  },

  init() {
    const w = wa();
    if (!w) return;
    safe(() => w.ready());
    safe(() => w.expand());
    safe(() => w.disableVerticalSwipes && w.isVersionAtLeast && w.isVersionAtLeast('7.7') && w.disableVerticalSwipes());
    safe(() => w.BackButton && w.BackButton.onClick(() => { if (backCb) backCb(); }));
  },

  setColors(header, bg) {
    const w = wa();
    if (!w || !w.initData) return;
    safe(() => w.isVersionAtLeast('6.1') && w.setHeaderColor(header));
    safe(() => w.isVersionAtLeast('6.1') && w.setBackgroundColor(bg));
  },

  userName() {
    const w = wa();
    const u = w && w.initDataUnsafe && w.initDataUnsafe.user;
    return (u && (u.first_name || u.username)) || '';
  },

  userId() {
    const w = wa();
    const u = w && w.initDataUnsafe && w.initDataUnsafe.user;
    return (u && u.id) || null;
  },

  tap(style = 'light') {
    const w = wa();
    safe(() => w && w.initData && w.HapticFeedback.impactOccurred(style));
  },
  notify(type = 'success') {
    const w = wa();
    safe(() => w && w.initData && w.HapticFeedback.notificationOccurred(type));
  },
  select() {
    const w = wa();
    safe(() => w && w.initData && w.HapticFeedback.selectionChanged());
  },

  back: {
    show(cb) {
      backCb = cb;
      const w = wa();
      safe(() => w && w.initData && w.BackButton.show());
    },
    hide() {
      backCb = null;
      const w = wa();
      safe(() => w && w.initData && w.BackButton.hide());
    },
  },

  onTheme(cb) {
    const w = wa();
    safe(() => w && w.onEvent('themeChanged', cb));
    if (window.matchMedia) {
      safe(() => matchMedia('(prefers-color-scheme: dark)').addEventListener('change', cb));
    }
  },

  get cloud() {
    const w = wa();
    if (!w || !w.initData || !w.CloudStorage) return null;
    if (!safe(() => w.isVersionAtLeast('6.9'))) return null;
    const cs = w.CloudStorage;
    const call = (fn, ...args) => new Promise((res, rej) => {
      let settled = false;
      const t = setTimeout(() => { if (!settled) { settled = true; rej(new Error('cloud timeout')); } }, 4000);
      try {
        cs[fn](...args, (err, val) => {
          if (settled) return;
          settled = true; clearTimeout(t);
          err ? rej(err) : res(val);
        });
      } catch (e) { settled = true; clearTimeout(t); rej(e); }
    });
    return {
      get: (keys) => call('getItems', keys),
      set: (key, val) => call('setItem', key, val),
      remove: (keys) => call('removeItems', keys),
    };
  },
};
