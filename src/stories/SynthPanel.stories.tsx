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
          'Placeholder for the upcoming synthesizer. Not wired into the app yet — this story shows how a future SynthPanel would slot into the composable InstrumentSidebar. When the synth is implemented, replace this body with the real controls.',
      },
    },
  },
} satisfies Meta<typeof SynthPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {};
