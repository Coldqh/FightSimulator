const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const sandbox = {
  console,
  window: { prompt(){return ""}, alert(){}, matchMedia(){return {matches:false}}, document:{querySelectorAll(){return []}}},
  localStorage: { store:{}, getItem(k){return this.store[k]||null}, setItem(k,v){this.store[k]=String(v)}, removeItem(k){delete this.store[k]} },
  document: { getElementById(){return {innerHTML:"", value:""}}, querySelector(){return {value:"amateur"}}, addEventListener(){} }
};
sandbox.window.window=sandbox.window; sandbox.window.console=console; sandbox.window.localStorage=sandbox.localStorage; sandbox.window.document=sandbox.document; sandbox.window.matchMedia=sandbox.window.matchMedia; sandbox.global=sandbox.window;
[
 "src/data/game-data.js","src/core/utils.js","src/core/storage.js","src/core/state.js","src/core/clubs.js","src/core/titles.js","src/core/stories.js","src/core/matchmaking.js","src/core/amateur.js","src/core/world.js","src/core/fight.js","src/ui/render.js"
].forEach(f=>vm.runInNewContext(fs.readFileSync(path.join(root,f),"utf8"), sandbox.window, {filename:f}));
const FS=sandbox.window.FS;
if (FS.Data.appVersion !== "world-news-calendar-2.0.2") throw new Error("bad version "+FS.Data.appVersion);
if (FS.Data.countries.length < 100) throw new Error("countries missing");
if (!FS.Data.countries.every(c => c.localPoolId)) throw new Error("local pools missing");

function make(archetypeId, countryId="russia") {
  const state=FS.State.createCareer({name:"Smoke", archetypeId, countryId, weightClassId:"welter"});
  FS.World.bootstrapWorld(state);
  FS.State.repairState(state);
  return state;
}

let state=make("amateur","estonia");
const p=FS.State.player(state);
if (!p.homeCountryId || p.homeCountryId !== "estonia") throw new Error("home country missing");
let oldCountry=p.countryId;
p.money=9999;
FS.State.setPlayerCountry(state,"latvia");
if (p.homeCountryId !== "estonia" || p.countryId !== "latvia") throw new Error("home/current country logic broken");
state.selectedTab="world";
let html=FS.Render.dashboard(state);
if (!html.includes("Сборная") || !html.includes("estonia") || !html.includes("latvia")) throw new Error("world tab home/local info missing");

state.selectedTab="clubs";
html=FS.Render.dashboard(state);
if (!html.includes("country-dropdown") || !html.includes("club-country-dropdown")) throw new Error("club country dropdown missing");

FS.World.refreshOffers(state);
const allowedCountries = FS.Data.countries.filter(c => c.localPoolId === FS.Utils.findCountry(p.countryId).localPoolId).map(c => c.id);
if ((state.offers||[]).some(o => {
  const f=FS.Utils.getFighterById(state,o.opponentId);
  return f && allowedCountries.indexOf(f.countryId) === -1;
})) throw new Error("small-country local pool opponents broken");

const clubNames = new Set();
for (const club of state.clubs) {
  if (/^([A-Za-zÀ-žА-Яа-я'’ -]+) \1\b/i.test(club.name)) throw new Error("duplicated club name "+club.name);
  clubNames.add(club.name);
}
if (clubNames.size < state.clubs.length * 0.96) throw new Error("too many duplicate club names");

const club = state.clubs.find(c => c.countryId === p.countryId);
state.modal = {type:"club", clubId: club.id};
html=FS.Render.dashboard(state);
if (!html.includes("flag-pill") && !html.includes("country-label")) throw new Error("club roster country not visible");

state.selectedTab="news";
state.modal=null;
html=FS.Render.dashboard(state);
if (!html.includes("Новости")) throw new Error("news tab missing");

state.modal = { type:"tournamentInvite", competitionId:"country", dueWeek: state.week + 1 };
html=FS.Render.dashboard(state);
if (!html.includes("Записаться") || !html.includes("Игнорировать")) throw new Error("tournament invite modal missing");

let pro=make("debt_pro","usa");
let proP=FS.State.player(pro);
FS.World.buildProContracts(pro);
const c=pro.world.proContracts[0];
FS.World.acceptProContract(pro,c.id);
pro.week=proP.nextFightWeek-1;
FS.World.advanceWeek(pro,"skip");
if (!pro.modal || pro.modal.type !== "proFightDue") throw new Error("pro fight due modal missing");

const dataSource = fs.readFileSync(path.join(root,"src/data/game-data.js"),"utf8");
if (!dataSource.includes('"localPoolId"')) throw new Error("localPoolId not in data");
const renderSource = fs.readFileSync(path.join(root,"src/ui/render.js"),"utf8");
if (!renderSource.includes('["news", "Новости"]')) throw new Error("news tab not wired");
if (!renderSource.includes("renderClubCountryFilters") || !renderSource.includes("club-country-dropdown")) throw new Error("club dropdown source missing");

console.log("world news calendar smoke ok", {
  version: FS.Data.appVersion,
  countries: FS.Data.countries.length,
  localPool: FS.Utils.findCountry(p.countryId).localPoolId,
  proModal: pro.modal.type
});
