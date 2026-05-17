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

  function saveAndRender() {
    Storage.save(state);
    render();
  }

  function rebuildWorld(message) {
    State.repairState(state);
    World.bootstrapWorld(state);
    World.refreshOffers(state);
    state.feed = message || "Состояние игры обновлено.";
  }

  function createCareerFromForm() {
    state = State.createCareer({
      name: document.getElementById("careerName").value.trim(),
      age: Math.max(16, Math.min(40, parseInt(document.getElementById("careerAge").value, 10) || 18)),
      countryId: document.getElementById("careerCountry").value,
      trackId: document.getElementById("careerTrack").value,
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
    rebuildWorld("Сохранение импортировано.");
    saveAndRender();
  }

  function applyMobileCollapse() {
    if (!window.matchMedia || !window.matchMedia("(max-width: 720px)").matches) {
      return;
    }

    Array.prototype.slice.call(document.querySelectorAll(".content-card")).forEach(function (card, index) {
      var title = card.querySelector("h3");
      var button;
      if (!title || card.classList.contains("no-mobile-collapse") || card.querySelector("[data-mobile-toggle]")) {
        return;
      }
      card.classList.add("mobile-collapsed");
      button = document.createElement("button");
      button.className = "small-btn mobile-toggle";
      button.dataset.mobileToggle = "1";
      button.textContent = "Показать";
      title.appendChild(button);
      if (index < 2) {
        card.classList.remove("mobile-collapsed");
        button.textContent = "Скрыть";
      }
    });
  }

  function render() {
    if (!state || !State.player(state)) {
      app.innerHTML = Render.start();
      return;
    }

    State.repairState(state);

    var normalOfferCount = (state.offers || []).filter(function (offer) {
      return !offer.isCompetition;
    }).length;

    if (!state.offers || normalOfferCount !== 3) {
      World.refreshOffers(state);
      Storage.save(state);
    }

    app.innerHTML = Render.dashboard(state);
    applyMobileCollapse();
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    var preview;

    if (!button) {
      return;
    }

    if (button.dataset.action === "create-career") {
      createCareerFromForm();
      return;
    }

    if (!state) {
      return;
    }

    if (button.dataset.action === "reset-career") {
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
    } else if (button.dataset.tournamentFight) {
      if (window.FS.Amateur && window.FS.Amateur.resolveTournamentRound) {
        state.modal = window.FS.Amateur.resolveTournamentRound(state, state.modal);
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
    } else if (button.dataset.person) {
      state.modal = { type: "person", personId: button.dataset.person };
      saveAndRender();
    } else if (button.dataset.previewFight) {
      preview = Fight.buildFightPreview(state, button.dataset.previewFight);
      if (preview) {
        state.modal = preview;
        saveAndRender();
      }
    } else if (button.dataset.acceptFight) {
      Fight.resolvePlayerFight(state, button.dataset.acceptFight);
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

  render();
}());
