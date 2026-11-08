// Arcade combo, multiplier and Harvest Fever. Spec 3.6. (Table mode never calls these.)
import { emit } from './events.js';

export function createCombo() {
  return { points: 0, chainLeft: 0, feverActive: false, feverLeft: 0, feverLockout: false, bestMultiplier: 1 };
}

export function multiplierFor(cfg, points) {
  const c = cfg.combo;
  return Math.min(c.multiplierCap, 1 + c.multiplierPerTier * Math.floor(points / c.pointsPerTier));
}

export function multiplier(S) { return S.mode === 'arcade' ? multiplierFor(S.cfg, S.combo.points) : 1; }

export function comboGain(S) {
  const c = S.combo, before = multiplier(S);
  c.points++;
  c.chainLeft = S.cfg.combo.chainTicks;
  const after = multiplier(S);
  if (after > c.bestMultiplier) c.bestMultiplier = after;
  if (after > before) emit(S, 'combo:tier_up', { multiplier: after });
  if (!c.feverActive && !c.feverLockout && after >= S.cfg.fever.triggerMultiplier) {
    c.feverActive = true; c.feverLeft = S.cfg.fever.durationTicks;
    emit(S, 'fever:enter', { multiplier: after });
  }
}

export function comboBreak(S, reason) {
  const c = S.combo;
  if (c.points === 0 && !c.feverActive) return;
  const prev = c.points;
  c.points = 0; c.chainLeft = 0;
  c.feverLockout = false;                         // Fever may trigger again after a break
  if (c.feverActive) exitFever(S, 'break');
  emit(S, 'combo:break', { reason, prev });
}

function exitFever(S, reason) {
  S.combo.feverActive = false; S.combo.feverLeft = 0; S.combo.feverLockout = reason !== 'break';
  emit(S, 'fever:exit', { reason });
}

/** Spec 3.12 step 9. */
export function tickCombo(S) {
  if (S.mode !== 'arcade') return;
  const c = S.combo;
  if (c.feverActive) {
    c.feverLeft--;
    if (c.feverLeft <= 0) exitFever(S, 'expired');
    return;                                       // chain timer frozen during Fever
  }
  if (c.points > 0) {
    c.chainLeft--;
    if (c.chainLeft <= 0) comboBreak(S, 'timeout');
  }
}
