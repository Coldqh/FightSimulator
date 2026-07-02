(function () {
  "use strict";

  window.FS = window.FS || {};
  window.FS.AppActions = window.FS.AppActions || {};

  var Navigation = window.FS.AppActions.NavigationActions;
  var previous = Navigation && Navigation.handle;

  if (!Navigation || !previous || previous.__finalPackWrapped) return;

  Navigation.handle = function (ctx) {
    var button = ctx.button;
    var state = ctx.getState ? ctx.getState() : null;
    if (button && button.dataset && button.dataset.finalSettingsSubtab) {
      state.finalSettingsSubtab = button.dataset.finalSettingsSubtab;
      ctx.saveAndRender();
      return true;
    }
    return previous(ctx);
  };

  Navigation.handle.__finalPackWrapped = true;
}());
