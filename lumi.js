// LumiQuest — Лумі, анімована SVG-героїня (v5).
//
//   import { createLumi } from './lumi.js?v=20261110123652';
//   const lumi = createLumi(container, { size: 220, emotion: 'hello', bubble: 'top' });
//   lumi.set('happy');              // hello happy excited thinking surprised sad proud cheer sleepy
//   lumi.say('Привіт!', { ms: 2500 }); // бульбашка + друк + говоріння (lip-flap, кивки)
//   lumi.talk(1500);                // лише рот «говорить» 1.5 с; talk('текст') = say('текст'); talk(0) — стоп
//   lumi.react('tap');              // tap jump giggle spin shake nod love wow
//   lumi.destroy();
//
// Дизайн v5: світна зірочка-дух — м'яке тільце-краплинка з хвостиком-кометою, на кінчику
// якого сяє зірка-корончина; крихітні ручки, великі очі з райдужками й двома відблисками,
// внутрішнє світіння, rim-light, зоряний пил навколо. Простір координат 512×512.
// Без залежностей; CSS вбудований; кілька екземплярів на сторінці.

const EMOTIONS = ['hello', 'happy', 'excited', 'thinking', 'surprised', 'sad', 'proud', 'cheer', 'sleepy'];

const C = {
  outline: '#5b3473', eyeDark: '#2a1740', mouth: '#7a2a52', mouthIn: '#4a1634',
  tongue: '#ff8a9c', cheek: '#ff7f9e', starCore: '#fffbe0', starEdge: '#ffbe3c',
  glow: '#ffd99a', glowCool: '#a8a6ff',
  body: [[0, '#ffefa6'], [0.22, '#ffd896'], [0.45, '#ffbaa6'], [0.64, '#f9a9c4'], [0.82, '#c9a0ee'], [1, '#9784e8']],
};

const BODY = { cx: 256, cy: 324, rx: 140, ry: 124 };
const EYE_L = [208, 306], EYE_R = [304, 306];
const PIVOT_L = [132, 346], PIVOT_R = [380, 346];
const TIP_PIVOT = [258, 222];

// arm poses: angle of the LEFT arm in degrees (180 = straight out left, >180 = up), right arm mirrored
const ARM_POSES = {
  rest: 150, down: 112, out: 186, hip: 132, up: 214, wave: 222, fist: 220, cheerUp: 200, hidden: 150,
};

// tail-comet poses: rotation around TIP_PIVOT, star scale, star spin
const TIP = {
  up: [0, 1, 0], bounce: [-8, 1.1, -10], tilt: [10, 1, 14], droop: [34, 0.88, 30], sleepy: [-26, 0.9, -24], proud: [-3, 1.18, 0],
};

const POSES = {
  hello: { eyes: ['open', 'open'], mouth: 'smile_open', brows: null, arms: ['rest', 'wave'], tip: 'up',
    acc: ['waveLines', 'sparkHello'] },
  happy: { eyes: ['happy', 'happy'], mouth: 'big_smile', brows: null, arms: ['cheerUp', 'cheerUp'], tip: 'bounce', glow: 1.15,
    acc: ['sparkHappy', 'hearts'] },
  excited: { eyes: ['sparkly', 'sparkly'], mouth: 'big_open', brows: 'raised', arms: ['up', 'up'], tip: 'bounce', glow: 1.3,
    acc: ['sparkMany'] },
  thinking: { eyes: ['look_up', 'look_up'], mouth: 'hmm', brows: 'thinking', arms: ['rest', 'hidden'], tip: 'tilt',
    chin: 1, acc: ['question'] },
  surprised: { eyes: ['round', 'round'], mouth: 'o', brows: 'raised', arms: ['out', 'out'], tip: 'up', glow: 1.1,
    acc: ['exclaim', 'popLines'] },
  sad: { eyes: ['sad', 'sad'], mouth: 'sad', brows: 'sad', arms: ['down', 'down'], tip: 'droop', glow: 0.45,
    tint: 0.32, dust: 0.25, cheek: 0.55, acc: ['tear'] },
  proud: { eyes: ['content', 'content'], mouth: 'smug', brows: 'proud', arms: ['hip', 'hip'], tip: 'proud', glow: 1.35,
    acc: ['medal', 'confetti', 'rays'] },
  cheer: { eyes: ['open', 'wink'], mouth: 'grin', brows: 'confident', arms: ['rest', 'fist'], tip: 'bounce', glow: 1.15,
    acc: ['sparkCheer', 'fistLines'] },
  sleepy: { eyes: ['sleep', 'sleep'], mouth: 'sleep', brows: null, arms: ['down', 'down'], tip: 'sleepy', glow: 0.6,
    cool: 1, tint: 0.2, dust: 0.45, cheek: 0.7, acc: ['zzz'] },
};

const TAP_PHRASES = [
  'Хі-хі, лоскотно!', 'Ой! Привіт! 👋', 'Я Лумі! ✨', 'Вчимося далі?',
  'Ти чудово справляєшся!', 'Ще одне слово? 📚', 'Обережно, я сяю!', 'Let\'s go! Тобто — вперед!',
];
const SPIN_PHRASES = ['Ві-і-і-і!', 'Голова обертом! 🌀', 'Ух, як весело!'];

// ---------------------------------------------------------------- geometry

const f = (n) => Math.round(n * 100) / 100;
const rad = (d) => (d * Math.PI) / 180;

function bodyPath() {
  const { cx, cy, rx, ry } = BODY;
  const n = 160, pts = [];
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n, c = Math.cos(t), s = Math.sin(t);
    const e = 2.15 + 0.75 * Math.max(0, s); // flatter, softer bottom
    const x = Math.sign(c) * Math.abs(c) ** (2 / e), y = Math.sign(s) * Math.abs(s) ** (2 / e);
    const w = 1 + 0.07 * s; // pear: wider below
    const lift = s < 0 ? 1.07 : 1;
    pts.push(`${f(cx + rx * x * w)} ${f(cy + ry * y * lift)}`);
  }
  return 'M' + pts.join('L') + 'Z';
}

// comet tail rising from the crown and leaning right, with a soft curl
const TIP_D = 'M210 236C210 206 230 184 256 168C278 154 292 138 296 114C298 102 299 94 304 88'
  + 'C316 100 322 120 318 142C314 164 298 178 296 200C295 216 298 228 304 240Z';
const STAR_AT = [304, 86];

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
function cubicD(n) {
  let d = `M${f(n[0])} ${f(n[1])}`;
  for (let i = 2; i < n.length; i += 6) d += `C${n.slice(i, i + 6).map(f).join(' ')}`;
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
// soft (rounded) star path: quadratic curves through the inner points
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

// mouth = closed path of 4 cubics (26 numbers): start right, lower edge to the left, upper edge back
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
const MY = 352; // mouth centre line
const MOUTHS = { // shape, stroke width, tongue [cx, cy, rx, ry, opacity]
  smile: [mouthLine(256, MY - 6, 15, 12, 25, 155), 6.5, [256, MY + 2, 6, 4, 0]],
  smile_open: [mouthOpen(256, MY - 2, 17, 16), 7, [258, MY + 10, 10.5, 7.5, 1]],
  big_smile: [mouthOpen(256, MY - 4, 23, 21, 0.08), 7, [258, MY + 12, 14, 9, 1]],
  big_open: [mouthOpen(256, MY - 4, 24, 26, 0.12), 7, [258, MY + 16, 15, 11, 1]],
  grin: [mouthOpen(258, MY - 2, 19, 14, 0.1, -0.16), 7, [260, MY + 8, 11, 6.5, 1]],
  smug: [mouthLine(256, MY - 8, 19, 11, 18, 162), 6.5, [256, MY, 6, 4, 0]],
  o: [mouthOpen(256, MY + 2, 11, 14, 1), 7, [256, MY + 12, 7, 5, 1]],
  sad: [mouthLine(256, MY + 10, 13, 8, 335, 205), 6.5, [256, MY + 6, 6, 4, 0]],
  hmm: [[262, MY - 2, 256, MY - 7, 250, MY - 7, 244, MY + 0.5, 238, MY + 8, 232, MY + 7, 226, MY + 3,
    232, MY + 7, 238, MY + 8, 244, MY + 0.5, 250, MY - 7, 256, MY - 7, 262, MY - 2], 6.5, [244, MY + 2, 6, 4, 0]],
  sleep: [mouthOpen(256, MY + 2, 7, 8, 1), 6.5, [256, MY + 9, 5, 4, 0]],
  // talking visemes
  t_closed: [mouthLine(256, MY - 4, 12, 7, 20, 160), 6.5, [256, MY, 6, 4, 0]],
  t_a: [mouthOpen(256, MY - 3, 17, 19, 0.16), 7, [258, MY + 10, 11, 8, 1]],
  t_o: [mouthOpen(256, MY + 1, 10.5, 14, 1), 7, [256, MY + 10, 7, 5, 1]],
  t_e: [mouthOpen(256, MY - 2, 20, 10, 0.32), 7, [258, MY + 4, 10, 4, 0.7]],
  t_u: [mouthOpen(256, MY + 1, 7, 9, 1), 6.5, [256, MY + 6, 5, 3.5, 0.6]],
};
const flatMouth = (k) => { const m = MOUTHS[k]; return [...m[0], m[1], ...m[2]]; }; // 32 numbers

const BROWS = { // [x0,y0,cx,cy,x1,y1] left, right
  none: [[192, 258, 208, 252, 224, 258], [288, 258, 304, 252, 320, 258]],
  sad: [[188, 268, 206, 262, 224, 252], [288, 252, 306, 262, 324, 268]],
  raised: [[190, 256, 208, 242, 226, 252], [286, 252, 304, 242, 322, 256]],
  thinking: [[192, 264, 208, 264, 224, 266], [292, 252, 310, 238, 328, 250]],
  confident: [[190, 260, 207, 264, 224, 268], [288, 268, 305, 264, 322, 260]],
  proud: [[190, 258, 207, 250, 224, 254], [288, 254, 305, 250, 322, 258]],
};

// eye state: solid eye transform + highlight kind + line-eye opacities
function eyeState(kind) {
  const e = { tx: 0, ty: 0, sx: 1, sy: 1, solid: 1, spark: 0, hl: 1, water: 0, pup: 1, happy: 0, content: 0, sleep: 0 };
  switch (kind) {
    case 'sparkly': Object.assign(e, { sx: 1.05, sy: 1.04, spark: 1, pup: 1.1 }); break;
    case 'round': Object.assign(e, { ty: -4, sx: 1.06, sy: 0.92, pup: 0.62, hl: 0.85 }); break;
    case 'sad': Object.assign(e, { ty: 5, sx: 0.98, sy: 0.88, hl: 1.2, water: 1, pup: 1.15 }); break;
    case 'look_up': Object.assign(e, { tx: 7, ty: -7, sx: 0.94, sy: 0.94 }); break;
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
  v.bo = F.brows ? 1 : 0;
  put('aL_', armState(P.arms[0], 'L'));
  put('aR_', armState(P.arms[1], 'R'));
  const t = TIP[P.tip];
  Object.assign(v, { tipA: t[0], starS: t[1], starR: t[2] });
  v.chin = P.chin || 0;
  v.glow = P.glow || 1;
  v.cool = P.cool || 0;
  v.tint = P.tint || 0;
  v.dust = P.dust ?? 1;
  v.cheek = (F.cheek || 1) * (faceOverride ? 1.2 : 1);
  return v;
}

// ---------------------------------------------------------------- CSS

const CSS = `
.lq{position:relative;display:inline-block;flex:none;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;touch-action:manipulation;cursor:pointer;line-height:1}
.lq>svg{display:block;width:100%;height:100%;overflow:visible}
.lq svg *{transform-box:view-box}
.lq-float{animation:lqFloat 3.8s ease-in-out infinite}
.lq-shadow{transform-origin:256px 482px;animation:lqShadow 3.8s ease-in-out infinite}
.lq-breath{transform-origin:256px 446px;animation:lqBreath 3.2s ease-in-out infinite}
.lq-act,.lq-react,.lq-talkg{transform-origin:256px 446px}
.lq-sway{transform-origin:${TIP_PIVOT[0]}px ${TIP_PIVOT[1]}px;animation:lqSway 3s ease-in-out infinite alternate}
.lq-twinkle{animation:lqTwinkle 2.4s ease-in-out infinite}
.lq-halo{animation:lqHalo 2.4s ease-in-out infinite}
.lq-glint{animation:lqGlint 4.6s ease-in-out infinite;transform:scale(0)}
.lq-glow{animation:lqGlow 3.2s ease-in-out infinite}
.lq-core{animation:lqCore 3.2s ease-in-out infinite}
.lq-look{transition:transform .35s cubic-bezier(.3,1.4,.5,1)}
.lq.lq-blink .lq-lid{animation:lqBlink .16s ease-in-out}
.lq-dust{animation:lqDust var(--t,3s) ease-in-out var(--d,0s) infinite both}
.lq-armact-l,.lq-armact-r{transform-origin:0 0}
@keyframes lqFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes lqShadow{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.86);opacity:.7}}
@keyframes lqBreath{0%,100%{transform:scale(1,1)}50%{transform:scale(.982,1.028)}}
@keyframes lqSway{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}
@keyframes lqTwinkle{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.1) rotate(8deg)}}
@keyframes lqHalo{0%,100%{opacity:.7;transform:scale(.94)}50%{opacity:1;transform:scale(1.06)}}
@keyframes lqGlint{0%,70%,100%{transform:scale(0) rotate(0)}80%{transform:scale(1) rotate(45deg)}90%{transform:scale(0) rotate(90deg)}}
@keyframes lqGlow{0%,100%{opacity:.82}50%{opacity:1}}
@keyframes lqCore{0%,100%{opacity:.55}50%{opacity:.9}}
@keyframes lqBlink{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.06)}}
@keyframes lqDust{0%{transform:translate(0,0) scale(0) rotate(0);opacity:0}25%{transform:translate(calc(var(--dx)*.25),calc(var(--dy)*.25)) scale(1) rotate(30deg);opacity:1}
  70%{opacity:.9}100%{transform:translate(var(--dx),var(--dy)) scale(.2) rotate(90deg);opacity:0}}

/* talking: nods while the mouth flaps */
.lq-talking .lq-talkg{animation:lqTalkNod .52s ease-in-out infinite alternate}
@keyframes lqTalkNod{0%{transform:rotate(-1.4deg) translateY(0)}50%{transform:rotate(.4deg) translateY(2px) scale(1.01,.99)}100%{transform:rotate(1.4deg) translateY(0)}}

/* accessories */
.lq-acc{opacity:0;transition:opacity .3s}
.lq-acc.on{opacity:1}
.lq-acc:not(.on) *{animation:none!important}
.on .lq-q{animation:lqPop .5s cubic-bezier(.3,1.7,.5,1) both,lqBob 1.8s ease-in-out .5s infinite alternate}
.on .lq-ex{animation:lqPop .45s cubic-bezier(.3,1.9,.5,1) both,lqWobble .5s ease-in-out .45s 3}
.on .lq-z{animation:lqZ 3.3s ease-in-out infinite both}
.on .lq-tear{animation:lqTear 2.4s ease-in infinite both}
.on .lq-medal{animation:lqMedalIn .7s cubic-bezier(.3,1.6,.5,1) both,lqSwing 2.4s ease-in-out .7s infinite alternate}
.lq-medal{transform-origin:0 -26px}
.on .lq-spk{animation:lqSpark 1.9s ease-in-out infinite both}
.on .lq-heart{animation:lqHeart 1.6s ease-in-out infinite both}
.on .lq-blinkline{animation:lqLines .45s ease-in-out infinite alternate both}
.on .lq-conf{animation:lqConf 3.4s linear infinite both}
.on .lq-raysr{animation:lqSpin 26s linear infinite}
@keyframes lqPop{0%{transform:scale(0) rotate(-20deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes lqBob{from{transform:translateY(0) rotate(-4deg)}to{transform:translateY(-10px) rotate(5deg)}}
@keyframes lqWobble{0%,100%{transform:rotate(0)}30%{transform:rotate(-12deg)}70%{transform:rotate(10deg)}}
@keyframes lqZ{0%{transform:translate(-26px,34px) scale(.3);opacity:0}25%{opacity:1}80%{opacity:1}100%{transform:translate(12px,-26px) scale(1.15);opacity:0}}
@keyframes lqTear{0%{transform:translate(0,-6px) scale(0);opacity:0}14%{transform:translate(0,0) scale(1);opacity:1}
  55%{transform:translate(-5px,30px) scale(1,1.1);opacity:1}82%{transform:translate(-9px,58px) scale(.9,1.05);opacity:.9}100%{transform:translate(-10px,70px) scale(.5);opacity:0}}
@keyframes lqMedalIn{0%{transform:scale(0) rotate(-40deg)}100%{transform:scale(1) rotate(0)}}
@keyframes lqSwing{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}
@keyframes lqSpark{0%,100%{transform:scale(.55) rotate(0);opacity:.45}50%{transform:scale(1.1) rotate(45deg);opacity:1}}
@keyframes lqHeart{0%,100%{transform:translateY(0) scale(1)}15%{transform:translateY(-3px) scale(1.18)}30%{transform:translateY(-5px) scale(1)}60%{transform:translateY(-8px) scale(1.06)}}
@keyframes lqLines{from{opacity:.25;transform:scale(.92)}to{opacity:1;transform:scale(1.04)}}
@keyframes lqConf{0%{transform:translateY(-36px) rotate(0);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateY(70px) rotate(300deg);opacity:0}}
@keyframes lqSpin{to{transform:rotate(360deg)}}

/* emotion actions */
.lq-e-hello .lq-act{animation:lqSwayBody 1.8s ease-in-out infinite alternate}
.lq-e-hello .lq-armact-r{animation:lqWave .38s ease-in-out infinite alternate}
.lq-e-happy .lq-act{animation:lqHop 1.1s ease-in-out infinite}
.lq-e-happy .lq-armact-l{animation:lqWiggleL .55s ease-in-out infinite alternate}
.lq-e-happy .lq-armact-r{animation:lqWiggleR .55s ease-in-out infinite alternate}
.lq-e-excited .lq-act{animation:lqJump .78s ease-in-out infinite}
.lq-e-excited .lq-armact-l{animation:lqWiggleL .39s ease-in-out infinite alternate}
.lq-e-excited .lq-armact-r{animation:lqWiggleR .39s ease-in-out infinite alternate}
.lq-e-thinking .lq-act{animation:lqTiltIn .5s ease-out both,lqTilt 3s ease-in-out .5s infinite alternate}
.lq-e-surprised .lq-act{animation:lqJolt .6s ease-out both}
.lq-e-surprised .lq-armact-l,.lq-e-surprised .lq-armact-r{animation:lqTremble .12s linear 6}
.lq-e-sad .lq-act{animation:lqSinkIn .8s ease-out both,lqSadSway 4.4s ease-in-out .8s infinite alternate}
.lq-e-sad .lq-float{animation-duration:5.4s}
.lq-e-proud .lq-act{animation:lqPuff 2.4s ease-in-out infinite}
.lq-e-cheer .lq-act{animation:lqPumpBody .7s ease-in-out infinite}
.lq-e-cheer .lq-armact-r{animation:lqPump .7s cubic-bezier(.5,0,.3,1) infinite}
.lq-e-sleepy .lq-act{animation:lqDoze 4.6s ease-in-out infinite}
.lq-e-sleepy .lq-breath{animation-duration:4.6s}
.lq-e-sleepy .lq-float,.lq-e-sleepy .lq-shadow{animation-duration:5.6s}
@keyframes lqSwayBody{from{transform:rotate(-2deg)}to{transform:rotate(2.4deg)}}
@keyframes lqWave{from{transform:rotate(-20deg)}to{transform:rotate(16deg)}}
@keyframes lqHop{0%,100%{transform:translateY(0) scale(1)}12%{transform:translateY(0) scale(1.07,.92)}36%{transform:translateY(-30px) scale(.95,1.06)}56%{transform:translateY(0) scale(1.09,.9)}70%{transform:translateY(0) scale(.97,1.03)}82%{transform:translateY(0) scale(1)}}
@keyframes lqJump{0%,100%{transform:translateY(0) scale(1)}10%{transform:translateY(0) scale(1.1,.88)}40%{transform:translateY(-46px) scale(.93,1.08) rotate(-3deg)}62%{transform:translateY(0) scale(1.11,.88)}78%{transform:translateY(0) scale(.97,1.03)}}
@keyframes lqWiggleL{from{transform:rotate(-14deg)}to{transform:rotate(12deg)}}
@keyframes lqWiggleR{from{transform:rotate(14deg)}to{transform:rotate(-12deg)}}
@keyframes lqTiltIn{from{transform:rotate(0)}to{transform:rotate(-5deg)}}
@keyframes lqTilt{from{transform:rotate(-5deg)}to{transform:rotate(-8deg) translateX(-3px)}}
@keyframes lqJolt{0%{transform:translateY(0) scale(1)}15%{transform:translateY(0) scale(1.08,.9)}40%{transform:translateY(-26px) scale(.92,1.1)}65%{transform:translateY(0) scale(1.06,.94)}82%{transform:translateY(0) scale(.98,1.02)}100%{transform:translateY(0) scale(1)}}
@keyframes lqTremble{0%,100%{transform:rotate(0)}25%{transform:rotate(4deg)}75%{transform:rotate(-4deg)}}
@keyframes lqSinkIn{from{transform:translateY(0) scale(1)}to{transform:translateY(10px) scale(1.04,.94)}}
@keyframes lqSadSway{from{transform:translateY(10px) scale(1.04,.94) rotate(-1.5deg)}to{transform:translateY(11px) scale(1.045,.935) rotate(1.5deg)}}
@keyframes lqPuff{0%,100%{transform:scale(1)}50%{transform:scale(1.035,1.05)}}
@keyframes lqPumpBody{0%,100%{transform:translateY(0)}35%{transform:translateY(-7px)}}
@keyframes lqPump{0%,100%{transform:rotate(0)}35%{transform:rotate(14deg)}65%{transform:rotate(-26deg)}}
@keyframes lqDoze{0%,100%{transform:rotate(0)}40%{transform:rotate(3deg) translateY(2px)}55%{transform:rotate(3.5deg) translateY(3px)}}

/* reactions */
.lq-r-jump .lq-react,.lq-r-tap .lq-react{animation:lqRJump .6s cubic-bezier(.3,.7,.4,1)}
.lq-r-giggle .lq-react{animation:lqRGiggle .6s ease-in-out}
.lq-r-spin .lq-react{transform-origin:256px 320px;animation:lqRSpin .9s cubic-bezier(.5,0,.3,1)}
.lq-r-shake .lq-react{animation:lqRShake .5s ease-in-out}
.lq-r-nod .lq-react{animation:lqRNod .7s ease-in-out}
.lq-r-love .lq-react,.lq-r-wow .lq-react{animation:lqRLove .7s cubic-bezier(.3,1.6,.5,1)}
@keyframes lqRJump{0%{transform:translateY(0) scale(1)}15%{transform:translateY(0) scale(1.12,.86)}45%{transform:translateY(-38px) scale(.9,1.1) rotate(4deg)}72%{transform:translateY(0) scale(1.1,.9)}86%{transform:scale(.97,1.03)}100%{transform:translateY(0) scale(1)}}
@keyframes lqRGiggle{0%,100%{transform:rotate(0)}15%{transform:rotate(-6deg) scale(1.03,.97)}35%{transform:rotate(6deg)}55%{transform:rotate(-5deg) scale(1.03,.97)}75%{transform:rotate(4deg)}}
@keyframes lqRSpin{0%{transform:translateY(0) rotate(0)}18%{transform:translateY(12px) scale(1.1,.86)}50%{transform:translateY(-56px) rotate(200deg) scale(.95)}82%{transform:translateY(0) rotate(360deg) scale(1.08,.92)}100%{transform:translateY(0) rotate(360deg)}}
@keyframes lqRShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px) rotate(-4deg)}40%{transform:translateX(9px) rotate(4deg)}60%{transform:translateX(-6px) rotate(-2deg)}80%{transform:translateX(4px)}}
@keyframes lqRNod{0%,100%{transform:rotate(0)}30%{transform:translateY(6px) scale(1.04,.95)}60%{transform:translateY(-4px) scale(.98,1.03)}}
@keyframes lqRLove{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}

/* speech bubble */
.lq-bubble{position:absolute;z-index:5;left:50%;bottom:95%;transform:translateX(-50%) scale(.6);transform-origin:50% 100%;
  width:max-content;max-width:min(240px,86vw);padding:9px 14px;border-radius:18px;background:#fff;color:#3a2448;
  border:2.5px solid ${C.outline};box-shadow:0 4px 0 rgba(91,52,115,.18),0 8px 22px rgba(91,52,115,.18);
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

@media (prefers-reduced-motion: reduce){
  .lq *,.lq{animation:none!important}
  .lq-glint{transform:scale(0)}
  .lq-dust{opacity:.85;transform:translate(calc(var(--dx)*.3),calc(var(--dy)*.3))}
  .lq-bubble{transition:opacity .15s}
}
`;

function ensureStyle() {
  if (document.getElementById('lumi-style')) return;
  const s = document.createElement('style');
  s.id = 'lumi-style';
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ---------------------------------------------------------------- SVG markup

let instances = 0;

function sparkleSVG(x, y, r, col, delay = 0, dur = 1.9) {
  return `<g transform="translate(${x} ${y})"><g class="lq-spk" style="animation-delay:${delay}s;animation-duration:${dur}s">
    <polygon points="${starPts(0, 0, r, r * 0.3, 0, 4)}" fill="${col}" stroke="${C.outline}" stroke-width="${f(Math.max(2.5, r * 0.16) * 2)}" stroke-linejoin="round" paint-order="stroke"/>
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
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><g class="lq-heart" style="animation-delay:${delay}s">
    <polygon points="${p.join(' ')}" fill="${col}" stroke="${C.outline}" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/>
    <ellipse cx="${f(-r * 0.4)}" cy="${f(-r * 0.35)}" rx="${f(r * 0.22)}" ry="${f(r * 0.15)}" fill="#fff" opacity=".8"/></g></g>`;
}
function linesSVG(cx, cy, radius, a0, a1, count, len, cls = 'lq-blinkline') {
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / Math.max(1, count - 1));
    s += `<line x1="${f(cx + radius * Math.cos(a))}" y1="${f(cy + radius * Math.sin(a))}" x2="${f(cx + (radius + len) * Math.cos(a))}" y2="${f(cy + (radius + len) * Math.sin(a))}"/>`;
  }
  return `<g style="transform-origin:${cx}px ${cy}px" class="${cls}" stroke="${C.outline}" stroke-width="5.5" stroke-linecap="round">${s}</g>`;
}
function symbolSVG(text, x, y, size, col, angle, cls, delay = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${angle})"><g class="${cls}"${delay ? ` style="animation-delay:${delay}s"` : ''}>
    <text x="0" y="${f(size * 0.36)}" text-anchor="middle" font-family="Poppins,'Baloo 2','Nunito','Arial Rounded MT Bold',Inter,system-ui,sans-serif"
      font-weight="800" font-size="${size}" fill="${col}" stroke="${C.outline}" stroke-width="${f(size * 0.18)}" stroke-linejoin="round" paint-order="stroke">${text}</text></g></g>`;
}

// stardust: [x, y, r, colour, dx, dy, dur, delay, kind]
const DUST_BACK = [
  [96, 250, 9, '#ffd76a', -18, -60, 3.4, 0, 's'], [430, 220, 8, '#c6a8ff', 16, -56, 3.1, 1.2, 's'],
  [70, 380, 5, '#ffb3cc', -10, -50, 2.8, 0.6, 'd'], [452, 372, 6, '#ffd76a', 12, -54, 3.6, 2.0, 'd'],
  [150, 150, 6, '#bfe3ff', -8, -40, 3.0, 2.4, 's'], [372, 140, 5, '#ffb3cc', 10, -44, 2.6, 0.3, 'd'],
];
const DUST_FRONT = [
  [120, 430, 7, '#ffe48a', -14, -70, 3.8, 1.6, 's'], [400, 440, 8, '#d4bcff', 16, -76, 3.3, 0.9, 's'],
  [470, 290, 4.5, '#fff1b0', 8, -40, 2.4, 1.9, 'd'], [44, 300, 4.5, '#fff1b0', -8, -40, 2.7, 0.2, 'd'],
];
function dustSVG(list) {
  return list.map(([x, y, r, col, dx, dy, t, d, k]) => `<g transform="translate(${x} ${y})"><g class="lq-dust" style="--dx:${dx}px;--dy:${dy}px;--t:${t}s;--d:-${d}s">
    ${k === 's' ? `<polygon points="${starPts(0, 0, r * 1.6, r * 0.42, 0, 4)}" fill="${col}"/><circle r="${f(r * 0.38)}" fill="#fff"/>`
    : `<circle r="${r * 1.7}" fill="${col}" opacity=".35"/><circle r="${r * 0.8}" fill="${col}"/><circle r="${f(r * 0.35)}" fill="#fff"/>`}</g></g>`).join('');
}

function buildSVG(p) {
  const bp = bodyPath();
  const O = C.outline, OW = 9; // outline colour/width (≈3–4 px at 200 px)
  const stops = C.body.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');

  const arm = (side) => `<g data-arm="${side}"><g data-armvis=""><g class="lq-armact-${side === 'L' ? 'l' : 'r'}">
      <g stroke="${O}" stroke-width="${OW * 2}" stroke-linejoin="round" fill="${O}">
        <path d="M-16 -15L64 -11L64 11L-16 15Z"/><circle data-paw="" cx="68" cy="0" r="17"/></g>
      <path d="M-16 -15L64 -11L64 11L-16 15Z" fill="url(#${p}arm)"/>
      <circle data-paw="" cx="68" cy="0" r="17" fill="url(#${p}paw)"/>
      <ellipse cx="71" cy="-7" rx="6.5" ry="4" fill="#fff" opacity=".8"/>
    </g></g></g>`;

  const tipLayer = (layer) => `<g data-tip=""><g class="lq-sway">${layer === 'o'
    ? `<path d="${TIP_D}" fill="${O}" stroke="${O}" stroke-width="${OW * 2}" stroke-linejoin="round"/>`
    : `<path d="${TIP_D}" fill="url(#${p}body)"/>
       <path d="M236 196C246 176 266 162 282 146" fill="none" stroke="#fffdf0" stroke-width="7" stroke-linecap="round" opacity=".75"/>
       <path d="M314 120C318 136 314 154 306 168" fill="none" stroke="url(#${p}rimTip)" stroke-width="6" stroke-linecap="round" opacity=".9"/>
       <g transform="translate(${STAR_AT[0]} ${STAR_AT[1]})">
         <circle data-halo="" r="74" fill="url(#${p}halo)" class="lq-halo" style="transform-origin:0 0"/>
         <g data-star=""><g class="lq-twinkle" style="transform-origin:0 0">
           <path d="${softStarD(0, 0, 34, 16.5, 5, 0.22)}" fill="url(#${p}star)" stroke="${O}" stroke-width="${OW * 2}" stroke-linejoin="round" paint-order="stroke"/>
           <path d="${softStarD(0, 0, 34, 16.5, 5, 0.22)}" fill="none" stroke="#fff6c8" stroke-width="3" stroke-linejoin="round" opacity=".7" transform="translate(-1.5 -1.5) scale(.86)"/>
           <ellipse cx="-8" cy="-9" rx="6.5" ry="4.2" fill="#fff" opacity=".95" transform="rotate(-30 -8 -9)"/>
           <circle cx="5" cy="-14" r="2.4" fill="#fff" opacity=".9"/>
           <g transform="translate(24 -26)"><polygon class="lq-glint" style="transform-origin:0 0" points="${starPts(0, 0, 13, 2.6, 0, 4)}" fill="#fff"/></g>
         </g></g>
       </g>`}</g></g>`;

  const eye = (side) => `<g transform="translate(${side === 'L' ? EYE_L : EYE_R})"><g class="lq-look"><g class="lq-lid">
    <g data-solid="${side}">
      <ellipse rx="28" ry="34" fill="${C.eyeDark}"/>
      <ellipse cx="0" cy="5" rx="23" ry="27" fill="url(#${p}iris)"/>
      <ellipse data-pup="${side}" cx="0" cy="3" rx="12" ry="15" fill="#1b0d2b"/>
      <path d="${arcD(0, 3, 20, 24, 30, 150)}" fill="none" stroke="#c7f0ff" stroke-width="3" stroke-linecap="round" opacity=".55"/>
      <ellipse data-hl="${side}" cx="9" cy="-12" rx="10" ry="11.5" fill="#fff" transform="rotate(20 9 -12)"/>
      <polygon data-spk="${side}" points="${starPts(8, -11, 15, 4.6, 0, 4)}" fill="#fff" opacity="0"/>
      <circle cx="-10" cy="14" r="4.6" fill="#fff" opacity=".95"/>
      <path data-water="${side}" d="${arcD(0, 2, 22, 26, 35, 145)}" stroke="#e6f2ff" stroke-width="4" fill="none" stroke-linecap="round" opacity="0"/>
    </g>
    <path data-happy="${side}" d="${arcD(0, 10, 23, 22, 200, 340)}" stroke="${C.eyeDark}" stroke-width="9" fill="none" stroke-linecap="round" opacity="0"/>
    <path data-content="${side}" d="${arcD(0, 6, 23, 13, 195, 345)}" stroke="${C.eyeDark}" stroke-width="9" fill="none" stroke-linecap="round" opacity="0"/>
    <g data-sleep="${side}" opacity="0" stroke="${C.eyeDark}" fill="none" stroke-linecap="round">
      <path d="${arcD(0, -2, 22, 11, 20, 160)}" stroke-width="8.5"/>
      ${[40, 90, 140].map((a) => `<line x1="${f(22 * Math.cos(rad(a)))}" y1="${f(-2 + 11 * Math.sin(rad(a)))}" x2="${f(29 * Math.cos(rad(a)))}" y2="${f(-2 + 18 * Math.sin(rad(a)))}" stroke-width="4"/>`).join('')}
    </g></g></g></g>`;

  // confetti pieces for "proud"
  const confCols = ['#ff788c', '#6eb4ff', '#ffce50', '#8cdca0', '#be96ff'];
  const spots = [[60, 70], [120, 40], [440, 60], [392, 30], [470, 160], [36, 200], [90, 150], [430, 230],
    [480, 300], [30, 300], [70, 400], [450, 380], [170, 30], [340, 20], [20, 120], [500, 220]];
  const conf = spots.map(([x, y], i) => {
    const col = confCols[i % 5], d = (i * 0.37) % 3.4, dur = 2.8 + (i % 4) * 0.35;
    const shape = i % 3 === 2 ? `<circle r="5" fill="${col}"/>` : `<rect x="-3.5" y="-7" width="7" height="14" rx="2" fill="${col}" transform="rotate(${i * 47})"/>`;
    return `<g transform="translate(${x} ${y})"><g class="lq-conf" style="animation-delay:-${f(d)}s;animation-duration:${dur}s">
      <g stroke="${O}" stroke-width="4.4" paint-order="stroke">${shape}</g></g></g>`;
  }).join('');

  const rays = Array.from({ length: 12 }, (_, i) => `<path d="M256 310L${f(256 + 300 * Math.cos(rad(i * 30 - 6)))} ${f(310 + 300 * Math.sin(rad(i * 30 - 6)))}L${f(256 + 300 * Math.cos(rad(i * 30 + 6)))} ${f(310 + 300 * Math.sin(rad(i * 30 + 6)))}Z"/>`).join('');

  const medal = () => {
    let s = '';
    for (const [sx, col] of [[-1, '#6096ff'], [1, '#ff6e82']]) {
      s += `<polygon points="${[[sx * 4, 0], [sx * 22, 6], [sx * 26, 44], [sx * 16, 36], [sx * 8, 46]].map((q) => q.join(',')).join(' ')}" fill="${col}" stroke="${O}" stroke-width="7" stroke-linejoin="round" paint-order="stroke" transform="scale(1 -1) translate(0 -8)"/>`;
    }
    let ros = '';
    for (let i = 0; i < 12; i++) ros += `<circle cx="${f(21 * Math.cos((2 * Math.PI * i) / 12))}" cy="${f(21 * Math.sin((2 * Math.PI * i) / 12))}" r="8"/>`;
    s += `<g fill="${O}" transform="scale(1.11)">${ros}<circle r="22"/></g><g fill="#ffaa3c">${ros}<circle r="22"/></g>`;
    s += `<circle r="17" fill="url(#${p}coin)" stroke="${O}" stroke-width="5" paint-order="stroke"/>`;
    s += `<polygon points="${starPts(0, 1, 10, 4.6)}" fill="#fff" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>`;
    return s;
  };

  return `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
  <linearGradient id="${p}body" gradientUnits="userSpaceOnUse" x1="0" y1="70" x2="0" y2="452">${stops}</linearGradient>
  <linearGradient id="${p}arm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd0bc"/><stop offset="1" stop-color="#e4a2d0"/></linearGradient>
  <radialGradient id="${p}paw" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffeadb"/><stop offset="1" stop-color="#eaa6cc"/></radialGradient>
  <radialGradient id="${p}glowW"><stop offset="0" stop-color="${C.glow}" stop-opacity="1"/><stop offset=".45" stop-color="${C.glow}" stop-opacity=".6"/><stop offset=".75" stop-color="${C.glow}" stop-opacity=".18"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}glowC"><stop offset="0" stop-color="${C.glowCool}" stop-opacity="1"/><stop offset=".45" stop-color="${C.glowCool}" stop-opacity=".55"/><stop offset=".75" stop-color="${C.glowCool}" stop-opacity=".16"/><stop offset="1" stop-color="${C.glowCool}" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}halo"><stop offset="0" stop-color="#fff2a8" stop-opacity="1"/><stop offset=".35" stop-color="#ffe27a" stop-opacity=".6"/><stop offset="1" stop-color="#ffe27a" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}star" cx=".42" cy=".38" r=".62"><stop offset="0" stop-color="${C.starCore}"/><stop offset=".5" stop-color="#ffe17a"/><stop offset="1" stop-color="${C.starEdge}"/></radialGradient>
  <radialGradient id="${p}coin" cx=".38" cy=".34" r=".7"><stop offset="0" stop-color="#fff6be"/><stop offset="1" stop-color="#ffc432"/></radialGradient>
  <radialGradient id="${p}iris" cx=".5" cy=".82" r=".75"><stop offset="0" stop-color="#9ff0ff"/><stop offset=".35" stop-color="#7aa8ff"/><stop offset=".7" stop-color="#7650d8"/><stop offset="1" stop-color="#3a2068"/></radialGradient>
  <radialGradient id="${p}core" gradientUnits="userSpaceOnUse" cx="256" cy="330" r="130"><stop offset="0" stop-color="#fff8e4" stop-opacity=".75"/><stop offset=".55" stop-color="#ffefd6" stop-opacity=".3"/><stop offset="1" stop-color="#fff2d8" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}shade" gradientUnits="userSpaceOnUse" cx="276" cy="470" r="200" gradientTransform="translate(276 470) scale(1 .62) translate(-276 -470)"><stop offset="0" stop-color="#7d5fd0" stop-opacity=".55"/><stop offset=".6" stop-color="#8c6ad8" stop-opacity=".22"/><stop offset="1" stop-color="#8c6ad8" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}light" gradientUnits="userSpaceOnUse" cx="196" cy="238" r="110" gradientTransform="translate(196 238) scale(1 .75) translate(-196 -238)"><stop offset="0" stop-color="#fffff4" stop-opacity=".7"/><stop offset=".5" stop-color="#fffff4" stop-opacity=".25"/><stop offset="1" stop-color="#fffff4" stop-opacity="0"/></radialGradient>
  <linearGradient id="${p}rim" gradientUnits="userSpaceOnUse" x1="170" y1="230" x2="380" y2="440"><stop offset=".45" stop-color="#e8f4ff" stop-opacity="0"/><stop offset=".8" stop-color="#eef6ff" stop-opacity=".85"/><stop offset="1" stop-color="#ffffff" stop-opacity="1"/></linearGradient>
  <linearGradient id="${p}rimTip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <radialGradient id="${p}cheek"><stop offset="0" stop-color="${C.cheek}" stop-opacity=".8"/><stop offset=".6" stop-color="${C.cheek}" stop-opacity=".42"/><stop offset="1" stop-color="${C.cheek}" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}shadow"><stop offset="0" stop-color="#4a2c66" stop-opacity=".32"/><stop offset=".6" stop-color="#4a2c66" stop-opacity=".14"/><stop offset="1" stop-color="#4a2c66" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}ray" gradientUnits="userSpaceOnUse" cx="256" cy="310" r="260"><stop offset=".25" stop-color="#ffe08a" stop-opacity=".6"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient>
  <linearGradient id="${p}tear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8f0ff"/><stop offset="1" stop-color="#6fb4ff"/></linearGradient>
  <clipPath id="${p}clip"><path d="${bp}"/></clipPath>
  <clipPath id="${p}mclip"><path data-mclip=""/></clipPath>
</defs>
<g class="lq-acc" data-acc="rays"><g class="lq-raysr" style="transform-origin:256px 310px" fill="url(#${p}ray)">${rays}</g></g>
<g class="lq-glow">
  <ellipse data-glow="w" cx="256" cy="300" rx="236" ry="226" fill="url(#${p}glowW)"/>
  <ellipse data-glow="c" cx="256" cy="300" rx="236" ry="226" fill="url(#${p}glowC)" opacity="0"/>
</g>
<g class="lq-back">
  <g data-dust="">${dustSVG(DUST_BACK)}</g>
  <g class="lq-acc" data-acc="confetti">${conf}</g>
  <g class="lq-acc" data-acc="sparkMany">${[[62, 120, 20, '#ffd65a'], [452, 116, 22, '#ffa0be'], [40, 330, 13, '#a0c8ff'], [476, 320, 15, '#ffd65a'],
    [150, 50, 12, '#bea0ff'], [400, 30, 14, '#a0e6be'], [86, 450, 11, '#ffa0be'], [440, 456, 12, '#bea0ff']].map((s, i) => sparkleSVG(...s, (i * 0.29) % 1.9, 1.5 + (i % 3) * 0.3)).join('')}</g>
  <g class="lq-acc" data-acc="sparkHello">${[[60, 170, 16, '#ffd65a'], [110, 90, 10, '#bea0ff'], [52, 430, 10, '#ffa0be'], [470, 420, 11, '#a0c8ff']].map((s, i) => sparkleSVG(...s, i * 0.5)).join('')}</g>
  <g class="lq-acc" data-acc="sparkHappy">${[[60, 150, 16, '#ffd65a'], [470, 300, 12, '#bea0ff'], [56, 430, 10, '#ffa0be']].map((s, i) => sparkleSVG(...s, i * 0.6)).join('')}</g>
  <g class="lq-acc" data-acc="sparkCheer">${[[60, 160, 16, '#ffd65a'], [110, 76, 10, '#a0e6be'], [56, 430, 10, '#ffa0be'], [470, 410, 12, '#ffd65a']].map((s, i) => sparkleSVG(...s, i * 0.45)).join('')}</g>
  <g class="lq-acc" data-acc="hearts">${heartSVG(452, 186, 22, '#ff7896', 14, 0)}${heartSVG(66, 236, 15, '#ffa0be', -16, 0.5)}</g>
</g>
<ellipse class="lq-shadow" cx="256" cy="482" rx="112" ry="14" fill="url(#${p}shadow)"/>
<g class="lq-float"><g class="lq-act"><g class="lq-react"><g class="lq-talkg"><g class="lq-breath">
  ${arm('L')}${arm('R')}
  ${tipLayer('o')}
  <path d="${bp}" fill="${O}" stroke="${O}" stroke-width="${OW * 2}" stroke-linejoin="round"/>
  ${tipLayer('f')}
  <path d="${bp}" fill="url(#${p}body)"/>
  <g clip-path="url(#${p}clip)">
    <g class="lq-core"><ellipse data-core="" cx="256" cy="336" rx="130" ry="112" fill="url(#${p}core)"/></g>
    <rect x="40" y="330" width="460" height="200" fill="url(#${p}shade)"/>
    <rect data-tint="" x="80" y="150" width="360" height="320" fill="#7b88d8" opacity="0" style="mix-blend-mode:multiply"/>
    <ellipse cx="196" cy="238" rx="120" ry="90" fill="url(#${p}light)"/>
    <path d="${bp}" fill="none" stroke="url(#${p}rim)" stroke-width="20"/>
    <ellipse cx="170" cy="232" rx="23" ry="12" fill="#fff" opacity=".85" transform="rotate(-32 170 232)"/>
    <ellipse cx="196" cy="214" rx="6.5" ry="4.5" fill="#fff" opacity=".85"/>
  </g>
  <g data-chin="" opacity="0">
    <g stroke="${O}" stroke-width="${OW * 2}" stroke-linejoin="round" fill="${O}">
      <rect x="0" y="-13" width="62" height="26" rx="13" transform="translate(304 392) rotate(12)"/>
      <circle cx="300" cy="388" r="17"/>
    </g>
    <rect x="0" y="-13" width="62" height="26" rx="13" transform="translate(304 392) rotate(12)" fill="url(#${p}arm)"/>
    <circle cx="300" cy="388" r="17" fill="url(#${p}paw)"/>
    <ellipse cx="294" cy="381" rx="6" ry="4" fill="#fff" opacity=".75"/>
  </g>
  <g data-cheeks="">
    <ellipse cx="164" cy="350" rx="30" ry="17" fill="url(#${p}cheek)"/>
    <ellipse cx="348" cy="350" rx="30" ry="17" fill="url(#${p}cheek)"/>
    <circle cx="170" cy="345" r="3.2" fill="#fff" opacity=".85"/><circle cx="354" cy="345" r="3.2" fill="#fff" opacity=".85"/>
  </g>
  ${eye('L')}${eye('R')}
  <g fill="none" stroke="${O}" stroke-width="7" stroke-linecap="round">
    <path data-brow="l"/><path data-brow="r"/>
  </g>
  <path data-mouth="" fill="${C.mouthIn}" stroke="${O}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"/>
  <ellipse data-tongue="" fill="${C.tongue}" clip-path="url(#${p}mclip)"/>
  <g class="lq-acc" data-acc="tear"><g transform="translate(196 350)"><g class="lq-tear" style="transform-origin:0 0">
    <path d="M0 -20 C4 -12 11 -5 11 3 A11 11 0 0 1 -11 3 C-11 -5 -4 -12 0 -20Z" fill="url(#${p}tear)" stroke="${O}" stroke-width="6" stroke-linejoin="round" paint-order="stroke"/>
    <ellipse cx="-3.5" cy="3" rx="3" ry="4.5" fill="#fff" opacity=".95"/></g></g></g>
  <g class="lq-acc" data-acc="medal"><g transform="translate(256 418)"><g class="lq-medal">${medal()}</g></g></g>
</g></g>
  <g class="lq-acc" data-acc="waveLines">${linesSVG(448, 214, 44, -80, 0, 3, 15)}</g>
  <g class="lq-acc" data-acc="fistLines">${linesSVG(440, 220, 50, -110, -10, 3, 15)}</g>
</g></g></g>
<g class="lq-front">
  <g data-dust="">${dustSVG(DUST_FRONT)}</g>
  <g class="lq-acc" data-acc="popLines">${linesSVG(256, 270, 200, -160, -128, 3, 18)}${linesSVG(256, 270, 200, -52, -20, 3, 18)}</g>
  <g class="lq-acc" data-acc="question">${symbolSVG('?', 112, 132, 110, '#9682ff', -12, 'lq-q')}${sparkleSVG(60, 220, 10, '#ffd65a', 0.3)}</g>
  <g class="lq-acc" data-acc="exclaim">${symbolSVG('!', 418, 150, 116, '#ff7878', 10, 'lq-ex')}</g>
  <g class="lq-acc" data-acc="zzz">${symbolSVG('Z', 380, 170, 60, '#c8d2ff', 10, 'lq-z')}${symbolSVG('z', 424, 124, 46, '#c8d2ff', 14, 'lq-z', 1.1)}${symbolSVG('z', 456, 86, 36, '#c8d2ff', 18, 'lq-z', 2.2)}</g>
</g>
</svg>`;
}

// ---------------------------------------------------------------- component

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutBack = (t) => { const s = 1.3; return 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2; };
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// viseme by the last typed letter (uk + en)
const VIS_A = /[aаяáà]/i, VIS_O = /[oоuуюwё]/i, VIS_E = /[eеєиіїyіi]/i;
function visemeFor(ch) {
  if (!ch || /[\s.,!?…:;—–\-()"«»]/.test(ch)) return 't_closed';
  if (VIS_A.test(ch)) return 't_a';
  if (VIS_O.test(ch)) return Math.random() < 0.6 ? 't_o' : 't_u';
  if (VIS_E.test(ch)) return 't_e';
  return null; // consonant: random flap
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
    tips: qa('[data-tip]'), star: q('[data-star]'), halo: q('[data-halo]'),
    mouth: q('[data-mouth]'), mclip: q('[data-mclip]'), tongue: q('[data-tongue]'),
    browL: q('[data-brow="l"]'), browR: q('[data-brow="r"]'),
    chin: q('[data-chin]'), cheeks: q('[data-cheeks]'), tint: q('[data-tint]'), core: q('[data-core]'),
    glowW: q('[data-glow="w"]'), glowC: q('[data-glow="c"]'), dust: qa('[data-dust]'),
    acc: Object.fromEntries(qa('[data-acc]').map((n) => [n.dataset.acc, n])),
    looks: qa('.lq-look'),
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
    };
  }

  let cur = poseOf(emotion);
  let emo = emotion, face = null;
  let raf = 0;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const clearLater = (t) => { if (t) { clearTimeout(t); timers.delete(t); } };

  // ---- talking state (mouth blended on top of the emotion mouth)
  let talking = false, talkMix = 0, talkRaf = 0, talkLast = 0, nextSwap = 0, talkHint = '';
  let talkCur = flatMouth('t_closed'), talkTgt = talkCur.slice(), lastVis = 't_closed';

  function renderMouth(v) {
    const m = new Array(32);
    const k = talkMix;
    for (let i = 0; i < 32; i++) m[i] = k > 0 ? v['m' + i] + (talkCur[i] - v['m' + i]) * k : v['m' + i];
    const d = cubicD(m.slice(0, 26));
    R.mouth.setAttribute('d', d);
    R.mouth.setAttribute('stroke-width', f(m[26]));
    R.mclip.setAttribute('d', d);
    R.tongue.setAttribute('cx', f(m[27])); R.tongue.setAttribute('cy', f(m[28]));
    R.tongue.setAttribute('rx', f(Math.max(0, m[29]))); R.tongue.setAttribute('ry', f(Math.max(0, m[30])));
    R.tongue.setAttribute('opacity', f(clamp01(m[31])));
  }

  function render(v) {
    for (const s of ['L', 'R']) {
      const e = eyes[s], k = `e${s}_`;
      e.solid.setAttribute('transform', `translate(${f(v[k + 'tx'])} ${f(v[k + 'ty'])}) scale(${f(v[k + 'sx'])} ${f(Math.max(0.05, v[k + 'sy']))})`);
      e.solid.setAttribute('opacity', f(clamp01(v[k + 'solid'])));
      const hl = Math.max(0, v[k + 'hl'] * (1 - clamp01(v[k + 'spark'])));
      e.hl.setAttribute('rx', f(10 * hl)); e.hl.setAttribute('ry', f(11.5 * hl));
      e.spk.setAttribute('opacity', f(clamp01(v[k + 'spark'])));
      e.water.setAttribute('opacity', f(clamp01(v[k + 'water'])));
      e.pup.setAttribute('rx', f(12 * v[k + 'pup'])); e.pup.setAttribute('ry', f(15 * v[k + 'pup']));
      for (const t of ['happy', 'content', 'sleep']) {
        const o = clamp01(v[k + t]);
        e[t].setAttribute('opacity', f(o));
        e[t].setAttribute('transform', `scale(1 ${f(0.3 + 0.7 * o)})`);
      }
    }
    renderMouth(v);
    const bd = (pre) => `M${f(v[pre + 0])} ${f(v[pre + 1])}Q${f(v[pre + 2])} ${f(v[pre + 3])} ${f(v[pre + 4])} ${f(v[pre + 5])}`;
    R.browL.setAttribute('d', bd('bl')); R.browR.setAttribute('d', bd('br'));
    R.browL.parentNode.setAttribute('opacity', f(clamp01(v.bo)));
    for (const s of ['L', 'R']) {
      const k = `a${s}_`, piv = s === 'L' ? PIVOT_L : PIVOT_R;
      const A = arms[s];
      A.g.setAttribute('transform', `translate(${piv[0]} ${piv[1]}) rotate(${f(v[k + 'a'])})`);
      A.vis.setAttribute('transform', `scale(${f(Math.max(0.001, clamp01(v[k + 'vis'])))})`);
      const pr = 17 * (1 + 0.25 * clamp01(v[k + 'fist']));
      A.paws.forEach((n) => n.setAttribute('r', f(pr)));
    }
    R.tips.forEach((n) => n.setAttribute('transform', `rotate(${f(v.tipA)} ${TIP_PIVOT[0]} ${TIP_PIVOT[1]})`));
    R.star.setAttribute('transform', `rotate(${f(v.starR)}) scale(${f(v.starS)})`);
    R.halo.setAttribute('r', f(74 * Math.max(0.35, Math.min(1.4, v.glow))));
    R.halo.setAttribute('opacity', f(Math.min(1, 0.4 + 0.6 * v.glow)));
    R.chin.setAttribute('opacity', f(clamp01(v.chin)));
    R.chin.setAttribute('transform', `translate(${f((1 - clamp01(v.chin)) * 30)} ${f((1 - clamp01(v.chin)) * 20)})`);
    R.cheeks.setAttribute('opacity', f(Math.max(0, v.cheek)));
    R.tint.setAttribute('opacity', f(clamp01(v.tint)));
    R.core.setAttribute('opacity', f(Math.min(1, 0.35 + 0.55 * v.glow)));
    R.dust.forEach((n) => n.setAttribute('opacity', f(clamp01(v.dust))));
    const c = clamp01(v.cool);
    R.glowW.setAttribute('opacity', f(Math.min(1, v.glow) * (1 - c)));
    R.glowW.setAttribute('transform', `translate(256 300) scale(${f(0.82 + 0.18 * Math.min(1.4, v.glow))}) translate(-256 -300)`);
    R.glowC.setAttribute('opacity', f(c * v.glow));
  }

  function tweenTo(target, ms = 460) {
    cancelAnimationFrame(raf);
    if (reducedMotion() || ms <= 0) { cur = { ...target }; render(cur); return; }
    const from = { ...cur }, t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms), e = easeOutBack(t);
      for (const k in target) cur[k] = from[k] + (target[k] - from[k]) * e;
      render(cur);
      if (t < 1) raf = requestAnimationFrame(step);
      else { cur = { ...target }; render(cur); }
    };
    raf = requestAnimationFrame(step);
  }

  function applyAcc(name) {
    const on = new Set(POSES[name].acc);
    for (const [k, n] of Object.entries(R.acc)) n.classList.toggle('on', on.has(k));
  }

  function set(name) {
    if (!POSES[name]) name = 'hello';
    if (name === emo && el.classList.contains('lq-e-' + name)) return api;
    emo = name;
    face = null;
    for (const e of EMOTIONS) el.classList.remove('lq-e-' + e);
    void el.offsetWidth; // restart one-shot emotion animations
    el.classList.add('lq-e-' + name);
    applyAcc(name);
    tweenTo(poseOf(name));
    return api;
  }

  // temporarily show another face (used by tap reactions)
  let faceTimer = 0;
  function flashFace(faceName, ms = 900) {
    clearLater(faceTimer);
    face = faceName;
    tweenTo(poseOf(emo, faceName), 300);
    faceTimer = later(() => { face = null; tweenTo(poseOf(emo), 380); }, ms);
  }

  // ---- blinking & glances
  let wasConnected = false;
  const gone = () => { if (el.isConnected) { wasConnected = true; return false; } if (wasConnected) { destroy(); return true; } return false; };
  const blinkOnce = () => { el.classList.remove('lq-blink'); void el.offsetWidth; el.classList.add('lq-blink'); later(() => el.classList.remove('lq-blink'), 180); };
  function scheduleBlink() {
    later(() => {
      if (gone()) return;
      const closed = ['happy', 'content', 'sleep', 'wink'];
      const eyesNow = POSES[face || emo].eyes;
      if (!closed.includes(eyesNow[0]) || !closed.includes(eyesNow[1])) {
        blinkOnce();
        if (Math.random() < 0.22) later(blinkOnce, 260);
      }
      scheduleBlink();
    }, 1800 + Math.random() * 3800);
  }
  function scheduleLook() {
    later(() => {
      if (gone()) return;
      const still = ['thinking', 'sleepy', 'sad'].includes(emo) || reducedMotion();
      const x = still ? 0 : (Math.random() * 2 - 1) * 5, y = still ? 0 : (Math.random() * 2 - 1) * 3;
      const back = Math.random() < 0.45;
      R.looks.forEach((n) => (n.style.transform = back ? '' : `translate(${f(x)}px, ${f(y)}px)`));
      scheduleLook();
    }, 1500 + Math.random() * 2500);
  }

  // ---- talking (lip-flap)
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
    renderMouth(cur);
    if (talking || talkMix > 0) talkRaf = requestAnimationFrame(talkStep);
    else { talkRaf = 0; talkLast = 0; }
  }
  function startTalk() {
    if (reducedMotion()) return;
    talking = true;
    el.classList.add('lq-talking');
    if (!talkRaf) { talkLast = 0; nextSwap = 0; talkRaf = requestAnimationFrame(talkStep); }
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

  // ---- speech bubble
  let typeTimer = 0, hideTimer = 0, sayResolve = null;
  function say(text, { ms } = {}) {
    clearInterval(typeTimer); clearLater(hideTimer); clearLater(talkTimer);
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
      let i = 0;
      const caret = '<span class="lq-caret"></span>';
      const esc = (s) => s.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
      bub.innerHTML = caret;
      startTalk();
      typeTimer = setInterval(() => {
        i += 1;
        talkHint = chars[i - 1];
        bub.innerHTML = esc(chars.slice(0, i).join('')) + (i < chars.length ? caret : '');
        if (i >= chars.length) { clearInterval(typeTimer); later(finish, 140); }
      }, 28);
    });
  }

  // ---- reactions
  let reactTimer = 0, taps = [];
  function playReact(kind) {
    const k = ['jump', 'tap', 'giggle', 'spin', 'shake', 'nod', 'love', 'wow'].includes(kind) ? kind : 'jump';
    for (const c of [...el.classList]) if (c.startsWith('lq-r-')) el.classList.remove(c);
    void el.offsetWidth;
    el.classList.add('lq-r-' + k);
    clearLater(reactTimer);
    reactTimer = later(() => el.classList.remove('lq-r-' + k), k === 'spin' ? 950 : 750);
  }
  function react(kind = 'tap') {
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    if (kind === 'tap') {
      playReact('tap');
      flashFace(Math.random() < 0.5 ? 'happy' : 'excited', 1000);
      say(pick(TAP_PHRASES), { ms: 1800 });
    } else if (kind === 'spin') {
      playReact('spin');
      flashFace('excited', 1200);
      say(pick(SPIN_PHRASES), { ms: 1500 });
    } else if (kind === 'giggle') {
      playReact('giggle'); flashFace('happy', 800);
    } else if (kind === 'love') {
      playReact('love'); flashFace('happy', 1200);
    } else if (kind === 'wow') {
      playReact('wow'); flashFace('surprised', 900);
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

  function destroy() {
    cancelAnimationFrame(raf);
    cancelAnimationFrame(talkRaf); talkRaf = 0; talking = false;
    clearInterval(typeTimer);
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
  scheduleBlink();
  scheduleLook();
  return api;
}

export const LUMI_EMOTIONS = EMOTIONS;
export default createLumi;
