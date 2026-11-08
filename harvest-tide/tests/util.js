// Test helpers: build sims and place fish precisely.
import { DEFAULT_CONFIG } from '../src/config/tuning.js';
import { mergeConfig } from '../src/config/loader.js';
import { createRun, step, input } from '../src/sim/runSim.js';

export function cfgWith(over = {}) { return mergeConfig(DEFAULT_CONFIG, over); }

/** A sim with an empty sea (no spawning) unless `fish: true`. */
export function makeSim({ seed = 1, mode = 'arcade', over = {}, fish = false } = {}) {
  const base = fish ? over : mergeDeep({ world: { targetFishCount: 0, capsuleEveryTicks: 1e9, bossArcadeAtRemainingTicks: -1, bossTableEveryTicks: 1e9 } }, over);
  const S = createRun({ config: cfgWith(base), seed, mode });
  if (!fish) S.fish.length = 0;
  return S;
}

function mergeDeep(a, b) {
  const o = JSON.parse(JSON.stringify(a));
  for (const k in b) o[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) ? mergeDeep(o[k] || {}, b[k]) : b[k];
  return o;
}

/** Put a stationary fish of `kind` at (x, y). It never moves (very long path, start = end). */
export function placeFish(S, kind, x, y, extra = {}) {
  const f = S.cfg.fish[kind];
  const path = { p0: { x, y }, p1: { x, y }, p2: { x, y }, ticks: 1e9 };
  const fish = { uid: S.nextUid++, kind, hp: f.hp, maxHp: f.hp, r: f.r, path, off: { x: 0, y: 0 }, age: 0,
                 x, y, dirX: 1, hitTick: -1, alive: true, ...extra };
  S.fish.push(fish);
  return fish;
}

export function run(S, n) {
  const all = [];
  for (let i = 0; i < n && !S.over; i++) for (const e of step(S)) all.push(e);
  return all;
}

export function runUntil(S, pred, limit = 5000) {
  const all = [];
  for (let i = 1; i <= limit && !S.over; i++) {
    const evs = step(S);
    for (const e of evs) all.push(e);
    if (pred(evs, S)) return { events: all, ticks: i };
  }
  return { events: all, ticks: -1 };
}

export const has = (evs, t) => evs.some(e => e.type === t);
export const find = (evs, t) => evs.find(e => e.type === t);
export const count = (evs, t) => evs.filter(e => e.type === t).length;

/** Fire one shot straight at (x, y) and release. */
export function shootAt(S, x, y) { input(S, 'down', x, y); step(S); input(S, 'up', x, y); }

export { input, step };
