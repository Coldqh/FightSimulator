# Fight Simulator Architecture — 1.6.2

## Changed systems

- `src/data/game-data.js`: economy configuration.
- `src/core/state.js`: money, fatigue, equipment, monthly expenses, medical services.
- `src/core/world.js`: monthly expense tick and weekly fatigue recovery.
- `src/core/fight.js`: fight income and fight fatigue.
- `src/core/amateur.js`: tournament entry fees and tournament income.
- `src/ui/render.js`: Economy tab and fatigue display.
- `src/app.js`: economy actions and deep repair.
- `src/core/storage.js`: save compatibility fields.

## Patch discipline

Future patches should remain delta-only: include only files that changed.
