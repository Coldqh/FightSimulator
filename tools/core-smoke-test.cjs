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

if (!state.offers || state.offers.length !== 3) throw new Error("Expected exactly 3 offers.");
if (!state.world.teamsByCountry.russia || !state.world.teamsByCountry.russia.main.length) throw new Error("Expected national team.");
const preview = FS.Fight.buildFightPreview(state, state.offers[0].id);
if (!preview || preview.type !== "fightPreview" || typeof preview.winChance !== "number") throw new Error("Preview failed.");
FS.Fight.resolvePlayerFight(state, state.offers[0].id);
if (!state.modal || state.modal.type !== "fightResult") throw new Error("Result modal missing.");
const weekAfterFight = state.week;
FS.World.advanceWeek(state, "skip");
if (state.week !== weekAfterFight + 1) throw new Error("Week failed.");
FS.State.trainPlayer(state, "speed");
FS.World.advanceWeek(state, "training");
const ranking = FS.State.ranking(state, "russia", "amateur", "welter");
if (!ranking.length) throw new Error("Ranking empty.");
const html = FS.Render.dashboard(state);
if (!html.includes("Fight Simulator") || !html.includes("Вес")) throw new Error("Render output bad.");
console.log("core smoke ok", { week: state.week, offers: state.offers.length, ranking: ranking.length, version: FS.Data.appVersion });
