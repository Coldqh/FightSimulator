(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;
  var State = window.FS.State;

  function createNews(state, tone, text, meta) {
    U.pushLimited(state.world.news, {
      id: U.uid("news"),
      week: state.week,
      tone: tone || "world",
      text: text,
      meta: meta || {}
    }, 90);
  }

  function shuffleList(list) {
    var copy = list.slice();
    var i, j, tmp;
    for (i = copy.length - 1; i > 0; i -= 1) {
      j = U.randomInt(0, i);
      tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
    }
    return copy;
  }

  function rememberOpponent(fighter, opponentId) {
    fighter.recentOpponentIds = fighter.recentOpponentIds instanceof Array ? fighter.recentOpponentIds : [];
    fighter.recentOpponentIds.unshift(opponentId);
    if (fighter.recentOpponentIds.length > 8) { fighter.recentOpponentIds.length = 8; }
  }

  function findCloseOpponent(state, sourceFighter) {
    var recent = sourceFighter.recentOpponentIds instanceof Array ? sourceFighter.recentOpponentIds : [];
    var pool = state.roster.filter(function (fighter) {
      return fighter.id !== sourceFighter.id &&
        !fighter.isPlayer && !fighter.retired && recent.indexOf(fighter.id) === -1 &&
        fighter.trackId === sourceFighter.trackId &&
        (sourceFighter.trackId === "pro" || fighter.countryId === sourceFighter.countryId) &&
        (sourceFighter.trackId === "street" || fighter.weightClassId === sourceFighter.weightClassId);
    });
    if (!pool.length) {
      pool = state.roster.filter(function (fighter) {
        return fighter.id !== sourceFighter.id && !fighter.isPlayer && !fighter.retired &&
          fighter.trackId === sourceFighter.trackId &&
          (sourceFighter.trackId === "pro" || fighter.countryId === sourceFighter.countryId) &&
          (sourceFighter.trackId === "street" || fighter.weightClassId === sourceFighter.weightClassId);
      });
    }
    pool.sort(function (left, right) {
      return Math.abs(U.scoreFighter(left) - U.scoreFighter(sourceFighter)) - Math.abs(U.scoreFighter(right) - U.scoreFighter(sourceFighter));
    });
    return pool[U.randomInt(0, Math.min(9, pool.length - 1))] || pool[0] || null;
  }

  function resolveNpcFight(state, a, b) {
    var aScore = U.scoreFighter(a);
    var bScore = U.scoreFighter(b);
    var aChance = U.clamp(50 + Math.round((aScore - bScore) * 2.1), 12, 88);
    var roll = U.randomInt(1, 100);
    var winner;
    var loser;
    var draw = Math.abs(aScore - bScore) <= 2 && U.randomInt(1, 100) <= 7;
    var ko;
    rememberOpponent(a, b.id);
    rememberOpponent(b, a.id);
    if (draw) {
      a.record.draws += 1; b.record.draws += 1;
      a.careerLog.unshift({ week: state.week, text: "Ничья с " + b.name });
      b.careerLog.unshift({ week: state.week, text: "Ничья с " + a.name });
      a.lastFightWeek = state.week; b.lastFightWeek = state.week;
      if (window.FS.Clubs && window.FS.Clubs.recordClubFight) { window.FS.Clubs.recordClubFight(state, a, b, true); }
      return { type: "draw", text: a.name + " и " + b.name + " завершили бой вничью." };
    }
    if (roll <= aChance) { winner = a; loser = b; } else { winner = b; loser = a; }
    ko = U.randomInt(1, 100) <= 20;
    winner.record.wins += 1; loser.record.losses += 1; if (ko) { winner.record.kos += 1; }
    winner.careerLog.unshift({ week: state.week, text: "Победа над " + loser.name + (ko ? " KO/TKO" : " решением") });
    loser.careerLog.unshift({ week: state.week, text: "Поражение от " + winner.name });
    winner.lastFightWeek = state.week; loser.lastFightWeek = state.week;
    if (winner.trackRecords) { winner.trackRecords[winner.trackId] = State.cloneRecord(winner.record); }
    if (loser.trackRecords) { loser.trackRecords[loser.trackId] = State.cloneRecord(loser.record); }
    State.updateDerivedFighterFields(winner); State.updateDerivedFighterFields(loser);
    if (window.FS.Clubs && window.FS.Clubs.recordClubFight) { window.FS.Clubs.recordClubFight(state, winner, loser, false); }
    return { type: "win", winner: winner.id, loser: loser.id, text: winner.name + " победил " + loser.name + (ko ? " KO/TKO." : " решением судей.") };
  }

  function simulateNpcTraining(state) {
    var count = Math.min(140, Math.max(40, Math.floor(state.roster.length / 110)));
    var i, fighter, key, cap;
    var keys = ["power", "technique", "speed", "stamina", "defense"];
    for (i = 0; i < count; i += 1) {
      fighter = state.roster[U.randomInt(0, state.roster.length - 1)];
      if (!fighter || fighter.isPlayer) { continue; }
      key = U.pick(keys);
      cap = U.findTrack(fighter.trackId).maxStat;
      if (U.randomInt(1, 100) <= 45) {
        fighter.stats[key] = U.clamp(fighter.stats[key] + 1, 1, cap);
        State.updateDerivedFighterFields(fighter);
      }
    }
  }

  function contractDelay(fighter) {
    var titles = fighter.titles ? fighter.titles.length : 0;
    var rating = U.statAverage(fighter.stats);
    if (titles > 0) { return U.randomInt(10, 15); }
    if (rating >= 155 || fighter.record.wins >= 22) { return U.randomInt(7, 11); }
    if (rating >= 120 || fighter.record.wins >= 10) { return U.randomInt(4, 8); }
    return U.randomInt(2, 5);
  }

  function findProContractOpponent(state, fighter) {
    var pool = state.roster.filter(function (item) {
      return !item.isPlayer && item.id !== fighter.id && item.trackId === "pro" && item.weightClassId === fighter.weightClassId && state.week - (item.lastFightWeek || 0) >= 2;
    });
    if (!pool.length) { return null; }
    pool.sort(function (left, right) {
      return Math.abs(U.scoreFighter(left) - U.scoreFighter(fighter)) - Math.abs(U.scoreFighter(right) - U.scoreFighter(fighter));
    });
    return pool[U.randomInt(0, Math.min(6, pool.length - 1))] || pool[0];
  }

  function scheduleProContract(state, fighter) {
    var opponent = findProContractOpponent(state, fighter);
    if (!opponent) { return false; }
    fighter.contractOpponentId = opponent.id;
    fighter.nextFightWeek = state.week + contractDelay(fighter);
    fighter.contractLabel = "Контракт на бой через " + (fighter.nextFightWeek - state.week) + " нед.";
    return true;
  }

  function processProContracts(state) {
    var pros = state.roster.filter(function (fighter) { return !fighter.isPlayer && fighter.trackId === "pro"; });
    var report = [];
    var i, fighter, opponent, result;
    var scheduled = 0;
    for (i = 0; i < pros.length; i += 1) {
      fighter = pros[i];
      if (!fighter.nextFightWeek || !fighter.contractOpponentId) {
        if (scheduled < 80 && U.randomInt(1, 100) <= 12) { if (scheduleProContract(state, fighter)) { scheduled += 1; } }
        continue;
      }
      if (fighter.nextFightWeek <= state.week) {
        opponent = U.getFighterById(state, fighter.contractOpponentId);
        if (opponent && opponent.trackId === "pro") {
          result = resolveNpcFight(state, fighter, opponent);
          report.push(result.text);
          if (result.type === "win" && window.FS.Titles && window.FS.Titles.unifyBeltsAfterFight) { window.FS.Titles.unifyBeltsAfterFight(state, result.winner, result.loser); }
        }
        fighter.contractOpponentId = "";
        fighter.nextFightWeek = 0;
        fighter.contractLabel = "";
        scheduleProContract(state, fighter);
      }
    }
    return report;
  }

  function simulateNpcFights(state) {
    var report = [];
    var due = state.roster.filter(function (fighter) {
      return !fighter.isPlayer && fighter.trackId !== "pro" && state.week - (fighter.lastFightWeek || 0) >= 3;
    });
    var buckets = {};
    var key;
    var i;
    var bucket;
    var a;
    var b;
    var result;
    var maxPairs = 0;

    for (i = 0; i < due.length; i += 1) {
      key = due[i].trackId + "|" + due[i].countryId + "|" + (due[i].trackId === "street" ? "open" : due[i].weightClassId);
      if (!buckets[key]) { buckets[key] = []; }
      buckets[key].push(due[i]);
    }

    for (key in buckets) {
      if (!Object.prototype.hasOwnProperty.call(buckets, key)) { continue; }
      bucket = shuffleList(buckets[key]);
      maxPairs = Math.min(Math.floor(bucket.length / 2), 260);
      for (i = 0; i < maxPairs; i += 1) {
        a = bucket[i * 2];
        b = bucket[i * 2 + 1];
        if (!a || !b) { continue; }
        result = resolveNpcFight(state, a, b);
        if (result.type === "win" && window.FS.Titles && window.FS.Titles.unifyBeltsAfterFight) {
          window.FS.Titles.unifyBeltsAfterFight(state, result.winner, result.loser);
        }
        if (report.length < 8) { report.push(result.text); }
      }
    }

    report = report.concat(processProContracts(state).slice(0, 8 - report.length));

    if (window.FS.Titles && window.FS.Titles.updateTitles) { window.FS.Titles.updateTitles(state); }
    return report;
  }

  function canMoveToTrack(fighter, targetTrackId) {
    var rating = U.statAverage(fighter.stats);
    if (fighter.trackId === targetTrackId) { return false; }
    if (targetTrackId === "amateur" && rating > 100) { return false; }
    if (targetTrackId === "street" && rating > 150) { return false; }
    if (targetTrackId === "pro" && rating < 90) { return false; }
    if (fighter.trackId === "pro" && targetTrackId === "amateur") { return false; }
    if (fighter.proClosed && targetTrackId === "pro") { return false; }
    return true;
  }

  function tryMoveFighter(state, fighter, targetTrackId, reason) {
    if (!canMoveToTrack(fighter, targetTrackId)) {
      return false;
    }

    if (!State.switchFighterTrack(state, fighter, targetTrackId, reason)) {
      return false;
    }

    U.pushLimited(state.world.transitionLog, {
      id: U.uid("move"),
      week: state.week,
      fighterId: fighter.id,
      text: fighter.name + ": " + reason
    }, 70);

    createNews(state, "move", fighter.name + ": " + reason, { type: "track_move" });
    return true;
  }

  function simulateTransitions(state) {
    var candidates = state.roster.filter(function (fighter) {
      return !fighter.isPlayer && state.week - (fighter.lastMoveWeek || 1) >= 5;
    });
    var attempts = Math.min(8, candidates.length);
    var i;
    var fighter;
    var rating;

    for (i = 0; i < attempts; i += 1) {
      fighter = candidates[U.randomInt(0, candidates.length - 1)];
      if (!fighter) {
        continue;
      }

      rating = U.statAverage(fighter.stats);

      if (fighter.trackId === "street" && rating >= 43 && U.randomInt(1, 100) <= 14) {
        tryMoveFighter(state, fighter, "amateur", "перешёл с улицы в любители");
      } else if (fighter.trackId === "amateur" && rating >= 58 && U.randomInt(1, 100) <= 12) {
        tryMoveFighter(state, fighter, "pro", "подписал первый профессиональный контракт");
      } else if (fighter.trackId === "pro" && fighter.record.losses >= fighter.record.wins + 4 && U.randomInt(1, 100) <= 10) {
        tryMoveFighter(state, fighter, "street", "сорвался из профи на улицу");
      }
    }
  }

  function buildNationalTeams(state) {
    var teams = {};
    var countryIndex;
    var weightIndex;
    var country;
    var weight;
    var pool;
    var main;
    var reserve;
    var qualification;
    var p = State.player(state);

    if (!state.world) { state.world = {}; }
    state.world.nationalTeamQualification = state.world.nationalTeamQualification || {};
    state.world.reserveAdditions = state.world.reserveAdditions || {};

    for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
      country = Data.countries[countryIndex];
      main = [];
      reserve = [];

      for (weightIndex = 0; weightIndex < Data.weightClasses.length; weightIndex += 1) {
        weight = Data.weightClasses[weightIndex];
        pool = State.ranking(state, country.id, "amateur", weight.id).filter(function (fighter) {
          return !fighter.retired && U.statAverage(fighter.stats) >= 40;
        });

        qualification = state.world.nationalTeamQualification[country.id + "|" + weight.id];
        if (qualification && p && p.id === qualification.fighterId && p.trackId === "amateur" && p.countryId === country.id && p.weightClassId === weight.id) {
          pool = pool.filter(function (fighter) { return fighter.id !== p.id; });
          pool.unshift(p);
        } else {
          pool = pool.filter(function (fighter) { return !fighter.isPlayer; });
        }

        main = main.concat(pool.slice(0, 2).map(function (fighter) { return fighter.id; }));
        var addedReserve = state.world.reserveAdditions[country.id + "|" + weight.id] || [];
        reserve = reserve.concat(addedReserve).concat(pool.slice(2, 10).map(function (fighter) { return fighter.id; }));
      }

      teams[country.id] = {
        main: Array.from(new Set(main)).slice(0, 12),
        reserve: Array.from(new Set(reserve.filter(function (id) { return main.indexOf(id) === -1; }))).slice(0, 48)
      };
    }

    state.world.teamsByCountry = teams;
  }

  function buildOfferOpponent(state, index) {
    var p = State.player(state);
    var difficulty = Data.offerDifficulties[index] || Data.offerDifficulties[1];
    var targetScore = U.scoreFighter(p) + difficulty.offset;
    var candidates = state.roster.filter(function (fighter) {
      return !fighter.isPlayer &&
        fighter.countryId === p.countryId &&
        fighter.trackId === p.trackId &&
        fighter.weightClassId === p.weightClassId;
    });

    candidates.sort(function (left, right) {
      return Math.abs(U.scoreFighter(left) - targetScore) - Math.abs(U.scoreFighter(right) - targetScore);
    });

    if (!candidates[index]) {
      candidates[index] = State.createFighter(p.countryId, p.trackId, 9000 + state.week * 10 + index, U.statAverage(p.stats) + difficulty.offset, {
        weightClassId: p.weightClassId,
        gymId: p.gymId
      });
      state.roster.push(candidates[index]);
      if (window.FS.Clubs) {
        window.FS.Clubs.assignFightersToClubs(state);
      }
    }

    return candidates[index];
  }

  function refreshOffers(state) {
    var competitionOffers = (state.offers || []).filter(function (offer) {
      return offer.isCompetition;
    });

    if (window.FS.Matchmaking && window.FS.Matchmaking.buildPlayerOffers) {
      state.offers = window.FS.Matchmaking.buildPlayerOffers(state).concat(competitionOffers);
      return;
    }

    var p = State.player(state);
    var labelsByTrack = {
      amateur: ["Любительский бой", "Бой городского уровня", "Матч отбора"],
      street: ["Дворовый бой", "Районный вызов", "Бой на местной площадке"],
      pro: ["Профессиональный андеркард", "Контрактный бой", "Главный бой вечера"]
    };
    var track = U.findTrack(p.trackId);
    var i;
    var opponent;
    var difficulty;
    var normalOffers = [];

    for (i = 0; i < 3; i += 1) {
      difficulty = Data.offerDifficulties[i] || Data.offerDifficulties[1];
      opponent = buildOfferOpponent(state, i);

      normalOffers.push({
        id: U.uid("offer"),
        label: labelsByTrack[p.trackId][i],
        difficultyId: difficulty.id,
        opponentId: opponent.id,
        rounds: track.rounds,
        purse: Math.max(0, Math.round((track.basePurse + i * Math.round(track.basePurse * 0.35)) * difficulty.purseMul)),
        risk: Math.max(1, U.statAverage(opponent.stats) - U.statAverage(p.stats) + 50)
      });
    }

    state.offers = normalOffers.concat(competitionOffers);
  }

  function retireFighter(state, fighter, reason) {
    if (!fighter || fighter.isPlayer || fighter.retired) { return false; }
    fighter.retired = true;
    fighter.retiredWeek = state.week;
    fighter.retiredReason = reason || "завершил карьеру";
    fighter.memorial = { name: fighter.name, record: State.cloneRecord(fighter.record), trackId: fighter.trackId, countryId: fighter.countryId, retiredWeek: state.week, reason: fighter.retiredReason };
    fighter.careerLog.unshift({ week: state.week, text: "Завершил карьеру: " + fighter.retiredReason + "." });
    return true;
  }

  function createYoungFighter(state, countryId, trackId, index) {
    var base = trackId === "pro" ? U.randomInt(90, 105) : (trackId === "street" ? U.randomInt(0, 35) : U.randomInt(0, 22));
    var weightClassId = trackId === "street" ? "" : Data.weightClasses[U.randomInt(0, Data.weightClasses.length - 1)].id;
    var f = State.createFighter(countryId, trackId, 800000 + state.week * 1000 + index, base, { age: U.randomInt(18, 22), weightClassId: weightClassId });
    state.roster.push(f);
    return f;
  }

  function simulateRetirementsAndNewFighters(state) {
    var i, fighter, rating, chance, created = 0, parts = State.dateParts(state);
    for (i = 0; i < state.roster.length; i += 1) {
      fighter = state.roster[i];
      if (!fighter || fighter.isPlayer || fighter.retired) { continue; }
      if (fighter.birthMonth === parts.month && fighter.birthWeek === parts.weekOfMonth) { fighter.age += 1; }
      rating = U.statAverage(fighter.stats);
      if (fighter.trackId === "amateur" && fighter.age > 30) {
        if (rating >= 90) { tryMoveFighter(state, fighter, "pro", "перерос любители и ушёл в профи"); }
        else { tryMoveFighter(state, fighter, "street", "перерос любители и ушёл на улицу"); }
        continue;
      }
      chance = fighter.age >= 40 ? 7 : (fighter.age >= 36 ? 3 : (fighter.age >= 32 ? 1 : 0));
      if (chance && U.randomInt(1, 1000) <= chance) { retireFighter(state, fighter, "возраст"); }
    }
    for (i = 0; i < Data.countries.length; i += 1) { createYoungFighter(state, Data.countries[i].id, "amateur", created++); createYoungFighter(state, Data.countries[i].id, "street", created++); }
    for (i = 0; i < Data.weightClasses.length; i += 1) { createYoungFighter(state, Data.countries[i % Data.countries.length].id, "pro", created++).weightClassId = Data.weightClasses[i].id; }
    if (window.FS.Clubs) { window.FS.Clubs.assignFightersToClubs(state); }
  }


  function advanceWeek(state, action) {
    var npcReport;
    state.week += 1;
    if (State.applyMonthlyExpenses) { State.applyMonthlyExpenses(state); }
    if (action === "rest" && State.restPlayer) { State.restPlayer(state); }
    else if (State.adjustFatigue) { State.adjustFatigue(state, -(Data.economy && Data.economy.fatigue ? Data.economy.fatigue.recoveryPerWeek : 6), "Недельное восстановление"); }
    if (window.FS.Clubs) {
      window.FS.Clubs.ensureClubs(state);
      
    }
    simulateRetirementsAndNewFighters(state);
    simulateNpcTraining(state);
    npcReport = simulateNpcFights(state);
    simulateTransitions(state);
    if (window.FS.Clubs && window.FS.Clubs.maybeMoveNpcClubs) { window.FS.Clubs.maybeMoveNpcClubs(state); }
    if (window.FS.Clubs && window.FS.Clubs.simulateCoachLife) { window.FS.Clubs.simulateCoachLife(state); }
    buildNationalTeams(state);
    if (window.FS.Titles) {
      window.FS.Titles.updateTitles(state);
    }
    if (window.FS.Stories) {
      window.FS.Stories.simulateStories(state);
    }
    refreshOffers(state);
    if (State.updateDebtStatus) { State.updateDebtStatus(state, "week"); }

    U.pushLimited(state.world.weekReports, {
      id: U.uid("week"),
      week: state.week,
      action: action || "week",
      fights: npcReport.slice(0, 8)
    }, 35);
  }

  function bootstrapWorld(state) {
    State.updateAllDerived(state);
    if (window.FS.Amateur && window.FS.Amateur.ensureAmateurState) {
      window.FS.Amateur.ensureAmateurState(state);
    }
    if (window.FS.Matchmaking && window.FS.Matchmaking.normalizeRosterRecords) {
      window.FS.Matchmaking.normalizeRosterRecords(state);
    }
    if (window.FS.Clubs) {
      window.FS.Clubs.ensureClubs(state);
      
    }
    buildNationalTeams(state);
    if (window.FS.Titles) {
      window.FS.Titles.ensureTitles(state);
      if (window.FS.Titles.removeAmateurTitles) {
        window.FS.Titles.removeAmateurTitles(state);
      }
      if (window.FS.Titles.normalizeFighterTitles) {
        window.FS.Titles.normalizeFighterTitles(state);
      }
    }
    refreshOffers(state);
    if (!state.world.news.length) {
      createNews(state, "world", "Мир запущен: клубы, титулы, рейтинги, сборные и расписание боёв сформированы.", { type: "bootstrap" });
    }
  }

  window.FS.World = {
    createNews: createNews,
    refreshOffers: refreshOffers,
    advanceWeek: advanceWeek,
    bootstrapWorld: bootstrapWorld,
    simulateNpcTraining: simulateNpcTraining,
    simulateNpcFights: simulateNpcFights,
    simulateTransitions: simulateTransitions,
    buildNationalTeams: buildNationalTeams
  };
}());
