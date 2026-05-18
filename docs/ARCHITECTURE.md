# Architecture 2.0.4

## Tournament dates

`Amateur.scheduleTextForState(state, comp)` now returns the next actual date:
- full calendar date
- weeks left
- no rule text like "каждый месяц"

## Tournament availability

`World.scheduleTournamentNotice(state)` now checks currently available competitions at the start of the week.
It opens:

```js
{ type: "tournamentAvailable", competitionId, label, scheduleText }
```

The modal uses existing `data-amateur-competition` flow, so it starts the tournament through the same safe path.

## Foreign residents

`State.createHostedFighter(...)` creates street/amateur fighters with:
- `homeCountryId`
- `originCountryId`
- `currentCountryId`
- `isForeignResident`

Filtering still uses `countryId` as current country.
Display uses `fighterCountryLabel(fighter)` so foreign residents can show origin → current country.

## Optimization

Changed without removing simulation systems:
- National teams: replaced 102 × 6 repeated full rankings with one single-pass bucket build.
- Club assignment: replaced repeated country-by-country full roster scans with one-pass country buckets.
- Club assignment is skipped when club rosters are already valid.
- International gym moves only rebuild club rosters if a move actually happened.
- NPC career logs are capped to the latest 8 entries to stop thousands of array shifts per week.
- Pro contract opponent selection now uses weight-class buckets and nearest-neighbor lookup instead of repeated full sorting.
- Removed duplicate title update from `simulateNpcFights`; title update still runs in the main weekly pipeline.
