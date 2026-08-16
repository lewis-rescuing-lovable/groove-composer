import type { Meta, StoryObj } from '@storybook/react-vite';
import { SamplesPanel } from '@/components/daw/panels';

const meta = {
  title: 'DAW/Panels/Samples',
  component: SamplesPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The Samples panel: curated sample library with one-shot/loop choice and add-track. Rendered inside the composable InstrumentSidebar.',
      },
    },
  },
} satisfies Meta<typeof SamplesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
