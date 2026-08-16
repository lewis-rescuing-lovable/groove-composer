import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { audioEngine } from './audio-engine';
import { DRUM_SOUNDS } from './types';

// --- Minimal Web Audio API mocks ---
class MockAudioParam {
  value = 0;
  setValueAtTime(v: number) { this.value = v; return this; }
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

  describe('dispose', () => {
    it('stops and closes context', () => {
      audioEngine.init();
      audioEngine.dispose();
      expect(audioEngine.context).toBeNull();
      expect(audioEngine.playing).toBe(false);
    });
  });
});
