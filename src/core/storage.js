(function () {
  "use strict";
  window.FS = window.FS || {};
  var Data = window.FS.Data;
  function load() { var raw; try { raw = localStorage.getItem(Data.saveKey); if (!raw) { return null; } return JSON.parse(raw); } catch (error) { console.error(error); return null; } }
  function save(state) { try { if (!state) { clear(); return; } localStorage.setItem(Data.saveKey, JSON.stringify(state)); } catch (error) { console.error(error); } }
  function clear() { try { localStorage.removeItem(Data.saveKey); } catch (error) { console.error(error); } }
  window.FS.Storage = { load: load, save: save, clear: clear };
}());
