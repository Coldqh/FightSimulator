(function () {
  "use strict";

  window.FS = window.FS || {};

  var Data = window.FS.Data;

  function load() {
    var raw;
    try {
      raw = localStorage.getItem(Data.saveKey);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (error) {
      console.error("Save load failed", error);
      return null;
    }
  }

  function save(state) {
    try {
      if (!state) {
        localStorage.removeItem(Data.saveKey);
        return;
      }
      localStorage.setItem(Data.saveKey, JSON.stringify(state));
    } catch (error) {
      console.error("Save write failed", error);
    }
  }

  function clear() {
    localStorage.removeItem(Data.saveKey);
  }

  function exportSave(state) {
    return JSON.stringify(state, null, 2);
  }

  function importSave(raw) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error("Save import failed", error);
      return null;
    }
  }

  window.FS.Storage = {
    load: load,
    save: save,
    clear: clear,
    exportSave: exportSave,
    importSave: importSave
  };
}());
