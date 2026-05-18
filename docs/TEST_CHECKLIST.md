# Test Checklist 1.9.4

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
start index.html
```

Manual:
1. Start screen uses archetypes instead of age/path selectors.
2. Rookie starts age 16, OVR 0, amateur, expenses $0.
3. Amateur starts age 18, OVR 30, amateur.
4. Street kid starts age 18, OVR 10, street.
5. Debt pro starts age 26, OVR 90, pro, $0, high expenses.
6. Pro tab shows contract offers for pro careers.
7. Contract can be signed and scheduled.
8. On fight week, contract fight can be started.
9. Pro tab shows title opportunities.
10. Fight result modal has summary/statistics/action log.
