import { test, expect } from "@playwright/test";
import { trackConsoleErrors } from "./helpers";

/**
 * Production-build verification.
 *
 * These run against the *built* app (npm run build + preview) rather than the
 * dev server, so you can debug/eject issues that only appear in production
 * output. To run them:
 *
 *   npm run build && npx playwright test e2e/build.spec.ts
 *
 * (Playwright's webServer can be pointed at `npm run preview` for these.)
 */
test.describe("production build smoke", () => {
  test.beforeEach(async ({ page }) => {
    // baseURL already points at /groove-composer/ for the build config
    await page.goto("/");
  });

  test("renders the DAW without console errors", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await expect(page.locator("canvas")).toBeVisible();
    await expect(page.getByText("Tracks")).toBeVisible();
    // no runtime errors on load
    expect(errors.errors).toEqual([]);
  });

  test("can play and stop in the production build", async ({ page }) => {
    await page.locator("button:has(svg.lucide-play)").first().click();
    await page.waitForTimeout(300);
    await page.locator("button:has(svg.lucide-square)").first().click();
    await expect(page.locator("button:has(svg.lucide-play)").first()).toBeVisible();
  });
});
