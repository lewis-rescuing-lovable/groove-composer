import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { audioEngine } from './audio-engine';
import { DRUM_SOUNDS } from './types';

// --- Minimal Web Audio API mocks ---
class MockAudioParam {
  value = 0;
  setValueAtTime(v: number) { this.value = v; return this; }
  linearRampToValueAtTime(v: number) { this.value = v; return this; }
  exponentialRampToValueAtTime(v: number) { this.value = v; return this; }
}

class MockGainNode {
  gain = new MockAudioParam();
  connect() { return this; }
}

class MockAnalyserNode {
  fftSize = 256;
  frequencyBinCount = 128;
  getByteFrequencyData() {}
  connect() { return this; }
}

class MockStereoPannerNode {
  pan = new MockAudioParam();
  connect() { return this; }
}

class MockBiquadFilterNode {
  type = 'highpass';
  frequency = new MockAudioParam();
  Q = new MockAudioParam();
  connect() { return this; }
}

class MockOscillatorNode {
  type = 'sine';
  frequency = new MockAudioParam();
  connect() { return this; }
  start() {}
  stop() {}
}

class MockBufferSourceNode {
  buffer: unknown = null;
  loop = false;
  onended: (() => void) | null = null;
  connect() { return this; }
  start() {}
  stop() {}
}

class MockAudioBuffer {
  constructor(public channels: number, public length: number, public sampleRate: number) {}
  getChannelData() { return new Float32Array(this.length); }
}

class MockAudioContext {
  state: AudioContextState = 'running';
  currentTime = 0;
  sampleRate = 44100;
  destination = {};
  createGain() { return new MockGainNode(); }
  createAnalyser() { return new MockAnalyserNode(); }
  createStereoPanner() { return new MockStereoPannerNode(); }
  createBiquadFilter() { return new MockBiquadFilterNode(); }
  createOscillator() { return new MockOscillatorNode(); }
  createBufferSource() { return new MockBufferSourceNode(); }
  createBuffer(ch: number, len: number, sr: number) { return new MockAudioBuffer(ch, len, sr); }
  resume() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
}

// Need to keep a reference to the mock instance so we can read its state
let lastMockCtx: MockAudioContext | null = null;

function installAudioMock() {
  const factory = vi.fn().mockImplementation(function () {
    lastMockCtx = new MockAudioContext();
    return lastMockCtx;
  });
  vi.stubGlobal('AudioContext', factory);
  vi.stubGlobal('webkitAudioContext', factory);
}

beforeEach(() => {
  installAudioMock();
  vi.spyOn(window, 'setInterval').mockReturnValue(123 as never);
  vi.spyOn(window, 'clearInterval').mockImplementation(() => {});
});

afterEach(() => {
  audioEngine.dispose();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  lastMockCtx = null;
});

const sampleTrack = {
  id: 't1',
  name: 'Drums',
  volume: 0.8,
  pan: 0,
  muted: false,
  solo: false,
  clips: [
    {
      id: 'c1',
      type: 'drum' as const,
      startBeat: 0,
      durationBeats: 4,
      patternId: 'p1',
    },
  ],
};

const pattern = {
  id: 'p1',
  name: 'P1',
  steps: 16,
  grid: Object.fromEntries(DRUM_SOUNDS.map(s => [s, new Array(16).fill(false)])) as never,
};

describe('AudioEngine', () => {
  describe('init / context', () => {
    it('initializes a context and exposes it', () => {
      expect(audioEngine.context).toBeNull();
      audioEngine.init();
      expect(audioEngine.context).not.toBeNull();
      expect(audioEngine.analyserNode).not.toBeNull();
      // init is idempotent
      const ctx = audioEngine.context;
      audioEngine.init();
      expect(audioEngine.context).toBe(ctx);
    });
  });

  describe('master volume / bpm / loop', () => {
    it('sets master volume', () => {
      // Capture the first gain node (masterGain) created during init
      const createdGains: MockGainNode[] = [];
      const origCreateGain = MockAudioContext.prototype.createGain;
      MockAudioContext.prototype.createGain = function () {
        const g = origCreateGain.call(this) as MockGainNode;
        createdGains.push(g);
        return g;
      };
      audioEngine.init();
      const masterGain = createdGains[0];
      audioEngine.setMasterVolume(0.4);
      expect(masterGain.gain.value).toBe(0.4);
      MockAudioContext.prototype.createGain = origCreateGain;
      // Calling without a context is a no-op
      audioEngine.dispose();
      audioEngine.setMasterVolume(0.5);
    });

    it('sets bpm and loop', () => {
      audioEngine.setBpm(140);
      audioEngine.setLoopEnabled(false);
      expect(audioEngine.playing).toBe(false);
    });

    it('mutes and unmutes the master output', () => {
      const createdGains: MockGainNode[] = [];
      const origCreateGain = MockAudioContext.prototype.createGain;
      MockAudioContext.prototype.createGain = function () {
        const g = origCreateGain.call(this) as MockGainNode;
        createdGains.push(g);
        return g;
      };
      audioEngine.init();
      const masterGain = createdGains[0];
      audioEngine.setMasterVolume(0.4);
      expect(masterGain.gain.value).toBe(0.4);
      // Mute -> gain 0
      audioEngine.setMasterMuted(true);
      expect(masterGain.gain.value).toBe(0);
      // Unmute -> restores last volume
      audioEngine.setMasterMuted(false);
      expect(masterGain.gain.value).toBe(0.4);
      MockAudioContext.prototype.createGain = origCreateGain;
      audioEngine.dispose();
    });

    it('init respects a pre-set mute state', () => {
      // Set mute BEFORE the context exists, then init — the gain must start at 0.
      audioEngine.setMasterMuted(true);
      audioEngine.setMasterVolume(0.6);
      const createdGains: MockGainNode[] = [];
      const origCreateGain = MockAudioContext.prototype.createGain;
      MockAudioContext.prototype.createGain = function () {
        const g = origCreateGain.call(this) as MockGainNode;
        createdGains.push(g);
        return g;
      };
      audioEngine.init();
      const masterGain = createdGains[0];
      expect(masterGain.gain.value).toBe(0);
      MockAudioContext.prototype.createGain = origCreateGain;
      audioEngine.dispose();
    });
  });

  describe('setTracks', () => {
    it('updates tracks and derives total steps', () => {
      audioEngine.init();
      audioEngine.setTracks([sampleTrack], [pattern]);
      expect(audioEngine.step).toBe(0);
      // furthest clip end is beat 4 -> 16 steps
    });

    it('handles muted and soloed tracks', () => {
      audioEngine.init();
      const soloTrack = {
        ...sampleTrack,
        id: 't2',
        solo: true,
      };
      const mutedTrack = { ...sampleTrack, id: 't3', muted: true };
      audioEngine.setTracks([soloTrack, mutedTrack], [pattern]);
      // no throw
      expect(audioEngine.context).not.toBeNull();
    });

    it('handles tracks beyond one bar for total steps', () => {
      audioEngine.init();
      const longClip = {
        ...sampleTrack,
        clips: [{ ...sampleTrack.clips[0], startBeat: 8, durationBeats: 8 }],
      };
      audioEngine.setTracks([longClip], [pattern]);
    });
  });

  describe('playback', () => {
    it('play starts and stop clears the timer + resets step', () => {
      audioEngine.init();
      audioEngine.setTracks([sampleTrack], [pattern]);
      audioEngine.play();
      expect(audioEngine.playing).toBe(true);
      // play() when already playing returns early
      audioEngine.play();
      expect(audioEngine.playing).toBe(true);
      audioEngine.stop();
      expect(audioEngine.playing).toBe(false);
      expect(audioEngine.step).toBe(0);
      expect(window.clearInterval).toHaveBeenCalled();
    });

    it('pause stops without resetting step', () => {
      audioEngine.init();
      audioEngine.setTracks([sampleTrack], [pattern]);
      audioEngine.play();
      audioEngine.pause();
      expect(audioEngine.playing).toBe(false);
      expect(window.clearInterval).toHaveBeenCalled();
    });

    it('schedules a callback via onStep when stop is called', () => {
      audioEngine.init();
      const cb = vi.fn();
      audioEngine.onStep(cb);
      audioEngine.setTracks([sampleTrack], [pattern]);
      audioEngine.stop();
      expect(cb).toHaveBeenCalledWith(-1);
    });
  });

  describe('drum sound previews', () => {
    it('plays every drum sound without throwing', () => {
      audioEngine.init();
      for (const sound of DRUM_SOUNDS) {
        audioEngine.previewSound(sound);
      }
      expect(audioEngine.context).not.toBeNull();
    });

    it('previewSound initializes if not yet created', () => {
      audioEngine.previewSound('kick');
      expect(audioEngine.context).not.toBeNull();
    });

    it('playDrumSound returns early without a context', () => {
      // No context created yet
      audioEngine.playDrumSound('kick', 0);
    });
  });

  describe('synth note previews', () => {
    const voice = {
      waveform: 'sawtooth' as const,
      filterCutoff: 1200,
      filterResonance: 1,
      attack: 0.01,
      decay: 0.2,
      sustain: 0.6,
      release: 0.3,
    };

    it('previewNote initializes a context and plays a note', () => {
      audioEngine.previewNote(60, voice);
      expect(audioEngine.context).not.toBeNull();
    });

    it('playSynthNote returns early without a context', () => {
      // No context created yet
      audioEngine.playSynthNote(60, 0, voice);
    });

    it('plays a note through an initialized context without throwing', () => {
      audioEngine.init();
      audioEngine.playSynthNote(69, 0, voice);
      expect(audioEngine.context).not.toBeNull();
    });
  });

  describe('piano note synthesis', () => {
    it('playPianoNote returns early without a context', () => {
      // No context created yet
      audioEngine.playPianoNote(60, 0);
    });

    it('plays a piano note through an initialized context without throwing', () => {
      audioEngine.init();
      audioEngine.playPianoNote(69, 0);
      expect(audioEngine.context).not.toBeNull();
    });
  });

  describe('getTrackAnalyser', () => {
    it('returns null for unknown track', () => {
      audioEngine.init();
      expect(audioEngine.getTrackAnalyser('nope')).toBeNull();
    });
  });

  describe('playSample', () => {
    it('throws when no sample loader is attached', async () => {
      audioEngine.init();
      await expect(audioEngine.playSample('kalimba')).rejects.toThrow('No sample loader');
    });

    it('plays a loaded sample buffer', async () => {
      audioEngine.init();
      const loader = {
        setContext: vi.fn(),
        load: vi.fn().mockResolvedValue({
          status: 'ready',
          buffer: { length: 100 },
          error: null,
        }),
      };
      audioEngine.setSampleLoader(loader as never);
      await expect(audioEngine.playSample('kalimba')).resolves.toBeUndefined();
      expect(loader.load).toHaveBeenCalledWith('kalimba');
    });

    it('rejects when the sample failed to load', async () => {
      audioEngine.init();
      const loader = {
        setContext: vi.fn(),
        load: vi.fn().mockResolvedValue({
          status: 'error',
          buffer: null,
          error: 'boom',
        }),
      };
      audioEngine.setSampleLoader(loader as never);
      await expect(audioEngine.playSample('kalimba')).rejects.toThrow('boom');
    });
  });

  describe('sample clip scheduling', () => {
    // Drive the scheduler by making setInterval actually invoke its callback
    // several times, advancing the mock context's clock so currentStep advances.
    function driveScheduler(times = 5) {
      vi.spyOn(window, 'setInterval').mockImplementation(((cb: () => void) => {
        for (let i = 0; i < times; i++) {
          if (lastMockCtx) lastMockCtx.currentTime += 0.2;
          cb();
        }
        return 123 as never;
      }) as never);
    }

    it('schedules a one-shot sample clip at its start step', async () => {
      audioEngine.init();
      const loader = {
        setContext: vi.fn(),
        load: vi.fn().mockResolvedValue({
          status: 'ready',
          buffer: { length: 100 },
          error: null,
        }),
      };
      audioEngine.setSampleLoader(loader as never);

      const sampleTrack = {
        id: 'st1',
        name: 'Kalimba',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [{
          id: 'sc1',
          type: 'sample' as const,
          startBeat: 0,
          durationBeats: 4,
          sampleId: 'kalimba',
          loop: false,
        }],
      };
      audioEngine.setTracks([sampleTrack], []);
      driveScheduler();
      audioEngine.play();
      await Promise.resolve();
      expect(loader.load).toHaveBeenCalledWith('kalimba');
      audioEngine.stop();
    });

    it('schedules a looping sample clip', async () => {
      audioEngine.init();
      const loader = {
        setContext: vi.fn(),
        load: vi.fn().mockResolvedValue({
          status: 'ready',
          buffer: { length: 100 },
          error: null,
        }),
      };
      audioEngine.setSampleLoader(loader as never);

      const sampleTrack = {
        id: 'st2',
        name: 'Bell',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [{
          id: 'sc2',
          type: 'sample' as const,
          startBeat: 0,
          durationBeats: 4,
          sampleId: 'bell',
          loop: true,
        }],
      };
      audioEngine.setTracks([sampleTrack], []);
      driveScheduler();
      audioEngine.play();
      await Promise.resolve();
      expect(loader.load).toHaveBeenCalledWith('bell');
      audioEngine.stop();
    });

    it('ignores a sample clip with no sampleId', async () => {
      audioEngine.init();
      const loader = {
        setContext: vi.fn(),
        load: vi.fn(),
      };
      audioEngine.setSampleLoader(loader as never);

      const sampleTrack = {
        id: 'st3',
        name: 'Empty',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [{
          id: 'sc3',
          type: 'sample' as const,
          startBeat: 0,
          durationBeats: 4,
          loop: false,
        }],
      };
      audioEngine.setTracks([sampleTrack], []);
      driveScheduler();
      audioEngine.play();
      await Promise.resolve();
      expect(loader.load).not.toHaveBeenCalled();
      audioEngine.stop();
    });

    it('does not schedule a sample clip before its start step', async () => {
      audioEngine.init();
      const loader = {
        setContext: vi.fn(),
        load: vi.fn(),
      };
      audioEngine.setSampleLoader(loader as never);

      const sampleTrack = {
        id: 'st4',
        name: 'Later',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [{
          id: 'sc4',
          type: 'sample' as const,
          startBeat: 8,
          durationBeats: 4,
          sampleId: 'kalimba',
          loop: false,
        }],
      };
      audioEngine.setTracks([sampleTrack], []);
      driveScheduler();
      audioEngine.play();
      await Promise.resolve();
      // At step 0 the clip (startBeat 8) is out of range, so no load.
      expect(loader.load).not.toHaveBeenCalled();
      audioEngine.stop();
    });

    it('does not throw when a scheduled sample fails to load', async () => {
      audioEngine.init();
      const loader = {
        setContext: vi.fn(),
        load: vi.fn().mockResolvedValue({
          status: 'error',
          buffer: null,
          error: 'boom',
        }),
      };
      audioEngine.setSampleLoader(loader as never);

      const sampleTrack = {
        id: 'st5',
        name: 'Broken',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [{
          id: 'sc5',
          type: 'sample' as const,
          startBeat: 0,
          durationBeats: 4,
          sampleId: 'kalimba',
          loop: false,
        }],
      };
      audioEngine.setTracks([sampleTrack], []);
      driveScheduler();
      audioEngine.play();
      await Promise.resolve();
      expect(loader.load).toHaveBeenCalledWith('kalimba');
      audioEngine.stop();
    });

    it('no-ops when scheduling a sample clip without a loader attached', async () => {
      audioEngine.init();
      const sampleTrack = {
        id: 'st6',
        name: 'NoLoader',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [{
          id: 'sc6',
          type: 'sample' as const,
          startBeat: 0,
          durationBeats: 4,
          sampleId: 'kalimba',
          loop: false,
        }],
      };
      audioEngine.setTracks([sampleTrack], []);
      driveScheduler();
      audioEngine.play();
      await Promise.resolve();
      audioEngine.stop();
    });

    it('schedules a looped sample to stop at the clip end', async () => {
      audioEngine.init();
      const loader = {
        setContext: vi.fn(),
        load: vi.fn().mockResolvedValue({
          status: 'ready',
          buffer: { length: 100 },
          error: null,
        }),
      };
      audioEngine.setSampleLoader(loader as never);

      const sampleTrack = {
        id: 'st7',
        name: 'Loop',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [{
          id: 'sc7',
          type: 'sample' as const,
          startBeat: 0,
          durationBeats: 4,
          sampleId: 'kalimba',
          loop: true,
        }],
      };
      audioEngine.setTracks([sampleTrack], []);
      driveScheduler();
      audioEngine.play();
      await Promise.resolve();
      // The looped source should have been told to stop at the clip end.
      expect(loader.load).toHaveBeenCalledWith('kalimba');
      audioEngine.stop();
    });

    it('stop() silences all active sample sources', async () => {
      audioEngine.init();
      const loader = {
        setContext: vi.fn(),
        load: vi.fn().mockResolvedValue({
          status: 'ready',
          buffer: { length: 100 },
          error: null,
        }),
      };
      audioEngine.setSampleLoader(loader as never);

      // Capture created sources so we can assert stop() calls source.stop().
      const createdSources: MockBufferSourceNode[] = [];
      const origCreate = MockAudioContext.prototype.createBufferSource;
      MockAudioContext.prototype.createBufferSource = function () {
        const s = origCreate.call(this) as MockBufferSourceNode;
        createdSources.push(s);
        return s;
      };

      const sampleTrack = {
        id: 'st8',
        name: 'Loop',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [{
          id: 'sc8',
          type: 'sample' as const,
          startBeat: 0,
          durationBeats: 4,
          sampleId: 'kalimba',
          loop: true,
        }],
      };
      audioEngine.setTracks([sampleTrack], []);
      driveScheduler();
      audioEngine.play();
      await Promise.resolve();
      expect(createdSources.length).toBeGreaterThan(0);

      const stopSpy = vi.spyOn(createdSources[0], 'stop');
      audioEngine.stop();
      expect(stopSpy).toHaveBeenCalled();
      MockAudioContext.prototype.createBufferSource = origCreate;
    });
  });

  describe('synth clip scheduling', () => {
    function driveScheduler(times = 5) {
      vi.spyOn(window, 'setInterval').mockImplementation(((cb: () => void) => {
        for (let i = 0; i < times; i++) {
          if (lastMockCtx) lastMockCtx.currentTime += 0.2;
          cb();
        }
        return 123 as never;
      }) as never);
    }

    const synthTrack = {
      id: 'sy1',
      name: 'Canon',
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      clips: [{
        id: 'syc1',
        type: 'synth' as const,
        startBeat: 0,
        durationBeats: 4,
        patternId: 'canon',
      }],
    };

    const canonPattern = {
      id: 'canon',
      name: 'Canon in D',
      notes: [
        { pitch: 62, startStep: 0, duration: 4, velocity: 0.8 },
        { pitch: 69, startStep: 8, duration: 4, velocity: 0.6 },
      ],
    };

    it('schedules synth notes at their start steps without throwing', () => {
      audioEngine.init();
      audioEngine.setTracks([synthTrack], [], [canonPattern]);
      driveScheduler();
      audioEngine.play();
      expect(audioEngine.context).not.toBeNull();
      audioEngine.stop();
    });

    it('ignores a synth clip with no patternId', () => {
      audioEngine.init();
      const noPatternTrack = {
        ...synthTrack,
        clips: [{ id: 'syx', type: 'synth' as const, startBeat: 0, durationBeats: 4 }],
      };
      audioEngine.setTracks([noPatternTrack], [], [canonPattern]);
      driveScheduler();
      audioEngine.play();
      expect(audioEngine.context).not.toBeNull();
      audioEngine.stop();
    });

    it('ignores a synth clip whose pattern is not in the map', () => {
      audioEngine.init();
      audioEngine.setTracks([synthTrack], [], []);
      driveScheduler();
      audioEngine.play();
      expect(audioEngine.context).not.toBeNull();
      audioEngine.stop();
    });

    it('uses the pattern voice when provided', () => {
      audioEngine.init();
      const pianoPattern = {
        ...canonPattern,
        voice: {
          waveform: 'triangle' as const,
          filterCutoff: 4000,
          filterResonance: 0.5,
          attack: 0.005,
          decay: 0.4,
          sustain: 0.25,
          release: 0.8,
        },
      };
      audioEngine.setTracks([synthTrack], [], [pianoPattern]);
      driveScheduler();
      audioEngine.play();
      expect(audioEngine.context).not.toBeNull();
      audioEngine.stop();
    });

    it('uses the multi-oscillator piano synthesis when piano is set', () => {
      audioEngine.init();
      const pianoPattern = { ...canonPattern, piano: true };
      audioEngine.setTracks([synthTrack], [], [pianoPattern]);
      driveScheduler();
      audioEngine.play();
      expect(audioEngine.context).not.toBeNull();
      audioEngine.stop();
    });
  });

  describe('dispose', () => {
    it('stops and closes context', () => {
      audioEngine.init();
      audioEngine.dispose();
      expect(audioEngine.context).toBeNull();
      expect(audioEngine.playing).toBe(false);
    });
  });
});
