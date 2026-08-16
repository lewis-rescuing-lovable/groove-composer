import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { DAWProvider } from './daw-store';
import { useDAW, getActivePatternId, serializeProject, deserializeProject, savePrefsToStorage, loadPrefsFromStorage, loadFromQueryString, PREFS_KEY } from './daw-store-context';
import { createEmptyDrumGrid } from '@/lib/types';
import { encodeProjectToQuery, QUERY_PARAM } from '@/lib/share';

// We can't import the reducer directly; drive it through the provider.
function renderDAW() {
  return renderHook(() => useDAW(), { wrapper: DAWProvider });
}

describe('daw-store reducer', () => {
  it('initializes with a default drum track and pattern', () => {
    const s = renderDAW().result.current.state;
    expect(s.projectName).toBe('Starter Project');
    expect(s.bpm).toBe(120);
    expect(s.masterVolume).toBe(0.8);
    expect(s.loopEnabled).toBe(true);
    expect(s.tracks).toHaveLength(2);
    expect(s.tracks[0].name).toBe('Drums');
    expect(s.drumPatterns).toHaveLength(2);
    expect(s.selectedTrackId).toBe('track-1');
    expect(s.isPlaying).toBe(false);
  });

  it('sets bpm with SET_BPM', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'SET_BPM', bpm: 140 }));
    expect(result.current.state.bpm).toBe(140);
  });

  it('sets master volume with SET_MASTER_VOLUME', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'SET_MASTER_VOLUME', volume: 0.5 }));
    expect(result.current.state.masterVolume).toBe(0.5);
  });

  it('sets master mute with SET_MASTER_MUTED', () => {
    const { result } = renderDAW();
    expect(result.current.state.masterMuted).toBe(false);
    act(() => result.current.dispatch({ type: 'SET_MASTER_MUTED', muted: true }));
    expect(result.current.state.masterMuted).toBe(true);
    act(() => result.current.dispatch({ type: 'SET_MASTER_MUTED', muted: false }));
    expect(result.current.state.masterMuted).toBe(false);
  });

  it('sets project name with SET_PROJECT_NAME', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'SET_PROJECT_NAME', name: 'Groove 1' }));
    expect(result.current.state.projectName).toBe('Groove 1');
  });

  it('sets playing + step with SET_PLAYING / SET_CURRENT_STEP', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'SET_PLAYING', playing: true }));
    expect(result.current.state.isPlaying).toBe(true);
    act(() => result.current.dispatch({ type: 'SET_CURRENT_STEP', step: 3 }));
    expect(result.current.state.currentStep).toBe(3);
  });

  it('sets loop with SET_LOOP', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'SET_LOOP', enabled: false }));
    expect(result.current.state.loopEnabled).toBe(false);
  });

  it('toggles a drum step with TOGGLE_DRUM_STEP', () => {
    const { result } = renderDAW();
    const patternId = result.current.state.drumPatterns[0].id;
    // step 2 is off in default pattern for kick
    act(() => result.current.dispatch({ type: 'TOGGLE_DRUM_STEP', patternId, sound: 'kick', step: 2 }));
    expect(result.current.state.drumPatterns[0].grid.kick[2]).toBe(true);
    act(() => result.current.dispatch({ type: 'TOGGLE_DRUM_STEP', patternId, sound: 'kick', step: 2 }));
    expect(result.current.state.drumPatterns[0].grid.kick[2]).toBe(false);
    // toggling another pattern leaves this one untouched
    act(() => result.current.dispatch({ type: 'TOGGLE_DRUM_STEP', patternId: 'missing', sound: 'kick', step: 2 }));
    expect(result.current.state.drumPatterns[0].grid.kick[2]).toBe(false);
  });

  it('toggles a synth note with TOGGLE_SYNTH_NOTE', () => {
    const { result } = renderDAW();
    // Seed a synth pattern via LOAD_PROJECT (the default state has none).
    act(() =>
      result.current.dispatch({
        type: 'LOAD_PROJECT',
        project: {
          projectName: 'Synth',
          bpm: 90,
          timeSignature: [4, 4],
          tracks: [],
          drumPatterns: [],
          synthPatterns: [{ id: 'sp1', name: 'Canon', notes: [] }],
          masterVolume: 0.8,
          loopEnabled: true,
          loopStart: 0,
          loopEnd: 4,
        },
      }),
    );
    // Add a note at pitch 62, step 0.
    act(() => result.current.dispatch({ type: 'TOGGLE_SYNTH_NOTE', patternId: 'sp1', pitch: 62, step: 0 }));
    expect(result.current.state.synthPatterns[0].notes).toContainEqual(
      expect.objectContaining({ pitch: 62, startStep: 0 }),
    );
    // Toggle again removes it.
    act(() => result.current.dispatch({ type: 'TOGGLE_SYNTH_NOTE', patternId: 'sp1', pitch: 62, step: 0 }));
    expect(result.current.state.synthPatterns[0].notes).toHaveLength(0);
    // Toggling a missing pattern leaves state untouched.
    act(() => result.current.dispatch({ type: 'TOGGLE_SYNTH_NOTE', patternId: 'missing', pitch: 62, step: 0 }));
    expect(result.current.state.synthPatterns[0].notes).toHaveLength(0);
  });

  it('sets synth pattern steps with SET_SYNTH_PATTERN_STEPS', () => {
    const { result } = renderDAW();
    act(() =>
      result.current.dispatch({
        type: 'LOAD_PROJECT',
        project: {
          projectName: 'Synth',
          bpm: 90,
          timeSignature: [4, 4],
          tracks: [],
          drumPatterns: [],
          synthPatterns: [{ id: 'sp1', name: 'Canon', notes: [] }],
          masterVolume: 0.8,
          loopEnabled: true,
          loopStart: 0,
          loopEnd: 4,
        },
      }),
    );
    act(() => result.current.dispatch({ type: 'SET_SYNTH_PATTERN_STEPS', patternId: 'sp1', steps: 128 }));
    expect(result.current.state.synthPatterns[0].steps).toBe(128);
    // Clamps to a minimum of 1.
    act(() => result.current.dispatch({ type: 'SET_SYNTH_PATTERN_STEPS', patternId: 'sp1', steps: 0 }));
    expect(result.current.state.synthPatterns[0].steps).toBe(1);
  });

  it('adds a pattern with ADD_PATTERN', () => {
    const { result } = renderDAW();
    const pattern = {
      id: 'p2',
      name: 'Pattern 3',
      steps: 16,
      grid: createEmptyDrumGrid(16),
    };
    act(() => result.current.dispatch({ type: 'ADD_PATTERN', pattern }));
    expect(result.current.state.drumPatterns).toHaveLength(3);
    expect(result.current.state.drumPatterns[2].name).toBe('Pattern 3');
  });

  it('removes an unused pattern with REMOVE_PATTERN but keeps used ones', () => {
    const { result } = renderDAW();
    act(() =>
      result.current.dispatch({
        type: 'ADD_PATTERN',
        pattern: { id: 'unused', name: 'Unused', steps: 16, grid: createEmptyDrumGrid(16) },
      }),
    );
    act(() => result.current.dispatch({ type: 'REMOVE_PATTERN', patternId: 'unused' }));
    expect(result.current.state.drumPatterns.map(p => p.id)).not.toContain('unused');
    // default-pattern is used by track-1's clip -> cannot be removed
    act(() => result.current.dispatch({ type: 'REMOVE_PATTERN', patternId: 'default-pattern' }));
    expect(result.current.state.drumPatterns.some(p => p.id === 'default-pattern')).toBe(true);
  });

  it('assigns a pattern to a clip with ASSIGN_PATTERN_TO_CLIP', () => {
    const { result } = renderDAW();
    act(() =>
      result.current.dispatch({
        type: 'ASSIGN_PATTERN_TO_CLIP',
        trackId: 'track-1',
        clipId: 'clip-1',
        patternId: 'custom',
      }),
    );
    expect(result.current.state.tracks[0].clips[0].patternId).toBe('custom');
  });

  it('resizes pattern steps with SET_PATTERN_STEPS preserving existing hits', () => {
    const { result } = renderDAW();
    const patternId = result.current.state.drumPatterns[0].id;
    act(() => result.current.dispatch({ type: 'SET_PATTERN_STEPS', patternId, steps: 32 }));
    const p = result.current.state.drumPatterns[0];
    expect(p.steps).toBe(32);
    expect(p.grid.kick).toHaveLength(32);
    expect(p.grid.kick[0]).toBe(true); // original hit preserved
    // shrink preserves first N
    act(() => result.current.dispatch({ type: 'SET_PATTERN_STEPS', patternId, steps: 8 }));
    expect(result.current.state.drumPatterns[0].grid.kick).toHaveLength(8);
    expect(result.current.state.drumPatterns[0].grid.kick[0]).toBe(true);
  });

  it('adds a track with a new pattern via ADD_TRACK_WITH_PATTERN', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'ADD_TRACK_WITH_PATTERN' }));
    expect(result.current.state.tracks).toHaveLength(3);
    expect(result.current.state.drumPatterns).toHaveLength(3);
    const newTrack = result.current.state.tracks[2];
    expect(newTrack.name).toBe('Track 3');
    expect(result.current.state.selectedTrackId).toBe(newTrack.id);
  });

  it('removes a track and orphaned patterns with REMOVE_TRACK', () => {
    const { result } = renderDAW();
    // Add a track (creates its own pattern) then remove the default track
    act(() => result.current.dispatch({ type: 'ADD_TRACK_WITH_PATTERN' }));
    const newTrackId = result.current.state.tracks[2].id;
    act(() => result.current.dispatch({ type: 'REMOVE_TRACK', trackId: 'track-1' }));
    // default-pattern was only referenced by track-1 -> removed
    expect(result.current.state.drumPatterns.some(p => p.id === 'default-pattern')).toBe(false);
    expect(result.current.state.tracks.map(t => t.id)).toEqual(['8gebvw0c', newTrackId]);
    // selected track stays on the added track (selected by ADD_TRACK_WITH_PATTERN)
    expect(result.current.state.selectedTrackId).toBe(newTrackId);
  });

  it('sets track volume / pan with SET_TRACK_VOLUME and SET_TRACK_PAN', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'SET_TRACK_VOLUME', trackId: 'track-1', volume: 0.3 }));
    expect(result.current.state.tracks[0].volume).toBe(0.3);
    act(() => result.current.dispatch({ type: 'SET_TRACK_PAN', trackId: 'track-1', pan: -0.5 }));
    expect(result.current.state.tracks[0].pan).toBe(-0.5);
  });

  it('toggles mute and solo with TOGGLE_TRACK_MUTE / TOGGLE_TRACK_SOLO', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'TOGGLE_TRACK_MUTE', trackId: 'track-1' }));
    expect(result.current.state.tracks[0].muted).toBe(true);
    act(() => result.current.dispatch({ type: 'TOGGLE_TRACK_SOLO', trackId: 'track-1' }));
    expect(result.current.state.tracks[0].solo).toBe(true);
  });

  it('renames a track with RENAME_TRACK', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'RENAME_TRACK', trackId: 'track-1', name: 'Bass' }));
    expect(result.current.state.tracks[0].name).toBe('Bass');
  });

  it('adds / removes clips with ADD_CLIP and REMOVE_CLIP', () => {
    const { result } = renderDAW();
    act(() =>
      result.current.dispatch({
        type: 'ADD_CLIP',
        trackId: 'track-1',
        clip: {
          id: 'clip-2',
          type: 'drum',
          startBeat: 4,
          durationBeats: 4,
          patternId: 'default-pattern',
        },
      }),
    );
    expect(result.current.state.tracks[0].clips).toHaveLength(3);
    act(() => result.current.dispatch({ type: 'REMOVE_CLIP', trackId: 'track-1', clipId: 'clip-2' }));
    expect(result.current.state.tracks[0].clips).toHaveLength(2);
  });

  it('adds a sample track with ADD_SAMPLE_TRACK', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'ADD_SAMPLE_TRACK', sampleId: 'kalimba', name: 'Kalimba', loop: true }));
    const track = result.current.state.tracks[result.current.state.tracks.length - 1];
    expect(track.name).toBe('Kalimba');
    expect(track.clips).toHaveLength(1);
    expect(track.clips[0].type).toBe('sample');
    expect(track.clips[0].sampleId).toBe('kalimba');
    expect(track.clips[0].loop).toBe(true);
    // New track is selected
    expect(result.current.state.selectedTrackId).toBe(track.id);
  });

  it('adds a synth track with ADD_SYNTH_TRACK', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'ADD_SYNTH_TRACK' }));
    const track = result.current.state.tracks[result.current.state.tracks.length - 1];
    expect(track.clips).toHaveLength(1);
    expect(track.clips[0].type).toBe('synth');
    // A new synth pattern was created and referenced by the clip.
    const patternId = track.clips[0].patternId;
    expect(result.current.state.synthPatterns.some(p => p.id === patternId)).toBe(true);
    // New track is selected
    expect(result.current.state.selectedTrackId).toBe(track.id);
  });

  it('selects a clip with SELECT_CLIP', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'SELECT_CLIP', trackId: 'track-1', clipId: 'clip-1' }));
    expect(result.current.state.selectedClipId).toBe('clip-1');
  });

  it('moves a clip within the same track with MOVE_CLIP', () => {
    const { result } = renderDAW();
    act(() =>
      result.current.dispatch({
        type: 'MOVE_CLIP',
        fromTrackId: 'track-1',
        toTrackId: 'track-1',
        clipId: 'clip-1',
        startBeat: 8,
      }),
    );
    expect(result.current.state.tracks[0].clips[0].startBeat).toBe(8);
  });

  it('moves a clip across tracks with MOVE_CLIP', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'ADD_TRACK_WITH_PATTERN' }));
    const targetId = result.current.state.tracks[1].id;
    act(() =>
      result.current.dispatch({
        type: 'MOVE_CLIP',
        fromTrackId: 'track-1',
        toTrackId: targetId,
        clipId: 'clip-1',
        startBeat: 4,
      }),
    );
    expect(result.current.state.tracks[0].clips).toHaveLength(1);
    expect(result.current.state.tracks[1].clips).toHaveLength(2);
    expect(result.current.state.tracks[1].clips.find(c => c.id === 'clip-1')?.startBeat).toBe(4);
    expect(result.current.state.selectedTrackId).toBe(targetId);
  });

  it('resizes a clip with RESIZE_CLIP (clamped to min 1)', () => {
    const { result } = renderDAW();
    act(() =>
      result.current.dispatch({ type: 'RESIZE_CLIP', trackId: 'track-1', clipId: 'clip-1', durationBeats: 0.5 }),
    );
    expect(result.current.state.tracks[0].clips[0].durationBeats).toBe(1);
    act(() =>
      result.current.dispatch({ type: 'RESIZE_CLIP', trackId: 'track-1', clipId: 'clip-1', durationBeats: 8 }),
    );
    expect(result.current.state.tracks[0].clips[0].durationBeats).toBe(8);
  });

  it('duplicates a clip with DUPLICATE_CLIP', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'DUPLICATE_CLIP', trackId: 'track-1', clipId: 'clip-1' }));
    expect(result.current.state.tracks[0].clips).toHaveLength(3);
    const dup = result.current.state.tracks[0].clips[2];
    expect(dup.startBeat).toBe(4);
    expect(dup.id).not.toBe('clip-1');
  });

  it('selects a track with SELECT_TRACK', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'ADD_TRACK_WITH_PATTERN' }));
    act(() => result.current.dispatch({ type: 'SELECT_TRACK', trackId: 'track-1' }));
    expect(result.current.state.selectedTrackId).toBe('track-1');
    expect(result.current.state.selectedClipId).toBe('clip-1');
  });

  it('loads a project with LOAD_PROJECT', () => {
    const { result } = renderDAW();
    act(() =>
      result.current.dispatch({
        type: 'LOAD_PROJECT',
        project: {
          projectName: 'Loaded',
          bpm: 100,
          timeSignature: [3, 4],
          tracks: [],
          drumPatterns: [],
          synthPatterns: [],
          masterVolume: 0.6,
          loopEnabled: false,
          loopStart: 0,
          loopEnd: 8,
        },
      }),
    );
    const s = result.current.state;
    expect(s.projectName).toBe('Loaded');
    expect(s.bpm).toBe(100);
    expect(s.isPlaying).toBe(false);
    expect(s.currentStep).toBe(-1);
  });
});

describe('getActivePatternId', () => {
  function makeState(partial: Record<string, unknown>) {
    const { result } = renderDAW();
    const base = result.current.state;
    return { ...base, ...partial } as typeof base;
  }

  it('returns null when selected track has no clips', () => {
    const s = makeState({
      selectedTrackId: 't2',
      tracks: [{ id: 't2', name: 'T', volume: 1, pan: 0, muted: false, solo: false, clips: [] }],
    });
    expect(getActivePatternId(s)).toBeNull();
  });

  it('returns the selected clip pattern id', () => {
    const s = makeState({
      selectedTrackId: 'track-1',
      selectedClipId: 'clip-1',
    });
    expect(getActivePatternId(s)).toBe('default-pattern');
  });
});

describe('pattern renaming', () => {
  it('renames a pattern with RENAME_PATTERN', () => {
    const { result } = renderDAW();
    const patternId = result.current.state.drumPatterns[0].id;
    act(() => result.current.dispatch({ type: 'RENAME_PATTERN', patternId, name: 'Main Groove' }));
    expect(result.current.state.drumPatterns[0].name).toBe('Main Groove');
  });

  it('leaves other patterns untouched when renaming one', () => {
    const { result } = renderDAW();
    act(() =>
      result.current.dispatch({
        type: 'ADD_PATTERN',
        pattern: { id: 'p2', name: 'Pattern 3', steps: 16, grid: createEmptyDrumGrid(16) },
      }),
    );
    const firstId = result.current.state.drumPatterns[0].id;
    act(() => result.current.dispatch({ type: 'RENAME_PATTERN', patternId: firstId, name: 'Renamed' }));
    expect(result.current.state.drumPatterns[0].name).toBe('Renamed');
    expect(result.current.state.drumPatterns[1].name).toBe('Clap & Cymbal');
    expect(result.current.state.drumPatterns[2].name).toBe('Pattern 3');
  });
});

describe('reset project', () => {
  it('RESET_PROJECT restores the default project', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'SET_PROJECT_NAME', name: 'My Groove' }));
    act(() => result.current.dispatch({ type: 'SET_BPM', bpm: 140 }));
    act(() => result.current.dispatch({ type: 'ADD_TRACK_WITH_PATTERN' }));
    expect(result.current.state.tracks).toHaveLength(3);

    act(() => result.current.dispatch({ type: 'RESET_PROJECT' }));
    expect(result.current.state.projectName).toBe('Starter Project');
    expect(result.current.state.bpm).toBe(120);
    expect(result.current.state.tracks).toHaveLength(2);
    expect(result.current.state.tracks[0].name).toBe('Drums');
    expect(result.current.state.isPlaying).toBe(false);
    // Autosave is forced off after reset so the default project isn't written
    // over the user's saved work until they re-enable it.
    expect(result.current.state.autosaveEnabled).toBe(false);
  });
});

describe('persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('serializeProject produces a JSON string with project data', () => {
    const { result } = renderDAW();
    const raw = serializeProject(result.current.state);
    const parsed = JSON.parse(raw);
    expect(parsed.projectName).toBe('Starter Project');
    expect(parsed.bpm).toBe(120);
    expect(Array.isArray(parsed.tracks)).toBe(true);
    expect(Array.isArray(parsed.drumPatterns)).toBe(true);
    // transient state must not be serialized
    expect(parsed.isPlaying).toBeUndefined();
    expect(parsed.currentStep).toBeUndefined();
  });

  it('deserializeProject round-trips a valid project', () => {
    const { result } = renderDAW();
    const raw = serializeProject(result.current.state);
    const project = deserializeProject(raw);
    expect(project).not.toBeNull();
    expect(project!.projectName).toBe('Starter Project');
    expect(project!.bpm).toBe(120);
    expect(project!.tracks).toHaveLength(2);
  });

  it('deserializeProject returns null for invalid input', () => {
    expect(deserializeProject(null)).toBeNull();
    expect(deserializeProject('not json')).toBeNull();
    expect(deserializeProject('{"foo": 1}')).toBeNull();
  });

  it('saveProject writes to localStorage and loadProject restores it', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'SET_PROJECT_NAME', name: 'Saved Groove' }));
    act(() => result.current.saveProject());

    // Remount a fresh provider to simulate a new session, then load.
    const reloaded = renderHook(() => useDAW(), { wrapper: DAWProvider });
    expect(reloaded.result.current.state.projectName).toBe('Saved Groove');
  });

  it('resetProject resets state but leaves storage intact', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'SET_PROJECT_NAME', name: 'Temp' }));
    act(() => result.current.saveProject());
    expect(window.localStorage.getItem('groove-composer:project')).toContain('Temp');

    act(() => result.current.resetProject());
    expect(result.current.state.projectName).toBe('Starter Project');
    // The saved project in storage is left untouched.
    expect(window.localStorage.getItem('groove-composer:project')).toContain('Temp');
  });

  it('loadProject returns false when nothing is saved', () => {
    window.localStorage.removeItem('groove-composer:project');
    const { result } = renderDAW();
    let ok: boolean | null = null;
    act(() => { ok = result.current.loadProject(); });
    expect(ok).toBe(false);
  });
});

describe('autosave preferences', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to autosave enabled at 5s', () => {
    const { result } = renderDAW();
    expect(result.current.state.autosaveEnabled).toBe(true);
    expect(result.current.state.autosaveIntervalSeconds).toBe(5);
  });

  it('SET_AUTOSAVE_ENABLED toggles the preference', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'SET_AUTOSAVE_ENABLED', enabled: false }));
    expect(result.current.state.autosaveEnabled).toBe(false);
  });

  it('SET_AUTOSAVE_INTERVAL clamps to the 60:00 maximum', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'SET_AUTOSAVE_INTERVAL', seconds: 99999 }));
    expect(result.current.state.autosaveIntervalSeconds).toBe(3600);
    act(() => result.current.dispatch({ type: 'SET_AUTOSAVE_INTERVAL', seconds: 0 }));
    expect(result.current.state.autosaveIntervalSeconds).toBe(1);
  });

  it('prefs persist to their own key, separate from the project', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'SET_AUTOSAVE_ENABLED', enabled: false }));
    act(() => result.current.dispatch({ type: 'SET_AUTOSAVE_INTERVAL', seconds: 300 }));
    // Prefs are written to their own key.
    expect(window.localStorage.getItem(PREFS_KEY)).toContain('"autosaveEnabled":false');
    // The project key must NOT contain prefs (it may be null until the timer fires).
    const projectRaw = window.localStorage.getItem('groove-composer:project');
    expect(projectRaw === null || !projectRaw.includes('autosaveEnabled')).toBe(true);
  });

  it('an "off" preference is respected on a fresh load', () => {
    savePrefsToStorage({ autosaveEnabled: false, autosaveIntervalSeconds: 120 });
    const { result } = renderDAW();
    expect(result.current.state.autosaveEnabled).toBe(false);
    expect(result.current.state.autosaveIntervalSeconds).toBe(120);
  });

  it('loadPrefsFromStorage falls back to defaults on invalid data', () => {
    window.localStorage.setItem(PREFS_KEY, 'not json');
    expect(loadPrefsFromStorage()).toEqual({ autosaveEnabled: true, autosaveIntervalSeconds: 5 });
  });
});

describe('query-string project load', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  function setQueryUrl(projectJson: string | null) {
    const url = projectJson === null
      ? new URL('http://localhost:8080/')
      : new URL(`http://localhost:8080/?${QUERY_PARAM}=${encodeProjectToQuery(projectJson)}`);
    Object.defineProperty(window, 'location', { writable: true, value: url });
  }

  it('loadFromQueryString parses a valid shared project', () => {
    const json = JSON.stringify({
      projectName: 'Shared Groove',
      bpm: 150,
      timeSignature: [4, 4],
      tracks: [],
      drumPatterns: [],
      synthPatterns: [],
      masterVolume: 0.8,
      loopEnabled: true,
      loopStart: 0,
      loopEnd: 4,
    });
    setQueryUrl(json);
    const project = loadFromQueryString();
    expect(project).not.toBeNull();
    expect(project!.projectName).toBe('Shared Groove');
    expect(project!.bpm).toBe(150);
  });

  it('loadFromQueryString returns null when no query param is present', () => {
    setQueryUrl(null);
    expect(loadFromQueryString()).toBeNull();
  });

  it('loadFromQueryString returns null for malformed data', () => {
    setQueryUrl('not json');
    expect(loadFromQueryString()).toBeNull();
  });

  it('hydrating from a query string loads the shared project and forces autosave off', () => {
    savePrefsToStorage({ autosaveEnabled: true, autosaveIntervalSeconds: 30 });
    const json = JSON.stringify({
      projectName: 'From Link',
      bpm: 95,
      timeSignature: [4, 4],
      tracks: [],
      drumPatterns: [],
      synthPatterns: [],
      masterVolume: 0.8,
      loopEnabled: true,
      loopStart: 0,
      loopEnd: 4,
    });
    setQueryUrl(json);
    const { result } = renderDAW();
    expect(result.current.state.projectName).toBe('From Link');
    expect(result.current.state.bpm).toBe(95);
    // Autosave forced off even though the stored preference says on.
    expect(result.current.state.autosaveEnabled).toBe(false);
  });

  it('loading from a query string does not overwrite localStorage', () => {
    window.localStorage.setItem('groove-composer:project', JSON.stringify({ projectName: 'Saved' }));
    setQueryUrl(JSON.stringify({ projectName: 'From Link', bpm: 95, timeSignature: [4, 4], tracks: [], drumPatterns: [], synthPatterns: [], masterVolume: 0.8, loopEnabled: true, loopStart: 0, loopEnd: 4 }));
    renderDAW();
    // The saved project key is untouched by the shared link load.
    expect(window.localStorage.getItem('groove-composer:project')).toContain('"projectName":"Saved"');
  });

  it('a malformed query string falls back to localStorage without blocking', () => {
    // A saved project exists in storage.
    window.localStorage.setItem('groove-composer:project', JSON.stringify({
      projectName: 'Saved Groove', bpm: 120, timeSignature: [4, 4], tracks: [], drumPatterns: [], synthPatterns: [], masterVolume: 0.8, loopEnabled: true, loopStart: 0, loopEnd: 4,
    }));
    // The query param is present but invalid base64.
    Object.defineProperty(window, 'location', {
      writable: true,
      value: new URL(`http://localhost:8080/?${QUERY_PARAM}=!!!not-valid-base64!!!`),
    });
    const { result } = renderDAW();
    // We fall through to the saved project immediately (no delay/blocking).
    expect(result.current.state.projectName).toBe('Saved Groove');
    // Autosave stays on (we did NOT load from a shared link).
    expect(result.current.state.autosaveEnabled).toBe(true);
  });

  it('a query string with invalid JSON falls back to localStorage', () => {
    window.localStorage.setItem('groove-composer:project', JSON.stringify({
      projectName: 'Saved Groove', bpm: 120, timeSignature: [4, 4], tracks: [], drumPatterns: [], synthPatterns: [], masterVolume: 0.8, loopEnabled: true, loopStart: 0, loopEnd: 4,
    }));
    // Valid base64, but the decoded content is not valid JSON.
    setQueryUrl('this is not json');
    const { result } = renderDAW();
    expect(result.current.state.projectName).toBe('Saved Groove');
    expect(result.current.state.autosaveEnabled).toBe(true);
  });

  it('a query string with valid JSON but the wrong shape falls back to localStorage', () => {
    window.localStorage.setItem('groove-composer:project', JSON.stringify({
      projectName: 'Saved Groove', bpm: 120, timeSignature: [4, 4], tracks: [], drumPatterns: [], synthPatterns: [], masterVolume: 0.8, loopEnabled: true, loopStart: 0, loopEnd: 4,
    }));
    // Valid JSON, but missing the required project fields (e.g. no tracks).
    setQueryUrl(JSON.stringify({ foo: 'bar' }));
    const { result } = renderDAW();
    expect(result.current.state.projectName).toBe('Saved Groove');
    expect(result.current.state.autosaveEnabled).toBe(true);
  });
});
