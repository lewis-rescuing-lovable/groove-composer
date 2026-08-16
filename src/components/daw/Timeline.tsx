import { useDAW } from '@/stores/daw-store-context';
import { Track as TrackType, Clip } from '@/lib/types';
import { Plus, Trash2, Copy, Repeat, Repeat1 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useRef, useState, useCallback } from 'react';
import { SampleWaveform } from './SampleWaveform';
import { useHorizontalWindow } from './useHorizontalWindow';

const BEAT_WIDTH = 60;
const SNAP = 0.5; // snap to half-beats
const MIN_BEATS = 32; // minimum timeline length (bars)

function snapBeat(beat: number): number {
  return Math.round(beat / SNAP) * SNAP;
}

/** Derive the timeline length in beats from the furthest clip end. */
function timelineBeats(tracks: TrackType[]): number {
  let maxBeat = MIN_BEATS;
  for (const track of tracks) {
    for (const clip of track.clips) {
      const end = clip.startBeat + clip.durationBeats;
      if (end > maxBeat) maxBeat = end;
    }
  }
  return maxBeat;
}

// ─── Main Timeline ────────────────────────────────────────────
export function Timeline() {
  const { state, dispatch } = useDAW();

  const addTrack = () => dispatch({ type: 'ADD_TRACK_WITH_PATTERN' });
  const showWarning = state.tracks.length >= 16;
  const beats = timelineBeats(state.tracks);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {showWarning && (
        <div className="px-3 py-1.5 bg-daw-meter-yellow/10 border-b border-daw-meter-yellow/30 text-xs text-daw-meter-yellow font-mono">
          ⚠ {state.tracks.length} tracks — consider merging tracks if you notice performance issues
        </div>
      )}

      {/* Body: single vertical scroll; ruler + all lanes share one horizontal scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="overflow-x-auto">
          <div style={{ width: beats * BEAT_WIDTH + 208 }}>
            {/* Ruler row (sticky top, scrolls horizontally with the grid) */}
            <div className="sticky top-0 z-10 flex border-b border-border bg-background">
              <div className="w-52 shrink-0 px-3 py-1.5 flex items-center justify-between border-r border-border">
                <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Tracks</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addTrack}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex-1">
                <div className="flex" style={{ width: beats * BEAT_WIDTH }}>
                  {Array.from({ length: beats }, (_, i) => (
                    <div
                      key={i}
                      className={`text-[10px] font-mono py-1.5 border-r
                        ${i % 4 === 0 ? 'text-muted-foreground border-daw-grid-line-strong' : 'text-muted-foreground/30 border-daw-grid-line'}`}
                      style={{ width: BEAT_WIDTH }}
                    >
                      <span className="pl-1">{Math.floor(i / 4) + 1}.{(i % 4) + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Track lanes */}
            {state.tracks.map(track => (
              <TrackLane key={track.id} track={track} beats={beats} />
            ))}
          </div>
        </div>
        {state.tracks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm font-mono">
            Click + to add a track
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Track Lane (controls sticky-left + grid row, shares horizontal scroll) ──
function TrackLane({ track, beats }: { track: TrackType; beats: number }) {
  const { state, dispatch } = useDAW();
  const isSelected = state.selectedTrackId === track.id;
  const laneRef = useRef<HTMLDivElement>(null);

  // Virtualize the grid lines: only render the visible beat window.
  const { scrollRef, onScroll, totalW, start, end } = useHorizontalWindow(BEAT_WIDTH, beats);
  const visibleBeats = Array.from({ length: end - start }, (_, i) => start + i);

  // Handle drop from another track
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/beatforge-clip');
    if (!data) return;
    const { clipId, fromTrackId, offsetBeats } = JSON.parse(data);

    const rect = laneRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const beat = snapBeat(x / BEAT_WIDTH - offsetBeats);

    dispatch({ type: 'MOVE_CLIP', fromTrackId, toTrackId: track.id, clipId, startBeat: beat });
  }, [dispatch, track.id]);

  return (
    <div
      className={`flex border-b border-border group ${isSelected ? 'ring-1 ring-inset ring-primary/50' : ''}`}
      onClick={() => dispatch({ type: 'SELECT_TRACK', trackId: track.id })}
    >
      {/* Track controls (sticky so they stay put while the grid scrolls) */}
      <div
        className="w-52 shrink-0 px-2 py-1.5 flex flex-col gap-1 border-r border-border sticky left-0 z-[7] bg-card"
        style={{ minHeight: 52 }}
      >
        <div className="flex items-center gap-1">
          <input
            value={track.name}
            onChange={(e) => dispatch({ type: 'RENAME_TRACK', trackId: track.id, name: e.target.value })}
            className="flex-1 bg-transparent text-xs font-mono text-foreground outline-none px-1"
          />
          <Button
            variant="ghost" size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive"
            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_TRACK', trackId: track.id }); }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'TOGGLE_TRACK_MUTE', trackId: track.id }); }}
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors
              ${track.muted ? 'bg-destructive/20 text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
          >M</button>
          <button
            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'TOGGLE_TRACK_SOLO', trackId: track.id }); }}
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors
              ${track.solo ? 'bg-daw-meter-yellow/20 text-daw-meter-yellow' : 'text-muted-foreground hover:text-foreground'}`}
          >S</button>
          <Slider
            value={[track.volume * 100]}
            onValueChange={([v]) => dispatch({ type: 'SET_TRACK_VOLUME', trackId: track.id, volume: v / 100 })}
            max={100} step={1} className="flex-1 mx-1"
          />
          <span className="text-[9px] font-mono text-muted-foreground w-6 text-right">
            {Math.round(track.volume * 100)}
          </span>
        </div>
      </div>

      {/* Clip area (scrolls with the shared grid) */}
      <div
        ref={laneRef}
        className="flex-1 relative cursor-default"
        style={{ minHeight: 52 }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div ref={scrollRef} onScroll={onScroll} className="relative h-full overflow-x-auto" style={{ width: totalW }}>
          {/* Grid lines (windowed) */}
          {visibleBeats.map(i => (
            <div
              key={i}
              className={`absolute top-0 bottom-0 border-r ${i % 4 === 0 ? 'border-daw-grid-line-strong' : 'border-daw-grid-line'}`}
              style={{ left: i * BEAT_WIDTH }}
            />
          ))}

          {/* Playhead */}
          {state.isPlaying && state.currentStep >= 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-daw-playhead z-10 transition-[left] duration-75"
              style={{ left: (state.currentStep / 4) * BEAT_WIDTH }}
            />
          )}

          {/* Clips */}
          {track.clips.map(clip => (
            <ClipBlock key={clip.id} clip={clip} trackId={track.id} laneRef={laneRef} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Clip Block (draggable + resizable) ───────────────────────
function ClipBlock({
  clip, trackId, laneRef,
}: {
  clip: Clip;
  trackId: string;
  laneRef: React.RefObject<HTMLDivElement>;
}) {
  const { state, dispatch } = useDAW();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragPreview, setDragPreview] = useState<number | null>(null);
  const [resizePreview, setResizePreview] = useState<number | null>(null);
  const isSelectedClip = state.selectedClipId === clip.id;

  const clipColor = (() => {
    switch (clip.type) {
      case 'drum': return 'bg-daw-clip-drum/80 border-daw-clip-drum';
      case 'synth': return 'bg-daw-clip-synth/80 border-daw-clip-synth';
      case 'sample': return 'bg-daw-clip-sample/80 border-daw-clip-sample';
      default: return 'bg-muted border-border';
    }
  })();

  // ── Native drag for cross-track moves ──
  const handleDragStart = useCallback((e: React.DragEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetBeats = offsetX / BEAT_WIDTH;

    e.dataTransfer.setData('application/beatforge-clip', JSON.stringify({
      clipId: clip.id,
      fromTrackId: trackId,
      offsetBeats,
    }));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  }, [clip.id, trackId]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ── Mouse drag for same-track horizontal move ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Right side 8px = resize handle
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isRightEdge = e.clientX > rect.right - 8;

    if (isRightEdge) {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      const startX = e.clientX;
      const startDuration = clip.durationBeats;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dBeats = dx / BEAT_WIDTH;
        const newDur = snapBeat(Math.max(0.5, startDuration + dBeats));
        setResizePreview(newDur);
      };

      const onUp = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dBeats = dx / BEAT_WIDTH;
        const newDur = snapBeat(Math.max(0.5, startDuration + dBeats));
        dispatch({ type: 'RESIZE_CLIP', trackId, clipId: clip.id, durationBeats: newDur });
        setIsResizing(false);
        setResizePreview(null);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return;
    }

    // Select clip on click
    dispatch({ type: 'SELECT_CLIP', trackId, clipId: clip.id });
  }, [clip, trackId, dispatch]);

  const displayStart = dragPreview ?? clip.startBeat;
  const displayDuration = resizePreview ?? clip.durationBeats;
  const clipWidth = displayDuration * BEAT_WIDTH - 2;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseDown={handleMouseDown}
      className={`absolute top-1 bottom-1 rounded-sm border ${clipColor}
        flex items-center justify-between px-1.5 text-[10px] font-mono text-white/90
        select-none z-[5] overflow-hidden
        ${isDragging ? 'opacity-40' : 'hover:brightness-110'}
        ${isSelectedClip ? 'ring-1 ring-white/40' : ''}
        ${isResizing ? 'ring-1 ring-primary' : ''}
        transition-shadow`}
      style={{
        left: displayStart * BEAT_WIDTH,
        width: clipWidth,
        cursor: 'grab',
      }}
    >
      {clip.type === 'sample' && clip.sampleId ? (
        <div className="absolute inset-0 flex items-center">
          <SampleWaveform sampleId={clip.sampleId} width={clipWidth} height={28} />
        </div>
      ) : (
        <span className="truncate">
          {clip.type === 'drum' ? '🥁' : clip.type === 'synth' ? '🎹' : '🎵'}
        </span>
      )}

      {/* Loop / one-shot indicator for sample clips */}
      {clip.type === 'sample' && (
        <span className="absolute top-0.5 right-0.5 z-[6] text-white/80" title={clip.loop ? 'Looping' : 'One-shot'}>
          {clip.loop ? <Repeat className="h-3 w-3" /> : <Repeat1 className="h-3 w-3" />}
        </span>
      )}

      {/* Duplicate button */}
      {isSelectedClip && (
        <button
          className="shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors z-[6]"
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: 'DUPLICATE_CLIP', trackId, clipId: clip.id });
          }}
          title="Duplicate clip"
        >
          <Copy className="h-3 w-3" />
        </button>
      )}

      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r-sm z-[6]"
        onMouseDown={(e) => {
          // Prevent drag start on the resize handle
          e.stopPropagation();
          handleMouseDown(e);
        }}
      />
    </div>
  );
}
