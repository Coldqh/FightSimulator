var WorldRankingsEngine = (function () {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function clamp(value, minValue, maxValue) {
    return Math.max(minValue, Math.min(maxValue, value));
  }

  function stableId(prefix, parts) {
    if (typeof WorldSimState !== "undefined" && WorldSimState.stableId) {
      return WorldSimState.stableId(prefix, parts);
    }
    return prefix + "_" + String(parts instanceof Array ? parts.join("_") : parts);
  }

  function dataRoot() {
    return typeof RANKING_PROFILE_DATA !== "undefined" && RANKING_PROFILE_DATA ? RANKING_PROFILE_DATA : {
      rosterTargets: {
        streetPerCountry: 50,
        amateurPerCountry: 1000,
        proGlobal: 100
      },
      pageSize: 20,
      streetRanking: {
        titleWeight: 18,
        fameWeight: 2,
        standingWeight: 6,
        wearPenalty: 1
      },
      amateurRanking: {
        amateurWinWeight: 5,
        amateurLossPenalty: 3,
        techniqueWeight: 2,
        teamStatusWeights: {
          "none": 0,
          "candidate": 18,
          "reserve": 28,
          "active": 40,
          "dropped": 8,
          "alumni": 16
        },
        medalWeights: {
          gold: 34,
          silver: 20,
          bronze: 12
        }
      },
      proRanking: {
        ringRankingSize: 24,
        championBonus: 55,
        titleHistoryWeight: 12,
        rankingSeedWeight: 4,
        winWeight: 4,
        lossPenalty: 3,
        koWeight: 2,
        fameWeight: 1
      },
      profile: {
        achievementLimit: 6,
        recentResultLimit: 6,
        trainerRosterPreview: 18
      }
    };
  }

  function rosterRoot(gameState) {
    if (!gameState.rosterState || typeof gameState.rosterState !== "object") {
      gameState.rosterState = {
        id: "roster_state_main",
        fighterIds: [],
        fightersById: {},
        gymIds: [],
        gymsById: {},
        trainerIds: [],
        trainersById: {}
      };
    }
    if (!(gameState.rosterState.fighterIds instanceof Array)) {
      gameState.rosterState.fighterIds = [];
    }
    if (!gameState.rosterState.fightersById || typeof gameState.rosterState.fightersById !== "object") {
      gameState.rosterState.fightersById = {};
    }
    if (!(gameState.rosterState.gymIds instanceof Array)) {
      gameState.rosterState.gymIds = [];
    }
    if (!gameState.rosterState.gymsById || typeof gameState.rosterState.gymsById !== "object") {
      gameState.rosterState.gymsById = {};
    }
    if (!(gameState.rosterState.trainerIds instanceof Array)) {
      gameState.rosterState.trainerIds = [];
    }
    if (!gameState.rosterState.trainersById || typeof gameState.rosterState.trainersById !== "object") {
      gameState.rosterState.trainersById = {};
    }
    return gameState.rosterState;
  }

  var projectionCache = {
    gameState: null,
    rankingVersion: "",
    profileVersion: "",
    rankingViews: {},
    profileViews: {},
    streetStandingsRefreshed: false
  };

  function clearRankingProjectionCache() {
    projectionCache.rankingViews = {};
    projectionCache.streetStandingsRefreshed = false;
  }

  function clearProfileProjectionCache() {
    projectionCache.profileViews = {};
  }

  function defaultRankingVersionToken(gameState) {
    var roster = rosterRoot(gameState);
    var calendar = gameState && gameState.career ? gameState.career.calendar || {} : {};
    var seasonState = getSeasonState(gameState);
    var orgState = gameState && gameState.organizationState ? gameState.organizationState : {};
    return [
      roster.fighterIds.length,
      calendar.year || 0,
      calendar.week || 0,
      seasonState.currentSeasonYear || 0,
      seasonState.currentSeasonWeek || 0,
      seasonState.resultHistory instanceof Array ? seasonState.resultHistory.length : 0,
      orgState.rankingTableIds instanceof Array ? orgState.rankingTableIds.length : 0,
      orgState.organizationIds instanceof Array ? orgState.organizationIds.length : 0
    ].join("|");
  }

  function defaultProfileVersionToken(gameState) {
    var narrative = gameState && gameState.narrativeState ? gameState.narrativeState : {};
    var worldCareer = gameState && gameState.worldState ? gameState.worldState.worldCareer || {} : {};
    return [
      defaultRankingVersionToken(gameState),
      narrative.worldMediaIds instanceof Array ? narrative.worldMediaIds.length : 0,
      worldCareer.encounterHistoryIds instanceof Array ? worldCareer.encounterHistoryIds.length : 0
    ].join("|");
  }

  function rankingVersionToken(gameState, options) {
    return options && options.versionToken != null && options.versionToken !== "" ? String(options.versionToken) : defaultRankingVersionToken(gameState);
  }

  function profileVersionToken(gameState, options) {
    return options && options.versionToken != null && options.versionToken !== "" ? String(options.versionToken) : defaultProfileVersionToken(gameState);
  }

  function ensureProjectionCache(gameState, options) {
    var rankingToken = rankingVersionToken(gameState, options || {});
    var profileToken = profileVersionToken(gameState, options || {});
    if (projectionCache.gameState !== gameState) {
      projectionCache.gameState = gameState;
      projectionCache.rankingVersion = rankingToken;
      projectionCache.profileVersion = profileToken;
      clearRankingProjectionCache();
      clearProfileProjectionCache();
      return projectionCache;
    }
    if (projectionCache.rankingVersion !== rankingToken) {
      projectionCache.rankingVersion = rankingToken;
      clearRankingProjectionCache();
    }
    if (projectionCache.profileVersion !== profileToken) {
      projectionCache.profileVersion = profileToken;
      clearProfileProjectionCache();
    }
    return projectionCache;
  }

  function cachedRankingProjection(gameState, options, cacheKey, factory) {
    var cache = ensureProjectionCache(gameState, options);
    if (cache.rankingViews.hasOwnProperty(cacheKey)) {
      return cache.rankingViews[cacheKey];
    }
    cache.rankingViews[cacheKey] = factory();
    return cache.rankingViews[cacheKey];
  }

  function cachedProfileProjection(gameState, options, cacheKey, factory) {
    var cache = ensureProjectionCache(gameState, options);
    if (cache.profileViews.hasOwnProperty(cacheKey)) {
      return cache.profileViews[cacheKey];
    }
    cache.profileViews[cacheKey] = factory();
    return cache.profileViews[cacheKey];
  }

  function activeFightersForView(gameState, trackId, countryId, options) {
    var list = [];
    var roster = rosterRoot(gameState);
    var i;
    var fighter;
    if (typeof PersistentFighterRegistry !== "undefined") {
      if (trackId && countryId && PersistentFighterRegistry.getFightersByTrackCountry) {
        list = PersistentFighterRegistry.getFightersByTrackCountry(gameState, trackId, countryId, { versionToken: options && options.versionToken ? options.versionToken : "" });
        if (list.length) {
          return list;
        }
      }
      if (trackId && PersistentFighterRegistry.getFightersByTrack) {
        list = PersistentFighterRegistry.getFightersByTrack(gameState, trackId, { versionToken: options && options.versionToken ? options.versionToken : "" });
        if (countryId) {
          for (i = list.length - 1; i >= 0; i -= 1) {
            if (!list[i] || list[i].country !== countryId) {
              list.splice(i, 1);
            }
          }
        }
        if (list.length) {
          return list;
        }
      }
      if (countryId && PersistentFighterRegistry.getFightersByCountry) {
        list = PersistentFighterRegistry.getFightersByCountry(gameState, countryId, { versionToken: options && options.versionToken ? options.versionToken : "" });
        if (trackId) {
          for (i = list.length - 1; i >= 0; i -= 1) {
            if (!list[i] || currentTrackId(list[i]) !== trackId) {
              list.splice(i, 1);
            }
          }
        }
        if (list.length) {
          return list;
        }
      }
    }
    list = [];
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      fighter = roster.fightersById[roster.fighterIds[i]];
      if (!isActiveFighter(fighter)) {
        continue;
      }
      normalizeProjectionFighter(gameState, fighter, i + 1);
      if (trackId && currentTrackId(fighter) !== trackId) {
        continue;
      }
      if (countryId && fighter.country !== countryId) {
        continue;
      }
      list.push(fighter);
    }
    return list;
  }

  function rankingFightersForView(gameState, trackId, countryId, options) {
    var fighters = activeFightersForView(gameState, trackId, countryId, options);
    if (!fighters.length && typeof PersistentFighterRegistry !== "undefined" && PersistentFighterRegistry.enrichGameState) {
      PersistentFighterRegistry.enrichGameState(gameState);
      fighters = activeFightersForView(gameState, trackId, countryId, null);
    }
    if (!fighters.length) {
      ensureMinimumRoster(gameState);
      fighters = activeFightersForView(gameState, trackId, countryId, null);
    }
    return fighters;
  }

  function activeRosterDirectorySource(gameState, trackId, countryId, options) {
    var list = [];
    var seen = {};
    var i;
    var j;
    var bucket;
    var fighter;
    if (trackId && trackId !== "all") {
      return rankingFightersForView(gameState, trackId, countryId, options);
    }
    if (countryId && typeof PersistentFighterRegistry !== "undefined" && PersistentFighterRegistry.getFightersByCountry) {
      list = PersistentFighterRegistry.getFightersByCountry(gameState, countryId, { versionToken: options && options.versionToken ? options.versionToken : "" });
      if (list.length) {
        return list;
      }
    }
    for (i = 0; i < 3; i += 1) {
      bucket = rankingFightersForView(gameState, i === 0 ? "street" : (i === 1 ? "amateur" : "pro"), countryId || "", options);
      for (j = 0; j < bucket.length; j += 1) {
        fighter = bucket[j];
        if (fighter && !seen[fighter.id]) {
          seen[fighter.id] = true;
          list.push(fighter);
        }
      }
    }
    return list;
  }

  function applyPositions(list) {
    var i;
    for (i = 0; i < list.length; i += 1) {
      list[i].position = i + 1;
    }
    return list;
  }

  function listCountries() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listCountries ? ContentLoader.listCountries() : [];
  }

  function getCountry(countryId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getCountry ? ContentLoader.getCountry(countryId) : null;
  }

  function getCountryPool(countryId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getCountryPool ? ContentLoader.getCountryPool(countryId) : null;
  }

  function listStreetDistrictTemplates() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listStreetDistrictTemplates ? ContentLoader.listStreetDistrictTemplates() : [];
  }

  function listDevelopmentStyles() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listDevelopmentStyles ? ContentLoader.listDevelopmentStyles() : [];
  }

  function getLocalizedRankLabel(countryId, rankId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getLocalizedRankLabel ? ContentLoader.getLocalizedRankLabel(countryId, rankId) : rankId;
  }

  function getGymTypeLabel(gymTypeId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getFacilityGymTypeLabel ? ContentLoader.getFacilityGymTypeLabel(gymTypeId) : gymTypeId;
  }

  function getTrainerTypeLabel(trainerTypeId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getFacilityTrainerTypeLabel ? ContentLoader.getFacilityTrainerTypeLabel(trainerTypeId) : trainerTypeId;
  }

  function currentTrackId(fighter) {
    return fighter ? (fighter.currentTrack || fighter.trackId || "street") : "street";
  }

  function isActiveFighter(fighter) {
    return !!fighter && fighter.status !== "retired";
  }

  function addUnique(list, value) {
    var i;
    if (!(list instanceof Array) || !value) {
      return;
    }
    for (i = 0; i < list.length; i += 1) {
      if (list[i] === value) {
        return;
      }
    }
    list.push(value);
  }

  function trackLabel(trackId) {
    if (trackId === "amateur") {
      return "Любители";
    }
    if (trackId === "pro") {
      return "Профи";
    }
    return "Улица";
  }

  function sanitizeNicknameWord(value) {
    var label = String(value || "").replace(/[\"']/g, " ").replace(/[.,!?;:]+/g, " ").replace(/^\s+|\s+$/g, "");
    var parts;
    if (!label) {
      return "";
    }
    parts = label.split(/\s+/);
    label = parts.length ? parts[0] : "";
    if (label.indexOf("-") >= 0) {
      label = label.split("-")[0];
    }
    return label.replace(/^\s+|\s+$/g, "");
  }

  function trackAllowsNickname(trackId) {
    return trackId === "street" || trackId === "pro";
  }

  function displayName(firstName, lastName, nickname, trackId) {
    var first = String(firstName || "").replace(/^\s+|\s+$/g, "");
    var last = String(lastName || "").replace(/^\s+|\s+$/g, "");
    var nick = trackAllowsNickname(trackId) ? sanitizeNicknameWord(nickname) : "";
    if (nick) {
      return first + ' "' + nick + '" ' + last;
    }
    return first + (last ? (" " + last) : "");
  }

  function deterministicHash(value) {
    var text = String(value || "");
    var hash = 0;
    var i;
    for (i = 0; i < text.length; i += 1) {
      hash = ((hash * 33) + text.charCodeAt(i)) % 2147483647;
    }
    return Math.abs(hash);
  }

  function deterministicRange(seed, minValue, maxValue) {
    var hash = deterministicHash(seed);
    var min = typeof minValue === "number" ? minValue : 0;
    var max = typeof maxValue === "number" ? maxValue : min;
    if (max <= min) {
      return min;
    }
    return min + (hash % ((max - min) + 1));
  }

  function adultRankPool() {
    return [
      "junior_class_3",
      "junior_class_2",
      "junior_class_1",
      "adult_class_3",
      "adult_class_2",
      "adult_class_1",
      "candidate_national",
      "national_master"
    ];
  }

  function listGymsForTrack(gameState, countryId, trackId) {
    if (typeof WorldFacilityEngine !== "undefined" && WorldFacilityEngine.listGymsByCountry) {
      var facilities = WorldFacilityEngine.listGymsByCountry(gameState, countryId, {
        trackId: trackId,
        versionToken: defaultRankingVersionToken(gameState)
      });
      var filtered = [];
      var k;
      var facilityGym;
      for (k = 0; k < facilities.length; k += 1) {
        facilityGym = facilities[k];
        if (trackId === "street" && facilityGym.gymType && facilityGym.gymType !== "street" && facilityGym.gymType !== "mixed") {
          continue;
        }
        if (trackId === "amateur" && facilityGym.gymType && ["youth", "amateur", "regional_center", "national_team_base", "mixed"].indexOf(facilityGym.gymType) === -1) {
          continue;
        }
        if (trackId === "pro" && facilityGym.gymType && ["pro", "mixed"].indexOf(facilityGym.gymType) === -1) {
          continue;
        }
        filtered.push(facilityGym);
      }
      filtered.sort(function (left, right) {
        return (left.cost || 0) - (right.cost || 0);
      });
      return filtered;
    }
    var roster = rosterRoot(gameState);
    var result = [];
    var i;
    var gym;
    for (i = 0; i < roster.gymIds.length; i += 1) {
      gym = roster.gymsById[roster.gymIds[i]];
      if (!gym || gym.country !== countryId) {
        continue;
      }
      if (gym.allowedTracks instanceof Array && gym.allowedTracks.length && gym.allowedTracks.indexOf(trackId) === -1) {
        continue;
      }
      if (trackId === "street" && gym.gymType && gym.gymType !== "street" && gym.gymType !== "mixed") {
        continue;
      }
      if (trackId === "amateur" && gym.gymType && ["youth", "amateur", "regional_center", "national_team_base", "mixed"].indexOf(gym.gymType) === -1) {
        continue;
      }
      if (trackId === "pro" && gym.gymType && ["pro", "mixed"].indexOf(gym.gymType) === -1) {
        continue;
      }
      result.push(gym);
    }
    result.sort(function (left, right) {
      return (left.cost || 0) - (right.cost || 0);
    });
    return result;
  }

  function listTrainersForGymTrack(gameState, gymId, trackId) {
    if (typeof WorldFacilityEngine !== "undefined" && WorldFacilityEngine.listTrainersByGym) {
      return WorldFacilityEngine.listTrainersByGym(gameState, gymId, {
        trackId: trackId,
        versionToken: defaultRankingVersionToken(gameState)
      });
    }
    var roster = rosterRoot(gameState);
    var gym = roster.gymsById[gymId] || null;
    var ids = gym && gym.trainerIds instanceof Array && gym.trainerIds.length ? gym.trainerIds : roster.trainerIds;
    var result = [];
    var i;
    var trainer;
    for (i = 0; i < ids.length; i += 1) {
      trainer = roster.trainersById[ids[i]];
      if (!trainer || trainer.currentGymId !== gymId) {
        continue;
      }
      if (trainer.allowedTracks instanceof Array && trainer.allowedTracks.length && trainer.allowedTracks.indexOf(trackId) === -1) {
        continue;
      }
      result.push(trainer);
    }
    result.sort(function (left, right) {
      return (left.salary || left.monthlyFee || 0) - (right.salary || right.monthlyFee || 0);
    });
    return result;
  }

  function findFacilityBinding(gameState, countryId, trackId, slotIndex) {
    var gyms = listGymsForTrack(gameState, countryId, trackId);
    var gym = gyms.length ? gyms[slotIndex % gyms.length] : null;
    var trainers = gym ? listTrainersForGymTrack(gameState, gym.id, trackId) : [];
    var trainer = trainers.length ? trainers[(slotIndex + Math.max(0, Math.floor(slotIndex / 7))) % trainers.length] : null;
    return {
      gymId: gym ? gym.id : "",
      trainerId: trainer ? trainer.id : ""
    };
  }

  function styleIdForSlot(slotIndex) {
    var styles = listDevelopmentStyles();
    if (styles.length) {
      return styles[Math.abs(slotIndex) % styles.length].id;
    }
    return ["outboxer", "tempo", "counterpuncher", "puncher"][Math.abs(slotIndex) % 4];
  }

  function archetypeIdForTrack(trackId, slotIndex) {
    var source = trackId === "street" ?
      ["aggressor", "knockout", "counter", "patient", "technician"] :
      (trackId === "amateur" ?
        ["patient", "technician", "counter", "aggressor", "knockout"] :
        ["technician", "aggressor", "counter", "knockout", "patient"]);
    return source[Math.abs(slotIndex) % source.length];
  }

  function identityForSlot(countryId, trackId, slotIndex) {
    var pool = getCountryPool(countryId) || { firstNames: ["Alex"], lastNames: ["Stone"], nicknames: ["Rook"] };
    var seed = typeof ContentLoader !== "undefined" && ContentLoader.getCountrySeedConfig ? ContentLoader.getCountrySeedConfig(countryId) : null;
    var firstNames = seed ?
      ((seed.firstJoin === "join") ?
        (pool.firstNames && pool.firstNames.length ? pool.firstNames : ["Alex"]) :
        (seed.firstLeft && seed.firstLeft.length ? seed.firstLeft.slice(0) : (pool.firstNames && pool.firstNames.length ? pool.firstNames : ["Alex"]))) :
      (pool.firstNames && pool.firstNames.length ? pool.firstNames : ["Alex"]);
    var lastNames = seed ?
      ((seed.lastJoin === "join") ?
        (pool.lastNames && pool.lastNames.length ? pool.lastNames : ["Stone"]) :
        (seed.lastLeft && seed.lastLeft.length ? seed.lastLeft.slice(0) : (pool.lastNames && pool.lastNames.length ? pool.lastNames : ["Stone"]))) :
      (pool.lastNames && pool.lastNames.length ? pool.lastNames : ["Stone"]);
    var nicknames = pool.nicknames && pool.nicknames.length ? pool.nicknames : ["Rook"];
    var firstName = firstNames[(slotIndex * 5 + (trackId === "pro" ? 3 : 1)) % firstNames.length];
    var lastName = lastNames[(slotIndex * 7 + (trackId === "street" ? 4 : 2)) % lastNames.length];
    var nickname = "";
    if (trackId === "street") {
      nickname = sanitizeNicknameWord(nicknames[(slotIndex * 3 + 1) % nicknames.length]);
    } else if (trackId === "pro" && deterministicRange(countryId + ":" + slotIndex + ":nick", 0, 100) >= 64) {
      nickname = sanitizeNicknameWord(nicknames[(slotIndex * 11 + 2) % nicknames.length]);
    }
    return {
      firstName: firstName,
      lastName: lastName,
      nickname: nickname
    };
  }

  function canonicalRankId(rankId) {
    var value = String(rankId || "").toLowerCase();
    if (value === "elite") {
      return "candidate_national";
    }
    if (value === "a") {
      return "adult_class_1";
    }
    if (value === "b") {
      return "adult_class_2";
    }
    if (value === "c") {
      return "adult_class_3";
    }
    if (value === "kms") {
      return "candidate_national";
    }
    if (value === "ms") {
      return "national_master";
    }
    if (value === "msmk" || value === "international_master" || value === "national_team_candidate" || value === "national_team_member" || value === "olympic_level") {
      return "national_master";
    }
    if (value === "junior_novice") {
      return "junior_class_3";
    }
    return rankId || "";
  }

  function rankIndexForId(rankId) {
    var ranks = adultRankPool();
    var index = ranks.indexOf(canonicalRankId(rankId));
    return index >= 0 ? index : 0;
  }

  function styleOffsets(styleId) {
    if (styleId === "puncher") {
      return { str: 5, tec: -1, spd: -1, end: 3, vit: 2 };
    }
    if (styleId === "counterpuncher") {
      return { str: 0, tec: 4, spd: 4, end: 1, vit: 1 };
    }
    if (styleId === "tempo") {
      return { str: 1, tec: 1, spd: 2, end: 4, vit: 3 };
    }
    return { str: -1, tec: 4, spd: 4, end: 1, vit: 1 };
  }

  function statValueFromBase(baseValue, minValue, maxValue, offsetValue, seedKey) {
    return clamp(baseValue + offsetValue + deterministicRange(seedKey, -3, 3), minValue, maxValue);
  }

  function minAttributeValue(source) {
    var stats = source && (source.attributes || source.stats) ? (source.attributes || source.stats) : {};
    return Math.min(
      typeof stats.str === "number" ? stats.str : 0,
      typeof stats.tec === "number" ? stats.tec : 0,
      typeof stats.spd === "number" ? stats.spd : 0,
      typeof stats.end === "number" ? stats.end : 0,
      typeof stats.vit === "number" ? stats.vit : 0
    );
  }

  function maxAttributeValue(source) {
    var stats = source && (source.attributes || source.stats) ? (source.attributes || source.stats) : {};
    return Math.max(
      typeof stats.str === "number" ? stats.str : 0,
      typeof stats.tec === "number" ? stats.tec : 0,
      typeof stats.spd === "number" ? stats.spd : 0,
      typeof stats.end === "number" ? stats.end : 0,
      typeof stats.vit === "number" ? stats.vit : 0
    );
  }

  function amateurRankIdFromTotal(ageYears, totalValue) {
    var total = Math.max(5, Math.round(totalValue || 0));
    if (ageYears >= 18) {
      if (total >= 401) { return "national_master"; }
      if (total >= 301) { return "candidate_national"; }
      if (total >= 251) { return "adult_class_1"; }
      if (total >= 201) { return "adult_class_2"; }
      return "adult_class_3";
    }
    if (total >= 101) { return "junior_class_1"; }
    if (total >= 51) { return "junior_class_2"; }
    return "junior_class_3";
  }

  function streetRatingFromTotal(totalValue) {
    return clamp(Math.round((Math.max(5, totalValue || 5) - 5) / 5), 1, 150);
  }

  function buildStreetRecordForTotal(totalValue, fighterId) {
    var rating = streetRatingFromTotal(totalValue);
    var fights = clamp(rating + deterministicRange(String(fighterId || "street") + ":street_fights", -5, 6), 1, 150);
    var losses;
    var draws = 0;
    var wins;
    if (fights <= 2 && deterministicRange(String(fighterId || "street") + ":cold_start", 0, 1) === 0) {
      wins = 0;
      losses = fights;
    } else {
      losses = clamp(Math.round(fights * (18 + deterministicRange(String(fighterId || "street") + ":street_losses", 0, 16)) / 100), 0, Math.max(1, fights - 1));
      draws = fights >= 20 && deterministicRange(String(fighterId || "street") + ":street_draws", 0, 5) === 0 ? 1 : 0;
      wins = Math.max(1, fights - losses - draws);
    }
    return {
      wins: wins,
      losses: losses,
      draws: draws,
      kos: 0
    };
  }

  function buildAmateurRecordForRank(rankId, fighterId) {
    var fights;
    var losses;
    var draws = 0;
    var wins;
    var key = String(fighterId || "amateur") + ":" + String(rankId || "");
    switch (rankId) {
    case "junior_class_3":
      fights = deterministicRange(key + ":fights", 1, 6);
      break;
    case "junior_class_2":
      fights = deterministicRange(key + ":fights", 6, 12);
      break;
    case "junior_class_1":
      fights = deterministicRange(key + ":fights", 12, 20);
      break;
    case "adult_class_3":
      fights = deterministicRange(key + ":fights", 18, 32);
      break;
    case "adult_class_2":
      fights = deterministicRange(key + ":fights", 28, 45);
      break;
    case "adult_class_1":
      fights = deterministicRange(key + ":fights", 40, 60);
      break;
    case "candidate_national":
      fights = deterministicRange(key + ":fights", 55, 80);
      break;
    case "national_master":
      fights = deterministicRange(key + ":fights", 80, 100);
      break;
    default:
      fights = deterministicRange(key + ":fights", 1, 10);
      break;
    }
    if (fights <= 2 && deterministicRange(key + ":cold_start", 0, 1) === 0) {
      wins = 0;
      losses = fights;
    } else {
      losses = clamp(Math.round(fights * (8 + deterministicRange(key + ":losses", 0, 12)) / 100), 0, Math.max(1, fights - 1));
      draws = fights >= 16 && deterministicRange(key + ":draws", 0, 4) === 0 ? 1 : 0;
      wins = Math.max(1, fights - losses - draws);
    }
    return {
      wins: wins,
      losses: losses,
      draws: draws
    };
  }

  function amateurBaseFromDetails(details, slotIndex) {
    var rank = typeof ContentLoader !== "undefined" && ContentLoader.getAmateurRank ? ContentLoader.getAmateurRank(canonicalRankId(details && details.amateurRank ? details.amateurRank : "")) : null;
    var minValue = rank && typeof rank.statMin === "number" ? rank.statMin : 1;
    var maxValue = rank && typeof rank.statMax === "number" ? rank.statMax : 100;
    return clamp(minValue + deterministicRange("amateur_base:" + slotIndex, 0, Math.max(0, maxValue - minValue)), minValue, maxValue);
  }

  function streetBaseFromDetails(details, slotIndex) {
    var rating = details && typeof details.streetRating === "number" ? details.streetRating : 1;
    var scaled = 1 + Math.round(Math.pow(clamp(rating, 1, 150) / 150, 1.45) * 146);
    return clamp(scaled, 1, 147);
  }

  function proBaseFromDetails(details, slotIndex) {
    var rankingSeed = details && typeof details.rankingSeed === "number" ? details.rankingSeed : 0;
    var wins = details && typeof details.recordWins === "number" ? details.recordWins : 0;
    var fame = details && typeof details.fame === "number" ? details.fame : 0;
    var contenderStatus = details && details.contenderStatus ? details.contenderStatus : "";
    var rankingBand = details && details.rankingBand ? details.rankingBand : "";
    var strength = Math.max(rankingSeed, wins * 5, Math.round(fame * 1.2));
    if (/champion/i.test(rankingBand)) {
      contenderStatus = "champion";
      strength = Math.max(strength, 150);
    } else if (/world_top_5/i.test(rankingBand)) {
      strength = Math.max(strength, 145);
    } else if (/world_top_10/i.test(rankingBand)) {
      strength = Math.max(strength, 135);
    } else if (/world_top_15/i.test(rankingBand)) {
      strength = Math.max(strength, 125);
    } else if (/world_top_20/i.test(rankingBand)) {
      strength = Math.max(strength, 115);
    } else if (/regional_top_5/i.test(rankingBand)) {
      strength = Math.max(strength, 95);
    } else if (/regional_top_10/i.test(rankingBand)) {
      strength = Math.max(strength, 80);
    }
    var base = 100 + Math.round(Math.min(95, strength * 0.65));
    if (contenderStatus === "champion" || contenderStatus === "titleholder") {
      base = 192 + deterministicRange("champion_base:" + slotIndex, -2, 3);
    }
    return clamp(base, 100, 195);
  }

  function buildAttributeSpread(trackId, slotIndex, details) {
    var styleId = details && (details.styleId || details.style) ? (details.styleId || details.style) : styleIdForSlot(slotIndex);
    var offsets = styleOffsets(styleId);
    var minValue = trackId === "pro" ? 100 : 1;
    var maxValue = trackId === "pro" ? 195 : (trackId === "street" ? 150 : 100);
    var base = trackId === "pro" ? proBaseFromDetails(details, slotIndex) : (trackId === "street" ? streetBaseFromDetails(details, slotIndex) : amateurBaseFromDetails(details, slotIndex));
    return {
      str: statValueFromBase(base, minValue, maxValue, offsets.str, trackId + ":" + slotIndex + ":str"),
      tec: statValueFromBase(base, minValue, maxValue, offsets.tec, trackId + ":" + slotIndex + ":tec"),
      spd: statValueFromBase(base, minValue, maxValue, offsets.spd, trackId + ":" + slotIndex + ":spd"),
      end: statValueFromBase(base, minValue, maxValue, offsets.end, trackId + ":" + slotIndex + ":end"),
      vit: statValueFromBase(base, minValue, maxValue, offsets.vit, trackId + ":" + slotIndex + ":vit")
    };
  }

  function normalizeProjectionFighter(gameState, fighter, slotIndex) {
    var trackId;
    var total;
    var expected;
    var expectedTotal;
    var rankId;
    var amateurRecord;
    var streetRecord;
    if (!fighter) {
      return fighter;
    }
    trackId = currentTrackId(fighter);
    total = statTotal(fighter);
    if (trackId === "amateur") {
      rankId = amateurRankIdFromTotal(fighter.age || 18, total);
      fighter.amateurRank = rankId;
      fighter.amateurClass = rankId;
      expected = buildAttributeSpread("amateur", slotIndex, {
        styleId: fighter.styleId || fighter.style || "",
        amateurRank: rankId,
        nationalTeamStatus: fighter.nationalTeamStatus || "none"
      });
      expectedTotal = statTotal({ attributes: expected });
      if (!fighter.isPlayer && Math.abs(total - expectedTotal) > 20) {
        fighter.attributes = clone(expected);
        fighter.stats = clone(expected);
        total = statTotal(fighter);
        fighter.amateurRank = amateurRankIdFromTotal(fighter.age || 18, total);
        fighter.amateurClass = fighter.amateurRank;
      }
      if (!fighter.isPlayer && (!fighter.lastUpdatedWeek || fighter.lastUpdatedWeek <= 0)) {
        amateurRecord = buildAmateurRecordForRank(fighter.amateurRank, fighter.id);
        fighter.amateurRecord = clone(amateurRecord);
        fighter.record.wins = amateurRecord.wins;
        fighter.record.losses = amateurRecord.losses;
        fighter.record.draws = amateurRecord.draws;
        fighter.record.kos = 0;
      }
      return fighter;
    }
    if (trackId === "street") {
      if (typeof fighter.streetRating !== "number" || fighter.streetRating <= 0) {
        fighter.streetRating = streetRatingFromTotal(total);
      }
      expected = buildAttributeSpread("street", slotIndex, {
        styleId: fighter.styleId || fighter.style || "",
        streetRating: fighter.streetRating
      });
      expectedTotal = statTotal({ attributes: expected });
      if (!fighter.isPlayer && (Math.abs(total - expectedTotal) > 35 || (maxAttributeValue(fighter) >= 150 && minAttributeValue(fighter) >= 148))) {
        fighter.attributes = clone(expected);
        fighter.stats = clone(expected);
        total = statTotal(fighter);
      }
      fighter.streetRating = streetRatingFromTotal(total);
      if (fighter.streetData && typeof fighter.streetData === "object") {
        fighter.streetData.currentStatusId = streetStatusForRating(fighter.streetRating);
      }
      if (!fighter.isPlayer && (!fighter.lastUpdatedWeek || fighter.lastUpdatedWeek <= 0)) {
        streetRecord = buildStreetRecordForTotal(total, fighter.id);
        fighter.record.wins = streetRecord.wins;
        fighter.record.losses = streetRecord.losses;
        fighter.record.draws = streetRecord.draws;
        fighter.record.kos = 0;
      }
      return fighter;
    }
    if (trackId === "pro" && !fighter.isPlayer) {
      expected = buildAttributeSpread("pro", slotIndex, {
        styleId: fighter.styleId || fighter.style || "",
        rankingSeed: typeof fighter.rankingSeed === "number" ? fighter.rankingSeed : 0,
        rankingBand: fighter.proRankingData && fighter.proRankingData.rankingBand ? fighter.proRankingData.rankingBand : "",
        contenderStatus: fighter.contenderStatus || "",
        recordWins: fighter.record && typeof fighter.record.wins === "number" ? fighter.record.wins : ((fighter.proRecord && fighter.proRecord.wins) || 0),
        fame: typeof fighter.fame === "number" ? fighter.fame : 0
      });
      if (total < 500 || ((fighter.contenderStatus === "champion" || fighter.contenderStatus === "titleholder") && minAttributeValue(fighter) < 188)) {
        fighter.attributes = clone(expected);
        fighter.stats = clone(expected);
      }
    }
    return fighter;
  }

  function amateurRankForSlot(slotIndex, age) {
    var ranks = adultRankPool();
    var index = 0;
    if (age <= 17) {
      index = clamp(Math.floor(slotIndex / 17), 0, 2);
    } else if (age <= 20) {
      index = clamp(3 + Math.floor(slotIndex / 15), 3, 6);
    } else {
      index = clamp(4 + Math.floor(slotIndex / 16), 4, 7);
    }
    return ranks[index] || "adult_class_3";
  }

  function nationalTeamStatusForSlot(trackId, slotIndex, age) {
    return "none";
  }

  function streetStatusForRating(rating) {
    if (rating >= 180) {
      return "street_legend";
    }
    if (rating >= 135) {
      return "national_underground_icon";
    }
    if (rating >= 95) {
      return "regional_underground_contender";
    }
    if (rating >= 55) {
      return "city_underground_regular";
    }
    if (rating >= 25) {
      return "district_contender";
    }
    return "neighborhood_unknown";
  }

  function districtIdForSlot(countryId, slotIndex) {
    var districts = listStreetDistrictTemplates();
    if (districts.length) {
      return districts[(slotIndex + deterministicRange(countryId, 0, 1000)) % districts.length].id;
    }
    return stableId("district", [countryId, (slotIndex % 5) + 1]);
  }

  function baseStreetData(countryId, slotIndex, rating) {
    var titles = [];
    if (rating >= 150) {
      titles.push("Легенда района");
    } else if (rating >= 100 && slotIndex % 9 === 0) {
      titles.push("Подпольный пояс города");
    }
    return {
      districtId: districtIdForSlot(countryId, slotIndex),
      cityStreetStanding: 0,
      nationalStreetStanding: 0,
      undergroundTitles: titles,
      localPromoterIds: [],
      undergroundPressureTags: [],
      currentSceneId: stableId("street_scene", [countryId, (slotIndex % 3) + 1]),
      currentStatusId: streetStatusForRating(rating)
    };
  }

  function buildProceduralFighter(gameState, countryId, trackId, slotIndex) {
    var identity = identityForSlot(countryId, trackId, slotIndex);
    var styleId = styleIdForSlot(slotIndex);
    var facilities = findFacilityBinding(gameState, countryId, trackId, slotIndex);
    var attributes;
    var age = 16;
    var streetRating = 0;
    var amateurRank = "";
    var amateurRecord = { wins: 0, losses: 0, draws: 0 };
    var proRecord = { wins: 0, losses: 0, draws: 0, kos: 0 };
    var nationalTeamStatus = "none";
    var rankingSeed = 0;
    var fame = 0;
    var wins = 0;
    var losses = 0;
    var draws = 0;
    var kos = 0;
    var totalValue;
    var streetRecord;
    if (trackId === "street") {
      age = deterministicRange(countryId + ":street:" + slotIndex, 16, 33);
      streetRating = clamp(1 + Math.round(((slotIndex - 1) / 49) * 149) + deterministicRange("sr:" + countryId + ":" + slotIndex, -4, 4), 1, 150);
      fame = Math.max(0, Math.round(streetRating / 4));
    } else if (trackId === "amateur") {
      age = deterministicRange(countryId + ":amateur:" + slotIndex, 16, 28);
      amateurRank = amateurRankForSlot(slotIndex, age);
      nationalTeamStatus = nationalTeamStatusForSlot(trackId, slotIndex, age);
      fame = 6 + Math.floor(slotIndex / 2);
    } else {
      age = deterministicRange(countryId + ":pro:" + slotIndex, 20, 38);
      proRecord.wins = 4 + slotIndex;
      proRecord.losses = Math.max(0, Math.floor(slotIndex / 6));
      proRecord.draws = slotIndex % 11 === 0 ? 1 : 0;
      proRecord.kos = Math.max(0, Math.floor(proRecord.wins * 0.45));
      wins = proRecord.wins;
      losses = proRecord.losses;
      draws = proRecord.draws;
      kos = proRecord.kos;
      rankingSeed = 40 + (slotIndex * 8) + deterministicRange("rank:" + countryId + ":" + slotIndex, 0, 24);
      fame = 18 + Math.floor(slotIndex * 1.5);
    }
    attributes = buildAttributeSpread(trackId, slotIndex, {
      styleId: styleId,
      amateurRank: amateurRank,
      nationalTeamStatus: nationalTeamStatus,
      streetRating: streetRating,
      rankingSeed: rankingSeed,
      contenderStatus: trackId === "pro" && rankingSeed >= 140 ? "champion" : (trackId === "pro" && rankingSeed >= 90 ? "ranked" : ""),
      recordWins: trackId === "pro" ? proRecord.wins : wins,
      fame: fame
    });
    if (trackId === "street") {
      totalValue = statTotal({ attributes: attributes });
      streetRating = streetRatingFromTotal(totalValue);
      streetRecord = buildStreetRecordForTotal(totalValue, stableId("fighter_generated", [trackId, countryId, slotIndex]));
      wins = streetRecord.wins;
      losses = streetRecord.losses;
      draws = streetRecord.draws;
    } else if (trackId === "amateur") {
      totalValue = statTotal({ attributes: attributes });
      amateurRank = amateurRankIdFromTotal(age, totalValue);
      attributes = buildAttributeSpread(trackId, slotIndex, {
        styleId: styleId,
        amateurRank: amateurRank,
        nationalTeamStatus: nationalTeamStatus,
        streetRating: streetRating,
        rankingSeed: rankingSeed,
        rankingBand: "",
        contenderStatus: "",
        recordWins: 0,
        fame: fame
      });
      amateurRecord = buildAmateurRecordForRank(amateurRank, stableId("fighter_generated", [trackId, countryId, slotIndex]));
      wins = amateurRecord.wins;
      losses = amateurRecord.losses;
      draws = amateurRecord.draws;
    }
    return {
      id: stableId("fighter_generated", [trackId, countryId, slotIndex]),
      firstName: identity.firstName,
      lastName: identity.lastName,
      nickname: trackAllowsNickname(trackId) ? identity.nickname : "",
      name: identity.firstName + (identity.lastName ? (" " + identity.lastName) : ""),
      fullName: displayName(identity.firstName, identity.lastName, identity.nickname, trackId),
      country: countryId,
      age: age,
      birthWeek: (slotIndex % 52) + 1,
      birthYear: 2026 - age,
      currentTrack: trackId,
      trackId: trackId,
      style: styleId,
      styleId: styleId,
      archetypeId: archetypeIdForTrack(trackId, slotIndex),
      attributes: clone(attributes),
      stats: clone(attributes),
      growthProfile: {
        focusId: trackId === "street" ? "power" : (trackId === "amateur" ? "technique" : "defense"),
        ceiling: trackId === "pro" ? 88 : 74,
        volatility: trackId === "street" ? 7 : 5,
        nextTrack: trackId === "street" ? "amateur" : (trackId === "amateur" ? "pro" : "")
      },
      healthState: {
        health: 100,
        injuries: []
      },
      wearState: {
        wear: trackId === "pro" ? deterministicRange("wear:" + countryId + ":" + slotIndex, 6, 24) : deterministicRange("wear:" + countryId + ":" + slotIndex, 0, 14),
        fatigue: deterministicRange("fat:" + countryId + ":" + slotIndex, 0, 12)
      },
      moraleState: {
        morale: deterministicRange("morale:" + countryId + ":" + slotIndex, 48, 74)
      },
      currentGymId: facilities.gymId,
      currentTrainerId: facilities.trainerId,
      currentCoachId: facilities.trainerId,
      currentPromoterId: "",
      currentManagerId: "",
      currentOrganizationId: "",
      gymId: facilities.gymId,
      trainerId: facilities.trainerId,
      streetRating: streetRating,
      streetData: trackId === "street" ? baseStreetData(countryId, slotIndex, streetRating) : {
        districtId: "",
        cityStreetStanding: 0,
        nationalStreetStanding: 0,
        undergroundTitles: [],
        localPromoterIds: [],
        undergroundPressureTags: [],
        currentSceneId: "",
        currentStatusId: "neighborhood_unknown"
      },
      amateurClass: amateurRank,
      amateurRank: amateurRank,
      amateurRecord: clone(amateurRecord),
      nationalTeamStatus: nationalTeamStatus,
      amateurGoals: trackId === "amateur" ? ["national_team_climber"] : [],
      goalProfileId: trackId === "street" ? "street_talent" : (trackId === "amateur" ? "amateur_medal_hunter" : "pro_chaser"),
      worldHistoryHooks: [],
      encounterHooks: [],
      proRecord: clone(proRecord),
      proRankingData: rankingSeed ? { rankingSeed: rankingSeed } : {},
      contenderStatus: trackId === "pro" ? (rankingSeed >= 140 ? "champion" : (rankingSeed >= 90 ? "ranked" : "prospect")) : "",
      titleHistory: [],
      rankingSeed: rankingSeed,
      proReputationTags: [],
      formerAmateurStatus: "",
      formerNationalTeamStatus: "none",
      olympicBackground: "",
      fame: fame,
      reputationTags: [],
      relationshipHooks: [],
      biographyLogIds: [],
      status: "active",
      lastTrackTransitionWeek: 0,
      lastTeamStatusChangeWeek: 0,
      lastGymChangeWeek: 0,
      lastCoachChangeWeek: 0,
      lastUpdatedWeek: 0,
      record: {
        wins: wins,
        losses: losses,
        draws: draws,
        kos: kos
      },
      tags: []
    };
  }

  function activeCount(gameState, trackId, countryId) {
    var roster = rosterRoot(gameState);
    var total = 0;
    var i;
    var fighter;
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      fighter = roster.fightersById[roster.fighterIds[i]];
      if (!isActiveFighter(fighter) || fighter.isPlayer) {
        continue;
      }
      if (currentTrackId(fighter) !== trackId) {
        continue;
      }
      if (countryId && fighter.country !== countryId) {
        continue;
      }
      total += 1;
    }
    return total;
  }

  function addProceduralFighter(gameState, countryId, trackId, slotIndex) {
    var roster = rosterRoot(gameState);
    var fighter = buildProceduralFighter(gameState, countryId, trackId, slotIndex);
    if (!roster.fightersById[fighter.id]) {
      roster.fightersById[fighter.id] = fighter;
      roster.fighterIds.push(fighter.id);
    }
    return fighter;
  }

  function ensureCountryTrackMinimum(gameState, countryId, trackId, targetCount) {
    var roster = rosterRoot(gameState);
    var current = activeCount(gameState, trackId, countryId);
    var slotIndex = 1;
    var fighterId;
    while (current < targetCount) {
      fighterId = stableId("fighter_generated", [trackId, countryId, slotIndex]);
      if (!roster.fightersById[fighterId] || !isActiveFighter(roster.fightersById[fighterId])) {
        addProceduralFighter(gameState, countryId, trackId, slotIndex);
        current += 1;
      }
      slotIndex += 1;
      if (slotIndex > targetCount * 4) {
        break;
      }
    }
  }

  function ensureGlobalProMinimum(gameState, targetCount) {
    var countries = listCountries();
    var roster = rosterRoot(gameState);
    var current = activeCount(gameState, "pro", "");
    var slotIndex = 1;
    var countryIndex = 0;
    var fighterId;
    if (!countries.length) {
      return;
    }
    while (current < targetCount) {
      fighterId = stableId("fighter_generated", ["pro", countries[countryIndex].id, slotIndex]);
      if (!roster.fightersById[fighterId] || !isActiveFighter(roster.fightersById[fighterId])) {
        addProceduralFighter(gameState, countries[countryIndex].id, "pro", slotIndex);
        current += 1;
      }
      countryIndex = (countryIndex + 1) % countries.length;
      if (countryIndex === 0) {
        slotIndex += 1;
      }
      if (slotIndex > (targetCount * 2)) {
        break;
      }
    }
  }

  function ensureMinimumRoster(gameState) {
    var rules = dataRoot().rosterTargets || {};
    var countries = listCountries();
    var roster = rosterRoot(gameState);
    var beforeCount = roster.fighterIds.length;
    var i;
    for (i = 0; i < countries.length; i += 1) {
      ensureCountryTrackMinimum(gameState, countries[i].id, "street", rules.streetPerCountry || 50);
      ensureCountryTrackMinimum(gameState, countries[i].id, "amateur", rules.amateurPerCountry || 50);
    }
    ensureGlobalProMinimum(gameState, rules.proGlobal || 100);
    if (roster.fighterIds.length !== beforeCount) {
      clearRankingProjectionCache();
      clearProfileProjectionCache();
      ensureRosterAttributeBands(gameState);
      return true;
    }
    ensureRosterAttributeBands(gameState);
    return false;
  }

  function ensureRosterAttributeBands(gameState) {
    var roster = rosterRoot(gameState);
    var changed = false;
    var i;
    var fighter;
    var trackId;
    var details;
    var expected;
    var currentTotal;
    var expectedTotal;
    if (!roster || !(roster.fighterIds instanceof Array)) {
      return false;
    }
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      fighter = roster.fightersById[roster.fighterIds[i]];
      if (!fighter || fighter.isPlayer || fighter.status === "retired") {
        continue;
      }
      trackId = currentTrackId(fighter);
      details = {
        styleId: fighter.styleId || fighter.style || "",
        amateurRank: fighter.amateurRank || fighter.amateurClass || "",
        nationalTeamStatus: fighter.nationalTeamStatus || "none",
        streetRating: typeof fighter.streetRating === "number" ? fighter.streetRating : 0,
        rankingSeed: typeof fighter.rankingSeed === "number" ? fighter.rankingSeed : 0,
        rankingBand: fighter.proRankingData && fighter.proRankingData.rankingBand ? fighter.proRankingData.rankingBand : "",
        contenderStatus: fighter.contenderStatus || "",
        recordWins: fighter.record && typeof fighter.record.wins === "number" ? fighter.record.wins : ((fighter.proRecord && fighter.proRecord.wins) || (fighter.amateurRecord && fighter.amateurRecord.wins) || 0),
        fame: typeof fighter.fame === "number" ? fighter.fame : 0
      };
      expected = buildAttributeSpread(trackId, i + 1, details);
      currentTotal = statTotal(fighter);
      expectedTotal = (expected.str || 0) + (expected.tec || 0) + (expected.spd || 0) + (expected.end || 0) + (expected.vit || 0);
      if ((trackId === "pro" && currentTotal < 500) || currentTotal < expectedTotal) {
        fighter.attributes = clone(expected);
        fighter.stats = clone(expected);
        changed = true;
      }
    }
    if (changed) {
      clearRankingProjectionCache();
      clearProfileProjectionCache();
    }
    return changed;
  }

  function countryLabel(countryId) {
    var country = getCountry(countryId);
    return country ? country.name : countryId;
  }

  function formatRecord(record) {
    var wins = record && typeof record.wins === "number" ? record.wins : 0;
    var losses = record && typeof record.losses === "number" ? record.losses : 0;
    var draws = record && typeof record.draws === "number" ? record.draws : 0;
    var kos = record && typeof record.kos === "number" ? record.kos : 0;
    return wins + "-" + losses + "-" + draws + (kos ? (" (KO " + kos + ")") : "");
  }

  function statTotal(source) {
    var stats = source && (source.attributes || source.stats) ? (source.attributes || source.stats) : {};
    return (stats.str || 0) + (stats.tec || 0) + (stats.spd || 0) + (stats.end || 0) + (stats.vit || 0);
  }

  function fighterDisplayName(fighter) {
    return fighter ? (fighter.fullName || fighter.name || displayName(fighter.firstName, fighter.lastName, fighter.nickname, currentTrackId(fighter))) : "";
  }

  function getSeasonState(gameState) {
    return gameState && gameState.competitionState ? gameState.competitionState.amateurSeason || {} : {};
  }

  function amateurStats(gameState, fighterId) {
    var seasonState = getSeasonState(gameState);
    return seasonState && seasonState.fighterSeasonStatsById ? seasonState.fighterSeasonStatsById[fighterId] || null : null;
  }

  function rankOrderValue(rankId) {
    var ranks = adultRankPool();
    var index = ranks.indexOf(rankId || "");
    return index >= 0 ? (index + 1) : 0;
  }

  function streetScore(fighter) {
    var rules = dataRoot().streetRanking || {};
    var titles = fighter && fighter.streetData && fighter.streetData.undergroundTitles instanceof Array ? fighter.streetData.undergroundTitles.length : 0;
    var standing = fighter && fighter.streetData ? Math.max(0, 120 - ((fighter.streetData.nationalStreetStanding || 0) * 2)) : 0;
    return (fighter.streetRating || 0) * 10 +
      titles * (rules.titleWeight || 18) +
      (fighter.fame || 0) * (rules.fameWeight || 2) +
      standing * (rules.standingWeight || 6) -
      ((fighter.wearState && fighter.wearState.wear) || 0) * (rules.wearPenalty || 1);
  }

  function amateurScore(gameState, fighter) {
    var rules = dataRoot().amateurRanking || {};
    var stats = amateurStats(gameState, fighter.id) || {};
    var medals = stats.medals || {};
    var teamWeights = rules.teamStatusWeights || {};
    return rankOrderValue(fighter.amateurRank || fighter.amateurClass || "") * 100 +
      (stats.seasonPoints || 0) +
      (stats.federationPoints || 0) +
      (medals.gold || 0) * ((rules.medalWeights || {}).gold || 34) +
      (medals.silver || 0) * ((rules.medalWeights || {}).silver || 20) +
      (medals.bronze || 0) * ((rules.medalWeights || {}).bronze || 12) +
      (((fighter.amateurRecord || {}).wins || 0) * (rules.amateurWinWeight || 5)) -
      (((fighter.amateurRecord || {}).losses || 0) * (rules.amateurLossPenalty || 3)) +
      (((fighter.attributes || {}).tec || 0) * (rules.techniqueWeight || 2)) +
      (teamWeights[fighter.nationalTeamStatus || "none"] || 0);
  }

  function proRingScore(gameState, fighter) {
    var rules = dataRoot().proRanking || {};
    var orgState = gameState && gameState.organizationState ? gameState.organizationState : {};
    var orgIds = orgState.organizationIds instanceof Array ? orgState.organizationIds : [];
    var championCount = 0;
    var i;
    var org;
    for (i = 0; i < orgIds.length; i += 1) {
      org = orgState.organizationsById ? orgState.organizationsById[orgIds[i]] : null;
      if (org && org.championId === fighter.id) {
        championCount += 1;
      }
    }
    return ((fighter.rankingSeed || 0) * (rules.rankingSeedWeight || 4)) +
      (((fighter.proRecord || {}).wins || 0) * (rules.winWeight || 4)) -
      (((fighter.proRecord || {}).losses || 0) * (rules.lossPenalty || 3)) +
      (((fighter.proRecord || {}).kos || 0) * (rules.koWeight || 2)) +
      ((fighter.fame || 0) * (rules.fameWeight || 1)) +
      championCount * (rules.championBonus || 55) +
      ((fighter.titleHistory instanceof Array ? fighter.titleHistory.length : 0) * (rules.titleHistoryWeight || 12));
  }

  function paginate(list, page, pageSize) {
    var currentPage = typeof page === "number" && page >= 0 ? page : 0;
    var size = typeof pageSize === "number" && pageSize > 0 ? pageSize : (dataRoot().pageSize || 20);
    var totalPages = Math.max(1, Math.ceil(list.length / size));
    currentPage = Math.min(currentPage, totalPages - 1);
    return {
      page: currentPage,
      pageSize: size,
      totalPages: totalPages,
      entries: list.slice(currentPage * size, (currentPage + 1) * size)
    };
  }

  function rankingTableId(orgId) {
    return stableId("ranking", [orgId]);
  }

  function orgChampion(gameState, orgId) {
    var orgState = gameState && gameState.organizationState ? gameState.organizationState : {};
    var org = orgState.organizationsById ? orgState.organizationsById[orgId] : null;
    var roster = rosterRoot(gameState);
    return org && org.championId ? (roster.fightersById[org.championId] || null) : null;
  }

  function proChampionIdMap(gameState) {
    var orgState = gameState && gameState.organizationState ? gameState.organizationState : {};
    var orgIds = orgState.organizationIds instanceof Array ? orgState.organizationIds : [];
    var map = {};
    var i;
    var org;
    for (i = 0; i < orgIds.length; i += 1) {
      org = orgState.organizationsById ? orgState.organizationsById[orgIds[i]] : null;
      if (org && org.championId) {
        map[org.championId] = true;
      }
    }
    return map;
  }

  function championRankingEntry(fighter, extra) {
    var base = extra || {};
    return {
      fighterId: fighter.id,
      position: 0,
      rankBadge: "cup",
      rankLabel: "Кубок",
      label: fighterDisplayName(fighter),
      countryId: fighter.country,
      countryLabel: countryLabel(fighter.country),
      record: formatRecord(fighter.proRecord || fighter.record),
      score: typeof base.score === "number" ? base.score : 0,
      isChampion: true,
      isPlayer: !!fighter.isPlayer
    };
  }

  function buildStreetRankingView(gameState, options) {
    var opts = options || {};
    var paging;
    var countryKey = opts.countryId || "";
    var list = cachedRankingProjection(gameState, opts, "street|" + (countryKey || "world"), function () {
      var cache = ensureProjectionCache(gameState, opts);
      var fighters;
      var result = [];
      var i;
      var fighter;
      if (!cache.streetStandingsRefreshed && typeof StreetCareerEngine !== "undefined" && StreetCareerEngine.refreshStreetStandings) {
        StreetCareerEngine.refreshStreetStandings(gameState);
        cache.streetStandingsRefreshed = true;
      }
      fighters = rankingFightersForView(gameState, "street", countryKey, opts);
      for (i = 0; i < fighters.length; i += 1) {
        fighter = fighters[i];
        result.push({
          fighterId: fighter.id,
          label: fighterDisplayName(fighter),
          countryId: fighter.country,
          countryLabel: countryLabel(fighter.country),
          age: fighter.age || 16,
          streetRating: fighter.streetRating || 0,
          streetStanding: fighter.streetData ? (fighter.streetData.nationalStreetStanding || 0) : 0,
          cityStanding: fighter.streetData ? (fighter.streetData.cityStreetStanding || 0) : 0,
          statusLabel: fighter.streetData && fighter.streetData.currentStatusId ? fighter.streetData.currentStatusId : "neighborhood_unknown",
          score: streetScore(fighter),
          isPlayer: !!fighter.isPlayer
        });
      }
      result.sort(function (left, right) {
        var leftStanding = left.streetStanding > 0 ? left.streetStanding : 9999;
        var rightStanding = right.streetStanding > 0 ? right.streetStanding : 9999;
        if (leftStanding !== rightStanding) {
          return leftStanding - rightStanding;
        }
        return right.score - left.score;
      });
      return applyPositions(result);
    });
    paging = paginate(list, opts.page, opts.pageSize || dataRoot().pageSize || 20);
    return {
      sectionId: "street",
      countryId: opts.countryId || "",
      total: list.length,
      page: paging.page,
      pageSize: paging.pageSize,
      totalPages: paging.totalPages,
      entries: paging.entries
    };
  }

  function buildAmateurRankingView(gameState, options) {
    var opts = options || {};
    var seasonState = getSeasonState(gameState);
    var paging;
    if (typeof AmateurSeasonEngine !== "undefined" && AmateurSeasonEngine.ensureState) {
      AmateurSeasonEngine.ensureState(gameState);
    }
    var countryKey = opts.countryId || "";
    var list = cachedRankingProjection(gameState, opts, "amateur|" + (countryKey || "world"), function () {
      var fighters = rankingFightersForView(gameState, "amateur", countryKey, opts);
      var result = [];
      var i;
      var fighter;
      var stats;
      for (i = 0; i < fighters.length; i += 1) {
        fighter = fighters[i];
        normalizeProjectionFighter(gameState, fighter, i + 1);
        stats = seasonState && seasonState.fighterSeasonStatsById ? seasonState.fighterSeasonStatsById[fighter.id] || null : null;
        result.push({
          fighterId: fighter.id,
          label: fighterDisplayName(fighter),
          countryId: fighter.country,
          countryLabel: countryLabel(fighter.country),
          age: fighter.age || 16,
          amateurRank: fighter.amateurRank || fighter.amateurClass || "",
          amateurRankLabel: getLocalizedRankLabel(fighter.country, fighter.amateurRank || fighter.amateurClass || ""),
          teamStatus: fighter.nationalTeamStatus || "none",
          medals: clone(stats && stats.medals ? stats.medals : { gold: 0, silver: 0, bronze: 0 }),
          seasonPoints: stats ? (stats.seasonPoints || 0) : 0,
          federationPoints: stats ? (stats.federationPoints || 0) : 0,
          record: clone(fighter.amateurRecord || { wins: 0, losses: 0, draws: 0 }),
          score: amateurScore(gameState, fighter),
          isPlayer: !!fighter.isPlayer
        });
      }
      result.sort(function (left, right) {
        return right.score - left.score;
      });
      return applyPositions(result);
    });
    paging = paginate(list, opts.page, opts.pageSize || dataRoot().pageSize || 20);
    return {
      sectionId: "amateur",
      countryId: opts.countryId || "",
      total: list.length,
      page: paging.page,
      pageSize: paging.pageSize,
      totalPages: paging.totalPages,
      entries: paging.entries
    };
  }

  function organizationRankingEntries(gameState, orgId, options) {
    return cachedRankingProjection(gameState, options || {}, "orgEntries|" + orgId, function () {
      var orgState = gameState && gameState.organizationState ? gameState.organizationState : {};
      var table = orgState.rankingTablesById ? orgState.rankingTablesById[rankingTableId(orgId)] : null;
      var roster = rosterRoot(gameState);
      var entries = [];
      var rankedEntries = [];
      var i;
      var entry;
      var fighter;
      var champion = orgChampion(gameState, orgId);
      var position = 1;
      if (!table || !(table.entries instanceof Array)) {
        if (champion) {
          entries.push(championRankingEntry(champion));
        }
        return entries;
      }
      for (i = 0; i < table.entries.length; i += 1) {
        entry = table.entries[i];
        fighter = entry && entry.fighterId ? roster.fightersById[entry.fighterId] : null;
        if (!entry || !fighter) {
          continue;
        }
        if (champion && champion.id === fighter.id) {
          continue;
        }
        rankedEntries.push({
          fighterId: fighter.id,
          position: entry.position || (i + 1),
          label: fighterDisplayName(fighter),
          countryId: fighter.country,
          countryLabel: countryLabel(fighter.country),
          record: formatRecord(fighter.proRecord || fighter.record),
          rankBadge: "",
          rankLabel: "",
          isChampion: false,
          isPlayer: !!fighter.isPlayer
        });
      }
      if (champion) {
        entries.push(championRankingEntry(champion));
      }
      for (i = 0; i < rankedEntries.length; i += 1) {
        rankedEntries[i].position = position;
        position += 1;
        entries.push(rankedEntries[i]);
      }
      return entries;
    });
  }

  function buildRingRanking(gameState, options) {
    return cachedRankingProjection(gameState, options || {}, "ring", function () {
      var fighters = rankingFightersForView(gameState, "pro", "", options || {});
      var list = [];
      var champions = [];
      var contenders = [];
      var championMap = proChampionIdMap(gameState);
      var i;
      var fighter;
      var position = 1;
      for (i = 0; i < fighters.length; i += 1) {
        fighter = fighters[i];
        list.push({
          fighterId: fighter.id,
          label: fighterDisplayName(fighter),
          countryId: fighter.country,
          countryLabel: countryLabel(fighter.country),
          score: proRingScore(gameState, fighter),
          record: formatRecord(fighter.proRecord || fighter.record),
          rankBadge: "",
          rankLabel: "",
          isChampion: !!championMap[fighter.id],
          isPlayer: !!fighter.isPlayer
        });
      }
      list.sort(function (left, right) {
        return right.score - left.score;
      });
      for (i = 0; i < list.length; i += 1) {
        if (list[i].isChampion) {
          list[i].position = 0;
          list[i].rankBadge = "cup";
          list[i].rankLabel = "Кубок";
          champions.push(list[i]);
        } else {
          contenders.push(list[i]);
        }
      }
      for (i = 0; i < contenders.length; i += 1) {
        contenders[i].position = position;
        position += 1;
      }
      return champions.concat(contenders);
    });
  }

  function buildProRankingView(gameState, options) {
    var opts = options || {};
    var tabId = opts.tabId || "ring";
    var orgs = typeof ContentLoader !== "undefined" && ContentLoader.listProOrganizations ? ContentLoader.listProOrganizations() : [];
    var summary = typeof ProCareerEngine !== "undefined" && ProCareerEngine.summary ? ProCareerEngine.summary(gameState) : { organizations: [] };
    var ring = buildRingRanking(gameState, opts);
    var playerRingEntry = null;
    var entries = [];
    var champions = [];
    var paging;
    var i;
    for (i = 0; i < ring.length; i += 1) {
      if (ring[i].isPlayer) {
        playerRingEntry = ring[i];
        break;
      }
    }
    for (i = 0; i < summary.organizations.length; i += 1) {
      champions.push({
        organizationId: summary.organizations[i].organizationId,
        organizationName: summary.organizations[i].name,
        championId: summary.organizations[i].championId,
        championLabel: summary.organizations[i].championLabel,
        playerRank: summary.organizations[i].playerRank || 0,
        titleShotExplanation: summary.organizations[i].titleShotExplanation || ""
      });
    }
    if (tabId === "ring") {
      entries = ring;
    } else if (tabId !== "champions") {
      entries = cachedRankingProjection(gameState, opts, "orgView|" + tabId, function () {
        return organizationRankingEntries(gameState, tabId, opts);
      });
    }
    paging = paginate(entries, opts.page, opts.pageSize || dataRoot().pageSize || 20);
    return {
      sectionId: "pro",
      tabId: tabId,
      tabs: ["champions", "ring"].concat(orgs.map(function (org) { return org.id; })),
      champions: champions,
      playerRingPosition: playerRingEntry ? playerRingEntry.position : 0,
      playerRingLabel: playerRingEntry ? (playerRingEntry.rankLabel || (playerRingEntry.position ? ("#" + playerRingEntry.position) : "")) : "",
      playerRingIsChampion: !!(playerRingEntry && playerRingEntry.rankBadge === "cup"),
      entries: tabId === "champions" ? [] : paging.entries,
      total: entries.length,
      page: tabId === "champions" ? 0 : paging.page,
      pageSize: tabId === "champions" ? 0 : paging.pageSize,
      totalPages: tabId === "champions" ? 1 : paging.totalPages
    };
  }

  function fighterRankLabel(fighter) {
    if (!fighter) {
      return "";
    }
    if (currentTrackId(fighter) === "amateur") {
      return getLocalizedRankLabel(fighter.country, fighter.amateurRank || fighter.amateurClass || "");
    }
    if (currentTrackId(fighter) === "pro") {
      return fighter.contenderStatus || "Профи";
    }
    return fighter.streetData && fighter.streetData.currentStatusId ? fighter.streetData.currentStatusId : "Улица";
  }

  function buildRosterDirectoryView(gameState, options) {
    var opts = options || {};
    var paging;
    var trackKey = opts.trackId || "all";
    var countryKey = opts.countryId || "";
    var list = cachedRankingProjection(gameState, opts, "roster|" + trackKey + "|" + (countryKey || "world"), function () {
      var fighters = activeRosterDirectorySource(gameState, trackKey, countryKey, opts);
      var result = [];
      var i;
      var fighter;
      var currentTrack;
      for (i = 0; i < fighters.length; i += 1) {
        fighter = fighters[i];
        normalizeProjectionFighter(gameState, fighter, i + 1);
        currentTrack = currentTrackId(fighter);
        result.push({
          fighterId: fighter.id,
          label: fighterDisplayName(fighter),
          countryId: fighter.country,
          countryLabel: countryLabel(fighter.country),
          trackId: currentTrack,
          trackLabel: trackLabel(currentTrack),
          age: fighter.age || 16,
          statusLabel: fighterRankLabel(fighter),
          score: currentTrack === "street" ? streetScore(fighter) : (currentTrack === "amateur" ? amateurScore(gameState, fighter) : proRingScore(gameState, fighter)),
          isPlayer: !!fighter.isPlayer
        });
      }
      result.sort(function (left, right) {
        if (left.isPlayer && !right.isPlayer) {
          return -1;
        }
        if (!left.isPlayer && right.isPlayer) {
          return 1;
        }
        if (left.trackId !== right.trackId) {
          return left.trackId.localeCompare(right.trackId);
        }
        return right.score - left.score;
      });
      return result;
    });
    paging = paginate(list, opts.page, opts.pageSize || dataRoot().pageSize || 20);
    return {
      sectionId: "roster",
      trackId: opts.trackId || "all",
      countryId: opts.countryId || "",
      total: list.length,
      page: paging.page,
      pageSize: paging.pageSize,
      totalPages: paging.totalPages,
      entries: paging.entries
    };
  }

  function fighterAchievements(gameState, fighter) {
    var achievements = [];
    var stats = amateurStats(gameState, fighter.id) || {};
    var medals = stats.medals || {};
    var orgs = typeof ContentLoader !== "undefined" && ContentLoader.listProOrganizations ? ContentLoader.listProOrganizations() : [];
    var i;
    var champion;
    if (currentTrackId(fighter) === "street" && fighter.streetData && fighter.streetData.undergroundTitles instanceof Array) {
      for (i = 0; i < fighter.streetData.undergroundTitles.length; i += 1) {
        addUnique(achievements, fighter.streetData.undergroundTitles[i]);
      }
    }
    if ((medals.gold || 0) > 0) {
      achievements.push("Золото: " + medals.gold);
    }
    if ((medals.silver || 0) > 0) {
      achievements.push("Серебро: " + medals.silver);
    }
    if ((medals.bronze || 0) > 0) {
      achievements.push("Бронза: " + medals.bronze);
    }
    if (fighter.nationalTeamStatus && fighter.nationalTeamStatus !== "none") {
      achievements.push("Сборная: " + fighter.nationalTeamStatus);
    }
    for (i = 0; i < orgs.length; i += 1) {
      champion = orgChampion(gameState, orgs[i].id);
      if (champion && champion.id === fighter.id) {
        achievements.push("Чемпион " + orgs[i].name);
      }
    }
    if (fighter.titleHistory instanceof Array && fighter.titleHistory.length) {
      achievements.push("Титульных записей: " + fighter.titleHistory.length);
    }
    if (!achievements.length) {
      if (currentTrackId(fighter) === "street") {
        achievements.push("Набирает имя на улице");
      } else if (currentTrackId(fighter) === "amateur") {
        achievements.push("Идёт по любительской системе");
      } else {
        achievements.push("Строит проф. карьеру");
      }
    }
    return achievements.slice(0, dataRoot().profile.achievementLimit || 6);
  }

  function fighterRecentResults(gameState, fighter) {
    var limit = dataRoot().profile.recentResultLimit || 6;
    var results = [];
    var stats = amateurStats(gameState, fighter.id) || {};
    var histories;
    var i;
    if (stats.resultHistory instanceof Array) {
      for (i = 0; i < stats.resultHistory.length && results.length < limit; i += 1) {
        results.push(stats.resultHistory[i]);
      }
    }
    if (fighter.titleHistory instanceof Array) {
      for (i = 0; i < fighter.titleHistory.length && results.length < limit; i += 1) {
        results.push((fighter.titleHistory[i].label || "Титульный шаг") + " · неделя " + (fighter.titleHistory[i].week || "—"));
      }
    }
    if (fighter.streetData && fighter.streetData.undergroundTitles instanceof Array) {
      for (i = 0; i < fighter.streetData.undergroundTitles.length && results.length < limit; i += 1) {
        results.push("Улица: " + fighter.streetData.undergroundTitles[i]);
      }
    }
    histories = typeof EncounterHistoryEngine !== "undefined" && EncounterHistoryEngine.listEncountersForFighter ? EncounterHistoryEngine.listEncountersForFighter(gameState, fighter.id) : [];
    for (i = 0; i < histories.length && results.length < limit; i += 1) {
      if (histories[i].allFightIds && histories[i].allFightIds.length) {
        results.push("Личные встречи: " + histories[i].allFightIds.length);
      }
    }
    if (!results.length) {
      results.push("Пока без большого результата.");
    }
    return results.slice(0, limit);
  }

  function fighterBiographySummary(gameState, fighter) {
    var roster = rosterRoot(gameState);
    var gym = fighter && fighter.currentGymId ? roster.gymsById[fighter.currentGymId] || null : null;
    var trainer = fighter && fighter.currentTrainerId ? roster.trainersById[fighter.currentTrainerId] || null : null;
    var lines = [];
    if (currentTrackId(fighter) === "street") {
      lines.push(countryLabel(fighter.country) + ". Уличный путь и давление сцены.");
    } else if (currentTrackId(fighter) === "amateur") {
      lines.push(countryLabel(fighter.country) + ". Любительская карьера через турниры и разряды.");
    } else {
      lines.push(countryLabel(fighter.country) + ". Профессиональный путь через рекорд и рейтинги.");
    }
    if (gym) {
      lines.push("Зал: " + gym.name + ".");
    }
    if (trainer) {
      lines.push("Тренер: " + (trainer.fullName || trainer.name || trainer.id) + ".");
    }
    if (fighter.worldHistoryHooks instanceof Array && fighter.worldHistoryHooks.length) {
      lines.push("След карьеры: " + fighter.worldHistoryHooks.slice(0, 3).join(", ") + ".");
    }
    return lines.join(" ");
  }

  function getEncounterWithPlayer(gameState, fighterId) {
    var playerId = gameState && gameState.playerState ? gameState.playerState.fighterEntityId || "fighter_player_main" : "fighter_player_main";
    if (!fighterId || fighterId === playerId || typeof EncounterHistoryEngine === "undefined" || !EncounterHistoryEngine.getEncounterHistory) {
      return null;
    }
    return EncounterHistoryEngine.getEncounterHistory(gameState, playerId, fighterId);
  }

  function trainerFighterIds(gameState, trainerId, options) {
    var roster = rosterRoot(gameState);
    var trainer = trainerId ? roster.trainersById[trainerId] || null : null;
    var ids = trainer && trainer.boxerIds instanceof Array ? trainer.boxerIds.slice(0) : [];
    var indexed;
    var i;
    var fighter;
    if (!ids.length) {
      if (typeof PersistentFighterRegistry !== "undefined" && PersistentFighterRegistry.getFightersByTrainer) {
        indexed = PersistentFighterRegistry.getFightersByTrainer(gameState, trainerId, {
          versionToken: options && options.versionToken ? options.versionToken : ""
        });
        for (i = 0; i < indexed.length; i += 1) {
          ids.push(indexed[i].id);
        }
        if (ids.length) {
          return ids;
        }
      }
      for (i = 0; i < roster.fighterIds.length; i += 1) {
        fighter = roster.fightersById[roster.fighterIds[i]];
        if (fighter && fighter.currentTrainerId === trainerId) {
          ids.push(fighter.id);
        }
      }
    }
    return ids;
  }

  function trainerRosterCount(gameState, trainerId, excludeFighterId, options) {
    var ids = trainerFighterIds(gameState, trainerId, options);
    var count = 0;
    var i;
    for (i = 0; i < ids.length; i += 1) {
      if (ids[i] !== excludeFighterId) {
        count += 1;
      }
    }
    return count;
  }

  function buildFighterProfile(gameState, fighterId, options) {
    var opts = options || {};
    return cachedProfileProjection(gameState, opts, "fighter|" + fighterId, function () {
      var roster = rosterRoot(gameState);
      var fighter = fighterId ? roster.fightersById[fighterId] || null : null;
      var slotIndex;
      var expectedAttributes;
      var currentTotal;
      var trainer = fighter && fighter.currentTrainerId ? roster.trainersById[fighter.currentTrainerId] || null : null;
      var gym = fighter && fighter.currentGymId ? roster.gymsById[fighter.currentGymId] || null : null;
      var encounter = fighter ? getEncounterWithPlayer(gameState, fighter.id) : null;
      var seasonStats = fighter ? (amateurStats(gameState, fighter.id) || null) : null;
      var ring = currentTrackId(fighter) === "pro" ? buildRingRanking(gameState, {
        versionToken: opts.rankingVersionToken || opts.versionToken || ""
      }) : [];
      var ringEntry = null;
      var orgs = typeof ContentLoader !== "undefined" && ContentLoader.listProOrganizations ? ContentLoader.listProOrganizations() : [];
      var orgRanks = [];
      var i;
      var orgEntries;
      if (!fighter) {
        return null;
      }
      slotIndex = Math.max(1, roster.fighterIds.indexOf(fighter.id) + 1);
      normalizeProjectionFighter(gameState, fighter, slotIndex);
      expectedAttributes = buildAttributeSpread(currentTrackId(fighter), slotIndex, {
        styleId: fighter.styleId || fighter.style || "",
        amateurRank: fighter.amateurRank || fighter.amateurClass || "",
        nationalTeamStatus: fighter.nationalTeamStatus || "none",
        streetRating: typeof fighter.streetRating === "number" ? fighter.streetRating : 0,
        rankingSeed: typeof fighter.rankingSeed === "number" ? fighter.rankingSeed : 0,
        rankingBand: fighter.proRankingData && fighter.proRankingData.rankingBand ? fighter.proRankingData.rankingBand : "",
        contenderStatus: fighter.contenderStatus || "",
        recordWins: fighter.record && typeof fighter.record.wins === "number" ? fighter.record.wins : ((fighter.proRecord && fighter.proRecord.wins) || (fighter.amateurRecord && fighter.amateurRecord.wins) || 0),
        fame: typeof fighter.fame === "number" ? fighter.fame : 0
      });
      currentTotal = statTotal(fighter);
      if ((currentTrackId(fighter) === "pro" && currentTotal < 500) || currentTotal < statTotal({ attributes: expectedAttributes })) {
        fighter.attributes = clone(expectedAttributes);
        fighter.stats = clone(expectedAttributes);
      }
      if (currentTrackId(fighter) === "pro") {
      for (i = 0; i < ring.length; i += 1) {
        if (ring[i].fighterId === fighter.id) {
          ringEntry = ring[i];
          break;
        }
      }
      for (i = 0; i < orgs.length; i += 1) {
        orgEntries = organizationRankingEntries(gameState, orgs[i].id, {
          versionToken: opts.rankingVersionToken || opts.versionToken || ""
        });
        orgRanks.push({
          organizationId: orgs[i].id,
          name: orgs[i].name,
          isChampion: (function () {
            var j;
            for (j = 0; j < orgEntries.length; j += 1) {
              if (orgEntries[j].fighterId === fighter.id) {
                return !!orgEntries[j].isChampion || orgEntries[j].rankBadge === "cup";
              }
            }
            return false;
          }()),
          position: (function () {
            var j;
            for (j = 0; j < orgEntries.length; j += 1) {
              if (orgEntries[j].fighterId === fighter.id) {
                return orgEntries[j].position;
              }
            }
            return 0;
          }())
        });
      }
    }
    return {
      fighterId: fighter.id,
      label: fighterDisplayName(fighter),
      firstName: fighter.firstName || "",
      lastName: fighter.lastName || "",
      nickname: trackAllowsNickname(currentTrackId(fighter)) ? sanitizeNicknameWord(fighter.nickname || "") : "",
      countryId: fighter.country,
      countryLabel: countryLabel(fighter.country),
      age: fighter.age || 16,
      trackId: currentTrackId(fighter),
      trackLabel: trackLabel(currentTrackId(fighter)),
      gymId: gym ? gym.id : "",
      gymLabel: gym ? gym.name : "Без зала",
      gymTypeLabel: gym ? getGymTypeLabel(gym.gymType || "") : "",
      trainerId: trainer ? trainer.id : "",
      trainerLabel: trainer ? (trainer.fullName || trainer.name || trainer.id) : "Без тренера",
      trainerRosterCount: trainer ? trainerRosterCount(gameState, trainer.id, fighter.id, {
        versionToken: opts.versionToken || ""
      }) : 0,
      styleId: fighter.styleId || fighter.style || "",
      archetypeId: fighter.archetypeId || "",
      attributes: clone(fighter.attributes || fighter.stats || {}),
      recordLabel: currentTrackId(fighter) === "pro" ? formatRecord(fighter.proRecord || fighter.record) : formatRecord(fighter.record),
      achievements: fighterAchievements(gameState, fighter),
      biographySummary: fighterBiographySummary(gameState, fighter),
      recentResults: fighterRecentResults(gameState, fighter),
      rivalryWithPlayer: encounter ? {
        rivalryLevel: encounter.rivalryLevel || 0,
        respectLevel: encounter.respectLevel || 0,
        fights: encounter.allFightIds ? encounter.allFightIds.length : 0,
        sparrings: encounter.sparringIds ? encounter.sparringIds.length : 0,
        sharedGyms: encounter.sharedGymIds ? encounter.sharedGymIds.length : 0,
        sharedTeams: encounter.sharedTeamIds ? encounter.sharedTeamIds.length : 0
      } : null,
      amateur: currentTrackId(fighter) === "amateur" ? {
        rankId: fighter.amateurRank || fighter.amateurClass || "",
        rankLabel: getLocalizedRankLabel(fighter.country, fighter.amateurRank || fighter.amateurClass || ""),
        nationalTeamStatus: fighter.nationalTeamStatus || "none",
        medals: clone(seasonStats && seasonStats.medals ? seasonStats.medals : { gold: 0, silver: 0, bronze: 0 }),
        placements: clone(seasonStats && seasonStats.placements ? seasonStats.placements : []),
        seasonPoints: seasonStats ? (seasonStats.seasonPoints || 0) : 0,
        federationPoints: seasonStats ? (seasonStats.federationPoints || 0) : 0
      } : null,
      street: currentTrackId(fighter) === "street" ? {
        districtId: fighter.streetData ? fighter.streetData.districtId || "" : "",
        sceneId: fighter.streetData ? fighter.streetData.currentSceneId || "" : "",
        standing: fighter.streetData ? fighter.streetData.nationalStreetStanding || 0 : 0,
        cityStanding: fighter.streetData ? fighter.streetData.cityStreetStanding || 0 : 0,
        streetRating: fighter.streetRating || 0,
        statusId: fighter.streetData ? fighter.streetData.currentStatusId || "" : "",
        undergroundTitles: clone(fighter.streetData && fighter.streetData.undergroundTitles ? fighter.streetData.undergroundTitles : [])
      } : null,
      pro: currentTrackId(fighter) === "pro" ? {
        proRecord: clone(fighter.proRecord || { wins: 0, losses: 0, draws: 0, kos: 0 }),
        ringPosition: ringEntry ? ringEntry.position : 0,
        contenderStatus: fighter.contenderStatus || "",
        rankingSeed: fighter.rankingSeed || 0,
        titleHistory: clone(fighter.titleHistory || []),
        organizationRanks: orgRanks
      } : null
    };
    });
  }

  function trackStatusText(fighter, gameState) {
    if (!fighter) {
      return "";
    }
    if (currentTrackId(fighter) === "street") {
      return "Рейтинг " + (fighter.streetRating || 0);
    }
    if (currentTrackId(fighter) === "amateur") {
      return getLocalizedRankLabel(fighter.country, fighter.amateurRank || fighter.amateurClass || "");
    }
    return "Профи " + formatRecord(fighter.proRecord || fighter.record);
  }

  function buildTrainerProfile(gameState, trainerId, options) {
    var opts = options || {};
    return cachedProfileProjection(gameState, opts, "trainer|" + trainerId, function () {
    var roster = rosterRoot(gameState);
    var trainer = trainerId ? roster.trainersById[trainerId] || null : null;
    var gym = trainer && trainer.currentGymId ? roster.gymsById[trainer.currentGymId] || null : null;
    var ids = trainer ? trainerFighterIds(gameState, trainer.id, {
      versionToken: opts.versionToken || ""
    }) : [];
    var grouped = {
      street: [],
      amateur: [],
      pro: []
    };
    var i;
    var fighter;
    if (!trainer) {
      return null;
    }
    for (i = 0; i < ids.length; i += 1) {
      fighter = roster.fightersById[ids[i]];
      if (!fighter || fighter.status === "retired") {
        continue;
      }
      grouped[currentTrackId(fighter)].push({
        fighterId: fighter.id,
        label: fighterDisplayName(fighter),
        countryLabel: countryLabel(fighter.country),
        age: fighter.age || 16,
        trackId: currentTrackId(fighter),
        trackLabel: trackLabel(currentTrackId(fighter)),
        statusLabel: trackStatusText(fighter, gameState),
        isPlayer: !!fighter.isPlayer
      });
    }
    return {
      trainerId: trainer.id,
      label: trainer.fullName || trainer.name || trainer.id,
      countryLabel: countryLabel(trainer.country),
      trainerType: trainer.trainerType || trainer.coachRoleId || "",
      trainerTypeLabel: getTrainerTypeLabel(trainer.trainerType || trainer.coachRoleId || ""),
      specialization: clone(trainer.specialization || []),
      preferredStyles: clone(trainer.preferredStyles || []),
      salary: trainer.salary || trainer.monthlyFee || 0,
      gymId: gym ? gym.id : "",
      gymLabel: gym ? gym.name : "Без зала",
      gymTypeLabel: gym ? getGymTypeLabel(gym.gymType || "") : "",
      bonuses: clone(trainer.bonuses || trainer.trainingBonuses || {}),
      groupedFighters: grouped,
      totalFighters: grouped.street.length + grouped.amateur.length + grouped.pro.length
    };
    });
  }

  return {
    ensureMinimumRoster: ensureMinimumRoster,
    ensureRosterAttributeBands: ensureRosterAttributeBands,
    buildStreetRankingView: buildStreetRankingView,
    buildAmateurRankingView: buildAmateurRankingView,
    buildProRankingView: buildProRankingView,
    buildRosterDirectoryView: buildRosterDirectoryView,
    buildFighterProfile: buildFighterProfile,
    buildTrainerProfile: buildTrainerProfile,
    getTrainerRosterCount: trainerRosterCount
  };
}());
