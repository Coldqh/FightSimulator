# Architecture 1.8.2

`fight.js` owns:
- Interactive ring session
- Separate fight window state
- Punch metadata
- Action repeat penalty
- Random auto resolve

`matchmaking.js` owns:
- 10 compact fight offers
- OVR ±10 opponent selection

`amateur.js` owns:
- Tournament bracket
- Tournament result flow
- Tournament fatigue at the end only
