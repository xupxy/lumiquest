// LumiQuest — анімовані SVG-персонажі (боси, Лис Фокс, герої історій, актори драм).
//
//   import { createCharacter, CHARACTERS, characterIdFor } from './characters.js?v=20261110124228';
//   const ch = createCharacter(box, 'boss_w1', { size: 160, mood: 'idle', flip: false });
//   ch.set('happy');          // idle talk happy sad surprised angry hurt win lose
//   ch.talk('Hello there!');  // lip-flap, поки «друкується» текст (або ms); ch.talk(0) — стоп
//   ch.react('hit');          // hit jump shake nod cheer
//   ch.destroy();
//
// Спільний «риг»: тінь → anim (настрій-анімація) → pose (поза) → back / body (+руки) /
// head (очі, брови, рот із 10 форм, рум'янець) / front / fx. Кожен персонаж — функція,
// що малює силует і повертає конфіг ригу. Усе в просторі 200×200. Без залежностей.

const SW = 3.2;                    // товщина обвідки
const MOUTHS = ['smile', 'smirk', 'flat', 'sad', 'wobble', 'a', 'o', 'e', 'grin', 'angry'];
const MOODS = ['idle', 'talk', 'happy', 'sad', 'surprised', 'angry', 'hurt', 'win', 'lose'];

// ---------------------------------------------------------------- кольори
const hx = (c) => {
  let s = String(c).replace('#', '');
  if (s.length === 3) s = [...s].map((x) => x + x).join('');
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
const dk = (c, t = 0.5) => mix(c, '#1d0f26', t);
const lt = (c, t = 0.4) => mix(c, '#ffffff', t);
const r1 = (v) => Math.round(v * 10) / 10;

// ---------------------------------------------------------------- контекст малювання
class Ctx {
  constructor(p) { this.p = p; this.defs = []; this.map = new Map(); this.n = 0; }
  id() { return `${this.p}${++this.n}`; }
  rg(col, { l = 0.42, d = 0.3, cx = 0.36, cy = 0.28, r = 0.85 } = {}) {
    const k = `r${col}${l}${d}${cx}${cy}${r}`;
    if (!this.map.has(k)) {
      const id = this.id();
      this.defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${lt(col, l)}"/><stop offset=".55" stop-color="${col}"/><stop offset="1" stop-color="${dk(col, d)}"/></radialGradient>`);
      this.map.set(k, id);
    }
    return `url(#${this.map.get(k)})`;
  }
  lg(c1, c2) {
    const k = `l${c1}${c2}`;
    if (!this.map.has(k)) {
      const id = this.id();
      this.defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`);
      this.map.set(k, id);
    }
    return `url(#${this.map.get(k)})`;
  }
  clip(inner) { const id = this.id(); this.defs.push(`<clipPath id="${id}">${inner}</clipPath>`); return `url(#${id})`; }
  // контур із градієнтом і обвідкою темним відтінком власного кольору
  P(d, col, o = {}) {
    const fill = o.flat ? col : (o.fill || this.rg(col, o.g));
    const w = o.w ?? SW;
    return `<path d="${d}" fill="${fill}"${w ? ` stroke="${o.s || dk(col, 0.55)}" stroke-width="${w}"` : ''} stroke-linejoin="round" stroke-linecap="round"${o.op != null ? ` opacity="${o.op}"` : ''}${o.a ? ' ' + o.a : ''}/>`;
  }
  E(cx, cy, rx, ry, col, o = {}) {
    const fill = o.flat ? col : (o.fill || this.rg(col, o.g));
    const w = o.w ?? SW;
    return `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${fill}"${w ? ` stroke="${o.s || dk(col, 0.55)}" stroke-width="${w}"` : ''}${o.op != null ? ` opacity="${o.op}"` : ''}${o.a ? ' ' + o.a : ''}/>`;
  }
  C(cx, cy, r, col, o) { return this.E(cx, cy, r, r, col, o); }
  F(d, col, op = 1) { return `<path d="${d}" fill="${col}"${op < 1 ? ` opacity="${op}"` : ''}/>`; }
  L(d, col, w = 2.5, op = 1) { return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ''}/>`; }
  limb(d, col, w, o = {}) {
    return this.L(d, o.s || dk(col, 0.55), w + SW * 2) + this.L(d, col, w) +
      (o.noHl ? '' : `<path d="${d}" fill="none" stroke="${lt(col, 0.45)}" stroke-width="${r1(w * 0.3)}" stroke-linecap="round" opacity=".55" transform="translate(${r1(-w * 0.16)} ${r1(-w * 0.16)})"/>`);
  }
  hl(cx, cy, rx, ry, rot = -25, op = 0.5) {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op}" transform="rotate(${rot} ${cx} ${cy})"/>`;
  }
  // «хмара» з кружечків з єдиною обвідкою (волосся-кучері, крона, хутро)
  blob(circles, col, o = {}) {
    const s = o.s || dk(col, 0.55);
    const fill = o.flat ? col : this.rg(col, o.g || { l: 0.3, d: 0.25, cx: 0.4, cy: 0.3, r: 0.9 });
    let a = '', b = '';
    for (const [x, y, r] of circles) {
      a += `<circle cx="${x}" cy="${y}" r="${r}" fill="${s}" stroke="${s}" stroke-width="${SW * 2}"/>`;
      b += `<circle cx="${x}" cy="${y}" r="${r}" fill="${o.flat ? col : col}"/>`;
    }
    let hi = '';
    if (!o.noHl) for (const [x, y, r] of circles) hi += `<circle cx="${r1(x - r * 0.25)}" cy="${r1(y - r * 0.3)}" r="${r1(r * 0.55)}" fill="${lt(col, 0.22)}" opacity=".7"/>`;
    return `<g>${a}${b}${hi}</g>` + (fill && false ? '' : '');
  }
}

// хвиляста/пухнаста замкнена лінія
function fluff(cx, cy, rx, ry, n, amp = 0.1, a0 = 0) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
    if (!i) { d += `M${r1(x)} ${r1(y)}`; continue; }
    const am = a0 + ((i - 0.5) / n) * Math.PI * 2;
    d += `Q${r1(cx + rx * (1 + amp * 2) * Math.cos(am))} ${r1(cy + ry * (1 + amp * 2) * Math.sin(am))} ${r1(x)} ${r1(y)}`;
  }
  return d + 'Z';
}
// зубчаста корона (голки їжака, грива)
function spiky(cx, cy, r0, r1_, n, a0, a1) {
  let d = `M${r1(cx + r0 * Math.cos(a0))} ${r1(cy + r0 * Math.sin(a0))}`;
  for (let i = 0; i < n; i++) {
    const am = a0 + ((i + 0.5) / n) * (a1 - a0), ae = a0 + ((i + 1) / n) * (a1 - a0);
    d += `L${r1(cx + r1_ * Math.cos(am))} ${r1(cy + r1_ * Math.sin(am))}L${r1(cx + r0 * Math.cos(ae))} ${r1(cy + r0 * Math.sin(ae))}`;
  }
  return d + `L${cx} ${cy}Z`;
}
const star4 = (x, y, r) => `M${x} ${y - r}Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z`;
const star5 = (x, y, r) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    d += `${i ? 'L' : 'M'}${r1(x + rr * Math.cos(a))} ${r1(y + rr * Math.sin(a))}`;
  }
  return d + 'Z';
};

// ---------------------------------------------------------------- риг: очі / брови / рот
function eyeSvg(c, e, ol) {
  const { x, y, rx = 9, ry = 11, iris = '#6b4a2e', lash = false, side = 'l', lid = null, lidAmt = 0.38, sclera = '#fff', glow = false } = e;
  const ir = Math.min(rx, ry) * 0.8, iy = y + ry * 0.1;
  const clip = c.clip(`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`);
  const s = side === 'l' ? -1 : 1;
  let eo = `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${sclera}"/>`;
  eo += `<g clip-path="${clip}"><g class="ch-pup"><g class="ch-iris">`;
  eo += `<circle cx="${x}" cy="${r1(iy)}" r="${r1(ir)}" fill="${c.rg(iris, { l: 0.15, d: 0.5, cx: 0.5, cy: 0.85, r: 0.9 })}"/>`;
  eo += `<circle cx="${x}" cy="${r1(iy)}" r="${r1(ir * 0.5)}" fill="${dk(iris, 0.8)}"/>`;
  if (glow) eo += `<circle cx="${x}" cy="${r1(iy)}" r="${r1(ir * 1.05)}" fill="none" stroke="${lt(iris, 0.5)}" stroke-width="1.4" opacity=".8"/>`;
  eo += `<circle cx="${r1(x - ir * 0.34)}" cy="${r1(iy - ir * 0.38)}" r="${r1(ir * 0.36)}" fill="#fff"/>`;
  eo += `<circle cx="${r1(x + ir * 0.38)}" cy="${r1(iy + ir * 0.34)}" r="${r1(ir * 0.16)}" fill="#fff" opacity=".9"/>`;
  eo += `</g></g>`;
  if (lid) {
    const ly = y - ry + 2 * ry * lidAmt;
    eo += `<g class="ch-lid" clip-path="${clip}"><rect x="${x - rx - 2}" y="${y - ry - 2}" width="${rx * 2 + 4}" height="${r1(ly - (y - ry) + 2)}" fill="${lid}"/>` +
      `<path d="M${x - rx - 2} ${r1(ly + 1)}Q${x} ${r1(ly - 1.5)} ${x + rx + 2} ${r1(ly + 1)}" fill="none" stroke="${ol}" stroke-width="2.4"/></g>`;
  }
  eo += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="${ol}" stroke-width="2"/>`;
  eo += `<path d="M${x - rx - 0.5} ${r1(y + 1)}A${rx + 0.5} ${ry + 0.5} 0 0 1 ${x + rx + 0.5} ${r1(y + 1)}" fill="none" stroke="${ol}" stroke-width="3.4" stroke-linecap="round"/>`;
  if (lash) {
    const ox = x + s * rx;
    eo += `<path d="M${r1(ox - s * 1)} ${r1(y - ry * 0.25)}l${s * 5} -4M${r1(ox - s * 3)} ${r1(y - ry * 0.62)}l${s * 4} -5" stroke="${ol}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`;
  }
  const eh = `<path class="ch-eh" d="M${x - rx} ${r1(y + ry * 0.2)}Q${x} ${r1(y - ry * 1.05)} ${x + rx} ${r1(y + ry * 0.2)}" fill="none" stroke="${ol}" stroke-width="3.6" stroke-linecap="round"/>`;
  const ec = `<path class="ch-ec" d="M${x - rx} ${r1(y - ry * 0.05)}Q${x} ${r1(y + ry * 0.75)} ${x + rx} ${r1(y - ry * 0.05)}" fill="none" stroke="${ol}" stroke-width="3.4" stroke-linecap="round"/>`;
  const exd = side === 'l'
    ? `M${r1(x - rx * 0.75)} ${r1(y - ry * 0.6)}L${r1(x + rx * 0.6)} ${y}L${r1(x - rx * 0.75)} ${r1(y + ry * 0.6)}`
    : `M${r1(x + rx * 0.75)} ${r1(y - ry * 0.6)}L${r1(x - rx * 0.6)} ${y}L${r1(x + rx * 0.75)} ${r1(y + ry * 0.6)}`;
  const ex = `<path class="ch-ex" d="${exd}" fill="none" stroke="${ol}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<g class="ch-eye"><g class="ch-eo">${eo}</g>${eh}${ec}${ex}</g>`;
}

function browSvg(b, side) {
  const { x, y, w = 17, col = '#4a3020', th = 3.6 } = b;
  const d = side === 'l'
    ? `M${x - w / 2} ${y + 2}Q${x - w * 0.05} ${y - 3.5} ${x + w / 2} ${y}`
    : `M${x - w / 2} ${y}Q${x + w * 0.05} ${y - 3.5} ${x + w / 2} ${y + 2}`;
  return `<g class="ch-brow ch-b${side}"><path d="${d}" fill="none" stroke="${col}" stroke-width="${th}" stroke-linecap="round"/></g>`;
}

function mouthSvg(c, m, ol) {
  const { x, y, w = 15, inside = '#6e2036', tongue = '#ff7d8e', beak = null } = m;
  if (beak) return beakSvg(c, m, ol);
  const lw = 3;
  const line = (k, d) => `<path class="ch-m ch-m-${k}" d="${d}" fill="none" stroke="${ol}" stroke-width="${lw}" stroke-linecap="round"/>`;
  const open = (k, d, { teeth = false, tng = true, ty = 0.55 } = {}) => {
    const cl = c.clip(`<path d="${d}"/>`);
    return `<g class="ch-m ch-m-${k}"><path d="${d}" fill="${inside}"/><g clip-path="${cl}">` +
      (tng ? `<ellipse cx="${x}" cy="${r1(y + w * ty + w * 0.18)}" rx="${r1(w * 0.32)}" ry="${r1(w * 0.22)}" fill="${tongue}"/>` : '') +
      (teeth ? `<rect x="${x - w}" y="${r1(y - w * 0.3)}" width="${w * 2}" height="${r1(w * 0.38)}" fill="#fff"/>` : '') +
      `</g><path d="${d}" fill="none" stroke="${ol}" stroke-width="2.6" stroke-linejoin="round"/></g>`;
  };
  let s = '';
  s += line('smile', `M${x - w / 2} ${y}Q${x} ${r1(y + w * 0.42)} ${x + w / 2} ${y}`);
  s += line('smirk', `M${x - w / 2} ${r1(y + w * 0.06)}Q${r1(x + w * 0.08)} ${r1(y + w * 0.32)} ${x + w / 2} ${r1(y - w * 0.2)}`);
  s += line('flat', `M${x - w / 2} ${r1(y + w * 0.14)}Q${x} ${r1(y - w * 0.08)} ${x + w / 2} ${r1(y + w * 0.14)}`);
  s += line('sad', `M${x - w / 2} ${r1(y + w * 0.28)}Q${x} ${r1(y - w * 0.22)} ${x + w / 2} ${r1(y + w * 0.28)}`);
  s += line('wobble', `M${x - w / 2} ${y + 3}q${r1(w / 8)} -4 ${r1(w / 4)} 0t${r1(w / 4)} 0t${r1(w / 4)} 0t${r1(w / 4)} 0`);
  s += open('a', `M${r1(x - w * 0.42)} ${r1(y - w * 0.02)}Q${x} ${r1(y - w * 0.12)} ${r1(x + w * 0.42)} ${r1(y - w * 0.02)}Q${r1(x + w * 0.38)} ${r1(y + w * 0.72)} ${x} ${r1(y + w * 0.72)}Q${r1(x - w * 0.38)} ${r1(y + w * 0.72)} ${r1(x - w * 0.42)} ${r1(y - w * 0.02)}Z`);
  s += open('o', `M${x} ${r1(y - w * 0.12)}C${r1(x + w * 0.28)} ${r1(y - w * 0.12)} ${r1(x + w * 0.26)} ${r1(y + w * 0.5)} ${x} ${r1(y + w * 0.5)}C${r1(x - w * 0.26)} ${r1(y + w * 0.5)} ${r1(x - w * 0.28)} ${r1(y - w * 0.12)} ${x} ${r1(y - w * 0.12)}Z`, { ty: 0.3 });
  s += open('e', `M${x - w * 0.5} ${y}Q${x} ${r1(y + w * 0.1)} ${x + w * 0.5} ${y}Q${r1(x + w * 0.42)} ${r1(y + w * 0.38)} ${x} ${r1(y + w * 0.38)}Q${r1(x - w * 0.42)} ${r1(y + w * 0.38)} ${x - w * 0.5} ${y}Z`, { teeth: true, tng: false });
  s += open('grin', `M${r1(x - w * 0.6)} ${r1(y - w * 0.08)}Q${x} ${r1(y + w * 0.06)} ${r1(x + w * 0.6)} ${r1(y - w * 0.08)}Q${r1(x + w * 0.52)} ${r1(y + w * 0.8)} ${x} ${r1(y + w * 0.82)}Q${r1(x - w * 0.52)} ${r1(y + w * 0.8)} ${r1(x - w * 0.6)} ${r1(y - w * 0.08)}Z`, { teeth: true, ty: 0.62 });
  const ad = `M${r1(x - w * 0.5)} ${r1(y + w * 0.04)}Q${x} ${r1(y - w * 0.12)} ${r1(x + w * 0.5)} ${r1(y + w * 0.04)}L${r1(x + w * 0.44)} ${r1(y + w * 0.36)}Q${x} ${r1(y + w * 0.26)} ${r1(x - w * 0.44)} ${r1(y + w * 0.36)}Z`;
  s += `<g class="ch-m ch-m-angry"><path d="${ad}" fill="#fff" stroke="${ol}" stroke-width="2.6" stroke-linejoin="round"/>` +
    `<path d="M${r1(x - w * 0.46)} ${r1(y + w * 0.17)}Q${x} ${r1(y + w * 0.08)} ${r1(x + w * 0.46)} ${r1(y + w * 0.17)}M${r1(x - w * 0.17)} ${r1(y - w * 0.04)}L${r1(x - w * 0.17)} ${r1(y + w * 0.3)}M${r1(x + w * 0.17)} ${r1(y - w * 0.04)}L${r1(x + w * 0.17)} ${r1(y + w * 0.3)}" fill="none" stroke="${ol}" stroke-width="1.5"/></g>`;
  return s;
}

function beakSvg(c, m, ol) {
  const { x, y, w = 14, beak } = m;
  const bo = dk(beak, 0.5);
  const OPEN = { smile: 0, smirk: 0, flat: 0, sad: 0, wobble: 0, o: 1, e: 0.8, a: 1.6, angry: 1.2, grin: 1.9 };
  let s = '';
  for (const k of MOUTHS) {
    const o = OPEN[k];
    const up = `M${x - w / 2} ${r1(y - o * 2)}Q${x} ${r1(y - w * 0.28 - o * 2)} ${x + w / 2} ${r1(y - o * 2)}L${x} ${r1(y + w * 0.55 - o * 2.5)}Z`;
    const low = `M${r1(x - w * 0.36)} ${r1(y + o * 2)}Q${x} ${r1(y + o * 2 + w * 0.14)} ${r1(x + w * 0.36)} ${r1(y + o * 2)}L${x} ${r1(y + w * 0.5 + o * 5)}Z`;
    s += `<g class="ch-m ch-m-${k}">` +
      (o ? `<ellipse cx="${x}" cy="${r1(y + o * 2)}" rx="${r1(w * 0.3)}" ry="${r1(o * 3.2)}" fill="#5a1a2a"/>` + c.P(low, dk(beak, 0.12), { s: bo, w: 2.2 }) : '') +
      c.P(up, beak, { s: bo, w: 2.4 }) + `</g>`;
  }
  return s;
}

// ---------------------------------------------------------------- спільні шматки людей
const HEAD = 'M 62 90 C 62 58 80 42 100 42 C 120 42 138 58 138 90 C 138 114 124 134 100 136 C 76 134 62 114 62 90 Z';
const TORSO = 'M 26 204 C 28 168 56 150 100 150 C 144 150 172 168 174 204 Z';

const HAIR = {
  bob(c, h) {
    return {
      back: c.P('M 54 100 C 48 60 70 32 100 32 C 130 32 152 60 146 100 C 148 118 144 130 136 136 C 130 124 132 110 128 100 L 72 100 C 68 110 70 124 64 136 C 56 130 52 118 54 100 Z', h),
      front: c.P('M 60 98 C 54 62 74 38 100 38 C 128 38 146 60 140 98 C 136 84 132 74 124 66 C 112 78 90 78 74 70 C 68 78 63 86 60 98 Z', h) + c.hl(84, 48, 14, 5, -15, 0.4),
    };
  },
  curly(c, h) {
    const back = [];
    for (let a = 150; a <= 390; a += 20) {
      const t = (a * Math.PI) / 180;
      back.push([r1(100 + 46 * Math.cos(t)), r1(76 + 42 * Math.sin(t)), 15]);
    }
    back.push([100, 64, 40]);
    const front = [[68, 66, 11], [82, 56, 13], [99, 52, 13], [116, 55, 13], [131, 64, 12], [138, 78, 8], [62, 80, 8]];
    return { back: c.blob(back, h, { noHl: true }), front: c.blob(front, h) };
  },
  messy(c, h) {
    return {
      back: c.P('M 58 98 C 52 60 70 34 100 32 C 130 34 148 60 142 98 L 136 98 C 136 80 132 70 128 66 L 72 66 C 68 70 64 80 64 98 Z', h),
      front: c.P('M 60 86 L 62 60 L 52 54 L 68 48 L 64 32 L 82 40 L 92 24 L 102 37 L 118 24 L 119 40 L 138 33 L 133 50 L 148 56 L 139 64 L 140 86 C 133 74 127 68 121 63 L 112 74 L 104 62 L 94 76 L 86 63 L 76 74 L 72 64 C 66 70 62 78 60 86 Z', h) + c.hl(90, 44, 12, 4, -20, 0.45),
    };
  },
  braid(c, h) {
    let braid = c.P('M 134 94 C 142 106 142 118 136 126 L 128 120 C 132 112 133 104 130 98 Z', h);
    for (let i = 0; i < 7; i++) {
      const bx = 135 + i * 2.4, by = 124 + i * 11.5;
      braid += c.E(bx, by, 9 - i * 0.4, 7.5, h, { a: `transform="rotate(${i % 2 ? 28 : -28} ${bx} ${by})"`, w: 2.6 });
    }
    braid += c.P('M 146 202 L 144 196 L 158 196 L 156 202 Z', '#e8484f', { w: 2 }) + c.P('M 147 202 L 151 214 L 155 202 Z', h, { w: 2 });
    return {
      back: c.P('M 56 98 C 50 58 74 34 100 34 C 126 34 150 58 144 98 C 146 124 142 144 136 156 L 64 156 C 58 144 54 124 56 98 Z', h),
      front: c.P('M 60 98 C 56 62 76 38 100 38 C 124 38 144 62 140 98 C 138 80 128 62 104 56 L 100 50 L 96 56 C 72 62 62 80 60 98 Z', h) + c.hl(80, 50, 12, 4, -30, 0.35),
      extra: braid,
    };
  },
  long(c, h) {
    return {
      back: c.P('M 54 96 C 48 54 74 32 100 32 C 126 32 152 54 146 96 C 150 130 152 156 148 172 L 52 172 C 48 156 50 130 54 96 Z', h, { g: { l: 0.5, d: 0.25 } }),
      front: c.P('M 60 100 C 56 58 78 38 100 38 C 128 38 146 60 140 102 C 136 82 128 64 112 56 C 100 68 80 72 64 78 C 62 84 61 92 60 100 Z', h, { g: { l: 0.5, d: 0.25 } }) +
        c.P('M 132 72 C 146 96 144 128 138 152 C 132 128 132 100 124 82 Z', h, { g: { l: 0.5, d: 0.25 } }) + c.hl(92, 46, 14, 4, -15, 0.55),
    };
  },
  buns(c, h) {
    return {
      back: c.C(64, 48, 15, h) + c.C(136, 48, 15, h) + c.P('M 58 96 C 52 60 74 36 100 36 C 126 36 148 60 142 96 L 136 108 L 64 108 Z', h),
      front: c.P('M 62 92 C 58 60 78 40 100 40 C 122 40 142 60 138 92 L 132 74 L 124 80 L 116 68 L 106 78 L 98 66 L 88 78 L 80 68 L 72 80 L 66 74 Z', h) + c.hl(86, 48, 12, 4, -15, 0.35),
    };
  },
  bald(c, h) {
    return {
      back: c.P(fluff(60, 94, 9, 17, 7, 0.12), h) + c.P(fluff(140, 94, 9, 17, 7, 0.12), h),
      front: '',
    };
  },
  pixie(c, h) {
    return {
      back: c.P('M 58 94 C 54 58 76 38 100 38 C 124 38 146 58 142 94 L 138 106 L 62 106 Z', h),
      front: c.P('M 60 94 C 58 60 78 40 100 40 C 126 40 144 60 140 90 C 132 72 118 62 104 62 C 96 72 82 80 64 84 C 62 88 61 91 60 94 Z', h) + c.hl(90, 47, 12, 4, -15, 0.35),
    };
  },
  short(c, h) {
    return { back: c.P('M 60 98 C 56 72 70 56 100 56 C 130 56 144 72 140 98 L 134 104 L 66 104 Z', h), front: '' };
  },
  slick(c, h) {
    return {
      back: c.P('M 58 94 C 54 54 76 34 100 34 C 128 34 148 54 142 94 L 140 102 L 60 102 Z', h),
      front: c.P('M 60 88 C 60 56 78 38 100 38 C 124 38 142 54 140 86 C 134 64 118 52 100 54 L 96 62 L 90 55 C 80 58 70 66 66 76 C 63 80 61 84 60 88 Z', h) +
        c.F('M 112 41 C 126 44 136 56 139 76 C 132 62 122 54 110 51 Z', '#c9c6d4') + c.hl(84, 46, 12, 4, -20, 0.35),
    };
  },
  bun(c, h) {
    return {
      back: c.P('M 82 14 L 86 10 L 126 42 L 122 46 Z', '#f6c445', { w: 2.2 }) + c.C(100, 30, 18, h) + c.P('M 58 96 C 54 58 76 38 100 38 C 124 38 146 58 142 96 L 138 102 L 62 102 Z', h),
      front: c.P('M 60 94 C 58 62 78 42 100 42 C 122 42 142 62 140 94 C 136 72 122 56 100 54 C 80 56 66 70 60 94 Z', h) + c.hl(84, 50, 12, 4, -25, 0.35),
    };
  },
};

// людина-погруддя (візуальна новела): параметри → конфіг ригу
function human(c, p) {
  const sk = p.skin, so = dk(sk, 0.55);
  const hair = HAIR[p.style || 'bob'](c, p.hair, p);
  const hairO = dk(p.hair, 0.55);
  const back = (p.back || '') + hair.back;
  let body = c.P('M 88 120 L 88 156 Q 100 162 112 156 L 112 120 Z', dk(sk, 0.08)) +
    c.F('M 88 130 Q 100 146 112 130 L 112 140 Q 100 152 88 140 Z', dk(sk, 0.3), 0.35);
  body += p.body ? p.body(c) : c.P(TORSO, p.outfit);
  let head = c.E(63, 98, 6, 9, sk) + c.E(137, 98, 6, 9, sk) + c.P(HEAD, sk, { g: { l: 0.35, d: 0.18 } });
  head += c.L('M 132 66 C 138 80 138 100 132 116', lt(sk, 0.6), 2.4, 0.6);
  if (p.freckles) for (const [fx, fy] of [[74, 106], [79, 109], [72, 111], [126, 106], [121, 109], [128, 111]]) head += `<circle cx="${fx}" cy="${fy}" r="1.3" fill="${dk(sk, 0.35)}" opacity=".7"/>`;
  head += c.L('M 99 105 Q 102.5 108.5 99 111', dk(sk, 0.35), 2.2);
  head += p.headBase ? p.headBase(c) : '';
  return {
    kind: 'bust',
    back, body,
    headBase: head,
    headFront: hair.front + (p.headFront ? p.headFront(c) : ''),
    front: (hair.extra || '') + (p.front ? p.front(c) : ''),
    ol: so,
    eyes: [
      { x: 85, y: 96, rx: 9, ry: 11.5, iris: p.eyes, lash: p.lash, side: 'l', lid: p.lid ? sk : null, lidAmt: p.lid || 0.3 },
      { x: 115, y: 96, rx: 9, ry: 11.5, iris: p.eyes, lash: p.lash, side: 'r', lid: p.lid ? sk : null, lidAmt: p.lid || 0.3 },
    ],
    brows: { y: p.browY || 79, w: 17, col: p.browCol || dk(p.hair, 0.3), th: p.browTh || 3.6, lx: 85, rx: 115 },
    mouth: { x: 100, y: p.mouthY || 118, w: 15 },
    cheeks: { pts: [[75, 110], [125, 110]], rx: 7, ry: 4, col: p.blush || '#ff7f9a', op: 0.42 },
    neck: [100, 136],
    hand: { col: p.sleeve || p.outfit, skin: sk },
    fx: { tear: [80, 104], anger: [136, 54], sweat: [62, 72], top: [100, 32] },
    idleMouth: p.idleMouth || 'smile', browBase: p.browBase || 0,
    hairO,
  };
}

// звір-погруддя: голова/тулуб задаються функціями виду
function animalBase(c, p) {
  return {
    kind: 'bust', ol: dk(p.fur, 0.6),
    neck: [100, 134], hand: p.hand === false ? null : { col: p.sleeve || p.fur, skin: p.paw || p.fur },
    cheeks: { pts: [[74, 108], [126, 108]], rx: 7, ry: 4, col: '#ff7f9a', op: 0.4 },
    fx: { tear: [80, 102], anger: [138, 56], sweat: [62, 70], top: [100, 30] },
    idleMouth: 'smile', browBase: 0,
  };
}
const furTorso = (c, col, chest) => c.P(TORSO, col) + (chest ? c.P('M 70 204 C 72 176 84 160 100 160 C 116 160 128 176 130 204 Z', chest, { w: 0 }) : '');

// голова лиса (Фокс, Руді, мама-лисиця)
function foxHead(c, fur, cream, { cub = false } = {}) {
  const k = cub ? 0.92 : 1;
  const ex = (x) => r1(100 + (x - 100) * k);
  return c.P(`M ${ex(64)} 74 L ${ex(54)} ${cub ? 34 : 26} L ${ex(92)} 58 Z`, fur) + c.P(`M ${ex(66)} 67 L ${ex(60)} ${cub ? 44 : 38} L ${ex(84)} 58 Z`, '#3a2030', { flat: true, w: 0 }) +
    c.P(`M ${ex(136)} 74 L ${ex(146)} ${cub ? 34 : 26} L ${ex(108)} 58 Z`, fur) + c.P(`M ${ex(134)} 67 L ${ex(140)} ${cub ? 44 : 38} L ${ex(116)} 58 Z`, '#3a2030', { flat: true, w: 0 }) +
    c.P(cub ? 'M 60 96 C 58 70 78 56 100 56 C 122 56 142 70 140 96 C 146 104 152 110 156 116 C 138 122 126 134 100 138 C 74 134 62 122 44 116 C 48 110 54 104 60 96 Z'
      : 'M 58 96 C 56 70 76 54 100 54 C 124 54 144 70 142 96 C 148 104 156 112 162 120 C 142 124 128 136 100 140 C 72 136 58 124 38 120 C 44 112 52 104 58 96 Z', fur, { g: { l: 0.35, d: 0.25 } }) +
    c.F('M 68 112 C 78 104 90 104 100 112 C 110 104 122 104 132 112 C 138 120 126 133 100 136 C 74 133 62 120 68 112 Z', cream) +
    c.F('M 92 58 C 96 72 104 72 108 58 C 104 62 96 62 92 58 Z', lt(fur, 0.35), 0.8) +
    c.L('M 138 82 C 142 92 146 102 152 110', lt(fur, 0.5), 2.4, 0.6) +
    c.E(100, 112, 6.5, 4.8, '#2a1a24', { w: 2, g: { l: 0.5 } }) + c.hl(98, 110.5, 2.2, 1.2, -10, 0.8);
}

// ---------------------------------------------------------------- КАТАЛОГ
export const CHARACTERS = {
  boss_w1: { name: 'Бурчун-Гриб', role: 'boss', world: 'w1' },
  boss_w2: { name: 'Дід Мохобород', role: 'boss', world: 'w2' },
  boss_w3: { name: 'Пан Тік-Так', role: 'boss', world: 'w3' },
  boss_w4: { name: 'Єті Обіймайло', role: 'boss', world: 'w4' },
  boss_w5: { name: 'Пані Тсс-Тсс', role: 'boss', world: 'w5' },
  fox: { name: 'Лис Фокс', role: 'durak' },
  mia: { name: 'Mia', role: 'story', world: 'w1' },
  noah: { name: 'Noah', role: 'story', world: 'w2' },
  leo: { name: 'Leo', role: 'story', world: 'w3' },
  ava: { name: 'Ava', role: 'story', world: 'w4' },
  eli: { name: 'Eli', role: 'story', world: 'w5' },
  owl: { name: 'Owl', role: 'drama', world: 'w1' },
  rabbit: { name: 'Rabbit', role: 'drama', world: 'w1' },
  hedgehog: { name: 'Hedgehog', role: 'drama', world: 'w1' },
  rudy: { name: 'Rudy', role: 'drama', world: 'w2' },
  crow: { name: 'Crow', role: 'drama', world: 'w2' },
  badger: { name: 'Badger', role: 'drama', world: 'w2' },
  mother_fox: { name: 'Mother Fox', role: 'drama', world: 'w2' },
  mira: { name: 'Mira', role: 'drama', world: 'w3' },
  tock: { name: 'Tock', role: 'drama', world: 'w3' },
  mayor: { name: 'Mayor', role: 'drama', world: 'w3' },
  sora: { name: 'Sora', role: 'drama', world: 'w4' },
  brann: { name: 'Brann', role: 'drama', world: 'w4' },
  keeper: { name: 'Keeper', role: 'drama', world: 'w4' },
  vesper: { name: 'Vesper', role: 'drama', world: 'w5' },
  ines: { name: 'Ines', role: 'drama', world: 'w5' },
};

// ім'я speaker / cast → id персонажа (невідомі імена отримають згенерований вигляд)
export function characterIdFor(name) {
  const s = String(name || '').trim().toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/gi, '_').replace(/^_|_$/g, '');
  return s || 'guest';
}

const DRAW = {
  // ============================================================ БОСИ
  boss_w1(c) { // Бурчун-Гриб
    const cap = '#e2463f', stem = '#f4e1bf', gill = '#d8b088', foot = '#c98c5a', spot = '#fff6e6';
    const so = dk(stem, 0.55);
    let body = c.E(80, 184, 15, 8, foot) + c.E(120, 184, 15, 8, foot) +
      c.P('M 64 100 C 58 132 56 160 62 176 C 74 190 126 190 138 176 C 144 160 142 132 136 100 Z', stem, { g: { l: 0.3, d: 0.22 } }) +
      c.hl(74, 150, 5, 18, -6, 0.4) + c.L('M 134 116 C 138 140 138 160 132 174', lt(stem, 0.7), 2.6, 0.7);
    for (const [x, y, r] of [[122, 174, 2.4], [130, 164, 1.8], [70, 170, 2]]) body += `<circle cx="${x}" cy="${y}" r="${r}" fill="${dk(stem, 0.18)}" opacity=".6"/>`;
    let headBase = c.P('M 30 104 C 60 122 140 122 170 104 C 158 128 42 128 30 104 Z', gill, { w: 2.6 });
    for (let i = 0; i < 9; i++) { const x = 48 + i * 13; headBase += c.L(`M ${x} ${113 + Math.abs(4 - i) * -0.6} L ${x + (x - 100) * 0.05} ${119}`, dk(gill, 0.3), 1.4, 0.6); }
    headBase += c.L('M 100 20 Q 97 8 104 1', '#3f8a33', 3.2) + c.P('M 103 4 C 111 -3 121 0 119 7 C 113 10 106 9 103 4 Z', '#6cc04a', { w: 2.2 });
    headBase += c.P('M 20 104 C 14 58 54 18 100 18 C 146 18 186 58 180 104 C 160 116 130 112 100 112 C 70 112 40 116 20 104 Z', cap, { g: { l: 0.32, d: 0.38 } });
    for (const [x, y, rx, ry] of [[62, 54, 13, 10], [101, 36, 11, 8], [141, 56, 14, 11], [40, 88, 8, 7], [161, 88, 9, 7], [88, 80, 9, 7], [124, 86, 7, 6], [114, 60, 5, 4]]) {
      headBase += c.E(x, y + 1.5, rx, ry, dk(cap, 0.25), { flat: true, w: 0, op: 0.45 }) + c.E(x, y, rx, ry, spot, { g: { l: 0.6, d: 0.12 }, w: 0 });
    }
    headBase += c.hl(62, 34, 22, 8, -25, 0.38) + c.L('M 150 32 C 170 48 180 72 178 98', '#ff9c8a', 3, 0.6);
    return {
      kind: 'full', ol: so, shadow: [100, 190, 58],
      body, headBase,
      armL: c.limb('M 66 134 Q 52 148 50 162', stem, 11) + c.C(50, 165, 7.5, stem),
      armR: c.limb('M 134 134 Q 148 148 150 162', stem, 11) + c.C(150, 165, 7.5, stem),
      pivots: { al: [66, 134], ar: [134, 134] },
      neck: [100, 160],
      eyes: [{ x: 86, y: 140, rx: 8, ry: 9.5, iris: '#7a4420', side: 'l' }, { x: 114, y: 140, rx: 8, ry: 9.5, iris: '#7a4420', side: 'r' }],
      brows: { y: 126, w: 21, col: '#5b3420', th: 6.5, lx: 85, rx: 115 },
      headFront: c.E(100, 150, 5.5, 4.5, dk(stem, 0.12), { w: 2.2 }),
      mouth: { x: 100, y: 160, w: 17 },
      cheeks: { pts: [[75, 152], [125, 152]], rx: 6.5, ry: 3.6, col: '#ff8a8a', op: 0.45 },
      fx: { tear: [80, 148], anger: [150, 74], sweat: [134, 128], top: [100, 12], stars: [100, -2] },
      idleMouth: 'flat', browBase: 13,
      poses: { happy: { al: 95, ar: 95 }, win: { al: 140, ar: 140 } },
    };
  },

  boss_w2(c) { // Дід Мохобород
    const bark = '#8b5a36', bark2 = '#a97548', leaf = '#4f9e4c', moss = '#86b95a', so = dk(bark, 0.5);
    let body = c.P('M 58 194 C 46 194 34 190 26 194 C 40 180 54 174 64 170 Z', bark) + c.P('M 142 194 C 154 194 166 190 174 194 C 160 180 146 174 136 170 Z', bark) +
      c.P('M 68 124 C 66 150 62 176 56 194 L 144 194 C 138 176 134 150 132 124 Z', bark, { g: { l: 0.25, d: 0.35 } }) +
      c.L('M 74 188 C 72 170 76 154 72 138', dk(bark, 0.35), 2.6, 0.7) + c.L('M 126 188 C 130 168 124 152 128 136', dk(bark, 0.35), 2.6, 0.7) +
      c.L('M 98 192 C 100 182 96 178 100 172', dk(bark, 0.35), 2.2, 0.7) +
      c.P(fluff(70, 182, 9, 6, 8, 0.12), moss, { w: 2.4 }) +
      c.P('M 146 186 L 148 176 L 152 176 L 154 186 Z', '#f2e0c0', { w: 2 }) + c.P('M 142 178 C 142 168 158 168 158 178 Z', '#e04b3c', { w: 2.2 }) +
      `<circle cx="147" cy="173" r="1.6" fill="#fff"/><circle cx="153" cy="175" r="1.2" fill="#fff"/>`;
    const leaves = (x, y) => c.blob([[x, y, 9], [x - 8, y + 6, 7], [x + 8, y + 5, 7], [x, y + 10, 6]], leaf);
    const canopy = [[50, 58, 24], [76, 32, 27], [110, 22, 29], [142, 34, 25], [160, 62, 22], [40, 86, 17], [162, 90, 17], [100, 52, 34], [130, 66, 22], [70, 66, 22]];
    let headBase = c.blob(canopy, leaf, { g: { l: 0.3, d: 0.3 } });
    for (const [x, y] of [[64, 40], [98, 24], [136, 44], [150, 70], [52, 70]]) headBase += c.P(`M ${x} ${y} q 6 -8 12 -2 q -4 8 -12 2 Z`, '#8fd16a', { w: 1.6, s: dk(leaf, 0.5) });
    // пташка в кроні
    headBase += c.C(150, 30, 8, '#5aa8e8', { w: 2.2 }) + c.P('M 157 29 L 164 31 L 157 33 Z', '#f5b13b', { w: 1.4 }) + `<circle cx="152" cy="28" r="1.6" fill="#1d1426"/>` + c.P('M 142 30 L 136 26 L 140 34 Z', '#3f86c8', { w: 1.6 });
    headBase += c.P('M 56 112 C 52 66 70 46 100 46 C 130 46 148 66 144 112 C 140 132 124 142 100 142 C 76 142 60 132 56 112 Z', bark, { g: { l: 0.3, d: 0.3 } }) +
      c.L('M 80 70 Q 100 64 120 70', dk(bark, 0.35), 2.2, 0.7) + c.L('M 86 62 Q 100 58 114 62', dk(bark, 0.35), 2, 0.5) +
      c.L('M 138 70 C 144 90 144 110 138 126', lt(bark, 0.5), 2.6, 0.55) +
      c.P('M 66 112 C 60 130 66 146 74 156 C 76 166 86 168 88 176 C 92 186 108 186 112 176 C 114 168 124 166 126 156 C 134 146 140 130 134 112 C 124 120 112 118 100 122 C 88 118 76 120 66 112 Z', moss, { g: { l: 0.3, d: 0.3 } });
    for (const [x, y] of [[82, 140], [96, 158], [112, 146], [104, 172], [120, 132], [76, 128]]) headBase += `<circle cx="${x}" cy="${y}" r="2.2" fill="${dk(moss, 0.25)}" opacity=".7"/><circle cx="${x + 5}" cy="${y - 4}" r="1.5" fill="${lt(moss, 0.4)}"/>`;
    headBase += c.E(100, 106, 9.5, 8.5, bark2, { g: { l: 0.4 } }) + c.hl(97, 103, 3, 2, -20, 0.5);
    return {
      kind: 'full', ol: so, shadow: [100, 194, 70],
      body, headBase,
      armL: c.limb('M 66 132 Q 46 140 34 158', bark, 12) + c.limb('M 44 146 Q 34 138 30 124', bark, 6) + leaves(30, 162) + leaves(28, 120),
      armR: c.limb('M 134 132 Q 154 140 166 158', bark, 12) + c.limb('M 156 146 Q 166 138 170 124', bark, 6) + leaves(170, 162) + leaves(172, 120),
      pivots: { al: [66, 132], ar: [134, 132] },
      neck: [100, 140],
      eyes: [{ x: 84, y: 90, rx: 8, ry: 8, iris: '#d29a2e', side: 'l', lid: bark, lidAmt: 0.42 }, { x: 116, y: 90, rx: 8, ry: 8, iris: '#d29a2e', side: 'r', lid: bark, lidAmt: 0.42 }],
      brows: { y: 77, w: 24, col: '#e3ead0', th: 7.5, lx: 83, rx: 117 },
      mouth: { x: 100, y: 124, w: 18 },
      headFront: c.P('M 100 119 C 92 112 78 112 70 121 C 80 126 92 125 100 122 Z', moss, { w: 2.4 }) + c.P('M 100 119 C 108 112 122 112 130 121 C 120 126 108 125 100 122 Z', moss, { w: 2.4 }),
      cheeks: { pts: [[72, 104], [128, 104]], rx: 6, ry: 3.5, col: '#e98a6a', op: 0.4 },
      fx: { tear: [78, 98], anger: [146, 76], sweat: [140, 92], top: [100, 20], stars: [100, 0] },
      idleMouth: 'smile', browBase: -4,
      poses: { happy: { al: 55, ar: 55 }, win: { al: 95, ar: 95 }, surprised: { al: 40, ar: 40 }, hurt: { al: 45, ar: 45 } },
    };
  },

  boss_w3(c) { // Пан Тік-Так
    const brass = '#d6a443', dial = '#fbf2d8', wine = '#8c2638', blk = '#2b2232', so = dk(brass, 0.6);
    const win = c.clip('<circle cx="100" cy="150" r="12"/>');
    let ticks = '';
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6, big = i % 3 === 0;
      const r0 = big ? 29 : 32, rr = 36;
      ticks += c.L(`M ${r1(100 + r0 * Math.sin(a))} ${r1(72 - r0 * Math.cos(a))} L ${r1(100 + rr * Math.sin(a))} ${r1(72 - rr * Math.cos(a))}`, '#5a3a22', big ? 3 : 1.8);
    }
    const body = c.limb('M 88 170 L 86 186', blk, 5) + c.limb('M 112 170 L 114 186', blk, 5) +
      c.E(82, 189, 9, 4.5, blk, { w: 2.4 }) + c.E(118, 189, 9, 4.5, blk, { w: 2.4 }) +
      c.P('M 72 116 L 128 116 L 137 172 Q 100 183 63 172 Z', wine, { g: { l: 0.3, d: 0.35 } }) +
      c.L('M 73 125 L 127 125', brass, 3) + c.L('M 66 166 Q 100 175 134 166', brass, 3) +
      `<circle cx="100" cy="150" r="12" fill="#3b1a26"/><g clip-path="${win}"><g class="ch-pend" style="transform-origin:100px 136px">` +
      c.L('M 100 136 L 100 156', brass, 2) + c.C(100, 158, 5, brass, { w: 1.8 }) + `</g></g>` +
      `<circle cx="100" cy="150" r="12" fill="none" stroke="${brass}" stroke-width="3.4"/>` + c.hl(96, 145, 4, 2, -30, 0.35) +
      `<circle cx="100" cy="132" r="2" fill="${brass}"/><circle cx="100" cy="168" r="2" fill="${brass}"/>` +
      c.P('M 100 117 L 86 109 L 86 125 Z', blk, { w: 2.4 }) + c.P('M 100 117 L 114 109 L 114 125 Z', blk, { w: 2.4 }) + c.C(100, 117, 3.6, wine, { w: 2 });
    const headBase = `<g class="ch-key" style="transform-origin:160px 76px">` + c.limb('M 140 76 L 156 76', brass, 4) + c.P('M 156 76 C 156 64 168 64 166 72 C 172 70 172 82 166 80 C 168 88 156 88 156 76 Z', brass, { w: 2.4 }) + `</g>` +
      c.C(100, 72, 45, brass, { g: { l: 0.45, d: 0.4 } }) + c.C(100, 72, 39, dk(brass, 0.25), { w: 0, flat: true }) +
      c.C(100, 72, 37, dial, { g: { l: 0.4, d: 0.12 }, w: 2 }) + ticks +
      `<g class="ch-hands"><g class="ch-hmin" style="transform-origin:100px 50px">${c.L('M 100 50 L 100 40', '#3a2418', 2.4)}</g><g class="ch-hhour" style="transform-origin:100px 50px">${c.L('M 100 50 L 106 46', '#3a2418', 2.8)}</g>${c.C(100, 50, 2.6, brass, { w: 1.4 })}</g>` +
      c.hl(78, 46, 12, 5, -35, 0.6) +
      `<g transform="rotate(-7 100 30)">` + c.E(100, 30, 30, 6, blk, { g: { l: 0.25 } }) + c.P('M 80 30 L 82 0 Q 100 -4 118 0 L 120 30 Z', blk, { g: { l: 0.3 } }) +
      c.P('M 81 22 L 119 22 L 119.6 29 L 80.4 29 Z', wine, { flat: true, w: 0 }) + c.hl(88, 10, 3, 9, 0, 0.3) + `</g>`;
    const mus = '#3a2a22';
    return {
      kind: 'full', ol: so, shadow: [100, 192, 46],
      body, headBase,
      armL: c.limb('M 73 124 Q 60 140 58 154', wine, 8) + c.C(57, 158, 7, '#ffffff', { s: '#8a7a8a' }),
      armR: c.limb('M 144 150 L 152 188', blk, 4) + c.C(143, 149, 4, brass, { w: 1.8 }) + c.limb('M 127 124 Q 140 140 142 152', wine, 8) + c.C(143, 156, 7, '#ffffff', { s: '#8a7a8a' }),
      pivots: { al: [73, 124], ar: [127, 124] },
      neck: [100, 116],
      eyes: [{ x: 85, y: 76, rx: 8, ry: 9.5, iris: '#4a70a8', side: 'l' }, { x: 115, y: 76, rx: 8, ry: 9.5, iris: '#4a70a8', side: 'r' }],
      brows: { y: 62, w: 15, col: '#2b2232', th: 3.4, lx: 85, rx: 115 },
      mouth: { x: 100, y: 101, w: 13 },
      headFront: c.E(100, 87, 4, 3.4, dk(dial, 0.15), { w: 1.8 }) +
        c.P('M 100 92 C 92 88 82 88 76 94 C 72 98 67 96 68 91 C 65 100 74 104 82 100 C 88 98 94 97 100 96 Z', mus, { w: 2 }) +
        c.P('M 100 92 C 108 88 118 88 124 94 C 128 98 133 96 132 91 C 135 100 126 104 118 100 C 112 98 106 97 100 96 Z', mus, { w: 2 }) +
        `<circle cx="115" cy="76" r="13" fill="rgba(210,235,255,.18)" stroke="${brass}" stroke-width="3"/>` + c.hl(110, 70, 4, 2, -35, 0.6) +
        c.L('M 127 81 Q 138 98 128 112', brass, 1.6),
      cheeks: { pts: [[73, 90], [127, 90]], rx: 6, ry: 3.4, col: '#ff8a8a', op: 0.35 },
      fx: { tear: [84, 84], anger: [138, 34], sweat: [62, 56], top: [100, -6], stars: [100, -14] },
      idleMouth: 'flat', browBase: -5,
      poses: { happy: { al: 100, ar: 40 }, win: { al: 140, ar: 60 }, angry: { al: 20, ar: 10 } },
    };
  },

  boss_w4(c) { // Єті Обіймайло
    const fur = '#eef3ff', face = '#a9b8ee', horn = '#9fe6ff', paw = '#8fa3e0', so = dk('#9fb0e6', 0.55);
    const hornL = c.P('M 66 50 C 54 40 44 24 50 4 C 60 18 72 28 84 38 Z', horn, { g: { l: 0.6, d: 0.25 }, s: dk(horn, 0.6) }) + c.L('M 52 10 C 58 24 66 34 78 40', '#fff', 1.6, 0.7) + c.P('M 56 30 L 46 24 L 54 36 Z', horn, { w: 1.8, s: dk(horn, 0.6) });
    const hornR = c.P('M 134 50 C 146 40 156 24 150 4 C 140 18 128 28 116 38 Z', horn, { g: { l: 0.6, d: 0.25 }, s: dk(horn, 0.6) }) + c.L('M 148 10 C 142 24 134 34 122 40', '#fff', 1.6, 0.7) + c.P('M 144 30 L 154 24 L 146 36 Z', horn, { w: 1.8, s: dk(horn, 0.6) });
    const body = c.E(76, 186, 18, 9, paw) + c.E(124, 186, 18, 9, paw) +
      c.L('M 70 182 L 70 188 M 78 181 L 78 189 M 118 181 L 118 189 M 126 182 L 126 188', dk(paw, 0.4), 1.6, 0.8) +
      c.P(fluff(100, 138, 60, 50, 22, 0.08), fur, { s: so, g: { l: 0.5, d: 0.25 } }) +
      c.P(fluff(100, 150, 32, 28, 14, 0.07), '#ffffff', { w: 0, g: { l: 0.8, d: 0.08 } }) +
      c.L('M 150 116 C 158 132 158 150 150 166', '#fff', 3, 0.7) +
      c.P('M 62 112 Q 100 128 138 112 L 136 124 Q 100 140 64 124 Z', '#e84a5f', { w: 2.4 }) + c.P('M 116 124 L 128 148 L 118 150 L 108 128 Z', '#e84a5f', { w: 2.2 }) +
      c.L('M 70 118 L 70 126 M 82 122 L 82 130 M 94 124 L 94 132', '#fff', 1.6, 0.6);
    const arm = (d, hx, hy) => c.limb(d, fur, 22, { s: so }) + c.L(d, lt('#c5d2f2', 0.2), 4, 0.5) + c.E(hx, hy, 11, 9.5, paw);
    return {
      kind: 'full', ol: dk(face, 0.6), shadow: [100, 192, 64],
      body,
      headBase: hornL + hornR + c.P(fluff(100, 74, 48, 42, 20, 0.08), fur, { s: so, g: { l: 0.5, d: 0.25 } }) +
        c.P('M 69 80 C 69 60 84 52 100 52 C 116 52 131 60 131 80 C 131 100 118 112 100 112 C 82 112 69 100 69 80 Z', face, { g: { l: 0.35, d: 0.2 } }) +
        c.P('M 84 50 C 88 40 96 40 100 48 C 104 40 112 40 116 50 C 108 56 92 56 84 50 Z', fur, { w: 2.4, s: so }) +
        c.P(star4(132, 40, 6), '#ffffff', { w: 1.4, s: horn }),
      armL: arm('M 54 120 Q 36 138 30 158', 30, 164),
      armR: arm('M 146 120 Q 164 138 170 158', 170, 164),
      pivots: { al: [54, 120], ar: [146, 120] },
      neck: [100, 118],
      eyes: [{ x: 87, y: 80, rx: 8.5, ry: 9.5, iris: '#2b4fa8', side: 'l' }, { x: 113, y: 80, rx: 8.5, ry: 9.5, iris: '#2b4fa8', side: 'r' }],
      brows: { y: 65, w: 16, col: '#ffffff', th: 6, lx: 86, rx: 114 },
      mouth: { x: 100, y: 101, w: 18, inside: '#3a2a6a' },
      headFront: c.E(100, 92, 6.5, 4.5, '#34397a', { w: 2, g: { l: 0.5 } }) + c.hl(98, 90.5, 2, 1, -10, 0.8),
      cheeks: { pts: [[77, 95], [123, 95]], rx: 7, ry: 4, col: '#ff8fb8', op: 0.55 },
      fx: { tear: [84, 88], anger: [140, 46], sweat: [66, 62], top: [100, 4], stars: [100, -6] },
      idleMouth: 'smile', browBase: -6,
      poses: { base: { al: 28, ar: 28 }, sad: { al: 5, ar: 5 }, lose: { al: 0, ar: 0 }, happy: { al: 85, ar: 85 }, win: { al: 125, ar: 125 } },
    };
  },

  boss_w5(c) { // Пані Тсс-Тсс
    const fur = '#c4bedd', dress = '#3b3f99', gold = '#e8bb4a', muzzle = '#fbf8ff', so = dk(fur, 0.6);
    const body = c.limb('M 124 178 C 160 184 178 152 168 126 C 162 112 150 114 156 126', fur, 10, { s: so }) +
      c.E(88, 192, 8, 4, '#2a2240', { w: 2 }) + c.E(112, 192, 8, 4, '#2a2240', { w: 2 }) +
      c.P('M 76 118 C 70 146 60 172 54 188 Q 100 198 146 188 C 140 172 130 146 124 118 Z', dress, { g: { l: 0.3, d: 0.35 } }) +
      c.L('M 58 184 Q 100 193 142 184', gold, 3) + c.L('M 86 150 Q 84 170 80 188 M 114 150 Q 116 170 120 188', dk(dress, 0.3), 1.8, 0.7) +
      c.P('M 82 118 Q 100 136 118 118 Q 112 130 100 133 Q 88 130 82 118 Z', '#ffffff', { w: 2, s: '#9a96c4' }) +
      c.P(star5(100, 142, 6), gold, { w: 1.6 });
    const book = c.P('M 64 152 L 100 158 L 136 152 L 136 176 L 100 182 L 64 176 Z', '#9a2f4a', { w: 2.6 }) +
      c.P('M 68 150 L 100 156 L 100 178 L 68 172 Z', '#fdf6e3', { w: 2, s: '#b8a68a' }) + c.P('M 100 156 L 132 150 L 132 172 L 100 178 Z', '#fdf6e3', { w: 2, s: '#b8a68a' }) +
      c.L('M 74 157 L 94 161 M 74 162 L 94 166 M 74 167 L 90 170 M 106 161 L 126 157 M 106 166 L 126 162 M 106 171 L 120 168', '#b8a68a', 1.3);
    return {
      kind: 'full', ol: so, shadow: [100, 194, 52],
      body,
      armL: c.limb('M 79 126 Q 70 144 78 158', dress, 10) + book + c.C(80, 160, 6.5, fur, { s: so }),
      armR: c.limb('M 121 126 Q 132 144 126 160', dress, 10) + c.C(124, 163, 6.5, fur, { s: so }),
      pivots: { al: [79, 126], ar: [121, 126] },
      neck: [100, 118],
      headBase: c.P('M 66 64 L 62 28 L 92 50 Z', fur, { s: so }) + c.P('M 68 58 L 66 38 L 84 51 Z', '#f4a9c0', { w: 0, flat: true }) +
        c.P('M 134 64 L 138 28 L 108 50 Z', fur, { s: so }) + c.P('M 132 58 L 134 38 L 116 51 Z', '#f4a9c0', { w: 0, flat: true }) +
        c.P(star5(130, 40, 6), gold, { w: 1.6 }) +
        c.P('M 60 84 C 58 58 78 44 100 44 C 122 44 142 58 140 84 C 144 92 150 96 153 100 C 142 104 134 114 100 118 C 66 114 58 104 47 100 C 50 96 56 92 60 84 Z', fur, { s: so, g: { l: 0.4, d: 0.22 } }) +
        c.L('M 93 49 L 95 58 M 100 47 L 100 57 M 107 49 L 105 58', dk(fur, 0.3), 2.4, 0.7) +
        c.P('M 86 100 C 86 92 94 90 100 94 C 106 90 114 92 114 100 C 114 108 106 110 100 108 C 94 110 86 108 86 100 Z', muzzle, { w: 0 }) +
        c.L('M 84 99 L 64 96 M 84 102 L 66 104 M 116 99 L 136 96 M 116 102 L 134 104', dk(fur, 0.45), 1.4, 0.8),
      eyes: [{ x: 85, y: 80, rx: 8.5, ry: 9.5, iris: '#2fb38a', side: 'l', lash: true, lid: fur, lidAmt: 0.3 }, { x: 115, y: 80, rx: 8.5, ry: 9.5, iris: '#2fb38a', side: 'r', lash: true, lid: fur, lidAmt: 0.3 }],
      brows: { y: 66, w: 14, col: dk(fur, 0.5), th: 3, lx: 85, rx: 115 },
      mouth: { x: 100, y: 103, w: 11 },
      headFront: c.P('M 96 94 L 104 94 L 100 99 Z', '#f08aa6', { w: 1.6 }) +
        c.P('M 73 81 L 97 81 Q 97 94 85 94 Q 73 94 73 81 Z', 'rgba(220,240,255,.28)', { flat: true, s: gold, w: 2.4 }) +
        c.P('M 103 81 L 127 81 Q 127 94 115 94 Q 103 94 103 81 Z', 'rgba(220,240,255,.28)', { flat: true, s: gold, w: 2.4 }) +
        c.L('M 97 83 Q 100 80 103 83', gold, 2) + c.L('M 73 82 Q 64 100 70 118 M 127 82 Q 136 100 130 118', gold, 1.3, 0.9),
      cheeks: { pts: [[74, 96], [126, 96]], rx: 6, ry: 3.4, col: '#ff8fb0', op: 0.45 },
      fx: { tear: [84, 90], anger: [140, 50], sweat: [60, 62], top: [100, 26], stars: [100, 18] },
      idleMouth: 'smile', browBase: -3,
      poses: { happy: { al: 18, ar: 60 }, win: { al: 30, ar: 120 }, surprised: { al: 20, ar: 50 }, hurt: { al: 30, ar: 50 }, angry: { al: 10, ar: -138 }, talk: { ar: 35 } },
    };
  },

  // ============================================================ ЛИС ФОКС
  fox(c) {
    const fur = '#ee8a3a', cream = '#fff1dc', vest = '#6b2f7a', shirt = '#fdf6ec', gold = '#f2c14a', red = '#d23b4a';
    const card = (rot, sym, col) => `<g transform="rotate(${rot} 170 150)">` + c.P('M 161 108 L 179 108 Q 182 108 182 111 L 182 135 Q 182 138 179 138 L 161 138 Q 158 138 158 135 L 158 111 Q 158 108 161 108 Z', '#ffffff', { s: '#5a4a5a', w: 2, g: { l: 0.5, d: 0.08 } }) +
      `<text x="170" y="128" text-anchor="middle" font-size="14" font-family="Georgia,serif" fill="${col}">${sym}</text></g>`;
    const s = animalBase(c, { fur });
    return Object.assign(s, {
      hand: null,
      back: c.P('M 152 204 C 188 188 198 140 178 112 C 170 100 154 104 160 118 C 172 140 164 172 140 198 Z', fur, { g: { l: 0.3, d: 0.3 } }) +
        c.P('M 160 118 C 154 104 168 98 178 112 C 172 117 166 121 160 118 Z', cream, { w: 2.2, s: dk(fur, 0.55) }),
      body: c.P('M 84 138 L 84 158 Q 100 164 116 158 L 116 138 Z', cream) +
        c.P(TORSO, shirt) +
        c.P('M 26 204 C 28 170 52 154 82 151 L 100 188 L 98 204 Z', vest, { g: { l: 0.3, d: 0.35 } }) +
        c.P('M 174 204 C 172 170 148 154 118 151 L 100 188 L 102 204 Z', vest, { g: { l: 0.3, d: 0.35 } }) +
        c.L('M 40 196 L 52 166 M 54 200 L 66 160 M 160 196 L 148 166 M 146 200 L 134 160', lt(vest, 0.2), 1.2, 0.5) +
        c.C(104, 196, 2.8, gold, { w: 1.4 }) + c.L('M 58 186 Q 72 198 88 188', gold, 2) + c.C(88, 188, 3.4, gold, { w: 1.4 }) +
        c.P('M 100 156 L 85 148 L 85 164 Z', red, { w: 2.4 }) + c.P('M 100 156 L 115 148 L 115 164 Z', red, { w: 2.4 }) + c.C(100, 156, 4, red, { w: 2 }),
      armL: c.limb('M 54 172 Q 44 188 48 206', shirt, 15) + c.C(48, 208, 9, fur),
      armR: card(-32, '♠', '#2b2232') + card(-11, '♥', '#d23b4a') + card(10, '♣', '#2b2232') + card(31, '♦', '#d23b4a') +
        c.limb('M 146 172 Q 166 166 168 150', shirt, 15) + c.C(168, 146, 9, fur) + c.L('M 162 142 Q 166 138 170 140', dk(fur, 0.5), 1.6),
      pivots: { al: [54, 172], ar: [146, 172] },
      headBase: foxHead(c, fur, cream),
      headFront: c.P('M 62 66 Q 100 48 138 66 L 134 76 Q 100 62 66 76 Z', '#3fae6a', { g: { l: 0.4 }, op: 0.95 }) + c.L('M 64 70 Q 100 54 136 70', '#1f6a3a', 2, 0.6),
      neck: [100, 140],
      eyes: [{ x: 82, y: 93, rx: 9, ry: 9.5, iris: '#8bd14a', side: 'l', lid: fur, lidAmt: 0.42 }, { x: 118, y: 93, rx: 9, ry: 9.5, iris: '#8bd14a', side: 'r', lid: fur, lidAmt: 0.42 }],
      brows: { y: 79, w: 16, col: '#6a2e14', th: 3.6, lx: 82, rx: 118 },
      mouth: { x: 100, y: 122, w: 18 },
      cheeks: { pts: [[70, 112], [130, 112]], rx: 6, ry: 3.4, col: '#ff7f7f', op: 0.4 },
      fx: { tear: [78, 100], anger: [138, 70], sweat: [60, 76], top: [100, 40], stars: [100, 34] },
      idleMouth: 'smirk', browBase: 5,
      poses: { happy: { al: 100, ar: 18 }, win: { al: 130, ar: 30 }, surprised: { al: 40, ar: 10 }, sad: { al: -4, ar: -18 }, lose: { al: -6, ar: -30 }, angry: { al: 30, ar: 8 }, hurt: { al: 50, ar: 0 } },
    });
  },

  // ============================================================ ІСТОРІЇ
  mia(c) {
    return human(c, {
      skin: '#ffe0c8', hair: '#e8662e', style: 'bob', eyes: '#3f9a5c', lash: true, freckles: true, outfit: '#fff4dc',
      back: c.limb('M 136 62 L 160 34', '#c98a4a', 4) + c.P('M 157 38 L 166 26 L 168 36 Z', '#3f7fd6', { w: 2 }),
      body: (c) => c.P(TORSO, '#fff4dc') + c.P('M 74 153 Q 88 166 100 156 Q 112 166 126 153 Q 112 150 100 152 Q 88 150 74 153 Z', '#3fb7a6', { w: 2.4 }) +
        c.C(60, 180, 4, '#e8484f', { w: 0 }) + c.C(70, 192, 3, '#3f7fd6', { w: 0 }) + c.C(136, 178, 4.5, '#f6c445', { w: 0 }) + c.C(146, 192, 3, '#3fb7a6', { w: 0 }) + c.C(120, 196, 2.5, '#9a5ae0', { w: 0 }),
      headBase: (c) => c.E(127, 116, 4, 2.2, '#3f7fd6', { w: 0, op: 0.8 }),
      headFront: (c) => `<g transform="rotate(-12 100 36)">` + c.P('M 56 50 C 56 26 90 14 118 18 C 142 22 152 38 148 48 C 128 40 78 40 56 50 Z', '#ffcf3a', { g: { l: 0.45, d: 0.3 } }) +
        c.P('M 108 18 L 110 9 L 116 16 Z', '#ffcf3a', { w: 2 }) + c.hl(84, 28, 14, 4, -10, 0.5) + `</g>`,
    });
  },
  noah(c) {
    return human(c, {
      skin: '#c48a5e', hair: '#2a1c18', style: 'curly', eyes: '#5a3a22', outfit: '#3f9a4f', blush: '#e86a6a',
      back: c.P('M 134 178 L 166 94 L 175 97 L 144 180 Z', '#a8703a', { w: 2.6 }) + c.L('M 160 110 L 168 113 M 156 122 L 164 125 M 152 134 L 160 137', '#e8d8a8', 1.2) +
        c.P('M 164 98 L 171 74 L 184 79 L 175 101 Z', '#3a2418', { w: 2.6 }) + c.C(170, 80, 2.4, '#e8c25a', { w: 1 }) + c.C(176, 84, 2.4, '#e8c25a', { w: 1 }) + c.C(172, 92, 2.4, '#e8c25a', { w: 1 }),
      body: (c) => c.P(TORSO, '#3f9a4f') + c.P('M 82 152 Q 100 160 118 152 L 110 204 L 90 204 Z', '#f4f1e6', { w: 2.4 }) +
        c.P('M 82 152 L 70 160 L 90 204 L 96 204 Z', '#2f7a3d', { w: 2.4 }) + c.P('M 118 152 L 130 160 L 110 204 L 104 204 Z', '#2f7a3d', { w: 2.4 }) +
        c.P('M 52 164 L 62 156 L 150 204 L 132 204 Z', '#6b3d1f', { w: 2.4 }) + c.L('M 60 162 L 140 204', '#e8c25a', 1, 0.6),
      sleeve: '#3f9a4f',
    });
  },
  leo(c) {
    const brass = '#d6a443';
    return human(c, {
      skin: '#ffe3cc', hair: '#f3cf62', style: 'messy', eyes: '#4a86d8', outfit: '#fbf6ee',
      body: (c) => c.P(TORSO, '#fbf6ee') +
        c.P('M 26 204 C 28 170 52 154 84 151 L 96 204 Z', '#8a5a3a', { g: { l: 0.3, d: 0.3 } }) + c.P('M 174 204 C 172 170 148 154 116 151 L 104 204 Z', '#8a5a3a', { g: { l: 0.3, d: 0.3 } }) +
        c.C(108, 180, 2.6, brass, { w: 1.2 }) + c.C(108, 194, 2.6, brass, { w: 1.2 }) +
        c.P('M 100 156 L 88 149 L 88 163 Z', '#9a2b3a', { w: 2.2 }) + c.P('M 100 156 L 112 149 L 112 163 Z', '#9a2b3a', { w: 2.2 }) + c.C(100, 156, 3.4, '#9a2b3a', { w: 1.8 }) +
        c.P(fluff(60, 182, 7, 7, 8, 0.15), brass, { w: 1.8 }) + c.C(60, 182, 2.4, '#8a5a3a', { w: 0 }),
      sleeve: '#fbf6ee',
      headFront: (c) => c.P('M 58 60 Q 100 46 142 60 L 142 68 Q 100 56 58 68 Z', '#5a3a26', { w: 2.4 }) +
        c.C(84, 58, 12.5, brass, { g: { l: 0.5, d: 0.35 } }) + c.C(84, 58, 8, '#5fb8e8', { g: { l: 0.6, d: 0.3 }, w: 2 }) + c.hl(81, 55, 3, 2, -30, 0.8) +
        c.C(116, 58, 12.5, brass, { g: { l: 0.5, d: 0.35 } }) + c.C(116, 58, 8, '#5fb8e8', { g: { l: 0.6, d: 0.3 }, w: 2 }) + c.hl(113, 55, 3, 2, -30, 0.8),
    });
  },
  ava(c) {
    const jacket = '#3f7fd6', scarf = '#e8484f';
    return human(c, {
      skin: '#f2cfae', hair: '#2b1f2a', style: 'braid', eyes: '#7a5232', lash: true, outfit: jacket,
      body: (c) => c.P(TORSO, jacket, { g: { l: 0.35, d: 0.3 } }) +
        c.L('M 36 182 Q 100 166 164 182 M 30 198 Q 100 184 170 198', dk(jacket, 0.35), 2.2, 0.7) + c.L('M 100 170 L 100 204', dk(jacket, 0.4), 2.4) +
        c.P('M 70 150 Q 100 166 130 150 L 132 162 Q 100 178 68 162 Z', scarf, { w: 2.6 }) +
        c.P('M 74 160 L 66 196 L 82 196 L 86 164 Z', scarf, { w: 2.4 }) + c.L('M 70 176 L 84 177 M 68 186 L 83 187', '#fff', 2.4, 0.9) +
        c.L('M 84 158 L 84 170 M 100 162 L 100 174 M 116 158 L 116 170', '#fff', 2.4, 0.8),
      headFront: (c) => c.P(star4(66, 70, 6), '#e8f6ff', { w: 1.4, s: '#5fa8e8' }),
      sleeve: jacket,
    });
  },
  eli(c) {
    const cloak = '#2b2c6e', gold = '#e8c25a';
    let stars = '';
    for (const [x, y, r] of [[46, 186, 3], [62, 170, 2.2], [140, 172, 3], [156, 188, 2.2], [120, 194, 2], [78, 196, 2.4], [150, 160, 1.6]]) stars += `<path d="${star4(x, y, r)}" fill="#fff6c8"/>`;
    return human(c, {
      skin: '#f6dccb', hair: '#dde2f2', style: 'long', eyes: '#9a6ee0', outfit: cloak, browCol: '#9aa2c4',
      back: `<path class="ch-twinkle" d="${star4(158, 44, 6)}" fill="#fff6c8"/><path class="ch-twinkle" style="animation-delay:.6s" d="${star4(40, 60, 4)}" fill="#fff6c8"/>`,
      body: (c) => c.P(TORSO, cloak, { g: { l: 0.25, d: 0.35 } }) + stars +
        c.P('M 70 166 L 74 136 L 92 156 Z', cloak, { s: gold, w: 2.6 }) + c.P('M 130 166 L 126 136 L 108 156 Z', cloak, { s: gold, w: 2.6 }) +
        c.P(star5(100, 160, 8), gold, { w: 2 }),
      sleeve: cloak,
    });
  },

  // ============================================================ ДРАМИ — тварини
  owl(c) {
    const f = '#9a6b4a', face = '#f1dcb8', s = animalBase(c, { fur: f });
    let chest = c.P('M 66 204 C 64 168 80 140 100 140 C 120 140 136 168 134 204 Z', face, { w: 0 });
    for (const [x, y] of [[86, 160], [100, 154], [114, 160], [92, 176], [108, 176], [100, 192], [80, 192], [120, 192]]) chest += c.L(`M ${x - 5} ${y} Q ${x} ${y + 5} ${x + 5} ${y}`, dk(face, 0.35), 2);
    return Object.assign(s, {
      hand: null,
      body: c.P('M 34 204 C 30 150 52 104 100 100 C 148 104 170 150 166 204 Z', f, { g: { l: 0.3, d: 0.3 } }) + chest,
      armL: c.P('M 54 132 C 34 150 30 182 40 204 L 64 204 C 58 178 60 152 66 138 Z', dk(f, 0.12)),
      armR: c.P('M 146 132 C 166 150 170 182 160 204 L 136 204 C 142 178 140 152 134 138 Z', dk(f, 0.12)),
      pivots: { al: [60, 136], ar: [140, 136] },
      headBase: c.P('M 58 52 L 46 16 L 78 40 Z', f) + c.P('M 142 52 L 154 16 L 122 40 Z', f) +
        c.P('M 50 84 C 50 46 74 30 100 30 C 126 30 150 46 150 84 C 150 116 128 132 100 132 C 72 132 50 116 50 84 Z', f, { g: { l: 0.3, d: 0.3 } }) +
        c.C(82, 84, 21, face, { w: 2.4, s: dk(f, 0.3) }) + c.C(118, 84, 21, face, { w: 2.4, s: dk(f, 0.3) }) +
        c.L('M 100 40 L 100 56 M 92 42 L 94 54 M 108 42 L 106 54', dk(f, 0.35), 2, 0.6),
      eyes: [{ x: 82, y: 84, rx: 11.5, ry: 12, iris: '#f5b52e', side: 'l' }, { x: 118, y: 84, rx: 11.5, ry: 12, iris: '#f5b52e', side: 'r' }],
      brows: { y: 62, w: 22, col: dk(f, 0.4), th: 5, lx: 80, rx: 120 },
      mouth: { x: 100, y: 101, w: 13, beak: '#f2a93b' },
      cheeks: { pts: [[66, 98], [134, 98]], rx: 6, ry: 3.4, col: '#ff8f8f', op: 0.45 },
      neck: [100, 128], fx: { tear: [78, 96], anger: [140, 46], sweat: [56, 60], top: [100, 20] },
      poses: { happy: { al: 60, ar: 60 }, win: { al: 90, ar: 90 }, surprised: { al: 40, ar: 40 } },
    });
  },
  rabbit(c) {
    const f = '#cdb6a2', cream = '#fff6ec', pink = '#ffb3c1', s = animalBase(c, { fur: f });
    return Object.assign(s, {
      body: furTorso(c, f, cream) + c.P('M 72 150 Q 100 166 128 150 L 126 160 Q 100 176 74 160 Z', '#f08a2a', { w: 2.4 }) + c.P('M 94 162 L 88 184 L 102 180 Z', '#f08a2a', { w: 2.2 }),
      headBase: c.P('M 78 52 C 64 22 62 -2 74 -4 C 88 -4 94 24 94 50 Z', f) + c.P('M 80 46 C 72 24 72 6 76 6 C 82 6 88 26 88 46 Z', pink, { w: 0, flat: true }) +
        c.P('M 108 50 C 112 26 126 6 140 10 C 152 14 140 34 124 54 Z', f) + c.P('M 113 46 C 118 30 128 16 136 16 C 142 18 134 32 122 48 Z', pink, { w: 0, flat: true }) +
        c.P('M 60 94 C 58 62 78 46 100 46 C 122 46 142 62 140 94 C 140 120 122 134 100 134 C 78 134 60 120 60 94 Z', f, { g: { l: 0.4, d: 0.22 } }) +
        c.P('M 82 112 C 82 101 94 99 100 105 C 106 99 118 101 118 112 C 118 122 108 126 100 124 C 92 126 82 122 82 112 Z', cream, { w: 2, s: dk(f, 0.35) }) +
        c.L('M 82 110 L 64 106 M 82 114 L 66 118 M 118 110 L 136 106 M 118 114 L 134 118', dk(f, 0.45), 1.3, 0.8),
      headFront: c.P('M 96 104 L 104 104 L 100 109 Z', '#f27a96', { w: 1.6 }),
      eyes: [{ x: 84, y: 88, rx: 9, ry: 10.5, iris: '#8a4a2a', side: 'l', lash: true }, { x: 116, y: 88, rx: 9, ry: 10.5, iris: '#8a4a2a', side: 'r', lash: true }],
      brows: { y: 72, w: 14, col: dk(f, 0.45), th: 3.2, lx: 84, rx: 116 },
      mouth: { x: 100, y: 114, w: 12 },
      cheeks: { pts: [[72, 106], [128, 106]], rx: 6, ry: 3.6, col: '#ff8fa8', op: 0.5 },
    });
  },
  hedgehog(c) {
    const sp = '#7a5236', face = '#f2d3a6', s = animalBase(c, { fur: face, paw: face, sleeve: '#e6c491' });
    return Object.assign(s, {
      back: c.P(spiky(100, 90, 50, 70, 22, Math.PI * 0.85, Math.PI * 2.15), sp, { g: { l: 0.35, d: 0.35 } }),
      body: c.P(spiky(100, 168, 64, 78, 10, Math.PI * 1.02, Math.PI * 1.98), sp) + furTorso(c, '#e6c491', '#f6e2c0'),
      headBase: c.C(68, 64, 8, face) + c.C(132, 64, 8, face) +
        c.P('M 64 96 C 62 66 80 52 100 52 C 120 52 138 66 136 96 C 136 122 120 134 100 134 C 80 134 64 122 64 96 Z', face, { g: { l: 0.4, d: 0.2 } }) +
        c.E(100, 112, 13, 10, lt(face, 0.2), { w: 2.2 }) +
        c.C(146, 42, 9, '#e8403a', { g: { l: 0.5 } }) + c.L('M 146 33 L 148 28', '#5a3a22', 2) + c.P('M 148 30 C 154 24 160 28 158 32 C 154 34 150 33 148 30 Z', '#5fbf4a', { w: 1.6 }) +
        c.P('M 56 46 C 60 36 72 34 74 42 C 68 46 62 48 56 46 Z', '#e8a33a', { w: 1.8 }),
      headFront: c.E(100, 106, 5.5, 4.5, '#2a1a24', { w: 1.6, g: { l: 0.5 } }),
      eyes: [{ x: 86, y: 92, rx: 8.5, ry: 10, iris: '#3a2418', side: 'l' }, { x: 114, y: 92, rx: 8.5, ry: 10, iris: '#3a2418', side: 'r' }],
      brows: { y: 77, w: 14, col: dk(sp, 0.2), th: 3.4, lx: 86, rx: 114 },
      mouth: { x: 100, y: 116, w: 11 },
      cheeks: { pts: [[74, 108], [126, 108]], rx: 6, ry: 3.6, col: '#ff8f8f', op: 0.5 },
    });
  },
  rudy(c) {
    const fur = '#f39a4a', cream = '#fff3e2', s = animalBase(c, { fur });
    return Object.assign(s, {
      body: furTorso(c, fur, cream) + c.P('M 72 148 Q 100 164 128 148 L 126 158 Q 100 174 74 158 Z', '#4aa3e0', { w: 2.4 }) + c.P('M 100 160 L 92 182 L 108 182 Z', '#4aa3e0', { w: 2.2 }),
      headBase: foxHead(c, fur, cream, { cub: true }),
      eyes: [{ x: 83, y: 92, rx: 10.5, ry: 12, iris: '#6a3a1a', side: 'l' }, { x: 117, y: 92, rx: 10.5, ry: 12, iris: '#6a3a1a', side: 'r' }],
      brows: { y: 74, w: 14, col: '#8a3a14', th: 3.2, lx: 83, rx: 117 },
      mouth: { x: 100, y: 121, w: 13 },
      cheeks: { pts: [[70, 110], [130, 110]], rx: 6.5, ry: 3.8, col: '#ff7f8f', op: 0.5 },
      browBase: -6,
    });
  },
  mother_fox(c) {
    const fur = '#d9773a', cream = '#fff3e2', shawl = '#8a4ab0', s = animalBase(c, { fur, sleeve: shawl });
    return Object.assign(s, {
      body: furTorso(c, fur, cream) + c.P('M 26 204 C 30 172 58 154 100 168 C 142 154 170 172 174 204 L 150 204 L 100 182 L 50 204 Z', shawl, { g: { l: 0.3, d: 0.3 } }) +
        c.L('M 40 190 L 46 182 M 56 186 L 62 176 M 144 186 L 138 176 M 160 190 L 154 182', lt(shawl, 0.4), 2, 0.7) + c.C(100, 176, 5, '#f2c14a', { w: 1.6 }),
      headBase: foxHead(c, fur, cream) + c.blob([[56, 70, 5], [62, 64, 5], [62, 76, 5], [68, 70, 5]], '#ffffff', { noHl: true }) + c.C(62, 70, 3.4, '#f6c445', { w: 1.2 }),
      eyes: [{ x: 82, y: 93, rx: 9, ry: 10, iris: '#b8742a', side: 'l', lash: true, lid: fur, lidAmt: 0.24 }, { x: 118, y: 93, rx: 9, ry: 10, iris: '#b8742a', side: 'r', lash: true, lid: fur, lidAmt: 0.24 }],
      brows: { y: 78, w: 15, col: '#7a3214', th: 3, lx: 82, rx: 118 },
      mouth: { x: 100, y: 122, w: 14 },
      cheeks: { pts: [[70, 112], [130, 112]], rx: 6, ry: 3.4, col: '#ff7f8f', op: 0.45 },
      browBase: -5,
    });
  },
  crow(c) {
    const f = '#34384f', beak = '#a9afbf', s = animalBase(c, { fur: f });
    return Object.assign(s, {
      ol: '#141626', hand: null,
      body: c.P('M 34 204 C 32 156 56 128 100 126 C 144 128 168 156 166 204 Z', f, { g: { l: 0.3, d: 0.4 } }) +
        c.L('M 70 160 Q 100 176 130 160', lt('#7a6ad0', 0.2), 2, 0.5) +
        c.L('M 72 146 Q 100 178 128 146', '#c9ccd8', 1.6) + c.P('M 96 172 L 104 172 L 104 186 L 108 186 L 108 190 L 104 190 L 104 194 L 96 194 Z', '#d8dbe6', { w: 1.8, g: { l: 0.6 } }),
      armL: c.P('M 54 148 C 34 166 30 190 40 204 L 64 204 C 58 184 60 164 66 152 Z', dk(f, 0.2), { s: '#141626' }),
      armR: c.P('M 146 148 C 166 166 170 190 160 204 L 136 204 C 142 184 140 164 134 152 Z', dk(f, 0.2), { s: '#141626' }),
      pivots: { al: [60, 150], ar: [140, 150] },
      headBase: c.P('M 92 40 C 88 24 96 14 104 22 C 106 12 118 12 114 30 C 122 24 128 30 118 42 Z', f, { s: '#141626' }) +
        c.P('M 56 88 C 56 56 76 38 100 38 C 124 38 144 56 144 88 C 144 116 126 132 100 132 C 74 132 56 116 56 88 Z', f, { s: '#141626', g: { l: 0.32, d: 0.35 } }) +
        c.L('M 70 56 Q 100 40 130 56', lt('#8a7ae0', 0.3), 2.4, 0.55),
      eyes: [{ x: 83, y: 86, rx: 9, ry: 10, iris: '#4a2a6a', side: 'l', lid: f, lidAmt: 0.3 }, { x: 117, y: 86, rx: 9, ry: 10, iris: '#4a2a6a', side: 'r', lid: f, lidAmt: 0.3 }],
      brows: { y: 71, w: 17, col: '#0e0f1a', th: 4.4, lx: 83, rx: 117 },
      mouth: { x: 100, y: 102, w: 18, beak },
      cheeks: { pts: [[70, 104], [130, 104]], rx: 6, ry: 3, col: '#ff8fb0', op: 0.3 },
      idleMouth: 'smirk', browBase: 6,
      poses: { happy: { al: 60, ar: 60 }, win: { al: 90, ar: 90 }, surprised: { al: 40, ar: 40 } },
    });
  },
  badger(c) {
    const f = '#8d8f9e', white = '#f4f4f6', blk = '#2a2a34', sweater = '#c7843a', s = animalBase(c, { fur: f, sleeve: sweater, paw: blk });
    return Object.assign(s, {
      body: c.P(TORSO, sweater, { g: { l: 0.35, d: 0.3 } }) + c.L('M 40 184 Q 100 170 160 184 M 36 196 Q 100 182 164 196', dk(sweater, 0.3), 2, 0.6) +
        c.P('M 74 152 Q 100 168 126 152 L 124 162 Q 100 178 76 162 Z', dk(sweater, 0.15), { w: 2.2 }),
      headBase: c.C(66, 60, 10, f) + c.C(134, 60, 10, f) + c.C(66, 60, 5, blk, { w: 0 }) + c.C(134, 60, 5, blk, { w: 0 }) +
        c.P('M 58 94 C 56 62 78 46 100 46 C 122 46 144 62 142 94 C 142 120 124 136 100 136 C 76 136 58 120 58 94 Z', f, { g: { l: 0.35, d: 0.25 } }) +
        c.P('M 100 46 C 112 46 118 60 114 80 C 112 96 108 110 100 116 C 92 110 88 96 86 80 C 82 60 88 46 100 46 Z', white, { w: 0 }) +
        c.P('M 78 112 C 80 104 92 102 100 112 C 108 102 120 104 122 112 C 120 126 110 132 100 132 C 90 132 80 126 78 112 Z', white, { w: 0 }) +
        c.P('M 66 70 C 72 62 84 62 90 76 C 94 90 92 104 86 108 C 78 104 70 92 66 70 Z', blk, { w: 0, flat: true }) +
        c.P('M 134 70 C 128 62 116 62 110 76 C 106 90 108 104 114 108 C 122 104 130 92 134 70 Z', blk, { w: 0, flat: true }),
      headFront: c.E(100, 114, 7, 5, blk, { w: 1.6, g: { l: 0.5 } }) +
        `<circle cx="84" cy="90" r="13" fill="rgba(220,240,255,.22)" stroke="#5a3a26" stroke-width="3.4"/><circle cx="116" cy="90" r="13" fill="rgba(220,240,255,.22)" stroke="#5a3a26" stroke-width="3.4"/>` +
        c.L('M 97 89 Q 100 86 103 89', '#5a3a26', 3) + c.hl(79, 84, 4, 2, -35, 0.7) + c.hl(111, 84, 4, 2, -35, 0.7),
      eyes: [{ x: 84, y: 90, rx: 8, ry: 9, iris: '#5a3a26', side: 'l' }, { x: 116, y: 90, rx: 8, ry: 9, iris: '#5a3a26', side: 'r' }],
      brows: { y: 72, w: 15, col: white, th: 4.2, lx: 84, rx: 116 },
      mouth: { x: 100, y: 122, w: 13 },
      cheeks: { pts: [[70, 110], [130, 110]], rx: 6, ry: 3.4, col: '#ff8f8f', op: 0.4 },
    });
  },
  keeper(c) {
    const fur = '#e3eaf4', face = '#c8d8ec', rune = '#5fd4ff', s = animalBase(c, { fur, paw: '#9fb2cc' });
    return Object.assign(s, {
      ol: dk('#9fb2cc', 0.6),
      back: c.P(fluff(100, 120, 84, 70, 26, 0.07), fur, { s: dk('#9fb2cc', 0.55), g: { l: 0.4, d: 0.3 } }),
      body: c.P(TORSO, '#d4deec', { g: { l: 0.4, d: 0.3 } }) + c.P(fluff(100, 162, 56, 22, 18, 0.1), fur, { s: dk('#9fb2cc', 0.5) }),
      headBase: c.C(60, 54, 11, fur, { s: dk('#9fb2cc', 0.55) }) + c.C(140, 54, 11, fur, { s: dk('#9fb2cc', 0.55) }) + c.C(60, 54, 5, '#8fa3c8', { w: 0 }) + c.C(140, 54, 5, '#8fa3c8', { w: 0 }) +
        c.P('M 80 40 L 86 22 L 92 38 L 100 16 L 108 38 L 114 22 L 120 40 Z', '#9fe6ff', { g: { l: 0.6 }, s: '#3a8ab0' }) +
        c.P(fluff(100, 86, 46, 46, 20, 0.07), fur, { s: dk('#9fb2cc', 0.55), g: { l: 0.45, d: 0.25 } }) +
        c.P('M 72 92 C 72 70 86 60 100 60 C 114 60 128 70 128 92 C 128 112 116 124 100 124 C 84 124 72 112 72 92 Z', face, { w: 0 }) +
        c.E(100, 112, 16, 12, '#f4f8ff', { w: 2.4, s: dk('#9fb2cc', 0.4) }) +
        `<path class="ch-glow" d="M 100 48 L 100 62 M 94 54 L 106 54 M 76 74 L 70 80 M 124 74 L 130 80" stroke="${rune}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,
      headFront: c.E(100, 106, 8, 5.5, '#2b3550', { w: 1.8, g: { l: 0.5 } }),
      eyes: [{ x: 85, y: 88, rx: 8, ry: 9, iris: '#3fd6c8', side: 'l', glow: true }, { x: 115, y: 88, rx: 8, ry: 9, iris: '#3fd6c8', side: 'r', glow: true }],
      brows: { y: 74, w: 18, col: '#ffffff', th: 6, lx: 84, rx: 116 },
      mouth: { x: 100, y: 116, w: 14, inside: '#2b3550' },
      cheeks: { pts: [[72, 104], [128, 104]], rx: 6, ry: 3.4, col: '#9fc6ff', op: 0.5 },
      idleMouth: 'flat', browBase: 2,
    });
  },
  tock(c) {
    const steel = '#9cb8c8', brass = '#d6a443', navy = '#2d3f6e', so = dk(steel, 0.6);
    return {
      kind: 'bust', ol: so, neck: [100, 136], hand: { col: navy, skin: '#cfd8e0' },
      body: c.P('M 90 126 L 90 156 L 110 156 L 110 126 Z', '#7a8a9a') + c.L('M 90 136 L 110 136 M 90 144 L 110 144', '#4a5a6a', 1.6) +
        c.P(TORSO, navy, { g: { l: 0.3, d: 0.35 } }) + c.P('M 30 172 Q 44 156 62 156 L 60 166 Q 46 168 36 178 Z', brass, { w: 2 }) + c.P('M 170 172 Q 156 156 138 156 L 140 166 Q 154 168 164 178 Z', brass, { w: 2 }) +
        c.L('M 100 156 L 100 204', dk(navy, 0.4), 2) + c.C(108, 172, 3, brass, { w: 1.4 }) + c.C(108, 186, 3, brass, { w: 1.4 }) + c.C(108, 200, 3, brass, { w: 1.4 }) +
        c.P(star5(70, 182, 7), brass, { w: 1.6 }),
      headBase: c.P('M 54 86 L 64 86 L 64 106 L 54 106 Z', brass, { w: 2.4 }) + c.P('M 146 86 L 136 86 L 136 106 L 146 106 Z', brass, { w: 2.4 }) +
        c.P('M 62 62 Q 62 50 74 50 L 126 50 Q 138 50 138 62 L 138 124 Q 138 136 126 136 L 74 136 Q 62 136 62 124 Z', steel, { g: { l: 0.45, d: 0.3 } }) +
        c.L('M 132 60 L 132 126', lt(steel, 0.6), 2.4, 0.6) +
        `<circle cx="70" cy="58" r="2" fill="${so}"/><circle cx="130" cy="58" r="2" fill="${so}"/><circle cx="70" cy="128" r="2" fill="${so}"/><circle cx="130" cy="128" r="2" fill="${so}"/>` +
        c.C(84, 92, 13, brass, { w: 2.4 }) + c.C(116, 92, 13, brass, { w: 2.4 }) +
        c.P('M 84 114 L 116 114 Q 120 114 120 118 L 120 126 Q 120 130 116 130 L 84 130 Q 80 130 80 126 L 80 118 Q 80 114 84 114 Z', '#2b3a4a', { w: 2.2, flat: true }),
      headFront: c.P('M 58 54 C 58 34 78 24 100 24 C 122 24 142 34 142 54 Z', navy, { g: { l: 0.35, d: 0.3 } }) + c.P('M 52 54 L 148 54 L 150 62 L 50 62 Z', '#1f2b4e', { w: 2.4 }) +
        c.P(star5(100, 40, 8), brass, { w: 1.8 }) + c.C(100, 18, 4, '#ff5a5a', { g: { l: 0.6 }, w: 1.8, a: 'class="ch-glow"' }) + c.L('M 100 22 L 100 26', '#4a5a6a', 2),
      eyes: [{ x: 84, y: 92, rx: 9, ry: 9, iris: '#2fd0ff', side: 'l', sclera: '#e8fbff', glow: true }, { x: 116, y: 92, rx: 9, ry: 9, iris: '#2fd0ff', side: 'r', sclera: '#e8fbff', glow: true }],
      brows: { y: 74, w: 16, col: '#3a4a5a', th: 4, lx: 84, rx: 116 },
      mouth: { x: 100, y: 120, w: 15, inside: '#0f1a26', tongue: '#2fd0ff' },
      cheeks: { pts: [[70, 112], [130, 112]], rx: 5, ry: 3, col: '#ffb04a', op: 0.5 },
      fx: { tear: [80, 104], anger: [140, 70], sweat: [60, 76], top: [100, 12] },
      idleMouth: 'flat', browBase: 3,
    };
  },

  // ============================================================ ДРАМИ — люди
  mira(c) {
    return human(c, {
      skin: '#ffd9c0', hair: '#7a4a2a', style: 'buns', eyes: '#c07a2a', lash: true, freckles: true, outfit: '#f2e6d0',
      body: (c) => c.P(TORSO, '#f2e6d0') + c.P('M 60 204 L 66 166 Q 100 176 134 166 L 140 204 Z', '#a33b48', { g: { l: 0.3, d: 0.3 } }) +
        c.L('M 66 166 L 54 156 M 134 166 L 146 156', '#a33b48', 4) + c.P('M 88 182 L 112 182 L 110 196 L 90 196 Z', dk('#a33b48', 0.2), { w: 2 }) +
        c.P(fluff(100, 189, 4.5, 4.5, 8, 0.2), '#d6a443', { w: 1.4 }),
      headFront: (c) => c.L('M 108 50 L 120 60', '#5a3a26', 2.4) + c.C(124, 62, 7, '#d6a443', { w: 2.2 }) + c.C(124, 62, 4.4, '#bfe6ff', { w: 0, g: { l: 0.7 } }),
      sleeve: '#f2e6d0',
    });
  },
  mayor(c) {
    return human(c, {
      skin: '#f0c4a2', hair: '#c9c9d2', style: 'bald', eyes: '#4a5a7a', outfit: '#5a3a8a', browTh: 5.5, browCol: '#9a9aa6', mouthY: 122,
      headBase: (c) => c.L('M 76 108 Q 80 111 86 108 M 114 108 Q 120 111 124 108', dk('#f0c4a2', 0.3), 1.4, 0.7) + c.hl(90, 54, 16, 6, -15, 0.55),
      body: (c) => c.P(TORSO, '#5a3a8a', { g: { l: 0.3, d: 0.35 } }) + c.P('M 84 152 Q 100 160 116 152 L 112 204 L 88 204 Z', '#fff', { w: 2.2 }) +
        c.P('M 84 152 L 72 160 L 90 204 L 96 204 Z', '#3f2766', { w: 2.2 }) + c.P('M 116 152 L 128 160 L 110 204 L 104 204 Z', '#3f2766', { w: 2.2 }) +
        c.L('M 66 160 Q 100 200 134 160', '#e8c25a', 3.4) + c.C(100, 184, 8, '#e8c25a', { g: { l: 0.5 } }) + c.P(star5(100, 184, 4.5), '#c98a2a', { w: 0 }),
      headFront: (c) => c.P('M 100 113 C 92 108 76 108 70 118 C 78 121 92 119 100 117 C 108 119 122 121 130 118 C 124 108 108 108 100 113 Z', '#d8d8e0', { w: 2.4, s: '#8a8a96' }),
      sleeve: '#5a3a8a',
    });
  },
  sora(c) {
    return human(c, {
      skin: '#e6bd96', hair: '#1f2a44', style: 'pixie', eyes: '#3a2a20', lash: true, outfit: '#e8823a',
      back: c.E(100, 96, 66, 64, '#e8823a', { g: { l: 0.3, d: 0.35 } }) + c.P(fluff(100, 92, 56, 56, 22, 0.07), '#f3e6d2', { s: '#a8987e' }),
      body: (c) => c.P(TORSO, '#e8823a', { g: { l: 0.3, d: 0.3 } }) + c.P(fluff(100, 158, 30, 9, 12, 0.12), '#f3e6d2', { s: '#a8987e' }) +
        c.L('M 100 166 L 100 204', dk('#e8823a', 0.4), 2.4) + c.P('M 124 178 L 146 178 L 146 196 L 124 196 Z', dk('#e8823a', 0.15), { w: 2 }),
      headBase: (c) => c.L('M 74 108 L 82 108 M 118 108 L 126 108', '#2fb3a6', 2.6),
      sleeve: '#e8823a',
    });
  },
  brann(c) {
    const ging = '#c0562a';
    return human(c, {
      skin: '#f0c4a0', hair: ging, style: 'short', eyes: '#3c6a8a', outfit: '#2f6b4a', mouthY: 121,
      headBase: (c) => c.P('M 63 98 C 64 126 80 146 100 148 C 120 146 136 126 137 98 C 132 116 122 126 100 128 C 78 126 68 116 63 98 Z', ging, { g: { l: 0.3, d: 0.3 } }) +
        `<g transform="rotate(18 126 72)">` + c.P('M 116 68 L 136 68 L 136 76 L 116 76 Z', '#f1d1a0', { w: 1.8 }) + `<circle cx="123" cy="72" r=".9" fill="#a88a5a"/><circle cx="129" cy="72" r=".9" fill="#a88a5a"/></g>`,
      body: (c) => c.P(TORSO, '#2f6b4a', { g: { l: 0.3, d: 0.3 } }) + c.P('M 82 152 L 100 168 L 118 152 Z', '#e8e0c8', { w: 2 }) + c.L('M 100 168 L 100 204', dk('#2f6b4a', 0.4), 2.4) +
        c.L('M 40 172 L 54 204 M 160 172 L 146 204', '#e8c25a', 3, 0.8),
      headFront: (c) => c.P('M 100 114 C 92 110 82 112 77 119 C 86 119 94 118 100 117 C 106 118 114 119 123 119 C 118 112 108 110 100 114 Z', ging, { w: 2 }) +
        c.P('M 58 64 C 56 34 76 22 100 22 C 124 22 144 34 142 64 Z', '#d83a3a', { g: { l: 0.35, d: 0.3 } }) +
        c.P('M 54 58 Q 100 48 146 58 L 146 72 Q 100 62 54 72 Z', '#b02a2a', { w: 2.6 }) + c.L('M 66 56 L 66 68 M 80 54 L 80 66 M 94 53 L 94 65 M 108 53 L 108 65 M 122 54 L 122 66 M 136 56 L 136 68', '#8a1f1f', 1.4, 0.7) +
        c.P(fluff(100, 20, 11, 10, 10, 0.14), '#ffffff', { s: '#a8a8b8' }),
      sleeve: '#2f6b4a', browY: 80,
    });
  },
  vesper(c) {
    const cloak = '#3a1f3a';
    return human(c, {
      skin: '#ead4c4', hair: '#2a2433', style: 'slick', eyes: '#d9a43a', outfit: cloak, lid: 0.32, browBase: 7, idleMouth: 'smirk',
      back: c.P('M 138 98 C 146 72 156 54 170 40 C 168 60 158 80 142 100 Z', '#f5f0e6', { w: 2, s: '#9a8a7a' }) + c.L('M 140 100 L 168 42', '#9a8a7a', 1.2),
      headBase: (c) => c.L('M 77 108 Q 84 111 91 108 M 109 108 Q 116 111 123 108', dk('#ead4c4', 0.3), 1.3, 0.6),
      body: (c) => c.P(TORSO, cloak, { g: { l: 0.25, d: 0.35 } }) + c.P('M 82 150 L 100 172 L 118 150 Z', '#e8e0d8', { w: 2 }) +
        c.P('M 64 152 L 72 118 L 94 156 Z', cloak, { s: '#c9a24a', w: 2.6 }) + c.P('M 136 152 L 128 118 L 106 156 Z', cloak, { s: '#c9a24a', w: 2.6 }) +
        c.C(100, 176, 4.5, '#c9a24a', { w: 1.6 }),
      sleeve: cloak,
    });
  },
  ines(c) {
    return human(c, {
      skin: '#8a5a3c', hair: '#1a1214', style: 'bun', eyes: '#3a2418', lash: true, outfit: '#2f9a96', blush: '#e86a7a',
      body: (c) => c.P(TORSO, '#fff6e6') + c.P('M 26 204 C 28 170 54 154 84 151 L 94 204 Z', '#2f9a96', { g: { l: 0.3, d: 0.3 } }) + c.P('M 174 204 C 172 170 146 154 116 151 L 106 204 Z', '#2f9a96', { g: { l: 0.3, d: 0.3 } }) +
        c.C(90, 176, 2.4, '#fff', { w: 1 }) + c.C(90, 190, 2.4, '#fff', { w: 1 }) + c.P('M 120 176 L 136 176 L 134 190 L 122 190 Z', dk('#2f9a96', 0.15), { w: 2 }) + c.L('M 124 172 L 126 184', '#f6c445', 2.4),
      headFront: (c) => `<circle cx="85" cy="96" r="12.5" fill="rgba(220,240,255,.18)" stroke="#d6a443" stroke-width="2.6"/><circle cx="115" cy="96" r="12.5" fill="rgba(220,240,255,.18)" stroke="#d6a443" stroke-width="2.6"/>` +
        c.L('M 97.5 95 Q 100 92 102.5 95', '#d6a443', 2.4) + c.C(63, 112, 3.4, '#f2c14a', { w: 1.4 }) + c.C(137, 112, 3.4, '#f2c14a', { w: 1.4 }),
      sleeve: '#2f9a96',
    });
  },
};

// невідомий speaker → згенерований (детерміновано за іменем) вигляд
function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function generated(id) {
  const h = hash(id);
  const pick = (arr, k) => arr[(h >>> k) % arr.length];
  const skin = pick(['#ffe0c8', '#f2c9a8', '#d9a07a', '#b07850', '#8a5a3c', '#f6dccb'], 0);
  const hair = pick(['#2a1c18', '#7a4a2a', '#e8662e', '#f3cf62', '#1f2a44', '#c9c9d2', '#5a2a5a'], 3);
  const style = pick(['bob', 'curly', 'messy', 'pixie', 'buns', 'long', 'slick', 'bun'], 6);
  const outfit = pick(['#3f9a4f', '#3f7fd6', '#a33b48', '#e8823a', '#5a3a8a', '#2f9a96', '#c7843a'], 9);
  const eyes = pick(['#3f9a5c', '#4a86d8', '#7a5232', '#9a6ee0', '#c07a2a'], 12);
  return (c) => human(c, { skin, hair, style, outfit, eyes, lash: !!((h >>> 15) & 1), freckles: !((h >>> 16) % 3), sleeve: outfit });
}

// ---------------------------------------------------------------- стилі
let styleDone = false;
function ensureStyle() {
  if (styleDone || typeof document === 'undefined') return;
  styleDone = true;
  const vb = '.chr .ch-anim,.chr .ch-pose,.chr .ch-head,.chr .ch-headi,.chr .ch-body,.chr .ch-arm,.chr .ch-armi,.chr .ch-hand,.chr .ch-handi,.chr .ch-pend,.chr .ch-key,.chr .ch-hmin,.chr .ch-hhour,.chr .ch-orbit';
  const fb = '.chr .ch-eye,.chr .ch-eo,.chr .ch-iris,.chr .ch-brow,.chr .ch-fx,.chr .ch-spark,.chr .ch-twinkle,.chr .ch-glow';
  const mouthCss = MOUTHS.map((k) => `.chr[data-mouth=${k}] .ch-m-${k}`).join(',');
  const css = `
.chr{position:relative;display:inline-block;flex:none;line-height:0;vertical-align:bottom;--by:0;--bra:0;--al:0;--ar:0;--hr:0;--hy:0;--px:0;--py:0;--mx:0;--my:0;--mr:0;--hand:95;-webkit-user-select:none;user-select:none;pointer-events:none}
.chr .ch-react{width:100%;height:100%;transition:filter .6s}
.chr svg{width:100%;height:100%;display:block;overflow:visible}
.chr.chr-bust svg{overflow:hidden}
.chr.chr-flip svg{transform:scaleX(-1)}
${vb}{transform-box:view-box}
${fb}{transform-box:fill-box;transform-origin:center}
.chr .ch-anim,.chr .ch-pose{transform-origin:100px 196px}
.chr .ch-pose{transform:translate(calc(var(--mx)*1px),calc(var(--my)*1px)) rotate(calc(var(--mr)*1deg));transition:transform .45s cubic-bezier(.3,1.3,.5,1)}
.chr .ch-body{transform-origin:100px 200px;animation:ch-breathe 3.4s ease-in-out infinite}
.chr .ch-head{transform:translateY(calc(var(--hy)*1px)) rotate(calc(var(--hr)*1deg));transition:transform .4s cubic-bezier(.3,1.4,.5,1)}
.chr .ch-headi{animation:ch-bob 4.2s ease-in-out infinite}
.chr .ch-al{transform:rotate(calc(var(--al)*1deg));transition:transform .42s cubic-bezier(.3,1.45,.5,1)}
.chr .ch-ar{transform:rotate(calc(var(--ar)*-1deg));transition:transform .42s cubic-bezier(.3,1.45,.5,1)}
.chr .ch-bl{transform:translateY(calc(var(--by)*1px)) rotate(calc(var(--bra)*1deg));transition:transform .25s ease-out}
.chr .ch-br{transform:translateY(calc(var(--by)*1px)) rotate(calc(var(--bra)*-1deg));transition:transform .25s ease-out}
.chr .ch-pup{transform:translate(calc(var(--px)*1px),calc(var(--py)*1px));transition:transform .3s ease-out}
.chr .ch-eo{transition:transform .07s,opacity .12s}
.chr .ch-iris{transition:transform .2s}
.chr .ch-lid{transition:opacity .2s}
.chr .ch-eh,.chr .ch-ec,.chr .ch-ex{opacity:0;transition:opacity .12s}
.chr[data-eyes=happy] .ch-eo,.chr[data-eyes=closed] .ch-eo,.chr[data-eyes=hurt] .ch-eo{opacity:0}
.chr[data-eyes=happy] .ch-eh,.chr[data-eyes=closed] .ch-ec,.chr[data-eyes=hurt] .ch-ex{opacity:1}
.chr[data-eyes=wide] .ch-eo{transform:scale(1.14)}
.chr[data-eyes=wide] .ch-iris{transform:scale(.76)}
.chr[data-eyes=wide] .ch-lid{opacity:0}
.chr.ch-blink .ch-eo{transform:scaleY(.08)}
.chr .ch-m{opacity:0;transition:opacity .05s}
${mouthCss}{opacity:1}
.chr .ch-hand{transform:translateY(calc(var(--hand)*1px));transition:transform .45s cubic-bezier(.3,1.4,.5,1)}
.chr .ch-handi{animation:ch-wave .45s ease-in-out infinite alternate}
.chr .ch-fx{opacity:0;transition:opacity .25s}
.chr[data-mood=sad] .ch-fx-tear,.chr[data-mood=lose] .ch-fx-tear{opacity:1;animation:ch-tear 1.8s ease-in infinite}
.chr[data-mood=angry] .ch-fx-anger,.chr[data-mood=hurt] .ch-fx-anger{opacity:1;animation:ch-throb .4s ease-in-out infinite alternate}
.chr[data-mood=surprised] .ch-fx-sweat{opacity:1;animation:ch-tear 2s ease-in infinite}
.chr[data-mood=happy] .ch-fx-spark,.chr[data-mood=win] .ch-fx-spark{opacity:1}
.chr[data-mood=happy] .ch-spark,.chr[data-mood=win] .ch-spark{animation:ch-twinkle 1.1s ease-in-out infinite}
.chr[data-mood=lose] .ch-fx-stars{opacity:1}
.chr[data-mood=lose] .ch-orbit{animation:ch-orbit 2.4s linear infinite}
.chr .ch-twinkle{animation:ch-twinkle 2.4s ease-in-out infinite}
.chr .ch-glow{animation:ch-glow 2.2s ease-in-out infinite}
.chr .ch-pend{animation:ch-pend 1.2s ease-in-out infinite alternate}
.chr .ch-key{animation:ch-key 1.6s ease-in-out infinite}
.chr .ch-hmin{animation:ch-spin 12s steps(60) infinite}
.chr .ch-hhour{animation:ch-spin 144s linear infinite}
.chr[data-mood=happy] .ch-anim{animation:ch-hop .5s cubic-bezier(.3,.6,.4,1) 2,ch-sway 2.4s ease-in-out 1s infinite}
.chr[data-mood=win] .ch-anim{animation:ch-hop .62s cubic-bezier(.3,.6,.4,1) infinite}
.chr[data-mood=sad] .ch-anim{animation:ch-sigh 3.2s ease-in-out infinite}
.chr[data-mood=surprised] .ch-anim{animation:ch-surp .5s cubic-bezier(.3,1.6,.5,1)}
.chr[data-mood=angry] .ch-anim{animation:ch-fume 1.3s linear infinite}
.chr[data-mood=hurt] .ch-anim{animation:ch-hurt .6s cubic-bezier(.2,.8,.4,1),ch-wob 1.6s ease-in-out .6s infinite}
.chr[data-mood=lose] .ch-anim{animation:ch-wob 2.8s ease-in-out infinite}
.chr[data-mood=lose] .ch-react{filter:saturate(.55) brightness(.94)}
.chr[data-mood=happy] .ch-headi,.chr[data-mood=win] .ch-headi{animation:ch-bob 1.3s ease-in-out infinite}
.chr[data-talk="1"] .ch-headi{animation:ch-nod .34s ease-in-out infinite alternate}
@keyframes ch-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.012,1.028)}}
@keyframes ch-bob{0%,100%{transform:rotate(-1.4deg)}50%{transform:rotate(1.4deg) translateY(-1px)}}
@keyframes ch-nod{0%{transform:rotate(-2deg) translateY(1px)}100%{transform:rotate(1.6deg) translateY(-1.5px)}}
@keyframes ch-wave{0%{transform:rotate(-12deg)}100%{transform:rotate(12deg)}}
@keyframes ch-hop{0%,100%{transform:none}40%{transform:translateY(-14px) scale(.97,1.04)}75%{transform:translateY(0) scale(1.05,.95)}}
@keyframes ch-sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
@keyframes ch-sigh{0%,100%{transform:translateY(0)}50%{transform:translateY(2.5px) scale(1.01,.985)}}
@keyframes ch-surp{0%{transform:none}35%{transform:translateY(-12px) scale(1.06)}100%{transform:translateY(-2px)}}
@keyframes ch-fume{0%,46%,100%{transform:none}50%{transform:translateX(-3px) rotate(-1deg)}56%{transform:translateX(3px) rotate(1deg)}62%{transform:translateX(-2px)}68%{transform:translateX(2px)}74%{transform:none}}
@keyframes ch-hurt{0%{transform:none}25%{transform:translate(12px,-6px) rotate(8deg)}60%{transform:translate(-4px,0) rotate(-3deg)}100%{transform:none}}
@keyframes ch-wob{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
@keyframes ch-tear{0%{transform:translateY(0) scale(.6);opacity:0}20%{opacity:1;transform:translateY(0) scale(1)}100%{transform:translateY(18px) scale(.9);opacity:0}}
@keyframes ch-throb{0%{transform:scale(.8)}100%{transform:scale(1.15)}}
@keyframes ch-twinkle{0%,100%{transform:scale(.5) rotate(0);opacity:.4}50%{transform:scale(1.15) rotate(45deg);opacity:1}}
@keyframes ch-orbit{to{transform:rotate(360deg)}}
@keyframes ch-spin{to{transform:rotate(360deg)}}
@keyframes ch-glow{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes ch-pend{0%{transform:rotate(-16deg)}100%{transform:rotate(16deg)}}
@keyframes ch-key{0%,100%{transform:scaleY(1)}50%{transform:scaleY(-1)}}
@media (prefers-reduced-motion:reduce){.chr,.chr *{animation:none!important;transition:none!important}}
`;
  const st = document.createElement('style');
  st.dataset.characters = '1';
  st.textContent = css;
  document.head.append(st);
}

// ---------------------------------------------------------------- збирання SVG
function fxSvg(c, s) {
  const fx = s.fx || {};
  const head = [], top = [];
  if (fx.tear) {
    const [x, y] = fx.tear;
    head.push(`<path class="ch-fx ch-fx-tear" d="M${x} ${y}c-3 5-5.5 8-5.5 11a5.5 5.5 0 0 0 11 0c0-3-2.5-6-5.5-11Z" fill="#8fd8ff" stroke="#3a8ac0" stroke-width="1.6"/>`);
  }
  if (fx.sweat) {
    const [x, y] = fx.sweat;
    head.push(`<path class="ch-fx ch-fx-sweat" d="M${x} ${y}c-3 5-5 8-5 10.5a5 5 0 0 0 10 0c0-2.5-2-5.5-5-10.5Z" fill="#cfefff" stroke="#3a8ac0" stroke-width="1.6"/>`);
  }
  if (fx.anger) {
    const [x, y] = fx.anger;
    head.push(`<g transform="translate(${x} ${y})"><g class="ch-fx ch-fx-anger"><path d="M-8-2Q-2-2-2-8M2-8Q2-2 8-2M8 2Q2 2 2 8M-2 8Q-2 2-8 2" fill="none" stroke="#ff3b4f" stroke-width="3.4" stroke-linecap="round"/></g></g>`);
  }
  if (fx.top) {
    const [x, y] = fx.top;
    let sp = '';
    [[-44, 18, 7], [44, 10, 8], [-30, -8, 5], [34, -14, 5.5]].forEach(([dx, dy, r], i) => {
      sp += `<path class="ch-spark" style="animation-delay:${i * 0.18}s" d="${star4(x + dx, y + dy, r)}" fill="#ffe36a" stroke="#d99a1a" stroke-width="1.2"/>`;
    });
    top.push(`<g class="ch-fx ch-fx-spark">${sp}</g>`);
  }
  if (fx.stars) {
    const [x, y] = fx.stars;
    let st = '';
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      st += `<path d="${star5(r1(28 * Math.cos(a)), r1(28 * Math.sin(a)), 6)}" fill="#ffe36a" stroke="#c9881a" stroke-width="1.4"/>`;
    }
    top.push(`<g class="ch-fx ch-fx-stars" transform="translate(${x} ${y}) scale(1 .4)"><g class="ch-orbit">${st}</g></g>`);
  }
  return { head: head.join(''), top: top.join('') };
}

function buildSvg(c, s, name) {
  const ol = s.ol || '#3a2440';
  const org = (p) => (p ? ` style="transform-origin:${p[0]}px ${p[1]}px"` : '');
  const eyes = (s.eyes || []).map((e) => eyeSvg(c, e, ol)).join('');
  const b = s.brows;
  const brows = b ? browSvg({ x: b.lx, y: b.y, w: b.w, col: b.col, th: b.th }, 'l') + browSvg({ x: b.rx, y: b.y, w: b.w, col: b.col, th: b.th }, 'r') : '';
  const mouth = s.mouth ? mouthSvg(c, s.mouth, ol) : '';
  const ck = s.cheeks;
  const cheeks = ck ? ck.pts.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="${ck.rx}" ry="${ck.ry}" fill="${ck.col}" opacity="${ck.op}"/>`).join('') : '';
  const fx = fxSvg(c, s);
  const neck = s.neck || [100, 136];
  const pv = s.pivots || {};
  let hand = '';
  if (s.kind === 'bust' && s.hand) {
    const { col, skin } = s.hand;
    hand = `<g class="ch-hand"><g class="ch-handi" style="transform-origin:152px 214px">` + c.limb('M 152 216 L 152 176', col, 20) +
      c.P('M 141 172 C 139 156 145 147 152 147 C 160 147 165 155 163 170 C 161 179 145 181 141 172 Z', skin) +
      c.P('M 141 166 C 134 162 133 156 138 155 C 142 155 144 160 145 163 Z', skin, { w: 2.4 }) + `</g></g>`;
  }
  const arms = (s.armL ? `<g class="ch-arm ch-al"${org(pv.al)}><g class="ch-armi"${org(pv.al)}>${s.armL}</g></g>` : '') +
    (s.armR ? `<g class="ch-arm ch-ar"${org(pv.ar)}><g class="ch-armi"${org(pv.ar)}>${s.armR}</g></g>` : '');
  const inner = `${s.shadow ? `<ellipse class="ch-shadow" cx="${s.shadow[0]}" cy="${s.shadow[1]}" rx="${s.shadow[2]}" ry="${r1(s.shadow[2] * 0.14)}" fill="rgba(30,14,48,.22)"/>` : ''}` +
    `<g class="ch-anim"><g class="ch-pose">` +
    `<g class="ch-back">${s.back || ''}</g>` +
    `<g class="ch-body">${s.body || ''}${arms}</g>` +
    `<g class="ch-head"${org(neck)}><g class="ch-headi"${org(neck)}>${s.headBase || ''}<g class="ch-cheeks">${cheeks}</g><g class="ch-eyes">${eyes}</g>${brows}<g class="ch-mouth">${mouth}</g>${s.headFront || ''}${fx.head}</g></g>` +
    `${s.front || ''}${hand}${fx.top}` +
    `</g></g>`;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><title>${name}</title><defs>${c.defs.join('')}</defs>${inner}</svg>`;
}

// ---------------------------------------------------------------- пози настроїв
const BASE = { eyes: 'open', by: 0, bra: 0, al: 0, ar: 0, hr: 0, hy: 0, px: 0, py: 0, mx: 0, my: 0, mr: 0, hand: 95 };
const MOOD = {
  idle: {},
  talk: { ar: 6 },
  happy: { eyes: 'happy', by: -3, bra: -5, al: 110, ar: 110, hand: 0, hy: -1, mouth: 'grin' },
  sad: { py: 2.5, by: 2, bra: -16, al: -8, ar: -8, hr: 4, hy: 4, my: 3, mouth: 'sad' },
  surprised: { eyes: 'wide', by: -7, bra: -4, al: 60, ar: 60, hy: -3, mouth: 'o' },
  angry: { by: 2.5, bra: 20, al: 28, ar: 28, mouth: 'angry' },
  hurt: { eyes: 'hurt', by: 1, bra: 16, al: 75, ar: 75, hr: -7, mr: -5, mouth: 'o' },
  win: { eyes: 'happy', by: -4, bra: -6, al: 150, ar: 150, hand: 0, mouth: 'grin' },
  lose: { eyes: 'closed', by: 3, bra: -18, al: -10, ar: -10, hr: 9, hy: 6, mr: 4, my: 4, mouth: 'wobble' },
};
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
let seq = 0;

export function createCharacter(container, id, { size = 200, mood = 'idle', flip = false } = {}) {
  ensureStyle();
  const key = String(id || 'guest');
  const draw = DRAW[key] || generated(key);
  const info = CHARACTERS[key] || { name: key, role: 'guest' };
  const c = new Ctx(`chr${++seq}_`);
  const spec = draw(c);
  const el = document.createElement('div');
  el.className = `chr chr-${spec.kind}${flip ? ' chr-flip' : ''}`;
  el.dataset.char = key;
  if (size != null) {
    const v = typeof size === 'number' ? size + 'px' : String(size);
    el.style.width = v; el.style.height = v;
  }
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', info.name);
  el.innerHTML = `<div class="ch-react">${buildSvg(c, spec, String(info.name).replace(/[<&>"]/g, ''))}</div>`;
  const react = el.firstElementChild;
  if (container) container.append(el);

  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  let cur = 'idle', talking = false, talkT = null, flapT = null, lastM = '', dead = false;
  const poses = spec.poses || {};

  const defaultMouth = () => (MOOD[cur]?.mouth) || spec.idleMouth || 'smile';
  const setMouth = (m) => { el.dataset.mouth = m; };

  function apply(m) {
    const p = { ...BASE, ...(poses.base || {}), ...MOOD[m], ...(poses[m] || {}) };
    if (m === 'idle' || m === 'talk') p.bra += spec.browBase || 0;
    el.dataset.mood = m;
    el.dataset.eyes = p.eyes;
    for (const k of ['by', 'bra', 'al', 'ar', 'hr', 'hy', 'px', 'py', 'mx', 'my', 'mr', 'hand']) el.style.setProperty('--' + k, p[k]);
    if (!talking) setMouth(defaultMouth());
  }

  function flap() {
    if (!talking || dead) return;
    const opts = ['a', 'o', 'e', 'closed', 'a', 'e', 'o', 'a'];
    let m;
    do m = opts[Math.floor(Math.random() * opts.length)]; while (m === lastM);
    lastM = m;
    const closed = ['smile', 'smirk', 'flat', 'sad'].includes(defaultMouth()) ? defaultMouth() : 'smile';
    setMouth(m === 'closed' ? closed : m);
    flapT = later(flap, 80 + Math.random() * 45); // ≈ 8–12 разів/с
  }
  function stopTalk() {
    talking = false;
    if (flapT) { clearTimeout(flapT); timers.delete(flapT); flapT = null; }
    if (talkT) { clearTimeout(talkT); timers.delete(talkT); talkT = null; }
    el.dataset.talk = '0';
    setMouth(defaultMouth());
  }

  // кліпання і мікрорухи очей
  function blinkLoop() {
    later(() => {
      if (dead) return;
      if (!reduced() && (el.dataset.eyes === 'open' || el.dataset.eyes === 'wide')) {
        el.classList.add('ch-blink');
        later(() => el.classList.remove('ch-blink'), 120);
        if (Math.random() < 0.2) later(() => { el.classList.add('ch-blink'); later(() => el.classList.remove('ch-blink'), 110); }, 260);
      }
      if ((cur === 'idle' || cur === 'talk') && !reduced() && Math.random() < 0.5) {
        el.style.setProperty('--px', [-1.6, 0, 0, 1.6][Math.floor(Math.random() * 4)]);
      }
      blinkLoop();
    }, 1800 + Math.random() * 3600);
  }

  const api = {
    el, id: key,
    get mood() { return cur; },
    set(m) {
      if (dead) return api;
      if (!MOOD[m]) m = 'idle';
      const was = cur;
      cur = m;
      if (m === 'talk') { apply(m); api.talk(true); return api; }
      if (was === 'talk' && talking && !talkT) stopTalk();
      apply(m);
      if (talking) el.dataset.talk = '1';
      return api;
    },
    talk(x) {
      if (dead) return api;
      if (x === false || x === 0 || x === '' || x == null) { stopTalk(); return api; }
      if (talkT) { clearTimeout(talkT); timers.delete(talkT); talkT = null; }
      const ms = x === true ? 0 : typeof x === 'number' ? x : Math.min(9000, Math.max(500, String(x).length * 42));
      if (reduced()) { setMouth('e'); if (ms) talkT = later(() => { talkT = null; stopTalk(); }, ms); talking = true; return api; }
      el.dataset.talk = '1';
      if (!talking) { talking = true; flap(); }
      if (ms) talkT = later(() => { talkT = null; stopTalk(); }, ms);
      return api;
    },
    react(kind) {
      if (dead || !react.animate || reduced()) return api;
      const sgn = flip ? -1 : 1;
      const K = {
        hit: [[{ transform: 'none', filter: 'none' }, { transform: `translate(${14 * sgn}px,-8px) rotate(${8 * sgn}deg) scale(.96)`, filter: 'brightness(2.6) saturate(.2)', offset: 0.18 },
          { transform: `translate(${-5 * sgn}px,0) rotate(${-3 * sgn}deg)`, filter: 'brightness(1.2)', offset: 0.55 }, { transform: 'none', filter: 'none' }], 560],
        jump: [[{ transform: 'none' }, { transform: 'translateY(-18%) scale(.96,1.05)', offset: 0.4 }, { transform: 'translateY(0) scale(1.06,.94)', offset: 0.75 }, { transform: 'none' }], 520],
        shake: [[{ transform: 'none' }, { transform: 'translateX(-6%)' }, { transform: 'translateX(5%)' }, { transform: 'translateX(-4%)' }, { transform: 'translateX(3%)' }, { transform: 'none' }], 480],
        nod: [[{ transform: 'none' }, { transform: 'translateY(4%) rotate(2deg)' }, { transform: 'none' }, { transform: 'translateY(3%) rotate(-1deg)' }, { transform: 'none' }], 520],
        cheer: [[{ transform: 'none', filter: 'none' }, { transform: 'translateY(-14%) scale(1.06)', filter: 'brightness(1.25)', offset: 0.4 }, { transform: 'none', filter: 'none' }], 600],
      };
      const k = K[kind] || K.jump;
      try { react.animate(k[0], { duration: k[1], easing: 'cubic-bezier(.3,.7,.4,1)' }); } catch (e) { /* */ }
      return api;
    },
    destroy() {
      dead = true;
      talking = false;
      timers.forEach(clearTimeout);
      timers.clear();
      el.remove();
    },
  };
  api.set(MOOD[mood] ? mood : 'idle');
  blinkLoop();
  return api;
}

export const CHARACTER_MOODS = MOODS;
export default createCharacter;
