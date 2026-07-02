(function () {
  "use strict";

  window.FS = window.FS || {};
  window.FS.AppActions = window.FS.AppActions || {};

  var MODULE_ORDER = [
    "FightActions",
    "TimeActions",
    "NavigationActions",
    "TournamentActions",
    "ProfileActions",
    "ClubActions"
  ];

  function copyContext(base, event) {
    var target = event && event.target;
    var clickedButton = target && target.closest ? target.closest("button") : null;
    var ctx = {};
    var key;

    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        ctx[key] = base[key];
      }
    }

    ctx.event = event;
    ctx.target = target;
    ctx.clickedButton = clickedButton;
    ctx.button = clickedButton;
    ctx.mobileMoreCloseTarget = target && target.closest ? target.closest("[data-mobile-more-close]") : null;
    ctx.rowFighterTarget = target && target.closest ? target.closest("[data-row-fighter]") : null;
    ctx.rowClubTarget = target && target.closest ? target.closest("[data-row-club]") : null;
    return ctx;
  }

  function handleGameOverGuard(ctx, state, button) {
    var State = window.FS.State;
    if (!state || !button || !state.gameOver) { return false; }
    if (button.dataset.action === "reset-career" || button.dataset.action === "export-save" || button.dataset.action === "close-modal") { return false; }
    state.modal = state.modal || { type: "gameOver", title: "Игра окончена", text: "Карьера завершена.", money: State.player(state) ? State.player(state).money : 0 };
    ctx.saveAndRender();
    return true;
  }

  function handleFightLockGuard(ctx, button) {
    if (!button || !ctx.isFightLockedModal || !ctx.isFightLockedModal()) { return false; }
    if (button.dataset.fightAction || button.dataset.fightMove || button.dataset.fightCount) { return false; }
    return true;
  }

  function handleFatigueGuard(ctx, state, button) {
    var State = window.FS.State;
    if (!button || !ctx.isFatigueLockedAction || !ctx.isFatigueLockedAction(button)) { return false; }
    if (State.fatigueLockedModal) { State.fatigueLockedModal(state); }
    ctx.saveAndRender();
    return true;
  }

  function handleByModule(ctx, name) {
    var module = window.FS.AppActions && window.FS.AppActions[name];
    return !!(module && module.handle && module.handle(ctx));
  }

  function handleClick(event, appContext) {
    var ctx = copyContext(appContext || {}, event);
    var state;
    var button = ctx.button;
    var i;
    var navigation = window.FS.AppActions && window.FS.AppActions.NavigationActions;
    var bootstrap = window.FS.AppActions && window.FS.AppActions.BootstrapActions;
    var State = window.FS.State;

    if (navigation && navigation.handleRows && navigation.handleRows(ctx)) { return true; }
    if (bootstrap && bootstrap.handle && bootstrap.handle(ctx)) { return true; }

    state = ctx.getState ? ctx.getState() : null;
    if (!state) { return false; }

    if (State.normalizeGoalSystems) { State.normalizeGoalSystems(state); }

    if (navigation && navigation.handleEarly && navigation.handleEarly(ctx)) { return true; }
    if (handleGameOverGuard(ctx, state, button)) { return true; }
    if (handleFightLockGuard(ctx, button)) { return true; }
    if (handleFatigueGuard(ctx, state, button)) { return true; }

    for (i = 0; i < MODULE_ORDER.length; i += 1) {
      if (handleByModule(ctx, MODULE_ORDER[i])) { return true; }
    }
    return false;
  }

  window.FS.ActionRouter = {
    handleClick: handleClick
  };
}());
