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

  function renderStartScreen() {
    var countryOptions = Data.countries.map(function (country) {
      return "<option value=\"" + U.escapeHtml(country.id) + "\">" + U.escapeHtml(country.label) + "</option>";
    }).join("");
    var weightOptions = Data.weightClasses.map(function (weightClass) {
      return "<option value=\"" + U.escapeHtml(weightClass.id) + "\"" + (weightClass.id === "welter" ? " selected" : "") + ">" + U.escapeHtml(weightClass.label + " · " + weightClass.min + "-" + weightClass.max + " кг") + "</option>";
    }).join("");
    var stanceOptions = Data.stances.map(function (stance) {
      return "<option value=\"" + U.escapeHtml(stance.id) + "\">" + U.escapeHtml(stance.label) + "</option>";
    }).join("");

    return "<section class=\"start-screen\">" +
      "<div class=\"start-card\">" +
        "<div class=\"start-head\">" +
          "<div class=\"brand\">" +
            "<div class=\"logo\">FS</div>" +
            "<div>" +
              "<h1>Fight Simulator</h1>" +
              "<p>Season Bundle 0.9.0: раунды, тактика, клубы, титулы и живые истории NPC в одном стабильном слое.</p>" +
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
          "<div class=\"footer-note\">Сборка использует только модульный runtime. Старый монолит не подключается.</div>" +
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
    var countryOptions = Data.countries.map(function (country) {
      return "<option value=\"" + U.escapeHtml(country.id) + "\"" + (country.id === p.countryId ? " selected" : "") + ">" + U.escapeHtml(country.label) + "</option>";
    }).join("");
    var trackOptions = Object.keys(Data.tracks).map(function (trackId) {
      return "<option value=\"" + U.escapeHtml(trackId) + "\"" + (trackId === p.trackId ? " selected" : "") + ">" + U.escapeHtml(Data.tracks[trackId].label) + "</option>";
    }).join("");
    var weightOptions = Data.weightClasses.map(function (weightClass) {
      return "<option value=\"" + U.escapeHtml(weightClass.id) + "\"" + (weightClass.id === p.weightClassId ? " selected" : "") + ">" + U.escapeHtml(weightClass.label) + "</option>";
    }).join("");
    var tacticOptions = Data.tactics.map(function (tactic) {
      return "<option value=\"" + U.escapeHtml(tactic.id) + "\"" + (tactic.id === state.selectedTacticId ? " selected" : "") + ">" + U.escapeHtml(tactic.label) + "</option>";
    }).join("");

    return "<aside class=\"panel stack\">" +
      "<div><div class=\"label\">Боец</div><h2>" + U.escapeHtml(p.name) + "</h2><div class=\"muted small\">" + U.escapeHtml(U.findCountry(p.countryId).label) + " · " + U.escapeHtml(U.findTrack(p.trackId).label) + " · " + U.escapeHtml(U.findStance(p.stanceId).label) + "</div></div>" +
      "<div class=\"grid two\">" +
        "<div class=\"stat-card\"><div class=\"label\">Неделя</div><div class=\"value\">" + state.week + "</div></div>" +
        "<div class=\"stat-card\"><div class=\"label\">Рейтинг</div><div class=\"value\">" + U.statAverage(p.stats) + "</div></div>" +
        "<div class=\"stat-card\"><div class=\"label\">Рекорд</div><div class=\"value\" style=\"font-size:18px\">" + U.escapeHtml(U.recordText(p.record)) + "</div></div>" +
        "<div class=\"stat-card\"><div class=\"label\">Титулы</div><div class=\"value\">" + (p.titles ? p.titles.length : 0) + "</div></div>" +
      "</div>" +
      "<div class=\"skills\"><div class=\"label\">Навыки</div>" +
        renderSkillRow("Сила", p.stats.power) + renderSkillRow("Техника", p.stats.technique) + renderSkillRow("Скорость", p.stats.speed) + renderSkillRow("Выносливость", p.stats.stamina) + renderSkillRow("Защита", p.stats.defense) +
      "</div>" +
      "<label><div class=\"label\">Страна</div><select data-action=\"set-country\">" + countryOptions + "</select></label>" +
      "<label><div class=\"label\">Путь</div><select data-action=\"set-track\">" + trackOptions + "</select></label>" +
      "<label><div class=\"label\">Вес</div><select data-action=\"set-weight-class\">" + weightOptions + "</select></label>" +
      "<label><div class=\"label\">Тактика боя</div><select data-action=\"set-tactic\">" + tacticOptions + "</select></label>" +
      "<button class=\"primary\" data-action=\"train-week\">Тренировка</button>" +
    "</aside>";
  }

  function renderTabs(state) {
    var tabs = [["dashboard", "Обзор"], ["profile", "Профиль"], ["fights", "Бои"], ["training", "Тренировка"], ["ranking", "Рейтинг"], ["clubs", "Клубы"], ["titles", "Титулы"], ["stories", "Истории"], ["world", "Мир"], ["people", "Люди"]];
    return "<div class=\"tabs\">" + tabs.map(function (tab) {
      return "<button class=\"" + (state.selectedTab === tab[0] ? "active" : "") + "\" data-tab=\"" + tab[0] + "\">" + tab[1] + "</button>";
    }).join("") + "</div>";
  }

  function renderDashboardTab(state) {
    var p = State.player(state);
    var club = window.FS.Clubs ? window.FS.Clubs.playerClub(state) : null;
    return "<div class=\"grid two\">" +
      "<div class=\"content-card\"><h3>Текущее положение</h3>" +
        "<div class=\"split-row\"><span>Путь</span><strong>" + U.escapeHtml(U.findTrack(p.trackId).label) + "</strong></div>" +
        "<div class=\"split-row\"><span>Вес</span><strong>" + U.escapeHtml(U.findWeightClass(p.weightClassId).label) + "</strong></div>" +
        "<div class=\"split-row\"><span>Клуб</span><strong>" + U.escapeHtml(club ? club.name : "Без клуба") + "</strong></div>" +
        "<div class=\"split-row\"><span>Рекорд</span><strong>" + U.escapeHtml(U.recordText(p.record)) + "</strong></div>" +
      "</div>" +
      "<div class=\"content-card\"><h3>Титулы</h3>" + renderFighterTitles(state, p) + "</div>" +
      "<div class=\"content-card\"><h3>Последние новости</h3>" + renderNewsList(state, 5) + "</div>" +
      "<div class=\"content-card\"><h3>Ближайшие бои</h3><div class=\"muted small\">3 предложения на текущем пути и весе.</div><div class=\"pills\"><span class=\"pill red\">3 боя</span><span class=\"pill\">" + U.escapeHtml(U.findTrack(p.trackId).label) + "</span><span class=\"pill gold\">" + U.escapeHtml(U.findWeightClass(p.weightClassId).label) + "</span></div></div>" +
    "</div>";
  }

  function renderFighterTitles(state, fighter) {
    var titles = window.FS.Titles ? window.FS.Titles.fighterTitles(state, fighter.id) : [];
    if (!titles.length) {
      return "<div class=\"muted small\">Титулов пока нет.</div>";
    }
    return titles.map(function (title) {
      return "<div class=\"split-row\"><span>" + U.escapeHtml(title.label) + "</span><strong>" + U.escapeHtml(U.findWeightClass(title.weightClassId).label) + "</strong></div>";
    }).join("");
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
      "<div class=\"content-card\"><h3>Карьера</h3>" + renderCareerLog(p, 10) + "</div>" +
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
      return "<div class=\"offer\"><div><div class=\"offer-title\">" + U.escapeHtml(offer.label) + "</div>" +
        "<div class=\"muted\">Соперник: <button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(opponent.id) + "\">" + U.escapeHtml(opponent.name) + "</button></div>" +
        "<div class=\"pills\"><span class=\"pill red\">" + U.escapeHtml(U.findTrack(opponent.trackId).label) + "</span><span class=\"pill\">" + offer.rounds + " раунда</span><span class=\"pill gold\">$" + offer.purse + "</span><span class=\"pill\">" + U.escapeHtml(difficulty.label) + "</span><span class=\"pill\">Рейтинг " + U.statAverage(opponent.stats) + "</span></div></div>" +
        "<button class=\"primary\" data-preview-fight=\"" + U.escapeHtml(offer.id) + "\">Открыть бой</button></div>";
    }).join("") + "</div>";
  }

  function renderTrainingTab(state) {
    return "<div class=\"content-card\"><h3>Тренировка</h3><div class=\"muted small\" style=\"margin-bottom:12px\">Одна тренировка занимает неделю и даёт +1 к выбранному навыку.</div><div class=\"grid three\">" +
      Data.statKeys.map(function (stat) { return "<button data-train-stat=\"" + U.escapeHtml(stat.id) + "\">" + U.escapeHtml(stat.label) + "</button>"; }).join("") +
    "</div></div>";
  }

  function renderRankingFilters(state) {
    return "<div class=\"filters\"><div class=\"filter-group\"><span class=\"filter-title\">Страна</span>" +
      Data.countries.map(function (country) { return "<button class=\"small-btn " + (state.rankingCountryId === country.id ? "active" : "") + "\" data-ranking-country=\"" + country.id + "\">" + U.escapeHtml(country.label) + "</button>"; }).join("") +
      "</div><div class=\"filter-group\"><span class=\"filter-title\">Путь</span>" +
      Object.keys(Data.tracks).map(function (trackId) { return "<button class=\"small-btn " + (state.rankingTrackId === trackId ? "active" : "") + "\" data-ranking-track=\"" + trackId + "\">" + U.escapeHtml(Data.tracks[trackId].label) + "</button>"; }).join("") +
      "</div><div class=\"filter-group\"><span class=\"filter-title\">Вес</span>" +
      Data.weightClasses.map(function (weightClass) { return "<button class=\"small-btn " + (state.rankingWeightClassId === weightClass.id ? "active" : "") + "\" data-ranking-weight=\"" + weightClass.id + "\">" + U.escapeHtml(weightClass.label) + "</button>"; }).join("") +
      "</div></div>";
  }

  function renderRankingTab(state) {
    var list = State.ranking(state, state.rankingCountryId, state.rankingTrackId, state.rankingWeightClassId).slice(0, 24);
    return "<div class=\"content-card\"><h3>Рейтинг</h3>" + renderRankingFilters(state) + "<div class=\"ranking-list\">" + list.map(function (fighter, index) {
      return "<div class=\"split-row\"><div><div class=\"name-line\">#" + (index + 1) + " <button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(fighter.id) + "\">" + U.escapeHtml(fighter.name) + "</button>" + (fighter.isPlayer ? " <span class=\"pill green\">ты</span>" : "") + "</div><div class=\"muted small\">" + U.escapeHtml(U.recordText(fighter.record)) + " · " + U.escapeHtml(U.findWeightClass(fighter.weightClassId).label) + "</div></div><span class=\"pill gold\">Рейтинг " + U.statAverage(fighter.stats) + "</span></div>";
    }).join("") + "</div></div>";
  }

  function renderClubsTab(state) {
    var clubs = state.clubs || [];
    return "<div class=\"grid two\">" + clubs.slice(0, 12).map(function (club) {
      var roster = window.FS.Clubs.clubRoster(state, club.id).slice(0, 4);
      return "<div class=\"content-card\"><h3>" + U.escapeHtml(club.name) + "</h3><div class=\"muted small\">" + U.escapeHtml(U.findCountry(club.countryId).label) + " · уровень " + club.level + "</div>" +
        roster.map(function (fighter) {
          return "<div class=\"split-row\"><button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(fighter.id) + "\">" + U.escapeHtml(fighter.name) + "</button><span class=\"pill\">Рейтинг " + U.statAverage(fighter.stats) + "</span></div>";
        }).join("") + "</div>";
    }).join("") + "</div>";
  }

  function renderTitlesTab(state) {
    var titles = window.FS.Titles ? window.FS.Titles.listVisibleTitles(state, state.rankingCountryId) : [];
    return "<div class=\"content-card\"><h3>Титулы: " + U.escapeHtml(U.findCountry(state.rankingCountryId).label) + "</h3>" + renderRankingFilters(state) +
      titles.filter(function (title) { return title.trackId === state.rankingTrackId && title.weightClassId === state.rankingWeightClassId; }).map(function (title) {
        var champion = U.getFighterById(state, title.championId);
        return "<div class=\"split-row\"><div><div class=\"name-line\">" + U.escapeHtml(title.label) + "</div><div class=\"muted small\">" + U.escapeHtml(U.findWeightClass(title.weightClassId).label) + " · защит: " + title.defenses + "</div></div><span>" + (champion ? "<button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(champion.id) + "\">" + U.escapeHtml(champion.name) + "</button>" : "<span class=\"muted small\">нет чемпиона</span>") + "</span></div>";
      }).join("") + "</div>";
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

  function renderNewsList(state, limit) {
    var news = state.world.news.slice(0, limit || 12);
    if (!news.length) {
      return "<div class=\"muted small\">Новостей пока нет.</div>";
    }
    return "<div class=\"news-list\">" + news.map(function (entry) {
      return "<div class=\"split-row\"><div><div class=\"name-line\">Неделя " + entry.week + "</div><div class=\"muted small\">" + U.escapeHtml(entry.text) + "</div></div><span class=\"pill blue\">" + U.escapeHtml(entry.tone) + "</span></div>";
    }).join("") + "</div>";
  }

  function renderWorldTab(state) {
    var team = state.world.teamsByCountry[state.rankingCountryId] || { main: [], reserve: [] };
    function renderTeam(ids) {
      if (!ids.length) {
        return "<div class=\"muted small\">Пусто.</div>";
      }
      return ids.map(function (id) {
        var fighter = U.getFighterById(state, id);
        return fighter ? "<div class=\"split-row\"><div><button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(id) + "\">" + U.escapeHtml(fighter.name) + "</button><div class=\"muted small\">" + U.escapeHtml(U.recordText(fighter.record)) + " · " + U.escapeHtml(U.findWeightClass(fighter.weightClassId).label) + "</div></div><span class=\"pill gold\">Рейтинг " + U.statAverage(fighter.stats) + "</span></div>" : "";
      }).join("");
    }
    return "<div class=\"grid two\"><div class=\"content-card\"><h3>Новости мира</h3>" + renderNewsList(state, 12) + "</div><div class=\"content-card\"><h3>Сборная: " + U.escapeHtml(U.findCountry(state.rankingCountryId).label) + "</h3><div class=\"label\">Состав</div>" + renderTeam(team.main) + "<div class=\"label\" style=\"margin-top:14px\">Резерв</div>" + renderTeam(team.reserve) + "</div></div>";
  }

  function renderPeopleTab(state) {
    return "<div class=\"content-card\"><h3>Знакомые люди</h3><div class=\"muted small\" style=\"margin-bottom:12px\">Пока только список. Без шкал и действий.</div><div class=\"people-list\">" + state.people.map(function (person) {
      return "<div class=\"split-row\"><div><div class=\"name-line\">" + U.escapeHtml(person.name) + "</div><div class=\"muted small\">" + U.escapeHtml(person.note) + "</div></div><span class=\"pill\">" + U.escapeHtml(Data.peopleRoles[person.role] || person.role) + "</span></div>";
    }).join("") + "</div></div>";
  }

  function renderMain(state) {
    var content;
    if (state.selectedTab === "dashboard") { content = renderDashboardTab(state); }
    else if (state.selectedTab === "profile") { content = renderProfileTab(state); }
    else if (state.selectedTab === "fights") { content = renderFightsTab(state); }
    else if (state.selectedTab === "training") { content = renderTrainingTab(state); }
    else if (state.selectedTab === "ranking") { content = renderRankingTab(state); }
    else if (state.selectedTab === "clubs") { content = renderClubsTab(state); }
    else if (state.selectedTab === "titles") { content = renderTitlesTab(state); }
    else if (state.selectedTab === "stories") { content = renderStoriesTab(state); }
    else if (state.selectedTab === "world") { content = renderWorldTab(state); }
    else { content = renderPeopleTab(state); }

    return "<section class=\"panel\">" + renderTabs(state) + "<div class=\"feed\">" + U.escapeHtml(state.feed || "Готово.") + "</div>" + content + "</section>";
  }

  function renderFighterModal(state, fighter) {
    return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(fighter.name) + "</h2><div class=\"muted small\">" + U.escapeHtml(U.findCountry(fighter.countryId).label) + " · " + U.escapeHtml(U.findTrack(fighter.trackId).label) + " · " + U.escapeHtml(U.findWeightClass(fighter.weightClassId).label) + "</div></div><div class=\"modal-body\"><div class=\"grid two\"><div class=\"stat-card\"><div class=\"label\">Рейтинг</div><div class=\"value\">" + U.statAverage(fighter.stats) + "</div></div><div class=\"stat-card\"><div class=\"label\">Рекорд</div><div class=\"value\" style=\"font-size:18px\">" + U.escapeHtml(U.recordText(fighter.record)) + "</div></div></div><div class=\"skills\" style=\"margin-top:12px\"><div class=\"label\">Навыки</div>" + renderSkillRow("Сила", fighter.stats.power) + renderSkillRow("Техника", fighter.stats.technique) + renderSkillRow("Скорость", fighter.stats.speed) + renderSkillRow("Выносливость", fighter.stats.stamina) + renderSkillRow("Защита", fighter.stats.defense) + "</div><div class=\"content-card\" style=\"margin-top:12px\"><div class=\"label\">Титулы</div>" + renderFighterTitles(state, fighter) + "</div><div class=\"content-card\" style=\"margin-top:12px\"><div class=\"label\">Карьера</div>" + renderCareerLog(fighter, 5) + "</div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
  }

  function renderModal(state) {
    var modal = state.modal;
    var fighter;
    if (!modal) { return ""; }

    if (modal.type === "fighter") {
      fighter = U.getFighterById(state, modal.fighterId);
      return fighter ? renderFighterModal(state, fighter) : "";
    }

    if (modal.type === "fightPreview") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(modal.label) + "</h2><div class=\"muted small\">Предпросмотр боя · " + U.escapeHtml(modal.weightClassLabel) + "</div></div><div class=\"modal-body\"><div class=\"grid two\"><div class=\"stat-card\"><div class=\"label\">Ты</div><div class=\"value\">" + modal.playerRating + "</div><div class=\"muted small\">" + U.escapeHtml(modal.playerRecord) + "</div></div><div class=\"stat-card\"><div class=\"label\">Соперник</div><div class=\"value\">" + modal.opponentRating + "</div><div class=\"muted small\">" + U.escapeHtml(modal.opponentName) + " · " + U.escapeHtml(modal.opponentRecord) + "</div></div></div><div class=\"pills\"><span class=\"pill\">" + modal.rounds + " раунда</span><span class=\"pill gold\">$" + modal.purse + "</span><span class=\"pill blue\">Шанс " + modal.winChance + "%</span><span class=\"pill\">" + U.escapeHtml(modal.tacticLabel) + "</span><span class=\"pill\">" + U.escapeHtml(modal.difficultyLabel) + "</span></div></div><div class=\"modal-actions\"><button data-action=\"close-modal\">Отмена</button><button class=\"primary\" data-accept-fight=\"" + U.escapeHtml(modal.offerId) + "\">Принять бой</button></div></div></div>";
    }

    if (modal.type === "fightResult") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Результат боя</h2></div><div class=\"modal-body\"><div class=\"big-result " + Fight.resultClass(modal.result) + "\">" + U.escapeHtml(modal.result) + "</div><div class=\"muted\">Неделя " + modal.week + " · соперник: " + U.escapeHtml(modal.opponentName) + "</div><div class=\"pills\"><span class=\"pill\">Метод: " + U.escapeHtml(modal.method) + "</span><span class=\"pill\">Счёт: " + U.escapeHtml(modal.scoreLine) + "</span><span class=\"pill gold\">Гонорар $" + modal.purse + "</span><span class=\"pill blue\">Шанс до боя " + modal.winChance + "%</span></div><div class=\"content-card\" style=\"margin-top:12px\"><div class=\"label\">Раунды</div>" + (modal.roundLog || []).map(function (line) { return "<div class=\"muted small\">" + U.escapeHtml(line) + "</div>"; }).join("") + (modal.knockdown ? "<div class=\"pill red\" style=\"margin-top:10px\">Нокдаун: раунд " + modal.knockdown.round + "</div>" : "") + "</div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Продолжить</button></div></div></div>";
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
