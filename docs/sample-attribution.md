# Sample Attribution

Most samples in the Groove Composer sample library are sourced from the
**OLPC Berklee Sound Library** and are licensed under **CC BY 3.0**.

- Source: https://wiki.laptop.org/go/Sound_samples
- Mirrored via: https://github.com/Tonejs/audio (folder `berklee/`)
- License: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)

The **cat meow** samples are sourced from the **Kaggle "Audio Cats and Dogs"**
dataset and are licensed under **CC BY-SA 3.0**.

- Dataset: https://www.kaggle.com/datasets/mmoreaux/audio-cats-and-dogs
- Mirrored via: https://github.com/haydenroche5/meow_dataset (folder `meow/`)
- License: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)

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
| `cat-meow` | Cat Meow | fx | `kaggle_cat_10_0.wav` | 33370 |
| `cat-meow-2` | Cat Meow 2 | fx | `kaggle_cat_11_0.wav` | 40986 |
| `cat-meow-3` | Cat Meow 3 | fx | `kaggle_cat_12_0.wav` | 38062 |

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
layer with the existing drum kit. The cat meow samples are gentle `fx` sounds
that fit this child-safe set.
