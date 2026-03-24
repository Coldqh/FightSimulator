var WORLD_CAREER_SIM_DATA = {
  goalProfiles: [
    {
      id: "youth_prospect",
      label: "Youth Prospect",
      trackBias: { amateur: 5, street: 1, pro: 0 },
      gymAmbition: 4,
      coachLoyalty: 3,
      developmentRate: 4,
      burnoutRisk: 1,
      proTransitionScore: 360,
      streetFallbackScore: 130,
      newgenWeight: 4
    },
    {
      id: "amateur_medal_hunter",
      label: "Amateur Medal Hunter",
      trackBias: { amateur: 5, street: 0, pro: 2 },
      gymAmbition: 5,
      coachLoyalty: 4,
      developmentRate: 3,
      burnoutRisk: 1,
      proTransitionScore: 380,
      streetFallbackScore: 150,
      newgenWeight: 3
    },
    {
      id: "national_team_climber",
      label: "National Team Climber",
      trackBias: { amateur: 5, street: 0, pro: 1 },
      gymAmbition: 5,
      coachLoyalty: 4,
      developmentRate: 3,
      burnoutRisk: 1,
      proTransitionScore: 420,
      streetFallbackScore: 165,
      newgenWeight: 2
    },
    {
      id: "reserve_team_boxer",
      label: "Reserve Team Boxer",
      trackBias: { amateur: 4, street: 1, pro: 1 },
      gymAmbition: 4,
      coachLoyalty: 4,
      developmentRate: 2,
      burnoutRisk: 2,
      proTransitionScore: 410,
      streetFallbackScore: 155,
      newgenWeight: 2
    },
    {
      id: "late_starter",
      label: "Late Starter",
      trackBias: { amateur: 3, street: 2, pro: 1 },
      gymAmbition: 2,
      coachLoyalty: 2,
      developmentRate: 2,
      burnoutRisk: 2,
      proTransitionScore: 400,
      streetFallbackScore: 135,
      newgenWeight: 1
    },
    {
      id: "street_talent",
      label: "Street Talent",
      trackBias: { amateur: 2, street: 5, pro: 1 },
      gymAmbition: 2,
      coachLoyalty: 1,
      developmentRate: 3,
      burnoutRisk: 2,
      proTransitionScore: 390,
      streetFallbackScore: 110,
      newgenWeight: 3
    },
    {
      id: "pro_chaser",
      label: "Pro Chaser",
      trackBias: { amateur: 3, street: 1, pro: 5 },
      gymAmbition: 5,
      coachLoyalty: 2,
      developmentRate: 3,
      burnoutRisk: 2,
      proTransitionScore: 335,
      streetFallbackScore: 150,
      newgenWeight: 2
    },
    {
      id: "burnout_case",
      label: "Burnout Case",
      trackBias: { amateur: 2, street: 4, pro: 0 },
      gymAmbition: 1,
      coachLoyalty: 1,
      developmentRate: 1,
      burnoutRisk: 5,
      proTransitionScore: 460,
      streetFallbackScore: 95,
      newgenWeight: 1
    }
  ],
  transitionRules: {
    juniorAdultAge: 18,
    proTransitionMinAge: 19,
    proPrimeAge: 22,
    streetFallbackMinAge: 17,
    nationalTeamHopefulMaxAge: 24,
    burnoutWearThreshold: 72,
    burnoutMoraleThreshold: 34,
    burnoutHealthThreshold: 56,
    newgenIntervalWeeks: 8,
    newgenCountriesPerTick: 2,
    maxCountryNewgensPerYear: 6,
    minimumAmateurDepthPerCountry: 10,
    minimumJuniorDepthPerCountry: 5,
    proTransitionMinRankId: "adult_class_1",
    proTransitionMinFame: 35,
    streetFallbackMaxRankId: "adult_class_2",
    trackMoveCooldownWeeks: 8,
    coachMoveCooldownWeeks: 6,
    gymMoveCooldownWeeks: 10,
    teamConflictChance: 10
  },
  worldHistoryHooks: [
    { id: "former_national_team_member", label: "Former national team member" },
    { id: "dropped_from_national_team", label: "Dropped from national team" },
    { id: "national_champion", label: "National champion" },
    { id: "olympic_hopeful", label: "Olympic hopeful" },
    { id: "failed_prospect", label: "Failed prospect" },
    { id: "left_amateur_path_for_streets", label: "Left amateur path for streets" }
  ],
  encounterTags: [
    { id: "shared_junior_path", label: "Shared junior path" },
    { id: "former_national_teammate", label: "Former national teammate" },
    { id: "took_team_spot_from_player", label: "Took player's team spot" },
    { id: "met_as_junior_then_pro", label: "Met as junior, later pro" },
    { id: "met_as_junior_then_street", label: "Met as junior, later street" }
  ]
};
