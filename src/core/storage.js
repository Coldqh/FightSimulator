(function () {
  "use strict";

  window.FS = window.FS || {};

  var Data = window.FS.Data;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

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

  function repairRecord(record) {
    var safe = record && typeof record === "object" ? record : {};
    var wins = clamp(Number(safe.wins) || 0, 0, 260);
    var losses = clamp(Number(safe.losses) || 0, 0, 260);
    var draws = clamp(Number(safe.draws) || 0, 0, 50);
    var kos = clamp(Number(safe.kos) || 0, 0, wins);

    return {
      wins: wins,
      losses: losses,
      draws: draws,
      kos: kos
    };
  }

  function repairStats(stats, trackId) {
    var safe = stats && typeof stats === "object" ? stats : {};
    var cap = 200;

    if (window.FS && window.FS.Utils && window.FS.Utils.findTrack) {
      cap = window.FS.Utils.findTrack(trackId).maxStat;
    }

    return {
      power: clamp(Number(safe.power) || 35, 1, cap),
      technique: clamp(Number(safe.technique) || 35, 1, cap),
      speed: clamp(Number(safe.speed) || 35, 1, cap),
      stamina: clamp(Number(safe.stamina) || 35, 1, cap),
      defense: clamp(Number(safe.defense) || 35, 1, cap)
    };
  }

  function repairFighter(fighter) {
    if (!fighter || typeof fighter !== "object") {
      return;
    }

    fighter.trackId = fighter.trackId || "amateur";
    fighter.countryId = fighter.countryId || "russia";
    fighter.weightClassId = fighter.weightClassId || "welter";
    fighter.stanceId = fighter.stanceId || "orthodox";
    fighter.age = clamp(Number(fighter.age) || 18, 16, 48);
    fighter.record = repairRecord(fighter.record);
    fighter.trackRecords = fighter.trackRecords && typeof fighter.trackRecords === "object" ? fighter.trackRecords : { amateur: { wins: 0, losses: 0, draws: 0, kos: 0 }, street: { wins: 0, losses: 0, draws: 0, kos: 0 }, pro: { wins: 0, losses: 0, draws: 0, kos: 0 } };
    fighter.trackRecords.amateur = repairRecord(fighter.trackRecords.amateur);
    fighter.trackRecords.street = repairRecord(fighter.trackRecords.street);
    fighter.trackRecords.pro = repairRecord(fighter.trackRecords.pro);
    fighter.trackRecords[fighter.trackId || "amateur"] = repairRecord(fighter.record);
    fighter.stats = repairStats(fighter.stats, fighter.trackId);
    fighter.titles = fighter.titles instanceof Array ? fighter.titles : [];
    fighter.careerLog = fighter.careerLog instanceof Array ? fighter.careerLog : [];
    fighter.storyFlags = fighter.storyFlags instanceof Array ? fighter.storyFlags : [];
    fighter.trainingPoints = Number(fighter.trainingPoints) || 0;
    fighter.money = Number(fighter.money) || 0;
    fighter.fatigue = clamp(Number(fighter.fatigue) || 0, 0, 100);
    fighter.equipment = fighter.equipment && typeof fighter.equipment === "object" ? fighter.equipment : {};
    fighter.financeLog = fighter.financeLog instanceof Array ? fighter.financeLog : [];
    fighter.monthlyExpenseLog = fighter.monthlyExpenseLog instanceof Array ? fighter.monthlyExpenseLog : [];
    fighter.lastExpenseWeek = Number(fighter.lastExpenseWeek) || 1;
    fighter.debtStartWeek = Number(fighter.debtStartWeek) || 0;
    fighter.debtDeadlineWeek = Number(fighter.debtDeadlineWeek) || 0;
    fighter.nextFightWeek = Number(fighter.nextFightWeek) || 0;
    fighter.contractOpponentId = fighter.contractOpponentId || "";
    fighter.contractLabel = fighter.contractLabel || "";
    fighter.awards = fighter.awards instanceof Array ? fighter.awards : [];
    fighter.lastMoveWeek = Number(fighter.lastMoveWeek) || 1;
    fighter.lastFightWeek = Number(fighter.lastFightWeek) || 0;
  }

  function migrate(state) {
    var i;

    if (!state || typeof state !== "object") {
      return null;
    }

    state.version = Data.appVersion;
    state.week = Math.max(1, Number(state.week) || 1);
    state.selectedTab = state.selectedTab || "dashboard";
    state.rankingCountryId = state.rankingCountryId || "russia";
    state.rankingTrackId = state.rankingTrackId || "amateur";
    state.rankingWeightClassId = state.rankingWeightClassId || "welter";
    state.rankingPage = Math.max(0, Number(state.rankingPage) || 0);
    if (!state.world) { state.world = {}; }
    state.world.proContracts = state.world.proContracts instanceof Array ? state.world.proContracts : [];
    state.modal = null;
    state.roster = state.roster instanceof Array ? state.roster : [];
    state.people = state.people instanceof Array ? state.people : [];
    state.offers = state.offers instanceof Array ? state.offers : [];
    state.clubs = state.clubs instanceof Array ? state.clubs : [];
    state.titles = state.titles && typeof state.titles === "object" ? state.titles : {};
    state.trackedFighterIds = state.trackedFighterIds instanceof Array ? state.trackedFighterIds : [];
    state.amateurPath = state.amateurPath && typeof state.amateurPath === "object" ? state.amateurPath : { completed: {}, medals: [], lastCompetitionWeekById: {}, points: 0 };
    state.amateurPath.completed = state.amateurPath.completed || {};
    state.amateurPath.medals = state.amateurPath.medals instanceof Array ? state.amateurPath.medals : [];
    state.amateurPath.lastCompetitionWeekById = state.amateurPath.lastCompetitionWeekById || {};
    state.amateurPath.points = Number(state.amateurPath.points) || 0;
    state.feed = state.feed || "Сохранение загружено.";

    if (!state.world || typeof state.world !== "object") {
      state.world = {};
    }

    state.world.news = state.world.news instanceof Array ? state.world.news : [];
    state.world.weekReports = state.world.weekReports instanceof Array ? state.world.weekReports : [];
    state.world.teamsByCountry = state.world.teamsByCountry && typeof state.world.teamsByCountry === "object" ? state.world.teamsByCountry : {};
    state.world.transitionLog = state.world.transitionLog instanceof Array ? state.world.transitionLog : [];
    state.world.stories = state.world.stories instanceof Array ? state.world.stories : [];

    for (i = 0; i < state.roster.length; i += 1) {
      repairFighter(state.roster[i]);
    }

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

  function exportString(state) {
    return JSON.stringify(state, null, 2);
  }

  function importString(raw) {
    return migrate(parse(raw));
  }

  window.FS.Storage = {
    load: load,
    save: save,
    clear: clear,
    migrate: migrate,
    exportString: exportString,
    importString: importString
  };
}());
