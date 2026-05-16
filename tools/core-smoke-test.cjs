
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const base = process.argv[2];
const context = {
  window: {},
  console: console,
  localStorage: {
    _data: {},
    getItem(k){ return this._data[k] || null; },
    setItem(k,v){ this._data[k]=String(v); },
    removeItem(k){ delete this._data[k]; }
  }
};
context.window = context;
vm.createContext(context);
for (const file of [
  'src/data/game-data.js',
  'src/core/utils.js',
  'src/core/storage.js',
  'src/core/state.js',
  'src/core/world.js',
  'src/core/fight.js'
]) {
  vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'), context, {filename:file});
}
let state = context.FS.State.createCareer({name:'Влад', countryId:'russia', trackId:'amateur'});
context.FS.World.bootstrapWorld(state);
if (!state.offers || state.offers.length !== 3) throw new Error('offers not 3');
if (!state.world.teamsByCountry.russia) throw new Error('no team');
const preview = context.FS.Fight.buildFightPreview(state, state.offers[0].id);
if (!preview || preview.type !== 'fightPreview') throw new Error('no preview');
context.FS.Fight.resolvePlayerFight(state, state.offers[0].id);
if (state.week !== 2) throw new Error('week not advanced: '+state.week);
context.FS.State.trainPlayer(state, 'power');
context.FS.World.advanceWeek(state, 'training');
if (state.week !== 3) throw new Error('week not advanced after training: '+state.week);
console.log('core smoke ok', state.offers.length, state.world.news.length);
