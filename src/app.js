(function () {
  "use strict";

  window.FS = window.FS || {};

  var Storage = window.FS.Storage;
  var State = window.FS.State;
  var World = window.FS.World;
  var Fight = window.FS.Fight;
  var Render = window.FS.Render;
  var app = document.getElementById("app");
  var state = Storage.load();
  if (state && state._migrationReport) {
    state.feed = state._migrationReport;
    Storage.save(state);
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
    state = loaded;
    State.repairState(state);
    state.feed = state.feed || "Карьера продолжена.";
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

    state = imported;
    State.repairState(state);
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

  function registerOfflineApp() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js")
        .then(function (registration) {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }
          registration.addEventListener("updatefound", function () {
            var worker = registration.installing;
            if (!worker) { return; }
            worker.addEventListener("statechange", function () {
              if (worker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("Fight Simulator offline cache updated.");
              }
            });
          });
          console.log("Fight Simulator offline cache ready.");
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

  function render() {
    if (!state || !State.player(state)) {
      app.innerHTML = Render.start(Storage.savedSummary ? Storage.savedSummary() : null);
      return;
    }

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
  render();
}());
