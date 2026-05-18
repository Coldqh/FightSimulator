# Architecture 2.0.1

`assets/flags`
- Contains PNG flags for every country in `Data.countries`.

`Data.countries`
- Each country has its own `firstNames` and `lastNames` pools.
- Big pools are kept at 200+ entries through real repeated name lists rather than fake initials.

`Utils.createName`
- Always returns simple `first + surname`.
- Removes leftover initial suffixes from older generated pools.

`Render`
- `countryDropdown` renders a compact flag dropdown.
- Ranking uses dropdown for country selection.
- Career start uses a custom flag dropdown and hidden country input.
- Pro contract rows show country flags.

`State.ranking`
- Ranking is driven mainly by record quality:
  wins, losses, KO count, win rate, activity, titles and awards.
- OVR is now a small tie-breaker instead of the main ranking driver.
