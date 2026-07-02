(function () {
  "use strict";

  window.FS = window.FS || {};
  window.FS.AppActions = window.FS.AppActions || {};

  function handle(ctx) {
    var button = ctx.button;
    var state = ctx.getState();
    var State = window.FS.State;
    var World = window.FS.World;
    var Fight = window.FS.Fight;
    var Storage = window.FS.Storage;
    if (!button || !button.dataset) { return false; }

    if (button.dataset.action === "reset-career") {
      ctx.resetCareer();
      return true;
    }

    if (button.dataset.action === "next-week") {
      state.mobileMoreOpen = false;
      state.feed = "Неделя " + (state.week + 1) + ". Мир сделал недельный ход.";
      World.advanceWeek(state, "skip");
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.action === "train-week") {
      State.trainPlayer(state);
      World.advanceWeek(state, "training");
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.action === "sparring-week") {
      if (Fight.resolveSparringSession && Fight.resolveSparringSession(state)) {
        World.advanceWeek(state, "training");
      }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.action === "rest-week") {
      World.advanceWeek(state, "rest");
      if (!State.isLockedByFatigue || !State.isLockedByFatigue(state)) { state.modal = null; }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.action === "patch-notes") {
      state.modal = { type: "patchNotes" };
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.action === "repair-save") {
      ctx.rebuildWorld("Сохранение проверено и починено.");
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.action === "deep-repair") {
      ctx.rebuildWorld("Глубокая починка: сохранение, клубы, сборные, титулы и офферы пересобраны.");
      if (State.applyMonthlyExpenses) { State.applyMonthlyExpenses(state); }
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.action === "world-audit") {
      state.modal = {
        type: "worldAudit",
        report: window.FS.Matchmaking ? window.FS.Matchmaking.auditWorld(state) : { fighters: state.roster.length, clubs: state.clubs.length, titles: Object.keys(state.titles || {}).length, offers: state.offers.length, repairedRecords: 0, missingGym: 0 }
      };
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.action === "export-save") {
      state.modal = { type: "saveExport", payload: Storage.exportString(state) };
      ctx.saveAndRender();
      return true;
    }

    if (button.dataset.action === "import-save") {
      ctx.importSave();
      return true;
    }

    return false;
  }

  window.FS.AppActions.TimeActions = {
    handle: handle
  };
}());
