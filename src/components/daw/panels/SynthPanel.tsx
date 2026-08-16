import { useDAW } from '@/stores/daw-store-context';
import { DEFAULT_SYNTH_VOICE, midiToFrequency, type SynthVoice, type WaveformType } from '@/lib/types';
import { Slider } from '@/components/ui/slider';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const WAVEFORMS: WaveformType[] = ['sine', 'square', 'sawtooth', 'triangle'];

/** A one-octave chromatic keyboard (C4..B4) for previewing notes. */
const KEYS: { midi: number; label: string; black: boolean }[] = [
  { midi: 60, label: 'C', black: false },
  { midi: 61, label: 'C#', black: true },
  { midi: 62, label: 'D', black: false },
  { midi: 63, label: 'D#', black: true },
  { midi: 64, label: 'E', black: false },
  { midi: 65, label: 'F', black: false },
  { midi: 66, label: 'F#', black: true },
  { midi: 67, label: 'G', black: false },
  { midi: 68, label: 'G#', black: true },
  { midi: 69, label: 'A', black: false },
  { midi: 70, label: 'A#', black: true },
  { midi: 71, label: 'B', black: false },
];

/**
 * The Synth panel: a monophonic synthesizer voice (waveform, filter, ADSR) with
 * a one-octave keyboard for previewing notes. Rendered inside the composable
 * InstrumentSidebar. The voice is local state, so the panel renders standalone
 * without persisting to the DAW store.
 */
export function SynthPanel() {
  const { previewNote, addSynthTrack } = useDAW();
  const [voice, setVoice] = useState<SynthVoice>(DEFAULT_SYNTH_VOICE);

  const set = <K extends keyof SynthVoice>(key: K, value: SynthVoice[K]) =>
    setVoice(v => ({ ...v, [key]: value }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Synth</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addSynthTrack} title="Add a synth track">
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Waveform */}
      <div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Waveform</span>
        <div className="mt-1.5 grid grid-cols-4 gap-1">
          {WAVEFORMS.map(w => (
            <button
              key={w}
              onClick={() => set('waveform', w)}
              className={`px-1 py-1 text-[10px] font-mono rounded border transition-colors
                ${voice.waveform === w
                  ? 'bg-primary/20 border-primary/40 text-primary'
                  : 'border-border text-muted-foreground hover:bg-daw-step-hover'}`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Filter</span>
        <Knob
          label="Cutoff"
          value={voice.filterCutoff}
          min={100}
          max={8000}
          step={10}
          display={`${Math.round(voice.filterCutoff)} Hz`}
          onChange={v => set('filterCutoff', v)}
        />
        <Knob
          label="Resonance"
          value={voice.filterResonance}
          min={0}
          max={20}
          step={0.1}
          display={voice.filterResonance.toFixed(1)}
          onChange={v => set('filterResonance', v)}
        />
      </div>

      {/* Envelope (ADSR) */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Envelope</span>
        <Knob
          label="Attack"
          value={voice.attack}
          min={0}
          max={1}
          step={0.01}
          display={`${voice.attack.toFixed(2)}s`}
          onChange={v => set('attack', v)}
        />
        <Knob
          label="Decay"
          value={voice.decay}
          min={0}
          max={1}
          step={0.01}
          display={`${voice.decay.toFixed(2)}s`}
          onChange={v => set('decay', v)}
        />
        <Knob
          label="Sustain"
          value={voice.sustain}
          min={0}
          max={1}
          step={0.01}
          display={`${Math.round(voice.sustain * 100)}%`}
          onChange={v => set('sustain', v)}
        />
        <Knob
          label="Release"
          value={voice.release}
          min={0}
          max={2}
          step={0.01}
          display={`${voice.release.toFixed(2)}s`}
          onChange={v => set('release', v)}
        />
      </div>

      {/* Keyboard */}
      <div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Keyboard</span>
        <div className="mt-1.5 flex gap-px">
          {KEYS.map(k => (
            <button
              key={k.midi}
              onClick={() => previewNote(k.midi, voice)}
              title={`${k.label} (${midiToFrequency(k.midi).toFixed(1)} Hz)`}
              aria-label={`Play ${k.label}`}
              className={`flex-1 h-16 rounded-sm text-[9px] font-mono transition-colors
                ${k.black
                  ? 'bg-foreground text-background hover:bg-primary'
                  : 'bg-card border border-border text-secondary-foreground hover:bg-daw-step-hover'}`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A labeled slider row for a synth parameter. */
function Knob({
  label, value, min, max, step, display, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[10px] font-mono text-muted-foreground">{label}</span>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="flex-1"
        aria-label={label}
      />
      <span className="w-14 shrink-0 text-right text-[10px] font-mono text-secondary-foreground">{display}</span>
    </div>
  );
}

