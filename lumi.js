// LumiQuest — Lumi, the animated SVG mascot.
//
//   import { createLumi } from './lumi.js?v=20261110022322';
//   const lumi = createLumi(container, { size: 220 });
//   lumi.set('happy');              // hello happy excited thinking surprised sad proud cheer sleepy
//   lumi.say('Привіт!', { ms: 2500 });
//   lumi.react('tap');              // tap jump giggle spin shake nod love wow
//   lumi.destroy();
//
// Drawn in the same style as assets/lumi/*.png (see tools/make_lumi.py): all
// coordinates are the same 512-unit design space. No dependencies.

const EMOTIONS = ['hello', 'happy', 'excited', 'thinking', 'surprised', 'sad', 'proud', 'cheer', 'sleepy'];

// palette (tools/make_lumi.py)
const C = {
  outline: '#482c56', eyeDark: '#322044', eyeLight: '#7a56a8', mouth: '#6e2846',
  tongue: '#ff808c', cheek: '#ff8096', starCore: '#fff7c8', starEdge: '#ffc440',
  glow: '#ffd68c', glowCool: '#aaa0ff', foot: '#b09ce8', footHl: '#e6dcff',
  stem: '#ffd678',
  body: [[0, '#ffe8ac'], [0.45, '#ffc8ac'], [0.8, '#e2b8e4'], [1, '#beaaf2']],
};

const BODY = { cx: 256, cy: 308, rx: 146, ry: 124 };
const EYE_L = [198, 300], EYE_R = [314, 300];
const PIVOT_L = [152, 326], PIVOT_R = [360, 326];
const ARM_R = 21;

// arm poses: outer point of the LEFT arm (right arm mirrored), like make_lumi.py
const ARM_POSES = {
  rest: [104, 372], in: [118, 384], out: [86, 284], hip: [92, 338],
  wave: [78, 230], up: [84, 214], fist: [80, 214], hidden: null,
};

const ANTENNA = { // stem control p1, p2, star centre, rotation, scale
  up: [[236, 132], [270, 92], [274, 86], 10, 1.0],
  bounce: [[232, 128], [266, 80], [270, 74], 8, 1.06],
  tilt: [[238, 136], [284, 96], [290, 92], 14, 1.0],
  droop: [[236, 120], [196, 128], [190, 136], 32, 0.9],
  sleepy: [[240, 128], [210, 112], [204, 112], -22, 0.92],
};

// face + body pose of every emotion
const POSES = {
  hello: { eyes: ['open', 'open'], mouth: 'smile_open', brows: null, arms: ['rest', 'wave'], antenna: 'up',
    acc: ['waveLines', 'sparkHello'] },
  happy: { eyes: ['happy', 'happy'], mouth: 'smile_open', brows: null, arms: ['rest', 'rest'], antenna: 'up',
    acc: ['sparkHappy', 'hearts'] },
  excited: { eyes: ['sparkly', 'sparkly'], mouth: 'big_open', brows: null, arms: ['up', 'up'], antenna: 'bounce',
    acc: ['sparkMany'] },
  thinking: { eyes: ['look_up', 'look_up'], mouth: 'hmm', brows: 'thinking', arms: ['rest', 'hidden'], antenna: 'tilt',
    chin: 1, acc: ['question'] },
  surprised: { eyes: ['round', 'round'], mouth: 'o', brows: 'raised', arms: ['out', 'out'], antenna: 'up',
    acc: ['exclaim', 'popLines'] },
  sad: { eyes: ['sad', 'sad'], mouth: 'sad', brows: 'sad', arms: ['in', 'in'], antenna: 'droop', glow: 0.55,
    acc: ['tear'] },
  proud: { eyes: ['content', 'content'], mouth: 'smug', brows: null, arms: ['hip', 'hip'], antenna: 'up', glow: 1.25,
    acc: ['medal', 'confetti', 'rays'] },
  cheer: { eyes: ['open', 'happy'], mouth: 'grin', brows: 'confident', arms: ['rest', 'fist'], antenna: 'bounce',
    acc: ['sparkCheer', 'fistLines'] },
  sleepy: { eyes: ['sleep', 'sleep'], mouth: 'sleep', brows: null, arms: ['in', 'in'], antenna: 'sleepy', glow: 0.55,
    cool: 1, cheek: 0.7, acc: ['zzz'] },
};

const TAP_PHRASES = [
  'Хі-хі, лоскотно!', 'Ой! Привіт! 👋', 'Я Лумі! ✨', 'Вчимося далі?',
  'Ти чудово справляєшся!', 'Ще одне слово? 📚', 'Обережно, я світлячок!', 'Let\'s go! Тобто — вперед!',
];
const SPIN_PHRASES = ['Ві-і-і-і!', 'Голова обертом! 🌀', 'Ух, як весело!'];

// ---------------------------------------------------------------- geometry

const f = (n) => Math.round(n * 100) / 100;
const rad = (d) => (d * Math.PI) / 180;

function bodyPath() {
  const { cx, cy, rx, ry } = BODY;
  const n = 144, pts = [];
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n, c = Math.cos(t), s = Math.sin(t);
    const e = 2 + 0.9 * Math.max(0, s);
    const x = Math.sign(c) * Math.abs(c) ** (2 / e), y = Math.sign(s) * Math.abs(s) ** (2 / e);
    const w = 1 + 0.06 * s, lift = s < 0 ? 1.06 : 1;
    pts.push(`${f(cx + rx * x * w)} ${f(cy + ry * y * lift)}`);
  }
  return 'M' + pts.join('L') + 'Z';
}

// cubic approximation of an elliptical arc (degrees, 0 = right, 90 = down)
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
const MOUTHS = { // shape, stroke width, tongue [cx, cy, rx, ry, opacity]
  smile: [mouthLine(256, 330, 16, 13, 25, 155), 6.5, [256, 340, 6, 4, 0]],
  smile_open: [mouthOpen(256, 334, 17, 15), 8, [258, 348, 10.5, 7.5, 1]],
  big_open: [mouthOpen(256, 332, 26, 26, 0.1), 8, [259, 356, 16, 13, 1]],
  grin: [mouthOpen(258, 334, 18, 13, 0.12, -0.18), 8, [260, 346, 11, 6.5, 1]],
  smug: [mouthLine(256, 328, 20, 12, 20, 160), 6.5, [256, 336, 6, 4, 0]],
  o: [mouthOpen(256, 340, 12, 15, 1), 8, [256, 355, 8, 6, 1]],
  sad: [mouthLine(256, 346, 14, 9, 335, 205), 6.5, [256, 342, 6, 4, 0]],
  hmm: [[258, 334, 252, 329, 246, 329, 240, 336.5, 234, 343, 228, 342, 222, 338,
    228, 342, 234, 343, 240, 336.5, 246, 329, 252, 329, 258, 334], 6.5, [240, 338, 6, 4, 0]],
  sleep: [mouthOpen(256, 338, 7, 8, 1), 7, [256, 346, 5, 4, 0]],
};

const BROWS = { // [x0,y0,cx,cy,x1,y1] left, right
  none: [[182, 256, 198, 250, 214, 256], [298, 256, 314, 250, 330, 256]],
  sad: [[176, 264, 195, 258, 214, 252], [298, 252, 317, 258, 336, 264]],
  raised: [[181, 259, 198, 249, 215, 259], [297, 259, 314, 249, 331, 259]],
  thinking: [[182, 262, 198, 263, 214, 264], [305, 253, 322, 241, 339, 253]],
  confident: [[180, 260, 197, 263, 214, 266], [298, 266, 315, 263, 332, 260]],
};

// eye state: solid eye transform + highlight kind + line-eye opacities
function eyeState(kind) {
  const e = { tx: 0, ty: 0, sx: 1, sy: 1, solid: 1, spark: 0, hl: 1, water: 0, happy: 0, content: 0, sleep: 0 };
  switch (kind) {
    case 'sparkly': Object.assign(e, { sx: 23 / 22, sy: 29 / 28, spark: 1 }); break;
    case 'round': Object.assign(e, { ty: -4, sy: 23 / 28, hl: 0.8 }); break;
    case 'sad': Object.assign(e, { ty: 4, sx: 21 / 22, sy: 25 / 28, hl: 1.25, water: 1 }); break;
    case 'look_up': Object.assign(e, { tx: 6, ty: -6, sx: 20 / 22, sy: 26 / 28 }); break;
    case 'happy': case 'content': case 'sleep':
      Object.assign(e, { solid: 0, sy: 0.15, [kind]: 1 }); break;
  }
  return e;
}

function armState(kind, side) {
  const piv = side === 'l' ? PIVOT_L : PIVOT_R;
  let o = ARM_POSES[kind];
  if (!o) o = ARM_POSES.rest;
  const ox = side === 'l' ? o[0] : 512 - o[0];
  const dx = ox - piv[0], dy = o[1] - piv[1];
  let a = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (side === 'l' && a < 0) a += 360; // left arm lives in (0..360): no sweeping through the body
  return { a, len: kind === 'hidden' ? 0 : Math.hypot(dx, dy), fist: kind === 'fist' ? 1 : 0 };
}

// flat numeric pose for tweening
function poseOf(name, faceOverride) {
  const P = POSES[name], F = faceOverride ? POSES[faceOverride] : P;
  const v = {};
  const put = (pre, o) => { for (const k in o) v[pre + k] = o[k]; };
  put('eL_', eyeState(F.eyes[0]));
  put('eR_', eyeState(F.eyes[1]));
  const m = MOUTHS[F.mouth];
  m[0].forEach((n, i) => (v['m' + i] = n));
  v.mw = m[1];
  ['tx', 'ty', 'trx', 'try', 'to'].forEach((k, i) => (v[k] = m[2][i]));
  const br = BROWS[F.brows || 'none'];
  br[0].forEach((n, i) => (v['bl' + i] = n));
  br[1].forEach((n, i) => (v['br' + i] = n));
  v.bo = F.brows ? 1 : 0;
  put('aL_', armState(P.arms[0], 'l'));
  put('aR_', armState(P.arms[1], 'r'));
  const an = ANTENNA[P.antenna];
  Object.assign(v, { p1x: an[0][0], p1y: an[0][1], p2x: an[1][0], p2y: an[1][1], sx: an[2][0], sy: an[2][1], sr: an[3], ss: an[4] });
  v.chin = P.chin || 0;
  v.glow = P.glow || 1;
  v.cool = P.cool || 0;
  v.cheek = (F.cheek || 1) * (faceOverride ? 1.25 : 1);
  return v;
}

// ---------------------------------------------------------------- CSS

const CSS = `
.lq{position:relative;display:inline-block;flex:none;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;touch-action:manipulation;cursor:pointer;line-height:1}
.lq>svg{display:block;width:100%;height:100%;overflow:visible}
.lq svg *{transform-box:view-box}
.lq-float{animation:lqFloat 3.6s ease-in-out infinite}
.lq-shadow{transform-origin:256px 452px;animation:lqShadow 3.6s ease-in-out infinite}
.lq-breath{transform-origin:256px 448px;animation:lqBreath 3.2s ease-in-out infinite}
.lq-act,.lq-react{transform-origin:256px 448px}
.lq-ant{transform-origin:252px 198px;animation:lqSway 2.8s ease-in-out infinite alternate}
.lq-twinkle{animation:lqTwinkle 2.2s ease-in-out infinite}
.lq-halo{animation:lqHalo 2.2s ease-in-out infinite}
.lq-glint{animation:lqGlint 4.4s ease-in-out infinite;transform:scale(0)}
.lq-glow{animation:lqGlow 3.2s ease-in-out infinite}
.lq-look{transition:transform .35s cubic-bezier(.3,1.4,.5,1)}
.lq.lq-blink .lq-lid{animation:lqBlink .17s ease-in-out}
@keyframes lqFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes lqShadow{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.9);opacity:.75}}
@keyframes lqBreath{0%,100%{transform:scale(1,1)}50%{transform:scale(.983,1.03)}}
@keyframes lqSway{from{transform:rotate(-4deg)}to{transform:rotate(5deg)}}
@keyframes lqTwinkle{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.09) rotate(6deg)}}
@keyframes lqHalo{0%,100%{opacity:.75}50%{opacity:1}}
@keyframes lqGlint{0%,70%,100%{transform:scale(0) rotate(0)}80%{transform:scale(1) rotate(45deg)}90%{transform:scale(0) rotate(90deg)}}
@keyframes lqGlow{0%,100%{opacity:.85}50%{opacity:1}}
@keyframes lqBlink{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.08)}}

/* accessories */
.lq-acc{opacity:0;transition:opacity .3s}
.lq-acc.on{opacity:1}
.lq-acc:not(.on) *{animation:none!important}
.lq-pop{animation:lqPop .5s cubic-bezier(.3,1.7,.5,1) both}
.on .lq-q{animation:lqPop .5s cubic-bezier(.3,1.7,.5,1) both,lqBob 1.8s ease-in-out .5s infinite alternate}
.on .lq-ex{animation:lqPop .45s cubic-bezier(.3,1.9,.5,1) both,lqWobble .5s ease-in-out .45s 3}
.on .lq-z{animation:lqZ 3.3s ease-in-out infinite both}
.on .lq-tear{animation:lqTear 2.6s ease-in infinite both}
.on .lq-medal{animation:lqMedalIn .7s cubic-bezier(.3,1.6,.5,1) both,lqSwing 2.4s ease-in-out .7s infinite alternate}
.lq-medal{transform-origin:0 -26px}
.on .lq-spk{animation:lqSpark 1.9s ease-in-out infinite both}
.on .lq-heart{animation:lqHeart 1.6s ease-in-out infinite both}
.on .lq-blinkline{animation:lqLines .45s ease-in-out infinite alternate both}
.on .lq-conf{animation:lqConf 3.4s linear infinite both}
.on .lq-raysr{animation:lqSpin 26s linear infinite}
.lq-rays{transform-origin:256px 300px}
@keyframes lqPop{0%{transform:scale(0) rotate(-20deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes lqBob{from{transform:translateY(0) rotate(-4deg)}to{transform:translateY(-10px) rotate(5deg)}}
@keyframes lqWobble{0%,100%{transform:rotate(0)}30%{transform:rotate(-12deg)}70%{transform:rotate(10deg)}}
@keyframes lqZ{0%{transform:translate(-26px,34px) scale(.3);opacity:0}25%{opacity:1}80%{opacity:1}100%{transform:translate(12px,-26px) scale(1.15);opacity:0}}
@keyframes lqTear{0%{transform:translateY(-8px) scale(0);opacity:0}15%{transform:translateY(0) scale(1);opacity:1}70%{transform:translateY(30px) scale(1,1.08);opacity:1}100%{transform:translateY(44px) scale(.8);opacity:0}}
@keyframes lqMedalIn{0%{transform:scale(0) rotate(-40deg)}100%{transform:scale(1) rotate(0)}}
@keyframes lqSwing{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}
@keyframes lqSpark{0%,100%{transform:scale(.55) rotate(0);opacity:.45}50%{transform:scale(1.1) rotate(45deg);opacity:1}}
@keyframes lqHeart{0%,100%{transform:translateY(0) scale(1)}15%{transform:translateY(-3px) scale(1.18)}30%{transform:translateY(-5px) scale(1)}60%{transform:translateY(-8px) scale(1.06)}}
@keyframes lqLines{from{opacity:.25;transform:scale(.92)}to{opacity:1;transform:scale(1.04)}}
@keyframes lqConf{0%{transform:translateY(-36px) rotate(0);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateY(70px) rotate(300deg);opacity:0}}
@keyframes lqSpin{to{transform:rotate(360deg)}}

/* emotion actions */
.lq-e-hello .lq-act{animation:lqSwayBody 1.8s ease-in-out infinite alternate}
.lq-e-hello .lq-armact-r{animation:lqWave .42s ease-in-out infinite alternate}
.lq-e-happy .lq-act{animation:lqHop 1.25s ease-in-out infinite}
.lq-e-excited .lq-act{animation:lqJump .82s ease-in-out infinite}
.lq-e-excited .lq-armact-l{animation:lqWiggleL .41s ease-in-out infinite alternate}
.lq-e-excited .lq-armact-r{animation:lqWiggleR .41s ease-in-out infinite alternate}
.lq-e-thinking .lq-act{animation:lqTiltIn .5s ease-out both,lqTilt 3s ease-in-out .5s infinite alternate}
.lq-e-surprised .lq-act{animation:lqJolt .6s ease-out both}
.lq-e-surprised .lq-armact-l,.lq-e-surprised .lq-armact-r{animation:lqTremble .12s linear 6}
.lq-e-sad .lq-act{animation:lqSinkIn .7s ease-out both,lqSadSway 4s ease-in-out .7s infinite alternate}
.lq-e-proud .lq-act{animation:lqPuff 2.4s ease-in-out infinite}
.lq-e-cheer .lq-act{animation:lqPumpBody .7s ease-in-out infinite}
.lq-e-cheer .lq-armact-r{animation:lqPump .7s cubic-bezier(.5,0,.3,1) infinite}
.lq-e-sleepy .lq-act{animation:lqDoze 4.6s ease-in-out infinite}
.lq-e-sleepy .lq-breath{animation-duration:4.6s}
.lq-e-sleepy .lq-float{animation-duration:5.2s}
.lq-e-sleepy .lq-shadow{animation-duration:5.2s}
.lq-armact-l,.lq-armact-r{transform-origin:0 0}
@keyframes lqSwayBody{from{transform:rotate(-1.5deg)}to{transform:rotate(2deg)}}
@keyframes lqWave{from{transform:rotate(-16deg)}to{transform:rotate(14deg)}}
@keyframes lqHop{0%,100%{transform:translateY(0) scale(1)}12%{transform:translateY(0) scale(1.07,.92)}36%{transform:translateY(-30px) scale(.95,1.06)}56%{transform:translateY(0) scale(1.09,.9)}70%{transform:translateY(0) scale(.97,1.03)}82%{transform:translateY(0) scale(1)}}
@keyframes lqJump{0%,100%{transform:translateY(0) scale(1)}10%{transform:translateY(0) scale(1.1,.88)}40%{transform:translateY(-46px) scale(.93,1.08) rotate(-3deg)}62%{transform:translateY(0) scale(1.11,.88)}78%{transform:translateY(0) scale(.97,1.03)}}
@keyframes lqWiggleL{from{transform:rotate(-12deg)}to{transform:rotate(10deg)}}
@keyframes lqWiggleR{from{transform:rotate(12deg)}to{transform:rotate(-10deg)}}
@keyframes lqTiltIn{from{transform:rotate(0)}to{transform:rotate(-5deg)}}
@keyframes lqTilt{from{transform:rotate(-5deg)}to{transform:rotate(-8deg) translateX(-3px)}}
@keyframes lqJolt{0%{transform:translateY(0) scale(1)}15%{transform:translateY(0) scale(1.08,.9)}40%{transform:translateY(-26px) scale(.92,1.1)}65%{transform:translateY(0) scale(1.06,.94)}82%{transform:translateY(0) scale(.98,1.02)}100%{transform:translateY(0) scale(1)}}
@keyframes lqTremble{0%,100%{transform:rotate(0)}25%{transform:rotate(3deg)}75%{transform:rotate(-3deg)}}
@keyframes lqSinkIn{from{transform:translateY(0) scale(1)}to{transform:translateY(8px) scale(1.035,.95)}}
@keyframes lqSadSway{from{transform:translateY(8px) scale(1.035,.95) rotate(-1.5deg)}to{transform:translateY(9px) scale(1.04,.945) rotate(1.5deg)}}
@keyframes lqPuff{0%,100%{transform:scale(1)}50%{transform:scale(1.035,1.05)}}
@keyframes lqPumpBody{0%,100%{transform:translateY(0)}35%{transform:translateY(-6px)}}
@keyframes lqPump{0%,100%{transform:rotate(0)}35%{transform:rotate(-10deg)}65%{transform:rotate(22deg)}}
@keyframes lqDoze{0%,100%{transform:rotate(0)}40%{transform:rotate(3deg) translateY(2px)}55%{transform:rotate(3.5deg) translateY(3px)}}

/* reactions */
.lq-r-jump .lq-react{animation:lqRJump .6s cubic-bezier(.3,.7,.4,1)}
.lq-r-tap .lq-react{animation:lqRJump .6s cubic-bezier(.3,.7,.4,1)}
.lq-r-giggle .lq-react{animation:lqRGiggle .6s ease-in-out}
.lq-r-spin .lq-react{transform-origin:256px 310px;animation:lqRSpin .9s cubic-bezier(.5,0,.3,1)}
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
  border:2.5px solid #482c56;box-shadow:0 4px 0 rgba(72,44,86,.18),0 8px 22px rgba(72,44,86,.18);
  font:700 var(--lq-fs,15px)/1.3 Inter,'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif;text-align:center;
  opacity:0;pointer-events:none;transition:opacity .2s,transform .35s cubic-bezier(.3,1.6,.5,1);white-space:normal;overflow-wrap:break-word}
.lq-bubble::after{content:'';position:absolute;left:50%;bottom:-8px;width:13px;height:13px;margin-left:-7px;background:#fff;
  border-right:2.5px solid #482c56;border-bottom:2.5px solid #482c56;transform:rotate(45deg);border-bottom-right-radius:3px}
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
  .lq-acc.on .lq-z,.lq-acc.on .lq-tear{opacity:1}
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
    <polygon points="${starPts(0, 0, r, r * 0.3, 0, 4)}" fill="${col}" stroke="${C.outline}" stroke-width="${f(Math.max(2.5, r * 0.16) * 2)}" stroke-linejoin="round" paint-order="stroke"/></g></g>`;
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
  return `<g transform-origin="${cx} ${cy}" style="transform-origin:${cx}px ${cy}px" class="${cls}" stroke="${C.outline}" stroke-width="5.5" stroke-linecap="round">${s}</g>`;
}
function symbolSVG(text, x, y, size, col, angle, cls, delay = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${angle})"><g class="${cls}"${delay ? ` style="animation-delay:${delay}s"` : ''}>
    <text x="0" y="${f(size * 0.36)}" text-anchor="middle" font-family="Poppins,'Baloo 2','Nunito','Arial Rounded MT Bold',Inter,system-ui,sans-serif"
      font-weight="800" font-size="${size}" fill="${col}" stroke="${C.outline}" stroke-width="${f(size * 0.18)}" stroke-linejoin="round" paint-order="stroke">${text}</text></g></g>`;
}

function buildSVG(p) {
  const bp = bodyPath();
  const grad = (id, extra = '') => `<linearGradient id="${p}${id}" gradientUnits="userSpaceOnUse" x1="0" y1="176.6" x2="0" y2="432" ${extra}>
    ${C.body.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

  const arm = (side, layer) => {
    const out = layer === 'o';
    const stroke = out ? C.outline : `url(#${p}arm${side})`;
    const w = out ? ARM_R * 2 + 11 : ARM_R * 2;
    const knob = out ? `fill="${C.outline}"` : `fill="url(#${p}arm${side})"`;
    return `<g data-arm="${side}${layer}"><g class="lq-armact-${side === 'L' ? 'l' : 'r'}">
      <line x1="0" y1="0" x2="60" y2="0" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/>
      <circle class="lq-knob" cx="60" cy="0" r="0" ${knob}/>
      ${out ? '' : `<g class="lq-crease" opacity="0" stroke="${C.outline}" stroke-width="3.6" stroke-linecap="round" fill="none">
        <line x1="-8" y1="-25" x2="-8" y2="-15"/><line x1="6" y1="-25" x2="6" y2="-15"/>
        <path d="${arcD(-12, 2, 9, 9, 160, 290)}"/></g>`}
    </g></g>`;
  };

  const eye = (side) => `<g transform="translate(${side === 'L' ? EYE_L : EYE_R})"><g class="lq-look"><g class="lq-lid">
    <g data-solid="${side}">
      <ellipse rx="22" ry="28" fill="url(#${p}eye)"/>
      <circle data-hl="${side}" cx="7" cy="-10" r="7.9" fill="#fff"/>
      <polygon data-spk="${side}" points="${starPts(6.6, -8.4, 13.6, 4.4, 0, 4)}" fill="#fff" opacity="0"/>
      <circle cx="-7.9" cy="10" r="3.5" fill="#fff"/>
      <path data-water="${side}" d="${arcD(0, 0, 15, 17, 40, 140)}" stroke="#d2dcff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0"/>
    </g>
    <path data-happy="${side}" d="${arcD(0, 8, 20, 20, 200, 340)}" stroke="${C.eyeDark}" stroke-width="8" fill="none" stroke-linecap="round" opacity="0"/>
    <path data-content="${side}" d="${arcD(0, 4, 21, 12, 195, 345)}" stroke="${C.eyeDark}" stroke-width="8" fill="none" stroke-linecap="round" opacity="0"/>
    <g data-sleep="${side}" opacity="0" stroke="${C.eyeDark}" fill="none" stroke-linecap="round">
      <path d="${arcD(0, -2, 20, 10, 20, 160)}" stroke-width="8"/>
      ${[40, 90, 140].map((a) => `<line x1="${f(20 * Math.cos(rad(a)))}" y1="${f(-2 + 10 * Math.sin(rad(a)))}" x2="${f(27 * Math.cos(rad(a)))}" y2="${f(-2 + 17 * Math.sin(rad(a)))}" stroke-width="4"/>`).join('')}
    </g></g></g></g>`;

  // confetti pieces for "proud"
  const confCols = ['#ff788c', '#6eb4ff', '#ffce50', '#8cdca0', '#be96ff'];
  const spots = [[60, 70], [120, 40], [440, 60], [392, 30], [470, 160], [36, 200], [90, 150], [430, 230],
    [480, 300], [30, 300], [70, 400], [450, 380], [170, 30], [340, 20], [20, 120], [500, 220]];
  const conf = spots.map(([x, y], i) => {
    const col = confCols[i % 5], d = (i * 0.37) % 3.4, dur = 2.8 + (i % 4) * 0.35;
    const shape = i % 3 === 2 ? `<circle r="5" fill="${col}"/>` : `<rect x="-3.5" y="-7" width="7" height="14" rx="2" fill="${col}" transform="rotate(${i * 47})"/>`;
    return `<g transform="translate(${x} ${y})"><g class="lq-conf" style="animation-delay:-${f(d)}s;animation-duration:${dur}s">
      <g stroke="${C.outline}" stroke-width="4.4" paint-order="stroke">${shape}</g></g></g>`;
  }).join('');

  const rays = Array.from({ length: 12 }, (_, i) => `<path d="M256 300L${f(256 + 300 * Math.cos(rad(i * 30 - 6)))} ${f(300 + 300 * Math.sin(rad(i * 30 - 6)))}L${f(256 + 300 * Math.cos(rad(i * 30 + 6)))} ${f(300 + 300 * Math.sin(rad(i * 30 + 6)))}Z"/>`).join('');

  const medal = () => {
    let s = '';
    for (const [sx, col] of [[-1, '#6096ff'], [1, '#ff6e82']]) {
      s += `<polygon points="${[[sx * 4, 0], [sx * 22, 6], [sx * 26, 44], [sx * 16, 36], [sx * 8, 46]].map((q) => q.join(',')).join(' ')}" fill="${col}" stroke="${C.outline}" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/>`;
    }
    let ros = '';
    for (let i = 0; i < 12; i++) ros += `<circle cx="${f(21 * Math.cos((2 * Math.PI * i) / 12))}" cy="${f(21 * Math.sin((2 * Math.PI * i) / 12))}" r="8"/>`;
    s += `<g fill="${C.outline}" transform="scale(1.11)">${ros}<circle r="22"/></g><g fill="#ffaa3c">${ros}<circle r="22"/></g>`;
    s += `<circle r="17" fill="url(#${p}coin)" stroke="${C.outline}" stroke-width="5" paint-order="stroke"/>`;
    s += `<polygon points="${starPts(0, 1, 10, 4.6)}" fill="#fff" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>`;
    return s;
  };

  return `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
  ${grad('body')}${grad('armL')}${grad('armR')}
  <radialGradient id="${p}glowW"><stop offset="0" stop-color="${C.glow}" stop-opacity="1"/><stop offset=".5" stop-color="${C.glow}" stop-opacity=".72"/><stop offset=".78" stop-color="${C.glow}" stop-opacity=".22"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}glowC"><stop offset="0" stop-color="${C.glowCool}" stop-opacity="1"/><stop offset=".5" stop-color="${C.glowCool}" stop-opacity=".65"/><stop offset=".78" stop-color="${C.glowCool}" stop-opacity=".2"/><stop offset="1" stop-color="${C.glowCool}" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}halo"><stop offset="0" stop-color="#ffe278" stop-opacity=".95"/><stop offset=".45" stop-color="#ffeca0" stop-opacity=".55"/><stop offset="1" stop-color="#ffeca0" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}star" cx=".4" cy=".36" r=".62"><stop offset="0" stop-color="${C.starCore}"/><stop offset=".45" stop-color="#ffe48a"/><stop offset="1" stop-color="${C.starEdge}"/></radialGradient>
  <radialGradient id="${p}coin" cx=".38" cy=".34" r=".7"><stop offset="0" stop-color="#fff6be"/><stop offset="1" stop-color="#ffc432"/></radialGradient>
  <radialGradient id="${p}shade" gradientUnits="userSpaceOnUse" cx="300" cy="470" r="220" gradientTransform="translate(300 470) scale(1 .55) translate(-300 -470)"><stop offset="0" stop-color="#9678dc" stop-opacity=".5"/><stop offset=".6" stop-color="#9678dc" stop-opacity=".22"/><stop offset="1" stop-color="#9678dc" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}light" gradientUnits="userSpaceOnUse" cx="200" cy="236" r="110" gradientTransform="translate(200 236) scale(1 .72) translate(-200 -236)"><stop offset="0" stop-color="#fffff0" stop-opacity=".85"/><stop offset=".5" stop-color="#fffff0" stop-opacity=".4"/><stop offset="1" stop-color="#fffff0" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}cheek"><stop offset="0" stop-color="${C.cheek}" stop-opacity=".75"/><stop offset=".6" stop-color="${C.cheek}" stop-opacity=".45"/><stop offset="1" stop-color="${C.cheek}" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}shadow"><stop offset="0" stop-color="#482c56" stop-opacity=".28"/><stop offset="1" stop-color="#482c56" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}ray" gradientUnits="userSpaceOnUse" cx="256" cy="300" r="260"><stop offset=".25" stop-color="#ffe08a" stop-opacity=".6"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient>
  <linearGradient id="${p}eye" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.eyeDark}"/><stop offset=".55" stop-color="${C.eyeDark}"/><stop offset="1" stop-color="${C.eyeLight}"/></linearGradient>
  <clipPath id="${p}clip"><path d="${bp}"/></clipPath>
  <clipPath id="${p}mclip"><path data-mclip=""/></clipPath>
</defs>
<g class="lq-acc" data-acc="rays"><g class="lq-rays"><g class="lq-raysr" style="transform-origin:256px 300px" fill="url(#${p}ray)">${rays}</g></g></g>
<g class="lq-glow">
  <ellipse data-glow="w" cx="256" cy="300" rx="222" ry="208" fill="url(#${p}glowW)"/>
  <ellipse data-glow="c" cx="256" cy="300" rx="222" ry="208" fill="url(#${p}glowC)" opacity="0"/>
</g>
<g class="lq-back">
  <g class="lq-acc" data-acc="confetti">${conf}</g>
  <g class="lq-acc" data-acc="sparkMany">${[[62, 120, 20, '#ffd65a'], [452, 116, 22, '#ffa0be'], [40, 330, 13, '#a0c8ff'], [476, 320, 15, '#ffd65a'],
    [150, 60, 12, '#bea0ff'], [380, 52, 14, '#a0e6be'], [96, 440, 11, '#ffa0be'], [430, 448, 12, '#bea0ff']].map((s, i) => sparkleSVG(...s, (i * 0.29) % 1.9, 1.5 + (i % 3) * 0.3)).join('')}</g>
  <g class="lq-acc" data-acc="sparkHello">${[[66, 160, 16, '#ffd65a'], [110, 84, 10, '#bea0ff'], [62, 420, 10, '#ffa0be'], [462, 410, 11, '#a0c8ff']].map((s, i) => sparkleSVG(...s, i * 0.5)).join('')}</g>
  <g class="lq-acc" data-acc="sparkHappy">${[[70, 140, 16, '#ffd65a'], [448, 300, 12, '#bea0ff'], [60, 420, 10, '#ffa0be']].map((s, i) => sparkleSVG(...s, i * 0.6)).join('')}</g>
  <g class="lq-acc" data-acc="sparkCheer">${[[66, 150, 16, '#ffd65a'], [110, 70, 10, '#a0e6be'], [60, 420, 10, '#ffa0be'], [466, 400, 12, '#ffd65a']].map((s, i) => sparkleSVG(...s, i * 0.45)).join('')}</g>
  <g class="lq-acc" data-acc="hearts">${heartSVG(440, 176, 22, '#ff7896', 14, 0)}${heartSVG(80, 196, 15, '#ffa0be', -16, 0.5)}</g>
</g>
<ellipse class="lq-shadow" cx="256" cy="452" rx="118" ry="15" fill="url(#${p}shadow)"/>
<g class="lq-float"><g class="lq-act"><g class="lq-react"><g class="lq-breath">
  <g stroke="${C.outline}" stroke-width="10" paint-order="stroke" fill="${C.foot}">
    <ellipse cx="206" cy="428" rx="36" ry="22"/><ellipse cx="306" cy="428" rx="36" ry="22"/>
  </g>
  <g fill="${C.footHl}" opacity=".7"><ellipse cx="198" cy="438" rx="14" ry="6"/><ellipse cx="298" cy="438" rx="14" ry="6"/></g>
  <g class="lq-ant">
    <circle data-halo="" r="80" fill="url(#${p}halo)" class="lq-halo"/>
    <path data-stem="" fill="none" stroke="${C.outline}" stroke-width="9.5" stroke-linecap="round"/>
    <path data-stem="" fill="none" stroke="${C.stem}" stroke-width="4.5" stroke-linecap="round"/>
    <g data-star=""><g class="lq-twinkle">
      <polygon points="${starPts(0, 0, 33, 16.5)}" fill="url(#${p}star)" stroke="${C.outline}" stroke-width="9" stroke-linejoin="round" paint-order="stroke"/>
      <ellipse cx="-8" cy="-9" rx="6" ry="4" fill="#fff" opacity=".85"/>
      <g transform="translate(22 -24)"><polygon class="lq-glint" points="${starPts(0, 0, 11, 2.5, 0, 4)}" fill="#fff"/></g>
    </g></g>
  </g>
  ${arm('L', 'o')}${arm('R', 'o')}
  <path d="${bp}" fill="url(#${p}body)" stroke="${C.outline}" stroke-width="11" stroke-linejoin="round" paint-order="stroke"/>
  ${arm('L', 'f')}${arm('R', 'f')}
  <g clip-path="url(#${p}clip)">
    <rect x="40" y="330" width="460" height="200" fill="url(#${p}shade)"/>
    <ellipse cx="200" cy="236" rx="120" ry="90" fill="url(#${p}light)"/>
    <ellipse cx="176" cy="222" rx="20" ry="12" fill="#fff" opacity=".8"/>
    <ellipse cx="204" cy="206" rx="7" ry="5" fill="#fff" opacity=".8"/>
  </g>
  <g data-chin="" opacity="0">
    <g stroke="${C.outline}" stroke-width="9" paint-order="stroke" fill="url(#${p}body)">
      <line x1="368" y1="398" x2="310" y2="382" stroke-width="41" stroke-linecap="round"/>
      <ellipse cx="296" cy="376" rx="26.5" ry="24.5" fill="${C.outline}" stroke="none"/>
      <line x1="368" y1="398" x2="310" y2="382" stroke="url(#${p}body)" stroke-width="32" stroke-linecap="round"/>
      <ellipse cx="296" cy="376" rx="22" ry="20" stroke="none"/>
    </g>
    <g stroke="${C.outline}" stroke-width="3" fill="none" stroke-linecap="round">
      <path d="${arcD(289, 370, 5, 6, 200, 300)}"/><path d="${arcD(301, 370, 5, 6, 200, 300)}"/>
    </g>
    <ellipse cx="288" cy="366" rx="7" ry="4" fill="#fffff5" opacity=".7"/>
  </g>
  <g data-cheeks="">
    <ellipse cx="164" cy="338" rx="30" ry="18" fill="url(#${p}cheek)"/>
    <ellipse cx="348" cy="338" rx="30" ry="18" fill="url(#${p}cheek)"/>
    <g stroke="#ff96aa" stroke-width="2.4" stroke-linecap="round" opacity=".55">
      ${[164, 348].map((cx) => [-8, 0, 8].map((k) => `<line x1="${cx + k + 2}" y1="334" x2="${cx + k - 2}" y2="342"/>`).join('')).join('')}
    </g>
  </g>
  ${eye('L')}${eye('R')}
  <g fill="none" stroke="${C.outline}" stroke-width="7" stroke-linecap="round">
    <path data-brow="l"/><path data-brow="r"/>
  </g>
  <path data-mouth="" fill="${C.mouth}" stroke="${C.outline}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"/>
  <ellipse data-tongue="" fill="${C.tongue}" clip-path="url(#${p}mclip)"/>
  <g class="lq-acc" data-acc="tear"><g transform="translate(184 344)"><g class="lq-tear">
    <path d="M0 -21 C4 -13 11 -6 11 2 A11 11 0 0 1 -11 2 C-11 -6 -4 -13 0 -21Z" fill="#8cc8ff" stroke="${C.outline}" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/>
    <ellipse cx="-3.5" cy="3" rx="3" ry="4.5" fill="#fff" opacity=".95"/></g></g></g>
  <g class="lq-acc" data-acc="medal"><g transform="translate(312 392)"><g class="lq-medal">${medal()}</g></g></g>
</g></g></g>
  <g class="lq-acc" data-acc="waveLines">${linesSVG(432, 222, 46, -70, 10, 3, 15)}</g>
  <g class="lq-acc" data-acc="fistLines">${linesSVG(432, 208, 50, -110, -10, 3, 15)}</g>
</g>
<g class="lq-front">
  <g class="lq-acc" data-acc="popLines">${linesSVG(256, 260, 196, -150, -120, 3, 18)}${linesSVG(256, 260, 196, -60, -30, 3, 18)}</g>
  <g class="lq-acc" data-acc="question">${symbolSVG('?', 418, 140, 120, '#9682ff', -12, 'lq-q')}<g class="lq-sp1">${sparkleSVG(462, 236, 10, '#ffd65a', 0.3)}</g></g>
  <g class="lq-acc" data-acc="exclaim">${symbolSVG('!', 428, 128, 120, '#ff7878', -10, 'lq-ex')}</g>
  <g class="lq-acc" data-acc="zzz">${symbolSVG('Z', 360, 140, 64, '#c8d2ff', 10, 'lq-z')}${symbolSVG('z', 410, 96, 50, '#c8d2ff', 14, 'lq-z', 1.1)}${symbolSVG('z', 446, 58, 38, '#c8d2ff', 18, 'lq-z', 2.2)}</g>
</g>
</svg>`;
}

// ---------------------------------------------------------------- component

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutBack = (t) => { const s = 1.3; return 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2; };
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    stems: qa('[data-stem]'), star: q('[data-star]'), halo: q('[data-halo]'),
    mouth: q('[data-mouth]'), mclip: q('[data-mclip]'), tongue: q('[data-tongue]'),
    browL: q('[data-brow="l"]'), browR: q('[data-brow="r"]'),
    chin: q('[data-chin]'), cheeks: q('[data-cheeks]'),
    glowW: q('[data-glow="w"]'), glowC: q('[data-glow="c"]'),
    gradL: q(`#${p}armL`), gradR: q(`#${p}armR`),
    acc: Object.fromEntries(qa('[data-acc]').map((n) => [n.dataset.acc, n])),
    looks: qa('.lq-look'),
  };
  const arms = {};
  for (const s of ['L', 'R']) {
    arms[s] = ['o', 'f'].map((l) => {
      const g = q(`[data-arm="${s}${l}"]`);
      return { g, line: g.querySelector('line'), knob: g.querySelector('.lq-knob'), crease: g.querySelector('.lq-crease') };
    });
  }
  const eyes = {};
  for (const s of ['L', 'R']) {
    eyes[s] = {
      solid: q(`[data-solid="${s}"]`), hl: q(`[data-hl="${s}"]`), spk: q(`[data-spk="${s}"]`), water: q(`[data-water="${s}"]`),
      happy: q(`[data-happy="${s}"]`), content: q(`[data-content="${s}"]`), sleep: q(`[data-sleep="${s}"]`),
    };
  }

  let cur = poseOf(emotion);
  let emo = emotion, face = null;
  let raf = 0;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const clearLater = (t) => { if (t) { clearTimeout(t); timers.delete(t); } };

  function render(v) {
    // eyes
    for (const s of ['L', 'R']) {
      const e = eyes[s], k = `e${s}_`;
      const sol = clamp01(v[k + 'solid']);
      e.solid.setAttribute('transform', `translate(${f(v[k + 'tx'])} ${f(v[k + 'ty'])}) scale(${f(v[k + 'sx'])} ${f(Math.max(0.05, v[k + 'sy']))})`);
      e.solid.setAttribute('opacity', f(sol));
      e.hl.setAttribute('r', f(7.9 * v[k + 'hl'] * (1 - clamp01(v[k + 'spark']))));
      e.spk.setAttribute('opacity', f(clamp01(v[k + 'spark'])));
      e.water.setAttribute('opacity', f(clamp01(v[k + 'water'])));
      for (const t of ['happy', 'content', 'sleep']) {
        const o = clamp01(v[k + t]);
        e[t].setAttribute('opacity', f(o));
        e[t].setAttribute('transform', `scale(1 ${f(0.3 + 0.7 * o)})`);
      }
    }
    // mouth
    const m = [];
    for (let i = 0; i < 26; i++) m.push(v['m' + i]);
    const d = cubicD(m);
    R.mouth.setAttribute('d', d);
    R.mouth.setAttribute('stroke-width', f(v.mw));
    R.mclip.setAttribute('d', d);
    R.tongue.setAttribute('cx', f(v.tx)); R.tongue.setAttribute('cy', f(v.ty));
    R.tongue.setAttribute('rx', f(Math.max(0, v.trx))); R.tongue.setAttribute('ry', f(Math.max(0, v.try)));
    R.tongue.setAttribute('opacity', f(clamp01(v.to)));
    // brows
    const bd = (pre) => `M${f(v[pre + 0])} ${f(v[pre + 1])}Q${f(v[pre + 2])} ${f(v[pre + 3])} ${f(v[pre + 4])} ${f(v[pre + 5])}`;
    R.browL.setAttribute('d', bd('bl')); R.browR.setAttribute('d', bd('br'));
    R.browL.parentNode.setAttribute('opacity', f(clamp01(v.bo)));
    // arms
    for (const s of ['L', 'R']) {
      const k = `a${s}_`, piv = s === 'L' ? PIVOT_L : PIVOT_R;
      const a = v[k + 'a'], len = Math.max(0, v[k + 'len']), fist = clamp01(v[k + 'fist']);
      for (const part of arms[s]) {
        part.g.setAttribute('transform', `translate(${piv[0]} ${piv[1]}) rotate(${f(a)})`);
        part.line.setAttribute('x2', f(len));
        part.knob.setAttribute('cx', f(len));
        part.knob.setAttribute('r', f(fist * (part === arms[s][0] ? 26 + 5.5 : 26)));
        if (part.crease) {
          part.crease.setAttribute('opacity', f(fist));
          part.crease.setAttribute('transform', `translate(${f(len)} 0) rotate(${f(-a)})`);
        }
      }
      (s === 'L' ? R.gradL : R.gradR).setAttribute('gradientTransform', `rotate(${f(-a)}) translate(${-piv[0]} ${-piv[1]})`);
    }
    // antenna
    const stem = `M252 196Q${f(v.p1x)} ${f(v.p1y)} ${f(v.p2x)} ${f(v.p2y)}`;
    R.stems.forEach((n) => n.setAttribute('d', stem));
    R.star.setAttribute('transform', `translate(${f(v.sx)} ${f(v.sy)}) rotate(${f(v.sr)}) scale(${f(v.ss)})`);
    R.halo.setAttribute('cx', f(v.sx)); R.halo.setAttribute('cy', f(v.sy));
    R.halo.setAttribute('r', f(70 * Math.max(0.4, v.glow)));
    // misc
    R.chin.setAttribute('opacity', f(clamp01(v.chin)));
    R.chin.setAttribute('transform', `translate(${f((1 - clamp01(v.chin)) * 30)} ${f((1 - clamp01(v.chin)) * 20)})`);
    R.cheeks.setAttribute('opacity', f(Math.max(0, v.cheek)));
    const c = clamp01(v.cool);
    R.glowW.setAttribute('opacity', f(Math.min(1, v.glow) * (1 - c)));
    R.glowW.setAttribute('transform', `translate(256 300) scale(${f(0.85 + 0.15 * v.glow)}) translate(-256 -300)`);
    R.glowC.setAttribute('opacity', f(c * v.glow));
  }

  function tweenTo(target, ms = 420) {
    cancelAnimationFrame(raf);
    if (reducedMotion() || ms <= 0) { cur = { ...target }; render(cur); return; }
    const from = { ...cur }, t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms), e = easeOutBack(t);
      for (const k in target) cur[k] = from[k] + (target[k] - from[k]) * e;
      // angles: never overshoot opacities on 0/1 flags too much (render clamps)
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
  let blinkTimer = 0, lookTimer = 0;
  // екран прибрали без destroy() — зупиняємося самі (інакше таймери живуть вічно)
  let wasConnected = false;
  const gone = () => { if (el.isConnected) { wasConnected = true; return false; } if (wasConnected) { destroy(); return true; } return false; };
  function scheduleBlink() {
    blinkTimer = later(() => {
      if (gone()) return;
      const closed = ['happy', 'content', 'sleep'];
      const eyesNow = POSES[face || emo].eyes;
      if (!closed.includes(eyesNow[0]) || !closed.includes(eyesNow[1])) {
        el.classList.remove('lq-blink'); void el.offsetWidth; el.classList.add('lq-blink');
        later(() => el.classList.remove('lq-blink'), 190);
        if (Math.random() < 0.2) later(() => { el.classList.remove('lq-blink'); void el.offsetWidth; el.classList.add('lq-blink'); later(() => el.classList.remove('lq-blink'), 190); }, 260);
      }
      scheduleBlink();
    }, 2000 + Math.random() * 4000);
  }
  function scheduleLook() {
    lookTimer = later(() => {
      if (gone()) return;
      const still = ['thinking', 'sleepy', 'sad'].includes(emo) || reducedMotion();
      const x = still ? 0 : (Math.random() * 2 - 1) * 4, y = still ? 0 : (Math.random() * 2 - 1) * 2.5;
      const back = Math.random() < 0.45;
      R.looks.forEach((n) => (n.style.transform = back ? '' : `translate(${f(x)}px, ${f(y)}px)`));
      scheduleLook();
    }, 1500 + Math.random() * 2500);
  }

  // ---- speech bubble
  let typeTimer = 0, hideTimer = 0, sayResolve = null;
  function say(text, { ms } = {}) {
    clearInterval(typeTimer); clearLater(hideTimer);
    if (sayResolve) { sayResolve(); sayResolve = null; }
    text = String(text ?? '');
    if (!text) { bub.classList.remove('show'); return Promise.resolve(); }
    const chars = [...text];
    const stay = ms ?? Math.min(6000, 1600 + chars.length * 55);
    bub.classList.add('show');
    bub.setAttribute('aria-label', text);
    return new Promise((resolve) => {
      sayResolve = resolve;
      const finish = () => {
        hideTimer = later(() => { bub.classList.remove('show'); if (sayResolve === resolve) { sayResolve = null; resolve(); } }, stay);
      };
      if (reducedMotion()) { bub.textContent = text; finish(); return; }
      let i = 0;
      const caret = '<span class="lq-caret"></span>';
      const esc = (s) => s.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
      bub.innerHTML = caret;
      typeTimer = setInterval(() => {
        i += 1;
        bub.innerHTML = esc(chars.slice(0, i).join('')) + (i < chars.length ? caret : '');
        if (i >= chars.length) { clearInterval(typeTimer); finish(); }
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
    clearInterval(typeTimer);
    for (const t of timers) clearTimeout(t);
    timers.clear();
    if (sayResolve) { sayResolve(); sayResolve = null; }
    el.removeEventListener('click', onTap);
    el.remove();
  }

  const api = {
    el,
    set,
    say,
    react,
    destroy,
    get emotion() { return emo; },
  };

  render(cur);
  set(emotion);
  scheduleBlink();
  scheduleLook();
  void blinkTimer; void lookTimer;
  return api;
}

export const LUMI_EMOTIONS = EMOTIONS;
export default createLumi;
