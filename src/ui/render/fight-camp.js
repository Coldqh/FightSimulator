(function () {
  "use strict";

  window.FS = window.FS || {};

  var Render = window.FS.Render;
  var Camp = window.FS.FightCamp;
  var U = window.FS.Utils;

  if (!Render || !Render.dashboard || !Camp || !U) return;

  function esc(value) {
    return U.escapeHtml ? U.escapeHtml(value) : String(value || "");
  }

  function definitions() {
    return Camp.definitions instanceof Array ? Camp.definitions : [];
  }

  function statsText(stats) {
    var parts = [];
    var labels = {
      power: "сила",
      technique: "техника",
      speed: "скорость",
      stamina: "стамина",
      defense: "защита",
      health: "здоровье"
    };
    var key;
    stats = stats || {};
    for (key in labels) {
      if (Object.prototype.hasOwnProperty.call(labels, key) && stats[key]) {
        parts.push(labels[key] + " +" + stats[key]);
      }
    }
    return parts.join(" · ");
  }

  function bonusText(def) {
    var parts = [];
    if (!def) return "нет бонуса";
    if (def.fatigue) parts.push("уст. " + (def.fatigue > 0 ? "+" : "") + def.fatigue);
    if (def.chance) parts.push("шанс +" + def.chance);
    if (statsText(def.stats)) parts.push(statsText(def.stats));
    return parts.join(" · ") || "без боевого бонуса";
  }

  function currentDefinition(state) {
    var active = Camp.current ? Camp.current(state) : null;
    if (!active) return null;
    return active;
  }

  function compactCard(state) {
    var active = currentDefinition(state);
    return '<div class="content-card fight-camp-card">' +
      '<div class="split-row"><h3>Лагерь</h3><button class="small-btn primary" data-fight-camp-modal="1">Выбрать</button></div>' +
      '<div class="split-row"><span>Текущий</span><strong>' + esc(active ? active.label : "нет") + '</strong></div>' +
      '<div class="muted small">' + esc(active ? bonusText(active) : "бонус не выбран") + '</div>' +
      '</div>';
  }

  function optionRow(def, active) {
    var isActive = active && active.id === def.id;
    return '<div class="split-row fight-camp-option">' +
      '<button class="small-btn ' + (isActive ? 'primary' : '') + '" data-fight-camp="' + esc(def.id) + '">' + esc(def.label) + '</button>' +
      '<span class="muted small">' + esc(bonusText(def)) + '</span>' +
      '</div>';
  }

  function modalHtml(state) {
    var modal = state && state.modal;
    var active;
    if (!modal || modal.type !== "fightCampSelect") return "";
    active = currentDefinition(state);
    return '<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>Выбор лагеря</h2><div class="muted small">Эффект действует на следующий официальный бой.</div></div>' +
      '<div class="modal-body"><div class="content-card">' + definitions().map(function (def) { return optionRow(def, active); }).join("") + '</div></div>' +
      '<div class="modal-actions"><button class="primary" data-action="close-modal">Закрыть</button></div>' +
      '</div></div>';
  }

  var originalDashboard = Render.dashboard;
  if (originalDashboard.__fightCampUiWrapped) return;

  Render.dashboard = function (state) {
    var html = originalDashboard.call(Render, state);
    var anchor = '<div class="f1-fights-top">';
    if (state && state.selectedTab === "fights" && html.indexOf("fight-camp-card") === -1 && html.indexOf(anchor) !== -1) {
      html = html.replace(anchor, compactCard(state) + anchor);
    }
    return html + modalHtml(state);
  };

  Render.dashboard.__fightCampUiWrapped = true;
}());
