import { Music } from 'lucide-react';

/**
 * Placeholder for the upcoming synthesizer. This panel is NOT wired into the
 * app yet — it exists so Storybook can show how a future SynthPanel would slot
 * into the composable InstrumentSidebar. When the synth is implemented, replace
 * this body with the real controls and add the panel to the app's sidebar list.
 */
export function SynthPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground text-xs font-mono">
      <Music className="h-5 w-5" />
      <span>Synthesizer coming soon</span>
    </div>
  );
}
