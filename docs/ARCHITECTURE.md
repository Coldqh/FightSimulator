# Architecture 1.9.6

`world.js`
- `proContractWaitWeeks` controls pro fight scheduling:
  - OVR 90-ish: 3-4 weeks
  - strong contenders: 5-8 weeks
  - top fighters: 8-9 weeks
  - champions: 10-12 weeks
- Pro contract sorting considers OVR and record similarity.

`fight.js`
- Track damage multipliers increased.
- Hit chance uses attack growth and defender evasion growth.
- New rounds reset ring positions.

`matchmaking.js`
- Fight offers sort candidates by OVR and record similarity.

`state.js`
- Rankings sort by score plus record quality.

`render.js`
- National team coach opens as a clickable profile.
