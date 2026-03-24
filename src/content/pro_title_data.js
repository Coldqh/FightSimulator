var PRO_TITLE_DATA = {
  organizations: [
    {
      id: "org_wbc",
      shortId: "wbc",
      name: "WBC",
      prestigeModifier: 1.14,
      rankingSize: 15,
      contenderCount: 10,
      titleFightRules: {
        minRankForRanking: 15,
        minRankForEliminator: 5,
        minRankForTitleShot: 2,
        defenseCadenceWeeks: 10,
        minimumWinsForTitleShot: 10
      }
    },
    {
      id: "org_wbo",
      shortId: "wbo",
      name: "WBO",
      prestigeModifier: 1.1,
      rankingSize: 15,
      contenderCount: 10,
      titleFightRules: {
        minRankForRanking: 15,
        minRankForEliminator: 5,
        minRankForTitleShot: 2,
        defenseCadenceWeeks: 9,
        minimumWinsForTitleShot: 9
      }
    },
    {
      id: "org_wba",
      shortId: "wba",
      name: "WBA",
      prestigeModifier: 1.12,
      rankingSize: 15,
      contenderCount: 10,
      titleFightRules: {
        minRankForRanking: 15,
        minRankForEliminator: 4,
        minRankForTitleShot: 2,
        defenseCadenceWeeks: 11,
        minimumWinsForTitleShot: 10
      }
    },
    {
      id: "org_ibf",
      shortId: "ibf",
      name: "IBF",
      prestigeModifier: 1.08,
      rankingSize: 15,
      contenderCount: 10,
      titleFightRules: {
        minRankForRanking: 15,
        minRankForEliminator: 4,
        minRankForTitleShot: 1,
        defenseCadenceWeeks: 8,
        minimumWinsForTitleShot: 9
      }
    }
  ],
  rankingRules: {
    rankingSize: 15,
    contenderCount: 10,
    weeklyNpcFightCount: 4,
    rankingWinBoost: 9,
    rankingLossPenalty: 7,
    rankingDrawBoost: 2,
    titleWinBoost: 18,
    titleLossPenalty: 10,
    titleDefenseBoost: 5,
    vacantAfterInactiveWeeks: 20,
    maxTitleHistory: 40,
    playerRankingBuffer: 3
  }
};
