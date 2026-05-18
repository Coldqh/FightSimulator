# Architecture 1.9.5

`renderTabs` filters tabs by player path:
- amateur: no Pro tab
- pro: no Fights tab and no Amateur Path tab
- street: no Pro tab and no Amateur Path tab

Professional fights:
- `Matchmaking.buildPlayerOffers` returns no normal fight offers for pro.
- `World.buildProContracts` is the only source of pro fight offers.
- Champions receive only top-3 contender contracts.
- Title challenge eligibility is top-3 only.

Balance:
- `fight.js` doubles punch stamina costs again.
- Pro/street damage multipliers are halved.
- `maxStamina = 100 + endurance * 0.5`.
- Pro stand-up chance after knockdown is lower and gets worse with each knockdown.

World:
- National teams store `coach`.
- Country continent IDs/labels are more specific.
