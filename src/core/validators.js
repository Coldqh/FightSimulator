function validateState(gameState) {
  var errors = [];
  var requiredSections = [
    "meta",
    "player",
    "career",
    "world",
    "battle",
    "ui",
    "feed",
    "playerState",
    "worldState",
    "rosterState",
    "organizationState",
    "competitionState",
    "narrativeState"
  ];
  var i;

  function isObject(value) {
    return !!value && typeof value === "object" && !(value instanceof Array);
  }

  function pushError(message) {
    errors.push(message);
  }

  function validateId(value, path) {
    if (typeof value !== "string" || !value) {
      pushError(path + " must be a stable string id.");
    }
  }

  if (!isObject(gameState)) {
    return {
      valid: false,
      errors: ["GameState is missing or has invalid type."]
    };
  }

  for (i = 0; i < requiredSections.length; i += 1) {
    if (!isObject(gameState[requiredSections[i]])) {
      pushError("Missing state section: " + requiredSections[i]);
    }
  }

  if (!gameState.meta || typeof gameState.meta.saveVersion !== "number") {
    pushError("meta.saveVersion must be a number.");
  }
  if (!gameState.meta || !isObject(gameState.meta.rng) || typeof gameState.meta.rng.mode !== "string") {
    pushError("meta.rng.mode must be a string.");
  }

  if (!gameState.player || !isObject(gameState.player.profile)) {
    pushError("player.profile is missing.");
  }
  if (!gameState.player || !isObject(gameState.player.stats)) {
    pushError("player.stats is missing.");
  } else {
    if (typeof gameState.player.stats.str !== "number" ||
        typeof gameState.player.stats.tec !== "number" ||
        typeof gameState.player.stats.spd !== "number" ||
        typeof gameState.player.stats.end !== "number" ||
        typeof gameState.player.stats.vit !== "number") {
      pushError("player.stats must contain numeric str/tec/spd/end/vit.");
    }
  }
  if (!gameState.player || !isObject(gameState.player.resources)) {
    pushError("player.resources is missing.");
  }
  if (!gameState.player || !isObject(gameState.player.conditions)) {
    pushError("player.conditions is missing.");
  } else {
    if (!(gameState.player.conditions.injuries instanceof Array)) {
      pushError("player.conditions.injuries must be an array.");
    }
    if (typeof gameState.player.conditions.startingAge !== "number") {
      pushError("player.conditions.startingAge must be a number.");
    }
  }
  if (!gameState.player || !isObject(gameState.player.life)) {
    pushError("player.life is missing.");
  } else if (typeof gameState.player.life.livingMode !== "string") {
    pushError("player.life.livingMode must be a string.");
  }
  if (!gameState.player || !isObject(gameState.player.amateur)) {
    pushError("player.amateur is missing.");
  } else {
    if (typeof gameState.player.amateur.rankId !== "string") {
      pushError("player.amateur.rankId must be a string.");
    }
    if (typeof gameState.player.amateur.score !== "number") {
      pushError("player.amateur.score must be a number.");
    }
    if (typeof gameState.player.amateur.tournamentPoints !== "number") {
      pushError("player.amateur.tournamentPoints must be a number.");
    }
    if (typeof gameState.player.amateur.opponentQuality !== "number") {
      pushError("player.amateur.opponentQuality must be a number.");
    }
    if (!isObject(gameState.player.amateur.record)) {
      pushError("player.amateur.record is missing.");
    }
    if (!(gameState.player.amateur.history instanceof Array)) {
      pushError("player.amateur.history must be an array.");
    }
    if (typeof gameState.player.amateur.currentOrganizationId !== "string") {
      pushError("player.amateur.currentOrganizationId must be a string.");
    }
    if (typeof gameState.player.amateur.nationalTeamStatus !== "string") {
      pushError("player.amateur.nationalTeamStatus must be a string.");
    }
    if (!(gameState.player.amateur.eligibleLevels instanceof Array)) {
      pushError("player.amateur.eligibleLevels must be an array.");
    }
  }
  if (!gameState.player || !isObject(gameState.player.street)) {
    pushError("player.street is missing.");
  } else {
    if (typeof gameState.player.street.streetRating !== "number") {
      pushError("player.street.streetRating must be a number.");
    }
    if (typeof gameState.player.street.districtId !== "string") {
      pushError("player.street.districtId must be a string.");
    }
    if (typeof gameState.player.street.currentStatusId !== "string") {
      pushError("player.street.currentStatusId must be a string.");
    }
    if (!(gameState.player.street.undergroundTitles instanceof Array)) {
      pushError("player.street.undergroundTitles must be an array.");
    }
    if (!(gameState.player.street.localPromoterIds instanceof Array)) {
      pushError("player.street.localPromoterIds must be an array.");
    }
    if (!(gameState.player.street.undergroundPressureTags instanceof Array)) {
      pushError("player.street.undergroundPressureTags must be an array.");
    }
  }
  if (!gameState.player || !isObject(gameState.player.pro)) {
    pushError("player.pro is missing.");
  } else {
    if (!isObject(gameState.player.pro.proRecord)) {
      pushError("player.pro.proRecord is missing.");
    }
    if (typeof gameState.player.pro.currentPromoterId !== "string") {
      pushError("player.pro.currentPromoterId must be a string.");
    }
    if (typeof gameState.player.pro.currentManagerId !== "string") {
      pushError("player.pro.currentManagerId must be a string.");
    }
    if (typeof gameState.player.pro.contenderStatus !== "string") {
      pushError("player.pro.contenderStatus must be a string.");
    }
    if (!(gameState.player.pro.titleHistory instanceof Array)) {
      pushError("player.pro.titleHistory must be an array.");
    }
    if (typeof gameState.player.pro.rankingSeed !== "number") {
      pushError("player.pro.rankingSeed must be a number.");
    }
    if (typeof gameState.player.pro.proValue !== "number") {
      pushError("player.pro.proValue must be a number.");
    }
    if (!isObject(gameState.player.pro.organizationRanks)) {
      pushError("player.pro.organizationRanks must be an object.");
    }
    if (!(gameState.player.pro.championOrganizations instanceof Array)) {
      pushError("player.pro.championOrganizations must be an array.");
    }
    if (!(gameState.player.pro.proReputationTags instanceof Array)) {
      pushError("player.pro.proReputationTags must be an array.");
    }
  }
  if (!gameState.player || !isObject(gameState.player.preparation)) {
    pushError("player.preparation is missing.");
  } else {
    if (typeof gameState.player.preparation.currentTargetFighterId !== "string") {
      pushError("player.preparation.currentTargetFighterId must be a string.");
    }
    if (!(gameState.player.preparation.campHistory instanceof Array)) {
      pushError("player.preparation.campHistory must be an array.");
    }
    if (!isObject(gameState.player.preparation.scoutingByFighterId)) {
      pushError("player.preparation.scoutingByFighterId is missing.");
    }
    if (!isObject(gameState.player.preparation.partnerHistoryByFighterId)) {
      pushError("player.preparation.partnerHistoryByFighterId is missing.");
    }
    if (typeof gameState.player.preparation.activeCampId !== "string") {
      pushError("player.preparation.activeCampId must be a string.");
    }
  }
  if (!gameState.player || !isObject(gameState.player.development)) {
    pushError("player.development is missing.");
  } else {
    if (!(gameState.player.development.activePerks instanceof Array)) {
      pushError("player.development.activePerks must be an array.");
    }
  }
  if (!gameState.player || !isObject(gameState.player.biography)) {
    pushError("player.biography is missing.");
  } else {
    if (!(gameState.player.biography.flags instanceof Array)) {
      pushError("player.biography.flags must be an array.");
    }
    if (!(gameState.player.biography.history instanceof Array)) {
      pushError("player.biography.history must be an array.");
    }
    if (!(gameState.player.biography.mediaFeed instanceof Array)) {
      pushError("player.biography.mediaFeed must be an array.");
    }
  }

  if (!gameState.career || !isObject(gameState.career.calendar)) {
    pushError("career.calendar is missing.");
  } else if (typeof gameState.career.calendar.totalWeeks !== "number") {
    pushError("career.calendar.totalWeeks must be a number.");
  }
  if (!gameState.feed || !(gameState.feed.log instanceof Array)) {
    pushError("feed.log must be an array.");
  }
  if (!gameState.world || !(gameState.world.opponents instanceof Array)) {
    pushError("world.opponents must be an array.");
  }
  if (!gameState.world || !(gameState.world.npcs instanceof Array)) {
    pushError("world.npcs must be an array.");
  }
  if (!gameState.world || !(gameState.world.relationships instanceof Array)) {
    pushError("world.relationships must be an array.");
  }
  if (!gameState.world || !(gameState.world.relationshipArcs instanceof Array)) {
    pushError("world.relationshipArcs must be an array.");
  }
  if (!gameState.world || !(gameState.world.rivalries instanceof Array)) {
    pushError("world.rivalries must be an array.");
  }
  if (!gameState.world || !isObject(gameState.world.offers)) {
    pushError("world.offers is missing.");
  } else {
    if (!(gameState.world.offers.available instanceof Array)) {
      pushError("world.offers.available must be an array.");
    }
    if (!(gameState.world.offers.fightOffers instanceof Array)) {
      pushError("world.offers.fightOffers must be an array.");
    }
    if (!(gameState.world.offers.contractOffers instanceof Array)) {
      pushError("world.offers.contractOffers must be an array.");
    }
  }

  if (!gameState.ui || typeof gameState.ui.screen !== "string" || typeof gameState.ui.panel !== "string") {
    pushError("ui.screen and ui.panel must be strings.");
  }
  if (gameState.battle && gameState.battle.current) {
    if (typeof gameState.battle.current.rulesetId !== "undefined" && typeof gameState.battle.current.rulesetId !== "string") {
      pushError("battle.current.rulesetId must be a string when present.");
    }
    if (typeof gameState.battle.current.roundLimit !== "undefined" && typeof gameState.battle.current.roundLimit !== "number") {
      pushError("battle.current.roundLimit must be a number when present.");
    }
  }

  if (isObject(gameState.playerState)) {
    validateId(gameState.playerState.id, "playerState.id");
    validateId(gameState.playerState.playerId, "playerState.playerId");
    validateId(gameState.playerState.fighterEntityId, "playerState.fighterEntityId");
    if (!isObject(gameState.playerState.careerTrack) || !isObject(gameState.playerState.careerTrack.tracks)) {
      pushError("playerState.careerTrack.tracks is missing.");
    }
    if (!(gameState.playerState.knownNpcIds instanceof Array)) {
      pushError("playerState.knownNpcIds must be an array.");
    }
  }

  if (isObject(gameState.worldState)) {
    validateId(gameState.worldState.id, "worldState.id");
    if (!isObject(gameState.worldState.timeline)) {
      pushError("worldState.timeline is missing.");
    } else {
      validateId(gameState.worldState.timeline.id, "worldState.timeline.id");
      if (typeof gameState.worldState.timeline.currentWeek !== "number") {
        pushError("worldState.timeline.currentWeek must be a number.");
      }
    }
    if (!isObject(gameState.worldState.worldCareer)) {
      pushError("worldState.worldCareer is missing.");
    } else {
      validateId(gameState.worldState.worldCareer.id, "worldState.worldCareer.id");
      if (typeof gameState.worldState.worldCareer.lastProcessedWeek !== "number") {
        pushError("worldState.worldCareer.lastProcessedWeek must be a number.");
      }
      if (!(gameState.worldState.worldCareer.encounterHistoryIds instanceof Array)) {
        pushError("worldState.worldCareer.encounterHistoryIds must be an array.");
      }
      if (!isObject(gameState.worldState.worldCareer.encounterHistoriesById)) {
        pushError("worldState.worldCareer.encounterHistoriesById is missing.");
      }
      if (!isObject(gameState.worldState.worldCareer.encounterPairIndex)) {
        pushError("worldState.worldCareer.encounterPairIndex is missing.");
      }
      if (!(gameState.worldState.worldCareer.pendingNotices instanceof Array)) {
        pushError("worldState.worldCareer.pendingNotices must be an array.");
      }
      if (!(gameState.worldState.worldCareer.worldHistory instanceof Array)) {
        pushError("worldState.worldCareer.worldHistory must be an array.");
      }
    }
  }

  if (isObject(gameState.rosterState)) {
    validateId(gameState.rosterState.id, "rosterState.id");
    if (!(gameState.rosterState.fighterIds instanceof Array)) {
      pushError("rosterState.fighterIds must be an array.");
    }
    if (!isObject(gameState.rosterState.fightersById)) {
      pushError("rosterState.fightersById is missing.");
    }
    if (!(gameState.rosterState.gymIds instanceof Array)) {
      pushError("rosterState.gymIds must be an array.");
    }
    if (!isObject(gameState.rosterState.gymsById)) {
      pushError("rosterState.gymsById is missing.");
    }
    if (!(gameState.rosterState.trainerIds instanceof Array)) {
      pushError("rosterState.trainerIds must be an array.");
    }
    if (!isObject(gameState.rosterState.trainersById)) {
      pushError("rosterState.trainersById is missing.");
    }
    if (gameState.rosterState.gymIds instanceof Array && isObject(gameState.rosterState.gymsById)) {
      for (i = 0; i < gameState.rosterState.gymIds.length; i += 1) {
        if (!isObject(gameState.rosterState.gymsById[gameState.rosterState.gymIds[i]])) {
          pushError("rosterState.gymsById has a missing gym entity.");
          continue;
        }
        if (typeof gameState.rosterState.gymsById[gameState.rosterState.gymIds[i]].gymType !== "string") {
          pushError("GymEntity.gymType must be a string.");
        }
        if (!(gameState.rosterState.gymsById[gameState.rosterState.gymIds[i]].rosterIds instanceof Array)) {
          pushError("GymEntity.rosterIds must be an array.");
        }
        if (!(gameState.rosterState.gymsById[gameState.rosterState.gymIds[i]].coachIds instanceof Array)) {
          pushError("GymEntity.coachIds must be an array.");
        }
      }
    }
    if (gameState.rosterState.trainerIds instanceof Array && isObject(gameState.rosterState.trainersById)) {
      for (i = 0; i < gameState.rosterState.trainerIds.length; i += 1) {
        if (!isObject(gameState.rosterState.trainersById[gameState.rosterState.trainerIds[i]])) {
          pushError("rosterState.trainersById has a missing trainer entity.");
          continue;
        }
        if (typeof gameState.rosterState.trainersById[gameState.rosterState.trainerIds[i]].fullName !== "string") {
          pushError("TrainerEntity.fullName must be a string.");
        }
        if (typeof gameState.rosterState.trainersById[gameState.rosterState.trainerIds[i]].trainerType !== "string") {
          pushError("TrainerEntity.trainerType must be a string.");
        }
        if (!(gameState.rosterState.trainersById[gameState.rosterState.trainerIds[i]].boxerIds instanceof Array)) {
          pushError("TrainerEntity.boxerIds must be an array.");
        }
      }
    }
  }

  if (isObject(gameState.organizationState)) {
    if (!(gameState.organizationState.organizationIds instanceof Array)) {
      pushError("organizationState.organizationIds must be an array.");
    }
    if (!isObject(gameState.organizationState.organizationsById)) {
      pushError("organizationState.organizationsById is missing.");
    }
    if (!(gameState.organizationState.rankingTableIds instanceof Array)) {
      pushError("organizationState.rankingTableIds must be an array.");
    }
    if (!isObject(gameState.organizationState.rankingTablesById)) {
      pushError("organizationState.rankingTablesById is missing.");
    }
  }

  if (isObject(gameState.organizationState)) {
    validateId(gameState.organizationState.id, "organizationState.id");
    if (!(gameState.organizationState.organizationIds instanceof Array)) {
      pushError("organizationState.organizationIds must be an array.");
    }
    if (!isObject(gameState.organizationState.organizationsById)) {
      pushError("organizationState.organizationsById is missing.");
    }
    if (!(gameState.organizationState.rankingTableIds instanceof Array)) {
      pushError("organizationState.rankingTableIds must be an array.");
    }
    if (!isObject(gameState.organizationState.rankingTablesById)) {
      pushError("organizationState.rankingTablesById is missing.");
    }
    if (!(gameState.organizationState.promoterIds instanceof Array)) {
      pushError("organizationState.promoterIds must be an array.");
    }
    if (!isObject(gameState.organizationState.promotersById)) {
      pushError("organizationState.promotersById is missing.");
    }
    if (!(gameState.organizationState.managerIds instanceof Array)) {
      pushError("organizationState.managerIds must be an array.");
    }
    if (!isObject(gameState.organizationState.managersById)) {
      pushError("organizationState.managersById is missing.");
    }
    if (!(gameState.organizationState.teamIds instanceof Array)) {
      pushError("organizationState.teamIds must be an array.");
    }
    if (!isObject(gameState.organizationState.teamsById)) {
      pushError("organizationState.teamsById is missing.");
    }
  }

  if (isObject(gameState.competitionState)) {
    validateId(gameState.competitionState.id, "competitionState.id");
    if (!(gameState.competitionState.competitionIds instanceof Array)) {
      pushError("competitionState.competitionIds must be an array.");
    }
    if (!isObject(gameState.competitionState.competitionsById)) {
      pushError("competitionState.competitionsById is missing.");
    }
    if (!(gameState.competitionState.bracketIds instanceof Array)) {
      pushError("competitionState.bracketIds must be an array.");
    }
    if (!isObject(gameState.competitionState.bracketsById)) {
      pushError("competitionState.bracketsById is missing.");
    }
    if (!(gameState.competitionState.proOfferIds instanceof Array)) {
      pushError("competitionState.proOfferIds must be an array.");
    }
    if (!isObject(gameState.competitionState.proOffersById)) {
      pushError("competitionState.proOffersById is missing.");
    }
    if (!(gameState.competitionState.sparringOfferIds instanceof Array)) {
      pushError("competitionState.sparringOfferIds must be an array.");
    }
    if (!isObject(gameState.competitionState.sparringOffersById)) {
      pushError("competitionState.sparringOffersById is missing.");
    }
    if (!(gameState.competitionState.trainingCampIds instanceof Array)) {
      pushError("competitionState.trainingCampIds must be an array.");
    }
    if (!isObject(gameState.competitionState.trainingCampsById)) {
      pushError("competitionState.trainingCampsById is missing.");
    }
    if (!isObject(gameState.competitionState.amateurHooks)) {
      pushError("competitionState.amateurHooks is missing.");
    }
    if (!isObject(gameState.competitionState.amateurSeason)) {
      pushError("competitionState.amateurSeason is missing.");
    } else {
      if (typeof gameState.competitionState.amateurSeason.currentSeasonYear !== "number") {
        pushError("competitionState.amateurSeason.currentSeasonYear must be a number.");
      }
      if (typeof gameState.competitionState.amateurSeason.currentSeasonWeek !== "number") {
        pushError("competitionState.amateurSeason.currentSeasonWeek must be a number.");
      }
      if (typeof gameState.competitionState.amateurSeason.lastProcessedWeek !== "number") {
        pushError("competitionState.amateurSeason.lastProcessedWeek must be a number.");
      }
      if (!(gameState.competitionState.amateurSeason.tournamentIds instanceof Array)) {
        pushError("competitionState.amateurSeason.tournamentIds must be an array.");
      }
      if (!isObject(gameState.competitionState.amateurSeason.tournamentsById)) {
        pushError("competitionState.amateurSeason.tournamentsById is missing.");
      }
      if (!(gameState.competitionState.amateurSeason.bracketIds instanceof Array)) {
        pushError("competitionState.amateurSeason.bracketIds must be an array.");
      }
      if (!isObject(gameState.competitionState.amateurSeason.bracketsById)) {
        pushError("competitionState.amateurSeason.bracketsById is missing.");
      }
      if (!(gameState.competitionState.amateurSeason.registrationWindows instanceof Array)) {
        pushError("competitionState.amateurSeason.registrationWindows must be an array.");
      }
      if (!isObject(gameState.competitionState.amateurSeason.nationalRankingByCountry)) {
        pushError("competitionState.amateurSeason.nationalRankingByCountry is missing.");
      }
      if (!isObject(gameState.competitionState.amateurSeason.fighterSeasonStatsById)) {
        pushError("competitionState.amateurSeason.fighterSeasonStatsById is missing.");
      }
      if (!(gameState.competitionState.amateurSeason.resultHistory instanceof Array)) {
        pushError("competitionState.amateurSeason.resultHistory must be an array.");
      }
      if (!(gameState.competitionState.amateurSeason.teamSelectionHistory instanceof Array)) {
        pushError("competitionState.amateurSeason.teamSelectionHistory must be an array.");
      }
    }
  }

  if (isObject(gameState.narrativeState)) {
    validateId(gameState.narrativeState.id, "narrativeState.id");
    if (!(gameState.narrativeState.biographyFlags instanceof Array)) {
      pushError("narrativeState.biographyFlags must be an array.");
    }
    if (!(gameState.narrativeState.activeArcIds instanceof Array)) {
      pushError("narrativeState.activeArcIds must be an array.");
    }
    if (!(gameState.narrativeState.rivalryIds instanceof Array)) {
      pushError("narrativeState.rivalryIds must be an array.");
    }
    if (!(gameState.narrativeState.worldMediaIds instanceof Array)) {
      pushError("narrativeState.worldMediaIds must be an array.");
    }
    if (!isObject(gameState.narrativeState.worldMediaById)) {
      pushError("narrativeState.worldMediaById is missing.");
    }
    if (!(gameState.narrativeState.worldLegendIds instanceof Array)) {
      pushError("narrativeState.worldLegendIds must be an array.");
    }
    if (!isObject(gameState.narrativeState.worldLegendsById)) {
      pushError("narrativeState.worldLegendsById is missing.");
    }
    if (!isObject(gameState.narrativeState.teamHistoryByCountryId)) {
      pushError("narrativeState.teamHistoryByCountryId is missing.");
    }
    if (!isObject(gameState.narrativeState.titleHistoryByOrganizationId)) {
      pushError("narrativeState.titleHistoryByOrganizationId is missing.");
    }
    if (!isObject(gameState.narrativeState.tournamentHistoryById)) {
      pushError("narrativeState.tournamentHistoryById is missing.");
    }
    if (!isObject(gameState.narrativeState.streetHistoryByCountryId)) {
      pushError("narrativeState.streetHistoryByCountryId is missing.");
    }
    if (!(gameState.narrativeState.availableTransitionIds instanceof Array)) {
      pushError("narrativeState.availableTransitionIds must be an array.");
    }
    if (!isObject(gameState.narrativeState.availableTransitionsById)) {
      pushError("narrativeState.availableTransitionsById is missing.");
    }
    if (!(gameState.narrativeState.transitionEventIds instanceof Array)) {
      pushError("narrativeState.transitionEventIds must be an array.");
    }
    if (!isObject(gameState.narrativeState.transitionEventsById)) {
      pushError("narrativeState.transitionEventsById is missing.");
    }
    if (!(gameState.narrativeState.transitionHistory instanceof Array)) {
      pushError("narrativeState.transitionHistory must be an array.");
    }
    if (!(gameState.narrativeState.transitionNoticeQueue instanceof Array)) {
      pushError("narrativeState.transitionNoticeQueue must be an array.");
    }
    if (!isObject(gameState.narrativeState.transitionEventStateById)) {
      pushError("narrativeState.transitionEventStateById is missing.");
    }
    if (typeof gameState.narrativeState.lastKnownTrackId !== "string") {
      pushError("narrativeState.lastKnownTrackId must be a string.");
    }
    if (typeof gameState.narrativeState.lastKnownNationalTeamStatus !== "string") {
      pushError("narrativeState.lastKnownNationalTeamStatus must be a string.");
    }
    if (typeof gameState.narrativeState.lastTransitionSyncWeek !== "number") {
      pushError("narrativeState.lastTransitionSyncWeek must be a number.");
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}
