# Plan: Add cat meow sounds to the sample library

**Branch:** `feat/cat-meow-samples`
**Worktree:** `/Users/lewiscowles/Projects/groove-composer-cat-meow`
**Status:** IMPLEMENTED. Tests pass (156/156, coverage thresholds met). Not yet committed.

## Goal

Add a few cat meow sounds to the Groove Composer sample library, sourced from
royalty-free / Creative Commons audio, in a **separate worktree** so the main
`feat/storybook-component-library` branch is untouched.

## How the sample library works (context)

- Samples are **not** committed as binaries. The manifest in
  `src/lib/samples.ts` is data-driven: one row per sample with `id`, `name`,
  `category`, `url`, `sizeBytes`, `license`, `attribution`.
- `src/lib/sample-loader.ts` fetches each sample at runtime, validates:
  - HTTP status `ok`
  - `content-type` must include `audio/` or `octet-stream`
  - byte size must **exactly** equal `sizeBytes` (strict equality check)
  - decodes via `AudioContext.decodeAudioData`
- Attribution is recorded in `docs/sample-attribution.md` (table of samples).
- Tests: `src/lib/samples.test.ts` (manifest shape), `src/lib/sample-loader.test.ts`.
  Coverage thresholds enforced (branches ≥75%).
- Existing samples all come from the OLPC Berklee library (CC BY 3.0), mirrored
  at `https://raw.githubusercontent.com/Tonejs/audio/master/berklee/`.

## Source research (verified)

### RECOMMENDED: `haydenroche5/meow_dataset` on GitHub (non-Wikimedia)

A GitHub-hosted cat meow audio dataset. Served via `raw.githubusercontent.com`
(the project's existing serving pattern), which returns `audio/wav` — passes the
loader's `content-type` check.

- Repo: `https://github.com/haydenroche5/meow_dataset` (default branch `master`)
- The `kaggle_*` clips come from the Kaggle **"Audio Cats and Dogs"** dataset
  (`https://www.kaggle.com/datasets/mmoreaux/audio-cats-and-dogs`), which is
  **CC BY-SA 3.0**.
- The repo itself has **no LICENSE file**, but the `kaggle_*` clips are
  CC BY-SA 3.0 via their Kaggle source. Attribute accordingly.

**Verified stable clips (HTTP 200, `content-type: audio/wav`, stable across
repeated requests):**

| File | URL | Size (bytes) |
|------|-----|--------------|
| `meow/kaggle_cat_10_0.wav` | `https://raw.githubusercontent.com/haydenroche5/meow_dataset/master/meow/kaggle_cat_10_0.wav` | 33370 |
| `meow/kaggle_cat_11_0.wav` | `https://raw.githubusercontent.com/haydenroche5/meow_dataset/master/meow/kaggle_cat_11_0.wav` | 40986 |
| `meow/kaggle_cat_12_0.wav` | `https://raw.githubusercontent.com/haydenroche5/meow_dataset/master/meow/kaggle_cat_12_0.wav` | 38062 |
| `meow/kaggle_cat_13_0.wav` | `https://raw.githubusercontent.com/haydenroche5/meow_dataset/master/meow/kaggle_cat_13_0.wav` | 62444 |
| `meow/kaggle_cat_14_0.wav` | `https://raw.githubusercontent.com/haydenroche5/meow_dataset/master/meow/kaggle_cat_14_0.wav` | 18926 |

> Note: The repo also has `newton_*` clips (the author's own cat, no clear
> license) and `youtube_*` clips (from YouTube, unclear license). **Prefer the
> `kaggle_*` clips** which are CC BY-SA 3.0 via their Kaggle source.

### Wikimedia Commons — NOT recommended (avoid)

Wikimedia Commons hosts cat meow files, but:
- The **original Ogg files** return `content-type: application/ogg`, which FAILS
  the loader's `content-type` check.
- The **MP3 transcodes** return `audio/mpeg` but are **flaky / lazily
  generated** — most returned 404 on test (only `Meow.ogg`'s transcode was
  stable). The Wikimedia API also rate-limits rapid requests.
- Not worth the flakiness. Use the GitHub dataset above instead.

### Freesound — NOT recommended

Freesound has many cat meows (e.g. `cat meow` by tuberatanka, `Cat Smokey Meow 2`
by redjamie7, etc.) but **requires an API key** for direct downloads and has no
stable anonymous direct-link URLs. This does NOT fit the runtime-fetch
architecture. Skip unless you want to self-host the files.

### OLPC Berklee library (existing source) — no dedicated cat meow

The Berklee library has `cat_rattle_1.mp3` / `cat_rattle_2.mp3` (a rattle, not a
meow) and generic `animal_vocal_*.mp3` / `animals*.mp3`, but no clean single-cat
meow. Not ideal.

## Implementation steps (TODO for the next person)

1. **Verify the `kaggle_*` WAV URLs** are stable (re-test a few times) and
   confirm `content-type: audio/wav` and exact byte sizes. Pick 2–3 clips.

2. **Add rows to `src/lib/samples.ts`** in `SAMPLE_LIBRARY`. Suggested entries
   (category `fx` — cat meows are sound effects, not melodic/percussive):
   ```ts
   {
     id: 'cat-meow',
     name: 'Cat Meow',
     category: 'fx',
     url: 'https://raw.githubusercontent.com/haydenroche5/meow_dataset/master/meow/kaggle_cat_10_0.wav',
     sizeBytes: 33370,
     license: 'CC BY-SA 3.0',
     attribution: 'Kaggle "Audio Cats and Dogs" dataset (CC BY-SA 3.0)',
   },
   ```
   Add 2–3 more clips. Keep `sizeBytes` exact.

3. **Update `docs/sample-attribution.md`** — add the new rows to the samples
   table, and note the new source (GitHub `meow_dataset` / Kaggle "Audio Cats
   and Dogs", CC BY-SA 3.0) alongside the existing Berklee source. Update the
   "How samples are loaded" / child-safety notes if needed (cat meows are gentle
   and child-safe).

4. **Update tests** if needed:
   - `src/lib/samples.test.ts` already asserts generic shape (unique ids, https
     urls, sizeBytes > 0, valid category) — new rows should pass as-is.
   - Consider adding a test asserting the new cat-meow sample exists, if desired.

5. **Run the test suite** to confirm nothing breaks:
   ```bash
   npx vitest run --coverage
   ```
   (Coverage thresholds enforced — branches ≥75%.)

6. **Commit** on the `feat/cat-meow-samples` branch in this worktree.

## Files to touch

- `src/lib/samples.ts` (add rows)
- `docs/sample-attribution.md` (add attribution rows + source note)
- (optional) `src/lib/samples.test.ts` (add a specific assertion)

## Notes / gotchas

- The loader does an **exact** byte-size match. If a file's size changes, the
  sample will fail to load. Verify sizes at commit time.
- `content-type` must be `audio/*` or `octet-stream`. The `kaggle_*` WAVs return
  `audio/wav`, which passes.
- Do NOT add more drum sounds (project rule). Cat meows are `fx`, which is fine.
- The main branch has uncommitted work; keep all cat-meow changes in this
  worktree only.
