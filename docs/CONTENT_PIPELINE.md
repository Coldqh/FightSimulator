# Content Pipeline

## New Schools And Centers
- Add new amateur organization templates in [amateur_ecosystem_data.js](/C:/Fight%20Simulator/src/content/amateur_ecosystem_data.js).
- Keep stable string IDs.
- Define country, city, org type, age window, rank gates, training focus and reputation.
- If the organization should feed a gym, keep the gym link stable.

## National Teams
- National teams are created per country by the amateur ecosystem layer.
- To add a new country team, first add the country itself and its amateur organization templates.
- Keep coach IDs, selection rules, roster slots and reserve slots stable.
- Selection logic depends on season ranking, age, rank and results, so content changes should keep those fields consistent.

## Tournaments
- Add or change templates in [amateur_season_data.js](/C:/Fight%20Simulator/src/content/amateur_season_data.js).
- Keep `tournamentTypeId`, `scope`, `eligibilityRules`, `rewards` and `advancement` filled.
- Country-scoped tournaments should keep country-safe labels and registration windows.
- If a tournament feeds a team or larger stage, always set `nextTournamentTypeId`.

## Fighters
- Seed roster lives in:
  - [street_seed_roster.js](/C:/Fight%20Simulator/data/roster/street_seed_roster.js)
  - [amateur_seed_roster.js](/C:/Fight%20Simulator/data/roster/amateur_seed_roster.js)
  - [pro_seed_roster.js](/C:/Fight%20Simulator/data/roster/pro_seed_roster.js)
- Every fighter must have a stable `id`.
- Keep name, country, age, track, style, base attributes and progression profile filled.
- Reuse seed roster only for stable starting world fighters. New generations are created by world sim.

## Gyms And Trainers
- Permanent facilities live in [world_facility_data.js](/C:/Fight%20Simulator/src/content/world_facility_data.js).
- Keep stable IDs for gym templates and trainer templates.
- Fill:
  - gym type
  - country
  - city source
  - cost
  - reputation
  - training bonuses
  - allowed tracks
- Trainer data should include:
  - trainer type
  - salary
  - preferred styles
  - specialization
  - linked gym slot

## Federations And Pro Bodies
- Amateur federation-side logic comes from the amateur ecosystem and amateur season data.
- Pro sanctioning bodies live in [pro_title_data.js](/C:/Fight%20Simulator/src/content/pro_title_data.js).
- Keep organization IDs stable for WBC, WBO, WBA and IBF.
- Ranking rules and prestige should be adjusted in data, not in UI code.

## Street Scenes
- Street content lives in [street_career_data.js](/C:/Fight%20Simulator/src/content/street_career_data.js).
- Districts, organizers, venue labels, ladder stages and street reputation tags should stay data-driven.
- If adding a new scene, make sure its IDs can survive across saves and repeat encounters.

## QA Before Shipping Content
- Run the debug world validation.
- Run 1 year and 4 year world batches.
- Check team rotation, titles, transitions and encounter memory.
- Load an old save and confirm no new content breaks migration.
