(function () {
  "use strict";

  window.FS = window.FS || {};
  window.FS.AppActions = window.FS.AppActions || {};

  function handle(ctx) {
    var button = ctx.button;
    var state = ctx.getState();
    var State = window.FS.State;
    var World = window.FS.World;
    var Storage = window.FS.Storage;
    var favId;
    var favIndex;
    if (!button || !button.dataset) { return false; }

    if (button.dataset.relationshipChoice) {
      if (State.applyRelationshipChoice) { State.applyRelationshipChoice(state, button.dataset.relationshipChoice); }
      if (state.modal && state.modal.type === "relationshipEvent") { state.modal = null; }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.action === "refresh-offers") {
      state.offerRefreshSalt = (Number(state.offerRefreshSalt) || 0) + 1;
      World.refreshOffers(state);
      state.feed = "Соперники обновлены.";
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.person) {
      if (window.FS.Clubs && window.FS.Clubs.syncCoachRecords) {
        try { window.FS.Clubs.syncCoachRecords(state); } catch (error) { console.warn("coach repair before person modal failed:", error); }
      }
      state.modal = { type: "person", personId: button.dataset.person };
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.favoriteFighter) {
      state.trackedFighterIds = state.trackedFighterIds instanceof Array ? state.trackedFighterIds : [];
      favId = button.dataset.favoriteFighter;
      favIndex = state.trackedFighterIds.indexOf(favId);
      if (favIndex === -1) {
        state.trackedFighterIds.unshift(favId);
        state.feed = "Боец добавлен в избранные.";
      } else {
        state.trackedFighterIds.splice(favIndex, 1);
        state.feed = "Боец удалён из избранных.";
      }
      Storage.save(state);
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.joinClub) {
      if (window.FS.Clubs && window.FS.Clubs.movePlayerToClub) {
        window.FS.Clubs.movePlayerToClub(state, button.dataset.joinClub);
        World.refreshOffers(state);
      }
      state.selectedTab = "myclub";
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.selectCoach) {
      if (window.FS.Clubs && window.FS.Clubs.selectPlayerCoach) { window.FS.Clubs.selectPlayerCoach(state, button.dataset.selectCoach); }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.action === "leave-club") {
      if (window.FS.Clubs && window.FS.Clubs.leavePlayerClub) { window.FS.Clubs.leavePlayerClub(state); }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.clubLevelFilter) {
      state.clubLevelFilter = parseInt(button.dataset.clubLevelFilter, 10) || 0;
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.club) {
      if (window.FS.Clubs && window.FS.Clubs.ensureClubs) {
        try { window.FS.Clubs.ensureClubs(state); } catch (error) { console.warn("club repair before club modal failed:", error); }
      }
      state.modal = { type: "club", clubId: button.dataset.club };
      ctx.saveAndRender();
      return true;
    }

    return false;
  }

  window.FS.AppActions.ClubActions = {
    handle: handle
  };
}());
