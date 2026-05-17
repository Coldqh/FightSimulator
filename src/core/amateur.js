(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;
  var State = window.FS.State;

  function ensureAmateurState(state) {
    if (!state.amateurPath || typeof state.amateurPath !== "object") {
      state.amateurPath = {
        completed: {},
        medals: [],
        lastCompetitionWeekById: {},
        points: 0
      };
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
      return { available: false, reason: "Нужен рейтинг " + comp.minRating + "+.", cooldownLeft: cooldownLeft };
    }

    if (cooldownLeft > 0) {
      return { available: false, reason: "Следующая попытка через " + cooldownLeft + " нед.", cooldownLeft: cooldownLeft };
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
        minRating: comp.minRating,
        rewardRating: comp.rewardRating,
        difficultyId: comp.difficultyId,
        available: status.available,
        reason: status.reason,
        cooldownLeft: status.cooldownLeft,
        completed: !!state.amateurPath.completed[comp.id]
      };
    });
  }

  function findCompetitionOpponent(state, comp) {
    var p = State.player(state);
    var playerCountry = U.findCountry(p.countryId);
    var difficulty = U.findDifficulty(comp.difficultyId);
    var target = Math.max(comp.minOpponentRating || 1, U.statAverage(p.stats) + difficulty.offset + Math.max(0, Math.round(comp.minRating / 14)));
    var candidates = state.roster.filter(function (fighter) {
      var country = U.findCountry(fighter.countryId);
      var scopeOk = false;

      if (fighter.isPlayer || fighter.trackId !== "amateur" || fighter.weightClassId !== p.weightClassId) {
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

    if (!pool.length) {
      return playerCountry;
    }

    return pool[U.randomInt(0, pool.length - 1)];
  }

  function createCompetitionOffer(state, compId) {
    var comp = getCompetition(compId);
    var status = competitionStatus(state, comp);
    var p = State.player(state);
    var opponent;
    var offer;

    if (!status.available) {
      state.feed = status.reason;
      return null;
    }

    opponent = findCompetitionOpponent(state, comp);

    if (!opponent) {
      var opponentCountry = chooseCompetitionCountry(state, comp);
      opponent = State.createFighter(opponentCountry.id, "amateur", 16000 + state.week * 31, Math.max(comp.minOpponentRating || 1, U.statAverage(p.stats) + U.findDifficulty(comp.difficultyId).offset), {
        weightClassId: p.weightClassId,
        gymId: p.gymId
      });
      if (window.FS.Matchmaking) {
        window.FS.Matchmaking.normalizeRecordForFighter(opponent);
      }
      state.roster.push(opponent);
      if (window.FS.Clubs) {
        window.FS.Clubs.assignFightersToClubs(state);
      }
    }

    offer = {
      id: U.uid("amateur_comp"),
      label: comp.label,
      difficultyId: comp.difficultyId,
      tacticId: state.selectedTacticId || "balanced",
      opponentId: opponent.id,
      rounds: 3,
      purse: 0,
      isCompetition: true,
      competitionId: comp.id,
      opponentTier: window.FS.Matchmaking ? window.FS.Matchmaking.careerTier(opponent).label : "Любитель",
      opponentStage: window.FS.Matchmaking ? window.FS.Matchmaking.careerStage(opponent).label : "Турнир"
    };

    state.offers.push(offer);
    state.feed = "Заявка на турнир: " + comp.label + ".";
    return offer;
  }

  function completeCompetition(state, offer, result) {
    var comp;
    var p = State.player(state);

    if (!offer || !offer.isCompetition) {
      return;
    }

    ensureAmateurState(state);
    comp = getCompetition(offer.competitionId);

    state.amateurPath.lastCompetitionWeekById[comp.id] = state.week;

    if (result === "Победа") {
      state.amateurPath.completed[comp.id] = true;
      state.amateurPath.points += comp.rewardRating;
      state.amateurPath.medals.unshift({
        id: U.uid("medal"),
        week: state.week,
        competitionId: comp.id,
        label: comp.label,
        awardLabel: comp.awardLabel,
        result: result
      });

      if (state.amateurPath.medals.length > 20) {
        state.amateurPath.medals.length = 20;
      }

      if (State.addFighterAward) {
        State.addFighterAward(state, p, comp.awardLabel, "amateur");
      }

      if (p && p.careerLog) {
        p.careerLog.unshift({ week: state.week, text: "Победа в турнире: " + comp.label + " · " + comp.awardLabel + "." });
      }

      if (window.FS.World) {
        window.FS.World.createNews(state, "amateur", p.name + " выиграл турнир: " + comp.label + ".", { type: "amateur_competition" });
      }
    } else if (p && p.careerLog) {
      p.careerLog.unshift({ week: state.week, text: "Турнир: " + comp.label + " — " + result + "." });
    }
  }

  function objectiveSummary(state) {
    var p = State.player(state);
    var comps = availableCompetitions(state);
    var firstAvailable = null;
    var firstLocked = null;
    var i;

    for (i = 0; i < comps.length; i += 1) {
      if (comps[i].available && !firstAvailable) {
        firstAvailable = comps[i];
      }
      if (!comps[i].completed && !firstLocked) {
        firstLocked = comps[i];
      }
    }

    if (!p || p.trackId !== "amateur") {
      return {
        title: "Любительская лестница",
        text: "Для участия вернись на любительский путь.",
        next: null
      };
    }

    if (firstAvailable) {
      return {
        title: "Следующая цель",
        text: "Доступен турнир: " + firstAvailable.label + ".",
        next: firstAvailable
      };
    }

    if (firstLocked) {
      return {
        title: "Следующая цель",
        text: firstLocked.label + ": " + firstLocked.reason,
        next: firstLocked
      };
    }

    return {
      title: "Любительская лестница",
      text: "Все текущие ступени закрыты. Можно уходить в профи.",
      next: null
    };
  }

  function worldSummary(state) {
    ensureAmateurState(state);
    return {
      points: state.amateurPath.points,
      medals: state.amateurPath.medals.length,
      completed: Object.keys(state.amateurPath.completed).length,
      available: availableCompetitions(state).filter(function (comp) {
        return comp.available;
      }).length
    };
  }

  window.FS.Amateur = {
    ensureAmateurState: ensureAmateurState,
    getCompetition: getCompetition,
    availableCompetitions: availableCompetitions,
    createCompetitionOffer: createCompetitionOffer,
    completeCompetition: completeCompetition,
    objectiveSummary: objectiveSummary,
    worldSummary: worldSummary
  };
}());
