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
FS.World.refreshOffers(state);

if (FS.Data.appVersion !== "fight-balance-mobile-1.8.5") throw new Error("bad version");

const statLabels = FS.Data.statKeys.map(s => s.label).join(",");
if (!statLabels.includes("Здоровье")) throw new Error("health label missing");
if (statLabels.includes("Защита")) throw new Error("old defense label visible");

const offer = state.offers.filter(o => !o.isCompetition)[0];
if (!offer) throw new Error("no offer");
if (!FS.Fight.startInteractiveFight(state, offer.id)) throw new Error("could not start fight");
const modal = state.modal;

if (modal.player.maxHp < 100 || modal.player.maxStamina < 100) throw new Error("base hp/stamina below 100");
const jab = modal.actions.find(a => a.id === "jabHead");
const upper = modal.actions.find(a => a.id === "uppercut");
if (!jab || jab.stamina < 14) throw new Error("jab stamina not doubled");
if (!upper || upper.stamina < 24) throw new Error("uppercut stamina not doubled");
if (!Number.isInteger(jab.chance)) throw new Error("hit chance not rounded");

let html = FS.Render.dashboard(state);
if (/\d+\.\d+%/.test(html)) throw new Error("decimal percent visible");
if (!html.includes("punch-damage") || !html.includes("punch-chance") || !html.includes("punch-stamina")) throw new Error("punch button metadata missing");

modal.session.player.pos = { x: 2, y: 2 };
modal.session.opponent.pos = { x: 2, y: 1 };
FS.Fight.playerAction(state, "jabHead", 0, 0);
const session = state.modal.session || modal.session;
if (!session.actionLog || !session.actionLog.length) throw new Error("action log missing");

const fightSource = fs.readFileSync(path.join(root, "src/core/fight.js"), "utf8");
if (!fightSource.includes("trackDamageMultiplier(attacker.trackId)")) throw new Error("track damage multiplier missing");
if (!fightSource.includes("return Math.round(100 + healthStat(fighter) * 0.72);")) throw new Error("hp formula missing");
if (!fightSource.includes("return Math.round(100 + fighter.stats.stamina * 0.72);")) throw new Error("stamina formula missing");

const appSource = fs.readFileSync(path.join(root, "src/app.js"), "utf8");
if (!appSource.includes("function applyMobileCollapse() {\n    return;")) throw new Error("mobile collapse not disabled");

const css = fs.readFileSync(path.join(root, "src/styles.css"), "utf8");
if (!css.includes("flex-wrap: wrap !important") || !css.includes(".mobile-toggle")) throw new Error("mobile compact CSS missing");

console.log("fight balance mobile smoke ok", {
  version: FS.Data.appVersion,
  hp: modal.player.maxHp,
  stamina: modal.player.maxStamina,
  jabCost: jab.stamina,
  jabChance: jab.chance,
  actionLog: session.actionLog.slice(-1)[0]
});
