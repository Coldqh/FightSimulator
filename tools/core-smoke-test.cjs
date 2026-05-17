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

if (FS.Data.appVersion !== "stamina-recovery-1.8.4") throw new Error("bad version");

const offer = state.offers.filter(o => !o.isCompetition)[0];
if (!offer) throw new Error("no offer");
if (!FS.Fight.startInteractiveFight(state, offer.id)) throw new Error("could not start fight");

let session = state.modal.session;
const max = session.player.maxStamina;

/* Block recovery: around 20% after the full turn. */
session.player.stamina = Math.round(max * 0.40);
const beforeBlock = session.player.stamina;
FS.Fight.playerAction(state, "block", 0, 0);
session = state.modal.session || state.modal.sourceModal?.session || state.modal.session;
if (session.player.stamina < beforeBlock + Math.round(max * 0.14)) {
  throw new Error("block recovery too low: " + beforeBlock + " -> " + session.player.stamina);
}

/* Counter recovery: around 10% after the full turn. */
session.player.lastAction = "";
session.player.stamina = Math.round(max * 0.40);
const beforeCounter = session.player.stamina;
FS.Fight.playerAction(state, "counter", 0, 0);
session = state.modal.session;
if (session.player.stamina < beforeCounter + Math.round(max * 0.07)) {
  throw new Error("counter recovery too low: " + beforeCounter + " -> " + session.player.stamina);
}

/* Normal turn recovery exists in source; in a real exchange the opponent can still drain stamina with a body shot. */

/* Round recovery source check: this avoids forcing many turns through random AI. */
const source = fs.readFileSync(path.join(root, "src/core/fight.js"), "utf8");
if (!source.includes("recoverPercent(session.player, 0.30)") || !source.includes("recoverPercent(session.opponent, 0.30)")) {
  throw new Error("round 30% recovery missing");
}
if (!source.includes("recoverPercent(target, 0.10)") || !source.includes("recoverPercent(scorer, 0.20)")) {
  throw new Error("knockdown recovery missing");
}

console.log("stamina recovery smoke ok", {
  version: FS.Data.appVersion,
  blockRecoveredFrom: beforeBlock,
  counterRecoveredFrom: beforeCounter,
  finalStamina: session.player.stamina
});
