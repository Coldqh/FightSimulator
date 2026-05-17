# Fight Simulator Architecture — 1.5 Stable Core

## Runtime

Static browser app:
- `index.html`
- `src/data/game-data.js`
- `src/core/*.js`
- `src/ui/render.js`
- `src/app.js`
- `src/styles.css`

No build step is required.

## Core modules

- `state.js`: career state, records by path, date, ranking helpers.
- `world.js`: weekly world simulation, national teams, NPC activity.
- `fight.js`: fight preview/result simulation.
- `amateur.js`: amateur tournament bracket flow and awards.
- `clubs.js`: club generation, trainers, roster binding.
- `titles.js`: pro/street title ownership.
- `matchmaking.js`: player fight offers and NPC opponent selection.
- `storage.js`: save repair/export/import.
- `render.js`: UI rendering only.
- `app.js`: event routing only.

## 1.5 cleanup decisions

- Large lists are no longer rendered inside main screens.
- Tournament state is kept inside tournament modals.
- Team and tournament participant lists use paged modals.
- The duplicate pre-quarterfinal stage was removed because quarterfinal is the 8-fighter stage.
