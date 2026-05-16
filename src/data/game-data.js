(function () {
  "use strict";

  window.FS = window.FS || {};

  window.FS.Data = {
    appVersion: "vertical-slice-1.0.1",
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

    tactics: [
      { id: "pressure", label: "Давить", power: 5, stamina: -3, defense: -3, ko: 6 },
      { id: "balanced", label: "Спокойно", power: 0, stamina: 0, defense: 0, ko: 0 },
      { id: "careful", label: "Осторожно", power: -3, stamina: 4, defense: 5, ko: -3 }
    ],

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
        label: "Россия",
        city: "Москва",
        firstNames: ["Влад", "Дмитрий", "Артем", "Илья", "Максим", "Никита", "Кирилл", "Егор", "Павел", "Роман", "Алексей", "Сергей", "Олег", "Данил", "Тимур", "Руслан", "Матвей", "Глеб"],
        lastNames: ["Васильев", "Морозов", "Орлов", "Павлов", "Козлов", "Волков", "Иванов", "Кузнецов", "Соколов", "Лебедев", "Федоров", "Комаров", "Смирнов", "Громов", "Белов", "Титов", "Егоров", "Савин"],
        gymNames: ["Красный Угол", "Стальная Школа", "Ринг Север", "Буря Бокса"]
      },
      {
        id: "mexico",
        label: "Мексика",
        city: "Мехико",
        firstNames: ["Diego", "Mateo", "Santiago", "Emilio", "Carlos", "Luis", "Javier", "Miguel", "Rafael", "Andres", "Hector", "Nico", "Marco", "Tomas", "Angel", "Gael", "Oscar", "Julio"],
        lastNames: ["Garcia", "Lopez", "Hernandez", "Martinez", "Ramirez", "Santos", "Vargas", "Castillo", "Morales", "Cruz", "Reyes", "Ortega", "Rios", "Navarro", "Mendoza", "Flores", "Aguilar", "Cabrera"],
        gymNames: ["Casa del Ring", "Sangre Gym", "Distrito Boxing", "Guantes Rojos"]
      },
      {
        id: "japan",
        label: "Япония",
        city: "Токио",
        firstNames: ["Haruto", "Ren", "Sota", "Yuto", "Daiki", "Kaito", "Riku", "Takumi", "Shin", "Hayate", "Akira", "Toma", "Itsuki", "Ryusei", "Kenta", "Naoki", "Yuma", "Hiro"],
        lastNames: ["Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito", "Nakamura", "Kobayashi", "Kato", "Yamamoto", "Mori", "Aoki", "Ishida", "Ogawa", "Fujita", "Hara", "Shimizu", "Arai"],
        gymNames: ["Tokyo Ring Lab", "Aoki Boxing", "Shibuya Gloves", "Iron Dojo"]
      },
      {
        id: "usa",
        label: "США",
        city: "Нью-Йорк",
        firstNames: ["Marcus", "Andre", "Tyler", "Darnell", "Chris", "Evan", "Jordan", "Malik", "Isaiah", "Caleb", "Brandon", "Derek", "Victor", "Shawn", "Miles", "Cole"],
        lastNames: ["Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "King", "Ward"],
        gymNames: ["Eastside Boxing", "Bronx Ring", "Liberty Gloves", "Downtown Fight Club"]
      },
      {
        id: "cuba",
        label: "Куба",
        city: "Гавана",
        firstNames: ["Yordan", "Luis", "Ramon", "Ernesto", "Jorge", "Ariel", "Yoel", "Daniel", "Osvaldo", "Rafael", "Lazaro", "Ivan", "Omar", "Felix"],
        lastNames: ["Perez", "Gomez", "Rodriguez", "Diaz", "Fernandez", "Alvarez", "Castro", "Sanchez", "Torres", "Medina", "Vega", "Leon", "Suarez", "Pino"],
        gymNames: ["Havana Academy", "Old Ring", "Caribe Boxing", "La Escuela"]
      },
      {
        id: "kazakhstan",
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
      { id: "junior_1", label: "I юношеский", minRating: 1 },
      { id: "adult_3", label: "III разряд", minRating: 28 },
      { id: "adult_2", label: "II разряд", minRating: 38 },
      { id: "adult_1", label: "I разряд", minRating: 48 },
      { id: "kms", label: "КМС", minRating: 62 },
      { id: "ms", label: "МС", minRating: 78 }
    ],

    offerDifficulties: [
      { id: "safe", label: "Осторожный бой", offset: -5, purseMul: 0.85 },
      { id: "even", label: "Ровный бой", offset: 0, purseMul: 1.0 },
      { id: "hard", label: "Сложный бой", offset: 6, purseMul: 1.25 }
    ],

    titleTypes: [
      { id: "street_country", label: "Чемпион улицы", trackId: "street", scope: "country" },
      { id: "amateur_country", label: "Чемпион любителей", trackId: "amateur", scope: "country" },
      { id: "pro_regional", label: "Региональный пояс", trackId: "pro", scope: "country" }
    ],

    legacySaveKeys: ["fight_simulator_season_bundle_v9", "fight_simulator_career_depth_v5", "fight_simulator_ecosystem_v4"],

    defaultFilters: {
      tab: "dashboard",
      rankingCountryId: "russia",
      rankingTrackId: "amateur",
      rankingWeightClassId: "welter"
    }
  };
}());
