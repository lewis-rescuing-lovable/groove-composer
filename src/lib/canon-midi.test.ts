import { describe, it, expect } from 'vitest';
import { CANON_SYNTH_NOTES, CANON_SYNTH_PATTERN, CANON_MIDI_BYTES } from './canon-midi';
import { parseMidi } from './midi';

describe('canon-midi', () => {
  it('produces a parseable MIDI file', () => {
    const midi = parseMidi(CANON_MIDI_BYTES);
    expect(midi.division).toBe(480);
    // 8 bass notes + 32 melody notes = 40 notes.
    expect(midi.notes).toHaveLength(40);
  });

  it('converts to SynthNotes spanning 8 bars (128 steps)', () => {
    const maxEnd = Math.max(...CANON_SYNTH_NOTES.map(n => n.startStep + n.duration));
    // 8 bars * 16 steps = 128.
    expect(maxEnd).toBe(128);
  });

  it('starts the bass on D2 (pitch 50) at step 0', () => {
    const first = CANON_SYNTH_NOTES.find(n => n.pitch === 50);
    expect(first).toBeDefined();
    expect(first!.startStep).toBe(0);
  });

  it('has a melody note on the downbeat of bar 2 (step 16)', () => {
    const bar2 = CANON_SYNTH_NOTES.find(n => n.startStep === 16);
    expect(bar2).toBeDefined();
  });

  it('exposes a ready-to-use pattern with a piano voice', () => {
    expect(CANON_SYNTH_PATTERN.id).toBe('canon-pattern');
    expect(CANON_SYNTH_PATTERN.notes).toHaveLength(40);
    expect(CANON_SYNTH_PATTERN.steps).toBe(128);
    expect(CANON_SYNTH_PATTERN.voice).toBeDefined();
    expect(CANON_SYNTH_PATTERN.voice!.waveform).toBe('triangle');
    expect(CANON_SYNTH_PATTERN.piano).toBe(true);
  });
});
