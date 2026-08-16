import { describe, it, expect } from 'vitest';
import { SAMPLE_LIBRARY, getSampleDef } from './samples';

describe('samples manifest', () => {
  it('exposes a non-empty library', () => {
    expect(SAMPLE_LIBRARY.length).toBeGreaterThan(0);
  });

  it('every sample has a unique id and required fields', () => {
    const ids = new Set(SAMPLE_LIBRARY.map(s => s.id));
    expect(ids.size).toBe(SAMPLE_LIBRARY.length);
    for (const s of SAMPLE_LIBRARY) {
      expect(s.name).toBeTruthy();
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.sizeBytes).toBeGreaterThan(0);
      expect(s.license).toBeTruthy();
      expect(s.attribution).toBeTruthy();
      expect(['melodic', 'percussive', 'fx']).toContain(s.category);
    }
  });

  it('getSampleDef returns the matching definition', () => {
    const def = getSampleDef('kalimba');
    expect(def?.name).toBe('Kalimba');
  });

  it('getSampleDef returns undefined for unknown id', () => {
    expect(getSampleDef('does-not-exist')).toBeUndefined();
  });
});
