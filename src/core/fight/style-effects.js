(function () {
  "use strict";

  window.FS = window.FS || {};

  var Fight = window.FS.Fight;
  var Styles = window.FS.FightStyles;
  var State = window.FS.State;
  var U = window.FS.Utils;

  if (!Fight || !Styles || !State || !U) return;

  function player(state) {
    return State.player ? State.player(state) : null;
  }

  function opponentByOffer(state, offerId) {
    var offers = state && state.offers instanceof Array ? state.offers : [];
    var i;
    for (i = 0; i < offers.length; i += 1) {
      if (offers[i] && offers[i].id === offerId) return U.getFighterById(state, offers[i].opponentId);
    }
    return null;
  }

  function opponentByModal(state) {
    var session = state && state.modal && state.modal.session;
    return session && session.opponentId ? U.getFighterById(state, session.opponentId) : null;
  }

  function opponentByContract(state) {
    var p = player(state);
    return p && p.contractOpponentId ? U.getFighterById(state, p.contractOpponentId) : null;
  }

  function opponentByTitle(state, titleId) {
    var title = state && state.titles ? state.titles[titleId] : null;
    return title && title.championId ? U.getFighterById(state, title.championId) : null;
  }

  function withStyleState(state, opponent, fn) {
    return Styles.withTemporaryStyleStats(player(state), opponent, fn);
  }

  function appendStylePreview(preview, state, opponent) {
    var p = player(state);
    var mod;
    if (!preview || !p || !opponent) return preview;
    mod = Styles.chanceModifier(p, opponent);
    preview.winChance = Math.max(5, Math.min(95, Math.round((Number(preview.winChance) || 50) + mod)));
    preview.playerStyle = Styles.styleFor(p);
    preview.opponentStyle = Styles.styleFor(opponent);
    preview.styleMatchup = Styles.matchupText(p, opponent);
    preview.styleChanceModifier = mod;
    return preview;
  }

  function wrapBuildFightPreview() {
    var original = Fight.buildFightPreview;
    if (!original || original.__fighterStylesWrapped) return;
    Fight.buildFightPreview = function (state, offerId) {
      var opponent = opponentByOffer(state, offerId);
      var preview = withStyleState(state, opponent, function () {
        return original.call(Fight, state, offerId);
      });
      return appendStylePreview(preview, state, opponent);
    };
    Fight.buildFightPreview.__fighterStylesWrapped = true;
  }

  function wrapEstimateWinChance() {
    var original = Fight.estimateWinChance;
    if (!original || original.__fighterStylesWrapped) return;
    Fight.estimateWinChance = function (fighter, opponent) {
      var base = original.call(Fight, fighter, opponent);
      return Math.max(5, Math.min(95, Math.round((Number(base) || 50) + Styles.chanceModifier(fighter, opponent))));
    };
    Fight.estimateWinChance.__fighterStylesWrapped = true;
  }

  function wrapResolveRandomFight() {
    var original = Fight.resolveRandomFight;
    if (!original || original.__fighterStylesWrapped) return;
    Fight.resolveRandomFight = function (state, offerId) {
      var opponent = opponentByOffer(state, offerId);
      return withStyleState(state, opponent, function () {
        return original.call(Fight, state, offerId);
      });
    };
    Fight.resolveRandomFight.__fighterStylesWrapped = true;
  }

  function wrapStartInteractiveFight() {
    var original = Fight.startInteractiveFight;
    if (!original || original.__fighterStylesWrapped) return;
    Fight.startInteractiveFight = function (state, offerId) {
      var opponent = opponentByOffer(state, offerId);
      return withStyleState(state, opponent, function () {
        return original.call(Fight, state, offerId);
      });
    };
    Fight.startInteractiveFight.__fighterStylesWrapped = true;
  }

  function wrapPlayerAction() {
    var original = Fight.playerAction;
    if (!original || original.__fighterStylesWrapped) return;
    Fight.playerAction = function (state, action, dx, dy) {
      var opponent = opponentByModal(state);
      return withStyleState(state, opponent, function () {
        return original.call(Fight, state, action, dx, dy);
      });
    };
    Fight.playerAction.__fighterStylesWrapped = true;
  }

  function wrapProAndTitle() {
    var startPro = Fight.startProContractFight;
    var skipPro = Fight.skipProContractFight;
    var title = Fight.resolveTitleChallenge;

    if (startPro && !startPro.__fighterStylesWrapped) {
      Fight.startProContractFight = function (state) {
        return withStyleState(state, opponentByContract(state), function () {
          return startPro.call(Fight, state);
        });
      };
      Fight.startProContractFight.__fighterStylesWrapped = true;
    }

    if (skipPro && !skipPro.__fighterStylesWrapped) {
      Fight.skipProContractFight = function (state) {
        return withStyleState(state, opponentByContract(state), function () {
          return skipPro.call(Fight, state);
        });
      };
      Fight.skipProContractFight.__fighterStylesWrapped = true;
    }

    if (title && !title.__fighterStylesWrapped) {
      Fight.resolveTitleChallenge = function (state, titleId) {
        return withStyleState(state, opponentByTitle(state, titleId), function () {
          return title.call(Fight, state, titleId);
        });
      };
      Fight.resolveTitleChallenge.__fighterStylesWrapped = true;
    }
  }

  wrapBuildFightPreview();
  wrapEstimateWinChance();
  wrapResolveRandomFight();
  wrapStartInteractiveFight();
  wrapPlayerAction();
  wrapProAndTitle();
}());
