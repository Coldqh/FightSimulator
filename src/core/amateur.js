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
      if (Data.amateurCompetitions[i].id === compId) { return Data.amateurCompetitions[i]; }
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

    if (p.trackId !== "amateur") { return { available: false, reason: "Доступно только на любительском пути.", cooldownLeft: cooldownLeft }; }
    if (rating < comp.minRating) { return { available: false, reason: "Нужен OVR " + comp.minRating + "+.", cooldownLeft: cooldownLeft }; }
    if (typeof comp.maxRating === "number" && rating > comp.maxRating) { return { available: false, reason: "OVR выше лимита: максимум " + comp.maxRating + ".", cooldownLeft: cooldownLeft }; }
    if (cooldownLeft > 0) { return { available: false, reason: "Следующая попытка через " + cooldownLeft + " нед.", cooldownLeft: cooldownLeft }; }
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

  function countryPool(state, comp) {
    var p = State.player(state);
    var playerCountry = U.findCountry(p.countryId);
    if (comp.scope === "continent") {
      return Data.countries.filter(function (country) { return country.continentId === playerCountry.continentId; });
    }
    if (comp.scope === "world" || comp.scope === "world_elite") { return Data.countries.slice(); }
    return [playerCountry];
  }

  function findTournamentOpponent(state, comp, usedIds) {
    var p = State.player(state);
    var countries = countryPool(state, comp).map(function (country) { return country.id; });
    var min = typeof comp.minOpponentRating === "number" ? comp.minOpponentRating : comp.minRating;
    var max = typeof comp.maxRating === "number" ? comp.maxRating : 100;
    var candidates = state.roster.filter(function (fighter) {
      var rating = U.statAverage(fighter.stats);
      return !fighter.isPlayer && !usedIds[fighter.id] && fighter.trackId === "amateur" &&
        fighter.weightClassId === p.weightClassId && countries.indexOf(fighter.countryId) !== -1 &&
        rating >= min && rating <= max;
    });

    if (!candidates.length) {
      candidates = state.roster.filter(function (fighter) {
        var rating = U.statAverage(fighter.stats);
        return !fighter.isPlayer && !usedIds[fighter.id] && fighter.trackId === "amateur" && countries.indexOf(fighter.countryId) !== -1 && rating >= min && rating <= max;
      });
    }

    if (!candidates.length) { return null; }
    return candidates[U.randomInt(0, candidates.length - 1)];
  }

  function playerWinsRound(player, opponent) {
    var pScore = U.scoreFighter(player) + U.randomInt(-8, 8);
    var oScore = U.scoreFighter(opponent) + U.randomInt(-8, 8);
    var chance = U.clamp(50 + Math.round((pScore - oScore) * 2.35), 8, 92);
    return U.randomInt(1, 100) <= chance;
  }

  function awardPlacement(state, comp, place, result) {
    var p = State.player(state);
    var awardLabel = comp.awardLabel + " · " + place;
    state.amateurPath.completed[comp.id] = true;
    state.amateurPath.points += comp.rewardRating;
    state.amateurPath.medals.unshift({ id: U.uid("medal"), week: state.week, competitionId: comp.id, label: comp.label, awardLabel: awardLabel, place: place, result: result });
    if (state.amateurPath.medals.length > 30) { state.amateurPath.medals.length = 30; }
    if (State.addFighterAward) { State.addFighterAward(state, p, awardLabel, "amateur"); }
    p.careerLog.unshift({ week: state.week, text: "Турнир: " + comp.label + " · " + awardLabel + "." });
  }

  function runTournament(state, compId) {
    var comp = getCompetition(compId);
    var status = competitionStatus(state, comp);
    var p = State.player(state);
    var used = {};
    var fights = [];
    var i;
    var roundLabel;
    var opponent;
    var win;
    var place = "";
    var result = "";

    ensureAmateurState(state);

    if (!status.available) {
      state.feed = status.reason;
      return { type: "tournamentResult", label: comp.label, blocked: true, reason: status.reason, fights: [] };
    }

    for (i = 0; i < comp.rounds.length; i += 1) {
      roundLabel = comp.rounds[i];
      opponent = findTournamentOpponent(state, comp, used);
      if (!opponent) { break; }
      used[opponent.id] = true;
      win = playerWinsRound(p, opponent);

      fights.push({ round: roundLabel, opponentId: opponent.id, opponentName: opponent.name, opponentRating: U.statAverage(opponent.stats), result: win ? "Победа" : "Поражение" });

      if (win) {
        p.record.wins += 1;
        opponent.record.losses += 1;
        p.trackRecords[p.trackId] = State.cloneRecord(p.record);
        opponent.trackRecords[opponent.trackId] = State.cloneRecord(opponent.record);
        State.updateDerivedFighterFields(p);
        State.updateDerivedFighterFields(opponent);
      } else {
        p.record.losses += 1;
        opponent.record.wins += 1;
        p.trackRecords[p.trackId] = State.cloneRecord(p.record);
        opponent.trackRecords[opponent.trackId] = State.cloneRecord(opponent.record);
        State.updateDerivedFighterFields(p);
        State.updateDerivedFighterFields(opponent);
        if (i >= comp.rounds.length - 2) { place = "3 место"; }
        else if (i >= comp.rounds.length - 1) { place = "2 место"; }
        result = "Вылет";
        break;
      }
    }

    if (!result) {
      place = "1 место";
      result = "Победа в турнире";
    }

    if (place) { awardPlacement(state, comp, place, result); }
    state.amateurPath.lastCompetitionWeekById[comp.id] = state.week;
    state.feed = result + ": " + comp.label + (place ? " · " + place : "") + ".";

    return { type: "tournamentResult", label: comp.label, result: result, place: place, reward: place ? comp.rewardRating : 0, fights: fights, cooldown: comp.weekCooldown, blocked: false };
  }

  function objectiveSummary(state) {
    var comps = availableCompetitions(state);
    var firstAvailable = comps.find(function (comp) { return comp.available; });
    var firstLocked = comps.find(function (comp) { return !comp.completed; });
    if (firstAvailable) { return { title: "Следующая цель", text: "Доступен турнир: " + firstAvailable.label + ".", next: firstAvailable }; }
    if (firstLocked) { return { title: "Следующая цель", text: firstLocked.label + ": " + firstLocked.reason, next: firstLocked }; }
    return { title: "Любительская лестница", text: "Все текущие ступени закрыты.", next: null };
  }

  function worldSummary(state) {
    ensureAmateurState(state);
    return { points: state.amateurPath.points, medals: state.amateurPath.medals.length, completed: Object.keys(state.amateurPath.completed).length, available: availableCompetitions(state).filter(function (comp) { return comp.available; }).length };
  }

  window.FS.Amateur = {
    ensureAmateurState: ensureAmateurState,
    getCompetition: getCompetition,
    availableCompetitions: availableCompetitions,
    runTournament: runTournament,
    createCompetitionOffer: function (state, compId) { return runTournament(state, compId); },
    completeCompetition: function () { return { finished: true, continueTournament: false }; },
    objectiveSummary: objectiveSummary,
    worldSummary: worldSummary,
    currentRoundLabel: function (offer) { return offer.bracketRoundLabel || "1/128"; }
  };
}());
