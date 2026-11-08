// Prize wheel. Spec 3.7. Result is drawn when the wheel starts; the spin only reveals it.
import { emit } from './events.js';
import { credit } from './catch.js';
import { grantRandomPower } from './powerups.js';

export function startWheel(S, { kind, base, bet, x, y }) {
  const segs = S.cfg.wheel.segments;
  const index = S.rng.wheel.intRange(0, segs.length - 1);
  S.wheel = { kind, base, bet, x, y, index, mult: segs[index], left: S.cfg.wheel.spinTicks, total: S.cfg.wheel.spinTicks };
  S.state = 'WHEEL';
  emit(S, 'wheel:start', { index, mult: segs[index], kind, base });
}

/** Spec 3.12 step 2. Returns true while the wheel is up (rest of the tick is skipped). */
export function tickWheel(S) {
  if (S.state !== 'WHEEL') return false;
  const w = S.wheel;
  w.left--;
  if (w.left > 0) return true;
  const amount = w.base * w.mult;
  emit(S, 'wheel:end', { index: w.index, mult: w.mult, amount });
  credit(S, w.kind, amount, { bet: w.bet, x: w.x, y: w.y, wheel: w.mult });
  if (w.index === S.cfg.wheel.powerSegment) grantRandomPower(S);
  S.wheel = null;
  S.state = 'PLAYING';
  return true;                                   // the tick the wheel ends is still a paused tick
}
