// FightSimulator F1 Dynasty-inspired Mobile UI 2.5.0
// Run from repository root:
//   node apply-f1-mobile-ui-2.5.0.cjs

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const VERSION = "f1-mobile-ui-2.5.0";
const SCHEMA = 250;

function full(rel) {
  return path.join(ROOT, rel);
}

function exists(rel) {
  return fs.existsSync(full(rel));
}

function read(rel) {
  return fs.readFileSync(full(rel), "utf8");
}

function write(rel, text) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), text, "utf8");
}

function backupRepo() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.resolve(ROOT, "..", "FightSimulator_backup_before_f1_mobile_ui_" + stamp);
  fs.cpSync(ROOT, backup, {
    recursive: true,
    filter: (src) => !src.includes(path.sep + ".git" + path.sep) && !src.endsWith(path.sep + ".git")
  });
  console.log("backup:", backup);
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

function findFunctionRange(source, functionName) {
  const marker = "function " + functionName + "(";
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error("Function not found: " + functionName);
  }

  const open = source.indexOf("{", start);
  if (open === -1) {
    throw new Error("Function open brace not found: " + functionName);
  }

  let depth = 0;
  let inString = null;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === inString) {
        inString = null;
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (ch === "\"" || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }

    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return { start, end: i + 1 };
      }
    }
  }

  throw new Error("Function close brace not found: " + functionName);
}

function replaceFunction(source, functionName, replacement) {
  const range = findFunctionRange(source, functionName);
  return source.slice(0, range.start) + replacement + source.slice(range.end);
}

const F1_CSS = `
/* ===== F1 Mobile UI 2.5.0 ===== */
:root {
  --bg: #05070a;
  --bg-2: #090d12;
  --panel: #0f141b;
  --panel-2: #151b24;
  --panel-3: #1b2330;
  --line: rgba(255,255,255,.08);
  --text: #f5f7fb;
  --muted: #8d99aa;
  --red: #ff3b30;
  --red-dark: #d92820;
  --gold: #ffb020;
  --green: #24c46b;
  --blue: #4aa3ff;
  --accent: #ff3b30;
  --accent-2: #ff6b4a;
  --shadow: 0 20px 60px rgba(0,0,0,.48);
  --radius: 18px;
  --radius-lg: 26px;
}

html,
body {
  min-height: 100%;
  background:
    radial-gradient(circle at 50% -160px, rgba(255,59,48,.28), transparent 340px),
    radial-gradient(circle at 100% 0%, rgba(74,163,255,.12), transparent 320px),
    linear-gradient(180deg, #05070a, #080b10 42%, #05070a);
  color: var(--text);
}

body {
  padding-bottom: env(safe-area-inset-bottom);
}

button,
input,
select {
  color: var(--text);
}

button {
  background: linear-gradient(180deg, #1a212d, #111720);
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 14px;
  box-shadow: none;
}

button:hover {
  background: linear-gradient(180deg, #232d3c, #151c27);
  border-color: rgba(255,255,255,.16);
  transform: none;
}

button.primary,
button.active {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  border-color: rgba(255,105,74,.55);
  color: #fff;
}

button.danger {
  background: rgba(255,59,48,.12);
  border-color: rgba(255,59,48,.28);
  color: #ff9b93;
}

input,
select {
  background: #0b1017;
  border-color: rgba(255,255,255,.10);
  color: var(--text);
}

input:focus,
select:focus {
  border-color: rgba(255,59,48,.56);
  box-shadow: 0 0 0 4px rgba(255,59,48,.13);
}

.app-shell {
  width: min(1280px, calc(100% - 24px));
  padding: 14px 0 38px;
}

.topbar.compact-topbar,
.compact-topbar {
  position: sticky;
  top: 10px;
  z-index: 30;
  margin-bottom: 12px;
  padding: 8px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 22px;
  background: rgba(9,13,18,.84);
  backdrop-filter: blur(16px);
  box-shadow: 0 12px 40px rgba(0,0,0,.38);
}

.top-pills,
.player-strip {
  display: flex !important;
  align-items: center !important;
  gap: 7px !important;
  flex-wrap: nowrap !important;
  overflow-x: auto !important;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.top-pills::-webkit-scrollbar,
.player-strip::-webkit-scrollbar,
.side-tabs::-webkit-scrollbar,
.mobile-more-grid::-webkit-scrollbar,
.fight-line-main::-webkit-scrollbar,
.ranking-name-wrap::-webkit-scrollbar {
  display: none;
}

.pill,
.mini-chip,
.pill-link,
.fw-chip {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  width: auto !important;
  max-width: max-content !important;
  flex: 0 0 auto !important;
  white-space: nowrap !important;
  border-radius: 999px !important;
  border: 1px solid rgba(255,255,255,.09) !important;
  background: rgba(255,255,255,.045) !important;
  color: #dbe5f3 !important;
  padding: 6px 10px !important;
  font-size: 12px !important;
  line-height: 1.1 !important;
}

.pill.blue,
.mini-chip.blue,
.fw-chance {
  background: rgba(74,163,255,.12) !important;
  border-color: rgba(74,163,255,.28) !important;
  color: #a9d6ff !important;
}

.pill.gold,
.mini-chip.gold,
.fw-money,
.fw-ovr {
  background: rgba(255,176,32,.12) !important;
  border-color: rgba(255,176,32,.26) !important;
  color: #ffd58a !important;
}

.pill.green,
.rank-pill,
.fw-you {
  background: rgba(36,196,107,.12) !important;
  border-color: rgba(36,196,107,.26) !important;
  color: #9af2bf !important;
}

.pill.red {
  background: rgba(255,59,48,.13) !important;
  border-color: rgba(255,59,48,.28) !important;
  color: #ffaea8 !important;
}

.layout.single-layout {
  display: block !important;
  padding: 0 !important;
}

.ui-remake-layout,
.f1-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.ui-side-nav,
.f1-side-nav {
  position: sticky;
  top: 82px;
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 26px;
  background: rgba(15,20,27,.88);
  box-shadow: var(--shadow);
}

.side-title,
.f1-side-title {
  display: grid;
  gap: 3px;
  padding: 4px 4px 10px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.side-title span,
.f1-side-title span {
  font-size: 18px;
  font-weight: 950;
  letter-spacing: -0.04em;
}

.side-title small,
.f1-side-title small {
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
  font-weight: 850;
  text-align: left;
  white-space: nowrap;
}

.ui-remake-main,
.f1-main,
.panel,
.content-card,
.stat-card,
.skills,
.offer,
.modal {
  background: linear-gradient(180deg, rgba(20,27,37,.96), rgba(12,16,23,.96));
  border-color: rgba(255,255,255,.08);
  box-shadow: var(--shadow);
}

.ui-remake-main,
.f1-main {
  padding: 14px;
  min-width: 0;
}

.feed {
  background: linear-gradient(135deg, rgba(255,59,48,.13), rgba(255,176,32,.07));
  border-color: rgba(255,255,255,.08);
  color: #d8e2f0;
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
  color: #f5f7fb;
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
.fight-lines,
.fw-fight-list,
.fw-person-list {
  display: grid !important;
  gap: 8px !important;
}

.ranking-entry,
.club-browser-row,
.club-select-row,
.compact-offer,
.fight-line,
.fw-fight-row,
.fw-person-row {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  width: 100% !important;
  min-width: 0 !important;
  padding: 8px 10px !important;
  border: 1px solid rgba(255,255,255,.075) !important;
  border-radius: 16px !important;
  background: rgba(255,255,255,.035) !important;
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
.club-select-row > *,
.fw-fight-row > *,
.fw-person-row > * {
  flex: 0 0 auto !important;
}

.fight-line-btn,
.fw-fight-btn {
  min-width: 58px !important;
  padding: 7px 12px !important;
}

.modal-backdrop {
  background: rgba(0,0,0,.70);
  backdrop-filter: blur(8px);
}

.modal-head {
  background: rgba(20,27,37,.98);
  border-bottom-color: rgba(255,255,255,.08);
}

.fight-window-body {
  background: #05070a;
}

.fight-log {
  background: rgba(0,0,0,.22);
  border-color: rgba(255,255,255,.08);
  color: #d8e2f0;
}

.ring-grid {
  border-color: rgba(255,59,48,.22);
  box-shadow: inset 0 0 0 999px rgba(0,0,0,.22), var(--shadow);
}

.f1-mobile-nav,
.f1-more-backdrop,
.f1-more-sheet {
  display: none;
}

.f1-bottom-spacer {
  display: none;
}

@media (max-width: 760px) {
  html,
  body {
    max-width: 100%;
    overflow-x: hidden;
  }

  body {
    background:
      radial-gradient(circle at 50% -90px, rgba(255,59,48,.28), transparent 250px),
      linear-gradient(180deg, #05070a, #080b10 52%, #05070a);
  }

  .app-shell {
    width: 100%;
    padding: 8px 8px calc(94px + env(safe-area-inset-bottom));
  }

  .topbar.compact-topbar {
    top: 6px;
    margin-bottom: 8px;
    padding: 7px;
    border-radius: 18px;
  }

  .top-pills,
  .player-strip {
    gap: 5px !important;
  }

  .pill,
  .mini-chip,
  .pill-link,
  .fw-chip {
    padding: 5px 7px !important;
    font-size: 11px !important;
  }

  .f1-layout,
  .ui-remake-layout {
    display: block !important;
  }

  .f1-side-nav,
  .ui-side-nav {
    display: none !important;
  }

  .f1-main,
  .ui-remake-main,
  .main-panel,
  .panel {
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  .feed {
    border-radius: 18px;
    padding: 9px 10px;
    font-size: 12px;
  }

  .content-card,
  .stat-card,
  .skills,
  .offer {
    padding: 11px;
    border-radius: 18px;
  }

  .grid.two,
  .grid.three,
  .grid {
    grid-template-columns: 1fr !important;
    gap: 9px !important;
  }

  .split-row {
    grid-template-columns: minmax(0, 1fr) auto !important;
    gap: 8px !important;
  }

  .split-row > strong:last-child,
  .split-row > span:last-child {
    max-width: 122px;
  }

  .country-label {
    max-width: 88px !important;
  }

  .fighter-name-btn,
  .fighter-link,
  .fw-tight-name {
    max-width: 136px !important;
  }

  .ranking-entry,
  .club-browser-row,
  .club-select-row,
  .compact-offer,
  .fight-line,
  .fw-fight-row,
  .fw-person-row {
    padding: 8px !important;
    gap: 6px !important;
    border-radius: 16px !important;
  }

  .modal-backdrop {
    align-items: end !important;
    place-items: end center !important;
    padding: 0 !important;
  }

  .modal {
    width: 100% !important;
    max-width: 100% !important;
    max-height: calc(94vh - env(safe-area-inset-bottom)) !important;
    border-radius: 24px 24px 0 0 !important;
    border-left: 0 !important;
    border-right: 0 !important;
    border-bottom: 0 !important;
  }

  .modal-body {
    padding: 12px !important;
  }

  .modal-head,
  .modal-actions {
    padding: 12px !important;
  }

  .fight-layout {
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }

  .ring-grid {
    padding: 8px !important;
    gap: 4px !important;
    border-radius: 16px !important;
  }

  .fight-controls {
    grid-template-columns: 1fr 1fr !important;
    gap: 7px !important;
  }

  .move-pad {
    grid-template-columns: repeat(4, 1fr) !important;
  }

  .f1-bottom-spacer {
    display: block;
    height: 84px;
  }

  .f1-mobile-nav {
    position: fixed;
    left: 8px;
    right: 8px;
    bottom: calc(8px + env(safe-area-inset-bottom));
    z-index: 80;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 6px;
    padding: 7px;
    border: 1px solid rgba(255,255,255,.10);
    border-radius: 22px;
    background: rgba(7,10,15,.92);
    backdrop-filter: blur(18px);
    box-shadow: 0 18px 60px rgba(0,0,0,.58);
  }

  .f1-nav-btn {
    min-width: 0;
    min-height: 52px;
    padding: 6px 4px;
    display: grid;
    place-items: center;
    gap: 2px;
    border-radius: 16px;
    font-size: 10px;
    font-weight: 850;
    color: #aab5c6;
    background: transparent;
    border: 1px solid transparent;
    box-shadow: none;
  }

  .f1-nav-btn span {
    display: block;
    font-size: 18px;
    line-height: 1;
  }

  .f1-nav-btn.active,
  .f1-nav-btn.week {
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    border-color: rgba(255,105,74,.45);
    color: #fff;
  }

  .f1-nav-btn.more-active {
    background: rgba(255,255,255,.08);
    border-color: rgba(255,255,255,.10);
    color: #fff;
  }

  .f1-more-backdrop {
    position: fixed;
    inset: 0;
    z-index: 85;
    display: block;
    background: rgba(0,0,0,.62);
    backdrop-filter: blur(5px);
  }

  .f1-more-sheet {
    position: fixed;
    left: 8px;
    right: 8px;
    bottom: calc(78px + env(safe-area-inset-bottom));
    z-index: 90;
    display: grid;
    gap: 12px;
    padding: 14px;
    border: 1px solid rgba(255,255,255,.10);
    border-radius: 24px;
    background: linear-gradient(180deg, rgba(20,27,37,.98), rgba(9,13,18,.98));
    box-shadow: 0 24px 80px rgba(0,0,0,.72);
  }

  .f1-more-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .f1-more-title {
    display: grid;
    gap: 2px;
  }

  .f1-more-title strong {
    font-size: 16px;
  }

  .f1-more-title span {
    color: var(--muted);
    font-size: 12px;
  }

  .f1-more-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    max-height: 42vh;
    overflow-y: auto;
  }

  .f1-more-grid button {
    justify-content: flex-start;
    min-height: 44px;
    padding: 10px 11px;
    font-size: 13px;
    font-weight: 850;
  }
}
/* ===== /F1 Mobile UI 2.5.0 ===== */
`;

function stripOldUiBlocks(css) {
  return css
    .replace(/\/\* ===== Clean UI 2\.[\s\S]*?\/\* ===== \/Clean UI 2\.[\s\S]*?\*\//g, "")
    .replace(/\/\* ===== F1 Mobile UI 2\.[\s\S]*?\/\* ===== \/F1 Mobile UI 2\.[\s\S]*?\*\//g, "")
    .replace(/\/\* ===== F1 Mobile UI 2\.5\.0 =====[\s\S]*?\/\* ===== \/F1 Mobile UI 2\.5\.0 ===== \*\//g, "")
    .trimEnd();
}

function patchStyles() {
  console.log("\n== patch styles.css ==");
  let css = read("src/styles.css");
  css = stripOldUiBlocks(css);
  css += "\n\n" + F1_CSS.trim() + "\n";
  write("src/styles.css", css);
}

function patchIndex() {
  console.log("\n== patch index.html ==");
  let html = read("index.html");

  html = html.replace(/\r?\n\s*<script\s+src=["']src\/patches\/[^"']+\.js(?:\?[^"']*)?["']><\/script>/g, "");
  html = html.replace(/\r?\n\s*<link\s+rel=["']stylesheet["']\s+href=["']src\/ui-remake-[^"']+\.css(?:\?[^"']*)?["']\s*>/g, "");
  html = html.replace(/<meta name="theme-color" content="[^"]*">/, '<meta name="theme-color" content="#05070a">');
  html = html.replace(/<meta name="apple-mobile-web-app-status-bar-style" content="[^"]*">/, '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">');

  if (!/http-equiv=["']Cache-Control["']/i.test(html)) {
    html = html.replace(
      /(<meta\s+charset=["']utf-8["']\s*\/?\s*>)/i,
      '$1\n  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0">\n  <meta http-equiv="Pragma" content="no-cache">\n  <meta http-equiv="Expires" content="0">'
    );
  }

  write("index.html", html);
}

function patchVersionFiles() {
  console.log("\n== patch versions ==");
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
    mode: "f1-mobile-ui",
    cacheVersion: "fight-simulator-f1-mobile-ui-2.5.0",
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
    background_color: "#05070a",
    theme_color: "#05070a",
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
  console.log("\n== patch sw.js ==");
  const sw = `/* Fight World service worker - F1 Mobile UI 2.5.0 */
"use strict";

const CACHE_VERSION = "fight-simulator-f1-mobile-ui-2.5.0";
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
  console.log("\n== patch reset-cache.html ==");
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
    body { margin:0; min-height:100vh; display:grid; place-items:center; background:#05070a; color:#f5f7fb; font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    .card { width:min(720px,calc(100vw - 28px)); border:1px solid rgba(255,255,255,.10); border-radius:24px; padding:22px; background:linear-gradient(180deg,#151b24,#090d12); box-shadow:0 24px 80px rgba(0,0,0,.62); }
    h1 { margin:0 0 8px; font-size:24px; }
    p { color:#8d99aa; line-height:1.5; }
    pre { white-space:pre-wrap; background:#05070a; border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:14px; max-height:340px; overflow:auto; color:#d8e2f0; }
    a,button { display:inline-flex; align-items:center; justify-content:center; min-height:38px; padding:0 14px; border-radius:12px; border:1px solid rgba(255,105,74,.40); background:#ff3b30; color:white; text-decoration:none; font-weight:800; cursor:pointer; }
  </style>
</head>
<body>
  <main class="card">
    <h1>Fight World reset</h1>
    <p>Clearing old cache. Career save is not touched.</p>
    <pre id="log">start</pre>
    <a id="go" href="index.html?cacheReset=2.5.0">Open game</a>
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
      setTimeout(() => { location.href = "index.html?cacheReset=2.5.0&t=" + Date.now(); }, 700);
    }
    clean();
  </script>
</body>
</html>
`;
  write("reset-cache.html", html);
}

function patchRenderJs() {
  console.log("\n== patch render.js ==");
  let js = read("src/ui/render.js");

  const renderMain = `function renderMain(state) {
    var p = State.player(state);
    var content;
    var tab = state.selectedTab || "dashboard";

    if (p.trackId === "pro" && (tab === "fights" || tab === "world")) { tab = "dashboard"; }
    if (p.trackId === "street" && (tab === "pro" || tab === "world")) { tab = "dashboard"; }
    if (p.trackId === "amateur" && tab === "pro") { tab = "dashboard"; }

    if (tab === "dashboard") { content = renderDashboardTab(state); }
    else if (tab === "profile") { content = renderProfileTab(state); }
    else if (tab === "fights") { content = renderFightsTab(state); }
    else if (tab === "favorites") { content = renderFavoritesTab(state); }
    else if (tab === "news") { content = renderNewsTab(state); }
    else if (tab === "pro") { content = renderProTab(state); }
    else if (tab === "training") { content = renderTrainingTab(state); }
    else if (tab === "economy") { content = renderDashboardTab(state); }
    else if (tab === "ranking") { content = renderRankingTab(state); }
    else if (tab === "myclub") { content = renderMyClubTab(state); }
    else if (tab === "clubs") { content = renderClubsTab(state); }
    else if (tab === "world") { content = renderWorldTab(state); }
    else if (tab === "settings") { content = renderSettingsTab(state); }
    else { content = renderPeopleTab(state); }

    function desktopTabs() {
      return renderTabs(state).replace('class="tabs"', 'class="tabs side-tabs"');
    }

    function tabButton(id, icon, label) {
      return '<button class="f1-nav-btn ' + (tab === id ? 'active' : '') + '" data-tab="' + id + '"><span>' + icon + '</span>' + label + '</button>';
    }

    function moreItem(id, icon, label) {
      return '<button data-tab="' + id + '">' + icon + ' ' + label + '</button>';
    }

    function mobileNav() {
      return '<nav class="f1-mobile-nav">' +
        tabButton('dashboard', '🏠', 'Обзор') +
        tabButton('profile', '🥊', 'Профиль') +
        '<button class="f1-nav-btn week" data-action="next-week"><span>⏭</span>Неделя</button>' +
        (p.trackId !== 'pro' ? tabButton('fights', '🔥', 'Бои') : tabButton('pro', '💼', 'Профи')) +
        '<button class="f1-nav-btn ' + (state.mobileMoreOpen ? 'more-active' : '') + '" data-mobile-more="toggle"><span>☰</span>Ещё</button>' +
      '</nav>';
    }

    function moreSheet() {
      if (!state.mobileMoreOpen) { return ''; }
      return '<div class="f1-more-backdrop" data-mobile-more-close="1"></div>' +
        '<section class="f1-more-sheet">' +
          '<div class="f1-more-head"><div class="f1-more-title"><strong>Ещё</strong><span>Остальные окна карьеры</span></div><button class="small-btn" data-mobile-more-close="1">Закрыть</button></div>' +
          '<div class="f1-more-grid">' +
            (p.trackId === 'amateur' ? moreItem('world', '🌍', 'Люб. путь') : '') +
            (p.trackId === 'pro' ? moreItem('pro', '💼', 'Профи') : '') +
            moreItem('training', '📈', 'Статы') +
            moreItem('ranking', '🏆', 'Рейтинг') +
            moreItem('myclub', '🏟️', 'Мой клуб') +
            moreItem('clubs', '🏛️', 'Клубы') +
            moreItem('favorites', '⭐', 'Избранные') +
            moreItem('news', '📰', 'Новости') +
            moreItem('people', '👥', 'Люди') +
            moreItem('settings', '⚙️', 'Настройки') +
          '</div>' +
        '</section>';
    }

    var trackLabel = p && p.trackId ? U.findTrack(p.trackId).label : "Карьера";

    return '<div class="f1-layout">' +
      '<aside class="f1-side-nav"><div class="f1-side-title"><span>🏁 Fight World</span><small>' + U.escapeHtml(trackLabel) + '</small></div>' + desktopTabs() + '</aside>' +
      '<section class="panel main-panel f1-main"><div class="tab-scroll-area"><div class="feed">' + U.escapeHtml(state.feed || "Готово.") + '</div>' + content + '</div></section>' +
      '</div>' +
      '<div class="f1-bottom-spacer"></div>' +
      mobileNav() +
      moreSheet();
  }`;

  const renderDashboard = `function renderDashboard(state) {
    return renderHeader(state) + renderMain(state) + renderModal(state);
  }`;

  js = replaceFunction(js, "renderMain", renderMain);
  js = replaceFunction(js, "renderDashboard", renderDashboard);

  // In case labels still come from desktop tabs, force clean labels.
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

  write("src/ui/render.js", js);
}

function patchAppJs() {
  console.log("\n== patch app.js ==");
  let js = read("src/app.js");

  // Mobile more open/close handling: insert once after the no-state guard inside click handler.
  if (!js.includes("button.dataset.mobileMore")) {
    const marker = `    if (!state) {
      return;
    }

`;
    const insert = `    if (!state) {
      return;
    }

    if (button.dataset.mobileMore) {
      state.mobileMoreOpen = !state.mobileMoreOpen;
      saveAndRender();
      return;
    }

    if (button.dataset.mobileMoreClose) {
      state.mobileMoreOpen = false;
      saveAndRender();
      return;
    }

`;
    if (js.includes(marker)) {
      js = js.replace(marker, insert);
    } else {
      console.warn("WARN: click handler state marker not found. Mobile More handler was not inserted.");
    }
  }

  // Close More sheet when switching tabs.
  js = js.replace(
    /state\.selectedTab = button\.dataset\.tab;\s*saveAndRender\(\);/g,
    `state.selectedTab = button.dataset.tab;
      state.mobileMoreOpen = false;
      saveAndRender();`
  );

  // Clear More when changing week/training/rest/refresh.
  js = js.replace(
    /state\.feed = "Неделя " \+ \(state\.week \+ 1\) \+ "\. Мир сделал недельный ход\.";/,
    `state.mobileMoreOpen = false;
      state.feed = "Неделя " + (state.week + 1) + ". Мир сделал недельный ход.";`
  );

  // Update button target.
  const updateBlockRx = /function applyUpdateNow\(\)\s*\{[\s\S]*?\n  \}\n\n  function checkRemoteVersion/;
  const updateBlock = `function applyUpdateNow() {
    updateReloading = true;
    persistNow();

    function go() {
      window.location.replace("./reset-cache.html?fromUpdateButton=2.5.0&target=2.5.0&t=" + Date.now());
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
    js = js.replace(/fromUpdateButton=\d+\.\d+\.\d+/g, "fromUpdateButton=2.5.0");
    js = js.replace(/cacheReset=\d+\.\d+\.\d+/g, "cacheReset=2.5.0");
  }

  write("src/app.js", js);
}

function removePatchFolderIfEmptyOrOld() {
  console.log("\n== remove old patch folder if exists ==");
  const patchDir = full("src/patches");
  if (fs.existsSync(patchDir)) {
    fs.rmSync(patchDir, { recursive: true, force: true });
    console.log("removed: src/patches");
  }

  // remove temporary external UI css if present
  for (const name of ["src/ui-remake-2.4.0.css", "src/ui-remake-2.5.0.css"]) {
    if (exists(name)) {
      fs.rmSync(full(name), { force: true });
      console.log("removed:", name);
    }
  }
}

function verify() {
  console.log("\n== verify ==");
  const index = read("index.html");
  const styles = read("src/styles.css");
  const render = read("src/ui/render.js");
  const app = read("src/app.js");
  const data = read("src/data/game-data.js");

  const errors = [];
  if (/src\/patches\//.test(index)) errors.push("index.html still references src/patches");
  if (exists("src/patches")) errors.push("src/patches still exists");
  if (!styles.includes("F1 Mobile UI 2.5.0")) errors.push("styles.css missing F1 Mobile UI block");
  if (!render.includes("f1-mobile-nav")) errors.push("render.js missing mobile nav");
  if (!render.includes("f1-more-sheet")) errors.push("render.js missing more sheet");
  if (!app.includes("button.dataset.mobileMore")) errors.push("app.js missing mobile more click handler");
  if (!data.includes(VERSION)) errors.push("game-data.js missing version " + VERSION);

  if (errors.length) {
    throw new Error("Verification failed:\n" + errors.join("\n"));
  }

  console.log("OK: F1 mobile UI applied");
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
  removePatchFolderIfEmptyOrOld();
  verify();

  console.log("\nDONE.");
  console.log("Run:");
  console.log("  node --check src/app.js");
  console.log("  node --check src/ui/render.js");
  console.log("  py -m http.server 5189");
  console.log("Open:");
  console.log("  http://localhost:5189/reset-cache.html");
  console.log("Commit:");
  console.log("  git add .");
  console.log('  git commit -m "Add F1-style mobile UI"');
  console.log("  git push origin main");
}

main();
