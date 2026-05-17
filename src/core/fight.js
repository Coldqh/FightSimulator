(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;
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

  function estimateWinChance(player, opponent) {
    var playerScore = U.statAverage(player.stats) + Math.min((player.record.wins || 0) * 0.20, 14) - Math.min((player.record.losses || 0) * 0.14, 9);
    var opponentScore = U.statAverage(opponent.stats) + Math.min((opponent.record.wins || 0) * 0.20, 14) - Math.min((opponent.record.losses || 0) * 0.14, 9);
    var fatiguePenalty = Math.round((Number(player.fatigue) || 0) / 7);
    return U.clamp(50 + Math.round((playerScore - opponentScore) * 2.55) - fatiguePenalty, 8, 90);
  }

  function fightExpectation() {
    return "";
  }

  function buildFightPreview(state, offerId) {
    var offer = findOffer(state, offerId);
    var p = State.player(state);
    var opponent;
    var difficulty;
    var chance;
    var purse;

    if (!offer || !p) {
      return null;
    }

    opponent = U.getFighterById(state, offer.opponentId);
    if (!opponent) {
      return null;
    }

    difficulty = U.findDifficulty(offer.difficultyId);
    chance = estimateWinChance(p, opponent);
    purse = Math.max(0, Math.round((Number(offer.purse) || 0) * (Data.economy && Data.economy.fightIncomeMultiplier ? (Data.economy.fightIncomeMultiplier[p.trackId] || 1) : 1)));

    return {
      type: "fightPreview",
      offerId: offer.id,
      label: offer.label,
      difficultyLabel: difficulty.label,
      opponentId: opponent.id,
      opponentName: opponent.name,
      rounds: offer.rounds,
      purse: purse,
      winChance: chance,
      playerRating: U.statAverage(p.stats),
      opponentRating: U.statAverage(opponent.stats),
      playerRecord: U.recordText(p.record),
      opponentRecord: U.recordText(opponent.record),
      weightClassLabel: U.formatWeightClass(p.weightClassId),
      opponentTier: window.FS.Matchmaking ? window.FS.Matchmaking.careerTier(opponent).label : "Боец",
      opponentStage: window.FS.Matchmaking ? window.FS.Matchmaking.careerStage(opponent).label : "Базовый уровень"
    };
  }

  function roundScore(winner, hasKnockdown) {
    if (hasKnockdown) {
      return winner === "player" ? { player: 10, opponent: 8 } : { player: 8, opponent: 10 };
    }
    return winner === "player" ? { player: 10, opponent: 9 } : { player: 9, opponent: 10 };
  }

  function maxHp(fighter) {
    return Math.max(50, Math.round(65 + fighter.stats.stamina * 0.55 + fighter.stats.defense * 0.22));
  }

  function hitChance(attacker, defender) {
    return U.clamp(42 + Math.round(attacker.stats.technique * 0.34 + attacker.stats.speed * 0.24 - defender.stats.defense * 0.30 - defender.stats.speed * 0.12), 12, 88);
  }

  function punchDamage(attacker, defender) {
    var raw = attacker.stats.power * 0.28 + attacker.stats.technique * 0.10 + U.randomInt(1, 7);
    var block = defender.stats.defense * 0.13 + defender.stats.stamina * 0.03;
    var damage = Math.round(raw - block);
    if (U.randomInt(1, 100) <= U.clamp(4 + Math.round((attacker.stats.power - defender.stats.defense) / 12), 2, 18)) {
      damage += Math.max(2, Math.round(attacker.stats.power * 0.08));
    }
    return U.clamp(damage, 1, 34);
  }

  function fighterLabel(fighter, fallback) {
    return fighter && fighter.isPlayer ? "Ты" : (fighter && fighter.name ? fighter.name : fallback);
  }

  function simulateTurn(attacker, defender, attackerState, defenderState, labels) {
    var chance = hitChance(attacker, defender);
    var roll = U.randomInt(1, 100);
    var damage = 0;
    var hit = roll <= chance;
    var line;

    if (hit) {
      damage = punchDamage(attacker, defender);
      defenderState.hp = Math.max(0, defenderState.hp - damage);
      attackerState.landed += 1;
      attackerState.damage += damage;
      line = labels.attacker + " попадает. Урон " + damage + ". HP " + labels.defenderGen + ": " + defenderState.hp + "/" + defenderState.maxHp + ".";
    } else {
      line = labels.attacker + " промахивается.";
    }

    return {
      hit: hit,
      damage: damage,
      line: line
    };
  }

  function simulateRounds(player, opponent, rounds) {
    var log = [];
    var playerRounds = 0;
    var opponentRounds = 0;
    var playerPoints = 0;
    var opponentPoints = 0;
    var playerState = { hp: maxHp(player), maxHp: maxHp(player), landed: 0, damage: 0 };
    var opponentState = { hp: maxHp(opponent), maxHp: maxHp(opponent), landed: 0, damage: 0 };
    var knockdown = null;
    var stoppage = null;
    var round;
    var turn;
    var firstIsPlayer;
    var playerRoundDamage;
    var opponentRoundDamage;
    var result;
    var score;
    var exchanges;

    for (round = 1; round <= rounds; round += 1) {
      playerRoundDamage = 0;
      opponentRoundDamage = 0;
      exchanges = 6 + Math.min(4, Math.floor((player.stats.stamina + opponent.stats.stamina) / 80));

      for (turn = 1; turn <= exchanges; turn += 1) {
        firstIsPlayer = (round + turn) % 2 === 0;

        if (firstIsPlayer) {
          result = simulateTurn(player, opponent, playerState, opponentState, { attacker: fighterLabel(player, "Ты"), defenderGen: "соперника" });
          playerRoundDamage += result.damage;
          log.push("Раунд " + round + ", ход " + turn + ": " + result.line);
          if (opponentState.hp <= 0) { stoppage = { winner: "player", round: round, turn: turn }; break; }

          result = simulateTurn(opponent, player, opponentState, playerState, { attacker: fighterLabel(opponent, "Соперник"), defenderGen: "твой" });
          opponentRoundDamage += result.damage;
          log.push("Раунд " + round + ", ответ " + turn + ": " + result.line);
          if (playerState.hp <= 0) { stoppage = { winner: "opponent", round: round, turn: turn }; break; }
        } else {
          result = simulateTurn(opponent, player, opponentState, playerState, { attacker: fighterLabel(opponent, "Соперник"), defenderGen: "твой" });
          opponentRoundDamage += result.damage;
          log.push("Раунд " + round + ", ход " + turn + ": " + result.line);
          if (playerState.hp <= 0) { stoppage = { winner: "opponent", round: round, turn: turn }; break; }

          result = simulateTurn(player, opponent, playerState, opponentState, { attacker: fighterLabel(player, "Ты"), defenderGen: "соперника" });
          playerRoundDamage += result.damage;
          log.push("Раунд " + round + ", ответ " + turn + ": " + result.line);
          if (opponentState.hp <= 0) { stoppage = { winner: "player", round: round, turn: turn }; break; }
        }
      }

      if (playerRoundDamage === opponentRoundDamage) {
        if (U.scoreFighter(player) >= U.scoreFighter(opponent)) { playerRoundDamage += 1; }
        else { opponentRoundDamage += 1; }
      }

      if (playerRoundDamage > opponentRoundDamage) {
        score = roundScore("player", false);
        playerRounds += 1;
      } else {
        score = roundScore("opponent", false);
        opponentRounds += 1;
      }

      playerPoints += score.player;
      opponentPoints += score.opponent;
      log.push("Раунд " + round + " итог: урон " + playerRoundDamage + ":" + opponentRoundDamage + ", счёт " + score.player + ":" + score.opponent + ".");

      if (stoppage) {
        knockdown = { round: round, by: stoppage.winner };
        log.push("Бой остановлен. Победитель: " + (stoppage.winner === "player" ? "ты" : "соперник") + ".");
        break;
      }
    }

    return {
      playerRounds: playerRounds,
      opponentRounds: opponentRounds,
      playerPoints: playerPoints,
      opponentPoints: opponentPoints,
      playerLanded: playerState.landed,
      opponentLanded: opponentState.landed,
      playerDamage: playerState.damage,
      opponentDamage: opponentState.damage,
      playerHpLeft: playerState.hp,
      opponentHpLeft: opponentState.hp,
      playerMaxHp: playerState.maxHp,
      opponentMaxHp: opponentState.maxHp,
      log: log,
      knockdown: knockdown,
      stoppage: stoppage
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

    if (p.trackRecords) {
      p.trackRecords[p.trackId] = window.FS.State.cloneRecord(p.record);
    }
    if (opponent.trackRecords) {
      opponent.trackRecords[opponent.trackId] = window.FS.State.cloneRecord(opponent.record);
    }

    State.updateDerivedFighterFields(p);
    State.updateDerivedFighterFields(opponent);
    p.recentOpponentIds = p.recentOpponentIds instanceof Array ? p.recentOpponentIds : [];
    opponent.recentOpponentIds = opponent.recentOpponentIds instanceof Array ? opponent.recentOpponentIds : [];
    p.recentOpponentIds.unshift(opponent.id); opponent.recentOpponentIds.unshift(p.id);
    if (p.recentOpponentIds.length > 8) { p.recentOpponentIds.length = 8; }
    if (opponent.recentOpponentIds.length > 8) { opponent.recentOpponentIds.length = 8; }
    if (window.FS.Clubs && window.FS.Clubs.recordClubFight) {
      if (result === "Ничья") { window.FS.Clubs.recordClubFight(state, p, opponent, true); }
      else { window.FS.Clubs.recordClubFight(state, result === "Победа" ? p : opponent, result === "Победа" ? opponent : p, false); }
    }
  }

  function resolvePlayerFight(state, offerId) {
    var offer = findOffer(state, offerId);
    var p = State.player(state);
    var opponent;
    var winChance;
    var result;
    var method;
    var scoreLine;
    var roundData;

    if (!offer || !p) {
      return false;
    }

    opponent = U.getFighterById(state, offer.opponentId);
    if (!opponent) {
      return false;
    }

    winChance = estimateWinChance(p, opponent);
    roundData = simulateRounds(p, opponent, offer.rounds);

    if (roundData.stoppage) {
      result = roundData.stoppage.winner === "player" ? "Победа" : "Поражение";
      method = "KO/TKO";
      scoreLine = "остановка боя, раунд " + roundData.stoppage.round;
    } else if (roundData.playerPoints === roundData.opponentPoints) {
      result = "Ничья";
      method = "решение судей";
      scoreLine = roundData.playerPoints + ":" + roundData.opponentPoints;
    } else if (roundData.playerPoints > roundData.opponentPoints) {
      result = "Победа";
      method = "решение судей";
      scoreLine = roundData.playerPoints + ":" + roundData.opponentPoints;
    } else {
      result = "Поражение";
      method = "решение судей";
      scoreLine = roundData.playerPoints + ":" + roundData.opponentPoints;
    }

    applyFightResult(state, p, opponent, result, method);

    var pointMod = 1;
    var club = window.FS.Clubs && window.FS.Clubs.playerClub ? window.FS.Clubs.playerClub(state) : null;
    var incomeMul = Data.economy && Data.economy.fightIncomeMultiplier ? (Data.economy.fightIncomeMultiplier[p.trackId] || 1) : 1;
    var purse = Math.max(0, Math.round((Number(offer.purse) || 0) * incomeMul));
    if (club) { pointMod = Number(club.trainingModifier) || 1; }
    p.trainingPoints = (Number(p.trainingPoints) || 0) + Math.max(1, Math.round((result === "Победа" ? 4 : (result === "Ничья" ? 2 : 1)) * pointMod));
    if (State.addMoney) { State.addMoney(state, purse, "Гонорар за бой"); } else { p.money = (Number(p.money) || 0) + purse; }
    if (State.adjustFatigue) { State.adjustFatigue(state, Data.economy && Data.economy.fatigue ? Data.economy.fatigue.fight : 18, "Бой"); }

    if (result === "Победа" && window.FS.Titles && window.FS.Titles.unifyBeltsAfterFight) {
      window.FS.Titles.unifyBeltsAfterFight(state, p.id, opponent.id);
    }

    var competitionStatus = null;
    if (offer.isCompetition && window.FS.Amateur && window.FS.Amateur.completeCompetition) {
      competitionStatus = window.FS.Amateur.completeCompetition(state, offer, result);
    }

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
      purse: purse,
      winChance: winChance,
      roundLog: roundData.log,
      knockdown: roundData.knockdown,
      statsLine: "Урон: " + roundData.playerDamage + ":" + roundData.opponentDamage + ". Попадания: " + roundData.playerLanded + ":" + roundData.opponentLanded + ". HP: " + roundData.playerHpLeft + "/" + roundData.playerMaxHp + " — " + roundData.opponentHpLeft + "/" + roundData.opponentMaxHp + "."
    };

    if (offer.isCompetition) {
      if (!competitionStatus || competitionStatus.finished) {
        state.offers = state.offers.filter(function (existingOffer) {
          return existingOffer.id !== offer.id;
        });
      }

      state.modal.nextRound = competitionStatus && competitionStatus.continueTournament ? competitionStatus.nextRound : "";
      state.modal.tournamentStillRunning = !!(competitionStatus && competitionStatus.continueTournament);
      state.feed = state.feed || ("Турнирный бой: " + result + ".");
      return true;
    }

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

    chance = estimateWinChance(p, champion);

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
