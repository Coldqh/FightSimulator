# Fight World 2.3.9

Фиксит две критические вещи:

1. Обновление версии больше не откатывает в 2.3.7/2.3.8.
   - `src/app.js` теперь ведёт на `reset-cache.html?fromUpdateButton=2.3.9`.
   - `reset-cache.html` всегда открывает `index.html?cacheReset=2.3.9`.
   - `sw.js`, `version.json`, `game-data.js` и runtime patch имеют одну версию: `gameplay-update-fix-2.3.9`.

2. Кнопка ранга / разряда больше не растягивается на весь экран.
   - `rank-pill`, `pill-link`, `button[data-path-rank-info]` зажаты по ширине текста.

Дополнительно:
- рейтинг, ростер клуба и ростер сборной переводятся в одну горизонтальную строку:
  позиция/имя/страна/рекорд/OVR;
- во вкладке Бои строка остаётся компактной:
  имя/страна/шанс/деньги/OVR/Бой;
- избранные остаются в формате:
  имя/страна/OVR/рекорд.

## Установка

```powershell
cd C:\FightSimulator_GitHub
node apply-2.3.9.cjs
node verify-2.3.9.cjs
node start-clean-local-2.3.9.cjs
```

## Пуш

```powershell
git status
git add .
git commit -m "Fix final update target and compact rank rows 2.3.9"
git push origin main
```

После деплоя сначала открой:

```text
https://coldqh.github.io/FightSimulator/reset-cache.html
```

Потом:

```text
https://coldqh.github.io/FightSimulator/?cacheReset=2.3.9
```
