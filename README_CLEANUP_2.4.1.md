# FightSimulator Cleanup + Merge 2.4.1

Это пакет для жёсткой чистки репозитория.

## Что делает

- Создаёт backup рядом с репозиторием.
- Удаляет старые патчи, apply/verify/start-clean скрипты, временные README, мусорные файлы.
- Удаляет `src/patches`.
- Убирает подключения патчей из `index.html`.
- Сливает UI-правки в `src/styles.css`.
- Сливает боковое меню и emoji-вкладки в `src/ui/render.js`.
- Сливает gameplay/cache/version фиксы в `src/app.js`, `src/data/game-data.js`, `sw.js`, `version.json`, `reset-cache.html`.
- Оставляет только живое ядро GitHub Pages.

## Что останется

- `index.html`
- `manifest.webmanifest`
- `reset-cache.html`
- `sw.js`
- `version.json`
- `ring_top_view.png`
- `.nojekyll`
- `.github/workflows/pages.yml`
- `assets/icons/*`
- `src/styles.css`
- `src/app.js`
- `src/data/game-data.js`
- `src/core/*.js`
- `src/ui/render.js`
- `README.md`, если был
- `LICENSE`, если был

## Как запускать

Распакуй архив и запусти:

```powershell
PowerShell -ExecutionPolicy Bypass -File .un-cleanup-2.4.1.ps1
```

Потом:

```powershell
cd C:\FightSimulator_GitHub
git status
node --check src/app.js
node --check src/ui/render.js
py -m http.server 5189
```

Открой:

```text
http://localhost:5189/reset-cache.html
```

Если всё ок:

```bash
git add .
git commit -m "Clean repo and merge UI fixes into core files"
git push origin main
```

## Важно

Скрипт чистит жёстко. Backup создаётся автоматически рядом с репозиторием:
`C:\FightSimulator_backup_before_cleanup_...`
