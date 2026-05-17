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

if (!state.offers || state.offers.filter((offer) => !offer.isCompetition).length !== 3) throw new Error("normal offers != 3");
if (!state.clubs.length) throw new Error("clubs not created");
if (!Object.keys(state.titles).length) throw new Error("titles not created");
if (Object.values(state.titles).some((title) => title.trackId === "amateur")) throw new Error("amateur title still exists");

const p = FS.State.player(state);
p.stats.power = 90;
p.stats.technique = 90;
p.stats.speed = 90;
p.stats.stamina = 90;
p.stats.defense = 90;
FS.World.refreshOffers(state);

const comps = FS.Amateur.availableCompetitions(state);
if (!comps.length) throw new Error("competitions missing");
const countryComp = comps.find((comp) => comp.id === "country");
if (!countryComp || !countryComp.available) throw new Error("country comp should be available after stat boost");

const compOffer = FS.Amateur.createCompetitionOffer(state, countryComp.id);
if (!compOffer || !compOffer.isCompetition) throw new Error("competition offer failed");
if (!state.offers.some((offer) => offer.id === compOffer.id)) throw new Error("competition offer not stored");

const preview = FS.Fight.buildFightPreview(state, compOffer.id);
if (!preview || preview.winChance <= 12) throw new Error("competition preview failed");

/* Original bug: render refresh must not delete the 4th competition offer. */
const normalCount = state.offers.filter((offer) => !offer.isCompetition).length;
if (normalCount !== 3) throw new Error("normal offers count changed before fight");
if (!state.offers.some((offer) => offer.id === compOffer.id)) throw new Error("competition offer missing before fight");

FS.Fight.resolvePlayerFight(state, compOffer.id);
if (!state.modal || state.modal.type !== "fightResult") throw new Error("accept tournament fight failed");
if (state.offers.some((offer) => offer.id === compOffer.id)) throw new Error("competition offer not removed after fight");

const awards = FS.State.getFighterAwards(state, p);
if (!awards.length) throw new Error("amateur award missing after tournament check");

FS.Titles.ensureTitles(state);
if (Object.values(state.titles).some((title) => title.trackId === "amateur")) throw new Error("amateur titles recreated");

state.selectedTab = "ranking";
state.rankingTrackId = "amateur";
state.rankingCountryId = p.countryId;
state.rankingWeightClassId = p.weightClassId;
let html = FS.Render.dashboard(state);
if (html.includes("👑")) throw new Error("amateur ranking crown found");
if (!html.includes("разряд") && !html.includes("МС") && !html.includes("КМС")) throw new Error("amateur rank info missing");

state.rankingTrackId = "pro";
state.rankingWeightClassId = p.weightClassId;
html = FS.Render.dashboard(state);
if (!html.includes("мир") && !html.includes("Мировой рейтинг")) throw new Error("pro world ranking label missing");

state.modal = { type: "fighter", fighterId: p.id };
html = FS.Render.dashboard(state);
if (!html.includes("Награды")) throw new Error("amateur card awards missing");

const continentComp = FS.Amateur.getCompetition("continent");
const worldComp = FS.Amateur.getCompetition("world");
const olympiadComp = FS.Amateur.getCompetition("olympiad");
if (continentComp.scope !== "continent") throw new Error("continent scope broken");
if (worldComp.scope !== "world") throw new Error("world scope broken");
if (olympiadComp.scope !== "world_elite") throw new Error("olympiad scope broken");

const exported = FS.Storage.exportString(state);
const imported = FS.Storage.importString(exported);
if (!imported || !FS.State.player(imported)) throw new Error("export/import failed");

[
  "Season Bundle 0.9.0",
  "Старый монолит",
  "Титулы</button>"
].forEach((bad) => {
  if (html.includes(bad)) throw new Error("forbidden UI text found: " + bad);
});

console.log("ratings tournaments hotfix smoke ok", {
  version: FS.Data.appVersion,
  week: state.week,
  normalOffers: state.offers.filter((offer) => !offer.isCompetition).length,
  awards: awards.length,
  titles: Object.keys(state.titles).length,
  competitions: comps.length
});
