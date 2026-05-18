# Architecture 2.0.2

`Data.countries`
- Added `localPoolId`.
- Small countries share local pools such as `small_europe`, `small_asia`, `small_latin_america`.

`Matchmaking`
- Low-level amateur and street opponents are pulled from the player's local country pool.
- KMS+ amateurs can still see international opponents.

`Amateur`
- Local tournaments use the current country/local pool.
- Continental tournaments use the player's home-country continent.
- World and Olympic-style tournaments use main national-team rosters.
- Continental tournament entry requires the player to be in national-team reserve/main.

`World`
- Added lightweight scheduled tournament notices/news.
- Added due-pro-fight modal.
- News are pushed into `state.world.news`.

`Render`
- Added News tab.
- Clubs country filter uses dropdown.
- Club/fight rosters show country flags.
- Amateur path shows home national team and a national-teams section.

`State`
- Player has `homeCountryId` and `currentCountryId`.
- Travel changes current country but keeps home national team.
