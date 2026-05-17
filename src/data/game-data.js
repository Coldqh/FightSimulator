(function () {
  "use strict";

  window.FS = window.FS || {};

  window.FS.Data = {
    appVersion: "career-world-rework-1.4.1",
    saveKey: "fight_simulator_vertical_slice_v10",

    tracks: {
      amateur: {
        id: "amateur",
        label: "Любители",
        short: "ЛБ",
        maxStat: 100,
        rounds: 3,
        basePurse: 120,
        color: "red"
      },
      street: {
        id: "street",
        label: "Улица",
        short: "УЛ",
        maxStat: 150,
        rounds: 4,
        basePurse: 220,
        color: "gold"
      },
      pro: {
        id: "pro",
        label: "Профи",
        short: "ПР",
        maxStat: 200,
        rounds: 8,
        basePurse: 1000,
        color: "green"
      }
    },


    weightClasses: [
      { id: "bantam", label: "Легчайший", min: 52, max: 56 },
      { id: "light", label: "Лёгкий", min: 57, max: 61 },
      { id: "welter", label: "Полусредний", min: 62, max: 67 },
      { id: "middle", label: "Средний", min: 68, max: 75 },
      { id: "light_heavy", label: "Полутяжёлый", min: 76, max: 81 },
      { id: "heavy", label: "Тяжёлый", min: 82, max: 110 }
    ],

    stances: [
      { id: "orthodox", label: "Правша" },
      { id: "southpaw", label: "Левша" },
      { id: "switch", label: "Смена стоек" }
    ],

    countries: [
      {
        id: "russia",
        continentId: "eurasia",
        continentLabel: "Евразия",
        label: "Россия",
        city: "Москва",
        firstNames: ["Влад", "Дмитрий", "Артем", "Илья", "Максим", "Никита", "Кирилл", "Егор", "Павел", "Роман", "Алексей", "Сергей", "Олег", "Данил", "Тимур", "Руслан", "Матвей", "Глеб"],
        lastNames: ["Васильев", "Морозов", "Орлов", "Павлов", "Козлов", "Волков", "Иванов", "Кузнецов", "Соколов", "Лебедев", "Федоров", "Комаров", "Смирнов", "Громов", "Белов", "Титов", "Егоров", "Савин"],
        gymNames: ["Красный Угол", "Стальная Школа", "Ринг Север", "Буря Бокса"]
      },
      {
        id: "mexico",
        continentId: "americas",
        continentLabel: "Америка",
        label: "Мексика",
        city: "Мехико",
        firstNames: ["Diego", "Mateo", "Santiago", "Emilio", "Carlos", "Luis", "Javier", "Miguel", "Rafael", "Andres", "Hector", "Nico", "Marco", "Tomas", "Angel", "Gael", "Oscar", "Julio"],
        lastNames: ["Garcia", "Lopez", "Hernandez", "Martinez", "Ramirez", "Santos", "Vargas", "Castillo", "Morales", "Cruz", "Reyes", "Ortega", "Rios", "Navarro", "Mendoza", "Flores", "Aguilar", "Cabrera"],
        gymNames: ["Casa del Ring", "Sangre Gym", "Distrito Boxing", "Guantes Rojos"]
      },
      {
        id: "japan",
        continentId: "eurasia",
        continentLabel: "Евразия",
        label: "Япония",
        city: "Токио",
        firstNames: ["Haruto", "Ren", "Sota", "Yuto", "Daiki", "Kaito", "Riku", "Takumi", "Shin", "Hayate", "Akira", "Toma", "Itsuki", "Ryusei", "Kenta", "Naoki", "Yuma", "Hiro"],
        lastNames: ["Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito", "Nakamura", "Kobayashi", "Kato", "Yamamoto", "Mori", "Aoki", "Ishida", "Ogawa", "Fujita", "Hara", "Shimizu", "Arai"],
        gymNames: ["Tokyo Ring Lab", "Aoki Boxing", "Shibuya Gloves", "Iron Dojo"]
      },
      {
        id: "usa",
        continentId: "americas",
        continentLabel: "Америка",
        label: "США",
        city: "Нью-Йорк",
        firstNames: ["Marcus", "Andre", "Tyler", "Darnell", "Chris", "Evan", "Jordan", "Malik", "Isaiah", "Caleb", "Brandon", "Derek", "Victor", "Shawn", "Miles", "Cole"],
        lastNames: ["Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "King", "Ward"],
        gymNames: ["Eastside Boxing", "Bronx Ring", "Liberty Gloves", "Downtown Fight Club"]
      },
      {
        id: "cuba",
        continentId: "americas",
        continentLabel: "Америка",
        label: "Куба",
        city: "Гавана",
        firstNames: ["Yordan", "Luis", "Ramon", "Ernesto", "Jorge", "Ariel", "Yoel", "Daniel", "Osvaldo", "Rafael", "Lazaro", "Ivan", "Omar", "Felix"],
        lastNames: ["Perez", "Gomez", "Rodriguez", "Diaz", "Fernandez", "Alvarez", "Castro", "Sanchez", "Torres", "Medina", "Vega", "Leon", "Suarez", "Pino"],
        gymNames: ["Havana Academy", "Old Ring", "Caribe Boxing", "La Escuela"]
      },
      {
        id: "kazakhstan",
        continentId: "eurasia",
        continentLabel: "Евразия",
        label: "Казахстан",
        city: "Алматы",
        firstNames: ["Арман", "Ержан", "Дамир", "Алихан", "Нурлан", "Бекзат", "Тимур", "Руслан", "Самат", "Азамат", "Данияр", "Ислам", "Ерасыл", "Марат"],
        lastNames: ["Ахметов", "Сериков", "Нурмагамбетов", "Касымов", "Жумабаев", "Ибрагимов", "Омаров", "Каримов", "Сулейменов", "Тулегенов", "Алимов", "Есенов", "Мусин", "Беков"],
        gymNames: ["Almaty Boxing", "Nomad Ring", "Steppe Gloves", "Temir Gym"]
      }
    ],

    statKeys: [
      { id: "power", label: "Сила" },
      { id: "technique", label: "Техника" },
      { id: "speed", label: "Скорость" },
      { id: "stamina", label: "Выносливость" },
      { id: "defense", label: "Защита" }
    ],

    peopleRoles: {
      coach: "Тренер",
      clubmate: "Одноклубник",
      rival: "Соперник",
      organizer: "Организатор",
      cutman: "Секундант"
    },

    amateurRanks: [
      { id: "adult_3", label: "III взрослый", minRating: 0, maxRating: 19 },
      { id: "adult_2", label: "II взрослый", minRating: 20, maxRating: 39 },
      { id: "adult_1", label: "I взрослый", minRating: 40, maxRating: 59 },
      { id: "kms", label: "КМС", minRating: 60, maxRating: 74 },
      { id: "ms", label: "МС", minRating: 75, maxRating: 89 },
      { id: "msmk", label: "МСМК", minRating: 90, maxRating: 100 }
    ],

    amateurRankRosterCounts: {
      adult_3: 500,
      adult_2: 300,
      adult_1: 150,
      kms: 60,
      ms: 30,
      msmk: 15
    },

    beltBodies: [
      { id: "wbc", label: "WBC", crown: "👑" },
      { id: "wba", label: "WBA", crown: "👑" },
      { id: "wbo", label: "WBO", crown: "👑" },
      { id: "ibf", label: "IBF", crown: "👑" }
    ],

    offerDifficulties: [
      { id: "safe", label: "Осторожный бой", offset: -5, purseMul: 0.85 },
      { id: "even", label: "Ровный бой", offset: 0, purseMul: 1.0 },
      { id: "hard", label: "Сложный бой", offset: 6, purseMul: 1.25 }
    ],

    titleTypes: [
      { id: "street_country", label: "Чемпион улицы", trackId: "street", scope: "country" },
      { id: "pro_world_wbc", label: "Чемпион мира WBC", bodyId: "wbc", trackId: "pro", scope: "world" },
      { id: "pro_world_wba", label: "Чемпион мира WBA", bodyId: "wba", trackId: "pro", scope: "world" },
      { id: "pro_world_wbo", label: "Чемпион мира WBO", bodyId: "wbo", trackId: "pro", scope: "world" },
      { id: "pro_world_ibf", label: "Чемпион мира IBF", bodyId: "ibf", trackId: "pro", scope: "world" }
    ],

    legacySaveKeys: ["fight_simulator_season_bundle_v9", "fight_simulator_career_depth_v5", "fight_simulator_ecosystem_v4"],

    amateurCompetitions: [
      { id: "city", label: "Чемпионат города", awardLabel: "Чемпион города", minRating: 0, maxRating: 24, rewardRating: 20, rounds: ["1/32", "1/16", "1/8", "Четвертьфинал", "Полуфинал", "Финал"], difficultyId: "safe", weekCooldown: 2, scope: "country", minOpponentRating: 0 },
      { id: "oblast", label: "Чемпионат области", awardLabel: "Чемпион области", minRating: 20, maxRating: 42, rewardRating: 35, rounds: ["1/32", "1/16", "1/8", "Четвертьфинал", "Полуфинал", "Финал"], difficultyId: "safe", weekCooldown: 3, scope: "country", minOpponentRating: 18 },
      { id: "region", label: "Чемпионат региона", awardLabel: "Чемпион региона", minRating: 35, maxRating: 58, rewardRating: 55, rounds: ["1/32", "1/16", "1/8", "Четвертьфинал", "Полуфинал", "Финал"], difficultyId: "even", weekCooldown: 4, scope: "country", minOpponentRating: 32 },
      { id: "country", label: "Чемпионат страны", awardLabel: "Чемпион страны", minRating: 50, maxRating: 74, rewardRating: 80, rounds: ["1/32", "1/16", "1/8", "Четвертьфинал", "Полуфинал", "Финал"], difficultyId: "hard", weekCooldown: 6, scope: "country", minOpponentRating: 48 },
      { id: "continent", label: "Чемпионат континента", awardLabel: "Чемпион континента", minRating: 65, maxRating: 89, rewardRating: 120, rounds: ["1/32", "1/16", "1/8", "Четвертьфинал", "Полуфинал", "Финал"], difficultyId: "hard", weekCooldown: 8, scope: "continent", minOpponentRating: 62 },
      { id: "world", label: "Чемпионат мира", awardLabel: "Чемпион мира", minRating: 80, maxRating: 100, rewardRating: 170, rounds: ["1/32", "1/16", "1/8", "Четвертьфинал", "Полуфинал", "Финал"], difficultyId: "hard", weekCooldown: 10, scope: "world", minOpponentRating: 76 },
      { id: "olympiad", label: "Олимпиада", awardLabel: "Олимпийский чемпион", minRating: 88, maxRating: 100, rewardRating: 240, rounds: ["1/32", "1/16", "1/8", "Четвертьфинал", "Полуфинал", "Финал"], difficultyId: "hard", weekCooldown: 16, scope: "world_elite", minOpponentRating: 84 }
    ],

    careerStages: {
      amateur: [
        { id: "local", label: "Городской уровень", minRating: 1 },
        { id: "regional", label: "Региональный уровень", minRating: 42 },
        { id: "national", label: "Национальный уровень", minRating: 58 },
        { id: "international", label: "Международный уровень", minRating: 74 }
      ],
      street: [
        { id: "yard", label: "Дворовый уровень", minRating: 1 },
        { id: "district", label: "Районный уровень", minRating: 45 },
        { id: "city", label: "Городская улица", minRating: 70 },
        { id: "king", label: "Претендент улицы", minRating: 95 }
      ],
      pro: [
        { id: "debut", label: "Дебютант профи", minRating: 1 },
        { id: "prospect", label: "Проспект", minRating: 48 },
        { id: "contender", label: "Контендер", minRating: 72 },
        { id: "champion_level", label: "Чемпионский уровень", minRating: 95 }
      ]
    },

    defaultFilters: {
      tab: "dashboard",
      rankingCountryId: "russia",
      rankingTrackId: "amateur",
      rankingWeightClassId: "welter"
    }
  };
}());
