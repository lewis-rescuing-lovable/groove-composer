import { useEffect, useRef } from 'react';
import { sampleLoader } from '@/lib/sample-loader';
import { getSampleDef } from '@/lib/samples';

/**
 * Renders a sample clip as a waveform. Loads the sample buffer on mount (and
 * caches it via the shared loader), then draws a downsampled waveform onto a
 * canvas that fills the clip. Redraws when the clip is resized.
 */
export function SampleWaveform({ sampleId, width, height }: { sampleId: string; width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;

    const draw = (buffer: AudioBuffer | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      if (!buffer) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '9px monospace';
        ctx.fillText('…', 4, height / 2 + 3);
        return;
      }

      const data = buffer.getChannelData(0);
      const mid = height / 2;
      const step = Math.max(1, Math.floor(data.length / width));
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const start = x * step;
        let min = 1;
        let max = -1;
        for (let i = start; i < start + step && i < data.length; i++) {
          const v = data[i];
          if (v < min) min = v;
          if (v > max) max = v;
        }
        ctx.moveTo(x + 0.5, mid - max * mid);
        ctx.lineTo(x + 0.5, mid - min * mid);
      }
      ctx.stroke();
    };

    const def = getSampleDef(sampleId);
    if (!def) return;

    // Draw immediately with whatever is cached, then load if needed.
    const cached = sampleLoader.get(sampleId);
    draw(cached?.buffer ?? null);
    if (!cached || cached.status !== 'ready') {
      sampleLoader.load(sampleId).then(entry => {
        if (!cancelled) {
          raf = requestAnimationFrame(() => draw(entry.buffer));
        }
      });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [sampleId, width, height]);

  return <canvas ref={canvasRef} style={{ width, height, display: 'block' }} />;
}
