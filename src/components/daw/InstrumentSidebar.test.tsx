import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DAWProvider } from '@/stores/daw-store';
import { InstrumentSidebar } from './InstrumentSidebar';

function renderSidebar() {
  return render(
    <DAWProvider>
      <InstrumentSidebar />
    </DAWProvider>,
  );
}

describe('InstrumentSidebar', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders panel tabs', () => {
    renderSidebar();
    // Panel tabs contain the labels; "Drums" also appears in helper text, so use getAllByText
    expect(screen.getAllByText('Drums').length).toBeGreaterThan(0);
    expect(screen.getByText('Synth')).toBeInTheDocument();
    expect(screen.getByText('Samples')).toBeInTheDocument();
  });

  it('switches to synth and samples panels', () => {
    renderSidebar();
    fireEvent.click(screen.getByText('Synth'));
    expect(screen.getByText('Synthesizer coming soon')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Samples'));
    expect(screen.getByText('Sample library coming soon')).toBeInTheDocument();
  });

  it('shows the default pattern in the drums panel', () => {
    renderSidebar();
    expect(screen.getByText('Pattern 1')).toBeInTheDocument();
    expect(screen.getByText('(16)')).toBeInTheDocument();
  });

  it('adds a new pattern when + is clicked', () => {
    renderSidebar();
    const buttons = screen.getAllByRole('button');
    // First 3 buttons are the panel tabs (Drums, Synth, Samples); index 3 is the "+" add-pattern button
    fireEvent.click(buttons[3]);
    expect(screen.getByText('Pattern 2')).toBeInTheDocument();
  });

  it('previews kit sounds on click', () => {
    renderSidebar();
    // Kit sounds buttons contain DRUM_LABELS
    expect(screen.getByText('Kick')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Kick'));
  });

  it('renames a pattern via the pencil button', () => {
    renderSidebar();
    const renameBtn = screen.getByRole('button', { name: 'Rename Pattern 1' });
    fireEvent.click(renameBtn);
    const input = screen.getByTestId('pattern-name-input-default-pattern');
    expect(input).toHaveValue('Pattern 1');
    fireEvent.change(input, { target: { value: 'Main Groove' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Main Groove')).toBeInTheDocument();
  });

  it('cancels rename on Escape', () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Rename Pattern 1' }));
    const input = screen.getByTestId('pattern-name-input-default-pattern');
    fireEvent.change(input, { target: { value: 'Nope' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.getByText('Pattern 1')).toBeInTheDocument();
  });
});
