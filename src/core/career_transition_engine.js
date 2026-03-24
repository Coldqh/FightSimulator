var CareerTransitionEngine = (function () {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function stableId(prefix, parts) {
    if (typeof WorldSimState !== "undefined" && WorldSimState.stableId) {
      return WorldSimState.stableId(prefix, parts);
    }
    return prefix + "_" + String(parts instanceof Array ? parts.join("_") : parts);
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

  function dataRoot() {
    return typeof CAREER_TRANSITION_DATA !== "undefined" && CAREER_TRANSITION_DATA ? CAREER_TRANSITION_DATA : {
      transitions: [],
      transitionEvents: []
    };
  }

  function cloneList(list) {
    return list instanceof Array ? clone(list) : [];
  }

  function listTransitions() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listCareerTransitions ? ContentLoader.listCareerTransitions() : cloneList(dataRoot().transitions);
  }

  function getTransition(transitionId) {
    var transitions;
    var i;
    var loaded = typeof ContentLoader !== "undefined" && ContentLoader.getCareerTransition ? ContentLoader.getCareerTransition(transitionId) : null;
    if (loaded) {
      return loaded;
    }
    transitions = dataRoot().transitions instanceof Array ? dataRoot().transitions : [];
    for (i = 0; i < transitions.length; i += 1) {
      if (transitions[i] && transitions[i].id === transitionId) {
        return clone(transitions[i]);
      }
    }
    return null;
  }

  function listTransitionEvents() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listCareerTransitionEvents ? ContentLoader.listCareerTransitionEvents() : cloneList(dataRoot().transitionEvents);
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

  function playerTrackId(gameState) {
    return gameState && gameState.playerState ? gameState.playerState.currentTrackId || "street" : "street";
  }

  function currentAge(gameState) {
    if (gameState && gameState.worldState && gameState.worldState.timeline && typeof gameState.worldState.timeline.playerAgeYears === "number") {
      return gameState.worldState.timeline.playerAgeYears;
    }
    return gameState && gameState.player && gameState.player.conditions ? gameState.player.conditions.startingAge || 16 : 16;
  }

  function compareRanks(leftId, rightId) {
    if (typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.compareRanks) {
      return JuniorAmateurSystem.compareRanks(leftId || "", rightId || "");
    }
    if (leftId === rightId) {
      return 0;
    }
    return String(leftId || "").localeCompare(String(rightId || ""));
  }

  function trainerRelationScore(gameState) {
    var assignment = gameState && gameState.world ? gameState.world.trainerAssignment || null : null;
    var relationships = gameState && gameState.world && gameState.world.relationships instanceof Array ? gameState.world.relationships : [];
    var i;
    if (!assignment || !assignment.npcId) {
      return 0;
    }
    for (i = 0; i < relationships.length; i += 1) {
      if (relationships[i] && relationships[i].npcId === assignment.npcId) {
        return typeof relationships[i].score === "number" ? relationships[i].score : 0;
      }
    }
    return 0;
  }

  function biographyFlags(gameState) {
    return gameState && gameState.player && gameState.player.biography && gameState.player.biography.flags instanceof Array ? gameState.player.biography.flags : [];
  }

  function hasAllFlags(flagPool, flags) {
    var i;
    if (!(flags instanceof Array) || !flags.length) {
      return true;
    }
    if (!(flagPool instanceof Array)) {
      return false;
    }
    for (i = 0; i < flags.length; i += 1) {
      if (flagPool.indexOf(flags[i]) === -1) {
        return false;
      }
    }
    return true;
  }

  function playerContext(gameState) {
    var player = gameState && gameState.player ? gameState.player : {};
    var amateur = player.amateur || {};
    var street = player.street || {};
    var pro = player.pro || {};
    var record = player.record || {};
    var amateurRecord = amateur.record || {};
    var proRecord = pro.proRecord || {};
    var flags = biographyFlags(gameState);
    var teamStatus = amateur.nationalTeamStatus || "none";
    return {
      actorType: "player",
      actorId: gameState && gameState.playerState ? gameState.playerState.fighterEntityId || "fighter_player_main" : "fighter_player_main",
      trackId: playerTrackId(gameState),
      countryId: player.currentCountry || player.homeCountry || "",
      age: currentAge(gameState),
      streetRating: street.streetRating || 0,
      fame: player.resources ? player.resources.fame || 0 : 0,
      money: player.resources ? player.resources.money || 0 : 0,
      health: player.resources ? player.resources.health || 100 : 100,
      wear: player.conditions ? player.conditions.wear || 0 : 0,
      morale: player.conditions ? player.conditions.morale || 55 : 55,
      amateurRankId: amateur.rankId || "",
      amateurScore: amateur.score || 0,
      teamStatus: teamStatus,
      careerWins: record.wins || 0,
      careerLosses: record.losses || 0,
      amateurWins: amateurRecord.wins || 0,
      amateurLosses: amateurRecord.losses || 0,
      proWins: proRecord.wins || 0,
      proLosses: proRecord.losses || 0,
      knownNpcCount: gameState && gameState.narrativeState && gameState.narrativeState.knownNpcIds instanceof Array ? gameState.narrativeState.knownNpcIds.length : 0,
      trainerRelationScore: trainerRelationScore(gameState),
      biographyFlags: clone(flags),
      isDroppedFromTeam: flags.indexOf("dropped_from_national_team") !== -1 || teamStatus === "dropped",
      isOlympicLevel: amateur.rankId === "olympic_level" || flags.indexOf("olympic_hopeful") !== -1,
      lateAmateurWindowClosed: playerTrackId(gameState) === "amateur" && currentAge(gameState) > 28,
      proFallbackEligible: typeof StreetCareerEngine !== "undefined" && StreetCareerEngine.canReturnToStreet ? StreetCareerEngine.canReturnToStreet(gameState) : (playerTrackId(gameState) === "pro" && (proRecord.losses || 0) >= 4)
    };
  }

  function npcContext(gameState, fighter) {
    var flags = fighter && fighter.worldHistoryHooks instanceof Array ? fighter.worldHistoryHooks : [];
    var trackId = fighter ? (fighter.currentTrack || fighter.trackId || "street") : "street";
    var record = fighter && fighter.record ? fighter.record : {};
    var proRecord = fighter && fighter.proRecord ? fighter.proRecord : {};
    return {
      actorType: "npc",
      actorId: fighter && fighter.id ? fighter.id : "",
      fighter: fighter || null,
      trackId: trackId,
      countryId: fighter && fighter.country ? fighter.country : "",
      age: fighter && typeof fighter.age === "number" ? fighter.age : 16,
      streetRating: fighter && typeof fighter.streetRating === "number" ? fighter.streetRating : 0,
      fame: fighter && typeof fighter.fame === "number" ? fighter.fame : 0,
      money: 0,
      health: fighter && fighter.healthState && typeof fighter.healthState.health === "number" ? fighter.healthState.health : 100,
      wear: fighter && fighter.wearState && typeof fighter.wearState.wear === "number" ? fighter.wearState.wear : 0,
      morale: fighter && fighter.moraleState && typeof fighter.moraleState.morale === "number" ? fighter.moraleState.morale : 55,
      amateurRankId: fighter && fighter.amateurRank ? fighter.amateurRank : "",
      amateurScore: 0,
      teamStatus: fighter && fighter.nationalTeamStatus ? fighter.nationalTeamStatus : "none",
      careerWins: record.wins || 0,
      careerLosses: record.losses || 0,
      amateurWins: record.wins || 0,
      amateurLosses: record.losses || 0,
      proWins: proRecord.wins || 0,
      proLosses: proRecord.losses || 0,
      knownNpcCount: 0,
      trainerRelationScore: 0,
      biographyFlags: clone(flags),
      isDroppedFromTeam: flags.indexOf("dropped_from_national_team") !== -1 || (fighter && fighter.nationalTeamStatus === "dropped"),
      isOlympicLevel: fighter && fighter.amateurRank === "olympic_level",
      lateAmateurWindowClosed: trackId === "amateur" && fighter && fighter.age > 28,
      proFallbackEligible: trackId === "pro" && ((proRecord.losses || 0) >= 4 || (fighter && fighter.wearState && fighter.wearState.wear >= 75))
    };
  }

  function ensureNarrativeState(gameState) {
    if (!gameState.narrativeState || typeof gameState.narrativeState !== "object") {
      gameState.narrativeState = { id: "narrative_state_main" };
    }
    if (!(gameState.narrativeState.biographyFlags instanceof Array)) { gameState.narrativeState.biographyFlags = []; }
    if (!(gameState.narrativeState.activeArcIds instanceof Array)) { gameState.narrativeState.activeArcIds = []; }
    if (!(gameState.narrativeState.rivalryIds instanceof Array)) { gameState.narrativeState.rivalryIds = []; }
    if (!(gameState.narrativeState.knownNpcIds instanceof Array)) { gameState.narrativeState.knownNpcIds = []; }
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
    return gameState.narrativeState;
  }

  function ensureState(gameState) {
    ensureNarrativeState(gameState);
    return gameState.narrativeState;
  }

  function playerHasProHistory(gameState) {
    var player = gameState && gameState.player ? gameState.player : {};
    var pro = player.pro || {};
    var history = pro.history instanceof Array ? pro.history : [];
    var flags = biographyFlags(gameState);
    var i;
    if (flags.indexOf("turned_pro") !== -1) {
      return true;
    }
    for (i = 0; i < history.length; i += 1) {
      if (history[i] && history[i].type === "turned_pro") {
        return true;
      }
    }
    return false;
  }

  function playerTransitionPolicy(gameState, definition, context) {
    var blockers = [];
    var hasProHistory = playerHasProHistory(gameState);
    if (!definition || context.actorType !== "player") {
      return { ok: true, blockers: blockers, hasProHistory: hasProHistory };
    }
    if (definition.playerVisible === false) {
      blockers.push("Этот переход больше не используется.");
      return { ok: false, blockers: blockers, hasProHistory: hasProHistory };
    }
    if (definition.fromTrackIds instanceof Array && definition.fromTrackIds.length && definition.fromTrackIds.indexOf(context.trackId) === -1) {
      blockers.push("\u0422\u0435\u043a\u0443\u0449\u0438\u0439 \u0442\u0440\u0435\u043a \u043d\u0435 \u043f\u043e\u0434\u0445\u043e\u0434\u0438\u0442.");
    }
    if (definition.toTrackId === "amateur" && hasProHistory) {
      blockers.push((definition.blockers && definition.blockers.formerProText) || "\u041f\u043e\u0441\u043b\u0435 \u0441\u0442\u0430\u0440\u0442\u0430 \u043f\u0440\u043e\u0444\u0438 \u043f\u0443\u0442\u044c \u0432 \u043b\u044e\u0431\u0438\u0442\u0435\u043b\u0438 \u0437\u0430\u043a\u0440\u044b\u0442.");
    }
    if (definition.toTrackId === "pro" && hasProHistory && context.trackId !== "pro") {
      blockers.push((definition.blockers && definition.blockers.formerProText) || "\u0415\u0441\u043b\u0438 \u0442\u044b \u0443\u0436\u0435 \u0443\u0445\u043e\u0434\u0438\u043b \u0438\u0437 \u043f\u0440\u043e\u0444\u0438, \u043e\u0431\u0440\u0430\u0442\u043d\u044b\u0439 \u0432\u0445\u043e\u0434 \u0432 \u043f\u0440\u043e\u0444\u0438 \u0437\u0430\u043a\u0440\u044b\u0442.");
    }
    return {
      ok: blockers.length === 0,
      blockers: blockers,
      hasProHistory: hasProHistory
    };
  }

  function meetsLegacyGate(gameState, definition, context) {
    if (!definition || context.actorType !== "player") {
      return true;
    }
    if (definition.id === "street_to_amateur" || definition.id === "street_to_pro" || definition.id === "amateur_to_pro" || definition.id === "amateur_to_street_fallback" || definition.id === "pro_to_street_comeback") {
      return true;
    }
    if (definition.id === "street_to_amateur") {
      return typeof StreetCareerEngine === "undefined" || !StreetCareerEngine.canMoveToAmateur || StreetCareerEngine.canMoveToAmateur(gameState);
    }
    if (definition.id === "street_to_pro") {
      if (typeof ProCareerEngine !== "undefined" && ProCareerEngine.canTurnPro && ProCareerEngine.canTurnPro(gameState, "street")) {
        return true;
      }
      return typeof StreetCareerEngine === "undefined" || !StreetCareerEngine.canMoveToProDirect || StreetCareerEngine.canMoveToProDirect(gameState);
    }
    if (definition.toTrackId === "pro") {
      return typeof ProCareerEngine === "undefined" || !ProCareerEngine.canTurnPro || ProCareerEngine.canTurnPro(gameState, context.trackId);
    }
    if (definition.id === "pro_to_street_comeback") {
      return typeof StreetCareerEngine === "undefined" || !StreetCareerEngine.canReturnToStreet || StreetCareerEngine.canReturnToStreet(gameState);
    }
    return true;
  }

  function evaluateRequirements(gameState, definition, context) {
    var req = definition && definition.requirements ? definition.requirements : {};
    var blockers = [];
    var playerPolicy = playerTransitionPolicy(gameState, definition, context);
    var requiredStreetRating = typeof req.minStreetRating === "number" ? req.minStreetRating : 0;
    var requiredFame = typeof req.minFame === "number" ? req.minFame : 0;
    var requiredMoney = typeof req.minMoney === "number" ? req.minMoney : null;
    var maxMoney = typeof req.maxMoney === "number" ? req.maxMoney : null;
    var hardMaxAge = typeof req.hardMaxAge === "number" ? req.hardMaxAge : null;
    if (context.actorType === "player") {
      blockers = blockers.concat(playerPolicy.blockers || []);
    } else if (definition.fromTrackIds instanceof Array && definition.fromTrackIds.length && definition.fromTrackIds.indexOf(context.trackId) === -1) {
      blockers.push("\u0422\u0435\u043a\u0443\u0449\u0438\u0439 \u0442\u0440\u0435\u043a \u043d\u0435 \u043f\u043e\u0434\u0445\u043e\u0434\u0438\u0442.");
    }
    if (typeof req.minAge === "number" && context.age < req.minAge) {
      blockers.push((definition.blockers && definition.blockers.ageText) || ("\u041d\u0443\u0436\u0435\u043d \u0432\u043e\u0437\u0440\u0430\u0441\u0442 " + req.minAge + "+."));
    }
    if (typeof req.maxAge === "number" && context.age > req.maxAge) {
      blockers.push((definition.blockers && definition.blockers.maxAgeText) || "\u041f\u043e\u0437\u0434\u043d\u043e \u0434\u043b\u044f \u044d\u0442\u043e\u0433\u043e \u043f\u0435\u0440\u0435\u0445\u043e\u0434\u0430.");
    }
    if (hardMaxAge != null && context.age > hardMaxAge) {
      blockers.push((definition.blockers && definition.blockers.hardMaxAgeText) || "\u0412\u043e\u0437\u0440\u0430\u0441\u0442 \u0443\u0436\u0435 \u0441\u043b\u0438\u0448\u043a\u043e\u043c \u0432\u044b\u0441\u043e\u043a \u0434\u043b\u044f \u044d\u0442\u043e\u0433\u043e \u043f\u0435\u0440\u0435\u0445\u043e\u0434\u0430.");
    }
    if (typeof req.lateStartAge === "number" && context.age >= req.lateStartAge) {
      requiredStreetRating += typeof req.lateStartStreetRatingBonus === "number" ? req.lateStartStreetRatingBonus : 0;
      requiredFame += typeof req.lateStartFameBonus === "number" ? req.lateStartFameBonus : 0;
    }
    if (requiredStreetRating > 0 && context.streetRating < requiredStreetRating) {
      blockers.push((definition.blockers && definition.blockers.streetRatingText) || ("\u041d\u0443\u0436\u043d\u043e " + requiredStreetRating + " street-\u0440\u0435\u0439\u0442\u0438\u043d\u0433\u0430."));
    }
    if (requiredFame > 0 && context.fame < requiredFame) {
      blockers.push((definition.blockers && definition.blockers.fameText) || ("\u041d\u0443\u0436\u043d\u043e " + requiredFame + " \u0441\u043b\u0430\u0432\u044b."));
    }
    if (requiredMoney != null && context.money < requiredMoney) {
      blockers.push((definition.blockers && definition.blockers.moneyText) || ("\u041d\u0443\u0436\u043d\u043e \u0445\u043e\u0442\u044f \u0431\u044b $" + requiredMoney + "."));
    }
    if (maxMoney != null && context.money > maxMoney) {
      blockers.push((definition.blockers && definition.blockers.maxMoneyText) || "\u0421\u043b\u0438\u0448\u043a\u043e\u043c \u043c\u043d\u043e\u0433\u043e \u0434\u0435\u043d\u0435\u0433 \u0434\u043b\u044f \u044d\u0442\u043e\u0433\u043e \u0448\u0430\u0433\u0430.");
    }
    if (typeof req.maxWear === "number" && context.wear > req.maxWear) {
      blockers.push((definition.blockers && definition.blockers.wearText) || "\u0421\u043b\u0438\u0448\u043a\u043e\u043c \u043c\u043d\u043e\u0433\u043e \u0438\u0437\u043d\u043e\u0441\u0430.");
    }
    if (typeof req.minHealth === "number" && context.health < req.minHealth) {
      blockers.push((definition.blockers && definition.blockers.healthText) || "\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u043d\u0443\u0436\u043d\u043e \u043f\u043e\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0437\u0434\u043e\u0440\u043e\u0432\u044c\u0435.");
    }
    if (typeof req.minAmateurScore === "number" && context.amateurScore < req.minAmateurScore) {
      blockers.push((definition.blockers && definition.blockers.amateurScoreText) || "\u041d\u0443\u0436\u0435\u043d \u0431\u043e\u043b\u0435\u0435 \u0441\u0438\u043b\u044c\u043d\u044b\u0439 \u043b\u044e\u0431\u0438\u0442\u0435\u043b\u044c\u0441\u043a\u0438\u0439 \u0431\u044d\u043a\u0433\u0440\u0430\u0443\u043d\u0434.");
    }
    if (req.minAmateurRankId && compareRanks(context.amateurRankId || "", req.minAmateurRankId) < 0) {
      blockers.push((definition.blockers && definition.blockers.amateurRankText) || "\u041d\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u0440\u0430\u0437\u0440\u044f\u0434\u0430.");
    }
    if (typeof req.minCareerWins === "number" && context.careerWins < req.minCareerWins) {
      blockers.push((definition.blockers && definition.blockers.resultsText) || "\u041d\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u043f\u043e\u0431\u0435\u0434.");
    }
    if (typeof req.minCareerLosses === "number" && context.careerLosses < req.minCareerLosses) {
      blockers.push((definition.blockers && definition.blockers.lossText) || "\u042d\u0442\u043e \u0440\u0430\u0437\u0432\u0438\u043b\u043a\u0430 \u0435\u0449\u0451 \u043d\u0435 \u043e\u0442\u043a\u0440\u044b\u043b\u0430\u0441\u044c.");
    }
    if (typeof req.minKnownNpcCount === "number" && context.knownNpcCount < req.minKnownNpcCount) {
      blockers.push((definition.blockers && definition.blockers.connectionsText) || "\u041f\u043e\u043a\u0430 \u043c\u0430\u043b\u043e \u0441\u0432\u044f\u0437\u0435\u0439.");
    }
    if (typeof req.minTrainerRelationScore === "number" && context.trainerRelationScore < req.minTrainerRelationScore) {
      blockers.push((definition.blockers && definition.blockers.trainerRelationText) || "\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u043d\u0443\u0436\u043d\u043e\u0439 \u043e\u043f\u043e\u0440\u044b \u0443 \u0442\u0440\u0435\u043d\u0435\u0440\u0430.");
    }
    if (req.requiredNationalTeamStatuses instanceof Array && req.requiredNationalTeamStatuses.length && req.requiredNationalTeamStatuses.indexOf(context.teamStatus) === -1) {
      blockers.push((definition.blockers && definition.blockers.teamStatusText) || "\u041d\u0435\u0442 \u043d\u0443\u0436\u043d\u043e\u0433\u043e \u0441\u0442\u0430\u0442\u0443\u0441\u0430 \u0432 \u0441\u0431\u043e\u0440\u043d\u043e\u0439.");
    }
    if (req.requiredBiographyFlags instanceof Array && !hasAllFlags(context.biographyFlags, req.requiredBiographyFlags)) {
      blockers.push((definition.blockers && definition.blockers.flagsText) || "\u041f\u043e\u043a\u0430 \u043d\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u043d\u0443\u0436\u043d\u043e\u0439 \u0438\u0441\u0442\u043e\u0440\u0438\u0438.");
    }
    if (req.requireProStreetFallback && !context.proFallbackEligible) {
      blockers.push((definition.blockers && definition.blockers.proFallbackText) || "\u041f\u043e\u043a\u0430 \u043d\u0435 \u0442\u043e \u043e\u043a\u043d\u043e \u0434\u043b\u044f street-\u043a\u0430\u043c\u0431\u044d\u043a\u0430.");
    }
    if (!meetsLegacyGate(gameState, definition, context)) {
      blockers.push((definition.blockers && definition.blockers.legacyGateText) || "\u0421\u0442\u0430\u0440\u0430\u044f \u043b\u043e\u0433\u0438\u043a\u0430 \u0442\u0440\u0435\u043a\u0430 \u043f\u043e\u043a\u0430 \u043d\u0435 \u043f\u0443\u0441\u043a\u0430\u0435\u0442 \u0441\u044e\u0434\u0430.");
    }
    return {
      ok: blockers.length === 0,
      blockers: blockers
    };
  }

  function buildTransitionCard(gameState, definition, context) {
    var evaluation = evaluateRequirements(gameState, definition, context);
    var gains = definition && definition.consequences && definition.consequences.gains instanceof Array ? clone(definition.consequences.gains) : [];
    var givesUp = definition && definition.consequences && definition.consequences.givesUp instanceof Array ? clone(definition.consequences.givesUp) : [];
    var lateWarning = "";
    if (definition && definition.requirements && typeof definition.requirements.lateStartAge === "number" && context.age >= definition.requirements.lateStartAge) {
      lateWarning = "\u041f\u043e\u0437\u0434\u043d\u0438\u0439 \u0441\u0442\u0430\u0440\u0442: \u0432\u0445\u043e\u0434 \u0432 \u043d\u043e\u0432\u044b\u0439 \u0442\u0440\u0435\u043a \u0443\u0436\u0435 \u0434\u0430\u0451\u0442\u0441\u044f \u0442\u044f\u0436\u0435\u043b\u0435\u0435.";
    }
    return {
      id: definition.id,
      transitionType: definition.transitionType,
      fromTrackIds: clone(definition.fromTrackIds || []),
      toTrackId: definition.toTrackId || context.trackId,
      title: definition.title || definition.id,
      buttonLabel: definition.buttonLabel || definition.title || definition.id,
      available: evaluation.ok,
      blockedReasons: clone(evaluation.blockers),
      gains: gains,
      givesUp: givesUp,
      narrativeTags: clone(definition.narrativeTags || []),
      note: definition.note || "",
      eventTitle: definition.eventTitle || definition.title || "",
      lateWarning: lateWarning,
      age: context.age,
      trackId: context.trackId
    };
  }

  function trackLabel(trackId) {
    if (trackId === "amateur") {
      return "\u043b\u044e\u0431\u0438\u0442\u0435\u043b\u0438";
    }
    if (trackId === "pro") {
      return "\u043f\u0440\u043e\u0444\u0438";
    }
    return "\u0443\u043b\u0438\u0446\u0430";
  }

  function localizedRankLabel(countryId, rankId) {
    if (!rankId) {
      return "";
    }
    if (typeof ContentLoader !== "undefined" && ContentLoader.getLocalizedRankLabel) {
      return ContentLoader.getLocalizedRankLabel(countryId || "default", rankId);
    }
    if (typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.getLocalizedRankLabel) {
      return JuniorAmateurSystem.getLocalizedRankLabel(countryId || "default", rankId);
    }
    return rankId;
  }

  function addSummaryLine(list, text) {
    var i;
    if (!(list instanceof Array) || !text) {
      return;
    }
    for (i = 0; i < list.length; i += 1) {
      if (list[i] === text) {
        return;
      }
    }
    list.push(text);
  }

  function summarizeRequirements(definition, context) {
    var req = definition && definition.requirements ? definition.requirements : {};
    var list = [];
    var minStreetRating = typeof req.minStreetRating === "number" ? req.minStreetRating : 0;
    var minFame = typeof req.minFame === "number" ? req.minFame : 0;
    if (typeof req.minAge === "number") {
      addSummaryLine(list, req.minAge + "+ \u043b\u0435\u0442");
    }
    if (typeof req.maxAge === "number") {
      addSummaryLine(list, "\u0434\u043e " + req.maxAge + " \u043b\u0435\u0442");
    }
    if (typeof req.hardMaxAge === "number") {
      addSummaryLine(list, "\u0432\u0445\u043e\u0434 \u0437\u0430\u043a\u0440\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u043f\u043e\u0441\u043b\u0435 " + req.hardMaxAge);
    }
    if (typeof req.lateStartAge === "number" && context.age >= req.lateStartAge) {
      minStreetRating += typeof req.lateStartStreetRatingBonus === "number" ? req.lateStartStreetRatingBonus : 0;
      minFame += typeof req.lateStartFameBonus === "number" ? req.lateStartFameBonus : 0;
    }
    if (minStreetRating > 0) {
      addSummaryLine(list, "street-\u0440\u0435\u0439\u0442\u0438\u043d\u0433 " + minStreetRating + "+");
    }
    if (minFame > 0) {
      addSummaryLine(list, "\u0441\u043b\u0430\u0432\u0430 " + minFame + "+");
    }
    if (typeof req.minMoney === "number") {
      addSummaryLine(list, "\u043d\u0443\u0436\u043d\u043e \u0445\u043e\u0442\u044f \u0431\u044b $" + req.minMoney);
    }
    if (req.minAmateurRankId) {
      addSummaryLine(list, "\u0440\u0430\u0437\u0440\u044f\u0434 \u043e\u0442 " + localizedRankLabel(context.countryId, req.minAmateurRankId));
    }
    if (typeof req.minAmateurScore === "number") {
      addSummaryLine(list, "\u043e\u0447\u043a\u0438 \u043b\u044e\u0431\u0438\u0442\u0435\u043b\u0435\u0439 " + req.minAmateurScore + "+");
    }
    if (typeof req.minCareerWins === "number") {
      addSummaryLine(list, "\u043f\u043e\u0431\u0435\u0434\u044b " + req.minCareerWins + "+");
    }
    if (req.requiredNationalTeamStatuses instanceof Array && req.requiredNationalTeamStatuses.length) {
      addSummaryLine(list, "\u0441\u0442\u0430\u0442\u0443\u0441 \u0432 \u0441\u0431\u043e\u0440\u043d\u043e\u0439");
    }
    if (req.requiredBiographyFlags instanceof Array && req.requiredBiographyFlags.length) {
      addSummaryLine(list, "\u043d\u0443\u0436\u043d\u0430 \u043d\u0443\u0436\u043d\u0430\u044f \u0438\u0441\u0442\u043e\u0440\u0438\u044f");
    }
    if (typeof req.maxWear === "number") {
      addSummaryLine(list, "\u0438\u0437\u043d\u043e\u0441 \u0434\u043e " + req.maxWear);
    }
    if (typeof req.minHealth === "number") {
      addSummaryLine(list, "\u0437\u0434\u043e\u0440\u043e\u0432\u044c\u0435 " + req.minHealth + "+");
    }
    if (req.requireProStreetFallback) {
      addSummaryLine(list, "\u043d\u0443\u0436\u0435\u043d real street-\u043a\u0430\u043c\u0431\u044d\u043a");
    }
    return list.slice(0, 4);
  }

  function transitionReturnPath(definition, context) {
    if (!definition) {
      return "";
    }
    if (definition.id === "street_to_amateur") {
      return "\u041d\u0430 \u0443\u043b\u0438\u0446\u0443 \u043c\u043e\u0436\u043d\u043e \u0443\u0439\u0442\u0438 \u0432 \u043b\u044e\u0431\u043e\u0439 \u043c\u043e\u043c\u0435\u043d\u0442, \u043f\u043e\u043a\u0430 \u0442\u044b \u0435\u0449\u0451 \u043d\u0438 \u0440\u0430\u0437\u0443 \u043d\u0435 \u043d\u0430\u0447\u0438\u043d\u0430\u043b \u043f\u0440\u043e\u0444\u0438.";
    }
    if (definition.id === "street_to_pro") {
      return "\u042d\u0442\u043e \u043e\u0434\u043d\u043e\u0441\u0442\u043e\u0440\u043e\u043d\u043d\u0438\u0439 \u0448\u0430\u0433: \u043f\u043e\u0441\u043b\u0435 \u043f\u0440\u043e\u0444\u0438 \u043f\u0443\u0442\u044c \u0432 \u043b\u044e\u0431\u0438\u0442\u0435\u043b\u0438 \u0437\u0430\u043a\u0440\u043e\u0435\u0442\u0441\u044f, \u0430 \u043f\u043e\u0441\u043b\u0435 street-\u0432\u043e\u0437\u0432\u0440\u0430\u0442\u0430 \u043d\u0430\u0437\u0430\u0434 \u0432 \u043f\u0440\u043e\u0444\u0438 \u0443\u0436\u0435 \u043d\u0435 \u0432\u043e\u0439\u0442\u0438.";
    }
    if (definition.id === "amateur_to_pro" || definition.id === "national_team_member_to_pro" || definition.id === "dropped_team_to_pro") {
      return "\u042d\u0442\u043e \u043e\u0434\u043d\u043e\u0441\u0442\u043e\u0440\u043e\u043d\u043d\u0438\u0439 \u0448\u0430\u0433: \u043f\u043e\u0441\u043b\u0435 \u043f\u0440\u043e\u0444\u0438 \u0432 \u043b\u044e\u0431\u0438\u0442\u0435\u043b\u0438 \u0432\u0435\u0440\u043d\u0443\u0442\u044c\u0441\u044f \u0443\u0436\u0435 \u043d\u0435\u043b\u044c\u0437\u044f.";
    }
    if (definition.id === "amateur_to_street_fallback") {
      return "\u041e\u0431\u0440\u0430\u0442\u043d\u044b\u0439 \u0445\u043e\u0434 \u0432 \u043b\u044e\u0431\u0438\u0442\u0435\u043b\u0438 \u043e\u0442\u043a\u0440\u044b\u0442, \u043f\u043e\u043a\u0430 \u0442\u044b \u0435\u0449\u0451 \u043d\u0438 \u0440\u0430\u0437\u0443 \u043d\u0435 \u043d\u0430\u0447\u0438\u043d\u0430\u043b \u043f\u0440\u043e\u0444\u0438.";
    }
    if (definition.id === "pro_to_street_comeback") {
      return "\u042d\u0442\u043e \u043e\u043a\u043e\u043d\u0447\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0443\u0445\u043e\u0434 \u0438\u0437 \u043f\u0440\u043e\u0444\u0438: \u043d\u0430\u0437\u0430\u0434 \u0432 \u043f\u0440\u043e\u0444\u0438 \u0443\u0436\u0435 \u043d\u0435 \u0432\u043e\u0439\u0442\u0438, \u0432 \u043b\u044e\u0431\u0438\u0442\u0435\u043b\u0438 \u0442\u043e\u0436\u0435.";
    }
    return "\u0412\u043e\u0437\u0432\u0440\u0430\u0442 \u0432\u043e\u0437\u043c\u043e\u0436\u0435\u043d \u0447\u0435\u0440\u0435\u0437 \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0443\u044e \u043a\u0430\u0440\u044c\u0435\u0440\u043d\u0443\u044e \u0440\u0430\u0437\u0432\u0438\u043b\u043a\u0443.";
  }

  function availableReasonText(definition, context) {
    if (!definition) {
      return "\u041f\u0435\u0440\u0435\u0445\u043e\u0434 \u0443\u0436\u0435 \u043e\u0442\u043a\u0440\u044b\u0442.";
    }
    if (definition.id === "street_to_pro") {
      return "\u041c\u043e\u0436\u043d\u043e \u0441\u0440\u0430\u0437\u0443 \u0443\u0439\u0442\u0438 \u0432 \u043f\u0440\u043e\u0444\u0438.";
    }
    if (definition.id === "street_to_amateur") {
      return "\u041c\u043e\u0436\u043d\u043e \u0443\u0439\u0442\u0438 \u0432 \u043b\u044e\u0431\u0438\u0442\u0435\u043b\u0438.";
    }
    if (definition.id === "amateur_to_pro" || definition.id === "national_team_member_to_pro" || definition.id === "dropped_team_to_pro") {
      return "\u041c\u043e\u0436\u043d\u043e \u0443\u0439\u0442\u0438 \u0432 \u043f\u0440\u043e\u0444\u0438.";
    }
    if (definition.id === "amateur_to_street_fallback") {
      return "\u041c\u043e\u0436\u043d\u043e \u0443\u0439\u0442\u0438 \u043d\u0430 \u0443\u043b\u0438\u0446\u0443.";
    }
    if (definition.id === "pro_to_street_comeback") {
      return "\u041c\u043e\u0436\u043d\u043e \u0432\u0435\u0440\u043d\u0443\u0442\u044c\u0441\u044f \u043d\u0430 \u0443\u043b\u0438\u0446\u0443.";
    }
    if (definition.id === "dropped_team_regional_rebuild") {
      return "\u041c\u043e\u0436\u043d\u043e \u043e\u0441\u0442\u0430\u0442\u044c\u0441\u044f \u0432 \u0441\u0438\u0441\u0442\u0435\u043c\u0435 \u0438 \u0441\u043e\u0431\u0440\u0430\u0442\u044c\u0441\u044f \u0437\u0430\u043d\u043e\u0432\u043e.";
    }
    return "\u041c\u043e\u0436\u043d\u043e \u043f\u0435\u0440\u0435\u0439\u0442\u0438 \u043d\u0430 \u043f\u0443\u0442\u044c '" + trackLabel(definition.toTrackId || context.trackId) + "'.";
  }

  function blockedReasonText(card, definition, context) {
    if (card && card.blockedReasons instanceof Array && card.blockedReasons.length) {
      return card.blockedReasons[0];
    }
    return "\u041f\u043e\u043a\u0430 \u043f\u0435\u0440\u0435\u0445\u043e\u0434 \u0437\u0430\u043a\u0440\u044b\u0442.";
  }

  function transitionRelevanceScore(definition, context, card) {
    var score = 10;
    if (!definition) {
      return score;
    }
    if (card.available) {
      score += 25;
    }
    if (context.trackId === "street") {
      if (definition.id === "street_to_pro") {
        score += 32;
      } else if (definition.id === "street_to_amateur") {
        score += 30;
      }
    } else if (context.trackId === "amateur") {
      if (definition.id === "national_team_member_to_pro") {
        score += (context.teamStatus === "active" || context.teamStatus === "reserve") ? 38 : 8;
      } else if (definition.id === "amateur_to_pro") {
        score += 32;
      } else if (definition.id === "dropped_team_to_pro") {
        score += context.isDroppedFromTeam ? 34 : 2;
      } else if (definition.id === "dropped_team_regional_rebuild") {
        score += context.isDroppedFromTeam ? 30 : 0;
      } else if (definition.id === "amateur_to_street_fallback") {
        score += 24;
      }
    } else if (context.trackId === "pro") {
      if (definition.id === "pro_to_street_comeback") {
        score += 34;
      }
    }
    return score;
  }

  function transitionTimingScore(definition, context, card) {
    var score = 8;
    if (card.available) {
      score += 18;
    }
    if (definition && definition.requirements && context.actorType !== "player") {
      if (typeof definition.requirements.hardMaxAge === "number") {
        if (context.age >= definition.requirements.hardMaxAge - 1) {
          score += 12;
        }
        if (context.age > definition.requirements.hardMaxAge) {
          score -= 16;
        }
      }
      if (typeof definition.requirements.minAge === "number") {
        if (context.age === definition.requirements.minAge) {
          score += 10;
        }
        if (context.age + 1 === definition.requirements.minAge) {
          score += 4;
        }
      }
    }
    return score;
  }

  function transitionEligibilityScore(card) {
    var blockers = card && card.blockedReasons instanceof Array ? card.blockedReasons.length : 0;
    if (card && card.available) {
      return 100;
    }
    return Math.max(6, 80 - blockers * 22);
  }

  function decorateTransitionCard(gameState, card, context) {
    var definition = getTransition(card ? card.id : "") || card || {};
    var decorated = clone(card || {});
    var requirementsSummary = summarizeRequirements(definition, context);
    decorated.relevanceScore = transitionRelevanceScore(definition, context, decorated);
    decorated.timingScore = transitionTimingScore(definition, context, decorated);
    decorated.eligibilityScore = transitionEligibilityScore(decorated);
    decorated.score = decorated.relevanceScore + decorated.timingScore + decorated.eligibilityScore;
    decorated.requirementsSummary = requirementsSummary;
    decorated.requirementsPreview = requirementsSummary.length ? requirementsSummary.slice(0, 3).join(", ") : "\u041e\u0442\u0434\u0435\u043b\u044c\u043d\u044b\u0445 \u0442\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u0439 \u043d\u0435\u0442.";
    decorated.gainsPreview = decorated.gains && decorated.gains.length ? decorated.gains.slice(0, 2).join("; ") : "\u042f\u0432\u043d\u043e\u0433\u043e \u0431\u043e\u043d\u0443\u0441\u0430 \u043d\u0435\u0442.";
    decorated.givesUpPreview = decorated.givesUp && decorated.givesUp.length ? decorated.givesUp.slice(0, 2).join("; ") : "\u041d\u0438\u0447\u0435\u0433\u043e \u043a\u0440\u0438\u0442\u0438\u0447\u043d\u043e\u0433\u043e \u043d\u0435 \u0442\u0435\u0440\u044f\u0435\u0448\u044c.";
    decorated.returnPathSummary = transitionReturnPath(definition, context);
    decorated.availableTransitionReason = availableReasonText(definition, context);
    decorated.blockedTransitionReason = blockedReasonText(decorated, definition, context);
    decorated.explanationText = decorated.available ? decorated.availableTransitionReason : decorated.blockedTransitionReason;
    return decorated;
  }

  function compareDecoratedTransitionCards(left, right) {
    var leftAvailable = left && left.available ? 1 : 0;
    var rightAvailable = right && right.available ? 1 : 0;
    if (leftAvailable !== rightAvailable) {
      return rightAvailable - leftAvailable;
    }
    if ((right.score || 0) !== (left.score || 0)) {
      return (right.score || 0) - (left.score || 0);
    }
    if ((right.relevanceScore || 0) !== (left.relevanceScore || 0)) {
      return (right.relevanceScore || 0) - (left.relevanceScore || 0);
    }
    return String(left.id || "").localeCompare(String(right.id || ""));
  }

  function rankPlayerTransitionCards(gameState, cards) {
    var context = playerContext(gameState);
    var source = cards instanceof Array ? cards : evaluatePlayerTransitions(gameState);
    var list = [];
    var i;
    for (i = 0; i < source.length; i += 1) {
      list.push(decorateTransitionCard(gameState, source[i], context));
    }
    list.sort(compareDecoratedTransitionCards);
    return list;
  }

  function topPlayerTransitionCards(gameState, limit, cards) {
    var ranked = rankPlayerTransitionCards(gameState, cards);
    var maxItems = typeof limit === "number" && limit > 0 ? limit : 2;
    if (ranked.length > maxItems) {
      ranked = ranked.slice(0, maxItems);
    }
    return ranked;
  }

  function evaluatePlayerTransitions(gameState) {
    var definitions = listTransitions();
    var context = playerContext(gameState);
    var result = [];
    var i;
    for (i = 0; i < definitions.length; i += 1) {
      if (definitions[i] && definitions[i].playerVisible === false) {
        continue;
      }
      result.push(buildTransitionCard(gameState, definitions[i], context));
    }
    return result;
  }

  function canPlayerTransition(gameState, transitionId) {
    var cards = evaluatePlayerTransitions(gameState);
    var i;
    for (i = 0; i < cards.length; i += 1) {
      if (cards[i].id === transitionId) {
        return cards[i].available;
      }
    }
    return false;
  }

  function updateTransitionStore(root, cards) {
    var i;
    root.availableTransitionIds = [];
    root.availableTransitionsById = {};
    for (i = 0; i < cards.length; i += 1) {
      root.availableTransitionIds.push(cards[i].id);
      root.availableTransitionsById[cards[i].id] = clone(cards[i]);
    }
  }

  function eventStateEntry(root, eventId) {
    if (!root.transitionEventStateById[eventId] || typeof root.transitionEventStateById[eventId] !== "object") {
      root.transitionEventStateById[eventId] = {
        lastWeek: 0,
        fireCount: 0
      };
    }
    return root.transitionEventStateById[eventId];
  }

  function queueNotice(root, notice) {
    root.transitionNoticeQueue.push(clone(notice));
    if (root.transitionNoticeQueue.length > 12) {
      root.transitionNoticeQueue = root.transitionNoticeQueue.slice(root.transitionNoticeQueue.length - 12);
    }
  }

  function createEventNotice(eventDef, weekValue, chosenCard) {
    return {
      id: stableId("transition_notice", [eventDef.id, weekValue, chosenCard ? chosenCard.id : "general"]),
      week: weekValue,
      tone: eventDef.tone || "warn",
      title: eventDef.title || "",
      text: eventDef.text || "",
      eventId: eventDef.id,
      transitionId: chosenCard ? chosenCard.id : "",
      tags: clone(eventDef.tags || []),
      biography: eventDef.text || "",
      media: {
        type: "event",
        payload: {
          eventTitle: eventDef.title || "",
          tags: clone(eventDef.tags || [])
        }
      }
    };
  }

  function eventMatches(gameState, eventDef, cards, context, root) {
    var i;
    var matchingCards = [];
    var previousTeam = root.lastKnownNationalTeamStatus || "none";
    if (eventDef.transitionIds instanceof Array && eventDef.transitionIds.length) {
      for (i = 0; i < cards.length; i += 1) {
        if (cards[i].available && eventDef.transitionIds.indexOf(cards[i].id) !== -1) {
          matchingCards.push(cards[i]);
        }
      }
      if (!matchingCards.length) {
        return null;
      }
    }
    if (eventDef.requireDroppedTeam && !(context.isDroppedFromTeam || ((previousTeam === "active" || previousTeam === "reserve" || previousTeam === "candidate") && (context.teamStatus === "dropped" || context.teamStatus === "none")))) {
      return null;
    }
    if (eventDef.requireOlympicOrTeam && !(context.isOlympicLevel || context.teamStatus === "active" || context.teamStatus === "reserve")) {
      return null;
    }
    if (eventDef.requireLateAmateurWarning && !(context.trackId === "amateur" && context.age > 28 && compareRanks(context.amateurRankId || "", "national_master") < 0)) {
      return null;
    }
    if (matchingCards.length) {
      return matchingCards[0];
    }
    return {
      id: "",
      available: true
    };
  }

  function syncPlayerTransitionState(gameState, weekValue) {
    var root = ensureState(gameState);
    var cards = evaluatePlayerTransitions(gameState);
    var context = playerContext(gameState);
    var events = listTransitionEvents();
    var weekStamp = typeof weekValue === "number" ? weekValue : currentWeek(gameState);
    var i;
    var eventDef;
    var matchingCard;
    var eventState;
    updateTransitionStore(root, cards);
    root.transitionEventIds = [];
    root.transitionEventsById = {};
    for (i = 0; i < events.length; i += 1) {
      eventDef = events[i];
      matchingCard = eventMatches(gameState, eventDef, cards, context, root);
      if (!matchingCard) {
        continue;
      }
      eventState = eventStateEntry(root, eventDef.id);
      if (eventState.lastWeek === weekStamp) {
        continue;
      }
      if (eventDef.oncePerRun && eventState.fireCount > 0) {
        continue;
      }
      if ((eventDef.cooldownWeeks || 0) > 0 && weekStamp - (eventState.lastWeek || 0) < (eventDef.cooldownWeeks || 0)) {
        continue;
      }
      root.transitionEventIds.push(eventDef.id);
      root.transitionEventsById[eventDef.id] = clone(eventDef);
      queueNotice(root, createEventNotice(eventDef, weekStamp, matchingCard));
      eventState.lastWeek = weekStamp;
      eventState.fireCount += 1;
    }
    root.lastKnownTrackId = context.trackId;
    root.lastKnownNationalTeamStatus = context.teamStatus;
    root.lastTransitionSyncWeek = weekStamp;
    return cards;
  }

  function addBiographyTag(gameState, tag) {
    if (!tag || !gameState || !gameState.player || !gameState.player.biography) {
      return;
    }
    if (!(gameState.player.biography.flags instanceof Array)) {
      gameState.player.biography.flags = [];
    }
    addUnique(gameState.player.biography.flags, tag);
  }

  function applyTransitionTags(gameState, transitionId, definition) {
    var tags = definition && definition.narrativeTags instanceof Array ? definition.narrativeTags : [];
    var i;
    for (i = 0; i < tags.length; i += 1) {
      addBiographyTag(gameState, tags[i]);
    }
    if (transitionId === "street_to_amateur" && currentAge(gameState) >= 23) {
      addBiographyTag(gameState, "late_amateur_starter");
    }
    if (transitionId === "national_team_member_to_pro" || transitionId === "dropped_team_to_pro") {
      addBiographyTag(gameState, "former_national_team_member");
    }
    if (transitionId === "pro_to_street_comeback") {
      addBiographyTag(gameState, "street_comeback");
    }
  }

  function recordTransitionHistory(root, definition, weekValue, fromTrackId) {
    root.transitionHistory.unshift({
      id: stableId("transition_history", [definition.id, weekValue, root.transitionHistory.length + 1]),
      week: weekValue,
      transitionId: definition.id,
      transitionType: definition.transitionType,
      fromTrackId: fromTrackId,
      toTrackId: definition.toTrackId || fromTrackId,
      title: definition.title || definition.id
    });
    if (root.transitionHistory.length > 24) {
      root.transitionHistory = root.transitionHistory.slice(0, 24);
    }
  }

  function executePlayerTransition(gameState, transitionId, weekValue) {
    var definition = getTransition(transitionId);
    var cards = evaluatePlayerTransitions(gameState);
    var selected = null;
    var root = ensureState(gameState);
    var i;
    var fromTrackId;
    var ok = false;
    var proResult = null;
    var note;
    if (!definition) {
      return { ok: false, reason: "\u041f\u0435\u0440\u0435\u0445\u043e\u0434 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d." };
    }
    for (i = 0; i < cards.length; i += 1) {
      if (cards[i].id === transitionId) {
        selected = cards[i];
        break;
      }
    }
    if (!selected || !selected.available) {
      return {
        ok: false,
        reason: selected && selected.blockedReasons.length ? selected.blockedReasons[0] : "\u041f\u0435\u0440\u0435\u0445\u043e\u0434 \u043f\u043e\u043a\u0430 \u043d\u0435 \u043e\u0442\u043a\u0440\u044b\u0442."
      };
    }
    fromTrackId = playerTrackId(gameState);
    note = definition.note || "";
    if (transitionId === "dropped_team_regional_rebuild") {
      if (gameState.player && gameState.player.amateur) {
        if (gameState.player.amateur.nationalTeamStatus === "dropped") {
          gameState.player.amateur.nationalTeamStatus = "none";
        }
        gameState.player.amateur.score = Math.max(gameState.player.amateur.score || 0, 180);
      }
      ok = true;
    } else if (definition.toTrackId === "pro") {
      if (typeof ProCareerEngine !== "undefined" && ProCareerEngine.enterProTrack) {
        proResult = ProCareerEngine.enterProTrack(gameState, fromTrackId, weekValue || currentWeek(gameState), note);
        ok = !!(proResult && proResult.ok);
      }
    } else if (typeof StreetCareerEngine !== "undefined" && StreetCareerEngine.switchPlayerTrack) {
      ok = !!StreetCareerEngine.switchPlayerTrack(gameState, definition.toTrackId, weekValue || currentWeek(gameState), note);
    }
    if (!ok) {
      return { ok: false, reason: "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0432\u044b\u043f\u043e\u043b\u043d\u0438\u0442\u044c \u043f\u0435\u0440\u0435\u0445\u043e\u0434." };
    }
    applyTransitionTags(gameState, transitionId, definition);
    recordTransitionHistory(root, definition, weekValue || currentWeek(gameState), fromTrackId);
    syncPlayerTransitionState(gameState, weekValue || currentWeek(gameState));
    return {
      ok: true,
      transitionId: transitionId,
      toTrackId: definition.toTrackId || fromTrackId,
      title: definition.title || "",
      note: note,
      eventTitle: definition.eventTitle || definition.title || "",
      narrativeTags: clone(definition.narrativeTags || []),
      card: selected,
      proResult: proResult
    };
  }

  function chooseNpcTransition(gameState, fighter, weekValue) {
    var definitions = listTransitions();
    var context = npcContext(gameState, fighter);
    var i;
    var def;
    var card;
    if (!fighter || fighter.isPlayer || fighter.status === "retired") {
      return null;
    }
    for (i = 0; i < definitions.length; i += 1) {
      def = definitions[i];
      if (def.id === "dropped_team_regional_rebuild") {
        continue;
      }
      card = buildTransitionCard(gameState, def, context);
      if (!card.available) {
        continue;
      }
      if (def.id === "street_to_amateur" && (!(fighter.currentGymId || fighter.gymId) || context.age > 24)) {
        continue;
      }
      if (def.id === "street_to_pro" && context.fame < 16 && context.streetRating < 120) {
        continue;
      }
      if ((def.id === "amateur_to_pro" || def.id === "national_team_member_to_pro") && context.age < 18) {
        continue;
      }
      if (def.id === "amateur_to_street_fallback" && !(context.wear >= 72 || context.morale <= 34 || context.isDroppedFromTeam)) {
        continue;
      }
      if (def.id === "pro_to_street_comeback" && !context.proFallbackEligible) {
        continue;
      }
      if (def.id === "dropped_team_to_pro" && !context.isDroppedFromTeam) {
        continue;
      }
      return {
        id: def.id,
        toTrackId: def.toTrackId || context.trackId,
        card: card,
        definition: def
      };
    }
    return null;
  }

  function drainNotices(gameState) {
    var root = ensureState(gameState);
    var notices = clone(root.transitionNoticeQueue);
    root.transitionNoticeQueue = [];
    return notices;
  }

  return {
    ensureState: ensureState,
    listTransitionDefinitions: listTransitions,
    getTransitionDefinition: getTransition,
    listTransitionEventDefinitions: listTransitionEvents,
    evaluatePlayerTransitions: evaluatePlayerTransitions,
    rankPlayerTransitionCards: rankPlayerTransitionCards,
    topPlayerTransitionCards: topPlayerTransitionCards,
    canPlayerTransition: canPlayerTransition,
    syncPlayerTransitionState: syncPlayerTransitionState,
    executePlayerTransition: executePlayerTransition,
    chooseNpcTransition: chooseNpcTransition,
    drainNotices: drainNotices
  };
}());
