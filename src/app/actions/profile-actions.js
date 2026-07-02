(function () {
  "use strict";

  window.FS = window.FS || {};
  window.FS.AppActions = window.FS.AppActions || {};

  function handle(ctx) {
    var button = ctx.button;
    var state = ctx.getState();
    var State = window.FS.State;
    var World = window.FS.World;
    var trainAmount;
    var trained;
    if (!button || !button.dataset) { return false; }

    if (button.dataset.profileModal) {
      state.modal = { type: "profileProcess", kind: button.dataset.profileModal };
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.proContract) {
      if (World.acceptProContract) { World.acceptProContract(state, button.dataset.proContract); }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.refreshProContracts) {
      if (World.buildProContracts) { World.buildProContracts(state); }
      state.feed = "Профи-предложения обновлены.";
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.buyEquipment) {
      if (State.buyEquipment) { State.buyEquipment(state, button.dataset.buyEquipment); }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.medicalService) {
      if (State.buyMedicalService) { State.buyMedicalService(state, button.dataset.medicalService); }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.trainStat) {
      trainAmount = Math.max(1, parseInt(button.dataset.trainAmount, 10) || 1);
      trained = 0;
      while (trained < trainAmount && State.player(state).trainingPoints > 0) {
        State.trainPlayer(state, button.dataset.trainStat);
        trained += 1;
      }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.profileTrack) {
      if (State.setPlayerTrack(state, button.dataset.profileTrack)) {
        World.refreshOffers(state);
      }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.profileWeight) {
      if (State.setPlayerWeightClass(state, button.dataset.profileWeight)) {
        World.refreshOffers(state);
      }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.profileCountry) {
      State.setPlayerCountry(state, button.dataset.profileCountry);
      if (window.FS.Clubs) { window.FS.Clubs.ensureClubs(state); }
      World.refreshOffers(state);
      state.modal = null;
      ctx.saveAndRender();
      return true;
    }

    return false;
  }

  window.FS.AppActions.ProfileActions = {
    handle: handle
  };
}());
