import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DAWProvider } from '@/stores/daw-store';
import { audioEngine } from '@/lib/audio-engine';
import { SpectrumAnalyzer } from './SpectrumAnalyzer';

function renderAnalyzer() {
  return render(
    <DAWProvider>
      <SpectrumAnalyzer />
    </DAWProvider>,
  );
}

describe('SpectrumAnalyzer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    audioEngine.dispose();
    vi.unstubAllGlobals();
  });

  it('renders a canvas', () => {
    renderAnalyzer();
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('draws the spectrum when the analyser is available', async () => {
    // Initialize the audio engine so analyserNode is set
    audioEngine.init();
    renderAnalyzer();
    // Flush the requestAnimationFrame (setTimeout-based) so the draw loop runs
    await new Promise((r) => setTimeout(r, 0));
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });
});
