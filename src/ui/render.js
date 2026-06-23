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

  function flagEmoji(countryId) {
    var id = String(countryId || "").toLowerCase();
    var map = {
      russia: "🇷🇺", ru: "🇷🇺",
      usa: "🇺🇸", us: "🇺🇸", united_states: "🇺🇸",
      mexico: "🇲🇽", brazil: "🇧🇷", argentina: "🇦🇷",
      uk: "🇬🇧", britain: "🇬🇧", england: "🇬🇧",
      germany: "🇩🇪", france: "🇫🇷", spain: "🇪🇸", italy: "🇮🇹",
      ireland: "🇮🇪", netherlands: "🇳🇱", poland: "🇵🇱", ukraine: "🇺🇦",
      japan: "🇯🇵", china: "🇨🇳", korea: "🇰🇷", kazakhstan: "🇰🇿",
      cuba: "🇨🇺", canada: "🇨🇦", australia: "🇦🇺",
      turkey: "🇹🇷", thailand: "🇹🇭", philippines: "🇵🇭"
    };
    return map[id] || "🏳️";
  }

  function flagImg(countryId) {
    var country = U.findCountry(countryId);
    var emoji = flagEmoji(countryId);
    if (!country || !country.flag) {
      return '<span class="flag-emoji">' + emoji + '</span>';
    }
    return "<img class=\"flag-icon\" src=\"" + U.escapeHtml(country.flag) + "\" alt=\"" + U.escapeHtml(country.label) + "\" onerror=\"this.outerHTML='&lt;span class=&quot;flag-emoji&quot;&gt;" + emoji + "&lt;/span&gt;';\">";
  }

  function countryLabel(countryId) {
    var country = U.findCountry(countryId);
    return "<span class=\"country-label\">" + flagImg(country.id) + "<span>" + U.escapeHtml(country.label) + "</span></span>";
  }

  function countryDropdown(selectedId, buttonAttr, extraClass) {
    var selected = U.findCountry(selectedId);
    return "<details class=\"country-dropdown " + (extraClass || "") + "\"><summary class=\"small-btn country-summary\">" + countryLabel(selected.id) + "</summary><div class=\"country-dropdown-menu\">" +
      Data.countries.map(function (country) {
        return "<button type=\"button\" class=\"small-btn country-choice " + (selectedId === country.id ? "active" : "") + "\" " + buttonAttr + "=\"" + U.escapeHtml(country.id) + "\">" + countryLabel(country.id) + "</button>";
      }).join("") +
    "</div></details>";
  }

  function shortDateText(state) {
    var parts = State.dateParts ? State.dateParts(state) : null;
    if (!parts) { return "Н" + (state.week || 1); }
    return "Г" + parts.year + " · " + String(parts.monthLabel || "").slice(0, 3) + " · " + parts.weekOfMonth + "н";
  }

  function shortWeightLabel(weightId) {
    var weight = U.findWeightClass(weightId);
    if (!weight || !weight.label) { return ""; }
    if (weight.id === "bantam") { return "Легч."; }
    if (weight.id === "light") { return "Лёгк."; }
    if (weight.id === "welter") { return "Полуср."; }
    if (weight.id === "middle") { return "Средн."; }
    if (weight.id === "heavy") { return "Тяж."; }
    if (weight.id === "super_heavy") { return "Супертяж."; }
    return weight.label;
  }

  function shortTrackLabel(trackId) {
    var track = U.findTrack(trackId);
    return track.short || track.label || trackId;
  }

  function appVersionNumber() {
    var match = String(Data.appVersion || "").match(/\d+(?:\.\d+){1,3}/);
    return match ? match[0] : String(Data.appVersion || "");
  }

  function weekDateText(week) {
    var parts = State.dateParts ? State.dateParts({ week: Number(week) || 1 }) : { year: 1, monthLabel: "месяц", weekOfMonth: 1 };
    return "год " + parts.year + ", " + parts.monthLabel + ", " + parts.weekOfMonth + " неделя";
  }

  function fighterCountryLabel(fighter) {
    if (!fighter) { return ""; }
    if ((fighter.originCountryId || fighter.homeCountryId) && (fighter.originCountryId || fighter.homeCountryId) !== fighter.countryId) {
      return "<span class=\"fighter-country-route\">" + countryLabel(fighter.originCountryId || fighter.homeCountryId) + "<span class=\"country-arrow\">→</span>" + countryLabel(fighter.countryId) + "</span>";
    }
    return countryLabel(fighter.countryId);
  }

  function option(value, label, selectedValue) {
    return "<option value=\"" + U.escapeHtml(value) + "\"" + (value === selectedValue ? " selected" : "") + ">" + U.escapeHtml(label) + "</option>";
  }

  function renderStartScreen(savedSummary) {
    var weightOptions = Data.weightClasses.map(function (weightClass) {
      return option(weightClass.id, weightClass.label + " · " + weightClass.min + "-" + weightClass.max + " кг", "welter");
    }).join("");
    var archetypes = Data.careerArchetypes || [];
    var cards = archetypes.map(function (archetype, index) {
      return '<label class="archetype-card">' +
        '<input type="radio" name="careerArchetype" value="' + U.escapeHtml(archetype.id) + '"' + (index === 1 ? ' checked' : '') + '>' +
        '<strong>' + U.escapeHtml(archetype.label) + '</strong>' +
        '<span>' + U.escapeHtml(archetype.description) + '</span>' +
      '</label>';
    }).join("");

    function summaryHtml() {
      if (!savedSummary) { return ""; }
      var track = savedSummary.trackId ? U.findTrack(savedSummary.trackId).label : "карьера";
      var country = savedSummary.countryId ? countryLabel(savedSummary.countryId) : "";
      return '<div class="content-card continue-card"><h3>Сохранённая карьера</h3>' +
        '<div class="split-row"><span>Боец</span><strong>' + U.escapeHtml(savedSummary.name || 'Боец') + '</strong></div>' +
        '<div class="split-row"><span>Неделя</span><strong>' + (savedSummary.week || 1) + '</strong></div>' +
        '<div class="split-row"><span>Путь</span><strong>' + U.escapeHtml(track) + '</strong></div>' +
        '<div class="split-row"><span>Страна</span><strong>' + country + '</strong></div>' +
        '<div class="row start-actions"><button class="primary" data-action="continue-career">Продолжить карьеру</button><button data-action="import-save">Импорт</button></div>' +
      '</div>';
    }

    return '<section class="start-screen">' +
      '<div class="start-card">' +
        '<div class="start-head start-head-compact">' +
          '<div class="brand start-brand-compact">' +
            '<img class="start-logo" src="assets/icons/icon-192.png" alt="Fight World">' +
            '<div class="start-title-line"><h1>Fight World</h1><span class="version-badge">' + U.escapeHtml(appVersionNumber()) + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="start-body">' +
          summaryHtml() +
          '<div class="grid two start-form-grid">' +
            '<label><div class="label">Имя бойца</div><input id="careerName" value="Влад" maxlength="32"></label>' +
            '<label><div class="label">Страна</div><input id="careerCountry" type="hidden" value="russia"><div id="careerCountryDropdown">' + countryDropdown('russia', 'data-start-country', 'start-country-dropdown') + '</div></label>' +
            '<label><div class="label">Весовая категория</div><select id="careerWeightClass">' + weightOptions + '</select></label>' +
          '</div>' +
          '<div class="content-card new-career-card"><h3>Новая карьера</h3><div class="archetype-grid">' + cards + '</div></div>' +
          '<div class="row start-actions"><button class="primary" data-action="create-career">Начать новую карьеру</button>' + (savedSummary ? '<button class="danger" data-action="reset-save">Удалить сохранение</button>' : '<button data-action="import-save">Импорт</button>') + '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function renderHeader(state) {
    var p = State.player(state);
    var status = State.pathProgress ? State.pathProgress(state, p).badge : "";
    var money = Number(p.money) || 0;
    var moneyText = money >= 1000000 ? (Math.round(money / 10000) / 100 + "м") : (money >= 1000 ? (Math.round(money / 100) / 10 + "к") : String(money));

    return '<header class="topbar compact-topbar mobile-fit-topbar">' +
      '<div class="top-pills player-strip">' +
        '<span class="pill date-pill">' + U.escapeHtml(shortDateText(state)) + '</span>' +
        '<span class="pill flag-pill country-pill">' + countryLabel(p.countryId) + '</span>' +
        '<span class="pill blue">OVR ' + U.statAverage(p.stats) + '</span>' +
        '<span class="pill record-pill">' + U.escapeHtml(U.recordText(p.record)) + '</span>' +
        '<span class="pill gold">$' + U.escapeHtml(moneyText) + '</span>' +
        '<span class="pill red">Уст ' + (Number(p.fatigue) || 0) + '</span>' +
        (status ? '<button class="pill-link green rank-pill" data-path-rank-info="' + U.escapeHtml(p.trackId) + '">' + U.escapeHtml(status) + '</button>' : '') +
      '</div>' +
    '</header>';
  }

  function renderSidebar(state) {
    return "";
  }

  function renderTabs(state) {
    var p = State.player(state);
    var tabs = [
      ["dashboard", "🏠 Обзор"],
      ["profile", "🥊 Профиль"],
      ["favorites", "⭐ Избранные"],
      ["news", "📰 Новости"],
      ["training", "📈 Статы"],
      ["ranking", "🏆 Рейтинг"],
      ["myclub", "🏟️ Мой клуб"],
      ["clubs", "🏛️ Клубы"],
      ["people", "👥 Люди"],
      ["settings", "⚙️ Настройки"]
    ];

    if (p.trackId !== "pro") {
      tabs.splice(2, 0, ["fights", "🔥 Бои"]);
    }
    if (p.trackId === "pro") {
      tabs.splice(3, 0, ["pro", "💼 Профи"]);
    }
    if (p.trackId === "amateur") {
      tabs.splice(tabs.length - 2, 0, ["world", "🌍 Люб. путь"]);
    }

    return '<div class="tabs">' + tabs.map(function (tab) {
      return '<button class="' + (state.selectedTab === tab[0] ? 'active' : '') + '" data-tab="' + tab[0] + '">' + tab[1] + '</button>';
    }).join('') + '</div>';
  }

  function renderFighterAwards(state, fighter) {
    var awards = State.getFighterAwards ? State.getFighterAwards(state, fighter) : (fighter.awards || []);
    function medalIcon(award) {
      if (award.medal === "gold") { return "🥇"; }
      if (award.medal === "silver") { return "🥈"; }
      if (award.medal === "bronze") { return "🥉"; }
      return "🏅";
    }

    if (!awards.length) {
      return "<div class=\"muted small\">Наград пока нет.</div>";
    }

    return awards.slice(0, 12).map(function (award) {
      return "<div class=\"split-row\"><span>" + medalIcon(award) + " " + U.escapeHtml(award.label) + "</span><strong>Неделя " + (award.week || "—") + "</strong></div>";
    }).join("");
  }

  function renderFighterTitles(state, fighter) {
    var titles = window.FS.Titles && window.FS.Titles.fighterTitleHistory ? window.FS.Titles.fighterTitleHistory(state, fighter.id) : (window.FS.Titles ? window.FS.Titles.fighterTitles(state, fighter.id) : []);
    if (!titles.length) {
      return "<div class=\"muted small\">Титулов пока нет.</div>";
    }
    return titles.slice(0, 16).map(function (title) {
      var weight = title.weightClassId ? U.escapeHtml(U.findWeightClass(title.weightClassId).label) : "";
      var dates = title.active ? ("с " + weekDateText(title.fromWeek || 1)) : (weekDateText(title.fromWeek || 1) + " — " + weekDateText(title.toWeek || title.fromWeek || 1));
      return "<div class=\"split-row\"><span>" + (title.active ? "👑 " : "▫️ ") + U.escapeHtml(title.label) + "</span><strong>" + weight + " · " + dates + "</strong></div>";
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
    return "<div class=\"split-row\"><div><button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(fighter.id) + "\">" + U.escapeHtml(fighter.name) + "</button><div class=\"muted small\">" + fighterCountryLabel(fighter) + " · " + U.escapeHtml(U.findTrack(fighter.trackId).label) + " · " + U.escapeHtml(U.recordText(fighter.record)) + "</div></div><span class=\"pill gold\">Рейтинг " + U.statAverage(fighter.stats) + "</span></div>";
  }

  function isFavoriteFighter(state, fighterId) {
    return !!(state.trackedFighterIds && state.trackedFighterIds.indexOf(fighterId) !== -1);
  }

  function favoriteButton(state, fighterId) {
    var active = isFavoriteFighter(state, fighterId);
    return "<button class=\"small-btn favorite-btn " + (active ? "active" : "") + "\" data-favorite-fighter=\"" + U.escapeHtml(fighterId) + "\">" + (active ? "★ В избранном" : "☆ В избранные") + "</button>";
  }

  function renderFavoriteFighters(state) {
    var ids = Array.isArray(state.trackedFighterIds) ? state.trackedFighterIds : [];
    var fighters = ids.map(function (id) { return U.getFighterById(state, id); }).filter(function (fighter) { return fighter && !fighter.retired; });

    if (!fighters.length) {
      return "<div class=\"content-card favorites-card\"><h3>Избранные</h3><div class=\"muted small\">Отмечай бойцов звёздочкой в карточке или во вкладке боёв.</div></div>";
    }

    return "<div class=\"content-card favorites-card\"><div class=\"split-row\"><h3>Избранные</h3><strong>" + fighters.length + "</strong></div><div class=\"favorite-list\">" + fighters.slice(0, 12).map(function (fighter) {
      var club = window.FS.Clubs ? window.FS.Clubs.findClub(state, fighter.gymId) : null;
      return "<div class=\"split-row favorite-row\"><div><button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(fighter.id) + "\">★ " + U.escapeHtml(fighter.name) + "</button><div class=\"muted small\">" + fighterCountryLabel(fighter) + " · " + fighterCountryLabel(fighter) + " · " + U.escapeHtml(U.findTrack(fighter.trackId).label) + " · " + U.escapeHtml(U.recordText(fighter.record)) + (club ? " · " + U.escapeHtml(club.name) : "") + "</div></div><span class=\"pill gold\">OVR " + U.statAverage(fighter.stats) + "</span></div>";
    }).join("") + "</div></div>";
  }

  function renderDashboardTab(state) {
    var p = State.player(state);
    var club = window.FS.Clubs ? window.FS.Clubs.playerClub(state) : null;
    var breakdown = State.monthlyExpenseBreakdown ? State.monthlyExpenseBreakdown(state) : { total: 0 };

    return '<div class="grid two dashboard-grid">' +
      '<div class="content-card"><h3>Текущее положение</h3>' +
        '<div class="split-row"><span>Путь</span><strong>' + U.escapeHtml(U.findTrack(p.trackId).label) + '</strong></div>' +
        '<div class="split-row"><span>Вес</span><strong>' + (p.trackId === 'street' ? 'Без весовых категорий' : U.escapeHtml(U.findWeightClass(p.weightClassId).label)) + '</strong></div>' +
        '<div class="split-row"><span>Клуб</span><strong>' + U.escapeHtml(club ? club.name : 'Без клуба') + '</strong></div>' +
        '<div class="split-row"><span>Рекорд</span><strong>' + U.escapeHtml(U.recordText(p.record)) + '</strong></div>' +
        '<div class="split-row"><span>Баланс</span><strong>$' + (p.money || 0) + '</strong></div>' +
        '<div class="split-row"><span>Очки прокачки</span><strong>' + (p.trainingPoints || 0) + '</strong></div>' +
        '<div class="split-row"><span>Ежемесячные расходы</span><strong>$' + (breakdown.total || 0) + '</strong></div>' +
        '<div class="row dashboard-actions" style="margin-top:12px"><button data-action="next-week">Следующая неделя</button><button class="primary" data-action="train-week">Тренировка</button></div>' +
      '</div>' +
    '</div>';
  }

  function renderProfileTab(state) {
    var p = State.player(state);

    return '<div class="grid two">' +
      '<div class="content-card"><h3>Информация о бойце</h3>' +
        '<div class="split-row"><span>Имя</span><strong>' + U.escapeHtml(p.name) + '</strong></div>' +
        '<div class="split-row"><span>Возраст</span><strong>' + p.age + '</strong></div>' +
        '<div class="split-row"><span>Страна</span><strong>' + countryLabel(p.countryId) + '</strong></div>' +
        '<div class="split-row"><span>Вес</span><strong>' + (p.trackId === 'street' ? 'Без весовых категорий' : U.escapeHtml(U.formatWeightClass(p.weightClassId))) + '</strong></div>' +
        '<div class="split-row"><span>Очки прокачки</span><strong>' + (p.trainingPoints || 0) + '</strong></div>' +
      '</div>' +
      '<div class="content-card"><h3>' + (p.trackId === 'amateur' ? 'Награды' : 'Титулы') + '</h3>' + (p.trackId === 'amateur' ? renderFighterAwards(state, p) : renderFighterTitles(state, p)) + '</div>' +
      renderTrackRecords(p) +
      '<div class="content-card profile-actions-card" style="grid-column:1/-1"><h3>Управление карьерой</h3><div class="row"><button class="primary" data-profile-modal="travel">Перелёт</button><button data-profile-modal="weight">Смена веса</button><button data-profile-modal="path">Смена пути</button></div></div>' +
    '</div>';
  }

  function renderTrackRecords(fighter) {
    var records = fighter.trackRecords || {};
    var amateur = records.amateur || (fighter.trackId === 'amateur' ? fighter.record : { wins: 0, losses: 0, draws: 0, kos: 0 });
    var street = records.street || (fighter.trackId === 'street' ? fighter.record : { wins: 0, losses: 0, draws: 0, kos: 0 });
    var pro = records.pro || (fighter.trackId === 'pro' ? fighter.record : { wins: 0, losses: 0, draws: 0, kos: 0 });

    return '<div class="content-card" style="grid-column:1/-1"><div class="label">Рекорды по путям</div>' +
      '<div class="split-row"><span>Любители</span><strong>' + U.escapeHtml(U.recordText(amateur)) + '</strong></div>' +
      '<div class="split-row"><span>Улица</span><strong>' + U.escapeHtml(U.recordText(street)) + '</strong></div>' +
      '<div class="split-row"><span>Профи</span><strong>' + U.escapeHtml(U.recordText(pro)) + '</strong></div>' +
    '</div>';
  }


  function inlineFighterButton(id, name) {
    return "<button class=\"inline-link-btn\" data-fighter=\"" + U.escapeHtml(id) + "\">" + U.escapeHtml(name) + "</button>";
  }

  function interactiveText(state, text, ids) {
    var html = U.escapeHtml(text || "");
    var unique = Array.from(new Set((ids || []).filter(Boolean)));
    unique.sort(function (leftId, rightId) {
      var left = U.getFighterById(state, leftId);
      var right = U.getFighterById(state, rightId);
      return ((right && right.name ? right.name.length : 0) - (left && left.name ? left.name.length : 0));
    });
    unique.forEach(function (id) {
      var fighter = U.getFighterById(state, id);
      var escapedName;
      var button;
      if (!fighter) { return; }
      escapedName = U.escapeHtml(fighter.name);
      button = inlineFighterButton(fighter.id, fighter.name);
      html = html.split(escapedName).join(button);
    });
    return html;
  }

  function entryFighterIds(state, fighter, entry) {
    var ids = [];
    var meta = entry && entry.meta ? entry.meta : {};
    if (meta.fighterId) { ids.push(meta.fighterId); }
    if (meta.firstId) { ids.push(meta.firstId); }
    if (meta.secondId) { ids.push(meta.secondId); }
    if (meta.thirdId) { ids.push(meta.thirdId); }
    if (Array.isArray(meta.fighterIds)) { ids = ids.concat(meta.fighterIds); }
    if (!ids.length && fighter && Array.isArray(fighter.recentOpponentIds)) { ids = ids.concat(fighter.recentOpponentIds.slice(0, 8)); }
    return Array.from(new Set(ids.filter(Boolean)));
  }

  function renderCareerLog(state, fighter, limit) {
    if (!fighter.careerLog || !fighter.careerLog.length) {
      return '<div class="muted small">Пока без заметных событий.</div>';
    }
    return fighter.careerLog.slice(0, limit || 8).map(function (entry) {
      return '<div class="split-row history-row"><span>Неделя ' + entry.week + '</span><strong class="history-text">' + interactiveText(state, entry.text, entryFighterIds(state, fighter, entry)) + '</strong></div>';
    }).join('');
  }

  function renderFavoritesTab(state) {
    var ids = Array.isArray(state.trackedFighterIds) ? state.trackedFighterIds : [];
    var fighters = ids.map(function (id) { return U.getFighterById(state, id); }).filter(function (fighter) { return fighter && !fighter.retired; });

    if (!fighters.length) {
      return '<div class="content-card"><h3>Избранные</h3><div class="muted small">Пусто.</div></div>';
    }

    return '<div class="content-card"><div class="split-row"><h3>Избранные</h3><strong>' + fighters.length + '</strong></div><div class="favorite-list favorite-tab-list compact-favorites">' + fighters.map(function (fighter) {
      var club = window.FS.Clubs ? window.FS.Clubs.findClub(state, fighter.gymId) : null;
      var weight = fighter.trackId === 'street' ? 'без веса' : U.findWeightClass(fighter.weightClassId).label;
      return '<div class="offer compact-offer favorite-tab-row"><div class="compact-fight-info compact-favorite-info">' +
        favoriteButton(state, fighter.id) +
        '<button class="small-btn fighter-name-btn" data-fighter="' + U.escapeHtml(fighter.id) + '">' + U.escapeHtml(fighter.name) + '</button>' +
        '<span class="pill flag-mini">' + fighterCountryLabel(fighter) + '</span>' +
        '<span class="pill red">' + U.escapeHtml(U.findTrack(fighter.trackId).label) + '</span>' +
        '<span class="pill">' + U.escapeHtml(weight) + '</span>' +
        '<span class="pill gold">OVR ' + U.statAverage(fighter.stats) + '</span>' +
        '<span class="pill">' + U.escapeHtml(U.recordText(fighter.record)) + '</span>' +
        (club ? '<button class="small-btn club-chip-btn" data-club="' + U.escapeHtml(club.id) + '">' + U.escapeHtml(club.name) + '</button>' : '') +
      '</div><button class="small-btn favorite-open-btn" data-fighter="' + U.escapeHtml(fighter.id) + '">Профиль</button></div>';
    }).join('') + '</div></div>';
  }

  function renderFightsTab(state) {
    var offers = (state.offers || []).filter(function (offer) { return !offer.isCompetition; });

    function fightRow(offer) {
      var opponent = U.getFighterById(state, offer.opponentId);
      var preview = Fight.buildFightPreview(state, offer.id);
      if (!opponent || !preview) { return ""; }
      return '<div class="f1-fight-row">' +
        '<div class="f1-fight-main">' +
          '<div class="f1-fight-name-row">' +
            '<button class="fighter-link" data-fighter="' + U.escapeHtml(opponent.id) + '">' + U.escapeHtml(opponent.name) + '</button>' +
            '<span class="mini-chip flag-mini">' + fighterCountryLabel(opponent) + '</span>' +
          '</div>' +
          '<div class="f1-fight-meta">' +
            '<span class="mini-chip">OVR ' + preview.opponentRating + '</span>' +
            '<span class="mini-chip record-mini">' + U.escapeHtml(U.recordText(opponent.record)) + '</span>' +
            '<span class="mini-chip gold">$' + preview.purse + '</span>' +
            '<span class="mini-chip blue">' + preview.winChance + '%</span>' +
          '</div>' +
        '</div>' +
        '<button class="f1-fight-btn" data-preview-fight="' + U.escapeHtml(offer.id) + '">Бой</button>' +
      '</div>';
    }

    return '<div class="content-card fights-head"><div class="split-row"><h3>Бои</h3><button class="small-btn" data-action="refresh-offers">Обновить</button></div></div>' +
      '<div class="fight-lines f1-fight-lines">' + offers.map(fightRow).join("") + '</div>';
  }

  function renderProTab(state) {
    var p = State.player(state);
    var contracts = state.world.proContracts || [];
    var history = state.world.proContractHistory || [];
    var promoter = (Data.promoters || []).find(function (item) { return item.id === p.promoterId; }) || (Data.promoters || [])[0] || { label: "—", cut: 0 };
    var ranking = State.ranking(state, "world", "pro", p.weightClassId);
    var rankIndex = ranking.findIndex(function (fighter) { return fighter.id === p.id; });
    var titles = window.FS.Titles ? window.FS.Titles.fighterTitles(state, p.id) : [];
    var activeOpponent = p.contractOpponentId ? U.getFighterById(state, p.contractOpponentId) : null;

    function futureDateText(week) {
      var parts = State.dateParts ? State.dateParts({ week: week }) : { year: 1, monthLabel: "месяц", weekOfMonth: 1 };
      return "год " + parts.year + ", " + parts.monthLabel + ", " + parts.weekOfMonth + " неделя";
    }

    function weeksLeftText(week) {
      var left = Math.max(0, Number(week) - Number(state.week));
      return left === 0 ? "на этой неделе" : ("через " + left + " нед.");
    }

    function chancePill(opponent) {
      var chance = opponent && Fight.estimateWinChance ? Fight.estimateWinChance(p, opponent) : 50;
      return '<span class="pill green">Шанс ' + chance + '%</span>';
    }

    function contractRow(contract) {
      var opponent = U.getFighterById(state, contract.opponentId);
      if (!opponent) { return ""; }
      return '<div class="offer compact-offer"><div class="compact-fight-info">' +
        '<button class="small-btn" data-fighter="' + U.escapeHtml(opponent.id) + '">' + U.escapeHtml(opponent.name) + '</button>' +
        '<span class="pill flag-pill">' + fighterCountryLabel(opponent) + '</span>' +
        '<span class="pill">OVR ' + U.statAverage(opponent.stats) + '</span>' +
        '<span class="pill">' + U.escapeHtml(U.recordText(opponent.record)) + '</span>' +
        chancePill(opponent) +
        '<span class="pill gold">$' + contract.netPurse + '</span>' +
        '<span class="pill">' + weeksLeftText(contract.fightWeek) + '</span>' +
        '<span class="pill">' + futureDateText(contract.fightWeek) + '</span>' +
        '<span class="pill blue">' + U.escapeHtml(contract.promoterLabel) + '</span>' +
        '</div><button class="primary" data-pro-contract="' + U.escapeHtml(contract.id) + '">Подписать</button></div>';
    }

    function proTitleButtons() {
      var output = [];
      var key;
      var title;
      var check;
      if (!state.titles) { return ""; }
      for (key in state.titles) {
        if (Object.prototype.hasOwnProperty.call(state.titles, key)) {
          title = state.titles[key];
          if (title.trackId === "pro" && title.weightClassId === p.weightClassId) {
            check = window.FS.Titles ? window.FS.Titles.playerTitleChallenge(state, title.id) : { eligible: false, reason: "—" };
            output.push('<div class="split-row"><div><strong>' + U.escapeHtml(title.bodyId ? title.bodyId.toUpperCase() : title.label) + '</strong><div class="muted small">' + U.escapeHtml(check.reason) + '</div></div><span>' + (check.eligible ? '<button class="small-btn primary" data-title-challenge="' + U.escapeHtml(title.id) + '">Вызов</button>' : '<span class="pill">закрыто</span>') + '</span></div>');
          }
        }
      }
      return output.join("");
    }

    if (p.trackId !== "pro") {
      return '<div class="content-card"><h3>Профессиональный путь</h3><div class="muted small">Раздел станет доступен после перехода в профи. Минимум для профи — OVR 90.</div></div>';
    }

    return '<div class="grid two">' +
      '<div class="content-card"><h3>Профи-статус</h3>' +
        '<div class="split-row"><span>Промоутер</span><strong>' + U.escapeHtml(promoter.label) + '</strong></div>' +
        '<div class="split-row"><span>Комиссия</span><strong>' + Math.round((promoter.cut || 0) * 100) + '%</strong></div>' +
        '<div class="split-row"><span>Мировой рейтинг</span><strong>' + (rankIndex >= 0 ? '#' + (rankIndex + 1) : '—') + '</strong></div>' +
        '<div class="split-row"><span>Пояса</span><strong>' + (titles.length ? titles.map(function (title) { return title.bodyId ? title.bodyId.toUpperCase() : title.label; }).join(', ') : 'нет') + '</strong></div>' +
      '</div>' +
      '<div class="content-card"><h3>Текущий контракт</h3>' + (p.contractOpponentId ? '<div class="split-row"><span>' + U.escapeHtml(p.contractLabel || 'Контрактный бой') + '</span><strong>' + weeksLeftText(p.nextFightWeek) + ' · ' + futureDateText(p.nextFightWeek) + '</strong></div><div class="split-row"><span>Соперник</span><strong>' + (activeOpponent ? U.escapeHtml(activeOpponent.name) : '—') + '</strong></div><div class="split-row"><span>Гонорар после комиссии</span><strong>$' + (p.contractPurse || 0) + '</strong></div>' + (activeOpponent ? '<div class="row" style="margin-top:10px">' + chancePill(activeOpponent) + '</div>' : '') + (state.week >= p.nextFightWeek ? '<button class="primary" data-start-pro-contract="1">Выйти на контрактный бой</button>' : '<div class="muted small">Готовься: бой ещё не наступил.</div>') : '<div class="muted small">Активного контракта нет.</div>') + '</div>' +
      '<div class="content-card" style="grid-column:1/-1"><div class="split-row"><h3>Титульные возможности</h3><span class="muted small">' + U.escapeHtml(U.findWeightClass(p.weightClassId).label) + '</span></div>' + (proTitleButtons() || '<div class="muted small">Поясов пока нет.</div>') + '</div>' +
      '<div class="content-card" style="grid-column:1/-1"><div class="split-row"><h3>Новые предложения</h3><button class="small-btn" data-refresh-pro-contracts="1">Обновить</button></div>' + (contracts.length ? contracts.map(contractRow).join('') : '<div class="muted small">Нет доступных контрактов. Обнови предложения или подожди неделю.</div>') + '</div>' +
      '<div class="content-card" style="grid-column:1/-1"><h3>История контрактов</h3>' + (history.length ? history.slice(0, 8).map(function (entry) { return '<div class="split-row"><span>Неделя ' + entry.week + '</span><strong>' + U.escapeHtml(entry.text) + '</strong></div>'; }).join('') : '<div class="muted small">Пока пусто.</div>') + '</div>' +
    '</div>';
  }

  function renderTrainingTab(state) {
    var p = State.player(state);
    var disabled = (p.trainingPoints || 0) <= 0 ? ' disabled' : '';
    return '<div class="content-card training-card"><h3>Характеристики</h3><div class="split-row"><span>Очки прокачки</span><strong>' + (p.trainingPoints || 0) + '</strong></div><div class="split-row"><span>Усталость</span><strong>' + (p.fatigue || 0) + '/100</strong></div>' +
      '<div class="training-list" style="margin-top:12px">' +
      Data.statKeys.map(function (stat) {
        return '<div class="training-row"><button class="training-plus-btn" data-train-stat="' + U.escapeHtml(stat.id) + '"' + disabled + '>+ ' + U.escapeHtml(stat.label) + '</button><span class="training-value">' + (p.stats[stat.id] || 0) + '</span></div>';
      }).join('') +
    '</div></div>';
  }


  function renderEconomyTab(state) {
    var p = State.player(state);
    var breakdown = State.monthlyExpenseBreakdown ? State.monthlyExpenseBreakdown(state) : { total: 0, trackCost: 0, food: 0, medical: 0, clubFee: 0, equipment: 0 };

    return "<div class=\"grid two\">" +
      "<div class=\"content-card\"><h3>Баланс и расходы</h3>" +
        "<div class=\"split-row\"><span>Баланс</span><strong>$" + (p.money || 0) + "</strong></div>" +
        "<div class=\"split-row\"><span>Усталость</span><strong>" + (p.fatigue || 0) + "/100</strong></div>" +
        "<div class=\"split-row\"><span>Ежемесячно</span><strong>$" + breakdown.total + "</strong></div>" +
        "<div class=\"muted small\">Жизнь $" + breakdown.trackCost + " · питание $" + breakdown.food + " · мед. резерв $" + breakdown.medical + " · зал $" + breakdown.clubFee + (breakdown.freeYouth ? " · до 18 лет расходы отключены" : "") + "</div>" +
      "</div>" +
    "</div>";
  }

  function renderRankingFilters(state) {
    var countryGroup = state.rankingTrackId === "pro" ? "<div class=\"filter-group\"><span class=\"filter-title\">Страна</span><span class=\"pill gold\">Мировой рейтинг</span></div>" :
      "<div class=\"filter-group compact-country-filter\"><span class=\"filter-title\">Страна</span>" +
      countryDropdown(state.rankingCountryId, "data-ranking-country", "ranking-country-dropdown") +
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
    var rankingCountryId = state.rankingTrackId === 'pro' ? 'world' : state.rankingCountryId;
    var pageSize = 24;
    var page = Math.max(0, Number(state.rankingPage) || 0);
    var list = State.ranking(state, rankingCountryId, state.rankingTrackId, state.rankingTrackId === 'street' ? '' : state.rankingWeightClassId);
    var champions = [];
    var contenders;
    var visible;
    var totalPages;
    var titleMap = {};
    var key;

    if (state.titles && state.rankingTrackId !== 'amateur') {
      for (key in state.titles) {
        if (Object.prototype.hasOwnProperty.call(state.titles, key)) {
          var title = state.titles[key];
          if (title.trackId === state.rankingTrackId &&
              (state.rankingTrackId === 'street' ? title.countryId === state.rankingCountryId : title.countryId === 'world') &&
              (state.rankingTrackId === 'street' || title.weightClassId === state.rankingWeightClassId)) {
            titleMap[title.championId] = titleMap[title.championId] || [];
            titleMap[title.championId].push(title);
          }
        }
      }
    }

    champions = list.filter(function (fighter) { return !!titleMap[fighter.id]; });
    contenders = list.filter(function (fighter) { return !titleMap[fighter.id]; });
    totalPages = Math.max(1, Math.ceil(contenders.length / pageSize));
    page = Math.min(page, totalPages - 1);
    visible = contenders.slice(page * pageSize, page * pageSize + pageSize);

    function fighterSubline(fighter) {
      var weightText = fighter.trackId === 'street' ? 'без весовой' : U.escapeHtml(U.findWeightClass(fighter.weightClassId).label);
      var base = fighterCountryLabel(fighter) + ' · ' + U.escapeHtml(U.recordText(fighter.record)) + ' · ' + weightText;
      if (fighter.trackId === 'amateur') {
        return base + ' · ' + U.escapeHtml(State.rankForFighter ? State.rankForFighter(fighter).label : 'Любитель');
      }
      if (fighter.trackId === 'pro') {
        return base + ' · мировой рейтинг';
      }
      return base;
    }

    function crowns(fighter) {
      if (!titleMap[fighter.id]) { return ''; }
      return titleMap[fighter.id].map(function (title) {
        return '👑' + (title.bodyId ? title.bodyId.toUpperCase() : '');
      }).join(' ');
    }

    function rowHtml(fighter, label, isChampion) {
      return '<div class="ranking-entry">' +
        '<div class="ranking-top"><div class="ranking-name-wrap"><span class="ranking-pos">' + label + '</span><button class="small-btn fighter-name-btn" data-fighter="' + U.escapeHtml(fighter.id) + '">' + (isChampion && crowns(fighter) ? crowns(fighter) + ' ' : '') + U.escapeHtml(fighter.name) + '</button>' + (fighter.isPlayer ? ' <span class="pill green">ты</span>' : '') + '</div><span class="pill gold">' + (isChampion ? 'Чемпион ' : 'Рейтинг ') + U.statAverage(fighter.stats) + '</span></div>' +
        '<div class="muted small ranking-sub">' + fighterSubline(fighter) + '</div>' +
      '</div>';
    }

    return '<div class="content-card"><h3>Рейтинг' + (state.rankingTrackId === 'pro' ? ' · мир' : '') + '</h3>' + renderRankingFilters(state) +
      '<div class="split-row"><span>Страница ' + (page + 1) + ' / ' + totalPages + ' · бойцов: ' + contenders.length + '</span><span><button class="small-btn" data-ranking-page="' + Math.max(0, page - 1) + '"' + (page <= 0 ? ' disabled' : '') + '>Назад</button> <button class="small-btn" data-ranking-page="' + Math.min(totalPages - 1, page + 1) + '"' + (page >= totalPages - 1 ? ' disabled' : '') + '>Вперёд</button></span></div>' +
      '<div class="ranking-list">' +
      champions.map(function (fighter) { return rowHtml(fighter, '👑', true); }).join('') +
      visible.map(function (fighter, index) { return rowHtml(fighter, '#' + (page * pageSize + index + 1), false); }).join('') + '</div></div>';
  }

  function renderMyClubTab(state) {
    var p = State.player(state);
    var club = window.FS.Clubs ? window.FS.Clubs.playerClub(state) : null;
    var filter = Number(state.clubLevelFilter) || 0;
    var eligible = window.FS.Clubs ? window.FS.Clubs.eligibleClubsForFighter(state, p, filter || null) : [];
    var highest = eligible.length ? eligible[0].level : 0;
    var shown = filter ? eligible : eligible.filter(function (item) { return item.level === highest; });
    var levelButtons = [0,1,2,3,4,5,6].map(function (lvl) {
      return '<button class="small-btn ' + (filter === lvl ? 'active' : '') + '" data-club-level-filter="' + lvl + '">' + (lvl ? 'Ур. ' + lvl : 'Лучшие') + '</button>';
    }).join('');

    if (club) {
      var strongest = window.FS.Clubs.strongestFighter(state, club.id);
      var coachButton = club.coach ? '<button class="small-btn fighter-name-btn" data-person="' + U.escapeHtml(club.coach.id) + '">' + U.escapeHtml(club.coach.name) + '</button>' : '—';
      return '<div class="content-card"><div class="club-summary-row"><div><h3>' + U.escapeHtml(club.name) + '</h3><div class="muted small">Ур. ' + club.level + ' · x' + club.trainingModifier + ' очков</div></div><button class="small-btn primary" data-club="' + U.escapeHtml(club.id) + '">Ростер</button></div>' +
        '<div class="split-row"><span>Тренер</span><strong>' + coachButton + '</strong></div>' +
        '<div class="split-row"><span>Сильнейший</span><strong>' + (strongest ? '<button class="small-btn fighter-name-btn" data-fighter="' + U.escapeHtml(strongest.id) + '">' + U.escapeHtml(strongest.name) + '</button>' : '—') + '</strong></div>' +
        '<div class="row" style="margin-top:12px"><button class="danger" data-action="leave-club">Покинуть клуб</button></div>' +
      '</div>';
    }

    return '<div class="content-card"><h3>Мой клуб</h3><div class="club-filter-row">' + levelButtons + '</div><div class="club-select-list">' + shown.slice(0, 16).map(function (item) {
      return '<div class="club-select-row"><div class="club-select-info"><strong>' + U.escapeHtml(item.name) + '</strong><div class="muted small">' + countryLabel(item.countryId) + ' · ур. ' + item.level + ' · OVR ' + item.minOvr + '–' + item.maxOvr + ' · x' + item.trainingModifier + '</div></div><button class="small-btn primary" data-join-club="' + U.escapeHtml(item.id) + '">Выбрать</button></div>';
    }).join('') + '</div></div>';
  }

  function renderClubCountryFilters(state) {
    return "<div class=\"filter-group compact-country-filter\"><span class=\"filter-title\">Страна</span>" +
      countryDropdown(state.rankingCountryId, "data-ranking-country", "club-country-dropdown") +
    "</div>";
  }

  function renderClubsTab(state) {
    var clubs = (state.clubs || []).filter(function (club) {
      return club.countryId === state.rankingCountryId;
    });

    return '<div class="content-card"><h3>Клубы</h3><div class="filters">' + renderClubCountryFilters(state) + '</div><div class="club-browser-list">' + clubs.map(function (club) {
      return '<div class="club-browser-row"><div class="club-browser-main"><strong>' + U.escapeHtml(club.name) + '</strong><span class="muted small">' + countryLabel(club.countryId) + ' · ур. ' + club.level + '</span></div><button class="small-btn" data-club="' + U.escapeHtml(club.id) + '">Открыть карточку</button></div>';
    }).join('') + '</div></div>';
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

  function strongestTeamFighter(state, team) {
    var ids = ((team && team.main) || []).concat((team && team.reserve) || []);
    var fighters = ids.map(function (id) { return U.getFighterById(state, id); }).filter(Boolean);
    fighters.sort(function (a, b) { return U.statAverage(b.stats) - U.statAverage(a.stats); });
    return fighters[0] || null;
  }

  function renderTeamCardHtml(state, countryId, compact) {
    var country = U.findCountry(countryId);
    var team = state.world.teamsByCountry[country.id] || { main: [], reserve: [], coach: null };
    var coach = team.coach || (state.world.teamCoaches ? state.world.teamCoaches[country.id] : null);
    var strongest = strongestTeamFighter(state, team);
    var coachButton = coach ? "<button class=\"small-btn\" data-person=\"" + U.escapeHtml(coach.id) + "\">" + U.escapeHtml(coach.name) + "</button>" : "—";
    var strongestButton = strongest ? "<button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(strongest.id) + "\">" + U.escapeHtml(strongest.name) + "</button>" : "—";
    return "<div class=\"content-card team-card\">" +
      (compact ? "" : "<h3>Сборная " + countryLabel(country.id) + "</h3>") +
      "<div class=\"split-row\"><span>Тренер</span><strong>" + coachButton + "</strong></div>" +
      "<div class=\"split-row\"><span>Страна тренера</span><strong>" + (coach && coach.countryId ? countryLabel(coach.countryId) : countryLabel(country.id)) + "</strong></div>" +
      "<div class=\"split-row\"><span>Сильнейший</span><strong>" + strongestButton + "</strong></div>" +
      "<div class=\"muted small\">Основной состав: " + (team.main || []).length + " / 12 · резерв: " + (team.reserve || []).length + " / 48</div>" +
      (compact ? "" : "<div class=\"row\" style=\"margin-top:12px\"><button class=\"small-btn\" data-team-card=\"" + U.escapeHtml(country.id) + "\">Открыть карточку</button><button class=\"small-btn primary\" data-team-list=\"main\" data-team-country=\"" + U.escapeHtml(country.id) + "\">Ростер</button><button class=\"small-btn\" data-team-list=\"reserve\" data-team-country=\"" + U.escapeHtml(country.id) + "\">Резерв</button></div>") +
    "</div>";
  }

  function tournamentWeeksOnly(comp) {
    var text = String(comp.scheduleText || comp.reason || "");
    var match = text.match(/(?:через \d+ нед\.|на этой неделе)/);
    if (match) { return match[0]; }
    if (comp.cooldownLeft) { return "через " + comp.cooldownLeft + " нед."; }
    return "по календарю";
  }

  function renderWorldTab(state) {
    var p = State.player(state);
    var homeId = p.homeCountryId || p.countryId;
    var selectedTeamId = state.selectedTeamCountryId || homeId;
    var comps = window.FS.Amateur ? window.FS.Amateur.availableCompetitions(state) : [];

    function renderCompetition(comp) {
      return '<div class="split-row tournament-row"><div><div class="name-line">' + U.escapeHtml(comp.label) + '</div><div class="muted small">OVR ' + comp.minRating + '–' + comp.maxRating + ' · +' + comp.rewardRating + ' · ' + U.escapeHtml(tournamentWeeksOnly(comp)) + '</div></div><span>' + (comp.available ? '<button class="small-btn primary" data-amateur-competition="' + U.escapeHtml(comp.id) + '">Начать турнир</button>' : '<span class="pill">закрыто</span>') + '</span></div>';
    }

    return '<div class="grid two world-grid">' +
      '<div class="content-card"><h3>Турнирная лестница</h3>' + comps.map(renderCompetition).join('') + '</div>' +
      renderTeamCardHtml(state, homeId, false) +
      '<div class="content-card" style="grid-column:1/-1"><h3>Сборные</h3><div class="team-selector-row">' + countryDropdown(selectedTeamId, 'data-team-country-select', 'team-country-dropdown') + '<button class="small-btn" data-team-card="' + U.escapeHtml(selectedTeamId) + '">Открыть карточку</button><button class="small-btn primary" data-team-list="main" data-team-country="' + U.escapeHtml(selectedTeamId) + '">Ростер</button><button class="small-btn" data-team-list="reserve" data-team-country="' + U.escapeHtml(selectedTeamId) + '">Резерв</button></div></div>' +
    '</div>';
  }

  function renderNewsTab(state) {
    var news = state.world && state.world.news instanceof Array ? state.world.news : [];
    var seen = {};
    news = news.filter(function (item) {
      var key = String(item.week) + '|' + String(item.tone || '') + '|' + String(item.text || '');
      if (seen[key]) { return false; }
      seen[key] = true;
      return true;
    });
    function newsIds(item) {
      return entryFighterIds(state, null, item || {});
    }
    if (!news.length) {
      return '<div class="content-card"><h3>Новости</h3><div class="muted small">Пусто.</div></div>';
    }
    return '<div class="content-card"><h3>Новости</h3><div class="news-list">' + news.slice(0, 80).map(function (item) {
      return '<div class="news-row-card"><div class="split-row news-row"><div class="news-row-main"><strong>Неделя ' + item.week + '</strong><div class="muted small news-inline-text">' + interactiveText(state, item.text, newsIds(item)) + '</div></div><span class="pill">' + U.escapeHtml(item.tone || 'world') + '</span></div></div>';
    }).join('') + '</div></div>';
  }

  function renderPeopleTab(state) {
    var people = state.people instanceof Array ? state.people : [];
    if (!people.length) {
      return "<div class=\"content-card\"><h3>Люди</h3><div class=\"muted small\">Пока никого нет. Выбери зал — сюда добавятся тренер и иногда одноклубники.</div></div>";
    }
    return "<div class=\"content-card\"><h3>Люди</h3><div class=\"people-list\">" + people.map(function (person) {
      return "<div class=\"split-row\"><div><button class=\"small-btn\" data-person=\"" + U.escapeHtml(person.id) + "\">" + U.escapeHtml(person.name) + "</button><div class=\"muted small\">" + U.escapeHtml(person.note || "") + "</div></div><span class=\"pill\">" + U.escapeHtml(Data.peopleRoles[person.role] || person.role) + "</span></div>";
    }).join("") + "</div></div>";
  }

  function renderSettingsTab(state) {
    return '<div class="grid two">' +
      '<div class="content-card"><h3>Сохранение</h3>' +
        '<div class="row"><button data-action="repair-save">Починить сохранение</button><button data-action="world-audit">Диагностика мира</button><button data-action="patch-notes">Патч</button><button data-action="export-save">Экспорт</button><button data-action="import-save">Импорт</button><button class="danger" data-action="reset-career">Начать новую карьеру</button></div>' +
        '<div class="footer-note">Версия: ' + U.escapeHtml(Data.appVersion) + '</div>' +
      '</div>' +
    '</div>';
  }

  function renderMain(state) {
    var p = State.player(state);
    var content;
    var tab = state.selectedTab || "dashboard";

    if (p.trackId === "pro" && (tab === "fights" || tab === "world")) { tab = "dashboard"; }
    if (p.trackId === "street" && (tab === "pro" || tab === "world")) { tab = "dashboard"; }
    if (p.trackId === "amateur" && tab === "pro") { tab = "dashboard"; }

    if (tab === "dashboard") { content = renderDashboardTab(state); }
    else if (tab === "profile") { content = renderProfileTab(state); }
    else if (tab === "fights") { content = renderFightsTab(state); }
    else if (tab === "favorites") { content = renderFavoritesTab(state); }
    else if (tab === "news") { content = renderNewsTab(state); }
    else if (tab === "pro") { content = renderProTab(state); }
    else if (tab === "training") { content = renderTrainingTab(state); }
    else if (tab === "economy") { content = renderDashboardTab(state); }
    else if (tab === "ranking") { content = renderRankingTab(state); }
    else if (tab === "myclub") { content = renderMyClubTab(state); }
    else if (tab === "clubs") { content = renderClubsTab(state); }
    else if (tab === "world") { content = renderWorldTab(state); }
    else if (tab === "settings") { content = renderSettingsTab(state); }
    else { content = renderPeopleTab(state); }

    function desktopTabs() {
      return renderTabs(state).replace('class="tabs"', 'class="tabs side-tabs"');
    }

    function tabButton(id, icon, label) {
      return '<button class="f1-nav-btn ' + (tab === id ? 'active' : '') + '" data-tab="' + id + '"><span>' + icon + '</span>' + label + '</button>';
    }

    function moreItem(id, icon, label) {
      return '<button data-tab="' + id + '">' + icon + ' ' + label + '</button>';
    }

    function mobileNav() {
      return '<nav class="f1-mobile-nav">' +
        tabButton('dashboard', '🏠', 'Обзор') +
        tabButton('profile', '🥊', 'Профиль') +
        '<button class="f1-nav-btn week" data-action="next-week"><span>⏭</span>Неделя</button>' +
        (p.trackId !== 'pro' ? tabButton('fights', '🔥', 'Бои') : tabButton('pro', '💼', 'Профи')) +
        '<button class="f1-nav-btn ' + (state.mobileMoreOpen ? 'more-active' : '') + '" data-mobile-more="toggle"><span>☰</span>Ещё</button>' +
      '</nav>';
    }

    function moreSheet() {
      if (!state.mobileMoreOpen) { return ''; }
      return '<div class="f1-more-backdrop" data-mobile-more-close="1"></div>' +
        '<section class="f1-more-sheet">' +
          '<div class="f1-more-head"><div class="f1-more-title"><strong>Ещё</strong><span>Остальные окна карьеры</span></div><button class="small-btn" data-mobile-more-close="1">Закрыть</button></div>' +
          '<div class="f1-more-grid">' +
            (p.trackId === 'amateur' ? moreItem('world', '🌍', 'Люб. путь') : '') +
            (p.trackId === 'pro' ? moreItem('pro', '💼', 'Профи') : '') +
            moreItem('training', '📈', 'Статы') +
            moreItem('ranking', '🏆', 'Рейтинг') +
            moreItem('myclub', '🏟️', 'Мой клуб') +
            moreItem('clubs', '🏛️', 'Клубы') +
            moreItem('favorites', '⭐', 'Избранные') +
            moreItem('news', '📰', 'Новости') +
            moreItem('people', '👥', 'Люди') +
            moreItem('settings', '⚙️', 'Настройки') +
          '</div>' +
        '</section>';
    }

    var trackLabel = p && p.trackId ? U.findTrack(p.trackId).label : "Карьера";

    return '<div class="f1-layout">' +
      '<aside class="f1-side-nav"><div class="f1-side-title"><span>🏁 Fight World</span><small>' + U.escapeHtml(trackLabel) + '</small></div>' + desktopTabs() + '</aside>' +
      '<section class="panel main-panel f1-main"><div class="tab-scroll-area"><div class="feed">' + U.escapeHtml(state.feed || "Готово.") + '</div>' + content + '</div></section>' +
      '</div>' +
      '<div class="f1-bottom-spacer"></div>' +
      mobileNav() +
      moreSheet();
  }

  function renderClubModal(state, club) {
    var roster = window.FS.Clubs.clubRoster(state, club.id).slice(0, 30);
    var strongest = window.FS.Clubs.strongestFighter(state, club.id);
    var coach = club.coach || { name: club.coachName || "Тренер", age: "—", record: { wins: 0, losses: 0, draws: 0 }, id: "" };
    var coachButton = coach.id ? "<button class=\"small-btn\" data-person=\"" + U.escapeHtml(coach.id) + "\">" + U.escapeHtml(coach.name) + "</button>" : U.escapeHtml(coach.name);

    function rosterRow(fighter) {
      return '<div class="f1-roster-row">' +
        '<div class="f1-roster-info">' +
          '<button class="small-btn fighter-name-btn" data-fighter="' + U.escapeHtml(fighter.id) + '">' + U.escapeHtml(fighter.name) + '</button>' +
          (fighter.isPlayer ? ' <span class="pill green">ты</span>' : '') +
          '<span class="pill flag-mini">' + fighterCountryLabel(fighter) + '</span>' +
          '<span class="pill">' + U.escapeHtml(U.findTrack(fighter.trackId).label) + '</span>' +
          '<span class="pill">' + U.escapeHtml(U.recordText(fighter.record)) + '</span>' +
        '</div>' +
        '<span class="pill gold">OVR ' + U.statAverage(fighter.stats) + '</span>' +
      '</div>';
    }

    return '<div class="modal-backdrop"><div class="modal club-profile-modal">' +
      '<div class="modal-head"><h2>' + U.escapeHtml(club.name) + '</h2><div class="muted small">' + countryLabel(club.countryId) + ' · уровень ' + club.level + ' · OVR ' + club.minOvr + '–' + club.maxOvr + '</div></div>' +
      '<div class="modal-body">' +
        '<div class="grid two">' +
          '<div class="stat-card"><div class="label">Тренер</div><div class="value" style="font-size:18px">' + coachButton + '</div><div class="muted small">' + (coach.countryId ? countryLabel(coach.countryId) + ' · ' : '') + coach.age + ' лет · ' + (coach.record.wins || 0) + '-' + (coach.record.losses || 0) + '-' + (coach.record.draws || 0) + '</div></div>' +
          '<div class="stat-card"><div class="label">Сильнейший</div><div class="value" style="font-size:18px">' + (strongest ? U.escapeHtml(strongest.name) : '—') + '</div><div>' + (strongest ? '<button class="small-btn" data-fighter="' + U.escapeHtml(strongest.id) + '">Открыть бойца</button>' : '') + '</div></div>' +
        '</div>' +
        '<div class="content-card" style="margin-top:12px"><div class="split-row"><span>Ростер</span><strong>' + roster.length + '+</strong></div><div class="f1-roster-list">' + roster.map(rosterRow).join("") + '</div></div>' +
      '</div>' +
      '<div class="modal-actions"><button data-action="close-modal">Закрыть</button></div>' +
    '</div></div>';
  }

  function renderFighterModal(state, fighter) {
    var weightText = fighter.trackId === "street" ? "без весовых категорий" : U.escapeHtml(U.findWeightClass(fighter.weightClassId).label);
    var club = window.FS.Clubs ? window.FS.Clubs.findClub(state, fighter.gymId) : null;
    var stage = window.FS.Matchmaking && window.FS.Matchmaking.careerStage ? window.FS.Matchmaking.careerStage(fighter) : { label: "Боец" };
    var ovr = U.statAverage(fighter.stats);

    return '<div class="modal-backdrop"><div class="modal fighter-profile-modal">' +
      '<div class="modal-body">' +
        '<div class="f1-profile-hero">' +
          '<div class="f1-profile-top">' +
            '<div class="f1-profile-title">' +
              '<h2>' + U.escapeHtml(fighter.name) + '</h2>' +
              '<div class="f1-profile-sub">' +
                '<span class="pill flag-mini">' + fighterCountryLabel(fighter) + '</span>' +
                '<span class="pill">' + U.escapeHtml(U.findTrack(fighter.trackId).label) + '</span>' +
                '<span class="pill">' + weightText + '</span>' +
                (fighter.retired ? '<span class="pill red">завершил</span>' : '') +
              '</div>' +
            '</div>' +
            '<div class="f1-profile-ovr"><strong>' + ovr + '</strong><span>OVR</span></div>' +
          '</div>' +
          '<div class="f1-profile-grid">' +
            '<div class="f1-profile-stat"><span>Рекорд</span><strong>' + U.escapeHtml(U.recordText(fighter.record)) + '</strong></div>' +
            '<div class="f1-profile-stat"><span>Возраст</span><strong>' + fighter.age + '</strong></div>' +
            '<div class="f1-profile-stat"><span>Баланс</span><strong>$' + (fighter.money || 0) + '</strong></div>' +
            '<div class="f1-profile-stat"><span>Статус</span><strong>' + U.escapeHtml(stage.label) + '</strong></div>' +
            '<div class="f1-profile-stat"><span>Зал</span><strong>' + U.escapeHtml(club ? club.name : 'Без клуба') + '</strong></div>' +
            '<div class="f1-profile-stat"><span>Вес</span><strong>' + weightText + '</strong></div>' +
          '</div>' +
          '<div class="row">' + (!fighter.isPlayer ? favoriteButton(state, fighter.id) : '') + '<button class="small-btn" data-path-rank-info="' + U.escapeHtml(fighter.trackId) + '">Статусы</button></div>' +
        '</div>' +
        '<div class="skills" style="margin-top:12px"><div class="label">Навыки</div>' +
          renderSkillRow('Сила', fighter.stats.power) +
          renderSkillRow('Техника', fighter.stats.technique) +
          renderSkillRow('Скорость', fighter.stats.speed) +
          renderSkillRow('Выносливость', fighter.stats.stamina) +
          renderSkillRow('Защита / здоровье', fighter.stats.defense || fighter.stats.health) +
        '</div>' +
        '<div class="content-card" style="margin-top:12px"><h3>Награды</h3>' + renderFighterAwards(state, fighter) + '</div>' +
        '<div class="content-card" style="margin-top:12px"><h3>Титулы</h3>' + renderFighterTitles(state, fighter) + '</div>' +
        '<div class="content-card" style="margin-top:12px"><h3>История карьеры</h3>' + renderCareerLog(state, fighter, 8) + '</div>' +
      '</div>' +
      '<div class="modal-actions"><button data-action="close-modal">Закрыть</button></div>' +
    '</div></div>';
  }

  function renderProfileProcessModal(state, kind) {
    var p = State.player(state);
    var currentWeightIndex = Data.weightClasses.findIndex(function (weight) { return weight.id === p.weightClassId; });
    var canMoveWeight = p.trackId !== "street" && currentWeightIndex >= 0 && currentWeightIndex < Data.weightClasses.length - 1;
    var body = "";

    if (kind === "travel") {
      body = "<div class=\"content-card\"><h3>Перелёт</h3><div class=\"muted small\">Перелёт стоит денег, добавляет усталость и сбрасывает текущий зал. После перелёта выбери новый зал во вкладке “Мой клуб”.</div><div class=\"country-grid\">" + Data.countries.map(function (country) {
        var cost = Data.economy && Data.economy.travelCosts ? (Data.economy.travelCosts[country.id] || 220) : 220;
        return "<button class=\"small-btn country-choice " + (p.countryId === country.id ? "active" : "") + "\" data-profile-country=\"" + U.escapeHtml(country.id) + "\"" + (p.countryId === country.id ? " disabled" : "") + ">" + countryLabel(country.id) + "<span>$" + cost + "</span></button>";
      }).join("") + "</div></div>";
    } else if (kind === "weight") {
      body = "<div class=\"content-card\"><h3>Смена веса</h3><div class=\"muted small\">Можно перейти только вверх и максимум на две весовые. В тяжёлом весе переход закрыт.</div><div class=\"row\">" + Data.weightClasses.map(function (weight, index) {
        var allowed = canMoveWeight && index > currentWeightIndex && index <= currentWeightIndex + 2;
        return "<button class=\"small-btn " + (p.weightClassId === weight.id ? "active" : "") + "\" " + (allowed ? "data-profile-weight=\"" + U.escapeHtml(weight.id) + "\"" : "disabled") + ">" + U.escapeHtml(weight.label) + "</button>";
      }).join("") + "</div></div>";
    } else {
      body = "<div class=\"content-card\"><h3>Смена пути</h3><div class=\"muted small\">Рекорд каждого пути хранится отдельно. Ограничения по OVR и правилам карьеры сохраняются.</div><div class=\"row\">" + Object.keys(Data.tracks).map(function (trackId) {
        return "<button class=\"small-btn " + (p.trackId === trackId ? "active" : "") + "\" data-profile-track=\"" + U.escapeHtml(trackId) + "\">" + U.escapeHtml(Data.tracks[trackId].label) + "</button>";
      }).join("") + "</div></div>";
    }

    return "<div class=\"modal-backdrop\"><div class=\"modal profile-process-modal\"><div class=\"modal-head\"><h2>" + (kind === "travel" ? "Перелёт" : (kind === "weight" ? "Смена веса" : "Смена пути")) + "</h2></div><div class=\"modal-body\">" + body + "</div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
  }

  function renderModal(state) {
    var modal = state.modal;
    var fighter;
    var club;

    function renderTeamListModal(countryId, listType, page) {
      var team = state.world.teamsByCountry[countryId] || { main: [], reserve: [] };
      var ids = listType === "reserve" ? team.reserve : team.main;
      var title = listType === "reserve" ? "Резерв сборной" : "Состав сборной";
      var country = U.findCountry(countryId);
      var pageSize = 12;
      var totalPages = Math.max(1, Math.ceil(ids.length / pageSize));
      var safePage = Math.max(0, Math.min(page || 0, totalPages - 1));
      var visible = ids.slice(safePage * pageSize, safePage * pageSize + pageSize);

      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + title + "</h2><div class=\"muted small\">" + countryLabel(country.id) + " · страница " + (safePage + 1) + "/" + totalPages + "</div></div><div class=\"modal-body\">" +
        visible.map(function (id) {
          var f = U.getFighterById(state, id);
          var rank = f && State.rankForFighter ? State.rankForFighter(f).label : "";
          return f ? "<div class=\"split-row\"><div><button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(f.id) + "\">" + U.escapeHtml(f.name) + "</button>" + (f.isPlayer ? " <span class=\"pill green\">Ты</span>" : "") + "<div class=\"muted small\">" + U.escapeHtml(U.recordText(f.record)) + " · " + U.escapeHtml(U.findWeightClass(f.weightClassId).label) + " · " + U.escapeHtml(rank) + "</div></div><span class=\"pill gold\">OVR " + U.statAverage(f.stats) + "</span></div>" : "";
        }).join("") +
        "</div><div class=\"modal-actions\"><button data-team-page=\"" + Math.max(0, safePage - 1) + "\"" + (safePage <= 0 ? " disabled" : "") + ">Назад</button><button data-team-page=\"" + Math.min(totalPages - 1, safePage + 1) + "\"" + (safePage >= totalPages - 1 ? " disabled" : "") + ">Вперёд</button><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    function renderTeamCardModal(countryId) {
      var country = U.findCountry(countryId);
      var team = state.world.teamsByCountry[country.id] || { main: [], reserve: [], coach: null };
      var roster = (team.main || []).map(function (id) { return U.getFighterById(state, id); }).filter(Boolean);
      var reserve = (team.reserve || []).map(function (id) { return U.getFighterById(state, id); }).filter(Boolean);
      var strongest = strongestTeamFighter(state, team);
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Сборная " + countryLabel(country.id) + "</h2><div class=\"muted small\">" + U.escapeHtml(country.continentLabel) + "</div></div><div class=\"modal-body\">" +
        renderTeamCardHtml(state, country.id, true) +
        "<div class=\"content-card\" style=\"margin-top:12px\"><div class=\"split-row\"><span>Ростер</span><strong>" + roster.length + "</strong></div>" +
        roster.slice(0, 12).map(function (fighter) {
          return "<div class=\"split-row\"><div><button class=\"small-btn\" data-fighter=\"" + U.escapeHtml(fighter.id) + "\">" + U.escapeHtml(fighter.name) + "</button><div class=\"muted small\">" + fighterCountryLabel(fighter) + " · " + U.escapeHtml(U.findWeightClass(fighter.weightClassId).label) + " · " + U.escapeHtml(U.recordText(fighter.record)) + "</div></div><span class=\"pill gold\">OVR " + U.statAverage(fighter.stats) + "</span></div>";
        }).join("") + "</div>" +
        "<div class=\"content-card\" style=\"margin-top:12px\"><div class=\"split-row\"><span>Резерв</span><strong>" + reserve.length + "</strong></div><div class=\"muted small\">Полный резерв открывается кнопкой ниже.</div></div>" +
      "</div><div class=\"modal-actions\"><button class=\"small-btn primary\" data-team-list=\"main\" data-team-country=\"" + U.escapeHtml(country.id) + "\">Ростер</button><button class=\"small-btn\" data-team-list=\"reserve\" data-team-country=\"" + U.escapeHtml(country.id) + "\">Резерв</button><button data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    function renderTournamentParticipantsModal(sourceModal, page) {
      var alive = sourceModal && sourceModal.alive ? sourceModal.alive : [];
      var pageSize = 16;
      var totalPages = Math.max(1, Math.ceil(alive.length / pageSize));
      var safePage = Math.max(0, Math.min(page || 0, totalPages - 1));
      var visible = alive.slice(safePage * pageSize, safePage * pageSize + pageSize);

      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Участники турнира</h2><div class=\"muted small\">Осталось: " + alive.length + " · страница " + (safePage + 1) + "/" + totalPages + "</div></div><div class=\"modal-body\">" +
        visible.map(function (item) {
          return "<div class=\"split-row\"><span>" + (item.isPlayer ? "⭐ " : "") + U.escapeHtml(item.name) + " · " + U.escapeHtml(item.country) + " · " + U.escapeHtml(item.record) + "</span><strong>OVR " + item.rating + "</strong></div>";
        }).join("") +
        "</div><div class=\"modal-actions\"><button data-tournament-participants-page=\"" + Math.max(0, safePage - 1) + "\"" + (safePage <= 0 ? " disabled" : "") + ">Назад</button><button data-tournament-participants-page=\"" + Math.min(totalPages - 1, safePage + 1) + "\"" + (safePage >= totalPages - 1 ? " disabled" : "") + ">Вперёд</button><button class=\"primary\" data-back-to-tournament=\"1\">Назад к турниру</button></div></div></div>";
    }



    function statBar(label, value, max, kind) {
      var pct = max ? Math.max(0, Math.min(100, Math.round(value / max * 100))) : 0;
      var cls = kind === "stamina" ? " stamina-meter" : " hp-meter";
      return "<div class=\"fight-meter" + cls + "\"><span>" + U.escapeHtml(label) + "</span><div><i style=\"width:" + pct + "%\"></i></div><strong>" + value + "/" + max + "</strong></div>";
    }

    function renderRing(modal) {
      var cells = [];
      var size = modal.ringSize || 5;
      var x;
      var y;
      var cls;
      var text;
      for (y = 0; y < size; y += 1) {
        for (x = 0; x < size; x += 1) {
          cls = "ring-cell";
          text = "";
          if (modal.player.pos.x === x && modal.player.pos.y === y) { cls += " player-cell"; text = "Ты"; }
          if (modal.opponent.pos.x === x && modal.opponent.pos.y === y) { cls += " opponent-cell"; text = "NPC"; }
          cells.push("<div class=\"" + cls + "\">" + text + "</div>");
        }
      }
      return "<div class=\"ring-grid\">" + cells.join("") + "</div>";
    }

    function renderFightControls(modal) {
      var actions = modal.actions || [];
      var actionMap = {};
      actions.forEach(function (action) { actionMap[action.id] = action; });

      function punchButton(id) {
        var action = actionMap[id] || { id: id, label: id, enabled: true, damage: 0, chance: 0, stamina: 0 };
        return "<button class=\"punch-action-btn\" data-fight-action=\"" + U.escapeHtml(id) + "\"" + (action.enabled ? "" : " disabled") + ">" +
          "<span class=\"punch-damage\">" + action.damage + "</span>" +
          "<span class=\"punch-chance\">" + action.chance + "%</span>" +
          "<span class=\"punch-stamina\">" + action.stamina + "</span>" +
          "<span class=\"punch-title\">" + U.escapeHtml(action.label) + "</span>" +
        "</button>";
      }

      return "<div class=\"fight-controls\">" +
        "<div class=\"move-pad\"><button data-fight-move=\"0,-1\">↑</button><button data-fight-move=\"-1,0\">←</button><button data-fight-move=\"1,0\">→</button><button data-fight-move=\"0,1\">↓</button></div>" +
        punchButton("jabHead") +
        punchButton("jabBody") +
        punchButton("hook") +
        punchButton("uppercut") +
        "<button data-fight-action=\"block\">Блок</button>" +
        "<button data-fight-action=\"counter\"" + (modal.canCounter ? "" : " disabled") + ">Контратака</button>" +
      "</div>";
    }

    if (!modal) { return ""; }

    if (modal.type === "gameOver") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(modal.title || "Игра окончена") + "</h2></div><div class=\"modal-body\"><div class=\"content-card\">" + U.escapeHtml(modal.text || "Карьера завершена.") + "</div><div class=\"pill red\">Баланс $" + (modal.money || 0) + "</div></div><div class=\"modal-actions\"><button class=\"danger\" data-action=\"reset-career\">Начать заново</button></div></div></div>";
    }

    if (modal.type === "debtNotice") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(modal.title || "Деньги") + "</h2></div><div class=\"modal-body\"><div class=\"content-card\">" + U.escapeHtml(modal.text || "") + "</div><div class=\"pills\"><span class=\"pill gold\">Баланс $" + modal.money + "</span>" + (modal.weeksLeft ? "<span class=\"pill red\">Осталось " + modal.weeksLeft + " нед.</span>" : "") + "</div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Понял</button></div></div></div>";
    }

    if (modal.type === "fatigueLock") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Усталость 100/100</h2></div><div class=\"modal-body\"><div class=\"content-card\">Боец перегружен. Сейчас нельзя тренироваться, драться, покупать услуги или двигать карьеру. Доступен только отдых.</div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"rest-week\">Отдых</button></div></div></div>";
    }

    if (modal.type === "activeFight") {
      return "<div class=\"modal-backdrop fight-fullscreen-backdrop\"><div class=\"modal fight-modal fight-fullscreen-modal\"><div class=\"modal-head\"><h2>Бой на ринге</h2><div class=\"muted small\">Раунд " + modal.round + "/" + modal.roundsTotal + " · ход " + modal.turn + " · выйти нельзя до завершения боя</div></div><div class=\"modal-body\"><div class=\"fight-layout\"><div>" + renderRing(modal) + renderFightControls(modal) + "</div><div class=\"fight-side\"><h3>Ты</h3>" + statBar("HP", modal.player.hp, modal.player.maxHp, "hp") + statBar("Стамина", modal.player.stamina, modal.player.maxStamina, "stamina") + "<h3>" + U.escapeHtml(modal.opponentName) + "</h3>" + statBar("HP", modal.opponent.hp, modal.opponent.maxHp, "hp") + statBar("Стамина", modal.opponent.stamina, modal.opponent.maxStamina, "stamina") + "<div class=\"pills\"><span class=\"pill gold\">$" + modal.purse + "</span><span class=\"pill blue\">Шанс " + modal.winChance + "%</span></div><div class=\"fight-log\">" + modal.log.map(function (line) { return "<div>" + U.escapeHtml(line) + "</div>"; }).join("") + "</div></div></div></div></div></div>";
    }

    if (modal.type === "fightCount") {
      return "<div class=\"modal-backdrop fight-fullscreen-backdrop\"><div class=\"modal fight-modal fight-fullscreen-modal\"><div class=\"modal-head\"><h2>Нокдаун</h2><div class=\"muted small\">Счёт: " + modal.count + "/10</div></div><div class=\"modal-body\"><div class=\"fight-layout\"><div>" + renderRing({ ringSize: 5, player: modal.player, opponent: modal.opponent }) + "<div class=\"big-result " + (modal.side === "opponent" ? "win" : "loss") + "\">" + (modal.side === "player" ? "Ты на настиле" : "Соперник на настиле") + "</div></div><div class=\"fight-side\">" + statBar("HP", modal.player.hp, modal.player.maxHp, "hp") + statBar("Стамина", modal.player.stamina, modal.player.maxStamina, "stamina") + statBar("HP соперника", modal.opponent.hp, modal.opponent.maxHp, "hp") + statBar("Стамина соперника", modal.opponent.stamina, modal.opponent.maxStamina, "stamina") + "<div class=\"fight-log\">" + modal.log.map(function (line) { return "<div>" + U.escapeHtml(line) + "</div>"; }).join("") + "</div></div></div></div><div class=\"modal-actions\"><button class=\"primary\" data-fight-count=\"1\">Продолжить счёт</button></div></div></div>";
    }


    if (modal.type === "fighter") {
      fighter = U.getFighterById(state, modal.fighterId);
      return fighter ? renderFighterModal(state, fighter) : "";
    }

    if (modal.type === "club") {
      club = window.FS.Clubs.findClub(state, modal.clubId);
      return club ? renderClubModal(state, club) : "";
    }

    if (modal.type === "teamList") {
      return renderTeamListModal(modal.countryId, modal.listType, modal.page || 0);
    }

    if (modal.type === "teamCard") {
      return renderTeamCardModal(modal.countryId);
    }

    if (modal.type === "tournamentParticipants") {
      return renderTournamentParticipantsModal(modal.sourceModal, modal.page || 0);
    }

    if (modal.type === "person") {
      var person = (state.people || []).find(function (item) { return item.id === modal.personId; });
      var coach = window.FS.Clubs && window.FS.Clubs.findCoach ? window.FS.Clubs.findCoach(state, modal.personId) : null;
      if (person && person.personType === "fighter" && person.fighterId) {
        fighter = U.getFighterById(state, person.fighterId);
        return fighter ? renderFighterModal(state, fighter) : "";
      }
      if (!person && coach) {
        person = { id: coach.id, name: coach.name, personType: "coach", role: "coach", clubId: coach.clubId };
      }
      if (!person && state.world && state.world.teamCoaches) {
        Object.keys(state.world.teamCoaches).some(function (countryId) {
          var teamCoach = state.world.teamCoaches[countryId];
          if (teamCoach && teamCoach.id === modal.personId) {
            coach = teamCoach;
            person = { id: teamCoach.id, name: teamCoach.name, personType: "teamCoach", role: "teamCoach", countryId: countryId };
            return true;
          }
          return false;
        });
      }
      if (!person) { return ""; }
      if (!coach && window.FS.Clubs && window.FS.Clubs.findCoach) { coach = window.FS.Clubs.findCoach(state, person.id); }
      var pClub = coach && coach.clubId && window.FS.Clubs ? window.FS.Clubs.findClub(state, coach.clubId) : null;
      var coachCountry = person.countryId ? U.findCountry(person.countryId) : null;
      var coachRole = person.personType === "teamCoach" ? "Тренер сборной" : "Тренер";
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(person.name) + "</h2><div class=\"muted small\">" + coachRole + "</div></div><div class=\"modal-body\"><div class=\"split-row\"><span>Страна</span><strong>" + (coach && coach.countryId ? countryLabel(coach.countryId) : (coachCountry ? countryLabel(coachCountry.id) : "—")) + "</strong></div><div class=\"split-row\"><span>Возраст</span><strong>" + (coach ? coach.age : "—") + "</strong></div><div class=\"split-row\"><span>" + (coachCountry ? "Сборная" : "Клуб") + "</span><strong>" + (coachCountry ? countryLabel(coachCountry.id) : (pClub ? "<button class=\"small-btn\" data-club=\"" + U.escapeHtml(pClub.id) + "\">" + U.escapeHtml(pClub.name) + "</button>" : "—")) + "</strong></div><div class=\"split-row\"><span>Рекорд тренера</span><strong>" + (coach && coach.record ? (coach.record.wins || 0) + "-" + (coach.record.losses || 0) + "-" + (coach.record.draws || 0) : "0-0-0") + "</strong></div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    if (modal.type === "coachEvent") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(modal.title || "Событие") + "</h2></div><div class=\"modal-body\"><div class=\"content-card\">" + U.escapeHtml(modal.text || "") + "</div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    if (modal.type === "profileProcess") {
      return renderProfileProcessModal(state, modal.kind);
    }

    if (modal.type === "eventNotice") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(modal.title || "Новость") + "</h2></div><div class=\"modal-body\"><div class=\"content-card\">" + U.escapeHtml(modal.text || "") + "</div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    if (modal.type === "tournamentAvailable") {
      return "<div class=\"modal-backdrop\"><div class=\"modal compact-notice-modal\"><div class=\"modal-head\"><h2>Доступен турнир</h2><div class=\"muted small\">" + U.escapeHtml(modal.label || "Турнир") + " · " + U.escapeHtml(modal.scheduleText || "") + "</div></div><div class=\"modal-body\"><div class=\"content-card\">На этой неделе можно заявиться. Если пропустишь неделю, турнир уйдёт по календарю.</div></div><div class=\"modal-actions\"><button class=\"primary\" data-amateur-competition=\"" + U.escapeHtml(modal.competitionId) + "\">Заявиться</button><button data-action=\"close-modal\">Позже</button></div></div></div>";
    }

    if (modal.type === "tournamentInvite") {
      var comp = window.FS.Amateur && window.FS.Amateur.getCompetition ? window.FS.Amateur.getCompetition(modal.competitionId) : { label: "Турнир" };
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Турнир на следующей неделе</h2><div class=\"muted small\">" + U.escapeHtml(comp.label || "Турнир") + " · твоя весовая категория</div></div><div class=\"modal-body\"><div class=\"content-card\">Можно заявиться сейчас или проигнорировать. Если заявишься, турнир начнётся сразу после следующей смены недели.</div></div><div class=\"modal-actions\"><button class=\"primary\" data-tournament-invite=\"accept\">Записаться</button><button data-tournament-invite=\"ignore\">Игнорировать</button></div></div></div>";
    }

    if (modal.type === "proContractPreview" || modal.type === "proFightDue") {
      var proPlayer = State.player(state);
      var proOpponent = U.getFighterById(state, modal.opponentId || (proPlayer ? proPlayer.contractOpponentId : ""));
      var proChance = proPlayer && proOpponent && Fight.estimateWinChance ? Fight.estimateWinChance(proPlayer, proOpponent) : 50;
      var proPurse = proPlayer ? (proPlayer.contractPurse || 0) : 0;
      return "<div class=\"modal-backdrop\"><div class=\"modal fight-preview-modal\"><div class=\"modal-head\"><h2>Бой</h2><div class=\"muted small\">Контрактный бой · " + (proPlayer && proPlayer.weightClassId ? U.escapeHtml(U.formatWeightClass(proPlayer.weightClassId)) : "") + "</div></div><div class=\"modal-body\"><div class=\"grid two\"><div class=\"stat-card\"><div class=\"label\">Ты</div><div class=\"value\">" + (proPlayer ? U.statAverage(proPlayer.stats) : "—") + "</div><div class=\"muted small\">" + (proPlayer ? U.escapeHtml(U.recordText(proPlayer.record)) : "") + "</div></div><div class=\"stat-card\"><div class=\"label\">Соперник</div><div class=\"value\">" + (proOpponent ? U.statAverage(proOpponent.stats) : "—") + "</div><div class=\"muted small\">" + (proOpponent ? U.escapeHtml(proOpponent.name) + " · " + fighterCountryLabel(proOpponent) + " · " + U.escapeHtml(U.recordText(proOpponent.record)) : U.escapeHtml(modal.opponentName || "Соперник")) + "</div></div></div><div class=\"pills\"><span class=\"pill\">" + (proPlayer ? (proPlayer.contractRounds || U.findTrack("pro").rounds) : 0) + " раунда</span><span class=\"pill gold\">$" + proPurse + "</span><span class=\"pill blue\">Шанс " + proChance + "%</span></div></div><div class=\"modal-actions\"><button data-skip-pro-contract=\"1\">Пропустить бой</button><button class=\"primary\" data-start-pro-contract=\"1\">Выйти на ринг</button></div></div></div>";
    }

    if (modal.type === "pathRankInfo") {
      var title = modal.trackId === "street" ? "Уличные статусы" : (modal.trackId === "pro" ? "Профи-статусы" : "Любительские разряды");
      var lines = modal.trackId === "street" ?
        [
          "Уличный новичок — OVR 0-59.",
          "Местный боец — OVR 60-104.",
          "Уличный претендент — OVR 105-134.",
          "Опасное имя — OVR 135+.",
          "Чемпион улицы — действующий уличный титул страны."
        ] :
        (modal.trackId === "pro" ? [
          "Дебютант — OVR 90-99.",
          "Проспект — OVR 100-119.",
          "Претендент — OVR 120-149.",
          "Элита — OVR 150+.",
          "Чемпион — действующий пояс WBC/WBA/WBO/IBF."
        ] : [
          "3 взрослый — OVR 0-19.",
          "2 взрослый — OVR 20-39.",
          "1 взрослый — OVR 40-59.",
          "КМС — OVR 60-79.",
          "МС — OVR 80-99.",
          "МСМК — OVR 100-120."
        ]);
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + title + "</h2></div><div class=\"modal-body\"><div class=\"content-card\">" + lines.map(function (line) { return "<div class=\"split-row\"><span>" + U.escapeHtml(line) + "</span></div>"; }).join("") + "</div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    if (modal.type === "patchNotes") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Патч " + U.escapeHtml(Data.appVersion) + "</h2></div><div class=\"modal-body\"><div class=\"content-card\"><div class=\"label\">1.5 Stable Core</div><div class=\"muted small\">Списки вынесены в отдельные окна, турнирная сетка очищена, деньги отображаются сверху, а архитектурные хвосты после 1.4.x убраны.</div></div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    if (modal.type === "worldAudit") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Диагностика мира</h2></div><div class=\"modal-body\"><div class=\"grid two\"><div class=\"stat-card\"><div class=\"label\">Бойцы</div><div class=\"value\">" + modal.report.fighters + "</div></div><div class=\"stat-card\"><div class=\"label\">Клубы</div><div class=\"value\">" + modal.report.clubs + "</div></div><div class=\"stat-card\"><div class=\"label\">Титулы</div><div class=\"value\">" + modal.report.titles + "</div></div><div class=\"stat-card\"><div class=\"label\">Офферы</div><div class=\"value\">" + modal.report.offers + "</div></div></div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    if (modal.type === "saveExport") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Экспорт сохранения</h2></div><div class=\"modal-body\"><textarea readonly style=\"width:100%;min-height:260px;background:#101214;color:#f4f4f5;border:1px solid #343942;border-radius:12px;padding:12px\">" + U.escapeHtml(modal.payload) + "</textarea></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    if (modal.type === "titleChallengePreview") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Вызов чемпиону</h2><div class=\"muted small\">" + U.escapeHtml(modal.titleLabel) + " · " + U.escapeHtml(modal.weightClassLabel) + "</div></div><div class=\"modal-body\"><div class=\"grid two\"><div class=\"stat-card\"><div class=\"label\">Ты</div><div class=\"value\">" + modal.playerRating + "</div><div class=\"muted small\">" + U.escapeHtml(modal.playerRecord) + "</div></div><div class=\"stat-card\"><div class=\"label\">Чемпион</div><div class=\"value\">" + modal.championRating + "</div><div class=\"muted small\">" + U.escapeHtml(modal.championName) + " · " + U.escapeHtml(modal.championRecord) + "</div></div></div><div class=\"pills\"><span class=\"pill\">" + modal.rounds + " раунда</span><span class=\"pill gold\">$" + modal.purse + "</span><span class=\"pill blue\">Шанс " + modal.winChance + "%</span></div><div class=\"muted small\" style=\"margin-top:12px\">" + U.escapeHtml(modal.reason) + "</div></div><div class=\"modal-actions\"><button data-action=\"close-modal\">Отмена</button>" + (modal.eligible ? "<button class=\"primary\" data-accept-title-challenge=\"" + U.escapeHtml(modal.titleId) + "\">Бросить вызов</button>" : "") + "</div></div></div>";
    }

    if (modal.type === "tournamentFight") {
      return "<div class=\"modal-backdrop\"><div class=\"modal tournament-modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(modal.label) + "</h2><div class=\"muted small\">Этап: " + U.escapeHtml(modal.roundLabel) + " · " + (modal.roundIndex + 1) + "/" + modal.roundsTotal + "</div></div><div class=\"modal-body\"><div class=\"grid two\"><div class=\"stat-card\"><div class=\"label\">Ты</div><div class=\"value\">" + modal.playerRating + "</div></div><div class=\"stat-card\"><div class=\"label\">Соперник</div><div class=\"value\">" + modal.opponentRating + "</div><div class=\"muted small\">" + U.escapeHtml(modal.opponentName) + " · " + U.escapeHtml(modal.opponentCountry) + " · " + U.escapeHtml(modal.opponentRecord) + "</div></div></div><div class=\"pills\"><span class=\"pill blue\">Шанс " + modal.winChance + "%</span><span class=\"pill\">" + U.escapeHtml(modal.roundLabel) + "</span><button class=\"small-btn\" data-tournament-participants=\"1\">Участники</button></div></div><div class=\"modal-actions\"><button data-action=\"close-modal\">Выйти</button><button data-tournament-fight=\"1\">Пропустить бой</button><button class=\"primary\" data-tournament-ring=\"1\">Выйти на ринг</button></div></div></div>";
    }

    if (modal.type === "tournamentResult") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Результат турнира</h2><div class=\"muted small\">" + U.escapeHtml(modal.label) + " · " + U.escapeHtml(modal.roundLabel) + "</div></div><div class=\"modal-body\"><div class=\"big-result " + Fight.resultClass(modal.result) + "\">" + U.escapeHtml(modal.result) + "</div><div class=\"muted\">Соперник: " + U.escapeHtml(modal.opponentName) + " · OVR " + modal.opponentRating + "</div><div class=\"pills\"><span class=\"pill\">Метод: " + U.escapeHtml(modal.method) + "</span><span class=\"pill\">Счёт: " + U.escapeHtml(modal.scoreLine) + "</span><span class=\"pill blue\">Шанс до боя " + modal.winChance + "%</span><button class=\"small-btn\" data-tournament-participants=\"1\">Участники</button></div><div class=\"content-card\" style=\"margin-top:12px\"><div class=\"label\">Статистика</div><div class=\"muted small\">" + U.escapeHtml(modal.statsLine || "") + "</div></div><div class=\"content-card\" style=\"margin-top:12px\"><div class=\"label\">Раунды</div>" + (modal.roundLog || []).map(function (line) { return "<div class=\"muted small\">" + U.escapeHtml(line) + "</div>"; }).join("") + (modal.knockdown ? "<div class=\"pill red\" style=\"margin-top:10px\">Нокдаун: раунд " + modal.knockdown.round + "</div>" : "") + "</div></div><div class=\"modal-actions\"><button class=\"primary\" data-tournament-continue=\"1\">" + (modal.continueMode === "next" || modal.continueMode === "third" ? "Продолжить турнир" : "Завершить турнир") + "</button></div></div></div>";
    }

    if (modal.type === "tournamentFinal") {
      return "<div class=\"modal-backdrop\"><div class=\"modal tournament-modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(modal.label) + "</h2><div class=\"muted small\">" + (modal.blocked ? U.escapeHtml(modal.reason) : U.escapeHtml((modal.result || "") + (modal.place ? " · " + modal.place : ""))) + "</div></div><div class=\"modal-body\">" + (modal.blocked ? "" : "<div class=\"pills\"><span class=\"pill gold\">Награда $" + modal.reward + "</span><span class=\"pill\">Откат " + modal.cooldown + " нед.</span><button class=\"small-btn\" data-tournament-participants=\"1\">Участники</button></div><div class=\"content-card\" style=\"margin-top:12px\"><div class=\"label\">Пройденные бои</div>" + (modal.fights || []).map(function (fight) { return "<div class=\"split-row\"><span>" + U.escapeHtml(fight.round) + " · " + U.escapeHtml(fight.opponentName) + " · OVR " + fight.opponentRating + " · шанс " + fight.winChance + "%</span><strong>" + U.escapeHtml(fight.result) + "</strong></div>"; }).join("") + "</div>") + "</div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    if (modal.type === "fightPreview") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(modal.label) + "</h2><div class=\"muted small\">Предпросмотр боя · " + U.escapeHtml(modal.weightClassLabel) + "</div></div><div class=\"modal-body\"><div class=\"grid two\"><div class=\"stat-card\"><div class=\"label\">Ты</div><div class=\"value\">" + modal.playerRating + "</div><div class=\"muted small\">" + U.escapeHtml(modal.playerRecord) + "</div></div><div class=\"stat-card\"><div class=\"label\">Соперник</div><div class=\"value\">" + modal.opponentRating + "</div><div class=\"muted small\">" + U.escapeHtml(modal.opponentName) + " · " + U.escapeHtml(modal.opponentRecord) + "</div></div></div><div class=\"pills\"><span class=\"pill\">" + modal.rounds + " раунда</span><span class=\"pill gold\">$" + modal.purse + "</span><span class=\"pill blue\">Шанс " + modal.winChance + "%</span></div></div><div class=\"modal-actions\"><button data-action=\"close-modal\">Отмена</button><button data-skip-fight=\"" + U.escapeHtml(modal.offerId) + "\">Пропустить бой</button><button class=\"primary\" data-accept-fight=\"" + U.escapeHtml(modal.offerId) + "\">Выйти на ринг</button></div></div></div>";
    }

    if (modal.type === "fightResult") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Итог боя</h2><div class=\"muted small\">Неделя " + modal.week + " · " + U.escapeHtml(modal.opponentName) + "</div></div><div class=\"modal-body\">" +
        "<div class=\"big-result " + Fight.resultClass(modal.result) + "\">" + U.escapeHtml(modal.result) + "</div>" +
        "<div class=\"grid two\"><div class=\"content-card\"><h3>Кратко</h3><div class=\"split-row\"><span>Метод</span><strong>" + U.escapeHtml(modal.method) + "</strong></div><div class=\"split-row\"><span>Шанс до боя</span><strong>" + modal.winChance + "%</strong></div><div class=\"split-row\"><span>Гонорар</span><strong>$" + modal.purse + "</strong></div></div>" +
        "<div class=\"content-card\"><h3>Статистика</h3><div class=\"muted small\">" + U.escapeHtml(modal.statsLine || "Нет статистики.") + "</div></div></div>" +
        (modal.statsLine === "Бой решён автоматически." ? "" : "<div class=\"content-card\" style=\"margin-top:12px\"><h3>Лог ударов</h3>" + (modal.roundLog || []).slice(-80).map(function (line) { return "<div class=\"muted small\">" + U.escapeHtml(line) + "</div>"; }).join("") + "</div>") +
      "</div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Продолжить</button></div></div></div>";
    }

    return "";
  }


  function renderFightWindow(state) {
    var modal = state.modal;
    var body = "";

    function localStatBar(label, value, max) {
      var pct = max ? Math.max(0, Math.min(100, Math.round(value / max * 100))) : 0;
      return "<div class=\"fight-meter\"><span>" + U.escapeHtml(label) + "</span><div><i style=\"width:" + pct + "%\"></i></div><strong>" + value + "/" + max + "</strong></div>";
    }

    function localRing(data) {
      var cells = [];
      var size = data.ringSize || 5;
      var x;
      var y;
      var cls;
      var text;
      for (y = 0; y < size; y += 1) {
        for (x = 0; x < size; x += 1) {
          cls = "ring-cell";
          text = "";
          if (data.player.pos.x === x && data.player.pos.y === y) { cls += " player-cell"; text = "Ты"; }
          if (data.opponent.pos.x === x && data.opponent.pos.y === y) { cls += " opponent-cell"; text = "NPC"; }
          cells.push("<div class=\"" + cls + "\">" + text + "</div>");
        }
      }
      return "<div class=\"ring-grid\">" + cells.join("") + "</div>";
    }

    function localControls(data) {
      var actions = data.actions || [];
      var actionMap = {};
      actions.forEach(function (action) { actionMap[action.id] = action; });

      function punchButton(id) {
        var action = actionMap[id] || { id: id, label: id, enabled: true, damage: 0, chance: 0, stamina: 0, reason: "" };
        return "<button data-fight-action=\"" + U.escapeHtml(id) + "\"" + (action.enabled ? "" : " disabled") + ">" +
          U.escapeHtml(action.label) + "<small>урон " + action.damage + " · шанс " + action.chance + "% · стам. " + action.stamina + (action.reason ? " · " + U.escapeHtml(action.reason) : "") + "</small></button>";
      }

      return "<div class=\"fight-controls\">" +
        "<div class=\"move-pad\"><button data-fight-move=\"0,-1\">↑</button><button data-fight-move=\"-1,0\">←</button><button data-fight-move=\"1,0\">→</button><button data-fight-move=\"0,1\">↓</button></div>" +
        punchButton("jabHead") + punchButton("jabBody") + punchButton("hook") + punchButton("uppercut") +
        "<button data-fight-action=\"block\">Блок<small>эффективность падает при повторах</small></button>" +
        "<button data-fight-action=\"counter\"" + (data.canCounter ? "" : " disabled") + ">Контратака<small>нельзя два раза подряд</small></button>" +
      "</div>";
    }

    if (!modal) {
      body = "<div class=\"modal fight-modal\"><h2>Бой не найден</h2></div>";
    } else if (modal.type === "activeFight") {
      body = "<div class=\"modal fight-modal detached-fight\"><div class=\"modal-head\"><h2>Бой на ринге</h2><div class=\"muted small\">Раунд " + modal.round + "/" + modal.roundsTotal + " · ход " + modal.turn + " · окно боя закрывать нельзя до завершения</div></div><div class=\"modal-body\"><div class=\"fight-layout\"><div>" + localRing(modal) + localControls(modal) + "</div><div class=\"fight-side\"><h3>Ты</h3>" + localStatBar("HP", modal.player.hp, modal.player.maxHp) + localStatBar("Стамина", modal.player.stamina, modal.player.maxStamina) + "<h3>" + U.escapeHtml(modal.opponentName) + "</h3>" + localStatBar("HP", modal.opponent.hp, modal.opponent.maxHp) + localStatBar("Стамина", modal.opponent.stamina, modal.opponent.maxStamina) + "<div class=\"pills\"><span class=\"pill gold\">$" + modal.purse + "</span><span class=\"pill blue\">Шанс " + modal.winChance + "%</span></div><div class=\"fight-log\">" + modal.log.map(function (line) { return "<div>" + U.escapeHtml(line) + "</div>"; }).join("") + "</div></div></div></div></div>";
    } else if (modal.type === "fightCount") {
      body = "<div class=\"modal fight-modal detached-fight\"><div class=\"modal-head\"><h2>Нокдаун</h2><div class=\"muted small\">Счёт: " + modal.count + "/10</div></div><div class=\"modal-body\"><div class=\"fight-layout\"><div>" + localRing({ ringSize: 5, player: modal.player, opponent: modal.opponent }) + "<div class=\"big-result " + (modal.side === "opponent" ? "win" : "loss") + "\">" + (modal.side === "player" ? "Ты на настиле" : "Соперник на настиле") + "</div></div><div class=\"fight-side\">" + localStatBar("HP", modal.player.hp, modal.player.maxHp) + localStatBar("Стамина", modal.player.stamina, modal.player.maxStamina) + localStatBar("HP соперника", modal.opponent.hp, modal.opponent.maxHp) + localStatBar("Стамина соперника", modal.opponent.stamina, modal.opponent.maxStamina) + "<div class=\"fight-log\">" + modal.log.map(function (line) { return "<div>" + U.escapeHtml(line) + "</div>"; }).join("") + "</div></div></div></div><div class=\"modal-actions\"><button class=\"primary\" data-fight-count=\"1\">Продолжить счёт</button></div></div>";
    } else if (modal.type === "fightResult") {
      body = "<div class=\"modal\"><div class=\"modal-head\"><h2>Результат боя</h2></div><div class=\"modal-body\"><div class=\"big-result " + Fight.resultClass(modal.result) + "\">" + U.escapeHtml(modal.result) + "</div><div class=\"muted\">Неделя " + modal.week + " · соперник: " + U.escapeHtml(modal.opponentName) + "</div><div class=\"pills\"><span class=\"pill\">Метод: " + U.escapeHtml(modal.method) + "</span><span class=\"pill\">Счёт: " + U.escapeHtml(modal.scoreLine) + "</span><span class=\"pill gold\">Гонорар $" + modal.purse + "</span><span class=\"pill blue\">Шанс до боя " + modal.winChance + "%</span></div><div class=\"content-card\" style=\"margin-top:12px\"><div class=\"label\">Раунды</div>" + (modal.roundLog || []).map(function (line) { return "<div class=\"muted small\">" + U.escapeHtml(line) + "</div>"; }).join("") + "</div></div><div class=\"modal-actions\"><button class=\"primary\" data-close-fight-window=\"1\">Закрыть окно боя</button></div></div>";
    } else if (modal.type === "tournamentResult") {
      body = "<div class=\"modal\"><div class=\"modal-head\"><h2>Результат турнира</h2><div class=\"muted small\">" + U.escapeHtml(modal.label) + " · " + U.escapeHtml(modal.roundLabel) + "</div></div><div class=\"modal-body\"><div class=\"big-result " + Fight.resultClass(modal.result) + "\">" + U.escapeHtml(modal.result) + "</div><div class=\"muted\">Соперник: " + U.escapeHtml(modal.opponentName) + " · OVR " + modal.opponentRating + "</div><div class=\"pills\"><span class=\"pill\">Метод: " + U.escapeHtml(modal.method) + "</span><span class=\"pill\">Счёт: " + U.escapeHtml(modal.scoreLine) + "</span><span class=\"pill blue\">Шанс до боя " + modal.winChance + "%</span></div><div class=\"content-card\" style=\"margin-top:12px\"><div class=\"label\">Раунды</div>" + (modal.roundLog || []).map(function (line) { return "<div class=\"muted small\">" + U.escapeHtml(line) + "</div>"; }).join("") + "</div></div><div class=\"modal-actions\"><button class=\"primary\" data-tournament-continue=\"1\">" + (modal.continueMode === "next" || modal.continueMode === "third" ? "Продолжить турнир" : "Завершить турнир") + "</button></div></div>";
    } else if (modal.type === "tournamentFinal") {
      body = "<div class=\"modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(modal.label) + "</h2></div><div class=\"modal-body\"><div class=\"big-result win\">" + U.escapeHtml((modal.result || "") + (modal.place ? " · " + modal.place : "")) + "</div><div class=\"pills\"><span class=\"pill gold\">Награда $" + (modal.reward || 0) + "</span></div></div><div class=\"modal-actions\"><button class=\"primary\" data-close-fight-window=\"1\">Закрыть окно боя</button></div></div>";
    } else {
      body = "<div class=\"modal fight-modal\"><h2>Бой завершён</h2><button data-close-fight-window=\"1\">Закрыть</button></div>";
    }

    return "<!doctype html><html><head><meta charset=\"utf-8\"><title>Fight World — бой</title><link rel=\"stylesheet\" href=\"src/styles.css\"></head><body class=\"fight-window-body\"><div class=\"app-shell\">" + body + "</div><script>document.addEventListener('click',function(e){var b=e.target.closest('button'); if(!b||!window.opener||!window.opener.FSApp){return;} window.opener.FSApp.handleFightWindowButton(b.dataset);});</script></body></html>";
  }

  function renderDashboard(state) {
    return renderHeader(state) + renderMain(state) + renderModal(state);
  }

  window.FS.Render = {
    start: renderStartScreen,
    dashboard: renderDashboard,
    startCountryDropdown: function (countryId) { return countryDropdown(countryId || "russia", "data-start-country", "start-country-dropdown"); }
  };
}());
