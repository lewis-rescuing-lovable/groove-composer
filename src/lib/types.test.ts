import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  DRUM_SOUNDS,
  DRUM_LABELS,
  createEmptyDrumGrid,
  generateId,
  midiToFrequency,
  DEFAULT_SYNTH_VOICE,
  PIANO_VOICE,
} from './types';

describe('DRUM_SOUNDS', () => {
  it('exposes all 8 drum sounds', () => {
    expect(DRUM_SOUNDS).toEqual([
      'kick',
      'snare',
      'hihat-closed',
      'hihat-open',
      'clap',
      'tom',
      'cymbal',
      'rimshot',
    ]);
  });

  it('has a label for every sound', () => {
    for (const sound of DRUM_SOUNDS) {
      expect(DRUM_LABELS[sound]).toBeTruthy();
    }
  });
});

describe('createEmptyDrumGrid', () => {
  it('creates a grid with the given number of steps for every sound', () => {
    const grid = createEmptyDrumGrid(16);
    expect(Object.keys(grid)).toHaveLength(DRUM_SOUNDS.length);
    for (const sound of DRUM_SOUNDS) {
      expect(grid[sound]).toHaveLength(16);
      expect(grid[sound].every(step => step === false)).toBe(true);
    }
  });

  it('handles zero and odd step counts', () => {
    expect(createEmptyDrumGrid(0)['kick']).toHaveLength(0);
    expect(createEmptyDrumGrid(7)['snare']).toHaveLength(7);
  });
});

describe('generateId', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns a string of length 8', () => {
    expect(generateId()).toMatch(/^[a-z0-9]{8}$/);
  });

  it('produces distinct ids across calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBeGreaterThan(50);
  });

  it('uses Math.random under the hood', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(typeof generateId()).toBe('string');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('midiToFrequency', () => {
  it('maps A4 (MIDI 69) to 440 Hz', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 5);
  });

  it('maps C4 (MIDI 60) to ~261.63 Hz', () => {
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 1);
  });

  it('is an octave up for +12 semitones', () => {
    expect(midiToFrequency(81)).toBeCloseTo(midiToFrequency(69) * 2, 5);
  });
});

describe('DEFAULT_SYNTH_VOICE', () => {
  it('has a valid waveform and envelope values', () => {
    expect(['sine', 'square', 'sawtooth', 'triangle']).toContain(DEFAULT_SYNTH_VOICE.waveform);
    expect(DEFAULT_SYNTH_VOICE.filterCutoff).toBeGreaterThan(0);
    expect(DEFAULT_SYNTH_VOICE.sustain).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_SYNTH_VOICE.sustain).toBeLessThanOrEqual(1);
  });
});

describe('PIANO_VOICE', () => {
  it('uses a soft triangle wave with a fast attack and long release', () => {
    expect(PIANO_VOICE.waveform).toBe('triangle');
    expect(PIANO_VOICE.attack).toBeLessThanOrEqual(0.01);
    expect(PIANO_VOICE.release).toBeGreaterThanOrEqual(0.5);
    expect(PIANO_VOICE.sustain).toBeLessThan(0.5);
  });
});
