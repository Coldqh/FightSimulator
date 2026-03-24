var WORLD_QA_DATA = {
  batchPresets: [
    {
      id: "world_batch_1y",
      label: "1 год",
      years: 1,
      weeks: 52,
      summary: "Короткий прогон сезона и одной ротации сборных."
    },
    {
      id: "world_batch_4y",
      label: "4 года",
      years: 4,
      weeks: 208,
      summary: "Проверка полного олимпийского цикла и взросления юниоров."
    },
    {
      id: "world_batch_8y",
      label: "8 лет",
      years: 8,
      weeks: 416,
      summary: "Проверка длинных карьер, переходов и смен поколений."
    },
    {
      id: "world_batch_16y",
      label: "16 лет",
      years: 16,
      weeks: 832,
      summary: "Стресс-тест мира на долгую дистанцию."
    }
  ],
  validationRules: [
    {
      id: "dangling_ids",
      label: "Висячие ID",
      severity: "error",
      summary: "Ссылки на бойцов, залы, тренеров, команды и турниры должны вести в живые сущности."
    },
    {
      id: "invalid_roster_membership",
      label: "Сломанные связи ростера",
      severity: "error",
      summary: "Боец, зал и тренер должны видеть друг друга одинаково."
    },
    {
      id: "broken_team_slot",
      label: "Слоты сборной",
      severity: "error",
      summary: "Состав и резерв сборной не должны ломать лимиты, страну и статус."
    },
    {
      id: "impossible_age_rank",
      label: "Невозможный возраст и разряд",
      severity: "warn",
      summary: "Возраст, разряд и трек должны сочетаться логично."
    },
    {
      id: "invalid_transition_history",
      label: "История переходов",
      severity: "warn",
      summary: "Переходы между треками не должны противоречить текущему состоянию."
    }
  ],
  teamStatusActions: [
    { id: "none", label: "Вне списка" },
    { id: "candidate", label: "Кандидат" },
    { id: "reserve", label: "Резерв" },
    { id: "active", label: "Состав" },
    { id: "dropped", label: "Исключён" }
  ],
  trackActions: [
    { id: "street", label: "Улица" },
    { id: "amateur", label: "Любители" },
    { id: "pro", label: "Профи" }
  ],
  retirementReasons: [
    { id: "debug_retirement", label: "Debug retirement" },
    { id: "wear", label: "Износ" },
    { id: "injury", label: "Травмы" },
    { id: "money", label: "Деньги" },
    { id: "burnout", label: "Выгорание" }
  ]
};
