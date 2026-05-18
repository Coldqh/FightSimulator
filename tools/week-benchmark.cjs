const fs=require("fs"), path=require("path"), vm=require("vm");
const root=path.resolve(__dirname,"..");
const sandbox={console, window:{prompt(){return ""},alert(){},matchMedia(){return {matches:false}},document:{querySelectorAll(){return []}}}, localStorage:{store:{},getItem(k){return this.store[k]||null},setItem(k,v){this.store[k]=String(v)},removeItem(k){delete this.store[k]}}, document:{getElementById(){return {innerHTML:""}},querySelector(){return {value:"amateur"}},addEventListener(){}}};
sandbox.window.window=sandbox.window;
sandbox.window.console=console;
sandbox.window.localStorage=sandbox.localStorage;
sandbox.window.document=sandbox.document;
sandbox.window.matchMedia=sandbox.window.matchMedia;
sandbox.global=sandbox.window;
["src/data/game-data.js","src/core/utils.js","src/core/storage.js","src/core/state.js","src/core/clubs.js","src/core/titles.js","src/core/stories.js","src/core/matchmaking.js","src/core/amateur.js","src/core/world.js","src/core/fight.js","src/ui/render.js"].forEach(f=>vm.runInNewContext(fs.readFileSync(path.join(root,f),"utf8"),sandbox.window,{filename:f}));
const FS=sandbox.window.FS;
const state=FS.State.createCareer({name:"Bench",archetypeId:"amateur",countryId:"russia",weightClassId:"welter"});
FS.World.bootstrapWorld(state);
FS.State.repairState(state);
const times=[];
for(let i=0;i<5;i++){
  state.modal=null;
  const t=Date.now();
  FS.World.advanceWeek(state,"skip");
  times.push(Date.now()-t);
}
console.log(JSON.stringify({
  version:FS.Data.appVersion,
  roster:state.roster.length,
  clubs:state.clubs.length,
  times,
  avg:Math.round(times.reduce((a,b)=>a+b,0)/times.length)
}, null, 2));
