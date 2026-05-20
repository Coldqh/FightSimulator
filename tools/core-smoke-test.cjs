const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const sandbox = {
  console,
  window: {
    prompt(){return ""},
    alert(){},
    matchMedia(){return {matches:false}},
    document:{querySelectorAll(){return []}}
  },
  localStorage: {
    store:{},
    getItem(k){return this.store[k] || null},
    setItem(k,v){this.store[k] = String(v)},
    removeItem(k){delete this.store[k]}
  },
  document: {
    getElementById(){return {innerHTML:"", value:""}},
    querySelector(){return {value:"amateur"}},
    addEventListener(){}
  }
};
sandbox.window.window=sandbox.window;
sandbox.window.console=console;
sandbox.window.localStorage=sandbox.localStorage;
sandbox.window.document=sandbox.document;
sandbox.window.matchMedia=sandbox.window.matchMedia;
sandbox.global=sandbox.window;

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
].forEach(f => vm.runInNewContext(fs.readFileSync(path.join(root,f),"utf8"), sandbox.window, {filename:f}));

const FS = sandbox.window.FS;
if (FS.Data.appVersion !== "persistent-save-2.2.2") throw new Error("bad version "+FS.Data.appVersion);
if (FS.Data.saveSchemaVersion !== 222) throw new Error("bad schema "+FS.Data.saveSchemaVersion);

function make(archetypeId, countryId="russia") {
  const state = FS.State.createCareer({name:"Smoke", archetypeId, countryId, weightClassId:"welter"});
  FS.World.bootstrapWorld(state);
  FS.State.repairState(state);
  return state;
}

let state = make("amateur","russia");
let p = FS.State.player(state);

/* Training */
const tp = p.trainingPoints;
const fat = p.fatigue;
FS.State.trainPlayer(state);
if (p.trainingPoints !== tp + 3) throw new Error("training must add exactly 3 points");
if (p.fatigue !== Math.min(94, fat + 20)) throw new Error("training fatigue must be +20 capped at 94");

/* Win chance buff sanity */
let weaker = state.roster.find(f => !f.isPlayer && f.trackId === p.trackId && f.weightClassId === p.weightClassId && FS.Utils.statAverage(f.stats) < FS.Utils.statAverage(p.stats));
let stronger = state.roster.find(f => !f.isPlayer && f.trackId === p.trackId && f.weightClassId === p.weightClassId && FS.Utils.statAverage(f.stats) > FS.Utils.statAverage(p.stats));
if (weaker && FS.Fight.estimateWinChance(p, weaker) < 55) throw new Error("win chance against weaker too low");
if (stronger && FS.Fight.estimateWinChance(p, stronger) < 12) throw new Error("underdog chance floor broken");

/* Offers exist and lower amateurs are local only */
FS.World.refreshOffers(state);
if ((state.offers || []).filter(o => !o.isCompetition).length !== 10) throw new Error("player offers not 10");
let rank = FS.State.rankForFighter(p).id;
if (rank !== "ms" && rank !== "msmk") {
  const badIntl = state.offers.some(o => {
    const f = FS.Utils.getFighterById(state, o.opponentId);
    return f && f.countryId !== p.countryId && FS.Utils.findCountry(f.countryId).localPoolId !== FS.Utils.findCountry(p.countryId).localPoolId;
  });
  if (badIntl) throw new Error("international opponents before MS");
}

/* Fight skip: no punch log, fatigue 25/40, NPC career log includes player */
let offer = state.offers.find(o => !o.isCompetition);
let opp = FS.Utils.getFighterById(state, offer.opponentId);
let beforeOppLog = (opp.careerLog || []).length;
FS.Fight.resolveRandomFight(state, offer.id);
if (!state.modal || state.modal.type !== "fightResult") throw new Error("fight result modal missing");
if ((state.modal.roundLog || []).length !== 0 || state.modal.statsLine !== "Бой решён автоматически.") throw new Error("auto fight should not show punch log");
if ((opp.careerLog || []).length <= beforeOppLog || !opp.careerLog[0].text.includes(p.name)) throw new Error("NPC history does not include player fight");
if (p.fatigue > 94) throw new Error("fatigue cap 94 broken");

/* Team OVR auto: make player absurdly strong and rebuild */
p.stats.power = 121; p.stats.technique = 121; p.stats.speed = 121; p.stats.stamina = 121; p.stats.defense = 121;
FS.State.updateDerivedFighterFields(p);
FS.World.buildNationalTeams(state);
const team = state.world.teamsByCountry[p.homeCountryId || p.countryId];
if (team.main.indexOf(p.id) === -1) throw new Error("player with top OVR should enter main team");

/* Automatic pro move at 121 */
FS.State.checkAutomaticProMove(state, p);
if (p.trackId !== "pro") throw new Error("auto pro at 121 failed");

/* News clickable buttons */
FS.World.createNews(state, "tournament", "Проверка новости: "+opp.name+".", {fighterIds:[opp.id]});
state.selectedTab = "news";
state.modal = null;
let html = FS.Render.dashboard(state);
if (!html.includes('data-fighter="'+opp.id+'"')) throw new Error("news profile button missing");

/* Titles all/past title rendering */
let pro = make("debt_pro","usa");
let proP = FS.State.player(pro);
FS.World.buildProContracts(pro);
let contract = pro.world.proContracts[0];
if (!contract) throw new Error("pro contracts missing");
FS.World.acceptProContract(pro, contract.id);
pro.week = proP.nextFightWeek - 1;
FS.World.advanceWeek(pro, "skip");
if (!pro.modal || pro.modal.type !== "proContractPreview") throw new Error("pro fight should appear on contract week");

/* Tournament scheduling source checks */
const amateurSource = fs.readFileSync(path.join(root,"src/core/amateur.js"),"utf8");
if (!amateurSource.includes("12 раз в год") || !amateurSource.includes("1 раз в 2 года")) throw new Error("new tournament frequency labels missing");
const worldSource = fs.readFileSync(path.join(root,"src/core/world.js"),"utf8");
if (!worldSource.includes("simulateAutonomousTournaments") || !worldSource.includes("awardNpcTournament")) throw new Error("autonomous tournaments missing");
const renderSource = fs.readFileSync(path.join(root,"src/ui/render.js"),"utf8");
if (!renderSource.includes("newsProfiles") || !renderSource.includes("fighterTitleHistory") || !renderSource.includes("pathRankInfo")) throw new Error("UI patch pieces missing");


/* Persistent save 2.2.2 checks */
const savedBefore = JSON.stringify(state);
FS.Storage.save(state);
if (!sandbox.localStorage.store[FS.Data.saveKey]) throw new Error("primary save missing");
if (!sandbox.localStorage.store[FS.Data.saveKey + "_backup"]) throw new Error("backup save missing");
if (!sandbox.localStorage.store[FS.Data.saveKey + "_last_good"]) throw new Error("last_good save missing");
const summary = FS.Storage.savedSummary();
if (!summary || summary.week !== state.week || !summary.name) throw new Error("saved summary broken");
const loadedAgain = FS.Storage.load();
if (!loadedAgain || loadedAgain.week !== state.week || loadedAgain.version !== FS.Data.appVersion) throw new Error("load did not preserve week/version");
sandbox.localStorage.removeItem(FS.Data.saveKey);
const backupLoaded = FS.Storage.load();
if (!backupLoaded || backupLoaded.week !== state.week) throw new Error("backup load failed");
let startHtml = FS.Render.start(FS.Storage.savedSummary());
if (!startHtml.includes("Продолжить карьеру") || !startHtml.includes("Импорт")) throw new Error("start menu continue/import missing");

console.log("persistent save smoke ok", {
  version: FS.Data.appVersion,
  schema: FS.Data.saveSchemaVersion,
  offers: state.offers.length,
  fatigue: p.fatigue,
  playerTrack: p.trackId,
  proModal: pro.modal.type
});
