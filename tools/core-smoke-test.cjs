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

if (FS.Data.appVersion !== "tournament-national-team-fix-1.4.5") throw new Error("bad version");
if (FS.Data.tracks.amateur.maxStat !== 120) throw new Error("amateur max stat should be 120");

const absurd18 = state.roster.filter(f => f.trackId === "amateur" && f.age === 18 && (f.record.wins + f.record.losses + f.record.draws) > 40);
if (absurd18.length) throw new Error("18yo amateur records too high: " + absurd18[0].name + " " + JSON.stringify(absurd18[0].record));

let html = FS.Render.dashboard(state);
if (!html.includes("top-pills")) throw new Error("header pills missing");
if (html.includes("Рекорд клуба при тренере")) throw new Error("old trainer record label found");

state.selectedTab = "training";
html = FS.Render.dashboard(state);
["Сила","Техника","Скорость","Выносливость","Защита"].forEach(label => {
  if (!html.includes(label)) throw new Error("training stat missing " + label);
});

/* Make a scheduled national tournament available. Year 1 March week 2 -> week 10. */
state.week = 10;
const p = FS.State.player(state);
p.stats.power = 58;
p.stats.technique = 58;
p.stats.speed = 58;
p.stats.stamina = 58;
p.stats.defense = 58;
FS.State.updateDerivedFighterFields(p);

let comps = FS.Amateur.availableCompetitions(state);
const country = comps.find(c => c.id === "country");
if (!country || !country.available) throw new Error("country championship should be available at scheduled date: " + (country && country.reason));

let modal = FS.Amateur.startTournament(state, "country");
if (modal.type !== "tournamentFight") throw new Error("tournament did not start with fight modal");
if (!modal.alive || modal.alive.length < 2) throw new Error("active participants missing");
if (modal.opponentRating < 50 || modal.opponentRating > 80) throw new Error("opponent outside tournament OVR range");

let resultModal = FS.Amateur.resolveTournamentRound(state, modal);
if (resultModal.type !== "tournamentResult") throw new Error("tournament round should show fight result");
if (!resultModal.roundLog || !resultModal.roundLog.length) throw new Error("tournament result has no round log");

let after = FS.Amateur.continueTournament(state, resultModal);
if (!["tournamentFight", "tournamentFinal"].includes(after.type)) throw new Error("continue tournament broken: " + after.type);

const beforeMedals = state.amateurPath.medals.length;
if (after.type === "tournamentFinal") {
  const once = state.amateurPath.medals.length - beforeMedals;
  if (once > 1) throw new Error("award duplicated");
}

FS.World.buildNationalTeams(state);
const team = state.world.teamsByCountry[p.countryId];
if (!team || team.main.length > 12 || team.reserve.length > 48) throw new Error("team size broken");

state.selectedTab = "world";
html = FS.Render.dashboard(state);
if (!html.includes("III взрослый") && !html.includes("II взрослый") && !html.includes("I взрослый") && !html.includes("КМС")) throw new Error("team ranks not visible");
if (html.includes("пройдено")) throw new Error("completed label should be removed from tournaments");

const club = state.clubs[0];
state.modal = { type: "person", personId: club.coach.id };
html = FS.Render.dashboard(state);
if (!html.includes("Рекорд тренера")) throw new Error("trainer profile label missing");

console.log("tournament national team smoke ok", {
  version: FS.Data.appVersion,
  fighters: state.roster.length,
  alive: modal.alive.length,
  modalAfterFight: resultModal.type,
  teamMain: team.main.length,
  teamReserve: team.reserve.length
});
