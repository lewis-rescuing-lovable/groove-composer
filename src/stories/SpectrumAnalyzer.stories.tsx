import type { Meta, StoryObj } from '@storybook/react-vite';
import { SpectrumAnalyzer } from '@/components/daw/SpectrumAnalyzer';

const meta = {
  title: 'DAW/SpectrumAnalyzer',
  component: SpectrumAnalyzer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A live frequency visualization of the master output. Green bars are quieter frequencies; they shift toward yellow and red as the level rises. In the app it reads from the audio engine while playing; in Storybook, set `demoMode` to visualize a synthesized moving spectrum without audio.',
      },
    },
  },
  argTypes: {
    demoMode: {
      control: 'boolean',
      description: 'Synthesize a moving spectrum (for Storybook, where there is no audio context).',
    },
  },
} satisfies Meta<typeof SpectrumAnalyzer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { demoMode: true },
};
