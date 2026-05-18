(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;

  var citiesByCountry = {
    russia: ["Москва","Санкт-Петербург","Ярославль","Казань","Екатеринбург","Новосибирск","Ростов-на-Дону","Самара","Пермь","Краснодар","Нижний Новгород","Уфа","Челябинск","Омск","Воронеж","Волгоград","Саратов","Тюмень","Иркутск","Владивосток"],
    mexico: ["Ciudad de México","Guadalajara","Monterrey","Tijuana","Puebla","Cancún","Toluca","León","Mérida","Chihuahua","Culiacán","Hermosillo","Querétaro","Morelia","Torreón","Acapulco","Veracruz","Oaxaca","Tepic","Aguascalientes"],
    japan: ["Tokyo","Osaka","Nagoya","Yokohama","Sapporo","Kobe","Kyoto","Fukuoka","Sendai","Hiroshima","Saitama","Chiba","Kawasaki","Naha","Kumamoto","Niigata","Shizuoka","Kanazawa","Okayama","Kagoshima"],
    usa: ["New York","Las Vegas","Los Angeles","Philadelphia","Detroit","Chicago","Houston","Miami","Dallas","Oakland","Brooklyn","Cleveland","Atlanta","Boston","Phoenix","San Diego","San Antonio","St. Louis","Newark","Baltimore"],
    cuba: ["Havana","Santiago de Cuba","Camagüey","Holguín","Santa Clara","Matanzas","Cienfuegos","Pinar del Río","Bayamo","Guantánamo","Varadero","Ciego de Ávila","Las Tunas","Sancti Spíritus","Manzanillo","Artemisa","Trinidad","Baracoa","Mayabeque","Isla de la Juventud"],
    kazakhstan: ["Алматы","Астана","Шымкент","Караганда","Актобе","Тараз","Павлодар","Семей","Костанай","Атырау","Усть-Каменогорск","Кызылорда","Петропавловск","Актау","Темиртау","Туркестан","Кокшетау","Уральск","Талдыкорган","Экибастуз"]
  };

  var namesByCountry = {
    russia: ["Rocky Road","Alchakov Boxing","Академия Бокса","Красный Угол","Стальной Ринг","Северный Ринг","Олимпиец","Динамо Бокс","Спартак Ринг","Торпедо Бокс","Кузница Бокса","Первая Перчатка","Ринг База","Школа Чемпионов","Боевые Перчатки","Ринг Олимп","Авангард Бокс","Сокол Ринг","Витязь Бокс","Патриот Ринг","Ударная Секция","Зал На Ринге","Профи Бокс","Открытый Ринг","Лига Бокса","Фабрика Чемпионов","Северная Перчатка","Красная Перчатка","Школа Нокаута","Бокс Арена","Ринг Юность","Олимпийская Перчатка","Ринг Мастер","Бокс Резерв","Тренерский Ринг","Городской Ринг","Федерация Бокса","Клуб Единоборств","Бокс Центр","Секция Ринга"],
    mexico: ["Jaguar Boxing","One More Round","Gimnasio Lupita","Cleto Reyes Boxing","Maracaná Box","Espartanos Boxing","Aguilar Boxing Academy","Azteca Boxing","Guerreros del Ring","Ring Reyes","La Esquina Roja","Puños de Oro","Escuela de Campeones","Barrio Boxing","Noble Art Gym","Round Final","La Campana","El Rincón del Box","Boxeo Olímpico","Toro Boxing","Casta de Campeones","Arena de Box","Furia Mexicana","Gimnasio Campeón","Sangre Azteca","Héroes del Ring","La Guardia Boxing","Golpe Fino","Puño Bravo","Club de Boxeo Norte","Centro de Box","La Manada Boxing","Reyes del Ring","Boxeo Popular","Peleadores Unidos","Cinturón Verde","El Último Round","Guantes Rojos","Boxeo Real","Distrito Boxing"],
    japan: ["Teiken Gym","Ohashi Gym","Watanabe Gym","Kadoebi Boxing","Misako Gym","Shinjuku Boxing","Korakuen Ring","Samurai Boxing","Rising Sun Gym","Nippon Boxing","Fighting Harada Gym","Yokohama Hikari","Osaka Ring","Tokyo Punch","Kobe Glove","Kyoto Boxing","Fukuoka Fight Club","Sapporo Ring","Nagoya Boxing Lab","Sendai Glove","Hiroshima Boxing","Naha Ring","Phoenix Japan","Dragon Ring","Bushido Boxing","Aoki Gym","Sakura Boxing","Kansai Ring","Kanto Boxing","Higashi Gym","West Japan Boxing","East Ring","Kokugikan Boxing","Noble Art Japan","Shin Boxing","Yamato Ring","Golden Glove Japan","Ring Craft","Champion Road","K.O. Japan"],
    usa: ["Gleason's Gym","Kronk Gym","Wild Card Boxing","Mayweather Boxing","Church Street Boxing","Trinity Boxing","Mendez Boxing","EverybodyFights","Title Boxing","Overthrow Boxing","Rumble Boxing","Main Street Boxing","Fifth Street Gym","Duke City Boxing","Kingsway Boxing","Front Street Gym","Westside Boxing","Eastside Boxing","Southpaw Gym","Golden Gloves Academy","Brewster Wheeler Boxing","Motor City Boxing","Brooklyn Boxing","Philly Fight Club","Vegas Ring","LA Boxing Lab","Chicago Fight House","Houston Boxing","Miami Punch","Dallas Ring","Oakland Boxing","Ironbound Boxing","Champion Factory","Knockout Club","The Corner Gym","Sweet Science Center","Round One Gym","No Excuses Boxing","Legacy Boxing","House of Boxing"],
    cuba: ["Gimnasio José Álamo","Escuela Teófilo Stevenson","Félix Savón Boxing","Cuba Boxeo","La Finca del Box","Havana Ring","Santiago Boxeo","Caribe Boxing","Escuela de Campeones","Guantes Cubanos","Rafael Trejo Boxing","Gimnasio Giraldo Córdova","Playa Boxing","Varadero Ring","Oriente Boxing","Guerreros del Caribe","Escuela Nacional","Ring de la Habana","Puños del Malecón","Boxeo Popular","Camagüey Ring","Holguín Box","Santa Clara Boxing","Matanzas Ring","Cienfuegos Boxeo","Pinar del Río Boxing","Bayamo Ring","Guantánamo Boxing","Cuba Olímpica","Ring Caribe","Arena Cubana","Boxeo Técnico","La Esquina Azul","Tradición Cubana","Los Industriales Boxing","Tiburones del Ring","Sierra Maestra Boxing","Escuela del Golpe","Noble Arte Cuba","Campamento Ring"],
    kazakhstan: ["Astana Boxing Club","Dominant Boxing Club","Astana Arlans","Rocky Boxing Club","Bronx Boxing Club","Bekzat Boxing","MD Boxing","Rauan Boxing School","7Rays Boxing","Qazaq Boxing","Arlan Ring","Nomad Boxing","Алматы Бокс","Астана Ринг","Шымкент Перчатка","Караганда Бокс","Достык Boxing","Барыс Ринг","Жас Батыр","Олимп Резерв","Степной Ринг","Жетысу Boxing","Туран Бокс","Алатау Ринг","Ертіс Boxing","Каспий Бокс","Сарыарка Ring","Ұлы Дала Boxing","Абылай Boxing","Темір Ринг","Арена Батыр","Көк Ту Boxing","Намыс Ринг","Школа Арлана","Kazakh Gloves","Бокс Орталығы","Ұлттық Ринг","Бекзат Академия","Алтын Перчатка","Елорда Boxing"]
  };

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
    var cities = country.cities || citiesByCountry[country.id] || [country.city || country.label];
    var names = country.gymNames || namesByCountry[country.id] || namesByCountry.usa;
    var city = cities[index % cities.length];
    var name = names[index % names.length];
    var district = Math.floor(index / names.length);
    return district ? (city + " " + name + " " + (district + 1)) : (city + " " + name);
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
    var i, j, country, level, band, club, existingById = {}, usedNames = {}, name, totalFighters, targetClubs;
    if (!(state.clubs instanceof Array)) { state.clubs = []; }
    for (i = 0; i < state.clubs.length; i += 1) { existingById[state.clubs[i].id] = state.clubs[i]; }

    for (i = 0; i < Data.countries.length; i += 1) {
      country = Data.countries[i];
      totalFighters = (Number(country.amateurCount) || 0) + (Number(country.streetCount) || 0) + (Number(country.proCount) || 0);
      targetClubs = Math.max(2, Math.ceil(totalFighters / 30));

      for (j = 0; j < targetClubs; j += 1) {
        level = 1 + Math.min(5, Math.floor((j / Math.max(1, targetClubs)) * 6));
        band = levelBand(level);
        club = existingById["club_" + country.id + "_" + j] || { id: "club_" + country.id + "_" + j };
        name = clubLabel(country, j);
        while (usedNames[name]) { name = clubLabel(country, j + Object.keys(usedNames).length + 1); }
        usedNames[name] = true;
        club.name = name;
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

    state.clubs = state.clubs.filter(function (club) {
      var country = Data.countries.find(function (item) { return item.id === club.countryId; });
      var total = country ? ((Number(country.amateurCount) || 0) + (Number(country.streetCount) || 0) + (Number(country.proCount) || 0)) : 0;
      return country && Number(club.id.split("_").pop()) < Math.max(2, Math.ceil(total / 30));
    });

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

  function pickLeastFilled(clubs, rating) {
    var eligible = clubs.filter(function (club) { return rating >= club.minOvr && rating <= club.maxOvr; });
    if (!eligible.length) { eligible = clubs.slice(); }
    eligible.sort(function (a, b) {
      return (a.rosterIds.length - b.rosterIds.length) || (Math.abs((a.minOvr + a.maxOvr) / 2 - rating) - Math.abs((b.minOvr + b.maxOvr) / 2 - rating));
    });
    return eligible[0] || null;
  }

  function assignFightersToClubs(state) {
    var i, country, countryClubs, countryFighters, club, fighter, rating;

    for (i = 0; i < state.clubs.length; i += 1) { state.clubs[i].rosterIds = []; }

    for (var c = 0; c < Data.countries.length; c += 1) {
      country = Data.countries[c];
      countryClubs = (state.clubs || []).filter(function (item) { return item.countryId === country.id; });
      countryFighters = (state.roster || []).filter(function (item) {
        return !item.isPlayer && !item.retired && item.countryId === country.id;
      }).sort(function (a, b) { return U.statAverage(a.stats) - U.statAverage(b.stats); });

      /* Сначала равномерно заполняем клубы, чтобы не было залов с одним человеком. */
      for (i = 0; i < countryFighters.length; i += 1) {
        fighter = countryFighters[i];
        rating = U.statAverage(fighter.stats);
        club = pickLeastFilled(countryClubs, rating);
        if (club) {
          fighter.gymId = club.id;
          club.rosterIds.push(fighter.id);
        }
      }
    }

    /* Игрок остаётся без клуба до ручного выбора, но если уже выбран — добавляем в roster. */
    for (i = 0; i < state.roster.length; i += 1) {
      fighter = state.roster[i];
      if (!fighter || fighter.retired || !fighter.gymId) { continue; }
      club = findClub(state, fighter.gymId);
      if (club && club.rosterIds.indexOf(fighter.id) === -1) { club.rosterIds.push(fighter.id); }
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
    simulateCoachLife: simulateCoachLife,
    clubLabel: clubLabel
  };
}());
