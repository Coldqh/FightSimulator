# Test Checklist 1.8.2

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
start index.html
```

Manual:
1. Fight tab shows 10 compact opponents.
2. Old labels like старое название боя / старое название боя are gone.
3. Purse grows with opponent OVR.
4. Accepting a fight opens a separate browser window.
5. Hook and uppercut are disabled outside adjacent distance.
6. Counter cannot be used twice in a row.
7. Punch buttons show damage/chance/stamina.
8. Tournament fight has both Skip and Ring buttons.
9. Tournament fatigue applies only after tournament ends.
10. Rest closes the 100/100 fatigue modal after fatigue drops.
