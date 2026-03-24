var ENCOUNTER_MEMORY_DATA = {
  crossoverTags: [
    {
      id: "old_street_rival_returned",
      label: "Старый уличный соперник",
      offerWeight: 18,
      introText: "Когда-то вы уже дрались на улице. Теперь история зашла дальше.",
      shortText: "Старая уличная история снова рядом.",
      mediaTags: ["cross_track_memory", "street_past"]
    },
    {
      id: "former_teammate",
      label: "Бывший сокомандник",
      offerWeight: 12,
      introText: "Когда-то вы были по одну сторону. Теперь напротив друг друга.",
      shortText: "Вы когда-то были в одной команде.",
      mediaTags: ["cross_track_memory", "team_history"]
    },
    {
      id: "teammate_became_rival",
      label: "Сокомандник стал врагом",
      offerWeight: 20,
      introText: "Общая команда осталась в прошлом. Теперь это уже личное.",
      shortText: "Общее прошлое переросло в вражду.",
      mediaTags: ["cross_track_memory", "rivalry", "team_conflict"]
    },
    {
      id: "lost_team_spot_to_this_boxer",
      label: "Забрал место в составе",
      offerWeight: 16,
      introText: "Этот боксёр когда-то оказался в составе там, где ты ждал свой шанс.",
      shortText: "Когда-то он обошёл тебя в борьбе за место.",
      mediaTags: ["cross_track_memory", "selection_loss"]
    },
    {
      id: "olympic_cycle_rival",
      label: "Соперник по олимпийскому циклу",
      offerWeight: 17,
      introText: "Вы давно ходите рядом по большим любительским стартам.",
      shortText: "Вы давно пересекаетесь на больших стартах.",
      mediaTags: ["cross_track_memory", "amateur_elite"]
    },
    {
      id: "pro_rankings_reunion",
      label: "Новая встреча в профи",
      offerWeight: 15,
      introText: "Дороги уже расходились, но теперь вы снова встретились в профи.",
      shortText: "Старое знакомство снова всплыло в профи.",
      mediaTags: ["cross_track_memory", "pro_reunion"]
    },
    {
      id: "fallen_pro_on_streets",
      label: "Упавший профи на улице",
      offerWeight: 19,
      introText: "Он уже был выше, но снова оказался на улице.",
      shortText: "Бывший профи снова оказался на улице.",
      mediaTags: ["cross_track_memory", "street_return"]
    },
    {
      id: "old_sparring_partner_now_enemy",
      label: "Бывший спарринг стал врагом",
      offerWeight: 14,
      introText: "Когда-то вы помогали друг другу готовиться. Теперь уже нет.",
      shortText: "Старый спарринг-партнёр теперь по другую сторону.",
      mediaTags: ["cross_track_memory", "sparring_history"]
    }
  ],
  events: [
    {
      id: "encounter_old_street_rival_returned",
      title: "Старая уличная история снова всплыла",
      text: "Люди снова вспоминают старую уличную драку. Им интересно, чем всё закончится теперь.",
      conditions: {
        encounterTagsAny: ["old_street_rival_returned"],
        minKnownOpponentOffers: 1
      },
      weight: 8,
      cooldown: 10,
      choices: [
        {
          id: "play_cool",
          label: "Держать лицо",
          effects: [
            { type: "resource", key: "fame", delta: 2 },
            { type: "resource", key: "stress", delta: -1 }
          ],
          tagChanges: { add: ["street_past_public"] }
        },
        {
          id: "heat_it_up",
          label: "Подлить масла",
          effects: [
            { type: "resource", key: "fame", delta: 4 },
            { type: "resource", key: "stress", delta: 2 }
          ],
          tagChanges: { add: ["public_spat"] }
        }
      ]
    },
    {
      id: "encounter_former_teammate",
      title: "Лица из одной команды",
      text: "Перед следующим боем всплыло имя человека, с которым ты когда-то был в одной команде.",
      conditions: {
        encounterTagsAny: ["former_teammate"],
        minKnownOpponentOffers: 1
      },
      weight: 6,
      cooldown: 8,
      choices: [
        {
          id: "stay_respectful",
          label: "Без лишнего",
          effects: [
            { type: "resource", key: "stress", delta: -1 },
            { type: "resource", key: "fame", delta: 1 }
          ]
        },
        {
          id: "make_it_personal",
          label: "Сделать личным",
          effects: [
            { type: "resource", key: "fame", delta: 2 },
            { type: "resource", key: "stress", delta: 2 }
          ],
          tagChanges: { add: ["team_story_public"] }
        }
      ]
    },
    {
      id: "encounter_teammate_became_rival",
      title: "Прошлое внутри команды не отпустило",
      text: "Общее прошлое больше не смягчает встречу. Теперь это уже старая обида.",
      conditions: {
        encounterTagsAny: ["teammate_became_rival"]
      },
      weight: 7,
      cooldown: 12,
      choices: [
        {
          id: "keep_distance",
          label: "Держать дистанцию",
          effects: [
            { type: "resource", key: "stress", delta: 1 }
          ]
        },
        {
          id: "say_enough",
          label: "Сказать прямо",
          effects: [
            { type: "resource", key: "fame", delta: 3 },
            { type: "resource", key: "stress", delta: 3 }
          ],
          tagChanges: { add: ["team_conflict_public"] }
        }
      ]
    },
    {
      id: "encounter_lost_team_spot",
      title: "Старый укол снова рядом",
      text: "Имя этого бойца снова рядом с твоим, и старое чувство никуда не делось.",
      conditions: {
        encounterTagsAny: ["lost_team_spot_to_this_boxer"]
      },
      weight: 6,
      cooldown: 12,
      choices: [
        {
          id: "use_it",
          label: "Сделать топливом",
          effects: [
            { type: "resource", key: "stress", delta: 1 },
            { type: "resource", key: "fame", delta: 1 }
          ]
        },
        {
          id: "let_it_go",
          label: "Отпустить",
          effects: [
            { type: "resource", key: "stress", delta: -2 }
          ]
        }
      ]
    },
    {
      id: "encounter_olympic_cycle_rival",
      title: "Старый знакомый по большим стартам",
      text: "Вы слишком давно идёте рядом, чтобы это было просто ещё одно имя в сетке.",
      conditions: {
        encounterTagsAny: ["olympic_cycle_rival"],
        minKnownOpponentOffers: 1
      },
      weight: 5,
      cooldown: 14,
      choices: [
        {
          id: "treat_as_business",
          label: "Смотреть спокойно",
          effects: [
            { type: "resource", key: "stress", delta: -1 },
            { type: "resource", key: "fame", delta: 1 }
          ]
        },
        {
          id: "raise_the_stakes",
          label: "Поднять ставки",
          effects: [
            { type: "resource", key: "fame", delta: 3 },
            { type: "resource", key: "stress", delta: 2 }
          ],
          tagChanges: { add: ["big_stage_tension"] }
        }
      ]
    },
    {
      id: "encounter_pro_rankings_reunion",
      title: "Старое знакомство вернулось в рейтингах",
      text: "В профи память длинная. Иногда старое имя возвращается именно тогда, когда ставки уже выросли.",
      conditions: {
        encounterTagsAny: ["pro_rankings_reunion"],
        minKnownOpponentOffers: 1
      },
      weight: 5,
      cooldown: 10,
      choices: [
        {
          id: "stay_quiet",
          label: "Без шума",
          effects: [
            { type: "resource", key: "stress", delta: -1 }
          ]
        },
        {
          id: "sell_the_story",
          label: "Продать историю",
          effects: [
            { type: "resource", key: "fame", delta: 4 },
            { type: "resource", key: "stress", delta: 1 }
          ],
          tagChanges: { add: ["media_reunion"] }
        }
      ]
    },
    {
      id: "encounter_fallen_pro_on_streets",
      title: "Большое имя снова на улице",
      text: "Бывает и так: вчера человек шёл по другой лестнице, а сегодня снова здесь.",
      conditions: {
        encounterTagsAny: ["fallen_pro_on_streets"],
        minKnownOpponentOffers: 1
      },
      weight: 6,
      cooldown: 10,
      choices: [
        {
          id: "take_it_serious",
          label: "Отнестись серьёзно",
          effects: [
            { type: "resource", key: "stress", delta: 1 },
            { type: "resource", key: "fame", delta: 1 }
          ]
        },
        {
          id: "call_it_out",
          label: "Сказать вслух",
          effects: [
            { type: "resource", key: "fame", delta: 3 },
            { type: "resource", key: "stress", delta: 2 }
          ],
          tagChanges: { add: ["street_story_public"] }
        }
      ]
    },
    {
      id: "encounter_old_sparring_partner",
      title: "Знакомый счёт из спаррингов",
      text: "Ты слишком хорошо помнишь, как двигался этот человек на тренировках. Это уже не просто новый соперник.",
      conditions: {
        encounterTagsAny: ["old_sparring_partner_now_enemy"],
        minKnownOpponentOffers: 1
      },
      weight: 7,
      cooldown: 10,
      choices: [
        {
          id: "keep_it_sport",
          label: "Оставить в спорте",
          effects: [
            { type: "resource", key: "stress", delta: -1 }
          ]
        },
        {
          id: "turn_the_screw",
          label: "Подкрутить давление",
          effects: [
            { type: "resource", key: "fame", delta: 2 },
            { type: "resource", key: "stress", delta: 2 }
          ],
          tagChanges: { add: ["sparring_story_public"] }
        }
      ]
    }
  ]
};
