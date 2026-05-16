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

    for (i = 0; i < ranks.length; i += 1) {
      if (rating >= ranks[i].minRating) {
        best = ranks[i];
      }
    }

    return best;
  }

  function createRecord(seed) {
    var wins = U.randomInt(0, 9) + Math.floor(seed / 5);
    var losses = U.randomInt(0, 4);
    var draws = U.randomInt(0, 1);
    return {
      wins: wins,
      losses: losses,
      draws: draws,
      kos: U.randomInt(0, Math.max(0, Math.min(wins, 7)))
    };
  }

  function createFighter(countryId, trackId, seed, baseValue, options) {
    var country = U.findCountry(countryId);
    var opts = options || {};
    var weightClassId = opts.weightClassId || Data.weightClasses[Math.abs(seed) % Data.weightClasses.length].id;
    var stanceId = opts.stanceId || Data.stances[Math.abs(seed + 1) % Data.stances.length].id;
    var age = typeof opts.age === "number" ? opts.age : U.clamp(17 + (Math.abs(seed) % 18), 16, 39);
    var fighter = {
      id: opts.id || U.uid("fighter"),
      name: opts.name || U.createName(country, seed),
      countryId: countryId,
      trackId: trackId,
      weightClassId: weightClassId,
      stanceId: stanceId,
      age: age,
      gymId: opts.gymId || "",
      stats: opts.stats || U.createStats(trackId, baseValue),
      record: opts.record || createRecord(seed),
      isPlayer: !!opts.isPlayer,
      known: !!opts.known,
      hasGonePro: trackId === "pro" || !!opts.hasGonePro,
      proClosed: !!opts.proClosed,
      titles: opts.titles || [],
      careerLog: opts.careerLog || [],
      storyFlags: opts.storyFlags || [],
      lastMoveWeek: 1,
      lastFightWeek: 0,
      seed: seed
    };

    updateDerivedFighterFields(fighter);
    return fighter;
  }

  function createRoster(player) {
    var roster = [];
    var trackIds = Object.keys(Data.tracks);
    var countryIndex;
    var trackIndex;
    var weightIndex;
    var fighterIndex;
    var countryId;
    var trackId;
    var weightClassId;
    var seed;
    var base;

    for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
      countryId = Data.countries[countryIndex].id;
      for (trackIndex = 0; trackIndex < trackIds.length; trackIndex += 1) {
        trackId = trackIds[trackIndex];
        for (weightIndex = 0; weightIndex < Data.weightClasses.length; weightIndex += 1) {
          weightClassId = Data.weightClasses[weightIndex].id;
          for (fighterIndex = 0; fighterIndex < 7; fighterIndex += 1) {
            seed = countryIndex * 10000 + trackIndex * 1000 + weightIndex * 100 + fighterIndex;
            base = 24 + fighterIndex * 4 + weightIndex;
            roster.push(createFighter(countryId, trackId, seed, base, {
              weightClassId: weightClassId
            }));
          }
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
      selectedTacticId: "balanced",
      roster: [],
      people: createPeople(countryId),
      offers: [],
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
    state.selectedTacticId = U.findTactic(tacticId).id;
  }

  function updateDerivedFighterFields(fighter) {
    if (fighter.trackId === "amateur") {
      fighter.amateurRankId = rankForFighter(fighter).id;
    }
    if (fighter.trackId === "street") {
      fighter.streetRating = U.clamp(U.statAverage(fighter.stats) + fighter.record.wins * 2 - fighter.record.losses, 1, 150);
    }
    if (fighter.trackId === "pro") {
      fighter.proRating = U.clamp(U.statAverage(fighter.stats) + fighter.record.wins * 2, 1, 220);
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
    var chosen = statKey || U.pick(keys);
    var cap;

    if (!p || typeof p.stats[chosen] !== "number") {
      return;
    }

    cap = U.findTrack(p.trackId).maxStat;
    p.stats[chosen] = U.clamp(p.stats[chosen] + 1, 1, cap);
    updateDerivedFighterFields(p);
    p.careerLog.unshift({ week: state.week, text: "Тренировка: +" + U.getStatLabel(chosen) + "." });
    state.feed = "Тренировочная неделя завершена. Улучшен навык: " + U.getStatLabel(chosen) + ".";
  }

  function ranking(state, countryId, trackId, weightClassId) {
    return state.roster
      .filter(function (fighter) {
        return fighter.countryId === countryId &&
          fighter.trackId === trackId &&
          (!weightClassId || fighter.weightClassId === weightClassId);
      })
      .sort(function (left, right) {
        return U.scoreFighter(right) - U.scoreFighter(left);
      });
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
    ranking: ranking
  };
}());
