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
  stanceId: ""
});

FS.World.bootstrapWorld(state);
FS.State.repairState(state);

if (FS.Data.appVersion !== "interactive-ring-fight-1.8.1") throw new Error("bad version");
const p = FS.State.player(state);
if (!p) throw new Error("no player");

// Money can go negative and starts a 3-month timer.
p.money = 50;
FS.State.spendMoney(state, 200, "Debt smoke");
if (p.money !== -150) throw new Error("money should go negative");
if (!p.debtStartWeek || !p.debtDeadlineWeek) throw new Error("debt timer not started");
if (!state.modal || state.modal.type !== "debtNotice") throw new Error("debt notice modal missing");
FS.State.addMoney(state, 200, "Debt close");
if (p.money <= 0 || p.debtStartWeek) throw new Error("debt timer not cleared after plus");

// Debt game over after 12 weeks.
FS.State.spendMoney(state, 1000, "Debt gameover");
state.modal = null;
state.week = p.debtDeadlineWeek;
FS.State.updateDebtStatus(state, "smoke");
if (!state.gameOver || !state.modal || state.modal.type !== "gameOver") throw new Error("debt game over missing");
state.gameOver = false;
p.money = 500;
p.debtStartWeek = 0;
p.debtDeadlineWeek = 0;
state.modal = null;

// Fatigue 100 locks actions except rest.
p.fatigue = 100;
FS.State.trainPlayer(state);
if (!state.modal || state.modal.type !== "fatigueLock") throw new Error("fatigue lock modal missing");
FS.State.restPlayer(state);
if (p.fatigue >= 100) throw new Error("rest should reduce fatigue");
state.modal = null;

// Offers and OVR-based purse.
p.fatigue = 0;
p.money = 0;
p.stats.power = 120; p.stats.technique = 120; p.stats.speed = 120; p.stats.stamina = 120; p.stats.defense = 120;
FS.State.updateDerivedFighterFields(p);
FS.World.refreshOffers(state);
const offer = state.offers.find(o => !o.isCompetition);
const preview = FS.Fight.buildFightPreview(state, offer.id);
if (!preview || preview.purse <= 100) throw new Error("OVR-based purse too small");

// Skip fight resolves randomly through winChance.
const skipStateWeek = state.week;
FS.Fight.resolveRandomFight(state, offer.id);
if (!state.modal || state.modal.type !== "fightResult") throw new Error("skip fight result missing");
if (!String(state.modal.scoreLine).includes("бой пропущен")) throw new Error("skip fight should mention auto result");
if (state.week <= skipStateWeek) throw new Error("skip fight should advance week");

// Interactive 5x5 fight starts, has active modal, ring and controls render.
FS.World.refreshOffers(state);
const offer2 = state.offers.find(o => !o.isCompetition);
FS.Fight.startInteractiveFight(state, offer2.id);
if (!state.modal || state.modal.type !== "activeFight") throw new Error("interactive fight did not start");
let html = FS.Render.dashboard(state);
if (!html.includes("ring-grid") || !html.includes("Прямой в голову") || !html.includes("Контратака")) throw new Error("interactive ring UI missing");
if (html.includes('data-action="close-modal">Выйти')) throw new Error("active fight should not have exit button");

FS.Fight.playerAction(state, "move", 0, -1);
FS.Fight.playerAction(state, "move", 0, -1);
FS.Fight.playerAction(state, "jabHead", 0, 0);
if (!state.modal || !["activeFight", "fightCount", "fightResult"].includes(state.modal.type)) throw new Error("interactive fight action broke modal");

// No forbidden tactical systems.
const allJs = ["src/core/fight.js", "src/ui/render.js", "src/app.js"].map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
["агрессия", "темп", "клинч", "геймплан"].forEach(word => {
  if (allJs.toLowerCase().includes(word)) throw new Error("forbidden fight concept found: " + word);
});

console.log("interactive ring fight smoke ok", {
  version: FS.Data.appVersion,
  money: p.money,
  fatigue: p.fatigue,
  purse: preview.purse,
  modal: state.modal.type
});
