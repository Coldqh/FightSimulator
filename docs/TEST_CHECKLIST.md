# Test Checklist 1.8.1

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
start index.html
```

Manual checks:

1. Accept a fight: a separate ring window opens.
2. There is no exit button inside the active fight.
3. Ring is 5×5.
4. Player and opponent are circles on the ring.
5. Movement buttons move the player.
6. Straight head/body work from distance 1–2.
7. Hook and uppercut work only close.
8. Block and counter buttons work.
9. HP and stamina change during the fight.
10. Knockdown starts a count to 10.
11. Skip fight resolves by winChance.
12. Fatigue 100 allows only rest.
13. Negative balance starts a 3-month debt timer.
