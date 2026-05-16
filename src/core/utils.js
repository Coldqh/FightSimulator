(function () {
  "use strict";

  window.FS = window.FS || {};

  var Data = window.FS.Data;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function uid(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pick(list) {
    return list[randomInt(0, list.length - 1)];
  }

  function findCountry(countryId) {
    var i;
    for (i = 0; i < Data.countries.length; i += 1) {
      if (Data.countries[i].id === countryId) {
        return Data.countries[i];
      }
    }
    return Data.countries[0];
  }

  function findTrack(trackId) {
    return Data.tracks[trackId] || Data.tracks.amateur;
  }

  function statAverage(stats) {
    return Math.round((stats.power + stats.technique + stats.speed + stats.stamina + stats.defense) / 5);
  }

  function statTotal(stats) {
    return stats.power + stats.technique + stats.speed + stats.stamina + stats.defense;
  }

  function recordText(record) {
    return record.wins + "-" + record.losses + "-" + record.draws + " · KO " + record.kos;
  }

  function getStatLabel(key) {
    var i;
    for (i = 0; i < Data.statKeys.length; i += 1) {
      if (Data.statKeys[i].id === key) {
        return Data.statKeys[i].label;
      }
    }
    return key;
  }

  function createStats(trackId, baseValue) {
    var cap = findTrack(trackId).maxStat;
    return {
      power: clamp(baseValue + randomInt(-4, 4), 1, cap),
      technique: clamp(baseValue + randomInt(-4, 4), 1, cap),
      speed: clamp(baseValue + randomInt(-4, 4), 1, cap),
      stamina: clamp(baseValue + randomInt(-4, 4), 1, cap),
      defense: clamp(baseValue + randomInt(-4, 4), 1, cap)
    };
  }

  function createName(country, seed) {
    var firstIndex = Math.abs(seed * 3 + randomInt(0, country.firstNames.length - 1)) % country.firstNames.length;
    var lastIndex = Math.abs(seed * 5 + randomInt(0, country.lastNames.length - 1)) % country.lastNames.length;
    return country.firstNames[firstIndex] + " " + country.lastNames[lastIndex];
  }

  function getFighterById(state, fighterId) {
    var i;
    for (i = 0; i < state.roster.length; i += 1) {
      if (state.roster[i].id === fighterId) {
        return state.roster[i];
      }
    }
    return null;
  }

  function pushLimited(list, entry, limit) {
    list.unshift(entry);
    if (list.length > limit) {
      list.length = limit;
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  window.FS.Utils = {
    escapeHtml: escapeHtml,
    uid: uid,
    randomInt: randomInt,
    clamp: clamp,
    pick: pick,
    findCountry: findCountry,
    findTrack: findTrack,
    statAverage: statAverage,
    statTotal: statTotal,
    recordText: recordText,
    getStatLabel: getStatLabel,
    createStats: createStats,
    createName: createName,
    getFighterById: getFighterById,
    pushLimited: pushLimited,
    clone: clone
  };
}());
