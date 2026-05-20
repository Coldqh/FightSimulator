# Fight World FIGHT ROWS FIX 2.3.6

Исправляет вкладку `Бои`.

Строка соперника теперь собирается заново из `state.offers` и `Fight.buildFightPreview`, поэтому больше не зависит от сломанной старой разметки.

В каждой строке:

```text
Имя | рекорд | флаг страна | шанс | деньги | OVR | Бой
```

## Установка

```powershell
cd C:\FightSimulator_GitHub
node apply-fight-rows-2.3.6.cjs
node verify-fight-rows-2.3.6.cjs
node start-clean-local-2.3.6.cjs
```

Чистая локальная ссылка:

```text
http://127.0.0.1:5186/reset-cache.html
```

## Пуш

```powershell
git add .
git commit -m "Fix fight rows and GitHub Pages cache 2.3.6"
git push origin main
```

## После GitHub Pages

Сначала:

```text
https://coldqh.github.io/FightSimulator/reset-cache.html
```

Потом:

```text
https://coldqh.github.io/FightSimulator/?cacheReset=2.3.6
```
