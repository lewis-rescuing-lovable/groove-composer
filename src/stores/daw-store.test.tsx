import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { DAWProvider, useDAW, getActivePatternId, serializeProject, deserializeProject } from './daw-store';
import { createEmptyDrumGrid } from '@/lib/types';

// We can't import the reducer directly; drive it through the provider.
function renderDAW() {
  return renderHook(() => useDAW(), { wrapper: DAWProvider });
}

describe('daw-store reducer', () => {
  it('initializes with a default drum track and pattern', () => {
    const s = renderDAW().result.current.state;
    expect(s.projectName).toBe('Untitled Project');
    expect(s.bpm).toBe(120);
    expect(s.masterVolume).toBe(0.8);
    expect(s.loopEnabled).toBe(true);
    expect(s.tracks).toHaveLength(1);
    expect(s.tracks[0].name).toBe('Drums');
    expect(s.drumPatterns).toHaveLength(1);
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

  it('adds a pattern with ADD_PATTERN', () => {
    const { result } = renderDAW();
    const pattern = {
      id: 'p2',
      name: 'Pattern 2',
      steps: 16,
      grid: createEmptyDrumGrid(16),
    };
    act(() => result.current.dispatch({ type: 'ADD_PATTERN', pattern }));
    expect(result.current.state.drumPatterns).toHaveLength(2);
    expect(result.current.state.drumPatterns[1].name).toBe('Pattern 2');
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
    expect(result.current.state.tracks).toHaveLength(2);
    expect(result.current.state.drumPatterns).toHaveLength(2);
    const newTrack = result.current.state.tracks[1];
    expect(newTrack.name).toBe('Track 2');
    expect(result.current.state.selectedTrackId).toBe(newTrack.id);
  });

  it('removes a track and orphaned patterns with REMOVE_TRACK', () => {
    const { result } = renderDAW();
    // Add a second track (creates its own pattern) then remove the default track
    act(() => result.current.dispatch({ type: 'ADD_TRACK_WITH_PATTERN' }));
    const secondId = result.current.state.tracks[1].id;
    act(() => result.current.dispatch({ type: 'REMOVE_TRACK', trackId: 'track-1' }));
    expect(result.current.state.tracks.map(t => t.id)).toEqual([secondId]);
    // default-pattern no longer referenced -> removed
    expect(result.current.state.drumPatterns.some(p => p.id === 'default-pattern')).toBe(false);
    expect(result.current.state.selectedTrackId).toBe(secondId);
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
    expect(result.current.state.tracks[0].clips).toHaveLength(2);
    act(() => result.current.dispatch({ type: 'REMOVE_CLIP', trackId: 'track-1', clipId: 'clip-2' }));
    expect(result.current.state.tracks[0].clips).toHaveLength(1);
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
    expect(result.current.state.tracks[0].clips).toHaveLength(0);
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
    expect(result.current.state.tracks[0].clips).toHaveLength(2);
    const dup = result.current.state.tracks[0].clips[1];
    expect(dup.startBeat).toBe(4);
    expect(dup.id).not.toBe('clip-1');
  });

  it('sets active panel with SET_ACTIVE_PANEL', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'SET_ACTIVE_PANEL', panel: 'synth' }));
    expect(result.current.state.activePanel).toBe('synth');
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
        pattern: { id: 'p2', name: 'Pattern 2', steps: 16, grid: createEmptyDrumGrid(16) },
      }),
    );
    const firstId = result.current.state.drumPatterns[0].id;
    act(() => result.current.dispatch({ type: 'RENAME_PATTERN', patternId: firstId, name: 'Renamed' }));
    expect(result.current.state.drumPatterns[0].name).toBe('Renamed');
    expect(result.current.state.drumPatterns[1].name).toBe('Pattern 2');
  });
});

describe('reset project', () => {
  it('RESET_PROJECT restores the default project', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'SET_PROJECT_NAME', name: 'My Groove' }));
    act(() => result.current.dispatch({ type: 'SET_BPM', bpm: 140 }));
    act(() => result.current.dispatch({ type: 'ADD_TRACK_WITH_PATTERN' }));
    expect(result.current.state.tracks).toHaveLength(2);

    act(() => result.current.dispatch({ type: 'RESET_PROJECT' }));
    expect(result.current.state.projectName).toBe('Untitled Project');
    expect(result.current.state.bpm).toBe(120);
    expect(result.current.state.tracks).toHaveLength(1);
    expect(result.current.state.tracks[0].name).toBe('Drums');
    expect(result.current.state.isPlaying).toBe(false);
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
    expect(parsed.projectName).toBe('Untitled Project');
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
    expect(project!.projectName).toBe('Untitled Project');
    expect(project!.bpm).toBe(120);
    expect(project!.tracks).toHaveLength(1);
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

  it('resetProject clears storage and resets state', () => {
    const { result } = renderDAW();
    act(() => result.current.dispatch({ type: 'SET_PROJECT_NAME', name: 'Temp' }));
    act(() => result.current.saveProject());
    expect(window.localStorage.getItem('groove-composer:project')).toContain('Temp');

    act(() => result.current.resetProject());
    expect(result.current.state.projectName).toBe('Untitled Project');
    expect(window.localStorage.getItem('groove-composer:project')).toBeNull();
  });

  it('loadProject returns false when nothing is saved', () => {
    window.localStorage.removeItem('groove-composer:project');
    const { result } = renderDAW();
    let ok: boolean | null = null;
    act(() => { ok = result.current.loadProject(); });
    expect(ok).toBe(false);
  });
});
