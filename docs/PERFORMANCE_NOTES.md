# Performance Notes

## Main bottlenecks found

1. `render()` was calling `saveGameState()` on every repaint.
2. Heavy panels were forcing repeated `syncGameStateFromRuntime()` / `ensurePersistentGameState(false)` calls during the same render.
3. `refreshWorldState()` was doing multiple canonical-to-runtime round trips in one weekly refresh.
4. `career`, `careerGym`, `careerTrainer`, `careerSeason`, `careerTeam`, `careerProOrgs` were rebuilding expensive projections even when sections were collapsed.
5. Trainer selection UI was creating or resolving trainer NPC wrappers for every card during render.

## What was changed

- Added runtime profiling metrics:
  - `weekAdvanceMs`
  - `weekTickMs`
  - `gymPanelOpenMs`
  - `rankingsOpenMs`
  - `gymPanelBuildMs`
  - `trainerPanelBuildMs`
  - `seasonPanelBuildMs`
  - `teamPanelBuildMs`
  - `proOrgsPanelBuildMs`
  - `careerPanelBuildMs`
  - `renderGameMs`
  - `renderDebugMs`
- Replaced render-time autosave with deferred save scheduling.
- Added runtime memoization for heavy projections:
  - fighter lookup by id
  - fighters by track
  - fighters by country
  - fighters by gym
  - trainers by gym
  - gyms by country
  - trainers by country
  - season summary/options
  - pro summary
  - street summary
  - transition cards/events
  - World QA profiles
- Added lazy section rendering for the main `career` screen and season subsections.
- Reduced `refreshWorldState()` round trips so world notices are drained in one deterministic pass.
- Trainer selection cards now use persistent trainer names directly instead of resolving trainer NPC wrappers during every render.

## Practical profiling workflow

1. Enable debug mode.
2. Watch:
   - `Render`
   - `Week`
   - `Gym UI`
   - `Rankings`
3. Check `careerGym`, `careerTrainer`, `careerSeason`, `careerTeam`, `careerProOrgs`.
4. Advance several weeks in a row and compare `weekTickMs` vs `weekAdvanceMs`.

## Expected effect

- Tab switches should feel near-instant for normal panel sizes.
- `Зал` / `Тренер` should stop freezing because state sync now happens once and the panel no longer recreates trainer NPC wrappers for every option.
- Weekly advance should avoid repeated world data rebuilds and repeated save work inside render.

## Follow-up candidates

- If future content makes ranking/team lists much larger, add explicit paging/windowing for those panels.
- If world QA grows further, split its heaviest derived views into their own lazy subsections.
- If save payload grows a lot, add differential save scheduling rules for fight animation renders.
