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

if (FS.Data.appVersion !== "mobile-club-tournament-fix-1.4.4") throw new Error("bad version");
if (FS.Data.tracks.amateur.maxStat !== 120) throw new Error("amateur max OVR not 120");

const startHtml = FS.Render.start();
if (startHtml.includes("Стойка") || startHtml.includes("careerStance")) throw new Error("stance still on start screen");

const clubNames = state.clubs.map(c => c.name);
if (new Set(clubNames).size !== clubNames.length) throw new Error("duplicate club names");
if (clubNames.some(n => n.includes("#") || n.includes("Бокс Бокс") || n.includes("Школа Школа"))) throw new Error("bad club naming");

const tinyClubs = state.clubs.filter(c => (c.rosterIds || []).length < 20);
if (tinyClubs.length > 0) throw new Error("clubs with fewer than 20 fighters: " + tinyClubs.slice(0, 5).map(c => c.name + ":" + c.rosterIds.length).join(", "));

const p = FS.State.player(state);
if (p.stanceId) throw new Error("player stance should be removed/blank");

const compRanges = FS.Data.amateurCompetitions.map(c => c.minRating + "-" + c.maxRating).join(",");
if (compRanges !== "0-50,20-60,35-70,50-80,65-100,80-120,100-120") throw new Error("bad tournament OVR ranges: " + compRanges);

p.stats.power = 45; p.stats.technique = 45; p.stats.speed = 45; p.stats.stamina = 45; p.stats.defense = 45;
FS.State.updateDerivedFighterFields(p);
const comp = FS.Amateur.availableCompetitions(state).find(c => c.id === "city");
if (!comp || !comp.available) throw new Error("city tournament unavailable");
const modal = FS.Amateur.startTournament(state, "city");
if (modal.type !== "tournamentFight") throw new Error("tournament did not open fight modal");
if (modal.opponentRating < 0 || modal.opponentRating > 50) throw new Error("tournament opponent outside OVR range: " + modal.opponentRating);

FS.World.refreshOffers(state);
const first = state.offers.filter(o => !o.isCompetition).map(o => o.opponentId).join(",");
state.offerRefreshSalt = (Number(state.offerRefreshSalt) || 0) + 1;
FS.World.refreshOffers(state);
const second = state.offers.filter(o => !o.isCompetition).map(o => o.opponentId).join(",");
if (first === second) throw new Error("refresh opponents did not change offers");

let html = FS.Render.dashboard(state);
if (!html.includes("compact-topbar")) throw new Error("compact header missing");
if (html.includes("Стойка")) throw new Error("stance still visible in dashboard");
if (html.includes("1/128 → 1/64")) throw new Error("tournament long bracket line visible");

const club = state.clubs[0];
html = FS.Render.dashboard({ ...state, modal: { type: "club", clubId: club.id } });
if (!html.includes('data-person="' + club.coach.id + '"')) throw new Error("coach is not clickable in club card");

state.modal = { type: "person", personId: club.coach.id };
html = FS.Render.dashboard(state);
if (!html.includes("Рекорд клуба при тренере")) throw new Error("coach profile did not open");

console.log("mobile club tournament fix smoke ok", {
  version: FS.Data.appVersion,
  fighters: state.roster.length,
  clubs: state.clubs.length,
  smallestClub: Math.min(...state.clubs.map(c => c.rosterIds.length)),
  firstOffers: first,
  secondOffers: second
});
