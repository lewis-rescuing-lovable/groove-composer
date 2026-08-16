/**
 * Autosave interval parsing/formatting.
 *
 * The interval is stored in seconds. Below 60s it displays as plain seconds
 * (e.g. `30`); at/above 60s it displays as `m:ss` (e.g. `1:30`). The hard
 * maximum is 60:00 (3600s) — anything above that is rejected as invalid.
 */

export const AUTOSAVE_MAX_SECONDS = 60 * 60; // 60:00

/** Format a number of seconds for display, always as `mm:ss`. */
export function formatAutosaveInterval(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Parse a user-entered interval into seconds.
 * Accepts bare seconds (`90`), `m:ss` (`1:30`), or `Nm` (`5m`).
 * Returns null for anything invalid or above the 60:00 hard maximum.
 */
export function parseAutosaveInterval(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Bare seconds
  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    return n >= 1 && n <= AUTOSAVE_MAX_SECONDS ? n : null;
  }

  // m:ss
  const mss = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (mss) {
    const m = Number(mss[1]);
    const s = Number(mss[2]);
    if (s > 59) return null;
    const total = m * 60 + s;
    return total >= 1 && total <= AUTOSAVE_MAX_SECONDS ? total : null;
  }

  // Nm (minutes)
  const nm = trimmed.match(/^(\d+)m$/i);
  if (nm) {
    const total = Number(nm[1]) * 60;
    return total >= 1 && total <= AUTOSAVE_MAX_SECONDS ? total : null;
  }

  return null;
}
