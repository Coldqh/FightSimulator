(function () {
  "use strict";

  window.FS = window.FS || {};

  var Data = window.FS.Data;
  var U = window.FS.Utils;
  var State = window.FS.State;
  var Fight = window.FS.Fight;

  function renderSkillRow(label, value) {
    return "<div class=\"skill-row\"><span>" + U.escapeHtml(label) + "</span><strong>" + value + "</strong></div>";
  }

  function option(value, label, selectedValue) {
    return "<option value=\"" + U.escapeHtml(value) + "\"" + (value === selectedValue ? " selected" : "") + ">" + U.escapeHtml(label) + "</option>";
  }

  function renderStartScreen() {
    var countryOptions = Data.countries.map(function (country) {
      return option(country.id, country.label, "russia");
    }).join("");
    var weightOptions = Data.weightClasses.map(function (weightClass) {
      return option(weightClass.id, weightClass.label + " · " + weightClass.min + "-" + weightClass.max + " кг", "welter");
    }).join("");
    var stanceOptions = Data.stances.map(function (stance) {
      return option(stance.id, stance.label, "orthodox");
    }).join("");

    return "<section class=\"start-screen\">" +
      "<div class=\"start-card\">" +
        "<div class=\"start-head\">" +
          "<div class=\"brand\">" +
            "<div class=\"logo\">FS</div>" +
            "<div>" +
              "<h1>Fight Simulator</h1>" +
              "<div class=\"pills\" style=\"margin-top:8px\"><span class=\"pill gold\">Версия " + U.escapeHtml(Data.appVersion) + "</span></div>" +
            "</div>" +
          "</div>" +
          "<div class=\"ring-line\"></div>" +
        "</div>" +
        "<div class=\"start-body\">" +
          "<div class=\"grid two\">" +
            "<label><div class=\"label\">Имя бойца</div><input id=\"careerName\" value=\"Влад\" maxlength=\"32\"></label>" +
            "<label><div class=\"label\">Возраст</div><input id=\"careerAge\" type=\"number\" min=\"16\" max=\"40\" value=\"18\"></label>" +
            "<label><div class=\"label\">Страна</div><select id=\"careerCountry\">" + countryOptions + "</select></label>" +
            "<label><div class=\"label\">Стартовый путь</div><select id=\"careerTrack\"><option value=\"amateur\" selected>Любители</option><option value=\"street\">Улица</option><option value=\"pro\">Профи</option></select></label>" +
            "<label><div class=\"label\">Весовая категория</div><select id=\"careerWeightClass\">" + weightOptions + "</select></label>" +
            "<label><div class=\"label\">Стойка</div><select id=\"careerStance\">" + stanceOptions + "</select></label>" +
          "</div>" +
          "<div class=\"row\" style=\"margin-top:18px\"><button class=\"primary\" data-action=\"create-career\">Начать карьеру</button></div>" +
        "</div>" +
      "</div>" +
    "</section>";
  }

  function renderHeader(state) {
    var p = State.player(state);
    return "<header class=\"topbar\">" +
      "<div class=\"brand\"><div class=\"logo\">FS</div><div><h1>Fight Simulator</h1>" +
      "<p>Неделя " + state.week + " · " + U.escapeHtml(U.findCountry(p.countryId).label) + " · " + U.escapeHtml(U.findTrack(p.trackId).label) + " · " + U.escapeHtml(U.findWeightClass(p.weightClassId).label) + "</p></div></div>" +
      "<div class=\"toolbar\"><button data-action=\"next-week\">Следующая неделя</button><button class=\"danger\" data-action=\"reset-career\">Сбросить</button></div>" +
    "</header>";
  }

  function renderSidebar(state) {
    var p = State.player(state);
    var progress = State.pathProgress(state, p);

    return "<aside class=\"panel stack\">" +
      "<div><div class=\"label\">Боец</div><h2>" + U.escapeHtml(p.name) + "</h2><div class=\"muted small\">" + U.escapeHtml(U.findCountry(p.countryId).label) + " · " + U.escapeHtml(U.findTrack(p.trackId).label) + " · " + U.escapeHtml(U.findStance(p.stanceId).label) + "</div></div>" +
      "<div class=\"grid two\">" +
        "<div class=\"stat-card\"><div class=\"label\">Неделя</div><div class=\"value\">" + state.week + "</div></div>" +
        "<div class=\"stat-card\"><div class=\"label\">Рейтинг</div><div class=\"value\">" + U.statAverage(p.stats) + "</div></div>" +
        "<div class=\"stat-card\"><div class=\"label\">Рекорд</div><div class=\"value\" style=\"font-size:18px\">" + U.escapeHtml(U.recordText(p.record)) + "</div></div>" +
        "<div class=\"stat-card\"><div class=\"label\">Статус</div><div class=\"value\" style=\"font-size:18px\">" + U.escapeHtml(progress.badge || "—") + "</div></div>" +
      "</div>" +
      "<div class=\"skills\"><div class=\"label\">Навыки</div>" +
        renderSkillRow("Сила", p.stats.power) +
        renderSkillRow("Техника", p.stats.technique) +
        renderSkillRow("Скорость", p.stats.speed) +
        renderSkillRow("Выносливость", p.stats.stamina) +
        renderSkillRow("Защита", p.stats.defense) +
      "</div>" +
      "<button class=\"primary\" data-action=\"train-week\">Тренировка</button>" +
      "<div class=\"footer-note\">Версия " + U.escapeHtml(Data.appVersion) + "</div>" +
    "</aside>";
  }

  function renderTabs(state) {
    var tabs = [
      ["dashboard", "Обзор"],
      ["profile", "Профиль"],
      ["fights", "Бои"],
      ["training", "Тренировка"],
      ["ranking", "Рейтинг"],
      ["myclub", "Мой клуб"],
      ["clubs", "Клубы"],
      ["stories", "Истории"],
      ["world", "Любительский путь"],
      ["settings", "Настройки"],
      ["people", "Люди"]
    ];

    return "<div class=\"tabs\">" + tabs.map(function (tab) {
      return "<button class=\"" + (state.selectedTab === tab[0] ? "active" : "") + "\" data-tab=\"" + tab[0] + "\">" + tab[1] + "</button>";
    }).join("") + "</div>";
  }

  function renderFighterAwards(state, fighter) {
    var awards = State.getFighterAwards ? State.getFighterAwards(state, fighter) : (fighter.awards || []);

    if (!awards.length) {
      return "<div class=\"muted small\">Наград пока нет.</div>";
    }

    return awards.slice(0, 8).map(function (award) {
      return "<div class=\"split-row\"><span>🏅 " + U.escapeHtml(award.label) + "</span><strong>Неделя " + (award.week || "—") + "</strong></div>";
    }).join("");
  }

  function renderFighterTitles(state, fighter) {
    var titles = window.FS.Titles ? window.FS.Titles.fighterTitles(state, fighter.id) : [];
    if (!titles.length) {
      return "<div class=\"muted small\">Титулов пока нет.</div>";
    }
    return titles.map(function (title) {
      return "<div class=\"split-row\"><span>👑 " + U.escapeHtml(title.label) + "</span><strong>" + U.escapeHtml(U.findWeightClass(title.weightClassId).label) + "</strong></div>";
    }).join("");
  }

  function renderTrackedFighter(state) {
    var fighter = null;
    if (state.trackedFighterIds && state.trackedFighterIds.length) {
      fighter = U.getFighterById(state, state.trackedFighterIds[0]);
    }
    if (!fighter) {
      return "<div class=\"muted small\">Пока не выбран.</div>";
    }
    return "<div class=\"split-row\"><div><button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(fighter.id) + "\">" + U.escapeHtml(fighter.name) + "</button><div class=\"muted small\">" + U.escapeHtml(U.findTrack(fighter.trackId).label) + " · " + U.escapeHtml(U.recordText(fighter.record)) + "</div></div><span class=\"pill gold\">Рейтинг " + U.statAverage(fighter.stats) + "</span></div>";
  }

  function renderDashboardTab(state) {
    var p = State.player(state);
    var club = window.FS.Clubs ? window.FS.Clubs.playerClub(state) : null;
    var progress = State.pathProgress(state, p);

    return "<div class=\"grid two\">" +
      "<div class=\"content-card\"><h3>Текущее положение</h3>" +
        "<div class=\"split-row\"><span>Путь</span><strong>" + U.escapeHtml(U.findTrack(p.trackId).label) + "</strong></div>" +
        "<div class=\"split-row\"><span>Вес</span><strong>" + (p.trackId === "street" ? "Без весовых категорий" : U.escapeHtml(U.findWeightClass(p.weightClassId).label)) + "</strong></div>" +
        "<div class=\"split-row\"><span>Клуб</span><strong>" + U.escapeHtml(club ? club.name : "Без клуба") + "</strong></div>" +
        "<div class=\"split-row\"><span>Рекорд</span><strong>" + U.escapeHtml(U.recordText(p.record)) + "</strong></div>" +
        "<div class=\"split-row\"><span>Очки прокачки</span><strong>" + (p.trainingPoints || 0) + "</strong></div>" +
      "</div>" +
      "<div class=\"content-card\"><h3>" + U.escapeHtml(progress.title) + "</h3>" +
        progress.lines.map(function (line) {
          return "<div class=\"split-row\"><span>" + U.escapeHtml(line) + "</span></div>";
        }).join("") +
      "</div>" +
    "</div>";
  }

  function renderProfileTab(state) {
    var p = State.player(state);
    return "<div class=\"grid two\">" +
      "<div class=\"content-card\"><h3>Паспорт бойца</h3>" +
        "<div class=\"split-row\"><span>Имя</span><strong>" + U.escapeHtml(p.name) + "</strong></div>" +
        "<div class=\"split-row\"><span>Возраст</span><strong>" + p.age + "</strong></div>" +
        "<div class=\"split-row\"><span>Страна</span><strong>" + U.escapeHtml(U.findCountry(p.countryId).label) + "</strong></div>" +
        "<div class=\"split-row\"><span>Вес</span><strong>" + U.escapeHtml(U.formatWeightClass(p.weightClassId)) + "</strong></div>" +
        "<div class=\"split-row\"><span>Стойка</span><strong>" + U.escapeHtml(U.findStance(p.stanceId).label) + "</strong></div>" +
      "</div>" +
      "<div class=\"content-card\"><h3>" + (p.trackId === "amateur" ? "Награды" : "Титулы") + "</h3>" + (p.trackId === "amateur" ? renderFighterAwards(state, p) : renderFighterTitles(state, p)) + "</div>" +
    "</div>";
  }

  function renderCareerLog(fighter, limit) {
    if (!fighter.careerLog || !fighter.careerLog.length) {
      return "<div class=\"muted small\">Пока без заметных событий.</div>";
    }
    return fighter.careerLog.slice(0, limit || 8).map(function (entry) {
      return "<div class=\"split-row\"><span>Неделя " + entry.week + "</span><strong>" + U.escapeHtml(entry.text) + "</strong></div>";
    }).join("");
  }

  function renderFightsTab(state) {
    return "<div class=\"offer-list\">" + state.offers.map(function (offer) {
      var opponent = U.getFighterById(state, offer.opponentId);
      var difficulty = U.findDifficulty(offer.difficultyId);
      var preview = Fight.buildFightPreview(state, offer.id);

      return "<div class=\"offer\"><div><div class=\"offer-title\">" + U.escapeHtml(offer.label) + "</div>" +
        "<div class=\"muted\">Соперник: <button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(opponent.id) + "\">" + U.escapeHtml(opponent.name) + "</button></div>" +
        "<div class=\"pills\"><span class=\"pill red\">" + U.escapeHtml(U.findTrack(opponent.trackId).label) + "</span><span class=\"pill\">" + offer.rounds + " раунда</span><span class=\"pill gold\">$" + offer.purse + "</span><span class=\"pill\">" + U.escapeHtml(difficulty.label) + "</span><span class=\"pill\">" + U.escapeHtml(offer.opponentTier || preview.opponentTier || "Боец") + "</span><span class=\"pill blue\">Шанс " + preview.winChance + "%</span><span class=\"pill\">" + U.escapeHtml(preview.expectation) + "</span></div></div>" +
        "<button class=\"primary\" data-preview-fight=\"" + U.escapeHtml(offer.id) + "\">Открыть бой</button></div>";
    }).join("") + "</div>";
  }

  function renderTrainingTab(state) {
    var p = State.player(state);
    return "<div class=\"content-card\"><h3>Прокачка</h3><div class=\"split-row\"><span>Очки прокачки</span><strong>" + (p.trainingPoints || 0) + "</strong></div><div class=\"muted small\">Кнопка “Тренировка” слева даёт очки. Кнопки ниже тратят 1 очко на выбранный навык.</div><div class=\"grid three\" style=\"margin-top:12px\">" +
      Data.statKeys.map(function (stat) {
        return "<button data-train-stat=\"" + U.escapeHtml(stat.id) + "\">+ " + U.escapeHtml(stat.label) + "</button>";
      }).join("") +
    "</div></div>";
  }

  function renderRankingFilters(state) {
    var countryGroup = state.rankingTrackId === "pro" ? "<div class=\"filter-group\"><span class=\"filter-title\">Страна</span><span class=\"pill gold\">Мировой рейтинг</span></div>" :
      "<div class=\"filter-group\"><span class=\"filter-title\">Страна</span>" +
      Data.countries.map(function (country) {
        return "<button class=\"small-btn " + (state.rankingCountryId === country.id ? "active" : "") + "\" data-ranking-country=\"" + country.id + "\">" + U.escapeHtml(country.label) + "</button>";
      }).join("") +
      "</div>";

    var weightGroup = state.rankingTrackId === "street" ? "<div class=\"filter-group\"><span class=\"filter-title\">Вес</span><span class=\"pill gold\">Без весов</span></div>" :
      "<div class=\"filter-group\"><span class=\"filter-title\">Вес</span>" +
      Data.weightClasses.map(function (weightClass) {
        return "<button class=\"small-btn " + (state.rankingWeightClassId === weightClass.id ? "active" : "") + "\" data-ranking-weight=\"" + weightClass.id + "\">" + U.escapeHtml(weightClass.label) + "</button>";
      }).join("") +
      "</div>";

    return "<div class=\"filters\">" + countryGroup + "<div class=\"filter-group\"><span class=\"filter-title\">Путь</span>" +
      Object.keys(Data.tracks).map(function (trackId) {
        return "<button class=\"small-btn " + (state.rankingTrackId === trackId ? "active" : "") + "\" data-ranking-track=\"" + trackId + "\">" + U.escapeHtml(Data.tracks[trackId].label) + "</button>";
      }).join("") +
      "</div>" + weightGroup + "</div>";
  }

  function findChampionForRanking(state) {
    var key;
    var title;
    var targetCountry = state.rankingTrackId === "pro" ? "world" : state.rankingCountryId;

    if (!state.titles || state.rankingTrackId === "amateur") {
      return null;
    }

    for (key in state.titles) {
      if (Object.prototype.hasOwnProperty.call(state.titles, key)) {
        title = state.titles[key];
        if (title.countryId === targetCountry &&
            title.trackId === state.rankingTrackId &&
            title.weightClassId === state.rankingWeightClassId) {
          return {
            fighter: U.getFighterById(state, title.championId),
            title: title
          };
        }
      }
    }

    return null;
  }

  function renderRankingTab(state) {
    var rankingCountryId = state.rankingTrackId === "pro" ? "world" : state.rankingCountryId;
    var list = State.ranking(state, rankingCountryId, state.rankingTrackId, state.rankingTrackId === "street" ? "" : state.rankingWeightClassId).slice(0, 40);
    var champions = [];
    var contenders;
    var titleMap = {};
    var key;

    if (state.titles && state.rankingTrackId !== "amateur") {
      for (key in state.titles) {
        if (Object.prototype.hasOwnProperty.call(state.titles, key)) {
          var title = state.titles[key];
          if (title.trackId === state.rankingTrackId &&
              (state.rankingTrackId === "street" ? title.countryId === state.rankingCountryId : title.countryId === "world") &&
              (state.rankingTrackId === "street" || title.weightClassId === state.rankingWeightClassId)) {
            titleMap[title.championId] = titleMap[title.championId] || [];
            titleMap[title.championId].push(title);
          }
        }
      }
    }

    champions = list.filter(function (fighter) {
      return !!titleMap[fighter.id];
    });

    contenders = list.filter(function (fighter) {
      return !titleMap[fighter.id];
    });

    function fighterSubline(fighter) {
      var weightText = fighter.trackId === "street" ? "без весовой" : U.escapeHtml(U.findWeightClass(fighter.weightClassId).label);
      var base = U.escapeHtml(U.recordText(fighter.record)) + " · " + weightText;
      if (fighter.trackId === "amateur") {
        return base + " · " + U.escapeHtml(State.rankForFighter ? State.rankForFighter(fighter).label : "Любитель");
      }
      if (fighter.trackId === "pro") {
        return base + " · мировой рейтинг";
      }
      return base;
    }

    function crowns(fighter) {
      if (!titleMap[fighter.id]) {
        return "";
      }
      return titleMap[fighter.id].map(function (title) {
        return "👑" + (title.bodyId ? title.bodyId.toUpperCase() : "");
      }).join(" ");
    }

    return "<div class=\"content-card\"><h3>Рейтинг" + (state.rankingTrackId === "pro" ? " · мир" : "") + "</h3>" + renderRankingFilters(state) + "<div class=\"ranking-list\">" +
      champions.map(function (fighter) {
        return "<div class=\"split-row\"><div><div class=\"name-line\">" + crowns(fighter) + " <button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(fighter.id) + "\">" + U.escapeHtml(fighter.name) + "</button>" + (fighter.isPlayer ? " <span class=\"pill green\">ты</span>" : "") + "</div><div class=\"muted small\">" + fighterSubline(fighter) + "</div></div><span class=\"pill gold\">Чемпион · " + U.statAverage(fighter.stats) + "</span></div>";
      }).join("") +
      contenders.slice(0, 24).map(function (fighter, index) {
        return "<div class=\"split-row\"><div><div class=\"name-line\">#" + (index + 1) + " <button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(fighter.id) + "\">" + U.escapeHtml(fighter.name) + "</button>" + (fighter.isPlayer ? " <span class=\"pill green\">ты</span>" : "") + "</div><div class=\"muted small\">" + fighterSubline(fighter) + "</div></div><span class=\"pill gold\">Рейтинг " + U.statAverage(fighter.stats) + "</span></div>";
      }).join("") + "</div></div>";
  }

  function renderMyClubTab(state) {
    var club = window.FS.Clubs ? window.FS.Clubs.playerClub(state) : null;
    var roster = club ? window.FS.Clubs.clubRoster(state, club.id) : [];

    if (!club) {
      return "<div class=\"content-card\"><h3>Мой клуб</h3><div class=\"muted small\">Клуб пока не найден.</div></div>";
    }

    return "<div class=\"content-card\"><h3>Мой клуб: " + U.escapeHtml(club.name) + "</h3><div class=\"muted small\" style=\"margin-bottom:12px\">" + U.escapeHtml(U.findCountry(club.countryId).label) + " · уровень " + club.level + "</div>" +
      roster.slice(0, 16).map(function (fighter) {
        return "<div class=\"split-row\"><div><button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(fighter.id) + "\">" + U.escapeHtml(fighter.name) + "</button>" + (fighter.isPlayer ? " <span class=\"pill green\">ты</span>" : "") + "<div class=\"muted small\">" + U.escapeHtml(U.findTrack(fighter.trackId).label) + " · " + U.escapeHtml(U.recordText(fighter.record)) + "</div></div><span class=\"pill gold\">Рейтинг " + U.statAverage(fighter.stats) + "</span></div>";
      }).join("") + "</div>";
  }

  function renderClubCountryFilters(state) {
    return "<div class=\"filter-group\"><span class=\"filter-title\">Страна</span>" + Data.countries.map(function (country) {
      return "<button class=\"small-btn " + (state.rankingCountryId === country.id ? "active" : "") + "\" data-ranking-country=\"" + country.id + "\">" + U.escapeHtml(country.label) + "</button>";
    }).join("") + "</div>";
  }

  function renderClubsTab(state) {
    var clubs = (state.clubs || []).filter(function (club) {
      return club.countryId === state.rankingCountryId;
    });

    return "<div class=\"content-card\"><h3>Клубы</h3><div class=\"filters\">" + renderClubCountryFilters(state) + "</div><div class=\"grid two\">" + clubs.map(function (club) {
      return "<div class=\"content-card\"><h3>" + U.escapeHtml(club.name) + "</h3><div class=\"muted small\">" + U.escapeHtml(U.findCountry(club.countryId).label) + " · уровень " + club.level + "</div><div class=\"row\" style=\"margin-top:10px\"><button class=\"small-btn\" data-club=\"" + U.escapeHtml(club.id) + "\">Открыть карточку</button><button class=\"small-btn\" data-join-club=\"" + U.escapeHtml(club.id) + "\">Перейти</button></div></div>";
    }).join("") + "</div></div>";
  }

  function renderStoriesTab(state) {
    var stories = state.world.stories || [];
    if (!stories.length) {
      return "<div class=\"content-card\"><h3>Истории</h3><div class=\"muted small\">Историй пока нет. Дай миру несколько недель.</div></div>";
    }
    return "<div class=\"content-card\"><h3>Истории мира</h3>" + stories.slice(0, 30).map(function (story) {
      return "<div class=\"split-row\"><div><div class=\"name-line\">Неделя " + story.week + " · " + U.escapeHtml(story.fighterName) + "</div><div class=\"muted small\">" + U.escapeHtml(story.text) + "</div></div><span class=\"pill blue\">" + U.escapeHtml(story.tag) + "</span></div>";
    }).join("") + "</div>";
  }

  function renderWorldTab(state) {
    var p = State.player(state);
    var team = state.world.teamsByCountry[p.countryId] || { main: [], reserve: [] };
    var progress = State.pathProgress(state, p);
    var comps = window.FS.Amateur ? window.FS.Amateur.availableCompetitions(state) : [];
    var objective = window.FS.Amateur ? window.FS.Amateur.objectiveSummary(state) : { title: "Цель", text: "Нет данных." };
    var summary = window.FS.Amateur ? window.FS.Amateur.worldSummary(state) : { points: 0, medals: 0, completed: 0, available: 0 };

    function renderTeam(ids) {
      if (!ids.length) {
        return "<div class=\"muted small\">Пусто.</div>";
      }
      return ids.map(function (id) {
        var fighter = U.getFighterById(state, id);
        return fighter ? "<div class=\"split-row\"><div><button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(id) + "\">" + U.escapeHtml(fighter.name) + "</button><div class=\"muted small\">" + U.escapeHtml(U.recordText(fighter.record)) + " · " + U.escapeHtml(U.findWeightClass(fighter.weightClassId).label) + "</div></div><span class=\"pill gold\">Рейтинг " + U.statAverage(fighter.stats) + "</span></div>" : "";
      }).join("");
    }

    function renderCompetition(comp) {
      return "<div class=\"split-row\"><div><div class=\"name-line\">" + U.escapeHtml(comp.label) + (comp.completed ? " <span class=\"pill green\">пройдено</span>" : "") + "</div><div class=\"muted small\">Рейтинг " + comp.minRating + "+ · награда +" + comp.rewardRating + " · " + U.escapeHtml(comp.reason) + "</div></div><span>" + (comp.available ? "<button class=\"small-btn primary\" data-amateur-competition=\"" + U.escapeHtml(comp.id) + "\">Заявиться</button>" : "<span class=\"pill\">закрыто</span>") + "</span></div>";
    }

    return "<div class=\"grid two\">" +
      "<div class=\"content-card\"><h3>Любительский путь</h3>" +
        progress.lines.map(function (line) {
          return "<div class=\"split-row\"><span>" + U.escapeHtml(line) + "</span></div>";
        }).join("") +
        "<div class=\"pills\"><span class=\"pill gold\">Очки: " + summary.points + "</span><span class=\"pill green\">Медали: " + summary.medals + "</span><span class=\"pill blue\">Доступно: " + summary.available + "</span></div>" +
      "</div>" +
      "<div class=\"content-card\"><h3>" + U.escapeHtml(objective.title) + "</h3><div class=\"muted small\">" + U.escapeHtml(objective.text) + "</div></div>" +
      "<div class=\"content-card\"><h3>Турнирная лестница</h3>" + comps.map(renderCompetition).join("") + "</div>" +
      "<div class=\"content-card\"><h3>Сборная " + U.escapeHtml(U.findCountry(p.countryId).label) + "</h3><div class=\"label\">Состав</div>" + renderTeam(team.main) + "<div class=\"label\" style=\"margin-top:14px\">Резерв</div>" + renderTeam(team.reserve) + "</div>" +
    "</div>";
  }

  function renderPeopleTab(state) {
    return "<div class=\"content-card\"><h3>Знакомые люди</h3><div class=\"people-list\">" + state.people.map(function (person) {
      return "<div class=\"split-row\"><div><div class=\"name-line\">" + U.escapeHtml(person.name) + "</div><div class=\"muted small\">" + U.escapeHtml(person.note) + "</div></div><span class=\"pill\">" + U.escapeHtml(Data.peopleRoles[person.role] || person.role) + "</span></div>";
    }).join("") + "</div></div>";
  }

  function renderSettingsTab(state) {
    var p = State.player(state);
    var countryOptions = Data.countries.map(function (country) {
      return option(country.id, country.label, p.countryId);
    }).join("");
    var trackOptions = Object.keys(Data.tracks).map(function (trackId) {
      return option(trackId, Data.tracks[trackId].label, p.trackId);
    }).join("");
    var weightOptions = Data.weightClasses.map(function (weightClass) {
      return option(weightClass.id, weightClass.label, p.weightClassId);
    }).join("");

    return "<div class=\"grid two\">" +
      "<div class=\"content-card\"><h3>Настройки карьеры</h3>" +
        "<label><div class=\"label\">Страна</div><select data-action=\"set-country\">" + countryOptions + "</select></label>" +
        "<label style=\"display:block;margin-top:12px\"><div class=\"label\">Путь</div><select data-action=\"set-track\">" + trackOptions + "</select></label>" +
        "<label style=\"display:block;margin-top:12px\"><div class=\"label\">Вес</div><select data-action=\"set-weight-class\">" + weightOptions + "</select></label>" +      "</div>" +
      "<div class=\"content-card\"><h3>Сохранение</h3>" +
        "<div class=\"row\"><button data-action=\"repair-save\">Починить сохранение</button><button data-action=\"world-audit\">Диагностика мира</button><button data-action=\"patch-notes\">Патч</button><button data-action=\"export-save\">Экспорт</button><button data-action=\"import-save\">Импорт</button></div>" +
        "<div class=\"footer-note\">Версия: " + U.escapeHtml(Data.appVersion) + "</div>" +
      "</div>" +
    "</div>";
  }

  function renderMain(state) {
    var content;
    if (state.selectedTab === "dashboard") { content = renderDashboardTab(state); }
    else if (state.selectedTab === "profile") { content = renderProfileTab(state); }
    else if (state.selectedTab === "fights") { content = renderFightsTab(state); }
    else if (state.selectedTab === "training") { content = renderTrainingTab(state); }
    else if (state.selectedTab === "ranking") { content = renderRankingTab(state); }
    else if (state.selectedTab === "myclub") { content = renderMyClubTab(state); }
    else if (state.selectedTab === "clubs") { content = renderClubsTab(state); }
    else if (state.selectedTab === "stories") { content = renderStoriesTab(state); }
    else if (state.selectedTab === "world") { content = renderWorldTab(state); }
    else if (state.selectedTab === "settings") { content = renderSettingsTab(state); }
    else { content = renderPeopleTab(state); }

    return "<section class=\"panel\">" + renderTabs(state) + "<div class=\"feed\">" + U.escapeHtml(state.feed || "Готово.") + "</div>" + content + "</section>";
  }

  function renderClubModal(state, club) {
    var roster = window.FS.Clubs.clubRoster(state, club.id).slice(0, 24);

    return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(club.name) + "</h2><div class=\"muted small\">" + U.escapeHtml(U.findCountry(club.countryId).label) + " · уровень " + club.level + "</div></div><div class=\"modal-body\">" +
      roster.map(function (fighter) {
        return "<div class=\"split-row\"><div><button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(fighter.id) + "\">" + U.escapeHtml(fighter.name) + "</button>" + (fighter.isPlayer ? " <span class=\"pill green\">ты</span>" : "") + "<div class=\"muted small\">" + U.escapeHtml(U.findTrack(fighter.trackId).label) + " · " + U.escapeHtml(U.recordText(fighter.record)) + "</div></div><span class=\"pill gold\">Рейтинг " + U.statAverage(fighter.stats) + "</span></div>";
      }).join("") +
      "</div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
  }

  function renderFighterModal(state, fighter) {
    var achievementTitle = fighter.trackId === "amateur" ? "Награды" : "Титулы";
    var achievementHtml = fighter.trackId === "amateur" ? renderFighterAwards(state, fighter) : renderFighterTitles(state, fighter);

    return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(fighter.name) + "</h2><div class=\"muted small\">" + U.escapeHtml(U.findCountry(fighter.countryId).label) + " · " + U.escapeHtml(U.findTrack(fighter.trackId).label) + " · " + U.escapeHtml(U.findWeightClass(fighter.weightClassId).label) + "</div></div><div class=\"modal-body\"><div class=\"grid two\"><div class=\"stat-card\"><div class=\"label\">Рейтинг</div><div class=\"value\">" + U.statAverage(fighter.stats) + "</div></div><div class=\"stat-card\"><div class=\"label\">Рекорд</div><div class=\"value\" style=\"font-size:18px\">" + U.escapeHtml(U.recordText(fighter.record)) + "</div></div></div><div class=\"skills\" style=\"margin-top:12px\"><div class=\"label\">Навыки</div>" + renderSkillRow("Сила", fighter.stats.power) + renderSkillRow("Техника", fighter.stats.technique) + renderSkillRow("Скорость", fighter.stats.speed) + renderSkillRow("Выносливость", fighter.stats.stamina) + renderSkillRow("Защита", fighter.stats.defense) + "</div><div class=\"content-card\" style=\"margin-top:12px\"><div class=\"label\">" + achievementTitle + "</div>" + achievementHtml + "</div><div class=\"content-card\" style=\"margin-top:12px\"><div class=\"label\">Карьера</div>" + renderCareerLog(fighter, 5) + "</div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
  }

  function renderModal(state) {
    var modal = state.modal;
    var fighter;
    var club;
    if (!modal) { return ""; }

    if (modal.type === "fighter") {
      fighter = U.getFighterById(state, modal.fighterId);
      return fighter ? renderFighterModal(state, fighter) : "";
    }

    if (modal.type === "club") {
      club = window.FS.Clubs.findClub(state, modal.clubId);
      return club ? renderClubModal(state, club) : "";
    }

    if (modal.type === "patchNotes") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Патч " + U.escapeHtml(Data.appVersion) + "</h2></div><div class=\"modal-body\"><div class=\"content-card\"><div class=\"label\">Главное</div><div class=\"muted small\">Любительская турнирная лестница, заявки на турниры, очки/медали, улучшенный подбор соперников и защита нормальных офферов от случайных чемпионов.</div></div><div class=\"content-card\" style=\"margin-top:12px\"><div class=\"label\">Архитектура</div><div class=\"muted small\">Добавлен отдельный модуль src/core/amateur.js. Старая логика боя и матчмейкинга не смешана с турнирами.</div></div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    if (modal.type === "worldAudit") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Диагностика мира</h2></div><div class=\"modal-body\"><div class=\"grid two\"><div class=\"stat-card\"><div class=\"label\">Бойцы</div><div class=\"value\">" + modal.report.fighters + "</div></div><div class=\"stat-card\"><div class=\"label\">Клубы</div><div class=\"value\">" + modal.report.clubs + "</div></div><div class=\"stat-card\"><div class=\"label\">Титулы</div><div class=\"value\">" + modal.report.titles + "</div></div><div class=\"stat-card\"><div class=\"label\">Офферы</div><div class=\"value\">" + modal.report.offers + "</div></div></div><div class=\"footer-note\">Рекорды для ремонта: " + modal.report.repairedRecords + ". Без клуба: " + modal.report.missingGym + ".</div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    if (modal.type === "saveExport") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Экспорт сохранения</h2></div><div class=\"modal-body\"><textarea readonly style=\"width:100%;min-height:260px;background:#101214;color:#f4f4f5;border:1px solid #343942;border-radius:12px;padding:12px\">" + U.escapeHtml(modal.payload) + "</textarea></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    if (modal.type === "titleChallengePreview") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Вызов чемпиону</h2><div class=\"muted small\">" + U.escapeHtml(modal.titleLabel) + " · " + U.escapeHtml(modal.weightClassLabel) + "</div></div><div class=\"modal-body\"><div class=\"grid two\"><div class=\"stat-card\"><div class=\"label\">Ты</div><div class=\"value\">" + modal.playerRating + "</div><div class=\"muted small\">" + U.escapeHtml(modal.playerRecord) + "</div></div><div class=\"stat-card\"><div class=\"label\">Чемпион</div><div class=\"value\">" + modal.championRating + "</div><div class=\"muted small\">" + U.escapeHtml(modal.championName) + " · " + U.escapeHtml(modal.championRecord) + "</div></div></div><div class=\"pills\"><span class=\"pill\">" + modal.rounds + " раунда</span><span class=\"pill gold\">$" + modal.purse + "</span><span class=\"pill blue\">Шанс " + modal.winChance + "%</span><span class=\"pill\">" + U.escapeHtml(modal.expectation) + "</span></div><div class=\"muted small\" style=\"margin-top:12px\">" + U.escapeHtml(modal.reason) + "</div></div><div class=\"modal-actions\"><button data-action=\"close-modal\">Отмена</button>" + (modal.eligible ? "<button class=\"primary\" data-accept-title-challenge=\"" + U.escapeHtml(modal.titleId) + "\">Бросить вызов</button>" : "") + "</div></div></div>";
    }

    if (modal.type === "fightPreview") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(modal.label) + "</h2><div class=\"muted small\">Предпросмотр боя · " + U.escapeHtml(modal.weightClassLabel) + "</div></div><div class=\"modal-body\"><div class=\"grid two\"><div class=\"stat-card\"><div class=\"label\">Ты</div><div class=\"value\">" + modal.playerRating + "</div><div class=\"muted small\">" + U.escapeHtml(modal.playerRecord) + "</div></div><div class=\"stat-card\"><div class=\"label\">Соперник</div><div class=\"value\">" + modal.opponentRating + "</div><div class=\"muted small\">" + U.escapeHtml(modal.opponentName) + " · " + U.escapeHtml(modal.opponentRecord) + "</div></div></div><div class=\"pills\"><span class=\"pill\">" + modal.rounds + " раунда</span><span class=\"pill gold\">$" + modal.purse + "</span><span class=\"pill blue\">Шанс " + modal.winChance + "%</span><span class=\"pill\">" + U.escapeHtml(modal.expectation) + "</span><span class=\"pill\">" + U.escapeHtml(modal.difficultyLabel) + "</span></div></div><div class=\"modal-actions\"><button data-action=\"close-modal\">Отмена</button><button class=\"primary\" data-accept-fight=\"" + U.escapeHtml(modal.offerId) + "\">Принять бой</button></div></div></div>";
    }

    if (modal.type === "fightResult") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Результат боя</h2></div><div class=\"modal-body\"><div class=\"big-result " + Fight.resultClass(modal.result) + "\">" + U.escapeHtml(modal.result) + "</div><div class=\"muted\">Неделя " + modal.week + " · соперник: " + U.escapeHtml(modal.opponentName) + "</div><div class=\"pills\"><span class=\"pill\">Метод: " + U.escapeHtml(modal.method) + "</span><span class=\"pill\">Счёт: " + U.escapeHtml(modal.scoreLine) + "</span><span class=\"pill gold\">Гонорар $" + modal.purse + "</span><span class=\"pill blue\">Шанс до боя " + modal.winChance + "%</span></div><div class=\"content-card\" style=\"margin-top:12px\"><div class=\"label\">Статистика</div><div class=\"muted small\">" + U.escapeHtml(modal.statsLine || "") + "</div></div><div class=\"content-card\" style=\"margin-top:12px\"><div class=\"label\">Раунды</div>" + (modal.roundLog || []).map(function (line) { return "<div class=\"muted small\">" + U.escapeHtml(line) + "</div>"; }).join("") + (modal.knockdown ? "<div class=\"pill red\" style=\"margin-top:10px\">Нокдаун: раунд " + modal.knockdown.round + "</div>" : "") + "</div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Продолжить</button></div></div></div>";
    }

    return "";
  }

  function renderDashboard(state) {
    return renderHeader(state) + "<div class=\"layout\">" + renderSidebar(state) + renderMain(state) + "</div>" + renderModal(state);
  }

  window.FS.Render = {
    start: renderStartScreen,
    dashboard: renderDashboard
  };
}());
