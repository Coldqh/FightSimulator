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
  "src/core/amateur.js",
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
if (!state.clubs.length) throw new Error("clubs not created");
if (!Object.keys(state.titles).length) throw new Error("titles not created");
if (!state.amateurPath) throw new Error("amateur path missing");

const p = FS.State.player(state);
p.stats.power = 85;
p.stats.technique = 85;
p.stats.speed = 85;
p.stats.stamina = 85;
p.stats.defense = 85;
FS.World.refreshOffers(state);

const comps = FS.Amateur.availableCompetitions(state);
if (!comps.length) throw new Error("competitions missing");
if (!comps.some((comp) => comp.available)) throw new Error("no available amateur competitions");

const compOffer = FS.Amateur.createCompetitionOffer(state, comps.find((comp) => comp.available).id);
if (!compOffer || !compOffer.isCompetition) throw new Error("competition offer failed");

const preview = FS.Fight.buildFightPreview(state, compOffer.id);
if (!preview || preview.winChance <= 12) throw new Error("competition preview failed");

FS.Fight.resolvePlayerFight(state, compOffer.id);
if (!state.modal || state.modal.type !== "fightResult") throw new Error("competition fight result failed");

const amateurSummary = FS.Amateur.worldSummary(state);
if (!Number.isFinite(amateurSummary.points)) throw new Error("amateur summary failed");

const audit = FS.Matchmaking.auditWorld(state);
if (!audit || audit.fighters < 1 || audit.clubs < 1) throw new Error("audit failed");

const exported = FS.Storage.exportString(state);
const imported = FS.Storage.importString(exported);
if (!imported || !FS.State.player(imported)) throw new Error("export/import failed");

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

state.selectedTab = "world";
html = FS.Render.dashboard(state);
[
  "Турнирная лестница",
  "Заявиться",
  "Очки"
].forEach((word) => {
  if (!html.includes(word)) throw new Error("amateur UI missing " + word);
});

state.selectedTab = "settings";
html = FS.Render.dashboard(state);
if (!html.includes("patch-notes") && !html.includes("Патч")) throw new Error("patch notes button missing");

state.modal = { type: "patchNotes" };
html = FS.Render.dashboard(state);
if (!html.includes("src/core/amateur.js")) throw new Error("patch notes modal missing");

[
  "Season Bundle 0.9.0",
  "Старый монолит",
  "Титулы</button>"
].forEach((bad) => {
  if (html.includes(bad)) throw new Error("forbidden UI text found: " + bad);
});

console.log("amateur ladder smoke ok", {
  version: FS.Data.appVersion,
  week: state.week,
  offers: state.offers.length,
  competitions: comps.length,
  amateurPoints: amateurSummary.points,
  clubs: state.clubs.length
});
