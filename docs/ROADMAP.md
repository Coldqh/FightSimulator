# Roadmap after 2.1.4

## 2.1.5 — offer cache and matchmaking speed

Goal:
- make fight offer refresh cheaper

Plan:
- cache candidate pools by track/country/weight
- rebuild only after fight/move/week
- avoid repeated full roster scans for 10 offers

## 2.1.6 — save size and long-career stability

Goal:
- keep 10-year careers light

Plan:
- cap old transition logs
- cap title histories
- cap old finance logs
- add save size warning in debug docs

## 2.1.7 — news filters UI

Goal:
- make news tab easier to read

Plan:
- filters: all, club, team, tournament, champion, migration
- keep texts short
- no generated filler

## 2.2.0 — fight stabilization

Goal:
- make the turn-based ring the main gameplay system

Plan:
- tune stamina/HP/damage
- improve NPC action choice
- improve judges and round scoring
- keep UI compact on phone
