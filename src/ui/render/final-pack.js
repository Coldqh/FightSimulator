(function () {
  "use strict";

  window.FS = window.FS || {};

  var Render = window.FS.Render;
  var U = window.FS.Utils;
  var State = window.FS.State;
  var Injuries = window.FS.FinalInjuries;
  var Objectives = window.FS.FinalObjectives;

  if (!Render || !Render.dashboard || !U || !State) return;

  function esc(value) { return U.escapeHtml ? U.escapeHtml(value) : String(value || ""); }
  function player(state) { return State.player ? State.player(state) : null; }

  function injuryLine(fighter) {
    var list = Injuries && Injuries.active ? Injuries.active(fighter) : [];
    if (!list.length) return '<span class="pill green">здоров</span>';
    return list.map(function (injury) {
      return '<span class="pill red">' + esc(injury.label) + ' · -' + (Number(injury.ovrPenalty) || 0) + ' OVR · ' + (Number(injury.weeksLeft) || 0) + ' нед.</span>';
    }).join('');
  }

  function currentGoalCard(state) {
    var data = Objectives && Objectives.current ? Objectives.current(state) : null;
    var goal = data && data.goal;
    var progress = data && data.progress;
    var done = state.finalGoals && state.finalGoals.completed ? state.finalGoals.completed.length : 0;
    var skipped = state.finalGoals && state.finalGoals.skipped ? state.finalGoals.skipped.length : 0;
    if (!goal) {
      return '<div class="content-card final-goal-card"><h3>Главная цель</h3><div class="big-result win">Карьера закрыта</div><div class="muted small">Активных целей больше нет.</div></div>';
    }
    return '<div class="content-card final-goal-card"><div class="split-row"><h3>Главная цель</h3><strong>' + esc(progress.text) + '</strong></div>' +
      '<div class="name-line">' + esc(goal.label) + '</div>' +
      '<div class="split-row"><span>Награда</span><strong>+' + (Number(goal.rewardPoints) || 0) + ' очк. · $' + (Number(goal.rewardMoney) || 0) + '</strong></div>' +
      '<div class="muted small">Выполнено: ' + done + ' · пропущено: ' + skipped + '</div></div>';
  }

  function completedGoalsCard(state) {
    var data = Objectives && Objectives.ensure ? Objectives.ensure(state) : { completed: [], skipped: [] };
    function row(prefix, item) {
      return '<div class="split-row"><span>' + prefix + ' ' + esc(item.label) + '</span><strong>нед. ' + (item.week || '—') + '</strong></div>';
    }
    return '<div class="content-card final-goal-history"><h3>Сквозные цели</h3>' +
      (data.completed.length ? data.completed.slice(0, 30).map(function (item) { return row('✓', item); }).join('') : '<div class="muted small">Выполненных целей нет.</div>') +
      (data.skipped.length ? '<h3 style="margin-top:14px">Пропущено</h3>' + data.skipped.slice(0, 20).map(function (item) { return row('→', item); }).join('') : '') +
      '</div>';
  }

  function enhanceGoals(html, state) {
    if (!state || state.selectedTab !== "goals") return html;
    if (String(html).indexOf('final-goal-card') !== -1) return html;
    if (state.goalsSubTab === "completed") return String(html).replace('<div class="goals-tab-body">', '<div class="goals-tab-body">' + completedGoalsCard(state));
    return String(html).replace('<div class="goals-tab-body">', '<div class="goals-tab-body">' + currentGoalCard(state));
  }

  function enhanceProfile(html, state) {
    var p = player(state);
    var base;
    var effective;
    var card;
    if (!p || String(html).indexOf('final-injury-profile') !== -1) return html;
    base = U.statAverage(p.stats);
    effective = Injuries && Injuries.effectiveOvr ? Injuries.effectiveOvr(p) : base;
    card = '<div class="content-card final-injury-profile" style="margin-top:12px"><div class="split-row"><h3>Травмы</h3><strong>OVR ' + effective + (effective !== base ? ' / база ' + base : '') + '</strong></div><div class="row">' + injuryLine(p) + '</div></div>';
    if (state.selectedTab === "profile") return String(html).replace('<div class="content-card f1-gym-card"', card + '<div class="content-card f1-gym-card"');
    return html;
  }

  function enhancePreview(html, state) {
    var modal = state && state.modal;
    var p = player(state);
    var opponent = modal && modal.opponentId && U.getFighterById ? U.getFighterById(state, modal.opponentId) : null;
    var pPenalty;
    var oPenalty;
    var card;
    if (!modal || modal.type !== "fightPreview" || !p || !opponent) return html;
    if (String(html).indexOf('final-injury-preview') !== -1) return html;
    pPenalty = Injuries ? Injuries.penalty(p) : 0;
    oPenalty = Injuries ? Injuries.penalty(opponent) : 0;
    if (!pPenalty && !oPenalty) return html;
    card = '<div class="content-card final-injury-preview" style="margin-top:12px"><h3>Травмы</h3>' +
      '<div class="split-row"><span>Ты</span><strong>' + (pPenalty ? ('-' + pPenalty + ' OVR') : 'нет') + '</strong></div>' +
      '<div class="split-row"><span>Соперник</span><strong>' + (oPenalty ? ('-' + oPenalty + ' OVR') : 'нет') + '</strong></div></div>';
    return String(html).replace('<div class="modal-actions">', card + '<div class="modal-actions">');
  }

  function enhanceFightResult(html, state) {
    var list = state && state.finalFightEffects instanceof Array ? state.finalFightEffects : [];
    var card;
    if (!state || !state.modal || state.modal.type !== "fightResult" || !list.length) return html;
    if (String(html).indexOf('final-fight-effects') !== -1) return html;
    card = '<div class="content-card final-fight-effects" style="margin-top:12px"><h3>Последствия</h3>' + list.slice(0, 4).map(function (injury) {
      return '<div class="split-row"><span>' + esc(injury.label) + ' · ' + esc(injury.severityLabel) + '</span><strong>-' + (Number(injury.ovrPenalty) || 0) + ' OVR · ' + (Number(injury.weeksLeft) || 0) + ' нед.</strong></div>';
    }).join('') + '</div>';
    return String(html).replace('<div class="modal-actions">', card + '<div class="modal-actions">');
  }

  function allCoaches(state) {
    var out = [];
    var seen = {};
    function add(coach) { if (coach && coach.id && !seen[coach.id]) { seen[coach.id] = true; out.push(coach); } }
    (state.people || []).forEach(function (person) { if (person.personType === "coach" || /coach/i.test(String(person.role || ""))) add(person); });
    (state.clubs || []).forEach(function (club) {
      if (club.coach) add(club.coach);
      (club.coaches || []).forEach(add);
    });
    return out;
  }

  function archivePanel(state) {
    var tab = state.finalSettingsSubtab || "graveyard";
    var roster = state.roster instanceof Array ? state.roster : [];
    var dead = roster.filter(function (fighter) { return fighter && fighter.dead; });
    var retired = roster.filter(function (fighter) { return fighter && fighter.retired && !fighter.dead; });
    var coaches = allCoaches(state);
    function btn(id, label) { return '<button class="small-btn ' + (tab === id ? 'primary' : '') + '" data-final-settings-subtab="' + id + '">' + label + '</button>'; }
    function fighterRow(fighter) { return '<div class="split-row"><span>' + esc(fighter.name) + '</span><strong>' + esc(fighter.deathReason || fighter.trackId || '') + (fighter.deathWeek ? ' · нед. ' + fighter.deathWeek : '') + '</strong></div>'; }
    function coachRow(coach) { return '<div class="split-row"><span>' + esc(coach.name || 'Тренер') + '</span><strong>OVR ' + (coach.ovr || (coach.stats ? U.statAverage(coach.stats) : 0) || '—') + '</strong></div>'; }
    var body;
    if (tab === "retired") body = retired.length ? retired.slice(0, 80).map(fighterRow).join('') : '<div class="muted small">Никого.</div>';
    else if (tab === "coaches") body = coaches.length ? coaches.slice(0, 80).map(coachRow).join('') : '<div class="muted small">Тренеров нет.</div>';
    else body = dead.length ? dead.slice(0, 80).map(fighterRow).join('') : '<div class="muted small">Кладбище пусто.</div>';
    return '<div class="content-card final-archive-card"><div class="split-row"><h3>Архив</h3><strong>' + (dead.length + retired.length + coaches.length) + '</strong></div><div class="row">' + btn('graveyard', 'Кладбище') + btn('retired', 'Завершили') + btn('coaches', 'Тренеры') + '</div><div style="margin-top:12px">' + body + '</div></div>';
  }

  function enhanceSettings(html, state) {
    var insert;
    var mark = '</div></section>';
    var idx;
    if (!state || state.selectedTab !== "settings") return html;
    if (String(html).indexOf('final-archive-card') !== -1) return html;
    insert = archivePanel(state);
    idx = String(html).lastIndexOf(mark);
    if (idx === -1) return html + insert;
    return String(html).slice(0, idx) + insert + String(html).slice(idx);
  }

  function enhance(html, state) {
    var out = String(html || "");
    out = enhanceGoals(out, state);
    out = enhanceProfile(out, state);
    out = enhancePreview(out, state);
    out = enhanceFightResult(out, state);
    out = enhanceSettings(out, state);
    return out;
  }

  if (!Render.dashboard.__finalPackWrapped) {
    var original = Render.dashboard;
    Render.dashboard = function (state) { return enhance(original.call(Render, state), state); };
    Render.dashboard.__finalPackWrapped = true;
  }

  window.FS.FinalRenderPack = { enhance: enhance, archivePanel: archivePanel, currentGoalCard: currentGoalCard };
}());
