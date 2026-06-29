# FightSimulator Gameplay Engagement Lite 2.8.1

## Краткий аудит

Проверены упоминания:

- `equipment`
- `medicine`
- `medical`
- `injury`
- `injuries`

В core-файлах патч делает аудит и выводит найденные совпадения. Месячные траты и экономика не трогаются.

## Что добавлено

### 1. Реванши

После близкого боя или повторной встречи игра запоминает соперника в:

```js
state.world.playerRivalries
```

Через 4–8 недель может появиться оффер:

```text
Реванш
```

Только для любителей и улицы. Профи не трогал, потому что там контракты.

### 2. Близкие соперники в Люди

Если бой закончился близко:

- ничья;
- решение судей с маленькой разницей;

соперник добавляется в `Люди` как бывший соперник.

### 3. Новости по важным событиям

Добавлены новости:

- близкий бой;
- реванш;
- победа над соперником выше по OVR;
- серия побед 3 / 5 / 8 / 12.

### 4. Мини-статистика игрока

В `player.careerStats` аккуратно пишутся:

- текущая серия побед;
- текущая серия поражений;
- лучшая серия побед;
- победы над более сильными;
- лучший побеждённый OVR;
- последние данные боя.

Пока без отдельного UI-блока, чтобы не трогать интерфейс и не рисковать.

## Файлы

- `src/data/game-data.js`
- `src/core/world.js`
- `src/core/clubs.js`
- `src/core/fight.js`
- `src/core/matchmaking.js`
- `src/app.js`
- `version.json`
- `sw.js`
- `reset-cache.html`

## Запуск

```powershell
PowerShell -ExecutionPolicy Bypass -File .\run-gameplay-engagement-lite-2.8.1.ps1
```

## Проверка

```powershell
cd C:\FightSimulator_GitHub
node --check src/data/game-data.js
node --check src/core/world.js
node --check src/core/clubs.js
node --check src/core/fight.js
node --check src/core/matchmaking.js
node --check src/app.js
py -m http.server 5189
```

## Пуш

```bash
git add src/data/game-data.js src/core/world.js src/core/clubs.js src/core/fight.js src/core/matchmaking.js src/app.js version.json sw.js reset-cache.html
git commit -m "Add lightweight rivalries and rematches"
git push origin main
```
