const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const sandbox = {
  console,
  window: {
    prompt() { return ""; },
    alert() {},
    open() { return { closed:false, document:{ open(){}, write(){}, close(){} }, focus(){}, close(){ this.closed = true; } }; },
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

if (FS.Data.appVersion !== "ring-combat-hotfix-1.8.2") throw new Error("bad version");
const normalOffers = state.offers.filter(o => !o.isCompetition);
if (normalOffers.length !== 10) throw new Error("expected 10 offers, got " + normalOffers.length);
if (normalOffers.some(o => o.label !== "Бой")) throw new Error("old offer labels remain");

const p = FS.State.player(state);
const pOvr = FS.Utils.statAverage(p.stats);
normalOffers.forEach(o => {
  const opp = FS.Utils.getFighterById(state, o.opponentId);
  const diff = Math.abs(FS.Utils.statAverage(opp.stats) - pOvr);
  if (diff > 14) throw new Error("offer outside OVR band: " + diff);
});

let html = FS.Render.dashboard(state);
if (html.includes("старое название боя")) throw new Error("old fight label placeholder visible");

const offer = normalOffers[0];
const opp = FS.Utils.getFighterById(state, offer.opponentId);
const purse = FS.Fight.computePurse(p, opp);
const strongerFake = JSON.parse(JSON.stringify(opp));
strongerFake.stats.power += 30;
strongerFake.stats.technique += 30;
strongerFake.stats.speed += 30;
strongerFake.stats.stamina += 30;
strongerFake.stats.defense += 30;
if (FS.Fight.computePurse(p, strongerFake) <= purse) throw new Error("purse should grow with opponent OVR");

if (!FS.Fight.startInteractiveFight(state, offer.id)) throw new Error("could not start interactive fight");
if (state.modal.type !== "activeFight") throw new Error("active fight not opened");
const fightHtml = FS.Render.fightWindow(state);
if (!fightHtml.includes("урон") || !fightHtml.includes("шанс") || !fightHtml.includes("стам.")) throw new Error("punch metadata missing");
if (!fs.readFileSync(path.join(root, "src/styles.css"), "utf8").includes("ring_top_view.png")) throw new Error("ring background missing");
if (!fightHtml.includes("data-fight-action=\"hook\" disabled") || !fightHtml.includes("data-fight-action=\"uppercut\" disabled")) throw new Error("close-range punches should be disabled at range");

FS.Fight.playerAction(state, "counter", 0, 0);
FS.Fight.playerAction(state, "counter", 0, 0);
if (!state.modal.session.log.join("\n").includes("Две контратаки подряд")) throw new Error("counter repeat lock missing");

state.week = 10;
p.stats.power = 58; p.stats.technique = 58; p.stats.speed = 58; p.stats.stamina = 58; p.stats.defense = 58;
FS.State.updateDerivedFighterFields(p);
let comp = FS.Amateur.availableCompetitions(state).find(c => c.id === "country");
if (!comp || !comp.available) throw new Error("country tournament unavailable");
let tmodal = FS.Amateur.startTournament(state, "country");
if (tmodal.type !== "tournamentFight") throw new Error("tournament did not start");
state.modal = tmodal;
html = FS.Render.dashboard(state);
if (!html.includes("data-tournament-ring") || !html.includes("data-tournament-fight")) throw new Error("tournament ring/skip buttons missing");
const fatigueBefore = p.fatigue || 0;
let result = FS.Amateur.resolveTournamentRound(state, tmodal);
if ((p.fatigue || 0) !== fatigueBefore) throw new Error("tournament fatigue applied before final");

p.fatigue = 100;
FS.State.fatigueLockedModal(state);
FS.State.restPlayer(state);
if (FS.State.isLockedByFatigue(state)) throw new Error("rest did not reduce fatigue lock");

console.log("ring combat hotfix smoke ok", {
  version: FS.Data.appVersion,
  offers: normalOffers.length,
  purse,
  fatigueAfterRest: p.fatigue,
  firstLog: state.modal && state.modal.session ? state.modal.session.log.slice(-1)[0] : ""
});
