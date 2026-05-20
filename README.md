# Fight World — полноценный патч + хост 2.3.0

Архив делает патч нормальной частью проекта и добавляет хостинг через GitHub Pages.

## Что добавляется

- `src/patches/tournament-ui-hotfix-2.3.0.js`
- подключение патча в `index.html`
- новая версия в `version.json`
- обновление `CACHE_VERSION` и precache в `sw.js`
- GitHub Pages workflow: `.github/workflows/pages.yml`
- `.nojekyll`
- локальный хост: `start_host.ps1`

## Как применить

Распакуй архив в корень репозитория `FightSimulator`.

Потом в PowerShell из корня репозитория:

```powershell
PowerShell -ExecutionPolicy Bypass -File .\apply_patch.ps1
```

## Проверить локально

```powershell
PowerShell -ExecutionPolicy Bypass -File .\start_host.ps1
```

Откроется:

```text
http://localhost:5173
```

## Залить на GitHub и хост

```powershell
git add .
git commit -m "Tournament calendar and UI host patch 2.3.0"
git push
```

После GitHub Actions деплоя хост будет:

```text
https://coldqh.github.io/FightSimulator/
```

Если GitHub Pages ещё не включён:
`Settings -> Pages -> Build and deployment -> Source: GitHub Actions`.

## Что исправлено

1. Календарь турниров:
   - город — раз в 4 месяца;
   - область — раз в 6 месяцев;
   - регион — раз в 8 месяцев;
   - страна — раз в год;
   - континент — раз в год;
   - мир/чемпионат мира — раз в год;
   - олимпиада — раз в 2 года.

2. Новости турниров:
   - убраны лишние пустые кружки;
   - первое/второе/третье место больше не ломаются;
   - имена остаются кликабельными.

3. Рейтинг:
   - одна горизонтальная строка;
   - позиция, имя, страна/флаг, рекорд, OVR;
   - лишние подписи убраны.

4. UI:
   - вкладка “Характеристики” переименована в “Статы”;
   - кнопки уменьшены;
   - во вкладке боёв соперник в одну строку;
   - кнопка “избранные” из вкладки боёв скрыта;
   - перед боем раунды, деньги и шанс в одну строку;
   - во время боя скрыты деньги и шанс;
   - из лога боя убраны служебные фразы;
   - из итогов боя удалён лог ударов.
