# Test Checklist 2.2.1 Offline PWA

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
node tools\week-benchmark.cjs
node --check sw.js
start index.html
```

Manual iPhone test:
1. Push to GitHub Pages.
2. Open the site on iPhone while online.
3. Wait for the page to fully load.
4. Add to Home Screen.
5. Turn on airplane mode.
6. Open FightSim from the home screen.
7. Existing save should load from localStorage.
8. Main UI, flags, ring image and scripts should load offline.
