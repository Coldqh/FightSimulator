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
    var wins = U.randomInt(0, 9) + Math.floor(seed / 4);
    var losses = U.randomInt(0, 4);
    var draws = U.randomInt(0, 1);
    return {
      wins: wins,
      losses: losses,
      draws: draws,
      kos: U.randomInt(0, Math.max(0, Math.min(wins, 6)))
    };
  }

  function createFighter(countryId, trackId, seed, baseValue, options) {
    var country = U.findCountry(countryId);
    var opts = options || {};
    var fighter = {
      id: opts.id || U.uid("fighter"),
      name: opts.name || U.createName(country, seed),
      countryId: countryId,
      trackId: trackId,
      stats: opts.stats || U.createStats(trackId, baseValue),
      record: opts.record || createRecord(seed),
      isPlayer: !!opts.isPlayer,
      known: !!opts.known,
      hasGonePro: trackId === "pro" || !!opts.hasGonePro,
      proClosed: !!opts.proClosed,
      titles: [],
      careerLog: [],
      lastMoveWeek: 1,
      seed: seed
    };

    if (trackId === "street") {
      fighter.streetRating = U.clamp(U.statAverage(fighter.stats) + fighter.record.wins * 2 - fighter.record.losses, 1, 150);
    }

    if (trackId === "amateur") {
      fighter.amateurRankId = rankForFighter(fighter).id;
    }

    if (trackId === "pro") {
      fighter.proRating = U.clamp(U.statAverage(fighter.stats) + fighter.record.wins * 2, 1, 220);
    }

    return fighter;
  }

  function createRoster(player) {
    var roster = [];
    var trackIds = Object.keys(Data.tracks);
    var countryIndex;
    var trackIndex;
    var fighterIndex;
    var countryId;
    var trackId;

    for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
      countryId = Data.countries[countryIndex].id;
      for (trackIndex = 0; trackIndex < trackIds.length; trackIndex += 1) {
        trackId = trackIds[trackIndex];
        for (fighterIndex = 0; fighterIndex < 22; fighterIndex += 1) {
          roster.push(createFighter(
            countryId,
            trackId,
            countryIndex * 1000 + trackIndex * 100 + fighterIndex,
            25 + fighterIndex * 3
          ));
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
      { id: U.uid("person"), role: "clubmate", name: U.createName(country, 22), note: "Тренируется рядом и может вырасти в сильного бойца." },
      { id: U.uid("person"), role: "rival", name: U.createName(country, 33), note: "Появляется в местной боксёрской среде." },
      { id: U.uid("person"), role: "organizer", name: U.createName(country, 44), note: "Помогает собрать местные бои." },
      { id: U.uid("person"), role: "cutman", name: U.createName(country, 55), note: "Работает возле ринга." }
    ];
  }

  function createCareer(payload) {
    var trackId = U.findTrack(payload.trackId).id;
    var countryId = U.findCountry(payload.countryId).id;
    var player = createFighter(countryId, trackId, 777, 35, {
      id: "player",
      name: payload.name || "Новый боксёр",
      isPlayer: true,
      known: true,
      record: { wins: 0, losses: 0, draws: 0, kos: 0 }
    });

    var state = {
      version: Data.appVersion,
      week: 1,
      selectedTab: "dashboard",
      playerId: player.id,
      rankingCountryId: countryId,
      rankingTrackId: trackId,
      modal: null,
      roster: [],
      people: createPeople(countryId),
      offers: [],
      world: {
        news: [],
        weekReports: [],
        teamsByCountry: {},
        transitionLog: []
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
    state.feed = "Тренировочная неделя завершена. Улучшен навык: " + U.getStatLabel(chosen) + ".";
  }

  function ranking(state, countryId, trackId) {
    return state.roster
      .filter(function (fighter) {
        return fighter.countryId === countryId && fighter.trackId === trackId;
      })
      .sort(function (left, right) {
        return U.statAverage(right.stats) + right.record.wins * 1.6 - right.record.losses -
          (U.statAverage(left.stats) + left.record.wins * 1.6 - left.record.losses);
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
    trainPlayer: trainPlayer,
    updateDerivedFighterFields: updateDerivedFighterFields,
    updateAllDerived: updateAllDerived,
    rankForFighter: rankForFighter,
    ranking: ranking
  };
}());
