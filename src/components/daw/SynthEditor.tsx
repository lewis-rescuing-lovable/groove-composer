import { memo, useCallback, useRef, useState } from 'react';
import { useDAW } from '@/stores/daw-store-context';
import { midiToFrequency, DEFAULT_SYNTH_VOICE, type SynthPattern } from '@/lib/types';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Fixed cell geometry (px).
const CELL_W = 28;
const CELL_H = 28;
const LABEL_W = 64;
const ROW_H = CELL_H + 2; // + gap

// Octave range selector: which octaves to show (each octave = 12 pitches).
const OCTAVE_OPTIONS = [1, 2, 3, 4, 5, 6];

/** Build the pitch rows for a given octave range (highest first). */
function pitchesForOctaves(lo: number, hi: number) {
  const rows: { midi: number; label: string; black: boolean }[] = [];
  // Octave N spans midi (N+1)*12 .. (N+2)*12 - 1 (e.g. octave 4 = C4..B4 = 60..71).
  for (let midi = (hi + 2) * 12 - 1; midi >= (lo + 1) * 12; midi--) {
    const name = NOTE_NAMES[midi % 12];
    rows.push({ midi, label: `${name}${Math.floor(midi / 12) - 1}`, black: name.includes('#') });
  }
  return rows;
}

/**
 * The synth editor: a virtualized piano-roll grid. Only the cells in the
 * current scroll window are rendered, so arbitrarily long patterns stay fast.
 * Each row is a pitch, each column a sixteenth step. Click a cell to place (or
 * remove) a note. The playhead highlights the current step while playing.
 */
export function SynthEditor() {
  const { state, dispatch, previewNote } = useDAW();

  // Octave range (default C3..B4 = octaves 3-4).
  const [octLo, setOctLo] = useState(3);
  const [octHi, setOctHi] = useState(4);
  const pitches = pitchesForOctaves(octLo, octHi);

  // Horizontal scroll window state.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportW, setViewportW] = useState(0);

  const selectedTrack = state.tracks.find(t => t.id === state.selectedTrackId);
  const activeClip = selectedTrack?.clips.find(c =>
    state.selectedClipId ? c.id === state.selectedClipId : c.type === 'synth'
  );
  const pattern: SynthPattern | null = activeClip?.patternId
    ? state.synthPatterns.find(p => p.id === activeClip.patternId) ?? null
    : null;

  const toggleNote = useCallback(
    (patternId: string, pitch: number, step: number) => {
      dispatch({ type: 'TOGGLE_SYNTH_NOTE', patternId, pitch, step });
    },
    [dispatch],
  );

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollLeft(el.scrollLeft);
    setViewportW(el.clientWidth);
  }, []);

  if (!pattern) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-mono">
        Select a track with a synth clip to edit its pattern
      </div>
    );
  }

  const steps = pattern.steps ?? pattern.notes.reduce(
    (max, n) => Math.max(max, n.startStep + n.duration),
    16,
  );

  const clipStartStep = (activeClip?.startBeat ?? 0) * 4;
  const clipEndStep = clipStartStep + (activeClip?.durationBeats ?? steps / 4) * 4;

  // Virtualize horizontally: only render steps within [startStep, endStep).
  const totalW = steps * CELL_W;
  const startStep = Math.max(0, Math.floor(scrollLeft / CELL_W));
  const endStep = Math.min(steps, startStep + Math.ceil(viewportW / CELL_W) + 2);
  const visibleSteps = Array.from({ length: endStep - startStep }, (_, i) => startStep + i);

  return (
    <div className="flex flex-col h-full select-none">
      {/* Toolbar: octave range + pattern length */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground">{pattern.name}</span>
        <div className="flex items-center gap-1 text-[10px] font-mono">
          <span className="text-muted-foreground">Octaves</span>
          <select
            value={octLo}
            onChange={(e) => setOctLo(Number(e.target.value))}
            className="bg-muted border border-border rounded px-1 py-0.5"
            aria-label="Lowest octave"
          >
            {OCTAVE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <span className="text-muted-foreground">–</span>
          <select
            value={octHi}
            onChange={(e) => setOctHi(Number(e.target.value))}
            className="bg-muted border border-border rounded px-1 py-0.5"
            aria-label="Highest octave"
          >
            {OCTAVE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex gap-1 ml-auto">
          {[16, 32, 64, 128, 256, 512].map(n => (
            <button
              key={n}
              onClick={() => dispatch({ type: 'SET_SYNTH_PATTERN_STEPS', patternId: pattern.id, steps: n })}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors
                ${steps === n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
            >
              {n / 16} bar{n > 16 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-auto">
        <div className="flex">
          {/* Pitch labels (sticky left) */}
          <div className="sticky left-0 z-10 bg-background shrink-0" style={{ width: LABEL_W }}>
            {pitches.map(({ midi, label, black }) => (
              <button
                key={midi}
                onClick={() => previewNote(midi, DEFAULT_SYNTH_VOICE)}
                className={`w-full text-[10px] font-mono truncate text-left px-1 rounded transition-colors
                  ${black ? 'text-muted-foreground' : 'text-secondary-foreground'} hover:bg-muted`}
                style={{ height: ROW_H }}
                title={`${label} (${midiToFrequency(midi).toFixed(1)} Hz)`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Grid: full-size spacer + windowed cells */}
          <div className="relative" style={{ width: totalW, height: pitches.length * ROW_H }}>
            {/* Step ruler */}
            <div className="sticky top-0 z-10 bg-background flex" style={{ height: 16 }}>
              {visibleSteps.map(step => (
                <div
                  key={step}
                  className={`shrink-0 text-[8px] font-mono flex items-center justify-center
                    ${step % 4 === 0 ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}
                  style={{ width: CELL_W }}
                >
                  {step % 4 === 0 ? step / 4 + 1 : '·'}
                </div>
              ))}
            </div>

            {/* Windowed cells, offset by scrollLeft */}
            <div className="absolute top-4" style={{ transform: `translateX(${startStep * CELL_W}px)` }}>
              {pitches.map(({ midi }) => (
                <div key={midi} className="flex" style={{ height: ROW_H }}>
                  {visibleSteps.map(step => (
                    <NoteCell
                      key={step}
                      step={step}
                      pitch={midi}
                      isActive={pattern.notes.some(n => n.pitch === midi && n.startStep === step)}
                      isCurrentStep={
                        state.isPlaying
                        && state.currentStep >= clipStartStep
                        && state.currentStep < clipEndStep
                        && (state.currentStep - clipStartStep) % steps === step
                      }
                      onToggle={toggleNote}
                      patternId={pattern.id}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Memoized note cell ───────────────────────────────────────
const NoteCell = memo(function NoteCell({
  step, pitch, isActive, isCurrentStep, onToggle, patternId,
}: {
  step: number;
  pitch: number;
  isActive: boolean;
  isCurrentStep: boolean;
  onToggle: (patternId: string, pitch: number, step: number) => void;
  patternId: string;
}) {
  const isBeatStart = step % 4 === 0;
  return (
    <button
      aria-label={`Note ${pitch} step ${step + 1}`}
      onClick={() => onToggle(patternId, pitch, step)}
      className={`shrink-0 rounded-sm transition-all duration-75 border
        ${isActive
          ? isCurrentStep
            ? 'bg-accent border-accent shadow-[0_0_8px_hsl(var(--accent)/0.5)]'
            : 'bg-daw-clip-synth border-daw-clip-synth shadow-[0_0_8px_hsl(var(--daw-clip-synth)/0.4)]'
          : isCurrentStep
            ? 'bg-daw-step-hover border-daw-grid-line-strong'
            : isBeatStart
              ? 'bg-muted border-daw-grid-line-strong hover:bg-daw-step-hover'
              : 'bg-card border-border hover:bg-daw-step-hover'
        }`}
      style={{ width: CELL_W, height: CELL_H }}
    />
  );
});
