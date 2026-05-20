# Fight World ROOT CACHE FIX 2.3.5

This package avoids PowerShell parsing and encoding issues.

Use Node scripts only.

## Run

```powershell
cd C:\FightSimulator_GitHub
node apply-root-fix-2.3.5.cjs
node verify-root-fix-2.3.5.cjs
node start-clean-local-2.3.5.cjs
```

Fresh local URL:

```text
http://127.0.0.1:5185/reset-cache.html
```

If the old Vite URL still shows 2.3.0, open once:

```text
http://localhost:5173/reset-cache.html
```

Then use only the fresh local URL above.

## Push

```powershell
git add .
git commit -m "Root fix stale service worker cache and version 2.3.5"
git push origin main
```

## GitHub Pages

First open:

```text
https://coldqh.github.io/FightSimulator/reset-cache.html
```

Then:

```text
https://coldqh.github.io/FightSimulator/?cacheReset=2.3.5
```
