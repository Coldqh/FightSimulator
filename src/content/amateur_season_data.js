var AMATEUR_SEASON_DATA = {
  seasonTemplate: {
    id: "amateur_season_template_main",
    weeksPerSeason: 52,
    olympicCycleLengthYears: 4
  },
  tournamentTypes: [
    { id: "local_youth_tournament", label: "Локальный юниорский турнир", trackId: "amateur" },
    { id: "regional_amateur_tournament", label: "Региональный турнир", trackId: "amateur" },
    { id: "national_championship", label: "Чемпионат страны", trackId: "amateur" },
    { id: "national_team_trials", label: "Отбор в сборную", trackId: "amateur" },
    { id: "continental_championship", label: "Континентальный чемпионат", trackId: "amateur" },
    { id: "world_championship", label: "Чемпионат мира", trackId: "amateur" },
    { id: "olympics", label: "Олимпийский турнир", trackId: "amateur" }
  ],
  tournamentTemplates: [
    {
      id: "local_youth_open",
      tournamentTypeId: "local_youth_tournament",
      labelTemplate: "{country} юниорский кубок",
      circuitKey: "localCircuit",
      scope: "country",
      hostOrgTypes: ["youth_boxing_school", "amateur_gym"],
      registrationStartWeek: 2,
      registrationEndWeek: 4,
      startWeek: 5,
      roundsGapWeeks: 1,
      bracketSize: 8,
      minimumParticipants: 4,
      invitationOnly: false,
      eligibilityRules: {
        minAge: 16,
        maxAge: 17,
        minRankId: "junior_class_3",
        minTournamentPoints: 0,
        minNationalRankingTop: 0,
        requiredTeamStatus: "",
        previousResults: { minMedals: 0, minPlacements: 0 }
      },
      rewards: {
        basePurse: 18,
        winBonus: 8,
        koBonus: 6,
        fameReward: 3,
        roundWinPoints: 8,
        roundLossPoints: 3,
        roundDrawPoints: 5,
        championshipBonusPoints: 18,
        federationPoints: {
          champion: 28,
          finalist: 18,
          semifinalist: 10,
          participant: 4
        }
      },
      advancement: {
        nextTournamentTypeId: "regional_amateur_tournament",
        nextTournamentHint: "Хороший результат открывает дорогу в региональный турнир."
      },
      selectionImpactText: "Даёт первый серьёзный толчок в любительской карьере."
    },
    {
      id: "regional_amateur_cup",
      tournamentTypeId: "regional_amateur_tournament",
      labelTemplate: "{country} региональный турнир",
      circuitKey: "regionalCircuit",
      scope: "country",
      hostOrgTypes: ["regional_amateur_center"],
      registrationStartWeek: 10,
      registrationEndWeek: 12,
      startWeek: 13,
      roundsGapWeeks: 1,
      bracketSize: 8,
      minimumParticipants: 4,
      invitationOnly: false,
      eligibilityRules: {
        minAge: 16,
        maxAge: 28,
        minRankId: "junior_class_2",
        minTournamentPoints: 16,
        minNationalRankingTop: 0,
        requiredTeamStatus: "",
        previousResults: { minMedals: 0, minPlacements: 1 }
      },
      rewards: {
        basePurse: 28,
        winBonus: 10,
        koBonus: 8,
        fameReward: 5,
        roundWinPoints: 12,
        roundLossPoints: 4,
        roundDrawPoints: 6,
        championshipBonusPoints: 24,
        federationPoints: {
          champion: 42,
          finalist: 28,
          semifinalist: 16,
          participant: 6
        }
      },
      advancement: {
        nextTournamentTypeId: "national_championship",
        nextTournamentHint: "Медаль здесь сильно приближает к чемпионату страны."
      },
      selectionImpactText: "Финал региона заметно повышает шансы на сборную."
    },
    {
      id: "national_championship_main",
      tournamentTypeId: "national_championship",
      labelTemplate: "Чемпионат {country}",
      circuitKey: "nationalCircuit",
      scope: "country",
      hostOrgTypes: ["national_federation"],
      registrationStartWeek: 20,
      registrationEndWeek: 22,
      startWeek: 23,
      roundsGapWeeks: 1,
      bracketSize: 8,
      minimumParticipants: 4,
      invitationOnly: false,
      eligibilityRules: {
        minAge: 17,
        maxAge: 32,
        minRankId: "adult_class_2",
        minTournamentPoints: 54,
        minNationalRankingTop: 8,
        requiredTeamStatus: "",
        previousResults: { minMedals: 1, minPlacements: 2 }
      },
      rewards: {
        basePurse: 42,
        winBonus: 14,
        koBonus: 10,
        fameReward: 8,
        roundWinPoints: 16,
        roundLossPoints: 5,
        roundDrawPoints: 8,
        championshipBonusPoints: 34,
        federationPoints: {
          champion: 70,
          finalist: 42,
          semifinalist: 24,
          participant: 10
        }
      },
      advancement: {
        nextTournamentTypeId: "national_team_trials",
        nextTournamentHint: "Сильный национальный старт открывает отбор в сборную."
      },
      selectionImpactText: "Чемпионат страны — главный лифт к сборной и высокому рейтингу."
    },
    {
      id: "national_team_trials_main",
      tournamentTypeId: "national_team_trials",
      labelTemplate: "Отбор в сборную {country}",
      circuitKey: "nationalTeamTrials",
      scope: "country",
      hostOrgTypes: ["national_team", "national_federation"],
      registrationStartWeek: 30,
      registrationEndWeek: 31,
      startWeek: 32,
      roundsGapWeeks: 1,
      bracketSize: 8,
      minimumParticipants: 4,
      invitationOnly: true,
      eligibilityRules: {
        minAge: 18,
        maxAge: 32,
        minRankId: "adult_class_1",
        minTournamentPoints: 96,
        minNationalRankingTop: 6,
        requiredTeamStatus: "",
        previousResults: { minMedals: 1, minPlacements: 3 }
      },
      rewards: {
        basePurse: 52,
        winBonus: 18,
        koBonus: 12,
        fameReward: 10,
        roundWinPoints: 20,
        roundLossPoints: 6,
        roundDrawPoints: 9,
        championshipBonusPoints: 44,
        federationPoints: {
          champion: 96,
          finalist: 60,
          semifinalist: 32,
          participant: 12
        }
      },
      advancement: {
        nextTournamentTypeId: "continental_championship",
        nextTournamentHint: "Хороший отбор открывает дорогу в международный календарь."
      },
      selectionImpactText: "Здесь решается основной состав и резерв сборной."
    },
    {
      id: "continental_championship_main",
      tournamentTypeId: "continental_championship",
      labelTemplate: "Континентальный чемпионат",
      circuitKey: "continentalCircuit",
      scope: "global",
      hostOrgTypes: ["national_team", "olympic_preparation_center"],
      registrationStartWeek: 36,
      registrationEndWeek: 36,
      startWeek: 37,
      roundsGapWeeks: 1,
      bracketSize: 8,
      minimumParticipants: 4,
      invitationOnly: true,
      eligibilityRules: {
        minAge: 18,
        maxAge: 32,
        minRankId: "candidate_national",
        minTournamentPoints: 140,
        minNationalRankingTop: 3,
        requiredTeamStatus: "reserve",
        previousResults: { minMedals: 1, minPlacements: 3 }
      },
      rewards: {
        basePurse: 70,
        winBonus: 25,
        koBonus: 16,
        fameReward: 14,
        roundWinPoints: 26,
        roundLossPoints: 8,
        roundDrawPoints: 12,
        championshipBonusPoints: 58,
        federationPoints: {
          champion: 128,
          finalist: 84,
          semifinalist: 44,
          participant: 18
        }
      },
      advancement: {
        nextTournamentTypeId: "world_championship",
        nextTournamentHint: "Финал континента обычно выводит на уровень мира."
      },
      selectionImpactText: "Медаль континента почти гарантирует место в сборной."
    },
    {
      id: "world_championship_main",
      tournamentTypeId: "world_championship",
      labelTemplate: "Чемпионат мира",
      circuitKey: "worldChampionshipCycle",
      scope: "global",
      hostOrgTypes: ["national_team", "olympic_preparation_center"],
      registrationStartWeek: 42,
      registrationEndWeek: 42,
      startWeek: 43,
      roundsGapWeeks: 1,
      bracketSize: 8,
      minimumParticipants: 4,
      invitationOnly: true,
      eligibilityRules: {
        minAge: 18,
        maxAge: 34,
        minRankId: "national_master",
        minTournamentPoints: 190,
        minNationalRankingTop: 2,
        requiredTeamStatus: "active",
        previousResults: { minMedals: 2, minPlacements: 4 }
      },
      rewards: {
        basePurse: 90,
        winBonus: 30,
        koBonus: 18,
        fameReward: 18,
        roundWinPoints: 34,
        roundLossPoints: 10,
        roundDrawPoints: 14,
        championshipBonusPoints: 70,
        federationPoints: {
          champion: 164,
          finalist: 102,
          semifinalist: 52,
          participant: 22
        }
      },
      advancement: {
        nextTournamentTypeId: "olympics",
        nextTournamentHint: "Чемпионат мира — главный шаг к олимпийскому составу."
      },
      selectionImpactText: "Результат на мире сильно влияет на место в команде."
    },
    {
      id: "olympics_main",
      tournamentTypeId: "olympics",
      labelTemplate: "Олимпийский турнир",
      circuitKey: "olympicCycle",
      scope: "global",
      hostOrgTypes: ["olympic_preparation_center", "national_team"],
      registrationStartWeek: 48,
      registrationEndWeek: 48,
      startWeek: 49,
      roundsGapWeeks: 1,
      bracketSize: 8,
      minimumParticipants: 4,
      invitationOnly: true,
      olympicOnly: true,
      eligibilityRules: {
        minAge: 18,
        maxAge: 34,
        minRankId: "national_master",
        minTournamentPoints: 250,
        minNationalRankingTop: 1,
        requiredTeamStatus: "active",
        previousResults: { minMedals: 3, minPlacements: 5 }
      },
      rewards: {
        basePurse: 120,
        winBonus: 40,
        koBonus: 22,
        fameReward: 24,
        roundWinPoints: 40,
        roundLossPoints: 12,
        roundDrawPoints: 16,
        championshipBonusPoints: 92,
        federationPoints: {
          champion: 220,
          finalist: 132,
          semifinalist: 70,
          participant: 28
        }
      },
      advancement: {
        nextTournamentTypeId: "",
        nextTournamentHint: "Это вершина любительской лестницы."
      },
      selectionImpactText: "Олимпиада делает имя и закрепляет место в истории."
    }
  ]
};
