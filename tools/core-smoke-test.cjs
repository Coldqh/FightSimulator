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
sandbox.window.window=sandbox.window;
sandbox.window.console=console;
sandbox.window.localStorage=sandbox.localStorage;
sandbox.window.document=sandbox.document;
sandbox.window.matchMedia=sandbox.window.matchMedia;
sandbox.global=sandbox.window;

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
].forEach(f => vm.runInNewContext(fs.readFileSync(path.join(root,f),"utf8"), sandbox.window, {filename:f}));

const FS=sandbox.window.FS;
if (FS.Data.appVersion !== "availability-foreigners-optimization-2.0.4") throw new Error("bad version "+FS.Data.appVersion);

function make(archetypeId, countryId="russia") {
  const state=FS.State.createCareer({name:"Smoke", archetypeId, countryId, weightClassId:"welter"});
  FS.World.bootstrapWorld(state);
  FS.State.repairState(state);
  return state;
}

let state = make("amateur","russia");
let comps = FS.Amateur.availableCompetitions(state);
let city = comps.find(c => c.id === "city");
if (!city.scheduleText.includes("год ") || !city.scheduleText.match(/через \d+ нед|на этой неделе/)) {
  throw new Error("tournament schedule does not show next date: "+city.scheduleText);
}
if (city.scheduleText.includes("каждый месяц")) throw new Error("schedule still shows rule instead of next date");

state.selectedTab = "world";
state.modal = { type:"teamCard", countryId:"japan" };
let html = FS.Render.dashboard(state);
const headerCount = (html.match(/Сборная/g) || []).length;
if (headerCount > 2) throw new Error("team card duplicate headings too likely: "+headerCount);
if (html.includes("<h3>Сборная") && html.indexOf("<h3>Сборная") !== html.lastIndexOf("<h3>Сборная")) {
  throw new Error("team modal has duplicate secondary header");
}

state.modal = null;
/* Find a week with any available competition and confirm the modal appears at week start. */
let found = false;
for (let i=0; i<60; i++) {
  FS.World.advanceWeek(state, "skip");
  if (state.modal && state.modal.type === "tournamentAvailable") {
    found = true;
    html = FS.Render.dashboard(state);
    if (!html.includes("Доступен турнир") || !html.includes("Заявиться")) throw new Error("available tournament modal content missing");
    break;
  }
  state.modal = null;
}
if (!found) throw new Error("available tournament notification never appeared");

const foreignResidents = state.roster.filter(f => !f.isPlayer && f.isForeignResident && f.countryId !== (f.originCountryId || f.homeCountryId));
if (foreignResidents.length < FS.Data.countries.length) throw new Error("not enough starting foreign residents: "+foreignResidents.length);
const hostedCountryCount = new Set(foreignResidents.map(f => f.countryId)).size;
if (hostedCountryCount < 80) throw new Error("foreign residents not spread across countries: "+hostedCountryCount);

let foreign = foreignResidents[0];
state.modal = { type: "fighter", fighterId: foreign.id };
html = FS.Render.dashboard(state);
if (!html.includes("fighter-country-route")) throw new Error("foreign country route not rendered");

let pro = make("debt_pro","usa");
let p = FS.State.player(pro);
FS.World.buildProContracts(pro);
let contract = pro.world.proContracts[0];
FS.World.acceptProContract(pro, contract.id);
pro.week = p.nextFightWeek - 1;
FS.World.advanceWeek(pro, "skip");
if (!pro.modal || pro.modal.type !== "proContractPreview") throw new Error("pro preview broken after optimization");

let autoState = make("amateur","russia");
FS.World.refreshOffers(autoState);
let offer = autoState.offers.find(o => !o.isCompetition);
if (!offer) throw new Error("no offer");
FS.Fight.resolveRandomFight(autoState, offer.id);
html = FS.Render.dashboard(autoState);
if (html.includes("Лог ударов")) throw new Error("auto winChance result still shows punch log");

const sourceWorld = fs.readFileSync(path.join(root,"src/core/world.js"),"utf8");
if (!sourceWorld.includes("var buckets = {};") || !sourceWorld.includes("buckets[bucketKey].sort")) {
  throw new Error("optimized national-team bucketing missing");
}
const sourceAm = fs.readFileSync(path.join(root,"src/core/amateur.js"),"utf8");
if (!sourceAm.includes("nextScheduledWeek") || !sourceAm.includes("scheduleTextForState")) {
  throw new Error("next tournament date helpers missing");
}

console.log("availability foreigners optimization smoke ok", {
  version: FS.Data.appVersion,
  citySchedule: city.scheduleText,
  foreignResidents: foreignResidents.length,
  hostedCountries: hostedCountryCount,
  modal: "tournamentAvailable",
  proModal: pro.modal.type
});
