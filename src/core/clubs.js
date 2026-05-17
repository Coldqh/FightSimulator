(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;

  var cityMap = {
    russia: ["Москва", "Санкт-Петербург", "Ярославль", "Казань", "Екатеринбург", "Новосибирск", "Ростов", "Самара", "Пермь", "Краснодар"],
    mexico: ["Mexico City", "Guadalajara", "Monterrey", "Tijuana", "Puebla", "Cancun", "Toluca", "Leon", "Merida", "Chihuahua"],
    japan: ["Tokyo", "Osaka", "Nagoya", "Yokohama", "Sapporo", "Kobe", "Kyoto", "Fukuoka", "Sendai", "Hiroshima"],
    usa: ["New York", "Las Vegas", "Los Angeles", "Philadelphia", "Detroit", "Chicago", "Houston", "Miami", "Dallas", "Oakland"],
    cuba: ["Havana", "Santiago", "Camaguey", "Holguin", "Santa Clara", "Matanzas", "Cienfuegos", "Pinar del Rio", "Bayamo", "Guantanamo"],
    kazakhstan: ["Алматы", "Астана", "Шымкент", "Караганда", "Актобе", "Тараз", "Павлодар", "Семей", "Костанай", "Атырау"]
  };

  var styleWords = ["Ring", "Boxing", "Gloves", "Academy", "Fight Lab", "Corner", "Combat", "Punch", "Elite", "Union", "School", "Arena", "Champion", "Iron", "Storm", "Olympic"];
  var suffixWords = ["Gym", "Club", "Team", "Center", "House", "Dojo", "Camp", "Squad", "Project", "Base", "Factory", "Studio"];
  var ruStyle = ["Ринг", "Бокс", "Перчатка", "Академия", "Школа", "Угол", "Арена", "Олимп", "Шторм", "Сталь", "Чемпион", "Север", "Восток", "Лига", "Удар", "Феникс"];
  var ruSuffix = ["Клуб", "Зал", "Команда", "Центр", "База", "Школа", "Академия", "Дом бокса", "Лига", "Секция"];

  function levelBand(level) {
    var bands = {
      1: { min: 0, max: 100, mod: 1.00 },
      2: { min: 20, max: 120, mod: 1.12 },
      3: { min: 40, max: 140, mod: 1.25 },
      4: { min: 60, max: 160, mod: 1.40 },
      5: { min: 80, max: 185, mod: 1.60 },
      6: { min: 100, max: 220, mod: 1.85 }
    };
    return bands[level] || bands[1];
  }

  function emptyRecord() { return { wins: 0, losses: 0, draws: 0 }; }

  function clubLabel(country, index) {
    var cities = cityMap[country.id] || [country.city || country.label];
    var city = cities[index % cities.length];
    var style = country.id === "russia" || country.id === "kazakhstan" ? ruStyle[(index * 7) % ruStyle.length] : styleWords[(index * 7) % styleWords.length];
    var suffix = country.id === "russia" || country.id === "kazakhstan" ? ruSuffix[(index * 11) % ruSuffix.length] : suffixWords[(index * 11) % suffixWords.length];
    var variant = Math.floor(index / cities.length);
    var extra = variant > 0 ? " " + (country.id === "russia" || country.id === "kazakhstan" ? ruStyle[(variant * 5 + index) % ruStyle.length] : styleWords[(variant * 5 + index) % styleWords.length]) : "";
    return city + " " + style + extra + " " + suffix;
  }

  function createCoach(country, clubId, seed) {
    return {
      id: "coach_" + clubId,
      role: "coach",
      name: U.createName(country, seed),
      age: U.randomInt(34, 74),
      clubId: clubId,
      record: emptyRecord(),
      note: "Главный тренер клуба.",
      active: true
    };
  }

  function ensureClubs(state) {
    var i, j, country, level, band, club, existingById = {}, usedNames = {};
    if (!(state.clubs instanceof Array)) { state.clubs = []; }
    for (i = 0; i < state.clubs.length; i += 1) { existingById[state.clubs[i].id] = state.clubs[i]; usedNames[state.clubs[i].name] = true; }

    for (i = 0; i < Data.countries.length; i += 1) {
      country = Data.countries[i];
      for (j = 0; j < 80; j += 1) {
        level = 1 + Math.min(5, Math.floor(j / 14));
        band = levelBand(level);
        club = existingById["club_" + country.id + "_" + j] || { id: "club_" + country.id + "_" + j };
        club.name = club.name && club.name.indexOf("#") === -1 ? club.name : clubLabel(country, j);
        while (usedNames[club.name] && !existingById[club.id]) { club.name = clubLabel(country, j + Object.keys(usedNames).length); }
        usedNames[club.name] = true;
        club.countryId = country.id;
        club.level = level;
        club.minOvr = band.min;
        club.maxOvr = band.max;
        club.trainingModifier = band.mod;
        club.coach = club.coach || createCoach(country, club.id, 70000 + i * 1000 + j);
        club.coach.clubId = club.id;
        club.rosterIds = club.rosterIds instanceof Array ? club.rosterIds : [];
        if (!existingById[club.id]) { state.clubs.push(club); existingById[club.id] = club; }
      }
    }
    assignFightersToClubs(state);
  }

  function findClub(state, clubId) {
    var i;
    if (!(state.clubs instanceof Array)) { return null; }
    for (i = 0; i < state.clubs.length; i += 1) { if (state.clubs[i].id === clubId) { return state.clubs[i]; } }
    return null;
  }

  function eligibleClubsForFighter(state, fighter, levelFilter) {
    var rating = U.statAverage(fighter.stats);
    return (state.clubs || []).filter(function (club) {
      return club.countryId === fighter.countryId && rating >= club.minOvr && rating <= club.maxOvr && (!levelFilter || club.level === levelFilter);
    }).sort(function (a, b) { return b.level - a.level || b.trainingModifier - a.trainingModifier || a.name.localeCompare(b.name); });
  }

  function assignFightersToClubs(state) {
    var i, club, fighter, eligible, fallback, emptyClubs, donor;
    for (i = 0; i < state.clubs.length; i += 1) { state.clubs[i].rosterIds = []; }
    for (i = 0; i < state.roster.length; i += 1) {
      fighter = state.roster[i];
      if (fighter.retired) { continue; }
      if (!fighter.gymId && !fighter.isPlayer) {
        eligible = eligibleClubsForFighter(state, fighter, null);
        fallback = (state.clubs || []).filter(function (c) { return c.countryId === fighter.countryId; });
        club = eligible.length ? eligible[Math.abs((fighter.seed || i) + i) % eligible.length] : fallback[Math.abs((fighter.seed || i) + i) % Math.max(1, fallback.length)];
        if (club) { fighter.gymId = club.id; }
      }
      club = findClub(state, fighter.gymId);
      if (club && club.rosterIds.indexOf(fighter.id) === -1) { club.rosterIds.push(fighter.id); }
    }

    /* Подстраховка: пустых NPC-клубов быть не должно. */
    emptyClubs = state.clubs.filter(function (c) { return c.rosterIds.length === 0; });
    for (i = 0; i < emptyClubs.length; i += 1) {
      club = emptyClubs[i];
      donor = state.roster.find(function (f) { return !f.isPlayer && !f.retired && f.countryId === club.countryId && U.statAverage(f.stats) >= club.minOvr && U.statAverage(f.stats) <= club.maxOvr; }) ||
        state.roster.find(function (f) { return !f.isPlayer && !f.retired && f.countryId === club.countryId; });
      if (donor) { donor.gymId = club.id; club.rosterIds.push(donor.id); }
    }
  }

  function playerClub(state) {
    var p = window.FS.State.player(state);
    return p ? findClub(state, p.gymId) : null;
  }

  function clubRoster(state, clubId) {
    var club = findClub(state, clubId);
    if (!club) { return []; }
    return club.rosterIds.map(function (id) { return U.getFighterById(state, id); }).filter(function (fighter) { return fighter && !fighter.retired; }).sort(function (left, right) { return U.scoreFighter(right) - U.scoreFighter(left); });
  }

  function strongestFighter(state, clubId) { return clubRoster(state, clubId)[0] || null; }

  function findCoach(state, coachId) {
    var i, club;
    for (i = 0; i < (state.clubs || []).length; i += 1) {
      club = state.clubs[i];
      if (club.coach && club.coach.id === coachId) { return club.coach; }
    }
    return null;
  }

  function syncPeopleForPlayerClub(state) {
    var p = window.FS.State.player(state);
    var club = playerClub(state);
    var roster;
    state.people = [];
    if (!p || !club) { return; }
    state.people.push({ id: club.coach.id, role: "coach", name: club.coach.name, note: "Тренер клуба " + club.name, clubId: club.id, personType: "coach" });
    roster = clubRoster(state, club.id).filter(function (f) { return !f.isPlayer; }).slice(0, 3);
    roster.forEach(function (f) {
      if (U.randomInt(1, 100) <= 70) {
        state.people.push({ id: "person_" + f.id, role: "clubmate", name: f.name, note: "Одноклубник · " + U.findTrack(f.trackId).label, fighterId: f.id, clubId: club.id, personType: "fighter" });
      }
    });
  }

  function movePlayerToClub(state, clubId) {
    var p = window.FS.State.player(state);
    var club = findClub(state, clubId);
    var rating = p ? U.statAverage(p.stats) : 0;
    if (!p || !club || club.countryId !== p.countryId || rating < club.minOvr || rating > club.maxOvr) {
      state.feed = "Нельзя перейти в этот клуб.";
      return false;
    }
    p.gymId = club.id;
    p.careerLog.unshift({ week: state.week, text: "Переход в клуб: " + club.name + "." });
    assignFightersToClubs(state);
    syncPeopleForPlayerClub(state);
    state.feed = "Ты перешёл в клуб: " + club.name + ".";
    return true;
  }

  function leavePlayerClub(state) {
    var p = window.FS.State.player(state);
    if (!p) { return false; }
    p.gymId = "";
    state.people = [];
    assignFightersToClubs(state);
    state.feed = "Ты покинул клуб.";
    return true;
  }

  function recordClubFight(state, winner, loser, isDraw) {
    var wc = winner ? findClub(state, winner.gymId) : null;
    var lc = loser ? findClub(state, loser.gymId) : null;
    if (wc && wc.coach) {
      wc.coach.record = wc.coach.record || emptyRecord();
      if (isDraw) { wc.coach.record.draws += 1; } else { wc.coach.record.wins += 1; }
    }
    if (lc && lc.coach) {
      lc.coach.record = lc.coach.record || emptyRecord();
      if (isDraw) { lc.coach.record.draws += 1; } else { lc.coach.record.losses += 1; }
    }
  }

  function maybeMoveNpcClubs(state) {
    var attempts = Math.min(180, Math.max(30, Math.floor(state.roster.length / 140)));
    var i, fighter, eligible, current;
    for (i = 0; i < attempts; i += 1) {
      fighter = state.roster[U.randomInt(0, state.roster.length - 1)];
      if (!fighter || fighter.isPlayer || fighter.retired || U.randomInt(1, 100) > 13) { continue; }
      eligible = eligibleClubsForFighter(state, fighter, null);
      current = findClub(state, fighter.gymId);
      if (eligible.length && (!current || eligible[0].level > current.level || U.randomInt(1,100)<=18)) { fighter.gymId = eligible[0].id; }
    }
    assignFightersToClubs(state);
  }

  function simulateCoachLife(state) {
    var i, club, pClub, country, oldCoach, eventType, chance;
    pClub = playerClub(state);
    for (i = 0; i < (state.clubs || []).length; i += 1) {
      club = state.clubs[i];
      if (!club.coach) { continue; }
      club.coach.age = Number(club.coach.age) || 45;
      if (state.week % 48 === 1) { club.coach.age += 1; }
      chance = club.coach.age >= 70 ? 0.35 : (club.coach.age >= 60 ? 0.12 : 0.03);
      if (U.randomInt(1, 10000) <= Math.round(chance * 100)) {
        oldCoach = club.coach;
        eventType = U.randomInt(1, 100) <= 18 ? "погиб" : "ушёл на пенсию";
        country = U.findCountry(club.countryId);
        club.coach = createCoach(country, club.id, 900000 + state.week * 1000 + i);
        if (pClub && pClub.id === club.id) {
          state.modal = { type: "coachEvent", title: "Событие в клубе", text: "Тренер " + oldCoach.name + " " + eventType + ". Новым тренером стал " + club.coach.name + "." };
        }
        state.feed = "В клубе " + club.name + " сменился тренер.";
      }
    }
    syncPeopleForPlayerClub(state);
  }

  window.FS.Clubs = {
    ensureClubs: ensureClubs,
    assignFightersToClubs: assignFightersToClubs,
    findClub: findClub,
    playerClub: playerClub,
    movePlayerToClub: movePlayerToClub,
    leavePlayerClub: leavePlayerClub,
    clubRoster: clubRoster,
    strongestFighter: strongestFighter,
    eligibleClubsForFighter: eligibleClubsForFighter,
    maybeMoveNpcClubs: maybeMoveNpcClubs,
    levelBand: levelBand,
    findCoach: findCoach,
    syncPeopleForPlayerClub: syncPeopleForPlayerClub,
    recordClubFight: recordClubFight,
    simulateCoachLife: simulateCoachLife
  };
}());
