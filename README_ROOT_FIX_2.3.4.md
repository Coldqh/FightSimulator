# Fight World ROOT CACHE FIX 2.3.4

Это исправление не про визуальную надпись версии.

Корень проблемы: старый Service Worker и Cache Storage на том же origin могли продолжать отдавать старые файлы, включая старый `index.html` и старый patch script. Поэтому локально могла оставаться версия 2.3.0 даже после замены файлов.

## Что делает фикс

- добавляет `reset-cache.html`, который удаляет Service Workers и Fight World caches;
- меняет локальный запуск на новый origin `127.0.0.1:5184`;
- локально блокирует повторную регистрацию Service Worker;
- заменяет `sw.js` на network-first service worker с новым `CACHE_VERSION`;
- удаляет старые patch files;
- оставляет только `src/patches/root-cache-fix-2.3.4.js`;
- реально меняет `src/data/game-data.js`;
- реально меняет `version.json`;
- добавляет строгий `verify_root_fix.ps1`.

## Установка

```powershell
cd C:\FightSimulator_GitHub
PowerShell -ExecutionPolicy Bypass -File .\apply_root_fix.ps1
PowerShell -ExecutionPolicy Bypass -File .\verify_root_fix.ps1
PowerShell -ExecutionPolicy Bypass -File .\start_clean_local.ps1
```

## Старый localhost:5173

Если он уже был открыт и держит 2.3.0, один раз открой:

```text
http://localhost:5173/reset-cache.html
```

После этого используй чистый запуск:

```text
http://127.0.0.1:5184/reset-cache.html
```

## Пуш

```powershell
git add .
git commit -m "Root fix stale service worker cache and version 2.3.4"
git push origin main
```

## GitHub Pages

После деплоя сначала открой:

```text
https://coldqh.github.io/FightSimulator/reset-cache.html
```

Потом можно открывать:

```text
https://coldqh.github.io/FightSimulator/?cacheReset=2.3.4
```
