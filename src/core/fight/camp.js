(function () {
  "use strict";

  window.FS = window.FS || {};

  var DEFINITIONS = [
    { id: "technique", label: "Техника", fatigue: 8, chance: 3, stats: { technique: 12, speed: 4 } },
    { id: "power", label: "Сила", fatigue: 10, chance: 1, stats: { power: 14 } },
    { id: "cardio", label: "Кардио", fatigue: 8, chance: 2, stats: { stamina: 24 } },
    { id: "defense", label: "Защита", fatigue: 7, chance: 2, stats: { defense: 16, health: 16 } },
    { id: "scouting", label: "Скаутинг", fatigue: 3, chance: 5, stats: { technique: 6, speed: 6 } },
    { id: "recovery", label: "Восстановление", fatigue: -14, chance: 0, stats: {} }
  ];

  function clamp(value, min, max) {
    value = Math.round(Number(value) || 0);
    return Math.max(min, Math.min(max, value));
  }

  function player(state) {
    return window.FS.State && window.FS.State.player ? window.FS.State.player(state) : null;
  }

  function def(id) {
    var i;
    for (i = 0; i < DEFINITIONS.length; i += 1) {
      if (DEFINITIONS[i].id === id) return DEFINITIONS[i];
    }
    return null;
  }

  function current(state) {
    var p = player(state);
    var d;
    if (!p || !p.fightCamp || !p.fightCamp.id) return null;
    d = def(p.fightCamp.id);
    if (!d) return null;
    return {
      id: d.id,
      label: d.label,
      fatigue: d.fatigue,
      chance: d.chance,
      stats: d.stats || {},
      week: p.fightCamp.week,
      chargedWeek: p.fightCamp.chargedWeek
    };
  }

  function setFatigue(state, delta) {
    var p = player(state);
    if (!p) return;
    p.fatigue = clamp((Number(p.fatigue) || 0) + delta, 0, 100);
  }

  function select(state, id) {
    var p = player(state);
    var d = def(id);
    var chargedThisWeek;
    if (!p || !d) return false;

    if (d.id === "recovery") {
      if (p.fightCampRecoveryWeek === state.week) {
        state.feed = "Восстановление уже использовано на этой неделе.";
        return true;
      }
      setFatigue(state, d.fatigue);
      p.fightCampRecoveryWeek = state.week;
      p.fightCamp = null;
      state.feed = "Лагерь: восстановление. Усталость -14.";
      return true;
    }

    chargedThisWeek = !!(p.fightCamp && p.fightCamp.chargedWeek === state.week);
    if (!chargedThisWeek) setFatigue(state, d.fatigue);
    p.fightCamp = { id: d.id, week: state.week, chargedWeek: chargedThisWeek ? p.fightCamp.chargedWeek : state.week };
    state.feed = "Лагерь: " + d.label + ". Усталость " + (chargedThisWeek ? "без изменений" : "+" + d.fatigue) + ".";
    return true;
  }

  function clearAfterFight(state) {
    var p = player(state);
    if (p && p.fightCamp) p.fightCamp = null;
  }

  function applyChance(state, chance) {
    var camp = current(state);
    if (!camp) return clamp(chance, 5, 95);
    return clamp((Number(chance) || 50) + (Number(camp.chance) || 0), 5, 95);
  }

  function withTemporaryStats(state, fn) {
    var p = player(state);
    var camp = current(state);
    var stats;
    var original = {};
    var key;
    if (!p || !camp || !camp.stats) return fn();
    stats = p.stats = p.stats || {};
    for (key in camp.stats) {
      if (Object.prototype.hasOwnProperty.call(camp.stats, key)) {
        original[key] = stats[key];
        stats[key] = clamp((Number(stats[key]) || 0) + camp.stats[key], 1, 260);
      }
    }
    try {
      return fn();
    } finally {
      for (key in original) {
        if (Object.prototype.hasOwnProperty.call(original, key)) stats[key] = original[key];
      }
    }
  }

  function renderCard(state, escapeHtml) {
    var p = player(state);
    var active = current(state);
    var fatigue = p ? (Number(p.fatigue) || 0) : 0;
    var disabled = fatigue >= 95 ? " disabled" : "";
    function button(d) {
      var cls = active && active.id === d.id ? "small-btn primary" : "small-btn";
      var label = d.label;
      var meta = d.id === "recovery" ? "уст. -14" : ("уст. +" + d.fatigue + " · шанс +" + d.chance);
      return '<button class="' + cls + '" data-fight-camp="' + d.id + '"' + (d.id === "recovery" ? "" : disabled) + '>' + escapeHtml(label) + '<small>' + escapeHtml(meta) + '</small></button>';
    }
    return '<div class="content-card fight-camp-card"><div class="split-row"><h3>Лагерь</h3><strong>' + (active ? escapeHtml(active.label) : 'нет') + '</strong></div><div class="row fight-camp-row">' + DEFINITIONS.map(button).join('') + '</div><div class="muted small">Эффект действует на следующий официальный бой. После боя сбрасывается.</div></div>';
  }

  window.FS.FightCamp = {
    definitions: DEFINITIONS.slice(),
    current: current,
    select: select,
    clearAfterFight: clearAfterFight,
    applyChance: applyChance,
    withTemporaryStats: withTemporaryStats,
    renderCard: renderCard
  };
}());
