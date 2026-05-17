(function () {
  "use strict";

  window.FS = window.FS || {};

  var Data = window.FS.Data;
  var U = window.FS.Utils;

  function emptyRecord() {
    return { wins: 0, losses: 0, draws: 0, kos: 0 };
  }

  function cloneRecord(record) {
    var safe = record || emptyRecord();
    return {
      wins: Number(safe.wins) || 0,
      losses: Number(safe.losses) || 0,
      draws: Number(safe.draws) || 0,
      kos: Number(safe.kos) || 0
    };
  }

  function ensureTrackRecords(fighter) {
    if (!fighter.trackRecords || typeof fighter.trackRecords !== "object") {
      fighter.trackRecords = {
        amateur: emptyRecord(),
        street: emptyRecord(),
        pro: emptyRecord()
      };
    }
    fighter.trackRecords.amateur = cloneRecord(fighter.trackRecords.amateur);
    fighter.trackRecords.street = cloneRecord(fighter.trackRecords.street);
    fighter.trackRecords.pro = cloneRecord(fighter.trackRecords.pro);

    if (fighter.trackId && fighter.record) {
      fighter.trackRecords[fighter.trackId] = cloneRecord(fighter.record);
    }
  }

  function setActiveRecord(fighter, trackId) {
    ensureTrackRecords(fighter);
    fighter.trackRecords[fighter.trackId] = cloneRecord(fighter.record);
    fighter.record = cloneRecord(fighter.trackRecords[trackId] || emptyRecord());
  }

  function rankForFighter(fighter) {
    var rating = U.statAverage(fighter.stats);
    var ranks = Data.amateurRanks;
    var i;
    var best = ranks[0];

    for (i = 0; i < ranks.length; i += 1) {
      if (rating >= ranks[i].minRating && rating <= ranks[i].maxRating) {
        return ranks[i];
      }
      if (rating >= ranks[i].minRating) {
        best = ranks[i];
      }
    }

    return best;
  }

  function baseForRank(rankId) {
    var i;
    for (i = 0; i < Data.amateurRanks.length; i += 1) {
      if (Data.amateurRanks[i].id === rankId) {
        return U.randomInt(Data.amateurRanks[i].minRating, Data.amateurRanks[i].maxRating);
      }
    }
    return 30;
  }

  function recordByTrackAndRating(trackId, rating, rankId) {
    var wins;
    var losses;
    var draws;
    var koRate;

    if (trackId === "pro") {
      if (rating >= 180) { wins = U.randomInt(28, 45); losses = U.randomInt(0, 2); }
      else if (rating >= 155) { wins = U.randomInt(21, 38); losses = U.randomInt(0, 4); }
      else if (rating >= 125) { wins = U.randomInt(14, 30); losses = U.randomInt(1, 7); }
      else if (rating >= 105) { wins = U.randomInt(7, 20); losses = U.randomInt(2, 10); }
      else { wins = U.randomInt(0, 10); losses = U.randomInt(0, 6); }
      koRate = 0.62;
    } else if (trackId === "street") {
      if (rating >= 130) { wins = U.randomInt(55, 150); losses = U.randomInt(2, 18); }
      else if (rating >= 100) { wins = U.randomInt(30, 105); losses = U.randomInt(6, 38); }
      else if (rating >= 65) { wins = U.randomInt(12, 65); losses = U.randomInt(8, 55); }
      else if (rating >= 30) { wins = U.randomInt(4, 35); losses = U.randomInt(5, 45); }
      else { wins = U.randomInt(0, 14); losses = U.randomInt(0, 22); }
      koRate = 0.58;
    } else {
      if (rankId === "msmk" || rating >= 90) { wins = U.randomInt(75, 165); losses = U.randomInt(3, 25); }
      else if (rankId === "ms" || rating >= 75) { wins = U.randomInt(50, 130); losses = U.randomInt(7, 38); }
      else if (rankId === "kms" || rating >= 60) { wins = U.randomInt(28, 85); losses = U.randomInt(10, 48); }
      else if (rankId === "adult_1" || rating >= 40) { wins = U.randomInt(12, 48); losses = U.randomInt(8, 42); }
      else if (rankId === "adult_2" || rating >= 20) { wins = U.randomInt(4, 28); losses = U.randomInt(5, 34); }
      else { wins = U.randomInt(0, 14); losses = U.randomInt(0, 20); }
      koRate = 0.28;
    }

    draws = U.randomInt(0, Math.min(8, Math.floor((wins + losses) / 20)));
    return {
      wins: wins,
      losses: losses,
      draws: draws,
      kos: U.randomInt(0, Math.max(0, Math.min(wins, Math.round(wins * koRate))))
    };
  }

  function createRecord(seed) {
    return recordByTrackAndRating("amateur", Math.abs(seed) % 100, "");
  }

  function createFighter(countryId, trackId, seed, baseValue, options) {
    var country = U.findCountry(countryId);
    var opts = options || {};
    var weightClassId = trackId === "street" ? "" : (opts.weightClassId || Data.weightClasses[Math.abs(seed) % Data.weightClasses.length].id);
    var stanceId = opts.stanceId || Data.stances[Math.abs(seed + 1) % Data.stances.length].id;
    var age = typeof opts.age === "number" ? opts.age : U.clamp(18 + (Math.abs(seed) % 18), 18, 42);
    var stats = opts.stats || U.createStats(trackId, baseValue);
    var rankId = opts.rankId || "";
    var record = opts.record || recordByTrackAndRating(trackId, U.statAverage(stats), rankId);
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
      record: cloneRecord(record),
      trackRecords: opts.trackRecords || { amateur: emptyRecord(), street: emptyRecord(), pro: emptyRecord() },
      isPlayer: !!opts.isPlayer,
      known: !!opts.known,
      hasGonePro: trackId === "pro" || !!opts.hasGonePro,
      proClosed: !!opts.proClosed,
      titles: opts.titles || [],
      awards: opts.awards || [],
      careerLog: opts.careerLog || [],
      storyFlags: opts.storyFlags || [],
      trainingPoints: opts.trainingPoints || 0,
      money: Number(opts.money) || 0,
      nextFightWeek: opts.nextFightWeek || 0,
      contractOpponentId: opts.contractOpponentId || "",
      contractLabel: opts.contractLabel || "",
      lastMoveWeek: 1,
      lastFightWeek: 0,
      seed: seed
    };

    fighter.trackRecords[trackId] = cloneRecord(record);
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
    var count;
    var seed;
    var base;

    /* Профи: 100 в каждом весе, OVR 90-200 */
    for (weightIndex = 0; weightIndex < Data.weightClasses.length; weightIndex += 1) {
      weightClassId = Data.weightClasses[weightIndex].id;
      for (fighterIndex = 0; fighterIndex < 200; fighterIndex += 1) {
        countryId = Data.countries[fighterIndex % Data.countries.length].id;
        seed = 100000 + weightIndex * 2000 + fighterIndex;
        base = U.clamp(90 + Math.round(fighterIndex * 0.56), 90, 200);
        roster.push(createFighter(countryId, "pro", seed, base, {
          weightClassId: weightClassId,
          age: U.randomInt(19, 39)
        }));
      }
    }

    /* Улица: 1000 в каждой стране, OVR 0-150, без веса */
    for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
      countryId = Data.countries[countryIndex].id;
      for (fighterIndex = 0; fighterIndex < 1000; fighterIndex += 1) {
        seed = 200000 + countryIndex * 10000 + fighterIndex;
        base = U.clamp(Math.round(fighterIndex * 0.155), 0, 150);
        roster.push(createFighter(countryId, "street", seed, base, {
          weightClassId: "",
          age: U.randomInt(18, 45)
        }));
      }
    }

    /* Любители: 15 МСМК, 30 МС, 60 КМС, 150 I, 300 II, 500 III в каждой стране */
    for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
      countryId = Data.countries[countryIndex].id;
      for (rankIndex = 0; rankIndex < Data.amateurRanks.length; rankIndex += 1) {
        rank = Data.amateurRanks[rankIndex];
        count = Data.amateurRankRosterCounts[rank.id] || 50;
        for (fighterIndex = 0; fighterIndex < count; fighterIndex += 1) {
          seed = 300000 + countryIndex * 100000 + rankIndex * 10000 + fighterIndex;
          base = baseForRank(rank.id);
          weightClassId = Data.weightClasses[(fighterIndex + rankIndex) % Data.weightClasses.length].id;
          roster.push(createFighter(countryId, "amateur", seed, base, {
            weightClassId: weightClassId,
            rankId: rank.id,
            age: U.randomInt(18, 34)
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
    var player = createFighter(countryId, trackId, 777, trackId === "pro" ? 90 : 35, {
      id: "player",
      name: payload.name || "Новый боксёр",
      isPlayer: true,
      known: true,
      weightClassId: trackId === "street" ? "" : weightClassId,
      stanceId: stanceId,
      age: payload.age || 18,
      record: emptyRecord(),
      trackRecords: { amateur: emptyRecord(), street: emptyRecord(), pro: emptyRecord() },
      trainingPoints: 0,
      money: 0,
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
      rankingPage: 0,
      modal: null,
      roster: [],
      people: createPeople(countryId),
      offers: [],
      trackedFighterIds: [],
      clubs: [],
      titles: {},
      amateurPath: { completed: {}, medals: [], lastCompetitionWeekById: {}, points: 0 },
      world: { news: [], weekReports: [], teamsByCountry: {}, transitionLog: [], stories: [] },
      feed: "Карьера началась. Мир загружен, ближайшие соперники подобраны.",
      createdAt: new Date().toISOString()
    };

    player.trackRecords[trackId] = cloneRecord(player.record);
    state.roster = createRoster(player);
    return state;
  }

  function player(state) {
    return U.getFighterById(state, state.playerId);
  }

  function syncPlayer(state) {
    var p = player(state);
    if (p) {
      p.isPlayer = true;
      p.known = true;
    }
  }

  function switchFighterTrack(state, fighter, targetTrackId, reason) {
    var target = U.findTrack(targetTrackId);
    if (!fighter || !target || fighter.trackId === target.id) {
      return false;
    }

    ensureTrackRecords(fighter);
    fighter.trackRecords[fighter.trackId] = cloneRecord(fighter.record);
    fighter.record = cloneRecord(fighter.trackRecords[target.id] || emptyRecord());

    if (fighter.trackId === "pro" && target.id === "street") {
      fighter.proClosed = true;
    }
    if (target.id === "pro") {
      fighter.hasGonePro = true;
    }

    fighter.trackId = target.id;
    if (target.id === "street") {
      fighter.weightClassId = "";
    } else if (!fighter.weightClassId) {
      fighter.weightClassId = Data.weightClasses[2].id;
    }

    fighter.gymId = "";
    fighter.lastMoveWeek = state.week;
    updateDerivedFighterFields(fighter);

    if (reason && fighter.careerLog) {
      fighter.careerLog.unshift({ week: state.week, text: reason });
    }

    return true;
  }

  function setPlayerTrack(state, trackId) {
    var p = player(state);
    var target = U.findTrack(trackId);
    var rating = p ? U.statAverage(p.stats) : 0;
    if (!p || !target) {
      return false;
    }

    if (target.id === "amateur" && rating > 100) {
      state.feed = "OVR выше 100: в любители перейти нельзя.";
      return false;
    }
    if (target.id === "street" && rating > 150) {
      state.feed = "OVR выше 150: на улицу перейти нельзя.";
      return false;
    }
    if (target.id === "pro" && rating < 90) {
      state.feed = "Для профи нужен OVR 90+.";
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

    if (switchFighterTrack(state, p, target.id, "Переход: " + target.label + ".")) {
      state.rankingTrackId = target.id;
      state.rankingWeightClassId = p.weightClassId || state.rankingWeightClassId;
      state.rankingPage = 0;
      state.feed = "Путь изменён: " + target.label + ". Рекорд текущего пути восстановлен отдельно.";
      return true;
    }

    return false;
  }

  function setPlayerCountry(state, countryId) {
    var country = U.findCountry(countryId);
    var p = player(state);
    if (!p) { return; }

    p.countryId = country.id;
    p.gymId = "";
    state.people = createPeople(country.id);
    state.rankingCountryId = country.id;
    state.rankingPage = 0;
    state.feed = "Перелёт: " + country.label + ". Старый зал сброшен, выбери новый во вкладке “Мой клуб”.";
    p.careerLog.unshift({ week: state.week, text: "Перелёт в страну: " + country.label + "." });
  }

  function setPlayerWeightClass(state, weightClassId) {
    var p = player(state);
    var currentIndex;
    var targetIndex;
    var target;

    if (!p || p.trackId === "street") {
      state.feed = "На улице нет весовых категорий.";
      return false;
    }

    currentIndex = Data.weightClasses.findIndex(function (weight) { return weight.id === p.weightClassId; });
    targetIndex = Data.weightClasses.findIndex(function (weight) { return weight.id === weightClassId; });
    target = U.findWeightClass(weightClassId);

    if (currentIndex < 0 || targetIndex < 0) {
      return false;
    }

    if (currentIndex === Data.weightClasses.length - 1) {
      state.feed = "В тяжёлом весе выше переходить нельзя.";
      return false;
    }

    if (targetIndex <= currentIndex || targetIndex > currentIndex + 2) {
      state.feed = "Можно перейти только вверх и максимум на две весовые.";
      return false;
    }

    p.weightClassId = target.id;
    state.rankingWeightClassId = target.id;
    state.rankingPage = 0;
    state.feed = "Весовая категория изменена: " + target.label + ".";
    p.careerLog.unshift({ week: state.week, text: "Переход в вес: " + target.label + "." });
    return true;
  }

  function setTactic() {
    return false;
  }

  function updateDerivedFighterFields(fighter) {
    if (fighter.trackId === "amateur") {
      fighter.amateurRankId = rankForFighter(fighter).id;
    }
    if (fighter.trackId === "street") {
      fighter.weightClassId = "";
      fighter.streetRating = U.clamp(U.statAverage(fighter.stats) + Math.round(fighter.record.wins * 0.18) - Math.round(fighter.record.losses * 0.11), 1, 220);
    }
    if (fighter.trackId === "pro") {
      fighter.proRating = U.clamp(U.statAverage(fighter.stats) + Math.round(fighter.record.wins * 0.55), 1, 260);
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
    var cap;
    var club;
    var mod = 1;

    if (!p) { return; }
    p.trainingPoints = Number(p.trainingPoints) || 0;

    if (!statKey) {
      club = window.FS.Clubs && window.FS.Clubs.playerClub ? window.FS.Clubs.playerClub(state) : null;
      mod = club ? (Number(club.trainingModifier) || 1) : 1;
      p.trainingPoints += Math.max(1, Math.round(5 * mod));
      p.careerLog.unshift({ week: state.week, text: "Тренировочная неделя: +" + Math.max(1, Math.round(5 * mod)) + " очков прокачки." });
      state.feed = "Тренировочная неделя завершена. Получено " + Math.max(1, Math.round(5 * mod)) + " очков прокачки.";
      return;
    }

    if (keys.indexOf(statKey) === -1) {
      return;
    }

    if (p.trainingPoints <= 0) {
      state.feed = "Не хватает очков прокачки.";
      return;
    }

    cap = U.findTrack(p.trackId).maxStat;
    p.trainingPoints -= 1;
    p.stats[statKey] = U.clamp(p.stats[statKey] + 1, 1, cap);
    updateDerivedFighterFields(p);
    p.careerLog.unshift({ week: state.week, text: "Прокачка: +" + U.getStatLabel(statKey) + "." });
    state.feed = "Потрачено 1 очко. Улучшен навык: " + U.getStatLabel(statKey) + ".";
  }

  function getFighterAwards(state, fighter) {
    var result = [];
    var medals;
    var i;

    if (!fighter) { return result; }
    if (fighter.awards instanceof Array) {
      result = result.concat(fighter.awards);
    }

    if (fighter.isPlayer && state.amateurPath && state.amateurPath.medals instanceof Array) {
      medals = state.amateurPath.medals;
      for (i = 0; i < medals.length; i += 1) {
        result.push({ week: medals[i].week, label: medals[i].awardLabel || medals[i].label, source: "amateur" });
      }
    }

    return result;
  }

  function addFighterAward(state, fighter, awardLabel, source) {
    if (!fighter || !awardLabel) { return; }
    fighter.awards = fighter.awards instanceof Array ? fighter.awards : [];

    if (!fighter.awards.some(function (award) { return award.label === awardLabel; })) {
      fighter.awards.unshift({ id: U.uid("award"), week: state.week, label: awardLabel, source: source || "career" });
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

    if (!state) { return null; }
    state.version = Data.appVersion;
    state.week = Math.max(1, Number(state.week) || 1);
    state.rankingPage = Math.max(0, Number(state.rankingPage) || 0);
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
    state.roster = state.roster instanceof Array ? state.roster : [];
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
      state.roster[i].money = Number(state.roster[i].money) || 0;
      state.roster[i].nextFightWeek = Number(state.roster[i].nextFightWeek) || 0;
      state.roster[i].contractOpponentId = state.roster[i].contractOpponentId || "";
      state.roster[i].contractLabel = state.roster[i].contractLabel || "";
      ensureTrackRecords(state.roster[i]);
      updateDerivedFighterFields(state.roster[i]);
    }

    p = player(state);
    if (p) {
      state.rankingCountryId = state.rankingCountryId || p.countryId;
      state.rankingTrackId = state.rankingTrackId || p.trackId;
      state.rankingWeightClassId = state.rankingWeightClassId || p.weightClassId || "welter";
    }

    return state;
  }

  function playerRank(state, countryId, trackId, weightClassId) {
    var p = player(state);
    var list;
    var i;

    if (!p) { return 0; }
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
    var tier;
    var stage;

    if (!target) {
      return { title: "Нет данных", lines: [] };
    }

    score = U.statAverage(target.stats);
    tier = window.FS.Matchmaking ? window.FS.Matchmaking.careerTier(target) : { label: "Боец" };
    stage = window.FS.Matchmaking ? window.FS.Matchmaking.careerStage(target) : { label: "Базовый уровень" };

    if (target.trackId === "amateur") {
      rank = rankForFighter(target);
      return {
        title: "Любительский путь",
        badge: rank.label,
        lines: [
          "Ступень: " + stage.label,
          "Класс бойца: " + tier.label,
          "Текущий разряд: " + rank.label,
          "Позиция в дивизионе: #" + (playerRank(state, target.countryId, target.trackId, target.weightClassId) || "—")
        ]
      };
    }

    if (target.trackId === "street") {
      return {
        title: "Уличный путь",
        badge: tier.label,
        lines: [
          "Класс бойца: " + tier.label,
          "Уличный рейтинг: " + (target.streetRating || score),
          "Позиция в стране: #" + (playerRank(state, target.countryId, target.trackId, "") || "—")
        ]
      };
    }

    return {
      title: "Профессиональный путь",
      badge: tier.label,
      lines: [
        "Класс бойца: " + tier.label,
        "Профи-рейтинг: " + (target.proRating || score),
        "Мировая позиция: #" + (playerRank(state, "world", target.trackId, target.weightClassId) || "—")
      ]
    };
  }

  window.FS.State = {
    createCareer: createCareer,
    createFighter: createFighter,
    createRecord: createRecord,
    player: player,
    syncPlayer: syncPlayer,
    setPlayerTrack: setPlayerTrack,
    setPlayerCountry: setPlayerCountry,
    setPlayerWeightClass: setPlayerWeightClass,
    setTactic: setTactic,
    trainPlayer: trainPlayer,
    updateDerivedFighterFields: updateDerivedFighterFields,
    updateAllDerived: updateAllDerived,
    ranking: ranking,
    getFighterAwards: getFighterAwards,
    addFighterAward: addFighterAward,
    rankForFighter: rankForFighter,
    repairState: repairState,
    playerRank: playerRank,
    pathProgress: pathProgress,
    switchFighterTrack: switchFighterTrack,
    ensureTrackRecords: ensureTrackRecords,
    cloneRecord: cloneRecord
  };
}());
