import type { Meta, StoryObj } from '@storybook/react-vite';
import { SynthEditor } from '@/components/daw/SynthEditor';
import { DAWProvider } from '@/stores/daw-store';
import type { DAWState } from '@/stores/daw-store-context';
import { CANON_SYNTH_PATTERN } from '@/lib/canon-midi';
import { ODE_TO_JOY_SYNTH_PATTERN } from '@/lib/ode-to-joy';
import { withPlayControl } from './withPlayControl';

const meta = {
  title: 'DAW/SynthEditor',
  component: SynthEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The piano-roll editor for the selected synth pattern. Each row is a pitch (C3\u2013B4), each column a sixteenth step. Click a cell to place or remove a note; click a pitch label to preview it. Wrapped in the DAW provider so it is fully interactive.',
      },
    },
  },
} satisfies Meta<typeof SynthEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// A one-bar (16-step) D major arpeggio that fills the editor grid nicely:
// D3 - D4 - F#4 - A4, with the root D3 on the downbeat.
const arpeggioNotes = [
  { pitch: 50, startStep: 0, duration: 4, velocity: 0.8 },   // D3
  { pitch: 62, startStep: 0, duration: 4, velocity: 0.7 },   // D4
  { pitch: 66, startStep: 4, duration: 4, velocity: 0.7 },   // F#4
  { pitch: 69, startStep: 8, duration: 4, velocity: 0.7 },   // A4
  { pitch: 62, startStep: 12, duration: 4, velocity: 0.7 },   // D4 (octave)
];

const stateWithSynth: DAWState = {
  projectName: 'Synth Arpeggio',
  bpm: 90,
  timeSignature: [4, 4] as [number, number],
  tracks: [
    {
      id: 'track-synth',
      name: 'Synth',
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      clips: [
        { id: 'clip-arpeggio', type: 'synth', startBeat: 0, durationBeats: 4, patternId: 'arpeggio-pattern' },
      ],
    },
  ],
  drumPatterns: [],
  synthPatterns: [
    {
      id: 'arpeggio-pattern',
      name: 'D Major Arpeggio',
      notes: arpeggioNotes,
    },
  ],
  masterVolume: 0.8,
  loopEnabled: true,
  loopStart: 0,
  loopEnd: 4,
  isPlaying: false,
  currentStep: -1,
  selectedTrackId: 'track-synth',
  selectedClipId: 'clip-arpeggio',
  masterMuted: false,
  autosaveEnabled: false,
  autosaveIntervalSeconds: 5,
};

export const Arpeggio: Story = {
  name: 'D Major Arpeggio',
  parameters: {
    docs: {
      description: {
        story:
          'The piano-roll editor seeded with a one-bar D major arpeggio (D3\u2013D4\u2013F#4\u2013A4). Click cells to add or remove notes, or click a pitch label to preview it.',
      },
    },
  },
  decorators: [
    (Story) => (
      <DAWProvider initialState={stateWithSynth}>
        <Story />
      </DAWProvider>
    ),
  ],
};

// The Canon in D arrangement converted from a MIDI file (see src/lib/canon-midi.ts).
const stateWithCanon: DAWState = {
  projectName: 'Pachelbel Canon in D',
  bpm: 90,
  timeSignature: [4, 4] as [number, number],
  tracks: [
    {
      id: 'track-canon',
      name: 'Canon Synth',
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
  selectedTrackId: 'track-canon',
  selectedClipId: 'clip-canon',
  masterMuted: false,
  autosaveEnabled: false,
  autosaveIntervalSeconds: 5,
};

export const CanonInD: Story = {
  name: 'Canon in D (from MIDI)',
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
          'The piano-roll editor seeded with Pachelbel\u2019s Canon in D, converted from a Standard MIDI File via src/lib/midi.ts. The 8-bar arrangement (ground bass + melody) is laid out across the grid.',
      },
    },
  },
  decorators: [
    (Story, context) => (
      <DAWProvider initialState={stateWithCanon}>
        {withPlayControl(Story, context)}
      </DAWProvider>
    ),
  ],
};

// Ode to Joy arrangement converted from a MIDI file (see src/lib/ode-to-joy.ts).
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
  selectedClipId: 'clip-ode',
  masterMuted: false,
  autosaveEnabled: false,
  autosaveIntervalSeconds: 5,
};

export const OdeToJoy: Story = {
  name: 'Ode to Joy (from MIDI)',
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
          'The piano-roll editor seeded with Beethoven\u2019s Ode to Joy, converted from a Standard MIDI File via src/lib/midi.ts. The melody (right hand) and bass (left hand) are laid out across the grid.',
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
