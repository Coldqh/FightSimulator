FightSimulator UI Remake 2.4.0

Что внутри:
- index.html — полная замена, подключает новый CSS и JS UI-патч.
- sw.js — полная замена, новый cacheVersion, чтобы GitHub Pages не держал старые файлы.
- version.json — полная замена версии.
- manifest.webmanifest — светлая тема приложения.
- src/ui-remake-2.4.0.css — новый слой дизайна.
- src/patches/ui-remake-2.4.0.js — JS-патч боковой навигации и emoji-вкладок.

Что меняется:
- новая светлая спортивная палитра;
- выбор окон через боковую менюшку на десктопе;
- на телефоне меню превращается в горизонтальную компактную ленту;
- добавлены emoji к вкладкам;
- "Хар" переименовано в "Статы";
- верхняя панель стала компактнее и не должна разваливаться;
- строки боёв, рейтинга, клубов, ростеров и модалок принудительно сжаты;
- длинные имена бойцов режутся через ellipsis, а не ломают строку;
- cache/version обновлены до 2.4.0.

Как ставить:
1. Распакуй архив.
2. Скопируй файлы из архива в корень локального репозитория:
   C:\FightSimulator_GitHub
3. Подтверди замену index.html, sw.js, version.json, manifest.webmanifest.
4. Проверь локально:
   PowerShell -ExecutionPolicy Bypass -File .\start_host.ps1
5. Открой:
   http://localhost:5189/?v=2.4.0&ui=1
6. Если всё ок:
   git status
   git add .
   git commit -m "UI remake 2.4.0"
   git push origin main
7. На GitHub Pages открой:
   https://coldqh.github.io/FightSimulator/?v=2.4.0&ui=1

Важно:
- Прямой push через интеграцию не прошёл: GitHub вернул 403 Resource not accessible by integration.
- Патч работает поверх render.js, поэтому риск сломать механику ниже.
