(function () {
  "use strict";
  window.FS = window.FS || {};
  var U = window.FS.Utils;
  var State = window.FS.State;
  var World = window.FS.World;

  function resultClass(result) {
    if (result === "Победа") { return "win"; }
    if (result === "Поражение") { return "loss"; }
    return "draw";
  }

  function findOffer(state, offerId) {
    var i;
    for (i = 0; i < state.offers.length; i += 1) {
      if (state.offers[i].id === offerId) { return state.offers[i]; }
    }
    return null;
  }

  function estimateWinChance(player, opponent) {
    var playerScore = U.scoreFighter(player);
    var opponentScore = U.scoreFighter(opponent);
    return U.clamp(50 + Math.round((playerScore - opponentScore) * 2.2), 12, 88);
  }

  function buildFightPreview(state, offerId) {
    var offer = findOffer(state, offerId);
    var p = State.player(state);
    var opponent;
    var difficulty;
    if (!offer || !p) { return null; }
    opponent = U.getFighterById(state, offer.opponentId);
    if (!opponent) { return null; }
    difficulty = U.findDifficulty(offer.difficultyId);
    return {
      type: "fightPreview",
      offerId: offer.id,
      label: offer.label,
      difficultyLabel: difficulty.label,
      opponentId: opponent.id,
      opponentName: opponent.name,
      rounds: offer.rounds,
      purse: offer.purse,
      winChance: estimateWinChance(p, opponent),
      playerRating: U.statAverage(p.stats),
      opponentRating: U.statAverage(opponent.stats),
      playerRecord: U.recordText(p.record),
      opponentRecord: U.recordText(opponent.record),
      weightClassLabel: U.formatWeightClass(p.weightClassId)
    };
  }

  function resolvePlayerFight(state, offerId) {
    var offer = findOffer(state, offerId);
    var p = State.player(state);
    var opponent;
    var winChance;
    var roll;
    var result;
    var method;
    var scoreLine;
    var koChance;

    if (!offer || !p) { return false; }
    opponent = U.getFighterById(state, offer.opponentId);
    if (!opponent) { return false; }

    winChance = estimateWinChance(p, opponent);
    roll = U.randomInt(1, 100);
    koChance = U.clamp(12 + Math.round((p.stats.power - opponent.stats.defense) * 0.45), 6, 35);

    if (Math.abs(U.scoreFighter(p) - U.scoreFighter(opponent)) <= 2 && U.randomInt(1, 100) <= 8) {
      result = "Ничья";
      method = "решение судей";
      scoreLine = "57:57";
      p.record.draws += 1;
      opponent.record.draws += 1;
    } else if (roll <= winChance) {
      result = "Победа";
      method = U.randomInt(1, 100) <= koChance ? "KO/TKO" : "решение судей";
      scoreLine = method === "KO/TKO" ? "остановка боя" : "59:55";
      p.record.wins += 1;
      opponent.record.losses += 1;
      if (method === "KO/TKO") { p.record.kos += 1; }
    } else {
      result = "Поражение";
      method = U.randomInt(1, 100) <= 18 ? "KO/TKO" : "решение судей";
      scoreLine = method === "KO/TKO" ? "остановка боя" : "55:59";
      p.record.losses += 1;
      opponent.record.wins += 1;
      if (method === "KO/TKO") { opponent.record.kos += 1; }
    }

    p.lastFightWeek = state.week;
    opponent.lastFightWeek = state.week;
    p.careerLog.unshift({ week: state.week, text: result + " против " + opponent.name + ", " + method });
    opponent.careerLog.unshift({ week: state.week, text: "Бой против " + p.name + ": " + result });
    State.updateDerivedFighterFields(p);
    State.updateDerivedFighterFields(opponent);

    state.modal = {
      type: "fightResult",
      result: result,
      method: method,
      scoreLine: scoreLine,
      opponentName: opponent.name,
      week: state.week,
      playerRating: U.statAverage(p.stats),
      opponentRating: U.statAverage(opponent.stats),
      purse: offer.purse,
      winChance: winChance
    };

    state.feed = "Неделя " + state.week + ": " + p.name + " vs " + opponent.name + " — " + result + ", " + method + ".";
    World.advanceWeek(state, "fight");
    return true;
  }

  window.FS.Fight = {
    buildFightPreview: buildFightPreview,
    resolvePlayerFight: resolvePlayerFight,
    resultClass: resultClass,
    estimateWinChance: estimateWinChance
  };
}());
