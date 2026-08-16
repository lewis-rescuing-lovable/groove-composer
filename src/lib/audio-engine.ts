import { DrumSound, DrumPattern, DRUM_SOUNDS, Track, Clip } from './types';
import { SampleLoader } from './sample-loader';

interface TrackPlaybackInfo {
  track: Track;
  patterns: Map<string, DrumPattern>; // patternId -> pattern
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private schedulerTimer: number | null = null;
  private nextStepTime = 0;
  private currentStep = 0;
  private totalSteps = 16;
  private isPlaying = false;
  private bpm = 120;
  private loopEnabled = true;
  private masterMuted = false;
  private lastMasterVolume = 0.8;
  private onStepCallback: ((step: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private trackInfos: TrackPlaybackInfo[] = [];
  private trackGains: Map<string, GainNode> = new Map();
  private trackPans: Map<string, StereoPannerNode> = new Map();
  private trackAnalysers: Map<string, AnalyserNode> = new Map();
  private lookahead = 0.1;
  private scheduleInterval = 25;
  private sampleLoader: SampleLoader | null = null;
  /** Currently-playing sample sources, so stop() can silence them. */
  private activeSources: Set<AudioBufferSourceNode> = new Set();

  get context(): AudioContext | null { return this.ctx; }
  get analyserNode(): AnalyserNode | null { return this.analyser; }
  get playing(): boolean { return this.isPlaying; }
  get step(): number { return this.currentStep; }

  /** Attach a sample loader so the engine can play fetched samples. */
  setSampleLoader(loader: SampleLoader | null) {
    this.sampleLoader = loader;
    if (loader) loader.setContext(this.ctx);
  }

  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    // Respect the last-known volume and mute state (init may run after the
    // provider has already set these, e.g. when play() is called later).
    this.masterGain.gain.value = this.masterMuted ? 0 : this.lastMasterVolume;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    this.sampleLoader?.setContext(this.ctx);
  }

  setMasterVolume(v: number) {
    this.lastMasterVolume = v;
    if (this.masterGain) this.masterGain.gain.value = this.masterMuted ? 0 : v;
  }

  /** Mute/unmute the master output. When muted, the master gain is 0. */
  setMasterMuted(muted: boolean) {
    this.masterMuted = muted;
    if (this.masterGain) this.masterGain.gain.value = muted ? 0 : this.lastMasterVolume;
  }

  setBpm(bpm: number) { this.bpm = bpm; }
  setLoopEnabled(v: boolean) { this.loopEnabled = v; }

  /** Update all tracks and their patterns for playback */
  setTracks(tracks: Track[], drumPatterns: DrumPattern[]) {
    const patternMap = new Map<string, DrumPattern>();
    for (const p of drumPatterns) patternMap.set(p.id, p);

    this.trackInfos = tracks.map(track => ({
      track,
      patterns: patternMap,
    }));

    // Calculate total timeline length in steps (sixteenth notes)
    // Find the furthest clip end across all tracks
    let maxBeat = 4; // minimum 1 bar
    for (const track of tracks) {
      for (const clip of track.clips) {
        const end = clip.startBeat + clip.durationBeats;
        if (end > maxBeat) maxBeat = end;
      }
    }
    this.totalSteps = maxBeat * 4; // 4 sixteenth notes per beat

    // Ensure track audio nodes exist
    for (const track of tracks) {
      this.ensureTrackNodes(track.id);
      this.setTrackVolume(track.id, track.muted ? 0 : track.volume);
      this.setTrackPan(track.id, track.pan);
    }

    // Handle solo: if any track is soloed, mute all non-soloed tracks
    const hasSolo = tracks.some(t => t.solo);
    if (hasSolo) {
      for (const track of tracks) {
        const vol = track.solo ? track.volume : 0;
        this.setTrackVolume(track.id, vol);
      }
    }
  }

  getTrackAnalyser(trackId: string): AnalyserNode | null {
    return this.trackAnalysers.get(trackId) || null;
  }

  private ensureTrackNodes(trackId: string) {
    if (!this.ctx || !this.masterGain) return;
    if (!this.trackGains.has(trackId)) {
      const gain = this.ctx.createGain();
      const pan = this.ctx.createStereoPanner();
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 64;
      gain.connect(pan);
      pan.connect(analyser);
      analyser.connect(this.masterGain);
      this.trackGains.set(trackId, gain);
      this.trackPans.set(trackId, pan);
      this.trackAnalysers.set(trackId, analyser);
    }
  }

  private setTrackVolume(trackId: string, v: number) {
    this.trackGains.get(trackId)?.gain.setValueAtTime(v, this.ctx?.currentTime || 0);
  }

  private setTrackPan(trackId: string, p: number) {
    const pan = this.trackPans.get(trackId);
    if (pan) pan.pan.setValueAtTime(p, this.ctx?.currentTime || 0);
  }

  private getStepDuration(): number {
    return 60 / this.bpm / 4;
  }

  playDrumSound(sound: DrumSound, time: number, destination?: AudioNode) {
    if (!this.ctx) return;
    const dest = destination || this.masterGain!;
    switch (sound) {
      case 'kick': this.playKick(time, dest); break;
      case 'snare': this.playSnare(time, dest); break;
      case 'hihat-closed': this.playHiHat(time, dest, false); break;
      case 'hihat-open': this.playHiHat(time, dest, true); break;
      case 'clap': this.playClap(time, dest); break;
      case 'tom': this.playTom(time, dest); break;
      case 'cymbal': this.playCymbal(time, dest); break;
      case 'rimshot': this.playRimshot(time, dest); break;
    }
  }

  // ── Drum sound synthesis (unchanged) ──

  private playKick(time: number, dest: AudioNode) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.15);
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    osc.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.3);
  }

  private playSnare(time: number, dest: AudioNode) {
    const ctx = this.ctx!;
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 1000;
    noise.connect(filter); filter.connect(noiseGain); noiseGain.connect(dest);
    noise.start(time); noise.stop(time + 0.15);
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle'; osc.frequency.value = 200;
    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
    osc.connect(oscGain); oscGain.connect(dest);
    osc.start(time); osc.stop(time + 0.08);
  }

  private playHiHat(time: number, dest: AudioNode, open: boolean) {
    const ctx = this.ctx!;
    const duration = open ? 0.3 : 0.05;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 7000;
    noise.connect(filter); filter.connect(gain); gain.connect(dest);
    noise.start(time); noise.stop(time + duration);
  }

  private playClap(time: number, dest: AudioNode) {
    const ctx = this.ctx!;
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 2500; filter.Q.value = 3;
    noise.connect(filter); filter.connect(gain); gain.connect(dest);
    noise.start(time); noise.stop(time + 0.15);
  }

  private playTom(time: number, dest: AudioNode) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.2);
    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);
    osc.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.25);
  }

  private playCymbal(time: number, dest: AudioNode) {
    const ctx = this.ctx!;
    const bufferSize = ctx.sampleRate * 0.6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.6);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 5000;
    noise.connect(filter); filter.connect(gain); gain.connect(dest);
    noise.start(time); noise.stop(time + 0.6);
  }

  private playRimshot(time: number, dest: AudioNode) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square'; osc.frequency.value = 400;
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    osc.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.05);
  }

  // ── Scheduling ──

  onStep(cb: (step: number) => void) {
    this.onStepCallback = cb;
  }

  /** Fires only when playback reaches the natural end (repeat off). */
  onEnded(cb: () => void) {
    this.onEndedCallback = cb;
  }

  private scheduler() {
    if (!this.ctx) return;
    while (this.nextStepTime < this.ctx.currentTime + this.lookahead) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += this.getStepDuration();
      this.currentStep++;
      if (this.currentStep >= this.totalSteps) {
        if (this.loopEnabled) {
          this.currentStep = 0;
        } else {
          this.stop();
          this.onEndedCallback?.();
          return;
        }
      }
    }
  }

  /** Schedule all tracks at the given global step */
  private scheduleStep(globalStep: number, time: number) {
    for (const info of this.trackInfos) {
      const { track, patterns } = info;
      const dest = this.trackGains.get(track.id) || this.masterGain!;

      for (const clip of track.clips) {
        if (clip.type === 'sample') {
          this.scheduleSampleClip(clip, globalStep, time, dest);
          continue;
        }
        if (clip.type !== 'drum') continue;
        if (!clip.patternId) continue;

        const pattern = patterns.get(clip.patternId);
        if (!pattern) continue;

        // Convert global step to clip-local step
        const clipStartStep = clip.startBeat * 4;
        const clipEndStep = (clip.startBeat + clip.durationBeats) * 4;

        if (globalStep < clipStartStep || globalStep >= clipEndStep) continue;

        const localStep = (globalStep - clipStartStep) % pattern.steps;

        for (const sound of DRUM_SOUNDS) {
          if (pattern.grid[sound]?.[localStep]) {
            this.playDrumSound(sound, time, dest);
          }
        }
      }
    }

    // Schedule UI update
    const delay = (time - this.ctx!.currentTime) * 1000;
    setTimeout(() => {
      this.onStepCallback?.(globalStep);
    }, Math.max(0, delay));
  }

  /** and stop at the clip end.
   */
  private scheduleSampleClip(clip: Clip, globalStep: number, time: number, dest: AudioNode) {
    if (!clip.sampleId) return;
    const clipStartStep = clip.startBeat * 4;
    const clipEndStep = (clip.startBeat + clip.durationBeats) * 4;
    if (globalStep < clipStartStep || globalStep >= clipEndStep) return;

    if (clip.loop) {
      // Loop: restart the sample at the start of each beat within the clip.
      const beatStep = clip.startBeat * 4;
      if (globalStep === beatStep || (globalStep - beatStep) % 4 === 0) {
        const clipEndTime = time + (clipEndStep - globalStep) * this.getStepDuration();
        this.playSampleAt(clip.sampleId, time, dest, true, clipEndTime);
      }
    } else if (globalStep === clipStartStep) {
      // One-shot: fire exactly once at the clip start.
      this.playSampleAt(clip.sampleId, time, dest, false);
    }
  }

  /**
   * Play a fetched sample at a specific time. Loads (and caches) the buffer on
   * first use, then schedules it through the given destination. When `loop` is
   * true the source loops until `stopTime` (or until the engine is stopped).
   * Active sources are tracked so `stop()` can silence them.
   */
  private async playSampleAt(sampleId: string, time: number, dest: AudioNode, loop: boolean, stopTime?: number): Promise<void> {
    if (!this.sampleLoader) return;
    const entry = await this.sampleLoader.load(sampleId);
    if (entry.status !== 'ready' || !entry.buffer) return;
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = entry.buffer;
    source.loop = loop;
    source.connect(dest);
    this.activeSources.add(source);
    source.onended = () => this.activeSources.delete(source);
    source.start(time);
    if (loop && stopTime !== undefined) {
      source.stop(stopTime);
    }
    source.connect(dest);
    source.start(time);
  }

  play() {
    if (this.isPlaying) return;
    this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    this.isPlaying = true;
    // Resume from the current step. `stop()` resets the step to 0, so a fresh
    // play after stop still starts from the beginning, while play after pause
    // continues from where the scrubber was left.
    this.nextStepTime = this.ctx!.currentTime + 0.05;
    this.schedulerTimer = window.setInterval(() => this.scheduler(), this.scheduleInterval);
  }

  stop() {
    this.isPlaying = false;
    this.currentStep = 0;
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.silenceAllSources();
    this.onStepCallback?.(-1);
  }

  pause() {
    this.isPlaying = false;
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.silenceAllSources();
  }

  /** Stop every currently-playing sample source so no audio lingers. */
  private silenceAllSources() {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // Already stopped — ignore.
      }
    }
    this.activeSources.clear();
  }

  previewSound(sound: DrumSound) {
    this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    this.playDrumSound(sound, this.ctx!.currentTime);
  }

  /**
   * Play a fetched sample by id. Loads (and caches) the buffer on first use,
   * then schedules it through the given destination (defaults to master).
   * Returns a promise that resolves once the sample is scheduled, or rejects
   * if the sample could not be loaded.
   */
  async playSample(sampleId: string, destination?: AudioNode): Promise<void> {
    if (!this.sampleLoader) {
      throw new Error('No sample loader attached');
    }
    this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    const entry = await this.sampleLoader.load(sampleId);
    if (entry.status !== 'ready' || !entry.buffer) {
      throw new Error(entry.error ?? `Sample not ready: ${sampleId}`);
    }
    const ctx = this.ctx!;
    const dest = destination || this.masterGain!;
    const source = ctx.createBufferSource();
    source.buffer = entry.buffer;
    source.connect(dest);
    source.start(ctx.currentTime);
  }

  dispose() {
    this.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}

export const audioEngine = new AudioEngine();
