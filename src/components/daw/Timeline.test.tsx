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
    expect(screen.getByDisplayValue('Track 3')).toBeInTheDocument();
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
    // Remove both default tracks via their delete buttons (a Trash2 icon: svg.lucide-trash2)
    const trashButtons = screen
      .getAllByRole('button')
      .filter(b => b.querySelector('svg.lucide-trash2'));
    for (const trash of trashButtons) {
      fireEvent.click(trash);
    }
    expect(screen.getByText('Click + to add a track')).toBeInTheDocument();
  });

  it('selects a clip on click', () => {
    renderTimeline();
    // The drum clip blocks show a 🥁 emoji; click the first one
    const clip = screen.getAllByText('🥁')[0];
    fireEvent.click(clip);
    // Selecting a clip reveals its duplicate button
    expect(screen.getByTitle('Duplicate clip')).toBeInTheDocument();
  });

  it('duplicates a clip', () => {
    renderTimeline();
    const before = screen.getAllByText('🥁').length;
    const clip = screen.getAllByText('🥁')[0];
    fireEvent.click(clip);
    fireEvent.click(screen.getByTitle('Duplicate clip'));
    // Duplicating adds another drum clip
    expect(screen.getAllByText('🥁').length).toBe(before + 1);
  });
});
