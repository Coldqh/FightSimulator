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

if (FS.Data.appVersion !== "favorites-tab-ring-1.8.7") throw new Error("bad version");
if (!fs.existsSync(path.join(root, "ring_top_view.png"))) throw new Error("ring_top_view.png is missing from project root");

let html = FS.Render.dashboard(state);
if (!html.includes("data-tab=\"favorites\"") || !html.includes(">Избранные<")) {
  throw new Error("favorites tab is missing");
}

state.selectedTab = "fights";
html = FS.Render.dashboard(state);
if (html.includes("<h3>Избранные</h3>")) throw new Error("favorites block should not render in fights tab");
if (!html.includes("data-favorite-fighter")) throw new Error("favorite toggle missing in fight rows");

const opponentId = state.offers.filter(o => !o.isCompetition)[0].opponentId;
state.trackedFighterIds = [opponentId];
state.selectedTab = "favorites";
html = FS.Render.dashboard(state);
if (!html.includes("<h3>Избранные</h3>") || !html.includes("В избранном")) {
  throw new Error("favorites tab does not show active favorite");
}

const css = fs.readFileSync(path.join(root, "src/styles.css"), "utf8");
if (!css.includes("ring_top_view.png") || !css.includes("../../ring_top_view.png")) {
  throw new Error("ring fallback css missing");
}

console.log("favorites tab ring smoke ok", {
  version: FS.Data.appVersion,
  favoriteId: opponentId,
  ringPngBytes: fs.statSync(path.join(root, "ring_top_view.png")).size
});
