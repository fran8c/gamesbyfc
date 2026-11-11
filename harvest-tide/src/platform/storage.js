// Save data (spec 5.4). Key prefix "harvesttide:" because every game on one github.io site shares localStorage.
const KEY = 'harvesttide:save';

export const DEFAULTS = () => ({
  schemaVersion: 2,
  settings: { music: true, sfx: true, haptics: true, reducedMotion: false, showValues: true },
  stats: { bestArcade: 0, bestReefPeak: 0, runsArcade: 0, sessionsReef: 0 },
  localRuns: { arcade: [], reef: [] },
  tips: { seen: {} },
});

/** v1 saves (Fish Table era) → v2. Never throws. */
function migrate(data) {
  const d = DEFAULTS();
  if (!data || typeof data !== 'object') return d;
  const s = data.settings || {}, st = data.stats || {}, lr = data.localRuns || {};
  return {
    schemaVersion: 2,
    settings: { ...d.settings, ...s, music: s.music ?? !s.muted ?? true, sfx: s.sfx ?? !s.muted ?? true },
    stats: { ...d.stats, ...st, bestReefPeak: st.bestReefPeak ?? st.bestTablePeak ?? 0, sessionsReef: st.sessionsReef ?? st.sessionsTable ?? 0 },
    localRuns: { arcade: Array.isArray(lr.arcade) ? lr.arcade : [], reef: Array.isArray(lr.reef) ? lr.reef : Array.isArray(lr.table) ? lr.table : [] },
    tips: { seen: { ...((data.tips && data.tips.seen) || {}) } },
  };
}

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { data: DEFAULTS(), loadFailed: false };
    return { data: migrate(JSON.parse(raw)), loadFailed: false };
  } catch {
    return { data: DEFAULTS(), loadFailed: true };
  }
}

export function writeSave(data) {
  try { window.localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; }
}

/** Add a finished run to the local top-50. Returns its rank (1-based) or 0 if it did not make the list. */
export function recordRun(save, mode, value) {
  const list = save.localRuns[mode];
  const entry = { v: value, at: Date.now() };
  list.push(entry);
  list.sort((a, b) => b.v - a.v || a.at - b.at);
  if (list.length > 50) list.length = 50;
  return list.indexOf(entry) + 1;
}
