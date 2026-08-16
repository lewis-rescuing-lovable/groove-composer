import { useEffect, useRef, useCallback } from 'react';
import { audioEngine } from '@/lib/audio-engine';
import { useDAW } from '@/stores/daw-store-context';

export function SpectrumAnalyzer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const { state } = useDAW();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = audioEngine.analyserNode;
    if (!canvas || !analyser) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    const ctx = canvas.getContext('2d')!;
    const { width, height } = canvas;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

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
  }, []);

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
