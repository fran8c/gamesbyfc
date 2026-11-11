// Power-ups: freeze, lock-on, lightning; capsules grant extra uses. Spec 3.8.
import { emit } from './events.js';

export function createPower(cfg, mode) {
  const n = mode === 'arcade' ? cfg.powerups.startArcade : cfg.powerups.startReef;
  const uses = {};
  for (const id of cfg.powerups.ids) uses[id] = n;
  return { uses, freezeLeft: 0, lockonLeft: 0, lockTarget: null };
}

export function grantRandomPower(S) {
  const P = S.cfg.powerups;
  const open = P.ids.filter(id => S.power.uses[id] < P.max);
  if (!open.length) { emit(S, 'power:grant', { id: null }); return; }
  const id = open[S.rng.capsule.intRange(0, open.length - 1)];
  S.power.uses[id]++;
  emit(S, 'power:grant', { id, uses: S.power.uses[id] });
}

/** Highest-value live fish on screen (for lock-on). */
export function bestTarget(S) {
  const cfg = S.cfg, val = f => (S.mode === 'arcade' ? cfg.fish[f.kind].points : cfg.fish[f.kind].reward);
  let best = null;
  for (const f of S.fish) {
    if (!f.alive || val(f) <= 0) continue;
    if (f.x < cfg.field.x0 || f.x > cfg.field.x1 || f.y < 0 || f.y > cfg.field.h - 120) continue;
    if (!best || val(f) > val(best)) best = f;
  }
  return best;
}

/** Use a power-up. Lightning is resolved by the caller (needs catch.js). Returns true if used. */
export function usePower(S, id, onLightning) {
  if (S.state !== 'PLAYING' || !S.power.uses[id]) return false;
  const P = S.cfg.powerups;
  S.power.uses[id]--;
  emit(S, 'power:use', { id, uses: S.power.uses[id] });
  if (id === 'freeze') S.power.freezeLeft = P.freezeTicks;
  else if (id === 'lockon') { S.power.lockonLeft = P.lockonTicks; const t = bestTarget(S); S.power.lockTarget = t ? t.uid : null; }
  else if (id === 'lightning') onLightning(S);
  return true;
}

/** Spec 3.12 step 3. */
export function tickPower(S) {
  const p = S.power;
  if (p.freezeLeft > 0 && --p.freezeLeft === 0) emit(S, 'power:end', { id: 'freeze' });
  if (p.lockonLeft > 0 && --p.lockonLeft === 0) { p.lockTarget = null; emit(S, 'power:end', { id: 'lockon' }); }
}
