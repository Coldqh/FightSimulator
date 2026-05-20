(function () {
  "use strict";

  window.FS = window.FS || {};
  var FS = window.FS;
  var PATCH_VERSION = "tournament-ui-hotfix-2.3.0";
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

  if (FS.Data) { FS.Data.appVersion = PATCH_VERSION; }

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function weekOf(state) {
    var week = Number(state && state.week ? state.week : 1);
    return Number.isFinite(week) && week > 0 ? week : 1;
  }

  function idx(week) {
    return Math.max(0, (Number(week) || 1) - 1);
  }

  function comps() {
    return FS.Data && FS.Data.amateurCompetitions instanceof Array ? FS.Data.amateurCompetitions : [];
  }

  function rule(comp) {
    return comp ? RULES[comp.schedule || comp.scope || comp.id] : null;
  }

  function scheduledAt(comp, week) {
    var r = rule(comp);
    return !!r && idx(week) % r.every === r.phase;
  }

  function nextWeek(comp, fromWeek) {
    var start = Math.max(1, Number(fromWeek) || 1);
    var offset;
    for (offset = 0; offset <= 260; offset += 1) {
      if (scheduledAt(comp, start + offset)) { return start + offset; }
    }
    return start;
  }

  function dateText(week) {
    var p = FS.State && FS.State.dateParts ? FS.State.dateParts({ week: week }) : { year: 1, monthLabel: "месяц", weekOfMonth: 1 };
    return "год " + p.year + ", " + p.monthLabel + ", " + p.weekOfMonth + " неделя";
  }

  function scheduleText(state, comp) {
    var now = weekOf(state);
    var next = nextWeek(comp, now);
    var left = Math.max(0, next - now);
    return dateText(next) + " · " + (left === 0 ? "на этой неделе" : ("через " + left + " нед."));
  }

  function country(countryId) {
    if (FS.Utils && FS.Utils.findCountry) { return FS.Utils.findCountry(countryId); }
    return ((FS.Data && FS.Data.countries) || []).find(function (c) { return c.id === countryId; }) || { id: countryId, label: countryId || "—", flag: "" };
  }

  function countryHtml(countryId) {
    var c = country(countryId);
    var flag = c && c.flag ? '<img class="flag-icon" src="' + esc(c.flag) + '" alt="' + esc(c.label || c.id || "") + '">' : "";
    return '<span class="country-label">' + flag + '<span>' + esc((c && (c.label || c.name)) || countryId || "—") + '</span></span>';
  }

  function fighterById(state, id) {
    if (!id) { return null; }
    if (FS.Utils && FS.Utils.getFighterById) { return FS.Utils.getFighterById(state, id); }
    return ((state && (state.roster || state.fighters)) || []).find(function (f) { return f.id === id; }) || null;
  }

  function fighterName(f) {
    if (!f) { return "Боец"; }
    return f.name || f.fullName || ((f.firstName || "") + " " + (f.lastName || f.surname || "")).trim() || "Боец";
  }

  function recordText(f) {
    if (!f) { return "0-0"; }
    if (FS.Utils && FS.Utils.recordText) { return FS.Utils.recordText(f.record || f); }
    var r = f.record || f;
    return (r.wins || 0) + "-" + (r.losses || 0) + (r.draws ? "-" + r.draws : "");
  }

  function ovr(f) {
    if (!f) { return 0; }
    if (FS.Utils && FS.Utils.statAverage) { return FS.Utils.statAverage(f.stats || f); }
    return Math.round(Number(f.ovr || f.overall || f.rating || 0));
  }

  function patchAmateurCalendar() {
    var Amateur = FS.Amateur;
    if (!Amateur || Amateur.__calendar230) { return; }
    Amateur.__calendar230 = true;

    Amateur.availableCompetitions = function (state) {
      var p = FS.State && FS.State.player ? FS.State.player(state) : null;
      var rating = p && FS.Utils && FS.Utils.statAverage ? FS.Utils.statAverage(p.stats) : 0;
      var home = p ? country(p.homeCountryId || p.countryId) : null;

      return comps().map(function (comp) {
        if (Amateur.ensureAmateurState) { Amateur.ensureAmateurState(state); }

        var last = state && state.amateurPath && state.amateurPath.lastCompetitionWeekById ? (state.amateurPath.lastCompetitionWeekById[comp.id] || 0) : 0;
        var cooldownLeft = last ? Math.max(0, (comp.weekCooldown || 0) - (weekOf(state) - last)) : 0;
        var available = true;
        var reason = "Можно заявиться.";

        if (!p || p.trackId !== "amateur") {
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
          label: comp.scope === "continent" && home ? "Чемпионат " + home.continentLabel : comp.label,
          awardLabel: comp.awardLabel,
          minRating: comp.minRating,
          maxRating: comp.maxRating,
          rewardRating: comp.rewardRating,
          entryFee: FS.Data && FS.Data.economy && FS.Data.economy.tournamentEntryFees ? (FS.Data.economy.tournamentEntryFees[comp.id] || 0) : 0,
          difficultyId: comp.difficultyId,
          scheduleText: scheduleText(state, comp),
          scheduleLabel: rule(comp) ? rule(comp).label : "по расписанию",
          available: available,
          reason: reason,
          cooldownLeft: cooldownLeft,
          nextWeek: nextWeek(comp, weekOf(state))
        };
      });
    };
  }

  function snapshotSchedules(week) {
    var snap = comps().map(function (comp) { return { comp: comp, schedule: comp.schedule }; });
    comps().forEach(function (comp) {
      if (rule(comp) && !scheduledAt(comp, week)) { comp.schedule = "__disabled_by_calendar_230__"; }
    });
    return snap;
  }

  function restoreSchedules(snap) {
    snap.forEach(function (item) { item.comp.schedule = item.schedule; });
  }

  function patchWorldCalendar() {
    var World = FS.World;
    if (!World || World.__calendar230) { return; }
    World.__calendar230 = true;

    if (typeof World.advanceWeek === "function") {
      var oldAdvance = World.advanceWeek.bind(World);
      World.advanceWeek = function (state, action) {
        var snap = snapshotSchedules(weekOf(state) + 1);
        try { return oldAdvance(state, action); }
        finally { restoreSchedules(snap); }
      };
    }

    if (typeof World.bootstrapWorld === "function") {
      var oldBoot = World.bootstrapWorld.bind(World);
      World.bootstrapWorld = function (state) {
        var snap = snapshotSchedules(weekOf(state));
        try { return oldBoot(state); }
        finally { restoreSchedules(snap); }
      };
    }
  }

  function injectStyles() {
    if (document.getElementById("fight-world-hotfix-230-style")) { return; }
    var s = document.createElement("style");
    s.id = "fight-world-hotfix-230-style";
    s.textContent = [
      ".tabs button{min-height:0!important;padding:7px 10px!important;line-height:1.1!important;flex:0 0 auto!important}",
      ".small-btn,.fighter-name-btn,.fight-line-btn,.training-plus-btn,.modal-actions button,.punch-action-btn{min-height:0!important;padding:7px 10px!important;line-height:1.1!important}",
      ".training-plus-btn{width:auto!important;justify-content:flex-start!important}",
      ".training-row{grid-template-columns:minmax(130px,max-content) 52px!important;justify-content:start!important}",
      ".ranking-list.fw-flat-ranking{display:grid!important;gap:6px!important}",
      ".fw-rating-row{display:grid!important;grid-template-columns:46px minmax(150px,1fr) minmax(120px,.8fr) 76px 58px!important;align-items:center!important;gap:8px!important;white-space:nowrap!important;overflow-x:auto!important}",
      ".fw-rating-row .fighter-name-btn{width:100%!important;justify-content:flex-start!important;overflow:hidden!important;text-overflow:ellipsis!important}",
      ".fight-line{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:8px!important}",
      ".fight-line-main{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:nowrap!important;overflow-x:auto!important;white-space:nowrap!important}",
      ".fight-line .favorite-btn{display:none!important}",
      ".fight-preview-modal .pills,.tournament-modal .pills{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:nowrap!important;overflow-x:auto!important;white-space:nowrap!important}",
      ".fight-fullscreen-modal .fight-side>.pills{display:none!important}",
      ".fw-news-places{display:inline-flex!important;align-items:center!important;gap:6px!important;flex-wrap:wrap!important}",
      ".fw-news-place{display:inline-flex!important;align-items:center!important;gap:4px!important}",
      ".fw-news-place .fighter-name-btn{min-height:0!important;padding:4px 8px!important;border-radius:999px!important}",
      ".news-list .inline-link-btn:empty,.news-list span:empty{display:none!important}",
      "@media(max-width:560px){.fw-rating-row{grid-template-columns:38px minmax(126px,1fr) minmax(96px,.75fr) 64px 50px!important;gap:6px!important}.fight-line{grid-template-columns:1fr!important}.fight-line-btn{width:max-content!important}}"
    ].join("\n");
    document.head.appendChild(s);
  }

  function statsLabels(root) {
    root.querySelectorAll('button[data-tab="training"]').forEach(function (n) { n.textContent = "Статы"; });
    root.querySelectorAll("h1,h2,h3,h4").forEach(function (n) {
      if ((n.textContent || "").trim() === "Характеристики") { n.textContent = "Статы"; }
    });
  }

  function patchFightList(root) {
    root.querySelectorAll(".fight-line .favorite-btn").forEach(function (n) { n.remove(); });
  }

  function rankingRows(state) {
    var countryId = state.rankingTrackId === "pro" ? "world" : state.rankingCountryId;
    var trackId = state.rankingTrackId || "amateur";
    var weightId = trackId === "street" ? "" : state.rankingWeightClassId;
    var pageSize = 24;
    var page = Math.max(0, Number(state.rankingPage) || 0);
    var list = FS.State && FS.State.ranking ? FS.State.ranking(state, countryId, trackId, weightId) : [];
    var totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    var safePage = Math.min(page, totalPages - 1);

    return list.slice(safePage * pageSize, safePage * pageSize + pageSize).map(function (f, i) {
      return '<div class="fw-rating-row">' +
        '<span class="ranking-pos">#' + (safePage * pageSize + i + 1) + '</span>' +
        '<button class="small-btn fighter-name-btn" data-fighter="' + esc(f.id) + '">' + esc(fighterName(f)) + '</button>' +
        '<span class="mini-chip flag-mini">' + countryHtml(f.countryId) + '</span>' +
        '<span class="mini-chip record-mini">' + esc(recordText(f)) + '</span>' +
        '<span class="mini-chip gold">OVR ' + ovr(f) + '</span>' +
      '</div>';
    }).join("") || '<div class="muted small">Бойцы не найдены.</div>';
  }

  function patchRanking(root, state) {
    var list = root.querySelector(".ranking-list");
    if (!list || !state) { return; }
    list.classList.add("fw-flat-ranking");
    list.innerHTML = rankingRows(state);
  }

  function parsePlace(text, place) {
    var m = String(text || "").match(new RegExp(place + "\\s*[—-]\\s*([^,\\.]+)"));
    return m && m[1] ? m[1].trim() : "";
  }

  function placeButton(state, id, fallbackName) {
    var f = fighterById(state, id);
    var name = f ? fighterName(f) : (fallbackName || "—");
    return f
      ? '<button class="small-btn fighter-name-btn" data-fighter="' + esc(f.id) + '">' + esc(name) + '</button>'
      : '<span class="small-btn fighter-name-btn disabled">' + esc(name) + '</span>';
  }

  function tournamentNewsHtml(state, item) {
    var meta = item.meta || {};
    var text = String(item.text || "");
    var title = text.indexOf(":") >= 0 ? text.split(":")[0] : text;
    var first = parsePlace(text, "1");
    var second = parsePlace(text, "2");
    var third = parsePlace(text, "3");

    return '<div class="news-row-card"><div class="split-row news-row"><div class="news-row-main">' +
      '<strong>Неделя ' + esc(item.week) + '</strong>' +
      '<div class="muted small news-inline-text">' + esc(title) + ': ' +
        '<span class="fw-news-places">' +
          '<span class="fw-news-place">1 — ' + placeButton(state, meta.firstId, first) + '</span>' +
          (meta.secondId || second ? '<span class="fw-news-place">2 — ' + placeButton(state, meta.secondId, second) + '</span>' : '') +
          (meta.thirdId || third ? '<span class="fw-news-place">3 — ' + placeButton(state, meta.thirdId, third) + '</span>' : '') +
        '</span>.' +
      '</div></div><span class="pill">tournament</span></div></div>';
  }

  function patchNews(root, state) {
    var list = root.querySelector(".news-list");
    if (!list || !state || !state.world || !(state.world.news instanceof Array)) { return; }

    var seen = {};
    var news = state.world.news.filter(function (item) {
      var key = String(item.week) + "|" + String(item.tone || "") + "|" + String(item.text || "");
      if (seen[key]) { return false; }
      seen[key] = true;
      return true;
    }).slice(0, 80);

    list.innerHTML = news.map(function (item) {
      if (item && item.tone === "tournament") { return tournamentNewsHtml(state, item); }
      return '<div class="news-row-card"><div class="split-row news-row"><div class="news-row-main"><strong>Неделя ' + esc(item.week) + '</strong><div class="muted small news-inline-text">' + esc(item.text || "") + '</div></div><span class="pill">' + esc(item.tone || "world") + '</span></div></div>';
    }).join("");
  }

  function patchActiveFight(root) {
    root.querySelectorAll(".fight-fullscreen-modal .fight-side > .pills").forEach(function (n) { n.remove(); });
    root.querySelectorAll(".fight-log div").forEach(function (n) {
      var text = (n.textContent || "").replace(/\s+/g, " ").trim();
      if (/Бой начался|Ринг\s*5[хx×]5|Выбери движение/i.test(text)) { n.remove(); }
    });
  }

  function patchFightResult(root) {
    root.querySelectorAll(".content-card").forEach(function (card) {
      var title = card.querySelector("h3,.label");
      if (title && (title.textContent || "").trim() === "Лог ударов") { card.remove(); }
    });
  }

  function polish(root, state) {
    injectStyles();
    statsLabels(root);
    patchFightList(root);
    patchRanking(root, state);
    patchNews(root, state);
    patchActiveFight(root);
    patchFightResult(root);
  }

  function patchRender() {
    var Render = FS.Render;
    if (!Render || Render.__hotfix230 || typeof Render.dashboard !== "function") { return; }
    Render.__hotfix230 = true;

    var oldDashboard = Render.dashboard.bind(Render);
    Render.dashboard = function (state) {
      var template = document.createElement("template");
      template.innerHTML = oldDashboard(state);
      polish(template.content, state);
      return template.innerHTML;
    };

    if (typeof Render.start === "function") {
      var oldStart = Render.start.bind(Render);
      Render.start = function (summary) {
        injectStyles();
        return oldStart(summary);
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
