# Harvest Tide

A glowing, landscape fish-shooter for the browser. Two modes:

- **Arcade** — 60-second high score. Fish have health bars; shots are free with reloads; chain catches for a multiplier and Harvest Fever.
- **Treasure Reef** — no time limit. Each shot costs a few coins (pick your cannon level with − and +); missed shots cost nothing. Catches return about 105% of what you spend over time. Coins are just for fun: no real money, ever.

Both: bouncing shots, nets that catch whole schools, a lucky meter, the Golden Koi prize wheel, power-ups (Freeze, Lock-on, Zap), big-win celebrations, the Octopus King boss, sound and music, tips, How to play, settings and a local leaderboard.

Spec: `docs/harvest-tide-spec.md` (v0.4). If code and spec disagree, the spec wins.

Status: **v0.4** — fully playable in both modes with sound, menus and tips. Next: playtest with real people.

## Your own art

Drop PNG files into `assets/` with the names in `assets/ART-PROMPTS.md` and the game uses them instead of its drawings. That file has ready-to-paste prompts for an AI image tool. Open `design/creatures.html` (through the server) to check them side by side.

## Playing it

The game is a set of files, so it needs a web server (double-clicking `index.html` won't work):

- **GitHub Pages:** put this folder in your repo, turn on Pages, open `https://<your-name>.github.io/<repo>/harvest-tide/`.
- **On your computer:** VS Code's *Live Server* extension, then open `index.html`.

Best on a phone held sideways, or a desktop browser.

### Handy test links (add to the end of the address)

| Add | What it does |
|-----|--------------|
| `?autoplay=expert` | A robot plays Arcade (`novice`, `mid`, `expert`) |
| `?autoplay=mid&mode=reef` | A robot plays Treasure Reef |
| `?seed=42` | Same fish every time |
| `?debug` | Game numbers at the bottom of the screen |
| `?debug&warp=1800` | Jump 30 seconds in |

## Folders

| Folder | What's in it |
|--------|--------------|
| `src/config/` | Every game number (`tuning.js`) and config checks |
| `src/sim/` | The rules. No graphics, no clock, no `Math.random`, no trigonometry — same seed + same taps = same game, in any browser |
| `src/scenes/` | Title, Game (with pause), Results, How to play, Settings, Leaderboard |
| `src/view/` | Drawing: sea, fish, cannon, HUD, prize wheel, effects, tips |
| `src/platform/` | Screen fitting, 60 Hz clock, saving, sound, loading your images |
| `src/dev/` | Robot player (tests, balance runs, title-screen demo) |
| `tests/` | 47 tests; open `tests.html` on the server, or run `node tests/run.mjs` |
| `tools/` | `balance-check.mjs` — plays hundreds of robot games and prints Arcade score bands and Treasure Reef payback |
| `assets/` | Your optional images + `ART-PROMPTS.md` |
| `design/` | `creatures.html` — every creature side by side |
| `docs/` | Spec |

A Game by FC.
