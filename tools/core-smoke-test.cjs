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
if (FS.Data.amateurRanks.length !== 6) throw new Error("junior ranks not removed");
if (p.gymId) throw new Error("player should start without club");
if (FS.Clubs.playerClub(state)) throw new Error("player club should be null at start");

FS.Data.weightClasses.forEach(w => {
  const count = state.roster.filter(f => f.trackId === "pro" && f.weightClassId === w.id).length;
  if (count < 100) throw new Error("pro weight pool too small " + w.id + " " + count);
});
FS.Data.countries.forEach(c => {
  const street = state.roster.filter(f => f.trackId === "street" && f.countryId === c.id);
  if (street.length < 1000) throw new Error("street country pool too small " + c.id + " " + street.length);
  if (street.some(f => f.weightClassId)) throw new Error("street fighter has weight");
  const expected = { adult_3:500, adult_2:300, adult_1:150, kms:60, ms:30, msmk:15 };
  Object.keys(expected).forEach(rankId => {
    const count = state.roster.filter(f => f.trackId === "amateur" && f.countryId === c.id && f.amateurRankId === rankId).length;
    if (count < Math.floor(expected[rankId] * 0.65)) throw new Error("amateur rank pool too small " + c.id + " " + rankId + " " + count);
  });
});

FS.World.refreshOffers(state);
const normalOffers = state.offers.filter(o => !o.isCompetition);
if (normalOffers.length !== 3) throw new Error("normal offers != 3");
const oppIds = normalOffers.map(o => o.opponentId);
if (new Set(oppIds).size !== oppIds.length) throw new Error("duplicate fight opponents in offers");

const weekBeforeUpgrade = state.week;
FS.State.trainPlayer(state);
const pointsAfterTraining = p.trainingPoints;
FS.State.trainPlayer(state, "power");
if (state.week !== weekBeforeUpgrade) throw new Error("stat upgrade advanced week");
if (p.trainingPoints !== pointsAfterTraining - 1) throw new Error("stat upgrade did not spend one point");

p.stats.power = 52; p.stats.technique = 52; p.stats.speed = 52; p.stats.stamina = 52; p.stats.defense = 52;
FS.State.updateDerivedFighterFields(p);
const comps = FS.Amateur.availableCompetitions(state);
const comp = comps.find(c => c.available);
if (!comp) throw new Error("no tournament available");
const compOffer = FS.Amateur.createCompetitionOffer(state, comp.id);
const startWeek = state.week;
FS.Fight.resolvePlayerFight(state, compOffer.id);
if (state.week !== startWeek) throw new Error("tournament fight advanced week");
if (state.modal && state.modal.result === "Победа" && state.modal.tournamentStillRunning && !state.offers.some(o => o.id === compOffer.id)) {
  throw new Error("tournament should continue but offer disappeared");
}

state.selectedTab = "ranking";
state.rankingTrackId = "street";
state.rankingCountryId = "russia";
state.rankingPage = 1;
let html = FS.Render.dashboard(state);
if (!html.includes("Страница 2")) throw new Error("ranking pagination missing");
if (!html.includes("Без весов")) throw new Error("street no-weight UI missing");

state.selectedTab = "settings";
html = FS.Render.dashboard(state);
if (html.includes("Настройки карьеры") || html.includes("Смена веса")) throw new Error("career settings still in settings");

state.selectedTab = "profile";
html = FS.Render.dashboard(state);
["Смена пути", "Смена веса", "Перелёт", "Рекорды по путям"].forEach(word => {
  if (!html.includes(word)) throw new Error("profile missing " + word);
});

const oldCountry = p.countryId;
FS.State.setPlayerCountry(state, oldCountry === "russia" ? "mexico" : "russia");
if (p.gymId) throw new Error("travel should clear gym");

FS.State.setPlayerTrack(state, "street");
p.record.wins = 7;
p.trackRecords.street = FS.State.cloneRecord(p.record);
FS.State.setPlayerTrack(state, "amateur");
if (p.record.wins === 7) throw new Error("track record did not switch away from street");
FS.State.setPlayerTrack(state, "street");
if (p.record.wins !== 7) throw new Error("street record not restored");

const beforeNpc = state.roster.filter(f => !f.isPlayer).reduce((sum, f) => sum + f.record.wins + f.record.losses + f.record.draws, 0);
FS.World.advanceWeek(state, "skip");
const afterNpc = state.roster.filter(f => !f.isPlayer).reduce((sum, f) => sum + f.record.wins + f.record.losses + f.record.draws, 0);
if (afterNpc <= beforeNpc) throw new Error("NPC fights did not change records");

FS.Titles.ensureTitles(state);
FS.Data.weightClasses.forEach(w => {
  const proTitles = Object.values(state.titles).filter(t => t.trackId === "pro" && t.weightClassId === w.id);
  if (proTitles.length !== 4) throw new Error("pro belts != 4 for " + w.id);
});

const exported = FS.Storage.exportString(state);
const imported = FS.Storage.importString(exported);
if (!imported || !FS.State.player(imported)) throw new Error("export/import failed");

console.log("career world rework smoke ok", {
  version: FS.Data.appVersion,
  fighters: state.roster.length,
  offers: normalOffers.length,
  streetRussia: state.roster.filter(f => f.trackId === "street" && f.countryId === "russia").length,
  week: state.week,
  points: p.trainingPoints
});
