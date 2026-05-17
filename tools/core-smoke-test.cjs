const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const sandbox = {
  console,
  window: { prompt() { return ""; }, alert() {} },
  localStorage: { store: {}, getItem(k){return this.store[k]||null}, setItem(k,v){this.store[k]=String(v)}, removeItem(k){delete this.store[k]} }
};
sandbox.window.window = sandbox.window;
sandbox.window.console = console;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.global = sandbox.window;
[
  "src/data/game-data.js","src/core/utils.js","src/core/storage.js","src/core/state.js","src/core/clubs.js","src/core/titles.js","src/core/stories.js","src/core/matchmaking.js","src/core/amateur.js","src/core/world.js","src/core/fight.js","src/ui/render.js"
].forEach((file) => vm.runInNewContext(fs.readFileSync(path.join(root,file),"utf8"), sandbox.window, { filename:file }));
const FS = sandbox.window.FS;
if(FS.Data.appVersion!=="world-life-club-hotfix-1.4.3") throw new Error("version bad");
let state = FS.State.createCareer({ name:"Smoke", age:18, countryId:"russia", trackId:"amateur", weightClassId:"welter", stanceId:"orthodox" });
FS.World.bootstrapWorld(state); FS.State.repairState(state);
const p = FS.State.player(state);
if((state.people||[]).length !== 0) throw new Error("people should start empty");
const names = state.clubs.map(c=>c.name);
if(new Set(names).size !== names.length) throw new Error("duplicate club names");
if(names.some(n=>n.includes("#"))) throw new Error("club name contains #");
if(state.clubs.some(c => !c.rosterIds || c.rosterIds.length === 0)) throw new Error("empty club roster");
const npcWithoutClub = state.roster.filter(f=>!f.isPlayer && !f.retired && !f.gymId).length;
if(npcWithoutClub) throw new Error("npc without club " + npcWithoutClub);
let html = FS.Render.dashboard(state);
if(html.includes("Истории</button>")) throw new Error("stories tab still visible");
state.selectedTab = "people"; html = FS.Render.dashboard(state);
if(!html.includes("Пока никого нет")) throw new Error("empty people text missing");
// choose a club
const eligible = FS.Clubs.eligibleClubsForFighter(state, p, null);
if(!eligible.length) throw new Error("no eligible clubs");
FS.Clubs.movePlayerToClub(state, eligible[0].id);
if(!state.people.some(person => person.role === "coach")) throw new Error("coach not added to people");
state.selectedTab = "people"; html = FS.Render.dashboard(state);
if(!html.includes("data-person")) throw new Error("people cards not clickable");
state.modal = {type:"person", personId: state.people.find(x=>x.role==="coach").id};
html = FS.Render.dashboard(state);
if(!html.includes("Рекорд клуба при тренере")) throw new Error("coach profile missing");
state.modal = null;
// fights: refresh and unique opponents
FS.World.refreshOffers(state);
const offers = state.offers.filter(o=>!o.isCompetition);
if(offers.length !== 3) throw new Error("offers != 3");
if(new Set(offers.map(o=>o.opponentId)).size !== offers.length) throw new Error("duplicate offer opponents");
state.selectedTab = "fights"; html = FS.Render.dashboard(state);
if(html.includes("Новичок") || html.includes("андердог") || html.includes("фаворит")) throw new Error("forbidden fight labels");
if(!html.includes("Обновить соперников")) throw new Error("refresh button missing");
// tournament step-by-step
p.stats.power = 15; p.stats.technique = 15; p.stats.speed = 15; p.stats.stamina = 15; p.stats.defense = 15; FS.State.updateDerivedFighterFields(p);
const comp = FS.Amateur.availableCompetitions(state).find(c=>c.available);
if(!comp) throw new Error("no comp available");
let modal = FS.Amateur.startTournament(state, comp.id);
if(modal.type !== "tournamentFight") throw new Error("tournament should start fight modal");
if(modal.session.fights.length !== 0) throw new Error("tournament revealed future fights");
html = FS.Render.dashboard({...state, modal});
if(!html.includes("Провести бой")) throw new Error("tournament fight button missing");
let resolved = FS.Amateur.resolveTournamentRound(state, modal);
if(["tournamentFight","tournamentFinal"].indexOf(resolved.type) === -1) throw new Error("bad tournament resolution");
// fighter modal club link
const npc = state.roster.find(f=>!f.isPlayer && !f.retired && f.gymId);
state.modal = {type:"fighter", fighterId:npc.id}; html = FS.Render.dashboard(state);
if(!html.includes("data-club") || !html.includes("Зал")) throw new Error("fighter card lacks club link");
// NPC history varied after several weeks
const watched = state.roster.find(f=>!f.isPlayer && !f.retired && f.trackId==="amateur" && f.countryId==="russia");
for(let i=0;i<8;i++) FS.World.advanceWeek(state,"skip");
const namesInLog = new Set((watched.careerLog||[]).map(e => (e.text||"").replace(/^.*?(над|от|с) /,'').split(' KO')[0].split(' решением')[0]));
if((watched.careerLog||[]).length >= 2 && namesInLog.size < 2) throw new Error("npc repeats same opponent only");
// date
const dt = FS.State.dateText(state);
if(!dt.includes("год") || !dt.includes("неделя")) throw new Error("date text bad");
console.log("world life club smoke ok", {version:FS.Data.appVersion, fighters:state.roster.length, clubs:state.clubs.length, people:state.people.length, date:dt});
