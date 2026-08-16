import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DAWProvider } from '@/stores/daw-store';
import { InstrumentSidebar } from './InstrumentSidebar';
import { DrumsPanel, SamplesPanel, SynthPanel } from './panels';
import { Drum, FileAudio, Music } from 'lucide-react';

const appPanels = [
  { key: 'drums', label: 'Drums', icon: Drum, content: DrumsPanel },
  { key: 'samples', label: 'Samples', icon: FileAudio, content: SamplesPanel },
];

const allPanels = [
  { key: 'drums', label: 'Drums', icon: Drum, content: DrumsPanel },
  { key: 'synth', label: 'Synth', icon: Music, content: SynthPanel },
  { key: 'samples', label: 'Samples', icon: FileAudio, content: SamplesPanel },
];

function renderSidebar(panels = appPanels) {
  return render(
    <DAWProvider>
      <InstrumentSidebar panels={panels} />
    </DAWProvider>,
  );
}

describe('InstrumentSidebar', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders only the provided panel tabs', () => {
    renderSidebar();
    // Drums + Samples tabs are present; Synth is omitted (no "coming soon")
    expect(screen.getAllByText('Drums').length).toBeGreaterThan(0);
    expect(screen.getByText('Samples')).toBeInTheDocument();
    expect(screen.queryByText('Synth')).not.toBeInTheDocument();
    expect(screen.queryByText('Synthesizer coming soon')).not.toBeInTheDocument();
  });

  it('switches to the samples panel', () => {
    renderSidebar();
    fireEvent.click(screen.getByText('Samples'));
    expect(screen.getByText('Sample Library')).toBeInTheDocument();
    // A curated sample from the library is listed
    expect(screen.getByText('Kalimba')).toBeInTheDocument();
  });

  it('shows loop/one-shot controls and add-track for samples', () => {
    renderSidebar();
    fireEvent.click(screen.getByText('Samples'));
    // Each sample card has One-shot / Loop toggles and an Add track button
    expect(screen.getAllByText('One-shot').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Loop').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Add track').length).toBeGreaterThan(0);
  });

  it('renders a synth tab when a SynthPanel is provided', () => {
    renderSidebar(allPanels);
    expect(screen.getByText('Synth')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Synth'));
    // The synth panel shows its waveform controls and keyboard.
    expect(screen.getByText('Waveform')).toBeInTheDocument();
    expect(screen.getByText('Envelope')).toBeInTheDocument();
    expect(screen.getByText('Keyboard')).toBeInTheDocument();
  });

  it('shows the default pattern in the drums panel', () => {
    renderSidebar();
    // "Drums" appears as both the panel tab and a pattern name
    expect(screen.getAllByText('Drums').length).toBeGreaterThan(0);
    expect(screen.getByText('Clap & Cymbal')).toBeInTheDocument();
    // Each pattern shows its step count
    expect(screen.getAllByText('(16)')).toHaveLength(2);
  });

  it('adds a new pattern when + is clicked', () => {
    renderSidebar();
    const buttons = screen.getAllByRole('button');
    // First 2 buttons are the panel tabs (Drums, Samples); index 2 is the "+" add-pattern button
    fireEvent.click(buttons[2]);
    expect(screen.getByText('Pattern 3')).toBeInTheDocument();
  });

  it('previews kit sounds on click', () => {
    renderSidebar();
    // Kit sounds buttons contain DRUM_LABELS
    expect(screen.getByText('Kick')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Kick'));
  });

  it('renames a pattern via the pencil button', () => {
    renderSidebar();
    const renameBtn = screen.getByRole('button', { name: 'Rename Drums' });
    fireEvent.click(renameBtn);
    const input = screen.getByTestId('pattern-name-input-default-pattern');
    expect(input).toHaveValue('Drums');
    fireEvent.change(input, { target: { value: 'Main Groove' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Main Groove')).toBeInTheDocument();
  });

  it('cancels rename on Escape', () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Rename Drums' }));
    const input = screen.getByTestId('pattern-name-input-default-pattern');
    fireEvent.change(input, { target: { value: 'Nope' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    // "Drums" appears as both the panel tab and a pattern name
    expect(screen.getAllByText('Drums').length).toBeGreaterThan(0);
  });
});
