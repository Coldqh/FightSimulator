var COMBAT_STATE_DATA = {
  "injuryTypes": [
    {
      "id": "ribs",
      "label": "Рёбра",
      "description": "Тяжело дышать и держать удары по корпусу.",
      "shortRisk": "корпус теперь опаснее",
      "combat": {
        "accuracy": -1,
        "dodge": -4,
        "damageMultiplier": -0.03,
        "incomingDamageMultiplier": 0.08,
        "turnStaminaRecovery": -1,
        "turnHealthRecovery": -1
      },
      "career": {
        "trainHealth": -2,
        "trainWear": 1,
        "travelStress": 1,
        "weeklyHealth": -1
      }
    },
    {
      "id": "hand",
      "label": "Кисть",
      "description": "Рука болит, плотные удары идут хуже.",
      "shortRisk": "рука мешает бить в полную силу",
      "combat": {
        "accuracy": -2,
        "damageMultiplier": -0.08,
        "critChance": -3
      },
      "career": {
        "trainHealth": -1,
        "trainWear": 1
      }
    },
    {
      "id": "cut",
      "label": "Рассечение",
      "description": "Кровь мешает видеть и сбивает ритм.",
      "shortRisk": "рассечение может сломать темп",
      "combat": {
        "accuracy": -2,
        "dodge": -2,
        "roundHealthPercent": -5,
        "incomingDamageMultiplier": 0.05
      },
      "career": {
        "weeklyHealth": -1,
        "travelStress": 1
      }
    },
    {
      "id": "nose",
      "label": "Нос",
      "description": "Сбито дыхание, точность и уклон проседают.",
      "shortRisk": "нос мешает дышать и видеть бой",
      "combat": {
        "accuracy": -3,
        "dodge": -3,
        "turnStaminaRecovery": -1
      },
      "career": {
        "trainHealth": -1,
        "weeklyHealth": -1
      }
    },
    {
      "id": "exhaustion",
      "label": "Истощение",
      "description": "Тело еле тянет темп и медленно приходит в себя.",
      "shortRisk": "силы уже не те",
      "combat": {
        "accuracy": -2,
        "damageMultiplier": -0.06,
        "dodge": -2,
        "turnHealthRecovery": -1,
        "turnStaminaRecovery": -2,
        "startStamina": -8
      },
      "career": {
        "trainHealth": -2,
        "trainWear": 1,
        "travelStress": 2,
        "weeklyHealth": -1
      }
    }
  ],
  "opponentArchetypes": [
    {
      "id": "aggressor",
      "label": "Агрессор",
      "description": "Сразу лезет вперёд и давит.",
      "riskText": "давит темпом и часто лезет в ближний бой",
      "ai": {
        "attackBias": 18,
        "defenseBias": -12,
        "counterBias": -10,
        "finishBias": 6,
        "chaseBias": 14,
        "retreatBias": -8,
        "jabBias": 1,
        "crossBias": 5,
        "bodyBias": 7,
        "hookBias": 7,
        "uppercutBias": 4
      }
    },
    {
      "id": "patient",
      "label": "Выжидатель",
      "description": "Не спешит и тянет бой в долгую.",
      "riskText": "бережёт силы и ждёт твою ошибку",
      "ai": {
        "attackBias": -2,
        "defenseBias": 10,
        "counterBias": 4,
        "finishBias": 0,
        "chaseBias": -2,
        "retreatBias": 6,
        "jabBias": 4,
        "crossBias": 1,
        "bodyBias": 2,
        "hookBias": -2,
        "uppercutBias": -2
      }
    },
    {
      "id": "counter",
      "label": "Контровик",
      "description": "Смотрит, ждёт и отвечает в окно.",
      "riskText": "любит ловить на промахе",
      "ai": {
        "attackBias": 0,
        "defenseBias": 8,
        "counterBias": 18,
        "finishBias": 2,
        "chaseBias": -4,
        "retreatBias": 6,
        "jabBias": 5,
        "crossBias": 3,
        "bodyBias": 0,
        "hookBias": -1,
        "uppercutBias": 1
      }
    },
    {
      "id": "knockout",
      "label": "Нокаутёр",
      "description": "Ждёт шанс на один тяжёлый удар.",
      "riskText": "опасен, когда чувствует слабость",
      "ai": {
        "attackBias": 8,
        "defenseBias": -4,
        "counterBias": -2,
        "finishBias": 16,
        "chaseBias": 8,
        "retreatBias": -2,
        "jabBias": -2,
        "crossBias": 6,
        "bodyBias": 1,
        "hookBias": 6,
        "uppercutBias": 8
      }
    },
    {
      "id": "technician",
      "label": "Технарь",
      "description": "Работает чище, чем ярче.",
      "riskText": "может перебить точностью и таймингом",
      "ai": {
        "attackBias": 4,
        "defenseBias": 4,
        "counterBias": 3,
        "finishBias": 1,
        "chaseBias": 2,
        "retreatBias": 2,
        "jabBias": 7,
        "crossBias": 5,
        "bodyBias": 3,
        "hookBias": -1,
        "uppercutBias": -2
      }
    }
  ],
  "campFightProfiles": {
    "endurance": {
      "label": "Лагерь на выносливость",
      "note": "дыхание держится ровнее",
      "bonuses": {
        "turnStaminaRecovery": 1,
        "roundStaminaPercent": 6
      }
    },
    "technique": {
      "label": "Лагерь на технику",
      "note": "удары идут чище",
      "bonuses": {
        "accuracy": 3,
        "critChance": 1
      }
    },
    "power": {
      "label": "Лагерь на силу удара",
      "note": "удары садятся плотнее",
      "bonuses": {
        "damageMultiplier": 0.08,
        "critChance": 1
      }
    },
    "defense": {
      "label": "Лагерь на защиту",
      "note": "уклон и блок работают лучше",
      "bonuses": {
        "dodge": 4,
        "blockReduction": 0.05
      }
    },
    "sparring": {
      "label": "Лагерь на спарринги",
      "note": "лучше чувствуешь ритм боя",
      "bonuses": {
        "accuracy": 1,
        "counterChance": 6
      }
    },
    "recovery": {
      "label": "Лагерь на восстановление",
      "note": "тело дольше держит бой",
      "bonuses": {
        "turnHealthRecovery": 1,
        "roundHealthPercent": 6,
        "injuryRecovery": 1
      }
    }
  }
};

