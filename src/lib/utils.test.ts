import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values', () => {
    expect(cn('a', false, null, undefined, 0, '', 'b')).toBe('a b');
  });

  it('merges conflicting tailwind classes (twMerge)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional object inputs', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });
});
