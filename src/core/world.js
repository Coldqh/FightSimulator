(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;
  var State = window.FS.State;

  function createNews(state, tone, text, meta) {
    var allowed = ["club", "team", "tournament", "medal", "champion", "migration", "fight", "career"];
    var payload;
    var i;
    var week = Number(state && state.week) || 1;
    if (allowed.indexOf(tone || "") === -1) { return; }
    if (!text) { return; }

    if (week <= 1 && tone === "team" && /тренер/i.test(String(text)) && /сборн/i.test(String(text))) {
      return;
    }

    state.world = state.world || {};
    state.world.news = state.world.news instanceof Array ? state.world.news : [];
    payload = {
      week: state.week,
      tone: tone || "world",
      text: text,
      meta: meta || {}
    };
    for (i = 0; i < state.world.news.length; i += 1) {
      if (state.world.news[i] && state.world.news[i].week === payload.week && state.world.news[i].tone === payload.tone && state.world.news[i].text === payload.text) {
        return;
      }
    }
    U.pushLimited(state.world.news, {
      id: U.uid("news"),
      week: payload.week,
      tone: payload.tone,
      text: payload.text,
      meta: payload.meta
    }, 110);
  }

  function playerHomeCountryId(state) {
    var p = State.player(state);
    return p ? (p.homeCountryId || p.countryId) : "";
  }

  function pushNews(state, tone, text, meta) {
    createNews(state, tone, text, meta || {});
  }

  function migrationNewsForMove(state, fighter, fromCountryId, toCountryId) {
    var p = State.player(state);
    var playerCountryId;
    var playerHomeId;
    var fromCountry;
    var toCountry;
    var originCountry;

    if (!p || !fighter || fromCountryId === toCountryId) { return; }

    playerCountryId = p.countryId;
    playerHomeId = p.homeCountryId || p.countryId;
    fromCountry = U.findCountry(fromCountryId);
    toCountry = U.findCountry(toCountryId);
    originCountry = U.findCountry(fighter.originCountryId || fighter.homeCountryId || fromCountryId);

    if (toCountryId === playerCountryId && (fighter.originCountryId || fighter.homeCountryId || fromCountryId) !== playerCountryId) {
      pushNews(state, "migration", "Иностранец приехал: " + fighter.name + " · " + originCountry.label + " → " + toCountry.label + ".", { fighterId: fighter.id, fromCountryId: fromCountryId, toCountryId: toCountryId });
    } else if ((fighter.originCountryId || fighter.homeCountryId || fromCountryId) === playerHomeId && toCountryId !== playerHomeId) {
      pushNews(state, "migration", "Соотечественник уехал: " + fighter.name + " · " + fromCountry.label + " → " + toCountry.label + ".", { fighterId: fighter.id, fromCountryId: fromCountryId, toCountryId: toCountryId });
    }
  }

  function futureDateText(week) {
    var parts = State.dateParts ? State.dateParts({ week: week }) : { year: 1, monthLabel: "месяц", weekOfMonth: 1 };
    return "год " + parts.year + ", " + parts.monthLabel + ", " + parts.weekOfMonth + " неделя";
  }

  function samePlayerWeight(state, fighter) {
    var p = State.player(state);
    return p && fighter && (p.trackId === "street" || !p.weightClassId || fighter.weightClassId === p.weightClassId);
  }

  function continentLabelById(continentId) {
    var country = Data.countries.find(function (item) { return item.continentId === continentId; });
    return country ? country.continentLabel : "континента";
  }

  function competitionNewsLabel(comp, country, weight) {
    if (comp.id === "continent") { return "Чемпионат " + continentLabelById(country.continentId) + " · " + weight.label; }
    if (comp.id === "world") { return "Чемпионат мира · " + weight.label; }
    if (comp.id === "olympiad") { return "Олимпиада · " + weight.label; }
    return comp.label + " · " + country.label + " · " + weight.label;
  }

  function tournamentNewsLabel(state, kind) {
    var p = State.player(state);
    var country = p ? U.findCountry(p.homeCountryId || p.countryId) : Data.countries[0];
    var weight = p && p.weightClassId ? U.findWeightClass(p.weightClassId).label : "вес";
    if (kind === "country") { return "Чемпионат страны · " + country.label + " · " + weight; }
    if (kind === "continent") { return "Чемпионат континента · " + country.continentLabel + " · " + weight; }
    if (kind === "world") { return "Чемпионат мира · " + weight; }
    return "Олимпиада · " + weight;
  }

  function autonomousMedalLabel(comp, place) {
    if (place === "1 место") { return "Победитель · " + comp.label; }
    if (place === "2 место") { return "Серебро · " + comp.label; }
    if (place === "3 место") { return "Бронза · " + comp.label; }
    return comp.label + " · " + place;
  }

  function medalTypeForPlace(place) {
    if (place === "1 место") { return "gold"; }
    if (place === "2 место") { return "silver"; }
    if (place === "3 место") { return "bronze"; }
    return "";
  }

  function compScheduledThisWeek(state, comp) {
    return window.FS.Amateur && window.FS.Amateur.availableCompetitions ?
      (function () {
        var w = Math.max(1, Number(state.week) || 1);
        var idx = (w - 1) % 96;
        if (comp.schedule === "city") { return idx % 8 === 1; }
        if (comp.schedule === "oblast") { return idx % 12 === 3; }
        if (comp.schedule === "region") { return idx % 16 === 5; }
        if (comp.schedule === "country") { return idx % 24 === 7; }
        if (comp.schedule === "continent") { return idx % 48 === 11; }
        if (comp.schedule === "world") { return idx % 96 === 17; }
        if (comp.schedule === "olympiad") { return idx % 96 === 29; }
        return false;
      }()) : false;
  }

  function awardNpcTournament(state, fighter, comp, place) {
    var label;
    if (!fighter || fighter.isPlayer || fighter.retired) { return; }
    label = autonomousMedalLabel(comp, place);
    if (State.addFighterAward) {
      State.addFighterAward(state, fighter, label, "amateur", { medal: medalTypeForPlace(place), competitionId: comp.id, place: place });
    }
    fighter.careerLog = fighter.careerLog instanceof Array ? fighter.careerLog : [];
    fighter.careerLog.unshift({ week: state.week, text: label + ".", meta: { competitionId: comp.id, place: place } });
    if (fighter.careerLog.length > 8) { fighter.careerLog.length = 8; }
  }

  function simulateAutonomousTournaments(state) {
    var comps = Data.amateurCompetitions || [];
    var scheduled = comps.filter(function (comp) { return compScheduledThisWeek(state, comp); });
    var buckets = {};
    var teamSet = {};
    var i, fighter, key, comp, country, weight, pool, winners, countryIndex, weightIndex, continentIds, continentId;
    var p = State.player(state);
    var playerHomeCountry = p ? U.findCountry(p.homeCountryId || p.countryId) : null;

    if (!scheduled.length) { return; }

    if (state.world && state.world.teamsByCountry) {
      Object.keys(state.world.teamsByCountry).forEach(function (countryId) {
        var team = state.world.teamsByCountry[countryId] || {};
        (team.main || []).forEach(function (id) { teamSet[id] = true; });
      });
    }

    for (i = 0; i < state.roster.length; i += 1) {
      fighter = state.roster[i];
      if (!fighter || fighter.retired || fighter.trackId !== "amateur" || !fighter.weightClassId || fighter.isPlayer) { continue; }
      key = fighter.countryId + "|" + fighter.weightClassId;
      buckets[key] = buckets[key] || [];
      buckets[key].push(fighter);
      if (buckets[key].length > 52) {
        buckets[key].sort(function (left, right) { return U.statAverage(right.stats) - U.statAverage(left.stats); });
        buckets[key].length = 40;
      }
    }

    Object.keys(buckets).forEach(function (bucketKey) {
      buckets[bucketKey].sort(function (left, right) {
        return U.statAverage(right.stats) - U.statAverage(left.stats) + U.randomInt(-2, 2);
      });
      if (buckets[bucketKey].length > 40) { buckets[bucketKey].length = 40; }
    });

    function awardAndNews(comp, country, weight, candidates) {
      pool = candidates.filter(function (item) {
        var rating = U.statAverage(item.stats);
        return rating >= comp.minRating && rating <= comp.maxRating;
      });
      winners = pool.slice(0, 3);
      if (winners[0]) { awardNpcTournament(state, winners[0], comp, "1 место"); growNpcAfterFight(winners[0], null, { isTournamentWin: true, isTournamentFinal: true, round: 3 }); }
      if (winners[1]) { awardNpcTournament(state, winners[1], comp, "2 место"); }
      if (winners[2]) { awardNpcTournament(state, winners[2], comp, "3 место"); }

      if (p && p.weightClassId === weight.id && winners[0]) {
        if ((["city", "oblast", "region", "country"].indexOf(comp.id) !== -1 && country.id === p.countryId) ||
            (comp.id === "continent" && playerHomeCountry && country.continentId === playerHomeCountry.continentId) ||
            (["world", "olympiad"].indexOf(comp.id) !== -1)) {
          pushNews(state, "tournament", competitionNewsLabel(comp, country, weight) + ": 1 — " + winners[0].name + (winners[1] ? ", 2 — " + winners[1].name : "") + (winners[2] ? ", 3 — " + winners[2].name : "") + ".", {
            competitionId: comp.id,
            fighterIds: winners.map(function (f) { return f.id; }),
            firstId: winners[0].id,
            secondId: winners[1] ? winners[1].id : "",
            thirdId: winners[2] ? winners[2].id : ""
          });
        }
      }
    }

    for (i = 0; i < scheduled.length; i += 1) {
      comp = scheduled[i];

      if (["city", "oblast", "region", "country"].indexOf(comp.id) !== -1) {
        for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
          country = Data.countries[countryIndex];
          for (weightIndex = 0; weightIndex < Data.weightClasses.length; weightIndex += 1) {
            weight = Data.weightClasses[weightIndex];
            awardAndNews(comp, country, weight, buckets[country.id + "|" + weight.id] || []);
          }
        }
      } else if (comp.id === "continent") {
        continentIds = Array.from(new Set(Data.countries.map(function (item) { return item.continentId; })));
        for (countryIndex = 0; countryIndex < continentIds.length; countryIndex += 1) {
          continentId = continentIds[countryIndex];
          country = Data.countries.find(function (item) { return item.continentId === continentId; }) || Data.countries[0];
          for (weightIndex = 0; weightIndex < Data.weightClasses.length; weightIndex += 1) {
            weight = Data.weightClasses[weightIndex];
            pool = [];
            Object.keys(buckets).forEach(function (bucketKey) {
              var bucketCountry = U.findCountry(bucketKey.split("|")[0]);
              if (bucketCountry.continentId === continentId && bucketKey.split("|")[1] === weight.id) {
                pool = pool.concat(buckets[bucketKey]);
              }
            });
            awardAndNews(comp, country, weight, pool);
          }
        }
      } else {
        for (weightIndex = 0; weightIndex < Data.weightClasses.length; weightIndex += 1) {
          weight = Data.weightClasses[weightIndex];
          pool = [];
          Object.keys(buckets).forEach(function (bucketKey) {
            if (bucketKey.split("|")[1] === weight.id) { pool = pool.concat(buckets[bucketKey]); }
          });
          if (comp.id === "world" || comp.id === "olympiad") {
            pool = pool.filter(function (item) { return teamSet[item.id]; });
          }
          awardAndNews(comp, Data.countries[0], weight, pool.sort(function (left, right) { return U.statAverage(right.stats) - U.statAverage(left.stats); }));
        }
      }
    }
  }

  function simulateTournamentNews(state) {
    return;
  }

  function scheduleTournamentNotice(state) {
    var p = State.player(state);
    var comps;
    var next;
    if (!p || p.trackId !== "amateur" || !window.FS.Amateur || !window.FS.Amateur.availableCompetitions) { return; }
    if (state.modal && state.modal.type && state.modal.type !== "patchNotes") { return; }

    comps = window.FS.Amateur.availableCompetitions(state).filter(function (comp) {
      return comp.available;
    }).sort(function (a, b) {
      return (b.rewardRating || 0) - (a.rewardRating || 0);
    });

    next = comps[0];
    if (!next) { return; }

    if (state.world.lastAvailableTournamentNoticeWeek === state.week &&
        state.world.lastAvailableTournamentNoticeCompetitionId === next.id) {
      return;
    }

    state.world.lastAvailableTournamentNoticeWeek = state.week;
    state.world.lastAvailableTournamentNoticeCompetitionId = next.id;
    state.modal = { type: "tournamentAvailable", competitionId: next.id, label: next.label, scheduleText: next.scheduleText };
  }

  function handleScheduledTournamentStart(state) {
    var invite = state.world && state.world.pendingTournamentInvite;
    if (!invite || invite.dueWeek !== state.week || invite.ignored) { return; }
    if (invite.accepted && window.FS.Amateur && window.FS.Amateur.startTournament) {
      state.modal = window.FS.Amateur.startTournament(state, invite.competitionId);
      state.world.pendingTournamentInvite = null;
    }
  }

  function handleProFightDue(state) {
    var p = State.player(state);
    var opponent;
    if (!p || p.trackId !== "pro" || !p.contractOpponentId || state.week < p.nextFightWeek) { return; }
    opponent = U.getFighterById(state, p.contractOpponentId);
    state.world.pendingProFight = { opponentId: p.contractOpponentId, week: state.week };
    state.modal = { type: "proContractPreview", opponentId: p.contractOpponentId, opponentName: opponent ? opponent.name : "Соперник", week: state.week };
  }

  function shuffleList(list) {
    var copy = list.slice();
    var i, j, tmp;
    for (i = copy.length - 1; i > 0; i -= 1) {
      j = U.randomInt(0, i);
      tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
    }
    return copy;
  }

  function rememberOpponent(fighter, opponentId) {
    fighter.recentOpponentIds = fighter.recentOpponentIds instanceof Array ? fighter.recentOpponentIds : [];
    fighter.recentOpponentIds.unshift(opponentId);
    if (fighter.recentOpponentIds.length > 8) { fighter.recentOpponentIds.length = 8; }
  }

  function findCloseOpponent(state, sourceFighter) {
    var recent = sourceFighter.recentOpponentIds instanceof Array ? sourceFighter.recentOpponentIds : [];
    var pool = state.roster.filter(function (fighter) {
      return fighter.id !== sourceFighter.id &&
        !fighter.isPlayer && !fighter.retired && recent.indexOf(fighter.id) === -1 &&
        fighter.trackId === sourceFighter.trackId &&
        (sourceFighter.trackId === "pro" || fighter.countryId === sourceFighter.countryId) &&
        (sourceFighter.trackId === "street" || fighter.weightClassId === sourceFighter.weightClassId);
    });
    if (!pool.length) {
      pool = state.roster.filter(function (fighter) {
        return fighter.id !== sourceFighter.id && !fighter.isPlayer && !fighter.retired &&
          fighter.trackId === sourceFighter.trackId &&
          (sourceFighter.trackId === "pro" || fighter.countryId === sourceFighter.countryId) &&
          (sourceFighter.trackId === "street" || fighter.weightClassId === sourceFighter.weightClassId);
      });
    }
    pool.sort(function (left, right) {
      return Math.abs(U.scoreFighter(left) - U.scoreFighter(sourceFighter)) - Math.abs(U.scoreFighter(right) - U.scoreFighter(sourceFighter));
    });
    return pool[U.randomInt(0, Math.min(9, pool.length - 1))] || pool[0] || null;
  }

  function logNpcCareer(fighter, text, week, meta) {
    fighter.careerLog = fighter.careerLog instanceof Array ? fighter.careerLog : [];
    fighter.careerLog.unshift({ week: week, text: text, meta: meta || {} });
    if (fighter.careerLog.length > 8) { fighter.careerLog.length = 8; }
  }

  function ageGrowthFactor(fighter) {
    var age = Number(fighter && fighter.age) || 24;
    if (age <= 20) { return 1.45; }
    if (age <= 24) { return 1.22; }
    if (age <= 28) { return 1.0; }
    if (age <= 32) { return 0.82; }
    if (age <= 35) { return 0.58; }
    if (age <= 38) { return 0.32; }
    return -0.45;
  }

  function lossStreak(fighter) {
    var losses = 0;
    var log = fighter && fighter.careerLog instanceof Array ? fighter.careerLog : [];
    var i;
    for (i = 0; i < log.length; i += 1) {
      if (!log[i] || !log[i].text) { continue; }
      if (log[i].text.indexOf("Поражение") === 0) { losses += 1; }
      else if (log[i].text.indexOf("Ничья") === 0) { break; }
      else { break; }
    }
    return losses;
  }

  function winStreak(fighter) {
    var wins = 0;
    var log = fighter && fighter.careerLog instanceof Array ? fighter.careerLog : [];
    var i;
    for (i = 0; i < log.length; i += 1) {
      if (!log[i] || !log[i].text) { continue; }
      if (log[i].text.indexOf("Победа") === 0 || log[i].text.indexOf("Турнир:") === 0) { wins += 1; }
      else if (log[i].text.indexOf("Ничья") === 0) { break; }
      else { break; }
    }
    return wins;
  }

  function adjustFighterStat(fighter, amount) {
    var keys = ["power", "technique", "speed", "stamina", "defense"];
    var cap = U.findTrack(fighter.trackId).maxStat;
    var floor = fighter.trackId === "pro" ? 35 : (fighter.trackId === "amateur" ? 8 : 2);
    var steps = Math.max(1, Math.round(Math.abs(amount)));
    var i;
    var key;
    for (i = 0; i < steps; i += 1) {
      key = keys[U.randomInt(0, keys.length - 1)];
      fighter.stats[key] = U.clamp((Number(fighter.stats[key]) || 1) + (amount >= 0 ? 1 : -1), floor, cap);
    }
    State.updateDerivedFighterFields(fighter);
  }

  function agingAdjustment(fighter) {
    var factor = ageGrowthFactor(fighter);
    if (factor >= 0) { return; }
    if (U.randomInt(1, 100) <= Math.round(Math.abs(factor) * 35)) {
      adjustFighterStat(fighter, -1);
    }
  }

  function growFighterStat(fighter, amount) {
    var factor;
    var scaled;
    if (!fighter || fighter.retired) { return; }
    factor = ageGrowthFactor(fighter);
    if (factor < 0) {
      agingAdjustment(fighter);
      return;
    }
    scaled = Math.max(0, Math.round((Number(amount) || 0) * factor));
    if (scaled <= 0) { return; }
    adjustFighterStat(fighter, scaled);
  }

  function growNpcAfterFight(winner, loser, meta) {
    var winBonus = 1;
    var lossBonus = 0;
    var info = meta || {};
    if (winner && !winner.isPlayer) {
      if (info.ko && info.round <= 2) { winBonus += 1; }
      if (info.isTournamentFinal) { winBonus += 1; }
      if (info.isTournamentWin) { winBonus += 1; }
      if (winStreak(winner) >= 3) { winBonus += 1; }
      growFighterStat(winner, winBonus);
    }
    if (loser && !loser.isPlayer) {
      if (lossStreak(loser) >= 3) { lossBonus += 1; }
      if (info.ko && info.round <= 2) { lossBonus += 1; }
      if ((Number(loser.age) || 0) >= 35 && (info.ko || lossBonus > 0)) { lossBonus += 1; }
      if (lossBonus > 0) { adjustFighterStat(loser, -lossBonus); }
      else { growFighterStat(loser, 1); }
    }
  }

  function resolveNpcFight(state, a, b) {
    var aScore = U.scoreFighter(a);
    var bScore = U.scoreFighter(b);
    var aChance = U.clamp(50 + Math.round((aScore - bScore) * 2.1), 12, 88);
    var roll = U.randomInt(1, 100);
    var winner;
    var loser;
    var draw = Math.abs(aScore - bScore) <= 2 && U.randomInt(1, 100) <= 7;
    var ko;
    var finishRound = 0;
    rememberOpponent(a, b.id);
    rememberOpponent(b, a.id);
    if (draw) {
      a.record.draws += 1;
      b.record.draws += 1;
      growNpcAfterFight(a, b, { draw: true });
      logNpcCareer(a, "Ничья с " + b.name + " решением.", state.week, { fighterId: b.id });
      logNpcCareer(b, "Ничья с " + a.name + " решением.", state.week, { fighterId: a.id });
      a.lastFightWeek = state.week;
      b.lastFightWeek = state.week;
      if (State.recordFighterFormEvent) {
        State.recordFighterFormEvent(a, "Ничья", state.week);
        State.recordFighterFormEvent(b, "Ничья", state.week);
      }
      if (window.FS.Clubs && window.FS.Clubs.recordClubFight) { window.FS.Clubs.recordClubFight(state, a, b, true); }
      state._rankingDirty = true;
      return { type: "draw", text: a.name + " и " + b.name + " завершили бой вничью.", fighterIds: [a.id, b.id] };
    }
    if (roll <= aChance) { winner = a; loser = b; } else { winner = b; loser = a; }
    ko = U.randomInt(1, 100) <= (winner.trackId === "street" ? U.randomInt(50, 90) : (winner.trackId === "pro" ? U.randomInt(40, 80) : U.randomInt(10, 30)));
    finishRound = ko ? U.randomInt(1, Math.max(1, U.findTrack(winner.trackId).rounds || 3)) : 0;
    winner.record.wins += 1;
    loser.record.losses += 1;
    if (ko) { winner.record.kos += 1; }
    growNpcAfterFight(winner, loser, { ko: ko, round: finishRound, isTournamentWin: false, isTournamentFinal: false });
    logNpcCareer(winner, "Победа над " + loser.name + (ko ? " KO/TKO." : " решением."), state.week, { fighterId: loser.id });
    logNpcCareer(loser, "Поражение от " + winner.name + (ko ? " KO/TKO." : " решением."), state.week, { fighterId: winner.id });
    winner.lastFightWeek = state.week;
    loser.lastFightWeek = state.week;
    if (State.recordFighterFormEvent) {
      State.recordFighterFormEvent(winner, "Победа", state.week);
      State.recordFighterFormEvent(loser, "Поражение", state.week);
    }
    if (winner.trackRecords) { winner.trackRecords[winner.trackId] = State.cloneRecord(winner.record); }
    if (loser.trackRecords) { loser.trackRecords[loser.trackId] = State.cloneRecord(loser.record); }
    State.updateDerivedFighterFields(winner);
    State.updateDerivedFighterFields(loser);
    if (window.FS.Clubs && window.FS.Clubs.recordClubFight) { window.FS.Clubs.recordClubFight(state, winner, loser, false); }
    state._rankingDirty = true;
    return { type: "win", winner: winner.id, loser: loser.id, text: winner.name + " победил " + loser.name + (ko ? " KO/TKO." : " решением судей."), fighterIds: [winner.id, loser.id] };
  }

  function simulateNpcTraining(state) {
    var keys = ["power", "technique", "speed", "stamina", "defense"];
    var roster = state.roster || [];
    var sampleLimit = roster.length > 8000 ? 520 : (roster.length > 5000 ? 760 : Math.min(roster.length, 1400));
    var start = roster.length > sampleLimit ? ((state.week * 997) % roster.length) : 0;
    var i, index, fighter, key, cap, seed, factor, growthChance;
    for (i = 0; i < sampleLimit; i += 1) {
      index = roster.length ? (start + i) % roster.length : 0;
      fighter = roster[index];
      if (!fighter || fighter.isPlayer || fighter.retired) { continue; }
      seed = Math.abs((fighter.seed || index * 37) + state.week * 13);
      factor = ageGrowthFactor(fighter);
      if (factor < 0) { if (seed % 18 === 0) { agingAdjustment(fighter); } continue; }
      growthChance = factor >= 1.4 ? 5 : (factor >= 1.2 ? 7 : (factor >= 1.0 ? 9 : 13));
      if (seed % growthChance !== 0) { continue; }
      key = keys[seed % keys.length];
      cap = Math.min(200, U.findTrack(fighter.trackId).maxStat || 200);
      fighter.stats[key] = U.clamp((Number(fighter.stats[key]) || 1) + 1, 1, cap);
      State.updateDerivedFighterFields(fighter);
    }
  }

  function contractDelay(fighter) {
    var titles = fighter.titles ? fighter.titles.length : 0;
    var rating = U.statAverage(fighter.stats);
    if (titles > 0) { return U.randomInt(10, 15); }
    if (rating >= 155 || fighter.record.wins >= 22) { return U.randomInt(7, 11); }
    if (rating >= 120 || fighter.record.wins >= 10) { return U.randomInt(4, 8); }
    return U.randomInt(2, 5);
  }

  function findProContractOpponent(state, fighter, weightPool) {
    var pool = weightPool || [];
    var index = -1;
    var candidates = [];
    var radius;
    var left;
    var right;
    var item;
    var i;

    if (!pool.length) {
      for (i = 0; i < (state.roster || []).length; i += 1) {
        item = state.roster[i];
        if (item && !item.isPlayer && item.id !== fighter.id && item.trackId === "pro" && item.weightClassId === fighter.weightClassId && state.week - (item.lastFightWeek || 0) >= 2) {
          candidates.push(item);
        }
      }
      if (!candidates.length) { return null; }
      candidates.sort(function (a, b) {
        return Math.abs(U.scoreFighter(a) - U.scoreFighter(fighter)) - Math.abs(U.scoreFighter(b) - U.scoreFighter(fighter));
      });
      return candidates[U.randomInt(0, Math.min(6, candidates.length - 1))] || candidates[0];
    }

    for (i = 0; i < pool.length; i += 1) {
      if (pool[i].id === fighter.id) { index = i; break; }
    }
    if (index < 0) { index = Math.floor(pool.length / 2); }

    for (radius = 1; radius < pool.length && candidates.length < 12; radius += 1) {
      left = pool[index - radius];
      right = pool[index + radius];
      if (left && left.id !== fighter.id && state.week - (left.lastFightWeek || 0) >= 2) { candidates.push(left); }
      if (right && right.id !== fighter.id && state.week - (right.lastFightWeek || 0) >= 2) { candidates.push(right); }
    }

    if (!candidates.length) { return null; }
    return candidates[U.randomInt(0, Math.min(6, candidates.length - 1))] || candidates[0];
  }

  function scheduleProContract(state, fighter, weightPool) {
    var opponent = findProContractOpponent(state, fighter, weightPool);
    if (!opponent) { return false; }
    fighter.contractOpponentId = opponent.id;
    fighter.nextFightWeek = state.week + contractDelay(fighter);
    fighter.contractLabel = "Контракт на бой через " + (fighter.nextFightWeek - state.week) + " нед.";
    return true;
  }

  function processProContracts(state) {
    var pros = [], proBuckets = {}, report = [];
    var i, fighter, opponent, result, bucketKey, scheduled = 0;
    var roster = state.roster || [];
    var sampleLimit = roster.length > 8000 ? 720 : (roster.length > 5000 ? 980 : Math.min(roster.length, 1800));
    var start = roster.length > sampleLimit ? ((state.week * 977) % roster.length) : 0;
    var index;
    for (i = 0; i < sampleLimit; i += 1) {
      index = roster.length ? (start + i) % roster.length : 0;
      fighter = roster[index];
      if (!fighter || fighter.isPlayer || fighter.trackId !== "pro") { continue; }
      pros.push(fighter);
      bucketKey = fighter.weightClassId || "open";
      proBuckets[bucketKey] = proBuckets[bucketKey] || [];
      if (proBuckets[bucketKey].length < 90) { proBuckets[bucketKey].push(fighter); }
    }
    Object.keys(proBuckets).forEach(function (key) { proBuckets[key].sort(function (a, b) { return U.scoreFighter(a) - U.scoreFighter(b); }); });
    for (i = 0; i < pros.length; i += 1) {
      fighter = pros[i]; bucketKey = fighter.weightClassId || "open";
      if (!fighter.nextFightWeek || !fighter.contractOpponentId) {
        if (scheduled < 16 && U.randomInt(1, 100) <= 8) { if (scheduleProContract(state, fighter, proBuckets[bucketKey])) { scheduled += 1; } }
        continue;
      }
      if (fighter.nextFightWeek <= state.week) {
        opponent = U.getFighterById(state, fighter.contractOpponentId);
        if (opponent && opponent.trackId === "pro") {
          result = resolveNpcFight(state, fighter, opponent);
          report.push(result.text);
          if (result.type === "win" && window.FS.Titles && window.FS.Titles.unifyBeltsAfterFight) { window.FS.Titles.unifyBeltsAfterFight(state, result.winner, result.loser); }
        }
        fighter.contractOpponentId = ""; fighter.nextFightWeek = 0; fighter.contractLabel = "";
        scheduleProContract(state, fighter, proBuckets[bucketKey]);
      }
    }
    return report;
  }

  function simulateNpcFights(state) {
    var report = [];
    var roster = state.roster || [];
    var sampleLimit = roster.length > 8000 ? 520 : (roster.length > 5000 ? 760 : Math.min(roster.length, 1400));
    var start = roster.length > sampleLimit ? ((state.week * 1231) % roster.length) : 0;
    var due = [], buckets = {}, key, i, index, bucket, a, b, result, maxPairs = 0, fighter;
    for (i = 0; i < sampleLimit; i += 1) {
      index = roster.length ? (start + i) % roster.length : 0;
      fighter = roster[index];
      if (!fighter || fighter.isPlayer || fighter.trackId === "pro" || fighter.retired || state.week - (fighter.lastFightWeek || 0) < 3) { continue; }
      due.push(fighter);
    }
    for (i = 0; i < due.length; i += 1) {
      key = due[i].trackId + "|" + due[i].countryId + "|" + (due[i].trackId === "street" ? "open" : due[i].weightClassId);
      buckets[key] = buckets[key] || [];
      if (buckets[key].length < 12) { buckets[key].push(due[i]); }
    }
    for (key in buckets) {
      if (!Object.prototype.hasOwnProperty.call(buckets, key)) { continue; }
      bucket = shuffleList(buckets[key]);
      maxPairs = Math.min(Math.floor(bucket.length / 2), roster.length > 7000 ? 12 : 24);
      for (i = 0; i < maxPairs; i += 1) {
        a = bucket[i * 2]; b = bucket[i * 2 + 1];
        if (!a || !b) { continue; }
        result = resolveNpcFight(state, a, b);
        if (result.type === "win" && window.FS.Titles && window.FS.Titles.unifyBeltsAfterFight) { window.FS.Titles.unifyBeltsAfterFight(state, result.winner, result.loser); }
        if (report.length < 8) { report.push(result.text); }
      }
    }
    if (state.week % 2 === 0) { report = report.concat(processProContracts(state).slice(0, 8 - report.length)); }
    return report;
  }

  function canMoveToTrack(fighter, targetTrackId) {
    var rating = U.statAverage(fighter.stats);
    if (fighter.trackId === targetTrackId) { return false; }
    if (targetTrackId === "amateur" && rating > 100) { return false; }
    if (targetTrackId === "street" && rating > 150) { return false; }
    if (targetTrackId === "pro" && rating < 90) { return false; }
    if (fighter.trackId === "pro" && targetTrackId === "amateur") { return false; }
    if (fighter.proClosed && targetTrackId === "pro") { return false; }
    return true;
  }

  function tryMoveFighter(state, fighter, targetTrackId, reason) {
    if (!canMoveToTrack(fighter, targetTrackId)) {
      return false;
    }

    if (!State.switchFighterTrack(state, fighter, targetTrackId, reason)) {
      return false;
    }

    U.pushLimited(state.world.transitionLog, {
      id: U.uid("move"),
      week: state.week,
      fighterId: fighter.id,
      text: fighter.name + ": " + reason
    }, 70);

    createNews(state, "migration", fighter.name + ": " + reason, { type: "track_move" });
    return true;
  }

  function simulateTransitions(state) {
    var roster = state.roster || [];
    var sampleLimit = roster.length > 8000 ? 900 : (roster.length > 5000 ? 1300 : roster.length);
    var start = roster.length > sampleLimit ? ((state.week * 571) % roster.length) : 0;
    var attempts = Math.min(8, sampleLimit);
    var i, index, fighter, rating;

    for (i = 0; i < attempts; i += 1) {
      index = roster.length ? (start + U.randomInt(0, sampleLimit - 1)) % roster.length : 0;
      fighter = roster[index];
      if (!fighter || fighter.isPlayer || state.week - (fighter.lastMoveWeek || 1) < 5) { continue; }
      rating = U.statAverage(fighter.stats);
      if (fighter.trackId === "street" && rating >= 43 && U.randomInt(1, 100) <= 14) {
        tryMoveFighter(state, fighter, "amateur", "перешёл с улицы в любители");
      } else if (fighter.trackId === "amateur" && rating >= 58 && U.randomInt(1, 100) <= 12) {
        tryMoveFighter(state, fighter, "pro", "подписал первый профессиональный контракт");
      } else if (fighter.trackId === "pro" && fighter.record.losses >= fighter.record.wins + 4 && U.randomInt(1, 100) <= 10) {
        tryMoveFighter(state, fighter, "street", "сорвался из профи на улицу");
      }
    }
  }

  function nationalCoachBaseOvr(country) {
    var tierMap = {
      cuba: 96, usa: 94, mexico: 93, russia: 92, kazakhstan: 90, uzbekistan: 90,
      ukraine: 86, japan: 84, united_kingdom: 84, gb: 84, ireland: 82, philippines: 82,
      germany: 78, france: 78, italy: 76, poland: 76, brazil: 74, thailand: 74,
      turkey: 72, azerbaijan: 72, armenia: 70, south_korea: 70, korea: 70,
      china: 68, georgia: 66, australia: 66, argentina: 66, spain: 66,
      canada: 64, netherlands: 64, mongolia: 64, morocco: 64, serbia: 62, croatia: 62,
      algeria: 62, nigeria: 62, india: 62, greece: 60, sweden: 60, norway: 58,
      denmark: 58, south_africa: 58, finland: 56
    };
    if (tierMap[country.id] != null) { return tierMap[country.id]; }
    if (country.continentId === "Europe") { return 60; }
    if (country.continentId === "Asia") { return 58; }
    if (country.continentId === "North America") { return 58; }
    if (country.continentId === "South America") { return 56; }
    if (country.continentId === "Africa") { return 54; }
    return 50;
  }

  function createNationalCoach(country, seed) {
    var record = { wins: U.randomInt(20, 180), losses: U.randomInt(5, 70), draws: U.randomInt(0, 12), kos: U.randomInt(8, 95) };
    var base = nationalCoachBaseOvr(country);
    var delta = U.randomInt(2, 4) * (U.randomInt(0, 1) ? 1 : -1);
    var ovr = U.clamp(base + delta, 35, 99);
    function stat(offset) { return U.clamp(ovr + U.randomInt(-4, 4) + offset, 1, 100); }
    return {
      id: "team_coach_" + country.id + "_" + seed,
      role: "teamCoach",
      name: U.createName(country, seed),
      countryId: country.id,
      currentCountryId: country.id,
      homeCountryId: country.id,
      originCountryId: country.id,
      age: U.randomInt(42, 72),
      record: record,
      stats: { technique: stat(0), conditioning: stat(-2), tactics: stat(3), corner: stat(1), development: stat(-1) },
      ovr: ovr,
      baseOvr: base,
      teamCoachTierVersion: "team-coach-v3",
      hiredWeek: seed,
      careerLog: [{ week: 1, text: "Назначен тренером сборной " + country.label + "." }]
    };
  }

  function ensureNationalCoach(state, country) {
    state.world.teamCoaches = state.world.teamCoaches || {};
    var current = state.world.teamCoaches[country.id];
    var oldScale = current && current.stats && Object.keys(current.stats).some(function (key) { return Number(current.stats[key]) > 100; });
    var brokenHundred = current && Number(current.ovr) >= 100 && nationalCoachBaseOvr(country) < 96;
    var oldTier = current && current.teamCoachTierVersion !== "team-coach-v3";

    if (!current || oldTier || brokenHundred || (Number(current.ovr) || 0) <= 1 || !current.stats || oldScale || (state.week > 1 && state.week % 52 === 1 && U.randomInt(1, 100) <= 16)) {
      current = createNationalCoach(country, state.week * 100 + country.id.length);
      state.world.teamCoaches[country.id] = current;
      U.pushLimited(state.world.transitionLog, { week: state.week, text: "Сборная " + country.label + " получила нового тренера: " + current.name + " · OVR " + current.ovr + "." }, 120);
      createNews(state, "team", "Сборная " + country.label + " получила нового тренера: " + current.name + " · OVR " + current.ovr + ".", { coachId: current.id, countryId: country.id });
    } else {
      current.ovr = U.clamp(Math.round(Number(current.ovr) || nationalCoachBaseOvr(country)), 1, 99);
      current.baseOvr = current.baseOvr || nationalCoachBaseOvr(country);
      current.teamCoachTierVersion = "team-coach-v3";
      current.record = current.record || { wins: 0, losses: 0, draws: 0, kos: 0 };
      current.record.kos = Number(current.record.kos) || 0;
      current.stats = current.stats || {};
      current.stats.technique = U.clamp(Number(current.stats.technique) || current.ovr, 1, 100);
      current.stats.conditioning = U.clamp(Number(current.stats.conditioning) || current.ovr, 1, 100);
      current.stats.tactics = U.clamp(Number(current.stats.tactics) || current.ovr, 1, 100);
      current.stats.corner = U.clamp(Number(current.stats.corner) || current.ovr, 1, 100);
      current.stats.development = U.clamp(Number(current.stats.development) || current.ovr, 1, 100);
    }
    return current;
  }

  function buildNationalTeams(state) {
    var teams = {};
    var buckets = {};
    var countryIndex;
    var weightIndex;
    var i;
    var fighter;
    var key;
    var country;
    var weight;
    var pool;
    var main;
    var reserve;
    var p = State.player(state);
    var previous = state.world && state.world.teamsByCountry ? state.world.teamsByCountry : {};
    var playerHome = p ? (p.homeCountryId || p.countryId) : "";
    var previousRole = "";
    var newRole = "";

    if (!state.world) { state.world = {}; }
    state.world.nationalTeamQualification = state.world.nationalTeamQualification || {};
    state.world.reserveAdditions = state.world.reserveAdditions || {};
    state.world.teamCoaches = state.world.teamCoaches || {};

    if (p && previous[playerHome]) {
      if ((previous[playerHome].main || []).indexOf(p.id) !== -1) { previousRole = "main"; }
      else if ((previous[playerHome].reserve || []).indexOf(p.id) !== -1) { previousRole = "reserve"; }
    }

    for (i = 0; i < (state.roster || []).length; i += 1) {
      fighter = state.roster[i];
      if (!fighter || fighter.retired || fighter.trackId !== "amateur" || !fighter.weightClassId) { continue; }
      key = (fighter.homeCountryId || fighter.originCountryId || fighter.countryId) + "|" + fighter.weightClassId;
      if (!buckets[key]) { buckets[key] = []; }
      buckets[key].push(fighter);
    }

    Object.keys(buckets).forEach(function (bucketKey) {
      buckets[bucketKey].sort(function (left, right) { return U.statAverage(right.stats) - U.statAverage(left.stats); });
    });

    for (countryIndex = 0; countryIndex < Data.countries.length; countryIndex += 1) {
      country = Data.countries[countryIndex];
      main = [];
      reserve = [];

      for (weightIndex = 0; weightIndex < Data.weightClasses.length; weightIndex += 1) {
        weight = Data.weightClasses[weightIndex];
        pool = (buckets[country.id + "|" + weight.id] || []).slice();
        if (p && p.trackId === "amateur" && (p.homeCountryId || p.countryId) === country.id && p.weightClassId === weight.id && pool.indexOf(p) === -1) {
          pool.push(p);
          pool.sort(function (left, right) { return U.statAverage(right.stats) - U.statAverage(left.stats); });
        }
        main = main.concat(pool.slice(0, 2).map(function (item) { return item.id; }));
        reserve = reserve.concat(pool.slice(2, 10).map(function (item) { return item.id; }));
      }

      teams[country.id] = {
        main: Array.from(new Set(main)).slice(0, 12),
        reserve: Array.from(new Set(reserve.filter(function (id) { return main.indexOf(id) === -1; }))).slice(0, 48),
        coach: ensureNationalCoach(state, country)
      };
    }

    state.world.teamsByCountry = teams;

    if (p && playerHome && teams[playerHome]) {
      if ((teams[playerHome].main || []).indexOf(p.id) !== -1) { newRole = "main"; }
      else if ((teams[playerHome].reserve || []).indexOf(p.id) !== -1) { newRole = "reserve"; }

      if (newRole && newRole !== previousRole) {
        if (newRole === "main") {
          pushNews(state, "team", "Тебя взяли в основу сборной " + U.findCountry(playerHome).label + ".", { fighterId: p.id, countryId: playerHome, role: "main" });
          p.careerLog = p.careerLog instanceof Array ? p.careerLog : [];
          p.careerLog.unshift({ week: state.week, text: "Вызван в основу сборной " + U.findCountry(playerHome).label + ".", meta: { countryId: playerHome } });
        } else if (newRole === "reserve") {
          pushNews(state, "team", "Тебя взяли в резерв сборной " + U.findCountry(playerHome).label + ".", { fighterId: p.id, countryId: playerHome, role: "reserve" });
          p.careerLog = p.careerLog instanceof Array ? p.careerLog : [];
          p.careerLog.unshift({ week: state.week, text: "Вызван в резерв сборной " + U.findCountry(playerHome).label + ".", meta: { countryId: playerHome } });
        }
      }
    }

    state.world.lastNationalTeamBuildWeek = state.week;
  }

  function buildOfferOpponent(state, index) {
    var p = State.player(state);
    var difficulty = Data.offerDifficulties[index] || Data.offerDifficulties[1];
    var targetScore = U.scoreFighter(p) + difficulty.offset;
    var candidates = state.roster.filter(function (fighter) {
      return !fighter.isPlayer &&
        fighter.countryId === p.countryId &&
        fighter.trackId === p.trackId &&
        fighter.weightClassId === p.weightClassId;
    });

    candidates.sort(function (left, right) {
      return Math.abs(U.scoreFighter(left) - targetScore) - Math.abs(U.scoreFighter(right) - targetScore);
    });

    if (!candidates[index]) {
      candidates[index] = State.createFighter(p.countryId, p.trackId, 9000 + state.week * 10 + index, U.statAverage(p.stats) + difficulty.offset, {
        weightClassId: p.weightClassId,
        gymId: p.gymId
      });
      state.roster.push(candidates[index]);
      if (window.FS.Clubs) {
        window.FS.Clubs.assignFightersToClubs(state);
      }
    }

    return candidates[index];
  }

  function announceRematchOffers(state) {
    var offers = state.offers instanceof Array ? state.offers : [];
    var p = State.player(state);
    var rivalries = state.world && state.world.playerRivalries ? state.world.playerRivalries : {};
    var i;
    var offer;
    var opponent;
    var rivalry;

    if (!p || !window.FS.Matchmaking) { return; }

    for (i = 0; i < offers.length; i += 1) {
      offer = offers[i];
      if (!offer || !offer.isRematch || !offer.opponentId) { continue; }

      rivalry = rivalries[offer.opponentId];
      if (!rivalry || rivalry.rematchAnnouncedWeek === state.week) { continue; }

      opponent = U.getFighterById(state, offer.opponentId);
      if (!opponent) { continue; }

      rivalry.rematchAnnouncedWeek = state.week;
      createNews(state, "fight", "Доступен реванш: " + p.name + " — " + opponent.name + ". Счёт серии " + (rivalry.playerWins || 0) + "-" + (rivalry.opponentWins || 0) + "-" + (rivalry.draws || 0) + ".", {
        fighterId: p.id,
        opponentId: opponent.id,
        firstId: p.id,
        secondId: opponent.id
      });

      if (window.FS.Clubs && window.FS.Clubs.rememberPlayerRival) {
        window.FS.Clubs.rememberPlayerRival(state, opponent, "Реванш доступен · счёт " + (rivalry.playerWins || 0) + "-" + (rivalry.opponentWins || 0) + "-" + (rivalry.draws || 0));
      }
    }
  }

  function refreshOffers(state) {
    var competitionOffers = (state.offers || []).filter(function (offer) {
      return offer.isCompetition;
    });

    if (window.FS.Matchmaking && window.FS.Matchmaking.buildPlayerOffers) {
      state.offers = window.FS.Matchmaking.buildPlayerOffers(state).concat(competitionOffers);
      announceRematchOffers(state);
      return;
    }

    var p = State.player(state);
    var labelsByTrack = {
      amateur: ["Любительский бой", "Бой городского уровня", "Матч отбора"],
      street: ["Дворовый бой", "Районный вызов", "Бой на местной площадке"],
      pro: ["Профессиональный андеркард", "Контрактный бой", "Главный бой вечера"]
    };
    var track = U.findTrack(p.trackId);
    var i;
    var opponent;
    var difficulty;
    var normalOffers = [];

    for (i = 0; i < 3; i += 1) {
      difficulty = Data.offerDifficulties[i] || Data.offerDifficulties[1];
      opponent = buildOfferOpponent(state, i);

      normalOffers.push({
        id: U.uid("offer"),
        label: labelsByTrack[p.trackId][i],
        difficultyId: difficulty.id,
        opponentId: opponent.id,
        rounds: track.rounds,
        purse: Math.max(0, Math.round((track.basePurse + i * Math.round(track.basePurse * 0.35)) * difficulty.purseMul)),
        risk: Math.max(1, U.statAverage(opponent.stats) - U.statAverage(p.stats) + 50)
      });
    }

    state.offers = normalOffers.concat(competitionOffers);
    announceRematchOffers(state);
  }

  function retireFighter(state, fighter, reason) {
    if (!fighter || fighter.isPlayer || fighter.retired) { return false; }
    fighter.retired = true;
    fighter.retiredWeek = state.week;
    fighter.retiredReason = reason || "завершил карьеру";
    fighter.memorial = { name: fighter.name, record: State.cloneRecord(fighter.record), trackId: fighter.trackId, countryId: fighter.countryId, retiredWeek: state.week, reason: fighter.retiredReason };
    fighter.careerLog.unshift({ week: state.week, text: "Завершил карьеру: " + fighter.retiredReason + "." });
    return true;
  }

  function createYoungFighter(state, countryId, trackId, index) {
    var base = trackId === "pro" ? U.randomInt(90, 105) : (trackId === "street" ? U.randomInt(0, 35) : U.randomInt(0, 22));
    var weightClassId = trackId === "street" ? "" : Data.weightClasses[U.randomInt(0, Data.weightClasses.length - 1)].id;
    var f = State.createFighter(countryId, trackId, 800000 + state.week * 1000 + index, base, { age: U.randomInt(18, 22), weightClassId: weightClassId });
    state.roster.push(f);
    return f;
  }

  function simulateRetirementsAndNewFighters(state) {
    var i, fighter, rating, chance, created = 0, parts = State.dateParts(state), needsDirty = false;
    var roster = state.roster || [];
    var sampleLimit = roster.length > 8000 ? 900 : (roster.length > 5000 ? 1300 : roster.length);
    var start = roster.length > sampleLimit ? ((state.week * 883) % roster.length) : 0;
    var index, young;

    for (i = 0; i < sampleLimit; i += 1) {
      index = roster.length ? (start + i) % roster.length : 0;
      fighter = roster[index];
      if (!fighter || fighter.isPlayer || fighter.retired) { continue; }
      if (fighter.birthMonth === parts.month && fighter.birthWeek === parts.weekOfMonth) { fighter.age += 1; }
      rating = U.statAverage(fighter.stats);
      if (fighter.trackId === "amateur" && fighter.age > 30) {
        if (rating >= 90) { tryMoveFighter(state, fighter, "pro", "перерос любители и ушёл в профи"); }
        else { tryMoveFighter(state, fighter, "street", "перерос любители и ушёл на улицу"); }
        needsDirty = true;
        continue;
      }
      chance = fighter.age >= 40 ? 7 : (fighter.age >= 36 ? 3 : (fighter.age >= 32 ? 1 : 0));
      if (chance && U.randomInt(1, 1000) <= chance) { retireFighter(state, fighter, "возраст"); needsDirty = true; }
    }

    if (parts.weekOfMonth === 1 && roster.length < 9000) {
      for (i = 0; i < Data.countries.length; i += 2) {
        young = createYoungFighter(state, Data.countries[(i + state.week) % Data.countries.length].id, "amateur", created++);
        young.gymId = "";
        young = createYoungFighter(state, Data.countries[(i + state.week) % Data.countries.length].id, "street", created++);
        young.gymId = "";
      }
      for (i = 0; i < Math.min(4, Data.weightClasses.length); i += 1) {
        young = createYoungFighter(state, Data.countries[(i + state.week) % Data.countries.length].id, "pro", created++);
        young.weightClassId = Data.weightClasses[(i + state.week) % Data.weightClasses.length].id;
      }
      needsDirty = true;
    }

    if (needsDirty) { state._rankingDirty = true; state._coachRecordsDirty = true; }
  }


function simulateInternationalGymMoves(state) {
    var attempts = Math.min(24, Math.max(4, Math.floor((state.roster || []).length / 700)));
    var clubsByCountry = {}, i, fighter, currentCountry, targetCountries, targetCountry, targetClubs, rating, club, oldClub, oldCountry, moved = false;
    if (!window.FS.Clubs || !state.clubs || !state.clubs.length) { return; }
    for (i = 0; i < state.clubs.length; i += 1) {
      club = state.clubs[i];
      clubsByCountry[club.countryId] = clubsByCountry[club.countryId] || [];
      clubsByCountry[club.countryId].push(club);
    }
    targetCountries = Data.countries;
    for (i = 0; i < attempts; i += 1) {
      fighter = state.roster[U.randomInt(0, state.roster.length - 1)];
      if (!fighter || fighter.isPlayer || fighter.retired || U.randomInt(1, 1000) > 4) { continue; }
      currentCountry = fighter.countryId;
      targetCountry = targetCountries[U.randomInt(0, targetCountries.length - 1)];
      if (!targetCountry || targetCountry.id === currentCountry) { continue; }
      rating = U.statAverage(fighter.stats);
      targetClubs = (clubsByCountry[targetCountry.id] || []).filter(function (item) { return rating >= item.minOvr && rating <= item.maxOvr; });
      if (!targetClubs.length) { targetClubs = clubsByCountry[targetCountry.id] || []; }
      club = targetClubs[U.randomInt(0, Math.max(0, targetClubs.length - 1))];
      if (!club) { continue; }
      oldCountry = U.findCountry(currentCountry);
      oldClub = fighter.gymId && window.FS.Clubs ? window.FS.Clubs.findClub(state, fighter.gymId) : null;
      if (oldClub && oldClub.rosterIds instanceof Array) { oldClub.rosterIds = oldClub.rosterIds.filter(function (id) { return id !== fighter.id; }); }
      fighter.countryId = targetCountry.id; fighter.currentCountryId = targetCountry.id;
      fighter.homeCountryId = fighter.homeCountryId || fighter.originCountryId || currentCountry;
      fighter.originCountryId = fighter.originCountryId || fighter.homeCountryId || currentCountry;
      fighter.gymId = club.id;
      fighter.coachId = club.coach && club.coach.id ? club.coach.id : ((club.coaches && club.coaches[0]) ? club.coaches[0].id : "");
      fighter.isForeignResident = (fighter.originCountryId || fighter.homeCountryId || currentCountry) !== targetCountry.id;
      fighter.careerLog = fighter.careerLog instanceof Array ? fighter.careerLog : [];
      fighter.careerLog.unshift({ week: state.week, text: "Переезд: " + oldCountry.label + " → " + targetCountry.label + ", клуб " + club.name + ".", meta: { fromCountryId: oldCountry.id, toCountryId: targetCountry.id, oldClubId: oldClub ? oldClub.id : "", clubId: club.id } });
      if (fighter.careerLog.length > 12) { fighter.careerLog.length = 12; }
      club.rosterIds = club.rosterIds instanceof Array ? club.rosterIds : [];
      if (club.rosterIds.indexOf(fighter.id) === -1) { club.rosterIds.push(fighter.id); }
      U.pushLimited(state.world.transitionLog, { week: state.week, fighterId: fighter.id, text: fighter.name + " переехал: " + oldCountry.label + " → " + targetCountry.label + "." }, 120);
      migrationNewsForMove(state, fighter, currentCountry, targetCountry.id);
      moved = true;
    }
    if (moved) { state._rankingDirty = true; state._coachRecordsDirty = true; }
  }

  function promoterById(id) {
    var promoters = Data.promoters || [];
    return promoters.find(function (item) { return item.id === id; }) || promoters[0] || { id: "local_hall", label: "Local Hall Promotions", cut: 0.1, purseMul: 1, weeksMin: 4, weeksMax: 8 };
  }

  function recordTotal(fighter) {
    var record = fighter.record || {};
    return (Number(record.wins) || 0) + (Number(record.losses) || 0) + (Number(record.draws) || 0);
  }

  function recordWinRate(fighter) {
    var record = fighter.record || {};
    var total = recordTotal(fighter);
    return total ? ((Number(record.wins) || 0) / total) : 0;
  }

  function recordSimilarityPenalty(player, fighter) {
    return Math.abs(recordTotal(player) - recordTotal(fighter)) * 0.55 + Math.abs(recordWinRate(player) - recordWinRate(fighter)) * 24;
  }

  function proContractWaitWeeks(player, isChampion) {
    var rating = U.statAverage(player.stats);
    if (isChampion) { return U.randomInt(10, 12); }
    if (rating >= 170) { return U.randomInt(8, 9); }
    if (rating >= 145) { return U.randomInt(7, 8); }
    if (rating >= 120) { return U.randomInt(5, 6); }
    if (rating >= 100) { return U.randomInt(4, 5); }
    return U.randomInt(3, 4);
  }

  function proContractType(player, opponent) {
    var diff = U.statAverage(opponent.stats) - U.statAverage(player.stats);
    if (diff >= 20) { return "рискованный рейтинговый бой"; }
    if (diff >= 8) { return "бой с сильным соперником"; }
    if (diff <= -15) { return "разминочный бой"; }
    return "ровный контрактный бой";
  }

  function proContractPurse(player, opponent, promoter) {
    var ovr = U.statAverage(opponent.stats);
    var base = 600 + ovr * 18;
    return Math.round(base * (promoter.purseMul || 1));
  }

  function buildProContracts(state) {
    var p = State.player(state);
    var promoter;
    var ranking;
    var fullRanking;
    var playerRank;
    var contracts = [];
    var i;
    var opponent;
    var weeks;
    var purse;
    var type;
    var targetCount;
    var isChampion;
    var start;
    var end;

    if (!p || p.trackId !== "pro") {
      state.world.proContracts = [];
      return [];
    }

    if (p.contractOpponentId && p.nextFightWeek >= state.week) {
      state.world.proContracts = [];
      return [];
    }

    promoter = promoterById(p.promoterId);
    isChampion = window.FS.Titles && window.FS.Titles.fighterTitles(state, p.id).some(function (title) {
      return title.trackId === "pro" && title.weightClassId === p.weightClassId;
    });

    fullRanking = State.ranking(state, "world", "pro", p.weightClassId);
    playerRank = Math.max(1, fullRanking.findIndex(function (fighter) { return fighter.id === p.id; }) + 1);

    ranking = fullRanking.filter(function (fighter) {
      return !fighter.isPlayer && !fighter.retired;
    });

    if (isChampion) {
      ranking = ranking.slice(0, 3);
    } else {
      start = Math.max(0, playerRank - 8);
      end = Math.min(ranking.length, playerRank + 8);
      ranking = ranking.slice(start, end);
      if (ranking.length < 5) {
        ranking = fullRanking.filter(function (fighter) {
          return !fighter.isPlayer && !fighter.retired;
        }).slice(Math.max(0, playerRank - 12), playerRank + 12);
      }
      ranking.sort(function (a, b) {
        var aPos = fullRanking.indexOf(a);
        var bPos = fullRanking.indexOf(b);
        var aScore = Math.abs(aPos - playerRank) * 1.8 + Math.abs(U.statAverage(a.stats) - U.statAverage(p.stats)) * 0.22 + recordSimilarityPenalty(p, a) * 0.35;
        var bScore = Math.abs(bPos - playerRank) * 1.8 + Math.abs(U.statAverage(b.stats) - U.statAverage(p.stats)) * 0.22 + recordSimilarityPenalty(p, b) * 0.35;
        return aScore - bScore;
      });
    }

    targetCount = isChampion ? Math.min(3, ranking.length) : Math.min(ranking.length, U.randomInt(5, 10));

    for (i = 0; i < targetCount; i += 1) {
      opponent = ranking[i];
      if (!opponent) { continue; }
      weeks = proContractWaitWeeks(p, isChampion);
      purse = proContractPurse(p, opponent, promoter);
      type = isChampion ? "защита титула против топ-3" : proContractType(p, opponent);
      contracts.push({
        id: U.uid("contract"),
        weekCreated: state.week,
        fightWeek: state.week + weeks,
        opponentId: opponent.id,
        promoterId: promoter.id,
        promoterLabel: promoter.label,
        promoterCut: promoter.cut || 0.1,
        label: type,
        purse: purse,
        netPurse: Math.max(0, Math.round(purse * (1 - (promoter.cut || 0.1)))),
        rounds: U.findTrack("pro").rounds,
        weightClassId: p.weightClassId,
        status: "available"
      });
    }

    state.world.proContracts = contracts;
    return contracts;
  }

  function acceptProContract(state, contractId) {
    var p = State.player(state);
    var contract = (state.world.proContracts || []).find(function (item) { return item.id === contractId; });
    var dateText;
    if (!p || !contract || p.trackId !== "pro") { return false; }
    p.contractOpponentId = contract.opponentId;
    p.contractLabel = contract.label;
    p.contractPurse = contract.netPurse;
    p.contractRounds = contract.rounds;
    p.contractId = contract.id;
    p.nextFightWeek = contract.fightWeek;
    p.promoterId = contract.promoterId;
    dateText = futureDateText(contract.fightWeek);
    state.world.proContractHistory = state.world.proContractHistory instanceof Array ? state.world.proContractHistory : [];
    state.world.proContractHistory.unshift({ week: state.week, text: "Подписан контракт: " + contract.label + ", бой: " + dateText + ".", contract: contract });
    state.world.proContracts = [];
    state.feed = "Контракт подписан. Бой назначен: " + dateText + ".";
    return true;
  }

  function clearProContract(player) {
    player.contractOpponentId = "";
    player.contractLabel = "";
    player.contractPurse = 0;
    player.contractRounds = 0;
    player.contractId = "";
    player.nextFightWeek = 0;
  }

    function advanceWeek(state, action) {
    var npcReport;
    var playerClubBefore;
    var p = State.player(state);
    var fatigueRecovery;
    var needsClubMaintenance;
    var needsNationalTeams;
    var needsTitleUpdate;

    state.week += 1;
    state._rankingDirty = true;
    if (State.applyMonthlyExpenses) { State.applyMonthlyExpenses(state); }

    if (action === "rest" && State.restPlayer) {
      State.restPlayer(state);
    } else if ((action === "skip" || !action) && State.adjustFatigue) {
      fatigueRecovery = Data.economy && Data.economy.fatigue ? (Number(Data.economy.fatigue.weeklyRecovery) || 20) : 20;
      State.adjustFatigue(state, -fatigueRecovery, "Еженедельное восстановление");
    }

    playerClubBefore = p ? p.gymId : "";

    if (window.FS.Clubs) {
      needsClubMaintenance = !state.clubs || !state.clubs.length || state._forceClubAssign || state.week % 16 === 1;
      if (needsClubMaintenance) { window.FS.Clubs.ensureClubs(state); }
    }

    simulateRetirementsAndNewFighters(state);
    simulateNpcTraining(state);
    npcReport = simulateNpcFights(state);
    simulateTransitions(state);

    if (window.FS.Clubs && window.FS.Clubs.maybeMoveNpcClubs) { window.FS.Clubs.maybeMoveNpcClubs(state); }
    simulateInternationalGymMoves(state);
    if (window.FS.Clubs && window.FS.Clubs.simulateCoachLife) { window.FS.Clubs.simulateCoachLife(state); }
    if (window.FS.Clubs && window.FS.Clubs.flushCoachRecords) { window.FS.Clubs.flushCoachRecords(state); }

    if (state._rankingDirty && State.invalidateCaches) {
      State.invalidateCaches(state);
      state._rankingDirty = false;
    }

    needsNationalTeams = !state.world.teamsByCountry ||
      !Object.keys(state.world.teamsByCountry).length ||
      state._nationalTeamsDirty ||
      state.week % 16 === 1;

    if (needsNationalTeams) {
      buildNationalTeams(state);
      state._nationalTeamsDirty = false;
    } else if (state.world.teamCoaches && state.week % 48 === 1) {
      Object.keys(state.world.teamCoaches).forEach(function (countryId) {
        ensureNationalCoach(state, U.findCountry(countryId));
      });
    }

    simulateAutonomousTournaments(state);

    needsTitleUpdate = state._titlesDirty || state.week % 8 === 0;
    if (window.FS.Titles && needsTitleUpdate) {
      window.FS.Titles.updateTitles(state);
      state._titlesDirty = false;
    }

    if (window.FS.Stories && state.week % 2 === 0) { window.FS.Stories.simulateStories(state); }

    if (!state.offers || !state.offers.length || state.week % 2 === 0 || state._offersDirty) { refreshOffers(state); state._offersDirty = false; }

    if (!state.modal || state.modal.type !== "proContractPreview") { handleProFightDue(state); }
    if (!state.modal || state.modal.type !== "proContractPreview") { buildProContracts(state); }

    if (p && State.checkAutomaticProMove) { State.checkAutomaticProMove(state, p); }
    if (State.updateDebtStatus) { State.updateDebtStatus(state, "week"); }
    if (State.ensureCoachGoal) { State.ensureCoachGoal(state); }

    if (p && p.gymId && playerClubBefore && p.gymId !== playerClubBefore) {
      pushNews(state, "club", "Изменения в клубе: состав и тренерский штаб обновлены.", { clubId: p.gymId });
    }

    U.pushLimited(state.world.weekReports, {
      id: U.uid("week"),
      week: state.week,
      action: action || "week",
      fights: npcReport.slice(0, 8)
    }, 35);

    simulateTournamentNews(state);
    handleScheduledTournamentStart(state);
    if (!state.modal) { scheduleTournamentNotice(state); }
    state.world.lastWeekPerfMs = 0;
  }

  function bootstrapWorld(state) {
    State.updateAllDerived(state);
    if (window.FS.Amateur && window.FS.Amateur.ensureAmateurState) {
      window.FS.Amateur.ensureAmateurState(state);
    }
    if (window.FS.Matchmaking && window.FS.Matchmaking.normalizeRosterRecords) {
      window.FS.Matchmaking.normalizeRosterRecords(state);
    }
    if (window.FS.Clubs) {
      window.FS.Clubs.ensureClubs(state);
      
    }
    if (!state.world.teamsByCountry || !Object.keys(state.world.teamsByCountry).length || state.week % 4 === 1) {
      buildNationalTeams(state);
    } else if (state.world.teamCoaches) {
      Object.keys(state.world.teamCoaches).forEach(function (countryId) {
        ensureNationalCoach(state, U.findCountry(countryId));
      });
    }
    simulateAutonomousTournaments(state);
    if (window.FS.Titles) {
      window.FS.Titles.ensureTitles(state);
      if (window.FS.Titles.removeAmateurTitles) {
        window.FS.Titles.removeAmateurTitles(state);
      }
      if (window.FS.Titles.normalizeFighterTitles) {
        window.FS.Titles.normalizeFighterTitles(state);
      }
    }
    if (!state.offers || !state.offers.length || state.week % 2 === 0 || state._offersDirty) { refreshOffers(state); state._offersDirty = false; }
    if (State.ensureCoachGoal) { State.ensureCoachGoal(state); }
    buildProContracts(state);
    if (!state.world.news.length) {
      createNews(state, "world", "Мир запущен: клубы, титулы, рейтинги, сборные и расписание боёв сформированы.", { type: "bootstrap" });
    }
  }

  window.FS.World = {
    createNews: createNews,
    refreshOffers: refreshOffers,
    advanceWeek: advanceWeek,
    bootstrapWorld: bootstrapWorld,
    simulateNpcTraining: simulateNpcTraining,
    simulateNpcFights: simulateNpcFights,
    simulateTransitions: simulateTransitions,
    buildNationalTeams: buildNationalTeams,
    buildProContracts: buildProContracts,
    acceptProContract: acceptProContract,
    clearProContract: clearProContract
  };
}());
