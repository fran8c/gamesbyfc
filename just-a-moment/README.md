# Just a Moment!
A satirical hospital-management game set in Nusawangi City. A Game by FC.

**Play:** open `index.html` in a browser. Best on a computer or tablet.

- Levels 1–3, then Endless mode (one year = 8 days, busier every year)
- Sandbox on the title screen to try everything
- Progress saves in your browser
- On a tablet: Share → **Add to Home Screen** to play full screen, even offline

## Files
- `index.html` – the whole game
- `assets/` – pictures (people, furniture, floors and walls, UI)
- `manifest.json`, `sw.js`, `icon-*.png` – let tablets install the game and play offline
- `tests/` – automated playtests (see `tests/README.md`)

## Releasing a new version
Raise `GAME_VER` in the game code so players' browsers pick up new pictures and saves are upgraded.
