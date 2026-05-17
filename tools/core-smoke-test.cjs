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

if (FS.Data.appVersion !== "stable-core-1.5.0") throw new Error("bad version");
if (FS.Data.tracks.amateur.maxStat !== 120) throw new Error("amateur max OVR should be 120");

const p = FS.State.player(state);
p.money = 0;

let html = FS.Render.dashboard(state);
if (!html.includes("$0")) throw new Error("top panel money missing");
if (!html.includes("top-pills")) throw new Error("pill header missing");

state.selectedTab = "world";
html = FS.Render.dashboard(state);
if (!html.includes('data-team-list="main"')) throw new Error("team main button missing");
if (!html.includes('data-team-list="reserve"')) throw new Error("team reserve button missing");
if (html.includes("data-fighter=\"player\"") && html.includes("Состав</div>")) throw new Error("team list appears directly in tab");
if (html.includes("1/128 →") || html.includes("1" + "/" + "8")) throw new Error("long/invalid bracket line still visible");

FS.World.buildNationalTeams(state);
state.modal = { type: "teamList", countryId: "russia", listType: "reserve", page: 0 };
html = FS.Render.dashboard(state);
if (!html.includes("Резерв сборной") || !html.includes("страница")) throw new Error("reserve modal pagination missing");

state.week = 10; // March week 2 for national championship schedule.
p.stats.power = 58;
p.stats.technique = 58;
p.stats.speed = 58;
p.stats.stamina = 58;
p.stats.defense = 58;
FS.State.updateDerivedFighterFields(p);

const comp = FS.Amateur.availableCompetitions(state).find(c => c.id === "country");
if (!comp || !comp.available) throw new Error("country tournament unavailable on scheduled date: " + (comp && comp.reason));

let modal = FS.Amateur.startTournament(state, "country");
if (modal.type !== "tournamentFight") throw new Error("tournament did not start with fight modal");
if (modal.session.rounds.includes("1" + "/" + "8")) throw new Error("duplicate pre-quarterfinal stage should not exist");
if (!modal.alive || modal.alive.length < 2) throw new Error("alive participant list missing");

state.modal = modal;
html = FS.Render.dashboard(state);
if (!html.includes('data-tournament-participants="1"')) throw new Error("participants button missing");
if (html.includes("Участники в турнире</span><strong>")) throw new Error("participants rendered inline instead of modal");

state.modal = { type: "tournamentParticipants", sourceModal: modal, page: 0 };
html = FS.Render.dashboard(state);
if (!html.includes("Участники турнира") || !html.includes("Назад к турниру")) throw new Error("participants modal missing");

let result = FS.Amateur.resolveTournamentRound(state, modal);
if (result.type !== "tournamentResult") throw new Error("tournament round should show result");
if (!result.roundLog || !result.roundLog.length) throw new Error("tournament result needs round log");

let after = FS.Amateur.continueTournament(state, result);
if (!["tournamentFight", "tournamentFinal"].includes(after.type)) throw new Error("bad continue tournament result: " + after.type);

let moneyBefore = Number(p.money) || 0;
let safety = 0;
while (after.type === "tournamentFight" && safety < 8) {
  result = FS.Amateur.resolveTournamentRound(state, after);
  after = FS.Amateur.continueTournament(state, result);
  safety += 1;
}
if (after.type !== "tournamentFinal") throw new Error("tournament did not finish in safe limit");
if (after.reward > 0 && p.money <= moneyBefore) throw new Error("tournament money reward not paid");

state.modal = after;
html = FS.Render.dashboard(state);
if (!html.includes("Награда $")) throw new Error("tournament final should show money reward");
if (html.includes("1" + "/" + "8")) throw new Error("duplicate pre-quarterfinal stage still visible in final modal");

const medalLabels = (state.amateurPath.medals || []).map(m => m.awardLabel);
if (new Set(medalLabels).size !== medalLabels.length) throw new Error("duplicate medals detected");

state.selectedTab = "training";
state.modal = null;
html = FS.Render.dashboard(state);
["Сила", "Техника", "Скорость", "Выносливость", "Защита"].forEach(label => {
  if (!html.includes(label)) throw new Error("training stat missing " + label);
});

console.log("stable core smoke ok", {
  version: FS.Data.appVersion,
  fighters: state.roster.length,
  teamMain: state.world.teamsByCountry.russia.main.length,
  teamReserve: state.world.teamsByCountry.russia.reserve.length,
  tournamentRounds: modal.session.rounds.join(" > "),
  playerMoney: p.money
});
