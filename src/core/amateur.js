(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;
  var State = window.FS.State;

  function ensureAmateurState(state) {
    if (!state.amateurPath || typeof state.amateurPath !== "object") {
      state.amateurPath = { completed: {}, medals: [], lastCompetitionWeekById: {}, points: 0 };
    }

    state.amateurPath.completed = state.amateurPath.completed || {};
    state.amateurPath.medals = state.amateurPath.medals instanceof Array ? state.amateurPath.medals : [];
    state.amateurPath.lastCompetitionWeekById = state.amateurPath.lastCompetitionWeekById || {};
    state.amateurPath.points = Number(state.amateurPath.points) || 0;
  }

  function getCompetition(compId) {
    var i;
    for (i = 0; i < Data.amateurCompetitions.length; i += 1) {
      if (Data.amateurCompetitions[i].id === compId) {
        return Data.amateurCompetitions[i];
      }
    }
    return Data.amateurCompetitions[0];
  }

  function currentRoundLabel(offer) {
    return offer.bracketRoundLabel || "1/32";
  }

  function competitionStatus(state, comp) {
    var p = State.player(state);
    var rating = U.statAverage(p.stats);
    var lastWeek;
    var cooldownLeft;

    ensureAmateurState(state);
    lastWeek = state.amateurPath.lastCompetitionWeekById[comp.id] || 0;
    cooldownLeft = lastWeek ? Math.max(0, comp.weekCooldown - (state.week - lastWeek)) : 0;

    if (p.trackId !== "amateur") {
      return { available: false, reason: "Доступно только на любительском пути.", cooldownLeft: cooldownLeft };
    }

    if (rating < comp.minRating) {
      return { available: false, reason: "Нужен OVR " + comp.minRating + "+.", cooldownLeft: cooldownLeft };
    }

    if (typeof comp.maxRating === "number" && rating > comp.maxRating) {
      return { available: false, reason: "OVR выше лимита турнира: максимум " + comp.maxRating + ".", cooldownLeft: cooldownLeft };
    }

    if (cooldownLeft > 0) {
      return { available: false, reason: "Следующая попытка через " + cooldownLeft + " нед.", cooldownLeft: cooldownLeft };
    }

    if ((state.offers || []).some(function (offer) { return offer.isCompetition && offer.competitionId === comp.id; })) {
      return { available: false, reason: "Турнир уже идёт.", cooldownLeft: cooldownLeft };
    }

    return { available: true, reason: "Можно заявиться.", cooldownLeft: 0 };
  }

  function availableCompetitions(state) {
    ensureAmateurState(state);
    return Data.amateurCompetitions.map(function (comp) {
      var status = competitionStatus(state, comp);
      return {
        id: comp.id,
        label: comp.label,
        awardLabel: comp.awardLabel,
        minRating: comp.minRating,
        maxRating: comp.maxRating,
        rewardRating: comp.rewardRating,
        rounds: comp.rounds || [],
        difficultyId: comp.difficultyId,
        available: status.available,
        reason: status.reason,
        cooldownLeft: status.cooldownLeft,
        completed: !!state.amateurPath.completed[comp.id]
      };
    });
  }

  function chooseCompetitionCountry(state, comp) {
    var p = State.player(state);
    var playerCountry = U.findCountry(p.countryId);
    var pool;

    if (comp.scope === "continent") {
      pool = Data.countries.filter(function (country) {
        return country.continentId === playerCountry.continentId;
      });
    } else if (comp.scope === "world" || comp.scope === "world_elite") {
      pool = Data.countries.slice();
    } else {
      pool = [playerCountry];
    }

    return pool[U.randomInt(0, pool.length - 1)] || playerCountry;
  }

  function findCompetitionOpponent(state, comp, usedIds) {
    var p = State.player(state);
    var playerCountry = U.findCountry(p.countryId);
    var target = Math.max(comp.minOpponentRating || 1, U.statAverage(p.stats) + U.findDifficulty(comp.difficultyId).offset);
    var used = usedIds || {};
    var candidates = state.roster.filter(function (fighter) {
      var country = U.findCountry(fighter.countryId);
      var scopeOk = false;

      if (fighter.isPlayer || used[fighter.id] || fighter.trackId !== "amateur" || fighter.weightClassId !== p.weightClassId) {
        return false;
      }

      if (comp.scope === "country") {
        scopeOk = fighter.countryId === p.countryId;
      } else if (comp.scope === "continent") {
        scopeOk = country.continentId === playerCountry.continentId;
      } else {
        scopeOk = true;
      }

      if (!scopeOk) {
        return false;
      }

      if ((comp.scope === "world" || comp.scope === "world_elite") && U.statAverage(fighter.stats) < (comp.minOpponentRating || 70)) {
        return false;
      }

      return true;
    });

    candidates.sort(function (left, right) {
      return Math.abs(U.statAverage(left.stats) - target) - Math.abs(U.statAverage(right.stats) - target);
    });

    return candidates[0] || null;
  }

  function createOpponentForRound(state, comp, usedIds) {
    var p = State.player(state);
    var opponent = findCompetitionOpponent(state, comp, usedIds);
    var opponentCountry;

    if (opponent) {
      usedIds[opponent.id] = true;
      return opponent;
    }

    opponentCountry = chooseCompetitionCountry(state, comp);
    opponent = State.createFighter(opponentCountry.id, "amateur", 16000 + state.week * 31 + U.randomInt(1, 999), Math.max(comp.minOpponentRating || 1, U.statAverage(p.stats) + U.findDifficulty(comp.difficultyId).offset), {
      weightClassId: p.weightClassId,
      gymId: ""
    });
    if (window.FS.Matchmaking) {
      window.FS.Matchmaking.normalizeRecordForFighter(opponent);
    }
    state.roster.push(opponent);
    usedIds[opponent.id] = true;
    if (window.FS.Clubs) {
      window.FS.Clubs.assignFightersToClubs(state);
    }
    return opponent;
  }

  function createCompetitionOffer(state, compId) {
    var comp = getCompetition(compId);
    var status = competitionStatus(state, comp);
    var used = {};
    var opponent;
    var offer;

    if (!status.available) {
      state.feed = status.reason;
      return null;
    }

    opponent = createOpponentForRound(state, comp, used);

    offer = {
      id: U.uid("amateur_comp"),
      label: comp.label,
      difficultyId: comp.difficultyId,
      opponentId: opponent.id,
      rounds: 3,
      purse: 0,
      isCompetition: true,
      competitionId: comp.id,
      bracketRoundIndex: 0,
      bracketRoundLabel: comp.rounds[0],
      bracketWins: 0,
      usedOpponentIds: used,
      opponentTier: window.FS.Matchmaking ? window.FS.Matchmaking.careerTier(opponent).label : "Любитель",
      opponentStage: currentRoundLabel({ bracketRoundLabel: comp.rounds[0] })
    };

    state.offers.push(offer);
    state.feed = "Заявка на турнир: " + comp.label + ". Текущий раунд: " + offer.bracketRoundLabel + ".";
    return offer;
  }

  function placementFromLoss(comp, wins) {
    if (wins >= comp.rounds.length - 1) { return "2 место"; }
    if (wins >= comp.rounds.length - 2) { return "3 место"; }
    return "";
  }

  function awardPlacement(state, comp, place, result) {
    var p = State.player(state);
    var awardLabel = comp.awardLabel + " · " + place;

    state.amateurPath.completed[comp.id] = true;
    state.amateurPath.points += comp.rewardRating;
    state.amateurPath.medals.unshift({
      id: U.uid("medal"),
      week: state.week,
      competitionId: comp.id,
      label: comp.label,
      awardLabel: awardLabel,
      place: place,
      result: result
    });

    if (state.amateurPath.medals.length > 30) {
      state.amateurPath.medals.length = 30;
    }

    if (State.addFighterAward) {
      State.addFighterAward(state, p, awardLabel, "amateur");
    }

    if (p && p.careerLog) {
      p.careerLog.unshift({ week: state.week, text: "Турнир: " + comp.label + " · " + awardLabel + "." });
    }
  }

  function completeCompetition(state, offer, result) {
    var comp;
    var place;
    var opponent;

    if (!offer || !offer.isCompetition) {
      return { finished: false, continueTournament: false };
    }

    ensureAmateurState(state);
    comp = getCompetition(offer.competitionId);

    if (result === "Победа") {
      offer.bracketWins = (offer.bracketWins || 0) + 1;

      if (offer.bracketRoundIndex >= comp.rounds.length - 1) {
        awardPlacement(state, comp, "1 место", result);
        state.amateurPath.lastCompetitionWeekById[comp.id] = state.week;
        state.feed = "Турнир завершён: " + comp.label + " · 1 место.";
        return { finished: true, continueTournament: false, place: "1 место" };
      }

      offer.bracketRoundIndex += 1;
      offer.bracketRoundLabel = comp.rounds[offer.bracketRoundIndex];
      offer.usedOpponentIds = offer.usedOpponentIds || {};
      opponent = createOpponentForRound(state, comp, offer.usedOpponentIds);
      offer.opponentId = opponent.id;
      offer.opponentTier = window.FS.Matchmaking ? window.FS.Matchmaking.careerTier(opponent).label : "Любитель";
      offer.opponentStage = offer.bracketRoundLabel;
      state.feed = "Турнир продолжается без смены недели. Следующий раунд: " + offer.bracketRoundLabel + ".";
      return { finished: false, continueTournament: true, nextRound: offer.bracketRoundLabel };
    }

    place = placementFromLoss(comp, offer.bracketWins || 0);
    if (place) {
      awardPlacement(state, comp, place, result);
    }
    state.amateurPath.lastCompetitionWeekById[comp.id] = state.week;
    state.feed = "Вылет из турнира: " + comp.label + (place ? " · " + place : "") + ".";
    return { finished: true, continueTournament: false, place: place };
  }

  function objectiveSummary(state) {
    var comps = availableCompetitions(state);
    var firstAvailable = comps.find(function (comp) { return comp.available; });
    var firstLocked = comps.find(function (comp) { return !comp.completed; });

    if (firstAvailable) {
      return { title: "Следующая цель", text: "Доступен турнир: " + firstAvailable.label + ".", next: firstAvailable };
    }

    if (firstLocked) {
      return { title: "Следующая цель", text: firstLocked.label + ": " + firstLocked.reason, next: firstLocked };
    }

    return { title: "Любительская лестница", text: "Все текущие ступени закрыты.", next: null };
  }

  function worldSummary(state) {
    ensureAmateurState(state);
    return {
      points: state.amateurPath.points,
      medals: state.amateurPath.medals.length,
      completed: Object.keys(state.amateurPath.completed).length,
      available: availableCompetitions(state).filter(function (comp) { return comp.available; }).length
    };
  }

  window.FS.Amateur = {
    ensureAmateurState: ensureAmateurState,
    getCompetition: getCompetition,
    availableCompetitions: availableCompetitions,
    createCompetitionOffer: createCompetitionOffer,
    completeCompetition: completeCompetition,
    objectiveSummary: objectiveSummary,
    worldSummary: worldSummary,
    currentRoundLabel: currentRoundLabel
  };
}());
