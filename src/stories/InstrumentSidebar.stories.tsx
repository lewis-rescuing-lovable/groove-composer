import type { Meta, StoryObj } from '@storybook/react-vite';
import { InstrumentSidebar } from '@/components/daw/InstrumentSidebar';
import { DrumsPanel, SamplesPanel, SynthPanel } from '@/components/daw/panels';
import { Drum, FileAudio, Music } from 'lucide-react';

const meta = {
  title: 'DAW/InstrumentSidebar',
  component: InstrumentSidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A composable instrument sidebar. It renders whatever panels it is given as tabs; panels not provided are omitted entirely. The active tab is local state, so it renders standalone without the DAW store.',
      },
    },
  },
  argTypes: {
    panels: { control: false },
  },
} satisfies Meta<typeof InstrumentSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DrumsAndSamples: Story = {
  name: 'Drums + Samples (app default)',
  args: {
    panels: [
      { key: 'drums', label: 'Drums', icon: Drum, content: DrumsPanel },
      { key: 'samples', label: 'Samples', icon: FileAudio, content: SamplesPanel },
    ],
  },
};

export const WithSynth: Story = {
  name: 'Drums + Synth + Samples',
  args: {
    panels: [
      { key: 'drums', label: 'Drums', icon: Drum, content: DrumsPanel },
      { key: 'synth', label: 'Synth', icon: Music, content: SynthPanel },
      { key: 'samples', label: 'Samples', icon: FileAudio, content: SamplesPanel },
    ],
  },
};

export const DrumsOnly: Story = {
  name: 'Drums only',
  args: {
    panels: [
      { key: 'drums', label: 'Drums', icon: Drum, content: DrumsPanel },
    ],
  },
};
