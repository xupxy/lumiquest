/**
 * Гаманець · перевірка пошти (Gmail → Гаманець)
 * ------------------------------------------------------------
 * Цей скрипт працює у ТВОЄМУ Google-акаунті (script.google.com).
 * Раз на годину він шукає в Gmail листи-чеки, квитанції й підписки,
 * дістає з них магазин, суму, валюту, дату й короткий фрагмент
 * і додає їх у Гаманець як «знахідки з пошти». Повний текст листів
 * нікуди не надсилається.
 *
 * Як запустити:
 *   1) Встав цей код у новий проєкт на script.google.com і збережи.
 *   2) Обери функцію setup → «Виконати» → дозволь доступ.
 *      («Google не перевірив цей додаток» → «Додатково» →
 *       «Перейти до проєкту (небезпечно)» — це твій власний скрипт.)
 *   3) Готово: перевірка щогодини. testOnce — перевірити одразу.
 */

// ===== НАЛАШТУВАННЯ (Гаманець підставляє їх сам, коли копіюєш скрипт) =====
var FIREBASE_PROJECT = "ВСТАВ_PROJECT_ID";
var API_KEY = "ВСТАВ_API_KEY";
var LIST_ID = "ВСТАВ_LIST_ID";

var DAYS_BACK = 30;
var QUERY = 'newer_than:' + DAYS_BACK + 'd (receipt OR invoice OR чек OR квитанц OR оплата OR платіж OR платеж OR "payment" OR "your order" OR замовлення OR заказ OR підписк OR subscription OR "order confirmation" OR "Bestellbestätigung" OR bestelling) -in:spam -in:trash';

// ===== запуск =====
function setup() {
  checkConfig_();
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncMail') ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger('syncMail').timeBased().everyHours(1).create();
  var r = runSync_();
  Logger.log('Готово! Перевірка щогодини. Зараз знайдено нових: ' + r.added.length);
}

function syncMail() {
  var r = runSync_();
  Logger.log('Переглянуто листів: ' + r.seen + ', нових знахідок: ' + r.added.length + ', пропущено: ' + r.skipped);
}

function testOnce() {
  var r = runSync_();
  Logger.log(JSON.stringify(r, null, 2));
}

// ===== основний цикл =====
function runSync_() {
  checkConfig_();
  var props = PropertiesService.getScriptProperties();
  var done = {};
  try { done = JSON.parse(props.getProperty('done') || '{}'); } catch (e) { done = {}; }
  var threads = GmailApp.search(QUERY, 0, 60);
  var out = { seen: 0, skipped: 0, added: [] };
  for (var i = 0; i < threads.length; i++) {
    var msgs = threads[i].getMessages();
    for (var j = 0; j < msgs.length; j++) {
      var m = msgs[j], id = m.getId();
      if (done[id]) continue;
      out.seen++;
      var body = '';
      try { body = m.getPlainBody() || ''; } catch (e) { body = ''; }
      var d = m.getDate();
      var item = parseEmail(m.getFrom(), m.getSubject() || '', body.slice(0, 30000), isoDate_(d));
      if (item) {
        var ok = writeItem_(id, item);
        if (ok) out.added.push(item.merchant + ' · ' + item.amount + ' ' + item.cur + ' · ' + item.date);
        else { out.skipped++; continue; } // не вдалося записати — спробуємо наступного разу
      } else out.skipped++;
      done[id] = Date.now();
    }
  }
  // памʼятаємо лише останні 3000 листів
  var keys = Object.keys(done);
  if (keys.length > 3000) {
    keys.sort(function (a, b) { return done[a] - done[b]; });
    for (var k = 0; k < keys.length - 3000; k++) delete done[keys[k]];
  }
  props.setProperty('done', JSON.stringify(done));
  return out;
}

function checkConfig_() {
  if (/^ВСТАВ/.test(FIREBASE_PROJECT) || /^ВСТАВ/.test(API_KEY) || /^ВСТАВ/.test(LIST_ID)) {
    throw new Error('Скопіюй скрипт кнопкою в Гаманці (Налаштування → Пошта) — там ключі вже підставлені.');
  }
}

function isoDate_(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

// Firestore REST: створюємо документ mail_<id>; якщо вже є — не чіпаємо (статус «додано/пропущено» зберігається)
function writeItem_(msgId, it) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(FIREBASE_PROJECT) +
    '/databases/(default)/documents/lists/' + encodeURIComponent(LIST_ID) + '/items?documentId=mail_' + encodeURIComponent(msgId) + '&key=' + encodeURIComponent(API_KEY);
  var fields = {
    type: { stringValue: 'mail' }, status: { stringValue: 'new' },
    date: { stringValue: it.date }, merchant: { stringValue: it.merchant }, subject: { stringValue: it.subject },
    amount: { doubleValue: it.amount }, cur: { stringValue: it.cur }, cat: { stringValue: it.cat },
    isSub: { booleanValue: !!it.isSub }, snippet: { stringValue: it.snippet }, from: { stringValue: it.from },
    createdAt: { integerValue: String(Date.now()) }
  };
  var res = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify({ fields: fields }), muteHttpExceptions: true });
  var code = res.getResponseCode();
  if (code === 200 || code === 409) return true; // 409 — документ уже існує
  Logger.log('Firestore ' + code + ': ' + res.getContentText().slice(0, 300));
  return false;
}

/* =====================================================================
 * ЧИСТІ ФУНКЦІЇ РОЗБОРУ (без Gmail/мережі — їх можна тестувати окремо)
 * ===================================================================== */

var CUR_TOKENS = [
  ['€', '€'], ['eur', '€'], ['euro', '€'], ['євро', '€'],
  ['₴', '₴'], ['грн', '₴'], ['uah', '₴'], ['гривень', '₴'],
  ['us$', '$'], ['usd', '$'], ['$', '$'],
  ['zł', 'zł'], ['zl', 'zł'], ['pln', 'zł'],
  ['£', '£'], ['gbp', '£']
];
var CUR_RE_SRC = '(€|eur(?:o)?|євро|₴|грн\\.?|uah|гривень|us\\$|usd|\\$|zł|zl|pln|£|gbp)';
var NUM_RE_SRC = '(\\d{1,3}(?:[\\s\\u00a0\\u202f.,\']\\d{3})+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)';

function curSymbol(tok) {
  var t = String(tok || '').toLowerCase().replace(/\.$/, '');
  for (var i = 0; i < CUR_TOKENS.length; i++) if (CUR_TOKENS[i][0] === t) return CUR_TOKENS[i][1];
  return null;
}

// "1 299,00" / "1.299,00" / "1,299.00" / "12.99" / "12,99" / "1'299" → число
function parseNumber(s) {
  s = String(s).replace(/[\s  ']/g, '');
  var lastC = s.lastIndexOf(','), lastD = s.lastIndexOf('.');
  if (lastC >= 0 && lastD >= 0) {
    var dec = lastC > lastD ? ',' : '.';
    var th = dec === ',' ? '.' : ',';
    s = s.split(th).join('').replace(dec, '.');
  } else if (lastC >= 0 || lastD >= 0) {
    var sep = lastC >= 0 ? ',' : '.';
    var parts = s.split(sep);
    var tail = parts[parts.length - 1];
    if (parts.length === 2 && tail.length <= 2) s = parts[0] + '.' + tail; // десяткові
    else s = parts.join(''); // тисячі
  }
  var n = parseFloat(s);
  return isFinite(n) ? n : NaN;
}

// усі суми в рядку: [{amount, cur, index}]
function findAmounts(line) {
  var res = [], m;
  var before = new RegExp(CUR_RE_SRC + '\\s?' + NUM_RE_SRC, 'gi');
  var after = new RegExp(NUM_RE_SRC + '\\s?' + CUR_RE_SRC + '(?![a-zа-яіїє])', 'gi');
  while ((m = before.exec(line))) {
    var c1 = curSymbol(m[1]), n1 = parseNumber(m[2]);
    if (c1 && n1 > 0) res.push({ amount: n1, cur: c1, index: m.index });
  }
  while ((m = after.exec(line))) {
    var c2 = curSymbol(m[2]), n2 = parseNumber(m[1]);
    if (c2 && n2 > 0 && !res.some(function (r) { return Math.abs(r.index - m.index) < 3; })) res.push({ amount: n2, cur: c2, index: m.index });
  }
  return res;
}

var TOTAL_RE = /(total|grand total|amount paid|amount charged|you paid|charged|order total|разом|всього|усього|итого|до сплати|до оплати|сума|сумма|оплачено|сплачено|списано|amount|totaal|gesamt|betrag|razem|kwota)/i;
var SKIP_LINE_RE = /(баланс|balance|залишок|остаток|доступно|available|кредитний ліміт|credit limit|cashback|кешбек|бонус|знижк|discount|savings|ви заощадили|you saved|delivery fee|доставка безкоштовн|subtotal|проміжн|vat |пдв|tax)/i;

// найімовірніша сума всього листа
function pickTotal(text) {
  var lines = String(text).split(/\r?\n/);
  var best = null;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line || line.length > 400) continue;
    var found = findAmounts(line);
    if (!found.length) continue;
    var skip = SKIP_LINE_RE.test(line);
    var score = skip ? -5 : 0;
    if (TOTAL_RE.test(line)) score += 10;
    if (/^\s*(total|разом|всього|итого|до сплати|grand total|amount paid|totaal|gesamt)/i.test(line)) score += 4;
    if (i < 3) score += 1; // тема/початок листа
    for (var k = 0; k < found.length; k++) {
      var f = found[k];
      var cand = { amount: f.amount, cur: f.cur, score: score, line: line.trim() };
      if (!best || cand.score > best.score || (cand.score === best.score && cand.amount > best.amount && score >= 10)) best = cand;
    }
  }
  return best && best.score > -5 ? best : null;
}

var KNOWN = [
  // [regex по відправнику/темі, назва, категорія, підписка]
  [/netflix/i, 'Netflix', 'subs', true], [/spotify/i, 'Spotify', 'subs', true], [/youtube/i, 'YouTube Premium', 'subs', true],
  [/openai|chatgpt/i, 'ChatGPT', 'subs', true], [/icloud/i, 'iCloud+', 'subs', true], [/apple music/i, 'Apple Music', 'subs', true],
  [/apple\.com|apple/i, 'Apple', 'subs', true], [/google one/i, 'Google One', 'subs', true], [/google play|google/i, 'Google', 'subs', true],
  [/disney/i, 'Disney+', 'subs', true], [/playstation|sony/i, 'PlayStation', 'fun', false], [/xbox|microsoft/i, 'Microsoft', 'subs', true],
  [/megogo|мегого/i, 'Мегого', 'subs', true], [/kyivstar|київстар/i, 'Київстар', 'subs', true], [/lifecell/i, 'Lifecell', 'subs', true],
  [/vodafone/i, 'Vodafone', 'subs', true], [/duolingo/i, 'Duolingo', 'subs', true], [/telegram/i, 'Telegram', 'subs', true],
  [/bolt food/i, 'Bolt Food', 'cafe', false], [/glovo/i, 'Glovo', 'cafe', false], [/wolt/i, 'Wolt', 'cafe', false],
  [/uklon|уклон/i, 'Uklon', 'transport', false], [/uber/i, 'Uber', 'transport', false], [/bolt/i, 'Bolt', 'transport', false],
  [/uz\.gov|укрзалізниц|ukrzaliznytsia/i, 'Укрзалізниця', 'transport', false], [/flixbus/i, 'FlixBus', 'travel', false],
  [/ryanair/i, 'Ryanair', 'travel', false], [/wizz/i, 'Wizz Air', 'travel', false], [/booking\.com/i, 'Booking.com', 'travel', false], [/airbnb/i, 'Airbnb', 'travel', false],
  [/rozetka|розетка/i, 'Rozetka', 'shop', false], [/zalando/i, 'Zalando', 'shop', false], [/amazon/i, 'Amazon', 'shop', false],
  [/aliexpress/i, 'AliExpress', 'shop', false], [/prom\.ua/i, 'Prom.ua', 'shop', false], [/epicentr|епіцентр/i, 'Епіцентр', 'shop', false],
  [/ikea/i, 'IKEA', 'home', false], [/steam/i, 'Steam', 'fun', false], [/multiplex|планета кіно|planeta kino/i, 'Кіно', 'fun', false],
  [/сільпо|silpo/i, 'Сільпо', 'food', false], [/атб|atb/i, 'АТБ', 'food', false], [/novus/i, 'Novus', 'food', false], [/lidl/i, 'Lidl', 'food', false],
  [/аптек|pharmac|apteka/i, 'Аптека', 'health', false], [/coursera|udemy|prometheus/i, 'Навчання', 'edu', false],
  [/nova ?poshta|нова пошта/i, 'Нова пошта', 'other', false], [/monobank|universal bank/i, 'monobank', 'other', false], [/privat/i, 'ПриватБанк', 'other', false]
];
var CAT_WORDS = [
  [/(підписк|subscription|membership|renewal|renews|щомісяч|monthly plan|абонемент)/i, 'subs'],
  [/(restaurant|ресторан|кафе|cafe|coffee|кав|піц|pizza|суші|sushi|бургер|food delivery|доставка їжі)/i, 'cafe'],
  [/(taxi|таксі|ride|поїздк|trip with|metro|метро|квиток на потяг|train ticket)/i, 'transport'],
  [/(flight|рейс|hotel|готел|booking|бронювання)/i, 'travel'],
  [/(pharmacy|аптек|лік)/i, 'health'],
  [/(супермаркет|supermarket|grocer|продукт)/i, 'food'],
  [/(order|замовлення|заказ|bestelling|bestellung|zamówienie|shop|магазин|store)/i, 'shop']
];

function emailOf(from) { var m = String(from || '').match(/<([^>]+)>/); return (m ? m[1] : String(from || '')).trim().toLowerCase(); }

function merchantFrom(from, subject, text) {
  var hay = String(from) + ' ' + String(subject);
  // банківські сповіщення: магазин у тексті («Покупка: Сільпо», «Оплата в Glovo»)
  if (/monobank|privat|universal bank|ощад|raiffeisen|bank/i.test(from)) {
    var mm = String(subject + '\n' + text).match(/(?:[Пп]окупка|[Оо]плата|[Сс]писання|[Pp]ayment|[Pp]urchase)\s*[:—-]?\s*(?:(?:в|у|at|in)\s+)?([A-ZА-ЯІЇЄҐ][^\s.,;:\n]{1,20}(?: [A-ZА-ЯІЇЄҐ][^\s.,;:\n]{1,20}){0,2})/);
    if (mm) {
      var nm = mm[1].trim();
      for (var j = 0; j < KNOWN.length; j++) if (KNOWN[j][0].test(nm)) return { name: KNOWN[j][1], cat: KNOWN[j][2], sub: KNOWN[j][3] };
      return { name: nm, cat: null, sub: false };
    }
  }
  for (var i = 0; i < KNOWN.length; i++) {
    if (KNOWN[i][0].test(hay)) {
      // Apple / Google продають багато чого — уточнюємо сервіс за текстом чека
      if (KNOWN[i][1] === 'Apple' || KNOWN[i][1] === 'Google') {
        var body = String(text).slice(0, 3000);
        for (var q = 0; q < i; q++) if (KNOWN[q][3] && KNOWN[q][0].test(body)) return { name: KNOWN[q][1], cat: KNOWN[q][2], sub: KNOWN[q][3] };
      }
      return { name: KNOWN[i][1], cat: KNOWN[i][2], sub: KNOWN[i][3] };
    }
  }
  var disp = String(from || '').replace(/<[^>]*>/, '').replace(/["']/g, '').trim();
  disp = disp.replace(/\b(no-?reply|noreply|do-not-reply|team|receipts?|billing|orders?|support|notifications?|info|mailer)\b/ig, '').replace(/\s{2,}/g, ' ').replace(/^[\s,·-]+|[\s,·-]+$/g, '');
  if (disp && !/@/.test(disp) && disp.length <= 40) return { name: disp, cat: null, sub: false };
  var dom = emailOf(from).split('@')[1] || '';
  var parts = dom.split('.').filter(function (p) { return p && !/^(mail|email|e|info|news|noreply|accounts?|billing|com|net|org|ua|io|co|uk|de|nl|pl|eu|shop|store)$/.test(p); });
  var base = parts.length ? parts[parts.length - 1] : (dom.split('.')[0] || 'Магазин');
  return { name: base.charAt(0).toUpperCase() + base.slice(1), cat: null, sub: false };
}

var RECEIPT_RE = /(receipt|invoice|чек|квитанц|order confirm|your order|ваше замовлення|замовлення №|замовлення #|заказ №|оформлено|payment (?:received|confirmation|successful)|оплата (?:успішн|пройшла|отримана)|платіж|платеж|списано|charged|we.ve received your payment|thank you for your (?:order|purchase|payment)|дякуємо за (?:замовлення|покупку|оплату)|bestelbevestiging|bestellbestätigung|подтверждение заказа|your trip|ваша поїздка|поїздка завершена|renewal|subscription (?:renewed|confirmed)|підписку (?:продовжено|оформлено)|покупка|purchase)/i;
var PROMO_RE = /(знижк|sale\b|розпродаж|акці[яї]|promo|newsletter|розсилк|% off|-\d{1,2}%|ціни від|prices from|only today|тільки сьогодні|black friday|кешбек до|новинки|new arrivals|webinar|вебінар|unsubscribe from|запрошуємо)/ig;

function looksLikeReceipt(subject, text) {
  var all = String(subject) + '\n' + String(text).slice(0, 4000);
  var strong = RECEIPT_RE.test(all);
  var promo = (all.match(PROMO_RE) || []).length;
  if (!strong) return false;
  if (promo >= 3 && !/(receipt|invoice|чек|квитанц|order confirm|замовлення №|charged|списано|оплата успішн)/i.test(all)) return false;
  return true;
}

function guessCategory(merchant, subject, text) {
  if (merchant && merchant.cat) return merchant.cat;
  var all = String(subject) + '\n' + String(text).slice(0, 3000);
  for (var i = 0; i < CAT_WORDS.length; i++) if (CAT_WORDS[i][0].test(all)) return CAT_WORDS[i][1];
  return 'other';
}

function isSubscription(merchant, subject, text) {
  if (merchant && merchant.sub) return true;
  return /(subscription|підписк|membership|renew|щомісяч|monthly|annual plan|річний план|trial ended|абонемент|plan:)/i.test(String(subject) + '\n' + String(text).slice(0, 3000));
}

function makeSnippet(text, line) {
  var base = line || String(text).replace(/\s+/g, ' ').trim();
  base = base.replace(/\s+/g, ' ').trim();
  return base.length > 140 ? base.slice(0, 137) + '…' : base;
}

/**
 * Розібрати лист. Повертає обʼєкт для Гаманця або null (не чек / немає суми).
 */
function parseEmail(from, subject, body, dateIso) {
  subject = String(subject || ''); body = String(body || '');
  var text = subject + '\n' + body;
  if (!looksLikeReceipt(subject, body)) return null;
  var total = pickTotal(text);
  if (!total || !(total.amount > 0) || total.amount > 1000000) return null;
  var mer = merchantFrom(from, subject, body);
  // Bolt: їжа чи поїздка?
  if (mer.name === 'Bolt' && /(food|їж|restaurant|ресторан)/i.test(text)) mer = { name: 'Bolt Food', cat: 'cafe', sub: false };
  var cat = guessCategory(mer, subject, body);
  var sub = isSubscription(mer, subject, body) && cat !== 'cafe' && cat !== 'transport' && cat !== 'shop';
  if (sub) cat = 'subs';
  return {
    date: dateIso, merchant: mer.name.slice(0, 40), subject: subject.slice(0, 120),
    amount: Math.round(total.amount * 100) / 100, cur: total.cur, cat: cat, isSub: sub,
    snippet: makeSnippet(body, total.line), from: emailOf(from).slice(0, 80)
  };
}
