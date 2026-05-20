(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;

  function titleKey(typeId, countryId, weightClassId) {
    return [typeId, countryId || "world", weightClassId || "open"].join("|");
  }

  function definitions() {
    var defs = [{ id: "street_country", label: "Чемпион улицы", trackId: "street", scope: "country" }];
    var i;
    for (i = 0; i < Data.beltBodies.length; i += 1) {
      defs.push({
        id: "pro_world_" + Data.beltBodies[i].id,
        bodyId: Data.beltBodies[i].id,
        label: "Чемпион мира " + Data.beltBodies[i].label,
        trackId: "pro",
        scope: "world"
      });
    }
    return defs;
  }

  function removeAmateurTitles(state) {
    var key;
    var i;
    if (!state.titles) { return; }
    for (key in state.titles) {
      if (Object.prototype.hasOwnProperty.call(state.titles, key) && state.titles[key].trackId === "amateur") {
        delete state.titles[key];
      }
    }
    for (i = 0; i < state.roster.length; i += 1) {
      state.roster[i].titles = state.roster[i].titles instanceof Array ? state.roster[i].titles.filter(function (titleId) {
        return !!state.titles[titleId] && state.titles[titleId].trackId !== "amateur";
      }) : [];
    }
  }

  function ensureTitle(state, def, countryId, weightClassId, championOffset) {
    var key = titleKey(def.id, countryId, weightClassId);
    var ranking;
    var champion;

    if (state.titles[key]) {
      return;
    }

    ranking = window.FS.State.ranking(state, countryId || "world", def.trackId, weightClassId);
    champion = ranking[championOffset] || ranking[0] || null;

    state.titles[key] = {
      id: key,
      typeId: def.id,
      bodyId: def.bodyId || "",
      label: def.label,
      countryId: countryId || "world",
      scope: def.scope,
      trackId: def.trackId,
      weightClassId: weightClassId || "",
      championId: champion ? champion.id : "",
      defenses: 0,
      history: champion ? [{ week: state.week, fighterId: champion.id, text: champion.name + " стал обладателем: " + def.label }] : []
    };

    if (champion && champion.titles.indexOf(key) === -1) {
      champion.titles.push(key);
    }
  }

  function ensureTitles(state) {
    var defs = definitions();
    var defIndex;
    var countryIndex;
    var weightIndex;
    var def;
    var country;
    var weightClass;
    var proOffsetByWeight = {};

    if (!state.titles || typeof state.titles !== "object") {
      state.titles = {};
    }

    removeAmateurTitles(state);

    for (defIndex = 0; defIndex < defs.length; defIndex += 1) {
      def = defs[defIndex];

      if (def.trackId === "pro") {
        for (weightIndex = 0; weightIndex < Data.weightClasses.length; weightIndex += 1) {
          weightClass = Data.weightClasses[weightIndex];
          proOffsetByWeight[weightClass.id] = proOffsetByWeight[weightClass.id] || 0;
          ensureTitle(state, def, "world", weightClass.id, proOffsetByWeight[weightClass.id]);
          proOffsetByWeight[weightClass.id] += 1;
        }
      } else if (def.trackId === "street") {
        for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
          country = Data.countries[countryIndex];
          ensureTitle(state, def, country.id, "", 0);
        }
      }
    }

    normalizeFighterTitles(state);
  }

  function normalizeFighterTitles(state) {
    var i;
    var key;
    var champ;

    removeAmateurTitles(state);

    for (i = 0; i < state.roster.length; i += 1) {
      state.roster[i].titles = state.roster[i].titles instanceof Array ? state.roster[i].titles.filter(function (titleId) {
        return !!state.titles[titleId] && state.titles[titleId].championId === state.roster[i].id;
      }) : [];
    }

    for (key in state.titles) {
      if (Object.prototype.hasOwnProperty.call(state.titles, key) && state.titles[key].championId) {
        champ = U.getFighterById(state, state.titles[key].championId);
        if (champ && champ.titles.indexOf(key) === -1) {
          champ.titles.push(key);
        }
      }
    }
  }

  function fighterTitles(state, fighterId) {
    var result = [];
    var key;
    for (key in state.titles || {}) {
      if (Object.prototype.hasOwnProperty.call(state.titles, key) && state.titles[key].championId === fighterId && state.titles[key].trackId !== "amateur") {
        result.push(state.titles[key]);
      }
    }
    return result;
  }

  function transferTitle(state, titleId, newChampionId, text) {
    var title = state.titles ? state.titles[titleId] : null;
    var oldChampion = title ? U.getFighterById(state, title.championId) : null;
    var newChampion = U.getFighterById(state, newChampionId);

    if (!title || !newChampion || title.trackId === "amateur") {
      return false;
    }

    if (oldChampion) {
      oldChampion.titles = oldChampion.titles.filter(function (id) { return id !== title.id; });
      oldChampion.pastTitles = oldChampion.pastTitles instanceof Array ? oldChampion.pastTitles : [];
      oldChampion.pastTitles.unshift({
        titleId: title.id,
        label: title.label,
        bodyId: title.bodyId || "",
        weightClassId: title.weightClassId || "",
        fromWeek: title.currentChampionFromWeek || (title.history[0] ? title.history[0].week : state.week),
        toWeek: state.week
      });
      if (oldChampion.pastTitles.length > 30) { oldChampion.pastTitles.length = 30; }
    }

    title.championId = newChampion.id;
    title.currentChampionFromWeek = state.week;
    title.defenses = 0;
    title.history.unshift({ week: state.week, fighterId: newChampion.id, text: text || (newChampion.name + " забрал титул: " + title.label) });
    if (window.FS.World && window.FS.World.createNews) {
      var p = window.FS.State && window.FS.State.player ? window.FS.State.player(state) : null;
      if (p && ((title.trackId === "street" && title.countryId === p.countryId) || (title.trackId === "pro" && title.weightClassId === p.weightClassId))) {
        window.FS.World.createNews(state, "champion", "Сменился чемпион: " + title.label + " — " + newChampion.name + ".", { titleId: title.id, fighterId: newChampion.id });
      }
    }

    if (newChampion.titles.indexOf(title.id) === -1) {
      newChampion.titles.push(title.id);
    }

    normalizeFighterTitles(state);
    return true;
  }

  function unifyBeltsAfterFight(state, winnerId, loserId) {
    var key;
    var moved = 0;
    for (key in state.titles || {}) {
      if (Object.prototype.hasOwnProperty.call(state.titles, key) && state.titles[key].trackId === "pro" && state.titles[key].championId === loserId) {
        transferTitle(state, key, winnerId, "Объединение поясов: титул перешёл победителю.");
        moved += 1;
      }
    }
    return moved;
  }

  function playerTitleChallenge(state, titleId) {
    var title = state.titles ? state.titles[titleId] : null;
    var p = window.FS.State.player(state);
    var ranking;
    var rankIndex;
    if (!title || !p || title.trackId === "amateur" || title.championId === p.id) {
      return { eligible: false, reason: "Ты уже чемпион или титул недоступен." };
    }
    if (p.trackId !== title.trackId) {
      return { eligible: false, reason: "Нужен тот же путь." };
    }
    if (title.trackId === "pro" && p.weightClassId !== title.weightClassId) {
      return { eligible: false, reason: "Нужна та же весовая категория." };
    }
    ranking = window.FS.State.ranking(state, title.scope === "world" ? "world" : title.countryId, title.trackId, title.weightClassId);
    rankIndex = ranking.findIndex(function (fighter) { return fighter.id === p.id; });
    if (rankIndex < 0 || rankIndex > 2) {
      return { eligible: false, reason: "Для вызова нужно быть в топ-3 рейтинга." };
    }
    return { eligible: true, reason: "Можно бросить вызов чемпиону.", rank: rankIndex + 1 };
  }

  function titleCandidateKey(trackId, countryId, weightClassId) {
    return trackId + "|" + (trackId === "pro" ? "world" : countryId) + "|" + (weightClassId || "");
  }

  function addCandidate(tops, key, fighter) {
    var first;
    var second;
    var score;
    if (!fighter || fighter.retired || fighter.isPlayer) { return; }
    score = U.scoreFighter(fighter);
    tops[key] = tops[key] || [];
    first = tops[key][0];
    second = tops[key][1];

    if (!first || score > U.scoreFighter(first)) {
      tops[key][1] = first;
      tops[key][0] = fighter;
    } else if ((!second || score > U.scoreFighter(second)) && (!first || first.id !== fighter.id)) {
      tops[key][1] = fighter;
    }
  }

  function buildTitleTops(state) {
    var tops = {};
    var i;
    var fighter;
    for (i = 0; i < (state.roster || []).length; i += 1) {
      fighter = state.roster[i];
      if (!fighter || fighter.retired || fighter.trackId === "amateur") { continue; }
      if (fighter.trackId === "pro") {
        addCandidate(tops, titleCandidateKey("pro", "world", fighter.weightClassId), fighter);
      } else if (fighter.trackId === "street") {
        addCandidate(tops, titleCandidateKey("street", fighter.countryId, ""), fighter);
      }
    }
    return tops;
  }

  function updateTitles(state) {
    var key;
    var title;
    var tops;
    var candidates;
    var currentChampion;
    var challenger;

    ensureTitles(state);
    tops = buildTitleTops(state);

    for (key in state.titles) {
      if (!Object.prototype.hasOwnProperty.call(state.titles, key)) {
        continue;
      }

      title = state.titles[key];
      if (title.trackId === "amateur") {
        continue;
      }

      candidates = tops[titleCandidateKey(title.trackId, title.countryId, title.weightClassId)] || [];
      currentChampion = U.getFighterById(state, title.championId);
      challenger = candidates[0] && candidates[0].id !== title.championId ? candidates[0] : candidates[1];

      /* Автосмена чемпиона только если титул пустой. Дальше титулы меняются боями, а не магическим пересчётом OVR. */
      if (!currentChampion && challenger) {
        transferTitle(state, title.id, challenger.id, challenger.name + " стал чемпионом: " + title.label);
      } else if (currentChampion && state.week % 8 === 0) {
        title.defenses += 1;
      }
    }
  }

  function listVisibleTitles(state, countryId) {
    var result = [];
    var key;
    ensureTitles(state);
    for (key in state.titles) {
      if (Object.prototype.hasOwnProperty.call(state.titles, key) && state.titles[key].trackId !== "amateur") {
        if (state.titles[key].countryId === countryId || state.titles[key].countryId === "world") {
          result.push(state.titles[key]);
        }
      }
    }
    return result;
  }

  function fighterTitleHistory(state, fighterId) {
    var fighter = U.getFighterById(state, fighterId);
    var active = fighterTitles(state, fighterId).map(function (title) {
      return {
        active: true,
        label: title.label,
        bodyId: title.bodyId || "",
        weightClassId: title.weightClassId || "",
        fromWeek: title.currentChampionFromWeek || (title.history && title.history[0] ? title.history[0].week : 0),
        toWeek: 0
      };
    });
    var past = fighter && fighter.pastTitles instanceof Array ? fighter.pastTitles : [];
    return active.concat(past);
  }

  function titleCrownText(state, fighter) {
    var titles = fighterTitles(state, fighter.id);
    if (!titles.length) { return ""; }
    return titles.map(function (title) {
      return "👑" + (title.bodyId ? title.bodyId.toUpperCase() : "");
    }).join(" ");
  }

  window.FS.Titles = {
    ensureTitles: ensureTitles,
    updateTitles: updateTitles,
    transferTitle: transferTitle,
    unifyBeltsAfterFight: unifyBeltsAfterFight,
    playerTitleChallenge: playerTitleChallenge,
    fighterTitles: fighterTitles,
    listVisibleTitles: listVisibleTitles,
    normalizeFighterTitles: normalizeFighterTitles,
    removeAmateurTitles: removeAmateurTitles,
    titleCrownText: titleCrownText,
    fighterTitleHistory: fighterTitleHistory
  };
}());
