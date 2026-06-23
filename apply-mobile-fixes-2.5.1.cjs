// FightSimulator Mobile Fixes 2.5.1
// Run from repository root:
//   node apply-mobile-fixes-2.5.1.cjs

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const VERSION = "mobile-fixes-2.5.1";
const SCHEMA = 251;

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
  const backup = path.resolve(ROOT, "..", "FightSimulator_backup_before_mobile_fixes_" + stamp);
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
/* ===== Mobile Fixes 2.5.1 ===== */
:root {
  --bg: #0b0d10;
  --bg-2: #101318;
  --panel: #15191f;
  --panel-2: #1b2028;
  --panel-3: #222832;
  --line: rgba(255,255,255,.075);
  --text: #f2f4f7;
  --muted: #9aa3af;
  --red: #d94a3a;
  --red-dark: #b93529;
  --gold: #d8a642;
  --green: #4fb06f;
  --blue: #6ea8da;
  --accent: #d94a3a;
  --accent-2: #c75443;
  --shadow: 0 18px 52px rgba(0,0,0,.46);
}

html {
  background: #0b0d10 !important;
  min-height: 100%;
}

body {
  background:
    radial-gradient(circle at 50% -110px, rgba(217,74,58,.16), transparent 280px),
    linear-gradient(180deg, #0b0d10, #111419 48%, #0b0d10) !important;
  color: var(--text);
}

body::before {
  content: "";
  position: fixed;
  left: 0;
  right: 0;
  top: -80px;
  height: 120px;
  z-index: -1;
  background: #0b0d10;
}

button.primary,
button.active {
  background: linear-gradient(180deg, #242a34, #171c24) !important;
  border-color: rgba(255,255,255,.10) !important;
  color: #f2f4f7 !important;
}

button.primary:hover,
button.active:hover {
  background: linear-gradient(180deg, #2b323e, #1d232d) !important;
}

.topbar.compact-topbar,
.compact-topbar {
  background: rgba(15,18,23,.92) !important;
  border-color: rgba(255,255,255,.07) !important;
  box-shadow: 0 10px 34px rgba(0,0,0,.42) !important;
}

.top-pills,
.player-strip {
  justify-content: flex-start !important;
  gap: 4px !important;
  padding: 0 !important;
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
  font-size: 11px !important;
  min-height: 24px !important;
  gap: 4px !important;
  margin: 0 !important;
  background: rgba(255,255,255,.045) !important;
}

.flag-icon {
  display: inline-block !important;
  width: 18px !important;
  height: 12px !important;
  min-width: 18px !important;
  object-fit: cover !important;
  border-radius: 2px !important;
  flex: 0 0 18px !important;
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
  max-width: 116px !important;
}

.country-label span {
  max-width: 86px !important;
}

.f1-mobile-nav {
  background: rgba(13,15,19,.94) !important;
  border-color: rgba(255,255,255,.08) !important;
}

.f1-nav-btn,
.f1-nav-btn.week,
.f1-nav-btn.active,
.f1-nav-btn.more-active {
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
  color: #8f98a6 !important;
}

.f1-nav-btn span {
  opacity: .86;
}

.f1-nav-btn.active,
.f1-nav-btn.week:active,
.f1-nav-btn.more-active {
  color: #f2f4f7 !important;
}

.f1-nav-btn.active span,
.f1-nav-btn.week:active span,
.f1-nav-btn.more-active span {
  color: var(--accent) !important;
  opacity: 1;
}

.f1-more-backdrop {
  display: block !important;
}

.f1-more-sheet {
  background: linear-gradient(180deg, #1a1f27, #101318) !important;
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
  background: linear-gradient(180deg, #171c23, #10141a) !important;
  border-color: rgba(255,255,255,.075) !important;
}

.feed {
  background: linear-gradient(135deg, rgba(217,74,58,.10), rgba(255,255,255,.035)) !important;
  border-color: rgba(255,255,255,.075) !important;
}

.fight-lines,
.f1-fight-lines {
  display: grid !important;
  gap: 7px !important;
}

.fight-line,
.f1-fight-row {
  display: grid !important;
  grid-template-columns: minmax(0,1fr) auto !important;
  gap: 7px !important;
  align-items: center !important;
  min-width: 0 !important;
  padding: 8px !important;
  border-radius: 15px !important;
  overflow: hidden !important;
}

.f1-fight-main {
  min-width: 0 !important;
  display: grid !important;
  gap: 5px !important;
}

.f1-fight-name-row {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  min-width: 0 !important;
}

.f1-fight-meta {
  display: flex !important;
  gap: 4px !important;
  min-width: 0 !important;
  overflow-x: auto !important;
  scrollbar-width: none !important;
}

.f1-fight-meta::-webkit-scrollbar {
  display: none !important;
}

.f1-fight-row .fighter-name-btn,
.f1-fight-row .fighter-link {
  max-width: 134px !important;
  padding: 5px 7px !important;
  min-height: 28px !important;
  font-size: 12px !important;
}

.f1-fight-row .mini-chip,
.f1-fight-row .pill {
  padding: 4px 6px !important;
  font-size: 10px !important;
  min-height: 22px !important;
}

.f1-fight-btn,
.fight-line-btn {
  width: auto !important;
  min-width: 44px !important;
  max-width: 52px !important;
  min-height: 32px !important;
  padding: 6px 8px !important;
  border-radius: 11px !important;
  font-size: 11px !important;
  font-weight: 850 !important;
  justify-self: end !important;
}

.favorite-btn {
  display: none !important;
}

.f1-profile-hero {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 22px;
  border: 1px solid rgba(255,255,255,.08);
  background:
    radial-gradient(circle at 100% 0%, rgba(217,74,58,.16), transparent 180px),
    linear-gradient(180deg, #1a1f27, #101318);
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
  background: linear-gradient(135deg, rgba(217,74,58,.22), rgba(255,255,255,.05));
  border: 1px solid rgba(255,255,255,.09);
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
  background: rgba(255,255,255,.045);
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
    min-height: 23px !important;
  }

  .country-label {
    max-width: 82px !important;
  }

  .country-label span {
    max-width: 58px !important;
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
/* ===== /Mobile Fixes 2.5.1 ===== */
`;

function stripOldFixBlocks(css) {
  return css
    .replace(/\/\* ===== Mobile Fixes 2\.[\s\S]*?\/\* ===== \/Mobile Fixes 2\.[\s\S]*?\*\//g, "")
    .replace(/\/\* ===== Mobile Fixes 2\.5\.1 =====[\s\S]*?\/\* ===== \/Mobile Fixes 2\.5\.1 ===== \*\//g, "")
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
  html = html.replace(/<meta name="theme-color" content="[^"]*">/, '<meta name="theme-color" content="#0b0d10">');
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
    cacheVersion: "fight-simulator-mobile-fixes-2.5.1",
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
      background_color: "#0b0d10",
      theme_color: "#0b0d10",
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
  sw = sw.replace(/const CACHE_VERSION = "[^"]*";/, 'const CACHE_VERSION = "fight-simulator-mobile-fixes-2.5.1";');
  sw = sw.replace(/src\/patches\/[^",\n]+,?\n/g, "");
  write("sw.js", sw);
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
    var country = U.findCountry(countryId);
    var emoji = flagEmoji(countryId);
    if (!country || !country.flag) {
      return '<span class="flag-emoji">' + emoji + '</span>';
    }
    return "<img class=\\"flag-icon\\" src=\\"" + U.escapeHtml(country.flag) + "\\" alt=\\"" + U.escapeHtml(country.label) + "\\" onerror=\\"this.outerHTML='&lt;span class=&quot;flag-emoji&quot;&gt;" + emoji + "&lt;/span&gt;';\\">";
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

    function fightRow(offer) {
      var opponent = U.getFighterById(state, offer.opponentId);
      var preview = Fight.buildFightPreview(state, offer.id);
      if (!opponent || !preview) { return ""; }
      return '<div class="f1-fight-row">' +
        '<div class="f1-fight-main">' +
          '<div class="f1-fight-name-row">' +
            '<button class="fighter-link" data-fighter="' + U.escapeHtml(opponent.id) + '">' + U.escapeHtml(opponent.name) + '</button>' +
            '<span class="mini-chip flag-mini">' + fighterCountryLabel(opponent) + '</span>' +
          '</div>' +
          '<div class="f1-fight-meta">' +
            '<span class="mini-chip">OVR ' + preview.opponentRating + '</span>' +
            '<span class="mini-chip record-mini">' + U.escapeHtml(U.recordText(opponent.record)) + '</span>' +
            '<span class="mini-chip gold">$' + preview.purse + '</span>' +
            '<span class="mini-chip blue">' + preview.winChance + '%</span>' +
          '</div>' +
        '</div>' +
        '<button class="f1-fight-btn" data-preview-fight="' + U.escapeHtml(offer.id) + '">Бой</button>' +
      '</div>';
    }

    return '<div class="content-card fights-head"><div class="split-row"><h3>Бои</h3><button class="small-btn" data-action="refresh-offers">Обновить</button></div></div>' +
      '<div class="fight-lines f1-fight-lines">' + offers.map(fightRow).join("") + '</div>';
  }`;

  const renderFighterModal = `function renderFighterModal(state, fighter) {
    var weightText = fighter.trackId === "street" ? "без весовых категорий" : U.escapeHtml(U.findWeightClass(fighter.weightClassId).label);
    var club = window.FS.Clubs ? window.FS.Clubs.findClub(state, fighter.gymId) : null;
    var stage = window.FS.Matchmaking && window.FS.Matchmaking.careerStage ? window.FS.Matchmaking.careerStage(fighter) : { label: "Боец" };
    var ovr = U.statAverage(fighter.stats);

    return '<div class="modal-backdrop"><div class="modal fighter-profile-modal">' +
      '<div class="modal-body">' +
        '<div class="f1-profile-hero">' +
          '<div class="f1-profile-top">' +
            '<div class="f1-profile-title">' +
              '<h2>' + U.escapeHtml(fighter.name) + '</h2>' +
              '<div class="f1-profile-sub">' +
                '<span class="pill flag-mini">' + fighterCountryLabel(fighter) + '</span>' +
                '<span class="pill">' + U.escapeHtml(U.findTrack(fighter.trackId).label) + '</span>' +
                '<span class="pill">' + weightText + '</span>' +
                (fighter.retired ? '<span class="pill red">завершил</span>' : '') +
              '</div>' +
            '</div>' +
            '<div class="f1-profile-ovr"><strong>' + ovr + '</strong><span>OVR</span></div>' +
          '</div>' +
          '<div class="f1-profile-grid">' +
            '<div class="f1-profile-stat"><span>Рекорд</span><strong>' + U.escapeHtml(U.recordText(fighter.record)) + '</strong></div>' +
            '<div class="f1-profile-stat"><span>Возраст</span><strong>' + fighter.age + '</strong></div>' +
            '<div class="f1-profile-stat"><span>Баланс</span><strong>$' + (fighter.money || 0) + '</strong></div>' +
            '<div class="f1-profile-stat"><span>Статус</span><strong>' + U.escapeHtml(stage.label) + '</strong></div>' +
            '<div class="f1-profile-stat"><span>Зал</span><strong>' + U.escapeHtml(club ? club.name : 'Без клуба') + '</strong></div>' +
            '<div class="f1-profile-stat"><span>Вес</span><strong>' + weightText + '</strong></div>' +
          '</div>' +
          '<div class="row">' + (!fighter.isPlayer ? favoriteButton(state, fighter.id) : '') + '<button class="small-btn" data-path-rank-info="' + U.escapeHtml(fighter.trackId) + '">Статусы</button></div>' +
        '</div>' +
        '<div class="skills" style="margin-top:12px"><div class="label">Навыки</div>' +
          renderSkillRow('Сила', fighter.stats.power) +
          renderSkillRow('Техника', fighter.stats.technique) +
          renderSkillRow('Скорость', fighter.stats.speed) +
          renderSkillRow('Выносливость', fighter.stats.stamina) +
          renderSkillRow('Защита / здоровье', fighter.stats.defense || fighter.stats.health) +
        '</div>' +
        '<div class="content-card" style="margin-top:12px"><h3>Награды</h3>' + renderFighterAwards(state, fighter) + '</div>' +
        '<div class="content-card" style="margin-top:12px"><h3>Титулы</h3>' + renderFighterTitles(state, fighter) + '</div>' +
        '<div class="content-card" style="margin-top:12px"><h3>История карьеры</h3>' + renderCareerLog(state, fighter, 8) + '</div>' +
      '</div>' +
      '<div class="modal-actions"><button data-action="close-modal">Закрыть</button></div>' +
    '</div></div>';
  }`;

  const renderClubModal = `function renderClubModal(state, club) {
    var roster = window.FS.Clubs.clubRoster(state, club.id).slice(0, 30);
    var strongest = window.FS.Clubs.strongestFighter(state, club.id);
    var coach = club.coach || { name: club.coachName || "Тренер", age: "—", record: { wins: 0, losses: 0, draws: 0 }, id: "" };
    var coachButton = coach.id ? "<button class=\\"small-btn\\" data-person=\\"" + U.escapeHtml(coach.id) + "\\">" + U.escapeHtml(coach.name) + "</button>" : U.escapeHtml(coach.name);

    function rosterRow(fighter) {
      return '<div class="f1-roster-row">' +
        '<div class="f1-roster-info">' +
          '<button class="small-btn fighter-name-btn" data-fighter="' + U.escapeHtml(fighter.id) + '">' + U.escapeHtml(fighter.name) + '</button>' +
          (fighter.isPlayer ? ' <span class="pill green">ты</span>' : '') +
          '<span class="pill flag-mini">' + fighterCountryLabel(fighter) + '</span>' +
          '<span class="pill">' + U.escapeHtml(U.findTrack(fighter.trackId).label) + '</span>' +
          '<span class="pill">' + U.escapeHtml(U.recordText(fighter.record)) + '</span>' +
        '</div>' +
        '<span class="pill gold">OVR ' + U.statAverage(fighter.stats) + '</span>' +
      '</div>';
    }

    return '<div class="modal-backdrop"><div class="modal club-profile-modal">' +
      '<div class="modal-head"><h2>' + U.escapeHtml(club.name) + '</h2><div class="muted small">' + countryLabel(club.countryId) + ' · уровень ' + club.level + ' · OVR ' + club.minOvr + '–' + club.maxOvr + '</div></div>' +
      '<div class="modal-body">' +
        '<div class="grid two">' +
          '<div class="stat-card"><div class="label">Тренер</div><div class="value" style="font-size:18px">' + coachButton + '</div><div class="muted small">' + (coach.countryId ? countryLabel(coach.countryId) + ' · ' : '') + coach.age + ' лет · ' + (coach.record.wins || 0) + '-' + (coach.record.losses || 0) + '-' + (coach.record.draws || 0) + '</div></div>' +
          '<div class="stat-card"><div class="label">Сильнейший</div><div class="value" style="font-size:18px">' + (strongest ? U.escapeHtml(strongest.name) : '—') + '</div><div>' + (strongest ? '<button class="small-btn" data-fighter="' + U.escapeHtml(strongest.id) + '">Открыть бойца</button>' : '') + '</div></div>' +
        '</div>' +
        '<div class="content-card" style="margin-top:12px"><div class="split-row"><span>Ростер</span><strong>' + roster.length + '+</strong></div><div class="f1-roster-list">' + roster.map(rosterRow).join("") + '</div></div>' +
      '</div>' +
      '<div class="modal-actions"><button data-action="close-modal">Закрыть</button></div>' +
    '</div></div>';
  }`;

  js = replaceFunction(js, "renderFightsTab", renderFightsTab);
  js = replaceFunction(js, "renderFighterModal", renderFighterModal);
  js = replaceFunction(js, "renderClubModal", renderClubModal);

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

  js = js.replace(/fromUpdateButton=\d+\.\d+\.\d+/g, "fromUpdateButton=2.5.1");
  js = js.replace(/target=\d+\.\d+\.\d+/g, "target=2.5.1");
  js = js.replace(/cacheReset=\d+\.\d+\.\d+/g, "cacheReset=2.5.1");

  write("src/app.js", js);
}

function verify() {
  console.log("\n== verify ==");
  const styles = read("src/styles.css");
  const render = read("src/ui/render.js");
  const app = read("src/app.js");

  const errors = [];
  if (!styles.includes("Mobile Fixes 2.5.1")) errors.push("styles.css missing Mobile Fixes 2.5.1");
  if (!render.includes("flagEmoji")) errors.push("render.js missing flag emoji fallback");
  if (!render.includes("f1-fight-row")) errors.push("render.js missing compact fight rows");
  if (!render.includes("f1-profile-hero")) errors.push("render.js missing F1 profile modal");
  if (!render.includes("f1-roster-row")) errors.push("render.js missing roster row layout");
  if (!app.includes("mobileMoreCloseTarget")) errors.push("app.js missing outside-close handler");

  if (errors.length) {
    throw new Error("Verification failed:\n" + errors.join("\n"));
  }

  console.log("OK: mobile fixes applied");
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
  console.log('  git commit -m "Fix mobile UI layout"');
  console.log("  git push origin main");
}

main();
