import { describe, it, expect } from 'vitest';
import { reducer } from './use-toast';

const baseToast = {
  id: '1',
  title: 'Hello',
  open: true,
};

describe('use-toast reducer', () => {
  it('ADD_TOAST prepends and respects the limit', () => {
    const s1 = reducer({ toasts: [] }, { type: 'ADD_TOAST', toast: { ...baseToast, id: '1' } });
    expect(s1.toasts).toHaveLength(1);
    const s2 = reducer(s1, { type: 'ADD_TOAST', toast: { ...baseToast, id: '2' } });
    expect(s2.toasts).toHaveLength(1);
    expect(s2.toasts[0].id).toBe('2');
  });

  it('UPDATE_TOAST merges fields on the matching toast', () => {
    const s = reducer({ toasts: [{ ...baseToast, id: '1' }] }, {
      type: 'UPDATE_TOAST',
      toast: { id: '1', description: 'Updated' },
    });
    expect(s.toasts[0].description).toBe('Updated');
    expect(s.toasts[0].title).toBe('Hello');
  });

  it('DISMISS_TOAST with an id closes only that toast', () => {
    const s = reducer(
      { toasts: [{ ...baseToast, id: '1' }, { ...baseToast, id: '2' }] },
      { type: 'DISMISS_TOAST', toastId: '1' },
    );
    expect(s.toasts[0].open).toBe(false);
    expect(s.toasts[1].open).toBe(true);
  });

  it('DISMISS_TOAST without an id closes all toasts', () => {
    const s = reducer(
      { toasts: [{ ...baseToast, id: '1' }, { ...baseToast, id: '2' }] },
      { type: 'DISMISS_TOAST' },
    );
    expect(s.toasts.every(t => t.open === false)).toBe(true);
  });

  it('REMOVE_TOAST removes a specific toast', () => {
    const s = reducer(
      { toasts: [{ ...baseToast, id: '1' }, { ...baseToast, id: '2' }] },
      { type: 'REMOVE_TOAST', toastId: '1' },
    );
    expect(s.toasts.map(t => t.id)).toEqual(['2']);
  });

  it('REMOVE_TOAST without an id clears all toasts', () => {
    const s = reducer(
      { toasts: [{ ...baseToast, id: '1' }, { ...baseToast, id: '2' }] },
      { type: 'REMOVE_TOAST' },
    );
    expect(s.toasts).toHaveLength(0);
  });
});
