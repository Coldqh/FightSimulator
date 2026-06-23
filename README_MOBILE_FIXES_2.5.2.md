# FightSimulator Mobile Fixes 2.5.2

Fixes:

1. Event/news modal after next week is above center, not bottom.
2. Country flags are now emoji-only, no image reload/flicker after tab changes.
3. Next Week button has colored background. Other bottom tabs only change text/icon color.
4. More closes by tapping outside the sheet.
5. Top status chips are tighter with no huge gaps.
6. Fight rows are one-line mobile rows:
   name / flag / OVR / record / money / chance / Fight.
   No favorite buttons.
   Fight button is fixed small width.
7. Fight section header is compact.
8. Palette is more gray/graphite.
9. White top strip is forced dark.

Run:

PowerShell -ExecutionPolicy Bypass -File .\run-mobile-fixes-2.5.2.ps1

Or directly:

cd C:\FightSimulator_GitHub
node apply-mobile-fixes-2.5.2.cjs

Check:

node --check src/app.js
node --check src/ui/render.js
py -m http.server 5189

Open:

http://localhost:5189/reset-cache.html

Commit:

git add .
git commit -m "Fix mobile fight layout"
git push origin main
