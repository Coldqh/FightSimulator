var ReputationEngine = (function () {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function hasValue(list, value) {
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

  function matchList(value, allowed) {
    var i;
    if (!(allowed instanceof Array) || !allowed.length) {
      return true;
    }
    for (i = 0; i < allowed.length; i += 1) {
      if (allowed[i] === value) {
        return true;
      }
    }
    return false;
  }

  function summaryFromGameState(gameState) {
    var player = gameState && gameState.player ? gameState.player : {};
    var record = player.record || {};
    var resources = player.resources || {};
    var conditions = player.conditions || {};
    var life = player.life || {};
    var street = player.street || {};
    var pro = player.pro || {};
    var amateur = player.amateur || {};
    var development = player.development || {};
    var profile = player.profile || {};
    var biography = player.biography || {};
    var facts = biography.facts || {};
    var countriesVisited = facts.countriesVisited instanceof Array ? facts.countriesVisited : [];
    var styleProgress = development.styleProgress || {};
    var streetHistory = street.history instanceof Array ? street.history : [];
    var season = gameState && gameState.competitionState ? gameState.competitionState.amateurSeason || null : null;
    var fighterId = gameState && gameState.playerState ? gameState.playerState.fighterEntityId || "fighter_player_main" : "fighter_player_main";
    var teamHistory = season && season.teamSelectionHistory instanceof Array ? season.teamSelectionHistory : [];
    var tournamentsById = season && season.tournamentsById ? season.tournamentsById : {};
    var tournamentIds = season && season.tournamentIds instanceof Array ? season.tournamentIds : [];
    var titleHistory = pro.titleHistory instanceof Array ? pro.titleHistory : [];
    var streetWins = 0;
    var topStyleId = "outboxer";
    var topStyleValue = -1;
    var teamSelections = 0;
    var olympicEntries = 0;
    var olympicMedals = 0;
    var olympicTitles = 0;
    var amateurNationalTitles = 0;
    var amateurContinentalTitles = 0;
    var amateurWorldTitles = 0;
    var proTitles = 0;
    var styleKey;
    var tournament;
    var i;

    for (i = 0; i < streetHistory.length; i += 1) {
      if (streetHistory[i] && streetHistory[i].result === "win") {
        streetWins += 1;
      }
    }
    for (styleKey in styleProgress) {
      if (styleProgress.hasOwnProperty(styleKey) && typeof styleProgress[styleKey] === "number" && styleProgress[styleKey] > topStyleValue) {
        topStyleValue = styleProgress[styleKey];
        topStyleId = styleKey;
      }
    }
    for (i = 0; i < teamHistory.length; i += 1) {
      if (teamHistory[i] && teamHistory[i].fighterId === fighterId && (teamHistory[i].newStatus === "active" || teamHistory[i].newStatus === "reserve")) {
        teamSelections += 1;
      }
    }
    for (i = 0; i < tournamentIds.length; i += 1) {
      tournament = tournamentsById[tournamentIds[i]];
      if (!tournament || !(tournament.participantIds instanceof Array) || !hasValue(tournament.participantIds, fighterId)) {
        continue;
      }
      if (tournament.tournamentTypeId === "olympics") {
        olympicEntries += 1;
        if (tournament.medals && tournament.medals.gold === fighterId) {
          olympicMedals += 1;
          olympicTitles += 1;
        } else if (tournament.medals && (tournament.medals.silver === fighterId || hasValue(tournament.medals.bronze || [], fighterId))) {
          olympicMedals += 1;
        }
      }
      if (tournament.tournamentTypeId === "national_championship" && tournament.winnerId === fighterId) {
        amateurNationalTitles += 1;
      }
      if (tournament.tournamentTypeId === "continental_championship" && tournament.winnerId === fighterId) {
        amateurContinentalTitles += 1;
      }
      if (tournament.tournamentTypeId === "world_championship" && tournament.winnerId === fighterId) {
        amateurWorldTitles += 1;
      }
    }
    for (i = 0; i < titleHistory.length; i += 1) {
      if (titleHistory[i] && titleHistory[i].status === "champion") {
        proTitles += 1;
      }
    }

    return {
      name: profile.name || "",
      homeCountry: profile.homeCountry || "",
      currentCountry: profile.currentCountry || "",
      money: typeof resources.money === "number" ? resources.money : 0,
      health: typeof resources.health === "number" ? resources.health : 100,
      stress: typeof resources.stress === "number" ? resources.stress : 0,
      fame: typeof resources.fame === "number" ? resources.fame : 0,
      wins: typeof record.wins === "number" ? record.wins : 0,
      losses: typeof record.losses === "number" ? record.losses : 0,
      kos: typeof record.kos === "number" ? record.kos : 0,
      deathsCaused: typeof record.deathsCaused === "number" ? record.deathsCaused : 0,
      fatigue: typeof conditions.fatigue === "number" ? conditions.fatigue : 0,
      wear: typeof conditions.wear === "number" ? conditions.wear : 0,
      morale: typeof conditions.morale === "number" ? conditions.morale : 50,
      support: typeof life.support === "number" ? life.support : 50,
      currentTrack: gameState && gameState.playerState ? gameState.playerState.currentTrackId || "street" : "street",
      streetRating: typeof street.streetRating === "number" ? street.streetRating : 0,
      undergroundTitlesCount: street.undergroundTitles instanceof Array ? street.undergroundTitles.length : 0,
      streetFights: streetHistory.length,
      streetWins: streetWins,
      debtWeeks: typeof life.debtWeeks === "number" ? life.debtWeeks : 0,
      weeks: gameState && gameState.career ? (gameState.career.week || 1) : 1,
      countriesVisited: countriesVisited,
      countriesVisitedCount: countriesVisited.length,
      travelCount: typeof facts.travelCount === "number" ? facts.travelCount : 0,
      scandals: typeof facts.scandals === "number" ? facts.scandals : 0,
      interviews: typeof facts.interviews === "number" ? facts.interviews : 0,
      homeWins: typeof facts.homeWins === "number" ? facts.homeWins : 0,
      awayWins: typeof facts.awayWins === "number" ? facts.awayWins : 0,
      upsetWins: typeof facts.upsetWins === "number" ? facts.upsetWins : 0,
      rematches: typeof facts.rematches === "number" ? facts.rematches : 0,
      rivalFights: typeof facts.rivalFights === "number" ? facts.rivalFights : 0,
      rivalWins: typeof facts.rivalWins === "number" ? facts.rivalWins : 0,
      rivalLosses: typeof facts.rivalLosses === "number" ? facts.rivalLosses : 0,
      comebackWins: typeof facts.comebackWins === "number" ? facts.comebackWins : 0,
      currentStreak: typeof facts.currentStreak === "number" ? facts.currentStreak : 0,
      bestStreak: typeof facts.bestStreak === "number" ? facts.bestStreak : 0,
      trainerChanges: typeof facts.trainerChanges === "number" ? facts.trainerChanges : 0,
      contractBreaks: typeof facts.contractBreaks === "number" ? facts.contractBreaks : 0,
      fights: (typeof record.wins === "number" ? record.wins : 0) + (typeof record.losses === "number" ? record.losses : 0),
      chronicInjuries: typeof facts.chronicInjuries === "number" ? facts.chronicInjuries : 0,
      bioFlags: biography.flags instanceof Array ? biography.flags : [],
      styleId: topStyleId,
      amateurRankId: amateur.rankId || "",
      amateurScore: typeof amateur.score === "number" ? amateur.score : 0,
      nationalTeamStatus: amateur.nationalTeamStatus || "none",
      nationalTeamSelections: teamSelections,
      olympicEntries: olympicEntries,
      olympicMedals: olympicMedals,
      olympicTitles: olympicTitles,
      amateurNationalTitles: amateurNationalTitles,
      amateurContinentalTitles: amateurContinentalTitles,
      amateurWorldTitles: amateurWorldTitles,
      proTitles: proTitles,
      proChampionOrganizations: pro.championOrganizations instanceof Array ? pro.championOrganizations.length : 0,
      gymId: gameState && gameState.world && gameState.world.gymMembership ? gameState.world.gymMembership.gymId || "" : "",
      gymName: gameState && gameState.world && gameState.world.gymMembership ? gameState.world.gymMembership.name || "" : ""
    };
  }

  function templateMatches(template, summary, payload) {
    var data = payload || {};
    if (!template) {
      return false;
    }
    if (template.result && template.result !== data.result) {
      return false;
    }
    if (template.subtype && template.subtype !== data.subtype) {
      return false;
    }
    if (template.endingReason && template.endingReason !== data.endingReason) {
      return false;
    }
    if (template.methodContains && String(data.method || "").indexOf(template.methodContains) === -1) {
      return false;
    }
    if (template.requiresPayloadTag && !hasValue(data.tags || [], template.requiresPayloadTag)) {
      return false;
    }
    if (typeof template.minFame === "number" && summary.fame < template.minFame) {
      return false;
    }
    if (typeof template.maxFame === "number" && summary.fame > template.maxFame) {
      return false;
    }
    return true;
  }

  function tagMatches(tagDefinition, summary, extra) {
    var conditions = tagDefinition && tagDefinition.conditions ? tagDefinition.conditions : {};
    var winsOverLosses = summary.wins - summary.losses;
    var flags = summary.bioFlags || [];

    if (typeof conditions.minFame === "number" && summary.fame < conditions.minFame) { return false; }
    if (typeof conditions.maxFame === "number" && summary.fame > conditions.maxFame) { return false; }
    if (typeof conditions.minSupport === "number" && summary.support < conditions.minSupport) { return false; }
    if (typeof conditions.minMoney === "number" && summary.money < conditions.minMoney) { return false; }
    if (typeof conditions.minWins === "number" && summary.wins < conditions.minWins) { return false; }
    if (typeof conditions.maxLosses === "number" && summary.losses > conditions.maxLosses) { return false; }
    if (typeof conditions.minKos === "number" && summary.kos < conditions.minKos) { return false; }
    if (typeof conditions.minScandals === "number" && summary.scandals < conditions.minScandals) { return false; }
    if (typeof conditions.maxScandals === "number" && summary.scandals > conditions.maxScandals) { return false; }
    if (typeof conditions.minUpsetWins === "number" && summary.upsetWins < conditions.minUpsetWins) { return false; }
    if (typeof conditions.minHomeWins === "number" && summary.homeWins < conditions.minHomeWins) { return false; }
    if (typeof conditions.minCountriesVisited === "number" && summary.countriesVisitedCount < conditions.minCountriesVisited) { return false; }
    if (typeof conditions.minChronicInjuries === "number" && summary.chronicInjuries < conditions.minChronicInjuries) { return false; }
    if (typeof conditions.minStreetRating === "number" && summary.streetRating < conditions.minStreetRating) { return false; }
    if (typeof conditions.minStreetFights === "number" && summary.streetFights < conditions.minStreetFights) { return false; }
    if (typeof conditions.minStreetWins === "number" && summary.streetWins < conditions.minStreetWins) { return false; }
    if (typeof conditions.minUndergroundTitles === "number" && summary.undergroundTitlesCount < conditions.minUndergroundTitles) { return false; }
    if (typeof conditions.minFights === "number" && summary.fights < conditions.minFights) { return false; }
    if (typeof conditions.minNationalTeamSelections === "number" && summary.nationalTeamSelections < conditions.minNationalTeamSelections) { return false; }
    if (typeof conditions.minOlympicEntries === "number" && summary.olympicEntries < conditions.minOlympicEntries) { return false; }
    if (typeof conditions.minOlympicMedals === "number" && summary.olympicMedals < conditions.minOlympicMedals) { return false; }
    if (typeof conditions.minOlympicTitles === "number" && summary.olympicTitles < conditions.minOlympicTitles) { return false; }
    if (typeof conditions.minAmateurNationalTitles === "number" && summary.amateurNationalTitles < conditions.minAmateurNationalTitles) { return false; }
    if (typeof conditions.minAmateurContinentalTitles === "number" && summary.amateurContinentalTitles < conditions.minAmateurContinentalTitles) { return false; }
    if (typeof conditions.minAmateurWorldTitles === "number" && summary.amateurWorldTitles < conditions.minAmateurWorldTitles) { return false; }
    if (typeof conditions.minProTitles === "number" && summary.proTitles < conditions.minProTitles) { return false; }
    if (typeof conditions.maxWinsOverLosses === "number" && winsOverLosses > conditions.maxWinsOverLosses) { return false; }
    if (typeof conditions.minComebackWins === "number" && summary.comebackWins < conditions.minComebackWins) { return false; }
    if (conditions.requireCurrentTrack && summary.currentTrack !== conditions.requireCurrentTrack) { return false; }
    if (conditions.excludeCurrentTrack && summary.currentTrack === conditions.excludeCurrentTrack) { return false; }
    if (conditions.endingReasonIn && !matchList(extra && extra.endingReason, conditions.endingReasonIn)) { return false; }
    if (conditions.requiresFlag && !hasValue(flags, conditions.requiresFlag)) { return false; }
    if (conditions.requiresNationalTeamStatus && summary.nationalTeamStatus !== conditions.requiresNationalTeamStatus) { return false; }
    return true;
  }

  function replaceTokens(text, tokens) {
    var output = String(text || "");
    var key;
    for (key in tokens) {
      if (tokens.hasOwnProperty(key)) {
        output = output.replace(new RegExp("\\{" + key + "\\}", "g"), tokens[key] || "");
      }
    }
    return output;
  }

  function pickText(rngState, source) {
    if (source instanceof Array) {
      return RNG.choice(rngState, source) || "";
    }
    return source || "";
  }

  function evaluateTags(gameState, tagDefinitions, extra) {
    var summary = summaryFromGameState(gameState);
    var result = [];
    var i;
    for (i = 0; i < tagDefinitions.length; i += 1) {
      if (tagMatches(tagDefinitions[i], summary, extra)) {
        result.push({
          id: tagDefinitions[i].id,
          label: tagDefinitions[i].label
        });
      }
    }
    return result;
  }

  function createMediaEntry(gameState, mediaType, payload, templates, rngState) {
    var summary = summaryFromGameState(gameState);
    var matching = [];
    var template;
    var tokens;
    var i;
    if (!(templates instanceof Array)) {
      return null;
    }
    for (i = 0; i < templates.length; i += 1) {
      template = templates[i];
      if (template && template.type === mediaType && templateMatches(template, summary, payload)) {
        matching.push(template);
      }
    }
    if (!matching.length) {
      return null;
    }
    template = RNG.choice(rngState, matching);
    tokens = {
      name: summary.name,
      country: payload && payload.countryName ? payload.countryName : (payload && payload.country ? payload.country : ""),
      opponent: payload && payload.opponentName ? payload.opponentName : "",
      method: payload && payload.method ? payload.method : "",
      injury: payload && payload.injuryLabel ? payload.injuryLabel : "",
      gym: payload && payload.gymName ? payload.gymName : "",
      trainer: payload && payload.trainerName ? payload.trainerName : "",
      contract: payload && payload.contractLabel ? payload.contractLabel : "",
      event: payload && payload.eventTitle ? payload.eventTitle : "",
      ending: payload && payload.endingLabel ? payload.endingLabel : ""
    };
    return {
      id: template.id + "_" + (gameState && gameState.career ? gameState.career.week : 1) + "_" + RNG.int(rngState, 100, 999),
      type: mediaType,
      tone: template.tone || "warn",
      week: gameState && gameState.career ? gameState.career.week : 1,
      title: replaceTokens(pickText(rngState, template.titles), tokens),
      text: "",
      tags: payload && payload.tags ? clone(payload.tags) : []
    };
  }

  function selectEnding(gameState, endingReason, endingDefinitions) {
    var summary = summaryFromGameState(gameState);
    var i;
    for (i = 0; i < endingDefinitions.length; i += 1) {
      if (tagMatches(endingDefinitions[i], summary, { endingReason: endingReason })) {
        return endingDefinitions[i];
      }
    }
    return endingDefinitions.length ? endingDefinitions[endingDefinitions.length - 1] : null;
  }

  function mapIds(items) {
    var result = [];
    var i;
    for (i = 0; i < items.length; i += 1) {
      if (items[i] && items[i].id) {
        result.push(items[i].id);
      }
    }
    return result;
  }

  function buildLegend(gameState, options) {
    var opts = options || {};
    var summary = summaryFromGameState(gameState);
    var tags = evaluateTags(gameState, opts.reputationTags || [], { endingReason: opts.endingReason || "" });
    var ending = selectEnding(gameState, opts.endingReason || "", opts.endingArchetypes || []);
    var biography = gameState && gameState.player ? (gameState.player.biography || {}) : {};
    var facts = biography.facts || {};
    var history = biography.history instanceof Array ? biography.history : [];
    var keyFights = facts.keyFights instanceof Array ? facts.keyFights.slice(0, 4) : [];
    var relationships = gameState && gameState.world && gameState.world.relationships instanceof Array ? gameState.world.relationships.slice(0) : [];
    var npcs = gameState && gameState.world && gameState.world.npcs instanceof Array ? gameState.world.npcs.slice(0) : [];
    var allies = [];
    var enemies = [];
    var countries = facts.countriesVisited instanceof Array ? facts.countriesVisited.slice(0) : [];
    var styleLabel = opts.styleLabel || "";
    var riseReason = [];
    var fallReason = [];
    var relation;
    var npc;
    var i;
    var j;

    for (i = 0; i < relationships.length; i += 1) {
      relation = relationships[i];
      npc = null;
      if (!relation || typeof relation.score !== "number") {
        continue;
      }
      for (j = 0; j < npcs.length; j += 1) {
        if (npcs[j] && npcs[j].id === relation.npcId) {
          npc = npcs[j];
          break;
        }
      }
      if (!npc || !npc.name || !npc.knownToPlayer) {
        continue;
      }
      if (relation.score >= 35 && allies.length < 3) {
        allies.push(npc.name);
      }
      if (relation.score <= -35 && enemies.length < 3) {
        enemies.push(npc.name);
      }
    }

    if (hasValue(mapIds(tags), "ko_machine")) {
      riseReason.push("его начали бояться за тяжёлый удар");
    }
    if (hasValue(mapIds(tags), "fan_favorite")) {
      riseReason.push("люди быстро приняли его за своего");
    }
    if (summary.upsetWins > 0) {
      riseReason.push("он ломал чужие расклады");
    }
    if (summary.homeWins >= 4) {
      riseReason.push("дома он собрал свою публику");
    }
    if (summary.nationalTeamSelections >= 2) {
      riseReason.push("сборная долго держала его рядом");
    }
    if (summary.olympicEntries >= 1) {
      riseReason.push("олимпийский путь сделал его большим именем");
    }
    if (summary.proTitles >= 1) {
      riseReason.push("профи-путь привёл его к поясам");
    }
    if (summary.streetRating >= 110) {
      riseReason.push("улица сделала его жёстким и узнаваемым");
    }
    if (summary.gymName) {
      riseReason.push("часть пути он связал с залом " + summary.gymName);
    }
    if (summary.chronicInjuries >= 2) {
      fallReason.push("тело начало сдавать раньше, чем хотелось");
    }
    if (summary.scandals >= 2) {
      fallReason.push("шум вокруг имени мешал не меньше самих боёв");
    }
    if (opts.endingReason === "stress") {
      fallReason.push("давление съедало его изнутри");
    }
    if (opts.endingReason === "debt") {
      fallReason.push("деньги так и не стали опорой");
    }
    if (opts.endingReason === "body") {
      fallReason.push("накопленный износ всё-таки догнал его");
    }
    if (summary.nationalTeamStatus === "dropped") {
      fallReason.push("вылет из сборной сломал прежний ход карьеры");
    }

    return {
      id: opts.id || "",
      runId: opts.runId || "",
      archivedAt: opts.archivedAt || "",
      name: summary.name,
      endingReason: opts.endingReason || "",
      endingLabel: ending ? ending.label : "Боец улиц",
      endingSummary: ending ? ending.summary : "",
      fame: summary.fame,
      week: summary.weeks,
      record: {
        wins: summary.wins,
        losses: summary.losses,
        kos: summary.kos,
        deathsCaused: summary.deathsCaused
      },
      tags: tags,
      originCountry: summary.homeCountry,
      countriesVisited: countries,
      keyFights: clone(keyFights),
      allies: allies,
      enemies: enemies,
      styleLabel: styleLabel,
      riseReason: riseReason.length ? riseReason.join(". ") + "." : "Он просто продолжал идти от недели к неделе.",
      fallReason: fallReason.length ? fallReason.join(". ") + "." : "Конец карьеры пришёл не из-за одного момента, а из-за длинной цепочки решений.",
      endingText: opts.endingText || "",
      amateurRankLabel: summary.amateurRankId || "",
      nationalTeamSelections: summary.nationalTeamSelections,
      olympicEntries: summary.olympicEntries,
      olympicMedals: summary.olympicMedals,
      proTitles: summary.proTitles,
      streetRating: summary.streetRating,
      gymName: summary.gymName || "",
      history: history.slice(0, 8),
      mediaHighlights: biography.mediaFeed instanceof Array ? clone(biography.mediaFeed.slice(0, 6)) : []
    };
  }

  return {
    evaluateTags: evaluateTags,
    createMediaEntry: createMediaEntry,
    buildLegend: buildLegend
  };
}());
