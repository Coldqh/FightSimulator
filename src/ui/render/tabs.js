(function () {
  "use strict";

  window.FS = window.FS || {};

  function renderMain(state, ctx) {
    var U = window.FS.Utils;
    var State = window.FS.State;
    var p = State.player(state);
    var content;
    var tab = state.selectedTab || "dashboard";

    if (p.trackId === "pro" && (tab === "fights" || tab === "world")) { tab = "dashboard"; }
    if (p.trackId === "street" && (tab === "pro" || tab === "world")) { tab = "dashboard"; }
    if (p.trackId === "amateur" && tab === "pro") { tab = "dashboard"; }

    if (tab === "dashboard") { content = ctx.renderDashboardTab(state); }
    else if (tab === "profile") { content = ctx.renderProfileTab(state); }
    else if (tab === "history") { content = ctx.renderHistoryTab(state); }
    else if (tab === "goals") { content = ctx.renderGoalsTab(state); }
    else if (tab === "fights") { content = ctx.renderFightsTab(state); }
    else if (tab === "favorites") { content = ctx.renderFavoritesTab(state); }
    else if (tab === "news") { content = ctx.renderNewsTab(state); }
    else if (tab === "pro") { content = ctx.renderProTab(state); }
    else if (tab === "training") { content = ctx.renderTrainingTab(state); }
    else if (tab === "economy") { content = ctx.renderDashboardTab(state); }
    else if (tab === "ranking") { content = ctx.renderRankingTab(state); }
    else if (tab === "myclub") { content = ctx.renderMyClubTab(state); }
    else if (tab === "clubs") { content = ctx.renderClubsTab(state); }
    else if (tab === "world") { content = ctx.renderWorldTab(state); }
    else if (tab === "settings") { content = ctx.renderSettingsTab(state); }
    else { content = ctx.renderPeopleTab(state); }

    function desktopTabs() {
      return ctx.renderTabs(state).replace('class="tabs"', 'class="tabs side-tabs"');
    }

    function tabButton(id, icon, label) {
      return '<button class="f1-nav-btn ' + (tab === id ? 'active' : '') + '" data-tab="' + id + '"><span>' + icon + '</span>' + label + '</button>';
    }

    function moreItem(id, icon, label) {
      return '<button data-tab="' + id + '">' + icon + ' ' + label + '</button>';
    }

    function mobileNav() {
      return '<nav class="f1-mobile-nav">' +
        tabButton('dashboard', '🏠', 'Обзор') +
        tabButton('profile', '🥊', 'Профиль') +
        '<button class="f1-nav-btn week" data-action="next-week"><span>⏭</span>Неделя</button>' +
        (p.trackId !== 'pro' ? tabButton('fights', '🔥', 'Бои') : tabButton('pro', '💼', 'Профи')) +
        '<button class="f1-nav-btn ' + (state.mobileMoreOpen ? 'more-active' : '') + '" data-mobile-more="toggle"><span>☰</span>Ещё</button>' +
      '</nav>';
    }

    function moreSheet() {
      if (!state.mobileMoreOpen) { return ''; }
      return '<div class="f1-more-backdrop" data-mobile-more-close="1"></div>' +
        '<section class="f1-more-sheet">' +
          '<div class="f1-more-head"><div class="f1-more-title"><strong>Ещё</strong><span>Остальные окна карьеры</span></div><button class="small-btn" data-mobile-more-close="1">Закрыть</button></div>' +
          '<div class="f1-more-grid">' +
            (p.trackId === 'amateur' ? moreItem('world', '🌍', 'Люб. путь') : '') +
            (p.trackId === 'pro' ? moreItem('pro', '💼', 'Профи') : '') +
            moreItem('goals', '🎯', 'Цели') +
            moreItem('history', '📜', 'История') +
            moreItem('training', '📈', 'Статы') +
            moreItem('ranking', '🏆', 'Рейтинг') +
            moreItem('myclub', '🏟️', 'Мой клуб') +
            moreItem('clubs', '🏛️', 'Клубы') +
            moreItem('favorites', '⭐', 'Избранные') +
            moreItem('news', '📰', 'Новости') +
            moreItem('people', '👥', 'Люди') +
            moreItem('settings', '⚙️', 'Настройки') +
          '</div>' +
        '</section>';
    }

    var trackLabel = p && p.trackId ? U.findTrack(p.trackId).label : "Карьера";

    return '<div class="f1-layout">' +
      '<aside class="f1-side-nav"><div class="f1-side-title"><span>🏁 Fight World</span><small>' + U.escapeHtml(trackLabel) + '</small></div>' + desktopTabs() + '</aside>' +
      '<section class="panel main-panel f1-main"><div class="tab-scroll-area"><div class="feed">' + U.escapeHtml(state.feed || "Готово.") + '</div>' + content + '</div></section>' +
      '</div>' +
      '<div class="f1-bottom-spacer"></div>' +
      mobileNav() +
      moreSheet();
  }

  window.FS.RenderTabs = {
    renderMain: renderMain
  };
}());
