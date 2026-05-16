(function () {
  "use strict";

  window.FS = window.FS || {};

  window.FS.Data = {
    appVersion: "ecosystem-mvp-0.4.0",
    saveKey: "fight_simulator_ecosystem_v4",

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

    countries: [
      {
        id: "russia",
        label: "Россия",
        city: "Москва",
        firstNames: ["Влад", "Дмитрий", "Артем", "Илья", "Максим", "Никита", "Кирилл", "Егор", "Павел", "Роман", "Алексей", "Сергей", "Олег", "Данил", "Тимур", "Руслан"],
        lastNames: ["Васильев", "Морозов", "Орлов", "Павлов", "Козлов", "Волков", "Иванов", "Кузнецов", "Соколов", "Лебедев", "Федоров", "Комаров", "Смирнов", "Громов", "Белов", "Титов"]
      },
      {
        id: "mexico",
        label: "Мексика",
        city: "Мехико",
        firstNames: ["Diego", "Mateo", "Santiago", "Emilio", "Carlos", "Luis", "Javier", "Miguel", "Rafael", "Andres", "Hector", "Nico", "Marco", "Tomas", "Angel", "Gael"],
        lastNames: ["Garcia", "Lopez", "Hernandez", "Martinez", "Ramirez", "Santos", "Vargas", "Castillo", "Morales", "Cruz", "Reyes", "Ortega", "Rios", "Navarro", "Mendoza", "Flores"]
      },
      {
        id: "japan",
        label: "Япония",
        city: "Токио",
        firstNames: ["Haruto", "Ren", "Sota", "Yuto", "Daiki", "Kaito", "Riku", "Takumi", "Shin", "Hayate", "Akira", "Toma", "Itsuki", "Ryusei", "Kenta", "Naoki"],
        lastNames: ["Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito", "Nakamura", "Kobayashi", "Kato", "Yamamoto", "Mori", "Aoki", "Ishida", "Ogawa", "Fujita", "Hara"]
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

    defaultFilters: {
      tab: "dashboard",
      rankingCountryId: "russia",
      rankingTrackId: "amateur"
    }
  };
}());
