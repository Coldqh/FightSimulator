(function () {
  "use strict";

  window.FS = window.FS || {};

  var Data = window.FS.Data;
  var U = window.FS.Utils;
  var State = window.FS.State;
  var Fight = window.FS.Fight;

  function renderSkillRow(label, value) {
    var max = 200;
    var safe = Math.max(1, Math.min(max, Math.round(Number(value) || 0)));
    var pct = Math.max(1, Math.min(100, Math.round(safe / max * 100)));
    var bgSize = Math.max(100, Math.round(10000 / pct));
    return "<div class=\"f1-skill-progress\"><div class=\"f1-skill-head\"><span>" + U.escapeHtml(label) + "</span><strong>" + safe + "/" + max + "</strong></div><div class=\"f1-skill-track\"><i style=\"width:" + pct + "%;background-size:" + bgSize + "% 100%\"></i></div></div>";
  }

  function flagEmoji(countryId) {
    var iso = f1CountryIso(countryId);
    var map = {
      ru:"🇷🇺", jp:"🇯🇵", us:"🇺🇸", gb:"🇬🇧", de:"🇩🇪", fr:"🇫🇷", es:"🇪🇸", it:"🇮🇹",
      nl:"🇳🇱", ca:"🇨🇦", mx:"🇲🇽", br:"🇧🇷", ar:"🇦🇷", cl:"🇨🇱", co:"🇨🇴", pe:"🇵🇪", cu:"🇨🇺",
      ie:"🇮🇪", pl:"🇵🇱", ua:"🇺🇦", by:"🇧🇾", md:"🇲🇩", ro:"🇷🇴", bg:"🇧🇬", rs:"🇷🇸", hr:"🇭🇷",
      gr:"🇬🇷", hu:"🇭🇺", lt:"🇱🇹", lv:"🇱🇻", ee:"🇪🇪", cz:"🇨🇿", sk:"🇸🇰", se:"🇸🇪", no:"🇳🇴",
      dk:"🇩🇰", fi:"🇫🇮", tr:"🇹🇷", kz:"🇰🇿", uz:"🇺🇿", kg:"🇰🇬", tj:"🇹🇯", tm:"🇹🇲", mn:"🇲🇳",
      cn:"🇨🇳", kr:"🇰🇷", kp:"🇰🇵", in:"🇮🇳", pk:"🇵🇰", ir:"🇮🇷", iq:"🇮🇶", sa:"🇸🇦", ae:"🇦🇪",
      qa:"🇶🇦", sy:"🇸🇾", jo:"🇯🇴", az:"🇦🇿", am:"🇦🇲", ge:"🇬🇪", au:"🇦🇺", nz:"🇳🇿", th:"🇹🇭",
      ph:"🇵🇭", id:"🇮🇩", vn:"🇻🇳", eg:"🇪🇬", ma:"🇲🇦", dz:"🇩🇿", tn:"🇹🇳", ng:"🇳🇬", za:"🇿🇦",
      ke:"🇰🇪", et:"🇪🇹"
    };
    return map[iso] || "🏳️";
  }

  function flagImg(countryId) {
    var iso = f1CountryIso(countryId);
    if (!iso || iso === "unknown") {
      return '<span class="flag-wrap"><span class="flag-code" style="display:inline-flex">--</span></span>';
    }
    return '<span class="flag-wrap"><img class="flag-png" src="assets/flags/' + U.escapeHtml(iso) + '.png" alt="" loading="eager" decoding="async" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-flex\';"><span class="flag-code">' + U.escapeHtml(iso) + '</span></span>';
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

  function f1OriginCountryId(fighter) {
    if (!fighter) { return ""; }
    return fighter.originCountryId || fighter.homeCountryId || fighter.nameCountryId || fighter.countryId || "";
  }

  function f1OriginCountryFull(fighter) {
    return f1CountryFull(f1OriginCountryId(fighter));
  }

  function f1CountryRouteBright(fighter) {
    var originId = f1OriginCountryId(fighter);
    var currentId = fighter ? (fighter.countryId || fighter.currentCountryId || originId) : originId;
    if (originId && currentId && originId !== currentId) {
      return '<span class="fighter-country-route bright-route">' + f1CountryBright(originId) + '<span class="country-arrow">→</span>' + f1CountryBright(currentId) + '</span>';
    }
    return f1CountryBright(currentId || originId);
  }

  function renderStatProgressRows(fighter) {
    return '<div class="f1-skill-list">' +
      renderSkillRow('Сила', fighter.stats.power) +
      renderSkillRow('Техника', fighter.stats.technique) +
      renderSkillRow('Скорость', fighter.stats.speed) +
      renderSkillRow('Выносливость', fighter.stats.stamina) +
      renderSkillRow('Защита / здоровье', fighter.stats.defense || fighter.stats.health) +
    '</div>';
  }

  

  function f1CoachFor(state, fighter) {
    if (!state || !fighter || !window.FS.Clubs || !window.FS.Clubs.findFighterCoach) { return null; }
    return window.FS.Clubs.findFighterCoach(state, fighter);
  }

  function f1CoachOvr(coach) {
    if (!coach) { return 0; }
    if (window.FS.Clubs && window.FS.Clubs.coachOvr) { return window.FS.Clubs.coachOvr(coach); }
    return Math.max(0, Math.min(100, Math.round(Number(coach.ovr) || 0)));
  }

  function f1CoachButton(state, fighter) {
    var coach = f1CoachFor(state, fighter);
    if (!coach) { return '<span class="muted small">не выбран</span>'; }
    return '<button class="small-btn coach-link-btn" data-person="' + U.escapeHtml(coach.id) + '">' + U.escapeHtml(coach.name) + '</button> <span class="pill">OVR ' + f1CoachOvr(coach) + '</span>';
  }

  function renderCoachStatsRows(coach) {
    var stats = coach && coach.stats ? coach.stats : {};
    function row(label, value) {
      var safe = Math.max(1, Math.min(100, Math.round(Number(value) || 0)));
      var pct = Math.max(1, Math.min(100, safe));
      return "<div class=\"f1-skill-progress\"><div class=\"f1-skill-head\"><span>" + U.escapeHtml(label) + "</span><strong>" + safe + "/100</strong></div><div class=\"f1-skill-track\"><i style=\"width:" + pct + "%\"></i></div></div>";
    }
    return '<div class="f1-skill-list">' +
      row('Техника', stats.technique || 1) +
      row('Физика', stats.conditioning || 1) +
      row('Тактика', stats.tactics || 1) +
      row('Угол', stats.corner || 1) +
      row('Развитие', stats.development || 1) +
    '</div>';
  }

  

  function f1EffectiveOvrText(base, bonus, total) {
    base = Math.round(Number(base) || 0);
    bonus = Math.ceil(Number(bonus) || 0);
    total = Math.round(Number(total) || base + bonus);
    return String(total);
  }


  function f1EffectiveOvrSubText(base, bonus) {
    base = Math.round(Number(base) || 0);
    bonus = Math.ceil(Number(bonus) || 0);
    return "базовый " + base + " + тренер " + bonus;
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
            '<label><div class="label">Имя бойца</div><input id="careerName" value="Aleksandr Sokolov" data-auto-name="1" maxlength="32"></label>' +
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
    var money = Number(p.money) || 0;
    var moneyText = money >= 1000000 ? (Math.round(money / 10000) / 100 + "м") : (money >= 1000 ? (Math.round(money / 100) / 10 + "к") : String(money));

    return '<header class="f1-status-panel">' +
      '<div class="f1-status-scroll">' +
        '<span class="f1-status-chip">' + U.escapeHtml(shortDateText(state)) + '</span>' +
        '<span class="f1-status-chip">' + f1CountryFull(p) + '</span>' +
        '<span class="f1-status-chip blue">OVR ' + U.statAverage(p.stats) + '</span>' +
        '<span class="f1-status-chip">' + U.escapeHtml(U.recordText(p.record)) + '</span>' +
        '<span class="f1-status-chip gold">$' + U.escapeHtml(moneyText) + '</span>' +
        '<span class="f1-status-chip red">Уст ' + (Number(p.fatigue) || 0) + '</span>' +
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
      ["history", "📜 История"],
      ["goals", "🎯 Цели"],
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
      tabs.splice(3, 0, ["fights", "🔥 Бои"]);
    }
    if (p.trackId === "pro") {
      tabs.splice(4, 0, ["pro", "💼 Профи"]);
    }
    if (p.trackId === "amateur") {
      tabs.splice(tabs.length - 2, 0, ["world", "🌍 Люб. путь"]);
    }

    return '<div class="tabs">' + tabs.map(function (tab) {
      return '<button class="' + (state.selectedTab === tab[0] ? 'active' : '') + '" data-tab="' + tab[0] + '">' + tab[1] + '</button>';
    }).join('') + '</div>';
  }

  function fighterFormInfo(fighter) {
    if (State.formForFighter) { return State.formForFighter(fighter); }
    return { label: "ровная", bonus: 0, status: "neutral" };
  }

  function fighterFormText(fighter) {
    var form = fighterFormInfo(fighter);
    var bonus = Number(form.bonus) || 0;
    return U.escapeHtml((form.label || "ровная") + (bonus ? " " + (bonus > 0 ? "+" : "") + bonus + "%" : ""));
  }

  function fighterFormMetric(fighter) {
    var form = fighterFormInfo(fighter);
    var bonus = Number(form.bonus) || 0;
    var cls = bonus > 0 ? "green" : (bonus < 0 ? "red" : "");
    return '<span class="f1-metric ' + cls + '">Форма ' + fighterFormText(fighter) + '</span>';
  }

  function fighterFormText(fighter) {
    var form = fighterFormInfo(fighter);
    var bonus = Number(form.bonus) || 0;
    return U.escapeHtml((form.label || "ровная") + (bonus ? " " + (bonus > 0 ? "+" : "") + bonus + "%" : ""));
  }

  function fighterFormMetric(fighter) {
    var form = fighterFormInfo(fighter);
    var bonus = Number(form.bonus) || 0;
    var cls = bonus > 0 ? "green" : (bonus < 0 ? "red" : "");
    return '<span class="f1-metric ' + cls + '">Форма ' + fighterFormText(fighter) + '</span>';
  }

  function renderFighterAwards(state, fighter) {
    var awards = State.getFighterAwards ? State.getFighterAwards(state, fighter) : (fighter.awards || []);
    var total;
    var visible;

    function medalIcon(award) {
      if (award.medal === "gold" || award.place === "1 место") { return "🥇"; }
      if (award.medal === "silver" || award.place === "2 место") { return "🥈"; }
      if (award.medal === "bronze" || award.place === "3 место") { return "🥉"; }
      return "";
    }

    function isPodiumAward(award) {
      var label = String((award && award.label) || "").toLowerCase();
      var place = String((award && (award.place || (award.meta && award.meta.place))) || "");
      var medal = String((award && award.medal) || "");
      if (!award) { return false; }
      if (["gold", "silver", "bronze"].indexOf(medal) !== -1) { return true; }
      if (place === "1 место" || place === "2 место" || place === "3 место") { return true; }
      return /победитель|серебро|бронза|золото|🥇|🥈|🥉/.test(label);
    }

    awards = (awards || []).filter(isPodiumAward);
    total = awards.length;
    visible = awards.slice(0, 12);

    if (!visible.length) {
      return "<div class=\"muted small\">Наград пока нет.</div>";
    }

    return visible.map(function (award) {
      var icon = medalIcon(award);
      return "<div class=\"split-row\"><span>" + icon + " " + U.escapeHtml(award.label) + "</span><strong>Неделя " + (award.week || "—") + "</strong></div>";
    }).join("") + (total > visible.length ? "<div class=\"muted small\">+ ещё " + (total - visible.length) + " наград</div>" : "");
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

  function f1ShortMoney(value) {
    value = Number(value) || 0;
    if (value >= 1000000) { return Math.round(value / 10000) / 100 + "м"; }
    if (value >= 1000) { return Math.round(value / 100) / 10 + "к"; }
    return String(value);
  }

  function f1FighterWeight(fighter) {
    if (!f1HasWeight(fighter)) { return ""; }
    return U.findWeightClass(fighter.weightClassId).label || "";
  }

  function f1FighterRank(fighter) {
    var rank;
    if (!fighter) { return ""; }
    if (State.rankForFighter) {
      rank = State.rankForFighter(fighter);
      if (rank && rank.label) { return rank.label; }
    }
    if (window.FS.Matchmaking && window.FS.Matchmaking.careerStage) {
      rank = window.FS.Matchmaking.careerStage(fighter);
      if (rank && rank.label) { return rank.label; }
    }
    return "";
  }

  function f1CountryCompact(fighter) {
    return fighterCountryLabel(fighter);
  }

  function f1FighterRow(state, fighter, options) {
    var ovr;
    var sub;
    var metrics;
    var action;
    var extraClass;
    options = options || {};
    if (!fighter) { return ""; }
    ovr = U.statAverage(fighter.stats);
    sub = options.subline || f1DefaultSubline(state, fighter, options);
    metrics = options.metrics || ['<span class="f1-metric ovr">OVR ' + ovr + '</span>'];
    if (options.money != null) {
      metrics.push('<span class="f1-metric money">$' + U.escapeHtml(f1ShortMoney(options.money)) + '</span>');
    }
    if (options.chance != null) {
      metrics.push('<span class="f1-metric chance">' + U.escapeHtml(options.chance) + '%</span>');
    }
    if (fighter.isPlayer) {
      metrics.unshift('<span class="f1-metric green">Ты</span>');
    }
    action = options.actionHtml || "";
    extraClass = options.className || "";
    return '<div class="f1-person-row ' + extraClass + '" data-row-fighter="' + U.escapeHtml(fighter.id) + '">' +
      '<div class="f1-row-left">' +
        '<div class="f1-row-name">' + U.escapeHtml(fighter.name) + '</div>' +
        '<div class="f1-row-sub">' + sub + '</div>' +
      '</div>' +
      '<div class="f1-row-right">' + metrics.join("") + action + '</div>' +
    '</div>';
  }

  function f1HasWeight(fighter) {
    return !!(fighter && fighter.trackId !== "street" && fighter.weightClassId);
  }

  function f1RankingPlace(state, fighter) {
    var countryId;
    var weightId;
    var list;
    var index;
    if (!state || !fighter || !State.ranking) { return "—"; }
    countryId = fighter.trackId === "pro" ? "world" : fighter.countryId;
    weightId = fighter.trackId === "street" ? "" : fighter.weightClassId;
    try {
      list = State.ranking(state, countryId, fighter.trackId, weightId) || [];
      index = list.findIndex(function (item) { return item && item.id === fighter.id; });
      return index >= 0 ? ("#" + (index + 1)) : "—";
    } catch (error) {
      return "—";
    }
  }

  function f1AmateurRank(fighter) {
    var rank;
    if (!fighter || fighter.trackId !== "amateur") { return ""; }
    if (State.rankForFighter) {
      rank = State.rankForFighter(fighter);
      if (rank && rank.label) { return rank.label; }
    }
    return "Любитель";
  }

  function f1StatusText(state, fighter) {
    if (!fighter) { return "—"; }
    if (fighter.trackId === "amateur") { return f1AmateurRank(fighter) || "Любитель"; }
    return f1RankingPlace(state, fighter);
  }

  function f1StatusLabel(fighter) {
    return fighter && fighter.trackId === "amateur" ? "Разряд" : "Рейтинг";
  }

  function f1StatusHtml(state, fighter) {
    var text = f1StatusText(state, fighter);
    if (fighter && fighter.trackId === "amateur") {
      return '<button class="f1-rank-button" data-path-rank-info="amateur">' + U.escapeHtml(text) + '</button>';
    }
    return U.escapeHtml(text);
  }

  function f1DefaultSubline(state, fighter, opts) {
    var parts;
    var countryPart;
    opts = opts || {};
    countryPart = opts.countryMode === "flag" ? f1FlagOnly(fighter) : f1CountryFull(fighter);
    parts = [
      fighter.age ? fighter.age + " лет" : "возраст —",
      countryPart,
      U.escapeHtml(U.recordText(fighter.record))
    ];
    if (f1HasWeight(fighter) && opts.showWeight !== false) { parts.push(U.escapeHtml(f1FighterWeight(fighter))); }
    if (opts.showStatus) { parts.push(U.escapeHtml(f1StatusText(state, fighter))); }
    if (opts.extra) { parts.push(opts.extra); }
    return parts.filter(Boolean).join(" · ");
  }

  function f1NormalizeKey(value) {
    return String(value || "").toLowerCase().replace(/[ё]/g, "е").replace(/[^a-zа-я0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  function f1PrimaryCountryId(fighterOrId) {
    if (!fighterOrId) { return ""; }
    if (typeof fighterOrId === "string") { return fighterOrId; }
    return fighterOrId.countryId || fighterOrId.currentCountryId || fighterOrId.homeCountryId || "";
  }

  function f1CountryName(countryId) {
    var country = U.findCountry ? U.findCountry(countryId) : null;
    return (country && country.label) || (country && country.name) || countryId || "—";
  }

  function f1CountryFull(countryId) {
    countryId = f1PrimaryCountryId(countryId);
    return '<span class="country-label">' + flagImg(countryId) + '<span>' + U.escapeHtml(f1CountryName(countryId)) + '</span></span>';
  }

  function f1CountryBright(countryId) {
    countryId = f1PrimaryCountryId(countryId);
    return '<span class="f1-country-bright">' + flagImg(countryId) + '<span>' + U.escapeHtml(f1CountryName(countryId)) + '</span></span>';
  }

  function f1FlagOnly(countryId) {
    countryId = f1PrimaryCountryId(countryId);
    return '<span class="country-label only-flag">' + flagImg(countryId) + '<span>' + U.escapeHtml(f1CountryName(countryId)) + '</span></span>';
  }

  function f1CountryIso(countryId) {
    var country = U.findCountry ? U.findCountry(countryId) : null;
    var keys = [
      f1NormalizeKey(countryId),
      f1NormalizeKey(country && country.label),
      f1NormalizeKey(country && country.name),
      f1NormalizeKey(country && country.shortLabel)
    ];
    var map = {
      ru:"ru", russia:"ru", rossiya:"ru", россия:"ru",
      jp:"jp", japan:"jp", япония:"jp",
      us:"us", usa:"us", united_states:"us", сша:"us",
      gb:"gb", uk:"gb", britain:"gb", england:"gb", великобритания:"gb", англия:"gb",
      de:"de", germany:"de", германия:"de",
      fr:"fr", france:"fr", франция:"fr",
      es:"es", spain:"es", испания:"es",
      it:"it", italy:"it", италия:"it",
      nl:"nl", netherlands:"nl", нидерланды:"nl", holland:"nl",
      ca:"ca", canada:"ca", канада:"ca",
      mx:"mx", mexico:"mx", мексика:"mx",
      br:"br", brazil:"br", бразилия:"br",
      ar:"ar", argentina:"ar", аргентина:"ar",
      cl:"cl", chile:"cl", чили:"cl",
      co:"co", colombia:"co", колумбия:"co",
      pe:"pe", peru:"pe", перу:"pe",
      cu:"cu", cuba:"cu", куба:"cu",
      ie:"ie", ireland:"ie", ирландия:"ie",
      pl:"pl", poland:"pl", польша:"pl",
      ua:"ua", ukraine:"ua", украина:"ua",
      by:"by", belarus:"by", беларусь:"by",
      md:"md", moldova:"md", молдова:"md",
      ro:"ro", romania:"ro", румыния:"ro",
      bg:"bg", bulgaria:"bg", болгария:"bg",
      rs:"rs", serbia:"rs", сербия:"rs",
      hr:"hr", croatia:"hr", хорватия:"hr",
      gr:"gr", greece:"gr", греция:"gr",
      hu:"hu", hungary:"hu", венгрия:"hu",
      lt:"lt", lithuania:"lt", литва:"lt",
      lv:"lv", latvia:"lv", латвия:"lv",
      ee:"ee", estonia:"ee", эстония:"ee",
      cz:"cz", czechia:"cz", czech_republic:"cz", чехия:"cz",
      sk:"sk", slovakia:"sk", словакия:"sk",
      se:"se", sweden:"se", швеция:"se",
      no:"no", norway:"no", норвегия:"no",
      dk:"dk", denmark:"dk", дания:"dk",
      fi:"fi", finland:"fi", финляндия:"fi",
      tr:"tr", turkey:"tr", турция:"tr",
      kz:"kz", kazakhstan:"kz", казахстан:"kz",
      uz:"uz", uzbekistan:"uz", узбекистан:"uz",
      kg:"kg", kyrgyzstan:"kg", киргизия:"kg", кыргызстан:"kg",
      tj:"tj", tajikistan:"tj", таджикистан:"tj",
      tm:"tm", turkmenistan:"tm", туркменистан:"tm",
      mn:"mn", mongolia:"mn", монголия:"mn",
      cn:"cn", china:"cn", китай:"cn",
      kr:"kr", korea:"kr", south_korea:"kr", южная_корея:"kr", корея:"kr",
      kp:"kp", north_korea:"kp", северная_корея:"kp",
      in:"in", india:"in", индия:"in",
      pk:"pk", pakistan:"pk", пакистан:"pk",
      ir:"ir", iran:"ir", иран:"ir",
      iq:"iq", iraq:"iq", ирак:"iq",
      sa:"sa", saudi_arabia:"sa", саудовская_аравия:"sa",
      ae:"ae", uae:"ae", оаэ:"ae",
      qa:"qa", qatar:"qa", катар:"qa",
      sy:"sy", syria:"sy", сирия:"sy",
      jo:"jo", jordan:"jo", иордания:"jo",
      az:"az", azerbaijan:"az", азербайджан:"az",
      am:"am", armenia:"am", армения:"am",
      ge:"ge", georgia:"ge", грузия:"ge",
      au:"au", australia:"au", австралия:"au",
      nz:"nz", new_zealand:"nz", новая_зеландия:"nz",
      th:"th", thailand:"th", таиланд:"th",
      ph:"ph", philippines:"ph", филиппины:"ph",
      id:"id", indonesia:"id", индонезия:"id",
      vn:"vn", vietnam:"vn", вьетнам:"vn",
      eg:"eg", egypt:"eg", египет:"eg",
      ma:"ma", morocco:"ma", марокко:"ma",
      dz:"dz", algeria:"dz", алжир:"dz",
      tn:"tn", tunisia:"tn", тунис:"tn",
      ng:"ng", nigeria:"ng", нигерия:"ng",
      za:"za", south_africa:"za", юар:"za", южная_африка:"za",
      ke:"ke", kenya:"ke", кения:"ke",
      et:"et", ethiopia:"et", эфиопия:"et",
      ec:"ec", ecuador:"ec", эквадор:"ec",
      do:"do", dominican_republic:"do", dominicana:"do", доминикана:"do", доминиканская_республика:"do",
      pr:"pr", puerto_rico:"pr", пуэрто_рико:"pr", пурто_рико:"pr",
      gh:"gh", ghana:"gh", гана:"gh",
      ug:"ug", uganda:"ug", уганда:"ug",
      tz:"tz", tanzania:"tz", танзания:"tz",
      cm:"cm", cameroon:"cm", камерун:"cm",
      sn:"sn", senegal:"sn", сенегал:"sn",
      my:"my", malaysia:"my", малайзия:"my",
      be:"be", belgium:"be", бельгия:"be",
      il:"il", israel:"il", израиль:"il",
      ly:"ly", libya:"ly", ливия:"ly",
      ao:"ao", angola:"ao", ангола:"ao",
      mz:"mz", mozambique:"mz", мозамбик:"mz",
      zw:"zw", zimbabwe:"zw", зимбабве:"zw",
      zm:"zm", zambia:"zm", замбия:"zm",
      cd:"cd", dr_congo:"cd", democratic_republic_of_congo:"cd", д_р_конго:"cd", др_конго:"cd", демократическая_республика_конго:"cd",
      ci:"ci", cote_d_ivoire:"ci", ivory_coast:"ci", котдивуар:"ci", кот_д_ивуар:"ci",
      ml:"ml", mali:"ml", мали:"ml",
      bf:"bf", burkina_faso:"bf", буркина_фасо:"bf",
      uy:"uy", uruguay:"uy", уругвай:"uy",
      py:"py", paraguay:"py", парагвай:"py",
      bo:"bo", bolivia:"bo", боливия:"bo",
      cr:"cr", costa_rica:"cr", коста_рика:"cr",
      pa:"pa", panama:"pa", панама:"pa",
      ni:"ni", nicaragua:"ni", никарагуа:"ni",
      hn:"hn", honduras:"hn", гондурас:"hn",
      gt:"gt", guatemala:"gt", гватемала:"gt",
      sv:"sv", el_salvador:"sv", salvador:"sv", сальвадор:"sv",
      ht:"ht", haiti:"ht", гаити:"ht",
      jm:"jm", jamaica:"jm", ямайка:"jm",
      tt:"tt", trinidad_and_tobago:"tt", тринидад_и_тобаго:"tt"
    };
    for (var i = 0; i < keys.length; i += 1) {
      if (map[keys[i]]) { return map[keys[i]]; }
    }
    if (keys[0] && /^[a-z]{2}$/.test(keys[0])) { return keys[0]; }
    return "unknown";
  }

  function f1EscapeRegExp(value) {
    return String(value).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
  }

  function f1AllFighters(state) {
    var out = [];
    var seen = {};
    function add(fighter) {
      if (!fighter || !fighter.id || seen[fighter.id]) { return; }
      seen[fighter.id] = true;
      out.push(fighter);
    }
    (state.roster || []).forEach(add);
    (state.fighters || []).forEach(add);
    (state.retiredFighters || []).forEach(add);
    if (state.world) {
      (state.world.roster || []).forEach(add);
      (state.world.fighters || []).forEach(add);
      if (state.world.fightersById) {
        Object.keys(state.world.fightersById).forEach(function (id) { add(state.world.fightersById[id]); });
      }
    }
    return out;
  }

  function f1AllCoaches(state) {
    var out = [];
    var seen = {};
    function add(coach) {
      if (!coach || !coach.id || !coach.name || seen[coach.id]) { return; }
      seen[coach.id] = true;
      out.push(coach);
    }
    (state.clubs || []).forEach(function (club) {
      if (!club) { return; }
      add(club.coach);
      (club.coaches || []).forEach(add);
    });
    if (state.world && state.world.teamCoaches) {
      Object.keys(state.world.teamCoaches).forEach(function (countryId) { add(state.world.teamCoaches[countryId]); });
    }
    if (state.world && state.world.teamsByCountry) {
      Object.keys(state.world.teamsByCountry).forEach(function (countryId) { add(state.world.teamsByCountry[countryId] && state.world.teamsByCountry[countryId].coach); });
    }
    return out;
  }

  function f1AllClubs(state) {
    return (state.clubs || []).filter(function (club) { return club && club.id && club.name; });
  }

  function f1ReplaceLinkedNames(html, items, attrName) {
    var usedNames = {};
    items
      .filter(function (item) { return item && item.name; })
      .sort(function (a, b) { return String(b.name).length - String(a.name).length; })
      .forEach(function (item) {
        var escapedName;
        var rx;
        if (usedNames[item.name]) { return; }
        usedNames[item.name] = true;
        escapedName = U.escapeHtml(item.name);
        rx = new RegExp(f1EscapeRegExp(escapedName), "g");
        html = html.replace(rx, '<button class="f1-news-link" ' + attrName + '="' + U.escapeHtml(item.id) + '">' + escapedName + '</button>');
      });
    return html;
  }

  function f1NewsText(state, item) {
    var text = String((item && item.text) || "");
    var html = U.escapeHtml(text);
    var meta = item && item.meta ? item.meta : {};
    var fighters = f1AllFighters(state).filter(function (fighter) { return fighter.name && text.indexOf(fighter.name) !== -1; });
    var coaches = f1AllCoaches(state).filter(function (coach) { return coach.name && text.indexOf(coach.name) !== -1; });
    var clubs = f1AllClubs(state).filter(function (club) { return club.name && text.indexOf(club.name) !== -1; });

    if (meta.fighterId) {
      var metaFighter = U.getFighterById(state, meta.fighterId);
      if (metaFighter) { fighters.push(metaFighter); }
    }
    if (meta.coachId) {
      f1AllCoaches(state).forEach(function (coach) { if (coach.id === meta.coachId) { coaches.push(coach); } });
    }
    if (meta.clubId) {
      f1AllClubs(state).forEach(function (club) { if (club.id === meta.clubId) { clubs.push(club); } });
    }
    if (meta.fromClubId) {
      f1AllClubs(state).forEach(function (club) { if (club.id === meta.fromClubId) { clubs.push(club); } });
    }

    html = f1ReplaceLinkedNames(html, clubs, "data-club");
    html = f1ReplaceLinkedNames(html, coaches, "data-person");
    html = f1ReplaceLinkedNames(html, fighters, "data-fighter");
    return html;
  }

  function renderFavoriteFighters(state) {
    var ids = Array.isArray(state.trackedFighterIds) ? state.trackedFighterIds : [];
    var fighters = ids.map(function (id) { return U.getFighterById(state, id); }).filter(function (fighter) { return fighter && !fighter.retired; });
    if (!fighters.length) {
      return "<div class=\"content-card favorites-card\"><h3>Избранные</h3><div class=\"muted small\">Пока нет бойцов.</div></div>";
    }
    return "<div class=\"content-card favorites-card\"><div class=\"split-row\"><h3>Избранные</h3><strong>" + fighters.length + "</strong></div><div class=\"f1-row-list\">" +
      fighters.slice(0, 12).map(function (fighter) {
        return f1FighterRow(state, fighter, { countryMode: "flag", showStatus: true, className: "favorite-row" });
      }).join("") +
    "</div></div>";
  }

  function f1FatigueActionBlocked(state) {
    var p = State.player(state);
    var limit = Data.economy && Data.economy.fatigue ? (Number(Data.economy.fatigue.actionLockAbove) || 75) : 75;
    return !!(p && (Number(p.fatigue) || 0) > limit);
  }

  function f1FatigueDisabledAttr(state) {
    return f1FatigueActionBlocked(state) ? ' disabled title="Усталость выше 75/100"' : '';
  }

  

  function relationshipEffectHtml(effect) {
    var value = Number(effect && effect.value) || 0;
    var label = effect && effect.label ? effect.label : effect.type;
    var good;
    var text;
    if (!value) { return ""; }
    good = (effect.type === "fatigue" || effect.type === "money") ? value < 0 : value > 0;
    text = (value > 0 ? "+" : "") + value + " " + label;
    return '<span class="f1-metric ' + (good ? 'green' : 'red') + '">' + U.escapeHtml(text) + '</span>';
  }

  function relationshipScoreText(person) {
    var score = Number(person && person.relationship) || 0;
    return 'Отношение: ' + score + '/100';
  }

  function renderRelationshipEventCard(state) {
    var event = state.relationshipEvent || null;
    if (!event) { return ""; }

    function optionHtml(option) {
      var effects = (option.effects || []).map(relationshipEffectHtml).filter(Boolean).join('');
      return '<button class="relationship-choice-btn" data-relationship-choice="' + U.escapeHtml(option.id) + '"><span>' + U.escapeHtml(option.label) + '</span><small>' + effects + '</small></button>';
    }

    return '<div class="content-card relationship-event-card"><div class="split-row"><h3>Событие общения</h3><strong>' + U.escapeHtml(event.personName || '') + '</strong></div>' +
      '<div class="name-line">' + U.escapeHtml(event.title || 'Событие') + '</div>' +
      '<div class="muted small">' + U.escapeHtml(event.text || '') + '</div>' +
      '<div class="relationship-choice-list">' + (event.options || []).map(optionHtml).join('') + '</div>' +
    '</div>';
  }

  function renderCareerStatsCard(state) {
    var p = State.player(state);
    var stats = p && p.careerStats ? p.careerStats : {};
    var rematchLine = (Number(stats.rematchWins) || 0) + "-" + (Number(stats.rematchLosses) || 0) + "-" + (Number(stats.rematchDraws) || 0);
    var tournamentLine = (Number(stats.tournamentWins) || 0) + "-" + (Number(stats.tournamentLosses) || 0) + "-" + (Number(stats.tournamentDraws) || 0);
    if (!p) { return ""; }
    return '<div class="content-card"><h3>Мини-статистика</h3>' +
      '<div class="split-row"><span>Текущая серия побед</span><strong>' + (Number(stats.currentWinStreak) || 0) + '</strong></div>' +
      '<div class="split-row"><span>Лучшая серия побед</span><strong>' + (Number(stats.bestWinStreak) || 0) + '</strong></div>' +
      '<div class="split-row"><span>Победы над сильнее себя</span><strong>' + (Number(stats.strongerWins) || 0) + '</strong></div>' +
      '<div class="split-row"><span>Лучший побеждённый OVR</span><strong>' + (Number(stats.bestDefeatedOvr) || 0) + '</strong></div>' +
      '<div class="split-row"><span>Турнирные бои</span><strong>' + U.escapeHtml(tournamentLine) + '</strong></div>' +
      '<div class="split-row"><span>Всего турнирных боёв</span><strong>' + (Number(stats.totalTournamentFights) || 0) + '</strong></div>' +
      '<div class="split-row"><span>Реванши</span><strong>' + U.escapeHtml(rematchLine) + '</strong></div>' +
    '</div>';
  }

  function renderCareerMilestonesCard(state, mode) {
    var list = State.careerMilestones ? State.careerMilestones(state) : [];
    var active = list.filter(function (item) { return !item.done; });
    var completed = list.filter(function (item) { return item.done; }).sort(function (left, right) { return (Number(right.week) || 0) - (Number(left.week) || 0); });
    var currentMode = mode || "active";
    var rows;

    function activeRow(item) {
      return '<div class="split-row"><span>· ' + U.escapeHtml(item.label) + '</span><strong>+' + (Number(item.rewardPoints) || 0) + ' очк. · $' + (Number(item.rewardMoney) || 0) + '</strong></div>';
    }

    function doneRow(item) {
      return '<div class="split-row"><span>✓ ' + U.escapeHtml(item.label) + '</span><strong>нед. ' + (item.week || '—') + ' · +' + (Number(item.rewardPoints) || 0) + ' очк. · $' + (Number(item.rewardMoney) || 0) + '</strong></div>';
    }

    if (currentMode === "completed") {
      rows = completed.length ? completed.map(doneRow).join("") : '<div class="muted small">Выполненных карьерных вех пока нет.</div>';
      return '<div class="content-card"><h3>Выполненные вехи</h3><div class="split-row"><span>Выполнено</span><strong>' + completed.length + '/' + list.length + '</strong></div>' + rows + '</div>';
    }

    rows = active.length ? active.map(activeRow).join("") : '<div class="muted small">Активных карьерных вех пока нет.</div>';
    return '<div class="content-card"><h3>Активные вехи</h3><div class="split-row"><span>Осталось</span><strong>' + active.length + '</strong></div>' + rows + '</div>';
  }

  function renderCoachGoalCard(state) {
    var goal;
    var progress;
    var target;
    var percent;
    var reward;
    var nextWeek;

    if (State.normalizeGoalSystems) { State.normalizeGoalSystems(state); }
    goal = state.coachGoal || null;

    if (!goal && State.ensureCoachGoal) {
      goal = State.ensureCoachGoal(state);
    }

    if (!goal) {
      nextWeek = Number(state.nextCoachGoalWeek) || 0;
      return '<div class="content-card"><h3>Цель тренера</h3><div class="muted small">' + (nextWeek && state.week < nextWeek ? ('Новая цель появится на ' + nextWeek + ' неделе.') : 'Активной цели тренера нет.') + '</div></div>';
    }

    progress = Math.max(0, Number(goal.progress) || 0);
    target = Math.max(1, Number(goal.target) || 1);
    percent = Math.max(0, Math.min(100, Math.round((progress / target) * 100)));
    reward = '+' + (Number(goal.rewardPoints) || 0) + ' очко, $' + (Number(goal.rewardMoney) || 0);

    return '<div class="content-card coach-goal-card"><div class="split-row"><h3>Цель тренера</h3><strong>до недели ' + (goal.dueWeek || '—') + '</strong></div>' +
      '<div class="split-row"><span>' + U.escapeHtml(goal.label || 'Задача') + '</span><strong>' + Math.min(progress, target) + '/' + target + '</strong></div>' +
      '<div class="progress"><span style="width:' + percent + '%"></span></div>' +
      '<div class="split-row"><span>Награда</span><strong>' + U.escapeHtml(reward) + '</strong></div>' +
    '</div>';
  }

  function renderGoalsTab(state) {
    var sub = state.goalsSubTab || "active";
    if (["active", "completed", "coach"].indexOf(sub) === -1) {
      sub = "active";
      state.goalsSubTab = sub;
    }

    function subButton(id, label) {
      return '<button class="small-btn ' + (sub === id ? 'primary' : '') + '" data-goals-subtab="' + id + '">' + label + '</button>';
    }

    return '<div class="content-card goals-subtabs"><div class="row">' +
      subButton("active", "Активные") +
      subButton("completed", "Выполнено") +
      subButton("coach", "Цель тренера") +
    '</div></div>' +
    '<div class="goals-tab-body">' +
      (sub === "completed" ? renderCareerMilestonesCard(state, "completed") : (sub === "coach" ? renderCoachGoalCard(state) : renderCareerMilestonesCard(state, "active"))) +
    '</div>';
  }

  function renderDashboardTab(state) {
    var p = State.player(state);
    var club = window.FS.Clubs ? window.FS.Clubs.playerClub(state) : null;
    var breakdown = State.monthlyExpenseBreakdown ? State.monthlyExpenseBreakdown(state) : { total: 0 };
    var trainingDisabled = f1FatigueDisabledAttr(state);

    return '<div class="grid two dashboard-grid">' +
      '<div class="content-card"><h3>Текущее положение</h3>' +
        '<div class="split-row"><span>Путь</span><strong>' + U.escapeHtml(U.findTrack(p.trackId).label) + '</strong></div>' +
        '<div class="split-row"><span>Вес</span><strong>' + (p.trackId === 'street' ? 'Без весовых категорий' : U.escapeHtml(U.findWeightClass(p.weightClassId).label)) + '</strong></div>' +
        '<div class="split-row"><span>Клуб</span><strong>' + U.escapeHtml(club ? club.name : 'Без клуба') + '</strong></div>' +
        '<div class="split-row"><span>Рекорд</span><strong>' + U.escapeHtml(U.recordText(p.record)) + '</strong></div>' +
        '<div class="split-row"><span>Форма</span><strong>' + fighterFormText(p) + '</strong></div>' +
        '<div class="split-row"><span>Баланс</span><strong>$' + (p.money || 0) + '</strong></div>' +
        '<div class="split-row"><span>Очки прокачки</span><strong>' + (p.trainingPoints || 0) + '</strong></div>' +
        '<div class="split-row"><span>Ежемесячные расходы</span><strong>$' + (breakdown.total || 0) + '</strong></div>' +
        '<div class="row dashboard-actions" style="margin-top:12px"><button data-action="next-week">Следующая неделя</button><button class="primary" data-action="train-week"' + trainingDisabled + '>Тренировка</button></div>' +
      '</div>' +
      renderCareerStatsCard(state) +
    '</div>';
  }

  function renderProfileTab(state) {
    var p = State.player(state);
    var club = window.FS.Clubs ? window.FS.Clubs.playerClub(state) : null;
    var weightText = f1FighterWeight(p);

    return '<div class="grid two">' +
      '<div class="f1-profile-hero" style="grid-column:1/-1">' +
        '<div class="f1-profile-top">' +
          '<div class="f1-profile-title">' +
            '<h2>' + U.escapeHtml(p.name) + '</h2>' +
            '<div class="f1-profile-sub">' +
              '<span class="pill flag-mini">' + f1CountryRouteBright(p) + '</span>' +
              '<span class="pill">' + U.escapeHtml(U.findTrack(p.trackId).label) + '</span>' +
              (weightText ? '<span class="pill">' + U.escapeHtml(weightText) + '</span>' : '') +
            '</div>' +
          '</div>' +
          '<div class="f1-profile-ovr"><strong>' + U.statAverage(p.stats) + '</strong><span>OVR</span></div>' +
        '</div>' +
        '<div class="f1-profile-grid">' +
          '<div class="f1-profile-stat"><span>Рекорд</span><strong>' + U.escapeHtml(U.recordText(p.record)) + '</strong></div>' +
          '<div class="f1-profile-stat"><span>Форма</span><strong>' + fighterFormText(p) + '</strong></div>' +
          '<div class="f1-profile-stat"><span>Возраст</span><strong>' + p.age + '</strong></div>' +
          '<div class="f1-profile-stat"><span>Страна</span><strong>' + f1CountryRouteBright(p) + '</strong></div>' +
          '<div class="f1-profile-stat"><span>Тренер</span><strong>' + f1CoachButton(state, p) + '</strong></div>' +
          '<div class="f1-profile-stat"><span>' + f1StatusLabel(p) + '</span><strong>' + f1StatusHtml(state, p) + '</strong></div>' +
        '</div>' +
      '</div>' +
      '<div class="content-card f1-gym-card"><h3>Зал</h3>' + (club ? '<button class="f1-gym-button" data-club="' + U.escapeHtml(club.id) + '">' + U.escapeHtml(club.name) + '</button>' : '<div class="f1-gym-name">Без клуба</div>') + '</div>' +
      '<div class="content-card"><h3>' + (p.trackId === 'amateur' ? 'Награды' : 'Титулы') + '</h3>' + (p.trackId === 'amateur' ? renderFighterAwards(state, p) : renderFighterTitles(state, p)) + '</div>' +
      '<div class="skills" style="grid-column:1/-1"><div class="label">Навыки</div>' + renderStatProgressRows(p) + '</div>' +
      renderTrackRecords(p) +
      '<div class="content-card profile-actions-card" style="grid-column:1/-1"><h3>Управление карьерой</h3><div class="row"><button class="primary" data-profile-modal="travel">Перелёт</button><button data-profile-modal="weight">Смена веса</button><button data-profile-modal="path">Смена пути</button></div></div>' +
    '</div>';
  }

  function historyFilterOptions() {
    return [
      ["all", "Все"],
      ["regular", "Обычные"],
      ["tournaments", "Турниры"],
      ["wins", "Победы"],
      ["losses", "Поражения"],
      ["stronger", "Над сильнее"],
      ["rematches", "Реванши"],
      ["ko", "KO/TKO"]
    ];
  }

  function filteredFightHistory(state, fighter) {
    var filter = state.historyFilter || "all";
    var history;
    if (State.normalizeFightHistory) { State.normalizeFightHistory(state, fighter); }
    history = fighter && fighter.fightHistory instanceof Array ? fighter.fightHistory : [];

    return history.filter(function (entry) {
      if (!entry) { return false; }
      if (filter === "regular") { return !entry.isTournament; }
      if (filter === "tournaments") { return !!entry.isTournament; }
      if (filter === "wins") { return entry.result === "Победа"; }
      if (filter === "losses") { return entry.result === "Поражение"; }
      if (filter === "stronger") { return !!entry.strongerWin; }
      if (filter === "rematches") { return !!entry.isRematch; }
      if (filter === "ko") { return String(entry.method || "").toLowerCase().indexOf("ko") !== -1 || String(entry.method || "").indexOf("KO") !== -1; }
      return true;
    });
  }

  function renderHistoryFilters(state) {
    var current = state.historyFilter || "all";
    return '<div class="content-card history-filter-card"><h3>Фильтр</h3><div class="row history-filter-row">' +
      historyFilterOptions().map(function (item) {
        return '<button class="small-btn ' + (current === item[0] ? 'primary' : '') + '" data-history-filter="' + item[0] + '">' + item[1] + '</button>';
      }).join('') +
    '</div></div>';
  }

  function renderFightHistoryStatsCard(state, fighter) {
    var history;
    var total;
    var tournament;
    var stronger;
    var ko;
    var lastFive;
    if (State.normalizeFightHistory) { State.normalizeFightHistory(state, fighter); }
    history = fighter && fighter.fightHistory instanceof Array ? fighter.fightHistory : [];
    total = history.length;
    tournament = history.filter(function (entry) { return entry && entry.isTournament; }).length;
    stronger = history.filter(function (entry) { return entry && entry.strongerWin; }).length;
    ko = history.filter(function (entry) {
      return entry && (String(entry.method || "").toLowerCase().indexOf("ko") !== -1 || String(entry.method || "").indexOf("KO") !== -1);
    }).length;
    lastFive = history.slice(0, 5).map(function (entry) {
      if (entry.result === "Победа") { return "В"; }
      if (entry.result === "Поражение") { return "П"; }
      return "Н";
    }).join("-") || "—";

    return '<div class="content-card history-stats-card"><h3>Сводка истории</h3>' +
      '<div class="split-row"><span>Всего боёв</span><strong>' + total + '</strong></div>' +
      '<div class="split-row"><span>Турнирные</span><strong>' + tournament + '</strong></div>' +
      '<div class="split-row"><span>Победы над сильнее</span><strong>' + stronger + '</strong></div>' +
      '<div class="split-row"><span>KO/TKO</span><strong>' + ko + '</strong></div>' +
      '<div class="split-row"><span>Последние 5</span><strong>' + U.escapeHtml(lastFive) + '</strong></div>' +
    '</div>';
  }

  function renderFightHistoryCard(state, fighter, limit) {
    var history = filteredFightHistory(state, fighter);
    var filterLabel = (historyFilterOptions().find(function (item) { return item[0] === (state.historyFilter || "all"); }) || ["all", "Все"])[1];

    if (!history.length) {
      return '<div class="content-card" style="grid-column:1/-1"><div class="split-row"><h3>История боёв</h3><strong>' + U.escapeHtml(filterLabel) + '</strong></div><div class="muted small">По этому фильтру боёв нет.</div></div>';
    }

    function row(entry) {
      var opponentButton = entry.opponentId ? '<button class="small-btn" data-fighter="' + U.escapeHtml(entry.opponentId) + '">' + U.escapeHtml(entry.opponentName || "Соперник") + '</button>' : U.escapeHtml(entry.opponentName || "Соперник");
      var context = entry.isTournament ? ('Турнир: ' + (entry.tournamentName || 'турнир') + (entry.roundLabel ? ' · ' + entry.roundLabel : '')) : (entry.source === "contract" ? "Контрактный бой" : "Обычный бой");
      var ovrLine = 'OVR ' + (Number(entry.playerOvr) || 0) + ' vs ' + (Number(entry.opponentOvr) || 0);
      var tags = [];
      if (entry.strongerWin) { tags.push('<span class="pill gold">победа над сильнее</span>'); }
      if (entry.isRematch) { tags.push('<span class="pill blue">реванш</span>'); }
      if (entry.method) { tags.push('<span class="pill">' + U.escapeHtml(entry.method) + '</span>'); }

      return '<div class="f1-history-row fight-history-row">' +
        '<div class="f1-history-week">Неделя ' + (entry.week || '—') + '</div>' +
        '<div class="f1-history-text"><div class="split-row"><span><strong>' + U.escapeHtml(entry.result || '—') + '</strong> · ' + opponentButton + '</span><strong>' + U.escapeHtml(ovrLine) + '</strong></div>' +
        '<div class="muted small">' + U.escapeHtml(context) + '</div>' +
        '<div class="row">' + tags.join('') + '</div></div>' +
      '</div>';
    }

    return '<div class="content-card" style="grid-column:1/-1"><div class="split-row"><h3>История боёв</h3><strong>' + history.length + ' · ' + U.escapeHtml(filterLabel) + '</strong></div><div class="f1-history-list">' +
      history.slice(0, limit || 80).map(row).join('') +
    '</div></div>';
  }

  function renderHistoryTab(state) {
    var p = State.player(state);
    return '<div class="grid two history-tab-grid">' +
      renderHistoryFilters(state) +
      renderFightHistoryStatsCard(state, p) +
      renderFightHistoryCard(state, p, 80) +
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

    function textForEntry(entry) {
      var text = entry && entry.text ? entry.text : "";
      var ids = entryFighterIds(state, fighter, entry);
      var html = interactiveText(state, text, ids);
      if (!ids.length && entry && entry.meta && entry.meta.opponentId) {
        ids.push(entry.meta.opponentId);
      }
      return html;
    }

    return '<div class="f1-history-list">' + fighter.careerLog.slice(0, limit || 8).map(function (entry) {
      return '<div class="f1-history-row"><div class="f1-history-week">Неделя ' + (entry.week || '—') + '</div><div class="f1-history-text">' + textForEntry(entry) + '</div></div>';
    }).join('') + '</div>';
  }

  function renderFavoritesTab(state) {
    var ids = Array.isArray(state.trackedFighterIds) ? state.trackedFighterIds : [];
    var fighters = ids.map(function (id) { return U.getFighterById(state, id); }).filter(function (fighter) { return fighter && !fighter.retired; });
    if (!fighters.length) {
      return '<div class="content-card"><h3>Избранные</h3><div class="muted small">Пусто.</div></div>';
    }
    return '<div class="content-card"><div class="split-row"><h3>Избранные</h3><strong>' + fighters.length + '</strong></div><div class="f1-row-list favorite-tab-list">' + fighters.map(function (fighter) {
      return f1FighterRow(state, fighter, { countryMode: "flag", showStatus: true, className: "favorite-tab-row" });
    }).join('') + '</div></div>';
  }

  function renderFightsTab(state) {
    var p = State.player(state);
    var offers = (state.offers || []).filter(function (offer) { return !offer.isCompetition && offer.opponentId; });
    var competitions = (state.offers || []).filter(function (offer) { return offer && offer.isCompetition; });
    var invite = state.world && state.world.pendingTournamentInvite;
    var fatigueDisabled = f1FatigueDisabledAttr(state);

    function fightRow(offer) {
      var opponent = U.getFighterById(state, offer.opponentId);
      var preview = Fight.buildFightPreview(state, offer.id);
      var metrics;
      if (!opponent || !preview) { return ""; }
      metrics = ['<span class="f1-metric ovr">OVR ' + U.statAverage(opponent.stats) + '</span>'];
      if (State.formForFighter && State.formChanceBonus && State.formChanceBonus(opponent)) {
        metrics.push(fighterFormMetric(opponent));
      }
      if (State.formForFighter && State.formChanceBonus && State.formChanceBonus(opponent)) {
        metrics.push(fighterFormMetric(opponent));
      }
      if (offer.isRematch || offer.label === "Реванш") {
        metrics.unshift('<span class="f1-metric gold">Реванш</span>');
      }
      return f1FighterRow(state, opponent, {
        className: "f1-driver-row" + ((offer.isRematch || offer.label === "Реванш") ? " rematch-row" : ""),
        showWeight: false,
        showStatus: false,
        metrics: metrics,
        subline: [
          opponent.age ? opponent.age + " лет" : "возраст —",
          f1CountryFull(opponent),
          U.escapeHtml(U.recordText(opponent.record)),
          (offer.isRematch || offer.label === "Реванш") ? '<span class="pill gold">бой-реванш</span>' : ''
        ].filter(Boolean).join(" · "),
        money: preview.purse,
        chance: preview.winChance,
        actionHtml: '<button class="f1-fight-btn" data-preview-fight="' + U.escapeHtml(offer.id) + '"' + fatigueDisabled + '>Бой</button>'
      });
    }

    function competitionRow(offer) {
      var title = offer.label || offer.name || offer.competitionLabel || "Турнир";
      var subtitle = offer.roundLabel || offer.description || "доступен";
      var id = offer.competitionId || offer.tournamentId || offer.id || "";
      return '<div class="f1-tournament-row">' +
        '<div class="f1-tournament-title"><strong>' + U.escapeHtml(title) + '</strong><span>' + U.escapeHtml(subtitle) + '</span></div>' +
        '<span class="f1-metric money">Турнир</span>' +
        '<button data-amateur-competition="' + U.escapeHtml(id) + '"' + fatigueDisabled + '>Открыть</button>' +
      '</div>';
    }

    function inviteRow() {
      if (!invite || invite.ignored) { return ""; }
      return '<div class="f1-tournament-row">' +
        '<div class="f1-tournament-title"><strong>' + U.escapeHtml(invite.label || "Доступен турнир") + '</strong><span>' + U.escapeHtml(invite.reason || "можно принять заявку") + '</span></div>' +
        '<button data-tournament-invite="ignore">Скрыть</button>' +
        '<button class="primary" data-tournament-invite="accept"' + fatigueDisabled + '>Принять</button>' +
      '</div>';
    }

    return '<div class="f1-fights-top">' +
        '<div class="f1-section-head"><h3>Бои</h3><button class="small-btn" data-action="refresh-offers">Обновить</button></div>' +
        (f1FatigueActionBlocked(state) ? '<div class="muted small fatigue-warning">Усталость выше 75/100. Бои и турниры закрыты, пропусти неделю или отдохни.</div>' : '') +
        inviteRow() +
        (p.trackId === "amateur" ? competitions.map(competitionRow).join("") : "") +
      '</div>' +
      '<div class="f1-fight-list">' + offers.map(fightRow).join("") + '</div>';
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
    var points = Number(p.trainingPoints) || 0;
    var amounts = [1, 3, 5, 10, 20];

    function statRow(stat) {
      return '<div class="training-row">' +
        '<div class="training-actions">' + amounts.map(function (amount) {
          var disabled = points < amount ? ' disabled' : '';
          return '<button class="training-add-btn" data-train-stat="' + U.escapeHtml(stat.id) + '" data-train-amount="' + amount + '"' + disabled + '>+' + amount + '</button>';
        }).join('') + '</div>' +
        '<span class="training-name">' + U.escapeHtml(stat.label) + '</span>' +
        '<span class="training-value">' + (p.stats[stat.id] || 0) + '</span>' +
      '</div>';
    }

    return '<div class="content-card training-card"><h3>Характеристики</h3><div class="split-row"><span>Очки прокачки</span><strong>' + points + '</strong></div><div class="split-row"><span>Усталость</span><strong>' + (p.fatigue || 0) + '/100</strong></div>' +
      '<div class="training-list">' + Data.statKeys.map(statRow).join('') + '</div></div>';
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
    var countryGroup = state.rankingTrackId === "pro" ? "" :
      "<div class=\"filter-group compact-country-filter selected-filter\"><span class=\"filter-title\">Страна</span>" +
      countryDropdown(state.rankingCountryId, "data-ranking-country", "ranking-country-dropdown") +
      "</div>";

    var weightGroup = state.rankingTrackId === "street" ? "" :
      "<div class=\"filter-group selected-filter\"><span class=\"filter-title\">Вес</span>" +
      Data.weightClasses.map(function (weightClass) {
        return "<button class=\"small-btn " + (state.rankingWeightClassId === weightClass.id ? "active selected-filter-btn" : "") + "\" data-ranking-weight=\"" + weightClass.id + "\">" + U.escapeHtml(weightClass.label) + "</button>";
      }).join("") +
      "</div>";

    return "<div class=\"filters ranking-filters\">" + countryGroup + "<div class=\"filter-group selected-filter\"><span class=\"filter-title\">Путь</span>" +
      Object.keys(Data.tracks).map(function (trackId) {
        return "<button class=\"small-btn " + (state.rankingTrackId === trackId ? "active selected-filter-btn" : "") + "\" data-ranking-track=\"" + trackId + "\">" + U.escapeHtml(Data.tracks[trackId].label) + "</button>";
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
      var parts = [
        (fighter.age ? fighter.age + " лет" : "возраст —"),
        '<span class="ranking-origin">' + f1OriginCountryFull(fighter) + '</span>',
        U.escapeHtml(U.recordText(fighter.record))
      ];
      if (fighter.trackId === 'amateur') { parts.push(U.escapeHtml(f1AmateurRank(fighter))); }
      return parts.join(' · ');
    }

    function crowns(fighter) {
      if (!titleMap[fighter.id]) { return ''; }
      return titleMap[fighter.id].map(function (title) {
        return '👑' + (title.bodyId ? title.bodyId.toUpperCase() : '');
      }).join(' ');
    }

    function rowHtml(fighter, label, isChampion) {
      return '<div class="f1-person-row ranking-row" data-row-fighter="' + U.escapeHtml(fighter.id) + '">' +
        '<div class="f1-row-left">' +
          '<div class="f1-row-name">' + (isChampion && crowns(fighter) ? crowns(fighter) + ' ' : '') + U.escapeHtml(fighter.name) + '</div>' +
          '<div class="f1-row-sub">' + fighterSubline(fighter) + '</div>' +
        '</div>' +
        '<div class="f1-row-right"><span class="f1-metric">' + U.escapeHtml(label) + '</span>' + (fighter.isPlayer ? '<span class="f1-metric green">Ты</span>' : '') + '<span class="f1-metric ovr">OVR ' + U.statAverage(fighter.stats) + '</span></div>' +
      '</div>';
    }

    return '<div class="content-card"><h3>Рейтинг' + (state.rankingTrackId === 'pro' ? ' · мир' : '') + '</h3>' + renderRankingFilters(state) +
      '<div class="split-row"><span>Страница ' + (page + 1) + ' / ' + totalPages + ' · бойцов: ' + contenders.length + '</span><span><button class="small-btn" data-ranking-page="' + Math.max(0, page - 1) + '"' + (page <= 0 ? ' disabled' : '') + '>Назад</button> <button class="small-btn" data-ranking-page="' + Math.min(totalPages - 1, page + 1) + '"' + (page >= totalPages - 1 ? ' disabled' : '') + '>Вперёд</button></span></div>' +
      '<div class="ranking-list f1-row-list">' +
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

    function coachCount(item) {
      return item && item.coaches instanceof Array ? item.coaches.length : (item && item.coach ? 1 : 0);
    }

    function coachRow(coach) {
      var active = p.coachId === coach.id;
      return '<div class="split-row coach-choice-row"><div><button class="small-btn" data-person="' + U.escapeHtml(coach.id) + '">' + U.escapeHtml(coach.name) + '</button><div class="muted small">' + f1CountryRouteBright(coach) + ' · OVR ' + f1CoachOvr(coach) + ' · ' + U.escapeHtml(U.recordText(coach.record || { wins:0, losses:0, draws:0 })) + '</div></div><span>' + (active ? '<span class="pill green">твой тренер</span>' : '<button class="small-btn primary" data-select-coach="' + U.escapeHtml(coach.id) + '">Выбрать</button>') + '</span></div>';
    }

    function clubRow(item, actionHtml) {
      return '<div class="f1-person-row club-card-row" data-row-club="' + U.escapeHtml(item.id) + '">' +
        '<div class="f1-row-left">' +
          '<div class="f1-row-name">' + U.escapeHtml(item.name) + '</div>' +
          '<div class="f1-row-sub">' + f1CountryFull(item.countryId) + ' · ур. ' + item.level + ' · тренеров ' + coachCount(item) + ' · OVR ' + item.minOvr + '–' + item.maxOvr + ' · x' + item.trainingModifier + '</div>' +
        '</div>' +
        '<div class="f1-row-right">' + (actionHtml || '<span class="f1-metric ovr">Ур. ' + item.level + '</span>') + '</div>' +
      '</div>';
    }

    if (club) {
      var coaches = club.coaches instanceof Array && club.coaches.length ? club.coaches : (club.coach ? [club.coach] : []);
      return '<div class="content-card"><div class="f1-card-hero"><div class="f1-card-title"><h3>' + U.escapeHtml(club.name) + '</h3><span class="f1-metric ovr">Ур. ' + club.level + '</span></div><div class="f1-card-sub">' + f1CountryFull(club.countryId) + ' · тренеров ' + coaches.length + ' · x' + club.trainingModifier + ' очков</div></div>' +
        '<div class="content-card inner-card"><h3>Выбор тренера</h3>' + coaches.map(coachRow).join("") + '</div>' +
        '<div class="row" style="margin-top:12px"><button class="small-btn primary" data-club="' + U.escapeHtml(club.id) + '">Ростер</button><button class="danger" data-action="leave-club">Покинуть клуб</button></div>' +
      '</div>';
    }

    return '<div class="content-card"><h3>Мой клуб</h3><div class="club-filter-row">' + levelButtons + '</div><div class="f1-row-list club-select-list">' + shown.slice(0, 16).map(function (item) {
      return clubRow(item, '<button class="f1-row-action" data-join-club="' + U.escapeHtml(item.id) + '">Взять</button>');
    }).join('') + '</div></div>';
  }

  function renderClubCountryFilters(state) {
    return "<div class=\"filter-group compact-country-filter\"><span class=\"filter-title\">Страна</span>" +
      countryDropdown(state.rankingCountryId, "data-ranking-country", "club-country-dropdown") +
    "</div>";
  }

  function renderClubsTab(state) {
    var clubs = (state.clubs || []).filter(function (club) { return club.countryId === state.rankingCountryId; });
    function coachCount(club) {
      return club && club.coaches instanceof Array ? club.coaches.length : (club && club.coach ? 1 : 0);
    }
    return '<div class="content-card"><h3>Клубы</h3><div class="filters">' + renderClubCountryFilters(state) + '</div><div class="f1-row-list club-browser-list">' + clubs.map(function (club) {
      return '<div class="f1-person-row club-browser-row" data-row-club="' + U.escapeHtml(club.id) + '">' +
        '<div class="f1-row-left">' +
          '<div class="f1-row-name">' + U.escapeHtml(club.name) + '</div>' +
          '<div class="f1-row-sub">' + f1CountryFull(club.countryId) + ' · ур. ' + club.level + ' · тренеров ' + coachCount(club) + ' · OVR ' + club.minOvr + '–' + club.maxOvr + '</div>' +
        '</div>' +
        '<div class="f1-row-right"><span class="f1-metric ovr">Ур. ' + club.level + '</span></div>' +
      '</div>';
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

    return "<div class=\"content-card team-card\">" +
      "<div class=\"f1-card-hero\">" +
        "<div class=\"f1-card-title\"><h3>Сборная " + f1CountryFull(country.id) + "</h3><span class=\"f1-metric ovr\">" + ((team.main || []).length) + "/12</span></div>" +
        "<div class=\"f1-card-sub\">Тренер: " + coachButton + " · резерв: " + ((team.reserve || []).length) + " / 48</div>" +
      "</div>" +
      (strongest ? "<div class=\"f1-row-list\">" + f1FighterRow(state, strongest, { countryMode: "flag", showWeight: false, showStatus: true }) + "</div>" : "") +
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
    var homeId = p.homeCountryId || p.originCountryId || p.countryId;
    var selectedTeamId = state.selectedTeamCountryId || homeId;
    var comps = window.FS.Amateur ? window.FS.Amateur.availableCompetitions(state) : [];
    var fatigueDisabled = f1FatigueDisabledAttr(state);

    function renderCompetition(comp) {
      var disabled = comp.available ? fatigueDisabled : ' disabled';
      return '<div class="split-row tournament-row"><div><div class="name-line">' + U.escapeHtml(comp.label) + '</div><div class="muted small">OVR ' + comp.minRating + '–' + comp.maxRating + ' · +' + comp.rewardRating + ' · ' + U.escapeHtml(tournamentWeeksOnly(comp)) + '</div></div><span>' + (comp.available ? '<button class="small-btn primary" data-amateur-competition="' + U.escapeHtml(comp.id) + '"' + disabled + '>Начать турнир</button>' : '<span class="pill">закрыто</span>') + '</span></div>';
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
    if (!news.length) {
      return '<div class="content-card"><h3>Новости</h3><div class="muted small">Пусто.</div></div>';
    }
    return '<div class="content-card"><h3>Новости</h3><div class="news-list">' + news.slice(0, 80).map(function (item) {
      return '<div class="f1-news-row"><div class="f1-news-week">Неделя ' + U.escapeHtml(item.week) + '</div><div class="f1-news-text">' + f1NewsText(state, item) + '</div>' + (item.tone ? '<div class="f1-news-tag">' + U.escapeHtml(item.tone) + '</div>' : '') + '</div>';
    }).join('') + '</div></div>';
  }

  function renderPeopleTab(state) {
    var people = state.people instanceof Array ? state.people.filter(function (person) { return person && person.id; }) : [];
    var roleLabels = Data.peopleRoles || { coach: "Тренер", playerCoach: "Тренер", clubmate: "Одноклубник", formerOpponent: "Бывший соперник", rival: "Соперник", promoter: "Промоутер", teamCoach: "Тренер сборной" };
    if (State.normalizeRelationships) { State.normalizeRelationships(state); }
    if (!people.length) {
      return renderRelationshipEventCard(state) + "<div class=\"content-card\"><h3>Люди</h3><div class=\"muted small\">Пока никого нет. Выбери зал — сюда добавятся тренер и иногда одноклубники.</div></div>";
    }
    return renderRelationshipEventCard(state) + "<div class=\"content-card\"><h3>Люди</h3><div class=\"people-list\">" + people.map(function (person) {
      var relation = Number(person.relationship) || 0;
      var last = person.lastInteraction ? '<div class=\"muted small\">Последнее: ' + U.escapeHtml(person.lastInteraction) + '</div>' : '';
      return "<div class=\"split-row\"><div><button class=\"small-btn\" data-person=\"" + U.escapeHtml(person.id) + "\">" + U.escapeHtml(person.name || "Без имени") + "</button><div class=\"muted small\">" + U.escapeHtml(person.note || "") + "</div>" + last + "</div><span><span class=\"pill\">" + U.escapeHtml(roleLabels[person.role] || person.role || "Контакт") + "</span><span class=\"pill\">Отношение " + relation + "/100</span></span></div>";
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
    else if (tab === "history") { content = renderHistoryTab(state); }
    else if (tab === "goals") { content = renderGoalsTab(state); }
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
            moreItem('goals', '🎯', 'Цели') +
            moreItem('history', '📜', 'История') +
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
    var roster;
    var strongest;
    var p;
    var coaches;
    var coach;
    var coachButton;

    if (!club || !club.id) {
      return '<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>Клуб не найден</h2></div><div class="modal-body"><div class="content-card">Данные клуба устарели. Открой настройки и нажми починку сохранения.</div></div><div class="modal-actions"><button data-action="close-modal">Закрыть</button></div></div></div>';
    }

    if (window.FS.Clubs && window.FS.Clubs.ensureClubs) {
      try { window.FS.Clubs.ensureClubs(state); } catch (error) { console.warn("ensureClubs before club modal failed:", error); }
    }

    club = window.FS.Clubs && window.FS.Clubs.findClub ? (window.FS.Clubs.findClub(state, club.id) || club) : club;
    roster = window.FS.Clubs && window.FS.Clubs.clubRoster ? window.FS.Clubs.clubRoster(state, club.id).slice(0, 40) : [];
    strongest = window.FS.Clubs && window.FS.Clubs.strongestFighter ? window.FS.Clubs.strongestFighter(state, club.id) : null;
    p = State.player(state);
    coaches = [];
    if (club.coach && club.coach.id) { coaches.push(club.coach); }
    if (club.coaches instanceof Array) {
      club.coaches.forEach(function (item) {
        if (item && item.id && !coaches.some(function (existing) { return existing.id === item.id; })) { coaches.push(item); }
      });
    }
    coach = coaches[0] || { name: club.coachName || "Тренер", age: "—", record: { wins: 0, losses: 0, draws: 0, kos: 0 }, id: "" };
    coachButton = coach.id ? "<button class=\"small-btn\" data-person=\"" + U.escapeHtml(coach.id) + "\">" + U.escapeHtml(coach.name) + "</button>" : U.escapeHtml(coach.name || "Тренер");

    function rosterRow(fighter) {
      return f1FighterRow(state, fighter, { countryMode: "flag", showStatus: true, className: "club-roster-row" });
    }

    function coachRow(item, index) {
      var canPick;
      if (!item || !item.id) { return ""; }
      canPick = p && p.gymId === club.id && p.coachId !== item.id;
      return '<div class="split-row coach-row"><div><button class="small-btn" data-person="' + U.escapeHtml(item.id) + '">' + U.escapeHtml(item.name || "Тренер") + '</button><div class="muted small">' + (index === 0 ? 'Главный тренер' : 'Тренер') + ' · ' + f1CountryRouteBright(item) + ' · OVR ' + f1CoachOvr(item) + ' · бойцов ' + (Number(item.assignedCount) || 0) + '</div></div><span>' + (p && p.coachId === item.id ? '<span class="pill green">твой тренер</span>' : (canPick ? '<button class="small-btn primary" data-select-coach="' + U.escapeHtml(item.id) + '">Выбрать</button>' : '<span class="pill">' + U.escapeHtml(U.recordText(item.record || { wins:0, losses:0, draws:0, kos:0 })) + '</span>')) + '</span></div>';
    }

    return '<div class="modal-backdrop"><div class="modal club-profile-modal">' +
      '<div class="modal-head"><h2>' + U.escapeHtml(club.name || "Клуб") + '</h2><div class="muted small">' + f1CountryFull(club.countryId) + ' · уровень ' + (club.level || 1) + ' · тренеров ' + coaches.length + ' · OVR ' + (club.minOvr || 0) + '–' + (club.maxOvr || 0) + '</div></div>' +
      '<div class="modal-body">' +
        '<div class="f1-card-hero">' +
          '<div class="f1-card-title"><h3>Клуб</h3><span class="f1-metric ovr">Ур. ' + (club.level || 1) + '</span></div>' +
          '<div class="f1-card-sub">Главный тренер: ' + coachButton + ' · тренеров: ' + coaches.length + ' · сильнейший: ' + (strongest ? U.escapeHtml(strongest.name) : '—') + '</div>' +
        '</div>' +
        '<div class="content-card"><h3>Тренеры</h3>' + (coaches.length ? coaches.map(coachRow).join("") : '<div class="muted small">Тренеры пересоздадутся после починки мира.</div>') + '</div>' +
        '<div class="content-card"><div class="split-row"><span>Ростер</span><strong>' + roster.length + '+</strong></div><div class="f1-row-list">' + roster.map(rosterRow).join("") + '</div></div>' +
      '</div>' +
      '<div class="modal-actions"><button data-action="close-modal">Закрыть</button></div>' +
    '</div></div>';
  }

  function renderFighterModal(state, fighter) {
    var weightText = f1FighterWeight(fighter);
    var club = window.FS.Clubs ? window.FS.Clubs.findClub(state, fighter.gymId) : null;
    var ovr = U.statAverage(fighter.stats);

    return '<div class="modal-backdrop"><div class="modal fighter-profile-modal">' +
      '<div class="modal-body">' +
        '<div class="f1-profile-hero">' +
          '<div class="f1-profile-top">' +
            '<div class="f1-profile-title">' +
              '<h2>' + U.escapeHtml(fighter.name) + '</h2>' +
              '<div class="f1-profile-sub">' +
                '<span class="pill flag-mini">' + f1CountryRouteBright(fighter) + '</span>' +
                '<span class="pill">' + U.escapeHtml(U.findTrack(fighter.trackId).label) + '</span>' +
                (weightText ? '<span class="pill">' + U.escapeHtml(weightText) + '</span>' : '') +
                (fighter.retired ? '<span class="pill red">завершил</span>' : '') +
              '</div>' +
            '</div>' +
            '<div class="f1-profile-ovr"><strong>' + ovr + '</strong><span>OVR</span></div>' +
          '</div>' +
          '<div class="f1-profile-grid">' +
            '<div class="f1-profile-stat"><span>Рекорд</span><strong>' + U.escapeHtml(U.recordText(fighter.record)) + '</strong></div>' +
            '<div class="f1-profile-stat"><span>Форма</span><strong>' + fighterFormText(fighter) + '</strong></div>' +
            '<div class="f1-profile-stat"><span>Возраст</span><strong>' + fighter.age + '</strong></div>' +
            '<div class="f1-profile-stat"><span>Страна</span><strong>' + f1CountryRouteBright(fighter) + '</strong></div>' +
            '<div class="f1-profile-stat"><span>Тренер</span><strong>' + f1CoachButton(state, fighter) + '</strong></div>' +
            '<div class="f1-profile-stat"><span>' + f1StatusLabel(fighter) + '</span><strong>' + f1StatusHtml(state, fighter) + '</strong></div>' +
          '</div>' +
          '<div class="row">' + (!fighter.isPlayer ? favoriteButton(state, fighter.id) : '') + '</div>' +
        '</div>' +
        '<div class="content-card f1-gym-card" style="margin-top:12px"><h3>Зал</h3>' + (club ? '<button class="f1-gym-button" data-club="' + U.escapeHtml(club.id) + '">' + U.escapeHtml(club.name) + '</button>' : '<div class="f1-gym-name">Без клуба</div>') + '</div>' +
        '<div class="skills" style="margin-top:12px"><div class="label">Навыки</div>' + renderStatProgressRows(fighter) + '</div>' +
        '<div class="content-card" style="margin-top:12px"><h3>Награды</h3>' + renderFighterAwards(state, fighter) + '</div>' +
        '<div class="content-card" style="margin-top:12px"><h3>Титулы</h3>' + renderFighterTitles(state, fighter) + '</div>' +
        '<div class="content-card" style="margin-top:12px"><h3>История карьеры</h3>' + renderCareerLog(state, fighter, 10) + '</div>' +
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

      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + title + "</h2><div class=\"muted small\">" + f1CountryFull(country.id) + " · страница " + (safePage + 1) + "/" + totalPages + "</div></div><div class=\"modal-body\"><div class=\"f1-row-list\">" +
        visible.map(function (id) {
          var f = U.getFighterById(state, id);
          if (!f) { return ""; }
          return f1FighterRow(state, f, { countryMode: "flag", showStatus: true, className: "team-roster-row" });
        }).join("") +
        "</div></div><div class=\"modal-actions\"><button data-team-page=\"" + Math.max(0, safePage - 1) + "\"" + (safePage <= 0 ? " disabled" : "") + ">Назад</button><button data-team-page=\"" + Math.min(totalPages - 1, safePage + 1) + "\"" + (safePage >= totalPages - 1 ? " disabled" : "") + ">Вперёд</button><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    function renderTeamCardModal(countryId) {
      var country = U.findCountry(countryId);
      var team = state.world.teamsByCountry[country.id] || { main: [], reserve: [], coach: null };
      var roster = (team.main || []).map(function (id) { return U.getFighterById(state, id); }).filter(Boolean);
      var reserve = (team.reserve || []).map(function (id) { return U.getFighterById(state, id); }).filter(Boolean);

      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Сборная " + f1CountryFull(country.id) + "</h2><div class=\"muted small\">" + U.escapeHtml(country.continentLabel || "") + "</div></div><div class=\"modal-body\">" +
        renderTeamCardHtml(state, country.id, true) +
        "<div class=\"content-card\" style=\"margin-top:12px\"><div class=\"split-row\"><span>Ростер</span><strong>" + roster.length + "</strong></div><div class=\"f1-row-list\">" +
        roster.slice(0, 12).map(function (fighter) { return f1FighterRow(state, fighter, { countryMode: "flag", showStatus: true, className: "team-card-row" }); }).join("") +
        "</div></div>" +
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
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Усталость выше 75/100</h2></div><div class=\"modal-body\"><div class=\"content-card\">Боец перегружен. Сейчас нельзя тренироваться, драться и идти в турниры. Остальные разделы работают.</div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"rest-week\">Отдых</button></div></div></div>";
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
      var person = (state.people || []).find(function (item) { return item && item.id === modal.personId; });
      var coach = window.FS.Clubs && window.FS.Clubs.findCoach ? window.FS.Clubs.findCoach(state, modal.personId) : null;

      function coachCareerLog(coach) {
        var log = coach && coach.careerLog instanceof Array ? coach.careerLog : [];
        if (!log.length) { return '<div class="muted small">Пока без заметных событий.</div>'; }
        return '<div class="f1-history-list">' + log.slice(0, 10).map(function (entry) {
          return '<div class="f1-history-row"><div class="f1-history-week">Неделя ' + (entry.week || '—') + '</div><div class="f1-history-text">' + U.escapeHtml(entry.text || '') + '</div></div>';
        }).join('') + '</div>';
      }

      if (person && person.personType === "fighter" && person.fighterId) {
        fighter = U.getFighterById(state, person.fighterId);
        return fighter ? renderFighterModal(state, fighter) : "";
      }

      if (!person && coach) {
        person = { id: coach.id, name: coach.name, personType: "coach", role: coach.role || "coach", clubId: coach.clubId || "", countryId: coach.countryId || coach.currentCountryId || coach.homeCountryId || coach.originCountryId || "" };
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

      if (!person && !coach) {
        return '<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>Профиль не найден</h2></div><div class="modal-body"><div class="content-card">Запись устарела или была удалена из мира.</div></div><div class="modal-actions"><button class="primary" data-action="close-modal">Закрыть</button></div></div></div>';
      }

      if (!coach && window.FS.Clubs && window.FS.Clubs.findCoach) { coach = window.FS.Clubs.findCoach(state, person.id); }
      var pClub = coach && coach.clubId && window.FS.Clubs ? window.FS.Clubs.findClub(state, coach.clubId) : null;
      var coachCountryId = (coach && (coach.countryId || coach.currentCountryId || coach.homeCountryId || coach.originCountryId)) || (person && person.countryId) || "";
      var coachCountry = coachCountryId ? U.findCountry(coachCountryId) : null;
      var coachRole = person && person.personType === "teamCoach" ? "Тренер сборной" : (person && person.role === "headCoach" ? "Главный тренер" : (person && person.role === "playerCoach" ? "Личный тренер" : "Тренер"));
      if (coach && (!coach.stats || f1CoachOvr(coach) <= 1) && coach.ovr) { coach.stats = { technique: coach.ovr, conditioning: coach.ovr, tactics: coach.ovr, corner: coach.ovr, development: coach.ovr }; }

      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml((person && person.name) || (coach && coach.name) || "Тренер") + "</h2><div class=\"muted small\">" + coachRole + "</div></div><div class=\"modal-body\"><div class=\"f1-profile-hero\"><div class=\"f1-profile-top\"><div class=\"f1-profile-title\"><h2>OVR " + (coach ? f1CoachOvr(coach) : "—") + "</h2></div></div><div class=\"f1-profile-grid\"><div class=\"f1-profile-stat\"><span>Страна</span><strong>" + (coach ? f1CountryRouteBright(coach) : (coachCountry ? countryLabel(coachCountry.id) : "—")) + "</strong></div><div class=\"f1-profile-stat\"><span>Возраст</span><strong>" + (coach ? (coach.age || "—") : "—") + "</strong></div><div class=\"f1-profile-stat\"><span>" + (person && person.personType === "teamCoach" ? "Сборная" : "Клуб") + "</span><strong>" + (person && person.personType === "teamCoach" ? (coachCountry ? countryLabel(coachCountry.id) : "—") : (pClub ? "<button class=\"small-btn\" data-club=\"" + U.escapeHtml(pClub.id) + "\">" + U.escapeHtml(pClub.name) + "</button>" : "—")) + "</strong></div><div class=\"f1-profile-stat\"><span>Рекорд бойцов</span><strong>" + U.escapeHtml(U.recordText(coach && coach.record ? coach.record : { wins:0, losses:0, draws:0, kos:0 })) + "</strong></div></div></div>" + (coach ? "<div class=\"content-card\" style=\"margin-top:12px\"><h3>Характеристики тренера</h3>" + renderCoachStatsRows(coach) + "</div>" : "") + "<div class=\"content-card\" style=\"margin-top:12px\"><h3>История карьеры</h3>" + coachCareerLog(coach) + "</div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    if (modal.type === "coachEvent") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(modal.title || "Событие") + "</h2></div><div class=\"modal-body\"><div class=\"content-card\">" + U.escapeHtml(modal.text || "") + "</div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    if (modal.type === "profileProcess") {
      return renderProfileProcessModal(state, modal.kind);
    }

    if (modal.type === "eventNotice") {
      return "<div class=\"modal-backdrop event-notice-backdrop\"><div class=\"modal event-notice-modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(modal.title || "Новость") + "</h2></div><div class=\"modal-body\"><div class=\"content-card\">" + U.escapeHtml(modal.text || "") + "</div></div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
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
      return "<div class=\"modal-backdrop\"><div class=\"modal tournament-modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(modal.label) + "</h2><div class=\"muted small\">Турнирный бой</div></div><div class=\"modal-body\"><div class=\"grid two\"><div class=\"stat-card\"><div class=\"label\">Ты</div><div class=\"value\">" + f1EffectiveOvrText(modal.playerPersonalRating || modal.playerRating, modal.playerCoachBonus || 0, modal.playerRating) + "</div></div><div class=\"stat-card\"><div class=\"label\">Соперник</div><div class=\"value\">" + f1EffectiveOvrText(modal.opponentPersonalRating || modal.opponentRating, modal.opponentCoachBonus || 0, modal.opponentRating) + "</div><div class=\"muted small\">" + U.escapeHtml(modal.opponentName) + " · " + U.escapeHtml(modal.opponentCountry) + " · " + U.escapeHtml(modal.opponentRecord) + "</div></div></div><div class=\"pills\"><span class=\"pill blue\">Шанс " + modal.winChance + "%</span><button class=\"small-btn\" data-tournament-participants=\"1\">Участники</button></div></div><div class=\"modal-actions\"><button data-action=\"close-modal\">Выйти</button><button data-tournament-fight=\"1\">Пропустить бой</button><button class=\"primary\" data-tournament-ring=\"1\">Выйти на ринг</button></div></div></div>";
    }

    if (modal.type === "tournamentResult") {
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>Результат турнира</h2><div class=\"muted small\">" + U.escapeHtml(modal.label) + "</div></div><div class=\"modal-body\"><div class=\"big-result " + Fight.resultClass(modal.result) + "\">" + U.escapeHtml(modal.result) + "</div><div class=\"muted\">Соперник: " + U.escapeHtml(modal.opponentName) + " · OVR " + modal.opponentRating + "</div><div class=\"pills\"><span class=\"pill\">Метод: " + U.escapeHtml(modal.method) + "</span><span class=\"pill\">Счёт: " + U.escapeHtml(modal.scoreLine) + "</span><span class=\"pill blue\">Шанс до боя " + modal.winChance + "%</span><button class=\"small-btn\" data-tournament-participants=\"1\">Участники</button></div><div class=\"content-card\" style=\"margin-top:12px\"><div class=\"label\">Статистика</div><div class=\"muted small\">" + U.escapeHtml(modal.statsLine || "") + "</div>" + (modal.knockdown ? "<div class=\"pill red\" style=\"margin-top:10px\">Нокдаун: раунд " + modal.knockdown.round + "</div>" : "") + "</div></div><div class=\"modal-actions\"><button class=\"primary\" data-tournament-continue=\"1\">" + (modal.continueMode === "next" || modal.continueMode === "third" ? "Продолжить турнир" : "Завершить турнир") + "</button></div></div></div>";
    }

    if (modal.type === "tournamentFinal") {
      return "<div class=\"modal-backdrop\"><div class=\"modal tournament-modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(modal.label) + "</h2><div class=\"muted small\">" + (modal.blocked ? U.escapeHtml(modal.reason) : U.escapeHtml((modal.result || "") + (modal.place ? " · " + modal.place : ""))) + "</div></div><div class=\"modal-body\">" + (modal.blocked ? "" : "<div class=\"pills\"><span class=\"pill gold\">Награда $" + (modal.reward || 0) + "</span><span class=\"pill blue\">Опыт +" + (modal.xpReward || 0) + "</span><button class=\"small-btn\" data-tournament-participants=\"1\">Участники</button></div><div class=\"content-card\" style=\"margin-top:12px\"><div class=\"label\">Пройденные бои</div>" + (modal.fights || []).map(function (fight) { return "<div class=\"split-row\"><span>" + U.escapeHtml(fight.opponentName) + " · OVR " + fight.opponentRating + " · шанс " + fight.winChance + "%</span><strong>" + U.escapeHtml(fight.result) + "</strong></div>"; }).join("") + "</div>") + "</div><div class=\"modal-actions\"><button class=\"primary\" data-action=\"close-modal\">Закрыть</button></div></div></div>";
    }

    if (modal.type === "fightPreview") {
      var previewPlayer = State.player(state);
      var previewOpponent = U.getFighterById(state, modal.opponentId);
      var playerCoach = previewPlayer ? f1CoachFor(state, previewPlayer) : null;
      var opponentCoach = previewOpponent ? f1CoachFor(state, previewOpponent) : null;
      return "<div class=\"modal-backdrop\"><div class=\"modal\"><div class=\"modal-head\"><h2>" + U.escapeHtml(modal.label) + "</h2><div class=\"muted small\">Предпросмотр боя · " + U.escapeHtml(modal.weightClassLabel) + "</div></div><div class=\"modal-body\"><div class=\"grid two\"><div class=\"stat-card\"><div class=\"label\">Ты</div><div class=\"value\">" + f1EffectiveOvrText(modal.playerPersonalRating || modal.playerRating, modal.playerCoachBonus || 0, modal.playerRating) + "</div><div class=\"muted small\">" + U.escapeHtml(modal.playerRecord) + "</div></div><div class=\"stat-card\"><div class=\"label\">Соперник</div><div class=\"value\">" + f1EffectiveOvrText(modal.opponentPersonalRating || modal.opponentRating, modal.opponentCoachBonus || 0, modal.opponentRating) + "</div><div class=\"muted small\">" + U.escapeHtml(modal.opponentName) + " · " + U.escapeHtml(modal.opponentRecord) + "</div></div></div><div class=\"pills\"><span class=\"pill\">" + modal.rounds + " раунда</span><span class=\"pill gold\">$" + modal.purse + "</span><span class=\"pill blue\">Шанс " + modal.winChance + "%</span></div><div class=\"content-card\" style=\"margin-top:12px\"><div class=\"label\">Статистика</div><div class=\"muted small\">OVR: " + f1EffectiveOvrText(modal.playerPersonalRating || modal.playerRating, modal.playerCoachBonus || 0, modal.playerRating) + " — " + f1EffectiveOvrText(modal.opponentPersonalRating || modal.opponentRating, modal.opponentCoachBonus || 0, modal.opponentRating) + ". Рекорд: " + U.escapeHtml(modal.playerRecord) + " — " + U.escapeHtml(modal.opponentRecord) + ". Тренеры: " + (playerCoach ? U.escapeHtml(playerCoach.name) + " OVR " + f1CoachOvr(playerCoach) : "нет") + " — " + (opponentCoach ? U.escapeHtml(opponentCoach.name) + " OVR " + f1CoachOvr(opponentCoach) : "нет") + ".</div></div></div><div class=\"modal-actions\"><button data-action=\"close-modal\">Отмена</button><button data-skip-fight=\"" + U.escapeHtml(modal.offerId) + "\">Пропустить бой</button><button class=\"primary\" data-accept-fight=\"" + U.escapeHtml(modal.offerId) + "\">Выйти на ринг</button></div></div></div>";
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
