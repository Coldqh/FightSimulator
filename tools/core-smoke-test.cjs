const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const sandbox = {
  console,
  window: {},
  localStorage: {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, value) { this.store[key] = String(value); },
    removeItem(key) { delete this.store[key]; }
  }
};
sandbox.window = sandbox;
sandbox.global = sandbox;

[
  "src/data/game-data.js",
  "src/core/utils.js",
  "src/core/storage.js",
  "src/core/state.js",
  "src/core/clubs.js",
  "src/core/titles.js",
  "src/core/stories.js",
  "src/core/world.js",
  "src/core/fight.js",
  "src/ui/render.js"
].forEach((file) => {
  vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file });
});

const FS = sandbox.FS;
let state = FS.State.createCareer({
  name: "Smoke",
  age: 18,
  countryId: "russia",
  trackId: "amateur",
  weightClassId: "welter",
  stanceId: "orthodox"
});

FS.World.bootstrapWorld(state);

if (!state.clubs.length) throw new Error("clubs not created");
if (!Object.keys(state.titles).length) throw new Error("titles not created");
if (!state.offers || state.offers.length !== 3) throw new Error("offers != 3");

FS.State.setTactic(state, "pressure");
const preview = FS.Fight.buildFightPreview(state, state.offers[0].id);
if (!preview || preview.tacticLabel !== "Давить") throw new Error("preview/tactic failed");

FS.Fight.resolvePlayerFight(state, state.offers[0].id);
if (!state.modal || state.modal.type !== "fightResult") throw new Error("fight result failed");
if (!state.modal.roundLog || !state.modal.roundLog.length) throw new Error("round log missing");

for (let i = 0; i < 6; i += 1) {
  FS.World.advanceWeek(state, "skip");
}

if (!state.world.news.length) throw new Error("news missing");
if (!state.world.stories.length) throw new Error("stories missing after weeks");

const html = FS.Render.dashboard(state);
if (!html.includes("Титулы") || !html.includes("Клубы") || !html.includes("Истории")) {
  throw new Error("render tabs missing");
}

console.log("season bundle smoke ok", {
  version: FS.Data.appVersion,
  week: state.week,
  offers: state.offers.length,
  clubs: state.clubs.length,
  titles: Object.keys(state.titles).length,
  stories: state.world.stories.length
});
