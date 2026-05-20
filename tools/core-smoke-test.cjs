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
if (FS.Data.appVersion !== "fatigue-mobile-layout-2.2.9") throw new Error("bad version "+FS.Data.appVersion);
if (FS.Data.saveSchemaVersion !== 230) throw new Error("bad schema "+FS.Data.saveSchemaVersion);

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
if (weaker && FS.Fight.estimateWinChance(p, weaker) < 45) throw new Error("win chance against weaker too low");
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
if (!renderSource.includes("interactiveText") || !renderSource.includes("fighterTitleHistory") || !renderSource.includes("pathRankInfo")) throw new Error("UI patch pieces missing");


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


/* 2.2.4 regression checks */
const renderSource224 = fs.readFileSync(path.join(root,"src/ui/render.js"),"utf8");
if (!renderSource224.includes("3 взрослый — OVR 0-19") || !renderSource224.includes("Претендент — OVR 120-149")) throw new Error("rank condition modal missing");
const worldSource224 = fs.readFileSync(path.join(root,"src/core/world.js"),"utf8");
if (worldSource224.includes("Обновлены составы сборных")) throw new Error("generic team news still exists");
const titlesSource224 = fs.readFileSync(path.join(root,"src/core/titles.js"),"utf8");
if (titlesSource224.includes("U.scoreFighter(challenger) > U.scoreFighter(currentChampion) + 10")) throw new Error("magic title auto-transfer still exists");
const stateSource224 = fs.readFileSync(path.join(root,"src/core/state.js"),"utf8");
if (!stateSource224.includes("COUNTRY_NAME_OVERRIDES") || !stateSource224.includes("versionNameFixed")) throw new Error("country-specific name repair missing");
const storageSource224 = fs.readFileSync(path.join(root,"src/core/storage.js"),"utf8");
if (!storageSource224.includes("indexedDB") || !storageSource224.includes("loadAsync")) throw new Error("indexedDB save fallback missing");

console.log("tournament ranks save smoke ok", {
  version: FS.Data.appVersion,
  schema: FS.Data.saveSchemaVersion,
  offers: state.offers.length,
  fatigue: p.fatigue,
  playerTrack: p.trackId,
  proModal: pro.modal.type
});

/* 2.2.4.1 rank OVR-only checks */
{
  const mmSource = fs.readFileSync(path.join(root,"src/core/matchmaking.js"),"utf8");
  const tierStart = mmSource.indexOf("function careerTier(");
  const tierEnd = mmSource.indexOf("\n  function ", tierStart + 20);
  const careerTierSource = tierEnd > tierStart ? mmSource.slice(tierStart, tierEnd) : mmSource.slice(tierStart);
  const renderSource = fs.readFileSync(path.join(root,"src/ui/render.js"),"utf8");
  if (careerTierSource.includes("wins >=") || careerTierSource.includes("record.wins") || careerTierSource.includes("побед")) {
    throw new Error("careerTier rank logic still uses victories");
  }
  ["8+ побед", "16+ побед", "25+ побед", "50+ побед", "меньше 8 побед"].forEach((bad) => {
    if (renderSource.includes(bad)) throw new Error("rank modal still mentions victories: " + bad);
  });
  if (!renderSource.includes("Местный боец — OVR 60-104") || !renderSource.includes("Претендент — OVR 120-149") || !renderSource.includes("Элита — OVR 150+")) {
    throw new Error("OVR-only rank modal text missing");
  }
}

/* 2.2.6 update notification source checks */
{
  const appSource = fs.readFileSync(path.join(root,"src/app.js"),"utf8");
  const swSource = fs.readFileSync(path.join(root,"sw.js"),"utf8");
  if (!appSource.includes("showUpdateNotice") || !appSource.includes("Обновить до последней версии")) {
    throw new Error("update notification UI missing");
  }
  if (!appSource.includes("controllerchange") || !appSource.includes("registration.update")) {
    throw new Error("service worker update hooks missing");
  }
  if (!swSource.includes("networkFirstStatic") || !swSource.includes("version.json")) {
    throw new Error("version.json network-first update check missing");
  }
}

/* 2.2.7 mobile source checks */
{
  const renderSource227 = fs.readFileSync(path.join(root,"src/ui/render.js"),"utf8");
  const cssSource227 = fs.readFileSync(path.join(root,"src/styles.css"),"utf8");
  if (!renderSource227.includes("version-badge") || renderSource227.includes("автосохранение")) {
    throw new Error("start screen compact version cleanup missing");
  }
  if (!renderSource227.includes("player-strip") || !renderSource227.includes("shortDateText")) {
    throw new Error("compact header strip missing");
  }
  if (!renderSource227.includes("fight-line") || !renderSource227.includes("fighter-link")) {
    throw new Error("thin fight line UI missing");
  }
  if (!cssSource227.includes("overflow-y: auto !important") || !cssSource227.includes("height: auto !important")) {
    throw new Error("mobile page scroll fix missing");
  }
}

/* 2.2.8 mobile layout checks */
{
  const renderSource228 = fs.readFileSync(path.join(root,'src/ui/render.js'),'utf8');
  const cssSource228 = fs.readFileSync(path.join(root,'src/styles.css'),'utf8');
  if (renderSource228.includes('["economy", "Экономика"]')) throw new Error('economy tab still present');
  if (!renderSource228.includes('Следующая неделя') || !renderSource228.includes('dashboard-actions')) throw new Error('dashboard actions missing');
  if (!renderSource228.includes('training-row') || !renderSource228.includes('training-value')) throw new Error('compact training rows missing');
  if (!cssSource228.includes('grid-template-columns: repeat(3, minmax(0,1fr))') || !cssSource228.includes('.feed { display:none')) throw new Error('mobile tabs/feed cleanup missing');
}

/* 2.2.9 fatigue layout checks */
{
  const stateSource229 = fs.readFileSync(path.join(root,'src/core/state.js'),'utf8');
  const fightSource229 = fs.readFileSync(path.join(root,'src/core/fight.js'),'utf8');
  const renderSource229 = fs.readFileSync(path.join(root,'src/ui/render.js'),'utf8');
  const cssSource229 = fs.readFileSync(path.join(root,'src/styles.css'),'utf8');
  if (stateSource229.includes(', 0, 94') || stateSource229.includes('/94')) throw new Error('fatigue 94 cap text still exists');
  if (!fightSource229.includes('ratingDiff') || !fightSource229.includes('result === "Победа" ? 25')) throw new Error('fight fatigue/reward patch missing');
  if (renderSource229.includes('Паспорт бойца')) throw new Error('profile title not renamed');
  if (renderSource229.includes('shortTrackLabel(p.trackId)') || renderSource229.includes('shortWeightLabel(p.weightClassId)')) throw new Error('header still renders path/weight');
  if (!renderSource229.includes('tournamentWeeksOnly')) throw new Error('tournament weeks only helper missing');
  if (!cssSource229.includes('training-plus-btn') || !cssSource229.includes('fatigue/layout hotfix')) throw new Error('mobile/fight CSS hotfix missing');
}
