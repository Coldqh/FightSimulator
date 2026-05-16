(function () {
  "use strict";

  var SAVE_KEY = "fight_simulator_mvp_v3";
  var APP_VERSION = "mvp-v3";
  var app = document.getElementById("app");

  var TRACKS = {
    amateur: {
      id: "amateur",
      label: "Любители",
      short: "ЛБ",
      maxStat: 100,
      rounds: 3
    },
    street: {
      id: "street",
      label: "Улица",
      short: "УЛ",
      maxStat: 150,
      rounds: 4
    },
    pro: {
      id: "pro",
      label: "Профи",
      short: "ПР",
      maxStat: 200,
      rounds: 8
    }
  };

  var COUNTRIES = [
    {
      id: "russia",
      label: "Россия",
      city: "Москва",
      firstNames: ["Влад", "Дмитрий", "Артем", "Илья", "Максим", "Никита", "Кирилл", "Егор", "Павел", "Роман", "Алексей", "Сергей", "Олег", "Данил"],
      lastNames: ["Васильев", "Морозов", "Орлов", "Павлов", "Козлов", "Волков", "Иванов", "Кузнецов", "Соколов", "Лебедев", "Федоров", "Комаров", "Смирнов", "Громов"]
    },
    {
      id: "mexico",
      label: "Мексика",
      city: "Мехико",
      firstNames: ["Diego", "Mateo", "Santiago", "Emilio", "Carlos", "Luis", "Javier", "Miguel", "Rafael", "Andres", "Hector", "Nico", "Marco", "Tomas"],
      lastNames: ["Garcia", "Lopez", "Hernandez", "Martinez", "Ramirez", "Santos", "Vargas", "Castillo", "Morales", "Cruz", "Reyes", "Ortega", "Rios", "Navarro"]
    },
    {
      id: "japan",
      label: "Япония",
      city: "Токио",
      firstNames: ["Haruto", "Ren", "Sota", "Yuto", "Daiki", "Kaito", "Riku", "Takumi", "Shin", "Hayate", "Akira", "Toma", "Itsuki", "Ryusei"],
      lastNames: ["Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito", "Nakamura", "Kobayashi", "Kato", "Yamamoto", "Mori", "Aoki", "Ishida", "Ogawa"]
    }
  ];

  var PEOPLE_ROLES = {
    coach: "Тренер",
    clubmate: "Одноклубник",
    rival: "Соперник",
    organizer: "Организатор",
    cutman: "Секундант"
  };

  var state = loadState();

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function uid(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pick(list) {
    return list[randomInt(0, list.length - 1)];
  }

  function findCountry(countryId) {
    var i;

    for (i = 0; i < COUNTRIES.length; i += 1) {
      if (COUNTRIES[i].id === countryId) {
        return COUNTRIES[i];
      }
    }

    return COUNTRIES[0];
  }

  function findTrack(trackId) {
    return TRACKS[trackId] || TRACKS.amateur;
  }

  function statAverage(stats) {
    return Math.round((stats.power + stats.technique + stats.speed + stats.stamina + stats.defense) / 5);
  }

  function statTotal(stats) {
    return stats.power + stats.technique + stats.speed + stats.stamina + stats.defense;
  }

  function recordText(record) {
    return record.wins + "-" + record.losses + "-" + record.draws + " · KO " + record.kos;
  }

  function statLabel(key) {
    var labels = {
      power: "Сила",
      technique: "Техника",
      speed: "Скорость",
      stamina: "Выносливость",
      defense: "Защита"
    };

    return labels[key] || key;
  }

  function createStats(trackId, baseValue) {
    var cap = findTrack(trackId).maxStat;

    return {
      power: clamp(baseValue + randomInt(-4, 4), 1, cap),
      technique: clamp(baseValue + randomInt(-4, 4), 1, cap),
      speed: clamp(baseValue + randomInt(-4, 4), 1, cap),
      stamina: clamp(baseValue + randomInt(-4, 4), 1, cap),
      defense: clamp(baseValue + randomInt(-4, 4), 1, cap)
    };
  }

  function createName(country, seed) {
    var firstIndex = Math.abs(seed * 3 + randomInt(0, country.firstNames.length - 1)) % country.firstNames.length;
    var lastIndex = Math.abs(seed * 5 + randomInt(0, country.lastNames.length - 1)) % country.lastNames.length;

    return country.firstNames[firstIndex] + " " + country.lastNames[lastIndex];
  }

  function createFighter(countryId, trackId, seed, baseValue) {
    var country = findCountry(countryId);

    return {
      id: uid("fighter"),
      name: createName(country, seed),
      countryId: countryId,
      trackId: trackId,
      stats: createStats(trackId, baseValue),
      record: {
        wins: randomInt(0, 9),
        losses: randomInt(0, 4),
        draws: randomInt(0, 1),
        kos: randomInt(0, 5)
      }
    };
  }

  function createRoster(player) {
    var roster = [];
    var trackIds = Object.keys(TRACKS);
    var countryIndex;
    var trackIndex;
    var fighterIndex;
    var countryId;
    var trackId;

    for (countryIndex = 0; countryIndex < COUNTRIES.length; countryIndex += 1) {
      countryId = COUNTRIES[countryIndex].id;

      for (trackIndex = 0; trackIndex < trackIds.length; trackIndex += 1) {
        trackId = trackIds[trackIndex];

        for (fighterIndex = 0; fighterIndex < 18; fighterIndex += 1) {
          roster.push(createFighter(
            countryId,
            trackId,
            countryIndex * 1000 + trackIndex * 100 + fighterIndex,
            26 + fighterIndex * 3
          ));
        }
      }
    }

    roster.push({
      id: player.id,
      name: player.name,
      countryId: player.countryId,
      trackId: player.trackId,
      stats: player.stats,
      record: player.record,
      isPlayer: true
    });

    return roster;
  }

  function createPeople(countryId) {
    var country = findCountry(countryId);

    return [
      {
        id: uid("person"),
        role: "coach",
        name: createName(country, 11),
        note: "Ведёт тренировки в зале."
      },
      {
        id: uid("person"),
        role: "clubmate",
        name: createName(country, 22),
        note: "Тренируется рядом и может вырасти в сильного бойца."
      },
      {
        id: uid("person"),
        role: "rival",
        name: createName(country, 33),
        note: "Появляется в местной боксёрской среде."
      },
      {
        id: uid("person"),
        role: "organizer",
        name: createName(country, 44),
        note: "Помогает собрать бои."
      },
      {
        id: uid("person"),
        role: "cutman",
        name: createName(country, 55),
        note: "Работает возле ринга."
      }
    ];
  }

  function loadState() {
    var raw;

    try {
      raw = localStorage.getItem(SAVE_KEY);

      if (!raw) {
        return null;
      }

      return JSON.parse(raw);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  function saveState() {
    try {
      if (!state) {
        localStorage.removeItem(SAVE_KEY);
        return;
      }

      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error(error);
    }
  }

  function syncPlayerIntoRoster() {
    var i;

    for (i = 0; i < state.roster.length; i += 1) {
      if (state.roster[i].id === state.player.id) {
        state.roster[i].name = state.player.name;
        state.roster[i].countryId = state.player.countryId;
        state.roster[i].trackId = state.player.trackId;
        state.roster[i].stats = state.player.stats;
        state.roster[i].record = state.player.record;
        return;
      }
    }

    state.roster.push({
      id: state.player.id,
      name: state.player.name,
      countryId: state.player.countryId,
      trackId: state.player.trackId,
      stats: state.player.stats,
      record: state.player.record,
      isPlayer: true
    });
  }

  function createCareer(payload) {
    var trackId = findTrack(payload.trackId).id;
    var countryId = findCountry(payload.countryId).id;

    state = {
      version: APP_VERSION,
      week: 1,
      selectedTab: "fights",
      rankingCountryId: countryId,
      rankingTrackId: trackId,
      modal: null,
      player: {
        id: "player",
        name: payload.name || "Новый боксёр",
        countryId: countryId,
        trackId: trackId,
        stats: createStats(trackId, 35),
        record: {
          wins: 0,
          losses: 0,
          draws: 0,
          kos: 0
        }
      },
      roster: [],
      people: [],
      offers: [],
      feed: "Карьера началась. Базовая версия мира загружена.",
      createdAt: new Date().toISOString()
    };

    state.roster = createRoster(state.player);
    state.people = createPeople(countryId);
    refreshOffers();
    saveState();
    render();
  }

  function getFighterById(fighterId) {
    var i;

    for (i = 0; i < state.roster.length; i += 1) {
      if (state.roster[i].id === fighterId) {
        return state.roster[i];
      }
    }

    return null;
  }

  function buildOpponentByIndex(index) {
    var candidates = [];
    var i;
    var fighter;
    var opponent;

    for (i = 0; i < state.roster.length; i += 1) {
      fighter = state.roster[i];

      if (!fighter || fighter.isPlayer) {
        continue;
      }

      if (fighter.countryId === state.player.countryId && fighter.trackId === state.player.trackId) {
        candidates.push(fighter);
      }
    }

    candidates.sort(function (left, right) {
      return Math.abs(statAverage(left.stats) - statAverage(state.player.stats)) -
        Math.abs(statAverage(right.stats) - statAverage(state.player.stats));
    });

    opponent = candidates[index];

    if (!opponent) {
      opponent = createFighter(
        state.player.countryId,
        state.player.trackId,
        9000 + state.week * 10 + index,
        statAverage(state.player.stats) + index * 3
      );
      state.roster.push(opponent);
    }

    return opponent;
  }

  function refreshOffers() {
    var labelsByTrack = {
      amateur: ["Любительский бой", "Бой городского уровня", "Матч отбора"],
      street: ["Дворовый бой", "Районный вызов", "Бой на местной площадке"],
      pro: ["Профессиональный андеркард", "Контрактный бой", "Главный бой вечера"]
    };
    var offers = [];
    var i;
    var opponent;
    var track = findTrack(state.player.trackId);

    for (i = 0; i < 3; i += 1) {
      opponent = buildOpponentByIndex(i);

      offers.push({
        id: uid("offer"),
        label: labelsByTrack[state.player.trackId][i],
        opponentId: opponent.id,
        rounds: track.rounds,
        purse: state.player.trackId === "pro" ? 1000 + i * 800 : (state.player.trackId === "street" ? 200 + i * 70 : 120 + i * 40)
      });
    }

    state.offers = offers;
  }

  function setTrack(trackId) {
    var track = findTrack(trackId);

    state.player.trackId = track.id;
    state.rankingTrackId = track.id;
    state.feed = "Путь изменён: " + track.label + ".";
    syncPlayerIntoRoster();
    refreshOffers();
    saveState();
    render();
  }

  function setCountry(countryId) {
    var country = findCountry(countryId);

    state.player.countryId = country.id;
    state.rankingCountryId = country.id;
    state.people = createPeople(country.id);
    state.feed = "Страна изменена: " + country.label + ".";
    syncPlayerIntoRoster();
    refreshOffers();
    saveState();
    render();
  }

  function trainWeek() {
    var statKeys = ["power", "technique", "speed", "stamina", "defense"];
    var chosen = pick(statKeys);
    var cap = findTrack(state.player.trackId).maxStat;

    state.player.stats[chosen] = clamp(state.player.stats[chosen] + 1, 1, cap);
    state.week += 1;
    state.feed = "Тренировочная неделя завершена. Улучшен навык: " + statLabel(chosen) + ".";
    syncPlayerIntoRoster();
    refreshOffers();
    saveState();
    render();
  }

  function nextWeek() {
    state.week += 1;
    state.feed = "Неделя " + state.week + ". Список боёв обновлён.";
    syncPlayerIntoRoster();
    refreshOffers();
    saveState();
    render();
  }

  function resultClass(result) {
    if (result === "Победа") {
      return "win";
    }

    if (result === "Поражение") {
      return "loss";
    }

    return "draw";
  }

  function resolveFight(offerId) {
    var offer = null;
    var opponent;
    var playerScore;
    var opponentScore;
    var winChance;
    var roll;
    var result;
    var method;
    var i;

    for (i = 0; i < state.offers.length; i += 1) {
      if (state.offers[i].id === offerId) {
        offer = state.offers[i];
        break;
      }
    }

    if (!offer) {
      return;
    }

    opponent = getFighterById(offer.opponentId);

    if (!opponent) {
      return;
    }

    playerScore = statAverage(state.player.stats) + state.player.record.wins * 0.7;
    opponentScore = statAverage(opponent.stats) + opponent.record.wins * 0.7;
    winChance = clamp(50 + Math.round((playerScore - opponentScore) * 2.2), 12, 88);
    roll = randomInt(1, 100);

    if (Math.abs(playerScore - opponentScore) <= 2 && randomInt(1, 100) <= 8) {
      result = "Ничья";
      method = "решение судей";
      state.player.record.draws += 1;
      opponent.record.draws += 1;
    } else if (roll <= winChance) {
      result = "Победа";
      method = randomInt(1, 100) <= 22 ? "KO/TKO" : "решение судей";
      state.player.record.wins += 1;
      opponent.record.losses += 1;

      if (method === "KO/TKO") {
        state.player.record.kos += 1;
      }
    } else {
      result = "Поражение";
      method = randomInt(1, 100) <= 18 ? "KO/TKO" : "решение судей";
      state.player.record.losses += 1;
      opponent.record.wins += 1;

      if (method === "KO/TKO") {
        opponent.record.kos += 1;
      }
    }

    state.modal = {
      type: "fightResult",
      result: result,
      method: method,
      opponentName: opponent.name,
      week: state.week,
      playerRating: statAverage(state.player.stats),
      opponentRating: statAverage(opponent.stats),
      purse: offer.purse
    };

    state.feed = "Неделя " + state.week + ": " + state.player.name + " vs " + opponent.name + " — " + result + ", " + method + ".";
    state.week += 1;
    syncPlayerIntoRoster();
    refreshOffers();
    saveState();
    render();
  }

  function openFighterModal(fighterId) {
    var fighter = getFighterById(fighterId);

    if (!fighter) {
      return;
    }

    state.modal = {
      type: "fighter",
      fighterId: fighter.id
    };
    saveState();
    render();
  }

  function closeModal() {
    state.modal = null;
    saveState();
    render();
  }

  function resetCareer() {
    localStorage.removeItem(SAVE_KEY);
    state = null;
    render();
  }

  function rankingList() {
    return state.roster
      .filter(function (fighter) {
        return fighter.countryId === state.rankingCountryId && fighter.trackId === state.rankingTrackId;
      })
      .sort(function (left, right) {
        return statAverage(right.stats) - statAverage(left.stats);
      });
  }

  function renderStartScreen() {
    var countryOptions = COUNTRIES.map(function (country) {
      return "<option value=\"" + escapeHtml(country.id) + "\">" + escapeHtml(country.label) + "</option>";
    }).join("");

    app.innerHTML =
      "<section class=\"start-screen\">" +
        "<div class=\"start-card\">" +
          "<div class=\"start-head\">" +
            "<div class=\"brand\">" +
              "<div class=\"logo\">FS</div>" +
              "<div>" +
                "<h1>Fight Simulator</h1>" +
                "<p>Базовая версия боксёрского симулятора. Быстрый старт, 3 боя в каждой стране, простая карьера, рейтинг и карточки бойцов.</p>" +
              "</div>" +
            "</div>" +
            "<div class=\"ring-line\"></div>" +
          "</div>" +
          "<div class=\"start-body\">" +
            "<div class=\"grid two\">" +
              "<label>" +
                "<div class=\"label\">Имя бойца</div>" +
                "<input id=\"careerName\" value=\"Влад\" maxlength=\"32\">" +
              "</label>" +
              "<label>" +
                "<div class=\"label\">Страна</div>" +
                "<select id=\"careerCountry\">" + countryOptions + "</select>" +
              "</label>" +
              "<label>" +
                "<div class=\"label\">Стартовый путь</div>" +
                "<select id=\"careerTrack\">" +
                  "<option value=\"amateur\" selected>Любители</option>" +
                  "<option value=\"street\">Улица</option>" +
                  "<option value=\"pro\">Профи</option>" +
                "</select>" +
              "</label>" +
            "</div>" +
            "<div class=\"row\" style=\"margin-top:18px\">" +
              "<button class=\"primary\" data-action=\"create-career\">Начать карьеру</button>" +
            "</div>" +
            "<div class=\"footer-note\">Сейчас проект держится на чистом ядре. Глубокие системы вернём слоями после стабилизации.</div>" +
          "</div>" +
        "</div>" +
      "</section>";
  }

  function renderHeader() {
    var country = findCountry(state.player.countryId);
    var track = findTrack(state.player.trackId);

    return "<header class=\"topbar\">" +
      "<div class=\"brand\">" +
        "<div class=\"logo\">FS</div>" +
        "<div>" +
          "<h1>Fight Simulator</h1>" +
          "<p>Неделя " + state.week + " · " + escapeHtml(country.label) + " · " + escapeHtml(track.label) + "</p>" +
        "</div>" +
      "</div>" +
      "<div class=\"toolbar\">" +
        "<button data-action=\"next-week\">Следующая неделя</button>" +
        "<button class=\"danger\" data-action=\"reset-career\">Сбросить карьеру</button>" +
      "</div>" +
    "</header>";
  }

  function renderSidebar() {
    var player = state.player;
    var countryOptions = COUNTRIES.map(function (country) {
      return "<option value=\"" + escapeHtml(country.id) + "\"" + (country.id === player.countryId ? " selected" : "") + ">" + escapeHtml(country.label) + "</option>";
    }).join("");
    var trackOptions = Object.keys(TRACKS).map(function (trackId) {
      return "<option value=\"" + escapeHtml(trackId) + "\"" + (trackId === player.trackId ? " selected" : "") + ">" + escapeHtml(TRACKS[trackId].label) + "</option>";
    }).join("");

    return "<aside class=\"panel stack\">" +
      "<div>" +
        "<div class=\"label\">Боец</div>" +
        "<h2>" + escapeHtml(player.name) + "</h2>" +
        "<div class=\"muted small\">" + escapeHtml(findCountry(player.countryId).label) + " · " + escapeHtml(findTrack(player.trackId).label) + "</div>" +
      "</div>" +
      "<div class=\"grid two\">" +
        "<div class=\"stat-card\"><div class=\"label\">Неделя</div><div class=\"value\">" + state.week + "</div></div>" +
        "<div class=\"stat-card\"><div class=\"label\">Рейтинг</div><div class=\"value\">" + statAverage(player.stats) + "</div></div>" +
        "<div class=\"stat-card\"><div class=\"label\">Рекорд</div><div class=\"value\" style=\"font-size:18px\">" + escapeHtml(recordText(player.record)) + "</div></div>" +
        "<div class=\"stat-card\"><div class=\"label\">Сумма</div><div class=\"value\">" + statTotal(player.stats) + "</div></div>" +
      "</div>" +
      "<div class=\"skills\">" +
        "<div class=\"label\">Навыки</div>" +
        renderSkillRow("Сила", player.stats.power) +
        renderSkillRow("Техника", player.stats.technique) +
        renderSkillRow("Скорость", player.stats.speed) +
        renderSkillRow("Выносливость", player.stats.stamina) +
        renderSkillRow("Защита", player.stats.defense) +
      "</div>" +
      "<label><div class=\"label\">Страна</div><select data-action=\"set-country\">" + countryOptions + "</select></label>" +
      "<label><div class=\"label\">Путь</div><select data-action=\"set-track\">" + trackOptions + "</select></label>" +
      "<button class=\"primary\" data-action=\"train-week\">Тренировка</button>" +
    "</aside>";
  }

  function renderSkillRow(label, value) {
    return "<div class=\"skill-row\"><span>" + escapeHtml(label) + "</span><strong>" + value + "</strong></div>";
  }

  function renderTabs() {
    var tabs = [
      ["fights", "Бои"],
      ["people", "Люди"],
      ["ranking", "Рейтинг"]
    ];

    return "<div class=\"tabs\">" + tabs.map(function (tab) {
      return "<button class=\"" + (state.selectedTab === tab[0] ? "active" : "") + "\" data-tab=\"" + tab[0] + "\">" + tab[1] + "</button>";
    }).join("") + "</div>";
  }

  function renderFightsTab() {
    return "<div class=\"offer-list\">" + state.offers.map(function (offer) {
      var opponent = getFighterById(offer.opponentId);

      return "<div class=\"offer\">" +
        "<div>" +
          "<div class=\"offer-title\">" + escapeHtml(offer.label) + "</div>" +
          "<div class=\"muted\">Соперник: <button class=\"small-btn\" data-fighter=\"" + escapeHtml(opponent.id) + "\">" + escapeHtml(opponent.name) + "</button></div>" +
          "<div class=\"pills\">" +
            "<span class=\"pill red\">" + escapeHtml(findTrack(state.player.trackId).label) + "</span>" +
            "<span class=\"pill\">" + offer.rounds + " раунда</span>" +
            "<span class=\"pill gold\">$" + offer.purse + "</span>" +
            "<span class=\"pill\">Рейтинг " + statAverage(opponent.stats) + "</span>" +
          "</div>" +
        "</div>" +
        "<button class=\"primary\" data-fight=\"" + escapeHtml(offer.id) + "\">Провести бой</button>" +
      "</div>";
    }).join("") + "</div>";
  }

  function renderPeopleTab() {
    return "<div class=\"content-card\">" +
      "<h3>Знакомые люди</h3>" +
      "<div class=\"muted small\" style=\"margin-bottom:12px\">Пока только список. Без шкал и действий.</div>" +
      "<div class=\"people-list\">" + state.people.map(function (person) {
        return "<div class=\"split-row\">" +
          "<div>" +
            "<div class=\"name-line\">" + escapeHtml(person.name) + "</div>" +
            "<div class=\"muted small\">" + escapeHtml(person.note) + "</div>" +
          "</div>" +
          "<span class=\"pill\">" + escapeHtml(PEOPLE_ROLES[person.role] || person.role) + "</span>" +
        "</div>";
      }).join("") + "</div>" +
    "</div>";
  }

  function renderRankingFilters() {
    return "<div class=\"filters\">" +
      "<div class=\"filter-group\"><span class=\"filter-title\">Страна</span>" +
        COUNTRIES.map(function (country) {
          return "<button class=\"small-btn " + (state.rankingCountryId === country.id ? "active" : "") + "\" data-ranking-country=\"" + country.id + "\">" + escapeHtml(country.label) + "</button>";
        }).join("") +
      "</div>" +
      "<div class=\"filter-group\"><span class=\"filter-title\">Путь</span>" +
        Object.keys(TRACKS).map(function (trackId) {
          return "<button class=\"small-btn " + (state.rankingTrackId === trackId ? "active" : "") + "\" data-ranking-track=\"" + trackId + "\">" + escapeHtml(TRACKS[trackId].label) + "</button>";
        }).join("") +
      "</div>" +
    "</div>";
  }

  function renderRankingTab() {
    var list = rankingList().slice(0, 18);

    return "<div class=\"content-card\">" +
      "<h3>Рейтинг</h3>" +
      renderRankingFilters() +
      "<div class=\"ranking-list\">" + list.map(function (fighter, index) {
        return "<div class=\"split-row\">" +
          "<div>" +
            "<div class=\"name-line\">#" + (index + 1) + " <button class=\"small-btn\" data-fighter=\"" + escapeHtml(fighter.id) + "\">" + escapeHtml(fighter.name) + "</button>" + (fighter.isPlayer ? " <span class=\"pill green\">ты</span>" : "") + "</div>" +
            "<div class=\"muted small\">" + escapeHtml(recordText(fighter.record)) + "</div>" +
          "</div>" +
          "<span class=\"pill gold\">Рейтинг " + statAverage(fighter.stats) + "</span>" +
        "</div>";
      }).join("") + "</div>" +
    "</div>";
  }

  function renderMain() {
    var content;

    if (state.selectedTab === "people") {
      content = renderPeopleTab();
    } else if (state.selectedTab === "ranking") {
      content = renderRankingTab();
    } else {
      content = renderFightsTab();
    }

    return "<section class=\"panel\">" +
      renderTabs() +
      "<div class=\"feed\">" + escapeHtml(state.feed || "Готово.") + "</div>" +
      content +
    "</section>";
  }

  function renderModal() {
    var modal = state.modal;
    var fighter;

    if (!modal) {
      return "";
    }

    if (modal.type === "fightResult") {
      return "<div class=\"modal-backdrop\">" +
        "<div class=\"modal\">" +
          "<div class=\"modal-head\"><h2>Результат боя</h2></div>" +
          "<div class=\"modal-body\">" +
            "<div class=\"big-result " + resultClass(modal.result) + "\">" + escapeHtml(modal.result) + "</div>" +
            "<div class=\"muted\">Неделя " + modal.week + " · соперник: " + escapeHtml(modal.opponentName) + "</div>" +
            "<div class=\"pills\">" +
              "<span class=\"pill\">Метод: " + escapeHtml(modal.method) + "</span>" +
              "<span class=\"pill gold\">Гонорар $" + modal.purse + "</span>" +
              "<span class=\"pill\">Твой рейтинг " + modal.playerRating + "</span>" +
              "<span class=\"pill\">Рейтинг соперника " + modal.opponentRating + "</span>" +
            "</div>" +
          "</div>" +
          "<div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Продолжить</button></div>" +
        "</div>" +
      "</div>";
    }

    if (modal.type === "fighter") {
      fighter = getFighterById(modal.fighterId);

      if (!fighter) {
        return "";
      }

      return "<div class=\"modal-backdrop\">" +
        "<div class=\"modal\">" +
          "<div class=\"modal-head\"><h2>" + escapeHtml(fighter.name) + "</h2><div class=\"muted small\">" + escapeHtml(findCountry(fighter.countryId).label) + " · " + escapeHtml(findTrack(fighter.trackId).label) + "</div></div>" +
          "<div class=\"modal-body\">" +
            "<div class=\"grid two\">" +
              "<div class=\"stat-card\"><div class=\"label\">Рейтинг</div><div class=\"value\">" + statAverage(fighter.stats) + "</div></div>" +
              "<div class=\"stat-card\"><div class=\"label\">Рекорд</div><div class=\"value\" style=\"font-size:18px\">" + escapeHtml(recordText(fighter.record)) + "</div></div>" +
            "</div>" +
            "<div class=\"skills\" style=\"margin-top:12px\">" +
              "<div class=\"label\">Навыки</div>" +
              renderSkillRow("Сила", fighter.stats.power) +
              renderSkillRow("Техника", fighter.stats.technique) +
              renderSkillRow("Скорость", fighter.stats.speed) +
              renderSkillRow("Выносливость", fighter.stats.stamina) +
              renderSkillRow("Защита", fighter.stats.defense) +
            "</div>" +
          "</div>" +
          "<div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div>" +
        "</div>" +
      "</div>";
    }

    return "";
  }

  function renderDashboard() {
    app.innerHTML =
      renderHeader() +
      "<div class=\"layout\">" +
        renderSidebar() +
        renderMain() +
      "</div>" +
      renderModal();
  }

  function render() {
    if (!state || !state.player) {
      renderStartScreen();
      return;
    }

    if (!state.rankingCountryId) {
      state.rankingCountryId = state.player.countryId;
    }

    if (!state.rankingTrackId) {
      state.rankingTrackId = state.player.trackId;
    }

    if (!state.offers || state.offers.length !== 3) {
      refreshOffers();
      saveState();
    }

    renderDashboard();
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("button");

    if (!button) {
      return;
    }

    if (button.dataset.action === "create-career") {
      createCareer({
        name: document.getElementById("careerName").value.trim(),
        countryId: document.getElementById("careerCountry").value,
        trackId: document.getElementById("careerTrack").value
      });
      return;
    }

    if (!state) {
      return;
    }

    if (button.dataset.action === "next-week") {
      nextWeek();
    } else if (button.dataset.action === "train-week") {
      trainWeek();
    } else if (button.dataset.action === "reset-career") {
      resetCareer();
    } else if (button.dataset.action === "close-modal") {
      closeModal();
    } else if (button.dataset.tab) {
      state.selectedTab = button.dataset.tab;
      saveState();
      render();
    } else if (button.dataset.fight) {
      resolveFight(button.dataset.fight);
    } else if (button.dataset.fighter) {
      openFighterModal(button.dataset.fighter);
    } else if (button.dataset.rankingCountry) {
      state.rankingCountryId = button.dataset.rankingCountry;
      saveState();
      render();
    } else if (button.dataset.rankingTrack) {
      state.rankingTrackId = button.dataset.rankingTrack;
      saveState();
      render();
    }
  });

  document.addEventListener("change", function (event) {
    var target = event.target;

    if (!state || !target || !target.dataset) {
      return;
    }

    if (target.dataset.action === "set-country") {
      setCountry(target.value);
    } else if (target.dataset.action === "set-track") {
      setTrack(target.value);
    }
  });

  render();
}());