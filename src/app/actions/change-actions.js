(function () {
  "use strict";

  window.FS = window.FS || {};
  window.FS.AppActions = window.FS.AppActions || {};

  var State = window.FS.State;
  var World = window.FS.World;

  function stateFrom(ctx) {
    return ctx && ctx.getState ? ctx.getState() : null;
  }

  function handle(ctx) {
    var state = stateFrom(ctx);
    var target = ctx && ctx.target;

    if (!state || !target || !target.dataset) { return false; }

    if (target.dataset.action === "set-country") {
      State.setPlayerCountry(state, target.value);
      if (window.FS.Clubs) {
        window.FS.Clubs.ensureClubs(state);
      }
      World.refreshOffers(state);
      ctx.saveAndRender();
      return true;
    }

    if (target.dataset.action === "set-track") {
      if (State.setPlayerTrack(state, target.value)) {
        World.refreshOffers(state);
      }
      ctx.saveAndRender();
      return true;
    }

    if (target.dataset.action === "set-weight-class") {
      State.setPlayerWeightClass(state, target.value);
      World.refreshOffers(state);
      ctx.saveAndRender();
      return true;
    }

    return false;
  }

  window.FS.AppActions.ChangeActions = {
    handle: handle
  };
}());
