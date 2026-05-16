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
      tone: tone || "neutral",
      text: text,
      meta: meta || {}
    }, 60);
  }

  function findCloseOpponent(state, sourceFighter) {
    var pool = state.roster.filter(function (fighter) {
      return fighter.id !== sourceFighter.id &&
        !fighter.isPlayer &&
        fighter.countryId === sourceFighter.countryId &&
        fighter.trackId === sourceFighter.trackId;
    });

    pool.sort(function (left, right) {
      return Math.abs(U.statAverage(left.stats) - U.statAverage(sourceFighter.stats)) -
        Math.abs(U.statAverage(right.stats) - U.statAverage(sourceFighter.stats));
    });

    return pool[U.randomInt(0, Math.min(5, pool.length - 1))] || pool[0] || null;
  }

  function resolveNpcFight(state, a, b) {
    var aScore = U.statAverage(a.stats) + a.record.wins * 0.7 - a.record.losses * 0.35;
    var bScore = U.statAverage(b.stats) + b.record.wins * 0.7 - b.record.losses * 0.35;
    var aChance = U.clamp(50 + Math.round((aScore - bScore) * 2.2), 12, 88);
    var roll = U.randomInt(1, 100);
    var winner;
    var loser;
    var draw = Math.abs(aScore - bScore) <= 2 && U.randomInt(1, 100) <= 7;
    var ko;

    if (draw) {
      a.record.draws += 1;
      b.record.draws += 1;
      a.careerLog.unshift({ week: state.week, text: "Ничья с " + b.name });
      b.careerLog.unshift({ week: state.week, text: "Ничья с " + a.name });
      return {
        type: "draw",
        text: a.name + " и " + b.name + " завершили бой вничью."
      };
    }

    if (roll <= aChance) {
      winner = a;
      loser = b;
    } else {
      winner = b;
      loser = a;
    }

    ko = U.randomInt(1, 100) <= 20;
    winner.record.wins += 1;
    loser.record.losses += 1;

    if (ko) {
      winner.record.kos += 1;
    }

    winner.careerLog.unshift({ week: state.week, text: "Победа над " + loser.name + (ko ? " KO/TKO" : " решением") });
    loser.careerLog.unshift({ week: state.week, text: "Поражение от " + winner.name });

    State.updateDerivedFighterFields(winner);
    State.updateDerivedFighterFields(loser);

    return {
      type: "win",
      winner: winner.id,
      loser: loser.id,
      text: winner.name + " победил " + loser.name + (ko ? " KO/TKO." : " решением судей.")
    };
  }

  function simulateNpcFights(state) {
    var fighters = state.roster.filter(function (fighter) {
      return !fighter.isPlayer;
    });
    var used = {};
    var report = [];
    var count = Math.min(12, Math.max(4, Math.floor(fighters.length / 18)));
    var i;
    var a;
    var b;
    var result;

    for (i = 0; i < count; i += 1) {
      a = fighters[U.randomInt(0, fighters.length - 1)];
      if (!a || used[a.id]) {
        continue;
      }

      b = findCloseOpponent(state, a);
      if (!b || used[b.id]) {
        continue;
      }

      used[a.id] = true;
      used[b.id] = true;

      result = resolveNpcFight(state, a, b);
      report.push(result.text);

      if (report.length <= 4) {
        createNews(state, "fight", result.text, { type: "npc_fight" });
      }
    }

    return report;
  }

  function canMoveToTrack(fighter, targetTrackId) {
    if (fighter.trackId === targetTrackId) {
      return false;
    }
    if (fighter.trackId === "pro" && targetTrackId === "amateur") {
      return false;
    }
    if (fighter.proClosed && targetTrackId === "pro") {
      return false;
    }
    return true;
  }

  function tryMoveFighter(state, fighter, targetTrackId, reason) {
    if (!canMoveToTrack(fighter, targetTrackId)) {
      return false;
    }

    if (fighter.trackId === "pro" && targetTrackId === "street") {
      fighter.proClosed = true;
    }

    if (targetTrackId === "pro") {
      fighter.hasGonePro = true;
    }

    fighter.trackId = targetTrackId;
    fighter.lastMoveWeek = state.week;
    State.updateDerivedFighterFields(fighter);
    fighter.careerLog.unshift({ week: state.week, text: reason });

    U.pushLimited(state.world.transitionLog, {
      id: U.uid("move"),
      week: state.week,
      fighterId: fighter.id,
      text: fighter.name + ": " + reason
    }, 50);

    createNews(state, "move", fighter.name + ": " + reason, { type: "track_move" });
    return true;
  }

  function simulateTransitions(state) {
    var candidates = state.roster.filter(function (fighter) {
      return !fighter.isPlayer && state.week - (fighter.lastMoveWeek || 1) >= 5;
    });
    var attempts = Math.min(6, candidates.length);
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
    var i;
    var country;
    var pool;

    for (i = 0; i < Data.countries.length; i += 1) {
      country = Data.countries[i];

      pool = State.ranking(state, country.id, "amateur").filter(function (fighter) {
        return U.statAverage(fighter.stats) >= 40;
      });

      teams[country.id] = {
        main: pool.slice(0, 4).map(function (fighter) { return fighter.id; }),
        reserve: pool.slice(4, 8).map(function (fighter) { return fighter.id; })
      };
    }

    state.world.teamsByCountry = teams;
  }

  function buildOfferOpponent(state, index) {
    var p = State.player(state);
    var candidates = state.roster.filter(function (fighter) {
      return !fighter.isPlayer &&
        fighter.countryId === p.countryId &&
        fighter.trackId === p.trackId;
    });

    candidates.sort(function (left, right) {
      return Math.abs(U.statAverage(left.stats) - U.statAverage(p.stats)) -
        Math.abs(U.statAverage(right.stats) - U.statAverage(p.stats));
    });

    if (!candidates[index]) {
      candidates[index] = State.createFighter(p.countryId, p.trackId, 9000 + state.week * 10 + index, U.statAverage(p.stats) + index * 3);
      state.roster.push(candidates[index]);
    }

    return candidates[index];
  }

  function refreshOffers(state) {
    var p = State.player(state);
    var labelsByTrack = {
      amateur: ["Любительский бой", "Бой городского уровня", "Матч отбора"],
      street: ["Дворовый бой", "Районный вызов", "Бой на местной площадке"],
      pro: ["Профессиональный андеркард", "Контрактный бой", "Главный бой вечера"]
    };
    var track = U.findTrack(p.trackId);
    var i;
    var opponent;

    state.offers = [];

    for (i = 0; i < 3; i += 1) {
      opponent = buildOfferOpponent(state, i);

      state.offers.push({
        id: U.uid("offer"),
        label: labelsByTrack[p.trackId][i],
        opponentId: opponent.id,
        rounds: track.rounds,
        purse: track.basePurse + i * Math.round(track.basePurse * 0.35),
        risk: Math.max(1, U.statAverage(opponent.stats) - U.statAverage(p.stats) + 50)
      });
    }
  }

  function advanceWeek(state, action) {
    var npcReport;

    state.week += 1;
    npcReport = simulateNpcFights(state);
    simulateTransitions(state);
    buildNationalTeams(state);
    refreshOffers(state);

    U.pushLimited(state.world.weekReports, {
      id: U.uid("week"),
      week: state.week,
      action: action || "week",
      fights: npcReport.slice(0, 8)
    }, 25);
  }

  function bootstrapWorld(state) {
    State.updateAllDerived(state);
    buildNationalTeams(state);
    refreshOffers(state);
    if (!state.world.news.length) {
      createNews(state, "world", "Мир запущен: рейтинги, сборные и расписание боёв сформированы.", { type: "bootstrap" });
    }
  }

  window.FS.World = {
    createNews: createNews,
    refreshOffers: refreshOffers,
    advanceWeek: advanceWeek,
    bootstrapWorld: bootstrapWorld,
    simulateNpcFights: simulateNpcFights,
    simulateTransitions: simulateTransitions,
    buildNationalTeams: buildNationalTeams
  };
}());
