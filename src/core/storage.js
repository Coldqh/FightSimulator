(function () {
  "use strict";

  window.FS = window.FS || {};

  var Data = window.FS.Data;

  function readRaw(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  function parse(raw) {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  function migrate(state) {
    if (!state || typeof state !== "object") {
      return null;
    }

    state.version = Data.appVersion;
    state.selectedTab = state.selectedTab || "dashboard";
    state.rankingCountryId = state.rankingCountryId || "russia";
    state.rankingTrackId = state.rankingTrackId || "amateur";
    state.rankingWeightClassId = state.rankingWeightClassId || "welter";
    state.selectedTacticId = state.selectedTacticId || "balanced";
    state.modal = state.modal || null;
    state.roster = state.roster instanceof Array ? state.roster : [];
    state.people = state.people instanceof Array ? state.people : [];
    state.offers = state.offers instanceof Array ? state.offers : [];
    state.clubs = state.clubs instanceof Array ? state.clubs : [];
    state.titles = state.titles && typeof state.titles === "object" ? state.titles : {};
    state.trackedFighterIds = state.trackedFighterIds instanceof Array ? state.trackedFighterIds : [];

    if (!state.world || typeof state.world !== "object") {
      state.world = {};
    }

    state.world.news = state.world.news instanceof Array ? state.world.news : [];
    state.world.weekReports = state.world.weekReports instanceof Array ? state.world.weekReports : [];
    state.world.teamsByCountry = state.world.teamsByCountry && typeof state.world.teamsByCountry === "object" ? state.world.teamsByCountry : {};
    state.world.transitionLog = state.world.transitionLog instanceof Array ? state.world.transitionLog : [];
    state.world.stories = state.world.stories instanceof Array ? state.world.stories : [];

    return state;
  }

  function load() {
    var raw = readRaw(Data.saveKey);
    var state;
    var i;

    if (raw) {
      return migrate(parse(raw));
    }

    if (Data.legacySaveKeys instanceof Array) {
      for (i = 0; i < Data.legacySaveKeys.length; i += 1) {
        raw = readRaw(Data.legacySaveKeys[i]);
        if (raw) {
          state = migrate(parse(raw));
          if (state) {
            save(state);
            return state;
          }
        }
      }
    }

    return null;
  }

  function save(state) {
    try {
      if (!state) {
        clear();
        return;
      }
      state.version = Data.appVersion;
      localStorage.setItem(Data.saveKey, JSON.stringify(state));
    } catch (error) {
      console.error(error);
    }
  }

  function clear() {
    var i;
    try {
      localStorage.removeItem(Data.saveKey);
      if (Data.legacySaveKeys instanceof Array) {
        for (i = 0; i < Data.legacySaveKeys.length; i += 1) {
          localStorage.removeItem(Data.legacySaveKeys[i]);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  window.FS.Storage = {
    load: load,
    save: save,
    clear: clear,
    migrate: migrate
  };
}());
