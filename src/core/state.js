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

  function recordByTrackAndRating(trackId, rating, rankId, age) {
    var wins;
    var losses;
    var draws;
    var koRate;
    var maxTotal;
    var total;
    var scale;
    var minKoRate;
    var maxKoRate;

    if (trackId === "pro") {
      if (rating >= 180) { wins = U.randomInt(28, 45); losses = U.randomInt(0, 2); }
      else if (rating >= 155) { wins = U.randomInt(21, 38); losses = U.randomInt(0, 4); }
      else if (rating >= 125) { wins = U.randomInt(14, 30); losses = U.randomInt(1, 7); }
      else if (rating >= 105) { wins = U.randomInt(7, 20); losses = U.randomInt(2, 10); }
      else { wins = U.randomInt(0, 10); losses = U.randomInt(0, 6); }
      minKoRate = 0.40;
      maxKoRate = 0.80;
      maxTotal = Math.max(0, (age || 18) - 17) * 8;
    } else if (trackId === "street") {
      if (rating >= 130) { wins = U.randomInt(55, 150); losses = U.randomInt(2, 18); }
      else if (rating >= 100) { wins = U.randomInt(30, 105); losses = U.randomInt(6, 38); }
      else if (rating >= 65) { wins = U.randomInt(12, 65); losses = U.randomInt(8, 55); }
      else if (rating >= 30) { wins = U.randomInt(4, 35); losses = U.randomInt(5, 45); }
      else { wins = U.randomInt(0, 14); losses = U.randomInt(0, 22); }
      minKoRate = 0.50;
      maxKoRate = 0.90;
      maxTotal = Math.max(12, ((age || 18) - 16) * 18);
    } else {
      if (rankId === "msmk" || rating >= 100) { wins = U.randomInt(75, 165); losses = U.randomInt(3, 25); }
      else if (rankId === "ms" || rating >= 80) { wins = U.randomInt(50, 130); losses = U.randomInt(7, 38); }
      else if (rankId === "kms" || rating >= 60) { wins = U.randomInt(28, 85); losses = U.randomInt(10, 48); }
      else if (rankId === "adult_1" || rating >= 40) { wins = U.randomInt(12, 48); losses = U.randomInt(8, 42); }
      else if (rankId === "adult_2" || rating >= 20) { wins = U.randomInt(4, 28); losses = U.randomInt(5, 34); }
      else { wins = U.randomInt(0, 14); losses = U.randomInt(0, 20); }
      minKoRate = 0.10;
      maxKoRate = 0.30;
      maxTotal = Math.max(12, 34 + Math.max(0, (age || 18) - 18) * 18);
    }

    draws = U.randomInt(0, Math.min(8, Math.floor((wins + losses) / 20)));
    total = wins + losses + draws;

    if (total > maxTotal) {
      scale = maxTotal / total;
      wins = Math.max(0, Math.floor(wins * scale));
      losses = Math.max(0, Math.floor(losses * scale));
      draws = Math.max(0, Math.min(6, maxTotal - wins - losses));
    }

    koRate = U.randomInt(Math.round(minKoRate * 100), Math.round(maxKoRate * 100)) / 100;

    return {
      wins: wins,
      losses: losses,
      draws: draws,
      kos: Math.max(0, Math.min(wins, Math.round(wins * koRate)))
    };
  }

  function createRecord(seed) {
    return recordByTrackAndRating("amateur", Math.abs(seed) % 100, "", 18);
  }

  function createFighter(countryId, trackId, seed, baseValue, options) {
    var country = U.findCountry(countryId);
    var opts = options || {};
    var weightClassId = trackId === "street" ? "" : (opts.weightClassId || Data.weightClasses[Math.abs(seed) % Data.weightClasses.length].id);
    var stanceId = opts.stanceId || "";
    var age = typeof opts.age === "number" ? opts.age : U.clamp(18 + (Math.abs(seed) % 18), 18, 42);
    var stats = opts.stats || U.createStats(trackId, baseValue);
    var rankId = opts.rankId || "";
    var record = opts.record || recordByTrackAndRating(trackId, U.statAverage(stats), rankId, age);
    var fighter = {
      id: opts.id || U.uid("fighter"),
      name: opts.name || U.createName(country, seed),
      countryId: countryId,
      homeCountryId: opts.homeCountryId || countryId,
      currentCountryId: opts.currentCountryId || countryId,
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
      fatigue: Number(opts.fatigue) || 0,
      equipment: opts.equipment || {},
      financeLog: opts.financeLog instanceof Array ? opts.financeLog : [],
      monthlyExpenseLog: opts.monthlyExpenseLog instanceof Array ? opts.monthlyExpenseLog : [],
      lastExpenseWeek: opts.lastExpenseWeek || 1,
      birthMonth: opts.birthMonth || U.randomInt(1, 12),
      birthWeek: opts.birthWeek || U.randomInt(1, 4),
      retired: !!opts.retired,
      retiredWeek: opts.retiredWeek || 0,
      retiredReason: opts.retiredReason || "",
      memorial: opts.memorial || null,
      recentOpponentIds: opts.recentOpponentIds instanceof Array ? opts.recentOpponentIds : [],
      nextFightWeek: opts.nextFightWeek || 0,
      contractOpponentId: opts.contractOpponentId || "",
      contractLabel: opts.contractLabel || "",
      contractPurse: Number(opts.contractPurse) || 0,
      contractRounds: Number(opts.contractRounds) || 0,
      contractId: opts.contractId || "",
      promoterId: opts.promoterId || "",
      expenseMultiplier: Number(opts.expenseMultiplier) || 1,
      hardModeDebt: !!opts.hardModeDebt,
      archetypeId: opts.archetypeId || "",
      lastMoveWeek: 1,
      lastFightWeek: 0,
      seed: seed
    };

    fighter.trackRecords[trackId] = cloneRecord(record);
    updateDerivedFighterFields(fighter);
    return fighter;
  }

  function scaledBaseForAmateurIndex(index, total) {
    var ratio = total > 1 ? index / (total - 1) : 0;
    if (ratio > 0.997) { return U.randomInt(100, 120); }
    if (ratio > 0.985) { return U.randomInt(85, 105); }
    if (ratio > 0.94) { return U.randomInt(65, 90); }
    if (ratio > 0.74) { return U.randomInt(42, 68); }
    if (ratio > 0.42) { return U.randomInt(22, 48); }
    return U.randomInt(0, 28);
  }

  function rankForBaseValue(value) {
    if (value >= 100) { return "msmk"; }
    if (value >= 85) { return "ms"; }
    if (value >= 65) { return "kms"; }
    if (value >= 42) { return "adult_1"; }
    if (value >= 22) { return "adult_2"; }
    return "adult_3";
  }

  function distributeCount(total, buckets) {
    var result = [];
    var i;
    var used = 0;
    for (i = 0; i < buckets; i += 1) {
      result[i] = Math.floor(total / buckets);
      used += result[i];
    }
    i = 0;
    while (used < total) {
      result[i % buckets] += 1;
      used += 1;
      i += 1;
    }
    return result;
  }

  function createRoster(player) {
    var roster = [];
    var countryIndex;
    var weightIndex;
    var fighterIndex;
    var country;
    var countryId;
    var weightClassId;
    var seed;
    var base;
    var count;
    var perWeight;
    var rankId;

    /* Профи: 1800 всего, 300 на вес. Страна зависит от итогового распределения Data.countries[].proCount. */
    for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
      country = Data.countries[countryIndex];
      countryId = country.id;
      perWeight = distributeCount(Number(country.proCount) || 0, Data.weightClasses.length);
      for (weightIndex = 0; weightIndex < Data.weightClasses.length; weightIndex += 1) {
        weightClassId = Data.weightClasses[weightIndex].id;
        for (fighterIndex = 0; fighterIndex < perWeight[weightIndex]; fighterIndex += 1) {
          seed = 100000 + countryIndex * 10000 + weightIndex * 1000 + fighterIndex;
          count = Math.max(1, perWeight[weightIndex]);
          base = U.clamp(90 + Math.round((fighterIndex / count) * 110) + U.randomInt(-5, 5), 90, 200);
          roster.push(createFighter(countryId, "pro", seed, base, {
            weightClassId: weightClassId,
            age: U.randomInt(19, 39)
          }));
        }
      }
    }

    /* Улица: суммарно до 5000. Количество по стране уже посчитано в Data.countries[].streetCount. */
    for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
      country = Data.countries[countryIndex];
      countryId = country.id;
      count = Number(country.streetCount) || 0;
      for (fighterIndex = 0; fighterIndex < count; fighterIndex += 1) {
        seed = 200000 + countryIndex * 10000 + fighterIndex;
        base = U.clamp(Math.round((fighterIndex / Math.max(1, count - 1)) * 150) + U.randomInt(-6, 6), 0, 150);
        roster.push(createFighter(countryId, "street", seed, base, {
          weightClassId: "",
          age: U.randomInt(18, 45)
        }));
      }
    }

    /* Любители: 20000 всего. Распределение по странам — финальное, по популярности/успехам/населению. */
    for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
      country = Data.countries[countryIndex];
      countryId = country.id;
      count = Number(country.amateurCount) || 0;
      for (fighterIndex = 0; fighterIndex < count; fighterIndex += 1) {
        seed = 300000 + countryIndex * 100000 + fighterIndex;
        base = scaledBaseForAmateurIndex(fighterIndex, count);
        rankId = rankForBaseValue(base);
        weightClassId = Data.weightClasses[(fighterIndex + countryIndex) % Data.weightClasses.length].id;
        roster.push(createFighter(countryId, "amateur", seed, base, {
          weightClassId: weightClassId,
          rankId: rankId,
          age: U.randomInt(18, 30)
        }));
      }
    }

    roster.push(player);
    return roster;
  }

  function createPeople(countryId) {
    return [];
  }

  function archetypeById(id) {
    var list = Data.careerArchetypes || [];
    return list.find(function (item) { return item.id === id; }) || list[1] || { id: "amateur", age: 18, baseOvr: 30, trackId: "amateur", money: 250, fatigue: 8 };
  }

  function flatStats(value) {
    var v = Math.max(0, Math.round(Number(value) || 0));
    return { power: v, technique: v, speed: v, stamina: v, defense: v };
  }

  function createCareer(payload) {
    var archetype = archetypeById(payload.archetypeId);
    var trackId = U.findTrack(archetype.trackId || payload.trackId || "amateur").id;
    var countryId = U.findCountry(payload.countryId).id;
    var weightClassId = U.findWeightClass(payload.weightClassId).id;
    var startingStats = flatStats(archetype.baseOvr);
    var player = createFighter(countryId, trackId, 777, archetype.baseOvr, {
      id: "player",
      name: payload.name || "Новый боксёр",
      isPlayer: true,
      known: true,
      homeCountryId: countryId,
      currentCountryId: countryId,
      weightClassId: trackId === "street" ? "" : weightClassId,
      stanceId: "",
      age: archetype.age || 18,
      stats: startingStats,
      record: emptyRecord(),
      trackRecords: { amateur: emptyRecord(), street: emptyRecord(), pro: emptyRecord() },
      trainingPoints: 0,
      money: Number(archetype.money) || 0,
      fatigue: Number(archetype.fatigue) || 0,
      equipment: {},
      financeLog: [],
      monthlyExpenseLog: [],
      lastExpenseWeek: 1,
      archetypeId: archetype.id,
      expenseMultiplier: archetype.expenseMultiplier || 1,
      hardModeDebt: !!archetype.hardModeDebt,
      promoterId: archetype.trackId === "pro" ? "local_hall" : "",
      careerLog: [{ week: 1, text: "Начало карьеры: " + archetype.label + "." }]
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
      people: [],
      offers: [],
      offerRefreshSalt: 0,
      trackedFighterIds: [],
      clubs: [],
      titles: {},
      amateurPath: { completed: {}, medals: [], lastCompetitionWeekById: {}, points: 0 },
      world: { news: [], weekReports: [], teamsByCountry: {}, transitionLog: [], stories: [], memorials: [], nationalTeamQualification: {}, reserveAdditions: {}, proContracts: [], proContractHistory: [], tournamentCalendar: [], pendingTournamentInvite: null, pendingProFight: null },
      feed: "Карьера началась: " + archetype.label + ". Мир загружен.",
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
    var cost;
    if (!p) { return false; }
    if (p.countryId === country.id) {
      state.feed = "Ты уже находишься в этой стране.";
      return false;
    }

    cost = Data.economy && Data.economy.travelCosts ? (Data.economy.travelCosts[country.id] || 220) : 220;
    if (!spendMoney(state, cost, "Перелёт: " + country.label)) { return false; }
    adjustFatigue(state, Data.economy && Data.economy.fatigue ? Data.economy.fatigue.travel : 14, "Перелёт");
    p.countryId = country.id;
    p.currentCountryId = country.id;
    p.gymId = "";
    state.people = [];
    state.rankingCountryId = country.id;
    state.rankingPage = 0;
    state.feed = "Перелёт: " + country.label + " за $" + cost + ". Старый зал сброшен, выбери новый во вкладке “Мой клуб”.";
    p.careerLog.unshift({ week: state.week, text: "Перелёт в страну: " + country.label + " ($" + cost + ")." });
    return true;
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


  function ensurePlayerSystems(state) {
    var p = player(state);
    if (!p) { return null; }
    p.homeCountryId = p.homeCountryId || p.countryId;
    p.currentCountryId = p.countryId;
    p.money = Number(p.money);
    if (!isFinite(p.money)) { p.money = Data.economy ? Data.economy.startingMoney : 650; }
    p.fatigue = U.clamp(Number(p.fatigue) || 0, 0, 100);
    p.equipment = p.equipment && typeof p.equipment === "object" ? p.equipment : {};
    p.financeLog = p.financeLog instanceof Array ? p.financeLog : [];
    p.monthlyExpenseLog = p.monthlyExpenseLog instanceof Array ? p.monthlyExpenseLog : [];
    p.lastExpenseWeek = Number(p.lastExpenseWeek) || 1;
    p.debtStartWeek = Number(p.debtStartWeek) || 0;
    p.debtDeadlineWeek = Number(p.debtDeadlineWeek) || 0;
    return p;
  }

  function pushFinanceLog(p, state, text, amount) {
    p.financeLog = p.financeLog instanceof Array ? p.financeLog : [];
    p.financeLog.unshift({ week: state.week, text: text, amount: Number(amount) || 0 });
    if (p.financeLog.length > 30) { p.financeLog.length = 30; }
  }

  function addMoney(state, amount, reason) {
    var p = ensurePlayerSystems(state);
    var value = Math.round(Number(amount) || 0);
    if (!p || value <= 0) { return false; }
    p.money += value;
    pushFinanceLog(p, state, reason || "Доход", value);
    updateDebtStatus(state, "income");
    return true;
  }

  function spendMoney(state, amount, reason) {
    var p = ensurePlayerSystems(state);
    var value = Math.round(Number(amount) || 0);
    if (!p || value <= 0) { return true; }
    p.money -= value;
    pushFinanceLog(p, state, reason || "Расход", -value);
    updateDebtStatus(state, "spend");
    return true;
  }

  function adjustFatigue(state, amount, reason) {
    var p = ensurePlayerSystems(state);
    if (!p) { return 0; }
    p.fatigue = U.clamp(Math.round((Number(p.fatigue) || 0) + (Number(amount) || 0)), 0, 100);
    if (reason && p.careerLog) {
      p.careerLog.unshift({ week: state.week, text: reason + ": усталость " + p.fatigue + "/100." });
    }
    return p.fatigue;
  }

  function isLockedByFatigue(state) {
    var p = ensurePlayerSystems(state);
    return !!(p && p.fatigue >= 100);
  }

  function fatigueLockedModal(state) {
    var p = ensurePlayerSystems(state);
    state.modal = { type: "fatigueLock", fatigue: p ? p.fatigue : 100 };
    state.feed = "Усталость 100/100. Можно только отдыхать.";
    return false;
  }

  function debtWeeksLeft(state) {
    var p = ensurePlayerSystems(state);
    if (!p || !p.debtStartWeek || p.money >= 0) { return 0; }
    return Math.max(0, (p.debtDeadlineWeek || (p.debtStartWeek + 12)) - state.week);
  }

  function updateDebtStatus(state, reason) {
    var p = ensurePlayerSystems(state);
    var weeksLeft;
    if (!p) { return; }
    if (p.money < 0 && !p.debtStartWeek) {
      p.debtStartWeek = state.week;
      p.debtDeadlineWeek = state.week + 12;
      state.modal = {
        type: "debtNotice",
        title: "Баланс ушёл в минус",
        text: "У тебя есть 3 месяца, чтобы выйти в плюс. Если долг останется после срока — игра закончится.",
        money: p.money,
        weeksLeft: 12
      };
      return;
    }
    if (p.money >= 0 && p.debtStartWeek) {
      p.debtStartWeek = 0;
      p.debtDeadlineWeek = 0;
      state.modal = {
        type: "debtNotice",
        title: "Долг закрыт",
        text: "Баланс снова в плюсе. Таймер банкротства снят.",
        money: p.money,
        weeksLeft: 0
      };
      return;
    }
    if (p.money < 0 && p.debtStartWeek) {
      weeksLeft = debtWeeksLeft(state);
      if (weeksLeft <= 0) {
        state.gameOver = true;
        state.modal = {
          type: "gameOver",
          title: "Игра окончена",
          text: "Ты не вышел из минуса за 3 месяца. Карьера сорвалась из-за долгов.",
          money: p.money
        };
      }
    }
  }

  function equipmentSummary(state) {
    var p = ensurePlayerSystems(state);
    var items = Data.economy && Data.economy.equipment ? Data.economy.equipment : [];
    var owned = [];
    var trainingBonus = 0;
    var fatigueReduction = 0;
    var upkeep = 0;
    if (!p) { return { owned: owned, trainingBonus: 0, fatigueReduction: 0, upkeep: 0 }; }
    items.forEach(function (item) {
      if (p.equipment[item.id]) {
        owned.push(item);
        trainingBonus += Number(item.trainingBonus) || 0;
        fatigueReduction += Number(item.fatigueReduction) || 0;
        upkeep += Number(item.upkeep) || 0;
      }
    });
    return { owned: owned, trainingBonus: trainingBonus, fatigueReduction: fatigueReduction, upkeep: upkeep };
  }

  function clubMonthlyFee(state) {
    var club = window.FS.Clubs && window.FS.Clubs.playerClub ? window.FS.Clubs.playerClub(state) : null;
    if (!club) { return 0; }
    return Math.round(35 + (Number(club.level) || 1) * 42);
  }

  function monthlyExpenseBreakdown(state) {
    var p = ensurePlayerSystems(state);
    var econ = Data.economy || {};
    var trackCost;
    var food;
    var medical;
    var clubFee;
    var equipment = 0;
    var multiplier;
    var total;

    if (p && p.age < 18) {
      return { trackCost: 0, food: 0, medical: 0, clubFee: 0, equipment: 0, total: 0, freeYouth: true };
    }

    trackCost = econ.livingCostByTrack ? (econ.livingCostByTrack[p.trackId] || 100) : 100;
    food = Number(econ.foodCost) || 70;
    medical = Number(econ.medicalReserveCost) || 45;
    clubFee = clubMonthlyFee(state);
    multiplier = Number(p.expenseMultiplier) || 1;
    total = Math.round((trackCost + food + medical + clubFee + equipment) * multiplier);
    return { trackCost: Math.round(trackCost * multiplier), food: Math.round(food * multiplier), medical: Math.round(medical * multiplier), clubFee: Math.round(clubFee * multiplier), equipment: 0, total: total, multiplier: multiplier };
  }

  function applyMonthlyExpenses(state) {
    var p = ensurePlayerSystems(state);
    var parts;
    if (!p) { return false; }
    if (state.week <= 1 || state.week % 4 !== 1 || p.lastExpenseWeek === state.week) { return false; }
    parts = monthlyExpenseBreakdown(state);
    p.lastExpenseWeek = state.week;
    p.monthlyExpenseLog.unshift({ week: state.week, total: parts.total, parts: parts });
    if (p.monthlyExpenseLog.length > 24) { p.monthlyExpenseLog.length = 24; }
    p.money -= parts.total;
    pushFinanceLog(p, state, "Ежемесячные расходы", -parts.total);
    if (p.money >= 0) {
      adjustFatigue(state, -4, "Нормальный месяц оплачен");
      state.feed = "Ежемесячные расходы: -$" + parts.total + ".";
    } else {
      adjustFatigue(state, Data.economy && Data.economy.fatigue ? Data.economy.fatigue.monthlyStressNoMoney : 16, "Деньги ушли в минус");
      state.feed = "Деньги ушли в минус. Есть 3 месяца, чтобы выйти в плюс.";
    }
    updateDebtStatus(state, "monthly");
    return true;
  }

  function buyEquipment(state, itemId) {
    var p = ensurePlayerSystems(state);
    var items = Data.economy && Data.economy.equipment ? Data.economy.equipment : [];
    var item = items.find(function (entry) { return entry.id === itemId; });
    if (!p || !item) { return false; }
    if (p.equipment[item.id]) { state.feed = "Эта экипировка уже куплена."; return false; }
    if (!spendMoney(state, item.cost, "Покупка: " + item.label)) { return false; }
    p.equipment[item.id] = true;
    state.feed = "Куплено: " + item.label + ".";
    return true;
  }

  function buyMedicalService(state, serviceId) {
    var service = Data.economy && Data.economy.medicalServices ? Data.economy.medicalServices.find(function (entry) { return entry.id === serviceId; }) : null;
    if (!service) { return false; }
    if (!spendMoney(state, service.cost, service.label)) { return false; }
    adjustFatigue(state, service.fatigue, service.label);
    state.feed = service.label + ": усталость снижена.";
    return true;
  }

  function restPlayer(state) {
    var reduction = Data.economy && Data.economy.fatigue ? Data.economy.fatigue.restWeek : 18;
    adjustFatigue(state, -reduction, "Неделя восстановления");
    state.feed = "Неделя восстановления: усталость снижена.";
    updateDebtStatus(state, "rest");
    return true;
  }

  function trainPlayer(state, statKey) {
    var p = ensurePlayerSystems(state);
    var keys = ["power", "technique", "speed", "stamina", "defense"];
    var cap;
    var club;
    var mod = 1;
    var fatiguePenalty;
    var eq;
    var points;
    var fatigueGain;

    if (!p) { return; }
    p.trainingPoints = Number(p.trainingPoints) || 0;

    if (p.fatigue >= 100) {
      state.feed = "Усталость 100/100. Можно только отдыхать.";
      state.modal = { type: "fatigueLock", fatigue: p.fatigue };
      return;
    }

    if (!statKey) {
      club = window.FS.Clubs && window.FS.Clubs.playerClub ? window.FS.Clubs.playerClub(state) : null;
      eq = equipmentSummary(state);
      mod = club ? (Number(club.trainingModifier) || 1) : 1;
      fatiguePenalty = p.fatigue >= 80 ? 0.55 : (p.fatigue >= 60 ? 0.75 : 1);
      points = Math.max(1, Math.round(5 * mod * (1 + eq.trainingBonus) * fatiguePenalty));
      fatigueGain = Math.max(5, (Data.economy && Data.economy.fatigue ? Data.economy.fatigue.trainingWeek : 12) - eq.fatigueReduction);
      p.trainingPoints += points;
      adjustFatigue(state, fatigueGain, "Тренировочная неделя");
      p.careerLog.unshift({ week: state.week, text: "Тренировка: +" + points + " очков прокачки, усталость " + p.fatigue + "/100." });
      state.feed = "Тренировка: +" + points + " очков. Усталость " + p.fatigue + "/100.";
      updateDebtStatus(state, "training");
      return;
    }

    if (keys.indexOf(statKey) === -1) { return; }
    if (p.trainingPoints <= 0) { state.feed = "Не хватает очков прокачки."; return; }
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
    var seen = {};

    function pushAward(award) {
      if (!award || !award.label || seen[award.label]) {
        return;
      }
      seen[award.label] = true;
      result.push(award);
    }

    if (!fighter) { return result; }
    if (fighter.awards instanceof Array) {
      fighter.awards.forEach(pushAward);
    }

    if (fighter.isPlayer && state.amateurPath && state.amateurPath.medals instanceof Array) {
      medals = state.amateurPath.medals;
      for (i = 0; i < medals.length; i += 1) {
        pushAward({ week: medals[i].week, label: medals[i].awardLabel || medals[i].label, source: "amateur" });
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

  function recordStrengthForRanking(fighter) {
    var record = fighter.record || {};
    var wins = Number(record.wins) || 0;
    var losses = Number(record.losses) || 0;
    var draws = Number(record.draws) || 0;
    var kos = Number(record.kos) || 0;
    var total = wins + losses + draws;
    var winRate = total ? wins / total : 0;
    var activity = Math.min(total, fighter.trackId === "pro" ? 60 : 160);
    var titleBonus = fighter.titles ? Math.min(fighter.titles.length * 18, 72) : 0;
    var awardBonus = fighter.awards ? Math.min(fighter.awards.length * 8, 40) : 0;

    return wins * 3.2 - losses * 4.6 + draws * 0.6 + kos * 0.55 + winRate * 34 + activity * 0.28 + titleBonus + awardBonus;
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

        return !fighter.retired && countryOk && fighter.trackId === trackId && weightOk;
      })
      .sort(function (left, right) {
        return (recordStrengthForRanking(right) + U.statAverage(right.stats) * 0.08) - (recordStrengthForRanking(left) + U.statAverage(left.stats) * 0.08);
      });
  }

  function repairState(state) {
    var i;
    var p;

    if (!state) { return null; }
    state.version = Data.appVersion;
    state.week = Math.max(1, Number(state.week) || 1);
    state.rankingPage = Math.max(0, Number(state.rankingPage) || 0);
    state.offerRefreshSalt = Number(state.offerRefreshSalt) || 0;
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
    state.world.memorials = state.world.memorials instanceof Array ? state.world.memorials : [];
    state.world.nationalTeamQualification = state.world.nationalTeamQualification || {};
    state.world.reserveAdditions = state.world.reserveAdditions || {};
    state.world.teamCoaches = state.world.teamCoaches || {};
    state.world.proContracts = state.world.proContracts instanceof Array ? state.world.proContracts : [];
    state.world.proContractHistory = state.world.proContractHistory instanceof Array ? state.world.proContractHistory : [];
    state.world.tournamentCalendar = state.world.tournamentCalendar instanceof Array ? state.world.tournamentCalendar : [];
    state.world.pendingTournamentInvite = state.world.pendingTournamentInvite || null;
    state.world.pendingProFight = state.world.pendingProFight || null;

    for (i = 0; i < state.roster.length; i += 1) {
      state.roster[i].titles = state.roster[i].titles instanceof Array ? state.roster[i].titles : [];
      state.roster[i].careerLog = state.roster[i].careerLog instanceof Array ? state.roster[i].careerLog : [];
      state.roster[i].storyFlags = state.roster[i].storyFlags instanceof Array ? state.roster[i].storyFlags : [];
      state.roster[i].awards = state.roster[i].awards instanceof Array ? state.roster[i].awards : [];
      state.roster[i].trainingPoints = Number(state.roster[i].trainingPoints) || 0;
      state.roster[i].birthMonth = state.roster[i].birthMonth || U.randomInt(1, 12);
      state.roster[i].birthWeek = state.roster[i].birthWeek || U.randomInt(1, 4);
      state.roster[i].retired = !!state.roster[i].retired;
      state.roster[i].recentOpponentIds = state.roster[i].recentOpponentIds instanceof Array ? state.roster[i].recentOpponentIds : [];
      state.roster[i].money = Number(state.roster[i].money) || 0;
      state.roster[i].fatigue = U.clamp(Number(state.roster[i].fatigue) || 0, 0, 100);
      state.roster[i].equipment = state.roster[i].equipment && typeof state.roster[i].equipment === "object" ? state.roster[i].equipment : {};
      state.roster[i].financeLog = state.roster[i].financeLog instanceof Array ? state.roster[i].financeLog : [];
      state.roster[i].monthlyExpenseLog = state.roster[i].monthlyExpenseLog instanceof Array ? state.roster[i].monthlyExpenseLog : [];
      state.roster[i].lastExpenseWeek = Number(state.roster[i].lastExpenseWeek) || 1;
      state.roster[i].fatigue = U.clamp(Number(state.roster[i].fatigue) || 0, 0, 100);
      state.roster[i].equipment = state.roster[i].equipment && typeof state.roster[i].equipment === "object" ? state.roster[i].equipment : {};
      state.roster[i].financeLog = state.roster[i].financeLog instanceof Array ? state.roster[i].financeLog : [];
      state.roster[i].monthlyExpenseLog = state.roster[i].monthlyExpenseLog instanceof Array ? state.roster[i].monthlyExpenseLog : [];
      state.roster[i].lastExpenseWeek = Number(state.roster[i].lastExpenseWeek) || 1;
      state.roster[i].debtStartWeek = Number(state.roster[i].debtStartWeek) || 0;
      state.roster[i].debtDeadlineWeek = Number(state.roster[i].debtDeadlineWeek) || 0;
      state.roster[i].nextFightWeek = Number(state.roster[i].nextFightWeek) || 0;
      state.roster[i].contractOpponentId = state.roster[i].contractOpponentId || "";
      state.roster[i].contractLabel = state.roster[i].contractLabel || "";
      state.roster[i].contractPurse = Number(state.roster[i].contractPurse) || 0;
      state.roster[i].contractRounds = Number(state.roster[i].contractRounds) || 0;
      state.roster[i].contractId = state.roster[i].contractId || "";
      state.roster[i].promoterId = state.roster[i].promoterId || "";
      state.roster[i].expenseMultiplier = Number(state.roster[i].expenseMultiplier) || 1;
      state.roster[i].hardModeDebt = !!state.roster[i].hardModeDebt;
      state.roster[i].archetypeId = state.roster[i].archetypeId || "";
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

  function dateParts(state) {
    var months = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
    var weekIndex = Math.max(0, (Number(state.week) || 1) - 1);
    var year = Math.floor(weekIndex / 48) + 1;
    var monthIndex = Math.floor((weekIndex % 48) / 4);
    var weekOfMonth = (weekIndex % 4) + 1;
    return { year: year, month: monthIndex + 1, monthLabel: months[monthIndex], weekOfMonth: weekOfMonth };
  }

  function dateText(state) {
    var parts = dateParts(state);
    return "год " + parts.year + ", " + parts.monthLabel + ", " + parts.weekOfMonth + " неделя";
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
    cloneRecord: cloneRecord,
    dateParts: dateParts,
    dateText: dateText,
    ensurePlayerSystems: ensurePlayerSystems,
    addMoney: addMoney,
    spendMoney: spendMoney,
    adjustFatigue: adjustFatigue,
    monthlyExpenseBreakdown: monthlyExpenseBreakdown,
    applyMonthlyExpenses: applyMonthlyExpenses,
    equipmentSummary: equipmentSummary,
    buyEquipment: buyEquipment,
    buyMedicalService: buyMedicalService,
    restPlayer: restPlayer,
    isLockedByFatigue: isLockedByFatigue,
    fatigueLockedModal: fatigueLockedModal,
    debtWeeksLeft: debtWeeksLeft,
    updateDebtStatus: updateDebtStatus
  };
}());
