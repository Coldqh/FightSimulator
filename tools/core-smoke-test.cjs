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

if (!state.offers || state.offers.length !== 3) throw new Error("offers != 3");
if (!state.clubs.length) throw new Error("clubs not created");
if (!Object.keys(state.titles).length) throw new Error("titles not created");

const p = FS.State.player(state);
p.stats.power = 85;
p.stats.technique = 85;
p.stats.speed = 85;
p.stats.stamina = 85;
p.stats.defense = 85;

const preview = FS.Fight.buildFightPreview(state, state.offers[0].id);
if (!preview || preview.winChance <= 12) throw new Error("fight chance stuck at floor");

const huge = state.roster[0];
huge.record = { wins: 12508, losses: 0, draws: 0, kos: 9999 };
const migrated = FS.Storage.migrate(state);
if (migrated.roster[0].record.wins > 80) throw new Error("record repair failed");

FS.Fight.resolvePlayerFight(state, state.offers[0].id);
if (!state.modal || state.modal.type !== "fightResult") throw new Error("fight result failed");

for (let i = 0; i < 4; i += 1) {
  FS.World.advanceWeek(state, "skip");
}

const html = FS.Render.dashboard(state);
["Обзор", "Рейтинг", "Мой клуб", "Клубы", "Любительский путь"].forEach((word) => {
  if (!html.includes(word)) throw new Error("render missing " + word);
});
["Титулы</button>", "Последние новости", "Ближайшие бои", "Пока только список"].forEach((bad) => {
  if (html.includes(bad)) throw new Error("forbidden UI text found: " + bad);
});

console.log("vertical slice hotfix smoke ok", {
  version: FS.Data.appVersion,
  week: state.week,
  chance: preview.winChance,
  offers: state.offers.length,
  clubs: state.clubs.length
});
