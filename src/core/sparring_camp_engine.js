var SparringCampEngine = (function () {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function stableId(prefix, parts) {
    if (typeof WorldSimState !== "undefined" && WorldSimState.stableId) {
      return WorldSimState.stableId(prefix, parts);
    }
    var suffix = parts instanceof Array ? parts.join("_") : String(parts || "");
    return String(prefix || "id") + "_" + suffix.replace(/[^a-zA-Z0-9_]+/g, "_");
  }

  function dataRoot() {
    return typeof SPARRING_CAMP_DATA !== "undefined" && SPARRING_CAMP_DATA ? SPARRING_CAMP_DATA : {
      offerSources: [],
      campTemplates: [],
      styleFocusHints: {},
      countryFocusHints: {},
      habitTextsByStyle: {}
    };
  }

  function contains(list, value) {
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

  function uniquePush(list, value) {
    if (!(list instanceof Array) || !value || contains(list, value)) {
      return;
    }
    list.push(value);
  }

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function roundNumber(value) {
    return Math.round(typeof value === "number" ? value : 0);
  }

  function canonicalFocusId(focusId) {
    if (focusId === "sparring") {
      return "technique";
    }
    return typeof focusId === "string" && focusId ? focusId : "technique";
  }

  function emptyFightContext() {
    return {
      accuracy: 0,
      damage: 0,
      dodge: 0,
      critChance: 0,
      blockReduction: 0,
      counterChance: 0,
      incomingDamage: 0,
      startStamina: 0,
      startHp: 0,
      turnHealthRecovery: 0,
      turnStaminaRecovery: 0,
      roundHealthPercent: 0,
      roundStaminaPercent: 0,
      actionAccuracy: {},
      actionDamage: {},
      actionStamina: {},
      notes: [],
      risks: [],
      tags: {},
      ai: {}
    };
  }

  function addContextNote(context, text, isRisk) {
    if (!context || !text) {
      return;
    }
    if (isRisk) {
      context.risks.push(text);
    } else {
      context.notes.push(text);
    }
  }

  function createPreparationState() {
    return {
      id: "player_preparation_main",
      activeCampId: "",
      currentTargetFighterId: "",
      lastRefreshWeek: 0,
      lastSparringWeek: 0,
      lastCampCompletedWeek: 0,
      lastCampSummary: null,
      campHistory: [],
      scoutingByFighterId: {},
      partnerHistoryByFighterId: {},
      campAccessTags: []
    };
  }

  function normalizeScoutingEntry(source) {
    var normalized = {
      fighterId: "",
      knowledge: 0,
      lastWeek: 0,
      targetStyleId: "",
      targetCountryId: "",
      habitsKnown: [],
      notes: []
    };
    var i;
    if (!source || typeof source !== "object") {
      return normalized;
    }
    normalized.fighterId = typeof source.fighterId === "string" ? source.fighterId : "";
    normalized.knowledge = clamp(roundNumber(source.knowledge), 0, 100);
    normalized.lastWeek = Math.max(0, roundNumber(source.lastWeek));
    normalized.targetStyleId = typeof source.targetStyleId === "string" ? source.targetStyleId : "";
    normalized.targetCountryId = typeof source.targetCountryId === "string" ? source.targetCountryId : "";
    normalized.habitsKnown = source.habitsKnown instanceof Array ? clone(source.habitsKnown) : [];
    normalized.notes = source.notes instanceof Array ? clone(source.notes) : [];
    for (i = normalized.habitsKnown.length - 1; i >= 0; i -= 1) {
      if (!normalized.habitsKnown[i]) {
        normalized.habitsKnown.splice(i, 1);
      }
    }
    return normalized;
  }

  function normalizePartnerHistoryEntry(source, fighterId) {
    var normalized = {
      fighterId: fighterId || "",
      sessions: 0,
      lastWeek: 0,
      rivalryHook: false,
      sourceIds: [],
      notes: []
    };
    if (!source || typeof source !== "object") {
      return normalized;
    }
    normalized.fighterId = typeof source.fighterId === "string" ? source.fighterId : normalized.fighterId;
    normalized.sessions = Math.max(0, roundNumber(source.sessions));
    normalized.lastWeek = Math.max(0, roundNumber(source.lastWeek));
    normalized.rivalryHook = !!source.rivalryHook;
    normalized.sourceIds = source.sourceIds instanceof Array ? clone(source.sourceIds) : [];
    normalized.notes = source.notes instanceof Array ? clone(source.notes) : [];
    return normalized;
  }

  function normalizePreparationState(source) {
    var normalized = createPreparationState();
    var key;
    if (!source || typeof source !== "object") {
      return normalized;
    }
    normalized.id = typeof source.id === "string" && source.id ? source.id : normalized.id;
    normalized.activeCampId = typeof source.activeCampId === "string" ? source.activeCampId : "";
    normalized.currentTargetFighterId = typeof source.currentTargetFighterId === "string" ? source.currentTargetFighterId : "";
    normalized.lastRefreshWeek = Math.max(0, roundNumber(source.lastRefreshWeek));
    normalized.lastSparringWeek = Math.max(0, roundNumber(source.lastSparringWeek));
    normalized.lastCampCompletedWeek = Math.max(0, roundNumber(source.lastCampCompletedWeek));
    normalized.lastCampSummary = source.lastCampSummary && typeof source.lastCampSummary === "object" ? clone(source.lastCampSummary) : null;
    normalized.campHistory = source.campHistory instanceof Array ? clone(source.campHistory) : [];
    normalized.campAccessTags = source.campAccessTags instanceof Array ? clone(source.campAccessTags) : [];
    if (source.scoutingByFighterId && typeof source.scoutingByFighterId === "object") {
      for (key in source.scoutingByFighterId) {
        if (source.scoutingByFighterId.hasOwnProperty(key)) {
          normalized.scoutingByFighterId[key] = normalizeScoutingEntry(source.scoutingByFighterId[key]);
          if (!normalized.scoutingByFighterId[key].fighterId) {
            normalized.scoutingByFighterId[key].fighterId = key;
          }
        }
      }
    }
    if (source.partnerHistoryByFighterId && typeof source.partnerHistoryByFighterId === "object") {
      for (key in source.partnerHistoryByFighterId) {
        if (source.partnerHistoryByFighterId.hasOwnProperty(key)) {
          normalized.partnerHistoryByFighterId[key] = normalizePartnerHistoryEntry(source.partnerHistoryByFighterId[key], key);
        }
      }
    }
    return normalized;
  }

  function competitionRoot(gameState) {
    var competitionState = gameState.competitionState || {};
    gameState.competitionState = competitionState;
    if (!(competitionState.sparringOfferIds instanceof Array)) { competitionState.sparringOfferIds = []; }
    if (!competitionState.sparringOffersById || typeof competitionState.sparringOffersById !== "object") { competitionState.sparringOffersById = {}; }
    if (!(competitionState.trainingCampIds instanceof Array)) { competitionState.trainingCampIds = []; }
    if (!competitionState.trainingCampsById || typeof competitionState.trainingCampsById !== "object") { competitionState.trainingCampsById = {}; }
    return competitionState;
  }

  function playerRoot(gameState) {
    if (!gameState.player) {
      gameState.player = {};
    }
    if (!gameState.player.preparation || typeof gameState.player.preparation !== "object") {
      gameState.player.preparation = createPreparationState();
    } else {
      gameState.player.preparation = normalizePreparationState(gameState.player.preparation);
    }
    return gameState.player.preparation;
  }

  function ensureState(gameState) {
    playerRoot(gameState);
    competitionRoot(gameState);
    return gameState;
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

  function playerEntityId(gameState) {
    return gameState && gameState.playerState && gameState.playerState.fighterEntityId ? gameState.playerState.fighterEntityId : "fighter_player_main";
  }

  function playerEntity(gameState) {
    if (typeof WorldFacilityEngine !== "undefined" && WorldFacilityEngine.getFighterById) {
      return WorldFacilityEngine.getFighterById(gameState, playerEntityId(gameState));
    }
    if (typeof PersistentFighterRegistry !== "undefined" && PersistentFighterRegistry.getFighterById) {
      return PersistentFighterRegistry.getFighterById(gameState, playerEntityId(gameState));
    }
    return null;
  }

  function fighterById(gameState, fighterId) {
    if (!fighterId) {
      return null;
    }
    if (typeof WorldFacilityEngine !== "undefined" && WorldFacilityEngine.getFighterById) {
      return WorldFacilityEngine.getFighterById(gameState, fighterId);
    }
    if (typeof PersistentFighterRegistry !== "undefined" && PersistentFighterRegistry.getFighterById) {
      return PersistentFighterRegistry.getFighterById(gameState, fighterId);
    }
    return null;
  }

  function gymById(gameState, gymId) {
    return typeof WorldFacilityEngine !== "undefined" && WorldFacilityEngine.getGymById ? WorldFacilityEngine.getGymById(gameState, gymId) : null;
  }

  function trainerById(gameState, trainerId) {
    return typeof WorldFacilityEngine !== "undefined" && WorldFacilityEngine.getTrainerById ? WorldFacilityEngine.getTrainerById(gameState, trainerId) : null;
  }

  function currentTrack(gameState) {
    return gameState && gameState.playerState && gameState.playerState.currentTrackId ? gameState.playerState.currentTrackId : "street";
  }

  function currentCountry(gameState) {
    return gameState && gameState.player && gameState.player.profile ? (gameState.player.profile.currentCountry || gameState.player.profile.homeCountry || "") : "";
  }

  function playerMoney(gameState) {
    return gameState && gameState.player && gameState.player.resources && typeof gameState.player.resources.money === "number" ? gameState.player.resources.money : 0;
  }

  function playerFame(gameState) {
    return gameState && gameState.player && gameState.player.resources && typeof gameState.player.resources.fame === "number" ? gameState.player.resources.fame : 0;
  }

  function currentTeamStatus(gameState) {
    return gameState && gameState.player && gameState.player.amateur ? gameState.player.amateur.nationalTeamStatus || "none" : "none";
  }

  function currentGym(gameState) {
    var fighter = playerEntity(gameState);
    return fighter && fighter.currentGymId ? gymById(gameState, fighter.currentGymId) : null;
  }

  function currentTrainer(gameState) {
    var fighter = playerEntity(gameState);
    return fighter && fighter.currentTrainerId ? trainerById(gameState, fighter.currentTrainerId) : null;
  }

  function trainerRelationScore(gameState) {
    var assignment = gameState && gameState.world ? gameState.world.trainerAssignment : null;
    var relationships = gameState && gameState.world ? gameState.world.relationships : null;
    var i;
    if (!assignment || !assignment.npcId || !(relationships instanceof Array)) {
      return 0;
    }
    for (i = 0; i < relationships.length; i += 1) {
      if (relationships[i] && relationships[i].npcId === assignment.npcId) {
        return typeof relationships[i].score === "number" ? relationships[i].score : 0;
      }
    }
    return 0;
  }

  function fighterTotal(fighter) {
    var stats = fighter && fighter.attributes ? fighter.attributes : (fighter && fighter.stats ? fighter.stats : {});
    return (stats.str || 0) + (stats.tec || 0) + (stats.spd || 0) + (stats.end || 0) + (stats.vit || 0);
  }

  function fighterStyleId(fighter) {
    return fighter ? (fighter.styleId || fighter.style || "") : "";
  }

  function fighterCountry(fighter) {
    return fighter ? (fighter.country || fighter.countryKey || "") : "";
  }

  function fighterTrack(fighter) {
    return fighter ? (fighter.currentTrack || fighter.trackId || "street") : "street";
  }

  function listFightTargets(gameState) {
    var offers = gameState && gameState.world && gameState.world.offers ? gameState.world.offers.fightOffers || [] : [];
    var result = [];
    var seen = {};
    var i;
    var fighterId;
    for (i = 0; i < offers.length; i += 1) {
      fighterId = offers[i] && offers[i].fighterId ? offers[i].fighterId : (offers[i] && offers[i].opponent ? offers[i].opponent.fighterId || "" : "");
      if (!fighterId || seen[fighterId]) {
        continue;
      }
      seen[fighterId] = true;
      result.push({
        fighterId: fighterId,
        label: offers[i].opponent ? (offers[i].opponent.fullName || offers[i].opponent.firstName || fighterId) : fighterId,
        offerId: offers[i].id || "",
        styleId: offers[i].opponent ? (offers[i].opponent.styleId || "") : "",
        countryId: offers[i].opponent ? (offers[i].opponent.countryKey || "") : "",
        trackId: offers[i].trackId || "",
        offerLabel: offers[i].label || ""
      });
    }
    return result;
  }

  function findTarget(gameState, fighterId) {
    var entity = fighterById(gameState, fighterId);
    var targets;
    var i;
    if (entity) {
      return entity;
    }
    targets = listFightTargets(gameState);
    for (i = 0; i < targets.length; i += 1) {
      if (targets[i].fighterId === fighterId) {
        return {
          id: targets[i].fighterId,
          styleId: targets[i].styleId || "",
          country: targets[i].countryId || "",
          currentTrack: targets[i].trackId || "",
          fullName: targets[i].label || fighterId
        };
      }
    }
    return null;
  }

  function focusHintForStyle(styleId) {
    var hints = dataRoot().styleFocusHints || {};
    return typeof hints[styleId] === "string" ? hints[styleId] : "";
  }

  function focusHintForCountry(countryId) {
    var hints = dataRoot().countryFocusHints || {};
    return typeof hints[countryId] === "string" ? hints[countryId] : "";
  }

  function resolvePreparationFocus(gameState, targetFighter) {
    var focusId = targetFighter ? focusHintForStyle(fighterStyleId(targetFighter)) : "";
    if (!focusId && targetFighter) {
      focusId = focusHintForCountry(fighterCountry(targetFighter));
    }
    if (!focusId && gameState && gameState.player && gameState.player.development) {
      focusId = gameState.player.development.focusId || "";
    }
    return canonicalFocusId(focusId);
  }

  function habitTextsForStyle(styleId, count) {
    var source = (dataRoot().habitTextsByStyle || {})[styleId] || [];
    var result = [];
    var i;
    for (i = 0; i < source.length && result.length < (count || 1); i += 1) {
      if (source[i]) {
        result.push(source[i]);
      }
    }
    return result;
  }

  function campQualityScore(gameState) {
    var gym = currentGym(gameState);
    var trainer = currentTrainer(gameState);
    var fame = playerFame(gameState);
    var teamStatus = currentTeamStatus(gameState);
    var trainerRelation = trainerRelationScore(gameState);
    var score = 10;
    score += gym ? Math.round((gym.reputation || 0) * 0.45) : 0;
    score += trainer ? Math.round((trainer.reputation || 0) * 0.35) : 0;
    score += Math.round(fame * 0.15);
    if (teamStatus === "active") { score += 16; }
    else if (teamStatus === "reserve") { score += 10; }
    else if (teamStatus === "candidate") { score += 5; }
    score += Math.round(Math.max(-20, trainerRelation) * 0.08);
    return clamp(score, 0, 100);
  }

  function trackAllowed(trackId, allowedTracks) {
    return !(allowedTracks instanceof Array) || !allowedTracks.length || contains(allowedTracks, trackId);
  }

  function statusAllowed(statusValue, allowedList) {
    return !(allowedList instanceof Array) || !allowedList.length || contains(allowedList, statusValue);
  }

  function playerEligibleForSource(gameState, source) {
    var gym = currentGym(gameState);
    var fame = playerFame(gameState);
    var quality = campQualityScore(gameState);
    if (!source) {
      return false;
    }
    if (!trackAllowed(currentTrack(gameState), source.allowedTracks)) {
      return false;
    }
    if (source.needsGym && !gym) {
      return false;
    }
    if (typeof source.minFame === "number" && fame < source.minFame) {
      return false;
    }
    if (typeof source.minCampQuality === "number" && quality < source.minCampQuality) {
      return false;
    }
    if (!statusAllowed(currentTeamStatus(gameState), source.requiredNationalTeamStatuses)) {
      return false;
    }
    return true;
  }

  function playerEligibleForCamp(gameState, template) {
    var fame = playerFame(gameState);
    var quality = campQualityScore(gameState);
    if (!template) {
      return false;
    }
    if (!trackAllowed(currentTrack(gameState), template.allowedTracks)) {
      return false;
    }
    if (typeof template.minFame === "number" && fame < template.minFame) {
      return false;
    }
    if (typeof template.minCampQuality === "number" && quality < template.minCampQuality) {
      return false;
    }
    if (!statusAllowed(currentTeamStatus(gameState), template.requiredNationalTeamStatuses)) {
      return false;
    }
    return true;
  }

  function offerDifficulty(gameState, partner, source) {
    var player = playerEntity(gameState);
    var delta = fighterTotal(partner) - fighterTotal(player);
    var trackBias = fighterTrack(partner) === "pro" ? 8 : (fighterTrack(partner) === "amateur" ? 3 : 0);
    return clamp(44 + source.difficultyBias + delta * 3 + trackBias, 28, 92);
  }

  function offerRisk(partner, source) {
    var trackBias = fighterTrack(partner) === "street" ? 4 : (fighterTrack(partner) === "pro" ? 2 : 0);
    return clamp(6 + source.riskBias + trackBias + Math.round((fighterTotal(partner) - 25) * 0.15), 4, 24);
  }

  function offerCost(gameState, partner, source, difficulty) {
    var fame = playerFame(gameState);
    var raw = source.baseCost + Math.round(difficulty * source.costPerDifficulty) + Math.max(0, Math.round((partner.fame || 0) * 0.2));
    raw -= Math.min(12, Math.round(fame * 0.08));
    return Math.max(0, raw);
  }

  function sourceCandidates(gameState, source, targetFighter) {
    var roster = gameState && gameState.rosterState ? gameState.rosterState : null;
    var fighterIds = roster && roster.fighterIds instanceof Array ? roster.fighterIds : [];
    var playerId = playerEntityId(gameState);
    var player = playerEntity(gameState);
    var gym = currentGym(gameState);
    var result = [];
    var i;
    var fighter;
    var sameTrack;
    for (i = 0; i < fighterIds.length; i += 1) {
      fighter = roster.fightersById[fighterIds[i]];
      if (!fighter || fighter.id === playerId || fighter.status === "retired") {
        continue;
      }
      sameTrack = fighterTrack(fighter) === currentTrack(gameState);
      if (source.id === "gym_room") {
        if (gym && fighter.currentGymId === gym.id) {
          result.push(fighter);
        }
        continue;
      }
      if (source.id === "national_pool") {
        if (fighterCountry(fighter) === currentCountry(gameState) &&
            (fighter.nationalTeamStatus === "candidate" || fighter.nationalTeamStatus === "reserve" || fighter.nationalTeamStatus === "active" || fighterTrack(fighter) === "amateur")) {
          result.push(fighter);
        }
        continue;
      }
      if (source.id === "closed_camp") {
        if ((fighterCountry(fighter) === currentCountry(gameState) || fighterTrack(fighter) === "pro" || (targetFighter && fighterCountry(fighter) === fighterCountry(targetFighter))) &&
            fighterTotal(fighter) >= fighterTotal(player) - 2) {
          result.push(fighter);
        }
        continue;
      }
      if (source.id === "paid_guest") {
        if ((fighterCountry(fighter) === currentCountry(gameState) || sameTrack) && fighterTotal(fighter) >= Math.max(6, fighterTotal(player) - 4)) {
          result.push(fighter);
        }
      }
    }
    return result;
  }

  function candidateScore(gameState, fighter, targetFighter, source) {
    var score = fighterTotal(fighter);
    var currentStyle = fighterStyleId(fighter);
    if (targetFighter) {
      if (fighterStyleId(targetFighter) && fighterStyleId(targetFighter) === currentStyle) {
        score += 18;
      }
      if (fighterCountry(targetFighter) && fighterCountry(targetFighter) === fighterCountry(fighter)) {
        score += 10;
      }
      if (fighterTrack(targetFighter) === fighterTrack(fighter)) {
        score += 4;
      }
    }
    if (source.id === "gym_room") {
      score += 6;
    }
    if (source.id === "national_pool" && (fighter.nationalTeamStatus === "active" || fighter.nationalTeamStatus === "reserve")) {
      score += 12;
    }
    if (source.id === "closed_camp" && fighterTrack(fighter) === "pro") {
      score += 10;
    }
    return score;
  }

  function sortCandidates(gameState, source, candidates, targetFighter) {
    candidates.sort(function (a, b) {
      return candidateScore(gameState, b, targetFighter, source) - candidateScore(gameState, a, targetFighter, source);
    });
    return candidates;
  }

  function buildOfferEntity(gameState, source, partner, targetFighter, index) {
    var difficulty = offerDifficulty(gameState, partner, source);
    var risk = offerRisk(partner, source);
    var cost = offerCost(gameState, partner, source, difficulty);
    var focusId = resolvePreparationFocus(gameState, targetFighter || partner);
    var scoutingValue = clamp(source.scoutingBias + (targetFighter && fighterStyleId(targetFighter) === fighterStyleId(partner) ? 4 : 0) + (targetFighter && fighterCountry(targetFighter) === fighterCountry(partner) ? 3 : 0), 4, 28);
    var trainer = partner.currentTrainerId ? trainerById(gameState, partner.currentTrainerId) : null;
    var gym = partner.currentGymId ? gymById(gameState, partner.currentGymId) : null;
    return {
      id: stableId("sparring_offer", [currentWeek(gameState), source.id, partner.id, index || 0]),
      sourceId: source.id,
      sourceLabel: source.label,
      partnerFighterId: partner.id,
      gymId: gym ? gym.id : "",
      trainerId: trainer ? trainer.id : "",
      cost: cost,
      difficulty: difficulty,
      risk: risk,
      preparationFocus: focusId,
      scoutingValue: scoutingValue,
      trackId: fighterTrack(partner),
      countryId: fighterCountry(partner),
      partnerStyleId: fighterStyleId(partner),
      availableReason: playerMoney(gameState) < cost ? "Не хватает денег." : "",
      label: source.label + ": " + (partner.fullName || partner.firstName || partner.id),
      weekStamp: currentWeek(gameState)
    };
  }

  function refreshWeeklyOffers(gameState) {
    var prep = playerRoot(gameState);
    var competition = competitionRoot(gameState);
    var sources = dataRoot().offerSources || [];
    var targetFighter = prep.currentTargetFighterId ? findTarget(gameState, prep.currentTargetFighterId) : null;
    var i;
    var j;
    var source;
    var candidates;
    var offer;
    competition.sparringOfferIds = [];
    competition.sparringOffersById = {};
    for (i = 0; i < sources.length; i += 1) {
      source = sources[i];
      if (!playerEligibleForSource(gameState, source)) {
        continue;
      }
      candidates = sourceCandidates(gameState, source, targetFighter);
      candidates = sortCandidates(gameState, source, candidates, targetFighter);
      for (j = 0; j < candidates.length && j < (source.maxOffers || 2); j += 1) {
        offer = buildOfferEntity(gameState, source, candidates[j], targetFighter, j + 1);
        competition.sparringOfferIds.push(offer.id);
        competition.sparringOffersById[offer.id] = offer;
      }
    }
    prep.lastRefreshWeek = currentWeek(gameState);
    return competition.sparringOfferIds.slice(0);
  }

  function listSparringOffers(gameState) {
    var competition = competitionRoot(gameState);
    var offers = [];
    var i;
    for (i = 0; i < competition.sparringOfferIds.length; i += 1) {
      if (competition.sparringOffersById[competition.sparringOfferIds[i]]) {
        offers.push(clone(competition.sparringOffersById[competition.sparringOfferIds[i]]));
      }
    }
    return offers;
  }

  function getSparringOfferById(gameState, offerId) {
    var competition = competitionRoot(gameState);
    return offerId ? clone(competition.sparringOffersById[offerId] || null) : null;
  }

  function listCampTemplates(gameState) {
    var templates = dataRoot().campTemplates || [];
    var result = [];
    var i;
    for (i = 0; i < templates.length; i += 1) {
      if (playerEligibleForCamp(gameState, templates[i])) {
        result.push(clone(templates[i]));
      }
    }
    return result;
  }

  function getCampTemplate(templateId) {
    var templates = dataRoot().campTemplates || [];
    var i;
    for (i = 0; i < templates.length; i += 1) {
      if (templates[i] && templates[i].id === templateId) {
        return clone(templates[i]);
      }
    }
    return null;
  }

  function buildInviteList(gameState, template, targetFighter) {
    var offers = listSparringOffers(gameState);
    var result = [];
    var i;
    var fighter;
    for (i = 0; i < offers.length && result.length < (template.inviteCount || 1); i += 1) {
      fighter = fighterById(gameState, offers[i].partnerFighterId);
      if (!fighter) {
        continue;
      }
      if (targetFighter) {
        if (fighterStyleId(fighter) !== fighterStyleId(targetFighter) && fighterCountry(fighter) !== fighterCountry(targetFighter)) {
          continue;
        }
      }
      uniquePush(result, fighter.id);
    }
    if (!result.length) {
      for (i = 0; i < offers.length && result.length < (template.inviteCount || 1); i += 1) {
        uniquePush(result, offers[i].partnerFighterId);
      }
    }
    return result;
  }

  function buildCampPreview(gameState, templateId, targetFighterId) {
    var template = getCampTemplate(templateId);
    var targetFighter = targetFighterId ? findTarget(gameState, targetFighterId) : null;
    var gym = currentGym(gameState);
    var trainer = currentTrainer(gameState);
    var focusId;
    var invitedIds;
    var expectedEffects;
    var notes = [];
    var i;
    var habits;
    if (!template || !playerEligibleForCamp(gameState, template)) {
      return null;
    }
    focusId = resolvePreparationFocus(gameState, targetFighter);
    invitedIds = buildInviteList(gameState, template, targetFighter);
    expectedEffects = clone(template.expectedEffects || {});
    expectedEffects.focusXp = Math.max(4, roundNumber(expectedEffects.focusXp) + Math.round(campQualityScore(gameState) / 20));
    expectedEffects.styleXp = Math.max(2, roundNumber(expectedEffects.styleXp) + (trainer && trainer.preferredStyles && contains(trainer.preferredStyles, targetFighter ? fighterStyleId(targetFighter) : "") ? 2 : 0));
    expectedEffects.scouting = Math.max(4, roundNumber(expectedEffects.scouting) + (targetFighter ? 4 : 0));
    if (targetFighter) {
      notes.push("Подготовка идёт под " + (targetFighter.fullName || targetFighter.id) + ".");
      if (fighterStyleId(targetFighter)) {
        notes.push("Фокус против стиля: " + fighterStyleId(targetFighter) + ".");
      }
      habits = habitTextsForStyle(fighterStyleId(targetFighter), 2);
      for (i = 0; i < habits.length; i += 1) {
        notes.push("Можно снять привычку: " + habits[i] + ".");
      }
    }
    if (trainer && trainer.preferredStyles && targetFighter && contains(trainer.preferredStyles, fighterStyleId(targetFighter))) {
      notes.push("Тренер хорошо читает такой тип соперника.");
    }
    return {
      templateId: template.id,
      label: template.label,
      durationWeeks: template.durationWeeks,
      focusId: focusId,
      targetFighterId: targetFighter ? targetFighter.id : "",
      invitedSparringPartnerIds: invitedIds,
      leadTrainerId: trainer ? trainer.id : "",
      hostGymId: gym ? gym.id : "",
      expectedEffects: expectedEffects,
      notes: notes,
      cost: roundNumber(template.baseCost || 0)
    };
  }

  function getActiveCamp(gameState) {
    var prep = playerRoot(gameState);
    var competition = competitionRoot(gameState);
    return prep.activeCampId ? clone(competition.trainingCampsById[prep.activeCampId] || null) : null;
  }

  function startCamp(gameState, templateId, targetFighterId, weekValue) {
    var prep = playerRoot(gameState);
    var competition = competitionRoot(gameState);
    var preview = buildCampPreview(gameState, templateId, targetFighterId);
    var weekStamp = typeof weekValue === "number" ? weekValue : currentWeek(gameState);
    var camp;
    if (prep.activeCampId && competition.trainingCampsById[prep.activeCampId] && competition.trainingCampsById[prep.activeCampId].status === "active") {
      return { ok: false, message: "Сначала заверши текущий лагерь." };
    }
    if (!preview) {
      return { ok: false, message: "Лагерь пока недоступен." };
    }
    camp = {
      id: stableId("training_camp", [playerEntityId(gameState), templateId, weekStamp]),
      templateId: preview.templateId,
      label: preview.label,
      status: "active",
      startedWeek: weekStamp,
      durationWeeks: preview.durationWeeks,
      weeksCompleted: 0,
      focusId: preview.focusId,
      targetFighterId: preview.targetFighterId,
      invitedSparringPartnerIds: preview.invitedSparringPartnerIds.slice(0),
      leadTrainerId: preview.leadTrainerId,
      hostGymId: preview.hostGymId,
      expectedEffects: clone(preview.expectedEffects),
      notes: preview.notes.slice(0),
      totalCost: preview.cost
    };
    uniquePush(competition.trainingCampIds, camp.id);
    competition.trainingCampsById[camp.id] = camp;
    prep.activeCampId = camp.id;
    prep.currentTargetFighterId = preview.targetFighterId || prep.currentTargetFighterId;
    return { ok: true, camp: clone(camp), preview: preview };
  }

  function scoutingEntry(prep, fighterId) {
    if (!fighterId) {
      return null;
    }
    if (!prep.scoutingByFighterId[fighterId]) {
      prep.scoutingByFighterId[fighterId] = normalizeScoutingEntry({ fighterId: fighterId });
    }
    return prep.scoutingByFighterId[fighterId];
  }

  function partnerHistoryEntry(prep, fighterId) {
    if (!fighterId) {
      return null;
    }
    if (!prep.partnerHistoryByFighterId[fighterId]) {
      prep.partnerHistoryByFighterId[fighterId] = normalizePartnerHistoryEntry({ fighterId: fighterId }, fighterId);
    }
    return prep.partnerHistoryByFighterId[fighterId];
  }

  function rememberScouting(prep, fighterId, fighter, amount, note, weekValue) {
    var entry = scoutingEntry(prep, fighterId);
    var habits;
    var i;
    if (!entry) {
      return null;
    }
    entry.knowledge = clamp(entry.knowledge + roundNumber(amount), 0, 100);
    entry.lastWeek = Math.max(entry.lastWeek, typeof weekValue === "number" ? weekValue : 0);
    entry.targetStyleId = fighterStyleId(fighter) || entry.targetStyleId;
    entry.targetCountryId = fighterCountry(fighter) || entry.targetCountryId;
    habits = habitTextsForStyle(entry.targetStyleId, entry.knowledge >= 24 ? 2 : 1);
    for (i = 0; i < habits.length; i += 1) {
      uniquePush(entry.habitsKnown, habits[i]);
    }
    if (note) {
      uniquePush(entry.notes, note);
    }
    return entry;
  }

  function resolveSparring(gameState, offerId, weekValue) {
    var prep = playerRoot(gameState);
    var offer = getSparringOfferById(gameState, offerId);
    var partner;
    var history;
    var focusId;
    var focusXp;
    var styleId;
    var styleAmount;
    var moraleDelta;
    var wearDelta;
    var scoutingGain;
    var target;
    var rivalryHook = false;
    var weekStamp = typeof weekValue === "number" ? weekValue : currentWeek(gameState);
    if (!offer) {
      return { ok: false, message: "Спарринг недоступен." };
    }
    partner = fighterById(gameState, offer.partnerFighterId);
    if (!partner) {
      return { ok: false, message: "Спарринг-партнёр пропал из реестра." };
    }
    if (playerMoney(gameState) < offer.cost) {
      return { ok: false, message: "Не хватает денег." };
    }
    history = partnerHistoryEntry(prep, partner.id);
    history.sessions += 1;
    history.lastWeek = weekStamp;
    uniquePush(history.sourceIds, offer.sourceId);
    focusId = offer.preparationFocus || resolvePreparationFocus(gameState, partner);
    focusXp = Math.max(5, 6 + Math.round(offer.difficulty / 9) + Math.round(offer.scoutingValue / 8));
    styleId = fighterStyleId(partner) || "tempo";
    styleAmount = Math.max(2, Math.round(offer.difficulty / 12));
    moraleDelta = offer.difficulty <= 60 ? 2 : (offer.risk >= 18 ? -1 : 0);
    wearDelta = Math.max(1, Math.round(offer.risk / 5));
    scoutingGain = Math.max(4, roundNumber(offer.scoutingValue));
    prep.lastSparringWeek = weekStamp;
    rememberScouting(prep, partner.id, partner, scoutingGain, "Спарринг", weekStamp);
    target = prep.currentTargetFighterId ? findTarget(gameState, prep.currentTargetFighterId) : null;
    if (target && target.id && target.id !== partner.id && (fighterStyleId(target) === fighterStyleId(partner) || fighterCountry(target) === fighterCountry(partner))) {
      rememberScouting(prep, target.id, target, Math.max(3, Math.round(scoutingGain * 0.6)), "Похожий спарринг", weekStamp);
    }
    if (history.sessions >= 3) {
      history.rivalryHook = true;
      rivalryHook = true;
      uniquePush(history.notes, "Жёсткий счёт на спаррингах");
    }
    return {
      ok: true,
      offer: offer,
      partner: clone(partner),
      focusId: focusId,
      focusXp: focusXp,
      styleGains: [{ styleId: styleId, amount: styleAmount }],
      moraleDelta: moraleDelta,
      wearDelta: wearDelta,
      scoutingGain: scoutingGain,
      cost: offer.cost,
      rivalryHook: rivalryHook
    };
  }

  function normalizeSparringFightInfo(source) {
    return {
      result: source && typeof source.result === "string" ? source.result : "draw",
      roundsCompleted: Math.max(1, roundNumber(source && source.roundsCompleted)),
      damageTaken: Math.max(0, roundNumber(source && source.damageTaken)),
      damageDealt: Math.max(0, roundNumber(source && source.damageDealt)),
      knockdownsFor: Math.max(0, roundNumber(source && source.knockdownsFor)),
      knockdownsAgainst: Math.max(0, roundNumber(source && source.knockdownsAgainst))
    };
  }

  function buildSparringOutcome(gameState, offer, partner, weekStamp, fightInfo) {
    var prep = playerRoot(gameState);
    var history = partnerHistoryEntry(prep, partner.id);
    var focusId = canonicalFocusId(offer.preparationFocus || resolvePreparationFocus(gameState, partner));
    var focusXp = Math.max(5, 6 + Math.round(offer.difficulty / 9) + Math.round(offer.scoutingValue / 8));
    var skillPoints = Math.max(1, Math.round((offer.difficulty + offer.scoutingValue) / 40));
    var styleId = fighterStyleId(partner) || "tempo";
    var styleAmount = Math.max(2, Math.round(offer.difficulty / 12));
    var moraleDelta = offer.difficulty <= 60 ? 2 : (offer.risk >= 18 ? -1 : 0);
    var wearDelta = Math.max(1, Math.round(offer.risk / 5));
    var scoutingGain = Math.max(4, roundNumber(offer.scoutingValue));
    var familiarityGain = Math.max(3, 4 + history.sessions);
    var target;
    var rivalryHook = false;
    var fight = fightInfo ? normalizeSparringFightInfo(fightInfo) : null;
    history.sessions += 1;
    history.lastWeek = weekStamp;
    uniquePush(history.sourceIds, offer.sourceId);
    if (fight) {
      if (fight.result === "win") {
        focusXp += 2;
        styleAmount += 1;
        moraleDelta += 1;
        skillPoints += 1;
      } else if (fight.result === "loss") {
        focusXp = Math.max(4, focusXp - 1);
        moraleDelta -= 1;
      }
      scoutingGain += Math.min(4, fight.roundsCompleted);
      styleAmount += Math.max(0, Math.round(fight.damageDealt / 40));
      wearDelta = Math.max(0, Math.round((wearDelta + Math.round(fight.damageTaken / 20) + fight.knockdownsAgainst) / 2));
      familiarityGain += Math.min(8, fight.roundsCompleted + fight.knockdownsFor);
    }
    prep.lastSparringWeek = weekStamp;
    rememberScouting(prep, partner.id, partner, scoutingGain + Math.round(familiarityGain / 2), "Спарринг", weekStamp);
    target = prep.currentTargetFighterId ? findTarget(gameState, prep.currentTargetFighterId) : null;
    if (target && target.id && target.id !== partner.id && (fighterStyleId(target) === fighterStyleId(partner) || fighterCountry(target) === fighterCountry(partner))) {
      rememberScouting(prep, target.id, target, Math.max(3, Math.round(scoutingGain * 0.6)), "Похожий спарринг", weekStamp);
    }
    if (history.sessions >= 3) {
      history.rivalryHook = true;
      rivalryHook = true;
      uniquePush(history.notes, "Жёсткий счёт на спаррингах");
    }
    return {
      ok: true,
      offer: offer,
      partner: clone(partner),
      focusId: focusId,
      focusXp: focusXp,
      skillPoints: skillPoints,
      styleGains: [{ styleId: styleId, amount: styleAmount }],
      moraleDelta: moraleDelta,
      wearDelta: wearDelta,
      scoutingGain: scoutingGain,
      familiarityGain: familiarityGain,
      cost: offer.cost,
      rivalryHook: rivalryHook
    };
  }

  function resolveSparring(gameState, offerId, weekValue) {
    var offer = getSparringOfferById(gameState, offerId);
    var partner;
    var weekStamp = typeof weekValue === "number" ? weekValue : currentWeek(gameState);
    if (!offer) {
      return { ok: false, message: "Спарринг недоступен." };
    }
    partner = fighterById(gameState, offer.partnerFighterId);
    if (!partner) {
      return { ok: false, message: "Спарринг-партнёр пропал из реестра." };
    }
    if (playerMoney(gameState) < offer.cost) {
      return { ok: false, message: "Не хватает денег." };
    }
    return buildSparringOutcome(gameState, offer, partner, weekStamp, null);
  }

  function resolveSparringFightOutcome(gameState, offerId, fightInfo, weekValue) {
    var offer = getSparringOfferById(gameState, offerId);
    var partner;
    var weekStamp = typeof weekValue === "number" ? weekValue : currentWeek(gameState);
    if (!offer) {
      return { ok: false, message: "Спарринг недоступен." };
    }
    partner = fighterById(gameState, offer.partnerFighterId);
    if (!partner) {
      return { ok: false, message: "Спарринг-партнёр пропал из реестра." };
    }
    return buildSparringOutcome(gameState, offer, partner, weekStamp, fightInfo);
  }

  function advanceCampWeek(gameState, weekValue) {
    var prep = playerRoot(gameState);
    var competition = competitionRoot(gameState);
    var camp = prep.activeCampId ? competition.trainingCampsById[prep.activeCampId] : null;
    var perWeekCost;
    var focusXp;
    var styleXp;
    var scouting;
    var wear;
    var morale;
    var target;
    var i;
    var partner;
    var history;
    var weekStamp = typeof weekValue === "number" ? weekValue : currentWeek(gameState);
    if (!camp || camp.status !== "active") {
      return { ok: false, message: "Активного лагеря нет." };
    }
    perWeekCost = Math.max(0, Math.ceil((camp.totalCost || 0) / Math.max(1, camp.durationWeeks || 1)));
    focusXp = Math.max(4, Math.ceil((camp.expectedEffects.focusXp || 0) / Math.max(1, camp.durationWeeks || 1)));
    styleXp = Math.max(2, Math.ceil((camp.expectedEffects.styleXp || 0) / Math.max(1, camp.durationWeeks || 1)));
    scouting = Math.max(3, Math.ceil((camp.expectedEffects.scouting || 0) / Math.max(1, camp.durationWeeks || 1)));
    wear = Math.max(1, Math.ceil((camp.expectedEffects.wear || 0) / Math.max(1, camp.durationWeeks || 1)));
    morale = roundNumber((camp.expectedEffects.morale || 0) / Math.max(1, camp.durationWeeks || 1));
    target = camp.targetFighterId ? findTarget(gameState, camp.targetFighterId) : null;
    if (target) {
      rememberScouting(prep, target.id, target, scouting, "Лагерь", weekStamp);
    }
    for (i = 0; i < camp.invitedSparringPartnerIds.length; i += 1) {
      partner = fighterById(gameState, camp.invitedSparringPartnerIds[i]);
      history = partnerHistoryEntry(prep, camp.invitedSparringPartnerIds[i]);
      if (history) {
        history.sessions += 1;
        history.lastWeek = weekStamp;
        if (history.sessions >= 3) {
          history.rivalryHook = true;
        }
      }
      if (partner) {
        rememberScouting(prep, partner.id, partner, Math.max(2, Math.round(scouting * 0.5)), "Лагерь", weekStamp);
      }
    }
    camp.weeksCompleted += 1;
    if (camp.weeksCompleted >= camp.durationWeeks) {
      camp.status = "completed";
      prep.activeCampId = "";
      prep.lastCampCompletedWeek = weekStamp;
      prep.lastCampSummary = {
        id: camp.id,
        templateId: camp.templateId,
        targetFighterId: camp.targetFighterId || "",
        targetStyleId: target ? fighterStyleId(target) : "",
        targetCountryId: target ? fighterCountry(target) : "",
        focusId: camp.focusId || "",
        endedWeek: prep.lastCampCompletedWeek,
        leadTrainerId: camp.leadTrainerId || "",
        hostGymId: camp.hostGymId || "",
        invitedSparringPartnerIds: camp.invitedSparringPartnerIds.slice(0)
      };
      prep.campHistory.unshift(clone(camp));
      if (prep.campHistory.length > 16) {
        prep.campHistory = prep.campHistory.slice(0, 16);
      }
    }
    return {
      ok: true,
      camp: clone(camp),
      focusId: canonicalFocusId(camp.focusId || "technique"),
      focusXp: focusXp,
      styleGains: [{
        styleId: target ? (fighterStyleId(target) || "tempo") : "tempo",
        amount: styleXp
      }],
      moraleDelta: morale,
      wearDelta: wear,
      scoutingGain: scouting,
      cost: perWeekCost,
      completed: camp.status === "completed",
      target: target ? clone(target) : null
    };
  }

  function rivalEncounterBonus(gameState, fighterId) {
    var rivalries = gameState && gameState.world ? gameState.world.rivalries || [] : [];
    var i;
    for (i = 0; i < rivalries.length; i += 1) {
      if (rivalries[i] && rivalries[i].opponentFighterId === fighterId) {
        return 1;
      }
    }
    return 0;
  }

  function buildPreparationFightContext(gameState, opponentSnapshot, side) {
    var context = emptyFightContext();
    var prep = playerRoot(gameState);
    var opponentId = opponentSnapshot && opponentSnapshot.fighterId ? opponentSnapshot.fighterId : "";
    var entry = opponentId ? prep.scoutingByFighterId[opponentId] || null : null;
    var history = opponentId ? prep.partnerHistoryByFighterId[opponentId] || null : null;
    var lastCamp = prep.lastCampSummary || null;
    var trainer = currentTrainer(gameState);
    var opponentStyle = opponentSnapshot ? (opponentSnapshot.styleId || "") : "";
    if (side !== "player") {
      return context;
    }
    if (entry && entry.knowledge >= 10) {
      context.accuracy += 1;
      addContextNote(context, "Есть разбор по сопернику после спаррингов.", false);
    }
    if (entry && entry.knowledge >= 20) {
      context.accuracy += 1;
      context.counterChance += 2;
    }
    if (entry && entry.knowledge >= 35) {
      context.accuracy += 1;
      context.dodge += 1;
      context.critChance += 2;
    }
    if (entry && entry.habitsKnown && entry.habitsKnown.length) {
      context.counterChance += 2;
      addContextNote(context, "Удалось заметить привычку соперника: " + entry.habitsKnown[0] + ".", false);
    }
    if (history && history.sessions >= 1) {
      context.dodge += 1;
      addContextNote(context, "Ты уже чувствовал его темп в спарринге.", false);
    }
    if (history && history.rivalryHook) {
      context.damage += 0.03;
      addContextNote(context, "Между вами уже есть жёсткий счёт по спаррингам.", false);
    }
    if (lastCamp && (currentWeek(gameState) - (lastCamp.endedWeek || 0) <= 6)) {
      if (lastCamp.targetFighterId && lastCamp.targetFighterId === opponentId) {
        context.accuracy += 2;
        context.damage += 0.04;
        addContextNote(context, "Последний лагерь был собран прямо под этого соперника.", false);
      } else if (lastCamp.targetStyleId && lastCamp.targetStyleId === opponentStyle) {
        context.accuracy += 1;
        addContextNote(context, "Недавний лагерь уже готовил тебя под такой стиль.", false);
      } else if (lastCamp.targetCountryId && opponentSnapshot && lastCamp.targetCountryId === (opponentSnapshot.countryKey || "")) {
        context.dodge += 1;
        addContextNote(context, "Ты готовился под школу этой страны.", false);
      }
    }
    if (trainer && trainer.preferredStyles instanceof Array && contains(trainer.preferredStyles, opponentStyle)) {
      context.accuracy += 1;
      context.dodge += 1;
      addContextNote(context, "Тренер хорошо читает такого соперника.", false);
    }
    if (rivalEncounterBonus(gameState, opponentId)) {
      context.counterChance += 1;
    }
    return context;
  }

  function buildPlayerSummary(gameState) {
    var prep = playerRoot(gameState);
    var activeCamp = getActiveCamp(gameState);
    var target = prep.currentTargetFighterId ? findTarget(gameState, prep.currentTargetFighterId) : null;
    var offers = listSparringOffers(gameState);
    return {
      preparation: clone(prep),
      offers: offers,
      templates: listCampTemplates(gameState),
      activeCamp: activeCamp,
      targetFighter: target ? clone(target) : null,
      targets: listFightTargets(gameState),
      campQuality: campQualityScore(gameState),
      currentGym: currentGym(gameState),
      currentTrainer: currentTrainer(gameState),
      nationalTeamStatus: currentTeamStatus(gameState)
    };
  }

  return {
    createPreparationState: createPreparationState,
    normalizePreparationState: normalizePreparationState,
    ensureState: ensureState,
    refreshWeeklyOffers: refreshWeeklyOffers,
    listSparringOffers: listSparringOffers,
    getSparringOfferById: getSparringOfferById,
    listCampTemplates: listCampTemplates,
    getCampTemplate: getCampTemplate,
    buildCampPreview: buildCampPreview,
    startCamp: startCamp,
    advanceCampWeek: advanceCampWeek,
    getActiveCamp: getActiveCamp,
    resolveSparring: resolveSparring,
    resolveSparringFightOutcome: resolveSparringFightOutcome,
    buildPreparationFightContext: buildPreparationFightContext,
    buildPlayerSummary: buildPlayerSummary
  };
}());
