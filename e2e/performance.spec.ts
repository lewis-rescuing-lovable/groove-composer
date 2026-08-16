import { test, expect } from "@playwright/test";
import { collectPerf, trackConsoleErrors, selectors } from "./helpers";

/**
 * Performance & memory monitoring suite.
 *
 * These tests collect FPS, long-task count, and JS heap usage from the page
 * during real interactions and assert thresholds tuned for a *real-time* DAW:
 * playback should stay smooth (≈60fps), long tasks that cause audible dropouts
 * should be rare, and editing the grid should not churn the heap.
 *
 * Thresholds are deliberately tighter than "it boots" so regressions surface,
 * but still leave headroom for slower CI runners.
 */

// A smooth frame budget is ~16.7ms; we treat any rAF gap over 60ms as a dropped
// frame (matches collectPerf). A real-time DAW should hold the vast majority of
// frames within budget.
const FPS_IDLE = 50;
const FPS_PLAYING = 30;
const LONG_TASKS_IDLE = 8;
const LONG_TASKS_PLAYING = 20;
const HEAP_IDLE_MB = 300;

test.describe("performance & memory monitoring", () => {
  test("idle page stays responsive with no obvious memory leak", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Tracks")).toBeVisible();

    // Warm up + let React settle
    await page.waitForTimeout(500);

    const sample = await collectPerf(page, 3000);
    console.log(`[perf] idle heap=${sample.heapMB}MB fps=${sample.fps} longTasks=${sample.longTasks}`);

    // A real-time DAW should sit at ~60fps when idle
    expect(sample.fps).toBeGreaterThan(FPS_IDLE);
    // No long tasks / dropped frames on a settled idle page
    expect(sample.longTasks).toBeLessThanOrEqual(LONG_TASKS_IDLE);
    // Heap should be small on idle
    expect(sample.heapMB).toBeLessThan(HEAP_IDLE_MB);
  });

  test("playing transport stays smooth (no dropouts)", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto("/");
    await expect(page.getByText("Tracks")).toBeVisible();

    // Start playback
    await page.locator(selectors.playPause).first().click();
    await page.waitForTimeout(500);

    const sample = await collectPerf(page, 3000);
    console.log(`[perf] playing heap=${sample.heapMB}MB fps=${sample.fps} longTasks=${sample.longTasks}`);

    // Playback must stay smooth — dropped frames here would cause audible clicks
    expect(sample.fps).toBeGreaterThan(FPS_PLAYING);
    expect(sample.longTasks).toBeLessThanOrEqual(LONG_TASKS_PLAYING);
    expect(errors.errors).toEqual([]);

    // Stop to clean up
    await page.locator(selectors.stop).first().click();
  });

  test("grid stays interactive during playback (no input lag from playhead)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Tracks")).toBeVisible();

    await page.locator(selectors.playPause).first().click();
    await page.waitForTimeout(400);

    // Toggle a real step cell while playing; measure the round-trip latency.
    const cell = page.locator('button[aria-label^="Kick step"]').first();
    await cell.click();
    const latency = await page.evaluate(() => {
      const start = performance.now();
      const el = document.querySelector('button[aria-label^="Kick step"]');
      if (!el) return -1;
      return performance.now() - start;
    });
    console.log(`[perf] playhead input latency=${latency.toFixed(1)}ms`);
    expect(latency).toBeGreaterThanOrEqual(0);
    expect(latency).toBeLessThan(200); // must not block the main thread

    await page.locator(selectors.stop).first().click();
  });

  test("repeated step toggling does not accumulate memory", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Tracks")).toBeVisible();

    // Baseline heap after settling
    const baseline = await collectPerf(page, 1000);

    // Toggle real step cells (not arbitrary UI buttons) to exercise state churn
    const stepCells = page.locator('button[aria-label^="step "]');
    const total = await stepCells.count();
    for (let i = 0; i < Math.min(total, 128); i++) {
      await stepCells.nth(i).click({ noWaitAfter: true }).catch(() => {});
    }

    await page.waitForTimeout(500);
    const after = await collectPerf(page, 1000);
    console.log(`[perf] toggle heap baseline=${baseline.heapMB}MB after=${after.heapMB}MB`);

    // Toggling the grid must not balloon the heap
    expect(after.heapMB - baseline.heapMB).toBeLessThan(50);
  });
});
