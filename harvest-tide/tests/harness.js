// Minimal test harness that runs the same in Node and the browser. No dependencies.
export const tests = [];

export function test(name, fn) { tests.push({ name, fn }); }

export class AssertionError extends Error {}

export function ok(cond, msg = 'expected true') { if (!cond) throw new AssertionError(msg); }

export function eq(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new AssertionError(`${msg ? msg + ': ' : ''}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function close(actual, expected, eps = 1e-9, msg = '') {
  if (Math.abs(actual - expected) > eps) {
    throw new AssertionError(`${msg ? msg + ': ' : ''}expected ≈${expected}, got ${actual}`);
  }
}

export function throws(fn, msg = 'expected an error') {
  try { fn(); } catch (e) { return e; }
  throw new AssertionError(msg);
}

/** Run every registered test. Returns {passed, failed, skipped, results}. */
export async function runAll(onResult = () => {}) {
  const results = [];
  for (const t of tests) {
    const r = { name: t.name, status: 'pass', error: null };
    try {
      const out = await t.fn();
      if (out === 'skip') r.status = 'skip';
    } catch (e) {
      r.status = 'fail';
      r.error = e && e.stack ? e.stack : String(e);
    }
    results.push(r);
    onResult(r);
  }
  return {
    passed: results.filter(r => r.status === 'pass').length,
    failed: results.filter(r => r.status === 'fail').length,
    skipped: results.filter(r => r.status === 'skip').length,
    results,
  };
}
