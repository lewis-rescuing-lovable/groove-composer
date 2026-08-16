import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  encodeProjectToQuery,
  decodeQueryToProject,
  getShareUrl,
  getQueryProjectJson,
  QUERY_PARAM,
} from './share';

const sample = JSON.stringify({ projectName: 'Shared', bpm: 140, tracks: [], drumPatterns: [], synthPatterns: [] });

describe('encode/decode round-trip', () => {
  it('round-trips a project JSON string through URL-safe base64', () => {
    const q = encodeProjectToQuery(sample);
    // URL-safe alphabet only: no +, / or = padding.
    expect(q).not.toMatch(/[+/=]/);
    expect(decodeQueryToProject(q)).toBe(sample);
  });

  it('handles non-ASCII and emoji content', () => {
    const json = JSON.stringify({ name: 'Groove ☀️ / ünïcödé' });
    const q = encodeProjectToQuery(json);
    expect(decodeQueryToProject(q)).toBe(json);
  });

  it('decoding malformed base64 returns null', () => {
    expect(decodeQueryToProject('not!valid base64!!!')).toBeNull();
  });

  it('returns null when the decoded bytes are not valid UTF-8', () => {
    // Force TextDecoder to throw so the catch branch is exercised.
    const RealTextDecoder = globalThis.TextDecoder;
    vi.stubGlobal('TextDecoder', class {
      decode() { throw new Error('invalid utf-8'); }
    });
    try {
      expect(decodeQueryToProject(encodeProjectToQuery(sample))).toBeNull();
    } finally {
      vi.unstubAllGlobals();
      globalThis.TextDecoder = RealTextDecoder;
    }
  });
});

describe('getShareUrl', () => {
  beforeEach(() => {
    // jsdom location default; override origin/pathname to something predictable.
    Object.defineProperty(window, 'location', {
      writable: true,
      value: new URL('http://localhost:8080/groove-composer/'),
    });
  });

  it('builds an absolute URL with the project in the query param', () => {
    const url = getShareUrl(sample);
    const parsed = new URL(url);
    expect(parsed.origin).toBe('http://localhost:8080');
    expect(parsed.pathname).toBe('/groove-composer/');
    const q = parsed.searchParams.get(QUERY_PARAM);
    expect(q).toBeTruthy();
    expect(decodeQueryToProject(q!)).toBe(sample);
  });
});

describe('getQueryProjectJson', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when no project query param is present', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: new URL('http://localhost:8080/'),
    });
    expect(getQueryProjectJson()).toBeNull();
  });

  it('returns the decoded JSON when a project param is present', () => {
    const encoded = encodeProjectToQuery(sample);
    Object.defineProperty(window, 'location', {
      writable: true,
      value: new URL(`http://localhost:8080/?${QUERY_PARAM}=${encoded}`),
    });
    expect(getQueryProjectJson()).toBe(sample);
  });

  it('returns null when window is unavailable (SSR guard)', () => {
    const RealWindow = globalThis.window;
    vi.stubGlobal('window', undefined);
    try {
      expect(getQueryProjectJson()).toBeNull();
    } finally {
      vi.unstubAllGlobals();
      globalThis.window = RealWindow;
    }
  });
});
