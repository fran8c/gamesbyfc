// Nets, damage (Arcade), catch chances (Treasure Reef), rewards, lucky meter, big-win tiers.
// Spec 3.3, 3.5, 3.9, 3.13.
import { emit } from './events.js';
import { multiplier, comboGain, comboBreak } from './combo.js';
import { startWheel } from './wheel.js';
import { grantRandomPower } from './powerups.js';

export function wheelEV(cfg) {
  const s = cfg.wheel.segments;
  return s.reduce((a, b) => a + b, 0) / s.length;
}

/** Treasure Reef: chance that one fish in a net of k paying fish is caught. */
export function catchChance(cfg, kind, k) {
  const f = cfg.fish[kind];
  return cfg.reef.returnRate / (f.reward * k * (f.wheel ? wheelEV(cfg) : 1));
}

export function createLucky() {
  return { fill: 0, ready: false, inFlight: false, spent: 0, shots: 0, avgCost: 0, count: 0 };
}

export function luckyNeed(S) { return S.mode === 'arcade' ? S.cfg.lucky.arcadeHits : S.cfg.lucky.reefShots; }

function resetLucky(S) {
  const L = S.lucky;
  L.fill = 0; L.ready = false; L.inFlight = false; L.spent = 0; L.shots = 0; L.avgCost = 0; L.count++;
}

/** One landed shot (Reef: cost of that shot; Arcade: 0) adds to the lucky meter. */
function luckyFill(S, cost) {
  const L = S.lucky;
  if (L.ready) return;
  L.fill++; L.spent += cost; L.shots++;
  if (L.fill >= luckyNeed(S)) {
    L.ready = true;
    L.avgCost = S.mode === 'reef' ? Math.max(1, Math.floor(L.spent / L.shots)) : 0;
    emit(S, 'lucky:ready', { avgCost: L.avgCost });
  }
}

function tierFor(S, amount, cost) {
  const t = S.mode === 'arcade' ? S.cfg.bigwin.arcade : S.cfg.bigwin.reef;
  const v = S.mode === 'arcade' ? amount : amount / Math.max(1, cost);
  return v >= t[2] ? 3 : v >= t[1] ? 2 : v >= t[0] ? 1 : 0;
}

/** Add a finished catch to the score (Arcade) or coins (Reef). Wheel results arrive here too. */
export function credit(S, kind, amount, { cost = 0, x = 0, y = 0, wheel = 1, lucky = false } = {}) {
  if (S.mode === 'arcade') S.score += amount;
  else { S.coins += amount; if (S.coins > S.peakCoins) S.peakCoins = S.coins; }
  if (amount > S.biggest.amount) S.biggest = { kind, amount, x: S.mode === 'reef' && cost ? amount / cost : 0 };
  const tier = tierFor(S, amount, cost);
  emit(S, 'catch:credit', { kind, amount, x, y, wheel, tier, lucky });
  if (tier) emit(S, 'bigwin', { tier, kind, amount, lucky });
}

function kill(S, f) {
  f.alive = false;
  S.catches[f.kind] = (S.catches[f.kind] || 0) + 1;
}

/**
 * A fish is caught.
 * Arcade: points × multiplier, then a combo gain. A ready lucky meter turns this catch into a wheel spin.
 * Reef: `amount` coins (default cost × reward). Golden Koi spins the wheel.
 */
function onCaught(S, f, { cost = 0, amount = null, lucky = false } = {}) {
  const cfg = S.cfg, def = cfg.fish[f.kind];
  kill(S, f);
  if (def.capsule) { emit(S, 'catch', { uid: f.uid, kind: f.kind, x: f.x, y: f.y, dir: f.dirX, amount: 0 }); grantRandomPower(S); return; }
  if (S.mode === 'arcade') {
    const m = multiplier(S);
    let amt = Math.floor(def.points * m);
    const luckyNow = S.lucky.ready;
    if (luckyNow) {
      amt = Math.max(amt, Math.floor(cfg.lucky.arcadeBase * m));
      resetLucky(S);
      emit(S, 'lucky:catch', { kind: f.kind, x: f.x, y: f.y });
    }
    emit(S, 'catch', { uid: f.uid, kind: f.kind, x: f.x, y: f.y, dir: f.dirX, amount: amt, lucky: luckyNow });
    if (def.wheel && luckyNow) {                 // a lucky Golden Koi earns both spins
      startWheel(S, { kind: f.kind, base: Math.floor(def.points * m), cost: 0, x: f.x, y: f.y });
      startWheel(S, { kind: f.kind, base: amt, cost: 0, x: f.x, y: f.y, lucky: true });
    } else if (def.wheel || luckyNow) startWheel(S, { kind: f.kind, base: amt, cost: 0, x: f.x, y: f.y, lucky: luckyNow });
    else credit(S, f.kind, amt, { x: f.x, y: f.y });
    comboGain(S);
    return;
  }
  const amt = amount !== null ? amount : cost * def.reward;
  emit(S, 'catch', { uid: f.uid, kind: f.kind, x: f.x, y: f.y, dir: f.dirX, amount: amt, lucky });
  if (def.wheel) startWheel(S, { kind: f.kind, base: amt, cost, x: f.x, y: f.y, lucky });
  else credit(S, f.kind, amt, { cost, x: f.x, y: f.y, lucky });
}

/** Fish (alive, ascending uid) whose hit circles overlap a circle, nearest first, max n. */
export function fishInCircle(S, x, y, r, n) {
  const hits = [];
  for (const f of S.fish) {
    if (!f.alive) continue;
    const dx = f.x - x, dy = f.y - y, rr = r + f.r;
    const d2 = dx * dx + dy * dy;
    if (d2 <= rr * rr) hits.push({ f, d2 });
  }
  hits.sort((a, b) => a.d2 - b.d2 || a.f.uid - b.f.uid);
  return hits.slice(0, n).map(h => h.f);
}

/**
 * Open a net at (x, y) for bullet `b` and resolve it.
 * @returns {boolean} true if the net held a paying fish (Reef: false → shot cost returned)
 */
export function resolveNet(S, x, y, b) {
  const cfg = S.cfg;
  const r = cfg.net.radiusPx * (S.combo.feverActive ? cfg.net.feverRadiusMult : 1);
  const netted = fishInCircle(S, x, y, r, cfg.net.maxFish);
  emit(S, 'net', { x, y, r, uids: netted.map(f => f.uid), lucky: !!b.lucky });
  if (S.mode === 'arcade') {
    let landed = false;
    for (const f of netted) {
      const def = cfg.fish[f.kind];
      if (def.hazard) { kill(S, f); emit(S, 'sting', { uid: f.uid, x: f.x, y: f.y }); S.jamLeft = cfg.cannon.arcade.jamTicks; comboBreak(S, 'sting'); continue; }
      landed = true;
      f.hp -= 1; f.hitTick = S.tick;
      if (f.hp <= 0) onCaught(S, f);
      else emit(S, 'fish:hit', { uid: f.uid, hp: f.hp });
    }
    if (landed) luckyFill(S, 0);
    return netted.length > 0;
  }
  const payers = netted.filter(f => cfg.fish[f.kind].reward > 0);
  for (const f of netted) if (cfg.fish[f.kind].capsule) onCaught(S, f, { cost: b.cost });
  const k = payers.length;
  if (b.lucky) S.lucky.inFlight = false;
  if (k === 0) return false;
  let top = null;
  if (b.lucky && S.lucky.ready) {
    top = payers.slice().sort((a, c) => cfg.fish[c.kind].reward - cfg.fish[a.kind].reward || a.uid - c.uid)[0];
    const avg = S.lucky.avgCost;
    const amount = Math.max(cfg.fish[top.kind].reward, cfg.lucky.reefMinMult) * avg;
    top.hitTick = S.tick;
    resetLucky(S);
    emit(S, 'lucky:catch', { kind: top.kind, x: top.x, y: top.y, amount });
    onCaught(S, top, { cost: avg, amount, lucky: true });
  }
  for (const f of payers) {
    if (f === top) continue;
    f.hitTick = S.tick;
    if (S.rng.catch.next() < catchChance(cfg, f.kind, k)) onCaught(S, f, { cost: b.cost });
    else emit(S, 'fish:hit', { uid: f.uid, hp: f.hp });
  }
  if (!top) luckyFill(S, b.cost);
  return true;
}

/** Zap power-up: top-value fish on screen. Arcade: damage. Reef: a free shot at the current cost. */
export function lightning(S) {
  const cfg = S.cfg, P = cfg.powerups;
  const val = f => (S.mode === 'arcade' ? cfg.fish[f.kind].points : cfg.fish[f.kind].reward);
  const cands = S.fish.filter(f => f.alive && val(f) > 0 && f.x > cfg.field.x0 && f.x < cfg.field.x1 && f.y > 0 && f.y < cfg.field.h);
  cands.sort((a, b) => val(b) - val(a) || a.uid - b.uid);
  const targets = cands.slice(0, P.lightningTargets);
  emit(S, 'lightning', { targets: targets.map(f => ({ uid: f.uid, x: f.x, y: f.y })) });
  if (S.mode === 'arcade') {
    for (const f of targets) {
      f.hp -= P.lightningDamage; f.hitTick = S.tick;
      if (f.hp <= 0) onCaught(S, f); else emit(S, 'fish:hit', { uid: f.uid, hp: f.hp });
    }
  } else {
    const k = targets.length;
    for (const f of targets) {
      f.hitTick = S.tick;
      if (S.rng.catch.next() < catchChance(cfg, f.kind, k)) onCaught(S, f, { cost: S.cost });
      else emit(S, 'fish:hit', { uid: f.uid, hp: f.hp });
    }
  }
}
