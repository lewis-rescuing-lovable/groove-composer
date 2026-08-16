import { useState } from 'react';
import { useDAW } from '@/stores/daw-store-context';

/**
 * A small overlay that lets a story start audio playback via a user gesture.
 * Browsers block AudioContext autoplay, so we surface a button the user clicks
 * to enable sound. Once clicked, it calls the DAW's `play()` and hides itself.
 */
export function EnableAudioOverlay() {
  const { play } = useDAW();
  const [enabled, setEnabled] = useState(false);

  if (enabled) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
      }}
    >
      <button
        onClick={() => {
          play();
          setEnabled(true);
        }}
        style={{
          padding: '12px 24px',
          borderRadius: 8,
          border: 'none',
          background: 'hsl(262 70% 58%)',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        ▶ Enable audio
      </button>
    </div>
  );
}
