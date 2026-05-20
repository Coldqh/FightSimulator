(function () {
  "use strict";

  window.FS = window.FS || {};
  var FS = window.FS;
  var PATCH_VERSION = "tournament-ui-layout-2.3.1";
  var MONTH_WEEKS = 4;

  var RULES = {
    city: { every: 4 * MONTH_WEEKS, phase: 1, label: "раз в 4 месяца" },
    oblast: { every: 6 * MONTH_WEEKS, phase: 2, label: "раз в 6 месяцев" },
    region: { every: 8 * MONTH_WEEKS, phase: 3, label: "раз в 8 месяцев" },
    country: { every: 12 * MONTH_WEEKS, phase: 5, label: "раз в год" },
    continent: { every: 12 * MONTH_WEEKS, phase: 9, label: "раз в год" },
    world: { every: 12 * MONTH_WEEKS, phase: 13, label: "раз в год" },
    olympiad: { every: 24 * MONTH_WEEKS, phase: 25, label: "раз в 2 года" }
  };

  if (FS.Data) {
    FS.Data.appVersion = PATCH_VERSION;
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function weekOf(state) {
    var week = Number(state && state.week ? state.week : 1);
    return Number.isFinite(week) && week > 0 ? week : 1;
  }

  function weekIndex(week) {
    return Math.max(0, (Number(week) || 1) - 1);
  }

  function competitions() {
    return FS.Data && FS.Data.amateurCompetitions instanceof Array ? FS.Data.amateurCompetitions : [];
  }

  function ruleFor(comp) {
    return comp ? RULES[comp.schedule || comp.scope || comp.id] : null;
  }

  function scheduledAt(comp, week) {
    var rule = ruleFor(comp);
    return !!rule && weekIndex(week) % rule.every === rule.phase;
  }

  function nextScheduledWeek(comp, fromWeek) {
    var start = Math.max(1, Number(fromWeek) || 1);
    var offset;
    for (offset = 0; offset <= 260; offset += 1) {
      if (scheduledAt(comp, start + offset)) {
        return start + offset;
      }
    }
    return start;
  }

  function dateText(week) {
    var parts = FS.State && FS.State.dateParts ? FS.State.dateParts({ week: week }) : { year: 1, monthLabel: "месяц", weekOfMonth: 1 };
    return "год " + parts.year + ", " + parts.monthLabel + ", " + parts.weekOfMonth + " неделя";
  }

  function scheduleText(state, comp) {
    var now = weekOf(state);
    var next = nextScheduledWeek(comp, now);
    var left = Math.max(0, next - now);
    return dateText(next) + " · " + (left === 0 ? "на этой неделе" : ("через " + left + " нед."));
  }

  function countryById(countryId) {
    if (FS.Utils && FS.Utils.findCountry) {
      return FS.Utils.findCountry(countryId);
    }
    return ((FS.Data && FS.Data.countries) || []).find(function (country) {
      return country.id === countryId;
    }) || { id: countryId, label: countryId || "—", flag: "" };
  }

  function countryHtml(countryId) {
    var country = countryById(countryId);
    var flag = country && country.flag ? '<img class="flag-icon" src="' + esc(country.flag) + '" alt="' + esc(country.label || country.id || "") + '">' : "";
    return '<span class="country-label">' + flag + '<span>' + esc((country && (country.label || country.name)) || countryId || "—") + '</span></span>';
  }

  function fighterById(state, fighterId) {
    if (!fighterId || !state) {
      return null;
    }
    if (FS.Utils && FS.Utils.getFighterById) {
      return FS.Utils.getFighterById(state, fighterId);
    }
    return ((state.roster || state.fighters) || []).find(function (fighter) {
      return fighter.id === fighterId;
    }) || null;
  }

  function fighterName(fighter) {
    if (!fighter) {
      return "Боец";
    }
    return fighter.name || fighter.fullName || ((fighter.firstName || "") + " " + (fighter.lastName || fighter.surname || "")).trim() || "Боец";
  }

  function recordText(fighter) {
    if (!fighter) {
      return "0-0";
    }
    if (FS.Utils && FS.Utils.recordText) {
      return FS.Utils.recordText(fighter.record || fighter);
    }
    var record = fighter.record || fighter;
    return (record.wins || 0) + "-" + (record.losses || 0) + (record.draws ? "-" + record.draws : "");
  }

  function fighterOvr(fighter) {
    if (!fighter) {
      return 0;
    }
    if (FS.Utils && FS.Utils.statAverage) {
      return FS.Utils.statAverage(fighter.stats || fighter);
    }
    return Math.round(Number(fighter.ovr || fighter.overall || fighter.rating || 0));
  }

  function snapshotSchedules(week) {
    var snapshot = competitions().map(function (comp) {
      return { comp: comp, schedule: comp.schedule };
    });

    competitions().forEach(function (comp) {
      if (ruleFor(comp) && !scheduledAt(comp, week)) {
        comp.schedule = "__disabled_by_calendar_2_3_1__";
      }
    });

    return snapshot;
  }

  function restoreSchedules(snapshot) {
    snapshot.forEach(function (item) {
      item.comp.schedule = item.schedule;
    });
  }

  function patchAmateurCalendar() {
    var Amateur = FS.Amateur;
    if (!Amateur || Amateur.__calendar231) {
      return;
    }
    Amateur.__calendar231 = true;

    Amateur.availableCompetitions = function availableCompetitionsPatched(state) {
      var player = FS.State && FS.State.player ? FS.State.player(state) : null;
      var rating = player && FS.Utils && FS.Utils.statAverage ? FS.Utils.statAverage(player.stats) : 0;
      var homeCountry = player ? countryById(player.homeCountryId || player.countryId) : null;

      return competitions().map(function (comp) {
        var lastWeek;
        var cooldownLeft;
        var available = true;
        var reason = "Можно заявиться.";

        if (Amateur.ensureAmateurState) {
          Amateur.ensureAmateurState(state);
        }

        lastWeek = state && state.amateurPath && state.amateurPath.lastCompetitionWeekById ? (state.amateurPath.lastCompetitionWeekById[comp.id] || 0) : 0;
        cooldownLeft = lastWeek ? Math.max(0, (comp.weekCooldown || 0) - (weekOf(state) - lastWeek)) : 0;

        if (!player || player.trackId !== "amateur") {
          available = false;
          reason = "Доступно только на любительском пути.";
        } else if (rating < comp.minRating) {
          available = false;
          reason = "Нужен OVR " + comp.minRating + "+.";
        } else if (typeof comp.maxRating === "number" && rating > comp.maxRating) {
          available = false;
          reason = "OVR выше лимита: максимум " + comp.maxRating + ".";
        } else if (!scheduledAt(comp, weekOf(state))) {
          available = false;
          reason = "Следующий турнир: " + scheduleText(state, comp) + ".";
        } else if (cooldownLeft > 0) {
          available = false;
          reason = "Следующая попытка через " + cooldownLeft + " нед.";
        }

        return {
          id: comp.id,
          label: comp.scope === "continent" && homeCountry ? "Чемпионат " + homeCountry.continentLabel : comp.label,
          awardLabel: comp.awardLabel,
          minRating: comp.minRating,
          maxRating: comp.maxRating,
          rewardRating: comp.rewardRating,
          entryFee: FS.Data && FS.Data.economy && FS.Data.economy.tournamentEntryFees ? (FS.Data.economy.tournamentEntryFees[comp.id] || 0) : 0,
          difficultyId: comp.difficultyId,
          scheduleText: scheduleText(state, comp),
          scheduleLabel: ruleFor(comp) ? ruleFor(comp).label : "по расписанию",
          available: available,
          reason: reason,
          cooldownLeft: cooldownLeft,
          nextWeek: nextScheduledWeek(comp, weekOf(state))
        };
      });
    };
  }

  function patchWorldCalendar() {
    var World = FS.World;
    if (!World || World.__calendar231) {
      return;
    }
    World.__calendar231 = true;

    if (typeof World.advanceWeek === "function") {
      var originalAdvanceWeek = World.advanceWeek.bind(World);
      World.advanceWeek = function advanceWeekPatched(state, action) {
        var snapshot = snapshotSchedules(weekOf(state) + 1);
        try {
          return originalAdvanceWeek(state, action);
        } finally {
          restoreSchedules(snapshot);
        }
      };
    }

    if (typeof World.bootstrapWorld === "function") {
      var originalBootstrapWorld = World.bootstrapWorld.bind(World);
      World.bootstrapWorld = function bootstrapWorldPatched(state) {
        var snapshot = snapshotSchedules(weekOf(state));
        try {
          return originalBootstrapWorld(state);
        } finally {
          restoreSchedules(snapshot);
        }
      };
    }
  }

  function injectStyles() {
    var style;
    if (document.getElementById("fight-world-hotfix-2-3-1")) {
      return;
    }

    style = document.createElement("style");
    style.id = "fight-world-hotfix-2-3-1";
    style.textContent = [
      ".tabs button{min-height:0!important;padding:7px 10px!important;line-height:1.1!important;flex:0 0 auto!important}",
      ".small-btn,.fighter-name-btn,.fight-line-btn,.training-plus-btn,.modal-actions button,.punch-action-btn{min-height:0!important;padding:7px 10px!important;line-height:1.1!important}",
      ".training-plus-btn{width:auto!important;max-width:max-content!important;justify-content:flex-start!important;background:rgba(255,255,255,.07)!important;border-color:rgba(255,255,255,.16)!important;color:var(--text)!important}",
      ".training-row{grid-template-columns:minmax(120px,max-content) 52px!important;justify-content:start!important}",
      ".fighter-name-btn,.inline-link-btn{width:auto!important;max-width:max-content!important;min-width:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important}",
      ".fight-line{display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important}",
      ".fight-line-main{display:flex!important;align-items:center!important;gap:8px!important;flex:1 1 auto!important;min-width:0!important;overflow-x:auto!important;white-space:nowrap!important}",
      ".fight-line .favorite-btn{display:none!important}",
      ".fight-line .fighter-link,.fight-line .fighter-name-btn{flex:0 0 auto!important;max-width:230px!important;width:auto!important;padding-left:10px!important;padding-right:10px!important}",
      ".fight-line .mini-chip,.fight-line .pill{flex:0 0 auto!important;width:auto!important;min-width:52px!important;padding-left:10px!important;padding-right:10px!important}",
      ".fight-line .flag-mini{min-width:120px!important}",
      ".fight-line .fight-line-btn{flex:0 0 auto!important;min-width:54px!important}",
      ".ranking-list.fw-flat-ranking,.fw-roster-list{display:grid!important;gap:6px!important}",
      ".fw-person-row,.fw-rating-row,.fw-roster-row{display:flex!important;align-items:center!important;gap:8px!important;white-space:nowrap!important;overflow-x:auto!important;min-height:34px!important;padding:4px 0!important;border-bottom:1px solid rgba(255,255,255,.07)!important}",
      ".fw-person-row>* , .fw-rating-row>* , .fw-roster-row>*{flex:0 0 auto!important}",
      ".fw-rating-row .ranking-pos{min-width:38px!important;font-weight:800!important;color:#fff!important}",
      ".fw-person-row .fighter-name-btn,.fw-rating-row .fighter-name-btn,.fw-roster-row .fighter-name-btn{max-width:230px!important;padding-left:10px!important;padding-right:10px!important}",
      ".fw-person-country{min-width:132px!important}",
      ".fw-person-record{min-width:84px!important}",
      ".fw-person-ovr{min-width:58px!important}",
      ".news-row-card{border-bottom:0!important;padding:9px 0!important}",
      ".fw-news-head{display:flex!important;align-items:center!important;gap:8px!important;margin-bottom:5px!important}",
      ".fw-news-head strong{font-size:13px!important}",
      ".fw-news-tag{display:inline-flex!important;align-items:center!important;justify-content:center!important;border:1px solid rgba(255,255,255,.12)!important;background:rgba(255,255,255,.045)!important;border-radius:999px!important;padding:2px 7px!important;color:var(--muted)!important;font-size:10px!important;line-height:1!important}",
      ".fw-news-text{white-space:normal!important;line-height:1.55!important;word-break:break-word!important}",
      ".fw-news-places{display:inline-flex!important;align-items:center!important;gap:10px!important;flex-wrap:nowrap!important;overflow-x:auto!important;max-width:100%!important;vertical-align:middle!important}",
      ".fw-news-place{display:inline-flex!important;align-items:center!important;gap:4px!important;white-space:nowrap!important}",
      ".fw-news-place .fighter-name-btn{min-height:0!important;padding:4px 8px!important;border-radius:999px!important;max-width:180px!important}",
      ".news-list .inline-link-btn:empty,.news-list span:empty{display:none!important}",
      ".fight-preview-modal .pills,.tournament-modal .pills,.fw-prefight-line{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:nowrap!important;overflow-x:auto!important;white-space:nowrap!important}",
      ".fight-fullscreen-modal .fight-side>.pills{display:none!important}",
      "@media(max-width:640px){.fight-line{display:grid!important;grid-template-columns:1fr auto!important}.fight-line-main{gap:5px!important}.fight-line .fighter-link,.fight-line .fighter-name-btn{max-width:150px!important}.fight-line .flag-mini{min-width:76px!important}.fight-line .mini-chip,.fight-line .pill{min-width:44px!important;padding-left:6px!important;padding-right:6px!important}.fw-person-row,.fw-rating-row,.fw-roster-row{gap:6px!important}.fw-person-row .fighter-name-btn,.fw-rating-row .fighter-name-btn,.fw-roster-row .fighter-name-btn{max-width:148px!important}.fw-person-country{min-width:92px!important}.fw-person-record{min-width:70px!important}.fw-person-ovr{min-width:52px!important}.fw-news-places{gap:6px!important}}"
    ].join("\n");

    document.head.appendChild(style);
  }

  function statsLabels(root) {
    root.querySelectorAll('button[data-tab="training"]').forEach(function (node) {
      node.textContent = "Статы";
    });

    root.querySelectorAll("h1,h2,h3,h4").forEach(function (node) {
      if ((node.textContent || "").trim() === "Характеристики") {
        node.textContent = "Статы";
      }
    });
  }

  function personRowHtml(state, fighter, position) {
    if (!fighter) {
      return "";
    }

    return '<div class="' + (position ? "fw-rating-row" : "fw-roster-row") + '">' +
      (position ? '<span class="ranking-pos">#' + position + '</span>' : "") +
      '<button class="small-btn fighter-name-btn" data-fighter="' + esc(fighter.id) + '">' + esc(fighterName(fighter)) + '</button>' +
      '<span class="mini-chip fw-person-country">' + countryHtml(fighter.countryId) + '</span>' +
      '<span class="mini-chip fw-person-record">' + esc(recordText(fighter)) + '</span>' +
      '<span class="mini-chip gold fw-person-ovr">OVR ' + fighterOvr(fighter) + '</span>' +
    '</div>';
  }

  function patchFightList(root) {
    root.querySelectorAll(".fight-line .favorite-btn").forEach(function (node) {
      node.remove();
    });

    root.querySelectorAll(".fight-line .fighter-link").forEach(function (node) {
      node.classList.add("fighter-name-btn");
    });
  }

  function rankingRows(state) {
    var rankingCountryId = state.rankingTrackId === "pro" ? "world" : state.rankingCountryId;
    var trackId = state.rankingTrackId || "amateur";
    var weightId = trackId === "street" ? "" : state.rankingWeightClassId;
    var pageSize = 24;
    var page = Math.max(0, Number(state.rankingPage) || 0);
    var list = FS.State && FS.State.ranking ? FS.State.ranking(state, rankingCountryId, trackId, weightId) : [];
    var totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    var safePage = Math.min(page, totalPages - 1);

    return list.slice(safePage * pageSize, safePage * pageSize + pageSize).map(function (fighter, index) {
      return personRowHtml(state, fighter, safePage * pageSize + index + 1);
    }).join("") || '<div class="muted small">Пусто.</div>';
  }

  function patchRanking(root, state) {
    var list = root.querySelector(".ranking-list");
    if (!list || !state) {
      return;
    }

    list.classList.add("fw-flat-ranking");
    list.innerHTML = rankingRows(state);
  }

  function patchRosterRows(root, state) {
    if (!state) {
      return;
    }

    root.querySelectorAll(".modal .content-card .split-row").forEach(function (row) {
      var button = row.querySelector("button[data-fighter]");
      var ovr = row.querySelector(".pill.gold");
      var fighter;

      if (!button || !ovr) {
        return;
      }

      fighter = fighterById(state, button.getAttribute("data-fighter"));
      if (!fighter) {
        return;
      }

      row.outerHTML = personRowHtml(state, fighter, 0);
    });

    root.querySelectorAll(".modal .content-card").forEach(function (card) {
      if (card.querySelector(".fw-roster-row")) {
        card.classList.add("fw-roster-list");
      }
    });
  }

  function parsePlace(text, place) {
    var match = String(text || "").match(new RegExp(place + "\\s*[—-]\\s*([^,\\.]+)"));
    return match && match[1] ? match[1].trim() : "";
  }

  function placeButton(state, fighterId, fallbackName) {
    var fighter = fighterById(state, fighterId);
    var name = fighter ? fighterName(fighter) : (fallbackName || "");

    if (!name) {
      return "";
    }

    if (fighter) {
      return '<button class="small-btn fighter-name-btn" data-fighter="' + esc(fighter.id) + '">' + esc(name) + '</button>';
    }

    return '<span class="small-btn fighter-name-btn disabled">' + esc(name) + '</span>';
  }

  function tournamentNewsHtml(state, item) {
    var meta = item.meta || {};
    var text = String(item.text || "");
    var title = text.indexOf(":") >= 0 ? text.split(":")[0] : text;
    var firstName = parsePlace(text, "1");
    var secondName = parsePlace(text, "2");
    var thirdName = parsePlace(text, "3");

    return '<div class="news-row-card">' +
      '<div class="fw-news-head"><strong>Неделя ' + esc(item.week) + '</strong><span class="fw-news-tag">tournament</span></div>' +
      '<div class="muted small fw-news-text">' + esc(title) + ': ' +
        '<span class="fw-news-places">' +
          '<span class="fw-news-place">1 ' + placeButton(state, meta.firstId, firstName) + '</span>' +
          (meta.secondId || secondName ? '<span class="fw-news-place">2 ' + placeButton(state, meta.secondId, secondName) + '</span>' : '') +
          (meta.thirdId || thirdName ? '<span class="fw-news-place">3 ' + placeButton(state, meta.thirdId, thirdName) + '</span>' : '') +
        '</span>.' +
      '</div>' +
    '</div>';
  }

  function patchNews(root, state) {
    var newsList = root.querySelector(".news-list");
    var seen = {};
    var news;

    if (!newsList || !state || !state.world || !(state.world.news instanceof Array)) {
      return;
    }

    news = state.world.news.filter(function (item) {
      var key = String(item.week) + "|" + String(item.tone || "") + "|" + String(item.text || "");
      if (seen[key]) {
        return false;
      }
      seen[key] = true;
      return true;
    }).slice(0, 80);

    if (!news.length) {
      newsList.innerHTML = '<div class="muted small">Пусто.</div>';
      return;
    }

    newsList.innerHTML = news.map(function (item) {
      if (item && item.tone === "tournament") {
        return tournamentNewsHtml(state, item);
      }

      return '<div class="news-row-card">' +
        '<div class="fw-news-head"><strong>Неделя ' + esc(item.week) + '</strong><span class="fw-news-tag">' + esc(item.tone || "world") + '</span></div>' +
        '<div class="muted small fw-news-text">' + esc(item.text || "") + '</div>' +
      '</div>';
    }).join("");
  }

  function patchPrefight(root) {
    root.querySelectorAll(".fight-preview-modal .pills, .tournament-modal .pills").forEach(function (node) {
      node.classList.add("fw-prefight-line");
    });
  }

  function patchActiveFight(root) {
    root.querySelectorAll(".fight-fullscreen-modal .fight-side > .pills").forEach(function (node) {
      node.remove();
    });

    root.querySelectorAll(".fight-log div").forEach(function (node) {
      var text = (node.textContent || "").replace(/\s+/g, " ").trim();
      if (/Бой начался|Ринг\s*5[хx×]5|Выбери движение/i.test(text)) {
        node.remove();
      }
    });
  }

  function patchFightResult(root) {
    root.querySelectorAll(".content-card").forEach(function (card) {
      var title = card.querySelector("h3,.label");
      if (title && (title.textContent || "").trim() === "Лог ударов") {
        card.remove();
      }
    });
  }

  function polish(root, state) {
    injectStyles();
    statsLabels(root);
    patchFightList(root);
    patchRanking(root, state);
    patchRosterRows(root, state);
    patchNews(root, state);
    patchPrefight(root);
    patchActiveFight(root);
    patchFightResult(root);
  }

  function patchRender() {
    var Render = FS.Render;
    if (!Render || Render.__hotfix231 || typeof Render.dashboard !== "function") {
      return;
    }
    Render.__hotfix231 = true;

    var originalDashboard = Render.dashboard.bind(Render);
    Render.dashboard = function dashboardPatched(state) {
      var template = document.createElement("template");
      template.innerHTML = originalDashboard(state);
      polish(template.content, state);
      return template.innerHTML;
    };

    if (typeof Render.start === "function") {
      var originalStart = Render.start.bind(Render);
      Render.start = function startPatched(summary) {
        injectStyles();
        return originalStart(summary);
      };
    }
  }

  patchAmateurCalendar();
  patchWorldCalendar();
  patchRender();

  document.addEventListener("DOMContentLoaded", function () {
    injectStyles();
    polish(document, null);
  });
}());
