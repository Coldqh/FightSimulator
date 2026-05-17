(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;
  var State = window.FS.State;

  function careerTier(fighter) {
    var rating = U.statAverage(fighter.stats);
    var wins = fighter.record ? fighter.record.wins : 0;
    var losses = fighter.record ? fighter.record.losses : 0;
    var hasTitle = fighter.titles && fighter.titles.length > 0;

    if (hasTitle) {
      return { id: "champion", label: "Чемпион", level: 5 };
    }

    if (fighter.trackId === "pro") {
      if (rating >= 82 || wins >= 22) {
        return { id: "contender", label: "Контендер", level: 4 };
      }
      if (rating >= 58 || wins >= 10) {
        return { id: "prospect", label: "Проспект", level: 3 };
      }
      if (wins <= 3 && losses <= 2) {
        return { id: "debut", label: "Дебютант", level: 1 };
      }
      return { id: "journeyman", label: "Джорнимен", level: 2 };
    }

    if (fighter.trackId === "amateur") {
      if (rating >= 78) {
        return { id: "master", label: "Мастер", level: 4 };
      }
      if (rating >= 58) {
        return { id: "national", label: "Сборник", level: 3 };
      }
      if (rating >= 42) {
        return { id: "regional", label: "Разрядник", level: 2 };
      }
      return { id: "novice", label: "Новичок", level: 1 };
    }

    if (rating >= 100) {
      return { id: "street_king", label: "Король улицы", level: 4 };
    }
    if (rating >= 72) {
      return { id: "street_name", label: "Опасное имя", level: 3 };
    }
    if (rating >= 45) {
      return { id: "street_regular", label: "Местный боец", level: 2 };
    }
    return { id: "street_rookie", label: "Уличный новичок", level: 1 };
  }

  function careerStage(fighter) {
    var stages = Data.careerStages && Data.careerStages[fighter.trackId] ? Data.careerStages[fighter.trackId] : [];
    var rating = U.statAverage(fighter.stats);
    var current = stages[0] || { id: "base", label: "Базовый уровень", minRating: 1 };
    var i;

    for (i = 0; i < stages.length; i += 1) {
      if (rating >= stages[i].minRating) {
        current = stages[i];
      }
    }

    return current;
  }

  function normalizeRecordForFighter(fighter) {
    var rating = U.statAverage(fighter.stats);
    var wins;
    var losses;
    var draws;

    if (fighter.isPlayer) {
      return;
    }

    if (fighter.record && fighter.record.wins > 0 && fighter.record.wins <= 220 && fighter.record.losses <= 220) {
      return;
    }

    if (fighter.trackId === "pro") {
      if (rating >= 180) { wins = U.randomInt(28, 45); losses = U.randomInt(0, 2); }
      else if (rating >= 155) { wins = U.randomInt(21, 38); losses = U.randomInt(0, 4); }
      else if (rating >= 125) { wins = U.randomInt(14, 30); losses = U.randomInt(1, 7); }
      else if (rating >= 105) { wins = U.randomInt(7, 20); losses = U.randomInt(2, 10); }
      else { wins = U.randomInt(0, 10); losses = U.randomInt(0, 6); }
    } else if (fighter.trackId === "street") {
      if (rating >= 130) { wins = U.randomInt(55, 150); losses = U.randomInt(2, 18); }
      else if (rating >= 100) { wins = U.randomInt(30, 105); losses = U.randomInt(6, 38); }
      else if (rating >= 65) { wins = U.randomInt(12, 65); losses = U.randomInt(8, 55); }
      else if (rating >= 30) { wins = U.randomInt(4, 35); losses = U.randomInt(5, 45); }
      else { wins = U.randomInt(0, 14); losses = U.randomInt(0, 22); }
    } else {
      if (rating >= 90) { wins = U.randomInt(75, 165); losses = U.randomInt(3, 25); }
      else if (rating >= 75) { wins = U.randomInt(50, 130); losses = U.randomInt(7, 38); }
      else if (rating >= 60) { wins = U.randomInt(28, 85); losses = U.randomInt(10, 48); }
      else if (rating >= 40) { wins = U.randomInt(12, 48); losses = U.randomInt(8, 42); }
      else if (rating >= 20) { wins = U.randomInt(4, 28); losses = U.randomInt(5, 34); }
      else { wins = U.randomInt(0, 14); losses = U.randomInt(0, 20); }
    }

    draws = U.randomInt(0, Math.min(8, Math.floor((wins + losses) / 20)));
    fighter.record = {
      wins: wins,
      losses: losses,
      draws: draws,
      kos: U.randomInt(0, Math.max(0, Math.min(wins, Math.round(wins * (fighter.trackId === "amateur" ? 0.28 : 0.62)))))
    };
  }

  function normalizeRosterRecords(state) {
    var i;
    for (i = 0; i < state.roster.length; i += 1) {
      normalizeRecordForFighter(state.roster[i]);
    }
  }

  function opponentScoreTarget(player, difficultyId) {
    var difficulty = U.findDifficulty(difficultyId || "even");
    var base = U.scoreFighter(player);
    var trackOffset = player.trackId === "pro" ? 2 : (player.trackId === "street" ? 4 : 0);
    return base + difficulty.offset + trackOffset;
  }

  function candidatePenalty(player, candidate, targetScore) {
    var penalty = 0;
    var playerTier = careerTier(player);
    var candidateTier = careerTier(candidate);
    var scoreDiff = Math.abs(U.scoreFighter(candidate) - targetScore);

    penalty += scoreDiff * 3;
    penalty += Math.abs(U.statAverage(candidate.stats) - U.statAverage(player.stats)) * 1.4;
    penalty += Math.abs(candidateTier.level - playerTier.level) * 7;

    if (player.trackId !== "pro" && candidate.countryId !== player.countryId) {
      penalty += 40;
    }

    if (candidate.trackId !== player.trackId) {
      penalty += 100;
    }

    if (player.trackId !== "street" && candidate.weightClassId !== player.weightClassId) {
      penalty += 100;
    }

    if (candidate.lastFightWeek && window.FS.__currentStateWeek && window.FS.__currentStateWeek - candidate.lastFightWeek < 2) {
      penalty += 30;
    }

    return penalty;
  }

  function findOpponent(state, difficultyId, slotIndex, usedIds) {
    var player = State.player(state);
    var targetScore = opponentScoreTarget(player, difficultyId);
    var used = usedIds || {};
    var playerRank = player.trackId === "amateur" && State.rankForFighter ? State.rankForFighter(player) : null;
    var internationalAmateur = player.trackId === "amateur" && ["kms", "ms", "msmk"].indexOf(playerRank ? playerRank.id : "") !== -1;
    var candidates;
    var selected;
    window.FS.__currentStateWeek = state.week;
    candidates = state.roster.filter(function (fighter) {
      var tier = careerTier(fighter);
      var playerTier = careerTier(player);
      var isChampion = tier.id === "champion";
      var fRank = fighter.trackId === "amateur" && State.rankForFighter ? State.rankForFighter(fighter) : null;
      return !fighter.isPlayer && !fighter.retired && !used[fighter.id] &&
        (player.trackId === "pro" || internationalAmateur || fighter.countryId === player.countryId) &&
        fighter.trackId === player.trackId &&
        (player.trackId === "street" || fighter.weightClassId === player.weightClassId) &&
        (!internationalAmateur || ["kms", "ms", "msmk"].indexOf(fRank ? fRank.id : "") !== -1) &&
        (!isChampion || difficultyId === "hard" && playerTier.level >= 4);
    });
    candidates.sort(function (left, right) { return candidatePenalty(player, left, targetScore) - candidatePenalty(player, right, targetScore); });
    selected = candidates[slotIndex] || candidates[0] || null;
    if (!selected) {
      selected = State.createFighter(player.countryId, player.trackId, 12000 + state.week * 20 + slotIndex, U.statAverage(player.stats) + U.findDifficulty(difficultyId).offset, { weightClassId: player.trackId === "street" ? "" : player.weightClassId, gymId: player.gymId });
      normalizeRecordForFighter(selected);
      state.roster.push(selected);
      if (window.FS.Clubs) { window.FS.Clubs.assignFightersToClubs(state); }
    }
    used[selected.id] = true;
    return selected;
  }

  function offerLabel(playerTrackId, difficultyId) {
    var map = {
      amateur: {
        safe: "Проверочный любительский бой",
        even: "Рейтинговый любительский бой",
        hard: "Сильный отборочный бой"
      },
      street: {
        safe: "Локальный уличный бой",
        even: "Районный вызов",
        hard: "Опасный бой за статус"
      },
      pro: {
        safe: "Разогревочный профи-бой",
        even: "Контрактный бой",
        hard: "Бой с претендентом"
      }
    };

    return map[playerTrackId][difficultyId] || "Бой";
  }

  function buildPlayerOffers(state) {
    var player = State.player(state);
    var track = U.findTrack(player.trackId);
    var offers = [];
    var difficulties = Data.offerDifficulties;
    var used = {};
    var i;
    var difficulty;
    var opponent;

    for (i = 0; i < 3; i += 1) {
      difficulty = difficulties[i] || difficulties[1];
      opponent = findOpponent(state, difficulty.id, i, used);

      offers.push({
        id: U.uid("offer"),
        label: offerLabel(player.trackId, difficulty.id),
        difficultyId: difficulty.id,
        opponentId: opponent.id,
        rounds: track.rounds,
        purse: Math.max(0, Math.round((track.basePurse + i * Math.round(track.basePurse * 0.38)) * difficulty.purseMul)),
        opponentTier: careerTier(opponent).label,
        opponentStage: careerStage(opponent).label,
        risk: Math.max(1, U.statAverage(opponent.stats) - U.statAverage(player.stats) + 50)
      });
    }

    return offers;
  }

  function auditWorld(state) {
    var report = {
      fighters: state.roster.length,
      clubs: state.clubs.length,
      titles: Object.keys(state.titles || {}).length,
      offers: state.offers.length,
      repairedRecords: 0,
      missingGym: 0
    };
    var i;

    for (i = 0; i < state.roster.length; i += 1) {
      if (state.roster[i].record.wins > 80 || state.roster[i].record.losses > 80) {
        report.repairedRecords += 1;
        normalizeRecordForFighter(state.roster[i]);
      }
      if (!state.roster[i].gymId) {
        report.missingGym += 1;
      }
    }

    return report;
  }

  window.FS.Matchmaking = {
    careerTier: careerTier,
    careerStage: careerStage,
    normalizeRosterRecords: normalizeRosterRecords,
    normalizeRecordForFighter: normalizeRecordForFighter,
    findOpponent: findOpponent,
    buildPlayerOffers: buildPlayerOffers,
    auditWorld: auditWorld
  };
}());
