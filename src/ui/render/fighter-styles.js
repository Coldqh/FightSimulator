(function () {
  "use strict";

  window.FS = window.FS || {};

  var Render = window.FS.Render;
  var Styles = window.FS.FightStyles;
  var State = window.FS.State;
  var U = window.FS.Utils;

  if (!Render || !Styles || !State || !U) return;

  function esc(value) {
    return U.escapeHtml ? U.escapeHtml(value) : String(value || "");
  }

  function regEsc(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function pill(fighter) {
    var style = Styles.styleFor(fighter);
    return '<span class="pill blue fighter-style-pill" title="Стиль бойца">' + esc(style.label) + '</span>';
  }

  function addRowStyles(html, state) {
    var roster = state && state.roster instanceof Array ? state.roster : [];
    var out = String(html || "");
    roster.forEach(function (fighter) {
      var id;
      var re;
      if (!fighter || !fighter.id) return;
      id = regEsc(esc(fighter.id));
      re = new RegExp('(<div class="f1-person-row[^>]*data-row-fighter="' + id + '"[\\s\\S]*?<div class="f1-row-name">[^<]*</div>)', 'g');
      out = out.replace(re, function (match) {
        if (match.indexOf('fighter-style-pill') !== -1) return match;
        return match + pill(fighter);
      });
    });
    return out;
  }

  function addProfileStyle(html, state) {
    var p = State.player ? State.player(state) : null;
    var style;
    var card;
    if (!p || String(html || "").indexOf('f1-profile-grid') === -1) return html;
    if (String(html).indexOf('profile-style-stat') !== -1) return html;
    style = Styles.styleFor(p);
    card = '<div class="f1-profile-stat profile-style-stat"><span>Стиль</span><strong>' + esc(style.label) + '</strong></div>';
    return String(html).replace('<div class="f1-profile-grid">', '<div class="f1-profile-grid">' + card);
  }

  function previewStyleCard(state) {
    var modal = state && state.modal;
    var p = State.player ? State.player(state) : null;
    var opponent = modal && modal.opponentId ? U.getFighterById(state, modal.opponentId) : null;
    var ps;
    var os;
    var mod;
    if (!modal || modal.type !== "fightPreview" || !p || !opponent) return "";
    ps = Styles.styleFor(p);
    os = Styles.styleFor(opponent);
    mod = Styles.chanceModifier(p, opponent);
    return '<div class="content-card fighter-style-preview" style="margin-top:12px"><h3>Стили</h3>' +
      '<div class="split-row"><span>Ты</span><strong>' + esc(ps.label) + '</strong></div>' +
      '<div class="split-row"><span>Соперник</span><strong>' + esc(os.label) + '</strong></div>' +
      '<div class="split-row"><span>Матчап</span><strong>' + (mod > 0 ? '+' : '') + mod + '%</strong></div>' +
      '</div>';
  }

  function addPreviewCard(html, state) {
    var card = previewStyleCard(state);
    if (!card || String(html || "").indexOf('fighter-style-preview') !== -1) return html;
    return String(html).replace('<div class="modal-actions">', card + '<div class="modal-actions">');
  }

  function enhance(html, state) {
    var out = String(html || "");
    out = addRowStyles(out, state);
    out = addProfileStyle(out, state);
    out = addPreviewCard(out, state);
    return out;
  }

  if (Render.dashboard && !Render.dashboard.__fighterStylesWrapped) {
    var originalDashboard = Render.dashboard;
    Render.dashboard = function (state) {
      return enhance(originalDashboard.call(Render, state), state);
    };
    Render.dashboard.__fighterStylesWrapped = true;
  }

  window.FS.RenderFighterStyles = {
    enhance: enhance,
    pill: pill,
    previewStyleCard: previewStyleCard
  };
}());
