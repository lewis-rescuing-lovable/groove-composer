import { SampleDef, SAMPLE_LIBRARY } from './samples';

export type SampleLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface SampleEntry {
  def: SampleDef;
  status: SampleLoadStatus;
  /** Decoded audio buffer once loaded. */
  buffer: AudioBuffer | null;
  /** Human-readable error message on failure. */
  error: string | null;
}

export interface SampleLoaderOptions {
  /** Max number of fetch attempts per sample. */
  maxRetries?: number;
  /** Base delay (ms) for exponential backoff. */
  retryBaseDelayMs?: number;
  /** Optional fetch implementation (injected for tests). */
  fetchImpl?: typeof fetch;
  /** Optional AudioContext used to decode buffers. */
  context?: AudioContext | null;
}

const DEFAULT_OPTIONS: Required<Pick<SampleLoaderOptions, 'maxRetries' | 'retryBaseDelayMs'>> = {
  maxRetries: 3,
  retryBaseDelayMs: 300,
};

/**
 * Loads samples from a remote endpoint at runtime, validating each response
 * (HTTP status, content-type, size) and decoding into an AudioBuffer. Failed
 * loads are retried with exponential backoff. Loaded buffers are cached so
 * repeated requests are cheap.
 */
export class SampleLoader {
  private cache = new Map<string, SampleEntry>();
  private inflight = new Map<string, Promise<SampleEntry>>();
  private maxRetries: number;
  private retryBaseDelayMs: number;
  private fetchImpl: typeof fetch;
  private context: AudioContext | null;

  constructor(options: SampleLoaderOptions = {}) {
    this.maxRetries = options.maxRetries ?? DEFAULT_OPTIONS.maxRetries;
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? DEFAULT_OPTIONS.retryBaseDelayMs;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.context = options.context ?? null;
  }

  /** Set the AudioContext used for decoding (required before load). */
  setContext(ctx: AudioContext | null) {
    this.context = ctx;
  }

  /** All library entries, seeded with their definitions. */
  entries(): SampleEntry[] {
    return SAMPLE_LIBRARY.map(def => this.cache.get(def.id) ?? { def, status: 'idle', buffer: null, error: null });
  }

  get(id: string): SampleEntry | undefined {
    return this.cache.get(id);
  }

  /** Load a single sample by id. Returns the entry (cached on success). */
  async load(id: string): Promise<SampleEntry> {
    const def = SAMPLE_LIBRARY.find(s => s.id === id);
    if (!def) {
      return { def: { id, name: id, category: 'fx', url: '', sizeBytes: 0, license: '', attribution: '' }, status: 'error', buffer: null, error: `Unknown sample: ${id}` };
    }
    return this.loadDef(def);
  }

  /** Load all samples in the library, resolving when each settles. */
  async loadAll(): Promise<SampleEntry[]> {
    const results = await Promise.allSettled(SAMPLE_LIBRARY.map(def => this.loadDef(def)));
    return results.map((r, i) => (r.status === 'fulfilled' ? r.value : this.cache.get(SAMPLE_LIBRARY[i].id)!));
  }

  private loadDef(def: SampleDef): Promise<SampleEntry> {
    const cached = this.cache.get(def.id);
    if (cached && cached.status === 'ready') return Promise.resolve(cached);
    const existing = this.inflight.get(def.id);
    if (existing) return existing;

    const promise = this.fetchWithRetry(def).then(
      (buffer) => {
        const entry: SampleEntry = { def, status: 'ready', buffer, error: null };
        this.cache.set(def.id, entry);
        return entry;
      },
      (err: unknown) => {
        const entry: SampleEntry = {
          def,
          status: 'error',
          buffer: null,
          error: err instanceof Error ? err.message : String(err),
        };
        this.cache.set(def.id, entry);
        return entry;
      },
    ).finally(() => {
      this.inflight.delete(def.id);
    });

    this.inflight.set(def.id, promise);
    return promise;
  }

  private async fetchWithRetry(def: SampleDef): Promise<AudioBuffer> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.fetchOnce(def);
      } catch (err) {
        lastError = err;
        if (attempt < this.maxRetries) {
          await this.delay(this.retryBaseDelayMs * 2 ** attempt);
        }
      }
    }
    throw lastError;
  }

  private async fetchOnce(def: SampleDef): Promise<AudioBuffer> {
    const res = await this.fetchImpl(def.url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${def.name}`);
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('audio/') && !contentType.includes('octet-stream')) {
      throw new Error(`Unexpected content-type "${contentType}" for ${def.name}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      throw new Error(`Empty response for ${def.name}`);
    }
    if (def.sizeBytes > 0 && arrayBuffer.byteLength !== def.sizeBytes) {
      throw new Error(`Size mismatch for ${def.name}: expected ${def.sizeBytes}, got ${arrayBuffer.byteLength}`);
    }

    if (!this.context) {
      throw new Error('No AudioContext available to decode samples');
    }

    return await this.context.decodeAudioData(arrayBuffer);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/** Shared singleton used by the app. */
export const sampleLoader = new SampleLoader();
