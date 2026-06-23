(function () {
  "use strict";

  window.FS = window.FS || {};

  var Storage = window.FS.Storage;
  var State = window.FS.State;
  var World = window.FS.World;
  var Fight = window.FS.Fight;
  var Render = window.FS.Render;
  var app = document.getElementById("app");
  var bootSplash = document.getElementById("bootSplash");
  var state = null;
  var bootReady = false;

  function prepareLoadedState(loaded, restoreMessage) {
    if (!loaded) { return null; }
    if (loaded._migrationReport) {
      loaded.feed = loaded._migrationReport;
      Storage.save(loaded);
    }
    State.repairState(loaded);
    loaded.feed = loaded.feed || restoreMessage || "Карьера восстановлена.";
    return loaded;
  }

  function finishBoot() {
    if (bootReady) { return; }
    bootReady = true;
    if (bootSplash) {
      bootSplash.classList.add("hidden");
      window.setTimeout(function () {
        if (bootSplash && bootSplash.parentNode) { bootSplash.parentNode.removeChild(bootSplash); }
      }, 260);
    }
    if (document.body) { document.body.classList.remove("app-booting"); }
  }

  function initializeBoot() {
    var loadedSync = prepareLoadedState(Storage.load(), "Карьера восстановлена.");
    if (loadedSync && State.player(loadedSync)) {
      state = loadedSync;
      finishBoot();
      render();
      return;
    }

    if (!Storage.loadAsync) {
      finishBoot();
      render();
      return;
    }

    Storage.loadAsync().then(function (loadedAsync) {
      state = prepareLoadedState(loadedAsync, "Карьера восстановлена.");
      finishBoot();
      render();
    }).catch(function () {
      state = null;
      finishBoot();
      render();
    });
  }

  function persistNow() {
    if (state && State.player(state)) {
      Storage.save(state);
    }
  }

  function continueCareer() {
    var loaded = Storage.load();
    if (!loaded || !State.player(loaded)) {
      window.alert("Сохранение не найдено.");
      return;
    }
    state = prepareLoadedState(loaded, "Карьера продолжена.");
    saveAndRender();
  }

  function saveAndRender() {
    persistNow();
    render();
  }

  function rebuildWorld(message) {
    State.repairState(state);
    World.bootstrapWorld(state);
    World.refreshOffers(state);
    state.feed = message || "Состояние игры обновлено.";
  }

  function createCareerFromForm() {
    var archetypeInput = document.querySelector("input[name='careerArchetype']:checked");
    state = State.createCareer({
      name: document.getElementById("careerName").value.trim(),
      archetypeId: archetypeInput ? archetypeInput.value : "amateur",
      countryId: document.getElementById("careerCountry").value,
      weightClassId: document.getElementById("careerWeightClass").value,
      stanceId: ""
    });

    World.bootstrapWorld(state);
    saveAndRender();
  }

  function resetCareer() {
    Storage.clear();
    state = null;
    render();
  }

  function importSave() {
    var raw = window.prompt("Вставь JSON сохранения:");
    var imported;

    if (!raw) {
      return;
    }

    imported = Storage.importString(raw);
    if (!imported || !State.player(imported)) {
      window.alert("Не удалось импортировать сохранение.");
      return;
    }

    state = prepareLoadedState(imported, "Сохранение импортировано.");
    if (window.FS.Clubs) { window.FS.Clubs.ensureClubs(state); }
    if (!state.offers || !state.offers.length) { World.refreshOffers(state); }
    state.feed = "Сохранение импортировано.";
    saveAndRender();
  }

  function setupPersistentSave() {
    window.addEventListener("pagehide", persistNow);
    window.addEventListener("beforeunload", persistNow);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        persistNow();
      }
    });
  }

  function applyMobileCollapse() {
    return;
  }

  var updateNoticeVisible = false;
  var updateReloading = false;
  var pendingUpdateRegistration = null;
  var updateCheckTimer = null;

  function removeUpdateNotice() {
    var existing = document.getElementById("appUpdateNotice");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    updateNoticeVisible = false;
  }

  function showUpdateNotice(registration, remoteVersion) {
    var existing;
    var button;
    var text;
    if (updateNoticeVisible) { return; }
    updateNoticeVisible = true;
    pendingUpdateRegistration = registration || pendingUpdateRegistration;

    existing = document.createElement("div");
    existing.id = "appUpdateNotice";
    existing.className = "update-notice";
    existing.innerHTML =
      '<div class="update-notice-text">' +
        '<strong>Доступна новая версия</strong>' +
        '<span>' + (remoteVersion ? ('Последняя версия: ' + remoteVersion + '.') : 'Можно обновиться до последней сборки.') + '</span>' +
      '</div>' +
      '<button class="primary update-now-btn" type="button">Обновить до последней версии</button>' +
      '<button class="small-btn update-later-btn" type="button" aria-label="Позже">Позже</button>';

    button = existing.querySelector(".update-now-btn");
    button.addEventListener("click", function () {
      applyUpdateNow();
    });

    existing.querySelector(".update-later-btn").addEventListener("click", function () {
      removeUpdateNotice();
    });

    document.body.appendChild(existing);
  }

  function applyUpdateNow() {
    updateReloading = true;
    persistNow();

    function go() {
      window.location.replace("./reset-cache.html?fromUpdateButton=2.5.1&target=2.5.1&t=" + Date.now());
    }

    function clearFightCaches() {
      if (!window.caches || !caches.keys) { return Promise.resolve(); }
      return caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (key) {
          var low = String(key || "").toLowerCase();
          if (low.indexOf("fight") !== -1 || low.indexOf("simulator") !== -1 || low.indexOf("fw-") === 0) {
            return caches.delete(key);
          }
          return false;
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

    unregisterServiceWorkers().then(clearFightCaches).then(go).catch(go);
  }

  function checkRemoteVersion(registration) {
    if (!navigator.onLine) { return; }
    fetch("./version.json?updateCheck=" + Date.now(), {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" }
    }).then(function (response) {
      if (!response.ok) { return null; }
      return response.json();
    }).then(function (remote) {
      if (!remote || !remote.version) { return; }
      if (remote.version !== Data.appVersion) {
        showUpdateNotice(registration || pendingUpdateRegistration, remote.version);
      }
    }).catch(function () {});
  }

  function registerOfflineApp() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (!updateReloading) { return; }
      updateReloading = false;
      persistNow();
      window.location.reload();
    });

    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js")
        .then(function (registration) {
          pendingUpdateRegistration = registration;

          if (registration.waiting && navigator.serviceWorker.controller) {
            showUpdateNotice(registration);
          }

          registration.addEventListener("updatefound", function () {
            var worker = registration.installing;
            if (!worker) { return; }
            worker.addEventListener("statechange", function () {
              if (worker.state === "installed" && navigator.serviceWorker.controller) {
                showUpdateNotice(registration);
              }
            });
          });

          checkRemoteVersion(registration);
          registration.update().catch(function () {});

          if (updateCheckTimer) {
            window.clearInterval(updateCheckTimer);
          }
          updateCheckTimer = window.setInterval(function () {
            registration.update().catch(function () {});
            checkRemoteVersion(registration);
          }, 5 * 60 * 1000);

          document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "visible") {
              registration.update().catch(function () {});
              checkRemoteVersion(registration);
            }
          });

          console.log("Fight World offline cache ready.");
        })
        .catch(function (error) {
          console.warn("Offline cache registration failed:", error);
        });
    });
  }

  var fightWindow = null;

  function fightModalOpenInWindow() {
    return false;
  }

  function openFightWindow() {
    return;
  }

  function closeFightWindow() {
    return;
  }

  window.FSApp = {
    handleFightWindowButton: function (data) {
      if (!state) { return; }

      if (data.fightAction) {
        Fight.playerAction(state, data.fightAction, 0, 0);
      } else if (data.fightMove) {
        var parts = data.fightMove.split(",");
        Fight.playerAction(state, "move", parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0);
      } else if (data.fightCount) {
        Fight.handleCount(state);
      } else if (data.tournamentFight) {
        if (window.FS.Amateur && window.FS.Amateur.resolveTournamentRound) {
          state.modal = window.FS.Amateur.resolveTournamentRound(state, state.modal);
        }
      } else if (data.tournamentRing) {
        if (Fight.startTournamentInteractiveFight) {
          Fight.startTournamentInteractiveFight(state, state.modal);
        }
      } else if (data.tournamentContinue) {
        if (window.FS.Amateur && window.FS.Amateur.continueTournament) {
          state.modal = window.FS.Amateur.continueTournament(state, state.modal);
        }
      } else if (data.closeFightWindow) {
        state.modal = null;
      }

      Storage.save(state);
      render();
      if (fightModalOpenInWindow()) {
      } else {
      }
    }
  };


  function applyIntegratedGameplayFixes(targetState) {
    var U = window.FS && window.FS.Utils ? window.FS.Utils : {};
    var D = window.FS && window.FS.Data ? window.FS.Data : {};
    var T = window.FS && window.FS.Titles ? window.FS.Titles : {};

    function byId(id) {
      if (!targetState || !id) { return null; }
      if (U.getFighterById) { return U.getFighterById(targetState, id); }
      return (targetState.roster || []).find(function (fighter) { return fighter && fighter.id === id; }) || null;
    }

    function ovr(fighter) {
      if (!fighter) { return 0; }
      if (U.statAverage) { return U.statAverage(fighter.stats || fighter); }
      return Math.round(Number(fighter.ovr || fighter.rating || 0));
    }

    function ensureAges() {
      if (!targetState || !targetState.roster) { return; }
      var week = Number(targetState.week) || 1;
      targetState.roster.forEach(function (fighter) {
        var age;
        if (!fighter) { return; }
        age = Math.max(14, Number(fighter.age) || (fighter.isPlayer ? 18 : 20));
        if (!fighter.birthWeek) {
          fighter.birthWeek = Math.max(1, week - age * 48);
          fighter.birthYear = Math.floor((fighter.birthWeek - 1) / 48) + 1;
          fighter.birthMonth = Math.floor(((fighter.birthWeek - 1) % 48) / 4) + 1;
          fighter.birthWeekOfMonth = ((fighter.birthWeek - 1) % 4) + 1;
        }
        fighter.age = Math.max(14, Math.floor((week - fighter.birthWeek) / 48));
        fighter.birthdayLabel = "год " + fighter.birthYear + ", месяц " + fighter.birthMonth + ", " + fighter.birthWeekOfMonth + " неделя";
      });
    }

    function updateStreetRating() {
      if (!targetState || !targetState.roster) { return; }
      targetState.roster.forEach(function (fighter) {
        var record;
        var total;
        var winRate;
        if (!fighter || fighter.trackId !== "street") { return; }
        record = fighter.record || {};
        total = (record.wins || 0) + (record.losses || 0) + (record.draws || 0);
        winRate = total ? ((record.wins || 0) + 0.5 * (record.draws || 0)) / total : 0.5;
        fighter.streetRating = Math.round(ovr(fighter) * 0.8 + Math.round(winRate * 150) * 0.2);
      });
    }

    function updateProCadence() {
      var list;
      if (!targetState || !targetState.roster) { return; }
      list = targetState.roster.filter(function (fighter) {
        return fighter && fighter.trackId === "pro" && !fighter.retired;
      }).sort(function (a, b) {
        return (ovr(b) + ((b.record && b.record.wins) || 0)) - (ovr(a) + ((a.record && a.record.wins) || 0));
      });

      list.forEach(function (fighter, index) {
        var total = Math.max(1, list.length - 1);
        var t = index / total;
        var wait = Math.round(20 - t * 10);
        if (index < 4) { wait = 20; }
        else if (index < 25) { wait = 15; }
        else if (wait < 10) { wait = 10; }
        fighter.proFightIntervalWeeks = wait;
        if (!fighter.contractOpponentId && !fighter.nextFightWeek) {
          fighter.nextFightWeek = (Number(targetState.week) || 1) + wait;
        }
      });
    }

    function repairProTitles() {
      if (!targetState || !targetState.roster || !D.weightClasses) { return; }
      targetState.titles = targetState.titles || {};
      ["wbc", "wba", "wbo", "ibf"].forEach(function (bodyId) {
        D.weightClasses.forEach(function (weight) {
          var id = "pro_" + bodyId + "_" + weight.id;
          var title = targetState.titles[id];
          var champion = title && byId(title.championId);
          var pool;
          if (champion && !champion.retired) { return; }
          pool = targetState.roster.filter(function (fighter) {
            return fighter && fighter.trackId === "pro" && fighter.weightClassId === weight.id && !fighter.retired;
          }).sort(function (a, b) { return ovr(b) - ovr(a); });
          if (pool[0]) {
            targetState.titles[id] = Object.assign(title || {}, {
              id: id,
              trackId: "pro",
              countryId: "world",
              weightClassId: weight.id,
              bodyId: bodyId,
              label: bodyId.toUpperCase(),
              championId: pool[0].id,
              active: true
            });
          }
        });
      });
    }

    function addForeignAmateurOffers() {
      var player;
      var rank;
      var pool;
      if (!targetState || !targetState.offers) { return; }
      player = State.player(targetState);
      if (!player || player.trackId !== "amateur") { return; }
      rank = player.amateurRankId || "";
      if (["ms", "msmk"].indexOf(rank) === -1) { return; }
      if (targetState.offers.some(function (offer) {
        var fighter = byId(offer.opponentId);
        return fighter && fighter.countryId !== player.countryId;
      })) { return; }

      pool = (targetState.roster || []).filter(function (fighter) {
        return fighter &&
          fighter.trackId === "amateur" &&
          fighter.weightClassId === player.weightClassId &&
          fighter.countryId !== player.countryId &&
          Math.abs(ovr(fighter) - ovr(player)) <= 18;
      });

      for (var i = 0; i < Math.min(3, pool.length, targetState.offers.length); i += 1) {
        targetState.offers[i].opponentId = pool[i].id;
      }
    }

    function tournamentXp() {
      var modal = targetState && targetState.modal;
      var player;
      var key;
      var opponentRating;
      var gain;
      if (!modal || modal.type !== "tournamentResult" || !modal.session) { return; }
      player = State.player(targetState);
      if (!player) { return; }
      key = [targetState.week, modal.label, modal.roundLabel, modal.opponentName, modal.result].join("|");
      if (targetState.__lastTournamentXpKey === key) { return; }
      targetState.__lastTournamentXpKey = key;
      opponentRating = Number(modal.opponentRating) || 0;
      gain = modal.result === "Победа" ? Math.max(3, Math.round(3 + (opponentRating - ovr(player)) / 12)) : 2;
      player.trainingPoints = (Number(player.trainingPoints) || 0) + gain;
    }

    ensureAges();
    updateStreetRating();
    updateProCadence();
    repairProTitles();
    addForeignAmateurOffers();
    tournamentXp();
  }

  function render() {
    if (!bootReady && !state) {
      app.innerHTML = "";
      return;
    }

    if (!state || !State.player(state)) {
      app.innerHTML = Render.start(Storage.savedSummary ? Storage.savedSummary() : null);
      return;
    }

    applyIntegratedGameplayFixes(state);
    State.repairState(state);

    var normalOfferCount = (state.offers || []).filter(function (offer) {
      return !offer.isCompetition;
    }).length;

    if (!state.offers || normalOfferCount !== 10) {
      World.refreshOffers(state);
      Storage.save(state);
    }

    app.innerHTML = Render.dashboard(state);
    applyMobileCollapse();
    if (fightModalOpenInWindow()) {
    }
  }


  function isFatigueLockedAction(button) {
    if (!state || !State.isLockedByFatigue || !State.isLockedByFatigue(state)) { return false; }
    if (button.dataset.action === "rest-week" || button.dataset.action === "reset-career" || button.dataset.action === "close-modal" || button.dataset.action === "export-save" || button.dataset.action === "patch-notes") { return false; }
    if (button.dataset.mobileToggle || button.dataset.tab || button.dataset.rankingPage || button.dataset.teamPage || button.dataset.tournamentParticipantsPage || button.dataset.backToTournament) { return false; }
    return true;
  }

  function isFightLockedModal() {
    return state && state.modal && (state.modal.type === "activeFight" || state.modal.type === "fightCount");
  }

  document.addEventListener("click", function (event) {
    var mobileMoreCloseTarget = event.target && event.target.closest ? event.target.closest("[data-mobile-more-close]") : null;
    if (mobileMoreCloseTarget && state) {
      state.mobileMoreOpen = false;
      saveAndRender();
      return;
    }

    var button = event.target.closest("button");
    var preview;

    if (!button) {
      return;
    }

    if (button.dataset.startCountry) {
      var countryInput = document.getElementById("careerCountry");
      var countryDropdown = document.getElementById("careerCountryDropdown");
      if (countryInput) { countryInput.value = button.dataset.startCountry; }
      if (countryDropdown && Render.startCountryDropdown) {
        countryDropdown.innerHTML = Render.startCountryDropdown(button.dataset.startCountry);
      }
      var openDetails = button.closest("details");
      if (openDetails) { openDetails.open = false; }
      return;
    }

    if (button.dataset.action === "continue-career") {
      continueCareer();
      return;
    }

    if (button.dataset.action === "import-save") {
      importSave();
      return;
    }

    if (button.dataset.action === "reset-save") {
      if (window.confirm("Удалить сохранение?")) {
        Storage.clear();
        state = null;
        render();
      }
      return;
    }

    if (button.dataset.action === "create-career") {
      createCareerFromForm();
      return;
    }

    if (!state) {
      return;
    }

    if (button.dataset.mobileMore) {
      state.mobileMoreOpen = !state.mobileMoreOpen;
      saveAndRender();
      return;
    }

    if (button.dataset.mobileMoreClose) {
      state.mobileMoreOpen = false;
      saveAndRender();
      return;
    }

    if (state.gameOver && button.dataset.action !== "reset-career" && button.dataset.action !== "export-save" && button.dataset.action !== "close-modal") {
      state.modal = state.modal || { type: "gameOver", title: "Игра окончена", text: "Карьера завершена.", money: State.player(state) ? State.player(state).money : 0 };
      saveAndRender();
      return;
    }

    if (isFightLockedModal() && !button.dataset.fightAction && !button.dataset.fightMove && !button.dataset.fightCount) {
      return;
    }

    if (isFatigueLockedAction(button)) {
      if (State.fatigueLockedModal) { State.fatigueLockedModal(state); }
      saveAndRender();
      return;
    }

    if (button.dataset.fightAction) {
      Fight.playerAction(state, button.dataset.fightAction, 0, 0);
      saveAndRender();
    } else if (button.dataset.fightMove) {
      var parts = button.dataset.fightMove.split(",");
      Fight.playerAction(state, "move", parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0);
      saveAndRender();
    } else if (button.dataset.fightCount) {
      Fight.handleCount(state);
      saveAndRender();
    } else if (button.dataset.action === "reset-career") {
      resetCareer();
    } else if (button.dataset.action === "next-week") {
      state.mobileMoreOpen = false;
      state.feed = "Неделя " + (state.week + 1) + ". Мир сделал недельный ход.";
      World.advanceWeek(state, "skip");
      saveAndRender();
    } else if (button.dataset.action === "train-week") {
      State.trainPlayer(state);
      World.advanceWeek(state, "training");
      saveAndRender();
    } else if (button.dataset.action === "rest-week") {
      if (State.restPlayer) { State.restPlayer(state); }
      World.advanceWeek(state, "rest");
      if (!State.isLockedByFatigue || !State.isLockedByFatigue(state)) { state.modal = null; }
      saveAndRender();
    } else if (button.dataset.action === "patch-notes") {
      state.modal = {
        type: "patchNotes"
      };
      saveAndRender();
    } else if (button.dataset.action === "repair-save") {
      rebuildWorld("Сохранение проверено и починено.");
      saveAndRender();
    } else if (button.dataset.action === "deep-repair") {
      rebuildWorld("Глубокая починка: сохранение, клубы, сборные, титулы и офферы пересобраны.");
      if (State.applyMonthlyExpenses) { State.applyMonthlyExpenses(state); }
      saveAndRender();
    } else if (button.dataset.action === "world-audit") {
      state.modal = {
        type: "worldAudit",
        report: window.FS.Matchmaking ? window.FS.Matchmaking.auditWorld(state) : { fighters: state.roster.length, clubs: state.clubs.length, titles: Object.keys(state.titles || {}).length, offers: state.offers.length, repairedRecords: 0, missingGym: 0 }
      };
      saveAndRender();
    } else if (button.dataset.action === "export-save") {
      state.modal = {
        type: "saveExport",
        payload: Storage.exportString(state)
      };
      saveAndRender();
    } else if (button.dataset.action === "import-save") {
      importSave();
    } else if (button.dataset.action === "close-modal") {
      state.modal = null;
      saveAndRender();
    } else if (button.dataset.tab) {
      state.selectedTab = button.dataset.tab;
      state.mobileMoreOpen = false;
      saveAndRender();
    } else if (button.dataset.teamList) {
      state.modal = {
        type: "teamList",
        countryId: button.dataset.teamCountry,
        listType: button.dataset.teamList,
        page: 0
      };
      saveAndRender();
    } else if (button.dataset.teamPage) {
      if (state.modal && state.modal.type === "teamList") {
        state.modal.page = Math.max(0, parseInt(button.dataset.teamPage, 10) || 0);
      }
      saveAndRender();
    } else if (button.dataset.tournamentParticipants) {
      if (state.modal) {
        state.modal = {
          type: "tournamentParticipants",
          sourceModal: state.modal,
          page: 0
        };
      }
      saveAndRender();
    } else if (button.dataset.tournamentParticipantsPage) {
      if (state.modal && state.modal.type === "tournamentParticipants") {
        state.modal.page = Math.max(0, parseInt(button.dataset.tournamentParticipantsPage, 10) || 0);
      }
      saveAndRender();
    } else if (button.dataset.backToTournament) {
      if (state.modal && state.modal.sourceModal) {
        state.modal = state.modal.sourceModal;
      }
      saveAndRender();
    } else if (button.dataset.amateurCompetition) {
      if (window.FS.Amateur && window.FS.Amateur.startTournament) {
        state.modal = window.FS.Amateur.startTournament(state, button.dataset.amateurCompetition);
      }
      saveAndRender();
    } else if (button.dataset.tournamentInvite) {
      state.world = state.world || {};
      state.world.pendingTournamentInvite = state.world.pendingTournamentInvite || {};
      if (button.dataset.tournamentInvite === "accept") {
        state.world.pendingTournamentInvite.accepted = true;
        state.world.pendingTournamentInvite.ignored = false;
        state.feed = "Заявка принята. Турнир начнётся на следующей неделе.";
      } else {
        state.world.pendingTournamentInvite.ignored = true;
        state.feed = "Турнир проигнорирован.";
      }
      state.modal = null;
      saveAndRender();
    } else if (button.dataset.tournamentFight) {
      if (window.FS.Amateur && window.FS.Amateur.resolveTournamentRound) {
        state.modal = window.FS.Amateur.resolveTournamentRound(state, state.modal);
      }
      saveAndRender();
    } else if (button.dataset.tournamentRing) {
      if (Fight.startTournamentInteractiveFight) {
        Fight.startTournamentInteractiveFight(state, state.modal);
      }
      saveAndRender();
    } else if (button.dataset.tournamentContinue) {
      if (window.FS.Amateur && window.FS.Amateur.continueTournament) {
        state.modal = window.FS.Amateur.continueTournament(state, state.modal);
      }
      saveAndRender();
    } else if (button.dataset.action === "refresh-offers") {
      state.offerRefreshSalt = (Number(state.offerRefreshSalt) || 0) + 1;
      World.refreshOffers(state);
      state.feed = "Соперники обновлены.";
      saveAndRender();
    } else if (button.dataset.profileModal) {
      state.modal = { type: "profileProcess", kind: button.dataset.profileModal };
      saveAndRender();
    } else if (button.dataset.person) {
      state.modal = { type: "person", personId: button.dataset.person };
      saveAndRender();
    } else if (button.dataset.favoriteFighter) {
      state.trackedFighterIds = state.trackedFighterIds instanceof Array ? state.trackedFighterIds : [];
      var favId = button.dataset.favoriteFighter;
      var favIndex = state.trackedFighterIds.indexOf(favId);
      if (favIndex === -1) {
        state.trackedFighterIds.unshift(favId);
        state.feed = "Боец добавлен в избранные.";
      } else {
        state.trackedFighterIds.splice(favIndex, 1);
        state.feed = "Боец удалён из избранных.";
      }
      Storage.save(state);
      saveAndRender();
    } else if (button.dataset.previewFight) {
      preview = Fight.buildFightPreview(state, button.dataset.previewFight);
      if (preview) {
        state.modal = preview;
        saveAndRender();
      }
    } else if (button.dataset.acceptFight) {
      Fight.startInteractiveFight(state, button.dataset.acceptFight);
      saveAndRender();
    } else if (button.dataset.skipFight) {
      Fight.resolveRandomFight(state, button.dataset.skipFight);
      saveAndRender();
    } else if (button.dataset.titleChallenge) {
      preview = Fight.buildTitleChallengePreview(state, button.dataset.titleChallenge);
      if (preview) {
        state.modal = preview;
        saveAndRender();
      }
    } else if (button.dataset.acceptTitleChallenge) {
      Fight.resolveTitleChallenge(state, button.dataset.acceptTitleChallenge);
      saveAndRender();
    } else if (button.dataset.proContract) {
      if (World.acceptProContract) { World.acceptProContract(state, button.dataset.proContract); }
      saveAndRender();
    } else if (button.dataset.refreshProContracts) {
      if (World.buildProContracts) { World.buildProContracts(state); }
      state.feed = "Профи-предложения обновлены.";
      saveAndRender();
    } else if (button.dataset.skipProContract) {
      if (Fight.skipProContractFight) { Fight.skipProContractFight(state); }
      saveAndRender();
    } else if (button.dataset.startProContract) {
      if (state.world) { state.world.pendingProFight = null; }
      if (Fight.startProContractFight) { Fight.startProContractFight(state); }
      saveAndRender();
    } else if (button.dataset.joinClub) {
      if (window.FS.Clubs && window.FS.Clubs.movePlayerToClub) {
        window.FS.Clubs.movePlayerToClub(state, button.dataset.joinClub);
        World.refreshOffers(state);
      }
      state.selectedTab = "myclub";
      saveAndRender();
    } else if (button.dataset.action === "leave-club") {
      if (window.FS.Clubs && window.FS.Clubs.leavePlayerClub) { window.FS.Clubs.leavePlayerClub(state); }
      saveAndRender();
    } else if (button.dataset.clubLevelFilter) {
      state.clubLevelFilter = parseInt(button.dataset.clubLevelFilter, 10) || 0;
      saveAndRender();
    } else if (button.dataset.club) {
      state.modal = {
        type: "club",
        clubId: button.dataset.club
      };
      saveAndRender();
    } else if (button.dataset.pathRankInfo) {
      state.modal = { type: "pathRankInfo", trackId: button.dataset.pathRankInfo };
      saveAndRender();
    } else if (button.dataset.fighter) {
      state.modal = {
        type: "fighter",
        fighterId: button.dataset.fighter
      };
      saveAndRender();
    } else if (button.dataset.rankingCountry) {
      state.rankingCountryId = button.dataset.rankingCountry;
      state.rankingPage = 0;
      saveAndRender();
    } else if (button.dataset.teamCountrySelect) {
      state.selectedTeamCountryId = button.dataset.teamCountrySelect;
      saveAndRender();
    } else if (button.dataset.teamCard) {
      state.modal = { type: "teamCard", countryId: button.dataset.teamCard };
      saveAndRender();
    } else if (button.dataset.rankingTrack) {
      state.rankingTrackId = button.dataset.rankingTrack;
      state.rankingPage = 0;
      saveAndRender();
    } else if (button.dataset.rankingWeight) {
      state.rankingWeightClassId = button.dataset.rankingWeight;
      state.rankingPage = 0;
      saveAndRender();
    } else if (button.dataset.buyEquipment) {
      if (State.buyEquipment) { State.buyEquipment(state, button.dataset.buyEquipment); }
      saveAndRender();
    } else if (button.dataset.medicalService) {
      if (State.buyMedicalService) { State.buyMedicalService(state, button.dataset.medicalService); }
      saveAndRender();
    } else if (button.dataset.trainStat) {
      State.trainPlayer(state, button.dataset.trainStat);
      saveAndRender();
    } else if (button.dataset.rankingPage) {
      state.rankingPage = Math.max(0, parseInt(button.dataset.rankingPage, 10) || 0);
      saveAndRender();
    } else if (button.dataset.profileTrack) {
      if (State.setPlayerTrack(state, button.dataset.profileTrack)) {
        World.refreshOffers(state);
      }
      saveAndRender();
    } else if (button.dataset.profileWeight) {
      if (State.setPlayerWeightClass(state, button.dataset.profileWeight)) {
        World.refreshOffers(state);
      }
      saveAndRender();
    } else if (button.dataset.profileCountry) {
      State.setPlayerCountry(state, button.dataset.profileCountry);
      if (window.FS.Clubs) {
        window.FS.Clubs.ensureClubs(state);
      }
      World.refreshOffers(state);
      saveAndRender();
    }
  });

  document.addEventListener("change", function (event) {
    var target = event.target;

    if (!state || !target || !target.dataset) {
      return;
    }

    if (target.dataset.action === "set-country") {
      State.setPlayerCountry(state, target.value);
      if (window.FS.Clubs) {
        window.FS.Clubs.ensureClubs(state);
      }
      World.refreshOffers(state);
      saveAndRender();
    } else if (target.dataset.action === "set-track") {
      if (State.setPlayerTrack(state, target.value)) {
        World.refreshOffers(state);
      }
      saveAndRender();
    } else if (target.dataset.action === "set-weight-class") {
      State.setPlayerWeightClass(state, target.value);
      World.refreshOffers(state);
      saveAndRender();
    }
  });

  setupPersistentSave();
  registerOfflineApp();
  initializeBoot();
}());
