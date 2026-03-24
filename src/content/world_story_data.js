var WORLD_STORY_DATA = {
  worldMediaTemplates: [
    {
      id: "team_callup",
      type: "team_status",
      status: "active",
      tone: "good",
      titles: [
        "{fighter} попадает в основной состав сборной {country}.",
        "{country}: {fighter} вызывают в сборную."
      ]
    },
    {
      id: "team_reserve",
      type: "team_status",
      status: "reserve",
      tone: "warn",
      titles: [
        "{fighter} входит в резерв сборной {country}.",
        "{country}: {fighter} получает место в резерве."
      ]
    },
    {
      id: "team_drop",
      type: "team_status",
      status: "dropped",
      tone: "bad",
      titles: [
        "{fighter} вылетает из состава сборной {country}.",
        "{country}: {fighter} теряет место в сборной."
      ]
    },
    {
      id: "national_champion",
      type: "tournament_result",
      tournamentTypeId: "national_championship",
      placement: "champion",
      tone: "good",
      titles: [
        "{fighter} становится чемпионом страны.",
        "{tournament}: {fighter} берёт золото."
      ]
    },
    {
      id: "continental_champion",
      type: "tournament_result",
      tournamentTypeId: "continental_championship",
      placement: "champion",
      tone: "good",
      titles: [
        "{fighter} становится чемпионом континента.",
        "{tournament}: {fighter} выходит на вершину континента."
      ]
    },
    {
      id: "world_champion",
      type: "tournament_result",
      tournamentTypeId: "world_championship",
      placement: "champion",
      tone: "good",
      titles: [
        "{fighter} выигрывает чемпионат мира.",
        "{tournament}: {fighter} берёт золото мира."
      ]
    },
    {
      id: "olympic_participant",
      type: "tournament_result",
      tournamentTypeId: "olympics",
      placement: "participant",
      tone: "warn",
      titles: [
        "{fighter} едет на Олимпиаду.",
        "{country}: {fighter} выходит на олимпийский турнир."
      ]
    },
    {
      id: "olympic_medalist",
      type: "tournament_result",
      tournamentTypeId: "olympics",
      placement: "medalist",
      tone: "good",
      titles: [
        "{fighter} берёт олимпийскую медаль.",
        "{tournament}: {fighter} уходит с олимпийской медалью."
      ]
    },
    {
      id: "olympic_champion",
      type: "tournament_result",
      tournamentTypeId: "olympics",
      placement: "champion",
      tone: "good",
      titles: [
        "{fighter} становится олимпийским чемпионом.",
        "{tournament}: {fighter} берёт олимпийское золото."
      ]
    },
    {
      id: "team_to_pro",
      type: "track_transition",
      trackId: "pro",
      requiredHook: "former_national_team_member",
      tone: "warn",
      titles: [
        "{fighter} уходит из системы сборной в профи.",
        "{fighter} меняет путь сборной на профессиональный бокс."
      ]
    },
    {
      id: "team_to_street",
      type: "track_transition",
      trackId: "street",
      requiredHook: "former_national_team_member",
      tone: "bad",
      titles: [
        "{fighter} уходит из системы сборной на улицу.",
        "{fighter} возвращается на улицу после пути в системе."
      ]
    },
    {
      id: "street_legend",
      type: "street_status",
      statusId: "street_legend",
      tone: "warn",
      titles: [
        "{fighter} становится легендой улиц {country}.",
        "{country}: {fighter} доходит до статуса уличной легенды."
      ]
    },
    {
      id: "pro_title_change",
      type: "pro_title",
      tone: "good",
      titles: [
        "{organization}: {fighter} берёт пояс.",
        "{fighter} становится чемпионом {organization}."
      ]
    }
  ],
  worldLegendArchetypes: [
    {
      id: "retired_great",
      label: "Великий ветеран",
      categoryId: "retired_greats",
      categoryLabel: "Великие ветераны",
      conditions: {
        minFame: 55,
        minTotalWins: 18
      },
      summary: "{fighter} оставил длинную дорогу и большое имя."
    },
    {
      id: "national_team_icon",
      label: "Икона сборной",
      categoryId: "national_team_icons",
      categoryLabel: "Лица сборной",
      conditions: {
        minNationalTeamSelections: 2,
        requiresHook: "former_national_team_member"
      },
      summary: "{fighter} надолго остался в памяти как человек сборной."
    },
    {
      id: "olympic_icon",
      label: "Олимпийская фигура",
      categoryId: "olympic_icons",
      categoryLabel: "Олимпийские имена",
      conditions: {
        minOlympicEntries: 1
      },
      summary: "{fighter} запомнился на большой олимпийской сцене."
    },
    {
      id: "street_legend",
      label: "Легенда улиц",
      categoryId: "street_legends",
      categoryLabel: "Легенды улиц",
      conditions: {
        minStreetRating: 120,
        minUndergroundTitles: 2
      },
      summary: "{fighter} собрал вокруг себя долгую уличную историю."
    },
    {
      id: "world_champion",
      label: "Чемпион мира",
      categoryId: "world_champions",
      categoryLabel: "Чемпионы мира",
      conditions: {
        minProTitles: 1
      },
      summary: "{fighter} дошёл до пояса и вошёл в мировую историю."
    }
  ]
};
