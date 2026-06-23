// FightSimulator Cleanup + Merge 2.4.1
// Run from repository root:
//   node cleanup-and-merge-2.4.1.cjs

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const VERSION = "clean-ui-2.4.1";
const SCHEMA = 241;

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function write(rel, text) {
  fs.mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, rel), text, "utf8");
}

function remove(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return;
  fs.rmSync(full, { recursive: true, force: true });
  console.log("removed:", rel);
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === ".git") continue;
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, out);
    } else {
      out.push(rel);
    }
  }
  return out;
}

function backupRepo() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.resolve(ROOT, "..", "FightSimulator_backup_before_cleanup_" + stamp);
  fs.cpSync(ROOT, backup, {
    recursive: true,
    filter: (src) => !src.includes(path.sep + ".git" + path.sep) && !src.endsWith(path.sep + ".git")
  });
  console.log("backup:", backup);
}

function normalizeRel(rel) {
  return rel.replace(/\\/g, "/");
}

function isKept(rel) {
  rel = normalizeRel(rel);

  const exact = new Set([
    ".nojekyll",
    ".github/workflows/pages.yml",
    "index.html",
    "manifest.webmanifest",
    "reset-cache.html",
    "sw.js",
    "version.json",
    "ring_top_view.png",
    "README.md",
    "LICENSE",
    "src/styles.css",
    "src/app.js",
    "src/ui/render.js",
    "src/data/game-data.js",
    "src/core/utils.js",
    "src/core/storage.js",
    "src/core/state.js",
    "src/core/clubs.js",
    "src/core/titles.js",
    "src/core/stories.js",
    "src/core/matchmaking.js",
    "src/core/amateur.js",
    "src/core/world.js",
    "src/core/fight.js",
    "assets/icons/apple-touch-icon.png",
    "assets/icons/icon-192.png",
    "assets/icons/icon-512.png"
  ]);

  if (exact.has(rel)) return true;
  return false;
}

function assertCore() {
  const required = [
    "index.html",
    "src/styles.css",
    "src/app.js",
    "src/ui/render.js",
    "src/data/game-data.js",
    "src/core/utils.js",
    "src/core/storage.js",
    "src/core/state.js",
    "src/core/world.js",
    "src/core/fight.js"
  ];

  const missing = required.filter((rel) => !exists(rel));
  if (missing.length) {
    throw new Error("Missing core files:\n" + missing.join("\n"));
  }
}

function cleanFiles() {
  console.log("\n== cleanup files ==");
  const files = walk(ROOT);
  const removed = [];

  for (const rel of files) {
    if (rel.startsWith(".git/")) continue;
    if (!isKept(rel)) {
      removed.push(rel);
      remove(rel);
    }
  }

  // Remove empty directories from deep to shallow.
  const dirs = [];
  function collectDirs(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      if (name === ".git") continue;
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) {
        collectDirs(full);
        dirs.push(full);
      }
    }
  }
  collectDirs(ROOT);
  dirs.sort((a, b) => b.length - a.length);
  for (const dir of dirs) {
    if (dir === ROOT) continue;
    if (!fs.existsSync(dir)) continue;
    if (fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
    }
  }

  console.log("removed files:", removed.length);
}

const UI_CSS = `
/* ===== Clean UI 2.4.1: merged from old UI patches ===== */
:root {
  --bg: #eef4ff;
  --bg-2: #f7faff;
  --panel: rgba(255, 255, 255, 0.88);
  --panel-2: rgba(248, 251, 255, 0.92);
  --panel-3: #edf4ff;
  --line: rgba(36, 58, 98, 0.14);
  --text: #142033;
  --muted: #64748b;
  --red: #ef4444;
  --red-dark: #dc2626;
  --gold: #f59e0b;
  --green: #16a34a;
  --blue: #2563eb;
  --shadow: 0 18px 46px rgba(43, 72, 118, 0.13);
  --radius: 18px;
  --radius-lg: 26px;
}

html,
body {
  background:
    radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.13), transparent 320px),
    radial-gradient(circle at 100% 0%, rgba(245, 158, 11, 0.16), transparent 320px),
    linear-gradient(180deg, #eef4ff, #f8fbff 42%, #eef4ff);
  color: var(--text);
}

button {
  background: rgba(255,255,255,.76);
  border-color: rgba(36,58,98,.14);
  box-shadow: 0 5px 15px rgba(43,72,118,.06);
}

button:hover {
  background: #ffffff;
  border-color: rgba(37,99,235,.28);
}

button.primary,
button.active {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  border-color: rgba(37,99,235,.42);
  color: #fff;
}

button.danger {
  background: #fff1f2;
  border-color: rgba(239,68,68,.28);
  color: #b91c1c;
}

input,
select {
  background: rgba(255,255,255,.86);
  border-color: rgba(36,58,98,.14);
  color: var(--text);
}

input:focus,
select:focus {
  border-color: rgba(37,99,235,.48);
  box-shadow: 0 0 0 4px rgba(37,99,235,.12);
}

.app-shell {
  width: min(1320px, calc(100% - 24px));
  padding: 16px 0 34px;
}

.topbar.compact-topbar,
.compact-topbar {
  position: sticky;
  top: 10px;
  z-index: 30;
  margin-bottom: 12px;
  padding: 10px;
  border: 1px solid rgba(36,58,98,.12);
  border-radius: 24px;
  background: rgba(255,255,255,.82);
  backdrop-filter: blur(16px);
  box-shadow: 0 12px 34px rgba(43,72,118,.12);
}

.top-pills,
.player-strip {
  display: flex !important;
  align-items: center !important;
  gap: 7px !important;
  flex-wrap: nowrap !important;
  overflow-x: auto !important;
  padding-bottom: 2px;
}

.pill,
.mini-chip,
.pill-link {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  width: auto !important;
  max-width: max-content !important;
  flex: 0 0 auto !important;
  white-space: nowrap !important;
  border-radius: 999px !important;
  border: 1px solid rgba(36,58,98,.12) !important;
  background: rgba(255,255,255,.76) !important;
  color: #334155 !important;
  padding: 6px 10px !important;
  font-size: 12px !important;
  line-height: 1.1 !important;
}

.pill.blue,
.mini-chip.blue {
  background: rgba(37,99,235,.10) !important;
  border-color: rgba(37,99,235,.22) !important;
  color: #1d4ed8 !important;
}

.pill.gold,
.mini-chip.gold {
  background: rgba(245,158,11,.12) !important;
  border-color: rgba(245,158,11,.25) !important;
  color: #92400e !important;
}

.pill.green,
.rank-pill {
  background: rgba(22,163,74,.11) !important;
  border-color: rgba(22,163,74,.24) !important;
  color: #166534 !important;
}

.pill.red {
  background: rgba(239,68,68,.10) !important;
  border-color: rgba(239,68,68,.22) !important;
  color: #b91c1c !important;
}

.layout.single-layout {
  display: block !important;
  padding: 0 !important;
}

.ui-remake-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.ui-side-nav {
  position: sticky;
  top: 88px;
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(36,58,98,.12);
  border-radius: 26px;
  background: rgba(255,255,255,.82);
  backdrop-filter: blur(16px);
  box-shadow: var(--shadow);
}

.side-title {
  display: grid;
  gap: 3px;
  padding: 4px 4px 10px;
  border-bottom: 1px solid rgba(36,58,98,.10);
}

.side-title span {
  font-size: 18px;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.side-title small {
  color: var(--muted);
}

.tabs.side-tabs,
.side-tabs {
  display: grid !important;
  gap: 7px !important;
  margin: 0 !important;
  overflow: visible !important;
  padding: 0 !important;
}

.side-tabs button {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  min-height: 38px;
  padding: 9px 11px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 800;
  text-align: left;
  white-space: nowrap;
}

.ui-remake-main,
.panel,
.content-card,
.stat-card,
.skills,
.offer,
.modal {
  background: var(--panel);
  border-color: rgba(36,58,98,.12);
  box-shadow: var(--shadow);
}

.ui-remake-main {
  padding: 14px;
  min-width: 0;
}

.feed {
  background: linear-gradient(135deg, rgba(37,99,235,.08), rgba(245,158,11,.08));
  border-color: rgba(36,58,98,.12);
  color: #334155;
  margin: 0 0 12px;
  padding: 10px 12px;
}

.content-card,
.stat-card,
.skills,
.offer {
  border-radius: 20px;
}

h1,
h2,
h3 {
  color: #0f172a;
}

.label,
.muted,
.small {
  color: var(--muted);
}

.split-row {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto !important;
  align-items: center !important;
  gap: 10px !important;
  min-width: 0 !important;
}

.split-row > div,
.split-row > span,
.split-row > strong {
  min-width: 0 !important;
  overflow-wrap: normal !important;
}

.split-row > strong:last-child,
.split-row > span:last-child {
  justify-self: end;
  text-align: right;
  white-space: nowrap;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.name-line,
.fighter-name-btn,
.fighter-link,
.fw-tight-name {
  max-width: 220px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

.country-label {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  width: auto !important;
  min-width: 0 !important;
  max-width: 150px !important;
  white-space: nowrap !important;
}

.country-label span {
  overflow: hidden;
  text-overflow: ellipsis;
}

.flag-icon {
  width: 18px;
  height: 12px;
  object-fit: cover;
  border-radius: 3px;
  flex: 0 0 auto;
}

.ranking-list,
.club-browser-list,
.club-select-list,
.offer-list,
.people-list,
.fight-lines {
  display: grid !important;
  gap: 8px !important;
}

.ranking-entry,
.club-browser-row,
.club-select-row,
.compact-offer,
.fight-line {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  width: 100% !important;
  min-width: 0 !important;
  padding: 8px 10px !important;
  border: 1px solid rgba(36,58,98,.11) !important;
  border-radius: 16px !important;
  background: rgba(255,255,255,.68) !important;
  overflow-x: auto !important;
}

.ranking-top,
.ranking-name-wrap,
.club-browser-main,
.club-select-info,
.fight-line-main,
.compact-fight-info {
  display: flex !important;
  align-items: center !important;
  gap: 7px !important;
  min-width: 0 !important;
  flex-wrap: nowrap !important;
  overflow-x: auto !important;
}

.fight-line > *,
.compact-offer > *,
.club-browser-row > *,
.club-select-row > * {
  flex: 0 0 auto !important;
}

.fight-line-btn {
  min-width: 58px !important;
  padding: 7px 12px !important;
}

.modal-backdrop {
  background: rgba(35, 49, 78, 0.38);
  backdrop-filter: blur(8px);
}

.modal-head {
  background: rgba(248,251,255,.90);
  border-bottom-color: rgba(36,58,98,.12);
}

.fight-window-body {
  background: #eef4ff;
}

.fight-log {
  background: rgba(255,255,255,.68);
  border-color: rgba(36,58,98,.12);
  color: #334155;
}

.ring-grid {
  border-color: rgba(37,99,235,.24);
  box-shadow: inset 0 0 0 999px rgba(255,255,255,.06), var(--shadow);
}

@media (max-width: 920px) {
  .app-shell {
    width: calc(100% - 12px);
    padding-top: 8px;
  }

  .topbar.compact-topbar {
    top: 4px;
    border-radius: 18px;
  }

  .ui-remake-layout {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .ui-side-nav {
    position: sticky;
    top: 72px;
    z-index: 25;
    padding: 10px;
    border-radius: 20px;
  }

  .side-title {
    display: none;
  }

  .tabs.side-tabs {
    display: flex !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    gap: 6px !important;
  }

  .side-tabs button {
    width: auto;
    flex: 0 0 auto;
    min-height: 34px;
    padding: 8px 10px;
    font-size: 12px;
  }

  .ui-remake-main {
    padding: 9px;
    border-radius: 18px;
  }

  .feed {
    font-size: 12px;
  }

  .split-row > strong:last-child,
  .split-row > span:last-child {
    max-width: 150px;
  }

  .country-label {
    max-width: 96px !important;
  }
}

@media (max-width: 560px) {
  .app-shell {
    width: 100%;
    padding: 6px 6px 18px;
  }

  .top-pills,
  .player-strip {
    gap: 5px !important;
  }

  .pill,
  .mini-chip,
  .pill-link {
    padding: 5px 7px !important;
    font-size: 11px !important;
  }

  .content-card,
  .stat-card,
  .skills,
  .offer {
    padding: 10px;
    border-radius: 16px;
  }

  .ranking-entry,
  .club-browser-row,
  .club-select-row,
  .compact-offer,
  .fight-line {
    padding: 7px !important;
    gap: 6px !important;
  }

  .fighter-name-btn,
  .fighter-link,
  .fw-tight-name {
    max-width: 132px !important;
  }

  .split-row > strong:last-child,
  .split-row > span:last-child {
    max-width: 118px;
  }

  .modal {
    width: calc(100vw - 12px);
    max-width: calc(100vw - 12px);
    border-radius: 18px;
  }
}
/* ===== /Clean UI 2.4.1 ===== */
`;

function patchStyles() {
  console.log("\n== merge CSS ==");
  let css = read("src/styles.css");

  // Remove older appended blocks if the script was rerun.
  css = css.replace(/\/\* ===== Clean UI 2\.4\.1:[\s\S]*?\/\* ===== \/Clean UI 2\.4\.1 ===== \*\//g, "").trimEnd();

  css += "\n\n" + UI_CSS.trim() + "\n";
  write("src/styles.css", css);
}

function patchIndex() {
  console.log("\n== merge index.html ==");
  let html = read("index.html");

  // Remove every old patch script and the temporary external UI CSS if present.
  html = html.replace(/\r?\n\s*<script\s+src=["']src\/patches\/[^"']+\.js(?:\?[^"']*)?["']><\/script>/g, "");
  html = html.replace(/\r?\n\s*<link\s+rel=["']stylesheet["']\s+href=["']src\/ui-remake-[^"']+\.css(?:\?[^"']*)?["']\s*>/g, "");

  // Theme becomes clean light.
  html = html.replace(/<meta name="theme-color" content="[^"]*">/, '<meta name="theme-color" content="#eef4ff">');
  html = html.replace(/<meta name="apple-mobile-web-app-status-bar-style" content="[^"]*">/, '<meta name="apple-mobile-web-app-status-bar-style" content="default">');

  if (!/http-equiv=["']Cache-Control["']/i.test(html)) {
    html = html.replace(
      /(<meta\s+charset=["']utf-8["']\s*\/?\s*>)/i,
      '$1\n  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0">\n  <meta http-equiv="Pragma" content="no-cache">\n  <meta http-equiv="Expires" content="0">'
    );
  }

  write("index.html", html);
}

function patchVersionFiles() {
  console.log("\n== merge version files ==");

  let data = read("src/data/game-data.js");
  if (/appVersion\s*:\s*["'`][^"'`]*["'`]/.test(data)) {
    data = data.replace(/appVersion\s*:\s*["'`][^"'`]*["'`]/, `appVersion: "${VERSION}"`);
  }
  if (/saveSchemaVersion\s*:\s*\d+/.test(data)) {
    data = data.replace(/saveSchemaVersion\s*:\s*\d+/, `saveSchemaVersion: ${SCHEMA}`);
  }
  write("src/data/game-data.js", data);

  write("version.json", JSON.stringify({
    version: VERSION,
    mode: "clean-main-files",
    cacheVersion: "fight-simulator-clean-ui-2.4.1",
    resetPage: "reset-cache.html",
    localCleanPort: 5189
  }, null, 2) + "\n");

  write("manifest.webmanifest", JSON.stringify({
    name: "Fight World",
    short_name: "FightWorld",
    id: "./",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#eef4ff",
    theme_color: "#eef4ff",
    lang: "ru",
    orientation: "portrait",
    description: "Offline boxing career simulator with persistent saves.",
    icons: [
      { src: "assets/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "assets/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "assets/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  }, null, 2) + "\n");
}

function patchServiceWorker() {
  console.log("\n== merge service worker ==");
  const sw = `/* Fight World service worker - Clean UI 2.4.1 */
"use strict";

const CACHE_VERSION = "fight-simulator-clean-ui-2.4.1";
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
`;
  write("sw.js", sw);
}

function patchResetCache() {
  console.log("\n== merge reset-cache ==");
  const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <title>Fight World reset</title>
  <style>
    body { margin:0; min-height:100vh; display:grid; place-items:center; background:#eef4ff; color:#142033; font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    .card { width:min(720px,calc(100vw - 28px)); border:1px solid rgba(36,58,98,.14); border-radius:22px; padding:22px; background:rgba(255,255,255,.88); box-shadow:0 24px 80px rgba(43,72,118,.18); }
    h1 { margin:0 0 8px; font-size:24px; }
    p { color:#64748b; line-height:1.5; }
    pre { white-space:pre-wrap; background:#f8fbff; border:1px solid rgba(36,58,98,.12); border-radius:14px; padding:14px; max-height:340px; overflow:auto; color:#334155; }
    a,button { display:inline-flex; align-items:center; justify-content:center; min-height:38px; padding:0 14px; border-radius:12px; border:1px solid rgba(37,99,235,.22); background:#2563eb; color:white; text-decoration:none; font-weight:700; cursor:pointer; }
  </style>
</head>
<body>
  <main class="card">
    <h1>Fight World reset</h1>
    <p>Сбрасываю старый Service Worker и кэш. Сохранение карьеры не трогаю.</p>
    <pre id="log">start</pre>
    <a id="go" href="index.html?cacheReset=2.4.1">Открыть игру</a>
  </main>
  <script>
    const log = document.getElementById("log");
    function line(text) { log.textContent += "\\n" + text; }
    async function clean() {
      try {
        if ("serviceWorker" in navigator && navigator.serviceWorker.getRegistrations) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            await reg.unregister();
            line("service worker removed");
          }
        }
        if (window.caches && caches.keys) {
          const keys = await caches.keys();
          for (const key of keys) {
            const low = String(key).toLowerCase();
            if (low.includes("fight") || low.includes("simulator") || low.startsWith("fw-")) {
              await caches.delete(key);
              line("cache removed: " + key);
            }
          }
        }
      } catch (error) {
        line("error: " + error.message);
      }
      line("done");
      setTimeout(() => { location.href = "index.html?cacheReset=2.4.1&t=" + Date.now(); }, 700);
    }
    clean();
  </script>
</body>
</html>
`;
  write("reset-cache.html", html);
}

function patchRenderJs() {
  console.log("\n== merge render.js ==");
  let js = read("src/ui/render.js");

  const labels = {
    dashboard: "🏠 Обзор",
    profile: "🥊 Профиль",
    fights: "🔥 Бои",
    favorites: "⭐ Избранные",
    news: "📰 Новости",
    training: "📈 Статы",
    ranking: "🏆 Рейтинг",
    myclub: "🏟️ Мой клуб",
    clubs: "🏛️ Клубы",
    people: "👥 Люди",
    settings: "⚙️ Настройки",
    pro: "💼 Профи",
    world: "🌍 Люб. путь"
  };

  for (const [id, label] of Object.entries(labels)) {
    const rx = new RegExp('\\["' + id + '",\\s*"[^"]*"\\]', "g");
    js = js.replace(rx, '["' + id + '", "' + label + '"]');
  }

  if (!js.includes("ui-remake-layout")) {
    const oldReturn = 'return "<section class=\\"panel main-panel\\">" + renderTabs(state) + "<div class=\\"tab-scroll-area\\"><div class=\\"feed\\">" + U.escapeHtml(state.feed || "Готово.") + "</div>" + content + "</div></section>";';
    const newBlock = [
      'var sideTabs = renderTabs(state).replace(\'class="tabs"\', \'class="tabs side-tabs"\');',
      'var trackLabel = p && p.trackId ? U.findTrack(p.trackId).label : "Карьера";',
      'return "<div class=\\"ui-remake-layout\\"><aside class=\\"ui-side-nav\\"><div class=\\"side-title\\"><span>🥊 Fight World</span><small>" + U.escapeHtml(trackLabel) + "</small></div>" + sideTabs + "</aside><section class=\\"panel main-panel ui-remake-main\\"><div class=\\"tab-scroll-area\\"><div class=\\"feed\\">" + U.escapeHtml(state.feed || "Готово.") + "</div>" + content + "</div></section></div>";'
    ].join("\n    ");

    if (js.includes(oldReturn)) {
      js = js.replace(oldReturn, newBlock);
    } else {
      console.warn("WARN: renderMain return pattern not found. Side menu was not merged.");
    }

    const oldDashboard = 'return renderHeader(state) + "<div class=\\"layout single-layout\\">" + renderMain(state) + "</div>" + renderModal(state);';
    const newDashboard = 'return renderHeader(state) + renderMain(state) + renderModal(state);';
    if (js.includes(oldDashboard)) {
      js = js.replace(oldDashboard, newDashboard);
    }
  }

  write("src/ui/render.js", js);
}

const GAMEPLAY_FIX_BLOCK = `
  function applyIntegratedGameplayFixes(targetState) {
    var U = window.FS && window.FS.Utils ? window.FS.Utils : {};
    var D = window.FS && window.FS.Data ? window.FS.Data : {};
    var T = window.FS && window.FS.Titles ? window.FS.Titles : {};

    function byId(id) {
      if (!targetState || !id) { return null; }
      if (U.getFighterById) { return U.getFighterById(targetState, id); }
      return (targetState.roster || []).find(function (fighter) { return fighter && fighter.id === id; }) || null;
    }

    function ovr(fighter) {
      if (!fighter) { return 0; }
      if (U.statAverage) { return U.statAverage(fighter.stats || fighter); }
      return Math.round(Number(fighter.ovr || fighter.rating || 0));
    }

    function ensureAges() {
      if (!targetState || !targetState.roster) { return; }
      var week = Number(targetState.week) || 1;
      targetState.roster.forEach(function (fighter) {
        var age;
        if (!fighter) { return; }
        age = Math.max(14, Number(fighter.age) || (fighter.isPlayer ? 18 : 20));
        if (!fighter.birthWeek) {
          fighter.birthWeek = Math.max(1, week - age * 48);
          fighter.birthYear = Math.floor((fighter.birthWeek - 1) / 48) + 1;
          fighter.birthMonth = Math.floor(((fighter.birthWeek - 1) % 48) / 4) + 1;
          fighter.birthWeekOfMonth = ((fighter.birthWeek - 1) % 4) + 1;
        }
        fighter.age = Math.max(14, Math.floor((week - fighter.birthWeek) / 48));
        fighter.birthdayLabel = "год " + fighter.birthYear + ", месяц " + fighter.birthMonth + ", " + fighter.birthWeekOfMonth + " неделя";
      });
    }

    function updateStreetRating() {
      if (!targetState || !targetState.roster) { return; }
      targetState.roster.forEach(function (fighter) {
        var record;
        var total;
        var winRate;
        if (!fighter || fighter.trackId !== "street") { return; }
        record = fighter.record || {};
        total = (record.wins || 0) + (record.losses || 0) + (record.draws || 0);
        winRate = total ? ((record.wins || 0) + 0.5 * (record.draws || 0)) / total : 0.5;
        fighter.streetRating = Math.round(ovr(fighter) * 0.8 + Math.round(winRate * 150) * 0.2);
      });
    }

    function updateProCadence() {
      var list;
      if (!targetState || !targetState.roster) { return; }
      list = targetState.roster.filter(function (fighter) {
        return fighter && fighter.trackId === "pro" && !fighter.retired;
      }).sort(function (a, b) {
        return (ovr(b) + ((b.record && b.record.wins) || 0)) - (ovr(a) + ((a.record && a.record.wins) || 0));
      });

      list.forEach(function (fighter, index) {
        var total = Math.max(1, list.length - 1);
        var t = index / total;
        var wait = Math.round(20 - t * 10);
        if (index < 4) { wait = 20; }
        else if (index < 25) { wait = 15; }
        else if (wait < 10) { wait = 10; }
        fighter.proFightIntervalWeeks = wait;
        if (!fighter.contractOpponentId && !fighter.nextFightWeek) {
          fighter.nextFightWeek = (Number(targetState.week) || 1) + wait;
        }
      });
    }

    function repairProTitles() {
      if (!targetState || !targetState.roster || !D.weightClasses) { return; }
      targetState.titles = targetState.titles || {};
      ["wbc", "wba", "wbo", "ibf"].forEach(function (bodyId) {
        D.weightClasses.forEach(function (weight) {
          var id = "pro_" + bodyId + "_" + weight.id;
          var title = targetState.titles[id];
          var champion = title && byId(title.championId);
          var pool;
          if (champion && !champion.retired) { return; }
          pool = targetState.roster.filter(function (fighter) {
            return fighter && fighter.trackId === "pro" && fighter.weightClassId === weight.id && !fighter.retired;
          }).sort(function (a, b) { return ovr(b) - ovr(a); });
          if (pool[0]) {
            targetState.titles[id] = Object.assign(title || {}, {
              id: id,
              trackId: "pro",
              countryId: "world",
              weightClassId: weight.id,
              bodyId: bodyId,
              label: bodyId.toUpperCase(),
              championId: pool[0].id,
              active: true
            });
          }
        });
      });
    }

    function addForeignAmateurOffers() {
      var player;
      var rank;
      var pool;
      if (!targetState || !targetState.offers) { return; }
      player = State.player(targetState);
      if (!player || player.trackId !== "amateur") { return; }
      rank = player.amateurRankId || "";
      if (["ms", "msmk"].indexOf(rank) === -1) { return; }
      if (targetState.offers.some(function (offer) {
        var fighter = byId(offer.opponentId);
        return fighter && fighter.countryId !== player.countryId;
      })) { return; }

      pool = (targetState.roster || []).filter(function (fighter) {
        return fighter &&
          fighter.trackId === "amateur" &&
          fighter.weightClassId === player.weightClassId &&
          fighter.countryId !== player.countryId &&
          Math.abs(ovr(fighter) - ovr(player)) <= 18;
      });

      for (var i = 0; i < Math.min(3, pool.length, targetState.offers.length); i += 1) {
        targetState.offers[i].opponentId = pool[i].id;
      }
    }

    function tournamentXp() {
      var modal = targetState && targetState.modal;
      var player;
      var key;
      var opponentRating;
      var gain;
      if (!modal || modal.type !== "tournamentResult" || !modal.session) { return; }
      player = State.player(targetState);
      if (!player) { return; }
      key = [targetState.week, modal.label, modal.roundLabel, modal.opponentName, modal.result].join("|");
      if (targetState.__lastTournamentXpKey === key) { return; }
      targetState.__lastTournamentXpKey = key;
      opponentRating = Number(modal.opponentRating) || 0;
      gain = modal.result === "Победа" ? Math.max(3, Math.round(3 + (opponentRating - ovr(player)) / 12)) : 2;
      player.trainingPoints = (Number(player.trainingPoints) || 0) + gain;
    }

    ensureAges();
    updateStreetRating();
    updateProCadence();
    repairProTitles();
    addForeignAmateurOffers();
    tournamentXp();
  }
`;

function patchAppJs() {
  console.log("\n== merge app.js ==");
  let js = read("src/app.js");

  // Integrate gameplay fixes into the real app instead of external patch files.
  if (!js.includes("function applyIntegratedGameplayFixes")) {
    const marker = "\n  function render() {";
    if (js.includes(marker)) {
      js = js.replace(marker, "\n" + GAMEPLAY_FIX_BLOCK + marker);
    } else {
      console.warn("WARN: render() marker not found. Gameplay fixes were not merged.");
    }
  }

  if (!js.includes("applyIntegratedGameplayFixes(state);")) {
    const renderRepairMarker = "    State.repairState(state);\n\n    var normalOfferCount";
    if (js.includes(renderRepairMarker)) {
      js = js.replace(
        renderRepairMarker,
        "    applyIntegratedGameplayFixes(state);\n    State.repairState(state);\n\n    var normalOfferCount"
      );
    } else {
      console.warn("WARN: render repair marker not found. Gameplay fixes were added but not called from render().");
    }
  }

  // Replace old update button target with clean reset.
  const updateBlockRx = /function applyUpdateNow\(\)\s*\{[\s\S]*?\n  \}\n\n  function checkRemoteVersion/;
  const updateBlock = `function applyUpdateNow() {
    updateReloading = true;
    persistNow();

    function go() {
      window.location.replace("./reset-cache.html?fromUpdateButton=2.4.1&target=2.4.1&t=" + Date.now());
    }

    function clearFightCaches() {
      if (!window.caches || !caches.keys) { return Promise.resolve(); }
      return caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (key) {
          var low = String(key || "").toLowerCase();
          if (low.indexOf("fight") !== -1 || low.indexOf("simulator") !== -1 || low.indexOf("fw-") === 0) {
            return caches.delete(key);
          }
          return false;
        }));
      });
    }

    function unregisterServiceWorkers() {
      if (!("serviceWorker" in navigator) || !navigator.serviceWorker.getRegistrations) {
        return Promise.resolve();
      }
      return navigator.serviceWorker.getRegistrations().then(function (registrations) {
        return Promise.all(registrations.map(function (registration) {
          return registration.unregister();
        }));
      });
    }

    unregisterServiceWorkers().then(clearFightCaches).then(go).catch(go);
  }

  function checkRemoteVersion`;

  if (updateBlockRx.test(js)) {
    js = js.replace(updateBlockRx, updateBlock);
  } else {
    js = js.replace(/fromUpdateButton=\d+\.\d+\.\d+/g, "fromUpdateButton=2.4.1");
    js = js.replace(/cacheReset=\d+\.\d+\.\d+/g, "cacheReset=2.4.1");
  }

  write("src/app.js", js);
}

function verify() {
  console.log("\n== verify ==");
  const index = read("index.html");
  const styles = read("src/styles.css");
  const render = read("src/ui/render.js");
  const app = read("src/app.js");

  const errors = [];
  if (/src\/patches\//.test(index)) errors.push("index.html still references src/patches");
  if (!styles.includes("Clean UI 2.4.1")) errors.push("styles.css missing Clean UI block");
  if (!render.includes("ui-remake-layout")) errors.push("render.js missing side layout");
  if (!app.includes("applyIntegratedGameplayFixes")) errors.push("app.js missing integrated gameplay fixes");
  if (exists("src/patches")) errors.push("src/patches still exists");

  if (errors.length) {
    throw new Error("Verification failed:\n" + errors.join("\n"));
  }

  console.log("OK: clean merged repo");
}

function main() {
  assertCore();
  backupRepo();

  patchIndex();
  patchStyles();
  patchRenderJs();
  patchAppJs();
  patchVersionFiles();
  patchServiceWorker();
  patchResetCache();

  // Now delete everything not in final whitelist, including old patches/scripts/docs.
  cleanFiles();

  verify();

  console.log("\nDONE.");
  console.log("Run:");
  console.log("  git status");
  console.log("  node --check src/app.js");
  console.log("  node --check src/ui/render.js");
  console.log("Then local test:");
  console.log("  py -m http.server 5189");
  console.log("  http://localhost:5189/reset-cache.html");
  console.log("Commit:");
  console.log('  git add .');
  console.log('  git commit -m "Clean repo and merge UI fixes into core files"');
  console.log("  git push origin main");
}

main();
