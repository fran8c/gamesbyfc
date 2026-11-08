// Config loading and validation. Spec 4.3.
import { DEFAULT_CONFIG, SAFE_RANGES, CANON_LOCK } from './tuning.js';

export function getPath(obj, path) {
  if (path === 'reel.perfectBandWidth') return obj.reel.perfectReleaseMax - obj.reel.perfectReleaseMin;
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setPath(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
  o[keys[keys.length - 1]] = value;
}

export function deepClone(v) { return JSON.parse(JSON.stringify(v)); }

function deepFreeze(o) {
  Object.values(o).forEach(v => { if (v && typeof v === 'object') deepFreeze(v); });
  return Object.freeze(o);
}

/** Deep merge `over` into a clone of `base`. Unknown keys are reported, not merged. */
export function mergeConfig(base, over, problems = [], prefix = '') {
  const out = deepClone(base);
  if (!over) return out;
  for (const [k, v] of Object.entries(over)) {
    const p = prefix ? prefix + '.' + k : k;
    if (!(k in out)) { problems.push({ path: p, kind: 'unknown_key', value: v }); continue; }
    if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = mergeConfig(out[k], v, problems, p);
    else if (typeof v !== typeof out[k]) problems.push({ path: p, kind: 'type', value: v });
    else out[k] = v;
  }
  return out;
}

/**
 * Validate a config. Dev: throws on any problem. Prod: clamps / restores canon and returns problems.
 * @returns {{config: object, problems: object[]}}
 */
export function validateConfig(cfgIn, { dev = false, checkCanon = true, problems = [] } = {}) {
  const cfg = deepClone(cfgIn);
  for (const [path, [min, max]] of Object.entries(SAFE_RANGES)) {
    const v = getPath(cfg, path);
    if (typeof v !== 'number' || Number.isNaN(v)) { problems.push({ path, kind: 'type', value: v }); continue; }
    if (v < min || v > max) {
      problems.push({ path, kind: 'range', value: v, min, max });
      if (path === 'reel.perfectBandWidth') {
        cfg.reel.perfectReleaseMax = cfg.reel.perfectReleaseMin + Math.min(max, Math.max(min, v));
      } else setPath(cfg, path, Math.min(max, Math.max(min, v)));
    }
  }
  if (checkCanon) {
    for (const [path, canon] of Object.entries(CANON_LOCK)) {
      const v = getPath(cfg, path);
      if (v !== canon) { problems.push({ path, kind: 'canon', value: v, canon }); setPath(cfg, path, canon); }
    }
  }
  if (dev && problems.length) {
    const msg = problems.map(p => `${p.path}: ${p.kind} (${JSON.stringify(p.value)})`).join('; ');
    throw new Error('Config invalid: ' + msg);
  }
  return { config: deepFreeze(cfg), problems };
}

/** Defaults < override object (from config.json / URL). */
export function loadConfig(override, { dev = false } = {}) {
  const problems = [];
  const merged = mergeConfig(DEFAULT_CONFIG, override, problems);
  return validateConfig(merged, { dev, problems });
}
