import { describe, it, expect } from 'vitest';
import { ODE_TO_JOY_SYNTH_NOTES, ODE_TO_JOY_SYNTH_PATTERN, ODE_TO_JOY_MIDI_BYTES } from './ode-to-joy';
import { parseMidi } from './midi';

describe('ode-to-joy', () => {
  it('produces a parseable MIDI file', () => {
    const midi = parseMidi(ODE_TO_JOY_MIDI_BYTES);
    expect(midi.division).toBe(480);
    // 8 phrases of melody + 21 bass notes.
    expect(midi.notes.length).toBeGreaterThan(0);
  });

  it('starts the melody on E4 (pitch 64) at step 0', () => {
    const first = ODE_TO_JOY_SYNTH_NOTES.find(n => n.pitch === 64);
    expect(first).toBeDefined();
    expect(first!.startStep).toBe(0);
  });

  it('has a bass note on the downbeat (pitch 48 = C3)', () => {
    const bass = ODE_TO_JOY_SYNTH_NOTES.find(n => n.pitch === 48);
    expect(bass).toBeDefined();
    expect(bass!.startStep).toBe(0);
  });

  it('exposes a ready-to-use pattern with a piano voice', () => {
    expect(ODE_TO_JOY_SYNTH_PATTERN.id).toBe('ode-to-joy-pattern');
    expect(ODE_TO_JOY_SYNTH_PATTERN.voice).toBeDefined();
    expect(ODE_TO_JOY_SYNTH_PATTERN.piano).toBe(true);
    expect(ODE_TO_JOY_SYNTH_PATTERN.steps).toBeGreaterThan(0);
    // The pattern length should cover the melody (not be absurdly long).
    expect(ODE_TO_JOY_SYNTH_PATTERN.steps).toBeLessThan(1000);
  });
});
