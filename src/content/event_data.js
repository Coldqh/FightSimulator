var EVENT_DATA = {
  "triggerChance": 52,
  "events": [
    {
      "id": "rent_due_notice",
      "title": "Хозяин ждёт оплату",
      "text": "Пора платить за комнату. Денег мало, а тянуть уже некуда.",
      "conditions": {
        "maxMoney": 50,
        "minWeek": 2
      },
      "weight": 8,
      "cooldown": 5,
      "repeatable": true,
      "choices": [
        {
          "id": "pay",
          "label": "Заплатить сейчас",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": -30
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": -3
            }
          ],
          "tagChanges": {
            "add": [
              "paid_rent"
            ],
            "remove": [
              "rent_delay"
            ]
          }
        },
        {
          "id": "delay",
          "label": "Потянуть ещё",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": 8
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": -4
            }
          ],
          "tagChanges": {
            "add": [
              "rent_delay"
            ]
          }
        }
      ]
    },
    {
      "id": "friend_spare_couch",
      "title": "{friend} зовёт к себе",
      "text": "{friend} видит, что с деньгами туго, и предлагает пару ночей у себя.",
      "actors": [
        {
          "slot": "friend",
          "role": "friend",
          "required": true
        }
      ],
      "conditions": {
        "maxMoney": 35,
        "relationAtLeast": [
          {
            "role": "friend",
            "affinity": 45,
            "trust": 40
          }
        ]
      },
      "weight": 7,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "accept",
          "label": "Согласиться",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": -8
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 5
            },
            {
              "type": "relation",
              "slot": "friend",
              "affinity": 4,
              "respect": 1,
              "trust": 5,
              "tension": -2
            }
          ],
          "tagChanges": {
            "add": [
              "accepted_help"
            ]
          }
        },
        {
          "id": "refuse",
          "label": "Отказаться",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": 4
            },
            {
              "type": "relation",
              "slot": "friend",
              "affinity": -2,
              "respect": 2,
              "trust": -2,
              "tension": 1
            }
          ],
          "tagChanges": {
            "add": [
              "too_proud"
            ]
          }
        }
      ]
    },
    {
      "id": "gym_owner_cash_shift",
      "title": "{gym_owner} подкидывает смену",
      "text": "{gym_owner} предлагает подработать в зале и быстро поднять немного денег.",
      "actors": [
        {
          "slot": "gym_owner",
          "role": "gym_owner",
          "required": true
        }
      ],
      "conditions": {
        "maxMoney": 80,
        "requiresRolesAll": [
          "gym_owner"
        ]
      },
      "weight": 7,
      "cooldown": 6,
      "repeatable": true,
      "choices": [
        {
          "id": "take_shift",
          "label": "Взять смену",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": 55
            },
            {
              "type": "resource",
              "key": "health",
              "delta": -6
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 5
            },
            {
              "type": "condition",
              "key": "fatigue",
              "delta": 8
            },
            {
              "type": "relation",
              "slot": "gym_owner",
              "affinity": 1,
              "respect": 4,
              "trust": 2,
              "tension": -1
            }
          ],
          "tagChanges": null
        },
        {
          "id": "decline_shift",
          "label": "Отказаться",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": 1
            },
            {
              "type": "relation",
              "slot": "gym_owner",
              "affinity": 0,
              "respect": -2,
              "trust": -1,
              "tension": 2
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "broken_wraps_market",
      "title": "Бинты уже никуда",
      "text": "Старые бинты совсем умерли. Надо решать, брать новые или терпеть.",
      "conditions": {
        "maxMoney": 120,
        "minWeek": 2
      },
      "weight": 6,
      "cooldown": 7,
      "repeatable": true,
      "choices": [
        {
          "id": "buy_gear",
          "label": "Купить новые",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": -25
            },
            {
              "type": "condition",
              "key": "wear",
              "delta": -3
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 2
            }
          ],
          "tagChanges": null
        },
        {
          "id": "save_money",
          "label": "Потерпеть",
          "effects": [
            {
              "type": "condition",
              "key": "wear",
              "delta": 3
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 2
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "cheap_street_food",
      "title": "Еда на скорую руку",
      "text": "Нужно быстро поесть. Можно взять что-то нормальное, а можно просто забить желудок.",
      "conditions": {
        "maxHealth": 85,
        "minWeek": 2
      },
      "weight": 6,
      "cooldown": 4,
      "repeatable": true,
      "choices": [
        {
          "id": "eat_clean",
          "label": "Взять нормальную еду",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": -18
            },
            {
              "type": "resource",
              "key": "health",
              "delta": 6
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": -2
            }
          ],
          "tagChanges": null
        },
        {
          "id": "eat_cheap",
          "label": "Съесть что под руку",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": 8
            },
            {
              "type": "resource",
              "key": "health",
              "delta": -4
            },
            {
              "type": "condition",
              "key": "wear",
              "delta": 2
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "sleep_debt_week",
      "title": "Неделя без сна",
      "text": "Ты копишь усталость уже не первую ночь. Ещё немного, и тело начнёт спорить с головой.",
      "conditions": {
        "minFatigue": 35,
        "minStress": 25
      },
      "weight": 7,
      "cooldown": 5,
      "repeatable": true,
      "choices": [
        {
          "id": "force_rest",
          "label": "Сбавить темп",
          "effects": [
            {
              "type": "condition",
              "key": "fatigue",
              "delta": -10
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 3
            }
          ],
          "tagChanges": {
            "add": [
              "learned_to_rest"
            ]
          }
        },
        {
          "id": "push_through",
          "label": "Дожать себя",
          "effects": [
            {
              "type": "condition",
              "key": "fatigue",
              "delta": 10
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 5
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": -3
            }
          ],
          "tagChanges": {
            "add": [
              "grinder"
            ]
          }
        }
      ]
    },
    {
      "id": "trainer_double_session",
      "title": "{trainer} хочет вторую сессию",
      "text": "{trainer} считает, что тебе мало одной тренировки, и предлагает ещё один заход.",
      "actors": [
        {
          "slot": "trainer",
          "role": "trainer",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "trainer"
        ],
        "recentActionAny": [
          "train"
        ],
        "relationAtLeast": [
          {
            "role": "trainer",
            "respect": 45
          }
        ]
      },
      "weight": 8,
      "cooldown": 6,
      "repeatable": true,
      "choices": [
        {
          "id": "agree",
          "label": "Пойти ещё раз",
          "effects": [
            {
              "type": "resource",
              "key": "skillPoints",
              "delta": 6
            },
            {
              "type": "resource",
              "key": "health",
              "delta": -5
            },
            {
              "type": "condition",
              "key": "fatigue",
              "delta": 6
            },
            {
              "type": "relation",
              "slot": "trainer",
              "affinity": 1,
              "respect": 5,
              "trust": 3,
              "tension": -1
            }
          ],
          "tagChanges": {
            "add": [
              "grinder"
            ]
          }
        },
        {
          "id": "decline",
          "label": "Оставить как есть",
          "effects": [
            {
              "type": "condition",
              "key": "fatigue",
              "delta": -4
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 2
            },
            {
              "type": "relation",
              "slot": "trainer",
              "affinity": 0,
              "respect": -1,
              "trust": 1,
              "tension": 1
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "trainer_calls_for_rest",
      "title": "{trainer} тормозит тебя",
      "text": "{trainer} видит, что ты уже подсел, и говорит прямо: нужен отдых.",
      "actors": [
        {
          "slot": "trainer",
          "role": "trainer",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "trainer"
        ],
        "minWear": 40
      },
      "weight": 7,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "listen",
          "label": "Послушать",
          "effects": [
            {
              "type": "condition",
              "key": "wear",
              "delta": -5
            },
            {
              "type": "resource",
              "key": "health",
              "delta": 6
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 2
            },
            {
              "type": "relation",
              "slot": "trainer",
              "affinity": 0,
              "respect": 2,
              "trust": 4,
              "tension": -2
            }
          ],
          "tagChanges": null
        },
        {
          "id": "ignore",
          "label": "Упереться",
          "effects": [
            {
              "type": "condition",
              "key": "wear",
              "delta": 6
            },
            {
              "type": "resource",
              "key": "health",
              "delta": -4
            },
            {
              "type": "relation",
              "slot": "trainer",
              "affinity": 0,
              "respect": -2,
              "trust": -4,
              "tension": 4
            }
          ],
          "tagChanges": {
            "add": [
              "ignores_limits"
            ]
          }
        }
      ]
    },
    {
      "id": "sparring_invitation",
      "title": "{sparring} зовёт в жёсткие раунды",
      "text": "{sparring} хочет тяжёлый спарринг. Можно проверить себя, а можно не лезть лишний раз.",
      "actors": [
        {
          "slot": "sparring",
          "role": "sparring",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "sparring"
        ],
        "minHealth": 55
      },
      "weight": 7,
      "cooldown": 5,
      "repeatable": true,
      "choices": [
        {
          "id": "go_hard",
          "label": "Принять",
          "effects": [
            {
              "type": "resource",
              "key": "skillPoints",
              "delta": 5
            },
            {
              "type": "resource",
              "key": "health",
              "delta": -6
            },
            {
              "type": "condition",
              "key": "fatigue",
              "delta": 5
            },
            {
              "type": "relation",
              "slot": "sparring",
              "affinity": 1,
              "respect": 4,
              "trust": 0,
              "tension": 2
            }
          ],
          "tagChanges": null
        },
        {
          "id": "keep_light",
          "label": "Пропустить",
          "effects": [
            {
              "type": "resource",
              "key": "skillPoints",
              "delta": 2
            },
            {
              "type": "condition",
              "key": "fatigue",
              "delta": 1
            },
            {
              "type": "relation",
              "slot": "sparring",
              "affinity": 0,
              "respect": 1,
              "trust": 2,
              "tension": -1
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "rival_barb_public",
      "title": "{rival} цепляет на людях",
      "text": "{rival} снова открывает рот при всех. Все ждут, что ты ответишь.",
      "actors": [
        {
          "slot": "rival",
          "role": "rival",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "rival"
        ],
        "minFame": 10
      },
      "weight": 7,
      "cooldown": 6,
      "repeatable": true,
      "choices": [
        {
          "id": "answer_cold",
          "label": "Ответить резко",
          "effects": [
            {
              "type": "resource",
              "key": "fame",
              "delta": 2
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 1
            },
            {
              "type": "relation",
              "slot": "rival",
              "affinity": -1,
              "respect": 3,
              "trust": 0,
              "tension": -1
            }
          ],
          "tagChanges": null
        },
        {
          "id": "snap_back",
          "label": "Не вестись",
          "effects": [
            {
              "type": "resource",
              "key": "fame",
              "delta": 3
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 4
            },
            {
              "type": "relation",
              "slot": "rival",
              "affinity": -4,
              "respect": 1,
              "trust": 0,
              "tension": 8
            }
          ],
          "tagChanges": {
            "add": [
              "public_spat"
            ]
          }
        }
      ]
    },
    {
      "id": "rival_secret_respect",
      "title": "{rival} вдруг говорит нормально",
      "text": "{rival} неожиданно без грязи признаёт, что ты стал сильнее.",
      "actors": [
        {
          "slot": "rival",
          "role": "rival",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "rival"
        ],
        "relationAtLeast": [
          {
            "role": "rival",
            "tension": 45,
            "respect": 40
          }
        ]
      },
      "weight": 4,
      "cooldown": 10,
      "repeatable": true,
      "choices": [
        {
          "id": "take_respect",
          "label": "Принять это",
          "effects": [
            {
              "type": "relation",
              "slot": "rival",
              "affinity": 1,
              "respect": 6,
              "trust": 2,
              "tension": -4
            }
          ],
          "tagChanges": {
            "add": [
              "earned_rival_respect"
            ]
          }
        },
        {
          "id": "twist_knife",
          "label": "Оставить холод",
          "effects": [
            {
              "type": "resource",
              "key": "fame",
              "delta": 1
            },
            {
              "type": "relation",
              "slot": "rival",
              "affinity": -2,
              "respect": 0,
              "trust": -3,
              "tension": 7
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "promoter_small_sponsor",
      "title": "{promoter} нашёл мелкий контракт",
      "text": "{promoter} приносит маленький, но чистый вариант. Не шик, зато без грязи.",
      "actors": [
        {
          "slot": "promoter",
          "role": "promoter",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "promoter"
        ],
        "minFame": 12
      },
      "weight": 6,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "take_it",
          "label": "Взять",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": 65
            },
            {
              "type": "resource",
              "key": "fame",
              "delta": 3
            },
            {
              "type": "relation",
              "slot": "promoter",
              "affinity": 1,
              "respect": 2,
              "trust": 4,
              "tension": 0
            }
          ],
          "tagChanges": {
            "add": [
              "media_friendly"
            ]
          }
        },
        {
          "id": "stay_raw",
          "label": "Подождать лучшее",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": 1
            },
            {
              "type": "relation",
              "slot": "promoter",
              "affinity": 0,
              "respect": -1,
              "trust": -2,
              "tension": 2
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "promoter_dirty_cash",
      "title": "{promoter} суёт грязные деньги",
      "text": "{promoter} предлагает быстрые деньги за сомнительную историю.",
      "actors": [
        {
          "slot": "promoter",
          "role": "promoter",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "promoter"
        ],
        "minFame": 18,
        "biographyFlagsNot": [
          "kept_clean"
        ]
      },
      "weight": 5,
      "cooldown": 12,
      "repeatable": true,
      "choices": [
        {
          "id": "take_dirty",
          "label": "Взять деньги",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": 120
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 7
            },
            {
              "type": "relation",
              "slot": "promoter",
              "affinity": 0,
              "respect": 2,
              "trust": 5,
              "tension": 1
            }
          ],
          "tagChanges": {
            "add": [
              "took_dirty_money"
            ],
            "remove": [
              "kept_clean"
            ]
          }
        },
        {
          "id": "refuse_dirty",
          "label": "Отказаться",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": 4
            },
            {
              "type": "resource",
              "key": "fame",
              "delta": 1
            },
            {
              "type": "relation",
              "slot": "promoter",
              "affinity": 0,
              "respect": 1,
              "trust": -3,
              "tension": 3
            }
          ],
          "tagChanges": {
            "add": [
              "kept_clean"
            ]
          }
        }
      ]
    },
    {
      "id": "promoter_foreign_card",
      "title": "{promoter} тянет за границу",
      "text": "{promoter} говорит, что за рубежом сейчас можно громко выстрелить.",
      "actors": [
        {
          "slot": "promoter",
          "role": "promoter",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "promoter"
        ],
        "abroadOnly": true,
        "minFame": 25
      },
      "weight": 5,
      "cooldown": 10,
      "repeatable": true,
      "choices": [
        {
          "id": "lean_in",
          "label": "Рискнуть",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": -25
            },
            {
              "type": "resource",
              "key": "fame",
              "delta": 6
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 3
            },
            {
              "type": "relation",
              "slot": "promoter",
              "affinity": 0,
              "respect": 2,
              "trust": 4,
              "tension": 0
            }
          ],
          "tagChanges": null
        },
        {
          "id": "stay_low",
          "label": "Остаться дома",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": -2
            },
            {
              "type": "relation",
              "slot": "promoter",
              "affinity": 0,
              "respect": 0,
              "trust": -1,
              "tension": 1
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "journalist_interview",
      "title": "{journalist} просит разговор",
      "text": "{journalist} хочет интервью. Можно дать ему тему, а можно оставить без материала.",
      "actors": [
        {
          "slot": "journalist",
          "role": "journalist",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "journalist"
        ],
        "minFame": 16
      },
      "weight": 6,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "open_up",
          "label": "Поговорить",
          "effects": [
            {
              "type": "resource",
              "key": "fame",
              "delta": 4
            },
            {
              "type": "relation",
              "slot": "journalist",
              "affinity": 2,
              "respect": 1,
              "trust": 4,
              "tension": 0
            }
          ],
          "tagChanges": {
            "add": [
              "media_friendly"
            ]
          }
        },
        {
          "id": "stay_closed",
          "label": "Отказать",
          "effects": [
            {
              "type": "resource",
              "key": "fame",
              "delta": 1
            },
            {
              "type": "relation",
              "slot": "journalist",
              "affinity": 0,
              "respect": 0,
              "trust": -2,
              "tension": 2
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "journalist_smear",
      "title": "{journalist} копает под тебя",
      "text": "{journalist} тащит наружу грязные слухи и хочет сделать из этого историю.",
      "actors": [
        {
          "slot": "journalist",
          "role": "journalist",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "journalist"
        ],
        "minFame": 20,
        "biographyFlagsAny": [
          "took_dirty_money",
          "public_spat"
        ]
      },
      "weight": 4,
      "cooldown": 12,
      "repeatable": true,
      "choices": [
        {
          "id": "buy_silence",
          "label": "Ответить",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": -60
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 3
            },
            {
              "type": "relation",
              "slot": "journalist",
              "affinity": -2,
              "respect": 0,
              "trust": -4,
              "tension": 4
            }
          ],
          "tagChanges": null
        },
        {
          "id": "stand_tall",
          "label": "Промолчать",
          "effects": [
            {
              "type": "resource",
              "key": "fame",
              "delta": -2
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 3
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 5
            }
          ],
          "tagChanges": {
            "add": [
              "weathered_scandal"
            ]
          }
        }
      ]
    },
    {
      "id": "doctor_discount",
      "title": "{doctor} идёт навстречу",
      "text": "{doctor} видит, что тебе тяжело, и предлагает помочь подешевле.",
      "actors": [
        {
          "slot": "doctor",
          "role": "doctor",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "doctor"
        ],
        "maxHealth": 65,
        "relationAtLeast": [
          {
            "role": "doctor",
            "trust": 35
          }
        ]
      },
      "weight": 5,
      "cooldown": 10,
      "repeatable": true,
      "choices": [
        {
          "id": "take_help",
          "label": "Согласиться",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": -20
            },
            {
              "type": "resource",
              "key": "health",
              "delta": 10
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": -3
            },
            {
              "type": "relation",
              "slot": "doctor",
              "affinity": 1,
              "respect": 2,
              "trust": 4,
              "tension": -1
            }
          ],
          "tagChanges": null
        },
        {
          "id": "save_cash",
          "label": "Сэкономить",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": 10
            },
            {
              "type": "condition",
              "key": "wear",
              "delta": 3
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "doctor_hide_injury",
      "title": "{doctor} шепчет про травму",
      "text": "{doctor} может прикрыть проблему, если ты захочешь пойти дальше как ни в чём не бывало.",
      "actors": [
        {
          "slot": "doctor",
          "role": "doctor",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "doctor"
        ],
        "minFame": 18,
        "maxHealth": 75
      },
      "weight": 4,
      "cooldown": 12,
      "repeatable": true,
      "choices": [
        {
          "id": "hide_it",
          "label": "Спрятать",
          "effects": [
            {
              "type": "resource",
              "key": "fame",
              "delta": 2
            },
            {
              "type": "condition",
              "key": "wear",
              "delta": 5
            },
            {
              "type": "relation",
              "slot": "doctor",
              "affinity": 0,
              "respect": 1,
              "trust": 3,
              "tension": 1
            }
          ],
          "tagChanges": {
            "add": [
              "hides_injuries"
            ]
          }
        },
        {
          "id": "tell_truth",
          "label": "Играть честно",
          "effects": [
            {
              "type": "resource",
              "key": "fame",
              "delta": -1
            },
            {
              "type": "resource",
              "key": "health",
              "delta": 4
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 2
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "friend_neighborhood_night",
      "title": "{friend} тянет на улицу",
      "text": "{friend} зовёт просто пройтись, поговорить и выдохнуть.",
      "actors": [
        {
          "slot": "friend",
          "role": "friend",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "friend"
        ],
        "minStress": 30
      },
      "weight": 6,
      "cooldown": 7,
      "repeatable": true,
      "choices": [
        {
          "id": "go_out",
          "label": "Пойти",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": -7
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 4
            },
            {
              "type": "relation",
              "slot": "friend",
              "affinity": 5,
              "respect": 1,
              "trust": 3,
              "tension": -2
            }
          ],
          "tagChanges": null
        },
        {
          "id": "stay_locked",
          "label": "Остаться",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": -2
            },
            {
              "type": "relation",
              "slot": "friend",
              "affinity": -1,
              "respect": 0,
              "trust": -2,
              "tension": 1
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "friend_needs_cash",
      "title": "{friend} просит денег",
      "text": "{friend} попал в яму и просит выручить. Сам ты тоже не в роскоши.",
      "actors": [
        {
          "slot": "friend",
          "role": "friend",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "friend"
        ],
        "minMoney": 40
      },
      "weight": 5,
      "cooldown": 10,
      "repeatable": true,
      "choices": [
        {
          "id": "lend",
          "label": "Помочь",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": -25
            },
            {
              "type": "relation",
              "slot": "friend",
              "affinity": 4,
              "respect": 1,
              "trust": 5,
              "tension": -2
            }
          ],
          "tagChanges": {
            "add": [
              "stood_by_friend"
            ]
          }
        },
        {
          "id": "refuse",
          "label": "Не дать",
          "effects": [
            {
              "type": "relation",
              "slot": "friend",
              "affinity": -4,
              "respect": 0,
              "trust": -5,
              "tension": 3
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": -1
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "friend_covers_for_you",
      "title": "{friend} прикрывает тебя",
      "text": "{friend} решает часть твоих проблем без лишних слов и вытягивает неделю.",
      "actors": [
        {
          "slot": "friend",
          "role": "friend",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "friend"
        ],
        "maxStress": 70,
        "relationAtLeast": [
          {
            "role": "friend",
            "trust": 50
          }
        ]
      },
      "weight": 4,
      "cooldown": 12,
      "repeatable": true,
      "choices": [
        {
          "id": "accept_cover",
          "label": "Принять помощь",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": -5
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 4
            },
            {
              "type": "relation",
              "slot": "friend",
              "affinity": 3,
              "respect": 0,
              "trust": 5,
              "tension": -2
            }
          ],
          "tagChanges": null
        },
        {
          "id": "pay_back_now",
          "label": "Не брать",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": -20
            },
            {
              "type": "relation",
              "slot": "friend",
              "affinity": 1,
              "respect": 2,
              "trust": 2,
              "tension": -1
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "gym_owner_help_kid",
      "title": "{gym_owner} просит помочь пацану",
      "text": "{gym_owner} просит показать новичку базу. Для тебя это мелочь, для него может быть начало.",
      "actors": [
        {
          "slot": "gym_owner",
          "role": "gym_owner",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "gym_owner"
        ],
        "homeOnly": true
      },
      "weight": 5,
      "cooldown": 9,
      "repeatable": true,
      "choices": [
        {
          "id": "help",
          "label": "Помочь",
          "effects": [
            {
              "type": "resource",
              "key": "fame",
              "delta": 2
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 3
            },
            {
              "type": "relation",
              "slot": "gym_owner",
              "affinity": 1,
              "respect": 4,
              "trust": 2,
              "tension": -1
            }
          ],
          "tagChanges": {
            "add": [
              "helped_kid"
            ]
          }
        },
        {
          "id": "skip",
          "label": "Отмахнуться",
          "effects": [
            {
              "type": "relation",
              "slot": "gym_owner",
              "affinity": 0,
              "respect": -3,
              "trust": -1,
              "tension": 2
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "gym_owner_demands_respect",
      "title": "{gym_owner} ставит рамки",
      "text": "{gym_owner} напоминает, что в его зале есть порядок, и ты не выше этих правил.",
      "actors": [
        {
          "slot": "gym_owner",
          "role": "gym_owner",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "gym_owner"
        ],
        "recentActionAny": [
          "work",
          "train"
        ]
      },
      "weight": 4,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "show_respect",
          "label": "Принять",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": 2
            },
            {
              "type": "relation",
              "slot": "gym_owner",
              "affinity": 0,
              "respect": 5,
              "trust": 2,
              "tension": -1
            }
          ],
          "tagChanges": null
        },
        {
          "id": "brush_off",
          "label": "Встать в позу",
          "effects": [
            {
              "type": "relation",
              "slot": "gym_owner",
              "affinity": 0,
              "respect": -4,
              "trust": 0,
              "tension": 4
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "road_customs_hassle",
      "title": "Дорога опять кусается",
      "text": "Поездка застревает на ровном месте. Бумаги, ожидание, нервы.",
      "conditions": {
        "abroadOnly": true,
        "recentActionAny": [
          "travel"
        ]
      },
      "weight": 7,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "pay_fast",
          "label": "Разрулить деньгами",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": -20
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 2
            }
          ],
          "tagChanges": null
        },
        {
          "id": "endure",
          "label": "Терпеть",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": 6
            },
            {
              "type": "condition",
              "key": "fatigue",
              "delta": 5
            }
          ],
          "tagChanges": {
            "add": [
              "road_hardened"
            ]
          }
        }
      ]
    },
    {
      "id": "new_city_loneliness",
      "title": "Чужой город давит",
      "text": "Новый город не радует. Всё чужое, и ты это чувствуешь.",
      "conditions": {
        "abroadOnly": true,
        "minStress": 30
      },
      "weight": 6,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "explore",
          "label": "Собраться и выйти",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": -4
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 3
            }
          ],
          "tagChanges": {
            "add": [
              "road_hardened"
            ]
          }
        },
        {
          "id": "hide",
          "label": "Закрыться",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": 4
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": -3
            }
          ],
          "tagChanges": {
            "add": [
              "homesick"
            ]
          }
        }
      ]
    },
    {
      "id": "abroad_local_respect",
      "title": "Тебя начинают узнавать",
      "text": "На чужой земле на тебя уже смотрят не как на случайного парня.",
      "conditions": {
        "abroadOnly": true,
        "minFame": 18
      },
      "weight": 5,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "lean_into_it",
          "label": "Поддержать разговор",
          "effects": [
            {
              "type": "resource",
              "key": "fame",
              "delta": 4
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 2
            }
          ],
          "tagChanges": null
        },
        {
          "id": "stay_workman",
          "label": "Держать дистанцию",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": 2
            }
          ],
          "tagChanges": {
            "add": [
              "quiet_worker"
            ]
          }
        }
      ]
    },
    {
      "id": "home_call_from_family",
      "title": "Звонок из дома",
      "text": "Дом напоминает о себе в тот момент, когда голова и так перегружена.",
      "conditions": {
        "homeOnly": true,
        "minStress": 40
      },
      "weight": 5,
      "cooldown": 10,
      "repeatable": true,
      "choices": [
        {
          "id": "pick_up",
          "label": "Ответить и поговорить",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": -6
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 4
            }
          ],
          "tagChanges": {
            "add": [
              "stays_connected"
            ]
          }
        },
        {
          "id": "ignore",
          "label": "Сбросить и потом",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": 3
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": -4
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "after_win_buzz",
      "title": "После победы вокруг шум",
      "text": "После удачного боя люди говорят о тебе громче обычного.",
      "conditions": {
        "lastActionType": "fight",
        "lastFightResult": "win"
      },
      "weight": 7,
      "cooldown": 5,
      "repeatable": true,
      "choices": [
        {
          "id": "ride_buzz",
          "label": "Поймать волну",
          "effects": [
            {
              "type": "resource",
              "key": "fame",
              "delta": 4
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 3
            }
          ],
          "tagChanges": {
            "add": [
              "public_name"
            ]
          }
        },
        {
          "id": "stay_quiet",
          "label": "Остыть",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": -2
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 1
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "after_loss_doubt",
      "title": "После поражения всё глуше",
      "text": "После неудачи в голову лезут лишние мысли.",
      "conditions": {
        "lastActionType": "fight",
        "lastFightResult": "loss"
      },
      "weight": 8,
      "cooldown": 5,
      "repeatable": true,
      "choices": [
        {
          "id": "watch_tape",
          "label": "Принять удар",
          "effects": [
            {
              "type": "resource",
              "key": "skillPoints",
              "delta": 5
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": -1
            }
          ],
          "tagChanges": {
            "add": [
              "learns_from_losses"
            ]
          }
        },
        {
          "id": "avoid_it",
          "label": "Закрыться",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": 5
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": -4
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "after_ko_noise",
      "title": "После нокаута шум только вырос",
      "text": "После яркой концовки все обсуждают тебя ещё громче.",
      "conditions": {
        "lastActionType": "fight",
        "lastFightMethodContains": "KO"
      },
      "weight": 6,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "embrace",
          "label": "Выйти в свет",
          "effects": [
            {
              "type": "resource",
              "key": "fame",
              "delta": 5
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 2
            }
          ],
          "tagChanges": {
            "add": [
              "finisher"
            ]
          }
        },
        {
          "id": "downplay",
          "label": "Уйти в тень",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": 2
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": -1
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "trainer_rebuild_after_loss",
      "title": "{trainer} хочет собрать тебя заново",
      "text": "{trainer} видит, что после поражения ты просел, и предлагает начать с простого.",
      "actors": [
        {
          "slot": "trainer",
          "role": "trainer",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "trainer"
        ],
        "lastActionType": "fight",
        "lastFightResult": "loss"
      },
      "weight": 7,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "trust_process",
          "label": "Слушать",
          "effects": [
            {
              "type": "resource",
              "key": "skillPoints",
              "delta": 4
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 4
            },
            {
              "type": "relation",
              "slot": "trainer",
              "affinity": 2,
              "respect": 3,
              "trust": 5,
              "tension": 0
            }
          ],
          "tagChanges": null
        },
        {
          "id": "close_off",
          "label": "Упереться",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": 4
            },
            {
              "type": "relation",
              "slot": "trainer",
              "affinity": 0,
              "respect": 0,
              "trust": -4,
              "tension": 4
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "promoter_after_win_offer",
      "title": "{promoter} сует новый шанс",
      "text": "{promoter} чувствует победу и быстро несёт новый вариант.",
      "actors": [
        {
          "slot": "promoter",
          "role": "promoter",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "promoter"
        ],
        "lastActionType": "fight",
        "lastFightResult": "win"
      },
      "weight": 6,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "meet",
          "label": "Слушать",
          "effects": [
            {
              "type": "resource",
              "key": "fame",
              "delta": 2
            },
            {
              "type": "relation",
              "slot": "promoter",
              "affinity": 1,
              "respect": 3,
              "trust": 4,
              "tension": 0
            }
          ],
          "tagChanges": null
        },
        {
          "id": "stay_busy",
          "label": "Притормозить",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": 1
            },
            {
              "type": "relation",
              "slot": "promoter",
              "affinity": 0,
              "respect": 0,
              "trust": -2,
              "tension": 1
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "rival_after_win_callout",
      "title": "{rival} сразу подаёт голос",
      "text": "{rival} использует твой успех как повод влезть в следующий разговор о реванше.",
      "actors": [
        {
          "slot": "rival",
          "role": "rival",
          "required": true
        }
      ],
      "conditions": {
        "requiresRolesAll": [
          "rival"
        ],
        "lastActionType": "fight",
        "lastFightResult": "win"
      },
      "weight": 6,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "accept_heat",
          "label": "Ответить",
          "effects": [
            {
              "type": "resource",
              "key": "fame",
              "delta": 3
            },
            {
              "type": "relation",
              "slot": "rival",
              "affinity": 0,
              "respect": 2,
              "trust": 0,
              "tension": 7
            }
          ],
          "tagChanges": {
            "add": [
              "rival_feud"
            ]
          }
        },
        {
          "id": "freeze_out",
          "label": "Не кормить",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": -1
            },
            {
              "type": "relation",
              "slot": "rival",
              "affinity": 0,
              "respect": -1,
              "trust": 0,
              "tension": 2
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "empty_wallet_temptation",
      "title": "Пустой карман шепчет",
      "text": "Когда денег совсем мало, в голову лезут плохие идеи.",
      "conditions": {
        "maxMoney": 25,
        "minWeek": 3
      },
      "weight": 7,
      "cooldown": 10,
      "repeatable": true,
      "choices": [
        {
          "id": "take_risk_cash",
          "label": "Взять грязный вариант",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": 70
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 8
            }
          ],
          "tagChanges": {
            "add": [
              "street_debt",
              "took_dirty_money"
            ]
          }
        },
        {
          "id": "stay_clean",
          "label": "Перетерпеть",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": 4
            }
          ],
          "tagChanges": {
            "add": [
              "kept_clean"
            ]
          }
        }
      ]
    },
    {
      "id": "quiet_self_reflection",
      "title": "Тихая неделя в голове",
      "text": "Иногда надо просто посидеть и честно подумать, что вообще с тобой происходит.",
      "conditions": {
        "minStress": 50,
        "maxMorale": 55
      },
      "weight": 6,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "write_it_down",
          "label": "Разобрать всё",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": -6
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 5
            }
          ],
          "tagChanges": {
            "add": [
              "reflective"
            ]
          }
        },
        {
          "id": "bury_it",
          "label": "Отогнать мысли",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": 4
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": -3
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "worn_body_warning",
      "title": "Тело начинает спорить",
      "text": "Износ уже не скрыть. Организм просит сбавить.",
      "conditions": {
        "minWear": 55
      },
      "weight": 8,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "respect_body",
          "label": "Сбавить",
          "effects": [
            {
              "type": "condition",
              "key": "wear",
              "delta": -6
            },
            {
              "type": "resource",
              "key": "health",
              "delta": 5
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 2
            }
          ],
          "tagChanges": null
        },
        {
          "id": "ignore_body",
          "label": "Давить дальше",
          "effects": [
            {
              "type": "condition",
              "key": "wear",
              "delta": 5
            },
            {
              "type": "resource",
              "key": "health",
              "delta": -5
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 3
            }
          ],
          "tagChanges": {
            "add": [
              "ignores_limits"
            ]
          }
        }
      ]
    },
    {
      "id": "grinder_breakthrough",
      "title": "Тяжёлая рутина дала ответ",
      "text": "Всё это однообразие вдруг начинает давать реальный толк.",
      "conditions": {
        "recentActionAny": [
          "train"
        ],
        "biographyFlagsAny": [
          "grinder"
        ],
        "minWeek": 4
      },
      "weight": 5,
      "cooldown": 12,
      "repeatable": true,
      "choices": [
        {
          "id": "lock_in",
          "label": "Продолжать",
          "effects": [
            {
              "type": "resource",
              "key": "skillPoints",
              "delta": 8
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 4
            }
          ],
          "tagChanges": null
        },
        {
          "id": "overcook",
          "label": "Ослабить хватку",
          "effects": [
            {
              "type": "resource",
              "key": "skillPoints",
              "delta": 5
            },
            {
              "type": "condition",
              "key": "fatigue",
              "delta": 6
            },
            {
              "type": "resource",
              "key": "health",
              "delta": -3
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "community_support",
      "title": "Район начинает тянуть тебя вверх",
      "text": "Люди вокруг всё чаще говорят, что за тебя реально болеют.",
      "conditions": {
        "homeOnly": true,
        "minFame": 25,
        "biographyFlagsAny": [
          "helped_kid",
          "stood_by_friend",
          "kept_clean"
        ]
      },
      "weight": 4,
      "cooldown": 14,
      "once": true,
      "choices": [
        {
          "id": "accept",
          "label": "Принять это",
          "effects": [
            {
              "type": "resource",
              "key": "fame",
              "delta": 5
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 5
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": -3
            }
          ],
          "tagChanges": {
            "add": [
              "community_backing"
            ]
          }
        },
        {
          "id": "stay_hungry",
          "label": "Держать дистанцию",
          "effects": [
            {
              "type": "resource",
              "key": "skillPoints",
              "delta": 4
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 1
            }
          ],
          "tagChanges": {
            "add": [
              "community_backing"
            ]
          }
        }
      ]
    },
    null
  ]
};

