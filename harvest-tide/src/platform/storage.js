// Save data (spec 5.4). Key prefix "harvesttide:" because every game on one github.io site shares localStorage.
const KEY = 'harvesttide:save';

const DEFAULTS = () => ({
  schemaVersion: 1,
  settings: { reducedMotion: false, muted: false, haptics: true },
  stats: { bestArcade: 0, bestTablePeak: 0, runsArcade: 0, sessionsTable: 0 },
  localRuns: { arcade: [], table: [] },
  tutorial: { completed: false },
});

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { data: DEFAULTS(), loadFailed: false };
    const data = JSON.parse(raw);
    if (!data || data.schemaVersion !== 1) return { data: DEFAULTS(), loadFailed: true };
    const d = DEFAULTS();
    return { data: { ...d, ...data, settings: { ...d.settings, ...data.settings }, stats: { ...d.stats, ...data.stats },
                     localRuns: { ...d.localRuns, ...data.localRuns } }, loadFailed: false };
  } catch {
    return { data: DEFAULTS(), loadFailed: true };
  }
}

export function writeSave(data) {
  try { window.localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; }
}
