# World Sim Architecture

## Purpose

This stage does not replace the current game loop. It adds a stable architectural layer above the existing weekly life-sim, fight system, save format, HTA runtime, and mobile web runtime.

The main goal is to prepare the project for a persistent boxing world with:
- street track
- amateur track
- pro track
- persistent fighters, gyms, trainers, organizations, rankings, and competitions

Current gameplay still runs through legacy-compatible fields such as:
- `meta`
- `player`
- `career`
- `world`
- `battle`
- `ui`
- `feed`

The new world-sim sections are added in parallel and filled through adapters.

## Canonical Entities

### FighterEntity

Stable representation of a fighter in the world.

Current fields:
- `id`
- `name`
- `country`
- `age`
- `isPlayer`
- `status`
- `trackId`
- `stats`
- `record`
- `fame`
- `gymId`
- `trainerId`
- `styleId`
- `archetypeId`
- `lastUpdatedWeek`
- `tags`

Current source:
- player fighter is derived from `player + career + world`
- opponent fighters are derived from `world.opponents`, active offers, and rivalry snapshots

### GymEntity

Stable representation of a gym in the world.

Current fields:
- `id`
- `name`
- `country`
- `city`
- `gymType`
- `cost`
- `monthlyCost`
- `weeklyCost`
- `reputation`
- `trainingBonuses`
- `rosterIds`
- `coachIds`
- `trainerIds`
- `bonuses`
- `specialization`

Current source:
- seeded from `WORLD_FACILITY_DATA` through `ContentLoader`
- stored persistently in `rosterState.gymsById`
- linked to fighters and coaches through `rosterIds` / `coachIds`

### TrainerEntity

Stable representation of a trainer in the world.

Current fields:
- `id`
- `fullName`
- `name`
- `country`
- `city`
- `trainerType`
- `salary`
- `preferredStyles`
- `currentGymId`
- `boxerIds`
- `gymId`
- `monthlyFee`
- `weeklyFee`
- `reputation`
- `bonuses`
- `specialization`

Current source:
- seeded from `WORLD_FACILITY_DATA` through `ContentLoader`
- stored persistently in `rosterState.trainersById`
- linked to fighters and gyms over time

Note:
- the world now treats trainers as persistent facility-side entities
- relationship NPCs still exist as a separate social layer and are kept through adapters

### CompetitionEntity

Stable representation of a fight opportunity or tracked competition node.

Current fields:
- `id`
- `label`
- `type`
- `status`
- `organizationId`
- `trackId`
- `country`
- `city`
- `opponentFighterId`
- `weekStamp`
- `purse`
- `rematchOf`
- `tags`

Current source:
- derived from fight offers already shown in the UI

### OrganizationEntity

Stable representation of a league, local circuit, or promotion layer.

Current fields:
- `id`
- `name`
- `country`
- `city`
- `type`
- `trackId`
- `reputation`
- `tags`
- `rankingList`
- `championId`
- `contenderIds`
- `titleFightRules`
- `prestigeModifier`
- `titleHistory`
- `titleDefensesByChampionId`

Current source:
- scaffold organizations are created for local street circuits
- placeholder world organizations exist for amateur and pro tracks
- professional sanctioning bodies now also live here:
  - `WBC`
  - `WBO`
  - `WBA`
  - `IBF`

### RankingTable

Stable ranking container for a track or organization.

Current fields:
- `id`
- `trackId`
- `organizationId`
- `entries`
- `entryLimit`
- `updatedWeek`

Current source:
- scaffold ranking is populated minimally with the player

### TournamentBracket

Stable placeholder for future tournaments and elimination events.

Current fields:
- `id`
- `label`
- `organizationId`
- `trackId`
- `round`
- `status`
- `competitionIds`

Current source:
- scaffold only, no gameplay yet

### EncounterHistory

Stable pair history between any two fighters in the world.

Current fields:
- `id`
- `fighterAId`
- `fighterBId`
- `firstMetTrack`
- `firstMetWeek`
- `allFightIds`
- `sparringIds`
- `sharedGymIds`
- `sharedTeamIds`
- `rivalryLevel`
- `respectLevel`
- `lastSeenWeek`
- `trackIds`
- `tagIds`
- `timeline`

Current source:
- fight results
- sparring sessions
- shared gym membership
- shared national team or amateur team membership
- migrated legacy rivalry and sparring memory data

Current storage:
- `worldState.worldCareer.encounterHistoryIds`
- `worldState.worldCareer.encounterHistoriesById`
- `worldState.worldCareer.encounterPairIndex`

Current usage:
- offer weighting for known opponents
- fight intro text and shared past indicators
- context event conditions
- biography and media hooks for repeat crossings

Note:
- this is a world layer, not a player-only layer
- the same structure is used for player-NPC and NPC-NPC histories

## Amateur Season Layer

Stage 5 adds a generic amateur season layer on top of the existing amateur pathway.

New canonical competition subsection:
- `competitionState.amateurSeason`

Core responsibilities:
- store current season year and week
- build tournament entities from data templates
- maintain tournament brackets
- track seasonal points and medals
- maintain national rankings by country
- drive selection flow into national teams
- expose player-facing tournament registration and active tournament offers

## Cross-Track Memory Layer

Stage 14 adds a persistent cross-track memory layer on top of the fighter registry and world simulation.

Core responsibilities:
- remember when two fighters first met
- track repeated meetings across `street / amateur / pro`
- remember shared gyms, shared teams, sparring and fight history
- derive long-tail crossover tags for events, media and offers
- expose history summaries to the current fight selection and fight intro UI

Current derived crossover tags:
- `old_street_rival_returned`
- `former_teammate`
- `teammate_became_rival`
- `lost_team_spot_to_this_boxer`
- `olympic_cycle_rival`
- `pro_rankings_reunion`
- `fallen_pro_on_streets`
- `old_sparring_partner_now_enemy`

Current integration points:
- `EncounterHistoryEngine.noteFightEncounter(...)`
- `EncounterHistoryEngine.noteSparringEncounter(...)`
- `EncounterHistoryEngine.syncWorldLinks(...)`
- `EventEngine.buildContext(...)`
- fight offer annotation and sorting in the legacy runtime adapter

### AmateurSeasonState

Current fields:
- `id`
- `currentSeasonYear`
- `currentSeasonWeek`
- `lastProcessedWeek`
- `weeksPerSeason`
- `registrationWindows`
- `localCircuit`
- `regionalCircuit`
- `nationalCircuit`
- `nationalTeamTrials`
- `continentalCircuit`
- `worldChampionshipCycle`
- `olympicCycle`
- `tournamentIds`
- `tournamentsById`
- `bracketIds`
- `bracketsById`
- `playerRegistrationIds`
- `playerInvitationIds`
- `playerTournamentId`
- `selectedTournamentId`
- `activeTournamentId`
- `fighterSeasonStatsById`
- `nationalRankingByCountry`
- `resultHistory`
- `pendingNotices`
- `teamSelectionHistory`

### TournamentEntity

Tournament nodes are now generic competition entities with amateur-specific fields:
- `id`
- `templateId`
- `tournamentTypeId`
- `label`
- `status`
- `countryId`
- `hostOrganizationId`
- `registrationStartWeek`
- `registrationEndWeek`
- `startWeek`
- `currentRoundIndex`
- `participantIds`
- `invitedIds`
- `eligibilityRules`
- `rewards`
- `advancement`
- `medals`
- `resultLog`
- `selectionImpactText`

### Selection Flow

Selection is now seasonal instead of one-shot:
- NPC fighters accumulate seasonal results
- national ranking updates every processed week
- national teams rebuild active/reserve/candidate lists from ranking and eligibility
- player status can change between `none`, `candidate`, `reserve`, `active`, `dropped`, `alumni`

### Legacy Adapter

The existing fight screen still expects fight offers with opponent snapshots.

Adapter used:
- season engine creates tournament offers for the player
- those offers still expose `offer.opponent`
- the rest of the tactical fight system remains unchanged

### CareerTrackState

Track progression wrapper for:
- `street`
- `amateur`
- `pro`

Current fields:
- `id`
- `currentTrackId`
- `tracks`
- `switches`

Each track entry stores:
- unlocked flag
- active flag
- entered week
- rating
- rank
- wins/losses/draws
- organization ids
- notes

Current source:
- scaffold based on the current player career
- street is active by default

### WorldTimeline

Stable world clock for future persistent simulation.

Current fields:
- `id`
- `currentWeek`
- `totalWeeks`
- `currentMonthIndex`
- `currentYear`
- `weekOfMonth`
- `playerAgeYears`
- `playerAgeMonths`

Current source:
- derived from the existing `career.calendar` and `startingAge`

## New Top-Level State Sections

The canonical world-sim layer now adds:

- `playerState`
- `worldState`
- `rosterState`
- `organizationState`
- `competitionState`
- `narrativeState`

These sections exist in save data and are rebuilt through adapters.

### playerState

Purpose:
- track the player as a world participant instead of only a UI runtime fighter

Current fields:
- `id`
- `playerId`
- `fighterEntityId`
- `currentTrackId`
- `careerTrack`
- `knownNpcIds`
- `linkedGymId`
- `linkedTrainerId`

### worldState

Purpose:
- hold long-lived world clock and global routing context

Current fields:
- `id`
- `timeline`
- `currentCountry`
- `currentCity`
- `streetSeedId`
- `amateurSeedId`
- `proSeedId`
- `worldFlags`
- `recentCompetitionIds`

### rosterState

Purpose:
- store stable world entities that can later persist independently of UI offers

Current fields:
- `id`
- `fighterIds`
- `fightersById`
- `gymIds`
- `gymsById`
- `trainerIds`
- `trainersById`

### organizationState

Purpose:
- store promotions, leagues, and ranking containers

Current fields:
- `id`
- `organizationIds`
- `organizationsById`
- `rankingTableIds`
- `rankingTablesById`

### competitionState

Purpose:
- store tracked fight offers and future tournaments

Current fields:
- `id`
- `competitionIds`
- `competitionsById`
- `bracketIds`
- `bracketsById`
- `activeCompetitionId`

### narrativeState

Purpose:
- connect biography, arcs, rivalries, and media to the future persistent world

Current fields:
- `id`
- `biographyFlags`
- `activeArcIds`
- `rivalryIds`
- `knownNpcIds`
- `mediaCount`
- `historyCount`

## Adapters

The current UI and gameplay still rely on old sections. The new architecture therefore uses adapters instead of replacement.

Main adapter path:
1. runtime state -> `buildGameStateFromRuntime(...)`
2. legacy snapshot -> `buildGameStateFromLegacySnapshot(...)`
3. normalized state -> `normalizeGameState(...)`
4. world-sim sections attached by `WorldSimState.attachSections(...)`
5. legacy runtime restored by `applyGameStateToRuntime(...)`

This means:
- old UI keeps working
- old save fields remain valid
- new persistent sections are already present for future stages

## Stable IDs

All new permanent entities use stable string ids.

Current sources:
- player fighter: fixed id `fighter_player_main`
- gyms and trainers: ids from `ContentLoader`
- organizations: generated deterministic ids by country and track
- competitions: based on offer ids or deterministic fallback ids
- narrative and world sections: fixed root ids like `world_state_main`

## Scope Of This Stage

Implemented now:
- docs
- new canonical entity schemas
- new top-level state sections
- save migration support
- validators for the new sections
- adapters preserving current gameplay

Intentionally postponed:
- real persistent NPC fighter careers
- amateur/pro rules and switching
- real ranking logic
- real tournaments
- organization-owned schedules
- world-level simulation outside the player bubble

## Stage 2 Extension: Persistent Fighter Registry

Stage 2 adds the first real persistent roster layer.

New source of truth for world fighters:
- `rosterState.fightersById`
- `rosterState.fighterIds`

Seed roster data files:
- `data/roster/street_seed_roster.js`
- `data/roster/amateur_seed_roster.js`
- `data/roster/pro_seed_roster.js`

Compatibility rules:
- fight offers still keep `offer.opponent` snapshot for the current UI and battle code
- fight offers now also keep `offer.fighterId`
- rivalries still keep `lastOpponentSnapshot`, but now also keep `opponentFighterId`
- old random name generation stays as fallback-only logic for future next-generation fighters

Target result:
- the same opponent can return later
- rematches can point to the same entity
- later stages can safely add rankings, promotions, world aging, and track transitions

## Stage 4 Extension: Amateur Infrastructure And National Teams

Stage 4 adds a real amateur environment above the junior/amateur rank system without replacing the weekly loop.

New canonical concepts now present in runtime/state:
- amateur organizations by country
- amateur coach roles
- national team entity per country
- selection and eligibility hooks for future tournament systems

### Amateur organization types

The world now recognizes these organization types:
- `youth_boxing_school`
- `amateur_gym`
- `regional_amateur_center`
- `national_federation`
- `national_team`
- `olympic_preparation_center`

These organizations are country-bound and use stable string IDs.

### Trainer role layer

Trainer entities remain compatible with the old gym/trainer UI, but now also carry amateur role metadata:
- `youth_trainer`
- `amateur_trainer`
- `elite_amateur_coach`
- `national_team_coach`
- legacy street/pro roles remain compatible through adapters

### OrganizationState extension

`organizationState` now also contains:
- `teamIds`
- `teamsById`

National teams are stored separately from generic organizations because they have roster-slot logic and rotating active/reserve membership.

### CompetitionState extension

`competitionState` now also contains:
- `amateurHooks.seasonEligibilityByFighterId`
- `amateurHooks.federationPointsByFighterId`
- `amateurHooks.tournamentRegistrationByFighterId`
- `amateurHooks.teamEligibilityByFighterId`

These are scaffolding hooks for:
- season eligibility
- federation points
- registration to future tournaments
- team-based eligibility for continental/world/Olympic routes

### FighterEntity extension

Persistent amateur fighters now additionally support:
- `currentCoachId`
- `currentOrganizationId`
- `amateurRank`
- `nationalTeamStatus`
- `amateurGoals`

This allows one fighter to remain the same person across:
- gym changes
- rank growth
- reserve/active national team rotation
- repeated meetings with the player

### TeamEntity

Each country now has a persistent `TeamEntity` with:
- stable `id`
- `countryId`
- `category`
- `headCoachId`
- `assistantCoachIds`
- `rosterSlots`
- `reserveSlots`
- `activeRosterIds`
- `reserveRosterIds`
- `candidateRosterIds`
- `selectionWindow`
- `lastSelectionWeek`
- `selectionRules`
- `olympicCycleStatus`

### Runtime adapter rule

The current UI still works through legacy screens:
- `career`
- `careerGym`
- `careerTrainer`
- new compatible panel `careerTeam`

The UI still reads legacy runtime fields where needed, but the amateur infrastructure is now rebuilt from canonical state through adapters on refresh/save/load.

## Stage 6: Weekly World Career Simulation

Stage 6 extends the world so that amateur infrastructure, ranks, teams and career-track transitions are not static snapshots. The world now has a lightweight persistent simulation pass that advances alongside the player's weekly loop.

### WorldCareer simulation layer

`worldState.worldCareer` is the new canonical container for slow world movement:
- `lastProcessedWeek`
- `lastProcessedYear`
- `pendingNotices`
- `worldHistory`
- `encounterMemoryByFighterId`
- `teamStatusByFighterId`
- `trackStatusByFighterId`
- `newgenCounter`

This layer is intentionally small. It does not try to fully simulate every minute of every NPC life. Instead, it stores only the information needed to make the world feel persistent and logically consistent.

### Fighter lifecycle additions

Persistent fighters now also carry career-simulation metadata:
- `goalProfileId`
- `worldHistoryHooks`
- `encounterHooks`
- `lastTrackTransitionWeek`
- `lastTeamStatusChangeWeek`
- `lastGymChangeWeek`
- `lastCoachChangeWeek`

These fields are stable and survive save/load cycles.

### AI goal profiles

World fighters can now follow long-term profiles:
- `youth_prospect`
- `amateur_medal_hunter`
- `national_team_climber`
- `reserve_team_boxer`
- `late_starter`
- `street_talent`
- `pro_chaser`
- `burnout_case`

The weekly simulation uses these profiles to bias:
- development rate
- organization movement
- rank growth
- team selection persistence
- amateur-to-pro transitions
- amateur-to-street fallback

### Newgen pipeline

The world can now periodically create new 14-17 year old fighters by country. These new fighters are seeded into amateur or street entry paths and become part of the same persistent roster model as everyone else.

This means the roster is no longer only the initial seed list plus migrated snapshots.

### Encounter memory and world history hooks

The simulation now records encounter and history hooks such as:
- `shared_junior_path`
- `former_national_teammate`
- `took_team_spot_from_player`
- `met_as_junior_then_pro`
- `met_as_junior_then_street`

And long-term world history hooks such as:
- `former_national_team_member`
- `dropped_from_national_team`
- `national_champion`
- `olympic_hopeful`
- `failed_prospect`
- `left_amateur_path_for_streets`

These are not just lore labels. They are intended as future integration points for:
- media
- relationship arcs
- rival returns
- biography generation
- pro/street re-encounters

### Runtime adapter rule

The weekly loop still belongs to the legacy runtime, but it now calls the canonical world-career pass during `runWorldTick()`.

Adapter rule:
- world simulation runs on canonical state
- resulting notices are pushed back into legacy feed / biography / media helpers
- old UI panels remain usable without direct knowledge of the new layer

This preserves the current screens while moving long-term world logic into a reusable simulation module.

## Stage 7: Street Career Layer

Stage 7 adds a separate long-form street path on top of the same persistent roster.

New player subsection:
- `player.street`

Current fields:
- `id`
- `streetRating`
- `districtId`
- `cityStreetStanding`
- `nationalStreetStanding`
- `undergroundTitles`
- `localPromoterIds`
- `undergroundPressureTags`
- `currentSceneId`
- `currentStatusId`
- `history`

### Street ladder

Street progression is now data-driven and fully separate from amateur rank / pro ranking:
- `neighborhood_unknown`
- `district_contender`
- `city_underground_regular`
- `regional_underground_contender`
- `national_underground_icon`
- `street_legend`

### Street organizations

Street-side organizations now exist as persistent `OrganizationEntity` records with `trackId = "street"`:
- `district_scene`
- `underground_venue`
- `local_organizer`
- `street_stable`

They are generated for every country and district template and survive in canonical organization state.

### Street offers and track switching

Street offers remain compatible with the old fight offer UI, but now come from a dedicated street data layer with:
- separate reward tuning
- separate toxicity/risk
- separate street rating deltas
- separate underground rematch template

Track switching is still handled through adapter helpers in runtime UI, but canonical state now supports:
- `amateur -> street`
- `street -> amateur`
- `street -> pro`
- `pro -> street`

## Stage 8: Pro Career Layer

Stage 8 adds the first playable professional loop on top of the same persistent world.

New player subsection:
- `player.pro`

Current fields:
- `id`
- `currentStageId`
- `proRecord`
- `currentPromoterId`
- `currentManagerId`
- `contenderStatus`
- `titleHistory`
- `rankingSeed`
- `proReputationTags`
- `formerAmateurStatus`
- `formerNationalTeamStatus`
- `olympicBackground`
- `history`
- `lastOfferWeek`

### PromoterEntity

Canonical professional promoter entity:
- `id`
- `templateId`
- `name`
- `countryId`
- `city`
- `purseBonus`
- `fameBonus`
- `travelBias`
- `pressure`
- `badContractShift`
- `reputation`
- `npcId`

Stored in:
- `organizationState.promoterIds`
- `organizationState.promotersById`

### ManagerEntity

Canonical professional manager entity:
- `id`
- `templateId`
- `name`
- `countryId`
- `city`
- `purseBonus`
- `winBonus`
- `koBonus`
- `rankingBoost`
- `travelGuard`
- `pressureGuard`
- `reputation`

Stored in:
- `organizationState.managerIds`
- `organizationState.managersById`

### ProOfferEntity

Canonical professional offer entity:
- `id`
- `templateId`
- `label`
- `pipelineStage`
- `promoterId`
- `managerId`
- `opponentFighterId`
- `guaranteedPurse`
- `winBonus`
- `koBonus`
- `promoterPressure`
- `travelRisk`
- `badContractRisk`
- `explanation`
- `weekStamp`
- `countryKey`
- `venue`

Stored in:
- `competitionState.proOfferIds`
- `competitionState.proOffersById`

### Pro pipeline

The first professional loop now has data-driven stages:
- `debut`
- `low_card`
- `prospect`
- `ranking`
- `eliminator`
- `title_path`

The runtime UI still consumes legacy fight-offer snapshots, but those snapshots are now built from canonical pro data and remember a stable `proOfferId`.

### Adapter rule

Professional offers and results use the same old fight screen and result screen, but are bridged through adapters:
- canonical pro state lives in `player.pro`
- canonical promoters/managers live in organization state
- canonical pro offers live in competition state
- legacy fight offer cards still receive snapshot-friendly fields like `offer.opponent`
- fight results are pushed back into `player.pro` through `ProCareerEngine.applyFightResult(...)`

This keeps the current HTA/mobile UI and combat loop intact while making the pro path persistent and expandable.

## Stage 12 Ruleset Layer

The combat core still uses one tactical engine, but a ruleset layer now sits above it:
- `street`
- `amateur`
- `pro`

`BattleRuleset` data is content-driven and controls:
- round count
- abstract round length
- scoring emphasis
- damage / KO / wear modifiers
- fame and money multipliers
- format-specific commentary

Adapter rule:
- the existing fight engine still resolves movement, strikes, knockdowns and judge cards
- offers now carry a lightweight ruleset snapshot for UI preview
- active fights normalize and keep `rulesetId`, `roundLimit` and ruleset metadata without replacing legacy fight fields

This keeps current screens and saves compatible while making the same fight engine feel different in each career track.

## Stage 13 Career Transition Layer

Career tracks now have a canonical transition layer instead of only hardcoded button flows.

New content-driven structures:
- `CareerTransitionDefinition`
  - `id`
  - `transitionType`
  - `fromTrackIds`
  - `toTrackId`
  - `requirements`
  - `blockers`
  - `consequences`
  - `narrativeTags`
- `CareerTransitionEventDefinition`
  - `id`
  - `transitionIds`
  - `conditions`
  - `cooldownWeeks`
  - `tone`

Canonical runtime storage:
- `narrativeState.availableTransitionIds`
- `narrativeState.availableTransitionsById`
- `narrativeState.transitionEventIds`
- `narrativeState.transitionEventsById`
- `narrativeState.transitionHistory`
- `narrativeState.transitionNoticeQueue`
- `narrativeState.transitionEventStateById`

Adapter rule:
- old UI buttons such as `moveStreetTrackToPro()` still exist
- those buttons now delegate into `CareerTransitionEngine`
- the old `street / amateur / pro` panels remain usable
- the new `careerTransitions` panel explains why a path is open or blocked and what is gained or lost

This keeps the player flow compatible while making nonlinear track changes a real system for both the player and the world.

## Stage 15 World Story Layer

The world now materializes a derived historical layer on top of the persistent simulation:
- `narrativeState.worldMediaIds`
- `narrativeState.worldMediaById`
- `narrativeState.worldLegendIds`
- `narrativeState.worldLegendsById`
- `narrativeState.teamHistoryByCountryId`
- `narrativeState.titleHistoryByOrganizationId`
- `narrativeState.tournamentHistoryById`
- `narrativeState.streetHistoryByCountryId`

This layer is not a new source of truth for career logic. It is a read model rebuilt from:
- amateur season history
- title lineage
- persistent fighter roster
- track transitions
- street status history

Adapter rule:
- the old player media feed still exists and stays player-centric
- the old archived run list in localStorage still exists and stays separate
- Stage 15 adds a world-scale history view in the existing `careerLog` and `archive` screens without replacing those screens

This keeps compatibility with the current UI while making the whole scene readable as a living history, not only as the player run log.
