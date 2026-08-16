/**
 * Sample library manifest.
 *
 * This is intentionally DATA-DRIVEN: adding a new sample is a single row in
 * `SAMPLE_LIBRARY` — no per-sample code changes. Samples are fetched at runtime
 * from a remote endpoint, validated, and cached by `SampleLoader`.
 *
 * All samples are sourced from the OLPC Berklee Sound Library
 * (https://wiki.laptop.org/go/Sound_samples), licensed CC BY 3.0. Attribution
 * is recorded per-sample below and in `docs/sample-attribution.md`.
 */

export type SampleCategory = 'melodic' | 'percussive' | 'fx';

export interface SampleDef {
  id: string;
  name: string;
  category: SampleCategory;
  /** Remote URL the audio is fetched from. */
  url: string;
  /** Expected size in bytes (used for runtime validation). */
  sizeBytes: number;
  /** Short human-readable license. */
  license: string;
  /** Attribution line for the source. */
  attribution: string;
}

const BERKLEE_BASE = 'https://raw.githubusercontent.com/Tonejs/audio/master/berklee';
const BERKLEE_LICENSE = 'CC BY 3.0';
const BERKLEE_ATTRIBUTION = 'OLPC Berklee Sound Library (CC BY 3.0)';

/**
 * Curated, child-safe, non-drum textures. Kept small and melodic/percussive so
 * they layer well with the existing drum kit without adding more drums.
 */
export const SAMPLE_LIBRARY: SampleDef[] = [
  {
    id: 'kalimba',
    name: 'Kalimba',
    category: 'melodic',
    url: `${BERKLEE_BASE}/Kalimba_1.mp3`,
    sizeBytes: 8723,
    license: BERKLEE_LICENSE,
    attribution: BERKLEE_ATTRIBUTION,
  },
  {
    id: 'pling',
    name: 'Pling',
    category: 'melodic',
    url: `${BERKLEE_BASE}/Pling1.mp3`,
    sizeBytes: 49560,
    license: BERKLEE_LICENSE,
    attribution: BERKLEE_ATTRIBUTION,
  },
  {
    id: 'bell',
    name: 'Bell',
    category: 'melodic',
    url: `${BERKLEE_BASE}/bell1.mp3`,
    sizeBytes: 21351,
    license: BERKLEE_LICENSE,
    attribution: BERKLEE_ATTRIBUTION,
  },
  {
    id: 'chime',
    name: 'Chime',
    category: 'melodic',
    url: `${BERKLEE_BASE}/chime_1.mp3`,
    sizeBytes: 34821,
    license: BERKLEE_LICENSE,
    attribution: BERKLEE_ATTRIBUTION,
  },
  {
    id: 'chimes-singlenote',
    name: 'Chimes (single)',
    category: 'melodic',
    url: `${BERKLEE_BASE}/chimes-singlenote.mp3`,
    sizeBytes: 15216,
    license: BERKLEE_LICENSE,
    attribution: BERKLEE_ATTRIBUTION,
  },
  {
    id: 'anklung',
    name: 'Anklung',
    category: 'melodic',
    url: `${BERKLEE_BASE}/anklung_1.mp3`,
    sizeBytes: 5524,
    license: BERKLEE_LICENSE,
    attribution: BERKLEE_ATTRIBUTION,
  },
  {
    id: 'bamboonaphone',
    name: 'Bamboonaphone',
    category: 'melodic',
    url: `${BERKLEE_BASE}/bamboonaphone_1.mp3`,
    sizeBytes: 39841,
    license: BERKLEE_LICENSE,
    attribution: BERKLEE_ATTRIBUTION,
  },
  {
    id: 'bike-bell',
    name: 'Bike Bell',
    category: 'fx',
    url: `${BERKLEE_BASE}/bike_bell_1.mp3`,
    sizeBytes: 3859,
    license: BERKLEE_LICENSE,
    attribution: BERKLEE_ATTRIBUTION,
  },
  {
    id: 'cowbell',
    name: 'Cowbell',
    category: 'percussive',
    url: `${BERKLEE_BASE}/cowbell1_big.mp3`,
    sizeBytes: 8923,
    license: BERKLEE_LICENSE,
    attribution: BERKLEE_ATTRIBUTION,
  },
  {
    id: 'egg-shaker',
    name: 'Egg Shaker',
    category: 'percussive',
    url: `${BERKLEE_BASE}/egg_shaker1.mp3`,
    sizeBytes: 7557,
    license: BERKLEE_LICENSE,
    attribution: BERKLEE_ATTRIBUTION,
  },
];

export function getSampleDef(id: string): SampleDef | undefined {
  return SAMPLE_LIBRARY.find(s => s.id === id);
}
