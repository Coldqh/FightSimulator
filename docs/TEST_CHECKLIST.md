# Test Checklist 2.0.1

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
start index.html
```

Manual:
1. Ranking country filter is a dropdown, not a giant block of buttons.
2. Career country selection has flags.
3. Flags are larger than in 2.0.0.
4. Fighters from China have Chinese names/surnames.
5. Fighter names are normally simple first name + surname.
6. Pro contract rows show the opponent country.
7. Rankings react to records: winning fighters rise, losing fighters drop.
8. Flags load from `assets/flags/*.png`.
