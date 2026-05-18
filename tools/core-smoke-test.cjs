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

if (FS.Data.appVersion !== "favorites-ui-hotfix-1.8.6") throw new Error("bad version");

state.selectedTab = "fights";
let html = FS.Render.dashboard(state);
if (!html.includes("Избранные")) throw new Error("favorites block missing");
if (!html.includes("data-favorite-fighter")) throw new Error("favorite buttons missing");

const opponentId = state.offers.filter(o => !o.isCompetition)[0].opponentId;
state.trackedFighterIds = [opponentId];
html = FS.Render.dashboard(state);
if (!html.includes("★") || !html.includes("В избранном")) throw new Error("active favorite state missing");

state.modal = { type: "fighter", fighterId: opponentId };
html = FS.Render.dashboard(state);
if (!html.includes("data-favorite-fighter=\"" + opponentId + "\"")) throw new Error("favorite button missing in fighter modal");

const css = fs.readFileSync(path.join(root, "src/styles.css"), "utf8");
if (!css.includes("z-index: 12000") || !css.includes("z-index: 13000")) throw new Error("modal z-index fix missing");
if (!css.includes("ring_top_view.png") || !css.includes('url("ring_top_view.png")')) throw new Error("ring png fallback missing");
if (!css.includes(".favorite-btn")) throw new Error("favorite css missing");

console.log("favorites ui hotfix smoke ok", {
  version: FS.Data.appVersion,
  favoriteId: opponentId,
  offers: state.offers.filter(o => !o.isCompetition).length
});
