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

  function estimateWinChance(player, opponent, tacticId) {
    var tactic = U.findTactic(tacticId || "balanced");
    var playerScore = U.statAverage(player.stats) + tactic.power * 0.35 + tactic.defense * 0.25 + tactic.stamina * 0.15 + Math.min((player.record.wins || 0) * 0.25, 12);
    var opponentScore = U.statAverage(opponent.stats) + Math.min((opponent.record.wins || 0) * 0.25, 12) - Math.min((opponent.record.losses || 0) * 0.12, 8);
    return U.clamp(50 + Math.round((playerScore - opponentScore) * 2.5), 12, 88);
  }

  function buildFightPreview(state, offerId) {
    var offer = findOffer(state, offerId);
    var p = State.player(state);
    var opponent;
    var difficulty;
    var tacticId;

    if (!offer || !p) {
      return null;
    }

    opponent = U.getFighterById(state, offer.opponentId);
    if (!opponent) {
      return null;
    }

    difficulty = U.findDifficulty(offer.difficultyId);
    tacticId = state.selectedTacticId || "balanced";

    return {
      type: "fightPreview",
      offerId: offer.id,
      label: offer.label,
      difficultyLabel: difficulty.label,
      tacticId: tacticId,
      tacticLabel: U.findTactic(tacticId).label,
      opponentId: opponent.id,
      opponentName: opponent.name,
      rounds: offer.rounds,
      purse: offer.purse,
      winChance: estimateWinChance(p, opponent, tacticId),
      playerRating: U.statAverage(p.stats),
      opponentRating: U.statAverage(opponent.stats),
      playerRecord: U.recordText(p.record),
      opponentRecord: U.recordText(opponent.record),
      weightClassLabel: U.formatWeightClass(p.weightClassId)
    };
  }

  function simulateRounds(player, opponent, rounds, tacticId) {
    var tactic = U.findTactic(tacticId || "balanced");
    var log = [];
    var playerRounds = 0;
    var opponentRounds = 0;
    var playerEnergy = 100;
    var opponentEnergy = 100;
    var i;
    var pRound;
    var oRound;
    var knockdown = null;

    for (i = 1; i <= rounds; i += 1) {
      pRound = U.scoreFighter(player) + tactic.power * 0.7 + tactic.defense * 0.35 + U.randomInt(-8, 8) + Math.round(playerEnergy / 12);
      oRound = U.scoreFighter(opponent) + U.randomInt(-8, 8) + Math.round(opponentEnergy / 12);

      playerEnergy = U.clamp(playerEnergy - U.randomInt(5, 11) + tactic.stamina, 0, 100);
      opponentEnergy = U.clamp(opponentEnergy - U.randomInt(6, 11), 0, 100);

      if (!knockdown && U.randomInt(1, 100) <= U.clamp(4 + Math.round((player.stats.power + tactic.ko - opponent.stats.defense) / 10), 2, 22)) {
        knockdown = { round: i, by: "player" };
        pRound += 10;
      } else if (!knockdown && U.randomInt(1, 100) <= U.clamp(3 + Math.round((opponent.stats.power - player.stats.defense - tactic.defense) / 10), 1, 18)) {
        knockdown = { round: i, by: "opponent" };
        oRound += 10;
      }

      if (pRound >= oRound) {
        playerRounds += 1;
        log.push("Раунд " + i + ": твой раунд.");
      } else {
        opponentRounds += 1;
        log.push("Раунд " + i + ": раунд соперника.");
      }
    }

    return {
      playerRounds: playerRounds,
      opponentRounds: opponentRounds,
      log: log,
      knockdown: knockdown
    };
  }

  function resolvePlayerFight(state, offerId) {
    var offer = findOffer(state, offerId);
    var p = State.player(state);
    var opponent;
    var tacticId;
    var winChance;
    var roll;
    var result;
    var method;
    var scoreLine;
    var roundData;
    var koChance;

    if (!offer || !p) {
      return false;
    }

    opponent = U.getFighterById(state, offer.opponentId);
    if (!opponent) {
      return false;
    }

    tacticId = state.selectedTacticId || "balanced";
    winChance = estimateWinChance(p, opponent, tacticId);
    roll = U.randomInt(1, 100);
    roundData = simulateRounds(p, opponent, offer.rounds, tacticId);
    koChance = U.clamp(10 + Math.round((p.stats.power + U.findTactic(tacticId).ko - opponent.stats.defense) * 0.45), 5, 38);

    if (Math.abs(U.scoreFighter(p) - U.scoreFighter(opponent)) <= 2 && U.randomInt(1, 100) <= 8) {
      result = "Ничья";
      method = "решение судей";
      scoreLine = roundData.playerRounds + ":" + roundData.opponentRounds;
      p.record.draws += 1;
      opponent.record.draws += 1;
    } else if (roll <= winChance || roundData.playerRounds > roundData.opponentRounds) {
      result = "Победа";
      method = U.randomInt(1, 100) <= koChance ? "KO/TKO" : "решение судей";
      scoreLine = method === "KO/TKO" ? "остановка боя" : roundData.playerRounds + ":" + roundData.opponentRounds;
      p.record.wins += 1;
      opponent.record.losses += 1;
      if (method === "KO/TKO") {
        p.record.kos += 1;
      }
    } else {
      result = "Поражение";
      method = U.randomInt(1, 100) <= 18 ? "KO/TKO" : "решение судей";
      scoreLine = method === "KO/TKO" ? "остановка боя" : roundData.playerRounds + ":" + roundData.opponentRounds;
      p.record.losses += 1;
      opponent.record.wins += 1;
      if (method === "KO/TKO") {
        opponent.record.kos += 1;
      }
    }

    p.lastFightWeek = state.week;
    opponent.lastFightWeek = state.week;
    p.careerLog.unshift({ week: state.week, text: result + " против " + opponent.name + ", " + method });
    opponent.careerLog.unshift({ week: state.week, text: "Бой против " + p.name + ": " + result });

    if (window.FS.Stories && (result === "Победа" || result === "Поражение")) {
      window.FS.Stories.addStory(state, p, result + " в бою против " + opponent.name + ".", "player_fight");
    }

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
      winChance: winChance,
      roundLog: roundData.log,
      knockdown: roundData.knockdown
    };

    state.feed = "Неделя " + state.week + ": " + p.name + " vs " + opponent.name + " — " + result + ", " + method + ".";
    World.advanceWeek(state, "fight");
    return true;
  }


  function buildTitleChallengePreview(state, titleId) {
    var p = State.player(state);
    var title = state.titles ? state.titles[titleId] : null;
    var champion;
    var check;

    if (!p || !title) {
      return null;
    }

    check = window.FS.Titles ? window.FS.Titles.playerTitleChallenge(state, titleId) : { eligible: false, reason: "Титулы недоступны." };
    champion = U.getFighterById(state, title.championId);

    if (!champion) {
      return null;
    }

    return {
      type: "titleChallengePreview",
      titleId: title.id,
      titleLabel: title.label,
      eligible: check.eligible,
      reason: check.reason,
      championId: champion.id,
      championName: champion.name,
      rounds: U.findTrack(title.trackId).rounds,
      purse: Math.round(U.findTrack(title.trackId).basePurse * 2.25),
      winChance: estimateWinChance(p, champion, state.selectedTacticId || "balanced"),
      playerRating: U.statAverage(p.stats),
      championRating: U.statAverage(champion.stats),
      playerRecord: U.recordText(p.record),
      championRecord: U.recordText(champion.record),
      weightClassLabel: U.formatWeightClass(title.weightClassId)
    };
  }

  function resolveTitleChallenge(state, titleId) {
    var title = state.titles ? state.titles[titleId] : null;
    var p = State.player(state);
    var champion;
    var fakeOffer;
    var beforeWins;

    if (!title || !p || !window.FS.Titles || !window.FS.Titles.playerTitleChallenge(state, titleId).eligible) {
      state.feed = "Вызов чемпиону сейчас недоступен.";
      return false;
    }

    champion = U.getFighterById(state, title.championId);
    if (!champion) {
      return false;
    }

    fakeOffer = {
      id: "title_" + title.id,
      opponentId: champion.id,
      rounds: U.findTrack(title.trackId).rounds,
      purse: Math.round(U.findTrack(title.trackId).basePurse * 2.25),
      difficultyId: "hard"
    };

    state.offers.push(fakeOffer);
    beforeWins = p.record.wins;
    resolvePlayerFight(state, fakeOffer.id);
    state.offers = state.offers.filter(function (offer) {
      return offer.id !== fakeOffer.id;
    });

    if (p.record.wins > beforeWins) {
      window.FS.Titles.transferTitle(state, title.id, p.id, p.name + " выиграл титульный бой: " + title.label);
      state.feed = "Ты выиграл титул: " + title.label + ".";
      if (window.FS.Stories) {
        window.FS.Stories.addStory(state, p, "стал чемпионом: " + title.label + ".", "player_title");
      }
    }

    return true;
  }


  window.FS.Fight = {
    buildFightPreview: buildFightPreview,
    resolvePlayerFight: resolvePlayerFight,
    resultClass: resultClass,
    estimateWinChance: estimateWinChance,
    simulateRounds: simulateRounds,
    buildTitleChallengePreview: buildTitleChallengePreview,
    resolveTitleChallenge: resolveTitleChallenge
  };
}());
