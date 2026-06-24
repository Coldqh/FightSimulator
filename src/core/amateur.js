(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;
  var State = window.FS.State;

  function ensureAmateurState(state) {
    if (!state.amateurPath || typeof state.amateurPath !== "object") {
      state.amateurPath = { completed: {}, medals: [], lastCompetitionWeekById: {}, points: 0 };
    }
    state.amateurPath.completed = state.amateurPath.completed || {};
    state.amateurPath.medals = state.amateurPath.medals instanceof Array ? state.amateurPath.medals : [];
    state.amateurPath.lastCompetitionWeekById = state.amateurPath.lastCompetitionWeekById || {};
    state.amateurPath.points = Number(state.amateurPath.points) || 0;
    if (!state.world) { state.world = {}; }
    state.world.nationalTeamQualification = state.world.nationalTeamQualification || {};
    state.world.reserveAdditions = state.world.reserveAdditions || {};
  }

  function getCompetition(compId) {
    var i;
    for (i = 0; i < Data.amateurCompetitions.length; i += 1) {
      if (Data.amateurCompetitions[i].id === compId) { return Data.amateurCompetitions[i]; }
    }
    return Data.amateurCompetitions[0];
  }

  function scheduleText(comp) {
    if (comp.schedule === "city") { return "6 раз в год"; }
    if (comp.schedule === "oblast") { return "4 раза в год"; }
    if (comp.schedule === "region") { return "3 раза в год"; }
    if (comp.schedule === "country") { return "2 раза в год"; }
    if (comp.schedule === "continent") { return "1 раз в год"; }
    if (comp.schedule === "world") { return "1 раз в 2 года"; }
    if (comp.schedule === "olympiad") { return "1 раз в 2 года"; }
    return "по расписанию";
  }

  function isScheduledNow(state, comp) {
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
  }

  function competitionScope(comp) {
    if (!comp) { return "local"; }
    if (comp.scope) { return comp.scope; }
    if (comp.id === "continent" || comp.schedule === "continent") { return "continent"; }
    if (comp.id === "world" || comp.schedule === "world") { return "world"; }
    if (comp.id === "olympiad" || comp.schedule === "olympiad") { return "world_elite"; }
    return "local";
  }

  function nationalCountryId(fighter) {
    return fighter ? (fighter.homeCountryId || fighter.originCountryId || fighter.nameCountryId || fighter.countryId) : "";
  }

  function continentTournamentLabel(country) {
    var label = country && country.continentLabel ? country.continentLabel : "";
    var byId = {
      "Europe": "Европы",
      "Asia": "Азии",
      "North America": "Северной Америки",
      "South America": "Южной Америки",
      "Africa": "Африки",
      "Oceania": "Океании"
    };
    var genitive = byId[country && country.continentId] || {
      "Европа": "Европы",
      "Азия": "Азии",
      "Северная Америка": "Северной Америки",
      "Южная Америка": "Южной Америки",
      "Африка": "Африки",
      "Океания": "Океании"
    }[label] || label;
    return "Чемпионат " + genitive;
  }

  

  function dateTextForWeek(week) {
    var parts = State.dateParts ? State.dateParts({ week: week }) : { year: 1, monthLabel: "месяц", weekOfMonth: 1 };
    return "год " + parts.year + ", " + parts.monthLabel + ", " + parts.weekOfMonth + " неделя";
  }

  function isScheduledAtWeek(week, comp) {
    return isScheduledNow({ week: week }, comp);
  }

  function nextScheduledWeek(state, comp) {
    var week = Number(state.week) || 1;
    var offset;
    for (offset = 0; offset <= 240; offset += 1) {
      if (isScheduledAtWeek(week + offset, comp)) { return week + offset; }
    }
    return week;
  }

  function scheduleTextForState(state, comp) {
    var nextWeek = nextScheduledWeek(state, comp);
    var left = Math.max(0, nextWeek - (Number(state.week) || 1));
    return dateTextForWeek(nextWeek) + " · " + (left === 0 ? "на этой неделе" : ("через " + left + " нед."));
  }

  function competitionStatus(state, comp) {
    var p = State.player(state);
    var rating = U.statAverage(p.stats);
    var lastWeek;
    var cooldownLeft;
    ensureAmateurState(state);
    lastWeek = state.amateurPath.lastCompetitionWeekById[comp.id] || 0;
    cooldownLeft = lastWeek && comp.weekCooldown ? Math.max(0, comp.weekCooldown - (state.week - lastWeek)) : 0;

    if (p.trackId !== "amateur") { return { available: false, reason: "Доступно только на любительском пути.", cooldownLeft: cooldownLeft }; }
    if (lastWeek === state.week) { return { available: false, reason: "Этот турнир уже завершён на этой неделе.", cooldownLeft: 0 }; }
    if (State.isLockedByFatigue && State.isLockedByFatigue(state)) { return { available: false, reason: "Усталость выше 75/100. Сначала восстановись.", cooldownLeft: cooldownLeft }; }
    if (rating < comp.minRating) { return { available: false, reason: "Нужен OVR " + comp.minRating + "+.", cooldownLeft: cooldownLeft }; }
    if (typeof comp.maxRating === "number" && rating > comp.maxRating) { return { available: false, reason: "OVR выше лимита: максимум " + comp.maxRating + ".", cooldownLeft: cooldownLeft }; }
    if (!isScheduledNow(state, comp)) { return { available: false, reason: "Следующий турнир: " + scheduleTextForState(state, comp) + ".", cooldownLeft: cooldownLeft }; }
    if (cooldownLeft > 0) { return { available: false, reason: "Следующая попытка через " + cooldownLeft + " нед.", cooldownLeft: cooldownLeft }; }
    return { available: true, reason: "Можно заявиться.", cooldownLeft: 0 };
  }

  function availableCompetitions(state) {
    var p = State.player(state);
    var nationalCountry = p ? U.findCountry(nationalCountryId(p)) : null;
    ensureAmateurState(state);
    return Data.amateurCompetitions.map(function (comp) {
      var status = competitionStatus(state, comp);
      var scope = competitionScope(comp);
      var label = scope === "continent" && nationalCountry ? continentTournamentLabel(nationalCountry) : comp.label;
      return {
        id: comp.id,
        label: label,
        awardLabel: comp.awardLabel,
        minRating: comp.minRating,
        maxRating: comp.maxRating,
        rewardRating: comp.rewardRating,
        entryFee: Data.economy && Data.economy.tournamentEntryFees ? (Data.economy.tournamentEntryFees[comp.id] || 0) : 0,
        difficultyId: comp.difficultyId,
        scheduleText: scheduleTextForState(state, comp),
        available: status.available,
        reason: status.reason,
        cooldownLeft: status.cooldownLeft
      };
    });
  }

  function countryPool(state, comp) {
    var p = State.player(state);
    var currentCountry = U.findCountry(p.countryId);
    var homeCountry = U.findCountry(nationalCountryId(p));
    var scope = competitionScope(comp);

    if (scope === "continent") {
      return Data.countries.filter(function (country) { return country.continentId === homeCountry.continentId; });
    }
    if (scope === "world" || scope === "world_elite") {
      return Data.countries.slice();
    }

    if (currentCountry.localPoolId && currentCountry.localPoolId !== currentCountry.id) {
      return Data.countries.filter(function (country) { return country.localPoolId === currentCountry.localPoolId; });
    }

    return [currentCountry];
  }

  function candidatePool(state, comp, usedIds) {
    var p = State.player(state);
    var scope = competitionScope(comp);
    var countries = countryPool(state, comp).map(function (country) { return country.id; });
    var min = typeof comp.minRating === "number" ? comp.minRating : 0;
    var max = typeof comp.maxRating === "number" ? comp.maxRating : 120;
    var used = usedIds || {};
    var teamOnly = scope === "world" || scope === "world_elite";
    var nationalScope = scope === "continent" || teamOnly;
    var teamSet = {};
    var countryId;
    var team;

    if (teamOnly && state.world && state.world.teamsByCountry) {
      for (countryId in state.world.teamsByCountry) {
        if (Object.prototype.hasOwnProperty.call(state.world.teamsByCountry, countryId)) {
          team = state.world.teamsByCountry[countryId];
          (team.main || []).forEach(function (id) { teamSet[id] = true; });
        }
      }
    }

    return state.roster.filter(function (fighter) {
      var rating = U.statAverage(fighter.stats);
      var countryForTournament = nationalScope ? nationalCountryId(fighter) : fighter.countryId;
      return !fighter.isPlayer && !fighter.retired && !used[fighter.id] &&
        fighter.trackId === "amateur" &&
        fighter.weightClassId === p.weightClassId &&
        countries.indexOf(countryForTournament) !== -1 &&
        (!teamOnly || teamSet[fighter.id]) &&
        rating >= min && rating <= max;
    });
  }

  function shuffle(list) {
    var copy = list.slice();
    var i;
    var j;
    var temp;
    for (i = copy.length - 1; i > 0; i -= 1) {
      j = U.randomInt(0, i);
      temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function lowerPowerOfTwo(value) {
    var power = 1;
    while (power * 2 <= value) { power *= 2; }
    return power;
  }

  function arrangeRoundPairs(ids) {
    var clean = (ids || []).filter(function (id) { return !!id; });
    var count = clean.length;
    var base;
    var fightCount;
    var fightNeeded;
    var playerIndex;
    var swap;
    var fightIds;
    var byeIds;
    var arranged = [];
    var i;

    if (count <= 2 || lowerPowerOfTwo(count) === count) {
      return clean;
    }

    base = lowerPowerOfTwo(count);
    fightCount = count - base;
    fightNeeded = fightCount * 2;

    playerIndex = clean.indexOf("player");
    if (playerIndex >= fightNeeded && fightNeeded > 0) {
      swap = clean[fightNeeded - 1];
      clean[fightNeeded - 1] = "player";
      clean[playerIndex] = swap;
    }

    fightIds = clean.slice(0, fightNeeded);
    byeIds = clean.slice(fightNeeded);

    for (i = 0; i < fightIds.length; i += 2) {
      arranged.push(fightIds[i]);
      arranged.push(fightIds[i + 1] || "");
    }
    for (i = 0; i < byeIds.length; i += 1) {
      arranged.push(byeIds[i]);
      arranged.push("");
    }

    return arranged;
  }

  function prepareCurrentRound(session) {
    if (session.roundPreparedIndex === session.roundIndex) { return; }
    session.activeIds = arrangeRoundPairs(session.activeIds || []);
    session.roundPreparedIndex = session.roundIndex;
  }

  function bracketSize(poolSize) {
    return Math.max(2, Math.min(1024, poolSize));
  }

  function tournamentRoundsForSize(size) {
    var labels = [];
    var count = size;
    var base;
    if (count > 2 && lowerPowerOfTwo(count) !== count) {
      base = lowerPowerOfTwo(count);
      labels.push("Предварительный раунд");
      count = base;
    }
    while (count > 2) {
      if (count === 4) { labels.push("Полуфинал"); }
      else if (count === 8) { labels.push("Четвертьфинал"); }
      else { labels.push("1/" + count); }
      count = Math.floor(count / 2);
    }
    labels.push("Финал");
    return labels;
  }

  function summarizeAlive(state, session) {
    return (session.activeIds || []).map(function (id) {
      var fighter = U.getFighterById(state, id);
      return fighter ? {
        id: fighter.id,
        name: fighter.name,
        country: U.findCountry(fighter.countryId).label,
        rating: U.statAverage(fighter.stats),
        record: U.recordText(fighter.record),
        isPlayer: !!fighter.isPlayer
      } : null;
    }).filter(Boolean).sort(function (a, b) { return b.rating - a.rating; });
  }

  function findPlayerOpponent(session) {
    var ids;
    var i;
    prepareCurrentRound(session);
    ids = session.activeIds || [];
    for (i = 0; i < ids.length; i += 2) {
      if (ids[i] === "player") { return ids[i + 1] || ""; }
      if (ids[i + 1] === "player") { return ids[i] || ""; }
    }
    return "";
  }

  function chanceFor(a, b) {
    var scoreA = U.scoreFighter(a);
    var scoreB = U.scoreFighter(b);
    return U.clamp(50 + Math.round((scoreA - scoreB) * 2.25), 8, 92);
  }

  function simulateNpcTournamentFight(state, aId, bId) {
    var a = U.getFighterById(state, aId);
    var b = U.getFighterById(state, bId);
    var chance;
    var winner;
    var loser;

    if (!a) { return bId; }
    if (!b) { return aId; }

    chance = chanceFor(a, b);
    if (U.randomInt(1, 100) <= chance) {
      winner = a;
      loser = b;
    } else {
      winner = b;
      loser = a;
    }

    winner.record.wins += 1;
    loser.record.losses += 1;
    winner.trackRecords[winner.trackId] = State.cloneRecord(winner.record);
    loser.trackRecords[loser.trackId] = State.cloneRecord(loser.record);
    State.updateDerivedFighterFields(winner);
    State.updateDerivedFighterFields(loser);

    if (window.FS.Clubs && window.FS.Clubs.recordClubFight) {
      window.FS.Clubs.recordClubFight(state, winner, loser, false);
    }

    return winner.id;
  }

  function applyPlayerTournamentResult(state, player, opponent, result, method) {
    if (result === "Победа") {
      player.record.wins += 1;
      opponent.record.losses += 1;
      if (method === "KO/TKO") { player.record.kos += 1; }
    } else {
      player.record.losses += 1;
      opponent.record.wins += 1;
      if (method === "KO/TKO") { opponent.record.kos += 1; }
    }

    player.trackRecords[player.trackId] = State.cloneRecord(player.record);
    opponent.trackRecords[opponent.trackId] = State.cloneRecord(opponent.record);
    player.lastFightWeek = state.week;
    opponent.lastFightWeek = state.week;
    State.updateDerivedFighterFields(player);
    State.updateDerivedFighterFields(opponent);

    if (window.FS.Clubs && window.FS.Clubs.recordClubFight) {
      window.FS.Clubs.recordClubFight(state, result === "Победа" ? player : opponent, result === "Победа" ? opponent : player, false);
    }
  }

  function advanceBracketAfterPlayerWin(state, session) {
    var ids;
    var winners = [];
    var i;
    var a;
    var b;

    prepareCurrentRound(session);
    ids = session.activeIds || [];

    for (i = 0; i < ids.length; i += 2) {
      a = ids[i];
      b = ids[i + 1];

      if (!a && !b) { continue; }
      if (!b) { winners.push(a); continue; }
      if (!a) { winners.push(b); continue; }

      if (a === "player" || b === "player") {
        winners.push("player");
      } else {
        winners.push(simulateNpcTournamentFight(state, a, b));
      }
    }

    session.activeIds = winners;
    session.roundIndex += 1;
    session.roundPreparedIndex = -1;
    return winners;
  }

  function semifinalLoserOpponent(state, session) {
    var ids = session.activeIds || [];
    var playerPairStart = -1;
    var otherA = "";
    var otherB = "";
    var a;
    var b;
    var winnerId;
    var loserId;

    for (var i = 0; i < ids.length; i += 2) {
      if (ids[i] === "player" || ids[i + 1] === "player") {
        playerPairStart = i;
        break;
      }
    }

    for (var j = 0; j < ids.length; j += 2) {
      if (j !== playerPairStart) {
        otherA = ids[j];
        otherB = ids[j + 1];
        break;
      }
    }

    a = U.getFighterById(state, otherA);
    b = U.getFighterById(state, otherB);

    if (!a && !b) {
      return "";
    }
    if (!a) {
      return otherB;
    }
    if (!b) {
      return otherA;
    }

    winnerId = simulateNpcTournamentFight(state, otherA, otherB);
    loserId = winnerId === otherA ? otherB : otherA;

    session.fights.push({
      round: "Полуфинал",
      opponentId: otherB,
      opponentName: a.name + " vs " + b.name,
      opponentRating: Math.max(U.statAverage(a.stats), U.statAverage(b.stats)),
      winChance: chanceFor(a, b),
      result: "NPC: " + (winnerId === otherA ? a.name : b.name) + " победил"
    });

    return loserId;
  }

  function buildFightModal(state, session, blockedReason) {
    var p = State.player(state);
    var comp = getCompetition(session.competitionId);
    var opponentId = session.specialRound === "third" ? session.thirdPlaceOpponentId : findPlayerOpponent(session);
    var opponent = opponentId ? U.getFighterById(state, opponentId) : null;
    var roundLabel = session.specialRound === "third" ? "Матч за 3 место" : session.rounds[session.roundIndex];
    var playerInfo;
    var opponentInfo;

    session.opponentId = opponentId;
    session.roundLabel = roundLabel;

    if (blockedReason) { return { type: "tournamentFinal", label: comp.label, blocked: true, reason: blockedReason, session: session }; }
    if (!opponent) { return { type: "tournamentFinal", label: comp.label, blocked: true, reason: "Не найден соперник.", session: session }; }

    if (window.FS.Fight && window.FS.Fight.effectiveRatingForFight) {
      playerInfo = window.FS.Fight.effectiveRatingForFight(state, p, session);
      opponentInfo = window.FS.Fight.effectiveRatingForFight(state, opponent, session);
    } else {
      playerInfo = { total: U.statAverage(p.stats), personal: U.statAverage(p.stats), bonus: 0 };
      opponentInfo = { total: U.statAverage(opponent.stats), personal: U.statAverage(opponent.stats), bonus: 0 };
    }

    return {
      type: "tournamentFight",
      label: comp.label,
      competitionId: comp.id,
      roundIndex: session.roundIndex,
      roundLabel: roundLabel,
      roundsTotal: session.rounds.length,
      opponentId: opponent.id,
      opponentName: opponent.name,
      opponentCountry: U.findCountry(opponent.countryId).label,
      opponentRecord: U.recordText(opponent.record),
      opponentRating: opponentInfo.total,
      playerRating: playerInfo.total,
      opponentPersonalRating: opponentInfo.personal,
      playerPersonalRating: playerInfo.personal,
      opponentCoachBonus: opponentInfo.bonus,
      playerCoachBonus: playerInfo.bonus,
      winChance: window.FS.Fight && window.FS.Fight.estimateWinChanceWithContext ? window.FS.Fight.estimateWinChanceWithContext(state, p, opponent, session) : chanceFor(p, opponent),
      alive: summarizeAlive(state, session),
      session: session
    };
  }

  function startTournament(state, compId) {
    var comp = getCompetition(compId);
    var status = competitionStatus(state, comp);
    var p = State.player(state);
    var pool;
    var selected;
    var size;
    var participants;
    var session;

    ensureAmateurState(state);
    if (comp.scope === "continent") {
      var homeId = p.homeCountryId || p.countryId;
      var team = state.world && state.world.teamsByCountry ? state.world.teamsByCountry[homeId] : null;
      var inReserve = team && ((team.reserve || []).indexOf(p.id) !== -1 || (team.main || []).indexOf(p.id) !== -1);
      if (!inReserve) {
        state.feed = "Для чемпионата континента нужно быть в резерве или основе сборной своей страны.";
        return { type: "tournamentFinal", label: comp.label, blocked: true, reason: state.feed, fights: [] };
      }
    }
    if (State.isLockedByFatigue && State.isLockedByFatigue(state)) { state.feed = "Усталость 100/100. Турнир недоступен, сначала восстановись."; return { type: "tournamentFinal", label: comp.label, blocked: true, reason: state.feed, fights: [] }; }
    if (!status.available) { state.feed = status.reason; return { type: "tournamentFinal", label: comp.label, blocked: true, reason: status.reason, fights: [] }; }
    var entryFee = Data.economy && Data.economy.tournamentEntryFees ? (Data.economy.tournamentEntryFees[comp.id] || 0) : 0;
    if (entryFee > 0 && State.spendMoney && !State.spendMoney(state, entryFee, "Заявка: " + comp.label)) {
      return { type: "tournamentFinal", label: comp.label, blocked: true, reason: "Не хватает денег на заявку: $" + entryFee + ".", fights: [] };
    }

    pool = shuffle(candidatePool(state, comp, {}));
    size = bracketSize(pool.length + 1);
    if (pool.length < 1) { return { type: "tournamentFinal", label: comp.label, blocked: true, reason: "Недостаточно реальных соперников в рейтинге.", fights: [] }; }

    selected = pool.slice(0, size - 1).map(function (fighter) { return fighter.id; });
    participants = shuffle(selected.concat(["player"]));

    session = {
      competitionId: comp.id,
      roundIndex: 0,
      roundPreparedIndex: -1,
      rounds: tournamentRoundsForSize(size),
      activeIds: participants,
      fights: [],
      reward: comp.rewardRating,
      bracketSize: size,
      awarded: false,
      continueMode: "fight"
    };

    state.feed = "Турнир начат: " + comp.label + ". Этап: " + session.rounds[0] + ".";
    return buildFightModal(state, session, "");
  }

  function placeNumber(place) {
    var match = String(place || "").match(/\d+/);
    return match ? Math.max(1, Number(match[0]) || 1) : 0;
  }

  function eliminationPlace(session) {
    var count = Math.max(4, (session.activeIds || []).length || session.bracketSize || 4);
    return count + " место";
  }

  function tournamentRewardShare(place) {
    var n = placeNumber(place);
    if (n <= 1) { return 1.00; }
    if (n === 2) { return 0.55; }
    if (n === 3) { return 0.34; }
    if (n === 4) { return 0.22; }
    if (n <= 8) { return 0.10; }
    if (n <= 16) { return 0.045; }
    if (n <= 32) { return 0.020; }
    if (n <= 64) { return 0.010; }
    return 0.004;
  }

  function tournamentXpReward(comp, place) {
    var n = placeNumber(place);
    var base = Math.max(1, Number(comp.rewardRating) || 1);
    var share = tournamentRewardShare(place);
    if (!n) { return 0; }
    return Math.max(1, Math.round(base * 8 * share + base * (n <= 4 ? 1 : 0.35)));
  }

  

  function tournamentMoneyReward(comp, place) {
    var base = Math.max(120, (Number(comp.rewardRating) || 1) * 260);
    var n = placeNumber(place);
    if (!n) { return 0; }
    return Math.max(n <= 32 ? 10 : 0, Math.round(base * tournamentRewardShare(place)));
  }

  function npcAwardLabel(comp, place) {
    if (place === "1 место") { return "Победитель · " + comp.label; }
    if (place === "2 место") { return "Серебро · " + comp.label; }
    if (place === "3 место") { return "Бронза · " + comp.label; }
    return comp.label + " · " + place;
  }

  function npcMedalForPlace(place) {
    if (place === "1 место") { return "gold"; }
    if (place === "2 место") { return "silver"; }
    if (place === "3 место") { return "bronze"; }
    return "";
  }

  function awardNpcPlacement(state, fighter, comp, place) {
    var label;
    if (!fighter || fighter.isPlayer || !place) { return; }
    label = npcAwardLabel(comp, place);
    if (State.addFighterAward) {
      State.addFighterAward(state, fighter, label, "amateur", {
        medal: npcMedalForPlace(place),
        competitionId: comp.id,
        place: place
      });
    }
    fighter.careerLog = fighter.careerLog instanceof Array ? fighter.careerLog : [];
    fighter.careerLog.unshift({ week: state.week, text: "Турнир: " + comp.label + " · " + label + ".", meta: { competitionId: comp.id, place: place } });
    if (fighter.careerLog.length > 12) { fighter.careerLog.length = 12; }
  }

  function awardDirectOpponentPlacement(state, opponent, comp, playerPlace) {
    if (playerPlace === "1 место") { awardNpcPlacement(state, opponent, comp, "2 место"); }
    else if (playerPlace === "2 место") { awardNpcPlacement(state, opponent, comp, "1 место"); }
    else if (playerPlace === "3 место") { awardNpcPlacement(state, opponent, comp, "4 место"); }
    else if (playerPlace === "4 место") { awardNpcPlacement(state, opponent, comp, "3 место"); }
  }

  

  function awardPlacement(state, comp, place, result) {
    var p = State.player(state);
    var medal = place === "1 место" ? "gold" : (place === "2 место" ? "silver" : (place === "3 место" ? "bronze" : ""));
    var prefix = place === "1 место" ? "Победитель" : (place === "2 место" ? "Серебро" : (place === "3 место" ? "Бронза" : "Место"));
    var awardLabel = prefix + " · " + comp.label;
    var moneyReward = tournamentMoneyReward(comp, place);
    var xpReward = tournamentXpReward(comp, place);
    var already = state.amateurPath.medals.some(function (medalItem) {
      return medalItem.competitionId === comp.id && medalItem.place === place && medalItem.week === state.week;
    });

    if (already) { return { moneyReward: 0, xpReward: 0 }; }

    if (moneyReward > 0) { State.addMoney ? State.addMoney(state, moneyReward, comp.label + " · " + place) : (p.money = (Number(p.money) || 0) + moneyReward); }
    state.amateurPath.completed[comp.id] = true;
    state.amateurPath.points += xpReward;
    p.trainingPoints = (Number(p.trainingPoints) || 0) + xpReward;
    state.amateurPath.medals.unshift({
      id: U.uid("medal"),
      week: state.week,
      competitionId: comp.id,
      label: comp.label,
      awardLabel: awardLabel,
      place: place,
      result: result,
      medal: medal,
      moneyReward: moneyReward,
      xpReward: xpReward
    });

    if (state.amateurPath.medals.length > 40) {
      state.amateurPath.medals.length = 40;
    }

    if (State.addFighterAward && medal) {
      State.addFighterAward(state, p, awardLabel, "amateur", { medal: medal, competitionId: comp.id, place: place });
    }

    if (p && p.careerLog) {
      p.careerLog.unshift({ week: state.week, text: "Турнир: " + comp.label + " · " + place + ", $" + moneyReward + ", +" + xpReward + " опыта.", meta: { competitionId: comp.id } });
    }

    return { moneyReward: moneyReward, xpReward: xpReward };
  }

  function resolveTournamentRound(state, modal) {
    var session = modal.session;
    var comp = getCompetition(session.competitionId);
    var p = State.player(state);
    var opponent = U.getFighterById(state, session.opponentId);
    var roundData;
    var chance;
    var result;
    var method;
    var scoreLine;
    var isFinal;
    var isSemi;
    var continueMode = "final";
    var finalPlace = "";
    var nextLabel = "";

    if (!opponent) { return { type: "tournamentFinal", label: comp.label, blocked: true, reason: "Соперник исчез из турнира.", fights: session.fights || [] }; }

    chance = window.FS.Fight && window.FS.Fight.estimateWinChance ? window.FS.Fight.estimateWinChance(p, opponent) : chanceFor(p, opponent);
    roundData = (window.FS.__currentFightState = state, window.FS.__currentTournamentSession = session, window.FS.Fight.simulateRounds(p, opponent, 3));

    if (roundData.stoppage) {
      result = roundData.stoppage.winner === "player" ? "Победа" : "Поражение";
      method = "KO/TKO";
      scoreLine = "остановка боя, раунд " + roundData.stoppage.round;
    } else if (roundData.playerPoints >= roundData.opponentPoints) {
      result = "Победа";
      method = "решение судей";
      scoreLine = roundData.playerPoints + ":" + roundData.opponentPoints;
    } else {
      result = "Поражение";
      method = "решение судей";
      scoreLine = roundData.playerPoints + ":" + roundData.opponentPoints;
    }
    applyPlayerTournamentResult(state, p, opponent, result, method);
    if (window.FS.Clubs && window.FS.Clubs.rememberFightRelationship) { window.FS.Clubs.rememberFightRelationship(state, opponent); }
    if (window.FS.Clubs && window.FS.Clubs.syncCoachRecords) { window.FS.Clubs.syncCoachRecords(state); }

    session.fights.push({
      round: session.roundLabel,
      opponentId: opponent.id,
      opponentName: opponent.name,
      opponentRating: U.statAverage(opponent.stats),
      winChance: chance,
      result: result,
      method: method,
      scoreLine: scoreLine
    });

    isFinal = session.specialRound === "third" || session.roundIndex >= session.rounds.length - 1;
    isSemi = session.rounds[session.roundIndex] === "Полуфинал";

    if (result === "Победа") {
      if (session.specialRound === "third") {
        finalPlace = "3 место";
        continueMode = "final";
      } else if (isFinal) {
        finalPlace = "1 место";
        continueMode = "final";
      } else {
        advanceBracketAfterPlayerWin(state, session);
        nextLabel = session.rounds[session.roundIndex];
        continueMode = "next";
      }
    } else {
      if (session.specialRound === "third") {
        finalPlace = "4 место";
        continueMode = "final";
      } else if (isFinal) {
        finalPlace = "2 место";
        continueMode = "final";
      } else if (isSemi) {
        session.thirdPlaceOpponentId = semifinalLoserOpponent(state, session) || session.opponentId;
        session.specialRound = "third";
        continueMode = "third";
        nextLabel = "Матч за 3 место";
      } else {
        finalPlace = eliminationPlace(session);
        continueMode = "final";
      }
    }

    session.continueMode = continueMode;
    session.finalPlace = finalPlace;
    awardDirectOpponentPlacement(state, opponent, comp, finalPlace);

    return {
      type: "tournamentResult",
      label: comp.label,
      roundLabel: session.roundLabel,
      result: result,
      method: method,
      scoreLine: scoreLine,
      winChance: chance,
      opponentName: opponent.name,
      opponentRating: U.statAverage(opponent.stats),
      playerRating: U.statAverage(p.stats),
      statsLine: "Урон: " + roundData.playerDamage + ":" + roundData.opponentDamage + ". Попадания: " + roundData.playerLanded + ":" + roundData.opponentLanded + ". HP: " + roundData.playerHpLeft + "/" + roundData.playerMaxHp + " — " + roundData.opponentHpLeft + "/" + roundData.opponentMaxHp + ".",
      roundLog: roundData.log,
      knockdown: roundData.knockdown,
      continueMode: continueMode,
      nextLabel: nextLabel,
      finalPlace: finalPlace,
      alive: summarizeAlive(state, session),
      session: session
    };
  }

  function completeTournamentFightFromRing(state, activeSession, payload) {
    var session = activeSession.tournamentSession;
    var comp = getCompetition(session.competitionId);
    var p = State.player(state);
    var opponent = U.getFighterById(state, session.opponentId);
    var result = payload.result;
    var method = payload.method;
    var isFinal;
    var isSemi;
    var continueMode = "final";
    var finalPlace = "";
    var nextLabel = "";

    if (!opponent) {
      return { type: "tournamentFinal", label: comp.label, blocked: true, reason: "Соперник исчез из турнира.", fights: session.fights || [] };
    }

    applyPlayerTournamentResult(state, p, opponent, result, method);

    session.fights.push({
      round: session.roundLabel,
      opponentId: opponent.id,
      opponentName: opponent.name,
      opponentRating: U.statAverage(opponent.stats),
      winChance: activeSession.winChance,
      result: result
    });

    isFinal = session.specialRound === "third" || session.roundIndex >= session.rounds.length - 1;
    isSemi = session.rounds[session.roundIndex] === "Полуфинал";

    if (result === "Победа") {
      if (session.specialRound === "third") {
        finalPlace = "3 место";
        continueMode = "final";
      } else if (isFinal) {
        finalPlace = "1 место";
        continueMode = "final";
      } else {
        advanceBracketAfterPlayerWin(state, session);
        nextLabel = session.rounds[session.roundIndex];
        continueMode = "next";
      }
    } else {
      if (session.specialRound === "third") {
        finalPlace = "4 место";
        continueMode = "final";
      } else if (isFinal) {
        finalPlace = "2 место";
        continueMode = "final";
      } else if (isSemi) {
        session.thirdPlaceOpponentId = semifinalLoserOpponent(state, session) || session.opponentId;
        session.specialRound = "third";
        continueMode = "third";
        nextLabel = "Матч за 3 место";
      } else {
        continueMode = "final";
      }
    }

    session.continueMode = continueMode;
    session.finalPlace = finalPlace;
    awardDirectOpponentPlacement(state, opponent, comp, finalPlace);
    session.pendingFatigue = (session.pendingFatigue || 0) + (Data.economy && Data.economy.fatigue ? (Number(Data.economy.fatigue.fight) || 25) : 25);

    return {
      type: "tournamentResult",
      label: comp.label,
      roundLabel: session.roundLabel,
      result: result,
      method: method,
      scoreLine: payload.scoreLine,
      winChance: activeSession.winChance,
      opponentName: opponent.name,
      opponentRating: U.statAverage(opponent.stats),
      playerRating: U.statAverage(p.stats),
      statsLine: payload.statsLine,
      roundLog: payload.roundLog,
      knockdown: payload.knockdown,
      continueMode: continueMode,
      nextLabel: nextLabel,
      finalPlace: finalPlace,
      alive: summarizeAlive(state, session),
      session: session
    };
  }

  function continueTournament(state, modal) {
    var session = modal.session;
    var comp = getCompetition(session.competitionId);
    var place = session.finalPlace || "";
    var reward = { moneyReward: 0, xpReward: 0 };

    if (session.continueMode === "next" || session.continueMode === "third") {
      return buildFightModal(state, session, "");
    }

    state.amateurPath.lastCompetitionWeekById[comp.id] = state.week;
    if (state.world && state.world.pendingTournamentInvite && state.world.pendingTournamentInvite.competitionId === comp.id) {
      state.world.pendingTournamentInvite = null;
    }
    if (State.adjustFatigue && session.pendingFatigue) {
      State.adjustFatigue(state, Math.min(100, session.pendingFatigue), "Турнир завершён");
      session.pendingFatigue = 0;
    }

    if (place && !session.awarded) {
      reward = awardPlacement(state, comp, place, place);
      session.awarded = true;
    }

    state.feed = place ? ("Турнир завершён: " + comp.label + " · " + place + ". Награда $" + reward.moneyReward + ", опыт +" + reward.xpReward + ".") : ("Вылет из турнира: " + comp.label + ".");
    return {
      type: "tournamentFinal",
      label: comp.label,
      result: place ? "Турнир завершён" : "Вылет",
      place: place,
      reward: reward.moneyReward,
      xpReward: reward.xpReward,
      fights: session.fights,
      blocked: false,
      alive: summarizeAlive(state, session)
    };
  }

  function completeCompetition() {
    return { finished: true };
  }

  function objectiveSummary(state) {
    var comps = availableCompetitions(state);
    var firstAvailable = comps.find(function (comp) { return comp.available; });
    var firstLocked = comps[0];
    if (firstAvailable) { return { title: "Следующая цель", text: "Доступен турнир: " + firstAvailable.label + ".", next: firstAvailable }; }
    return { title: "Турнирная лестница", text: firstLocked ? firstLocked.reason : "Нет турниров.", next: firstLocked };
  }

  function worldSummary(state) {
    ensureAmateurState(state);
    return {
      points: state.amateurPath.points,
      medals: state.amateurPath.medals.length,
      completed: Object.keys(state.amateurPath.completed).length,
      available: availableCompetitions(state).filter(function (comp) { return comp.available; }).length
    };
  }

  window.FS.Amateur = {
    ensureAmateurState: ensureAmateurState,
    getCompetition: getCompetition,
    availableCompetitions: availableCompetitions,
    startTournament: startTournament,
    resolveTournamentRound: resolveTournamentRound,
    completeTournamentFightFromRing: completeTournamentFightFromRing,
    continueTournament: continueTournament,
    completeCompetition: completeCompetition,
    objectiveSummary: objectiveSummary,
    worldSummary: worldSummary
  };
}());
