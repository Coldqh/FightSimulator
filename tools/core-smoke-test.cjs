const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const sandbox = {
  console,
  window: {
    prompt() { return ""; },
    alert() {}
  },
  localStorage: {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, value) { this.store[key] = String(value); },
    removeItem(key) { delete this.store[key]; }
  }
};
sandbox.window.window = sandbox.window;
sandbox.window.console = console;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.global = sandbox.window;

[
  "src/data/game-data.js",
  "src/core/utils.js",
  "src/core/storage.js",
  "src/core/state.js",
  "src/core/clubs.js",
  "src/core/titles.js",
  "src/core/stories.js",
  "src/core/matchmaking.js",
  "src/core/world.js",
  "src/core/fight.js",
  "src/ui/render.js"
].forEach((file) => {
  vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox.window, { filename: file });
});

const FS = sandbox.window.FS;

let state = FS.State.createCareer({
  name: "Smoke",
  age: 18,
  countryId: "russia",
  trackId: "amateur",
  weightClassId: "welter",
  stanceId: "orthodox"
});

FS.World.bootstrapWorld(state);
FS.State.repairState(state);

if (!state.offers || state.offers.length !== 3) throw new Error("offers != 3");
if (!state.offers[0].opponentTier) throw new Error("opponent tier missing");
if (!state.clubs.length) throw new Error("clubs not created");
if (!Object.keys(state.titles).length) throw new Error("titles not created");

const p = FS.State.player(state);
p.stats.power = 85;
p.stats.technique = 85;
p.stats.speed = 85;
p.stats.stamina = 85;
p.stats.defense = 85;
FS.World.refreshOffers(state);

const preview = FS.Fight.buildFightPreview(state, state.offers[0].id);
if (!preview || preview.winChance <= 12 || !preview.opponentTier) throw new Error("fight preview bad");

const tier = FS.Matchmaking.careerTier(FS.Utils.getFighterById(state, state.offers[0].opponentId));
if (!tier || !tier.label) throw new Error("career tier missing");

const audit = FS.Matchmaking.auditWorld(state);
if (!audit || audit.fighters < 1 || audit.clubs < 1) throw new Error("audit failed");

FS.Fight.resolvePlayerFight(state, state.offers[0].id);
if (!state.modal || state.modal.type !== "fightResult") throw new Error("fight result failed");
if (!state.modal.roundLog || !state.modal.roundLog.length) throw new Error("round log missing");

const exported = FS.Storage.exportString(state);
const imported = FS.Storage.importString(exported);
if (!imported || !FS.State.player(imported)) throw new Error("export/import failed");

for (let i = 0; i < 4; i += 1) {
  FS.World.advanceWeek(state, "skip");
}

let html = FS.Render.dashboard(state);
[
  "Версия",
  FS.Data.appVersion,
  "Настройки",
  "Любительский путь",
  "Мой клуб"
].forEach((word) => {
  if (!html.includes(word)) throw new Error("render missing " + word);
});

state.selectedTab = "settings";
html = FS.Render.dashboard(state);
[
  "Диагностика мира",
  "Экспорт",
  "Импорт"
].forEach((word) => {
  if (!html.includes(word)) throw new Error("settings missing " + word);
});

state.modal = { type: "worldAudit", report: audit };
html = FS.Render.dashboard(state);
if (!html.includes("Бойцы") || !html.includes("Титулы")) throw new Error("audit modal missing");

state.selectedTab = "ranking";
state.modal = null;
html = FS.Render.dashboard(state);
if (!html.includes("👑")) throw new Error("ranking crown missing");

[
  "Season Bundle 0.9.0",
  "Старый монолит",
  "Титулы</button>"
].forEach((bad) => {
  if (html.includes(bad)) throw new Error("forbidden UI text found: " + bad);
});

console.log("realism matchmaking smoke ok", {
  version: FS.Data.appVersion,
  week: state.week,
  chance: preview.winChance,
  offers: state.offers.length,
  tier: tier.label,
  fighters: audit.fighters,
  clubs: audit.clubs
});
