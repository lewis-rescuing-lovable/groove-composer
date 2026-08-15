import { test, expect } from "@playwright/test";
import { selectors, trackConsoleErrors } from "./helpers";

/**
 * End-to-end functional tests for the groove-composer DAW.
 * These exercise real user flows: adding music (tracks/patterns),
 * transport controls, and panel navigation.
 */
test.describe("groove-composer DAW", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads the DAW with default project", async ({ page }) => {
    await expect(page.locator('input[value="Untitled Project"]')).toBeVisible();
    await expect(page.getByText("Tracks")).toBeVisible();
    // Default drum track + pattern
    await expect(page.locator('input[value="Drums"]')).toBeVisible();
    await expect(page.getByText("Pattern 1", { exact: true })).toBeVisible();
    // Spectrum canvas present
    await expect(page.locator("canvas")).toBeVisible();
  });

  test("adds a new drum track (adds music)", async ({ page }) => {
    // Click the timeline "+" button to add a track
    const tracksHeader = page.getByText("Tracks");
    const addTrack = tracksHeader.locator("xpath=..").locator("button");
    await addTrack.click();
    await expect(page.locator('input[value="Track 2"]')).toBeVisible();
    // New track has its own pattern
    await expect(page.getByText("Pattern 2", { exact: true })).toBeVisible();
  });

  test("renames a track", async ({ page }) => {
    const trackInput = page.locator('input[value="Drums"]');
    await trackInput.fill("Bassline");
    await expect(page.locator('input[value="Bassline"]')).toBeVisible();
  });

  test("toggles mute and solo", async ({ page }) => {
    const mute = page.locator(selectors.mute).first();
    const solo = page.locator(selectors.solo).first();
    await mute.click();
    // M button toggles state; assert it remains visible (no crash) and the app still works
    await expect(page.getByText("Tracks")).toBeVisible();
    await solo.click();
    await expect(page.getByText("Tracks")).toBeVisible();
  });

  test("adds a new pattern", async ({ page }) => {
    // Switch to drums panel (default), click the + in the Patterns header
    const patternsHeader = page.getByText("Patterns");
    const addPattern = patternsHeader.locator("xpath=..").locator("button");
    await addPattern.click();
    await expect(page.getByText("Pattern 2")).toBeVisible();
  });

  test("switches between synth and samples panels", async ({ page }) => {
    await page.locator(selectors.synthTab).first().click();
    await expect(page.getByText("Synthesizer coming soon")).toBeVisible();
    await page.locator(selectors.samplesTab).first().click();
    await expect(page.getByText("Sample library coming soon")).toBeVisible();
    // Back to drums
    await page.locator(selectors.drumsTab).first().click();
    await expect(page.getByText("Patterns")).toBeVisible();
  });

  test("edit BPM within bounds", async ({ page }) => {
    const bpm = page.locator(selectors.bpmInput).first();
    await bpm.fill("140");
    await expect(bpm).toHaveValue("140");
    // out of bounds clamps to 300
    await bpm.fill("999");
    await expect(bpm).toHaveValue("300");
  });

  test("play and stop transport (does not throw console errors)", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.locator(selectors.playPause).first().click();
    // give transport a moment to schedule
    await page.waitForTimeout(300);
    await page.locator(selectors.stop).first().click();
    // After stopping, play button should be back
    await expect(page.locator(selectors.playPause).first()).toBeVisible();
    expect(errors.errors).toEqual([]);
  });

  test("duplicate a clip", async ({ page }) => {
    // Select the drum clip first (click on the clip block)
    // The clip block shows a drum emoji 🥁
    const clip = page.getByText("🥁").first();
    await clip.click();
    // Duplicate button appears on selected clip
    const duplicate = page.locator("button:has(svg.lucide-copy)");
    await expect(duplicate).toBeVisible();
    await duplicate.click();
    // Duplicating creates a new clip (two drum emojis on the same lane)
    await expect(page.getByText("🥁")).toHaveCount(2);
  });
});
