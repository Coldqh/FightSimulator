var RANKING_PROFILE_DATA = {
  rosterTargets: {
    streetPerCountry: 50,
    amateurPerCountry: 1000,
    proGlobal: 100
  },
  pageSize: 20,
  streetRanking: {
    titleWeight: 18,
    fameWeight: 2,
    standingWeight: 6,
    wearPenalty: 1
  },
  amateurRanking: {
    amateurWinWeight: 5,
    amateurLossPenalty: 3,
    techniqueWeight: 2,
    teamStatusWeights: {
      "none": 0,
      "candidate": 18,
      "reserve": 28,
      "active": 40,
      "dropped": 8,
      "alumni": 16
    },
    medalWeights: {
      gold: 34,
      silver: 20,
      bronze: 12
    }
  },
  proRanking: {
    ringRankingSize: 24,
    championBonus: 55,
    titleHistoryWeight: 12,
    rankingSeedWeight: 4,
    winWeight: 4,
    lossPenalty: 3,
    koWeight: 2,
    fameWeight: 1
  },
  profile: {
    achievementLimit: 6,
    recentResultLimit: 6,
    trainerRosterPreview: 18
  }
};
