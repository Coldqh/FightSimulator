(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;
  var State = window.FS.State;
  var World = window.FS.World;

  var RING_SIZE = 5;

  var PUNCHES = {
    jabHead: { id: "jabHead", label: "Прямой в голову", minDistance: 1, maxDistance: 2, stamina: 28, hp: 0.58, staminaDamage: 0.12, accuracy: 8 },
    jabBody: { id: "jabBody", label: "Прямой в корпус", minDistance: 1, maxDistance: 2, stamina: 32, hp: 0.42, staminaDamage: 0.34, accuracy: 5 },
    hook: { id: "hook", label: "Хук", minDistance: 1, maxDistance: 1, stamina: 40, hp: 0.82, staminaDamage: 0.16, accuracy: -2 },
    uppercut: { id: "uppercut", label: "Апперкот", minDistance: 1, maxDistance: 1, stamina: 48, hp: 0.96, staminaDamage: 0.14, accuracy: -5 }
  };

  function resultClass(result) {
    if (result === "Победа") { return "win"; }
    if (result === "Поражение") { return "loss"; }
    return "draw";
  }

  function findOffer(state, offerId) {
    var i;
    for (i = 0; i < state.offers.length; i += 1) {
      if (state.offers[i].id === offerId) { return state.offers[i]; }
    }
    return null;
  }

  function competitionUsesNationalCoach(tournamentSession) {
    var compId = tournamentSession && tournamentSession.competitionId;
    var comp;
    if (!compId) { return false; }
    comp = (Data.amateurCompetitions || []).find(function (item) { return item.id === compId; });
    return !!(comp && (comp.scope === "continent" || comp.scope === "world" || comp.scope === "world_elite" || comp.id === "continent" || comp.id === "world" || comp.id === "olympiad"));
  }

  function nationalCountryId(fighter) {
    return fighter ? (fighter.homeCountryId || fighter.originCountryId || fighter.nameCountryId || fighter.countryId) : "";
  }

  function coachOvrValue(coach) {
    if (!coach) { return 0; }
    if (window.FS.Clubs && window.FS.Clubs.coachOvr && coach.stats) {
      return window.FS.Clubs.coachOvr(coach);
    }
    return U.clamp(Math.round(Number(coach.ovr) || 0), 0, 100);
  }

  function nationalCoachFor(state, fighter) {
    var countryId = nationalCountryId(fighter);
    var team;
    if (!state || !countryId) { return null; }
    if (state.world && state.world.teamsByCountry && state.world.teamsByCountry[countryId]) {
      team = state.world.teamsByCountry[countryId];
      if (team && team.coach) { return team.coach; }
    }
    if (state.world && state.world.teamCoaches && state.world.teamCoaches[countryId]) {
      return state.world.teamCoaches[countryId];
    }
    return null;
  }

  function fightCoachFor(state, fighter, tournamentSession) {
    if (!state || !fighter) { return null; }
    if (competitionUsesNationalCoach(tournamentSession)) {
      return nationalCoachFor(state, fighter);
    }
    if (window.FS.Clubs && window.FS.Clubs.findFighterCoach) {
      return window.FS.Clubs.findFighterCoach(state, fighter);
    }
    return null;
  }

  function effectiveRatingForFight(state, fighter, tournamentSession) {
    var personal = fighter && fighter.stats ? U.statAverage(fighter.stats) : 0;
    var coach = fightCoachFor(state, fighter, tournamentSession);
    var coachOvr = coachOvrValue(coach);
    var bonus = coach ? Math.ceil(personal * 0.002 * coachOvr) : 0;
    return { personal: personal, bonus: bonus, total: personal + bonus, coach: coach, coachOvr: coachOvr };
  }

  function effectiveRatingLabel(state, fighter, tournamentSession) {
    var info = effectiveRatingForFight(state, fighter, tournamentSession);
    return String(info.total);
  }

  function fightCoachBonus(fighter) {
    var state = window.FS.__currentFightState || null;
    var info = effectiveRatingForFight(state, fighter, window.FS.__currentTournamentSession || null);
    return Math.ceil(info.bonus / 12);
  }

  function estimateWinChanceWithContext(state, player, opponent, tournamentSession) {
    var playerInfo = effectiveRatingForFight(state, player, tournamentSession);
    var opponentInfo = effectiveRatingForFight(state, opponent, tournamentSession);
    var playerScore = playerInfo.total + Math.min((player.record.wins || 0) * 0.20, 14) - Math.min((player.record.losses || 0) * 0.14, 9);
    var opponentScore = opponentInfo.total + Math.min((opponent.record.wins || 0) * 0.20, 14) - Math.min((opponent.record.losses || 0) * 0.14, 9);
    var diff = playerScore - opponentScore;
    var fatiguePenalty = Math.round((Number(player.fatigue) || 0) / 8);
    var underdogHelp = diff < 0 ? Math.min(8, Math.round(Math.abs(diff) * 0.22)) : 0;
    var favoriteHelp = diff > 0 ? Math.min(6, Math.round(diff * 0.15)) : 0;
    return U.clamp(54 + Math.round(diff * 2.05) + underdogHelp + favoriteHelp - fatiguePenalty, 12, 94);
  }

  function estimateWinChance(player, opponent) {
    return estimateWinChanceWithContext(window.FS.__currentFightState || null, player, opponent, window.FS.__currentTournamentSession || null);
  }

  function computePurse(player, opponent) {
    var oOvr = U.statAverage(opponent.stats);
    var trackMul = Data.economy && Data.economy.fightIncomeMultiplier ? (Data.economy.fightIncomeMultiplier[player.trackId] || 1) : 1;
    var base;

    if (player.trackId === "pro") { base = 180 + oOvr * 11; }
    else if (player.trackId === "street") { base = 90 + oOvr * 7; }
    else { base = 35 + oOvr * 5; }

    return Math.max(25, Math.round(base * trackMul));
  }

  function healthStat(fighter) {
    return Number(fighter.stats.health || fighter.stats.defense || 0);
  }

  function trackDamageMultiplier(trackId) {
    if (trackId === "pro") { return 0.84; }
    if (trackId === "street") { return 1.10; }
    return 0.72;
  }

  function damageScale(fighter) {
    return 1 + U.clamp(Number(fighter.stats.power) || 0, 0, 200) * 0.0075 + fightCoachBonus(fighter) * 0.004;
  }

  function basePunchDamage(punch) {
    if (punch.id === "jabHead") { return 6; }
    if (punch.id === "jabBody") { return 5; }
    if (punch.id === "hook") { return 9; }
    if (punch.id === "uppercut") { return 11; }
    return 6;
  }

  function knockdownStandChance(previousKnockdowns) {
    if (previousKnockdowns <= 0) { return 80; }
    if (previousKnockdowns === 1) { return 50; }
    if (previousKnockdowns === 2) { return 30; }
    if (previousKnockdowns === 3) { return 10; }
    return 5;
  }

  function maxHp(fighter) {
    return Math.round(100 + healthStat(fighter));
  }

  function maxStamina(fighter) {
    return Math.round(100 + fighter.stats.stamina * 0.5);
  }

  function fighterLabel(fighter, fallback) {
    return fighter && fighter.isPlayer ? "Ты" : (fighter && fighter.name ? fighter.name : fallback);
  }

  function distance(a, b) {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  }

  function clampPosition(pos) {
    return { x: U.clamp(pos.x, 0, RING_SIZE - 1), y: U.clamp(pos.y, 0, RING_SIZE - 1) };
  }

  function actionNameForRepeat(action) {
    if (PUNCHES[action]) { return "punch:" + action; }
    return action || "";
  }

  function repeatPenalty(fighterState, action) {
    var name = actionNameForRepeat(action);
    var count = fighterState.repeatAction === name ? (fighterState.repeatCount || 1) : 1;
    if (count <= 1) { return 1; }
    return U.clamp(1 - (count - 1) * 0.18, 0.38, 1);
  }

  function registerAction(fighterState, action) {
    var name = actionNameForRepeat(action);
    if (!name) { return; }
    if (fighterState.repeatAction === name) {
      fighterState.repeatCount = (fighterState.repeatCount || 1) + 1;
    } else {
      fighterState.repeatAction = name;
      fighterState.repeatCount = 1;
    }
    fighterState.lastAction = action;
  }

  function blockEffect(defenderState) {
    var penalty = repeatPenalty(defenderState, "block");
    return defenderState.guard === "block" ? (15 * penalty) : 0;
  }

  function counterRisk(defenderState) {
    var penalty = repeatPenalty(defenderState, "counter");
    return defenderState.guard === "counter" ? (8 * penalty) : 0;
  }

  function canUsePunch(punch, attackerState, defenderState) {
    var d = distance(attackerState.pos, defenderState.pos);
    return d >= punch.minDistance && d <= punch.maxDistance && attackerState.stamina >= punch.stamina;
  }

  function hitChance(attacker, defender, punch, attackerState, defenderState) {
    var staminaFactor = attackerState.stamina / attackerState.maxStamina;
    var actionPenalty = repeatPenalty(attackerState, punch.id);
    var attackGrowth = attacker.stats.technique * 0.38 + attacker.stats.speed * 0.27 + fightCoachBonus(attacker) * 0.9;
    var dodgeGrowth = defender.stats.speed * 0.24 + defender.stats.technique * 0.08 + fightCoachBonus(defender) * 0.45;
    return Math.round(U.clamp((36 + attackGrowth + punch.accuracy + staminaFactor * 10 - dodgeGrowth - blockEffect(defenderState) - counterRisk(defenderState)) * actionPenalty, 5, 92));
  }

  function punchDamage(attacker, defender, punch, attackerState, defenderState) {
    var variance = U.randomInt(-1, 2);
    var damage = Math.round((basePunchDamage(punch) + variance) * damageScale(attacker) * trackDamageMultiplier(attacker.trackId) * repeatPenalty(attackerState, punch.id));
    if (defenderState.guard === "block") { damage = Math.round(damage * (0.42 + (1 - repeatPenalty(defenderState, "block")) * 0.24)); }
    if (attackerState.stamina < punch.stamina) { damage = Math.round(damage * 0.48); }
    return U.clamp(damage, 1, attacker.trackId === "amateur" ? 28 : (attacker.trackId === "pro" ? 34 : 45));
  }

  function staminaDamage(attacker, punch, damage, defenderState) {
    var value = Math.round(punch.staminaDamage * (damage + attacker.stats.power * 0.10));
    if (defenderState.guard === "block") { value = Math.round(value * 0.65); }
    return U.clamp(value, 0, 26);
  }

  function estimatePunchDamage(attacker, defender, punch, attackerState, defenderState) {
    var damage = Math.round(basePunchDamage(punch) * damageScale(attacker) * trackDamageMultiplier(attacker.trackId) * repeatPenalty(attackerState, punch.id));
    if (defenderState.guard === "block") { damage = Math.round(damage * 0.42); }
    return U.clamp(damage, 1, attacker.trackId === "amateur" ? 28 : (attacker.trackId === "pro" ? 34 : 45));
  }

  function punchActionsForModal(player, opponent, session) {
    return Object.keys(PUNCHES).map(function (id) {
      var punch = PUNCHES[id];
      var enabled = canUsePunch(punch, session.player, session.opponent);
      return {
        id: id,
        label: punch.label,
        enabled: enabled,
        reason: enabled ? "" : "дистанция/стамина",
        damage: estimatePunchDamage(player, opponent, punch, session.player, session.opponent),
        chance: Math.round(hitChance(player, opponent, punch, session.player, session.opponent)),
        stamina: punch.stamina
      };
    });
  }

  function spendStamina(fighterState, amount) {
    fighterState.stamina = U.clamp(fighterState.stamina - Math.max(1, Math.round(amount)), 0, fighterState.maxStamina);
  }

  function recoverStamina(fighterState, amount) {
    fighterState.stamina = U.clamp(fighterState.stamina + Math.max(1, Math.round(amount)), 0, fighterState.maxStamina);
  }

  function recoverPercent(fighterState, percent) {
    recoverStamina(fighterState, Math.round(fighterState.maxStamina * percent));
  }

  function markTurnRecovery(fighterState, percent) {
    fighterState.turnRecovery = Math.max(Number(fighterState.turnRecovery) || 0, percent);
  }

  function recoverTurnStamina(fighterState) {
    recoverPercent(fighterState, Number(fighterState.turnRecovery) || 0.025);
    fighterState.turnRecovery = 0;
  }

  function createSession(state, offer, opponent, tournamentSession) {
    var p = State.player(state);
    window.FS.__currentFightState = state;
    window.FS.__currentTournamentSession = tournamentSession || null;
    return {
      id: U.uid("active_fight"),
      offerId: offer.id,
      opponentId: opponent.id,
      tournamentSession: tournamentSession || null,
      roundsTotal: offer.rounds || U.findTrack(p.trackId).rounds,
      round: 1,
      turn: 1,
      maxTurns: 10,
      phase: "player",
      player: {
        pos: { x: 2, y: 4 }, hp: maxHp(p), maxHp: maxHp(p), stamina: maxStamina(p), maxStamina: maxStamina(p),
        landed: 0, thrown: 0, counterLanded: 0, damage: 0, roundDamage: 0, knockdowns: 0, guard: "", points: 0, roundsWon: 0, repeatAction: "", repeatCount: 0, lastAction: "", turnRecovery: 0
      },
      opponent: {
        pos: { x: 2, y: 0 }, hp: maxHp(opponent), maxHp: maxHp(opponent), stamina: maxStamina(opponent), maxStamina: maxStamina(opponent),
        landed: 0, thrown: 0, counterLanded: 0, damage: 0, roundDamage: 0, knockdowns: 0, guard: "", points: 0, roundsWon: 0, repeatAction: "", repeatCount: 0, lastAction: "", turnRecovery: 0
      },
      log: ["Бой начался. Ринг 5×5. Выбери движение, удар, блок или контратаку."],
      actionLog: [],
      roundLog: [],
      finished: false,
      purse: tournamentSession ? 0 : computePurse(p, opponent),
      winChance: estimateWinChanceWithContext(state, p, opponent, tournamentSession || null),
      count: null
    };
  }

  function buildFightPreview(state, offerId) {
    var offer = findOffer(state, offerId);
    var p = State.player(state);
    var opponent;
    var difficulty;
    var playerInfo;
    var opponentInfo;

    if (!offer || !p) { return null; }
    window.FS.__currentFightState = state;
    window.FS.__currentTournamentSession = null;
    opponent = U.getFighterById(state, offer.opponentId);
    if (!opponent) { return null; }
    difficulty = U.findDifficulty(offer.difficultyId);
    playerInfo = effectiveRatingForFight(state, p, null);
    opponentInfo = effectiveRatingForFight(state, opponent, null);

    return {
      type: "fightPreview",
      offerId: offer.id,
      label: offer.label,
      difficultyLabel: difficulty.label,
      opponentId: opponent.id,
      opponentName: opponent.name,
      rounds: offer.rounds,
      purse: computePurse(p, opponent),
      winChance: estimateWinChanceWithContext(state, p, opponent, null),
      playerRating: playerInfo.total,
      opponentRating: opponentInfo.total,
      playerPersonalRating: playerInfo.personal,
      opponentPersonalRating: opponentInfo.personal,
      playerCoachBonus: playerInfo.bonus,
      opponentCoachBonus: opponentInfo.bonus,
      playerRecord: U.recordText(p.record),
      opponentRecord: U.recordText(opponent.record),
      weightClassLabel: U.formatWeightClass(p.weightClassId),
      opponentTier: window.FS.Matchmaking ? window.FS.Matchmaking.careerTier(opponent).label : "Боец",
      opponentStage: window.FS.Matchmaking ? window.FS.Matchmaking.careerStage(opponent).label : "Базовый уровень"
    };
  }

  function buildActiveModal(state, session) {
    var p = State.player(state);
    var opponent = U.getFighterById(state, session.opponentId);
    return {
      type: "activeFight",
      session: session,
      opponentName: opponent ? opponent.name : "Соперник",
      playerName: p ? p.name : "Ты",
      round: session.round,
      roundsTotal: session.roundsTotal,
      turn: session.turn,
      ringSize: RING_SIZE,
      player: session.player,
      opponent: session.opponent,
      actions: opponent ? punchActionsForModal(p, opponent, session) : [],
      canCounter: session.player.lastAction !== "counter" && session.player.stamina >= 7,
      log: session.log.slice(-10),
      purse: session.purse,
      winChance: session.winChance,
      tournament: !!session.tournamentSession
    };
  }

  function startInteractiveFight(state, offerId) {
    window.FS.__currentFightState = state;
    window.FS.__currentTournamentSession = null;
    var p = State.player(state);
    var offer = findOffer(state, offerId);
    var opponent;
    var session;
    if (!p || !offer) { return false; }
    if (State.isLockedByFatigue && State.isLockedByFatigue(state)) { return State.fatigueLockedModal ? State.fatigueLockedModal(state) : false; }
    opponent = U.getFighterById(state, offer.opponentId);
    if (!opponent) { return false; }
    session = createSession(state, offer, opponent);
    state.modal = buildActiveModal(state, session);
    return true;
  }

  function moveToward(from, to) {
    var next = { x: from.x, y: from.y };
    if (Math.abs(to.x - from.x) > Math.abs(to.y - from.y)) { next.x += to.x > from.x ? 1 : -1; }
    else if (to.y !== from.y) { next.y += to.y > from.y ? 1 : -1; }
    else if (to.x !== from.x) { next.x += to.x > from.x ? 1 : -1; }
    return clampPosition(next);
  }

  function samePos(a, b) { return a.x === b.x && a.y === b.y; }

  function tryMove(actorState, otherState, dx, dy) {
    var next = clampPosition({ x: actorState.pos.x + dx, y: actorState.pos.y + dy });
    if (samePos(next, otherState.pos)) { return false; }
    actorState.pos = next;
    spendStamina(actorState, 3);
    return true;
  }

  function executePunch(attacker, defender, attackerState, defenderState, punchId, labels, session) {
    var punch = PUNCHES[punchId] || PUNCHES.jabHead;
    var chance;
    var roll;
    var damage;
    var stamDamage;
    var line;
    attackerState.guard = "";
    markTurnRecovery(attackerState, 0.06);

    if (!canUsePunch(punch, attackerState, defenderState)) {
      recoverStamina(attackerState, 3);
      line = labels.attacker + " не достаёт: нужна другая дистанция или больше стамины.";
      session.log.push(line);
      return { hit: false, damage: 0, line: line, failed: true };
    }

    registerAction(attackerState, punchId);
    attackerState.thrown = (Number(attackerState.thrown) || 0) + 1;
    spendStamina(attackerState, punch.stamina);
    chance = hitChance(attacker, defender, punch, attackerState, defenderState);
    roll = U.randomInt(1, 100);

    if (roll <= chance) {
      damage = punchDamage(attacker, defender, punch, attackerState, defenderState);
      stamDamage = staminaDamage(attacker, punch, damage, defenderState);
      defenderState.hp = U.clamp(defenderState.hp - damage, 0, defenderState.maxHp);
      defenderState.stamina = U.clamp(defenderState.stamina - stamDamage, 0, defenderState.maxStamina);
      attackerState.landed += 1;
      attackerState.damage += damage;
      attackerState.roundDamage += damage;
      line = labels.attacker + ": " + punch.label + ". Попадание. Урон " + damage + ", стамина " + labels.defenderGen + " -" + stamDamage + ". HP " + labels.defenderGen + ": " + defenderState.hp + "/" + defenderState.maxHp + ".";
    } else {
      damage = 0;
      line = labels.attacker + ": " + punch.label + ". Мимо. Стамина -" + punch.stamina + ".";
    }

    session.log.push(line);
    session.actionLog = session.actionLog instanceof Array ? session.actionLog : [];
    session.actionLog.push("Раунд " + session.round + ", ход " + session.turn + ": " + line);

    if (!damage && defenderState.guard === "counter" && defenderState.stamina >= 8 && U.randomInt(1, 100) <= Math.round(45 * repeatPenalty(defenderState, "counter"))) {
      spendStamina(defenderState, 8);
      markTurnRecovery(defenderState, 0.10);
      defenderState.thrown = (Number(defenderState.thrown) || 0) + 1;
      defenderState.counterLanded = (Number(defenderState.counterLanded) || 0) + 1;
      damage = U.clamp(Math.round((defender.stats.technique * 0.12 + defender.stats.speed * 0.08 + U.randomInt(2, 8)) * repeatPenalty(defenderState, "counter")), 2, 22);
      attackerState.hp = U.clamp(attackerState.hp - damage, 0, attackerState.maxHp);
      defenderState.landed += 1;
      defenderState.damage += damage;
      defenderState.roundDamage += damage;
      line = labels.defender + " ловит контратаку. Урон " + damage + ". HP " + labels.attackerGen + ": " + attackerState.hp + "/" + attackerState.maxHp + ".";
      session.log.push(line);
      session.actionLog.push("Раунд " + session.round + ", ход " + session.turn + ": " + line);
    }

    return { hit: roll <= chance, damage: damage, line: line };
  }

  function checkKnockdown(session, side) {
    var target = side === "player" ? session.player : session.opponent;
    var scorer = side === "player" ? session.opponent : session.player;
    if (target.hp > 0) { return false; }
    recoverPercent(target, 0.10);
    recoverPercent(scorer, 0.20);
    session.count = { side: side, count: 0 };
    session.log.push((side === "player" ? "Ты падаешь" : "Соперник падает") + ". Судья начинает отсчёт. Упавший восстанавливает 10% стамины, уронивший — 20%.");
    return true;
  }

  function scoreRound(session) {
    var p = session.player;
    var o = session.opponent;
    var playerWins = p.roundDamage >= o.roundDamage;
    var scoreP = playerWins ? 10 : 9;
    var scoreO = playerWins ? 9 : 10;
    if (p.roundDamage === o.roundDamage) {
      scoreP = 10; scoreO = 10;
    }
    p.points += scoreP;
    o.points += scoreO;
    if (scoreP > scoreO) { p.roundsWon += 1; }
    if (scoreO > scoreP) { o.roundsWon += 1; }
    session.log.push("Раунд " + session.round + " завершён.");
    p.roundDamage = 0;
    o.roundDamage = 0;
  }

  function nextRoundOrFinish(state, session) {
    if (session.round >= session.roundsTotal) {
      return finishInteractiveFight(state, session, "decision");
    }
    session.round += 1;
    session.turn = 1;
    session.player.guard = "";
    session.opponent.guard = "";
    session.player.pos = { x: 2, y: 4 };
    session.opponent.pos = { x: 2, y: 0 };
    session.player.turnRecovery = 0;
    session.opponent.turnRecovery = 0;
    recoverPercent(session.player, 0.30);
    recoverPercent(session.opponent, 0.30);
    session.log.push("Раунд " + session.round + ". Бойцы возвращаются в углы и восстанавливают 30% стамины.");
    state.modal = buildActiveModal(state, session);
    return true;
  }

  function endTurn(state, session) {
    session.player.guard = session.player.guard === "block" || session.player.guard === "counter" ? session.player.guard : "";
    session.opponent.guard = session.opponent.guard === "block" || session.opponent.guard === "counter" ? session.opponent.guard : "";
    if (session.count) { state.modal = buildCountModal(state, session); return true; }
    session.turn += 1;
    recoverTurnStamina(session.player);
    recoverTurnStamina(session.opponent);
    if (session.turn > session.maxTurns) {
      scoreRound(session);
      if (session.round >= session.roundsTotal) {
        return finishInteractiveFight(state, session, "decision_scored");
      }
      return nextRoundOrFinish(state, session);
    }
    state.modal = buildActiveModal(state, session);
    return true;
  }

  function opponentAiAction(state, session) {
    var p = State.player(state);
    var opponent = U.getFighterById(state, session.opponentId);
    var d = distance(session.opponent.pos, session.player.pos);
    var punchIds;
    var punchId;
    var next;

    session.opponent.guard = "";

    if (d > 2) {
      next = moveToward(session.opponent.pos, session.player.pos);
      if (!samePos(next, session.player.pos)) {
        registerAction(session.opponent, "move");
        markTurnRecovery(session.opponent, 0.06);
        session.opponent.pos = next;
        spendStamina(session.opponent, 3);
        session.log.push(opponent.name + " смещается ближе.");
      }
      return;
    }

    if (session.opponent.stamina < 12 && U.randomInt(1, 100) <= 60) {
      registerAction(session.opponent, "block");
      markTurnRecovery(session.opponent, 0.20);
      session.opponent.guard = "block";
      session.log.push(opponent.name + " берёт блок и восстанавливает дыхание.");
      return;
    }

    punchIds = d <= 1 ? ["jabHead", "jabBody", "hook", "uppercut"] : ["jabHead", "jabBody"];
    punchId = punchIds[U.randomInt(0, punchIds.length - 1)];
    executePunch(opponent, p, session.opponent, session.player, punchId, {
      attacker: opponent.name,
      defender: "ты",
      attackerGen: "соперника",
      defenderGen: "твой"
    }, session);
    checkKnockdown(session, "player");
  }

  function playerAction(state, action, dx, dy) {
    var modal = state.modal;
    var session = modal && modal.session;
    var p = State.player(state);
    var opponent = session ? U.getFighterById(state, session.opponentId) : null;
    var moved;

    if (!session || modal.type !== "activeFight") { return false; }

    session.player.guard = "";
    if (action === "move") {
      registerAction(session.player, "move");
      markTurnRecovery(session.player, 0.06);
      moved = tryMove(session.player, session.opponent, Number(dx) || 0, Number(dy) || 0);
      session.log.push(moved ? "Ты смещаешься по рингу." : "Туда нельзя сместиться.");
    } else if (action === "block") {
      registerAction(session.player, "block");
      markTurnRecovery(session.player, 0.20);
      session.player.guard = "block";
      session.log.push("Ты ставишь блок и восстанавливаешь дыхание.");
    } else if (action === "counter") {
      if (session.player.lastAction === "counter") {
        session.log.push("Две контратаки подряд использовать нельзя.");
        state.modal = buildActiveModal(state, session);
        return true;
      }
      registerAction(session.player, "counter");
      markTurnRecovery(session.player, 0.10);
      session.player.guard = "counter";
      session.log.push("Ты готовишь контратаку и экономишь стамину.");
    } else if (PUNCHES[action]) {
      executePunch(p, opponent, session.player, session.opponent, action, {
        attacker: "Ты",
        defender: opponent.name,
        attackerGen: "твой",
        defenderGen: "соперника"
      }, session);
      if (checkKnockdown(session, "opponent")) { state.modal = buildCountModal(state, session); return true; }
    } else {
      return false;
    }

    opponentAiAction(state, session);
    if (session.count) { state.modal = buildCountModal(state, session); return true; }
    return endTurn(state, session);
  }

  function buildCountModal(state, session) {
    var side = session.count ? session.count.side : "";
    var p = State.player(state);
    var opponent = U.getFighterById(state, session.opponentId);
    return {
      type: "fightCount",
      session: session,
      side: side,
      count: session.count ? session.count.count : 0,
      playerName: p ? p.name : "Ты",
      opponentName: opponent ? opponent.name : "Соперник",
      player: session.player,
      opponent: session.opponent,
      log: session.log.slice(-10)
    };
  }

  function handleCount(state) {
    var modal = state.modal;
    var session = modal && modal.session;
    var side;
    var target;
    var previousKnockdowns;
    var standChance;

    if (!session || !session.count) { return false; }
    side = session.count.side;
    target = side === "player" ? session.player : session.opponent;
    previousKnockdowns = Number(target.knockdowns) || 0;
    standChance = knockdownStandChance(previousKnockdowns);
    session.count.count += 1;

    if (session.count.count >= 10) {
      session.log.push("Счёт 10. Нокаут.");
      return finishInteractiveFight(state, session, side === "player" ? "opponent_ko" : "player_ko");
    }

    if (session.count.count < 8) {
      session.log.push("Счёт " + session.count.count + ". Боец пытается прийти в себя. Шанс пережить этот нокдаун: " + standChance + "%.");
      state.modal = buildCountModal(state, session);
      return true;
    }

    if (!session.count.rollDone) {
      session.count.rollDone = true;
      session.log.push("Счёт " + session.count.count + ". Критический момент. Шанс подняться после нокдауна: " + standChance + "%.");

      if (U.randomInt(1, 100) <= standChance) {
        target.knockdowns += 1;
        target.hp = Math.max(10, Math.round(target.maxHp * 0.24));
        target.stamina = Math.max(target.stamina, Math.round(target.maxStamina * 0.10));
        session.log.push((side === "player" ? "Ты поднимаешься" : "Соперник поднимается") + ". Бой продолжается.");
        session.count = null;
        return endTurn(state, session);
      }

      session.log.push((side === "player" ? "Ты не успеваешь подняться сразу" : "Соперник не успевает подняться сразу") + ".");
    } else {
      session.log.push("Счёт " + session.count.count + ". Боец всё ещё на настиле.");
    }

    state.modal = buildCountModal(state, session);
    return true;
  }

  function decisionMargin(scoreLine) {
    var match;
    if (!scoreLine) { return 99; }
    match = String(scoreLine).match(/(\d+)\s*:\s*(\d+)/);
    if (!match) { return 99; }
    return Math.abs((Number(match[1]) || 0) - (Number(match[2]) || 0));
  }

  function isCloseFight(result, method, scoreLine) {
    if (result === "Ничья") { return true; }
    if (method === "KO/TKO") { return false; }
    return decisionMargin(scoreLine) <= 2;
  }

  function safeCreateFightNews(state, text, meta) {
    if (window.FS.World && window.FS.World.createNews) {
      window.FS.World.createNews(state, "fight", text, meta || {});
    }
  }

  function updatePlayerCareerStats(state, p, opponent, result, method) {
    var stats;
    var playerOvr;
    var opponentOvr;
    if (!p || !opponent) { return; }
    p.careerStats = p.careerStats && typeof p.careerStats === "object" ? p.careerStats : {};
    stats = p.careerStats;
    playerOvr = U.statAverage(p.stats);
    opponentOvr = U.statAverage(opponent.stats);

    stats.bestWinStreak = Number(stats.bestWinStreak) || 0;
    stats.currentWinStreak = Number(stats.currentWinStreak) || 0;
    stats.currentLossStreak = Number(stats.currentLossStreak) || 0;
    stats.rematchWins = Number(stats.rematchWins) || 0;
    stats.rematchLosses = Number(stats.rematchLosses) || 0;
    stats.rematchDraws = Number(stats.rematchDraws) || 0;
    stats.strongerWins = Number(stats.strongerWins) || 0;
    stats.bestDefeatedOvr = Number(stats.bestDefeatedOvr) || 0;
    stats.lastFightResult = result;
    stats.lastFightMethod = method;
    stats.lastFightWeek = state.week;

    if (result === "Победа") {
      stats.currentWinStreak += 1;
      stats.currentLossStreak = 0;
      stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.currentWinStreak);
      if (opponentOvr > playerOvr) {
        stats.strongerWins += 1;
        stats.bestDefeatedOvr = Math.max(stats.bestDefeatedOvr, opponentOvr);
      }
    } else if (result === "Поражение") {
      stats.currentLossStreak += 1;
      stats.currentWinStreak = 0;
    } else {
      stats.currentWinStreak = 0;
      stats.currentLossStreak = 0;
    }
  }

  function updatePlayerRivalry(state, p, opponent, result, method, scoreLine) {
    var rivalries;
    var key;
    var item;
    var close;
    var playerOvr;
    var opponentOvr;
    var note;
    var wasRematch;
    if (!state || !p || !opponent || opponent.isPlayer) { return; }

    state.world = state.world && typeof state.world === "object" ? state.world : {};
    rivalries = state.world.playerRivalries && typeof state.world.playerRivalries === "object" ? state.world.playerRivalries : {};
    state.world.playerRivalries = rivalries;

    key = opponent.id;
    item = rivalries[key] || {
      opponentId: opponent.id,
      trackId: opponent.trackId,
      firstWeek: state.week,
      fights: 0,
      playerWins: 0,
      opponentWins: 0,
      draws: 0,
      closeFights: 0,
      rematchWeek: 0
    };

    wasRematch = item.fights > 0;
    close = isCloseFight(result, method, scoreLine);
    playerOvr = U.statAverage(p.stats);
    opponentOvr = U.statAverage(opponent.stats);

    item.fights += 1;
    item.lastWeek = state.week;
    item.lastResult = result;
    item.lastMethod = method;
    item.lastScoreLine = scoreLine || "";
    item.lastPlayerOvr = playerOvr;
    item.lastOpponentOvr = opponentOvr;
    item.rematchAnnouncedWeek = 0;

    if (result === "Победа") { item.playerWins += 1; }
    else if (result === "Поражение") { item.opponentWins += 1; }
    else { item.draws += 1; }

    if (close) { item.closeFights += 1; }

    if ((close || wasRematch) && p.trackId !== "pro") {
      item.rematchWeek = state.week + U.randomInt(4, 8);
    }

    rivalries[key] = item;

    if (close || wasRematch) {
      note = wasRematch ?
        ("Реванш · счёт " + item.playerWins + "-" + item.opponentWins + "-" + item.draws) :
        "Близкий бой · реванш возможен";
      if (window.FS.Clubs && window.FS.Clubs.rememberPlayerRival) {
        window.FS.Clubs.rememberPlayerRival(state, opponent, note);
      }
    }

    if (close) {
      safeCreateFightNews(state, "Близкий бой: " + p.name + " — " + opponent.name + " · " + result + " (" + (scoreLine || method) + ").", { fighterId: p.id, opponentId: opponent.id, firstId: p.id, secondId: opponent.id });
    }

    if (wasRematch) {
      if (p.careerStats) {
        if (result === "Победа") { p.careerStats.rematchWins = (Number(p.careerStats.rematchWins) || 0) + 1; }
        else if (result === "Поражение") { p.careerStats.rematchLosses = (Number(p.careerStats.rematchLosses) || 0) + 1; }
        else { p.careerStats.rematchDraws = (Number(p.careerStats.rematchDraws) || 0) + 1; }
      }
      safeCreateFightNews(state, "Реванш: " + p.name + " снова встретился с " + opponent.name + ". Счёт серии " + item.playerWins + "-" + item.opponentWins + "-" + item.draws + ".", { fighterId: p.id, opponentId: opponent.id, firstId: p.id, secondId: opponent.id });
    }

    if (result === "Победа" && opponentOvr >= playerOvr + 6) {
      safeCreateFightNews(state, "Апсет: " + p.name + " победил соперника выше себя — " + opponent.name + " · OVR " + opponentOvr + ".", { fighterId: p.id, opponentId: opponent.id, firstId: p.id, secondId: opponent.id });
    }

    if (p.careerStats && p.careerStats.currentWinStreak && p.careerStats.currentWinStreak >= 3 && [3, 5, 8, 12].indexOf(p.careerStats.currentWinStreak) !== -1) {
      safeCreateFightNews(state, "Серия побед: " + p.name + " выиграл " + p.careerStats.currentWinStreak + " боя подряд.", { fighterId: p.id });
    }
  }

  function recordPlayerEngagement(state, p, opponent, result, method, scoreLine) {
    updatePlayerCareerStats(state, p, opponent, result, method);
    updatePlayerRivalry(state, p, opponent, result, method, scoreLine);
  }

  function applyFightResult(state, p, opponent, result, method, scoreLine) {
    var wasRematch;
    if (!p || !opponent) { return false; }
    wasRematch = p.recentOpponentIds instanceof Array && p.recentOpponentIds.indexOf(opponent.id) !== -1;
    p.record = p.record || { wins: 0, losses: 0, draws: 0, kos: 0 };
    opponent.record = opponent.record || { wins: 0, losses: 0, draws: 0, kos: 0 };
    p.careerLog = p.careerLog instanceof Array ? p.careerLog : [];
    opponent.careerLog = opponent.careerLog instanceof Array ? opponent.careerLog : [];
    state.offers = state.offers instanceof Array ? state.offers : [];
    state.world = state.world && typeof state.world === "object" ? state.world : {};

    if (result === "Ничья") {
      p.record.draws = (Number(p.record.draws) || 0) + 1;
      opponent.record.draws = (Number(opponent.record.draws) || 0) + 1;
    } else if (result === "Победа") {
      p.record.wins = (Number(p.record.wins) || 0) + 1;
      opponent.record.losses = (Number(opponent.record.losses) || 0) + 1;
      if (method === "KO/TKO") { p.record.kos = (Number(p.record.kos) || 0) + 1; }
    } else {
      p.record.losses = (Number(p.record.losses) || 0) + 1;
      opponent.record.wins = (Number(opponent.record.wins) || 0) + 1;
      if (method === "KO/TKO") { opponent.record.kos = (Number(opponent.record.kos) || 0) + 1; }
    }

    if (p.trackRecords) { p.trackRecords[p.trackId] = window.FS.State.cloneRecord(p.record); }
    if (opponent.trackRecords) { opponent.trackRecords[opponent.trackId] = window.FS.State.cloneRecord(opponent.record); }

    State.updateDerivedFighterFields(p);
    State.updateDerivedFighterFields(opponent);

    p.recentOpponentIds = p.recentOpponentIds instanceof Array ? p.recentOpponentIds : [];
    opponent.recentOpponentIds = opponent.recentOpponentIds instanceof Array ? opponent.recentOpponentIds : [];
    p.recentOpponentIds.unshift(opponent.id);
    opponent.recentOpponentIds.unshift(p.id);
    if (p.recentOpponentIds.length > 8) { p.recentOpponentIds.length = 8; }
    if (opponent.recentOpponentIds.length > 8) { opponent.recentOpponentIds.length = 8; }

    recordPlayerEngagement(state, p, opponent, result, method, scoreLine || "");
    if (State.recordCoachGoalEvent) {
      State.recordCoachGoalEvent(state, "fight", {
        result: result,
        method: method,
        scoreLine: scoreLine || "",
        opponentId: opponent.id,
        playerOvr: U.statAverage(p.stats),
        opponentOvr: U.statAverage(opponent.stats),
        isRematch: wasRematch
      });
    }

    if (window.FS.Clubs && window.FS.Clubs.recordClubFight) {
      if (result === "Ничья") { window.FS.Clubs.recordClubFight(state, p, opponent, true); }
      else { window.FS.Clubs.recordClubFight(state, result === "Победа" ? p : opponent, result === "Победа" ? opponent : p, false); }
    }
    if (window.FS.Clubs && window.FS.Clubs.syncCoachRecords) { window.FS.Clubs.syncCoachRecords(state); }
    if (State.invalidateCaches) { State.invalidateCaches(state); }
    return true;
  }

  function completeFightEconomy(state, p, opponent, result, purse, fatigue) {
    var pointMod = 1;
    var club = window.FS.Clubs && window.FS.Clubs.playerClub ? window.FS.Clubs.playerClub(state) : null;
    var gained;
    var ratingDiff;
    var diffBonus;
    var finalFatigue;
    if (club) { pointMod = Number(club.trainingModifier) || 1; }
    ratingDiff = U.statAverage(opponent.stats) - U.statAverage(p.stats);
    if (result === "Победа") {
      diffBonus = U.clamp(Math.round(ratingDiff / 8), -3, 5);
      gained = U.clamp(5 + diffBonus, 2, 11);
    } else if (result === "Ничья") {
      diffBonus = U.clamp(Math.round(ratingDiff / 12), -1, 3);
      gained = U.clamp(3 + diffBonus, 2, 6);
    } else {
      diffBonus = U.clamp(Math.round(ratingDiff / 16), 0, 2);
      gained = 2 + diffBonus;
    }
    p.trainingPoints = (Number(p.trainingPoints) || 0) + Math.max(1, Math.round(gained * pointMod));
    if (State.addMoney) { State.addMoney(state, purse, "Гонорар за бой"); } else { p.money = (Number(p.money) || 0) + purse; }
    finalFatigue = typeof fatigue === "number" ? fatigue : (Data.economy && Data.economy.fatigue ? (Number(Data.economy.fatigue.fight) || 25) : 25);
    if (State.adjustFatigue) { State.adjustFatigue(state, finalFatigue, "Бой"); }
    if (result === "Победа" && window.FS.Titles && window.FS.Titles.unifyBeltsAfterFight) { window.FS.Titles.unifyBeltsAfterFight(state, p.id, opponent.id); }
  }

  function advanceAfterFight(state) {
    try {
      if (World && World.advanceWeek) {
        World.advanceWeek(state, "fight");
      } else {
        state.week = (Number(state.week) || 1) + 1;
      }
    } catch (error) {
      console.error("advanceWeek after fight failed:", error);
      state.week = (Number(state.week) || 1) + 1;
      state.feed = "Бой завершён. Недельный ход мира был восстановлен после ошибки.";
      state.offers = state.offers instanceof Array ? state.offers : [];
      try {
        if (World && World.refreshOffers) { World.refreshOffers(state); }
      } catch (refreshError) {
        console.error("refreshOffers after fight failed:", refreshError);
      }
    }
  }

  function finishInteractiveFight(state, session, reason) {
    var p = State.player(state);
    var opponent = U.getFighterById(state, session.opponentId);
    var offer = findOffer(state, session.offerId);
    var result;
    var method;
    var scoreLine;
    var knockdown = null;

    if (!p || !opponent) { return false; }

    if (reason === "player_ko") { result = "Победа"; method = "KO/TKO"; scoreLine = "нокаут"; knockdown = { round: session.round, by: "player" }; }
    else if (reason === "opponent_ko") { result = "Поражение"; method = "KO/TKO"; scoreLine = "нокаут"; knockdown = { round: session.round, by: "opponent" }; }
    else {
      if (reason !== "decision_scored") { scoreRound(session); }
      method = "решение судей";
      scoreLine = session.player.points + ":" + session.opponent.points;
      if (session.player.points > session.opponent.points) { result = "Победа"; }
      else if (session.player.points < session.opponent.points) { result = "Поражение"; }
      else { result = "Ничья"; }
    }

    if (session.tournamentSession && window.FS.Amateur && window.FS.Amateur.completeTournamentFightFromRing) {
      state.modal = window.FS.Amateur.completeTournamentFightFromRing(state, session, {
        result: result,
        method: method,
        scoreLine: scoreLine,
        knockdown: knockdown,
        playerRating: effectiveRatingForFight(state, p, session.tournamentSession || null).total,
        opponentRating: effectiveRatingForFight(state, opponent, session.tournamentSession || null).total,
        playerPersonalRating: U.statAverage(p.stats),
        opponentPersonalRating: U.statAverage(opponent.stats),
        playerCoachBonus: effectiveRatingForFight(state, p, session.tournamentSession || null).bonus,
        opponentCoachBonus: effectiveRatingForFight(state, opponent, session.tournamentSession || null).bonus,
        statsLine: "Урон: " + session.player.damage + ":" + session.opponent.damage + ". Удары: " + (session.player.landed || 0) + "/" + (session.player.thrown || 0) + " — " + (session.opponent.landed || 0) + "/" + (session.opponent.thrown || 0) + ". Контратаки: " + (session.player.counterLanded || 0) + ":" + (session.opponent.counterLanded || 0) + ". HP: " + session.player.hp + "/" + session.player.maxHp + " — " + session.opponent.hp + "/" + session.opponent.maxHp + ".",
        roundLog: (session.actionLog || []).slice(-60),
        winChance: session.winChance
      });
      return true;
    }

    applyFightResult(state, p, opponent, result, method, scoreLine);
    completeFightEconomy(state, p, opponent, result, session.purse || (p.contractPurse || 0));
    if (p.contractOpponentId === opponent.id) {
      state.world.proContractHistory = state.world.proContractHistory instanceof Array ? state.world.proContractHistory : [];
      state.world.proContractHistory.unshift({ week: state.week, text: "Контрактный бой завершён: " + result + " против " + opponent.name + "." });
      if (window.FS.World && window.FS.World.clearProContract) { window.FS.World.clearProContract(p); }
      if (state.world) { state.world.pendingProFight = null; }
    }
    p.lastFightWeek = state.week;
    opponent.lastFightWeek = state.week;
    p.careerLog = p.careerLog instanceof Array ? p.careerLog : [];
    opponent.careerLog = opponent.careerLog instanceof Array ? opponent.careerLog : [];
    p.careerLog.unshift({ week: state.week, text: result + " против " + opponent.name + ", " + method, meta: { fighterId: opponent.id, opponentId: opponent.id, result: result, method: method } });
    opponent.careerLog.unshift({ week: state.week, text: (result === "Победа" ? "Поражение от " : (result === "Поражение" ? "Победа над " : "Ничья с ")) + p.name + ", " + method, meta: { fighterId: p.id, opponentId: p.id, result: result === "Победа" ? "Поражение" : (result === "Поражение" ? "Победа" : "Ничья"), method: method } });

    state.offers = state.offers instanceof Array ? state.offers : [];
    if (offer) {
      state.offers = state.offers instanceof Array ? state.offers : [];
    state.offers = state.offers.filter(function (existingOffer) { return existingOffer.id !== offer.id; });
    }

    advanceAfterFight(state);

    state.modal = {
      type: "fightResult",
      result: result,
      method: method,
      scoreLine: scoreLine,
      opponentName: opponent.name,
      week: state.week,
      playerRating: U.statAverage(p.stats),
      opponentRating: U.statAverage(opponent.stats),
      purse: session.purse,
      winChance: session.winChance,
      roundLog: session.roundLog.concat(session.log.slice(-12)),
      knockdown: knockdown,
      statsLine: "Урон: " + session.player.damage + ":" + session.opponent.damage + ". Попадания: " + session.player.landed + ":" + session.opponent.landed + ". HP: " + session.player.hp + "/" + session.player.maxHp + " — " + session.opponent.hp + "/" + session.opponent.maxHp + ". Стамина: " + session.player.stamina + "/" + session.player.maxStamina + " — " + session.opponent.stamina + "/" + session.opponent.maxStamina + "."
    };
    return true;
  }

  function simulateRounds(player, opponent, rounds) {
    var fakeState = { week: 0 };
    var session = {
      roundsTotal: rounds,
      round: 1,
      turn: 1,
      maxTurns: 10,
      player: { pos: { x: 2, y: 4 }, hp: maxHp(player), maxHp: maxHp(player), stamina: maxStamina(player), maxStamina: maxStamina(player), landed: 0, damage: 0, roundDamage: 0, knockdowns: 0, guard: "", points: 0, roundsWon: 0 },
      opponent: { pos: { x: 2, y: 0 }, hp: maxHp(opponent), maxHp: maxHp(opponent), stamina: maxStamina(opponent), maxStamina: maxStamina(opponent), landed: 0, damage: 0, roundDamage: 0, knockdowns: 0, guard: "", points: 0, roundsWon: 0 },
      log: [],
      roundLog: [],
      count: null
    };
    var round, turn, punchIds, punchId;

    for (round = 1; round <= rounds; round += 1) {
      session.round = round;
      for (turn = 1; turn <= session.maxTurns; turn += 1) {
        session.turn = turn;
        if (distance(session.player.pos, session.opponent.pos) > 2) { session.player.pos = moveToward(session.player.pos, session.opponent.pos); }
        else {
          punchIds = distance(session.player.pos, session.opponent.pos) <= 1 ? ["jabHead", "jabBody", "hook", "uppercut"] : ["jabHead", "jabBody"];
          punchId = punchIds[U.randomInt(0, punchIds.length - 1)];
          executePunch(player, opponent, session.player, session.opponent, punchId, { attacker: fighterLabel(player, "Ты"), defender: opponent.name, attackerGen: "твой", defenderGen: "соперника" }, session);
          if (session.opponent.hp <= 0) { return autoReturn(session, "player"); }
        }
        opponentAiAuto(player, opponent, session);
        if (session.player.hp <= 0) { return autoReturn(session, "opponent"); }
      }
      scoreRound(session);
      recoverStamina(session.player, 22);
      recoverStamina(session.opponent, 22);
    }
    return autoReturn(session, "decision");
  }

  function opponentAiAuto(player, opponent, session) {
    var d = distance(session.opponent.pos, session.player.pos);
    var punchIds;
    var punchId;
    if (d > 2) { session.opponent.pos = moveToward(session.opponent.pos, session.player.pos); return; }
    punchIds = d <= 1 ? ["jabHead", "jabBody", "hook", "uppercut"] : ["jabHead", "jabBody"];
    punchId = punchIds[U.randomInt(0, punchIds.length - 1)];
    executePunch(opponent, player, session.opponent, session.player, punchId, { attacker: fighterLabel(opponent, "Соперник"), defender: "ты", attackerGen: "соперника", defenderGen: "твой" }, session);
  }

  function autoReturn(session, stoppageWinner) {
    var stoppage = null;
    if (stoppageWinner === "player") { stoppage = { winner: "player", round: session.round, turn: session.turn }; }
    if (stoppageWinner === "opponent") { stoppage = { winner: "opponent", round: session.round, turn: session.turn }; }
    return {
      playerRounds: session.player.roundsWon,
      opponentRounds: session.opponent.roundsWon,
      playerPoints: session.player.points,
      opponentPoints: session.opponent.points,
      playerLanded: session.player.landed,
      opponentLanded: session.opponent.landed,
      playerDamage: session.player.damage,
      opponentDamage: session.opponent.damage,
      playerHpLeft: session.player.hp,
      opponentHpLeft: session.opponent.hp,
      playerMaxHp: session.player.maxHp,
      opponentMaxHp: session.opponent.maxHp,
      log: session.roundLog.concat(session.log.slice(-20)),
      knockdown: stoppage ? { round: stoppage.round, by: stoppage.winner } : null,
      stoppage: stoppage
    };
  }

  function autoKoChance(fighter, opponent) {
    var track = fighter.trackId || "amateur";
    var powerEdge = U.clamp((Number(fighter.stats.power) || 0) - (Number(opponent.stats.defense || opponent.stats.health || 0) || 0), -60, 80);
    var base;
    if (track === "street") { base = 50 + U.randomInt(0, 25); }
    else if (track === "pro") { base = 34 + U.randomInt(0, 22); }
    else { base = 8 + U.randomInt(0, 16); }
    return U.clamp(Math.round(base + powerEdge * 0.18), track === "amateur" ? 6 : 18, track === "street" ? 90 : (track === "pro" ? 80 : 30));
  }

  function autoDecisionScore(result, rounds) {
    var r = rounds || 3;
    if (result === "Ничья") { return Math.floor(r / 2) + ":" + Math.floor(r / 2); }
    if (r <= 3) { return result === "Победа" ? "2:1" : "1:2"; }
    if (r <= 8) { return result === "Победа" ? U.randomInt(Math.ceil(r/2)+1, r) + ":" + U.randomInt(0, Math.floor(r/2)) : U.randomInt(0, Math.floor(r/2)) + ":" + U.randomInt(Math.ceil(r/2)+1, r); }
    return result === "Победа" ? "116:112" : "112:116";
  }

  function resolveRandomFight(state, offerId) {
    window.FS.__currentFightState = state;
    var offer = findOffer(state, offerId);
    var p = State.player(state);
    var opponent;
    var chance;
    var result;
    var method;
    var purse;
    var koChance;
    var scoreLine;
    var rounds;
    if (!offer || !p) { return false; }
    if (State.isLockedByFatigue && State.isLockedByFatigue(state)) { return State.fatigueLockedModal ? State.fatigueLockedModal(state) : false; }
    opponent = U.getFighterById(state, offer.opponentId);
    if (!opponent) { return false; }
    chance = estimateWinChance(p, opponent);
    result = U.randomInt(1, 100) <= chance ? "Победа" : "Поражение";
    koChance = result === "Победа" ? autoKoChance(p, opponent) : autoKoChance(opponent, p);
    method = U.randomInt(1, 100) <= koChance ? "KO/TKO" : "решение судей";
    rounds = offer.rounds || U.findTrack(p.trackId).rounds;
    scoreLine = method === "KO/TKO" ? ("KO/TKO, раунд " + U.randomInt(1, Math.max(1, rounds))) : ("решение " + autoDecisionScore(result, rounds));
    purse = computePurse(p, opponent);
    applyFightResult(state, p, opponent, result, method, scoreLine);
    completeFightEconomy(state, p, opponent, result, purse, Data.economy && Data.economy.fatigue ? (Number(Data.economy.fatigue.fight) || 25) : 25);
    state.offers = state.offers.filter(function (existingOffer) { return existingOffer.id !== offer.id; });
    advanceAfterFight(state);
    state.modal = { type: "fightResult", result: result, method: method, scoreLine: scoreLine + " · шанс " + chance + "%", opponentName: opponent.name, week: state.week, playerRating: effectiveRatingForFight(state, p, null).total, opponentRating: effectiveRatingForFight(state, opponent, null).total, playerPersonalRating: U.statAverage(p.stats), opponentPersonalRating: U.statAverage(opponent.stats), playerCoachBonus: effectiveRatingForFight(state, p, null).bonus, opponentCoachBonus: effectiveRatingForFight(state, opponent, null).bonus, purse: purse, winChance: chance, roundLog: [], knockdown: method === "KO/TKO" ? { round: 1, by: result === "Победа" ? "player" : "opponent" } : null, statsLine: "Бой решён автоматически." };
    return true;
  }

  function startTournamentInteractiveFight(state, tournamentModal) {
    window.FS.__currentFightState = state;
    var p = State.player(state);
    var session = tournamentModal && tournamentModal.session;
    window.FS.__currentTournamentSession = session || null;
    var opponent;
    var fakeOffer;
    var active;
    if (!p || !session || !session.opponentId) { return false; }
    if (State.isLockedByFatigue && State.isLockedByFatigue(state)) { return State.fatigueLockedModal ? State.fatigueLockedModal(state) : false; }
    opponent = U.getFighterById(state, session.opponentId);
    if (!opponent) { return false; }
    fakeOffer = { id: "tournament_" + session.competitionId + "_" + session.roundIndex, opponentId: opponent.id, rounds: 3, purse: 0, difficultyId: "even" };
    active = createSession(state, fakeOffer, opponent, session);
    state.modal = buildActiveModal(state, active);
    return true;
  }

  function skipProContractFight(state) {
    window.FS.__currentFightState = state;
    var p = State.player(state);
    var opponent;
    var fakeOffer;
    var result;

    if (!p || p.trackId !== "pro" || !p.contractOpponentId) { return false; }
    if (state.week < p.nextFightWeek) { return false; }
    opponent = U.getFighterById(state, p.contractOpponentId);
    if (!opponent) { return false; }

    fakeOffer = {
      id: "pro_contract_skip_" + (p.contractId || state.week),
      opponentId: opponent.id,
      rounds: p.contractRounds || U.findTrack("pro").rounds,
      purse: p.contractPurse || computePurse(p, opponent),
      difficultyId: "even"
    };

    state.offers = state.offers instanceof Array ? state.offers : [];
    state.offers.push(fakeOffer);
    result = resolveRandomFight(state, fakeOffer.id);
    state.offers = state.offers.filter(function (offer) { return offer.id !== fakeOffer.id; });
    if (window.FS.World && window.FS.World.clearProContract) { window.FS.World.clearProContract(p); }
    if (state.world) { state.world.pendingProFight = null; }
    return result;
  }

  function startProContractFight(state) {
    window.FS.__currentFightState = state;
    var p = State.player(state);
    var opponent;
    var offer;
    var active;

    if (!p || p.trackId !== "pro" || !p.contractOpponentId) { return false; }
    if (state.week < p.nextFightWeek) { state.feed = "Бой ещё не наступил. Дата: неделя " + p.nextFightWeek + "."; return false; }
    if (State.isLockedByFatigue && State.isLockedByFatigue(state)) { return State.fatigueLockedModal ? State.fatigueLockedModal(state) : false; }

    opponent = U.getFighterById(state, p.contractOpponentId);
    if (!opponent) { state.feed = "Соперник по контракту не найден."; return false; }

    offer = { id: "pro_contract_" + (p.contractId || state.week), opponentId: opponent.id, rounds: p.contractRounds || U.findTrack("pro").rounds, purse: p.contractPurse || computePurse(p, opponent), difficultyId: "even" };
    active = createSession(state, offer, opponent, null);
    state.modal = buildActiveModal(state, active);
    return true;
  }

  function resolvePlayerFight(state, offerId) {
    return startInteractiveFight(state, offerId);
  }

  function buildTitleChallengePreview(state, titleId) {
    var p = State.player(state);
    var title = state.titles ? state.titles[titleId] : null;
    var champion;
    var check;
    if (!p || !title) { return null; }
    check = window.FS.Titles ? window.FS.Titles.playerTitleChallenge(state, titleId) : { eligible: false, reason: "Титулы недоступны." };
    champion = U.getFighterById(state, title.championId);
    if (!champion) { return null; }
    return { type: "titleChallengePreview", titleId: title.id, titleLabel: title.label, eligible: check.eligible, reason: check.reason, championId: champion.id, championName: champion.name, rounds: U.findTrack(title.trackId).rounds, purse: computePurse(p, champion), winChance: estimateWinChance(p, champion), playerRating: U.statAverage(p.stats), championRating: U.statAverage(champion.stats), playerRecord: U.recordText(p.record), championRecord: U.recordText(champion.record), weightClassLabel: U.formatWeightClass(title.weightClassId) };
  }

  function resolveTitleChallenge(state, titleId) {
    var title = state.titles ? state.titles[titleId] : null;
    var p = State.player(state);
    var champion;
    var fakeOffer;
    var beforeWins;
    if (!title || !p || !window.FS.Titles || !window.FS.Titles.playerTitleChallenge(state, titleId).eligible) { state.feed = "Вызов чемпиону сейчас недоступен."; return false; }
    champion = U.getFighterById(state, title.championId);
    if (!champion) { return false; }
    fakeOffer = { id: "title_" + title.id, opponentId: champion.id, rounds: U.findTrack(title.trackId).rounds, purse: computePurse(p, champion), difficultyId: "hard" };
    state.offers.push(fakeOffer);
    beforeWins = p.record.wins;
    resolveRandomFight(state, fakeOffer.id);
    state.offers = state.offers.filter(function (offer) { return offer.id !== fakeOffer.id; });
    if (p.record.wins > beforeWins) { window.FS.Titles.transferTitle(state, title.id, p.id, p.name + " выиграл титульный бой: " + title.label); state.feed = "Ты выиграл титул: " + title.label + "."; }
    return true;
  }

  window.FS.Fight = {
    buildFightPreview: buildFightPreview,
    resolvePlayerFight: resolvePlayerFight,
    startInteractiveFight: startInteractiveFight,
    startTournamentInteractiveFight: startTournamentInteractiveFight,
    startProContractFight: startProContractFight,
    skipProContractFight: skipProContractFight,
    playerAction: playerAction,
    handleCount: handleCount,
    resolveRandomFight: resolveRandomFight,
    resultClass: resultClass,
    estimateWinChance: estimateWinChance,
    estimateWinChanceWithContext: estimateWinChanceWithContext,
    effectiveRatingForFight: effectiveRatingForFight,
    effectiveRatingLabel: effectiveRatingLabel,
    simulateRounds: simulateRounds,
    computePurse: computePurse,
    buildTitleChallengePreview: buildTitleChallengePreview,
    resolveTitleChallenge: resolveTitleChallenge
  };
}());
