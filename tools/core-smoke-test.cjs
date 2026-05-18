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
if (FS.Data.appVersion !== "pro-schedule-damage-1.9.6") throw new Error("bad version");

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

const pro = make("debt_pro");
const player = FS.State.player(pro);
if (!pro.world.proContracts || pro.world.proContracts.length < 5) throw new Error("pro contracts missing");
const waits = pro.world.proContracts.map(c => c.fightWeek - pro.week);
if (waits.some(w => w < 3 || w > 4)) throw new Error("OVR 90 pro wait should be 3-4 weeks: " + waits.join(","));

const pOvr = FS.Utils.statAverage(player.stats);
for (const contract of pro.world.proContracts) {
  const opp = FS.Utils.getFighterById(pro, contract.opponentId);
  if (Math.abs(FS.Utils.statAverage(opp.stats) - pOvr) > 8) throw new Error("contract OVR too far");
}

const firstContract = pro.world.proContracts[0];
FS.World.acceptProContract(pro, firstContract.id);
player.nextFightWeek = pro.week;
if (!FS.Fight.startProContractFight(pro)) throw new Error("could not start pro fight");
let session = pro.modal.session;
if (session.player.maxStamina !== Math.round(100 + player.stats.stamina * 0.5)) {
  throw new Error("stamina formula broken");
}

/* Force round reset check. */
session.round = 1;
session.turn = session.maxTurns;
session.player.pos = { x: 0, y: 0 };
session.opponent.pos = { x: 4, y: 4 };
session.player.hp = session.player.maxHp;
session.opponent.hp = session.opponent.maxHp;
FS.Fight.playerAction(pro, "block", 0, 0);
session = pro.modal.session;
if (session.round > 1) {
  if (session.player.pos.x !== 2 || session.player.pos.y !== 4 || session.opponent.pos.x !== 2 || session.opponent.pos.y !== 0) {
    throw new Error("fighters did not reset to corners");
  }
}

const fightSource = fs.readFileSync(path.join(root, "src/core/fight.js"), "utf8");
if (!fightSource.includes('return 1.64') || !fightSource.includes('return 1.77') || !fightSource.includes('return 3.35')) {
  throw new Error("damage multipliers missing");
}
if (!fightSource.includes("attackGrowth") || !fightSource.includes("dodgeGrowth")) {
  throw new Error("smooth hit/evasion scaling missing");
}

const worldSource = fs.readFileSync(path.join(root, "src/core/world.js"), "utf8");
if (!worldSource.includes("function proContractWaitWeeks") || !worldSource.includes("return U.randomInt(10, 12)")) {
  throw new Error("pro wait schedule missing");
}
if (!worldSource.includes("recordSimilarityPenalty")) throw new Error("pro record-aware matching missing");

const mmSource = fs.readFileSync(path.join(root, "src/core/matchmaking.js"), "utf8");
if (!mmSource.includes("recordSimilarityPenalty")) throw new Error("offer record-aware matching missing");

const stateSource = fs.readFileSync(path.join(root, "src/core/state.js"), "utf8");
if (!stateSource.includes("recordStrengthForRanking")) throw new Error("ranking record quality missing");

const amateur = make("amateur");
amateur.selectedTab = "world";
let html = FS.Render.dashboard(amateur);
if (!html.includes("data-person=")) throw new Error("team coach is not clickable");
const coachId = amateur.world.teamsByCountry.russia.coach.id;
amateur.modal = { type: "person", personId: coachId };
html = FS.Render.dashboard(amateur);
if (!html.includes("Тренер сборной") || !html.includes("Сборная")) throw new Error("team coach profile missing");

console.log("pro schedule damage smoke ok", {
  version: FS.Data.appVersion,
  waits,
  teamCoach: amateur.world.teamsByCountry.russia.coach.name
});
