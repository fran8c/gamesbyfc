// Node entry: `node tests/run.mjs`. Exit code 1 if anything fails.
import { runAll } from './all.js';

const t0 = Date.now();
const res = await runAll(r => {
  const mark = r.status === 'pass' ? '✓' : r.status === 'skip' ? '-' : '✗';
  console.log(`${mark} ${r.name}`);
  if (r.status === 'fail') console.log('    ' + r.error.split('\n').slice(0, 3).join('\n    '));
});
console.log(`\n${res.passed} passed, ${res.failed} failed, ${res.skipped} skipped (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
process.exit(res.failed ? 1 : 0);
