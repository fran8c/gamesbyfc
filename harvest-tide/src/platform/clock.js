// The only place that reads real time. Fixed 60 Hz simulation ticks via an accumulator. Spec 5.4.
const TICK_MS = 1000 / 60;
const MAX_TICKS_PER_FRAME = 5;

/**
 * @param {(ticks:number) => void} onTicks  run this many sim ticks now
 * @param {(dtMs:number) => void} onFrame   draw (called every animation frame)
 */
export function createClock(onTicks, onFrame) {
  let acc = 0, last = 0, running = false, rafId = 0, dropped = 0;

  function frame(now) {
    if (!running) return;
    const dt = last ? Math.min(250, now - last) : TICK_MS;
    last = now;
    acc += dt;
    let n = 0;
    while (acc >= TICK_MS && n < MAX_TICKS_PER_FRAME) { acc -= TICK_MS; n++; }
    if (acc >= TICK_MS) { dropped += Math.floor(acc / TICK_MS); acc = acc % TICK_MS; }
    if (n) onTicks(n);
    onFrame(dt);
    rafId = requestAnimationFrame(frame);
  }

  return {
    start() { if (running) return; running = true; last = 0; acc = 0; rafId = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(rafId); },
    /** Reset the accumulator so a pause never turns into a burst of catch-up ticks. */
    resync() { last = 0; acc = 0; },
    get dropped() { return dropped; },
  };
}
