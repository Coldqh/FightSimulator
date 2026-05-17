# Fight Simulator Architecture — 1.8.0

## Runtime

Static browser app with modular files under `src/`. No build step.

## Fight engine rule

`src/core/fight.js` owns the fight engine. The 1.8.0 engine is deliberately simple:

- fighter A acts;
- fighter B answers;
- hit chance comes from technique and speed against defense and speed;
- damage comes from power and technique against defense and stamina;
- HP loss can stop the fight;
- if no stoppage happens, round score decides the result.

No tactical plans, no aggression model, no tempo model, no clinch model.

## Tournament use

`src/core/amateur.js` calls `Fight.simulateRounds()` for tournament fights, so normal fights and tournament fights use the same engine.
