// Nets, damage (Arcade), chance rolls (Table), payouts, big-win tiers, wheel trigger. Spec 3.3, 3.5, 3.9.
import { emit } from './events.js';
import { multiplier, comboGain, comboBreak } from './combo.js';
import { startWheel } from './wheel.js';
import { grantRandomPower } from './powerups.js';

export function wheelEV(cfg) {
  const s = cfg.wheel.segments;
  return s.reduce((a, b) => a + b, 0) / s.length;
}

/** Catch chance for one fish in a net of k paying fish (Table). */
export function catchChance(cfg, kind, k) {
  const f = cfg.fish[kind];
  return cfg.table.rtp / (f.pay * k * (f.wheel ? wheelEV(cfg) : 1));
}

function tierFor(S, amount, bet) {
  const t = S.mode === 'arcade' ? S.cfg.bigwin.arcade : S.cfg.bigwin.table;
  const v = S.mode === 'arcade' ? amount : amount / bet;
  return v >= t[2] ? 3 : v >= t[1] ? 2 : v >= t[0] ? 1 : 0;
}

/** Credit a finished catch (after any wheel). */
export function credit(S, kind, amount, { bet = 0, x = 0, y = 0, wheel = 1 } = {}) {
  if (S.mode === 'arcade') S.score += amount;
  else { S.bank += amount; if (S.bank > S.peakBank) S.peakBank = S.bank; }
  if (amount > S.biggest.amount) S.biggest = { kind, amount, x: S.mode === 'table' && bet ? amount / bet : 0 };
  const tier = tierFor(S, amount, bet);
  emit(S, 'catch:credit', { kind, amount, x, y, wheel, tier });
  if (tier) emit(S, 'bigwin', { tier, kind, amount });
}

function kill(S, f) {
  f.alive = false;
  S.catches[f.kind] = (S.catches[f.kind] || 0) + 1;
}

/** One fish caught. Arcade: score with multiplier then combo gain. Table: payout at `bet`. */
function onCaught(S, f, bet) {
  const def = S.cfg.fish[f.kind];
  kill(S, f);
  if (def.capsule) { emit(S, 'catch', { uid: f.uid, kind: f.kind, x: f.x, y: f.y, amount: 0 }); grantRandomPower(S); return; }
  if (S.mode === 'arcade') {
    const amt = Math.floor(def.points * multiplier(S));
    emit(S, 'catch', { uid: f.uid, kind: f.kind, x: f.x, y: f.y, amount: amt });
    if (def.wheel) startWheel(S, { kind: f.kind, base: amt, bet: 0, x: f.x, y: f.y });
    else credit(S, f.kind, amt, { x: f.x, y: f.y });
    comboGain(S);
  } else {
    const amt = bet * def.pay;
    emit(S, 'catch', { uid: f.uid, kind: f.kind, x: f.x, y: f.y, amount: amt });
    if (def.wheel) startWheel(S, { kind: f.kind, base: amt, bet, x: f.x, y: f.y });
    else credit(S, f.kind, amt, { bet, x: f.x, y: f.y });
  }
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
 * Open a net at (x, y) for a bullet with `bet` (Table) and resolve it.
 * @returns {boolean} true if the net held a paying fish (Table: false → refund)
 */
export function resolveNet(S, x, y, bet) {
  const cfg = S.cfg;
  const r = cfg.net.radiusPx * (S.combo.feverActive ? cfg.net.feverRadiusMult : 1);
  const netted = fishInCircle(S, x, y, r, cfg.net.maxFish);
  emit(S, 'net', { x, y, r, uids: netted.map(f => f.uid) });
  let paying = 0;
  if (S.mode === 'arcade') {
    for (const f of netted) {
      const def = cfg.fish[f.kind];
      if (def.hazard) { kill(S, f); emit(S, 'sting', { uid: f.uid, x: f.x, y: f.y }); S.jamLeft = cfg.cannon.arcade.jamTicks; comboBreak(S, 'sting'); continue; }
      f.hp -= 1; f.hitTick = S.tick;
      if (f.hp <= 0) onCaught(S, f, 0);
      else emit(S, 'fish:hit', { uid: f.uid, hp: f.hp });
    }
    return netted.length > 0;
  }
  const payers = netted.filter(f => cfg.fish[f.kind].pay > 0);
  for (const f of netted) if (cfg.fish[f.kind].capsule) onCaught(S, f, bet);
  const k = payers.length;
  for (const f of payers) {
    f.hitTick = S.tick;
    if (S.rng.catch.next() < catchChance(cfg, f.kind, k)) onCaught(S, f, bet);
    else emit(S, 'fish:hit', { uid: f.uid, hp: f.hp });
    paying++;
  }
  return paying > 0;
}

/** Lightning power-up: top-value fish on screen. Arcade: damage. Table: free rolls at the current bet. */
export function lightning(S) {
  const cfg = S.cfg, P = cfg.powerups;
  const val = f => (S.mode === 'arcade' ? cfg.fish[f.kind].points : cfg.fish[f.kind].pay);
  const cands = S.fish.filter(f => f.alive && val(f) > 0 && f.x > cfg.field.x0 && f.x < cfg.field.x1 && f.y > 0 && f.y < cfg.field.h);
  cands.sort((a, b) => val(b) - val(a) || a.uid - b.uid);
  const targets = cands.slice(0, P.lightningTargets);
  emit(S, 'lightning', { targets: targets.map(f => ({ uid: f.uid, x: f.x, y: f.y })) });
  if (S.mode === 'arcade') {
    for (const f of targets) {
      f.hp -= P.lightningDamage; f.hitTick = S.tick;
      if (f.hp <= 0) onCaught(S, f, 0); else emit(S, 'fish:hit', { uid: f.uid, hp: f.hp });
    }
  } else {
    const k = targets.length;
    for (const f of targets) {
      f.hitTick = S.tick;
      if (S.rng.catch.next() < catchChance(cfg, f.kind, k)) onCaught(S, f, S.bet);
      else emit(S, 'fish:hit', { uid: f.uid, hp: f.hp });
    }
  }
}
