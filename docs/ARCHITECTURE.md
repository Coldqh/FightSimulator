# Architecture 2.0.0

`Data.countries`
- Contains final fighter counts:
  - `amateurCount`
  - `streetCount`
  - `proCount`
- Contains generated flag path:
  - `assets/flags/<countryId>.png`
- Contains large name pools and gym name pools.

`State.createRoster`
- Builds the roster from final country counts.
- Pro fighters: 1,800 total.
- Street fighters: 5,000 total.
- Amateur fighters: 20,000 total.

`Clubs.ensureClubs`
- Club count per country is `ceil(total fighters / 30)`.
- Clubs use country city/gym pools.

`Render`
- `countryLabel(countryId)` renders flag + country name.
- Profile career controls are compressed into 3 buttons:
  - Travel
  - Weight
  - Path
- Each button opens a modal with full process details.

`State.setPlayerCountry`
- Flight is paid.
- Gym is reset.
- Fatigue is added.
