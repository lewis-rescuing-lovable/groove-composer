import { useEffect, useRef, useCallback } from 'react';
import { audioEngine } from '@/lib/audio-engine';
import { useDAW } from '@/stores/daw-store-context';

/**
 * Live frequency visualization of the master output. Reads from the shared
 * audio engine's analyser node. When `demoMode` is set, it synthesizes a
 * moving spectrum instead — useful for Storybook, where there is no audio
 * context or user gesture to start playback.
 */
export function SpectrumAnalyzer({ demoMode = false }: { demoMode?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const { state } = useDAW();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    const ctx = canvas.getContext('2d')!;
    const { width, height } = canvas;

    // In demo mode, synthesize a moving spectrum (a sweeping peak + noise) so
    // the analyzer animates without an audio context.
    const bufferLength = demoMode ? 64 : audioEngine.analyserNode?.frequencyBinCount ?? 0;
    const dataArray = new Uint8Array(bufferLength);

    if (demoMode) {
      const t = performance.now() / 1000;
      for (let i = 0; i < bufferLength; i++) {
        // A peak that sweeps across the spectrum, plus a little noise.
        const peak = Math.exp(-Math.pow((i - (bufferLength / 2) * (1 + 0.6 * Math.sin(t * 0.8))) / (bufferLength / 8), 2));
        const noise = Math.random() * 0.15;
        dataArray[i] = Math.min(255, Math.round((peak * 0.9 + noise) * 255));
      }
    } else {
      const analyser = audioEngine.analyserNode;
      if (!analyser) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      analyser.getByteFrequencyData(dataArray);
    }

    ctx.clearRect(0, 0, width, height);

    const barWidth = (width / bufferLength) * 2;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 255;
      const barHeight = v * height;

      // Color gradient: green -> yellow -> red
      const hue = 145 - v * 145; // 145 (green) to 0 (red)
      ctx.fillStyle = `hsl(${hue}, 70%, ${45 + v * 15}%)`;
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
    }

    animRef.current = requestAnimationFrame(draw);
  }, [demoMode]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={60}
      className="w-full h-full rounded bg-card"
    />
  );
}
