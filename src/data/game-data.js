(function () {
  "use strict";

  window.FS = window.FS || {};

  window.FS.Data = {
    appVersion: "pro-career-pack-1.9.4",
    saveKey: "fight_simulator_vertical_slice_v10",

    tracks: {
      amateur: {
        id: "amateur",
        label: "Любители",
        short: "ЛБ",
        maxStat: 120,
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


    economy: {
      startingMoney: 650,
      livingCostByTrack: { amateur: 95, street: 120, pro: 280 },
      foodCost: 70,
      medicalReserveCost: 45,
      travelCosts: { russia: 170, mexico: 260, japan: 360, usa: 380, cuba: 300, kazakhstan: 210 },
      tournamentEntryFees: { city: 25, oblast: 45, region: 75, country: 130, continent: 260, world: 420, olympiad: 650 },
      fightIncomeMultiplier: { amateur: 0.75, street: 1.2, pro: 1.65 },
      fatigue: { trainingWeek: 12, fight: 18, tournamentFight: 10, travel: 14, monthlyStressNoMoney: 16, recoveryPerWeek: 6, restWeek: 18 },
      equipment: [
        { id: "basic_gloves", label: "Базовые перчатки", cost: 120, upkeep: 8, trainingBonus: 0.03, fatigueReduction: 1 },
        { id: "good_boots", label: "Хорошая обувь", cost: 180, upkeep: 10, trainingBonus: 0.04, fatigueReduction: 1 },
        { id: "mouthguard", label: "Капа", cost: 60, upkeep: 4, trainingBonus: 0.00, fatigueReduction: 1 },
        { id: "amateur_headgear", label: "Шлем для любителей", cost: 140, upkeep: 7, trainingBonus: 0.02, fatigueReduction: 2 }
      ],
      medicalServices: [
        { id: "recovery", label: "Восстановление", cost: 90, fatigue: -18 },
        { id: "sport_doctor", label: "Спортврач", cost: 180, fatigue: -32 },
        { id: "rehab_week", label: "Реабилитационная неделя", cost: 260, fatigue: -45 }
      ]
    },

    statKeys: [
      { id: "power", label: "Сила" },
      { id: "technique", label: "Техника" },
      { id: "speed", label: "Скорость" },
      { id: "stamina", label: "Выносливость" },
      { id: "defense", label: "Здоровье" }
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
      { id: "kms", label: "КМС", minRating: 60, maxRating: 79 },
      { id: "ms", label: "МС", minRating: 80, maxRating: 99 },
      { id: "msmk", label: "МСМК", minRating: 100, maxRating: 120 }
    ],

    amateurRankRosterCounts: {
      adult_3: 1000,
      adult_2: 600,
      adult_1: 300,
      kms: 120,
      ms: 60,
      msmk: 30
    },

    beltBodies: [
      { id: "wbc", label: "WBC", crown: "👑" },
      { id: "wba", label: "WBA", crown: "👑" },
      { id: "wbo", label: "WBO", crown: "👑" },
      { id: "ibf", label: "IBF", crown: "👑" }
    ],

    offerDifficulties: [
      { id: "safe", label: "Бой", offset: -5, purseMul: 0.85 },
      { id: "even", label: "Бой", offset: 0, purseMul: 1.0 },
      { id: "hard", label: "Бой", offset: 6, purseMul: 1.25 }
    ],

    titleTypes: [
      { id: "street_country", label: "Чемпион улицы", trackId: "street", scope: "country" },
      { id: "pro_world_wbc", label: "Чемпион мира WBC", bodyId: "wbc", trackId: "pro", scope: "world" },
      { id: "pro_world_wba", label: "Чемпион мира WBA", bodyId: "wba", trackId: "pro", scope: "world" },
      { id: "pro_world_wbo", label: "Чемпион мира WBO", bodyId: "wbo", trackId: "pro", scope: "world" },
      { id: "pro_world_ibf", label: "Чемпион мира IBF", bodyId: "ibf", trackId: "pro", scope: "world" }
    ],

    careerArchetypes: [
      { id: "rookie", label: "Новичок", age: 16, baseOvr: 0, trackId: "amateur", money: 0, fatigue: 0, description: "16 лет · OVR 0 · любители · до 18 лет расходы $0" },
      { id: "amateur", label: "Любитель", age: 18, baseOvr: 30, trackId: "amateur", money: 250, fatigue: 8, description: "18 лет · OVR 30 · любители" },
      { id: "street_kid", label: "Уличный парень", age: 18, baseOvr: 10, trackId: "street", money: 150, fatigue: 12, description: "18 лет · OVR 10 · улица" },
      { id: "debt_pro", label: "Профессионал с долгами", age: 26, baseOvr: 90, trackId: "pro", money: 0, fatigue: 35, hardModeDebt: true, expenseMultiplier: 2.35, description: "26 лет · OVR 90 · профи · $0 на счёте · максимальные расходы" }
    ],

    promoters: [
      { id: "local_hall", label: "Local Hall Promotions", level: 1, cut: 0.08, purseMul: 1.00, weeksMin: 4, weeksMax: 7 },
      { id: "iron_city", label: "Iron City Boxing", level: 2, cut: 0.12, purseMul: 1.22, weeksMin: 6, weeksMax: 10 },
      { id: "world_stage", label: "World Stage Promotions", level: 3, cut: 0.16, purseMul: 1.55, weeksMin: 8, weeksMax: 14 },
      { id: "championship", label: "Championship Boxing", level: 4, cut: 0.20, purseMul: 1.95, weeksMin: 10, weeksMax: 20 }
    ],

    legacySaveKeys: ["fight_simulator_season_bundle_v9", "fight_simulator_career_depth_v5", "fight_simulator_ecosystem_v4"],

    amateurCompetitions: [
      { id: "city", label: "Чемпионат города", awardLabel: "Чемпион города", minRating: 0, maxRating: 50, rewardRating: 60, difficultyId: "safe", weekCooldown: 8, scope: "country", minOpponentRating: 0, schedule: "any" },
      { id: "oblast", label: "Чемпионат области", awardLabel: "Чемпион области", minRating: 20, maxRating: 60, rewardRating: 100, difficultyId: "safe", weekCooldown: 12, scope: "country", minOpponentRating: 20, schedule: "any" },
      { id: "region", label: "Чемпионат региона", awardLabel: "Чемпион региона", minRating: 35, maxRating: 70, rewardRating: 150, difficultyId: "even", weekCooldown: 16, scope: "country", minOpponentRating: 35, schedule: "any" },
      { id: "country", label: "Чемпионат страны", awardLabel: "Призёр чемпионата страны", minRating: 50, maxRating: 80, rewardRating: 230, difficultyId: "hard", weekCooldown: 24, scope: "country", minOpponentRating: 50, schedule: "country" },
      { id: "continent", label: "Чемпионат континента", awardLabel: "Призёр чемпионата континента", minRating: 65, maxRating: 100, rewardRating: 340, difficultyId: "hard", weekCooldown: 32, scope: "continent", minOpponentRating: 65, schedule: "continent" },
      { id: "world", label: "Чемпионат мира", awardLabel: "Призёр чемпионата мира", minRating: 80, maxRating: 120, rewardRating: 500, difficultyId: "hard", weekCooldown: 40, scope: "world", minOpponentRating: 80, schedule: "world" },
      { id: "olympiad", label: "Олимпиада", awardLabel: "Призёр Олимпиады", minRating: 100, maxRating: 120, rewardRating: 750, difficultyId: "hard", weekCooldown: 64, scope: "world_elite", minOpponentRating: 100, schedule: "olympiad" }
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
