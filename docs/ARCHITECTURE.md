# Fight Simulator Architecture — 1.8.1

## Fight core

`src/core/fight.js` now owns:

- fight preview;
- interactive fight session;
- 5×5 ring positions;
- player actions;
- opponent AI action;
- HP/stamina damage;
- knockdown count;
- fight finish and rewards;
- random skip-fight resolution.

## Economy lock

`src/core/state.js` owns:

- negative balance;
- debt start/deadline;
- debt notice/game-over modal state;
- fatigue lock.

## UI

`src/ui/render.js` renders:

- active ring window;
- knockdown count window;
- debt/fatigue/game-over modals.

`src/app.js` routes button actions and blocks leaving the active fight window.
