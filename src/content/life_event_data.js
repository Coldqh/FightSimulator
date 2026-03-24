var LIFE_EVENT_DATA = {
  "events": [
    {
      "id": "rough_room_leak",
      "title": "Комната опять течёт",
      "text": "В плохом жилье снова что-то ломается. Жить так уже совсем неприятно.",
      "conditions": {
        "housingIs": "rough",
        "minWeek": 2
      },
      "weight": 8,
      "cooldown": 6,
      "repeatable": true,
      "choices": [
        {
          "id": "patch_it",
          "label": "Подлатать",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": -16
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": -3
            },
            {
              "type": "condition",
              "key": "wear",
              "delta": -2
            }
          ],
          "tagChanges": null
        },
        {
          "id": "live_with_it",
          "label": "Терпеть",
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
      "id": "rough_neighbors_noise",
      "title": "Соседи не дают спать",
      "text": "Шум за стеной снова бьёт по голове сильнее, чем хотелось бы.",
      "conditions": {
        "housingIs": "rough",
        "minStress": 20
      },
      "weight": 7,
      "cooldown": 5,
      "repeatable": true,
      "choices": [
        {
          "id": "snap_back",
          "label": "Ругнуться",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": 3
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": -1
            }
          ],
          "tagChanges": null
        },
        {
          "id": "walk_it_off",
          "label": "Просто уйти",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": -2
            },
            {
              "type": "condition",
              "key": "fatigue",
              "delta": 2
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "normal_room_small_order",
      "title": "Порядок в комнате",
      "text": "Иногда даже мелочь вроде убранной комнаты даёт голове выдохнуть.",
      "conditions": {
        "housingIs": "normal",
        "maxStress": 70
      },
      "weight": 5,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "keep_order",
          "label": "Навести порядок",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": -3
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 3
            }
          ],
          "tagChanges": {
            "add": [
              "keeps_order"
            ]
          }
        },
        {
          "id": "ignore_order",
          "label": "Оставить как есть",
          "effects": [
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
      "id": "comfort_first_good_sleep",
      "title": "Наконец-то выспался",
      "text": "Нормальный сон вдруг напоминает, как вообще должен чувствовать себя человек.",
      "conditions": {
        "housingIs": "comfortable",
        "minFatigue": 20
      },
      "weight": 7,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "lean_into_rest",
          "label": "Остаться в этом ритме",
          "effects": [
            {
              "type": "resource",
              "key": "health",
              "delta": 7
            },
            {
              "type": "condition",
              "key": "fatigue",
              "delta": -6
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 3
            }
          ],
          "tagChanges": null
        },
        {
          "id": "wake_early",
          "label": "Встать раньше и вернуться в режим",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": 1
            },
            {
              "type": "life",
              "key": "support",
              "delta": 1
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "comfort_bills_press",
      "title": "Комфорт стоит денег",
      "text": "Хорошее жильё приятно, но платёж за него тоже чувствуется.",
      "conditions": {
        "housingIs": "comfortable",
        "maxMoney": 70
      },
      "weight": 7,
      "cooldown": 6,
      "repeatable": true,
      "choices": [
        {
          "id": "hold_it",
          "label": "Тянуть дальше",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": -20
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 3
            }
          ],
          "tagChanges": null
        },
        {
          "id": "downgrade",
          "label": "Съехать попроще",
          "effects": [
            {
              "type": "life",
              "key": "housingId",
              "delta": 0,
              "value": "normal"
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": -3
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 1
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "friend_pulls_you_out",
      "title": "{friend} вытаскивает тебя из ямы",
      "text": "{friend} видит, что ты совсем закрылся, и не хочет оставлять тебя одного.",
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
        "maxSupport": 45,
        "minStress": 30
      },
      "weight": 8,
      "cooldown": 6,
      "repeatable": true,
      "choices": [
        {
          "id": "go_with_friend",
          "label": "Пойти с ним",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": -7
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 5
            },
            {
              "type": "life",
              "key": "support",
              "delta": 8
            },
            {
              "type": "relation",
              "slot": "friend",
              "affinity": 5,
              "respect": 1,
              "trust": 4,
              "tension": -2
            }
          ],
          "tagChanges": null
        },
        {
          "id": "stay_closed",
          "label": "Закрыться дома",
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
            },
            {
              "type": "life",
              "key": "support",
              "delta": -4
            },
            {
              "type": "relation",
              "slot": "friend",
              "affinity": -2,
              "respect": 0,
              "trust": -3,
              "tension": 1
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "team_dinner_after_camp",
      "title": "Команда зовёт посидеть",
      "text": "После тяжёлой недели свои хотят просто спокойно посидеть вместе.",
      "conditions": {
        "requiresRolesAny": [
          "trainer",
          "sparring"
        ],
        "recentActionAny": [
          "train",
          "fight"
        ]
      },
      "weight": 7,
      "cooldown": 7,
      "repeatable": true,
      "choices": [
        {
          "id": "join_team",
          "label": "Пойти",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": -12
            },
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
              "type": "life",
              "key": "support",
              "delta": 6
            }
          ],
          "tagChanges": null
        },
        {
          "id": "skip_team",
          "label": "Пропустить",
          "effects": [
            {
              "type": "condition",
              "key": "fatigue",
              "delta": -2
            },
            {
              "type": "life",
              "key": "support",
              "delta": -2
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "family_call_holds_you",
      "title": "Разговор с близкими держит",
      "text": "Один нормальный разговор с домом иногда решает больше, чем целая неделя шума.",
      "conditions": {
        "maxSupport": 70,
        "minStress": 18
      },
      "weight": 8,
      "cooldown": 6,
      "repeatable": true,
      "choices": [
        {
          "id": "answer",
          "label": "Поговорить как есть",
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
            },
            {
              "type": "life",
              "key": "support",
              "delta": 7
            }
          ],
          "tagChanges": {
            "add": [
              "family_grounded"
            ]
          }
        },
        {
          "id": "rush_it",
          "label": "Сказать, что всё нормально",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": -2
            },
            {
              "type": "life",
              "key": "support",
              "delta": -2
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "missed_family_day",
      "title": "Ты снова не приехал",
      "text": "Близкие ждали, а ты опять не выбрался. Это начинает болеть.",
      "conditions": {
        "minWeek": 4,
        "maxSupport": 65,
        "abroadOnly": true
      },
      "weight": 6,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "make_time",
          "label": "Позвонить и извиниться",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": -15
            },
            {
              "type": "condition",
              "key": "morale",
              "delta": 4
            },
            {
              "type": "life",
              "key": "support",
              "delta": 6
            }
          ],
          "tagChanges": null
        },
        {
          "id": "let_it_pass",
          "label": "Оставить как есть",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": -4
            },
            {
              "type": "life",
              "key": "support",
              "delta": -5
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 3
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "quiet_evening_clarity",
      "title": "Тихий вечер всё прояснил",
      "text": "Без шума и людей мысли вдруг становятся проще.",
      "conditions": {
        "maxSupport": 60,
        "maxStress": 55
      },
      "weight": 5,
      "cooldown": 7,
      "repeatable": true,
      "choices": [
        {
          "id": "write_plan",
          "label": "Зацепиться за это",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": 4
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": -3
            }
          ],
          "tagChanges": {
            "add": [
              "reflective"
            ]
          }
        },
        {
          "id": "drift",
          "label": "Не копаться",
          "effects": [
            {
              "type": "life",
              "key": "support",
              "delta": -1
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "hotel_loneliness_abroad",
      "title": "Один в чужом номере",
      "text": "На выезде особенно чувствуется, когда рядом никого своего.",
      "conditions": {
        "abroadOnly": true,
        "maxSupport": 40
      },
      "weight": 8,
      "cooldown": 5,
      "repeatable": true,
      "choices": [
        {
          "id": "call_home",
          "label": "Собраться",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": 4
            },
            {
              "type": "life",
              "key": "support",
              "delta": 6
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": -3
            }
          ],
          "tagChanges": null
        },
        {
          "id": "sit_with_it",
          "label": "Плыть по нему",
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
            },
            {
              "type": "life",
              "key": "support",
              "delta": -3
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "trainer_sees_stability",
      "title": "{trainer} видит, что ты собран",
      "text": "{trainer} замечает, что в быту ты стал ровнее, и это уже видно в лагере.",
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
        "minMorale": 60,
        "minDiscipline": 55
      },
      "weight": 6,
      "cooldown": 10,
      "repeatable": true,
      "choices": [
        {
          "id": "accept_praise",
          "label": "Держать линию",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": 3
            },
            {
              "type": "relation",
              "slot": "trainer",
              "affinity": 2,
              "respect": 4,
              "trust": 3,
              "tension": -1
            }
          ],
          "tagChanges": null
        },
        {
          "id": "ask_for_more",
          "label": "Расслабиться",
          "effects": [
            {
              "type": "resource",
              "key": "skillPoints",
              "delta": 4
            },
            {
              "type": "relation",
              "slot": "trainer",
              "affinity": 1,
              "respect": 5,
              "trust": 4,
              "tension": 0
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "trainer_calls_out_slip",
      "title": "{trainer} видит, что ты съезжаешь",
      "text": "{trainer} замечает, что режим трещит, и говорит это прямо.",
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
        "maxDiscipline": 40,
        "minStress": 40
      },
      "weight": 7,
      "cooldown": 7,
      "repeatable": true,
      "choices": [
        {
          "id": "take_note",
          "label": "Собраться",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": 2
            },
            {
              "type": "life",
              "key": "support",
              "delta": 2
            },
            {
              "type": "relation",
              "slot": "trainer",
              "affinity": 1,
              "respect": 3,
              "trust": 3,
              "tension": -2
            }
          ],
          "tagChanges": null
        },
        {
          "id": "snap_back",
          "label": "Огрызнуться",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": -3
            },
            {
              "type": "relation",
              "slot": "trainer",
              "affinity": -2,
              "respect": -3,
              "trust": -4,
              "tension": 5
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "friend_after_loss",
      "title": "{friend} приходит после поражения",
      "text": "{friend} не лезет с умными словами. Просто приходит быть рядом.",
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
        "lastActionType": "fight",
        "lastFightResult": "loss"
      },
      "weight": 9,
      "cooldown": 6,
      "repeatable": true,
      "choices": [
        {
          "id": "let_them_in",
          "label": "Пустить его",
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
            },
            {
              "type": "life",
              "key": "support",
              "delta": 6
            },
            {
              "type": "relation",
              "slot": "friend",
              "affinity": 5,
              "respect": 1,
              "trust": 5,
              "tension": -2
            }
          ],
          "tagChanges": null
        },
        {
          "id": "push_away",
          "label": "Остаться одному",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": -5
            },
            {
              "type": "life",
              "key": "support",
              "delta": -5
            },
            {
              "type": "relation",
              "slot": "friend",
              "affinity": -3,
              "respect": 0,
              "trust": -4,
              "tension": 2
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "team_after_hard_fight",
      "title": "Команда собирает тебя после боя",
      "text": "После тяжёлого боя свои пытаются вернуть тебе землю под ноги.",
      "conditions": {
        "requiresRolesAny": [
          "trainer",
          "sparring"
        ],
        "lastActionType": "fight",
        "minWear": 20
      },
      "weight": 7,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "lean_on_team",
          "label": "Принять это",
          "effects": [
            {
              "type": "resource",
              "key": "health",
              "delta": 5
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": -4
            },
            {
              "type": "life",
              "key": "support",
              "delta": 5
            }
          ],
          "tagChanges": null
        },
        {
          "id": "keep_mask",
          "label": "Отойти в сторону",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": -3
            },
            {
              "type": "life",
              "key": "support",
              "delta": -2
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "home_needs_repair",
      "title": "Дома снова что-то сломалось",
      "text": "Жильё просит денег и внимания ровно тогда, когда их не хочется тратить.",
      "conditions": {
        "housingAny": [
          "rough",
          "normal"
        ],
        "maxMoney": 90,
        "minWeek": 3
      },
      "weight": 6,
      "cooldown": 7,
      "repeatable": true,
      "choices": [
        {
          "id": "pay_for_fix",
          "label": "Починить",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": -22
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": -4
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
          "id": "delay_fix",
          "label": "Отложить",
          "effects": [
            {
              "type": "resource",
              "key": "stress",
              "delta": 4
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
      "id": "rival_smells_isolation",
      "title": "{rival} чувствует слабое место",
      "text": "{rival} замечает, что ты выпал из людей, и пробует давить в это место.",
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
        "maxSupport": 40,
        "minFame": 10
      },
      "weight": 6,
      "cooldown": 8,
      "repeatable": true,
      "choices": [
        {
          "id": "use_it_as_fuel",
          "label": "Собраться и закрыться",
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
            },
            {
              "type": "relation",
              "slot": "rival",
              "affinity": 0,
              "respect": 2,
              "trust": 0,
              "tension": 5
            }
          ],
          "tagChanges": null
        },
        {
          "id": "let_it_sink",
          "label": "Вестись",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": -4
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": 4
            },
            {
              "type": "life",
              "key": "support",
              "delta": -3
            }
          ],
          "tagChanges": null
        }
      ]
    },
    {
      "id": "doctor_sleep_warning",
      "title": "{doctor} говорит про сон",
      "text": "{doctor} прямо говорит, что без нормального сна всё остальное уже почти не важно.",
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
        "housingAny": [
          "rough",
          "normal"
        ],
        "minWear": 35
      },
      "weight": 7,
      "cooldown": 10,
      "repeatable": true,
      "choices": [
        {
          "id": "listen_to_doctor",
          "label": "Послушать",
          "effects": [
            {
              "type": "resource",
              "key": "money",
              "delta": -18
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
          "id": "brush_it_off",
          "label": "Отмахнуться",
          "effects": [
            {
              "type": "condition",
              "key": "wear",
              "delta": 3
            },
            {
              "type": "relation",
              "slot": "doctor",
              "affinity": -1,
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
      "id": "family_pride_message",
      "title": "Из дома пишут хорошие слова",
      "text": "Близкие напоминают, что гордятся тобой, даже когда сам в этом не уверен.",
      "conditions": {
        "minFame": 14,
        "maxSupport": 80
      },
      "weight": 5,
      "cooldown": 12,
      "repeatable": true,
      "choices": [
        {
          "id": "take_it_in",
          "label": "Принять это",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": 5
            },
            {
              "type": "life",
              "key": "support",
              "delta": 5
            }
          ],
          "tagChanges": null
        },
        {
          "id": "keep_moving",
          "label": "Оставить без ответа",
          "effects": [
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
      "id": "good_home_good_habits",
      "title": "Нормальный быт даёт режим",
      "text": "Когда дома спокойно, простые хорошие привычки держатся сами.",
      "conditions": {
        "housingAny": [
          "normal",
          "comfortable"
        ],
        "minDiscipline": 50
      },
      "weight": 5,
      "cooldown": 10,
      "repeatable": true,
      "choices": [
        {
          "id": "keep_routine",
          "label": "Держать это",
          "effects": [
            {
              "type": "condition",
              "key": "morale",
              "delta": 3
            },
            {
              "type": "resource",
              "key": "stress",
              "delta": -2
            },
            {
              "type": "resource",
              "key": "skillPoints",
              "delta": 3
            }
          ],
          "tagChanges": {
            "add": [
              "life_in_order"
            ]
          }
        },
        {
          "id": "ease_off",
          "label": "Расслабиться",
          "effects": [
            {
              "type": "resource",
              "key": "health",
              "delta": 4
            },
            {
              "type": "condition",
              "key": "fatigue",
              "delta": -3
            }
          ],
          "tagChanges": null
        }
      ]
    }
  ]
};

