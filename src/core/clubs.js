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

  function emptyRecord() { return { wins: 0, losses: 0, draws: 0, kos: 0 }; }

  function clubLabel(country, index) {
    var cities = country.cities || citiesByCountry[country.id] || [country.city || country.label];
    var names = country.gymNames || namesByCountry[country.id] || namesByCountry.usa;
    var suffixes = ["Academy","Club","Gym","Boxing","Ring","Fight House","Boxing Hall","Training Center","Combat Club","Glove School","Corner Club","Punch Lab","Athletic Club","Fight Camp","Boxing Works","Ring School","Champions Room","Boxing Society","Fight Studio","Boxing Yard","Boxing House","Boxing Project","Ring Lab","Boxing Union","Boxing Base","Sports Club","Fight Center","Boxing Studio","Boxing Circle","Boxing League"];
    var districts = ["North","South","East","West","Central","Old Town","Harbor","Market","Station","River","Hill","Park","Garden","Industrial","University","Downtown","Uptown","Lakeside","Seaside","Valley","Capital","Metro","Olympic","Victory","Liberty","Union","Crown","Lion","Eagle","Falcon"];
    var city = String(cities[index % cities.length] || country.label).trim();
    var base = String(names[(index * 7 + Math.floor(index / Math.max(1, cities.length))) % names.length] || "Boxing Club").trim();
    var suffix = suffixes[Math.floor(index / Math.max(1, names.length)) % suffixes.length];
    var district = districts[(index * 5 + Math.floor(index / Math.max(1, names.length))) % districts.length];
    var lowerCity = city.toLowerCase();
    var output;

    base = base.replace(/\s+\d+$/g, "").trim();

    if (base.toLowerCase().indexOf(lowerCity) === 0 || base.toLowerCase().indexOf(String(country.label || "").toLowerCase()) === 0) {
      output = base;
    } else if (index % 3 === 0) {
      output = city + " " + base;
    } else if (index % 3 === 1) {
      output = district + " " + base;
    } else {
      output = city + " " + district + " " + suffix;
    }

    output = output.replace(/\s+\d+$/g, "").replace(/\s+/g, " ").trim();
    return output;
  }

  function estimateKosFromLog(fighter) {
    var log = fighter && fighter.careerLog instanceof Array ? fighter.careerLog : [];
    var count = 0;
    var i;
    for (i = 0; i < log.length; i += 1) {
      if (log[i] && /KO\/TKO|нокаут/i.test(log[i].text || "")) { count += 1; }
    }
    return count;
  }

  function coachStatsFromSeed(level, seed) {
    var ranges = { 1: [12, 32], 2: [28, 46], 3: [42, 60], 4: [56, 74], 5: [70, 86], 6: [84, 100] };
    var safeLevel = Math.max(1, Math.min(6, Number(level) || 1));
    var range = ranges[safeLevel] || ranges[1];
    var targetOvr = U.randomInt(range[0], range[1]);
    var n = Math.abs(Number(seed) || 1);
    function roll(offset) {
      n = (n * 9301 + 49297 + offset) % 233280;
      return U.clamp(targetOvr + Math.round((n / 233280) * 10) - 5 + U.randomInt(-3, 3), 1, 100);
    }
    return { technique: roll(11), conditioning: roll(23), tactics: roll(37), corner: roll(53), development: roll(71) };
  }

  function normalizeCoachStats(coach, club) {
    var level = club ? club.level : 1;
    var seed = String(coach && coach.id ? coach.id : Date.now()).split("").reduce(function (sum, ch) { return sum + ch.charCodeAt(0); }, 0);
    var expected = coachStatsFromSeed(level, seed);
    var currentOvr;
    var tooStrongForClub;
    var tooWeakForClub;
    var hasOldScale;
    coach.stats = coach.stats && typeof coach.stats === "object" ? coach.stats : expected;
    coach.stats.technique = U.clamp(Number(coach.stats.technique) || expected.technique, 1, 100);
    coach.stats.conditioning = U.clamp(Number(coach.stats.conditioning) || expected.conditioning, 1, 100);
    coach.stats.tactics = U.clamp(Number(coach.stats.tactics) || expected.tactics, 1, 100);
    coach.stats.corner = U.clamp(Number(coach.stats.corner) || expected.corner, 1, 100);
    coach.stats.development = U.clamp(Number(coach.stats.development) || expected.development, 1, 100);
    currentOvr = coachOvr(coach);
    hasOldScale = [coach.stats.technique, coach.stats.conditioning, coach.stats.tactics, coach.stats.corner, coach.stats.development].some(function (value) { return Number(value) > 100; });
    tooStrongForClub = (level <= 1 && currentOvr > 40) || (level <= 2 && currentOvr > 55) || (level <= 3 && currentOvr > 68);
    tooWeakForClub = (level >= 5 && currentOvr < 62) || (level >= 6 && currentOvr < 78);
    if (hasOldScale || tooStrongForClub || tooWeakForClub || currentOvr <= 1) { coach.stats = expected; }
    coach.ovr = coachOvr(coach);
  }

  function coachOvr(coach) {
    var stats = coach && coach.stats ? coach.stats : {};
    var average = ((Number(stats.technique) || 1) + (Number(stats.conditioning) || 1) + (Number(stats.tactics) || 1) + (Number(stats.corner) || 1) + (Number(stats.development) || 1)) / 5;
    return U.clamp(Math.round(average), 1, 100);
  }

  function coachProfessionalismMultiplier(coach) {
    return 1 + 0.002 * coachOvr(coach);
  }

  function fighterEffectiveOvr(state, fighter, coach) {
    var base = fighter && fighter.stats ? U.statAverage(fighter.stats) : 0;
    var usedCoach = coach || findFighterCoach(state, fighter);
    var bonus = usedCoach ? Math.ceil(base * (coachProfessionalismMultiplier(usedCoach) - 1)) : 0;
    return { personal: base, bonus: bonus, total: base + bonus, coach: usedCoach || null, coachOvr: usedCoach ? coachOvr(usedCoach) : 0 };
  }

  function coachAssignedFighters(state, coachId) {
    if (!state || !coachId) { return []; }
    return (state.roster || []).filter(function (fighter) {
      return fighter && !fighter.retired && fighter.coachId === coachId;
    });
  }

  function coachRecordFor(state, coachId) {
    var record = emptyRecord();
    coachAssignedFighters(state, coachId).forEach(function (fighter) {
      var r = fighter.record || {};
      record.wins += Number(r.wins) || 0;
      record.losses += Number(r.losses) || 0;
      record.draws += Number(r.draws) || 0;
    });
    return record;
  }

  function syncCoachRecords(state) {
    var recordsByCoach = {};
    var countsByCoach = {};
    var clubById = {};
    var coachById = {};
    var i;
    var j;
    var fighter;
    var record;
    var club;
    var coach;
    var list;
    var kos;

    if (!state) { return; }

    for (i = 0; i < (state.clubs || []).length; i += 1) {
      club = state.clubs[i];
      if (!club || !club.id) { continue; }
      clubById[club.id] = club;
      ensureClubCoaches(state, club, U.findCountry(club.countryId), 91000 + i * 1000);
      list = clubCoachList(club);
      club.coaches = list;
      club.coach = list[0] || club.coach;
      for (j = 0; j < list.length; j += 1) {
        coachById[list[j].id] = list[j];
        recordsByCoach[list[j].id] = emptyRecord();
        countsByCoach[list[j].id] = 0;
      }
    }

    for (i = 0; i < (state.roster || []).length; i += 1) {
      fighter = state.roster[i];
      if (!fighter || fighter.retired) { continue; }
      if ((!fighter.coachId || !coachById[fighter.coachId]) && fighter.gymId && clubById[fighter.gymId]) {
        list = clubCoachList(clubById[fighter.gymId]);
        if (list.length) { fighter.coachId = list[0].id; }
      }
      if (!fighter.coachId || !coachById[fighter.coachId]) { continue; }
      record = fighter.record || {};
      kos = Number(record.kos);
      if (!isFinite(kos) || kos <= 0) { kos = estimateKosFromLog(fighter); }
      recordsByCoach[fighter.coachId].wins += Number(record.wins) || 0;
      recordsByCoach[fighter.coachId].losses += Number(record.losses) || 0;
      recordsByCoach[fighter.coachId].draws += Number(record.draws) || 0;
      recordsByCoach[fighter.coachId].kos += kos || 0;
      countsByCoach[fighter.coachId] += 1;
    }

    Object.keys(coachById).forEach(function (coachId) {
      coach = coachById[coachId];
      normalizeCoachStats(coach, clubById[coach.clubId] || null);
      coach.record = recordsByCoach[coachId] || emptyRecord();
      coach.assignedCount = countsByCoach[coachId] || 0;
    });
  }

  function clubCoachList(club) {
    var out = [];
    var seen = {};
    function add(coach) {
      if (!coach || typeof coach !== "object" || !coach.id || seen[coach.id]) { return; }
      seen[coach.id] = true;
      out.push(coach);
    }
    if (!club) { return out; }
    add(club.coach);
    if (club.coaches instanceof Array) { club.coaches.forEach(add); }
    return out;
  }

  function coachBelongsToClub(club, coachId) {
    return !!clubCoachList(club).some(function (coach) { return coach && coach.id === coachId; });
  }

  function leastBusyCoach(state, club) {
    var coaches = clubCoachList(club);
    var best = null;
    var bestCount = Infinity;
    var i;
    var count;

    for (i = 0; i < coaches.length; i += 1) {
      count = Number(coaches[i].assignedCount) || 0;
      if (!best || count < bestCount || (count === bestCount && coachOvr(coaches[i]) > coachOvr(best))) {
        best = coaches[i];
        bestCount = count;
      }
    }

    return best || null;
  }

  function assignCoachToFighter(state, fighter, club, force) {
    var coach;
    if (!fighter || !club) { return; }

    if (!force && fighter.coachId && coachBelongsToClub(club, fighter.coachId)) {
      coach = findCoach(state, fighter.coachId);
      if (coach) { coach.assignedCount = (Number(coach.assignedCount) || 0) + 1; }
      return;
    }

    coach = leastBusyCoach(state, club);
    fighter.coachId = coach ? coach.id : "";
    if (coach) { coach.assignedCount = (Number(coach.assignedCount) || 0) + 1; }
  }

  function findFighterCoach(state, fighter) {
    var club;
    var coach;
    var list;
    if (!state || !fighter) { return null; }

    if (fighter.coachId) {
      coach = findCoach(state, fighter.coachId);
      if (coach) { return coach; }
    }

    if (!fighter.gymId) { return null; }
    club = findClub(state, fighter.gymId);
    if (!club) { return null; }
    ensureClubCoaches(state, club, U.findCountry(club.countryId), 94000);
    list = clubCoachList(club);
    if (!list.length) { return null; }

    fighter.coachId = list[0].id;
    return list[0];
  }

  function coachFightBonus(state, fighter) {
    var info = fighterEffectiveOvr(state, fighter);
    return Math.ceil(info.bonus / 12);
  }

  function upsertPerson(state, person) {
    var list;
    var existing;
    if (!state || !person || !person.id) { return; }
    state.people = state.people instanceof Array ? state.people : [];
    list = state.people;
    existing = list.find(function (item) { return item && item.id === person.id; });
    if (existing) {
      Object.keys(person).forEach(function (key) { existing[key] = person[key]; });
    } else {
      list.unshift(person);
      if (list.length > 120) { list.length = 120; }
    }
  }

  function rememberCoachPerson(state, coach, role, note) {
    if (!coach) { return; }
    upsertPerson(state, {
      id: coach.id,
      role: role || "coach",
      name: coach.name,
      note: note || "Тренер",
      clubId: coach.clubId || "",
      personType: "coach"
    });
  }

  function rememberFighterPerson(state, fighter, role, note) {
    if (!fighter || fighter.isPlayer) { return; }
    upsertPerson(state, {
      id: "person_" + fighter.id,
      role: role || "clubmate",
      name: fighter.name,
      note: note || "Боец",
      fighterId: fighter.id,
      clubId: fighter.gymId || "",
      personType: "fighter"
    });
  }

  

  function coachCountForLevel(level) {
    return Math.max(1, Math.min(5, Math.ceil((Number(level) || 1) * 5 / 6)));
  }

  function normalizeCoach(coach, club, fallbackCountry, fallbackIndex) {
    var homeId;
    var currentId;
    var fallback = fallbackCountry || Data.countries[0];
    var record;
    if (!coach || typeof coach !== "object") { coach = {}; }
    currentId = club && club.countryId ? club.countryId : (coach.currentCountryId || coach.countryId || fallback.id);
    homeId = coach.homeCountryId || coach.originCountryId || coach.nationalityCountryId || coach.countryId || fallback.id;
    coach.id = coach.id || ("coach_" + (club ? club.id : "free") + "_" + (fallbackIndex || 0));
    coach.role = coach.role || "coach";
    coach.name = coach.name || U.createName(U.findCountry(homeId), Date.now() + (fallbackIndex || 0));
    coach.countryId = currentId;
    coach.currentCountryId = currentId;
    coach.homeCountryId = homeId;
    coach.originCountryId = homeId;
    coach.age = Number(coach.age) || U.randomInt(34, 74);
    coach.clubId = club ? club.id : (coach.clubId || "");
    record = coach.record || {};
    coach.record = {
      wins: Number(record.wins) || 0,
      losses: Number(record.losses) || 0,
      draws: Number(record.draws) || 0,
      kos: Number(record.kos) || 0
    };
    coach.careerLog = coach.careerLog instanceof Array ? coach.careerLog : [];
    coach.note = coach.note || "Тренер клуба.";
    coach.active = coach.active !== false;
    normalizeCoachStats(coach, club);
    if (!coach.careerLog.length && club) {
      coach.careerLog.unshift({ week: 1, text: "Работает в клубе " + club.name + "." });
    }
    return coach;
  }

  function ensureClubCoaches(state, club, hostCountry, seedBase) {
    var targetCount;
    var list = [];
    var seen = {};
    var i;
    var coach;
    var country = hostCountry || U.findCountry(club && club.countryId);
    if (!club) { return; }
    targetCount = coachCountForLevel(club.level);

    function add(coach) {
      coach = normalizeCoach(coach, club, country, list.length);
      if (!coach || seen[coach.id]) { return; }
      seen[coach.id] = true;
      list.push(coach);
    }

    add(club.coach);
    if (club.coaches instanceof Array) {
      for (i = 0; i < club.coaches.length; i += 1) { add(club.coaches[i]); }
    }

    while (list.length < targetCount) {
      coach = createCoach(country, club.id + "_" + list.length, (seedBase || 0) + list.length * 137);
      coach.clubId = club.id;
      coach.note = list.length === 0 ? "Главный тренер клуба." : "Тренер клуба.";
      coach.stats = coachStatsFromSeed(club.level, (seedBase || 0) + list.length * 137);
      coach.ovr = coachOvr(coach);
      coach.careerLog = coach.careerLog instanceof Array ? coach.careerLog : [];
      coach.careerLog.unshift({ week: 1, text: "Пришёл в клуб " + club.name + "." });
      add(coach);
    }

    if (list.length > targetCount) { list.length = targetCount; }
    club.coaches = list;
    club.coach = club.coaches[0] || createCoach(country, club.id, seedBase || 0);
    club.coach.note = "Главный тренер клуба.";
  }

  

  function createCoach(country, clubId, seed) {
    var hostCountry = country || Data.countries[0];
    var originCountry = hostCountry;
    var valueSeed = Number(seed) || Date.now();
    var coach;
    if (U.randomInt(1, 100) <= 9) {
      originCountry = Data.countries[U.randomInt(0, Data.countries.length - 1)] || hostCountry;
    }
    coach = {
      id: "coach_" + clubId + "_" + U.randomInt(1000, 9999),
      role: "coach",
      name: U.createName(originCountry, valueSeed + U.randomInt(1, 999999)),
      countryId: hostCountry.id,
      currentCountryId: hostCountry.id,
      homeCountryId: originCountry.id,
      originCountryId: originCountry.id,
      age: U.randomInt(34, 74),
      clubId: clubId,
      record: emptyRecord(),
      careerLog: [{ week: 1, text: originCountry.id === hostCountry.id ? "Начал работу в клубе." : ("Переехал из " + originCountry.label + " в " + hostCountry.label + ".") }],
      note: "Тренер клуба.",
      active: true,
      stats: coachStatsFromSeed(1, valueSeed)
    };
    coach.ovr = coachOvr(coach);
    return coach;
  }

  function ensureClubs(state) {
    var i;
    var j;
    var country;
    var level;
    var band;
    var club;
    var existingById = {};
    var usedNamesByCountry = {};
    var name;
    var targetClubs;
    var actualFightersByCountry = {};
    var fighter;
    var attempt;
    var fallbackSuffixes = ["Academy","Club","Gym","Boxing","Ring","Fight House","Boxing Hall","Training Center","Combat Club","Glove School","Corner Club","Punch Lab"];
    var fallbackDistricts = ["North","South","East","West","Central","Old Town","Harbor","Market","Station","River","Hill","Park"];
    var cities;
    var city;
    var countryTotal;
    var clubIndex;
    var needsAssign;

    if (!(state.clubs instanceof Array)) { state.clubs = []; }

    for (i = 0; i < state.clubs.length; i += 1) {
      if (state.clubs[i] && state.clubs[i].id) {
        existingById[state.clubs[i].id] = state.clubs[i];
      }
    }

    for (i = 0; i < (state.roster || []).length; i += 1) {
      fighter = state.roster[i];
      if (!fighter || fighter.retired) { continue; }
      actualFightersByCountry[fighter.countryId] = (actualFightersByCountry[fighter.countryId] || 0) + 1;
    }

    for (i = 0; i < Data.countries.length; i += 1) {
      country = Data.countries[i];
      countryTotal = actualFightersByCountry[country.id] || 0;
      targetClubs = Math.max(2, Math.ceil(Math.max(1, countryTotal) / 28));
      usedNamesByCountry[country.id] = usedNamesByCountry[country.id] || {};

      for (j = 0; j < targetClubs; j += 1) {
        level = 1 + Math.min(5, Math.floor((j / Math.max(1, targetClubs)) * 6));
        band = levelBand(level);
        club = existingById["club_" + country.id + "_" + j] || { id: "club_" + country.id + "_" + j };
        name = clubLabel(country, j);
        attempt = 0;

        while (usedNamesByCountry[country.id][name] && attempt < 120) {
          attempt += 1;
          name = clubLabel(country, j + attempt * targetClubs + 7);
        }

        if (usedNamesByCountry[country.id][name]) {
          cities = country.cities || citiesByCountry[country.id] || [country.city || country.label];
          city = cities[j % cities.length] || country.label;
          name = city + " " + fallbackDistricts[(j + level + attempt) % fallbackDistricts.length] + " " + fallbackSuffixes[(j + attempt + level) % fallbackSuffixes.length];
        }

        usedNamesByCountry[country.id][name] = true;
        club.name = name;
        club.countryId = country.id;
        club.level = level;
        club.minOvr = band.min;
        club.maxOvr = band.max;
        club.trainingModifier = band.mod;
        club.rosterIds = club.rosterIds instanceof Array ? club.rosterIds : [];
        ensureClubCoaches(state, club, country, 70000 + i * 1000 + j);

        if (!existingById[club.id]) {
          state.clubs.push(club);
          existingById[club.id] = club;
        }
      }
    }

    state.clubs = state.clubs.filter(function (club) {
      var country = Data.countries.find(function (item) { return item.id === club.countryId; });
      var countryTotal;
      var maxClubs;
      if (!country || !club || !club.id) { return false; }
      clubIndex = Number(String(club.id).split("_").pop());
      countryTotal = actualFightersByCountry[country.id] || 0;
      maxClubs = Math.max(2, Math.ceil(Math.max(1, countryTotal) / 28));
      return clubIndex >= 0 && clubIndex < maxClubs;
    });

    for (i = 0; i < state.clubs.length; i += 1) {
      country = U.findCountry(state.clubs[i].countryId);
      ensureClubCoaches(state, state.clubs[i], country, 90000 + i * 1000);
    }

    needsAssign = state._forceClubAssign || state.clubs.some(function (club) { return !(club.rosterIds instanceof Array) || !club.rosterIds.length; });
    if (needsAssign) {
      assignFightersToClubs(state);
      state._forceClubAssign = false;
    } else {
      syncCoachRecords(state);
    }
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
    var i;
    var j;
    var c;
    var fighter;
    var club;
    var rating;
    var countryId;
    var clubsByCountry = {};
    var fightersByCountry = {};
    var countryClubs;
    var countryFighters;

    for (i = 0; i < (state.clubs || []).length; i += 1) {
      club = state.clubs[i];
      club.rosterIds = [];
      if (club.coaches instanceof Array) {
        for (j = 0; j < club.coaches.length; j += 1) {
          if (club.coaches[j]) { club.coaches[j].assignedCount = 0; }
        }
      }
      clubsByCountry[club.countryId] = clubsByCountry[club.countryId] || [];
      clubsByCountry[club.countryId].push(club);
    }

    for (i = 0; i < (state.roster || []).length; i += 1) {
      fighter = state.roster[i];
      if (!fighter || fighter.isPlayer || fighter.retired) { continue; }
      countryId = fighter.countryId;
      fightersByCountry[countryId] = fightersByCountry[countryId] || [];
      fightersByCountry[countryId].push(fighter);
    }

    for (c = 0; c < Data.countries.length; c += 1) {
      countryId = Data.countries[c].id;
      countryClubs = clubsByCountry[countryId] || [];
      countryFighters = fightersByCountry[countryId] || [];
      if (!countryClubs.length || !countryFighters.length) { continue; }

      countryFighters.sort(function (a, b) { return U.statAverage(a.stats) - U.statAverage(b.stats); });

      for (i = 0; i < countryFighters.length; i += 1) {
        fighter = countryFighters[i];
        rating = U.statAverage(fighter.stats);
        club = pickLeastFilled(countryClubs, rating);
        if (club) {
          fighter.gymId = club.id;
          assignCoachToFighter(state, fighter, club, false);
          club.rosterIds.push(fighter.id);
        }
      }
    }

    for (i = 0; i < (state.roster || []).length; i += 1) {
      fighter = state.roster[i];
      if (!fighter || fighter.retired || !fighter.gymId) { continue; }
      club = findClub(state, fighter.gymId);
      if (!club) { fighter.coachId = ""; continue; }
      if (fighter.isPlayer) {
        if (!coachBelongsToClub(club, fighter.coachId)) {
          fighter.coachId = clubCoachList(club).length === 1 ? clubCoachList(club)[0].id : "";
        }
        if (fighter.coachId) {
          var playerCoach = findCoach(state, fighter.coachId);
          if (playerCoach) { playerCoach.assignedCount = (Number(playerCoach.assignedCount) || 0) + 1; }
        }
      } else {
        assignCoachToFighter(state, fighter, club, false);
      }
      if (club && club.rosterIds.indexOf(fighter.id) === -1) { club.rosterIds.push(fighter.id); }
    }
    syncCoachRecords(state);
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
    var i;
    var j;
    var club;
    var list;
    var teamCoach;
    if (!state || !coachId) { return null; }
    for (i = 0; i < (state.clubs || []).length; i += 1) {
      club = state.clubs[i];
      list = clubCoachList(club);
      for (j = 0; j < list.length; j += 1) {
        if (list[j] && list[j].id === coachId) { return list[j]; }
      }
    }
    if (state.world && state.world.teamCoaches) {
      for (i = 0; i < Object.keys(state.world.teamCoaches).length; i += 1) {
        teamCoach = state.world.teamCoaches[Object.keys(state.world.teamCoaches)[i]];
        if (teamCoach && teamCoach.id === coachId) { return teamCoach; }
      }
    }
    return null;
  }

  function syncPeopleForPlayerClub(state) {
    var p = window.FS.State.player(state);
    var selected;
    state.people = state.people instanceof Array ? state.people : [];
    if (!p) { return; }
    selected = findFighterCoach(state, p);
    if (selected) {
      rememberCoachPerson(state, selected, "playerCoach", "Твой тренер · OVR " + coachOvr(selected));
    }
  }

  function movePlayerToClub(state, clubId) {
    var p = window.FS.State.player(state);
    var club = findClub(state, clubId);
    var rating = p ? U.statAverage(p.stats) : 0;
    var coaches;
    if (!p || !club || club.countryId !== p.countryId || rating < club.minOvr || rating > club.maxOvr) {
      state.feed = "Нельзя перейти в этот клуб.";
      return false;
    }
    p.gymId = club.id;
    coaches = clubCoachList(club);
    p.coachId = coaches.length === 1 ? coaches[0].id : "";
    p.careerLog.unshift({ week: state.week, text: "Переход в клуб: " + club.name + "." });
    assignFightersToClubs(state);
    syncPeopleForPlayerClub(state);
    state.feed = coaches.length > 1 ? ("Ты перешёл в клуб: " + club.name + ". Теперь выбери тренера.") : ("Ты перешёл в клуб: " + club.name + ".");
    return true;
  }

  function selectPlayerCoach(state, coachId) {
    var p = window.FS.State.player(state);
    var club = playerClub(state);
    var coach;
    if (!p || !club || !coachBelongsToClub(club, coachId)) {
      state.feed = "Этот тренер не работает в твоём клубе.";
      return false;
    }
    coach = findCoach(state, coachId);
    if (!coach) {
      state.feed = "Тренер не найден.";
      return false;
    }
    p.coachId = coach.id;
    p.careerLog.unshift({ week: state.week, text: "Выбран тренер: " + coach.name + "." });
    rememberCoachPerson(state, coach, "playerCoach", "Твой тренер · " + club.name);
    syncCoachRecords(state);
    state.feed = "Тренер выбран: " + coach.name + ".";
    return true;
  }

  function leavePlayerClub(state) {
    var p = window.FS.State.player(state);
    if (!p) { return false; }
    p.gymId = "";
    p.coachId = "";
    assignFightersToClubs(state);
    state.feed = "Ты покинул клуб.";
    return true;
  }

  function recordClubFight(state, winner, loser, isDraw) {
    if (!state) { return; }
    state._coachRecordsDirty = true;
  }

  function rememberFightRelationship(state, opponent) {
    if (!opponent || opponent.isPlayer) { return false; }
    if (U.randomInt(1, 100) > 12) { return false; }
    rememberFighterPerson(state, opponent, "formerOpponent", "Бывший соперник · " + U.findTrack(opponent.trackId).label);
    return true;
  }

  function maybeAddWeeklyPlayerContact(state) {
    var p = window.FS.State.player(state);
    var club;
    var roster;
    var fighter;
    var ids;
    if (!p) { return; }

    if (p.gymId && U.randomInt(1, 100) <= 7) {
      club = playerClub(state);
      roster = clubRoster(state, p.gymId).filter(function (item) { return item && !item.isPlayer; });
      if (roster.length) {
        fighter = roster[U.randomInt(0, roster.length - 1)];
        rememberFighterPerson(state, fighter, "clubmate", "Одноклубник · " + U.findTrack(fighter.trackId).label);
      }
    }

    if (U.randomInt(1, 100) <= 5 && p.recentOpponentIds instanceof Array && p.recentOpponentIds.length) {
      ids = p.recentOpponentIds.slice(0, 8);
      fighter = U.getFighterById(state, ids[U.randomInt(0, ids.length - 1)]);
      if (fighter && !fighter.isPlayer) {
        rememberFighterPerson(state, fighter, "formerOpponent", "Бывший соперник · " + U.findTrack(fighter.trackId).label);
      }
    }
  }

  function maybeMoveNpcClubs(state) {
    var roster = state.roster || [];
    var attempts = Math.min(60, Math.max(18, Math.floor(roster.length / 260)));
    var i;
    var fighter;
    var eligible;
    var current;
    var target;
    var pClub;
    var newsDone = false;
    var moved = false;

    pClub = playerClub(state);

    for (i = 0; i < attempts; i += 1) {
      fighter = roster[U.randomInt(0, Math.max(0, roster.length - 1))];
      if (!fighter || fighter.isPlayer || fighter.retired || U.randomInt(1, 100) > 10) { continue; }

      eligible = eligibleClubsForFighter(state, fighter, null);
      current = findClub(state, fighter.gymId);
      target = eligible[0];

      if (!target || (current && current.id === target.id && U.randomInt(1, 100) > 14)) { continue; }
      if (current && target.level <= current.level && U.randomInt(1, 100) > 12) { continue; }

      if (!newsDone && pClub && window.FS.World && window.FS.World.createNews) {
        if (current && current.id === pClub.id && target.id !== pClub.id) {
          window.FS.World.createNews(state, "club", "Из твоего клуба ушёл " + fighter.name + ".", { fighterId: fighter.id, clubId: pClub.id });
          newsDone = true;
        } else if ((!current || current.id !== pClub.id) && target.id === pClub.id) {
          window.FS.World.createNews(state, "club", "В твой клуб пришёл " + fighter.name + ".", { fighterId: fighter.id, clubId: pClub.id });
          newsDone = true;
        }
      }

      if (current && current.rosterIds instanceof Array) {
        current.rosterIds = current.rosterIds.filter(function (id) { return id !== fighter.id; });
      }

      fighter.gymId = target.id;
      assignCoachToFighter(state, fighter, target, false);

      target.rosterIds = target.rosterIds instanceof Array ? target.rosterIds : [];
      if (target.rosterIds.indexOf(fighter.id) === -1) { target.rosterIds.push(fighter.id); }

      moved = true;
    }

    if (moved) { state._coachRecordsDirty = true; }
  }

  function reassignFightersFromCoach(state, oldCoachId, oldClub) {
    (state.roster || []).forEach(function (fighter) {
      if (!fighter || fighter.retired || fighter.coachId !== oldCoachId) { return; }
      if (fighter.isPlayer) {
        fighter.coachId = "";
      } else {
        assignCoachToFighter(state, fighter, oldClub, true);
      }
    });
  }

  function simulateCoachLife(state) {
    var i;
    var j;
    var club;
    var pClub;
    var country;
    var oldCoach;
    var newCoach;
    var eventType;
    var chance;
    var target;
    var targetCountry;
    var coach;
    var moved = false;
    var changed = false;
    var clubs = state.clubs || [];
    var maxClubs = clubs.length > 260 ? 60 : clubs.length;
    var start = clubs.length > maxClubs ? ((state.week * maxClubs) % clubs.length) : 0;
    var index;

    pClub = playerClub(state);

    for (i = 0; i < maxClubs; i += 1) {
      index = clubs.length ? (start + i) % clubs.length : 0;
      club = clubs[index];
      if (!club) { continue; }

      country = U.findCountry(club.countryId);
      ensureClubCoaches(state, club, country, 110000 + index * 1000);

      for (j = 0; j < club.coaches.length; j += 1) {
        coach = club.coaches[j];
        normalizeCoachStats(coach, club);
        coach.age = Number(coach.age) || 45;
        if (state.week % 48 === 1) { coach.age += 1; }

        chance = coach.age >= 70 ? 0.35 : (coach.age >= 60 ? 0.12 : 0.03);

        if (U.randomInt(1, 10000) <= Math.round(chance * 100)) {
          oldCoach = coach;
          eventType = U.randomInt(1, 100) <= 18 ? "погиб" : "ушёл на пенсию";
          newCoach = createCoach(country, club.id + "_" + j, 900000 + state.week * 1000 + index * 10 + j);
          newCoach.clubId = club.id;
          newCoach.note = j === 0 ? "Главный тренер клуба." : "Тренер клуба.";
          newCoach.stats = coachStatsFromSeed(club.level, 900000 + state.week * 1000 + index * 10 + j);
          newCoach.ovr = coachOvr(newCoach);
          newCoach.careerLog.unshift({ week: state.week, text: "Заменил тренера " + oldCoach.name + " в клубе " + club.name + "." });
          club.coaches[j] = newCoach;
          if (j === 0) { club.coach = newCoach; }
          reassignFightersFromCoach(state, oldCoach.id, club);
          changed = true;

          if (pClub && pClub.id === club.id) {
            state.modal = { type: "coachEvent", title: "Событие в клубе", text: "Тренер " + oldCoach.name + " " + eventType + ". Новым тренером стал " + newCoach.name + "." };
            if (window.FS.World && window.FS.World.createNews) {
              window.FS.World.createNews(state, "club", "В твоём клубе сменился тренер: " + oldCoach.name + " " + eventType + ". Новый тренер — " + newCoach.name + ".", { clubId: club.id, coachId: newCoach.id });
            }
          }

          state.feed = "В клубе " + club.name + " сменился тренер.";
          continue;
        }

        if (U.randomInt(1, 10000) <= 6 && clubs.length > 1) {
          target = clubs[U.randomInt(0, clubs.length - 1)];
          if (target && target.id !== club.id && club.coaches.length > 1 && Math.abs((target.level || 1) - (club.level || 1)) <= 1) {
            club.coaches.splice(j, 1);
            if (!target.coaches) { target.coaches = []; }
            target.coaches.push(coach);
            targetCountry = U.findCountry(target.countryId);
            coach.clubId = target.id;
            coach.countryId = target.countryId;
            coach.currentCountryId = target.countryId;
            normalizeCoachStats(coach, target);
            coach.careerLog = coach.careerLog instanceof Array ? coach.careerLog : [];
            coach.careerLog.unshift({ week: state.week, text: "Переход в клуб " + target.name + " · " + targetCountry.label + "." });
            if (coach.careerLog.length > 20) { coach.careerLog.length = 20; }
            reassignFightersFromCoach(state, coach.id, club);
            ensureClubCoaches(state, club, country, 120000 + index * 1000 + j);
            ensureClubCoaches(state, target, targetCountry, 130000 + index * 1000 + j);
            if (pClub && (pClub.id === club.id || pClub.id === target.id) && window.FS.World && window.FS.World.createNews) {
              window.FS.World.createNews(state, "club", "Тренер перешёл: " + coach.name + " · " + club.name + " → " + target.name + ".", { clubId: target.id, fromClubId: club.id, coachId: coach.id });
            }
            moved = true;
            changed = true;
            break;
          }
        }
      }

      if (club.coaches && club.coaches[0]) { club.coach = club.coaches[0]; }
    }

    if (moved && window.FS.World && window.FS.World.createNews) { state.feed = "На тренерском рынке были переходы."; }

    if (changed) {
      assignFightersToClubs(state);
      state._coachRecordsDirty = false;
    } else if (state._coachRecordsDirty || state.week % 4 === 1) {
      syncCoachRecords(state);
      state._coachRecordsDirty = false;
    }

    if (typeof maybeAddWeeklyPlayerContact === "function") { maybeAddWeeklyPlayerContact(state); }
    syncPeopleForPlayerClub(state);
  }

  function flushCoachRecords(state) {
    if (!state || !state._coachRecordsDirty) { return; }
    syncCoachRecords(state);
    state._coachRecordsDirty = false;
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
    findFighterCoach: findFighterCoach,
    coachOvr: coachOvr,
    coachFightBonus: coachFightBonus,
    coachProfessionalismMultiplier: coachProfessionalismMultiplier,
    fighterEffectiveOvr: fighterEffectiveOvr,
    coachAssignedFighters: coachAssignedFighters,
    syncCoachRecords: syncCoachRecords,
    flushCoachRecords: flushCoachRecords,
    selectPlayerCoach: selectPlayerCoach,
    rememberFightRelationship: rememberFightRelationship,
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
