import type { Meta, StoryObj } from '@storybook/react-vite';
import { TopBar } from '@/components/daw/TopBar';
import { DAWProvider } from '@/stores/daw-store';
import { createEmptyDrumGrid } from '@/lib/types';
import type { DAWState } from '@/stores/daw-store-context';
import { EnableAudioOverlay } from './EnableAudioOverlay';

const meta = {
  title: 'DAW/TopBar',
  component: TopBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The top bar: project name, BPM, time signature, transport (play/stop/loop), autosave controls, save/load/reset, and master volume. Wrapped in the DAW provider so it is fully interactive. localStorage is stubbed out in Storybook, so save/load/autosave are inert during demos.',
      },
    },
  },
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Base state shared by the seeded stories.
const baseState: DAWState = {
  projectName: 'Starter Project',
  bpm: 120,
  timeSignature: [4, 4] as [number, number],
  tracks: [],
  drumPatterns: [],
  synthPatterns: [],
  masterVolume: 0.8,
  loopEnabled: true,
  loopStart: 0,
  loopEnd: 4,
  isPlaying: false,
  currentStep: -1,
  selectedTrackId: null,
  selectedClipId: null,
  masterMuted: false,
  autosaveEnabled: true,
  autosaveIntervalSeconds: 5,
};

export const Default: Story = {};

// A playable four-on-the-floor drum pattern + track, so the Playing story can
// actually make sound once the user enables audio.
const playablePattern = {
  id: 'playable-pattern',
  name: 'Drums',
  steps: 16,
  grid: (() => {
    const g = createEmptyDrumGrid(16);
    g['kick'][0] = true; g['kick'][4] = true; g['kick'][8] = true; g['kick'][12] = true;
    g['snare'][4] = true; g['snare'][12] = true;
    for (let i = 0; i < 16; i += 2) g['hihat-closed'][i] = true;
    return g;
  })(),
};

const playingState: DAWState = {
  ...baseState,
  isPlaying: true,
  currentStep: 0,
  masterMuted: true,
  tracks: [{
    id: 'track-1',
    name: 'Drums',
    volume: 0.8,
    pan: 0,
    muted: false,
    solo: false,
    clips: [{ id: 'clip-1', type: 'drum', startBeat: 0, durationBeats: 4, patternId: 'playable-pattern' }],
  }],
  drumPatterns: [playablePattern],
};

export const Playing: Story = {
  name: 'Playing (repeat on, muted)',
  parameters: {
    docs: {
      description: {
        story:
          'Seeded with `isPlaying: true`, `loopEnabled: true`, `masterMuted: true`, and a playable drum pattern. Browsers block audio autoplay, so click **Enable audio** to start the sound. The transport shows the pause button, the loop (repeat) toggle is highlighted, and the master is muted (click the volume icon to unmute).',
      },
    },
  },
  decorators: [
    (Story) => (
      <DAWProvider initialState={playingState}>
        <Story />
        <EnableAudioOverlay />
      </DAWProvider>
    ),
  ],
};

// Autosave off: the checkbox is unchecked and the interval field is disabled.
const autosaveOffState: DAWState = {
  ...baseState,
  autosaveEnabled: false,
};

export const AutosaveOff: Story = {
  name: 'Autosave off',
  parameters: {
    docs: {
      description: {
        story:
          'Seeded with `autosaveEnabled: false`. The Auto-save checkbox is unchecked and the interval field is disabled.',
      },
    },
  },
  decorators: [
    (Story) => (
      <DAWProvider initialState={autosaveOffState}>
        <Story />
      </DAWProvider>
    ),
  ],
};

// Autosave on at the 60:00 hard maximum.
const autosaveMaxState: DAWState = {
  ...baseState,
  autosaveEnabled: true,
  autosaveIntervalSeconds: 60 * 60, // 60:00
};

export const AutosaveMax: Story = {
  name: 'Autosave on (60:00)',
  parameters: {
    docs: {
      description: {
        story:
          'Seeded with `autosaveEnabled: true` and `autosaveIntervalSeconds: 3600`, so the interval field shows the 60:00 hard maximum.',
      },
    },
  },
  decorators: [
    (Story) => (
      <DAWProvider initialState={autosaveMaxState}>
        <Story />
      </DAWProvider>
    ),
  ],
};
