# Migration Plan: World Sim Foundation

## Why this migration exists

The current project already has:
- weekly life-sim flow
- fights
- people and relationships
- gyms and trainers
- contracts and fight offers
- styles and perks
- media and archive

But most of it still behaves like a run-local layer built around the player.

This migration introduces a world-sim foundation without deleting the current game model.

## What stays temporary for now

These systems still remain legacy-authoritative for gameplay:
- `player`
- `career`
- `world`
- `battle`
- `ui`
- `feed`
- runtime fields like `state.fighter`, `state.world`, `state.opponents`, `state.fight`

Why:
- current UI is still wired directly to them
- fight logic already depends on them
- mobile web and HTA compatibility matter more than deep refactor speed

## What becomes canonical over time

New sections introduced now:
- `playerState`
- `worldState`
- `rosterState`
- `organizationState`
- `competitionState`
- `narrativeState`

These are the long-term bridge toward a persistent world.

## Mapping from old to new

### Player runtime -> playerState / FighterEntity

Current source:
- `player.profile`
- `player.stats`
- `player.resources`
- `player.conditions`
- `player.record`

New target:
- `playerState`
- `rosterState.fightersById["fighter_player_main"]`

### Calendar -> WorldTimeline

Current source:
- `career.calendar`
- `career.week`
- `player.conditions.startingAge`

New target:
- `worldState.timeline`

### Gyms and trainers -> rosterState

Current source:
- `world.gymMembership`
- `world.trainerAssignment`
- `ContentLoader.listGymsByCountry(...)`
- `ContentLoader.listTrainerTypesByCountry(...)`

New target:
- `rosterState.gymsById`
- `rosterState.trainersById`
- `playerState.linkedGymId`
- `playerState.linkedTrainerId`

### Offers and future tournaments -> competitionState

Current source:
- `world.offers`

New target:
- `competitionState.competitionsById`
- `competitionState.activeCompetitionId`
- `competitionState.bracketsById`

### Media, biography, arcs, rivalries -> narrativeState

Current source:
- `player.biography`
- `world.relationshipArcs`
- `world.rivalries`
- `world.npcs`

New target:
- `narrativeState`

### Promotions and rankings -> organizationState

Current source:
- no full permanent source yet

New target:
- scaffold `OrganizationEntity`
- scaffold `RankingTable`
- pro sanctioning bodies and title histories now also live here

## Save migration rules

### Old saves

Old saves may contain:
- legacy runtime snapshot only
- normalized game state without world-sim sections

Migration rule:
- keep old fields
- normalize them as before
- build new sections on top through adapters

### New saves

New saves now contain:
- all old normalized sections
- all new world-sim sections

This keeps backward compatibility while making future stages cheaper.

## SAVE_VERSION policy

This stage bumps `SAVE_VERSION`.

Rule:
- any future change to canonical state or entity schema must bump `SAVE_VERSION`
- any future schema change must extend `migrateSave(...)`

## Temporary contradictions and how they are handled

### Legacy world vs canonical roster

Current contradiction:
- old runtime treats opponents as local snapshots
- new architecture treats fighters as entities

Adapter:
- roster entities are rebuilt from current offers, rivals, and opponent lists
- Stage 2 upgrades this adapter so seed roster fighters become the default source, while snapshots stay as UI compatibility data

### Trainer type vs trainer person

Current contradiction:
- gameplay still stores trainer selection close to trainer type
- future world needs persistent trainer persons

Adapter:
- `TrainerEntity` exists now as a stable world entity built from current trainer data
- later it can be replaced or enriched without breaking old saves

### Street / amateur / pro tracks

Current contradiction:
- gameplay does not yet really switch tracks
- architecture must already support it

Adapter:
- `CareerTrackState` exists now
- `street` is active by default
- `amateur` and `pro` are scaffolded but not yet authoritative

## Next migration direction

The next safe steps after this stage are:
1. persistent world roster generation
2. real organizations and local circuits
3. track switching rules
4. ranking updates
5. brackets and tournaments
6. permanent fighter histories beyond the player run

## Stage 2 Migration Notes

What becomes more permanent now:
- world opponents move into seed roster files by track
- offers and rivalries start linking through `fighterId`
- migrated old saves receive compatible persistent fighter records when needed

What still stays temporary:
- `offer.opponent` snapshots
- `lastOpponentSnapshot` on rivalries
- fallback random opponent creation for future unknown fighters

Why this adapter remains:
- the live UI and battle flow still expect direct snapshot objects
- keeping both layers avoids rewriting combat and mobile screens

## Stage 3 Migration Notes

What changes now:
- new careers start at 16 instead of 21
- a junior amateur layer is added on top of the same weekly loop
- amateur rank progression becomes a permanent progression channel

What must stay compatible:
- old adult saves must not suddenly become juniors
- current UI still reads fighter runtime fields directly
- contracts, work, travel, housing, gyms, trainers, styles, perks, media and arcs must continue to work

Adapter rules introduced here:
- old saves without explicit `startingAge` are treated as adult saves and kept at 21+
- junior-only support uses `player.life.livingMode`, while adult saves keep using the housing layer
- runtime fighter fields now expose both:
  - `housingId` for the old adult UI
  - `livingMode` for junior support flow

## Stage 11 Migration Notes

What changes now:
- pro organizations become persistent world entities
- each body keeps its own champion, contender list, ranking table and title history
- player and NPC pro fighters now have a shared internal `proValue`

What stays compatible:
- current pro offers still flow through legacy offer snapshots
- current fight UI still consumes offer snapshots, not raw `OrganizationEntity`
- old saves without sanctioning bodies are rebuilt into the new title layer on load

## Stage 9 Migration Notes

What changes now:
- gyms and trainers stop behaving like disposable country-local picks
- `GymEntity` and `TrainerEntity` become the persistent source of truth in `rosterState`
- player and NPC fighters keep stable gym/trainer links across weeks and travel

What stays compatible:
- legacy `world.gymMembership` and `world.trainerAssignment` remain in the save
- old UI functions like `joinGym()` and `hireTrainer()` still exist
- HTA/mobile screens still read legacy-friendly snapshots

Adapter rules introduced here:
- country-generated gym/trainer lists are kept only as seed data and fallback compatibility
- runtime actions are redirected to persistent world entities through `WorldFacilityEngine`
- travel no longer auto-clears gym and trainer; the old fields are just resynced from the persistent layer

## Stage 7 Migration Notes

What changes now:
- street stops being only a loose fallback and becomes a full persistent track
- player state gets a dedicated `player.street` subsection
- street organizations, street ladder and street-specific offers become canonical data

What must stay compatible:
- the current fight screen still expects legacy offer snapshots
- `home`, `career`, `fightSelect` and other panels still read old runtime fields
- old saves without street data must continue to open normally

Adapter rules introduced here:
- old saves get normalized `player.street`
- legacy fight offers keep using `offer.opponent`, but street offers now also carry canonical street fields
- runtime UI uses helper functions to switch tracks, while canonical truth lives in `StreetCareerEngine`
- amateur rank data lives in `player.amateur`, but legacy runtime still gets `fighter.amateur`

Temporary contradictions:
- the adult housing system remains the long-term layer, but juniors temporarily route through support living modes
- the same fight-offer UI now serves both adult and amateur offers, so offer snapshots keep compatibility fields while the new logic adds `trackId`, `minRankId`, and rank-point metadata

Why this is acceptable:
- it introduces the junior path without resetting the existing adult sandbox
- it keeps old careers playable
- it prepares the project for later national team and tournament layers without replacing the combat loop

## Stage 4 Migration Notes

What changes now:
- amateur organizations become persistent country entities
- national teams become persistent per-country team entities
- amateur fighters now carry organization/team-related fields
- competition state gains amateur infrastructure hooks for future tournament systems

What was temporary before:
- amateur rank existed without a real institutional layer around it
- gyms and trainers existed mostly as direct player-facing choices
- national team access was implied by rank logic but not represented as world state

What becomes more permanent now:
- `organizationState.teamIds`
- `organizationState.teamsById`
- `competitionState.amateurHooks`
- `player.amateur.currentOrganizationId`
- `player.amateur.nationalTeamStatus`
- `player.amateur.teamId`
- persistent fighter amateur organization/team fields

What must stay compatible:
- old adult saves still load as adult careers
- legacy runtime still receives `fighter.amateur`
- legacy career panels still work
- current fight offers, contracts, people and media systems are not removed

Adapter rules introduced here:
- gym choice still uses the old career gym screen, but now resolves to an amateur organization behind the scenes
- trainer choice still uses the old career trainer screen, but now also carries amateur trainer role data
- national teams live in canonical state, while the runtime UI reads them through helper adapters

Temporary contradictions:
- organization membership and gym membership are still partially coupled
- selection and federation hooks exist before full tournament registration UI exists
- team rotation is already persistent, but continental/world/Olympic competitions are still future work

Why this is acceptable:
- it gives the amateur ranks a real ecosystem without rebuilding the weekly loop
- it keeps the current screens intact
- it prepares clean hooks for the next stage: amateur tournaments and national team competitions

## Stage 5 Migration Notes

What changes now:
- amateur season becomes a persistent state layer
- tournaments and brackets become real entities instead of one-off ideas
- seasonal ranking and team selection now update from actual results
- amateur career starts getting a real ladder: local -> regional -> national -> trials -> continental -> world -> olympics

What becomes more permanent now:
- `competitionState.amateurSeason`
- `tournamentIds / tournamentsById`
- `bracketIds / bracketsById`
- `fighterSeasonStatsById`
- `nationalRankingByCountry`
- tournament result history and medal history

What must stay compatible:
- fight UI still runs on offer snapshots
- weekly loop still advances the same way
- old saves still load even if they never had seasonal data
- adult careers still remain playable

Adapter rules introduced here:
- tournament bouts are exposed as normal fight offers with extra fields like `tournamentId`, `matchId`, `bracketId`
- season notices are pushed back into legacy `log`, biography and media helpers
- old amateur fallback offers stay as compatibility fallback when no active tournament bout exists

Temporary contradictions:
- the season is canonical in state, but part of the UI still reaches it through helper functions on top of legacy panels
- some team updates happen both through amateur ecosystem helpers and season selection flow, with the season layer taking the latest result

Why this is acceptable:
- it adds real amateur goals without touching the tactical fight core
- it preserves HTA and mobile compatibility
- it creates a generic tournament engine that later stages can reuse for deeper national and international competition

## Stage 6 Migration Notes

What changes now:
- the world gains a persistent weekly career-simulation pass
- NPC fighters now age, drift, change organizations and move between amateur / pro / street tracks without direct player involvement
- national teams keep rotating based on season results, age, form and weekly world simulation
- encounter memory and world history hooks now persist beyond one-off tournament outcomes
- newgens begin entering the world over time instead of the roster staying permanently closed

What becomes more permanent now:
- `worldState.worldCareer`
- fighter lifecycle fields such as `goalProfileId`, `worldHistoryHooks`, `encounterHooks`
- team/track status snapshots used to detect transitions
- newgen counters and world notices

What must stay compatible:
- old fight offers still work through opponent snapshots
- old saves still load even if they never had world career data
- legacy UI still reads logs, media and biography through existing helpers
- current battle core and weekly loop remain intact

Adapter rules introduced here:
- canonical world simulation runs inside `WorldCareerSimEngine`
- the legacy weekly loop triggers that pass during `runWorldTick()`
- world notices are translated back into legacy log / biography / media systems
- persistent fighters keep both canonical lifecycle fields and snapshot compatibility fields for UI and offers

Temporary contradictions:
- the world simulation is now canonical for long-term NPC motion, but some offer and fight flows still consume snapshots
- team rotation can be affected by both season results and the weekly world pass, with the later pass resolving the final visible state
- player encounter memory exists in canonical world state, while some older narrative systems still rely on legacy relationship/event hooks

Why this is acceptable:
- it moves the world toward a persistent sports ecosystem without replacing the existing game loop
- it keeps current screens stable while the canonical model becomes richer
- it creates the foundation needed for later permanent amateur/pro/street transitions and repeated cross-era encounters

## Stage 8 Migration Notes

What changes now:
- a first real professional loop is added on top of the existing career model
- `amateur -> pro` and `street -> pro` transitions become canonical, not just narrative intent
- promoters, managers and pro offers become stable entities with IDs
- the old fight screen starts serving professional offers through adapter snapshots

What becomes more permanent now:
- `player.pro`
- `organizationState.promoterIds / promotersById`
- `organizationState.managerIds / managersById`
- `competitionState.proOfferIds / proOffersById`

What must stay compatible:
- the old contract system remains playable and is not deleted
- the fight UI still expects `offer.opponent` snapshots
- old saves without pro data still open normally
- HTA and mobile web continue to share the same runtime flow

Adapter rules introduced here:
- `switchPlayerCareerTrack("pro", ...)` now routes through `ProCareerEngine.enterProTrack(...)`
- pro offers are generated as normal fight offers for the existing UI, but they also write canonical `ProOfferEntity` records
- pro fight results still use `applyFightResults()`, which now delegates pro-specific progression to `ProCareerEngine.applyFightResult(...)`
- legacy promoter NPC relations stay available through `promoterNpcId`, while canonical offer storage uses stable promoter/manager entity IDs

Temporary contradictions:
- the old adult contract layer and the new pro promoter/manager layer both exist at once
- the fight UI still renders snapshot cards instead of reading `ProOfferEntity` directly
- some pro reputation context is still mirrored between biography flags and `player.pro.proReputationTags`

Why this is acceptable:
- it makes the professional path playable without replacing the current economy and screens
- it keeps save compatibility and old helper flows intact
- it prepares the project for later ranking fights, eliminators and title systems without a hard reset of the runtime

## Stage 12 Migration Notes

What changes now:
- one combat engine is split into `street / amateur / pro` formats through a data-driven ruleset layer
- fight offers and active fights now remember which format they use
- scoring, wear, KO feel and post-fight consequences can diverge by career track without forking the whole combat code

What must stay compatible:
- the same fight screen still runs all tracks
- old offers and old in-progress fights still open through normalization
- legacy fight snapshots remain valid

Adapter rules introduced here:
- ruleset data lives outside the fight engine
- old offer cards receive added ruleset fields, but keep the same snapshot shape
- active fights normalize missing ruleset state at runtime instead of requiring a destructive save rewrite

## Stage 13 Migration Notes

What changes now:
- track changes become a canonical system instead of a few direct runtime switches
- player and NPC careers can evaluate `street / amateur / pro` transitions through shared definitions
- transition notices become part of the narrative layer instead of staying only as button gating

What becomes more permanent now:
- `narrativeState.availableTransitionsById`
- `narrativeState.transitionEventsById`
- `narrativeState.transitionHistory`
- `narrativeState.transitionEventStateById`

What must stay compatible:
- old buttons like `moveStreetTrackToAmateur()` and `moveAmateurTrackToPro()` still work
- current panels stay in place and still open through the same screen ids
- the existing track engines remain the low-level executors for actual state changes

Adapter rules introduced here:
- `CareerTransitionEngine` decides whether a path is open
- old runtime wrappers forward into that engine
- `StreetCareerEngine` and `ProCareerEngine` still apply the actual track switch and pro onboarding
- world simulation may ask `CareerTransitionEngine` first, then fall back to older heuristics

Temporary contradictions:
- some legacy checks still exist in `StreetCareerEngine` and `ProCareerEngine`, so the new system consults them instead of deleting them
- transition events are still surfaced through log/media/biography adapters rather than a wholly separate cinematic layer

Why this is acceptable:
- it avoids breaking current screens and saves
- it makes nonlinear careers systemic before deeper content is added
- it gives later stages one place to extend transitions without scattering more one-off checks through the runtime

## Stage 14 Migration Notes

What changes now:
- repeated meetings between fighters become a permanent world layer
- fight offers can now be weighted by shared history instead of being purely local snapshots
- events can react to known opponents and shared past

What was temporary before:
- rivalry memory mostly lived in player-facing arrays and snapshots
- sparring memory was local to preparation systems
- shared gym or shared team past was not stored as a stable pair history

What is canonical now:
- pair history lives in:
  - `worldState.worldCareer.encounterHistoryIds`
  - `worldState.worldCareer.encounterHistoriesById`
  - `worldState.worldCareer.encounterPairIndex`

Adapter rules introduced here:
- old rivalries still stay in `world.rivalries`
- old sparring memory still stays in `player.preparation.partnerHistoryByFighterId`
- Stage 14 migrates those into `EncounterHistory` instead of deleting them
- the live UI still consumes annotated offer snapshots, not raw encounter entities

Backward compatibility:
- old saves without encounter history get empty encounter sections
- old saves with rivalries or sparring memory get compatible migrated pair records
- known-opponent UI remains optional, so missing history does not break fight selection

## Stage 15 Migration Notes

What changes now:
- world-scale media becomes a derived narrative layer, not only a player feed
- the archive screen now combines:
  - saved player runs from localStorage
  - current player biography
  - NPC hall of fame
  - team history
  - title history
  - tournament history
  - street scene history

What becomes more permanent now:
- `narrativeState.worldMediaById`
- `narrativeState.worldLegendsById`
- `narrativeState.teamHistoryByCountryId`
- `narrativeState.titleHistoryByOrganizationId`
- `narrativeState.tournamentHistoryById`
- `narrativeState.streetHistoryByCountryId`

What must stay compatible:
- the current `careerLog` screen still exists
- the current `archive` screen still exists
- archived player runs are still stored separately under the legacy archive key
- old saves that know nothing about world story still load and simply rebuild the new read model on refresh

Adapter rules introduced here:
- player media stays in the existing biography/media feed
- world media is rebuilt from tournament, title and track history instead of replacing those systems
- the archive screen reads both persistent run archive data and live world history data at once

Why this is acceptable:
- it avoids a destructive rewrite of the archive system
- it keeps HTA/mobile compatibility
- it gives later stages one place to expand world history without scattering more UI-specific storage
