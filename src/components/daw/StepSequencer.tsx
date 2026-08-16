import { memo, useState, useCallback } from 'react';
import { useDAW, getActivePatternId } from '@/stores/daw-store-context';
import { DRUM_SOUNDS, DRUM_LABELS, DrumPattern, DrumSound } from '@/lib/types';

export function StepSequencer() {
  const { state, dispatch, previewSound } = useDAW();

  // Derive pattern and clip from the selected track
  const activePatternId = getActivePatternId(state);
  const pattern = activePatternId
    ? state.drumPatterns.find(p => p.id === activePatternId)
    : null;

  // Find the active clip to get its startBeat for step highlighting
  const selectedTrack = state.tracks.find(t => t.id === state.selectedTrackId);
  const activeClip = selectedTrack?.clips.find(c =>
    state.selectedClipId ? c.id === state.selectedClipId : c.patternId === activePatternId
  );

  const toggleStep = useCallback(
    (patternId: string, sound: DrumSound, step: number) => {
      dispatch({ type: 'TOGGLE_DRUM_STEP', patternId, sound, step });
    },
    [dispatch],
  );

  const renamePattern = useCallback(
    (patternId: string, name: string) => {
      dispatch({ type: 'RENAME_PATTERN', patternId, name });
    },
    [dispatch],
  );

  if (!pattern) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-mono">
        Select a track with a drum clip to edit its pattern
      </div>
    );
  }

  const clipStartStep = (activeClip?.startBeat ?? 0) * 4;
  const clipEndStep = clipStartStep + (activeClip?.durationBeats ?? pattern.steps / 4) * 4;

  return (
    <div className="flex flex-col gap-1 p-3 select-none">
      {/* Step numbers */}
      <div className="flex">
        <div className="w-20 shrink-0" />
        <div className="flex gap-0.5">
          {Array.from({ length: pattern.steps }, (_, i) => (
            <div
              key={i}
              className={`w-7 h-4 flex items-center justify-center text-[9px] font-mono
                ${i % 4 === 0 ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}
            >
              {i % 4 === 0 ? i / 4 + 1 : '·'}
            </div>
          ))}
        </div>
      </div>

      {/* Sound rows */}
      {DRUM_SOUNDS.map((sound) => (
        <div key={sound} className="flex items-center">
          <button
            onClick={() => previewSound(sound)}
            className="w-20 shrink-0 text-xs text-secondary-foreground font-mono truncate text-left px-1 py-0.5 rounded hover:bg-muted transition-colors"
          >
            {DRUM_LABELS[sound]}
          </button>
          <div className="flex gap-0.5">
            {Array.from({ length: pattern.steps }, (_, step) => (
              <StepCell
                key={step}
                step={step}
                sound={sound}
                isActive={pattern.grid[sound][step]}
                isCurrentStep={
                  state.isPlaying
                  && state.currentStep >= clipStartStep
                  && state.currentStep < clipEndStep
                  && (state.currentStep - clipStartStep) % pattern.steps === step
                }
                onToggle={toggleStep}
                patternId={pattern.id}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Pattern controls */}
      <div className="flex items-center gap-3 mt-2">
        <PatternNameControl
          pattern={pattern}
          onRename={renamePattern}
        />
        <div className="flex gap-1">
          {[16, 32].map(steps => (
            <button
              key={steps}
              onClick={() => dispatch({ type: 'SET_PATTERN_STEPS', patternId: pattern.id, steps })}
              className={`px-2 py-0.5 text-xs font-mono rounded transition-colors
                ${pattern.steps === steps ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
            >
              {steps}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Memoized step cell (only re-renders when its own props change) ──
const StepCell = memo(function StepCell({
  step, sound, isActive, isCurrentStep, onToggle, patternId,
}: {
  step: number;
  sound: DrumSound;
  isActive: boolean;
  isCurrentStep: boolean;
  onToggle: (patternId: string, sound: DrumSound, step: number) => void;
  patternId: string;
}) {
  const isBeatStart = step % 4 === 0;
  return (
    <button
      aria-label={`${DRUM_LABELS[sound]} step ${step + 1}`}
      onClick={() => onToggle(patternId, sound, step)}
      className={`w-7 h-7 rounded-sm transition-all duration-75 border
        ${isActive
          ? isCurrentStep
            ? 'bg-accent border-accent shadow-[0_0_8px_hsl(var(--accent)/0.5)]'
            : 'bg-daw-step-active border-daw-step-active/60'
          : isCurrentStep
            ? 'bg-daw-step-hover border-daw-grid-line-strong'
            : isBeatStart
              ? 'bg-muted border-daw-grid-line-strong hover:bg-daw-step-hover'
              : 'bg-card border-border hover:bg-daw-step-hover'
        }`}
    />
  );
});

// ─── Inline-editable pattern name in the sequencer ─────────────
function PatternNameControl({
  pattern,
  onRename,
}: {
  pattern: DrumPattern;
  onRename: (patternId: string, name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pattern.name);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== pattern.name) onRename(pattern.id, trimmed);
  };

  if (editing) {
    return (
      <input
        data-testid="pattern-name-input"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(pattern.name); setEditing(false); }
        }}
        className="w-24 h-6 bg-muted text-xs font-mono text-foreground outline-none px-1 rounded border border-primary"
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(pattern.name); setEditing(true); }}
      className="text-xs text-muted-foreground font-mono hover:text-foreground hover:bg-muted px-1 py-0.5 rounded transition-colors cursor-text"
      title="Click to rename pattern"
      aria-label="Rename pattern"
    >
      {pattern.name}
    </button>
  );
}
