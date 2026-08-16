import { useDAW } from '@/stores/daw-store-context';
import { SAMPLE_LIBRARY } from '@/lib/samples';
import { AlertCircle, Play, Plus, Loader2, Repeat, Repeat1 } from 'lucide-react';
import { useState } from 'react';

/**
 * The Samples panel: curated sample library with one-shot/loop choice and
 * add-track. Rendered inside the composable InstrumentSidebar.
 */
export function SamplesPanel() {
  const { previewSample, addSampleTrack } = useDAW();
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const [sampleError, setSampleError] = useState<string | null>(null);
  const [loopChoice, setLoopChoice] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Sample Library</span>
      </div>
      <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
        Fetched at runtime from the OLPC Berklee Sound Library (CC BY 3.0). Each sample gets its own track.
      </p>
      {sampleError && (
        <div className="flex items-start gap-1.5 text-[10px] font-mono text-destructive bg-destructive/10 rounded p-2">
          <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
          <span>{sampleError}</span>
        </div>
      )}
      <div className="space-y-2">
        {SAMPLE_LIBRARY.map(sample => {
          const loop = loopChoice[sample.id] ?? false;
          return (
            <div
              key={sample.id}
              className="rounded border border-border bg-card p-2 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-mono text-secondary-foreground truncate">{sample.name}</span>
                <span className="shrink-0 text-[9px] uppercase tracking-wider text-muted-foreground">{sample.category}</span>
              </div>

              {/* Loop / one-shot toggle */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setLoopChoice(prev => ({ ...prev, [sample.id]: false }))}
                  className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-mono px-1.5 py-1 rounded border transition-colors
                    ${!loop ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:bg-daw-step-hover'}`}
                  title="Play once"
                >
                  <Repeat1 className="h-3 w-3" /> One-shot
                </button>
                <button
                  onClick={() => setLoopChoice(prev => ({ ...prev, [sample.id]: true }))}
                  className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-mono px-1.5 py-1 rounded border transition-colors
                    ${loop ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:bg-daw-step-hover'}`}
                  title="Loop for the clip duration"
                >
                  <Repeat className="h-3 w-3" /> Loop
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={async () => {
                    setSampleError(null);
                    setLoadingSample(sample.id);
                    try {
                      await previewSample(sample.id);
                    } catch (err) {
                      setSampleError(err instanceof Error ? err.message : String(err));
                    } finally {
                      setLoadingSample(null);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1 text-[10px] font-mono px-1.5 py-1 rounded border border-border text-secondary-foreground hover:bg-daw-step-hover transition-colors"
                  title="Preview"
                >
                  {loadingSample === sample.id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Play className="h-3 w-3" />}
                  Preview
                </button>
                <button
                  onClick={() => addSampleTrack(sample.id, sample.name, loop)}
                  className="flex-1 flex items-center justify-center gap-1 text-[10px] font-mono px-1.5 py-1 rounded border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                  title="Add to a new track"
                >
                  <Plus className="h-3 w-3" /> Add track
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
