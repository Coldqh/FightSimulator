var SAVE_VERSION = 35;

function clonePlainData(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function canonicalDevelopmentFocusId(focusId) {
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

function splitDisplayNameParts(displayName) {
  var label = String(displayName || "");
  var firstQuote = label.indexOf('"');
  var lastQuote = label.lastIndexOf('"');
  var parts;
  if (firstQuote >= 0 && lastQuote > firstQuote) {
    return {
      firstName: label.substring(0, firstQuote).replace(/^\s+|\s+$/g, ""),
      nickname: label.substring(firstQuote + 1, lastQuote).replace(/^\s+|\s+$/g, ""),
      lastName: label.substring(lastQuote + 1).replace(/^\s+|\s+$/g, "")
    };
  }
  parts = label.replace(/^\s+|\s+$/g, "").split(/\s+/);
  return {
    firstName: parts.length ? parts[0] : "",
    nickname: "",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : ""
  };
}

function trackAllowsNickname(trackId) {
  return trackId === "street" || trackId === "pro";
}

function inferTrackIdFromFighterLike(fighterLike, fallbackTrackId) {
  if (fighterLike && typeof fighterLike.currentTrack === "string" && fighterLike.currentTrack) {
    return fighterLike.currentTrack;
  }
  if (fighterLike && typeof fighterLike.trackId === "string" && fighterLike.trackId) {
    return fighterLike.trackId;
  }
  return fallbackTrackId || "street";
}

function buildDisplayNameForTrack(firstName, lastName, nickname, trackId) {
  var first = String(firstName || "").replace(/^\s+|\s+$/g, "");
  var last = String(lastName || "").replace(/^\s+|\s+$/g, "");
  var nick = trackAllowsNickname(trackId) ? sanitizeNicknameWord(nickname) : "";
  if (nick) {
    return first + ' "' + nick + '" ' + last;
  }
  return first + (last ? (" " + last) : "");
}

function normalizeFighterLikeIdentity(fighterLike, fallbackTrackId) {
  var trackId;
  var parts;
  if (!fighterLike || typeof fighterLike !== "object") {
    return fighterLike;
  }
  trackId = inferTrackIdFromFighterLike(fighterLike, fallbackTrackId);
  parts = splitDisplayNameParts(fighterLike.fullName || fighterLike.name || "");
  fighterLike.firstName = fighterLike.firstName || parts.firstName || "";
  fighterLike.lastName = fighterLike.lastName || parts.lastName || "";
  fighterLike.nickname = trackAllowsNickname(trackId) ? sanitizeNicknameWord(fighterLike.nickname || parts.nickname) : "";
  fighterLike.fullName = buildDisplayNameForTrack(fighterLike.firstName, fighterLike.lastName, fighterLike.nickname, trackId);
  return fighterLike;
}

function normalizePlayerProfileName(profile, trackId) {
  var parts;
  if (!profile || typeof profile !== "object") {
    return;
  }
  parts = splitDisplayNameParts(profile.name || "");
  profile.name = buildDisplayNameForTrack(parts.firstName, parts.lastName, parts.nickname, trackId || "street");
}

function normalizeRosterIdentityState(gameState) {
  var roster = gameState && gameState.rosterState ? gameState.rosterState : null;
  var ids;
  var i;
  var fighter;
  if (!roster || !(roster.fighterIds instanceof Array) || !roster.fightersById) {
    return;
  }
  ids = roster.fighterIds.slice(0);
  for (i = 0; i < ids.length; i += 1) {
    fighter = roster.fightersById[ids[i]];
    if (!fighter) {
      continue;
    }
    normalizeFighterLikeIdentity(fighter, fighter.currentTrack || fighter.trackId || "street");
    if (fighter.growthProfile && typeof fighter.growthProfile === "object") {
      fighter.growthProfile.focusId = canonicalDevelopmentFocusId(fighter.growthProfile.focusId);
    }
  }
}

function normalizeLegacyFightOfferSnapshots(gameState) {
  var offers = gameState && gameState.world && gameState.world.offers ? gameState.world.offers.fightOffers || [] : [];
  var worldOpponents = gameState && gameState.world ? gameState.world.opponents || [] : [];
  var battleOpponent = gameState && gameState.battle && gameState.battle.current ? gameState.battle.current.opponent : null;
  var rivalries = gameState && gameState.world ? gameState.world.rivalries || [] : [];
  var i;
  var trackId;
  for (i = 0; i < offers.length; i += 1) {
    if (!offers[i]) {
      continue;
    }
    trackId = offers[i].trackId || "street";
    if (offers[i].opponent) {
      normalizeFighterLikeIdentity(offers[i].opponent, trackId);
    }
  }
  for (i = 0; i < worldOpponents.length; i += 1) {
    normalizeFighterLikeIdentity(worldOpponents[i], worldOpponents[i] ? (worldOpponents[i].currentTrack || worldOpponents[i].trackId || "street") : "street");
  }
  if (battleOpponent) {
    normalizeFighterLikeIdentity(battleOpponent, gameState.battle.current.trackId || "street");
  }
  for (i = 0; i < rivalries.length; i += 1) {
    if (rivalries[i] && rivalries[i].lastOpponentSnapshot) {
      normalizeFighterLikeIdentity(rivalries[i].lastOpponentSnapshot, rivalries[i].lastOpponentSnapshot.currentTrack || rivalries[i].trackId || "street");
    }
  }
}

function basePlayerStatsSchema() {
  return {
    str: 1,
    tec: 1,
    spd: 1,
    end: 1,
    vit: 1
  };
}

function basePlayerConditionsSchema() {
  return {
    fatigue: 0,
    wear: 0,
    morale: 55,
    startingAge: 16,
    injuries: []
  };
}

function baseInjurySchema() {
  return {
    id: "",
    severity: 1,
    weeksLeft: 0,
    chronic: false,
    source: "",
    appliedWeek: 0
  };
}

function basePlayerLifeSchema() {
  return {
    housingId: "rough",
    livingMode: "family",
    support: 50,
    debtWeeks: 0
  };
}

function basePlayerAmateurSchema(startingAge) {
  if (typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.createAmateurState) {
    return JuniorAmateurSystem.createAmateurState(typeof startingAge === "number" ? startingAge : 16);
  }
  return {
    rankId: typeof startingAge === "number" && startingAge >= 18 ? "adult_class_3" : "junior_novice",
    score: typeof startingAge === "number" && startingAge >= 18 ? 120 : 0,
    tournamentPoints: 0,
    opponentQuality: 0,
    record: {
      wins: 0,
      losses: 0,
      draws: 0
    },
    lastRankWeek: 0,
    adultTransitionDone: typeof startingAge === "number" && startingAge >= 18,
    history: []
  };
}

function basePlayerStreetSchema(countryId, city) {
  if (typeof StreetCareerEngine !== "undefined" && StreetCareerEngine.createStreetState) {
    return StreetCareerEngine.createStreetState(countryId || "", city || "");
  }
  return {
    id: "player_street_main",
    streetRating: 0,
    districtId: "",
    cityStreetStanding: 0,
    nationalStreetStanding: 0,
    undergroundTitles: [],
    localPromoterIds: [],
    undergroundPressureTags: [],
    currentSceneId: "",
    currentStatusId: "neighborhood_unknown",
    history: []
  };
}

function basePlayerProSchema() {
  if (typeof ProCareerEngine !== "undefined" && ProCareerEngine.createProState) {
    return ProCareerEngine.createProState();
  }
  return {
    id: "player_pro_main",
    currentStageId: "unsigned",
    proRecord: {
      wins: 0,
      losses: 0,
      draws: 0,
      kos: 0
    },
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

function basePlayerPreparationSchema() {
  if (typeof SparringCampEngine !== "undefined" && SparringCampEngine.createPreparationState) {
    return SparringCampEngine.createPreparationState();
  }
  return {
    currentTargetFighterId: "",
    lastSparringWeek: 0,
    scoutingByFighterId: {},
    partnerHistoryByFighterId: {},
    activeCampId: "",
    lastCampCompletedWeek: 0,
    lastCampSummary: null,
    campHistory: []
  };
}

function basePlayerDevelopmentSchema() {
  return {
    focusId: "technique",
    totalXp: 0,
    perkPoints: 0,
    focusProgress: {
      endurance: 0,
      technique: 0,
      power: 0,
      defense: 0,
      recovery: 0
    },
    styleProgress: {
      outboxer: 0,
      puncher: 0,
      counterpuncher: 0,
      tempo: 0
    },
    activePerks: []
  };
}

function basePlayerBiographySchema() {
  return {
    flags: [],
    history: [],
    reputationTags: [],
    mediaFeed: [],
    chronicle: null,
    facts: {
      countriesVisited: [],
      travelHistory: [],
      keyFights: [],
      scandals: 0,
      interviews: 0,
      homeWins: 0,
      awayWins: 0,
      upsetWins: 0,
      rematches: 0,
      rivalFights: 0,
      rivalWins: 0,
      rivalLosses: 0,
      currentStreak: 0,
      bestStreak: 0,
      comebackWins: 0,
      lastFightResult: "",
      trainerChanges: 0,
      contractBreaks: 0,
      chronicInjuries: 0
    }
  };
}

function baseGymMembershipSchema() {
  return {
    gymId: "",
    joinedWeek: 0,
    country: "",
    city: "",
    gymType: "",
    cost: 0,
    weeklyCost: 0,
    reputation: 0,
    bonuses: {}
  };
}

function baseTrainerAssignmentSchema() {
  return {
    npcId: "",
    trainerId: "",
    trainerTypeId: "",
    gymId: "",
    trainerType: "",
    salary: 0,
    hiredWeek: 0,
    weeklyFee: 0,
    status: "active"
  };
}

function baseContractSchema() {
  return {
    id: "",
    templateId: "",
    promoterId: "",
    label: "",
    signedWeek: 0,
    endsWeek: 0,
    guaranteedPurse: 0,
    winBonus: 0,
    koBonus: 0,
    fameMultiplier: 1,
    fightFrequency: 1,
    toxicRisk: 0,
    reputationDelta: 0,
    conditionsText: "",
    status: "inactive"
  };
}

function baseRelationshipArcSchema() {
  return {
    id: "",
    templateId: "",
    label: "",
    status: "active",
    startedWeek: 0,
    lastStageWeek: 0,
    currentStageId: "",
    lastChoiceId: "",
    outcome: "",
    tags: [],
    actors: {},
    history: [],
    rivalryId: ""
  };
}

function baseRivalrySchema() {
  return {
    id: "",
    opponentKey: "",
    opponentFighterId: "",
    opponentName: "",
    countryKey: "",
    npcId: "",
    fightsCount: 0,
    playerWins: 0,
    opponentWins: 0,
    draws: 0,
    knockouts: 0,
    tension: 0,
    stakes: 0,
    active: true,
    pendingRematch: false,
    holdUntilWeek: 0,
    lastWeek: 0,
    lastResult: "",
    lastMethod: "",
    lastOpponentSnapshot: null,
    tags: [],
    history: []
  };
}

function baseWorldSchema() {
  return {
    opponents: [],
    offers: {
      weekStamp: 0,
      available: [],
      headline: "",
      fightOffers: [],
      contractOffers: []
    },
    npcs: [],
    relationships: [],
    relationshipArcs: [],
    rivalries: [],
    contracts: [],
    gymMembership: null,
    trainerAssignment: null,
    activeContract: null,
    eventState: {
      cooldowns: {},
      onceResolved: [],
      recentEvents: [],
      actionHistory: []
    },
    lastWeekAction: {
      type: "idle",
      label: "",
      meta: null
    },
    scene: {
      updatedWeek: 0,
      buzz: 0,
      temperature: 50
    }
  };
}

function ensureWorldSimSections(gameState, sourceState) {
  if (typeof WorldSimState !== "undefined" && WorldSimState.attachSections) {
    return WorldSimState.attachSections(gameState, sourceState || null);
  }
  if (!gameState.playerState) { gameState.playerState = {}; }
  if (!gameState.worldState) { gameState.worldState = {}; }
  if (!gameState.rosterState) { gameState.rosterState = {}; }
  if (!gameState.organizationState) { gameState.organizationState = {}; }
  if (!gameState.competitionState) { gameState.competitionState = {}; }
  if (!gameState.narrativeState) { gameState.narrativeState = {}; }
  return gameState;
}

function ensurePersistentRosterSections(gameState) {
  if (typeof PersistentFighterRegistry !== "undefined" && PersistentFighterRegistry.enrichGameState) {
    return PersistentFighterRegistry.enrichGameState(gameState);
  }
  return gameState;
}

function ensureAmateurEcosystemSections(gameState) {
  if (typeof AmateurEcosystem !== "undefined" && AmateurEcosystem.ensureOrganizations) {
    return AmateurEcosystem.ensureOrganizations(gameState);
  }
  return gameState;
}

function ensureAmateurSeasonSections(gameState) {
  if (typeof AmateurSeasonEngine !== "undefined" && AmateurSeasonEngine.ensureState) {
    AmateurSeasonEngine.ensureState(gameState);
  }
  return gameState;
}

function ensureWorldCareerSections(gameState) {
  if (typeof WorldCareerSimEngine !== "undefined" && WorldCareerSimEngine.ensureState) {
    WorldCareerSimEngine.ensureState(gameState);
  }
  return gameState;
}

function ensureEncounterHistorySections(gameState) {
  if (typeof EncounterHistoryEngine !== "undefined" && EncounterHistoryEngine.ensureState) {
    EncounterHistoryEngine.ensureState(gameState);
  } else {
    if (!gameState.worldState) { gameState.worldState = {}; }
    if (!gameState.worldState.worldCareer || typeof gameState.worldState.worldCareer !== "object") {
      gameState.worldState.worldCareer = {};
    }
    if (!(gameState.worldState.worldCareer.encounterHistoryIds instanceof Array)) { gameState.worldState.worldCareer.encounterHistoryIds = []; }
    if (!gameState.worldState.worldCareer.encounterHistoriesById || typeof gameState.worldState.worldCareer.encounterHistoriesById !== "object") { gameState.worldState.worldCareer.encounterHistoriesById = {}; }
    if (!gameState.worldState.worldCareer.encounterPairIndex || typeof gameState.worldState.worldCareer.encounterPairIndex !== "object") { gameState.worldState.worldCareer.encounterPairIndex = {}; }
  }
  return gameState;
}

function ensureWorldStorySections(gameState) {
  if (typeof WorldStoryEngine !== "undefined" && WorldStoryEngine.ensureState) {
    WorldStoryEngine.ensureState(gameState);
  } else {
    if (!gameState.narrativeState) { gameState.narrativeState = {}; }
    if (!(gameState.narrativeState.worldMediaIds instanceof Array)) { gameState.narrativeState.worldMediaIds = []; }
    if (!gameState.narrativeState.worldMediaById || typeof gameState.narrativeState.worldMediaById !== "object") { gameState.narrativeState.worldMediaById = {}; }
    if (!(gameState.narrativeState.worldLegendIds instanceof Array)) { gameState.narrativeState.worldLegendIds = []; }
    if (!gameState.narrativeState.worldLegendsById || typeof gameState.narrativeState.worldLegendsById !== "object") { gameState.narrativeState.worldLegendsById = {}; }
    if (!gameState.narrativeState.teamHistoryByCountryId || typeof gameState.narrativeState.teamHistoryByCountryId !== "object") { gameState.narrativeState.teamHistoryByCountryId = {}; }
    if (!gameState.narrativeState.titleHistoryByOrganizationId || typeof gameState.narrativeState.titleHistoryByOrganizationId !== "object") { gameState.narrativeState.titleHistoryByOrganizationId = {}; }
    if (!gameState.narrativeState.tournamentHistoryById || typeof gameState.narrativeState.tournamentHistoryById !== "object") { gameState.narrativeState.tournamentHistoryById = {}; }
    if (!gameState.narrativeState.streetHistoryByCountryId || typeof gameState.narrativeState.streetHistoryByCountryId !== "object") { gameState.narrativeState.streetHistoryByCountryId = {}; }
  }
  return gameState;
}

function ensureCareerTransitionSections(gameState) {
  if (typeof CareerTransitionEngine !== "undefined" && CareerTransitionEngine.ensureState) {
    CareerTransitionEngine.ensureState(gameState);
  } else {
    if (!gameState.narrativeState) { gameState.narrativeState = {}; }
    if (!(gameState.narrativeState.availableTransitionIds instanceof Array)) { gameState.narrativeState.availableTransitionIds = []; }
    if (!gameState.narrativeState.availableTransitionsById || typeof gameState.narrativeState.availableTransitionsById !== "object") { gameState.narrativeState.availableTransitionsById = {}; }
    if (!(gameState.narrativeState.transitionEventIds instanceof Array)) { gameState.narrativeState.transitionEventIds = []; }
    if (!gameState.narrativeState.transitionEventsById || typeof gameState.narrativeState.transitionEventsById !== "object") { gameState.narrativeState.transitionEventsById = {}; }
    if (!(gameState.narrativeState.transitionHistory instanceof Array)) { gameState.narrativeState.transitionHistory = []; }
    if (!(gameState.narrativeState.transitionNoticeQueue instanceof Array)) { gameState.narrativeState.transitionNoticeQueue = []; }
    if (!gameState.narrativeState.transitionEventStateById || typeof gameState.narrativeState.transitionEventStateById !== "object") { gameState.narrativeState.transitionEventStateById = {}; }
    if (typeof gameState.narrativeState.lastKnownTrackId !== "string") { gameState.narrativeState.lastKnownTrackId = ""; }
    if (typeof gameState.narrativeState.lastKnownNationalTeamStatus !== "string") { gameState.narrativeState.lastKnownNationalTeamStatus = "none"; }
    if (typeof gameState.narrativeState.lastTransitionSyncWeek !== "number") { gameState.narrativeState.lastTransitionSyncWeek = 0; }
  }
  return gameState;
}

function ensureStreetCareerSections(gameState) {
  if (typeof StreetCareerEngine !== "undefined" && StreetCareerEngine.ensureState) {
    StreetCareerEngine.ensureState(gameState);
  }
  return gameState;
}

function ensureProCareerSections(gameState) {
  if (typeof ProCareerEngine !== "undefined" && ProCareerEngine.ensureState) {
    ProCareerEngine.ensureState(gameState);
  } else {
    if (!gameState.player) { gameState.player = {}; }
    if (!gameState.player.pro || typeof gameState.player.pro !== "object") {
      gameState.player.pro = basePlayerProSchema();
    }
    if (!gameState.organizationState) { gameState.organizationState = {}; }
    if (!(gameState.organizationState.promoterIds instanceof Array)) { gameState.organizationState.promoterIds = []; }
    if (!gameState.organizationState.promotersById || typeof gameState.organizationState.promotersById !== "object") { gameState.organizationState.promotersById = {}; }
    if (!(gameState.organizationState.managerIds instanceof Array)) { gameState.organizationState.managerIds = []; }
    if (!gameState.organizationState.managersById || typeof gameState.organizationState.managersById !== "object") { gameState.organizationState.managersById = {}; }
    if (!gameState.competitionState) { gameState.competitionState = {}; }
    if (!(gameState.competitionState.proOfferIds instanceof Array)) { gameState.competitionState.proOfferIds = []; }
    if (!gameState.competitionState.proOffersById || typeof gameState.competitionState.proOffersById !== "object") { gameState.competitionState.proOffersById = {}; }
  }
  return gameState;
}

function ensureSparringCampSections(gameState) {
  if (typeof SparringCampEngine !== "undefined" && SparringCampEngine.ensureState) {
    SparringCampEngine.ensureState(gameState);
  } else {
    if (!gameState.player) { gameState.player = {}; }
    if (!gameState.player.preparation || typeof gameState.player.preparation !== "object") {
      gameState.player.preparation = basePlayerPreparationSchema();
    }
    if (!gameState.competitionState) { gameState.competitionState = {}; }
    if (!(gameState.competitionState.sparringOfferIds instanceof Array)) { gameState.competitionState.sparringOfferIds = []; }
    if (!gameState.competitionState.sparringOffersById || typeof gameState.competitionState.sparringOffersById !== "object") { gameState.competitionState.sparringOffersById = {}; }
    if (!(gameState.competitionState.trainingCampIds instanceof Array)) { gameState.competitionState.trainingCampIds = []; }
    if (!gameState.competitionState.trainingCampsById || typeof gameState.competitionState.trainingCampsById !== "object") { gameState.competitionState.trainingCampsById = {}; }
  }
  return gameState;
}

function normalizeInjuryEntry(source) {
  var normalized = baseInjurySchema();
  if (!source || typeof source !== "object") {
    return normalized;
  }
  normalized.id = source.id || "";
  normalized.severity = typeof source.severity === "number" ? source.severity : normalized.severity;
  normalized.weeksLeft = typeof source.weeksLeft === "number" ? source.weeksLeft : normalized.weeksLeft;
  normalized.chronic = !!source.chronic;
  normalized.source = source.source || "";
  normalized.appliedWeek = typeof source.appliedWeek === "number" ? source.appliedWeek : normalized.appliedWeek;
  return normalized;
}

function normalizeBiographyFactsEntry(sourceFacts) {
  var normalized = clonePlainData(basePlayerBiographySchema().facts);
  var key;
  if (!sourceFacts || typeof sourceFacts !== "object") {
    return normalized;
  }
  for (key in normalized) {
    if (normalized.hasOwnProperty(key)) {
      if (normalized[key] instanceof Array) {
        normalized[key] = sourceFacts[key] instanceof Array ? clonePlainData(sourceFacts[key]) : [];
      } else if (typeof normalized[key] === "number") {
        normalized[key] = typeof sourceFacts[key] === "number" ? sourceFacts[key] : normalized[key];
      } else if (typeof normalized[key] === "string") {
        normalized[key] = typeof sourceFacts[key] === "string" ? sourceFacts[key] : normalized[key];
      }
    }
  }
  return normalized;
}

function baseNpcSchema() {
  return {
    id: "",
    name: "",
    country: "",
    role: "",
    age: 24,
    traits: [],
    status: "",
    knownToPlayer: false,
    discoveredWeek: 0,
    relationToPlayer: {
      score: 0,
      summary: ""
    },
    history: [],
    flags: []
  };
}

function baseRelationshipSchema() {
  return {
    npcId: "",
    score: 0,
    lastInteractionWeek: 0,
    historyEntries: [],
    relationTags: []
  };
}

function legacyRelationScore(source) {
  var affinity;
  var respect;
  var trust;
  var tension;
  if (!source || typeof source !== "object") {
    return 0;
  }
  if (typeof source.score === "number") {
    return Math.max(-100, Math.min(100, Math.round(source.score)));
  }
  affinity = typeof source.affinity === "number" ? source.affinity : 35;
  respect = typeof source.respect === "number" ? source.respect : 35;
  trust = typeof source.trust === "number" ? source.trust : 30;
  tension = typeof source.tension === "number" ? source.tension : 10;
  return Math.max(-100, Math.min(100, Math.round(((affinity + respect + trust) / 3) - tension)));
}

function normalizeNpcEntry(sourceNpc) {
  var normalized = baseNpcSchema();
  if (!sourceNpc || typeof sourceNpc !== "object") {
    return normalized;
  }
  normalized.id = sourceNpc.id || "";
  normalized.name = sourceNpc.name || "";
  normalized.country = sourceNpc.country || "";
  normalized.role = sourceNpc.role || "";
  normalized.age = typeof sourceNpc.age === "number" ? sourceNpc.age : normalized.age;
  normalized.traits = sourceNpc.traits instanceof Array ? clonePlainData(sourceNpc.traits) : [];
  normalized.status = sourceNpc.status || "";
  normalized.knownToPlayer = typeof sourceNpc.knownToPlayer === "boolean" ? sourceNpc.knownToPlayer : false;
  normalized.discoveredWeek = typeof sourceNpc.discoveredWeek === "number" ? sourceNpc.discoveredWeek : 0;
  if (sourceNpc.relationToPlayer && typeof sourceNpc.relationToPlayer === "object") {
    normalized.relationToPlayer.score = legacyRelationScore(sourceNpc.relationToPlayer);
    normalized.relationToPlayer.summary = sourceNpc.relationToPlayer.summary || "";
  }
  normalized.history = sourceNpc.history instanceof Array ? clonePlainData(sourceNpc.history) : [];
  normalized.flags = sourceNpc.flags instanceof Array ? clonePlainData(sourceNpc.flags) : [];
  return normalized;
}

function normalizeRelationshipEntry(sourceRelationship) {
  var normalized = baseRelationshipSchema();
  if (!sourceRelationship || typeof sourceRelationship !== "object") {
    return normalized;
  }
  normalized.npcId = sourceRelationship.npcId || "";
  normalized.score = legacyRelationScore(sourceRelationship);
  if (typeof sourceRelationship.lastInteractionWeek === "number") { normalized.lastInteractionWeek = sourceRelationship.lastInteractionWeek; }
  normalized.historyEntries = sourceRelationship.historyEntries instanceof Array ? clonePlainData(sourceRelationship.historyEntries) : [];
  normalized.relationTags = sourceRelationship.relationTags instanceof Array ? clonePlainData(sourceRelationship.relationTags) : [];
  return normalized;
}

function normalizeRelationshipArcEntry(sourceArc) {
  var normalized = baseRelationshipArcSchema();
  if (!sourceArc || typeof sourceArc !== "object") {
    return normalized;
  }
  normalized.id = sourceArc.id || "";
  normalized.templateId = sourceArc.templateId || "";
  normalized.label = sourceArc.label || "";
  normalized.status = sourceArc.status || "active";
  if (typeof sourceArc.startedWeek === "number") { normalized.startedWeek = sourceArc.startedWeek; }
  if (typeof sourceArc.lastStageWeek === "number") { normalized.lastStageWeek = sourceArc.lastStageWeek; }
  normalized.currentStageId = sourceArc.currentStageId || "";
  normalized.lastChoiceId = sourceArc.lastChoiceId || "";
  normalized.outcome = sourceArc.outcome || "";
  normalized.tags = sourceArc.tags instanceof Array ? clonePlainData(sourceArc.tags) : [];
  normalized.actors = sourceArc.actors && typeof sourceArc.actors === "object" ? clonePlainData(sourceArc.actors) : {};
  normalized.history = sourceArc.history instanceof Array ? clonePlainData(sourceArc.history) : [];
  normalized.rivalryId = sourceArc.rivalryId || "";
  return normalized;
}

function normalizeRivalryEntry(sourceRivalry) {
  var normalized = baseRivalrySchema();
  if (!sourceRivalry || typeof sourceRivalry !== "object") {
    return normalized;
  }
  normalized.id = sourceRivalry.id || "";
  normalized.opponentKey = sourceRivalry.opponentKey || "";
  normalized.opponentName = sourceRivalry.opponentName || "";
  normalized.countryKey = sourceRivalry.countryKey || "";
  normalized.npcId = sourceRivalry.npcId || "";
  if (typeof sourceRivalry.fightsCount === "number") { normalized.fightsCount = sourceRivalry.fightsCount; }
  if (typeof sourceRivalry.playerWins === "number") { normalized.playerWins = sourceRivalry.playerWins; }
  if (typeof sourceRivalry.opponentWins === "number") { normalized.opponentWins = sourceRivalry.opponentWins; }
  if (typeof sourceRivalry.draws === "number") { normalized.draws = sourceRivalry.draws; }
  if (typeof sourceRivalry.knockouts === "number") { normalized.knockouts = sourceRivalry.knockouts; }
  if (typeof sourceRivalry.tension === "number") { normalized.tension = sourceRivalry.tension; }
  if (typeof sourceRivalry.stakes === "number") { normalized.stakes = sourceRivalry.stakes; }
  if (typeof sourceRivalry.active === "boolean") { normalized.active = sourceRivalry.active; }
  if (typeof sourceRivalry.pendingRematch === "boolean") { normalized.pendingRematch = sourceRivalry.pendingRematch; }
  if (typeof sourceRivalry.holdUntilWeek === "number") { normalized.holdUntilWeek = sourceRivalry.holdUntilWeek; }
  if (typeof sourceRivalry.lastWeek === "number") { normalized.lastWeek = sourceRivalry.lastWeek; }
  normalized.lastResult = sourceRivalry.lastResult || "";
  normalized.lastMethod = sourceRivalry.lastMethod || "";
  normalized.lastOpponentSnapshot = sourceRivalry.lastOpponentSnapshot ? clonePlainData(sourceRivalry.lastOpponentSnapshot) : null;
  normalized.opponentFighterId = sourceRivalry.opponentFighterId || "";
  normalized.tags = sourceRivalry.tags instanceof Array ? clonePlainData(sourceRivalry.tags) : [];
  normalized.history = sourceRivalry.history instanceof Array ? clonePlainData(sourceRivalry.history) : [];
  return normalized;
}

function createGameState(options) {
  var opts = options || {};
  var debugEnabled = !!opts.debugMode;
  var defaultSections = typeof WorldSimState !== "undefined" && WorldSimState.defaultSections ?
    WorldSimState.defaultSections() : {
      playerState: {},
      worldState: {},
      rosterState: { fighterIds: [], fightersById: {}, gymIds: [], gymsById: {}, trainerIds: [], trainersById: {} },
      organizationState: {},
      competitionState: {},
      narrativeState: {}
    };
  var gameState = {
    meta: {
      appVersion: opts.appVersion || "",
      saveVersion: SAVE_VERSION,
      rng: RNG.cloneState(opts.rng),
      updateAvailable: false,
      remoteVersion: "",
      debugMode: debugEnabled
    },
    player: {
      profile: {
        name: "",
        homeCountry: "",
        currentCountry: ""
      },
      stats: basePlayerStatsSchema(),
      resources: {
        skillPoints: 0,
        money: 0,
        health: 100,
        stress: 0,
        fame: 0
      },
      conditions: basePlayerConditionsSchema(),
      life: basePlayerLifeSchema(),
      amateur: basePlayerAmateurSchema(basePlayerConditionsSchema().startingAge),
      street: basePlayerStreetSchema("", ""),
      pro: basePlayerProSchema(),
      preparation: basePlayerPreparationSchema(),
      development: basePlayerDevelopmentSchema(),
      biography: basePlayerBiographySchema(),
      record: {
        wins: 0,
        losses: 0,
        kos: 0,
        deathsCaused: 0
      }
    },
    career: {
      week: 1,
      calendar: TimeSystem.createCalendar(),
      create: null,
      endingReason: "",
      runId: "",
      archivedLegendId: ""
    },
    world: baseWorldSchema(),
    battle: {
      current: null
    },
    ui: {
      screen: "menu",
      panel: "home",
      activeEvent: null,
      savedPreview: null,
      debug: {
        enabled: debugEnabled,
        open: debugEnabled
      }
    },
    feed: {
      log: []
    },
    playerState: clonePlainData(defaultSections.playerState),
    worldState: clonePlainData(defaultSections.worldState),
    rosterState: clonePlainData(defaultSections.rosterState),
    organizationState: clonePlainData(defaultSections.organizationState),
    competitionState: clonePlainData(defaultSections.competitionState),
    narrativeState: clonePlainData(defaultSections.narrativeState)
  };
  return gameState;
}

function normalizeWorldState(sourceWorld) {
  var normalized = baseWorldSchema();
  var i;
  if (!sourceWorld || typeof sourceWorld !== "object") {
    return normalized;
  }
  normalized.opponents = sourceWorld.opponents instanceof Array ? clonePlainData(sourceWorld.opponents) : [];
  if (sourceWorld.offers && typeof sourceWorld.offers === "object") {
    normalized.offers.weekStamp = typeof sourceWorld.offers.weekStamp === "number" ? sourceWorld.offers.weekStamp : 0;
    normalized.offers.available = sourceWorld.offers.available instanceof Array ? clonePlainData(sourceWorld.offers.available) : [];
    normalized.offers.headline = sourceWorld.offers.headline || "";
    normalized.offers.fightOffers = sourceWorld.offers.fightOffers instanceof Array ? clonePlainData(sourceWorld.offers.fightOffers) : [];
    normalized.offers.contractOffers = sourceWorld.offers.contractOffers instanceof Array ? clonePlainData(sourceWorld.offers.contractOffers) : [];
  }
  if (sourceWorld.npcs instanceof Array) {
    normalized.npcs = [];
    for (i = 0; i < sourceWorld.npcs.length; i += 1) {
      normalized.npcs.push(normalizeNpcEntry(sourceWorld.npcs[i]));
    }
  }
  if (sourceWorld.relationships instanceof Array) {
    normalized.relationships = [];
    for (i = 0; i < sourceWorld.relationships.length; i += 1) {
      normalized.relationships.push(normalizeRelationshipEntry(sourceWorld.relationships[i]));
    }
  }
  if (sourceWorld.relationshipArcs instanceof Array) {
    normalized.relationshipArcs = [];
    for (i = 0; i < sourceWorld.relationshipArcs.length; i += 1) {
      normalized.relationshipArcs.push(normalizeRelationshipArcEntry(sourceWorld.relationshipArcs[i]));
    }
  }
  if (sourceWorld.rivalries instanceof Array) {
    normalized.rivalries = [];
    for (i = 0; i < sourceWorld.rivalries.length; i += 1) {
      normalized.rivalries.push(normalizeRivalryEntry(sourceWorld.rivalries[i]));
    }
  }
  normalized.contracts = sourceWorld.contracts instanceof Array ? clonePlainData(sourceWorld.contracts) : [];
  if (sourceWorld.gymMembership && typeof sourceWorld.gymMembership === "object") {
    normalized.gymMembership = clonePlainData(baseGymMembershipSchema());
    if (sourceWorld.gymMembership.gymId) { normalized.gymMembership.gymId = sourceWorld.gymMembership.gymId; }
    if (typeof sourceWorld.gymMembership.joinedWeek === "number") { normalized.gymMembership.joinedWeek = sourceWorld.gymMembership.joinedWeek; }
    normalized.gymMembership.country = sourceWorld.gymMembership.country || "";
    normalized.gymMembership.city = sourceWorld.gymMembership.city || "";
    normalized.gymMembership.gymType = sourceWorld.gymMembership.gymType || "";
    if (typeof sourceWorld.gymMembership.cost === "number") { normalized.gymMembership.cost = sourceWorld.gymMembership.cost; }
    if (typeof sourceWorld.gymMembership.weeklyCost === "number") { normalized.gymMembership.weeklyCost = sourceWorld.gymMembership.weeklyCost; }
    if (typeof sourceWorld.gymMembership.reputation === "number") { normalized.gymMembership.reputation = sourceWorld.gymMembership.reputation; }
    normalized.gymMembership.bonuses = sourceWorld.gymMembership.bonuses ? clonePlainData(sourceWorld.gymMembership.bonuses) : {};
  }
  if (sourceWorld.trainerAssignment && typeof sourceWorld.trainerAssignment === "object") {
    normalized.trainerAssignment = clonePlainData(baseTrainerAssignmentSchema());
    if (sourceWorld.trainerAssignment.npcId) { normalized.trainerAssignment.npcId = sourceWorld.trainerAssignment.npcId; }
    if (sourceWorld.trainerAssignment.trainerId) { normalized.trainerAssignment.trainerId = sourceWorld.trainerAssignment.trainerId; }
    if (sourceWorld.trainerAssignment.trainerTypeId) { normalized.trainerAssignment.trainerTypeId = sourceWorld.trainerAssignment.trainerTypeId; }
    if (sourceWorld.trainerAssignment.gymId) { normalized.trainerAssignment.gymId = sourceWorld.trainerAssignment.gymId; }
    normalized.trainerAssignment.trainerType = sourceWorld.trainerAssignment.trainerType || "";
    if (typeof sourceWorld.trainerAssignment.salary === "number") { normalized.trainerAssignment.salary = sourceWorld.trainerAssignment.salary; }
    if (typeof sourceWorld.trainerAssignment.hiredWeek === "number") { normalized.trainerAssignment.hiredWeek = sourceWorld.trainerAssignment.hiredWeek; }
    if (typeof sourceWorld.trainerAssignment.weeklyFee === "number") { normalized.trainerAssignment.weeklyFee = sourceWorld.trainerAssignment.weeklyFee; }
    normalized.trainerAssignment.status = sourceWorld.trainerAssignment.status || "active";
  }
  if (normalized.trainerAssignment && normalized.gymMembership && !normalized.trainerAssignment.gymId && normalized.gymMembership.gymId) {
    normalized.trainerAssignment.gymId = normalized.gymMembership.gymId;
  }
  if (normalized.trainerAssignment && normalized.trainerAssignment.gymId && !normalized.gymMembership) {
    normalized.gymMembership = clonePlainData(baseGymMembershipSchema());
    normalized.gymMembership.gymId = normalized.trainerAssignment.gymId;
  }
  if (sourceWorld.activeContract && typeof sourceWorld.activeContract === "object") {
    normalized.activeContract = clonePlainData(baseContractSchema());
    normalized.activeContract.id = sourceWorld.activeContract.id || "";
    normalized.activeContract.templateId = sourceWorld.activeContract.templateId || "";
    normalized.activeContract.promoterId = sourceWorld.activeContract.promoterId || "";
    normalized.activeContract.label = sourceWorld.activeContract.label || "";
    if (typeof sourceWorld.activeContract.signedWeek === "number") { normalized.activeContract.signedWeek = sourceWorld.activeContract.signedWeek; }
    if (typeof sourceWorld.activeContract.endsWeek === "number") { normalized.activeContract.endsWeek = sourceWorld.activeContract.endsWeek; }
    if (typeof sourceWorld.activeContract.guaranteedPurse === "number") { normalized.activeContract.guaranteedPurse = sourceWorld.activeContract.guaranteedPurse; }
    if (typeof sourceWorld.activeContract.winBonus === "number") { normalized.activeContract.winBonus = sourceWorld.activeContract.winBonus; }
    if (typeof sourceWorld.activeContract.koBonus === "number") { normalized.activeContract.koBonus = sourceWorld.activeContract.koBonus; }
    if (typeof sourceWorld.activeContract.fameMultiplier === "number") { normalized.activeContract.fameMultiplier = sourceWorld.activeContract.fameMultiplier; }
    if (typeof sourceWorld.activeContract.fightFrequency === "number") { normalized.activeContract.fightFrequency = sourceWorld.activeContract.fightFrequency; }
    if (typeof sourceWorld.activeContract.toxicRisk === "number") { normalized.activeContract.toxicRisk = sourceWorld.activeContract.toxicRisk; }
    if (typeof sourceWorld.activeContract.reputationDelta === "number") { normalized.activeContract.reputationDelta = sourceWorld.activeContract.reputationDelta; }
    normalized.activeContract.conditionsText = sourceWorld.activeContract.conditionsText || "";
    normalized.activeContract.status = sourceWorld.activeContract.status || "active";
  }
  if (sourceWorld.eventState && typeof sourceWorld.eventState === "object") {
    normalized.eventState.cooldowns = sourceWorld.eventState.cooldowns ? clonePlainData(sourceWorld.eventState.cooldowns) : {};
    normalized.eventState.onceResolved = sourceWorld.eventState.onceResolved instanceof Array ? clonePlainData(sourceWorld.eventState.onceResolved) : [];
    normalized.eventState.recentEvents = sourceWorld.eventState.recentEvents instanceof Array ? clonePlainData(sourceWorld.eventState.recentEvents) : [];
    normalized.eventState.actionHistory = sourceWorld.eventState.actionHistory instanceof Array ? clonePlainData(sourceWorld.eventState.actionHistory) : [];
  }
  if (sourceWorld.lastWeekAction && typeof sourceWorld.lastWeekAction === "object") {
    normalized.lastWeekAction.type = sourceWorld.lastWeekAction.type || "idle";
    normalized.lastWeekAction.label = sourceWorld.lastWeekAction.label || "";
    normalized.lastWeekAction.meta = sourceWorld.lastWeekAction.meta ? clonePlainData(sourceWorld.lastWeekAction.meta) : null;
  }
  if (sourceWorld.scene && typeof sourceWorld.scene === "object") {
    normalized.scene.updatedWeek = typeof sourceWorld.scene.updatedWeek === "number" ? sourceWorld.scene.updatedWeek : 0;
    normalized.scene.buzz = typeof sourceWorld.scene.buzz === "number" ? sourceWorld.scene.buzz : 0;
    normalized.scene.temperature = typeof sourceWorld.scene.temperature === "number" ? sourceWorld.scene.temperature : 50;
  }
  return normalized;
}

function normalizeGameState(gameState, options) {
  var normalized = createGameState(options);
  var source = gameState || {};
  var lightweightWorld = !!(options && options.lightweightWorld);
  var key;

  if (source.meta) {
    normalized.meta.appVersion = source.meta.appVersion || normalized.meta.appVersion;
    normalized.meta.saveVersion = typeof source.meta.saveVersion === "number" ? source.meta.saveVersion : normalized.meta.saveVersion;
    normalized.meta.rng = RNG.cloneState(source.meta.rng);
    normalized.meta.updateAvailable = !!source.meta.updateAvailable;
    normalized.meta.remoteVersion = source.meta.remoteVersion || "";
    normalized.meta.debugMode = !!source.meta.debugMode;
  }

  if (source.player) {
    if (source.player.profile) {
      normalized.player.profile.name = source.player.profile.name || "";
      normalized.player.profile.homeCountry = source.player.profile.homeCountry || "";
      normalized.player.profile.currentCountry = source.player.profile.currentCountry || "";
    }
    if (source.player.stats) {
      for (key in normalized.player.stats) {
        if (normalized.player.stats.hasOwnProperty(key) && typeof source.player.stats[key] === "number") {
          normalized.player.stats[key] = source.player.stats[key];
        }
      }
    }
    if (source.player.resources) {
      if (typeof source.player.resources.skillPoints === "number") { normalized.player.resources.skillPoints = source.player.resources.skillPoints; }
      if (typeof source.player.resources.money === "number") { normalized.player.resources.money = source.player.resources.money; }
      if (typeof source.player.resources.health === "number") { normalized.player.resources.health = source.player.resources.health; }
      if (typeof source.player.resources.stress === "number") { normalized.player.resources.stress = source.player.resources.stress; }
      if (typeof source.player.resources.fame === "number") { normalized.player.resources.fame = source.player.resources.fame; }
    }
    if (source.player.conditions) {
      if (typeof source.player.conditions.fatigue === "number") { normalized.player.conditions.fatigue = source.player.conditions.fatigue; }
      if (typeof source.player.conditions.wear === "number") { normalized.player.conditions.wear = source.player.conditions.wear; }
      if (typeof source.player.conditions.morale === "number") { normalized.player.conditions.morale = source.player.conditions.morale; }
      if (typeof source.player.conditions.startingAge === "number") { normalized.player.conditions.startingAge = source.player.conditions.startingAge; }
      if (source.player.conditions.injuries instanceof Array) {
        normalized.player.conditions.injuries = [];
        for (key = 0; key < source.player.conditions.injuries.length; key += 1) {
          normalized.player.conditions.injuries.push(normalizeInjuryEntry(source.player.conditions.injuries[key]));
        }
      }
    }
    if (source.player.life) {
      normalized.player.life.housingId = source.player.life.housingId || normalized.player.life.housingId;
      normalized.player.life.livingMode = source.player.life.livingMode || normalized.player.life.livingMode;
      if (typeof source.player.life.support === "number") { normalized.player.life.support = source.player.life.support; }
      if (typeof source.player.life.debtWeeks === "number") { normalized.player.life.debtWeeks = source.player.life.debtWeeks; }
    }
    if (source.player.amateur) {
      normalized.player.amateur = typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.normalizeAmateurState ?
        JuniorAmateurSystem.normalizeAmateurState(source.player.amateur, normalized.player.conditions.startingAge) :
        clonePlainData(source.player.amateur);
    } else if (typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.normalizeAmateurState) {
      normalized.player.amateur = JuniorAmateurSystem.normalizeAmateurState(null, normalized.player.conditions.startingAge);
    }
    if (source.player.street) {
      normalized.player.street = typeof StreetCareerEngine !== "undefined" && StreetCareerEngine.normalizeStreetState ?
        StreetCareerEngine.normalizeStreetState(source.player.street, normalized.player.profile.currentCountry || normalized.player.profile.homeCountry || "", "") :
        clonePlainData(source.player.street);
    }
    if (source.player.pro) {
      normalized.player.pro = typeof ProCareerEngine !== "undefined" && ProCareerEngine.normalizeProState ?
        ProCareerEngine.normalizeProState(source.player.pro) :
        clonePlainData(source.player.pro);
    }
    if (source.player.preparation) {
      normalized.player.preparation = typeof SparringCampEngine !== "undefined" && SparringCampEngine.normalizePreparationState ?
        SparringCampEngine.normalizePreparationState(source.player.preparation) :
        clonePlainData(source.player.preparation);
    }
    if (source.player.development) {
      normalized.player.development.focusId = canonicalDevelopmentFocusId(source.player.development.focusId || normalized.player.development.focusId);
      if (typeof source.player.development.totalXp === "number") { normalized.player.development.totalXp = source.player.development.totalXp; }
      if (typeof source.player.development.perkPoints === "number") { normalized.player.development.perkPoints = source.player.development.perkPoints; }
      for (key in normalized.player.development.focusProgress) {
        if (normalized.player.development.focusProgress.hasOwnProperty(key) && source.player.development.focusProgress && typeof source.player.development.focusProgress[key] === "number") {
          normalized.player.development.focusProgress[key] = source.player.development.focusProgress[key];
        }
      }
      if (source.player.development.focusProgress && typeof source.player.development.focusProgress.sparring === "number") {
        normalized.player.development.focusProgress.technique += source.player.development.focusProgress.sparring;
      }
      for (key in normalized.player.development.styleProgress) {
        if (normalized.player.development.styleProgress.hasOwnProperty(key) && source.player.development.styleProgress && typeof source.player.development.styleProgress[key] === "number") {
          normalized.player.development.styleProgress[key] = source.player.development.styleProgress[key];
        }
      }
      normalized.player.development.activePerks = source.player.development.activePerks instanceof Array ? clonePlainData(source.player.development.activePerks) : [];
    }
    if (source.player.biography) {
      normalized.player.biography.flags = source.player.biography.flags instanceof Array ? clonePlainData(source.player.biography.flags) : [];
      normalized.player.biography.history = source.player.biography.history instanceof Array ? clonePlainData(source.player.biography.history) : [];
      normalized.player.biography.reputationTags = source.player.biography.reputationTags instanceof Array ? clonePlainData(source.player.biography.reputationTags) : [];
      normalized.player.biography.mediaFeed = source.player.biography.mediaFeed instanceof Array ? clonePlainData(source.player.biography.mediaFeed) : [];
      normalized.player.biography.chronicle = source.player.biography.chronicle && typeof source.player.biography.chronicle === "object" ? clonePlainData(source.player.biography.chronicle) : null;
      normalized.player.biography.facts = normalizeBiographyFactsEntry(source.player.biography.facts);
    }
    if (source.player.record) {
      if (typeof source.player.record.wins === "number") { normalized.player.record.wins = source.player.record.wins; }
      if (typeof source.player.record.losses === "number") { normalized.player.record.losses = source.player.record.losses; }
      if (typeof source.player.record.kos === "number") { normalized.player.record.kos = source.player.record.kos; }
      if (typeof source.player.record.deathsCaused === "number") { normalized.player.record.deathsCaused = source.player.record.deathsCaused; }
    }
  }

  if (source.career) {
    if (typeof source.career.week === "number") {
      normalized.career.week = source.career.week;
    }
    if (source.career.calendar) {
      normalized.career.calendar = TimeSystem.normalizeCalendar(clonePlainData(source.career.calendar));
    } else if (typeof source.career.week === "number") {
      normalized.career.calendar = TimeSystem.createCalendar({ totalWeeks: Math.max(0, source.career.week - 1) });
    }
    normalized.career.create = source.career.create ? clonePlainData(source.career.create) : null;
    normalized.career.endingReason = source.career.endingReason || "";
    normalized.career.runId = source.career.runId || "";
    normalized.career.archivedLegendId = source.career.archivedLegendId || "";
  }

  normalized.world = normalizeWorldState(source.world);

  if (source.battle) {
    normalized.battle.current = source.battle.current ? clonePlainData(source.battle.current) : null;
  }

  if (source.ui) {
    normalized.ui.screen = source.ui.screen || normalized.ui.screen;
    normalized.ui.panel = source.ui.panel || normalized.ui.panel;
    normalized.ui.activeEvent = source.ui.activeEvent ? clonePlainData(source.ui.activeEvent) : null;
    normalized.ui.savedPreview = source.ui.savedPreview || null;
    if (source.ui.debug) {
      normalized.ui.debug.enabled = !!source.ui.debug.enabled;
      normalized.ui.debug.open = !!source.ui.debug.open;
    }
  }

  if (source.feed && source.feed.log) {
    normalized.feed.log = clonePlainData(source.feed.log);
  }

  normalized = ensureWorldSimSections(normalized, source);
  normalized = ensurePersistentRosterSections(normalized);
  normalized = ensureAmateurEcosystemSections(normalized);
  if (!lightweightWorld) {
    normalized = ensureAmateurSeasonSections(normalized);
  }
  normalized = ensureStreetCareerSections(normalized);
  normalized = ensureProCareerSections(normalized);
  normalized = ensureSparringCampSections(normalized);
  if (!lightweightWorld) {
    normalized = ensureWorldCareerSections(normalized);
    normalized = ensureEncounterHistorySections(normalized);
    normalized = ensureWorldStorySections(normalized);
    normalized = ensureCareerTransitionSections(normalized);
  }
  if (typeof WorldFacilityEngine !== "undefined" && WorldFacilityEngine.normalizeGameStateFacilities) {
    normalized = WorldFacilityEngine.normalizeGameStateFacilities(normalized);
  }
  if (!normalized.player.amateur || typeof normalized.player.amateur !== "object") {
    normalized.player.amateur = basePlayerAmateurSchema(normalized.player.conditions.startingAge);
  }
  if (!normalized.player.pro || typeof normalized.player.pro !== "object") {
    normalized.player.pro = basePlayerProSchema();
  }
  if (!normalized.player.preparation || typeof normalized.player.preparation !== "object") {
    normalized.player.preparation = basePlayerPreparationSchema();
  }
  normalized.player.development.focusId = canonicalDevelopmentFocusId(normalized.player.development.focusId);
  if (normalized.career.create && typeof normalized.career.create === "object") {
    normalized.career.create.startingAge = normalized.career.create.startingAge === 18 ? 18 : 16;
    normalized.career.create.focusId = canonicalDevelopmentFocusId(normalized.career.create.focusId || "technique");
    if (normalized.career.create.identity && typeof normalized.career.create.identity === "object") {
      normalizeFighterLikeIdentity(normalized.career.create.identity, "amateur");
    }
  }
  normalizePlayerProfileName(normalized.player.profile, normalized.playerState && normalized.playerState.currentTrackId ? normalized.playerState.currentTrackId : "street");
  normalizeRosterIdentityState(normalized);
  normalizeLegacyFightOfferSnapshots(normalized);
  normalized.career.week = TimeSystem.getCalendarView(normalized.career.calendar).weekNumber;
  normalized.meta.saveVersion = SAVE_VERSION;
  return normalized;
}

function buildGameStateFromLegacySnapshot(snapshot, options) {
  var gameState = createGameState(options);
  var fighter = snapshot && snapshot.fighter ? snapshot.fighter : null;
  var calendarSource = null;
  gameState.meta.appVersion = snapshot && snapshot.appVersion ? snapshot.appVersion : gameState.meta.appVersion;
  gameState.meta.rng = RNG.cloneState(snapshot && snapshot.rng);
  gameState.meta.updateAvailable = !!(snapshot && snapshot.updateAvailable);
  gameState.meta.remoteVersion = snapshot && snapshot.remoteVersion ? snapshot.remoteVersion : "";
  gameState.ui.screen = snapshot && snapshot.screen ? snapshot.screen : gameState.ui.screen;
  gameState.ui.panel = snapshot && snapshot.panel ? snapshot.panel : gameState.ui.panel;
  gameState.ui.activeEvent = snapshot && snapshot.activeEvent ? clonePlainData(snapshot.activeEvent) : null;
  gameState.ui.savedPreview = snapshot && snapshot.savedPreview ? clonePlainData(snapshot.savedPreview) : null;
  if (snapshot && snapshot.debug) {
    gameState.ui.debug.enabled = !!snapshot.debug.enabled;
    gameState.ui.debug.open = !!snapshot.debug.open;
  }
  gameState.career.create = snapshot && snapshot.create ? clonePlainData(snapshot.create) : null;
  gameState.battle.current = snapshot && snapshot.fight ? clonePlainData(snapshot.fight) : null;
  gameState.feed.log = snapshot && snapshot.log ? clonePlainData(snapshot.log) : [];
  gameState.career.endingReason = snapshot && snapshot.endingReason ? snapshot.endingReason : "";
  if (snapshot && snapshot.runId) {
    gameState.career.runId = snapshot.runId;
  }
  if (snapshot && snapshot.archivedLegendId) {
    gameState.career.archivedLegendId = snapshot.archivedLegendId;
  }
  if (snapshot && snapshot.world) {
    gameState.world = normalizeWorldState(snapshot.world);
  } else if (snapshot && snapshot.opponents) {
    gameState.world.opponents = clonePlainData(snapshot.opponents);
  }
  if (fighter) {
    gameState.player.profile.name = fighter.name || "";
    gameState.player.profile.homeCountry = fighter.homeCountry || "";
    gameState.player.profile.currentCountry = fighter.currentCountry || "";
    gameState.player.stats = clonePlainData(fighter.stats || basePlayerStatsSchema());
    gameState.player.resources.skillPoints = fighter.skillPoints || 0;
    gameState.player.resources.money = typeof fighter.money === "number" ? fighter.money : 0;
    gameState.player.resources.health = typeof fighter.health === "number" ? fighter.health : 100;
    gameState.player.resources.stress = typeof fighter.stress === "number" ? fighter.stress : 0;
    gameState.player.resources.fame = fighter.fame || 0;
    gameState.player.conditions.fatigue = typeof fighter.fatigue === "number" ? fighter.fatigue : gameState.player.conditions.fatigue;
    gameState.player.conditions.wear = typeof fighter.wear === "number" ? fighter.wear : gameState.player.conditions.wear;
    gameState.player.conditions.morale = typeof fighter.morale === "number" ? fighter.morale : gameState.player.conditions.morale;
    gameState.player.conditions.startingAge = typeof fighter.startingAge === "number" ? fighter.startingAge : 21;
    if (fighter.injuries instanceof Array) {
      gameState.player.conditions.injuries = [];
      for (key = 0; key < fighter.injuries.length; key += 1) {
        gameState.player.conditions.injuries.push(normalizeInjuryEntry(fighter.injuries[key]));
      }
    }
    gameState.player.life.housingId = fighter.housingId || gameState.player.life.housingId;
    gameState.player.life.livingMode = fighter.livingMode || gameState.player.life.livingMode;
    gameState.player.life.support = typeof fighter.support === "number" ? fighter.support : gameState.player.life.support;
    gameState.player.life.debtWeeks = typeof fighter.debtWeeks === "number" ? fighter.debtWeeks : gameState.player.life.debtWeeks;
    if (fighter.street && typeof fighter.street === "object") {
      gameState.player.street = typeof StreetCareerEngine !== "undefined" && StreetCareerEngine.normalizeStreetState ?
        StreetCareerEngine.normalizeStreetState(fighter.street, gameState.player.profile.currentCountry || gameState.player.profile.homeCountry || "", "") :
        clonePlainData(fighter.street);
    }
    if (fighter.pro && typeof fighter.pro === "object") {
      gameState.player.pro = typeof ProCareerEngine !== "undefined" && ProCareerEngine.normalizeProState ?
        ProCareerEngine.normalizeProState(fighter.pro) :
        clonePlainData(fighter.pro);
    }
    if (fighter.preparation && typeof fighter.preparation === "object") {
      gameState.player.preparation = typeof SparringCampEngine !== "undefined" && SparringCampEngine.normalizePreparationState ?
        SparringCampEngine.normalizePreparationState(fighter.preparation) :
        clonePlainData(fighter.preparation);
    }
    if (fighter.amateur && typeof fighter.amateur === "object") {
      gameState.player.amateur = typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.normalizeAmateurState ?
        JuniorAmateurSystem.normalizeAmateurState(fighter.amateur, gameState.player.conditions.startingAge) :
        clonePlainData(fighter.amateur);
    }
    if (fighter.development && typeof fighter.development === "object") {
      gameState.player.development = normalizeGameState({
        player: {
          development: fighter.development
        }
      }, options).player.development;
    }
    gameState.player.biography.flags = fighter.bioFlags instanceof Array ? clonePlainData(fighter.bioFlags) : [];
    gameState.player.biography.history = fighter.bioHistory instanceof Array ? clonePlainData(fighter.bioHistory) : [];
    gameState.player.biography.reputationTags = fighter.reputationTags instanceof Array ? clonePlainData(fighter.reputationTags) : [];
    gameState.player.biography.mediaFeed = fighter.mediaFeed instanceof Array ? clonePlainData(fighter.mediaFeed) : [];
    gameState.player.biography.chronicle = fighter.chronicle && typeof fighter.chronicle === "object" ? clonePlainData(fighter.chronicle) : null;
    gameState.player.biography.facts = normalizeBiographyFactsEntry(fighter.bioFacts);
    gameState.player.record.wins = fighter.wins || 0;
    gameState.player.record.losses = fighter.losses || 0;
    gameState.player.record.kos = fighter.kos || 0;
    gameState.player.record.deathsCaused = fighter.deathsCaused || 0;
    gameState.career.week = fighter.week || 1;
    calendarSource = fighter.calendar ? fighter.calendar : (snapshot && (snapshot.calendar || snapshot.careerCalendar));
  }
  if (!calendarSource && snapshot && snapshot.career && snapshot.career.calendar) {
    calendarSource = snapshot.career.calendar;
  }
  if (snapshot && snapshot.career) {
    if (snapshot.career.runId) {
      gameState.career.runId = snapshot.career.runId;
    }
    if (snapshot.career.archivedLegendId) {
      gameState.career.archivedLegendId = snapshot.career.archivedLegendId;
    }
  }
  if (calendarSource) {
    gameState.career.calendar = TimeSystem.normalizeCalendar(clonePlainData(calendarSource));
  } else {
    gameState.career.calendar = TimeSystem.createCalendar({ totalWeeks: Math.max(0, gameState.career.week - 1) });
  }
  return normalizeGameState(gameState, options);
}

function sectionHasMeaningfulData(sectionName, section) {
  if (!section || typeof section !== "object") {
    return false;
  }
  if (sectionName === "rosterState") {
    return !!((section.fighterIds instanceof Array && section.fighterIds.length) || (section.fightersById && Object.keys(section.fightersById).length));
  }
  if (sectionName === "organizationState") {
    return !!((section.organizationIds instanceof Array && section.organizationIds.length) || (section.organizationsById && Object.keys(section.organizationsById).length));
  }
  if (sectionName === "competitionState") {
    return !!((section.competitionIds instanceof Array && section.competitionIds.length) ||
      (section.competitionsById && Object.keys(section.competitionsById).length) ||
      (section.proOfferIds instanceof Array && section.proOfferIds.length) ||
      (section.proOffersById && Object.keys(section.proOffersById).length));
  }
  if (sectionName === "narrativeState") {
    return !!((section.worldMediaIds instanceof Array && section.worldMediaIds.length) ||
      (section.noticeIds instanceof Array && section.noticeIds.length) ||
      (section.availableTransitionIds instanceof Array && section.availableTransitionIds.length));
  }
  if (sectionName === "worldState") {
    return !!(section.timeline || section.worldCareer || section.careerTrack);
  }
  if (sectionName === "playerState") {
    return !!(section.currentTrackId || section.careerTrack || section.fighterEntityId);
  }
  return true;
}

function chooseRuntimeSection(runtimeState, sectionName) {
  var runtimeSection = runtimeState && runtimeState[sectionName] ? runtimeState[sectionName] : null;
  var canonicalSection = runtimeState && runtimeState.game && runtimeState.game[sectionName] ? runtimeState.game[sectionName] : null;
  var shareByReference = sectionName === "playerState" ||
    sectionName === "worldState" ||
    sectionName === "rosterState" ||
    sectionName === "organizationState" ||
    sectionName === "competitionState" ||
    sectionName === "narrativeState";
  if (shareByReference) {
    if (sectionHasMeaningfulData(sectionName, runtimeSection)) {
      return runtimeSection;
    }
    if (sectionHasMeaningfulData(sectionName, canonicalSection)) {
      return canonicalSection;
    }
    return runtimeSection || canonicalSection || null;
  }
  if (sectionHasMeaningfulData(sectionName, runtimeSection)) {
    return clonePlainData(runtimeSection);
  }
  if (sectionHasMeaningfulData(sectionName, canonicalSection)) {
    return clonePlainData(canonicalSection);
  }
  return runtimeSection ? clonePlainData(runtimeSection) : null;
}

function buildGameStateFromRuntime(runtimeState, options) {
  var gameState = buildGameStateFromLegacySnapshot({
    appVersion: options && options.appVersion ? options.appVersion : "",
    rng: runtimeState ? runtimeState.rng : null,
    screen: runtimeState ? runtimeState.screen : "menu",
    panel: runtimeState ? runtimeState.panel : "home",
    create: runtimeState ? runtimeState.create : null,
    fighter: runtimeState ? runtimeState.fighter : null,
    world: runtimeState ? runtimeState.world : null,
    opponents: runtimeState ? runtimeState.opponents : [],
    fight: runtimeState ? runtimeState.fight : null,
    activeEvent: runtimeState ? runtimeState.activeEvent : null,
    log: runtimeState ? runtimeState.log : [],
    endingReason: runtimeState ? runtimeState.endingReason : "",
    runId: runtimeState ? runtimeState.runId : "",
    archivedLegendId: runtimeState ? runtimeState.archivedLegendId : "",
    savedPreview: runtimeState ? runtimeState.savedPreview : null,
    updateAvailable: runtimeState ? runtimeState.updateAvailable : false,
    remoteVersion: runtimeState ? runtimeState.remoteVersion : "",
    debug: runtimeState ? runtimeState.debug : null
  }, options);
  if (runtimeState && runtimeState.playerState) {
    gameState.playerState = chooseRuntimeSection(runtimeState, "playerState");
  }
  if (runtimeState && (runtimeState.worldState || (runtimeState.game && runtimeState.game.worldState))) {
    gameState.worldState = chooseRuntimeSection(runtimeState, "worldState");
  }
  if (runtimeState && (runtimeState.rosterState || (runtimeState.game && runtimeState.game.rosterState))) {
    gameState.rosterState = chooseRuntimeSection(runtimeState, "rosterState");
  }
  if (runtimeState && (runtimeState.organizationState || (runtimeState.game && runtimeState.game.organizationState))) {
    gameState.organizationState = chooseRuntimeSection(runtimeState, "organizationState");
  }
  if (runtimeState && (runtimeState.competitionState || (runtimeState.game && runtimeState.game.competitionState))) {
    gameState.competitionState = chooseRuntimeSection(runtimeState, "competitionState");
  }
  if (runtimeState && (runtimeState.narrativeState || (runtimeState.game && runtimeState.game.narrativeState))) {
    gameState.narrativeState = chooseRuntimeSection(runtimeState, "narrativeState");
  }
  gameState = normalizeGameState(gameState, options);
  return gameState;
}

function applyGameStateToRuntime(runtimeState, gameState, options) {
  var target = runtimeState || {};
  var normalized = normalizeGameState(gameState, options);
  var hasFighter = !!normalized.player.profile.name;

  target.game = normalized;
  target.screen = normalized.ui.screen;
  target.panel = normalized.ui.panel;
  target.activeEvent = normalized.ui.activeEvent ? clonePlainData(normalized.ui.activeEvent) : null;
  target.create = normalized.career.create ? clonePlainData(normalized.career.create) : null;
  target.opponents = clonePlainData(normalized.world.opponents);
  target.world = clonePlainData(normalized.world);
  target.world.opponents = target.opponents;
  target.fight = normalized.battle.current ? clonePlainData(normalized.battle.current) : null;
  target.log = clonePlainData(normalized.feed.log);
  target.endingReason = normalized.career.endingReason;
  target.runId = normalized.career.runId || "";
  target.archivedLegendId = normalized.career.archivedLegendId || "";
  target.savedPreview = normalized.ui.savedPreview;
  target.updateAvailable = !!normalized.meta.updateAvailable;
  target.remoteVersion = normalized.meta.remoteVersion || "";
  target.rng = RNG.cloneState(normalized.meta.rng);
  target.debug = clonePlainData(normalized.ui.debug);
  target.playerState = normalized.playerState;
  target.worldState = normalized.worldState;
  target.rosterState = normalized.rosterState;
  target.organizationState = normalized.organizationState;
  target.competitionState = normalized.competitionState;
  target.narrativeState = normalized.narrativeState;

  target.fighter = hasFighter ? {
    name: normalized.player.profile.name,
    stats: clonePlainData(normalized.player.stats),
    skillPoints: normalized.player.resources.skillPoints,
    money: normalized.player.resources.money,
    week: normalized.career.week,
    health: normalized.player.resources.health,
    stress: normalized.player.resources.stress,
    fame: normalized.player.resources.fame,
    fatigue: normalized.player.conditions.fatigue,
    wear: normalized.player.conditions.wear,
    morale: normalized.player.conditions.morale,
    injuries: clonePlainData(normalized.player.conditions.injuries),
    housingId: normalized.player.life.housingId,
    livingMode: normalized.player.life.livingMode,
    support: normalized.player.life.support,
    debtWeeks: normalized.player.life.debtWeeks,
    street: clonePlainData(normalized.player.street),
    amateur: clonePlainData(normalized.player.amateur),
    pro: clonePlainData(normalized.player.pro),
    preparation: clonePlainData(normalized.player.preparation),
    development: clonePlainData(normalized.player.development),
    startingAge: normalized.player.conditions.startingAge,
    bioFlags: clonePlainData(normalized.player.biography.flags),
    bioHistory: clonePlainData(normalized.player.biography.history),
    reputationTags: clonePlainData(normalized.player.biography.reputationTags),
    mediaFeed: clonePlainData(normalized.player.biography.mediaFeed),
    chronicle: normalized.player.biography.chronicle ? clonePlainData(normalized.player.biography.chronicle) : null,
    bioFacts: clonePlainData(normalized.player.biography.facts),
    calendar: clonePlainData(normalized.career.calendar),
    wins: normalized.player.record.wins,
    losses: normalized.player.record.losses,
    kos: normalized.player.record.kos,
    deathsCaused: normalized.player.record.deathsCaused,
    homeCountry: normalized.player.profile.homeCountry,
    currentCountry: normalized.player.profile.currentCountry
  } : null;

  return target;
}

function createLegacyRuntimeState(options) {
  return applyGameStateToRuntime({}, createGameState(options), options);
}
