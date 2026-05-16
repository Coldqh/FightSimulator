# World QA Checklist

## Youth Pipeline
- Start a new career and confirm the player begins at 16.
- Simulate 1 year and check that junior fighters age into adult entry cleanly.
- Simulate 4 years and check that new 14-17 year old fighters continue appearing by country.
- Confirm junior fighters can move into amateur organizations instead of stalling forever.

## Rank Progression
- Run a 4 year world batch and inspect several amateur fighters from different countries.
- Check that ranks move up over time and do not stay frozen at `junior_novice`.
- Confirm high ranks appear rarely and are tied to strong results.
- Run world validation and confirm there are no impossible age/rank pairs.

## Team Selection
- Open a country team profile in debug.
- Confirm active roster and reserve roster are populated.
- Force a selection window and verify the team profile updates.
- Force a qualifier tournament and confirm a national team trials event becomes available in season data.

## Rotation Logic
- Run 1 year and 4 year world batches.
- Check how many fighters enter national teams.
- Check how many rotations happen in active and reserve slots.
- Confirm fighters can drop from teams because of age, injury or bad results.
- Confirm some team members leave for pro and some dropped fighters fall to street.

## Amateur Age-Out
- Simulate to age 29+ for multiple amateur fighters.
- Confirm elite amateur path does not stay clogged by overage fighters forever.
- Run world validation and ensure no active elite team members remain in amateur after 28 without being flagged.

## Titles And Champions
- Run an 8 year world batch.
- Check world story/media for new champions of countries, continents and world championships.
- Check pro title history for champion changes in WBC, WBO, WBA and IBF.
- Confirm title histories keep living without player involvement.

## Encounter Memory
- Use a long batch and inspect known fighters with repeat meetings.
- Confirm repeated rivals keep shared history across tracks.
- Confirm former teammates can reappear later in pro or street.
- Check that encounter memory is still valid after save/load.

## Validation Sweep
- Run `Проверить мир` in debug.
- Review:
  - dangling IDs
  - invalid roster membership
  - broken team slots
  - impossible age/rank combinations
  - invalid transition history
- Fix any hard errors before content changes are merged.
