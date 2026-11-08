// Harvest Tide — tuning config. Spec: docs/harvest-tide-spec.md (v0.3.1), Sections 3–4.
// Every gameplay number lives here. Sim code reads config; it never hardcodes values.

function deepFreeze(o) {
  Object.values(o).forEach(v => { if (v && typeof v === 'object') deepFreeze(v); });
  return Object.freeze(o);
}

/** @typedef {typeof DEFAULT_CONFIG} TuningConfig */
export const DEFAULT_CONFIG = deepFreeze({
  schemaVersion: 1,
  tickRateHz: 60,
  run:    { durationTicks: 3600, warningAtTicks: 600 },
  field:  { w: 1280, h: 720, x0: 24, x1: 1256, y0: 24 },        // bullets bounce off x0, x1, y0; leave past h
  cannon: { pos: { x: 640, y: 676 }, muzzlePx: 64,
            minDir: { x: 0.990268, y: -0.139173 },            // 8° above horizontal (cos, -sin)
            arcade: { fireRateTicks: 10, clipSize: 24, reloadTicks: 60, maxBullets: 10, jamTicks: 36 },
            table:  { fireRateTicks: 15, maxBullets: 8 } },
  bullet: { speedPxPerTick: 15, radiusPx: 8, maxBounces: 3, lifeTicks: 150 },
  net:    { radiusPx: 44, maxFish: 5, feverRadiusMult: 1.4 },
  fish: {
    //            hp  points pay  px/s  hit r  group [min,max]  size [w,h]
    sardine:      { hp: 1,  points: 10,   pay: 2,   speed: 150, r: 12, group: [5, 8], size: [44, 18] },
    clownfish:    { hp: 2,  points: 20,   pay: 3,   speed: 125, r: 15, group: [3, 5], size: [46, 30] },
    snapper:      { hp: 3,  points: 30,   pay: 5,   speed: 105, r: 18, group: [2, 3], size: [64, 32] },
    puffer:       { hp: 5,  points: 50,   pay: 8,   speed: 70,  r: 22, group: [1, 1], size: [52, 52] },
    lionfish:     { hp: 8,  points: 80,   pay: 12,  speed: 85,  r: 24, group: [1, 1], size: [84, 50] },
    turtle:       { hp: 15, points: 150,  pay: 20,  speed: 50,  r: 40, group: [1, 1], size: [120, 92] },
    manta:        { hp: 25, points: 250,  pay: 30,  speed: 60,  r: 48, group: [1, 1], size: [170, 100] },
    golden_koi:   { hp: 12, points: 300,  pay: 40,  speed: 165, r: 22, group: [1, 1], size: [92, 44], wheel: true },
    octopus_king: { hp: 80, points: 1500, pay: 100, speed: 32,  r: 90, group: [1, 1], size: [230, 210], boss: true },
    jellyfish:    { hp: 1,  points: 0,    pay: 0,   speed: 40,  r: 18, group: [1, 1], size: [48, 60], hazard: true },
    capsule:      { hp: 1,  points: 0,    pay: 0,   speed: 90,  r: 18, group: [1, 1], size: [40, 40], capsule: true },
  },
  world: {
    targetFishCount: 22, feverTargetMult: 1.5, spawnEveryTicks: 10, initialFillFrac: 0.7,
    weights: { sardine: 22, clownfish: 16, snapper: 14, puffer: 12, lionfish: 10, turtle: 7, manta: 5, golden_koi: 2, jellyfish: 6 },
    tableExclude: ['jellyfish'],
    koiMax: 1,
    pathYMin: 90, pathYMax: 560, ctrlXMin: 256, ctrlXMax: 1024, schoolSpreadPx: 34,
    bossArcadeAtRemainingTicks: 1800, bossTableEveryTicks: 5400, capsuleEveryTicks: 900,
  },
  combo:  { chainTicks: 120, pointsPerTier: 4, multiplierPerTier: 0.5, multiplierCap: 5.0 },
  fever:  { triggerMultiplier: 3.0, durationTicks: 360, fireRateTicks: 7, targetMult: 1.5 },
  wheel:  { segments: [2, 3, 2, 5, 2, 8, 3, 2, 10, 3, 5, 1], powerSegment: 11, spinTicks: 150 },
  powerups: { ids: ['freeze', 'lockon', 'lightning'],
              freezeTicks: 240, lockonTicks: 360, lockonSteer: 0.18,
              lightningTargets: 6, lightningDamage: 6,
              startArcade: 2, startTable: 1, max: 3 },
  table:  { rtp: 0.97, startBank: 1000, betSteps: [1, 2, 5, 10, 20, 50, 100], defaultBet: 10 },
  score:  { accuracyBonusPct: 0.10, accuracyThreshold: 0.5 },
  bigwin: { arcade: [150, 500, 1500], table: [10, 30, 80] },   // Nice, BIG, MEGA (Table: win ÷ bet)
});

/** Tuning levers with safe ranges (spec Section 4). */
export const SAFE_RANGES = deepFreeze({
  'table.rtp':                [0.90, 1.00],
  'net.radiusPx':             [32, 60],
  'cannon.arcade.fireRateTicks': [8, 20],
  'cannon.arcade.clipSize':   [12, 40],
  'combo.chainTicks':         [90, 180],
  'fever.triggerMultiplier':  [2.0, 4.0],
  'world.targetFishCount':    [14, 30],
});

/** Values that must not change in a loaded config. */
export const CANON_LOCK = deepFreeze({
  'run.durationTicks': 3600,
  'tickRateHz': 60,
});
