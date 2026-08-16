import { useEffect } from 'react';
import { useDAW } from '@/stores/daw-store-context';

/**
 * Internal component used by the `withPlayControl` decorator. It syncs the
 * `play` and `bpm` args from Storybook's Controls panel to the DAW store.
 */
export function PlayControl({ play, bpm, children }: { play: boolean; bpm?: number; children: React.ReactNode }) {
  const { state, dispatch, play: start, stop } = useDAW();

  // Sync the BPM arg to the store (which pushes it to the audio engine).
  useEffect(() => {
    if (bpm && bpm !== state.bpm) {
      dispatch({ type: 'SET_BPM', bpm: Math.max(40, Math.min(300, bpm)) });
    }
  }, [bpm, state.bpm, dispatch]);

  useEffect(() => {
    if (play) start();
    else stop();
  }, [play, start, stop]);

  return <>{children}</>;
}
