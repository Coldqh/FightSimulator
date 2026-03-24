var DEVELOPMENT_DATA = {
  "styles": [
    {
      "id": "outboxer",
      "label": "Аутбоксер",
      "tiers": [
        {
          "threshold": 12,
          "label": "Контур",
          "bonuses": {
            "accuracyByAction": {
              "jab": 4,
              "cross": 2
            },
            "dodge": 2,
            "staminaCostByAction": {
              "move_up": -1,
              "move_left": -1,
              "move_right": -1,
              "move_down": -1
            }
          }
        },
        {
          "threshold": 28,
          "label": "Школа",
          "bonuses": {
            "accuracyByAction": {
              "jab": 7,
              "cross": 4
            },
            "dodge": 4,
            "staminaCostByAction": {
              "move_up": -1,
              "move_left": -1,
              "move_right": -1,
              "move_down": -1
            },
            "critChance": 2
          }
        },
        {
          "threshold": 52,
          "label": "Мастер",
          "bonuses": {
            "accuracyByAction": {
              "jab": 10,
              "cross": 5
            },
            "dodge": 6,
            "staminaCostByAction": {
              "move_up": -2,
              "move_left": -2,
              "move_right": -2,
              "move_down": -2
            },
            "turnRecoveryStamina": 1
          }
        }
      ]
    },
    {
      "id": "puncher",
      "label": "Панчер",
      "tiers": [
        {
          "threshold": 12,
          "label": "Тяжёлые руки",
          "bonuses": {
            "damageByAction": {
              "cross": 2,
              "hook": 2,
              "uppercut": 3
            },
            "critChance": 2
          }
        },
        {
          "threshold": 28,
          "label": "Добивающий",
          "bonuses": {
            "damageByAction": {
              "cross": 4,
              "hook": 4,
              "uppercut": 5
            },
            "staminaCostByAction": {
              "hook": -1,
              "uppercut": -1
            },
            "critChance": 4
          }
        },
        {
          "threshold": 52,
          "label": "Разрушитель",
          "bonuses": {
            "damageByAction": {
              "cross": 5,
              "hook": 6,
              "uppercut": 7
            },
            "critChance": 6,
            "accuracyByAction": {
              "hook": 2,
              "uppercut": 2
            }
          }
        }
      ]
    },
    {
      "id": "counterpuncher",
      "label": "Контрпанчер",
      "tiers": [
        {
          "threshold": 12,
          "label": "Считывание",
          "bonuses": {
            "counterChance": 8,
            "dodge": 2,
            "blockReduction": 0.05
          }
        },
        {
          "threshold": 28,
          "label": "Ловушка",
          "bonuses": {
            "counterChance": 12,
            "dodge": 4,
            "blockReduction": 0.08,
            "accuracyByAction": {
              "jab": 2,
              "cross": 2
            }
          }
        },
        {
          "threshold": 52,
          "label": "Хирург",
          "bonuses": {
            "counterChance": 16,
            "dodge": 6,
            "blockReduction": 0.12,
            "critChance": 3,
            "turnRecoveryStamina": 1
          }
        }
      ]
    },
    {
      "id": "tempo",
      "label": "Темповик",
      "tiers": [
        {
          "threshold": 12,
          "label": "Двигатель",
          "bonuses": {
            "damageByAction": {
              "body": 1
            },
            "turnRecoveryStamina": 1,
            "staminaCostByAction": {
              "move_up": -1,
              "move_left": -1,
              "move_right": -1,
              "move_down": -1
            }
          }
        },
        {
          "threshold": 28,
          "label": "Пресс",
          "bonuses": {
            "damageByAction": {
              "jab": 1,
              "body": 2
            },
            "turnRecoveryStamina": 1,
            "staminaCostByAction": {
              "move_up": -1,
              "move_left": -1,
              "move_right": -1,
              "move_down": -1
            }
          }
        },
        {
          "threshold": 52,
          "label": "Печь",
          "bonuses": {
            "damageByAction": {
              "body": 3,
              "hook": 2
            },
            "turnRecoveryStamina": 2,
            "staminaCostByAction": {
              "move_up": -2,
              "move_left": -2,
              "move_right": -2,
              "move_down": -2
            }
          }
        }
      ]
    }
  ],
  "trainingFocuses": [
    {
      "id": "endurance",
      "label": "Выносливость",
      "xpByTraining": {
        "light": 6,
        "medium": 10,
        "hard": 14
      },
      "styleWeights": {
        "tempo": 2,
        "counterpuncher": 1
      }
    },
    {
      "id": "technique",
      "label": "Техника",
      "xpByTraining": {
        "light": 7,
        "medium": 11,
        "hard": 15
      },
      "styleWeights": {
        "outboxer": 2,
        "counterpuncher": 2
      }
    },
    {
      "id": "power",
      "label": "Ударная мощь",
      "xpByTraining": {
        "light": 6,
        "medium": 10,
        "hard": 15
      },
      "styleWeights": {
        "puncher": 3,
        "tempo": 1
      }
    },
    {
      "id": "defense",
      "label": "Защита",
      "xpByTraining": {
        "light": 6,
        "medium": 11,
        "hard": 14
      },
      "styleWeights": {
        "counterpuncher": 2,
        "outboxer": 1
      }
    },
    {
      "id": "recovery",
      "label": "Восстановление",
      "xpByTraining": {
        "light": 5,
        "medium": 8,
        "hard": 10
      },
      "styleWeights": {
        "outboxer": 1,
        "counterpuncher": 1
      }
    }
  ],
  "perks": [
    {
      "id": "needle_jab",
      "label": "Игла джеба",
      "category": "combat",
      "requirements": {
        "styleAtLeast": {
          "outboxer": 12
        },
        "statAtLeast": {
          "tec": 5
        }
      },
      "bonuses": {
        "accuracyByAction": {
          "jab": 6
        },
        "damageByAction": {
          "jab": 1
        }
      }
    },
    {
      "id": "rangemaster",
      "label": "Хозяин дистанции",
      "category": "combat",
      "requirements": {
        "styleAtLeast": {
          "outboxer": 24
        },
        "statAtLeast": {
          "spd": 6
        }
      },
      "bonuses": {
        "staminaCostByAction": {
          "move_up": -1,
          "move_left": -1,
          "move_right": -1,
          "move_down": -1
        },
        "dodge": 3
      }
    },
    {
      "id": "thunder_cross",
      "label": "Громовой кросс",
      "category": "combat",
      "requirements": {
        "styleAtLeast": {
          "puncher": 12
        },
        "statAtLeast": {
          "str": 5
        }
      },
      "bonuses": {
        "damageByAction": {
          "cross": 4
        },
        "critChance": 2
      }
    },
    {
      "id": "basement_hook",
      "label": "Подвальный хук",
      "category": "combat",
      "requirements": {
        "styleAtLeast": {
          "puncher": 24
        },
        "statAtLeast": {
          "str": 7
        }
      },
      "bonuses": {
        "damageByAction": {
          "hook": 5
        },
        "accuracyByAction": {
          "hook": 3
        }
      }
    },
    {
      "id": "kill_switch",
      "label": "Добивающий импульс",
      "category": "combat",
      "requirements": {
        "styleAtLeast": {
          "puncher": 36
        },
        "statAtLeast": {
          "str": 8,
          "tec": 5
        }
      },
      "bonuses": {
        "damageByAction": {
          "uppercut": 6
        },
        "critChance": 4
      }
    },
    {
      "id": "mirror_step",
      "label": "Зеркальный шаг",
      "category": "combat",
      "requirements": {
        "styleAtLeast": {
          "counterpuncher": 12
        },
        "statAtLeast": {
          "spd": 6
        }
      },
      "bonuses": {
        "dodge": 4,
        "counterChance": 8
      }
    },
    {
      "id": "trap_guard",
      "label": "Ловушка в блоке",
      "category": "combat",
      "requirements": {
        "styleAtLeast": {
          "counterpuncher": 24
        },
        "statAtLeast": {
          "tec": 6
        }
      },
      "bonuses": {
        "blockReduction": 0.1,
        "accuracyByAction": {
          "cross": 3
        }
      }
    },
    {
      "id": "body_tax",
      "label": "Налог на корпус",
      "category": "combat",
      "requirements": {
        "styleAtLeast": {
          "tempo": 12
        },
        "statAtLeast": {
          "end": 5
        }
      },
      "bonuses": {
        "damageByAction": {
          "body": 3
        },
        "turnRecoveryStamina": 1
      }
    },
    {
      "id": "swarm_breath",
      "label": "Дыхание темпа",
      "category": "combat",
      "requirements": {
        "styleAtLeast": {
          "tempo": 24
        },
        "statAtLeast": {
          "end": 7
        }
      },
      "bonuses": {
        "staminaCostByAction": {
          "move_up": -1,
          "move_left": -1,
          "move_right": -1,
          "move_down": -1
        },
        "damageByAction": {
          "jab": 1
        }
      }
    },
    {
      "id": "gym_rat",
      "label": "Крыса зала",
      "category": "career",
      "requirements": {
        "focusAtLeast": {
          "technique": 10
        },
        "weekAtLeast": 3
      },
      "bonuses": {
        "trainingXp": 2,
        "trainingPointsFlat": 2
      }
    },
    {
      "id": "camp_engineer",
      "label": "Инженер лагеря",
      "category": "career",
      "requirements": {
        "focusAtLeast": {
          "technique": 10
        },
        "statAtLeast": {
          "tec": 5
        }
      },
      "bonuses": {
        "trainingXp": 3
      }
    },
    {
      "id": "contract_eye",
      "label": "Чтение контрактов",
      "category": "career",
      "requirements": {
        "fameAtLeast": 12,
        "statAtLeast": {
          "tec": 6
        }
      },
      "bonuses": {
        "toxicRiskGuard": 10,
        "offerPurse": 8
      }
    },
    {
      "id": "road_wallet",
      "label": "Дорожный кошелёк",
      "category": "career",
      "requirements": {
        "fameAtLeast": 18,
        "statAtLeast": {
          "spd": 6
        }
      },
      "bonuses": {
        "travelDiscountPercent": 15,
        "workMoney": 20
      }
    },
    {
      "id": "crowd_echo",
      "label": "Эхо толпы",
      "category": "career",
      "requirements": {
        "fameAtLeast": 25,
        "moraleAtLeast": 55
      },
      "bonuses": {
        "offerFame": 3,
        "offerPurse": 6
      }
    },
    {
      "id": "cold_head",
      "label": "Холодная голова",
      "category": "psychological",
      "requirements": {
        "moraleAtLeast": 60,
        "statAtLeast": {
          "vit": 5
        }
      },
      "bonuses": {
        "recoverStressRelief": 3,
        "moraleShield": 3
      }
    },
    {
      "id": "anchor_circle",
      "label": "Круг опоры",
      "category": "psychological",
      "requirements": {
        "supportAtLeast": 60
      },
      "bonuses": {
        "supportGain": 3,
        "moraleShield": 4
      }
    }
  ],
  "trainerProfiles": {
    "old_school": {
      "focusBoosts": {
        "defense": 2,
        "technique": 1
      },
      "styleWeights": {
        "counterpuncher": 2,
        "outboxer": 1
      }
    },
    "conditioning": {
      "focusBoosts": {
        "endurance": 3,
        "recovery": 2
      },
      "styleWeights": {
        "tempo": 2
      }
    },
    "sharp_technician": {
      "focusBoosts": {
        "technique": 3,
        "defense": 2
      },
      "styleWeights": {
        "outboxer": 2,
        "counterpuncher": 2
      }
    },
    "finisher": {
      "focusBoosts": {
        "power": 3,
        "technique": 1
      },
      "styleWeights": {
        "puncher": 3,
        "tempo": 1
      }
    },
    "media_operator": {
      "focusBoosts": {
        "technique": 1,
        "recovery": 1
      },
      "styleWeights": {
        "outboxer": 1
      }
    },
    "body_lab": {
      "focusBoosts": {
        "power": 2,
        "technique": 2
      },
      "styleWeights": {
        "puncher": 2,
        "tempo": 1
      }
    }
  },
  "gymProfiles": {
    "mexico_barrio_pit": {
      "focusBoosts": {
        "power": 2,
        "technique": 1
      },
      "styleWeights": {
        "puncher": 2,
        "tempo": 1
      }
    },
    "mexico_norte_boxing": {
      "focusBoosts": {
        "power": 2,
        "endurance": 1
      },
      "styleWeights": {
        "puncher": 2
      }
    },
    "usa_vegas_workshop": {
      "focusBoosts": {
        "technique": 2,
        "defense": 1
      },
      "styleWeights": {
        "outboxer": 2,
        "puncher": 1
      }
    },
    "usa_brooklyn_grind": {
      "focusBoosts": {
        "endurance": 2,
        "recovery": 1
      },
      "styleWeights": {
        "tempo": 2
      }
    },
    "russia_yard_team": {
      "focusBoosts": {
        "power": 1,
        "defense": 2
      },
      "styleWeights": {
        "counterpuncher": 1,
        "puncher": 1
      }
    },
    "russia_neva_line": {
      "focusBoosts": {
        "defense": 2,
        "technique": 2
      },
      "styleWeights": {
        "counterpuncher": 2,
        "outboxer": 1
      }
    },
    "cuba_malecon_school": {
      "focusBoosts": {
        "defense": 2,
        "recovery": 1
      },
      "styleWeights": {
        "outboxer": 2,
        "counterpuncher": 1
      }
    },
    "cuba_santiago_rhythm": {
      "focusBoosts": {
        "endurance": 2,
        "technique": 1
      },
      "styleWeights": {
        "tempo": 2,
        "outboxer": 1
      }
    },
    "japan_tokyo_discipline": {
      "focusBoosts": {
        "technique": 2,
        "defense": 2
      },
      "styleWeights": {
        "outboxer": 2,
        "counterpuncher": 1
      }
    },
    "japan_osaka_smoke": {
      "focusBoosts": {
        "technique": 2,
        "defense": 1
      },
      "styleWeights": {
        "outboxer": 1,
        "tempo": 1
      }
    },
    "china_shanghai_engine": {
      "focusBoosts": {
        "technique": 2,
        "endurance": 1
      },
      "styleWeights": {
        "outboxer": 1,
        "tempo": 1
      }
    },
    "china_beijing_iron": {
      "focusBoosts": {
        "power": 2,
        "defense": 1
      },
      "styleWeights": {
        "puncher": 2,
        "counterpuncher": 1
      }
    },
    "uk_london_cellar": {
      "focusBoosts": {
        "technique": 2,
        "defense": 1
      },
      "styleWeights": {
        "outboxer": 2
      }
    },
    "uk_manchester_brick": {
      "focusBoosts": {
        "endurance": 2,
        "power": 1
      },
      "styleWeights": {
        "tempo": 1,
        "puncher": 1
      }
    },
    "philippines_manila_motor": {
      "focusBoosts": {
        "endurance": 2,
        "technique": 2
      },
      "styleWeights": {
        "tempo": 2
      }
    },
    "philippines_cebu_storm": {
      "focusBoosts": {
        "technique": 2,
        "power": 1
      },
      "styleWeights": {
        "tempo": 1,
        "puncher": 1
      }
    }
  }
};


