var AmateurEcosystem = (function () {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function stableId(prefix, parts) {
    if (typeof WorldSimState !== "undefined" && WorldSimState.stableId) {
      return WorldSimState.stableId(prefix, parts);
    }
    return prefix + "_" + String(parts instanceof Array ? parts.join("_") : parts);
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

  function buildDisplayName(firstName, lastName, nickname, trackId) {
    var fullName = String(firstName || "") + " " + String(lastName || "");
    var nick = trackId === "street" || trackId === "pro" ? sanitizeNicknameWord(nickname) : "";
    if (nick) {
      return String(firstName || "") + ' "' + nick + '" ' + String(lastName || "");
    }
    return fullName.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
  }

  function trainerIdsForGym(countryId, gymId) {
    var trainers = typeof ContentLoader !== "undefined" && ContentLoader.listTrainersByCountry ? ContentLoader.listTrainersByCountry(countryId) : [];
    var result = [];
    var i;
    for (i = 0; i < trainers.length; i += 1) {
      if (trainers[i] && trainers[i].currentGymId === gymId) {
        result.push(trainers[i].id);
      }
    }
    return result;
  }

  function dataRoot() {
    return typeof AMATEUR_ECOSYSTEM_DATA !== "undefined" && AMATEUR_ECOSYSTEM_DATA ? AMATEUR_ECOSYSTEM_DATA : {
      organizationTypes: [],
      trainerRoleTypes: [],
      organizationTemplates: [],
      teamTemplate: null,
      nationalTeamStatuses: [],
      amateurGoals: []
    };
  }

  function findById(list, id) {
    var i;
    if (!(list instanceof Array)) {
      return null;
    }
    for (i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].id === id) {
        return list[i];
      }
    }
    return null;
  }

  function organizationRoot(gameState) {
    if (!gameState.organizationState || typeof gameState.organizationState !== "object") {
      gameState.organizationState = {
        id: "organization_state_main",
        organizationIds: [],
        organizationsById: {},
        rankingTableIds: [],
        rankingTablesById: {},
        teamIds: [],
        teamsById: {}
      };
    }
    if (!(gameState.organizationState.organizationIds instanceof Array)) {
      gameState.organizationState.organizationIds = [];
    }
    if (!gameState.organizationState.organizationsById || typeof gameState.organizationState.organizationsById !== "object") {
      gameState.organizationState.organizationsById = {};
    }
    if (!(gameState.organizationState.rankingTableIds instanceof Array)) {
      gameState.organizationState.rankingTableIds = [];
    }
    if (!gameState.organizationState.rankingTablesById || typeof gameState.organizationState.rankingTablesById !== "object") {
      gameState.organizationState.rankingTablesById = {};
    }
    if (!(gameState.organizationState.teamIds instanceof Array)) {
      gameState.organizationState.teamIds = [];
    }
    if (!gameState.organizationState.teamsById || typeof gameState.organizationState.teamsById !== "object") {
      gameState.organizationState.teamsById = {};
    }
    return gameState.organizationState;
  }

  function competitionRoot(gameState) {
    if (!gameState.competitionState || typeof gameState.competitionState !== "object") {
      gameState.competitionState = {
        id: "competition_state_main",
        competitionIds: [],
        competitionsById: {},
        bracketIds: [],
        bracketsById: {},
        activeCompetitionId: "",
        amateurHooks: {
          seasonEligibilityByFighterId: {},
          federationPointsByFighterId: {},
          tournamentRegistrationByFighterId: {},
          teamEligibilityByFighterId: {}
        }
      };
    }
    if (!gameState.competitionState.amateurHooks || typeof gameState.competitionState.amateurHooks !== "object") {
      gameState.competitionState.amateurHooks = {
        seasonEligibilityByFighterId: {},
        federationPointsByFighterId: {},
        tournamentRegistrationByFighterId: {},
        teamEligibilityByFighterId: {}
      };
    }
    return gameState.competitionState;
  }

  function rosterRoot(gameState) {
    if (!gameState.rosterState || typeof gameState.rosterState !== "object") {
      return null;
    }
    return gameState.rosterState;
  }

  function getCountry(countryId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getCountry ? ContentLoader.getCountry(countryId) : null;
  }

  function listCountries() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listCountries ? ContentLoader.listCountries() : [];
  }

  function getGym(gymId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getGym ? ContentLoader.getGym(gymId) : null;
  }

  function listGymsByCountry(countryId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.listGymsByCountry ? ContentLoader.listGymsByCountry(countryId) : [];
  }

  function listTrainerTypesByCountry(countryId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.listTrainerTypesByCountry ? ContentLoader.listTrainerTypesByCountry(countryId) : [];
  }

  function getTrainerType(trainerTypeId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getTrainerType ? ContentLoader.getTrainerType(trainerTypeId) : null;
  }

  function getRankLabel(countryId, rankId) {
    if (typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.getLocalizedRankLabel) {
      return JuniorAmateurSystem.getLocalizedRankLabel(countryId, rankId);
    }
    return rankId || "";
  }

  function compareRanks(leftId, rightId) {
    if (typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.compareRanks) {
      return JuniorAmateurSystem.compareRanks(leftId, rightId);
    }
    return 0;
  }

  function rankOrder(rankId) {
    if (typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.getRankOrder) {
      return JuniorAmateurSystem.getRankOrder(rankId);
    }
    return 0;
  }

  function fighterStatTotal(entity) {
    var stats = entity && (entity.attributes || entity.stats) ? (entity.attributes || entity.stats) : {};
    return (stats.str || 0) + (stats.tec || 0) + (stats.spd || 0) + (stats.end || 0) + (stats.vit || 0);
  }

  function rankBand(rankId) {
    var rank = typeof ContentLoader !== "undefined" && ContentLoader.getAmateurRank ? ContentLoader.getAmateurRank(rankId) : null;
    return {
      min: rank && typeof rank.statMin === "number" ? rank.statMin : 1,
      max: rank && typeof rank.statMax === "number" ? rank.statMax : 100
    };
  }

  function rankIdFromTotal(totalValue, ageYears) {
    var total = Math.max(5, Math.round(totalValue || 5));
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

  function defaultNationalStatus() {
    return "none";
  }

  function inferRankFromEntity(entity) {
    var explicitRank = entity && (entity.amateurRank || entity.amateurClass) ? (entity.amateurRank || entity.amateurClass) : "";
    if (explicitRank && typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.canonicalRankId) {
      return JuniorAmateurSystem.canonicalRankId(explicitRank, entity && entity.age ? entity.age : 16);
    }
    return rankIdFromTotal(fighterStatTotal(entity), entity && entity.age ? entity.age : 16);
  }

  function assignDefaultGoal(entity, slotIndex) {
    var goals = dataRoot().amateurGoals || [];
    if (!(goals instanceof Array) || !goals.length) {
      return "";
    }
    return goals[Math.abs(slotIndex || 0) % goals.length];
  }

  function supportStatus(entity) {
    if (!entity || !entity.nationalTeamStatus) {
      return defaultNationalStatus();
    }
    return entity.nationalTeamStatus;
  }

  function normalizeRosterFighter(entity, slotIndex) {
    if (!entity || typeof entity !== "object") {
      return entity;
    }
    entity.currentCoachId = entity.currentCoachId || entity.currentTrainerId || entity.trainerId || "";
    entity.currentGymId = entity.currentGymId || entity.gymId || "";
    entity.currentTrainerId = entity.currentTrainerId || entity.trainerId || entity.currentCoachId || "";
    entity.gymId = entity.currentGymId || entity.gymId || "";
    entity.trainerId = entity.currentTrainerId || entity.trainerId || "";
    entity.amateurRank = inferRankFromEntity(entity);
    entity.amateurClass = entity.amateurRank;
    entity.nationalTeamStatus = supportStatus(entity);
    if (!(entity.amateurGoals instanceof Array)) {
      entity.amateurGoals = [];
    }
    if (!entity.amateurGoals.length) {
      entity.amateurGoals.push(assignDefaultGoal(entity, slotIndex));
    }
    return entity;
  }

  function generatedIdentity(countryId, slotIndex) {
    var pool = typeof ContentLoader !== "undefined" && ContentLoader.getCountryPool ? ContentLoader.getCountryPool(countryId) : null;
    var firstNames = pool && pool.firstNames instanceof Array ? pool.firstNames : ["Fighter"];
    var lastNames = pool && pool.lastNames instanceof Array ? pool.lastNames : ["One"];
    return {
      firstName: firstNames[(slotIndex * 5) % firstNames.length],
      lastName: lastNames[(slotIndex * 7 + 1) % lastNames.length],
      nickname: ""
    };
  }

  function generatedFillerAmateur(countryId, slotIndex) {
    var identity = generatedIdentity(countryId, slotIndex);
    var isJuniorSeed = slotIndex < 4 || slotIndex >= 100;
    var juniorRankPool = ["junior_class_3", "junior_class_2", "junior_class_1"];
    var adultRankPool = ["adult_class_3", "adult_class_2", "adult_class_1", "candidate_national", "national_master"];
    var age = isJuniorSeed ? (16 + (slotIndex % 2)) : (18 + ((slotIndex - 4) % 9));
    var rankId = isJuniorSeed ? juniorRankPool[slotIndex % juniorRankPool.length] : adultRankPool[slotIndex % adultRankPool.length];
    var band = rankBand(rankId);
    var gymId = countryId + "_gym_" + ((slotIndex % 5) + 1);
    var trainerPool = trainerIdsForGym(countryId, gymId);
    var trainerId = trainerPool.length ? trainerPool[slotIndex % trainerPool.length] : "";
    var normalizedSlot = slotIndex >= 100 ? 2 + (slotIndex - 100) : slotIndex;
    var spread = Math.max(0, band.max - band.min);
    var base = band.min + (normalizedSlot % (spread + 1));
    var wins = Math.max(2, rankOrder(rankId) * 2 + normalizedSlot + 2);
    var losses = Math.max(0, Math.floor(normalizedSlot / 3));
    var draws = normalizedSlot % 2;
    return {
      id: stableId("fighter_amateur_generated", [countryId, slotIndex]),
      firstName: identity.firstName,
      lastName: identity.lastName,
      nickname: "",
      name: identity.firstName + " " + identity.lastName,
      fullName: buildDisplayName(identity.firstName, identity.lastName, "", "amateur"),
      country: countryId,
      age: age,
      birthWeek: (slotIndex * 5) + 1,
      birthYear: 2026 - age,
      currentTrack: "amateur",
      trackId: "amateur",
      style: ["outboxer", "tempo", "counterpuncher", "puncher"][slotIndex % 4],
      styleId: ["outboxer", "tempo", "counterpuncher", "puncher"][slotIndex % 4],
      archetypeId: ["patient", "aggressor", "counter", "technician", "knockout"][slotIndex % 5],
      attributes: {
        str: Math.min(band.max, base + (slotIndex % 2)),
        tec: Math.min(band.max, base + ((slotIndex + 1) % 2)),
        spd: Math.min(band.max, base),
        end: Math.min(band.max, base + 1),
        vit: Math.min(band.max, base)
      },
      stats: {
        str: Math.min(band.max, base + (slotIndex % 2)),
        tec: Math.min(band.max, base + ((slotIndex + 1) % 2)),
        spd: Math.min(band.max, base),
        end: Math.min(band.max, base + 1),
        vit: Math.min(band.max, base)
      },
      growthProfile: {
        focusId: ["technique", "endurance", "power", "defense", "recovery"][slotIndex % 5],
        ceiling: 62 + slotIndex,
        volatility: 4 + (slotIndex % 3),
        nextTrack: "pro"
      },
      healthState: { health: 100, injuries: [] },
      wearState: { wear: 8 + slotIndex, fatigue: 6 + slotIndex },
      moraleState: { morale: 54 + (slotIndex % 8) },
      currentGymId: gymId,
      currentTrainerId: trainerId,
      currentCoachId: trainerId,
      currentManagerId: "",
      currentOrganizationId: "",
      gymId: gymId,
      trainerId: trainerId,
      streetRating: 28 + (slotIndex * 4),
      amateurClass: rankId,
      amateurRank: rankId,
      amateurRecord: { wins: wins, losses: losses, draws: draws },
      proRecord: { wins: 0, losses: 0, draws: 0, kos: 0 },
      proRankingData: {},
      fame: Math.max(6, Math.round(fighterStatTotal({ attributes: {
        str: Math.min(band.max, base + (slotIndex % 2)),
        tec: Math.min(band.max, base + ((slotIndex + 1) % 2)),
        spd: Math.min(band.max, base),
        end: Math.min(band.max, base + 1),
        vit: Math.min(band.max, base)
      } }) / 10)),
      reputationTags: [],
      relationshipHooks: ["amateur_depth"],
      biographyLogIds: [],
      nationalTeamStatus: "none",
      amateurGoals: [assignDefaultGoal(null, slotIndex)],
      status: "active",
      lastUpdatedWeek: 0,
      record: { wins: wins, losses: losses, draws: draws, kos: 0 },
      tags: []
    };
  }

  function ensureCountryDepth(gameState, countryId) {
    var roster = rosterRoot(gameState);
    var existing = [];
    var juniorCount = 0;
    var i;
    var fighter;
    var generated;
    var extraIndex = 100;
    if (!roster) {
      return;
    }
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      fighter = roster.fightersById[roster.fighterIds[i]];
      if (fighter && fighter.country === countryId && (fighter.currentTrack === "amateur" || fighter.trackId === "amateur")) {
        existing.push(fighter);
        if ((fighter.age || 16) <= 17) {
          juniorCount += 1;
        }
      }
    }
    for (i = existing.length; i < 9; i += 1) {
      generated = generatedFillerAmateur(countryId, i);
      roster.fighterIds.push(generated.id);
      roster.fightersById[generated.id] = generated;
      if ((generated.age || 16) <= 17) {
        juniorCount += 1;
      }
    }
    while (juniorCount < 4) {
      generated = generatedFillerAmateur(countryId, extraIndex);
      if (!roster.fightersById[generated.id]) {
        roster.fighterIds.push(generated.id);
        roster.fightersById[generated.id] = generated;
        juniorCount += 1;
      }
      extraIndex += 1;
    }
  }

  function eligibleLevelsForEntity(entity, rules, selectionScore) {
    var levels = [];
    var rankId = entity.amateurRank || inferRankFromEntity(entity);
    var points = selectionScore || 0;
    if (!entity) {
      return levels;
    }
    if (hasMedicalEligibility(entity, rules)) {
      levels.push("regional_center");
    }
    if (compareRanks(rankId, rules.minRankId || "") >= 0 && points >= (rules.minTournamentPoints || 0)) {
      levels.push("team_candidate");
    }
    if (compareRanks(rankId, rules.reserveMinRankId || rules.minRankId || "") >= 0 && points >= Math.max(rules.minTournamentPoints || 0, 140)) {
      levels.push("team_reserve");
    }
    if (compareRanks(rankId, rules.activeMinRankId || rules.reserveMinRankId || rules.minRankId || "") >= 0 && points >= Math.max(rules.minNationalRating || 0, 180)) {
      levels.push("team_active");
    }
    if (compareRanks(rankId, "national_master") >= 0 || points >= 240) {
      levels.push("olympic_center");
    }
    return levels;
  }

  function evaluateFighterForSelection(entity, currentWeek) {
    var rankId = entity.amateurRank || inferRankFromEntity(entity);
    var wins = entity.amateurRecord ? entity.amateurRecord.wins || 0 : 0;
    var losses = entity.amateurRecord ? entity.amateurRecord.losses || 0 : 0;
    var draws = entity.amateurRecord ? entity.amateurRecord.draws || 0 : 0;
    var wear = entity.wearState ? entity.wearState.wear || 0 : 0;
    var health = entity.healthState ? entity.healthState.health || 100 : 100;
    var morale = entity.moraleState ? entity.moraleState.morale || 55 : 55;
    var age = entity.age || 16;
    var weekWave = ((currentWeek || 1) + (entity.id ? entity.id.length : 0)) % 9;
    var score = (rankOrder(rankId) * 32) + (wins * 5) - (losses * 4) + (draws * 2) + (entity.fame || 0);
    score += Math.max(0, 100 - wear) * 0.18;
    score += Math.max(0, health - 60) * 0.2;
    score += Math.max(0, morale - 45) * 0.12;
    score += weekWave - 4;
    if (age >= 18 && age <= 28) {
      score += 16;
    } else if (age < 18) {
      score -= 10;
    } else if (age > 32) {
      score -= 8;
    }
    return Math.round(score);
  }

  function hasMedicalEligibility(entity, rules) {
    var wear = entity && entity.wearState ? entity.wearState.wear || 0 : 0;
    var health = entity && entity.healthState ? entity.healthState.health || 100 : 100;
    return wear <= (rules.maxWear || 72) && health >= 55;
  }

  function hasSelectionAccess(entity, rules) {
    var wins = entity && entity.amateurRecord ? entity.amateurRecord.wins || 0 : 0;
    var points = (wins * 12) + ((entity && entity.fame) || 0);
    if (!entity) {
      return false;
    }
    if ((entity.age || 16) < (rules.minAge || 18) || (entity.age || 16) > (rules.maxAge || 32)) {
      return false;
    }
    if (compareRanks(entity.amateurRank || inferRankFromEntity(entity), rules.minRankId || "") < 0) {
      return false;
    }
    if (points < (rules.minTournamentPoints || 0)) {
      return false;
    }
    if (!hasMedicalEligibility(entity, rules)) {
      return false;
    }
    return true;
  }

  function orgLabel(template, country, city) {
    return String(template.labelTemplate || "")
      .replace("{city}", city || (country ? country.city : ""))
      .replace("{country}", country ? country.name : "");
  }

  function resolveTemplateCity(template, country) {
    var gyms;
    var gym;
    var arenas;
    var index;
    if (String(template.citySource || "").indexOf("gym_") === 0) {
      index = parseInt(String(template.citySource).split("_")[1], 10);
      gyms = listGymsByCountry(country.id);
      gym = gyms[Math.max(0, (index || 1) - 1)] || gyms[0] || null;
      return gym ? gym.city : (country.city || "");
    }
    if (String(template.citySource || "").indexOf("arena_") === 0) {
      index = parseInt(String(template.citySource).split("_")[1], 10);
      arenas = country.arenas || [];
      return arenas[Math.max(0, (index || 1) - 1)] ? arenas[Math.max(0, (index || 1) - 1)].city : (country.city || "");
    }
    return country.city || "";
  }

  function coachIdsForCountry(countryId, coachRoleIds) {
    var trainerTypes = listTrainerTypesByCountry(countryId);
    var ids = [];
    var i;
    var j;
    var trainer;
    var roleId;
    for (i = 0; i < trainerTypes.length; i += 1) {
      trainer = trainerTypes[i];
      for (j = 0; j < coachRoleIds.length; j += 1) {
        roleId = coachRoleIds[j];
        if ((trainer.coachRoleId || "") === roleId) {
          ids.push(trainer.id);
          break;
        }
      }
    }
    return ids;
  }

  function buildCountryOrganizations(gameState, countryId) {
    var orgState = organizationRoot(gameState);
    var country = getCountry(countryId);
    var templates = dataRoot().organizationTemplates || [];
    var gyms = listGymsByCountry(countryId);
    var roster = rosterRoot(gameState);
    var i;
    var j;
    var template;
    var org;
    var gym;
    var fighter;
    var coachIds;
    var city;
    if (!country || !roster) {
      return;
    }
    for (i = 0; i < templates.length; i += 1) {
      template = templates[i];
      city = resolveTemplateCity(template, country);
      gym = template.linkedGymSlot ? (gyms[Math.max(0, template.linkedGymSlot - 1)] || null) : null;
      coachIds = coachIdsForCountry(countryId, template.coachRoleIds || []);
      org = {
        id: stableId("org", [countryId, template.id]),
        country: countryId,
        city: city,
        orgType: template.orgType,
        allowedAgeRange: clone(template.allowedAgeRange || { min: 16, max: 30 }),
        rankRequirements: clone(template.rankRequirements || { minRankId: "" }),
        resultRequirements: clone(template.resultRequirements || { minWins: 0, minTournamentPoints: 0 }),
        trainingFocus: clone(template.trainingFocus || []),
        rosterIds: [],
        coachIds: coachIds,
        reputation: template.reputation || 40,
        label: orgLabel(template, country, city),
        linkedGymId: gym ? gym.id : "",
        selectionWindowWeeks: template.orgType === "national_team" ? (dataRoot().teamTemplate ? dataRoot().teamTemplate.selectionWindowWeeks : 12) : 0
      };
      for (j = 0; j < roster.fighterIds.length; j += 1) {
        fighter = roster.fightersById[roster.fighterIds[j]];
        if (!fighter || fighter.country !== countryId || (fighter.currentTrack !== "amateur" && fighter.trackId !== "amateur")) {
          continue;
        }
        if (org.linkedGymId && fighter.currentGymId === org.linkedGymId) {
          org.rosterIds.push(fighter.id);
          fighter.currentOrganizationId = org.id;
        }
      }
      if (!orgState.organizationsById[org.id]) {
        orgState.organizationIds.push(org.id);
      }
      orgState.organizationsById[org.id] = org;
    }
  }

  function buildTeamEntity(gameState, countryId) {
    var orgState = organizationRoot(gameState);
    var competitionState = competitionRoot(gameState);
    var country = getCountry(countryId);
    var roster = rosterRoot(gameState);
    var template = dataRoot().teamTemplate || {};
    var currentWeek = gameState && gameState.worldState && gameState.worldState.timeline ? gameState.worldState.timeline.currentWeek || 1 : 1;
    var rules = clone(template.selectionRules || {});
    var candidates = [];
    var active = [];
    var reserve = [];
    var candidatePool = [];
    var i;
    var fighter;
    var selectionScore;
    var team;
    var coachIds = coachIdsForCountry(countryId, ["national_team_coach"]);
    if (!country || !roster) {
      return;
    }
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      fighter = roster.fightersById[roster.fighterIds[i]];
      if (!fighter || fighter.country !== countryId || (fighter.currentTrack !== "amateur" && fighter.trackId !== "amateur")) {
        continue;
      }
      normalizeRosterFighter(fighter, i);
      selectionScore = fighterStatTotal(fighter);
      competitionState.amateurHooks.federationPointsByFighterId[fighter.id] = selectionScore;
      competitionState.amateurHooks.seasonEligibilityByFighterId[fighter.id] = true;
      competitionState.amateurHooks.teamEligibilityByFighterId[fighter.id] = {
        eligible: true,
        score: selectionScore,
        levels: []
      };
      competitionState.amateurHooks.tournamentRegistrationByFighterId[fighter.id] = {
        countryId: countryId,
        currentOrganizationId: fighter.currentOrganizationId || "",
        rankId: fighter.amateurRank || inferRankFromEntity(fighter),
        allowedLevels: ["team_reserve", "team_active"]
      };
      candidates.push({ id: fighter.id, score: selectionScore, rankId: fighter.amateurRank || inferRankFromEntity(fighter) });
    }
    candidates.sort(function (left, right) {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return compareRanks(right.rankId, left.rankId);
    });
    for (i = 0; i < candidates.length; i += 1) {
      if (i < (template.rosterSlots || 4)) {
        active.push(candidates[i].id);
      } else if (reserve.length < (template.reserveSlots || 4)) {
        reserve.push(candidates[i].id);
      }
    }
    team = {
      id: stableId("team", [countryId, template.idSuffix || "national_team"]),
      countryId: countryId,
      category: template.category || "amateur_national_team",
      headCoachId: coachIds.length ? coachIds[0] : "",
      assistantCoachIds: coachIds.length > 1 ? coachIds.slice(1) : [],
      rosterSlots: template.rosterSlots || 4,
      reserveSlots: template.reserveSlots || 4,
      activeRosterIds: active,
      reserveRosterIds: reserve,
      candidateRosterIds: candidatePool,
      selectionWindow: {
        lengthWeeks: template.selectionWindowWeeks || 1,
        currentWindowIndex: Math.max(0, currentWeek - 1),
        isOpen: true
      },
      lastSelectionWeek: currentWeek,
      selectionRules: rules,
      olympicCycleStatus: template.olympicCycleStatus || "building",
      label: (country ? country.name : countryId) + " — сборная",
      federationOrgId: stableId("org", [countryId, "national_federation_main"])
    };
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      fighter = roster.fightersById[roster.fighterIds[i]];
      if (!fighter || fighter.country !== countryId || (fighter.currentTrack !== "amateur" && fighter.trackId !== "amateur")) {
        continue;
      }
      if (active.indexOf(fighter.id) !== -1) {
        fighter.nationalTeamStatus = "active";
      } else if (reserve.indexOf(fighter.id) !== -1) {
        fighter.nationalTeamStatus = "reserve";
      } else if (fighter.nationalTeamStatus === "active" || fighter.nationalTeamStatus === "reserve" || fighter.nationalTeamStatus === "candidate") {
        fighter.nationalTeamStatus = "dropped";
      } else {
        fighter.nationalTeamStatus = fighter.nationalTeamStatus || "none";
      }
      competitionState.amateurHooks.teamEligibilityByFighterId[fighter.id] = competitionState.amateurHooks.teamEligibilityByFighterId[fighter.id] || { eligible: true, score: fighterStatTotal(fighter), levels: [] };
      competitionState.amateurHooks.teamEligibilityByFighterId[fighter.id].levels = [];
      if (fighter.nationalTeamStatus === "active") {
        competitionState.amateurHooks.teamEligibilityByFighterId[fighter.id].levels.push("team_active");
        competitionState.amateurHooks.teamEligibilityByFighterId[fighter.id].levels.push("team_reserve");
      } else if (fighter.nationalTeamStatus === "reserve") {
        competitionState.amateurHooks.teamEligibilityByFighterId[fighter.id].levels.push("team_reserve");
      }
    }
    if (!orgState.teamIds || !(orgState.teamIds instanceof Array)) {
      orgState.teamIds = [];
    }
    if (!orgState.teamsById || typeof orgState.teamsById !== "object") {
      orgState.teamsById = {};
    }
    if (!orgState.teamsById[team.id]) {
      orgState.teamIds.push(team.id);
    }
    orgState.teamsById[team.id] = team;
  }

  function syncPlayerAmateurStanding(gameState) {
    var roster = rosterRoot(gameState);
    var player = roster && roster.fightersById ? roster.fightersById.fighter_player_main : null;
    var team;
    var countryId;
    var orgState;
    var i;
    if (!gameState || !gameState.player || !gameState.player.amateur || !player) {
      return gameState;
    }
    orgState = organizationRoot(gameState);
    countryId = gameState.player.profile ? gameState.player.profile.homeCountry || gameState.player.profile.currentCountry || "" : "";
    if (player.currentOrganizationId) {
      gameState.player.amateur.currentOrganizationId = player.currentOrganizationId;
    }
    gameState.player.amateur.nationalTeamStatus = player.nationalTeamStatus || "none";
    gameState.player.amateur.nationalTeamCountryId = countryId;
    gameState.player.amateur.selectionScore = competitionRoot(gameState).amateurHooks.federationPointsByFighterId[player.id] || 0;
    gameState.player.amateur.eligibleLevels = [];
    if (competitionRoot(gameState).amateurHooks.teamEligibilityByFighterId[player.id] &&
        competitionRoot(gameState).amateurHooks.teamEligibilityByFighterId[player.id].levels instanceof Array) {
      gameState.player.amateur.eligibleLevels = clone(competitionRoot(gameState).amateurHooks.teamEligibilityByFighterId[player.id].levels);
    }
    if ((player.nationalTeamStatus === "candidate" || player.nationalTeamStatus === "reserve" || player.nationalTeamStatus === "active") &&
        gameState.player.amateur.eligibleLevels.indexOf(player.nationalTeamStatus) === -1) {
      gameState.player.amateur.eligibleLevels.push(player.nationalTeamStatus);
    }
    for (i = 0; i < orgState.teamIds.length; i += 1) {
      team = orgState.teamsById[orgState.teamIds[i]];
      if (team && team.countryId === countryId) {
        gameState.player.amateur.teamId = team.id;
        break;
      }
    }
    return gameState;
  }

  function ensureOrganizations(gameState) {
    var countries = listCountries();
    var roster = rosterRoot(gameState);
    var i;
    var j;
    var fighter;
    if (!roster) {
      return gameState;
    }
    for (i = 0; i < countries.length; i += 1) {
      ensureCountryDepth(gameState, countries[i].id);
    }
    competitionRoot(gameState).amateurHooks = {
      seasonEligibilityByFighterId: {},
      federationPointsByFighterId: {},
      tournamentRegistrationByFighterId: {},
      teamEligibilityByFighterId: {}
    };
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      fighter = roster.fightersById[roster.fighterIds[i]];
      normalizeRosterFighter(fighter, i);
    }
    organizationRoot(gameState).organizationIds = [];
    organizationRoot(gameState).organizationsById = {};
    organizationRoot(gameState).teamIds = [];
    organizationRoot(gameState).teamsById = {};
    for (i = 0; i < countries.length; i += 1) {
      buildCountryOrganizations(gameState, countries[i].id);
      buildTeamEntity(gameState, countries[i].id);
    }
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      fighter = roster.fightersById[roster.fighterIds[i]];
      if (!fighter) {
        continue;
      }
      if (!fighter.currentOrganizationId && fighter.currentGymId) {
        for (j = 0; j < organizationRoot(gameState).organizationIds.length; j += 1) {
          var org = organizationRoot(gameState).organizationsById[organizationRoot(gameState).organizationIds[j]];
          if (org && org.linkedGymId === fighter.currentGymId) {
            fighter.currentOrganizationId = org.id;
            break;
          }
        }
      }
    }
    syncPlayerAmateurStanding(gameState);
    return gameState;
  }

  function getOrganizationById(gameState, organizationId) {
    var orgState = organizationRoot(gameState);
    return organizationId ? (orgState.organizationsById[organizationId] || null) : null;
  }

  function listOrganizationsByCountry(gameState, countryId) {
    var orgState = organizationRoot(gameState);
    var result = [];
    var i;
    var org;
    for (i = 0; i < orgState.organizationIds.length; i += 1) {
      org = orgState.organizationsById[orgState.organizationIds[i]];
      if (org && org.country === countryId) {
        result.push(org);
      }
    }
    return result;
  }

  function listOrganizationsByType(gameState, countryId, typeIds) {
    var ids = typeIds instanceof Array ? typeIds : [typeIds];
    var all = listOrganizationsByCountry(gameState, countryId);
    var result = [];
    var i;
    for (i = 0; i < all.length; i += 1) {
      if (ids.indexOf(all[i].orgType) !== -1) {
        result.push(all[i]);
      }
    }
    return result;
  }

  function getOrganizationForGym(gameState, gymId) {
    var orgState = organizationRoot(gameState);
    var i;
    var org;
    for (i = 0; i < orgState.organizationIds.length; i += 1) {
      org = orgState.organizationsById[orgState.organizationIds[i]];
      if (org && org.linkedGymId === gymId) {
        return org;
      }
    }
    return null;
  }

  function getNationalTeam(gameState, countryId) {
    var orgState = organizationRoot(gameState);
    var i;
    var team;
    for (i = 0; i < orgState.teamIds.length; i += 1) {
      team = orgState.teamsById[orgState.teamIds[i]];
      if (team && team.countryId === countryId) {
        return team;
      }
    }
    return null;
  }

  function getTrainerRole(roleId) {
    return clone(findById(dataRoot().trainerRoleTypes || [], roleId));
  }

  function listTrainerRoles() {
    return clone(dataRoot().trainerRoleTypes || []);
  }

  function listOrganizationTypes() {
    return clone(dataRoot().organizationTypes || []);
  }

  return {
    ensureOrganizations: ensureOrganizations,
    getOrganizationById: getOrganizationById,
    listOrganizationsByCountry: listOrganizationsByCountry,
    listOrganizationsByType: listOrganizationsByType,
    getOrganizationForGym: getOrganizationForGym,
    getNationalTeam: getNationalTeam,
    getTrainerRole: getTrainerRole,
    listTrainerRoles: listTrainerRoles,
    listOrganizationTypes: listOrganizationTypes
  };
}());
