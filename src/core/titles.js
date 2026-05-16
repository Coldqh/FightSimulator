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
    fighterTitles: fighterTitles,
    listVisibleTitles: listVisibleTitles
  };
}());
