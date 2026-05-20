(function () {
  "use strict";

  var VERSION = "gameplay-update-fix-2.3.9";
  var SCHEMA = 239;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function forceVersion() {
    window.FS = window.FS || {};
    window.FS.Data = window.FS.Data || {};
    window.FS.Data.appVersion = VERSION;
    window.FS.Data.saveSchemaVersion = SCHEMA;
  }

  function cacheNameMatches(key) {
    var low = String(key || "").toLowerCase();
    return low.indexOf("fight") !== -1 || low.indexOf("simulator") !== -1 || low.indexOf("fw-") === 0;
  }

  function clearFightCaches() {
    if (!window.caches || !caches.keys) { return Promise.resolve(); }
    return caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return cacheNameMatches(key) ? caches.delete(key) : false;
      }));
    });
  }

  function unregisterServiceWorkers() {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.getRegistrations) { return Promise.resolve(); }
    return navigator.serviceWorker.getRegistrations().then(function (registrations) {
      return Promise.all(registrations.map(function (registration) { return registration.unregister(); }));
    });
  }

  function hardUpdate(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) { event.stopImmediatePropagation(); }
    }
    try {
      localStorage.setItem("fightWorldUpdateTarget", VERSION);
      sessionStorage.setItem("fightWorldUpdateTarget", VERSION);
    } catch (error) {}

    var openFresh = function () {
      window.location.replace("./reset-cache.html?fromUpdateButton=2.3.9&t=" + Date.now());
    };

    unregisterServiceWorkers().then(clearFightCaches).then(openFresh).catch(openFresh);
    return false;
  }

  function installUpdateInterceptor() {
    if (window.__fightWorldUpdateFix239) { return; }
    window.__fightWorldUpdateFix239 = true;

    ["click", "pointerup", "touchend"].forEach(function (type) {
      document.addEventListener(type, function (event) {
        var button = event.target && event.target.closest ? event.target.closest("button, a") : null;
        var text;
        if (!button) { return; }
        text = String(button.textContent || "").toLowerCase();

        if (button.classList.contains("update-now-btn") ||
            button.dataset.updateNow ||
            button.dataset.action === "force-update" ||
            text.indexOf("обновить до последней") !== -1 ||
            text.indexOf("обновить") !== -1) {
          return hardUpdate(event);
        }
      }, true);
    });
  }

  function refs() {
    return {
      U: (window.FS && window.FS.Utils) || {},
      F: (window.FS && window.FS.Fight) || {},
      D: (window.FS && window.FS.Data) || {}
    };
  }

  function fighterById(state, id) {
    var r = refs();
    if (!state || !id) { return null; }
    if (r.U.getFighterById) { return r.U.getFighterById(state, id); }
    return (state.roster || []).find(function (f) { return f && f.id === id; }) || null;
  }

  function nameOf(fighter) {
    return fighter ? (fighter.name || fighter.fullName || ((fighter.firstName || "") + " " + (fighter.lastName || fighter.surname || "")).trim() || "Боец") : "Боец";
  }

  function recordOf(fighter) {
    var r = refs();
    if (!fighter) { return "0-0-0"; }
    if (r.U.recordText) { return r.U.recordText(fighter.record || fighter); }
    var rec = fighter.record || {};
    return (rec.wins || 0) + "-" + (rec.losses || 0) + "-" + (rec.draws || 0);
  }

  function ovrOf(fighter) {
    var r = refs();
    if (!fighter) { return 0; }
    if (r.U.statAverage) { return r.U.statAverage(fighter.stats || fighter); }
    return Math.round(Number(fighter.ovr || fighter.rating || 0));
  }

  function countryById(countryId) {
    var r = refs();
    if (r.U.findCountry) { return r.U.findCountry(countryId); }
    return (r.D.countries || []).find(function (country) { return country && country.id === countryId; }) || { id: countryId, label: countryId || "—", flag: "" };
  }

  function countryHtml(countryId) {
    var country = countryById(countryId);
    var label = (country && (country.label || country.name)) || countryId || "—";
    var flag = country && country.flag ? '<img class="flag-icon" src="' + esc(country.flag) + '" alt="' + esc(label) + '">' : "";
    return '<span class="country-label">' + flag + '<span>' + esc(label) + '</span></span>';
  }

  function previewFor(state, offer) {
    var r = refs();
    try {
      if (r.F.buildFightPreview && offer && offer.id) { return r.F.buildFightPreview(state, offer.id); }
    } catch (error) {}
    return {};
  }

  function moneyText(value) {
    return "$" + Math.round(Number(value) || 0);
  }

  function fightRowHtml(state, offer) {
    var opponent = fighterById(state, offer && offer.opponentId);
    var preview;
    var chance;
    var purse;
    var rating;

    if (!opponent) { return ""; }

    preview = previewFor(state, offer);
    chance = preview.winChance != null ? preview.winChance : (offer.winChance != null ? offer.winChance : offer.chance);
    if (chance == null) { chance = "—"; }
    if (typeof chance === "number") { chance = Math.round(chance) + "%"; }
    else if (String(chance).indexOf("%") === -1 && chance !== "—") { chance = String(chance) + "%"; }

    purse = preview.purse != null ? preview.purse : (offer.purse != null ? offer.purse : (offer.reward != null ? offer.reward : offer.money));
    rating = preview.opponentRating != null ? preview.opponentRating : ovrOf(opponent);

    return '<div class="fw-fight-row">' +
      '<button class="small-btn fighter-name-btn fw-name-btn" data-fighter="' + esc(opponent.id) + '">' + esc(nameOf(opponent)) + '</button>' +
      '<span class="fw-chip fw-country-chip">' + countryHtml(opponent.countryId || opponent.currentCountryId || opponent.homeCountryId) + '</span>' +
      '<span class="fw-chip fw-chance-chip">Шанс ' + esc(chance) + '</span>' +
      '<span class="fw-chip fw-money-chip">' + esc(moneyText(purse)) + '</span>' +
      '<span class="fw-chip fw-ovr-chip">OVR ' + esc(rating) + '</span>' +
      '<button class="primary fw-fight-btn" data-preview-fight="' + esc(offer.id) + '">Бой</button>' +
    '</div>';
  }

  function patchFightRows(root, state) {
    var list;
    var offers;

    if (!root || !state) { return; }
    offers = (state.offers || []).filter(function (offer) { return offer && !offer.isCompetition && offer.opponentId; });
    list = root.querySelector(".fight-lines, .offer-list.compact-offers.fight-lines, .offer-list.fight-lines");

    if (!list) {
      if ((state.selectedTab || "") !== "fights") { return; }
      var anchor = root.querySelector(".content-card");
      if (!anchor || !anchor.parentNode) { return; }
      list = document.createElement("div");
      anchor.parentNode.insertBefore(list, anchor.nextSibling);
    }

    list.className = "fw-fight-list";
    list.innerHTML = offers.length ? offers.map(function (offer) { return fightRowHtml(state, offer); }).join("") : '<div class="content-card"><div class="muted small">Пусто.</div></div>';
  }

  function personRowHtml(state, fighter, posLabel) {
    if (!fighter) { return ""; }
    return '<div class="fw-person-row">' +
      (posLabel ? '<span class="fw-chip fw-pos-chip">' + esc(posLabel) + '</span>' : '') +
      '<button class="small-btn fighter-name-btn fw-name-btn" data-fighter="' + esc(fighter.id) + '">' + esc(nameOf(fighter)) + '</button>' +
      '<span class="fw-chip fw-country-chip">' + countryHtml(fighter.countryId || fighter.currentCountryId || fighter.homeCountryId) + '</span>' +
      '<span class="fw-chip fw-record-chip">' + esc(recordOf(fighter)) + '</span>' +
      '<span class="fw-chip fw-ovr-chip">OVR ' + esc(ovrOf(fighter)) + '</span>' +
      (fighter.isPlayer ? '<span class="fw-chip fw-you-chip">Ты</span>' : '') +
    '</div>';
  }

  function patchRankingRows(root, state) {
    if (!root || !state) { return; }
    root.querySelectorAll(".ranking-entry").forEach(function (entry) {
      var button = entry.querySelector("button[data-fighter]");
      var pos = entry.querySelector(".ranking-pos");
      var fighter;
      if (!button || entry.dataset.fw239Done === "1") { return; }
      fighter = fighterById(state, button.dataset.fighter);
      if (!fighter) { return; }
      entry.dataset.fw239Done = "1";
      entry.classList.add("fw-person-entry");
      entry.innerHTML = personRowHtml(state, fighter, pos ? pos.textContent.trim() : "");
    });
  }

  function patchModalRosterRows(root, state) {
    if (!root || !state) { return; }

    root.querySelectorAll(".modal .split-row").forEach(function (row) {
      var button = row.querySelector("button[data-fighter]");
      var fighter;
      var text = row.textContent || "";
      if (!button || row.dataset.fw239Done === "1") { return; }
      if (row.closest(".modal-head")) { return; }
      if (text.indexOf("OVR") === -1 && !row.querySelector(".pill.gold")) { return; }

      fighter = fighterById(state, button.dataset.fighter);
      if (!fighter) { return; }

      row.dataset.fw239Done = "1";
      row.className = "fw-person-row-wrap";
      row.innerHTML = personRowHtml(state, fighter, "");
    });
  }

  function patchFavorites(root, state) {
    if (!root || !state) { return; }
    root.querySelectorAll(".favorite-row, .favorite-list .split-row").forEach(function (row) {
      var button = row.querySelector("button[data-fighter]");
      var fighter;
      if (!button || row.dataset.fw239Done === "1") { return; }
      fighter = fighterById(state, button.dataset.fighter);
      if (!fighter) { return; }
      row.dataset.fw239Done = "1";
      row.className = "fw-person-row-wrap favorite-row";
      row.innerHTML = '<div class="fw-person-row">' +
        '<button class="small-btn fighter-name-btn fw-name-btn" data-fighter="' + esc(fighter.id) + '">' + esc(nameOf(fighter)) + '</button>' +
        '<span class="fw-chip fw-country-chip">' + countryHtml(fighter.countryId || fighter.currentCountryId || fighter.homeCountryId) + '</span>' +
        '<span class="fw-chip fw-ovr-chip">OVR ' + esc(ovrOf(fighter)) + '</span>' +
        '<span class="fw-chip fw-record-chip">' + esc(recordOf(fighter)) + '</span>' +
      '</div>';
    });
  }

  function patchChampionNews(root, state) {
    var fighters;
    if (!root || !state) { return; }
    fighters = (state.roster || []).slice().filter(Boolean).sort(function (a, b) { return nameOf(b).length - nameOf(a).length; }).slice(0, 3500);

    root.querySelectorAll(".news-inline-text").forEach(function (node) {
      var html;
      if (node.dataset.fw239News === "1" || node.querySelector("button[data-fighter]")) { return; }
      html = esc(node.textContent || "");
      fighters.forEach(function (fighter) {
        var name = nameOf(fighter);
        var safe;
        var reg;
        if (!name || name.length < 5) { return; }
        safe = esc(name);
        reg = new RegExp("(^|[^A-Za-zА-Яа-яЁё0-9])(" + safe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")(?=$|[^A-Za-zА-Яа-яЁё0-9])", "g");
        html = html.replace(reg, '$1<button class="small-btn fighter-name-btn fw-inline-name" data-fighter="' + esc(fighter.id) + '">' + safe + '</button>');
      });
      node.dataset.fw239News = "1";
      node.innerHTML = html;
    });
  }

  function ensureBirthDates(state) {
    if (!state || !state.roster) { return; }
    var week = Number(state.week) || 1;
    state.roster.forEach(function (fighter, index) {
      var age;
      var birthWeek;
      if (!fighter) { return; }
      age = Math.max(14, Number(fighter.age) || (fighter.isPlayer ? 18 : 20));
      if (!fighter.birthWeekAbs) {
        birthWeek = Math.max(1, week - age * 48 - ((Number(fighter.seed) || index * 7) % 48));
        fighter.birthWeekAbs = birthWeek;
        fighter.birthYear = Math.max(1, Math.floor((birthWeek - 1) / 48) + 1);
        fighter.birthMonth = Math.floor(((birthWeek - 1) % 48) / 4) + 1;
        fighter.birthWeekOfMonth = ((birthWeek - 1) % 4) + 1;
      }
      fighter.age = Math.max(14, Math.floor((week - fighter.birthWeekAbs) / 48));
      fighter.birthdayLabel = "год " + fighter.birthYear + ", месяц " + fighter.birthMonth + ", " + fighter.birthWeekOfMonth + " неделя";
    });
  }

  function repairStreetRating(state) {
    if (!state || !state.roster) { return; }
    state.roster.forEach(function (fighter) {
      var rec;
      var total;
      var winRate;
      var recordScore;
      if (!fighter || fighter.trackId !== "street") { return; }
      rec = fighter.record || {};
      total = (rec.wins || 0) + (rec.losses || 0) + (rec.draws || 0);
      winRate = total ? ((rec.wins || 0) + (rec.draws || 0) * 0.5) / total : 0.5;
      recordScore = Math.round(winRate * 150);
      fighter.streetRating = Math.round(ovrOf(fighter) * 0.8 + recordScore * 0.2);
    });
  }

  function repairProTitles(state) {
    var bodies = ["wbc", "wba", "wbo", "ibf"];
    var weights = (refs().D.weightClasses || []);
    if (!state || !state.roster || !weights.length) { return; }
    state.titles = state.titles || {};

    weights.forEach(function (weight) {
      bodies.forEach(function (body) {
        var id = "pro_" + body + "_" + weight.id;
        var title = state.titles[id];
        var champion = title ? fighterById(state, title.championId) : null;
        var candidates;
        if (champion && champion.trackId === "pro" && !champion.retired && champion.weightClassId === weight.id) { return; }

        candidates = state.roster.filter(function (fighter) {
          return fighter && fighter.trackId === "pro" && !fighter.retired && fighter.weightClassId === weight.id;
        }).sort(function (a, b) { return ovrOf(b) - ovrOf(a); });

        if (!candidates.length) { return; }
        state.titles[id] = Object.assign(title || {}, {
          id: id,
          trackId: "pro",
          countryId: "world",
          weightClassId: weight.id,
          bodyId: body,
          label: body.toUpperCase(),
          championId: candidates[0].id,
          active: true
        });
      });
    });
  }

  function repairProIntervals(state) {
    var pros;
    var total;
    if (!state || !state.roster) { return; }
    pros = state.roster.filter(function (fighter) {
      return fighter && fighter.trackId === "pro" && !fighter.retired;
    }).sort(function (a, b) { return (b.proRating || ovrOf(b)) - (a.proRating || ovrOf(a)); });

    total = Math.max(1, pros.length - 1);
    pros.forEach(function (fighter, index) {
      var ratio = index / total;
      var interval = Math.round(20 - ratio * 10);
      if (index < 4 || (fighter.titles && fighter.titles.length)) { interval = 20; }
      else if (index < 30) { interval = 15; }
      else if (interval < 10) { interval = 10; }
      fighter.proFightIntervalWeeks = interval;
      if (!fighter.nextNpcFightWeek || fighter.nextNpcFightWeek < (Number(state.week) || 1)) {
        fighter.nextNpcFightWeek = (Number(state.week) || 1) + interval;
      }
    });
  }

  function injectForeignOffersForMS(state) {
    var p = fighterById(state, state && state.playerId);
    var rank;
    var pool;
    if (!state || !p || p.trackId !== "amateur" || !(state.offers instanceof Array)) { return; }
    rank = p.amateurRankId || "";
    if (["ms", "msmk"].indexOf(rank) === -1) { return; }
    if (state.offers.some(function (offer) {
      var opponent = fighterById(state, offer.opponentId);
      return opponent && opponent.countryId !== p.countryId;
    })) { return; }

    pool = state.roster.filter(function (fighter) {
      return fighter && !fighter.isPlayer && fighter.trackId === "amateur" && fighter.weightClassId === p.weightClassId && fighter.countryId !== p.countryId && Math.abs(ovrOf(fighter) - ovrOf(p)) <= 18;
    });

    pool.slice(0, Math.min(3, state.offers.length)).forEach(function (fighter, index) {
      state.offers[index].opponentId = fighter.id;
    });
  }

  function addTournamentXpPatch() {
    var Amateur = window.FS && window.FS.Amateur;
    if (!Amateur || Amateur.__xpPatch239) { return; }
    Amateur.__xpPatch239 = true;

    function addXp(state, modal) {
      var p;
      var opponent;
      var diff;
      var key;
      if (!state || !modal || modal.type !== "tournamentResult") { return; }
      p = fighterById(state, state.playerId);
      opponent = fighterById(state, modal.session && modal.session.opponentId);
      if (!p) { return; }

      state.__tournamentXp239 = state.__tournamentXp239 || {};
      key = (modal.session && modal.session.competitionId || "t") + "|" + (modal.roundLabel || "") + "|" + (modal.opponentName || "") + "|" + (state.week || 1);
      if (state.__tournamentXp239[key]) { return; }
      state.__tournamentXp239[key] = true;

      diff = opponent ? (ovrOf(opponent) - ovrOf(p)) : 0;
      p.trainingPoints = (Number(p.trainingPoints) || 0) + Math.max(2, Math.min(8, 3 + Math.round(diff / 12)));
    }

    if (typeof Amateur.resolveTournamentRound === "function") {
      var oldResolve = Amateur.resolveTournamentRound.bind(Amateur);
      Amateur.resolveTournamentRound = function (state, modal) {
        var result = oldResolve(state, modal);
        addXp(state, result);
        return result;
      };
    }

    if (typeof Amateur.completeTournamentFightFromRing === "function") {
      var oldComplete = Amateur.completeTournamentFightFromRing.bind(Amateur);
      Amateur.completeTournamentFightFromRing = function (state, activeSession, payload) {
        var result = oldComplete(state, activeSession, payload);
        addXp(state, result);
        return result;
      };
    }
  }

  function mutateState(state) {
    forceVersion();
    ensureBirthDates(state);
    repairStreetRating(state);
    repairProTitles(state);
    repairProIntervals(state);
    injectForeignOffersForMS(state);
  }

  function injectStyles() {
    if (document.getElementById("fw-gameplay-239-style")) { return; }
    var style = document.createElement("style");
    style.id = "fw-gameplay-239-style";
    style.textContent = [
      ".top-pills,.player-strip{display:flex!important;gap:5px!important;align-items:center!important;flex-wrap:wrap!important}",
      ".top-pills>.pill,.player-strip>.pill,.top-pills>.pill-link,.player-strip>.pill-link,.rank-pill,button[data-path-rank-info]{flex:0 0 auto!important;width:auto!important;max-width:max-content!important;min-width:0!important;align-self:center!important;justify-content:center!important;white-space:nowrap!important}",
      ".rank-pill,.pill-link.rank-pill,button[data-path-rank-info]{display:inline-flex!important;padding:4px 9px!important;line-height:1!important;border-radius:999px!important}",
      ".country-label,.flag-pill,.country-pill,.fw-country-chip,.fw-country-chip .country-label{display:inline-flex!important;align-items:center!important;gap:5px!important;width:auto!important;max-width:max-content!important;min-width:0!important;white-space:nowrap!important;flex:0 0 auto!important}",
      ".flag-pill span,.country-pill span,.country-label span{width:auto!important;max-width:max-content!important;min-width:0!important}",
      ".fw-fight-list{display:grid!important;gap:6px!important;width:100%!important}",
      ".fw-fight-row,.fw-person-row{display:flex!important;align-items:center!important;gap:6px!important;width:100%!important;padding:5px 6px!important;border:1px solid rgba(255,255,255,.10)!important;border-radius:12px!important;background:rgba(255,255,255,.03)!important;white-space:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important}",
      ".fw-fight-row>* , .fw-person-row>*{flex:0 0 auto!important}",
      ".fw-person-row-wrap{display:block!important;width:100%!important}",
      ".fw-person-entry{padding:0!important;border:0!important;background:transparent!important}",
      ".fw-name-btn{width:auto!important;max-width:190px!important;min-width:0!important;padding:6px 10px!important;justify-content:flex-start!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}",
      ".fw-chip{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;width:auto!important;max-width:max-content!important;min-height:25px!important;padding:4px 8px!important;border:1px solid rgba(255,255,255,.11)!important;border-radius:999px!important;background:rgba(255,255,255,.045)!important;color:var(--text,#f4f4f5)!important;font-size:11px!important;line-height:1!important;white-space:nowrap!important}",
      ".fw-country-chip .country-label span{max-width:96px!important;overflow:hidden!important;text-overflow:ellipsis!important}",
      ".fw-chance-chip{color:#b9d4ff!important;border-color:rgba(59,130,246,.34)!important}",
      ".fw-money-chip,.fw-ovr-chip{color:#f3d98d!important;border-color:rgba(214,160,25,.34)!important}",
      ".fw-you-chip{color:#77e092!important;border-color:rgba(34,197,94,.34)!important}",
      ".fw-fight-btn{width:auto!important;min-width:48px!important;min-height:28px!important;padding:6px 10px!important;border-radius:10px!important;font-size:11px!important}",
      ".fight-line{display:none!important}",
      ".fw-inline-name{display:inline-flex!important;width:auto!important;max-width:max-content!important;padding:2px 6px!important;min-height:0!important;vertical-align:baseline!important}",
      "@media(max-width:760px){.fw-fight-row,.fw-person-row{gap:4px!important;padding:4px!important}.fw-name-btn{max-width:118px!important;padding:5px 8px!important}.fw-chip{font-size:10px!important;min-height:22px!important;padding:3px 6px!important}.fw-country-chip .country-label span{max-width:58px!important}.rank-pill,button[data-path-rank-info]{padding:3px 7px!important}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function patchRender() {
    var Render = window.FS && window.FS.Render;
    if (!Render || Render.__gameplayFix239 || typeof Render.dashboard !== "function") { return; }
    Render.__gameplayFix239 = true;
    var oldDashboard = Render.dashboard.bind(Render);

    Render.dashboard = function (state) {
      mutateState(state);
      var template = document.createElement("template");
      template.innerHTML = oldDashboard(state);
      injectStyles();
      patchFightRows(template.content, state);
      patchRankingRows(template.content, state);
      patchModalRosterRows(template.content, state);
      patchFavorites(template.content, state);
      patchChampionNews(template.content, state);
      return template.innerHTML;
    };
  }

  window.FWGameplayFix239 = {
    version: VERSION,
    hardUpdate: hardUpdate,
    clearFightCaches: clearFightCaches,
    unregisterServiceWorkers: unregisterServiceWorkers
  };

  forceVersion();
  installUpdateInterceptor();
  addTournamentXpPatch();
  patchRender();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      forceVersion();
      installUpdateInterceptor();
      addTournamentXpPatch();
      injectStyles();
      patchRender();
    });
  } else {
    forceVersion();
    installUpdateInterceptor();
    addTournamentXpPatch();
    injectStyles();
    patchRender();
  }

  window.addEventListener("load", function () {
    forceVersion();
    installUpdateInterceptor();
    addTournamentXpPatch();
    injectStyles();
    patchRender();
  });

  setInterval(forceVersion, 2000);
}());
