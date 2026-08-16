import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timeline } from '@/components/daw/Timeline';
import { DAWProvider } from '@/stores/daw-store';
import type { DAWState } from '@/stores/daw-store-context';
import { withPlayControl } from './withPlayControl';

const meta = {
  title: 'DAW/Timeline',
  component: Timeline,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The arrangement timeline: tracks, clips, mute/solo, volume, and the beat ruler. Drag clips to move them; resize from the right edge. Wrapped in the DAW provider so it is fully interactive.',
      },
    },
  },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// A project with drum tracks plus sample tracks (Kalimba, Egg Shaker), seeded
// into the DAW store so the timeline shows sample clips with waveforms.
const stateWithSamples: DAWState = {
  projectName: 'Starter Project',
  bpm: 120,
  timeSignature: [4, 4] as [number, number],
  tracks: [
    {
      id: 'track-1',
      name: 'Drums',
      volume: 1,
      pan: 0,
      muted: false,
      solo: false,
      clips: [
        { id: 'clip-1', type: 'drum', startBeat: 0, durationBeats: 4, patternId: 'default-pattern' },
        { id: '7hgjpbxs', type: 'drum', startBeat: 4, durationBeats: 4, patternId: 'default-pattern' },
        { id: 'xqcnm3th', type: 'drum', startBeat: 8, durationBeats: 4, patternId: 'default-pattern' },
      ],
    },
    {
      id: '8gebvw0c',
      name: 'Track 2',
      volume: 1,
      pan: 0,
      muted: false,
      solo: false,
      clips: [{ id: 't9owklqf', type: 'drum', startBeat: 4, durationBeats: 4, patternId: '840b8v85' }],
    },
    {
      id: 'hasfq6xx',
      name: 'Track 3',
      volume: 1,
      pan: 0,
      muted: false,
      solo: false,
      clips: [{ id: 'ay89htum', type: 'drum', startBeat: 0, durationBeats: 4, patternId: '5jmedxmj' }],
    },
    {
      id: 'tsxrjyys',
      name: 'Kalimba',
      volume: 1,
      pan: 0,
      muted: false,
      solo: false,
      clips: [{ id: 'f0p8985a', type: 'sample', startBeat: 0, durationBeats: 4, sampleId: 'kalimba', loop: false }],
    },
    {
      id: '35678go2',
      name: 'Kalimba',
      volume: 1,
      pan: 0,
      muted: false,
      solo: false,
      clips: [{ id: 'avart0w5', type: 'sample', startBeat: 2, durationBeats: 4, sampleId: 'kalimba', loop: false }],
    },
    {
      id: 'c568b4zf',
      name: 'Egg Shaker',
      volume: 1,
      pan: 0,
      muted: false,
      solo: false,
      clips: [{ id: 'doo7kpjc', type: 'sample', startBeat: 4, durationBeats: 4, sampleId: 'egg-shaker', loop: true }],
    },
  ],
  drumPatterns: [
    {
      id: 'default-pattern',
      name: 'Drums',
      steps: 16,
      grid: {
        kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        'hihat-closed': [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        'hihat-open': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        clap: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        tom: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        cymbal: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        rimshot: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      },
    },
    {
      id: '840b8v85',
      name: 'Clap & Cymbal',
      steps: 16,
      grid: {
        kick: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        snare: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        'hihat-closed': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        'hihat-open': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        clap: [false, false, false, false, false, false, false, false, true, false, true, false, true, false, false, false],
        tom: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        cymbal: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false],
        rimshot: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      },
    },
    {
      id: '5jmedxmj',
      name: 'Pattern 3',
      steps: 16,
      grid: {
        kick: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        snare: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        'hihat-closed': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        'hihat-open': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        clap: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        tom: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        cymbal: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        rimshot: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      },
    },
  ],
  synthPatterns: [],
  masterVolume: 1,
  loopEnabled: false,
  loopStart: 0,
  loopEnd: 4,
  isPlaying: false,
  currentStep: -1,
  selectedTrackId: 'track-1',
  selectedClipId: null,
  masterMuted: false,
  autosaveEnabled: false,
  autosaveIntervalSeconds: 5,
};

export const WithSamples: Story = {
  name: 'Timeline with samples',
  parameters: {
    docs: {
      description: {
        story:
          'A project with drum tracks plus sample tracks (Kalimba, Egg Shaker), showing sample clips with waveforms and loop/one-shot badges.',
      },
    },
  },
  decorators: [
    (Story) => (
      <DAWProvider initialState={stateWithSamples}>
        <Story />
      </DAWProvider>
    ),
  ],
};

// ─── Pachelbel's Canon in D ────────────────────────────────────
// A real arrangement (ground bass + melody) encoded as a Standard MIDI File and
// converted to the app's SynthNote format via src/lib/midi.ts. The 8-bar
// progression (D - A - Bm - F#m - G - D - G - A) repeats on loop, played with a
// piano voice.
import { CANON_SYNTH_PATTERN } from '@/lib/canon-midi';

const stateWithSynth: DAWState = {
  projectName: 'Pachelbel Canon in D',
  bpm: 90,
  timeSignature: [4, 4] as [number, number],
  tracks: [
    {
      id: 'track-synth',
      name: 'Canon Piano',
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      clips: [
        { id: 'clip-canon', type: 'synth', startBeat: 0, durationBeats: 32, patternId: 'canon-pattern' },
      ],
    },
  ],
  drumPatterns: [],
  synthPatterns: [CANON_SYNTH_PATTERN],
  masterVolume: 0.8,
  loopEnabled: true,
  loopStart: 0,
  loopEnd: 32,
  isPlaying: false,
  currentStep: -1,
  selectedTrackId: 'track-synth',
  selectedClipId: null,
  masterMuted: false,
  autosaveEnabled: false,
  autosaveIntervalSeconds: 5,
};

export const CanonInD: Story = {
  name: 'Pachelbel Canon in D (synth, loop)',
  args: { play: false, bpm: 90 },
  argTypes: {
    play: {
      control: 'boolean',
      description: 'Start / stop playback of the seeded pattern.',
    },
    bpm: {
      control: { type: 'number', min: 40, max: 300, step: 1 },
      description: 'Tempo in beats per minute.',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'A single synth track playing Pachelbel\u2019s Canon in D. The 8-bar arrangement (ground bass + melody) was encoded as a Standard MIDI File and converted to the app\u2019s SynthNote format via src/lib/midi.ts. It repeats on loop; toggle Play to hear it.',
      },
    },
  },
  decorators: [
    (Story, context) => (
      <DAWProvider initialState={stateWithSynth}>
        {withPlayControl(Story, context)}
      </DAWProvider>
    ),
  ],
};

// ─── Beethoven's Ode to Joy ─────────────────────────────────────
import { ODE_TO_JOY_SYNTH_PATTERN } from '@/lib/ode-to-joy';

const stateWithOde: DAWState = {
  projectName: 'Ode to Joy',
  bpm: 100,
  timeSignature: [4, 4] as [number, number],
  tracks: [
    {
      id: 'track-ode',
      name: 'Ode to Joy',
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      clips: [
        { id: 'clip-ode', type: 'synth', startBeat: 0, durationBeats: 32, patternId: 'ode-to-joy-pattern' },
      ],
    },
  ],
  drumPatterns: [],
  synthPatterns: [ODE_TO_JOY_SYNTH_PATTERN],
  masterVolume: 0.8,
  loopEnabled: true,
  loopStart: 0,
  loopEnd: 32,
  isPlaying: false,
  currentStep: -1,
  selectedTrackId: 'track-ode',
  selectedClipId: null,
  masterMuted: false,
  autosaveEnabled: false,
  autosaveIntervalSeconds: 5,
};

export const OdeToJoy: Story = {
  name: 'Ode to Joy (synth, loop)',
  args: { play: false, bpm: 100 },
  argTypes: {
    play: {
      control: 'boolean',
      description: 'Start / stop playback of the seeded pattern.',
    },
    bpm: {
      control: { type: 'number', min: 40, max: 300, step: 1 },
      description: 'Tempo in beats per minute.',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'A single synth track playing Beethoven\u2019s Ode to Joy. The melody (right hand) and bass (left hand) were encoded as a Standard MIDI File and converted to the app\u2019s SynthNote format via src/lib/midi.ts. It repeats on loop; toggle Play to hear it.',
      },
    },
  },
  decorators: [
    (Story, context) => (
      <DAWProvider initialState={stateWithOde}>
        {withPlayControl(Story, context)}
      </DAWProvider>
    ),
  ],
};
