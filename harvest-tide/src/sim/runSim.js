// Run simulation: state, inputs and the authoritative tick order (spec 3.12).
// Pure: no DOM, no clock, no Math.random, no trig. Same seed + same input log => same events.
import { createRng, streamSeed, fnv1a32 } from './rng.js';
import { emit, flush } from './events.js';
import { createCombo, tickCombo, multiplier } from './combo.js';
import { createPower, usePower, tickPower } from './powerups.js';
import { tickCannon, tickBullets, changeLevel, effectiveLevel } from './shots.js';
import { tickWheel } from './wheel.js';
import { lightning, createLucky, luckyNeed } from './catch.js';
import { initialFill, tickWorld, removeExited } from './world.js';

/**
 * @param {{config: object, seed: number, mode: 'arcade'|'reef'}} opts
 */
export function createRun({ config, seed, mode = 'arcade' }) {
  const cfg = config;
  const reef = mode === 'reef';
  const S = {
    cfg, mode, seed: seed >>> 0, tick: 0, worldTicks: 0,
    remaining: reef ? Infinity : cfg.run.durationTicks,
    state: 'PLAYING',
    rng: {
      spawn: createRng(streamSeed(seed, 'spawn')), paths: createRng(streamSeed(seed, 'paths')),
      catch: createRng(streamSeed(seed, 'catch')), wheel: createRng(streamSeed(seed, 'wheel')),
      capsule: createRng(streamSeed(seed, 'capsule')),
    },
    events: [], inputQueue: [], inputLog: [],
    pointer: { activeId: null }, aim: { x: cfg.cannon.pos.x, y: 0 }, firing: false,
    fish: [], bullets: [], nextUid: 1, nextBullet: 1,
    cooldown: 0, jamLeft: 0, reloadLeft: 0, ammo: cfg.cannon.arcade.clipSize,
    coins: reef ? cfg.reef.startCoins : 0, peakCoins: reef ? cfg.reef.startCoins : 0, spent: 0,
    levelChosen: cfg.reef.defaultLevel, level: cfg.reef.defaultLevel, cost: cfg.reef.shotCost[cfg.reef.defaultLevel - 1],
    score: 0, shots: 0, hits: 0, catches: {}, biggest: { kind: null, amount: 0, x: 0 },
    combo: createCombo(), power: createPower(cfg, mode), lucky: createLucky(),
    wheel: null, wheelQueue: [], goal: null, powerMeter: 0,
    over: false, summary: null,
  };
  emit(S, 'run:start', { seed: S.seed, mode });
  initialFill(S);
  return S;
}

/** Queue an input for the current tick.
 *  Pointer: type 'down'|'move'|'up' with x, y, id. Buttons: 'power' (x = index), 'level' (x = +1/-1), 'quit'. */
export function input(S, type, x = 0, y = 0, id = 0) {
  const e = { tick: S.tick, type, x, y, id };
  S.inputQueue.push(e);
  S.inputLog.push(e);
}

function applyInputs(S) {
  const p = S.pointer;
  for (const e of S.inputQueue) {
    switch (e.type) {
      case 'down':
        if (p.activeId !== null) break;
        p.activeId = e.id; S.aim.x = e.x; S.aim.y = e.y; S.firing = true; break;
      case 'move':
        if (e.id === p.activeId) { S.aim.x = e.x; S.aim.y = e.y; } break;
      case 'up':
        if (e.id !== p.activeId) break;
        p.activeId = null; S.firing = false; break;
      case 'power': {
        const id = S.cfg.powerups.ids[e.x];
        if (id) usePower(S, id, lightning);
        break;
      }
      case 'level':
        if (S.mode === 'reef') changeLevel(S, e.x > 0 ? 1 : -1); break;
      case 'quit':
        endRun(S, 'quit'); break;
    }
    if (S.over) break;
  }
  S.inputQueue.length = 0;
}

// ---------- run end ----------

export function endRun(S, reason) {
  if (S.over) return S.summary;
  for (const b of S.bullets) if (b.cost) { S.coins += b.cost; S.spent -= b.cost; }   // leaving: shots in flight cost nothing
  S.bullets = [];
  // pending wheel spins are paid out at their average so nothing is lost by leaving
  if (S.wheel) { S.wheelQueue.unshift(S.wheel); S.wheel = null; }
  for (const w of S.wheelQueue) {
    const amt = w.base * w.mult;
    if (S.mode === 'arcade') S.score += amt; else { S.coins += amt; if (S.coins > S.peakCoins) S.peakCoins = S.coins; }
  }
  S.wheelQueue = [];
  S.state = 'RUN_OVER';
  S.over = true;
  const accuracy = S.shots ? S.hits / S.shots : 0;
  let bonus = 0;
  if (S.mode === 'arcade' && reason === 'timer' && accuracy >= S.cfg.score.accuracyThreshold) {
    bonus = Math.floor(S.score * S.cfg.score.accuracyBonusPct);
    S.score += bonus;
  }
  S.summary = {
    mode: S.mode, seed: S.seed, reason,
    score: S.score, accuracyBonus: bonus, accuracy,
    coins: S.coins, peakCoins: S.peakCoins, startCoins: S.mode === 'reef' ? S.cfg.reef.startCoins : 0, spent: S.spent,
    shots: S.shots, hits: S.hits, catches: { ...S.catches }, biggest: { ...S.biggest },
    bestMultiplier: S.combo.bestMultiplier, luckyCatches: S.lucky.count, ticks: S.tick + 1,
  };
  emit(S, 'run:end', { summary: S.summary });
  return S.summary;
}

function checkEnd(S) {
  if (S.mode === 'arcade') {
    if (S.state !== 'PLAYING') return;
    S.remaining--;
    if (S.remaining === S.cfg.run.warningAtTicks) emit(S, 'timer:warning', {});
    if (S.remaining <= 0) endRun(S, 'timer');
  } else if (S.state === 'PLAYING' && S.bullets.length === 0 && S.coins < S.cfg.reef.shotCost[0]) {
    endRun(S, 'empty');
  }
}

// ---------- the tick ----------

/** Advance exactly one tick in the spec 3.12 order. Returns this tick's events. */
export function step(S) {
  if (S.over) return flush(S);
  applyInputs(S);                       // 1
  const wheelUp = !S.over && tickWheel(S);   // 2 (wheel up → skip 3–10, timer paused)
  if (!S.over && !wheelUp) {
    tickPower(S);                       // 3
    tickCannon(S);                      // 4
    tickWorld(S);                       // 5
    tickBullets(S);                     // 6–7 (hits, nets, catches)
    removeExited(S);                    // 8
    tickCombo(S);                       // 9
  }
  if (!S.over && !wheelUp) checkEnd(S); // 10
  S.tick++;
  return flush(S);                      // 11
}

export { multiplier, effectiveLevel, luckyNeed };

export function hashEvents(events) { return fnv1a32(JSON.stringify(events)); }

/** Replay an input log on a fresh run until it ends (or maxTicks). */
export function replay(opts, log, maxTicks = 200000) {
  const S = createRun(opts);
  const all = [];
  let i = 0;
  while (!S.over && S.tick < maxTicks) {
    while (i < log.length && log[i].tick === S.tick) { const e = log[i++]; input(S, e.type, e.x, e.y, e.id); }
    for (const e of step(S)) all.push(e);
  }
  return { hash: hashEvents(all), summary: S.summary, events: all, S };
}
