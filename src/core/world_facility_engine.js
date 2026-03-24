var WorldFacilityEngine = (function () {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
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
    if (!(gameState.rosterState.fighterIds instanceof Array)) {
      gameState.rosterState.fighterIds = [];
    }
    if (!gameState.rosterState.fightersById || typeof gameState.rosterState.fightersById !== "object") {
      gameState.rosterState.fightersById = {};
    }
    return gameState.rosterState;
  }

  var facilityIndexCache = {
    gameState: null,
    versionToken: "",
    indexes: null
  };

  function pushIndexValue(mapObject, key, value) {
    if (!key) {
      return;
    }
    if (!(mapObject[key] instanceof Array)) {
      mapObject[key] = [];
    }
    if (mapObject[key].indexOf(value) === -1) {
      mapObject[key].push(value);
    }
  }

  function defaultFacilityVersionToken(gameState) {
    var roster = rosterRoot(gameState);
    var calendar = gameState && gameState.career ? gameState.career.calendar || {} : {};
    return [
      roster.gymIds.length,
      roster.trainerIds.length,
      roster.fighterIds.length,
      calendar.year || 0,
      calendar.week || 0
    ].join("|");
  }

  function facilityVersionToken(gameState, options) {
    return options && options.versionToken != null && options.versionToken !== "" ? String(options.versionToken) : defaultFacilityVersionToken(gameState);
  }

  function buildFacilityIndexes(gameState) {
    var roster = rosterRoot(gameState);
    var indexes = {
      gymsByCountry: {},
      trainersByCountry: {},
      trainersByGym: {},
      trainersByGymRecovery: {}
    };
    var i;
    var gym;
    var trainer;
    for (i = 0; i < roster.gymIds.length; i += 1) {
      gym = normalizeGym(roster.gymsById[roster.gymIds[i]]);
      roster.gymsById[gym.id] = gym;
      pushIndexValue(indexes.gymsByCountry, gym.country || "", gym.id);
      indexes.trainersByGym[gym.id] = gym.trainerIds instanceof Array ? gym.trainerIds.slice(0) : [];
    }
    for (i = 0; i < roster.trainerIds.length; i += 1) {
      trainer = normalizeTrainer(roster.trainersById[roster.trainerIds[i]]);
      roster.trainersById[trainer.id] = trainer;
      pushIndexValue(indexes.trainersByCountry, trainer.country || "", trainer.id);
      if (trainer.currentGymId) {
        pushIndexValue(indexes.trainersByGymRecovery, trainer.currentGymId, trainer.id);
        if (!(indexes.trainersByGym[trainer.currentGymId] instanceof Array)) {
          indexes.trainersByGym[trainer.currentGymId] = [];
        }
      }
    }
    return indexes;
  }

  function ensureFacilityIndexes(gameState, options) {
    var token = facilityVersionToken(gameState, options);
    if (facilityIndexCache.gameState !== gameState || facilityIndexCache.versionToken !== token || !facilityIndexCache.indexes) {
      facilityIndexCache.gameState = gameState;
      facilityIndexCache.versionToken = token;
      facilityIndexCache.indexes = buildFacilityIndexes(gameState);
    }
    return facilityIndexCache.indexes;
  }

  function gymsFromIds(gameState, ids) {
    var roster = rosterRoot(gameState);
    var result = [];
    var i;
    var gym;
    if (!(ids instanceof Array) || !ids.length) {
      return result;
    }
    for (i = 0; i < ids.length; i += 1) {
      gym = roster.gymsById[ids[i]];
      if (gym) {
        result.push(gym);
      }
    }
    return result;
  }

  function trainersFromIds(gameState, ids) {
    var roster = rosterRoot(gameState);
    var result = [];
    var i;
    var trainer;
    if (!(ids instanceof Array) || !ids.length) {
      return result;
    }
    for (i = 0; i < ids.length; i += 1) {
      trainer = roster.trainersById[ids[i]];
      if (trainer) {
        result.push(trainer);
      }
    }
    return result;
  }

  function compareRanks(leftId, rightId) {
    if (!rightId) {
      return 1;
    }
    if (typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.compareRanks) {
      return JuniorAmateurSystem.compareRanks(leftId || "", rightId || "");
    }
    return leftId === rightId ? 0 : 1;
  }

  function currentTrackId(fighter) {
    return fighter ? (fighter.currentTrack || fighter.trackId || "street") : "street";
  }

  function fighterAge(fighter) {
    return fighter && typeof fighter.age === "number" ? fighter.age : 16;
  }

  function uniquePush(list, value) {
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

  function listOverlap(left, right) {
    var result = [];
    var seen = {};
    var i;
    if (!(left instanceof Array) || !(right instanceof Array)) {
      return result;
    }
    for (i = 0; i < left.length; i += 1) {
      if (typeof left[i] === "string" && left[i] && right.indexOf(left[i]) !== -1 && !seen[left[i]]) {
        seen[left[i]] = true;
        result.push(left[i]);
      }
    }
    return result;
  }

  function normalizeGym(gym) {
    var target = gym || {};
    var sourceGym = null;
    target.id = target.id || "";
    if (target.id && typeof ContentLoader !== "undefined" && ContentLoader.getGym) {
      sourceGym = ContentLoader.getGym(target.id);
    }
    target.name = target.name || "";
    if (sourceGym && sourceGym.name) {
      target.name = sourceGym.name;
    }
    target.country = target.country || "";
    target.city = target.city || "";
    target.gymType = target.gymType || target.type || "";
    target.reputation = typeof target.reputation === "number" ? target.reputation : 0;
    target.trainingBonuses = clone(target.trainingBonuses || target.bonuses || {});
    target.bonuses = clone(target.trainingBonuses);
    target.cost = typeof target.cost === "number" ? target.cost : (typeof target.monthlyCost === "number" ? target.monthlyCost : 0);
    target.monthlyCost = target.cost;
    target.weeklyCost = typeof target.weeklyCost === "number" ? target.weeklyCost : Math.max(4, Math.ceil((target.cost || 0) / 4));
    target.rosterIds = target.rosterIds instanceof Array ? target.rosterIds : [];
    target.coachIds = target.coachIds instanceof Array ? target.coachIds : (target.trainerIds instanceof Array ? clone(target.trainerIds) : []);
    target.trainerIds = clone(target.coachIds);
    target.allowedTracks = target.allowedTracks instanceof Array ? target.allowedTracks : [];
    target.specialization = target.specialization instanceof Array ? target.specialization : [];
    target.orgType = target.orgType || "";
    target.minRankId = target.minRankId || "";
    target.allowedAgeRange = target.allowedAgeRange && typeof target.allowedAgeRange === "object" ? target.allowedAgeRange : null;
    target.trainingFocus = target.trainingFocus instanceof Array ? target.trainingFocus : [];
    return target;
  }

  function normalizeTrainer(trainer) {
    var target = trainer || {};
    target.id = target.id || "";
    target.fullName = target.fullName || target.name || target.label || "";
    target.name = target.fullName;
    target.label = target.fullName;
    target.country = target.country || "";
    target.city = target.city || "";
    target.trainerType = target.trainerType || target.coachRoleId || "";
    target.coachRoleId = target.coachRoleId || target.trainerType || "";
    target.specialization = target.specialization instanceof Array ? target.specialization : [];
    target.salary = typeof target.salary === "number" ? target.salary : (typeof target.monthlyFee === "number" ? target.monthlyFee : 0);
    target.monthlyFee = target.salary;
    target.weeklyFee = typeof target.weeklyFee === "number" ? target.weeklyFee : Math.max(4, Math.ceil((target.salary || 0) / 4));
    target.preferredStyles = target.preferredStyles instanceof Array ? target.preferredStyles : [];
    target.currentGymId = target.currentGymId || target.gymId || "";
    target.gymId = target.currentGymId;
    target.boxerIds = target.boxerIds instanceof Array ? target.boxerIds : [];
    target.bonuses = clone(target.bonuses || target.trainingBonuses || {});
    target.trainingBonuses = clone(target.bonuses);
    target.reputation = typeof target.reputation === "number" ? target.reputation : 0;
    target.minRankId = target.minRankId || "";
    target.allowedTracks = target.allowedTracks instanceof Array ? target.allowedTracks : [];
    return target;
  }

  function getFighterById(gameState, fighterId) {
    var roster = rosterRoot(gameState);
    return fighterId ? (roster.fightersById[fighterId] || null) : null;
  }

  function getGymById(gameState, gymId) {
    var roster = rosterRoot(gameState);
    return gymId ? (roster.gymsById[gymId] || null) : null;
  }

  function getTrainerById(gameState, trainerId) {
    var roster = rosterRoot(gameState);
    return trainerId ? (roster.trainersById[trainerId] || null) : null;
  }

  function filterTrack(list, trackId) {
    var result = [];
    var i;
    var item;
    for (i = 0; i < list.length; i += 1) {
      item = list[i];
      if (!item) {
        continue;
      }
      if (!(item.allowedTracks instanceof Array) || !item.allowedTracks.length || item.allowedTracks.indexOf(trackId) !== -1) {
        result.push(item);
      }
    }
    return result;
  }

  function listGymsByCountry(gameState, countryId, options) {
    var indexes = ensureFacilityIndexes(gameState, options);
    var result = gymsFromIds(gameState, indexes.gymsByCountry[countryId || ""] || []);
    var opts = options || {};
    if (opts.trackId) {
      result = filterTrack(result, opts.trackId);
    }
    return result;
  }

  function listTrainersByCountry(gameState, countryId, options) {
    var indexes = ensureFacilityIndexes(gameState, options);
    var result = trainersFromIds(gameState, indexes.trainersByCountry[countryId || ""] || []);
    var opts = options || {};
    if (opts.trackId) {
      result = filterTrack(result, opts.trackId);
    }
    return result;
  }

  function listTrainersByGym(gameState, gymId, options) {
    var roster = rosterRoot(gameState);
    var indexes = ensureFacilityIndexes(gameState, options);
    var gym = roster.gymsById[gymId] || null;
    var ids = gym && gym.trainerIds instanceof Array ? gym.trainerIds : [];
    var result = [];
    var fallbackIds;
    var i;
    var trainer;
    var opts = options || {};

    for (i = 0; i < ids.length; i += 1) {
      trainer = roster.trainersById[ids[i]];
      if (trainer && trainer.currentGymId === gymId) {
        result.push(trainer);
      }
    }
    fallbackIds = indexes.trainersByGymRecovery[gymId] || indexes.trainersByGym[gymId] || [];
    if (!result.length || ((ids instanceof Array && ids.length) && fallbackIds.length > result.length)) {
      result = trainersFromIds(gameState, fallbackIds);
      for (i = result.length - 1; i >= 0; i -= 1) {
        if (!result[i] || result[i].currentGymId !== gymId) {
          result.splice(i, 1);
        }
      }
    }
    if (opts.trackId) {
      result = filterTrack(result, opts.trackId);
    }
    result.sort(function (left, right) {
      return ((left.salary || left.monthlyFee || 0) - (right.salary || right.monthlyFee || 0));
    });
    return result;
  }

  function bindTrainerToCompatibleGym(gameState, trainer, preferredGymId) {
    var roster = rosterRoot(gameState);
    var gyms;
    var i;
    var gym;
    if (!trainer) {
      return "";
    }
    if (preferredGymId && roster.gymsById[preferredGymId]) {
      trainer.currentGymId = preferredGymId;
      trainer.gymId = preferredGymId;
      return preferredGymId;
    }
    gyms = listGymsByCountry(gameState, trainer.country || "", {
      trackId: trainer.allowedTracks instanceof Array && trainer.allowedTracks.length ? trainer.allowedTracks[0] : ""
    });
    if (!gyms.length) {
      gyms = listGymsByCountry(gameState, trainer.country || "", {});
    }
    for (i = 0; i < gyms.length; i += 1) {
      gym = gyms[i];
      if (!gym) {
        continue;
      }
      if (!(trainer.allowedTracks instanceof Array) || !trainer.allowedTracks.length || !(gym.allowedTracks instanceof Array) || !gym.allowedTracks.length || listOverlap(trainer.allowedTracks, gym.allowedTracks).length) {
        trainer.currentGymId = gym.id;
        trainer.gymId = gym.id;
        return gym.id;
      }
    }
    trainer.currentGymId = "";
    trainer.gymId = "";
    return "";
  }

  function reconcileFighterFacilityPair(gameState, fighter) {
    var roster = rosterRoot(gameState);
    var trainer;
    if (!fighter) {
      return;
    }
    if (fighter.currentTrainerId && roster.trainersById[fighter.currentTrainerId]) {
      trainer = roster.trainersById[fighter.currentTrainerId];
      if (!trainer.currentGymId || !roster.gymsById[trainer.currentGymId]) {
        bindTrainerToCompatibleGym(gameState, trainer, fighter.currentGymId || fighter.gymId || "");
      }
      if (!fighter.currentGymId && trainer.currentGymId) {
        fighter.currentGymId = trainer.currentGymId;
        fighter.gymId = trainer.currentGymId;
      } else if (fighter.currentGymId && trainer.currentGymId && fighter.currentGymId !== trainer.currentGymId) {
        fighter.currentTrainerId = "";
        fighter.currentCoachId = "";
        fighter.trainerId = "";
      }
    }
  }

  function syncFacilityLinks(gameState) {
    var roster = rosterRoot(gameState);
    var i;
    var gym;
    var trainer;
    var fighter;
    for (i = 0; i < roster.gymIds.length; i += 1) {
      gym = normalizeGym(roster.gymsById[roster.gymIds[i]]);
      gym.rosterIds = [];
      gym.coachIds = [];
      gym.trainerIds = [];
      roster.gymsById[gym.id] = gym;
    }
    for (i = 0; i < roster.trainerIds.length; i += 1) {
      trainer = normalizeTrainer(roster.trainersById[roster.trainerIds[i]]);
      trainer.boxerIds = [];
      roster.trainersById[trainer.id] = trainer;
      if (trainer.currentGymId && roster.gymsById[trainer.currentGymId]) {
        uniquePush(roster.gymsById[trainer.currentGymId].coachIds, trainer.id);
        uniquePush(roster.gymsById[trainer.currentGymId].trainerIds, trainer.id);
      }
    }
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      fighter = roster.fightersById[roster.fighterIds[i]];
      if (!fighter) {
        continue;
      }
      if (fighter.currentGymId && roster.gymsById[fighter.currentGymId]) {
        uniquePush(roster.gymsById[fighter.currentGymId].rosterIds, fighter.id);
      }
      if (fighter.currentTrainerId && roster.trainersById[fighter.currentTrainerId]) {
        uniquePush(roster.trainersById[fighter.currentTrainerId].boxerIds, fighter.id);
      }
    }
    return gameState;
  }

  function normalizeGameStateFacilities(gameState) {
    var roster = rosterRoot(gameState);
    var i;
    var gymId;
    var trainerId;
    for (i = 0; i < roster.gymIds.length; i += 1) {
      gymId = roster.gymIds[i];
      roster.gymsById[gymId] = normalizeGym(roster.gymsById[gymId]);
    }
    for (i = 0; i < roster.trainerIds.length; i += 1) {
      trainerId = roster.trainerIds[i];
      roster.trainersById[trainerId] = normalizeTrainer(roster.trainersById[trainerId]);
      if (!roster.trainersById[trainerId].currentGymId || !roster.gymsById[roster.trainersById[trainerId].currentGymId]) {
        bindTrainerToCompatibleGym(gameState, roster.trainersById[trainerId], "");
      }
    }
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      reconcileFighterFacilityPair(gameState, roster.fightersById[roster.fighterIds[i]]);
    }
    return syncFacilityLinks(gameState);
  }

  function gymAccessInfo(gameState, fighterId, gymId) {
    var fighter = getFighterById(gameState, fighterId);
    var gym = getGymById(gameState, gymId);
    var trackId;
    if (!fighter || !gym) {
      return { ok: false, reason: "Недоступно." };
    }
    trackId = currentTrackId(fighter);
    if (gym.country && fighter.country && gym.country !== fighter.country) {
      return { ok: false, reason: "Зал в другой стране." };
    }
    if (gym.allowedTracks instanceof Array && gym.allowedTracks.length && gym.allowedTracks.indexOf(trackId) === -1) {
      return { ok: false, reason: "Не подходит для текущего трека." };
    }
    if (trackId !== "pro" && gym.minRankId && compareRanks(fighter.amateurRank || fighter.amateurClass || "", gym.minRankId) < 0) {
      return { ok: false, reason: "Нужен более высокий разряд." };
    }
    if (gym.allowedAgeRange) {
      if (fighterAge(fighter) < (gym.allowedAgeRange.min || 0) || fighterAge(fighter) > (gym.allowedAgeRange.max || 99)) {
        return { ok: false, reason: "Не подходит по возрасту." };
      }
    }
    return { ok: true, reason: "" };
  }

  function trainerAccessInfo(gameState, fighterId, trainerId) {
    var fighter = getFighterById(gameState, fighterId);
    var trainer = getTrainerById(gameState, trainerId);
    var gymInfo;
    var trackId;
    if (!fighter || !trainer) {
      return { ok: false, reason: "Недоступно." };
    }
    trackId = currentTrackId(fighter);
    if (trainer.country && fighter.country && trainer.country !== fighter.country) {
      return { ok: false, reason: "Тренер работает в другой стране." };
    }
    if (trainer.allowedTracks instanceof Array && trainer.allowedTracks.length && trainer.allowedTracks.indexOf(trackId) === -1) {
      return { ok: false, reason: "Не подходит для текущего трека." };
    }
    if (trackId !== "pro" && trainer.minRankId && compareRanks(fighter.amateurRank || fighter.amateurClass || "", trainer.minRankId) < 0) {
      return { ok: false, reason: "Нужен более высокий разряд." };
    }
    if (!fighter.currentGymId) {
      return { ok: false, reason: "Сначала выбери зал." };
    }
    if (trainer.currentGymId && fighter.currentGymId !== trainer.currentGymId) {
      return { ok: false, reason: "Тренер работает в другом зале." };
    }
    if (trainer.currentGymId) {
      gymInfo = gymAccessInfo(gameState, fighterId, trainer.currentGymId);
      if (!gymInfo.ok) {
        return gymInfo;
      }
    }
    return { ok: true, reason: "" };
  }

  function setFighterGym(fighter, gymId, weekValue) {
    fighter.currentGymId = gymId || "";
    fighter.gymId = fighter.currentGymId;
    fighter.lastGymChangeWeek = typeof weekValue === "number" ? weekValue : (fighter.lastGymChangeWeek || 0);
  }

  function setFighterTrainer(fighter, trainerId, weekValue) {
    fighter.currentTrainerId = trainerId || "";
    fighter.currentCoachId = fighter.currentTrainerId;
    fighter.trainerId = fighter.currentTrainerId;
    fighter.lastCoachChangeWeek = typeof weekValue === "number" ? weekValue : (fighter.lastCoachChangeWeek || 0);
  }

  function leaveGym(gameState, fighterId, weekValue, reason) {
    var fighter = getFighterById(gameState, fighterId);
    var previousGymId;
    var trainer;
    if (!fighter) {
      return { ok: false, reason: "Боец не найден." };
    }
    previousGymId = fighter.currentGymId || fighter.gymId || "";
    trainer = fighter.currentTrainerId ? getTrainerById(gameState, fighter.currentTrainerId) : null;
    setFighterGym(fighter, "", weekValue);
    if (trainer && (!trainer.currentGymId || trainer.currentGymId === previousGymId)) {
      setFighterTrainer(fighter, "", weekValue);
    }
    if (fighter.currentOrganizationId && typeof AmateurEcosystem !== "undefined" && AmateurEcosystem.getOrganizationById) {
      fighter.currentOrganizationId = "";
    }
    syncFacilityLinks(gameState);
    return { ok: true, reason: reason || "" };
  }

  function signGym(gameState, fighterId, gymId, weekValue) {
    var fighter = getFighterById(gameState, fighterId);
    var gym = getGymById(gameState, gymId);
    var info = gymAccessInfo(gameState, fighterId, gymId);
    var previousTrainer = fighter && fighter.currentTrainerId ? getTrainerById(gameState, fighter.currentTrainerId) : null;
    var org;
    if (!fighter || !gym || !info.ok) {
      return { ok: false, reason: info.reason || "Зал недоступен." };
    }
    setFighterGym(fighter, gym.id, weekValue);
    if (previousTrainer && previousTrainer.currentGymId && previousTrainer.currentGymId !== gym.id) {
      setFighterTrainer(fighter, "", weekValue);
    }
    if (typeof AmateurEcosystem !== "undefined" && AmateurEcosystem.getOrganizationForGym) {
      org = AmateurEcosystem.getOrganizationForGym(gameState, gym.id);
      if (org && org.id) {
        fighter.currentOrganizationId = org.id;
      }
    }
    syncFacilityLinks(gameState);
    return { ok: true, gym: gym, trainerReset: !!(previousTrainer && previousTrainer.currentGymId && previousTrainer.currentGymId !== gym.id), previousTrainerId: previousTrainer ? previousTrainer.id : "" };
  }

  function followTrainer(gameState, fighterId, trainerId, weekValue) {
    var fighter = getFighterById(gameState, fighterId);
    var trainer = getTrainerById(gameState, trainerId);
    var info = trainerAccessInfo(gameState, fighterId, trainerId);
    if (!fighter || !trainer || !info.ok) {
      return { ok: false, reason: info.reason || "Тренер недоступен." };
    }
    setFighterTrainer(fighter, trainer.id, weekValue);
    if (trainer.currentGymId && gymAccessInfo(gameState, fighterId, trainer.currentGymId).ok) {
      setFighterGym(fighter, trainer.currentGymId, weekValue);
    }
    syncFacilityLinks(gameState);
    return { ok: true, trainer: trainer };
  }

  function relocateCamp(gameState, fighterId, gymId, weekValue) {
    return signGym(gameState, fighterId, gymId, weekValue);
  }

  function transferToCenter(gameState, fighterId, organizationId, weekValue) {
    var fighter = getFighterById(gameState, fighterId);
    var org = typeof AmateurEcosystem !== "undefined" && AmateurEcosystem.getOrganizationById ? AmateurEcosystem.getOrganizationById(gameState, organizationId) : null;
    var moveResult;
    if (!fighter || !org) {
      return { ok: false, reason: "Центр недоступен." };
    }
    if (!org.linkedGymId) {
      return { ok: false, reason: "У центра нет тренировочной базы." };
    }
    moveResult = signGym(gameState, fighterId, org.linkedGymId, weekValue);
    if (!moveResult.ok) {
      return moveResult;
    }
    fighter.currentOrganizationId = org.id;
    syncFacilityLinks(gameState);
    return { ok: true, organization: org };
  }

  function getGymTypeLabel(gymTypeId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getFacilityGymTypeLabel ? ContentLoader.getFacilityGymTypeLabel(gymTypeId) : gymTypeId;
  }

  function getTrainerTypeLabel(trainerTypeId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getFacilityTrainerTypeLabel ? ContentLoader.getFacilityTrainerTypeLabel(trainerTypeId) : trainerTypeId;
  }

  return {
    normalizeGameStateFacilities: normalizeGameStateFacilities,
    syncFacilityLinks: syncFacilityLinks,
    getFighterById: getFighterById,
    getGymById: getGymById,
    getTrainerById: getTrainerById,
    listGymsByCountry: listGymsByCountry,
    listTrainersByCountry: listTrainersByCountry,
    listTrainersByGym: listTrainersByGym,
    gymAccessInfo: gymAccessInfo,
    trainerAccessInfo: trainerAccessInfo,
    leaveGym: leaveGym,
    signGym: signGym,
    followTrainer: followTrainer,
    relocateCamp: relocateCamp,
    transferToCenter: transferToCenter,
    getGymTypeLabel: getGymTypeLabel,
    getTrainerTypeLabel: getTrainerTypeLabel
  };
}());
