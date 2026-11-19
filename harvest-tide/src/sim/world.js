// Fish, curved paths, spawning, boss and capsule timing. Spec 3.4.
import { emit } from './events.js';
import { weightedPick } from './rng.js';

/** Quadratic Bézier point at t in [0, 1]. Polynomials only (determinism rule 5.3). */
export function bezier(p0, p1, p2, t) {
  const u = 1 - t;
  return { x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y };
}

function pathLength(p0, p1, p2) {
  let len = 0, prev = p0;
  for (let i = 1; i <= 12; i++) {
    const q = bezier(p0, p1, p2, i / 12);
    const dx = q.x - prev.x, dy = q.y - prev.y;
    len += Math.sqrt(dx * dx + dy * dy);
    prev = q;
  }
  return len;
}

/** Arcade speed multiplier: ramps from arcadeSpeed.start (0:00) to .end (1:00). Reef stays at 1. */
export function speedMult(S) {
  if (S.mode !== 'arcade') return 1;
  const r = S.cfg.world.arcadeSpeed;
  const e = Math.min(1, Math.max(0, 1 - S.remaining / S.cfg.run.durationTicks));
  return r.start + (r.end - r.start) * e;
}

/** A new path crossing the screen. Boss paths cross the middle slowly. */
function makePath(S, kind, speedFactor = 1) {
  const w = S.cfg.world, f = S.cfg.fish[kind], rng = S.rng.paths, W = S.cfg.field.w;
  const margin = f.size[0] / 2 + 40;
  const fromLeft = rng.next() < 0.5;
  let p0, p1, p2;
  if (f.boss) {
    p0 = { x: fromLeft ? -margin : W + margin, y: rng.intRange(260, 360) };
    p1 = { x: W / 2, y: rng.intRange(200, 320) };
    p2 = { x: fromLeft ? W + margin : -margin, y: rng.intRange(260, 360) };
  } else {
    p0 = { x: fromLeft ? -margin : W + margin, y: rng.intRange(w.pathYMin, w.pathYMax) };
    p1 = { x: rng.intRange(w.ctrlXMin, w.ctrlXMax), y: rng.intRange(w.pathYMin - 40, w.pathYMax + 40) };
    p2 = { x: fromLeft ? W + margin : -margin, y: rng.intRange(w.pathYMin, w.pathYMax) };
  }
  const pxPerTick = f.speed * speedMult(S) * speedFactor / S.cfg.tickRateHz;
  const ticks = Math.max(60, Math.ceil(pathLength(p0, p1, p2) / pxPerTick));
  return { p0, p1, p2, ticks };
}

function makeFish(S, kind, path, off, age) {
  const f = S.cfg.fish[kind];
  const fish = {
    uid: S.nextUid++, kind, hp: f.hp, maxHp: f.hp, r: f.r, path, off, age, zig: f.zig || 0,
    x: 0, y: 0, dirX: path.p2.x > path.p0.x ? 1 : -1, hitTick: -1, alive: true,
  };
  placeFish(fish);
  S.fish.push(fish);                                   // uids increase, so S.fish stays sorted
  return fish;
}

function placeFish(fish) {
  const t = Math.min(1, fish.age / fish.path.ticks);
  const p = bezier(fish.path.p0, fish.path.p1, fish.path.p2, t);
  // zigzag fish dart up and down in a triangle wave (integer maths, no trig)
  let dy = 0;
  if (fish.zig) { const k = fish.age % 48; dy = ((k < 24 ? k : 48 - k) / 24 * 2 - 1) * fish.zig; }
  fish.x = p.x + fish.off.x; fish.y = p.y + fish.off.y + dy;
}

/** Spawn one group of `kind`. `startFrac` > 0 places it part-way along its path (initial fill). */
export function spawnGroup(S, kind, startFrac = 0, opts = {}) {
  const f = S.cfg.fish[kind], rng = S.rng.spawn;
  const n = opts.count || rng.intRange(f.group[0], f.group[1]);
  const path = makePath(S, kind, opts.speed || 1);
  const age = Math.floor(path.ticks * startFrac);
  const spread = S.cfg.world.schoolSpreadPx;
  const made = [];
  for (let i = 0; i < n; i++) {
    const off = i === 0 ? { x: 0, y: 0 }
      : { x: (i % 3 - 1) * spread + rng.intRange(-8, 8), y: (Math.floor(i / 3) - 1) * spread * 0.7 + rng.intRange(-8, 8) };
    made.push(makeFish(S, kind, path, off, age));
  }
  emit(S, 'fish:spawn', { kind, count: n, uids: made.map(m => m.uid) });
  return made;
}

function countLive(S) { let n = 0; for (const f of S.fish) if (!S.cfg.fish[f.kind].capsule && !S.cfg.fish[f.kind].boss) n++; return n; }
function has(S, kind) { return S.fish.some(f => f.kind === kind); }

function spawnWeights(S) {
  const w = {}, src = S.cfg.world.weights;
  for (const k in src) {
    if (S.mode === 'reef' && S.cfg.world.reefExclude.includes(k)) continue;
    if (k === 'golden_koi' && S.fish.filter(f => f.kind === k).length >= S.cfg.world.koiMax) continue;
    w[k] = src[k];
  }
  return w;
}

export function initialFill(S) {
  const target = S.cfg.world.targetFishCount * S.cfg.world.initialFillFrac;
  let guard = 0;
  while (countLive(S) < target && guard++ < 50) {
    spawnGroup(S, weightedPick(S.rng.spawn, spawnWeights(S)), 0.12 + S.rng.spawn.next() * 0.6);
  }
}

/** Spec 3.12 step 5: move fish, spawn, boss, capsule. */
export function tickWorld(S) {
  const frozen = S.power.freezeLeft > 0;
  if (!frozen) {
    for (const f of S.fish) { f.age++; placeFish(f); }
  }
  const w = S.cfg.world;
  const target = w.targetFishCount * (S.combo.feverActive ? w.feverTargetMult : 1);
  if (!frozen && S.worldTicks % w.spawnEveryTicks === 0 && countLive(S) < target) {
    spawnGroup(S, weightedPick(S.rng.spawn, spawnWeights(S)));
  }
  // boss
  if (S.mode === 'arcade' && S.remaining === S.cfg.run.sprintTicks) emit(S, 'sprint:start', {});
  if (S.mode === 'arcade' && S.remaining === S.cfg.run.tideFromRemaining) emit(S, 'tide:start', {});
  if (S.mode === 'arcade' && S.remaining === S.cfg.run.tideFromRemaining - S.cfg.run.tideTicks) emit(S, 'tide:end', {});
  if (S.mode === 'arcade' && !frozen) {
    const g = S.cfg.goals, idx = Math.floor(S.worldTicks / g.everyTicks);
    if (S.worldTicks % g.everyTicks === 0 && (!S.goal || S.goal.index !== idx)) {
      const e = g.list[idx % g.list.length];
      S.goal = { index: idx, kind: e.kind, need: e.need, have: 0, done: false };
      emit(S, 'goal:new', { kind: e.kind, need: e.need });
    }
    const fr = S.cfg.world.frenzy;
    if (S.worldTicks > 0 && S.worldTicks % fr.everyTicks === 0) {
      spawnGroup(S, 'sardine', 0, { count: fr.count, speed: fr.speed });
      emit(S, 'frenzy:start', {});
    }
  }
  if (S.mode === 'arcade' && S.remaining === w.bossArcadeAtRemainingTicks && !has(S, 'octopus_king')) {
    spawnGroup(S, 'octopus_king'); emit(S, 'boss:enter', {});
  }
  if (S.mode === 'reef' && S.worldTicks > 0 && S.worldTicks % w.bossReefEveryTicks === 0 && !has(S, 'octopus_king')) {
    spawnGroup(S, 'octopus_king'); emit(S, 'boss:enter', {});
  }
  // capsule
  if (S.worldTicks > 0 && S.worldTicks % w.capsuleEveryTicks === 0 && !has(S, 'capsule')) spawnGroup(S, 'capsule');
  S.worldTicks++;
}

/** Spec 3.12 step 8: fish that finished their path leave. */
export function removeExited(S) {
  for (let i = S.fish.length - 1; i >= 0; i--) {
    const f = S.fish[i];
    if (!f.alive) { S.fish.splice(i, 1); continue; }
    if (f.age >= f.path.ticks) {
      S.fish.splice(i, 1);
      emit(S, 'fish:exit', { uid: f.uid, kind: f.kind });
    }
  }
}
