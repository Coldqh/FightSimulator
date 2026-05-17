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

    if (fighter.trackId === "street") {
      wins = rating >= 120 ? U.randomInt(80, 190) : rating >= 80 ? U.randomInt(35, 130) : U.randomInt(3, 55);
      losses = rating >= 120 ? U.randomInt(3, 30) : rating >= 80 ? U.randomInt(8, 55) : U.randomInt(4, 80);
    } else if (fighter.trackId === "amateur") {
      if (rating >= 91) { wins = U.randomInt(100, 200); losses = U.randomInt(5, 35); }
      else if (rating >= 76) { wins = U.randomInt(65, 150); losses = U.randomInt(8, 45); }
      else if (rating >= 61) { wins = U.randomInt(35, 110); losses = U.randomInt(10, 60); }
      else if (rating >= 31) { wins = U.randomInt(8, 50); losses = U.randomInt(5, 50); }
      else { wins = U.randomInt(0, 20); losses = U.randomInt(0, 22); }
    } else {
      if (rating >= 150) { wins = U.randomInt(24, 42); losses = U.randomInt(0, 3); }
      else if (rating >= 105) { wins = U.randomInt(13, 30); losses = U.randomInt(1, 8); }
      else { wins = U.randomInt(0, 16); losses = U.randomInt(0, 10); }
    }

    draws = U.randomInt(0, Math.min(8, Math.floor((wins + losses) / 18)));
    fighter.record = {
      wins: wins,
      losses: losses,
      draws: draws,
      kos: U.randomInt(0, Math.max(0, Math.min(wins, Math.round(wins * (fighter.trackId === "amateur" ? 0.35 : 0.68)))))
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

  function findOpponent(state, difficultyId, slotIndex) {
    var player = State.player(state);
    var targetScore = opponentScoreTarget(player, difficultyId);
    var candidates;
    var selected;

    window.FS.__currentStateWeek = state.week;

    candidates = state.roster.filter(function (fighter) {
      var tier = careerTier(fighter);
      var playerTier = careerTier(player);
      var isChampion = tier.id === "champion";
      return !fighter.isPlayer &&
        (player.trackId === "pro" || fighter.countryId === player.countryId) &&
        fighter.trackId === player.trackId &&
        (player.trackId === "street" || fighter.weightClassId === player.weightClassId) &&
        (!isChampion || difficultyId === "hard" && playerTier.level >= 4);
    });

    candidates.sort(function (left, right) {
      return candidatePenalty(player, left, targetScore) - candidatePenalty(player, right, targetScore);
    });

    selected = candidates[slotIndex] || candidates[0] || null;

    if (!selected) {
      selected = State.createFighter(player.countryId, player.trackId, 12000 + state.week * 20 + slotIndex, U.statAverage(player.stats) + U.findDifficulty(difficultyId).offset, {
        weightClassId: player.trackId === "street" ? "" : player.weightClassId,
        gymId: player.gymId
      });
      normalizeRecordForFighter(selected);
      state.roster.push(selected);
      if (window.FS.Clubs) {
        window.FS.Clubs.assignFightersToClubs(state);
      }
    }

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
    var i;
    var difficulty;
    var opponent;

    for (i = 0; i < 3; i += 1) {
      difficulty = difficulties[i] || difficulties[1];
      opponent = findOpponent(state, difficulty.id, i);

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
