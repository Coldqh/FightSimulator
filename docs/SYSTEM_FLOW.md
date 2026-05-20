# System Flow 2.2.0

## Weekly tick additions

After national teams are rebuilt:

1. Autonomous tournaments run.
2. NPC medal awards are written.
3. Relevant tournament news can be created.
4. Titles update.
5. Pro fight due check happens before new contracts are generated.

## Fight skip

Skipped fight now:
1. calculates winChance
2. rolls result
3. rolls KO/TKO with track-specific KO profile
4. writes round score / KO round
5. hides punch log
6. applies fatigue and XP
7. writes opponent career log

## National team selection

On rebuild:
1. all amateur fighters are bucketed by home country + weight
2. buckets are sorted by OVR
3. top 2 are main
4. next 8 are reserve
5. player is included automatically if OVR qualifies

## Automatic pro transition

If amateur player reaches OVR 121:
1. track changes to pro
2. career log records automatic transition
3. ranking cache invalidates
4. selected tab switches to pro
