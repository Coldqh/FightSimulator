(function () {
  "use strict";
  window.FS = window.FS || {};
  window.FS.Data = {
    appVersion: "career-depth-0.5.0",
    saveKey: "fight_simulator_career_depth_v5",
    tracks: {
      amateur: { id: "amateur", label: "Любители", short: "ЛБ", maxStat: 100, rounds: 3, basePurse: 120, color: "red" },
      street: { id: "street", label: "Улица", short: "УЛ", maxStat: 150, rounds: 4, basePurse: 220, color: "gold" },
      pro: { id: "pro", label: "Профи", short: "ПР", maxStat: 200, rounds: 8, basePurse: 1000, color: "green" }
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
      { id: "russia", label: "Россия", city: "Москва",
        firstNames: ["Влад","Дмитрий","Артем","Илья","Максим","Никита","Кирилл","Егор","Павел","Роман","Алексей","Сергей","Олег","Данил","Тимур","Руслан","Матвей","Глеб"],
        lastNames: ["Васильев","Морозов","Орлов","Павлов","Козлов","Волков","Иванов","Кузнецов","Соколов","Лебедев","Федоров","Комаров","Смирнов","Громов","Белов","Титов","Егоров","Савин"] },
      { id: "mexico", label: "Мексика", city: "Мехико",
        firstNames: ["Diego","Mateo","Santiago","Emilio","Carlos","Luis","Javier","Miguel","Rafael","Andres","Hector","Nico","Marco","Tomas","Angel","Gael","Oscar","Julio"],
        lastNames: ["Garcia","Lopez","Hernandez","Martinez","Ramirez","Santos","Vargas","Castillo","Morales","Cruz","Reyes","Ortega","Rios","Navarro","Mendoza","Flores","Aguilar","Cabrera"] },
      { id: "japan", label: "Япония", city: "Токио",
        firstNames: ["Haruto","Ren","Sota","Yuto","Daiki","Kaito","Riku","Takumi","Shin","Hayate","Akira","Toma","Itsuki","Ryusei","Kenta","Naoki","Yuma","Hiro"],
        lastNames: ["Sato","Suzuki","Takahashi","Tanaka","Watanabe","Ito","Nakamura","Kobayashi","Kato","Yamamoto","Mori","Aoki","Ishida","Ogawa","Fujita","Hara","Shimizu","Arai"] },
      { id: "usa", label: "США", city: "Нью-Йорк",
        firstNames: ["Marcus","Andre","Tyler","Darnell","Chris","Evan","Jordan","Malik","Isaiah","Caleb","Brandon","Derek","Victor","Shawn","Miles","Cole"],
        lastNames: ["Johnson","Williams","Brown","Davis","Miller","Wilson","Moore","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","King","Ward"] },
      { id: "cuba", label: "Куба", city: "Гавана",
        firstNames: ["Yordan","Luis","Ramon","Ernesto","Jorge","Ariel","Yoel","Daniel","Osvaldo","Rafael","Lazaro","Ivan","Omar","Felix"],
        lastNames: ["Perez","Gomez","Rodriguez","Diaz","Fernandez","Alvarez","Castro","Sanchez","Torres","Medina","Vega","Leon","Suarez","Pino"] },
      { id: "kazakhstan", label: "Казахстан", city: "Алматы",
        firstNames: ["Арман","Ержан","Дамир","Алихан","Нурлан","Бекзат","Тимур","Руслан","Самат","Азамат","Данияр","Ислам","Ерасыл","Марат"],
        lastNames: ["Ахметов","Сериков","Нурмагамбетов","Касымов","Жумабаев","Ибрагимов","Омаров","Каримов","Сулейменов","Тулегенов","Алимов","Есенов","Мусин","Беков"] }
    ],
    statKeys: [
      { id: "power", label: "Сила" }, { id: "technique", label: "Техника" }, { id: "speed", label: "Скорость" },
      { id: "stamina", label: "Выносливость" }, { id: "defense", label: "Защита" }
    ],
    peopleRoles: { coach: "Тренер", clubmate: "Одноклубник", rival: "Соперник", organizer: "Организатор", cutman: "Секундант" },
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
    defaultFilters: { tab: "dashboard", rankingCountryId: "russia", rankingTrackId: "amateur", rankingWeightClassId: "welter" }
  };
}());
