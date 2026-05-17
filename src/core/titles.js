(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;

  function titleKey(typeId, countryId, weightClassId) {
    return [typeId, countryId || "world", weightClassId].join("|");
  }

  function definitions() {
    return [
      { id: "street_country", label: "Чемпион улицы", trackId: "street", scope: "country" },
      { id: "pro_world", label: "Чемпион мира", trackId: "pro", scope: "world" }
    ];
  }

  function removeAmateurTitles(state) {
    var key;
    var i;

    if (!state.titles) {
      return;
    }

    for (key in state.titles) {
      if (Object.prototype.hasOwnProperty.call(state.titles, key) && state.titles[key].trackId === "amateur") {
        delete state.titles[key];
      }
    }

    if (state.roster instanceof Array) {
      for (i = 0; i < state.roster.length; i += 1) {
        state.roster[i].titles = state.roster[i].titles instanceof Array ? state.roster[i].titles.filter(function (titleId) {
          return !!state.titles[titleId] && state.titles[titleId].trackId !== "amateur";
        }) : [];
      }
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
    var key;
    var ranking;
    var champion;

    if (!state.titles || typeof state.titles !== "object") {
      state.titles = {};
    }

    removeAmateurTitles(state);

    for (defIndex = 0; defIndex < defs.length; defIndex += 1) {
      def = defs[defIndex];

      for (weightIndex = 0; weightIndex < Data.weightClasses.length; weightIndex += 1) {
        weightClass = Data.weightClasses[weightIndex];

        if (def.scope === "world") {
          key = titleKey(def.id, "world", weightClass.id);
          if (!state.titles[key]) {
            ranking = window.FS.State.ranking(state, "world", def.trackId, weightClass.id);
            champion = ranking[0] || null;
            state.titles[key] = {
              id: key,
              typeId: def.id,
              label: def.label,
              countryId: "world",
              scope: "world",
              trackId: def.trackId,
              weightClassId: weightClass.id,
              championId: champion ? champion.id : "",
              defenses: 0,
              history: champion ? [{ week: state.week, fighterId: champion.id, text: champion.name + " стал первым обладателем: " + def.label }] : []
            };
            if (champion && champion.titles.indexOf(key) === -1) {
              champion.titles.push(key);
            }
          }
        } else {
          for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
            country = Data.countries[countryIndex];
            key = titleKey(def.id, country.id, weightClass.id);
            if (!state.titles[key]) {
              ranking = window.FS.State.ranking(state, country.id, def.trackId, weightClass.id);
              champion = ranking[0] || null;
              state.titles[key] = {
                id: key,
                typeId: def.id,
                label: def.label,
                countryId: country.id,
                scope: "country",
                trackId: def.trackId,
                weightClassId: weightClass.id,
                championId: champion ? champion.id : "",
                defenses: 0,
                history: champion ? [{ week: state.week, fighterId: champion.id, text: champion.name + " стал первым обладателем: " + def.label }] : []
              };
              if (champion && champion.titles.indexOf(key) === -1) {
                champion.titles.push(key);
              }
            }
          }
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

  function findTitle(state, typeId, countryId, weightClassId) {
    return state.titles[titleKey(typeId, countryId, weightClassId)] || null;
  }

  function fighterTitles(state, fighterId) {
    var result = [];
    var key;

    if (!state.titles) {
      return result;
    }

    for (key in state.titles) {
      if (Object.prototype.hasOwnProperty.call(state.titles, key) && state.titles[key].championId === fighterId && state.titles[key].trackId !== "amateur") {
        result.push(state.titles[key]);
      }
    }

    return result;
  }

  function transferTitle(state, titleId, newChampionId, text) {
    var title = state.titles ? state.titles[titleId] : null;
    var oldChampion;
    var newChampion;

    if (!title || title.trackId === "amateur") {
      return false;
    }

    oldChampion = U.getFighterById(state, title.championId);
    newChampion = U.getFighterById(state, newChampionId);

    if (!newChampion) {
      return false;
    }

    if (oldChampion) {
      oldChampion.titles = oldChampion.titles.filter(function (id) {
        return id !== title.id;
      });
    }

    title.championId = newChampion.id;
    title.defenses = 0;
    title.history.unshift({ week: state.week, fighterId: newChampion.id, text: text || (newChampion.name + " забрал титул: " + title.label) });

    if (newChampion.titles.indexOf(title.id) === -1) {
      newChampion.titles.push(title.id);
    }

    if (newChampion.careerLog) {
      newChampion.careerLog.unshift({ week: state.week, text: "Титул: " + title.label + "." });
    }

    if (window.FS.World && window.FS.World.createNews) {
      window.FS.World.createNews(state, "title", newChampion.name + " стал обладателем титула: " + title.label + " · " + U.findWeightClass(title.weightClassId).label + ".", { type: "title_change" });
    }

    return true;
  }

  function playerTitleChallenge(state, titleId) {
    var title = state.titles ? state.titles[titleId] : null;
    var p = window.FS.State.player(state);
    var ranking;
    var rankIndex;

    if (!title || !p || title.trackId === "amateur" || title.championId === p.id) {
      return { eligible: false, reason: "Ты уже чемпион или титул недоступен." };
    }

    if (p.trackId !== title.trackId || p.weightClassId !== title.weightClassId) {
      return { eligible: false, reason: "Нужны тот же путь и весовая категория." };
    }

    if (title.scope === "country" && p.countryId !== title.countryId) {
      return { eligible: false, reason: "Нужна та же страна для этого титула." };
    }

    ranking = window.FS.State.ranking(state, title.scope === "world" ? "world" : title.countryId, title.trackId, title.weightClassId);
    rankIndex = ranking.findIndex(function (fighter) {
      return fighter.id === p.id;
    });

    if (rankIndex < 0 || rankIndex > 2) {
      return { eligible: false, reason: "Для вызова нужно быть в топ-3 рейтинга." };
    }

    return { eligible: true, reason: "Можно бросить вызов чемпиону.", rank: rankIndex + 1 };
  }

  function updateTitles(state) {
    var key;
    var title;
    var ranking;
    var currentChampion;
    var challenger;

    ensureTitles(state);

    for (key in state.titles) {
      if (!Object.prototype.hasOwnProperty.call(state.titles, key)) {
        continue;
      }

      title = state.titles[key];

      if (title.trackId === "amateur") {
        continue;
      }

      ranking = window.FS.State.ranking(state, title.scope === "world" ? "world" : title.countryId, title.trackId, title.weightClassId);
      if (!ranking.length) {
        continue;
      }

      currentChampion = U.getFighterById(state, title.championId);
      challenger = ranking[0];

      if (!currentChampion || challenger.id !== title.championId && U.scoreFighter(challenger) > U.scoreFighter(currentChampion) + 8) {
        transferTitle(state, title.id, challenger.id, challenger.name + " забрал титул: " + title.label);
      } else if (currentChampion && state.week % 4 === 0) {
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

  window.FS.Titles = {
    ensureTitles: ensureTitles,
    updateTitles: updateTitles,
    findTitle: findTitle,
    transferTitle: transferTitle,
    playerTitleChallenge: playerTitleChallenge,
    fighterTitles: fighterTitles,
    listVisibleTitles: listVisibleTitles,
    normalizeFighterTitles: normalizeFighterTitles,
    removeAmateurTitles: removeAmateurTitles
  };
}());
