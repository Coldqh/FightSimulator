var AMATEUR_ECOSYSTEM_DATA = {
  organizationTypes: [
    {
      id: "youth_boxing_school",
      label: "Юношеская школа",
      defaultAgeRange: { min: 14, max: 17 },
      defaultTrainingFocus: ["technique", "endurance"],
      reputation: 34
    },
    {
      id: "amateur_gym",
      label: "Любительская секция",
      defaultAgeRange: { min: 16, max: 28 },
      defaultTrainingFocus: ["technique", "sparring"],
      reputation: 46
    },
    {
      id: "regional_amateur_center",
      label: "Региональный центр",
      defaultAgeRange: { min: 16, max: 30 },
      defaultTrainingFocus: ["endurance", "defense", "technique"],
      reputation: 62
    },
    {
      id: "national_federation",
      label: "Федерация бокса",
      defaultAgeRange: { min: 16, max: 35 },
      defaultTrainingFocus: ["technique", "defense"],
      reputation: 78
    },
    {
      id: "national_team",
      label: "Национальная команда",
      defaultAgeRange: { min: 18, max: 32 },
      defaultTrainingFocus: ["sparring", "recovery", "defense"],
      reputation: 90
    },
    {
      id: "olympic_preparation_center",
      label: "Олимпийский центр",
      defaultAgeRange: { min: 18, max: 32 },
      defaultTrainingFocus: ["technique", "recovery", "endurance"],
      reputation: 96
    }
  ],
  trainerRoleTypes: [
    {
      id: "youth_trainer",
      label: "Юношеский тренер",
      minRankId: "",
      progressionBoost: "junior"
    },
    {
      id: "amateur_trainer",
      label: "Любительский тренер",
      minRankId: "junior_class_3",
      progressionBoost: "amateur"
    },
    {
      id: "elite_amateur_coach",
      label: "Старший любительский тренер",
      minRankId: "adult_class_3",
      progressionBoost: "regional"
    },
    {
      id: "national_team_coach",
      label: "Тренер сборной",
      minRankId: "candidate_national",
      progressionBoost: "national"
    },
    {
      id: "street_trainer",
      label: "Уличный тренер",
      minRankId: "",
      progressionBoost: "street"
    },
    {
      id: "pro_trainer",
      label: "Профессиональный тренер",
      minRankId: "candidate_national",
      progressionBoost: "pro"
    }
  ],
  organizationTemplates: [
    {
      id: "youth_school_local",
      orgType: "youth_boxing_school",
      labelTemplate: "{city} Юношеская школа",
      citySource: "gym_1",
      linkedGymSlot: 1,
      coachRoleIds: ["youth_trainer"],
      allowedAgeRange: { min: 14, max: 17 },
      rankRequirements: { minRankId: "" },
      resultRequirements: { minWins: 0, minTournamentPoints: 0 },
      trainingFocus: ["technique", "endurance"],
      reputation: 34
    },
    {
      id: "amateur_section_local",
      orgType: "amateur_gym",
      labelTemplate: "{city} Любительская секция",
      citySource: "gym_2",
      linkedGymSlot: 2,
      coachRoleIds: ["amateur_trainer"],
      allowedAgeRange: { min: 16, max: 28 },
      rankRequirements: { minRankId: "junior_class_3" },
      resultRequirements: { minWins: 1, minTournamentPoints: 12 },
      trainingFocus: ["technique", "sparring"],
      reputation: 44
    },
    {
      id: "amateur_club_main",
      orgType: "amateur_gym",
      labelTemplate: "{city} Сильная секция",
      citySource: "gym_3",
      linkedGymSlot: 3,
      coachRoleIds: ["amateur_trainer", "elite_amateur_coach"],
      allowedAgeRange: { min: 16, max: 30 },
      rankRequirements: { minRankId: "junior_class_2" },
      resultRequirements: { minWins: 3, minTournamentPoints: 36 },
      trainingFocus: ["technique", "defense", "sparring"],
      reputation: 52
    },
    {
      id: "regional_center_main",
      orgType: "regional_amateur_center",
      labelTemplate: "{city} Региональный центр",
      citySource: "gym_4",
      linkedGymSlot: 4,
      coachRoleIds: ["elite_amateur_coach"],
      allowedAgeRange: { min: 16, max: 30 },
      rankRequirements: { minRankId: "adult_class_3" },
      resultRequirements: { minWins: 6, minTournamentPoints: 90 },
      trainingFocus: ["endurance", "defense", "technique"],
      reputation: 66
    },
    {
      id: "national_federation_main",
      orgType: "national_federation",
      labelTemplate: "Федерация бокса {country}",
      citySource: "arena_1",
      linkedGymSlot: 5,
      coachRoleIds: ["elite_amateur_coach", "national_team_coach"],
      allowedAgeRange: { min: 16, max: 35 },
      rankRequirements: { minRankId: "adult_class_1" },
      resultRequirements: { minWins: 8, minTournamentPoints: 180 },
      trainingFocus: ["technique", "defense"],
      reputation: 82
    },
    {
      id: "national_team_main",
      orgType: "national_team",
      labelTemplate: "Сборная {country}",
      citySource: "gym_5",
      linkedGymSlot: 5,
      coachRoleIds: ["national_team_coach"],
      allowedAgeRange: { min: 18, max: 32 },
      rankRequirements: { minRankId: "candidate_national" },
      resultRequirements: { minWins: 10, minTournamentPoints: 220 },
      trainingFocus: ["sparring", "recovery", "defense"],
      reputation: 90
    },
    {
      id: "olympic_center_main",
      orgType: "olympic_preparation_center",
      labelTemplate: "{city} Центр сборной",
      citySource: "gym_5",
      linkedGymSlot: 5,
      coachRoleIds: ["national_team_coach"],
      allowedAgeRange: { min: 18, max: 32 },
      rankRequirements: { minRankId: "candidate_national" },
      resultRequirements: { minWins: 12, minTournamentPoints: 280 },
      trainingFocus: ["recovery", "sparring", "technique"],
      reputation: 94
    }
  ],
  teamTemplate: {
    idSuffix: "national_team_main",
    category: "amateur_national_team",
    rosterSlots: 3,
    reserveSlots: 2,
    candidateSlots: 4,
    selectionWindowWeeks: 12,
    selectionRules: {
      minAge: 18,
      maxAge: 32,
      minRankId: "adult_class_3",
      reserveMinRankId: "adult_class_2",
      activeMinRankId: "adult_class_1",
      minTournamentPoints: 72,
      minNationalRating: 110,
      maxWear: 72,
      maxStress: 82
    },
    olympicCycleStatus: "building"
  },
  nationalTeamStatuses: [
    { id: "none", label: "Вне списка" },
    { id: "candidate", label: "Кандидат" },
    { id: "reserve", label: "Резерв" },
    { id: "active", label: "Основной состав" },
    { id: "dropped", label: "Вылетел из состава" },
    { id: "alumni", label: "Бывший член сборной" }
  ],
  amateurGoals: [
    "взять следующий разряд",
    "зацепиться за региональный центр",
    "попасть в резерв сборной",
    "выйти в основной состав",
    "закрепиться в сильной группе",
    "подойти к национальному отбору"
  ]
};
