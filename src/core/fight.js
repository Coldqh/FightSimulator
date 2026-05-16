(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var State = window.FS.State;
  var World = window.FS.World;

  function resultClass(result) {
    if (result === "Победа") {
      return "win";
    }
    if (result === "Поражение") {
      return "loss";
    }
    return "draw";
  }

  function findOffer(state, offerId) {
    var i;
    for (i = 0; i < state.offers.length; i += 1) {
      if (state.offers[i].id === offerId) {
        return state.offers[i];
      }
    }
    return null;
  }

  function buildFightPreview(state, offerId) {
    var offer = findOffer(state, offerId);
    var p = State.player(state);
    var opponent;

    if (!offer || !p) {
      return null;
    }

    opponent = U.getFighterById(state, offer.opponentId);
    if (!opponent) {
      return null;
    }

    return {
      type: "fightPreview",
      offerId: offer.id,
      label: offer.label,
      opponentId: opponent.id,
      opponentName: opponent.name,
      rounds: offer.rounds,
      purse: offer.purse,
      playerRating: U.statAverage(p.stats),
      opponentRating: U.statAverage(opponent.stats),
      playerRecord: U.recordText(p.record),
      opponentRecord: U.recordText(opponent.record)
    };
  }

  function resolvePlayerFight(state, offerId) {
    var offer = findOffer(state, offerId);
    var p = State.player(state);
    var opponent;
    var playerScore;
    var opponentScore;
    var winChance;
    var roll;
    var result;
    var method;

    if (!offer || !p) {
      return false;
    }

    opponent = U.getFighterById(state, offer.opponentId);

    if (!opponent) {
      return false;
    }

    playerScore = U.statAverage(p.stats) + p.record.wins * 0.7 - p.record.losses * 0.35;
    opponentScore = U.statAverage(opponent.stats) + opponent.record.wins * 0.7 - opponent.record.losses * 0.35;
    winChance = U.clamp(50 + Math.round((playerScore - opponentScore) * 2.2), 12, 88);
    roll = U.randomInt(1, 100);

    if (Math.abs(playerScore - opponentScore) <= 2 && U.randomInt(1, 100) <= 8) {
      result = "Ничья";
      method = "решение судей";
      p.record.draws += 1;
      opponent.record.draws += 1;
    } else if (roll <= winChance) {
      result = "Победа";
      method = U.randomInt(1, 100) <= 22 ? "KO/TKO" : "решение судей";
      p.record.wins += 1;
      opponent.record.losses += 1;
      if (method === "KO/TKO") {
        p.record.kos += 1;
      }
    } else {
      result = "Поражение";
      method = U.randomInt(1, 100) <= 18 ? "KO/TKO" : "решение судей";
      p.record.losses += 1;
      opponent.record.wins += 1;
      if (method === "KO/TKO") {
        opponent.record.kos += 1;
      }
    }

    p.careerLog.unshift({ week: state.week, text: result + " против " + opponent.name + ", " + method });
    opponent.careerLog.unshift({ week: state.week, text: "Бой против " + p.name + ": " + result });

    State.updateDerivedFighterFields(p);
    State.updateDerivedFighterFields(opponent);

    state.modal = {
      type: "fightResult",
      result: result,
      method: method,
      opponentName: opponent.name,
      week: state.week,
      playerRating: U.statAverage(p.stats),
      opponentRating: U.statAverage(opponent.stats),
      purse: offer.purse
    };

    state.feed = "Неделя " + state.week + ": " + p.name + " vs " + opponent.name + " — " + result + ", " + method + ".";
    World.advanceWeek(state, "fight");
    return true;
  }

  window.FS.Fight = {
    buildFightPreview: buildFightPreview,
    resolvePlayerFight: resolvePlayerFight,
    resultClass: resultClass
  };
}());
