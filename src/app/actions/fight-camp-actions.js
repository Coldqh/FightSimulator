(function () {
  "use strict";

  window.FS = window.FS || {};
  window.FS.AppActions = window.FS.AppActions || {};

  var FightActions = window.FS.AppActions.FightActions;
  var previousHandle = FightActions && FightActions.handle;

  if (!FightActions || !previousHandle || previousHandle.__fightCampWrapped) return;

  FightActions.handle = function (ctx) {
    var button = ctx.button;
    var state = ctx.getState ? ctx.getState() : null;
    if (button && button.dataset && button.dataset.fightCamp) {
      if (window.FS.FightCamp && window.FS.FightCamp.select) {
        window.FS.FightCamp.select(state, button.dataset.fightCamp);
      }
      ctx.saveAndRender();
      return true;
    }
    return previousHandle(ctx);
  };
  FightActions.handle.__fightCampWrapped = true;
}());
