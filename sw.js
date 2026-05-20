/* Fight Simulator offline service worker */
"use strict";

const CACHE_VERSION = "fight-simulator-offline-pwa-2.2.1";
const STATIC_CACHE = CACHE_VERSION + "-static";
const RUNTIME_CACHE = CACHE_VERSION + "-runtime";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./version.json",
  "./ring_top_view.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./src/styles.css",
  "./src/data/game-data.js",
  "./src/core/utils.js",
  "./src/core/storage.js",
  "./src/core/state.js",
  "./src/core/clubs.js",
  "./src/core/titles.js",
  "./src/core/stories.js",
  "./src/core/matchmaking.js",
  "./src/core/amateur.js",
  "./src/core/world.js",
  "./src/core/fight.js",
  "./src/ui/render.js",
  "./src/app.js",
  "./assets/flags/algeria.png",
  "./assets/flags/angola.png",
  "./assets/flags/argentina.png",
  "./assets/flags/armenia.png",
  "./assets/flags/australia.png",
  "./assets/flags/azerbaijan.png",
  "./assets/flags/belarus.png",
  "./assets/flags/belgium.png",
  "./assets/flags/bolivia.png",
  "./assets/flags/brazil.png",
  "./assets/flags/bulgaria.png",
  "./assets/flags/burkina_faso.png",
  "./assets/flags/cameroon.png",
  "./assets/flags/canada.png",
  "./assets/flags/chile.png",
  "./assets/flags/china.png",
  "./assets/flags/colombia.png",
  "./assets/flags/costa_rica.png",
  "./assets/flags/croatia.png",
  "./assets/flags/cuba.png",
  "./assets/flags/czechia.png",
  "./assets/flags/denmark.png",
  "./assets/flags/dominican_republic.png",
  "./assets/flags/drc.png",
  "./assets/flags/ecuador.png",
  "./assets/flags/egypt.png",
  "./assets/flags/el_salvador.png",
  "./assets/flags/estonia.png",
  "./assets/flags/ethiopia.png",
  "./assets/flags/finland.png",
  "./assets/flags/france.png",
  "./assets/flags/georgia.png",
  "./assets/flags/germany.png",
  "./assets/flags/ghana.png",
  "./assets/flags/greece.png",
  "./assets/flags/guatemala.png",
  "./assets/flags/haiti.png",
  "./assets/flags/honduras.png",
  "./assets/flags/hungary.png",
  "./assets/flags/india.png",
  "./assets/flags/indonesia.png",
  "./assets/flags/iran.png",
  "./assets/flags/iraq.png",
  "./assets/flags/ireland.png",
  "./assets/flags/israel.png",
  "./assets/flags/italy.png",
  "./assets/flags/ivory_coast.png",
  "./assets/flags/jamaica.png",
  "./assets/flags/japan.png",
  "./assets/flags/jordan.png",
  "./assets/flags/kazakhstan.png",
  "./assets/flags/kenya.png",
  "./assets/flags/latvia.png",
  "./assets/flags/libya.png",
  "./assets/flags/lithuania.png",
  "./assets/flags/malaysia.png",
  "./assets/flags/mali.png",
  "./assets/flags/mexico.png",
  "./assets/flags/moldova.png",
  "./assets/flags/mongolia.png",
  "./assets/flags/morocco.png",
  "./assets/flags/mozambique.png",
  "./assets/flags/netherlands.png",
  "./assets/flags/new_zealand.png",
  "./assets/flags/nicaragua.png",
  "./assets/flags/nigeria.png",
  "./assets/flags/norway.png",
  "./assets/flags/pakistan.png",
  "./assets/flags/panama.png",
  "./assets/flags/paraguay.png",
  "./assets/flags/peru.png",
  "./assets/flags/philippines.png",
  "./assets/flags/poland.png",
  "./assets/flags/puerto_rico.png",
  "./assets/flags/qatar.png",
  "./assets/flags/romania.png",
  "./assets/flags/russia.png",
  "./assets/flags/saudi_arabia.png",
  "./assets/flags/senegal.png",
  "./assets/flags/serbia.png",
  "./assets/flags/slovakia.png",
  "./assets/flags/south_africa.png",
  "./assets/flags/south_korea.png",
  "./assets/flags/spain.png",
  "./assets/flags/sweden.png",
  "./assets/flags/syria.png",
  "./assets/flags/tanzania.png",
  "./assets/flags/thailand.png",
  "./assets/flags/trinidad_tobago.png",
  "./assets/flags/tunisia.png",
  "./assets/flags/turkey.png",
  "./assets/flags/uae.png",
  "./assets/flags/uganda.png",
  "./assets/flags/uk.png",
  "./assets/flags/ukraine.png",
  "./assets/flags/uruguay.png",
  "./assets/flags/usa.png",
  "./assets/flags/uzbekistan.png",
  "./assets/flags/venezuela.png",
  "./assets/flags/vietnam.png",
  "./assets/flags/zambia.png",
  "./assets/flags/zimbabwe.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("fight-simulator-") && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put("./index.html", response.clone());
    }
    return response;
  } catch (error) {
    return (await cache.match("./index.html")) || Response.error();
  }
}

async function cacheFirstStatic(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const runtime = await caches.open(RUNTIME_CACHE);
      await runtime.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (request.destination === "document") {
      return caches.match("./index.html");
    }
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(cacheFirstStatic(request));
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
