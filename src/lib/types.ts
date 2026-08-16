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

/**
 * A synthesizer voice: the oscillator waveform, a low-pass filter, and an
 * ADSR amplitude envelope. Used by the Synth panel to shape preview notes.
 */
export interface SynthVoice {
  waveform: WaveformType;
  /** Low-pass filter cutoff in Hz. */
  filterCutoff: number;
  /** Low-pass filter resonance (Q). */
  filterResonance: number;
  /** Envelope attack time in seconds. */
  attack: number;
  /** Envelope decay time in seconds. */
  decay: number;
  /** Envelope sustain level (0-1). */
  sustain: number;
  /** Envelope release time in seconds. */
  release: number;
}

export const DEFAULT_SYNTH_VOICE: SynthVoice = {
  waveform: 'sawtooth',
  filterCutoff: 1200,
  filterResonance: 1,
  attack: 0.01,
  decay: 0.2,
  sustain: 0.6,
  release: 0.3,
};

/**
 * A piano-like voice: a soft triangle wave with a fast attack, a quick decay
 * to a low sustain, and a longer release — approximating a struck string.
 */
export const PIANO_VOICE: SynthVoice = {
  waveform: 'triangle',
  filterCutoff: 4000,
  filterResonance: 0.5,
  attack: 0.005,
  decay: 0.4,
  sustain: 0.25,
  release: 0.8,
};

/** Convert a MIDI note number to its frequency in Hz (A4 = 440Hz = MIDI 69). */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

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
  /** Number of steps in the pattern (defaults to 16 = one bar of 4/4). */
  steps?: number;
  /** The voice used to play this pattern's notes (defaults to the synth voice). */
  voice?: SynthVoice;
  /** When true, notes are played with the richer multi-oscillator piano synthesis. */
  piano?: boolean;
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
