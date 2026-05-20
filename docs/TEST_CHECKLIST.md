# Test Checklist 2.1.4

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
node tools\week-benchmark.cjs
start index.html
```

Manual:
1. Old save loads without breaking.
2. Version shows `technical-core-2.1.4`.
3. Rankings still open.
4. Fight result updates ranking after win/loss.
5. News tab can show short migration news.
6. Week switch should feel at least as fast as 2.0.4.
7. Pro contract preview still appears on fight week.
8. No huge duplicate data appears in exported save.
