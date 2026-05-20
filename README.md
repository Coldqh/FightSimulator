# Fight World HARD FIX 2.3.3

Явная причина бага: в `index.html` на GitHub был подключён старый файл:

```html
<script src="src/patches/tournament-ui-hotfix-2.3.0.js"></script>
```

Он на старте выставлял runtime-версию 2.3.0 и перебивал новые попытки обновления.

Этот hard-fix:
- удаляет старые patch scripts из `index.html`;
- удаляет старые patch files из `src/patches`;
- ставит только `src/patches/hard-fix-2.3.3.js?v=2.3.3`;
- реально обновляет `src/data/game-data.js`;
- реально обновляет `version.json`;
- реально обновляет `sw.js` CACHE_VERSION и precache;
- добавляет `verify_patch.ps1`, который падает, если где-то остался 2.3.0/2.3.1/2.3.2;
- открывает локальный хост с cache-busting URL.

## Установка

```powershell
cd C:\FightSimulator_GitHub
PowerShell -ExecutionPolicy Bypass -File .\apply_patch.ps1
PowerShell -ExecutionPolicy Bypass -File .\verify_patch.ps1
PowerShell -ExecutionPolicy Bypass -File .\start_host.ps1
```

## Пуш

```powershell
cd C:\FightSimulator_GitHub
git status
git add .
git commit -m "Hard fix stale 2.3.0 patch cache and version 2.3.3"
git push origin main
```

## Проверка на GitHub Pages

После деплоя открой:

```text
https://coldqh.github.io/FightSimulator/?v=2.3.3&hard=1
```
