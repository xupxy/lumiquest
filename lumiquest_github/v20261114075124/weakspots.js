// weak.js — v21 «Слабкі місця» 🔍: таксономія помилок, класифікація, банк правил і прикладів, сесії.
//
//  Категорії (ключі state.weak): grammar:<topic> · verbs:irregular · spelling:<pattern> · vocab:<word> · listening
//  state.weak = { cat: { miss, ok, last: [{q, given, answer, wid}] } }   (обмеження — sanitize у state.js)
//
//  API:
//   classifyMiss(task, given, ctx) -> cat            ctx: {wid, quest, kind}
//   noteWeakMiss(state, wid, task, given, ctx)       записати помилку (квести, noteMiss)
//   noteWeakTask(state, wid, task, ok, given, quest) записати результат завдання квесту (ok → +ok теми)
//   pickWeakTopic(state, wid) -> cat
//   buildWeakSession(state, wid, n=7) -> {topic, title, title_ru, rule, rule_ru, example, short, items:[…], finalCheck}
//   noteWeakResult(state, topic, ok)
//   weakStats(state) -> [{cat, title, title_ru, miss, ok, pct}]   (для профілю)
import { getWorld, getContent, setWeakHook, norm } from './state.js?v=20261114075109';
import { addStrings } from './i18n.js?v=20261114075109';

addStrings({
  uk: { 'game.weak': 'Слабкі місця', 'prof.weak': '🔍 Мої слабкі місця', 'prof.weakEmpty': 'Поки що слабких місць не знайдено — так тримати!', 'prof.weakPct': 'засвоєно', 'weak.vocab': 'Слова світу', 'weak.check': 'Перевірка: тепер виходить?' },
  ru: { 'game.weak': 'Слабые места', 'prof.weak': '🔍 Мои слабые места', 'prof.weakEmpty': 'Пока слабых мест не найдено — так держать!', 'prof.weakPct': 'усвоено', 'weak.vocab': 'Слова мира', 'weak.check': 'Проверка: теперь получается?' },
});

// ─────────────────────────────────────────────────────────────── банк
// [cat, lvl, title, title_ru, rule, rule_ru, example, hint, hint_ru, items]
// item граматики: 'prompt|ПРАВИЛЬНА|хибна|хибна'   (варіанти перемішуються під час збирання сесії)
// item правопису: 'укр/рос|ПРАВИЛЬНА|хибна|хибна'
const B = [
  ['grammar:to_be', 0, 'am / is / are', 'am / is / are',
    'I → am; he / she / it → is; we / you / they → are.', 'I → am; he / she / it → is; we / you / they → are.',
    'I am happy. She is my friend. They are at home.', 'I — am, he/she/it — is, ми/ви/вони — are', 'I — am, he/she/it — is, мы/вы/они — are', [
      'I ___ happy today.|am|is|are', 'She ___ my sister.|is|am|are', 'They ___ in the garden.|are|is|am', 'We ___ friends.|are|is|am',
      'It ___ a big cat.|is|are|am', 'You ___ very kind.|are|is|am', 'My dog ___ black.|is|are|am', 'Tom and Ann ___ at school.|are|is|am',
      '___ you ready?|Are|Is|Am', 'The apples ___ red.|are|is|am', 'He ___ not hungry.|is|are|am']],
  ['grammar:have_got', 1, 'have got / has got', 'have got / has got',
    'I / you / we / they → have got; he / she / it → has got.\nПитання: Have you got…? Has she got…?', 'I / you / we / they → have got; he / she / it → has got.\nВопрос: Have you got…? Has she got…?',
    'She has got a red bike. We have got a dog.', 'he/she/it — has got, інші — have got', 'he/she/it — has got, остальные — have got', [
      'She ___ got a red bike.|has|have|is', 'I ___ got two brothers.|have|has|am', 'My cat ___ got green eyes.|has|have|are',
      'We ___ got a big house.|have|has|are', '___ you got a pen?|Have|Has|Do', '___ he got a sister?|Has|Have|Is',
      'They ___ got a car.|haven\'t|hasn\'t|isn\'t', 'Tom ___ got a phone.|hasn\'t|haven\'t|don\'t', 'The bird ___ got a long tail.|has|have|is',
      'Have you got a dog? — Yes, I ___.|have|has|got']],
  ['grammar:plurals', 0, 'Множина іменників', 'Множественное число',
    'Зазвичай + s. Після s, x, ch, sh → + es (boxes). Приголосна + y → ies (babies).\nОсобливі: child → children, man → men, foot → feet, mouse → mice.', 'Обычно + s. После s, x, ch, sh → + es (boxes). Согласная + y → ies (babies).\nОсобые: child → children, man → men, foot → feet, mouse → mice.',
    'one box → two boxes; one child → three children', 'множина', 'множественное число', [
      'one box — two ___|boxes|boxs|boxies', 'one child — three ___|children|childs|childrens', 'one mouse — many ___|mice|mouses|mices',
      'one baby — two ___|babies|babys|babyes', 'one leaf — many ___|leaves|leafs|leafes', 'one foot — two ___|feet|foots|feets',
      'one bus — two ___|buses|bus|busies', 'one tooth — many ___|teeth|tooths|teeths', 'one man — two ___|men|mans|mens',
      'one sheep — five ___|sheep|sheeps|sheepes', 'one city — many ___|cities|citys|cityes', 'one woman — two ___|women|womans|womens']],
  ['grammar:articles', 1, 'Артиклі a / an / the', 'Артикли a / an / the',
    'a — перед приголосним звуком (a cat, a university), an — перед голосним звуком (an apple, an hour).\nthe — щось єдине чи відоме (the sun). Види спорту — без артикля.', 'a — перед согласным звуком (a cat, a university), an — перед гласным звуком (an apple, an hour).\nthe — что-то единственное или известное (the sun). Виды спорта — без артикля.',
    'an apple, a banana, the moon', 'a / an — за першим ЗВУКОМ слова', 'a / an — по первому ЗВУКУ слова', [
      'I have ___ apple.|an|a|—', 'She is ___ teacher.|a|an|—', 'It\'s ___ umbrella.|an|a|—', 'Look at ___ sun!|the|a|an',
      'I saw ___ elephant at the zoo.|an|a|—', '___ moon is bright tonight.|The|A|An', 'My brother is ___ engineer.|an|a|—',
      'We play ___ football on Sundays.|—|the|a', 'It takes ___ hour to get there.|an|a|—', 'He is ___ university student.|a|an|—',
      'I want ___ orange, please.|an|a|—']],
  ['grammar:this_these', 1, 'this / that / these / those', 'this / that / these / those',
    'Близько: this (одне) / these (багато). Далеко: that (одне) / those (багато).', 'Близко: this (одно) / these (много). Далеко: that (одно) / those (много).',
    'This apple is sweet. Those birds are far away.', 'this/these — близько, that/those — далеко', 'this/these — близко, that/those — далеко', [
      '___ apples here are sweet.|These|This|That', 'Look at ___ bird over there!|that|these|those', '___ is my pencil, here in my hand.|This|These|Those',
      '___ stars over there are bright.|Those|That|This', 'Are ___ your shoes, here by the door?|these|this|that', '___ house over there is old.|That|Those|These',
      'I like ___ cookies here.|these|this|that', 'Who is ___ girl over there?|that|those|these', '___ is my friend Tom, right next to me.|This|These|Those',
      'Can you see ___ mountains far away?|those|that|this']],
  ['grammar:possessive', 1, 'Присвійний \'s (чий?)', 'Притяжательный \'s (чей?)',
    'Чий? — ім\'я + \'s: Tom\'s bike. Багато (на -s): parents\' car. children → children\'s.\nПитання: Whose…?', 'Чей? — имя + \'s: Tom\'s bike. Много (на -s): parents\' car. children → children\'s.\nВопрос: Whose…?',
    'This is Anna\'s bag. Whose bag is it?', 'чий — \'s', 'чей — \'s', [
      'This is ___ bike. (Tom)|Tom\'s|Toms\'|Toms', 'It is my ___ room. (one sister)|sister\'s|sisters|sister',
      'The ___ toys are in the box. (children)|children\'s|childrens\'|childrens', 'This is the ___ bowl. (one dog)|dog\'s|dogs|dog',
      'My ___ car is new. (mum and dad)|parents\'|parent\'s|parents', '___ is this bag? — It\'s Anna\'s.|Whose|Who\'s|Who',
      'Where is ___ hat? (Lumi)|Lumi\'s|Lumis|Lumi', 'The ___ nest is in the tree. (one bird)|bird\'s|birds|bird',
      'The ___ room is big. (two girls)|girls\'|girls|girles', 'Is this ___ phone? (Mum)|Mum\'s|Mums|Mum']],
  ['grammar:possessive_adj', 1, 'my / his / her / their', 'my / his / her / their',
    'Чий? — my, your, his, her, its, our, their + іменник.\nНе плутай: her (її) ≠ she (вона), its (його) ≠ it\'s (it is), their ≠ there.', 'Чей? — my, your, his, her, its, our, their + существительное.\nНе путай: her (её) ≠ she (она), its (его) ≠ it\'s (it is), their ≠ there.',
    'She loves her cat. The dog wags its tail.', 'перед іменником — my, his, her, its, our, their', 'перед существительным — my, his, her, its, our, their', [
      'She loves ___ cat.|her|she|hers', 'I can\'t find ___ keys.|my|me|I', 'They live with ___ grandma.|their|they|them',
      'The dog wags ___ tail.|its|it\'s|it', 'We clean ___ room on Saturday.|our|we|us', 'Is this ___ pen, Tom?|your|you|you\'re',
      'Max rides ___ bike to school.|his|he|him', 'The birds built ___ nest.|their|there|they\'re', 'Ann and ___ mum went shopping.|her|she|hers',
      'I don\'t know that boy. What is ___ name?|his|he|him']],
  ['grammar:prepositions_place', 1, 'Прийменники місця in / on / at', 'Предлоги места in / on / at',
    'in — всередині (in the box, in Kyiv), on — на поверхні (on the wall), at — у точці (at home, at school, at the bus stop).', 'in — внутри (in the box, in Kyiv), on — на поверхности (on the wall), at — в точке (at home, at school, at the bus stop).',
    'The fish is in the water. The picture is on the wall. I am at home.', 'in — всередині, on — на, at — у місці-точці', 'in — внутри, on — на, at — в месте-точке', [
      'I live ___ Kyiv.|in|on|at', 'The picture is ___ the wall.|on|in|at', 'She is ___ home now.|at|in|on', 'The fish swim ___ the water.|in|on|at',
      'The shop is next ___ the bank.|to|of|at', 'There are clouds ___ the sky.|in|on|at', 'We waited ___ the bus stop.|at|in|on',
      'The cat is sitting ___ the roof.|on|in|at', 'My keys are ___ my pocket.|in|on|at', 'There is a spider ___ the ceiling.|on|in|at',
      'The children are ___ school now.|at|on|of']],
  ['grammar:prepositions_time', 2, 'Прийменники часу in / on / at', 'Предлоги времени in / on / at',
    'at — годинник і ніч (at 5 o\'clock, at night), on — дні й дати (on Monday, on 1 May), in — місяці, роки, пори року, частини дня (in May, in 2015, in winter, in the morning).', 'at — время на часах и ночь (at 5 o\'clock, at night), on — дни и даты (on Monday, on 1 May), in — месяцы, годы, времена года, части дня (in May, in 2015, in winter, in the morning).',
    'at 9 o\'clock, on Sunday, in July', 'at — час, on — день, in — місяць/рік', 'at — время, on — день, in — месяц/год', [
      'My birthday is ___ May.|in|on|at', 'The lesson starts ___ 9 o\'clock.|at|in|on', 'We go swimming ___ Sundays.|on|in|at',
      'It\'s cold ___ winter.|in|on|at', 'I\'ll see you ___ Monday morning.|on|in|at', 'He was born ___ 2015.|in|on|at',
      'We open presents ___ Christmas Day.|on|in|at', 'Owls hunt ___ night.|at|in|on', 'I get up early ___ the morning.|in|on|at',
      'The film ends ___ midnight.|at|in|on', 'School starts ___ 1 September.|on|in|at']],
  ['grammar:can', 1, 'can / can\'t', 'can / can\'t',
    'can + дієслово без to і без -s: She can swim. Заперечення: can\'t. Питання: Can you…?', 'can + глагол без to и без -s: She can swim. Отрицание: can\'t. Вопрос: Can you…?',
    'Birds can fly. Fish can\'t walk.', 'після can — дієслово в початковій формі', 'после can — глагол в начальной форме', [
      'Birds ___ fly.|can|cans|can to', 'She can ___ very well.|swim|swims|to swim', '___ you help me?|Can|Do can|Are',
      'Fish ___ walk.|can\'t|don\'t can|not can', 'He ___ play the piano.|can|cans|can to', 'Can your brother ___ a bike?|ride|rides|riding',
      'I ___ see you! Where are you?|can\'t|don\'t can|not can', 'Can she speak French? — Yes, she ___.|can|does|is',
      'We can ___ tomorrow.|meet|meets|to meet', 'Penguins ___ fly, but they can swim.|can\'t|can|cans']],
  ['grammar:present_simple', 1, 'Present Simple: he / she / it + s', 'Present Simple: he / she / it + s',
    'Звичні дії (every day, often). he / she / it → дієслово + s (plays), після s, sh, ch, x, o → es (watches, goes), приголосна + y → ies (flies).', 'Привычные действия (every day, often). he / she / it → глагол + s (plays), после s, sh, ch, x, o → es (watches, goes), согласная + y → ies (flies).',
    'She goes to school every day. They play football.', 'he/she/it — дієслово з -s', 'he/she/it — глагол с -s', [
      'She ___ to school every day.|goes|go|going', 'My dad ___ coffee in the morning.|drinks|drink|drinking', 'They ___ football on Fridays.|play|plays|playing',
      'The cat ___ a lot.|sleeps|sleep|sleeping', 'He ___ his homework after dinner.|does|do|dos', 'Water ___ at 100 degrees.|boils|boil|boiling',
      'Tom ___ TV in the evening.|watches|watchs|watch', 'I ___ in a small town.|live|lives|living', 'Lumi ___ at night.|flies|flys|fly',
      'My mum ___ two languages.|speaks|speak|speaking', 'We ___ breakfast at 8.|have|has|having']],
  ['grammar:do_does', 1, 'Питання й заперечення: do / does', 'Вопросы и отрицания: do / does',
    'Питання: Do you…? Does she…? Заперечення: I don\'t…, He doesn\'t…\nПісля does / doesn\'t дієслово БЕЗ -s: Does she like…?', 'Вопрос: Do you…? Does she…? Отрицание: I don\'t…, He doesn\'t…\nПосле does / doesn\'t глагол БЕЗ -s: Does she like…?',
    'Do you like pizza? He doesn\'t like milk.', 'he/she/it — does, інші — do', 'he/she/it — does, остальные — do', [
      '___ you like pizza?|Do|Does|Are', '___ she live here?|Does|Do|Is', 'He ___ like milk.|doesn\'t|don\'t|isn\'t', 'I ___ know the answer.|don\'t|doesn\'t|not',
      'Does your cat ___ fish?|like|likes|liking', 'Where ___ they work?|do|does|are', 'What time ___ the shop open?|does|do|is',
      'We ___ go to school on Sundays.|don\'t|doesn\'t|aren\'t', 'She doesn\'t ___ coffee.|drink|drinks|drinking', 'Do you play chess? — No, I ___.|don\'t|doesn\'t|not']],
  ['grammar:present_cont', 1, 'Present Continuous (зараз)', 'Present Continuous (сейчас)',
    'Що відбувається просто зараз: am / is / are + дієслово-ing.\nswim → swimming, write → writing.', 'Что происходит прямо сейчас: am / is / are + глагол-ing.\nswim → swimming, write → writing.',
    'Look! The baby is sleeping. We are swimming.', 'зараз — am/is/are + -ing', 'сейчас — am/is/are + -ing', [
      'Look! The baby ___.|is sleeping|sleeps|are sleeping', 'I ___ a book right now.|am reading|read|is reading',
      'They ___ in the park now.|are playing|play|is playing', 'Listen! Someone ___.|is singing|sings|are singing', 'What ___ you doing?|are|do|is',
      'She is ___ a letter.|writing|writeing|writes', 'We are ___ in the pool.|swimming|swiming|swim', 'It ___ at the moment.|is raining|rains|rain',
      'He isn\'t ___ TV now.|watching|watch|watches', '___ they having lunch now?|Are|Do|Is', 'The kids are ___ to music.|listening|listen|listenning']],
  ['grammar:was_were', 1, 'was / were', 'was / were',
    'Минулий час від be: I / he / she / it → was; we / you / they → were.\nПитання: Were you…? Was he…?', 'Прошедшее время от be: I / he / she / it → was; we / you / they → were.\nВопрос: Were you…? Was he…?',
    'I was at home. They were tired.', 'I/he/she/it — was, we/you/they — were', 'I/he/she/it — was, we/you/they — were', [
      'I ___ at home yesterday.|was|were|am', 'They ___ tired yesterday.|were|was|are', 'She ___ in London last year.|was|were|is',
      'We ___ at the zoo last Sunday.|were|was|are', '___ you at school yesterday?|Were|Was|Are', 'The weather ___ sunny yesterday.|was|were|is',
      'My friends ___ at the party last night.|were|was|are', 'It ___ my birthday last week.|was|were|is', '___ he happy yesterday?|Was|Were|Is',
      'The shops ___ closed last Monday.|were|was|are', 'I ___ not hungry an hour ago.|was|were|am']],
  ['grammar:past_simple', 2, 'Past Simple: -ed і did', 'Past Simple: -ed и did',
    'Правильні дієслова: + ed (played). stop → stopped, cry → cried.\nПитання й заперечення з did / didn\'t + дієслово БЕЗ -ed: Did you like…?', 'Правильные глаголы: + ed (played). stop → stopped, cry → cried.\nВопрос и отрицание с did / didn\'t + глагол БЕЗ -ed: Did you like…?',
    'We played football. Did you like the film?', 'минуле — -ed; після did — без -ed', 'прошлое — -ed; после did — без -ed', [
      'We ___ football yesterday.|played|play|plaied', 'She ___ the window last night.|closed|close|closeed', 'I ___ my grandma last week.|visited|visit|visitted',
      'Did you ___ the film?|like|liked|likes', 'He didn\'t ___ the door.|open|opened|opens', 'The car ___ at the lights a minute ago.|stopped|stoped|stops',
      'The baby ___ all night.|cried|cryed|cries', '___ she call you yesterday?|Did|Does|Was', 'I ___ hard for the test last week.|studied|studyed|study',
      'We ___ for an hour yesterday.|waited|waitted|wait', 'Where did you ___ last summer?|travel|travelled|travels']],
  ['verbs:irregular', 2, 'Неправильні дієслова', 'Неправильные глаголы',
    'Багато дієслів у минулому НЕ мають -ed: go → went, see → saw, eat → ate, write → wrote.\nТаких форм «goed», «eated» не буває — їх треба запам\'ятати.', 'Многие глаголы в прошлом НЕ имеют -ed: go → went, see → saw, eat → ate, write → wrote.\nФорм «goed», «eated» не бывает — их нужно запомнить.',
    'Yesterday I went to the park and saw a fox.', 'неправильне дієслово — без -ed', 'неправильный глагол — без -ed', [
      'Yesterday I ___ to the park.|went|goed|go', 'Yesterday she ___ a big bird.|saw|seed|seen', 'We ___ pizza last night.|ate|eated|eaten',
      'He ___ a letter to Santa last year.|wrote|writed|written', 'I ___ my keys yesterday.|lost|losed|lose', 'They ___ a new house last month.|bought|buyed|buy',
      'The bell ___ at 8 this morning.|rang|ringed|rung', 'She ___ a song at the party.|sang|singed|sung', 'I ___ him at the shop yesterday.|met|meeted|meet',
      'He ___ his bike to school yesterday.|rode|rided|ridden', 'We ___ a cake for Mum last Sunday.|made|maked|make', 'Lumi ___ over the river last night.|flew|flied|flown']],
  ['grammar:there_is', 2, 'there is / there are', 'there is / there are',
    'Є щось десь: there is + одне (there is a cat), there are + багато (there are three cats).\nПитання: Is there…? Are there…?', 'Есть что-то где-то: there is + одно (there is a cat), there are + много (there are three cats).\nВопрос: Is there…? Are there…?',
    'There is a tree in the garden. There are two windows.', 'одне — there is, багато — there are', 'одно — there is, много — there are', [
      '___ a cat on the sofa.|There is|There are|It is', '___ three apples in the bag.|There are|There is|They are', '___ any milk in the fridge?|Is there|Are there|There is',
      '___ many people in the park?|Are there|Is there|There are', 'There ___ a big tree in our garden.|is|are|be', 'There ___ two windows in my room.|are|is|be',
      'There isn\'t ___ water in the glass.|any|some|many', 'There ___ some bread on the table.|is|are|be', 'Is there a bank near here? — Yes, there ___.|is|are|it is',
      'There ___ no clouds in the sky today.|are|is|be']],
  ['grammar:countable', 2, 'much / many / some / any', 'much / many / some / any',
    'many / a few — те, що рахуємо (apples), much / a little — те, що не рахуємо (water, money).\nsome — у ствердженнях, any — у питаннях і запереченнях.', 'many / a few — то, что считаем (apples), much / a little — то, что не считаем (water, money).\nsome — в утверждениях, any — в вопросах и отрицаниях.',
    'How many apples? How much water? I have some eggs.', 'рахуємо — many, не рахуємо — much', 'считаем — many, не считаем — much', [
      'How ___ apples do you want?|many|much|lot', 'How ___ water do you drink?|much|many|lot', 'I haven\'t got ___ money.|much|many|a few',
      'There are ___ eggs in the box.|some|any|much', 'Have you got ___ questions?|any|much|a little', 'We need ___ sugar for the cake.|some|many|a few',
      'There isn\'t ___ juice left.|much|many|a few', 'I have ___ friends in this town.|a few|a little|much', 'Add ___ salt, please.|a little|a few|many',
      'How ___ time do we have?|much|many|few']],
  ['grammar:comparatives', 2, 'Порівняння: bigger / more…', 'Сравнение: bigger / more…',
    'Короткі слова: + er than (big → bigger, easy → easier). Довгі: more … than (more interesting).\nОсобливі: good → better, bad → worse.', 'Короткие слова: + er than (big → bigger, easy → easier). Длинные: more … than (more interesting).\nОсобые: good → better, bad → worse.',
    'An elephant is bigger than a dog.', 'коротке — -er, довге — more', 'короткое — -er, длинное — more', [
      'An elephant is ___ than a dog.|bigger|biger|more big', 'Today is ___ than yesterday.|hotter|hoter|more hot',
      'This book is ___ than that one.|more interesting|interestinger|most interesting', 'My bag is ___ than yours.|heavier|heavyer|more heavy',
      'Your idea is ___ than mine.|better|gooder|more good', 'The test was ___ than I thought.|easier|easyer|more easy', 'Cars are ___ than bikes.|faster|more fast|fastest',
      'His drawing is ___ than mine.|worse|badder|more bad', 'A cheetah is faster ___ a horse.|than|then|that', 'This road is ___ than the old one.|more dangerous|dangerouser|most dangerous']],
  ['grammar:superlatives', 2, 'Найвищий ступінь: the biggest', 'Превосходная степень: the biggest',
    'the + слово-est (the tallest, the biggest, the easiest) або the most + довге слово (the most exciting).\nОсобливі: the best, the worst.', 'the + слово-est (the tallest, the biggest, the easiest) или the most + длинное слово (the most exciting).\nОсобые: the best, the worst.',
    'The blue whale is the biggest animal on Earth.', 'найбільший — the …est / the most', 'самый — the …est / the most', [
      'It is the ___ day of the year.|hottest|hotest|most hot', 'She is the ___ girl in our class.|tallest|most tall|taller', 'This is the ___ film I\'ve ever seen.|best|goodest|better',
      'Mount Everest is the ___ mountain in the world.|highest|most high|higher', 'It was the ___ day of my life.|worst|baddest|most bad',
      'This is the ___ story in the book.|most exciting|excitingest|more exciting', 'Who is the ___ person in your family?|oldest|most old|older',
      'The blue whale is the ___ animal on Earth.|biggest|bigest|most big', 'This is the ___ question in the test.|easiest|easyest|most easy',
      'This is ___ best day ever!|the|a|—']],
  ['grammar:future', 2, 'Майбутнє: will / going to', 'Будущее: will / going to',
    'will + дієслово — рішення зараз, обіцянка, прогноз (I think it will…).\nam / is / are going to + дієслово — план або те, що видно вже зараз.', 'will + глагол — решение сейчас, обещание, прогноз (I think it will…).\nam / is / are going to + глагол — план или то, что видно уже сейчас.',
    'I think she will win. Look at the clouds! It is going to rain.', 'will + дієслово, be going to + дієслово', 'will + глагол, be going to + глагол', [
      'Look at those clouds! It ___ rain.|is going to|going to|is go to', 'I think she ___ win the race.|will|wills|is will',
      'We ___ visit Grandma next week. We\'ve got the tickets.|are going to|go to|will to', 'The phone is ringing. — OK, I ___ answer it.|will|am|going',
      'Tomorrow it ___ be sunny.|will|is|wills', 'He ___ going to buy a new bike.|is|will|does', 'Will you ___ me?|help|helping|to help',
      'They aren\'t going ___ come.|to|for|at', 'I promise I ___ tell anyone.|won\'t|don\'t|am not', 'What ___ you going to do this weekend?|are|will|do']],
  ['grammar:present_perfect', 3, 'Present Perfect', 'Present Perfect',
    'have / has + 3-тя форма (seen, eaten, been): досвід (ever, never), результат (just, already, yet).\nfor — тривалість (for five years), since — з якого моменту (since May).', 'have / has + 3-я форма (seen, eaten, been): опыт (ever, never), результат (just, already, yet).\nfor — длительность (for five years), since — с какого момента (since May).',
    'I have seen this film twice. She has lived here since 2020.', 'have/has + 3-тя форма', 'have/has + 3-я форма', [
      'I have ___ this film twice.|seen|saw|see', 'She ___ never been to Paris.|has|have|is', 'Have you ever ___ sushi?|eaten|ate|eat',
      'We have ___ finished our homework.|just|yet|ago', 'He hasn\'t called me ___.|yet|already|ago', 'They ___ lived here since 2020.|have|has|are',
      'I have known her ___ five years.|for|since|ago', 'She has worked here ___ May.|since|for|ago', '___ you ever flown in a plane?|Have|Did|Has',
      'Oh no! I ___ my keys, and I can\'t open the door.|have lost|has lost|have lose', 'He has ___ the window.|broken|broke|break']],
  ['grammar:past_cont', 3, 'Past Continuous', 'Past Continuous',
    'Процес у минулому: was / were + дієслово-ing.\nwhile — «поки» (процес), when — «коли» (коротка подія).', 'Процесс в прошлом: was / were + глагол-ing.\nwhile — «пока» (процесс), when — «когда» (короткое событие).',
    'I was watching TV when you called.', 'процес у минулому — was/were + -ing', 'процесс в прошлом — was/were + -ing', [
      'I ___ TV when you called.|was watching|were watching|am watching', 'They ___ football at 5 pm yesterday.|were playing|was playing|are playing',
      'What were you ___ at 8 last night?|doing|do|did', 'She was ___ when the phone rang.|sleeping|sleep|slept', 'It ___ raining when we left.|was|were|is',
      'We were walking home ___ it started to snow.|when|while|during', '___ I was cooking, the lights went out.|While|During|For',
      'Were you ___ to me?|listening|listen|listened', 'He wasn\'t ___ attention.|paying|pay|paid', 'The children ___ in the garden all morning.|were playing|was playing|are play']],
  ['grammar:modals', 3, 'must / should / have to', 'must / should / have to',
    'must — треба (правило), mustn\'t — не можна. should — варто (порада).\nhave to / has to — доводиться; don\'t have to — не обов\'язково. Після must і should — без to.', 'must — нужно (правило), mustn\'t — нельзя. should — стоит (совет).\nhave to / has to — приходится; don\'t have to — не обязательно. После must и should — без to.',
    'You must wear a helmet. You should rest.', 'must/should + дієслово без to', 'must/should + глагол без to', [
      'You ___ wear a helmet. It\'s the rule.|must|should to|must to', 'You look tired. You ___ go to bed.|should|must to|should to',
      'She ___ get up early tomorrow.|has to|have to|has', 'You ___ touch the stove! It\'s hot.|mustn\'t|don\'t have to|must',
      'It\'s Sunday, so we ___ go to school.|don\'t have to|mustn\'t|haven\'t to', 'You ___ eat so many sweets. It\'s bad for you.|shouldn\'t|don\'t should|shouldn\'t to',
      'He ___ to finish his project.|has|must|should', 'You ___ eat more fruit.|should|ought|shoulds', 'Do we ___ bring our books?|have to|must|has to',
      'You ___ be quiet in the library.|must|musts|must to']],
  ['grammar:conditional1', 3, 'Умова: If + present, … will', 'Условие: If + present, … will',
    'Реальна умова: If + теперішній час, … will + дієслово.\nПісля if (і unless) will НЕ ставимо: If it rains, we will stay.', 'Реальное условие: If + настоящее время, … will + глагол.\nПосле if (и unless) will НЕ ставим: If it rains, we will stay.',
    'If it rains, we will stay at home.', 'після if — теперішній час, у другій частині — will', 'после if — настоящее время, во второй части — will', [
      'If it rains, we ___ at home.|will stay|stay will|would stayed', 'If you ___ hard, you will pass.|study|will study|studied', 'She will be angry if you ___ late.|are|will be|were',
      'If I see Tom, I ___ him.|will tell|told|would told', 'What will you do if you ___ the bus?|miss|will miss|missed', 'If we hurry, we ___ catch the train.|will|would|are',
      'If it ___ sunny tomorrow, we\'ll go swimming.|is|will be|was', 'You\'ll get cold if you ___ wear a coat.|don\'t|won\'t|didn\'t',
      'If he ___ the answer, he will tell us.|knows|will know|know', 'Unless you hurry, you ___ be late.|will|would|are']],
  ['grammar:conditional2', 4, 'Умова: If + past, … would', 'Условие: If + past, … would',
    'Нереальна умова: If + минулий час, … would + дієслово.\nЗ be — were для всіх: If I were you…', 'Нереальное условие: If + прошедшее время, … would + глагол.\nС be — were для всех: If I were you…',
    'If I were a bird, I would fly.', 'if + минулий, далі — would', 'if + прошедшее, дальше — would', [
      'If I ___ a bird, I would fly.|were|am|will be', 'If she had more time, she ___ travel.|would|will|is', 'What would you do if you ___ a million?|won|win|will win',
      'If I ___ you, I\'d apologise.|were|am|will be', 'We would buy a house if we ___ enough money.|had|have|would have', 'If he studied harder, he ___ pass.|would|will|is going to',
      'I ___ help you if I could.|would|will|am', 'If they lived closer, we ___ see them more often.|would|will|did', 'If it ___ warmer, we could swim.|were|is|will be',
      'She\'d be happier if she ___ more.|slept|sleeps|will sleep']],
  ['grammar:passive', 4, 'Пасив: is made / was built', 'Пассив: is made / was built',
    'Пасив: be + 3-тя форма (is made, was built, will be done). Хто зробив — by.', 'Пассив: be + 3-я форма (is made, was built, will be done). Кто сделал — by.',
    'This bridge was built in 1900. The book was written by a famous author.', 'be + 3-тя форма', 'be + 3-я форма', [
      'This bridge ___ built in 1900.|was|is|were', 'English ___ spoken in many countries.|is|are|be', 'The letters ___ sent yesterday.|were|was|are',
      'The cake was ___ by my mum.|made|make|making', 'The window has been ___.|broken|broke|break', 'These cars ___ made in Japan.|are|is|be',
      'The thief ___ caught last night.|was|is|were', 'The room ___ every day.|is cleaned|cleans|is clean', 'The book was written ___ a famous author.|by|from|with',
      'A new school ___ built next year.|will be|will|is']],
  ['grammar:gerund_inf', 4, '-ing чи to + дієслово', '-ing или to + глагол',
    'Після enjoy, finish, mind, avoid і прийменників (good at, interested in) → -ing.\nПісля want, decide, hope, promise → to + дієслово.', 'После enjoy, finish, mind, avoid и предлогов (good at, interested in) → -ing.\nПосле want, decide, hope, promise → to + глагол.',
    'I enjoy reading. She wants to become a doctor.', 'enjoy/finish/mind + -ing; want/decide/hope + to', 'enjoy/finish/mind + -ing; want/decide/hope + to', [
      'I enjoy ___ books.|reading|to read|read', 'She wants ___ a doctor.|to become|becoming|become', 'He decided ___ home.|to stay|staying|stay',
      'They finished ___ the house.|painting|to paint|paint', 'I\'m good at ___.|drawing|to draw|draw', 'We hope ___ you soon.|to see|seeing|see',
      'Do you mind ___ the window?|opening|to open|open', 'She avoided ___ to him.|talking|to talk|talk', 'I promise ___ on time.|to be|being|be',
      'He\'s interested in ___ the guitar.|learning|to learn|learn']],
  ['grammar:relative', 3, 'who / which / where / whose', 'who / which / where / whose',
    'who — про людей, which — про речі й тварин, where — про місце, whose — чий.', 'who — о людях, which — о вещах и животных, where — о месте, whose — чей.',
    'The girl who lives next door is my friend.', 'людина — who, річ — which, місце — where', 'человек — who, вещь — which, место — where', [
      'The girl ___ lives next door is my friend.|who|which|where', 'This is the book ___ I told you about.|which|who|where', 'That\'s the house ___ I was born.|where|which|who',
      'I have a bike ___ is very fast.|which|who|where', 'The man ___ car was stolen called the police.|whose|who|which', 'Do you know the woman ___ is talking to Tom?|who|which|whose',
      'This is the café ___ we met.|where|which|who', 'The film ___ we watched was boring.|which|who|where', 'He\'s the boy ___ sister is a singer.|whose|who\'s|who',
      'The teacher ___ helped me was very kind.|who|which|where']],
  ['grammar:reported', 4, 'Непряма мова', 'Косвенная речь',
    'said — без «кому», told + кому (told me). Час «зсувається» назад: am → was, will → would.\nПитання — прямий порядок слів: He asked where I lived. Прохання: told me to…', 'said — без «кому», told + кому (told me). Время «сдвигается» назад: am → was, will → would.\nВопрос — прямой порядок слов: He asked where I lived. Просьба: told me to…',
    '"I am tired." → He said he was tired.', 'непряма мова — зсув часу й прямий порядок', 'косвенная речь — сдвиг времени и прямой порядок', [
      'Tom said, "I am tired." → Tom said that ___ was tired.|he|I|you', 'She ___ me that she was busy.|told|said|spoke', 'He ___ that he was hungry.|said|told|talked',
      '"Are you OK?" → She asked me ___ I was OK.|if|that|what', '"Where do you live?" → He asked me where ___.|I lived|did I live|do I live',
      '"Close the door." → Mum told me ___ the door.|to close|close|closing', '"Don\'t shout!" → She told us ___ shout.|not to|don\'t|no',
      '"I will help you." → He said he ___ help me.|would|wills|is', '"I saw a fox." → She said she ___ a fox.|had seen|had saw|have seen',
      '"What time is it?" → He asked what time ___.|it was|was it|is it']],
  ['listening', 1, 'Схожі звуки', 'Похожие звуки',
    'Деякі слова звучать майже однаково: ship [ɪ] — sheep [iː], live — leave, pen — pan.\nСлухай довжину голосного і вибирай за змістом.', 'Некоторые слова звучат почти одинаково: ship [ɪ] — sheep [iː], live — leave, pen — pan.\nСлушай долготу гласного и выбирай по смыслу.',
    'A ship sails on the sea. A sheep eats grass.', 'обирай слово за змістом', 'выбирай слово по смыслу', [
      'A big boat is a ___.|ship|sheep|chip', 'A white farm animal with wool is a ___.|sheep|ship|cheap', 'You sit on a ___.|seat|sit|set',
      'We ___ in a flat in Kyiv.|live|leave|life', 'Please ___ the room quietly.|leave|live|leaf', 'I eat soup with a ___.|spoon|spun|spin',
      'The opposite of "hot" is ___.|cold|called|coat', 'A soft toy animal: a teddy ___.|bear|beer|pear', 'A sweet fruit: a ___.|pear|bear|peer',
      'You think with your ___.|head|had|hat', 'Write with a ___.|pen|pan|pin', 'Cook eggs in a ___.|pan|pen|pin']],
  // ── правопис: 'укр/рос|ПРАВИЛЬНО|хибно|хибно'
  ['spelling:final_g_k', 0, 'Кінцевий звук: g чи k', 'Конечный звук: g или k',
    'В кінці слова g звучить дзвінко (dog, bag, big), k / ck — глухо (book, duck, back). Не оглушуй g!', 'В конце слова g звучит звонко (dog, bag, big), k / ck — глухо (book, duck, back). Не оглушай g!',
    'dog, bag, pig — але book, duck, sick', 'дзвінке g чи глухе k / ck', 'звонкое g или глухое k / ck', [
      'собака|dog|dok|doc', 'сумка|bag|bak|bagg', 'великий/большой|big|bik|bigg', 'свиня/свинья|pig|pik|pigg', 'хворий/больной|sick|sik|sig',
      'спина|back|bak|bagk', 'книга|book|boog|buk', 'молоко|milk|milg|milc', 'качка/утка|duck|dug|duk', 'жаба/лягушка|frog|frok|frogg',
      'годинник/часы|clock|clog|clok', 'нога|leg|lek|legg']],
  ['spelling:double_letter', 0, 'Подвоєні літери', 'Двойные буквы',
    'У багатьох словах літера подвоєна: happy, apple, dinner, coffee. Запам\'ятовуй «пари» літер.', 'Во многих словах буква удвоена: happy, apple, dinner, coffee. Запоминай «пары» букв.',
    'happy, apple, summer, little', 'подвоєна літера', 'двойная буква', [
      'щасливий/счастливый|happy|hapy|happpy', 'яблуко/яблоко|apple|aple|appel', 'м\'яч/мяч|ball|bal|baal', 'вечеря/ужин|dinner|dinerr|dinnar',
      'кролик|rabbit|rabit|rabbitt', 'літо/лето|summer|sumer|summmer', 'дерево|tree|tre|trea', 'кава/кофе|coffee|cofee|coffe',
      'маленький|little|litle|littel', 'спати/спать|sleep|slep|sleap', 'лист (пошта)/письмо|letter|leter|lettre', 'жовтий/жёлтый|yellow|yelow|yello']],
  ['spelling:silent_letter', 1, 'Німі літери', 'Немые буквы',
    'Деякі літери пишемо, але не вимовляємо: k у knife, w у write, b у lamb, h у hour, gh у light.', 'Некоторые буквы пишем, но не произносим: k в knife, w в write, b в lamb, h в hour, gh в light.',
    'knife, write, lamb, hour, light', 'німа літера', 'немая буква', [
      'ніж/нож|knife|nife|knif', 'писати/писать|write|rite|wrte', 'ягня/ягнёнок|lamb|lam|lamd', 'година/час (60 хв)|hour|our|houre',
      'знати/знать|know|kno|noe', 'коліно/колено|knee|nee|kne', 'острів/остров|island|iland|islend', 'слухати/слушать|listen|lisen|lissen',
      'говорити/говорить|talk|tak|tolk', 'світло/свет|light|lite|ligt', 'дочка/дочь|daughter|dauter|doughter', 'гребінець/расчёска|comb|com|combe']],
  ['spelling:ie_ei', 2, 'ie чи ei', 'ie или ei',
    'Найчастіше ie (friend, piece, field), але після c — ei (receive, ceiling); ei також у eight, weight, weird.', 'Чаще всего ie (friend, piece, field), но после c — ei (receive, ceiling); ei также в eight, weight, weird.',
    'friend, piece — receive, ceiling', 'ie чи ei', 'ie или ei', [
      'друг|friend|freind|frend', 'поле|field|feild|fild', 'шматок/кусок|piece|peice|pice', 'отримати/получить|receive|recieve|receeve',
      'вісім/восемь|eight|ieght|eigth', 'вага/вес|weight|wieght|weigth', 'вірити/верить|believe|beleive|belive', 'злодій/вор|thief|theif|thif',
      'стеля/потолок|ceiling|cieling|celing', 'племінниця/племянница|niece|neice|neese', 'дивний/странный|weird|wierd|weard']],
  ['spelling:vowel_swap', 0, 'Голосні: a, e, i, u', 'Гласные: a, e, i, u',
    'Короткі голосні легко сплутати: a [æ] у cat, e [e] у bed, i [ɪ] у fish, u [ʌ] у sun. Слухай і запам\'ятовуй.', 'Короткие гласные легко перепутать: a [æ] в cat, e [e] в bed, i [ɪ] в fish, u [ʌ] в sun. Слушай и запоминай.',
    'cat, bed, fish, sun', 'правильна голосна', 'правильная гласная', [
      'червоний/красный|red|rad|rid', 'капелюх/шляпа|hat|het|hatt', 'кіт/кот|cat|cet|kat', 'сонце/солнце|sun|san|sen', 'ручка|pen|pan|pun',
      'тато/папа|dad|ded|dud', 'ліжко/кровать|bed|bad|bid', 'автобус|bus|bas|bos', 'яйце/яйцо|egg|agg|igg', 'чашка|cup|cap|cop',
      'риба/рыба|fish|fesh|fush', 'сумний/грустный|sad|sed|sud']],
  ['spelling:missing_letter', 0, 'Не губи літери', 'Не теряй буквы',
    'Пиши слово повністю: school (s-c-h), water, teacher. Промовляй по літерах.', 'Пиши слово полностью: school (s-c-h), water, teacher. Проговаривай по буквам.',
    'school, water, teacher', 'усі літери на місці', 'все буквы на месте', [
      'школа|school|shool|scool', 'вода|water|watr|wter', 'зелений/зелёный|green|gren|grean', 'морква/морковь|carrot|carot|carrt',
      'брат|brother|brothr|brotter', 'сестра|sister|siter|sistr', 'будинок/дом|house|hous|huose', 'вікно/окно|window|windw|windoe',
      'банан|banana|banan|bananna', 'квітка/цветок|flower|flowr|flawer', 'вчитель/учитель|teacher|teacer|techer', 'апельсин|orange|ornge|orang']],
];

const BANK = Object.create(null);
for (const [cat, lvl, title, title_ru, rule, rule_ru, example, hint, hint_ru, items] of B) {
  BANK[cat] = { cat, lvl, title, title_ru, rule, rule_ru, example, hint, hint_ru, items };
}
export const WEAK_BANK = BANK;
export const weakTopics = () => Object.keys(BANK);

const isSpell = (cat) => cat.startsWith('spelling:');
/** Рядок банку → завдання {prompt, prompt_ru?, options, answer, why, why_ru}. */
function makeItem(T, raw) {
  const p = raw.split('|');
  const right = p[1];
  const options = shuffle(p.slice(1));
  const answer = options.indexOf(right);
  if (isSpell(T.cat)) {
    const [uk, ru] = p[0].split('/');
    return { prompt: `Як правильно пишеться «${uk}»?`, prompt_ru: `Как правильно пишется «${ru || uk}»?`, options, answer,
      why: `${T.hint}: ${right}`, why_ru: `${T.hint_ru}: ${right}`, en: right };
  }
  const full = p[0].replace('___', right === '—' ? '' : right).replace(/\s{2,}/g, ' ').replace(/^(\w)/, (c) => c.toUpperCase());
  return { prompt: p[0], options, answer, why: `${T.hint} → ${full}`, why_ru: `${T.hint_ru} → ${full}`, en: right };
}

// ─────────────────────────────────────────────────────────── утиліти
function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}
function lev(a, b) {
  if (a === b) return 0;
  const m = a.length; const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
const LVL = { Starter: 0, A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 5 };
function worldLvl(wid) {
  const w = getWorld(wid);
  const l = String((w && w.level) || 'A1').replace(/\++$/, '');
  return l in LVL ? LVL[l] : 1;
}

// ── неправильні дієслова: форми з content.VERBS + базовий набір
const IRR_BASE = 'be was were been go went gone see saw seen eat ate eaten write wrote written lose lost buy bought ring rang rung sing sang sung meet met ride rode ridden make made fly flew flown take took taken come came give gave given get got have had do did done run ran swim swam know knew known think thought bring brought catch caught find found sleep slept sit sat stand stood tell told say said speak spoke break broke broken drink drank drunk begin began begun choose chose chosen fall fell feel felt hold held keep kept leave left read send sent spend spent teach taught win won wear wore draw drew grow grew throw threw hide hid build built';
let irrSet = null;
function irregulars() {
  if (irrSet) return irrSet;
  irrSet = new Set(IRR_BASE.split(' '));
  const V = (getContent() || {}).VERBS || {};
  for (const list of Object.values(V)) for (const v of list || []) for (const f of [v.v1, v.v2, v.v3]) String(f || '').toLowerCase().split(/[/,\s]+/).forEach((x) => x && irrSet.add(x));
  return irrSet;
}

// ─────────────────────────────────────────────────────────── класифікація
/** Патерн правопису для given vs answer (одне слово) або null. */
export function spellingPattern(given, answer) {
  const g = norm(given).replace(/[^a-z']/g, ''); const a = norm(answer).replace(/[^a-z']/g, '');
  if (!g || !a || g === a || a.length < 2) return null;
  const d = lev(g, a);
  if (d > Math.max(2, Math.floor(a.length / 3))) return null;
  const dedup = (s) => s.replace(/(.)\1+/g, '$1');
  if (/(g|k|ck)$/.test(a) && /[gkcd]+$/.test(g) && a.replace(/(g|ck|k)$/, '') === g.replace(/[gkcd]+$/, '')) return 'final_g_k';
  if (dedup(g) === dedup(a)) return 'double_letter';
  if ((a.includes('ie') && a.replace('ie', 'ei') === g) || (a.includes('ei') && a.replace('ei', 'ie') === g)) return 'ie_ei';
  if (g.length === a.length - 1 || (a.includes('gh') && g.length === a.length - 2)) {
    for (let i = 0; i < a.length; i++) {
      if ('kwbhlgt'.includes(a[i]) && a.slice(0, i) + a.slice(i + 1) === g) return 'silent_letter';
    }
    if (a.replace('gh', '') === g) return 'silent_letter';
  }
  if (g.length === a.length) {
    let onlyV = true;
    for (let i = 0; i < a.length; i++) if (a[i] !== g[i] && !('aeiouy'.includes(a[i]) && 'aeiouy'.includes(g[i]))) { onlyV = false; break; }
    if (onlyV) return 'vowel_swap';
  }
  if (Math.abs(g.length - a.length) === 1 && d === 1) return 'missing_letter';
  return 'missing_letter';
}

// варіанти відповіді, що однозначно вказують на тему
const OPT_SETS = [
  ['grammar:was_were', /^(was|were|wasn't|weren't)$/],
  ['grammar:to_be', /^(am|is|are|isn't|aren't|i'm)$/],
  ['grammar:articles', /^(a|an|the|—|-)$/],
  ['grammar:this_these', /^(this|that|these|those)$/],
  ['grammar:countable', /^(much|many|some|any|a few|a little|few|little|lot|a lot of)$/],
  ['grammar:relative', /^(who|which|where|whose|that|who's)$/],
  ['grammar:can', /^(can|can't|cannot|could)$/],
  ['grammar:modals', /^(must|mustn't|should|shouldn't|have to|has to|don't have to)$/],
  ['grammar:do_does', /^(do|does|don't|doesn't)$/],
  ['grammar:possessive_adj', /^(my|your|his|her|its|our|their|me|him|them|us|she|he|they|it's|hers)$/],
  ['grammar:prepositions', /^(in|on|at|under|behind|next to|between|opposite|by|to|from|into|for|since)$/],
];
// ключові слова уроку/завдання → тема (порядок = пріоритет)
const KW = [
  ['grammar:passive', /passive|пасив|пассив|\b(is|are|was|were|been|be) (made|built|written|spoken|sold|done|grown|invented|painted|cleaned|found)\b/],
  ['grammar:reported', /reported|непрям|косвен|\b(said|told me|asked me) (that|if|whether|to)\b/],
  ['grammar:conditional2', /\bif (i|he|she|we|they|you|it) (were|had|knew|lived|could)\b|\bwould\b|\bi'd\b/],
  ['grammar:conditional1', /\bif\b.*\bwill\b|\bunless\b|умов/],
  ['grammar:present_perfect', /present perfect|\b(have|has|haven't|hasn't) (ever|never|just|already|been|seen|done|gone|eaten|made|lived|known|visited|finished)\b|\bsince\b|\byet\b/],
  ['grammar:past_cont', /past continuous|\b(was|were) \w+ing\b|\bwhile\b/],
  ['grammar:gerund_inf', /gerund|герунд|\b(enjoy|enjoys|mind|finish|avoid|decide|decided|hope|promise)\b/],
  ['grammar:relative', /relative|відносн|относит|\bwhose\b|\b(who|which) (is|was|lives|helped)\b/],
  ['grammar:modals', /\b(must|mustn't|should|shouldn't|have to|has to)\b/],
  ['grammar:future', /\bwill\b|going to|won't|майбутн|будущ/],
  ['grammar:superlatives', /\bthe (\w+est|most|best|worst)\b|найвищ|превосх/],
  ['grammar:comparatives', /\bthan\b|порівн|сравн/],
  ['grammar:countable', /\b(much|many|a few|a little|some|any)\b/],
  ['grammar:there_is', /there (is|are|isn't|aren't|was|were)|\b(is|are) there\b/],
  ['verbs:irregular', /irregular|неправильн/],
  ['grammar:past_simple', /\b(did|didn't)\b|past simple|учора|вчера|yesterday|last (week|year|night)/],
  ['grammar:was_were', /\b(was|were)\b/],
  ['grammar:present_cont', /present continuous|\b(am|is|are|'m|'re) \w+ing\b|right now|at the moment|зараз|сейчас/],
  ['grammar:have_got', /\b(have|has|haven't|hasn't) got\b|\b've got\b|\b's got\b/],
  ['grammar:do_does', /\b(do|does|don't|doesn't)\b/],
  ['grammar:can', /\b(can|can't)\b/],
  ['grammar:possessive', /\bwhose\b|\b(?!(it|that|what|he|she|there|let|who|where|here)'s)\w+'s\b|чий|чей/],
  ['grammar:possessive_adj', /присвійн|притяжат|\b(my|his|her|its|our|their)\b/],
  ['grammar:this_these', /\b(this|that|these|those)\b/],
  ['grammar:prepositions_time', /\b(in|on|at) (monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d|the morning|night|midnight|january|may|july|winter|summer|christmas)/],
  ['grammar:prepositions_place', /прийменник|предлог|\b(under|behind|next to|between|opposite)\b/],
  ['grammar:plurals', /plural|множин|\bchildren\b|\b\w+(ies)\b/],
  ['grammar:articles', /артикл|article|\ban\b/],
  ['grammar:present_simple', /present simple|every (day|morning)|always|usually|often|\b(he|she|it) \w+s\b/],
  ['grammar:to_be', /\b(am|is|are)\b/],
];
const TIME_RX = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|o'clock|morning|evening|afternoon|night|midnight|january|february|march|april|may|june|july|august|september|october|november|december|winter|spring|summer|autumn|christmas|birthday|\d{1,4})\b/;

function byKW(text) {
  const s = String(text || '').toLowerCase();
  for (const [cat, rx] of KW) if (rx.test(s)) return cat;
  return null;
}

/** Тема з самого завдання (choice — за варіантами; далі ключові слова). */
function taskTopic(task) {
  if (!task) return null;
  if (task.topic) return /:/.test(task.topic) || task.topic === 'listening' ? task.topic : `grammar:${task.topic}`;
  const q = String(task.q || '');
  const opts = (task.options || []).map((o) => norm(o));
  if (task.type === 'choice' && opts.length >= 2) {
    if (opts.some((o) => /^(was|were)$/.test(o))) return 'grammar:was_were';
    if (opts.some((o) => irregulars().has(o)) && opts.some((o) => /\w+ed$/.test(o) && !irregulars().has(o))) return 'verbs:irregular';
    for (const [cat, rx] of OPT_SETS) {
      if (opts.every((o) => rx.test(o))) {
        if (cat === 'grammar:prepositions') return TIME_RX.test(q.toLowerCase()) ? 'grammar:prepositions_time' : 'grammar:prepositions_place';
        if (cat === 'grammar:to_be' && /\b(yesterday|last|ago)\b/i.test(q)) return 'grammar:was_were';
        return cat;
      }
    }
    if (opts.some((o) => /\b(has|have) got\b/.test(o)) || (/\bgot\b/i.test(q) && opts.every((o) => /^(has|have|is|are|do|does|haven't|hasn't)$/.test(o)))) return 'grammar:have_got';
    if (opts.some((o) => /^\w+(er|est)$/.test(o)) && opts.some((o) => /^(more|most) /.test(o))) return opts.some((o) => /est$|^most /.test(o)) ? 'grammar:superlatives' : 'grammar:comparatives';
  }
  return byKW(`${q} ${opts.join(' ')}`);
}

/**
 * Категорія помилки. ctx: {wid, quest, kind:'listening'|'verbs'|'vocab'|'spelling'}.
 * Правопис — за порівнянням given vs answer; граматика — task.topic → варіанти → ключові слова завдання → урок квесту.
 */
export function classifyMiss(task, given, ctx = {}) {
  const answer = task ? answerOf(task) : String(ctx.answer || '');
  const g = norm(given); const a = norm(answer);
  if (ctx.kind === 'listening') return 'listening';
  // «goed», «eated», «seed» — неправильні дієслова
  if (g && /ed$/.test(g) && (irregulars().has(a) || (task && /\b(went|saw|ate|wrote|came|took)\b/.test(a)))) return 'verbs:irregular';
  if (ctx.kind === 'verbs') return 'verbs:irregular';
  if (task && task.topic) return taskTopic(task);
  const oneWord = a && !/\s/.test(a) && /^[a-z']+$/.test(a);
  const typed = !task || task.type === 'type' || ctx.kind === 'spelling' || ctx.kind === 'vocab';
  if (oneWord && g && typed && /^[a-z' ]+$/.test(g)) {
    const p = spellingPattern(g, a);
    if (p) return `spelling:${p}`;
  }
  const t = task && task.type !== 'type' ? taskTopic(task) : (task ? byKW(String(task.q || '').replace(/[«»"].*?[«»"]/g, '') + ' ' + a) : null);
  if (t && BANK[t]) return t;
  if (ctx.quest) {
    const fromLesson = byKW(String(ctx.quest.lesson || '').split('\n').slice(0, 2).join(' '));
    if (fromLesson) return fromLesson;
  }
  if (t) return t;
  if (oneWord || (!task && a)) return `vocab:${a.slice(0, 30)}`;
  return hardestTopics(ctx.wid)[0] || 'grammar:to_be';
}

function answerOf(task) {
  if (task.type === 'choice') return String((task.options || [])[task.answer] ?? '');
  if (task.type === 'type') return String((task.answers || [])[0] || '');
  return String(task.answer || task.en || '');
}

// ─────────────────────────────────────────────────────────── запис
const W_MAX = 60; const LAST_MAX = 5;
function rec(state, cat) {
  if (!state.weak || typeof state.weak !== 'object') state.weak = {};
  let r = state.weak[cat];
  if (!r) {
    const keys = Object.keys(state.weak);
    if (keys.length >= W_MAX) {
      const low = keys.sort((x, y) => (state.weak[x].miss - state.weak[x].ok) - (state.weak[y].miss - state.weak[y].ok))[0];
      delete state.weak[low];
    }
    r = state.weak[cat] = { miss: 0, ok: 0, last: [] };
  }
  return r;
}
const cut = (s) => String(s ?? '').slice(0, 120);
/** Записати помилку. Повертає категорію. */
export function noteWeakMiss(state, wid, task, given, ctx = {}) {
  if (!state) return null;
  try {
    const cat = ctx.cat || classifyMiss(task, given, { ...ctx, wid });
    if (!cat) return null;
    const r = rec(state, cat);
    r.miss = Math.min(9999, r.miss + 1);
    const q = task ? (task.q || task.prompt || '') : (ctx.q || '');
    const answer = task ? answerOf(task) : (ctx.answer || '');
    r.last = [{ q: cut(q), given: cut(given), answer: cut(answer), wid: String(wid || '') },
      ...r.last.filter((x) => !(x.answer === cut(answer) && x.q === cut(q)))].slice(0, LAST_MAX);
    return cat;
  } catch (e) { return null; }
}
/** Результат завдання квесту: помилка → noteWeakMiss; правильно → +ok теми (лише граматика за варіантами). */
export function noteWeakTask(state, wid, task, ok, given, quest) {
  if (!ok) return noteWeakMiss(state, wid, task, given, { quest, kind: task && task.type === 'type' ? 'spelling' : undefined });
  const cat = task && (task.topic ? taskTopic(task) : task.type === 'choice' ? taskTopic(task) : null);
  if (cat && state.weak && state.weak[cat]) state.weak[cat].ok = Math.min(9999, state.weak[cat].ok + 1);
  return cat;
}
/** Результат завдання слабкого місця. */
export function noteWeakResult(state, topic, ok) {
  if (!state || !topic) return;
  const r = rec(state, topic);
  if (ok) r.ok = Math.min(9999, r.ok + 1); else r.miss = Math.min(9999, r.miss + 1);
}

// хук із state.noteMiss(state, wid, en, given, kind)
setWeakHook((state, wid, en, given, kind) => {
  if (!en) return;
  const cat = classifyMiss(null, given || '', { wid, kind: kind || (given ? 'spelling' : 'vocab'), answer: en });
  noteWeakMiss(state, wid, null, given || '', { cat, answer: en, q: en });
});

// ─────────────────────────────────────────────────────────── вибір теми
/** Теми уроків світу (за ключовими словами уроків), найскладніші — першими. */
function hardestTopics(wid) {
  const w = wid && getWorld(wid);
  const L = worldLvl(wid);
  const found = new Set();
  for (const q of (w && w.quests) || []) {
    const c = byKW(String(q.lesson || '').split('\n').slice(0, 2).join(' '));
    if (c && BANK[c]) found.add(c);
  }
  let list = [...found].filter((c) => BANK[c].lvl <= Math.max(1, L));
  if (!list.length) list = Object.keys(BANK).filter((c) => !isSpell(c) && c !== 'listening' && BANK[c].lvl <= Math.max(1, L));
  list.sort((x, y) => BANK[y].lvl - BANK[x].lvl);
  if (list.length < 3) {   // мало тем в уроках → доповнюємо темами банку цього рівня
    const more = Object.keys(BANK).filter((c) => !isSpell(c) && c !== 'listening' && !list.includes(c) && BANK[c].lvl <= Math.max(1, L))
      .sort((x, y) => BANK[y].lvl - BANK[x].lvl);
    list.push(...more.slice(0, 3 - list.length));
  }
  return list;
}
function score(state, cat, wid) {
  const r = state.weak && state.weak[cat];
  if (!r) return 0;
  const here = (r.last || []).some((x) => x.wid === wid) ? 1.5 : 1;
  return (r.miss - r.ok * 0.7) * here;
}
/** Найслабша тема для світу wid (або найскладніша тема світу, якщо помилок майже нема). */
export function pickWeakTopic(state, wid) {
  return pick(state, wid).topic;
}
function pick(state, wid) {
  const L = worldLvl(wid);
  let best = null; let bs = 0;
  // vocab:* — лише слова цього світу
  for (const cat of Object.keys((state && state.weak) || {})) {
    if (cat.startsWith('vocab:')) {
      if (!(state.weak[cat].last || []).some((x) => x.wid === wid) || !vocabPool(wid).length) continue;
    } else if (!BANK[cat] || BANK[cat].lvl > L + 1) continue;
    const s = score(state, cat, wid);
    if (s > bs) { bs = s; best = cat; }
  }
  if (best && bs >= 2) return { topic: best, short: false };
  // помилок майже нема → найскладніша тема світу; черговість — за кількістю вже пройдених weak-слотів світу
  const list = hardestTopics(wid);
  const passed = [1, 2, 3].filter((n) => ((state && state.stars && state.stars[`${wid}-weak${n}`]) || 0) >= 1).length;
  return { topic: list[passed % list.length] || 'grammar:to_be', short: true };
}

// ─────────────────────────────────────────────────────────── слова світу (vocab:*)
function vocabPool(wid) {
  const C = getContent() || {};
  const uk = (C.WORDS && C.WORDS[wid]) || [];
  const ru = (C.WORDS_RU && C.WORDS_RU[wid]) || [];
  return uk.map((p, i) => ({ uk: p[0], ru: (ru[i] && ru[i][1] === p[1] ? ru[i][0] : null) || p[0], en: p[1] })).filter((x) => x.en && x.uk);
}
function vocabItem(pool, w) {
  const others = shuffle(pool.filter((x) => norm(x.en) !== norm(w.en))).slice(0, 2).map((x) => x.en);
  const options = shuffle([w.en, ...others]);
  return { prompt: `Як англійською «${w.uk}»?`, prompt_ru: `Как по-английски «${w.ru}»?`, options, answer: options.indexOf(w.en),
    why: `«${w.uk}» — ${w.en}`, why_ru: `«${w.ru}» — ${w.en}`, en: w.en };
}

// ─────────────────────────────────────────────────────────── сесія
/**
 * Сесія «слабкого місця»: правило + n нових прикладів (не те саме слово) + фінальна перевірка тим самим завданням.
 * -> {topic, title, title_ru, rule, rule_ru, example, short, items:[{prompt, prompt_ru?, options, answer, why, why_ru}], finalCheck}
 */
export function buildWeakSession(state, wid, n = 7) {
  const { topic, short } = pick(state || {}, wid);
  const cnt = Math.max(3, short ? Math.min(n, 5) : n);
  const r = (state && state.weak && state.weak[topic]) || null;
  const lastHere = r ? ((r.last || []).find((x) => x.wid === wid) || r.last[0]) : null;

  if (topic.startsWith('vocab:')) {
    const pool = vocabPool(wid);
    const word = topic.slice(6);
    const target = pool.find((x) => norm(x.en) === word) || pool[0];
    const items = shuffle(pool.filter((x) => x !== target)).slice(0, cnt).map((w) => vocabItem(pool, w));
    const fc = target ? vocabItem(pool, target) : items.pop();
    return {
      topic, title: 'Слова світу', title_ru: 'Слова мира', short,
      rule: 'Слово запам\'ятовується, коли бачиш його кілька разів у різних парах. Промов уголос і уяви картинку.',
      rule_ru: 'Слово запоминается, когда видишь его несколько раз в разных парах. Произнеси вслух и представь картинку.',
      example: target ? `${target.uk} — ${target.en}` : '', items, finalCheck: { ...fc, final: true },
    };
  }

  const T = BANK[topic] || BANK['grammar:to_be'];
  // нові приклади: усе, крім того самого слова/речення, де була помилка
  const bad = new Set(((r && r.last) || []).map((x) => norm(isSpell(T.cat) ? x.answer : x.q)));
  const key = (s) => norm(isSpell(T.cat) ? s.split('|')[1] : s.split('|')[0]);
  const raw = shuffle(T.items.filter((s) => !bad.has(key(s))));
  const items = raw.slice(0, cnt).map((s) => makeItem(T, s));
  // фінальна перевірка: ТЕ САМЕ завдання (зі збереженої помилки), інакше — ще один приклад банку
  let finalCheck = null;
  if (lastHere && lastHere.answer) {
    const ans = lastHere.answer;
    const opts = [ans];
    if (lastHere.given && norm(lastHere.given) !== norm(ans)) opts.push(lastHere.given);
    if (isSpell(T.cat) || /^vocab|^spelling/.test(topic)) {
      // ще одна схожа хибна форма
      const alt = ans.length > 3 ? ans.slice(0, -2) + ans.slice(-1) : ans + ans.slice(-1);
      if (!opts.map(norm).includes(norm(alt))) opts.push(alt);
    } else {
      for (const s of T.items) { const w = s.split('|').slice(2); for (const x of w) if (opts.length < 3 && !opts.map(norm).includes(norm(x))) opts.push(x); if (opts.length >= 3) break; }
    }
    const options = shuffle(opts.slice(0, 4));
    // промпт не має підказувати відповідь: для слова — рідною мовою (зі слів світу або банку правопису)
    let q = lastHere.q; let qRu = q;
    if (!q || /^[a-z' -]+$/i.test(q)) {
      const v = vocabPool(wid).find((x) => norm(x.en) === norm(ans));
      const b = !v && Object.values(BANK).filter((x) => isSpell(x.cat)).flatMap((x) => x.items).find((x) => norm(x.split('|')[1]) === norm(ans));
      const [uk, ru] = v ? [v.uk, v.ru] : b ? b.split('|')[0].split('/') : [null, null];
      q = uk ? `Як англійською «${uk}»?` : 'Обери правильний варіант:'; qRu = uk ? `Как по-английски «${ru || uk}»?` : 'Выбери правильный вариант:';
    }
    finalCheck = { prompt: q, prompt_ru: qRu, options, answer: options.indexOf(ans), why: `${T.hint} → ${ans}`, why_ru: `${T.hint_ru} → ${ans}`, given: lastHere.given, final: true };
  }
  if (!finalCheck) {
    const s = raw[cnt] || T.items.find((x) => !raw.slice(0, cnt).includes(x)) || T.items[0];
    finalCheck = { ...makeItem(T, s), final: true };
  }
  return { topic: T.cat, title: T.title, title_ru: T.title_ru, rule: T.rule, rule_ru: T.rule_ru, example: T.example, short, items, finalCheck };
}

/** «Лумі пояснює інакше»: ще k завдань тієї ж теми, яких не було в items. */
export function moreWeakItems(topic, used = [], k = 3) {
  const T = BANK[topic];
  if (!T) return [];
  const seen = new Set(used.map((x) => norm(x.en || '')));
  return shuffle(T.items).filter((s) => !seen.has(norm(s.split('|')[1]))).slice(0, k).map((s) => makeItem(T, s));
}

// ─────────────────────────────────────────────────────────── профіль
export function weakTitle(cat) {
  if (BANK[cat]) return { title: BANK[cat].title, title_ru: BANK[cat].title_ru };
  if (cat.startsWith('vocab')) return { title: 'Слова', title_ru: 'Слова' };
  return { title: cat, title_ru: cat };
}
/** Теми з помилками: vocab:* зведено в одну «Слова». pct — частка правильних (засвоєно). */
export function weakStats(state, limit = 8) {
  const agg = {};
  for (const [cat, r] of Object.entries((state && state.weak) || {})) {
    const k = cat.startsWith('vocab:') ? 'vocab' : cat;
    const a = agg[k] || (agg[k] = { cat: k, ...weakTitle(k), miss: 0, ok: 0 });
    a.miss += r.miss || 0; a.ok += r.ok || 0;
  }
  return Object.values(agg).filter((a) => a.miss > 0)
    .map((a) => ({ ...a, pct: Math.round((100 * a.ok) / (a.ok + a.miss)) }))
    .sort((x, y) => (y.miss - y.ok) - (x.miss - x.ok)).slice(0, limit);
}
