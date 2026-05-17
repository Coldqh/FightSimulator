(function () {
  "use strict";

  window.FS = window.FS || {};

  var Data = window.FS.Data;
  var U = window.FS.Utils;

  function rankForFighter(fighter) {
    var rating = U.statAverage(fighter.stats);
    var ranks = Data.amateurRanks;
    var best = ranks[0];
    var i;

    if (fighter.age >= 18 && rating < 31) {
      return Data.amateurRanks[3];
    }

    for (i = 0; i < ranks.length; i += 1) {
      if (rating >= ranks[i].minRating && (!ranks[i].maxRating || rating <= ranks[i].maxRating)) {
        if (!ranks[i].minAge || fighter.age >= ranks[i].minAge) {
          best = ranks[i];
        }
      }
    }

    return best;
  }

  function recordByTrackAndRating(trackId, rating, rankId) {
    var wins;
    var losses;
    var draws;

    if (trackId === "street") {
      wins = rating >= 110 ? U.randomInt(70, 170) : rating >= 75 ? U.randomInt(35, 110) : U.randomInt(5, 55);
      losses = rating >= 110 ? U.randomInt(2, 25) : rating >= 75 ? U.randomInt(8, 45) : U.randomInt(5, 70);
    } else if (trackId === "amateur") {
      if (rankId === "msmk" || rating >= 91) {
        wins = U.randomInt(90, 180); losses = U.randomInt(5, 35);
      } else if (rankId === "ms" || rating >= 76) {
        wins = U.randomInt(60, 140); losses = U.randomInt(8, 45);
      } else if (rankId === "kms" || rating >= 61) {
        wins = U.randomInt(35, 100); losses = U.randomInt(10, 55);
      } else if (String(rankId).indexOf("adult") === 0 || rating >= 31) {
        wins = U.randomInt(8, 45); losses = U.randomInt(5, 45);
      } else {
        wins = U.randomInt(0, 18); losses = U.randomInt(0, 20);
      }
    } else {
      if (rating >= 150) {
        wins = U.randomInt(24, 42); losses = U.randomInt(0, 3);
      } else if (rating >= 110) {
        wins = U.randomInt(14, 28); losses = U.randomInt(1, 7);
      } else if (rating >= 70) {
        wins = U.randomInt(5, 18); losses = U.randomInt(2, 10);
      } else {
        wins = U.randomInt(0, 8); losses = U.randomInt(0, 5);
      }
    }

    draws = U.randomInt(0, Math.min(8, Math.floor((wins + losses) / 18)));
    return {
      wins: wins,
      losses: losses,
      draws: draws,
      kos: U.randomInt(0, Math.max(0, Math.min(wins, Math.round(wins * (trackId === "amateur" ? 0.35 : 0.68)))))
    };
  }

  function baseForRank(rankId) {
    var i;
    for (i = 0; i < Data.amateurRanks.length; i += 1) {
      if (Data.amateurRanks[i].id === rankId) {
        return U.randomInt(Data.amateurRanks[i].minRating, Data.amateurRanks[i].maxRating || 100);
      }
    }
    return 35;
  }

  function createRecord(seed) {
    var base = 20 + Math.abs(seed % 55);
    return recordByTrackAndRating("amateur", base, "");
  }

  function createFighter(countryId, trackId, seed, baseValue, options) {
    var country = U.findCountry(countryId);
    var opts = options || {};
    var weightClassId = trackId === "street" ? "" : (opts.weightClassId || Data.weightClasses[Math.abs(seed) % Data.weightClasses.length].id);
    var stanceId = opts.stanceId || Data.stances[Math.abs(seed + 1) % Data.stances.length].id;
    var age = typeof opts.age === "number" ? opts.age : U.clamp(16 + (Math.abs(seed) % 22), 16, 39);
    var stats = opts.stats || U.createStats(trackId, baseValue);
    var rankId = opts.rankId || "";
    var fighter = {
      id: opts.id || U.uid("fighter"),
      name: opts.name || U.createName(country, seed),
      countryId: countryId,
      trackId: trackId,
      weightClassId: weightClassId,
      stanceId: stanceId,
      age: age,
      gymId: opts.gymId || "",
      stats: stats,
      record: opts.record || recordByTrackAndRating(trackId, U.statAverage(stats), rankId),
      isPlayer: !!opts.isPlayer,
      known: !!opts.known,
      hasGonePro: trackId === "pro" || !!opts.hasGonePro,
      proClosed: !!opts.proClosed,
      titles: opts.titles || [],
      awards: opts.awards || [],
      careerLog: opts.careerLog || [],
      storyFlags: opts.storyFlags || [],
      trainingPoints: opts.trainingPoints || 0,
      lastMoveWeek: 1,
      lastFightWeek: 0,
      seed: seed
    };

    updateDerivedFighterFields(fighter);
    return fighter;
  }

  function createRoster(player) {
    var roster = [];
    var countryIndex;
    var weightIndex;
    var rankIndex;
    var fighterIndex;
    var countryId;
    var weightClassId;
    var rank;
    var seed;
    var base;
    var age;

    /* Профи: минимум 100 боксёров в каждом весе, общий мировой пул */
    for (weightIndex = 0; weightIndex < Data.weightClasses.length; weightIndex += 1) {
      weightClassId = Data.weightClasses[weightIndex].id;
      for (fighterIndex = 0; fighterIndex < 100; fighterIndex += 1) {
        countryId = Data.countries[fighterIndex % Data.countries.length].id;
        seed = 100000 + weightIndex * 1000 + fighterIndex;
        base = 55 + Math.floor(fighterIndex / 3);
        roster.push(createFighter(countryId, "pro", seed, U.clamp(base, 45, 185), {
          weightClassId: weightClassId,
          age: U.randomInt(19, 38)
        }));
      }
    }

    /* Улица: минимум 100 бойцов в каждой стране, без весов */
    for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
      countryId = Data.countries[countryIndex].id;
      for (fighterIndex = 0; fighterIndex < 100; fighterIndex += 1) {
        seed = 200000 + countryIndex * 1000 + fighterIndex;
        base = U.clamp(18 + Math.floor(fighterIndex * 1.25), 10, 145);
        roster.push(createFighter(countryId, "street", seed, base, {
          weightClassId: "",
          age: U.randomInt(16, 42)
        }));
      }
    }

    /* Любители: 50 бойцов на каждый разряд в каждой стране */
    for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
      countryId = Data.countries[countryIndex].id;
      for (rankIndex = 0; rankIndex < Data.amateurRanks.length; rankIndex += 1) {
        rank = Data.amateurRanks[rankIndex];
        for (fighterIndex = 0; fighterIndex < 50; fighterIndex += 1) {
          seed = 300000 + countryIndex * 10000 + rankIndex * 1000 + fighterIndex;
          base = baseForRank(rank.id);
          weightClassId = Data.weightClasses[(fighterIndex + rankIndex) % Data.weightClasses.length].id;
          age = rank.id.indexOf("junior") === 0 ? U.randomInt(15, 17) : U.randomInt(18, 34);
          roster.push(createFighter(countryId, "amateur", seed, base, {
            weightClassId: weightClassId,
            rankId: rank.id,
            age: age
          }));
        }
      }
    }

    roster.push(player);
    return roster;
  }

  function createPeople(countryId) {
    var country = U.findCountry(countryId);
    return [
      { id: U.uid("person"), role: "coach", name: U.createName(country, 11), note: "Ведёт тренировки в зале." },
      { id: U.uid("person"), role: "clubmate", name: U.createName(country, 22), note: "Тренируется рядом и может пройти свой путь." },
      { id: U.uid("person"), role: "rival", name: U.createName(country, 33), note: "Появляется в местной боксёрской среде." },
      { id: U.uid("person"), role: "organizer", name: U.createName(country, 44), note: "Помогает собрать бои." },
      { id: U.uid("person"), role: "cutman", name: U.createName(country, 55), note: "Работает возле ринга." }
    ];
  }

  function createCareer(payload) {
    var trackId = U.findTrack(payload.trackId).id;
    var countryId = U.findCountry(payload.countryId).id;
    var weightClassId = U.findWeightClass(payload.weightClassId).id;
    var stanceId = U.findStance(payload.stanceId).id;
    var player = createFighter(countryId, trackId, 777, 35, {
      id: "player",
      name: payload.name || "Новый боксёр",
      isPlayer: true,
      known: true,
      weightClassId: weightClassId,
      stanceId: stanceId,
      age: payload.age || 18,
      record: { wins: 0, losses: 0, draws: 0, kos: 0 },
      trainingPoints: 0,
      careerLog: [{ week: 1, text: "Начало карьеры." }]
    });

    var state = {
      version: Data.appVersion,
      week: 1,
      selectedTab: "dashboard",
      playerId: player.id,
      rankingCountryId: countryId,
      rankingTrackId: trackId,
      rankingWeightClassId: weightClassId,
      modal: null,
      roster: [],
      people: createPeople(countryId),
      offers: [],
      trackedFighterIds: [],
      clubs: [],
      titles: {},
      world: {
        news: [],
        weekReports: [],
        teamsByCountry: {},
        transitionLog: [],
        stories: []
      },
      feed: "Карьера началась. Мир загружен, ближайшие соперники подобраны.",
      createdAt: new Date().toISOString()
    };

    state.roster = createRoster(player);
    return state;
  }

  function player(state) {
    return U.getFighterById(state, state.playerId);
  }

  function syncPlayer(state) {
    var p = player(state);
    if (!p) {
      return;
    }
    p.isPlayer = true;
    p.known = true;
  }

  function setPlayerTrack(state, trackId) {
    var p = player(state);
    var target = U.findTrack(trackId);

    if (!p || !target) {
      return false;
    }

    if (p.trackId === "pro" && target.id === "amateur") {
      state.feed = "После старта профессиональной карьеры нельзя вернуться в любители.";
      return false;
    }

    if (p.proClosed && target.id === "pro") {
      state.feed = "После ухода из профи на улицу возвращение в профи пока закрыто.";
      return false;
    }

    if (p.trackId === "pro" && target.id === "street") {
      p.proClosed = true;
    }

    if (target.id === "pro") {
      p.hasGonePro = true;
    }

    p.trackId = target.id;
    p.lastMoveWeek = state.week;
    state.rankingTrackId = target.id;
    state.feed = "Путь изменён: " + target.label + ".";
    updateDerivedFighterFields(p);
    p.careerLog.unshift({ week: state.week, text: "Переход: " + target.label + "." });
    return true;
  }

  function setPlayerCountry(state, countryId) {
    var country = U.findCountry(countryId);
    var p = player(state);
    if (!p) {
      return;
    }
    p.countryId = country.id;
    state.people = createPeople(country.id);
    state.rankingCountryId = country.id;
    state.feed = "Страна изменена: " + country.label + ".";
  }

  function setPlayerWeightClass(state, weightClassId) {
    var weightClass = U.findWeightClass(weightClassId);
    var p = player(state);
    if (!p) {
      return;
    }
    p.weightClassId = weightClass.id;
    state.rankingWeightClassId = weightClass.id;
    state.feed = "Весовая категория изменена: " + weightClass.label + ".";
  }

  function setTactic(state, tacticId) {
    return false;
  }

  function updateDerivedFighterFields(fighter) {
    if (fighter.trackId === "amateur") {
      fighter.amateurRankId = rankForFighter(fighter).id;
    }
    if (fighter.trackId === "street") {
      fighter.weightClassId = "";
      fighter.streetRating = U.clamp(U.statAverage(fighter.stats) + Math.round(fighter.record.wins * 0.38) - Math.round(fighter.record.losses * 0.22), 1, 200);
    }
    if (fighter.trackId === "pro") {
      fighter.proRating = U.clamp(U.statAverage(fighter.stats) + Math.round(fighter.record.wins * 0.7), 1, 240);
      fighter.hasGonePro = true;
    }
  }

  function updateAllDerived(state) {
    var i;
    for (i = 0; i < state.roster.length; i += 1) {
      updateDerivedFighterFields(state.roster[i]);
    }
  }

  function trainPlayer(state, statKey) {
    var p = player(state);
    var keys = ["power", "technique", "speed", "stamina", "defense"];
    var chosen = statKey || "";
    var cap;

    if (!p) {
      return;
    }

    p.trainingPoints = Number(p.trainingPoints) || 0;

    if (!chosen) {
      p.trainingPoints += 5;
      p.careerLog.unshift({ week: state.week, text: "Тренировочная неделя: +5 очков прокачки." });
      state.feed = "Тренировочная неделя завершена. Получено 5 очков прокачки.";
      return;
    }

    if (keys.indexOf(chosen) === -1 || typeof p.stats[chosen] !== "number") {
      return;
    }

    if (p.trainingPoints <= 0) {
      state.feed = "Не хватает очков прокачки. Проведи тренировочную неделю или бой.";
      return;
    }

    cap = U.findTrack(p.trackId).maxStat;
    p.trainingPoints -= 1;
    p.stats[chosen] = U.clamp(p.stats[chosen] + 1, 1, cap);
    updateDerivedFighterFields(p);
    p.careerLog.unshift({ week: state.week, text: "Прокачка за очко: +" + U.getStatLabel(chosen) + "." });
    state.feed = "Потрачено 1 очко. Улучшен навык: " + U.getStatLabel(chosen) + ".";
  }


  function getFighterAwards(state, fighter) {
    var result = [];
    var medals;
    var i;

    if (!fighter) {
      return result;
    }

    if (fighter.awards instanceof Array) {
      result = result.concat(fighter.awards);
    }

    if (fighter.isPlayer && state.amateurPath && state.amateurPath.medals instanceof Array) {
      medals = state.amateurPath.medals;
      for (i = 0; i < medals.length; i += 1) {
        result.push({
          week: medals[i].week,
          label: medals[i].awardLabel || medals[i].label,
          source: "amateur"
        });
      }
    }

    return result;
  }

  function addFighterAward(state, fighter, awardLabel, source) {
    if (!fighter || !awardLabel) {
      return;
    }

    fighter.awards = fighter.awards instanceof Array ? fighter.awards : [];

    if (!fighter.awards.some(function (award) { return award.label === awardLabel; })) {
      fighter.awards.unshift({
        id: U.uid("award"),
        week: state.week,
        label: awardLabel,
        source: source || "career"
      });
    }

    if (fighter.awards.length > 24) {
      fighter.awards.length = 24;
    }
  }

  function ranking(state, countryId, trackId, weightClassId) {
    return state.roster
      .filter(function (fighter) {
        var countryOk;
        var weightOk;

        if (trackId === "pro") {
          countryOk = true;
          weightOk = !weightClassId || fighter.weightClassId === weightClassId;
        } else if (trackId === "street") {
          countryOk = countryId === "world" || !countryId || fighter.countryId === countryId;
          weightOk = true;
        } else {
          countryOk = countryId === "world" || !countryId || fighter.countryId === countryId;
          weightOk = !weightClassId || fighter.weightClassId === weightClassId;
        }

        return countryOk && fighter.trackId === trackId && weightOk;
      })
      .sort(function (left, right) {
        return U.scoreFighter(right) - U.scoreFighter(left);
      });
  }


  function repairState(state) {
    var i;
    var p;

    if (!state) {
      return null;
    }

    state.version = Data.appVersion;
    state.week = Math.max(1, Number(state.week) || 1);
    state.trackedFighterIds = state.trackedFighterIds instanceof Array ? state.trackedFighterIds : [];
    state.amateurPath = state.amateurPath && typeof state.amateurPath === "object" ? state.amateurPath : { completed: {}, medals: [], lastCompetitionWeekById: {}, points: 0 };
    state.amateurPath.completed = state.amateurPath.completed || {};
    state.amateurPath.medals = state.amateurPath.medals instanceof Array ? state.amateurPath.medals : [];
    state.amateurPath.lastCompetitionWeekById = state.amateurPath.lastCompetitionWeekById || {};
    state.amateurPath.points = Number(state.amateurPath.points) || 0;
    state.offers = state.offers instanceof Array ? state.offers : [];
    state.clubs = state.clubs instanceof Array ? state.clubs : [];
    state.titles = state.titles && typeof state.titles === "object" ? state.titles : {};
    state.people = state.people instanceof Array ? state.people : [];
    if (!state.world) {
      state.world = { news: [], weekReports: [], teamsByCountry: {}, transitionLog: [], stories: [] };
    }
    state.world.news = state.world.news instanceof Array ? state.world.news : [];
    state.world.weekReports = state.world.weekReports instanceof Array ? state.world.weekReports : [];
    state.world.teamsByCountry = state.world.teamsByCountry || {};
    state.world.transitionLog = state.world.transitionLog instanceof Array ? state.world.transitionLog : [];
    state.world.stories = state.world.stories instanceof Array ? state.world.stories : [];

    for (i = 0; i < state.roster.length; i += 1) {
      state.roster[i].titles = state.roster[i].titles instanceof Array ? state.roster[i].titles : [];
      state.roster[i].careerLog = state.roster[i].careerLog instanceof Array ? state.roster[i].careerLog : [];
      state.roster[i].storyFlags = state.roster[i].storyFlags instanceof Array ? state.roster[i].storyFlags : [];
      state.roster[i].awards = state.roster[i].awards instanceof Array ? state.roster[i].awards : [];
      state.roster[i].trainingPoints = Number(state.roster[i].trainingPoints) || 0;
      updateDerivedFighterFields(state.roster[i]);
    }

    p = player(state);
    if (p) {
      state.rankingCountryId = state.rankingCountryId || p.countryId;
      state.rankingTrackId = state.rankingTrackId || p.trackId;
      state.rankingWeightClassId = state.rankingWeightClassId || p.weightClassId;
    }

    return state;
  }

  function playerRank(state, countryId, trackId, weightClassId) {
    var p = player(state);
    var list;
    var i;

    if (!p) {
      return 0;
    }

    list = ranking(state, countryId || p.countryId, trackId || p.trackId, weightClassId || p.weightClassId);
    for (i = 0; i < list.length; i += 1) {
      if (list[i].id === p.id) {
        return i + 1;
      }
    }

    return 0;
  }

  function pathProgress(state, fighter) {
    var target = fighter || player(state);
    var rank;
    var score;
    var nextRank;
    var i;
    var tier;
    var stage;

    if (!target) {
      return {
        title: "Нет данных",
        lines: []
      };
    }

    score = U.statAverage(target.stats);
    tier = window.FS.Matchmaking ? window.FS.Matchmaking.careerTier(target) : { label: "Боец" };
    stage = window.FS.Matchmaking ? window.FS.Matchmaking.careerStage(target) : { label: "Базовый уровень" };

    if (target.trackId === "amateur") {
      rank = rankForFighter(target);
      nextRank = null;

      for (i = 0; i < Data.amateurRanks.length; i += 1) {
        if (score < Data.amateurRanks[i].minRating) {
          nextRank = Data.amateurRanks[i];
          break;
        }
      }

      return {
        title: "Любительский путь",
        badge: rank.label,
        lines: [
          "Ступень: " + stage.label,
          "Класс бойца: " + tier.label,
          "Текущий разряд: " + rank.label,
          nextRank ? ("Следующий разряд: " + nextRank.label + " с рейтинга " + nextRank.minRating) : "Следующий разряд: максимум текущей шкалы",
          "Позиция в дивизионе: #" + (playerRank(state, target.countryId, target.trackId, target.weightClassId) || "—")
        ]
      };
    }

    if (target.trackId === "street") {
      return {
        title: "Уличный путь",
        badge: tier.label,
        lines: [
          "Ступень: " + stage.label,
          "Класс бойца: " + tier.label,
          "Уличный рейтинг: " + (target.streetRating || score),
          "Позиция в дивизионе: #" + (playerRank(state, target.countryId, target.trackId, target.weightClassId) || "—")
        ]
      };
    }

    return {
      title: "Профессиональный путь",
      badge: tier.label,
      lines: [
        "Ступень: " + stage.label,
        "Класс бойца: " + tier.label,
        "Профи-рейтинг: " + (target.proRating || score),
        "Позиция в дивизионе: #" + (playerRank(state, target.countryId, target.trackId, target.weightClassId) || "—"),
        "Титульный вызов открывается около топ-3"
      ]
    };
  }


  window.FS.State = {
    createCareer: createCareer,
    createFighter: createFighter,
    createPeople: createPeople,
    player: player,
    syncPlayer: syncPlayer,
    setPlayerTrack: setPlayerTrack,
    setPlayerCountry: setPlayerCountry,
    setPlayerWeightClass: setPlayerWeightClass,
    setTactic: setTactic,
    trainPlayer: trainPlayer,
    updateDerivedFighterFields: updateDerivedFighterFields,
    updateAllDerived: updateAllDerived,
    rankForFighter: rankForFighter,
    ranking: ranking,
    addFighterAward: addFighterAward,
    getFighterAwards: getFighterAwards,
    repairState: repairState,
    playerRank: playerRank,
    pathProgress: pathProgress
  };
}());
