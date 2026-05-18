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
if (FS.Data.appVersion !== "path-pro-balance-1.9.5") throw new Error("bad version");

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

const amateur = make("amateur");
let html = FS.Render.dashboard(amateur);
if (html.includes('data-tab="pro"')) throw new Error("amateur sees pro tab");
if (!html.includes('data-tab="world"')) throw new Error("amateur does not see amateur path tab");

const street = make("street_kid");
html = FS.Render.dashboard(street);
if (html.includes('data-tab="pro"') || html.includes('data-tab="world"')) throw new Error("street sees forbidden tabs");
if (html.includes("без веса")) throw new Error("street header shows weight text");

const pro = make("debt_pro");
html = FS.Render.dashboard(pro);
if (html.includes('data-tab="fights"') || html.includes('data-tab="world"')) throw new Error("pro sees fights/world tab");
if (!html.includes('data-tab="pro"')) throw new Error("pro does not see pro tab");
if ((pro.offers || []).filter(o => !o.isCompetition).length !== 0) throw new Error("pro normal fight offers exist");

if (!pro.world.proContracts || pro.world.proContracts.length < 5 || pro.world.proContracts.length > 10) {
  throw new Error("pro contract count broken: " + (pro.world.proContracts || []).length);
}
const pp = FS.State.player(pro);
const pOvr = FS.Utils.statAverage(pp.stats);
for (const c of pro.world.proContracts) {
  const opp = FS.Utils.getFighterById(pro, c.opponentId);
  if (Math.abs(FS.Utils.statAverage(opp.stats) - pOvr) > 8) throw new Error("contract OVR too far");
}

pro.selectedTab = "economy";
html = FS.Render.dashboard(pro);
if (html.includes("Экипировка") || html.includes("Купить")) throw new Error("equipment still visible");

const countries = Object.fromEntries(FS.Data.countries.map(c => [c.id, c]));
if (countries.russia.continentLabel !== "Европа") throw new Error("Russia continent wrong");
if (countries.japan.continentLabel !== "Азия") throw new Error("Japan continent wrong");
if (countries.usa.continentLabel !== "Северная Америка") throw new Error("USA continent wrong");
if (countries.mexico.continentLabel !== "Латинская Америка") throw new Error("Mexico continent wrong");

const team = amateur.world.teamsByCountry.russia;
if (!team || !team.coach || !team.coach.name) throw new Error("national team coach missing");

const startHtml = FS.Render.start();
if (startHtml.includes("archetype-card selected")) throw new Error("static selected archetype class remains");

const fightSource = fs.readFileSync(path.join(root, "src/core/fight.js"), "utf8");
if (!fightSource.includes('stamina: 28') || !fightSource.includes('stamina: 48')) throw new Error("punch stamina not doubled");
if (!fightSource.includes('return Math.round(100 + fighter.stats.stamina * 0.5);')) throw new Error("stamina formula wrong");
if (!fightSource.includes('if (trackId === "pro") { return 0.59; }')) throw new Error("pro damage multiplier wrong");

const css = fs.readFileSync(path.join(root, "src/styles.css"), "utf8");
if (!css.includes("background-color: #f8f8f2") || !css.includes(".player-cell") || !css.includes(".opponent-cell")) {
  throw new Error("ring/circle css missing");
}
if (!fs.existsSync(path.join(root, "ring_top_view.png"))) throw new Error("ring png missing");

const stateSource = fs.readFileSync(path.join(root, "src/core/state.js"), "utf8");
if (!stateSource.includes("minKoRate = 0.10") || !stateSource.includes("maxKoRate = 0.90") || !stateSource.includes("minKoRate = 0.40")) {
  throw new Error("ko rate ranges missing");
}

console.log("path pro balance smoke ok", {
  version: FS.Data.appVersion,
  proContracts: pro.world.proContracts.length,
  teamCoach: team.coach.name,
  ringPngBytes: fs.statSync(path.join(root, "ring_top_view.png")).size
});
