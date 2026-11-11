// Prize wheel. Spec 3.7. Result is drawn when the spin is queued; the animation only reveals it.
// Several spins triggered together play one after another.
import { emit } from './events.js';
import { credit } from './catch.js';
import { grantRandomPower } from './powerups.js';

export function startWheel(S, { kind, base, cost, x, y, lucky = false }) {
  const segs = S.cfg.wheel.segments;
  const index = S.rng.wheel.intRange(0, segs.length - 1);
  const w = { kind, base, cost, x, y, lucky, index, mult: segs[index], left: S.cfg.wheel.spinTicks, total: S.cfg.wheel.spinTicks };
  if (S.wheel) { S.wheelQueue.push(w); return; }
  begin(S, w);
}

function begin(S, w) {
  S.wheel = w;
  S.state = 'WHEEL';
  emit(S, 'wheel:start', { index: w.index, mult: w.mult, kind: w.kind, base: w.base, lucky: w.lucky });
}

/** Spec 3.12 step 2. Returns true while a wheel is up (rest of the tick is skipped, timer paused). */
export function tickWheel(S) {
  if (S.state !== 'WHEEL') return false;
  const w = S.wheel;
  w.left--;
  if (w.left > 0) return true;
  const amount = w.base * w.mult;
  emit(S, 'wheel:end', { index: w.index, mult: w.mult, amount });
  credit(S, w.kind, amount, { cost: w.cost, x: w.x, y: w.y, wheel: w.mult, lucky: w.lucky });
  if (w.index === S.cfg.wheel.powerSegment) grantRandomPower(S);
  S.wheel = null;
  S.state = 'PLAYING';
  if (S.wheelQueue.length) begin(S, S.wheelQueue.shift());
  return true;                                   // the tick a wheel ends is still a paused tick
}
