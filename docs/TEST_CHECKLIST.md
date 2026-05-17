# Test Checklist 1.8.4

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
start index.html
```

Manual:
1. Every turn should restore some stamina.
2. Block should restore about 20% stamina.
3. Counter should restore about 10% stamina.
4. New round should restore 30% stamina.
5. Knockdown should restore 10% to fallen fighter and 20% to the fighter who scored it.
