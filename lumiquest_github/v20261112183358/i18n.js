// i18n.js — мова інтерфейсу LumiQuest (uk | ru). Контракт v7 (WEBAPP_SPEC.md):
//
//   t(key, vars?)      рядок інтерфейсу поточною мовою: t('home.continue'), t('quest.xp', { n: 10 })
//                      значення-масив [one, few, many] — множина за vars.n: t('plural.days', { n })
//                      невідомий ключ → український рядок (якщо є) → сам ключ (сумісність: t('Український текст'))
//   lang()             'uk' | 'ru'
//   setLang(l)         зберігає в state.settings.lang (через bindState) + localStorage, подія window 'langchange'
//   tc(obj, field)     поле контенту: ru і є obj[field + '_ru'] → воно, інакше obj[field]
//   tw(wid)            пари слів світу [[ru|uk, en], …] (WORDS_RU / WORDS)
//   addStrings({uk:{…}, ru:{…}})   злиття словників (агент режимів, ключі 'mode.*')
//   addRu({ 'укр. рядок': 'рус. строка' })   сумісність: переклад «сирих» українських рядків
//   plural(n, one, few, many)       однакові правила для uk і ru
//
// Мова за замовчуванням — збережена (localStorage 'lq_lang'), інакше Telegram language_code (ru → ru, інакше uk).

const KEY = 'lq_lang';
const fill = (s, p) => (p ? String(s).replace(/\{(\w+)\}/g, (m, k) => (k in p ? String(p[k]) : m)) : String(s));

export function plural(n, one, few, many) {
  n = Math.abs(n | 0);
  if (n % 10 === 1 && n % 100 !== 11) return one;
  if (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) return few;
  return many;
}

let LANG = 'uk';
try { LANG = localStorage.getItem(KEY) || ''; } catch { /* */ }
if (LANG !== 'uk' && LANG !== 'ru') {
  const code = (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code) || '';
  LANG = String(code).toLowerCase().startsWith('ru') ? 'ru' : 'uk';
}

export const LANGS = { uk: { name: 'Українська', flag: '🇺🇦' }, ru: { name: 'Русский', flag: '🇷🇺' } };
export const lang = () => LANG;
/** Чи гравець уже обирав мову. */
export function langChosen() { try { return !!localStorage.getItem(KEY); } catch { return false; } }

let stateRef = null;
/** app.js: дати i18n доступ до стану (setLang пише state.settings.lang і зберігає). */
export function bindState(getState, save) { stateRef = { getState, save }; }
/** v22: поточний стан (для state.js calm()/isFormal()). */
export function liveState() { try { return stateRef ? stateRef.getState() : null; } catch { return null; } }
/** v22: звертання «на ви» (state.formal). */
export const formal = () => !!(liveState() || {}).formal;

export function setLang(l, { persist = true, silent = false } = {}) {
  if (l !== 'uk' && l !== 'ru') return;
  const changed = l !== LANG;
  LANG = l;
  if (persist) { try { localStorage.setItem(KEY, l); } catch { /* */ } }
  if (typeof document !== 'undefined') document.documentElement.lang = l;
  if (stateRef) {
    try {
      const st = stateRef.getState();
      if (st) {
        st.settings = st.settings || {};
        if (st.settings.lang !== l) { st.settings.lang = l; stateRef.save && stateRef.save(); }
      }
    } catch { /* */ }
  }
  if (changed && !silent && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: l } }));
}

// ── контент
let C = null;
export function setContent(content) { C = content || null; }
export function tc(obj, field) {
  if (!obj) return '';
  if (LANG === 'ru') {
    const v = obj[field + '_ru'];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return obj[field];
}
export function tw(wid) {
  const base = (C && C.WORDS && C.WORDS[wid]) || [];
  if (LANG === 'ru' && C && C.WORDS_RU && Array.isArray(C.WORDS_RU[wid]) && C.WORDS_RU[wid].length) return C.WORDS_RU[wid];
  return base;
}

// ── словники
const RAW_RU = Object.create(null);
export function addRu(dict) { Object.assign(RAW_RU, dict || {}); }
export function addStrings(d) {
  if (!d) return;
  if (d.uk) Object.assign(DICT.uk, d.uk);
  if (d.ru) Object.assign(DICT.ru, d.ru);
  if (d.uk_vy) Object.assign(DICT_VY_uk, d.uk_vy);   // v22: «ви»-варіанти (ключі ті самі)
  if (d.ru_vy) Object.assign(DICT_VY_ru, d.ru_vy);
  VY_CACHE.clear();
}

// ── v22: звертання «на ви». Явні варіанти — DICT_VY_uk/ru (і uk_vy/ru_vy з addStrings);
//    для решти рядків — автоматична заміна «ти»-форм (займенники, наказовий спосіб, 2-га особа).
const DICT_VY_uk = Object.create(null);
const DICT_VY_ru = Object.create(null);
const VY_CACHE = new Map();
const PRON = {
  uk: { 'ти': 'ви', 'тебе': 'вас', 'тобі': 'вам', 'тобою': 'вами', 'твій': 'ваш', 'твоя': 'ваша', 'твоє': 'ваше', 'твої': 'ваші',
    'твого': 'вашого', 'твоєї': 'вашої', 'твоїх': 'ваших', 'твоїм': 'вашим', 'твоїми': 'вашими', 'твою': 'вашу', 'твоєму': 'вашому', 'твоїй': 'вашій' },
  ru: { 'ты': 'вы', 'тебя': 'вас', 'тебе': 'вам', 'тобой': 'вами', 'твой': 'ваш', 'твоя': 'ваша', 'твоё': 'ваше', 'твое': 'ваше', 'твои': 'ваши',
    'твоего': 'вашего', 'твоей': 'вашей', 'твоих': 'ваших', 'твоим': 'вашим', 'твоими': 'вашими', 'твою': 'вашу', 'твоему': 'вашему' },
};
// наказовий спосіб (однина) — список слів, що трапляються в UI
const IMP = {
  uk: 'вгадай грай заходь заходи збирай напиши пиши обирай обери вибирай вибери слухай послухай спробуй сяй тапай тапни тапи тримай тримайся утримуй шукай вивчи відкривай відповідай давай дай думай затискай запамʼятай запамʼятовуй здай керуй друкуй веслуй влучай оглушай оглушуй оминай перемагай переможи плутай порівнюй прочитай читай пробігай промовляй підпускай рахуй складай склади скинь торкнись хапай чіпай біжи дивись включи увімкни введи пливи пройди проходи скажи тисни злови лови встигни загляни зазирни збери знайди йди натисни обходи повтори стрибни уяви готуйся хвилюйся відбивайся відбийся нахиляйся нахилися вклоняйся відмовляйся барися звертай повертайся поверни постав став перетягни тягни кинь кидай обирайте почни починай зроби назви вимов промов говори скажи вчи пам\'ятай памʼятай запам\'ятай запам\'ятовуй глянь подивись перевір спитай пиши натискай торкайся відкрий зайди грайся годуй погодуй погладь доторкнись крути',
  ru: 'бей выбирай выбери держи держись играй ищи запоминай запомни нажимай нажми жми попробуй поймай лови расставь слушай послушай собирай собери составь угадай угадывай удерживай сияй исправь отвечай ответь открывай открой печатай побеждай победи подпускай попадай проверь проговаривай пробегай путай представь сбрось сдай считай теряй трогай успей хватай коснись наклонись наклоняйся введи иди найди плыви повтори произнеси пройди проходи прыгни сравни смотри посмотри напиши пиши скажи включи заходи читай прочитай бери грей дай давай думай подай тапай тапни готовься волнуйся отбивайся отбейся кланяйся отказывайся поверни поставь перетащи тащи кинь бросай начни начинай сделай назови говори учи помни глянь проверь спроси нажимай коснись открой зайди корми покорми погладь потрогай беги выучи загляни крути',
};
const IMP_SET = { uk: new Set(IMP.uk.split(' ').map((w) => w.replace(/'/g, 'ʼ'))), ru: new Set(IMP.ru.split(' ')) };
const UK_NOT2SG = new Set(['наш', 'ваш', 'фініш', 'програш', 'кеш', 'душ', 'гуляш', 'сквош', 'реванш', 'малюк', 'ковш', 'шалаш', 'краш', 'крэш', 'лиш', 'лише', 'кіш', 'миш', 'тиш', 'гуаш', 'малыш', 'финиш', 'проигрыш']);
function vyWord(w, L) {
  const lw = w.toLowerCase().replace(/'/g, 'ʼ');
  let r = null;
  if (lw === 'сбрось') r = 'сбросьте';
  else if (PRON[L][lw]) r = PRON[L][lw];
  else if (IMP_SET[L].has(lw)) {
    if (L === 'uk') r = /ся$/.test(lw) ? lw.replace(/(и)?ся$/, (m, i) => (i ? 'іться' : 'теся')) : /сь$/.test(lw) ? lw.replace(/сь$/, '').replace(/и$/, '') + 'іться' : /и$/.test(lw) ? lw.slice(0, -1) + 'іть' : lw + 'те';
    else r = /ся$/.test(lw) ? lw.replace(/ся$/, 'тесь') : /сь$/.test(lw) ? lw.slice(0, -2) + 'тесь' : lw + 'те';
  } else if (!UK_NOT2SG.has(lw)) {
    // 2-га особа однини теперішнього/майбутнього часу
    if (L === 'uk') {
      if (/(шся)$/.test(lw)) r = lw.replace(/шся$/, 'теся');
      else if (/[еєиії]ш$/.test(lw) && lw.length > 3) r = lw.slice(0, -1) + 'те';
      else if (lw === 'відповіси') r = 'відповісте';
    } else if (/шь(ся)?$/.test(lw) && lw.length > 3) r = lw.replace(/шь(ся)?$/, (m, s) => (s ? 'тесь' : 'те'));
  }
  if (!r) return w;
  if (w[0] !== w[0].toLowerCase()) r = r[0].toUpperCase() + r.slice(1);
  if (w.length > 1 && w === w.toUpperCase()) r = r.toUpperCase();
  return r;
}
/** v22: «ви»-обгортка для екранів із власними словниками: vy(рядок|масив, ключ?) — при formal явний DICT_VY або toVy. */
export function vy(s, key) {
  if (!formal() || s == null) return s;
  const dv = LANG === 'ru' ? DICT_VY_ru : DICT_VY_uk;
  if (key && key in dv) return dv[key];
  return Array.isArray(s) ? s.map((x) => toVy(x)) : toVy(s);
}
/** Автоматичний «ви»-варіант рядка (для uk/ru). */
export function toVy(s, L = LANG) {
  if (typeof s !== 'string' || !s) return s;
  return s.replace(/[А-Яа-яІіЇїЄєҐґЁё][А-Яа-яІіЇїЄєҐґЁёʼ']*/g, (w, o, str) => (str[o + w.length] === '-' ? w : vyWord(w, L)));
}
function vyOf(key, base) {
  const dv = LANG === 'ru' ? DICT_VY_ru : DICT_VY_uk;
  if (key in dv) return dv[key];
  const ck = LANG + '\u0000' + key + '\u0000' + (Array.isArray(base) ? base.join('\u0001') : base);
  if (VY_CACHE.has(ck)) return VY_CACHE.get(ck);
  const v = Array.isArray(base) ? base.map((x) => toVy(x)) : toVy(base);
  VY_CACHE.set(ck, v);
  return v;
}
export function has(key) { return key in DICT.uk || key in DICT[LANG]; }

export function t(key, vars) {
  let v = DICT[LANG][key];
  if (v === undefined) v = DICT.uk[key];
  if (v === undefined) v = LANG === 'ru' && RAW_RU[key] != null ? RAW_RU[key] : key;
  if ((typeof v === 'string' || Array.isArray(v)) && formal()) v = vyOf(key, v);
  if (Array.isArray(v)) v = plural(vars && vars.n !== undefined ? vars.n : 0, v[0], v[1], v[2]);
  return fill(v, vars);
}

/** Файл контенту (переклад — поля *_ru у тому самому content.json). */
export const contentFile = () => 'content.json';

// ───────────────────────────────────────────────────────────────────────── UK
const UK = {
  // v22: звертання і спокійний режим
  'onb.addrTitle': 'Як до вас звертатися?',
  'onb.addrSay': 'Як вам зручніше? 🙂',
  'onb.addrTy': 'На «ти»', 'onb.addrTySub': 'Просто й по-дружньому',
  'onb.addrVy': 'На «ви»', 'onb.addrVySub': 'Ввічливо, як до дорослого',
  'onb.addrTyOk': 'Домовились, на «ти»! 💛', 'onb.addrVyOk': 'Домовились, на «ви» 💛',
  'set.formal': '🎩 Звертання на «ви»', 'set.formalSub': 'Лумі звертатиметься ввічливо',
  'set.calm': 'Спокійний режим 🐢', 'set.calmSub': 'Без поспіху й таймерів',
  'app.title': 'LumiQuest — англійська з Лумі',
  'app.loading': 'Лумі запалює ліхтарики…',
  'app.bootFail': 'Ой, не вдалося завантажити гру. Перевір інтернет і відкрий ще раз 🌙',
  'common.friend': 'друже',
  'common.lumi': 'Лумі',
  'common.yes': 'Так',
  'common.cancel': 'Скасувати',
  'common.back': 'Назад',
  'common.next': 'Далі',
  'common.ok': 'Зрозуміло!',
  'common.starsOf': '{n} з {total} зірок',
  'common.on': 'Увімк.',
  'common.off': 'Вимк.',
  'plural.days': ['день', 'дні', 'днів'],
  'plural.words': ['слово', 'слова', 'слів'],
  'plural.stars': ['зірка', 'зірки', 'зірок'],
  'plural.fireflies': ['слово-світлячок', 'слова-світлячки', 'слів-світлячків'],
  'plural.wins': ['перемога', 'перемоги', 'перемог'],
  'plural.cups': ['кубок', 'кубки', 'кубків'],
  'plural.feeds': ['годування', 'годування', 'годувань'],

  'top.profile': 'Профіль',
  'top.food': 'Світлячковий корм',
  'top.trophies': 'Кубки',

  'lumi.tickle1': 'Хі-хі! 🤭',
  'lumi.tickle2': 'Лоскотно! ✨',
  'lumi.tickle3': 'Я сяю для тебе 🌟',
  'lumi.tickle4': 'Летімо далі? 💫',

  'ph.story': '💌 Історії',
  'ph.arena': '⚔️ Бос-арена',
  'ph.dragons': '🐉 Дракони',
  'ph.durak': '🃏 Картярня',
  'ph.soon': 'Скоро тут буде диво',
  'ph.building': 'Цей куточок світу ще будується. Лумі вже несе туди ліхтарики!',
  'ph.return': 'Повернутися',

  'arena.0': "Дерев'яна арена",
  'arena.1': "Кам'яна арена",
  'arena.2': 'Срібна арена',
  'arena.3': 'Золота арена',
  'arena.4': 'Зоряна арена',
  'stage.egg': 'Яйце 🥚',
  'stage.baby': 'Малюк',
  'stage.teen': 'Підліток',
  'stage.adult': 'Дорослий',
  'stage.legend': 'Легенда ✨',
  'el.sun': 'Вогник',
  'el.forest': 'Мох',
  'el.clock': 'Тік-Так',
  'el.crystal': 'Іскра',
  'el.sky': 'Зорян',
  'gift.sunHatch': '🐉 {name} вилупився з яйця — тепер він Малюк!',
  'gift.egg': '🥚 Нове яйце: {emoji} {name}! Загляни в 🐉 Дракони.',
  'gift.food': '🍀 Бонус за боса: +{n} корму для дракона!',

  'game.lesson': 'Урок',
  'game.story': 'Історія',
  'game.durak': 'Словесний Дурень',
  'game.obby': 'Обі-Вежа',
  'game.brawl': 'Зоряна Сутичка',
  'game.drama': 'Шлях Вибору',
  'game.runner': 'Словесний Забіг',
  'game.memory': 'Словесна Пам\'ять',
  'game.wordle': 'Вгадай слово',
  'game.verbs': 'Неправильні дієслова',
  'game.bubbles': 'Бульбашки-Літери',
  'game.phrases': 'Фрази на щодень',
  'game.phrases2': 'Фрази на щодень 2',
  'game.listen': 'Слухай і вибирай',
  'game.review': 'Робота над помилками',
  'game.fishing': 'Словесна Риболовля',
  'game.resto': 'Ресторан Лумі',
  'game.trip': 'Подорож',
  'game.obbyx': 'Обі-Вежа: Виклик',
  'game.runnerx': 'Забіг: Виклик',
  'game.brawlx': 'Сутичка: Виклик',
  'game.boss': 'Бос-арена',

  // ── завдання
  'task.hint.choice': 'Обери відповідь',
  'task.hint.type': 'Напиши англійською',
  'task.hint.order': 'Склади речення зі слів',
  'task.blank': 'пропуск',
  'task.listen': 'Послухати вимову',
  'task.typePh': 'Пиши тут англійською…',
  'task.yourAnswer': 'Твоя відповідь',
  'task.check': 'Перевірити',
  'task.yourSentence': 'Твоє речення',
  'task.orderPh': 'Тисни на слова нижче',
  'task.undo': '↩️ Стерти',
  'task.checkOrder': '✅ Перевірити',
  'task.skip': '🏳 Не знаю',
  'fb.yours': 'Твоя відповідь',
  'fb.right': 'Правильно',

  // ── онбординг
  'onb.hello': 'Привіт! Привет! 👋',
  'onb.langTitle': 'Обери мову гри',
  'onb.langSub': 'Англійську вчимо — а пояснювати я буду твоєю мовою.',
  'onb.langNote': 'Мову можна змінити будь-коли в Профілі.',
  'onb.next': 'Далі',
  'onb.back': 'Назад',
  'onb.meetSay': 'Я — Лумі, дух-ліхтарик! ✨',
  'onb.meetTitle': 'Привіт, {name}! Я — Лумі',
  'onb.meetText': 'Я впала з неба, і мої Слова-Світлячки розлетілися по пʼяти чарівних землях. Кожне англійське слово, яке ти вгадаєш, — це спійманий світлячок!',
  'onb.f.worlds': '8 світів від A1 до C1',
  'onb.f.levels': 'По 25 рівнів у кожному',
  'onb.f.lessons': 'Уроки й міні-ігри',
  'onb.f.boss': 'Бос-арена в кінці світу',
  'onb.f.dragons': 'Дракони, яких ти ростиш',
  'onb.f.durak': 'Картярня з хитрим Лисом',
  'onb.meetBtn': 'Я допоможу!',
  'onb.howSay': 'Усе просто — дивись! 👀',
  'onb.howTitle': 'Як грати',
  'onb.h.tap': 'Тапай правильну відповідь, пиши слова або складай речення',
  'onb.h.listen': 'Тисни 🔊 — і почуєш, як це звучить англійською',
  'onb.h.stars': 'Збирай ⭐ за рівні: без помилок — три зірки',
  'onb.h.food': 'Кожна правильна відповідь — 🍀 корм для дракона',
  'onb.h.fire': 'Заходь щодня — і вогник 🔥 розгориться',
  'onb.howBtn': 'Зрозуміло!',
  'onb.soundSay': 'А тепер — трошки музики! 🎵',
  'onb.soundTitle': 'Звук і музика',
  'onb.soundText': 'Звуки кнопок, музика світів і озвучка англійських слів. Перевір, чи тобі чути!',
  'onb.sound': 'Звуки',
  'onb.music': 'Музика',
  'onb.test': '🔊 Перевірити звук',
  'onb.testSay': 'Hello! Чуєш мене? 🎶',
  'onb.testPhrase': 'Hello! I am Lumi.',
  'onb.startSay': 'Звідки нам почати? 🤔',
  'onb.startTitle': 'Звідки почнемо?',
  'onb.startText': 'Короткий тест: по 5 питань на кожен рівень, від A1 до C1. Це не екзамен — я просто шукаю землю, де тобі буде цікаво.',
  'onb.placement': '🧭 Пройти тест рівня',
  'onb.fromStart': '🌱 Почати з початку',
  'onb.continue': '✨ Продовжити гру',
  'onb.startToast': 'Стартуємо з Ранкової Галявини 🌱',
  'onb.resetToast': 'Нова пригода починається! Прогрес оновлено 🌱',

  // ── головна
  'home.sleepy': 'Ох, я задрімала, поки чекала тебе 😴',
  'home.whereTo': '{name}, куди летимо? 🌟',
  'home.missed': 'Привіт, {name}! Я скучила ✨',
  'home.letsGo': 'Летімо далі! ✨',
  'home.streakAria': 'Стрік: {n} {days} поспіль',
  'home.streakHot': '{n} {days} поспіль! Вогник горить 🔥',
  'home.streakCold': 'Заходь завтра — і вогник розгориться 🔥',
  'home.worldN': 'Світ {n} · {level}',
  'home.hello': 'Привіт, {name}!',
  'home.food': 'корм',
  'home.continue': 'Продовжити',
  'home.worldDone': 'Світ пройдено',
  'home.pickLevel': 'Обери рівень і збери всі зірки',
  'home.path': 'Стежка світу',
  'home.levelOf': 'Рівень {n} з {total}',
  'home.allLevels': 'Усі {total} рівнів',
  'home.map': 'Карта світів',
  'home.opened': 'Відкрито {n} з {total}',
  'home.durak': 'Картярня',
  'home.foxWins': 'Перемог над Лисом: {n}',
  'home.dragons': 'Дракони',
  'home.verbs': 'Дієслова',
  'home.verbsSub': 'go · went · gone',
  'home.exam': 'Фінальний іспит',
  'home.more': 'Ще',
  'home.profileLvl': 'Профіль · рів. {n}',
  'home.placement': 'Тест рівня',
  'home.howTo': 'Як грати',
  'help.1': 'Обери світ на карті — і йди стежкою: 25 рівнів, від уроку до боса.',
  'help.2': 'Прочитай підказку Лумі — і до завдань!',
  'help.3': 'Тисни варіант, друкуй переклад або складай речення зі слів.',
  'help.4': 'Тисни 🔊, щоб почути вимову. Довге натискання на варіант — теж озвучка.',
  'help.5': '0 помилок — 3 зірки, 1–2 — дві, більше — одна.',
  'help.6': 'Історії: обирай доречні відповіді — росте Симпатія 💗.',
  'help.7': 'Наступний рівень відкривається, коли попередній має хоча б 1 ⭐.',
  'help.8': 'Пройди всі уроки світу — відкриється арена з босом.',
  'help.9': 'Кожна правильна відповідь — корм для дракона.',
  'help.10': 'Картярня: відбивайся від Лиса англійськими словами!',

  // ── світ
  'world.sleeps': 'Цей світ ще спить 🔒',
  'world.bossBeaten': '🏅 Боса переможено',
  'world.byTest': '📘 Зараховано за тестом',
  'world.starsAria': 'Зірок: {n} з {total}',
  'world.levels': 'рівнів: {n}/{total}',
  'world.again': 'Ще раз',
  'world.play': 'Грати',
  'world.nodeAria': '{i}. {title}, зірок {n} з 3',
  'world.nodeLocked': '{i}. {title}, закрито',
  'world.improve': 'Покращимо рекорд?',
  'world.here': 'Нам сюди! ✨',
  'world.done': 'Світ пройдено! 🏅',
  'world.lessonsFirst': 'Спочатку пройди всі уроки!',
  'world.prevFirst': 'Спочатку пройди попередній!',

  // ── карта
  'map.title': 'Карта світів',
  'map.closed': '🔒 Закрито',
  'map.closedAria': ', закрито',
  'map.sleeps': 'Цей світ ще спить 🔒 Переможи боса попереднього світу!',
  'map.legend': '🏅 бос переможений · 📘 зараховано за тестом',
  'map.here': 'Ми тут: {name}!',
  'map.fly': 'Летімо!',

  // ── квест
  'quest.cheer1': 'Так! Світлячок спійманий ✨',
  'quest.cheer2': 'Блискуче! 🌟',
  'quest.cheer3': 'Ти сяєш! 💫',
  'quest.cheer4': 'Ура, правильно! 🎉',
  'quest.help': 'Допоможемо Лумі!',
  'quest.lessonTitle': 'Підказка Лумі',
  'quest.toTasks': '✅ Готово, до завдань!',
  'quest.gain': '+{xp} XP · +1 🍀',
  'quest.combo': ' · 🔥 Серія: {n} поспіль!',
  'quest.skipped': '🏳 Нічого страшного!',
  'quest.almost': '💛 Майже!',
  'quest.mistakes': 'Помилки — це теж світло: так ми вчимося 🌟',
  'quest.toResult': 'До результату ✨',
  'quest.record': '🆕 Новий рекорд!',
  'quest.best': 'Твій найкращий результат: ',
  'quest.try3': 'Хочеш 3 зірки? Спробуй ще раз без помилок!',
  'quest.bossOpen': '⚔️ Арена боса відкрита! Тепер можна кинути йому виклик.',
  'quest.toArena': '⚔️ На арену!',
  'quest.toPath': '➡️ Дальше по тропе',
  'quest.toPath': '➡️ Далі по стежці',
  'quest.again': '🔁 Ще раз',
  'quest.toWorld': '🌍 До світу',
  'quest.done': 'Квест пройдено!',
  'quest.correct': 'Правильно',
  'quest.xp': 'Досвід',
  'quest.food': 'Корм',
  'quest.say3': 'Ідеально! Ти — зірка! 🌟',
  'quest.say2': 'Чудово! Ще трошки — і три зірки ✨',
  'quest.say1': 'Ми впоралися! Спробуємо ще? 💪',

  // ── тест рівня
  'pl.levels': 'Рівні',
  'pl.title': 'Тест рівня',
  'pl.lead': 'По 5 питань на кожен рівень. Не хвилюйся — це не екзамен, я просто шукаю, з якої землі нам почати 💛',
  'pl.rule1': '4 правильні з 5 — рівень зараховано, летимо вище.',
  'pl.rule2': 'Не знаєш — обирай навмання, це нормально.',
  'pl.go': 'Поїхали!',
  'pl.qOf': '{lv} · питання {n} з {total}',
  'pl.passed': 'Рівень {lv} зараховано!',
  'pl.higher': 'Летимо вище — до {lv}.',
  'pl.higherBtn': 'Летимо вище ✨',
  'pl.yourLevel': 'Твій рівень: {lv}!',
  'pl.fromStart': 'A1 — стартуємо з початку!',
  'pl.wow': 'Ого, {name}, ти сяєш яскравіше за мене! ✨',
  'pl.fine': 'Це чудово: кожен світлячок, якого ми спіймаємо, буде твоїм 💛',
  'pl.worldsOpen': 'Відкриті світи:',
  'pl.worldOpen': 'Відкритий світ:',
  'pl.toMap': '🗺 До карти!',

  // ── профіль
  'rank.0': 'Іскорка',
  'rank.1': 'Ловець світлячків',
  'rank.2': 'Юний мандрівник',
  'rank.3': 'Знавець слів',
  'rank.4': 'Хранитель світла',
  'rank.5': 'Зоряний мудрець',
  'rank.6': 'Легенда неба',
  'days.short': 'Пн,Вт,Ср,Чт,Пт,Сб,Нд',
  'prof.level': 'рівень',
  'prof.toLevel': 'ще {n} XP до рівня {lvl}',
  'prof.starsOf': 'зірок із {n}',
  'prof.overFox': '{wins} над Лисом',
  'prof.engLevel': 'рівень за тестом',
  'prof.inRow': '{n} {days} поспіль',
  'prof.week': 'Тиждень без перерви!',
  'prof.daily': 'Грай щодня, щоб вогник ріс',
  'prof.beaten': 'Переможено: {name}',
  'prof.notYet': 'Ще не здобуто',
  'prof.notFound': 'Ще не знайдено',
  'prof.notFoundSm': 'не знайдено',
  'prof.eggHint': 'Цей дракон чекає в яйці за босом одного зі світів 🥚',
  'prof.toArena': 'До «{name}» — ще {n} 🏆. Перемагай босів на арені.',
  'prof.topArena': 'Найвища арена! Ти — легенда неба 🌟',
  'prof.medals': 'Медалі',
  'prof.arenas': 'Арени й кубки',
  'prof.dragons': 'Колекція драконів',
  'prof.settings': 'Налаштування',
  'set.lang': 'Мова',
  'set.sound': 'Звуки',
  'set.music': 'Музика',
  'set.soundSub': 'кнопки, відповіді, зірки',
  'set.musicSub': 'тиха мелодія кожного світу',
  'set.test': '🔊 Перевірити звук',
  'set.voice': 'Голос озвучки',
  'set.voiceSub': 'Обери голос, що звучить найприродніше',
  'set.voiceTry': 'Послухати',
  'set.voiceNone': 'Голоси ще завантажуються…',
  'set.placement': '🧭 Пройти тест рівня знову',
  'set.onboarding': '👋 Пройти знайомство знову',
  'set.reset': 'Скинути прогрес',
  'set.resetQ': 'Скинути прогрес?',
  'set.resetText': 'Усі зірки, XP, медалі, кубки й дракони зникнуть назавжди. Почати гру з нуля?',
  'set.resetOk': 'Так, скинути',
  'set.resetNo': 'Ні, залишити',
  'set.resetDone': 'Прогрес скинуто. Нова пригода! 🌱',
  'set.langDone': 'Мову змінено 🇺🇦',

  // ── дракони
  'dr.title': '🐉 Дракони',
  'dr.pet': 'Погладити дракона',
  'dr.feed': '🍖 Нагодувати ({n} 🍀)',
  'dr.hint': 'Кожна правильна відповідь будь-де = +1 🍀',
  'dr.mine': '🔄 Мої дракони',
  'dr.top': '{g} — найвища стадія!',
  'dr.to': '{g}/{need} до «{stage}»',
  'dr.grow': '🌱 Ріст: {txt}',
  'dr.unlock.sun': 'є від початку',
  'dr.unlock.forest': 'бос світу 2',
  'dr.unlock.clock': 'бос світу 3',
  'dr.unlock.crystal': 'бос світу 4',
  'dr.unlock.sky': 'бос світу 5',
  'dr.earn': 'Це яйце ще треба заслужити: {hint} ⚔️',
  'dr.withYou': 'Тепер з тобою {name}!',
  'dr.eggWarm': 'Яйце тепленьке… всередині щось ворушиться! 🥚',
  'dr.purr': '{name} муркоче від задоволення 💚',
  'dr.noFood': "Не вистачає корму 🍀 (треба {n}). Відповідай правильно — і корм з'явиться!",
  'dr.crack': 'Крак! Яйце тріснуло — {name} тепер «{stage}»! 🎉',
  'dr.stageUp': 'Ого! Нова стадія: {name} тепер «{stage}»! 🎉',
  'dr.yum': 'Ням! +{n} росту 💚',
  'dr.enough': 'Корму вистачає на {n} {feeds} 🍖',
};

// ───────────────────────────────────────────────────────────────────────── RU
const RU = {
  // v22: обращение и спокойный режим
  'onb.addrTitle': 'Как к вам обращаться?',
  'onb.addrSay': 'Как вам удобнее? 🙂',
  'onb.addrTy': 'На «ты»', 'onb.addrTySub': 'Просто и по-дружески',
  'onb.addrVy': 'На «вы»', 'onb.addrVySub': 'Вежливо, как ко взрослому',
  'onb.addrTyOk': 'Договорились, на «ты»! 💛', 'onb.addrVyOk': 'Договорились, на «вы» 💛',
  'set.formal': '🎩 Обращение на «вы»', 'set.formalSub': 'Луми будет обращаться вежливо',
  'set.calm': 'Спокойный режим 🐢', 'set.calmSub': 'Без спешки и таймеров',
  'app.title': 'LumiQuest — английский с Луми',
  'app.loading': 'Луми зажигает фонарики…',
  'app.bootFail': 'Ой, не удалось загрузить игру. Проверь интернет и открой ещё раз 🌙',
  'common.friend': 'друг',
  'common.lumi': 'Луми',
  'common.yes': 'Да',
  'common.cancel': 'Отмена',
  'common.back': 'Назад',
  'common.next': 'Дальше',
  'common.ok': 'Понятно!',
  'common.starsOf': '{n} из {total} звёзд',
  'common.on': 'Вкл.',
  'common.off': 'Выкл.',
  'plural.days': ['день', 'дня', 'дней'],
  'plural.words': ['слово', 'слова', 'слов'],
  'plural.stars': ['звезда', 'звезды', 'звёзд'],
  'plural.fireflies': ['слово-светлячок', 'слова-светлячка', 'слов-светлячков'],
  'plural.wins': ['победа', 'победы', 'побед'],
  'plural.cups': ['кубок', 'кубка', 'кубков'],
  'plural.feeds': ['кормёжку', 'кормёжки', 'кормёжек'],

  'top.profile': 'Профиль',
  'top.food': 'Светлячковый корм',
  'top.trophies': 'Кубки',

  'lumi.tickle1': 'Хи-хи! 🤭',
  'lumi.tickle2': 'Щекотно! ✨',
  'lumi.tickle3': 'Я сияю для тебя 🌟',
  'lumi.tickle4': 'Летим дальше? 💫',

  'ph.story': '💌 Истории',
  'ph.arena': '⚔️ Босс-арена',
  'ph.dragons': '🐉 Драконы',
  'ph.durak': '🃏 Картёжная',
  'ph.soon': 'Скоро здесь будет чудо',
  'ph.building': 'Этот уголок мира ещё строится. Луми уже несёт туда фонарики!',
  'ph.return': 'Вернуться',

  'arena.0': 'Деревянная арена',
  'arena.1': 'Каменная арена',
  'arena.2': 'Серебряная арена',
  'arena.3': 'Золотая арена',
  'arena.4': 'Звёздная арена',
  'stage.egg': 'Яйцо 🥚',
  'stage.baby': 'Малыш',
  'stage.teen': 'Подросток',
  'stage.adult': 'Взрослый',
  'stage.legend': 'Легенда ✨',
  'el.sun': 'Огонёк',
  'el.forest': 'Мох',
  'el.clock': 'Тик-Так',
  'el.crystal': 'Искра',
  'el.sky': 'Звёздник',
  'gift.sunHatch': '🐉 {name} вылупился из яйца — теперь он Малыш!',
  'gift.egg': '🥚 Новое яйцо: {emoji} {name}! Загляни в 🐉 Драконы.',
  'gift.food': '🍀 Бонус за босса: +{n} корма для дракона!',

  'game.lesson': 'Урок',
  'game.story': 'История',
  'game.durak': 'Словесный Дурак',
  'game.obby': 'Оби-Башня',
  'game.brawl': 'Звёздная Схватка',
  'game.drama': 'Путь Выбора',
  'game.runner': 'Словесный Забег',
  'game.memory': 'Словесная Память',
  'game.wordle': 'Угадай слово',
  'game.verbs': 'Неправильные глаголы',
  'game.bubbles': 'Пузырьки-Буквы',
  'game.phrases': 'Фразы на каждый день',
  'game.phrases2': 'Фразы на каждый день 2',
  'game.listen': 'Слушай и выбирай',
  'game.review': 'Работа над ошибками',
  'game.fishing': 'Словесная Рыбалка',
  'game.resto': 'Ресторан Луми',
  'game.trip': 'Путешествие',
  'game.obbyx': 'Оби-Башня: Вызов',
  'game.runnerx': 'Забег: Вызов',
  'game.brawlx': 'Схватка: Вызов',
  'game.boss': 'Босс-арена',

  'task.hint.choice': 'Выбери ответ',
  'task.hint.type': 'Напиши по-английски',
  'task.hint.order': 'Составь предложение из слов',
  'task.blank': 'пропуск',
  'task.listen': 'Послушать произношение',
  'task.typePh': 'Пиши здесь по-английски…',
  'task.yourAnswer': 'Твой ответ',
  'task.check': 'Проверить',
  'task.yourSentence': 'Твоё предложение',
  'task.orderPh': 'Нажимай на слова ниже',
  'task.undo': '↩️ Стереть',
  'task.checkOrder': '✅ Проверить',
  'task.skip': '🏳 Не знаю',
  'fb.yours': 'Твой ответ',
  'fb.right': 'Правильно',

  'onb.hello': 'Привіт! Привет! 👋',
  'onb.langTitle': 'Выбери язык игры',
  'onb.langSub': 'Учим английский — а объяснять я буду на твоём языке.',
  'onb.langNote': 'Язык можно поменять когда угодно в Профиле.',
  'onb.next': 'Дальше',
  'onb.back': 'Назад',
  'onb.meetSay': 'Я — Луми, дух-фонарик! ✨',
  'onb.meetTitle': 'Привет, {name}! Я — Луми',
  'onb.meetText': 'Я упала с неба, и мои Слова-Светлячки разлетелись по пяти волшебным землям. Каждое английское слово, которое ты угадаешь, — это пойманный светлячок!',
  'onb.f.worlds': '8 миров от A1 до C1',
  'onb.f.levels': 'По 25 уровней в каждом',
  'onb.f.lessons': 'Уроки и мини-игры',
  'onb.f.boss': 'Босс-арена в конце мира',
  'onb.f.dragons': 'Драконы, которых ты растишь',
  'onb.f.durak': 'Картёжная с хитрым Лисом',
  'onb.meetBtn': 'Я помогу!',
  'onb.howSay': 'Всё просто — смотри! 👀',
  'onb.howTitle': 'Как играть',
  'onb.h.tap': 'Нажимай правильный ответ, пиши слова или собирай предложения',
  'onb.h.listen': 'Жми 🔊 — и услышишь, как это звучит по-английски',
  'onb.h.stars': 'Собирай ⭐ за уровни: без ошибок — три звезды',
  'onb.h.food': 'Каждый правильный ответ — 🍀 корм для дракона',
  'onb.h.fire': 'Заходи каждый день — и огонёк 🔥 разгорится',
  'onb.howBtn': 'Понятно!',
  'onb.soundSay': 'А теперь — немного музыки! 🎵',
  'onb.soundTitle': 'Звук и музыка',
  'onb.soundText': 'Звуки кнопок, музыка миров и озвучка английских слов. Проверь, слышно ли тебе!',
  'onb.sound': 'Звуки',
  'onb.music': 'Музыка',
  'onb.test': '🔊 Проверить звук',
  'onb.testSay': 'Hello! Слышишь меня? 🎶',
  'onb.testPhrase': 'Hello! I am Lumi.',
  'onb.startSay': 'С чего начнём? 🤔',
  'onb.startTitle': 'С чего начнём?',
  'onb.startText': 'Короткий тест: по 5 вопросов на каждый уровень, от A1 до C1. Это не экзамен — я просто ищу землю, где тебе будет интересно.',
  'onb.placement': '🧭 Пройти тест уровня',
  'onb.fromStart': '🌱 Начать с начала',
  'onb.continue': '✨ Продолжить игру',
  'onb.startToast': 'Стартуем с Утренней Поляны 🌱',
  'onb.resetToast': 'Новое приключение начинается! Прогресс обновлён 🌱',

  'home.sleepy': 'Ох, я задремала, пока ждала тебя 😴',
  'home.whereTo': '{name}, куда летим? 🌟',
  'home.missed': 'Привет, {name}! Я соскучилась ✨',
  'home.letsGo': 'Летим дальше! ✨',
  'home.streakAria': 'Серия: {n} {days} подряд',
  'home.streakHot': '{n} {days} подряд! Огонёк горит 🔥',
  'home.streakCold': 'Заходи завтра — и огонёк разгорится 🔥',
  'home.worldN': 'Мир {n} · {level}',
  'home.hello': 'Привет, {name}!',
  'home.food': 'корм',
  'home.continue': 'Продолжить',
  'home.worldDone': 'Мир пройден',
  'home.pickLevel': 'Выбери уровень и собери все звёзды',
  'home.path': 'Тропа мира',
  'home.levelOf': 'Уровень {n} из {total}',
  'home.allLevels': 'Все {total} уровней',
  'home.map': 'Карта миров',
  'home.opened': 'Открыто {n} из {total}',
  'home.durak': 'Картёжная',
  'home.foxWins': 'Побед над Лисом: {n}',
  'home.dragons': 'Драконы',
  'home.verbs': 'Глаголы',
  'home.exam': 'Финальный экзамен',
  'home.verbsSub': 'go · went · gone',
  'home.more': 'Ещё',
  'home.profileLvl': 'Профиль · ур. {n}',
  'home.placement': 'Тест уровня',
  'home.howTo': 'Как играть',
  'help.1': 'Выбери мир на карте — и иди по тропе: 25 уровней, от урока до босса.',
  'help.2': 'Прочитай подсказку Луми — и вперёд к заданиям!',
  'help.3': 'Жми вариант, печатай перевод или собирай предложение из слов.',
  'help.4': 'Жми 🔊, чтобы услышать произношение. Долгое нажатие на вариант — тоже озвучка.',
  'help.5': '0 ошибок — 3 звезды, 1–2 — две, больше — одна.',
  'help.6': 'Истории: выбирай уместные ответы — растёт Симпатия 💗.',
  'help.7': 'Следующий уровень открывается, когда у предыдущего есть хотя бы 1 ⭐.',
  'help.8': 'Пройди все уроки мира — откроется арена с боссом.',
  'help.9': 'Каждый правильный ответ — корм для дракона.',
  'help.10': 'Картёжная: отбивайся от Лиса английскими словами!',

  'world.sleeps': 'Этот мир ещё спит 🔒',
  'world.bossBeaten': '🏅 Босс побеждён',
  'world.byTest': '📘 Засчитано по тесту',
  'world.starsAria': 'Звёзд: {n} из {total}',
  'world.levels': 'уровней: {n}/{total}',
  'world.again': 'Ещё раз',
  'world.play': 'Играть',
  'world.nodeAria': '{i}. {title}, звёзд {n} из 3',
  'world.nodeLocked': '{i}. {title}, закрыто',
  'world.improve': 'Улучшим рекорд?',
  'world.here': 'Нам сюда! ✨',
  'world.done': 'Мир пройден! 🏅',
  'world.lessonsFirst': 'Сначала пройди все уроки!',
  'world.prevFirst': 'Сначала пройди предыдущий!',

  'map.title': 'Карта миров',
  'map.closed': '🔒 Закрыто',
  'map.closedAria': ', закрыто',
  'map.sleeps': 'Этот мир ещё спит 🔒 Победи босса предыдущего мира!',
  'map.legend': '🏅 босс побеждён · 📘 засчитано по тесту',
  'map.here': 'Мы здесь: {name}!',
  'map.fly': 'Летим!',

  'quest.cheer1': 'Да! Светлячок пойман ✨',
  'quest.cheer2': 'Блестяще! 🌟',
  'quest.cheer3': 'Ты сияешь! 💫',
  'quest.cheer4': 'Ура, правильно! 🎉',
  'quest.help': 'Поможем Луми!',
  'quest.lessonTitle': 'Подсказка Луми',
  'quest.toTasks': '✅ Готово, к заданиям!',
  'quest.gain': '+{xp} XP · +1 🍀',
  'quest.combo': ' · 🔥 Серия: {n} подряд!',
  'quest.skipped': '🏳 Ничего страшного!',
  'quest.almost': '💛 Почти!',
  'quest.mistakes': 'Ошибки — это тоже свет: так мы учимся 🌟',
  'quest.toResult': 'К результату ✨',
  'quest.record': '🆕 Новый рекорд!',
  'quest.best': 'Твой лучший результат: ',
  'quest.try3': 'Хочешь 3 звезды? Попробуй ещё раз без ошибок!',
  'quest.bossOpen': '⚔️ Арена босса открыта! Теперь можно бросить ему вызов.',
  'quest.toArena': '⚔️ На арену!',
  'quest.again': '🔁 Ещё раз',
  'quest.toWorld': '🌍 К миру',
  'quest.done': 'Квест пройден!',
  'quest.correct': 'Правильно',
  'quest.xp': 'Опыт',
  'quest.food': 'Корм',
  'quest.say3': 'Идеально! Ты — звезда! 🌟',
  'quest.say2': 'Отлично! Ещё чуть-чуть — и три звезды ✨',
  'quest.say1': 'Мы справились! Попробуем ещё? 💪',

  'pl.levels': 'Уровни',
  'pl.title': 'Тест уровня',
  'pl.lead': 'По 5 вопросов на каждый уровень. Не волнуйся — это не экзамен, я просто ищу, с какой земли нам начать 💛',
  'pl.rule1': '4 правильных из 5 — уровень засчитан, летим выше.',
  'pl.rule2': 'Не знаешь — выбирай наугад, это нормально.',
  'pl.go': 'Поехали!',
  'pl.qOf': '{lv} · вопрос {n} из {total}',
  'pl.passed': 'Уровень {lv} засчитан!',
  'pl.higher': 'Летим выше — к {lv}.',
  'pl.higherBtn': 'Летим выше ✨',
  'pl.yourLevel': 'Твой уровень: {lv}!',
  'pl.fromStart': 'A1 — стартуем с начала!',
  'pl.wow': 'Ого, {name}, ты сияешь ярче меня! ✨',
  'pl.fine': 'Это здорово: каждый светлячок, которого мы поймаем, будет твоим 💛',
  'pl.worldsOpen': 'Открытые миры:',
  'pl.worldOpen': 'Открытый мир:',
  'pl.toMap': '🗺 К карте!',

  'rank.0': 'Искорка',
  'rank.1': 'Ловец светлячков',
  'rank.2': 'Юный путешественник',
  'rank.3': 'Знаток слов',
  'rank.4': 'Хранитель света',
  'rank.5': 'Звёздный мудрец',
  'rank.6': 'Легенда неба',
  'days.short': 'Пн,Вт,Ср,Чт,Пт,Сб,Вс',
  'prof.level': 'уровень',
  'prof.toLevel': 'ещё {n} XP до уровня {lvl}',
  'prof.starsOf': 'звёзд из {n}',
  'prof.overFox': '{wins} над Лисом',
  'prof.engLevel': 'уровень по тесту',
  'prof.inRow': '{n} {days} подряд',
  'prof.week': 'Неделя без перерыва!',
  'prof.daily': 'Играй каждый день, чтобы огонёк рос',
  'prof.beaten': 'Побеждён: {name}',
  'prof.notYet': 'Ещё не получено',
  'prof.notFound': 'Ещё не найден',
  'prof.notFoundSm': 'не найден',
  'prof.eggHint': 'Этот дракон ждёт в яйце за боссом одного из миров 🥚',
  'prof.toArena': 'До «{name}» — ещё {n} 🏆. Побеждай боссов на арене.',
  'prof.topArena': 'Высшая арена! Ты — легенда неба 🌟',
  'prof.medals': 'Медали',
  'prof.arenas': 'Арены и кубки',
  'prof.dragons': 'Коллекция драконов',
  'prof.settings': 'Настройки',
  'set.lang': 'Язык',
  'set.sound': 'Звуки',
  'set.music': 'Музыка',
  'set.soundSub': 'кнопки, ответы, звёзды',
  'set.musicSub': 'тихая мелодия каждого мира',
  'set.test': '🔊 Проверить звук',
  'set.voice': 'Голос озвучки',
  'set.voiceSub': 'Выбери голос, который звучит естественнее',
  'set.voiceTry': 'Послушать',
  'set.voiceNone': 'Голоса ещё загружаются…',
  'set.placement': '🧭 Пройти тест уровня заново',
  'set.onboarding': '👋 Пройти знакомство заново',
  'set.reset': 'Сбросить прогресс',
  'set.resetQ': 'Сбросить прогресс?',
  'set.resetText': 'Все звёзды, XP, медали, кубки и драконы исчезнут навсегда. Начать игру с нуля?',
  'set.resetOk': 'Да, сбросить',
  'set.resetNo': 'Нет, оставить',
  'set.resetDone': 'Прогресс сброшен. Новое приключение! 🌱',
  'set.langDone': 'Язык изменён 🇷🇺',

  'dr.title': '🐉 Драконы',
  'dr.pet': 'Погладить дракона',
  'dr.feed': '🍖 Покормить ({n} 🍀)',
  'dr.hint': 'Каждый правильный ответ где угодно = +1 🍀',
  'dr.mine': '🔄 Мои драконы',
  'dr.top': '{g} — высшая стадия!',
  'dr.to': '{g}/{need} до «{stage}»',
  'dr.grow': '🌱 Рост: {txt}',
  'dr.unlock.sun': 'есть с самого начала',
  'dr.unlock.forest': 'босс мира 2',
  'dr.unlock.clock': 'босс мира 3',
  'dr.unlock.crystal': 'босс мира 4',
  'dr.unlock.sky': 'босс мира 5',
  'dr.earn': 'Это яйцо ещё нужно заслужить: {hint} ⚔️',
  'dr.withYou': 'Теперь с тобой {name}!',
  'dr.eggWarm': 'Яйцо тёпленькое… внутри что-то шевелится! 🥚',
  'dr.purr': '{name} мурлычет от удовольствия 💚',
  'dr.noFood': 'Не хватает корма 🍀 (нужно {n}). Отвечай правильно — и корм появится!',
  'dr.crack': 'Крак! Яйцо треснуло — {name} теперь «{stage}»! 🎉',
  'dr.stageUp': 'Ого! Новая стадия: {name} теперь «{stage}»! 🎉',
  'dr.yum': 'Ням! +{n} роста 💚',
  'dr.enough': 'Корма хватит на {n} {feeds} 🍖',
};

const DICT = { uk: UK, ru: RU };
if (typeof document !== 'undefined') document.documentElement.lang = LANG;
