# Test Checklist 2.0.0

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
start index.html
```

Manual:
1. Game starts with 100+ countries.
2. All country labels show flags where countries are displayed.
3. `assets/flags` contains PNG flags.
4. Amateur total is 20,000.
5. Street total is 5,000.
6. Pro total is 1,800.
7. Club count depends on total fighters / 30.
8. Profile tab has only 3 career-management buttons.
9. Travel opens a modal and costs money.
10. Low amateur/street opponents are from the current country.
