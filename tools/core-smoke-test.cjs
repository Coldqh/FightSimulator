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
if (FS.Data.appVersion !== "tournament-team-ui-2.0.3") throw new Error("bad version "+FS.Data.appVersion);
if (FS.Data.amateurCompetitions.some(c => c.schedule === "any")) throw new Error("lower tournaments still any");
const comps = FS.Data.amateurCompetitions.reduce((m,c)=>(m[c.id]=c,m),{});
if (comps.city.schedule !== "city" || comps.oblast.schedule !== "oblast" || comps.region.schedule !== "region") throw new Error("lower schedules missing");

function make(archetypeId, countryId="russia") {
  const state=FS.State.createCareer({name:"Smoke", archetypeId, countryId, weightClassId:"welter"});
  FS.World.bootstrapWorld(state);
  FS.State.repairState(state);
  return state;
}

let state=make("amateur","russia");
state.selectedTab="world";
let html=FS.Render.dashboard(state);
if (!html.includes("Характеристики")) throw new Error("tab not renamed");
if (html.includes("Сборная остаётся")) throw new Error("old home country text still shown");
if (!html.includes("team-country-dropdown") || !html.includes("data-team-card") || !html.includes("Открыть карточку")) throw new Error("team selector/card controls missing");
if (!html.includes("Сборная") || !html.includes("Тренер") || !html.includes("Сильнейший")) throw new Error("team card not club-like");

const available = FS.Amateur.availableCompetitions(state);
if (available.find(c => c.id==="city").scheduleText.includes("любое")) throw new Error("city schedule text broken");
if (!available.find(c => c.id==="city").scheduleText.includes("каждый месяц")) throw new Error("city schedule not shown");

state.modal={type:"teamCard", countryId:"russia"};
html=FS.Render.dashboard(state);
if (!html.includes("Сборная") || !html.includes("Ростер") || !html.includes("Резерв") || !html.includes("Страна тренера")) throw new Error("team card modal broken");

state.selectedTab="ranking";
state.rankingTrackId="amateur";
state.rankingCountryId="russia";
state.modal=null;
html=FS.Render.dashboard(state);
if (!html.includes("flag-icon")) throw new Error("amateur ranking flags missing");
state.rankingTrackId="street";
html=FS.Render.dashboard(state);
if (!html.includes("flag-icon")) throw new Error("street ranking flags missing");

state.selectedTab="clubs";
html=FS.Render.dashboard(state);
if (!html.includes("club-country-dropdown") || !html.includes("country-dropdown")) throw new Error("club country dropdown missing");

const club = state.clubs.find(c => c.countryId === FS.State.player(state).countryId);
state.modal={type:"club", clubId:club.id};
html=FS.Render.dashboard(state);
if (!html.includes("flag-icon") || !html.includes("Ростер")) throw new Error("club roster flags/country missing");

let pro=make("debt_pro","usa");
let p=FS.State.player(pro);
FS.World.buildProContracts(pro);
let contract=pro.world.proContracts[0];
FS.World.acceptProContract(pro, contract.id);
if ((pro.world.proContractHistory[0].text || "").includes("неделе ")) throw new Error("contract history still uses raw week");
if (!/год\s+\d+/.test(pro.world.proContractHistory[0].text)) throw new Error("contract history lacks full date");
pro.week=p.nextFightWeek-1;
FS.World.advanceWeek(pro,"skip");
if (!pro.modal || pro.modal.type !== "proContractPreview") throw new Error("pro preview modal not created");
html=FS.Render.dashboard(pro);
if (html.includes("Бой по контракту уже наступил")) throw new Error("old pro due text still rendered");
if (html.includes("Отмена")) throw new Error("pro contract preview has cancel button");
if (!html.includes("Пропустить бой") || !html.includes("Выйти на ринг")) throw new Error("pro contract preview buttons missing");

let newsState=make("amateur","russia");
FS.World.createNews(newsState,"world","bad world",{});
FS.World.createNews(newsState,"fights","bad fights",{});
FS.World.createNews(newsState,"club","good club",{});
if (newsState.world.news.some(n => n.text==="bad world" || n.text==="bad fights")) throw new Error("news filter lets wrong events through");
if (!newsState.world.news.some(n => n.text==="good club")) throw new Error("news filter blocks allowed event");

const sourceAm = fs.readFileSync(path.join(root,"src/core/amateur.js"),"utf8");
if (!sourceAm.includes("Предварительный раунд") || !sourceAm.includes("arrangeRoundPairs")) throw new Error("preliminary bracket logic missing");

console.log("tournament team ui smoke ok", {
  version: FS.Data.appVersion,
  citySchedule: available.find(c=>c.id==="city").scheduleText,
  teamModal: "ok",
  proModal: pro.modal.type
});
