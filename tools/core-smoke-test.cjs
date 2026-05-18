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
if (FS.Data.appVersion !== "real-flags-names-ranking-2.0.1") throw new Error("bad version "+FS.Data.appVersion);
if (FS.Data.countries.length < 100) throw new Error("country count broken");

for (const c of FS.Data.countries) {
  if (!c.flag || !fs.existsSync(path.join(root,c.flag))) throw new Error("missing flag "+c.id);
  if (!c.firstNames || c.firstNames.length < 200 || !c.lastNames || c.lastNames.length < 200) throw new Error("name pools too small "+c.id);
  if (c.firstNames.some(n => /\s[A-ZА-Я]\.$/.test(n)) || c.lastNames.some(n => /\s[A-ZА-Я]\.$/.test(n))) throw new Error("initial names found "+c.id);
}

const china = FS.Data.countries.find(c => c.id === "china");
if (!china) throw new Error("china missing");
if (china.firstNames.includes("Yusuf") || china.firstNames.includes("Daniyal") || china.firstNames.includes("Bekzat")) {
  throw new Error("china has wrong regional names");
}
const chinaName = FS.Utils.createName(china, 12345);
if (!/^[A-Za-z\u00C0-\u024F\u0400-\u04FF]+(?:-[A-Za-z\u00C0-\u024F\u0400-\u04FF]+)?\s+[A-Za-z\u00C0-\u024F\u0400-\u04FF'’]+/.test(chinaName)) {
  throw new Error("bad generated name "+chinaName);
}
if (chinaName.includes(".")) throw new Error("generated name has initials "+chinaName);

let startHtml = FS.Render.start();
if (!startHtml.includes("careerCountryDropdown") || !startHtml.includes("data-start-country") || !startHtml.includes("assets/flags/russia.png")) {
  throw new Error("start country flag dropdown missing");
}

const state=FS.State.createCareer({name:"Smoke", archetypeId:"debt_pro", countryId:"russia", weightClassId:"welter"});
FS.World.bootstrapWorld(state);
FS.State.repairState(state);

state.selectedTab = "ranking";
state.rankingTrackId = "amateur";
state.rankingCountryId = "russia";
let html = FS.Render.dashboard(state);
if (!html.includes("country-dropdown") || !html.includes("data-ranking-country") || !html.includes("assets/flags/usa.png")) {
  throw new Error("ranking country dropdown with flags missing");
}
const countryButtonCount = (html.match(/data-ranking-country=/g) || []).length;
if (countryButtonCount < 100) throw new Error("ranking dropdown lacks countries");
if (!html.includes("flag-icon")) throw new Error("flag icons missing in ranking");

state.selectedTab = "pro";
FS.World.buildProContracts(state);
html = FS.Render.dashboard(state);
if (!html.includes("Новые предложения")) throw new Error("pro tab missing");
if (!html.includes("flag-pill") || !html.includes("assets/flags/")) throw new Error("pro contract countries not rendered");

const f1 = { id:"a", trackId:"pro", stats:{power:200,technique:200,speed:200,stamina:200,defense:200}, record:{wins:0,losses:10,draws:0,kos:0}, titles:[], awards:[] };
const f2 = { id:"b", trackId:"pro", stats:{power:90,technique:90,speed:90,stamina:90,defense:90}, record:{wins:20,losses:0,draws:0,kos:8}, titles:[], awards:[] };
state.roster.push(Object.assign({name:"High OVR Bad", countryId:"usa", weightClassId:"welter", retired:false}, f1));
state.roster.push(Object.assign({name:"Lower OVR Winner", countryId:"usa", weightClassId:"welter", retired:false}, f2));
const ranked = FS.State.ranking(state, "world", "pro", "welter");
const idxBad = ranked.findIndex(f => f.id === "a");
const idxGood = ranked.findIndex(f => f.id === "b");
if (!(idxGood >= 0 && idxBad >= 0 && idxGood < idxBad)) throw new Error("ranking still favors OVR over record");

const css = fs.readFileSync(path.join(root,"src/styles.css"),"utf8");
if (!css.includes("width: 1.77em") || !css.includes("country-dropdown-menu")) throw new Error("flag/dropdown css missing");

console.log("real flags names ranking smoke ok", {
  version: FS.Data.appVersion,
  countries: FS.Data.countries.length,
  flags: FS.Data.countries.filter(c => fs.existsSync(path.join(root,c.flag))).length,
  sampleChina: chinaName,
  rankingCountryButtons: countryButtonCount
});
