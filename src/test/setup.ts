import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// requestAnimationFrame / cancelAnimationFrame
globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0) as unknown as number;
globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);

// jsdom 20 does not provide localStorage — stub a simple in-memory store.
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  };
};
Object.defineProperty(window, "localStorage", {
  writable: true,
  value: createLocalStorageMock(),
});

// ResizeObserver stub required by Radix primitives (e.g. Slider)
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

// Minimal canvas 2d context mock
const createCanvasContext2D = () => {
  const context = {
    canvas: {},
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    clearRect: () => {},
    fillRect: () => {},
    scale: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fillText: () => {},
    getContext: () => null,
  };
  return context as unknown as CanvasRenderingContext2D;
};

const getContextMock = () => createCanvasContext2D();
HTMLCanvasElement.prototype.getContext = getContextMock as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Minimal AudioContext stub so components that init the audio engine don't crash
class MockAudioParam {
  value = 0;
  setValueAtTime(v: number) { this.value = v; return this; }
  exponentialRampToValueAtTime(v: number) { this.value = v; return this; }
}
class MockAudioNode {
  connect() { return this; }
}
class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam();
}
class MockPannerNode extends MockAudioNode {
  pan = new MockAudioParam();
}
class MockOscillatorNode extends MockAudioNode {
  type = "sine";
  frequency = new MockAudioParam();
  start() {}
  stop() {}
}
class MockFilterNode extends MockAudioNode {
  type = "highpass";
  frequency = new MockAudioParam();
  Q = new MockAudioParam();
}
class MockAnalyserNode extends MockAudioNode {
  fftSize = 256;
  frequencyBinCount = 128;
  getByteFrequencyData() {}
}
class MockBufferSourceNode extends MockAudioNode {
  buffer: unknown = null;
  start() {}
  stop() {}
}
class MockAudioContext {
  state = "running";
  currentTime = 0;
  sampleRate = 44100;
  destination = new MockAudioNode();
  createGain() { return new MockGainNode(); }
  createAnalyser() { return new MockAnalyserNode(); }
  createStereoPanner() { return new MockPannerNode(); }
  createBiquadFilter() { return new MockFilterNode(); }
  createOscillator() { return new MockOscillatorNode(); }
  createBufferSource() { return new MockBufferSourceNode(); }
  createBuffer() { return { getChannelData: () => new Float32Array(8) }; }
  resume() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
}
(globalThis as unknown as { AudioContext: unknown }).AudioContext = MockAudioContext;
(globalThis as unknown as { webkitAudioContext: unknown }).webkitAudioContext = MockAudioContext;

// window.setInterval needed by audio engine scheduling (returned by jsdom already)
