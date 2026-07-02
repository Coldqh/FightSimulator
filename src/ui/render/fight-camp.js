(function () {
  "use strict";

  window.FS = window.FS || {};

  var Render = window.FS.Render;
  var Camp = window.FS.FightCamp;
  var U = window.FS.Utils;

  if (!Render || !Render.dashboard || !Camp || !Camp.renderCard || !U) return;

  var originalDashboard = Render.dashboard;
  if (originalDashboard.__fightCampWrapped) return;

  Render.dashboard = function (state) {
    var html = originalDashboard.call(Render, state);
    var card;
    var anchor = '<div class="f1-fights-top">';
    if (!state || state.selectedTab !== "fights" || html.indexOf("fight-camp-card") !== -1) return html;
    card = Camp.renderCard(state, U.escapeHtml);
    if (html.indexOf(anchor) !== -1) return html.replace(anchor, card + anchor);
    return html;
  };
  Render.dashboard.__fightCampWrapped = true;
}());
