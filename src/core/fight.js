(function () {
  "use strict";

  window.FS = window.FS || {};

  var U = window.FS.Utils;
  var Data = window.FS.Data;
  var State = window.FS.State;
  var World = window.FS.World;

  var RING_SIZE = 5;

  var PUNCHES = {
    jabHead: { id: "jabHead", label: "Прямой в голову", minDistance: 1, maxDistance: 2, stamina: 7, hp: 0.72, staminaDamage: 0.10, accuracy: 8 },
    jabBody: { id: "jabBody", label: "Прямой в корпус", minDistance: 1, maxDistance: 2, stamina: 8, hp: 0.50, staminaDamage: 0.30, accuracy: 5 },
    hook: { id: "hook", label: "Хук", minDistance: 1, maxDistance: 1, stamina: 10, hp: 0.95, staminaDamage: 0.14, accuracy: -2 },
    uppercut: { id: "uppercut", label: "Апперкот", minDistance: 1, maxDistance: 1, stamina: 12, hp: 1.10, staminaDamage: 0.12, accuracy: -5 }
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

  function estimateWinChance(player, opponent) {
    var playerScore = U.statAverage(player.stats) + Math.min((player.record.wins || 0) * 0.20, 14) - Math.min((player.record.losses || 0) * 0.14, 9);
    var opponentScore = U.statAverage(opponent.stats) + Math.min((opponent.record.wins || 0) * 0.20, 14) - Math.min((opponent.record.losses || 0) * 0.14, 9);
    var fatiguePenalty = Math.round((Number(player.fatigue) || 0) / 7);
    return U.clamp(50 + Math.round((playerScore - opponentScore) * 2.55) - fatiguePenalty, 8, 90);
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

  function maxHp(fighter) {
    return Math.max(45, Math.round(60 + fighter.stats.stamina * 0.42 + fighter.stats.defense * 0.28));
  }

  function maxStamina(fighter) {
    return Math.max(45, Math.round(55 + fighter.stats.stamina * 0.62 + fighter.stats.speed * 0.12));
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
    return d >= punch.minDistance && d <= punch.maxDistance && attackerState.stamina >= Math.max(1, punch.stamina - 3);
  }

  function hitChance(attacker, defender, punch, attackerState, defenderState) {
    var staminaFactor = attackerState.stamina / attackerState.maxStamina;
    var actionPenalty = repeatPenalty(attackerState, punch.id);
    return U.clamp((40 + attacker.stats.technique * 0.36 + attacker.stats.speed * 0.22 + punch.accuracy + staminaFactor * 10 - defender.stats.defense * 0.25 - defender.stats.speed * 0.10 - blockEffect(defenderState) - counterRisk(defenderState)) * actionPenalty, 5, 92);
  }

  function punchDamage(attacker, defender, punch, attackerState, defenderState) {
    var raw = attacker.stats.power * 0.22 + attacker.stats.technique * 0.10 + punch.stamina * 0.55 + U.randomInt(1, 6);
    var block = defender.stats.defense * 0.10 + defenderState.stamina * 0.025;
    var damage = Math.round((raw - block) * punch.hp * repeatPenalty(attackerState, punch.id));
    if (defenderState.guard === "block") { damage = Math.round(damage * (0.42 + (1 - repeatPenalty(defenderState, "block")) * 0.35)); }
    if (attackerState.stamina < punch.stamina) { damage = Math.round(damage * 0.55); }
    return U.clamp(damage, 1, 34);
  }

  function staminaDamage(attacker, punch, damage, defenderState) {
    var value = Math.round(punch.staminaDamage * (damage + attacker.stats.power * 0.12));
    if (defenderState.guard === "block") { value = Math.round(value * 0.65); }
    return U.clamp(value, 0, 22);
  }

  function estimatePunchDamage(attacker, defender, punch, attackerState, defenderState) {
    var raw = attacker.stats.power * 0.22 + attacker.stats.technique * 0.10 + punch.stamina * 0.55 + 3;
    var block = defender.stats.defense * 0.10 + defenderState.stamina * 0.025;
    var damage = Math.round((raw - block) * punch.hp * repeatPenalty(attackerState, punch.id));
    if (defenderState.guard === "block") { damage = Math.round(damage * 0.42); }
    return U.clamp(damage, 1, 34);
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
        chance: hitChance(player, opponent, punch, session.player, session.opponent),
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

  function createSession(state, offer, opponent, tournamentSession) {
    var p = State.player(state);
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
        landed: 0, damage: 0, roundDamage: 0, knockdowns: 0, guard: "", points: 0, roundsWon: 0, repeatAction: "", repeatCount: 0, lastAction: ""
      },
      opponent: {
        pos: { x: 2, y: 0 }, hp: maxHp(opponent), maxHp: maxHp(opponent), stamina: maxStamina(opponent), maxStamina: maxStamina(opponent),
        landed: 0, damage: 0, roundDamage: 0, knockdowns: 0, guard: "", points: 0, roundsWon: 0, repeatAction: "", repeatCount: 0, lastAction: ""
      },
      log: ["Бой начался. Ринг 5×5. Выбери движение, удар, блок или контратаку."],
      roundLog: [],
      finished: false,
      purse: tournamentSession ? 0 : computePurse(p, opponent),
      winChance: estimateWinChance(p, opponent),
      count: null
    };
  }

  function buildFightPreview(state, offerId) {
    var offer = findOffer(state, offerId);
    var p = State.player(state);
    var opponent;
    var difficulty;

    if (!offer || !p) { return null; }
    opponent = U.getFighterById(state, offer.opponentId);
    if (!opponent) { return null; }
    difficulty = U.findDifficulty(offer.difficultyId);

    return {
      type: "fightPreview",
      offerId: offer.id,
      label: offer.label,
      difficultyLabel: difficulty.label,
      opponentId: opponent.id,
      opponentName: opponent.name,
      rounds: offer.rounds,
      purse: computePurse(p, opponent),
      winChance: estimateWinChance(p, opponent),
      playerRating: U.statAverage(p.stats),
      opponentRating: U.statAverage(opponent.stats),
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
    var p = State.player(state);
    var offer = findOffer(state, offerId);
    var opponent;
    var session;
    if (!p || !offer) { return false; }
    if (p.fatigue >= 100) { return State.fatigueLockedModal ? State.fatigueLockedModal(state) : false; }
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

    if (!canUsePunch(punch, attackerState, defenderState)) {
      recoverStamina(attackerState, 3);
      line = labels.attacker + " не достаёт: нужна другая дистанция или больше стамины.";
      session.log.push(line);
      return { hit: false, damage: 0, line: line, failed: true };
    }

    registerAction(attackerState, punchId);
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

    if (!damage && defenderState.guard === "counter" && defenderState.stamina >= 8 && U.randomInt(1, 100) <= Math.round(45 * repeatPenalty(defenderState, "counter"))) {
      spendStamina(defenderState, 8);
      damage = U.clamp(Math.round((defender.stats.technique * 0.12 + defender.stats.speed * 0.08 + U.randomInt(2, 8)) * repeatPenalty(defenderState, "counter")), 2, 22);
      attackerState.hp = U.clamp(attackerState.hp - damage, 0, attackerState.maxHp);
      defenderState.landed += 1;
      defenderState.damage += damage;
      defenderState.roundDamage += damage;
      session.log.push(labels.defender + " ловит контратаку. Урон " + damage + ". HP " + labels.attackerGen + ": " + attackerState.hp + "/" + attackerState.maxHp + ".");
    }

    return { hit: roll <= chance, damage: damage, line: line };
  }

  function checkKnockdown(session, side) {
    var target = side === "player" ? session.player : session.opponent;
    if (target.hp > 0) { return false; }
    session.count = { side: side, count: 0 };
    session.log.push((side === "player" ? "Ты падаешь" : "Соперник падает") + ". Судья начинает отсчёт.");
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
    session.roundLog.push("Раунд " + session.round + ": урон " + p.roundDamage + ":" + o.roundDamage + ", счёт " + scoreP + ":" + scoreO + ".");
    session.log.push("Итог раунда " + session.round + ": " + scoreP + ":" + scoreO + ".");
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
    recoverStamina(session.player, 22);
    recoverStamina(session.opponent, 22);
    session.log.push("Раунд " + session.round + ". Стамина частично восстановлена.");
    state.modal = buildActiveModal(state, session);
    return true;
  }

  function endTurn(state, session) {
    session.player.guard = session.player.guard === "block" || session.player.guard === "counter" ? session.player.guard : "";
    session.opponent.guard = session.opponent.guard === "block" || session.opponent.guard === "counter" ? session.opponent.guard : "";
    if (session.count) { state.modal = buildCountModal(state, session); return true; }
    session.turn += 1;
    recoverStamina(session.player, 2);
    recoverStamina(session.opponent, 2);
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
        session.opponent.pos = next;
        spendStamina(session.opponent, 3);
        session.log.push(opponent.name + " смещается ближе.");
      }
      return;
    }

    if (session.opponent.stamina < 12 && U.randomInt(1, 100) <= 60) {
      registerAction(session.opponent, "block");
      session.opponent.guard = "block";
      recoverStamina(session.opponent, Math.round(8 * repeatPenalty(session.opponent, "block")));
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
      moved = tryMove(session.player, session.opponent, Number(dx) || 0, Number(dy) || 0);
      session.log.push(moved ? "Ты смещаешься по рингу." : "Туда нельзя сместиться.");
    } else if (action === "block") {
      registerAction(session.player, "block");
      session.player.guard = "block";
      spendStamina(session.player, 4);
      session.log.push("Ты ставишь блок.");
    } else if (action === "counter") {
      if (session.player.lastAction === "counter") {
        session.log.push("Две контратаки подряд использовать нельзя.");
        state.modal = buildActiveModal(state, session);
        return true;
      }
      registerAction(session.player, "counter");
      session.player.guard = "counter";
      spendStamina(session.player, 7);
      session.log.push("Ты готовишь контратаку.");
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
    var standChance;

    if (!session || !session.count) { return false; }
    side = session.count.side;
    target = side === "player" ? session.player : session.opponent;
    session.count.count += 1;

    if (session.count.count >= 10) {
      session.log.push("Счёт 10. Нокаут.");
      return finishInteractiveFight(state, session, side === "player" ? "opponent_ko" : "player_ko");
    }

    standChance = U.clamp(18 + target.stamina * 0.42 + target.maxHp * 0.04 - session.count.count * 6, 5, 82);
    session.log.push("Счёт " + session.count.count + ". Шанс подняться: " + Math.round(standChance) + "%.");

    if (U.randomInt(1, 100) <= standChance) {
      target.knockdowns += 1;
      target.hp = Math.max(10, Math.round(target.maxHp * 0.24));
      target.stamina = Math.max(5, Math.round(target.stamina * 0.55));
      session.log.push((side === "player" ? "Ты поднимаешься" : "Соперник поднимается") + ". Бой продолжается.");
      session.count = null;
      return endTurn(state, session);
    }

    state.modal = buildCountModal(state, session);
    return true;
  }

  function applyFightResult(state, p, opponent, result, method) {
    if (result === "Ничья") {
      p.record.draws += 1;
      opponent.record.draws += 1;
    } else if (result === "Победа") {
      p.record.wins += 1;
      opponent.record.losses += 1;
      if (method === "KO/TKO") { p.record.kos += 1; }
    } else {
      p.record.losses += 1;
      opponent.record.wins += 1;
      if (method === "KO/TKO") { opponent.record.kos += 1; }
    }
    if (p.trackRecords) { p.trackRecords[p.trackId] = window.FS.State.cloneRecord(p.record); }
    if (opponent.trackRecords) { opponent.trackRecords[opponent.trackId] = window.FS.State.cloneRecord(opponent.record); }
    State.updateDerivedFighterFields(p);
    State.updateDerivedFighterFields(opponent);
    p.recentOpponentIds = p.recentOpponentIds instanceof Array ? p.recentOpponentIds : [];
    opponent.recentOpponentIds = opponent.recentOpponentIds instanceof Array ? opponent.recentOpponentIds : [];
    p.recentOpponentIds.unshift(opponent.id); opponent.recentOpponentIds.unshift(p.id);
    if (p.recentOpponentIds.length > 8) { p.recentOpponentIds.length = 8; }
    if (opponent.recentOpponentIds.length > 8) { opponent.recentOpponentIds.length = 8; }
    if (window.FS.Clubs && window.FS.Clubs.recordClubFight) {
      if (result === "Ничья") { window.FS.Clubs.recordClubFight(state, p, opponent, true); }
      else { window.FS.Clubs.recordClubFight(state, result === "Победа" ? p : opponent, result === "Победа" ? opponent : p, false); }
    }
  }

  function completeFightEconomy(state, p, opponent, result, purse, fatigue) {
    var pointMod = 1;
    var club = window.FS.Clubs && window.FS.Clubs.playerClub ? window.FS.Clubs.playerClub(state) : null;
    if (club) { pointMod = Number(club.trainingModifier) || 1; }
    p.trainingPoints = (Number(p.trainingPoints) || 0) + Math.max(1, Math.round((result === "Победа" ? 4 : (result === "Ничья" ? 2 : 1)) * pointMod));
    if (State.addMoney) { State.addMoney(state, purse, "Гонорар за бой"); } else { p.money = (Number(p.money) || 0) + purse; }
    if (State.adjustFatigue) { State.adjustFatigue(state, fatigue, "Бой"); }
    if (result === "Победа" && window.FS.Titles && window.FS.Titles.unifyBeltsAfterFight) { window.FS.Titles.unifyBeltsAfterFight(state, p.id, opponent.id); }
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
        playerRating: U.statAverage(p.stats),
        opponentRating: U.statAverage(opponent.stats),
        statsLine: "Урон: " + session.player.damage + ":" + session.opponent.damage + ". Попадания: " + session.player.landed + ":" + session.opponent.landed + ". HP: " + session.player.hp + "/" + session.player.maxHp + " — " + session.opponent.hp + "/" + session.opponent.maxHp + ".",
        roundLog: session.roundLog.concat(session.log.slice(-20)),
        winChance: session.winChance
      });
      return true;
    }

    applyFightResult(state, p, opponent, result, method);
    completeFightEconomy(state, p, opponent, result, session.purse, Data.economy && Data.economy.fatigue ? Data.economy.fatigue.fight : 18);
    p.lastFightWeek = state.week;
    opponent.lastFightWeek = state.week;
    p.careerLog.unshift({ week: state.week, text: result + " против " + opponent.name + ", " + method });
    opponent.careerLog.unshift({ week: state.week, text: "Бой против " + p.name + ": " + result });

    if (offer) {
      state.offers = state.offers.filter(function (existingOffer) { return existingOffer.id !== offer.id; });
    }

    World.advanceWeek(state, "fight");

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

  function resolveRandomFight(state, offerId) {
    var offer = findOffer(state, offerId);
    var p = State.player(state);
    var opponent;
    var chance;
    var result;
    var method;
    var purse;
    if (!offer || !p) { return false; }
    if (p.fatigue >= 100) { return State.fatigueLockedModal ? State.fatigueLockedModal(state) : false; }
    opponent = U.getFighterById(state, offer.opponentId);
    if (!opponent) { return false; }
    chance = estimateWinChance(p, opponent);
    result = U.randomInt(1, 100) <= chance ? "Победа" : "Поражение";
    method = U.randomInt(1, 100) <= 18 ? "KO/TKO" : "решение судей";
    purse = computePurse(p, opponent);
    applyFightResult(state, p, opponent, result, method);
    completeFightEconomy(state, p, opponent, result, purse, Math.round((Data.economy && Data.economy.fatigue ? Data.economy.fatigue.fight : 18) * 0.75));
    state.offers = state.offers.filter(function (existingOffer) { return existingOffer.id !== offer.id; });
    World.advanceWeek(state, "fight");
    state.modal = { type: "fightResult", result: result, method: method, scoreLine: "бой пропущен · шанс " + chance + "%", opponentName: opponent.name, week: state.week, playerRating: U.statAverage(p.stats), opponentRating: U.statAverage(opponent.stats), purse: purse, winChance: chance, roundLog: ["Бой пропущен. Результат решён через winChance: " + chance + "% ."], knockdown: null, statsLine: "Бой решён автоматически." };
    return true;
  }

  function startTournamentInteractiveFight(state, tournamentModal) {
    var p = State.player(state);
    var session = tournamentModal && tournamentModal.session;
    var opponent;
    var fakeOffer;
    var active;
    if (!p || !session || !session.opponentId) { return false; }
    if (p.fatigue >= 100) { return State.fatigueLockedModal ? State.fatigueLockedModal(state) : false; }
    opponent = U.getFighterById(state, session.opponentId);
    if (!opponent) { return false; }
    fakeOffer = { id: "tournament_" + session.competitionId + "_" + session.roundIndex, opponentId: opponent.id, rounds: 3, purse: 0, difficultyId: "even" };
    active = createSession(state, fakeOffer, opponent, session);
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
    playerAction: playerAction,
    handleCount: handleCount,
    resolveRandomFight: resolveRandomFight,
    resultClass: resultClass,
    estimateWinChance: estimateWinChance,
    simulateRounds: simulateRounds,
    computePurse: computePurse,
    buildTitleChallengePreview: buildTitleChallengePreview,
    resolveTitleChallenge: resolveTitleChallenge
  };
}());
