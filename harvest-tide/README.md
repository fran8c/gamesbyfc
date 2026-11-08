# Harvest Tide

A glowing, landscape fish-shooter for the browser. Two modes:

- **Arcade** — 60-second high score. Fish have health bars; shots are free with reloads; chain catches for a multiplier and Harvest Fever.
- **Fish Table** — bet coins per shot and play until they run out. Every netted fish has a catch chance; the table pays back 97% of bets on average. No real money, ever.

Both: bouncing shots, nets that catch whole schools, the Golden Koi prize wheel, power-ups (Freeze, Lock-on, Zap), big-win celebrations, and the Octopus King boss.

Spec: `docs/harvest-tide-spec.md` (v0.3.1). If code and spec disagree, the spec wins.

Status: **S1 (rules) + S2 (look) done** — fully playable in both modes. Still to come: sound, settings screen, leaderboard screen, first-time tips (S4), playtest (S5).

## Playing it

The game is a set of files, so it needs a web server (double-clicking `index.html` won't work):

- **GitHub Pages:** put this folder in your repo, turn on Pages, open `https://<your-name>.github.io/<repo>/harvest-tide/`.
- **On your computer:** VS Code's *Live Server* extension, then open `index.html`.

Best on a phone held sideways, or a desktop browser.

### Handy test links (add to the end of the address)

| Add | What it does |
|-----|--------------|
| `?autoplay=expert` | A robot plays Arcade (`novice`, `mid`, `expert`) |
| `?autoplay=mid&mode=table` | A robot plays the Fish Table |
| `?seed=42` | Same fish every time |
| `?debug` | Game numbers at the bottom of the screen |
| `?debug&warp=1800` | Jump 30 seconds in |

## Folders

| Folder | What's in it |
|--------|--------------|
| `src/config/` | Every game number (`tuning.js`) and config checks |
| `src/sim/` | The rules. No graphics, no clock, no `Math.random`, no trigonometry — same seed + same taps = same game, in any browser |
| `src/scenes/` | Title (mode select), Game (with pause), Results |
| `src/view/` | Drawing: sea, fish, HUD, prize wheel, effects |
| `src/platform/` | Screen fitting, 60 Hz clock, saving |
| `src/dev/` | Robot player (tests, balance runs, title-screen demo) |
| `tests/` | 38 tests; open `tests.html` on the server, or run `node tests/run.mjs` |
| `tools/` | `balance-check.mjs` — plays hundreds of robot games and prints score bands and Table payback |
| `design/` | The original style mock-up |
| `docs/` | Spec |

A Game by FC.
