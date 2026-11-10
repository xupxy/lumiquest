// LumiQuest — audio. Vanilla JS, no files, no libraries.
// WebAudio synthesis (sfx + procedural music loops) and speechSynthesis (English voice-over).
//
//   initAudio()                      // attach unlock listeners (iOS); safe to call many times
//   sfx(name)                        // see SFX below; unknown names are ignored
//   music('menu'|'w1'..'w5'|'boss'|'game'|null)   // 1.5 s crossfade
//   speak(text, {lang:'en-US', rate:0.9}) -> Promise<boolean>;  canSpeak()
//   setSound(on) setMusic(on) getSettings()       // localStorage 'lq_audio'
//   duck(on)                         // lower music (speak() does it automatically)
//
// Nothing here ever throws: without AudioContext / speechSynthesis everything is a silent no-op.

const LS_KEY = 'lq_audio';
const FADE = 1.5;          // crossfade, s
const LOOKAHEAD = 0.2;     // scheduler horizon, s
const TICK_MS = 25;        // scheduler period
const SFX_VOL = 0.8;
const MUSIC_VOL = 0.24;    // music is quieter than sfx
const DUCK_LEVEL = 0.22;

const W = typeof window !== 'undefined' ? window : {};

// ---------------------------------------------------------------- settings
function loadSettings() {
  try {
    const s = JSON.parse(W.localStorage.getItem(LS_KEY) || '{}') || {};
    return { sound: s.sound !== false, music: s.music !== false };
  } catch (e) { return { sound: true, music: true }; }
}
let settings = loadSettings();
function saveSettings() { try { W.localStorage.setItem(LS_KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ } }

// ---------------------------------------------------------------- helpers
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function noiseBuf(c) {
  if (c._lqNoise) return c._lqNoise;
  const len = c.sampleRate;
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  c._lqNoise = b;
  return b;
}
function impulse(c, sec, decay) {
  const len = Math.floor(c.sampleRate * sec);
  const b = c.createBuffer(2, len, c.sampleRate);
  const pre = Math.floor(c.sampleRate * 0.012);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    let lp = 0;
    for (let i = pre; i < len; i++) {
      lp += ((Math.random() * 2 - 1) - lp) * 0.3;          // darker tail
      d[i] = lp * Math.pow(1 - i / len, decay) * 0.9;
    }
  }
  return b;
}

// ADSR on an AudioParam. s = sustain ratio (0 = percussive), h = hold time.
function env(p, t, a, d, s, h, r, v) {
  p.setValueAtTime(0, t);
  p.linearRampToValueAtTime(v, t + a);
  if (s > 0) {
    p.exponentialRampToValueAtTime(Math.max(v * s, 1e-4), t + a + d);
    p.setValueAtTime(Math.max(v * s, 1e-4), t + a + d + h);
    p.exponentialRampToValueAtTime(1e-4, t + a + d + h + r);
    p.setValueAtTime(0, t + a + d + h + r + 0.005);
    return t + a + d + h + r;
  }
  p.exponentialRampToValueAtTime(1e-4, t + a + d);
  p.setValueAtTime(0, t + a + d + 0.005);
  return t + a + d;
}

// Oscillator voice. o: {w,f,f2,gl,a,d,s,h,r,v,det,lp,lp2,lpt,q,vib:[rateHz,cents]}
function tone(c, out, t, o) {
  const a = o.a ?? 0.005, d = o.d ?? 0.1, s = o.s || 0, h = o.h || 0, r = o.r ?? 0.08;
  const osc = c.createOscillator();
  osc.type = o.w || 'sine';
  const g = c.createGain();
  const end = env(g.gain, t, a, d, s, h, r, o.v ?? 0.3);
  osc.frequency.setValueAtTime(o.f, t);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t + (o.gl || (end - t)));
  if (o.det) osc.detune.setValueAtTime(o.det, t);
  let node = osc, filt = null;
  if (o.lp) {
    filt = c.createBiquadFilter();
    filt.type = 'lowpass'; filt.Q.value = o.q ?? 0.7;
    filt.frequency.setValueAtTime(Math.min(o.lp, 20000), t);
    if (o.lp2) filt.frequency.exponentialRampToValueAtTime(Math.min(o.lp2, 20000), t + (o.lpt || (end - t)));
    osc.connect(filt); node = filt;
  }
  node.connect(g); g.connect(out);
  let lfo = null;
  if (o.vib) {
    lfo = c.createOscillator(); lfo.frequency.value = o.vib[0];
    const lg = c.createGain(); lg.gain.value = o.vib[1];
    lfo.connect(lg); lg.connect(osc.detune);
    lfo.start(t); lfo.stop(end + 0.05);
  }
  osc.start(t); osc.stop(end + 0.05);
  osc.onended = () => { try { g.disconnect(); if (filt) filt.disconnect(); osc.disconnect(); } catch (e) { /* ignore */ } };
  return end;
}

// Filtered noise voice. o: {ft,f,fm,f2,gl,q,a,d,s,h,r,v}
function noise(c, out, t, o) {
  const a = o.a ?? 0.002, d = o.d ?? 0.1, s = o.s || 0, h = o.h || 0, r = o.r ?? 0.05;
  const src = c.createBufferSource();
  src.buffer = noiseBuf(c); src.loop = true;
  const f = c.createBiquadFilter();
  f.type = o.ft || 'bandpass'; f.Q.value = o.q ?? 1;
  const g = c.createGain();
  const end = env(g.gain, t, a, d, s, h, r, o.v ?? 0.2);
  f.frequency.setValueAtTime(o.f || 1000, t);
  if (o.fm) f.frequency.exponentialRampToValueAtTime(o.fm, t + (end - t) * 0.45);
  if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.gl || (end - t)));
  src.connect(f); f.connect(g); g.connect(out);
  src.start(t, Math.random() * 0.5); src.stop(end + 0.05);
  src.onended = () => { try { g.disconnect(); f.disconnect(); src.disconnect(); } catch (e) { /* ignore */ } };
  return end;
}

function bell(c, o, t, f, d, v) {
  tone(c, o, t, { f, a: 0.002, d, v });
  tone(c, o, t, { f: f * 2, a: 0.002, d: d * 0.5, v: v * 0.25 });
  tone(c, o, t, { f: f * 4.2, a: 0.001, d: d * 0.18, v: v * 0.07 });
}
function brass(c, o, t, f, d, v, extra) {
  tone(c, o, t, Object.assign({ w: 'sawtooth', f, a: 0.015, d, v: v * 0.5, lp: f * 1.5, lp2: f * 5, lpt: 0.05, q: 0.6 }, extra));
  tone(c, o, t, Object.assign({ w: 'triangle', f, a: 0.01, d, v }, extra));
}

// ---------------------------------------------------------------- SFX
// (c, out, t, p) — p is a small random pitch factor so repeats don't grate.
const SFX = {
  tap: (c, o, t, p) => { tone(c, o, t, { f: 700 * p, f2: 540 * p, gl: 0.06, a: 0.003, d: 0.07, v: 0.2 }); tone(c, o, t, { w: 'triangle', f: 1400 * p, a: 0.002, d: 0.025, v: 0.04 }); },
  back: (c, o, t, p) => { tone(c, o, t, { w: 'triangle', f: 620 * p, a: 0.003, d: 0.08, v: 0.2, lp: 2500 }); tone(c, o, t + 0.07, { w: 'triangle', f: 440 * p, a: 0.003, d: 0.12, v: 0.2, lp: 2000 }); },
  open: (c, o, t, p) => { tone(c, o, t, { w: 'triangle', f: 420 * p, f2: 880 * p, gl: 0.12, a: 0.01, d: 0.16, v: 0.2, lp: 3000 }); tone(c, o, t + 0.08, { f: 1320 * p, a: 0.003, d: 0.2, v: 0.07 }); },
  close: (c, o, t, p) => { tone(c, o, t, { w: 'triangle', f: 820 * p, f2: 400 * p, gl: 0.12, a: 0.01, d: 0.15, v: 0.18, lp: 2500 }); },
  correct: (c, o, t, p) => { bell(c, o, t, 784 * p, 0.22, 0.22); bell(c, o, t + 0.09, 1047 * p, 0.45, 0.25); },
  wrong: (c, o, t, p) => {
    tone(c, o, t, { w: 'triangle', f: 330 * p, f2: 300 * p, a: 0.01, d: 0.14, v: 0.24, lp: 1200 });
    tone(c, o, t + 0.13, { w: 'triangle', f: 262 * p, f2: 215 * p, a: 0.01, d: 0.3, v: 0.24, lp: 900 });
  },
  star: (c, o, t, p) => { [1319, 1568, 2093].forEach((f, i) => bell(c, o, t + i * 0.06, f * p, 0.32, 0.14)); noise(c, o, t, { ft: 'highpass', f: 8000, a: 0.02, d: 0.3, v: 0.03 }); },
  coin: (c, o, t, p) => { tone(c, o, t, { w: 'square', f: 988 * p, a: 0.002, d: 0.06, v: 0.07, lp: 4000 }); tone(c, o, t + 0.06, { w: 'square', f: 1319 * p, a: 0.002, d: 0.32, v: 0.07, lp: 4000 }); },
  xp: (c, o, t, p) => { tone(c, o, t, { f: 600 * p, f2: 1500 * p, gl: 0.14, a: 0.005, d: 0.16, v: 0.14 }); bell(c, o, t + 0.12, 1568 * p, 0.22, 0.1); },
  levelup: (c, o, t, p) => {
    [72, 76, 79, 84, 88].forEach((m, i) => { const f = mtof(m) * p; tone(c, o, t + i * 0.07, { w: 'triangle', f, a: 0.004, d: 0.18, v: 0.16 }); tone(c, o, t + i * 0.07, { f: f * 2, a: 0.003, d: 0.1, v: 0.04 }); });
    [72, 76, 79, 84].forEach((m) => tone(c, o, t + 0.38, { f: mtof(m) * p, a: 0.02, d: 0.4, s: 0.5, h: 0.2, r: 0.4, v: 0.07, vib: [5, 6] }));
    noise(c, o, t + 0.35, { ft: 'highpass', f: 7000, a: 0.05, d: 0.6, v: 0.03 });
  },
  unlock: (c, o, t, p) => {
    noise(c, o, t, { ft: 'highpass', f: 3000, d: 0.03, v: 0.15 });
    tone(c, o, t, { w: 'square', f: 400 * p, a: 0.002, d: 0.04, v: 0.08, lp: 1500 });
    bell(c, o, t + 0.1, 1047 * p, 0.3, 0.16); bell(c, o, t + 0.18, 1568 * p, 0.42, 0.16);
  },
  win: (c, o, t, p) => {
    [523, 659, 784].forEach((f, i) => brass(c, o, t + i * 0.12, f * p, 0.13, 0.13));
    [523, 659, 784, 1047].forEach((f) => brass(c, o, t + 0.38, f * p, 0.3, 0.075, { s: 0.6, h: 0.3, r: 0.45, vib: [5, 7] }));
    noise(c, o, t + 0.38, { ft: 'highpass', f: 7000, a: 0.05, d: 0.7, v: 0.03 });
  },
  lose: (c, o, t, p) => {
    [392, 370, 349].forEach((f, i) => brass(c, o, t + i * 0.25, f * p, 0.22, 0.12, { lp2: f * 2.5 }));
    brass(c, o, t + 0.75, 330 * p, 0.15, 0.12, { s: 0.6, h: 0.2, r: 0.3, vib: [5, 18], lp2: 800 });
  },
  jump: (c, o, t, p) => { tone(c, o, t, { w: 'square', f: 280 * p, f2: 640 * p, gl: 0.13, a: 0.005, d: 0.15, v: 0.09, lp: 2500 }); },
  land: (c, o, t, p) => { tone(c, o, t, { f: 160 * p, f2: 60, gl: 0.1, a: 0.002, d: 0.12, v: 0.35 }); noise(c, o, t, { ft: 'lowpass', f: 600, d: 0.06, v: 0.15 }); },
  fall: (c, o, t, p) => { tone(c, o, t, { w: 'triangle', f: 900 * p, f2: 180 * p, gl: 0.5, a: 0.01, d: 0.5, v: 0.16, vib: [12, 40], lp: 3000 }); },
  shoot: (c, o, t, p) => { noise(c, o, t, { ft: 'highpass', f: 2500, d: 0.06, v: 0.12 }); tone(c, o, t, { w: 'square', f: 950 * p, f2: 220 * p, gl: 0.12, a: 0.002, d: 0.12, v: 0.07, lp: 3500 }); },
  hit: (c, o, t, p) => { noise(c, o, t, { f: 1200 * p, q: 0.8, d: 0.08, v: 0.3 }); tone(c, o, t, { f: 220 * p, f2: 90, gl: 0.1, a: 0.002, d: 0.12, v: 0.3 }); },
  explode: (c, o, t, p) => { noise(c, o, t, { ft: 'lowpass', f: 1800 * p, f2: 120, gl: 0.55, q: 0.5, a: 0.005, d: 0.58, v: 0.45 }); tone(c, o, t, { f: 110 * p, f2: 35, gl: 0.5, a: 0.003, d: 0.5, v: 0.4 }); },
  boss_hit: (c, o, t, p) => {
    tone(c, o, t, { w: 'sawtooth', f: 130 * p, f2: 55, gl: 0.3, a: 0.003, d: 0.32, v: 0.2, lp: 1500, lp2: 200 });
    noise(c, o, t, { f: 800 * p, q: 0.7, d: 0.15, v: 0.3 });
    tone(c, o, t, { f: 72, f2: 45, a: 0.003, d: 0.35, v: 0.35 });
  },
  card: (c, o, t, p) => { noise(c, o, t, { f: 3500 * p, q: 1.5, a: 0.005, d: 0.05, v: 0.18 }); },
  deal: (c, o, t, p) => { noise(c, o, t, { f: 1800 * p, f2: 4500 * p, gl: 0.08, a: 0.01, d: 0.09, v: 0.18 }); tone(c, o, t + 0.08, { f: 900 * p, a: 0.001, d: 0.02, v: 0.06 }); },
  flip: (c, o, t, p) => { noise(c, o, t, { ft: 'highpass', f: 3000, d: 0.025, v: 0.12 }); noise(c, o, t + 0.05, { ft: 'highpass', f: 3500, d: 0.025, v: 0.1 }); tone(c, o, t, { f: 900 * p, f2: 1300 * p, gl: 0.05, a: 0.002, d: 0.06, v: 0.06 }); },
  whoosh: (c, o, t, p) => { noise(c, o, t, { f: 400 * p, fm: 2200 * p, f2: 500 * p, q: 1.2, a: 0.14, d: 0.26, v: 0.2 }); },
  type: (c, o, t, p) => { noise(c, o, t, { ft: 'highpass', f: 4500 * p, q: 0.7, a: 0.001, d: 0.015, v: 0.05 }); },
  heart: (c, o, t, p) => { tone(c, o, t, { f: 659 * p, a: 0.01, d: 0.15, v: 0.18 }); tone(c, o, t + 0.1, { f: 988 * p, a: 0.01, d: 0.38, v: 0.18, vib: [6, 15] }); tone(c, o, t + 0.1, { w: 'triangle', f: 494 * p, a: 0.01, d: 0.3, v: 0.06 }); },
  pop: (c, o, t, p) => { tone(c, o, t, { f: 380 * p, f2: 1100 * p, gl: 0.05, a: 0.002, d: 0.07, v: 0.25 }); noise(c, o, t, { ft: 'highpass', f: 5000, d: 0.01, v: 0.05 }); },
  countdown: (c, o, t) => { tone(c, o, t, { f: 880, a: 0.003, d: 0.02, s: 0.7, h: 0.08, r: 0.06, v: 0.2 }); tone(c, o, t, { f: 1760, a: 0.003, d: 0.05, v: 0.04 }); },
  go: (c, o, t) => { tone(c, o, t, { f: 1320, a: 0.003, d: 0.03, s: 0.7, h: 0.22, r: 0.12, v: 0.2 }); tone(c, o, t, { w: 'triangle', f: 660, a: 0.003, d: 0.03, s: 0.7, h: 0.22, r: 0.12, v: 0.08 }); },
  combo: (c, o, t, p) => { [784, 988, 1319].forEach((f, i) => tone(c, o, t + i * 0.05, { w: 'square', f: f * p, a: 0.002, d: 0.1, v: 0.06, lp: 3000 })); bell(c, o, t + 0.15, 2637 * p, 0.25, 0.08); },
  page: (c, o, t, p) => { noise(c, o, t, { f: 1800 * p, f2: 3200 * p, gl: 0.18, q: 0.7, a: 0.03, d: 0.17, v: 0.12 }); },
  drum: (c, o, t, p) => { tone(c, o, t, { f: 200 * p, f2: 85, gl: 0.2, a: 0.002, d: 0.25, v: 0.4 }); noise(c, o, t, { ft: 'lowpass', f: 1500, d: 0.04, v: 0.1 }); },
  tick: (c, o, t, p) => { tone(c, o, t, { f: 2200 * p, a: 0.001, d: 0.02, v: 0.1 }); },
  sparkle: (c, o, t) => { const n = [1568, 1760, 2093, 2349, 2637, 3136]; for (let i = 0; i < 5; i++) bell(c, o, t + i * 0.06, n[Math.floor(Math.random() * n.length)], 0.25, 0.07); },
};
export const SFX_NAMES = Object.keys(SFX);

// ---------------------------------------------------------------- music instruments
// (c, out, t, freq, durSec, vel)
const hold = (dur, x) => Math.max(0, dur - x);
const INST = {
  flute: (c, o, t, f, dur, v) => {
    tone(c, o, t, { f, a: 0.06, d: 0.15, s: 0.75, h: hold(dur, 0.25), r: 0.22, v: v * 0.55, vib: [5, 9] });
    tone(c, o, t, { w: 'triangle', f: f * 2, a: 0.07, d: 0.15, s: 0.5, h: hold(dur, 0.25), r: 0.15, v: v * 0.06 });
    noise(c, o, t, { f: f * 2, q: 2, a: 0.02, d: 0.08, v: v * 0.04 });
  },
  marimba: (c, o, t, f, dur, v) => { tone(c, o, t, { f, a: 0.002, d: 0.45, v: v * 0.7 }); tone(c, o, t, { f: f * 4, a: 0.001, d: 0.06, v: v * 0.14 }); },
  kalimba: (c, o, t, f, dur, v) => { tone(c, o, t, { f, a: 0.002, d: 0.6, v: v * 0.6 }); tone(c, o, t, { f: f * 5.4, a: 0.001, d: 0.05, v: v * 0.08 }); tone(c, o, t, { w: 'triangle', f, a: 0.001, d: 0.08, v: v * 0.15, lp: f * 3 }); },
  bell: (c, o, t, f, dur, v) => { tone(c, o, t, { f, a: 0.002, d: 1.4, v: v * 0.45 }); tone(c, o, t, { f: f * 2.76, a: 0.002, d: 0.5, v: v * 0.1 }); tone(c, o, t, { f: f * 5.4, a: 0.002, d: 0.2, v: v * 0.04 }); },
  musicbox: (c, o, t, f, dur, v) => { tone(c, o, t, { f, a: 0.002, d: 0.9, v: v * 0.5 }); tone(c, o, t, { f: f * 3, a: 0.002, d: 0.15, v: v * 0.09 }); },
  harp: (c, o, t, f, dur, v) => { tone(c, o, t, { w: 'triangle', f, a: 0.003, d: 1.2, v: v * 0.6, lp: f * 6, lp2: f * 1.5, lpt: 0.5 }); tone(c, o, t, { f: f * 2, a: 0.002, d: 0.25, v: v * 0.1 }); },
  pluck: (c, o, t, f, dur, v) => { tone(c, o, t, { w: 'square', f, a: 0.003, d: 0.28, v: v * 0.22, lp: f * 4, lp2: f * 1.2, lpt: 0.2 }); },
  pad: (c, o, t, f, dur, v) => { for (const det of [-7, 7]) tone(c, o, t, { w: 'sawtooth', f, det, a: 0.6, d: 0.4, s: 0.8, h: hold(dur, 1), r: 1.2, v: v * 0.1, lp: 900, q: 0.5 }); },
  glass: (c, o, t, f, dur, v) => {
    tone(c, o, t, { f, a: 0.9, d: 0.5, s: 0.8, h: hold(dur, 1.4), r: 1.5, v: v * 0.28, vib: [4, 6] });
    tone(c, o, t, { w: 'triangle', f: f * 2, det: 5, a: 1.1, d: 0.5, s: 0.7, h: hold(dur, 1.6), r: 1.5, v: v * 0.06 });
    tone(c, o, t, { f: f * 3, det: -4, a: 1.2, d: 0.5, s: 0.6, h: hold(dur, 1.7), r: 1.2, v: v * 0.03 });
  },
  bass: (c, o, t, f, dur, v) => { tone(c, o, t, { w: 'triangle', f, a: 0.01, d: 0.3, s: 0.5, h: dur * 0.6, r: 0.15, v: v * 0.6, lp: 700 }); tone(c, o, t, { f, a: 0.01, d: 0.3, s: 0.5, h: dur * 0.6, r: 0.15, v: v * 0.35 }); },
  pizz: (c, o, t, f, dur, v) => { tone(c, o, t, { w: 'triangle', f, a: 0.003, d: 0.2, v: v * 0.7, lp: 1500 }); },
  kick: (c, o, t, f, dur, v) => { tone(c, o, t, { f: 140, f2: 45, gl: 0.12, a: 0.002, d: 0.28, v: v * 0.9 }); },
  snare: (c, o, t, f, dur, v) => { noise(c, o, t, { f: 1800, q: 0.7, d: 0.14, v: v * 0.45 }); tone(c, o, t, { w: 'triangle', f: 190, a: 0.001, d: 0.08, v: v * 0.3 }); },
  hat: (c, o, t, f, dur, v) => { noise(c, o, t, { ft: 'highpass', f: 7500, d: 0.035, v: v * 0.22 }); },
  shaker: (c, o, t, f, dur, v) => { noise(c, o, t, { f: 6000, q: 1, a: 0.015, d: 0.05, v: v * 0.14 }); },
  tick: (c, o, t, f, dur, v) => { tone(c, o, t, { f: 2600, a: 0.001, d: 0.015, v: v * 0.25 }); noise(c, o, t, { ft: 'highpass', f: 6000, d: 0.01, v: v * 0.08 }); },
  tock: (c, o, t, f, dur, v) => { tone(c, o, t, { f: 1750, a: 0.001, d: 0.02, v: v * 0.22 }); noise(c, o, t, { ft: 'highpass', f: 4000, d: 0.01, v: v * 0.06 }); },
};

// ---------------------------------------------------------------- tracks
const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10], LYD = [0, 2, 4, 6, 7, 9, 11], PHR = [0, 1, 3, 5, 7, 8, 10];
// Layer kinds: chord, bass, arp, sparkle, drums, melody. o = semitone offset, d = duration in 16th steps.
const TRACKS = {
  menu: { bpm: 72, spb: 12, bars: 16, root: 65, scale: MAJ, prog: [0, 5, 3, 4, 0, 5, 1, 4], layers: [ // warm lullaby, 3/4
    { t: 'chord', i: 'pad', o: -12, steps: [0], d: 12, v: 0.5 },
    { t: 'bass', i: 'bass', o: -24, steps: [0], d: 10, v: 0.5 },
    { t: 'arp', i: 'harp', o: -12, every: 4, pat: [0, 1, 2], d: 4, v: 0.32 },
    { t: 'melody', i: 'musicbox', o: 12, den: 0.45, v: 0.5, max: 8 }] },
  w1: { bpm: 88, spb: 16, bars: 16, root: 62, scale: MAJ, prog: [0, 3, 0, 4, 5, 3, 1, 4], layers: [ // dawn: flute + marimba
    { t: 'chord', i: 'pad', o: -12, steps: [0], d: 16, v: 0.25 },
    { t: 'arp', i: 'marimba', o: 0, every: 2, pat: [0, 2, 1, 2, 3, 2, 1, 2], d: 2, v: 0.38 },
    { t: 'bass', i: 'bass', o: -24, steps: [0, 10], d: 6, v: 0.45 },
    { t: 'melody', i: 'flute', o: 12, den: 0.4, v: 0.5, max: 8 }] },
  w2: { bpm: 80, spb: 16, bars: 16, root: 67, scale: MAJ, prog: [0, 2, 3, 0, 5, 3, 1, 4], layers: [ // forest: kalimba, bells, shaker
    { t: 'arp', i: 'kalimba', o: -12, every: 2, pat: [0, 2, 1, 3, 1, 2], d: 3, v: 0.42 },
    { t: 'sparkle', i: 'bell', o: 12, every: 4, p: 0.22, v: 0.3 },
    { t: 'drums', p: { shaker: '..x...x...x...x.' }, v: 0.5 },
    { t: 'bass', i: 'bass', o: -24, steps: [0, 8], d: 6, v: 0.4 },
    { t: 'melody', i: 'flute', o: 0, den: 0.35, v: 0.45, max: 8 }] },
  w3: { bpm: 96, spb: 16, bars: 16, root: 57, scale: MIN, prog: [0, 5, 2, 6, 0, 3, 4, 4], layers: [ // steampunk ticking music box
    { t: 'drums', p: { tick: 'x.......x.......', tock: '....x.......x...' }, v: 0.5 },
    { t: 'bass', i: 'pizz', o: -12, steps: [0, 4, 8, 12], alt: true, d: 2, v: 0.5 },
    { t: 'arp', i: 'musicbox', o: 0, every: 2, pat: [0, 1, 2, 1, 3, 1, 2, 1], d: 2, v: 0.26 },
    { t: 'melody', i: 'musicbox', o: 12, den: 0.5, v: 0.45, max: 4 }] },
  w4: { bpm: 70, spb: 16, bars: 16, root: 65, scale: LYD, prog: [0, 1, 0, 1, 3, 4, 5, 1], layers: [ // crystal pads
    { t: 'chord', i: 'glass', o: -12, steps: [0], d: 16, v: 0.55 },
    { t: 'bass', i: 'bass', o: -24, steps: [0], d: 14, v: 0.32 },
    { t: 'sparkle', i: 'bell', o: 12, every: 2, p: 0.12, v: 0.25 },
    { t: 'arp', i: 'musicbox', o: 0, every: 4, pat: [0, 2, 1, 3], d: 4, v: 0.18 },
    { t: 'melody', i: 'bell', o: 12, den: 0.25, v: 0.4, max: 8 }] },
  w5: { bpm: 76, spb: 16, bars: 16, root: 62, scale: MIN, prog: [0, 5, 2, 6, 0, 3, 5, 4], layers: [ // night harp + stars
    { t: 'arp', i: 'harp', o: -12, every: 2, pat: [0, 1, 2, 3, 4, 3, 2, 1], d: 6, v: 0.4 },
    { t: 'chord', i: 'pad', o: -12, steps: [0], d: 16, v: 0.22 },
    { t: 'sparkle', i: 'bell', o: 24, every: 4, p: 0.15, v: 0.13 },
    { t: 'bass', i: 'bass', o: -24, steps: [0], d: 14, v: 0.32 },
    { t: 'melody', i: 'harp', o: 12, den: 0.35, v: 0.42, max: 8 }] },
  boss: { bpm: 100, spb: 16, bars: 16, root: 52, scale: PHR, prog: [0, 0, 1, 0, 5, 5, 6, 1], layers: [ // tense beat
    { t: 'drums', p: { kick: 'x.....x...x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.xx' }, v: 0.6 },
    { t: 'arp', i: 'pluck', o: -24, every: 2, pat: [0, 0, 0, 0, 0, 0, 3, 0], d: 1.5, v: 0.55 },
    { t: 'chord', i: 'pad', o: -12, steps: [0], d: 16, v: 0.32 },
    { t: 'melody', i: 'pluck', o: 0, den: 0.3, v: 0.35, max: 3 }] },
  game: { bpm: 100, spb: 16, bars: 16, root: 60, scale: MAJ, prog: [0, 4, 5, 3], layers: [ // upbeat mini-game
    { t: 'drums', p: { kick: 'x.......x.......', hat: '..x...x...x...x.', shaker: 'x.x.x.x.x.x.x.x.' }, v: 0.45 },
    { t: 'bass', i: 'bass', o: -24, steps: [0, 6, 8, 14], alt: true, d: 2, v: 0.45 },
    { t: 'arp', i: 'marimba', o: 0, every: 2, pat: [0, 1, 2, 1], d: 2, v: 0.32 },
    { t: 'melody', i: 'pluck', o: 12, den: 0.5, v: 0.32, max: 4 }] },
};
export const TRACK_NAMES = Object.keys(TRACKS);

const songCache = {};
function getSong(name) {
  if (songCache[name]) return songCache[name];
  const d = TRACKS[name];
  const rng = mulberry(hash(name) || 1);
  const spb = d.spb, len = spb * d.bars;
  const byStep = new Array(len);
  const add = (step, i, midi, dur, v) => {
    const s = ((step % len) + len) % len;
    (byStep[s] || (byStep[s] = [])).push({ i, f: midi == null ? 0 : mtof(midi), d: dur, v: v * (0.9 + rng() * 0.2) });
  };
  const chordAt = (bar) => d.prog[bar % d.prog.length];
  const degMidi = (deg, oct) => d.root + oct + d.scale[((deg % 7) + 7) % 7] + 12 * Math.floor(deg / 7);
  for (const L of d.layers) {
    if (L.t === 'chord') {
      for (let b = 0; b < d.bars; b++) for (const st of L.steps) for (const k of [0, 2, 4]) add(b * spb + st, L.i, degMidi(chordAt(b) + k, L.o), L.d, L.v);
    } else if (L.t === 'bass') {
      for (let b = 0; b < d.bars; b++) L.steps.forEach((st, j) => add(b * spb + st, L.i, degMidi(chordAt(b) + (L.alt && j % 2 ? 4 : 0), L.o), L.d, L.v));
    } else if (L.t === 'arp') {
      const tones = [0, 2, 4, 7, 9];
      for (let b = 0; b < d.bars; b++) for (let s = 0, n = 0; s < spb; s += L.every, n++) {
        add(b * spb + s, L.i, degMidi(chordAt(b) + tones[L.pat[n % L.pat.length]], L.o), L.d, L.v * (s % 4 === 0 ? 1 : 0.78));
      }
    } else if (L.t === 'sparkle') {
      const tones = [0, 2, 4, 7];
      for (let b = 0; b < d.bars; b++) for (let s = 0; s < spb; s += L.every) {
        if (rng() < L.p) add(b * spb + s, L.i, degMidi(chordAt(b) + tones[Math.floor(rng() * 4)], L.o), 4, L.v);
      }
    } else if (L.t === 'drums') {
      for (let b = 0; b < d.bars; b++) for (const k in L.p) {
        const pat = L.p[k];
        for (let s = 0; s < spb; s++) if (pat[s % pat.length] === 'x') add(b * spb + s, k, null, 1, L.v);
      }
    } else if (L.t === 'melody') {
      genMelody(d, L, rng, add, chordAt, degMidi);
    }
  }
  return (songCache[name] = { byStep, len, stepDur: 60 / d.bpm / 4 });
}

function nearestChord(deg, c) {
  let best = deg, bd = 99;
  for (let o = -2; o <= 2; o++) for (const k of [0, 2, 4]) { const x = c + k + 7 * o, dd = Math.abs(x - deg); if (dd < bd) { bd = dd; best = x; } }
  return best;
}
// Own melodies: a 2-bar motif + variations in an A A' B A' / A A' B end form, strong beats snapped to chord tones.
function genMelody(d, L, rng, add, chordAt, degMidi) {
  const spb = d.spb, P = spb * 2;
  const motif = () => {
    const ns = []; let deg = 0;
    for (let pos = 0; pos < P - 2; pos += 2) {
      const down = pos % spb === 0, beat = pos % 4 === 0;
      const pr = down ? 1 : beat ? L.den + 0.2 : L.den - 0.2;
      if (rng() < pr) {
        if (ns.length) {
          const r = rng();
          deg += r < 0.15 ? -2 : r < 0.4 ? -1 : r < 0.5 ? 0 : r < 0.78 ? 1 : r < 0.92 ? 2 : (rng() < 0.5 ? 3 : -3);
          deg = Math.max(-3, Math.min(5, deg));
        }
        ns.push({ pos, rel: deg });
      }
    }
    return ns;
  };
  const A = motif(), B = motif();
  const A2 = A.map((n, i) => (i >= A.length - 2 ? { pos: n.pos, rel: n.rel + (rng() < 0.5 ? 1 : -1) * (rng() < 0.6 ? 1 : 2) } : n));
  const form = [A, A2, B, A2, A, A2, B, null];
  const phrases = Math.floor(d.bars / 2);
  for (let k = 0; k < phrases; k++) {
    const end = k === phrases - 1;
    const ns = end ? A.filter((n) => n.pos < spb) : (form[k % form.length] || A);
    const bar0 = k * 2;
    let base = chordAt(bar0); if (base >= 4) base -= 7;
    const out = ns.map((n) => {
      const bar = bar0 + Math.floor(n.pos / spb);
      let deg = base + n.rel;
      if (n.pos % spb === 0 || (n.pos % 4 === 0 && rng() < 0.5)) deg = nearestChord(deg, chordAt(bar));
      return { pos: n.pos, deg };
    });
    if (end) { const last = out.length ? out[out.length - 1].deg : 0; out.push({ pos: spb, deg: last > 3 ? 7 : 0 }); }
    out.forEach((n, i) => {
      const nextPos = i + 1 < out.length ? out[i + 1].pos : P - 1;
      const dur = end && i === out.length - 1 ? spb : Math.min(L.max || 6, nextPos - n.pos);
      add(bar0 * spb + n.pos, L.i, degMidi(n.deg, L.o), dur, L.v * (n.pos % spb === 0 ? 1 : 0.85));
    });
  }
}

// ---------------------------------------------------------------- graph
function makeGraph(c) {
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.2;
  const master = c.createGain(); master.gain.value = 0.85;
  master.connect(comp); comp.connect(c.destination);
  const conv = c.createConvolver(); conv.buffer = impulse(c, 2.2, 3);
  const rev = c.createGain(); rev.gain.value = 0.8; conv.connect(rev); rev.connect(master);
  const musicIn = c.createGain();
  const duckG = c.createGain();
  const musicVol = c.createGain(); musicVol.gain.value = MUSIC_VOL;
  musicIn.connect(duckG); duckG.connect(musicVol); musicVol.connect(master);
  const mSend = c.createGain(); mSend.gain.value = 0.35; musicVol.connect(mSend); mSend.connect(conv);
  const sfxBus = c.createGain(); sfxBus.gain.value = SFX_VOL; sfxBus.connect(master);
  const sSend = c.createGain(); sSend.gain.value = 0.15; sfxBus.connect(sSend); sSend.connect(conv);
  return { master, comp, musicIn, duckG, sfx: sfxBus };
}

// ---------------------------------------------------------------- context / unlock
let ctx = null, G = null, unlocked = false, resuming = false, pausedByHide = false, listening = false;
const AC = W.AudioContext || W.webkitAudioContext;

function getCtx() {
  if (ctx || !AC) return ctx;
  try {
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { ctx = new AC(); }
    G = makeGraph(ctx);
    ctx.onstatechange = () => {
      try {
        if (ctx.state === 'running') {
          resuming = false;
          if (doc && doc.hidden) { pausedByHide = true; ctx.suspend().catch(() => {}); return; }
          if (!unlocked) { unlocked = true; applyMusic(); }
        }
      } catch (e) { /* ignore */ }
    };
  } catch (e) { ctx = null; G = null; }
  return ctx;
}
const doc = typeof document !== 'undefined' ? document : null;

function unlock() {
  try {
    if (!AC || (doc && doc.hidden)) return;
    const c = getCtx(); if (!c) return;
    if (c.state !== 'running') {
      resuming = true;
      const p = c.resume();
      if (p && p.then) p.then(() => { resuming = false; if (c.state === 'running' && !unlocked) { unlocked = true; applyMusic(); } }).catch(() => { resuming = false; });
    } else if (!unlocked) { unlocked = true; applyMusic(); }
    if (!c._lqSilent) {      // iOS: a silent buffer started inside the gesture unlocks output
      c._lqSilent = true;
      const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource();
      s.buffer = b; s.connect(c.destination); s.start(0);
    }
    warmSpeech();
  } catch (e) { /* ignore */ }
}

let speechWarm = false;
function warmSpeech() {
  try {
    if (speechWarm || !W.speechSynthesis || !W.SpeechSynthesisUtterance) return;
    speechWarm = true;
    const u = new W.SpeechSynthesisUtterance(' ');
    u.volume = 0; u.lang = 'en-US';
    W.speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}

function onVisibility() {
  try {
    if (!ctx) return;
    if (doc.hidden) {
      if (ctx.state === 'running') { pausedByHide = true; ctx.suspend().catch(() => {}); }
      try { W.speechSynthesis && W.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    } else if (pausedByHide) {
      pausedByHide = false;
      const p = ctx.resume(); if (p && p.catch) p.catch(() => {});
    }
  } catch (e) { /* ignore */ }
}

export function initAudio() {
  try {
    if (listening || !doc || !W.addEventListener) return;
    listening = true;
    const opt = { capture: true, passive: true };
    // Listeners stay: they also recover iOS "interrupted" contexts after calls / Siri.
    for (const ev of ['pointerdown', 'pointerup', 'touchend', 'mousedown', 'keydown', 'click']) {
      W.addEventListener(ev, () => { if (!ctx || ctx.state !== 'running' || !unlocked) unlock(); }, opt);
    }
    doc.addEventListener('visibilitychange', onVisibility);
    W.addEventListener('pagehide', () => { try { if (ctx && ctx.state === 'running') { pausedByHide = true; ctx.suspend().catch(() => {}); } } catch (e) { /* ignore */ } });
    W.addEventListener('pageshow', () => { if (doc && !doc.hidden) onVisibility(); });
    if (W.speechSynthesis && 'onvoiceschanged' in W.speechSynthesis) {
      W.speechSynthesis.addEventListener('voiceschanged', () => { voiceCache = {}; });
    }
    pickVoice('en-US');   // kicks off async voice loading
  } catch (e) { /* ignore */ }
}
initAudio();

// ---------------------------------------------------------------- sfx
const lastPlay = {};
export function sfx(name) {
  try {
    if (!settings.sound) return;
    const f = SFX[name]; if (!f) return;
    const c = ctx;
    if (!c || !G || !(c.state === 'running' || resuming)) return;
    const now = c.currentTime;
    if (now - (lastPlay[name] ?? -1) < (name === 'type' ? 0.02 : 0.035)) return;
    lastPlay[name] = now;
    const p = Math.pow(2, (Math.random() - 0.5) * 0.07);   // ±~60 cents
    f(c, G.sfx, now + 0.005, p);
  } catch (e) { /* ignore */ }
}

// ---------------------------------------------------------------- music sequencer
let wantTrack = null, cur = null, timer = null;
const insts = [];

function makeInstance(c, out, name, t0) {
  const g = c.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(1, t0 + FADE);
  g.connect(out);
  return { name, song: getSong(name), g, step: 0, next: t0, until: Infinity };
}
function schedule(c, inst, horizon) {
  const sd = inst.song.stepDur;
  while (inst.next < horizon && inst.next < inst.until) {
    const evs = inst.song.byStep[inst.step];
    if (evs) for (const e of evs) { try { INST[e.i](c, inst.g, inst.next, e.f, e.d * sd, e.v); } catch (x) { /* ignore */ } }
    inst.next += sd;
    inst.step = (inst.step + 1) % inst.song.len;
  }
}
function pump() {
  try {
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let k = insts.length - 1; k >= 0; k--) {
      const it = insts[k];
      if (it.until !== Infinity && now > it.until + 3) {
        try { it.g.disconnect(); } catch (e) { /* ignore */ }
        insts.splice(k, 1); continue;
      }
      if (it.next < now - 0.05) it.next = now + 0.02;   // timer starved (jank) -> resync instead of a burst
      schedule(ctx, it, now + LOOKAHEAD);
    }
    if (!insts.length && timer) { clearInterval(timer); timer = null; }
  } catch (e) { /* ignore */ }
}
function fadeOut(it, now) {
  try {
    const g = it.g.gain, v = g.value;
    g.cancelScheduledValues(now); g.setValueAtTime(v, now); g.linearRampToValueAtTime(0, now + FADE);
    it.until = now + FADE;
  } catch (e) { it.until = now; }
}
function applyMusic() {
  try {
    let target = settings.music ? wantTrack : null;
    if (!TRACKS[target]) target = null;
    if ((cur ? cur.name : null) === target) return;
    if (!unlocked || !ctx || !G) { if (!target && cur) { /* nothing to fade yet */ } return; }
    const now = ctx.currentTime;
    if (cur) { fadeOut(cur, now); cur = null; }
    if (target) {
      cur = makeInstance(ctx, G.musicIn, target, now + 0.06);
      insts.push(cur);
      if (!timer) timer = setInterval(pump, TICK_MS);
      pump();
    }
  } catch (e) { /* ignore */ }
}
export function music(track) { try { wantTrack = track || null; applyMusic(); } catch (e) { /* ignore */ } }

// ---------------------------------------------------------------- duck
let manualDuck = false, speakDucks = 0;
function applyDuck() {
  try {
    if (!ctx || !G) return;
    const on = manualDuck || speakDucks > 0;
    G.duckG.gain.setTargetAtTime(on ? DUCK_LEVEL : 1, ctx.currentTime, on ? 0.08 : 0.25);
  } catch (e) { /* ignore */ }
}
export function duck(on) { manualDuck = !!on; applyDuck(); }

// ---------------------------------------------------------------- speech
let voiceCache = {};
const GOOD = /(natural|neural|premium|enhanced|siri)/i;
const NICE = /(samantha|ava|allison|susan|karen|daniel|serena|kate|moira|google us english|google uk english female|aria|jenny|guy|libby|sonia|zira|emma|michelle)/i;
const NOVELTY = /(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|princess|grandma|grandpa|rocko|shelley|sandy|flo|eddy|reed)/i;
function pickVoice(lang) {
  try {
    const ss = W.speechSynthesis; if (!ss) return null;
    const vs0 = ss.getVoices() || [];
    if (settings.voice) { const mine = vs0.find((v) => v.voiceURI === settings.voice || v.name === settings.voice); if (mine) return mine; }
    if (voiceCache[lang] !== undefined) return voiceCache[lang];
    const vs = vs0;
    if (!vs.length) return null;          // not loaded yet (iOS/Chrome) — voiceschanged will reset the cache
    const want = lang.toLowerCase();
    let best = null, bs = -1e9;
    for (const v of vs) {
      const vl = String(v.lang || '').replace('_', '-').toLowerCase();
      if (!vl.startsWith('en')) continue;
      let s = 0;
      if (vl === want) s += 40; else if (vl === 'en-us' || vl === 'en-gb') s += 22; else s += 5;
      if (GOOD.test(v.name)) s += 30;
      if (NICE.test(v.name)) s += 15;
      if (NOVELTY.test(v.name)) s -= 50;
      if (v.localService) s += 3;
      if (v.default) s += 2;
      if (s > bs) { bs = s; best = v; }
    }
    voiceCache[lang] = best;
    return best;
  } catch (e) { return null; }
}
export function canSpeak() { try { return !!(W.speechSynthesis && W.SpeechSynthesisUtterance); } catch (e) { return false; } }

export function speak(text, opts) {
  return new Promise((resolve) => {
    try {
      const o = opts || {};
      const ss = W.speechSynthesis;
      if (!canSpeak() || !text || !settings.sound) { resolve(false); return; }
      const str = String(text);
      const lang = o.lang || 'en-US';
      const u = new W.SpeechSynthesisUtterance(str);
      u.lang = lang;
      const v = pickVoice(lang); if (v) u.voice = v;
      u.rate = o.rate ?? 0.9; u.pitch = o.pitch ?? 1; u.volume = 1;
      let done = false, to = 0;
      const fin = (ok) => { if (done) return; done = true; clearTimeout(to); speakDucks = Math.max(0, speakDucks - 1); applyDuck(); speechHold(false); resolve(ok); };
      u.onend = () => fin(true);
      u.onerror = () => fin(false);
      const wasSpeaking = ss.speaking || ss.pending;
      try { if (wasSpeaking) ss.cancel(); } catch (e) { /* ignore */ }
      speakDucks++; applyDuck();
      // iOS: коли одночасно працює WebAudio, системний голос звучить «зламаним роботом» —
      // на час мовлення призупиняємо AudioContext (музику і звуки), потім відновлюємо.
      speechHold(true);
      const go = () => { try { ss.speak(u); if (ss.paused) ss.resume(); } catch (e) { fin(false); } };
      if (wasSpeaking) setTimeout(go, 80); else go();
      to = setTimeout(() => fin(false), 2500 + str.length * 140);   // safety: some engines never fire onend
    } catch (e) { resolve(false); }
  });
}

let holdN = 0, holdT = 0;
function speechHold(on) {
  try {
    if (!ctx) return;
    if (on) { holdN++; clearTimeout(holdT); if (ctx.state === 'running') ctx.suspend().catch(() => {}); }
    else {
      holdN = Math.max(0, holdN - 1);
      if (holdN === 0) { clearTimeout(holdT); holdT = setTimeout(() => { try { if (!holdN && !(doc && doc.hidden)) ctx.resume().catch(() => {}); } catch (e) { /* ignore */ } }, 250); }
    }
  } catch (e) { /* ignore */ }
}

/** Англійські голоси пристрою для вибору в налаштуваннях: [{id, name, lang, local}] */
export function listVoices() {
  try {
    const vs = (W.speechSynthesis && W.speechSynthesis.getVoices()) || [];
    return vs.filter((v) => String(v.lang || '').toLowerCase().startsWith('en') && !NOVELTY.test(v.name))
      .map((v) => ({ id: v.voiceURI || v.name, name: v.name, lang: v.lang, local: !!v.localService }));
  } catch (e) { return []; }
}
export function getVoice() { const v = pickVoice('en-US'); return v ? (v.voiceURI || v.name) : ''; }
export function setVoice(id) { try { settings.voice = id || ''; voiceCache = {}; saveSettings(); } catch (e) { /* ignore */ } }

// ---------------------------------------------------------------- settings API
export function setSound(on) {
  try {
    settings.sound = !!on; saveSettings();
    if (!on && W.speechSynthesis) W.speechSynthesis.cancel();
  } catch (e) { /* ignore */ }
}
export function setMusic(on) { try { settings.music = !!on; saveSettings(); applyMusic(); } catch (e) { /* ignore */ } }
export function getSettings() { return { sound: settings.sound, music: settings.music }; }

// ---------------------------------------------------------------- dev: offline render (used by dev/audio-demo.html)
export async function renderOffline(what, seconds = 2) {
  try {
    const OAC = W.OfflineAudioContext || W.webkitOfflineAudioContext;
    if (!OAC) return null;
    const sr = 44100, c = new OAC(2, Math.floor(sr * seconds), sr);
    const g = makeGraph(c);
    if (TRACKS[what]) {
      const it = makeInstance(c, g.musicIn, what, 0);
      it.g.gain.cancelScheduledValues(0); it.g.gain.setValueAtTime(1, 0);
      schedule(c, it, seconds);
    } else if (SFX[what]) {
      SFX[what](c, g.sfx, 0.01, 1);
    } else return null;
    const buf = await c.startRendering();
    let peak = 0, sum = 0, n = 0;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; sum += d[i] * d[i]; n++; }
    }
    return { peak: +peak.toFixed(4), rms: +Math.sqrt(sum / n).toFixed(5) };
  } catch (e) { return null; }
}
