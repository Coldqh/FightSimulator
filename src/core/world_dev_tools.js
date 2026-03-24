var WorldDevTools = (function () {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function isArray(value) {
    return value instanceof Array;
  }

  function numberOr(value, fallback) {
    return typeof value === "number" && isFinite(value) ? value : fallback;
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

  function removeValue(list, value) {
    var i;
    if (!(list instanceof Array) || !value) {
      return;
    }
    for (i = list.length - 1; i >= 0; i -= 1) {
      if (list[i] === value) {
        list.splice(i, 1);
      }
    }
  }

  function rosterRoot(gameState) {
    return gameState && gameState.rosterState ? gameState.rosterState : null;
  }

  function organizationRoot(gameState) {
    return gameState && gameState.organizationState ? gameState.organizationState : null;
  }

  function competitionRoot(gameState) {
    return gameState && gameState.competitionState ? gameState.competitionState : null;
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
    return 2026;
  }

  function getCountry(countryId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getCountry ? ContentLoader.getCountry(countryId || "") : null;
  }

  function countryName(countryId) {
    var country = getCountry(countryId);
    return country && country.name ? country.name : (countryId || "");
  }

  function listCountries() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listCountries ? ContentLoader.listCountries() : [];
  }

  function getFighter(gameState, fighterId) {
    var roster = rosterRoot(gameState);
    return fighterId && roster && roster.fightersById ? roster.fightersById[fighterId] || null : null;
  }

  function getGym(gameState, gymId) {
    var roster = rosterRoot(gameState);
    return gymId && roster && roster.gymsById ? roster.gymsById[gymId] || null : null;
  }

  function getTrainer(gameState, trainerId) {
    var roster = rosterRoot(gameState);
    return trainerId && roster && roster.trainersById ? roster.trainersById[trainerId] || null : null;
  }

  function listFighters(gameState) {
    var roster = rosterRoot(gameState);
    var result = [];
    var ids;
    var i;
    if (!roster || !isArray(roster.fighterIds)) {
      return result;
    }
    ids = roster.fighterIds;
    for (i = 0; i < ids.length; i += 1) {
      if (roster.fightersById[ids[i]]) {
        result.push(roster.fightersById[ids[i]]);
      }
    }
    return result;
  }

  function fighterName(fighter) {
    if (!fighter) {
      return "";
    }
    if (fighter.fullName) {
      return fighter.fullName;
    }
    if (fighter.name) {
      return fighter.name;
    }
    return [fighter.firstName || "", fighter.lastName || ""].join(" ").replace(/\s+/g, " ").replace(/^ | $/g, "");
  }

  function fighterTrack(fighter) {
    return fighter ? (fighter.currentTrack || fighter.trackId || "street") : "street";
  }

  function fighterRank(fighter) {
    return fighter && fighter.amateurRank ? fighter.amateurRank : "";
  }

  function fighterHealth(fighter) {
    return fighter && fighter.healthState ? numberOr(fighter.healthState.health, 100) : 100;
  }

  function fighterWear(fighter) {
    return fighter && fighter.wearState ? numberOr(fighter.wearState.wear, 0) : 0;
  }

  function fighterInjuries(fighter) {
    return fighter && fighter.healthState && isArray(fighter.healthState.injuries) ? fighter.healthState.injuries.length : 0;
  }

  function fighterStatsTotal(fighter) {
    var stats = fighter ? (fighter.attributes || fighter.stats || {}) : {};
    return numberOr(stats.str, 0) + numberOr(stats.tec, 0) + numberOr(stats.spd, 0) + numberOr(stats.end, 0) + numberOr(stats.vit, 0);
  }

  function ensureAmateurWorld(gameState) {
    if (typeof AmateurEcosystem !== "undefined" && AmateurEcosystem.ensureOrganizations) {
      AmateurEcosystem.ensureOrganizations(gameState);
    }
    if (typeof AmateurSeasonEngine !== "undefined" && AmateurSeasonEngine.ensureState) {
      AmateurSeasonEngine.ensureState(gameState);
    }
  }

  function getTeam(gameState, countryId) {
    if (typeof AmateurEcosystem !== "undefined" && AmateurEcosystem.getNationalTeam) {
      return AmateurEcosystem.getNationalTeam(gameState, countryId);
    }
    return null;
  }

  function worldQaRoot() {
    return typeof WORLD_QA_DATA !== "undefined" && WORLD_QA_DATA ? WORLD_QA_DATA : {
      batchPresets: [],
      validationRules: [],
      teamStatusActions: [],
      trackActions: [],
      retirementReasons: []
    };
  }

  function listBatchPresets() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listWorldBatchPresets ? ContentLoader.listWorldBatchPresets() : clone(worldQaRoot().batchPresets || []);
  }

  function getBatchPreset(presetId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getWorldBatchPreset ? ContentLoader.getWorldBatchPreset(presetId) : null;
  }

  function listValidationRules() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listWorldValidationRules ? ContentLoader.listWorldValidationRules() : clone(worldQaRoot().validationRules || []);
  }

  function listTeamStatusActions() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listWorldQaTeamStatusActions ? ContentLoader.listWorldQaTeamStatusActions() : clone(worldQaRoot().teamStatusActions || []);
  }

  function listTrackActions() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listWorldQaTrackActions ? ContentLoader.listWorldQaTrackActions() : clone(worldQaRoot().trackActions || []);
  }

  function listRetirementReasons() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listWorldQaRetirementReasons ? ContentLoader.listWorldQaRetirementReasons() : clone(worldQaRoot().retirementReasons || []);
  }

  function labelFromList(list, id, fallback) {
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].id === id) {
        return list[i].label || id;
      }
    }
    return fallback || id;
  }

  function localizedRankLabel(countryId, rankId) {
    if (!rankId) {
      return "без разряда";
    }
    if (typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.getLocalizedRankLabel) {
      return JuniorAmateurSystem.getLocalizedRankLabel(countryId || "default", rankId);
    }
    return rankId;
  }

  function defaultCountryForDebug(gameState) {
    var countryId = gameState && gameState.player && gameState.player.profile ? (gameState.player.profile.currentCountry || gameState.player.profile.homeCountry || "") : "";
    var countries = listCountries();
    return countryId || (countries.length ? countries[0].id : "");
  }

  function advanceWorldWeek(gameState) {
    var calendarView;
    var ageView;
    var timeline;
    if (!gameState.career) {
      gameState.career = {};
    }
    if (!gameState.worldState) {
      gameState.worldState = {};
    }
    if (!gameState.worldState.timeline) {
      gameState.worldState.timeline = {};
    }
    timeline = gameState.worldState.timeline;
    if (typeof TimeSystem !== "undefined" && TimeSystem.advanceWeek) {
      gameState.career.calendar = TimeSystem.advanceWeek(gameState.career.calendar || null);
      calendarView = TimeSystem.getCalendarView ? TimeSystem.getCalendarView(gameState.career.calendar) : null;
      ageView = TimeSystem.getAgeView ? TimeSystem.getAgeView(gameState && gameState.player && gameState.player.conditions ? gameState.player.conditions.startingAge || 16 : 16, gameState.career.calendar) : null;
      gameState.career.week = calendarView ? calendarView.weekNumber : (numberOr(gameState.career.week, 1) + 1);
      timeline.currentWeek = gameState.career.week;
      timeline.totalWeeks = gameState.career.calendar && typeof gameState.career.calendar.totalWeeks === "number" ? gameState.career.calendar.totalWeeks : Math.max(0, timeline.currentWeek - 1);
      timeline.currentMonthIndex = calendarView ? calendarView.monthIndex : numberOr(timeline.currentMonthIndex, 2);
      timeline.currentYear = calendarView ? calendarView.year : numberOr(timeline.currentYear, 2026);
      timeline.weekOfMonth = calendarView ? calendarView.weekOfMonth : numberOr(timeline.weekOfMonth, 1);
      timeline.playerAgeYears = ageView ? ageView.years : numberOr(timeline.playerAgeYears, 16);
      timeline.playerAgeMonths = ageView ? ageView.months : numberOr(timeline.playerAgeMonths, 0);
    } else {
      gameState.career.week = numberOr(gameState.career.week, 1) + 1;
      timeline.currentWeek = gameState.career.week;
    }
  }

  function captureRosterState(gameState) {
    var fighters = listFighters(gameState);
    var map = {};
    var i;
    for (i = 0; i < fighters.length; i += 1) {
      map[fighters[i].id] = {
        trackId: fighterTrack(fighters[i]),
        teamStatus: fighters[i].nationalTeamStatus || "none",
        age: numberOr(fighters[i].age, 16),
        health: fighterHealth(fighters[i]),
        wear: fighterWear(fighters[i]),
        injuries: fighterInjuries(fighters[i])
      };
    }
    return map;
  }

  function createPathTracker(gameState) {
    var fighters = listFighters(gameState);
    var tracker = {};
    var i;
    var trackId;
    for (i = 0; i < fighters.length; i += 1) {
      trackId = fighterTrack(fighters[i]);
      tracker[fighters[i].id] = {
        sawStreet: trackId === "street",
        sawAmateur: trackId === "amateur",
        countedStreetAmateurPro: false
      };
    }
    return tracker;
  }

  function createBatchMetrics(preset, startWeek, startYear) {
    return {
      presetId: preset.id,
      presetLabel: preset.label,
      years: preset.years,
      weeksPlanned: preset.weeks,
      weeksSimulated: 0,
      startWeek: startWeek,
      endWeek: startWeek,
      startYear: startYear,
      endYear: startYear,
      nationalTeamEntries: 0,
      uniqueNationalTeamFighters: {},
      teamRotations: 0,
      teamDropsAge: 0,
      teamDropsInjury: 0,
      teamDropsResults: 0,
      teamToPro: 0,
      failedTeamToStreet: 0,
      olympians: 0,
      amateurWorldChampions: 0,
      proWorldChampions: 0,
      streetToAmateurToPro: 0,
      proToStreetFallbacks: 0,
      log: []
    };
  }

  function pushBatchLog(metrics, text) {
    metrics.log.push(text);
    if (metrics.log.length > 18) {
      metrics.log = metrics.log.slice(metrics.log.length - 18);
    }
  }

  function isTeamMember(statusId) {
    return statusId === "active" || statusId === "reserve";
  }

  function classifyTeamDrop(before, fighter) {
    if (numberOr(fighter.age, 16) > 28) {
      return "age";
    }
    if (fighterHealth(fighter) < 60 || fighterWear(fighter) >= 72 || fighterInjuries(fighter) > numberOr(before.injuries, 0)) {
      return "injury";
    }
    return "results";
  }

  function collectWeeklyMetrics(metrics, before, gameState, pathTracker) {
    var fighters = listFighters(gameState);
    var i;
    var fighter;
    var prev;
    var trackId;
    var statusId;
    var path;
    for (i = 0; i < fighters.length; i += 1) {
      fighter = fighters[i];
      prev = before[fighter.id] || { trackId: fighterTrack(fighter), teamStatus: fighter.nationalTeamStatus || "none", injuries: fighterInjuries(fighter) };
      trackId = fighterTrack(fighter);
      statusId = fighter.nationalTeamStatus || "none";
      path = pathTracker[fighter.id] || { sawStreet: trackId === "street", sawAmateur: trackId === "amateur", countedStreetAmateurPro: false };
      pathTracker[fighter.id] = path;
      if (trackId === "street") {
        path.sawStreet = true;
      }
      if (trackId === "amateur") {
        path.sawAmateur = true;
      }
      if (path.sawStreet && path.sawAmateur && trackId === "pro" && !path.countedStreetAmateurPro) {
        path.countedStreetAmateurPro = true;
        metrics.streetToAmateurToPro += 1;
      }
      if (prev.trackId === "pro" && trackId === "street") {
        metrics.proToStreetFallbacks += 1;
      }
      if (prev.trackId !== "pro" && trackId === "pro" && isTeamMember(prev.teamStatus)) {
        metrics.teamToPro += 1;
      }
      if (prev.trackId !== "street" && trackId === "street" && (prev.teamStatus === "dropped" || (fighter.worldHistoryHooks && fighter.worldHistoryHooks.indexOf("former_national_team_member") !== -1))) {
        metrics.failedTeamToStreet += 1;
      }
      if (!isTeamMember(prev.teamStatus) && isTeamMember(statusId)) {
        metrics.nationalTeamEntries += 1;
        metrics.uniqueNationalTeamFighters[fighter.id] = true;
      }
      if (prev.teamStatus !== statusId && (isTeamMember(prev.teamStatus) || isTeamMember(statusId))) {
        metrics.teamRotations += 1;
      }
      if ((prev.teamStatus === "active" || prev.teamStatus === "reserve" || prev.teamStatus === "candidate") && (statusId === "none" || statusId === "dropped")) {
        var reason = classifyTeamDrop(prev, fighter);
        if (reason === "age") {
          metrics.teamDropsAge += 1;
        } else if (reason === "injury") {
          metrics.teamDropsInjury += 1;
        } else {
          metrics.teamDropsResults += 1;
        }
      }
    }
  }

  function countMap(map) {
    var total = 0;
    var key;
    for (key in map) {
      if (map.hasOwnProperty(key)) {
        total += 1;
      }
    }
    return total;
  }

  function collectMediaMetrics(gameState, metrics, fromWeek, toWeek) {
    var media;
    var olympians = {};
    var amateurWorld = {};
    var proWorld = {};
    var i;
    var entry;
    var tags;
    if (typeof WorldStoryEngine === "undefined" || !WorldStoryEngine.listWorldMedia) {
      return;
    }
    media = WorldStoryEngine.listWorldMedia(gameState);
    for (i = 0; i < media.length; i += 1) {
      entry = media[i];
      tags = entry && entry.tags instanceof Array ? entry.tags : [];
      if (!entry || typeof entry.week !== "number" || entry.week < fromWeek || entry.week > toWeek) {
        continue;
      }
      if (tags.indexOf("olympics") !== -1 && entry.fighterId) {
        olympians[entry.fighterId] = true;
      }
      if (tags.indexOf("world_championship") !== -1 && tags.indexOf("champion") !== -1 && entry.fighterId) {
        amateurWorld[entry.fighterId] = true;
      }
      if (tags.indexOf("pro_title") !== -1 && entry.fighterId) {
        proWorld[entry.fighterId] = true;
      }
    }
    metrics.olympians = countMap(olympians);
    metrics.amateurWorldChampions = countMap(amateurWorld);
    metrics.proWorldChampions = countMap(proWorld);
  }

  function simulateWorldBatch(gameState, presetId) {
    var preset = typeof presetId === "string" ? getBatchPreset(presetId) : presetId;
    var simState;
    var metrics;
    var before;
    var tracker;
    var i;
    var validation;
    if (!gameState || !preset) {
      return null;
    }
    simState = clone(gameState);
    ensureAmateurWorld(simState);
    if (typeof WorldCareerSimEngine !== "undefined" && WorldCareerSimEngine.ensureState) {
      WorldCareerSimEngine.ensureState(simState);
    }
    metrics = createBatchMetrics(preset, currentWeek(simState), currentYear(simState));
    tracker = createPathTracker(simState);
    for (i = 0; i < preset.weeks; i += 1) {
      before = captureRosterState(simState);
      advanceWorldWeek(simState);
      if (typeof CareerTransitionEngine !== "undefined" && CareerTransitionEngine.syncPlayerTransitionState) {
        CareerTransitionEngine.syncPlayerTransitionState(simState, currentWeek(simState));
      }
      if (typeof WorldCareerSimEngine !== "undefined" && WorldCareerSimEngine.runWeeklyPass) {
        WorldCareerSimEngine.runWeeklyPass(simState, { absoluteWeek: currentWeek(simState), actionType: "world_batch" });
      }
      if (typeof WorldStoryEngine !== "undefined" && WorldStoryEngine.syncWorldStory) {
        WorldStoryEngine.syncWorldStory(simState);
      }
      collectWeeklyMetrics(metrics, before, simState, tracker);
      metrics.weeksSimulated += 1;
    }
    metrics.endWeek = currentWeek(simState);
    metrics.endYear = currentYear(simState);
    collectMediaMetrics(simState, metrics, metrics.startWeek + 1, metrics.endWeek);
    validation = validateWorldState(simState);
    pushBatchLog(metrics, "Сборная: " + metrics.nationalTeamEntries + " входов, " + metrics.teamRotations + " ротаций.");
    pushBatchLog(metrics, "Пути: " + metrics.streetToAmateurToPro + " street->amateur->pro и " + metrics.proToStreetFallbacks + " pro->street.");
    return {
      preset: clone(preset),
      report: {
        presetId: preset.id,
        presetLabel: preset.label,
        years: preset.years,
        weeksPlanned: preset.weeks,
        weeksSimulated: metrics.weeksSimulated,
        startWeek: metrics.startWeek,
        endWeek: metrics.endWeek,
        startYear: metrics.startYear,
        endYear: metrics.endYear,
        nationalTeamEntries: metrics.nationalTeamEntries,
        uniqueNationalTeamFighters: countMap(metrics.uniqueNationalTeamFighters),
        teamRotations: metrics.teamRotations,
        teamDropsAge: metrics.teamDropsAge,
        teamDropsInjury: metrics.teamDropsInjury,
        teamDropsResults: metrics.teamDropsResults,
        teamToPro: metrics.teamToPro,
        failedTeamToStreet: metrics.failedTeamToStreet,
        olympians: metrics.olympians,
        amateurWorldChampions: metrics.amateurWorldChampions,
        proWorldChampions: metrics.proWorldChampions,
        streetToAmateurToPro: metrics.streetToAmateurToPro,
        proToStreetFallbacks: metrics.proToStreetFallbacks,
        validation: validation,
        log: clone(metrics.log)
      },
      validation: validation,
      finalState: simState
    };
  }

  function buildTeamProfile(gameState, countryId) {
    var season;
    var team;
    var ranking;
    var top = [];
    var i;
    ensureAmateurWorld(gameState);
    season = competitionRoot(gameState) ? competitionRoot(gameState).amateurSeason || null : null;
    team = getTeam(gameState, countryId);
    ranking = season && season.nationalRankingByCountry ? season.nationalRankingByCountry[countryId] || [] : [];
    for (i = 0; i < ranking.length && i < 10; i += 1) {
      top.push({ fighterId: ranking[i].fighterId, score: numberOr(ranking[i].score, 0), rankId: ranking[i].rankId || "" });
    }
    return {
      countryId: countryId,
      countryName: countryName(countryId),
      team: clone(team),
      rankingPreview: top
    };
  }

  function listCountryFighters(gameState, countryId, limit) {
    var all = listFighters(gameState);
    var result = [];
    var i;
    var fighter;
    var max = typeof limit === "number" ? limit : 14;
    for (i = 0; i < all.length && result.length < max; i += 1) {
      fighter = all[i];
      if (fighter && !fighter.isPlayer && fighter.country === countryId) {
        result.push({
          id: fighter.id,
          name: fighterName(fighter),
          trackId: fighterTrack(fighter),
          age: numberOr(fighter.age, 16),
          teamStatus: fighter.nationalTeamStatus || "none",
          amateurRankLabel: localizedRankLabel(fighter.country, fighterRank(fighter))
        });
      }
    }
    return result;
  }

  function getFighterProfile(gameState, fighterId) {
    var fighter = getFighter(gameState, fighterId);
    var gym = fighter ? getGym(gameState, fighter.currentGymId || fighter.gymId || "") : null;
    var trainer = fighter ? getTrainer(gameState, fighter.currentTrainerId || fighter.currentCoachId || fighter.trainerId || "") : null;
    if (!fighter) {
      return null;
    }
    return {
      id: fighter.id,
      name: fighterName(fighter),
      countryId: fighter.country || "",
      countryName: countryName(fighter.country || ""),
      age: numberOr(fighter.age, 16),
      trackId: fighterTrack(fighter),
      trackLabel: labelFromList(listTrackActions(), fighterTrack(fighter), fighterTrack(fighter)),
      teamStatus: fighter.nationalTeamStatus || "none",
      teamStatusLabel: labelFromList(listTeamStatusActions(), fighter.nationalTeamStatus || "none", fighter.nationalTeamStatus || "none"),
      amateurRankId: fighterRank(fighter),
      amateurRankLabel: localizedRankLabel(fighter.country || "", fighterRank(fighter)),
      gymId: fighter.currentGymId || fighter.gymId || "",
      gymName: gym && gym.name ? gym.name : "без зала",
      trainerId: fighter.currentTrainerId || fighter.currentCoachId || fighter.trainerId || "",
      trainerName: trainer && trainer.fullName ? trainer.fullName : "без тренера",
      health: fighterHealth(fighter),
      wear: fighterWear(fighter),
      injuries: fighterInjuries(fighter),
      fame: numberOr(fighter.fame, 0),
      streetRating: numberOr(fighter.streetRating, 0),
      totalStats: fighterStatsTotal(fighter),
      hooks: clone(fighter.worldHistoryHooks || [])
    };
  }

  function removeFromTeams(gameState, fighterId) {
    var orgState = organizationRoot(gameState);
    var i;
    var team;
    if (!orgState || !isArray(orgState.teamIds)) {
      return;
    }
    for (i = 0; i < orgState.teamIds.length; i += 1) {
      team = orgState.teamsById[orgState.teamIds[i]];
      if (!team) {
        continue;
      }
      removeValue(team.activeRosterIds, fighterId);
      removeValue(team.reserveRosterIds, fighterId);
      removeValue(team.candidateRosterIds, fighterId);
    }
  }

  function forceSelectionWindow(gameState, countryId) {
    var team = buildTeamProfile(gameState, countryId).team;
    var week = currentWeek(gameState);
    if (!team) {
      return { ok: false, reason: "Сборная не найдена." };
    }
    team.selectionWindow = team.selectionWindow || {};
    team.selectionWindow.isOpen = true;
    team.selectionWindow.currentWindowIndex = Math.floor(Math.max(0, week - 1) / Math.max(1, numberOr(team.selectionWindow.lengthWeeks, 12)));
    team.lastSelectionWeek = week;
    organizationRoot(gameState).teamsById[team.id] = team;
    return { ok: true, teamId: team.id, countryId: countryId };
  }

  function forceTeamStatus(gameState, fighterId, statusId, countryId) {
    var fighter = getFighter(gameState, fighterId);
    var team = null;
    if (!fighter) {
      return { ok: false, reason: "Боец не найден." };
    }
    ensureAmateurWorld(gameState);
    removeFromTeams(gameState, fighter.id);
    if (statusId === "active" || statusId === "reserve" || statusId === "candidate") {
      team = getTeam(gameState, countryId || fighter.country || "");
      if (!team) {
        return { ok: false, reason: "Сборная не найдена." };
      }
      fighter.currentTrack = "amateur";
      fighter.trackId = "amateur";
      fighter.status = "active";
      fighter.nationalTeamStatus = statusId;
      if (!fighter.amateurRank) {
        fighter.amateurRank = numberOr(fighter.age, 16) >= 18 ? "adult_class_3" : "junior_class_1";
      }
      if (statusId === "active") { addUnique(team.activeRosterIds, fighter.id); }
      if (statusId === "reserve") { addUnique(team.reserveRosterIds, fighter.id); }
      if (statusId === "candidate") { addUnique(team.candidateRosterIds, fighter.id); }
    } else {
      fighter.nationalTeamStatus = statusId || "none";
    }
    fighter.lastTeamStatusChangeWeek = currentWeek(gameState);
    return { ok: true, fighterId: fighter.id, statusId: fighter.nationalTeamStatus || "none" };
  }

  function forceQualifierTournament(gameState, countryId) {
    var season;
    var ids;
    var i;
    var tournament = null;
    var ranking;
    ensureAmateurWorld(gameState);
    season = competitionRoot(gameState) ? competitionRoot(gameState).amateurSeason || null : null;
    if (!season || !isArray(season.tournamentIds)) {
      return { ok: false, reason: "Сезон не найден." };
    }
    ids = season.tournamentIds;
    for (i = 0; i < ids.length; i += 1) {
      if (season.tournamentsById[ids[i]] && season.tournamentsById[ids[i]].country === countryId && season.tournamentsById[ids[i]].tournamentTypeId === "national_team_trials") {
        tournament = season.tournamentsById[ids[i]];
        break;
      }
    }
    if (!tournament) {
      return { ok: false, reason: "Отборочный турнир не найден." };
    }
    ranking = season.nationalRankingByCountry ? season.nationalRankingByCountry[countryId] || [] : [];
    tournament.registrationStartWeek = currentWeek(gameState);
    tournament.registrationEndWeek = currentWeek(gameState);
    tournament.startWeek = currentWeek(gameState) + 1;
    tournament.status = "registration";
    tournament.invitedIds = [];
    for (i = 0; i < ranking.length && i < 8; i += 1) {
      addUnique(tournament.invitedIds, ranking[i].fighterId);
    }
    season.selectedTournamentId = tournament.id;
    return { ok: true, tournamentId: tournament.id, invitedCount: tournament.invitedIds.length };
  }

  function forceTrackTransition(gameState, fighterId, trackId) {
    var fighter = getFighter(gameState, fighterId);
    if (!fighter) {
      return { ok: false, reason: "Боец не найден." };
    }
    if (trackId === "retired") {
      return forceRetirement(gameState, fighterId, "debug_retirement");
    }
    fighter.currentTrack = trackId;
    fighter.trackId = trackId;
    fighter.status = "active";
    fighter.lastTrackTransitionWeek = currentWeek(gameState);
    if (trackId === "street") {
      removeFromTeams(gameState, fighter.id);
      if (fighter.nationalTeamStatus === "active" || fighter.nationalTeamStatus === "reserve" || fighter.nationalTeamStatus === "candidate") {
        fighter.nationalTeamStatus = "dropped";
      }
      addUnique(fighter.worldHistoryHooks, "left_amateur_path_for_streets");
    } else if (trackId === "amateur") {
      fighter.nationalTeamStatus = fighter.nationalTeamStatus || "none";
    } else if (trackId === "pro") {
      removeFromTeams(gameState, fighter.id);
      fighter.nationalTeamStatus = "none";
      fighter.proRecord = fighter.proRecord || { wins: 0, losses: 0, draws: 0, kos: 0 };
      fighter.contenderStatus = fighter.contenderStatus || "prospect";
    }
    return { ok: true, fighterId: fighter.id, trackId: trackId };
  }

  function forceRetirement(gameState, fighterId, reasonId) {
    var fighter = getFighter(gameState, fighterId);
    var gym = fighter ? getGym(gameState, fighter.currentGymId || fighter.gymId || "") : null;
    var trainer = fighter ? getTrainer(gameState, fighter.currentTrainerId || fighter.currentCoachId || fighter.trainerId || "") : null;
    if (!fighter) {
      return { ok: false, reason: "Боец не найден." };
    }
    removeFromTeams(gameState, fighter.id);
    if (gym) { removeValue(gym.rosterIds, fighter.id); }
    if (trainer) { removeValue(trainer.boxerIds, fighter.id); }
    fighter.status = "retired";
    fighter.currentTrack = "retired";
    fighter.trackId = "retired";
    fighter.nationalTeamStatus = "none";
    fighter.currentGymId = "";
    fighter.currentTrainerId = "";
    addUnique(fighter.worldHistoryHooks, reasonId || "debug_retirement");
    return { ok: true, fighterId: fighter.id, reasonId: reasonId || "debug_retirement" };
  }

  function addIssue(groups, ruleId, message) {
    var i;
    var rules = listValidationRules();
    var label = ruleId;
    var severity = "warn";
    for (i = 0; i < rules.length; i += 1) {
      if (rules[i] && rules[i].id === ruleId) {
        label = rules[i].label || ruleId;
        severity = rules[i].severity || "warn";
        break;
      }
    }
    if (!groups[ruleId]) {
      groups[ruleId] = { id: ruleId, label: label, severity: severity, items: [] };
    }
    groups[ruleId].items.push(message);
  }

  function validateWorldState(gameState) {
    var groups = {};
    var fighters = listFighters(gameState);
    var orgState = organizationRoot(gameState);
    var narrative = gameState && gameState.narrativeState ? gameState.narrativeState : null;
    var i;
    var fighter;
    var gym;
    var trainer;
    var team;
    var ids;
    var seen;
    var key;
    var list = [];
    var errorCount = 0;
    var warnCount = 0;
    for (i = 0; i < fighters.length; i += 1) {
      fighter = fighters[i];
      gym = getGym(gameState, fighter.currentGymId || fighter.gymId || "");
      trainer = getTrainer(gameState, fighter.currentTrainerId || fighter.currentCoachId || fighter.trainerId || "");
      if ((fighter.currentGymId || fighter.gymId) && !gym) {
        addIssue(groups, "dangling_ids", fighterName(fighter) + ": нет зала " + (fighter.currentGymId || fighter.gymId) + ".");
      }
      if ((fighter.currentTrainerId || fighter.currentCoachId || fighter.trainerId) && !trainer) {
        addIssue(groups, "dangling_ids", fighterName(fighter) + ": нет тренера " + (fighter.currentTrainerId || fighter.currentCoachId || fighter.trainerId) + ".");
      }
      if (gym && (!isArray(gym.rosterIds) || gym.rosterIds.indexOf(fighter.id) === -1)) {
        addIssue(groups, "invalid_roster_membership", fighterName(fighter) + ": зал " + gym.name + " не видит бойца.");
      }
      if (trainer && (!isArray(trainer.boxerIds) || trainer.boxerIds.indexOf(fighter.id) === -1)) {
        addIssue(groups, "invalid_roster_membership", fighterName(fighter) + ": тренер " + trainer.fullName + " не видит бойца.");
      }
      if (fighterRank(fighter) && typeof ContentLoader !== "undefined" && ContentLoader.getAmateurRank) {
        var rank = ContentLoader.getAmateurRank(fighterRank(fighter));
        if (rank && numberOr(fighter.age, 16) < numberOr(rank.minAge, 16)) {
          addIssue(groups, "impossible_age_rank", fighterName(fighter) + ": возраст не подходит для разряда " + localizedRankLabel(fighter.country, rank.id) + ".");
        }
      }
      if (numberOr(fighter.age, 16) > 28 && (fighter.nationalTeamStatus === "active" || fighter.nationalTeamStatus === "reserve") && fighterTrack(fighter) === "amateur") {
        addIssue(groups, "impossible_age_rank", fighterName(fighter) + ": остался в элитной сборной после 28.");
      }
    }
    if (orgState && isArray(orgState.teamIds)) {
      for (i = 0; i < orgState.teamIds.length; i += 1) {
        team = orgState.teamsById[orgState.teamIds[i]];
        if (!team) {
          continue;
        }
        if ((team.activeRosterIds || []).length > numberOr(team.rosterSlots, 3)) {
          addIssue(groups, "broken_team_slot", (team.label || team.id) + ": переполнен состав.");
        }
        if ((team.reserveRosterIds || []).length > numberOr(team.reserveSlots, 2)) {
          addIssue(groups, "broken_team_slot", (team.label || team.id) + ": переполнен резерв.");
        }
        ids = [].concat(team.activeRosterIds || []).concat(team.reserveRosterIds || []).concat(team.candidateRosterIds || []);
        seen = {};
        for (key = 0; key < ids.length; key += 1) {
          if (seen[ids[key]]) {
            addIssue(groups, "broken_team_slot", (team.label || team.id) + ": дубликат бойца в списках.");
            break;
          }
          seen[ids[key]] = true;
          fighter = getFighter(gameState, ids[key]);
          if (!fighter) {
            addIssue(groups, "dangling_ids", (team.label || team.id) + ": ссылка на пропавшего бойца " + ids[key] + ".");
          } else if (fighter.country !== team.countryId || fighterTrack(fighter) !== "amateur") {
            addIssue(groups, "broken_team_slot", (team.label || team.id) + ": в составе некорректный боец " + fighterName(fighter) + ".");
          }
        }
      }
    }
    if (narrative && isArray(narrative.transitionHistory)) {
      for (i = 0; i < narrative.transitionHistory.length; i += 1) {
        if (!narrative.transitionHistory[i] || !narrative.transitionHistory[i].transitionId || !narrative.transitionHistory[i].fromTrackId || !narrative.transitionHistory[i].toTrackId) {
          addIssue(groups, "invalid_transition_history", "В истории переходов есть неполная запись.");
        }
      }
    }
    for (key in groups) {
      if (groups.hasOwnProperty(key)) {
        groups[key].count = groups[key].items.length;
        list.push(groups[key]);
        if (groups[key].severity === "error") {
          errorCount += groups[key].items.length;
        } else {
          warnCount += groups[key].items.length;
        }
      }
    }
    return { ok: errorCount === 0, issueCount: errorCount + warnCount, errorCount: errorCount, warnCount: warnCount, groups: list };
  }

  return {
    listBatchPresets: listBatchPresets,
    getBatchPreset: getBatchPreset,
    listValidationRules: listValidationRules,
    listTeamStatusActions: listTeamStatusActions,
    listTrackActions: listTrackActions,
    listRetirementReasons: listRetirementReasons,
    simulateWorldBatch: simulateWorldBatch,
    validateWorldState: validateWorldState,
    buildTeamProfile: buildTeamProfile,
    listCountryFighters: listCountryFighters,
    getFighterProfile: getFighterProfile,
    forceSelectionWindow: forceSelectionWindow,
    forceTeamStatus: forceTeamStatus,
    forceQualifierTournament: forceQualifierTournament,
    forceTrackTransition: forceTrackTransition,
    forceRetirement: forceRetirement,
    defaultCountryForDebug: defaultCountryForDebug,
    labelTeamStatus: function (statusId) { return labelFromList(listTeamStatusActions(), statusId, statusId); },
    labelTrack: function (trackId) { return labelFromList(listTrackActions(), trackId, trackId); }
  };
}());
