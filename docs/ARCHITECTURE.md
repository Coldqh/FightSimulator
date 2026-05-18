# Architecture 2.0.3

`Data.amateurCompetitions`
- `city`, `oblast`, `region` now use scheduled calendar values instead of `any`.

`Amateur`
- `scheduleText` and `isScheduledNow` now handle lower tournament schedules.
- Tournament brackets support preliminary rounds:
  - non-power-of-two participant counts are reduced to the next lower power of two after the first round.
  - byes are represented internally as empty pair slots.
- `tournamentRoundsForSize` emits "Предварительный раунд" before the normal 64/32/16 ladder when needed.

`World`
- News are filtered to strict allowed categories: club, team, tournament, medal, champion.
- Contract signing text uses full date through `State.dateParts`.
- Due pro fight opens `proContractPreview`.

`Render`
- Training tab label is now "Характеристики".
- Team cards use the same visual language as club cards.
- Team selector uses dropdown + buttons.
- Pro contract due preview matches normal fight preview but has no cancel button.
- Rankings show fighter country for amateur/street/pro.
