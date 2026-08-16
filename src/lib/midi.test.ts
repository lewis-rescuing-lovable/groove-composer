import { describe, it, expect } from 'vitest';
import { parseMidi, midiToSynthNotes, midiFileToSynthNotes, MidiParseError } from './midi';

// ─── Helpers to build a minimal MIDI file in memory ───────────
function vlq(value: number): number[] {
  const bytes: number[] = [];
  let v = value;
  bytes.unshift(v & 0x7f);
  v >>= 7;
  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return bytes;
}

function u16(v: number): number[] {
  return [(v >> 8) & 0xff, v & 0xff];
}

function u32(v: number): number[] {
  return [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff];
}

/** Build a format-0 MIDI file with a single track of note events. */
function buildMidi(events: { delta: number; bytes: number[] }[], division = 480): Uint8Array {
  const trackData: number[] = [];
  for (const e of events) {
    trackData.push(...vlq(e.delta), ...e.bytes);
  }
  const header = ['M'.charCodeAt(0), 'T'.charCodeAt(0), 'h'.charCodeAt(0), 'd'.charCodeAt(0), ...u32(6), ...u16(0), ...u16(1), ...u16(division)];
  const track = ['M'.charCodeAt(0), 'T'.charCodeAt(0), 'r'.charCodeAt(0), 'k'.charCodeAt(0), ...u32(trackData.length), ...trackData];
  return new Uint8Array([...header, ...track]);
}

// A simple two-note sequence: C4 (60) on at tick 0, off at tick 480; E4 (64) on at 480, off at 960.
const twoNotes = buildMidi([
  { delta: 0, bytes: [0x90, 60, 100] },   // note on C4
  { delta: 480, bytes: [0x80, 60, 0] },   // note off C4
  { delta: 0, bytes: [0x90, 64, 80] },    // note on E4
  { delta: 480, bytes: [0x80, 64, 0] },   // note off E4
]);

describe('parseMidi', () => {
  it('parses a simple two-note sequence', () => {
    const midi = parseMidi(twoNotes);
    expect(midi.division).toBe(480);
    expect(midi.notes).toHaveLength(2);
    expect(midi.notes[0]).toMatchObject({ pitch: 60, startTick: 0, durationTicks: 480, velocity: 100 / 127 });
    expect(midi.notes[1]).toMatchObject({ pitch: 64, startTick: 480, durationTicks: 480 });
  });

  it('throws on a non-MIDI file', () => {
    expect(() => parseMidi(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]))).toThrow(MidiParseError);
  });

  it('throws on a file that is too short', () => {
    expect(() => parseMidi(new Uint8Array([0x4d, 0x54]))).toThrow(MidiParseError);
  });

  it('handles note-on with velocity 0 as note-off', () => {
    const midi = buildMidi([
      { delta: 0, bytes: [0x90, 60, 100] },
      { delta: 480, bytes: [0x90, 60, 0] }, // note-on velocity 0 = note off
    ]);
    const parsed = parseMidi(midi);
    expect(parsed.notes).toHaveLength(1);
    expect(parsed.notes[0].durationTicks).toBe(480);
  });

  it('handles running status', () => {
    // Note on C4, then note on E4 with running status (no status byte).
    const midi = buildMidi([
      { delta: 0, bytes: [0x90, 60, 100] },
      { delta: 0, bytes: [64, 80] }, // running status 0x90
      { delta: 480, bytes: [0x80, 60, 0] },
      { delta: 0, bytes: [64, 0] }, // running status 0x80
    ]);
    const parsed = parseMidi(midi);
    expect(parsed.notes).toHaveLength(2);
  });

  it('throws on running status used before any status byte', () => {
    // First event has no status byte (data byte < 0x80).
    const midi = buildMidi([{ delta: 0, bytes: [60, 100] }]);
    expect(() => parseMidi(midi)).toThrow(MidiParseError);
  });

  it('throws on an invalid header length', () => {
    const bytes = new Uint8Array([
      'M'.charCodeAt(0), 'T'.charCodeAt(0), 'h'.charCodeAt(0), 'd'.charCodeAt(0),
      0, 0, 0, 4, // header length 4 (< 6)
      0, 0, 0, 0, 0, 0,
    ]);
    expect(() => parseMidi(bytes)).toThrow(MidiParseError);
  });

  it('throws on SMPTE time division', () => {
    const bytes = new Uint8Array([
      'M'.charCodeAt(0), 'T'.charCodeAt(0), 'h'.charCodeAt(0), 'd'.charCodeAt(0),
      0, 0, 0, 6, 0, 0, 0, 1, 0x80, 0x00, // division with bit 15 set
    ]);
    expect(() => parseMidi(bytes)).toThrow(MidiParseError);
  });

  it('throws on a missing MTrk chunk', () => {
    const bytes = new Uint8Array([
      'M'.charCodeAt(0), 'T'.charCodeAt(0), 'h'.charCodeAt(0), 'd'.charCodeAt(0),
      0, 0, 0, 6, 0, 0, 0, 1, 0x01, 0xe0,
      'X'.charCodeAt(0), 'X'.charCodeAt(0), 'X'.charCodeAt(0), 'X'.charCodeAt(0),
      0, 0, 0, 0,
    ]);
    expect(() => parseMidi(bytes)).toThrow(MidiParseError);
  });

  it('handles control change, program change, and pitch bend events', () => {
    const midi = buildMidi([
      { delta: 0, bytes: [0xb0, 7, 100] }, // control change
      { delta: 0, bytes: [0xc0, 5] },      // program change
      { delta: 0, bytes: [0xe0, 0, 64] }, // pitch bend
      { delta: 0, bytes: [0x90, 60, 100] },
      { delta: 480, bytes: [0x80, 60, 0] },
    ]);
    const parsed = parseMidi(midi);
    expect(parsed.notes).toHaveLength(1);
  });

  it('handles meta events and sysex', () => {
    const midi = buildMidi([
      { delta: 0, bytes: [0xff, 0x51, 3, 0x07, 0xa1, 0x20] }, // tempo meta
      { delta: 0, bytes: [0xf0, 2, 0x7d, 0xf7] },            // sysex
      { delta: 0, bytes: [0x90, 60, 100] },
      { delta: 480, bytes: [0x80, 60, 0] },
    ]);
    const parsed = parseMidi(midi);
    expect(parsed.notes).toHaveLength(1);
  });

  it('closes notes still open at the end of the track', () => {
    // Note on with no matching note off.
    const midi = buildMidi([{ delta: 0, bytes: [0x90, 60, 100] }]);
    const parsed = parseMidi(midi);
    expect(parsed.notes).toHaveLength(1);
    expect(parsed.notes[0].pitch).toBe(60);
  });

  it('throws on a track length exceeding the file size', () => {
    const bytes = new Uint8Array([
      'M'.charCodeAt(0), 'T'.charCodeAt(0), 'h'.charCodeAt(0), 'd'.charCodeAt(0),
      0, 0, 0, 6, 0, 0, 0, 1, 0x01, 0xe0,
      'M'.charCodeAt(0), 'T'.charCodeAt(0), 'r'.charCodeAt(0), 'k'.charCodeAt(0),
      0, 0, 0, 100, // track length 100 > remaining bytes
    ]);
    expect(() => parseMidi(bytes)).toThrow(MidiParseError);
  });
});

describe('midiToSynthNotes', () => {
  it('converts ticks to sixteenth steps (4 per quarter)', () => {
    const midi = parseMidi(twoNotes);
    const notes = midiToSynthNotes(midi);
    // 480 ticks = 1 quarter = 4 steps.
    expect(notes[0]).toMatchObject({ pitch: 60, startStep: 0, duration: 4 });
    expect(notes[1]).toMatchObject({ pitch: 64, startStep: 4, duration: 4 });
  });

  it('respects a custom steps-per-quarter', () => {
    const midi = parseMidi(twoNotes);
    const notes = midiToSynthNotes(midi, { stepsPerQuarter: 1 });
    expect(notes[0].startStep).toBe(0);
    expect(notes[1].startStep).toBe(1);
  });

  it('clamps durations to a minimum', () => {
    const midi = buildMidi([
      { delta: 0, bytes: [0x90, 60, 100] },
      { delta: 1, bytes: [0x80, 60, 0] }, // very short note
    ]);
    const notes = midiToSynthNotes(parseMidi(midi), { minDurationSteps: 2 });
    expect(notes[0].duration).toBe(2);
  });
});

describe('midiFileToSynthNotes', () => {
  it('parses and converts in one call', () => {
    const notes = midiFileToSynthNotes(twoNotes);
    expect(notes).toHaveLength(2);
    expect(notes[0].pitch).toBe(60);
  });
});
