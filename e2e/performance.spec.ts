import { test, expect } from "@playwright/test";
import { collectPerf, trackConsoleErrors, selectors } from "./helpers";

/**
 * Performance & memory monitoring suite.
 *
 * These tests collect FPS, long-task count, and JS heap usage from the page
 * during real interactions, assert generous thresholds (so they don't flake in
 * CI), and log the raw numbers so you can watch regressions over time.
 */

test.describe("performance & memory monitoring", () => {
  test("idle page stays responsive and leaks no obvious memory", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Tracks")).toBeVisible();

    // Warm up + let React settle
    await page.waitForTimeout(500);

    const sample = await collectPerf(page, 3000);
    console.log(`[perf] idle heap=${sample.heapMB}MB fps=${sample.fps} longTasks=${sample.longTasks}`);

    // Generous thresholds: should be smooth and low long-task count
    expect(sample.fps).toBeGreaterThan(20);
    expect(sample.longTasks).toBeLessThan(30);
    // Heap should be reasonable (< 500MB) on idle
    expect(sample.heapMB).toBeLessThan(500);
  });

  test("playing transport stays responsive", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto("/");
    await expect(page.getByText("Tracks")).toBeVisible();

    // Start playback
    await page.locator(selectors.playPause).first().click();
    await page.waitForTimeout(500);

    const sample = await collectPerf(page, 3000);
    console.log(`[perf] playing heap=${sample.heapMB}MB fps=${sample.fps} longTasks=${sample.longTasks}`);

    expect(sample.fps).toBeGreaterThan(15);
    expect(sample.longTasks).toBeLessThan(40);
    expect(errors.errors).toEqual([]);

    // Stop to clean up
    await page.locator(selectors.stop).first().click();
  });

  test("repeated pattern toggling does not accumulate memory", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Tracks")).toBeVisible();

    // Baseline heap
    const baseline = await collectPerf(page, 1000);

    // Toggle a bunch of step cells to exercise state churn
    const stepButtons = page.locator("button:has(svg.lucide-play)").count(); // ensure page loaded
    await page.waitForTimeout(200);

    // Click many step cells rapidly (all buttons minus labels/controls)
    const buttons = page.locator("button");
    const total = await buttons.count();
    for (let i = 0; i < Math.min(total, 60); i++) {
      await buttons.nth(i).click({ noWaitAfter: true }).catch(() => {});
    }

    await page.waitForTimeout(500);
    const after = await collectPerf(page, 1000);
    console.log(`[perf] toggle heap baseline=${baseline.heapMB}MB after=${after.heapMB}MB`);

    // Heap should not balloon
    expect(after.heapMB - baseline.heapMB).toBeLessThan(150);
  });
});
