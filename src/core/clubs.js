(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;

  function ensureClubs(state) {
    var i;
    var j;
    var country;
    var gymName;
    var club;
    var existingById = {};

    if (!(state.clubs instanceof Array)) {
      state.clubs = [];
    }

    for (i = 0; i < state.clubs.length; i += 1) {
      existingById[state.clubs[i].id] = true;
    }

    for (i = 0; i < Data.countries.length; i += 1) {
      country = Data.countries[i];
      for (j = 0; j < country.gymNames.length; j += 1) {
        gymName = country.gymNames[j];
        club = {
          id: "club_" + country.id + "_" + j,
          name: gymName,
          countryId: country.id,
          level: 1 + (j % 4),
          rosterIds: []
        };
        if (!existingById[club.id]) {
          state.clubs.push(club);
        }
      }
    }

    assignFightersToClubs(state);
  }

  function assignFightersToClubs(state) {
    var clubsByCountry = {};
    var i;
    var club;
    var fighter;
    var countryClubs;
    var clubIndex;

    for (i = 0; i < state.clubs.length; i += 1) {
      state.clubs[i].rosterIds = [];
      if (!clubsByCountry[state.clubs[i].countryId]) {
        clubsByCountry[state.clubs[i].countryId] = [];
      }
      clubsByCountry[state.clubs[i].countryId].push(state.clubs[i]);
    }

    for (i = 0; i < state.roster.length; i += 1) {
      fighter = state.roster[i];
      countryClubs = clubsByCountry[fighter.countryId] || [];
      if (!countryClubs.length) {
        continue;
      }
      if (!fighter.gymId) {
        clubIndex = Math.abs((fighter.seed || i) + i) % countryClubs.length;
        fighter.gymId = countryClubs[clubIndex].id;
      }
      club = findClub(state, fighter.gymId);
      if (club && club.rosterIds.indexOf(fighter.id) === -1) {
        club.rosterIds.push(fighter.id);
      }
    }
  }

  function findClub(state, clubId) {
    var i;
    if (!(state.clubs instanceof Array)) {
      return null;
    }
    for (i = 0; i < state.clubs.length; i += 1) {
      if (state.clubs[i].id === clubId) {
        return state.clubs[i];
      }
    }
    return null;
  }

  function playerClub(state) {
    var p = window.FS.State.player(state);
    return p ? findClub(state, p.gymId) : null;
  }

  function movePlayerToClub(state, clubId) {
    var p = window.FS.State.player(state);
    var club = findClub(state, clubId);

    if (!p || !club || club.countryId !== p.countryId) {
      if (state) {
        state.feed = "Нельзя перейти в этот клуб.";
      }
      return false;
    }

    p.gymId = club.id;
    if (p.careerLog) {
      p.careerLog.unshift({ week: state.week, text: "Переход в клуб: " + club.name + "." });
    }
    assignFightersToClubs(state);
    state.feed = "Ты перешёл в клуб: " + club.name + ".";
    return true;
  }

  function chooseTrackedClubmate(state) {
    var p = window.FS.State.player(state);
    var club;
    var roster;

    if (!p) {
      return null;
    }

    if (!(state.trackedFighterIds instanceof Array)) {
      state.trackedFighterIds = [];
    }

    if (state.trackedFighterIds.length) {
      return U.getFighterById(state, state.trackedFighterIds[0]);
    }

    club = playerClub(state);
    if (!club) {
      return null;
    }

    roster = clubRoster(state, club.id).filter(function (fighter) {
      return !fighter.isPlayer && fighter.trackId === p.trackId;
    });

    if (!roster.length) {
      roster = clubRoster(state, club.id).filter(function (fighter) {
        return !fighter.isPlayer;
      });
    }

    if (roster.length) {
      roster[0].known = true;
      state.trackedFighterIds.push(roster[0].id);
      if (roster[0].careerLog) {
        roster[0].careerLog.unshift({ week: state.week, text: "Стал заметным одноклубником игрока." });
      }
      return roster[0];
    }

    return null;
  }

  function clubRoster(state, clubId) {
    var club = findClub(state, clubId);
    if (!club) {
      return [];
    }
    return club.rosterIds.map(function (id) {
      return U.getFighterById(state, id);
    }).filter(Boolean).sort(function (left, right) {
      return U.scoreFighter(right) - U.scoreFighter(left);
    });
  }

  window.FS.Clubs = {
    ensureClubs: ensureClubs,
    assignFightersToClubs: assignFightersToClubs,
    findClub: findClub,
    playerClub: playerClub,
    movePlayerToClub: movePlayerToClub,
    chooseTrackedClubmate: chooseTrackedClubmate,
    clubRoster: clubRoster
  };
}());
