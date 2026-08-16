import type { Meta, StoryObj } from '@storybook/react-vite';
import { DrumsPanel } from '@/components/daw/panels';

const meta = {
  title: 'DAW/Panels/Drums',
  component: DrumsPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The Drums panel: pattern list (assign/rename/delete) and kit-sound previews. Rendered inside the composable InstrumentSidebar.',
      },
    },
  },
} satisfies Meta<typeof DrumsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
