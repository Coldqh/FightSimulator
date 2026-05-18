# Test Checklist 1.9.7

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
start index.html
```

Manual:
1. Equal OVR pro fighters should not usually KO each other in round 1.
2. Fighter with Health 45 has 145 HP.
3. Fighter with Health 90 has 190 HP.
4. Damage at 100 power is about 1.75x damage at 0 power.
5. First knockdown is survivable around 80%.
6. Second/third/fourth knockdowns get much harder.
7. Top bar shows KO only inside record text, not as a separate duplicate pill.
