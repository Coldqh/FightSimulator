(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;

  function modalShell(title, bodyHtml, actionsHtml, subtitle) {
    return '<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>' + U.escapeHtml(title || '') + '</h2>' + (subtitle ? '<div class="muted small">' + U.escapeHtml(subtitle) + '</div>' : '') + '</div><div class="modal-body">' + (bodyHtml || '') + '</div><div class="modal-actions">' + (actionsHtml || '') + '</div></div></div>';
  }

  function renderGameOver(modal) {
    return modalShell(
      modal.title || 'Игра окончена',
      '<div class="content-card">' + U.escapeHtml(modal.text || 'Карьера завершена.') + '</div><div class="pill red">Баланс $' + (modal.money || 0) + '</div>',
      '<button class="danger" data-action="reset-career">Начать заново</button>'
    );
  }

  function renderDebtNotice(modal) {
    return modalShell(
      modal.title || 'Деньги',
      '<div class="content-card">' + U.escapeHtml(modal.text || '') + '</div><div class="pills"><span class="pill gold">Баланс $' + modal.money + '</span>' + (modal.weeksLeft ? '<span class="pill red">Осталось ' + modal.weeksLeft + ' нед.</span>' : '') + '</div>',
      '<button class="primary" data-action="close-modal">Понял</button>'
    );
  }

  function renderFatigueLock() {
    return modalShell(
      'Усталость выше 75/100',
      '<div class="content-card">Боец перегружен. Сейчас нельзя тренироваться, драться и идти в турниры. Остальные разделы работают.</div>',
      '<button class="primary" data-action="rest-week">Отдых</button>'
    );
  }

  function renderBasic(state) {
    var modal = state && state.modal;
    if (!modal) { return null; }
    if (modal.type === 'gameOver') { return renderGameOver(modal); }
    if (modal.type === 'debtNotice') { return renderDebtNotice(modal); }
    if (modal.type === 'fatigueLock') { return renderFatigueLock(modal); }
    return null;
  }

  window.FS.RenderModals = {
    renderBasic: renderBasic
  };
}());
