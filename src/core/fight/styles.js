(function () {
  "use strict";

  window.FS = window.FS || {};

  var DEFINITIONS = [
    { id: "boxer", label: "Боксёр", short: "Бокс", chance: 2, stats: { technique: 8, speed: 4 }, tags: ["точность", "очки"] },
    { id: "puncher", label: "Панчер", short: "Панч", chance: 0, stats: { power: 12, technique: -3 }, tags: ["урон", "KO"] },
    { id: "pressure", label: "Прессинг", short: "Давл", chance: 1, stats: { stamina: 8, power: 4, defense: -4, health: -4 }, tags: ["стамина", "темп"] },
    { id: "counter", label: "Контрпанчер", short: "Контр", chance: 1, stats: { technique: 7, defense: 5, speed: 2 }, tags: ["контра", "защита"] },
    { id: "tempo", label: "Темповик", short: "Темп", chance: 1, stats: { speed: 7, stamina: 6 }, tags: ["скорость", "серии"] },
    { id: "defender", label: "Защитник", short: "Защ", chance: 1, stats: { defense: 12, health: 8, power: -4 }, tags: ["защита", "очки"] },
    { id: "slugger", label: "Рубака", short: "Руб", chance: -1, stats: { power: 9, health: 6, defense: -5 }, tags: ["ближний бой", "риск"] }
  ];

  var MATCHUPS = {
    "counter:pressure": 4,
    "boxer:slugger": 3,
    "defender:puncher": 3,
    "pressure:boxer": 2,
    "tempo:defender": 2,
    "puncher:defender": -2,
    "slugger:tempo": -2,
    "pressure:counter": -3,
    "slugger:boxer": -3
  };

  function clamp(value, min, max) {
    value = Math.round(Number(value) || 0);
    return Math.max(min, Math.min(max, value));
  }

  function hash(value) {
    var text = String(value || "");
    var out = 0;
    var i;
    for (i = 0; i < text.length; i += 1) {
      out = ((out << 5) - out + text.charCodeAt(i)) | 0;
    }
    return Math.abs(out);
  }

  function statsOf(fighter) {
    return fighter && fighter.stats ? fighter.stats : {};
  }

  function scoreFor(def, stats) {
    var score = Number(def.chance) || 0;
    if (def.id === "boxer") { score += (Number(stats.technique) || 0) * 1.15 + (Number(stats.speed) || 0) * 0.60; }
    if (def.id === "puncher") { score += (Number(stats.power) || 0) * 1.35 - (Number(stats.technique) || 0) * 0.18; }
    if (def.id === "pressure") { score += (Number(stats.stamina) || 0) * 0.95 + (Number(stats.power) || 0) * 0.38 - (Number(stats.defense || stats.health) || 0) * 0.12; }
    if (def.id === "counter") { score += (Number(stats.technique) || 0) * 0.78 + (Number(stats.defense || stats.health) || 0) * 0.65 + (Number(stats.speed) || 0) * 0.25; }
    if (def.id === "tempo") { score += (Number(stats.speed) || 0) * 1.05 + (Number(stats.stamina) || 0) * 0.70; }
    if (def.id === "defender") { score += (Number(stats.defense || stats.health) || 0) * 1.30 + (Number(stats.technique) || 0) * 0.20 - (Number(stats.power) || 0) * 0.10; }
    if (def.id === "slugger") { score += (Number(stats.power) || 0) * 0.88 + (Number(stats.health || stats.defense) || 0) * 0.46 - (Number(stats.speed) || 0) * 0.20; }
    return score;
  }

  function definition(id) {
    var i;
    for (i = 0; i < DEFINITIONS.length; i += 1) {
      if (DEFINITIONS[i].id === id) return DEFINITIONS[i];
    }
    return DEFINITIONS[0];
  }

  function styleFor(fighter) {
    var stats = statsOf(fighter);
    var best = null;
    var bestScore = -999999;
    var i;
    var current;
    var currentScore;
    if (!fighter) return definition("boxer");
    if (fighter.fightStyleId) return definition(fighter.fightStyleId);
    for (i = 0; i < DEFINITIONS.length; i += 1) {
      current = DEFINITIONS[i];
      currentScore = scoreFor(current, stats);
      if (currentScore > bestScore) {
        best = current;
        bestScore = currentScore;
      }
    }
    if (!best || bestScore <= 0) return DEFINITIONS[hash(fighter.id || fighter.name) % DEFINITIONS.length];
    return best;
  }

  function matchupModifier(playerStyle, opponentStyle) {
    var playerId = typeof playerStyle === "string" ? playerStyle : (playerStyle && playerStyle.id);
    var opponentId = typeof opponentStyle === "string" ? opponentStyle : (opponentStyle && opponentStyle.id);
    return Number(MATCHUPS[playerId + ":" + opponentId]) || 0;
  }

  function chanceModifier(player, opponent) {
    var own = styleFor(player);
    var enemy = styleFor(opponent);
    return clamp((Number(own.chance) || 0) + matchupModifier(own, enemy), -4, 4);
  }

  function styleStats(fighter, opponent) {
    var style = styleFor(fighter);
    var enemy = styleFor(opponent);
    var source = style.stats || {};
    var out = {};
    var key;
    for (key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) out[key] = Number(source[key]) || 0;
    }
    if (style.id === "counter" && enemy.id === "pressure") { out.technique = (out.technique || 0) + 4; out.defense = (out.defense || 0) + 4; out.health = (out.health || 0) + 4; }
    if (style.id === "boxer" && enemy.id === "slugger") { out.speed = (out.speed || 0) + 4; out.technique = (out.technique || 0) + 3; }
    if (style.id === "defender" && enemy.id === "puncher") { out.defense = (out.defense || 0) + 5; out.health = (out.health || 0) + 5; }
    if (style.id === "slugger" && enemy.id === "tempo") { out.speed = (out.speed || 0) - 3; }
    return out;
  }

  function withTemporaryStyleStats(player, opponent, fn) {
    var targets = [];
    var changed = [];
    var i;
    var item;
    var stats;
    var key;
    var mods;

    function addTarget(fighter, enemy) {
      if (fighter && fighter.stats) targets.push({ fighter: fighter, enemy: enemy });
    }

    addTarget(player, opponent);
    addTarget(opponent, player);

    for (i = 0; i < targets.length; i += 1) {
      item = targets[i];
      stats = item.fighter.stats;
      mods = styleStats(item.fighter, item.enemy);
      for (key in mods) {
        if (Object.prototype.hasOwnProperty.call(mods, key)) {
          changed.push({ stats: stats, key: key, value: stats[key] });
          stats[key] = clamp((Number(stats[key]) || 0) + mods[key], 1, 260);
        }
      }
    }

    try {
      return fn();
    } finally {
      for (i = changed.length - 1; i >= 0; i -= 1) {
        changed[i].stats[changed[i].key] = changed[i].value;
      }
    }
  }

  function matchupText(player, opponent) {
    var a = styleFor(player);
    var b = styleFor(opponent);
    var mod = chanceModifier(player, opponent);
    if (mod > 0) return a.label + " против " + b.label + ": +" + mod + "%";
    if (mod < 0) return a.label + " против " + b.label + ": " + mod + "%";
    return a.label + " против " + b.label + ": ровно";
  }

  window.FS.FightStyles = {
    definitions: DEFINITIONS.slice(),
    definition: definition,
    styleFor: styleFor,
    chanceModifier: chanceModifier,
    matchupModifier: matchupModifier,
    matchupText: matchupText,
    withTemporaryStyleStats: withTemporaryStyleStats,
    styleStats: styleStats
  };
}());
