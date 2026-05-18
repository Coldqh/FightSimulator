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
    if (comp.schedule === "city") { return "каждый месяц, 2 неделя"; }
    if (comp.schedule === "oblast") { return "февраль, май, август, ноябрь · 3 неделя"; }
    if (comp.schedule === "region") { return "март, июль, ноябрь · 4 неделя"; }
    if (comp.schedule === "country") { return "март, 2 неделя и сентябрь, 2 неделя"; }
    if (comp.schedule === "continent") { return "июнь, 2 неделя"; }
    if (comp.schedule === "world") { return "октябрь, 2 неделя"; }
    if (comp.schedule === "olympiad") { return "каждый 4-й год, июль, 2 неделя"; }
    return "по расписанию";
  }

  function isScheduledNow(state, comp) {
    var parts = State.dateParts ? State.dateParts(state) : { year: 1, month: 1, weekOfMonth: 1 };
    if (comp.schedule === "city") { return parts.weekOfMonth === 2; }
    if (comp.schedule === "oblast") { return [2, 5, 8, 11].indexOf(parts.month) !== -1 && parts.weekOfMonth === 3; }
    if (comp.schedule === "region") { return [3, 7, 11].indexOf(parts.month) !== -1 && parts.weekOfMonth === 4; }
    if (comp.schedule === "country") { return (parts.month === 3 || parts.month === 9) && parts.weekOfMonth === 2; }
    if (comp.schedule === "continent") { return parts.month === 6 && parts.weekOfMonth === 2; }
    if (comp.schedule === "world") { return parts.month === 10 && parts.weekOfMonth === 2; }
    if (comp.schedule === "olympiad") { return parts.year % 4 === 0 && parts.month === 7 && parts.weekOfMonth === 2; }
    return false;
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
    cooldownLeft = lastWeek ? Math.max(0, comp.weekCooldown - (state.week - lastWeek)) : 0;

    if (p.trackId !== "amateur") { return { available: false, reason: "Доступно только на любительском пути.", cooldownLeft: cooldownLeft }; }
    if (rating < comp.minRating) { return { available: false, reason: "Нужен OVR " + comp.minRating + "+.", cooldownLeft: cooldownLeft }; }
    if (typeof comp.maxRating === "number" && rating > comp.maxRating) { return { available: false, reason: "OVR выше лимита: максимум " + comp.maxRating + ".", cooldownLeft: cooldownLeft }; }
    if (!isScheduledNow(state, comp)) { return { available: false, reason: "Следующий турнир: " + scheduleTextForState(state, comp) + ".", cooldownLeft: cooldownLeft }; }
    if (cooldownLeft > 0) { return { available: false, reason: "Следующая попытка через " + cooldownLeft + " нед.", cooldownLeft: cooldownLeft }; }
    return { available: true, reason: "Можно заявиться.", cooldownLeft: 0 };
  }

  function availableCompetitions(state) {
    var p = State.player(state);
    var playerCountry = p ? U.findCountry(p.countryId) : null;
    ensureAmateurState(state);
    return Data.amateurCompetitions.map(function (comp) {
      var status = competitionStatus(state, comp);
      var label = comp.scope === "continent" && playerCountry ? "Чемпионат " + playerCountry.continentLabel : comp.label;
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
    var homeCountry = U.findCountry(p.homeCountryId || p.countryId);

    if (comp.scope === "continent") {
      return Data.countries.filter(function (country) { return country.continentId === homeCountry.continentId; });
    }
    if (comp.scope === "world" || comp.scope === "world_elite") {
      return Data.countries.slice();
    }

    if (currentCountry.localPoolId && currentCountry.localPoolId !== currentCountry.id) {
      return Data.countries.filter(function (country) { return country.localPoolId === currentCountry.localPoolId; });
    }

    return [currentCountry];
  }

  function candidatePool(state, comp, usedIds) {
    var p = State.player(state);
    var countries = countryPool(state, comp).map(function (country) { return country.id; });
    var min = typeof comp.minRating === "number" ? comp.minRating : 0;
    var max = typeof comp.maxRating === "number" ? comp.maxRating : 120;
    var used = usedIds || {};
    var teamOnly = comp.scope === "world" || comp.scope === "world_elite";
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
      return !fighter.isPlayer && !fighter.retired && !used[fighter.id] &&
        fighter.trackId === "amateur" &&
        fighter.weightClassId === p.weightClassId &&
        countries.indexOf(fighter.countryId) !== -1 &&
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

    session.opponentId = opponentId;
    session.roundLabel = roundLabel;

    if (blockedReason) { return { type: "tournamentFinal", label: comp.label, blocked: true, reason: blockedReason, session: session }; }
    if (!opponent) { return { type: "tournamentFinal", label: comp.label, blocked: true, reason: "Не найден соперник.", session: session }; }

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
      opponentRating: U.statAverage(opponent.stats),
      playerRating: U.statAverage(p.stats),
      winChance: chanceFor(p, opponent),
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
      awarded: false,
      continueMode: "fight"
    };

    state.feed = "Турнир начат: " + comp.label + ". Этап: " + session.rounds[0] + ".";
    return buildFightModal(state, session, "");
  }

  function tournamentMoneyReward(comp, place) {
    var base = Math.max(80, comp.rewardRating * 8);
    if (place === "1 место") { return base; }
    if (place === "2 место") { return Math.round(base * 0.55); }
    if (place === "3 место") { return Math.round(base * 0.32); }
    return 0;
  }

  function awardPlacement(state, comp, place, result) {
    var p = State.player(state);
    var awardLabel = comp.awardLabel + " · " + place;
    var moneyReward = tournamentMoneyReward(comp, place);
    var already = state.amateurPath.medals.some(function (medal) {
      return medal.competitionId === comp.id && medal.place === place && medal.week === state.week;
    });

    if (already) { return; }

    if (moneyReward > 0) { State.addMoney ? State.addMoney(state, moneyReward, comp.label + " · " + place) : (p.money = (Number(p.money) || 0) + moneyReward); }
    state.amateurPath.completed[comp.id] = true;
    state.amateurPath.points += comp.rewardRating;
    state.amateurPath.medals.unshift({
      id: U.uid("medal"),
      week: state.week,
      competitionId: comp.id,
      label: comp.label,
      awardLabel: awardLabel,
      place: place,
      result: result,
      moneyReward: moneyReward
    });

    if (state.amateurPath.medals.length > 30) {
      state.amateurPath.medals.length = 30;
    }

    if (State.addFighterAward) {
      State.addFighterAward(state, p, awardLabel, "amateur");
    }

    if (comp.id === "country" && ["1 место", "2 место", "3 место"].indexOf(place) !== -1) {
      var teamKey = p.countryId + "|" + p.weightClassId;
      var reservePool = State.ranking(state, p.countryId, "amateur", p.weightClassId).filter(function (fighter) {
        return !fighter.isPlayer && !fighter.retired;
      }).slice(10, 13).map(function (fighter) { return fighter.id; });

      state.world.nationalTeamQualification[teamKey] = {
        fighterId: p.id,
        countryId: p.countryId,
        weightClassId: p.weightClassId,
        place: place,
        week: state.week
      };
      state.world.reserveAdditions[teamKey] = reservePool;
    }

    if (p && p.careerLog) {
      p.careerLog.unshift({ week: state.week, text: "Турнир: " + comp.label + " · " + awardLabel + "." });
    }
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
    roundData = window.FS.Fight.simulateRounds(p, opponent, 3);

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

    session.fights.push({
      round: session.roundLabel,
      opponentId: opponent.id,
      opponentName: opponent.name,
      opponentRating: U.statAverage(opponent.stats),
      winChance: chance,
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
    session.pendingFatigue = (session.pendingFatigue || 0) + (Data.economy && Data.economy.fatigue ? Data.economy.fatigue.tournamentFight : 10);

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

    if (session.continueMode === "next" || session.continueMode === "third") {
      return buildFightModal(state, session, "");
    }

    state.amateurPath.lastCompetitionWeekById[comp.id] = state.week;
    if (State.adjustFatigue && session.pendingFatigue) {
      State.adjustFatigue(state, Math.min(55, session.pendingFatigue), "Турнир завершён");
      session.pendingFatigue = 0;
    }

    if (["1 место", "2 место", "3 место"].indexOf(place) !== -1 && !session.awarded) {
      awardPlacement(state, comp, place, place);
      session.awarded = true;
    }

    state.feed = place ? ("Турнир завершён: " + comp.label + " · " + place + ".") : ("Вылет из турнира: " + comp.label + ".");
    return {
      type: "tournamentFinal",
      label: comp.label,
      result: place ? "Турнир завершён" : "Вылет",
      place: place,
      reward: place && place !== "4 место" ? tournamentMoneyReward(comp, place) : 0,
      cooldown: comp.weekCooldown,
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
