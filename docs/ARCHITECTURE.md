# Architecture 1.9.4

Start flow:
- `Data.careerArchetypes` defines career starts.
- `State.createCareer` builds player from selected archetype.

Professional path:
- `World.buildProContracts` creates contract offers.
- `World.acceptProContract` stores scheduled fight on player.
- `Fight.startProContractFight` opens the scheduled fight.
- `renderProTab` displays promoter, contracts, title opportunities and contract history.

Cleanup:
- Result modal now separates summary/statistics/action log.
- Favorites remain in their own tab.
