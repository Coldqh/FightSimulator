const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.resolve(__dirname, "..");
const sandbox = {
  console,
  window: { prompt(){return ""}, alert(){}, matchMedia(){return {matches:false}}, document:{querySelectorAll(){return []}}},
  localStorage: { store:{}, getItem(k){return this.store[k]||null}, setItem(k,v){this.store[k]=String(v)}, removeItem(k){delete this.store[k]} },
  document: { getElementById(){return {innerHTML:""}}, querySelector(){return {value:"amateur"}}, addEventListener(){} }
};
sandbox.window.window=sandbox.window; sandbox.window.console=console; sandbox.window.localStorage=sandbox.localStorage; sandbox.window.document=sandbox.document; sandbox.window.matchMedia=sandbox.window.matchMedia; sandbox.global=sandbox.window;
[
 "src/data/game-data.js","src/core/utils.js","src/core/storage.js","src/core/state.js","src/core/clubs.js","src/core/titles.js","src/core/stories.js","src/core/matchmaking.js","src/core/amateur.js","src/core/world.js","src/core/fight.js","src/ui/render.js"
].forEach(f=>vm.runInNewContext(fs.readFileSync(path.join(root,f),"utf8"), sandbox.window, {filename:f}));
const FS=sandbox.window.FS;
if (FS.Data.appVersion !== "world-scale-flags-2.0.0") throw new Error("bad version "+FS.Data.appVersion);
if (FS.Data.countries.length < 100) throw new Error("not enough countries");
const amateurTotal = FS.Data.countries.reduce((s,c)=>s+(c.amateurCount||0),0);
const streetTotal = FS.Data.countries.reduce((s,c)=>s+(c.streetCount||0),0);
const proTotal = FS.Data.countries.reduce((s,c)=>s+(c.proCount||0),0);
if (amateurTotal !== 20000) throw new Error("bad amateur total "+amateurTotal);
if (streetTotal > 5000 || streetTotal < 4900) throw new Error("bad street total "+streetTotal);
if (proTotal !== 1800) throw new Error("bad pro total "+proTotal);
for (const c of FS.Data.countries) {
  if (!c.flag || !fs.existsSync(path.join(root,c.flag))) throw new Error("missing flag "+c.id);
  if (!c.firstNames || c.firstNames.length < 200 || !c.lastNames || c.lastNames.length < 200) throw new Error("name pool too small "+c.id);
}
const state=FS.State.createCareer({name:"Smoke", archetypeId:"amateur", countryId:"russia", weightClassId:"welter"});
FS.World.bootstrapWorld(state);
FS.State.repairState(state);
const rosterCount=state.roster.length;
if (rosterCount < 26000 || rosterCount > 28050) throw new Error("bad roster count "+rosterCount);
const expectedClubs = FS.Data.countries.reduce((s,c)=>s+Math.max(2, Math.ceil(((c.amateurCount||0)+(c.streetCount||0)+(c.proCount||0))/30)),0);
if (state.clubs.length !== expectedClubs) throw new Error("bad club count "+state.clubs.length+" expected "+expectedClubs);
let html=FS.Render.dashboard(state);
if (!html.includes("flag-icon") || !html.includes("assets/flags/russia.png")) throw new Error("flags not rendered in dashboard");
state.modal={type:"profileProcess", kind:"travel"};
html=FS.Render.dashboard(state);
if (!html.includes("country-grid") || !html.includes("data-profile-country") || !html.includes("assets/flags/usa.png")) throw new Error("travel modal flags missing");
FS.World.refreshOffers(state);
const p=FS.State.player(state);
const lowRank=FS.State.rankForFighter(p).id;
if ((state.offers||[]).some(o => {
  const f=FS.Utils.getFighterById(state,o.opponentId);
  return f && f.countryId !== p.countryId;
})) throw new Error("low amateur got foreign opponent");
console.log("world scale flags smoke ok", {version:FS.Data.appVersion, countries:FS.Data.countries.length, roster:rosterCount, clubs:state.clubs.length, amateurTotal, streetTotal, proTotal});
