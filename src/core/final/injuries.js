(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var State = window.FS.State;

  var TYPES = [
    { id: "cut", label: "Рассечение", stats: { health: -2, defense: -1 } },
    { id: "hand", label: "Ушиб руки", stats: { power: -4, technique: -2 } },
    { id: "ribs", label: "Повреждение ребра", stats: { stamina: -4, health: -4 } },
    { id: "foot", label: "Стопа", stats: { speed: -5, stamina: -2 } },
    { id: "concussion", label: "Сотрясение", stats: { technique: -5, speed: -3, health: -6 } },
    { id: "back", label: "Спина", stats: { power: -3, stamina: -5, defense: -3 } }
  ];

  var SEVERITY = [
    { id: "light", label: "лёгкая", penalty: 3, minWeeks: 1, maxWeeks: 2, weight: 58 },
    { id: "medium", label: "средняя", penalty: 7, minWeeks: 2, maxWeeks: 4, weight: 30 },
    { id: "heavy", label: "тяжёлая", penalty: 12, minWeeks: 4, maxWeeks: 8, weight: 10 },
    { id: "critical", label: "критическая", penalty: 20, minWeeks: 8, maxWeeks: 12, weight: 2 }
  ];

  function player(state) {
    return State && State.player ? State.player(state) : null;
  }

  function rand(min, max) {
    return U && U.randomInt ? U.randomInt(min, max) : Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function uid(prefix) {
    return (U && U.uid ? U.uid(prefix) : (prefix + "_" + Date.now() + "_" + rand(1000, 9999)));
  }

  function ensureWorld(state) {
    state.world = state.world && typeof state.world === "object" ? state.world : {};
    state.world.finalArchive = state.world.finalArchive && typeof state.world.finalArchive === "object" ? state.world.finalArchive : {};
    state.world.finalArchive.deaths = state.world.finalArchive.deaths instanceof Array ? state.world.finalArchive.deaths : [];
    return state.world.finalArchive;
  }

  function normalizeFighter(fighter) {
    if (!fighter) return fighter;
    fighter.injuries = fighter.injuries instanceof Array ? fighter.injuries : [];
    fighter.injuries = fighter.injuries.filter(function (injury) { return injury && Number(injury.weeksLeft) > 0; });
    return fighter;
  }

  function active(fighter) {
    normalizeFighter(fighter);
    return fighter && fighter.injuries instanceof Array ? fighter.injuries : [];
  }

  function penalty(fighter) {
    var list = active(fighter);
    var total = 0;
    list.forEach(function (injury) { total += Number(injury.ovrPenalty) || 0; });
    return Math.min(35, total);
  }

  function effectiveOvr(fighter) {
    if (!fighter || !U || !U.statAverage) return 0;
    return Math.max(1, Math.round(U.statAverage(fighter.stats) - penalty(fighter)));
  }

  function pickType() {
    return TYPES[rand(0, TYPES.length - 1)];
  }

  function pickSeverity(forceId) {
    var roll;
    var sum = 0;
    var i;
    if (forceId) {
      for (i = 0; i < SEVERITY.length; i += 1) if (SEVERITY[i].id === forceId) return SEVERITY[i];
    }
    roll = rand(1, 100);
    for (i = 0; i < SEVERITY.length; i += 1) {
      sum += SEVERITY[i].weight;
      if (roll <= sum) return SEVERITY[i];
    }
    return SEVERITY[0];
  }

  function createInjury(state, source, severityId) {
    var type = pickType();
    var sev = pickSeverity(severityId);
    return {
      id: uid("injury"),
      type: type.id,
      label: type.label,
      severity: sev.id,
      severityLabel: sev.label,
      ovrPenalty: sev.penalty,
      weeksLeft: rand(sev.minWeeks, sev.maxWeeks),
      source: source || "бой",
      week: Number(state && state.week) || 1,
      stats: type.stats || {}
    };
  }

  function add(state, fighter, source, severityId) {
    var injury;
    if (!state || !fighter || fighter.dead || fighter.retired) return null;
    normalizeFighter(fighter);
    if (active(fighter).length >= 3) return null;
    injury = createInjury(state, source, severityId);
    fighter.injuries.unshift(injury);
    fighter.careerLog = fighter.careerLog instanceof Array ? fighter.careerLog : [];
    fighter.careerLog.unshift({ week: state.week, text: "Травма: " + injury.label + " · " + injury.severityLabel + " · -" + injury.ovrPenalty + " OVR · " + injury.weeksLeft + " нед." });
    if (fighter.careerLog.length > 80) fighter.careerLog.length = 80;
    if (window.FS.World && window.FS.World.createNews && !fighter.isPlayer && rand(1, 100) <= 25) {
      window.FS.World.createNews(state, "fight", "Травма: " + fighter.name + " · " + injury.label + " · " + injury.weeksLeft + " нед.", { fighterId: fighter.id });
    }
    return injury;
  }

  function cleanupOffers(state) {
    if (!state || !(state.offers instanceof Array) || !U || !U.getFighterById) return;
    state.offers = state.offers.filter(function (offer) {
      var fighter = offer && offer.opponentId ? U.getFighterById(state, offer.opponentId) : null;
      return !fighter || (!fighter.dead && !fighter.retired);
    });
  }

  function archiveDeath(state, fighter, reason) {
    var archive = ensureWorld(state);
    if (!fighter || !fighter.id) return;
    if (!archive.deaths.some(function (item) { return item.fighterId === fighter.id; })) {
      archive.deaths.unshift({ fighterId: fighter.id, name: fighter.name || "Боец", week: state.week, reason: reason || "Уличный бой", trackId: fighter.trackId || "" });
      if (archive.deaths.length > 120) archive.deaths.length = 120;
    }
  }

  function kill(state, fighter, reason) {
    var p = player(state);
    if (!state || !fighter || fighter.dead) return false;
    fighter.dead = true;
    fighter.retired = true;
    fighter.deathWeek = Number(state.week) || 1;
    fighter.deathReason = reason || "Уличный бой";
    fighter.injuries = [];
    archiveDeath(state, fighter, fighter.deathReason);
    cleanupOffers(state);
    if (window.FS.World && window.FS.World.createNews) {
      window.FS.World.createNews(state, "fight", "Смерть на улице: " + fighter.name + ".", { fighterId: fighter.id });
    }
    if (p && fighter.id === p.id) {
      state.gameOver = true;
      state.modal = { type: "gameOver", title: "Карьера закончена", text: "Поражение на улице закончилось смертью. Боец погиб.", money: p.money || 0 };
    }
    return true;
  }

  function fightChance(fighter, lost, method, trackId) {
    var chance = 6;
    if (method === "KO/TKO") chance += 8;
    if (trackId === "street") chance += 5;
    if (lost) chance += 4;
    if (penalty(fighter) > 0) chance += 3;
    return Math.min(22, chance);
  }

  function rollInjury(state, fighter, lost, method, trackId) {
    var chance = fightChance(fighter, lost, method, trackId);
    if (rand(1, 100) <= chance) return add(state, fighter, trackId === "street" ? "уличный бой" : "бой");
    return null;
  }

  function afterOfficialFight(state, opponent, result, method) {
    var p = player(state);
    var trackId = p ? p.trackId : "amateur";
    var playerLost = result === "Поражение";
    var opponentLost = result === "Победа";
    var playerInjury;
    var opponentInjury;
    if (!state || !p || !opponent || result === "Ничья") {
      if (p) rollInjury(state, p, false, method, trackId);
      if (opponent) rollInjury(state, opponent, false, method, trackId);
      cleanupOffers(state);
      return;
    }
    if (trackId === "street") {
      if (playerLost && rand(1, 100) <= 1) { kill(state, p, "Поражение на улице"); return; }
      if (opponentLost && rand(1, 100) <= 1) { kill(state, opponent, "Поражение на улице"); }
    }
    playerInjury = rollInjury(state, p, playerLost, method, trackId);
    opponentInjury = rollInjury(state, opponent, opponentLost, method, trackId);
    state.finalFightEffects = state.finalFightEffects || [];
    [playerInjury, opponentInjury].forEach(function (injury) { if (injury) state.finalFightEffects.unshift(injury); });
    if (state.finalFightEffects.length > 8) state.finalFightEffects.length = 8;
    cleanupOffers(state);
  }

  function tick(state) {
    var healed = [];
    var roster = state && state.roster instanceof Array ? state.roster : [];
    roster.forEach(function (fighter) {
      normalizeFighter(fighter);
      (fighter.injuries || []).forEach(function (injury) {
        injury.weeksLeft = Math.max(0, (Number(injury.weeksLeft) || 0) - 1);
        if (injury.weeksLeft <= 0) healed.push({ fighter: fighter, injury: injury });
      });
      normalizeFighter(fighter);
    });
    healed.slice(0, 8).forEach(function (item) {
      if (item.fighter && item.fighter.careerLog) item.fighter.careerLog.unshift({ week: state.week, text: "Травма прошла: " + item.injury.label + "." });
    });
  }

  function npcWorldTick(state) {
    var roster = state && state.roster instanceof Array ? state.roster : [];
    var activeNpc = roster.filter(function (fighter) { return fighter && !fighter.isPlayer && !fighter.dead && !fighter.retired; });
    var streetNpc = activeNpc.filter(function (fighter) { return fighter.trackId === "street"; });
    var i;
    for (i = 0; i < Math.min(35, activeNpc.length); i += 1) {
      if (rand(1, 100) <= 2) add(state, activeNpc[rand(0, activeNpc.length - 1)], "бой NPC", "light");
    }
    for (i = 0; i < Math.min(12, streetNpc.length); i += 1) {
      if (rand(1, 10000) <= 10) kill(state, streetNpc[rand(0, streetNpc.length - 1)], "Уличный бой NPC");
    }
    cleanupOffers(state);
  }

  function statPenaltyMap(fighter) {
    var list = active(fighter);
    var map = {};
    list.forEach(function (injury) {
      var key;
      var stats = injury.stats || {};
      var scale = Math.max(1, (Number(injury.ovrPenalty) || 0) / 4);
      for (key in stats) {
        if (Object.prototype.hasOwnProperty.call(stats, key)) map[key] = (map[key] || 0) + Math.round(stats[key] * scale);
      }
    });
    return map;
  }

  function withTemporaryStats(fighters, fn) {
    var changed = [];
    (fighters || []).forEach(function (fighter) {
      var map = statPenaltyMap(fighter);
      var stats = fighter && fighter.stats ? fighter.stats : null;
      var key;
      if (!stats) return;
      for (key in map) {
        if (Object.prototype.hasOwnProperty.call(map, key)) {
          changed.push({ stats: stats, key: key, value: stats[key] });
          stats[key] = Math.max(1, Math.round((Number(stats[key]) || 1) + map[key]));
        }
      }
    });
    try { return fn(); }
    finally {
      changed.forEach(function (item) { item.stats[item.key] = item.value; });
    }
  }

  window.FS.FinalInjuries = {
    active: active,
    penalty: penalty,
    effectiveOvr: effectiveOvr,
    add: add,
    kill: kill,
    afterOfficialFight: afterOfficialFight,
    tick: tick,
    npcWorldTick: npcWorldTick,
    cleanupOffers: cleanupOffers,
    withTemporaryStats: withTemporaryStats,
    ensureWorld: ensureWorld
  };
}());
