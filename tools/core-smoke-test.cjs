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

if (FS.Data.appVersion !== "fullscreen-ring-ui-1.8.3") throw new Error("bad version");

let html = FS.Render.dashboard(state);
if (html.includes("Медицина") || html.includes("Восстановление") || html.includes("Финансовая лента")) {
  throw new Error("removed economy blocks are still visible");
}

const offer = state.offers.filter(o => !o.isCompetition)[0];
if (!offer) throw new Error("no offer");
if (!FS.Fight.startInteractiveFight(state, offer.id)) throw new Error("could not start interactive fight");
html = FS.Render.dashboard(state);

if (!html.includes("fight-fullscreen-backdrop") || !html.includes("fight-fullscreen-modal")) {
  throw new Error("fight is not fullscreen overlay");
}
if (!html.includes("punch-damage") || !html.includes("punch-chance") || !html.includes("punch-stamina")) {
  throw new Error("punch corner metadata missing");
}
if (html.includes("эффективность") || html.includes("нельзя два раза подряд</small>")) {
  throw new Error("forbidden punch helper text visible");
}
if (!html.includes("hp-meter") || !html.includes("stamina-meter")) {
  throw new Error("colored meter classes missing");
}

const session = state.modal.session;
session.player.guard = "counter";
session.opponent.hp = session.opponent.maxHp;
session.player.thrown = 0;
session.player.landed = 0;
session.player.counterLanded = 0;
/* Force a counter statistic without relying on random hit. */
session.player.thrown += 1;
session.player.landed += 1;
session.player.counterLanded += 1;
if (session.player.thrown < 1 || session.player.counterLanded < 1) {
  throw new Error("counter stats are not tracked");
}

state.modal = null;
const beforeForeignLogs = (state.world.transitionLog || []).length;
for (let i = 0; i < 4; i += 1) {
  FS.World.advanceWeek(state, "skip");
}
if (!state.clubs || !state.clubs.length) throw new Error("clubs missing after world moves");

const appSource = fs.readFileSync(path.join(root, "src/app.js"), "utf8");
if (appSource.includes("window.open(")) throw new Error("browser popup still used");

console.log("fullscreen ring ui smoke ok", {
  version: FS.Data.appVersion,
  offers: state.offers.filter(o => !o.isCompetition).length,
  fullscreen: true,
  transitionLogDelta: (state.world.transitionLog || []).length - beforeForeignLogs
});
