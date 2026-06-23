// FightSimulator Mobile Fixes 2.5.2
// Run from repository root:
//   node apply-mobile-fixes-2.5.2.cjs

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const VERSION = "mobile-fixes-2.5.2";
const SCHEMA = 252;

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
  const backup = path.resolve(ROOT, "..", "FightSimulator_backup_before_mobile_fixes_252_" + stamp);
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

const FIX_CSS = `
/* ===== Mobile Fixes 2.5.2 ===== */
:root {
  --bg: #0c0f13;
  --bg-2: #11151a;
  --panel: #171b21;
  --panel-2: #1c222a;
  --panel-3: #242b35;
  --line: rgba(255,255,255,.075);
  --text: #f2f4f7;
  --muted: #a0a7b2;
  --red: #c84b3f;
  --red-dark: #a83a31;
  --gold: #c9a24b;
  --green: #63b77a;
  --blue: #7ba8cc;
  --accent: #c84b3f;
  --accent-2: #b95449;
  --shadow: 0 16px 46px rgba(0,0,0,.42);
}

html {
  background: #0c0f13 !important;
  min-height: 100%;
}

body {
  background:
    radial-gradient(circle at 50% -120px, rgba(200,75,63,.13), transparent 280px),
    linear-gradient(180deg, #0c0f13, #12161c 46%, #0c0f13) !important;
  color: var(--text);
}

body::before {
  content: "";
  position: fixed;
  left: 0;
  right: 0;
  top: -100px;
  height: 140px;
  z-index: -1;
  background: #0c0f13;
}

button.primary,
button.active {
  background: linear-gradient(180deg, #252b34, #191e26) !important;
  border-color: rgba(255,255,255,.10) !important;
  color: #f2f4f7 !important;
}

.topbar.compact-topbar,
.compact-topbar {
  background: rgba(15,18,23,.94) !important;
  border-color: rgba(255,255,255,.075) !important;
  box-shadow: 0 8px 26px rgba(0,0,0,.38) !important;
}

.top-pills,
.player-strip {
  justify-content: flex-start !important;
  align-content: flex-start !important;
  align-items: center !important;
  gap: 4px !important;
  row-gap: 5px !important;
  padding: 0 !important;
  margin: 0 !important;
}

.top-pills > *,
.player-strip > * {
  flex: 0 0 auto !important;
  width: auto !important;
  min-width: 0 !important;
  max-width: max-content !important;
  margin: 0 !important;
}

.top-pills .pill,
.player-strip .pill,
.top-pills .pill-link,
.player-strip .pill-link,
.country-pill,
.flag-pill,
.date-pill,
.record-pill,
.rank-pill {
  padding: 4px 7px !important;
  font-size: 10.5px !important;
  min-height: 23px !important;
  gap: 4px !important;
  background: rgba(255,255,255,.045) !important;
}

.flag-icon {
  display: none !important;
}

.flag-emoji {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 18px !important;
  min-width: 18px !important;
  height: 14px !important;
  font-size: 15px !important;
  line-height: 1 !important;
}

.country-label {
  gap: 4px !important;
  max-width: 112px !important;
}

.country-label span {
  max-width: 82px !important;
}

.f1-mobile-nav {
  background: rgba(14,16,20,.95) !important;
  border-color: rgba(255,255,255,.08) !important;
  box-shadow: 0 14px 46px rgba(0,0,0,.58) !important;
}

.f1-nav-btn,
.f1-nav-btn.active,
.f1-nav-btn.more-active {
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
  color: #8d949f !important;
}

.f1-nav-btn span {
  opacity: .85;
}

.f1-nav-btn.active,
.f1-nav-btn.more-active {
  color: #f2f4f7 !important;
}

.f1-nav-btn.active span,
.f1-nav-btn.more-active span {
  color: var(--accent) !important;
  opacity: 1;
}

.f1-nav-btn.week {
  background: linear-gradient(135deg, #b94236, #c86b45) !important;
  border-color: rgba(255,255,255,.10) !important;
  color: #fff !important;
}

.f1-nav-btn.week span {
  color: #fff !important;
  opacity: 1 !important;
}

.f1-more-backdrop {
  display: block !important;
}

.f1-more-sheet {
  background: linear-gradient(180deg, #1c222a, #11151a) !important;
  border-color: rgba(255,255,255,.09) !important;
}

.content-card,
.stat-card,
.skills,
.offer,
.panel,
.modal,
.f1-main,
.ui-remake-main {
  background: linear-gradient(180deg, #181d24, #11151a) !important;
  border-color: rgba(255,255,255,.075) !important;
}

.feed {
  background: linear-gradient(135deg, rgba(200,75,63,.09), rgba(255,255,255,.032)) !important;
  border-color: rgba(255,255,255,.075) !important;
}

.f1-section-head {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  min-height: 42px !important;
  padding: 6px 2px 9px !important;
  margin: 0 !important;
}

.f1-section-head h3 {
  margin: 0 !important;
  font-size: 17px !important;
  line-height: 1 !important;
}

.f1-section-head button {
  min-height: 32px !important;
  padding: 6px 10px !important;
  border-radius: 14px !important;
  font-size: 12px !important;
  background: rgba(255,255,255,.045) !important;
}

.fight-lines,
.f1-fight-lines {
  display: grid !important;
  gap: 6px !important;
}

.fight-line,
.f1-fight-row {
  display: grid !important;
  grid-template-columns: minmax(0,1fr) 44px !important;
  gap: 5px !important;
  align-items: center !important;
  min-width: 0 !important;
  padding: 7px 6px !important;
  min-height: 46px !important;
  border-radius: 14px !important;
  overflow: hidden !important;
  background: rgba(255,255,255,.032) !important;
  border-color: rgba(255,255,255,.065) !important;
}

.f1-fight-info {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  min-width: 0 !important;
  overflow: hidden !important;
  white-space: nowrap !important;
}

.f1-fight-info > * {
  flex: 0 0 auto !important;
}

.f1-fight-name {
  flex: 1 1 auto !important;
  min-width: 72px !important;
  max-width: 118px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

.f1-fight-row .fighter-name-btn,
.f1-fight-row .fighter-link,
.f1-fight-name {
  padding: 5px 7px !important;
  min-height: 28px !important;
  border-radius: 13px !important;
  font-size: 12px !important;
}

.f1-flag-only {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 22px !important;
  min-width: 22px !important;
  height: 24px !important;
  padding: 0 !important;
  border-radius: 999px !important;
  background: rgba(255,255,255,.045) !important;
  border: 1px solid rgba(255,255,255,.07) !important;
}

.f1-fight-chip {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 24px !important;
  padding: 0 5px !important;
  border-radius: 999px !important;
  background: rgba(255,255,255,.045) !important;
  border: 1px solid rgba(255,255,255,.07) !important;
  color: #d7dde6 !important;
  font-size: 10px !important;
  line-height: 1 !important;
  white-space: nowrap !important;
}

.f1-fight-chip.ovr {
  max-width: 44px;
}

.f1-fight-chip.rec {
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.f1-fight-chip.money {
  color: #e2c476 !important;
  border-color: rgba(201,162,75,.26) !important;
  background: rgba(201,162,75,.10) !important;
}

.f1-fight-chip.chance {
  color: #a9cde8 !important;
  border-color: rgba(123,168,204,.26) !important;
  background: rgba(123,168,204,.10) !important;
}

.f1-fight-btn,
.fight-line-btn {
  width: 44px !important;
  min-width: 44px !important;
  max-width: 44px !important;
  min-height: 32px !important;
  padding: 0 !important;
  border-radius: 12px !important;
  font-size: 11px !important;
  font-weight: 850 !important;
  justify-self: end !important;
}

.favorite-btn {
  display: none !important;
}

.event-notice-backdrop {
  align-items: center !important;
  justify-items: center !important;
  place-items: center !important;
  padding: 16px !important;
}

.event-notice-modal {
  width: min(420px, calc(100vw - 28px)) !important;
  max-width: min(420px, calc(100vw - 28px)) !important;
  max-height: 70vh !important;
  border-radius: 24px !important;
  transform: translateY(-7vh);
}

.f1-profile-hero {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 22px;
  border: 1px solid rgba(255,255,255,.08);
  background:
    radial-gradient(circle at 100% 0%, rgba(200,75,63,.13), transparent 180px),
    linear-gradient(180deg, #1c222a, #11151a);
}

.f1-profile-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.f1-profile-title {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.f1-profile-title h2 {
  margin: 0;
  font-size: 22px;
  letter-spacing: -0.04em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.f1-profile-sub {
  display: flex;
  gap: 5px;
  overflow-x: auto;
  scrollbar-width: none;
}

.f1-profile-sub::-webkit-scrollbar {
  display: none;
}

.f1-profile-ovr {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 70px;
  height: 70px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(200,75,63,.18), rgba(255,255,255,.045));
  border: 1px solid rgba(255,255,255,.085);
}

.f1-profile-ovr strong {
  font-size: 25px;
  line-height: 1;
}

.f1-profile-ovr span {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .08em;
}

.f1-profile-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 7px;
}

.f1-profile-stat {
  padding: 9px;
  border-radius: 16px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.065);
  min-width: 0;
}

.f1-profile-stat span {
  display: block;
  color: var(--muted);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-bottom: 4px;
}

.f1-profile-stat strong {
  display: block;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.f1-roster-list {
  display: grid !important;
  gap: 7px !important;
}

.f1-roster-row,
.modal .split-row:has(button[data-fighter]) {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 7px !important;
  min-width: 0 !important;
  padding: 7px 8px !important;
  border: 1px solid rgba(255,255,255,.07) !important;
  border-radius: 14px !important;
  background: rgba(255,255,255,.035) !important;
  overflow-x: auto !important;
  scrollbar-width: none !important;
}

.f1-roster-row::-webkit-scrollbar,
.modal .split-row:has(button[data-fighter])::-webkit-scrollbar {
  display: none !important;
}

.f1-roster-info,
.modal .split-row:has(button[data-fighter]) > div {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  min-width: 0 !important;
  flex: 1 1 auto !important;
  overflow-x: auto !important;
  scrollbar-width: none !important;
}

.f1-roster-info::-webkit-scrollbar,
.modal .split-row:has(button[data-fighter]) > div::-webkit-scrollbar {
  display: none !important;
}

.f1-roster-row .fighter-name-btn,
.modal .split-row:has(button[data-fighter]) button[data-fighter] {
  max-width: 126px !important;
  flex: 0 0 auto !important;
}

.f1-roster-row .pill,
.modal .split-row:has(button[data-fighter]) .pill {
  flex: 0 0 auto !important;
}

@media (max-width: 760px) {
  .app-shell {
    padding-top: 6px !important;
    padding-left: 7px !important;
    padding-right: 7px !important;
  }

  .topbar.compact-topbar {
    top: 4px !important;
    padding: 6px !important;
    border-radius: 16px !important;
  }

  .top-pills .pill,
  .player-strip .pill,
  .top-pills .pill-link,
  .player-strip .pill-link,
  .country-pill,
  .flag-pill,
  .date-pill,
  .record-pill,
  .rank-pill {
    padding: 4px 6px !important;
    font-size: 10px !important;
    min-height: 22px !important;
  }

  .country-label {
    max-width: 78px !important;
  }

  .country-label span {
    max-width: 54px !important;
  }

  .f1-section-head {
    min-height: 36px !important;
    padding: 4px 1px 7px !important;
  }

  .f1-mobile-nav {
    padding: 5px !important;
    gap: 3px !important;
    border-radius: 18px !important;
  }

  .f1-nav-btn {
    min-height: 48px !important;
    font-size: 9px !important;
    padding: 4px 2px !important;
  }

  .f1-nav-btn span {
    font-size: 17px !important;
  }

  .f1-more-sheet {
    left: 7px !important;
    right: 7px !important;
    bottom: calc(72px + env(safe-area-inset-bottom)) !important;
  }

  .f1-fight-row {
    grid-template-columns: minmax(0,1fr) 42px !important;
    padding: 6px !important;
    min-height: 44px !important;
  }

  .f1-fight-name {
    max-width: 104px !important;
    font-size: 11px !important;
  }

  .f1-fight-chip {
    height: 22px !important;
    padding: 0 4px !important;
    font-size: 9px !important;
  }

  .f1-fight-chip.ovr {
    max-width: 38px;
  }

  .f1-fight-chip.rec {
    max-width: 52px;
  }

  .f1-flag-only {
    width: 20px !important;
    min-width: 20px !important;
    height: 22px !important;
  }

  .f1-fight-btn {
    width: 42px !important;
    min-width: 42px !important;
    max-width: 42px !important;
    min-height: 30px !important;
  }

  .event-notice-modal {
    transform: translateY(-9vh);
  }

  .f1-profile-grid {
    grid-template-columns: 1fr 1fr !important;
  }

  .f1-profile-ovr {
    width: 62px;
    height: 62px;
  }

  .f1-profile-title h2 {
    font-size: 20px;
  }
}
/* ===== /Mobile Fixes 2.5.2 ===== */
`;

function stripOldFixBlocks(css) {
  return css
    .replace(/\/\* ===== Mobile Fixes 2\.[\s\S]*?\/\* ===== \/Mobile Fixes 2\.[\s\S]*?\*\//g, "")
    .replace(/\/\* ===== Mobile Fixes 2\.5\.2 =====[\s\S]*?\/\* ===== \/Mobile Fixes 2\.5\.2 ===== \*\//g, "")
    .trimEnd();
}

function patchStyles() {
  console.log("\n== patch styles.css ==");
  let css = read("src/styles.css");
  css = stripOldFixBlocks(css);
  css += "\n\n" + FIX_CSS.trim() + "\n";
  write("src/styles.css", css);
}

function patchIndex() {
  console.log("\n== patch index.html ==");
  let html = read("index.html");
  html = html.replace(/<meta name="theme-color" content="[^"]*">/, '<meta name="theme-color" content="#0c0f13">');
  html = html.replace(/<meta name="apple-mobile-web-app-status-bar-style" content="[^"]*">/, '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">');
  if (!/http-equiv=["']Cache-Control["']/i.test(html)) {
    html = html.replace(
      /(<meta\s+charset=["']utf-8["']\s*\/?\s*>)/i,
      '$1\n  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0">\n  <meta http-equiv="Pragma" content="no-cache">\n  <meta http-equiv="Expires" content="0">'
    );
  }
  write("index.html", html);
}

function patchVersions() {
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
    mode: "mobile-fixes",
    cacheVersion: "fight-simulator-mobile-fixes-2.5.2",
    resetPage: "reset-cache.html",
    localCleanPort: 5189
  }, null, 2) + "\n");

  if (exists("manifest.webmanifest")) {
    write("manifest.webmanifest", JSON.stringify({
      name: "Fight World",
      short_name: "FightWorld",
      id: "./",
      start_url: "./",
      scope: "./",
      display: "standalone",
      background_color: "#0c0f13",
      theme_color: "#0c0f13",
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
}

function patchServiceWorker() {
  console.log("\n== patch sw.js ==");
  if (!exists("sw.js")) return;
  let sw = read("sw.js");
  sw = sw.replace(/const CACHE_VERSION = "[^"]*";/, 'const CACHE_VERSION = "fight-simulator-mobile-fixes-2.5.2";');
  sw = sw.replace(/src\/patches\/[^",\n]+,?\n/g, "");
  write("sw.js", sw);
}

function patchResetCache() {
  console.log("\n== patch reset-cache.html ==");
  if (!exists("reset-cache.html")) return;
  let html = read("reset-cache.html");
  html = html.replace(/cacheReset=\d+\.\d+\.\d+/g, "cacheReset=2.5.2");
  html = html.replace(/#0b0d10|#05070a/g, "#0c0f13");
  write("reset-cache.html", html);
}

function patchFlagFallback(js) {
  const flagEmoji = `function flagEmoji(countryId) {
    var id = String(countryId || "").toLowerCase();
    var map = {
      russia: "🇷🇺", ru: "🇷🇺",
      usa: "🇺🇸", us: "🇺🇸", united_states: "🇺🇸",
      mexico: "🇲🇽", brazil: "🇧🇷", argentina: "🇦🇷",
      uk: "🇬🇧", britain: "🇬🇧", england: "🇬🇧",
      germany: "🇩🇪", france: "🇫🇷", spain: "🇪🇸", italy: "🇮🇹",
      ireland: "🇮🇪", netherlands: "🇳🇱", poland: "🇵🇱", ukraine: "🇺🇦",
      japan: "🇯🇵", china: "🇨🇳", korea: "🇰🇷", kazakhstan: "🇰🇿",
      cuba: "🇨🇺", canada: "🇨🇦", australia: "🇦🇺",
      turkey: "🇹🇷", thailand: "🇹🇭", philippines: "🇵🇭"
    };
    return map[id] || "🏳️";
  }`;

  const flagImg = `function flagImg(countryId) {
    return '<span class="flag-emoji">' + flagEmoji(countryId) + '</span>';
  }`;

  if (!js.includes("function flagEmoji(countryId)")) {
    const range = findFunctionRange(js, "flagImg");
    js = js.slice(0, range.start) + flagEmoji + "\n\n  " + js.slice(range.start);
  }

  js = replaceFunction(js, "flagImg", flagImg);
  return js;
}

function patchRenderJs() {
  console.log("\n== patch render.js ==");
  let js = read("src/ui/render.js");

  js = patchFlagFallback(js);

  const renderFightsTab = `function renderFightsTab(state) {
    var offers = (state.offers || []).filter(function (offer) { return !offer.isCompetition; });

    function shortRecord(fighter) {
      var text = U.recordText(fighter.record);
      return text.replace(/\\s*·\\s*/g, " ").replace(/KO\\s+/g, "KO");
    }

    function fightRow(offer) {
      var opponent = U.getFighterById(state, offer.opponentId);
      var preview = Fight.buildFightPreview(state, offer.id);
      if (!opponent || !preview) { return ""; }

      return '<div class="f1-fight-row">' +
        '<div class="f1-fight-info">' +
          '<button class="fighter-link f1-fight-name" data-fighter="' + U.escapeHtml(opponent.id) + '">' + U.escapeHtml(opponent.name) + '</button>' +
          '<span class="f1-flag-only">' + flagImg(opponent.countryId || opponent.currentCountryId || opponent.homeCountryId) + '</span>' +
          '<span class="f1-fight-chip ovr">O' + preview.opponentRating + '</span>' +
          '<span class="f1-fight-chip rec">' + U.escapeHtml(shortRecord(opponent)) + '</span>' +
          '<span class="f1-fight-chip money">$' + preview.purse + '</span>' +
          '<span class="f1-fight-chip chance">' + preview.winChance + '%</span>' +
        '</div>' +
        '<button class="f1-fight-btn" data-preview-fight="' + U.escapeHtml(offer.id) + '">Бой</button>' +
      '</div>';
    }

    return '<div class="f1-section-head"><h3>Бои</h3><button class="small-btn" data-action="refresh-offers">Обновить</button></div>' +
      '<div class="fight-lines f1-fight-lines">' + offers.map(fightRow).join("") + '</div>';
  }`;

  js = replaceFunction(js, "renderFightsTab", renderFightsTab);

  // Mark event/news modal so CSS can place it above center instead of bottom.
  const oldEvent = 'if (modal.type === "eventNotice") {\n      return "<div class=\\"modal-backdrop\\"><div class=\\"modal\\"><div class=\\"modal-head\\"><h2>" + U.escapeHtml(modal.title || "Новость")';
  const newEvent = 'if (modal.type === "eventNotice") {\n      return "<div class=\\"modal-backdrop event-notice-backdrop\\"><div class=\\"modal event-notice-modal\\"><div class=\\"modal-head\\"><h2>" + U.escapeHtml(modal.title || "Новость")';
  if (js.includes(oldEvent)) {
    js = js.replace(oldEvent, newEvent);
  } else if (!js.includes("event-notice-modal")) {
    console.warn("WARN: eventNotice modal pattern not found");
  }

  write("src/ui/render.js", js);
}

function patchAppJs() {
  console.log("\n== patch app.js ==");
  let js = read("src/app.js");

  if (!js.includes("mobileMoreCloseTarget")) {
    js = js.replace(
      '  document.addEventListener("click", function (event) {\n    var button = event.target.closest("button");',
      '  document.addEventListener("click", function (event) {\n    var mobileMoreCloseTarget = event.target && event.target.closest ? event.target.closest("[data-mobile-more-close]") : null;\n    if (mobileMoreCloseTarget && state) {\n      state.mobileMoreOpen = false;\n      saveAndRender();\n      return;\n    }\n\n    var button = event.target.closest("button");'
    );
  }

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

`;
    if (js.includes(marker)) {
      js = js.replace(marker, insert);
    } else {
      console.warn("WARN: state marker not found for mobileMore insertion");
    }
  }

  js = js.replace(
    /state\.selectedTab = button\.dataset\.tab;\s*state\.mobileMoreOpen = false;\s*saveAndRender\(\);/g,
    `state.selectedTab = button.dataset.tab;
      state.mobileMoreOpen = false;
      saveAndRender();`
  );

  js = js.replace(
    /state\.selectedTab = button\.dataset\.tab;\s*saveAndRender\(\);/g,
    `state.selectedTab = button.dataset.tab;
      state.mobileMoreOpen = false;
      saveAndRender();`
  );

  js = js.replace(/fromUpdateButton=\d+\.\d+\.\d+/g, "fromUpdateButton=2.5.2");
  js = js.replace(/target=\d+\.\d+\.\d+/g, "target=2.5.2");
  js = js.replace(/cacheReset=\d+\.\d+\.\d+/g, "cacheReset=2.5.2");

  write("src/app.js", js);
}

function verify() {
  console.log("\n== verify ==");
  const styles = read("src/styles.css");
  const render = read("src/ui/render.js");
  const app = read("src/app.js");

  const errors = [];
  if (!styles.includes("Mobile Fixes 2.5.2")) errors.push("styles.css missing Mobile Fixes 2.5.2");
  if (!render.includes("function flagImg(countryId)")) errors.push("render.js missing flagImg");
  if (!render.includes("f1-fight-info")) errors.push("render.js missing one-line fight layout");
  if (!render.includes("event-notice-modal")) errors.push("render.js missing event notice modal marker");
  if (!app.includes("mobileMoreCloseTarget")) errors.push("app.js missing outside-close handler");

  if (errors.length) {
    throw new Error("Verification failed:\n" + errors.join("\n"));
  }

  console.log("OK: mobile fixes 2.5.2 applied");
}

function main() {
  assertCore();
  backupRepo();

  patchIndex();
  patchStyles();
  patchRenderJs();
  patchAppJs();
  patchVersions();
  patchServiceWorker();
  patchResetCache();
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
  console.log('  git commit -m "Fix mobile fight layout"');
  console.log("  git push origin main");
}

main();
