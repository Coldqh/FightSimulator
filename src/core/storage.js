(function () {
  "use strict";

  window.FS = window.FS || {};

  var Data = window.FS.Data;
  var BACKUP_KEYS = [
    Data.saveKey + "_backup",
    Data.saveKey + "_last_good",
    "fight_simulator_autosave"
  ];
  var IDB_NAME = "fight_simulator_save_db";
  var IDB_STORE = "saves";
  var IDB_KEY = "main";
  var idbSaveQueue = Promise.resolve();

  function idbAvailable() {
    return typeof indexedDB !== "undefined";
  }

  function openSaveDb() {
    return new Promise(function (resolve, reject) {
      var request;
      if (!idbAvailable()) { reject(new Error("indexedDB unavailable")); return; }
      request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error("indexedDB open failed")); };
    });
  }

  function saveRawToIdb(raw) {
    if (!raw || !idbAvailable()) { return Promise.resolve(false); }
    idbSaveQueue = idbSaveQueue.catch(function () { return false; }).then(function () {
      return openSaveDb().then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction(IDB_STORE, "readwrite");
          tx.objectStore(IDB_STORE).put(raw, IDB_KEY);
          tx.oncomplete = function () { db.close(); resolve(true); };
          tx.onerror = function () { db.close(); reject(tx.error || new Error("indexedDB save failed")); };
        });
      }).catch(function () { return false; });
    });
    return idbSaveQueue;
  }

  function loadRawFromIdb() {
    if (!idbAvailable()) { return Promise.resolve(null); }
    return openSaveDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(IDB_STORE, "readonly");
        var request = tx.objectStore(IDB_STORE).get(IDB_KEY);
        request.onsuccess = function () { resolve(request.result || null); };
        request.onerror = function () { reject(request.error || new Error("indexedDB load failed")); };
        tx.oncomplete = function () { db.close(); };
        tx.onerror = function () { db.close(); reject(tx.error || new Error("indexedDB tx failed")); };
      });
    }).catch(function () { return null; });
  }

  function clearIdb() {
    if (!idbAvailable()) { return Promise.resolve(false); }
    return openSaveDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).delete(IDB_KEY);
        tx.oncomplete = function () { db.close(); resolve(true); };
        tx.onerror = function () { db.close(); reject(tx.error || new Error("indexedDB clear failed")); };
      });
    }).catch(function () { return false; });
  }

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

  function writeRaw(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  function removeRaw(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(error);
    }
  }

  function rawKeys() {
    var keys = [Data.saveKey].concat(BACKUP_KEYS);
    var i;
    if (Data.legacySaveKeys instanceof Array) {
      for (i = 0; i < Data.legacySaveKeys.length; i += 1) {
        keys.push(Data.legacySaveKeys[i]);
      }
    }
    return Array.from(new Set(keys));
  }

  function isUsableState(candidate) {
    return candidate && typeof candidate === "object" && candidate.roster instanceof Array && candidate.roster.some(function (fighter) { return fighter && fighter.isPlayer; });
  }

  function rawWeek(raw) {
    var parsed = parse(raw);
    return parsed ? Number(parsed.week) || 0 : 0;
  }

  function newestRawSave() {
    var keys = rawKeys();
    var best = null;
    var bestScore = null;
    var i;
    var raw;
    var parsed;
    var score;

    function saveScore(state) {
      return [
        Number(state.saveRevision) || 0,
        Number(state.savedAt) || 0,
        Number(state.week) || 0
      ];
    }

    function newer(left, right) {
      if (!right) { return true; }
      if (left[0] !== right[0]) { return left[0] > right[0]; }
      if (left[1] !== right[1]) { return left[1] > right[1]; }
      return left[2] >= right[2];
    }

    for (i = 0; i < keys.length; i += 1) {
      raw = readRaw(keys[i]);
      if (!raw) { continue; }
      parsed = parse(raw);
      if (!isUsableState(parsed)) { continue; }
      score = saveScore(parsed);
      if (newer(score, bestScore)) {
        best = raw;
        bestScore = score;
      }
    }

    return best;
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

  function cleanTransientFields(state) {
    var copy = Object.assign({}, state);
    delete copy._rankingCache;
    delete copy._worldIndexes;
    delete copy._lastRepairVersion;
    delete copy._lastRepairWeek;
    delete copy._fullRepairDone;
    delete copy._migrationReport;
    return copy;
  }

  function ensureWorldShape(state) {
    state.world = state.world && typeof state.world === "object" ? state.world : {};
    state.world.news = state.world.news instanceof Array ? state.world.news : [];
    state.world.weekReports = state.world.weekReports instanceof Array ? state.world.weekReports : [];
    state.world.teamsByCountry = state.world.teamsByCountry && typeof state.world.teamsByCountry === "object" ? state.world.teamsByCountry : {};
    state.world.teamCoaches = state.world.teamCoaches && typeof state.world.teamCoaches === "object" ? state.world.teamCoaches : {};
    state.world.transitionLog = state.world.transitionLog instanceof Array ? state.world.transitionLog : [];
    state.world.stories = state.world.stories instanceof Array ? state.world.stories : [];
    state.world.memorials = state.world.memorials instanceof Array ? state.world.memorials : [];
    state.world.proContracts = state.world.proContracts instanceof Array ? state.world.proContracts : [];
    state.world.proContractHistory = state.world.proContractHistory instanceof Array ? state.world.proContractHistory : [];
    state.world.tournamentCalendar = state.world.tournamentCalendar instanceof Array ? state.world.tournamentCalendar : [];
    state.world.pendingTournamentInvite = state.world.pendingTournamentInvite || null;
    state.world.pendingProFight = state.world.pendingProFight || null;
  }

  function repairFighter(fighter) {
    if (!fighter || typeof fighter !== "object") {
      return;
    }

    fighter.trackId = fighter.trackId || "amateur";
    fighter.countryId = fighter.countryId || "russia";
    fighter.homeCountryId = fighter.homeCountryId || fighter.countryId;
    fighter.currentCountryId = fighter.currentCountryId || fighter.countryId;
    fighter.originCountryId = fighter.originCountryId || fighter.homeCountryId || fighter.countryId;
    fighter.isForeignResident = fighter.originCountryId !== fighter.countryId;
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
    var oldVersion;

    if (!state || typeof state !== "object") {
      return null;
    }

    oldVersion = state.version || "";
    state.version = Data.appVersion;
    state.schemaVersion = Math.max(Number(state.schemaVersion) || 0, Data.saveSchemaVersion || 224);
    state.week = Math.max(1, Number(state.week) || 1);
    state.selectedTab = state.selectedTab || "dashboard";
    state.rankingCountryId = state.rankingCountryId || "russia";
    state.rankingTrackId = state.rankingTrackId || "amateur";
    state.rankingWeightClassId = state.rankingWeightClassId || "welter";
    state.rankingPage = Math.max(0, Number(state.rankingPage) || 0);
    state.selectedTeamCountryId = state.selectedTeamCountryId || state.rankingCountryId || "russia";
    state.modal = state.modal && state.modal.type === "proContractPreview" ? state.modal : null;
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

    ensureWorldShape(state);

    state._rankingVersion = (Number(state._rankingVersion) || 1) + (oldVersion && oldVersion !== Data.appVersion ? 1 : 0);
    state._rankingCache = {};
    state._migrationReport = oldVersion && oldVersion !== Data.appVersion ? ("Сохранение обновлено: " + oldVersion + " → " + Data.appVersion) : "";

    for (i = 0; i < state.roster.length; i += 1) {
      repairFighter(state.roster[i]);
    }

    return isUsableState(state) ? state : null;
  }

  function load() {
    var raw = newestRawSave();
    var state = raw ? migrate(parse(raw)) : null;

    if (state) {
      save(state);
      return state;
    }

    return null;
  }

  function save(state) {
    var safe;
    var raw;
    var wroteMain;
    try {
      if (!state || !isUsableState(state)) {
        return false;
      }
      state.version = Data.appVersion;
      state.schemaVersion = Data.saveSchemaVersion || state.schemaVersion || 224;
      state.saveRevision = (Number(state.saveRevision) || 0) + 1;
      state.savedAt = Date.now();
      safe = cleanTransientFields(state);
      raw = JSON.stringify(safe);

      wroteMain = writeRaw(Data.saveKey, raw);
      if ((Number(state.saveRevision) || 0) % 10 === 0 || (Number(state.week) || 1) % 4 === 0) {
        writeRaw(BACKUP_KEYS[1], raw);
      }
      saveRawToIdb(raw);
      return !!wroteMain;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  function clear() {
    var keys = rawKeys();
    var i;
    for (i = 0; i < keys.length; i += 1) {
      removeRaw(keys[i]);
    }
    clearIdb();
  }

  function exportString(state) {
    return JSON.stringify(cleanTransientFields(state), null, 2);
  }

  function importString(raw) {
    var imported = migrate(parse(raw));
    if (imported) {
      save(imported);
    }
    return imported;
  }

  function loadAsync() {
    var state = load();
    if (state) { return Promise.resolve(state); }
    return loadRawFromIdb().then(function (raw) {
      var migrated = raw ? migrate(parse(raw)) : null;
      if (migrated) { save(migrated); }
      return migrated;
    });
  }

  function hasSave() {
    return !!newestRawSave();
  }

  function savedSummary() {
    var raw = newestRawSave();
    var parsed = raw ? parse(raw) : null;
    var player;
    if (!isUsableState(parsed)) { return null; }
    player = parsed.roster.find(function (fighter) { return fighter && fighter.isPlayer; });
    return {
      name: player ? player.name : "Боец",
      week: Number(parsed.week) || 1,
      version: parsed.version || "",
      trackId: player ? player.trackId : "",
      countryId: player ? player.countryId : "",
      weightClassId: player ? player.weightClassId : ""
    };
  }

  window.FS.Storage = {
    load: load,
    loadAsync: loadAsync,
    save: save,
    clear: clear,
    migrate: migrate,
    exportString: exportString,
    importString: importString,
    hasSave: hasSave,
    savedSummary: savedSummary
  };
}());
