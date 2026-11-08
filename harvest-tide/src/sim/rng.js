// Seeded RNG. Spec 5.3. The ONLY randomness allowed in src/sim/.

/** FNV-1a 32-bit hash of a string. */
export function fnv1a32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * mulberry32 generator.
 * @param {number} seed
 */
export function createRng(seed) {
  let a = seed >>> 0;
  return {
    /** @returns {number} in [0, 1) */
    next() {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** Inclusive integer range. */
    intRange(min, max) { return min + Math.floor(this.next() * (max - min + 1)); },
    /** Uniform float in [min, max). */
    range(min, max) { return min + this.next() * (max - min); },
    get state() { return a >>> 0; },
  };
}

/** Independent stream per subsystem so one system's draws never shift another's. */
export function streamSeed(runSeed, name) { return ((runSeed >>> 0) ^ fnv1a32(name)) >>> 0; }

/** Pick a key from {key: weight}. Key order is insertion order, so this is deterministic. */
export function weightedPick(rng, weights) {
  let total = 0;
  for (const k in weights) total += weights[k];
  let r = rng.next() * total;
  let last = null;
  for (const k in weights) {
    if (weights[k] <= 0) continue;
    last = k;
    r -= weights[k];
    if (r < 0) return k;
  }
  return last;
}

/** Daily seed (used from v2 Daily mode). */
export function dailySeed(isoDateUtc) { return fnv1a32('reel-rush:' + isoDateUtc); }
