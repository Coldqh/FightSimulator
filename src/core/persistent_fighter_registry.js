var PersistentFighterRegistry = (function () {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function entityBase() {
    return {
      id: "",
      firstName: "",
      lastName: "",
      nickname: "",
      name: "",
      fullName: "",
      country: "",
      age: 16,
      birthWeek: 1,
      birthYear: 2005,
      currentTrack: "street",
      trackId: "street",
      style: "",
      styleId: "",
      archetypeId: "",
      attributes: { str: 1, tec: 1, spd: 1, end: 1, vit: 1 },
      stats: { str: 1, tec: 1, spd: 1, end: 1, vit: 1 },
      growthProfile: {},
      healthState: { health: 100, injuries: [] },
      wearState: { wear: 0, fatigue: 0 },
      moraleState: { morale: 55 },
      currentGymId: "",
      currentTrainerId: "",
      currentCoachId: "",
      currentPromoterId: "",
      currentManagerId: "",
      currentOrganizationId: "",
      gymId: "",
      trainerId: "",
      streetRating: 0,
      streetData: {
        districtId: "",
        cityStreetStanding: 0,
        nationalStreetStanding: 0,
        undergroundTitles: [],
        localPromoterIds: [],
        undergroundPressureTags: [],
        currentSceneId: "",
        currentStatusId: "neighborhood_unknown"
      },
      amateurClass: "",
      amateurRank: "",
      amateurRecord: { wins: 0, losses: 0, draws: 0 },
      nationalTeamStatus: "none",
      amateurGoals: [],
      goalProfileId: "",
      worldHistoryHooks: [],
      encounterHooks: [],
      proRecord: { wins: 0, losses: 0, draws: 0, kos: 0 },
      proRankingData: {},
      contenderStatus: "",
      titleHistory: [],
      rankingSeed: 0,
      proReputationTags: [],
      formerAmateurStatus: "",
      formerNationalTeamStatus: "none",
      olympicBackground: "",
      fame: 0,
      reputationTags: [],
      relationshipHooks: [],
      biographyLogIds: [],
      status: "active",
      lastTrackTransitionWeek: 0,
      lastTeamStatusChangeWeek: 0,
      lastGymChangeWeek: 0,
      lastCoachChangeWeek: 0,
      lastUpdatedWeek: 0,
      record: { wins: 0, losses: 0, draws: 0, kos: 0 },
      tags: []
    };
  }

  function stableId(prefix, parts) {
    if (typeof WorldSimState !== "undefined" && WorldSimState.stableId) {
      return WorldSimState.stableId(prefix, parts);
    }
    return prefix + "_" + String(parts instanceof Array ? parts.join("_") : parts);
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
    return gameState.rosterState;
  }

  var rosterIndexCache = {
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
    mapObject[key].push(value);
  }

  function defaultRosterVersionToken(gameState) {
    var roster = rosterRoot(gameState);
    var calendar = gameState && gameState.career ? gameState.career.calendar || {} : {};
    return [
      roster.fighterIds.length,
      roster.gymIds ? roster.gymIds.length : 0,
      roster.trainerIds ? roster.trainerIds.length : 0,
      calendar.year || 0,
      calendar.week || 0
    ].join("|");
  }

  function rosterVersionToken(gameState, options) {
    return options && options.versionToken != null && options.versionToken !== "" ? String(options.versionToken) : defaultRosterVersionToken(gameState);
  }

  function buildRosterIndexes(gameState) {
    var roster = rosterRoot(gameState);
    var indexes = {
      fightersByTrack: {},
      fightersByCountry: {},
      fightersByGym: {},
      fightersByTrainer: {},
      fightersByTrackCountry: {},
      activeFighterIds: []
    };
    var i;
    var fighter;
    var trackId;
    var countryId;
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      fighter = roster.fightersById[roster.fighterIds[i]];
      if (!fighter || fighter.status === "retired") {
        continue;
      }
      trackId = fighter.currentTrack || fighter.trackId || "street";
      countryId = fighter.country || "";
      indexes.activeFighterIds.push(fighter.id);
      pushIndexValue(indexes.fightersByTrack, trackId, fighter.id);
      pushIndexValue(indexes.fightersByCountry, countryId, fighter.id);
      pushIndexValue(indexes.fightersByTrackCountry, trackId + "|" + countryId, fighter.id);
      if (fighter.currentGymId) {
        pushIndexValue(indexes.fightersByGym, fighter.currentGymId, fighter.id);
      }
      if (fighter.currentTrainerId) {
        pushIndexValue(indexes.fightersByTrainer, fighter.currentTrainerId, fighter.id);
      }
    }
    return indexes;
  }

  function ensureRosterIndexes(gameState, options) {
    var token = rosterVersionToken(gameState, options);
    if (rosterIndexCache.gameState !== gameState || rosterIndexCache.versionToken !== token || !rosterIndexCache.indexes) {
      rosterIndexCache.gameState = gameState;
      rosterIndexCache.versionToken = token;
      rosterIndexCache.indexes = buildRosterIndexes(gameState);
    }
    return rosterIndexCache.indexes;
  }

  function fightersFromIds(gameState, ids) {
    var roster = rosterRoot(gameState);
    var result = [];
    var i;
    var fighter;
    if (!(ids instanceof Array) || !ids.length) {
      return result;
    }
    for (i = 0; i < ids.length; i += 1) {
      fighter = roster.fightersById[ids[i]];
      if (fighter) {
        result.push(fighter);
      }
    }
    return result;
  }

  function monthAgeFromCalendar(gameState) {
    if (typeof TimeSystem !== "undefined" && TimeSystem.getAgeView && gameState && gameState.career) {
      return TimeSystem.getAgeView(gameState.player && gameState.player.conditions ? gameState.player.conditions.startingAge : 21, gameState.career.calendar);
    }
    return { years: 21, months: 0 };
  }

  function splitDisplayName(fullName) {
    var label = String(fullName || "");
    var firstQuote = label.indexOf('"');
    var lastQuote = label.lastIndexOf('"');
    var firstName = "";
    var lastName = "";
    var nickname = "";
    var parts;
    if (firstQuote >= 0 && lastQuote > firstQuote) {
      firstName = label.substring(0, firstQuote).replace(/^\s+|\s+$/g, "");
      nickname = label.substring(firstQuote + 1, lastQuote).replace(/^\s+|\s+$/g, "");
      lastName = label.substring(lastQuote + 1).replace(/^\s+|\s+$/g, "");
      return {
        firstName: firstName,
        lastName: lastName,
        nickname: nickname
      };
    }
    parts = label.split(" ");
    firstName = parts.length ? parts[0] : "";
    if (parts.length > 1) {
      lastName = parts.slice(1).join(" ");
    }
    return {
      firstName: firstName,
      lastName: lastName,
      nickname: ""
    };
  }

  function canonicalFocusId(focusId) {
    if (focusId === "sparring") {
      return "technique";
    }
    return typeof focusId === "string" && focusId ? focusId : "technique";
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
    var first = String(firstName || "").replace(/^\s+|\s+$/g, "");
    var last = String(lastName || "").replace(/^\s+|\s+$/g, "");
    var nick = trackAllowsNickname(trackId) ? sanitizeNicknameWord(nickname) : "";
    if (nick) {
      return first + ' "' + nick + '" ' + last;
    }
    return first + (last ? (" " + last) : "");
  }

  function applyIdentityRules(entity, trackId) {
    var activeTrackId = trackId || entity.currentTrack || entity.trackId || "street";
    entity.nickname = trackAllowsNickname(activeTrackId) ? sanitizeNicknameWord(entity.nickname) : "";
    entity.name = entity.firstName + (entity.lastName ? (" " + entity.lastName) : "");
    entity.fullName = buildDisplayName(entity.firstName, entity.lastName, entity.nickname, activeTrackId);
    return entity;
  }

  function profileFromStyle(styleId) {
    if (styleId === "outboxer") {
      return "jab_control";
    }
    if (styleId === "counterpuncher") {
      return "counterpace";
    }
    if (styleId === "puncher") {
      return "body_hunter";
    }
    return "pressure";
  }

  function mappedSlotForTrack(prefix, slot, trackId) {
    var number = typeof slot === "number" ? slot : parseInt(slot, 10);
    if (isNaN(number) || number <= 0) {
      return 0;
    }
    if (trackId === "street") {
      if (number <= 2) { return 6; }
      if (number <= 4) { return 7; }
      return 6;
    }
    if (trackId === "pro") {
      if (number >= 5) { return 8; }
      return 7;
    }
    return number;
  }

  function resolveSlotId(countryId, prefix, slot, trackId) {
    var number = typeof slot === "number" ? slot : parseInt(slot, 10);
    if (isNaN(number) || number <= 0) {
      return "";
    }
    return countryId + "_" + prefix + "_" + mappedSlotForTrack(prefix, number, trackId || "street");
  }

  function buildSeedEntity(seed, trackId) {
    var entity = entityBase();
    entity.id = seed.id;
    entity.firstName = seed.firstName || "";
    entity.lastName = seed.lastName || "";
    entity.nickname = seed.nickname || "";
    applyIdentityRules(entity, trackId);
    entity.country = seed.country || "";
    entity.age = typeof seed.age === "number" ? seed.age : 21;
    entity.birthWeek = typeof seed.birthWeek === "number" ? seed.birthWeek : 1;
    entity.birthYear = typeof seed.birthYear === "number" ? seed.birthYear : (2026 - entity.age);
    entity.currentTrack = trackId;
    entity.trackId = trackId;
    entity.style = seed.style || "";
    entity.styleId = seed.style || "";
    entity.archetypeId = seed.archetypeId || "";
    entity.attributes = clone(seed.attributes || entity.attributes);
    entity.stats = clone(entity.attributes);
    entity.growthProfile = clone(seed.growthProfile || {});
    entity.growthProfile.focusId = canonicalFocusId(entity.growthProfile.focusId);
    entity.healthState = { health: typeof seed.health === "number" ? seed.health : 100, injuries: clone(seed.injuries || []) };
    entity.wearState = { wear: typeof seed.wear === "number" ? seed.wear : 0, fatigue: typeof seed.fatigue === "number" ? seed.fatigue : 0 };
    entity.moraleState = { morale: typeof seed.morale === "number" ? seed.morale : 55 };
    entity.currentGymId = seed.currentGymId || resolveSlotId(seed.country, "gym", seed.gymSlot, trackId);
    entity.currentTrainerId = seed.currentTrainerId || resolveSlotId(seed.country, "trainer", seed.trainerSlot, trackId);
    entity.currentCoachId = seed.currentCoachId || entity.currentTrainerId;
    entity.currentPromoterId = seed.currentPromoterId || "";
    entity.currentManagerId = seed.currentManagerId || "";
    entity.currentOrganizationId = seed.currentOrganizationId || "";
    entity.gymId = entity.currentGymId;
    entity.trainerId = entity.currentTrainerId;
    entity.streetRating = typeof seed.streetRating === "number" ? seed.streetRating : 0;
    entity.streetData = seed.streetData ? clone(seed.streetData) : clone(entity.streetData);
    entity.amateurClass = seed.amateurClass || "";
    entity.amateurRank = seed.amateurRank || entity.amateurClass || "";
    entity.amateurRecord = clone(seed.amateurRecord || entity.amateurRecord);
    entity.nationalTeamStatus = seed.nationalTeamStatus || "none";
    entity.amateurGoals = clone(seed.amateurGoals || []);
    entity.goalProfileId = seed.goalProfileId || "";
    entity.worldHistoryHooks = clone(seed.worldHistoryHooks || []);
    entity.encounterHooks = clone(seed.encounterHooks || []);
    entity.proRecord = clone(seed.proRecord || entity.proRecord);
    entity.proRankingData = clone(seed.proRankingData || {});
    entity.contenderStatus = seed.contenderStatus || "";
    entity.titleHistory = clone(seed.titleHistory || []);
    entity.rankingSeed = typeof seed.rankingSeed === "number" ? seed.rankingSeed : 0;
    entity.proReputationTags = clone(seed.proReputationTags || []);
    entity.formerAmateurStatus = seed.formerAmateurStatus || "";
    entity.formerNationalTeamStatus = seed.formerNationalTeamStatus || "none";
    entity.olympicBackground = seed.olympicBackground || "";
    entity.fame = typeof seed.fame === "number" ? seed.fame : 0;
    entity.reputationTags = clone(seed.reputationTags || []);
    entity.relationshipHooks = clone(seed.relationshipHooks || []);
    entity.biographyLogIds = clone(seed.biographyLogIds || []);
    entity.lastTrackTransitionWeek = typeof seed.lastTrackTransitionWeek === "number" ? seed.lastTrackTransitionWeek : 0;
    entity.lastTeamStatusChangeWeek = typeof seed.lastTeamStatusChangeWeek === "number" ? seed.lastTeamStatusChangeWeek : 0;
    entity.lastGymChangeWeek = typeof seed.lastGymChangeWeek === "number" ? seed.lastGymChangeWeek : 0;
    entity.lastCoachChangeWeek = typeof seed.lastCoachChangeWeek === "number" ? seed.lastCoachChangeWeek : 0;
    entity.lastUpdatedWeek = 0;
    if (trackId === "street") {
      entity.record.wins = entity.streetRating > 0 ? Math.max(0, Math.round(entity.streetRating / 6)) : 0;
      entity.record.losses = Math.max(0, Math.round(entity.record.wins / 3));
    } else if (trackId === "amateur") {
      entity.record.wins = entity.amateurRecord.wins || 0;
      entity.record.losses = entity.amateurRecord.losses || 0;
      entity.record.draws = entity.amateurRecord.draws || 0;
    } else {
      entity.record.wins = entity.proRecord.wins || 0;
      entity.record.losses = entity.proRecord.losses || 0;
      entity.record.draws = entity.proRecord.draws || 0;
      entity.record.kos = entity.proRecord.kos || 0;
    }
    entity.tags = clone(seed.reputationTags || []);
    return entity;
  }

  function mergeEntity(target, incoming) {
    var key;
    if (!target) {
      return clone(incoming);
    }
    for (key in incoming) {
      if (incoming.hasOwnProperty(key)) {
        if (target[key] == null || target[key] === "" || (target[key] instanceof Array && !target[key].length)) {
          target[key] = clone(incoming[key]);
        }
      }
    }
    return target;
  }

  function ensureSeedRoster(gameState) {
    var roster = rosterRoot(gameState);
    var seeds = [];
    var tracks = ["street", "amateur", "pro"];
    var trackSeeds = [];
    var i;
    var j;
    var entity;
    var existing;
    if (typeof ContentLoader !== "undefined" && ContentLoader.listSeedRoster) {
      for (i = 0; i < tracks.length; i += 1) {
        trackSeeds = ContentLoader.listSeedRoster(tracks[i]) || [];
        for (j = 0; j < trackSeeds.length; j += 1) {
          seeds.push(trackSeeds[j]);
        }
      }
    }
    for (i = 0; i < seeds.length; i += 1) {
      entity = buildSeedEntity(seeds[i], seeds[i].currentTrack || seeds[i].trackId || "street");
      existing = roster.fightersById[entity.id];
      roster.fightersById[entity.id] = mergeEntity(existing, entity);
      if (!existing) {
        roster.fighterIds.push(entity.id);
      }
    }
    return roster;
  }

  function buildPlayerEntity(gameState) {
    var entity = entityBase();
    var nameParts = splitDisplayName(gameState && gameState.player && gameState.player.profile ? gameState.player.profile.name : "");
    var ageView = monthAgeFromCalendar(gameState);
    var styleId = "";
    var bestScore = -1;
    var key;
    var styleProgress = gameState && gameState.player && gameState.player.development ? gameState.player.development.styleProgress : null;
    entity.id = "fighter_player_main";
    entity.isPlayer = true;
    entity.firstName = nameParts.firstName;
    entity.lastName = nameParts.lastName;
    entity.nickname = nameParts.nickname;
    entity.country = gameState && gameState.player && gameState.player.profile ? gameState.player.profile.currentCountry || "" : "";
    entity.age = ageView.years || 16;
    entity.birthWeek = 1;
    entity.birthYear = 2026 - entity.age;
    entity.currentTrack = gameState && gameState.playerState ? gameState.playerState.currentTrackId || "street" : "street";
    entity.trackId = entity.currentTrack;
    applyIdentityRules(entity, entity.currentTrack);
    if (styleProgress) {
      for (key in styleProgress) {
        if (styleProgress.hasOwnProperty(key) && typeof styleProgress[key] === "number" && styleProgress[key] > bestScore) {
          bestScore = styleProgress[key];
          styleId = key;
        }
      }
    }
    entity.style = styleId;
    entity.styleId = styleId;
    entity.attributes = clone(gameState && gameState.player ? gameState.player.stats : entity.attributes);
    entity.stats = clone(entity.attributes);
    entity.growthProfile = clone(gameState && gameState.player ? gameState.player.development || {} : {});
    entity.growthProfile.focusId = canonicalFocusId(entity.growthProfile.focusId);
    entity.healthState = { health: gameState && gameState.player && gameState.player.resources ? gameState.player.resources.health || 100 : 100, injuries: clone(gameState && gameState.player && gameState.player.conditions ? gameState.player.conditions.injuries || [] : []) };
    entity.wearState = { wear: gameState && gameState.player && gameState.player.conditions ? gameState.player.conditions.wear || 0 : 0, fatigue: gameState && gameState.player && gameState.player.conditions ? gameState.player.conditions.fatigue || 0 : 0 };
    entity.moraleState = { morale: gameState && gameState.player && gameState.player.conditions ? gameState.player.conditions.morale || 55 : 55 };
    entity.currentGymId = gameState && gameState.world && gameState.world.gymMembership ? gameState.world.gymMembership.gymId || "" : "";
    entity.currentTrainerId = gameState && gameState.world && gameState.world.trainerAssignment ? (gameState.world.trainerAssignment.trainerId || gameState.world.trainerAssignment.trainerTypeId || gameState.world.trainerAssignment.npcId || "") : "";
    entity.currentCoachId = gameState && gameState.world && gameState.world.trainerAssignment ? (gameState.world.trainerAssignment.npcId || "") : "";
    entity.currentPromoterId = gameState && gameState.player && gameState.player.pro ? gameState.player.pro.currentPromoterId || "" : "";
    entity.currentManagerId = gameState && gameState.player && gameState.player.pro ? gameState.player.pro.currentManagerId || "" : "";
    entity.currentOrganizationId = gameState && gameState.player && gameState.player.amateur ? gameState.player.amateur.currentOrganizationId || "" : "";
    entity.gymId = entity.currentGymId;
    entity.trainerId = entity.currentTrainerId;
    entity.streetRating = gameState && gameState.player && gameState.player.street ? gameState.player.street.streetRating || 0 : ((gameState && gameState.player && gameState.player.record ? gameState.player.record.wins || 0 : 0) * 3 + (gameState && gameState.player && gameState.player.resources ? gameState.player.resources.fame || 0 : 0));
    entity.streetData = gameState && gameState.player && gameState.player.street ? clone(gameState.player.street) : clone(entity.streetData);
    entity.amateurClass = gameState && gameState.player && gameState.player.amateur ? gameState.player.amateur.rankId || "" : "";
    entity.amateurRank = entity.amateurClass;
    entity.amateurRecord = gameState && gameState.player && gameState.player.amateur && gameState.player.amateur.record ? clone(gameState.player.amateur.record) : { wins: 0, losses: 0, draws: 0 };
    entity.nationalTeamStatus = gameState && gameState.player && gameState.player.amateur ? gameState.player.amateur.nationalTeamStatus || "none" : "none";
    entity.amateurGoals = gameState && gameState.player && gameState.player.amateur && gameState.player.amateur.eligibleLevels instanceof Array ? clone(gameState.player.amateur.eligibleLevels) : [];
    entity.goalProfileId = gameState && gameState.player && gameState.player.profile ? (gameState.player.profile.styleId || "") : "";
    entity.worldHistoryHooks = [];
    entity.encounterHooks = [];
    entity.proRecord = gameState && gameState.player && gameState.player.pro && gameState.player.pro.proRecord ? clone(gameState.player.pro.proRecord) : { wins: 0, losses: 0, draws: 0, kos: 0 };
    entity.proRankingData = { rankingSeed: gameState && gameState.player && gameState.player.pro ? gameState.player.pro.rankingSeed || 0 : 0 };
    entity.contenderStatus = gameState && gameState.player && gameState.player.pro ? gameState.player.pro.contenderStatus || "" : "";
    entity.titleHistory = gameState && gameState.player && gameState.player.pro && gameState.player.pro.titleHistory instanceof Array ? clone(gameState.player.pro.titleHistory) : [];
    entity.rankingSeed = gameState && gameState.player && gameState.player.pro ? gameState.player.pro.rankingSeed || 0 : 0;
    entity.proReputationTags = gameState && gameState.player && gameState.player.pro && gameState.player.pro.proReputationTags instanceof Array ? clone(gameState.player.pro.proReputationTags) : [];
    entity.formerAmateurStatus = gameState && gameState.player && gameState.player.pro ? gameState.player.pro.formerAmateurStatus || "" : "";
    entity.formerNationalTeamStatus = gameState && gameState.player && gameState.player.pro ? gameState.player.pro.formerNationalTeamStatus || "none" : "none";
    entity.olympicBackground = gameState && gameState.player && gameState.player.pro ? gameState.player.pro.olympicBackground || "" : "";
    entity.fame = gameState && gameState.player && gameState.player.resources ? gameState.player.resources.fame || 0 : 0;
    entity.reputationTags = clone(gameState && gameState.player && gameState.player.biography ? gameState.player.biography.reputationTags || [] : []);
    entity.relationshipHooks = [];
    entity.biographyLogIds = [];
    entity.status = gameState && gameState.career && gameState.career.endingReason ? "retired" : "active";
    entity.lastTrackTransitionWeek = 0;
    entity.lastTeamStatusChangeWeek = 0;
    entity.lastGymChangeWeek = 0;
    entity.lastCoachChangeWeek = 0;
    entity.lastUpdatedWeek = gameState && gameState.career ? gameState.career.week || 1 : 1;
    if (entity.currentTrack === "pro") {
      entity.record.wins = entity.proRecord.wins || 0;
      entity.record.losses = entity.proRecord.losses || 0;
      entity.record.draws = entity.proRecord.draws || 0;
      entity.record.kos = entity.proRecord.kos || 0;
    } else {
      entity.record.wins = gameState && gameState.player && gameState.player.record ? gameState.player.record.wins || 0 : 0;
      entity.record.losses = gameState && gameState.player && gameState.player.record ? gameState.player.record.losses || 0 : 0;
      entity.record.draws = gameState && gameState.player && gameState.player.record ? gameState.player.record.draws || 0 : 0;
      entity.record.kos = gameState && gameState.player && gameState.player.record ? gameState.player.record.kos || 0 : 0;
    }
    entity.tags = clone(entity.reputationTags);
    return entity;
  }

  function findByNameCountry(roster, snapshot) {
    var i;
    var candidate;
    var country = snapshot.countryKey || snapshot.country || "";
    var firstName = snapshot.firstName || "";
    var lastName = snapshot.lastName || "";
    var trackId = snapshot.currentTrack || snapshot.trackId || (snapshot.amateurRank || snapshot.amateurClass ? "amateur" : "street");
    var nickname = trackAllowsNickname(trackId) ? sanitizeNicknameWord(snapshot.nickname || "") : "";
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      candidate = roster.fightersById[roster.fighterIds[i]];
      if (!candidate || candidate.isPlayer) {
        continue;
      }
      if (candidate.country === country &&
          candidate.firstName === firstName &&
          candidate.lastName === lastName &&
          (trackAllowsNickname(candidate.currentTrack || candidate.trackId || "street") ? sanitizeNicknameWord(candidate.nickname || "") : "") === nickname) {
        return candidate;
      }
    }
    return null;
  }

  function createMigratedEntity(snapshot, preferredTrack) {
    var nameParts = splitDisplayName(snapshot && (snapshot.fullName || snapshot.name || ""));
    var entity = entityBase();
    var stats = snapshot && snapshot.stats ? snapshot.stats : {};
    var trackId = preferredTrack || snapshot.currentTrack || snapshot.trackId || "street";
    var sanitizedNickname = trackAllowsNickname(trackId) ? sanitizeNicknameWord(snapshot.nickname || nameParts.nickname || "") : "";
    entity.id = stableId("fighter_migrated", [snapshot && (snapshot.countryKey || snapshot.country || "world"), snapshot && (snapshot.firstName || nameParts.firstName || "fighter"), snapshot && (snapshot.lastName || nameParts.lastName || "unknown"), sanitizedNickname]);
    entity.firstName = snapshot.firstName || nameParts.firstName || "Unknown";
    entity.lastName = snapshot.lastName || nameParts.lastName || "Fighter";
    entity.nickname = sanitizedNickname;
    applyIdentityRules(entity, trackId);
    entity.country = snapshot.countryKey || snapshot.country || "";
    entity.age = typeof snapshot.age === "number" ? snapshot.age : 24;
    entity.birthWeek = 1;
    entity.birthYear = 2026 - entity.age;
    entity.currentTrack = trackId;
    entity.trackId = entity.currentTrack;
    entity.style = snapshot.styleId || "";
    entity.styleId = snapshot.styleId || "";
    entity.archetypeId = snapshot.archetypeId || "";
    entity.attributes.str = typeof stats.str === "number" ? stats.str : 1;
    entity.attributes.tec = typeof stats.tec === "number" ? stats.tec : 1;
    entity.attributes.spd = typeof stats.spd === "number" ? stats.spd : 1;
    entity.attributes.end = typeof stats.end === "number" ? stats.end : 1;
    entity.attributes.vit = typeof stats.vit === "number" ? stats.vit : 1;
    entity.stats = clone(entity.attributes);
    entity.growthProfile = { focusId: canonicalFocusId(snapshot.focusId || "technique"), ceiling: 55, volatility: 5, migrated: true };
    entity.healthState = {
      health: typeof snapshot.condition === "number" ? snapshot.condition : (typeof snapshot.health === "number" ? snapshot.health : 100),
      injuries: clone(snapshot.injuries || [])
    };
    entity.wearState = {
      wear: typeof snapshot.wear === "number" ? snapshot.wear : Math.max(0, Math.round((100 - entity.healthState.health) * 0.4)),
      fatigue: typeof snapshot.fatigue === "number" ? snapshot.fatigue : 0
    };
    entity.moraleState = { morale: typeof snapshot.morale === "number" ? snapshot.morale : 55 };
    entity.currentGymId = snapshot.gymId || "";
    entity.currentTrainerId = snapshot.trainerTypeId || snapshot.trainerId || "";
    entity.currentCoachId = snapshot.trainerId || snapshot.trainerTypeId || "";
    entity.currentPromoterId = snapshot.currentPromoterId || "";
    entity.currentManagerId = "";
    entity.currentOrganizationId = snapshot.currentOrganizationId || "";
    entity.gymId = entity.currentGymId;
    entity.trainerId = entity.currentTrainerId;
    entity.streetRating = typeof snapshot.streetRating === "number" ? snapshot.streetRating : ((entity.attributes.str + entity.attributes.tec + entity.attributes.spd + entity.attributes.end + entity.attributes.vit) * 2);
    entity.streetData = snapshot.streetData ? clone(snapshot.streetData) : clone(entity.streetData);
    entity.amateurRank = snapshot.amateurRank || snapshot.amateurClass || "";
    entity.nationalTeamStatus = snapshot.nationalTeamStatus || "none";
    entity.amateurGoals = snapshot.amateurGoals instanceof Array ? clone(snapshot.amateurGoals) : [];
    entity.goalProfileId = snapshot.goalProfileId || "";
    entity.worldHistoryHooks = snapshot.worldHistoryHooks instanceof Array ? clone(snapshot.worldHistoryHooks) : [];
    entity.encounterHooks = snapshot.encounterHooks instanceof Array ? clone(snapshot.encounterHooks) : [];
    entity.proRecord = snapshot.proRecord ? clone(snapshot.proRecord) : clone(entity.proRecord);
    entity.contenderStatus = snapshot.contenderStatus || "";
    entity.titleHistory = snapshot.titleHistory instanceof Array ? clone(snapshot.titleHistory) : [];
    entity.rankingSeed = typeof snapshot.rankingSeed === "number" ? snapshot.rankingSeed : 0;
    entity.proReputationTags = snapshot.proReputationTags instanceof Array ? clone(snapshot.proReputationTags) : [];
    entity.formerAmateurStatus = snapshot.formerAmateurStatus || "";
    entity.formerNationalTeamStatus = snapshot.formerNationalTeamStatus || "none";
    entity.olympicBackground = snapshot.olympicBackground || "";
    entity.fame = typeof snapshot.fame === "number" ? snapshot.fame : 0;
    entity.reputationTags = [];
    entity.relationshipHooks = ["migrated_save"];
    entity.biographyLogIds = [];
    entity.status = "active";
    entity.lastTrackTransitionWeek = typeof snapshot.lastTrackTransitionWeek === "number" ? snapshot.lastTrackTransitionWeek : 0;
    entity.lastTeamStatusChangeWeek = typeof snapshot.lastTeamStatusChangeWeek === "number" ? snapshot.lastTeamStatusChangeWeek : 0;
    entity.lastGymChangeWeek = typeof snapshot.lastGymChangeWeek === "number" ? snapshot.lastGymChangeWeek : 0;
    entity.lastCoachChangeWeek = typeof snapshot.lastCoachChangeWeek === "number" ? snapshot.lastCoachChangeWeek : 0;
    entity.record.wins = typeof snapshot.wins === "number" ? snapshot.wins : 0;
    entity.record.losses = typeof snapshot.losses === "number" ? snapshot.losses : 0;
    entity.record.kos = typeof snapshot.kos === "number" ? snapshot.kos : 0;
    return entity;
  }

  function ensureFighterEntity(gameState, snapshot, preferredTrack) {
    var roster = rosterRoot(gameState);
    var fighter;
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }
    if (snapshot.fighterId && roster.fightersById[snapshot.fighterId]) {
      return roster.fightersById[snapshot.fighterId];
    }
    fighter = findByNameCountry(roster, snapshot);
    if (fighter) {
      snapshot.fighterId = fighter.id;
      return fighter;
    }
    fighter = createMigratedEntity(snapshot, preferredTrack);
    if (!roster.fightersById[fighter.id]) {
      roster.fighterIds.push(fighter.id);
    }
    roster.fightersById[fighter.id] = fighter;
    snapshot.fighterId = fighter.id;
    return fighter;
  }

  function getFighterById(source, fighterId) {
    var roster = source && source.rosterState ? source.rosterState : source;
    if (!roster || !roster.fightersById) {
      return null;
    }
    return roster.fightersById[fighterId] || null;
  }

  function getFightersByTrack(gameState, trackId, options) {
    var indexes = ensureRosterIndexes(gameState, options);
    return fightersFromIds(gameState, indexes.fightersByTrack[trackId || "street"] || []);
  }

  function getFightersByCountry(gameState, countryId, options) {
    var indexes = ensureRosterIndexes(gameState, options);
    return fightersFromIds(gameState, indexes.fightersByCountry[countryId || ""] || []);
  }

  function getFightersByGym(gameState, gymId, options) {
    var indexes = ensureRosterIndexes(gameState, options);
    return fightersFromIds(gameState, indexes.fightersByGym[gymId || ""] || []);
  }

  function getFightersByTrainer(gameState, trainerId, options) {
    var indexes = ensureRosterIndexes(gameState, options);
    return fightersFromIds(gameState, indexes.fightersByTrainer[trainerId || ""] || []);
  }

  function getFightersByTrackCountry(gameState, trackId, countryId, options) {
    var indexes = ensureRosterIndexes(gameState, options);
    return fightersFromIds(gameState, indexes.fightersByTrackCountry[(trackId || "street") + "|" + (countryId || "")] || []);
  }

  function chooseClosestFighter(gameState, trackId, countryId, tier, playerStats, excludedId) {
    var pool = getFightersByTrack(gameState, trackId);
    var byCountry = [];
    var filtered = [];
    var i;
    var fighter;
    var playerStatBlock = playerStats || {};
    var fighterStatBlock;
    var playerTotal = (playerStatBlock.str || 0) + (playerStatBlock.tec || 0) + (playerStatBlock.spd || 0) + (playerStatBlock.end || 0) + (playerStatBlock.vit || 0);
    var best = null;
    var bestDelta = 9999;
    for (i = 0; i < pool.length; i += 1) {
      fighter = pool[i];
      if (fighter.id === excludedId || fighter.isPlayer) {
        continue;
      }
      if (fighter.country === countryId) {
        byCountry.push(fighter);
      }
    }
    filtered = byCountry.length ? byCountry : pool;
    for (i = 0; i < filtered.length; i += 1) {
      fighter = filtered[i];
      fighterStatBlock = fighter && fighter.attributes ? fighter.attributes : (fighter && fighter.stats ? fighter.stats : {});
      var fighterTotal = (fighterStatBlock.str || 0) + (fighterStatBlock.tec || 0) + (fighterStatBlock.spd || 0) + (fighterStatBlock.end || 0) + (fighterStatBlock.vit || 0);
      var delta = fighterTotal - playerTotal;
      if (tier === "safe" && delta > 2) {
        continue;
      }
      if (tier === "danger" && delta < -1) {
        continue;
      }
      if (tier === "even" && (delta < -2 || delta > 3)) {
        continue;
      }
      if (Math.abs(delta) < bestDelta) {
        best = fighter;
        bestDelta = Math.abs(delta);
      }
    }
    if (best) {
      return best;
    }
    if (filtered.length) {
      return filtered[0];
    }
    return null;
  }

  function buildOpponentSnapshot(entity, existingSnapshot, countryInfo) {
    var snapshot = clone(existingSnapshot || {});
    var country = entity.country || (countryInfo ? countryInfo.id : "");
    var trackId = entity.currentTrack || entity.trackId || snapshot.currentTrack || snapshot.trackId || "street";
    snapshot.fighterId = entity.id;
    snapshot.firstName = entity.firstName;
    snapshot.lastName = entity.lastName;
    snapshot.nickname = trackAllowsNickname(trackId) ? sanitizeNicknameWord(entity.nickname) : "";
    snapshot.fullName = buildDisplayName(entity.firstName, entity.lastName, snapshot.nickname, trackId);
    snapshot.countryKey = country;
    snapshot.stats = clone(entity.attributes || entity.stats);
    snapshot.styleId = entity.styleId || entity.style || "";
    snapshot.profileId = snapshot.profileId || profileFromStyle(snapshot.styleId);
    snapshot.condition = entity.healthState && typeof entity.healthState.health === "number" ? entity.healthState.health : (typeof snapshot.condition === "number" ? snapshot.condition : 100);
    snapshot.injuries = clone(entity.healthState && entity.healthState.injuries ? entity.healthState.injuries : (snapshot.injuries || []));
    snapshot.wear = entity.wearState && typeof entity.wearState.wear === "number" ? entity.wearState.wear : (typeof snapshot.wear === "number" ? snapshot.wear : 0);
    snapshot.fatigue = entity.wearState && typeof entity.wearState.fatigue === "number" ? entity.wearState.fatigue : (typeof snapshot.fatigue === "number" ? snapshot.fatigue : 0);
    snapshot.morale = entity.moraleState && typeof entity.moraleState.morale === "number" ? entity.moraleState.morale : (typeof snapshot.morale === "number" ? snapshot.morale : 55);
    snapshot.gymId = entity.currentGymId || "";
    snapshot.trainerTypeId = entity.currentTrainerId || "";
    snapshot.archetypeId = entity.archetypeId || snapshot.archetypeId || "";
    snapshot.currentTrack = entity.currentTrack || entity.trackId || "";
    snapshot.goalProfileId = entity.goalProfileId || "";
    snapshot.nationalTeamStatus = entity.nationalTeamStatus || "none";
    snapshot.currentPromoterId = entity.currentPromoterId || "";
    snapshot.contenderStatus = entity.contenderStatus || "";
    snapshot.rankingSeed = typeof entity.rankingSeed === "number" ? entity.rankingSeed : 0;
    snapshot.proReputationTags = clone(entity.proReputationTags || []);
    snapshot.streetRating = typeof entity.streetRating === "number" ? entity.streetRating : 0;
    snapshot.streetData = clone(entity.streetData || {});
    snapshot.worldHistoryHooks = clone(entity.worldHistoryHooks || []);
    snapshot.encounterHooks = clone(entity.encounterHooks || []);
    snapshot.fame = typeof entity.fame === "number" ? entity.fame : 0;
    snapshot.wins = entity.record && typeof entity.record.wins === "number" ? entity.record.wins : 0;
    snapshot.losses = entity.record && typeof entity.record.losses === "number" ? entity.record.losses : 0;
    snapshot.draws = entity.record && typeof entity.record.draws === "number" ? entity.record.draws : 0;
    snapshot.kos = entity.record && typeof entity.record.kos === "number" ? entity.record.kos : 0;
    return snapshot;
  }

  function syncOfferRosterLinks(gameState) {
    var offers = gameState && gameState.world && gameState.world.offers ? gameState.world.offers.fightOffers || [] : [];
    var i;
    var fighter;
    for (i = 0; i < offers.length; i += 1) {
      if (!offers[i] || !offers[i].opponent) {
        continue;
      }
      fighter = ensureFighterEntity(gameState, offers[i].opponent, "street");
      if (fighter) {
        offers[i].fighterId = fighter.id;
        offers[i].opponent = buildOpponentSnapshot(fighter, offers[i].opponent);
      }
    }
  }

  function syncRivalryRosterLinks(gameState) {
    var rivalries = gameState && gameState.world ? gameState.world.rivalries || [] : [];
    var i;
    var fighter;
    for (i = 0; i < rivalries.length; i += 1) {
      if (!rivalries[i]) {
        continue;
      }
      if (rivalries[i].lastOpponentSnapshot) {
        fighter = ensureFighterEntity(gameState, rivalries[i].lastOpponentSnapshot, "street");
        if (fighter) {
          rivalries[i].opponentFighterId = fighter.id;
          rivalries[i].lastOpponentSnapshot = buildOpponentSnapshot(fighter, rivalries[i].lastOpponentSnapshot);
        }
      }
    }
  }

  function syncBattleRosterLinks(gameState) {
    if (gameState && gameState.battle && gameState.battle.current && gameState.battle.current.opponent) {
      var fighter = ensureFighterEntity(gameState, gameState.battle.current.opponent, "street");
      if (fighter) {
        gameState.battle.current.fighterId = fighter.id;
        gameState.battle.current.opponent = buildOpponentSnapshot(fighter, gameState.battle.current.opponent);
      }
    }
  }

  function refreshCompetitionLinks(gameState) {
    var competitions = gameState && gameState.competitionState ? gameState.competitionState.competitionsById || {} : {};
    var offers = gameState && gameState.world && gameState.world.offers ? gameState.world.offers.fightOffers || [] : [];
    var i;
    var offer;
    for (i = 0; i < offers.length; i += 1) {
      offer = offers[i];
      if (offer && offer.id && competitions[offer.id]) {
        competitions[offer.id].opponentFighterId = offer.fighterId || competitions[offer.id].opponentFighterId || "";
      }
    }
  }

  function enrichGameState(gameState) {
    var roster = ensureSeedRoster(gameState);
    var playerEntity = buildPlayerEntity(gameState);
    var activeCount = 0;
    var i;
    if (!roster.fightersById[playerEntity.id]) {
      roster.fighterIds.push(playerEntity.id);
    }
    roster.fightersById[playerEntity.id] = playerEntity;
    if (gameState.playerState) {
      gameState.playerState.fighterEntityId = playerEntity.id;
    }
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      if (roster.fighterIds[i] && roster.fightersById[roster.fighterIds[i]] && !roster.fightersById[roster.fighterIds[i]].isPlayer) {
        activeCount += 1;
        if (activeCount >= 100) {
          break;
        }
      }
    }
    if (activeCount < 100 && typeof WorldRankingsEngine !== "undefined" && WorldRankingsEngine.ensureMinimumRoster) {
      WorldRankingsEngine.ensureMinimumRoster(gameState);
    }
    syncOfferRosterLinks(gameState);
    syncRivalryRosterLinks(gameState);
    syncBattleRosterLinks(gameState);
    refreshCompetitionLinks(gameState);
    return gameState;
  }

  return {
    enrichGameState: enrichGameState,
    getFighterById: getFighterById,
    getFightersByTrack: getFightersByTrack,
    getFightersByCountry: getFightersByCountry,
    getFightersByGym: getFightersByGym,
    getFightersByTrainer: getFightersByTrainer,
    getFightersByTrackCountry: getFightersByTrackCountry,
    chooseClosestFighter: chooseClosestFighter,
    buildOpponentSnapshot: buildOpponentSnapshot,
    ensureFighterEntity: ensureFighterEntity,
    buildPlayerEntity: buildPlayerEntity
  };
}());
