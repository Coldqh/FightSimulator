var CAREER_ECOSYSTEM_DATA = {
  contractTemplates: [
    {
      id: "local_handshake",
      label: "Локальное соглашение",
      durationWeeks: 6,
      guaranteedPurse: 85,
      winBonus: 35,
      koBonus: 20,
      fameMultiplier: 1,
      fightFrequency: 1,
      toxicRisk: 8,
      conditionsText: "",
      reputationDelta: 1
    },
    {
      id: "road_grinder",
      label: "Гастрольный контракт",
      durationWeeks: 7,
      guaranteedPurse: 105,
      winBonus: 45,
      koBonus: 30,
      fameMultiplier: 1.1,
      fightFrequency: 2,
      toxicRisk: 16,
      conditionsText: "",
      reputationDelta: 2
    },
    {
      id: "spotlight_push",
      label: "Толчок в витрину",
      durationWeeks: 8,
      guaranteedPurse: 125,
      winBonus: 60,
      koBonus: 45,
      fameMultiplier: 1.25,
      fightFrequency: 2,
      toxicRisk: 28,
      conditionsText: "",
      reputationDelta: 4
    },
    {
      id: "shark_clause",
      label: "Акулий пункт",
      durationWeeks: 8,
      guaranteedPurse: 155,
      winBonus: 75,
      koBonus: 60,
      fameMultiplier: 1.15,
      fightFrequency: 3,
      toxicRisk: 46,
      conditionsText: "",
      reputationDelta: 3
    }
  ],
  fightOfferTemplates: [
    {
      id: "home_safe",
      label: "Домашний безопасный бой",
      travel: "home",
      tier: "safe",
      purseBase: 70,
      winBonus: 20,
      koBonus: 20,
      fameBase: 6,
      toxicBase: 6,
      declineRep: 0,
      acceptRep: 1
    },
    {
      id: "home_even",
      label: "Домашний равный бой",
      travel: "home",
      tier: "even",
      purseBase: 95,
      winBonus: 30,
      koBonus: 28,
      fameBase: 10,
      toxicBase: 10,
      declineRep: -1,
      acceptRep: 2
    },
    {
      id: "home_danger",
      label: "Домашний опасный бой",
      travel: "home",
      tier: "danger",
      purseBase: 120,
      winBonus: 40,
      koBonus: 36,
      fameBase: 15,
      toxicBase: 14,
      declineRep: -1,
      acceptRep: 3
    },
    {
      id: "away_safe",
      label: "Выездной осторожный бой",
      travel: "away",
      tier: "safe",
      purseBase: 85,
      winBonus: 25,
      koBonus: 25,
      fameBase: 9,
      toxicBase: 12,
      declineRep: -1,
      acceptRep: 2
    },
    {
      id: "away_even",
      label: "Выездной равный бой",
      travel: "away",
      tier: "even",
      purseBase: 110,
      winBonus: 35,
      koBonus: 32,
      fameBase: 14,
      toxicBase: 18,
      declineRep: -2,
      acceptRep: 3
    },
    {
      id: "away_danger",
      label: "Выездной рискованный бой",
      travel: "away",
      tier: "danger",
      purseBase: 145,
      winBonus: 45,
      koBonus: 45,
      fameBase: 19,
      toxicBase: 24,
      declineRep: -2,
      acceptRep: 4
    },
    {
      id: "rematch_offer",
      label: "Реванш",
      travel: "rematch",
      tier: "even",
      purseBase: 125,
      winBonus: 40,
      koBonus: 35,
      fameBase: 16,
      toxicBase: 16,
      declineRep: -3,
      acceptRep: 4
    }
  ]
};
