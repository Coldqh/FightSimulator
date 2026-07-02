(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var State = window.FS.State;
  var Data = window.FS.Data;

  function clamp(value, min, max) {
    value = Math.round(Number(value) || 0);
    return Math.max(min, Math.min(max, value));
  }

  function player(state) {
    return State && State.player ? State.player(state) : null;
  }

  function ensureState(state) {
    state.finalGoals = state.finalGoals && typeof state.finalGoals === "object" ? state.finalGoals : {};
    state.finalGoals.completed = state.finalGoals.completed instanceof Array ? state.finalGoals.completed : [];
    state.finalGoals.skipped = state.finalGoals.skipped instanceof Array ? state.finalGoals.skipped : [];
    state.finalGoals.currentId = state.finalGoals.currentId || "";
    return state.finalGoals;
  }

  function recordByTrack(fighter, trackId) {
    var empty = { wins: 0, losses: 0, draws: 0, kos: 0 };
    if (!fighter) return empty;
    if (fighter.trackRecords && fighter.trackRecords[trackId]) return fighter.trackRecords[trackId];
    if (fighter.trackId === trackId && fighter.record) return fighter.record;
    return empty;
  }

  function currentRecord(fighter) {
    return recordByTrack(fighter, fighter && fighter.trackId ? fighter.trackId : "amateur");
  }

  function hasId(list, id) {
    var i;
    for (i = 0; i < list.length; i += 1) if (list[i] && list[i].id === id) return true;
    return false;
  }

  function getDone(state, id) {
    var data = ensureState(state);
    return hasId(data.completed, id) || hasId(data.skipped, id);
  }

  function compById(id) {
    var list = Data && Data.amateurCompetitions instanceof Array ? Data.amateurCompetitions : [];
    var i;
    for (i = 0; i < list.length; i += 1) if (list[i] && list[i].id === id) return list[i];
    return null;
  }

  function competitionName(id) {
    var comp = compById(id);
    if (!comp) return id;
    if (id === "world") return "ЧМ";
    if (id === "olympiad") return "Олимпиаду";
    return comp.label || id;
  }

  function awardText(item) {
    return String((item && (item.label || item.text || item.title || item.name || item.awardLabel)) || "");
  }

  function awardMeta(item) {
    return (item && (item.meta || item)) || {};
  }

  function placeRankFromText(text) {
    if (/1\s*место|побед/i.test(text)) return 1;
    if (/2\s*место|сереб/i.test(text)) return 2;
    if (/3\s*место|бронз/i.test(text)) return 3;
    return 99;
  }

  function competitionBestPlace(state, compId) {
    var p = player(state);
    var sources = [];
    var best = 99;
    var i, item, meta, text;
    if (!p) return best;
    if (p.awards instanceof Array) sources = sources.concat(p.awards);
    if (p.careerLog instanceof Array) sources = sources.concat(p.careerLog);
    if (state.amateurPath && state.amateurPath.medals instanceof Array) sources = sources.concat(state.amateurPath.medals);
    for (i = 0; i < sources.length; i += 1) {
      item = sources[i];
      meta = awardMeta(item);
      text = awardText(item);
      if (meta.competitionId === compId || text.indexOf(competitionName(compId)) !== -1 || text.indexOf(compId) !== -1) {
        best = Math.min(best, placeRankFromText(text + " " + String(meta.place || "")));
      }
    }
    if (state.amateurPath && state.amateurPath.completed && state.amateurPath.completed[compId]) best = Math.min(best, 1);
    return best;
  }

  function rankingPosition(state, trackId) {
    var p = player(state);
    var list;
    var i;
    if (!p || !state || !(state.roster instanceof Array)) return 9999;
    list = state.roster.filter(function (fighter) {
      if (!fighter || fighter.dead || fighter.retired) return false;
      if (fighter.trackId !== trackId) return false;
      if (trackId !== "street" && fighter.weightClassId && p.weightClassId && fighter.weightClassId !== p.weightClassId) return false;
      return true;
    });
    list.sort(function (a, b) { return U.statAverage(b.stats) - U.statAverage(a.stats); });
    for (i = 0; i < list.length; i += 1) if (list[i] && list[i].id === p.id) return i + 1;
    return 9999;
  }

  function titleCount(state) {
    var p = player(state);
    var titles = state && state.titles ? state.titles : {};
    var count = 0;
    var key;
    if (!p) return 0;
    for (key in titles) {
      if (Object.prototype.hasOwnProperty.call(titles, key) && titles[key] && titles[key].championId === p.id) count += 1;
    }
    return count;
  }

  function commonGoals() {
    return [
      { id: "ovr_25", label: "Достичь OVR 25", type: "ovr", target: 25, rewardPoints: 1, rewardMoney: 50 },
      { id: "ovr_50", label: "Достичь OVR 50", type: "ovr", target: 50, rewardPoints: 2, rewardMoney: 100 },
      { id: "ovr_75", label: "Достичь OVR 75", type: "ovr", target: 75, rewardPoints: 3, rewardMoney: 200 },
      { id: "ovr_100", label: "Достичь OVR 100", type: "ovr", target: 100, rewardPoints: 4, rewardMoney: 400 },
      { id: "ovr_130", label: "Достичь OVR 130", type: "ovr", target: 130, rewardPoints: 5, rewardMoney: 700 },
      { id: "ovr_160", label: "Достичь OVR 160", type: "ovr", target: 160, rewardPoints: 6, rewardMoney: 1200 }
    ];
  }

  function amateurGoals() {
    var comps = ["city", "oblast", "region", "country", "continent", "world", "olympiad"];
    var goals = [
      { id: "am_wins_5", label: "Любители: 5 побед", type: "wins", trackId: "amateur", target: 5, rewardPoints: 2, rewardMoney: 100 },
      { id: "am_wins_15", label: "Любители: 15 побед", type: "wins", trackId: "amateur", target: 15, rewardPoints: 3, rewardMoney: 220 },
      { id: "am_ko_5", label: "Любители: 5 побед KO/TKO", type: "kos", trackId: "amateur", target: 5, rewardPoints: 3, rewardMoney: 260 }
    ];
    comps.forEach(function (id) {
      goals.push({ id: "am_" + id + "_top3", label: "Любители: топ-3 — " + competitionName(id), type: "amateur_place", competitionId: id, place: 3, rewardPoints: 3, rewardMoney: 250 });
      goals.push({ id: "am_" + id + "_win", label: "Любители: выиграть — " + competitionName(id), type: "amateur_place", competitionId: id, place: 1, rewardPoints: 5, rewardMoney: 500 });
    });
    return goals;
  }

  function streetGoals() {
    return [
      { id: "st_wins_10", label: "Улица: 10 побед", type: "wins", trackId: "street", target: 10, rewardPoints: 2, rewardMoney: 120 },
      { id: "st_wins_25", label: "Улица: 25 побед", type: "wins", trackId: "street", target: 25, rewardPoints: 3, rewardMoney: 280 },
      { id: "st_ko_10", label: "Улица: 10 KO/TKO", type: "kos", trackId: "street", target: 10, rewardPoints: 4, rewardMoney: 420 },
      { id: "st_rank_25", label: "Улица: войти в топ-25 рейтинга", type: "rank", trackId: "street", target: 25, rewardPoints: 3, rewardMoney: 350 },
      { id: "st_rank_10", label: "Улица: войти в топ-10 рейтинга", type: "rank", trackId: "street", target: 10, rewardPoints: 4, rewardMoney: 650 },
      { id: "st_rank_3", label: "Улица: топ-3 рейтинга", type: "rank", trackId: "street", target: 3, rewardPoints: 5, rewardMoney: 1000 },
      { id: "st_rank_1", label: "Улица: топ-1 рейтинга", type: "rank", trackId: "street", target: 1, rewardPoints: 8, rewardMoney: 1800 }
    ];
  }

  function proGoals() {
    return [
      { id: "pro_wins_5", label: "Профи: 5 побед", type: "wins", trackId: "pro", target: 5, rewardPoints: 2, rewardMoney: 300 },
      { id: "pro_wins_15", label: "Профи: 15 побед", type: "wins", trackId: "pro", target: 15, rewardPoints: 4, rewardMoney: 800 },
      { id: "pro_ko_10", label: "Профи: 10 KO/TKO", type: "kos", trackId: "pro", target: 10, rewardPoints: 5, rewardMoney: 1200 },
      { id: "pro_rank_25", label: "Профи: войти в топ-25", type: "rank", trackId: "pro", target: 25, rewardPoints: 4, rewardMoney: 1200 },
      { id: "pro_rank_10", label: "Профи: войти в топ-10", type: "rank", trackId: "pro", target: 10, rewardPoints: 5, rewardMoney: 2000 },
      { id: "pro_rank_3", label: "Профи: войти в топ-3", type: "rank", trackId: "pro", target: 3, rewardPoints: 6, rewardMoney: 3500 },
      { id: "pro_title_1", label: "Профи: выиграть первый титул", type: "titles", target: 1, rewardPoints: 7, rewardMoney: 5000 },
      { id: "pro_title_2", label: "Профи: выиграть второй титул", type: "titles", target: 2, rewardPoints: 8, rewardMoney: 8000 },
      { id: "pro_title_4", label: "Профи: собрать 4 титула", type: "titles", target: 4, rewardPoints: 12, rewardMoney: 15000 }
    ];
  }

  function sequence(state) {
    var p = player(state);
    var track = p ? p.trackId : "amateur";
    if (track === "street") return commonGoals().concat(streetGoals());
    if (track === "pro") return commonGoals().concat(proGoals());
    return commonGoals().concat(amateurGoals());
  }

  function goalProgress(state, goal) {
    var p = player(state);
    var record;
    var value = 0;
    var target = Number(goal.target) || 1;
    var comp;
    var rating;
    if (!p) return { value: 0, target: target, done: false, skipped: false, text: "0/" + target };
    if (goal.type === "ovr") {
      value = U.statAverage(p.stats);
      return { value: value, target: target, done: value >= target, skipped: false, text: value + "/" + target };
    }
    if (goal.type === "wins") {
      record = recordByTrack(p, goal.trackId);
      value = Number(record.wins) || 0;
      return { value: value, target: target, done: value >= target, skipped: false, text: Math.min(value, target) + "/" + target };
    }
    if (goal.type === "kos") {
      record = recordByTrack(p, goal.trackId);
      value = Number(record.kos) || 0;
      return { value: value, target: target, done: value >= target, skipped: false, text: Math.min(value, target) + "/" + target };
    }
    if (goal.type === "rank") {
      value = rankingPosition(state, goal.trackId);
      return { value: value, target: target, done: value <= target, skipped: false, text: value >= 9999 ? "нет в рейтинге" : ("#" + value + " / цель #" + target) };
    }
    if (goal.type === "titles") {
      value = titleCount(state);
      return { value: value, target: target, done: value >= target, skipped: false, text: Math.min(value, target) + "/" + target };
    }
    if (goal.type === "amateur_place") {
      value = competitionBestPlace(state, goal.competitionId);
      comp = compById(goal.competitionId);
      rating = U.statAverage(p.stats);
      if (comp && typeof comp.maxRating === "number" && rating > comp.maxRating && value > goal.place) {
        return { value: 0, target: 1, done: false, skipped: true, text: "OVR выше лимита" };
      }
      return { value: value, target: goal.place, done: value <= goal.place, skipped: false, text: value <= 3 ? ("лучшее место: " + value) : "нет результата" };
    }
    return { value: 0, target: 1, done: false, skipped: false, text: "—" };
  }

  function reward(state, goal) {
    var p = player(state);
    var points = Number(goal.rewardPoints) || 0;
    var money = Number(goal.rewardMoney) || 0;
    if (!p) return;
    if (points > 0) p.trainingPoints = (Number(p.trainingPoints) || 0) + points;
    if (money > 0) {
      if (State.addMoney) State.addMoney(state, money, "Цель: " + goal.label);
      else p.money = (Number(p.money) || 0) + money;
    }
    p.careerLog = p.careerLog instanceof Array ? p.careerLog : [];
    p.careerLog.unshift({ week: state.week, text: "Цель выполнена: " + goal.label + "." });
    if (p.careerLog.length > 80) p.careerLog.length = 80;
  }

  function mark(state, key, goal, reason) {
    var data = ensureState(state);
    var row = { id: goal.id, label: goal.label, week: state.week, rewardPoints: Number(goal.rewardPoints) || 0, rewardMoney: Number(goal.rewardMoney) || 0, reason: reason || "" };
    if (!hasId(data[key], goal.id)) data[key].unshift(row);
    if (data[key].length > 80) data[key].length = 80;
  }

  function advance(state) {
    var goals = sequence(state);
    var i;
    var progress;
    var changed = false;
    ensureState(state);
    for (i = 0; i < goals.length; i += 1) {
      if (getDone(state, goals[i].id)) continue;
      progress = goalProgress(state, goals[i]);
      if (progress.skipped) {
        mark(state, "skipped", goals[i], progress.text);
        changed = true;
        continue;
      }
      if (progress.done) {
        mark(state, "completed", goals[i], "done");
        reward(state, goals[i]);
        changed = true;
        continue;
      }
      state.finalGoals.currentId = goals[i].id;
      return { goal: goals[i], progress: progress, changed: changed };
    }
    state.finalGoals.currentId = "complete";
    return { goal: null, progress: null, changed: changed };
  }

  function current(state) {
    return advance(state);
  }

  window.FS.FinalObjectives = {
    ensure: ensureState,
    sequence: sequence,
    progress: goalProgress,
    advance: advance,
    current: current,
    rankingPosition: rankingPosition,
    titleCount: titleCount
  };
}());
