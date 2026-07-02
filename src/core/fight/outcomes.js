(function () {
  "use strict";

  window.FS = window.FS || {};

  function resultClass(result) {
    if (result === "Победа") { return "win"; }
    if (result === "Поражение") { return "loss"; }
    return "draw";
  }

  function percentText(made, thrown) {
    made = Number(made) || 0;
    thrown = Number(thrown) || 0;
    if (!thrown) { return "0%"; }
    return Math.round(made / thrown * 100) + "%";
  }

  function buildFightInsight(data) {
    var info = data || {};
    var playerDamage = Number(info.playerDamage) || 0;
    var opponentDamage = Number(info.opponentDamage) || 0;
    var playerLanded = Number(info.playerLanded) || 0;
    var opponentLanded = Number(info.opponentLanded) || 0;
    var playerThrown = Number(info.playerThrown) || 0;
    var opponentThrown = Number(info.opponentThrown) || 0;
    var playerStamina = Number(info.playerStamina);
    var opponentStamina = Number(info.opponentStamina);
    var damageDiff = playerDamage - opponentDamage;
    var landedDiff = playerLanded - opponentLanded;
    var staminaKnown = !isNaN(playerStamina) && !isNaN(opponentStamina);
    var staminaDiff = staminaKnown ? playerStamina - opponentStamina : 0;
    var lines = [];
    var title;

    if (info.method === "KO/TKO" || info.knockdown) {
      if (info.result === "Победа") { title = "Бой решил нокдаун: ты довёл соперника до остановки."; }
      else if (info.result === "Поражение") { title = "Бой решил нокдаун: соперник довёл тебя до остановки."; }
      else { title = "Бой дошёл до остановки, но итог остался спорным."; }
    } else if (info.result === "Ничья") {
      title = "Бой был близким: судьи не дали перевеса ни одной стороне.";
    } else if (Math.abs(damageDiff) >= 10) {
      title = damageDiff > 0 ? "Главный фактор: ты перебил соперника по урону." : "Главный фактор: соперник перебил тебя по урону.";
    } else if (Math.abs(landedDiff) >= 3) {
      title = landedDiff > 0 ? "Главный фактор: ты чаще попадал." : "Главный фактор: соперник чаще попадал.";
    } else if (staminaKnown && Math.abs(staminaDiff) >= 18) {
      title = staminaDiff > 0 ? "Главный фактор: ты лучше сохранил стамину." : "Главный фактор: ты сильнее просел по стамине.";
    } else if (info.method === "решение судей") {
      title = "";
    } else {
      title = "Итог боя сложился из урона, точности и состояния к концу боя.";
    }

    lines.push("Урон: " + playerDamage + ":" + opponentDamage + (damageDiff ? " (разница " + (damageDiff > 0 ? "+" : "") + damageDiff + ")" : ""));
    if (playerThrown || opponentThrown) {
      lines.push("Точность: " + playerLanded + "/" + playerThrown + " (" + percentText(playerLanded, playerThrown) + ") — " + opponentLanded + "/" + opponentThrown + " (" + percentText(opponentLanded, opponentThrown) + ")");
    } else {
      lines.push("Попадания: " + playerLanded + ":" + opponentLanded);
    }
    if (staminaKnown) {
      lines.push("Стамина в конце: " + playerStamina + " — " + opponentStamina + (staminaDiff ? " (разница " + (staminaDiff > 0 ? "+" : "") + staminaDiff + ")" : ""));
    }
    if (info.scoreLine) { lines.push("Счёт/метод: " + info.scoreLine); }
    if (info.winChance != null) { lines.push("Шанс до боя: " + info.winChance + "%"); }

    return { title: title, lines: lines };
  }

  window.FS.FightOutcomes = {
    resultClass: resultClass,
    percentText: percentText,
    buildFightInsight: buildFightInsight
  };
}());
