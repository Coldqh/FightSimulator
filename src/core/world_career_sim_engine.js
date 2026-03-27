var WorldCareerSimEngine = (function () {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function stableId(prefix, parts) {
    if (typeof WorldSimState !== "undefined" && WorldSimState.stableId) {
      return WorldSimState.stableId(prefix, parts);
    }
    return prefix + "_" + String(parts instanceof Array ? parts.join("_") : parts);
  }

  function clamp(value, minValue, maxValue) {
    return Math.max(minValue, Math.min(maxValue, value));
  }

  function sanitizeNicknameWord(value) {
    var label = String(value || "").replace(/["']/g, " ").replace(/[.,!?;:]+/g, " ").replace(/^\s+|\s+$/g, "");
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

  function buildDisplayName(firstName, lastName, nickname, trackId) {
    var fullName = String(firstName || "") + " " + String(lastName || "");
    var nick = trackAllowsNickname(trackId) ? sanitizeNicknameWord(nickname) : "";
    if (nick) {
      return String(firstName || "") + ' "' + nick + '" ' + String(lastName || "");
    }
    return fullName.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
  }

  function dataRoot() {
    return typeof WORLD_CAREER_SIM_DATA !== "undefined" && WORLD_CAREER_SIM_DATA ? WORLD_CAREER_SIM_DATA : {
      goalProfiles: [],
      transitionRules: {},
      worldHistoryHooks: [],
      encounterTags: []
    };
  }

  function listGoalProfiles() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listWorldGoalProfiles ? ContentLoader.listWorldGoalProfiles() : clone(dataRoot().goalProfiles || []);
  }

  function getGoalProfile(goalProfileId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getWorldGoalProfile ? ContentLoader.getWorldGoalProfile(goalProfileId) : null;
  }

  function transitionRules() {
    return typeof ContentLoader !== "undefined" && ContentLoader.getWorldTransitionRules ? ContentLoader.getWorldTransitionRules() : clone(dataRoot().transitionRules || {});
  }

  function rosterRoot(gameState) {
    return gameState && gameState.rosterState ? gameState.rosterState : null;
  }

  function worldRoot(gameState) {
    if (!gameState.worldState || typeof gameState.worldState !== "object") {
      gameState.worldState = { id: "world_state_main", timeline: { id: "timeline_main", currentWeek: 1, currentYear: 2026 } };
    }
    return gameState.worldState;
  }

  function worldCareerRoot(gameState) {
    var root = worldRoot(gameState);
    if (!root.worldCareer || typeof root.worldCareer !== "object") {
      root.worldCareer = {
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
    if (!root.worldCareer.nextNewgenSerialByCountry || typeof root.worldCareer.nextNewgenSerialByCountry !== "object") { root.worldCareer.nextNewgenSerialByCountry = {}; }
    if (!root.worldCareer.yearlyNewgenCountByCountry || typeof root.worldCareer.yearlyNewgenCountByCountry !== "object") { root.worldCareer.yearlyNewgenCountByCountry = {}; }
    if (!root.worldCareer.teamStatusByFighterId || typeof root.worldCareer.teamStatusByFighterId !== "object") { root.worldCareer.teamStatusByFighterId = {}; }
    if (!root.worldCareer.trackStatusByFighterId || typeof root.worldCareer.trackStatusByFighterId !== "object") { root.worldCareer.trackStatusByFighterId = {}; }
    if (!(root.worldCareer.processedTournamentIds instanceof Array)) { root.worldCareer.processedTournamentIds = []; }
    if (!(root.worldCareer.processedResultIds instanceof Array)) { root.worldCareer.processedResultIds = []; }
    if (!root.worldCareer.encounterMemoryByFighterId || typeof root.worldCareer.encounterMemoryByFighterId !== "object") { root.worldCareer.encounterMemoryByFighterId = {}; }
    if (!(root.worldCareer.encounterHistoryIds instanceof Array)) { root.worldCareer.encounterHistoryIds = []; }
    if (!root.worldCareer.encounterHistoriesById || typeof root.worldCareer.encounterHistoriesById !== "object") { root.worldCareer.encounterHistoriesById = {}; }
    if (!root.worldCareer.encounterPairIndex || typeof root.worldCareer.encounterPairIndex !== "object") { root.worldCareer.encounterPairIndex = {}; }
    if (!(root.worldCareer.pendingNotices instanceof Array)) { root.worldCareer.pendingNotices = []; }
    if (!(root.worldCareer.worldHistory instanceof Array)) { root.worldCareer.worldHistory = []; }
    if (typeof root.worldCareer.lastProcessedWeek !== "number") { root.worldCareer.lastProcessedWeek = 0; }
    if (typeof root.worldCareer.lastProcessedYear !== "number") { root.worldCareer.lastProcessedYear = 2026; }
    return root.worldCareer;
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

  function currentYear(gameState) {
    if (gameState && gameState.worldState && gameState.worldState.timeline && typeof gameState.worldState.timeline.currentYear === "number") {
      return gameState.worldState.timeline.currentYear;
    }
    if (gameState && gameState.career && gameState.career.calendar && typeof TimeSystem !== "undefined" && TimeSystem.getCalendarView) {
      return TimeSystem.getCalendarView(gameState.career.calendar).year;
    }
    return 2026;
  }

  function listCountries() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listCountries ? ContentLoader.listCountries() : [];
  }

  function listGymsByCountry(gameState, countryId, trackId) {
    if (typeof WorldFacilityEngine !== "undefined" && WorldFacilityEngine.listGymsByCountry) {
      return WorldFacilityEngine.listGymsByCountry(gameState, countryId, { trackId: trackId || "street" });
    }
    return typeof ContentLoader !== "undefined" && ContentLoader.listGymsByCountry ? ContentLoader.listGymsByCountry(countryId) : [];
  }

  function listTrainerTypesByCountry(gameState, countryId, trackId) {
    if (typeof WorldFacilityEngine !== "undefined" && WorldFacilityEngine.listTrainersByCountry) {
      return WorldFacilityEngine.listTrainersByCountry(gameState, countryId, { trackId: trackId || "street" });
    }
    return typeof ContentLoader !== "undefined" && ContentLoader.listTrainerTypesByCountry ? ContentLoader.listTrainerTypesByCountry(countryId) : [];
  }

  function listTrainersByGym(gameState, gymId, trackId) {
    if (typeof WorldFacilityEngine !== "undefined" && WorldFacilityEngine.listTrainersByGym) {
      return WorldFacilityEngine.listTrainersByGym(gameState, gymId, { trackId: trackId || "street" });
    }
    return [];
  }

  function getCountryPool(countryId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getCountryPool ? ContentLoader.getCountryPool(countryId) : null;
  }

  function fighterTrack(fighter) {
    return fighter ? (fighter.currentTrack || fighter.trackId || "street") : "street";
  }

  function playerEntityId(gameState) {
    return gameState && gameState.playerState ? gameState.playerState.fighterEntityId || "fighter_player_main" : "fighter_player_main";
  }

  function playerEntity(gameState) {
    var roster = rosterRoot(gameState);
    var fighterId = playerEntityId(gameState);
    return roster && roster.fightersById ? roster.fightersById[fighterId] || null : null;
  }

  function compareRanks(leftId, rightId) {
    if (typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.compareRanks) {
      return JuniorAmateurSystem.compareRanks(leftId || "", rightId || "");
    }
    return 0;
  }

  function defaultRankForAge(ageYears) {
    if (typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.defaultRankForAge) {
      return JuniorAmateurSystem.defaultRankForAge(ageYears);
    }
    return ageYears <= 17 ? "junior_novice" : "adult_class_3";
  }

  function uniquePush(list, value) {
    var i;
    if (!(list instanceof Array) || !value) { return; }
    for (i = 0; i < list.length; i += 1) {
      if (list[i] === value) { return; }
    }
    list.push(value);
  }

  function fighterTotal(fighter) {
    var stats = fighter && (fighter.attributes || fighter.stats) ? (fighter.attributes || fighter.stats) : {};
    return (stats.str || 0) + (stats.tec || 0) + (stats.spd || 0) + (stats.end || 0) + (stats.vit || 0);
  }

  function fighterAgeFromBirth(fighter, yearValue, weekValue) {
    var age = typeof fighter.age === "number" ? fighter.age : 16;
    if (typeof fighter.birthYear !== "number") { fighter.birthYear = yearValue - age; }
    if (typeof fighter.birthWeek !== "number") { fighter.birthWeek = 1; }
    age = yearValue - fighter.birthYear;
    if (weekValue < fighter.birthWeek) { age -= 1; }
    return Math.max(14, age);
  }

  function styleFromGoalProfile(goalProfileId) {
    if (goalProfileId === "street_talent" || goalProfileId === "pro_chaser") { return "puncher"; }
    if (goalProfileId === "national_team_climber") { return "outboxer"; }
    if (goalProfileId === "reserve_team_boxer") { return "counterpuncher"; }
    if (goalProfileId === "burnout_case" || goalProfileId === "late_starter") { return "tempo"; }
    return "outboxer";
  }

  function archetypeFromStyle(styleId) {
    if (styleId === "puncher") { return "knockout"; }
    if (styleId === "counterpuncher") { return "counter"; }
    if (styleId === "tempo") { return "aggressor"; }
    return "technician";
  }

  function listRosterFighters(gameState) {
    var roster = rosterRoot(gameState);
    var result = [];
    var i;
    var fighter;
    if (!roster || !(roster.fighterIds instanceof Array)) { return result; }
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      fighter = roster.fightersById[roster.fighterIds[i]];
      if (fighter && fighter.id) { result.push(fighter); }
    }
    return result;
  }

  function deterministicSeed(value) {
    var text = String(value || "");
    var total = 0;
    var i;
    for (i = 0; i < text.length; i += 1) {
      total += text.charCodeAt(i) * (i + 3);
    }
    return total;
  }

  function deterministicIndex(value, length) {
    if (!length || length <= 0) { return 0; }
    return Math.abs(deterministicSeed(value)) % length;
  }

  function seasonRoot(gameState) {
    return gameState && gameState.competitionState ? gameState.competitionState.amateurSeason || null : null;
  }

  function seasonStatsFor(gameState, fighterId) {
    var seasonState = seasonRoot(gameState);
    if (!seasonState || !seasonState.fighterSeasonStatsById) { return null; }
    return seasonState.fighterSeasonStatsById[fighterId] || null;
  }

  function getNationalRankingScore(gameState, fighter) {
    var seasonState = seasonRoot(gameState);
    var countryRatings;
    var i;
    if (!seasonState || !seasonState.nationalRankingByCountry || !fighter || !fighter.country) { return 0; }
    countryRatings = seasonState.nationalRankingByCountry[fighter.country] || [];
    for (i = 0; i < countryRatings.length; i += 1) {
      if (countryRatings[i] && countryRatings[i].fighterId === fighter.id) {
        return countryRatings[i].score || 0;
      }
    }
    return 0;
  }

  function findGoalProfileId(fighter) {
    if (!fighter) { return "late_starter"; }
    if (fighter.goalProfileId && getGoalProfile(fighter.goalProfileId)) { return fighter.goalProfileId; }
    if ((fighter.nationalTeamStatus || "") === "active" || (fighter.nationalTeamStatus || "") === "candidate") { return "national_team_climber"; }
    if ((fighter.nationalTeamStatus || "") === "reserve") { return "reserve_team_boxer"; }
    if (fighterTrack(fighter) === "street") { return fighter.age <= 20 ? "street_talent" : "late_starter"; }
    if (fighterTrack(fighter) === "pro") { return "pro_chaser"; }
    if ((fighter.age || 16) <= 17) { return "youth_prospect"; }
    if ((fighter.wearState && fighter.wearState.wear >= transitionRules().burnoutWearThreshold) || (fighter.moraleState && fighter.moraleState.morale <= transitionRules().burnoutMoraleThreshold)) { return "burnout_case"; }
    if (compareRanks(fighter.amateurRank || "", "candidate_national") >= 0) { return "amateur_medal_hunter"; }
    return "late_starter";
  }

  function ensureEncounterMemory(root, fighterId) {
    if (!root.encounterMemoryByFighterId[fighterId] || typeof root.encounterMemoryByFighterId[fighterId] !== "object") {
      root.encounterMemoryByFighterId[fighterId] = { fighterId: fighterId, firstSeenWeek: 0, lastSeenWeek: 0, lastTrackId: "", lastTeamStatus: "none", tags: [], notes: [] };
    }
    if (!(root.encounterMemoryByFighterId[fighterId].tags instanceof Array)) { root.encounterMemoryByFighterId[fighterId].tags = []; }
    if (!(root.encounterMemoryByFighterId[fighterId].notes instanceof Array)) { root.encounterMemoryByFighterId[fighterId].notes = []; }
    return root.encounterMemoryByFighterId[fighterId];
  }

  function pushNotice(root, notice) {
    if (!notice || !notice.text) { return; }
    root.pendingNotices.push(clone(notice));
    if (root.pendingNotices.length > 48) {
      root.pendingNotices = root.pendingNotices.slice(root.pendingNotices.length - 48);
    }
  }

  function pushWorldHistory(root, entry) {
    if (!entry || !entry.id) { return; }
    root.worldHistory.unshift(clone(entry));
    if (root.worldHistory.length > 160) {
      root.worldHistory = root.worldHistory.slice(0, 160);
    }
  }

  function hasHistoryHook(fighter, hookId) {
    var i;
    var list = fighter && fighter.worldHistoryHooks instanceof Array ? fighter.worldHistoryHooks : [];
    for (i = 0; i < list.length; i += 1) {
      if (list[i] === hookId) { return true; }
    }
    return false;
  }

  function addHistoryHook(fighter, hookId) {
    if (!fighter || !hookId || hasHistoryHook(fighter, hookId)) { return; }
    if (!(fighter.worldHistoryHooks instanceof Array)) { fighter.worldHistoryHooks = []; }
    fighter.worldHistoryHooks.push(hookId);
  }

  function noteEncounter(root, fighter, tagId, weekValue) {
    var memory;
    if (!fighter || !tagId) { return; }
    memory = ensureEncounterMemory(root, fighter.id);
    if (!memory.firstSeenWeek) { memory.firstSeenWeek = weekValue; }
    memory.lastSeenWeek = weekValue;
    uniquePush(memory.tags, tagId);
    if (!(fighter.encounterHooks instanceof Array)) { fighter.encounterHooks = []; }
    uniquePush(fighter.encounterHooks, tagId);
  }

  function latestSeasonPoints(gameState, fighter) {
    var stats = fighter ? seasonStatsFor(gameState, fighter.id) : null;
    if (!stats) { return 0; }
    return (stats.seasonPoints || 0) + (stats.federationPoints || 0) + ((stats.medals.gold || 0) * 20) + ((stats.medals.silver || 0) * 12) + ((stats.medals.bronze || 0) * 7);
  }

  function buildRankInput(fighter, gameState) {
    var styleMaturity = Math.max(0, Math.round(fighterTotal(fighter) * 3 + (fighter.fame || 0) + latestSeasonPoints(gameState, fighter) * 0.25));
    return {
      styleMaturity: styleMaturity,
      gymEligible: !!fighter.currentGymId,
      trainerEligible: !!(fighter.currentCoachId || fighter.currentTrainerId),
      disciplineEligible: !fighter.goalProfileId || fighter.goalProfileId !== "burnout_case",
      medicalEligible: (fighter.healthState ? fighter.healthState.health || 100 : 100) >= 55 && (fighter.wearState ? fighter.wearState.wear || 0 : 0) <= 82
    };
  }

  function ensureFighterLifecycle(fighter, gameState, weekValue, yearValue) {
    var evaluation;
    if (!fighter || !fighter.id) { return; }
    fighter.age = fighterAgeFromBirth(fighter, yearValue, weekValue);
    fighter.currentTrack = fighter.currentTrack || fighter.trackId || "street";
    fighter.trackId = fighter.currentTrack;
    fighter.amateurRank = fighter.amateurRank || fighter.amateurClass || defaultRankForAge(fighter.age);
    fighter.amateurClass = fighter.amateurRank || fighter.amateurClass || defaultRankForAge(fighter.age);
    fighter.currentGymId = fighter.currentGymId || fighter.gymId || "";
    fighter.currentTrainerId = fighter.currentTrainerId || fighter.trainerId || fighter.currentCoachId || "";
    fighter.currentCoachId = fighter.currentCoachId || fighter.currentTrainerId || "";
    fighter.gymId = fighter.currentGymId || fighter.gymId || "";
    fighter.trainerId = fighter.currentTrainerId || fighter.trainerId || "";
    fighter.healthState = fighter.healthState || { health: 100, injuries: [] };
    fighter.wearState = fighter.wearState || { wear: 0, fatigue: 0 };
    fighter.moraleState = fighter.moraleState || { morale: 55 };
    if (!(fighter.reputationTags instanceof Array)) { fighter.reputationTags = []; }
    if (!(fighter.relationshipHooks instanceof Array)) { fighter.relationshipHooks = []; }
    if (!(fighter.biographyLogIds instanceof Array)) { fighter.biographyLogIds = []; }
    if (!(fighter.amateurGoals instanceof Array)) { fighter.amateurGoals = []; }
    if (!(fighter.worldHistoryHooks instanceof Array)) { fighter.worldHistoryHooks = []; }
    if (!(fighter.encounterHooks instanceof Array)) { fighter.encounterHooks = []; }
    if (typeof fighter.lastTrackTransitionWeek !== "number") { fighter.lastTrackTransitionWeek = 0; }
    if (typeof fighter.lastTeamStatusChangeWeek !== "number") { fighter.lastTeamStatusChangeWeek = 0; }
    if (typeof fighter.lastGymChangeWeek !== "number") { fighter.lastGymChangeWeek = 0; }
    if (typeof fighter.lastCoachChangeWeek !== "number") { fighter.lastCoachChangeWeek = 0; }
    fighter.goalProfileId = findGoalProfileId(fighter);
    fighter.styleId = fighter.styleId || fighter.style || styleFromGoalProfile(fighter.goalProfileId);
    fighter.style = fighter.style || fighter.styleId;
    fighter.archetypeId = fighter.archetypeId || archetypeFromStyle(fighter.styleId);
    if (fighterTrack(fighter) === "amateur" && typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.evaluateRank) {
      evaluation = JuniorAmateurSystem.evaluateRank({
        rankId: fighter.amateurRank,
        score: latestSeasonPoints(gameState, fighter),
        tournamentPoints: latestSeasonPoints(gameState, fighter),
        opponentQuality: getNationalRankingScore(gameState, fighter),
        record: fighter.amateurRecord || { wins: 0, losses: 0, draws: 0 }
      }, fighter.age, buildRankInput(fighter, gameState));
      if (evaluation && evaluation.rankId) {
        fighter.amateurRank = evaluation.rankId;
        fighter.amateurClass = evaluation.rankId;
      }
    }
  }

  function driftConditions(fighter, weekValue) {
    var goal = getGoalProfile(fighter.goalProfileId) || {};
    var wave = ((deterministicSeed(fighter.id) + weekValue) % 5) - 2;
    var burnout = goal.burnoutRisk || 1;
    var currentTrackId = fighterTrack(fighter);
    fighter.wearState.wear = clamp((fighter.wearState.wear || 0) + Math.max(0, burnout - 1) + (currentTrackId === "street" ? 1 : 0) + (fighter.nationalTeamStatus === "active" ? 1 : 0) + (wave > 0 ? 1 : 0) - 1, 0, 100);
    fighter.wearState.fatigue = clamp((fighter.wearState.fatigue || 0) + burnout + (fighter.nationalTeamStatus === "active" ? 1 : 0) + wave - 1, 0, 100);
    fighter.moraleState.morale = clamp((fighter.moraleState.morale || 55) + (goal.developmentRate || 2) - burnout - (wave < 0 ? 1 : 0), 20, 90);
    fighter.healthState.health = clamp((fighter.healthState.health || 100) - (fighter.wearState.wear >= 78 ? 1 : 0) - (fighter.wearState.fatigue >= 80 ? 1 : 0) + (fighter.moraleState.morale >= 65 ? 1 : 0), 45, 100);
  }

  function applyDevelopmentTick(fighter, weekValue) {
    var goal = getGoalProfile(fighter.goalProfileId) || {};
    var devRate = goal.developmentRate || 1;
    var pulse = 7 - clamp(devRate, 1, 5);
    var stats;
    var order;
    var targetKey;
    if (((weekValue + deterministicSeed(fighter.id)) % Math.max(2, pulse)) !== 0) {
      return;
    }
    stats = fighter.attributes || fighter.stats;
    if (!stats) {
      return;
    }
    if (fighter.styleId === "puncher") {
      order = ["str", "end", "vit", "tec", "spd"];
    } else if (fighter.styleId === "counterpuncher") {
      order = ["tec", "spd", "end", "vit", "str"];
    } else if (fighter.styleId === "tempo") {
      order = ["end", "spd", "vit", "tec", "str"];
    } else {
      order = ["tec", "spd", "end", "vit", "str"];
    }
    targetKey = order[deterministicIndex(fighter.id + "_" + weekValue, order.length)];
    stats[targetKey] = clamp((stats[targetKey] || 1) + 1, 1, 40 + (goal.developmentRate || 1) * 8);
    fighter.stats = clone(stats);
  }

  function eligibleItemByRank(list, rankId) {
    var result = [];
    var i;
    var entry;
    for (i = 0; i < list.length; i += 1) {
      entry = list[i];
      if (!entry) {
        continue;
      }
      if (!entry.minRankId || compareRanks(rankId || "", entry.minRankId || "") >= 0) {
        result.push(entry);
      }
    }
    return result;
  }

  function maybeTransferGym(fighter, weekValue, gameState) {
    var rules = transitionRules();
    var goal = getGoalProfile(fighter.goalProfileId) || {};
    var gyms = eligibleItemByRank(listGymsByCountry(gameState, fighter.country, fighterTrack(fighter)), fighter.amateurRank);
    var ambition = goal.gymAmbition || 1;
    var targetIndex;
    var target;
    if (!gyms.length) {
      fighter.currentGymId = "";
      fighter.gymId = "";
      return;
    }
    if (!fighter.currentGymId) {
      targetIndex = clamp(Math.floor((fighterTotal(fighter) + (fighter.fame || 0) + ambition * 12) / 40), 0, gyms.length - 1);
      target = gyms[targetIndex];
      fighter.currentGymId = target.id;
      fighter.gymId = target.id;
      fighter.lastGymChangeWeek = weekValue;
      return;
    }
    if (weekValue - (fighter.lastGymChangeWeek || 0) < (rules.gymMoveCooldownWeeks || 10)) {
      return;
    }
    targetIndex = clamp(Math.floor((fighterTotal(fighter) + latestSeasonPoints(gameState, fighter) + ambition * 10) / 55), 0, gyms.length - 1);
    target = gyms[targetIndex];
    if (target && target.id !== fighter.currentGymId && deterministicIndex(fighter.id + "_gym_" + weekValue, 100) < ambition * 8) {
      fighter.currentGymId = target.id;
      fighter.gymId = target.id;
      fighter.lastGymChangeWeek = weekValue;
    }
  }

  function maybeTransferCoach(fighter, weekValue, gameState) {
    var rules = transitionRules();
    var goal = getGoalProfile(fighter.goalProfileId) || {};
    var trainers = eligibleItemByRank(fighter.currentGymId ? listTrainersByGym(gameState, fighter.currentGymId, fighterTrack(fighter)) : listTrainerTypesByCountry(gameState, fighter.country, fighterTrack(fighter)), fighter.amateurRank);
    var loyalty = goal.coachLoyalty || 1;
    var targetIndex;
    var target;
    var shouldFollow;
    if (!trainers.length) {
      fighter.currentTrainerId = "";
      fighter.currentCoachId = "";
      fighter.trainerId = "";
      return;
    }
    if (!fighter.currentTrainerId) {
      targetIndex = clamp(Math.floor((fighterTotal(fighter) + loyalty * 14) / 45), 0, trainers.length - 1);
      target = trainers[targetIndex];
      fighter.currentTrainerId = target.id;
      fighter.currentCoachId = target.id;
      fighter.trainerId = target.id;
      fighter.lastCoachChangeWeek = weekValue;
      return;
    }
    if (weekValue - (fighter.lastCoachChangeWeek || 0) < (rules.coachMoveCooldownWeeks || 6)) {
      return;
    }
    targetIndex = clamp(Math.floor((fighterTotal(fighter) + latestSeasonPoints(gameState, fighter) + loyalty * 10) / 58), 0, trainers.length - 1);
    target = trainers[targetIndex];
    if (target && target.id !== fighter.currentTrainerId && deterministicIndex(fighter.id + "_coach_" + weekValue, 100) < Math.max(5, 30 - loyalty * 4)) {
      fighter.currentTrainerId = target.id;
      fighter.currentCoachId = target.id;
      fighter.trainerId = target.id;
      fighter.lastCoachChangeWeek = weekValue;
      shouldFollow = target.currentGymId && deterministicIndex(fighter.id + "_follow_" + weekValue, 100) < clamp(20 + (loyalty * 12), 15, 85);
      if (shouldFollow) {
        fighter.currentGymId = target.currentGymId;
        fighter.gymId = target.currentGymId;
        fighter.lastGymChangeWeek = weekValue;
      }
    }
  }

  function updateOrganizationLink(gameState, fighter) {
    var org;
    if (!fighter || !fighter.currentGymId || typeof AmateurEcosystem === "undefined" || !AmateurEcosystem.getOrganizationForGym) {
      return;
    }
    org = AmateurEcosystem.getOrganizationForGym(gameState, fighter.currentGymId);
    if (org && org.id) {
      fighter.currentOrganizationId = org.id;
    }
  }

  function transitionTrack(fighter, nextTrackId, weekValue, root, reasonText, hookId) {
    if (!fighter || !nextTrackId || fighterTrack(fighter) === nextTrackId) {
      return false;
    }
    fighter.currentTrack = nextTrackId;
    fighter.trackId = nextTrackId;
    fighter.lastTrackTransitionWeek = weekValue;
    fighter.lastUpdatedWeek = weekValue;
    if (hookId) {
      addHistoryHook(fighter, hookId);
    }
    pushWorldHistory(root, {
      id: stableId("world_track_move", [fighter.id, nextTrackId, weekValue]),
      fighterId: fighter.id,
      week: weekValue,
      type: "track_transition",
      trackId: nextTrackId,
      text: reasonText || ""
    });
    return true;
  }

  function maybeChangeTrack(gameState, fighter, weekValue, root) {
    var rules = transitionRules();
    var currentTrackId = fighterTrack(fighter);
    var goal = getGoalProfile(fighter.goalProfileId) || {};
    var rankId = fighter.amateurRank || defaultRankForAge(fighter.age || 16);
    var total = fighterTotal(fighter);
    var progressScore = latestSeasonPoints(gameState, fighter) + getNationalRankingScore(gameState, fighter) + (fighter.fame || 0) + total;
    var badScore = (fighter.wearState ? fighter.wearState.wear || 0 : 0) + (100 - (fighter.healthState ? fighter.healthState.health || 100 : 100)) + (60 - (fighter.moraleState ? fighter.moraleState.morale || 55 : 55));
    var npcTransition = null;
    if (weekValue - (fighter.lastTrackTransitionWeek || 0) < (rules.trackMoveCooldownWeeks || 8)) {
      return;
    }
    if (typeof CareerTransitionEngine !== "undefined" && CareerTransitionEngine.chooseNpcTransition) {
      npcTransition = CareerTransitionEngine.chooseNpcTransition(gameState, fighter, weekValue);
      if (npcTransition && npcTransition.toTrackId) {
        transitionTrack(fighter, npcTransition.toTrackId, weekValue, root, (fighter.fullName || fighter.name) + " меняет путь карьеры.", npcTransition.toTrackId === "street" ? "left_amateur_path_for_streets" : "");
        if (npcTransition.toTrackId === "street" && compareRanks(rankId, "adult_class_1") >= 0) {
          addHistoryHook(fighter, "failed_prospect");
        }
        if (npcTransition.toTrackId === "pro") {
          fighter.nationalTeamStatus = "alumni";
        }
        return;
      }
    }
    if (currentTrackId === "amateur" &&
        fighter.age >= (rules.proTransitionMinAge || 19) &&
        compareRanks(rankId, rules.proTransitionMinRankId || "adult_class_1") >= 0 &&
        progressScore >= (goal.proTransitionScore || 360)) {
      transitionTrack(fighter, "pro", weekValue, root, (fighter.fullName || fighter.name) + " уходит в профи.", "");
      fighter.nationalTeamStatus = "alumni";
      return;
    }
    if (currentTrackId === "street" &&
        fighter.age <= 23 &&
        compareRanks(rankId, "adult_class_3") >= 0 &&
        fighter.currentGymId &&
        progressScore >= 135) {
      transitionTrack(fighter, "amateur", weekValue, root, (fighter.fullName || fighter.name) + " возвращается в любители.", "");
      return;
    }
    if (currentTrackId === "amateur" &&
        fighter.age >= (rules.streetFallbackMinAge || 17) &&
        ((fighter.wearState && fighter.wearState.wear >= (rules.burnoutWearThreshold || 72)) ||
         (fighter.moraleState && fighter.moraleState.morale <= (rules.burnoutMoraleThreshold || 34)) ||
         progressScore <= (goal.streetFallbackScore || 130) ||
         badScore >= 95)) {
      transitionTrack(fighter, "street", weekValue, root, (fighter.fullName || fighter.name) + " выпадает из любительской дороги и уходит в уличные бои.", "left_amateur_path_for_streets");
      if (compareRanks(rankId, "adult_class_1") >= 0) {
        addHistoryHook(fighter, "failed_prospect");
      }
    }
  }

  function maybeFlagOlympicHopeful(fighter) {
    if (!fighter) {
      return;
    }
    if (fighter.age <= (transitionRules().nationalTeamHopefulMaxAge || 24) &&
        ((fighter.nationalTeamStatus === "active" || fighter.nationalTeamStatus === "reserve") || compareRanks(fighter.amateurRank || "", "candidate_national") >= 0)) {
      addHistoryHook(fighter, "olympic_hopeful");
    }
  }

  function normalizeNpcFighter(gameState, fighter, weekValue, yearValue, root) {
    if (!fighter || fighter.isPlayer || fighter.status === "retired") {
      return;
    }
    ensureFighterLifecycle(fighter, gameState, weekValue, yearValue);
    driftConditions(fighter, weekValue);
    applyDevelopmentTick(fighter, weekValue);
    maybeTransferGym(fighter, weekValue, gameState);
    maybeTransferCoach(fighter, weekValue, gameState);
    updateOrganizationLink(gameState, fighter);
    maybeChangeTrack(gameState, fighter, weekValue, root);
    fighter.lastUpdatedWeek = weekValue;
  }

  function pickWeightedGoalId(seedText) {
    var profiles = listGoalProfiles();
    var totalWeight = 0;
    var i;
    var cursor;
    var weight;
    if (!profiles.length) {
      return "youth_prospect";
    }
    for (i = 0; i < profiles.length; i += 1) {
      totalWeight += profiles[i].newgenWeight || 1;
    }
    cursor = deterministicIndex(seedText, totalWeight);
    for (i = 0; i < profiles.length; i += 1) {
      weight = profiles[i].newgenWeight || 1;
      if (cursor < weight) {
        return profiles[i].id;
      }
      cursor -= weight;
    }
    return profiles[0].id;
  }

  function buildNewgenIdentity(countryId, serial) {
    var pool = getCountryPool(countryId) || {};
    var firstNames = pool.firstNames instanceof Array && pool.firstNames.length ? pool.firstNames : ["Young"];
    var lastNames = pool.lastNames instanceof Array && pool.lastNames.length ? pool.lastNames : ["Fighter"];
    var nicknames = pool.nicknames instanceof Array && pool.nicknames.length ? pool.nicknames : ["Kid"];
    return {
      firstName: firstNames[deterministicIndex(countryId + "_f_" + serial, firstNames.length)],
      lastName: lastNames[deterministicIndex(countryId + "_l_" + serial, lastNames.length)],
      nickname: sanitizeNicknameWord(nicknames[deterministicIndex(countryId + "_n_" + serial, nicknames.length)])
    };
  }

  function createNewgenFighter(gameState, countryId, serial, weekValue, yearValue) {
    var goalId = pickWeightedGoalId(countryId + "_" + serial + "_" + weekValue);
    var goal = getGoalProfile(goalId) || {};
    var identity = buildNewgenIdentity(countryId, serial);
    var age = 14 + deterministicIndex(countryId + "_age_" + serial + "_" + weekValue, 4);
    var currentTrackId = (goal.trackBias && goal.trackBias.street > goal.trackBias.amateur) ? "street" : "amateur";
    var gyms = listGymsByCountry(gameState, countryId, currentTrackId);
    var gymId = gyms.length ? gyms[deterministicIndex(countryId + "_gym_new_" + serial, gyms.length)].id : "";
    var trainers = gymId ? listTrainersByGym(gameState, gymId, currentTrackId) : [];
    var trainerId = trainers.length ? trainers[deterministicIndex(countryId + "_trainer_new_" + serial, trainers.length)].id : "";
    var styleId = styleFromGoalProfile(goalId);
    var base = 2 + deterministicIndex(countryId + "_base_" + serial + "_" + weekValue, 4);
    return {
      id: stableId("fighter_newgen", [countryId, yearValue, serial]),
      firstName: identity.firstName,
      lastName: identity.lastName,
      nickname: trackAllowsNickname(currentTrackId) ? identity.nickname : "",
      name: identity.firstName + " " + identity.lastName,
      fullName: buildDisplayName(identity.firstName, identity.lastName, identity.nickname, currentTrackId),
      country: countryId,
      age: age,
      birthWeek: ((weekValue + serial) % 52) + 1,
      birthYear: yearValue - age,
      currentTrack: currentTrackId,
      trackId: currentTrackId,
      style: styleId,
      styleId: styleId,
      archetypeId: archetypeFromStyle(styleId),
      attributes: { str: base, tec: base + 1, spd: base, end: base + 1, vit: base },
      stats: { str: base, tec: base + 1, spd: base, end: base + 1, vit: base },
      growthProfile: {
        focusId: styleId === "puncher" ? "power" : (styleId === "counterpuncher" ? "defense" : "technique"),
        ceiling: 58 + (goal.developmentRate || 1) * 4,
        volatility: 3 + (goal.burnoutRisk || 1),
        nextTrack: currentTrackId === "street" ? "street" : "pro"
      },
      healthState: { health: 100, injuries: [] },
      wearState: { wear: 4 + deterministicIndex(countryId + "_wear_" + serial, 6), fatigue: 3 + deterministicIndex(countryId + "_fatigue_" + serial, 5) },
      moraleState: { morale: 52 + deterministicIndex(countryId + "_morale_" + serial, 14) },
      currentGymId: gymId,
      currentTrainerId: trainerId,
      currentCoachId: trainerId,
      currentManagerId: "",
      currentOrganizationId: "",
      gymId: gymId,
      trainerId: trainerId,
      streetRating: currentTrackId === "street" ? 30 + deterministicIndex(countryId + "_street_" + serial, 20) : 0,
      amateurClass: defaultRankForAge(age),
      amateurRank: defaultRankForAge(age),
      amateurRecord: { wins: 0, losses: 0, draws: 0 },
      nationalTeamStatus: "none",
      amateurGoals: [],
      proRecord: { wins: 0, losses: 0, draws: 0, kos: 0 },
      proRankingData: {},
      fame: deterministicIndex(countryId + "_fame_" + serial, 8),
      reputationTags: [],
      relationshipHooks: ["new_generation"],
      biographyLogIds: [],
      status: "active",
      lastUpdatedWeek: weekValue,
      record: { wins: 0, losses: 0, draws: 0, kos: 0 },
      tags: [],
      goalProfileId: goalId,
      worldHistoryHooks: [],
      encounterHooks: [],
      lastTrackTransitionWeek: 0,
      lastTeamStatusChangeWeek: 0,
      lastGymChangeWeek: 0,
      lastCoachChangeWeek: 0
    };
  }

  function spawnNewgens(gameState, weekValue, yearValue, root) {
    var rules = transitionRules();
    var countries = listCountries();
    var roster = rosterRoot(gameState);
    var countryCount = Math.min(rules.newgenCountriesPerTick || 2, countries.length);
    var i;
    var country;
    var serial;
    var fighter;
    if (!roster || !countries.length || weekValue % Math.max(1, rules.newgenIntervalWeeks || 8) !== 0) {
      return;
    }
    if (root.lastProcessedYear !== yearValue) {
      root.yearlyNewgenCountByCountry = {};
    }
    for (i = 0; i < countryCount; i += 1) {
      country = countries[(deterministicIndex("country_cycle_" + yearValue + "_" + weekValue, countries.length) + i) % countries.length];
      if (!country || !country.id) {
        continue;
      }
      if ((root.yearlyNewgenCountByCountry[country.id] || 0) >= (rules.maxCountryNewgensPerYear || 6)) {
        continue;
      }
      serial = (root.nextNewgenSerialByCountry[country.id] || 0) + 1;
      root.nextNewgenSerialByCountry[country.id] = serial;
      root.yearlyNewgenCountByCountry[country.id] = (root.yearlyNewgenCountByCountry[country.id] || 0) + 1;
      fighter = createNewgenFighter(gameState, country.id, serial, weekValue, yearValue);
      if (!roster.fightersById[fighter.id]) {
        roster.fighterIds.push(fighter.id);
        roster.fightersById[fighter.id] = fighter;
      }
    }
  }

  function processSeasonHistory(gameState, root) {
    var seasonState = seasonRoot(gameState);
    var i;
    var entry;
    var tournament;
    var winner;
    var loser;
    if (!seasonState || !(seasonState.resultHistory instanceof Array)) {
      return;
    }
    for (i = 0; i < seasonState.resultHistory.length; i += 1) {
      entry = seasonState.resultHistory[i];
      if (!entry || !entry.id) {
        continue;
      }
      if (root.processedResultIds.indexOf(entry.id) !== -1) {
        continue;
      }
      root.processedResultIds.push(entry.id);
      tournament = seasonState.tournamentsById ? seasonState.tournamentsById[entry.tournamentId] : null;
      winner = rosterRoot(gameState) && rosterRoot(gameState).fightersById ? rosterRoot(gameState).fightersById[entry.winnerId] || null : null;
      loser = rosterRoot(gameState) && rosterRoot(gameState).fightersById ? rosterRoot(gameState).fightersById[entry.loserId] || null : null;
      if (winner && loser && typeof EncounterHistoryEngine !== "undefined" && EncounterHistoryEngine.noteFightEncounter) {
        EncounterHistoryEngine.noteFightEncounter(gameState, winner.id, loser.id, {
          week: entry.week || currentWeek(gameState),
          trackId: "amateur",
          fightId: entry.id,
          label: tournament && tournament.label ? tournament.label : "Турнирный бой",
          result: "resolved",
          method: entry.method || ""
        });
      }
      if (winner && tournament) {
        if (tournament.tournamentTypeId === "national_championship") {
          addHistoryHook(winner, "national_champion");
        }
        if (tournament.tournamentTypeId === "world_championship" || tournament.tournamentTypeId === "olympics") {
          addHistoryHook(winner, "olympic_hopeful");
        }
      }
    }
  }

  function syncTeamStatusChanges(gameState, root, weekValue, fighters) {
    var fighterList = fighters instanceof Array ? fighters : listRosterFighters(gameState);
    var player = playerEntity(gameState);
    var playerPrevious = player ? (root.teamStatusByFighterId[player.id] || "none") : "none";
    var promoted = [];
    var i;
    var fighter;
    var previous;
    var current;
    for (i = 0; i < fighterList.length; i += 1) {
      fighter = fighterList[i];
      previous = root.teamStatusByFighterId[fighter.id] || "none";
      current = fighter.nationalTeamStatus || "none";
      if (previous !== current) {
        fighter.lastTeamStatusChangeWeek = weekValue;
        if ((previous === "active" || previous === "reserve" || previous === "candidate") && (current === "dropped" || current === "none")) {
          addHistoryHook(fighter, "dropped_from_national_team");
          addHistoryHook(fighter, "former_national_team_member");
        }
        if (current === "active" || current === "reserve") {
          promoted.push(fighter.id);
        }
      }
      root.teamStatusByFighterId[fighter.id] = current;
    }
    if (player && (playerPrevious === "active" || playerPrevious === "reserve") && (player.nationalTeamStatus === "dropped" || player.nationalTeamStatus === "none")) {
      for (i = 0; i < promoted.length; i += 1) {
        fighter = rosterRoot(gameState).fightersById[promoted[i]];
        if (fighter && fighter.id !== player.id && fighter.country === player.country) {
          noteEncounter(root, fighter, "took_team_spot_from_player", weekValue);
          pushNotice(root, {
            tone: "bad",
            text: fighter.fullName + " занял место в составе раньше тебя.",
            biography: "Другой боксёр занимает место игрока в составе.",
            media: { type: "event", payload: { eventTitle: "Место в составе ушло другому бойцу", tags: ["national_team_drop"] } }
          });
          break;
        }
      }
    }
  }

  function syncTrackChanges(gameState, root, weekValue, fighters) {
    var fighterList = fighters instanceof Array ? fighters : listRosterFighters(gameState);
    var i;
    var fighter;
    var previous;
    var current;
    var memory;
    for (i = 0; i < fighterList.length; i += 1) {
      fighter = fighterList[i];
      previous = root.trackStatusByFighterId[fighter.id] || fighterTrack(fighter);
      current = fighterTrack(fighter);
      if (previous !== current) {
        memory = ensureEncounterMemory(root, fighter.id);
        if (previous === "amateur" && current === "pro" && memory.tags.length) {
          noteEncounter(root, fighter, "met_as_junior_then_pro", weekValue);
        }
        if (previous === "amateur" && current === "street" && memory.tags.length) {
          noteEncounter(root, fighter, "met_as_junior_then_street", weekValue);
        }
      }
      root.trackStatusByFighterId[fighter.id] = current;
    }
  }

  function syncPlayerEncounterMemory(gameState, root, weekValue, fighters) {
    var player = playerEntity(gameState);
    var fighterList = fighters instanceof Array ? fighters : listRosterFighters(gameState);
    var i;
    var fighter;
    if (!player) {
      return;
    }
    for (i = 0; i < fighterList.length; i += 1) {
      fighter = fighterList[i];
      if (!fighter || fighter.id === player.id) {
        continue;
      }
      if (fighter.country === player.country && player.age <= 18 && fighter.age <= 18 && fighterTrack(fighter) === "amateur") {
        noteEncounter(root, fighter, "shared_junior_path", weekValue);
      }
      if ((player.nationalTeamStatus === "active" || player.nationalTeamStatus === "reserve") &&
          (fighter.nationalTeamStatus === "active" || fighter.nationalTeamStatus === "reserve") &&
          fighter.country === player.country) {
        noteEncounter(root, fighter, "former_national_teammate", weekValue);
      }
    }
  }

  function emitRelevantWorldNotices(gameState, root, weekValue, fighters) {
    var player = playerEntity(gameState);
    var fighterList = fighters instanceof Array ? fighters : listRosterFighters(gameState);
    var i;
    var fighter;
    var memory;
    var countryInfo;
    if (!player) {
      return;
    }
    for (i = 0; i < fighterList.length; i += 1) {
      fighter = fighterList[i];
      if (!fighter || fighter.id === player.id) {
        continue;
      }
      memory = ensureEncounterMemory(root, fighter.id);
      countryInfo = typeof ContentLoader !== "undefined" && ContentLoader.getCountry ? ContentLoader.getCountry(fighter.country) : null;
      if (fighter.country === player.country && fighter.nationalTeamStatus === "active" && fighter.lastTeamStatusChangeWeek === weekValue) {
        pushNotice(root, {
          tone: "warn",
          text: fighter.fullName + " попал в основной состав сборной " + (countryInfo && countryInfo.name ? countryInfo.name : fighter.country) + ".",
          biography: fighter.fullName + " попадает в основной состав сборной.",
          media: { type: "event", payload: { eventTitle: "Вызов в сборную", tags: ["national_team_callup"] } }
        });
      } else if (fighter.country === player.country && fighter.nationalTeamStatus === "dropped" && fighter.lastTeamStatusChangeWeek === weekValue) {
        pushNotice(root, {
          tone: "bad",
          text: fighter.fullName + " вылетел из состава сборной.",
          biography: fighter.fullName + " вылетает из состава сборной.",
          media: { type: "event", payload: { eventTitle: "Исключение из сборной", tags: ["national_team_drop"] } }
        });
      }
      if (memory.tags.length && fighter.lastTrackTransitionWeek === weekValue) {
        if (fighterTrack(fighter) === "pro") {
          pushNotice(root, { tone: "warn", text: fighter.fullName + " ушёл из любителей в профи.", biography: fighter.fullName + " уходит из любителей в профи." });
        } else if (fighterTrack(fighter) === "street") {
          pushNotice(root, { tone: "bad", text: fighter.fullName + " свернул с любительской дороги и ушёл в уличные бои.", biography: fighter.fullName + " уходит из любителей на улицу." });
        }
      }
    }
  }

  function ensureState(gameState, fighters) {
    var root = worldCareerRoot(gameState);
    var fighterList = fighters instanceof Array ? fighters : listRosterFighters(gameState);
    var weekValue = currentWeek(gameState);
    var yearValue = currentYear(gameState);
    var i;
    for (i = 0; i < fighterList.length; i += 1) {
      ensureFighterLifecycle(fighterList[i], gameState, weekValue, yearValue);
      root.teamStatusByFighterId[fighterList[i].id] = fighterList[i].nationalTeamStatus || "none";
      root.trackStatusByFighterId[fighterList[i].id] = fighterTrack(fighterList[i]);
      ensureEncounterMemory(root, fighterList[i].id);
    }
    if (typeof EncounterHistoryEngine !== "undefined" && EncounterHistoryEngine.ensureState) {
      EncounterHistoryEngine.ensureState(gameState);
    }
    if (typeof root.lastProcessedYear !== "number") { root.lastProcessedYear = yearValue; }
    return gameState;
  }

  function runWeeklyPass(gameState, options) {
    var opts = options || {};
    var weekValue = typeof opts.absoluteWeek === "number" ? opts.absoluteWeek : currentWeek(gameState);
    var yearValue = currentYear(gameState);
    var root;
    var fighters;
    var i;
    var fighter;
    if (!gameState) {
      return null;
    }
    fighters = listRosterFighters(gameState);
    ensureState(gameState, fighters);
    root = worldCareerRoot(gameState);
    if (root.lastProcessedWeek >= weekValue) {
      return root;
    }
    for (i = 0; i < fighters.length; i += 1) {
      fighter = fighters[i];
      normalizeNpcFighter(gameState, fighter, weekValue, yearValue, root);
    }
    spawnNewgens(gameState, weekValue, yearValue, root);
    if (typeof AmateurEcosystem !== "undefined" && AmateurEcosystem.ensureOrganizations) {
      AmateurEcosystem.ensureOrganizations(gameState);
    }
    if (typeof AmateurSeasonEngine !== "undefined" && AmateurSeasonEngine.ensureState) {
      AmateurSeasonEngine.ensureState(gameState);
    }
    if (typeof StreetCareerEngine !== "undefined" && StreetCareerEngine.runWeeklyPass) {
      StreetCareerEngine.runWeeklyPass(gameState, { absoluteWeek: weekValue, action: opts.action || "" });
    }
    if (typeof ProCareerEngine !== "undefined" && ProCareerEngine.runWeeklyPass) {
      ProCareerEngine.runWeeklyPass(gameState, { absoluteWeek: weekValue, action: opts.action || "" });
    }
    fighters = listRosterFighters(gameState);
    for (i = 0; i < fighters.length; i += 1) {
      fighter = fighters[i];
      if (!fighter) {
        continue;
      }
      ensureFighterLifecycle(fighter, gameState, weekValue, yearValue);
      maybeFlagOlympicHopeful(fighter);
    }
    processSeasonHistory(gameState, root);
    syncTeamStatusChanges(gameState, root, weekValue, fighters);
    syncTrackChanges(gameState, root, weekValue, fighters);
    syncPlayerEncounterMemory(gameState, root, weekValue, fighters);
    if (typeof EncounterHistoryEngine !== "undefined" && EncounterHistoryEngine.syncWorldLinks) {
      EncounterHistoryEngine.syncWorldLinks(gameState, { week: weekValue });
    }
    emitRelevantWorldNotices(gameState, root, weekValue, fighters);
    root.lastProcessedWeek = weekValue;
    root.lastProcessedYear = yearValue;
    return root;
  }

  function drainNotices(gameState) {
    var root = worldCareerRoot(gameState);
    var notices = clone(root.pendingNotices || []);
    root.pendingNotices = [];
    return notices;
  }

  return {
    ensureState: ensureState,
    runWeeklyPass: runWeeklyPass,
    drainNotices: drainNotices
  };
}());
