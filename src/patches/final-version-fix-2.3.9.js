(function () {
  "use strict";

  var VERSION = "final-version-fix-2.3.9";
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

    try {
      document.querySelectorAll(".version-badge,[data-version],[data-app-version]").forEach(function (node) {
        node.textContent = "2.3.9";
      });
    } catch (error) {}
  }

  function fightCacheName(key) {
    var value = String(key || "").toLowerCase();
    return value.indexOf("fight") !== -1 || value.indexOf("simulator") !== -1 || value.indexOf("fw-") === 0;
  }

  function clearFightCaches() {
    if (!window.caches || !caches.keys) {
      return Promise.resolve();
    }
    return caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return fightCacheName(key) ? caches.delete(key) : false;
      }));
    });
  }

  function unregisterServiceWorkers() {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.getRegistrations) {
      return Promise.resolve();
    }
    return navigator.serviceWorker.getRegistrations().then(function (registrations) {
      return Promise.all(registrations.map(function (registration) {
        return registration.unregister();
      }));
    });
  }

  function hardUpdate(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }
    }

    try {
      localStorage.setItem("fightWorldUpdateTarget", VERSION);
      sessionStorage.setItem("fightWorldUpdateTarget", VERSION);
    } catch (error) {}

    var done = function () {
      window.location.replace("./reset-cache.html?fromUpdateButton=2.3.9&target=2.3.9&t=" + Date.now());
    };

    forceVersion();
    unregisterServiceWorkers().then(clearFightCaches).then(done).catch(done);
    return false;
  }

  function installUpdateButtonFix() {
    if (window.__fightWorldFinalUpdateFix239) {
      return;
    }
    window.__fightWorldFinalUpdateFix239 = true;

    ["click", "touchend", "pointerup"].forEach(function (type) {
      document.addEventListener(type, function (event) {
        var button = event.target && event.target.closest ? event.target.closest("button") : null;
        var text;

        if (!button) {
          return;
        }

        text = (button.textContent || "").trim().toLowerCase();
        if (
          button.classList.contains("update-now-btn") ||
          button.dataset.updateNow ||
          button.dataset.action === "force-update" ||
          text.indexOf("обновить") !== -1
        ) {
          return hardUpdate(event);
        }
      }, true);
    });
  }

  function refs() {
    window.FS = window.FS || {};
    return {
      U: window.FS.Utils || {},
      F: window.FS.Fight || {},
      D: window.FS.Data || {}
    };
  }

  function fighterById(state, id) {
    var r = refs();
    if (!state || !id) {
      return null;
    }
    if (r.U.getFighterById) {
      return r.U.getFighterById(state, id);
    }
    return (state.roster || state.fighters || []).find(function (fighter) {
      return fighter && fighter.id === id;
    }) || null;
  }

  function nameOf(fighter) {
    if (!fighter) {
      return "Боец";
    }
    return fighter.name || fighter.fullName || ((fighter.firstName || "") + " " + (fighter.lastName || fighter.surname || "")).trim() || "Боец";
  }

  function recordOf(fighter) {
    var r = refs();
    var record;
    if (!fighter) {
      return "0-0-0";
    }
    if (r.U.recordText) {
      return r.U.recordText(fighter.record || fighter);
    }
    record = fighter.record || fighter;
    return (record.wins || 0) + "-" + (record.losses || 0) + "-" + (record.draws || 0);
  }

  function ovrOf(fighter) {
    var r = refs();
    if (!fighter) {
      return 0;
    }
    if (r.U.statAverage) {
      return r.U.statAverage(fighter.stats || fighter);
    }
    return Math.round(Number(fighter.ovr || fighter.overall || fighter.rating || 0));
  }

  function countryById(countryId) {
    var r = refs();
    if (r.U.findCountry) {
      return r.U.findCountry(countryId);
    }
    return (r.D.countries || []).find(function (country) {
      return country && country.id === countryId;
    }) || { id: countryId, label: countryId || "—", flag: "" };
  }

  function countryHtml(countryId) {
    var country = countryById(countryId);
    var label = (country && (country.label || country.name)) || countryId || "—";
    var flag = country && country.flag
      ? '<img class="flag-icon" src="' + esc(country.flag) + '" alt="' + esc(label) + '">'
      : "";
    return '<span class="country-label">' + flag + '<span>' + esc(label) + '</span></span>';
  }

  function previewFor(state, offer) {
    var r = refs();
    if (r.F.buildFightPreview && offer && offer.id) {
      try {
        return r.F.buildFightPreview(state, offer.id);
      } catch (error) {}
    }
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

    if (!opponent) {
      return "";
    }

    preview = previewFor(state, offer);
    chance = preview.winChance != null ? preview.winChance : (offer.winChance != null ? offer.winChance : offer.chance);
    if (chance == null) {
      chance = "—";
    } else if (typeof chance === "number") {
      chance = Math.round(chance) + "%";
    } else if (String(chance).indexOf("%") === -1 && chance !== "—") {
      chance = String(chance) + "%";
    }

    purse = preview.purse != null ? preview.purse : (offer.purse != null ? offer.purse : (offer.reward != null ? offer.reward : offer.money));
    rating = preview.opponentRating != null ? preview.opponentRating : ovrOf(opponent);

    return '<div class="fw-fight-row">' +
      '<button class="small-btn fighter-name-btn fw-tight-name" data-fighter="' + esc(opponent.id) + '">' + esc(nameOf(opponent)) + '</button>' +
      '<span class="fw-chip fw-country">' + countryHtml(opponent.countryId || opponent.currentCountryId || opponent.homeCountryId) + '</span>' +
      '<span class="fw-chip fw-chance">Шанс ' + esc(chance) + '</span>' +
      '<span class="fw-chip fw-money">' + esc(moneyText(purse)) + '</span>' +
      '<span class="fw-chip fw-ovr">OVR ' + esc(rating) + '</span>' +
      '<button class="primary fw-fight-btn" data-preview-fight="' + esc(offer.id) + '">Бой</button>' +
    '</div>';
  }

  function personRowHtml(state, fighter, position) {
    if (!fighter) {
      return "";
    }

    return '<div class="fw-person-row">' +
      (position ? '<span class="fw-pos">#' + esc(position) + '</span>' : "") +
      '<button class="small-btn fighter-name-btn fw-tight-name" data-fighter="' + esc(fighter.id) + '">' + esc(nameOf(fighter)) + '</button>' +
      '<span class="fw-chip fw-country">' + countryHtml(fighter.countryId || fighter.currentCountryId || fighter.homeCountryId) + '</span>' +
      '<span class="fw-chip fw-record">' + esc(recordOf(fighter)) + '</span>' +
      '<span class="fw-chip fw-ovr">OVR ' + esc(ovrOf(fighter)) + '</span>' +
      (fighter.isPlayer ? '<span class="fw-chip fw-you">Ты</span>' : "") +
    '</div>';
  }

  function patchFightRows(root, state) {
    var offers;
    var list;
    var anchor;

    if (!root || !state) {
      return;
    }

    offers = (state.offers || []).filter(function (offer) {
      return offer && !offer.isCompetition && offer.opponentId;
    });

    list = root.querySelector(".fight-lines, .offer-list.compact-offers.fight-lines, .offer-list.fight-lines");
    if (!list) {
      if ((state.selectedTab || "") !== "fights") {
        return;
      }
      anchor = root.querySelector(".fights-head, .content-card");
      if (!anchor || !anchor.parentNode) {
        return;
      }
      list = document.createElement("div");
      anchor.parentNode.insertBefore(list, anchor.nextSibling);
    }

    list.className = "fw-fight-list";
    list.innerHTML = offers.length
      ? offers.map(function (offer) { return fightRowHtml(state, offer); }).join("")
      : '<div class="content-card"><div class="muted small">Пусто.</div></div>';
  }

  function patchExistingPersonRows(root, state) {
    if (!root || !state) {
      return;
    }

    root.querySelectorAll(".ranking-list .split-row, .modal .split-row, .favorite-list .split-row").forEach(function (row, index) {
      var button = row.querySelector("button[data-fighter]");
      var fighter;
      var positionText;
      var positionMatch;

      if (!button || row.classList.contains("fw-person-row")) {
        return;
      }

      fighter = fighterById(state, button.getAttribute("data-fighter"));
      if (!fighter) {
        return;
      }

      positionText = row.textContent || "";
      positionMatch = positionText.match(/#\s*(\d+)/);
      row.outerHTML = personRowHtml(state, fighter, positionMatch ? positionMatch[1] : "");
    });

    root.querySelectorAll(".modal .content-card, .ranking-list, .favorite-list").forEach(function (list) {
      if (list.querySelector(".fw-person-row")) {
        list.classList.add("fw-person-list");
      }
    });
  }

  function patchRanking(root, state) {
    var U = refs().U;
    var list;
    var ranking;
    var countryId;
    var trackId;
    var weightId;
    var page;
    var pageSize;

    if (!root || !state || !U || !U.getFighterById) {
      return;
    }

    list = root.querySelector(".ranking-list");
    if (!list) {
      return;
    }

    countryId = state.rankingTrackId === "pro" ? "world" : state.rankingCountryId;
    trackId = state.rankingTrackId || "amateur";
    weightId = trackId === "street" ? "" : state.rankingWeightClassId;
    pageSize = 24;
    page = Math.max(0, Number(state.rankingPage) || 0);

    if (window.FS.State && window.FS.State.ranking) {
      ranking = window.FS.State.ranking(state, countryId, trackId, weightId) || [];
      list.className = "ranking-list fw-person-list";
      list.innerHTML = ranking.slice(page * pageSize, page * pageSize + pageSize).map(function (fighter, i) {
        return personRowHtml(state, fighter, page * pageSize + i + 1);
      }).join("") || '<div class="muted small">Пусто.</div>';
    }
  }

  function patchNewsChampionLinks(root, state) {
    var fighters;

    if (!root || !state || !state.roster) {
      return;
    }

    fighters = state.roster.slice().sort(function (a, b) {
      return nameOf(b).length - nameOf(a).length;
    }).slice(0, 3500);

    root.querySelectorAll(".news-inline-text, .news-row-card .muted, .news-row-card").forEach(function (node) {
      var html;

      if (node.querySelector && node.querySelector("button[data-fighter]")) {
        return;
      }

      html = esc(node.textContent || "");
      fighters.forEach(function (fighter) {
        var name = nameOf(fighter);
        var safeName;
        var pattern;

        if (!name || name.length < 5) {
          return;
        }

        safeName = esc(name);
        pattern = new RegExp("\\b" + safeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g");
        html = html.replace(pattern, '<button class="small-btn fighter-name-btn fw-inline-name" data-fighter="' + esc(fighter.id) + '">' + safeName + '</button>');
      });

      node.innerHTML = html;
    });
  }

  function injectStyles() {
    var style;

    if (document.getElementById("fw-final-239-style")) {
      return;
    }

    style = document.createElement("style");
    style.id = "fw-final-239-style";
    style.textContent = [
      ".top-pills,.player-strip{display:flex!important;align-items:center!important;gap:5px!important;flex-wrap:wrap!important;min-width:0!important}",
      ".top-pills .pill,.player-strip .pill,.country-pill,.flag-pill,.date-pill,.record-pill,.rank-pill,.pill-link.rank-pill{flex:0 0 auto!important;width:auto!important;min-width:0!important;max-width:max-content!important;white-space:nowrap!important;align-self:center!important}",
      ".rank-pill,.pill-link.rank-pill,.topbar .rank-pill,.player-strip .rank-pill{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:auto!important;min-width:0!important;max-width:max-content!important;padding:4px 8px!important;line-height:1!important;border-radius:999px!important;white-space:nowrap!important}",
      ".country-label{display:inline-flex!important;align-items:center!important;gap:5px!important;width:auto!important;min-width:0!important;max-width:max-content!important;white-space:nowrap!important}",
      ".country-label span{display:inline-block!important;max-width:120px!important;overflow:hidden!important;text-overflow:ellipsis!important}",
      ".fw-fight-list,.fw-person-list{display:grid!important;gap:6px!important;width:100%!important;min-width:0!important}",
      ".fw-fight-row,.fw-person-row{display:flex!important;align-items:center!important;gap:6px!important;width:100%!important;padding:5px 6px!important;border:1px solid rgba(255,255,255,.10)!important;border-radius:12px!important;background:rgba(255,255,255,.028)!important;white-space:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important}",
      ".fw-fight-row>* , .fw-person-row>*{flex:0 0 auto!important}",
      ".fw-tight-name{display:inline-flex!important;width:auto!important;min-width:0!important;max-width:190px!important;padding:6px 10px!important;justify-content:flex-start!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}",
      ".fw-chip,.fw-pos{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;width:auto!important;min-width:0!important;max-width:max-content!important;min-height:25px!important;padding:4px 8px!important;border-radius:999px!important;border:1px solid rgba(255,255,255,.11)!important;background:rgba(255,255,255,.045)!important;font-size:11px!important;line-height:1!important;white-space:nowrap!important}",
      ".fw-country{width:auto!important;min-width:0!important;max-width:max-content!important;justify-content:flex-start!important}",
      ".fw-country .country-label span{max-width:90px!important}",
      ".fw-record{max-width:124px!important;overflow:hidden!important;text-overflow:ellipsis!important}",
      ".fw-chance{color:#b9d4ff!important;border-color:rgba(59,130,246,.35)!important}",
      ".fw-money,.fw-ovr{color:#f3d98d!important;border-color:rgba(214,160,25,.34)!important}",
      ".fw-you{color:#86efac!important;border-color:rgba(34,197,94,.34)!important}",
      ".fw-fight-btn{width:auto!important;min-width:48px!important;min-height:28px!important;padding:6px 10px!important;font-size:11px!important;border-radius:10px!important}",
      ".fight-line{display:none!important}",
      ".fw-inline-name{padding:3px 7px!important;min-height:0!important;max-width:max-content!important;width:auto!important}",
      "@media(max-width:760px){.fw-fight-row,.fw-person-row{gap:5px!important;padding:4px!important}.fw-tight-name{max-width:118px!important}.fw-chip,.fw-pos{font-size:10px!important;padding:4px 6px!important}.country-label span,.fw-country .country-label span{max-width:58px!important}.fw-record{max-width:82px!important}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function patchRender() {
    var Render = window.FS && window.FS.Render;

    if (!Render || Render.__finalVersionFix239 || typeof Render.dashboard !== "function") {
      return;
    }

    Render.__finalVersionFix239 = true;
    var originalDashboard = Render.dashboard.bind(Render);

    Render.dashboard = function dashboardFinalVersionFix(state) {
      var template = document.createElement("template");

      forceVersion();
      template.innerHTML = originalDashboard(state);
      injectStyles();
      patchFightRows(template.content, state);
      patchRanking(template.content, state);
      patchExistingPersonRows(template.content, state);
      patchNewsChampionLinks(template.content, state);

      return template.innerHTML;
    };
  }

  window.FWFinalFix239 = {
    version: VERSION,
    hardUpdate: hardUpdate,
    forceVersion: forceVersion,
    clearFightCaches: clearFightCaches,
    unregisterServiceWorkers: unregisterServiceWorkers
  };

  forceVersion();
  installUpdateButtonFix();
  patchRender();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      forceVersion();
      installUpdateButtonFix();
      injectStyles();
      patchRender();
    });
  } else {
    forceVersion();
    installUpdateButtonFix();
    injectStyles();
    patchRender();
  }

  window.addEventListener("load", function () {
    forceVersion();
    installUpdateButtonFix();
    injectStyles();
    patchRender();
  });

  window.setInterval(forceVersion, 2000);
}());
