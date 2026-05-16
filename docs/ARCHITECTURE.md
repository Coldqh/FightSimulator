# Architecture

## Loading order

1. src/data/game-data.js
2. src/core/utils.js
3. src/core/storage.js
4. src/core/state.js
5. src/core/clubs.js
6. src/core/titles.js
7. src/core/stories.js
8. src/core/world.js
9. src/core/fight.js
10. src/ui/render.js
11. src/app.js

## Rule

No monolith. No runtime imports from old experimental files.

## Modules

- data: constants.
- utils: pure helpers.
- storage: save/load/migration.
- state: state mutations.
- clubs: gyms and club roster.
- titles: champion ownership and challenge eligibility.
- stories: NPC/player stories.
- world: weekly simulation.
- fight: previews/results.
- render: HTML.
- app: DOM events.
