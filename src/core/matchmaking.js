(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;
  var State = window.FS.State;

  function careerTier(fighter) {
    var rating = U.statAverage(fighter.stats);
    var hasTitle = fighter.titles && fighter.titles.length > 0;
    var rank;

    if (fighter.trackId === "amateur") {
      rank = State.rankForFighter ? State.rankForFighter(fighter) : null;
      return { id: rank ? rank.id : "adult_3", label: rank ? rank.label : "3 взрослый", level: rank ? Math.round((rank.minRating || 0) / 20) + 1 : 1 };
    }

    if (hasTitle) {
      return { id: "champion", label: fighter.trackId === "street" ? "Чемпион улицы" : "Чемпион", level: 5 };
    }

    if (fighter.trackId === "pro") {
      if (rating >= 150) { return { id: "elite", label: "Элита", level: 4 }; }
      if (rating >= 120) { return { id: "contender", label: "Претендент", level: 3 }; }
      if (rating >= 100) { return { id: "prospect", label: "Проспект", level: 2 }; }
      return { id: "debutant", label: "Дебютант", level: 1 };
    }

    if (fighter.trackId === "street") {
      if (rating >= 135) { return { id: "street_elite", label: "Опасное имя", level: 4 }; }
      if (rating >= 105) { return { id: "street_contender", label: "Уличный претендент", level: 3 }; }
      if (rating >= 60) { return { id: "street_regular", label: "Местный боец", level: 2 }; }
      return { id: "street_rookie", label: "Уличный новичок", level: 1 };
    }

    return { id: "fighter", label: "Боец", level: 1 };
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

  function recordTotal(fighter) {
    var record = fighter.record || {};
    return (Number(record.wins) || 0) + (Number(record.losses) || 0) + (Number(record.draws) || 0);
  }

  function recordWinRate(fighter) {
    var record = fighter.record || {};
    var total = recordTotal(fighter);
    return total ? ((Number(record.wins) || 0) / total) : 0;
  }

  function recordSimilarityPenalty(player, fighter) {
    return Math.abs(recordTotal(player) - recordTotal(fighter)) * 0.55 + Math.abs(recordWinRate(player) - recordWinRate(fighter)) * 24;
  }

  function localOpponentCountryIds(player) {
    var home = U.findCountry(player.countryId);
    var rank = window.FS.State && window.FS.State.rankForFighter ? window.FS.State.rankForFighter(player).id : "";
    var rating = U.statAverage(player.stats);

    if (player.trackId === "amateur") {
      if (rating >= 100 || rank === "ms" || rank === "msmk") {
        return null;
      }
      if (rank === "kms") {
        return Data.countries.filter(function (country) { return country.continentId === home.continentId; }).map(function (country) { return country.id; });
      }
    }

    if (player.trackId !== "street" && player.trackId !== "amateur") {
      return null;
    }

    if (home.localPoolId && home.localPoolId !== home.id) {
      return Data.countries.filter(function (country) { return country.localPoolId === home.localPoolId; }).map(function (country) { return country.id; });
    }
    return [home.id];
  }

  function rankingWindowCandidates(state, player, localCountries, used) {
    var rankingCountry = localCountries && localCountries.length === 1 ? localCountries[0] : "world";
    var rankingWeight = player.trackId === "street" ? "" : player.weightClassId;
    var list = State.ranking(state, rankingCountry, player.trackId, rankingWeight).filter(function (fighter) {
      return !fighter.isPlayer && !fighter.retired && !used[fighter.id] &&
        (player.trackId === "street" || fighter.weightClassId === player.weightClassId) &&
        (!localCountries || localCountries.indexOf(fighter.countryId) !== -1);
    });
    var playerPos = State.playerRank ? State.playerRank(state, rankingCountry, player.trackId, rankingWeight) : 0;
    var center = Math.max(0, (playerPos || Math.floor(list.length / 2)) - 1);
    var radius = 8;
    var sliced = list.slice(Math.max(0, center - radius), Math.min(list.length, center + radius + 1));
    return sliced.length ? sliced : list.slice(0, 24);
  }

  function findOpponent(state, difficultyId, slotIndex, usedIds) {
    var player = State.player(state);
    var playerOvr = U.statAverage(player.stats);
    var used = usedIds || {};
    var playerRank = player.trackId === "amateur" && State.rankForFighter ? State.rankForFighter(player) : null;
    var internationalAmateur = player.trackId === "amateur" && (playerOvr >= 100 || ["ms", "msmk"].indexOf(playerRank ? playerRank.id : "") !== -1);
    var continentalAmateur = player.trackId === "amateur" && !internationalAmateur && playerRank && playerRank.id === "kms";
    var tier = careerTier(player);
    var streetInternational = player.trackId === "street" && tier && tier.level >= 4;
    var forceForeignStreet = streetInternational && slotIndex < 8;
    var localCountries = forceForeignStreet ? null : localOpponentCountryIds(player);
    var candidates;
    var selected;
    var offset;
    window.FS.__currentStateWeek = state.week;

    candidates = rankingWindowCandidates(state, player, localCountries, used);

    if (forceForeignStreet) {
      candidates = candidates.filter(function (fighter) { return fighter.countryId !== player.countryId; });
    }

    if (continentalAmateur) {
      candidates = candidates.filter(function (fighter) { return fighter.countryId !== player.countryId || slotIndex >= 2; });
    }

    if (!candidates.length) {
      candidates = state.roster.filter(function (fighter) {
        var fRank = fighter.trackId === "amateur" && State.rankForFighter ? State.rankForFighter(fighter) : null;
        return !fighter.isPlayer && !fighter.retired && !used[fighter.id] &&
          (player.trackId === "pro" || internationalAmateur || forceForeignStreet || !localCountries || localCountries.indexOf(fighter.countryId) !== -1) &&
          (!forceForeignStreet || fighter.countryId !== player.countryId) &&
          fighter.trackId === player.trackId &&
          (player.trackId === "street" || fighter.weightClassId === player.weightClassId) &&
          (!internationalAmateur || ["ms", "msmk"].indexOf(fRank ? fRank.id : "") !== -1);
      });
    }

    candidates.sort(function (left, right) {
      var leftRankPenalty = Math.abs(recordTotal(player) - recordTotal(left)) * 0.25;
      var rightRankPenalty = Math.abs(recordTotal(player) - recordTotal(right)) * 0.25;
      var leftScore = leftRankPenalty + Math.abs(U.statAverage(left.stats) - playerOvr) * 0.32 + recordSimilarityPenalty(player, left) * 0.55;
      var rightScore = rightRankPenalty + Math.abs(U.statAverage(right.stats) - playerOvr) * 0.32 + recordSimilarityPenalty(player, right) * 0.55;
      return leftScore - rightScore;
    });

    offset = candidates.length ? ((Number(state.offerRefreshSalt) || 0) * 11 + slotIndex * 5) % candidates.length : 0;
    selected = candidates[offset] || candidates[0];

    if (!selected) {
      selected = State.createFighter(player.countryId, player.trackId, 9000 + state.week * 10 + slotIndex, playerOvr + U.randomInt(-4, 4), {
        weightClassId: player.weightClassId,
        gymId: player.gymId
      });
      state.roster.push(selected);
    }

    used[selected.id] = true;
    return selected;
  }

  function offerLabel(playerTrackId, difficultyId) {
    return "Бой";
  }

  function buildPlayerOffers(state) {
    var player = State.player(state);
    var track = U.findTrack(player.trackId);
    var offers = [];
    var used = {};
    var i;
    var opponent;

    if (player.trackId === "pro") {
      return [];
    }

    for (i = 0; i < 10; i += 1) {
      opponent = findOpponent(state, "even", i, used);

      offers.push({
        id: U.uid("offer"),
        label: "Бой",
        difficultyId: "even",
        opponentId: opponent.id,
        rounds: track.rounds,
        purse: window.FS.Fight && window.FS.Fight.computePurse ? window.FS.Fight.computePurse(player, opponent) : Math.max(25, U.statAverage(opponent.stats) * 5),
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
