import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  /** Heading shown at the top of the dialog. */
  title: string;
  /** Supporting copy explaining what the action does. */
  description: string;
  /** Label for the confirm button. */
  confirmLabel: string;
  /** Label for the cancel button. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Called when the user confirms. */
  onConfirm?: () => void;
  /** Visual style of the confirm button. Defaults to "default". */
  confirmVariant?: 'default' | 'destructive';
  /**
   * Optional trigger element. When provided, the dialog is uncontrolled and
   * opens when the trigger is clicked. Omit it to control `open` yourself.
   */
  trigger?: React.ReactNode;
  /** Controlled open state (use with `onOpenChange` when no `trigger`). */
  open?: boolean;
  /** Controlled open-state callback. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * A small confirmation dialog built on the AlertDialog primitives. Used for
 * destructive or irreversible actions (e.g. resetting or replacing a project)
 * where the user must explicitly confirm before the action runs.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  confirmVariant = 'default',
  trigger,
  open,
  onOpenChange,
}: ConfirmDialogProps) {
  const content = (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
        <AlertDialogAction
          className={cn(confirmVariant === 'destructive' && buttonVariants({ variant: 'destructive' }))}
          onClick={onConfirm}
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  if (trigger !== undefined) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        {content}
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {content}
    </AlertDialog>
  );
}
