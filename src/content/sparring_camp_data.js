var SPARRING_CAMP_DATA = {
  offerSources: [
    {
      id: "gym_room",
      label: "Свой зал",
      allowedTracks: ["street", "amateur", "pro"],
      needsGym: true,
      baseCost: 0,
      costPerDifficulty: 0.15,
      difficultyBias: -4,
      riskBias: 4,
      scoutingBias: 4,
      maxOffers: 2
    },
    {
      id: "paid_guest",
      label: "Платный спарринг",
      allowedTracks: ["street", "amateur", "pro"],
      needsGym: false,
      minFame: 4,
      baseCost: 18,
      costPerDifficulty: 0.55,
      difficultyBias: 4,
      riskBias: 7,
      scoutingBias: 8,
      maxOffers: 3
    },
    {
      id: "national_pool",
      label: "Сборный спарринг",
      allowedTracks: ["amateur", "pro"],
      needsGym: false,
      requiredNationalTeamStatuses: ["candidate", "reserve", "active"],
      baseCost: 10,
      costPerDifficulty: 0.25,
      difficultyBias: 8,
      riskBias: 9,
      scoutingBias: 12,
      maxOffers: 2
    },
    {
      id: "closed_camp",
      label: "Закрытый лагерь",
      allowedTracks: ["street", "amateur", "pro"],
      needsGym: false,
      minFame: 18,
      minCampQuality: 45,
      baseCost: 40,
      costPerDifficulty: 0.8,
      difficultyBias: 12,
      riskBias: 12,
      scoutingBias: 16,
      maxOffers: 2
    }
  ],
  campTemplates: [
    {
      id: "short_tuneup",
      label: "Короткий лагерь",
      durationWeeks: 1,
      allowedTracks: ["street", "amateur", "pro"],
      baseCost: 20,
      inviteCount: 1,
      expectedEffects: {
        focusXp: 8,
        styleXp: 5,
        morale: 1,
        wear: 2,
        scouting: 8
      }
    },
    {
      id: "focused_block",
      label: "Точечный лагерь",
      durationWeeks: 2,
      allowedTracks: ["street", "amateur", "pro"],
      baseCost: 55,
      inviteCount: 2,
      expectedEffects: {
        focusXp: 18,
        styleXp: 10,
        morale: 0,
        wear: 5,
        scouting: 16
      }
    },
    {
      id: "national_block",
      label: "Сборный сбор",
      durationWeeks: 2,
      allowedTracks: ["amateur", "pro"],
      requiredNationalTeamStatuses: ["candidate", "reserve", "active"],
      baseCost: 35,
      inviteCount: 2,
      expectedEffects: {
        focusXp: 20,
        styleXp: 12,
        morale: 2,
        wear: 4,
        scouting: 18
      }
    },
    {
      id: "elite_camp",
      label: "Закрытый лагерь",
      durationWeeks: 3,
      allowedTracks: ["street", "amateur", "pro"],
      minFame: 20,
      minCampQuality: 50,
      baseCost: 90,
      inviteCount: 3,
      expectedEffects: {
        focusXp: 30,
        styleXp: 16,
        morale: 1,
        wear: 8,
        scouting: 26
      }
    }
  ],
  styleFocusHints: {
    outboxer: "technique",
    puncher: "power",
    counterpuncher: "defense",
    tempo: "endurance"
  },
  countryFocusHints: {
    mexico: "power",
    usa: "technique",
    russia: "endurance",
    cuba: "technique",
    japan: "defense",
    china: "endurance",
    uk: "technique",
    philippines: "power"
  },
  habitTextsByStyle: {
    outboxer: [
      "много работает первым джебом",
      "любит держать длинную дистанцию",
      "часто уходит после двойки"
    ],
    puncher: [
      "садится на силовую серию",
      "старается продавить у канатов",
      "охотно рискует ради тяжёлого попадания"
    ],
    counterpuncher: [
      "ждёт твой первый шаг",
      "любит отвечать сразу после промаха",
      "редко суетится без нужды"
    ],
    tempo: [
      "держит высокий ритм раунда",
      "много грузит корпус и плечи",
      "не любит, когда ему сбивают темп"
    ]
  }
};
