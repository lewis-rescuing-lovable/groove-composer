import { Play, Pause, Square, Repeat, Volume2, VolumeX, Save, FolderOpen, RotateCcw, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useDAW } from '@/stores/daw-store-context';
import { toast } from '@/components/ui/sonner';
import { getShareUrl } from '@/lib/share';
import { serializeProject, loadFromStorage } from '@/stores/daw-store-context';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatAutosaveInterval, parseAutosaveInterval } from '@/lib/autosave-time';

export function TopBar() {
  const { state, dispatch, play, stop, pause, saveProject, loadProject, resetProject } = useDAW();
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  const handleLoad = () => {
    if (!loadProject()) {
      // Nothing saved — surface a gentle hint in the console and keep state as-is.
      console.info('[groove-composer] No saved project found to load.');
    }
  };

  const handleLoadClick = () => {
    // Only ask for confirmation when there's actually a saved project to load.
    if (loadFromStorage()) {
      setLoadDialogOpen(true);
    } else {
      handleLoad();
    }
  };

  const handleShare = async () => {
    const url = getShareUrl(serializeProject(state));
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied', { description: 'Anyone with this link can open your project.' });
    } catch {
      // Clipboard unavailable (e.g. insecure context) — fall back to the address bar.
      window.location.href = url;
      toast.success('Share link created', { description: 'The URL now contains your project.' });
    }
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-card border-b border-border h-14 shrink-0">
      {/* Project Name */}
      <Input
        value={state.projectName}
        onChange={(e) => dispatch({ type: 'SET_PROJECT_NAME', name: e.target.value })}
        className="w-40 h-8 bg-muted border-border text-sm font-mono"
      />

      {/* BPM */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">BPM</span>
        <Input
          type="number"
          min={40}
          max={300}
          value={state.bpm}
          onChange={(e) => dispatch({ type: 'SET_BPM', bpm: Math.max(40, Math.min(300, Number(e.target.value))) })}
          className="w-24 h-8 bg-muted border-border text-sm font-mono text-center"
        />
      </div>

      {/* Time Signature */}
      <div className="text-xs text-muted-foreground font-mono">
        {state.timeSignature[0]}/{state.timeSignature[1]}
      </div>

      {/* Transport */}
      <div className="flex items-center gap-1 ml-4">
        {state.isPlaying ? (
          <Button variant="ghost" size="icon" onClick={pause} className="h-8 w-8 text-accent">
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={play} className="h-8 w-8 text-daw-playhead">
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={stop} className="h-8 w-8">
          <Square className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch({ type: 'SET_LOOP', enabled: !state.loopEnabled })}
          className={`h-8 w-8 ${state.loopEnabled ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Repeat className="h-4 w-4" />
        </Button>
      </div>

      {/* Autosave preference (interval left of the checkbox so it never shifts) */}
      <div className="flex items-center gap-2 ml-2">
        <AutosaveIntervalInput />
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <Checkbox
            checked={state.autosaveEnabled}
            onCheckedChange={(checked) => dispatch({ type: 'SET_AUTOSAVE_ENABLED', enabled: checked === true })}
            aria-label="Autosave"
          />
          Auto-save
        </label>
      </div>

      {/* Project persistence */}
      <div className="flex items-center gap-1 ml-2">
        <Button
          variant="ghost" size="icon" onClick={saveProject}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Save project (to browser storage)"
          aria-label="Save project"
        >
          <Save className="h-4 w-4" />
        </Button>
        <AlertDialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost" size="icon" onClick={handleLoadClick}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Load saved project"
              aria-label="Load project"
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Load saved project?</AlertDialogTitle>
              <AlertDialogDescription>
                This replaces the current project with the one saved in browser
                storage. Any unsaved changes will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLoad}>Load</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          variant="ghost" size="icon" onClick={handleShare}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Share project as a link"
          aria-label="Share project"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Reset project to defaults"
              aria-label="Reset project"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset project?</AlertDialogTitle>
              <AlertDialogDescription>
                This resets the loaded project to the defaults. Your saved project in
                browser storage is left untouched.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={resetProject}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Master Volume */}
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch({ type: 'SET_MASTER_MUTED', muted: !state.masterMuted })}
          className={`h-8 w-8 ${state.masterMuted ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
          title={state.masterMuted ? 'Unmute master' : 'Mute master'}
          aria-label={state.masterMuted ? 'Unmute master' : 'Mute master'}
        >
          {state.masterMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Slider
          value={[state.masterVolume * 100]}
          onValueChange={([v]) => dispatch({ type: 'SET_MASTER_VOLUME', volume: v / 100 })}
          max={100}
          step={1}
          className="w-24"
        />
        <span className="text-xs text-muted-foreground font-mono w-8">
          {Math.round(state.masterVolume * 100)}
        </span>
      </div>
    </div>
  );
}

/**
 * Interval input for autosave. Displays plain seconds below 60 and `m:ss` at/above
 * 60. Values above the 60:00 hard maximum are rejected (the field reverts to the
 * last valid value on blur). Disabled when autosave is off.
 */
function AutosaveIntervalInput() {
  const { state, dispatch } = useDAW();
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const parsed = parseAutosaveInterval(draft);
    if (parsed !== null) {
      dispatch({ type: 'SET_AUTOSAVE_INTERVAL', seconds: parsed });
    }
    setDraft(null);
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      disabled={!state.autosaveEnabled}
      value={draft ?? formatAutosaveInterval(state.autosaveIntervalSeconds)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      className="w-20 h-8 bg-muted border-border text-sm font-mono text-center disabled:opacity-50"
      title="Autosave interval (seconds, or m:ss up to 60:00)"
      aria-label="Autosave interval"
    />
  );
}
