import type { SynthNote } from './types';

/**
 * A minimal Standard MIDI File (SMF) parser + converter to the app's
 * `SynthPattern` note format. It reads a MIDI file's bytes, extracts note
 * on/off events, and converts them into `SynthNote`s (pitch, startStep,
 * duration, velocity) quantized to sixteenth steps.
 *
 * Supported: format 0 and 1 files, PPQN (ticks-per-quarter-note) division,
 * running status, and note-on-with-velocity-0 as note-off.
 */

export interface ParsedMidiNote {
  /** MIDI note number (0-127). */
  pitch: number;
  /** Start time in ticks. */
  startTick: number;
  /** Duration in ticks. */
  durationTicks: number;
  /** Velocity 0-1. */
  velocity: number;
}

export interface ParsedMidi {
  /** Ticks per quarter note (PPQN). */
  division: number;
  /** All notes across all tracks, merged and sorted by start tick. */
  notes: ParsedMidiNote[];
}

/** Thrown when the bytes are not a valid MIDI file we can parse. */
export class MidiParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MidiParseError';
  }
}

/** Read a big-endian 32-bit unsigned integer. */
function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  ) >>> 0;
}

/** Read a big-endian 16-bit unsigned integer. */
function readUint16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

/** Read a variable-length quantity (VLQ) at `offset`, returning [value, nextOffset]. */
function readVlq(bytes: Uint8Array, offset: number): [number, number] {
  let value = 0;
  let i = offset;
  for (let count = 0; count < 4; count++) {
    const byte = bytes[i++];
    value = (value << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) break;
  }
  return [value, i];
}

/**
 * Parse a Standard MIDI File from its raw bytes.
 * @param data The MIDI file bytes (e.g. from `new Uint8Array(await file.arrayBuffer())`).
 */
export function parseMidi(data: Uint8Array): ParsedMidi {
  if (data.length < 14) {
    throw new MidiParseError('File too short to be a MIDI file');
  }

  // Header chunk: "MThd" + length + format + ntrks + division.
  const headerId = String.fromCharCode(data[0], data[1], data[2], data[3]);
  if (headerId !== 'MThd') {
    throw new MidiParseError('Not a MIDI file (missing MThd header)');
  }
  const headerLength = readUint32(data, 4);
  if (headerLength < 6) {
    throw new MidiParseError('Invalid MIDI header length');
  }
  const format = readUint16(data, 8);
  const ntrks = readUint16(data, 10);
  const division = readUint16(data, 12);

  // SMPTE division (bit 15 set) is not supported.
  if ((division & 0x8000) !== 0) {
    throw new MidiParseError('SMPTE time division is not supported');
  }
  if (division === 0) {
    throw new MidiParseError('Invalid MIDI division (0)');
  }

  const notes: ParsedMidiNote[] = [];
  const offset = 8 + headerLength;

  for (let track = 0; track < ntrks; track++) {
    if (offset + 8 > data.length) {
      throw new MidiParseError('Unexpected end of file while reading track header');
    }
    const trackId = String.fromCharCode(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
    if (trackId !== 'MTrk') {
      throw new MidiParseError('Expected MTrk track chunk');
    }
    const trackLength = readUint32(data, offset + 4);
    const trackEnd = offset + 8 + trackLength;
    if (trackEnd > data.length) {
      throw new MidiParseError('Track length exceeds file size');
    }

    let pos = offset + 8;
    let runningStatus = 0;
    let absoluteTick = 0;
    // Track currently-open notes: pitch -> startTick + velocity.
    const openNotes = new Map<number, { startTick: number; velocity: number }>();

    while (pos < trackEnd) {
      const [delta, next] = readVlq(data, pos);
      pos = next;
      absoluteTick += delta;

      let statusByte = data[pos];
      if (statusByte < 0x80) {
        // Running status: reuse the previous status byte.
        if (runningStatus === 0) {
          throw new MidiParseError('Running status used before any status byte');
        }
        statusByte = runningStatus;
      } else {
        pos++;
        runningStatus = statusByte;
      }

      const type = statusByte & 0xf0;
      const channel = statusByte & 0x0f;

      if (type === 0x80 || type === 0x90) {
        // Note off (0x8n) or note on (0x9n).
        if (pos + 2 > trackEnd) break;
        const pitch = data[pos];
        const velocity = data[pos + 1];
        pos += 2;

        if (type === 0x90 && velocity > 0) {
          // Note on: open a note.
          openNotes.set(pitch, { startTick: absoluteTick, velocity: velocity / 127 });
        } else {
          // Note off (or note on with velocity 0): close the note.
          const open = openNotes.get(pitch);
          if (open) {
            notes.push({
              pitch,
              startTick: open.startTick,
              durationTicks: Math.max(1, absoluteTick - open.startTick),
              velocity: open.velocity,
            });
            openNotes.delete(pitch);
          }
        }
      } else if (type === 0xb0 || type === 0xc0 || type === 0xe0) {
        // Control change (2 bytes), program change (1 byte), pitch bend (2 bytes).
        pos += type === 0xc0 ? 1 : 2;
      } else if (type === 0xa0 || type === 0xd0) {
        // Polyphonic aftertouch (2 bytes), channel aftertouch (1 byte).
        pos += type === 0xd0 ? 1 : 2;
      } else if (type === 0xf0) {
        // System messages.
        if (statusByte === 0xff) {
          // Meta event: type + length + data.
          if (pos >= trackEnd) break;
          const metaType = data[pos++];
          const [len, afterLen] = readVlq(data, pos);
          pos = afterLen + len;
        } else if (statusByte === 0xf0 || statusByte === 0xf7) {
          // SysEx: length + data.
          const [len, afterLen] = readVlq(data, pos);
          pos = afterLen + len;
        } else {
          // Other system common messages (1-2 bytes).
          pos += statusByte === 0xf1 || statusByte === 0xf3 ? 1 : 2;
        }
      } else {
        // Unknown event type — skip a byte to avoid an infinite loop.
        pos++;
      }
    }

    // Close any notes still open at the end of the track.
    for (const [pitch, open] of openNotes) {
      notes.push({
        pitch,
        startTick: open.startTick,
        durationTicks: Math.max(1, absoluteTick - open.startTick),
        velocity: open.velocity,
      });
    }
  }

  notes.sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
  return { division, notes };
}

export interface MidiToSynthOptions {
  /** Steps per quarter note (default 4 = sixteenth notes). */
  stepsPerQuarter?: number;
  /** Round note start times to the nearest step (default true). */
  quantize?: boolean;
  /** Clamp note durations to at least this many steps (default 1). */
  minDurationSteps?: number;
}

/**
 * Convert parsed MIDI notes into the app's `SynthNote` format, quantized to
 * sixteenth steps. `startStep` is relative to the pattern start (0-based).
 */
export function midiToSynthNotes(midi: ParsedMidi, options: MidiToSynthOptions = {}): SynthNote[] {
  const { stepsPerQuarter = 4, quantize = true, minDurationSteps = 1 } = options;
  const ticksPerStep = midi.division / stepsPerQuarter;

  return midi.notes.map((note) => {
    const rawStart = note.startTick / ticksPerStep;
    const rawDuration = note.durationTicks / ticksPerStep;
    const startStep = quantize ? Math.round(rawStart) : rawStart;
    const duration = Math.max(minDurationSteps, quantize ? Math.round(rawDuration) : rawDuration);
    return {
      pitch: note.pitch,
      startStep,
      duration,
      velocity: note.velocity,
    };
  });
}

/**
 * Convenience: parse MIDI bytes and convert directly to `SynthNote`s.
 */
export function midiFileToSynthNotes(data: Uint8Array, options?: MidiToSynthOptions): SynthNote[] {
  return midiToSynthNotes(parseMidi(data), options);
}
