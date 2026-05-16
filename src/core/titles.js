(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;

  function ensureTitles(state) {
    var i;
    var j;
    var k;
    var type;
    var country;
    var weightClass;
    var key;
    var ranking;
    var champion;

    if (!state.titles || typeof state.titles !== "object") {
      state.titles = {};
    }

    for (i = 0; i < Data.titleTypes.length; i += 1) {
      type = Data.titleTypes[i];
      for (j = 0; j < Data.countries.length; j += 1) {
        country = Data.countries[j];
        for (k = 0; k < Data.weightClasses.length; k += 1) {
          weightClass = Data.weightClasses[k];
          key = U.titleKey(type.id, country.id, weightClass.id);

          if (!state.titles[key]) {
            ranking = window.FS.State.ranking(state, country.id, type.trackId, weightClass.id);
            champion = ranking[0] || null;
            state.titles[key] = {
              id: key,
              typeId: type.id,
              label: type.label,
              countryId: country.id,
              trackId: type.trackId,
              weightClassId: weightClass.id,
              championId: champion ? champion.id : "",
              defenses: 0,
              history: champion ? [{ week: state.week, fighterId: champion.id, text: champion.name + " стал первым обладателем: " + type.label }] : []
            };
            if (champion && champion.titles.indexOf(key) === -1) {
              champion.titles.push(key);
            }
          }
        }
      }
    }
  }

  function findTitle(state, typeId, countryId, weightClassId) {
    return state.titles[U.titleKey(typeId, countryId, weightClassId)] || null;
  }

  function normalizeFighterTitles(state) {
    var i;
    var key;

    for (i = 0; i < state.roster.length; i += 1) {
      state.roster[i].titles = state.roster[i].titles instanceof Array ? state.roster[i].titles.filter(function (titleId) {
        return !!state.titles[titleId] && state.titles[titleId].championId === state.roster[i].id;
      }) : [];
    }

    for (key in state.titles) {
      if (Object.prototype.hasOwnProperty.call(state.titles, key) && state.titles[key].championId) {
        var champ = U.getFighterById(state, state.titles[key].championId);
        if (champ && champ.titles.indexOf(key) === -1) {
          champ.titles.push(key);
        }
      }
    }
  }

  function transferTitle(state, titleId, newChampionId, text) {
    var title = state.titles ? state.titles[titleId] : null;
    var oldChampion;
    var newChampion;

    if (!title) {
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

    if (!title || !p || title.championId === p.id) {
      return { eligible: false, reason: "Ты уже чемпион или титул недоступен." };
    }

    if (p.countryId !== title.countryId || p.trackId !== title.trackId || p.weightClassId !== title.weightClassId) {
      return { eligible: false, reason: "Нужны тот же путь, страна и весовая категория." };
    }

    ranking = window.FS.State.ranking(state, title.countryId, title.trackId, title.weightClassId);
    rankIndex = ranking.findIndex(function (fighter) {
      return fighter.id === p.id;
    });

    if (rankIndex < 0 || rankIndex > 2) {
      return { eligible: false, reason: "Для вызова нужно быть в топ-3 рейтинга." };
    }

    return { eligible: true, reason: "Можно бросить вызов чемпиону.", rank: rankIndex + 1 };
  }

  function fighterTitles(state, fighterId) {
    var result = [];
    var key;
    if (!state.titles) {
      return result;
    }
    for (key in state.titles) {
      if (Object.prototype.hasOwnProperty.call(state.titles, key) && state.titles[key].championId === fighterId) {
        result.push(state.titles[key]);
      }
    }
    return result;
  }

  function updateTitles(state) {
    normalizeFighterTitles(state);
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
      ranking = window.FS.State.ranking(state, title.countryId, title.trackId, title.weightClassId);
      if (!ranking.length) {
        continue;
      }
      currentChampion = U.getFighterById(state, title.championId);
      challenger = ranking[0];

      if (!currentChampion || challenger.id !== title.championId && U.scoreFighter(challenger) > U.scoreFighter(currentChampion) + 8) {
        if (currentChampion) {
          currentChampion.titles = currentChampion.titles.filter(function (id) { return id !== title.id; });
        }
        title.championId = challenger.id;
        title.defenses = 0;
        title.history.unshift({ week: state.week, fighterId: challenger.id, text: challenger.name + " забрал титул: " + title.label });
        if (challenger.titles.indexOf(title.id) === -1) {
          challenger.titles.push(title.id);
        }
        window.FS.World.createNews(state, "title", challenger.name + " стал обладателем титула: " + title.label + " · " + U.findWeightClass(title.weightClassId).label + ".", { type: "title_change" });
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
      if (Object.prototype.hasOwnProperty.call(state.titles, key) && state.titles[key].countryId === countryId) {
        result.push(state.titles[key]);
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
    normalizeFighterTitles: normalizeFighterTitles
  };
}());
