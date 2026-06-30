/* Fight World service worker - F1 Mobile UI 2.5.0 */
"use strict";

const CACHE_VERSION = "fight-simulator-fight-history-hotfix-2.8.11.1";
const STATIC_CACHE = CACHE_VERSION + "-static";
const RUNTIME_CACHE = CACHE_VERSION + "-runtime";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./reset-cache.html",
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
  "./src/app.js"
];

function isFightWorldCache(key) {
  const value = String(key || "").toLowerCase();
  return value.includes("fight") || value.includes("simulator") || value.startsWith("fw-");
}

function cleanOldCaches() {
  return caches.keys().then((keys) => Promise.all(keys.map((key) => {
    if ((key !== STATIC_CACHE && key !== RUNTIME_CACHE) && isFightWorldCache(key)) {
      return caches.delete(key);
    }
    return false;
  })));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" }))).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(cleanOldCaches().then(() => self.clients.claim()));
});

function isAlwaysFresh(url) {
  return (
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith("version.json") ||
    url.pathname.endsWith("manifest.webmanifest")
  );
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(new Request(request, { cache: "no-store" }));
    if (response && response.ok && request.method === "GET") {
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") return caches.match("./index.html");
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok && request.method === "GET") {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (!request || request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate" || isAlwaysFresh(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") self.skipWaiting();
  if (data.type === "CLEAR_FIGHT_WORLD_CACHES") event.waitUntil(cleanOldCaches());
});
