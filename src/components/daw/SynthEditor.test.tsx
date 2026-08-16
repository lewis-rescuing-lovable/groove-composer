import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DAWProvider } from '@/stores/daw-store';
import { SynthEditor } from './SynthEditor';
import type { DAWState } from '@/stores/daw-store-context';

// A state with a synth track + pattern so the editor has something to show.
const synthState: DAWState = {
  projectName: 'Synth',
  bpm: 90,
  timeSignature: [4, 4] as [number, number],
  tracks: [{
    id: 'track-synth',
    name: 'Canon Synth',
    volume: 0.8,
    pan: 0,
    muted: false,
    solo: false,
    clips: [{ id: 'clip-canon', type: 'synth', startBeat: 0, durationBeats: 4, patternId: 'canon-pattern' }],
  }],
  drumPatterns: [],
  synthPatterns: [{
    id: 'canon-pattern',
    name: 'Canon in D',
    notes: [{ pitch: 62, startStep: 0, duration: 4, velocity: 0.8 }],
  }],
  masterVolume: 0.8,
  loopEnabled: true,
  loopStart: 0,
  loopEnd: 4,
  isPlaying: false,
  currentStep: -1,
  selectedTrackId: 'track-synth',
  selectedClipId: 'clip-canon',
  masterMuted: false,
  autosaveEnabled: false,
  autosaveIntervalSeconds: 5,
};

function renderEditor(state: DAWState = synthState) {
  return render(
    <DAWProvider initialState={state}>
      <SynthEditor />
    </DAWProvider>,
  );
}

describe('SynthEditor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders pitch labels for the default octave range (C3..B4)', () => {
    renderEditor();
    expect(screen.getByText('C3')).toBeInTheDocument();
    expect(screen.getByText('B4')).toBeInTheDocument();
  });

  it('shows the seeded note as active', () => {
    renderEditor();
    // The seeded note is pitch 62 (D4) at step 0.
    const cell = screen.getByRole('button', { name: 'Note 62 step 1' });
    expect(cell).toHaveClass('bg-daw-clip-synth');
  });

  it('toggles a note on click', () => {
    renderEditor();
    const cell = screen.getByRole('button', { name: 'Note 60 step 1' });
    expect(cell).not.toHaveClass('bg-daw-clip-synth');
    fireEvent.click(cell);
    expect(cell).toHaveClass('bg-daw-clip-synth');
    fireEvent.click(cell);
    expect(cell).not.toHaveClass('bg-daw-clip-synth');
  });

  it('shows placeholder when no synth pattern is active', () => {
    const emptyState: DAWState = {
      ...synthState,
      tracks: [{ ...synthState.tracks[0], clips: [] }],
    };
    renderEditor(emptyState);
    expect(screen.getByText(/Select a track with a synth clip/)).toBeInTheDocument();
  });

  it('changes the octave range via the octave selectors', () => {
    renderEditor();
    // Default shows C3..B4. Raise the lowest octave to 4 -> shows C4..B4.
    fireEvent.change(screen.getByLabelText('Lowest octave'), { target: { value: '4' } });
    expect(screen.getByText('C4')).toBeInTheDocument();
    expect(screen.queryByText('C3')).not.toBeInTheDocument();
  });

  it('offers pattern length controls up to 32 bars', () => {
    renderEditor();
    expect(screen.getByText('1 bar')).toBeInTheDocument();
    expect(screen.getByText('32 bars')).toBeInTheDocument();
  });
});
