/**
 * Captures annotated screenshots of the Groove Composer DAW for the user guide.
 *
 * Loads the app with a representative project, then captures each panel:
 *   - top bar (transport, BPM, persistence)
 *   - instrument sidebar (Drums / Synth / Samples panels)
 *   - timeline (tracks + clips)
 *   - step sequencer (editor)
 *   - spectrum analyzer
 *
 * Each capture is cropped to its element and, where useful, a highlight border
 * is drawn around a key sub-element to draw the reader's focus.
 *
 * Usage:
 *   node scripts/capture-guide-screenshots.mjs
 *
 * Output: docs/user-guide/*.png
 */
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../docs/user-guide");
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = "http://localhost:8080/";
const STORAGE_KEY = "groove-composer:project";

// A representative project: drums, a couple of melodic samples, and an egg
// shaker loop — enough to show off every panel.
const PROJECT = {
  projectName: "Starter Project",
  bpm: 120,
  timeSignature: [4, 4],
  tracks: [
    {
      id: "track-1", name: "Drums", volume: 0.8, pan: 0, muted: false, solo: false,
      clips: [
        { id: "clip-1", type: "drum", startBeat: 0, durationBeats: 4, patternId: "default-pattern" },
        { id: "7hgjpbxs", type: "drum", startBeat: 4, durationBeats: 4, patternId: "default-pattern" },
        { id: "xqcnm3th", type: "drum", startBeat: 8, durationBeats: 4, patternId: "default-pattern" },
      ],
    },
    {
      id: "8gebvw0c", name: "Track 2", volume: 0.8, pan: 0, muted: false, solo: false,
      clips: [{ id: "t9owklqf", type: "drum", startBeat: 4, durationBeats: 4, patternId: "840b8v85" }],
    },
    {
      id: "hasfq6xx", name: "Track 3", volume: 0.8, pan: 0, muted: false, solo: false,
      clips: [{ id: "ay89htum", type: "drum", startBeat: 0, durationBeats: 4, patternId: "5jmedxmj" }],
    },
    {
      id: "tsxrjyys", name: "Kalimba", volume: 0.8, pan: 0, muted: false, solo: false,
      clips: [{ id: "f0p8985a", type: "sample", startBeat: 0, durationBeats: 4, sampleId: "kalimba", loop: false }],
    },
    {
      id: "35678go2", name: "Kalimba", volume: 0.8, pan: 0, muted: false, solo: false,
      clips: [{ id: "avart0w5", type: "sample", startBeat: 2, durationBeats: 4, sampleId: "kalimba", loop: false }],
    },
    {
      id: "c568b4zf", name: "Egg Shaker", volume: 0.8, pan: 0, muted: false, solo: false,
      clips: [{ id: "doo7kpjc", type: "sample", startBeat: 4, durationBeats: 4, sampleId: "egg-shaker", loop: true }],
    },
  ],
  drumPatterns: [
    {
      id: "default-pattern", name: "Drums", steps: 16,
      grid: {
        kick: [true,false,false,false,true,false,false,false,true,false,false,false,true,false,false,false],
        snare: [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false],
        "hihat-closed": [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false],
        "hihat-open": [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        clap: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        tom: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        cymbal: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        rimshot: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
      },
    },
    {
      id: "840b8v85", name: "Clap & Cymbal", steps: 16,
      grid: {
        kick: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        snare: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        "hihat-closed": [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        "hihat-open": [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        clap: [false,false,false,false,false,false,false,false,true,false,true,false,true,false,false,false],
        tom: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        cymbal: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false],
        rimshot: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
      },
    },
    {
      id: "5jmedxmj", name: "Pattern 3", steps: 16,
      grid: {
        kick: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        snare: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        "hihat-closed": [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        "hihat-open": [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        clap: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        tom: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        cymbal: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        rimshot: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
      },
    },
  ],
  synthPatterns: [],
  masterVolume: 0.8,
  loopEnabled: false,
  loopStart: 0,
  loopEnd: 4,
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Load the representative project into storage, then load the app.
await page.goto(BASE_URL);
await page.evaluate(
  ([key, value]) => localStorage.setItem(key, value),
  [STORAGE_KEY, JSON.stringify(PROJECT)],
);
await page.reload();
await page.waitForTimeout(600);

// Helper: draw a highlight border around a sub-element to draw the reader's eye.
async function highlight(locator, color = "#f59e0b", width = 3) {
  const el = locator.first();
  if (await el.count() === 0) return;
  await el.evaluate((node, [col, w]) => {
    node.style.outline = `${w}px solid ${col}`;
    node.style.outlineOffset = "2px";
  }, [color, width]);
}

// Clear any highlight outlines we added.
async function clearHighlights() {
  await page.evaluate(() => {
    document.querySelectorAll("[style*='outline']").forEach((e) => (e.style.outline = ""));
  });
}

// ── 1. Top bar ────────────────────────────────────────────────
await highlight(page.locator('input[value="Starter Project"]'), "#3b82f6");
await highlight(page.locator('input[type="number"]'), "#3b82f6");
await page.locator('div[class*="h-14"]').first().screenshot({ path: path.join(OUT_DIR, "topbar.png") });
await clearHighlights();

// ── 2. Sidebar — Drums panel ──────────────────────────────────
await page.locator('div[class*="w-56"]').first().screenshot({ path: path.join(OUT_DIR, "sidebar-drums.png") });

// ── 3. Sidebar — Samples panel ────────────────────────────────
await page.locator('button:has-text("Samples")').first().click();
await page.waitForTimeout(300);
await highlight(page.locator('div[class*="w-56"]').getByText("Sample Library"), "#10b981");
await page.locator('div[class*="w-56"]').first().screenshot({ path: path.join(OUT_DIR, "sidebar-samples.png") });
await clearHighlights();

// ── 4. Sidebar — Synth panel ──────────────────────────────────
await page.locator('button:has-text("Synth")').first().click();
await page.waitForTimeout(300);
await highlight(page.locator('div[class*="w-56"]').getByText("Waveform"), "#f59e0b");
await page.locator('div[class*="w-56"]').first().screenshot({ path: path.join(OUT_DIR, "sidebar-synth.png") });
await clearHighlights();

// Back to Drums for the timeline/editor shots.
await page.locator('button:has-text("Drums")').first().click();
await page.waitForTimeout(300);

// ── 5. Timeline ───────────────────────────────────────────────
// Highlight the "Tracks" header + the add-track button.
await highlight(page.getByText("Tracks", { exact: true }), "#8b5cf6");
// Capture the whole timeline region: ruler + all track lanes. The timeline is
// the flex-1 column that holds the sticky ruler and the scrollable lanes.
const timeline = page
  .locator('div[class*="flex-1"]')
  .filter({ hasText: "Tracks" })
  .first();
await timeline.screenshot({ path: path.join(OUT_DIR, "timeline.png") });
await clearHighlights();

// ── 6. Step sequencer (editor) ────────────────────────────────
// Highlight the active pattern name + a row of step cells.
await highlight(page.getByRole("button", { name: "Kick" }), "#ef4444");
// The editor is the flex-1 container that holds the "Editor" label + StepSequencer.
const editor = page
  .locator('div[class*="flex-1"]')
  .filter({ hasText: "Editor" })
  .first();
await editor.screenshot({ path: path.join(OUT_DIR, "editor.png") });
await clearHighlights();

// ── 7. Spectrum analyzer ──────────────────────────────────────
// The analyzer only draws bars while audio is playing, so start playback first.
await page.locator('button:has(svg.lucide-play)').first().click();
await page.waitForTimeout(1200); // let the analyser fill with live data
// Capture the canvas at its natural 200x60 size (the container is height-constrained).
await page.locator("canvas").last().screenshot({ path: path.join(OUT_DIR, "spectrum.png") });

// ── 8. Full-app hero shot ─────────────────────────────────────
// Keep playback running so the spectrum analyzer looks active in the hero too.
await page.screenshot({ path: path.join(OUT_DIR, "hero.png") });

await browser.close();
console.log("Screenshots written to", OUT_DIR);
