import { useDAW, getActivePatternId } from '@/stores/daw-store';
import { generateId, createEmptyDrumGrid, DRUM_LABELS, DRUM_SOUNDS } from '@/lib/types';
import { Drum, Music, FileAudio, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InstrumentSidebar() {
  const { state, dispatch, previewSound } = useDAW();

  const activePatternId = getActivePatternId(state);

  // Find the selected track's first clip for pattern assignment
  const selectedTrack = state.tracks.find(t => t.id === state.selectedTrackId);
  const selectedClip = selectedTrack?.clips.find(c => c.id === state.selectedClipId) ?? selectedTrack?.clips[0];

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

  const isPatternInUse = (patternId: string) => {
    return state.tracks.some(t => t.clips.some(c => c.patternId === patternId));
  };

  const assignPattern = (patternId: string) => {
    if (!selectedTrack || !selectedClip) return;
    dispatch({
      type: 'ASSIGN_PATTERN_TO_CLIP',
      trackId: selectedTrack.id,
      clipId: selectedClip.id,
      patternId,
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

            {selectedTrack && (
              <div className="text-[10px] font-mono text-muted-foreground mb-1">
                Click a pattern to assign it to <span className="text-primary">{selectedTrack.name}</span>
              </div>
            )}

            {state.drumPatterns.map(p => {
              const isActive = activePatternId === p.id;
              const inUse = isPatternInUse(p.id);
              return (
                <div
                  key={p.id}
                  className={`group flex items-center justify-between w-full text-left px-2 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer
                    ${isActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    }`}
                  onClick={() => assignPattern(p.id)}
                >
                  <div className="truncate">
                    {p.name}
                    <span className="text-muted-foreground ml-1">({p.steps})</span>
                  </div>
                  {!inUse && (
                    <button
                      className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/20 text-destructive transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'REMOVE_PATTERN', patternId: p.id });
                      }}
                      title="Delete unused pattern"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}

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
