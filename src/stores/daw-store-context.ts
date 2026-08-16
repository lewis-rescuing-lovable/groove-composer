import { createContext, useContext } from 'react';
import {
  DAWProject, Track, DrumPattern, SynthPattern, Clip, ClipType,
  generateId, createEmptyDrumGrid, DrumSound, SynthVoice,
} from '@/lib/types';
import { AUTOSAVE_MAX_SECONDS } from '@/lib/autosave-time';
import { getQueryProjectJson } from '@/lib/share';

// Default pattern
const defaultPattern: DrumPattern = {
  id: 'default-pattern',
  name: 'Drums',
  steps: 16,
  grid: (() => {
    const g = createEmptyDrumGrid(16);
    g['kick'][0] = true; g['kick'][4] = true; g['kick'][8] = true; g['kick'][12] = true;
    g['snare'][4] = true; g['snare'][12] = true;
    for (let i = 0; i < 16; i += 2) g['hihat-closed'][i] = true;
    return g;
  })(),
};

const clapCymbalPattern: DrumPattern = {
  id: '840b8v85',
  name: 'Clap & Cymbal',
  steps: 16,
  grid: (() => {
    const g = createEmptyDrumGrid(16);
    g['clap'][8] = true; g['clap'][10] = true; g['clap'][12] = true;
    g['cymbal'][14] = true;
    return g;
  })(),
};

const defaultTrack: Track = {
  id: 'track-1',
  name: 'Drums',
  volume: 0.8,
  pan: 0,
  muted: false,
  solo: false,
  clips: [
    { id: 'clip-1', type: 'drum', startBeat: 0, durationBeats: 4, patternId: 'default-pattern' },
    { id: '7hgjpbxs', type: 'drum', startBeat: 4, durationBeats: 4, patternId: 'default-pattern' },
  ],
};

const secondTrack: Track = {
  id: '8gebvw0c',
  name: 'Track 2',
  volume: 0.8,
  pan: 0,
  muted: false,
  solo: false,
  clips: [{
    id: 't9owklqf',
    type: 'drum',
    startBeat: 4,
    durationBeats: 4,
    patternId: '840b8v85',
  }],
};

export interface DAWState extends DAWProject {
  isPlaying: boolean;
  currentStep: number;
  selectedTrackId: string | null;
  selectedClipId: string | null;
  /** Whether the master output is muted. */
  masterMuted: boolean;
  /** User preference: whether autosave is enabled. Persisted separately. */
  autosaveEnabled: boolean;
  /** User preference: autosave interval in seconds (1..3600). Persisted separately. */
  autosaveIntervalSeconds: number;
}

/** Derive the active pattern from the selected track */
export function getActivePatternId(state: DAWState): string | null {
  const track = state.tracks.find(t => t.id === state.selectedTrackId);
  if (!track || track.clips.length === 0) return null;
  // Use the selected clip, or first clip on the track
  const clip = state.selectedClipId
    ? track.clips.find(c => c.id === state.selectedClipId)
    : track.clips[0];
  return clip?.patternId ?? null;
}

export const initialState: DAWState = {
  projectName: 'Starter Project',
  bpm: 120,
  timeSignature: [4, 4] as [number, number],
  tracks: [defaultTrack, secondTrack],
  drumPatterns: [defaultPattern, clapCymbalPattern],
  synthPatterns: [],
  masterVolume: 0.8,
  loopEnabled: true,
  loopStart: 0,
  loopEnd: 4,
  isPlaying: false,
  currentStep: -1,
  selectedTrackId: 'track-1',
  selectedClipId: null,
  masterMuted: false,
  autosaveEnabled: true,
  autosaveIntervalSeconds: 5,
};

export type Action =
  | { type: 'SET_BPM'; bpm: number }
  | { type: 'SET_MASTER_VOLUME'; volume: number }
  | { type: 'SET_MASTER_MUTED'; muted: boolean }
  | { type: 'SET_PROJECT_NAME'; name: string }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'SET_CURRENT_STEP'; step: number }
  | { type: 'SET_LOOP'; enabled: boolean }
  | { type: 'TOGGLE_DRUM_STEP'; patternId: string; sound: DrumSound; step: number }
  | { type: 'TOGGLE_SYNTH_NOTE'; patternId: string; pitch: number; step: number }
  | { type: 'SET_SYNTH_PATTERN_STEPS'; patternId: string; steps: number }
  | { type: 'ADD_PATTERN'; pattern: DrumPattern }
  | { type: 'REMOVE_PATTERN'; patternId: string }
  | { type: 'RENAME_PATTERN'; patternId: string; name: string }
  | { type: 'ASSIGN_PATTERN_TO_CLIP'; trackId: string; clipId: string; patternId: string }
  | { type: 'SET_PATTERN_STEPS'; patternId: string; steps: number }
  | { type: 'ADD_TRACK_WITH_PATTERN' }
  | { type: 'ADD_SAMPLE_TRACK'; sampleId: string; name: string; loop: boolean }
  | { type: 'ADD_SYNTH_TRACK' }
  | { type: 'REMOVE_TRACK'; trackId: string }
  | { type: 'SET_TRACK_VOLUME'; trackId: string; volume: number }
  | { type: 'SET_TRACK_PAN'; trackId: string; pan: number }
  | { type: 'TOGGLE_TRACK_MUTE'; trackId: string }
  | { type: 'TOGGLE_TRACK_SOLO'; trackId: string }
  | { type: 'RENAME_TRACK'; trackId: string; name: string }
  | { type: 'ADD_CLIP'; trackId: string; clip: Clip }
  | { type: 'REMOVE_CLIP'; trackId: string; clipId: string }
  | { type: 'SELECT_CLIP'; trackId: string; clipId: string }
  | { type: 'MOVE_CLIP'; fromTrackId: string; toTrackId: string; clipId: string; startBeat: number }
  | { type: 'RESIZE_CLIP'; trackId: string; clipId: string; durationBeats: number }
  | { type: 'DUPLICATE_CLIP'; trackId: string; clipId: string }
  | { type: 'SELECT_TRACK'; trackId: string }
  | { type: 'LOAD_PROJECT'; project: DAWProject }
  | { type: 'RESET_PROJECT' }
  | { type: 'SET_AUTOSAVE_ENABLED'; enabled: boolean }
  | { type: 'SET_AUTOSAVE_INTERVAL'; seconds: number };

export function reducer(state: DAWState, action: Action): DAWState {
  switch (action.type) {
    case 'SET_BPM':
      return { ...state, bpm: action.bpm };
    case 'SET_MASTER_VOLUME':
      return { ...state, masterVolume: action.volume };
    case 'SET_MASTER_MUTED':
      return { ...state, masterMuted: action.muted };
    case 'SET_PROJECT_NAME':
      return { ...state, projectName: action.name };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.playing };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.step };
    case 'SET_LOOP':
      return { ...state, loopEnabled: action.enabled };
    case 'TOGGLE_DRUM_STEP': {
      return {
        ...state,
        drumPatterns: state.drumPatterns.map(p => {
          if (p.id !== action.patternId) return p;
          const newGrid = { ...p.grid };
          newGrid[action.sound] = [...newGrid[action.sound]];
          newGrid[action.sound][action.step] = !newGrid[action.sound][action.step];
          return { ...p, grid: newGrid };
        }),
      };
    }
    case 'TOGGLE_SYNTH_NOTE': {
      return {
        ...state,
        synthPatterns: state.synthPatterns.map(p => {
          if (p.id !== action.patternId) return p;
          const existing = p.notes.find(n => n.pitch === action.pitch && n.startStep === action.step);
          if (existing) {
            // Remove the note at this pitch+step.
            return {
              ...p,
              notes: p.notes.filter(n => !(n.pitch === action.pitch && n.startStep === action.step)),
            };
          }
          // Add a note at this pitch+step (one bar = 16 steps, quarter-note length).
          return {
            ...p,
            notes: [...p.notes, { pitch: action.pitch, startStep: action.step, duration: 4, velocity: 0.8 }],
          };
        }),
      };
    }
    case 'SET_SYNTH_PATTERN_STEPS': {
      const steps = Math.max(1, action.steps);
      return {
        ...state,
        synthPatterns: state.synthPatterns.map(p =>
          p.id === action.patternId ? { ...p, steps } : p
        ),
      };
    }
    case 'ADD_PATTERN':
      return { ...state, drumPatterns: [...state.drumPatterns, action.pattern] };
    case 'RENAME_PATTERN':
      return {
        ...state,
        drumPatterns: state.drumPatterns.map(p =>
          p.id === action.patternId ? { ...p, name: action.name } : p
        ),
      };
    case 'REMOVE_PATTERN': {
      // Don't remove if it's still used by a clip
      const inUse = state.tracks.some(t => t.clips.some(c => c.patternId === action.patternId));
      if (inUse) return state;
      return { ...state, drumPatterns: state.drumPatterns.filter(p => p.id !== action.patternId) };
    }
    case 'ASSIGN_PATTERN_TO_CLIP':
      return {
        ...state,
        tracks: state.tracks.map(t =>
          t.id === action.trackId
            ? { ...t, clips: t.clips.map(c => c.id === action.clipId ? { ...c, patternId: action.patternId } : c) }
            : t
        ),
      };
    case 'SET_PATTERN_STEPS': {
      return {
        ...state,
        drumPatterns: state.drumPatterns.map(p => {
          if (p.id !== action.patternId) return p;
          const newGrid = createEmptyDrumGrid(action.steps);
          for (const sound of Object.keys(p.grid) as DrumSound[]) {
            for (let i = 0; i < Math.min(p.steps, action.steps); i++) {
              newGrid[sound][i] = p.grid[sound][i];
            }
          }
          return { ...p, steps: action.steps, grid: newGrid };
        }),
      };
    }
    case 'ADD_TRACK_WITH_PATTERN': {
      const trackNum = state.tracks.length + 1;
      const patternId = generateId();
      const trackId = generateId();
      const clipId = generateId();
      const newPattern: DrumPattern = {
        id: patternId,
        name: `Pattern ${state.drumPatterns.length + 1}`,
        steps: 16,
        grid: createEmptyDrumGrid(16),
      };
      const newTrack: Track = {
        id: trackId,
        name: `Track ${trackNum}`,
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [{
          id: clipId,
          type: 'drum',
          startBeat: 0,
          durationBeats: 4,
          patternId,
        }],
      };
      return {
        ...state,
        drumPatterns: [...state.drumPatterns, newPattern],
        tracks: [...state.tracks, newTrack],
        selectedTrackId: trackId,
        selectedClipId: clipId,
      };
    }
    case 'ADD_SAMPLE_TRACK': {
      const trackId = generateId();
      const clipId = generateId();
      const newTrack: Track = {
        id: trackId,
        name: action.name,
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [{
          id: clipId,
          type: 'sample',
          startBeat: 0,
          durationBeats: 4,
          sampleId: action.sampleId,
          loop: action.loop,
        }],
      };
      return {
        ...state,
        tracks: [...state.tracks, newTrack],
        selectedTrackId: trackId,
        selectedClipId: clipId,
      };
    }
    case 'ADD_SYNTH_TRACK': {
      const trackNum = state.tracks.length + 1;
      const patternId = generateId();
      const trackId = generateId();
      const clipId = generateId();
      const newPattern: SynthPattern = {
        id: patternId,
        name: `Synth ${state.synthPatterns.length + 1}`,
        notes: [],
        steps: 16,
      };
      const newTrack: Track = {
        id: trackId,
        name: `Track ${trackNum}`,
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [{
          id: clipId,
          type: 'synth',
          startBeat: 0,
          durationBeats: 4,
          patternId,
        }],
      };
      return {
        ...state,
        synthPatterns: [...state.synthPatterns, newPattern],
        tracks: [...state.tracks, newTrack],
        selectedTrackId: trackId,
        selectedClipId: clipId,
      };
    }
    case 'REMOVE_TRACK': {
      const removedTrack = state.tracks.find(t => t.id === action.trackId);
      const remaining = state.tracks.filter(t => t.id !== action.trackId);
      // Collect pattern IDs used only by this track
      const removedPatternIds = new Set<string>();
      if (removedTrack) {
        for (const clip of removedTrack.clips) {
          if (clip.patternId) removedPatternIds.add(clip.patternId);
        }
      }
      // Keep patterns still referenced by other tracks
      for (const t of remaining) {
        for (const c of t.clips) {
          if (c.patternId) removedPatternIds.delete(c.patternId);
        }
      }
      return {
        ...state,
        tracks: remaining,
        drumPatterns: state.drumPatterns.filter(p => !removedPatternIds.has(p.id)),
        selectedTrackId: state.selectedTrackId === action.trackId
          ? (remaining[0]?.id ?? null)
          : state.selectedTrackId,
        selectedClipId: state.selectedTrackId === action.trackId ? null : state.selectedClipId,
      };
    }
    case 'SET_TRACK_VOLUME':
      return {
        ...state,
        tracks: state.tracks.map(t => t.id === action.trackId ? { ...t, volume: action.volume } : t),
      };
    case 'SET_TRACK_PAN':
      return {
        ...state,
        tracks: state.tracks.map(t => t.id === action.trackId ? { ...t, pan: action.pan } : t),
      };
    case 'TOGGLE_TRACK_MUTE':
      return {
        ...state,
        tracks: state.tracks.map(t => t.id === action.trackId ? { ...t, muted: !t.muted } : t),
      };
    case 'TOGGLE_TRACK_SOLO':
      return {
        ...state,
        tracks: state.tracks.map(t => t.id === action.trackId ? { ...t, solo: !t.solo } : t),
      };
    case 'RENAME_TRACK':
      return {
        ...state,
        tracks: state.tracks.map(t => t.id === action.trackId ? { ...t, name: action.name } : t),
      };
    case 'ADD_CLIP':
      return {
        ...state,
        tracks: state.tracks.map(t =>
          t.id === action.trackId ? { ...t, clips: [...t.clips, action.clip] } : t
        ),
      };
    case 'REMOVE_CLIP':
      return {
        ...state,
        tracks: state.tracks.map(t =>
          t.id === action.trackId ? { ...t, clips: t.clips.filter(c => c.id !== action.clipId) } : t
        ),
      };
    case 'SELECT_CLIP':
      return { ...state, selectedTrackId: action.trackId, selectedClipId: action.clipId };
    case 'MOVE_CLIP': {
      const clampedBeat = Math.max(0, action.startBeat);
      if (action.fromTrackId === action.toTrackId) {
        // Same track — just update startBeat
        return {
          ...state,
          tracks: state.tracks.map(t =>
            t.id === action.fromTrackId
              ? { ...t, clips: t.clips.map(c => c.id === action.clipId ? { ...c, startBeat: clampedBeat } : c) }
              : t
          ),
        };
      }
      // Cross-track move
      const fromTrack = state.tracks.find(t => t.id === action.fromTrackId);
      const clip = fromTrack?.clips.find(c => c.id === action.clipId);
      if (!clip) return state;
      const movedClip = { ...clip, startBeat: clampedBeat };
      return {
        ...state,
        selectedTrackId: action.toTrackId,
        selectedClipId: action.clipId,
        tracks: state.tracks.map(t => {
          if (t.id === action.fromTrackId) return { ...t, clips: t.clips.filter(c => c.id !== action.clipId) };
          if (t.id === action.toTrackId) return { ...t, clips: [...t.clips, movedClip] };
          return t;
        }),
      };
    }
    case 'RESIZE_CLIP': {
      const dur = Math.max(1, action.durationBeats);
      return {
        ...state,
        tracks: state.tracks.map(t =>
          t.id === action.trackId
            ? { ...t, clips: t.clips.map(c => c.id === action.clipId ? { ...c, durationBeats: dur } : c) }
            : t
        ),
      };
    }
    case 'DUPLICATE_CLIP': {
      const srcTrack = state.tracks.find(t => t.id === action.trackId);
      const srcClip = srcTrack?.clips.find(c => c.id === action.clipId);
      if (!srcClip) return state;
      const newClip = { ...srcClip, id: generateId(), startBeat: srcClip.startBeat + srcClip.durationBeats };
      return {
        ...state,
        tracks: state.tracks.map(t =>
          t.id === action.trackId ? { ...t, clips: [...t.clips, newClip] } : t
        ),
      };
    }
    case 'SELECT_TRACK': {
      const track = state.tracks.find(t => t.id === action.trackId);
      return {
        ...state,
        selectedTrackId: action.trackId,
        selectedClipId: track?.clips[0]?.id ?? null,
      };
    }
    case 'LOAD_PROJECT':
      return { ...state, ...action.project, isPlaying: false, currentStep: -1 };
    case 'RESET_PROJECT':
      return { ...initialState };
    case 'SET_AUTOSAVE_ENABLED':
      return { ...state, autosaveEnabled: action.enabled };
    case 'SET_AUTOSAVE_INTERVAL': {
      // Clamp to the valid range; anything above the 60:00 max is rejected.
      const seconds = Math.max(1, Math.min(AUTOSAVE_MAX_SECONDS, action.seconds));
      return { ...state, autosaveIntervalSeconds: seconds };
    }
    default:
      return state;
  }
}

export interface DAWContextType {
  state: DAWState;
  dispatch: React.Dispatch<Action>;
  play: () => void;
  stop: () => void;
  pause: () => void;
  previewSound: (sound: DrumSound) => void;
  previewSample: (sampleId: string) => Promise<void>;
  previewNote: (midi: number, voice: SynthVoice) => void;
  addSampleTrack: (sampleId: string, name: string, loop: boolean) => void;
  addSynthTrack: () => void;
  getActivePattern: () => DrumPattern | null;
  saveProject: () => void;
  loadProject: () => boolean;
  resetProject: () => void;
  loadProjectFromQuery: () => boolean;
}

export const DAWContext = createContext<DAWContextType | null>(null);

// ─── Persistence ─────────────────────────────────────────────
export const STORAGE_KEY = 'groove-composer:project';
export const PREFS_KEY = 'groove-composer:prefs';

export interface DAWPrefs {
  autosaveEnabled: boolean;
  autosaveIntervalSeconds: number;
}

const defaultPrefs: DAWPrefs = {
  autosaveEnabled: true,
  autosaveIntervalSeconds: 5,
};

/** Persist autosave preferences to their own storage key (separate from the project). */
export function savePrefsToStorage(prefs: DAWPrefs): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/** Load autosave preferences, falling back to defaults on any failure. */
export function loadPrefsFromStorage(): DAWPrefs {
  if (typeof window === 'undefined') return defaultPrefs;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs;
    const data = JSON.parse(raw) as Partial<DAWPrefs>;
    const enabled = typeof data.autosaveEnabled === 'boolean' ? data.autosaveEnabled : defaultPrefs.autosaveEnabled;
    const seconds = typeof data.autosaveIntervalSeconds === 'number'
      ? Math.max(1, Math.min(AUTOSAVE_MAX_SECONDS, data.autosaveIntervalSeconds))
      : defaultPrefs.autosaveIntervalSeconds;
    return { autosaveEnabled: enabled, autosaveIntervalSeconds: seconds };
  } catch {
    return defaultPrefs;
  }
}

/** Serialize only the project data (no transient playback/selection state). */
export function serializeProject(state: DAWState): string {
  const project: DAWProject = {
    projectName: state.projectName,
    bpm: state.bpm,
    timeSignature: state.timeSignature,
    tracks: state.tracks,
    drumPatterns: state.drumPatterns,
    synthPatterns: state.synthPatterns,
    masterVolume: state.masterVolume,
    loopEnabled: state.loopEnabled,
    loopStart: state.loopStart,
    loopEnd: state.loopEnd,
  };
  return JSON.stringify(project);
}

/** Attempt to hydrate a DAWProject from a serialized string. Returns null on failure. */
export function deserializeProject(raw: string | null): DAWProject | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<DAWProject>;
    if (
      typeof data.projectName !== 'string'
      || !Array.isArray(data.tracks)
      || !Array.isArray(data.drumPatterns)
      || !Array.isArray(data.synthPatterns)
      || typeof data.bpm !== 'number'
    ) {
      return null;
    }
    return {
      projectName: data.projectName,
      bpm: data.bpm,
      timeSignature: Array.isArray(data.timeSignature)
        ? (data.timeSignature as [number, number])
        : initialState.timeSignature,
      tracks: data.tracks,
      drumPatterns: data.drumPatterns,
      synthPatterns: data.synthPatterns,
      masterVolume: typeof data.masterVolume === 'number' ? data.masterVolume : 0.8,
      loopEnabled: typeof data.loopEnabled === 'boolean' ? data.loopEnabled : true,
      loopStart: typeof data.loopStart === 'number' ? data.loopStart : 0,
      loopEnd: typeof data.loopEnd === 'number' ? data.loopEnd : 4,
    };
  } catch {
    return null;
  }
}

export function loadFromStorage(): DAWProject | null {
  if (typeof window === 'undefined') return null;
  return deserializeProject(window.localStorage.getItem(STORAGE_KEY));
}

/**
 * Read + decode a shared project from the URL's `?project=` query parameter.
 * Returns the parsed DAWProject, or null if absent or malformed. It does NOT
 * touch localStorage, so a shared link never overwrites the user's saved work.
 */
export function loadFromQueryString(): DAWProject | null {
  const json = getQueryProjectJson();
  if (!json) return null;
  return deserializeProject(json);
}

export function useDAW() {
  const ctx = useContext(DAWContext);
  if (!ctx) throw new Error('useDAW must be used within DAWProvider');
  return ctx;
}
