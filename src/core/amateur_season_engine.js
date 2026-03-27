var AmateurSeasonEngine = (function () {
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

  function currentYear(gameState) {
    if (gameState && gameState.worldState && gameState.worldState.timeline && typeof gameState.worldState.timeline.currentYear === "number") {
      return gameState.worldState.timeline.currentYear;
    }
    if (gameState && gameState.career && gameState.career.calendar && typeof TimeSystem !== "undefined" && TimeSystem.getCalendarView) {
      return TimeSystem.getCalendarView(gameState.career.calendar).year;
    }
    return 2026;
  }

  function currentAbsoluteWeek(gameState) {
    if (gameState && gameState.career && typeof gameState.career.week === "number") {
      return gameState.career.week;
    }
    if (gameState && gameState.worldState && gameState.worldState.timeline && typeof gameState.worldState.timeline.currentWeek === "number") {
      return gameState.worldState.timeline.currentWeek;
    }
    return 1;
  }

  function currentSeasonWeek(gameState) {
    return ((Math.max(1, currentAbsoluteWeek(gameState)) - 1) % 52) + 1;
  }

  function playerEntityId(gameState) {
    return gameState && gameState.playerState ? gameState.playerState.fighterEntityId || "fighter_player_main" : "fighter_player_main";
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
    if (!(gameState.competitionState.competitionIds instanceof Array)) {
      gameState.competitionState.competitionIds = [];
    }
    if (!gameState.competitionState.competitionsById || typeof gameState.competitionState.competitionsById !== "object") {
      gameState.competitionState.competitionsById = {};
    }
    if (!(gameState.competitionState.bracketIds instanceof Array)) {
      gameState.competitionState.bracketIds = [];
    }
    if (!gameState.competitionState.bracketsById || typeof gameState.competitionState.bracketsById !== "object") {
      gameState.competitionState.bracketsById = {};
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
    return gameState && gameState.rosterState ? gameState.rosterState : null;
  }

  function organizationRoot(gameState) {
    return gameState && gameState.organizationState ? gameState.organizationState : null;
  }

  function seasonTemplate() {
    return typeof ContentLoader !== "undefined" && ContentLoader.getAmateurSeasonTemplate ? ContentLoader.getAmateurSeasonTemplate() : null;
  }

  function listCountries() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listCountries ? ContentLoader.listCountries() : [];
  }

  function getCountry(countryId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getCountry ? ContentLoader.getCountry(countryId) : null;
  }

  function listTournamentTemplates() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listAmateurTournamentTemplates ? ContentLoader.listAmateurTournamentTemplates() : [];
  }

  function getTournamentType(typeId) {
    return typeof ContentLoader !== "undefined" && ContentLoader.getTournamentType ? ContentLoader.getTournamentType(typeId) : null;
  }

  function compareRanks(leftId, rightId) {
    if (typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.compareRanks) {
      return JuniorAmateurSystem.compareRanks(leftId || "", rightId || "");
    }
    return 0;
  }

  function getRankLabel(countryId, rankId) {
    if (typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.getLocalizedRankLabel) {
      return JuniorAmateurSystem.getLocalizedRankLabel(countryId || "default", rankId || "");
    }
    return rankId || "";
  }

  function buildDefaultSeasonState(yearValue) {
    var template = seasonTemplate() || {};
    var year = typeof yearValue === "number" ? yearValue : 2026;
    return {
      id: "amateur_season_main",
      currentSeasonYear: year,
      currentSeasonWeek: 1,
      lastProcessedWeek: 0,
      weeksPerSeason: template.weeksPerSeason || 52,
      registrationWindows: [],
      localCircuit: [],
      regionalCircuit: [],
      nationalCircuit: [],
      nationalTeamTrials: [],
      continentalCircuit: [],
      worldChampionshipCycle: [],
      olympicCycle: {
        cycleLengthYears: template.olympicCycleLengthYears || 4,
        cycleYearIndex: ((year - 2026) % Math.max(1, template.olympicCycleLengthYears || 4) + Math.max(1, template.olympicCycleLengthYears || 4)) % Math.max(1, template.olympicCycleLengthYears || 4),
        tournamentIds: []
      },
      tournamentIds: [],
      tournamentsById: {},
      bracketIds: [],
      bracketsById: {},
      playerRegistrationIds: [],
      playerInvitationIds: [],
      playerTournamentId: "",
      selectedTournamentId: "",
      activeTournamentId: "",
      fighterSeasonStatsById: {},
      nationalRankingByCountry: {},
      resultHistory: [],
      pendingNotices: [],
      teamSelectionHistory: []
    };
  }

  function seasonRoot(gameState) {
    var root = competitionRoot(gameState);
    var seasonState;
    if (!root.amateurSeason || typeof root.amateurSeason !== "object") {
      root.amateurSeason = buildDefaultSeasonState(currentYear(gameState));
    }
    seasonState = root.amateurSeason;
    if (!(seasonState.registrationWindows instanceof Array)) { seasonState.registrationWindows = []; }
    if (!(seasonState.localCircuit instanceof Array)) { seasonState.localCircuit = []; }
    if (!(seasonState.regionalCircuit instanceof Array)) { seasonState.regionalCircuit = []; }
    if (!(seasonState.nationalCircuit instanceof Array)) { seasonState.nationalCircuit = []; }
    if (!(seasonState.nationalTeamTrials instanceof Array)) { seasonState.nationalTeamTrials = []; }
    if (!(seasonState.continentalCircuit instanceof Array)) { seasonState.continentalCircuit = []; }
    if (!(seasonState.worldChampionshipCycle instanceof Array)) { seasonState.worldChampionshipCycle = []; }
    if (!seasonState.olympicCycle || typeof seasonState.olympicCycle !== "object") {
      seasonState.olympicCycle = buildDefaultSeasonState(currentYear(gameState)).olympicCycle;
    }
    if (!(seasonState.olympicCycle.tournamentIds instanceof Array)) { seasonState.olympicCycle.tournamentIds = []; }
    if (!(seasonState.tournamentIds instanceof Array)) { seasonState.tournamentIds = []; }
    if (!seasonState.tournamentsById || typeof seasonState.tournamentsById !== "object") { seasonState.tournamentsById = {}; }
    if (!(seasonState.bracketIds instanceof Array)) { seasonState.bracketIds = []; }
    if (!seasonState.bracketsById || typeof seasonState.bracketsById !== "object") { seasonState.bracketsById = {}; }
    if (!(seasonState.playerRegistrationIds instanceof Array)) { seasonState.playerRegistrationIds = []; }
    if (!(seasonState.playerInvitationIds instanceof Array)) { seasonState.playerInvitationIds = []; }
    if (!seasonState.fighterSeasonStatsById || typeof seasonState.fighterSeasonStatsById !== "object") { seasonState.fighterSeasonStatsById = {}; }
    if (!seasonState.nationalRankingByCountry || typeof seasonState.nationalRankingByCountry !== "object") { seasonState.nationalRankingByCountry = {}; }
    if (!(seasonState.resultHistory instanceof Array)) { seasonState.resultHistory = []; }
    if (!(seasonState.pendingNotices instanceof Array)) { seasonState.pendingNotices = []; }
    if (!(seasonState.teamSelectionHistory instanceof Array)) { seasonState.teamSelectionHistory = []; }
    return seasonState;
  }

  function seasonStatsFor(seasonState, fighterId) {
    if (!seasonState.fighterSeasonStatsById[fighterId]) {
      seasonState.fighterSeasonStatsById[fighterId] = {
        fighterId: fighterId,
        seasonPoints: 0,
        federationPoints: 0,
        medals: { gold: 0, silver: 0, bronze: 0 },
        placements: [],
        upsetWins: 0,
        nationalTeamQualification: 0,
        lostTeamPlace: 0,
        returnedToTeam: 0,
        tournamentsEntered: 0,
        tournamentsWon: 0,
        resultHistory: [],
        nationalRank: 0
      };
    }
    if (!(seasonState.fighterSeasonStatsById[fighterId].placements instanceof Array)) {
      seasonState.fighterSeasonStatsById[fighterId].placements = [];
    }
    if (!(seasonState.fighterSeasonStatsById[fighterId].resultHistory instanceof Array)) {
      seasonState.fighterSeasonStatsById[fighterId].resultHistory = [];
    }
    if (!seasonState.fighterSeasonStatsById[fighterId].medals || typeof seasonState.fighterSeasonStatsById[fighterId].medals !== "object") {
      seasonState.fighterSeasonStatsById[fighterId].medals = { gold: 0, silver: 0, bronze: 0 };
    }
    if (typeof seasonState.fighterSeasonStatsById[fighterId].nationalTeamQualification !== "number") {
      seasonState.fighterSeasonStatsById[fighterId].nationalTeamQualification = 0;
    }
    if (typeof seasonState.fighterSeasonStatsById[fighterId].lostTeamPlace !== "number") {
      seasonState.fighterSeasonStatsById[fighterId].lostTeamPlace = 0;
    }
    if (typeof seasonState.fighterSeasonStatsById[fighterId].returnedToTeam !== "number") {
      seasonState.fighterSeasonStatsById[fighterId].returnedToTeam = 0;
    }
    return seasonState.fighterSeasonStatsById[fighterId];
  }

  function fighterEntity(gameState, fighterId) {
    var roster = rosterRoot(gameState);
    return roster && roster.fightersById ? roster.fightersById[fighterId] || null : null;
  }

  function fighterTotal(entity) {
    var stats = entity && (entity.attributes || entity.stats) ? (entity.attributes || entity.stats) : {};
    return (stats.str || 0) + (stats.tec || 0) + (stats.spd || 0) + (stats.end || 0) + (stats.vit || 0);
  }

  function fighterTrack(entity) {
    return entity ? (entity.currentTrack || entity.trackId || "street") : "street";
  }

  function fighterAge(entity) {
    return entity && typeof entity.age === "number" ? entity.age : 16;
  }

  function fighterRank(entity) {
    return entity ? (entity.amateurRank || entity.amateurClass || "") : "";
  }

  function fighterCountry(entity) {
    return entity ? entity.country || "" : "";
  }

  function playerAmateurRankId(gameState) {
    var fighter = fighterEntity(gameState, playerEntityId(gameState));
    return fighter ? fighterRank(fighter) : "";
  }

  function uniquePush(list, value) {
    var i;
    if (!value) {
      return;
    }
    for (i = 0; i < list.length; i += 1) {
      if (list[i] === value) {
        return;
      }
    }
    list.push(value);
  }

  function playerCanUseTournament(gameState, tournament) {
    if (!tournament) {
      return false;
    }
    return gameState && gameState.playerState ? (gameState.playerState.currentTrackId || "amateur") === "amateur" : true;
  }

  function baseFighterSelectionScore(gameState, fighterId) {
    var hooks = competitionRoot(gameState).amateurHooks || {};
    return hooks.federationPointsByFighterId && typeof hooks.federationPointsByFighterId[fighterId] === "number" ? hooks.federationPointsByFighterId[fighterId] : 0;
  }

  function fighterMedicalEligible(entity) {
    var health = entity && entity.healthState ? entity.healthState.health || 100 : 100;
    var wear = entity && entity.wearState ? entity.wearState.wear || 0 : 0;
    return health >= 55 && wear <= 78;
  }

  function fighterSeasonScore(gameState, seasonState, fighterId) {
    var stats = seasonStatsFor(seasonState, fighterId);
    var fighter = fighterEntity(gameState, fighterId);
    var baseScore = baseFighterSelectionScore(gameState, fighterId);
    var record = fighter && fighter.amateurRecord ? fighter.amateurRecord : { wins: 0, losses: 0, draws: 0 };
    var age = fighterAge(fighter);
    var score = baseScore + stats.seasonPoints + stats.federationPoints;
    score += (record.wins || 0) * 6 - (record.losses || 0) * 3 + (record.draws || 0) * 2;
    score += fighterTotal(fighter) * 2;
    score += stats.medals.gold * 34 + stats.medals.silver * 20 + stats.medals.bronze * 12;
    if (age >= 18 && age <= 28) {
      score += 12;
    } else if (age < 18) {
      score -= 6;
    }
    if (!fighterMedicalEligible(fighter)) {
      score -= 24;
    }
    return Math.max(0, Math.round(score));
  }

  function buildTournamentEntity(template, yearValue, countryId, hostCountryId) {
    var country = countryId ? getCountry(countryId) : null;
    var hostCountry = hostCountryId ? getCountry(hostCountryId) : country;
    var label = String(template.labelTemplate || template.id)
      .replace("{country}", country ? country.name : (hostCountry ? hostCountry.name : "Мир"));
    return {
      id: stableId("tournament", [template.id, yearValue, countryId || hostCountryId || "world"]),
      templateId: template.id,
      tournamentTypeId: template.tournamentTypeId,
      label: label,
      circuitKey: template.circuitKey,
      scope: template.scope,
      trackId: "amateur",
      countryId: countryId || "",
      hostCountryId: hostCountryId || countryId || "",
      status: "planned",
      invitationOnly: !!template.invitationOnly,
      olympicOnly: !!template.olympicOnly,
      registrationStartWeek: template.registrationStartWeek || 1,
      registrationEndWeek: template.registrationEndWeek || template.registrationStartWeek || 1,
      startWeek: template.startWeek || 1,
      roundsGapWeeks: template.roundsGapWeeks || 1,
      bracketSize: template.bracketSize || 8,
      minimumParticipants: template.minimumParticipants || 4,
      eligibilityRules: clone(template.eligibilityRules || {}),
      rewards: clone(template.rewards || {}),
      advancement: clone(template.advancement || {}),
      selectionImpactText: template.selectionImpactText || "",
      participantIds: [],
      invitedIds: [],
      resultLog: [],
      winnerId: "",
      currentRoundIndex: -1,
      bracketId: "",
      medals: {
        gold: "",
        silver: "",
        bronze: []
      }
    };
  }

  function createTournamentBracket(tournament) {
    return {
      id: stableId("bracket", [tournament.id]),
      tournamentId: tournament.id,
      label: tournament.label,
      participants: [],
      eligibilityRules: clone(tournament.eligibilityRules || {}),
      seeding: [],
      rounds: [],
      advancement: clone(tournament.advancement || {}),
      medals: clone(tournament.medals || { gold: "", silver: "", bronze: [] }),
      resultLog: []
    };
  }

  function initSeason(gameState, yearValue) {
    var seasonState = seasonRoot(gameState);
    var countries = listCountries();
    var templates = listTournamentTemplates();
    var i;
    var j;
    var tournament;
    var template;
    var country;
    var hostCountry;
    var seasonYear = typeof yearValue === "number" ? yearValue : currentYear(gameState);
    var circuitList;
    seasonState.currentSeasonYear = seasonYear;
    seasonState.currentSeasonWeek = currentSeasonWeek(gameState);
    seasonState.lastProcessedWeek = Math.max(0, currentAbsoluteWeek(gameState) - 1);
    seasonState.registrationWindows = [];
    seasonState.localCircuit = [];
    seasonState.regionalCircuit = [];
    seasonState.nationalCircuit = [];
    seasonState.nationalTeamTrials = [];
    seasonState.continentalCircuit = [];
    seasonState.worldChampionshipCycle = [];
    seasonState.olympicCycle = buildDefaultSeasonState(seasonYear).olympicCycle;
    seasonState.tournamentIds = [];
    seasonState.tournamentsById = {};
    seasonState.bracketIds = [];
    seasonState.bracketsById = {};
    seasonState.playerRegistrationIds = [];
    seasonState.playerInvitationIds = [];
    seasonState.playerTournamentId = "";
    seasonState.selectedTournamentId = "";
    seasonState.activeTournamentId = "";
    seasonState.pendingNotices = [];
    seasonState.nationalRankingByCountry = {};
    for (i = 0; i < templates.length; i += 1) {
      template = templates[i];
      if (!template) {
        continue;
      }
      if (template.scope === "country") {
        for (j = 0; j < countries.length; j += 1) {
          country = countries[j];
          tournament = buildTournamentEntity(template, seasonYear, country.id, country.id);
          seasonState.tournamentIds.push(tournament.id);
          seasonState.tournamentsById[tournament.id] = tournament;
          circuitList = template.circuitKey === "olympicCycle" ? seasonState.olympicCycle.tournamentIds : seasonState[template.circuitKey];
          if (!(circuitList instanceof Array)) {
            circuitList = [];
            if (template.circuitKey === "olympicCycle") {
              seasonState.olympicCycle.tournamentIds = circuitList;
            } else {
              seasonState[template.circuitKey] = circuitList;
            }
          }
          circuitList.push(tournament.id);
          seasonState.registrationWindows.push({
            tournamentId: tournament.id,
            label: tournament.label,
            startWeek: tournament.registrationStartWeek,
            endWeek: tournament.registrationEndWeek
          });
        }
      } else {
        hostCountry = countries.length ? countries[(seasonYear + (template.startWeek || 1)) % countries.length] : null;
        tournament = buildTournamentEntity(template, seasonYear, "", hostCountry ? hostCountry.id : "");
        seasonState.tournamentIds.push(tournament.id);
        seasonState.tournamentsById[tournament.id] = tournament;
        circuitList = template.circuitKey === "olympicCycle" ? seasonState.olympicCycle.tournamentIds : seasonState[template.circuitKey];
        if (!(circuitList instanceof Array)) {
          circuitList = [];
          if (template.circuitKey === "olympicCycle") {
            seasonState.olympicCycle.tournamentIds = circuitList;
          } else {
            seasonState[template.circuitKey] = circuitList;
          }
        }
        circuitList.push(tournament.id);
        seasonState.registrationWindows.push({
          tournamentId: tournament.id,
          label: tournament.label,
          startWeek: tournament.registrationStartWeek,
          endWeek: tournament.registrationEndWeek
        });
      }
    }
    return seasonState;
  }

  function countryRankingPosition(seasonState, countryId, fighterId) {
    var list = seasonState.nationalRankingByCountry[countryId] || [];
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].fighterId === fighterId) {
        return i + 1;
      }
    }
    return 0;
  }

  function previousPlacementCount(stats) {
    return stats && stats.placements instanceof Array ? stats.placements.length : 0;
  }

  function totalMedalCount(stats) {
    if (!stats || !stats.medals) {
      return 0;
    }
    return (stats.medals.gold || 0) + (stats.medals.silver || 0) + (stats.medals.bronze || 0);
  }

  function isEligibleForTournament(gameState, seasonState, fighter, tournament) {
    var rules = tournament ? tournament.eligibilityRules || {} : {};
    var stats = fighter ? seasonStatsFor(seasonState, fighter.id) : null;
    var rankingPosition;
    if (!fighter || fighterTrack(fighter) !== "amateur") {
      return false;
    }
    if (tournament && tournament.scope === "country" && tournament.countryId && fighterCountry(fighter) !== tournament.countryId) {
      return false;
    }
    if (!playerCanUseTournament(gameState, tournament) && fighter.id === playerEntityId(gameState)) {
      return false;
    }
    if (fighterAge(fighter) < (rules.minAge || 16) || fighterAge(fighter) > (rules.maxAge || 40)) {
      return false;
    }
    if (rules.minRankId && compareRanks(fighterRank(fighter), rules.minRankId) < 0) {
      return false;
    }
    if ((stats ? stats.seasonPoints : 0) + ((fighter.amateurRecord && fighter.amateurRecord.wins) || 0) * 6 < (rules.minTournamentPoints || 0)) {
      return false;
    }
    rankingPosition = countryRankingPosition(seasonState, fighterCountry(fighter), fighter.id);
    if ((rules.minNationalRankingTop || 0) > 0 && (!rankingPosition || rankingPosition > rules.minNationalRankingTop)) {
      return false;
    }
    if (rules.requiredTeamStatus && (fighter.nationalTeamStatus || "none") !== rules.requiredTeamStatus && !(rules.requiredTeamStatus === "reserve" && fighter.nationalTeamStatus === "active")) {
      return false;
    }
    if (rules.previousResults) {
      if (totalMedalCount(stats) < (rules.previousResults.minMedals || 0)) {
        return false;
      }
      if (previousPlacementCount(stats) < (rules.previousResults.minPlacements || 0)) {
        return false;
      }
    }
    if (!fighterMedicalEligible(fighter)) {
      return false;
    }
    return true;
  }

  function rankingSort(left, right) {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    if (right.rankOrder !== left.rankOrder) {
      return right.rankOrder - left.rankOrder;
    }
    return left.fighterId < right.fighterId ? -1 : 1;
  }

  function updateNationalRankings(gameState, seasonState) {
    var countries = listCountries();
    var roster = rosterRoot(gameState);
    var hooks = competitionRoot(gameState).amateurHooks;
    var i;
    var j;
    var countryId;
    var fighter;
    var entry;
    var ranking;
    seasonState.nationalRankingByCountry = {};
    hooks.federationPointsByFighterId = hooks.federationPointsByFighterId || {};
    for (i = 0; i < countries.length; i += 1) {
      countryId = countries[i].id;
      ranking = [];
      for (j = 0; j < roster.fighterIds.length; j += 1) {
        fighter = roster.fightersById[roster.fighterIds[j]];
        if (!fighter || fighter.status === "retired" || fighterTrack(fighter) !== "amateur" || fighterCountry(fighter) !== countryId) {
          continue;
        }
        entry = {
          fighterId: fighter.id,
          score: fighterSeasonScore(gameState, seasonState, fighter.id),
          rankOrder: typeof JuniorAmateurSystem !== "undefined" && JuniorAmateurSystem.getRankOrder ? JuniorAmateurSystem.getRankOrder(fighterRank(fighter)) : 0,
          rankId: fighterRank(fighter),
          label: fighter.fullName || fighter.name || fighter.id
        };
        ranking.push(entry);
      }
      ranking.sort(rankingSort);
      for (j = 0; j < ranking.length; j += 1) {
        seasonStatsFor(seasonState, ranking[j].fighterId).nationalRank = j + 1;
        hooks.federationPointsByFighterId[ranking[j].fighterId] = ranking[j].score;
      }
      seasonState.nationalRankingByCountry[countryId] = ranking;
    }
  }

  function listEligibleFightersForTournament(gameState, seasonState, tournament) {
    var roster = rosterRoot(gameState);
    var result = [];
    var countries;
    var team;
    var ids;
    var i;
    var j;
    var fighter;
    var requiredRankId = "";
    if (!roster || !tournament) {
      return result;
    }
    if (tournament.scope === "country" && tournament.countryId) {
      requiredRankId = playerAmateurRankId(gameState);
      if (fighterCountry(fighterEntity(gameState, playerEntityId(gameState))) !== tournament.countryId) {
        requiredRankId = "";
      }
    }
    if (tournament.scope === "country") {
      for (i = 0; i < roster.fighterIds.length; i += 1) {
        fighter = roster.fightersById[roster.fighterIds[i]];
        if (!fighter || fighterCountry(fighter) !== tournament.countryId) {
          continue;
        }
        if (requiredRankId && fighterRank(fighter) !== requiredRankId) {
          continue;
        }
        if (isEligibleForTournament(gameState, seasonState, fighter, tournament)) {
          result.push(fighter.id);
        }
      }
      return result;
    }
    countries = listCountries();
    for (i = 0; i < countries.length; i += 1) {
      team = typeof AmateurEcosystem !== "undefined" && AmateurEcosystem.getNationalTeam ? AmateurEcosystem.getNationalTeam(gameState, countries[i].id) : null;
      ids = [];
      if (team) {
        ids = ids.concat(team.activeRosterIds || []);
        ids = ids.concat(team.reserveRosterIds || []);
        ids = ids.concat(team.candidateRosterIds || []);
      }
      for (j = 0; j < ids.length; j += 1) {
        fighter = fighterEntity(gameState, ids[j]);
        if (fighter && isEligibleForTournament(gameState, seasonState, fighter, tournament)) {
          uniquePush(result, fighter.id);
        }
      }
    }
    return result;
  }

  function seedParticipants(gameState, seasonState, fighterIds) {
    var seeded = [];
    var i;
    for (i = 0; i < fighterIds.length; i += 1) {
      seeded.push({
        fighterId: fighterIds[i],
        score: fighterSeasonScore(gameState, seasonState, fighterIds[i])
      });
    }
    seeded.sort(function (left, right) {
      return right.score - left.score;
    });
    return seeded;
  }

  function pickBracketSize(tournament, participantCount) {
    var preferred = tournament.bracketSize || 8;
    if (participantCount >= preferred) {
      return preferred;
    }
    if (participantCount >= 4) {
      return 4;
    }
    return 0;
  }

  function roundCountForSize(size) {
    if (size <= 1) { return 0; }
    if (size <= 2) { return 1; }
    if (size <= 4) { return 2; }
    return 3;
  }

  function createEmptyRounds(tournament, size) {
    var rounds = [];
    var roundCount = roundCountForSize(size);
    var currentMatches = size / 2;
    var roundIndex;
    var matchIndex;
    var round;
    for (roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
      round = {
        id: stableId("round", [tournament.id, roundIndex + 1]),
        label: roundIndex === roundCount - 1 ? "Финал" : (roundIndex === roundCount - 2 ? "Полуфинал" : "Четвертьфинал"),
        roundIndex: roundIndex,
        scheduledWeek: tournament.startWeek + roundIndex * Math.max(1, tournament.roundsGapWeeks || 1),
        matches: []
      };
      for (matchIndex = 0; matchIndex < currentMatches; matchIndex += 1) {
        round.matches.push({
          id: stableId("match", [tournament.id, roundIndex + 1, matchIndex + 1]),
          roundIndex: roundIndex,
          matchIndex: matchIndex,
          fighterAId: "",
          fighterBId: "",
          winnerId: "",
          loserId: "",
          status: "pending",
          method: ""
        });
      }
      rounds.push(round);
      currentMatches = Math.max(1, currentMatches / 2);
    }
    return rounds;
  }

  function buildBracket(gameState, seasonState, tournament, participantIds) {
    var bracket = createTournamentBracket(tournament);
    var seeded = seedParticipants(gameState, seasonState, participantIds);
    var size = pickBracketSize(tournament, seeded.length);
    var order = [];
    var top = 0;
    var bottom = 0;
    var i;
    if (size === 0) {
      return null;
    }
    seeded = seeded.slice(0, size);
    bottom = seeded.length - 1;
    bracket.participants = participantIds.slice(0, size);
    for (i = 0; i < seeded.length; i += 1) {
      bracket.seeding.push(seeded[i].fighterId);
    }
    while (top <= bottom) {
      if (top === bottom) {
        order.push(seeded[top].fighterId);
      } else {
        order.push(seeded[top].fighterId);
        order.push(seeded[bottom].fighterId);
      }
      top += 1;
      bottom -= 1;
    }
    bracket.rounds = createEmptyRounds(tournament, size);
    for (i = 0; i < bracket.rounds[0].matches.length; i += 1) {
      bracket.rounds[0].matches[i].fighterAId = order[i * 2] || "";
      bracket.rounds[0].matches[i].fighterBId = order[i * 2 + 1] || "";
    }
    tournament.bracketId = bracket.id;
    tournament.participantIds = bracket.participants.slice(0);
    tournament.currentRoundIndex = 0;
    tournament.status = "active";
    return bracket;
  }

  function currentRound(bracket, roundIndex) {
    return bracket && bracket.rounds ? bracket.rounds[roundIndex] || null : null;
  }

  function fighterIdInMatch(match, fighterId) {
    return match && fighterId && (match.fighterAId === fighterId || match.fighterBId === fighterId);
  }

  function resolveByeMatches(bracket) {
    var i;
    var j;
    var round;
    var match;
    for (i = 0; i < bracket.rounds.length; i += 1) {
      round = bracket.rounds[i];
      for (j = 0; j < round.matches.length; j += 1) {
        match = round.matches[j];
        if (match.status !== "pending") {
          continue;
        }
        if (match.fighterAId && !match.fighterBId) {
          match.winnerId = match.fighterAId;
          match.status = "resolved";
          match.method = "bye";
        } else if (match.fighterBId && !match.fighterAId) {
          match.winnerId = match.fighterBId;
          match.status = "resolved";
          match.method = "bye";
        }
      }
    }
  }

  function fillNextRound(bracket, roundIndex) {
    var round = currentRound(bracket, roundIndex);
    var nextRound = currentRound(bracket, roundIndex + 1);
    var i;
    if (!round || !nextRound) {
      return;
    }
    for (i = 0; i < nextRound.matches.length; i += 1) {
      nextRound.matches[i].fighterAId = round.matches[i * 2] && round.matches[i * 2].winnerId ? round.matches[i * 2].winnerId : "";
      nextRound.matches[i].fighterBId = round.matches[i * 2 + 1] && round.matches[i * 2 + 1].winnerId ? round.matches[i * 2 + 1].winnerId : "";
    }
  }

  function roundResolved(round) {
    var i;
    if (!round) {
      return false;
    }
    for (i = 0; i < round.matches.length; i += 1) {
      if (round.matches[i].status !== "resolved") {
        return false;
      }
    }
    return true;
  }

  function simulateMatch(gameState, seasonState, tournament, match, weekValue) {
    var fighterA = fighterEntity(gameState, match.fighterAId);
    var fighterB = fighterEntity(gameState, match.fighterBId);
    var rng = typeof RNG !== "undefined" && RNG.createSeededState ? RNG.createSeededState(String(tournament.id) + "|" + String(match.id) + "|" + String(weekValue), String(tournament.id) + ":" + String(match.id)) : null;
    var scoreA;
    var scoreB;
    var winner;
    var loser;
    if (!fighterA && !fighterB) {
      match.status = "resolved";
      return;
    }
    if (fighterA && !fighterB) {
      match.winnerId = fighterA.id;
      match.status = "resolved";
      match.method = "bye";
      return;
    }
    if (!fighterA && fighterB) {
      match.winnerId = fighterB.id;
      match.status = "resolved";
      match.method = "bye";
      return;
    }
    scoreA = fighterTotal(fighterA) * 8 + fighterSeasonScore(gameState, seasonState, fighterA.id) + (fighterA.healthState ? fighterA.healthState.health || 100 : 100) - (fighterA.wearState ? fighterA.wearState.wear || 0 : 0);
    scoreB = fighterTotal(fighterB) * 8 + fighterSeasonScore(gameState, seasonState, fighterB.id) + (fighterB.healthState ? fighterB.healthState.health || 100 : 100) - (fighterB.wearState ? fighterB.wearState.wear || 0 : 0);
    if (rng && RNG.int) {
      scoreA += RNG.int(rng, -16, 16);
      scoreB += RNG.int(rng, -16, 16);
    }
    winner = scoreA >= scoreB ? fighterA : fighterB;
    loser = winner.id === fighterA.id ? fighterB : fighterA;
    match.winnerId = winner.id;
    match.loserId = loser.id;
    match.status = "resolved";
    match.method = Math.abs(scoreA - scoreB) >= 28 ? "TKO" : "Dec";
  }

  function updateNpcRecordAfterTournamentMatch(gameState, winnerId, loserId, method) {
    var winner = fighterEntity(gameState, winnerId);
    var loser = fighterEntity(gameState, loserId);
    if (winner && winner.id !== playerEntityId(gameState)) {
      winner.amateurRecord = winner.amateurRecord || { wins: 0, losses: 0, draws: 0 };
      winner.amateurRecord.wins += 1;
      winner.record = winner.record || { wins: 0, losses: 0, draws: 0, kos: 0 };
      winner.record.wins += 1;
      if (method && method.indexOf("KO") !== -1) {
        winner.record.kos = (winner.record.kos || 0) + 1;
      }
    }
    if (loser && loser.id !== playerEntityId(gameState)) {
      loser.amateurRecord = loser.amateurRecord || { wins: 0, losses: 0, draws: 0 };
      loser.amateurRecord.losses += 1;
      loser.record = loser.record || { wins: 0, losses: 0, draws: 0, kos: 0 };
      loser.record.losses += 1;
    }
  }

  function tournamentRoundReward(tournament, resultKey) {
    var rewards = tournament && tournament.rewards ? tournament.rewards : {};
    if (resultKey === "win") {
      return rewards.roundWinPoints || 0;
    }
    if (resultKey === "loss") {
      return rewards.roundLossPoints || 0;
    }
    return rewards.roundDrawPoints || 0;
  }

  function registerSeasonResult(seasonState, entry) {
    seasonState.resultHistory.unshift(entry);
    if (seasonState.resultHistory.length > 120) {
      seasonState.resultHistory = seasonState.resultHistory.slice(0, 120);
    }
  }

  function registerTeamSelectionHistory(seasonState, entry) {
    var i;
    if (!entry || !entry.id) {
      return;
    }
    for (i = 0; i < seasonState.teamSelectionHistory.length; i += 1) {
      if (seasonState.teamSelectionHistory[i] && seasonState.teamSelectionHistory[i].id === entry.id) {
        return;
      }
    }
    seasonState.teamSelectionHistory.unshift(clone(entry));
    if (seasonState.teamSelectionHistory.length > 180) {
      seasonState.teamSelectionHistory = seasonState.teamSelectionHistory.slice(0, 180);
    }
  }

  function applyRoundOutcome(gameState, seasonState, tournament, winnerId, loserId, method, sourceTag) {
    var winnerStats = seasonStatsFor(seasonState, winnerId);
    var loserStats = loserId ? seasonStatsFor(seasonState, loserId) : null;
    winnerStats.seasonPoints += tournamentRoundReward(tournament, "win");
    winnerStats.resultHistory.unshift({ week: currentAbsoluteWeek(gameState), tournamentId: tournament.id, result: "win", method: method, source: sourceTag || "season" });
    if (winnerStats.resultHistory.length > 24) {
      winnerStats.resultHistory = winnerStats.resultHistory.slice(0, 24);
    }
    if (loserStats) {
      loserStats.seasonPoints += tournamentRoundReward(tournament, "loss");
      loserStats.resultHistory.unshift({ week: currentAbsoluteWeek(gameState), tournamentId: tournament.id, result: "loss", method: method, source: sourceTag || "season" });
      if (loserStats.resultHistory.length > 24) {
        loserStats.resultHistory = loserStats.resultHistory.slice(0, 24);
      }
    }
    if (loserId && fighterSeasonScore(gameState, seasonState, loserId) > fighterSeasonScore(gameState, seasonState, winnerId) + 20) {
      winnerStats.upsetWins += 1;
    }
    updateNpcRecordAfterTournamentMatch(gameState, winnerId, loserId, method);
    registerSeasonResult(seasonState, {
      id: stableId("season_result", [tournament.id, winnerId, loserId || "bye", currentAbsoluteWeek(gameState)]),
      week: currentAbsoluteWeek(gameState),
      tournamentId: tournament.id,
      winnerId: winnerId,
      loserId: loserId || "",
      method: method || "",
      source: sourceTag || "season"
    });
  }

  function awardPlacement(gameState, seasonState, tournament, fighterId, placement) {
    var stats = seasonStatsFor(seasonState, fighterId);
    var fighter = fighterEntity(gameState, fighterId);
    var isPlayer = fighterId === playerEntityId(gameState);
    var federation = tournament.rewards && tournament.rewards.federationPoints ? tournament.rewards.federationPoints : {};
    var title = "";
    if (!fighter) {
      return;
    }
    if (placement === "champion") {
      stats.medals.gold += 1;
      stats.placements.unshift("champion");
      stats.seasonPoints += tournament.rewards && tournament.rewards.championshipBonusPoints ? tournament.rewards.championshipBonusPoints : 0;
      stats.federationPoints += federation.champion || 0;
      stats.tournamentsWon += 1;
    } else if (placement === "finalist") {
      stats.medals.silver += 1;
      stats.placements.unshift("finalist");
      stats.federationPoints += federation.finalist || 0;
    } else if (placement === "semifinalist") {
      stats.medals.bronze += 1;
      stats.placements.unshift("semifinalist");
      stats.federationPoints += federation.semifinalist || 0;
    } else {
      stats.placements.unshift("participant");
      stats.federationPoints += federation.participant || 0;
    }
    if (stats.placements.length > 16) {
      stats.placements = stats.placements.slice(0, 16);
    }
    if (isPlayer && gameState.player && gameState.player.amateur && placement === "champion") {
      gameState.player.amateur.tournamentPoints += tournament.rewards.championshipBonusPoints || 0;
    }
    if (isPlayer) {
      if (placement === "champion") {
        if (tournament.tournamentTypeId === "national_championship") {
          title = "Чемпион страны";
        } else if (tournament.tournamentTypeId === "continental_championship") {
          title = "Чемпион континента";
        } else if (tournament.tournamentTypeId === "world_championship") {
          title = "Чемпион мира";
        } else if (tournament.tournamentTypeId === "olympics") {
          title = "Олимпийский чемпион";
        } else {
          title = "Победа на турнире";
        }
      } else if (tournament.tournamentTypeId === "olympics" && (placement === "finalist" || placement === "semifinalist")) {
        title = placement === "finalist" ? "Олимпийский призёр" : "Олимпийская медаль";
      } else if (stats.medals.gold + stats.medals.silver + stats.medals.bronze === 1) {
        title = "Первая медаль";
      }
      if (title) {
        seasonState.pendingNotices.push({
          type: "career",
          tone: "good",
          text: title + ": " + tournament.label + ".",
          biography: title + " — " + tournament.label + ".",
          media: { type: "event", payload: { eventTitle: title, tags: placement === "champion" ? ["amateur_title"] : ["amateur_medal"] } }
        });
      }
    }
  }

  function finalizeTournament(gameState, seasonState, tournament, bracket) {
    var finalRound = bracket.rounds.length ? bracket.rounds[bracket.rounds.length - 1] : null;
    var semifinalRound = bracket.rounds.length > 1 ? bracket.rounds[bracket.rounds.length - 2] : null;
    var finalMatch = finalRound && finalRound.matches.length ? finalRound.matches[0] : null;
    var i;
    if (!finalMatch || !finalMatch.winnerId) {
      return;
    }
    tournament.status = "completed";
    tournament.winnerId = finalMatch.winnerId;
    tournament.medals.gold = finalMatch.winnerId;
    tournament.medals.silver = finalMatch.loserId || "";
    tournament.medals.bronze = [];
    if (semifinalRound) {
      for (i = 0; i < semifinalRound.matches.length; i += 1) {
        if (semifinalRound.matches[i].loserId) {
          tournament.medals.bronze.push(semifinalRound.matches[i].loserId);
        }
      }
    }
    bracket.medals = clone(tournament.medals);
    awardPlacement(gameState, seasonState, tournament, tournament.medals.gold, "champion");
    if (tournament.medals.silver) {
      awardPlacement(gameState, seasonState, tournament, tournament.medals.silver, "finalist");
    }
    for (i = 0; i < tournament.medals.bronze.length; i += 1) {
      awardPlacement(gameState, seasonState, tournament, tournament.medals.bronze[i], "semifinalist");
    }
    tournament.resultLog.push({
      week: currentAbsoluteWeek(gameState),
      winnerId: tournament.medals.gold,
      silverId: tournament.medals.silver,
      bronzeIds: clone(tournament.medals.bronze)
    });
  }

  function ensureTournamentBracket(gameState, seasonState, tournament) {
    var eligible;
    var seeded;
    var limit;
    var i;
    var bracket;
    var selectedIds = [];
    var registeredIds = tournament && tournament.participantIds instanceof Array ? tournament.participantIds.slice(0) : [];
    var invitedIds = tournament && tournament.invitedIds instanceof Array ? tournament.invitedIds.slice(0) : [];
    if (tournament.bracketId && seasonState.bracketsById[tournament.bracketId]) {
      return seasonState.bracketsById[tournament.bracketId];
    }
    eligible = listEligibleFightersForTournament(gameState, seasonState, tournament);
    seeded = seedParticipants(gameState, seasonState, eligible);
    limit = Math.max(tournament.minimumParticipants || 4, tournament.bracketSize || 8);
    for (i = 0; i < registeredIds.length; i += 1) {
      if (eligible.indexOf(registeredIds[i]) !== -1) {
        uniquePush(selectedIds, registeredIds[i]);
      }
    }
    if (tournament.invitationOnly) {
      for (i = 0; i < invitedIds.length; i += 1) {
        if (eligible.indexOf(invitedIds[i]) !== -1) {
          uniquePush(selectedIds, invitedIds[i]);
        }
      }
    }
    for (i = 0; i < seeded.length && selectedIds.length < limit; i += 1) {
      uniquePush(selectedIds, seeded[i].fighterId);
    }
    tournament.participantIds = selectedIds.slice(0, limit);
    if (tournament.invitationOnly) {
      tournament.invitedIds = invitedIds.length ? invitedIds.slice(0) : tournament.participantIds.slice(0);
    }
    bracket = buildBracket(gameState, seasonState, tournament, tournament.participantIds);
    if (!bracket) {
      tournament.status = "cancelled";
      return null;
    }
    resolveByeMatches(bracket);
    seasonState.bracketIds.push(bracket.id);
    seasonState.bracketsById[bracket.id] = bracket;
    return bracket;
  }

  function syncInvitationState(gameState, seasonState) {
    var playerId = playerEntityId(gameState);
    var i;
    var tournament;
    seasonState.playerInvitationIds = [];
    for (i = 0; i < seasonState.tournamentIds.length; i += 1) {
      tournament = seasonState.tournamentsById[seasonState.tournamentIds[i]];
      if (tournament && tournament.invitedIds && tournament.invitedIds.indexOf(playerId) !== -1 && tournament.participantIds.indexOf(playerId) === -1) {
        seasonState.playerInvitationIds.push(tournament.id);
      }
    }
  }

  function refreshRegistrations(gameState, seasonState, seasonWeekValue) {
    var playerId = playerEntityId(gameState);
    var player = fighterEntity(gameState, playerId);
    var i;
    var tournament;
    for (i = 0; i < seasonState.tournamentIds.length; i += 1) {
      tournament = seasonState.tournamentsById[seasonState.tournamentIds[i]];
      if (!tournament) {
        continue;
      }
      if (seasonWeekValue >= tournament.registrationStartWeek && seasonWeekValue <= tournament.registrationEndWeek) {
        tournament.status = "registration";
        if (player && isEligibleForTournament(gameState, seasonState, player, tournament) && tournament.invitationOnly) {
          uniquePush(tournament.invitedIds, playerId);
        }
      }
    }
    syncInvitationState(gameState, seasonState);
  }

  function updateTeamSelections(gameState, seasonState) {
    var orgState = organizationRoot(gameState);
    var hooks = competitionRoot(gameState).amateurHooks;
    var i;
    var j;
    var team;
    var countryId;
    var ranking;
    var countryFighters;
    var fighter;
    var previousStatus;
    var newStatus;
    var playerId = playerEntityId(gameState);
    if (!orgState) {
      return;
    }
    for (i = 0; i < orgState.teamIds.length; i += 1) {
      team = orgState.teamsById[orgState.teamIds[i]];
      if (!team) {
        continue;
      }
      countryId = team.countryId;
      countryFighters = typeof PersistentFighterRegistry !== "undefined" && PersistentFighterRegistry.getFightersByTrackCountry ?
        PersistentFighterRegistry.getFightersByTrackCountry(gameState, "amateur", countryId) :
        [];
      if (!(countryFighters instanceof Array) || !countryFighters.length) {
        countryFighters = [];
        for (j = 0; j < gameState.rosterState.fighterIds.length; j += 1) {
          fighter = fighterEntity(gameState, gameState.rosterState.fighterIds[j]);
          if (!fighter || fighter.status === "retired" || fighterTrack(fighter) !== "amateur" || fighterCountry(fighter) !== countryId) {
            continue;
          }
          countryFighters.push(fighter);
        }
      }
      countryFighters.sort(function (left, right) {
        var totalLeft = fighterTotal(left);
        var totalRight = fighterTotal(right);
        if (totalRight !== totalLeft) {
          return totalRight - totalLeft;
        }
        return compareRanks(fighterRank(right), fighterRank(left));
      });
      ranking = [];
      for (j = 0; j < countryFighters.length; j += 1) {
        ranking.push({ fighterId: countryFighters[j].id });
      }
      team.selectionWindow = team.selectionWindow || {};
      team.selectionWindow.lengthWeeks = 1;
      team.selectionWindow.currentWindowIndex = Math.max(0, currentAbsoluteWeek(gameState) - 1);
      team.selectionWindow.isOpen = true;
      team.lastSelectionWeek = currentAbsoluteWeek(gameState);
      team.activeRosterIds = [];
      team.reserveRosterIds = [];
      team.candidateRosterIds = [];
      for (j = 0; j < ranking.length; j += 1) {
        fighter = fighterEntity(gameState, ranking[j].fighterId);
        if (!fighter) {
          continue;
        }
        previousStatus = fighter.nationalTeamStatus || "none";
        newStatus = "none";
        if (j < (team.rosterSlots || 4)) {
          newStatus = "active";
          team.activeRosterIds.push(fighter.id);
        } else if (j < (team.rosterSlots || 4) + (team.reserveSlots || 4)) {
          newStatus = "reserve";
          team.reserveRosterIds.push(fighter.id);
        }
        fighter.nationalTeamStatus = newStatus;
        hooks.teamEligibilityByFighterId[fighter.id] = hooks.teamEligibilityByFighterId[fighter.id] || {};
        if (!(hooks.teamEligibilityByFighterId[fighter.id].levels instanceof Array)) {
          hooks.teamEligibilityByFighterId[fighter.id].levels = [];
        }
        hooks.teamEligibilityByFighterId[fighter.id].levels = [];
        if (newStatus === "active") {
          hooks.teamEligibilityByFighterId[fighter.id].levels.push("team_active");
          hooks.teamEligibilityByFighterId[fighter.id].levels.push("team_reserve");
        } else if (newStatus === "reserve") {
          hooks.teamEligibilityByFighterId[fighter.id].levels.push("team_reserve");
        }
        if (previousStatus !== newStatus) {
          registerTeamSelectionHistory(seasonState, {
            id: stableId("team_history", [team.id, fighter.id, currentAbsoluteWeek(gameState), previousStatus || "none", newStatus || "none"]),
            week: currentAbsoluteWeek(gameState),
            countryId: countryId,
            teamId: team.id,
            fighterId: fighter.id,
            previousStatus: previousStatus || "none",
            newStatus: newStatus || "none"
          });
        }
        if (fighter.id === playerId && previousStatus !== newStatus) {
          if (newStatus === "active") {
            seasonState.pendingNotices.push({
              type: "career",
              tone: "good",
              text: "Тебя включили в основной состав сборной " + getCountry(countryId).name + ".",
              biography: "Попадает в основной состав сборной " + getCountry(countryId).name + ".",
              media: { type: "event", payload: { eventTitle: "Вызов в сборную", tags: ["national_team_callup"] } }
            });
            seasonStatsFor(seasonState, fighter.id).nationalTeamQualification += 1;
          } else if (newStatus === "reserve") {
            seasonState.pendingNotices.push({
              type: "career",
              tone: "warn",
              text: "Ты вошёл в резерв сборной " + getCountry(countryId).name + ".",
              biography: "Попадает в резерв сборной " + getCountry(countryId).name + "."
            });
          } else if (previousStatus === "active" || previousStatus === "reserve") {
            seasonState.pendingNotices.push({
              type: "career",
              tone: "bad",
              text: "Ты выпал из состава сборной " + getCountry(countryId).name + ".",
              biography: "Теряет место в сборной " + getCountry(countryId).name + ".",
              media: { type: "event", payload: { eventTitle: "Вылет из сборной", tags: ["national_team_drop"] } }
            });
            seasonStatsFor(seasonState, fighter.id).lostTeamPlace += 1;
          }
        }
      }
    }
  }

  function processTournamentRound(gameState, seasonState, tournament, bracket, absoluteWeek) {
    var round = currentRound(bracket, tournament.currentRoundIndex);
    var playerId = playerEntityId(gameState);
    var i;
    var match;
    if (!round) {
      return;
    }
    for (i = 0; i < round.matches.length; i += 1) {
      match = round.matches[i];
      if (match.status === "resolved") {
        continue;
      }
      if (fighterIdInMatch(match, playerId)) {
        if (absoluteWeek > round.scheduledWeek) {
          match.winnerId = match.fighterAId === playerId ? match.fighterBId : match.fighterAId;
          match.loserId = playerId;
          match.status = "resolved";
          match.method = "forfeit";
          applyRoundOutcome(gameState, seasonState, tournament, match.winnerId, match.loserId, match.method, "forfeit");
          seasonState.pendingNotices.push({
            type: "career",
            tone: "bad",
            text: "Ты пропустил старт '" + tournament.label + "' и выбыл без боя.",
            biography: "Пропускает турнир '" + tournament.label + "' и вылетает без боя."
          });
        }
        continue;
      }
      simulateMatch(gameState, seasonState, tournament, match, absoluteWeek);
      if (match.winnerId) {
        applyRoundOutcome(gameState, seasonState, tournament, match.winnerId, match.loserId, match.method, "npc");
      }
    }
    if (roundResolved(round)) {
      if (tournament.currentRoundIndex < bracket.rounds.length - 1) {
        fillNextRound(bracket, tournament.currentRoundIndex);
        resolveByeMatches(bracket);
        tournament.currentRoundIndex += 1;
      } else {
        finalizeTournament(gameState, seasonState, tournament, bracket);
      }
    }
  }

  function copyCompetitionAdapters(gameState) {
    var competitionState = competitionRoot(gameState);
    var seasonState = seasonRoot(gameState);
    var baseCompetitionIds = [];
    var baseCompetitionsById = {};
    var baseBracketIds = [];
    var baseBracketsById = {};
    var i;
    var id;
    var tournament;
    for (i = 0; i < competitionState.competitionIds.length; i += 1) {
      id = competitionState.competitionIds[i];
      if (!seasonState.tournamentsById[id]) {
        baseCompetitionIds.push(id);
        baseCompetitionsById[id] = competitionState.competitionsById[id];
      }
    }
    for (i = 0; i < competitionState.bracketIds.length; i += 1) {
      id = competitionState.bracketIds[i];
      if (!seasonState.bracketsById[id]) {
        baseBracketIds.push(id);
        baseBracketsById[id] = competitionState.bracketsById[id];
      }
    }
    competitionState.competitionIds = baseCompetitionIds;
    competitionState.competitionsById = baseCompetitionsById;
    competitionState.bracketIds = baseBracketIds;
    competitionState.bracketsById = baseBracketsById;
    for (i = 0; i < seasonState.tournamentIds.length; i += 1) {
      tournament = seasonState.tournamentsById[seasonState.tournamentIds[i]];
      competitionState.competitionIds.push(tournament.id);
      competitionState.competitionsById[tournament.id] = clone(tournament);
    }
    for (i = 0; i < seasonState.bracketIds.length; i += 1) {
      id = seasonState.bracketIds[i];
      competitionState.bracketIds.push(id);
      competitionState.bracketsById[id] = clone(seasonState.bracketsById[id]);
    }
  }

  function rebuildSeasonIfNeeded(gameState, seasonState) {
    var yearValue = currentYear(gameState);
    if (seasonState.currentSeasonYear !== yearValue || !seasonState.tournamentIds.length) {
      initSeason(gameState, yearValue);
      seasonState = seasonRoot(gameState);
    }
    return seasonState;
  }

  function processSingleWeek(gameState, seasonState, absoluteWeek) {
    var seasonWeekValue = ((absoluteWeek - 1) % Math.max(1, seasonState.weeksPerSeason || 52)) + 1;
    var i;
    var tournament;
    var bracket;
    seasonState.currentSeasonWeek = seasonWeekValue;
    refreshRegistrations(gameState, seasonState, seasonWeekValue);
    for (i = 0; i < seasonState.tournamentIds.length; i += 1) {
      tournament = seasonState.tournamentsById[seasonState.tournamentIds[i]];
      if (!tournament || tournament.status === "completed" || tournament.status === "cancelled" || seasonWeekValue < tournament.startWeek) {
        continue;
      }
      bracket = ensureTournamentBracket(gameState, seasonState, tournament);
      if (!bracket) {
        continue;
      }
      processTournamentRound(gameState, seasonState, tournament, bracket, absoluteWeek);
    }
    updateNationalRankings(gameState, seasonState);
    updateTeamSelections(gameState, seasonState);
    seasonState.lastProcessedWeek = absoluteWeek;
  }

  function ensureState(gameState) {
    var seasonState = seasonRoot(gameState);
    var absoluteWeek = currentAbsoluteWeek(gameState);
    var weekValue;
    var hasRankingData = false;
    var countryId;
    seasonState = rebuildSeasonIfNeeded(gameState, seasonState);
    for (weekValue = Math.max(1, seasonState.lastProcessedWeek + 1); weekValue <= absoluteWeek; weekValue += 1) {
      processSingleWeek(gameState, seasonState, weekValue);
    }
    for (countryId in seasonState.nationalRankingByCountry) {
      if (seasonState.nationalRankingByCountry.hasOwnProperty(countryId)) {
        hasRankingData = true;
        break;
      }
    }
    if (!hasRankingData) {
      updateNationalRankings(gameState, seasonState);
      updateTeamSelections(gameState, seasonState);
    }
    syncInvitationState(gameState, seasonState);
    copyCompetitionAdapters(gameState);
    return seasonState;
  }

  function getPlayerPendingMatch(gameState, fighterId) {
    var seasonState = seasonRoot(gameState);
    var i;
    var j;
    var tournament;
    var bracket;
    var round;
    var match;
    for (i = 0; i < seasonState.tournamentIds.length; i += 1) {
      tournament = seasonState.tournamentsById[seasonState.tournamentIds[i]];
      if (!tournament || !tournament.bracketId || tournament.status === "completed" || tournament.status === "cancelled") {
        continue;
      }
      bracket = seasonState.bracketsById[tournament.bracketId];
      round = bracket ? currentRound(bracket, tournament.currentRoundIndex) : null;
      if (!round) {
        continue;
      }
      for (j = 0; j < round.matches.length; j += 1) {
        match = round.matches[j];
        if (match.status === "pending" && fighterIdInMatch(match, fighterId)) {
          return { tournament: tournament, bracket: bracket, round: round, match: match };
        }
      }
    }
    return null;
  }

  function buildTournamentOffer(gameState, tournament, bracket, round, match, fighterId) {
    var opponentId = match.fighterAId === fighterId ? match.fighterBId : match.fighterAId;
    var opponent = fighterEntity(gameState, opponentId);
    var snapshot = null;
    var typeInfo = getTournamentType(tournament.tournamentTypeId);
    var quality = opponent ? clamp(Math.round((fighterTotal(opponent) - fighterTotal(fighterEntity(gameState, fighterId))) + 8), 4, 30) : 8;
    if (!opponent || typeof PersistentFighterRegistry === "undefined" || !PersistentFighterRegistry.buildOpponentSnapshot) {
      return null;
    }
    snapshot = PersistentFighterRegistry.buildOpponentSnapshot(opponent, null, getCountry(opponent.country));
    return {
      id: stableId("offer", [tournament.id, match.id]),
      templateId: tournament.templateId,
      label: tournament.label + " — " + round.label,
      title: typeInfo ? typeInfo.label : tournament.label,
      type: "tournament_fight",
      trackId: "amateur",
      tournamentId: tournament.id,
      bracketId: bracket.id,
      matchId: match.id,
      roundIndex: round.roundIndex,
      countryKey: tournament.countryId || tournament.hostCountryId || snapshot.countryKey,
      countryName: (getCountry(tournament.countryId || tournament.hostCountryId) || { name: "Мир" }).name,
      venue: tournament.label,
      guaranteedPurse: tournament.rewards.basePurse || 0,
      winBonus: tournament.rewards.winBonus || 0,
      koBonus: tournament.rewards.koBonus || 0,
      fameReward: tournament.rewards.fameReward || 0,
      toxicRisk: 0,
      contractLabel: "Любительский старт",
      rematchRivalryId: "",
      seriesLabel: "",
      stakesText: tournament.selectionImpactText || "",
      opponentQualityBase: quality,
      rankPointsWin: tournament.rewards.roundWinPoints || 0,
      rankPointsLoss: tournament.rewards.roundLossPoints || 0,
      rankPointsDraw: tournament.rewards.roundDrawPoints || 0,
      fighterId: opponent.id,
      opponent: snapshot,
      tournamentInfo: {
        tournamentLabel: tournament.label,
        roundLabel: round.label,
        selectionImpactText: tournament.selectionImpactText || "",
        nextHint: tournament.advancement ? tournament.advancement.nextTournamentHint || "" : ""
      }
    };
  }

  function registerPlayer(gameState, tournamentId) {
    var seasonState = ensureState(gameState);
    var tournament = seasonState.tournamentsById[tournamentId];
    var playerId = playerEntityId(gameState);
    var player = fighterEntity(gameState, playerId);
    if (!tournament) { return { ok: false, message: "Турнир не найден." }; }
    if (tournament.status !== "registration") { return { ok: false, message: "Регистрация уже закрыта." }; }
    if (tournament.participantIds.indexOf(playerId) !== -1) { return { ok: false, message: "Ты уже записан." }; }
    if (tournament.invitationOnly && tournament.invitedIds.indexOf(playerId) === -1) { return { ok: false, message: "Нужен вызов федерации." }; }
    if (!isEligibleForTournament(gameState, seasonState, player, tournament)) { return { ok: false, message: "Пока не проходишь по условиям." }; }
    tournament.participantIds.push(playerId);
    uniquePush(seasonState.playerRegistrationIds, tournament.id);
    seasonStatsFor(seasonState, playerId).tournamentsEntered += 1;
    seasonState.pendingNotices.push({ type: "career", tone: "good", text: "Ты записался на турнир '" + tournament.label + "'.", biography: "Записывается на турнир '" + tournament.label + "'." });
    syncInvitationState(gameState, seasonState);
    copyCompetitionAdapters(gameState);
    return { ok: true, message: "Регистрация подтверждена." };
  }

  function listPlayerTournamentOptions(gameState, fighterId) {
    var seasonState = ensureState(gameState);
    var fighter = fighterEntity(gameState, fighterId || playerEntityId(gameState));
    var registerable = [];
    var invitations = [];
    var active = getPlayerPendingMatch(gameState, fighter ? fighter.id : playerEntityId(gameState));
    var i;
    var tournament;
    for (i = 0; i < seasonState.tournamentIds.length; i += 1) {
      tournament = seasonState.tournamentsById[seasonState.tournamentIds[i]];
      if (!tournament || tournament.status !== "registration") {
        continue;
      }
      if (isEligibleForTournament(gameState, seasonState, fighter, tournament)) {
        if (tournament.invitationOnly) {
          if (tournament.invitedIds && tournament.invitedIds.indexOf(fighter ? fighter.id : playerEntityId(gameState)) !== -1) {
            invitations.push(tournament);
          }
        } else {
          registerable.push(tournament);
        }
      }
    }
    return { season: seasonState, active: active ? active.tournament : null, registerable: registerable, invitations: invitations };
  }

  function getNextEligibilityHint(gameState, fighterId) {
    var seasonState = ensureState(gameState);
    var fighter = fighterEntity(gameState, fighterId || playerEntityId(gameState));
    var templates = listTournamentTemplates();
    var best = null;
    var i;
    var tournament;
    var stats;
    var gap;
    if (!fighter) {
      return "";
    }
    stats = seasonStatsFor(seasonState, fighter.id);
    for (i = 0; i < templates.length; i += 1) {
      tournament = buildTournamentEntity(templates[i], seasonState.currentSeasonYear, fighterCountry(fighter), fighterCountry(fighter));
      if (isEligibleForTournament(gameState, seasonState, fighter, tournament)) {
        continue;
      }
      gap = Math.max(0, (tournament.eligibilityRules.minTournamentPoints || 0) - ((stats.seasonPoints || 0) + ((fighter.amateurRecord && fighter.amateurRecord.wins) || 0) * 6));
      if (!best || gap < best.gap) {
        best = { gap: gap, label: tournament.label, rankId: tournament.eligibilityRules.minRankId || "" };
      }
    }
    if (!best) {
      return "Следующий допуск уже открыт.";
    }
    if (best.rankId && compareRanks(fighterRank(fighter), best.rankId) < 0) {
      return best.label + ": нужен разряд " + getRankLabel(fighterCountry(fighter), best.rankId) + ".";
    }
    return best.label + ": добери ещё " + best.gap + " сезонных очков.";
  }

  function getCurrentTournament(gameState) {
    var seasonState = ensureState(gameState);
    return seasonState.activeTournamentId ? seasonState.tournamentsById[seasonState.activeTournamentId] || null : null;
  }

  function buildPlayerFightOffers(gameState, fighterId) {
    var seasonState = ensureState(gameState);
    var pending = getPlayerPendingMatch(gameState, fighterId || playerEntityId(gameState));
    var offers = [];
    seasonState.activeTournamentId = "";
    if (pending && pending.tournament && pending.bracket && pending.round && pending.match) {
      offers.push(buildTournamentOffer(gameState, pending.tournament, pending.bracket, pending.round, pending.match, fighterId || playerEntityId(gameState)));
      seasonState.activeTournamentId = pending.tournament.id;
      seasonState.playerTournamentId = pending.tournament.id;
    }
    return offers;
  }

  function recordPlayerFightResult(gameState, payload) {
    var seasonState = ensureState(gameState);
    var tournament = payload && payload.tournamentId ? seasonState.tournamentsById[payload.tournamentId] : null;
    var bracket = tournament && tournament.bracketId ? seasonState.bracketsById[tournament.bracketId] : null;
    var round;
    var match;
    var i;
    var playerId = playerEntityId(gameState);
    var opponentId;
    var winnerId;
    var loserId;
    var method;
    if (!tournament || !bracket) {
      return null;
    }
    round = currentRound(bracket, tournament.currentRoundIndex);
    if (!round) {
      return null;
    }
    for (i = 0; i < round.matches.length; i += 1) {
      if (round.matches[i].id === payload.matchId || fighterIdInMatch(round.matches[i], playerId)) {
        match = round.matches[i];
        break;
      }
    }
    if (!match || match.status === "resolved") {
      return null;
    }
    opponentId = match.fighterAId === playerId ? match.fighterBId : match.fighterAId;
    method = payload.method || "Dec";
    if (payload.result === "win") {
      winnerId = playerId;
      loserId = opponentId;
    } else if (payload.result === "loss") {
      winnerId = opponentId;
      loserId = playerId;
    } else {
      winnerId = fighterSeasonScore(gameState, seasonState, playerId) >= fighterSeasonScore(gameState, seasonState, opponentId) ? playerId : opponentId;
      loserId = winnerId === playerId ? opponentId : playerId;
    }
    match.winnerId = winnerId;
    match.loserId = loserId;
    match.status = "resolved";
    match.method = method;
    applyRoundOutcome(gameState, seasonState, tournament, winnerId, loserId, method, "player");
    if (roundResolved(round)) {
      if (tournament.currentRoundIndex < bracket.rounds.length - 1) {
        fillNextRound(bracket, tournament.currentRoundIndex);
        resolveByeMatches(bracket);
        tournament.currentRoundIndex += 1;
        seasonState.pendingNotices.push({
          type: "career",
          tone: payload.result === "loss" ? "bad" : "good",
          text: payload.result === "loss" ? ("Ты вылетел из '" + tournament.label + "'.") : ("Ты прошёл дальше: '" + tournament.label + "', " + bracket.rounds[tournament.currentRoundIndex].label + "."),
          biography: payload.result === "loss" ? ("Вылетает из '" + tournament.label + "'.") : ("Проходит дальше в турнире '" + tournament.label + "'.")
        });
      } else {
        finalizeTournament(gameState, seasonState, tournament, bracket);
      }
    }
    updateNationalRankings(gameState, seasonState);
    updateTeamSelections(gameState, seasonState);
    copyCompetitionAdapters(gameState);
    return { tournamentId: tournament.id, winnerId: winnerId, loserId: loserId, status: tournament.status };
  }

  function getTournamentById(gameState, tournamentId) {
    var seasonState = ensureState(gameState);
    return tournamentId ? seasonState.tournamentsById[tournamentId] || null : null;
  }

  function getBracketByTournamentId(gameState, tournamentId) {
    var tournament = getTournamentById(gameState, tournamentId);
    var seasonState = seasonRoot(gameState);
    return tournament && tournament.bracketId ? seasonState.bracketsById[tournament.bracketId] || null : null;
  }

  function selectTournament(gameState, tournamentId) {
    var seasonState = ensureState(gameState);
    seasonState.selectedTournamentId = tournamentId || "";
    return seasonState.selectedTournamentId;
  }

  function drainNotices(gameState) {
    var seasonState = seasonRoot(gameState);
    var notices = clone(seasonState.pendingNotices || []);
    seasonState.pendingNotices = [];
    return notices;
  }

  function buildPlayerSummary(gameState, fighterId) {
    var seasonState = ensureState(gameState);
    var fighter = fighterEntity(gameState, fighterId || playerEntityId(gameState));
    return {
      seasonState: seasonState,
      fighter: fighter,
      rankingPosition: countryRankingPosition(seasonState, fighterCountry(fighter), fighter ? fighter.id : ""),
      ranking: seasonState.nationalRankingByCountry[fighterCountry(fighter)] || [],
      currentTournament: getCurrentTournament(gameState),
      nextEligibilityText: getNextEligibilityHint(gameState, fighter ? fighter.id : "")
    };
  }

  return {
    buildDefaultSeasonState: buildDefaultSeasonState,
    ensureState: ensureState,
    registerPlayer: registerPlayer,
    listPlayerTournamentOptions: listPlayerTournamentOptions,
    getNextEligibilityHint: getNextEligibilityHint,
    getCurrentTournament: getCurrentTournament,
    buildPlayerFightOffers: buildPlayerFightOffers,
    recordPlayerFightResult: recordPlayerFightResult,
    getTournamentById: getTournamentById,
    getBracketByTournamentId: getBracketByTournamentId,
    selectTournament: selectTournament,
    drainNotices: drainNotices,
    buildPlayerSummary: buildPlayerSummary
  };
}());
