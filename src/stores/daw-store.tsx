import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import {
  DAWProject, Track, DrumPattern, Clip, ClipType,
  generateId, createEmptyDrumGrid, DrumSound,
} from '@/lib/types';
import { audioEngine } from '@/lib/audio-engine';

// Default pattern
const defaultPattern: DrumPattern = {
  id: 'default-pattern',
  name: 'Pattern 1',
  steps: 16,
  grid: (() => {
    const g = createEmptyDrumGrid(16);
    // Simple beat: kick on 1,5,9,13 / snare on 5,13 / hihat every other
    g['kick'][0] = true; g['kick'][4] = true; g['kick'][8] = true; g['kick'][12] = true;
    g['snare'][4] = true; g['snare'][12] = true;
    for (let i = 0; i < 16; i += 2) g['hihat-closed'][i] = true;
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
  clips: [{
    id: 'clip-1',
    type: 'drum',
    startBeat: 0,
    durationBeats: 4,
    patternId: 'default-pattern',
  }],
};

interface DAWState extends DAWProject {
  isPlaying: boolean;
  currentStep: number;
  selectedPatternId: string | null;
  selectedClipId: string | null;
  activePanel: 'drums' | 'synth' | 'samples';
}

const initialState: DAWState = {
  projectName: 'Untitled Project',
  bpm: 120,
  timeSignature: [4, 4] as [number, number],
  tracks: [defaultTrack],
  drumPatterns: [defaultPattern],
  synthPatterns: [],
  masterVolume: 0.8,
  loopEnabled: true,
  loopStart: 0,
  loopEnd: 4,
  isPlaying: false,
  currentStep: -1,
  selectedPatternId: 'default-pattern',
  selectedClipId: null,
  activePanel: 'drums',
};

type Action =
  | { type: 'SET_BPM'; bpm: number }
  | { type: 'SET_MASTER_VOLUME'; volume: number }
  | { type: 'SET_PROJECT_NAME'; name: string }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'SET_CURRENT_STEP'; step: number }
  | { type: 'SET_LOOP'; enabled: boolean }
  | { type: 'TOGGLE_DRUM_STEP'; patternId: string; sound: DrumSound; step: number }
  | { type: 'SELECT_PATTERN'; patternId: string }
  | { type: 'ADD_PATTERN'; pattern: DrumPattern }
  | { type: 'SET_PATTERN_STEPS'; patternId: string; steps: number }
  | { type: 'ADD_TRACK'; track: Track }
  | { type: 'REMOVE_TRACK'; trackId: string }
  | { type: 'SET_TRACK_VOLUME'; trackId: string; volume: number }
  | { type: 'SET_TRACK_PAN'; trackId: string; pan: number }
  | { type: 'TOGGLE_TRACK_MUTE'; trackId: string }
  | { type: 'TOGGLE_TRACK_SOLO'; trackId: string }
  | { type: 'RENAME_TRACK'; trackId: string; name: string }
  | { type: 'ADD_CLIP'; trackId: string; clip: Clip }
  | { type: 'REMOVE_CLIP'; trackId: string; clipId: string }
  | { type: 'SET_ACTIVE_PANEL'; panel: 'drums' | 'synth' | 'samples' }
  | { type: 'LOAD_PROJECT'; project: DAWProject };

function reducer(state: DAWState, action: Action): DAWState {
  switch (action.type) {
    case 'SET_BPM':
      return { ...state, bpm: action.bpm };
    case 'SET_MASTER_VOLUME':
      return { ...state, masterVolume: action.volume };
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
    case 'SELECT_PATTERN':
      return { ...state, selectedPatternId: action.patternId };
    case 'ADD_PATTERN':
      return { ...state, drumPatterns: [...state.drumPatterns, action.pattern] };
    case 'SET_PATTERN_STEPS': {
      return {
        ...state,
        drumPatterns: state.drumPatterns.map(p => {
          if (p.id !== action.patternId) return p;
          const newGrid = createEmptyDrumGrid(action.steps);
          // Copy existing steps
          for (const sound of Object.keys(p.grid) as DrumSound[]) {
            for (let i = 0; i < Math.min(p.steps, action.steps); i++) {
              newGrid[sound][i] = p.grid[sound][i];
            }
          }
          return { ...p, steps: action.steps, grid: newGrid };
        }),
      };
    }
    case 'ADD_TRACK':
      return { ...state, tracks: [...state.tracks, action.track] };
    case 'REMOVE_TRACK':
      return { ...state, tracks: state.tracks.filter(t => t.id !== action.trackId) };
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
    case 'SET_ACTIVE_PANEL':
      return { ...state, activePanel: action.panel };
    case 'LOAD_PROJECT':
      return { ...state, ...action.project, isPlaying: false, currentStep: -1 };
    default:
      return state;
  }
}

interface DAWContextType {
  state: DAWState;
  dispatch: React.Dispatch<Action>;
  play: () => void;
  stop: () => void;
  pause: () => void;
  previewSound: (sound: DrumSound) => void;
}

const DAWContext = createContext<DAWContextType | null>(null);

export function DAWProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    audioEngine.setBpm(state.bpm);
  }, [state.bpm]);

  useEffect(() => {
    audioEngine.setMasterVolume(state.masterVolume);
  }, [state.masterVolume]);

  useEffect(() => {
    const pattern = state.drumPatterns.find(p => p.id === state.selectedPatternId);
    if (pattern) audioEngine.setPattern(pattern);
  }, [state.drumPatterns, state.selectedPatternId]);

  useEffect(() => {
    audioEngine.onStep((step) => {
      dispatch({ type: 'SET_CURRENT_STEP', step });
    });
  }, []);

  const play = useCallback(() => {
    audioEngine.init();
    const pattern = stateRef.current.drumPatterns.find(
      p => p.id === stateRef.current.selectedPatternId
    );
    if (pattern) audioEngine.setPattern(pattern);
    audioEngine.play();
    dispatch({ type: 'SET_PLAYING', playing: true });
  }, []);

  const stop = useCallback(() => {
    audioEngine.stop();
    dispatch({ type: 'SET_PLAYING', playing: false });
    dispatch({ type: 'SET_CURRENT_STEP', step: -1 });
  }, []);

  const pause = useCallback(() => {
    audioEngine.pause();
    dispatch({ type: 'SET_PLAYING', playing: false });
  }, []);

  const previewSound = useCallback((sound: DrumSound) => {
    audioEngine.previewSound(sound);
  }, []);

  return (
    <DAWContext.Provider value={{ state, dispatch, play, stop, pause, previewSound }}>
      {children}
    </DAWContext.Provider>
  );
}

export function useDAW() {
  const ctx = useContext(DAWContext);
  if (!ctx) throw new Error('useDAW must be used within DAWProvider');
  return ctx;
}
