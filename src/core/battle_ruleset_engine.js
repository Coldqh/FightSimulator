var BattleRulesetEngine = (function () {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function defaultRuleset(trackId) {
    return {
      id: "ruleset_" + (trackId || "street"),
      trackType: trackId || "street",
      label: "Бой",
      numberOfRounds: 4,
      roundLengthAbstract: 15,
      scoringBias: {
        pressureWeight: 1,
        cleanWeight: 1,
        powerWeight: 1,
        tempoWeight: 0.4,
        defenseWeight: 0.3,
        gritWeight: 0.3,
        knockdownSwing: 16
      },
      damageModelModifiers: {},
      KOThresholdModifiers: {
        riseChanceModifier: 0,
        overkillScale: 1
      },
      wearAccumulation: 1,
      fameImpact: 1,
      moneyImpact: 1,
      dirtyConsequenceRisk: 0,
      summaryPoints: [],
      whatMatters: "",
      commentary: {
        intro: "",
        roundPlayer: "",
        roundOpponent: "",
        roundEven: "",
        resultWin: "",
        resultLoss: "",
        resultDraw: ""
      }
    };
  }

  function listRulesets() {
    if (typeof ContentLoader !== "undefined" && ContentLoader.listBattleRulesets) {
      return ContentLoader.listBattleRulesets();
    }
    if (typeof BATTLE_RULESET_DATA !== "undefined" && BATTLE_RULESET_DATA && BATTLE_RULESET_DATA.rulesets instanceof Array) {
      return clone(BATTLE_RULESET_DATA.rulesets);
    }
    return [];
  }

  function getRulesetForTrack(trackId) {
    var rulesets = listRulesets();
    var i;
    for (i = 0; i < rulesets.length; i += 1) {
      if (rulesets[i] && rulesets[i].trackType === trackId) {
        return clone(rulesets[i]);
      }
    }
    return defaultRuleset(trackId);
  }

  function buildOfferRuleset(trackId) {
    var ruleset = getRulesetForTrack(trackId || "street");
    return {
      id: ruleset.id,
      trackType: ruleset.trackType,
      label: ruleset.label,
      numberOfRounds: ruleset.numberOfRounds,
      roundLengthAbstract: ruleset.roundLengthAbstract,
      summaryPoints: clone(ruleset.summaryPoints || []),
      whatMatters: ruleset.whatMatters || ""
    };
  }

  function createFightRuleset(trackId) {
    var ruleset = getRulesetForTrack(trackId || "street");
    return {
      id: ruleset.id,
      trackType: ruleset.trackType,
      label: ruleset.label,
      numberOfRounds: ruleset.numberOfRounds,
      roundLengthAbstract: ruleset.roundLengthAbstract,
      scoringBias: clone(ruleset.scoringBias || {}),
      damageModelModifiers: clone(ruleset.damageModelModifiers || {}),
      KOThresholdModifiers: clone(ruleset.KOThresholdModifiers || {}),
      wearAccumulation: typeof ruleset.wearAccumulation === "number" ? ruleset.wearAccumulation : 1,
      fameImpact: typeof ruleset.fameImpact === "number" ? ruleset.fameImpact : 1,
      moneyImpact: typeof ruleset.moneyImpact === "number" ? ruleset.moneyImpact : 1,
      dirtyConsequenceRisk: typeof ruleset.dirtyConsequenceRisk === "number" ? ruleset.dirtyConsequenceRisk : 0,
      summaryPoints: clone(ruleset.summaryPoints || []),
      whatMatters: ruleset.whatMatters || "",
      commentary: clone(ruleset.commentary || {})
    };
  }

  function buildFightContextLayer(ruleset, fighter) {
    var layer = {
      accuracy: 0,
      damage: 0,
      dodge: 0,
      critChance: 0,
      incomingDamage: 0,
      turnStaminaRecovery: 0,
      roundHealthPercent: 0,
      notes: [],
      risks: [],
      tags: {}
    };
    var modifiers = ruleset && ruleset.damageModelModifiers ? ruleset.damageModelModifiers : {};
    var streetRating = fighter && fighter.street && typeof fighter.street.streetRating === "number" ? fighter.street.streetRating : 0;
    var amateurScore = fighter && fighter.amateur && typeof fighter.amateur.score === "number" ? fighter.amateur.score : 0;
    var proValue = fighter && fighter.pro && typeof fighter.pro.proValue === "number" ? fighter.pro.proValue : 0;
    if (typeof modifiers.accuracy === "number") { layer.accuracy += modifiers.accuracy; }
    if (typeof modifiers.damage === "number") { layer.damage += modifiers.damage; }
    if (typeof modifiers.dodge === "number") { layer.dodge += modifiers.dodge; }
    if (typeof modifiers.critChance === "number") { layer.critChance += modifiers.critChance; }
    if (typeof modifiers.incomingDamage === "number") { layer.incomingDamage += modifiers.incomingDamage; }
    if (typeof modifiers.turnStaminaRecovery === "number") { layer.turnStaminaRecovery += modifiers.turnStaminaRecovery; }
    if (typeof modifiers.roundHealthPercent === "number") { layer.roundHealthPercent += modifiers.roundHealthPercent; }
    if (!ruleset) {
      return layer;
    }
    if (ruleset.trackType === "street" && streetRating > 0) {
      layer.damage += Math.min(0.08, streetRating / 500);
      layer.notes.push("Уличный опыт добавляет жёсткости в обменах.");
    } else if (ruleset.trackType === "amateur" && amateurScore > 0) {
      layer.accuracy += Math.min(3, Math.floor(amateurScore / 120));
      layer.notes.push("Любительский ритм помогает работать чище.");
    } else if (ruleset.trackType === "pro" && proValue > 0) {
      layer.damage += Math.min(0.08, proValue / 600);
      layer.notes.push("Профи-ритм помогает лучше навязывать тяжёлый бой.");
    }
    if (ruleset.trackType === "street") {
      layer.risks.push("Уличный формат быстрее наказывает за ошибки.");
    } else if (ruleset.trackType === "amateur") {
      layer.notes.push("Судьи сильнее смотрят на чистые очки.");
    } else if (ruleset.trackType === "sparring") {
      layer.notes.push("Спарринг идёт легче и не влияет на официальный рекорд.");
    } else if (ruleset.trackType === "pro") {
      layer.risks.push("Профи-формат сильнее копит урон и износ.");
    }
    return layer;
  }

  function postFightMultipliers(ruleset) {
    return {
      wearAccumulation: ruleset && typeof ruleset.wearAccumulation === "number" ? ruleset.wearAccumulation : 1,
      fameImpact: ruleset && typeof ruleset.fameImpact === "number" ? ruleset.fameImpact : 1,
      moneyImpact: ruleset && typeof ruleset.moneyImpact === "number" ? ruleset.moneyImpact : 1,
      dirtyConsequenceRisk: ruleset && typeof ruleset.dirtyConsequenceRisk === "number" ? ruleset.dirtyConsequenceRisk : 0
    };
  }

  function knockdownAdjustments(ruleset) {
    var modifiers = ruleset && ruleset.KOThresholdModifiers ? ruleset.KOThresholdModifiers : {};
    return {
      riseChanceModifier: typeof modifiers.riseChanceModifier === "number" ? modifiers.riseChanceModifier : 0,
      overkillScale: typeof modifiers.overkillScale === "number" ? modifiers.overkillScale : 1
    };
  }

  function roundCommentary(ruleset, winnerSide) {
    var commentary = ruleset && ruleset.commentary ? ruleset.commentary : {};
    if (winnerSide === "player") {
      return commentary.roundPlayer || "";
    }
    if (winnerSide === "opponent") {
      return commentary.roundOpponent || "";
    }
    return commentary.roundEven || "";
  }

  function resultCommentary(ruleset, result) {
    var commentary = ruleset && ruleset.commentary ? ruleset.commentary : {};
    if (result === "win") {
      return commentary.resultWin || "";
    }
    if (result === "loss") {
      return commentary.resultLoss || "";
    }
    return commentary.resultDraw || "";
  }

  return {
    listRulesets: listRulesets,
    getRulesetForTrack: getRulesetForTrack,
    buildOfferRuleset: buildOfferRuleset,
    createFightRuleset: createFightRuleset,
    buildFightContextLayer: buildFightContextLayer,
    postFightMultipliers: postFightMultipliers,
    knockdownAdjustments: knockdownAdjustments,
    roundCommentary: roundCommentary,
    resultCommentary: resultCommentary
  };
}());

