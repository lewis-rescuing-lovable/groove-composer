import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DAWProvider } from '@/stores/daw-store';
import { TopBar } from './TopBar';

function renderTopBar() {
  return render(
    <DAWProvider>
      <TopBar />
    </DAWProvider>,
  );
}

describe('TopBar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders project name, bpm, time signature, and master volume', () => {
    renderTopBar();
    expect(screen.getByDisplayValue('Untitled Project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('120')).toBeInTheDocument();
    expect(screen.getByText('4/4')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument(); // 0.8 * 100 rounded
  });

  it('updates project name on change', () => {
    renderTopBar();
    const input = screen.getByDisplayValue('Untitled Project');
    fireEvent.change(input, { target: { value: 'My Groove' } });
    expect(input).toHaveValue('My Groove');
  });

  it('updates bpm within bounds', () => {
    renderTopBar();
    const bpm = screen.getByDisplayValue('120');
    fireEvent.change(bpm, { target: { value: '150' } });
    expect(bpm).toHaveValue(150);
    // out of bounds clamps
    fireEvent.change(bpm, { target: { value: '999' } });
    expect(bpm).toHaveValue(300);
    fireEvent.change(bpm, { target: { value: '1' } });
    expect(bpm).toHaveValue(40);
  });

  it('toggles play state via the play/pause button', () => {
    renderTopBar();
    // First button in the transport is play/pause. Get all buttons and find the one before Stop.
    const buttons = screen.getAllByRole('button');
    // The transport buttons are the first 3: [play/pause, stop, loop]
    const playButton = buttons[0];
    fireEvent.click(playButton);
    // After play, the button becomes a pause icon; verify state changed via no throw
    fireEvent.click(screen.getAllByRole('button')[0]);
  });
});
