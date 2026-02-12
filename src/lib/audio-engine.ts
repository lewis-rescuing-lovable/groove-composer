import { DrumSound, DrumPattern, DRUM_SOUNDS } from './types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private schedulerTimer: number | null = null;
  private nextStepTime = 0;
  private currentStep = 0;
  private isPlaying = false;
  private bpm = 120;
  private onStepCallback: ((step: number) => void) | null = null;
  private currentPattern: DrumPattern | null = null;
  private trackGains: Map<string, GainNode> = new Map();
  private trackPans: Map<string, StereoPannerNode> = new Map();
  private trackAnalysers: Map<string, AnalyserNode> = new Map();
  private lookahead = 0.1; // seconds
  private scheduleInterval = 25; // ms

  get context(): AudioContext | null {
    return this.ctx;
  }

  get analyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  get playing(): boolean {
    return this.isPlaying;
  }

  get step(): number {
    return this.currentStep;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  setMasterVolume(v: number) {
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
  }

  getTrackAnalyser(trackId: string): AnalyserNode | null {
    return this.trackAnalysers.get(trackId) || null;
  }

  ensureTrackNodes(trackId: string) {
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

  setTrackVolume(trackId: string, v: number) {
    this.trackGains.get(trackId)?.gain.setValueAtTime(v, this.ctx?.currentTime || 0);
  }

  setTrackPan(trackId: string, p: number) {
    const pan = this.trackPans.get(trackId);
    if (pan) pan.pan.setValueAtTime(p, this.ctx?.currentTime || 0);
  }

  private getStepDuration(): number {
    return 60 / this.bpm / 4; // sixteenth note
  }

  playDrumSound(sound: DrumSound, time: number, destination?: AudioNode) {
    if (!this.ctx) return;
    const dest = destination || this.masterGain!;

    switch (sound) {
      case 'kick':
        this.playKick(time, dest);
        break;
      case 'snare':
        this.playSnare(time, dest);
        break;
      case 'hihat-closed':
        this.playHiHat(time, dest, false);
        break;
      case 'hihat-open':
        this.playHiHat(time, dest, true);
        break;
      case 'clap':
        this.playClap(time, dest);
        break;
      case 'tom':
        this.playTom(time, dest);
        break;
      case 'cymbal':
        this.playCymbal(time, dest);
        break;
      case 'rimshot':
        this.playRimshot(time, dest);
        break;
    }
  }

  private playKick(time: number, dest: AudioNode) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.15);
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  private playSnare(time: number, dest: AudioNode) {
    const ctx = this.ctx!;
    // Noise
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
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);
    noise.start(time);
    noise.stop(time + 0.15);
    // Body
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 200;
    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.08);
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
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
    noise.stop(time + duration);
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
    filter.type = 'bandpass';
    filter.frequency.value = 2500;
    filter.Q.value = 3;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
    noise.stop(time + 0.15);
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
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.25);
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
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
    noise.stop(time + 0.6);
  }

  private playRimshot(time: number, dest: AudioNode) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 400;
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  setPattern(pattern: DrumPattern) {
    this.currentPattern = pattern;
  }

  onStep(cb: (step: number) => void) {
    this.onStepCallback = cb;
  }

  private scheduler() {
    if (!this.ctx) return;
    while (this.nextStepTime < this.ctx.currentTime + this.lookahead) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += this.getStepDuration();
      this.currentStep++;
      if (this.currentPattern && this.currentStep >= this.currentPattern.steps) {
        this.currentStep = 0;
      }
    }
  }

  private scheduleStep(step: number, time: number) {
    if (!this.currentPattern) return;
    const pattern = this.currentPattern;
    for (const sound of DRUM_SOUNDS) {
      if (pattern.grid[sound]?.[step]) {
        this.playDrumSound(sound, time);
      }
    }
    // Schedule UI update
    const delay = (time - this.ctx!.currentTime) * 1000;
    setTimeout(() => {
      this.onStepCallback?.(step);
    }, Math.max(0, delay));
  }

  play() {
    if (this.isPlaying) return;
    this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    this.isPlaying = true;
    this.currentStep = 0;
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
    this.onStepCallback?.(- 1);
  }

  pause() {
    this.isPlaying = false;
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  previewSound(sound: DrumSound) {
    this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    this.playDrumSound(sound, this.ctx!.currentTime);
  }

  dispose() {
    this.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}

export const audioEngine = new AudioEngine();
