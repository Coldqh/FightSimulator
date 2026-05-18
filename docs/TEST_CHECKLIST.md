# Test Checklist 1.8.7

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
start index.html
```

Manual:
1. Apply the delta zip and confirm `ring_top_view.png` appears in the project root.
2. Start a fight and confirm the ring PNG is visible behind the 5x5 grid.
3. The main tabs include “Избранные”.
4. The fight tab does not show the favorites block.
5. The favorites tab shows added favorite fighters.
