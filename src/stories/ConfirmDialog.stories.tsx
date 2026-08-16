import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/daw/ConfirmDialog';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'DAW/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A small confirmation dialog built on the AlertDialog primitives. Used for destructive or irreversible actions (e.g. resetting or replacing a project) where the user must explicitly confirm before the action runs. Pass a `trigger` for an uncontrolled dialog, or control `open`/`onOpenChange` yourself.',
      },
    },
  },
  argTypes: {
    confirmVariant: {
      control: 'inline-radio',
      options: ['default', 'destructive'],
    },
    onConfirm: { action: 'confirm' },
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Uncontrolled: the trigger button opens the dialog.
export const Default: Story = {
  args: {
    title: 'Delete track?',
    description: 'This removes the selected track and its clips. This cannot be undone.',
    confirmLabel: 'Delete',
    confirmVariant: 'destructive',
    trigger: <Button variant="outline">Open dialog</Button>,
  },
};

// Controlled: the dialog is opened programmatically via `open`.
export const Controlled: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex flex-col items-center gap-4">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open controlled dialog
        </Button>
        <ConfirmDialog {...args} open={open} onOpenChange={setOpen} />
      </div>
    );
  },
  args: {
    title: 'Load saved project?',
    description: 'This replaces the current project with the one saved in browser storage. Any unsaved changes will be lost.',
    confirmLabel: 'Load',
  },
};
