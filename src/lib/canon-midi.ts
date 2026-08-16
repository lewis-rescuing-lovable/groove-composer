import { midiFileToSynthNotes, type ParsedMidiNote } from './midi';
import { PIANO_VOICE, type SynthNote, type SynthPattern } from './types';

/**
 * A real Pachelbel's Canon in D arrangement, encoded as a Standard MIDI File
 * (format 0) and converted to the app's `SynthNote` format via `midi.ts`.
 *
 * The arrangement has two voices:
 *  - The famous ground bass (8 notes, one per bar).
 *  - A simplified melody line on top.
 *
 * This demonstrates the MIDI → SynthNote pipeline: the bytes are parsed and
 * quantized to sixteenth steps, exactly as a user-supplied .mid file would be.
 */

// ─── Minimal MIDI file builder (format 0) ─────────────────────
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

/** Build a format-0 MIDI file from a list of notes (in ticks). */
function buildMidi(notes: { pitch: number; startTick: number; durationTicks: number; velocity: number }[], division = 480): Uint8Array {
  // Build a sorted list of events: note-on at start, note-off at start+duration.
  const events: { tick: number; type: 'on' | 'off'; pitch: number; velocity: number }[] = [];
  for (const n of notes) {
    events.push({ tick: n.startTick, type: 'on', pitch: n.pitch, velocity: n.velocity });
    events.push({ tick: n.startTick + n.durationTicks, type: 'off', pitch: n.pitch, velocity: 0 });
  }
  // Sort by tick; note-offs before note-ons at the same tick.
  events.sort((a, b) => a.tick - b.tick || (a.type === 'off' ? -1 : 1) - (b.type === 'off' ? -1 : 1));

  const trackData: number[] = [];
  let lastTick = 0;
  for (const e of events) {
    const delta = e.tick - lastTick;
    trackData.push(...vlq(delta), e.type === 'on' ? 0x90 : 0x80, e.pitch, e.type === 'on' ? Math.round(e.velocity * 127) : 0);
    lastTick = e.tick;
  }

  const header = ['M'.charCodeAt(0), 'T'.charCodeAt(0), 'h'.charCodeAt(0), 'd'.charCodeAt(0), ...u32(6), ...u16(0), ...u16(1), ...u16(division)];
  const track = ['M'.charCodeAt(0), 'T'.charCodeAt(0), 'r'.charCodeAt(0), 'k'.charCodeAt(0), ...u32(trackData.length), ...trackData];
  return new Uint8Array([...header, ...track]);
}

// ─── Canon in D arrangement ───────────────────────────────────
// Ground bass: one note per bar (4/4), 8 bars. MIDI pitches.
const BASS = [
  { pitch: 50, bar: 0 }, // D2
  { pitch: 57, bar: 1 }, // A2
  { pitch: 59, bar: 2 }, // B2
  { pitch: 54, bar: 3 }, // F#2
  { pitch: 55, bar: 4 }, // G2
  { pitch: 50, bar: 5 }, // D2
  { pitch: 55, bar: 6 }, // G2
  { pitch: 57, bar: 7 }, // A2
];

// A simple melody line (one bar = 480 ticks = 4 quarter notes).
const MELODY: { pitch: number; startTick: number; durationTicks: number }[] = [
  // Bar 1 (D)
  { pitch: 74, startTick: 0, durationTicks: 240 },
  { pitch: 69, startTick: 240, durationTicks: 240 },
  { pitch: 66, startTick: 480, durationTicks: 240 },
  { pitch: 62, startTick: 720, durationTicks: 240 },
  // Bar 2 (A)
  { pitch: 73, startTick: 960, durationTicks: 240 },
  { pitch: 69, startTick: 1200, durationTicks: 240 },
  { pitch: 65, startTick: 1440, durationTicks: 240 },
  { pitch: 62, startTick: 1680, durationTicks: 240 },
  // Bar 3 (Bm)
  { pitch: 74, startTick: 1920, durationTicks: 240 },
  { pitch: 71, startTick: 2160, durationTicks: 240 },
  { pitch: 66, startTick: 2400, durationTicks: 240 },
  { pitch: 62, startTick: 2640, durationTicks: 240 },
  // Bar 4 (F#m)
  { pitch: 73, startTick: 2880, durationTicks: 240 },
  { pitch: 69, startTick: 3120, durationTicks: 240 },
  { pitch: 66, startTick: 3360, durationTicks: 240 },
  { pitch: 61, startTick: 3600, durationTicks: 240 },
  // Bar 5 (G)
  { pitch: 74, startTick: 3840, durationTicks: 240 },
  { pitch: 71, startTick: 4080, durationTicks: 240 },
  { pitch: 67, startTick: 4320, durationTicks: 240 },
  { pitch: 62, startTick: 4560, durationTicks: 240 },
  // Bar 6 (D)
  { pitch: 74, startTick: 4800, durationTicks: 240 },
  { pitch: 69, startTick: 5040, durationTicks: 240 },
  { pitch: 66, startTick: 5280, durationTicks: 240 },
  { pitch: 62, startTick: 5520, durationTicks: 240 },
  // Bar 7 (G)
  { pitch: 74, startTick: 5760, durationTicks: 240 },
  { pitch: 71, startTick: 6000, durationTicks: 240 },
  { pitch: 67, startTick: 6240, durationTicks: 240 },
  { pitch: 62, startTick: 6480, durationTicks: 240 },
  // Bar 8 (A)
  { pitch: 73, startTick: 6720, durationTicks: 240 },
  { pitch: 69, startTick: 6960, durationTicks: 240 },
  { pitch: 65, startTick: 7200, durationTicks: 240 },
  { pitch: 62, startTick: 7440, durationTicks: 240 },
];

const TICKS_PER_BAR = 480 * 4; // 4 quarter notes per bar

const allNotes: ParsedMidiNote[] = [
  // Bass: whole note per bar (duration = full bar).
  ...BASS.map(({ pitch, bar }) => ({
    pitch,
    startTick: bar * TICKS_PER_BAR,
    durationTicks: TICKS_PER_BAR,
    velocity: 0.8,
  })),
  // Melody: eighth notes.
  ...MELODY.map(({ pitch, startTick, durationTicks }) => ({
    pitch,
    startTick,
    durationTicks,
    velocity: 0.7,
  })),
];

/** The Canon in D as a Standard MIDI File (format 0) byte array. */
export const CANON_MIDI_BYTES: Uint8Array = buildMidi(allNotes);

/** The Canon in D converted to the app's SynthNote format (sixteenth steps). */
export const CANON_SYNTH_NOTES: SynthNote[] = midiFileToSynthNotes(CANON_MIDI_BYTES);

/** The Canon in D as a ready-to-use SynthPattern, played with a piano voice. */
export const CANON_SYNTH_PATTERN: SynthPattern = {
  id: 'canon-pattern',
  name: 'Canon in D',
  notes: CANON_SYNTH_NOTES,
  steps: 128, // 8 bars of 4/4
  voice: PIANO_VOICE,
  piano: true,
};
