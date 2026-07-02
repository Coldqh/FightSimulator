(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var State = window.FS.State;
  var Fight = window.FS.Fight;
  var World = window.FS.World;
  var Amateur = window.FS.Amateur;
  var Injuries = window.FS.FinalInjuries;
  var Objectives = window.FS.FinalObjectives;

  function player(state) { return State && State.player ? State.player(state) : null; }
  function fighter(state, id) { return U && U.getFighterById ? U.getFighterById(state, id) : null; }
  function offerOpponent(state, offerId) {
    var offer = state && state.offers instanceof Array ? state.offers.find(function (item) { return item && item.id === offerId; }) : null;
    return offer && offer.opponentId ? fighter(state, offer.opponentId) : null;
  }
  function post(state) {
    if (Injuries && Injuries.cleanupOffers) Injuries.cleanupOffers(state);
    if (Objectives && Objectives.advance) Objectives.advance(state);
  }

  function wrapFightPreview() {
    var original;
    if (!Fight || !Fight.buildFightPreview || Fight.buildFightPreview.__finalPackWrapped) return;
    original = Fight.buildFightPreview;
    Fight.buildFightPreview = function (state, offerId) {
      var p = player(state);
      var opponent = offerOpponent(state, offerId);
      return Injuries.withTemporaryStats([p, opponent], function () {
        var preview = original.call(Fight, state, offerId);
        if (preview && Injuries) {
          preview.playerInjuryPenalty = Injuries.penalty(p);
          preview.opponentInjuryPenalty = Injuries.penalty(opponent);
          preview.playerRating = Injuries.effectiveOvr(p);
          preview.opponentRating = Injuries.effectiveOvr(opponent);
        }
        return preview;
      });
    };
    Fight.buildFightPreview.__finalPackWrapped = true;
  }

  function wrapResolveRandomFight() {
    var original;
    if (!Fight || !Fight.resolveRandomFight || Fight.resolveRandomFight.__finalPackWrapped) return;
    original = Fight.resolveRandomFight;
    Fight.resolveRandomFight = function (state, offerId) {
      var p = player(state);
      var opponent = offerOpponent(state, offerId);
      var result = Injuries.withTemporaryStats([p, opponent], function () { return original.call(Fight, state, offerId); });
      if (result && state && state.modal && state.modal.type === "fightResult") {
        Injuries.afterOfficialFight(state, opponent, state.modal.result, state.modal.method);
        post(state);
      }
      return result;
    };
    Fight.resolveRandomFight.__finalPackWrapped = true;
  }

  function wrapStartInteractiveFight() {
    var original;
    if (!Fight || !Fight.startInteractiveFight || Fight.startInteractiveFight.__finalPackWrapped) return;
    original = Fight.startInteractiveFight;
    Fight.startInteractiveFight = function (state, offerId) {
      var p = player(state);
      var opponent = offerOpponent(state, offerId);
      return Injuries.withTemporaryStats([p, opponent], function () { return original.call(Fight, state, offerId); });
    };
    Fight.startInteractiveFight.__finalPackWrapped = true;
  }

  function wrapPlayerAction() {
    var original;
    if (!Fight || !Fight.playerAction || Fight.playerAction.__finalPackWrapped) return;
    original = Fight.playerAction;
    Fight.playerAction = function (state, actionId) {
      var before = state && state.modal && state.modal.type === "activeFight" ? state.modal.session : null;
      var opponent = before && before.opponentId ? fighter(state, before.opponentId) : null;
      var p = player(state);
      var key = before ? before.id : "";
      var result = Injuries.withTemporaryStats([p, opponent], function () { return original.call(Fight, state, actionId); });
      if (result && state && state.modal && state.modal.type === "fightResult" && state.finalLastInjuryFightId !== key) {
        state.finalLastInjuryFightId = key;
        Injuries.afterOfficialFight(state, opponent, state.modal.result, state.modal.method);
        post(state);
      }
      return result;
    };
    Fight.playerAction.__finalPackWrapped = true;
  }

  function wrapProContract() {
    var names = ["startProContractFight", "skipProContractFight", "resolveTitleChallenge"];
    names.forEach(function (name) {
      var original;
      if (!Fight || !Fight[name] || Fight[name].__finalPackWrapped) return;
      original = Fight[name];
      Fight[name] = function () {
        var state = arguments[0];
        var p = player(state);
        var result = Injuries.withTemporaryStats([p], function () { return original.apply(Fight, arguments); });
        if (result && state && state.modal && state.modal.type === "fightResult") post(state);
        return result;
      };
      Fight[name].__finalPackWrapped = true;
    });
  }

  function wrapTournamentRing() {
    var original;
    if (!Amateur || !Amateur.completeTournamentFightFromRing || Amateur.completeTournamentFightFromRing.__finalPackWrapped) return;
    original = Amateur.completeTournamentFightFromRing;
    Amateur.completeTournamentFightFromRing = function (state, activeSession, payload) {
      var session = activeSession && activeSession.tournamentSession ? activeSession.tournamentSession : null;
      var opponent = session && session.opponentId ? fighter(state, session.opponentId) : null;
      var p = player(state);
      var modal = Injuries.withTemporaryStats([p, opponent], function () { return original.call(Amateur, state, activeSession, payload); });
      if (modal && payload) {
        Injuries.afterOfficialFight(state, opponent, payload.result, payload.method);
        post(state);
      }
      return modal;
    };
    Amateur.completeTournamentFightFromRing.__finalPackWrapped = true;
  }

  function wrapWorld() {
    var original;
    if (!World || !World.advanceWeek || World.advanceWeek.__finalPackWrapped) return;
    original = World.advanceWeek;
    World.advanceWeek = function (state, reason) {
      var result = original.call(World, state, reason);
      if (Injuries) { Injuries.tick(state); Injuries.npcWorldTick(state); }
      post(state);
      return result;
    };
    World.advanceWeek.__finalPackWrapped = true;
  }

  wrapFightPreview();
  wrapResolveRandomFight();
  wrapStartInteractiveFight();
  wrapPlayerAction();
  wrapProContract();
  wrapTournamentRing();
  wrapWorld();
}());
