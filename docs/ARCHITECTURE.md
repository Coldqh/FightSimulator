# Architecture

## Loading order

`index.html` loads modules in this order:

1. `src/data/game-data.js`
2. `src/core/utils.js`
3. `src/core/storage.js`
4. `src/core/state.js`
5. `src/core/world.js`
6. `src/core/fight.js`
7. `src/ui/render.js`
8. `src/app.js`

This order matches the current GitHub runtime and should not be broken.

## Responsibilities

- `data`: static config.
- `utils`: pure helpers.
- `storage`: LocalStorage adapter.
- `state`: player, roster, people, rankings, training, path changes.
- `world`: weekly simulation, teams, transitions, offers.
- `fight`: player fight preview and resolution.
- `render`: HTML rendering.
- `app`: DOM event routing.
