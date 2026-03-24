var ProCareerEngine = (function () {
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

  function currentWeek(gameState) {
    if (gameState && gameState.career && typeof gameState.career.week === "number") {
      return gameState.career.week;
    }
    if (gameState && gameState.worldState && gameState.worldState.timeline && typeof gameState.worldState.timeline.currentWeek === "number") {
      return gameState.worldState.timeline.currentWeek;
    }
    return 1;
  }

  function dataRoot() {
    return typeof PRO_CAREER_DATA !== "undefined" && PRO_CAREER_DATA ? PRO_CAREER_DATA : {
      contenderStatuses: [],
      reputationTags: [],
      promoterTemplates: [],
      managerTemplates: [],
      offerTemplates: [],
      explanationTexts: {},
      transitionRules: {}
    };
  }

  function rankingRules() {
    if (typeof ContentLoader !== "undefined" && ContentLoader.getProRankingRules) {
      return ContentLoader.getProRankingRules();
    }
    return {
      rankingSize: 15,
      contenderCount: 10,
      weeklyNpcFightCount: 4,
      rankingWinBoost: 9,
      rankingLossPenalty: 7,
      rankingDrawBoost: 2,
      titleWinBoost: 18,
      titleLossPenalty: 10,
      titleDefenseBoost: 5,
      vacantAfterInactiveWeeks: 20,
      maxTitleHistory: 40,
      playerRankingBuffer: 3
    };
  }

  function listTitleOrganizations() {
    if (typeof ContentLoader !== "undefined" && ContentLoader.listProOrganizations) {
      return clone(ContentLoader.listProOrganizations() || []);
    }
    return [];
  }

  function getTitleOrganizationTemplate(orgId) {
    if (typeof ContentLoader !== "undefined" && ContentLoader.getProOrganization) {
      return clone(ContentLoader.getProOrganization(orgId) || null);
    }
    return null;
  }

  function listCountries() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listCountries ? ContentLoader.listCountries() : [];
  }

  function getCountry(countryId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getCountry ? ContentLoader.getCountry(countryId) : null;
  }

  function compareRanks(leftId, rightId) {
    if (typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.compareRanks) {
      return JuniorAmateurSystem.compareRanks(leftId || "", rightId || "");
    }
    return 0;
  }

  function ageYears(gameState) {
    if (typeof TimeSystem !== "undefined" && TimeSystem.getAgeView) {
      return TimeSystem.getAgeView(
        gameState && gameState.player && gameState.player.conditions ? gameState.player.conditions.startingAge : 16,
        gameState && gameState.career ? gameState.career.calendar : null
      ).years;
    }
    return gameState && gameState.player && gameState.player.conditions ? gameState.player.conditions.startingAge || 16 : 16;
  }

  function currentTrack(gameState) {
    return gameState && gameState.playerState ? gameState.playerState.currentTrackId || "street" : "street";
  }

  function baseRecord() {
    return {
      wins: 0,
      losses: 0,
      draws: 0,
      kos: 0
    };
  }

  function createProState() {
    return {
      id: "player_pro_main",
      currentStageId: "unsigned",
      proRecord: baseRecord(),
      currentPromoterId: "",
      currentManagerId: "",
      contenderStatus: "unsigned",
      titleHistory: [],
      rankingSeed: 0,
      proValue: 0,
      organizationRanks: {},
      championOrganizations: [],
      proReputationTags: [],
      formerAmateurStatus: "",
      formerNationalTeamStatus: "none",
      olympicBackground: "",
      history: [],
      lastOfferWeek: 0
    };
  }

  function normalizeProState(source) {
    var normalized = createProState();
    var key;
    if (!source || typeof source !== "object") {
      return normalized;
    }
    normalized.id = source.id || normalized.id;
    normalized.currentStageId = source.currentStageId || normalized.currentStageId;
    if (source.proRecord && typeof source.proRecord === "object") {
      normalized.proRecord.wins = typeof source.proRecord.wins === "number" ? Math.max(0, Math.round(source.proRecord.wins)) : 0;
      normalized.proRecord.losses = typeof source.proRecord.losses === "number" ? Math.max(0, Math.round(source.proRecord.losses)) : 0;
      normalized.proRecord.draws = typeof source.proRecord.draws === "number" ? Math.max(0, Math.round(source.proRecord.draws)) : 0;
      normalized.proRecord.kos = typeof source.proRecord.kos === "number" ? Math.max(0, Math.round(source.proRecord.kos)) : 0;
    }
    normalized.currentPromoterId = typeof source.currentPromoterId === "string" ? source.currentPromoterId : "";
    normalized.currentManagerId = typeof source.currentManagerId === "string" ? source.currentManagerId : "";
    normalized.contenderStatus = typeof source.contenderStatus === "string" ? source.contenderStatus : normalized.contenderStatus;
    normalized.titleHistory = source.titleHistory instanceof Array ? clone(source.titleHistory) : [];
    normalized.rankingSeed = typeof source.rankingSeed === "number" ? Math.max(0, Math.round(source.rankingSeed)) : 0;
    normalized.proValue = typeof source.proValue === "number" ? Math.max(0, Math.round(source.proValue)) : 0;
    normalized.organizationRanks = {};
    if (source.organizationRanks && typeof source.organizationRanks === "object") {
      for (key in source.organizationRanks) {
        if (source.organizationRanks.hasOwnProperty(key) && typeof source.organizationRanks[key] === "number") {
          normalized.organizationRanks[key] = Math.max(0, Math.round(source.organizationRanks[key]));
        }
      }
    }
    normalized.championOrganizations = source.championOrganizations instanceof Array ? clone(source.championOrganizations) : [];
    normalized.proReputationTags = source.proReputationTags instanceof Array ? clone(source.proReputationTags) : [];
    normalized.formerAmateurStatus = typeof source.formerAmateurStatus === "string" ? source.formerAmateurStatus : "";
    normalized.formerNationalTeamStatus = typeof source.formerNationalTeamStatus === "string" ? source.formerNationalTeamStatus : "none";
    normalized.olympicBackground = typeof source.olympicBackground === "string" ? source.olympicBackground : "";
    normalized.history = source.history instanceof Array ? clone(source.history) : [];
    normalized.lastOfferWeek = typeof source.lastOfferWeek === "number" ? Math.max(0, Math.round(source.lastOfferWeek)) : 0;
    return normalized;
  }

  function playerRoot(gameState) {
    if (!gameState.player || typeof gameState.player !== "object") {
      gameState.player = {};
    }
    if (!gameState.player.pro || typeof gameState.player.pro !== "object") {
      gameState.player.pro = createProState();
    } else {
      gameState.player.pro = normalizeProState(gameState.player.pro);
    }
    return gameState.player.pro;
  }

  function ensureOrgBuckets(gameState) {
    var orgState = gameState.organizationState || {};
    gameState.organizationState = orgState;
    if (!(orgState.organizationIds instanceof Array)) { orgState.organizationIds = []; }
    if (!orgState.organizationsById || typeof orgState.organizationsById !== "object") { orgState.organizationsById = {}; }
    if (!(orgState.rankingTableIds instanceof Array)) { orgState.rankingTableIds = []; }
    if (!orgState.rankingTablesById || typeof orgState.rankingTablesById !== "object") { orgState.rankingTablesById = {}; }
    if (!(orgState.promoterIds instanceof Array)) { orgState.promoterIds = []; }
    if (!orgState.promotersById || typeof orgState.promotersById !== "object") { orgState.promotersById = {}; }
    if (!(orgState.managerIds instanceof Array)) { orgState.managerIds = []; }
    if (!orgState.managersById || typeof orgState.managersById !== "object") { orgState.managersById = {}; }
    return orgState;
  }

  function ensureCompetitionBuckets(gameState) {
    var competitionState = gameState.competitionState || {};
    gameState.competitionState = competitionState;
    if (!(competitionState.proOfferIds instanceof Array)) { competitionState.proOfferIds = []; }
    if (!competitionState.proOffersById || typeof competitionState.proOffersById !== "object") { competitionState.proOffersById = {}; }
    return competitionState;
  }

  function rosterRoot(gameState) {
    return gameState && gameState.rosterState ? gameState.rosterState : null;
  }

  function getPlayerEntityId(gameState) {
    return gameState && gameState.playerState ? gameState.playerState.fighterEntityId || "fighter_player_main" : "fighter_player_main";
  }

  function getFighterById(gameState, fighterId) {
    if (!fighterId || !gameState || !gameState.rosterState || !gameState.rosterState.fightersById) {
      return null;
    }
    return gameState.rosterState.fightersById[fighterId] || null;
  }

  function currentCityForCountry(countryId, index) {
    var country = getCountry(countryId);
    var arenas = country && country.arenas ? country.arenas : [];
    if (arenas.length && arenas[index % arenas.length]) {
      return arenas[index % arenas.length].city || country.city || "";
    }
    return country ? country.city || country.name || "" : "";
  }

  function buildPromoterEntity(countryId, template, index) {
    var city = currentCityForCountry(countryId, index);
    return {
      id: stableId("promoter", [countryId, template.id]),
      templateId: template.id,
      name: city + " " + template.label,
      label: template.label,
      countryId: countryId,
      city: city,
      purseBonus: template.purseBonus || 0,
      fameBonus: template.fameBonus || 0,
      travelBias: template.travelBias || 0,
      pressure: template.pressure || 0,
      badContractShift: template.badContractShift || 0,
      explanation: template.explanation || "",
      reputation: 30 + index * 8,
      npcId: ""
    };
  }

  function buildManagerEntity(countryId, template, index) {
    var city = currentCityForCountry(countryId, index + 1);
    return {
      id: stableId("manager", [countryId, template.id]),
      templateId: template.id,
      name: city + " " + template.label,
      label: template.label,
      countryId: countryId,
      city: city,
      purseBonus: template.purseBonus || 0,
      winBonus: template.winBonus || 0,
      koBonus: template.koBonus || 0,
      rankingBoost: template.rankingBoost || 0,
      travelGuard: template.travelGuard || 0,
      pressureGuard: template.pressureGuard || 0,
      explanation: template.explanation || "",
      reputation: 28 + index * 8
    };
  }

  function baseOrganizationEntity(template) {
    return {
      id: template.id,
      name: template.name,
      country: "",
      city: "",
      type: "sanctioning_body",
      trackId: "pro",
      reputation: Math.round(70 * (template.prestigeModifier || 1)),
      tags: ["pro", "title_body", template.shortId || template.id],
      rankingList: [],
      championId: "",
      contenderIds: [],
      titleFightRules: clone(template.titleFightRules || {}),
      prestigeModifier: typeof template.prestigeModifier === "number" ? template.prestigeModifier : 1,
      titleHistory: [],
      titleDefensesByChampionId: {},
      lastUpdatedWeek: 0
    };
  }

  function baseRankingTable(orgTemplate) {
    return {
      id: stableId("ranking", [orgTemplate.id]),
      trackId: "pro",
      organizationId: orgTemplate.id,
      entries: [],
      entryLimit: orgTemplate.rankingSize || rankingRules().rankingSize || 15,
      updatedWeek: 0
    };
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

  function containsTag(list, value) {
    var i;
    if (!(list instanceof Array)) {
      return false;
    }
    for (i = 0; i < list.length; i += 1) {
      if (list[i] === value) {
        return true;
      }
    }
    return false;
  }

  function getStatus(statusId) {
    var list = dataRoot().contenderStatuses || [];
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].id === statusId) {
        return clone(list[i]);
      }
    }
    return null;
  }

  function listStatuses() {
    return clone(dataRoot().contenderStatuses || []);
  }

  function explanationText(explanationId) {
    var map = dataRoot().explanationTexts || {};
    return map[explanationId] || "";
  }

  function transitionRules() {
    return clone(dataRoot().transitionRules || {});
  }

  function playerBackground(gameState, fromTrackId) {
    var trackId = fromTrackId || currentTrack(gameState);
    var player = gameState && gameState.player ? gameState.player : {};
    var amateur = player.amateur || {};
    var street = player.street || {};
    var facts = player.biography && player.biography.facts ? player.biography.facts : {};
    var flags = player.biography && player.biography.flags instanceof Array ? player.biography.flags : [];
    var rules = transitionRules();
    var tags = [];
    var rankingSeed = 8;
    var scoutingBoost = 0;
    var formerNationalTeamStatus = amateur.nationalTeamStatus || "none";
    var olympicBackground = "";
    if (formerNationalTeamStatus === "active") {
      addUnique(tags, "ex_national_team");
      rankingSeed += rules.exNationalTeamSeedBonus || 0;
      scoutingBoost += 10;
    } else if (formerNationalTeamStatus === "reserve" || formerNationalTeamStatus === "candidate") {
      addUnique(tags, "ex_national_team");
      rankingSeed += rules.reserveNationalTeamSeedBonus || 0;
      scoutingBoost += 5;
    }
    if (formerNationalTeamStatus === "none" && flags.indexOf("former_national_team_member") !== -1) {
      formerNationalTeamStatus = flags.indexOf("dropped_from_national_team") !== -1 ? "dropped" : "alumni";
      addUnique(tags, "ex_national_team");
      rankingSeed += rules.reserveNationalTeamSeedBonus || 0;
      scoutingBoost += 4;
    }
    if (amateur.rankId === "olympic_level") {
      addUnique(tags, "ex_olympian");
      olympicBackground = "olympic_level";
      rankingSeed += rules.olympicRankSeedBonus || 0;
      scoutingBoost += 12;
    }
    if (street.streetRating >= (rules.streetMinRating || 100)) {
      addUnique(tags, "street_star");
      rankingSeed += rules.streetStarSeedBonus || 0;
      scoutingBoost += 4;
    }
    if ((facts.homeWins || 0) >= 3 || (player.resources && player.resources.fame >= 18)) {
      addUnique(tags, "hometown_draw");
      rankingSeed += rules.hometownDrawSeedBonus || 0;
    }
    if (trackId === "amateur" && compareRanks(amateur.rankId || "", "adult_class_1") >= 0 && formerNationalTeamStatus === "none") {
      addUnique(tags, "failed_amateur_talent");
      rankingSeed += rules.failedAmateurPenalty || 0;
    }
    rankingSeed += Math.max(0, Math.floor((amateur.score || 0) / 18));
    rankingSeed += Math.max(0, Math.floor((street.streetRating || 0) / 20));
    rankingSeed += Math.max(0, Math.floor(((player.resources && player.resources.fame) || 0) / 4));
    return {
      tags: tags,
      rankingSeed: Math.max(0, rankingSeed),
      scoutingBoost: scoutingBoost,
      formerAmateurStatus: amateur.rankId || "",
      formerNationalTeamStatus: formerNationalTeamStatus,
      olympicBackground: olympicBackground
    };
  }

  function chooseEntityByScore(list, score) {
    var index = 0;
    if (!(list instanceof Array) || !list.length) {
      return null;
    }
    if (score >= 92) {
      index = Math.min(list.length - 1, 4);
    } else if (score >= 68) {
      index = Math.min(list.length - 1, 3);
    } else if (score >= 44) {
      index = Math.min(list.length - 1, 2);
    } else if (score >= 24) {
      index = Math.min(list.length - 1, 1);
    }
    return list[index];
  }

  function listPromotersByCountry(gameState, countryId) {
    var orgState = ensureOrgBuckets(gameState);
    var result = [];
    var i;
    var promoter;
    for (i = 0; i < orgState.promoterIds.length; i += 1) {
      promoter = orgState.promotersById[orgState.promoterIds[i]];
      if (promoter && promoter.countryId === countryId) {
        result.push(promoter);
      }
    }
    return result;
  }

  function listManagersByCountry(gameState, countryId) {
    var orgState = ensureOrgBuckets(gameState);
    var result = [];
    var i;
    var manager;
    for (i = 0; i < orgState.managerIds.length; i += 1) {
      manager = orgState.managersById[orgState.managerIds[i]];
      if (manager && manager.countryId === countryId) {
        result.push(manager);
      }
    }
    return result;
  }

  function getPromoterById(gameState, promoterId) {
    var orgState = ensureOrgBuckets(gameState);
    return promoterId ? (orgState.promotersById[promoterId] || null) : null;
  }

  function getManagerById(gameState, managerId) {
    var orgState = ensureOrgBuckets(gameState);
    return managerId ? (orgState.managersById[managerId] || null) : null;
  }

  function getOrganizationById(gameState, organizationId) {
    var orgState = ensureOrgBuckets(gameState);
    return organizationId ? (orgState.organizationsById[organizationId] || null) : null;
  }

  function listOfferTemplates() {
    return clone(dataRoot().offerTemplates || []);
  }

  function getOfferTemplate(templateId) {
    var templates = dataRoot().offerTemplates || [];
    var i;
    for (i = 0; i < templates.length; i += 1) {
      if (templates[i] && templates[i].id === templateId) {
        return clone(templates[i]);
      }
    }
    return null;
  }

  function resolveContenderStatus(proState) {
    var statuses = listStatuses();
    var record = proState && proState.proRecord ? proState.proRecord : baseRecord();
    var rankingSeed = proState && typeof proState.rankingSeed === "number" ? proState.rankingSeed : 0;
    var current = statuses.length ? statuses[0] : { id: "unsigned", label: "Без проф. статуса" };
    var i;
    for (i = 0; i < statuses.length; i += 1) {
      if (record.wins >= (statuses[i].minWins || 0) && rankingSeed >= (statuses[i].minRankingSeed || 0)) {
        current = statuses[i];
      }
    }
    return current.id;
  }

  function nextContenderStatus(proState) {
    var statuses = listStatuses();
    var currentId = resolveContenderStatus(proState);
    var i;
    for (i = 0; i < statuses.length; i += 1) {
      if (statuses[i].id === currentId) {
        return statuses[i + 1] ? clone(statuses[i + 1]) : null;
      }
    }
    return null;
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

  function deterministicShift(key, minValue, maxValue) {
    var span = (maxValue - minValue) + 1;
    if (span <= 0) {
      return minValue;
    }
    return minValue + (Math.abs(deterministicSeed(key)) % span);
  }

  function listProFighters(gameState, includePlayer) {
    var roster = rosterRoot(gameState);
    var result = [];
    var i;
    var fighter;
    if (!roster || !(roster.fighterIds instanceof Array) || !roster.fightersById) {
      return result;
    }
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      fighter = roster.fightersById[roster.fighterIds[i]];
      if (!fighter || !fighter.id) {
        continue;
      }
      if ((fighter.currentTrack || fighter.trackId) !== "pro") {
        continue;
      }
      if (fighter.status === "retired") {
        continue;
      }
      if (!includePlayer && fighter.id === getPlayerEntityId(gameState)) {
        continue;
      }
      result.push(fighter);
    }
    return result;
  }

  function fighterStats(fighter) {
    return fighter && (fighter.attributes || fighter.stats) ? (fighter.attributes || fighter.stats) : {};
  }

  function computeProValue(fighter) {
    var stats = fighterStats(fighter);
    var record = fighter && fighter.proRecord ? fighter.proRecord : (fighter && fighter.record ? fighter.record : baseRecord());
    var fame = fighter && typeof fighter.fame === "number" ? fighter.fame : 0;
    var rankingSeed = fighter && typeof fighter.rankingSeed === "number" ? fighter.rankingSeed : 0;
    var morale = fighter && fighter.moraleState ? fighter.moraleState.morale || 55 : 55;
    var wear = fighter && fighter.wearState ? fighter.wearState.wear || 0 : 0;
    var total = (stats.str || 0) + (stats.tec || 0) + (stats.spd || 0) + (stats.end || 0) + (stats.vit || 0);
    var value = (total * 5) +
      ((record.wins || 0) * 4) -
      ((record.losses || 0) * 3) +
      ((record.kos || 0) * 2) +
      Math.round(fame * 1.4) +
      Math.round(rankingSeed * 0.9) +
      Math.round(morale * 0.3) -
      Math.round(wear * 0.7);
    if (fighter && fighter.proReputationTags instanceof Array) {
      if (containsTag(fighter.proReputationTags, "ex_olympian")) { value += 10; }
      if (containsTag(fighter.proReputationTags, "ex_national_team")) { value += 7; }
      if (containsTag(fighter.proReputationTags, "street_star")) { value += 4; }
    }
    if (fighter && fighter.titleHistory instanceof Array) {
      value += fighter.titleHistory.length * 4;
    }
    return Math.max(0, Math.round(value));
  }

  function syncPlayerDerived(gameState) {
    var pro = playerRoot(gameState);
    var playerEntity = getFighterById(gameState, getPlayerEntityId(gameState));
    var orgState = ensureOrgBuckets(gameState);
    var i;
    var org;
    var position;
    pro.proValue = playerEntity && playerEntity.proRankingData ? playerEntity.proRankingData.proValue || 0 : pro.proValue || 0;
    pro.organizationRanks = {};
    pro.championOrganizations = [];
    for (i = 0; i < orgState.organizationIds.length; i += 1) {
      org = orgState.organizationsById[orgState.organizationIds[i]];
      if (!org || org.trackId !== "pro" || !org.titleFightRules) {
        continue;
      }
      position = playerEntity && playerEntity.proRankingData && playerEntity.proRankingData.organizationRanks ? playerEntity.proRankingData.organizationRanks[org.id] || 0 : 0;
      pro.organizationRanks[org.id] = position;
      if (org.championId === getPlayerEntityId(gameState)) {
        addUnique(pro.championOrganizations, org.id);
      }
    }
  }

  function ensureAssignments(gameState, background) {
    var pro = playerRoot(gameState);
    var countryId = gameState && gameState.player && gameState.player.profile ? (gameState.player.profile.currentCountry || gameState.player.profile.homeCountry || "") : "";
    var promoters = listPromotersByCountry(gameState, countryId);
    var managers = listManagersByCountry(gameState, countryId);
    if (!pro.currentPromoterId || !getPromoterById(gameState, pro.currentPromoterId)) {
      pro.currentPromoterId = promoters.length ? chooseEntityByScore(promoters, background.rankingSeed).id : "";
    }
    if (!pro.currentManagerId || !getManagerById(gameState, pro.currentManagerId)) {
      pro.currentManagerId = managers.length ? chooseEntityByScore(managers, background.rankingSeed).id : "";
    }
  }

  function ensureEntities(gameState) {
    var orgState = ensureOrgBuckets(gameState);
    var countries = listCountries();
    var promoterTemplates = clone(dataRoot().promoterTemplates || []);
    var managerTemplates = clone(dataRoot().managerTemplates || []);
    var titleTemplates = listTitleOrganizations();
    var i;
    var j;
    var entity;
    var countryId;
    var template;
    var ranking;
    for (i = 0; i < countries.length; i += 1) {
      countryId = countries[i] && (countries[i].id || countries[i].key) ? (countries[i].id || countries[i].key) : "";
      if (!countryId) {
        continue;
      }
      for (j = 0; j < promoterTemplates.length; j += 1) {
        entity = buildPromoterEntity(countryId, promoterTemplates[j], j);
        if (!orgState.promotersById[entity.id]) {
          orgState.promotersById[entity.id] = entity;
          orgState.promoterIds.push(entity.id);
        }
      }
      for (j = 0; j < managerTemplates.length; j += 1) {
        entity = buildManagerEntity(countryId, managerTemplates[j], j);
        if (!orgState.managersById[entity.id]) {
          orgState.managersById[entity.id] = entity;
          orgState.managerIds.push(entity.id);
        }
      }
    }
    for (i = 0; i < titleTemplates.length; i += 1) {
      template = titleTemplates[i];
      if (!template || !template.id) {
        continue;
      }
      if (!orgState.organizationsById[template.id]) {
        orgState.organizationsById[template.id] = baseOrganizationEntity(template);
      } else {
        orgState.organizationsById[template.id].name = orgState.organizationsById[template.id].name || template.name;
        orgState.organizationsById[template.id].trackId = "pro";
        orgState.organizationsById[template.id].type = orgState.organizationsById[template.id].type || "sanctioning_body";
        orgState.organizationsById[template.id].prestigeModifier = typeof orgState.organizationsById[template.id].prestigeModifier === "number" ? orgState.organizationsById[template.id].prestigeModifier : (template.prestigeModifier || 1);
        orgState.organizationsById[template.id].titleFightRules = clone(orgState.organizationsById[template.id].titleFightRules || template.titleFightRules || {});
        if (!(orgState.organizationsById[template.id].rankingList instanceof Array)) { orgState.organizationsById[template.id].rankingList = []; }
        if (!(orgState.organizationsById[template.id].contenderIds instanceof Array)) { orgState.organizationsById[template.id].contenderIds = []; }
        if (!(orgState.organizationsById[template.id].titleHistory instanceof Array)) { orgState.organizationsById[template.id].titleHistory = []; }
        if (!orgState.organizationsById[template.id].titleDefensesByChampionId || typeof orgState.organizationsById[template.id].titleDefensesByChampionId !== "object") { orgState.organizationsById[template.id].titleDefensesByChampionId = {}; }
      }
      if (orgState.organizationIds.indexOf(template.id) === -1) {
        orgState.organizationIds.push(template.id);
      }
      ranking = baseRankingTable(template);
      if (!orgState.rankingTablesById[ranking.id]) {
        orgState.rankingTablesById[ranking.id] = ranking;
      } else {
        orgState.rankingTablesById[ranking.id].trackId = "pro";
        orgState.rankingTablesById[ranking.id].organizationId = template.id;
        if (!(orgState.rankingTablesById[ranking.id].entries instanceof Array)) { orgState.rankingTablesById[ranking.id].entries = []; }
        orgState.rankingTablesById[ranking.id].entryLimit = orgState.rankingTablesById[ranking.id].entryLimit || ranking.entryLimit;
      }
      if (orgState.rankingTableIds.indexOf(ranking.id) === -1) {
        orgState.rankingTableIds.push(ranking.id);
      }
    }
  }

  function canTurnPro(gameState, fromTrackId) {
    var trackId = fromTrackId || currentTrack(gameState);
    var player = gameState && gameState.player ? gameState.player : {};
    var pro = player.pro || {};
    var history = pro.history instanceof Array ? pro.history : [];
    var i;
    if (trackId !== "amateur" && trackId !== "street") {
      return false;
    }
    for (i = 0; i < history.length; i += 1) {
      if (history[i] && history[i].type === "turned_pro") {
        return false;
      }
    }
    return true;
  }

  function ensureBiographyFlags(gameState, background) {
    var biography = gameState && gameState.player ? gameState.player.biography || null : null;
    if (!biography) {
      return;
    }
    if (!(biography.flags instanceof Array)) {
      biography.flags = [];
    }
    addUnique(biography.flags, "turned_pro");
    if (background.formerNationalTeamStatus && background.formerNationalTeamStatus !== "none") {
      addUnique(biography.flags, "former_national_team_member");
    }
    if (background.olympicBackground) {
      addUnique(biography.flags, "olympic_background");
    }
  }

  function enterProTrack(gameState, fromTrackId, weekValue, note) {
    var pro = playerRoot(gameState);
    var trackId = fromTrackId || currentTrack(gameState);
    var background;
    var careerTrack;
    if (!canTurnPro(gameState, trackId)) {
      return { ok: false };
    }
    ensureEntities(gameState);
    ensureCompetitionBuckets(gameState);
    background = playerBackground(gameState, trackId);
    pro.formerAmateurStatus = background.formerAmateurStatus;
    pro.formerNationalTeamStatus = background.formerNationalTeamStatus;
    pro.olympicBackground = background.olympicBackground;
    pro.proReputationTags = clone(background.tags);
    pro.rankingSeed = Math.max(pro.rankingSeed || 0, background.rankingSeed);
    pro.contenderStatus = resolveContenderStatus(pro);
    pro.currentStageId = pro.proRecord.wins <= 0 ? "debut" : pro.currentStageId;
    ensureAssignments(gameState, background);
    if (gameState.playerState) {
      gameState.playerState.currentTrackId = "pro";
      careerTrack = gameState.playerState.careerTrack;
      if (careerTrack && careerTrack.tracks) {
        if (careerTrack.tracks.street) {
          careerTrack.tracks.street.active = false;
          careerTrack.tracks.street.unlocked = true;
        }
        if (careerTrack.tracks.amateur) {
          careerTrack.tracks.amateur.active = false;
          careerTrack.tracks.amateur.unlocked = true;
        }
        if (careerTrack.tracks.pro) {
          careerTrack.tracks.pro.active = true;
          careerTrack.tracks.pro.unlocked = true;
          careerTrack.tracks.pro.enteredWeek = careerTrack.tracks.pro.enteredWeek || weekValue || 1;
        }
        careerTrack.currentTrackId = "pro";
      }
    }
    if (pro.history.length < 1 || !pro.history[0] || pro.history[0].type !== "turned_pro") {
      pro.history.unshift({
        week: typeof weekValue === "number" ? weekValue : 1,
        type: "turned_pro",
        fromTrackId: trackId,
        note: note || "",
        rankingSeed: pro.rankingSeed
      });
    }
    ensureBiographyFlags(gameState, background);
    refreshRankings(gameState, { week: weekValue || currentWeek(gameState), simulateWorld: false });
    return {
      ok: true,
      background: background,
      promoter: getPromoterById(gameState, pro.currentPromoterId),
      manager: getManagerById(gameState, pro.currentManagerId),
      contenderStatus: getStatus(pro.contenderStatus)
    };
  }

  function explanationPartsForTags(parts, tags, template) {
    if (containsTag(tags, "ex_national_team")) {
      parts.push("База сборной помогает выйти на заметные бои.");
    }
    if (containsTag(tags, "ex_olympian")) {
      parts.push("Олимпийское прошлое добавляет интерес.");
    }
    if (containsTag(tags, "street_star")) {
      parts.push("Уличное имя помогает продать бой.");
    }
    if (containsTag(tags, "hometown_draw") && template && template.travel === "home") {
      parts.push("Дома на тебя уже идут люди.");
    }
  }

  function buildOrganizationScore(fighter, orgTemplate, weekValue) {
    var value = computeProValue(fighter);
    var bonus = deterministicShift((orgTemplate.id || "") + ":" + fighter.id + ":" + String(weekValue || 1), -5, 5);
    if (fighter && fighter.proRankingData && fighter.proRankingData.organizationRanks && typeof fighter.proRankingData.organizationRanks[orgTemplate.id] === "number" && fighter.proRankingData.organizationRanks[orgTemplate.id] > 0) {
      bonus += Math.max(0, 18 - fighter.proRankingData.organizationRanks[orgTemplate.id]);
    }
    if (fighter && fighter.proReputationTags instanceof Array) {
      if (containsTag(fighter.proReputationTags, "ex_olympian")) { bonus += 3; }
      if (containsTag(fighter.proReputationTags, "street_star")) { bonus += 1; }
    }
    return Math.round((value * (orgTemplate.prestigeModifier || 1)) + bonus);
  }

  function titleHistoryEntry(orgTemplate, eventType, weekValue, championId, opponentId, previousChampionId, defenseCount) {
    return {
      id: stableId("pro_title_event", [orgTemplate.id, eventType, weekValue || 1, championId || "vacant", opponentId || "none"]),
      organizationId: orgTemplate.id,
      organizationName: orgTemplate.name,
      type: eventType,
      week: typeof weekValue === "number" ? weekValue : 1,
      championId: championId || "",
      opponentId: opponentId || "",
      previousChampionId: previousChampionId || "",
      defenseCount: typeof defenseCount === "number" ? defenseCount : 0
    };
  }

  function pushTitleHistory(orgEntity, entry) {
    var rules = rankingRules();
    if (!orgEntity || !entry || !entry.id) {
      return;
    }
    orgEntity.titleHistory.unshift(clone(entry));
    if (orgEntity.titleHistory.length > (rules.maxTitleHistory || 40)) {
      orgEntity.titleHistory = orgEntity.titleHistory.slice(0, rules.maxTitleHistory || 40);
    }
  }

  function pushFighterTitleHistory(fighter, orgTemplate, weekValue, statusText) {
    if (!fighter || !orgTemplate) {
      return;
    }
    if (!(fighter.titleHistory instanceof Array)) {
      fighter.titleHistory = [];
    }
    fighter.titleHistory.unshift({
      id: stableId("fighter_title_history", [fighter.id, orgTemplate.id, weekValue || 1, statusText || "line"]),
      organizationId: orgTemplate.id,
      label: orgTemplate.name,
      week: typeof weekValue === "number" ? weekValue : 1,
      status: statusText || ""
    });
    if (fighter.titleHistory.length > 24) {
      fighter.titleHistory = fighter.titleHistory.slice(0, 24);
    }
  }

  function assignChampion(gameState, orgTemplate, championId, weekValue, reason, opponentId, previousChampionId) {
    var orgState = ensureOrgBuckets(gameState);
    var orgEntity = orgState.organizationsById[orgTemplate.id];
    var champion = getFighterById(gameState, championId);
    var previousChampion = previousChampionId ? getFighterById(gameState, previousChampionId) : null;
    var defenseCount = 0;
    if (!orgEntity || !champion) {
      return;
    }
    orgEntity.championId = championId;
    if (!orgEntity.titleDefensesByChampionId || typeof orgEntity.titleDefensesByChampionId !== "object") {
      orgEntity.titleDefensesByChampionId = {};
    }
    if (reason === "defense") {
      defenseCount = (orgEntity.titleDefensesByChampionId[championId] || 0) + 1;
      orgEntity.titleDefensesByChampionId[championId] = defenseCount;
    } else {
      if (typeof orgEntity.titleDefensesByChampionId[championId] !== "number") {
        orgEntity.titleDefensesByChampionId[championId] = 0;
      }
      defenseCount = orgEntity.titleDefensesByChampionId[championId];
    }
    pushTitleHistory(orgEntity, titleHistoryEntry(orgTemplate, reason, weekValue, championId, opponentId, previousChampionId, defenseCount));
    if (reason === "vacant_fill" || reason === "title_win" || reason === "title_upset") {
      pushFighterTitleHistory(champion, orgTemplate, weekValue, "champion");
      addUnique(champion.proReputationTags, "title_holder");
    }
    if (previousChampion && previousChampion.id !== championId) {
      addUnique(previousChampion.proReputationTags, "former_champion");
    }
  }

  function refreshFighterMetrics(gameState) {
    var pro = playerRoot(gameState);
    var fighters = listProFighters(gameState, true);
    var i;
    var fighter;
    for (i = 0; i < fighters.length; i += 1) {
      fighter = fighters[i];
      if (!fighter.proRankingData || typeof fighter.proRankingData !== "object") {
        fighter.proRankingData = {};
      }
      if (!fighter.proRankingData.organizationRanks || typeof fighter.proRankingData.organizationRanks !== "object") {
        fighter.proRankingData.organizationRanks = {};
      }
      fighter.proRankingData.proValue = computeProValue(fighter);
      fighter.rankingSeed = typeof fighter.rankingSeed === "number" ? fighter.rankingSeed : (fighter.proRankingData.rankingSeed || 0);
      fighter.proRankingData.rankingSeed = fighter.rankingSeed;
    }
    pro.proValue = getFighterById(gameState, getPlayerEntityId(gameState)) && getFighterById(gameState, getPlayerEntityId(gameState)).proRankingData ? getFighterById(gameState, getPlayerEntityId(gameState)).proRankingData.proValue || 0 : pro.proValue;
  }

  function clearOrganizationRanks(gameState) {
    var fighters = listProFighters(gameState, true);
    var i;
    for (i = 0; i < fighters.length; i += 1) {
      if (!fighters[i].proRankingData || typeof fighters[i].proRankingData !== "object") {
        fighters[i].proRankingData = {};
      }
      fighters[i].proRankingData.organizationRanks = {};
    }
  }

  function compareRankingEntries(left, right) {
    if ((right.points || 0) !== (left.points || 0)) {
      return (right.points || 0) - (left.points || 0);
    }
    if ((right.wins || 0) !== (left.wins || 0)) {
      return (right.wins || 0) - (left.wins || 0);
    }
    return (left.losses || 0) - (right.losses || 0);
  }

  function rebuildRankingForOrganization(gameState, orgTemplate, weekValue) {
    var orgState = ensureOrgBuckets(gameState);
    var orgEntity = orgState.organizationsById[orgTemplate.id];
    var rankingId = stableId("ranking", [orgTemplate.id]);
    var table = orgState.rankingTablesById[rankingId] || baseRankingTable(orgTemplate);
    var fighters = listProFighters(gameState, true);
    var entries = [];
    var i;
    var fighter;
    var record;
    var position;
    fighters.sort(function (left, right) {
      return buildOrganizationScore(right, orgTemplate, weekValue) - buildOrganizationScore(left, orgTemplate, weekValue);
    });
    for (i = 0; i < fighters.length && entries.length < (orgTemplate.rankingSize || rankingRules().rankingSize || 15); i += 1) {
      fighter = fighters[i];
      record = fighter.proRecord || fighter.record || baseRecord();
      entries.push({
        fighterId: fighter.id,
        label: fighter.fullName || fighter.name || fighter.id,
        points: buildOrganizationScore(fighter, orgTemplate, weekValue),
        proValue: fighter.proRankingData && typeof fighter.proRankingData.proValue === "number" ? fighter.proRankingData.proValue : computeProValue(fighter),
        wins: record.wins || 0,
        losses: record.losses || 0,
        draws: record.draws || 0,
        kos: record.kos || 0,
        contenderStatus: fighter.contenderStatus || ""
      });
    }
    entries.sort(compareRankingEntries);
    for (i = 0; i < entries.length; i += 1) {
      position = i + 1;
      fighter = getFighterById(gameState, entries[i].fighterId);
      entries[i].position = position;
      if (fighter) {
        if (!fighter.proRankingData || typeof fighter.proRankingData !== "object") { fighter.proRankingData = {}; }
        if (!fighter.proRankingData.organizationRanks || typeof fighter.proRankingData.organizationRanks !== "object") { fighter.proRankingData.organizationRanks = {}; }
        fighter.proRankingData.organizationRanks[orgTemplate.id] = position;
      }
    }
    table.entries = entries;
    table.trackId = "pro";
    table.organizationId = orgTemplate.id;
    table.entryLimit = orgTemplate.rankingSize || table.entryLimit || 15;
    table.updatedWeek = weekValue || 1;
    orgState.rankingTablesById[rankingId] = table;
    if (orgState.rankingTableIds.indexOf(rankingId) === -1) {
      orgState.rankingTableIds.push(rankingId);
    }
    orgEntity.rankingList = [];
    orgEntity.contenderIds = [];
    for (i = 0; i < entries.length; i += 1) {
      orgEntity.rankingList.push(entries[i].fighterId);
      if (i < (orgTemplate.contenderCount || rankingRules().contenderCount || 10)) {
        orgEntity.contenderIds.push(entries[i].fighterId);
      }
    }
    orgEntity.lastUpdatedWeek = weekValue || 1;
  }

  function ensureChampionSeed(gameState, orgTemplate, weekValue) {
    var orgEntity = getOrganizationById(gameState, orgTemplate.id);
    var champion = orgEntity && orgEntity.championId ? getFighterById(gameState, orgEntity.championId) : null;
    var rankingId = stableId("ranking", [orgTemplate.id]);
    var table = ensureOrgBuckets(gameState).rankingTablesById[rankingId];
    var firstEntry;
    var orgState = ensureOrgBuckets(gameState);
    var usedChampionIds = {};
    var orgIds = orgState.organizationIds instanceof Array ? orgState.organizationIds : [];
    var i;
    var candidateId;
    var candidate;
    for (i = 0; i < orgIds.length; i += 1) {
      if (orgIds[i] === orgTemplate.id) {
        continue;
      }
      candidateId = orgState.organizationsById[orgIds[i]] ? orgState.organizationsById[orgIds[i]].championId || "" : "";
      if (candidateId) {
        usedChampionIds[candidateId] = true;
      }
    }
    if (champion && (champion.currentTrack || champion.trackId) === "pro" && champion.status !== "retired" && !usedChampionIds[champion.id]) {
      return;
    }
    if (table && table.entries && table.entries.length) {
      firstEntry = table.entries[0];
      candidateId = "";
      for (i = 0; i < table.entries.length; i += 1) {
        candidate = table.entries[i] && table.entries[i].fighterId ? getFighterById(gameState, table.entries[i].fighterId) : null;
        if (!candidate || candidate.status === "retired" || (candidate.currentTrack || candidate.trackId) !== "pro") {
          continue;
        }
        if (!usedChampionIds[candidate.id]) {
          candidateId = candidate.id;
          break;
        }
      }
      if (!candidateId && firstEntry && firstEntry.fighterId) {
        candidateId = firstEntry.fighterId;
      }
      if (candidateId) {
        assignChampion(gameState, orgTemplate, candidateId, weekValue, champion ? "vacant_fill" : "seeded", "", orgEntity ? orgEntity.championId || "" : "");
      }
    }
  }

  function findBestContenderId(gameState, orgTemplate, excludeId) {
    var table = ensureOrgBuckets(gameState).rankingTablesById[stableId("ranking", [orgTemplate.id])];
    var i;
    if (!table || !(table.entries instanceof Array)) {
      return "";
    }
    for (i = 0; i < table.entries.length; i += 1) {
      if (table.entries[i] && table.entries[i].fighterId && table.entries[i].fighterId !== excludeId) {
        return table.entries[i].fighterId;
      }
    }
    return "";
  }

  function simulateBoutWinner(leftFighter, rightFighter, keySuffix) {
    var leftScore = computeProValue(leftFighter) + deterministicShift((leftFighter.id || "") + ":" + keySuffix, -12, 12);
    var rightScore = computeProValue(rightFighter) + deterministicShift((rightFighter.id || "") + ":" + keySuffix, -12, 12);
    return leftScore >= rightScore ? leftFighter : rightFighter;
  }

  function applyNpcRankingBoutResult(winner, loser, isDraw, isKo) {
    var rules = rankingRules();
    if (!winner || !loser || winner.id === loser.id) {
      return;
    }
    if (!winner.proRecord) { winner.proRecord = baseRecord(); }
    if (!loser.proRecord) { loser.proRecord = baseRecord(); }
    if (isDraw) {
      winner.proRecord.draws += 1;
      loser.proRecord.draws += 1;
      winner.rankingSeed = clamp((winner.rankingSeed || 0) + (rules.rankingDrawBoost || 2), 0, 220);
      loser.rankingSeed = clamp((loser.rankingSeed || 0) + (rules.rankingDrawBoost || 2), 0, 220);
      return;
    }
    winner.proRecord.wins += 1;
    loser.proRecord.losses += 1;
    if (isKo) {
      winner.proRecord.kos += 1;
    }
    winner.rankingSeed = clamp((winner.rankingSeed || 0) + (rules.rankingWinBoost || 9) + (isKo ? 3 : 0), 0, 220);
    loser.rankingSeed = clamp((loser.rankingSeed || 0) - (rules.rankingLossPenalty || 7), 0, 220);
  }

  function simulateWorldRankingBouts(gameState, weekValue) {
    var fighters = listProFighters(gameState, false);
    var rules = rankingRules();
    var used = {};
    var count = 0;
    var i;
    var left;
    var right;
    var winner;
    if (fighters.length < 2) {
      return;
    }
    fighters.sort(function (a, b) {
      return computeProValue(b) - computeProValue(a);
    });
    for (i = 0; i < fighters.length - 1 && count < (rules.weeklyNpcFightCount || 4); i += 2) {
      left = fighters[i];
      right = fighters[i + 1];
      if (!left || !right || used[left.id] || used[right.id]) {
        continue;
      }
      winner = simulateBoutWinner(left, right, "ranking_week_" + String(weekValue || 1));
      applyNpcRankingBoutResult(winner, winner.id === left.id ? right : left, false, deterministicShift(String(weekValue || 1) + ":" + winner.id, 0, 100) >= 62);
      used[left.id] = true;
      used[right.id] = true;
      count += 1;
    }
  }

  function maybeRunTitleActivity(gameState, orgTemplate, weekValue) {
    var rules = rankingRules();
    var orgEntity = getOrganizationById(gameState, orgTemplate.id);
    var champion;
    var challengerId;
    var challenger;
    var winner;
    var weekGate;
    if (!orgEntity) {
      return;
    }
    champion = orgEntity.championId ? getFighterById(gameState, orgEntity.championId) : null;
    if (!champion || champion.status === "retired" || (champion.currentTrack || champion.trackId) !== "pro") {
      orgEntity.championId = "";
      ensureChampionSeed(gameState, orgTemplate, weekValue);
      champion = orgEntity.championId ? getFighterById(gameState, orgEntity.championId) : null;
    }
    if (!champion || champion.id === getPlayerEntityId(gameState)) {
      return;
    }
    weekGate = (weekValue + deterministicShift(orgTemplate.id, 0, (orgTemplate.titleFightRules.defenseCadenceWeeks || 10) - 1)) % (orgTemplate.titleFightRules.defenseCadenceWeeks || 10);
    if (weekGate !== 0) {
      return;
    }
    challengerId = findBestContenderId(gameState, orgTemplate, champion.id);
    challenger = challengerId ? getFighterById(gameState, challengerId) : null;
    if (!challenger || challenger.id === getPlayerEntityId(gameState)) {
      return;
    }
    winner = simulateBoutWinner(champion, challenger, "title_" + orgTemplate.id + "_" + String(weekValue || 1));
    if (winner.id === champion.id) {
      champion.rankingSeed = clamp((champion.rankingSeed || 0) + (rules.titleDefenseBoost || 5), 0, 240);
      challenger.rankingSeed = clamp((challenger.rankingSeed || 0) - Math.max(2, Math.round((rules.titleLossPenalty || 10) * 0.5)), 0, 240);
      assignChampion(gameState, orgTemplate, champion.id, weekValue, "defense", challenger.id, champion.id);
    } else {
      challenger.proRecord.wins += 1;
      if (deterministicShift(challenger.id + ":" + weekValue, 0, 100) >= 64) {
        challenger.proRecord.kos += 1;
      }
      champion.proRecord.losses += 1;
      challenger.rankingSeed = clamp((challenger.rankingSeed || 0) + (rules.titleWinBoost || 18), 0, 260);
      champion.rankingSeed = clamp((champion.rankingSeed || 0) - (rules.titleLossPenalty || 10), 0, 260);
      assignChampion(gameState, orgTemplate, challenger.id, weekValue, "title_upset", champion.id, champion.id);
    }
  }

  function refreshRankings(gameState, options) {
    var opts = options || {};
    var weekValue = typeof opts.week === "number" ? opts.week : currentWeek(gameState);
    var orgTemplates = listTitleOrganizations();
    var i;
    clearOrganizationRanks(gameState);
    refreshFighterMetrics(gameState);
    for (i = 0; i < orgTemplates.length; i += 1) {
      rebuildRankingForOrganization(gameState, orgTemplates[i], weekValue);
      ensureChampionSeed(gameState, orgTemplates[i], weekValue);
    }
    if (opts.simulateWorld) {
      for (i = 0; i < orgTemplates.length; i += 1) {
        maybeRunTitleActivity(gameState, orgTemplates[i], weekValue);
      }
      clearOrganizationRanks(gameState);
      refreshFighterMetrics(gameState);
      for (i = 0; i < orgTemplates.length; i += 1) {
        rebuildRankingForOrganization(gameState, orgTemplates[i], weekValue);
      }
    }
    syncPlayerDerived(gameState);
  }

  function findPlayerRankEntry(gameState, orgId) {
    var orgState = ensureOrgBuckets(gameState);
    var rankingId = stableId("ranking", [orgId]);
    var table = orgState.rankingTablesById[rankingId];
    var i;
    var playerId = getPlayerEntityId(gameState);
    if (!table || !(table.entries instanceof Array)) {
      return null;
    }
    for (i = 0; i < table.entries.length; i += 1) {
      if (table.entries[i] && table.entries[i].fighterId === playerId) {
        return table.entries[i];
      }
    }
    return null;
  }

  function titleShotExplanation(gameState, orgTemplate, entry, proState) {
    var rules = orgTemplate.titleFightRules || {};
    var rank = entry ? entry.position || 0 : 0;
    if (containsTag(proState.championOrganizations, orgTemplate.id)) {
      return "Ты держишь пояс и ждешь защиту.";
    }
    if (!rank) {
      return "Нужно попасть в рейтинг " + orgTemplate.name + ".";
    }
    if ((proState.proRecord.wins || 0) < (rules.minimumWinsForTitleShot || 9)) {
      return "В рейтинге ты уже есть, но пока не хватает проф. побед для титульного шанса.";
    }
    if (rank <= (rules.minRankForTitleShot || 2)) {
      return "Ты рядом с титульным шансом.";
    }
    if (rank <= (rules.minRankForEliminator || 5)) {
      return "Еще один сильный бой может вывести тебя на элиминатор.";
    }
    return "Нужно подниматься выше в списке " + orgTemplate.name + ".";
  }

  function buildOrganizationSummaries(gameState) {
    var orgTemplates = listTitleOrganizations();
    var orgState = ensureOrgBuckets(gameState);
    var pro = playerRoot(gameState);
    var result = [];
    var i;
    var j;
    var orgTemplate;
    var orgEntity;
    var table;
    var champion;
    var topContenders = [];
    var entry;
    for (i = 0; i < orgTemplates.length; i += 1) {
      orgTemplate = orgTemplates[i];
      orgEntity = orgState.organizationsById[orgTemplate.id];
      table = orgState.rankingTablesById[stableId("ranking", [orgTemplate.id])];
      champion = orgEntity && orgEntity.championId ? getFighterById(gameState, orgEntity.championId) : null;
      topContenders = [];
      if (table && table.entries instanceof Array) {
        for (j = 0; j < table.entries.length && j < 5; j += 1) {
          entry = table.entries[j];
          if (!entry) {
            continue;
          }
          topContenders.push({
            fighterId: entry.fighterId,
            label: entry.label,
            position: entry.position,
            isChampion: champion ? champion.id === entry.fighterId : false
          });
        }
      }
      entry = findPlayerRankEntry(gameState, orgTemplate.id);
      result.push({
        organizationId: orgTemplate.id,
        name: orgTemplate.name,
        prestigeModifier: orgTemplate.prestigeModifier || 1,
        championId: champion ? champion.id : "",
        championLabel: champion ? (champion.fullName || champion.name || champion.id) : "Вакантно",
        championCountry: champion ? champion.country || "" : "",
        topContenders: topContenders,
        playerRank: entry ? entry.position || 0 : 0,
        playerEntry: entry ? clone(entry) : null,
        titleShotExplanation: titleShotExplanation(gameState, orgTemplate, entry, pro),
        titleFightAvailable: !!entry && entry.position > 0 && entry.position <= ((orgTemplate.titleFightRules || {}).minRankForTitleShot || 2) && (pro.proRecord.wins || 0) >= ((orgTemplate.titleFightRules || {}).minimumWinsForTitleShot || 9),
        eliminatorAvailable: !!entry && entry.position > 0 && entry.position <= ((orgTemplate.titleFightRules || {}).minRankForEliminator || 5),
        isChampion: containsTag(pro.championOrganizations, orgTemplate.id),
        rankingId: stableId("ranking", [orgTemplate.id]),
        titleHistory: orgEntity && orgEntity.titleHistory instanceof Array ? clone(orgEntity.titleHistory.slice(0, 4)) : []
      });
    }
    return result;
  }

  function listEligibleOfferTemplates(gameState) {
    var templates = listOfferTemplates();
    var pro = playerRoot(gameState);
    var age = ageYears(gameState);
    var record = pro.proRecord || baseRecord();
    var effectiveSeed = (pro.rankingSeed || 0) + playerBackground(gameState, "pro").scoutingBoost;
    var summaries = buildOrganizationSummaries(gameState);
    var canRank = false;
    var canEliminator = false;
    var canTitleShot = false;
    var i;
    var template;
    var result = [];
    for (i = 0; i < summaries.length; i += 1) {
      if (summaries[i].playerRank > 0) {
        canRank = true;
      }
      if (summaries[i].eliminatorAvailable) {
        canEliminator = true;
      }
      if (summaries[i].titleFightAvailable || summaries[i].isChampion) {
        canTitleShot = true;
      }
    }
    for (i = 0; i < templates.length; i += 1) {
      template = templates[i];
      if (age < (template.minAge || 18)) {
        continue;
      }
      if (record.wins < (template.minProWins || 0)) {
        continue;
      }
      if (effectiveSeed < (template.minRankingSeed || 0)) {
        continue;
      }
      if (record.wins === 0 && template.id !== "pro_debut") {
        continue;
      }
      if (template.pipelineStage === "ranking" && !canRank && record.wins < 4) {
        continue;
      }
      if (template.pipelineStage === "eliminator" && !canEliminator) {
        continue;
      }
      if (template.pipelineStage === "title_path" && !canTitleShot) {
        continue;
      }
      result.push(template);
    }
    return result;
  }

  function explainOffer(gameState, templateId, offerContext) {
    var template = typeof templateId === "string" ? getOfferTemplate(templateId) : clone(templateId);
    var background = playerBackground(gameState, currentTrack(gameState));
    var pro = playerRoot(gameState);
    var parts = [];
    var i;
    var context = offerContext || null;
    if (!template) {
      return "";
    }
    for (i = 0; i < pro.proReputationTags.length; i += 1) {
      addUnique(background.tags, pro.proReputationTags[i]);
    }
    if (context && context.titleShotExplanation) {
      parts.push(context.titleShotExplanation);
    } else if (explanationText(template.explanationId)) {
      parts.push(explanationText(template.explanationId));
    }
    explanationPartsForTags(parts, background.tags, template);
    return parts.join(" ");
  }

  function pickOfferContext(gameState, templateId) {
    var template = typeof templateId === "string" ? getOfferTemplate(templateId) : clone(templateId);
    var summaries;
    var best = null;
    var i;
    var playerId = getPlayerEntityId(gameState);
    var targetId = "";
    var targetFighter = null;
    var targetSnapshot = null;
    var country = null;
    if (!template) {
      return null;
    }
    summaries = buildOrganizationSummaries(gameState);
    for (i = 0; i < summaries.length; i += 1) {
      if (!best) {
        best = summaries[i];
      }
      if (template.pipelineStage === "title_path") {
        if (summaries[i].titleFightAvailable || summaries[i].isChampion) {
          best = summaries[i];
          break;
        }
        if (summaries[i].playerRank > 0 && (!best.playerRank || summaries[i].playerRank < best.playerRank)) {
          best = summaries[i];
        }
      } else if (template.pipelineStage === "eliminator") {
        if (summaries[i].eliminatorAvailable) {
          best = summaries[i];
          break;
        }
        if (summaries[i].playerRank > 0 && (!best.playerRank || summaries[i].playerRank < best.playerRank)) {
          best = summaries[i];
        }
      } else if (summaries[i].playerRank > 0 && (!best.playerRank || summaries[i].playerRank < best.playerRank)) {
        best = summaries[i];
      }
    }
    if (!best) {
      return null;
    }
    if (template.pipelineStage === "title_path") {
      if (best.isChampion) {
        for (i = 0; i < best.topContenders.length; i += 1) {
          if (best.topContenders[i].fighterId !== playerId) {
            targetId = best.topContenders[i].fighterId;
            break;
          }
        }
      } else if (best.championId && best.championId !== playerId) {
        targetId = best.championId;
      } else if (best.topContenders.length) {
        targetId = best.topContenders[0].fighterId === playerId && best.topContenders[1] ? best.topContenders[1].fighterId : best.topContenders[0].fighterId;
      }
    } else if (template.pipelineStage === "eliminator") {
      for (i = 0; i < best.topContenders.length; i += 1) {
        if (best.topContenders[i].fighterId !== playerId && best.topContenders[i].fighterId !== best.championId) {
          targetId = best.topContenders[i].fighterId;
          break;
        }
      }
    } else if (template.pipelineStage === "ranking") {
      for (i = 0; i < best.topContenders.length; i += 1) {
        if (best.topContenders[i].fighterId !== playerId && best.topContenders[i].position >= Math.max(1, best.playerRank - 1)) {
          targetId = best.topContenders[i].fighterId;
          break;
        }
      }
    }
    targetFighter = targetId ? getFighterById(gameState, targetId) : null;
    if (!targetFighter && template.pipelineStage !== "debut" && template.pipelineStage !== "low_card") {
      targetId = findBestContenderId(gameState, getTitleOrganizationTemplate(best.organizationId), playerId);
      targetFighter = targetId ? getFighterById(gameState, targetId) : null;
    }
    if (targetFighter && typeof PersistentFighterRegistry !== "undefined" && PersistentFighterRegistry.buildOpponentSnapshot) {
      country = getCountry(targetFighter.country || "") || { id: targetFighter.country || "" };
      targetSnapshot = PersistentFighterRegistry.buildOpponentSnapshot(targetFighter, {}, country);
    }
    return {
      organizationId: best.organizationId,
      organizationName: best.name,
      playerRank: best.playerRank,
      titleShotExplanation: best.titleShotExplanation,
      titleFight: !!(template.pipelineStage === "title_path" && (best.titleFightAvailable || best.isChampion)),
      titleDefense: !!(template.pipelineStage === "title_path" && best.isChampion),
      eliminator: !!(template.pipelineStage === "eliminator" && best.eliminatorAvailable),
      championId: best.championId,
      championLabel: best.championLabel,
      targetFighterId: targetId || "",
      targetSnapshot: targetSnapshot,
      prestigeModifier: best.prestigeModifier || 1
    };
  }

  function rememberOffers(gameState, offers, weekValue) {
    var competitionState = ensureCompetitionBuckets(gameState);
    var i;
    var offer;
    var entityId;
    competitionState.proOfferIds = [];
    competitionState.proOffersById = {};
    if (!(offers instanceof Array)) {
      return;
    }
    for (i = 0; i < offers.length; i += 1) {
      offer = offers[i];
      if (!offer || offer.trackId !== "pro") {
        continue;
      }
      entityId = offer.proOfferId || offer.id || stableId("pro_offer", [weekValue || 1, offer.templateId || "offer", i + 1]);
      competitionState.proOfferIds.push(entityId);
      competitionState.proOffersById[entityId] = {
        id: entityId,
        templateId: offer.templateId || "",
        label: offer.label || "",
        pipelineStage: offer.pipelineStage || "",
        organizationId: offer.organizationId || "",
        organizationName: offer.organizationName || "",
        titleFight: !!offer.titleFight,
        titleDefense: !!offer.titleDefense,
        eliminator: !!offer.eliminator,
        titleShotExplanation: offer.titleShotExplanation || "",
        promoterId: offer.promoterId || "",
        managerId: offer.managerId || "",
        opponentFighterId: offer.fighterId || "",
        guaranteedPurse: offer.guaranteedPurse || 0,
        winBonus: offer.winBonus || 0,
        koBonus: offer.koBonus || 0,
        promoterPressure: offer.promoterPressure || 0,
        travelRisk: offer.travelRisk || 0,
        badContractRisk: offer.badContractRisk || 0,
        explanation: offer.explanation || "",
        weekStamp: typeof weekValue === "number" ? weekValue : 1,
        countryKey: offer.countryKey || "",
        venue: offer.venue || ""
      };
      offer.proOfferId = entityId;
    }
  }

  function applyFightResult(gameState, resultInfo) {
    var info = resultInfo || {};
    var offer = info.offer || {};
    var pro = playerRoot(gameState);
    var playerEntity = getFighterById(gameState, getPlayerEntityId(gameState));
    var previousStatusId = resolveContenderStatus(pro);
    var rankingBefore = pro.rankingSeed || 0;
    var rankingDelta = 0;
    var stage = offer.pipelineStage || "";
    var notices = [];
    var media = [];
    var orgTemplate = offer.organizationId ? getTitleOrganizationTemplate(offer.organizationId) : null;
    var championBefore = orgTemplate ? getOrganizationById(gameState, orgTemplate.id) : null;
    var previousChampionId = championBefore ? championBefore.championId || "" : "";
    if (info.result === "win") {
      pro.proRecord.wins += 1;
      rankingDelta = 8 + (stage === "ranking" ? 8 : 0) + (stage === "eliminator" ? 12 : 0) + (stage === "title_path" ? 16 : 0);
      if (String(info.method || "").indexOf("KO") !== -1) {
        pro.proRecord.kos += 1;
        rankingDelta += 4;
      }
      if (offer.titleFight && orgTemplate) {
        assignChampion(gameState, orgTemplate, getPlayerEntityId(gameState), info.week || currentWeek(gameState), previousChampionId && previousChampionId !== getPlayerEntityId(gameState) ? "title_win" : "vacant_fill", offer.fighterId || "", previousChampionId);
        pro.titleHistory.unshift({
          id: stableId("player_pro_title", [orgTemplate.id, info.week || currentWeek(gameState)]),
          organizationId: orgTemplate.id,
          label: orgTemplate.name,
          week: info.week || currentWeek(gameState),
          status: "champion"
        });
        notices.push("Ты берешь пояс " + orgTemplate.name + ".");
        media.push({
          type: "event",
          payload: {
            eventTitle: "Пояс " + orgTemplate.name,
            tags: ["pro_title", orgTemplate.shortId || orgTemplate.id]
          }
        });
      } else if (offer.eliminator && orgTemplate) {
        rankingDelta += 6;
        notices.push("Победа в элиминаторе " + orgTemplate.name + " двигает тебя выше.");
      }
    } else if (info.result === "loss") {
      pro.proRecord.losses += 1;
      rankingDelta = -6 - (stage === "ranking" ? 4 : 0) - (stage === "eliminator" ? 6 : 0) - (stage === "title_path" ? 8 : 0);
      if (offer.titleFight && offer.titleDefense && orgTemplate && offer.fighterId) {
        assignChampion(gameState, orgTemplate, offer.fighterId, info.week || currentWeek(gameState), "title_upset", getPlayerEntityId(gameState), getPlayerEntityId(gameState));
        notices.push("Пояс " + orgTemplate.name + " уходит сопернику.");
      }
    } else {
      pro.proRecord.draws += 1;
      rankingDelta = 2 + (stage === "ranking" ? 2 : 0);
    }
    pro.rankingSeed = clamp((pro.rankingSeed || 0) + rankingDelta, 0, 220);
    if (playerEntity) {
      playerEntity.proRecord = clone(pro.proRecord);
      playerEntity.record = clone(pro.proRecord);
      playerEntity.rankingSeed = pro.rankingSeed;
    }
    pro.contenderStatus = resolveContenderStatus(pro);
    refreshRankings(gameState, { week: info.week || currentWeek(gameState), simulateWorld: false });
    if (previousStatusId !== pro.contenderStatus) {
      notices.push("Проф. статус меняется: " + ((getStatus(previousStatusId) || {}).label || "-") + " -> " + ((getStatus(pro.contenderStatus) || {}).label || "-") + ".");
      media.push({
        type: "event",
        payload: {
          eventTitle: "Новый статус в профи",
          tags: ["pro_status_up"]
        }
      });
    }
    if (rankingDelta > 0) {
      notices.push("Проф. рейтинг +" + rankingDelta + ".");
    } else if (rankingDelta < 0) {
      notices.push("Проф. рейтинг " + rankingDelta + ".");
    }
    return {
      rankingDelta: pro.rankingSeed - rankingBefore,
      statusChanged: previousStatusId !== pro.contenderStatus,
      notices: notices,
      media: media
    };
  }

  function summary(gameState) {
    var pro = playerRoot(gameState);
    var status = getStatus(resolveContenderStatus(pro)) || { id: "unsigned", label: "Без проф. статуса" };
    var next = nextContenderStatus(pro);
    var background = playerBackground(gameState, currentTrack(gameState));
    var i;
    var organizations;
    for (i = 0; i < pro.proReputationTags.length; i += 1) {
      addUnique(background.tags, pro.proReputationTags[i]);
    }
    organizations = buildOrganizationSummaries(gameState);
    return {
      pro: clone(pro),
      status: status,
      nextStatus: next,
      promoter: getPromoterById(gameState, pro.currentPromoterId),
      manager: getManagerById(gameState, pro.currentManagerId),
      background: background,
      organizations: organizations
    };
  }

  function simulateNpcTitleWorld(gameState, weekValue) {
    var orgTemplates = listTitleOrganizations();
    var i;
    simulateWorldRankingBouts(gameState, weekValue);
    for (i = 0; i < orgTemplates.length; i += 1) {
      maybeRunTitleActivity(gameState, orgTemplates[i], weekValue);
    }
  }

  function runWeeklyPass(gameState, options) {
    var opts = options || {};
    var weekValue = typeof opts.absoluteWeek === "number" ? opts.absoluteWeek : currentWeek(gameState);
    ensureState(gameState);
    simulateNpcTitleWorld(gameState, weekValue);
    refreshRankings(gameState, { week: weekValue, simulateWorld: false });
    return gameState;
  }

  function ensureState(gameState) {
    playerRoot(gameState);
    ensureOrgBuckets(gameState);
    ensureCompetitionBuckets(gameState);
    ensureEntities(gameState);
    refreshRankings(gameState, { week: currentWeek(gameState), simulateWorld: false });
    return gameState;
  }

  return {
    createProState: createProState,
    normalizeProState: normalizeProState,
    ensureState: ensureState,
    runWeeklyPass: runWeeklyPass,
    canTurnPro: canTurnPro,
    enterProTrack: enterProTrack,
    getPromoterById: getPromoterById,
    getManagerById: getManagerById,
    getOrganizationById: getOrganizationById,
    listPromotersByCountry: listPromotersByCountry,
    listManagersByCountry: listManagersByCountry,
    getContenderStatus: getStatus,
    listEligibleOfferTemplates: listEligibleOfferTemplates,
    getOfferTemplate: getOfferTemplate,
    explainOffer: explainOffer,
    buildOfferContext: pickOfferContext,
    rememberOffers: rememberOffers,
    summary: summary,
    applyFightResult: applyFightResult,
    playerBackground: playerBackground,
    listOrganizationSummaries: buildOrganizationSummaries,
    computeProValue: computeProValue
  };
})();
