# Fight World UPDATE BUTTON HARD RESET 2.3.7

Фиксит проблему, где кнопка `Обновить до последней версии` появляется, но после нажатия игра остаётся на старой версии 2.3.5 / 2.3.6.

Причина: старая функция обновления в `src/app.js` делала обычный reload / service worker update, но не чистила старый Cache Storage. Браузер снова отдавал старые `index.html`, `app.js` и patch-файл.

## Что меняется

- `applyUpdateNow()` в `src/app.js` теперь сохраняет карьеру, отключает старые service workers, удаляет старые fight/simulator caches и открывает `reset-cache.html`.
- Runtime patch 2.3.7 дополнительно перехватывает кнопку обновления.
- Фикс вкладки `Бои` остаётся внутри: имя, рекорд, флаг/страна, шанс, деньги, OVR, кнопка `Бой` в одну строку.

## Установка

```powershell
cd C:\FightSimulator_GitHub
node apply-update-button-hard-reset-2.3.7.cjs
node verify-update-button-hard-reset-2.3.7.cjs
node start-clean-local-2.3.7.cjs
```

## Пуш

```powershell
git add .
git commit -m "Fix update button hard reset 2.3.7"
git push origin main
```

После деплоя GitHub Pages один раз вручную открой:

```text
https://coldqh.github.io/FightSimulator/reset-cache.html
```

Потом:

```text
https://coldqh.github.io/FightSimulator/?cacheReset=2.3.7
```
