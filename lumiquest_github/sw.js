// LumiQuest офлайн: кешуємо поточну версію повністю, щоб гра працювала без інтернету
const VER = "20261112181925", CACHE = "lq-" + VER, TG = "https://telegram.org/js/telegram-web-app.js";
const FILES = ["_sp2kit.js", "app.js", "arena.js", "arena.webp", "audio.js", "banner.webp", "bot_avatar.webp", "bot_description.webp", "brawl.js", "bubbles.js", "characters.js", "cheer.webp", "clock_adult.webp", "clock_baby.webp", "clock_egg.webp", "clock_legend.webp", "clock_teen.webp", "content.json", "countries.css", "countries_games.css", "countries_games2.css", "cover_boss.webp", "cover_brawl.webp", "cover_bubbles.webp", "cover_drama.webp", "cover_durak.webp", "cover_fishing.webp", "cover_lesson.webp", "cover_listen.webp", "cover_memory.webp", "cover_obby.webp", "cover_phrases.webp", "cover_resto.webp", "cover_review.webp", "cover_runner.webp", "cover_story.webp", "cover_trip.webp", "cover_verbs.webp", "cover_wordle.webp", "crystal_adult.webp", "crystal_baby.webp", "crystal_egg.webp", "crystal_legend.webp", "crystal_teen.webp", "customs.js", "dragons.js", "drama.js", "durak.js", "durak.webp", "exam.js", "excited.webp", "festival.js", "fishing.js", "forest_adult.webp", "forest_baby.webp", "forest_egg.webp", "forest_legend.webp", "forest_teen.webp", "fx.js", "games.css", "games.js", "games2.css", "games3.css", "games4.css", "globe.js", "happy.webp", "hello.webp", "home.js", "i18n.js", "i18n_modes.js", "index.html", "inter-bold-cyr.woff", "inter-extrabold-cyr.woff", "inter-medium-cyr.woff", "landmark.js", "listen.js", "lumi.js", "map.js", "map.webp", "memory.js", "modes.css", "obby.js", "passport.js", "phrases.js", "placement.js", "poppins-bold.woff", "poppins-medium.woff", "profile.js", "proud.webp", "quest.js", "quizwhere.js", "resto.js", "review.js", "riddle.js", "runner.js", "sad.webp", "sky_adult.webp", "sky_baby.webp", "sky_egg.webp", "sky_legend.webp", "sky_teen.webp", "slang.js", "sleepy.webp", "special_c1.js", "special_c10.js", "special_c11.js", "special_c12.js", "special_c2.js", "special_c3.js", "special_c4.js", "special_c5.js", "special_c6.js", "special_c7.js", "special_c8.js", "special_c9.js", "special_kit.js", "state.js", "storage.js", "story.js", "style.css", "sun_adult.webp", "sun_baby.webp", "sun_egg.webp", "sun_legend.webp", "sun_teen.webp", "surprised.webp", "tg.js", "theme.js", "thinking.webp", "travel.js", "trip.js", "ui.js", "verbs.js", "verbsbook.js", "w1.webp", "w2.webp", "w3.webp", "w4.webp", "w5.webp", "weak.css", "weak.js", "weakspots.js", "wordle.js", "world.js"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(async (c) => {
    await c.addAll(["./", "index.html", "version.json", ...FILES.map((f) => "v" + VER + "/" + f)]);
    try { await c.put(TG, await fetch(TG, { mode: "no-cors" })); } catch (_) {}
  }).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("lq-") && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  const net = u.pathname.endsWith("version.json") || u.pathname.endsWith("/") || u.pathname.endsWith("/index.html") && !/\/v\d{14}\//.test(u.pathname) || u.href.startsWith(TG);
  if (net) {   // спершу мережа, без мережі — кеш
    e.respondWith(fetch(r).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(u.href.startsWith(TG) ? TG : r, cp)); return res; })
      .catch(() => caches.match(u.href.startsWith(TG) ? TG : r, { ignoreSearch: true })));
    return;
  }
  if (u.origin !== location.origin) return;
  e.respondWith(caches.match(r, { ignoreSearch: true }).then((hit) => hit || fetch(r).then((res) => {
    if (res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)); }
    return res;
  })));
});
