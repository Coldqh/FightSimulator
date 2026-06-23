# FightSimulator F1 Mobile UI 2.5.0

Dark F1 Dynasty-inspired mobile-first UI.

## Changes

- black / graphite main theme;
- mobile bottom navigation:
  - Overview
  - Profile
  - Next Week
  - Fights / Pro
  - More
- More opens a bottom sheet:
  - Path
  - Stats
  - Ranking
  - My Club
  - Clubs
  - Favorites
  - News
  - People
  - Settings
- desktop keeps side navigation;
- phone layout gets one-column cards, compact rows, bottom modals;
- no `src/patches`;
- changes are merged into main files:
  - `src/styles.css`
  - `src/ui/render.js`
  - `src/app.js`
  - `src/data/game-data.js`
  - `index.html`
  - `sw.js`
  - `version.json`
  - `manifest.webmanifest`
  - `reset-cache.html`

## Run

```powershell
PowerShell -ExecutionPolicy Bypass -File .\run-f1-mobile-ui-2.5.0.ps1
```

Or directly:

```powershell
cd C:\FightSimulator_GitHub
node apply-f1-mobile-ui-2.5.0.cjs
```

## Check

```powershell
cd C:\FightSimulator_GitHub
node --check src/app.js
node --check src/ui/render.js
py -m http.server 5189
```

Open:

```text
http://localhost:5189/reset-cache.html
```

## Commit

```bash
git add .
git commit -m "Add F1-style mobile UI"
git push origin main
```
