// LumiQuest — Лумі, анімована SVG-героїня (v6 «Ліхтарик-дух»).
//
//   import { createLumi } from './lumi.js?v=20261110190353';
//   const lumi = createLumi(container, { size: 220, emotion: 'hello', bubble: 'top' });
//   lumi.set('happy');              // hello happy excited thinking surprised sad proud cheer sleepy
//   lumi.say('Привіт!', { ms: 2500 }); // бульбашка + друк + говоріння (5 форм рота по голосних, кивки)
//   lumi.talk(1500);                // лише рот «говорить» 1.5 с; talk('текст') = say('текст'); talk(0) — стоп
//   lumi.react('tap');              // tap jump giggle spin shake nod love wow
//   lumi.destroy();
//
// Дизайн v6: кругла перламутрово-біла кулька-ліхтарик з теплим золотаво-персиковим світлом
// усередині, що пульсує; лавандово-рожевий rim-light; бірюзові ковпачки з золотим кантом;
// прозоро-райдужні крильця світлячка, антенки з вогниками, вушка-пелюстки, золота китиця-зірочка.
// Темна сливова обвідка. Простір координат концепту C (viewBox -28 -4 456 456, центр тільця 200,236).
// Без залежностей; CSS вбудований; кілька екземплярів на сторінці.

const EMOTIONS = ['hello', 'happy', 'excited', 'thinking', 'surprised', 'sad', 'proud', 'cheer', 'sleepy'];

const C = {
  outline: '#3a2440', eyeDark: '#1c1233', mouthIn: '#5e1f45', tongue: '#ff8aa2', cheek: '#ff7f9e',
  glow: '#ffdca6', glowCool: '#b4c2ff',
};

const BODY = { cx: 200, cy: 236, rx: 118, ry: 106 };
const EYE_L = [160, 236], EYE_R = [240, 236];
const ARM_L = [88, 268], ARM_R = [312, 268];
const WING_PIV = [128, 240];       // left wing root (right one is mirrored around x=200)
const PETAL_PIV = [128, 166];
const ANT_PIV = [188, 126];
const TAS_PIV = [200, 350];

// arm poses: angle of the LEFT arm in degrees (180 = straight out left, >180 = up), right arm mirrored
const ARM_POSES = { rest: 118, down: 100, out: 168, hip: 132, up: 214, wave: 236, fist: 222, cheerUp: 200, hidden: 112 };

// w: wing angle (+ up / − folded down), ws: wing scale, pl/pr: petals, nl/nr: antennae, ta: tassel tilt, ts: star scale
const POSES = {
  hello: { eyes: ['open', 'open'], mouth: 'smile_open', brows: 'none', arms: ['rest', 'wave'], w: 4, ws: 1, p: [2, 2], n: [0, 0], ta: 0, ts: 1,
    acc: ['waveLines', 'sparkHello'] },
  happy: { eyes: ['happy', 'happy'], mouth: 'big_smile', brows: 'none', arms: ['cheerUp', 'cheerUp'], w: 12, ws: 1.04, p: [8, 8], n: [8, 8], ta: 0, ts: 1.12, glow: 1.25,
    acc: ['sparkHappy', 'hearts'] },
  excited: { eyes: ['star', 'star'], mouth: 'big_open', brows: 'raised', arms: ['up', 'up'], w: 18, ws: 1.06, p: [12, 12], n: [12, 12], ta: 0, ts: 1.2, glow: 1.4,
    acc: ['sparkMany'] },
  thinking: { eyes: ['look_up', 'look_up'], mouth: 'hmm', brows: 'thinking', arms: ['rest', 'hidden'], w: -4, ws: 0.98, p: [-6, 6], n: [-12, 10], ta: 10, ts: 1,
    chin: 1, acc: ['question'] },
  surprised: { eyes: ['round', 'round'], mouth: 'o', brows: 'raised', arms: ['out', 'out'], w: 22, ws: 1.06, p: [16, 16], n: [16, 16], ta: -4, ts: 1.1, glow: 1.15,
    acc: ['exclaim', 'popLines'] },
  sad: { eyes: ['sad', 'sad'], mouth: 'sad', brows: 'sad', arms: ['down', 'down'], w: -38, ws: 0.8, p: [-34, -34], n: [-30, -30], ta: 0, ts: 0.86, glow: 0.4,
    cool: 1, tint: 0.24, dust: 0.25, cheek: 0.55, acc: ['tear'] },
  proud: { eyes: ['content', 'content'], mouth: 'smug', brows: 'proud', arms: ['hip', 'hip'], w: 10, ws: 1.04, p: [6, 6], n: [4, 4], ta: 0, ts: 1.28, glow: 1.35,
    acc: ['crown', 'confetti', 'rays'] },
  cheer: { eyes: ['open', 'wink'], mouth: 'grin', brows: 'confident', arms: ['rest', 'fist'], w: 12, ws: 1.04, p: [6, 10], n: [4, 10], ta: 0, ts: 1.12, glow: 1.2,
    acc: ['sparkCheer', 'fistLines'] },
  sleepy: { eyes: ['sleep', 'sleep'], mouth: 'sleep', brows: 'none', arms: ['down', 'down'], w: -26, ws: 0.88, p: [-22, -22], n: [-26, -20], ta: 6, ts: 0.9, glow: 0.22,
    cool: 0.45, tint: 0.14, dust: 0.45, cheek: 0.75, acc: ['zzz'] },
};
const BRIGHT = ['happy', 'excited', 'cheer', 'proud'];

const TAP_PHRASES = [
  'Хі-хі, лоскотно!', 'Ой! Привіт! 👋', 'Я Лумі! ✨', 'Вчимося далі?',
  'Ти чудово справляєшся!', 'Ще одне слово? 📚', 'Обережно, я сяю!', 'Let\'s go! Тобто — вперед!',
];
const SPIN_PHRASES = ['Ві-і-і-і!', 'Голова обертом! 🌀', 'Ух, як весело!'];

// ---------------------------------------------------------------- geometry

const f = (n) => Math.round(n * 100) / 100;
const rad = (d) => (d * Math.PI) / 180;

function arcC(cx, cy, rx, ry, a0, a1, segs = 2) {
  const out = [cx + rx * Math.cos(rad(a0)), cy + ry * Math.sin(rad(a0))];
  const step = (a1 - a0) / segs;
  const k = (4 / 3) * Math.tan(rad(step) / 4);
  for (let i = 0; i < segs; i++) {
    const t0 = rad(a0 + step * i), t1 = rad(a0 + step * (i + 1));
    const p0 = [cx + rx * Math.cos(t0), cy + ry * Math.sin(t0)];
    const p3 = [cx + rx * Math.cos(t1), cy + ry * Math.sin(t1)];
    out.push(p0[0] - k * rx * Math.sin(t0), p0[1] + k * ry * Math.cos(t0),
      p3[0] + k * rx * Math.sin(t1), p3[1] - k * ry * Math.cos(t1), p3[0], p3[1]);
  }
  return out;
}
const arcD = (...a) => cubicD(arcC(...a));
function cubicD(n, len = n.length) {
  let d = `M${f(n[0])} ${f(n[1])}`;
  for (let i = 2; i < len; i += 6) d += `C${f(n[i])} ${f(n[i + 1])} ${f(n[i + 2])} ${f(n[i + 3])} ${f(n[i + 4])} ${f(n[i + 5])}`;
  return d;
}

function starPts(cx, cy, ro, ri, rot = 0, n = 5) {
  const p = [];
  for (let i = 0; i < 2 * n; i++) {
    const r = i % 2 ? ri : ro, a = rad(rot - 90 + (i * 180) / n);
    p.push(`${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))}`);
  }
  return p.join(' ');
}
function softStarD(cx, cy, ro, ri, n = 5, round = 0.35) {
  const pts = [];
  for (let i = 0; i < 2 * n; i++) {
    const r = i % 2 ? ri : ro, a = rad(-90 + (i * 180) / n);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  let d = '';
  const N = pts.length;
  for (let i = 0; i < N; i++) {
    const p = pts[i], prev = pts[(i - 1 + N) % N], next = pts[(i + 1) % N];
    const a = [p[0] + (prev[0] - p[0]) * round, p[1] + (prev[1] - p[1]) * round];
    const b = [p[0] + (next[0] - p[0]) * round, p[1] + (next[1] - p[1]) * round];
    d += `${i ? 'L' : 'M'}${f(a[0])} ${f(a[1])}Q${f(p[0])} ${f(p[1])} ${f(b[0])} ${f(b[1])}`;
  }
  return d + 'Z';
}

// ---- mouth: closed path of 4 cubics (26 numbers) + stroke + tongue [cx, cy, rx, ry, opacity]
// shapes are authored around (MX, MY) at unit scale and placed by toFace()
const MX = 0, MY = 0, MS = 0.8, FACE_M = [200, 281];
function mouthOpen(cx, cy, rx, ry, upLift = 0.12, tilt = 0) {
  const lo = arcC(cx, cy, rx, ry, 0, 180), up = arcC(cx, cy, rx, ry * upLift, 180, 360);
  const n = lo.concat(up.slice(2));
  if (tilt) for (let i = 0; i < n.length; i += 2) n[i + 1] += tilt * (n[i] - cx);
  return n;
}
function mouthLine(cx, cy, rx, ry, a0, a1) {
  const a = arcC(cx, cy, rx, ry, a0, a1), b = arcC(cx, cy, rx, ry, a1, a0);
  return a.concat(b.slice(2));
}
const RAW_MOUTHS = {
  smile: [mouthLine(MX, MY - 6, 15, 12, 25, 155), 6.5, [MX, MY + 2, 6, 4, 0]],
  smile_open: [mouthOpen(MX, MY - 2, 17, 16), 7, [MX + 2, MY + 10, 10.5, 7.5, 1]],
  big_smile: [mouthOpen(MX, MY - 4, 23, 21, 0.08), 7, [MX + 2, MY + 12, 14, 9, 1]],
  big_open: [mouthOpen(MX, MY - 4, 24, 26, 0.12), 7, [MX + 2, MY + 16, 15, 11, 1]],
  grin: [mouthOpen(MX + 2, MY - 2, 19, 14, 0.1, -0.16), 7, [MX + 4, MY + 8, 11, 6.5, 1]],
  smug: [mouthLine(MX, MY - 8, 19, 11, 18, 162), 6.5, [MX, MY, 6, 4, 0]],
  o: [mouthOpen(MX, MY + 2, 11, 14, 1), 7, [MX, MY + 12, 7, 5, 1]],
  sad: [mouthLine(MX, MY + 10, 13, 8, 335, 205), 6.5, [MX, MY + 6, 6, 4, 0]],
  hmm: [[MX + 6, MY - 2, MX, MY - 7, MX - 6, MY - 7, MX - 12, MY + 0.5, MX - 18, MY + 8, MX - 24, MY + 7, MX - 30, MY + 3,
    MX - 24, MY + 7, MX - 18, MY + 8, MX - 12, MY + 0.5, MX - 6, MY - 7, MX, MY - 7, MX + 6, MY - 2], 6.5, [MX - 12, MY + 2, 6, 4, 0]],
  sleep: [mouthOpen(MX, MY + 2, 7, 8, 1), 6.5, [MX, MY + 9, 5, 4, 0]],
  // talking visemes: closed / A / O / E / U
  t_closed: [mouthLine(MX, MY - 4, 12, 7, 20, 160), 6.5, [MX, MY, 6, 4, 0]],
  t_a: [mouthOpen(MX, MY - 3, 17, 19, 0.16), 7, [MX + 2, MY + 10, 11, 8, 1]],
  t_o: [mouthOpen(MX, MY + 1, 10.5, 14, 1), 7, [MX, MY + 10, 7, 5, 1]],
  t_e: [mouthOpen(MX, MY - 2, 20, 10, 0.32), 7, [MX + 2, MY + 4, 10, 4, 0.7]],
  t_u: [mouthOpen(MX, MY + 1, 7, 9, 1), 6.5, [MX, MY + 6, 5, 3.5, 0.6]],
};
const MOUTHS = {};
for (const [k, [pts, sw, t]] of Object.entries(RAW_MOUTHS)) {
  MOUTHS[k] = [pts.map((n, i) => FACE_M[i % 2] + n * MS), sw * 0.72,
    [FACE_M[0] + t[0] * MS, FACE_M[1] + t[1] * MS, t[2] * MS, t[3] * MS, t[4]]];
}
const FLAT = {};
for (const k in MOUTHS) { const m = MOUTHS[k]; FLAT[k] = [...m[0], m[1], ...m[2]]; } // 32 numbers, раз на модуль
const flatMouth = (k) => FLAT[k];

// brows [x0,y0,cx,cy,x1,y1] left, right — authored relative to the eye line
const RAW_BROWS = {
  none: [[-62, -46, -46, -55, -30, -47], [30, -47, 46, -55, 62, -46]],
  sad: [[-66, -38, -48, -44, -30, -54], [30, -54, 48, -44, 66, -38]],
  raised: [[-64, -50, -46, -64, -28, -54], [28, -54, 46, -64, 64, -50]],
  thinking: [[-62, -42, -46, -42, -30, -40], [34, -54, 52, -68, 70, -56]],
  confident: [[-64, -46, -47, -42, -30, -38], [30, -38, 47, -42, 64, -46]],
  proud: [[-64, -48, -47, -56, -30, -52], [30, -52, 47, -56, 64, -48]],
};
const BROWS = {};
for (const [k, v] of Object.entries(RAW_BROWS)) BROWS[k] = v.map((b) => b.map((n, i) => (i % 2 ? 236 + n * 0.83 : 200 + n * 0.83)));

// eye state: solid eye transform + highlight kind + line-eye opacities
function eyeState(kind) {
  const e = { tx: 0, ty: 0, sx: 1, sy: 1, solid: 1, spark: 0, hl: 1, water: 0, pup: 1, happy: 0, content: 0, sleep: 0, star: 0 };
  switch (kind) {
    case 'sparkly': Object.assign(e, { sx: 1.05, sy: 1.04, spark: 1, pup: 1.1 }); break;
    case 'round': Object.assign(e, { ty: -3, sx: 1.08, sy: 1.04, pup: 0.6, hl: 0.85 }); break;
    case 'sad': Object.assign(e, { ty: 4, sx: 0.98, sy: 0.88, hl: 1.25, water: 1, pup: 1.15 }); break;
    case 'look_up': Object.assign(e, { tx: 6, ty: -6, sx: 0.95, sy: 0.95 }); break;
    case 'star': Object.assign(e, { solid: 0, sy: 0.4, star: 1 }); break;
    case 'happy': case 'content': case 'sleep':
      Object.assign(e, { solid: 0, sy: 0.15, [kind]: 1 }); break;
    case 'wink': Object.assign(e, { solid: 0, sy: 0.15, happy: 1 }); break;
  }
  return e;
}

function armState(kind, side) {
  const a0 = ARM_POSES[kind] ?? ARM_POSES.rest;
  return { a: side === 'L' ? a0 : 180 - a0, vis: kind === 'hidden' ? 0 : 1, fist: kind === 'fist' ? 1 : 0 };
}

// flat numeric pose for tweening
function poseOf(name, faceOverride) {
  const P = POSES[name], F = faceOverride ? POSES[faceOverride] : P;
  const v = {};
  const put = (pre, o) => { for (const k in o) v[pre + k] = o[k]; };
  put('eL_', eyeState(F.eyes[0]));
  put('eR_', eyeState(F.eyes[1]));
  flatMouth(F.mouth).forEach((n, i) => (v['m' + i] = n));
  const br = BROWS[F.brows || 'none'];
  br[0].forEach((n, i) => (v['bl' + i] = n));
  br[1].forEach((n, i) => (v['br' + i] = n));
  put('aL_', armState(P.arms[0], 'L'));
  put('aR_', armState(P.arms[1], 'R'));
  // a reaction face also lifts the "spirit" parts a bit
  const S = faceOverride ? { ...P, w: (P.w + F.w) / 2, p: F.p, n: F.n, ts: F.ts } : P;
  Object.assign(v, { w: S.w, ws: S.ws, pl: S.p[0], pr: S.p[1], nl: S.n[0], nr: S.n[1], ta: P.ta, ts: S.ts });
  v.chin = P.chin || 0;
  v.glow = Math.max(P.glow || 1, faceOverride ? F.glow || 1 : 0);
  v.cool = P.cool || 0;
  v.tint = P.tint || 0;
  v.dust = P.dust ?? 1;
  v.cheek = (F.cheek || 1) * (faceOverride ? 1.2 : 1);
  return v;
}

// ---------------------------------------------------------------- CSS

// v6-perf: Лумі — стос шарів (HTML-div/SVG). Безперервні рухи (ширяння, дихання, крильця, антенки, китиця,
// світло, сяйво, світлячки) анімуються transform/opacity на HTML-рівні → компонуються на GPU без перемальовування SVG.
// Координати шарів — у просторі viewBox (-28 -4 456 456); відсотки рахуються від цього квадрата.
const VB = 456, VX = -28, VY = -4, FULL = [VX, VY, VB, VB];
const p4 = (n) => Math.round(n * 1e4) / 1e4;
const ORG = (x, y, b = FULL) => `${p4(((x - b[0]) / b[2]) * 100)}% ${p4(((y - b[1]) / b[3]) * 100)}%`;
const BC = ORG(BODY.cx, BODY.cy), BB = ORG(200, 344);
const BCpx = `${BODY.cx}px ${BODY.cy}px`;
// кейфрейми, що тепер крутяться на HTML-шарах: px (одиниці viewBox) → % від розміру шару
const CHAIN_KF = new Set(['lqFloat', 'lqTalkNod', 'lqSwayBody', 'lqHop', 'lqJump', 'lqTiltIn', 'lqTilt', 'lqJolt', 'lqSinkIn', 'lqSadSway',
  'lqPuff', 'lqPumpBody', 'lqDozeIn', 'lqDoze', 'lqRJump', 'lqRGiggle', 'lqRSpin', 'lqRShake', 'lqRNod', 'lqRLove']);
const kfToPct = (css) => css.replace(/@keyframes (\w+)\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g, (m, name) =>
  (CHAIN_KF.has(name) ? m.replace(/(-?[\d.]+)px/g, (_, n) => `${p4((n / VB) * 100)}%`) : m));
const CSS = kfToPct(`
.lq{position:relative;display:inline-block;flex:none;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;touch-action:manipulation;cursor:pointer;line-height:1;--wf:.15s;contain:layout style}
.lq .lqL{position:absolute;left:0;top:0;width:100%;height:100%;display:block;overflow:visible}
.lq svg *{transform-box:view-box}
.lq.lq-paused,.lq.lq-paused *{animation-play-state:paused!important}
.lq-float{transform-origin:${ORG(0, 0)};animation:lqFloat 3.6s ease-in-out infinite}
.lq-shadow{animation:lqShadow 3.6s ease-in-out infinite}
.lq-breath{transform-origin:${BB};animation:lqBreath 2.4s ease-in-out infinite}
.lq-act,.lq-react,.lq-talkg{transform-origin:${BB}}
.lq-flap{animation:lqFlap var(--wf) ease-in-out infinite alternate}
.lq-wR .lq-flap{animation-delay:calc(var(--wf) * -.35)}
.lq-sheen{animation:lqSheen 2.8s ease-in-out infinite alternate}
.lq-ant{animation:lqAnt 2.3s ease-in-out infinite alternate}
.lq-aR .lq-ant{animation-delay:-1.1s;animation-duration:2.6s}
.lq-bulb{animation:lqFlicker 1.9s ease-in-out infinite}
.lq-aR .lq-bulb{animation-delay:-.8s;animation-duration:2.3s}
.lq-ear{animation:lqEar 5.2s ease-in-out infinite}
.lq-pR .lq-ear{animation-delay:-2.1s}
.lq-tas{animation:lqPend 2.2s ease-in-out infinite alternate}
.lq-tstar{animation:lqTwinkle 2.4s ease-in-out infinite}
.lq-core{animation:lqCore 2.4s ease-in-out infinite}
.lq-glow{animation:lqGlow 2.4s ease-in-out infinite}
.lq-tint{mix-blend-mode:multiply}
.lq-look{transition:transform .35s cubic-bezier(.3,1.4,.5,1)}
.lq.lq-blink .lq-lid{animation:lqBlink .16s ease-in-out}
.lq-fly{animation:lqFly var(--t,4s) ease-in-out var(--d,0s) infinite}
.lq-flash{opacity:0;transform-origin:${BCpx}}
.lq.lq-flashing .lq-flash{animation:lqFlash .75s ease-out}
.lq-armact-l,.lq-armact-r{transform-origin:50% 50%}
@keyframes lqFloat{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-6px) rotate(-.8deg)}50%{transform:translateY(-10px) rotate(0)}80%{transform:translateY(-3px) rotate(.8deg)}}
@keyframes lqShadow{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.84);opacity:.65}}
@keyframes lqBreath{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,.985)}}
@keyframes lqFlap{0%{transform:rotate(7deg) scale(1,1)}100%{transform:rotate(-9deg) scale(.97,.74)}}
@keyframes lqFlapSlow{0%{transform:rotate(2deg)}100%{transform:rotate(-3deg) scale(1,.94)}}
@keyframes lqSheen{from{opacity:0}to{opacity:1}}
@keyframes lqAnt{0%{transform:rotate(-6deg)}100%{transform:rotate(7deg)}}
@keyframes lqFlicker{0%,100%{opacity:1;transform:scale(1)}20%{opacity:.7;transform:scale(.9)}28%{opacity:1;transform:scale(1.08)}55%{opacity:.82;transform:scale(.96)}70%{opacity:1;transform:scale(1.04)}}
@keyframes lqEar{0%,84%,100%{transform:rotate(0)}88%{transform:rotate(9deg)}92%{transform:rotate(-4deg)}96%{transform:rotate(3deg)}}
@keyframes lqPend{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}
@keyframes lqTwinkle{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.14) rotate(14deg)}}
@keyframes lqCore{0%,100%{transform:scale(.9);opacity:.72}50%{transform:scale(1.07);opacity:1}}
@keyframes lqGlow{0%,100%{transform:scale(.94);opacity:.75}50%{transform:scale(1.04);opacity:1}}
@keyframes lqBlink{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.06)}}
@keyframes lqFly{0%{transform:translate(0,0);opacity:.15}20%{transform:translate(calc(var(--dx)*.6),calc(var(--dy)*-.5));opacity:1}
  45%{transform:translate(var(--dx),calc(var(--dy)*.3));opacity:.45}65%{transform:translate(calc(var(--dx)*.2),var(--dy));opacity:1}
  85%{transform:translate(calc(var(--dx)*-.5),calc(var(--dy)*.4));opacity:.6}100%{transform:translate(0,0);opacity:.15}}
@keyframes lqFlash{0%{opacity:0;transform:scale(.6)}25%{opacity:1;transform:scale(1.05)}100%{opacity:0;transform:scale(1.25)}}

/* talking: nods while the mouth flaps */
.lq-talking .lq-talkg{animation:lqTalkNod .5s ease-in-out infinite alternate}
@keyframes lqTalkNod{0%{transform:rotate(-1.6deg) translateY(0)}50%{transform:rotate(.4deg) translateY(2.5px) scale(1.012,.988)}100%{transform:rotate(1.6deg) translateY(0)}}

/* emotion-driven rhythm of the spirit parts */
.lq-e-happy,.lq-e-cheer{--wf:.085s}
.lq-e-excited,.lq-e-surprised{--wf:.065s}
.lq-e-proud{--wf:.11s}
.lq-e-thinking{--wf:.22s}
.lq-e-sad,.lq-e-sleepy{--wf:1.4s}
.lq-e-sad .lq-flap,.lq-e-sleepy .lq-flap{animation-name:lqFlapSlow}
.lq-e-sad .lq-ant,.lq-e-sleepy .lq-ant{animation-duration:4.5s}
.lq-e-sad .lq-bulb,.lq-e-sleepy .lq-bulb{animation-duration:4.2s}
.lq-e-sad .lq-core,.lq-e-sleepy .lq-core,.lq-e-sad .lq-glow,.lq-e-sleepy .lq-glow{animation-duration:4.6s}
.lq-e-excited .lq-core,.lq-e-happy .lq-core,.lq-e-cheer .lq-core{animation-duration:1.1s}
.lq-e-excited .lq-ant,.lq-e-happy .lq-ant{animation-duration:.6s}
.lq-e-excited .lq-tas,.lq-e-happy .lq-tas,.lq-e-cheer .lq-tas{animation-duration:.55s}
.lq-e-sad .lq-tas{animation-duration:4s}

/* accessories */
.lq-acc{opacity:0;visibility:hidden;transition:opacity .3s,visibility 0s .3s}
.lq-acc.on{opacity:1;visibility:visible;transition:opacity .3s}
.lq-acc:not(.on) *{animation:none!important}
.on .lq-q{animation:lqPop .5s cubic-bezier(.3,1.7,.5,1) both,lqBob 1.8s ease-in-out .5s infinite alternate}
.on .lq-ex{animation:lqPop .45s cubic-bezier(.3,1.9,.5,1) both,lqWobble .5s ease-in-out .45s 3}
.on .lq-z{animation:lqZ 3.3s ease-in-out infinite both}
.on .lq-tear{animation:lqTear 2.4s ease-in infinite both}
.on .lq-crown{animation:lqCrownIn .7s cubic-bezier(.3,1.6,.5,1) both,lqCrownBob 2.4s ease-in-out .7s infinite alternate}
.lq-crown{transform-origin:0 0}
.on .lq-spk{animation:lqSpark 1.9s ease-in-out infinite both}
.on .lq-heart{animation:lqHeart 1.6s ease-in-out infinite both}
.on .lq-blinkline{animation:lqLines .45s ease-in-out infinite alternate both}
.on .lq-conf{animation:lqConf 3.4s linear infinite both}
.on .lq-raysr{animation:lqSpin 26s linear infinite}
@keyframes lqPop{0%{transform:scale(0) rotate(-20deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes lqBob{from{transform:translateY(0) rotate(-4deg)}to{transform:translateY(-9px) rotate(5deg)}}
@keyframes lqWobble{0%,100%{transform:rotate(0)}30%{transform:rotate(-12deg)}70%{transform:rotate(10deg)}}
@keyframes lqZ{0%{transform:translate(-22px,30px) scale(.3);opacity:0}25%{opacity:1}80%{opacity:1}100%{transform:translate(10px,-24px) scale(1.15);opacity:0}}
@keyframes lqTear{0%{transform:translate(0,-5px) scale(0);opacity:0}14%{transform:translate(0,0) scale(1);opacity:1}
  55%{transform:translate(-4px,26px) scale(1,1.1);opacity:1}82%{transform:translate(-8px,50px) scale(.9,1.05);opacity:.9}100%{transform:translate(-9px,60px) scale(.5);opacity:0}}
@keyframes lqCrownIn{0%{transform:translateY(-30px) scale(0) rotate(-30deg)}100%{transform:translateY(0) scale(1) rotate(0)}}
@keyframes lqCrownBob{from{transform:rotate(-5deg)}to{transform:rotate(5deg) translateY(-3px)}}
@keyframes lqSpark{0%,100%{transform:scale(.55) rotate(0);opacity:.45}50%{transform:scale(1.1) rotate(45deg);opacity:1}}
@keyframes lqHeart{0%,100%{transform:translateY(0) scale(1)}15%{transform:translateY(-3px) scale(1.18)}30%{transform:translateY(-5px) scale(1)}60%{transform:translateY(-8px) scale(1.06)}}
@keyframes lqLines{from{opacity:.25;transform:scale(.92)}to{opacity:1;transform:scale(1.04)}}
@keyframes lqConf{0%{transform:translateY(-32px) rotate(0);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateY(62px) rotate(300deg);opacity:0}}
@keyframes lqSpin{to{transform:rotate(360deg)}}

/* emotion actions */
.lq-e-hello .lq-act{animation:lqSwayBody 1.8s ease-in-out infinite alternate}
.lq-e-hello .lq-armact-r{animation:lqWave .36s ease-in-out infinite alternate}
.lq-e-happy .lq-act{animation:lqHop 1s ease-in-out infinite}
.lq-e-happy .lq-armact-l{animation:lqWiggleL .5s ease-in-out infinite alternate}
.lq-e-happy .lq-armact-r{animation:lqWiggleR .5s ease-in-out infinite alternate}
.lq-e-excited .lq-act{animation:lqJump .74s ease-in-out infinite}
.lq-e-excited .lq-armact-l{animation:lqWiggleL .37s ease-in-out infinite alternate}
.lq-e-excited .lq-armact-r{animation:lqWiggleR .37s ease-in-out infinite alternate}
.lq-e-thinking .lq-act{animation:lqTiltIn .5s ease-out both,lqTilt 3s ease-in-out .5s infinite alternate}
.lq-e-surprised .lq-act{animation:lqJolt .6s ease-out both}
.lq-e-surprised .lq-armact-l,.lq-e-surprised .lq-armact-r{animation:lqTremble .12s linear 6}
.lq-e-sad .lq-act{animation:lqSinkIn .9s ease-out both,lqSadSway 4.4s ease-in-out .9s infinite alternate}
.lq-e-sad .lq-float,.lq-e-sad .lq-shadow{animation-duration:5.4s}
.lq-e-proud .lq-act{animation:lqPuff 2.4s ease-in-out infinite}
.lq-e-cheer .lq-act{animation:lqPumpBody .7s ease-in-out infinite}
.lq-e-cheer .lq-armact-r{animation:lqPump .7s cubic-bezier(.5,0,.3,1) infinite}
.lq-e-sleepy .lq-act{animation:lqDozeIn 1s ease-out both,lqDoze 4.6s ease-in-out 1s infinite}
.lq-e-sleepy .lq-breath{animation-duration:4.6s}
.lq-e-sleepy .lq-float,.lq-e-sleepy .lq-shadow{animation-duration:5.6s}
@keyframes lqSwayBody{from{transform:rotate(-2.2deg)}to{transform:rotate(2.6deg)}}
@keyframes lqWave{from{transform:rotate(-24deg)}to{transform:rotate(18deg)}}
@keyframes lqHop{0%,100%{transform:translateY(0) scale(1)}12%{transform:translateY(0) scale(1.06,.93)}36%{transform:translateY(-26px) scale(.96,1.05)}56%{transform:translateY(0) scale(1.07,.92)}70%{transform:translateY(0) scale(.98,1.02)}82%{transform:translateY(0) scale(1)}}
@keyframes lqJump{0%,100%{transform:translateY(0) scale(1)}10%{transform:translateY(0) scale(1.08,.9)}40%{transform:translateY(-40px) scale(.94,1.07) rotate(-3deg)}62%{transform:translateY(0) scale(1.09,.9)}78%{transform:translateY(0) scale(.98,1.02)}}
@keyframes lqWiggleL{from{transform:rotate(-16deg)}to{transform:rotate(14deg)}}
@keyframes lqWiggleR{from{transform:rotate(16deg)}to{transform:rotate(-14deg)}}
@keyframes lqTiltIn{from{transform:rotate(0)}to{transform:rotate(-6deg)}}
@keyframes lqTilt{from{transform:rotate(-6deg)}to{transform:rotate(-9deg) translateX(-3px)}}
@keyframes lqJolt{0%{transform:translateY(0) scale(1)}15%{transform:translateY(0) scale(1.07,.92)}40%{transform:translateY(-24px) scale(.93,1.08)}65%{transform:translateY(0) scale(1.05,.95)}82%{transform:translateY(0) scale(.98,1.02)}100%{transform:translateY(0) scale(1)}}
@keyframes lqTremble{0%,100%{transform:rotate(0)}25%{transform:rotate(5deg)}75%{transform:rotate(-5deg)}}
@keyframes lqSinkIn{from{transform:translateY(0) scale(1)}to{transform:translateY(16px) scale(1.03,.96)}}
@keyframes lqSadSway{from{transform:translateY(16px) scale(1.03,.96) rotate(-1.6deg)}to{transform:translateY(18px) scale(1.035,.955) rotate(1.6deg)}}
@keyframes lqPuff{0%,100%{transform:scale(1)}50%{transform:scale(1.035,1.05) translateY(-3px)}}
@keyframes lqPumpBody{0%,100%{transform:translateY(0)}35%{transform:translateY(-7px)}}
@keyframes lqPump{0%,100%{transform:rotate(0)}35%{transform:rotate(16deg)}65%{transform:rotate(-26deg)}}
@keyframes lqDozeIn{from{transform:translateY(0)}to{transform:translateY(8px)}}
@keyframes lqDoze{0%,100%{transform:translateY(8px) rotate(0)}40%{transform:translateY(10px) rotate(3deg)}55%{transform:translateY(11px) rotate(3.5deg)}}

/* reactions */
.lq-r-jump .lq-react,.lq-r-tap .lq-react{animation:lqRJump .6s cubic-bezier(.3,.7,.4,1)}
.lq-r-giggle .lq-react{animation:lqRGiggle .6s ease-in-out}
.lq-r-spin .lq-react{transform-origin:${BC};animation:lqRSpin .9s cubic-bezier(.5,0,.3,1)}
.lq-r-shake .lq-react{animation:lqRShake .5s ease-in-out}
.lq-r-nod .lq-react{animation:lqRNod .7s ease-in-out}
.lq-r-love .lq-react,.lq-r-wow .lq-react{animation:lqRLove .7s cubic-bezier(.3,1.6,.5,1)}
.lq-r-tap,.lq-r-jump,.lq-r-spin,.lq-r-love,.lq-r-wow,.lq-r-giggle{--wf:.06s}
@keyframes lqRJump{0%{transform:translateY(0) scale(1)}15%{transform:translateY(0) scale(1.1,.88)}45%{transform:translateY(-34px) scale(.92,1.08) rotate(4deg)}72%{transform:translateY(0) scale(1.08,.92)}86%{transform:scale(.98,1.02)}100%{transform:translateY(0) scale(1)}}
@keyframes lqRGiggle{0%,100%{transform:rotate(0)}15%{transform:rotate(-6deg) scale(1.03,.97)}35%{transform:rotate(6deg)}55%{transform:rotate(-5deg) scale(1.03,.97)}75%{transform:rotate(4deg)}}
@keyframes lqRSpin{0%{transform:translateY(0) rotate(0)}18%{transform:translateY(10px) scale(1.08,.88)}50%{transform:translateY(-50px) rotate(200deg) scale(.95)}82%{transform:translateY(0) rotate(360deg) scale(1.06,.94)}100%{transform:translateY(0) rotate(360deg)}}
@keyframes lqRShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px) rotate(-4deg)}40%{transform:translateX(9px) rotate(4deg)}60%{transform:translateX(-6px) rotate(-2deg)}80%{transform:translateX(4px)}}
@keyframes lqRNod{0%,100%{transform:rotate(0)}30%{transform:translateY(6px) scale(1.04,.95)}60%{transform:translateY(-4px) scale(.98,1.03)}}
@keyframes lqRLove{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}

/* speech bubble */
.lq-bubble{position:absolute;z-index:5;left:50%;bottom:95%;transform:translateX(-50%) scale(.6);transform-origin:50% 100%;
  width:max-content;max-width:min(240px,86vw);padding:9px 14px;border-radius:18px;background:#fff;color:#3a2448;
  border:2.5px solid ${C.outline};box-shadow:0 4px 0 rgba(58,36,64,.16),0 8px 22px rgba(91,52,115,.18);
  font:700 var(--lq-fs,15px)/1.3 Inter,'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif;text-align:center;
  opacity:0;pointer-events:none;transition:opacity .2s,transform .35s cubic-bezier(.3,1.6,.5,1);white-space:normal;overflow-wrap:break-word}
.lq-bubble::after{content:'';position:absolute;left:50%;bottom:-8px;width:13px;height:13px;margin-left:-7px;background:#fff;
  border-right:2.5px solid ${C.outline};border-bottom:2.5px solid ${C.outline};transform:rotate(45deg);border-bottom-right-radius:3px}
.lq-bubble.show{opacity:1;transform:translateX(-50%) scale(1)}
.lq-bubble-right .lq-bubble{left:80%;bottom:auto;top:6%;transform:scale(.6);transform-origin:0 50%}
.lq-bubble-right .lq-bubble.show{transform:scale(1)}
.lq-bubble-right .lq-bubble::after{left:-1px;bottom:auto;top:50%;margin:-7px 0 0 -7px;transform:rotate(135deg)}
.lq-bubble-left .lq-bubble{left:auto;right:80%;bottom:auto;top:6%;transform:scale(.6);transform-origin:100% 50%}
.lq-bubble-left .lq-bubble.show{transform:scale(1)}
.lq-bubble-left .lq-bubble::after{left:auto;right:-8px;bottom:auto;top:50%;margin-top:-7px;transform:rotate(-45deg)}
.lq-bubble .lq-caret{display:inline-block;width:2px;height:1em;margin-left:1px;vertical-align:-2px;background:currentColor;animation:lqCaret .5s steps(1) infinite}
@keyframes lqCaret{50%{opacity:0}}
/* v6-perf: друк без перекладки — увесь текст одразу в потоці (розмір бульбашки сталий), ще не надруковані
   символи приховані visibility; курсор — тінь останнього символу (не впливає на layout і перенос рядків) */
.lq-bubble .lq-h{visibility:hidden}
.lq-bubble .lq-cur{box-shadow:3px 0 0 -1px currentColor;animation:lqCaretS .5s steps(1) infinite}
@keyframes lqCaretS{50%{box-shadow:3px 0 0 -1px transparent}}

@media (prefers-reduced-motion: reduce){
  .lq *,.lq{animation:none!important}
  .lq-fly{opacity:.8}
  .lq-bubble{transition:opacity .15s}
}
`);

function ensureStyle() {
  if (document.getElementById('lumi-style-v6')) return;
  document.getElementById('lumi-style')?.remove();
  const s = document.createElement('style');
  s.id = 'lumi-style-v6';
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ---------------------------------------------------------------- SVG markup

let instances = 0;
const O = C.outline;

const sparkleInner = (x, y, r, col) => `<g transform="translate(${f(x)} ${f(y)})">
    <polygon points="${starPts(0, 0, r, r * 0.3, 0, 4)}" fill="${col}" stroke="${O}" stroke-width="${f(Math.max(2.2, r * 0.15) * 2)}" stroke-linejoin="round" paint-order="stroke"/>
    <circle r="${f(r * 0.18)}" fill="#fff"/></g>`;
function sparkleSVG(x, y, r, col, delay = 0, dur = 1.9) {
  return `<g transform="translate(${f(x)} ${f(y)})"><g class="lq-spk" style="animation-delay:${f(delay)}s;animation-duration:${f(dur)}s">
    <polygon points="${starPts(0, 0, r, r * 0.3, 0, 4)}" fill="${col}" stroke="${O}" stroke-width="${f(Math.max(2.2, r * 0.15) * 2)}" stroke-linejoin="round" paint-order="stroke"/>
    <circle r="${f(r * 0.18)}" fill="#fff"/></g></g>`;
}
function heartSVG(x, y, r, col, rot, delay) {
  const p = [];
  for (let i = 0; i < 48; i++) {
    const t = (2 * Math.PI * i) / 48;
    const hx = 16 * Math.sin(t) ** 3;
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    p.push(`${f((hx * r) / 16)},${f((hy * r) / 16)}`);
  }
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})"><g class="lq-heart" style="animation-delay:${delay}s">
    <polygon points="${p.join(' ')}" fill="${col}" stroke="${O}" stroke-width="6" stroke-linejoin="round" paint-order="stroke"/>
    <ellipse cx="${f(-r * 0.4)}" cy="${f(-r * 0.35)}" rx="${f(r * 0.22)}" ry="${f(r * 0.15)}" fill="#fff" opacity=".8"/></g></g>`;
}
function linesSVG(cx, cy, radius, a0, a1, count, len, cls = 'lq-blinkline') {
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / Math.max(1, count - 1));
    s += `<line x1="${f(cx + radius * Math.cos(a))}" y1="${f(cy + radius * Math.sin(a))}" x2="${f(cx + (radius + len) * Math.cos(a))}" y2="${f(cy + (radius + len) * Math.sin(a))}"/>`;
  }
  return `<g style="transform-origin:${cx}px ${cy}px" class="${cls}" stroke="${O}" stroke-width="4.8" stroke-linecap="round">${s}</g>`;
}
function symbolSVG(text, x, y, size, col, angle, cls, delay = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${angle})"><g class="${cls}"${delay ? ` style="animation-delay:${delay}s"` : ''}>
    <text x="0" y="${f(size * 0.36)}" text-anchor="middle" font-family="Poppins,'Baloo 2','Nunito','Arial Rounded MT Bold',Inter,system-ui,sans-serif"
      font-weight="800" font-size="${size}" fill="${col}" stroke="${O}" stroke-width="${f(size * 0.17)}" stroke-linejoin="round" paint-order="stroke">${text}</text></g></g>`;
}

// fireflies: [x, y, r, dx, dy, dur, delay]
const FLY_BACK = [
  [40, 196, 5, 16, -22, 4.2, 0], [366, 168, 4.5, -14, -18, 3.8, 1.3], [2, 330, 3.6, 12, -16, 3.4, 0.6],
  [402, 318, 4.2, -14, -20, 4.6, 2.1], [96, 52, 3.6, 12, 14, 3.6, 2.6], [316, 30, 3.2, -10, 14, 3.2, 0.4],
];
const FLY_FRONT = [
  [66, 392, 4.6, 16, -18, 4.4, 1.7], [340, 404, 5, -14, -20, 3.9, 0.9], [416, 244, 3.4, -10, 16, 3.1, 2.0], [-12, 262, 3.4, 12, 14, 3.5, 0.2],
];
// v6-perf: шари. box = [x, y, w, h] у координатах viewBox; par — box батьківського шару.
const boxCss = (b, par = FULL) => (b === par ? '' : `left:${p4(((b[0] - par[0]) / par[2]) * 100)}%;top:${p4(((b[1] - par[1]) / par[3]) * 100)}%;width:${p4((b[2] / par[2]) * 100)}%;height:${p4((b[3] / par[3]) * 100)}%;`);
const svgL = (cls, b, inner, par = FULL, css = '', attrs = '') =>
  `<svg class="lqL ${cls}" viewBox="${b.join(' ')}" style="${boxCss(b, par)}${css}" aria-hidden="true" ${attrs}>${inner}</svg>`;
const divL = (cls, b, inner, par = FULL, css = '', attrs = '') => `<div class="lqL ${cls}" style="${boxCss(b, par)}${css}" ${attrs}>${inner}</div>`;

// світлячок — окремий крихітний SVG, політ анімується transform/opacity самого елемента (композитор)
function flySVG(list, p) {
  return list.map(([x, y, r, dx, dy, t, d]) => {
    const R = r * 3.4, b = [f(x - R), f(y - R), f(2 * R), f(2 * R)];
    return svgL('lq-fly', b, `<circle cx="${x}" cy="${y}" r="${f(R)}" fill="url(#${p}fly)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffe27a"/><circle cx="${x}" cy="${y}" r="${f(r * 0.45)}" fill="#fffbe8"/>`,
      FULL, `--dx:${p4((dx / (2 * R)) * 100)}%;--dy:${p4((dy / (2 * R)) * 100)}%;--t:${t}s;--d:-${d}s`);
  }).join('');
}

// old 512-space accessory coordinates → our space
const P = (x, y) => [f(x * 0.89 - 28), f(y * 0.89 - 4)];

function buildSVG(p) {
  const [cx, cy, rx, ry] = [BODY.cx, BODY.cy, BODY.rx, BODY.ry];
  const ellipse = `cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"`;
  const mirror = (side, inner) => (side === 'R' ? `<g transform="translate(400 0) scale(-1 1)">${inner}</g>` : inner);

  // крило: 3 SVG (основа / перламутровий відблиск з opacity-анімацією / прожилки) у HTML-обгортках
  const WB = [-4, 150, 150, 165], WO = ORG(WING_PIV[0], WING_PIV[1], WB);
  const wing = (side) => `<div class="lqL lq-w${side}"${side === 'R' ? ' style="transform:scaleX(-1)"' : ''}>${
    divL('', WB, divL('lq-flap', WB,
      svgL('', WB, `<g stroke="${O}" stroke-width="3.6">
        <ellipse cx="72" cy="206" rx="64" ry="34" transform="rotate(-28 72 206)" fill="url(#${p}wingA)"/>
        <ellipse cx="84" cy="276" rx="42" ry="22" transform="rotate(22 84 276)" fill="url(#${p}wingA)"/>
      </g>`, WB) +
      svgL('lq-sheen', WB, `<ellipse cx="72" cy="206" rx="62" ry="32" transform="rotate(-28 72 206)" fill="url(#${p}wingB)"/>
        <ellipse cx="84" cy="276" rx="40" ry="20" transform="rotate(22 84 276)" fill="url(#${p}wingB)"/>`, WB) +
      svgL('', WB, `<path d="M118 232Q80 214 40 182M100 222Q78 200 70 180M118 262Q90 276 58 284" stroke="#fff" stroke-width="3" fill="none" opacity=".9" stroke-linecap="round"/>
      <path d="M52 190Q53 195 58 196Q53 197 52 202Q51 197 46 196Q51 195 52 190Z" fill="#fff"/>
      <ellipse cx="48" cy="200" rx="8" ry="4" transform="rotate(-28 48 200)" fill="#fff" opacity=".6"/>`, WB),
      WB, `transform-origin:${WO}`), FULL, `transform-origin:${WO}`, `data-wing="${side}"`)}</div>`;

  const AB = [114, 38, 80, 92], AO = ORG(ANT_PIV[0], ANT_PIV[1], AB), BLB = [114, 38, 60, 60];
  const antenna = (side) => `<div class="lqL lq-a${side}"${side === 'R' ? ' style="transform:scaleX(-1)"' : ''}>${
    divL('', AB, divL('lq-ant', AB,
      svgL('', AB, `<path d="M186 124C178 96 164 78 146 70" fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round"/>`, AB) +
      svgL('lq-bulb', BLB, `<g transform="translate(144 68)">
        <circle data-bulbglow="" r="26" fill="url(#${p}bulbGlow)"/>
        <circle r="10" fill="url(#${p}bulb)" stroke="${O}" stroke-width="4"/>
        <circle cx="-3" cy="-3.5" r="3" fill="#fff"/></g>`, AB, `transform-origin:${ORG(144, 68, BLB)}`),
      AB, `transform-origin:${AO}`), FULL, `transform-origin:${AO}`, `data-ant="${side}"`)}</div>`;

  const PETAL = 'M120 172C84 170 58 142 56 104C92 106 122 132 132 160Z';
  const PB = [50, 98, 88, 80], PO = ORG(PETAL_PIV[0], PETAL_PIV[1], PB);
  const petal = (side) => `<div class="lqL lq-p${side}"${side === 'R' ? ' style="transform:scaleX(-1)"' : ''}>${
    divL('', PB, svgL('lq-ear', PB, `<path d="${PETAL}" fill="url(#${p}petal)"/>
      <g clip-path="url(#${p}petalClip)">
        <path d="${PETAL}" fill="none" stroke="url(#${p}petalHi)" stroke-width="16"/>
        <path d="M120 166Q90 140 64 112" stroke="#fff" stroke-width="3" fill="none" opacity=".85" stroke-linecap="round"/>
      </g>
      <path d="${PETAL}" fill="none" stroke="${O}" stroke-width="4.5" stroke-linejoin="round"/>`, PB, `transform-origin:${PO}`),
    FULL, `transform-origin:${PO}`, `data-petal="${side}"`)}</div>`;

  // рука: обгортки навколо плеча (box 120×120, центр = плече): поворот пози, видимість, емоційна дія
  const ARB = [-60, -60, 120, 120];
  const arm = (side) => {
    const pv = side === 'L' ? ARM_L : ARM_R, b = [pv[0] - 60, pv[1] - 60, 120, 120];
    return divL('', b, divL('', b, divL(`lq-armact-${side === 'L' ? 'l' : 'r'}`, b, svgL('', ARB, `
      <line x1="0" y1="0" x2="30" y2="0" stroke="${O}" stroke-width="27" stroke-linecap="round"/>
      <line x1="0" y1="0" x2="30" y2="0" stroke="#fcf4f2" stroke-width="17" stroke-linecap="round"/>
      <circle data-paw="" cx="33" cy="0" r="13" fill="url(#${p}paw)" stroke="${O}" stroke-width="4.5"/>
      <ellipse cx="35" cy="-5" rx="4.5" ry="3" fill="#fff" opacity=".9"/>`, ARB), b), b, '', 'data-armvis=""'), FULL, '', `data-arm="${side}"`);
  };

  const STAR_D = softStarD(0, 0, 14, 6.6, 5, 0.2);
  const TB = [164, 340, 72, 92], TO = ORG(TAS_PIV[0], TAS_PIV[1], TB), SB = [166, 358, 68, 68], SO = ORG(200, 392, SB);
  const tassel = divL('', TB, divL('lq-tas', TB,
    svgL('', TB, `<line x1="200" y1="348" x2="200" y2="380" stroke="${O}" stroke-width="5" stroke-linecap="round"/>`, TB) +
    divL('', SB, svgL('lq-tstar', SB, `<g transform="translate(200 392)">
        <circle r="30" fill="url(#${p}bulbGlow)" opacity=".85"/>
        <path d="${STAR_D}" fill="url(#${p}gold)" stroke="${O}" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/>
        <path d="M-2 -6Q-1.4 -2.4 2 -2Q-1.4 -1.6 -2 2Q-2.6 -1.6 -6 -2Q-2.6 -2.4 -2 -6Z" fill="#fff"/></g>`, SB, `transform-origin:${SO}`),
    TB, `transform-origin:${SO}`, 'data-tstar=""'), TB, `transform-origin:${TO}`), FULL, `transform-origin:${TO}`, 'data-tassel=""');

  const CAP_B = 'M164 328L236 328L228 348Q200 358 172 348Z';
  const CAP_T = 'M158 142L242 142L232 122Q200 110 168 122Z';
  const cap = (d, trimY) => `<path d="${d}" fill="url(#${p}cap)" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M${trimY[0]} ${trimY[1]}L${trimY[2]} ${trimY[1]}" stroke="#ffd25e" stroke-width="4" stroke-linecap="round"/>`;

  const eye = (side) => {
    const m = side === 'L' ? 1 : -1;
    return `<g transform="translate(${side === 'L' ? EYE_L : EYE_R})"><g class="lq-look"><g class="lq-lid">
    <g data-solid="${side}">
      <ellipse rx="24" ry="29" fill="${C.eyeDark}"/>
      <ellipse cx="0" cy="3" rx="20" ry="23.8" fill="url(#${p}iris)"/>
      <ellipse data-pup="${side}" cx="0" cy="0.6" rx="11" ry="14.5" fill="#120a24"/>
      <ellipse cx="0" cy="17" rx="12" ry="4.9" fill="#e3d6ff" opacity=".85"/>
      <ellipse data-hl="${side}" cx="7.2" cy="-10.4" rx="8.6" ry="8.7" fill="#fff"/>
      <polygon data-spk="${side}" points="${starPts(7, -10, 13, 4, 0, 4)}" fill="#fff" opacity="0"/>
      <circle cx="-8.6" cy="8.7" r="3.4" fill="#fff"/>
      <circle cx="10" cy="6.4" r="1.7" fill="#fff" opacity=".8"/>
      <path data-water="${side}" d="${arcD(0, 2, 19, 23, 35, 145)}" stroke="#e8f3ff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity="0"/>
      <path d="M${4.8 * m} -28.4Q${-16.8 * m} -29.6 ${-28.1 * m} -20.9" fill="none" stroke="${O}" stroke-width="4" stroke-linecap="round" opacity=".9"/>
    </g>
    <path data-happy="${side}" d="${arcD(0, 9, 20, 19, 200, 340)}" stroke="${C.eyeDark}" stroke-width="7.5" fill="none" stroke-linecap="round" opacity="0"/>
    <path data-content="${side}" d="${arcD(0, 5, 20, 11, 195, 345)}" stroke="${C.eyeDark}" stroke-width="7.5" fill="none" stroke-linecap="round" opacity="0"/>
    <g data-star="${side}" opacity="0">
      <path d="${softStarD(0, 0, 24, 11, 5, 0.18)}" fill="url(#${p}gold)" stroke="${C.eyeDark}" stroke-width="5" stroke-linejoin="round"/>
      <ellipse cx="-6" cy="-6" rx="5" ry="3.4" fill="#fff" transform="rotate(-30 -6 -6)"/><circle cx="6" cy="4" r="2.2" fill="#fff" opacity=".9"/>
    </g>
    <g data-sleep="${side}" opacity="0" stroke="${C.eyeDark}" fill="none" stroke-linecap="round">
      <path d="${arcD(0, -2, 19, 10, 20, 160)}" stroke-width="7"/>
      ${[40, 90, 140].map((a) => `<line x1="${f(19 * Math.cos(rad(a)))}" y1="${f(-2 + 10 * Math.sin(rad(a)))}" x2="${f(25 * Math.cos(rad(a)))}" y2="${f(-2 + 16 * Math.sin(rad(a)))}" stroke-width="3.4"/>`).join('')}
    </g></g></g></g>`;
  };

  // confetti for "proud"
  const confCols = ['#ff788c', '#6eb4ff', '#ffce50', '#8cdca0', '#be96ff'];
  const spots = [[60, 70], [120, 40], [440, 60], [392, 30], [470, 160], [36, 200], [90, 150], [430, 230],
    [480, 300], [30, 300], [70, 400], [450, 380], [170, 30], [340, 20], [20, 120], [500, 220]];
  const conf = spots.map(([x0, y0], i) => {
    const [x, y] = P(x0, y0);
    const col = confCols[i % 5], d = (i * 0.37) % 3.4, dur = 2.8 + (i % 4) * 0.35;
    const shape = i % 3 === 2 ? `<circle r="4.5" fill="${col}"/>` : `<rect x="-3" y="-6" width="6" height="12" rx="2" fill="${col}" transform="rotate(${i * 47})"/>`;
    return `<g transform="translate(${x} ${y})"><g class="lq-conf" style="animation-delay:-${f(d)}s;animation-duration:${dur}s">
      <g stroke="${O}" stroke-width="4" paint-order="stroke">${shape}</g></g></g>`;
  }).join('');

  const rays = Array.from({ length: 12 }, (_, i) => `<path d="M${cx} ${cy}L${f(cx + 280 * Math.cos(rad(i * 30 - 6)))} ${f(cy + 280 * Math.sin(rad(i * 30 - 6)))}L${f(cx + 280 * Math.cos(rad(i * 30 + 6)))} ${f(cy + 280 * Math.sin(rad(i * 30 + 6)))}Z"/>`).join('');

  const crown = `<path d="M-26 0L-30 -26L-14 -12L0 -32L14 -12L30 -26L26 0Z" fill="url(#${p}gold)" stroke="${O}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M-25 -3H25" stroke="#fff3c0" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>
    <circle cx="0" cy="-34" r="4.5" fill="#ff9ec4" stroke="${O}" stroke-width="3"/><circle cx="-30" cy="-28" r="3.6" fill="#a9e7ff" stroke="${O}" stroke-width="3"/><circle cx="30" cy="-28" r="3.6" fill="#a9e7ff" stroke="${O}" stroke-width="3"/>
    <circle cx="0" cy="-9" r="4" fill="#ff7896" stroke="${O}" stroke-width="2.5"/>`;

  const spk = (list) => list.map(([x, y, r, col], i) => {
    const [sx, sy] = P(x, y), rr = r * 0.89, h = f(rr * 1.35 + 5), b = [f(sx - h), f(sy - h), f(2 * h), f(2 * h)];
    return svgL('lq-spk', b, sparkleInner(sx, sy, rr, col), FULL, `transform-origin:50% 50%;animation-delay:${f((i * 0.5) % 1.9)}s;animation-duration:1.9s`);
  }).join('');

  const GB = [-16, 30, 432, 412], SHB = [114, 414, 172, 28], KB = [94, 148, 212, 192], FB = [78, 126, 244, 220];
  const KO = ORG(200, 244, KB);
  return `<svg class="lqL" viewBox="-28 -4 456 456" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
  <radialGradient id="${p}body" cx=".42" cy=".36" r=".72"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#fffaf2"/><stop offset=".82" stop-color="#f9eef0"/><stop offset="1" stop-color="#eee2f6"/></radialGradient>
  <radialGradient id="${p}coreW" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6cf"/><stop offset=".32" stop-color="#ffdc9c" stop-opacity=".95"/><stop offset=".66" stop-color="#ffc39a" stop-opacity=".45"/><stop offset="1" stop-color="#ffb8a0" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}coreC" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f2f5ff"/><stop offset=".4" stop-color="#c9d4ff" stop-opacity=".8"/><stop offset="1" stop-color="#b4c0ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}auraW"><stop offset="0" stop-color="${C.glow}" stop-opacity=".95"/><stop offset=".45" stop-color="${C.glow}" stop-opacity=".5"/><stop offset=".75" stop-color="#ffd0e4" stop-opacity=".16"/><stop offset="1" stop-color="#ffd0e4" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}auraC"><stop offset="0" stop-color="${C.glowCool}" stop-opacity=".9"/><stop offset=".45" stop-color="${C.glowCool}" stop-opacity=".45"/><stop offset="1" stop-color="${C.glowCool}" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}flash"><stop offset="0" stop-color="#fffbe6"/><stop offset=".45" stop-color="#ffe7a8" stop-opacity=".8"/><stop offset="1" stop-color="#ffd59a" stop-opacity="0"/></radialGradient>
  <linearGradient id="${p}rim" gradientUnits="userSpaceOnUse" x1="110" y1="150" x2="300" y2="340"><stop offset=".45" stop-color="#e2d4ff" stop-opacity="0"/><stop offset=".76" stop-color="#d8c4ff" stop-opacity=".85"/><stop offset="1" stop-color="#ffbfdc" stop-opacity="1"/></linearGradient>
  <linearGradient id="${p}rimTop" gradientUnits="userSpaceOnUse" x1="90" y1="140" x2="200" y2="250"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".5" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
  <linearGradient id="${p}wingA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".92"/><stop offset=".3" stop-color="#cff4ff" stop-opacity=".66"/><stop offset=".55" stop-color="#e4d4ff" stop-opacity=".58"/><stop offset=".8" stop-color="#ffd2ea" stop-opacity=".6"/><stop offset="1" stop-color="#fff0c4" stop-opacity=".7"/></linearGradient>
  <linearGradient id="${p}wingB" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe4f3" stop-opacity=".7"/><stop offset=".4" stop-color="#fff4c8" stop-opacity=".5"/><stop offset=".7" stop-color="#c8f1ff" stop-opacity=".55"/><stop offset="1" stop-color="#dccfff" stop-opacity=".65"/></linearGradient>
  <radialGradient id="${p}bulb" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#fff2a6"/><stop offset="1" stop-color="#ffcf4a"/></radialGradient>
  <radialGradient id="${p}bulbGlow"><stop offset="0" stop-color="#fff6b8" stop-opacity="1"/><stop offset=".4" stop-color="#ffe98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffe07a" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}fly"><stop offset="0" stop-color="#fff3a0" stop-opacity=".9"/><stop offset=".45" stop-color="#ffe680" stop-opacity=".35"/><stop offset="1" stop-color="#ffe680" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}petal" cx=".7" cy=".7" r=".85"><stop offset="0" stop-color="#fff2f8"/><stop offset=".6" stop-color="#ffc8df"/><stop offset="1" stop-color="#f4a2c8"/></radialGradient>
  <linearGradient id="${p}petalHi" x1="1" y1="1" x2=".25" y2=".2"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <clipPath id="${p}petalClip"><path d="${PETAL}"/></clipPath>
  <radialGradient id="${p}gold" cx=".4" cy=".3" r=".75"><stop offset="0" stop-color="#fffbe0"/><stop offset=".45" stop-color="#ffd84d"/><stop offset="1" stop-color="#f5a524"/></radialGradient>
  <radialGradient id="${p}cap" cx=".35" cy=".2" r=".85"><stop offset="0" stop-color="#8fe9da"/><stop offset=".5" stop-color="#3fb3a6"/><stop offset="1" stop-color="#1d727a"/></radialGradient>
  <radialGradient id="${p}paw" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#fdf1ee"/><stop offset="1" stop-color="#f1dcec"/></radialGradient>
  <linearGradient id="${p}iris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1350"/><stop offset=".55" stop-color="#7c4fe0"/><stop offset="1" stop-color="#e3d6ff"/></linearGradient>
  <radialGradient id="${p}cheek"><stop offset="0" stop-color="${C.cheek}" stop-opacity=".75"/><stop offset=".6" stop-color="${C.cheek}" stop-opacity=".38"/><stop offset="1" stop-color="${C.cheek}" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}shadow"><stop offset="0" stop-color="#4a2c66" stop-opacity=".3"/><stop offset=".6" stop-color="#4a2c66" stop-opacity=".12"/><stop offset="1" stop-color="#4a2c66" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}ray" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="250"><stop offset=".25" stop-color="#ffe08a" stop-opacity=".6"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient>
  <linearGradient id="${p}tear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8f0ff"/><stop offset="1" stop-color="#6fb4ff"/></linearGradient>
  <clipPath id="${p}clip"><ellipse ${ellipse}/></clipPath>
  <clipPath id="${p}mclip"><path data-mclip=""/></clipPath>
</defs>
<g class="lq-acc" data-acc="rays"><g class="lq-raysr" style="transform-origin:${BCpx}" fill="url(#${p}ray)">${rays}</g></g>
</svg>
${svgL('lq-glow', GB, `<ellipse data-glow="w" cx="${cx}" cy="${cy}" rx="214" ry="204" fill="url(#${p}auraW)"/>
  <ellipse data-glow="c" cx="${cx}" cy="${cy}" rx="214" ry="204" fill="url(#${p}auraC)" opacity="0"/>`, FULL, `transform-origin:${ORG(cx, cy, GB)}`)}
<div class="lqL" data-dust="">${flySVG(FLY_BACK, p)}</div>
${svgL('lq-back', FULL, `<g class="lq-acc" data-acc="confetti">${conf}</g>`)}
<div class="lqL lq-acc" data-acc="sparkMany">${spk([[62, 120, 20, '#ffd65a'], [452, 116, 22, '#ffa0be'], [40, 330, 13, '#a0c8ff'], [476, 320, 15, '#ffd65a'],
    [150, 40, 12, '#bea0ff'], [400, 24, 14, '#a0e6be'], [86, 450, 11, '#ffa0be'], [440, 456, 12, '#bea0ff']])}</div>
<div class="lqL lq-acc" data-acc="sparkHello">${spk([[48, 150, 16, '#ffd65a'], [470, 120, 10, '#bea0ff'], [52, 430, 10, '#ffa0be'], [470, 420, 11, '#a0c8ff']])}</div>
<div class="lqL lq-acc" data-acc="sparkHappy">${spk([[50, 140, 16, '#ffd65a'], [474, 300, 12, '#bea0ff'], [56, 440, 10, '#ffa0be']])}</div>
<div class="lqL lq-acc" data-acc="sparkCheer">${spk([[50, 150, 16, '#ffd65a'], [100, 60, 10, '#a0e6be'], [56, 440, 10, '#ffa0be'], [474, 430, 12, '#ffd65a']])}</div>
${svgL('', FULL, `<g class="lq-acc" data-acc="hearts">${heartSVG(398, 150, 19, '#ff7896', 14, 0)}${heartSVG(8, 200, 13, '#ffa0be', -16, 0.5)}${heartSVG(380, 330, 11, '#ffb3cc', 10, 0.9)}</g>`)}
${svgL('lq-shadow', SHB, `<ellipse cx="200" cy="428" rx="84" ry="11" fill="url(#${p}shadow)"/>`, FULL, `transform-origin:${ORG(200, 428, SHB)}`)}
<div class="lqL lq-float"><div class="lqL lq-act"><div class="lqL lq-react"><div class="lqL lq-talkg"><div class="lqL lq-breath">
  ${wing('L')}${wing('R')}
  ${antenna('L')}${antenna('R')}
  ${petal('L')}${petal('R')}
  ${arm('L')}${arm('R')}
  ${tassel}
  ${svgL('', FULL, `
  ${cap(CAP_B, [172, 331, 228])}
  <ellipse ${ellipse} fill="url(#${p}body)"/>
  <g clip-path="url(#${p}clip)">
    <g opacity=".45" fill="none" stroke="#e8cdbf" stroke-width="3">
      <ellipse cx="${cx}" cy="${cy}" rx="64" ry="112"/><ellipse cx="${cx}" cy="${cy}" rx="22" ry="112" opacity=".7"/><ellipse cx="${cx}" cy="${cy}" rx="100" ry="112" opacity=".7"/>
    </g>
  </g>`)}
  ${divL('', KB, svgL('lq-core', KB, `<ellipse cx="200" cy="244" rx="104" ry="94" fill="url(#${p}coreW)"/>`, KB, `transform-origin:${KO}`), FULL, `transform-origin:${KO}`, 'data-core="w"')}
  ${divL('', KB, svgL('lq-core', KB, `<ellipse cx="200" cy="244" rx="100" ry="90" fill="url(#${p}coreC)"/>`, KB, `transform-origin:${KO}`), FULL, `transform-origin:${KO};opacity:0`, 'data-core="c"')}
  ${svgL('', FB, `<g clip-path="url(#${p}clip)"><ellipse class="lq-flash" cx="200" cy="240" rx="120" ry="110" fill="url(#${p}flash)"/></g>`)}
  ${svgL('lq-tint', FB, `<g clip-path="url(#${p}clip)"><rect data-tint="" x="70" y="120" width="260" height="240" fill="#7b88d8" opacity="0"/></g>`, FULL, 'display:none')}
  ${svgL('', FULL, `
  <g clip-path="url(#${p}clip)">
    <ellipse ${ellipse} fill="none" stroke="url(#${p}rim)" stroke-width="22"/>
    <ellipse ${ellipse} fill="none" stroke="url(#${p}rimTop)" stroke-width="14"/>
    <ellipse cx="146" cy="168" rx="32" ry="14" fill="#fff" opacity=".95" transform="rotate(-30 146 168)"/>
    <circle cx="182" cy="152" r="5" fill="#fff" opacity=".9"/>
  </g>
  <ellipse ${ellipse} fill="none" stroke="${O}" stroke-width="5"/>
  ${cap(CAP_T, [166, 140, 234])}
  <g class="lq-acc" data-acc="crown"><g transform="translate(200 118)"><g class="lq-crown">${crown}</g></g></g>
  <g data-cheeks="">
    <ellipse cx="128" cy="272" rx="22" ry="12" fill="url(#${p}cheek)"/>
    <ellipse cx="272" cy="272" rx="22" ry="12" fill="url(#${p}cheek)"/>
    <circle cx="135.7" cy="269" r="2.6" fill="#fff" opacity=".85"/><circle cx="279.7" cy="269" r="2.6" fill="#fff" opacity=".85"/>
  </g>
  ${eye('L')}${eye('R')}
  <g fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round">
    <path data-brow="l"/><path data-brow="r"/>
  </g>
  <path data-mouth="" fill="${C.mouthIn}" stroke="${O}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"/>
  <ellipse data-tongue="" fill="${C.tongue}" clip-path="url(#${p}mclip)"/>
  <g data-chin="" opacity="0">
    <line x1="232" y1="302" x2="262" y2="318" stroke="${O}" stroke-width="27" stroke-linecap="round"/>
    <line x1="232" y1="302" x2="262" y2="318" stroke="#fcf4f2" stroke-width="17" stroke-linecap="round"/>
    <circle cx="228" cy="300" r="13" fill="url(#${p}paw)" stroke="${O}" stroke-width="4.5"/>
    <ellipse cx="224" cy="295" rx="4.5" ry="3" fill="#fff" opacity=".9"/>
  </g>
  <g class="lq-acc" data-acc="tear"><g transform="translate(146 264)"><g class="lq-tear" style="transform-origin:0 0">
    <path d="M0 -17C3.4 -10 9.4 -4 9.4 2.6A9.4 9.4 0 0 1 -9.4 2.6C-9.4 -4 -3.4 -10 0 -17Z" fill="url(#${p}tear)" stroke="${O}" stroke-width="5" stroke-linejoin="round" paint-order="stroke"/>
    <ellipse cx="-3" cy="2.6" rx="2.6" ry="3.8" fill="#fff" opacity=".95"/></g></g></g>`)}
</div></div>
  ${svgL('', FULL, `<g class="lq-acc" data-acc="waveLines">${linesSVG(340, 232, 28, -75, 10, 3, 13)}</g>
  <g class="lq-acc" data-acc="fistLines">${linesSVG(342, 240, 30, -100, -5, 3, 13)}</g>`)}
</div></div></div>
<div class="lqL" data-dust="">${flySVG(FLY_FRONT, p)}</div>
${svgL('', FULL, `
  <g class="lq-acc" data-acc="popLines">${linesSVG(200, 200, 168, -162, -130, 3, 16)}${linesSVG(200, 200, 168, -50, -18, 3, 16)}</g>
  <g class="lq-acc" data-acc="question">${symbolSVG('?', 64, 112, 96, '#9682ff', -12, 'lq-q')}${sparkleSVG(18, 190, 9, '#ffd65a', 0.3)}</g>
  <g class="lq-acc" data-acc="exclaim">${symbolSVG('!', 372, 80, 100, '#ff7878', 10, 'lq-ex')}</g>
  <g class="lq-acc" data-acc="zzz">${symbolSVG('Z', 318, 132, 54, '#c8d2ff', 10, 'lq-z')}${symbolSVG('z', 358, 92, 42, '#c8d2ff', 14, 'lq-z', 1.1)}${symbolSVG('z', 388, 56, 32, '#c8d2ff', 18, 'lq-z', 2.2)}</g>`)}`;
}

// ---------------------------------------------------------------- component

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutBack = (t) => { const s = 1.3; return 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2; };
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// viseme by the last typed letter (uk + en)
const VIS_A = /[aаяáà]/i, VIS_O = /[oоё]/i, VIS_U = /[uуюw]/i, VIS_E = /[eеєиіїyi]/i;
function visemeFor(ch) {
  if (!ch || /[\s.,!?…:;—–\-()"«»]/.test(ch)) return 't_closed';
  if (VIS_A.test(ch)) return 't_a';
  if (VIS_O.test(ch)) return 't_o';
  if (VIS_U.test(ch)) return 't_u';
  if (VIS_E.test(ch)) return 't_e';
  return null; // consonant: random flap
}

// ---------------------------------------------------------------- v6-perf: спільний тікер і пауза

// Один планувальник на всі екземпляри: кожен tick(now) повертає час наступної потреби (мс, performance.now);
// ≤ now → потрібен наступний кадр (rAF), інакше — один спільний setTimeout до найближчої події.
const TICKS = new Set();
let tkRaf = 0, tkTmo = 0, tkDue = Infinity;
function tkRun() {
  tkRaf = 0; tkTmo = 0; tkDue = Infinity;
  const now = performance.now();
  let next = Infinity;
  for (const t of TICKS) { const d = t(now); if (d < next) next = d; }
  if (next < Infinity) tkWake(Math.max(next, now + 1));
}
function tkWake(at = 0) {
  if (at >= tkDue) return;
  if (tkRaf) cancelAnimationFrame(tkRaf);
  if (tkTmo) clearTimeout(tkTmo);
  tkRaf = tkTmo = 0;
  tkDue = at;
  const wait = at - performance.now();
  if (wait < 20 && !document.hidden) tkRaf = requestAnimationFrame(tkRun);
  else tkTmo = setTimeout(tkRun, Math.max(0, wait));
}

// пауза поза екраном (IntersectionObserver) і в прихованій вкладці: CSS-анімації стоять, тікер не малює
const VIS = new WeakMap();
let io = null;
function observe(el, inst) {
  VIS.set(el, inst);
  if (!io && typeof IntersectionObserver === 'function') {
    io = new IntersectionObserver((entries) => {
      for (const e of entries) { const i = VIS.get(e.target); if (i) i.setVisible(e.isIntersecting); }
    }, { rootMargin: '80px' });
  }
  io?.observe(el);
}
const ALL = new Set();
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { for (const i of ALL) i.syncPause(); if (!document.hidden) tkWake(); });
}

// запис атрибута/стилю лише коли значення змінилося (менше інвалідацій стилю/перемальовувань)
function sa(n, k, v) {
  const c = n.__lq || (n.__lq = {});
  if (c[k] !== v) { c[k] = v; n.setAttribute(k, v); }
}
function ss(n, k, v) {
  const c = n.__lq || (n.__lq = {}), kk = '$' + k;
  if (c[kk] !== v) { c[kk] = v; n.style[k] = v; }
}

export function createLumi(container, { size = 220, emotion = 'hello', bubble = 'top' } = {}) {
  ensureStyle();
  const p = `lq${++instances}_`;
  const el = document.createElement('div');
  el.className = `lq lq-bubble-${bubble}`;
  el.style.width = el.style.height = size + 'px';
  el.style.setProperty('--lq-fs', Math.round(Math.max(13, Math.min(17, size * 0.068))) + 'px');
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', 'Лумі');
  el.innerHTML = buildSVG(p);
  const bub = document.createElement('div');
  bub.className = 'lq-bubble';
  bub.setAttribute('role', 'status');
  el.appendChild(bub);
  if (container) container.appendChild(el);

  const q = (s) => el.querySelector(s);
  const qa = (s) => [...el.querySelectorAll(s)];
  const R = {
    mouth: q('[data-mouth]'), mclip: q('[data-mclip]'), tongue: q('[data-tongue]'),
    browL: q('[data-brow="l"]'), browR: q('[data-brow="r"]'),
    chin: q('[data-chin]'), cheeks: q('[data-cheeks]'), tint: q('[data-tint]'), tintL: q('.lq-tint'),
    coreW: q('[data-core="w"]'), coreC: q('[data-core="c"]'),
    glowW: q('[data-glow="w"]'), glowC: q('[data-glow="c"]'), dust: qa('[data-dust]'),
    wings: { L: q('[data-wing="L"]'), R: q('[data-wing="R"]') },
    petals: { L: q('[data-petal="L"]'), R: q('[data-petal="R"]') },
    ants: { L: q('[data-ant="L"]'), R: q('[data-ant="R"]') },
    bulbs: qa('[data-bulbglow]'), tassel: q('[data-tassel]'), tstar: q('[data-tstar]'),
    acc: Object.fromEntries(qa('[data-acc]').map((n) => [n.dataset.acc, n])),
    looks: qa('.lq-look'), act: q('.lq-act'), react: q('.lq-react'), flash: q('.lq-flash'),
  };
  const arms = {};
  for (const s of ['L', 'R']) {
    const g = q(`[data-arm="${s}"]`);
    arms[s] = { g, vis: g.querySelector('[data-armvis]'), paws: [...g.querySelectorAll('[data-paw]')] };
  }
  const eyes = {};
  for (const s of ['L', 'R']) {
    eyes[s] = {
      solid: q(`[data-solid="${s}"]`), hl: q(`[data-hl="${s}"]`), spk: q(`[data-spk="${s}"]`), water: q(`[data-water="${s}"]`),
      pup: q(`[data-pup="${s}"]`), happy: q(`[data-happy="${s}"]`), content: q(`[data-content="${s}"]`), sleep: q(`[data-sleep="${s}"]`),
      star: q(`[data-star="${s}"]`),
    };
  }
  // перезапуск одноразових CSS-анімацій: досить перерахунку стилю вузла (без примусового layout як offsetWidth)
  const restyle = (n) => { void getComputedStyle(n).animationName; };

  let cur = poseOf(POSES[emotion] ? emotion : 'hello');
  let emo = emotion, face = null;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const clearLater = (t) => { if (t) { clearTimeout(t); timers.delete(t); } };

  // ---- видимість / пауза
  let visible = true, paused = false;
  const syncPause = () => {
    const pz = !visible || (typeof document !== 'undefined' && document.hidden);
    if (pz === paused) return;
    paused = pz;
    el.classList.toggle('lq-paused', pz);
    if (!pz) tkWake();
  };
  const inst = { setVisible(v) { visible = v; syncPause(); }, syncPause };

  // ---- talking state (mouth blended on top of the emotion mouth)
  let talking = false, talkMix = 0, talkLast = 0, nextSwap = 0, talkHint = '';
  const talkCur = flatMouth('t_closed').slice();
  let talkTgt = flatMouth('t_closed'), lastVis = 't_closed';
  const mBuf = new Array(32);

  function renderMouth(v) {
    const m = mBuf, k = talkMix;
    for (let i = 0; i < 32; i++) m[i] = k > 0 ? v['m' + i] + (talkCur[i] - v['m' + i]) * k : v['m' + i];
    const d = cubicD(m, 26);
    sa(R.mouth, 'd', d);
    sa(R.mouth, 'stroke-width', String(f(m[26])));
    sa(R.mclip, 'd', d);
    sa(R.tongue, 'cx', String(f(m[27]))); sa(R.tongue, 'cy', String(f(m[28])));
    sa(R.tongue, 'rx', String(f(Math.max(0, m[29])))); sa(R.tongue, 'ry', String(f(Math.max(0, m[30]))));
    sa(R.tongue, 'opacity', String(f(clamp01(m[31]))));
  }

  function render(v) {
    for (const s of ['L', 'R']) {
      const e = eyes[s], k = `e${s}_`;
      sa(e.solid, 'transform', `translate(${f(v[k + 'tx'])} ${f(v[k + 'ty'])}) scale(${f(v[k + 'sx'])} ${f(Math.max(0.05, v[k + 'sy']))})`);
      sa(e.solid, 'opacity', String(f(clamp01(v[k + 'solid']))));
      const hl = Math.max(0, v[k + 'hl'] * (1 - clamp01(v[k + 'spark'])));
      sa(e.hl, 'rx', String(f(8.6 * hl))); sa(e.hl, 'ry', String(f(8.7 * hl)));
      sa(e.spk, 'opacity', String(f(clamp01(v[k + 'spark']))));
      sa(e.water, 'opacity', String(f(clamp01(v[k + 'water']))));
      sa(e.pup, 'rx', String(f(11 * v[k + 'pup']))); sa(e.pup, 'ry', String(f(14.5 * v[k + 'pup'])));
      for (const t of ['happy', 'content', 'sleep', 'star']) {
        const o = clamp01(v[k + t]);
        sa(e[t], 'opacity', String(f(o)));
        sa(e[t], 'transform', t === 'star' ? `scale(${f(0.3 + 0.7 * o)}) rotate(${f((1 - o) * -60)})` : `scale(1 ${f(0.3 + 0.7 * o)})`);
      }
    }
    renderMouth(v);
    const bd = (pre) => `M${f(v[pre + 0])} ${f(v[pre + 1])}Q${f(v[pre + 2])} ${f(v[pre + 3])} ${f(v[pre + 4])} ${f(v[pre + 5])}`;
    sa(R.browL, 'd', bd('bl')); sa(R.browR, 'd', bd('br'));
    for (const s of ['L', 'R']) {
      const k = `a${s}_`;
      const A = arms[s];
      ss(A.g, 'transform', `rotate(${f(v[k + 'a'])}deg)`);
      ss(A.vis, 'transform', `scale(${f(Math.max(0.001, clamp01(v[k + 'vis'])))})`);
      const pr = String(f(13 * (1 + 0.25 * clamp01(v[k + 'fist']))));
      A.paws.forEach((n) => sa(n, 'r', pr));
      // spirit parts (HTML layers; mirrored wrappers: same sign = symmetric motion)
      ss(R.wings[s], 'transform', `rotate(${f(v.w)}deg) scale(${f(v.ws)})`);
      ss(R.petals[s], 'transform', `rotate(${f(s === 'L' ? v.pl : v.pr)}deg)`);
      ss(R.ants[s], 'transform', `rotate(${f(s === 'L' ? v.nl : v.nr)}deg)`);
    }
    ss(R.tassel, 'transform', `rotate(${f(v.ta)}deg)`);
    ss(R.tstar, 'transform', `scale(${f(v.ts)})`);
    const g = v.glow, c = clamp01(v.cool);
    const bo = String(f(Math.min(1, 0.15 + 0.7 * g)));
    R.bulbs.forEach((n) => sa(n, 'opacity', bo));
    sa(R.chin, 'opacity', String(f(clamp01(v.chin))));
    sa(R.chin, 'transform', `translate(${f((1 - clamp01(v.chin)) * 26)} ${f((1 - clamp01(v.chin)) * 18)})`);
    sa(R.cheeks, 'opacity', String(f(Math.max(0, v.cheek))));
    const tint = f(clamp01(v.tint));
    sa(R.tint, 'opacity', String(tint));
    ss(R.tintL, 'display', tint > 0 ? '' : 'none');
    const cw = f(Math.min(1, 0.18 + 0.78 * g) * (1 - c)), cc = f(c * Math.min(1, 0.3 + g));
    ss(R.coreW, 'opacity', String(cw));
    ss(R.coreW, 'display', cw > 0 ? '' : 'none'); // невидиме світло не анімуємо
    ss(R.coreC, 'display', cc > 0 ? '' : 'none');
    ss(R.coreW, 'transform', `scale(${f(0.8 + 0.2 * Math.min(1.4, g))})`);
    ss(R.coreC, 'opacity', String(cc));
    const du = String(f(clamp01(v.dust)));
    R.dust.forEach((n) => ss(n, 'opacity', du));
    sa(R.glowW, 'opacity', String(f(Math.min(1, g) * (1 - c))));
    sa(R.glowW, 'transform', `translate(${BODY.cx} ${BODY.cy}) scale(${f(0.8 + 0.2 * Math.min(1.4, g))}) translate(${-BODY.cx} ${-BODY.cy})`);
    sa(R.glowC, 'opacity', String(f(c * Math.min(1, 0.4 + g))));
  }

  // ---- tween (у спільному тікері)
  let tw = null;
  function tweenTo(target, ms = 480) {
    if (reducedMotion() || ms <= 0) { tw = null; cur = { ...target }; render(cur); return; }
    tw = { from: { ...cur }, target, t0: performance.now(), ms };
    tkWake();
  }
  function stepTween(now) {
    const t = Math.min(1, (now - tw.t0) / tw.ms), e = easeOutBack(t);
    const { from, target } = tw;
    if (t < 1) { for (const k in target) cur[k] = from[k] + (target[k] - from[k]) * e; }
    else { cur = { ...target }; tw = null; }
    if (!paused) render(cur);
    else if (!tw) render(cur);
  }

  function applyAcc(name) {
    const on = new Set(POSES[name].acc);
    for (const [k, n] of Object.entries(R.acc)) n.classList.toggle('on', on.has(k));
  }

  let flashTimer = 0;
  function flash() {
    if (reducedMotion()) return;
    el.classList.remove('lq-flashing'); restyle(R.flash); el.classList.add('lq-flashing');
    clearLater(flashTimer);
    flashTimer = later(() => el.classList.remove('lq-flashing'), 800);
  }

  function set(name) {
    if (!POSES[name]) name = 'hello';
    if (name === emo && el.classList.contains('lq-e-' + name)) return api;
    emo = name;
    face = null;
    // одноразові анімації емоцій мають унікальні імена → перезапускаються самі при зміні класу,
    // без примусового перерахунку стилю всього дерева
    for (const e of EMOTIONS) if (e !== name) el.classList.remove('lq-e-' + e);
    el.classList.add('lq-e-' + name);
    applyAcc(name);
    tweenTo(poseOf(name));
    if (BRIGHT.includes(name)) flash();
    return api;
  }

  // temporarily show another face (used by tap reactions)
  let faceTimer = 0;
  function flashFace(faceName, ms = 900) {
    clearLater(faceTimer);
    face = faceName;
    tweenTo(poseOf(emo, faceName), 300);
    faceTimer = later(() => { face = null; tweenTo(poseOf(emo), 400); applyAcc(emo); }, ms);
  }

  // ---- blinking & glances (час подій — у тікері, без власних таймерів)
  let wasConnected = false;
  const gone = () => { if (el.isConnected) { wasConnected = true; return false; } if (wasConnected) { destroy(); return true; } return false; };
  const CLOSED = ['happy', 'content', 'sleep', 'wink', 'star'];
  let blinkAt = performance.now() + 1800 + Math.random() * 3800, blinkOff = 0, blink2At = 0;
  let lookAt = performance.now() + 1500 + Math.random() * 2500;
  function doBlink(now) { el.classList.add('lq-blink'); blinkOff = now + 180; }
  function stepEyes(now) {
    if (blinkOff && now >= blinkOff) { el.classList.remove('lq-blink'); blinkOff = 0; }
    if (blink2At && now >= blink2At) { blink2At = 0; if (!paused && !blinkOff) doBlink(now); }
    if (now >= blinkAt) {
      blinkAt = now + 1800 + Math.random() * 3800;
      const eyesNow = POSES[face || emo].eyes;
      if (!paused && (!CLOSED.includes(eyesNow[0]) || !CLOSED.includes(eyesNow[1]))) {
        if (!blinkOff) doBlink(now);
        if (Math.random() < 0.22) blink2At = now + 260;
      }
    }
    if (now >= lookAt) {
      lookAt = now + 1500 + Math.random() * 2500;
      if (!paused) {
        const still = ['thinking', 'sleepy', 'sad'].includes(emo) || reducedMotion();
        const x = still ? 0 : (Math.random() * 2 - 1) * 4.5, y = still ? 0 : (Math.random() * 2 - 1) * 2.8;
        const back = Math.random() < 0.45;
        const tr = back ? '' : `translate(${f(x)}px, ${f(y)}px)`;
        R.looks.forEach((n) => ss(n, 'transform', tr));
      }
    }
    return Math.min(blinkAt, lookAt, blinkOff || Infinity, blink2At || Infinity);
  }

  // ---- talking (lip-flap by vowels: closed / A / O / E / U)
  function talkStep(now) {
    const dt = Math.min(64, now - (talkLast || now));
    talkLast = now;
    if (talking) {
      talkMix = Math.min(1, talkMix + dt / 90);
      if (now >= nextSwap) {
        let vis = visemeFor(talkHint);
        talkHint = '';
        if (!vis || (vis === lastVis && vis !== 't_closed')) {
          const pool = ['t_a', 't_e', 't_o', 't_a', 't_e', 't_closed', 't_u'].filter((x) => x !== lastVis);
          vis = pool[Math.floor(Math.random() * pool.length)];
        }
        lastVis = vis;
        talkTgt = flatMouth(vis);
        nextSwap = now + 80 + Math.random() * 45 + (vis === 't_closed' ? 40 : 0); // ~8–12 flaps/s
      }
    } else {
      talkMix = Math.max(0, talkMix - dt / 160);
      talkTgt = flatMouth('t_closed');
    }
    const k = 1 - Math.exp(-dt / 32);
    for (let i = 0; i < 32; i++) talkCur[i] += (talkTgt[i] - talkCur[i]) * k;
    if (!paused && !tw) renderMouth(cur); // під час твіну рот малює render()
    if (!talking && talkMix <= 0) talkLast = 0;
  }
  function startTalk() {
    if (reducedMotion()) return;
    talking = true;
    el.classList.add('lq-talking');
    if (!talkLast) nextSwap = 0;
    tkWake();
  }
  function stopTalk() {
    talking = false;
    el.classList.remove('lq-talking');
  }
  let talkTimer = 0, talkResolve = null;
  function talk(textOrMs) {
    clearLater(talkTimer);
    if (talkResolve) { talkResolve(); talkResolve = null; }
    if (typeof textOrMs === 'string') return say(textOrMs);
    const ms = Number(textOrMs) || 0;
    if (ms <= 0) { stopTalk(); return Promise.resolve(); }
    startTalk();
    return new Promise((resolve) => {
      talkResolve = resolve;
      talkTimer = later(() => { stopTalk(); if (talkResolve === resolve) { talkResolve = null; resolve(); } }, ms);
    });
  }

  // ---- speech bubble: текст розкладається один раз, далі лише visibility символів (без innerHTML/перекладки)
  let hideTimer = 0, sayResolve = null, typing = null;
  function stepType(now) {
    const T = typing;
    const n = Math.min(T.spans.length, Math.floor((now - T.t0) / 28));
    if (n > T.i) {
      if (T.i > 0) T.spans[T.i - 1].classList.remove('lq-cur');
      for (let j = T.i; j < n; j++) T.spans[j].classList.remove('lq-h');
      T.i = n;
      talkHint = T.chars[n - 1];
      if (n < T.spans.length) T.spans[n - 1].classList.add('lq-cur');
    }
    if (T.i >= T.spans.length) { typing = null; later(T.finish, 140); return Infinity; }
    return T.t0 + (T.i + 1) * 28;
  }
  function say(text, { ms } = {}) {
    typing = null; clearLater(hideTimer); clearLater(talkTimer);
    if (sayResolve) { sayResolve(); sayResolve = null; }
    text = String(text ?? '');
    if (!text) { bub.classList.remove('show'); stopTalk(); return Promise.resolve(); }
    const chars = [...text];
    const stay = ms ?? Math.min(6000, 1600 + chars.length * 55);
    bub.classList.add('show');
    bub.setAttribute('aria-label', text);
    return new Promise((resolve) => {
      sayResolve = resolve;
      const finish = () => {
        stopTalk();
        hideTimer = later(() => { bub.classList.remove('show'); if (sayResolve === resolve) { sayResolve = null; resolve(); } }, stay);
      };
      if (reducedMotion()) { bub.textContent = text; finish(); return; }
      const frag = document.createDocumentFragment();
      const spans = chars.map((ch) => { const sp = document.createElement('span'); sp.className = 'lq-h'; sp.textContent = ch; frag.appendChild(sp); return sp; });
      bub.textContent = '';
      bub.appendChild(frag);
      typing = { chars, spans, i: 0, t0: performance.now(), finish };
      startTalk();
    });
  }

  // ---- per-instance tick
  function tick(now) {
    if (dead) { TICKS.delete(tick); return Infinity; }
    if (gone()) return Infinity;
    let next = Infinity;
    if (tw) { stepTween(now); if (tw) next = now; }
    if (typing) next = Math.min(next, stepType(now));
    if (talking || talkMix > 0) { talkStep(now); if (talking || talkMix > 0) next = now; }
    next = Math.min(next, stepEyes(now));
    return next;
  }

  // ---- reactions
  let reactTimer = 0, taps = [];
  function playReact(kind) {
    const k = ['jump', 'tap', 'giggle', 'spin', 'shake', 'nod', 'love', 'wow'].includes(kind) ? kind : 'jump';
    for (const c of [...el.classList]) if (c.startsWith('lq-r-')) el.classList.remove(c);
    restyle(R.react);
    el.classList.add('lq-r-' + k);
    clearLater(reactTimer);
    reactTimer = later(() => el.classList.remove('lq-r-' + k), k === 'spin' ? 950 : 750);
  }
  function react(kind = 'tap') {
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    if (kind === 'tap') {
      playReact('tap'); flash();
      flashFace(Math.random() < 0.5 ? 'happy' : 'excited', 1000);
      say(pick(TAP_PHRASES), { ms: 1800 });
    } else if (kind === 'spin') {
      playReact('spin'); flash();
      flashFace('excited', 1200);
      say(pick(SPIN_PHRASES), { ms: 1500 });
    } else if (kind === 'giggle') {
      playReact('giggle'); flashFace('happy', 800);
    } else if (kind === 'love') {
      playReact('love'); flash(); flashFace('happy', 1200);
      R.acc.hearts.classList.add('on');
    } else if (kind === 'wow') {
      playReact('wow'); flash(); flashFace('surprised', 900);
    } else if (kind === 'shake') {
      playReact('shake'); flashFace('sad', 900);
    } else {
      playReact(kind);
    }
    return api;
  }
  function onTap(ev) {
    if (ev.button > 0) return;
    const now = performance.now();
    taps = taps.filter((t) => now - t < 900);
    taps.push(now);
    if (taps.length >= 3) { taps = []; react('spin'); } else react('tap');
  }
  el.addEventListener('click', onTap);

  let dead = false;
  function destroy() {
    if (dead) return;
    dead = true;
    tw = null; typing = null; talking = false;
    TICKS.delete(tick); ALL.delete(inst);
    io?.unobserve(el);
    for (const t of timers) clearTimeout(t);
    timers.clear();
    if (sayResolve) { sayResolve(); sayResolve = null; }
    if (talkResolve) { talkResolve(); talkResolve = null; }
    el.removeEventListener('click', onTap);
    el.remove();
  }

  const api = {
    el,
    set,
    say,
    talk,
    react,
    destroy,
    get emotion() { return emo; },
  };

  render(cur);
  set(emotion);
  ALL.add(inst);
  observe(el, inst);
  syncPause();
  TICKS.add(tick);
  tkWake();
  return api;
}

export const LUMI_EMOTIONS = EMOTIONS;
export default createLumi;
