import { midiFileToSynthNotes, type ParsedMidiNote } from './midi';
import { PIANO_VOICE, type SynthNote, type SynthPattern } from './types';

/**
 * Beethoven's "Ode to Joy" (from Symphony No. 9), encoded as a Standard MIDI
 * File (format 0) and converted to the app's `SynthNote` format via `midi.ts`.
 *
 * Two voices:
 *  - Right hand: the famous melody (quarter notes, half-note phrase endings).
 *  - Left hand: a simple bass line (half notes).
 *
 * All notes are around middle C, as in the source transcription.
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
  const events: { tick: number; type: 'on' | 'off'; pitch: number; velocity: number }[] = [];
  for (const n of notes) {
    events.push({ tick: n.startTick, type: 'on', pitch: n.pitch, velocity: n.velocity });
    events.push({ tick: n.startTick + n.durationTicks, type: 'off', pitch: n.pitch, velocity: 0 });
  }
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

// ─── Note names → MIDI (middle C = C4 = 60) ──────────────────
const N: Record<string, number> = {
  C: 60, 'C#': 61, D: 62, 'D#': 63, E: 64, F: 65, 'F#': 66, G: 67, 'G#': 68, A: 69, 'A#': 70, B: 71,
};

const Q = 480; // quarter note (ticks)
const H = 960; // half note (ticks)

// ─── Right hand melody ────────────────────────────────────────
// Each phrase is a list of [note, durationTicks]. The last note of each phrase
// is a half note; the rest are quarter notes.
const MELODY: { pitch: number; startTick: number; durationTicks: number }[] = [];
let t = 0;
const phrases: [string, number][][] = [
  [['E', Q], ['E', Q], ['F', Q], ['G', Q], ['G', Q], ['F', Q], ['E', Q], ['D', H]],
  [['C', Q], ['C', Q], ['D', Q], ['E', Q], ['E', Q], ['D', Q], ['D', H]],
  [['E', Q], ['E', Q], ['F', Q], ['G', Q], ['G', Q], ['F', Q], ['E', Q], ['D', H]],
  [['C', Q], ['C', Q], ['D', Q], ['E', Q], ['D', Q], ['C', Q], ['C', H]],
  [['D', Q], ['D', Q], ['E', Q], ['C', Q], ['D', Q], ['E', Q], ['F', Q], ['E', Q], ['C', H]],
  [['D', Q], ['E', Q], ['F', Q], ['E', Q], ['D', Q], ['C', Q], ['D', Q], ['G', H]],
  [['E', Q], ['E', Q], ['F', Q], ['G', Q], ['G', Q], ['F', Q], ['E', Q], ['D', H]],
  [['C', Q], ['C', Q], ['D', Q], ['E', Q], ['D', Q], ['C', Q], ['C', H]],
];
for (const phrase of phrases) {
  for (const [name, dur] of phrase) {
    MELODY.push({ pitch: N[name], startTick: t, durationTicks: dur });
    t += dur;
  }
}

// ─── Left hand bass (half notes) ──────────────────────────────
const BASS_NAMES = ['C', 'G', 'C', 'G', 'C', 'G', 'C', 'G', 'C', 'G', 'C', 'G', 'C', 'G', 'G#', 'A', 'C', 'G', 'C', 'G', 'C'];
const BASS: { pitch: number; startTick: number; durationTicks: number }[] = [];
let bt = 0;
for (const name of BASS_NAMES) {
  BASS.push({ pitch: N[name] - 12, startTick: bt, durationTicks: H }); // one octave down
  bt += H;
}

const allNotes: ParsedMidiNote[] = [
  ...MELODY.map(n => ({ ...n, velocity: 0.7 })),
  ...BASS.map(n => ({ ...n, velocity: 0.6 })),
];

/** Ode to Joy as a Standard MIDI File (format 0) byte array. */
export const ODE_TO_JOY_MIDI_BYTES: Uint8Array = buildMidi(allNotes);

/** Ode to Joy converted to the app's SynthNote format (sixteenth steps). */
export const ODE_TO_JOY_SYNTH_NOTES: SynthNote[] = midiFileToSynthNotes(ODE_TO_JOY_MIDI_BYTES);

/** Ode to Joy as a ready-to-use SynthPattern, played with a piano voice. */
export const ODE_TO_JOY_SYNTH_PATTERN: SynthPattern = {
  id: 'ode-to-joy-pattern',
  name: 'Ode to Joy',
  notes: ODE_TO_JOY_SYNTH_NOTES,
  // Melody length in sixteenth steps (480 ticks/quarter, 4 steps/quarter).
  steps: Math.ceil(t / 480 * 4),
  voice: PIANO_VOICE,
  piano: true,
};
