# Architecture 2.1.4

## Technical core goals

2.1.x is focused on stability, maintainability and performance:
- reduce repeated heavy work
- protect saves from future patches
- cache rankings safely
- keep news short and useful
- document system flow before expanding gameplay

## Ranking cache

`State.ranking(...)` now uses:

```js
state._rankingCache
state._rankingVersion
State.invalidateCaches(state)
```

Cache key:
- week
- ranking version
- country
- track
- weight

Invalidation happens when:
- week changes
- fighter records change
- fighter moves country
- player changes country
- systems explicitly call `State.invalidateCaches(state)`

Transient cache fields are never saved.

## Save schema

`Data.saveSchemaVersion = 214`.

Storage now has:
- `cleanTransientFields(state)`
- `ensureWorldShape(state)`
- stricter fighter repair fields
- migration report support

Transient fields excluded from save:
- `_rankingCache`
- `_worldIndexes`
- `_lastRepairVersion`
- `_lastRepairWeek`
- `_fullRepairDone`
- `_migrationReport`

## Fast repair path

`State.repairState(state)` now stamps:
- `_fullRepairDone`
- `_lastRepairVersion`
- `_lastRepairWeek`

If the state was already repaired for the current version/week, render does not loop the whole roster again.

## Titles performance

`Titles.updateTitles(state)` no longer calls full rankings for every title.

Instead it builds title candidates in one pass:
- pro title key: `pro|world|weight`
- street title key: `street|country|`

This keeps champion logic alive while avoiding repeated full ranking scans.

## News pipeline

Allowed news categories:
- `club`
- `team`
- `tournament`
- `medal`
- `champion`
- `migration`

Migration news is intentionally short:
- `Иностранец приехал: Name · Origin → Country.`
- `Соотечественник уехал: Name · From → Country.`
