var STREET_CAREER_DATA = {
  organizationTypes: [
    { id: "district_scene", label: "\u0420\u0430\u0439\u043e\u043d\u043d\u0430\u044f \u0441\u0446\u0435\u043d\u0430" },
    { id: "underground_venue", label: "\u041f\u043e\u0434\u043f\u043e\u043b\u044c\u043d\u0430\u044f \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430" },
    { id: "local_organizer", label: "\u041b\u043e\u043a\u0430\u043b\u044c\u043d\u044b\u0439 \u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0442\u043e\u0440" },
    { id: "street_stable", label: "\u0423\u043b\u0438\u0447\u043d\u0430\u044f \u043a\u043e\u043c\u0430\u043d\u0434\u0430" }
  ],
  ladderStages: [
    { id: "neighborhood_unknown", label: "\u041d\u0438\u043a\u0442\u043e \u0432 \u0440\u0430\u0439\u043e\u043d\u0435", minRating: 0, nextLabel: "\u0414\u043e \u0440\u0430\u0439\u043e\u043d\u043d\u043e\u0433\u043e \u043f\u0440\u0435\u0442\u0435\u043d\u0434\u0435\u043d\u0442\u0430" },
    { id: "district_contender", label: "\u041f\u0440\u0435\u0442\u0435\u043d\u0434\u0435\u043d\u0442 \u0440\u0430\u0439\u043e\u043d\u0430", minRating: 28, nextLabel: "\u0414\u043e \u0433\u043e\u0440\u043e\u0434\u0441\u043a\u043e\u0433\u043e \u0438\u043c\u0435\u043d\u0438" },
    { id: "city_underground_regular", label: "\u0417\u043d\u0430\u043a\u043e\u043c\u043e\u0435 \u0438\u043c\u044f \u0432 \u0433\u043e\u0440\u043e\u0434\u0435", minRating: 62, nextLabel: "\u0414\u043e \u0440\u0435\u0433\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u043e\u0433\u043e \u0438\u043c\u0435\u043d\u0438" },
    { id: "regional_underground_contender", label: "\u0420\u0435\u0433\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u044b\u0439 \u043f\u0440\u0435\u0442\u0435\u043d\u0434\u0435\u043d\u0442", minRating: 104, nextLabel: "\u0414\u043e \u043d\u0430\u0446\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u043e\u0439 \u0438\u043a\u043e\u043d\u044b" },
    { id: "national_underground_icon", label: "\u041d\u0430\u0446\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u0430\u044f \u0438\u043a\u043e\u043d\u0430 \u043f\u043e\u0434\u043f\u043e\u043b\u044c\u044f", minRating: 158, nextLabel: "\u0414\u043e \u0441\u0442\u0430\u0442\u0443\u0441\u0430 \u043b\u0435\u0433\u0435\u043d\u0434\u044b \u0443\u043b\u0438\u0446" },
    { id: "street_legend", label: "\u041b\u0435\u0433\u0435\u043d\u0434\u0430 \u0443\u043b\u0438\u0446", minRating: 225, nextLabel: "" }
  ],
  districtTemplates: [
    { id: "backstreets", label: "\u0417\u0430\u0434\u043d\u0438\u0435 \u0443\u043b\u0438\u0446\u044b", sceneLabel: "\u0414\u0432\u043e\u0440\u043e\u0432\u0430\u044f \u0441\u0446\u0435\u043d\u0430", venueLabel: "\u0414\u0432\u043e\u0440\u043e\u0432\u043e\u0439 \u043a\u0440\u0443\u0433", organizerLabel: "\u041e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0442\u043e\u0440 \u0441 \u0434\u0432\u043e\u0440\u043e\u0432" },
    { id: "warehouse", label: "\u041f\u0440\u043e\u043c\u0437\u043e\u043d\u0430", sceneLabel: "\u0421\u043a\u043b\u0430\u0434\u0441\u043a\u0430\u044f \u0441\u0446\u0435\u043d\u0430", venueLabel: "\u0421\u043a\u043b\u0430\u0434\u0441\u043a\u043e\u0439 \u0440\u0438\u043d\u0433", organizerLabel: "\u0421\u043a\u043b\u0430\u0434\u0441\u043a\u043e\u0439 \u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0442\u043e\u0440" },
    { id: "night_market", label: "\u041d\u043e\u0447\u043d\u043e\u0439 \u0440\u0430\u0439\u043e\u043d", sceneLabel: "\u041d\u043e\u0447\u043d\u0430\u044f \u0441\u0446\u0435\u043d\u0430", venueLabel: "\u041d\u043e\u0447\u043d\u043e\u0439 \u043a\u0440\u0443\u0433", organizerLabel: "\u041d\u043e\u0447\u043d\u043e\u0439 \u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0442\u043e\u0440" },
    { id: "dockline", label: "\u041f\u043e\u0440\u0442", sceneLabel: "\u041f\u043e\u0440\u0442\u043e\u0432\u0430\u044f \u0441\u0446\u0435\u043d\u0430", venueLabel: "\u041f\u043e\u0440\u0442\u043e\u0432\u044b\u0439 \u043a\u0440\u0443\u0433", organizerLabel: "\u041f\u043e\u0440\u0442\u043e\u0432\u044b\u0439 \u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0442\u043e\u0440" },
    { id: "old_town", label: "\u0421\u0442\u0430\u0440\u044b\u0439 \u043a\u0432\u0430\u0440\u0442\u0430\u043b", sceneLabel: "\u0421\u0442\u0430\u0440\u044b\u0439 \u043a\u0440\u0443\u0433", venueLabel: "\u041a\u0440\u0443\u0433 \u0441\u0442\u0430\u0440\u043e\u0433\u043e \u043a\u0432\u0430\u0440\u0442\u0430\u043b\u0430", organizerLabel: "\u041e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0442\u043e\u0440 \u0441\u0442\u0430\u0440\u043e\u0433\u043e \u043a\u0432\u0430\u0440\u0442\u0430\u043b\u0430" }
  ],
  offerTemplates: [
    { id: "street_corner_smoke", label: "\u0414\u0432\u043e\u0440\u043e\u0432\u044b\u0439 \u0431\u043e\u0439", trackId: "street", travel: "home", tier: "safe", purseBase: 36, winBonus: 10, koBonus: 8, fameBase: 5, toxicBase: 18, declineRep: -1, acceptRep: 2, streetRatingWin: 8, streetRatingLoss: -3, streetRatingDraw: 2, titleTier: "", rivalryBias: 10 },
    { id: "street_district_callout", label: "\u0420\u0430\u0439\u043e\u043d\u043d\u044b\u0439 \u0432\u044b\u0437\u043e\u0432", trackId: "street", travel: "home", tier: "even", purseBase: 52, winBonus: 14, koBonus: 12, fameBase: 7, toxicBase: 24, declineRep: -2, acceptRep: 3, streetRatingWin: 12, streetRatingLoss: -4, streetRatingDraw: 3, titleTier: "district", rivalryBias: 18 },
    { id: "street_city_heat", label: "\u0413\u043e\u0440\u043e\u0434\u0441\u043a\u043e\u0439 \u043f\u043e\u0434\u043f\u043e\u043b\u044c\u043d\u044b\u0439 \u0431\u043e\u0439", trackId: "street", travel: "away", tier: "even", purseBase: 72, winBonus: 18, koBonus: 16, fameBase: 10, toxicBase: 30, declineRep: -2, acceptRep: 4, streetRatingWin: 16, streetRatingLoss: -5, streetRatingDraw: 4, titleTier: "city", rivalryBias: 22 },
    { id: "street_regional_pull", label: "\u0420\u0435\u0433\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u0430\u044f \u043f\u043e\u0434\u043f\u043e\u043b\u044c\u043d\u0430\u044f \u0432\u0441\u0442\u0440\u0435\u0447\u0430", trackId: "street", travel: "away", tier: "danger", purseBase: 98, winBonus: 24, koBonus: 22, fameBase: 14, toxicBase: 38, declineRep: -3, acceptRep: 5, streetRatingWin: 22, streetRatingLoss: -6, streetRatingDraw: 5, titleTier: "regional", rivalryBias: 28 },
    { id: "street_title_main", label: "\u0411\u043e\u0439 \u0437\u0430 \u0441\u0442\u0430\u0442\u0443\u0441 \u0443\u043b\u0438\u0446", trackId: "street", travel: "away", tier: "danger", purseBase: 128, winBonus: 32, koBonus: 28, fameBase: 18, toxicBase: 44, declineRep: -4, acceptRep: 6, streetRatingWin: 28, streetRatingLoss: -8, streetRatingDraw: 6, titleTier: "national", rivalryBias: 34 },
    { id: "street_grudge_rematch", label: "\u0413\u0440\u044f\u0437\u043d\u044b\u0439 \u0440\u0435\u0432\u0430\u043d\u0448", trackId: "street", travel: "rematch", tier: "even", purseBase: 82, winBonus: 20, koBonus: 18, fameBase: 12, toxicBase: 42, declineRep: -4, acceptRep: 5, streetRatingWin: 18, streetRatingLoss: -5, streetRatingDraw: 4, titleTier: "", rivalryBias: 40 }
  ],
  reputationTags: [
    { id: "feared_on_the_block", label: "\u0421\u0442\u0440\u0430\u0445 \u0440\u0430\u0439\u043e\u043d\u0430", conditions: { minStreetRating: 55, minStreetWins: 4 } },
    { id: "dockyard_name", label: "\u0418\u043c\u044f \u0441 \u043f\u0440\u0438\u0447\u0430\u043b\u043e\u0432", conditions: { minStreetRating: 85, minStreetFights: 6 } },
    { id: "neighborhood_hero", label: "\u0413\u0435\u0440\u043e\u0439 \u0440\u0430\u0439\u043e\u043d\u0430", conditions: { minStreetRating: 45, minStreetWins: 3, minHomeWins: 2 } },
    { id: "underground_cash_fighter", label: "\u0414\u0435\u043d\u0435\u0436\u043d\u044b\u0439 \u0431\u043e\u0435\u0446 \u043f\u043e\u0434\u043f\u043e\u043b\u044c\u044f", conditions: { minStreetRating: 90, minMoney: 250 } },
    { id: "ex_national_team_who_fell_to_streets", label: "\u0411\u044b\u0432\u0448\u0438\u0439 \u0441\u0431\u043e\u0440\u043d\u0438\u043a, \u0443\u0448\u0435\u0434\u0448\u0438\u0439 \u043d\u0430 \u0443\u043b\u0438\u0446\u0443", conditions: { requireCurrentTrack: "street", requiresFlag: "former_national_team_member" } }
  ],
  mediaTemplates: [
    { id: "street_step_up", type: "event", requiresPayloadTag: "street_rank_up", tone: "warn", titles: ["{name} \u043f\u043e\u0434\u043d\u0438\u043c\u0430\u0435\u0442\u0441\u044f \u0432\u044b\u0448\u0435 \u0432 \u0443\u043b\u0438\u0447\u043d\u043e\u0439 \u0441\u0446\u0435\u043d\u0435.", "{event}: {name} \u0437\u0430\u0431\u0438\u0440\u0430\u0435\u0442\u0441\u044f \u043d\u0430 \u043d\u043e\u0432\u044b\u0439 \u0443\u0440\u043e\u0432\u0435\u043d\u044c \u0443\u043b\u0438\u0446."] },
    { id: "street_title_story", type: "event", requiresPayloadTag: "street_title", tone: "good", titles: ["{name} \u0431\u0435\u0440\u0451\u0442 \u043f\u043e\u0434\u043f\u043e\u043b\u044c\u043d\u044b\u0439 \u0441\u0442\u0430\u0442\u0443\u0441: {event}.", "{event}: \u0443 \u0443\u043b\u0438\u0446 \u0442\u0435\u043f\u0435\u0440\u044c \u043d\u043e\u0432\u044b\u0439 \u043e\u0440\u0438\u0435\u043d\u0442\u0438\u0440 - {name}."] },
    { id: "street_return_story", type: "event", requiresPayloadTag: "street_return", tone: "bad", titles: ["{name} \u0432\u043e\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044f \u043d\u0430 \u0443\u043b\u0438\u0446\u0443.", "{event}: {name} \u0441\u043d\u043e\u0432\u0430 \u0438\u0449\u0435\u0442 \u0441\u0432\u043e\u0451 \u043c\u0435\u0441\u0442\u043e \u0432 \u043f\u043e\u0434\u043f\u043e\u043b\u044c\u0435."] }
  ],
  transitionRules: {
    directProMinAge: 18,
    directProMinStreetRating: 105,
    directProMinFame: 18,
    amateurReturnMinStreetRating: 22,
    proFallbackMinLosses: 4,
    proFallbackMinWeeksWithoutContract: 6
  }
};
