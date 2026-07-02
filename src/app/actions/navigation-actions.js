(function () {
  "use strict";

  window.FS = window.FS || {};
  window.FS.AppActions = window.FS.AppActions || {};

  function handleRows(ctx) {
    var state = ctx.getState ? ctx.getState() : null;
    if (ctx.mobileMoreCloseTarget && state) {
      state.mobileMoreOpen = false;
      ctx.saveAndRender();
      return true;
    }

    if (ctx.rowFighterTarget && state && !ctx.clickedButton) {
      state.modal = { type: "fighter", fighterId: ctx.rowFighterTarget.getAttribute("data-row-fighter") };
      state.mobileMoreOpen = false;
      ctx.saveAndRender();
      return true;
    }

    if (ctx.rowClubTarget && state && !ctx.clickedButton) {
      state.modal = { type: "club", clubId: ctx.rowClubTarget.getAttribute("data-row-club") };
      state.mobileMoreOpen = false;
      ctx.saveAndRender();
      return true;
    }

    return false;
  }

  function handleEarly(ctx) {
    var state = ctx.getState();
    var button = ctx.button;
    if (!button || !button.dataset) { return false; }

    if (button.dataset.mobileMore) {
      state.mobileMoreOpen = !state.mobileMoreOpen;
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.mobileMoreClose) {
      state.mobileMoreOpen = false;
      ctx.saveAndRender();
      return true;
    }

    return false;
  }

  function handle(ctx) {
    var state = ctx.getState();
    var button = ctx.button;
    var validPeopleFilters;
    var validHistoryFilters;
    var closingModalType;
    if (!button || !button.dataset) { return false; }

    if (button.dataset.action === "close-modal") {
      closingModalType = state.modal && state.modal.type;
      state.modal = null;
      if (closingModalType !== "relationshipEvent" && state.relationshipEvent) {
        state.modal = { type: "relationshipEvent", eventId: state.relationshipEvent.id || "" };
      }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.peopleFilter) {
      validPeopleFilters = { all: true, coaches: true, rivals: true, clubmates: true, team: true };
      state.peopleFilter = validPeopleFilters[button.dataset.peopleFilter] ? button.dataset.peopleFilter : "all";
      state.selectedTab = "people";
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.historyFilter) {
      validHistoryFilters = { all: true, regular: true, tournaments: true, wins: true, losses: true, stronger: true, rematches: true, ko: true };
      state.historyFilter = validHistoryFilters[button.dataset.historyFilter] ? button.dataset.historyFilter : "all";
      state.selectedTab = "history";
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.goalsSubtab) {
      state.goalsSubTab = ["active", "completed", "coach"].indexOf(button.dataset.goalsSubtab) === -1 ? "active" : button.dataset.goalsSubtab;
      state.selectedTab = "goals";
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.tab) {
      state.selectedTab = button.dataset.tab;
      if (state.selectedTab === "goals" && ["active", "completed", "coach"].indexOf(state.goalsSubTab || "active") === -1) { state.goalsSubTab = "active"; }
      state.mobileMoreOpen = false;
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.teamList) {
      state.modal = { type: "teamList", countryId: button.dataset.teamCountry, listType: button.dataset.teamList, page: 0 };
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.teamPage) {
      if (state.modal && state.modal.type === "teamList") {
        state.modal.page = Math.max(0, parseInt(button.dataset.teamPage, 10) || 0);
      }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.tournamentParticipants) {
      if (state.modal) {
        state.modal = { type: "tournamentParticipants", sourceModal: state.modal, page: 0 };
      }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.tournamentParticipantsPage) {
      if (state.modal && state.modal.type === "tournamentParticipants") {
        state.modal.page = Math.max(0, parseInt(button.dataset.tournamentParticipantsPage, 10) || 0);
      }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.backToTournament) {
      if (state.modal && state.modal.sourceModal) { state.modal = state.modal.sourceModal; }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.pathRankInfo) {
      state.modal = { type: "pathRankInfo", trackId: button.dataset.pathRankInfo };
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.fighter) {
      state.modal = { type: "fighter", fighterId: button.dataset.fighter };
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.rankingCountry) {
      state.rankingCountryId = button.dataset.rankingCountry;
      state.rankingPage = 0;
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.teamCountrySelect) {
      state.selectedTeamCountryId = button.dataset.teamCountrySelect;
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.teamCard) {
      state.modal = { type: "teamCard", countryId: button.dataset.teamCard };
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.rankingTrack) {
      state.rankingTrackId = button.dataset.rankingTrack;
      state.rankingPage = 0;
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.rankingWeight) {
      state.rankingWeightClassId = button.dataset.rankingWeight;
      state.rankingPage = 0;
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.rankingPage) {
      state.rankingPage = Math.max(0, parseInt(button.dataset.rankingPage, 10) || 0);
      ctx.saveAndRender();
      return true;
    }

    return false;
  }

  window.FS.AppActions.NavigationActions = {
    handleRows: handleRows,
    handleEarly: handleEarly,
    handle: handle
  };
}());
