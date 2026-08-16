import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Index from './Index';

// Index mounts the full DAWProvider stack.
function renderIndex() {
  return render(<Index />);
}

describe('Index', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders the full DAW layout', () => {
    renderIndex();
    expect(screen.getByDisplayValue('Starter Project')).toBeInTheDocument();
    expect(screen.getByText('Tracks')).toBeInTheDocument();
    expect(screen.getAllByText('Drums').length).toBeGreaterThan(0);
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Spectrum')).toBeInTheDocument();
  });

  it('renders a pattern and spectrum canvas', () => {
    renderIndex();
    expect(screen.getAllByText('Clap & Cymbal').length).toBeGreaterThan(0);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('can add a track through the timeline', () => {
    renderIndex();
    // Find the timeline header region ("Tracks") then the "+" button within its parent.
    const tracksHeader = screen.getByText('Tracks');
    const headerRow = tracksHeader.closest('div')!;
    const addButton = headerRow.querySelector('button')!;
    fireEvent.click(addButton);
    expect(screen.getByDisplayValue('Track 3')).toBeInTheDocument();
  });

  it('can switch panels via the sidebar', () => {
    renderIndex();
    // The app's sidebar is composable: only Drums + Samples tabs are provided.
    // The Synth tab is omitted until the synth is implemented.
    expect(screen.queryByText('Synth')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByText('Samples')[0]);
    expect(screen.getByText('Sample Library')).toBeInTheDocument();
  });
});
