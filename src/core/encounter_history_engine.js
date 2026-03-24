var EncounterHistoryEngine = (function () {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function stableId(prefix, parts) {
    if (typeof WorldSimState !== "undefined" && WorldSimState.stableId) {
      return WorldSimState.stableId(prefix, parts);
    }
    return prefix + "_" + String(parts instanceof Array ? parts.join("_") : parts);
  }

  function currentWeek(gameState) {
    if (gameState && gameState.worldState && gameState.worldState.timeline && typeof gameState.worldState.timeline.currentWeek === "number") {
      return gameState.worldState.timeline.currentWeek;
    }
    if (gameState && gameState.career && typeof gameState.career.week === "number") {
      return gameState.career.week;
    }
    return 1;
  }

  function dataRoot() {
    return typeof ENCOUNTER_MEMORY_DATA !== "undefined" && ENCOUNTER_MEMORY_DATA ? ENCOUNTER_MEMORY_DATA : {
      crossoverTags: [],
      events: []
    };
  }

  function listCrossoverTags() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listEncounterCrossoverTags ?
      ContentLoader.listEncounterCrossoverTags() :
      clone(dataRoot().crossoverTags || []);
  }

  function getCrossoverTag(tagId) {
    var tags;
    var i;
    if (typeof ContentLoader !== "undefined" && ContentLoader.getEncounterCrossoverTag) {
      return ContentLoader.getEncounterCrossoverTag(tagId);
    }
    tags = dataRoot().crossoverTags || [];
    for (i = 0; i < tags.length; i += 1) {
      if (tags[i] && tags[i].id === tagId) {
        return clone(tags[i]);
      }
    }
    return null;
  }

  function uniquePush(list, value) {
    var i;
    if (!(list instanceof Array) || value == null || value === "") {
      return false;
    }
    for (i = 0; i < list.length; i += 1) {
      if (list[i] === value) {
        return false;
      }
    }
    list.push(value);
    return true;
  }

  function pairIds(fighterAId, fighterBId) {
    var left = String(fighterAId || "");
    var right = String(fighterBId || "");
    if (!left || !right) {
      return { left: left, right: right };
    }
    if (left <= right) {
      return { left: left, right: right };
    }
    return { left: right, right: left };
  }

  function pairKey(fighterAId, fighterBId) {
    var pair = pairIds(fighterAId, fighterBId);
    return pair.left && pair.right ? (pair.left + "::" + pair.right) : "";
  }

  function worldCareerRoot(gameState) {
    if (!gameState.worldState || typeof gameState.worldState !== "object") {
      gameState.worldState = { id: "world_state_main", timeline: { id: "timeline_main", currentWeek: 1, currentYear: 2026 } };
    }
    if (!gameState.worldState.worldCareer || typeof gameState.worldState.worldCareer !== "object") {
      gameState.worldState.worldCareer = {
        id: "world_career_main",
        lastProcessedWeek: 0,
        lastProcessedYear: 2026,
        nextNewgenSerialByCountry: {},
        yearlyNewgenCountByCountry: {},
        teamStatusByFighterId: {},
        trackStatusByFighterId: {},
        processedTournamentIds: [],
        processedResultIds: [],
        encounterMemoryByFighterId: {},
        encounterHistoryIds: [],
        encounterHistoriesById: {},
        encounterPairIndex: {},
        pendingNotices: [],
        worldHistory: []
      };
    }
    if (!(gameState.worldState.worldCareer.encounterHistoryIds instanceof Array)) {
      gameState.worldState.worldCareer.encounterHistoryIds = [];
    }
    if (!gameState.worldState.worldCareer.encounterHistoriesById || typeof gameState.worldState.worldCareer.encounterHistoriesById !== "object") {
      gameState.worldState.worldCareer.encounterHistoriesById = {};
    }
    if (!gameState.worldState.worldCareer.encounterPairIndex || typeof gameState.worldState.worldCareer.encounterPairIndex !== "object") {
      gameState.worldState.worldCareer.encounterPairIndex = {};
    }
    if (!gameState.worldState.worldCareer.encounterMemoryByFighterId || typeof gameState.worldState.worldCareer.encounterMemoryByFighterId !== "object") {
      gameState.worldState.worldCareer.encounterMemoryByFighterId = {};
    }
    return gameState.worldState.worldCareer;
  }

  function rosterRoot(gameState) {
    return gameState && gameState.rosterState ? gameState.rosterState : null;
  }

  function getPlayerFighterId(gameState) {
    return gameState && gameState.playerState && gameState.playerState.fighterEntityId ? gameState.playerState.fighterEntityId : "fighter_player_main";
  }

  function getFighterById(gameState, fighterId) {
    if (!fighterId) {
      return null;
    }
    if (typeof PersistentFighterRegistry !== "undefined" && PersistentFighterRegistry.getFighterById) {
      return PersistentFighterRegistry.getFighterById(gameState, fighterId);
    }
    return rosterRoot(gameState) && rosterRoot(gameState).fightersById ? rosterRoot(gameState).fightersById[fighterId] || null : null;
  }

  function listRosterFighters(gameState) {
    var root = rosterRoot(gameState);
    var result = [];
    var i;
    var fighterId;
    if (!root || !(root.fighterIds instanceof Array) || !root.fightersById) {
      return result;
    }
    for (i = 0; i < root.fighterIds.length; i += 1) {
      fighterId = root.fighterIds[i];
      if (root.fightersById[fighterId] && root.fightersById[fighterId].id) {
        result.push(root.fightersById[fighterId]);
      }
    }
    return result;
  }

  function fighterTrack(fighter) {
    return fighter ? (fighter.currentTrack || fighter.trackId || "street") : "street";
  }

  function fighterHasNationalBackground(fighter) {
    var hooks = fighter && fighter.worldHistoryHooks instanceof Array ? fighter.worldHistoryHooks : [];
    var i;
    for (i = 0; i < hooks.length; i += 1) {
      if (hooks[i] === "former_national_team_member" || hooks[i] === "olympic_hopeful" || hooks[i] === "national_champion") {
        return true;
      }
    }
    return !!(fighter && fighter.nationalTeamStatus && fighter.nationalTeamStatus !== "none");
  }

  function fighterHasProPast(fighter) {
    if (!fighter) {
      return false;
    }
    return fighterTrack(fighter) === "pro" ||
      (fighter.proRecord && ((fighter.proRecord.wins || 0) + (fighter.proRecord.losses || 0) + (fighter.proRecord.draws || 0) > 0)) ||
      (fighter.titleHistory instanceof Array && fighter.titleHistory.length > 0);
  }

  function baseHistory(fighterAId, fighterBId, trackId, weekValue) {
    var pair = pairIds(fighterAId, fighterBId);
    return {
      id: stableId("encounter", [pair.left, pair.right]),
      fighterAId: pair.left,
      fighterBId: pair.right,
      firstMetTrack: trackId || "",
      firstMetWeek: typeof weekValue === "number" ? weekValue : 0,
      allFightIds: [],
      sparringIds: [],
      sharedGymIds: [],
      sharedTeamIds: [],
      rivalryLevel: 0,
      respectLevel: 0,
      lastSeenWeek: typeof weekValue === "number" ? weekValue : 0,
      trackIds: trackId ? [trackId] : [],
      tagIds: [],
      timeline: []
    };
  }

  function ensureHistoryShape(history) {
    if (!(history.allFightIds instanceof Array)) { history.allFightIds = []; }
    if (!(history.sparringIds instanceof Array)) { history.sparringIds = []; }
    if (!(history.sharedGymIds instanceof Array)) { history.sharedGymIds = []; }
    if (!(history.sharedTeamIds instanceof Array)) { history.sharedTeamIds = []; }
    if (!(history.trackIds instanceof Array)) { history.trackIds = []; }
    if (!(history.tagIds instanceof Array)) { history.tagIds = []; }
    if (!(history.timeline instanceof Array)) { history.timeline = []; }
    if (typeof history.rivalryLevel !== "number") { history.rivalryLevel = 0; }
    if (typeof history.respectLevel !== "number") { history.respectLevel = 0; }
    if (typeof history.firstMetTrack !== "string") { history.firstMetTrack = ""; }
    if (typeof history.firstMetWeek !== "number") { history.firstMetWeek = 0; }
    if (typeof history.lastSeenWeek !== "number") { history.lastSeenWeek = 0; }
    return history;
  }

  function pushTimeline(history, entry) {
    var normalized = clone(entry || {});
    if (!normalized.id) {
      return;
    }
    if (uniquePush(history.timelineIds || (history.timelineIds = []), normalized.id)) {
      history.timeline.unshift(normalized);
      if (history.timeline.length > 24) {
        history.timeline = history.timeline.slice(0, 24);
        history.timelineIds = [];
        while (history.timelineIds.length < history.timeline.length) {
          history.timelineIds.push(history.timeline[history.timelineIds.length].id);
        }
      }
    }
  }

  function ensureHistory(gameState, fighterAId, fighterBId, meta) {
    var root = worldCareerRoot(gameState);
    var key = pairKey(fighterAId, fighterBId);
    var historyId;
    var history;
    var weekValue = meta && typeof meta.week === "number" ? meta.week : currentWeek(gameState);
    var trackId = meta && meta.trackId ? meta.trackId : "";
    if (!key) {
      return null;
    }
    historyId = root.encounterPairIndex[key];
    if (!historyId) {
      history = baseHistory(fighterAId, fighterBId, trackId, weekValue);
      historyId = history.id;
      root.encounterPairIndex[key] = historyId;
      root.encounterHistoriesById[historyId] = history;
      uniquePush(root.encounterHistoryIds, historyId);
    } else {
      history = root.encounterHistoriesById[historyId];
    }
    history = ensureHistoryShape(history);
    if (!history.firstMetTrack && trackId) {
      history.firstMetTrack = trackId;
    }
    if (!history.firstMetWeek && typeof weekValue === "number") {
      history.firstMetWeek = weekValue;
    }
    if (trackId) {
      uniquePush(history.trackIds, trackId);
    }
    if (typeof weekValue === "number" && weekValue > history.lastSeenWeek) {
      history.lastSeenWeek = weekValue;
    }
    root.encounterHistoriesById[historyId] = history;
    return history;
  }

  function addTag(history, tagId) {
    if (!history || !tagId) {
      return false;
    }
    return uniquePush(history.tagIds, tagId);
  }

  function addTagFromLegacy(history, tagId) {
    if (!history || !tagId) {
      return;
    }
    if (tagId === "former_national_teammate") {
      addTag(history, "former_teammate");
      return;
    }
    if (tagId === "took_team_spot_from_player") {
      addTag(history, "lost_team_spot_to_this_boxer");
      return;
    }
    if (tagId === "met_as_junior_then_pro") {
      addTag(history, "pro_rankings_reunion");
      return;
    }
    if (tagId === "met_as_junior_then_street") {
      addTag(history, "fallen_pro_on_streets");
      return;
    }
    addTag(history, tagId);
  }

  function updateDerivedTags(gameState, history) {
    var fighterA = getFighterById(gameState, history.fighterAId);
    var fighterB = getFighterById(gameState, history.fighterBId);
    var currentTrackA = fighterTrack(fighterA);
    var currentTrackB = fighterTrack(fighterB);
    var hasProTrack = history.trackIds.indexOf("pro") !== -1 || currentTrackA === "pro" || currentTrackB === "pro";
    var hasStreetTrack = history.trackIds.indexOf("street") !== -1 || currentTrackA === "street" || currentTrackB === "street";
    var hasAmateurTrack = history.trackIds.indexOf("amateur") !== -1 || currentTrackA === "amateur" || currentTrackB === "amateur";
    if (history.firstMetTrack === "street" && (hasAmateurTrack || hasProTrack) && history.allFightIds.length) {
      addTag(history, "old_street_rival_returned");
    }
    if (history.sharedTeamIds.length) {
      addTag(history, "former_teammate");
    }
    if (history.sharedTeamIds.length && (history.rivalryLevel >= 22 || history.allFightIds.length >= 2)) {
      addTag(history, "teammate_became_rival");
    }
    if ((fighterHasNationalBackground(fighterA) || fighterHasNationalBackground(fighterB)) &&
        (history.sharedTeamIds.length || history.allFightIds.length >= 2) &&
        hasAmateurTrack) {
      addTag(history, "olympic_cycle_rival");
    }
    if (hasProTrack && history.firstMetTrack && history.firstMetTrack !== "pro" && history.allFightIds.length) {
      addTag(history, "pro_rankings_reunion");
    }
    if (hasStreetTrack && (fighterHasProPast(fighterA) || fighterHasProPast(fighterB))) {
      addTag(history, "fallen_pro_on_streets");
    }
    if (history.sparringIds.length && (history.rivalryLevel >= 16 || history.allFightIds.length)) {
      addTag(history, "old_sparring_partner_now_enemy");
    }
  }

  function getEncounterHistory(gameState, fighterAId, fighterBId) {
    var root = worldCareerRoot(gameState);
    var key = pairKey(fighterAId, fighterBId);
    var historyId = key ? root.encounterPairIndex[key] : "";
    return historyId ? ensureHistoryShape(root.encounterHistoriesById[historyId]) : null;
  }

  function listEncountersForFighter(gameState, fighterId) {
    var root = worldCareerRoot(gameState);
    var result = [];
    var i;
    var history;
    for (i = 0; i < root.encounterHistoryIds.length; i += 1) {
      history = root.encounterHistoriesById[root.encounterHistoryIds[i]];
      if (history && (history.fighterAId === fighterId || history.fighterBId === fighterId)) {
        result.push(ensureHistoryShape(history));
      }
    }
    return result;
  }

  function noteSharedGymEncounter(gameState, fighterAId, fighterBId, gymId, weekValue, trackId) {
    var history = ensureHistory(gameState, fighterAId, fighterBId, { week: weekValue, trackId: trackId });
    if (!history) {
      return null;
    }
    if (uniquePush(history.sharedGymIds, gymId || "")) {
      pushTimeline(history, {
        id: stableId("encounter_timeline", [history.id, "gym", gymId || "none"]),
        type: "shared_gym",
        week: weekValue,
        label: "Один зал",
        gymId: gymId || ""
      });
    }
    history.respectLevel = Math.max(-100, Math.min(100, history.respectLevel + 2));
    updateDerivedTags(gameState, history);
    return history;
  }

  function noteSharedTeamEncounter(gameState, fighterAId, fighterBId, teamId, weekValue) {
    var history = ensureHistory(gameState, fighterAId, fighterBId, { week: weekValue, trackId: "amateur" });
    if (!history) {
      return null;
    }
    if (uniquePush(history.sharedTeamIds, teamId || "")) {
      pushTimeline(history, {
        id: stableId("encounter_timeline", [history.id, "team", teamId || "none"]),
        type: "shared_team",
        week: weekValue,
        label: "Одна команда",
        teamId: teamId || ""
      });
    }
    history.respectLevel = Math.max(-100, Math.min(100, history.respectLevel + 4));
    updateDerivedTags(gameState, history);
    return history;
  }

  function noteSparringEncounter(gameState, fighterAId, fighterBId, details) {
    var info = details || {};
    var weekValue = typeof info.week === "number" ? info.week : currentWeek(gameState);
    var history = ensureHistory(gameState, fighterAId, fighterBId, { week: weekValue, trackId: info.trackId || "" });
    var entryId;
    if (!history) {
      return null;
    }
    entryId = info.sparringId || stableId("sparring", [history.id, weekValue, history.sparringIds.length + 1]);
    uniquePush(history.sparringIds, entryId);
    if (info.gymId) {
      uniquePush(history.sharedGymIds, info.gymId);
    }
    history.respectLevel = Math.max(-100, Math.min(100, history.respectLevel + 5));
    if (info.rivalryHook) {
      history.rivalryLevel = Math.max(-100, Math.min(100, history.rivalryLevel + 6));
    }
    pushTimeline(history, {
      id: stableId("encounter_timeline", [history.id, "spar", entryId]),
      type: "sparring",
      week: weekValue,
      trackId: info.trackId || fighterTrack(getFighterById(gameState, fighterAId)),
      label: "Спарринг",
      gymId: info.gymId || "",
      rivalryHook: !!info.rivalryHook
    });
    updateDerivedTags(gameState, history);
    return history;
  }

  function noteFightEncounter(gameState, fighterAId, fighterBId, details) {
    var info = details || {};
    var weekValue = typeof info.week === "number" ? info.week : currentWeek(gameState);
    var history = ensureHistory(gameState, fighterAId, fighterBId, { week: weekValue, trackId: info.trackId || "" });
    var fightId;
    if (!history) {
      return null;
    }
    fightId = info.fightId || stableId("fight_history", [history.id, weekValue, history.allFightIds.length + 1]);
    uniquePush(history.allFightIds, fightId);
    if (info.gymId) {
      uniquePush(history.sharedGymIds, info.gymId);
    }
    if (info.teamId) {
      uniquePush(history.sharedTeamIds, info.teamId);
    }
    history.rivalryLevel = Math.max(-100, Math.min(100, history.rivalryLevel + (typeof info.rivalryDelta === "number" ? info.rivalryDelta : 10)));
    history.respectLevel = Math.max(-100, Math.min(100, history.respectLevel + (typeof info.respectDelta === "number" ? info.respectDelta : 5)));
    pushTimeline(history, {
      id: stableId("encounter_timeline", [history.id, "fight", fightId]),
      type: "fight",
      week: weekValue,
      trackId: info.trackId || "",
      label: info.label || "Бой",
      result: info.result || "",
      method: info.method || ""
    });
    updateDerivedTags(gameState, history);
    return history;
  }

  function historyIndicators(history) {
    var indicators = [];
    var i;
    var tag;
    if (!history) {
      return indicators;
    }
    for (i = 0; i < history.tagIds.length; i += 1) {
      tag = getCrossoverTag(history.tagIds[i]);
      if (tag && tag.label) {
        indicators.push(tag.label);
      }
    }
    if (history.allFightIds.length) {
      indicators.push("Бои: " + history.allFightIds.length);
    }
    if (history.sparringIds.length) {
      indicators.push("Спарринги: " + history.sparringIds.length);
    }
    if (history.sharedGymIds.length) {
      indicators.push("Общий зал");
    }
    if (history.sharedTeamIds.length) {
      indicators.push("Общая команда");
    }
    return indicators.slice(0, 4);
  }

  function historySummary(history) {
    var parts = [];
    if (!history) {
      return "";
    }
    if (history.allFightIds.length) {
      parts.push("Боев между вами: " + history.allFightIds.length);
    }
    if (history.sparringIds.length) {
      parts.push("Спаррингов: " + history.sparringIds.length);
    }
    if (history.sharedGymIds.length) {
      parts.push("Были в одном зале");
    }
    if (history.sharedTeamIds.length) {
      parts.push("Были в одной команде");
    }
    return parts.join(". ");
  }

  function rivalryTimeline(history) {
    var result = [];
    var i;
    var entry;
    if (!history || !(history.timeline instanceof Array)) {
      return result;
    }
    for (i = 0; i < history.timeline.length && result.length < 4; i += 1) {
      entry = history.timeline[i];
      if (!entry || !entry.label) {
        continue;
      }
      if (entry.type === "fight") {
        result.push("Неделя " + entry.week + ": " + entry.label + (entry.method ? " — " + entry.method : ""));
      } else if (entry.type === "sparring") {
        result.push("Неделя " + entry.week + ": Спарринг");
      } else if (entry.type === "shared_team") {
        result.push("Неделя " + entry.week + ": Общая команда");
      } else if (entry.type === "shared_gym") {
        result.push("Неделя " + entry.week + ": Один зал");
      }
    }
    return result;
  }

  function encounterIntro(history) {
    var i;
    var tag;
    if (!history) {
      return "";
    }
    for (i = 0; i < history.tagIds.length; i += 1) {
      tag = getCrossoverTag(history.tagIds[i]);
      if (tag && tag.introText) {
        return tag.introText;
      }
    }
    if (history.allFightIds.length) {
      return "Вы уже знаете друг друга не по одному бою.";
    }
    if (history.sparringIds.length) {
      return "Вы уже работали друг против друга в зале.";
    }
    return "";
  }

  function encounterWeightBonus(history) {
    var total = 0;
    var i;
    var tag;
    if (!history) {
      return 0;
    }
    total += history.allFightIds.length * 4;
    total += history.sparringIds.length * 2;
    total += history.sharedGymIds.length * 2;
    total += history.sharedTeamIds.length * 4;
    total += Math.max(0, history.rivalryLevel);
    total += Math.max(0, Math.round(history.respectLevel * 0.2));
    for (i = 0; i < history.tagIds.length; i += 1) {
      tag = getCrossoverTag(history.tagIds[i]);
      total += tag && typeof tag.offerWeight === "number" ? tag.offerWeight : 0;
    }
    return total;
  }

  function annotateOffer(gameState, offer, playerFighterId) {
    var playerId = playerFighterId || getPlayerFighterId(gameState);
    var fighterId = offer && (offer.fighterId || (offer.opponent ? offer.opponent.fighterId || "" : "")) ? (offer.fighterId || offer.opponent.fighterId) : "";
    var history = fighterId ? getEncounterHistory(gameState, playerId, fighterId) : null;
    if (!offer) {
      return offer;
    }
    if (!history) {
      offer.encounterHistoryId = "";
      offer.encounterTags = [];
      offer.sharedPastIndicators = [];
      offer.encounterSummary = "";
      offer.rivalryTimeline = [];
      offer.encounterWeightBonus = 0;
      offer.encounterIntro = "";
      offer.knownOpponent = false;
      return offer;
    }
    offer.encounterHistoryId = history.id;
    offer.encounterTags = clone(history.tagIds || []);
    offer.sharedPastIndicators = historyIndicators(history);
    offer.encounterSummary = historySummary(history);
    offer.rivalryTimeline = rivalryTimeline(history);
    offer.encounterWeightBonus = encounterWeightBonus(history);
    offer.encounterIntro = encounterIntro(history);
    offer.knownOpponent = true;
    return offer;
  }

  function listPlayerKnownOpponentOffers(gameState) {
    var offers = gameState && gameState.world && gameState.world.offers && gameState.world.offers.fightOffers instanceof Array ? gameState.world.offers.fightOffers : [];
    var playerId = getPlayerFighterId(gameState);
    var result = [];
    var i;
    var offer;
    for (i = 0; i < offers.length; i += 1) {
      offer = clone(offers[i]);
      annotateOffer(gameState, offer, playerId);
      if (offer.knownOpponent) {
        result.push(offer);
      }
    }
    return result;
  }

  function buildPlayerEncounterContext(gameState) {
    var offers = listPlayerKnownOpponentOffers(gameState);
    var tagIds = [];
    var recent = [];
    var i;
    var j;
    for (i = 0; i < offers.length; i += 1) {
      for (j = 0; j < offers[i].encounterTags.length; j += 1) {
        uniquePush(tagIds, offers[i].encounterTags[j]);
      }
      if (offers[i].encounterSummary) {
        recent.push(offers[i].encounterSummary);
      }
    }
    return {
      knownOpponentOffers: offers,
      knownOpponentOfferCount: offers.length,
      sharedPastOfferCount: offers.length,
      encounterTags: tagIds,
      recentEncounterSummaries: recent.slice(0, 3)
    };
  }

  function groupBy(list, keyFn) {
    var groups = {};
    var i;
    var key;
    for (i = 0; i < list.length; i += 1) {
      key = keyFn(list[i]);
      if (!key) {
        continue;
      }
      if (!(groups[key] instanceof Array)) {
        groups[key] = [];
      }
      groups[key].push(list[i]);
    }
    return groups;
  }

  function syncWorldLinks(gameState, options) {
    var fighters = listRosterFighters(gameState);
    var weekValue = options && typeof options.week === "number" ? options.week : currentWeek(gameState);
    var gymGroups = groupBy(fighters, function (fighter) {
      return fighter && fighter.status !== "retired" ? (fighter.currentGymId || fighter.gymId || "") : "";
    });
    var teamGroups = groupBy(fighters, function (fighter) {
      if (!fighter || fighter.status === "retired") {
        return "";
      }
      return fighter.currentOrganizationId && String(fighter.currentOrganizationId).indexOf("team_") === 0 ? fighter.currentOrganizationId : "";
    });
    var key;
    var group;
    var i;
    var j;
    for (key in gymGroups) {
      if (!gymGroups.hasOwnProperty(key)) {
        continue;
      }
      group = gymGroups[key];
      for (i = 0; i < group.length; i += 1) {
        for (j = i + 1; j < group.length; j += 1) {
          noteSharedGymEncounter(gameState, group[i].id, group[j].id, key, weekValue, fighterTrack(group[i]));
        }
      }
    }
    for (key in teamGroups) {
      if (!teamGroups.hasOwnProperty(key)) {
        continue;
      }
      group = teamGroups[key];
      for (i = 0; i < group.length; i += 1) {
        for (j = i + 1; j < group.length; j += 1) {
          noteSharedTeamEncounter(gameState, group[i].id, group[j].id, key, weekValue);
        }
      }
    }
  }

  function migrateLegacyData(gameState) {
    var root = worldCareerRoot(gameState);
    var playerId = getPlayerFighterId(gameState);
    var rivalries = gameState && gameState.world && gameState.world.rivalries instanceof Array ? gameState.world.rivalries : [];
    var prep = gameState && gameState.player ? gameState.player.preparation || {} : {};
    var memoryMap = root.encounterMemoryByFighterId || {};
    var key;
    var history;
    var rivalry;
    var i;
    var count;
    if (root.encounterHistoryIds.length) {
      return;
    }
    for (i = 0; i < rivalries.length; i += 1) {
      rivalry = rivalries[i];
      if (!rivalry || !rivalry.opponentFighterId) {
        continue;
      }
      history = ensureHistory(gameState, playerId, rivalry.opponentFighterId, { week: rivalry.lastWeek || currentWeek(gameState), trackId: rivalry.countryKey ? "" : "" });
      if (!history) {
        continue;
      }
      history.rivalryLevel = Math.max(history.rivalryLevel, (rivalry.tension || 0) + (rivalry.fightsCount || 0) * 4);
      history.respectLevel = Math.max(history.respectLevel, Math.round(((rivalry.playerWins || 0) + (rivalry.opponentWins || 0) + (rivalry.draws || 0)) * 3));
      count = rivalry.fightsCount || 0;
      while (history.allFightIds.length < count) {
        uniquePush(history.allFightIds, stableId("migrated_fight", [history.id, history.allFightIds.length + 1]));
      }
      updateDerivedTags(gameState, history);
    }
    if (prep.partnerHistoryByFighterId && typeof prep.partnerHistoryByFighterId === "object") {
      for (key in prep.partnerHistoryByFighterId) {
        if (!prep.partnerHistoryByFighterId.hasOwnProperty(key)) {
          continue;
        }
        history = ensureHistory(gameState, playerId, key, { week: prep.partnerHistoryByFighterId[key].lastWeek || currentWeek(gameState), trackId: "" });
        if (!history) {
          continue;
        }
        count = prep.partnerHistoryByFighterId[key].sessions || 0;
        while (history.sparringIds.length < count) {
          uniquePush(history.sparringIds, stableId("migrated_sparring", [history.id, history.sparringIds.length + 1]));
        }
        if (prep.partnerHistoryByFighterId[key].rivalryHook) {
          history.rivalryLevel = Math.max(history.rivalryLevel, 18);
          addTag(history, "old_sparring_partner_now_enemy");
        }
        updateDerivedTags(gameState, history);
      }
    }
    for (key in memoryMap) {
      if (!memoryMap.hasOwnProperty(key) || key === playerId) {
        continue;
      }
      history = ensureHistory(gameState, playerId, key, { week: memoryMap[key].lastSeenWeek || currentWeek(gameState), trackId: "" });
      if (!history) {
        continue;
      }
      if (memoryMap[key].tags instanceof Array) {
        for (i = 0; i < memoryMap[key].tags.length; i += 1) {
          addTagFromLegacy(history, memoryMap[key].tags[i]);
        }
      }
      history.lastSeenWeek = Math.max(history.lastSeenWeek, memoryMap[key].lastSeenWeek || 0);
      updateDerivedTags(gameState, history);
    }
  }

  function ensureState(gameState) {
    var root = worldCareerRoot(gameState);
    var i;
    var historyId;
    var history;
    root.encounterHistoryIds = root.encounterHistoryIds instanceof Array ? root.encounterHistoryIds : [];
    root.encounterHistoriesById = root.encounterHistoriesById && typeof root.encounterHistoriesById === "object" ? root.encounterHistoriesById : {};
    root.encounterPairIndex = root.encounterPairIndex && typeof root.encounterPairIndex === "object" ? root.encounterPairIndex : {};
    for (i = 0; i < root.encounterHistoryIds.length; i += 1) {
      historyId = root.encounterHistoryIds[i];
      history = root.encounterHistoriesById[historyId];
      if (!history) {
        continue;
      }
      ensureHistoryShape(history);
      root.encounterPairIndex[pairKey(history.fighterAId, history.fighterBId)] = historyId;
      updateDerivedTags(gameState, history);
    }
    migrateLegacyData(gameState);
    return gameState;
  }

  return {
    ensureState: ensureState,
    getEncounterHistory: getEncounterHistory,
    listEncountersForFighter: listEncountersForFighter,
    noteFightEncounter: noteFightEncounter,
    noteSparringEncounter: noteSparringEncounter,
    noteSharedGymEncounter: noteSharedGymEncounter,
    noteSharedTeamEncounter: noteSharedTeamEncounter,
    syncWorldLinks: syncWorldLinks,
    annotateOffer: annotateOffer,
    buildPlayerEncounterContext: buildPlayerEncounterContext,
    historySummary: historySummary,
    rivalryTimeline: rivalryTimeline
  };
}());
