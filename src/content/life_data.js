var LIFE_DATA = {
  "housingOptions": [
    {
      "id": "rough",
      "label": "Плохие условия",
      "weeklyCost": 15,
      "weeklyStress": 4,
      "weeklyMorale": -4,
      "weeklyWear": 2,
      "recoveryHealthBonus": -4,
      "recoveryStressRelief": -1,
      "disciplineBonus": -6
    },
    {
      "id": "normal",
      "label": "Нормальные условия",
      "weeklyCost": 50,
      "weeklyStress": 0,
      "weeklyMorale": 1,
      "weeklyWear": 0,
      "recoveryHealthBonus": 0,
      "recoveryStressRelief": 0,
      "disciplineBonus": 0
    },
    {
      "id": "comfortable",
      "label": "Комфортные условия",
      "weeklyCost": 100,
      "weeklyStress": -3,
      "weeklyMorale": 4,
      "weeklyWear": -1,
      "recoveryHealthBonus": 4,
      "recoveryStressRelief": 3,
      "disciplineBonus": 6
    }
  ],
  "socialActions": [
    {
      "id": "friend",
      "label": "Встретиться с другом",
      "money": -8,
      "health": 2,
      "stress": -8,
      "support": 8,
      "delta": {
        "fatigue": -2,
        "wear": 0,
        "morale": 5
      },
      "relationEffects": [
        {
          "role": "friend",
          "score": 8,
          "note": ""
        }
      ]
    },
    {
      "id": "team",
      "label": "Побыть с командой",
      "money": -12,
      "health": 2,
      "stress": -5,
      "support": 6,
      "delta": {
        "fatigue": -1,
        "wear": -1,
        "morale": 4
      },
      "relationEffects": [
        {
          "role": "trainer",
          "score": 6,
          "note": ""
        },
        {
          "role": "sparring",
          "score": 5,
          "note": ""
        }
      ]
    },
    {
      "id": "family",
      "label": "Повидать близких",
      "money": -6,
      "health": 2,
      "stress": -7,
      "support": 10,
      "delta": {
        "fatigue": -3,
        "wear": -1,
        "morale": 7
      },
      "relationEffects": []
    },
    {
      "id": "solo",
      "label": "Остаться одному",
      "money": 0,
      "health": 4,
      "stress": -4,
      "support": -2,
      "delta": {
        "fatigue": -6,
        "wear": -1,
        "morale": 2
      },
      "relationEffects": []
    }
  ]
};

