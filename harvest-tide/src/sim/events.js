// Per-tick event queue. Spec 3.9 step 10, 5.2.
// Events are queued during a tick and handed out together at the end of it, in emit order.

export function emit(S, type, data) {
  const e = data ? Object.assign({ type, tick: S.tick }, data) : { type, tick: S.tick };
  S.events.push(e);
  return e;
}

export function flush(S) {
  const out = S.events;
  S.events = [];
  return out;
}
