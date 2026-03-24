var RELATIONSHIP_ARC_DATA = {
  "templates": [
    {
      "id": "rival_after_decision",
      "label": "Шум после спорного боя",
      "weight": 4,
      "repeatable": false,
      "startConditions": {
        "lastActionType": "fight",
        "lastFightMethodContains": "Решение",
        "requiresRolesAll": [
          "rival"
        ],
        "minFame": 8
      },
      "actors": [
        {
          "slot": "rival",
          "role": "rival",
          "required": true,
          "sortBy": "tension",
          "sortDir": "desc"
        },
        {
          "slot": "journalist",
          "role": "journalist",
          "required": false
        }
      ],
      "stages": [
        {
          "id": "spark",
          "title": "{rival} не отпускает вердикт",
          "text": "После спорного боя {rival} начинает шуметь, будто решение украли у него из рук.",
          "choices": [
            {
              "id": "answer",
              "label": "Ответить жёстко",
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
                  "tension": 10,
                  "respect": 1
                },
                {
                  "type": "relation",
                  "slot": "journalist",
                  "respect": 1
                }
              ],
              "tagChanges": {
                "add": [
                  "public_spat"
                ],
                "npcFlags": [
                  {
                    "slot": "rival",
                    "add": [
                      "called_out_player"
                    ]
                  }
                ],
                "arcTags": {
                  "add": [
                    "heated",
                    "public"
                  ]
                }
              },
              "nextStageId": "media"
            },
            {
              "id": "cool",
              "label": "Держать холод",
              "effects": [
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": -2
                },
                {
                  "type": "relation",
                  "slot": "rival",
                  "respect": 2,
                  "tension": -2
                },
                {
                  "type": "relation",
                  "slot": "journalist",
                  "trust": -1
                }
              ],
              "tagChanges": {
                "add": [
                  "kept_calm_under_fire"
                ],
                "arcTags": {
                  "add": [
                    "cold"
                  ]
                }
              },
              "nextStageId": "media"
            }
          ]
        },
        {
          "id": "media",
          "trigger": {
            "minWeeksSinceLastStage": 1
          },
          "title": "Шум вокруг {rival} растёт",
          "text": "{journalist} быстро цепляется за конфликт и пытается сделать из него историю.",
          "choices": [
            {
              "id": "feed_fire",
              "label": "Дать резкую цитату",
              "effects": [
                {
                  "type": "resource",
                  "key": "fame",
                  "delta": 4
                },
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": 3
                },
                {
                  "type": "relation",
                  "slot": "journalist",
                  "affinity": 2,
                  "respect": 2
                },
                {
                  "type": "relation",
                  "slot": "rival",
                  "tension": 7
                }
              ],
              "tagChanges": {
                "add": [
                  "headline_war"
                ],
                "arcTags": {
                  "add": [
                    "headline"
                  ]
                }
              },
              "nextStageId": "showdown"
            },
            {
              "id": "decline",
              "label": "Не кормить прессу",
              "effects": [
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": -1
                },
                {
                  "type": "relation",
                  "slot": "journalist",
                  "respect": -1,
                  "tension": 1
                },
                {
                  "type": "relation",
                  "slot": "rival",
                  "respect": 1
                }
              ],
              "tagChanges": {
                "arcTags": {
                  "add": [
                    "private"
                  ]
                }
              },
              "nextStageId": "showdown"
            }
          ]
        },
        {
          "id": "showdown",
          "trigger": {
            "minWeeksSinceLastStage": 1
          },
          "title": "{rival} хочет точку",
          "text": "{rival} больше не хочет жить в недосказанности. Ему нужен или реванш, или конец истории.",
          "choices": [
            {
              "id": "take_rematch",
              "label": "Взять реванш как личное дело",
              "effects": [
                {
                  "type": "resource",
                  "key": "fame",
                  "delta": 2
                },
                {
                  "type": "relation",
                  "slot": "rival",
                  "respect": 3,
                  "tension": 6
                },
                {
                  "type": "rivalry",
                  "mode": "promote",
                  "deltaTension": 18,
                  "stakes": 10,
                  "pendingRematch": true
                }
              ],
              "tagChanges": {
                "add": [
                  "grudge_match"
                ],
                "arcTags": {
                  "add": [
                    "conflict",
                    "rematch_ready"
                  ]
                }
              },
              "outcome": "feud"
            },
            {
              "id": "walk_away",
              "label": "Закрыть тему",
              "effects": [
                {
                  "type": "resource",
                  "key": "morale",
                  "delta": 2
                },
                {
                  "type": "relation",
                  "slot": "rival",
                  "respect": 1,
                  "tension": -4
                }
              ],
              "tagChanges": {
                "add": [
                  "chose_career_over_drama"
                ],
                "arcTags": {
                  "add": [
                    "closed"
                  ]
                }
              },
              "outcome": "cooled"
            }
          ]
        }
      ]
    },
    {
      "id": "friend_turns_enemy",
      "label": "Друг отходит в сторону",
      "weight": 3,
      "repeatable": false,
      "startConditions": {
        "requiresRolesAll": [
          "friend"
        ],
        "relationAtLeast": [
          {
            "role": "friend",
            "tension": 52
          }
        ],
        "maxSupport": 72
      },
      "actors": [
        {
          "slot": "friend",
          "role": "friend",
          "required": true,
          "sortBy": "tension",
          "sortDir": "desc"
        }
      ],
      "stages": [
        {
          "id": "distance",
          "title": "{friend} уже не говорит как раньше",
          "text": "В словах {friend} стало меньше тепла и больше старых обид.",
          "choices": [
            {
              "id": "reach_out",
              "label": "Попробовать сгладить",
              "effects": [
                {
                  "type": "relation",
                  "slot": "friend",
                  "affinity": 5,
                  "trust": 4,
                  "tension": -5
                },
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": -2
                }
              ],
              "tagChanges": {
                "arcTags": {
                  "add": [
                    "repair_attempt"
                  ]
                }
              },
              "nextStageId": "split"
            },
            {
              "id": "snap_back",
              "label": "Огрызнуться",
              "effects": [
                {
                  "type": "relation",
                  "slot": "friend",
                  "affinity": -6,
                  "trust": -7,
                  "tension": 8
                },
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": 3
                }
              ],
              "tagChanges": {
                "add": [
                  "friend_fracture"
                ],
                "npcFlags": [
                  {
                    "slot": "friend",
                    "add": [
                      "resents_player"
                    ]
                  }
                ],
                "arcTags": {
                  "add": [
                    "hostile"
                  ]
                }
              },
              "nextStageId": "split"
            }
          ]
        },
        {
          "id": "split",
          "trigger": {
            "minWeeksSinceLastStage": 1
          },
          "title": "{friend} делает выбор",
          "text": "{friend} больше не хочет висеть посередине. Надо или чинить связь, или рвать её.",
          "choices": [
            {
              "id": "repair",
              "label": "Сесть и поговорить",
              "effects": [
                {
                  "type": "relation",
                  "slot": "friend",
                  "affinity": 8,
                  "trust": 6,
                  "tension": -8
                },
                {
                  "type": "life",
                  "key": "support",
                  "delta": 6
                }
              ],
              "tagChanges": {
                "remove": [
                  "friend_fracture"
                ],
                "npcFlags": [
                  {
                    "slot": "friend",
                    "remove": [
                      "resents_player"
                    ]
                  }
                ],
                "arcTags": {
                  "add": [
                    "repaired"
                  ]
                }
              },
              "outcome": "repaired"
            },
            {
              "id": "break",
              "label": "Рвать связь",
              "effects": [
                {
                  "type": "relation",
                  "slot": "friend",
                  "affinity": -10,
                  "trust": -10,
                  "tension": 12
                },
                {
                  "type": "life",
                  "key": "support",
                  "delta": -8
                },
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": 4
                }
              ],
              "tagChanges": {
                "add": [
                  "friend_lost"
                ],
                "npcFlags": [
                  {
                    "slot": "friend",
                    "add": [
                      "former_friend",
                      "turned_enemy"
                    ]
                  }
                ],
                "relationTags": [
                  {
                    "slot": "friend",
                    "add": [
                      "hostile",
                      "broken"
                    ]
                  }
                ],
                "arcTags": {
                  "add": [
                    "conflict"
                  ]
                }
              },
              "outcome": "broken"
            }
          ]
        }
      ]
    },
    {
      "id": "trainer_walks_out",
      "label": "Тренер смотрит в сторону",
      "weight": 3,
      "repeatable": false,
      "startConditions": {
        "requiresRolesAll": [
          "trainer"
        ],
        "relationAtLeast": [
          {
            "role": "trainer",
            "tension": 55
          }
        ],
        "minFame": 10
      },
      "actors": [
        {
          "slot": "trainer",
          "role": "trainer",
          "required": true,
          "sortBy": "tension",
          "sortDir": "desc"
        }
      ],
      "stages": [
        {
          "id": "strain",
          "title": "{trainer} устал тебя тащить",
          "text": "{trainer} всё чаще говорит так, будто сомневается не в неделе, а в твоём потолке.",
          "choices": [
            {
              "id": "double_down",
              "label": "Ужесточить режим",
              "effects": [
                {
                  "type": "condition",
                  "key": "morale",
                  "delta": -2
                },
                {
                  "type": "condition",
                  "key": "fatigue",
                  "delta": 2
                },
                {
                  "type": "relation",
                  "slot": "trainer",
                  "respect": 4,
                  "trust": 3,
                  "tension": -5
                }
              ],
              "tagChanges": {
                "add": [
                  "ate_hard_camp"
                ],
                "arcTags": {
                  "add": [
                    "saved"
                  ]
                }
              },
              "outcome": "stabilized"
            },
            {
              "id": "brush_off",
              "label": "Отмахнуться",
              "effects": [
                {
                  "type": "relation",
                  "slot": "trainer",
                  "trust": -8,
                  "tension": 8
                },
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": 2
                }
              ],
              "tagChanges": {
                "npcFlags": [
                  {
                    "slot": "trainer",
                    "add": [
                      "eyeing_other_corner"
                    ]
                  }
                ],
                "arcTags": {
                  "add": [
                    "unstable"
                  ]
                }
              },
              "nextStageId": "departure"
            }
          ]
        },
        {
          "id": "departure",
          "trigger": {
            "minWeeksSinceLastStage": 1
          },
          "title": "{trainer} готов уйти",
          "text": "{trainer} уже реально смотрит на другие варианты и не скрывает этого.",
          "choices": [
            {
              "id": "fight_for_him",
              "label": "Бороться за него",
              "effects": [
                {
                  "type": "resource",
                  "key": "money",
                  "delta": -25
                },
                {
                  "type": "relation",
                  "slot": "trainer",
                  "trust": 5,
                  "respect": 3,
                  "tension": -4
                }
              ],
              "tagChanges": {
                "add": [
                  "paid_to_keep_corner"
                ]
              },
              "outcome": "kept"
            },
            {
              "id": "let_go",
              "label": "Отпустить",
              "effects": [
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": 5
                },
                {
                  "type": "life",
                  "key": "support",
                  "delta": -4
                }
              ],
              "tagChanges": {
                "add": [
                  "trainer_left"
                ],
                "npcFlags": [
                  {
                    "slot": "trainer",
                    "add": [
                      "left_camp",
                      "working_elsewhere"
                    ]
                  }
                ],
                "relationTags": [
                  {
                    "slot": "trainer",
                    "add": [
                      "cold"
                    ]
                  }
                ],
                "arcTags": {
                  "add": [
                    "career_loss"
                  ]
                }
              },
              "outcome": "lost_trainer"
            }
          ]
        }
      ]
    },
    {
      "id": "journalist_feeds_fire",
      "label": "Журналист раздувает историю",
      "weight": 3,
      "repeatable": false,
      "startConditions": {
        "requiresRolesAll": [
          "journalist",
          "rival"
        ],
        "minFame": 14,
        "biographyFlagsAny": [
          "public_spat",
          "headline_war"
        ]
      },
      "actors": [
        {
          "slot": "journalist",
          "role": "journalist",
          "required": true
        },
        {
          "slot": "rival",
          "role": "rival",
          "required": true,
          "sortBy": "tension",
          "sortDir": "desc"
        }
      ],
      "stages": [
        {
          "id": "hook",
          "title": "{journalist} цепляется за конфликт",
          "text": "{journalist} чувствует кровь и начинает лепить из твоей истории громкий сюжет.",
          "choices": [
            {
              "id": "play_along",
              "label": "Подыграть",
              "effects": [
                {
                  "type": "resource",
                  "key": "fame",
                  "delta": 5
                },
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": 4
                },
                {
                  "type": "relation",
                  "slot": "journalist",
                  "respect": 2,
                  "trust": 1
                },
                {
                  "type": "relation",
                  "slot": "rival",
                  "tension": 7
                }
              ],
              "tagChanges": {
                "add": [
                  "media_feud"
                ],
                "arcTags": {
                  "add": [
                    "public",
                    "conflict"
                  ]
                }
              },
              "nextStageId": "fallout"
            },
            {
              "id": "deny",
              "label": "Отрицать",
              "effects": [
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": -1
                },
                {
                  "type": "relation",
                  "slot": "journalist",
                  "trust": -2,
                  "tension": 2
                }
              ],
              "tagChanges": {
                "arcTags": {
                  "add": [
                    "restrained"
                  ]
                }
              },
              "nextStageId": "fallout"
            }
          ]
        },
        {
          "id": "fallout",
          "trigger": {
            "minWeeksSinceLastStage": 1
          },
          "title": "История выходит из-под контроля",
          "text": "Теперь уже не важно, кто что хотел. Шум живёт своей жизнью.",
          "choices": [
            {
              "id": "embrace",
              "label": "Принять шум",
              "effects": [
                {
                  "type": "resource",
                  "key": "fame",
                  "delta": 3
                },
                {
                  "type": "relation",
                  "slot": "journalist",
                  "affinity": 2,
                  "respect": 1
                },
                {
                  "type": "relation",
                  "slot": "rival",
                  "tension": 4
                }
              ],
              "tagChanges": {
                "add": [
                  "learned_media_game"
                ]
              },
              "outcome": "weaponized"
            },
            {
              "id": "reset",
              "label": "Сбросить обороты",
              "effects": [
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": -3
                },
                {
                  "type": "relation",
                  "slot": "journalist",
                  "trust": -1
                },
                {
                  "type": "relation",
                  "slot": "rival",
                  "tension": -2,
                  "respect": 1
                }
              ],
              "tagChanges": {
                "add": [
                  "closed_media_loop"
                ]
              },
              "outcome": "cooled"
            }
          ]
        }
      ]
    },
    {
      "id": "promoter_false_promise",
      "label": "Промоутер обещал и подвёл",
      "weight": 3,
      "repeatable": false,
      "startConditions": {
        "requiresRolesAll": [
          "promoter"
        ],
        "minFame": 12,
        "maxMoney": 220,
        "recentActionAny": [
          "fight"
        ]
      },
      "actors": [
        {
          "slot": "promoter",
          "role": "promoter",
          "required": true,
          "sortBy": "trust",
          "sortDir": "asc"
        }
      ],
      "stages": [
        {
          "id": "promise",
          "title": "{promoter} сулит большой шанс",
          "text": "{promoter} красиво говорит про большой бой и быстрый рост.",
          "choices": [
            {
              "id": "trust",
              "label": "Поверить",
              "effects": [
                {
                  "type": "resource",
                  "key": "money",
                  "delta": -20
                },
                {
                  "type": "relation",
                  "slot": "promoter",
                  "trust": 3,
                  "respect": 1
                }
              ],
              "tagChanges": {
                "arcTags": {
                  "add": [
                    "invested"
                  ]
                }
              },
              "nextStageId": "drop"
            },
            {
              "id": "hedge",
              "label": "Держать ухо востро",
              "effects": [
                {
                  "type": "relation",
                  "slot": "promoter",
                  "trust": -1
                },
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": -1
                }
              ],
              "tagChanges": {
                "arcTags": {
                  "add": [
                    "skeptical"
                  ]
                }
              },
              "nextStageId": "drop"
            }
          ]
        },
        {
          "id": "drop",
          "trigger": {
            "minWeeksSinceLastStage": 1
          },
          "title": "{promoter} съезжает с темы",
          "text": "Когда приходит время отвечать, {promoter} уже говорит совсем иначе.",
          "choices": [
            {
              "id": "call_out",
              "label": "Вызывать его вслух",
              "effects": [
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": 2
                },
                {
                  "type": "relation",
                  "slot": "promoter",
                  "trust": -8,
                  "tension": 10
                },
                {
                  "type": "rivalry",
                  "mode": "sceneBuzz",
                  "deltaBuzz": 4
                }
              ],
              "tagChanges": {
                "add": [
                  "promoter_let_down"
                ],
                "npcFlags": [
                  {
                    "slot": "promoter",
                    "add": [
                      "let_down_player"
                    ]
                  }
                ],
                "arcTags": {
                  "add": [
                    "conflict"
                  ]
                }
              },
              "outcome": "burned"
            },
            {
              "id": "swallow",
              "label": "Проглотить",
              "effects": [
                {
                  "type": "resource",
                  "key": "morale",
                  "delta": -2
                },
                {
                  "type": "relation",
                  "slot": "promoter",
                  "trust": -4,
                  "respect": -1
                }
              ],
              "tagChanges": {
                "add": [
                  "bit_back_frustration"
                ]
              },
              "outcome": "swallowed"
            }
          ]
        }
      ]
    },
    {
      "id": "old_enemy_rematch",
      "label": "Старый враг зовёт на реванш",
      "weight": 5,
      "repeatable": true,
      "cooldown": 8,
      "startConditions": {
        "requiresRivalry": true,
        "minRivalryTension": 38,
        "minRivalryFights": 1
      },
      "actors": [
        {
          "slot": "enemy",
          "type": "rivalry",
          "required": true
        }
      ],
      "stages": [
        {
          "id": "offer",
          "title": "Старый враг снова рядом",
          "text": "Человек из прошлого опять выходит на связь и хочет закрыть старый счёт.",
          "choices": [
            {
              "id": "sign",
              "label": "Подписать реванш",
              "effects": [
                {
                  "type": "resource",
                  "key": "fame",
                  "delta": 3
                },
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": 2
                },
                {
                  "type": "rivalry",
                  "slot": "enemy",
                  "mode": "promote",
                  "deltaTension": 12,
                  "stakes": 14,
                  "pendingRematch": true
                }
              ],
              "tagChanges": {
                "add": [
                  "accepted_rematch_call"
                ],
                "arcTags": {
                  "add": [
                    "conflict",
                    "rematch_ready"
                  ]
                }
              },
              "outcome": "rematch_set"
            },
            {
              "id": "delay",
              "label": "Потянуть время",
              "effects": [
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": -1
                },
                {
                  "type": "rivalry",
                  "slot": "enemy",
                  "mode": "tension",
                  "deltaTension": 4,
                  "delayWeeks": 2
                }
              ],
              "tagChanges": {
                "arcTags": {
                  "add": [
                    "delayed"
                  ]
                }
              },
              "outcome": "delayed"
            }
          ]
        }
      ]
    },
    {
      "id": "friend_crisis_help",
      "label": "Друг вытаскивает в кризис",
      "weight": 4,
      "repeatable": true,
      "cooldown": 10,
      "startConditions": {
        "requiresRolesAll": [
          "friend"
        ],
        "relationAtLeast": [
          {
            "role": "friend",
            "affinity": 55,
            "trust": 55
          }
        ],
        "minStress": 42
      },
      "actors": [
        {
          "slot": "friend",
          "role": "friend",
          "required": true,
          "sortBy": "trust",
          "sortDir": "desc"
        }
      ],
      "stages": [
        {
          "id": "help",
          "title": "{friend} просто приходит",
          "text": "{friend} видит, что тебе тяжело, и без лишних слов хочет помочь.",
          "choices": [
            {
              "id": "accept",
              "label": "Принять помощь",
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
                  "type": "life",
                  "key": "support",
                  "delta": 8
                },
                {
                  "type": "relation",
                  "slot": "friend",
                  "affinity": 5,
                  "trust": 5,
                  "tension": -4
                }
              ],
              "tagChanges": {
                "add": [
                  "accepted_help"
                ],
                "npcFlags": [
                  {
                    "slot": "friend",
                    "add": [
                      "helped_player"
                    ]
                  }
                ]
              },
              "outcome": "supported"
            },
            {
              "id": "refuse",
              "label": "Отказаться",
              "effects": [
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": 3
                },
                {
                  "type": "condition",
                  "key": "morale",
                  "delta": -3
                },
                {
                  "type": "relation",
                  "slot": "friend",
                  "trust": -3,
                  "tension": 2
                }
              ],
              "tagChanges": {
                "add": [
                  "refused_help"
                ]
              },
              "outcome": "refused"
            }
          ]
        }
      ]
    },
    {
      "id": "team_after_loss",
      "label": "Команда после тяжёлой неудачи",
      "weight": 3,
      "repeatable": true,
      "cooldown": 12,
      "startConditions": {
        "lastFightResult": "loss",
        "requiresRolesAll": [
          "trainer",
          "sparring"
        ],
        "minSupport": 38
      },
      "actors": [
        {
          "slot": "trainer",
          "role": "trainer",
          "required": true
        },
        {
          "slot": "sparring",
          "role": "sparring",
          "required": true
        }
      ],
      "stages": [
        {
          "id": "circle",
          "title": "Свои собираются рядом",
          "text": "После неудачи команда пытается не дать тебе окончательно провалиться в себя.",
          "choices": [
            {
              "id": "listen",
              "label": "Слушать",
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
                  "slot": "trainer",
                  "trust": 3,
                  "respect": 2
                },
                {
                  "type": "relation",
                  "slot": "sparring",
                  "respect": 2,
                  "trust": 2
                }
              ],
              "tagChanges": {
                "add": [
                  "used_loss_well"
                ]
              },
              "outcome": "grew"
            },
            {
              "id": "shut_down",
              "label": "Закрыться",
              "effects": [
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": 2
                },
                {
                  "type": "condition",
                  "key": "morale",
                  "delta": -3
                },
                {
                  "type": "relation",
                  "slot": "trainer",
                  "trust": -3
                },
                {
                  "type": "relation",
                  "slot": "sparring",
                  "affinity": -2
                }
              ],
              "tagChanges": {
                "add": [
                  "sank_after_loss"
                ]
              },
              "outcome": "closed_up"
            }
          ]
        }
      ]
    },
    {
      "id": "doctor_vs_pride",
      "label": "Врач спорит с гордостью",
      "weight": 2,
      "repeatable": true,
      "cooldown": 10,
      "startConditions": {
        "requiresRolesAll": [
          "doctor"
        ],
        "maxHealth": 72,
        "minWear": 38
      },
      "actors": [
        {
          "slot": "doctor",
          "role": "doctor",
          "required": true
        }
      ],
      "stages": [
        {
          "id": "warning",
          "title": "{doctor} говорит прямо",
          "text": "{doctor} видит, что тело уже не тянет так, как раньше, и не хочет врать тебе.",
          "choices": [
            {
              "id": "rest",
              "label": "Сделать паузу",
              "effects": [
                {
                  "type": "resource",
                  "key": "health",
                  "delta": 8
                },
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": -3
                },
                {
                  "type": "condition",
                  "key": "wear",
                  "delta": -4
                },
                {
                  "type": "relation",
                  "slot": "doctor",
                  "trust": 4,
                  "respect": 2
                }
              ],
              "tagChanges": {
                "add": [
                  "respected_doctor_warning"
                ]
              },
              "outcome": "protected"
            },
            {
              "id": "push",
              "label": "Лезть дальше",
              "effects": [
                {
                  "type": "condition",
                  "key": "wear",
                  "delta": 4
                },
                {
                  "type": "condition",
                  "key": "morale",
                  "delta": -2
                },
                {
                  "type": "relation",
                  "slot": "doctor",
                  "trust": -4,
                  "tension": 2
                }
              ],
              "tagChanges": {
                "add": [
                  "ignored_doctor_warning"
                ]
              },
              "outcome": "ignored"
            }
          ]
        }
      ]
    },
    {
      "id": "promoter_vs_trainer",
      "label": "Промоутер и тренер тянут в разные стороны",
      "weight": 2,
      "repeatable": true,
      "cooldown": 14,
      "startConditions": {
        "requiresRolesAll": [
          "promoter",
          "trainer"
        ],
        "minFame": 18
      },
      "actors": [
        {
          "slot": "promoter",
          "role": "promoter",
          "required": true
        },
        {
          "slot": "trainer",
          "role": "trainer",
          "required": true
        }
      ],
      "stages": [
        {
          "id": "pull",
          "title": "Тебя начинают делить",
          "text": "{promoter} хочет быстрее и громче, а {trainer} говорит притормозить и делать правильно.",
          "choices": [
            {
              "id": "back_trainer",
              "label": "Встать за тренера",
              "effects": [
                {
                  "type": "relation",
                  "slot": "trainer",
                  "trust": 4,
                  "respect": 3
                },
                {
                  "type": "relation",
                  "slot": "promoter",
                  "trust": -3,
                  "tension": 4
                },
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": -2
                }
              ],
              "tagChanges": {
                "add": [
                  "corner_first"
                ]
              },
              "outcome": "trainer_side"
            },
            {
              "id": "back_promoter",
              "label": "Встать за промоутера",
              "effects": [
                {
                  "type": "relation",
                  "slot": "promoter",
                  "trust": 4,
                  "respect": 2
                },
                {
                  "type": "relation",
                  "slot": "trainer",
                  "trust": -4,
                  "tension": 4
                },
                {
                  "type": "resource",
                  "key": "fame",
                  "delta": 2
                }
              ],
              "tagChanges": {
                "add": [
                  "market_first"
                ]
              },
              "outcome": "promoter_side"
            }
          ]
        }
      ]
    },
    {
      "id": "rival_respect_crossroads",
      "label": "Соперник и уважение на развилке",
      "weight": 2,
      "repeatable": true,
      "cooldown": 16,
      "startConditions": {
        "requiresRolesAll": [
          "rival"
        ],
        "relationAtLeast": [
          {
            "role": "rival",
            "tension": 45,
            "respect": 50
          }
        ],
        "minFame": 18
      },
      "actors": [
        {
          "slot": "rival",
          "role": "rival",
          "required": true,
          "sortBy": "respect",
          "sortDir": "desc"
        }
      ],
      "stages": [
        {
          "id": "crossroads",
          "title": "{rival} меняет тон",
          "text": "В какой-то момент между вами появляется шанс не только на злость, но и на уважение.",
          "choices": [
            {
              "id": "respect",
              "label": "Принять уважение",
              "effects": [
                {
                  "type": "relation",
                  "slot": "rival",
                  "respect": 5,
                  "trust": 1,
                  "tension": -3
                },
                {
                  "type": "resource",
                  "key": "morale",
                  "delta": 2
                }
              ],
              "tagChanges": {
                "add": [
                  "earned_rival_respect"
                ]
              },
              "outcome": "respectful_rivalry"
            },
            {
              "id": "spit",
              "label": "Плюнуть на это",
              "effects": [
                {
                  "type": "relation",
                  "slot": "rival",
                  "tension": 6,
                  "trust": -2
                },
                {
                  "type": "resource",
                  "key": "stress",
                  "delta": 2
                }
              ],
              "tagChanges": {
                "add": [
                  "kept_feud_alive"
                ],
                "arcTags": {
                  "add": [
                    "conflict"
                  ]
                }
              },
              "outcome": "kept_hostile"
            }
          ]
        }
      ]
    }
  ]
};

