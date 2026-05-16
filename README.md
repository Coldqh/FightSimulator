# Fight Simulator

Static browser boxing sim.

## Current version

`career-depth-0.5.0`

## Runtime architecture

The runtime intentionally uses only:

- `index.html`
- `src/data/game-data.js`
- `src/core/utils.js`
- `src/core/storage.js`
- `src/core/state.js`
- `src/core/world.js`
- `src/core/fight.js`
- `src/ui/render.js`
- `src/app.js`

Old experimental files may remain in the repository, but they are not loaded by `index.html`.

## Run locally

```powershell
cd C:\FightSimulator_GitHub
start index.html
```

## Smoke test

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
```
