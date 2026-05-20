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
if (FS.Data.appVersion !== "technical-core-2.1.4") throw new Error("bad version "+FS.Data.appVersion);
if (FS.Data.saveSchemaVersion !== 214) throw new Error("bad schema");

function make(archetypeId, countryId="russia") {
  const state = FS.State.createCareer({name:"Smoke", archetypeId, countryId, weightClassId:"welter"});
  FS.World.bootstrapWorld(state);
  FS.State.repairState(state);
  return state;
}

let state = make("amateur","russia");
if (!state._fullRepairDone) throw new Error("repair fast-path stamp missing");

/* Ranking cache */
const r1 = FS.State.ranking(state, "russia", "amateur", "welter");
const r2 = FS.State.ranking(state, "russia", "amateur", "welter");
if (r1 !== r2) throw new Error("ranking cache does not reuse result");
const beforeVersion = state._rankingVersion;
FS.State.invalidateCaches(state);
if (state._rankingVersion <= beforeVersion) throw new Error("ranking version did not change");
const r3 = FS.State.ranking(state, "russia", "amateur", "welter");
if (r3 === r2) throw new Error("ranking cache not invalidated");

/* Storage must not save transient cache */
state._rankingCache = {"x":[state.roster[0], state.roster[1]]};
FS.Storage.save(state);
const raw = sandbox.localStorage.store[FS.Data.saveKey];
if (!raw) throw new Error("save missing");
if (raw.includes("_rankingCache") || raw.includes("_fullRepairDone")) throw new Error("transient fields leaked into save");
const loaded = FS.Storage.load();
if (!loaded || loaded.version !== FS.Data.appVersion || loaded.schemaVersion !== 214) throw new Error("migrate/load broken");

/* Strict news + migration category */
FS.World.createNews(state, "world", "bad", {});
FS.World.createNews(state, "migration", "Иностранец приехал: Test · A → B.", {});
if (state.world.news.some(n => n.text === "bad")) throw new Error("forbidden news got through");
if (!state.world.news.some(n => n.tone === "migration")) throw new Error("migration news category blocked");

/* Existing systems still work */
state.selectedTab = "world";
let html = FS.Render.dashboard(state);
if (!html.includes("Доступен") && !html.includes("Турнирная лестница")) throw new Error("dashboard broken");

let pro = make("debt_pro","usa");
let p = FS.State.player(pro);
FS.World.buildProContracts(pro);
let contract = pro.world.proContracts[0];
if (!contract) throw new Error("pro contracts missing");
FS.World.acceptProContract(pro, contract.id);
pro.week = p.nextFightWeek - 1;
FS.World.advanceWeek(pro, "skip");
if (!pro.modal || pro.modal.type !== "proContractPreview") throw new Error("pro fight preview broken");

/* Title update optimization source checks */
const titlesSource = fs.readFileSync(path.join(root,"src/core/titles.js"),"utf8");
if (!titlesSource.includes("function buildTitleTops") || !titlesSource.includes("titleCandidateKey")) {
  throw new Error("title top-cache optimization missing");
}
const worldSource = fs.readFileSync(path.join(root,"src/core/world.js"),"utf8");
if (!worldSource.includes("migrationNewsForMove") || !worldSource.includes("Иностранец приехал") || !worldSource.includes("Соотечественник уехал")) {
  throw new Error("migration news source missing");
}
const storageSource = fs.readFileSync(path.join(root,"src/core/storage.js"),"utf8");
if (!storageSource.includes("cleanTransientFields") || !storageSource.includes("ensureWorldShape")) {
  throw new Error("storage technical migration helpers missing");
}

console.log("technical core smoke ok", {
  version: FS.Data.appVersion,
  schema: FS.Data.saveSchemaVersion,
  rankingCache: Object.keys(state._rankingCache || {}).length,
  migrationNews: state.world.news.filter(n => n.tone === "migration").length,
  proModal: pro.modal.type
});
