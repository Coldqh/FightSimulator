(function () {
  "use strict";

  window.FS = window.FS || {};
  window.FS.AppActions = window.FS.AppActions || {};

  function copyContext(base, event) {
    var ctx = {};
    var key;
    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        ctx[key] = base[key];
      }
    }
    ctx.event = event;
    ctx.target = event ? event.target : null;
    return ctx;
  }

  function handleChange(event, appContext) {
    var ctx = copyContext(appContext || {}, event);
    var module = window.FS.AppActions && window.FS.AppActions.ChangeActions;
    return !!(module && module.handle && module.handle(ctx));
  }

  window.FS.ChangeRouter = {
    handleChange: handleChange
  };
}());
