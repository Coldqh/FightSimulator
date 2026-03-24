var JuniorAmateurSystem = (function () {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function clamp(value, minValue, maxValue) {
    return Math.max(minValue, Math.min(maxValue, value));
  }

  function dataRoot() {
    return typeof YOUTH_AMATEUR_DATA !== "undefined" && YOUTH_AMATEUR_DATA ? YOUTH_AMATEUR_DATA : {
      agePhases: [],
      livingModes: [],
      amateurRanks: [],
      rankLabelsByCountry: { "default": {} },
      juniorSupportModel: {},
      amateurFightOfferTemplates: [],
      adultTransitionEvent: null
    };
  }

  function findById(list, id) {
    var i;
    if (!(list instanceof Array)) {
      return null;
    }
    for (i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].id === id) {
        return list[i];
      }
    }
    return null;
  }

  function listAgePhases() {
    return clone(dataRoot().agePhases || []);
  }

  function getAgePhase(phaseId) {
    return clone(findById(dataRoot().agePhases || [], phaseId));
  }

  function resolvePrimaryPhase(ageYears) {
    var phases = dataRoot().agePhases || [];
    var i;
    var phase;
    var fallback = null;
    for (i = 0; i < phases.length; i += 1) {
      phase = phases[i];
      if (!fallback && phase.primary) {
        fallback = phase;
      }
      if (phase.primary && ageYears >= phase.minAge && ageYears <= phase.maxAge) {
        return clone(phase);
      }
    }
    return clone(fallback);
  }

  function resolveSecondaryWindows(ageYears) {
    var phases = dataRoot().agePhases || [];
    var result = [];
    var i;
    var phase;
    for (i = 0; i < phases.length; i += 1) {
      phase = phases[i];
      if (!phase.primary && ageYears >= phase.minAge && ageYears <= phase.maxAge) {
        result.push(clone(phase));
      }
    }
    return result;
  }

  function getPhaseSnapshot(ageYears) {
    var primary = resolvePrimaryPhase(ageYears);
    return {
      primary: primary,
      windows: resolveSecondaryWindows(ageYears),
      isJunior: !!(primary && primary.id === "junior_phase"),
      adultSandbox: !!(primary && primary.adultSandbox)
    };
  }

  function listLivingModes() {
    return clone(dataRoot().livingModes || []);
  }

  function getLivingMode(modeId) {
    return clone(findById(dataRoot().livingModes || [], modeId));
  }

  function defaultLivingModeForAge(ageYears) {
    return ageYears <= 17 ? "family" : "";
  }

  function listAmateurRanks() {
    return clone(dataRoot().amateurRanks || []);
  }

  function getAmateurRank(rankId) {
    return clone(findById(dataRoot().amateurRanks || [], rankId));
  }

  function getRankOrder(rankId) {
    var rank = getAmateurRank(rankId);
    return rank ? rank.order : -1;
  }

  function compareRanks(leftId, rightId) {
    return getRankOrder(leftId) - getRankOrder(rightId);
  }

  function defaultRankForAge(ageYears) {
    return ageYears >= 18 ? "adult_class_3" : "junior_class_3";
  }

  function defaultScoreForAge(ageYears) {
    var rank = getAmateurRank(defaultRankForAge(ageYears));
    return rank ? (typeof rank.sumMin === "number" ? rank.sumMin : rank.minScore) : 0;
  }

  function canonicalRankId(rankId, ageYears) {
    var value = String(rankId || "").toLowerCase();
    if (!value) {
      return defaultRankForAge(ageYears);
    }
    if (value === "junior_novice") {
      return "junior_class_3";
    }
    if (value === "elite") {
      return "candidate_national";
    }
    if (value === "a") {
      return "adult_class_1";
    }
    if (value === "b") {
      return "adult_class_2";
    }
    if (value === "c") {
      return "adult_class_3";
    }
    if (value === "kms") {
      return "candidate_national";
    }
    if (value === "ms" || value === "msmk" || value === "international_master" || value === "national_team_candidate" || value === "national_team_member" || value === "olympic_level") {
      return "national_master";
    }
    return rankId;
  }

  function statTotalFromInputs(amateurState, inputs) {
    if (inputs && typeof inputs.statTotal === "number") {
      return Math.max(5, Math.round(inputs.statTotal));
    }
    if (amateurState && typeof amateurState.score === "number") {
      return Math.max(5, Math.round(amateurState.score));
    }
    return 5;
  }

  function rankAllowedForAge(rank, ageYears) {
    if (!rank) {
      return false;
    }
    if (ageYears >= 18) {
      return rank.minAge >= 18;
    }
    return rank.minAge < 18 || String(rank.id || "").indexOf("junior_") === 0;
  }

  function createAmateurState(ageYears) {
    var baseScore = defaultScoreForAge(ageYears);
    return {
      rankId: defaultRankForAge(ageYears),
      score: baseScore,
      tournamentPoints: baseScore,
      opponentQuality: 0,
      record: {
        wins: 0,
        losses: 0,
        draws: 0
      },
      lastRankWeek: 0,
      adultTransitionDone: ageYears >= 18,
      history: [],
      currentOrganizationId: "",
      nationalTeamStatus: "none",
      nationalTeamCountryId: "",
      teamId: "",
      selectionScore: 0,
      eligibleLevels: []
    };
  }

  function normalizeAmateurState(source, ageYears) {
    var normalized = createAmateurState(ageYears);
    if (!source || typeof source !== "object") {
      return normalized;
    }
    if (typeof source.rankId === "string" && getAmateurRank(canonicalRankId(source.rankId, ageYears))) {
      normalized.rankId = canonicalRankId(source.rankId, ageYears);
    }
    if (typeof source.score === "number") {
      normalized.score = Math.max(0, Math.round(source.score));
    }
    if (typeof source.tournamentPoints === "number") {
      normalized.tournamentPoints = Math.max(0, Math.round(source.tournamentPoints));
    } else if (typeof source.score === "number") {
      normalized.tournamentPoints = Math.max(0, Math.round(source.score));
    }
    if (typeof source.opponentQuality === "number") {
      normalized.opponentQuality = Math.max(0, Math.round(source.opponentQuality));
    }
    if (source.record && typeof source.record === "object") {
      normalized.record.wins = typeof source.record.wins === "number" ? Math.max(0, Math.round(source.record.wins)) : normalized.record.wins;
      normalized.record.losses = typeof source.record.losses === "number" ? Math.max(0, Math.round(source.record.losses)) : normalized.record.losses;
      normalized.record.draws = typeof source.record.draws === "number" ? Math.max(0, Math.round(source.record.draws)) : normalized.record.draws;
    }
    if (typeof source.lastRankWeek === "number") {
      normalized.lastRankWeek = Math.max(0, Math.round(source.lastRankWeek));
    }
    normalized.adultTransitionDone = typeof source.adultTransitionDone === "boolean" ? source.adultTransitionDone : normalized.adultTransitionDone;
    normalized.history = source.history instanceof Array ? clone(source.history) : [];
    normalized.currentOrganizationId = typeof source.currentOrganizationId === "string" ? source.currentOrganizationId : normalized.currentOrganizationId;
    normalized.nationalTeamStatus = typeof source.nationalTeamStatus === "string" ? source.nationalTeamStatus : normalized.nationalTeamStatus;
    normalized.nationalTeamCountryId = typeof source.nationalTeamCountryId === "string" ? source.nationalTeamCountryId : normalized.nationalTeamCountryId;
    normalized.teamId = typeof source.teamId === "string" ? source.teamId : normalized.teamId;
    normalized.selectionScore = typeof source.selectionScore === "number" ? Math.max(0, Math.round(source.selectionScore)) : normalized.selectionScore;
    normalized.eligibleLevels = source.eligibleLevels instanceof Array ? clone(source.eligibleLevels) : [];
    return normalized;
  }

  function getLocalizedRankLabel(countryId, rankId) {
    var labels = dataRoot().rankLabelsByCountry || {};
    var countryLabels = labels[countryId] || labels["default"] || {};
    return countryLabels[rankId] || rankId;
  }

  function styleMaturityValue(styleProgressMap) {
    var best = 0;
    var key;
    if (!styleProgressMap || typeof styleProgressMap !== "object") {
      return 0;
    }
    for (key in styleProgressMap) {
      if (styleProgressMap.hasOwnProperty(key) && typeof styleProgressMap[key] === "number") {
        best = Math.max(best, styleProgressMap[key]);
      }
    }
    return best;
  }

  function computeRankScore(amateurState, inputs) {
    return statTotalFromInputs(amateurState, inputs);
  }

  function evaluateRank(amateurState, ageYears, inputs) {
    var ranks = dataRoot().amateurRanks || [];
    var score = computeRankScore(amateurState, inputs);
    var current = getAmateurRank(canonicalRankId(amateurState.rankId, ageYears)) || getAmateurRank(defaultRankForAge(ageYears));
    var next = null;
    var i;
    var rank;
    for (i = 0; i < ranks.length; i += 1) {
      rank = ranks[i];
      if (!rankAllowedForAge(rank, ageYears)) {
        continue;
      }
      if (score >= (typeof rank.sumMin === "number" ? rank.sumMin : rank.minScore)) {
        current = rank;
      }
      if (!next && score < (typeof rank.sumMin === "number" ? rank.sumMin : rank.minScore)) {
        next = rank;
      }
    }
    if (!next && current) {
      for (i = 0; i < ranks.length; i += 1) {
        if (ranks[i].order === current.order + 1 && rankAllowedForAge(ranks[i], ageYears)) {
          next = ranks[i];
          break;
        }
      }
    }
    return {
      score: score,
      current: clone(current),
      next: clone(next),
      progressPercent: next ? clamp(Math.round(((score - (typeof current.sumMin === "number" ? current.sumMin : current.minScore)) / Math.max(1, (typeof next.sumMin === "number" ? next.sumMin : next.minScore) - (typeof current.sumMin === "number" ? current.sumMin : current.minScore))) * 100), 0, 100) : 100
    };
  }

  function nextUnlockText(countryId, amateurState, ageYears, inputs) {
    var evaluation = evaluateRank(amateurState, ageYears, inputs);
    if (!evaluation.next) {
      return "Дальше только вершина любительского бокса.";
    }
    return getLocalizedRankLabel(countryId, evaluation.next.id) + ": " + evaluation.next.unlockSummary;
  }

  function getJuniorSupportModel() {
    return clone(dataRoot().juniorSupportModel || {});
  }

  function getAmateurOfferTemplates() {
    return clone(dataRoot().amateurFightOfferTemplates || []);
  }

  function getAdultTransitionEvent() {
    return clone(dataRoot().adultTransitionEvent || null);
  }

  function templateAllowedForRank(template, ageYears, rankId) {
    if (!template) {
      return false;
    }
    if (typeof template.minAge === "number" && ageYears < template.minAge) {
      return false;
    }
    if (typeof template.maxAge === "number" && ageYears > template.maxAge) {
      return false;
    }
    if (template.minRankId && compareRanks(rankId, template.minRankId) < 0) {
      return false;
    }
    return true;
  }

  return {
    listAgePhases: listAgePhases,
    getAgePhase: getAgePhase,
    getPhaseSnapshot: getPhaseSnapshot,
    listLivingModes: listLivingModes,
    getLivingMode: getLivingMode,
    defaultLivingModeForAge: defaultLivingModeForAge,
    listAmateurRanks: listAmateurRanks,
    getAmateurRank: getAmateurRank,
    getRankOrder: getRankOrder,
    compareRanks: compareRanks,
    defaultRankForAge: defaultRankForAge,
    defaultScoreForAge: defaultScoreForAge,
    createAmateurState: createAmateurState,
    normalizeAmateurState: normalizeAmateurState,
    canonicalRankId: canonicalRankId,
    getLocalizedRankLabel: getLocalizedRankLabel,
    styleMaturityValue: styleMaturityValue,
    computeRankScore: computeRankScore,
    evaluateRank: evaluateRank,
    nextUnlockText: nextUnlockText,
    getJuniorSupportModel: getJuniorSupportModel,
    getAmateurOfferTemplates: getAmateurOfferTemplates,
    getAdultTransitionEvent: getAdultTransitionEvent,
    templateAllowedForRank: templateAllowedForRank
  };
}());
