import type { Meta, StoryObj } from '@storybook/react-vite';
import { SynthPanel } from '@/components/daw/panels';

const meta = {
  title: 'DAW/Panels/Synth',
  component: SynthPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The synthesizer panel: a monophonic voice (waveform, low-pass filter, ADSR envelope) with a one-octave keyboard for previewing notes. The voice is local state, so it renders standalone without persisting to the DAW store.',
      },
    },
  },
} satisfies Meta<typeof SynthPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

