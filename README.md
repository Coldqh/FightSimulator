# Fight World — update button fix + UI patch 2.3.2

Главная правка: кнопка обновления теперь не зависит только от старой логики `app.js`.

## Что изменено

1. Обновляется реальный `src/data/game-data.js`:
   - `appVersion: "update-button-fix-2.3.2"`

2. Добавлен отдельный страховочный update-check:
   - `src/patches/update-button-fix-2.3.2.js`

3. Он сам проверяет:
   - `version.json?updateCheck=...`
   - waiting service worker
   - возвращение вкладки в фокус
   - каждые 2 минуты

4. Если версия отличается, показывает кнопку:
   - `Доступна новая версия`
   - `Обновить`
   - `Позже`

5. Кнопка обновления:
   - просит service worker активироваться;
   - чистит runtime/static cache приложения;
   - перезагружает сайт с `?v=...`;
   - сохранение не трогает.

6. Также сохранён UI-патч:
   - компактные строки боёв;
   - рейтинг и ростеры без растянутых имён;
   - новости турниров в одну строку с 1/2/3 местом;
   - маленький тип новости напротив недели;
   - календарь турниров.

## Установка

```powershell
cd C:\FightSimulator_GitHub
PowerShell -ExecutionPolicy Bypass -File .\apply_patch.ps1
```

## Локальный хост

```powershell
cd C:\FightSimulator_GitHub
PowerShell -ExecutionPolicy Bypass -File .\start_host.ps1
```

## Пуш

```powershell
cd C:\FightSimulator_GitHub
git status
git add .
git commit -m "Fix visible update button and compact tournament UI 2.3.2"
git push origin main
```

## Если старая PWA всё равно не увидит кнопку

Это значит, что на iPhone ещё работает старый service worker без новой проверки.

Один раз открой сайт так:

```text
https://coldqh.github.io/FightSimulator/?v=2.3.2
```

После загрузки 2.3.2 будущие патчи уже должны показывать кнопку обновления нормально.
