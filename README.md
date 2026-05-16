# Fight Simulator MVP Overlay

Готовая сборка для установки поверх текущей папки проекта.

## Установка

```powershell
cd C:\FightSimulator_GitHub
Expand-Archive -Path C:\Users\%USERNAME%\Downloads\fight-simulator-mvp-overlay.zip -DestinationPath C:\FightSimulator_GitHub -Force
start index.html
```

После проверки:

```powershell
cd C:\FightSimulator_GitHub
git status
git add .
git commit -m "Install MVP ecosystem overlay"
git push origin main
```

## Что добавлено

- чистая архитектура по файлам;
- быстрый старт карьеры;
- 3 боя в любой стране и любом пути;
- улица / любители / профи;
- запрет возврата в любители после профи;
- запрет возврата в профи после ухода из профи на улицу;
- карточки бойцов;
- рейтинги с фильтрами;
- знакомые люди без шкал и действий;
- лёгкая недельная симуляция NPC;
- переходы NPC между путями;
- вкладка мира со сборной и событиями недели.

Старые файлы могут остаться в папке, но новый `index.html` их не подключает.
