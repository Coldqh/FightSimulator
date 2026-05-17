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
        id: comp.id, label: comp.label, awardLabel: comp.awardLabel,
        minRating: comp.minRating, maxRating: comp.maxRating, rewardRating: comp.rewardRating,
        difficultyId: comp.difficultyId, available: status.available, reason: status.reason,
        cooldownLeft: status.cooldownLeft, completed: !!state.amateurPath.completed[comp.id]
      };
    });
  }

  function countryPool(state, comp) {
    var p = State.player(state);
    var playerCountry = U.findCountry(p.countryId);
    if (comp.scope === "continent") { return Data.countries.filter(function (country) { return country.continentId === playerCountry.continentId; }); }
    if (comp.scope === "world" || comp.scope === "world_elite") { return Data.countries.slice(); }
    return [playerCountry];
  }

  function candidatePool(state, comp, usedIds) {
    var p = State.player(state);
    var countries = countryPool(state, comp).map(function (country) { return country.id; });
    var min = typeof comp.minOpponentRating === "number" ? comp.minOpponentRating : comp.minRating;
    var max = typeof comp.maxRating === "number" ? comp.maxRating : 100;
    return state.roster.filter(function (fighter) {
      var rating = U.statAverage(fighter.stats);
      return !fighter.isPlayer && !fighter.retired && !usedIds[fighter.id] && fighter.trackId === "amateur" &&
        fighter.weightClassId === p.weightClassId && countries.indexOf(fighter.countryId) !== -1 && rating >= min && rating <= max;
    });
  }

  function tournamentRoundsForSize(size) {
    var all = [
      { size: 128, label: "1/128" }, { size: 64, label: "1/64" }, { size: 32, label: "1/32" },
      { size: 16, label: "1/16" }, { size: 8, label: "1/8" }, { size: 4, label: "Четвертьфинал" },
      { size: 2, label: "Полуфинал" }, { size: 1, label: "Финал" }
    ];
    var start = all.findIndex(function (stage) { return size >= stage.size; });
    if (start < 0) { start = all.length - 1; }
    return all.slice(start).map(function (stage) { return stage.label; });
  }

  function pickOpponent(state, comp, session) {
    var pool = candidatePool(state, comp, session.usedOpponentIds || {});
    if (!pool.length) { return null; }
    return pool[U.randomInt(0, pool.length - 1)];
  }

  function winChance(player, opponent) {
    return U.clamp(50 + Math.round((U.scoreFighter(player) - U.scoreFighter(opponent)) * 2.25), 8, 92);
  }

  function buildFightModal(state, session, blockedReason) {
    var p = State.player(state);
    var comp = getCompetition(session.competitionId);
    var opponent = session.opponentId ? U.getFighterById(state, session.opponentId) : null;
    if (blockedReason) { return { type: "tournamentFinal", label: comp.label, blocked: true, reason: blockedReason, session: session }; }
    if (!opponent) { return { type: "tournamentFinal", label: comp.label, blocked: true, reason: "Не найден соперник.", session: session }; }
    return {
      type: "tournamentFight",
      label: comp.label,
      competitionId: comp.id,
      roundIndex: session.roundIndex,
      roundLabel: session.rounds[session.roundIndex],
      roundsTotal: session.rounds.length,
      opponentId: opponent.id,
      opponentName: opponent.name,
      opponentCountry: U.findCountry(opponent.countryId).label,
      opponentRecord: U.recordText(opponent.record),
      opponentRating: U.statAverage(opponent.stats),
      playerRating: U.statAverage(p.stats),
      winChance: winChance(p, opponent),
      session: session
    };
  }

  function startTournament(state, compId) {
    var comp = getCompetition(compId);
    var status = competitionStatus(state, comp);
    var pool;
    var session;
    var opponent;
    ensureAmateurState(state);
    if (!status.available) { state.feed = status.reason; return { type: "tournamentFinal", label: comp.label, blocked: true, reason: status.reason, fights: [] }; }
    session = { competitionId: comp.id, roundIndex: 0, rounds: [], usedOpponentIds: {}, fights: [], reward: comp.rewardRating };
    pool = candidatePool(state, comp, session.usedOpponentIds);
    session.rounds = tournamentRoundsForSize(pool.length + 1);
    opponent = pickOpponent(state, comp, session);
    if (!opponent) { return buildFightModal(state, session, "Недостаточно реальных соперников в рейтинге для этого турнира."); }
    session.usedOpponentIds[opponent.id] = true;
    session.opponentId = opponent.id;
    state.feed = "Турнир начат: " + comp.label + ". Этап: " + session.rounds[0] + ".";
    return buildFightModal(state, session, "");
  }

  function applyResult(state, player, opponent, result) {
    if (result === "Победа") { player.record.wins += 1; opponent.record.losses += 1; }
    else { player.record.losses += 1; opponent.record.wins += 1; }
    player.trackRecords[player.trackId] = State.cloneRecord(player.record);
    opponent.trackRecords[opponent.trackId] = State.cloneRecord(opponent.record);
    State.updateDerivedFighterFields(player);
    State.updateDerivedFighterFields(opponent);
    if (window.FS.Clubs && window.FS.Clubs.recordClubFight) { window.FS.Clubs.recordClubFight(state, result === "Победа" ? player : opponent, result === "Победа" ? opponent : player, false); }
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

  function resolveTournamentRound(state, modal) {
    var session = modal.session;
    var comp = getCompetition(session.competitionId);
    var p = State.player(state);
    var opponent = U.getFighterById(state, session.opponentId);
    var chance = opponent ? winChance(p, opponent) : 0;
    var won = opponent && U.randomInt(1, 100) <= chance;
    var nextOpponent;
    var place = "";
    if (!opponent) { return { type: "tournamentFinal", label: comp.label, blocked: true, reason: "Соперник исчез из турнира.", fights: session.fights || [] }; }
    applyResult(state, p, opponent, won ? "Победа" : "Поражение");
    session.fights.push({ round: session.rounds[session.roundIndex], opponentId: opponent.id, opponentName: opponent.name, opponentRating: U.statAverage(opponent.stats), winChance: chance, result: won ? "Победа" : "Поражение" });
    if (!won) {
      if (session.roundIndex >= session.rounds.length - 2) { place = "3 место"; awardPlacement(state, comp, place, "Вылет"); }
      state.amateurPath.lastCompetitionWeekById[comp.id] = state.week;
      state.feed = "Вылет из турнира: " + comp.label + (place ? " · " + place : "") + ".";
      return { type: "tournamentFinal", label: comp.label, result: "Вылет", place: place, reward: place ? comp.rewardRating : 0, cooldown: comp.weekCooldown, fights: session.fights, blocked: false };
    }
    if (session.roundIndex >= session.rounds.length - 1) {
      place = "1 место";
      awardPlacement(state, comp, place, "Победа в турнире");
      state.amateurPath.lastCompetitionWeekById[comp.id] = state.week;
      state.feed = "Победа в турнире: " + comp.label + " · 1 место.";
      return { type: "tournamentFinal", label: comp.label, result: "Победа в турнире", place: place, reward: comp.rewardRating, cooldown: comp.weekCooldown, fights: session.fights, blocked: false };
    }
    session.roundIndex += 1;
    nextOpponent = pickOpponent(state, comp, session);
    if (!nextOpponent) {
      place = "1 место";
      awardPlacement(state, comp, place, "Победа в турнире");
      state.amateurPath.lastCompetitionWeekById[comp.id] = state.week;
      return { type: "tournamentFinal", label: comp.label, result: "Победа в турнире", place: place, reward: comp.rewardRating, cooldown: comp.weekCooldown, fights: session.fights, blocked: false };
    }
    session.usedOpponentIds[nextOpponent.id] = true;
    session.opponentId = nextOpponent.id;
    state.feed = "Турнир продолжается: " + comp.label + ". Этап: " + session.rounds[session.roundIndex] + ".";
    return buildFightModal(state, session, "");
  }

  function worldSummary(state) {
    ensureAmateurState(state);
    return { points: state.amateurPath.points, medals: state.amateurPath.medals.length, completed: Object.keys(state.amateurPath.completed).length, available: availableCompetitions(state).filter(function (comp) { return comp.available; }).length };
  }

  window.FS.Amateur = {
    ensureAmateurState: ensureAmateurState,
    getCompetition: getCompetition,
    availableCompetitions: availableCompetitions,
    startTournament: startTournament,
    resolveTournamentRound: resolveTournamentRound,
    runTournament: startTournament,
    createCompetitionOffer: function (state, compId) { return startTournament(state, compId); },
    completeCompetition: function () { return { finished: true, continueTournament: false }; },
    objectiveSummary: function () { return { title: "", text: "", next: null }; },
    worldSummary: worldSummary
  };
}());
