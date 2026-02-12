

# 🎵 Browser Music Composer — "BeatForge"

## Overview
A multi-track music composition tool built entirely in the browser using the Web Audio API. Create beats, melodies, and arrangements with drag-and-drop, then export your work.

---

## 1. Timeline & Track System
- **Dynamic track count** — add/remove tracks freely. Performance note shown to users: each track adds audio processing overhead, so a soft warning appears around 16+ tracks suggesting they bounce/merge tracks if performance drops
- Each track has: name, volume slider, mute/solo buttons, pan control, and a VU meter
- Horizontal scrollable timeline with a playback cursor, snap-to-grid, and zoom in/out
- BPM control and time signature selector

## 2. Sound Sources

### Drum Machine
- Built-in drum kit with kick, snare, hi-hat (open/closed), clap, tom, cymbal, rimshot
- Step sequencer grid (16/32 steps) for quick beat programming
- Drum patterns can be dragged onto the timeline as clips

### Synthesizer
- Oscillator-based synth (sine, square, sawtooth, triangle waveforms)
- ADSR envelope controls (attack, decay, sustain, release)
- Filter with cutoff and resonance knobs
- Piano roll editor for composing melodies — notes placed on a grid
- Synth patterns saved as clips and placed on the timeline

### Sample Upload
- Drag & drop or file picker to upload WAV/MP3 files
- Uploaded samples appear in a sample library panel
- Samples can be trimmed and placed directly on tracks

## 3. Clip & Arrangement Workflow
- **Clips** are the building blocks — drum patterns, synth sequences, or audio samples
- Drag & drop clips onto any track on the timeline
- Move, duplicate, resize, and delete clips on the timeline
- Color-coded clips by type (drums = orange, synth = purple, samples = blue)

## 4. Visualizations
- **Waveform display** on each audio clip in the timeline
- **Spectrum analyzer** — frequency bars shown during playback in a dedicated panel
- **VU meters** — per-track level indicators showing real-time volume

## 5. Playback Controls
- Play, pause, stop, loop toggle
- Click on timeline to set playback position
- Preview individual clips before placing them
- Master volume control

## 6. Export & Save
- **WAV export** — renders the full mix using OfflineAudioContext for high-quality offline rendering
- **Project save/load** — save arrangement as JSON file (track layout, clip data, synth settings, BPM). Load it back to continue editing
- Download buttons for both formats

## 7. UI Layout
- **Top bar**: project name, BPM, time signature, transport controls (play/pause/stop), master volume
- **Left sidebar**: instrument panels (drum machine, synth, sample library)
- **Center**: timeline with tracks and clips
- **Bottom panel**: clip editor (step sequencer or piano roll depending on selected clip) + spectrum analyzer
- Dark theme by default for a studio feel

## Starting Scope
We'll build this incrementally — starting with the timeline, drum machine with step sequencer, and basic playback, then layering in the synth, sample uploads, visualizations, and export features.

