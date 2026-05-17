# Test Checklist 1.3.1

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
start index.html
```

Manual:
1. In Amateur Path, click Заявиться.
2. In fight preview, click Принять бой.
3. Fight result opens.
4. Amateur ranking has no crown/champion.
5. Amateur fighter card shows awards instead of titles.
6. Pro ranking says world/global and has one champion per weight.
7. Continental tournament can pick same-continent opponents.
8. World/Olympiad tournaments can pick strong amateurs from any country.
