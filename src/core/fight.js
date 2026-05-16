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
    var playerScore = U.statAverage(player.stats) + tactic.power * 0.32 + tactic.defense * 0.25 + tactic.stamina * 0.16 + Math.min((player.record.wins || 0) * 0.22, 10) - Math.min((player.record.losses || 0) * 0.16, 7);
    var opponentScore = U.statAverage(opponent.stats) + Math.min((opponent.record.wins || 0) * 0.22, 10) - Math.min((opponent.record.losses || 0) * 0.16, 7);
    return U.clamp(50 + Math.round((playerScore - opponentScore) * 2.6), 10, 90);
  }

  function fightExpectation(winChance) {
    if (winChance >= 70) {
      return "Ты фаворит";
    }
    if (winChance >= 55) {
      return "Небольшое преимущество";
    }
    if (winChance >= 45) {
      return "Ровный бой";
    }
    if (winChance >= 30) {
      return "Ты андердог";
    }
    return "Очень опасный бой";
  }

  function buildFightPreview(state, offerId) {
    var offer = findOffer(state, offerId);
    var p = State.player(state);
    var opponent;
    var difficulty;
    var tacticId;
    var chance;

    if (!offer || !p) {
      return null;
    }

    opponent = U.getFighterById(state, offer.opponentId);
    if (!opponent) {
      return null;
    }

    difficulty = U.findDifficulty(offer.difficultyId);
    tacticId = state.selectedTacticId || "balanced";
    chance = estimateWinChance(p, opponent, tacticId);

    return {
      type: "fightPreview",
      offerId: offer.id,
      label: offer.label,
      difficultyLabel: difficulty.label,
      tacticId: tacticId,
      tacticLabel: U.findTactic(tacticId).label,
      expectation: fightExpectation(chance),
      opponentId: opponent.id,
      opponentName: opponent.name,
      rounds: offer.rounds,
      purse: offer.purse,
      winChance: chance,
      playerRating: U.statAverage(p.stats),
      opponentRating: U.statAverage(opponent.stats),
      playerRecord: U.recordText(p.record),
      opponentRecord: U.recordText(opponent.record),
      weightClassLabel: U.formatWeightClass(p.weightClassId)
    };
  }

  function roundScore(winner, hasKnockdown) {
    if (hasKnockdown) {
      return winner === "player" ? { player: 10, opponent: 8 } : { player: 8, opponent: 10 };
    }
    return winner === "player" ? { player: 10, opponent: 9 } : { player: 9, opponent: 10 };
  }

  function simulateRounds(player, opponent, rounds, tacticId) {
    var tactic = U.findTactic(tacticId || "balanced");
    var log = [];
    var playerRounds = 0;
    var opponentRounds = 0;
    var playerPoints = 0;
    var opponentPoints = 0;
    var playerEnergy = 100;
    var opponentEnergy = 100;
    var playerLanded = 0;
    var opponentLanded = 0;
    var i;
    var pRound;
    var oRound;
    var winner;
    var score;
    var kdBy = "";
    var knockdown = null;
    var pLanded;
    var oLanded;

    for (i = 1; i <= rounds; i += 1) {
      pLanded = U.clamp(Math.round((player.stats.technique + player.stats.speed) / 10) + U.randomInt(-3, 5), 1, 28);
      oLanded = U.clamp(Math.round((opponent.stats.technique + opponent.stats.speed) / 10) + U.randomInt(-3, 5), 1, 28);
      playerLanded += pLanded;
      opponentLanded += oLanded;

      pRound = U.scoreFighter(player) + tactic.power * 0.7 + tactic.defense * 0.35 + U.randomInt(-8, 8) + Math.round(playerEnergy / 12) + Math.round(pLanded / 3);
      oRound = U.scoreFighter(opponent) + U.randomInt(-8, 8) + Math.round(opponentEnergy / 12) + Math.round(oLanded / 3);

      playerEnergy = U.clamp(playerEnergy - U.randomInt(5, 11) + tactic.stamina, 0, 100);
      opponentEnergy = U.clamp(opponentEnergy - U.randomInt(6, 11), 0, 100);

      if (!knockdown && U.randomInt(1, 100) <= U.clamp(4 + Math.round((player.stats.power + tactic.ko - opponent.stats.defense) / 10), 2, 22)) {
        kdBy = "player";
        knockdown = { round: i, by: "player" };
        pRound += 10;
      } else if (!knockdown && U.randomInt(1, 100) <= U.clamp(3 + Math.round((opponent.stats.power - player.stats.defense - tactic.defense) / 10), 1, 18)) {
        kdBy = "opponent";
        knockdown = { round: i, by: "opponent" };
        oRound += 10;
      } else {
        kdBy = "";
      }

      winner = pRound >= oRound ? "player" : "opponent";
      score = roundScore(winner, !!kdBy);

      playerPoints += score.player;
      opponentPoints += score.opponent;

      if (winner === "player") {
        playerRounds += 1;
      } else {
        opponentRounds += 1;
      }

      log.push("Раунд " + i + ": " + (winner === "player" ? "твой раунд" : "раунд соперника") + " " + score.player + ":" + score.opponent + ". Точные удары " + pLanded + ":" + oLanded + (kdBy ? ". Нокдаун." : "."));
    }

    return {
      playerRounds: playerRounds,
      opponentRounds: opponentRounds,
      playerPoints: playerPoints,
      opponentPoints: opponentPoints,
      playerLanded: playerLanded,
      opponentLanded: opponentLanded,
      log: log,
      knockdown: knockdown
    };
  }

  function applyFightResult(state, p, opponent, result, method) {
    if (result === "Ничья") {
      p.record.draws += 1;
      opponent.record.draws += 1;
    } else if (result === "Победа") {
      p.record.wins += 1;
      opponent.record.losses += 1;
      if (method === "KO/TKO") {
        p.record.kos += 1;
      }
    } else {
      p.record.losses += 1;
      opponent.record.wins += 1;
      if (method === "KO/TKO") {
        opponent.record.kos += 1;
      }
    }

    State.updateDerivedFighterFields(p);
    State.updateDerivedFighterFields(opponent);
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
    koChance = U.clamp(9 + Math.round((p.stats.power + U.findTactic(tacticId).ko - opponent.stats.defense) * 0.42), 4, 34);

    if (Math.abs(roundData.playerPoints - roundData.opponentPoints) <= 1 && U.randomInt(1, 100) <= 14) {
      result = "Ничья";
      method = "решение судей";
    } else if (roll <= winChance || roundData.playerPoints > roundData.opponentPoints) {
      result = "Победа";
      method = U.randomInt(1, 100) <= koChance ? "KO/TKO" : "решение судей";
    } else {
      result = "Поражение";
      method = U.randomInt(1, 100) <= 18 ? "KO/TKO" : "решение судей";
    }

    scoreLine = method === "KO/TKO" ? "остановка боя" : roundData.playerPoints + ":" + roundData.opponentPoints;

    applyFightResult(state, p, opponent, result, method);

    p.lastFightWeek = state.week;
    opponent.lastFightWeek = state.week;
    p.careerLog.unshift({ week: state.week, text: result + " против " + opponent.name + ", " + method });
    opponent.careerLog.unshift({ week: state.week, text: "Бой против " + p.name + ": " + result });

    if (window.FS.Stories && (result === "Победа" || result === "Поражение")) {
      window.FS.Stories.addStory(state, p, result + " в бою против " + opponent.name + ".", "player_fight");
    }

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
      knockdown: roundData.knockdown,
      statsLine: "Точные удары: " + roundData.playerLanded + ":" + roundData.opponentLanded
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
    var chance;

    if (!p || !title) {
      return null;
    }

    check = window.FS.Titles ? window.FS.Titles.playerTitleChallenge(state, titleId) : { eligible: false, reason: "Титулы недоступны." };
    champion = U.getFighterById(state, title.championId);

    if (!champion) {
      return null;
    }

    chance = estimateWinChance(p, champion, state.selectedTacticId || "balanced");

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
      winChance: chance,
      expectation: fightExpectation(chance),
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
