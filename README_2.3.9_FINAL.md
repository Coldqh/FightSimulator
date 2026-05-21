# Fight World 2.3.9 FINAL

Этот пакет закрывает ошибку, где GitHub Pages видел 2.3.8, хотя нужен финальный 2.3.9.

Корень: в рабочих файлах оставались ссылки на старые update/reset targets, особенно `fromUpdateButton=2.3.7/2.3.8`, а service worker мог продолжать поднимать старую сборку.

## Что правится

- `version.json` -> `final-version-fix-2.3.9`
- `src/data/game-data.js` -> `appVersion: "final-version-fix-2.3.9"`
- `src/data/game-data.js` -> `saveSchemaVersion: 239`
- `src/app.js` -> кнопка обновления ведёт только на `fromUpdateButton=2.3.9&target=2.3.9`
- `sw.js` -> cache version `fight-simulator-final-version-fix-2.3.9`
- `reset-cache.html` -> открывает только `cacheReset=2.3.9`
- удаляются старые patch-файлы 2.3.0-2.3.8
- подключается только `src/patches/final-version-fix-2.3.9.js`
- фиксируется растянутая кнопка ранга/разряда
- рейтинг, ростер клуба, ростер сборной и избранные становятся горизонтальными строками

## Установка

```powershell
cd C:\FightSimulator_GitHub

node apply-2.3.9-final.cjs
node verify-2.3.9-final.cjs
node start-clean-local-2.3.9-final.cjs
```

## Пуш

```powershell
git status
git add .
git commit -m "Fix final 2.3.9 update target and compact rows"
git push origin main
```

## После деплоя GitHub Pages

Открой сначала:

```text
https://coldqh.github.io/FightSimulator/reset-cache.html?target=2.3.9
```

Потом:

```text
https://coldqh.github.io/FightSimulator/?cacheReset=2.3.9
```
