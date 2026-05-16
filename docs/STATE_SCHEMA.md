# GameState Schema

## Назначение

`GameState` — каноническое состояние игры. Старый UI все еще работает через legacy-поля вроде `state.fighter`, `state.screen`, `state.panel`, но они уже считаются адаптерами поверх нормализованной структуры.

## Корневая структура

```js
{
  meta: {},
  player: {},
  career: {},
  world: {},
  battle: {},
  ui: {},
  feed: {}
}
```

## meta

```js
meta: {
  appVersion: String,
  saveVersion: Number,
  rng: {
    mode: "native" | "seeded",
    seed: Number | null,
    value: Number | null,
    label: String
  },
  updateAvailable: Boolean,
  remoteVersion: String,
  debugMode: Boolean
}
```

## player

```js
player: {
  profile: {
    name: String,
    homeCountry: String,
    currentCountry: String
  },
  stats: {
    str: Number,
    tec: Number,
    spd: Number,
    end: Number,
    vit: Number
  },
  resources: {
    skillPoints: Number,
    money: Number,
    health: Number,
    stress: Number,
    fame: Number
  },
  conditions: {
    fatigue: Number,
    wear: Number,
    morale: Number,
    startingAge: Number
  },
  record: {
    wins: Number,
    losses: Number,
    kos: Number,
    deathsCaused: Number
  }
}
```

## career

```js
career: {
  week: Number,
  calendar: {
    startYear: Number,
    startMonthIndex: Number,
    totalWeeks: Number
  },
  create: {
    country: String,
    identity: Object
  } | null,
  endingReason: String
}
```

`career.week` остается legacy-совместимым порядковым номером недели, а реальные месяц/год считаются через `TimeSystem` из `career.calendar`.

## world

```js
world: {
  opponents: Array,
  offers: {
    weekStamp: Number,
    available: Array,
    headline: String
  },
  npcs: Array,
  relationships: Array,
  contracts: Array,
  lastWeekAction: {
    type: String,
    label: String,
    meta: Object | null
  },
  scene: {
    updatedWeek: Number,
    buzz: Number,
    temperature: Number
  }
}
```

Эта секция уже готовит расширение под NPC, отношения, контракты и мировые предложения, даже если часть массивов пока работает как точки расширения.

## battle

```js
battle: {
  current: Object | null
}
```

## ui

```js
ui: {
  screen: String,
  panel: String,
  savedPreview: Object | null,
  debug: {
    enabled: Boolean,
    open: Boolean
  }
}
```

## feed

```js
feed: {
  log: Array
}
```

## Legacy adapters

Для совместимости рантайм все еще держит:

- `state.fighter`
- `state.opponents`
- `state.fight`
- `state.screen`
- `state.panel`
- `state.log`

Они собираются из `GameState` через адаптеры в [state_factory.js](/C:/Fight%20Simulator/src/core/state_factory.js).
