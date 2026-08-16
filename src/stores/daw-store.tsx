import React, { useReducer, useCallback, useRef, useEffect } from 'react';
import { DrumSound, DrumPattern } from '@/lib/types';
import { audioEngine } from '@/lib/audio-engine';
import { sampleLoader } from '@/lib/sample-loader';
import {
  DAWContext, DAWState, Action, reducer, initialState,
  getActivePatternId, serializeProject, loadFromStorage, STORAGE_KEY,
  loadPrefsFromStorage, savePrefsToStorage,
} from './daw-store-context';

export function DAWProvider({ children }: { children: React.ReactNode }) {
  // Hydrate from localStorage on first render (client-side).
  const [state, dispatch] = useReducer(reducer, initialState, (base) => {
    const saved = loadFromStorage();
    const prefs = loadPrefsFromStorage();
    return {
      ...base,
      ...(saved ? { ...saved, isPlaying: false, currentStep: -1 } : {}),
      autosaveEnabled: prefs.autosaveEnabled,
      autosaveIntervalSeconds: prefs.autosaveIntervalSeconds,
    };
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

  // Autosave on a periodic timer (bounded by the user's interval). Gated on
  // autosaveEnabled, so an "off" preference never triggers a save.
  useEffect(() => {
    if (!state.autosaveEnabled) return;
    const timer = window.setInterval(() => {
      window.localStorage.setItem(STORAGE_KEY, serializeProject(stateRef.current));
    }, state.autosaveIntervalSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [state.autosaveEnabled, state.autosaveIntervalSeconds]);

  // Persist autosave preferences to their own key whenever they change.
  useEffect(() => {
    savePrefsToStorage({
      autosaveEnabled: state.autosaveEnabled,
      autosaveIntervalSeconds: state.autosaveIntervalSeconds,
    });
  }, [state.autosaveEnabled, state.autosaveIntervalSeconds]);

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

  const addSampleTrack = useCallback((sampleId: string, name: string, loop: boolean) => {
    dispatch({ type: 'ADD_SAMPLE_TRACK', sampleId, name, loop });
  }, []);

  return (
    <DAWContext.Provider
      value={{ state, dispatch, play, stop, pause, previewSound, previewSample, addSampleTrack, getActivePattern, saveProject, loadProject, resetProject }}
    >
      {children}
    </DAWContext.Provider>
  );
}
