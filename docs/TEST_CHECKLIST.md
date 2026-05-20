# Test Checklist 2.2.0

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
node tools\week-benchmark.cjs
start index.html
```

Manual:
1. News has buttons opening fighter profiles.
2. Training gives exactly 3 characteristic points.
3. Training gives 20 fatigue.
4. Fatigue does not rise above 94.
5. Skipped fight result shows score/KO info and no punch log.
6. NPC profile history includes fights against the player.
7. Team roster/reserve shows player with green `Ты`.
8. Player with OVR 121 moves to pro.
9. Fighter profile shows both awards and titles.
10. Past pro/street titles show received/lost week range.
11. Amateur awards use gold/silver/bronze medals.
12. International amateur fight offers appear only from MS/MSMK.
13. Tournament preview chance matches result chance.
14. Pro fight appears on the contract week.
