const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const sandbox = {
  console,
  window: { prompt() { return ""; }, alert() {} },
  localStorage: { store: {}, getItem(k){return this.store[k]||null}, setItem(k,v){this.store[k]=String(v)}, removeItem(k){delete this.store[k]} }
};
sandbox.window.window = sandbox.window;
sandbox.window.console = console;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.global = sandbox.window;

[
  "src/data/game-data.js","src/core/utils.js","src/core/storage.js","src/core/state.js","src/core/clubs.js","src/core/titles.js","src/core/stories.js","src/core/matchmaking.js","src/core/amateur.js","src/core/world.js","src/core/fight.js","src/ui/render.js"
].forEach((file) => vm.runInNewContext(fs.readFileSync(path.join(root,file),"utf8"), sandbox.window, { filename:file }));

const FS = sandbox.window.FS;
let state = FS.State.createCareer({ name:"Smoke", age:18, countryId:"russia", trackId:"amateur", weightClassId:"welter", stanceId:"orthodox" });
FS.World.bootstrapWorld(state);
FS.State.repairState(state);

const p = FS.State.player(state);
if (p.gymId) throw new Error("player should start without club");
if (FS.Clubs.playerClub(state)) throw new Error("player club should be null at start");
if (FS.Data.tactics) throw new Error("tactics data should be removed");
if (FS.Data.amateurRanks.length !== 9) throw new Error("amateur ranks != 9");

const proByWeight = {};
FS.Data.weightClasses.forEach(w => proByWeight[w.id] = state.roster.filter(f => f.trackId === "pro" && f.weightClassId === w.id).length);
Object.keys(proByWeight).forEach(w => { if (proByWeight[w] < 100) throw new Error("pro weight pool too small "+w+" "+proByWeight[w]); });

FS.Data.countries.forEach(c => {
  const street = state.roster.filter(f => f.trackId === "street" && f.countryId === c.id);
  if (street.length < 100) throw new Error("street country pool too small "+c.id);
  if (street.some(f => f.weightClassId)) throw new Error("street fighter has weight");
  FS.Data.amateurRanks.forEach(r => {
    const count = state.roster.filter(f => f.trackId === "amateur" && f.countryId === c.id && f.amateurRankId === r.id).length;
    if (count < 20) throw new Error("amateur rank pool too small "+c.id+" "+r.id+" "+count);
  });
});

FS.Titles.ensureTitles(state);
if (Object.values(state.titles).some(t => t.trackId === "amateur")) throw new Error("amateur title exists");
FS.Data.weightClasses.forEach(w => {
  const proTitles = Object.values(state.titles).filter(t => t.trackId === "pro" && t.weightClassId === w.id);
  if (proTitles.length !== 4) throw new Error("pro belts != 4 for "+w.id+" got "+proTitles.length);
  const bodies = proTitles.map(t => t.bodyId).sort().join(",");
  if (bodies !== "ibf,wba,wbc,wbo") throw new Error("wrong belt bodies "+bodies);
});

let html = FS.Render.dashboard(state);
if (html.includes("Тактика") || html.includes("Ближайшее действие") || html.includes("Одноклубник")) throw new Error("removed UI block still visible");
if (!html.includes("Очки прокачки")) throw new Error("training points not visible");

const oldPoints = p.trainingPoints || 0;
FS.State.trainPlayer(state);
if (p.trainingPoints <= oldPoints) throw new Error("training week did not add points");
const beforePower = p.stats.power;
FS.State.trainPlayer(state, "power");
if (p.stats.power <= beforePower) throw new Error("training point did not improve stat");

state.selectedTab = "ranking";
state.rankingTrackId = "street";
state.rankingCountryId = "russia";
html = FS.Render.dashboard(state);
if (!html.includes("Без весов")) throw new Error("street no-weight ranking missing");

state.rankingTrackId = "pro";
state.rankingWeightClassId = "welter";
html = FS.Render.dashboard(state);
if (!html.includes("👑WBC") || !html.includes("👑WBA") || !html.includes("👑WBO") || !html.includes("👑IBF")) throw new Error("four pro crowns missing");

const titles = Object.values(state.titles).filter(t => t.trackId === "pro" && t.weightClassId === "welter");
const champA = titles[0].championId;
const champB = titles[1].championId;
const moved = FS.Titles.unifyBeltsAfterFight(state, champA, champB);
if (moved < 1) throw new Error("belt unification failed");
const champATitles = Object.values(state.titles).filter(t => t.championId === champA && t.trackId === "pro" && t.weightClassId === "welter");
if (champATitles.length < 2) throw new Error("unified champion should have 2 belts");

const comps = FS.Amateur.availableCompetitions(state);
if (!comps[0].rounds || !comps[0].rounds.includes("1/32")) throw new Error("tournament bracket missing");

const exported = FS.Storage.exportString(state);
const imported = FS.Storage.importString(exported);
if (!imported || !FS.State.player(imported)) throw new Error("export/import failed");

console.log("structural rework smoke ok", {
  version: FS.Data.appVersion,
  fighters: state.roster.length,
  proWelter: proByWeight.welter,
  titles: Object.keys(state.titles).length,
  playerClub: FS.Clubs.playerClub(state) ? "has club" : "none",
  points: p.trainingPoints
});
