const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const sandbox = {
  console,
  window: {
    prompt() { return ""; },
    alert() {},
    matchMedia() { return { matches: false }; },
    document: { querySelectorAll() { return []; } }
  },
  localStorage: {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, value) { this.store[key] = String(value); },
    removeItem(key) { delete this.store[k]; }
  },
  document: {
    getElementById() { return { innerHTML: "" }; },
    querySelector() { return { value: "amateur" }; },
    addEventListener() {}
  }
};
sandbox.localStorage.removeItem = function(k){ delete this.store[k]; };
sandbox.window.window = sandbox.window;
sandbox.window.console = console;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.document = sandbox.document;
sandbox.window.matchMedia = sandbox.window.matchMedia;
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
if (FS.Data.appVersion !== "pro-career-pack-1.9.4") throw new Error("bad version");
if (!FS.Data.careerArchetypes || FS.Data.careerArchetypes.length !== 4) throw new Error("career archetypes missing");

let startHtml = FS.Render.start();
if (!startHtml.includes("Новичок") || !startHtml.includes("Профессионал с долгами")) throw new Error("archetypes not rendered");
if (startHtml.includes("careerAge") || startHtml.includes("careerTrack")) throw new Error("old age/track selectors remain");

function make(archetypeId) {
  const state = FS.State.createCareer({
    name: "Smoke",
    archetypeId,
    countryId: "russia",
    weightClassId: "welter"
  });
  FS.World.bootstrapWorld(state);
  FS.State.repairState(state);
  return state;
}

let rookie = make("rookie");
let rp = FS.State.player(rookie);
if (rp.age !== 16 || rp.trackId !== "amateur" || FS.Utils.statAverage(rp.stats) !== 0) throw new Error("rookie archetype broken");
if (FS.State.monthlyExpenseBreakdown(rookie).total !== 0) throw new Error("under 18 expenses should be 0");

let amateur = make("amateur");
let ap = FS.State.player(amateur);
if (ap.age !== 18 || ap.trackId !== "amateur" || FS.Utils.statAverage(ap.stats) !== 30) throw new Error("amateur archetype broken");

let street = make("street_kid");
let sp = FS.State.player(street);
if (sp.age !== 18 || sp.trackId !== "street" || FS.Utils.statAverage(sp.stats) !== 10) throw new Error("street archetype broken");

let pro = make("debt_pro");
let pp = FS.State.player(pro);
if (pp.age !== 26 || pp.trackId !== "pro" || FS.Utils.statAverage(pp.stats) !== 90 || pp.money !== 0) throw new Error("debt pro archetype broken");
if ((pp.expenseMultiplier || 1) < 2) throw new Error("debt pro expense multiplier missing");
if (FS.State.monthlyExpenseBreakdown(pro).total < 450) throw new Error("debt pro expenses too low");

pro.selectedTab = "pro";
let proHtml = FS.Render.dashboard(pro);
if (!proHtml.includes("Профи-статус") || !proHtml.includes("Новые предложения")) throw new Error("pro tab missing");
if (!pro.world.proContracts || !pro.world.proContracts.length) throw new Error("pro contracts not generated");

const contract = pro.world.proContracts[0];
if (!FS.World.acceptProContract(pro, contract.id)) throw new Error("could not accept pro contract");
pp = FS.State.player(pro);
if (!pp.contractOpponentId || pp.nextFightWeek <= pro.week) throw new Error("contract scheduling broken");
pro.week = pp.nextFightWeek;
if (!FS.Fight.startProContractFight(pro)) throw new Error("could not start scheduled contract fight");
if (!pro.modal || pro.modal.type !== "activeFight") throw new Error("contract fight not active");

pro.modal = {
  type: "fightResult",
  result: "Победа",
  method: "решение судей",
  week: pro.week,
  opponentName: "Test Opponent",
  purse: 500,
  winChance: 60,
  statsLine: "Удары: 10/20 — 8/22.",
  roundLog: ["Раунд 1, ход 1: Ты: Прямой в голову. Попадание."]
};
let resultHtml = FS.Render.dashboard(pro);
if (!resultHtml.includes("Итог боя") || !resultHtml.includes("Лог ударов") || !resultHtml.includes("Кратко")) throw new Error("fight result rework missing");

console.log("pro career pack smoke ok", {
  version: FS.Data.appVersion,
  archetypes: FS.Data.careerArchetypes.length,
  proContracts: pro.world.proContracts.length,
  contractFight: pro.modal.type
});
