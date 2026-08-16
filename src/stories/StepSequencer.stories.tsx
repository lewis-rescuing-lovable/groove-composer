import type { Meta, StoryObj } from '@storybook/react-vite';
import { StepSequencer } from '@/components/daw/StepSequencer';
import { DAWProvider } from '@/stores/daw-store';
import { createEmptyDrumGrid } from '@/lib/types';
import type { DAWState } from '@/stores/daw-store-context';

const meta = {
  title: 'DAW/StepSequencer',
  component: StepSequencer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The step sequencer for the selected pattern. Each row is a drum sound, each column a step. Click a cell to toggle it; the playhead highlights the current step while playing. Wrapped in the DAW provider so it is fully interactive.',
      },
    },
  },
} satisfies Meta<typeof StepSequencer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// A 32-step pattern (two bars of 4/4) with a fuller groove, seeded into the
// DAW store so the sequencer shows a 32-step grid on load.
const pattern32 = {
  id: 'pattern-32',
  name: '32-Step Groove',
  steps: 32,
  grid: (() => {
    const g = createEmptyDrumGrid(32);
    // Kick on the four-on-the-floor beats (every 8 steps = every bar beat).
    for (let i = 0; i < 32; i += 8) g['kick'][i] = true;
    // Snare on beats 2 and 4 of each bar.
    g['snare'][4] = true; g['snare'][12] = true; g['snare'][20] = true; g['snare'][28] = true;
    // Closed hi-hats on every eighth note.
    for (let i = 0; i < 32; i += 2) g['hihat-closed'][i] = true;
    // Open hi-hat on the "and" of beat 4 in each bar.
    g['hihat-open'][14] = true; g['hihat-open'][30] = true;
    // Clap on the backbeat.
    g['clap'][4] = true; g['clap'][12] = true; g['clap'][20] = true; g['clap'][28] = true;
    // Cymbal crash on the downbeat of bar 2.
    g['cymbal'][16] = true;
    return g;
  })(),
};

const state32: DAWState = {
  projectName: '32-Step Demo',
  bpm: 120,
  timeSignature: [4, 4] as [number, number],
  tracks: [{
    id: 'track-32',
    name: 'Drums',
    volume: 0.8,
    pan: 0,
    muted: false,
    solo: false,
    clips: [{ id: 'clip-32', type: 'drum', startBeat: 0, durationBeats: 8, patternId: 'pattern-32' }],
  }],
  drumPatterns: [pattern32],
  synthPatterns: [],
  masterVolume: 0.8,
  loopEnabled: true,
  loopStart: 0,
  loopEnd: 8,
  isPlaying: false,
  currentStep: -1,
  selectedTrackId: 'track-32',
  selectedClipId: 'clip-32',
  masterMuted: false,
  autosaveEnabled: false,
  autosaveIntervalSeconds: 5,
};

export const ThirtyTwoSteps: Story = {
  name: '32-step pattern',
  parameters: {
    docs: {
      description: {
        story:
          'A 32-step (two-bar) pattern seeded into the DAW store, showing the sequencer with a 32-step grid and a fuller groove.',
      },
    },
  },
  decorators: [
    (Story) => (
      <DAWProvider initialState={state32}>
        <Story />
      </DAWProvider>
    ),
  ],
};
