# Sample Attribution

All samples in the Groove Composer sample library are sourced from the
**OLPC Berklee Sound Library** and are licensed under **CC BY 3.0**.

- Source: https://wiki.laptop.org/go/Sound_samples
- Mirrored via: https://github.com/Tonejs/audio (folder `berklee/`)
- License: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)

## Samples

| Sample id | Name | Category | File | Size (bytes) |
|-----------|------|----------|------|--------------|
| `kalimba` | Kalimba | melodic | `Kalimba_1.mp3` | 8723 |
| `pling` | Pling | melodic | `Pling1.mp3` | 49560 |
| `bell` | Bell | melodic | `bell1.mp3` | 21351 |
| `chime` | Chime | melodic | `chime_1.mp3` | 34821 |
| `chimes-singlenote` | Chimes (single) | melodic | `chimes-singlenote.mp3` | 15216 |
| `anklung` | Anklung | melodic | `anklung_1.mp3` | 5524 |
| `bamboonaphone` | Bamboonaphone | melodic | `bamboonaphone_1.mp3` | 39841 |
| `bike-bell` | Bike Bell | fx | `bike_bell_1.mp3` | 3859 |
| `cowbell` | Cowbell | percussive | `cowbell1_big.mp3` | 8923 |
| `egg-shaker` | Egg Shaker | percussive | `egg_shaker1.mp3` | 7557 |

## How samples are loaded

Samples are **not** committed as binary files. Instead, the manifest in
`src/lib/samples.ts` declares each sample's remote URL and expected size. At
runtime, `src/lib/sample-loader.ts` fetches each sample, validates the HTTP
status, content-type, and byte size, decodes it into an `AudioBuffer`, and
caches it. Failed loads are retried with exponential backoff. This means adding
a new sample is a single row in the manifest — no per-sample code change.

## Child-safety note

The curated set above was chosen to be gentle, melodic, and free of harsh or
alarming content, suitable for a working and children's environment. No
additional drum sounds were added; these are melodic/percussive textures that
layer with the existing drum kit.
