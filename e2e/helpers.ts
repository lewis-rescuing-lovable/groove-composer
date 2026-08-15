import { Page } from "@playwright/test";

export interface PerfSample {
  heapMB: number;
  fps: number;
  longTasks: number;
}

/**
 * Collects performance + memory metrics from the page using the Performance API,
 * a rAF loop to estimate FPS, and a PerformanceObserver for long tasks.
 */
export async function collectPerf(page: Page, durationMs = 3000): Promise<PerfSample> {
  return page.evaluate(
    async ({ duration }) => {
      let frames = 0;
      let longTasks = 0;
      let running = true;

      const longTaskObserver = new PerformanceObserver((list) => {
        longTasks += list.getEntries().length;
      });
      longTaskObserver.observe({ type: "longtask", buffered: true });

      // FPS sampling loop
      await new Promise<void>((resolve) => {
        let last = performance.now();
        const tick = (now: number) => {
          if (!running) return;
          frames += 1;
          // count a frame as "slow" if the gap is > 60ms (~<16fps)
          if (now - last > 60) longTasks += 1;
          last = now;
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        setTimeout(() => {
          running = false;
          resolve();
        }, duration);
      });

      longTaskObserver.disconnect();

      // Memory
      let heapMB = 0;
      const mem = (performance as any).memory;
      if (mem && mem.usedJSHeapSize) {
        heapMB = mem.usedJSHeapSize / (1024 * 1024);
      }

      const fps = (frames / (duration / 1000)).toFixed(1);
      return { heapMB: Number(heapMB.toFixed(1)), fps: Number(fps), longTasks };
    },
    { duration: durationMs },
  );
}

/**
 * Helper to snapshot console errors during a test so we can assert on them.
 */
export function trackConsoleErrors(page: Page): { errors: string[] } {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return { errors };
}

// Selectors (keep in one place so UI changes are easy to chase)
export const selectors = {
  projectName: 'input[value="Untitled Project"]',
  bpmInput: 'input[type="number"]',
  trackInput: (name: string) => `input[value="${name}"]`,
  addTrackButton: "button:has(svg.lucide-plus)",
  addPatternButton: "button:has(svg.lucide-plus)",
  playPause: "button:has(svg.lucide-play)",
  stop: "button:has(svg.lucide-square)",
  mute: "button:text-is('M')",
  solo: "button:text-is('S')",
  synthTab: "button:has-text('Synth')",
  samplesTab: "button:has-text('Samples')",
  drumsTab: "button:has-text('Drums')",
};
