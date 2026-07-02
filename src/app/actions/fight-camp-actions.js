(function () {
  "use strict";

  window.FS = window.FS || {};
  window.FS.AppActions = window.FS.AppActions || {};

  var FightActions = window.FS.AppActions.FightActions;
  var previousHandle = FightActions && FightActions.handle;

  if (!FightActions || !previousHandle || previousHandle.__fightCampUiWrapped) return;

  FightActions.handle = function (ctx) {
    var button = ctx.button;
    var state = ctx.getState ? ctx.getState() : null;

    if (button && button.dataset && button.dataset.fightCampModal) {
      if (state) state.modal = { type: "fightCampSelect" };
      ctx.saveAndRender();
      return true;
    }

    if (button && button.dataset && button.dataset.fightCamp) {
      if (window.FS.FightCamp && window.FS.FightCamp.select) {
        window.FS.FightCamp.select(state, button.dataset.fightCamp);
      }
      if (state && state.modal && state.modal.type === "fightCampSelect") state.modal = null;
      ctx.saveAndRender();
      return true;
    }

    return previousHandle(ctx);
  };

  FightActions.handle.__fightCampUiWrapped = true;
}());
