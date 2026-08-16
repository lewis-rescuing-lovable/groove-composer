import React, { useReducer, useCallback, useRef, useEffect } from 'react';
import { DrumSound, DrumPattern } from '@/lib/types';
import { audioEngine } from '@/lib/audio-engine';
import { sampleLoader } from '@/lib/sample-loader';
import {
  DAWContext, DAWState, Action, reducer, initialState,
  getActivePatternId, serializeProject, loadFromStorage, STORAGE_KEY,
} from './daw-store-context';

export function DAWProvider({ children }: { children: React.ReactNode }) {
  // Hydrate from localStorage on first render (client-side).
  const [state, dispatch] = useReducer(reducer, initialState, (base) => {
    const saved = loadFromStorage();
    return saved ? { ...base, ...saved, isPlaying: false, currentStep: -1 } : base;
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  // Attach the shared sample loader to the audio engine once.
  useEffect(() => {
    audioEngine.setSampleLoader(sampleLoader);
  }, []);

  const getActivePattern = useCallback((): DrumPattern | null => {
    const patternId = getActivePatternId(stateRef.current);
    if (!patternId) return null;
    return stateRef.current.drumPatterns.find(p => p.id === patternId) ?? null;
  }, []);

  // Autosave whenever the project data changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, serializeProject(stateRef.current));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [
    state.projectName,
    state.bpm,
    state.timeSignature,
    state.tracks,
    state.drumPatterns,
    state.synthPatterns,
    state.masterVolume,
    state.loopEnabled,
    state.loopStart,
    state.loopEnd,
  ]);

  const saveProject = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, serializeProject(stateRef.current));
  }, []);

  const loadProject = useCallback((): boolean => {
    const saved = loadFromStorage();
    if (!saved) return false;
    dispatch({ type: 'LOAD_PROJECT', project: saved });
    return true;
  }, []);

  const resetProject = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEY);
    audioEngine.stop();
    dispatch({ type: 'RESET_PROJECT' });
  }, []);

  useEffect(() => {
    audioEngine.setBpm(state.bpm);
  }, [state.bpm]);

  useEffect(() => {
    audioEngine.setMasterVolume(state.masterVolume);
  }, [state.masterVolume]);

  // Sync all tracks and patterns to the audio engine
  useEffect(() => {
    audioEngine.setTracks(state.tracks, state.drumPatterns);
  }, [state.tracks, state.drumPatterns]);

  useEffect(() => {
    audioEngine.setLoopEnabled(state.loopEnabled);
  }, [state.loopEnabled]);

  useEffect(() => {
    audioEngine.onStep((step) => {
      dispatch({ type: 'SET_CURRENT_STEP', step });
    });
  }, []);

  // When repeat is off and playback reaches the end, reset the UI state so the
  // transport button flips back to Play.
  useEffect(() => {
    audioEngine.onEnded(() => {
      dispatch({ type: 'SET_PLAYING', playing: false });
      dispatch({ type: 'SET_CURRENT_STEP', step: -1 });
    });
  }, []);

  const play = useCallback(() => {
    audioEngine.init();
    audioEngine.setTracks(stateRef.current.tracks, stateRef.current.drumPatterns);
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

  const previewSample = useCallback(async (sampleId: string) => {
    await audioEngine.playSample(sampleId);
  }, []);

  return (
    <DAWContext.Provider
      value={{ state, dispatch, play, stop, pause, previewSound, previewSample, getActivePattern, saveProject, loadProject, resetProject }}
    >
      {children}
    </DAWContext.Provider>
  );
}
