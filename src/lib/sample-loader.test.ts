import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SampleLoader } from './sample-loader';
import { SAMPLE_LIBRARY } from './samples';

// Minimal AudioContext stub for decodeAudioData
class MockAudioContext {
  decodeAudioData(arrayBuffer: ArrayBuffer) {
    return Promise.resolve({ length: arrayBuffer.byteLength } as unknown as AudioBuffer);
  }
}

function makeResponse(body: ArrayBuffer, init: { status?: number; contentType?: string } = {}) {
  const { status = 200, contentType = 'audio/mpeg' } = init;
  return new Response(body, {
    status,
    headers: { 'content-type': contentType },
  });
}

function makeLoader(fetchImpl: typeof fetch) {
  return new SampleLoader({ fetchImpl, maxRetries: 2, retryBaseDelayMs: 1, context: new MockAudioContext() as unknown as AudioContext });
}

const kalimba = SAMPLE_LIBRARY.find(s => s.id === 'kalimba')!;

describe('SampleLoader', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads a sample and caches it', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(makeResponse(new ArrayBuffer(kalimba.sizeBytes)));
    const loader = makeLoader(fetchImpl as unknown as typeof fetch);

    const entry = await loader.load('kalimba');
    expect(entry.status).toBe('ready');
    expect(entry.buffer).not.toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    // Second load is served from cache — no extra fetch
    const again = await loader.load('kalimba');
    expect(again.status).toBe('ready');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('returns an error entry for an unknown sample id', async () => {
    const loader = makeLoader(vi.fn() as unknown as typeof fetch);
    const entry = await loader.load('nope');
    expect(entry.status).toBe('error');
    expect(entry.error).toContain('Unknown sample');
  });

  it('retries on HTTP error then succeeds', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(makeResponse(new ArrayBuffer(0), { status: 500 }))
      .mockResolvedValueOnce(makeResponse(new ArrayBuffer(kalimba.sizeBytes)));
    const loader = makeLoader(fetchImpl as unknown as typeof fetch);

    const entry = await loader.load('kalimba');
    expect(entry.status).toBe('ready');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('gives up after max retries and reports error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(makeResponse(new ArrayBuffer(0), { status: 503 }));
    const loader = makeLoader(fetchImpl as unknown as typeof fetch);

    const entry = await loader.load('kalimba');
    expect(entry.status).toBe('error');
    expect(entry.error).toContain('HTTP 503');
    // initial + 2 retries
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('rejects on size mismatch', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve(makeResponse(new ArrayBuffer(10))));
    const loader = makeLoader(fetchImpl as unknown as typeof fetch);

    const entry = await loader.load('kalimba');
    expect(entry.status).toBe('error');
    expect(entry.error).toContain('Size mismatch');
  });

  it('rejects on unexpected content-type', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(makeResponse(new ArrayBuffer(kalimba.sizeBytes), { contentType: 'text/html' }));
    const loader = makeLoader(fetchImpl as unknown as typeof fetch);

    const entry = await loader.load('kalimba');
    expect(entry.status).toBe('error');
    expect(entry.error).toContain('Unexpected content-type');
  });

  it('rejects when no AudioContext is available', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(makeResponse(new ArrayBuffer(kalimba.sizeBytes)));
    const loader = new SampleLoader({ fetchImpl: fetchImpl as unknown as typeof fetch, maxRetries: 0, context: null });

    const entry = await loader.load('kalimba');
    expect(entry.status).toBe('error');
    expect(entry.error).toContain('No AudioContext');
  });

  it('loadAll resolves all entries', async () => {
    const fetchImpl = vi.fn().mockImplementation((url: string) => {
      const def = SAMPLE_LIBRARY.find(s => s.url === url)!;
      return Promise.resolve(makeResponse(new ArrayBuffer(def.sizeBytes)));
    });
    const loader = makeLoader(fetchImpl as unknown as typeof fetch);

    const entries = await loader.loadAll();
    expect(entries).toHaveLength(SAMPLE_LIBRARY.length);
    expect(entries.every(e => e.status === 'ready')).toBe(true);
  });

  it('entries() returns seeded idle entries before loading', () => {
    const loader = makeLoader(vi.fn() as unknown as typeof fetch);
    const entries = loader.entries();
    expect(entries).toHaveLength(SAMPLE_LIBRARY.length);
    expect(entries.every(e => e.status === 'idle')).toBe(true);
  });
});
