import { useDAW } from '@/stores/daw-store';
import { generateId, Track as TrackType } from '@/lib/types';
import { Plus, Volume2, VolumeX, Headphones, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export function Timeline() {
  const { state, dispatch } = useDAW();
  const beatsToShow = 32;
  const beatWidth = 60;

  const addTrack = () => {
    const track: TrackType = {
      id: generateId(),
      name: `Track ${state.tracks.length + 1}`,
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      clips: [],
    };
    dispatch({ type: 'ADD_TRACK', track });
  };

  // Performance warning
  const showWarning = state.tracks.length >= 16;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {showWarning && (
        <div className="px-3 py-1.5 bg-daw-meter-yellow/10 border-b border-daw-meter-yellow/30 text-xs text-daw-meter-yellow font-mono">
          ⚠ {state.tracks.length} tracks — consider merging tracks if you notice performance issues
        </div>
      )}

      {/* Timeline header */}
      <div className="flex border-b border-border shrink-0">
        <div className="w-52 shrink-0 px-3 py-1.5 flex items-center justify-between border-r border-border">
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Tracks</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addTrack}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        {/* Beat markers */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex" style={{ width: beatsToShow * beatWidth }}>
            {Array.from({ length: beatsToShow }, (_, i) => (
              <div
                key={i}
                className={`text-[10px] font-mono py-1.5 border-r
                  ${i % 4 === 0
                    ? 'text-muted-foreground border-daw-grid-line-strong'
                    : 'text-muted-foreground/30 border-daw-grid-line'
                  }`}
                style={{ width: beatWidth }}
              >
                <span className="pl-1">{Math.floor(i / 4) + 1}.{(i % 4) + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Track lanes */}
      <div className="flex-1 overflow-y-auto">
        {state.tracks.map(track => (
          <TrackLane key={track.id} track={track} beatsToShow={beatsToShow} beatWidth={beatWidth} />
        ))}

        {state.tracks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm font-mono">
            Click + to add a track
          </div>
        )}
      </div>
    </div>
  );
}

function TrackLane({ track, beatsToShow, beatWidth }: { track: TrackType; beatsToShow: number; beatWidth: number }) {
  const { state, dispatch } = useDAW();

  const clipColorClass = (type: string) => {
    switch (type) {
      case 'drum': return 'bg-daw-clip-drum/80 border-daw-clip-drum';
      case 'synth': return 'bg-daw-clip-synth/80 border-daw-clip-synth';
      case 'sample': return 'bg-daw-clip-sample/80 border-daw-clip-sample';
      default: return 'bg-muted border-border';
    }
  };

  return (
    <div className="flex border-b border-border group">
      {/* Track controls */}
      <div className="w-52 shrink-0 px-2 py-1.5 flex flex-col gap-1 border-r border-border bg-card">
        <div className="flex items-center gap-1">
          <input
            value={track.name}
            onChange={(e) => dispatch({ type: 'RENAME_TRACK', trackId: track.id, name: e.target.value })}
            className="flex-1 bg-transparent text-xs font-mono text-foreground outline-none px-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive"
            onClick={() => dispatch({ type: 'REMOVE_TRACK', trackId: track.id })}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_TRACK_MUTE', trackId: track.id })}
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors
              ${track.muted ? 'bg-destructive/20 text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
          >
            M
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_TRACK_SOLO', trackId: track.id })}
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors
              ${track.solo ? 'bg-daw-meter-yellow/20 text-daw-meter-yellow' : 'text-muted-foreground hover:text-foreground'}`}
          >
            S
          </button>
          <Slider
            value={[track.volume * 100]}
            onValueChange={([v]) => dispatch({ type: 'SET_TRACK_VOLUME', trackId: track.id, volume: v / 100 })}
            max={100}
            step={1}
            className="flex-1 mx-1"
          />
          <span className="text-[9px] font-mono text-muted-foreground w-6 text-right">
            {Math.round(track.volume * 100)}
          </span>
        </div>
      </div>

      {/* Clip area */}
      <div className="flex-1 relative overflow-x-auto" style={{ minHeight: 52 }}>
        <div className="relative h-full" style={{ width: beatsToShow * beatWidth }}>
          {/* Grid lines */}
          {Array.from({ length: beatsToShow }, (_, i) => (
            <div
              key={i}
              className={`absolute top-0 bottom-0 border-r ${i % 4 === 0 ? 'border-daw-grid-line-strong' : 'border-daw-grid-line'}`}
              style={{ left: i * beatWidth }}
            />
          ))}

          {/* Playhead */}
          {state.isPlaying && state.currentStep >= 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-daw-playhead z-10 transition-[left] duration-75"
              style={{ left: (state.currentStep / 4) * beatWidth }}
            />
          )}

          {/* Clips */}
          {track.clips.map(clip => (
            <div
              key={clip.id}
              className={`absolute top-1 bottom-1 rounded-sm border ${clipColorClass(clip.type)}
                flex items-center px-1.5 text-[10px] font-mono text-white/90 cursor-pointer
                hover:brightness-110 transition-all`}
              style={{
                left: clip.startBeat * beatWidth,
                width: clip.durationBeats * beatWidth - 2,
              }}
            >
              {clip.type === 'drum' ? '🥁' : clip.type === 'synth' ? '🎹' : '🎵'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
