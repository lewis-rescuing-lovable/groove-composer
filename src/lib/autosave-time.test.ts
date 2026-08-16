import { describe, it, expect } from 'vitest';
import { formatAutosaveInterval, parseAutosaveInterval, AUTOSAVE_MAX_SECONDS } from './autosave-time';

describe('formatAutosaveInterval', () => {
  it('always shows mm:ss, even below 60 seconds', () => {
    expect(formatAutosaveInterval(5)).toBe('00:05');
    expect(formatAutosaveInterval(30)).toBe('00:30');
    expect(formatAutosaveInterval(59)).toBe('00:59');
  });

  it('shows mm:ss at/above 60', () => {
    expect(formatAutosaveInterval(60)).toBe('01:00');
    expect(formatAutosaveInterval(90)).toBe('01:30');
    expect(formatAutosaveInterval(3600)).toBe('60:00');
  });
});

describe('parseAutosaveInterval', () => {
  it('parses bare seconds', () => {
    expect(parseAutosaveInterval('30')).toBe(30);
    expect(parseAutosaveInterval('90')).toBe(90);
    expect(parseAutosaveInterval('3600')).toBe(3600);
  });

  it('parses m:ss', () => {
    expect(parseAutosaveInterval('1:30')).toBe(90);
    expect(parseAutosaveInterval('60:00')).toBe(3600);
  });

  it('parses Nm minutes', () => {
    expect(parseAutosaveInterval('5m')).toBe(300);
    expect(parseAutosaveInterval('60m')).toBe(3600);
  });

  it('rejects values above the 60:00 hard maximum', () => {
    expect(parseAutosaveInterval('3601')).toBeNull();
    expect(parseAutosaveInterval('60:01')).toBeNull();
    expect(parseAutosaveInterval('61m')).toBeNull();
  });

  it('rejects invalid input', () => {
    expect(parseAutosaveInterval('')).toBeNull();
    expect(parseAutosaveInterval('abc')).toBeNull();
    expect(parseAutosaveInterval('1:99')).toBeNull();
    expect(parseAutosaveInterval('0')).toBeNull();
  });

  it('exposes the hard maximum', () => {
    expect(AUTOSAVE_MAX_SECONDS).toBe(3600);
  });
});
