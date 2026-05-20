# Architecture 2.2.0

## News profile links

News items can include metadata:

```js
{
  fighterId,
  fighterIds,
  firstId,
  secondId,
  thirdId
}
```

`Render.renderNewsTab` renders profile buttons under the news text.

## NPC growth

NPCs grow from two sources:

1. Weekly training:
   - deterministic light growth across the whole roster over time
   - cheap modulo selection to avoid heavy full updates every week

2. Fight result:
   - winner gains more
   - loser gains less
   - draw gives both small development

## Matchmaking

Player offers now prefer ranking neighborhood over raw OVR.

Low amateur ranks:
- local country/local pool only

International amateur opponents:
- only from `МС` and `МСМК`

## Fatigue and progression

- Training: +3 characteristic points, +20 fatigue
- Fight win: +25 fatigue
- Fight loss: +40 fatigue
- Fatigue caps at 94
- Next week action counts as recovery

## Autonomous tournaments

`World.simulateAutonomousTournaments(state)` runs scheduled amateur tournaments for NPCs.

It awards:
- gold / silver / bronze
- city / oblast / region / country
- continent / world / olympiad

NPC awards are stored through `State.addFighterAward(...)`.

## National teams

National teams are now selected by OVR:
- top 2 per weight -> main team
- next 8 per weight -> reserve
- player enters automatically if OVR is high enough

## Titles

Title history now supports:
- active titles
- past titles with from/to weeks

`Titles.fighterTitleHistory(state, fighterId)` returns both.


## Offline PWA 2.2.1

Files:
- `sw.js` — service worker
- `manifest.webmanifest` — install metadata
- `assets/icons/*` — iPhone / PWA icons

Caching:
- install step precaches the shell, scripts, CSS, manifest, ring image and all flags
- navigation requests use network-first with cached `index.html` fallback
- static requests use cache-first with runtime fill

Save data:
- career saves remain in `localStorage`
- service worker only caches app files, not private save data
