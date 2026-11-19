# harvest-tide-spec.md

**Project:** Harvest Tide (separate project from Reel Rush, which stays playable as its own game)
**Doc version:** 0.4 (no gambling words, Treasure Reef, lucky meter, UI/UX and art overhaul)
**Successor to:** reel-rush-mvp-spec.md v0.2.2 (cast-and-reel design, kept as its own game)
**Audience:** AI coding agent (primary), human reviewers (secondary)

**How to read this doc**

- Every gameplay number lives in `src/config/tuning.js` (Section 4). Prose cites a value once with its config key.
- `SUGGESTED` = author-chosen first value, to be checked by the robot balance run (Section 10) and playtest. `DECIDED` = owner decision. `Q` = open question (Appendix A).
- Order of authority if sections disagree: Section 3 (systems) > Section 4 (config) > everything else.
- All gameplay times are in ticks at 60 ticks/s. `ticks = ceil(seconds × 60)`.

---

## 0. Change Log

### 0.0 v0.3.1 → v0.4 (owner decisions 2026-11-10) — overrides anything below

| ID | Decision |
|----|----------|
| D19 | **No gambling words** anywhere a player can see: no bet, wager, odds, payout, jackpot, casino. A test scans `src/scenes` and `src/view` for them. |
| D20 | **Fish Table is renamed Treasure Reef.** The bet becomes the **cannon level** (1–7); each level has a **shot cost** (`reef.shotCost` 1, 2, 5, 10, 20, 50, 100). Default level 3 (5 coins). |
| D21 | **No end.** A Treasure Reef visit lasts until the coins run out or the player leaves. The leaderboard records the most coins reached in a visit (peak). |
| D22 | **Pays back about 105%** over time, lucky meter included. Base catch rate `reef.returnRate` 0.70 plus the lucky meter. |
| D23 | **More big wins, same feel:** fish mix shifted toward big fish (`world.weights`), wheel has a ×20 segment, big-win tiers lowered for the Reef (10× / 30× / 80× shot cost). |
| D24 | **Lucky meter in both modes.** Reef: 150 landed shots fill it; the next shot that lands is a sure catch of the most valuable fish in the net, worth at least 30× the average shot cost that filled it (a lucky shot that misses keeps the meter ready). Arcade: 120 hits fill it; the next catch spins the prize wheel with a base of at least 200 points. A lucky Golden Koi spins twice. |
| D25 | **UI/UX:** bigger touch targets, −/+ cannon-level buttons, lucky meter panel, value tags on big fish, first-time tips, how-to-play (6 pages), settings, local leaderboard, fullscreen, synthesized sound and music, richer code-drawn art. |
| D27 | **Arcade only (2026-11-19).** Treasure Reef is hidden from the title, leaderboard and How to play (its code and tests stay). Pacing: fish speed ramps `world.arcadeSpeed` 0.85 → 1.20 over 60 s. Final sprint: the last `run.sprintTicks` (600) score ×`run.sprintMult` (1.5). Robot bands after this change: novice median 14,562, mid 22,121, expert 24,282 (was 12.7k / 19.4k / 21.9k). |
| D26 | **Art slots:** any PNG dropped into `assets/` with the right name replaces the drawn art (fish, cannons, coin, power-up icons, background). Prompts in `assets/ART-PROMPTS.md`. |

**Measured (robot, 200 sessions each, `node tools/balance-check.mjs 200`):**

| | p25 | Median | p75 | Big wins per run |
|---|---|---|---|---|
| Arcade novice | 9,256 | 12,732 | 18,232 | 3.1 |
| Arcade mid | 14,261 | 19,354 | 27,786 | 5.4 |
| Arcade expert | 15,741 | 21,939 | 30,261 | 6.0 |

| Treasure Reef (robot fires nonstop, 10-min cap) | Payback | Big wins per min | Ran out of coins | Median peak |
|---|---|---|---|---|
| Level 3 (5 per shot) | 105–111% | 3.1 | 26% | 2,405 |
| Level 4 (10 per shot) | ~101% | 2.8 | 80% | 1,130 |
| Level 5 (20 per shot) | ~86% | 2.3 | 98% | 1,180 |

High levels pay back less in practice because many visits run out of coins before the lucky meter fills. That is the honest trade-off: higher levels win more per catch but are riskier. Calibration grid: expert robot 104.5%, mid 106.9%, novice 91.5% (better aim gets more from the lucky catch).

### 0.0.1 Name changes in code (v0.4)

`table` → `reef`, `bet` → `level`/`cost`, `bank` → `coins`, `pay` → `reward`, `rtp` → `returnRate`, `startBank` → `startCoins`, `peakBank` → `peakCoins`, end reason `broke` → `empty`. Save schema 2 migrates v1 saves.

The rest of this document is the v0.3.1 text with names updated. Where it still disagrees with 0.0, 0.0 wins.

## 0.v3 Change Log (v0.2.2 → v0.3)

### 0.1 Owner decisions (2026-11-08)

| ID | Decision |
|----|----------|
| D13 | Genre change: **fish shooter** (cannon fires at swimming fish) replaces cast, hook and reel. |
| D14 | **Two modes.** *Arcade*: 60-second score attack, fish have health bars, free shots with reload. *Treasure Reef* (was Fish Table): play until your coins run out, every hit has a catch chance, you choose your cannon level. |
| D15 | **Landscape** (1280 × 720 logical), cannon bottom centre. Replaces portrait (N6). |
| D16 | Keep and expand: glowing underwater look, big win moments, a bonus prize wheel, power-up buttons. |
| D17 | Name: **Harvest Tide**. Own folder and storage key `harvesttide:`; Reel Rush (v0.2.2) stays a separate, playable game. |
| D18 | ~~Pays back 97%~~ (now 105%, D22); fresh 1,000 coins every visit; no upgrades in MVP. |

### 0.2 What carries over from v0.2.2

Kept as-is: plain HTML Canvas, no engine (D12); pure deterministic sim in `src/sim/` with seeded RNG, fixed 60 Hz ticks and replays (Section 5); config loader with safe ranges; test harness (Node + `tests.html`); robot player and `tools/balance-check.mjs` (rewritten for the new rules); local save; pause on blur; captions and haptics; reduced motion; "A Game by FC" credit.

Removed: casting, bites, tension reel, snaps, harvest sweep, spots, Harbor upgrades and shop (replaced by Treasure Reef mode), the v0.2 tutorial script, all v0.2 score bands.

### 0.3 Guardrails kept on purpose

- **No real money anywhere.** Coins cannot be bought, sold or cashed out. No ads, no VIP, no gift packages, no daily-login rewards (CANON anti-scope: no pay-to-win, no energy gates).
- **Treasure Reef uses chance, but is not presented as gambling.** It returns more than it takes on average (about 105%), coins have no value, and the How to play page explains it plainly: "over time catches return about 105% of what you spend — but luck swings both ways" and "Coins are just for fun — they can never be bought or cashed out". No odds line on the game screen. A store listing (if ever) should still be checked against the store's rules on simulated gambling.
- **Readable in 3 seconds (P1).** We borrow the glow and celebration of fish-table games, not their clutter: particle caps, a dimmed background behind big-win overlays, and at most 3 HUD buttons on each side.

---

## 1. Project Brief

### 1.1 Pitch

A glowing, landscape fish-shooter for the browser. Aim the cannon, pop nets over schools of fish, chain catches into a multiplier, and spin the prize wheel when the Golden Koi goes down. Play a 60-second Arcade sprint for a high score, or dive into the Treasure Reef and see how high your coins can climb.

### 1.2 Pillars

| ID | Pillar | Forbids |
|----|--------|---------|
| P1 | Readable in 3 seconds | Hidden state; unreadable clutter. Fish value, ammo, combo, timer/coins always visible. |
| P2 | Aim matters | Hits decided only by chance in Arcade. Bounce shots, schools and targeting choice reward skill. |
| P3 | Celebrate wins loudly, losses quietly | Punishing animations for misses; silent big catches. |
| P4 | Fast retry | More than 5 s from the end screen to the next run. |
| P5 | Fair play | Real-money purchases, paid advantages, misleading odds. |

### 1.3 Core loop

```
 AIM (drag/hold) → FIRE (bullets bounce off walls) → NET opens on first fish hit
      ↑                                                   ↓
  power-ups / prize wheel  ←  BIG WIN / combo  ←  CATCH (Arcade: HP 0 · Reef: chance roll)
```

### 1.4 Modes

| | Arcade | Treasure Reef |
|---|--------|------------|
| Length | 60 s | No limit; ends when coins < cheapest shot, or the player leaves |
| Catching | Health bars: each net hit = 1 damage | Chance: each net hit rolls a catch |
| Shots | Free; clip of 24, auto-reload 1.0 s | Each shot costs coins by cannon level (1–100); misses cost nothing |
| Reward | Score × combo multiplier | Coins = shot cost × fish reward |
| Combo / Fever | Yes | No (would change the odds) |
| Prize wheel | Golden Koi catch: multiplies its points | Golden Koi catch: multiplies its payout |
| Power-ups | 2 uses each per run | 1 use each per session + capsules |
| Best record | Highest score | Most coins reached in a visit |

### 1.5 Anti-scope

Not multiplayer. No story. No crafting or economy beyond the Reef coins. No real money (P5). No energy or lives. No ads.

---

## 2. Tech Stack and Repo Layout

Unchanged from v0.2.2 Section 2 (plain Canvas 2D, ES modules, no build, GitHub Pages, `harvesttide:` storage prefix, tests in Node and browser), with these layout changes:

```
src/
  config/tuning.js, loader.js            // new values (Section 4)
  sim/
    rng.js, events.js                    // kept
    world.js        // fish, paths, spawning, waves, boss timing
    cannon.js       // aim, fire, clip/reload, cannon level (shots.js)
    bullets.js      // movement, wall bounces, hit test, nets
    catch.js        // Arcade damage / Reef chance roll, lucky meter
    combo.js        // Arcade combo + Fever
    wheel.js        // prize wheel
    powerups.js     // freeze, lock-on, lightning, capsules
    score.js        // Arcade score, Reef coins
    runSim.js       // state, input, tick order (3.12)
  scenes/  title.js, game.js, results.js (+ pause)
  view/    gfx.js, art.js (fish), sea.js (background, frame), hud.js, fx.js, wheel.js
  platform/ display.js (landscape), clock.js, storage.js
  dev/     bot.js (aims and shoots)
```

---

## 3. Systems Spec

Coordinates: logical 1280 × 720, origin top-left. Playfield = whole canvas minus a 24 px frame.

### 3.0 Input

One pointer (first down) is tracked; others are ignored until it lifts.

| Pointer | Effect |
|---------|--------|
| Down on playfield | Cannon turns to the point and fires immediately (if able); keeps auto-firing at `cannon.fireRate` while held |
| Move while down | Cannon follows the pointer |
| Up | Stop firing |
| Down on a HUD button (power-up, level −/+, pause) | Button only; no shot |

Aim limit: the cannon cannot point below 8° above horizontal (`cannon.minAngleDeg`). Direction is a normalised vector (no trig in the sim; see 5.3).

**QA:** Hold at (640, 200) for 1 s in Arcade → 6 shots fired (fire rate 6/s), first on the press tick.

### 3.1 Cannon and ammo

| Key | Arcade | Reef |
|-----|--------|-------|
| `cannon.pos` | (640, 676) | same |
| `cannon.fireRateTicks` (ticks between shots) | 10 (6/s) | 15 (4/s) |
| `cannon.clipSize` | 24 | — |
| `cannon.reloadTicks` | 60 (1.0 s), automatic when the clip is empty | — |
| `cannon.maxBulletsOnScreen` | 10 | 8 |

Cannon levels 1–7, shot cost `reef.shotCost`: 1, 2, 5, 10, 20, 50, 100. Default level 3. If the chosen level costs more than the coins left, the highest affordable level fires. Level can change any time; it applies to the next shot.

### 3.2 Bullets and bounces

- Speed `bullet.speedPxPerTick` 15 (900 px/s); radius 8.
- Bounce off the left, right and top playfield edges; up to `bullet.maxBounces` = 3. Leaving through the bottom, or after `bullet.lifeTicks` = 150 (2.5 s), the bullet expires.
- **Reef return:** a bullet that expires without hitting anything, or whose net holds no paying fish (e.g. only a capsule), gives its coins back. Misses never cost coins.
- Each tick, a bullet hits the first fish (ascending `uid`) whose hit circle overlaps it. It stops and opens a **net**.

### 3.3 Nets

- Net radius `net.radiusPx` 44 (Arcade; ×1.4 during Fever). Reef: 44.
- Every fish whose hit circle overlaps the net is **netted** (max `net.maxFish` = 5, nearest first).
- Arcade: each netted fish takes 1 damage. Reef: each netted fish rolls a catch (3.5).

### 3.4 Fish

| ID | Size (px) | Hit radius | HP (Arcade) | Points (Arcade) | Reward × shot cost (Reef) | Speed (px/s) | Group |
|----|-----------|-----------|-------------|-----------------|-------------------|--------------|-------|
| `sardine` | 44 × 18 | 12 | 1 | 10 | 2 | 150 | school 5–8 |
| `clownfish` | 46 × 30 | 15 | 2 | 20 | 3 | 125 | school 3–5 |
| `snapper` | 64 × 32 | 18 | 3 | 30 | 5 | 105 | pair 2–3 |
| `puffer` | 52 × 52 | 22 | 5 | 50 | 8 | 70 | single |
| `lionfish` | 84 × 50 | 24 | 8 | 80 | 12 | 85 | single |
| `turtle` | 120 × 92 | 40 | 15 | 150 | 20 | 50 | single |
| `manta` | 170 × 100 | 48 | 25 | 250 | 30 | 60 | single |
| `golden_koi` | 92 × 44 | 22 | 12 | 300 + wheel | 40 + wheel | 165 | single, rare |
| `octopus_king` (boss) | 230 × 210 | 90 | 80 | 1,500 | 100 | 32 | boss |
| `jellyfish` (Arcade hazard) | 48 × 60 | 18 | 1 | 0 | — | 40 | single |
| `capsule` (power-up) | 40 × 40 | 18 | 1 | 0 | — | 90 | single |

All values `SUGGESTED`. Each fish shows its value in the HUD legend on first appearance (P1). Fish with HP > 1 show a thin health bar after their first hit.

**Paths (deterministic):** each fish (or school) gets a quadratic Bézier path from an entry point just off one edge (left, right, or a top corner) to an exit point off the opposite side. Control point within the middle 60% of the screen. Position at time *t* = Bézier(t / pathTicks). School members share the path with fixed offsets. Visual wiggle is view-only.

**Spawning:** keep `world.targetFishCount` = 22 fish on screen (×1.5 during Fever), counting a school as its members. Every 10 ticks, if below target, spawn one group chosen by `world.spawnWeights` (Section 4). Golden Koi: at most one on screen. Capsule (both modes): every 900 ticks (15 s) if none present.

**Boss:** Arcade: Octopus King enters at 30 s left and leaves after 20 s if not caught. Reef: every 5,400 ticks (90 s).

**Jellyfish (Arcade only):** netting a jellyfish stings: the cannon jams for 36 ticks (0.6 s) and the combo breaks. It never appears in Treasure Reef.

### 3.5 Catching

**Arcade (health bars):** a fish is caught when its HP reaches 0. Points = `points × multiplier` (multiplier at the moment of the catch, before this catch's combo gain). Golden Koi then triggers the wheel (3.7).

**Treasure Reef (chance):** for each netted fish *i* in a net of *k* fish,

```
p_i = reef.returnRate / (reward_i × k × wheelEV_i)   // wheelEV_i = 68/12 ≈ 5.67 for Golden Koi, else 1
win  = shot cost × reward_i × (wheel result, Golden Koi only)
```

- `reef.returnRate` = 0.70 (DECIDED via calibration, safe range 0.60–1.10). Dividing by *k* keeps the return the same whether the net catches one fish or five. The lucky meter (D24) adds the rest, for about 105% overall.
- **Verified:** the base rule returns `returnRate` ± 1.5% over 4 million nets (test TS-07).
- Caught fish leave with a coin burst; others swim on.
- Explained on the How to play page only (D19/D22), not on the game screen.

### 3.6 Arcade combo and Fever

- Each catch: +1 combo point; resets the chain timer to `combo.chainTicks` = 120 (2.0 s).
- Chain timer reaches 0, or a jellyfish sting → combo 0.
- `multiplier = min(5.0, 1 + 0.5 × floor(points / 4))` — x1.5 at 4 catches, x3.0 at 16, x5.0 at 32.
- **Harvest Fever** at x3.0 (`fever.triggerMultiplier`): 360 ticks (6 s); net radius ×1.4, fire rate +50%, fish target count ×1.5, chain timer frozen. Re-triggers only after the combo has broken once (lockout).

### 3.7 Prize wheel

- Trigger: Golden Koi caught (both modes).
- 12 segments (`wheel.segments`): ×2 ×4, ×3 ×3, ×5 ×2, ×8, ×10, and "×1 + free power-up". EV ×3.833.
- Result from the `wheel` RNG stream at the trigger tick (deterministic); the spin animation only reveals it.
- The wheel takes 150 ticks (2.5 s). **The Arcade timer pauses** during the wheel, and fish freeze in place; firing is disabled.
- Arcade: Koi points × result. Reef: Koi reward × result. Wheel segments (`wheel.segments`): ×3, 2, 5, 3, 8, 2, 5, 10, 3, 5, 20, 2★ (★ = also a free power-up).

### 3.8 Power-ups

Three buttons, bottom right. Each shows its uses left.

| ID | Effect | Duration | Arcade uses | Reef uses |
|----|--------|----------|-------------|------------|
| `freeze` | All fish stop moving (timer keeps running) | 240 ticks (4 s) | 2 | 1 |
| `lockon` | Bullets steer towards the highest-value fish on screen (or the fish under the pointer when pressed) | 360 ticks (6 s) | 2 | 1 |
| `lightning` | Chains through the 6 highest-value fish on screen. Arcade: 6 damage each. Reef: a free shot at the current shot cost that rolls each fish with *k* = 6 | instant | 2 | 1 |

- **Capsules** (3.4): netting a capsule grants +1 use of a random power-up (max 3 of each).
- Reef effect: freeze and lock-on make aiming easier but do not change catch chances. Zap is a free shot.

### 3.9 Big win moments

| Tier | Arcade (points from one catch) | Reef (win ÷ shot cost) | Presentation |
|------|-------------------------------|-------------------|--------------|
| Nice | ≥ 150 | ≥ 10 | Large popup number |
| BIG CATCH | ≥ 500 | ≥ 30 | Gold banner, coin fountain, 1.2 s |
| MEGA CATCH | ≥ 1,500 | ≥ 80 | Full-screen dim, giant count-up number, coin shower, 2.0 s |

Big-win overlays never pause the sim except the wheel (3.7). The shooting area stays visible behind a 50% dim. Reduced motion: no shake, ≤ 8 particles, static banner.

### 3.10 Run end

- **Arcade:** at 3,600 ticks (timer excludes wheel time). In-flight bullets expire. End bonus: accuracy (shots that hit something ÷ shots fired) ≥ 0.5 → +10% of score (`score.accuracyBonusPct`). Results: score, best, catches by fish, best multiplier, accuracy, biggest catch.
- **Reef:** when coins are below the cheapest shot and no bullets are in flight (`empty`), or when the player chooses Leave the Reef (`quit`). Pending prize-wheel spins pay out first. Results: coins now, most coins this visit, biggest catch, lucky catches, shots, time. New visit gives a fresh 1,000.

### 3.11 Edge cases

| ID | Case | Rule |
|----|------|------|
| E-1 | Bullet and fish touch on the tick a fish exits | Exit checked after hits: the hit counts |
| E-2 | Two bullets hit the same fish on one tick | Resolve in bullet order; later nets skip already-caught fish |
| E-3 | Wheel triggers during Fever | Fever timer pauses with the run timer |
| E-4 | Reef coins hit 0 with bullets in flight | Wait for them to resolve (returns possible) before ending |
| E-5 | Power-up pressed while the wheel is up | Ignored |
| E-6 | Level changed with bullets in flight | Each bullet keeps the cost it was fired with |
| E-7 | Boss alive when the Arcade timer ends | Boss leaves; no partial points |
| E-8 | Tab hidden | Pause; 3-2-1 resume (kept from v0.2) |

### 3.12 Tick order (authoritative)

```
 1. Apply input (aim, fire held, buttons)
 2. Wheel: if spinning, count down; on finish apply result; skip steps 3–8 while spinning
 3. Power-up timers (freeze, lock-on)
 4. Cannon: reload / jam timers; fire if held and ready (deduct shot cost in Reef)
 5. Fish: advance along paths (not during freeze); spawn; boss timing
 6. Bullets: move, lock-on steering, wall bounces, hit test → nets → damage or chance rolls
 7. Catches: score / payout, combo gains, big-win events, wheel trigger
 8. Exits and bullet expiry (Reef returns)
 9. Combo chain timer, Fever timer and entry
10. Run end checks
11. Flush events
```

---

## 4. Config (`src/config/tuning.js`, key groups)

`run` (durationTicks 3600, warningAtTicks 600), `cannon` (per mode: fireRateTicks, clipSize, reloadTicks, maxBulletsOnScreen, pos, minAngleDeg), `bullet` (speedPxPerTick 15, radius 8, maxBounces 3, lifeTicks 150), `net` (radiusPx 44, maxFish 5, feverRadiusMult 1.4), `fish` (table 3.4 per ID), `world` (targetFishCount 22, spawnEveryTicks 10, spawnWeights, bossArcadeAtRemainingTicks 1800, bossReefEveryTicks 5400, capsuleEveryTicks 900), `combo` (chainTicks 120, pointsPerTier 4, multiplierPerTier 0.5, multiplierCap 5), `fever` (triggerMultiplier 3.0, durationTicks 360, …), `wheel` (segments, spinTicks 150), `powerups` (…), `reef` (returnRate 0.70, startCoins 1000, shotCost, defaultLevel 3), `lucky` (reefShots 150, reefMinMult 30, arcadeHits 120, arcadeBase 200), `score` (accuracyBonusPct 0.10, accuracyThreshold 0.5), `bigwin` (tiers 3.9).

**Spawn weights (SUGGESTED, groups):** sardine school 22, clownfish school 16, snapper pair 14, puffer 12, lionfish 10, turtle 7, manta 5, golden_koi 2, jellyfish 6 (Arcade only).

**Safe ranges (tuning levers):** `reef.returnRate` 0.60–1.10; `lucky.reefShots` 60–400; `lucky.arcadeHits` 40–400; `net.radiusPx` 32–60; `cannon.fireRateTicks` 8–20; `cannon.clipSize` 12–40; `combo.chainTicks` 90–180; `fever.triggerMultiplier` 2.0–4.0; `world.targetFishCount` 14–30; fish HP ×0.5–×2 (single `fish.hpScale`).

---

## 5. Architecture

Unchanged from v0.2.2 Section 5 except:

- **5.1 States:** `PLAYING`, `WHEEL`, `RUN_OVER` (pause is platform-level, as before).
- **5.2 RNG streams:** `spawn`, `paths`, `catch` (Reef rolls), `wheel`, `capsule`.
- **5.3 Determinism:** sim may use only `+ − × ÷`, `Math.floor/ceil/min/max/abs/sqrt/imul`. Aim, steering and Bézier positions use vectors and polynomials, no trig. Views may use trig freely.
- **5.4 Save (`harvesttide:save`, schemaVersion 2):** `settings { music, sfx, haptics, reducedMotion, showValues }`, `stats { bestArcade, bestReefPeak, runsArcade, sessionsReef }`, `localRuns { arcade: [], reef: [] }` (top 50), `tips { seen }`. v1 saves are migrated.
- **5.5 Display:** logical 1280 × 720, fit + letterbox. Touch devices held upright show "Rotate to landscape" and pause.

---

## 6. Art Direction

**Mood:** glowing deep sea at night. Rich blues and teals, light rays from above, drifting glow particles, coral silhouettes at the bottom, an icy crystal frame at the edges. Fish are bright, saturated and outlined so they pop against the dark water.

| Token | Hex | Use |
|-------|-----|-----|
| `abyss` | #06223F | Deep background |
| `sea` | #0B4F7A | Mid water |
| `glow` | #3FE3FF | Light rays, nets, UI glow |
| `ice` | #BFEFFF | Frame crystals, panels |
| `gold` | #FFC93C | Coins, big wins, koi |
| `coral` | #FF5E8A | Coral, hearts, hazard accents |
| `lime` | #C6FF4A | Glow particles, Fever |
| `ink` | #081521 | Outlines, text stroke |

**Rules:** max 60 ambient glow particles (P1); ambient particles at 40% opacity behind fish; fish always drawn with a 2–3 px dark outline; numbers use heavy rounded type with gold fill and dark stroke; HUD panels are frosted-glass rounded rectangles with an `ice` border. Big-win overlays use gold, radial light burst and coin sprites.

All art is procedural Canvas (no image files) for MVP. PNG replacement keys are listed in the v2 companion.

---

## 7. Audio (MVP)

Synthesized WebAudio cues: shot (soft pop, pitch by cannon level), net (splash), catch (coin chime, pitch rises with combo), big win (fanfare, 3 tiers), wheel tick + stop chime, power-up activate (3 distinct), sting (jellyfish buzz), reload click, timer warning, Fever loop layer. Music: one ambient underwater loop + Fever layer. Captions for every cue, haptics where available. Mute keeps captions and haptics.

---

## 8. UX

### 8.1 Screens

Title → (Arcade | Treasure Reef) → Game → Results → Play again / Scores / Menu. Overlays: Pause (Resume with 3-2-1, How to play, Settings, Quit / Leave the Reef), Settings (music, sound effects, vibration, reduced motion, value tags, show tips again, fullscreen), Leaderboard (local top 10, Arcade and Treasure Reef tabs), How to play (6 pages: aim, fish, combo, lucky meter and wheel, power-ups, Treasure Reef).

### 8.2 Game layout (1280 × 720)

```
+----------------------------------------------------------------------------------+
| [II]  SCORE 12,480        COMBO x2.5 [====··]  (Fever banner)      TIME 0:41     |  top bar (frosted)
| BEST 18,200                                                         Koi ×40 …    |  value legend (new fish)
|                                                                                  |
|                 ~ fish swim across on curved paths ~                             |
|        (prize wheel / big-win overlays appear centred here)                      |
|                                                                                  |
| coral                                                                    coral   |
| [ammo ▮▮▮▮▮▮▯▯]        [ − ]  ( CANNON )  [ + ]      [FRZ 2] [LOCK 2] [ZAP 2]     |  bottom bar
|  Arcade: clip             Reef: level −/+              power-ups (64 × 64)         |
+----------------------------------------------------------------------------------+
```

- Arcade: ammo bar left of the cannon; − / + level buttons hidden.
- Reef: coins top-left instead of score; lucky meter top-centre; level − / + either side of the cannon with the level number on the cannon hub and "N per shot" below.
- All buttons ≥ 64 × 64 logical (≈ 44 CSS px on small phones). No double-taps.

### 8.3 Wireframe: Results (Arcade)

```
+--------------------------- RUN OVER ---------------------------+
|                 18,240   NEW BEST!                              |
|  Biggest catch   Octopus King  4,500                           |
|  Best combo      x5.0          Accuracy  64%  (+10% bonus)     |
|  Catches         sardine 31 · snapper 9 · turtle 2 · koi 1 …   |
|          [  RETRY  ]   [ MENU ]   [ SHARE ]                     |
+----------------------------------------------------------------+
```

Reef results: coins now, most coins this visit, biggest catch (fish and ×), lucky catches, shots, time.

### 8.4 Onboarding

First launch of each mode: 3 captions over live play, no separate tutorial run:
1. "Touch to aim and fire. Shots bounce off the walls."
2. Arcade: "Big fish take more hits. Chain catches for a bigger multiplier." / Reef: "Use − and + to change cannon level. Higher levels cost more per shot and win more."
3. "Golden Koi spins the prize wheel!" (first time a Koi appears).

---

## 9. Balance Targets

Measured with the robot (`node tools/balance-check.mjs 200`, S1 build). Robots aim better than people (89–94% of shots hit something), so treat these as upper-end targets until playtest data replaces them.

**Arcade (60 s):**

| Robot level | Score band (p25–p75) | Median | Catches | Fever / run | Wheel / run | BIG or MEGA / run |
|-------------|----------------------|--------|---------|-------------|-------------|-------------------|
| Novice | 11,100–16,200 | 13,200 | 184 | 3.0 | 0.3 | 2.2 |
| Mid | 12,600–20,700 | 15,800 | 167 | 2.8 | 1.0 | 3.4 |
| Expert | 14,700–24,300 | 18,700 | 179 | 3.0 | 1.3 | 4.2 |

Skill gap novice → expert is about 40% at the median. If playtests show it feels too flat, the levers that widen it most (tested) are fewer fish on screen (`world.targetFishCount` 16) and a shorter combo chain (`combo.chainTicks` 90).

**Treasure Reef — v0.3 numbers, superseded by 0.0 (start 1,000, robot firing continuously at 4 shots/s):**

| Shot cost | Median session | Median peak | Measured payback |
|-----|----------------|------------------|------------------|
| 5 | 8.2 min | 1,450 | 96.6% |
| 10 | 3.3 min | 1,670 | 97.3% |
| 20 | 1.2 min | 1,520 | 97.7% |

Single sessions are noisy because big fish pay up to 400× the bet. The rule itself is exact: test TS-07 (4 million nets) returns 97% ± 1.5%. People pause between shots, so their sessions last longer in real time.

## 10. Backlog (MVP)

| ID | Story | Acceptance (summary) |
|----|-------|----------------------|
| FS-01 | Aim and fire | Press fires on that tick; hold auto-fires at the mode rate; aim clamped to ≥ 8°. |
| FS-02 | Clip and reload (Arcade) | 24 shots then 60-tick reload; no shots during reload. |
| FS-03 | Cannon level and coins (Reef) | Levels 1–7; cost ≤ coins; each shot deducts its cost; misses return it. |
| FS-04 | Bullets | Speed, 3 bounces, life 150 ticks, max on screen. |
| FS-05 | Nets | Radius 44, max 5 fish, nearest first. |
| FS-06 | Fish paths and spawning | Bézier paths; target count kept; schools; boss timing; Koi at most one. |
| FS-07 | Arcade catching | HP and points per table; health bar after first hit. |
| FS-08 | Reef catching | p = returnRate ÷ (reward × k × wheelEV); lucky meter per D24. |
| FS-09 | Combo and Fever | Chain 120 ticks; tiers every 4; Fever at x3.0 with lockout. |
| FS-10 | Prize wheel | Koi triggers; deterministic result; 150 ticks; timer paused. |
| FS-11 | Power-ups and capsules | Uses per mode; effects per 3.8; capsules +1 (max 3). |
| FS-12 | Jellyfish (Arcade) | Jam 36 ticks; combo breaks; absent in Treasure Reef. |
| FS-13 | Big win tiers | Tier thresholds per 3.9; reduced-motion variants. |
| FS-14 | Run end and results | Per 3.10; accuracy bonus; Reef ends with no bullets in flight. |
| FS-15 | Landscape display | Fit + letterbox; rotate prompt on upright touch devices. |
| FS-16 | Glowing art and HUD | Section 6 and 8.2; particle caps. |
| FS-17 | Title, mode select, settings, local leaderboard | Section 8.1. |
| FS-18 | Audio + captions + haptics | Section 7. |
| FS-19 | Determinism | Same seed + inputs → same events in Node and Chrome; lint bans trig in sim. |
| FS-20 | Save v3 + migration | Settings kept from v2; bests per mode. |

**Cut line (first to go):** Share button; Fever music layer; lock-on "fish under pointer" targeting (keep highest-value); boss in Treasure Reef; capsule drops.
**Never cut:** FS-01, 04, 05, 07, 08, 10, 11, 14, 15, 19.

---

## 11. Test Plan (key cases)

| ID | Case | Expected |
|----|------|----------|
| TS-01 | Hold fire 60 ticks (Arcade) | 6 shots; ammo 18 |
| TS-02 | Fire 24 shots | Reload 60 ticks, then shots resume |
| TS-03 | Bullet aimed at the left wall | Reflects; 4th wall contact expires it |
| TS-04 | Net over 7 fish | 5 nearest netted |
| TS-05 | Sardine school netted (Arcade) | All in net caught (HP 1), points × multiplier |
| TS-06 | Turtle takes 15 net hits | Caught on the 15th; health bar shown after the 1st |
| TS-07 | Reef return rule | 4,000,000 seeded nets return returnRate ± 0.015 |
| TS-08 | Reef miss | Bullet expires with no hit → cost returned |
| TS-09 | 3 coins, level 4 (10) | Fires at level 2 (2 coins) |
| TS-10 | Koi caught | Wheel 150 ticks; run timer unchanged during it; result applied |
| TS-11 | Combo 15 → catch | x3.0 → Fever enters |
| TS-12 | No catch for 120 ticks | Combo 0 |
| TS-13 | Jellyfish netted | Jam 36 ticks; combo 0 |
| TS-14 | Freeze | Fish positions unchanged for 240 ticks |
| TS-15 | Lightning (Arcade) | 6 highest-value fish take 6 damage |
| TS-16 | 0 coins with bullets in flight | Session ends only after they resolve |
| TS-17 | Replay | 10 seeds × robot input logs → identical event hashes (Node and Chrome) |
| TS-18 | Lint | No trig, `Math.random`, `Date` or DOM in `src/sim/` |

Persistence, accessibility, performance and smoke tests carry over from v0.2.2 Section 12 (60 fps on a mid Android with 30 fish and 60 particles).

---

## 12. Build Order

| Milestone | Scope | Exit |
|-----------|-------|------|
| **S1 Rules** | New sim (both modes), robot shooter, tests TS-01–TS-18, Reef return check, Arcade balance run | All tests pass; Arcade bands set from robot data |
| **S2 Look** | Landscape display, glowing sea, ice frame, all fish art, cannon, nets, HUD, big-win overlays | Screenshots approved by owner |
| **S3 Features** | Prize wheel, power-ups, capsules, boss, Fever visuals, Reef cannon-level UI | Full runs in both modes in Chrome |
| **S4 Wrapper** | Title + mode select, results, settings, leaderboard, save v3, audio, onboarding captions | Smoke list passes on phone and desktop |
| **S5 Playtest** | 5+ players; tune | Bands confirmed; Q2 decided |

---

## Appendix A. Decisions (2026-11-08)

| ID | Question | Decision |
|----|----------|----------|
| Q1 | Name | **Harvest Tide** |
| Q2 | Reef payback | ~~97%~~ **105%** (D22) |
| Q3 | Reef coins between visits | **Fresh 1,000 each visit** |
| Q4 | Upgrades | **Not in MVP** |

*End of reel-rush-spec-v0.3.md*
