# Technical Audit 2.2.0

## Touched systems

- `State`
- `World`
- `Fight`
- `Amateur`
- `Matchmaking`
- `Titles`
- `Render`
- `App`

## Main risks handled

### News profile links

Uses metadata IDs instead of parsing names from text.
This keeps text short and avoids fragile string matching.

### Tournament chance mismatch

Tournament preview now uses the same `Fight.estimateWinChance(...)` as resolution.

### NPC history

Player fights are written into opponent career logs.

### Title history

Old champions receive `pastTitles` entries during title transfer.

### Performance

Autonomous tournaments use country/weight buckets.
Weekly benchmark stayed fast on 27k fighters.
