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
    if (max < min) {
      return min;
    }
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

  function findWeightClass(weightClassId) {
    var i;
    for (i = 0; i < Data.weightClasses.length; i += 1) {
      if (Data.weightClasses[i].id === weightClassId) {
        return Data.weightClasses[i];
      }
    }
    return Data.weightClasses[2];
  }

  function findStance(stanceId) {
    var i;
    for (i = 0; i < Data.stances.length; i += 1) {
      if (Data.stances[i].id === stanceId) {
        return Data.stances[i];
      }
    }
    return Data.stances[0];
  }

  function findDifficulty(difficultyId) {
    var i;
    for (i = 0; i < Data.offerDifficulties.length; i += 1) {
      if (Data.offerDifficulties[i].id === difficultyId) {
        return Data.offerDifficulties[i];
      }
    }
    return Data.offerDifficulties[1];
  }

  function findTactic(tacticId) {
    return { id: "none", label: "Без тактики", power: 0, stamina: 0, defense: 0, ko: 0 };
  }

  function statTotal(stats) {
    return (stats.power || 0) + (stats.technique || 0) + (stats.speed || 0) + (stats.stamina || 0) + (stats.defense || 0);
  }

  function statAverage(stats) {
    return Math.round(statTotal(stats) / 5);
  }

  function scoreFighter(fighter) {
    var record = fighter.record || { wins: 0, losses: 0, draws: 0, kos: 0 };
    var wins = clamp(record.wins || 0, 0, fighter.trackId === "street" ? 220 : 180);
    var losses = clamp(record.losses || 0, 0, fighter.trackId === "street" ? 220 : 180);
    var kos = clamp(record.kos || 0, 0, wins);
    var titleBonus = fighter.titles ? Math.min(fighter.titles.length * 3, 16) : 0;
    var awardBonus = fighter.awards ? Math.min(fighter.awards.length * 1.2, 8) : 0;

    return statAverage(fighter.stats) + wins * 0.20 - losses * 0.16 + kos * 0.08 + titleBonus + awardBonus;
  }

  function recordText(record) {
    return record.wins + "-" + record.losses + "-" + record.draws + " · KO " + record.kos;
  }

  function getStatLabel(statId) {
    var i;
    for (i = 0; i < Data.statKeys.length; i += 1) {
      if (Data.statKeys[i].id === statId) {
        return Data.statKeys[i].label;
      }
    }
    return statId;
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
    if (!state || !(state.roster instanceof Array)) {
      return null;
    }
    for (i = 0; i < state.roster.length; i += 1) {
      if (state.roster[i].id === fighterId) {
        return state.roster[i];
      }
    }
    return null;
  }

  function pushLimited(list, entry, limit) {
    if (!(list instanceof Array)) {
      return;
    }
    list.unshift(entry);
    if (list.length > limit) {
      list.length = limit;
    }
  }

  function formatWeightClass(weightClassId) {
    var wc = findWeightClass(weightClassId);
    return wc.label + " (" + wc.min + "-" + wc.max + " кг)";
  }

  function titleKey(typeId, countryId, weightClassId) {
    return [typeId, countryId, weightClassId].join("|");
  }

  window.FS.Utils = {
    escapeHtml: escapeHtml,
    uid: uid,
    randomInt: randomInt,
    clamp: clamp,
    pick: pick,
    findCountry: findCountry,
    findTrack: findTrack,
    findWeightClass: findWeightClass,
    findStance: findStance,
    findDifficulty: findDifficulty,
    findTactic: findTactic,
    statAverage: statAverage,
    statTotal: statTotal,
    scoreFighter: scoreFighter,
    recordText: recordText,
    getStatLabel: getStatLabel,
    createStats: createStats,
    createName: createName,
    getFighterById: getFighterById,
    pushLimited: pushLimited,
    formatWeightClass: formatWeightClass,
    titleKey: titleKey
  };
}());
