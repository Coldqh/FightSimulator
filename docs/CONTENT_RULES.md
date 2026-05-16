CONTENT RULES

This document fixes the current content tone and core content rules for Fight Simulator. It describes the active rules that runtime, content loaders, and save migration now follow.

START AGE CHOICE

The player can now start at 16 or 18.

Start at 16:
- junior phase starts immediately
- the player gets a youth-compatible start
- the junior amateur layer is active from week one
- youth support stays available
- part of the adult sandbox stays gated until adulthood

Start at 18:
- the player starts in early adult career
- the player skips part of the youth intro
- the amateur state starts from an adult-compatible entry point
- the career opens faster into the adult sandbox

Legacy saves:
- old saves without an explicit new start choice are treated as adult legacy careers
- create-screen defaults now use the new 16-or-18 model

NICKNAME RULES

Amateur fighters:
- do not use nicknames
- do not show a nickname field in amateur presentation
- old amateur saves with nicknames are cleared or hidden through normalization and migration

Street fighters:
- usually have a nickname
- nickname is part of street identity and local reputation

Pro fighters:
- may have a nickname
- nickname is rarer than on the street
- some pro fighters have no nickname at all

Nickname format:
- nickname must be exactly one word
- multi-word legacy nicknames are sanitized to a single-word form
- old incompatible nickname combinations are no longer used by active generation rules

DEVELOPMENT FOCUS RULES

Sparring is no longer a long-term development focus.

Active long-term development focuses:
- endurance
- technique
- power
- defense
- recovery

Legacy compatibility:
- old focus id sparring migrates to technique
- old sparring focus progress is merged into technique progress
- old content hints that still point to sparring are canonicalized into technique at load time

SPARRING RULES

Sparring remains a separate activity, but it no longer acts as a permanent focus path.

Sparring now gives:
- progression points or skill points
- limited style progression
- limited fight knowledge and familiarity
- scouting knowledge
- light wear

Sparring does not:
- become a selectable long-term focus
- replace normal training focus
- replace normal development planning

RECOVERY AND WEAR RULES

Recovery now removes wear more noticeably.

Current recovery direction:
- home rest gives modest wear relief
- sports doctor gives strong wear relief
- therapy and massage give the strongest regular wear relief

Medical recovery:
- doctor and therapy also help active injuries recover faster
- the goal is to make recovery feel like a real answer to accumulated wear

UI PRESENTATION RULES

Character creation:
- shows the difference between starting at 16 and starting at 18
- keeps the choice readable and short

Fighter profile:
- shows nickname context only when it is relevant
- amateur profiles explain that nicknames are not used there
- street and pro profiles can explain whether a nickname exists or not

CONTENT CLEANLINESS

When new fighters, schools, or rosters are added:
- amateur content should not introduce nickname-heavy presentation
- nickname lists should stay one-word only
- sparring must not be reintroduced as a permanent focus id
- recovery descriptions should match actual wear reduction numbers

MIGRATION NOTES

Relevant compatibility rules in the current runtime:
- save version 30 carries the new content normalization layer
- old sparring focus data is migrated safely
- old amateur nicknames are hidden or cleared safely
- old start age assumptions remain playable without breaking older careers
