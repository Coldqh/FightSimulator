var DATA = {
  "statLabels": {
    "str": "Сила",
    "tec": "Техника",
    "spd": "Скорость",
    "end": "Выносливость",
    "vit": "Здоровье"
  },
  "perkCategoryLabels": {
    "combat": "Боевой перк",
    "career": "Карьерный перк",
    "psychological": "Психологический перк"
  }
};

var FIGHT_ACTIONS = {
  "move_up": {
    "type": "move",
    "label": "Шаг вверх",
    "dx": 0,
    "dy": -1,
    "stamina": 5
  },
  "move_left": {
    "type": "move",
    "label": "Шаг влево",
    "dx": -1,
    "dy": 0,
    "stamina": 5
  },
  "move_right": {
    "type": "move",
    "label": "Шаг вправо",
    "dx": 1,
    "dy": 0,
    "stamina": 5
  },
  "move_down": {
    "type": "move",
    "label": "Шаг вниз",
    "dx": 0,
    "dy": 1,
    "stamina": 5
  },
  "jab": {
    "type": "attack",
    "label": "Джеб",
    "reach": "line",
    "hitBonus": 10,
    "damage": 8,
    "stamina": 7
  },
  "cross": {
    "type": "attack",
    "label": "Кросс",
    "reach": "line",
    "hitBonus": 0,
    "damage": 12,
    "stamina": 11
  },
  "body": {
    "type": "attack",
    "label": "Удар в корпус",
    "reach": "line",
    "hitBonus": 5,
    "damage": 10,
    "stamina": 10
  },
  "hook": {
    "type": "attack",
    "label": "Хук",
    "reach": "close",
    "hitBonus": -6,
    "damage": 16,
    "stamina": 15
  },
  "uppercut": {
    "type": "attack",
    "label": "Апперкот",
    "reach": "close",
    "hitBonus": -12,
    "damage": 21,
    "stamina": 18
  },
  "block": {
    "type": "defense",
    "label": "Блок",
    "staminaGain": 30
  },
  "counter": {
    "type": "defense",
    "label": "Контратака",
    "staminaGain": 15
  }
};

var TRAINING_OPTIONS = {
  "light": {
    "label": "Лёгкая",
    "points": 10,
    "health": -6,
    "stress": 6
  },
  "medium": {
    "label": "Средняя",
    "points": 20,
    "health": -12,
    "stress": 12
  },
  "hard": {
    "label": "Жёсткая",
    "points": 30,
    "health": -18,
    "stress": 18
  }
};

var RECOVERY_OPTIONS = {
  "home": {
    "label": "Отлежаться дома",
    "cost": 0,
    "health": 18,
    "stress": -10,
    "wear": -1
  },
  "doctor": {
    "label": "Спортивный врач",
    "cost": 60,
    "health": 30,
    "stress": -6,
    "wear": -3
  },
  "therapy": {
    "label": "Терапия и массаж",
    "cost": 35,
    "health": 20,
    "stress": -16,
    "wear": -4
  }
};

var WEEKLY_EXPENSE = 0;

var LEGAL_JOB = {
  "label": "Работа в зале",
  "money": 90,
  "health": -15,
  "stress": 10
};

var NAV_TABS = [
  {
    "key": "home",
    "label": "Основное"
  },
  {
    "key": "character",
    "label": "Персонаж"
  },
  {
    "key": "attributes",
    "label": "Характеристики"
  },
  {
    "key": "career",
    "label": "Карьера"
  },
  {
    "key": "rankings",
    "label": "Рейтинги"
  },
  {
    "key": "people",
    "label": "Люди"
  },
  {
    "key": "skills",
    "label": "Навыки"
  },
  {
    "key": "careerLog",
    "label": "Лента"
  }
];

