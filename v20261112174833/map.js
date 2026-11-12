import { planeIntro } from './travel.js?v=20261112174832';
import * as S19 from './state.js?v=20261112174832';
// 🗺 Карта світів: вертикальна мальовнича карта, світ 1 внизу → останній у небі (v11: 8 світів).
import { h, fx, toast, pauseOffscreen } from './ui.js?v=20261112174832';
import { currentWorldId } from './state.js?v=20261112174832';
import { t, tc } from './i18n.js?v=20261112174832';
import { worldGames, gameStars } from './games.js?v=20261112174832';

import { applyWorldTheme, worldDecor, themeOf } from './theme.js?v=20261112174832';

// Острови — кожен у мові свого світу: форма основи, палітра, обвідка кольором світу (не чорна).
const ISLES = [
  // 1 Ранкова Галявина — кругла травʼяна галявина, паросток, квіти, сонечко за спиною
  (k) => `
    <g class="glow"><circle cx="150" cy="40" r="20" fill="#FFE07A" opacity=".9"/></g>
    <ellipse cx="100" cy="118" rx="84" ry="24" fill="#6CB65A" stroke="${k}" stroke-width="3.5"/>
    <rect x="16" y="104" width="168" height="14" fill="#6CB65A"/><path d="M16 104 V118 M184 104 V118" stroke="${k}" stroke-width="3.5"/>
    <ellipse cx="100" cy="104" rx="84" ry="22" fill="#A6E08A" stroke="${k}" stroke-width="3.5"/>
    <ellipse cx="78" cy="98" rx="30" ry="6" fill="#fff" opacity=".35"/>
    <g class="sway"><path d="M100 100 C100 84 100 74 100 62" stroke="${k}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M100 70 C88 56 70 58 64 66 C74 76 90 76 100 70Z" fill="#7ACB62" stroke="${k}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M100 66 C112 50 132 52 138 60 C128 72 110 72 100 66Z" fill="#8BD86F" stroke="${k}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="120" cy="58" r="3" fill="#fff"/></g>
    <g stroke="${k}" stroke-width="2.5" class="bob"><circle cx="52" cy="106" r="7" fill="#FF9EB5"/><circle cx="52" cy="106" r="2.6" fill="#FFD25A"/>
    <circle cx="140" cy="110" r="7" fill="#FFD25A"/><circle cx="140" cy="110" r="2.6" fill="#FF9F6B"/>
    <circle cx="76" cy="114" r="6" fill="#fff"/><circle cx="76" cy="114" r="2.2" fill="#FFD25A"/></g>`,
  // 2 Шепітний Ліс — мохова скеля неправильної форми, ялини, гриби, що світяться, туман
  (k) => `
    <path d="M14 108 C10 92 40 84 60 88 C80 78 120 78 140 86 C164 82 192 92 186 108 C182 128 150 134 100 134 C50 134 18 126 14 108Z" fill="#2B6A50" stroke="${k}" stroke-width="3.5"/>
    <path d="M16 104 C20 90 44 84 62 90 C84 80 120 80 140 88 C162 84 186 92 184 104 C170 112 30 114 16 104Z" fill="#46A876" stroke="${k}" stroke-width="3.5"/>
    <g stroke="${k}" stroke-width="3" stroke-linejoin="round">
      <g class="sway"><rect x="54" y="84" width="8" height="14" fill="#7A5238"/><path d="M58 28 L80 64 H70 L86 90 H30 L46 64 H36Z" fill="#2E8A62"/></g>
      <g class="sway d2"><rect x="138" y="84" width="8" height="14" fill="#7A5238"/><path d="M142 34 L162 66 H153 L168 90 H116 L131 66 H122Z" fill="#2A7D59"/></g>
      <g class="sway"><rect x="96" y="88" width="9" height="14" fill="#7A5238"/><path d="M100 10 L126 52 H114 L132 94 H68 L86 52 H74Z" fill="#38A06E"/></g>
      <rect x="168" y="96" width="5" height="10" fill="#F0E2CC"/><path d="M162 98 C162 88 179 88 179 98Z" fill="#5FE0B0"/>
      <rect x="30" y="98" width="5" height="10" fill="#F0E2CC"/><path d="M24 100 C24 90 41 90 41 100Z" fill="#E0566B"/>
    </g>
    <ellipse cx="100" cy="112" rx="70" ry="7" fill="#E6FFF3" opacity=".22" class="shimmer"/>
    <g fill="#F4FF9A" class="glow"><circle cx="34" cy="40" r="4"/><circle cx="170" cy="26" r="4"/><circle cx="128" cy="18" r="3"/><circle cx="170" cy="92" r="2"/></g>`,
  // 3 Місто Годинників — латунна шестерня-основа, ар-деко вежа з годинником, будиночки
  (k) => `
    <g class="spin-slow-g"><g transform="translate(100 112)"><polygon fill="#C98A3A" stroke="${k}" stroke-width="3.5" stroke-linejoin="round" points="${gearPts(88, 26, 16)}"/></g></g>
    <ellipse cx="100" cy="108" rx="80" ry="20" fill="#E9B44C" stroke="${k}" stroke-width="3.5"/>
    <ellipse cx="100" cy="108" rx="60" ry="12" fill="none" stroke="#B57A2A" stroke-width="2.5" stroke-dasharray="5 5"/>
    <g stroke="${k}" stroke-width="3" stroke-linejoin="round">
      <path d="M32 104 V66 H44 V58 H62 V66 H74 V104Z" fill="#B4553A"/><rect x="46" y="74" width="10" height="12" fill="#FFD27A"/>
      <path d="M126 104 V62 L146 44 L166 62 V104Z" fill="#7C3A2A"/><rect x="140" y="72" width="11" height="12" fill="#FFD27A"/>
      <path d="M80 106 V40 H86 V26 H92 V14 L101 4 L110 14 V26 H116 V40 H122 V106Z" fill="#62252A"/>
      <circle cx="101" cy="56" r="14" fill="#FBF1DD"/><path d="M101 56 L108 60" fill="none" stroke-linecap="round"/><path class="spin" d="M101 56 V46" fill="none" stroke-linecap="round"/>
      <path d="M93 106 V90 a8 8 0 0 1 16 0 V106Z" fill="#E9B44C"/>
    </g>
    <g fill="#F8E1B0" opacity=".85" class="glow"><circle cx="40" cy="40" r="3"/><circle cx="170" cy="30" r="2.5"/></g>`,
  // 4 Кришталеві Гори — гранована крижина, вершини зі снігом, кристали
  (k) => `
    <path d="M10 104 L36 88 H164 L190 104 L164 128 H36Z" fill="#8ED8FF" stroke="${k}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M10 104 L36 88 H164 L190 104Z" fill="#E9FCFF" stroke="${k}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M36 88 L56 104 H10Z M164 88 L144 104 H190Z" fill="#C8B4FF" opacity=".8"/>
    <path d="M56 104 L36 128 M144 104 L164 128 M100 104 V128" stroke="${k}" stroke-width="2" opacity=".45"/>
    <g stroke="${k}" stroke-width="3" stroke-linejoin="round">
      <path d="M26 98 L64 24 L102 98Z" fill="#5468B8"/><path d="M64 24 L76 98 H102Z" fill="#3A4E9C"/><path d="M50 52 L64 24 L78 52 L70 48 L64 56 L57 48Z" fill="#fff"/>
      <path d="M94 98 L138 32 L180 98Z" fill="#4E64B6"/><path d="M138 32 L150 98 H180Z" fill="#3A4E9C"/><path d="M125 52 L138 32 L151 52 L144 48 L138 56 L131 48Z" fill="#fff"/>
      <g class="shimmer"><path d="M82 100 L78 64 L90 50 L100 64 L96 100Z" fill="#BFF3FF"/>
      <path d="M100 100 L98 58 L110 40 L122 58 L116 100Z" fill="#8FDDFB"/>
      <path d="M116 100 L118 72 L130 62 L138 74 L132 100Z" fill="#D9C8FF"/></g>
    </g>
    <path d="M104 60 L108 54" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  // 5 Небесна Бібліотека — хмара з золотим краєм, розкрита книга, місяць і зорі
  (k) => `
    <path d="M150 20 a18 18 0 1 0 14 30 a14 14 0 1 1 -14 -30Z" fill="#FFE6A0" class="glow"/>
    <path d="M30 116 C10 116 10 90 32 90 C30 70 56 64 66 78 C72 58 104 54 112 76 C122 62 150 66 150 86 C174 82 186 108 168 116Z"
      fill="#E4E3FF" stroke="${k}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M36 110 H162" stroke="#F5C451" stroke-width="3" stroke-linecap="round" opacity=".8"/>
    <g class="bob"><g stroke="${k}" stroke-width="3" stroke-linejoin="round">
      <path d="M58 86 L100 92 L142 86 L142 92 L100 98 L58 92Z" fill="#2B2068"/>
      <path d="M62 40 Q82 34 100 44 V90 Q82 80 62 86Z" fill="#FAF1DC"/>
      <path d="M138 40 Q118 34 100 44 V90 Q118 80 138 86Z" fill="#F0E2C0"/>
    </g>
    <g stroke="#C9A35A" stroke-width="2.5" stroke-linecap="round"><path d="M70 52 L92 56 M70 62 L92 66 M70 72 L88 75 M108 56 L130 52 M108 66 L130 62 M108 75 L126 72"/></g></g>
    <g fill="#F5C451" stroke="${k}" stroke-width="2" class="glow">
      <path d="M100 6 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/><path d="M60 18 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/><path d="M36 54 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/>
    </g>`,
];
// v11: острови проміжних світів (за id світу)
const ISLES_X = {
  // v20 · Долина Повітряних Куль — клаптиковий острівець-ковдра, прив'язана велика куля з кошиком, флюгер, хмара-подушка
  w1: (k) => `
    <g class="bob"><path d="M18 30 C14 20 24 16 32 21 C46 16 70 16 84 21 C92 16 100 20 98 30 C102 38 98 44 90 42 C70 46 46 46 26 42 C18 44 14 38 18 30Z" fill="#fff" stroke="${k}" stroke-width="2.5" opacity=".95"/>
      <path d="M28 25 C46 22 70 22 88 25" fill="none" stroke="#D2CBF2" stroke-width="2" stroke-dasharray="3 3"/></g>
    <path d="M14 112 C14 98 52 88 100 88 C148 88 186 98 186 112 C186 128 148 136 100 136 C52 136 14 128 14 112Z" fill="#7EC27C" stroke="${k}" stroke-width="3.5"/>
    <path d="M16 108 C22 94 60 86 100 86 C140 86 178 94 184 108 C168 120 32 120 16 108Z" fill="#B7DD8C" stroke="${k}" stroke-width="3.5"/>
    <path d="M40 92 L58 116 C44 116 26 114 18 108 C22 100 30 95 40 92Z" fill="#F4D774"/>
    <path d="M100 86 C116 86 132 88 146 91 L130 117 C116 118 100 118 86 118Z" fill="#F2B7CB"/>
    <path d="M146 91 C164 95 180 100 184 108 C176 113 160 116 148 117 L130 117Z" fill="#9ED39A"/>
    <g fill="none" stroke="#fff" stroke-width="2.2" stroke-dasharray="4 4" stroke-linecap="round" opacity=".85"><path d="M40 92 L58 116 M100 86 L86 118 M146 91 L130 117"/></g>
    <path d="M16 108 C22 94 60 86 100 86 C140 86 178 94 184 108 C168 120 32 120 16 108Z" fill="none" stroke="${k}" stroke-width="3.5"/>
    <g stroke="${k}" stroke-width="2.6" stroke-linecap="round"><path d="M40 106 V70"/><path d="M33 80 H47" stroke-width="2"/></g>
    <g class="sway" style="transform-origin:40px 70px"><path d="M26 70 H54" stroke="${k}" stroke-width="2.6"/><path d="M58 70 L50 65 V75Z" fill="#FF5D73" stroke="${k}" stroke-width="1.6" stroke-linejoin="round"/><path d="M26 70 L21 64 H29 L32 70 L29 76 H21Z" fill="#7A6CF0" stroke="${k}" stroke-width="1.6" stroke-linejoin="round"/></g>
    <path d="M128 100 C122 86 132 76 134 70" fill="none" stroke="${k}" stroke-width="1.8" stroke-dasharray="3 3"/>
    <g class="bob" stroke="${k}" stroke-linejoin="round">
      <path d="M134 6 C114 6 104 20 104 34 C104 48 118 56 124 66 H144 C150 56 164 48 164 34 C164 20 154 6 134 6Z" fill="#FF5D73" stroke-width="3"/>
      <path d="M134 6 C124 6 119 20 119 34 C119 48 124 56 127 66 H141 C144 56 149 48 149 34 C149 20 144 6 134 6Z" fill="#FFD25A" stroke="none"/>
      <path d="M134 6 C131 6 129 20 129 34 C129 48 130 56 131 66 H137 C138 56 139 48 139 34 C139 20 137 6 134 6Z" fill="#5FC3E8" stroke="none"/>
      <path d="M134 6 C114 6 104 20 104 34 C104 48 118 56 124 66 H144 C150 56 164 48 164 34 C164 20 154 6 134 6Z" fill="none" stroke-width="3"/>
      <ellipse cx="116" cy="24" rx="4" ry="8" fill="#fff" stroke="none" opacity=".5" transform="rotate(22 116 24)"/>
      <path d="M125 66 L127 74 M143 66 L141 74" fill="none" stroke-width="1.8"/>
      <path d="M124 74 H144 L141 88 H127Z" fill="#C98B4E" stroke-width="2.5"/><path d="M126 80 H142" stroke="#9A6234" stroke-width="1.5"/></g>
    <g stroke="${k}" stroke-width="2.2"><ellipse cx="78" cy="104" rx="5" ry="6.5" fill="#EAD9AC"/><circle cx="160" cy="106" r="5" fill="#FF8FA3"/><circle cx="60" cy="120" r="4" fill="#fff"/></g>`,
  // Сонячний Берег — піщаний острівець у бірюзовій воді, пальма, парасолька, мушля
  w1b: (k) => `
    <g class="glow"><circle cx="156" cy="34" r="17" fill="#FFE07A" opacity=".9"/></g>
    <ellipse cx="100" cy="120" rx="92" ry="20" fill="#55CFDA" stroke="${k}" stroke-width="3.5"/>
    <path d="M22 118 q9 -6 18 0 t18 0 M142 124 q9 -6 18 0 t18 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8" class="shimmer"/>
    <path d="M30 110 C34 92 70 86 100 86 C132 86 166 92 170 110 C160 124 40 124 30 110Z" fill="#F6DDA3" stroke="${k}" stroke-width="3.5" stroke-linejoin="round"/>
    <ellipse cx="86" cy="98" rx="34" ry="6" fill="#fff" opacity=".4"/>
    <g class="sway"><path d="M70 102 C66 78 68 58 76 40" fill="none" stroke="${k}" stroke-width="9" stroke-linecap="round"/><path d="M70 102 C66 78 68 58 76 40" fill="none" stroke="#B98A54" stroke-width="4.5" stroke-linecap="round"/>
    <g fill="#3FB99A" stroke="${k}" stroke-width="3" stroke-linejoin="round"><path d="M76 40 C56 22 38 26 30 38 C46 34 60 36 76 40Z"/><path d="M76 40 C94 20 114 24 122 38 C106 32 92 36 76 40Z"/>
    <path d="M76 40 C66 16 50 8 36 10 C52 16 66 26 76 40Z" fill="#57C9A4"/><path d="M76 40 C84 16 100 8 112 12 C98 18 86 28 76 40Z" fill="#57C9A4"/></g></g>
    <g stroke="${k}" stroke-width="3" stroke-linejoin="round" class="bob"><path d="M134 106 V72" fill="none"/><path d="M106 76 C108 50 160 50 162 76Z" fill="#FF8E6B"/><path d="M124 76 C125 58 143 58 144 76Z" fill="#FFFDF4"/></g>
    <g stroke="${k}" stroke-width="2.5" stroke-linejoin="round"><path d="M94 112 C94 100 112 100 112 112Z" fill="#FFB7A0"/><path d="M48 106 l2.500 5 5.500 .5 -4 4 1 5.500 -5 -3 -5 3 1 -5.500 -4 -4 5.500 -.5z" fill="#FF8E6B"/></g>`,
  // v18 · Медові Соти — зелений пагорб із вуликом-скепом, будиночок-сота, соняшник, медовий струмок, бджілка
  w1c: (k) => `
    <g class="glow"><circle cx="160" cy="30" r="16" fill="#FFE07A" opacity=".9"/></g>
    <path d="M12 112 C12 96 50 86 100 86 C150 86 188 96 188 112 C188 128 150 134 100 134 C50 134 12 128 12 112Z" fill="#6BAF3A" stroke="${k}" stroke-width="3.5"/>
    <path d="M14 108 C20 92 60 84 100 84 C140 84 180 92 186 108 C170 118 30 118 14 108Z" fill="#A9D86E" stroke="${k}" stroke-width="3.5"/>
    <path d="M26 118 C60 110 90 124 120 116 C146 110 166 118 180 114" fill="none" stroke="${k}" stroke-width="8" stroke-linecap="round"/>
    <path d="M26 118 C60 110 90 124 120 116 C146 110 166 118 180 114" fill="none" stroke="#F2A818" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M40 117 q6 -3 12 0 M130 114 q6 -3 12 0" fill="none" stroke="#FFE7A3" stroke-width="2" stroke-linecap="round" class="shimmer"/>
    <g stroke="${k}" stroke-width="3" stroke-linejoin="round">
      <path d="M78 104 C74 72 86 46 104 42 C122 46 134 72 130 104Z" fill="#FFC94A"/>
      <path d="M86 62 C96 58 112 58 122 62 M80 80 C94 76 114 76 128 80" fill="none" stroke="#E59A12" stroke-width="3.5"/>
      <path d="M96 104 V96 C96 88 112 88 112 96 V104Z" fill="#6B3F18"/><path d="M72 104 H136" fill="none" stroke-width="4"/>
      ${[[38, 98], [55, 98], [46.5, 84]].map(([x, y]) => `<polygon points="${[0, 1, 2, 3, 4, 5].map((i) => { const a = (Math.PI / 180) * (60 * i - 90); return `${(x + 9.5 * Math.cos(a)).toFixed(1)},${(y + 9.5 * Math.sin(a)).toFixed(1)}`; }).join(' ')}" fill="${y < 90 ? '#F2A818' : '#FFD866'}"/>`).join('')}
    </g>
    <g class="sway"><path d="M156 104 C154 86 158 70 156 56" fill="none" stroke="${k}" stroke-width="6" stroke-linecap="round"/><path d="M156 104 C154 86 158 70 156 56" fill="none" stroke="#6BAF3A" stroke-width="3" stroke-linecap="round"/>
      <g transform="translate(156 48)" stroke="${k}" stroke-width="2" stroke-linejoin="round">${Array.from({ length: 10 }, (_, i) => `<ellipse cx="0" cy="-10" rx="3.6" ry="7" fill="#FFC21A" transform="rotate(${i * 36})"/>`).join('')}<circle r="6.5" fill="#7A4A1E"/></g></g>
    <g class="bob" transform="translate(64 40)"><ellipse cx="0" cy="-7" rx="5" ry="7" fill="#fff" opacity=".9"/><ellipse cx="0" cy="0" rx="9" ry="6.5" fill="#FFC21A" stroke="${k}" stroke-width="2"/><path d="M-3 -6 V6 M3 -6 V6" stroke="${k}" stroke-width="2.6"/><circle cx="7" cy="-1" r="1.4" fill="${k}"/></g>`,
  // Долина Вітряків — золотий пагорб, вітряк з лопатями, копиця, хмарка
  w2b: (k) => `
    <path d="M150 30 C140 30 140 18 152 18 C154 8 172 8 174 18 C186 16 190 30 180 30Z" fill="#fff" opacity=".9" class="bob"/>
    <path d="M12 112 C12 96 50 86 100 86 C150 86 188 96 188 112 C188 128 150 134 100 134 C50 134 12 128 12 112Z" fill="#D9A93F" stroke="${k}" stroke-width="3.5"/>
    <path d="M14 108 C20 92 60 84 100 84 C140 84 180 92 186 108 C170 118 30 118 14 108Z" fill="#F5DC84" stroke="${k}" stroke-width="3.5"/>
    <path d="M30 104 C60 94 90 98 120 104 M70 110 C100 102 140 104 168 108" fill="none" stroke="#D9A93F" stroke-width="2.5" stroke-linecap="round"/>
    <g stroke="${k}" stroke-width="3" stroke-linejoin="round">
      <path d="M82 104 L88 50 H112 L118 104Z" fill="#FBF3DE"/><path d="M84 52 L100 30 L116 52Z" fill="#C4503C"/>
      <path d="M95 104 V90 a5 5 0 0 1 10 0 V104Z" fill="#8A5E36"/><rect x="95" y="64" width="10" height="11" rx="2" fill="#8CCBF7"/>
      <path d="M40 104 C40 86 66 86 66 104Z" fill="#EBC65A"/><path d="M144 106 C144 92 164 92 164 106Z" fill="#EBC65A"/>
    </g>
    <g class="mill-spin"><g transform="translate(100 44)" stroke="${k}" stroke-width="2.5" stroke-linejoin="round">
      ${[0, 90, 180, 270].map((r) => `<g transform="rotate(${r + 20})"><path d="M0 0 V-40" fill="none" stroke-width="3.5"/><path d="M2 -40 H14 V-12 H2Z" fill="#FFE68A"/></g>`).join('')}<circle r="4.5" fill="#C4503C"/></g></g>`,
  // Порт Ліхтарів — причал на палях, маяк із променем, кораблик, ліхтарі
  w3b: (k) => `
    <path d="M128 30 L20 6 V44Z" fill="#FFE1A0" opacity=".5"/>
    <ellipse cx="100" cy="120" rx="92" ry="19" fill="#2A4686" stroke="${k}" stroke-width="3.5"/>
    <path d="M20 122 q9 -6 18 0 t18 0 M146 126 q9 -6 18 0 t18 0" fill="none" stroke="#FFD9A0" stroke-width="3" stroke-linecap="round" opacity=".7" class="shimmer"/>
    <g stroke="${k}" stroke-width="3.5" stroke-linecap="round"><path d="M52 104 V124 M100 106 V128 M150 104 V124"/></g>
    <path d="M30 96 H172 L164 110 H38Z" fill="#8A6844" stroke="${k}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M30 96 H172 L169 101 H33Z" fill="#B58C5E"/><path d="M70 97 L72 110 M104 97 V110 M138 97 L136 110" stroke="${k}" stroke-width="2" opacity=".5"/>
    <g stroke="${k}" stroke-width="3" stroke-linejoin="round">
      <path d="M116 98 L121 40 H137 L142 98Z" fill="#FBF3DE"/><path d="M119.500 62 H138.500 L140 80 H118Z" fill="#C4503C"/>
      <rect x="121" y="24" width="16" height="16" fill="#FFD27A"/><path d="M117 24 L129 10 L141 24Z" fill="#27407A"/><path d="M116 40 H142" fill="none"/>
      <g class="bob"><path d="M40 82 H84 L78 94 H46Z" fill="#16224A"/><path d="M62 82 V50" fill="none"/><path d="M65 54 C80 60 82 72 66 80Z" fill="#F4E6C8"/><path d="M59 58 C48 64 48 74 59 80Z" fill="#E3D2AE"/></g>
      <path d="M160 98 V76" fill="none"/><circle cx="160" cy="72" r="6" fill="#FFC65A"/>
    </g>
    <g fill="#FFE7B0" class="glow"><circle cx="160" cy="72" r="2.5"/><circle cx="36" cy="30" r="2.5"/><circle cx="176" cy="40" r="2"/><circle cx="84" cy="16" r="2"/></g>`,
  // Туманні Острови — острівець зі стародавньою аркою, поруч виринає кит
  w4b: (k) => `
    <ellipse cx="100" cy="120" rx="92" ry="19" fill="#5E8A98" stroke="${k}" stroke-width="3.5"/>
    <path d="M20 122 q9 -5 18 0 t18 0 M146 126 q9 -5 18 0 t18 0" fill="none" stroke="#E8F2F6" stroke-width="3" stroke-linecap="round" opacity=".7" class="shimmer"/>
    <g stroke="${k}" stroke-width="3.5" stroke-linejoin="round">
      <path d="M22 116 C26 92 40 80 60 78 C76 70 100 72 112 84 C124 88 132 100 136 116Z" fill="#7C889A"/>
      <path d="M50 84 V44 C50 26 62 16 76 16 C90 16 102 26 102 44 V84 H90 V46 C90 36 84 30 76 30 C68 30 62 36 62 46 V84Z" fill="#C2CAD6"/>
      <path d="M110 86 V60 H120 V86Z" fill="#A4AEBE" stroke-width="3"/>
      <path d="M140 112 C146 100 160 94 176 96 C184 92 190 86 196 84 C194 92 192 98 196 106 C188 104 182 104 178 106 C170 116 150 118 140 112Z" fill="#4E667C"/>
    </g>
    <path d="M70 17 L72 30 M82 17 L80 30" stroke="${k}" stroke-width="2"/>
    <circle cx="150" cy="106" r="2.2" fill="#EEF2F8"/>
    <path d="M160 92 C160 84 154 80 150 82 M160 92 C162 84 168 81 172 84" fill="none" stroke="#EEF2F8" stroke-width="2.5" stroke-linecap="round" class="glow"/>
    <g class="bob"><path d="M6 96 C26 86 54 92 80 94 C104 88 130 92 150 98 C120 106 36 108 6 96Z" fill="#EEF2F8" opacity=".8"/></g>
    <g fill="#BFF0EA" class="glow"><circle cx="76" cy="60" r="2.5"/><circle cx="36" cy="30" r="2.5"/><circle cx="130" cy="40" r="2"/><circle cx="168" cy="62" r="2"/></g>`,
  // ✈️ Аеропорт (v19.1) — термінал, злітна смуга, літак, диспетчерська вежа, вітроуказ
  air: (k) => `
    <ellipse cx="100" cy="122" rx="96" ry="20" fill="#7FB3D8" stroke="${k}" stroke-width="3.5"/>
    <path d="M14 124 q9 -5 18 0 t18 0 M150 128 q9 -5 18 0 t18 0" fill="none" stroke="#EAF6FF" stroke-width="3" stroke-linecap="round" opacity=".7" class="shimmer"/>
    <path d="M10 114 C18 92 58 84 100 84 C142 84 182 92 190 114 C156 126 44 126 10 114Z" fill="#8CC66A" stroke="${k}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M22 114 L46 102 H178 L182 114Z" fill="#5C6470" stroke="${k}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M60 108 H72 M86 108 H98 M112 108 H124 M138 108 H150 M164 108 H172" stroke="#FFF4C8" stroke-width="2.5" stroke-linecap="round"/>
    <g fill="#FFD25A" class="glow"><circle cx="50" cy="104" r="1.8"/><circle cx="178" cy="104" r="1.8"/><circle cx="26" cy="113" r="1.8"/><circle cx="181" cy="113" r="1.8"/></g>
    <g stroke="${k}" stroke-width="3" stroke-linejoin="round">
      <path d="M18 98 V70 C18 62 28 58 46 58 C64 58 74 62 74 70 V98Z" fill="#F4EEE2"/>
      <path d="M24 70 H68 V82 H24Z" fill="#8CCBF7" stroke-width="2.5"/><path d="M40 98 V88 H52 V98Z" fill="#C4503C" stroke-width="2.5"/>
      <path d="M90 98 V50 H102 V98Z" fill="#E8E2D6"/><path d="M84 50 L88 34 H104 L108 50Z" fill="#8CCBF7"/><path d="M86 34 H106 L102 27 H90Z" fill="#C4503C"/>
      <path d="M118 98 V80 C118 70 128 66 140 66 C152 66 162 70 162 80 V98Z" fill="#D8DEE6"/><path d="M128 98 V84 H152 V98" fill="#8A93A0" stroke-width="2.5"/>
      <path d="M176 98 V66" fill="none"/>
    </g>
    <path d="M96 27 V20" stroke="${k}" stroke-width="2.5"/><circle cx="96" cy="19" r="2.4" fill="#FF5A4A" class="glow"/>
    <g class="bob"><path d="M177 67 L196 70 L194 78 L177 76Z" fill="#F08A3C" stroke="${k}" stroke-width="2.5" stroke-linejoin="round"/><path d="M184 68 V76.700 M190 69 V77.500" stroke="#FFF" stroke-width="2.5"/></g>
    <g class="bob" style="animation-delay:-1.2s"><g transform="translate(150 30) rotate(-12) scale(.78)" stroke="${k}" stroke-width="3" stroke-linejoin="round">
      <path d="M-30 0 C-30 -6 -20 -8 0 -8 H22 C30 -8 34 -4 34 0 C34 4 30 6 22 6 H-22 C-28 6 -30 4 -30 0Z" fill="#FFFFFF"/>
      <path d="M-4 -2 L-16 -24 H-8 L10 -2Z M-4 4 L-14 22 H-6 L10 4Z" fill="#4A8FD8"/><path d="M-30 0 L-36 -16 H-28 L-20 -6Z" fill="#C4503C"/>
      <path d="M14 -4 H28" stroke="#8CCBF7" stroke-width="3.5" stroke-linecap="round"/></g></g>
    <g fill="#FFFFFF" class="glow"><circle cx="60" cy="38" r="2.2"/><circle cx="30" cy="30" r="2"/><circle cx="186" cy="20" r="2"/></g>`,};
// базові острови: за id світу (до v11 — за індексом)
const ISLE_BY_ID = { w0: 0, w2: 1, w3: 2, w4: 3, w5: 4 };
const isleArt = (wid, i) => ISLES_X[wid] || ISLES[ISLE_BY_ID[wid] ?? (i % ISLES.length)] || ISLES[0];
function gearPts(r, rIn, teeth) {
  const pts = [];
  const n = teeth * 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = (i % 4 < 2) ? r : r * 0.88;
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr * 0.28).toFixed(1)}`);
  }
  return pts.join(' ');
}

// v19.1: власна смуга-фон аеропорту (світанкове небо, термінал, вогні смуги, літачок)
function airDecor() {
  const d = h('div', { class: 'w-decor air-decor', 'aria-hidden': 'true' });
  d.innerHTML = `<i class="ad-sun"></i><i class="ad-cloud c1"></i><i class="ad-cloud c2"></i><i class="ad-cloud c3"></i>
    <svg class="ad-city" viewBox="0 0 400 60" preserveAspectRatio="none"><path d="M0 60 V44 H30 V36 H70 V44 H96 V30 C110 20 150 20 164 30 V44 H190 V24 H198 V14 H206 V24 H214 V44 H240 V34 C252 26 284 26 296 34 V44 H330 V38 H372 V44 H400 V60Z" fill="#7C8CB4" opacity=".55"/></svg>
    <i class="ad-ground"></i><span class="ad-lights">${'<i></i>'.repeat(9)}</span>
    <span class="ad-fly"><i class="ad-trail"></i><b>✈️</b></span>`;
  return d;
}

const LAYOUT = [0.3, 0.7, 0.32, 0.68, 0.3, 0.7, 0.34, 0.5]; // x-позиція (частка ширини) для світів 1..8 (v11)
const GAP = 238;
const TOP = 150;
const BOTTOM = 190;

export function render(root, params, app) {
  const st = app.state;
  const worlds = app.content.WORLDS;
  const cur = currentWorldId(st);
  // v19.1: острів-світ «✈️ Аеропорт» — окремий слот на стежці між w3 і w3b
  const AIR = { id: 'air', air: true };
  const slots = [...worlds];
  const w3i = slots.findIndex((w) => w.id === 'w3');
  slots.splice(w3i >= 0 ? w3i + 1 : slots.length, 0, AIR);
  const n = slots.length;
  const sIdx = (wid) => Math.max(0, slots.findIndex((w) => w.id === wid));
  const height = TOP + (n - 1) * GAP + BOTTOM;

  const map = h('div', { class: 'map', style: { height: height + 'px' } });
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  path.setAttribute('class', 'map-path');
  path.setAttribute('aria-hidden', 'true');
  map.append(
    h('div', { class: 'map-deco', 'aria-hidden': 'true' },
      // смуги-світи: кожен острів стоїть у фоні свого світу; смуги м'яко перетікають одна в одну
      slots.map((w, i) => {
        const band = h('div', { class: 'map-band', style: { top: `${TOP + (n - 1 - i) * GAP - GAP * 0.62}px`, height: `${GAP * 1.5}px` } });
        band.append(w.air ? airDecor() : worldDecor(w.id, { particles: true, count: 6 }));
        return band;
      })),
    path,
    h('h1', { class: 'map-title title-sticker', text: t('map.title') }));

  const pos = (i) => ({ x: LAYOUT[i % LAYOUT.length], y: TOP + (n - 1 - i) * GAP });
  let lumiBox = null;

  try { if (S19.isAdmin()) S19.syncCountries(app.state); } catch (e) { /* */ }
  const tOpen = S19.travelOpen(app.state);
  const cl = S19.countryList();
  const cDone = cl.filter((c) => S19.countryDone(app.state, c.id)).length;
  slots.forEach((w, i) => {
    if (w.air) {
      const p = pos(i);
      const art = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      art.setAttribute('viewBox', '0 0 200 150');
      art.setAttribute('class', 'isle-art');
      art.innerHTML = ISLES_X.air(themeOf('w3').ink);
      const name = app.lang === 'ru' ? 'Аэропорт' : 'Аеропорт';
      const isle = h('button', {
        class: `isle isle-air${tOpen ? '' : ' locked'}`, type: 'button', data: { sfx: tOpen ? 'open' : 'none' },
        style: { left: `${p.x * 100}%`, top: `${p.y}px`, '--d': `${i * -0.9}s`, '--n': n - 1 - i },
        'aria-label': `✈️ ${name}${tOpen ? '' : t('map.closedAria')}`,
        on: {
          click: () => {
            if (!tOpen) { app.tg.notify('warning'); app.audio.sfx('wrong'); fx.shake(isle); toast(t('travel.teaser'), 4200); return; }
            app.tg.tap('medium');
            planeIntro(app).then(() => app.go('globe'));
          },
        },
      },
      h('span', { class: 'isle-float' }, art,
        !tOpen ? h('span', { class: 'isle-fog', 'aria-hidden': 'true' }, h('b', { text: '🔒' })) : null),
      h('span', { class: 'isle-label' },
        h('span', { class: 'isle-num', text: String(i + 1) }),
        h('span', { class: 'isle-name' }, h('b', { text: name }),
          tOpen ? h('span', { class: 'isle-meta isle-prog' },
            h('span', { text: `${app.lang === 'ru' ? 'Стран' : 'Країн'} ${cDone}/${cl.length || 10}` }),
            h('span', { class: 'isle-bar', 'aria-hidden': 'true' }, h('i', { style: { transform: `scaleX(${cDone / (cl.length || 10)})` } })))
            : h('span', { class: 'isle-meta', text: t('map.closed') }))));
      applyWorldTheme(isle, 'w3');
      map.append(isle);
      return;
    }
    const open = st.unlocked.includes(w.id);
    const games = worldGames(w.id);
    const got = games.reduce((a, g) => a + gameStars(st, g.id), 0);
    const total = games.length * 3;
    const badge = st.badges.includes(w.id);
    const byTest = st.by_test.includes(w.id);
    const p = pos(i);
    const art = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    art.setAttribute('viewBox', '0 0 200 150');
    art.setAttribute('class', 'isle-art');
    art.innerHTML = isleArt(w.id, i)(themeOf(w.id).ink);
    const status = !open ? h('span', { class: 'isle-meta', text: t('map.closed') })
      : h('span', { class: 'isle-meta isle-prog' },
        h('span', { text: `⭐ ${got}/${total}${badge ? ' 🏅' : byTest ? ' 📘' : ''}` }),
        h('span', { class: 'isle-bar', 'aria-hidden': 'true' }, h('i', { style: { transform: `scaleX(${total ? got / total : 0})` } })));
    const isle = h('button', {
      class: `isle${open ? '' : ' locked'}${w.id === cur ? ' current' : ''}`,
      type: 'button', data: { sfx: open ? 'open' : 'none' },
      style: { left: `${p.x * 100}%`, top: `${p.y}px`, '--d': `${i * -0.9}s`, '--n': n - 1 - i },
      'aria-label': `${tc(w, 'name')}, ${w.level}${open ? '' : t('map.closedAria')}`,
      on: {
        click: () => {
          if (!open) {
            app.tg.notify('warning');
            app.audio.sfx('wrong');
            fx.shake(isle);
            toast(t('map.sleeps'));
            return;
          }
          app.tg.tap('medium');
          app.go('world', { wid: w.id });
        },
      },
    },
    h('span', { class: 'isle-float' },
      art,
      !open ? h('span', { class: 'isle-fog', 'aria-hidden': 'true' }, h('b', { text: '🔒' })) : null,
      w.id === cur ? (lumiBox = h('span', { class: 'isle-lumi' })) : null),
    h('span', { class: 'isle-label' },
      h('span', { class: 'isle-num', text: String(i + 1) }),
      h('span', { class: 'isle-name' }, h('b', { text: tc(w, 'name') }), status)));
    isle.style.setProperty('--d', `${i * -0.9}s`);
    isle.style.setProperty('--n', n - 1 - i);
    applyWorldTheme(isle, w.id);
    map.append(isle);
  });

  const wrap = h('div', { class: 'map-wrap' }, map,
    h('p', { class: 'map-legend', text: t('map.legend') }));
  root.append(wrap);

  // стежка між островами — у пікселях, щоб пунктир не розтягувався
  const drawPath = () => {
    const W = map.clientWidth;
    path.setAttribute('viewBox', `0 0 ${W} ${height}`);
    path.setAttribute('width', W);
    path.setAttribute('height', height);
    const pts = slots.map((_, i) => { const p = pos(i); return [p.x * W, p.y + 70]; });
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i];
      const my = (y0 + y1) / 2;
      d += ` C${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`;
    }
    // відкрита частина стежки — золота, закрита — бліда
    const openIdx = sIdx(cur);
    let dOpen = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i <= openIdx; i++) {
      const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i];
      const my = (y0 + y1) / 2;
      dOpen += ` C${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`;
    }
    path.innerHTML = `<path d="${d}" class="trail-bg"/><path d="${d}" class="trail-dash"/>` +
      (openIdx > 0 ? `<path d="${dOpen}" class="trail-open"/>` : '');
  };
  drawPath();
  const ro = new ResizeObserver(drawPath);
  ro.observe(map);

  if (lumiBox) {
    const lumi = app.makeLumi(lumiBox, { size: 78, emotion: 'hello', bubble: ((x) => (x > 0.5 ? 'left' : x < 0.5 ? 'right' : 'top'))(LAYOUT[sIdx(cur) % LAYOUT.length]) });
    const cw = app.world(cur);
    setTimeout(() => lumi.say(cw ? t('map.here', { name: tc(cw, 'name') }) : t('map.fly')), 700);
  }

  // прокрутити до поточного світу
  const ci = sIdx(cur);
  requestAnimationFrame(() => {
    const y = pos(ci).y + 80 - root.clientHeight / 2;
    root.scrollTop = Math.max(0, Math.min(y, root.scrollHeight));
  });

  // v6: смуги світів і острови поза екраном — анімації на паузі
  const unPause = pauseOffscreen([...map.querySelectorAll('.map-band, .isle')], root, { delay: 1700 });

  return () => { ro.disconnect(); unPause(); };
}
