(function () {
  "use strict";

  window.FS = window.FS || {};
  window.FS.AppActions = window.FS.AppActions || {};

  function handle(ctx) {
    var button = ctx.button;
    var state = ctx.getState();
    var Fight = window.FS.Fight;
    var preview;
    var parts;
    if (!button || !button.dataset) { return false; }

    if (button.dataset.fightAction) {
      Fight.playerAction(state, button.dataset.fightAction, 0, 0);
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.fightMove) {
      parts = button.dataset.fightMove.split(",");
      Fight.playerAction(state, "move", parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0);
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.fightCount) {
      Fight.handleCount(state);
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.previewFight) {
      preview = Fight.buildFightPreview(state, button.dataset.previewFight);
      if (preview) {
        state.modal = preview;
        ctx.saveAndRender();
      }
      return true;
    }

    if (button.dataset.acceptFight) {
      Fight.startInteractiveFight(state, button.dataset.acceptFight);
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.skipFight) {
      Fight.resolveRandomFight(state, button.dataset.skipFight);
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.titleChallenge) {
      preview = Fight.buildTitleChallengePreview(state, button.dataset.titleChallenge);
      if (preview) {
        state.modal = preview;
        ctx.saveAndRender();
      }
      return true;
    }

    if (button.dataset.acceptTitleChallenge) {
      Fight.resolveTitleChallenge(state, button.dataset.acceptTitleChallenge);
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.skipProContract) {
      if (Fight.skipProContractFight) { Fight.skipProContractFight(state); }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.startProContract) {
      if (state.world) { state.world.pendingProFight = null; }
      if (Fight.startProContractFight) { Fight.startProContractFight(state); }
      ctx.saveAndRender();
      return true;
    }

    return false;
  }

  window.FS.AppActions.FightActions = {
    handle: handle
  };
}());
