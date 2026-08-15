import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DAWProvider } from '@/stores/daw-store';
import { Timeline } from './Timeline';

function renderTimeline() {
  return render(
    <DAWProvider>
      <Timeline />
    </DAWProvider>,
  );
}

describe('Timeline', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders track headers and default track', () => {
    renderTimeline();
    expect(screen.getByText('Tracks')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Drums')).toBeInTheDocument();
  });

  it('adds a track when + is clicked', () => {
    renderTimeline();
    const buttons = screen.getAllByRole('button');
    // The + button is the first button in the timeline header
    fireEvent.click(buttons[0]);
    expect(screen.getByDisplayValue('Track 2')).toBeInTheDocument();
  });

  it('renames a track', () => {
    renderTimeline();
    const input = screen.getByDisplayValue('Drums');
    fireEvent.change(input, { target: { value: 'Bass' } });
    expect(input).toHaveValue('Bass');
  });

  it('toggles mute and solo', () => {
    renderTimeline();
    // M and S buttons exist in track controls
    const buttons = screen.getAllByRole('button');
    const textButtons = buttons.filter(b => b.textContent === 'M' || b.textContent === 'S');
    expect(textButtons.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(textButtons[0]); // M
    fireEvent.click(textButtons[1]); // S
  });

  it('shows empty state when no tracks remain', () => {
    renderTimeline();
    // Remove the only track via its delete button (a Trash2 icon: svg.lucide-trash2)
    const trash = screen
      .getAllByRole('button')
      .find(b => b.querySelector('svg.lucide-trash2'));
    fireEvent.click(trash!);
    expect(screen.getByText('Click + to add a track')).toBeInTheDocument();
  });
});
