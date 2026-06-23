(function () {
  "use strict";

  var VERSION = "ui-remake-2.4.0";
  var SCHEMA = 240;

  function rootClass() {
    if (document.documentElement) {
      document.documentElement.classList.add("fw-ui-remake");
    }
  }

  function esc(value) {
    var U = window.FS && window.FS.Utils;
    if (U && U.escapeHtml) { return U.escapeHtml(value); }
    return String(value == null ? "" : value).replace(/[&<>\"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch];
    });
  }

  function forceVersion() {
    window.FS = window.FS || {};
    window.FS.Data = window.FS.Data || {};
    window.FS.Data.appVersion = VERSION;
    window.FS.Data.saveSchemaVersion = Math.max(Number(window.FS.Data.saveSchemaVersion) || 0, SCHEMA);
  }

  function playerTrackLabel(state) {
    var State = window.FS && window.FS.State;
    var U = window.FS && window.FS.Utils;
    var player = State && State.player ? State.player(state) : null;
    if (!player || !player.trackId || !U || !U.findTrack) { return "Карьера"; }
    try {
      return (U.findTrack(player.trackId).label || "Карьера");
    } catch (error) {
      return "Карьера";
    }
  }

  var TAB_LABELS = {
    dashboard: "🏠 Обзор",
    profile: "🥊 Профиль",
    fights: "🔥 Бои",
    favorites: "⭐ Избранные",
    news: "📰 Новости",
    pro: "💼 Профи",
    training: "📈 Статы",
    ranking: "🏆 Рейтинг",
    myclub: "🏟️ Мой клуб",
    clubs: "🏛️ Клубы",
    world: "🌍 Люб. путь",
    people: "👥 Люди",
    settings: "⚙️ Настройки"
  };

  function iconizeTabs(tabHtml) {
    Object.keys(TAB_LABELS).forEach(function (id) {
      var rx = new RegExp('(<button\\b(?=[^>]*data-tab="' + id + '")[^>]*>)([\\s\\S]*?)(<\\/button>)', 'g');
      tabHtml = tabHtml.replace(rx, function (_match, open, _oldLabel, close) {
        return open + TAB_LABELS[id] + close;
      });
    });
    return tabHtml;
  }

  function moveTabsToSide(html, state) {
    var opened = false;
    html = html.replace(/<section class="panel main-panel"><div class="tabs">([\s\S]*?)<\/div><div class="tab-scroll-area">/, function (_match, tabs) {
      opened = true;
      return '<div class="ui-remake-layout">' +
        '<aside class="ui-side-nav">' +
          '<div class="side-title"><span>🥊 Fight World</span><small>' + esc(playerTrackLabel(state)) + '</small></div>' +
          '<div class="tabs side-tabs">' + iconizeTabs(tabs) + '</div>' +
        '</aside>' +
        '<section class="panel main-panel ui-remake-main"><div class="tab-scroll-area">';
    });

    if (opened) {
      html = html.replace('</section></div>', '</section></div></div>');
    }
    return html;
  }

  function patchRender() {
    var Render = window.FS && window.FS.Render;
    if (!Render || typeof Render.dashboard !== "function" || Render.__uiRemake240) { return; }
    var originalDashboard = Render.dashboard.bind(Render);
    Render.dashboard = function (state) {
      forceVersion();
      rootClass();
      return moveTabsToSide(originalDashboard(state), state);
    };
    Render.__uiRemake240 = true;
  }

  rootClass();
  forceVersion();
  patchRender();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      rootClass();
      forceVersion();
      patchRender();
    });
  } else {
    rootClass();
    forceVersion();
    patchRender();
  }

  window.addEventListener("load", function () {
    rootClass();
    forceVersion();
    patchRender();
  });

  setInterval(forceVersion, 2000);
}());
