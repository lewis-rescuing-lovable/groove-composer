import { useDAW, getActivePatternId } from '@/stores/daw-store';
import { generateId, createEmptyDrumGrid, DRUM_LABELS, DRUM_SOUNDS } from '@/lib/types';
import { Drum, Music, FileAudio, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InstrumentSidebar() {
  const { state, dispatch, previewSound } = useDAW();

  const activePatternId = getActivePatternId(state);

  const addNewPattern = () => {
    const id = generateId();
    dispatch({
      type: 'ADD_PATTERN',
      pattern: {
        id,
        name: `Pattern ${state.drumPatterns.length + 1}`,
        steps: 16,
        grid: createEmptyDrumGrid(16),
      },
    });
  };

  return (
    <div className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 overflow-y-auto">
      {/* Panel tabs */}
      <div className="flex border-b border-sidebar-border">
        {([
          { key: 'drums' as const, icon: Drum, label: 'Drums' },
          { key: 'synth' as const, icon: Music, label: 'Synth' },
          { key: 'samples' as const, icon: FileAudio, label: 'Samples' },
        ]).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => dispatch({ type: 'SET_ACTIVE_PANEL', panel: key })}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-mono transition-colors
              ${state.activePanel === key
                ? 'text-primary border-b-2 border-primary bg-sidebar-accent'
                : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
              }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-3">
        {state.activePanel === 'drums' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Patterns</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addNewPattern}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {state.drumPatterns.map(p => (
              <div
                key={p.id}
                className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono transition-colors
                  ${activePatternId === p.id
                    ? 'bg-primary/20 text-primary'
                    : 'text-sidebar-foreground'
                  }`}
              >
                {p.name}
                <span className="text-muted-foreground ml-1">({p.steps} steps)</span>
              </div>
            ))}

            <div className="mt-4">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Kit Sounds</span>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {DRUM_SOUNDS.map(sound => (
                  <button
                    key={sound}
                    onClick={() => previewSound(sound)}
                    className="px-2 py-1.5 text-xs font-mono bg-card rounded border border-border
                      hover:bg-daw-step-hover hover:border-primary/30 transition-colors text-secondary-foreground"
                  >
                    {DRUM_LABELS[sound]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {state.activePanel === 'synth' && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-xs font-mono">
            Synthesizer coming soon
          </div>
        )}

        {state.activePanel === 'samples' && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-xs font-mono">
            Sample library coming soon
          </div>
        )}
      </div>
    </div>
  );
}
