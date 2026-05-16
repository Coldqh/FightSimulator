# Architecture

## Структура

```text
index.html
manifest.webmanifest
version.json
src/styles.css
src/data/game-data.js
src/core/utils.js
src/core/storage.js
src/core/state.js
src/core/world.js
src/core/fight.js
src/ui/render.js
src/app.js
```

## Ответственность

### src/data/game-data.js

Статичные данные: страны, пути, роли людей, названия боёв, базовые выплаты, названия характеристик.

### src/core/utils.js

Общие функции: escapeHtml, random, clamp, поиск страны, поиск пути, расчёт рейтинга, формат рекорда.

### src/core/storage.js

Сохранения: load, save, clear, SAVE_KEY.

### src/core/state.js

Состояние: создание карьеры, ростер, люди, поиск бойца, рейтинг, нормализация сохранений.

### src/core/world.js

Мир: 3 оффера, недельная симуляция NPC, переходы, ограничения переходов, события недели.

### src/core/fight.js

Бои: расчёт результата, обновление рекорда, окно результата, запуск недельной симуляции после боя.

### src/ui/render.js

Рендер: старт, dashboard, вкладки, рейтинги, мир, модальные окна.

### src/app.js

Связка: загрузка, DOM-события, действия пользователя, save/render.

## Правило развития

Новая механика не добавляется в `render.js`. UI только отображает состояние и отправляет команды.
