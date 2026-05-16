# Test Checklist 1.0

## Install

```powershell
cd C:\FightSimulator_GitHub
Expand-Archive -Path C:\Users\%USERNAME%\Downloads\fight-simulator-vertical-slice-overlay-1.0.0.zip -DestinationPath C:\FightSimulator_GitHub -Force
```

## Smoke

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
```

## Manual

- Create career.
- Open My Club.
- Open Clubs.
- Move to another club.
- Open Titles.
- If eligible, challenge champion.
- Preview normal fight.
- Accept fight.
- See round log.
- Advance 10 weeks.
- Check Stories.
- Check Ranking filters.
