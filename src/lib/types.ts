export type DrumSound = 'kick' | 'snare' | 'hihat-closed' | 'hihat-open' | 'clap' | 'tom' | 'cymbal' | 'rimshot';

export const DRUM_SOUNDS: DrumSound[] = ['kick', 'snare', 'hihat-closed', 'hihat-open', 'clap', 'tom', 'cymbal', 'rimshot'];

export const DRUM_LABELS: Record<DrumSound, string> = {
  'kick': 'Kick',
  'snare': 'Snare',
  'hihat-closed': 'HH Closed',
  'hihat-open': 'HH Open',
  'clap': 'Clap',
  'tom': 'Tom',
  'cymbal': 'Cymbal',
  'rimshot': 'Rimshot',
};

export type ClipType = 'drum' | 'synth' | 'sample';

export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface DrumPattern {
  id: string;
  name: string;
  steps: number;
  grid: Record<DrumSound, boolean[]>;
}

export interface SynthPattern {
  id: string;
  name: string;
  notes: SynthNote[];
}

export interface SynthNote {
  pitch: number; // MIDI note number
  startStep: number;
  duration: number; // in steps
  velocity: number; // 0-1
}

export interface Clip {
  id: string;
  type: ClipType;
  startBeat: number;
  durationBeats: number;
  patternId?: string;
  sampleId?: string;
  /** For sample clips: true = loop for the clip duration, false = one-shot. */
  loop?: boolean;
}

export interface Track {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  clips: Clip[];
}

export interface SampleFile {
  id: string;
  name: string;
  buffer: AudioBuffer | null;
}

export interface DAWProject {
  projectName: string;
  bpm: number;
  timeSignature: [number, number];
  tracks: Track[];
  drumPatterns: DrumPattern[];
  synthPatterns: SynthPattern[];
  masterVolume: number;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
}

export function createEmptyDrumGrid(steps: number): Record<DrumSound, boolean[]> {
  const grid: Partial<Record<DrumSound, boolean[]>> = {};
  for (const sound of DRUM_SOUNDS) {
    grid[sound] = new Array(steps).fill(false);
  }
  return grid as Record<DrumSound, boolean[]>;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
