# Technical Audit 2.1.x

## Fixed / improved

### Ranking
Before:
- repeated full roster filtering/sorting across render, titles and player rank checks

Now:
- cache by week/version/filter
- explicit invalidation
- no cache in save

### Save stability
Before:
- new fields could rely too heavily on scattered repair code
- transient fields risked leaking into saved JSON

Now:
- schema version
- central world shape repair
- transient save cleaning
- migration report

### Repair cost
Before:
- render could repair every fighter every render

Now:
- repair is stamped by version/week
- same-week re-render returns fast

### Titles
Before:
- `updateTitles` called `State.ranking` for every title

Now:
- one-pass title candidate map
- champion changes still happen
- relevant champion changes can enter news

### News
Before:
- news categories were too narrow for migration events

Now:
- migration category added
- migration text is short and factual
- no long generic descriptions

## Still worth profiling next

- `Matchmaking.buildPlayerOffers`
- `Render.dashboard` large modal/list sections
- `Amateur.availableCompetitions`
- long save JSON size after 5+ in-game years
- exact title-change history size
