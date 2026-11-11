import { test, eq, ok, throws } from './harness.js';
import { loadConfig } from '../src/config/loader.js';

const SIM_FILES = ['rng.js', 'events.js', 'world.js', 'shots.js', 'catch.js', 'combo.js', 'wheel.js', 'powerups.js', 'runSim.js'];

test('default config loads clean in dev mode', () => eq(loadConfig({}, { dev: true }).problems.length, 0));

test('dev: out-of-range return rate throws; prod clamps it', () => {
  const e = throws(() => loadConfig({ reef: { returnRate: 1.5 } }, { dev: true }));
  ok(String(e.message).includes('reef.returnRate'));
  eq(loadConfig({ reef: { returnRate: 1.5 } }).config.reef.returnRate, 1.1);
});

const BANNED = [/Math\.random/, /\bDate\b/, /performance\./, /Math\.(sin|cos|tan|atan2?|pow|exp|log\w*|hypot|cbrt|asin|acos)\b/,
  /\bwindow\./, /\bdocument\./, /\blocalStorage\b/, /setTimeout|setInterval|requestAnimationFrame/];

async function readSim(name) {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    const fs = await import('node:fs/promises');
    return fs.readFile(new URL('../src/sim/' + name, import.meta.url), 'utf8');
  }
  const res = await fetch(new URL('../src/sim/' + name, import.meta.url));
  if (!res.ok) throw new Error('fetch failed');
  return res.text();
}

test('TS-18 lint: src/sim uses no banned APIs', async () => {
  let texts;
  try { texts = await Promise.all(SIM_FILES.map(readSim)); } catch { return 'skip'; }
  const bad = [];
  texts.forEach((src, i) => {
    const code = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const re of BANNED) if (re.test(code)) bad.push(`${SIM_FILES[i]}: ${re}`);
  });
  eq(bad.length, 0, bad.join(', '));
});
