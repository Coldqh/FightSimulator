(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;

  function levelBand(level) {
    var bands = {
      1: { min: 0, max: 100, mod: 1.00 },
      2: { min: 20, max: 120, mod: 1.12 },
      3: { min: 40, max: 140, mod: 1.25 },
      4: { min: 60, max: 160, mod: 1.40 },
      5: { min: 80, max: 185, mod: 1.60 },
      6: { min: 100, max: 220, mod: 1.85 }
    };
    return bands[level] || bands[1];
  }

  function clubLabel(country, index) {
    var base = country.gymNames[index % country.gymNames.length] || (country.label + " Boxing Club");
    return base + " #" + (index + 1);
  }

  function ensureClubs(state) {
    var i, j, country, level, band, club, existingById = {};
    if (!(state.clubs instanceof Array)) { state.clubs = []; }
    for (i = 0; i < state.clubs.length; i += 1) { existingById[state.clubs[i].id] = true; }

    for (i = 0; i < Data.countries.length; i += 1) {
      country = Data.countries[i];
      for (j = 0; j < 80; j += 1) {
        level = 1 + Math.min(5, Math.floor(j / 14));
        band = levelBand(level);
        club = { id: "club_" + country.id + "_" + j, name: clubLabel(country, j), countryId: country.id, level: level, minOvr: band.min, maxOvr: band.max, trainingModifier: band.mod, coachName: (country.firstNames[j % country.firstNames.length] || "Coach") + " " + (country.lastNames[(j * 3) % country.lastNames.length] || "Trainer"), rosterIds: [] };
        if (!existingById[club.id]) { state.clubs.push(club); }
      }
    }
    assignFightersToClubs(state);
  }

  function findClub(state, clubId) {
    var i;
    if (!(state.clubs instanceof Array)) { return null; }
    for (i = 0; i < state.clubs.length; i += 1) { if (state.clubs[i].id === clubId) { return state.clubs[i]; } }
    return null;
  }

  function eligibleClubsForFighter(state, fighter, levelFilter) {
    var rating = U.statAverage(fighter.stats);
    return (state.clubs || []).filter(function (club) {
      return club.countryId === fighter.countryId && rating >= club.minOvr && rating <= club.maxOvr && (!levelFilter || club.level === levelFilter);
    }).sort(function (a, b) { return b.level - a.level || b.trainingModifier - a.trainingModifier; });
  }

  function assignFightersToClubs(state) {
    var i, club, fighter, eligible, fallback;
    for (i = 0; i < state.clubs.length; i += 1) { state.clubs[i].rosterIds = []; }
    for (i = 0; i < state.roster.length; i += 1) {
      fighter = state.roster[i];
      if (!fighter.gymId && !fighter.isPlayer) {
        eligible = eligibleClubsForFighter(state, fighter, null);
        fallback = (state.clubs || []).filter(function (c) { return c.countryId === fighter.countryId; });
        club = eligible.length ? eligible[Math.abs((fighter.seed || i) + i) % eligible.length] : fallback[Math.abs((fighter.seed || i) + i) % Math.max(1, fallback.length)];
        if (club) { fighter.gymId = club.id; }
      }
      club = findClub(state, fighter.gymId);
      if (club && club.rosterIds.indexOf(fighter.id) === -1) { club.rosterIds.push(fighter.id); }
    }
  }

  function maybeMoveNpcClubs(state) {
    var attempts = Math.min(120, Math.max(20, Math.floor(state.roster.length / 160)));
    var i, fighter, eligible, current;
    for (i = 0; i < attempts; i += 1) {
      fighter = state.roster[U.randomInt(0, state.roster.length - 1)];
      if (!fighter || fighter.isPlayer || U.randomInt(1, 100) > 16) { continue; }
      eligible = eligibleClubsForFighter(state, fighter, null);
      current = findClub(state, fighter.gymId);
      if (eligible.length && (!current || eligible[0].level > current.level || U.randomInt(1,100)<=25)) { fighter.gymId = eligible[0].id; }
    }
    assignFightersToClubs(state);
  }

  function playerClub(state) {
    var p = window.FS.State.player(state);
    return p ? findClub(state, p.gymId) : null;
  }

  function movePlayerToClub(state, clubId) {
    var p = window.FS.State.player(state);
    var club = findClub(state, clubId);
    var rating = p ? U.statAverage(p.stats) : 0;
    if (!p || !club || club.countryId !== p.countryId || rating < club.minOvr || rating > club.maxOvr) {
      state.feed = "Нельзя перейти в этот клуб.";
      return false;
    }
    p.gymId = club.id;
    p.careerLog.unshift({ week: state.week, text: "Переход в клуб: " + club.name + "." });
    assignFightersToClubs(state);
    state.feed = "Ты перешёл в клуб: " + club.name + ".";
    return true;
  }

  function leavePlayerClub(state) {
    var p = window.FS.State.player(state);
    if (!p) { return false; }
    p.gymId = "";
    assignFightersToClubs(state);
    state.feed = "Ты покинул клуб.";
    return true;
  }

  function clubRoster(state, clubId) {
    var club = findClub(state, clubId);
    if (!club) { return []; }
    return club.rosterIds.map(function (id) { return U.getFighterById(state, id); }).filter(Boolean).sort(function (left, right) { return U.scoreFighter(right) - U.scoreFighter(left); });
  }

  function strongestFighter(state, clubId) { return clubRoster(state, clubId)[0] || null; }

  window.FS.Clubs = { ensureClubs: ensureClubs, assignFightersToClubs: assignFightersToClubs, findClub: findClub, playerClub: playerClub, movePlayerToClub: movePlayerToClub, leavePlayerClub: leavePlayerClub, clubRoster: clubRoster, strongestFighter: strongestFighter, eligibleClubsForFighter: eligibleClubsForFighter, maybeMoveNpcClubs: maybeMoveNpcClubs, levelBand: levelBand };
}());
