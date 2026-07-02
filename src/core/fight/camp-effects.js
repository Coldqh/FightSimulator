(function () {
  "use strict";

  window.FS = window.FS || {};

  var Fight = window.FS.Fight;
  var Camp = window.FS.FightCamp;
  if (!Fight || !Camp) return;

  function stateFromArgs(args) {
    return args && args.length ? args[0] : null;
  }

  function wrapPreview() {
    var original = Fight.buildFightPreview;
    if (!original || original.__fightCampWrapped) return;
    Fight.buildFightPreview = function (state, offerId) {
      var preview = Camp.withTemporaryStats(state, function () {
        return original.call(Fight, state, offerId);
      });
      if (preview) {
        preview.winChance = Camp.applyChance(state, preview.winChance);
        preview.fightCamp = Camp.current(state);
      }
      return preview;
    };
    Fight.buildFightPreview.__fightCampWrapped = true;
  }

  function wrapWithStatsAndClear(name, clearMode) {
    var original = Fight[name];
    if (!original || original.__fightCampWrapped) return;
    Fight[name] = function () {
      var args = arguments;
      var state = stateFromArgs(args);
      var result = Camp.withTemporaryStats(state, function () {
        return original.apply(Fight, args);
      });
      if (clearMode === "always" && result) Camp.clearAfterFight(state);
      if (clearMode === "modal" && state && state.modal && state.modal.type === "fightResult") Camp.clearAfterFight(state);
      return result;
    };
    Fight[name].__fightCampWrapped = true;
  }

  wrapPreview();
  wrapWithStatsAndClear("resolveRandomFight", "always");
  wrapWithStatsAndClear("startInteractiveFight", "never");
  wrapWithStatsAndClear("playerAction", "modal");
  wrapWithStatsAndClear("startProContractFight", "never");
  wrapWithStatsAndClear("skipProContractFight", "always");
  wrapWithStatsAndClear("resolveTitleChallenge", "always");
}());
