# FightSimulator Mobile Fixes 2.5.1

Fixes from feedback:

1. Restores flags with emoji fallback if old flag image assets were deleted.
2. Removes white strip at top by forcing dark html/body/theme background.
3. Bottom nav no longer uses huge red filled active buttons. It changes text/icon color only.
4. More menu closes when tapping outside the sheet.
5. Top status pills are compact. No huge gaps.
6. Fight rows are smaller, fit phone screens better, remove favorite buttons, compact Fight button.
7. Fighter profiles are restyled in F1 mobile-manager style.
8. Main palette is more gray/graphite, less pure red/blue.
9. Club roster rows and team roster rows are forced into compact horizontal mobile rows.

Run:

PowerShell -ExecutionPolicy Bypass -File .\run-mobile-fixes-2.5.1.ps1

Or directly:

cd C:\FightSimulator_GitHub
node apply-mobile-fixes-2.5.1.cjs

Check:

node --check src/app.js
node --check src/ui/render.js
py -m http.server 5189

Open:

http://localhost:5189/reset-cache.html

Commit:

git add .
git commit -m "Fix mobile UI layout"
git push origin main
