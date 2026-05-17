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
    removeItem(key) { delete this.store[key]; }
  },
  document: {
    getElementById() { return { innerHTML: "" }; },
    addEventListener() {}
  }
};
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
].forEach((file) => vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox.window, { filename: file }));

const FS = sandbox.window.FS;
let state = FS.State.createCareer({ name: "Smoke", age: 18, countryId: "russia", trackId: "amateur", weightClassId: "welter", stanceId: "" });
FS.World.bootstrapWorld(state);
FS.State.repairState(state);

if (FS.Data.appVersion !== "turn-based-fight-1.8.0") throw new Error("bad version");
if (!FS.Data.economy || !FS.Data.economy.equipment || FS.Data.economy.equipment.length < 3) throw new Error("economy data missing");

const p = FS.State.player(state);
if (p.money < 600) throw new Error("starting money missing");
if (typeof p.fatigue !== "number") throw new Error("fatigue missing");

let html = FS.Render.dashboard(state);
if (!html.includes("Экономика")) throw new Error("economy tab missing");
if (!html.includes("Усталость")) throw new Error("fatigue UI missing");

state.selectedTab = "economy";
html = FS.Render.dashboard(state);
if (!html.includes("Баланс и расходы") || !html.includes("Экипировка") || !html.includes("Медицина")) throw new Error("economy screen broken");

const moneyBefore = p.money;
if (!FS.State.buyEquipment(state, "basic_gloves")) throw new Error("buy equipment failed");
if (p.money >= moneyBefore) throw new Error("equipment did not cost money");
if (!p.equipment.basic_gloves) throw new Error("equipment not owned");

p.fatigue = 70;
const medBefore = p.money;
if (!FS.State.buyMedicalService(state, "recovery")) throw new Error("medical service failed");
if (p.money >= medBefore || p.fatigue >= 70) throw new Error("medical did not work");

const pointsBefore = p.trainingPoints;
const fatigueBefore = p.fatigue;
FS.State.trainPlayer(state);
if (p.trainingPoints <= pointsBefore) throw new Error("training did not add points");
if (p.fatigue <= fatigueBefore) throw new Error("training did not add fatigue");

p.fatigue = 80;
FS.State.restPlayer(state);
if (p.fatigue >= 80) throw new Error("rest did not reduce fatigue");

const expenses = FS.State.monthlyExpenseBreakdown(state);
if (!expenses.total || expenses.total <= 0) throw new Error("monthly expenses missing");
state.week = 4;
const monthMoney = p.money;
FS.World.advanceWeek(state, "skip");
if (state.week !== 5) throw new Error("week advance broken");
if (p.money >= monthMoney) throw new Error("monthly expenses not paid");
if (!p.monthlyExpenseLog.length) throw new Error("monthly expense log missing");

FS.World.refreshOffers(state);
const offer = state.offers.find(o => !o.isCompetition);
if (!offer) throw new Error("no fight offer");
const preview = FS.Fight.buildFightPreview(state, offer.id);
if (!preview || typeof preview.purse !== "number") throw new Error("fight preview purse broken");

const sim = FS.Fight.simulateRounds(p, FS.Utils.getFighterById(state, offer.opponentId), 3);
if (!sim.log.some(line => line.includes("ход")) || !sim.log.some(line => line.includes("Урон"))) throw new Error("turn-based fight log missing");
if (typeof sim.playerDamage !== "number" || typeof sim.opponentDamage !== "number") throw new Error("turn-based damage missing");

const fightMoney = p.money;
FS.Fight.resolvePlayerFight(state, offer.id);
if (p.money <= fightMoney) throw new Error("fight income missing");
if (p.fatigue <= 0) throw new Error("fight fatigue missing");

// Export/import is intentionally not part of the fast smoke test because the live world has ~20k fighters.
// Manual save/export can still be checked from Settings.

console.log("turn based fight smoke ok", {
  version: FS.Data.appVersion,
  money: p.money,
  fatigue: p.fatigue,
  monthlyExpense: expenses.total,
  equipment: Object.keys(p.equipment).length,
  offers: state.offers.length,
  lastFightLog: state.modal.roundLog.slice(0,2)
});