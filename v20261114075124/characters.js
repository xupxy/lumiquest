// LumiQuest — анімовані SVG-персонажі (боси, Лис Фокс, герої історій, актори драм).
//
//   import { createCharacter, CHARACTERS, characterIdFor } from './characters.js?v=20261114075109';
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
  const eh = `<path class="ch-eh" d="M${x - rx} ${r1(y + ry * 0.2)}Q${x} ${r1(y - ry * 1.05)} ${x + rx} ${r1(y + ry * 0.2)}" fill="none" stroke="#3a2433" stroke-width="4.4" stroke-linecap="round"/>`;
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
// v11: дзеркало контуру по осі x=100 (лише абсолютні команди з парами «x y»)
const flipX = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${r1(200 - x)} ${y}`);
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
  const back = p.back || '';          // реквізит за спиною (рухається з тілом)
  const backHead = hair.back;         // волосся позаду голови — рухається РАЗОМ з головою
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
    back, backHead, body,
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
  boss_w0: { name: 'Соня-Равлик Лулу', role: 'boss', world: 'w0' }, // v20 · світ «з нуля»
  boss_w1: { name: 'Бурчун-Гриб', role: 'boss', world: 'w1' },
  boss_w2: { name: 'Дід Мохобород', role: 'boss', world: 'w2' },
  boss_w3: { name: 'Пан Тік-Так', role: 'boss', world: 'w3' },
  boss_w4: { name: 'Єті Обіймайло', role: 'boss', world: 'w4' },
  boss_w5: { name: 'Пані Тсс-Тсс', role: 'boss', world: 'w5' },
  boss_w1b: { name: 'Краб Клац-Клац', role: 'boss', world: 'w1b' },
  boss_w1c: { name: 'Королева Дзижчання', role: 'boss', world: 'w1c' },
  boss_w2b: { name: 'Пані Завірюха', role: 'boss', world: 'w2b' },
  boss_w3b: { name: 'Капітан Туман', role: 'boss', world: 'w3b' },
  boss_w4b: { name: 'Сфінкс Туманів', role: 'boss', world: 'w4b' },
  // v19 · Дизайн А — країни c1–c5: бос-легенда + гід (id гіда = ім'я в нижньому регістрі; Léa -> 'lea')
  boss_c1: { name: 'Дух Туманної Темзи', role: 'boss', world: 'c1' },
  boss_c2: { name: 'Велетенський Бізон Прерій', role: 'boss', world: 'c2' },
  boss_c3: { name: "Лис-Кіцуне Дев'яти Ліхтарів", role: 'boss', world: 'c3' },
  boss_c4: { name: 'Горгулья Нотр-Дамського даху', role: 'boss', world: 'c4' },
  boss_c5: { name: 'Гондольєр-Привид Венеції', role: 'boss', world: 'c5' },
  olivia: { name: 'Olivia', role: 'guide', world: 'c1' },
  jake: { name: 'Jake', role: 'guide', world: 'c2' },
  yuki: { name: 'Yuki', role: 'guide', world: 'c3' },
  lea: { name: 'Léa', role: 'guide', world: 'c4' },
  marco: { name: 'Marco', role: 'guide', world: 'c5' },
  fox: { name: 'Лис Фокс', role: 'durak' },
  mia: { name: 'Mia', role: 'story', world: 'w1' },
  noah: { name: 'Noah', role: 'story', world: 'w2' },
  leo: { name: 'Leo', role: 'story', world: 'w3' },
  ava: { name: 'Ava', role: 'story', world: 'w4' },
  eli: { name: 'Eli', role: 'story', world: 'w5' },
  kai: { name: 'Kai', role: 'story', world: 'w1b' },
  mila: { name: 'Mila', role: 'story', world: 'w1c' },
  tim: { name: 'Tim', role: 'story', world: 'w0' }, // v20 · cast w0: першокласник у жовтій кепці з рюкзаком
  nora: { name: 'Nora', role: 'story', world: 'w2b' },
  finn: { name: 'Finn', role: 'story', world: 'w3b' },
  iris: { name: 'Iris', role: 'story', world: 'w4b' },
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
  boss_w0(c) { // v20 · Соня-Равлик Лулу — дуже добрий сонний равлик у нічному ковпаку з подушечкою; вчить терпінню
    const skin = '#bfe6c4', skinL = '#d8f2da', shell = '#c9a8f0', stripe = '#ffb8cf', capC = '#8fa8ff', so = dk(skin, 0.62);
    // мушля-спіраль за спиною (виглядає з обох боків), слід-«доріжка» блискіток
    let body = c.L('M 12 198 Q 30 194 46 197', '#e8f6ff', 3, 0.8) + c.C(18, 194, 1.8, '#ffffff', { w: 0, flat: true }) +
      c.C(116, 140, 52, shell, { g: { l: 0.35, d: 0.32 } });
    body += c.L('M 128 138 C 128 128 142 128 142 140 C 142 156 118 158 114 140 C 110 118 144 110 154 136 C 162 160 138 182 112 176 C 86 170 76 140 90 116', dk(shell, 0.45), 4.5) +
      c.L('M 128 138 C 128 128 142 128 142 140 C 142 156 118 158 114 140 C 110 118 144 110 154 136 C 162 160 138 182 112 176 C 86 170 76 140 90 116', stripe, 2.4, 0.9) +
      c.hl(96, 108, 16, 7, -30, 0.45) + c.C(150, 112, 3, '#ffffff', { w: 0, flat: true, op: 0.8 });
    // м'яка «ніжка» вздовж землі і тулуб-шийка
    body += c.P('M 22 196 C 20 182 40 176 70 176 L 140 178 C 168 180 182 188 180 198 Q 100 206 22 196 Z', skin, { g: { l: 0.3, d: 0.22 } }) +
      c.P('M 70 196 C 66 168 74 140 100 134 C 126 140 134 168 130 196 Z', skin, { g: { l: 0.35, d: 0.2 } }) +
      c.F('M 84 190 C 82 170 88 152 100 148 C 112 152 118 170 116 190 Z', skinL, 0.7) + c.hl(80, 164, 4, 14, -6, 0.4);
    // голова, вусики з кульками, нічний ковпак із помпоном
    let headBase = c.limb('M 84 60 Q 76 40 70 26', skin, 4.5) + c.limb(flipX('M 84 60 Q 76 40 70 26'), skin, 4.5) +
      c.C(69, 23, 6.5, skinL, { w: 2.4, s: so }) + c.C(131, 23, 6.5, skinL, { w: 2.4, s: so });
    headBase += c.P('M 56 98 C 54 68 74 50 100 50 C 126 50 146 68 144 98 C 144 124 124 138 100 138 C 76 138 56 124 56 98 Z', skin, { g: { l: 0.4, d: 0.2 } }) +
      c.L('M 138 80 C 144 92 144 108 136 122', lt(skin, 0.6), 2.4, 0.6);
    const headFront = c.P('M 58 76 C 60 50 80 40 102 40 C 126 42 140 54 156 44 C 160 56 152 68 142 76 C 120 66 82 66 58 76 Z', capC, { g: { l: 0.4, d: 0.25 } }) +
      c.L('M 72 58 Q 100 50 128 56 M 66 68 Q 100 60 138 66', '#ffffff', 2.6, 0.55) +
      c.P('M 56 78 C 80 66 120 66 144 78 L 142 84 C 120 74 80 74 58 84 Z', '#ffffff', { w: 2.2, s: dk(capC, 0.5) }) +
      c.C(158, 42, 9, '#ffffff', { w: 2.4, s: dk(capC, 0.5), g: { l: 0.6, d: 0.12 } });
    const armL = 'M 76 154 Q 62 160 58 172';
    const pillow = c.P('M 146 160 C 160 154 178 156 186 162 C 190 172 188 184 184 190 C 170 194 154 194 146 188 C 142 180 142 168 146 160 Z', '#fff4fa', { w: 2.4, s: '#b9a8d8' }) +
      c.L('M 150 166 C 160 162 174 162 182 166 M 150 186 C 160 190 174 190 182 186', '#d8c8f2', 1.6, 0.9) + c.C(166, 176, 2.4, '#ffb8cf', { w: 0, flat: true });
    return {
      kind: 'full', ol: so, shadow: [100, 198, 82],
      body, headBase, headFront,
      armL: c.limb(armL, skin, 9) + c.C(57, 175, 7, skinL, { w: 2.2, s: so }),
      armR: pillow + c.limb(flipX(armL), skin, 9) + c.C(143, 175, 7, skinL, { w: 2.2, s: so }),
      pivots: { al: [76, 154], ar: [124, 154] },
      neck: [100, 138],
      eyes: [{ x: 84, y: 98, rx: 10, ry: 11.5, iris: '#6a58b8', side: 'l', lash: true, lid: skin, lidAmt: 0.5 }, { x: 116, y: 98, rx: 10, ry: 11.5, iris: '#6a58b8', side: 'r', lash: true, lid: skin, lidAmt: 0.5 }],
      brows: { y: 82, w: 16, col: dk(skin, 0.5), th: 3.2, lx: 84, rx: 116 },
      mouth: { x: 100, y: 121, w: 13 },
      cheeks: { pts: [[70, 112], [130, 112]], rx: 8, ry: 4.5, col: '#ff9ab5', op: 0.55 },
      fx: { tear: [78, 108], anger: [142, 66], sweat: [146, 86], top: [100, 18], stars: [100, 8] },
      idleMouth: 'smile', browBase: -2,
      poses: { happy: { al: 36, ar: 14 }, win: { al: 70, ar: 20 }, surprised: { al: 26, ar: 10 }, sad: { al: -6, ar: -4 }, hurt: { al: 12, ar: 6 }, angry: { al: 14, ar: 6 }, talk: { al: 12, ar: 6 } },
    };
  },

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

  // ============================================================ v11: БОСИ ПРОМІЖНИХ СВІТІВ
  boss_w1b(c) { // Краб Клац-Клац — буркотливий, але добрий краб-рятувальник
    const shell = '#f0603a', belly = '#ffd9b0', so = dk(shell, 0.55), buoy = '#fffdf4';
    let body = '';
    for (const d of ['M 62 150 Q 40 160 30 182', 'M 70 158 Q 54 172 50 190', 'M 82 162 Q 74 178 74 192']) body += c.limb(d, shell, 8) + c.limb(flipX(d), shell, 8);
    body += c.E(100, 158, 40, 16, belly, { g: { l: 0.4, d: 0.2 } }) + c.L('M 76 160 Q 100 168 124 160 M 82 167 Q 100 173 118 167', dk(belly, 0.3), 1.8, 0.7);
    const stalkL = 'M 84 76 Q 80 60 80 48';
    let headBase = c.limb(stalkL, shell, 7) + c.limb(flipX(stalkL), shell, 7) +
      c.P('M 28 118 C 28 84 60 64 100 64 C 140 64 172 84 172 118 C 172 146 142 162 100 162 C 58 162 28 146 28 118 Z', shell, { g: { l: 0.34, d: 0.34 } }) +
      c.hl(66, 84, 22, 7, -22, 0.4) + c.L('M 160 96 C 168 110 166 130 154 144', lt(shell, 0.5), 2.8, 0.6);
    for (const [x, y, r] of [[48, 112, 4], [58, 100, 2.6], [150, 126, 3.4], [142, 138, 2.2], [100, 74, 3]]) headBase += `<circle cx="${x}" cy="${y}" r="${r}" fill="${lt(shell, 0.35)}" opacity=".75"/>`;
    // рятувальний круг-значок і свисток на шнурку
    headBase += c.C(142, 98, 10, buoy, { w: 2.2, s: so }) + c.C(142, 98, 4, shell, { w: 1.6, flat: true, s: so }) +
      c.L('M 142 88 V 92 M 142 104 V 108 M 132 98 H 136 M 148 98 H 152', '#e8484f', 3);
    const clawL = 'M 6 88 C 0 62 18 46 36 54 C 28 60 26 68 30 76 C 38 68 46 72 46 82 C 44 100 14 108 6 88 Z';
    const armL = 'M 40 122 Q 22 118 24 98';
    return {
      kind: 'full', ol: so, shadow: [100, 192, 62],
      body, headBase,
      armL: c.limb(armL, shell, 11) + c.P(clawL, shell, { g: { l: 0.4, d: 0.3 } }) + c.L('M 14 70 Q 18 60 26 58', lt(shell, 0.6), 2.4, 0.7),
      armR: c.limb(flipX(armL), shell, 11) + c.P(flipX(clawL), shell, { g: { l: 0.4, d: 0.3 } }) + c.L('M 186 70 Q 182 60 174 58', lt(shell, 0.6), 2.4, 0.7),
      pivots: { al: [40, 122], ar: [160, 122] },
      neck: [100, 156],
      eyes: [{ x: 80, y: 40, rx: 11, ry: 12, iris: '#2a6f8a', side: 'l', lid: shell, lidAmt: 0.34 }, { x: 120, y: 40, rx: 11, ry: 12, iris: '#2a6f8a', side: 'r', lid: shell, lidAmt: 0.34 }],
      brows: { y: 23, w: 22, col: '#8a2a1a', th: 6.5, lx: 79, rx: 121 },
      mouth: { x: 100, y: 124, w: 20 },
      headFront: c.L('M 70 142 Q 100 156 130 142', '#fff6d8', 2) + c.P('M 94 146 L 110 146 L 110 156 L 98 156 Z', '#ffd45e', { w: 2 }) + c.C(100, 151, 1.8, '#8a5a1a', { w: 0, flat: true }),
      cheeks: { pts: [[62, 124], [138, 124]], rx: 8, ry: 4.4, col: '#ffb38a', op: 0.55 },
      fx: { tear: [72, 52], anger: [154, 60], sweat: [156, 86], top: [100, 14], stars: [100, 4] },
      idleMouth: 'flat', browBase: 12,
      poses: { happy: { al: 40, ar: 40 }, win: { al: 70, ar: 70 }, angry: { al: 34, ar: 34 }, surprised: { al: 50, ar: 50 }, talk: { ar: 20 } },
    };
  },

  // v18 · Медові Соти
  boss_w1c(c) { // Королева Дзижчання — пихата, але смішна бджолина королева з короною-сотою і медовим скіпетром
    const gold = '#ffc21a', goldL = '#ffd84a', choc = '#4a2c14', wing = '#eaf8ff', honey = '#f2a818', ruff = '#fffbea', so = dk(gold, 0.62);
    const hex = (x, y, r) => Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 180) * (60 * i - 90); return `${r1(x + r * Math.cos(a))},${r1(y + r * Math.sin(a))}`; }).join(' ');
    let body = '';
    // крила за спиною — прозорі, з жилками
    for (const sx of [1, -1]) {
      const T = (x) => (sx === 1 ? x : 200 - x), rot = (a) => a * sx;
      body += c.E(T(52), 108, 32, 19, wing, { op: 0.78, g: { l: 0.6, d: 0.1 }, s: '#9cc8ee', a: `transform="rotate(${rot(-32)} ${T(52)} 108)"` }) +
        c.E(T(60), 140, 22, 13, wing, { op: 0.7, g: { l: 0.6, d: 0.1 }, s: '#9cc8ee', a: `transform="rotate(${rot(18)} ${T(60)} 140)"` });
      body += c.L(sx === 1 ? 'M 78 120 C 64 112 46 104 30 96' : flipX('M 78 120 C 64 112 46 104 30 96'), '#9cc8ee', 1.6, 0.8);
    }
    // черевце у смужку, жало-«бантик», королівська мантія-брижі
    body += c.E(100, 164, 44, 31, gold, { g: { l: 0.35, d: 0.3 } }) +
      c.L('M 62 150 Q 100 160 138 150', choc, 8) + c.L('M 58 170 Q 100 182 142 170', choc, 8) + c.L('M 70 188 Q 100 196 130 188', choc, 6) +
      c.P('M 94 192 L 100 204 L 106 192 Z', choc, { w: 1.8 }) + c.hl(78, 158, 12, 5, -10, 0.35);
    let ruffD = 'M 64 132';
    for (let i = 0; i <= 8; i++) { const x = 64 + i * 9; ruffD += ` Q ${x + 4.5} ${i % 2 ? 150 : 146} ${x + 9} 132`; }
    body += c.P(ruffD + ' Z', ruff, { w: 2.2, s: dk(ruff, 0.45) });
    // голова-пухнастик, вусики, корона-сота
    let headBase = c.limb('M 86 64 Q 80 46 70 36', choc, 4) + c.limb(flipX('M 86 64 Q 80 46 70 36'), choc, 4) +
      c.C(69, 34, 6, honey, { w: 2 }) + c.C(131, 34, 6, honey, { w: 2 });
    headBase += c.P('M 58 100 C 54 70 74 54 100 54 C 126 54 146 70 142 100 C 140 124 122 138 100 138 C 78 138 60 124 58 100 Z', goldL, { g: { l: 0.4, d: 0.22 } }) +
      c.L('M 136 80 C 142 92 142 108 134 122', lt(goldL, 0.5), 2.4, 0.6) + c.hl(80, 70, 14, 5, -25, 0.45);
    headBase += [[86, 56], [100, 47], [114, 56]].map(([x, y]) => `<polygon points="${hex(x, y, 10)}" fill="${honey}" stroke="${choc}" stroke-width="2.4" stroke-linejoin="round"/>`).join('') +
      `<polygon points="${hex(100, 47, 4.5)}" fill="#ffe7a3"/>` + c.C(86, 56, 2.6, '#e8484f', { w: 1.2 }) + c.C(114, 56, 2.6, '#6baf3a', { w: 1.2 }) +
      c.L('M 104 34 Q 106 30 103 27', '#ffe7a3', 2, 0.9);
    const armL = 'M 66 150 Q 50 160 46 176';
    const scepter = c.L('M 158 178 L 170 140', '#9a6b3e', 4) + c.E(171, 134, 8, 10, honey, { g: { l: 0.45, d: 0.25 } }) +
      c.L('M 164 130 H 178 M 163 137 H 179', '#c98a1a', 2) + c.P('M 170 144 C 168 150 170 154 172 154 C 174 152 173 148 170 144 Z', honey, { w: 1.4 });
    return {
      kind: 'full', ol: so, shadow: [100, 200, 60],
      body, headBase,
      armL: c.limb(armL, choc, 8) + c.C(45, 179, 7, goldL, { w: 2 }),
      armR: c.limb(flipX(armL), choc, 8) + scepter + c.C(155, 179, 7, goldL, { w: 2 }),
      pivots: { al: [66, 150], ar: [134, 150] },
      neck: [100, 136],
      eyes: [{ x: 84, y: 94, rx: 10, ry: 11, iris: '#5a3410', side: 'l', lash: true, lid: goldL, lidAmt: 0.42 }, { x: 116, y: 94, rx: 10, ry: 11, iris: '#5a3410', side: 'r', lash: true, lid: goldL, lidAmt: 0.42 }],
      brows: { y: 78, w: 18, col: choc, th: 4.4, lx: 84, rx: 116 },
      mouth: { x: 100, y: 118, w: 14 },
      cheeks: { pts: [[70, 110], [130, 110]], rx: 7, ry: 4, col: '#ff9a6a', op: 0.5 },
      fx: { tear: [78, 104], anger: [140, 64], sweat: [146, 86], top: [100, 20], stars: [100, 10] },
      idleMouth: 'smirk', browBase: 3,
      poses: { happy: { al: 40, ar: 30 }, win: { al: 80, ar: 60 }, surprised: { al: 30, ar: 24 }, sad: { al: -6, ar: -6 }, hurt: { al: 14, ar: 10 }, angry: { al: 20, ar: -30 }, talk: { al: 10, ar: 22 } },
    };
  },

  boss_w2b(c) { // Пані Завірюха — розсіяна вітряна фея-мірошничка
    const skin = '#ffe9d6', dress = '#8fc4f2', hair = '#f1f7ff', gold = '#f2b93b', apron = '#fff8e6', so = dk(dress, 0.6);
    const wingL = 'M 72 132 C 34 96 10 116 20 146 C 28 166 58 160 74 146 Z';
    const back = c.P(wingL, '#dff1ff', { op: 0.8, g: { l: 0.6, d: 0.1 } }) + c.P(flipX(wingL), '#dff1ff', { op: 0.8, g: { l: 0.6, d: 0.1 } }) +
      c.L('M 64 136 C 44 124 30 130 28 142 M 136 136 C 156 124 170 130 172 142', '#9cc8ee', 1.8, 0.8);
    // сукня-вихор, що звужується донизу (летить), фартух мірошнички з колоском
    let body = c.L('M 92 196 Q 84 202 96 204 M 110 192 Q 122 200 108 204', '#cfe6fb', 3, 0.9) +
      c.P('M 62 122 C 56 150 74 176 100 196 C 126 176 144 150 138 122 C 120 114 80 114 62 122 Z', dress, { g: { l: 0.35, d: 0.3 } }) +
      c.L('M 66 140 Q 100 152 136 136 M 74 158 Q 100 170 128 154 M 86 176 Q 100 184 116 172', '#eaf5ff', 2.6, 0.85) +
      c.P('M 80 128 L 120 128 L 114 168 Q 100 176 86 168 Z', apron, { w: 2.4, s: dk(apron, 0.5) }) +
      c.L('M 100 162 V 140', gold, 2.2) + c.E(100, 137, 3, 5.5, gold, { w: 1.2 }) + c.E(95, 144, 2.6, 4.6, gold, { w: 1.2, a: 'transform="rotate(-30 95 144)"' }) + c.E(105, 144, 2.6, 4.6, gold, { w: 1.2, a: 'transform="rotate(30 105 144)"' }) +
      c.P('M 78 120 Q 100 132 122 120 L 124 128 Q 100 140 76 128 Z', gold, { w: 2.2 });
    // розвіяне вітром волосся-хмара (вбік), вітрячок у зачісці, борошно на щоці
    let headBase = c.blob([[70, 56, 20], [98, 40, 24], [128, 50, 21], [150, 66, 16], [166, 56, 12], [178, 46, 8], [56, 82, 14], [148, 90, 12]], hair, { s: '#7fa6d6' }) +
      c.P('M 66 84 C 66 58 82 46 100 46 C 118 46 134 58 134 84 C 134 106 120 118 100 118 C 80 118 66 106 66 84 Z', skin, { g: { l: 0.35, d: 0.16 } }) +
      c.P('M 64 80 C 64 54 84 40 104 40 C 124 40 138 56 136 78 C 124 62 108 56 92 60 C 80 62 70 70 64 80 Z', hair, { s: '#7fa6d6', g: { l: 0.5, d: 0.12 } }) +
      c.E(121, 99, 6, 3, '#ffffff', { w: 0, flat: true, op: 0.8 });
    let pin = '';
    for (const a of [0, 90, 180, 270]) pin += `<g transform="rotate(${a + 15} 138 42)">${c.P('M 138 42 L 138 26 L 148 36 Z', a % 180 ? gold : '#e0563f', { w: 1.6 })}</g>`;
    const armL = 'M 68 130 Q 52 142 48 158';
    return {
      kind: 'full', ol: dk(skin, 0.6), shadow: [100, 198, 38],
      back, body, headBase,
      armL: c.limb(armL, dress, 10) + c.C(48, 162, 6.5, skin),
      armR: c.limb(flipX(armL), dress, 10) + c.C(152, 162, 6.5, skin),
      pivots: { al: [68, 130], ar: [132, 130] },
      neck: [100, 118],
      eyes: [{ x: 87, y: 84, rx: 8.5, ry: 10.5, iris: '#5aa0e0', side: 'l', lash: true }, { x: 113, y: 84, rx: 8.5, ry: 10.5, iris: '#5aa0e0', side: 'r', lash: true }],
      brows: { y: 67, w: 15, col: '#8fb2dc', th: 3.2, lx: 87, rx: 113 },
      mouth: { x: 100, y: 104, w: 13 },
      headFront: pin + c.C(138, 42, 2.6, '#7a5230', { w: 1, flat: true }),
      cheeks: { pts: [[78, 98], [122, 98]], rx: 6.5, ry: 3.6, col: '#ff9db5', op: 0.45 },
      fx: { tear: [82, 92], anger: [146, 60], sweat: [60, 66], top: [100, 20], stars: [100, 8] },
      idleMouth: 'o', browBase: -6,
      poses: { happy: { al: 60, ar: 60 }, win: { al: 120, ar: 120 }, surprised: { al: 50, ar: 50 }, talk: { ar: 30 }, angry: { al: 20, ar: 20 } },
    };
  },

  boss_w3b(c) { // Капітан Туман — старий восьминіг-доглядач маяка
    const col = '#6f86c8', lightc = '#c9d6f5', navy = '#1c2a56', capw = '#f6f1e4', gold = '#e8b84a', wht = '#f2f5ff', so = dk(col, 0.6);
    let body = '';
    for (const d of ['M 78 148 Q 60 174 36 178 Q 24 178 26 168', 'M 90 154 Q 82 182 62 190 Q 50 192 50 182']) {
      body += c.limb(d, col, 12) + c.limb(flipX(d), col, 12);
    }
    for (const [x, y] of [[46, 174], [58, 168], [68, 184], [78, 176]]) body += `<circle cx="${x}" cy="${y}" r="2.2" fill="${lightc}" opacity=".85"/><circle cx="${200 - x}" cy="${y}" r="2.2" fill="${lightc}" opacity=".85"/>`;
    body += c.E(100, 152, 30, 17, col, { g: { l: 0.3, d: 0.3 } });
    let headBase = c.P('M 52 110 C 46 62 70 34 100 34 C 130 34 154 62 148 110 C 148 136 128 150 100 150 C 72 150 52 136 52 110 Z', col, { g: { l: 0.36, d: 0.3 } }) +
      c.L('M 142 80 C 148 96 148 116 140 130', lt(col, 0.5), 2.8, 0.55);
    for (const [x, y, r] of [[64, 122, 3], [70, 132, 2], [136, 124, 3], [130, 134, 2]]) headBase += `<circle cx="${x}" cy="${y}" r="${r}" fill="${lt(col, 0.35)}" opacity=".7"/>`;
    // капітанський кашкет із якорем
    headBase += c.P('M 56 58 C 50 30 78 16 100 16 C 122 16 150 30 144 58 C 122 46 78 46 56 58 Z', capw, { g: { l: 0.5, d: 0.14 }, s: navy }) +
      c.P('M 58 56 C 80 44 120 44 142 56 L 141 68 C 120 57 80 57 59 68 Z', navy, { g: { l: 0.25, d: 0.3 } }) +
      c.P('M 64 67 C 84 58 116 58 136 67 C 126 77 74 77 64 67 Z', '#101a38', { w: 2.4 }) + c.hl(90, 66, 12, 2, -4, 0.3) +
      c.C(100, 51, 6.5, gold, { w: 1.8 }) + c.L('M 100 47 V 55 M 96.500 52.500 Q 100 56.500 103.500 52.500 M 98 49 H 102', navy, 1.3);
    const mustL = 'M 100 116 C 90 108 74 110 64 124 C 78 130 92 128 100 122 Z';
    const armL = 'M 60 130 Q 40 138 32 156 Q 30 168 40 166';
    const armR = 'M 140 130 Q 158 136 164 150';
    const lantern = c.L('M 164 150 V 158', navy, 2.6) + `<circle cx="165" cy="174" r="17" fill="#ffd27a" opacity=".3"/>` +
      c.P('M 156 164 L 174 164 L 172 186 L 158 186 Z', '#ffd27a', { g: { l: 0.6, d: 0.2 }, s: navy, w: 2.6 }) + c.P('M 154 164 L 165 156 L 176 164 Z', navy, { w: 2.2 }) +
      c.L('M 165 164 V 186', navy, 1.6, 0.8) + c.L('M 156 187 H 174', navy, 3.4);
    return {
      kind: 'full', ol: so, shadow: [100, 194, 66],
      body, headBase,
      armL: c.limb(armL, col, 11),
      armR: c.limb(armR, col, 11) + lantern,
      pivots: { al: [60, 130], ar: [140, 130] },
      neck: [100, 150],
      eyes: [{ x: 84, y: 96, rx: 9, ry: 10, iris: '#d9912e', side: 'l', lid: col, lidAmt: 0.44 }, { x: 116, y: 96, rx: 9, ry: 10, iris: '#d9912e', side: 'r', lid: col, lidAmt: 0.44 }],
      brows: { y: 82, w: 21, col: wht, th: 7, lx: 83, rx: 117 },
      mouth: { x: 100, y: 130, w: 14 },
      headFront: c.P(mustL, wht, { w: 2.4, s: '#8f9cc8' }) + c.P(flipX(mustL), wht, { w: 2.4, s: '#8f9cc8' }),
      cheeks: { pts: [[70, 112], [130, 112]], rx: 6.5, ry: 3.6, col: '#f2a0b8', op: 0.4 },
      fx: { tear: [78, 104], anger: [152, 74], sweat: [150, 98], top: [100, 10], stars: [100, 0] },
      idleMouth: 'smile', browBase: -5,
      poses: { happy: { al: 70, ar: 20 }, win: { al: 110, ar: 40 }, surprised: { al: 50, ar: 20 }, hurt: { al: 40, ar: 20 }, talk: { al: 25, ar: 6 } },
    };
  },

  // ============================================================ ЛИС ФОКС
  // ============================================================ v19 · КРАЇНИ c1–c5 (Дизайн А)
  boss_c1(c) { // Дух Туманної Темзи — ввічливий туманний привид-джентльмен: котелок, монокль, вуса, парасолька
    const fog = '#c9d6e6', fogL = '#eef3fa', hat = '#2a2f45', red = '#c8323c', gold = '#e8b04a', so = dk(fog, 0.6);
    const back = c.blob([[40, 150, 18], [30, 176, 14], [164, 156, 16], [174, 182, 12], [60, 194, 12], [146, 196, 12]], fogL, { s: dk(fogL, 0.35) });
    let body = c.P('M 54 150 C 52 122 72 110 100 110 C 128 110 148 122 146 150 C 148 170 158 186 168 196 C 152 192 144 200 130 194 C 118 202 106 196 98 202 C 86 196 74 204 64 194 C 52 200 42 192 32 196 C 42 184 52 170 54 150 Z', fog, { g: { l: 0.5, d: 0.2 } }) +
      c.L('M 70 160 C 84 152 98 166 112 158 C 124 152 134 160 140 156', fogL, 4, 0.8) + c.L('M 66 180 C 80 174 92 186 108 178', fogL, 3.4, 0.7) +
      c.P('M 100 130 L 84 122 L 84 140 Z', red, { w: 2.2 }) + c.P('M 100 130 L 116 122 L 116 140 Z', red, { w: 2.2 }) + c.C(100, 130, 4, red, { w: 2 });
    const headBase = c.P('M 60 98 C 56 66 76 50 100 50 C 124 50 144 66 140 98 C 140 122 122 136 100 136 C 78 136 60 122 60 98 Z', fog, { g: { l: 0.5, d: 0.18 } }) +
      c.L('M 134 78 C 140 90 140 106 132 120', '#ffffff', 2.4, 0.6) + c.hl(80, 68, 14, 5, -25, 0.5) +
      c.P('M 100 109 C 92 104 80 104 74 112 C 70 116 64 114 64 110 C 66 118 74 122 82 118 C 90 114 96 112 100 112 C 104 112 110 114 118 118 C 126 122 134 118 136 110 C 136 114 130 116 126 112 C 120 104 108 104 100 109 Z', '#8a97ad', { w: 2, s: dk('#8a97ad', 0.5) });
    const headFront = `<g transform="rotate(-6 100 56)">` + c.E(100, 60, 44, 8, hat, { g: { l: 0.25, d: 0.3 } }) + c.P('M 70 60 C 68 30 132 30 130 60 Z', hat, { g: { l: 0.25, d: 0.3 } }) +
      c.L('M 71 52 Q 100 47 129 52', red, 4) + c.hl(86, 40, 8, 3, -20, 0.35) + `</g>` +
      `<circle cx="116" cy="94" r="13.5" fill="none" stroke="${gold}" stroke-width="2.6"/>` + c.L('M 129 98 C 136 112 132 124 124 132', gold, 1.4, 0.9);
    const umbrella = c.L('M 166 112 L 168 44', '#5a4a3a', 3.4) + c.P('M 134 54 C 138 24 194 24 198 54 Q 190 48 182 54 Q 174 48 166 54 Q 158 48 150 54 Q 142 48 134 54 Z', hat, { g: { l: 0.3, d: 0.3 } }) +
      c.L('M 166 30 L 166 24', hat, 3) + c.L('M 150 50 C 154 38 160 32 166 30 M 182 50 C 178 38 172 32 166 30', lt(hat, 0.3), 1.4, 0.7);
    return {
      kind: 'full', ol: so, shadow: [100, 200, 52],
      back, body, headBase, headFront,
      armL: c.limb('M 62 142 Q 44 152 40 170', fog, 11) + c.C(40, 173, 8, fogL, { w: 2 }),
      armR: c.limb('M 138 142 Q 158 134 164 114', fog, 11) + umbrella + c.C(165, 112, 8, fogL, { w: 2 }),
      pivots: { al: [62, 142], ar: [138, 142] },
      neck: [100, 134],
      eyes: [{ x: 84, y: 94, rx: 9, ry: 10.5, iris: '#4a6a9a', side: 'l', glow: true, lid: fog, lidAmt: 0.3 }, { x: 116, y: 94, rx: 9, ry: 10.5, iris: '#4a6a9a', side: 'r', glow: true, lid: fog, lidAmt: 0.3 }],
      brows: { y: 78, w: 16, col: '#7a879d', th: 3.6, lx: 84, rx: 116 },
      mouth: { x: 100, y: 124, w: 13 },
      cheeks: { pts: [[72, 110], [128, 110]], rx: 6, ry: 3.4, col: '#b9c8ff', op: 0.5 },
      fx: { tear: [78, 104], anger: [140, 64], sweat: [146, 84], top: [100, 18], stars: [100, 10] },
      idleMouth: 'smile', browBase: 2,
      poses: { happy: { al: 40, ar: 16 }, win: { al: 90, ar: 30 }, surprised: { al: 30, ar: 10 }, sad: { al: -6, ar: -8 }, hurt: { al: 20, ar: 6 }, angry: { al: 24, ar: -10 }, talk: { al: 14, ar: 6 } },
    };
  },

  boss_c2(c) { // Велетенський Бізон Прерій — добродушний велетень: кошлата грива, роги, ковбойський капелюх, хустка
    const fur = '#7a4a2a', mane = '#4a2c18', horn = '#f0e2c4', muz = '#a8784e', band = '#c8323c', hatC = '#c99a5a', so = dk(fur, 0.6);
    let body = c.P('M 16 204 C 14 160 40 126 100 122 C 160 126 186 160 184 204 Z', fur, { g: { l: 0.3, d: 0.3 } }) +
      c.blob([[44, 146, 20], [66, 132, 24], [100, 126, 26], [134, 132, 24], [156, 146, 20]], mane) +
      c.P('M 64 140 L 136 140 L 100 176 Z', band, { w: 2.4 }) + `<g fill="#fff" opacity=".85"><circle cx="86" cy="148" r="2"/><circle cx="100" cy="158" r="2"/><circle cx="114" cy="148" r="2"/><circle cx="100" cy="146" r="1.6"/></g>`;
    let headBase = c.P('M 60 78 C 42 76 30 64 30 44 C 40 58 50 62 64 64 Z', horn, { g: { l: 0.4, d: 0.25 } }) + c.P(flipX('M 60 78 C 42 76 30 64 30 44 C 40 58 50 62 64 64 Z'), horn, { g: { l: 0.4, d: 0.25 } }) +
      c.E(54, 92, 12, 7, fur, { a: 'transform="rotate(-24 54 92)"' }) + c.E(146, 92, 12, 7, fur, { a: 'transform="rotate(24 146 92)"' }) +
      c.P('M 56 96 C 52 64 74 50 100 50 C 126 50 148 64 144 96 C 144 124 126 140 100 140 C 74 140 56 124 56 96 Z', fur, { g: { l: 0.3, d: 0.25 } }) +
      c.blob([[86, 142, 10], [100, 148, 11], [114, 142, 10]], mane) +
      c.E(100, 122, 25, 16, muz, { g: { l: 0.3, d: 0.2 } }) + c.E(91, 116, 3.4, 2.4, '#3a2418', { w: 0, flat: true }) + c.E(109, 116, 3.4, 2.4, '#3a2418', { w: 0, flat: true }) +
      c.blob([[80, 62, 14], [100, 56, 16], [120, 62, 14]], mane);
    const headFront = c.E(100, 52, 40, 8, hatC, { g: { l: 0.35, d: 0.3 } }) + c.P('M 74 52 C 72 30 84 24 92 30 Q 100 24 108 30 C 116 24 128 30 126 52 Z', hatC, { g: { l: 0.35, d: 0.3 } }) +
      c.L('M 75 46 Q 100 42 125 46', '#7a5638', 4) + c.hl(88, 36, 6, 3, -20, 0.4);
    return {
      kind: 'full', ol: so, shadow: [100, 200, 70],
      body, headBase, headFront,
      armL: c.limb('M 48 160 Q 34 176 36 194', fur, 17) + c.E(36, 197, 11, 6.5, '#3a2418', { w: 2.2 }),
      armR: c.limb('M 152 160 Q 166 176 164 194', fur, 17) + c.E(164, 197, 11, 6.5, '#3a2418', { w: 2.2 }),
      pivots: { al: [48, 160], ar: [152, 160] },
      neck: [100, 138],
      eyes: [{ x: 82, y: 92, rx: 8, ry: 9.5, iris: '#3a2418', side: 'l', lid: fur, lidAmt: 0.36 }, { x: 118, y: 92, rx: 8, ry: 9.5, iris: '#3a2418', side: 'r', lid: fur, lidAmt: 0.36 }],
      brows: { y: 77, w: 17, col: mane, th: 5, lx: 82, rx: 118 },
      mouth: { x: 100, y: 130, w: 16 },
      cheeks: { pts: [[70, 108], [130, 108]], rx: 6, ry: 3.4, col: '#ff8a6a', op: 0.35 },
      fx: { tear: [78, 102], anger: [140, 62], sweat: [146, 80], top: [100, 22], stars: [100, 14] },
      idleMouth: 'smile', browBase: 4,
      poses: { happy: { al: 50, ar: 50 }, win: { al: 90, ar: 90 }, surprised: { al: 30, ar: 30 }, sad: { al: -6, ar: -6 }, hurt: { al: 20, ar: 20 }, angry: { al: 26, ar: 26 }, talk: { al: 8, ar: 14 } },
    };
  },

  boss_c3(c) { // Лис-Кіцуне Дев'яти Ліхтарів — білий лис-дух у кімоно, дев'ять хвостів із ліхтариками-вогниками
    const fur = '#fff4ec', cream = '#ffffff', red = '#e0452b', ind = '#2b2a4c', lamp = '#ffb03a';
    let back = '';
    for (let i = 0; i < 9; i++) {
      const a = -72 + i * 18;
      back += `<g transform="rotate(${a} 100 172)">` + c.E(100, 112, 12, 46, fur, { g: { l: 0.3, d: 0.18 } }) + c.E(100, 72, 8, 12, red, { w: 2 }) +
        `<circle cx="100" cy="58" r="11" fill="${lamp}" opacity=".3"/>` + c.C(100, 58, 5.5, '#ffd27a', { w: 1.6, s: '#c87a1a' }) + `</g>`;
    }
    const s = animalBase(c, { fur });
    return Object.assign(s, {
      hand: null, shadow: [100, 200, 56],
      back,
      body: c.P('M 84 138 L 84 158 Q 100 164 116 158 L 116 138 Z', cream) + c.P(TORSO, '#fbe9ef', { g: { l: 0.3, d: 0.2 } }) +
        c.P('M 60 156 L 100 196 L 140 156 L 128 152 L 100 182 L 72 152 Z', red, { w: 2.4 }) +
        c.P('M 34 186 Q 100 174 166 186 L 168 200 Q 100 188 32 200 Z', ind, { w: 2.4 }) + c.L('M 92 190 Q 100 196 108 190', lamp, 3),
      armL: c.limb('M 54 172 Q 44 188 48 206', '#fbe9ef', 15) + c.C(48, 206, 8, fur),
      armR: c.limb('M 146 172 Q 166 164 168 146', '#fbe9ef', 15) + c.L('M 168 144 L 172 100', '#6b4a2a', 3) +
        `<circle cx="174" cy="112" r="20" fill="${lamp}" opacity=".22"/>` + c.P('M 162 104 C 162 98 186 98 186 104 V 122 C 186 128 162 128 162 122 Z', red) +
        c.L('M 162 110 H 186 M 162 116 H 186', dk(red, 0.3), 1.4, 0.8) + c.C(168, 142, 8, fur),
      pivots: { al: [54, 172], ar: [146, 172] },
      headBase: foxHead(c, fur, cream) + c.P('M 100 60 C 94 70 96 78 100 82 C 104 78 106 70 100 60 Z', red, { w: 1.6 }) +
        c.L('M 70 104 L 78 100 M 130 104 L 122 100', red, 2.6),
      headFront: c.P('M 118 60 C 124 52 136 52 138 60 C 132 64 124 64 118 60 Z', red, { w: 1.6 }) + c.C(128, 58, 2.4, lamp, { w: 0, flat: true }),
      neck: [100, 140],
      eyes: [{ x: 82, y: 93, rx: 9, ry: 9, iris: '#e0a020', side: 'l', lid: fur, lidAmt: 0.42, lash: true }, { x: 118, y: 93, rx: 9, ry: 9, iris: '#e0a020', side: 'r', lid: fur, lidAmt: 0.42, lash: true }],
      brows: { y: 79, w: 15, col: red, th: 3.2, lx: 82, rx: 118 },
      mouth: { x: 100, y: 122, w: 16 },
      cheeks: { pts: [[70, 112], [130, 112]], rx: 6, ry: 3.4, col: '#ff8fb1', op: 0.5 },
      fx: { tear: [78, 100], anger: [138, 70], sweat: [60, 76], top: [100, 40], stars: [100, 30] },
      idleMouth: 'smirk', browBase: 3,
      poses: { happy: { al: 90, ar: 16 }, win: { al: 130, ar: 30 }, surprised: { al: 40, ar: 10 }, sad: { al: -4, ar: -16 }, lose: { al: -6, ar: -26 }, angry: { al: 30, ar: 8 }, hurt: { al: 50, ar: 0 } },
    });
  },

  boss_c4(c) { // Горгулья Нотр-Дамського даху — кам'яна буркотлива горгулья з крилами кажана, баскським беретом і круасаном
    const stone = '#9a9aae', stoneL = '#bdbdcc', wing = '#77778f', moss = '#7a9a5a', beret = '#2b3a6a', so = dk(stone, 0.6);
    const wingD = 'M 72 142 C 44 110 16 100 6 116 C 18 118 22 128 18 140 C 30 136 36 144 34 156 C 46 150 56 156 60 166 Z';
    const back = c.P(wingD, wing, { g: { l: 0.25, d: 0.3 } }) + c.P(flipX(wingD), wing, { g: { l: 0.25, d: 0.3 } }) +
      c.L('M 64 146 C 46 128 30 120 14 120 M 60 152 C 46 142 38 140 30 142', dk(wing, 0.3), 1.6, 0.7) +
      c.L(flipX('M 64 146 C 46 128 30 120 14 120 M 60 152 C 46 142 38 140 30 142'), dk(wing, 0.3), 1.6, 0.7);
    const body = c.P('M 40 204 C 38 168 62 138 100 136 C 138 138 162 168 160 204 Z', stone, { g: { l: 0.3, d: 0.28 } }) +
      c.P('M 74 204 C 74 178 86 162 100 162 C 114 162 126 178 126 204 Z', stoneL, { w: 2 }) +
      c.L('M 82 172 H 118 M 78 186 H 122', dk(stoneL, 0.2), 1.6, 0.7) + c.L('M 54 168 L 62 176 L 58 186', dk(stone, 0.4), 1.6, 0.8) +
      c.E(140, 180, 7, 4, moss, { w: 0, flat: true, op: 0.8 }) + c.E(60, 196, 6, 3.5, moss, { w: 0, flat: true, op: 0.8 });
    const headBase = c.P('M 66 70 C 58 56 60 40 66 32 C 70 44 76 54 80 60 Z', stoneL) + c.P(flipX('M 66 70 C 58 56 60 40 66 32 C 70 44 76 54 80 60 Z'), stoneL) +
      c.P('M 60 84 L 40 66 L 62 74 Z', stone) + c.P(flipX('M 60 84 L 40 66 L 62 74 Z'), stone) +
      c.P('M 56 98 C 52 66 74 52 100 52 C 126 52 148 66 144 98 C 144 124 124 140 100 140 C 76 140 56 124 56 98 Z', stone, { g: { l: 0.3, d: 0.24 } }) +
      c.E(100, 114, 15, 9, stoneL, { w: 2 }) + c.E(94, 112, 2.6, 2, '#4a4a5a', { w: 0, flat: true }) + c.E(106, 112, 2.6, 2, '#4a4a5a', { w: 0, flat: true }) +
      c.L('M 128 70 L 122 80 L 128 88', dk(stone, 0.4), 1.6, 0.8) + c.E(72, 128, 6, 3, moss, { w: 0, flat: true, op: 0.7 });
    const headFront = c.P('M 62 64 C 58 46 88 36 112 40 C 138 44 148 58 140 66 C 120 58 82 58 62 64 Z', beret, { g: { l: 0.3, d: 0.3 } }) + c.L('M 104 40 L 106 32', beret, 3) + c.hl(90, 48, 10, 3, -10, 0.3);
    const croissant = c.P('M 150 160 C 154 148 170 142 180 146 C 186 150 186 158 182 162 C 176 156 164 156 156 164 Z', '#e8a85a', { g: { l: 0.4, d: 0.3 } }) + c.L('M 162 152 L 166 160 M 172 148 L 174 156', '#b87a2a', 1.8);
    return {
      kind: 'full', ol: so, shadow: [100, 200, 58],
      back, body, headBase, headFront,
      armL: c.limb('M 58 160 Q 44 176 50 196', stone, 13) + c.P('M 42 196 L 46 204 L 50 198 L 54 204 L 58 196 Z', stoneL, { w: 2 }),
      armR: c.limb('M 142 160 Q 158 160 162 152', stone, 13) + croissant + c.C(162, 152, 7, stoneL, { w: 2 }),
      pivots: { al: [58, 160], ar: [142, 160] },
      neck: [100, 138],
      eyes: [{ x: 82, y: 92, rx: 9, ry: 9, iris: '#ffb43a', side: 'l', glow: true, lid: stone, lidAmt: 0.45 }, { x: 118, y: 92, rx: 9, ry: 9, iris: '#ffb43a', side: 'r', glow: true, lid: stone, lidAmt: 0.45 }],
      brows: { y: 77, w: 18, col: '#5a5a6e', th: 5.2, lx: 82, rx: 118 },
      mouth: { x: 100, y: 128, w: 18 },
      cheeks: { pts: [[70, 108], [130, 108]], rx: 6, ry: 3.4, col: '#c9a6d8', op: 0.4 },
      fx: { tear: [78, 102], anger: [140, 62], sweat: [148, 84], top: [100, 22], stars: [100, 14] },
      idleMouth: 'flat', browBase: 6,
      poses: { happy: { al: 40, ar: 20 }, win: { al: 80, ar: 40 }, surprised: { al: 30, ar: 14 }, sad: { al: -6, ar: -6 }, hurt: { al: 20, ar: 10 }, angry: { al: 26, ar: -12 }, talk: { al: 12, ar: 10 } },
    };
  },

  boss_c5(c) { // Гондольєр-Привид Венеції — веселий м'ятний привид-гондольєр: смугаста сорочка, капелюх-канотьє, весло, вуса
    const ghost = '#bfeee6', ghostL = '#e8fbf7', navy = '#2b3a6a', straw = '#f3d58a', red = '#c8323c', so = dk(ghost, 0.6);
    const torso = 'M 52 150 C 50 124 72 112 100 112 C 128 112 150 124 148 150 L 146 176 L 54 176 Z';
    const tail = 'M 54 170 C 52 184 44 192 36 198 C 50 198 60 192 66 186 C 72 196 84 202 96 198 C 104 204 118 202 126 194 C 134 200 150 200 164 196 C 154 190 148 182 146 170 Z';
    const clip = c.clip(`<path d="${torso}"/>`);
    const body = c.P(tail, ghost, { g: { l: 0.5, d: 0.2 } }) + c.L('M 64 186 C 80 180 94 190 110 184', ghostL, 3, 0.8) +
      c.P(torso, '#ffffff', { g: { l: 0.2, d: 0.1 } }) +
      `<g clip-path="${clip}">${[124, 136, 148, 160, 172].map((y) => `<path d="M40 ${y} H160" stroke="${navy}" stroke-width="5.5"/>`).join('')}</g>` +
      c.P('M 54 168 Q 100 178 146 168 L 146 178 Q 100 188 54 178 Z', red, { w: 2.2 }) + c.P('M 140 172 L 150 186 L 136 184 Z', red, { w: 2 });
    const headBase = c.P('M 60 98 C 56 66 76 50 100 50 C 124 50 144 66 140 98 C 140 122 122 136 100 136 C 78 136 60 122 60 98 Z', ghost, { g: { l: 0.5, d: 0.18 } }) +
      c.L('M 134 78 C 140 90 140 106 132 120', '#ffffff', 2.4, 0.6) + c.hl(80, 70, 14, 5, -25, 0.5) +
      c.P('M 100 110 C 94 104 82 102 76 108 C 72 112 66 110 66 104 C 64 114 74 120 84 116 C 92 113 97 113 100 113 C 103 113 108 113 116 116 C 126 120 136 114 134 104 C 134 110 128 112 124 108 C 118 102 106 104 100 110 Z', '#3a3a4a', { w: 1.6, s: '#1f1f2a' });
    const headFront = c.E(100, 60, 46, 9, straw, { g: { l: 0.4, d: 0.3 } }) + c.P('M 72 60 L 74 36 C 90 32 110 32 126 36 L 128 60 Z', straw, { g: { l: 0.4, d: 0.3 } }) +
      c.P('M 73 46 C 90 43 110 43 127 46 L 127.5 54 C 110 51 90 51 72.5 54 Z', red, { w: 1.6 }) + c.P('M 126 48 L 140 42 L 138 56 Z', red, { w: 1.6 }) +
      c.L('M 80 38 Q 100 35 120 38', lt(straw, 0.4), 1.4, 0.8);
    const oar = c.L('M 172 30 L 144 196', '#9a6b3e', 5) + c.P('M 140 176 C 134 190 136 204 146 206 C 154 204 156 190 150 178 Z', '#b98a54', { w: 2 });
    return {
      kind: 'full', ol: so, shadow: [100, 200, 50],
      body, headBase, headFront,
      armL: c.limb('M 60 136 Q 44 150 42 168', '#ffffff', 11) + c.C(42, 172, 8, ghostL, { w: 2 }),
      armR: oar + c.limb('M 140 136 Q 156 130 160 112', '#ffffff', 11) + c.C(161, 108, 8, ghostL, { w: 2 }),
      pivots: { al: [60, 136], ar: [140, 136] },
      neck: [100, 134],
      eyes: [{ x: 84, y: 92, rx: 9, ry: 10.5, iris: '#2e9aa6', side: 'l', glow: true, lash: true }, { x: 116, y: 92, rx: 9, ry: 10.5, iris: '#2e9aa6', side: 'r', glow: true, lash: true }],
      brows: { y: 77, w: 16, col: '#3a3a4a', th: 4, lx: 84, rx: 116 },
      mouth: { x: 100, y: 124, w: 15 },
      cheeks: { pts: [[72, 108], [128, 108]], rx: 6, ry: 3.4, col: '#ff9a8a', op: 0.5 },
      fx: { tear: [78, 102], anger: [140, 62], sweat: [146, 82], top: [100, 20], stars: [100, 12] },
      idleMouth: 'grin', browBase: 0,
      poses: { happy: { al: 60, ar: 16 }, win: { al: 110, ar: 30 }, surprised: { al: 30, ar: 10 }, sad: { al: -6, ar: -10 }, hurt: { al: 20, ar: 6 }, angry: { al: 24, ar: -10 }, talk: { al: 18, ar: 6 } },
    };
  },

  olivia(c) { // гідка 🇬🇧: каштанове довге волосся, бежевий тренч, червоний шарф, парасолька за спиною
    const trench = '#d9b77a', scarf = '#c8323c';
    return human(c, {
      skin: '#ffe3cc', hair: '#8a4a2a', style: 'long', eyes: '#4a86d8', lash: true, freckles: true, outfit: trench, blush: '#ff8a9a',
      back: c.L('M 150 204 L 162 120', '#2a2f45', 5) + c.P('M 156 124 C 152 112 160 100 166 96 C 170 104 170 116 166 126 Z', '#2a2f45') + c.L('M 162 120 Q 168 112 172 116', '#2a2f45', 3),
      body: (c) => c.P(TORSO, trench) + c.P('M 76 152 L 100 196 L 82 204 L 60 204 C 64 176 70 160 76 152 Z', lt(trench, 0.12), { w: 2.2 }) +
        c.P(flipX('M 76 152 L 100 196 L 82 204 L 60 204 C 64 176 70 160 76 152 Z'), lt(trench, 0.12), { w: 2.2 }) +
        c.C(92, 184, 3, '#7a5638', { w: 0 }) + c.C(108, 184, 3, '#7a5638', { w: 0 }) +
        c.P('M 74 150 Q 100 166 126 150 Q 128 158 120 162 Q 100 172 80 162 Q 72 158 74 150 Z', scarf, { w: 2.4 }) + c.P('M 112 162 L 120 196 L 106 194 L 104 164 Z', scarf, { w: 2.2 }) +
        c.L('M 108 176 H 118 M 108 186 H 119', lt(scarf, 0.4), 1.4, 0.7),
      sleeve: trench,
      headFront: (c) => c.L('M 68 60 Q 100 44 132 60', '#2b4c8c', 4.5),
    });
  },
  jake(c) { // гід 🇺🇸: кепка (синя з червоним козирком), університетська куртка, зірочка-нашивка
    const jacket = '#c8323c', cap = '#2d5da8';
    return human(c, {
      skin: '#f2c9a8', hair: '#7a4a2a', style: 'short', eyes: '#3f7a4a', outfit: jacket, sleeve: '#f6f2ea',
      body: (c) => c.P(TORSO, jacket) + c.P('M 26 204 C 28 178 40 162 58 156 L 66 204 Z', '#f6f2ea', { w: 2.4 }) + c.P(flipX('M 26 204 C 28 178 40 162 58 156 L 66 204 Z'), '#f6f2ea', { w: 2.4 }) +
        c.P('M 80 152 L 100 168 L 120 152 L 116 150 L 100 162 L 84 150 Z', '#f6f2ea', { w: 2 }) + c.L('M 100 168 V 204', dk(jacket, 0.35), 2, 0.8) +
        c.P('M 80 178 L 83 185 L 90 185 L 84.5 189.5 L 86.5 196.5 L 80 192 L 73.5 196.5 L 75.5 189.5 L 70 185 L 77 185 Z', '#ffc23c', { w: 1.6 }),
      headFront: (c) => c.P('M 62 70 C 58 40 80 28 100 28 C 120 28 142 40 138 70 C 120 62 80 62 62 70 Z', cap, { g: { l: 0.35, d: 0.3 } }) +
        c.P('M 100 64 C 118 56 152 58 162 68 C 150 74 116 74 100 70 Z', '#c8323c', { w: 2.4 }) + c.C(100, 30, 3.4, cap, { w: 1.6 }) + c.L('M 100 30 V 64', dk(cap, 0.3), 1.4, 0.6),
    });
  },
  yuki(c) { // гідка 🇯🇵: чорне каре з чубчиком, шпилька-сакура, блуза з матроським коміром і червоним бантом
    const blouse = '#fffbf8', collar = '#2b2a4c';
    const flower = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="0" cy="-5" rx="3.8" ry="5.6" fill="#ffb7cc" stroke="#d0708e" stroke-width="1.2" transform="rotate(${r})"/>`).join('')}<circle r="2.4" fill="#e0452b"/></g>`;
    return human(c, {
      skin: '#ffe6d4', hair: '#1f1a2e', style: 'bob', eyes: '#5a3a5a', lash: true, outfit: blouse, blush: '#ff8fb1',
      body: (c) => c.P(TORSO, blouse) + c.P('M 60 154 L 100 186 L 140 154 L 150 162 L 100 200 L 50 162 Z', collar, { w: 2.4 }) +
        c.L('M 58 162 L 100 194 L 142 162', '#ffffff', 2, 0.9) +
        c.P('M 100 182 L 84 174 L 86 192 Z', '#e0452b', { w: 2 }) + c.P('M 100 182 L 116 174 L 114 192 Z', '#e0452b', { w: 2 }) + c.C(100, 182, 3.6, '#e0452b', { w: 1.8 }),
      sleeve: blouse,
      headFront: () => flower(130, 60, 1) + flower(140, 70, 0.6),
    });
  },
  lea(c) { // гідка 🇫🇷 (Léa): хвилясте каштанове волосся, червоний берет, тільник, багет за спиною
    const navy = '#2b3a6a';
    const clip = c.clip(`<path d="${TORSO}"/>`);
    return human(c, {
      skin: '#ffe0c8', hair: '#6a3a22', style: 'long', eyes: '#4a7a5a', lash: true, freckles: true, outfit: '#fffaf2', blush: '#ff8a8a', sleeve: '#fffaf2',
      back: `<g transform="rotate(24 150 150)">` + c.P('M 142 206 L 142 96 C 142 88 156 88 156 96 L 156 206 Z', '#e8a85a', { g: { l: 0.35, d: 0.3 } }) +
        c.L('M 144 112 L 154 106 M 144 128 L 154 122 M 144 144 L 154 138', '#b87a2a', 2) + `</g>`,
      body: (c) => c.P(TORSO, '#fffaf2') + `<g clip-path="${clip}">${[160, 172, 184, 196].map((y) => `<path d="M20 ${y} H180" stroke="${navy}" stroke-width="5"/>`).join('')}</g>` +
        c.P('M 86 152 Q 100 160 114 152 L 112 158 Q 100 166 88 158 Z', '#fffaf2', { w: 2 }),
      headFront: (c) => `<g transform="rotate(-14 100 50)">` + c.P('M 58 58 C 56 38 84 28 108 30 C 134 32 148 44 144 56 C 126 50 80 50 58 58 Z', '#c8323c', { g: { l: 0.35, d: 0.3 } }) +
        c.L('M 102 30 L 104 22', '#c8323c', 3.4) + c.hl(86, 40, 10, 3, -10, 0.4) + `</g>`,
    });
  },
  marco(c) { // гід 🇮🇹: темні кучері, біла сорочка, оливковий жилет, зелена хустка, лопата для піци за спиною
    const vest = '#7c8a3c', shirt = '#fffaf0', kerchief = '#3f9a4f';
    return human(c, {
      skin: '#e8b890', hair: '#2a1c18', style: 'curly', eyes: '#5a3a22', outfit: shirt, sleeve: shirt,
      back: c.limb('M 156 204 L 164 110', '#b98a54', 5) + c.E(166, 82, 24, 26, '#d9a66a', { g: { l: 0.35, d: 0.3 } }) +
        c.C(166, 82, 18, '#e8634a', { w: 2, s: '#b84a30' }) + `<g fill="#fff4d6"><circle cx="160" cy="76" r="4"/><circle cx="172" cy="86" r="4"/></g>` + `<g fill="#3f8a3a"><ellipse cx="170" cy="74" rx="2.6" ry="1.6"/><ellipse cx="160" cy="90" rx="2.6" ry="1.6"/></g>`,
      body: (c) => c.P(TORSO, shirt) + c.P('M 26 204 C 28 172 50 156 80 152 L 92 204 Z', vest, { g: { l: 0.3, d: 0.3 } }) + c.P(flipX('M 26 204 C 28 172 50 156 80 152 L 92 204 Z'), vest, { g: { l: 0.3, d: 0.3 } }) +
        c.P('M 80 150 Q 100 164 120 150 L 112 170 L 100 164 L 88 170 Z', kerchief, { w: 2.2 }) + c.C(100, 160, 4, kerchief, { w: 1.8 }) +
        c.C(70, 186, 2.6, '#e8b04a', { w: 0 }) + c.C(130, 186, 2.6, '#e8b04a', { w: 0 }),
    });
  },

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
      eyes: [{ x: 82, y: 93, rx: 9, ry: 9.5, iris: '#8bd14a', side: 'l', lid: fur, lidAmt: 0.16 }, { x: 118, y: 93, rx: 9, ry: 9.5, iris: '#8bd14a', side: 'r', lid: fur, lidAmt: 0.16 }],
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
  // ---- v11: каст історій проміжних світів
  kai(c) { // серфер-рятувальник: вигоріле волосся, намисто з мушель
    const skin = '#d9a06e', tank = '#e8484f';
    let shells = '';
    [[84, 157], [91, 162], [100, 164], [109, 162], [116, 157]].forEach(([x, y], i) => { shells += c.C(x, y, i === 2 ? 4 : 3, i % 2 ? '#ffc9b8' : '#fff6e2', { w: 1.4, s: '#b98a6a' }); });
    return human(c, {
      skin, hair: '#f4dc8c', style: 'messy', eyes: '#2fa7b8', outfit: tank, blush: '#f08a6a', browCol: '#b9924a',
      back: c.P('M 146 204 C 138 124 146 56 164 28 C 184 56 190 124 180 204 Z', '#55cfda', { g: { l: 0.4, d: 0.25 } }) + c.L('M 164 40 V 204', '#fffdf4', 3.4, 0.9) + c.L('M 152 120 Q 164 126 178 120', '#ff8e6b', 3.4),
      body: (c) => c.P(TORSO, skin) + c.P('M 60 204 C 62 178 72 160 82 152 Q 100 168 118 152 C 128 160 138 178 140 204 Z', tank, { g: { l: 0.3, d: 0.25 } }) +
        c.L('M 100 180 V 196 M 92 188 H 108', '#fffdf4', 4.5) + c.L('M 82 151 Q 100 172 118 151', '#f6efe0', 1.8) + shells,
      sleeve: skin,
      headBase: (c) => c.E(100, 104, 7.5, 2.8, '#ffffff', { w: 0, flat: true, op: 0.85 }),
    });
  },
  tim(c) { // v20 · Тім — хлопчик-першокласник: жовта кепка козирком уперед, рюкзак із лямками, наліпка-зірочка
    const cap = '#ffd21f', capDk = '#e8a810', bag = '#4f8ff0', shirt = '#ff7a5c', strap = '#2f5fb8';
    return human(c, {
      skin: '#ffdcc2', hair: '#8a5a32', style: 'short', eyes: '#4a7fd0', outfit: shirt, blush: '#ff8a7a', freckles: true, browCol: '#6a4024',
      back: c.P('M 34 204 C 30 172 40 148 60 144 L 140 144 C 160 148 170 172 166 204 Z', bag, { g: { l: 0.35, d: 0.28 } }) +
        c.P('M 30 186 C 26 170 32 160 42 160 L 46 196 Z', '#ffd21f', { w: 2.2 }) + c.P(flipX('M 30 186 C 26 170 32 160 42 160 L 46 196 Z'), '#ffd21f', { w: 2.2 }),
      body: (c) => c.P(TORSO, shirt, { g: { l: 0.3, d: 0.25 } }) +
        c.P('M 84 152 Q 100 162 116 152 L 112 160 Q 100 168 88 160 Z', '#ffffff', { w: 2 }) +
        c.limb('M 70 154 C 66 170 64 186 64 204', strap, 7, { noHl: true }) + c.limb('M 130 154 C 134 170 136 186 136 204', strap, 7, { noHl: true }) +
        c.C(66, 180, 3.4, '#ffd21f', { w: 1.4 }) + c.C(134, 180, 3.4, '#ffd21f', { w: 1.4 }) +
        c.P('M 100 172 L 103.5 179 L 111 180 L 105.5 185 L 107 192 L 100 188.5 L 93 192 L 94.5 185 L 89 180 L 96.5 179 Z', '#ffd21f', { w: 1.8, s: '#c98a1a' }),
      sleeve: shirt,
      headFront: (c) => c.P('M 58 74 C 56 46 76 32 100 32 C 124 32 144 46 142 74 C 120 66 80 66 58 74 Z', cap, { g: { l: 0.45, d: 0.28 } }) +
        c.L('M 100 34 V 68 M 78 40 Q 74 56 74 70 M 122 40 Q 126 56 126 70', capDk, 1.8, 0.7) +
        c.P('M 58 74 C 80 66 120 66 142 74 L 142 79 C 120 72 80 72 58 79 Z', capDk, { w: 2 }) +
        c.P('M 62 74 C 46 70 28 74 20 84 C 34 90 56 88 74 78 Z', capDk, { g: { l: 0.35, d: 0.3 } }) + c.L('M 26 84 C 40 86 56 84 70 78', lt(capDk, 0.5), 1.6, 0.7) +
        c.C(100, 33, 4, capDk, { w: 1.8 }) + c.hl(80, 46, 12, 4, -18, 0.5) +
        `<text x="100" y="60" text-anchor="middle" font-size="15" font-weight="900" fill="${strap}" font-family="system-ui, sans-serif">1</text>`,
    });
  },
  mila(c) { // v18 · юна пасічниця: солом'яний капелюх із сіткою, руді косички, фартух із бджілкою
    const straw = '#f3d58a', strawDk = '#c99a3a', apron = '#f2a818', shirt = '#fffbea', leaf = '#6baf3a', hair = '#d9652b';
    let braids = '';
    for (const sx of [1, -1]) {
      const X = (x) => (sx === 1 ? x : 200 - x);
      for (let i = 0; i < 5; i++) {
        const bx = X(60 - i * 1.6), by = 110 + i * 10;
        braids += c.E(bx, by, 7.5 - i * 0.4, 6.5, hair, { a: `transform="rotate(${(i % 2 ? 26 : -26) * sx} ${bx} ${by})"`, w: 2.4 });
      }
      braids += c.P(`M ${X(48)} 160 L ${X(56)} 156 L ${X(52)} 168 Z M ${X(60)} 160 L ${X(52)} 156 L ${X(56)} 168 Z`, leaf, { w: 1.6 }) + c.P(`M ${X(51)} 166 L ${X(53)} 176 L ${X(57)} 166 Z`, hair, { w: 1.8 });
    }
    const veil = (d) => c.P(d, '#ffffff', { op: 0.5, w: 1.6, s: '#b8a878' });
    const veilD = 'M 48 64 C 42 80 42 98 50 112 L 60 106 C 56 92 56 78 60 66 Z';
    return human(c, {
      skin: '#ffe3cc', hair, style: 'bob', eyes: '#5a8a3a', lash: true, freckles: true, outfit: shirt, blush: '#ff8a6a',
      back: c.limb('M 152 204 L 160 150', '#9a6b3e', 5) + c.P('M 150 150 C 150 130 172 130 172 150 L 170 160 H 152 Z', '#c9d2e0', { w: 2.2 }) +
        c.P('M 154 132 H 168 L 166 126 H 156 Z', '#9a6b3e', { w: 1.8 }) + c.L('M 158 124 Q 162 116 160 110 M 164 124 Q 168 118 166 112', '#ffffff', 2.4, 0.55),
      body: (c) => c.P(TORSO, shirt) + c.P('M 72 204 L 76 166 L 124 166 L 128 204 Z', apron, { g: { l: 0.3, d: 0.25 } }) +
        c.L('M 76 168 L 84 152 M 124 168 L 116 152', apron, 4) + c.P('M 90 178 H 110 V 194 Q 100 198 90 194 Z', lt(apron, 0.2), { w: 2 }) +
        `<g transform="translate(100 186) scale(.55)"><ellipse cx="0" cy="-7" rx="5" ry="7" fill="#fff" opacity=".9"/><ellipse cx="0" cy="0" rx="9" ry="6.5" fill="#ffc21a" stroke="#4a2c14" stroke-width="2"/><path d="M-3 -6 V6 M3 -6 V6" stroke="#4a2c14" stroke-width="2.6"/></g>` +
        c.P('M 84 150 Q 100 164 116 150 L 110 148 Q 100 156 90 148 Z', leaf, { w: 2 }),
      sleeve: shirt,
      front: () => braids,
      headFront: (c) => veil(veilD) + veil(flipX(veilD)) + c.L('M 50 76 L 58 74 M 48 90 L 57 88 M 50 102 L 57 100 M 150 76 L 142 74 M 152 90 L 143 88 M 150 102 L 143 100', '#b8a878', 1.2, 0.7) +
        c.P('M 40 66 C 56 54 144 54 160 66 C 156 74 44 74 40 66 Z', straw, { g: { l: 0.35, d: 0.3 }, s: strawDk }) +
        c.P('M 66 62 C 64 38 82 26 100 26 C 118 26 136 38 134 62 Z', straw, { g: { l: 0.35, d: 0.3 }, s: strawDk }) +
        c.L('M 66 56 Q 100 50 134 56', leaf, 5) + c.L('M 74 40 Q 100 34 126 40 M 70 50 Q 100 44 130 50', strawDk, 1.4, 0.6) +
        c.P('M 128 50 C 124 40 132 34 138 38 C 142 44 136 52 128 50 Z', '#ffc21a', { w: 1.8 }) + c.C(132, 44, 2.6, '#7a4a1e', { w: 0, flat: true }),
    });
  },
  nora(c) { // механікиня вітряків: комбінезон, хустка
    const denim = '#4f7fc0', shirt = '#fff4dc', scarf = '#e0563f', brass = '#f2b93b';
    return human(c, {
      skin: '#f2c9a8', hair: '#7a4a2a', style: 'bun', eyes: '#5a8a3a', lash: true, freckles: true, outfit: shirt,
      back: c.limb('M 44 168 L 30 92', '#9aa6b8', 6) + c.P('M 18 92 C 16 76 26 68 34 72 L 30 82 L 38 86 L 44 76 C 50 84 46 98 34 100 C 26 100 20 98 18 92 Z', '#b9c4d4', { w: 2.4 }),
      body: (c) => c.P(TORSO, shirt) + c.P('M 74 204 L 77 168 L 123 168 L 126 204 Z', denim, { g: { l: 0.3, d: 0.28 } }) +
        c.P('M 77 170 L 68 153 L 77 150 L 87 170 Z', denim, { w: 2.4 }) + c.P('M 123 170 L 132 153 L 123 150 L 113 170 Z', denim, { w: 2.4 }) +
        c.C(82, 172, 3, brass, { w: 1.2 }) + c.C(118, 172, 3, brass, { w: 1.2 }) +
        c.P('M 90 182 H 110 V 198 Q 100 202 90 198 Z', lt(denim, 0.15), { w: 2 }) + c.L('M 96 180 V 190 M 104 178 V 190', '#c9d2e0', 2.6),
      sleeve: shirt,
      headBase: (c) => c.E(124, 112, 5, 2.4, '#6b6f7a', { w: 0, flat: true, op: 0.45 }),
      headFront: (c) => c.P('M 57 76 C 52 42 78 28 100 28 C 124 28 148 42 143 76 C 124 56 78 56 57 76 Z', scarf, { g: { l: 0.3, d: 0.28 } }) +
        [[78, 46], [100, 38], [122, 46], [66, 60], [134, 60], [90, 52], [112, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#fff6e2"/>`).join('') +
        c.P('M 140 70 L 156 62 L 152 78 Z', scarf, { w: 2.2 }) + c.P('M 140 72 L 154 86 L 142 86 Z', scarf, { w: 2.2 }) + c.C(141, 72, 3.6, dk(scarf, 0.15), { w: 1.8 }),
    });
  },
  boss_w4b(c) { // Сфінкс Туманів — добра загадкова істота: лев-пісковик, туманно-срібні крила, корона з місячним каменем
    const col = '#d9b77e', light = '#f1dcae', mane = '#b98f56', wing = '#c9d3e0', wingDk = '#8e9cb2', navy = '#2e3a4c', lampc = '#e8f6ff', teal = '#8fe0d6', so = dk(col, 0.6);
    let body = '';
    // крила за спиною — пір'я туманно-срібне
    for (const sx of [1, -1]) {
      const fx = (d) => (sx === 1 ? d : flipX(d));
      body += c.P(fx('M 70 140 C 40 120 18 96 14 66 C 30 74 44 76 54 92 C 50 76 52 62 60 52 C 66 76 74 96 84 120 Z'), wing, { g: { l: 0.45, d: 0.25 }, s: wingDk });
      for (const d of ['M 22 76 C 36 92 50 108 66 124', 'M 40 72 C 50 92 60 110 72 126', 'M 56 60 C 62 84 70 106 78 124']) body += c.L(fx(d), wingDk, 2, 0.7);
    }
    // тіло лева (лежить), лапи
    body += c.E(100, 168, 46, 26, col, { g: { l: 0.32, d: 0.3 } }) + c.E(100, 172, 26, 14, light, { w: 0 });
    body += c.L('M 146 172 C 168 176 176 162 170 150', col, 6) + c.C(170, 148, 6, mane, { w: 2 });
    let headBase = '';
    // грива-хустка як у сфінкса: пісковик із бірюзовими смугами
    headBase += c.P('M 46 118 C 36 70 64 34 100 34 C 136 34 164 70 154 118 C 150 140 132 150 100 150 C 68 150 50 140 46 118 Z', mane, { g: { l: 0.3, d: 0.3 } });
    for (const d of ['M 52 120 C 50 100 54 80 62 66', 'M 148 120 C 150 100 146 80 138 66']) headBase += c.L(d, teal, 4, 0.75);
    headBase += c.P('M 62 104 C 58 70 76 50 100 50 C 124 50 142 70 138 104 C 136 128 120 142 100 142 C 80 142 64 128 62 104 Z', col, { g: { l: 0.38, d: 0.2 } });
    headBase += c.E(100, 124, 16, 11, light, { w: 2 }) + c.P('M 94 114 C 94 110 106 110 106 114 C 104 118 96 118 94 114 Z', '#8a5a3a', { w: 1.6 });
    // корона — срібний обруч із місячним каменем-перлиною
    headBase += `<circle cx="100" cy="30" r="17" fill="${lampc}" opacity=".4"/>` +
      c.P('M 80 52 L 83 36 L 90 43 L 95 30 L 100 38 L 105 30 L 110 43 L 117 36 L 120 52 Z', '#dfe5ee', { g: { l: 0.5, d: 0.2 }, s: navy, w: 2.4 }) +
      c.L('M 82 47 H 118', '#b9a6ec', 3) +
      `<circle cx="100" cy="28" r="7" fill="#eef4fb" stroke="${navy}" stroke-width="2.2"/><circle cx="100" cy="28" r="4" fill="${teal}" opacity=".55"/><circle cx="98" cy="26" r="1.8" fill="#fff"/>` +
      `<circle cx="95" cy="30" r="2.2" fill="#d7ccf4"/><circle cx="105" cy="30" r="2.2" fill="#d7ccf4"/>`;
    const armL = 'M 76 172 Q 62 186 54 192';
    const armR = 'M 124 172 Q 138 186 146 192';
    return {
      kind: 'full', ol: so, shadow: [100, 196, 72],
      body, headBase,
      armL: c.limb(armL, col, 12) + c.E(52, 192, 9, 5, light, { w: 2 }),
      armR: c.limb(armR, col, 12) + c.E(148, 192, 9, 5, light, { w: 2 }),
      pivots: { al: [76, 172], ar: [124, 172] },
      neck: [100, 148],
      eyes: [{ x: 84, y: 96, rx: 8.5, ry: 9.5, iris: '#4fb3a8', side: 'l', lid: col, lidAmt: 0.4 }, { x: 116, y: 96, rx: 8.5, ry: 9.5, iris: '#4fb3a8', side: 'r', lid: col, lidAmt: 0.4 }],
      brows: { y: 82, w: 18, col: mane, th: 5, lx: 84, rx: 116 },
      mouth: { x: 100, y: 130, w: 12 },
      cheeks: { pts: [[72, 112], [128, 112]], rx: 6, ry: 3.4, col: '#e8a08a', op: 0.35 },
      fx: { tear: [78, 104], anger: [150, 74], sweat: [148, 98], top: [100, 4], stars: [100, -4] },
      idleMouth: 'smile', browBase: -3,
      poses: { happy: { al: 30, ar: 30 }, win: { al: 60, ar: 60 }, surprised: { al: 20, ar: 20 }, hurt: { al: 10, ar: 10 }, talk: { al: 12, ar: 4 } },
    };
  },

  iris(c) { // дослідниця туманів: окуляри-гогли на капелюсі, плащ, компас на шиї
    const coat = '#6f7f94', coatDk = '#4a5668', hat = '#5a4632', brass = '#d2a24a', lens = '#9fe0d8';
    return human(c, {
      skin: '#a8714e', hair: '#2a1a14', style: 'curly', eyes: '#3a2418', outfit: coat,
      body: (c) => c.P(TORSO, coat) + c.P('M 82 150 L 100 200 L 118 150 Q 100 160 82 150 Z', '#e6ebf3', { w: 2.2 }) +
        c.P('M 70 150 L 88 150 L 100 200 L 76 204 Z', coatDk, { w: 2.2 }) + c.P('M 130 150 L 112 150 L 100 200 L 124 204 Z', coatDk, { w: 2.2 }) +
        c.L('M 90 150 Q 100 170 110 150', '#3a2a1e', 1.8) + c.C(100, 176, 8, brass, { w: 2 }) + c.C(100, 176, 5, '#f6f1e4', { w: 1.2 }) + c.L('M 100 172 V 176 L 103 178', '#c4503c', 1.6),
      sleeve: coat,
      headFront: (c) => c.P('M 48 64 C 60 54 140 54 152 64 C 150 70 50 70 48 64 Z', hat, { g: { l: 0.3, d: 0.3 } }) +
        c.P('M 64 62 C 62 34 80 22 100 22 C 120 22 138 34 136 62 Z', hat, { g: { l: 0.35, d: 0.3 } }) + c.L('M 64 56 Q 100 50 136 56', '#3a2a1e', 5) +
        c.C(84, 46, 8, lens, { w: 2.4 }) + c.C(116, 46, 8, lens, { w: 2.4 }) + c.L('M 92 46 H 108', brass, 3) + c.hl(81, 43, 3, 1.5, -30, 0.6) + c.hl(113, 43, 3, 1.5, -30, 0.6),
    });
  },

  finn(c) { // юний моряк-картограф: смугаста кофта, кашкет
    const navy = '#27407a', white = '#fbf8ef', gold = '#e8b84a';
    const cp = c.clip(`<path d="${TORSO}"/>`);
    let stripes = '';
    for (let y = 162; y < 204; y += 10) stripes += `<path d="M 20 ${y} Q 100 ${y + 8} 180 ${y}" fill="none" stroke="${navy}" stroke-width="4.5"/>`;
    return human(c, {
      skin: '#ffe0c8', hair: '#3a2a22', style: 'short', eyes: '#4a86d8', freckles: true, outfit: white,
      back: c.P('M 140 196 L 166 104 L 178 108 L 154 200 Z', '#f0dfb0', { w: 2.6 }) + c.E(172, 106, 6.5, 3.6, '#e2cc92', { w: 2.2, a: 'transform="rotate(16 172 106)"' }) + c.L('M 148 168 L 160 172', '#e0563f', 4),
      body: (c) => c.P(TORSO, white) + `<g clip-path="${cp}">${stripes}</g>` + c.P(TORSO, 'none', { flat: true, s: dk(white, 0.55) }) +
        c.P('M 80 152 Q 100 166 120 152 L 112 150 Q 100 156 88 150 Z', '#e0563f', { w: 2.2 }) + c.P('M 100 160 L 93 174 L 107 174 Z', '#e0563f', { w: 2.2 }),
      sleeve: white,
      headFront: (c) => c.P('M 57 62 C 52 32 78 20 100 20 C 122 20 148 32 143 62 C 122 50 78 50 57 62 Z', navy, { g: { l: 0.3, d: 0.3 } }) +
        c.P('M 60 62 C 82 50 122 50 142 60 C 150 66 150 72 142 73 C 122 68 84 68 60 72 Z', '#16224a', { w: 2.4 }) + c.hl(100, 62, 20, 2, 0, 0.25) +
        c.C(100, 40, 6.5, gold, { w: 1.8 }) + c.L('M 100 36 V 44 M 96.500 41.500 Q 100 45.500 103.500 41.500', navy, 1.3),
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

// ═════════════════════════════════════════════════════════ v19 · країни c6–c10 (Дизайн Б): гіди + боси
Object.assign(CHARACTERS, {
  boss_c6: { name: 'Вогняний Бик Фієсти', role: 'boss', world: 'c6' },
  boss_c7: { name: 'Лось-Велетень Мус', role: 'boss', world: 'c7' },
  boss_c8: { name: 'Король Кенгуру Бумер', role: 'boss', world: 'c8' },
  boss_c9: { name: 'Ягуар Карнавалу', role: 'boss', world: 'c9' },
  boss_c10: { name: 'Тигр Неонового Сеула', role: 'boss', world: 'c10' },
  lucia: { name: 'Lucía', role: 'guide', world: 'c6' },
  liam: { name: 'Liam', role: 'guide', world: 'c7' },
  mia_au: { name: 'Mia', role: 'guide', world: 'c8' },
  rafa: { name: 'Rafa', role: 'guide', world: 'c9' },
  minji: { name: 'Min-ji', role: 'guide', world: 'c10' },
});
const BOSS_POSES = { happy: { al: 40, ar: 40 }, win: { al: 80, ar: 80 }, surprised: { al: 30, ar: 30 }, sad: { al: -6, ar: -6 }, hurt: { al: 14, ar: 10 }, angry: { al: 24, ar: 24 }, talk: { al: 8, ar: 20 } };
const DRAW_CB = {
  // ---------------------------------------------------------------- боси країн
  boss_c6(c) { // Вогняний Бик Фієсти — гарячий, але чесний бик-танцюрист: полум'яний чуб, квітка за вухом, шарф фієсти
    const fur = '#c8442e', muzzle = '#f2b49a', horn = '#fff1d6', gold = '#ffc400', hoof = '#3a1a14', so = dk(fur, 0.6);
    let body = c.E(76, 192, 15, 7, hoof) + c.E(124, 192, 15, 7, hoof) +
      c.P('M 56 142 C 48 166 58 190 78 190 L 122 190 C 142 190 152 166 144 142 C 130 128 70 128 56 142 Z', fur, { g: { l: 0.32, d: 0.32 } }) +
      c.E(100, 168, 26, 18, muzzle, { w: 0, op: 0.55 }) + c.hl(72, 156, 6, 14, -10, 0.35);
    body += c.P('M 66 134 Q 100 152 134 134 L 100 170 Z', gold, { w: 2.4, s: dk(gold, 0.5) });
    for (const [x, y] of [[84, 144], [100, 150], [116, 144], [100, 160]]) body += c.C(x, y, 2.6, '#e8323c', { w: 0, flat: true });
    const hornL = 'M 68 72 C 48 70 32 58 26 36 C 40 50 54 54 72 60 Z';
    let headBase = c.P(hornL, horn, { g: { l: 0.5, d: 0.2 } }) + c.P(flipX(hornL), horn, { g: { l: 0.5, d: 0.2 } }) +
      c.E(56, 88, 13, 7, fur, { a: 'transform="rotate(-24 56 88)"' }) + c.E(144, 88, 13, 7, fur, { a: 'transform="rotate(24 144 88)"' }) +
      c.C(146, 98, 3, gold, { w: 1.4 });
    headBase += c.P('M 84 58 C 80 42 90 38 92 26 C 98 36 100 30 104 18 C 108 32 116 34 114 44 C 120 42 122 50 118 58 Z', '#ff8a1a', { g: { l: 0.5, d: 0.2 } }) +
      c.P('M 92 56 C 92 46 98 42 100 34 C 104 42 110 46 108 56 Z', '#ffd84a', { w: 0 });
    headBase += c.P('M 64 92 C 60 64 78 50 100 50 C 122 50 140 64 136 92 C 136 112 128 126 100 128 C 72 126 64 112 64 92 Z', fur, { g: { l: 0.36, d: 0.3 } }) +
      c.hl(82, 66, 12, 5, -25, 0.4);
    headBase += c.E(100, 120, 28, 17, muzzle, { g: { l: 0.4, d: 0.15 } }) + c.E(89, 114, 3, 4, '#7a2a20', { w: 0, flat: true }) + c.E(111, 114, 3, 4, '#7a2a20', { w: 0, flat: true });
    // троянда за вухом
    let rose = '';
    for (let i = 0; i < 5; i++) { const a = (i * Math.PI * 2) / 5; rose += c.C(r1(54 + Math.cos(a) * 6), r1(70 + Math.sin(a) * 6), 6, '#e8323c', { w: 2 }); }
    rose += c.C(54, 70, 4.5, '#b81e2a', { w: 1.6 }) + c.P('M 46 80 C 40 84 38 90 42 92 C 46 88 48 84 46 80 Z', '#3f8a33', { w: 1.6 });
    const armL = 'M 62 146 Q 48 158 46 174';
    return {
      kind: 'full', ol: so, shadow: [100, 196, 60],
      body, headBase, headFront: rose,
      armL: c.limb(armL, fur, 12) + c.E(46, 178, 8, 6, hoof),
      armR: c.limb(flipX(armL), fur, 12) + c.E(154, 178, 8, 6, hoof),
      pivots: { al: [62, 146], ar: [138, 146] }, neck: [100, 132],
      eyes: [{ x: 84, y: 88, rx: 9, ry: 10, iris: '#3a1a10', side: 'l', lid: fur, lidAmt: 0.3 }, { x: 116, y: 88, rx: 9, ry: 10, iris: '#3a1a10', side: 'r', lid: fur, lidAmt: 0.3 }],
      brows: { y: 73, w: 18, col: '#5a1410', th: 5, lx: 84, rx: 116 },
      mouth: { x: 100, y: 124, w: 16 },
      cheeks: { pts: [[72, 104], [128, 104]], rx: 7, ry: 4, col: '#ff8a6a', op: 0.5 },
      fx: { tear: [78, 98], anger: [140, 60], sweat: [146, 80], top: [100, 16], stars: [100, 6] },
      idleMouth: 'smirk', browBase: 6, poses: BOSS_POSES,
    };
  },
  boss_c7(c) { // Лось-Велетень Мус — величезний, сором'язливий лось у червоному картатому шарфі, постійно вибачається
    const fur = '#7a4e2e', snout = '#a8744c', antler = '#e8cfa0', scarf = '#d52b1e', hoof = '#2e1c12', so = dk(fur, 0.55);
    const antL = 'M 72 64 C 58 58 42 60 32 50 C 22 42 18 28 22 16 L 30 26 L 32 10 L 40 24 L 44 8 L 50 24 L 58 14 L 58 32 C 62 44 70 50 78 54 Z';
    let headBase = c.P(antL, antler, { g: { l: 0.45, d: 0.25 } }) + c.P(flipX(antL), antler, { g: { l: 0.45, d: 0.25 } }) +
      c.E(60, 80, 14, 6, fur, { a: 'transform="rotate(-22 60 80)"' }) + c.E(140, 80, 14, 6, fur, { a: 'transform="rotate(22 140 80)"' });
    headBase += c.P('M 70 82 C 70 60 84 52 100 52 C 116 52 130 60 130 82 L 132 112 C 134 134 120 146 100 146 C 80 146 66 134 68 112 Z', fur, { g: { l: 0.32, d: 0.3 } }) +
      c.hl(84, 64, 10, 4, -25, 0.35);
    headBase += c.E(100, 126, 27, 19, snout, { g: { l: 0.35, d: 0.2 } }) + c.E(89, 122, 3.4, 4.6, '#3a2016', { w: 0, flat: true }) + c.E(111, 122, 3.4, 4.6, '#3a2016', { w: 0, flat: true });
    let body = c.E(78, 194, 14, 6, hoof) + c.E(122, 194, 14, 6, hoof) +
      c.P('M 52 152 C 46 174 56 192 76 194 H 124 C 144 192 154 174 148 152 C 134 140 66 140 52 152 Z', fur, { g: { l: 0.3, d: 0.32 } }) +
      c.E(100, 176, 22, 14, lt(fur, 0.25), { w: 0, op: 0.5 });
    body += c.P('M 62 140 Q 100 160 138 140 L 140 154 Q 100 174 60 154 Z', scarf, { g: { l: 0.3, d: 0.25 } }) +
      c.L('M 74 148 L 76 162 M 100 156 V 170 M 126 148 L 124 162 M 64 150 Q 100 168 136 150', dk(scarf, 0.45), 2.2, 0.7) +
      c.P('M 116 158 L 132 186 L 120 190 L 108 162 Z', scarf, { w: 2.4 }) + c.L('M 120 172 L 126 170 M 116 180 L 128 178', dk(scarf, 0.45), 2, 0.7);
    const armL = 'M 58 156 Q 44 168 44 182';
    return {
      kind: 'full', ol: so, shadow: [100, 198, 62],
      body, headBase,
      armL: c.limb(armL, fur, 12) + c.E(44, 186, 8, 5.5, hoof),
      armR: c.limb(flipX(armL), fur, 12) + c.E(156, 186, 8, 5.5, hoof),
      pivots: { al: [58, 156], ar: [142, 156] }, neck: [100, 140],
      eyes: [{ x: 85, y: 90, rx: 8.5, ry: 10, iris: '#2a1a10', side: 'l', lid: fur, lidAmt: 0.4 }, { x: 115, y: 90, rx: 8.5, ry: 10, iris: '#2a1a10', side: 'r', lid: fur, lidAmt: 0.4 }],
      brows: { y: 76, w: 16, col: '#3a2016', th: 4.6, lx: 85, rx: 115 },
      mouth: { x: 100, y: 134, w: 16 },
      cheeks: { pts: [[74, 108], [126, 108]], rx: 6, ry: 3.6, col: '#ff8a7a', op: 0.45 },
      fx: { tear: [78, 100], anger: [136, 62], sweat: [140, 84], top: [100, 8], stars: [100, 0] },
      idleMouth: 'smile', browBase: -4, poses: BOSS_POSES,
    };
  },
  boss_c8(c) { // Король Кенгуру Бумер — гордий кенгуру-боксер у короні, з кошеням-джоуї в сумці
    const fur = '#d9894a', belly = '#f6d8b0', glove = '#e8323c', gold = '#ffc21a', so = dk(fur, 0.6);
    const back = c.P('M 130 178 C 160 186 182 176 194 156 C 178 168 156 170 132 166 Z', fur, { g: { l: 0.35, d: 0.3 } });
    let body = c.E(78, 196, 20, 6, dk(fur, 0.2)) + c.E(122, 196, 20, 6, dk(fur, 0.2)) +
      c.P('M 62 142 C 50 168 60 196 80 196 H 120 C 140 196 150 168 138 142 C 126 128 74 128 62 142 Z', fur, { g: { l: 0.32, d: 0.3 } }) +
      c.P('M 76 148 C 72 170 80 190 100 190 C 120 190 128 170 124 148 C 112 140 88 140 76 148 Z', belly, { w: 0 }) +
      c.L('M 80 172 Q 100 180 120 172', dk(belly, 0.35), 2.4);
    // джоуї в сумці
    body += c.E(92, 160, 4, 8, fur, { w: 2, a: 'transform="rotate(-14 92 160)"' }) + c.E(108, 160, 4, 8, fur, { w: 2, a: 'transform="rotate(14 108 160)"' }) +
      c.C(100, 168, 9, fur, { w: 2.2 }) + c.C(96.5, 166, 1.6, '#2a1a10', { w: 0, flat: true }) + c.C(103.5, 166, 1.6, '#2a1a10', { w: 0, flat: true }) + c.C(100, 170.5, 1.6, '#3a2014', { w: 0, flat: true });
    const earL = 'M 78 66 C 66 46 64 24 70 10 C 84 20 90 42 88 62 Z';
    let headBase = c.P(earL, fur) + c.P(flipX(earL), fur) + c.P('M 78 58 C 72 44 72 30 74 22 C 80 32 84 44 84 56 Z', '#ffb3a0', { w: 0 }) +
      c.P(flipX('M 78 58 C 72 44 72 30 74 22 C 80 32 84 44 84 56 Z'), '#ffb3a0', { w: 0 });
    headBase += c.P('M 66 94 C 64 68 80 56 100 56 C 120 56 136 68 134 94 C 134 114 122 130 100 132 C 78 130 66 114 66 94 Z', fur, { g: { l: 0.36, d: 0.28 } }) +
      c.hl(82, 70, 11, 4, -25, 0.4) + c.E(100, 116, 20, 14, lt(fur, 0.4), { w: 0 }) + c.E(100, 108, 6, 4, '#3a2014', { w: 0 });
    headBase += c.P('M 82 60 L 80 40 L 90 48 L 100 32 L 110 48 L 120 40 L 118 60 Z', gold, { g: { l: 0.5, d: 0.25 } }) +
      c.C(100, 50, 3, '#2f6fe0', { w: 1.4 }) + c.C(88, 54, 2.2, '#e8323c', { w: 1.2 }) + c.C(112, 54, 2.2, '#13a453', { w: 1.2 });
    const armL = 'M 66 148 Q 54 154 52 164';
    const gl = (x) => c.E(x, 170, 11, 10, glove, { g: { l: 0.45, d: 0.3 } }) + c.P(`M ${x - 9} 176 H ${x + 9} V 182 H ${x - 9} Z`, '#ffffff', { w: 2 });
    return {
      kind: 'full', ol: so, shadow: [100, 200, 62],
      back, body, headBase,
      armL: c.limb(armL, fur, 9) + gl(50), armR: c.limb(flipX(armL), fur, 9) + gl(150),
      pivots: { al: [66, 148], ar: [134, 148] }, neck: [100, 134],
      eyes: [{ x: 85, y: 90, rx: 9, ry: 10.5, iris: '#3a2412', side: 'l', lash: true, lid: fur, lidAmt: 0.3 }, { x: 115, y: 90, rx: 9, ry: 10.5, iris: '#3a2412', side: 'r', lash: true, lid: fur, lidAmt: 0.3 }],
      brows: { y: 75, w: 16, col: '#5a2e14', th: 4.4, lx: 85, rx: 115 },
      mouth: { x: 100, y: 120, w: 14 },
      cheeks: { pts: [[74, 106], [126, 106]], rx: 6.5, ry: 4, col: '#ff8a6a', op: 0.5 },
      fx: { tear: [78, 100], anger: [138, 66], sweat: [140, 84], top: [100, 20], stars: [100, 8] },
      idleMouth: 'smirk', browBase: 4, poses: { ...BOSS_POSES, angry: { al: 50, ar: 50 } },
    };
  },
  boss_c9(c) { // Ягуар Карнавалу — артистичний ягуар у пір'яному головному уборі й блискучому комірі
    const fur = '#f2b23a', spot = '#5a3410', cream = '#fff1d0', so = dk(fur, 0.62);
    const feathers = ['#ff4f8a', '#13a453', '#2f6fe0', '#ffc21a', '#ff8a1a', '#13a453', '#ff4f8a'];
    let back = '';
    feathers.forEach((col, i) => { const a = -60 + i * 20; back += c.E(100, 18, 10, 30, col, { g: { l: 0.45, d: 0.25 }, a: `transform="rotate(${a} 100 70)"` }); });
    back += c.P('M 120 176 C 150 184 168 170 170 150 C 172 138 164 132 158 138 C 162 150 152 166 124 166 Z', fur, { g: { l: 0.35, d: 0.3 } }) + c.C(160, 144, 3, spot, { w: 0, flat: true });
    let body = c.E(80, 194, 13, 6, cream) + c.E(120, 194, 13, 6, cream) +
      c.P('M 58 144 C 50 168 60 192 80 194 H 120 C 140 192 150 168 142 144 C 128 132 72 132 58 144 Z', fur, { g: { l: 0.32, d: 0.3 } }) +
      c.E(100, 172, 20, 16, cream, { w: 0, op: 0.85 });
    for (const [x, y] of [[66, 160], [134, 162], [74, 182], [126, 182], [60, 176], [140, 176]]) body += `<circle cx="${x}" cy="${y}" r="4.2" fill="none" stroke="${spot}" stroke-width="2.2"/>`;
    let ruff = 'M 64 138';
    for (let i = 0; i <= 8; i++) { const x = 64 + i * 9; ruff += ` L ${x + 4.5} ${i % 2 ? 156 : 152} L ${x + 9} 138`; }
    body += c.P(ruff + ' Z', '#ff4f8a', { w: 2.2 });
    for (let i = 0; i < 8; i++) body += c.C(68.5 + i * 9, 144, 2, ['#ffc21a', '#3ee6ff'][i % 2], { w: 0, flat: true });
    let headBase = c.C(66, 62, 13, fur) + c.C(66, 62, 6, '#ffb38a', { w: 0 }) + c.C(134, 62, 13, fur) + c.C(134, 62, 6, '#ffb38a', { w: 0 });
    headBase += c.P('M 60 96 C 58 66 78 52 100 52 C 122 52 142 66 140 96 C 140 120 124 134 100 136 C 76 134 60 120 60 96 Z', fur, { g: { l: 0.36, d: 0.28 } });
    for (const [x, y, r] of [[72, 104, 3.4], [128, 104, 3.4], [78, 78, 2.6], [122, 78, 2.6], [66, 92, 2.4], [134, 92, 2.4]]) headBase += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${spot}" stroke-width="2"/>`;
    headBase += c.P('M 78 112 C 84 102 96 104 100 110 C 104 104 116 102 122 112 C 126 124 114 134 100 134 C 86 134 74 124 78 112 Z', cream, { w: 0 }) +
      c.P('M 94 108 H 106 L 100 115 Z', '#6a2a2a', { w: 1.6 }) +
      c.L('M 76 116 L 60 112 M 76 121 L 60 123 M 124 116 L 140 112 M 124 121 L 140 123', '#5a3410', 1.4, 0.7);
    headBase += c.P('M 64 72 Q 100 58 136 72 L 134 80 Q 100 66 66 80 Z', '#ffc21a', { w: 2.2 }) + c.C(100, 66, 4, '#2f6fe0', { w: 1.4 });
    const armL = 'M 62 150 Q 48 160 46 174';
    return {
      kind: 'full', ol: so, shadow: [100, 198, 60],
      back, body, headBase,
      armL: c.limb(armL, fur, 11) + c.C(45, 178, 7.5, cream, { w: 2.4 }), armR: c.limb(flipX(armL), fur, 11) + c.C(155, 178, 7.5, cream, { w: 2.4 }),
      pivots: { al: [62, 150], ar: [138, 150] }, neck: [100, 136],
      eyes: [{ x: 84, y: 92, rx: 9, ry: 10, iris: '#3f9a3a', side: 'l', lash: true, lid: fur, lidAmt: 0.36, glow: true }, { x: 116, y: 92, rx: 9, ry: 10, iris: '#3f9a3a', side: 'r', lash: true, lid: fur, lidAmt: 0.36, glow: true }],
      brows: { y: 77, w: 16, col: spot, th: 4.2, lx: 84, rx: 116 },
      mouth: { x: 100, y: 122, w: 14 },
      cheeks: { pts: [[72, 112], [128, 112]], rx: 6, ry: 3.6, col: '#ff6f8a', op: 0.45 },
      fx: { tear: [78, 102], anger: [140, 66], sweat: [144, 84], top: [100, 6], stars: [100, 0] },
      idleMouth: 'smirk', browBase: 3, poses: BOSS_POSES,
    };
  },
  boss_c10(c) { // Тигр Неонового Сеула — стильний тигр-диджей: навушники, бомбер із неоновим кантом
    const fur = '#ff8a2a', stripe = '#2a1430', white = '#fff6ee', neonP = '#ff4fa3', neonC = '#3ee6ff', jacket = '#2a2450', so = dk(fur, 0.62);
    let body = c.E(80, 194, 13, 6, fur) + c.E(120, 194, 13, 6, fur) +
      c.P('M 56 146 C 48 170 58 192 78 194 H 122 C 142 192 152 170 144 146 C 130 132 70 132 56 146 Z', jacket, { g: { l: 0.3, d: 0.3 } }) +
      c.P('M 84 140 L 100 176 L 116 140 Z', fur, { w: 2 }) + c.L('M 92 146 L 98 150 M 108 146 L 102 150 M 95 158 L 100 161 M 105 158 L 100 161', stripe, 2.4) +
      c.L('M 84 140 L 100 178 L 116 140', neonP, 2.6) + c.L('M 60 190 H 140', neonC, 3, 0.9) + c.P(star5(128, 166, 7), neonC, { w: 1.6 });
    let headBase = c.C(66, 62, 13, fur) + c.C(66, 62, 6.5, white, { w: 0 }) + c.C(134, 62, 13, fur) + c.C(134, 62, 6.5, white, { w: 0 });
    headBase += c.P('M 56 98 C 54 66 76 52 100 52 C 124 52 146 66 144 98 C 144 122 126 136 100 138 C 74 136 56 122 56 98 Z', fur, { g: { l: 0.36, d: 0.26 } });
    headBase += c.P('M 58 104 C 64 122 80 132 100 134 C 120 132 136 122 142 104 C 130 114 116 116 100 114 C 84 116 70 114 58 104 Z', white, { w: 0 }) +
      c.E(100, 116, 16, 11, white, { w: 0 }) + c.P('M 94 108 H 106 L 100 114 Z', '#ff7aa8', { w: 1.6 });
    headBase += c.F('M 100 54 L 95 72 L 105 72 Z M 84 57 L 88 74 L 92 60 Z M 116 57 L 112 74 L 108 60 Z', stripe) +
      c.F('M 57 88 L 74 92 L 58 96 Z M 58 102 L 72 104 L 60 110 Z M 143 88 L 126 92 L 142 96 Z M 142 102 L 128 104 L 140 110 Z', stripe) +
      c.L('M 62 84 L 72 88 M 138 84 L 128 88', neonC, 1.6, 0.8);
    const phones = c.L('M 56 90 C 52 40 148 40 144 90', stripe, 7) + c.L('M 58 86 C 56 46 144 46 142 86', neonP, 2.4, 0.9) +
      c.E(54, 96, 9, 14, neonP, { g: { l: 0.45, d: 0.3 } }) + c.E(146, 96, 9, 14, neonP, { g: { l: 0.45, d: 0.3 } }) +
      c.E(54, 96, 4, 8, neonC, { w: 0, op: 0.85 }) + c.E(146, 96, 4, 8, neonC, { w: 0, op: 0.85 });
    const armL = 'M 60 152 Q 46 162 44 176';
    return {
      kind: 'full', ol: so, shadow: [100, 198, 60],
      body, headBase, headFront: phones,
      armL: c.limb(armL, jacket, 12) + c.L('M 46 172 L 42 168', neonP, 2.4) + c.C(44, 180, 7.5, fur, { w: 2.4 }),
      armR: c.limb(flipX(armL), jacket, 12) + c.L('M 154 172 L 158 168', neonP, 2.4) + c.C(156, 180, 7.5, fur, { w: 2.4 }),
      pivots: { al: [60, 152], ar: [140, 152] }, neck: [100, 136],
      eyes: [{ x: 84, y: 92, rx: 9, ry: 10, iris: '#d8a01a', side: 'l', lid: fur, lidAmt: 0.34, glow: true }, { x: 116, y: 92, rx: 9, ry: 10, iris: '#d8a01a', side: 'r', lid: fur, lidAmt: 0.34, glow: true }],
      brows: { y: 77, w: 17, col: stripe, th: 4.6, lx: 84, rx: 116 },
      mouth: { x: 100, y: 124, w: 14 },
      cheeks: { pts: [[72, 110], [128, 110]], rx: 6, ry: 3.6, col: '#ff6fa8', op: 0.5 },
      fx: { tear: [78, 102], anger: [140, 62], sweat: [146, 80], top: [100, 26], stars: [100, 14] },
      idleMouth: 'smirk', browBase: 5, poses: BOSS_POSES,
    };
  },

  // ---------------------------------------------------------------- гіди країн
  lucia(c) { // 🇪🇸 Lucía — танцівниця фламенко: гулька з гребенем, троянда, сукня в горох, кільця-сережки
    const red = '#d8283a', dot = '#fff3e6', gold = '#f2c14a';
    return human(c, {
      skin: '#f0c39c', hair: '#2a1612', style: 'bun', eyes: '#5a3418', lash: true, outfit: red, sleeve: red, blush: '#ff6f7f',
      body: (c) => c.P(TORSO, red, { g: { l: 0.3, d: 0.3 } }) +
        [[50, 182], [70, 174], [62, 196], [132, 176], [150, 186], [118, 194], [86, 192], [40, 198], [160, 200]].map(([x, y]) => c.C(x, y, 4, dot, { w: 0, flat: true })).join('') +
        c.P('M 70 154 Q 78 168 86 156 Q 93 170 100 158 Q 107 170 114 156 Q 122 168 130 154 Q 100 146 70 154 Z', '#1a1214', { w: 2 }),
      headFront: (c) => {
        let r = '';
        for (let i = 0; i < 5; i++) { const a = (i * Math.PI * 2) / 5; r += c.C(r1(134 + Math.cos(a) * 6), r1(54 + Math.sin(a) * 6), 6.5, '#e8323c', { w: 2 }); }
        return r + c.C(134, 54, 4.5, '#b81e2a', { w: 1.6 }) + c.P('M 140 64 C 148 66 152 72 148 74 C 144 72 142 68 140 64 Z', '#3f8a33', { w: 1.6 }) +
          `<circle cx="63" cy="113" r="5" fill="none" stroke="${gold}" stroke-width="2.4"/><circle cx="137" cy="113" r="5" fill="none" stroke="${gold}" stroke-width="2.4"/>`;
      },
    });
  },
  liam(c) { // 🇨🇦 Liam — рейнджер нацпарку: капелюх рейнджера з кленовим значком, картата сорочка
    const flannel = '#c8322a', dkf = '#7a1a16', hat = '#c9a46a', band = '#5a3a20';
    return human(c, {
      skin: '#f6d2b4', hair: '#8a5a2e', style: 'short', eyes: '#3a6a9a', freckles: true, outfit: flannel, sleeve: flannel,
      body: (c) => c.P(TORSO, flannel, { g: { l: 0.3, d: 0.3 } }) + c.L('M 40 176 H 160 M 32 192 H 168', dkf, 3, 0.6) + c.L('M 60 162 V 204 M 140 162 V 204 M 80 154 V 204 M 120 154 V 204', dkf, 3, 0.5) +
        c.P('M 88 151 L 100 166 L 112 151 Z', '#2f7d5a', { w: 2 }) + c.P('M 80 152 L 92 150 L 100 166 L 88 170 Z', dk(flannel, 0.15), { w: 2 }) + c.P(flipX('M 80 152 L 92 150 L 100 166 L 88 170 Z'), dk(flannel, 0.15), { w: 2 }),
      headFront: (c) => c.P('M 38 70 C 60 60 140 60 162 70 C 152 79 48 79 38 70 Z', hat, { g: { l: 0.35, d: 0.3 } }) +
        c.P('M 66 66 C 64 44 80 30 100 30 C 120 30 136 44 134 66 Z', hat, { g: { l: 0.4, d: 0.25 } }) + c.L('M 100 32 V 46 M 86 36 L 90 48 M 114 36 L 110 48', dk(hat, 0.3), 2, 0.7) +
        c.P('M 66 58 Q 100 52 134 58 L 134 66 Q 100 60 66 66 Z', band, { w: 1.8 }) +
        `<g transform="translate(122 61) scale(.32)"><path d="M0 -20 L4 -11 L9 -14 L8 -5 L16 -8 L13 -1 L19 2 L9 6 L11 12 L2 9 L1 20 L-1 20 L-2 9 L-11 12 L-9 6 L-19 2 L-13 -1 L-16 -8 L-8 -5 L-9 -14 L-4 -11Z" fill="#d52b1e" stroke="#5a1410" stroke-width="3"/></g>`,
    });
  },
  mia_au(c) { // 🇦🇺 Mia — рятувальниця на пляжі: червоно-жовта форма, свисток, цинкова смужка на носі, окуляри на голові
    const red = '#e8323c', yel = '#ffc21a';
    return human(c, {
      skin: '#e6b088', hair: '#f2cf6a', style: 'long', eyes: '#1f8a9a', lash: true, freckles: true, outfit: red, sleeve: red, blush: '#ff8a6a',
      body: (c) => c.P(TORSO, red, { g: { l: 0.3, d: 0.3 } }) + c.P('M 38 184 C 80 174 120 174 162 184 L 164 196 C 120 186 80 186 36 196 Z', yel, { w: 2 }) +
        c.L('M 86 152 Q 100 176 114 152', '#1f6a8a', 2) + c.P('M 95 172 H 107 V 180 H 95 Z', '#c9d2e0', { w: 1.8 }),
      headBase: (c) => c.E(100, 107, 10, 3.2, '#ffffff', { w: 0, flat: true, op: 0.85 }),
      headFront: (c) => c.P('M 68 56 Q 82 50 96 56 Q 92 66 80 66 Q 70 64 68 56 Z', '#1f3a4a', { w: 2 }) + c.P(flipX('M 68 56 Q 82 50 96 56 Q 92 66 80 66 Q 70 64 68 56 Z'), '#1f3a4a', { w: 2 }) +
        c.L('M 96 56 Q 100 53 104 56', '#1f3a4a', 2.4) + c.hl(78, 58, 6, 2, -10, 0.6) + c.hl(116, 58, 6, 2, -10, 0.6),
    });
  },
  rafa(c) { // 🇧🇷 Rafa — футболіст-карнавальник: кучері, пов'язка, жовта футболка з десяткою
    const jersey = '#ffd21a', green = '#13a453', blue = '#2f4fb0';
    return human(c, {
      skin: '#a8704a', hair: '#1e1410', style: 'curly', eyes: '#4a2a14', outfit: jersey, sleeve: jersey, blush: '#e8604a',
      body: (c) => c.P(TORSO, jersey, { g: { l: 0.3, d: 0.25 } }) + c.P('M 84 151 L 100 170 L 116 151 L 110 150 L 100 162 L 90 150 Z', green, { w: 2 }) +
        c.L('M 34 190 Q 40 172 54 162', green, 6) + c.L(flipX('M 34 190 Q 40 172 54 162'), green, 6) +
        `<text x="128" y="196" text-anchor="middle" font-size="22" font-weight="900" fill="${blue}" font-family="inherit">10</text>`,
      headFront: (c) => c.P('M 58 76 Q 100 62 142 76 L 141 84 Q 100 70 59 84 Z', green, { w: 2.2 }) + c.L('M 62 79 Q 100 66 138 79', '#ffd21a', 1.6),
    });
  },
  minji(c) { // 🇰🇷 Min-ji — K-pop танцівниця: довге волосся, гарнітура-мікрофон, бузковий бомбер, зіркова шпилька
    const jacket = '#b9a0ff', pink = '#ff4fa3', cyan = '#3ee6ff';
    return human(c, {
      skin: '#f8dcc6', hair: '#1a1424', style: 'long', eyes: '#2a1a14', lash: true, outfit: jacket, sleeve: jacket, blush: '#ff8fb5',
      body: (c) => c.P(TORSO, jacket, { g: { l: 0.35, d: 0.25 } }) + c.P('M 82 152 L 100 178 L 118 152 Z', '#ffffff', { w: 2 }) +
        c.P('M 82 152 L 68 160 L 92 190 L 100 178 Z', pink, { w: 2 }) + c.P(flipX('M 82 152 L 68 160 L 92 190 L 100 178 Z'), pink, { w: 2 }) +
        c.P(star5(140, 184, 7), cyan, { w: 1.8 }) + c.L('M 40 198 H 70 M 130 198 H 160', cyan, 2.4, 0.8),
      headFront: (c) => c.E(62, 98, 5, 8, pink, { w: 2 }) + c.L('M 62 106 Q 66 122 86 122', '#2a2a3a', 2.4) + c.C(87, 122, 3, '#2a2a3a', { w: 0, flat: true }) +
        c.P(star5(130, 60, 6.5), cyan, { w: 1.6 }),
    });
  },
};
DRAW_CB.luc_a = DRAW_CB.lucia;   // characterIdFor('Lucía') → 'luc_a'
DRAW_CB.min_ji = DRAW_CB.minji;  // characterIdFor('Min-ji') → 'min_ji'

// ═════════════════════════════════════════════════════════ v20 · країни c11 🇳🇴 Норвегія · c12 🇲🇽 Мексика: гіди + боси
Object.assign(CHARACTERS, {
  boss_c11: { name: 'Троль Фіордів Громле', role: 'boss', world: 'c11' },
  boss_c12: { name: 'Пернатий Змій Сонця', role: 'boss', world: 'c12' },
  ingrid: { name: 'Ingrid', role: 'guide', world: 'c11' },
  diego: { name: 'Diego', role: 'guide', world: 'c12' },
});
Object.assign(DRAW_CB, {
  boss_c11(c) { // Троль Фіордів Громле — великий кам'яно-моховий троль: ніс-картопля, ялинка в чубі, плетений шарф, руна-амулет
    const skin = '#8a9a8a', moss = '#4f8a4a', mossL = '#79b45a', scarf = '#d7263d', wool = '#f4f0e6', so = dk(skin, 0.6);
    let back = c.P('M 52 150 C 40 176 46 198 70 198 H 130 C 154 198 160 176 148 150 Z', '#6a5a46', { g: { l: 0.25, d: 0.35 } });
    let body = c.E(78, 194, 15, 7, '#5a6a5a') + c.E(122, 194, 15, 7, '#5a6a5a') +
      c.P('M 54 144 C 44 170 56 194 80 194 H 120 C 144 194 156 170 146 144 C 132 128 68 128 54 144 Z', skin, { g: { l: 0.3, d: 0.32 } }) +
      c.E(70, 176, 9, 5, moss, { w: 0, op: 0.8 }) + c.E(132, 182, 7, 4, moss, { w: 0, op: 0.8 }) + c.E(100, 172, 18, 14, '#a8b4a2', { w: 0, op: 0.6 });
    body += c.P('M 62 138 C 80 150 120 150 138 138 L 140 152 C 120 162 80 162 60 152 Z', scarf, { w: 2.2 }) +
      c.P('M 118 150 L 132 186 L 120 188 L 110 154 Z', scarf, { w: 2 }) + c.L('M 70 144 L 76 154 M 86 148 L 90 158 M 102 150 L 104 160 M 118 148 L 116 158 M 130 144 L 126 154', wool, 2.2, 0.9);
    body += c.C(100, 172, 9, '#c9d2c4', { w: 2 }) + c.L('M 100 166 V 178 M 100 168 L 105 173 M 100 168 L 95 173', '#2f6e9a', 2.2);
    let headBase = c.E(56, 88, 12, 18, skin, { a: 'transform="rotate(-20 56 88)"' }) + c.E(144, 88, 12, 18, skin, { a: 'transform="rotate(20 144 88)"' }) +
      c.P('M 58 100 C 54 64 76 46 100 46 C 124 46 146 64 142 100 C 142 126 124 140 100 140 C 76 140 58 126 58 100 Z', skin, { g: { l: 0.34, d: 0.28 } });
    headBase += c.P('M 64 70 C 66 46 88 36 100 40 C 116 34 136 46 136 70 C 128 58 116 56 108 60 C 100 52 86 54 80 62 C 74 58 68 62 64 70 Z', moss, { g: { l: 0.4, d: 0.25 } }) +
      c.C(74, 52, 5, mossL, { w: 0, flat: true }) + c.C(124, 50, 4.5, mossL, { w: 0, flat: true });
    headBase += c.P('M 100 14 L 90 34 H 96 L 88 46 H 112 L 104 34 H 110 Z', '#1e5a3e', { w: 2 }) + c.L('M 100 46 V 52', '#6a4220', 3);
    headBase += c.P('M 82 128 L 86 140 L 90 128 Z M 118 128 L 114 140 L 110 128 Z', '#fff8e8', { w: 1.6 });
    const nose = c.E(100, 106, 15, 13, '#9aaa96', { g: { l: 0.5, d: 0.3 } }) + c.hl(94, 100, 5, 3, -20, 0.6) + c.C(110, 112, 2, '#6a7a66', { w: 0, flat: true });
    const armL = 'M 58 150 Q 40 162 38 180';
    return {
      kind: 'full', ol: so, shadow: [100, 198, 64],
      back, body, headBase, headFront: nose,
      armL: c.limb(armL, skin, 14) + c.C(37, 184, 9.5, skin, { w: 2.4 }), armR: c.limb(flipX(armL), skin, 14) + c.C(163, 184, 9.5, skin, { w: 2.4 }),
      pivots: { al: [58, 150], ar: [142, 150] }, neck: [100, 138],
      eyes: [{ x: 83, y: 86, rx: 8, ry: 9, iris: '#3e86a8', side: 'l', lid: skin, lidAmt: 0.3 }, { x: 117, y: 86, rx: 8, ry: 9, iris: '#3e86a8', side: 'r', lid: skin, lidAmt: 0.3 }],
      brows: { y: 72, w: 18, col: moss, th: 5.4, lx: 83, rx: 117 },
      mouth: { x: 100, y: 126, w: 18 },
      cheeks: { pts: [[70, 110], [130, 110]], rx: 7, ry: 4, col: '#d88a8a', op: 0.4 },
      fx: { tear: [76, 98], anger: [138, 60], sweat: [144, 80], top: [100, 8], stars: [100, 2] },
      idleMouth: 'smirk', browBase: 4, poses: BOSS_POSES,
    };
  },
  boss_c12(c) { // Пернатий Змій Сонця — добрий змій-охоронець: бірюзова луска, сонячний вінець із пір'я, крила-віяла, нефритовий нашийник
    const sc = '#1fae8a', scL = '#5fd9b0', belly = '#ffe9a8', gold = '#ffc21a', jade = '#0f9d6a', so = dk(sc, 0.6);
    const ray = ['#ffc21a', '#e8336e', '#ff7a2e', '#2ec4b6', '#ffc21a', '#e8336e', '#ff7a2e', '#2ec4b6', '#ffc21a'];
    let back = '';
    ray.forEach((col, i) => { const a = -80 + i * 20; back += c.E(100, 28, 9, 26, col, { g: { l: 0.45, d: 0.25 }, a: `transform="rotate(${a} 100 92)"` }); });
    back += c.P('M 132 186 C 168 192 186 172 178 150 C 172 136 158 140 162 152 C 166 166 150 176 134 172 Z', sc, { g: { l: 0.35, d: 0.3 } }) +
      c.P('M 178 150 L 188 140 L 182 156 Z', gold, { w: 1.6 });
    let body = c.P('M 52 160 C 44 186 70 200 100 198 C 130 200 156 186 148 160 C 136 142 64 142 52 160 Z', sc, { g: { l: 0.32, d: 0.3 } }) +
      c.P('M 72 160 C 70 182 84 194 100 194 C 116 194 130 182 128 160 C 118 150 82 150 72 160 Z', belly, { w: 0, op: 0.95 }) +
      c.L('M 76 168 H 124 M 74 178 H 126 M 80 188 H 120', '#e8c27a', 2, 0.8);
    for (const [x, y] of [[60, 168], [140, 168], [64, 184], [136, 184]]) body += c.L(`M ${x - 5} ${y} Q ${x} ${y - 7} ${x + 5} ${y}`, scL, 2.2, 0.9);
    body += c.P('M 70 146 Q 100 162 130 146 L 128 154 Q 100 170 72 154 Z', gold, { w: 2 });
    for (let i = 0; i < 5; i++) body += c.C(80 + i * 10, 154 + (i === 2 ? 4 : i % 4 ? 2 : 0), 3.4, jade, { w: 1.4 });
    let headBase = c.P('M 62 98 C 58 66 80 50 100 50 C 120 50 142 66 138 98 C 138 112 132 120 124 124 C 116 132 84 132 76 124 C 68 120 62 112 62 98 Z', sc, { g: { l: 0.36, d: 0.26 } });
    headBase += c.P('M 76 108 C 84 102 116 102 124 108 C 126 124 114 134 100 134 C 86 134 74 124 76 108 Z', belly, { w: 0 }) +
      c.C(92, 112, 2.2, '#3a1630', { w: 0, flat: true }) + c.C(108, 112, 2.2, '#3a1630', { w: 0, flat: true });
    headBase += c.P('M 70 66 Q 100 52 130 66 L 128 74 Q 100 62 72 74 Z', gold, { w: 2 }) + c.C(100, 62, 5, '#e8336e', { w: 1.6 }) +
      c.L('M 72 84 Q 78 80 84 84 M 116 84 Q 122 80 128 84', scL, 2, 0.8);
    const wing = 'M 58 150 C 36 140 20 150 16 170 C 26 166 30 172 26 182 C 36 176 42 180 42 190 C 50 180 56 170 62 162 Z';
    const wingR = flipX(wing);
    const feathers = (d, x0, dir) => c.P(d, '#2ec4b6', { g: { l: 0.4, d: 0.3 } }) + c.L(`M ${x0} 160 L ${x0 - 30 * dir} 170 M ${x0} 164 L ${x0 - 22 * dir} 180`, '#ffc21a', 2.2, 0.85);
    return {
      kind: 'full', ol: so, shadow: [100, 198, 62],
      back, body, headBase,
      armL: feathers(wing, 56, 1), armR: feathers(wingR, 144, -1),
      pivots: { al: [60, 154], ar: [140, 154] }, neck: [100, 134],
      eyes: [{ x: 84, y: 92, rx: 9, ry: 10, iris: '#ff9a2a', side: 'l', lash: true, lid: sc, lidAmt: 0.32, glow: true }, { x: 116, y: 92, rx: 9, ry: 10, iris: '#ff9a2a', side: 'r', lash: true, lid: sc, lidAmt: 0.32, glow: true }],
      brows: { y: 77, w: 16, col: jade, th: 4.2, lx: 84, rx: 116 },
      mouth: { x: 100, y: 124, w: 14 },
      cheeks: { pts: [[72, 108], [128, 108]], rx: 6, ry: 3.6, col: '#ff6f9a', op: 0.45 },
      fx: { tear: [78, 102], anger: [140, 64], sweat: [144, 82], top: [100, 4], stars: [100, 0] },
      idleMouth: 'smile', browBase: 2, poses: BOSS_POSES,
    };
  },
  ingrid(c) { // 🇳🇴 Ingrid — лижниця: світла коса, в'язана шапка з помпоном, светр із «сніжинками»-візерунком, гірськолижні окуляри на шапці
    const knit = '#1f3a8a', red = '#d7263d', wool = '#f4f0e6';
    return human(c, {
      skin: '#f8dccb', hair: '#f2d488', style: 'braid', eyes: '#3a86c8', lash: true, freckles: true, outfit: knit, sleeve: knit, blush: '#ff8f9a',
      body: (c) => c.P(TORSO, knit, { g: { l: 0.3, d: 0.3 } }) +
        c.P('M 46 166 C 80 156 120 156 154 166 L 158 182 C 120 172 80 172 42 182 Z', wool, { w: 2 }) +
        [56, 76, 100, 124, 144].map((x) => c.L(`M ${x} 164 V 178 M ${x - 6} 171 H ${x + 6} M ${x - 4} 167 L ${x + 4} 175 M ${x - 4} 175 L ${x + 4} 167`, red, 1.8)).join('') +
        c.L('M 40 194 H 160', wool, 3, 0.8),
      headFront: (c) => c.P('M 62 66 C 60 40 80 28 100 28 C 120 28 140 40 138 66 Z', red, { g: { l: 0.4, d: 0.25 } }) +
        c.P('M 60 60 H 140 V 70 H 60 Z', wool, { w: 2 }) + c.L('M 66 65 H 134', red, 2.4, 0.9) + c.L('M 74 40 V 60 M 88 32 V 60 M 100 30 V 60 M 112 32 V 60 M 126 40 V 60', dk(red, 0.25), 1.6, 0.5) +
        c.C(100, 24, 8, wool, { w: 2 }) +
        c.P('M 72 50 H 128 C 130 58 124 60 116 58 H 84 C 76 60 70 58 72 50 Z', '#ff9a2a', { w: 2 }) + c.hl(90, 53, 8, 2, 0, 0.7),
    });
  },
  diego(c) { // 🇲🇽 Diego — маріачі: широке сомбреро з візерунком, чорний жакет із золотими ґудзиками, бант-краватка, вуса
    const jacket = '#22222e', gold = '#f2c14a', rose = '#e8336e';
    return human(c, {
      skin: '#c88a5e', hair: '#2a1a12', style: 'short', eyes: '#4a2a14', outfit: jacket, sleeve: jacket, blush: '#e8705a',
      body: (c) => c.P(TORSO, jacket, { g: { l: 0.3, d: 0.3 } }) + c.P('M 84 151 L 100 186 L 116 151 Z', '#ffffff', { w: 2 }) +
        c.P('M 88 156 L 100 162 L 112 156 L 112 168 L 100 162 L 88 168 Z', rose, { w: 2 }) +
        [[60, 168], [64, 182], [140, 168], [136, 182]].map(([x, y]) => c.C(x, y, 3.2, gold, { w: 1.4 })).join('') +
        c.L('M 40 196 C 60 186 76 186 86 196 M 160 196 C 140 186 124 186 114 196', gold, 2.4, 0.9),
      headBase: (c) => c.P('M 84 118 C 90 112 98 114 100 118 C 102 114 110 112 116 118 C 112 124 104 122 100 120 C 96 122 88 124 84 118 Z', '#2a1a12', { w: 1.4 }),
      headFront: (c) => c.E(100, 62, 66, 12, '#e8c27a', { g: { l: 0.4, d: 0.3 } }) + c.L('M 40 62 Q 100 80 160 62', rose, 2.6, 0.9) +
        c.P('M 72 60 C 72 30 86 18 100 18 C 114 18 128 30 128 60 Z', '#e8c27a', { g: { l: 0.4, d: 0.25 } }) +
        c.P('M 72 50 Q 100 42 128 50 L 128 58 Q 100 50 72 58 Z', rose, { w: 1.8 }) + c.L('M 76 54 l6 -4 l6 4 l6 -4 l6 4 l6 -4 l6 4 l6 -4 l6 4', gold, 1.6) +
        c.L('M 52 66 l8 -3 l8 3 M 132 66 l8 -3 l8 3', '#0f9d6a', 2),
    });
  },
});

// ═════════════════════════════════════════════════════════ v23 · країни c13 🇬🇷 Греція · c14 🇹🇭 Таїланд: гіди + боси (оригінальні)
Object.assign(CHARACTERS, {
  boss_c13: { name: 'Мінотавр Лабіринту Слів', role: 'boss', world: 'c13' },
  boss_c14: { name: 'Золотий Слон Храму', role: 'boss', world: 'c14' },
  eleni: { name: 'Eleni', role: 'guide', world: 'c13' },
  niran: { name: 'Niran', role: 'guide', world: 'c14' },
});
Object.assign(DRAW_CB, {
  boss_c13(c) { // Мінотавр Лабіринту Слів — добродушний бик-вартовий: бронзова шерсть, кремові роги, лавровий вінок, туніка з меандром, амулет-лабіринт
    const fur = '#9a5a32', furL = '#c08050', muzzle = '#e8c8a0', horn = '#f4e6c4', tunic = '#2e6ac8', bronze = '#d9a040', laurel = '#6e8f4a', so = dk(fur, 0.6);
    let back = c.P('M 50 150 C 38 176 44 198 70 198 H 130 C 156 198 162 176 150 150 Z', dk(fur, 0.2), { g: { l: 0.25, d: 0.35 } });
    let body = c.E(78, 194, 15, 7, '#4a2a18') + c.E(122, 194, 15, 7, '#4a2a18') +
      c.P('M 52 144 C 42 170 54 194 80 194 H 120 C 146 194 158 170 148 144 C 134 126 66 126 52 144 Z', fur, { g: { l: 0.3, d: 0.32 } });
    body += c.P('M 60 150 C 76 140 124 140 140 150 L 146 186 C 120 196 80 196 54 186 Z', tunic, { g: { l: 0.3, d: 0.3 } }) +
      c.L('M 58 180 h8 v-6 h-5 v3 M 74 182 h8 v-6 h-5 v3 M 90 183 h8 v-6 h-5 v3 M 106 183 h8 v-6 h-5 v3 M 122 182 h8 v-6 h-5 v3 M 138 180 h8 v-6 h-5 v3', '#ffffff', 2, 0.9) +
      c.P('M 62 146 L 128 186 L 136 178 L 72 140 Z', '#f4eedd', { w: 1.8 });
    body += c.C(100, 160, 11, bronze, { w: 2.2 }) + c.L('M 100 151 V 154 M 94 156 H 106 V 164 H 97 V 159 H 102', '#6a3a14', 1.8);
    let headBase = c.E(50, 92, 14, 8, fur, { a: 'transform="rotate(-24 50 92)"' }) + c.E(150, 92, 14, 8, fur, { a: 'transform="rotate(24 150 92)"' }) +
      c.E(48, 92, 7, 3.5, '#e8a0a0', { w: 0, a: 'transform="rotate(-24 48 92)"' }) + c.E(152, 92, 7, 3.5, '#e8a0a0', { w: 0, a: 'transform="rotate(24 152 92)"' });
    headBase += c.P('M 66 70 C 50 62 40 44 46 26 C 52 40 62 50 76 56 Z', horn, { g: { l: 0.5, d: 0.2 } }) + c.P(flipX('M 66 70 C 50 62 40 44 46 26 C 52 40 62 50 76 56 Z'), horn, { g: { l: 0.5, d: 0.2 } });
    headBase += c.P('M 62 96 C 58 64 80 48 100 48 C 120 48 142 64 138 96 C 138 122 124 138 100 138 C 76 138 62 122 62 96 Z', fur, { g: { l: 0.34, d: 0.28 } }) +
      c.P('M 84 52 C 90 60 96 58 100 66 C 104 58 110 60 116 52 C 110 46 90 46 84 52 Z', furL, { w: 0, op: 0.9 });
    headBase += [64, 74, 86, 100, 114, 126, 136].map((x, i) => c.E(x, 60 - Math.abs(3 - i) * -1.5 - (i === 3 ? 4 : 0), 6, 3, laurel, { w: 1.2, a: `transform="rotate(${(i - 3) * 22} ${x} 60)"` })).join('');
    const snout = c.P('M 74 112 C 74 100 126 100 126 112 C 128 130 116 138 100 138 C 84 138 72 130 74 112 Z', muzzle, { g: { l: 0.45, d: 0.25 } }) +
      c.E(90, 114, 3.6, 4.4, '#5a2e1e', { w: 0, flat: true }) + c.E(110, 114, 3.6, 4.4, '#5a2e1e', { w: 0, flat: true }) + c.hl(88, 106, 6, 2.4, -10, 0.55);
    const armL = 'M 56 150 Q 38 162 36 180';
    return {
      kind: 'full', ol: so, shadow: [100, 198, 64],
      back, body, headBase, headFront: snout,
      armL: c.limb(armL, fur, 14) + c.C(35, 184, 9.5, '#4a2a18', { w: 2.4 }), armR: c.limb(flipX(armL), fur, 14) + c.C(165, 184, 9.5, '#4a2a18', { w: 2.4 }),
      pivots: { al: [56, 150], ar: [144, 150] }, neck: [100, 136],
      eyes: [{ x: 82, y: 86, rx: 8, ry: 9, iris: '#3e86d8', side: 'l', lid: fur, lidAmt: 0.28 }, { x: 118, y: 86, rx: 8, ry: 9, iris: '#3e86d8', side: 'r', lid: fur, lidAmt: 0.28 }],
      brows: { y: 73, w: 17, col: dk(fur, 0.45), th: 5, lx: 82, rx: 118 },
      mouth: { x: 100, y: 128, w: 16 },
      cheeks: { pts: [[70, 104], [130, 104]], rx: 7, ry: 4, col: '#e87a6a', op: 0.4 },
      fx: { tear: [76, 98], anger: [140, 58], sweat: [146, 78], top: [100, 20], stars: [100, 14] },
      idleMouth: 'smirk', browBase: 3, poses: BOSS_POSES,
    };
  },
  boss_c14(c) { // Золотий Слон Храму — мудрий золотий слон-охоронець: вуха-віяла, хобот, червоно-золотий головний убір зі шпилем, попона з візерунком
    const gold = '#e6b422', goldL = '#ffd866', red = '#c8102e', cloth = '#7a1fa0', so = dk(gold, 0.62);
    const earL = 'M 66 80 C 34 60 14 86 20 116 C 26 140 52 146 70 128 Z';
    let back = c.P(earL, gold, { g: { l: 0.4, d: 0.3 } }) + c.P(flipX(earL), gold, { g: { l: 0.4, d: 0.3 } }) +
      c.P('M 60 88 C 40 80 30 100 34 116 C 38 132 52 134 62 124 Z', '#f2a0a0', { w: 0, op: 0.45 }) + c.P(flipX('M 60 88 C 40 80 30 100 34 116 C 38 132 52 134 62 124 Z'), '#f2a0a0', { w: 0, op: 0.45 });
    let body = c.E(76, 194, 16, 7, dk(gold, 0.35)) + c.E(124, 194, 16, 7, dk(gold, 0.35)) +
      c.P('M 50 150 C 40 176 52 196 80 196 H 120 C 148 196 160 176 150 150 C 136 132 64 132 50 150 Z', gold, { g: { l: 0.32, d: 0.3 } });
    body += c.P('M 58 148 C 80 140 120 140 142 148 L 146 180 C 120 188 80 188 54 180 Z', cloth, { g: { l: 0.3, d: 0.3 } }) +
      c.L('M 56 176 C 80 184 120 184 144 176', goldL, 3) + c.L('M 60 152 C 80 146 120 146 140 152', goldL, 3) +
      [70, 85, 100, 115, 130].map((x) => c.P(`M ${x} 158 L ${x + 5} 164 L ${x} 170 L ${x - 5} 164 Z`, goldL, { w: 1.2 })).join('') +
      [64, 80, 100, 120, 136].map((x) => c.C(x, 186, 3, red, { w: 1.2 })).join('');
    let headBase = c.P('M 64 96 C 60 64 80 48 100 48 C 120 48 140 64 136 96 C 136 118 124 132 100 132 C 76 132 64 118 64 96 Z', gold, { g: { l: 0.36, d: 0.26 } });
    headBase += c.P('M 72 66 C 80 54 120 54 128 66 L 124 74 C 110 68 90 68 76 74 Z', red, { w: 2 }) +
      c.P('M 86 58 L 92 36 L 100 22 L 108 36 L 114 58 Z', goldL, { g: { l: 0.45, d: 0.25 } }) + c.L('M 90 46 H 110 M 88 52 H 112', red, 2) + c.L('M 100 22 V 10', goldL, 3) + c.C(100, 9, 3, red, { w: 1.4 }) +
      c.C(100, 66, 5, '#2ec4b6', { w: 1.6 }) + [80, 90, 110, 120].map((x) => c.C(x, 68, 2.4, goldL, { w: 1 })).join('');
    const trunk = c.P('M 90 104 C 88 124 90 146 84 160 C 82 168 92 172 96 166 C 104 150 108 128 110 104 Z', gold, { g: { l: 0.42, d: 0.28 } }) +
      c.L('M 92 120 H 106 M 91 132 H 104 M 89 144 H 101', dk(gold, 0.3), 1.6, 0.6) +
      c.P('M 78 112 C 74 122 72 128 76 132 L 82 118 Z', '#fff8e6', { w: 1.6 }) + c.P(flipX('M 78 112 C 74 122 72 128 76 132 L 82 118 Z'), '#fff8e6', { w: 1.6 });
    const armL = 'M 56 152 Q 40 164 40 182';
    return {
      kind: 'full', ol: so, shadow: [100, 198, 66],
      back, body, headBase, headFront: trunk,
      armL: c.limb(armL, gold, 15) + c.C(40, 186, 10, dk(gold, 0.25), { w: 2.4 }), armR: c.limb(flipX(armL), gold, 15) + c.C(160, 186, 10, dk(gold, 0.25), { w: 2.4 }),
      pivots: { al: [56, 152], ar: [144, 152] }, neck: [100, 132],
      eyes: [{ x: 82, y: 90, rx: 7, ry: 8, iris: '#7a4a1e', side: 'l', lash: true, lid: gold, lidAmt: 0.34, glow: true }, { x: 118, y: 90, rx: 7, ry: 8, iris: '#7a4a1e', side: 'r', lash: true, lid: gold, lidAmt: 0.34, glow: true }],
      brows: { y: 78, w: 14, col: dk(gold, 0.45), th: 4, lx: 82, rx: 118 },
      mouth: { x: 118, y: 124, w: 10 },
      cheeks: { pts: [[72, 106], [128, 106]], rx: 7, ry: 4, col: '#ff7f9a', op: 0.45 },
      fx: { tear: [76, 100], anger: [140, 60], sweat: [146, 80], top: [100, 4], stars: [100, 0] },
      idleMouth: 'smile', browBase: 1, poses: BOSS_POSES,
    };
  },
  eleni(c) { // 🇬🇷 Eleni — археологиня: темні кучері, капелюх-панама кольору хакі з синьою стрічкою, сорочка з кишенями, синя хустинка, пензлик за вухом
    const khaki = '#c9b07a', blue = '#1e5fb8';
    return human(c, {
      skin: '#e8b890', hair: '#2a1a14', style: 'curly', eyes: '#5a3a1e', lash: true, outfit: khaki, sleeve: khaki, blush: '#e8806a',
      body: (c) => c.P(TORSO, khaki, { g: { l: 0.3, d: 0.3 } }) + c.P('M 82 151 L 100 172 L 118 151 Z', blue, { w: 2 }) +
        c.L('M 88 156 l4 4 l4 -4 l4 4 l4 -4 l4 4', '#ffffff', 1.4, 0.9) +
        c.P('M 52 170 H 72 V 186 H 52 Z M 128 170 H 148 V 186 H 128 Z', dk(khaki, 0.12), { w: 1.8 }) + c.L('M 52 175 H 72 M 128 175 H 148', dk(khaki, 0.35), 1.6) +
        c.L('M 100 172 V 204', dk(khaki, 0.35), 1.6) + c.C(100, 182, 2, '#6a5236', { w: 0 }) + c.C(100, 194, 2, '#6a5236', { w: 0 }),
      headFront: (c) => c.E(100, 58, 54, 10, khaki, { g: { l: 0.4, d: 0.3 } }) +
        c.P('M 70 58 C 70 34 84 24 100 24 C 116 24 130 34 130 58 Z', khaki, { g: { l: 0.4, d: 0.25 } }) +
        c.P('M 70 48 Q 100 42 130 48 L 130 56 Q 100 50 70 56 Z', blue, { w: 1.8 }) +
        c.L('M 136 74 L 150 54', '#8a5a30', 3.4) + c.P('M 148 50 L 156 46 L 154 56 Z', '#f2d488', { w: 1.4 }),
    });
  },
  niran(c) { // 🇹🇭 Niran — кухар вуличної їжі: коротке чорне волосся, біла пов'язка-бандана, помаранчевий фартух поверх смугастої футболки, рушник на плечі
    const shirt = '#1fa38a', apron = '#ff8a2a', band = '#ffffff';
    return human(c, {
      skin: '#d8a070', hair: '#1a1410', style: 'messy', eyes: '#3a2414', outfit: shirt, sleeve: shirt, blush: '#e8806a',
      body: (c) => c.P(TORSO, shirt, { g: { l: 0.3, d: 0.3 } }) + c.L('M 34 180 H 166 M 30 192 H 170', '#ffffff', 3, 0.5) +
        c.P('M 70 158 H 130 L 134 204 H 66 Z', apron, { g: { l: 0.3, d: 0.25 } }) + c.L('M 70 158 L 84 150 M 130 158 L 116 150', apron, 3) +
        c.P('M 86 176 H 114 V 190 H 86 Z', dk(apron, 0.15), { w: 1.6 }) + c.L('M 100 176 V 190', dk(apron, 0.4), 1.4) +
        c.P('M 40 168 C 48 156 60 152 70 154 L 66 176 C 56 176 46 178 40 168 Z', '#f4f0e6', { w: 1.8 }) + c.L('M 46 166 L 64 160 M 48 171 L 64 166', '#e8331e', 1.6, 0.8),
      headFront: (c) => c.P('M 64 66 C 74 56 126 56 136 66 L 134 76 C 120 68 80 68 66 76 Z', band, { g: { l: 0.4, d: 0.2 } }) +
        c.L('M 70 70 Q 100 62 130 70', '#e8331e', 1.8, 0.8) + c.P('M 134 70 L 148 64 L 146 80 Z M 136 72 L 150 82 L 140 86 Z', band, { w: 1.6 }),
    });
  },
});
Object.assign(DRAW, DRAW_CB);

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
// v6-perf: ці кейфрейми крутяться на HTML-шарах (div/svg) — одиниці viewBox (200) переводимо у % розміру шару
const HTML_KF = new Set(['ch-breathe', 'ch-bob', 'ch-nod', 'ch-hop', 'ch-sway', 'ch-sigh', 'ch-surp', 'ch-fume', 'ch-hurt', 'ch-wob', 'ch-wave']);
function ensureStyle() {
  if (styleDone || typeof document === 'undefined') return;
  styleDone = true;
  const vb = '.chr .ch-anim,.chr .ch-pose,.chr .ch-head,.chr .ch-headi,.chr .ch-body,.chr .ch-arm,.chr .ch-armi,.chr .ch-hand,.chr .ch-handi,.chr .ch-pend,.chr .ch-key,.chr .ch-hmin,.chr .ch-hhour,.chr .ch-orbit';
  const fb = '.chr .ch-eye,.chr .ch-eo,.chr .ch-iris,.chr .ch-brow,.chr .ch-fx,.chr .ch-spark,.chr .ch-twinkle,.chr .ch-glow';
  const mouthCss = MOUTHS.map((k) => `.chr[data-mouth=${k}] .ch-m-${k}`).join(',');
  const css = `
.chr{position:relative;display:inline-block;flex:none;line-height:0;vertical-align:bottom;--by:0;--bra:0;--al:0;--ar:0;--hr:0;--hy:0;--px:0;--py:0;--mx:0;--my:0;--mr:0;--hand:95;-webkit-user-select:none;user-select:none;pointer-events:none;contain:layout style}
.chr .ch-react{width:100%;height:100%;transition:filter .6s}
.chr .ch-vp{position:relative;width:100%;height:100%}
.chr .ch-L{position:absolute;left:0;top:0;width:100%;height:100%;display:block;overflow:visible}
.chr.chr-bust .ch-vp{overflow:hidden}
.chr.chr-flip .ch-vp{transform:scaleX(-1)}
.chr.ch-paused,.chr.ch-paused *{animation-play-state:paused!important}
${vb}{transform-box:view-box}
${fb}{transform-box:fill-box;transform-origin:center}
.chr .ch-anim,.chr .ch-pose{transform-origin:50% 98%}
.chr .ch-pose{transform:translate(calc(var(--mx)*.5%),calc(var(--my)*.5%)) rotate(calc(var(--mr)*1deg));transition:transform .45s cubic-bezier(.3,1.3,.5,1)}
.chr .ch-body{transform-origin:50% 100%;animation:ch-breathe 3.4s ease-in-out infinite}
.chr .ch-head{transform:translateY(calc(var(--hy)*.5%)) rotate(calc(var(--hr)*1deg));transition:transform .4s cubic-bezier(.3,1.4,.5,1)}
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
.chr[data-eyes=smile] .ch-eo{transform:scaleY(.82)}
.chr[data-eyes=wide] .ch-iris{transform:scale(.76)}
.chr[data-eyes=wide] .ch-lid{opacity:0}
.chr.ch-blink .ch-eo{transform:scaleY(.08)}
.chr .ch-m{opacity:0;transition:opacity .05s}
${mouthCss}{opacity:1}
.chr .ch-hand{transform:translateY(calc(var(--hand)*.5%));transition:transform .45s cubic-bezier(.3,1.4,.5,1)}
.chr .ch-handi{animation:ch-wave .45s ease-in-out infinite alternate}
.chr[data-hand=off] .ch-handi{animation-play-state:paused}
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
.chr .ch-hhour{animation:ch-spin 144s steps(720) infinite}
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
html[data-perf=lite] .chr .ch-twinkle,html[data-perf=lite] .chr .ch-glow,html[data-perf=lite] .chr .ch-spark{animation:none}
@media (prefers-reduced-motion:reduce){.chr,.chr *{animation:none!important;transition:none!important}}
`.replace(/@keyframes (ch-[\w-]+)\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g, (m, name) =>
    (HTML_KF.has(name) ? m.replace(/(-?[\d.]+)px/g, (_, n) => `${+(n / 2).toFixed(3)}%`) : m));
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
    hand = c.limb('M 152 216 L 152 176', col, 20) +
      c.P('M 141 172 C 139 156 145 147 152 147 C 160 147 165 155 163 170 C 161 179 145 181 141 172 Z', skin) +
      c.P('M 141 166 C 134 162 133 156 138 155 C 142 155 144 160 145 163 Z', skin, { w: 2.4 });
  }
  const arms = (s.armL ? `<g class="ch-arm ch-al"${org(pv.al)}><g class="ch-armi"${org(pv.al)}>${s.armL}</g></g>` : '') +
    (s.armR ? `<g class="ch-arm ch-ar"${org(pv.ar)}><g class="ch-armi"${org(pv.ar)}>${s.armR}</g></g>` : '');
  // v6-perf: шари. Безперервні рухи (дихання тулуба, похитування/кивки голови, помах руки, пози) —
  // transform на HTML-рівні (композитор), без перемальовування SVG у кожному кадрі.
  const L = (cls, inner, extra = '') => `<svg class="ch-L${cls ? ' ' + cls : ''}" viewBox="0 0 200 200" aria-hidden="true" focusable="false"${extra}>${inner}</svg>`;
  const orgP = (p) => (p ? ` style="transform-origin:${p[0] / 2}% ${p[1] / 2}%"` : '');
  return `<div class="ch-vp">` +
    L('', `<title>${name}</title><defs>${c.defs.join('')}</defs>` +
      (s.shadow ? `<ellipse class="ch-shadow" cx="${s.shadow[0]}" cy="${s.shadow[1]}" rx="${s.shadow[2]}" ry="${r1(s.shadow[2] * 0.14)}" fill="rgba(30,14,48,.22)"/>` : '')) +
    `<div class="ch-L ch-anim"><div class="ch-L ch-pose">` +
    (s.back ? L('ch-back', s.back) : '') +
    (s.backHead ? `<div class="ch-L ch-head"${orgP(neck)}><div class="ch-L ch-headi"${orgP(neck)}>${L('ch-back', s.backHead)}</div></div>` : '') +
    L('ch-body', `${s.body || ''}${arms}`) +
    `<div class="ch-L ch-head"${orgP(neck)}><div class="ch-L ch-headi"${orgP(neck)}>` +
    L('', `${s.headBase || ''}<g class="ch-cheeks">${cheeks}</g><g class="ch-eyes">${eyes}</g>${brows}<g class="ch-mouth">${mouth}</g>${s.headFront || ''}${fx.head}`) +
    `</div></div>` +
    (s.front ? L('', s.front) : '') +
    (hand ? `<div class="ch-L ch-hand"><div class="ch-L ch-handi" style="transform-origin:76% 107%">${L('', hand)}</div></div>` : '') +
    (fx.top ? L('', fx.top) : '') +
    `</div></div></div>`;
}

// ---------------------------------------------------------------- пози настроїв
const BASE = { eyes: 'open', by: 0, bra: 0, al: 0, ar: 0, hr: 0, hy: 0, px: 0, py: 0, mx: 0, my: 0, mr: 0, hand: 95 };
const MOOD = {
  idle: {},
  talk: { ar: 6 },
  happy: { eyes: 'smile', by: -3, bra: -5, al: 110, ar: 110, hand: 0, hy: -1, mouth: 'grin' },
  sad: { py: 2.5, by: 2, bra: -16, al: -8, ar: -8, hr: 4, hy: 4, my: 3, mouth: 'sad' },
  surprised: { eyes: 'wide', by: -7, bra: -4, al: 60, ar: 60, hy: -3, mouth: 'o' },
  angry: { by: 2.5, bra: 20, al: 28, ar: 28, mouth: 'angry' },
  hurt: { eyes: 'hurt', by: 1, bra: 16, al: 75, ar: 75, hr: -7, mr: -5, mouth: 'o' },
  win: { eyes: 'smile', by: -4, bra: -6, al: 150, ar: 150, hand: 0, mouth: 'grin' },
  lose: { eyes: 'open', by: 3, bra: -18, al: -10, ar: -10, hr: 9, hy: 6, mr: 4, my: 4, mouth: 'wobble' },
};
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
let seq = 0;

// ---------------------------------------------------------------- v6-perf: спільний тікер і пауза
// Один планувальник на всіх персонажів (lip-flap, кліпання): tick(now) → час наступної події;
// lip-flap кроки ~8–12/с, тож навіть під час розмови працює один setTimeout/rAF на всю сторінку.
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
  if (wait < 12 && !document.hidden) tkRaf = requestAnimationFrame(tkRun);
  else tkTmo = setTimeout(tkRun, Math.max(0, wait));
}
const VIS = new WeakMap(), ALL = new Set();
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
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { for (const i of ALL) i.syncPause(); if (!document.hidden) tkWake(); });
}

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
  let cur = 'idle', talking = false, talkT = null, lastM = '', dead = false;
  const poses = spec.poses || {};

  const defaultMouth = () => (MOOD[cur]?.mouth) || spec.idleMouth || 'smile';
  const setMouth = (m) => { if (el.dataset.mouth !== m) el.dataset.mouth = m; };

  // видимість / пауза (поза екраном або прихована вкладка)
  let visible = true, paused = false;
  const syncPause = () => {
    const pz = !visible || document.hidden;
    if (pz === paused) return;
    paused = pz;
    el.classList.toggle('ch-paused', pz);
    if (!pz) tkWake();
  };
  const inst = { setVisible(v) { visible = v; syncPause(); }, syncPause };

  const qa = (sel) => [...el.querySelectorAll(sel)];
  const N = { pose: qa('.ch-pose'), head: qa('.ch-head'), al: qa('.ch-al'), ar: qa('.ch-ar'), bl: qa('.ch-bl'), br: qa('.ch-br'), hand: qa('.ch-hand'), pup: qa('.ch-pup') };
  const T = (list, v) => { for (const n of list) if (n.style.transform !== v) n.style.transform = v; };
  let pv = BASE, pupX = null;
  const pupils = (x, y) => { const v = `translate(${x}px,${y}px)`; if (v !== pupX) { pupX = v; T(N.pup, v); } };

  function apply(m) {
    const p = { ...BASE, ...(poses.base || {}), ...MOOD[m], ...(poses[m] || {}) };
    if (m === 'idle' || m === 'talk') p.bra += spec.browBase || 0;
    el.dataset.mood = m;
    el.dataset.eyes = p.eyes;
    el.dataset.hand = p.hand > 60 ? 'off' : 'on'; // схована рука не махає
    // v6-perf: пози пишемо прямо в transform потрібних вузлів (inline), а не CSS-змінними на корені —
    // успадковані custom properties змушували перераховувати стилі всіх сотень вузлів персонажа.
    pv = p;
    T(N.pose, `translate(${p.mx * 0.5}%,${p.my * 0.5}%) rotate(${p.mr}deg)`);
    T(N.head, `translateY(${p.hy * 0.5}%) rotate(${p.hr}deg)`);
    T(N.al, `rotate(${p.al}deg)`);
    T(N.ar, `rotate(${-p.ar}deg)`);
    T(N.bl, `translateY(${p.by}px) rotate(${p.bra}deg)`);
    T(N.br, `translateY(${p.by}px) rotate(${-p.bra}deg)`);
    T(N.hand, `translateY(${p.hand * 0.5}%)`);
    pupils(p.px, p.py);
    if (!talking) setMouth(defaultMouth());
  }

  // lip-flap і кліпання — у спільному тікері
  let flapAt = 0;
  let blinkAt = performance.now() + 1800 + Math.random() * 3600, blinkOff = 0, blink2At = 0, blink2Off = 0;
  function flap(now) {
    const opts = ['a', 'o', 'e', 'closed', 'a', 'e', 'o', 'a'];
    let m;
    do m = opts[Math.floor(Math.random() * opts.length)]; while (m === lastM);
    lastM = m;
    const closed = ['smile', 'smirk', 'flat', 'sad'].includes(defaultMouth()) ? defaultMouth() : 'smile';
    if (!paused) setMouth(m === 'closed' ? closed : m);
    flapAt = now + 80 + Math.random() * 45; // ≈ 8–12 разів/с
  }
  function tick(now) {
    if (dead) { TICKS.delete(tick); return Infinity; }
    let next = Infinity;
    if (talking && !reduced()) { if (now >= flapAt) flap(now); next = flapAt; }
    if (blinkOff && now >= blinkOff) { el.classList.remove('ch-blink'); blinkOff = 0; }
    if (blink2At && now >= blink2At) { blink2At = 0; if (!paused) { el.classList.add('ch-blink'); blinkOff = now + 110; } }
    if (now >= blinkAt) {
      blinkAt = now + 1800 + Math.random() * 3600;
      if (!paused && !reduced()) {
        if (el.dataset.eyes === 'open' || el.dataset.eyes === 'wide') {
          el.classList.add('ch-blink'); blinkOff = now + 120;
          if (Math.random() < 0.2) blink2At = now + 260;
        }
        if ((cur === 'idle' || cur === 'talk') && Math.random() < 0.5) {
          pupils([-1.6, 0, 0, 1.6][Math.floor(Math.random() * 4)], pv.py);
        }
      }
    }
    return Math.min(next, blinkAt, blinkOff || Infinity, blink2At || Infinity);
  }
  function stopTalk() {
    talking = false;
    if (talkT) { clearTimeout(talkT); timers.delete(talkT); talkT = null; }
    el.dataset.talk = '0';
    setMouth(defaultMouth());
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
      if (!talking) { talking = true; flap(performance.now()); tkWake(flapAt); }
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
      TICKS.delete(tick); ALL.delete(inst); io?.unobserve(el);
      timers.forEach(clearTimeout);
      timers.clear();
      el.remove();
    },
  };
  api.set(MOOD[mood] ? mood : 'idle');
  ALL.add(inst);
  observe(el, inst);
  TICKS.add(tick);
  tkWake(blinkAt);
  return api;
}

export const CHARACTER_MOODS = MOODS;
export default createCharacter;
