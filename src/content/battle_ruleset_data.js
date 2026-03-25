var BATTLE_RULESET_DATA = {
  rulesets: [
    {
      id: "ruleset_street",
      trackType: "street",
      label: "Уличный формат",
      numberOfRounds: 3,
      roundLengthAbstract: 12,
      scoringBias: {
        pressureWeight: 1.2,
        cleanWeight: 0.7,
        powerWeight: 1.15,
        tempoWeight: 0.3,
        defenseWeight: 0.25,
        gritWeight: 0.85,
        knockdownSwing: 18
      },
      damageModelModifiers: {
        accuracy: -1,
        damage: 0.08,
        critChance: 2,
        incomingDamage: 0.05,
        turnStaminaRecovery: -1
      },
      KOThresholdModifiers: {
        riseChanceModifier: -6,
        overkillScale: 1.15
      },
      wearAccumulation: 1.2,
      fameImpact: 1.15,
      moneyImpact: 0.9,
      dirtyConsequenceRisk: 18,
      summaryPoints: [
        "Раундов меньше, обмены резче.",
        "Давление и жёсткость значат больше.",
        "После боя чаще тянутся грязные последствия."
      ],
      whatMatters: "Жёсткость, напор и умение продавить свой ритм.",
      commentary: {
        intro: "На улице бой читают по жёсткости и тому, кто навязал драку.",
        roundPlayer: "Раунд выглядит по-уличному: твой напор и жёсткость запомнились сильнее.",
        roundOpponent: "Раунд уходит сопернику: он навязал жёсткий уличный темп.",
        roundEven: "Раунд вышел рваным, но без явного хозяина.",
        resultWin: "В этом формате больше запомнили твою жёсткость и характер.",
        resultLoss: "В этом формате соперник продавил тебя своей жёсткостью.",
        resultDraw: "Уличный бой вышел вязким, и никто не забрал его уверенно."
      }
    },
    {
      id: "ruleset_amateur",
      trackType: "amateur",
      label: "Любительский формат",
      numberOfRounds: 3,
      roundLengthAbstract: 15,
      scoringBias: {
        pressureWeight: 0.8,
        cleanWeight: 1.35,
        powerWeight: 0.8,
        tempoWeight: 0.85,
        defenseWeight: 0.7,
        gritWeight: 0.25,
        knockdownSwing: 16
      },
      damageModelModifiers: {
        accuracy: 2,
        damage: -0.04,
        dodge: 1,
        incomingDamage: -0.03,
        turnStaminaRecovery: 1,
        roundHealthPercent: 4
      },
      KOThresholdModifiers: {
        riseChanceModifier: 4,
        overkillScale: 0.9
      },
      wearAccumulation: 0.7,
      fameImpact: 0.9,
      moneyImpact: 0.55,
      dirtyConsequenceRisk: 4,
      summaryPoints: [
        "Судьи сильнее ценят чистые попадания.",
        "Темп, техника и дисциплина важнее грубой рубки.",
        "Долгий физический урон обычно мягче."
      ],
      whatMatters: "Чистая работа, темп, точность и бой под судейскую карточку.",
      commentary: {
        intro: "В любителях выше ценят чистую работу, темп и дисциплину.",
        roundPlayer: "Раунд уходит тебе: судьи видят более чистую и собранную работу.",
        roundOpponent: "Раунд уходит сопернику: он набрал больше чистых очков.",
        roundEven: "Раунд близкий: оба работали чисто и без явного перевеса.",
        resultWin: "В этом формате тебя вытянули чистые очки и собранная работа.",
        resultLoss: "В этом формате соперник перебил тебя чистотой и темпом.",
        resultDraw: "Любительский бой вышел ровным по чистым попаданиям."
      }
    },
    {
      id: "ruleset_sparring",
      trackType: "sparring",
      label: "Спарринг",
      numberOfRounds: 1,
      roundLengthAbstract: 8,
      scoringBias: {
        pressureWeight: 0.7,
        cleanWeight: 1.1,
        powerWeight: 0.55,
        tempoWeight: 0.8,
        defenseWeight: 0.55,
        gritWeight: 0.2,
        knockdownSwing: 12
      },
      damageModelModifiers: {
        accuracy: 1,
        damage: -0.5,
        dodge: 1,
        incomingDamage: -0.15,
        roundHealthPercent: 8,
        turnStaminaRecovery: 1
      },
      KOThresholdModifiers: {
        riseChanceModifier: 10,
        overkillScale: 0.75
      },
      wearAccumulation: 0.35,
      fameImpact: 0,
      moneyImpact: 0,
      dirtyConsequenceRisk: 0,
      summaryPoints: [
        "Один короткий раунд.",
        "Урон сильно снижен.",
        "Это подготовка, а не официальный бой."
      ],
      whatMatters: "Чистая работа, чтение стиля соперника и полезные раунды без лишнего износа.",
      commentary: {
        intro: "Спарринг нужен для подготовки, а не для рекорда.",
        roundPlayer: "Раунд в твою пользу: ты лучше читал соперника и держал темп.",
        roundOpponent: "Раунд ушёл партнёру: он собрал больше чистой работы.",
        roundEven: "Раунд вышел ровным и полезным для обоих.",
        resultWin: "Спарринг сложился в твою пользу и дал хороший материал для подготовки.",
        resultLoss: "Даже неудачный спарринг дал полезные подсказки по работе.",
        resultDraw: "Ровный спарринг: оба взяли рабочий материал без лишней рубки."
      }
    },
    {
      id: "ruleset_pro",
      trackType: "pro",
      label: "Профессиональный формат",
      numberOfRounds: 6,
      roundLengthAbstract: 15,
      scoringBias: {
        pressureWeight: 1.0,
        cleanWeight: 0.95,
        powerWeight: 1.2,
        tempoWeight: 0.35,
        defenseWeight: 0.45,
        gritWeight: 0.55,
        knockdownSwing: 18
      },
      damageModelModifiers: {
        damage: 0.05,
        critChance: 1,
        incomingDamage: 0.05,
        roundHealthPercent: -4,
        turnStaminaRecovery: -1
      },
      KOThresholdModifiers: {
        riseChanceModifier: -2,
        overkillScale: 1.08
      },
      wearAccumulation: 1.35,
      fameImpact: 1.35,
      moneyImpact: 1.4,
      dirtyConsequenceRisk: 8,
      summaryPoints: [
        "Накапливается больше наказания по телу.",
        "Финиш и тяжёлые удары весят сильнее.",
        "Финансовые и медийные последствия выше."
      ],
      whatMatters: "Давление, тяжёлый урон, финиш и умение держать длинный бой.",
      commentary: {
        intro: "В профи важнее наказание, давление и умение ломать бой по ходу дистанции.",
        roundPlayer: "Раунд твой: тяжёлое давление и наказание за ошибки были на твоей стороне.",
        roundOpponent: "Раунд соперника: он лучше продавил и нанёс более тяжёлый урон.",
        roundEven: "Раунд получился рабочим и без большого разрыва по урону.",
        resultWin: "Профи-формат вознаградил твой урон и давление.",
        resultLoss: "Профи-формат оказался на стороне более тяжёлого и вязкого соперника.",
        resultDraw: "Профессиональный бой остался ровным по урону и давлению."
      }
    }
  ]
};

