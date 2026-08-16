import { test, expect } from "@playwright/test";
import { selectors, trackConsoleErrors, checkSampleLibrary, checkSynthesizer } from "./helpers";

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
    await expect(page.locator('input[value="Starter Project"]')).toBeVisible();
    await expect(page.getByText("Tracks")).toBeVisible();
    // Default drum track + patterns
    await expect(page.locator('input[value="Drums"]')).toBeVisible();
    await expect(page.getByText(/Clap & Cymbal/)).toBeVisible();
    // Spectrum canvas present
    await expect(page.locator("canvas")).toBeVisible();
  });

  test("adds a new drum track (adds music)", async ({ page }) => {
    // Click the timeline "+" button to add a track
    const tracksHeader = page.getByText("Tracks");
    const addTrack = tracksHeader.locator("xpath=..").locator("button");
    await addTrack.click();
    await expect(page.locator('input[value="Track 3"]')).toBeVisible();
    // New track has its own pattern
    await expect(page.getByText("Pattern 3", { exact: true })).toBeVisible();
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
    await expect(page.getByText("Pattern 3")).toBeVisible();
  });

  test("switches between drums and samples panels", async ({ page }) => {
    // The app's sidebar is composable: Drums + Synth + Samples tabs are provided.
    await expect(page.locator(selectors.samplesTab).first()).toBeVisible();
    await expect(page.locator("button:has-text('Synth')").first()).toBeVisible();
    await page.locator(selectors.samplesTab).first().click();
    await checkSampleLibrary(page);
    // Back to drums
    await page.locator(selectors.drumsTab).first().click();
    await expect(page.getByText("Patterns")).toBeVisible();
  });

  test("shows the synth panel", async ({ page }) => {
    await page.locator("button:has-text('Synth')").first().click();
    await checkSynthesizer(page);
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
    // Select the first drum clip (click on the clip block, shown with a drum emoji 🥁)
    const clip = page.getByText("🥁").first();
    const before = await page.getByText("🥁").count();
    await clip.click();
    // Duplicate button appears on selected clip
    const duplicate = page.locator("button:has(svg.lucide-copy)");
    await expect(duplicate).toBeVisible();
    await duplicate.click();
    // Duplicating creates a new clip (one more drum emoji)
    await expect(page.getByText("🥁")).toHaveCount(before + 1);
  });

  test("renames a pattern from the sidebar", async ({ page }) => {
    // Pencil button for the default pattern
    const rename = page.getByRole("button", { name: "Rename Drums" });
    await rename.click();
    const input = page.getByTestId("pattern-name-input-default-pattern");
    await input.fill("Main Groove");
    await input.press("Enter");
    // The pattern name renders together with its step count, e.g. "Main Groove(16)".
    // Target the sidebar entry specifically (the sequencer may also show the name).
    await expect(page.getByText(/Main Groove\(16\)/)).toBeVisible();
  });

  test("renames a pattern from the sequencer", async ({ page }) => {
    const rename = page.getByRole("button", { name: "Rename pattern", exact: true });
    await rename.click();
    const input = page.getByTestId("pattern-name-input");
    await input.fill("Groove A");
    await input.press("Enter");
    await expect(page.getByText("Groove A", { exact: true })).toBeVisible();
  });

  test("saves, reloads, and resets a project", async ({ page }) => {
    // Rename the project so we can detect persistence
    const projectName = page.locator('input[value="Starter Project"]');
    await projectName.fill("Persisted Groove");

    // Save explicitly, then reload the page (fresh session)
    await page.getByRole("button", { name: "Save project" }).click();
    await page.reload();
    await expect(page.locator('input[value="Persisted Groove"]')).toBeVisible();

    // Reset returns to defaults (after confirming the dialog)
    await page.getByRole("button", { name: "Reset project" }).click();
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(page.locator('input[value="Starter Project"]')).toBeVisible();

    // Reset only affects the loaded project — the saved project in storage survives a reload.
    await page.reload();
    await expect(page.locator('input[value="Persisted Groove"]')).toBeVisible();
  });
});
