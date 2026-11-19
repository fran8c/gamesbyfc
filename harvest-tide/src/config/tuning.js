// Harvest Tide — tuning config. Spec: docs/harvest-tide-spec.md (v0.4), Sections 3–4.
// Every gameplay number lives here. Sim code reads config; it never hardcodes values.

function deepFreeze(o) {
  Object.values(o).forEach(v => { if (v && typeof v === 'object') deepFreeze(v); });
  return Object.freeze(o);
}

/** @typedef {typeof DEFAULT_CONFIG} TuningConfig */
export const DEFAULT_CONFIG = deepFreeze({
  schemaVersion: 2,
  tickRateHz: 60,
  run:    { durationTicks: 3600, warningAtTicks: 600, sprintTicks: 600, sprintMult: 1.5,   // Arcade: last 10 s score ×1.5
            tideFromRemaining: 1800, tideTicks: 600, tideMult: 2 },                           // Arcade: golden tide, 30 s→20 s left, points ×2
  field:  { w: 1280, h: 720, x0: 24, x1: 1256, y0: 24 },        // bullets bounce off x0, x1, y0; leave past h
  cannon: { pos: { x: 640, y: 676 }, muzzlePx: 70,
            minDir: { x: 0.990268, y: -0.139173 },            // 8° above horizontal (cos, -sin)
            arcade: { fireRateTicks: 10, clipSize: 24, reloadTicks: 60, maxBullets: 10, jamTicks: 36 },
            reef:   { fireRateTicks: 15, maxBullets: 8 } },
  bullet: { speedPxPerTick: 15, radiusPx: 8, maxBounces: 3, lifeTicks: 150 },
  net:    { radiusPx: 44, maxFish: 5, feverRadiusMult: 1.4 },
  // points = Arcade score; reward = Treasure Reef coins, as a multiple of the shot cost
  fish: {
    sardine:      { hp: 1,  points: 10,   reward: 2,   speed: 150, r: 12, group: [5, 8], size: [44, 18], zig: 10 },
    clownfish:    { hp: 2,  points: 20,   reward: 3,   speed: 125, r: 15, group: [3, 5], size: [46, 30], zig: 14 },
    snapper:      { hp: 3,  points: 30,   reward: 5,   speed: 105, r: 18, group: [2, 3], size: [64, 32] },
    puffer:       { hp: 5,  points: 50,   reward: 8,   speed: 70,  r: 22, group: [1, 1], size: [52, 52] },
    lionfish:     { hp: 8,  points: 80,   reward: 12,  speed: 85,  r: 24, group: [1, 1], size: [84, 50] },
    turtle:       { hp: 15, points: 150,  reward: 20,  speed: 50,  r: 40, group: [1, 1], size: [130, 96] },
    manta:        { hp: 25, points: 250,  reward: 30,  speed: 60,  r: 48, group: [1, 1], size: [170, 110] },
    golden_koi:   { hp: 12, points: 300,  reward: 40,  speed: 165, r: 22, group: [1, 1], size: [92, 44], wheel: true },
    octopus_king: { hp: 80, points: 1500, reward: 100, speed: 32,  r: 90, group: [1, 1], size: [230, 220], boss: true },
    jellyfish:    { hp: 1,  points: 0,    reward: 0,   speed: 40,  r: 18, group: [1, 1], size: [48, 64], hazard: true },
    capsule:      { hp: 1,  points: 0,    reward: 0,   speed: 90,  r: 20, group: [1, 1], size: [44, 44], capsule: true },
  },
  world: {
    targetFishCount: 22, feverTargetMult: 1.5, spawnEveryTicks: 10, initialFillFrac: 0.7,
    // v0.4: more big fish, fewer tiny ones ("more big wins, same average")
    weights: { sardine: 16, clownfish: 13, snapper: 13, puffer: 12, lionfish: 12, turtle: 10, manta: 8, golden_koi: 4, jellyfish: 6 },
    reefExclude: ['jellyfish'],
    koiMax: 1,
    pathYMin: 100, pathYMax: 540, ctrlXMin: 256, ctrlXMax: 1024, schoolSpreadPx: 34,
    bossArcadeAtRemainingTicks: 2400, bossReefEveryTicks: 5400, capsuleEveryTicks: 900,   // Arcade boss: 40 s left (was 30 s)
    // Arcade frenzy: every 15 s a fast school of sardines crosses the screen
    frenzy: { everyTicks: 900, count: 9, speed: 1.7 },
    // Arcade pacing: fish speed ramps from start to end over the 60 s (calm opening, busy finish)
    arcadeSpeed: { start: 0.85, end: 1.2 },
  },
  combo:  { chainTicks: 120, pointsPerTier: 4, multiplierPerTier: 0.5, multiplierCap: 5.0 },
  fever:  { triggerMultiplier: 3.0, durationTicks: 360, fireRateTicks: 7, targetMult: 1.5 },
  // segment values are multipliers; powerSegment also grants a power-up
  wheel:  { segments: [3, 2, 5, 3, 8, 2, 5, 10, 3, 5, 20, 2], powerSegment: 11, spinTicks: 150 },
  powerups: { ids: ['freeze', 'lockon', 'lightning'],
              freezeTicks: 240, lockonTicks: 360, lockonSteer: 0.18,
              lightningTargets: 6, lightningDamage: 6,
              startArcade: 2, startReef: 1, max: 3,
              meterCatches: 30 },                 // Arcade: every 30 catches earns a random power-up
  // Treasure Reef. Cannon level n costs shotCost[n-1] coins per shot.
  // returnRate = base share of each landed shot's cost returned on average; the lucky meter adds the rest
  // (total measured ≈ 105% for a typical player, see spec Section 9).
  reef:   { returnRate: 0.70, startCoins: 1000, shotCost: [1, 2, 5, 10, 20, 50, 100], defaultLevel: 3 },
  // Lucky meter: fills with landed shots. Reef: next landed shot is a guaranteed catch worth
  // ≥ reefMinMult × the average shot cost that filled it. Arcade: next catch spins the prize wheel.
  lucky:  { reefShots: 150, reefMinMult: 30, arcadeHits: 120, arcadeBase: 200 },
  score:  { accuracyBonusPct: 0.10, accuracyThreshold: 0.5 },
  // Arcade goals: a new goal every 15 s; catching `need` of `kind` pays `reward` points
  goals:  { everyTicks: 900, reward: 300, list: [
    { kind: 'turtle', need: 2 }, { kind: 'lionfish', need: 3 }, { kind: 'snapper', need: 4 },
    { kind: 'puffer', need: 3 }, { kind: 'manta', need: 1 } ] },
  bigwin: { arcade: [150, 500, 1500], reef: [10, 30, 80] },   // Nice, BIG, MEGA (Reef: coins ÷ shot cost)
});

/** Tuning levers with safe ranges (spec Section 4). */
export const SAFE_RANGES = deepFreeze({
  'reef.returnRate':          [0.60, 1.10],
  'net.radiusPx':             [32, 60],
  'cannon.arcade.fireRateTicks': [8, 20],
  'cannon.arcade.clipSize':   [12, 40],
  'combo.chainTicks':         [90, 180],
  'fever.triggerMultiplier':  [2.0, 4.0],
  'world.targetFishCount':    [14, 30],
  'lucky.reefShots':          [60, 400],
  'lucky.arcadeHits':         [40, 400],
});

/** Values that must not change in a loaded config. */
export const CANON_LOCK = deepFreeze({
  'run.durationTicks': 3600,
  'tickRateHz': 60,
});
