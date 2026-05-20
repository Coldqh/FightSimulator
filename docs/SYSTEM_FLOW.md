# System Flow 2.1.4

## Career start

1. Player chooses archetype.
2. `State.createCareer(...)` creates player and world state.
3. `World.bootstrapWorld(state)` creates:
   - clubs
   - titles
   - national teams
   - fight offers
   - pro contracts when relevant
4. Save is written through `Storage.save(state)`.

## Render

1. `State.repairState(state)` runs.
2. Fast path skips full roster repair if the same version/week was already repaired.
3. Normal offers are refreshed only when missing.
4. `Render.dashboard(state)` draws UI.

## Weekly tick

`World.advanceWeek(state, action)`:

1. Increase week.
2. Invalidate ranking cache.
3. Apply expenses/rest/recovery.
4. Ensure clubs.
5. Handle retirements/new fighters.
6. Run NPC training.
7. Run NPC fights.
8. Run transitions.
9. Run club moves.
10. Run international moves.
11. Run coach life.
12. Build national teams.
13. Update titles.
14. Simulate stories.
15. Refresh player offers.
16. Build pro contracts.
17. Check debt.
18. Push valid news.
19. Handle tournament and pro fight notifications.

## Fight result

Player fight:
1. Apply record changes.
2. Update track records.
3. Update derived ratings.
4. Update club record.
5. Invalidate ranking cache.
6. Apply economy/fatigue.
7. Update titles when needed.

NPC fight:
1. Resolve winner/draw.
2. Update records.
3. Cap career log to recent entries.
4. Update derived ratings.
5. Update club record.
6. Invalidate ranking cache.

## Migration news

When an NPC changes country:
- if a foreign fighter arrives in player's current country: news
- if player's compatriot leaves to another country: news

Text stays short and factual.
