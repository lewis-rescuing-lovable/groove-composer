import { useDAW } from '@/stores/daw-store';
import { DRUM_SOUNDS, DRUM_LABELS, DrumSound } from '@/lib/types';

export function StepSequencer() {
  const { state, dispatch, previewSound } = useDAW();
  const pattern = state.drumPatterns.find(p => p.id === state.selectedPatternId);

  if (!pattern) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No pattern selected
      </div>
    );
  }

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
            {Array.from({ length: pattern.steps }, (_, step) => {
              const isActive = pattern.grid[sound][step];
              const isCurrentStep = state.currentStep === step && state.isPlaying;
              const isBeatStart = step % 4 === 0;
              return (
                <button
                  key={step}
                  onClick={() =>
                    dispatch({
                      type: 'TOGGLE_DRUM_STEP',
                      patternId: pattern.id,
                      sound,
                      step,
                    })
                  }
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
            })}
          </div>
        </div>
      ))}

      {/* Pattern controls */}
      <div className="flex items-center gap-3 mt-2">
        <span className="text-xs text-muted-foreground font-mono">{pattern.name}</span>
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
