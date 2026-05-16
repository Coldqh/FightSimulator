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

## Module boundaries

- data: constants only.
- utils: pure helpers.
- storage: localStorage only.
- state: player, roster, training, rankings.
- clubs: gyms and club rosters.
- titles: title ownership and updates.
- stories: career events.
- world: weekly simulation.
- fight: player fight preview/resolution.
- render: HTML only.
- app: DOM events.

Old runtime files must not be imported.
