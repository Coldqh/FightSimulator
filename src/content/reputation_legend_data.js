var REPUTATION_LEGEND_DATA = {
  reputationTags: [
    {
      id: "fan_favorite",
      label: "Народный любимец",
      conditions: {
        minFame: 35,
        minSupport: 60,
        minWins: 4,
        maxScandals: 1
      }
    },
    {
      id: "dirty_fighter",
      label: "Грязный боец",
      conditions: {
        minScandals: 2
      }
    },
    {
      id: "giant_killer",
      label: "Убийца фаворитов",
      conditions: {
        minUpsetWins: 2
      }
    },
    {
      id: "home_hero",
      label: "Домашний герой",
      conditions: {
        minHomeWins: 4,
        minFame: 20
      }
    },
    {
      id: "wanderer",
      label: "Кочевник",
      conditions: {
        minCountriesVisited: 4
      }
    },
    {
      id: "fragile_talent",
      label: "Хрупкий талант",
      conditions: {
        minFame: 20,
        minChronicInjuries: 2
      }
    },
    {
      id: "ko_machine",
      label: "Машина KO",
      conditions: {
        minKos: 5,
        minWins: 6
      }
    },
    {
      id: "eternal_contender",
      label: "Вечный претендент",
      conditions: {
        minFights: 10,
        minFame: 25,
        maxWinsOverLosses: 3
      }
    }
  ],
  mediaTemplates: [
    {
      id: "amateur_medal_story",
      type: "event",
      requiresPayloadTag: "amateur_medal",
      tone: "good",
      titles: [
        "{name} берёт медаль: {event}.",
        "{event}: {name} доходит до пьедестала."
      ]
    },
    {
      id: "amateur_title_story",
      type: "event",
      requiresPayloadTag: "amateur_title",
      tone: "good",
      titles: [
        "{name} выигрывает турнир: {event}.",
        "{event}: {name} забирает золото."
      ]
    },
    {
      id: "national_team_callup_story",
      type: "event",
      requiresPayloadTag: "national_team_callup",
      tone: "good",
      titles: [
        "{name} получает вызов в сборную.",
        "{event}: {name} теперь в сборной."
      ]
    },
    {
      id: "national_team_drop_story",
      type: "event",
      requiresPayloadTag: "national_team_drop",
      tone: "bad",
      titles: [
        "{name} вылетает из сборной.",
        "{event}: место в сборной уходит мимо {name}."
      ]
    },
    {
      id: "national_team_return_story",
      type: "event",
      requiresPayloadTag: "national_team_return",
      tone: "warn",
      titles: [
        "{name} возвращается в сборную.",
        "{event}: {name} снова в списке команды."
      ]
    },
    {
      id: "continental_title_story",
      type: "event",
      requiresPayloadTag: "continental_title",
      tone: "good",
      titles: [
        "{name} берёт титул континента.",
        "{event}: {name} становится чемпионом континента."
      ]
    },
    {
      id: "world_title_story",
      type: "event",
      requiresPayloadTag: "world_title",
      tone: "good",
      titles: [
        "{name} выигрывает чемпионат мира.",
        "{event}: {name} становится чемпионом мира."
      ]
    },
    {
      id: "olympic_entry_story",
      type: "event",
      requiresPayloadTag: "olympic_entry",
      tone: "warn",
      titles: [
        "{name} едет на Олимпиаду.",
        "{event}: {name} выходит на олимпийский турнир."
      ]
    },
    {
      id: "olympic_medal_story",
      type: "event",
      requiresPayloadTag: "olympic_medal",
      tone: "good",
      titles: [
        "{name} берёт олимпийскую медаль.",
        "{event}: {name} забирает олимпийский пьедестал."
      ]
    },
    {
      id: "olympic_title_story",
      type: "event",
      requiresPayloadTag: "olympic_title",
      tone: "good",
      titles: [
        "{name} становится олимпийским чемпионом.",
        "{event}: {name} забирает олимпийское золото."
      ]
    },
    {
      id: "career_start",
      type: "career_start",
      tone: "warn",
      titles: [
        "{name} начинает путь в {country}.",
        "В {country} появляется новый боец: {name}."
      ]
    },
    {
      id: "travel_move",
      type: "travel",
      tone: "warn",
      titles: [
        "{name} едет в {country}.",
        "{name} меняет страну и летит в {country}."
      ]
    },
    {
      id: "fight_win",
      type: "fight_result",
      result: "win",
      tone: "good",
      titles: [
        "{name} выигрывает у {opponent}.",
        "{name} забирает бой у {opponent}."
      ]
    },
    {
      id: "fight_loss",
      type: "fight_result",
      result: "loss",
      tone: "bad",
      titles: [
        "{name} уступает {opponent}.",
        "{opponent} останавливает ход {name}."
      ]
    },
    {
      id: "fight_draw",
      type: "fight_result",
      result: "draw",
      tone: "warn",
      titles: [
        "Бой {name} и {opponent} уходит вничью.",
        "Судьи не смогли развести {name} и {opponent}."
      ]
    },
    {
      id: "fight_ko",
      type: "fight_result",
      result: "win",
      methodContains: "KO",
      tone: "good",
      titles: [
        "{name} жёстко останавливает {opponent}.",
        "{name} закрывает бой с {opponent} досрочно."
      ]
    },
    {
      id: "fight_upset",
      type: "fight_result",
      requiresPayloadTag: "upset",
      tone: "good",
      titles: [
        "{name} ломает расклад против {opponent}.",
        "{name} снимает ещё одного фаворита."
      ]
    },
    {
      id: "fight_rematch",
      type: "fight_result",
      requiresPayloadTag: "rematch",
      tone: "warn",
      titles: [
        "Реванш {name} и {opponent} снова шумит.",
        "{name} и {opponent} снова закрывают старый счёт."
      ]
    },
    {
      id: "fight_rival",
      type: "fight_result",
      requiresPayloadTag: "rival",
      tone: "warn",
      titles: [
        "{name} снова пересекается с {opponent}.",
        "Личная война {name} и {opponent} только крепнет."
      ]
    },
    {
      id: "injury_story",
      type: "injury",
      tone: "bad",
      titles: [
        "{name} уносит из боя травму: {injury}.",
        "{name} снова расплачивается телом: {injury}."
      ]
    },
    {
      id: "gym_story",
      type: "gym",
      tone: "good",
      titles: [
        "{name} входит в зал {gym}.",
        "{name} меняет базу и переходит в {gym}."
      ]
    },
    {
      id: "trainer_hired",
      type: "trainer",
      subtype: "hired",
      tone: "good",
      titles: [
        "{trainer} начинает работать с {name}.",
        "{name} собирает новый угол с {trainer}."
      ]
    },
    {
      id: "trainer_left",
      type: "trainer",
      subtype: "left",
      tone: "bad",
      titles: [
        "{name} остаётся без тренера.",
        "{trainer} уходит из лагеря {name}."
      ]
    },
    {
      id: "contract_signed",
      type: "contract",
      subtype: "signed",
      tone: "good",
      titles: [
        "{name} подписывает контракт: {contract}.",
        "У {name} появляется новая сделка: {contract}."
      ]
    },
    {
      id: "contract_broken",
      type: "contract",
      subtype: "broken",
      tone: "bad",
      titles: [
        "{name} рвёт контракт {contract}.",
        "Сделка {name} сгорает со скандалом."
      ]
    },
    {
      id: "scandal_story",
      type: "event",
      requiresPayloadTag: "scandal",
      tone: "bad",
      titles: [
        "Вокруг {name} снова шум: {event}.",
        "{name} влетает в новый скандал."
      ]
    },
    {
      id: "interview_story",
      type: "event",
      requiresPayloadTag: "interview",
      tone: "warn",
      titles: [
        "{name} попадает в разговоры прессы.",
        "Имя {name} снова мелькает в интервью."
      ]
    },
    {
      id: "ending_retired",
      type: "ending",
      endingReason: "retired",
      tone: "good",
      titles: [
        "{name} сам ставит точку в карьере.",
        "{name} уходит по своей воле."
      ]
    },
    {
      id: "ending_body",
      type: "ending",
      endingReason: "body",
      tone: "bad",
      titles: [
        "Тело останавливает путь {name}.",
        "Карьера {name} ломается об износ."
      ]
    },
    {
      id: "ending_stress",
      type: "ending",
      endingReason: "stress",
      tone: "bad",
      titles: [
        "Голова не выдерживает путь {name}.",
        "Психика ставит точку в истории {name}."
      ]
    },
    {
      id: "ending_debt",
      type: "ending",
      endingReason: "debt",
      tone: "bad",
      titles: [
        "Долги глушат карьеру {name}.",
        "{name} вылетает из игры из-за денег."
      ]
    }
  ],
  endingArchetypes: [
    {
      id: "olympic_hero",
      label: "Олимпийский герой",
      conditions: {
        minOlympicTitles: 1
      },
      summary: "Его путь навсегда связали с олимпийским золотом."
    },
    {
      id: "team_to_world_champion",
      label: "Бывший сборник, ставший чемпионом мира",
      conditions: {
        minNationalTeamSelections: 1,
        minProTitles: 1
      },
      summary: "Он прошёл через сборную и довёл этот путь до мирового пояса."
    },
    {
      id: "national_team_captain",
      label: "Капитан национальной команды",
      conditions: {
        minNationalTeamSelections: 4,
        minAmateurNationalTitles: 1
      },
      summary: "На долгом отрезке он стал лицом сборной и опорой команды."
    },
    {
      id: "failed_team_talent",
      label: "Несбывшийся талант сборной",
      conditions: {
        minNationalTeamSelections: 1,
        maxFame: 45,
        endingReasonIn: ["body", "stress"]
      },
      summary: "Система видела в нём большое будущее, но дорога оборвалась раньше времени."
    },
    {
      id: "lost_after_team_drop",
      label: "Потерянный талант после вылета из сборной",
      conditions: {
        requiresNationalTeamStatus: "dropped",
        endingReasonIn: ["body", "stress", "debt"]
      },
      summary: "После вылета из сборной карьера так и не вернулась на прежний ход."
    },
    {
      id: "street_local_legend",
      label: "Местная легенда улиц",
      conditions: {
        requireCurrentTrack: "street",
        minStreetRating: 110,
        minStreetWins: 6
      },
      summary: "Для своей сцены он так и остался человеком, которого будут вспоминать ещё долго."
    },
    {
      id: "street_outsider",
      label: "Уличный боец вне системы",
      conditions: {
        requireCurrentTrack: "street",
        minStreetWins: 4,
        maxFame: 35
      },
      summary: "Он так и не вошёл в большую систему, но прожил свою честную уличную историю."
    },
    {
      id: "dockyard_champion",
      label: "Чемпион, поднятый с доков",
      conditions: {
        minProTitles: 1,
        minStreetWins: 3
      },
      summary: "Он дошёл до пояса из самой жёсткой среды и этим запомнился всем."
    },
    {
      id: "champion",
      label: "Чемпион",
      conditions: {
        minFame: 90,
        minWins: 12,
        maxLosses: 4
      },
      summary: "К концу пути его уже воспринимали как главную фигуру сцены."
    },
    {
      id: "cult_veteran",
      label: "Культовый ветеран",
      conditions: {
        minFights: 14,
        minFame: 40
      },
      summary: "Про него говорили не из-за одного вечера, а из-за длинной дороги."
    },
    {
      id: "broken_talent",
      label: "Сломанный талант",
      conditions: {
        minFame: 20,
        minChronicInjuries: 2,
        endingReasonIn: ["body", "stress"]
      },
      summary: "Талант был виден всем, но дорога оказалась жёстче, чем казалось в начале."
    },
    {
      id: "forgotten_wanderer",
      label: "Забытый бродяга ринга",
      conditions: {
        minCountriesVisited: 4,
        maxFame: 30
      },
      summary: "Он много ездил и много видел, но имя так и не стало большим."
    },
    {
      id: "local_legend",
      label: "Локальная легенда",
      conditions: {
        minHomeWins: 5,
        minFame: 25
      },
      summary: "Для своего района он остался человеком, которого будут вспоминать ещё долго."
    },
    {
      id: "scandal_star",
      label: "Скандальная звезда",
      conditions: {
        minScandals: 2,
        minFame: 30
      },
      summary: "Его обсуждали не меньше, чем его бои."
    },
    {
      id: "great_comeback",
      label: "Великий камбэк",
      conditions: {
        minComebackWins: 2,
        minWins: 6
      },
      summary: "Он не раз падал, но каждый раз находил путь обратно."
    },
    {
      id: "street_fighter",
      label: "Боец улиц",
      conditions: {},
      summary: "Он прошёл свой путь как мог и оставил после себя живую историю."
    }
  ]
};
