# Test Checklist 1.8.0

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
start index.html
```

Manual checks:

1. Open a fight preview and accept the fight.
2. The result log should show turn-by-turn actions: hits, misses, damage and HP.
3. Tournament fights should show the same style of log.
4. There should be no tactical/game-plan UI.
5. No aggression/tempo/clinch/first-number mechanics should appear.
