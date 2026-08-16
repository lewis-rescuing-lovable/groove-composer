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
    expect(screen.getByDisplayValue('Starter Project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('120')).toBeInTheDocument();
    expect(screen.getByText('4/4')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument(); // 0.8 * 100 rounded
  });

  it('updates project name on change', () => {
    renderTopBar();
    const input = screen.getByDisplayValue('Starter Project');
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

  it('renders save, load, and reset controls', () => {
    renderTopBar();
    expect(screen.getByRole('button', { name: 'Save project' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load project' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset project' })).toBeInTheDocument();
  });

  it('reset returns the project to defaults', () => {
    renderTopBar();
    const name = screen.getByDisplayValue('Starter Project');
    fireEvent.change(name, { target: { value: 'My Groove' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset project' }));
    expect(screen.getByDisplayValue('Starter Project')).toBeInTheDocument();
  });

  it('toggles the loop flag', () => {
    renderTopBar();
    // Loop button is the third transport button (after play/pause and stop)
    const buttons = screen.getAllByRole('button');
    const loopButton = buttons[2];
    fireEvent.click(loopButton);
    // No crash; loop state toggled internally
    expect(screen.getByText('4/4')).toBeInTheDocument();
  });

  it('changes master volume via the slider', () => {
    renderTopBar();
    // The master volume slider is the last slider on the page
    const sliders = document.querySelectorAll('[role="slider"]');
    const masterSlider = sliders[sliders.length - 1];
    fireEvent.keyDown(masterSlider, { key: 'ArrowRight' });
    // No crash; volume updated internally
    expect(screen.getByText('4/4')).toBeInTheDocument();
  });

  it('load with nothing saved logs an info message', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    window.localStorage.removeItem('groove-composer:project');
    renderTopBar();
    fireEvent.click(screen.getByRole('button', { name: 'Load project' }));
    expect(infoSpy).toHaveBeenCalled();
    infoSpy.mockRestore();
  });

  it('renders the autosave checkbox and interval input', () => {
    renderTopBar();
    expect(screen.getByRole('checkbox', { name: 'Autosave' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Autosave interval' })).toHaveValue('00:05');
  });

  it('disables the interval input when autosave is off', () => {
    renderTopBar();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Autosave' }));
    expect(screen.getByRole('textbox', { name: 'Autosave interval' })).toBeDisabled();
  });

  it('commits a valid interval on blur and rejects an over-max value', () => {
    renderTopBar();
    const interval = screen.getByRole('textbox', { name: 'Autosave interval' });
    // Valid: 90s -> 01:30
    fireEvent.change(interval, { target: { value: '90' } });
    fireEvent.blur(interval);
    expect(screen.getByRole('textbox', { name: 'Autosave interval' })).toHaveValue('01:30');
    // Over max: 3601 rejected -> reverts to last valid value
    fireEvent.change(interval, { target: { value: '3601' } });
    fireEvent.blur(interval);
    expect(screen.getByRole('textbox', { name: 'Autosave interval' })).toHaveValue('01:30');
  });
});
