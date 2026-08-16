import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { SampleWaveform } from './SampleWaveform';
import { sampleLoader } from '@/lib/sample-loader';

describe('SampleWaveform', () => {
  beforeEach(() => {
    vi.spyOn(sampleLoader, 'get').mockReturnValue({
      def: { id: 'kalimba', name: 'Kalimba', category: 'melodic', url: '', sizeBytes: 0, license: '', attribution: '' },
      status: 'ready',
      buffer: { getChannelData: () => new Float32Array(100) } as unknown as AudioBuffer,
      error: null,
    });
    vi.spyOn(sampleLoader, 'load').mockResolvedValue({
      def: { id: 'kalimba', name: 'Kalimba', category: 'melodic', url: '', sizeBytes: 0, license: '', attribution: '' },
      status: 'ready',
      buffer: { getChannelData: () => new Float32Array(100) } as unknown as AudioBuffer,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a canvas', () => {
    const { container } = render(<SampleWaveform sampleId="kalimba" width={100} height={28} />);
    expect(container.querySelector('canvas')).not.toBeNull();
  });
});
