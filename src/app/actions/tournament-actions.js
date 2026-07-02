(function () {
  "use strict";

  window.FS = window.FS || {};
  window.FS.AppActions = window.FS.AppActions || {};

  function handle(ctx) {
    var button = ctx.button;
    var state = ctx.getState();
    var Fight = window.FS.Fight;
    if (!button || !button.dataset) { return false; }

    if (button.dataset.amateurCompetition) {
      if (window.FS.Amateur && window.FS.Amateur.startTournament) {
        state.modal = window.FS.Amateur.startTournament(state, button.dataset.amateurCompetition);
      }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.tournamentInvite) {
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
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.tournamentFight) {
      if (window.FS.Amateur && window.FS.Amateur.resolveTournamentRound) {
        state.modal = window.FS.Amateur.resolveTournamentRound(state, state.modal);
      }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.tournamentRing) {
      if (Fight.startTournamentInteractiveFight) {
        Fight.startTournamentInteractiveFight(state, state.modal);
      }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.tournamentContinue) {
      if (window.FS.Amateur && window.FS.Amateur.continueTournament) {
        state.modal = window.FS.Amateur.continueTournament(state, state.modal);
      }
      ctx.saveAndRender();
      return true;
    }

    return false;
  }

  window.FS.AppActions.TournamentActions = {
    handle: handle
  };
}());
