var WorldStoryEngine = (function () {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function stableId(prefix, parts) {
    if (typeof WorldSimState !== "undefined" && WorldSimState.stableId) {
      return WorldSimState.stableId(prefix, parts);
    }
    return prefix + "_" + String(parts instanceof Array ? parts.join("_") : parts);
  }

  function arrayHas(list, value) {
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

  function rosterRoot(gameState) {
    return gameState && gameState.rosterState ? gameState.rosterState : null;
  }

  function organizationRoot(gameState) {
    return gameState && gameState.organizationState ? gameState.organizationState : null;
  }

  function competitionRoot(gameState) {
    return gameState && gameState.competitionState ? gameState.competitionState : null;
  }

  function narrativeRoot(gameState) {
    if (!gameState.narrativeState || typeof gameState.narrativeState !== "object") {
      gameState.narrativeState = { id: "narrative_state_main" };
    }
    if (!(gameState.narrativeState.worldMediaIds instanceof Array)) { gameState.narrativeState.worldMediaIds = []; }
    if (!gameState.narrativeState.worldMediaById || typeof gameState.narrativeState.worldMediaById !== "object") { gameState.narrativeState.worldMediaById = {}; }
    if (!(gameState.narrativeState.worldLegendIds instanceof Array)) { gameState.narrativeState.worldLegendIds = []; }
    if (!gameState.narrativeState.worldLegendsById || typeof gameState.narrativeState.worldLegendsById !== "object") { gameState.narrativeState.worldLegendsById = {}; }
    if (!gameState.narrativeState.teamHistoryByCountryId || typeof gameState.narrativeState.teamHistoryByCountryId !== "object") { gameState.narrativeState.teamHistoryByCountryId = {}; }
    if (!gameState.narrativeState.titleHistoryByOrganizationId || typeof gameState.narrativeState.titleHistoryByOrganizationId !== "object") { gameState.narrativeState.titleHistoryByOrganizationId = {}; }
    if (!gameState.narrativeState.tournamentHistoryById || typeof gameState.narrativeState.tournamentHistoryById !== "object") { gameState.narrativeState.tournamentHistoryById = {}; }
    if (!gameState.narrativeState.streetHistoryByCountryId || typeof gameState.narrativeState.streetHistoryByCountryId !== "object") { gameState.narrativeState.streetHistoryByCountryId = {}; }
    return gameState.narrativeState;
  }

  function getCountryName(countryId) {
    var country = typeof ContentLoader !== "undefined" && ContentLoader.getCountry ? ContentLoader.getCountry(countryId || "") : null;
    return country && country.name ? country.name : (countryId || "");
  }

  function getFighter(gameState, fighterId) {
    var roster = rosterRoot(gameState);
    return roster && roster.fightersById ? roster.fightersById[fighterId] || null : null;
  }

  function playerEntityId(gameState) {
    return gameState && gameState.playerState ? gameState.playerState.fighterEntityId || "fighter_player_main" : "fighter_player_main";
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

  function fighterGymName(gameState, fighter) {
    var roster = rosterRoot(gameState);
    var gym = fighter && roster && roster.gymsById ? roster.gymsById[fighter.currentGymId || fighter.gymId || ""] : null;
    return gym && gym.name ? gym.name : "";
  }

  function fighterTotalWins(fighter) {
    var recordWins = fighter && fighter.record ? fighter.record.wins || 0 : 0;
    var proWins = fighter && fighter.proRecord ? fighter.proRecord.wins || 0 : 0;
    return Math.max(recordWins, proWins);
  }

  function worldMediaTemplates() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listWorldMediaTemplates ? ContentLoader.listWorldMediaTemplates() : [];
  }

  function worldLegendArchetypes() {
    return typeof ContentLoader !== "undefined" && ContentLoader.listWorldLegendArchetypes ? ContentLoader.listWorldLegendArchetypes() : [];
  }

  function pickTemplate(filters) {
    var templates = worldMediaTemplates();
    var i;
    var template;
    for (i = 0; i < templates.length; i += 1) {
      template = templates[i];
      if (!template || (filters.type && template.type !== filters.type)) {
        continue;
      }
      if (filters.status && template.status !== filters.status) {
        continue;
      }
      if (filters.tournamentTypeId && template.tournamentTypeId !== filters.tournamentTypeId) {
        continue;
      }
      if (filters.placement && template.placement !== filters.placement) {
        continue;
      }
      if (filters.trackId && template.trackId !== filters.trackId) {
        continue;
      }
      if (filters.requiredHook && template.requiredHook !== filters.requiredHook) {
        continue;
      }
      if (filters.statusId && template.statusId !== filters.statusId) {
        continue;
      }
      return template;
    }
    return null;
  }

  function replaceTokens(text, tokens) {
    var output = String(text || "");
    var key;
    for (key in tokens) {
      if (tokens.hasOwnProperty(key)) {
        output = output.split("{" + key + "}").join(tokens[key] == null ? "" : String(tokens[key]));
      }
    }
    return output;
  }

  function createWorldMediaEntry(template, entryId, tokens, extra) {
    var source = extra || {};
    if (!template || !entryId) {
      return null;
    }
    return {
      id: entryId,
      week: typeof source.week === "number" ? source.week : 0,
      type: template.type || "",
      tone: template.tone || "warn",
      title: replaceTokens(template.titles && template.titles.length ? template.titles[0] : "", tokens || {}),
      fighterId: source.fighterId || "",
      countryId: source.countryId || "",
      organizationId: source.organizationId || "",
      tournamentId: source.tournamentId || "",
      tags: clone(source.tags || [])
    };
  }

  function resetCollections(narrative) {
    narrative.worldMediaIds = [];
    narrative.worldMediaById = {};
    narrative.worldLegendIds = [];
    narrative.worldLegendsById = {};
    narrative.teamHistoryByCountryId = {};
    narrative.titleHistoryByOrganizationId = {};
    narrative.tournamentHistoryById = {};
    narrative.streetHistoryByCountryId = {};
  }

  function pushMedia(narrative, entry) {
    if (!entry || !entry.id || narrative.worldMediaById[entry.id]) {
      return;
    }
    narrative.worldMediaById[entry.id] = entry;
    narrative.worldMediaIds.push(entry.id);
  }

  function pushTeamHistory(narrative, countryId, entry) {
    if (!narrative.teamHistoryByCountryId[countryId]) {
      narrative.teamHistoryByCountryId[countryId] = [];
    }
    narrative.teamHistoryByCountryId[countryId].push(entry);
  }

  function pushStreetHistory(narrative, countryId, entry) {
    if (!narrative.streetHistoryByCountryId[countryId]) {
      narrative.streetHistoryByCountryId[countryId] = [];
    }
    narrative.streetHistoryByCountryId[countryId].push(entry);
  }

  function seasonRoot(gameState) {
    return competitionRoot(gameState) ? competitionRoot(gameState).amateurSeason || null : null;
  }

  function pushTitleHistory(narrative, organizationId, entry) {
    if (!narrative.titleHistoryByOrganizationId[organizationId]) {
      narrative.titleHistoryByOrganizationId[organizationId] = [];
    }
    narrative.titleHistoryByOrganizationId[organizationId].push(entry);
  }

  function teamSelectionHistory(gameState) {
    var season = seasonRoot(gameState);
    return season && season.teamSelectionHistory instanceof Array ? season.teamSelectionHistory : [];
  }

  function buildTeamHistory(gameState, narrative) {
    var history = teamSelectionHistory(gameState);
    var i;
    var raw;
    var fighter;
    var entry;
    var template;
    for (i = 0; i < history.length; i += 1) {
      raw = history[i];
      if (!raw || !raw.id) {
        continue;
      }
      fighter = getFighter(gameState, raw.fighterId || "");
      entry = {
        id: raw.id,
        week: typeof raw.week === "number" ? raw.week : 0,
        fighterId: raw.fighterId || "",
        fighterName: fighterName(fighter),
        countryId: raw.countryId || "",
        countryName: getCountryName(raw.countryId || ""),
        teamId: raw.teamId || "",
        previousStatus: raw.previousStatus || "none",
        newStatus: raw.newStatus || "none"
      };
      pushTeamHistory(narrative, entry.countryId || "unknown", entry);
      if (entry.newStatus === "active" || entry.newStatus === "reserve" || entry.newStatus === "dropped") {
        template = pickTemplate({
          type: "team_status",
          status: entry.newStatus
        });
        pushMedia(narrative, createWorldMediaEntry(template, stableId("world_media_team", [raw.id]), {
          fighter: entry.fighterName,
          country: entry.countryName
        }, {
          week: entry.week,
          fighterId: entry.fighterId,
          countryId: entry.countryId,
          tags: ["team_status", entry.newStatus]
        }));
      }
    }
  }

  function buildTournamentHistory(gameState, narrative) {
    var season = seasonRoot(gameState);
    var tournamentIds;
    var i;
    var tournament;
    var winner;
    var gold;
    var silver;
    var bronze;
    var j;
    var entry;
    var template;
    if (!season || !season.tournamentsById) {
      return;
    }
    tournamentIds = season.tournamentIds instanceof Array ? season.tournamentIds : [];
    for (i = 0; i < tournamentIds.length; i += 1) {
      tournament = season.tournamentsById[tournamentIds[i]];
      if (!tournament) {
        continue;
      }
      winner = getFighter(gameState, tournament.winnerId || "");
      gold = getFighter(gameState, tournament.medals ? tournament.medals.gold || "" : "");
      silver = getFighter(gameState, tournament.medals ? tournament.medals.silver || "" : "");
      bronze = [];
      if (tournament.medals && tournament.medals.bronze instanceof Array) {
        for (j = 0; j < tournament.medals.bronze.length; j += 1) {
          bronze.push(fighterName(getFighter(gameState, tournament.medals.bronze[j])));
        }
      }
      entry = {
        id: tournament.id,
        week: tournament.resultLog instanceof Array && tournament.resultLog.length ? tournament.resultLog[0].week || 0 : 0,
        label: tournament.label || tournament.id,
        tournamentTypeId: tournament.tournamentTypeId || "",
        countryId: tournament.country || "",
        countryName: getCountryName(tournament.country || ""),
        status: tournament.status || "",
        winnerId: tournament.winnerId || "",
        winnerName: fighterName(winner),
        medals: {
          gold: fighterName(gold),
          silver: fighterName(silver),
          bronze: bronze
        },
        participantCount: tournament.participantIds instanceof Array ? tournament.participantIds.length : 0
      };
      narrative.tournamentHistoryById[entry.id] = entry;
      if (entry.status !== "completed") {
        continue;
      }
      if (entry.winnerId) {
        template = pickTemplate({
          type: "tournament_result",
          tournamentTypeId: entry.tournamentTypeId,
          placement: "champion"
        });
        pushMedia(narrative, createWorldMediaEntry(template, stableId("world_media_tournament", [entry.id, "champion", entry.winnerId]), {
          fighter: entry.winnerName,
          country: getCountryName(winner ? winner.country : entry.countryId),
          tournament: entry.label
        }, {
          week: entry.week,
          fighterId: entry.winnerId,
          countryId: winner ? winner.country : entry.countryId,
          tournamentId: entry.id,
          tags: ["tournament", entry.tournamentTypeId, "champion"]
        }));
      }
      if (entry.tournamentTypeId === "olympics") {
        if (tournament.participantIds instanceof Array) {
          for (j = 0; j < tournament.participantIds.length; j += 1) {
            var participant = getFighter(gameState, tournament.participantIds[j]);
            var placement = "participant";
            if (tournament.medals && tournament.medals.gold === tournament.participantIds[j]) {
              placement = "champion";
            } else if (tournament.medals && (tournament.medals.silver === tournament.participantIds[j] || arrayHas(tournament.medals.bronze || [], tournament.participantIds[j]))) {
              placement = "medalist";
            }
            template = pickTemplate({
              type: "tournament_result",
              tournamentTypeId: "olympics",
              placement: placement
            });
            pushMedia(narrative, createWorldMediaEntry(template, stableId("world_media_olympics", [entry.id, placement, tournament.participantIds[j]]), {
              fighter: fighterName(participant),
              country: getCountryName(participant ? participant.country : entry.countryId),
              tournament: entry.label
            }, {
              week: entry.week,
              fighterId: tournament.participantIds[j],
              countryId: participant ? participant.country : entry.countryId,
              tournamentId: entry.id,
              tags: ["olympics", placement]
            }));
          }
        }
      }
    }
  }

  function buildTitleHistory(gameState, narrative) {
    var orgState = organizationRoot(gameState);
    var ids;
    var i;
    var j;
    var org;
    var raw;
    var fighter;
    var entry;
    var template;
    if (!orgState || !(orgState.organizationIds instanceof Array)) {
      return;
    }
    ids = orgState.organizationIds;
    for (i = 0; i < ids.length; i += 1) {
      org = orgState.organizationsById[ids[i]];
      if (!org || !(org.titleHistory instanceof Array) || !org.titleHistory.length) {
        continue;
      }
      for (j = 0; j < org.titleHistory.length; j += 1) {
        raw = org.titleHistory[j];
        fighter = getFighter(gameState, raw.championId || "");
        entry = {
          id: raw.id,
          week: raw.week || 0,
          organizationId: org.id,
          organizationName: org.name || org.id,
          championId: raw.championId || "",
          championName: fighterName(fighter),
          opponentId: raw.opponentId || "",
          previousChampionId: raw.previousChampionId || "",
          type: raw.type || "",
          defenseCount: raw.defenseCount || 0
        };
        pushTitleHistory(narrative, org.id, entry);
        if (entry.type !== "seeded" && entry.type !== "defense" && entry.championId) {
          template = pickTemplate({ type: "pro_title" });
          pushMedia(narrative, createWorldMediaEntry(template, stableId("world_media_title", [entry.id]), {
            fighter: entry.championName,
            organization: entry.organizationName
          }, {
            week: entry.week,
            fighterId: entry.championId,
            organizationId: entry.organizationId,
            tags: ["pro_title", entry.type || "change"]
          }));
        }
      }
    }
  }

  function buildStreetHistory(gameState, narrative) {
    var roster = rosterRoot(gameState);
    var i;
    var fighter;
    var currentStatusId;
    var entry;
    var template;
    if (!roster || !(roster.fighterIds instanceof Array)) {
      return;
    }
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      fighter = roster.fightersById[roster.fighterIds[i]];
      if (!fighter) {
        continue;
      }
      currentStatusId = fighter.streetData && fighter.streetData.currentStatusId ? fighter.streetData.currentStatusId : "";
      if (!(fighter.streetRating >= 90 || (fighter.streetData && fighter.streetData.undergroundTitles instanceof Array && fighter.streetData.undergroundTitles.length) || currentStatusId === "street_legend" || arrayHas(fighter.worldHistoryHooks || [], "left_amateur_path_for_streets"))) {
        continue;
      }
      entry = {
        id: stableId("street_history", [fighter.id, currentStatusId || fighter.streetRating || 0]),
        fighterId: fighter.id,
        fighterName: fighterName(fighter),
        countryId: fighter.country || "",
        countryName: getCountryName(fighter.country || ""),
        streetRating: fighter.streetRating || 0,
        statusId: currentStatusId || "",
        undergroundTitles: fighter.streetData && fighter.streetData.undergroundTitles instanceof Array ? clone(fighter.streetData.undergroundTitles) : [],
        hooks: clone(fighter.worldHistoryHooks || [])
      };
      pushStreetHistory(narrative, entry.countryId || "unknown", entry);
      if (currentStatusId === "street_legend") {
        template = pickTemplate({
          type: "street_status",
          statusId: "street_legend"
        });
        pushMedia(narrative, createWorldMediaEntry(template, stableId("world_media_street", [fighter.id, currentStatusId]), {
          fighter: entry.fighterName,
          country: entry.countryName
        }, {
          week: fighter.lastTrackTransitionWeek || 0,
          fighterId: fighter.id,
          countryId: entry.countryId,
          tags: ["street_legend"]
        }));
      }
    }
  }

  function buildTrackTransitionMedia(gameState, narrative) {
    var roster = rosterRoot(gameState);
    var i;
    var fighter;
    var template;
    if (!roster || !(roster.fighterIds instanceof Array)) {
      return;
    }
    for (i = 0; i < roster.fighterIds.length; i += 1) {
      fighter = roster.fightersById[roster.fighterIds[i]];
      if (!fighter || !fighter.lastTrackTransitionWeek) {
        continue;
      }
      if (arrayHas(fighter.worldHistoryHooks || [], "former_national_team_member") && fighterTrack(fighter) === "pro") {
        template = pickTemplate({
          type: "track_transition",
          trackId: "pro",
          requiredHook: "former_national_team_member"
        });
        pushMedia(narrative, createWorldMediaEntry(template, stableId("world_media_track", [fighter.id, "pro", fighter.lastTrackTransitionWeek]), {
          fighter: fighterName(fighter)
        }, {
          week: fighter.lastTrackTransitionWeek,
          fighterId: fighter.id,
          countryId: fighter.country || "",
          tags: ["track_transition", "pro"]
        }));
      }
      if (arrayHas(fighter.worldHistoryHooks || [], "former_national_team_member") && fighterTrack(fighter) === "street") {
        template = pickTemplate({
          type: "track_transition",
          trackId: "street",
          requiredHook: "former_national_team_member"
        });
        pushMedia(narrative, createWorldMediaEntry(template, stableId("world_media_track", [fighter.id, "street", fighter.lastTrackTransitionWeek]), {
          fighter: fighterName(fighter)
        }, {
          week: fighter.lastTrackTransitionWeek,
          fighterId: fighter.id,
          countryId: fighter.country || "",
          tags: ["track_transition", "street"]
        }));
      }
    }
  }

  function countTeamSelections(gameState, fighterId) {
    var history = teamSelectionHistory(gameState);
    var i;
    var total = 0;
    for (i = 0; i < history.length; i += 1) {
      if (history[i] && history[i].fighterId === fighterId && (history[i].newStatus === "active" || history[i].newStatus === "reserve")) {
        total += 1;
      }
    }
    return total;
  }

  function countOlympicEntries(gameState, fighterId) {
    var season = seasonRoot(gameState);
    var tournamentIds;
    var i;
    var tournament;
    var total = 0;
    if (!season || !season.tournamentsById) {
      return 0;
    }
    tournamentIds = season.tournamentIds instanceof Array ? season.tournamentIds : [];
    for (i = 0; i < tournamentIds.length; i += 1) {
      tournament = season.tournamentsById[tournamentIds[i]];
      if (tournament && tournament.tournamentTypeId === "olympics" && tournament.participantIds instanceof Array && arrayHas(tournament.participantIds, fighterId)) {
        total += 1;
      }
    }
    return total;
  }

  function countProTitles(fighter) {
    var history = fighter && fighter.titleHistory instanceof Array ? fighter.titleHistory : [];
    var i;
    var total = 0;
    for (i = 0; i < history.length; i += 1) {
      if (history[i] && history[i].status === "champion") {
        total += 1;
      }
    }
    return total;
  }

  function fighterMatchesArchetype(gameState, fighter, archetype) {
    var conditions = archetype && archetype.conditions ? archetype.conditions : {};
    if (!fighter || !archetype) {
      return false;
    }
    if (typeof conditions.minFame === "number" && (fighter.fame || 0) < conditions.minFame) {
      return false;
    }
    if (typeof conditions.minTotalWins === "number" && fighterTotalWins(fighter) < conditions.minTotalWins) {
      return false;
    }
    if (typeof conditions.minNationalTeamSelections === "number" && countTeamSelections(gameState, fighter.id) < conditions.minNationalTeamSelections) {
      return false;
    }
    if (conditions.requiresHook && !arrayHas(fighter.worldHistoryHooks || [], conditions.requiresHook)) {
      return false;
    }
    if (typeof conditions.minOlympicEntries === "number" && countOlympicEntries(gameState, fighter.id) < conditions.minOlympicEntries) {
      return false;
    }
    if (typeof conditions.minStreetRating === "number" && (fighter.streetRating || 0) < conditions.minStreetRating) {
      return false;
    }
    if (typeof conditions.minUndergroundTitles === "number") {
      if (!(fighter.streetData && fighter.streetData.undergroundTitles instanceof Array) || fighter.streetData.undergroundTitles.length < conditions.minUndergroundTitles) {
        return false;
      }
    }
    if (typeof conditions.minProTitles === "number" && countProTitles(fighter) < conditions.minProTitles) {
      return false;
    }
    return true;
  }

  function buildWorldLegends(gameState, narrative) {
    var roster = rosterRoot(gameState);
    var archetypes = worldLegendArchetypes();
    var ids;
    var i;
    var j;
    var fighter;
    var archetype;
    var legend;
    var playerId = playerEntityId(gameState);
    if (!roster || !(roster.fighterIds instanceof Array)) {
      return;
    }
    ids = roster.fighterIds.slice(0);
    for (i = 0; i < ids.length; i += 1) {
      fighter = roster.fightersById[ids[i]];
      if (!fighter || fighter.id === playerId) {
        continue;
      }
      for (j = 0; j < archetypes.length; j += 1) {
        archetype = archetypes[j];
        if (!fighterMatchesArchetype(gameState, fighter, archetype)) {
          continue;
        }
        legend = {
          id: stableId("world_legend", [archetype.id, fighter.id]),
          fighterId: fighter.id,
          fighterName: fighterName(fighter),
          countryId: fighter.country || "",
          countryName: getCountryName(fighter.country || ""),
          label: archetype.label || "",
          categoryId: archetype.categoryId || "",
          categoryLabel: archetype.categoryLabel || "",
          summary: replaceTokens(archetype.summary || "", { fighter: fighterName(fighter) }),
          fame: fighter.fame || 0,
          trackId: fighterTrack(fighter),
          amateurRank: fighter.amateurRank || "",
          streetRating: fighter.streetRating || 0,
          proTitles: countProTitles(fighter),
          nationalTeamSelections: countTeamSelections(gameState, fighter.id),
          olympicEntries: countOlympicEntries(gameState, fighter.id),
          gymName: fighterGymName(gameState, fighter),
          hooks: clone(fighter.worldHistoryHooks || [])
        };
        narrative.worldLegendsById[legend.id] = legend;
        narrative.worldLegendIds.push(legend.id);
      }
    }
  }

  function sortCollections(narrative) {
    narrative.worldMediaIds.sort(function (leftId, rightId) {
      var left = narrative.worldMediaById[leftId];
      var right = narrative.worldMediaById[rightId];
      return (right && right.week ? right.week : 0) - (left && left.week ? left.week : 0);
    });
    if (narrative.worldMediaIds.length > 160) {
      narrative.worldMediaIds = narrative.worldMediaIds.slice(0, 160);
    }
    narrative.worldLegendIds.sort(function (leftId, rightId) {
      var left = narrative.worldLegendsById[leftId];
      var right = narrative.worldLegendsById[rightId];
      var leftScore = left ? ((left.proTitles || 0) * 40 + (left.nationalTeamSelections || 0) * 16 + (left.olympicEntries || 0) * 24 + (left.streetRating || 0) + (left.fame || 0)) : 0;
      var rightScore = right ? ((right.proTitles || 0) * 40 + (right.nationalTeamSelections || 0) * 16 + (right.olympicEntries || 0) * 24 + (right.streetRating || 0) + (right.fame || 0)) : 0;
      return rightScore - leftScore;
    });
  }

  function rebuildWorldStory(gameState) {
    var narrative = narrativeRoot(gameState);
    resetCollections(narrative);
    buildTeamHistory(gameState, narrative);
    buildTournamentHistory(gameState, narrative);
    buildTitleHistory(gameState, narrative);
    buildStreetHistory(gameState, narrative);
    buildTrackTransitionMedia(gameState, narrative);
    buildWorldLegends(gameState, narrative);
    sortCollections(narrative);
    return narrative;
  }

  function listWorldMedia(gameState) {
    var narrative = narrativeRoot(gameState);
    var result = [];
    var i;
    for (i = 0; i < narrative.worldMediaIds.length; i += 1) {
      if (narrative.worldMediaById[narrative.worldMediaIds[i]]) {
        result.push(clone(narrative.worldMediaById[narrative.worldMediaIds[i]]));
      }
    }
    return result;
  }

  function listWorldLegends(gameState) {
    var narrative = narrativeRoot(gameState);
    var result = [];
    var i;
    for (i = 0; i < narrative.worldLegendIds.length; i += 1) {
      if (narrative.worldLegendsById[narrative.worldLegendIds[i]]) {
        result.push(clone(narrative.worldLegendsById[narrative.worldLegendIds[i]]));
      }
    }
    return result;
  }

  function getWorldLegendById(gameState, legendId) {
    return clone(narrativeRoot(gameState).worldLegendsById[legendId] || null);
  }

  function getTeamHistory(gameState, countryId) {
    return clone(narrativeRoot(gameState).teamHistoryByCountryId[countryId || ""] || []);
  }

  function getTitleHistories(gameState) {
    return clone(narrativeRoot(gameState).titleHistoryByOrganizationId || {});
  }

  function getTournamentHistories(gameState) {
    return clone(narrativeRoot(gameState).tournamentHistoryById || {});
  }

  function getStreetHistory(gameState, countryId) {
    return clone(narrativeRoot(gameState).streetHistoryByCountryId[countryId || ""] || []);
  }

  function ensureState(gameState) {
    return narrativeRoot(gameState);
  }

  function syncWorldStory(gameState) {
    return rebuildWorldStory(gameState);
  }

  return {
    ensureState: ensureState,
    syncWorldStory: syncWorldStory,
    listWorldMedia: listWorldMedia,
    listWorldLegends: listWorldLegends,
    getWorldLegendById: getWorldLegendById,
    getTeamHistory: getTeamHistory,
    getTitleHistories: getTitleHistories,
    getTournamentHistories: getTournamentHistories,
    getStreetHistory: getStreetHistory
  };
}());
