# Fight Simulator

Version: `offline-pwa-2.2.1`

Large career systems patch.

Included:
- clickable fighter profiles in news
- NPC OVR growth over time and after fights
- fight offers more based on ranking position
- higher XP from fights
- fatigue rebalance
- next week as recovery
- adjusted tournament calendar
- autonomous country/continent/world/olympic tournament results for NPC
- national teams by OVR
- skipped fight score/KO logic
- full award/title display
- past title history
- automatic pro move at OVR 121
- path-rank info modal


## Offline PWA 2.2.1

The game now registers a service worker and caches the full static app after the first online load.

On iPhone:
1. Open the GitHub Pages site once while online.
2. Wait until the page fully loads.
3. Tap Share → Add to Home Screen.
4. Launch from the icon. The game can open without internet after the first successful load.

Offline mode requires HTTPS hosting, so GitHub Pages works. Opening `index.html` directly as a local file does not register a service worker.
