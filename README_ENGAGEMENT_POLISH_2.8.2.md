# FightSimulator Engagement Polish 2.8.2

## Что чинит

1. Команды запуска теперь в ответе идут сразу с `cd`.
2. `.cjs` и `.ps1` удаляют сами себя после успешной работы.
3. Награды в профиле показывают только подиум:
   - 1 место;
   - 2 место;
   - 3 место.
4. На первой неделе новости про новых тренеров сборных больше не попадают в ленту.
5. Бывшие соперники больше не добавляются в “Люди” случайно после каждого боя.
   Теперь попадают только:
   - после близкого боя;
   - после реального реванша.
6. Реванш теперь явно помечается:
   - новостью “Доступен реванш”;
   - меткой `Реванш` в списке боёв;
   - заметкой в “Люди”.
7. Мини-статистика выведена во вкладку “Обзор”.

## Экономика

Месячные траты не трогались.

## Запуск

```powershell
cd C:\FightSimulator_GitHub
PowerShell -ExecutionPolicy Bypass -File .\run-engagement-polish-2.8.2.ps1
```

## Проверка

```powershell
cd C:\FightSimulator_GitHub
node --check src/data/game-data.js
node --check src/core/world.js
node --check src/core/clubs.js
node --check src/core/fight.js
node --check src/core/matchmaking.js
node --check src/ui/render.js
node --check src/app.js
py -m http.server 5189
```

## Пуш

```bash
cd C:\FightSimulator_GitHub
git add src/data/game-data.js src/core/world.js src/core/clubs.js src/core/fight.js src/core/matchmaking.js src/ui/render.js src/app.js version.json sw.js reset-cache.html
git commit -m "Polish engagement systems and overview stats"
git push origin main
```
