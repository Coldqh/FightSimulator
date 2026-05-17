# Test Checklist 1.8.3

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
start index.html
```

Manual:
1. Accept a fight: it should cover the full screen inside the game tab.
2. The main menu must be inaccessible until the fight ends.
3. Punch buttons show red damage, yellow chance, blue stamina cost.
4. HP bar is red; stamina bar is blue.
5. Economy tab has no medicine/restoration block.
6. Economy tab has no finance feed.
7. Counter hit is counted in fight statistics.
8. Some NPCs can rarely move countries and appear in foreign gyms.
