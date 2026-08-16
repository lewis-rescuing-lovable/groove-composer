import { DAWProvider } from '@/stores/daw-store';
import { useDAW } from '@/stores/daw-store-context';
import { TopBar } from '@/components/daw/TopBar';
import { InstrumentSidebar } from '@/components/daw/InstrumentSidebar';
import { DrumsPanel, SamplesPanel } from '@/components/daw/panels';
import { Drum, FileAudio } from 'lucide-react';
import { Timeline } from '@/components/daw/Timeline';
import { StepSequencer } from '@/components/daw/StepSequencer';
import { SpectrumAnalyzer } from '@/components/daw/SpectrumAnalyzer';

function BottomPanel() {
  const { state } = useDAW();
  const selectedTrack = state.tracks.find(t => t.id === state.selectedTrackId);

  return (
    <div className="border-t border-border bg-card shrink-0" style={{ height: 280 }}>
      <div className="flex h-full">
        <div className="flex-1 overflow-auto border-r border-border">
          <div className="flex items-center gap-2 px-3 pt-2 pb-1 border-b border-border">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Editor
            </span>
            {selectedTrack && (
              <span className="text-[10px] font-mono text-primary">
                — {selectedTrack.name}
              </span>
            )}
          </div>
          <StepSequencer />
        </div>
        <div className="w-52 p-2">
          <div className="text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">
            Spectrum
          </div>
          <SpectrumAnalyzer />
        </div>
      </div>
    </div>
  );
}

const Index = () => {
  return (
    <DAWProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <InstrumentSidebar
            panels={[
              { key: 'drums', label: 'Drums', icon: Drum, content: DrumsPanel },
              { key: 'samples', label: 'Samples', icon: FileAudio, content: SamplesPanel },
            ]}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Timeline />
            <BottomPanel />
          </div>
        </div>
      </div>
    </DAWProvider>
  );
};

export default Index;
