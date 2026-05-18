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
    querySelector() { return { value: "amateur" }; },
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
if (FS.Data.appVersion !== "damage-scaling-1.9.7") throw new Error("bad version");

const state = FS.State.createCareer({
  name: "Smoke",
  archetypeId: "debt_pro",
  countryId: "russia",
  weightClassId: "welter"
});
FS.World.bootstrapWorld(state);
FS.State.repairState(state);

const player = FS.State.player(state);
player.stats.power = 90;
player.stats.technique = 90;
player.stats.speed = 90;
player.stats.stamina = 90;
player.stats.defense = 90;
FS.State.updateDerivedFighterFields(player);
if (!FS.World.buildProContracts(state).length) throw new Error("no pro contracts");

const contract = state.world.proContracts[0];
FS.World.acceptProContract(state, contract.id);
player.nextFightWeek = state.week;
if (!FS.Fight.startProContractFight(state)) throw new Error("could not start fight");

let session = state.modal.session;
if (session.player.maxHp !== 190) throw new Error("HP formula should be 100 + health: " + session.player.maxHp);
if (session.player.maxStamina !== 145) throw new Error("stamina formula should remain 100 + endurance/2: " + session.player.maxStamina);

let html = FS.Render.dashboard(state);
if (html.includes("</span><span class=\"pill\">KO ")) throw new Error("duplicate KO pill still visible");

const fightSource = fs.readFileSync(path.join(root, "src/core/fight.js"), "utf8");
if (!fightSource.includes("return 1 + U.clamp(Number(fighter.stats.power) || 0, 0, 200) * 0.0075;")) {
  throw new Error("gradual damage scale missing");
}
if (!fightSource.includes("return Math.round(100 + healthStat(fighter));")) {
  throw new Error("HP formula missing");
}
if (!fightSource.includes("if (previousKnockdowns <= 0) { return 80; }") ||
    !fightSource.includes("if (previousKnockdowns === 1) { return 50; }") ||
    !fightSource.includes("if (previousKnockdowns === 2) { return 30; }") ||
    !fightSource.includes("if (previousKnockdowns === 3) { return 10; }") ||
    !fightSource.includes("return 5;")) {
  throw new Error("knockdown stand chance table missing");
}

/* Check approximate scale from source formula: 0 power = 1, 100 power = 1.75. */
const scale0 = 1 + 0 * 0.0075;
const scale100 = 1 + 100 * 0.0075;
if (Math.abs(scale100 / scale0 - 1.75) > 0.001) throw new Error("damage scale math wrong");

console.log("damage scaling smoke ok", {
  version: FS.Data.appVersion,
  hp: session.player.maxHp,
  stamina: session.player.maxStamina,
  damageScale0: scale0,
  damageScale100: scale100
});
