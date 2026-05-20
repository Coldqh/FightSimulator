# Fight World 2.3.8

Фикс кнопки обновления, боевых строк, узких чипов страны, возраста/др, street rating, страховки пропавших профи-титулов, интервала боёв профи NPC, турнирного XP и кликабельных чемпионов в новостях.

```powershell
cd C:\FightSimulator_GitHub
node apply-2.3.8.cjs
node verify-2.3.8.cjs
node start-clean-local-2.3.8.cjs
```

Пуш:

```powershell
git add .
git commit -m "Fix update flow fight rows and gameplay systems 2.3.8"
git push origin main
```

После деплоя сначала открой `https://coldqh.github.io/FightSimulator/reset-cache.html`, потом `https://coldqh.github.io/FightSimulator/?cacheReset=2.3.8`.
