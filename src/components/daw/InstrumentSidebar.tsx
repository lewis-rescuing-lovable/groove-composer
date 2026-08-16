import { useState } from 'react';
import type { SidebarPanel } from './panels/types';

/**
 * Composable instrument sidebar. Renders whatever panels it is given as tabs.
 * The active tab is local state, so the sidebar is fully self-contained and can
 * be rendered standalone (e.g. in Storybook) without the DAW store.
 *
 * Panels not provided are simply omitted — no "coming soon" placeholders.
 */
export function InstrumentSidebar({ panels }: { panels: SidebarPanel[] }) {
  const [activeKey, setActiveKey] = useState<string>(panels[0]?.key ?? '');

  const activePanel = panels.find(p => p.key === activeKey) ?? panels[0];
  const ActiveContent = activePanel?.content;

  return (
    <div className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 overflow-y-auto">
      {/* Panel tabs */}
      <div className="flex border-b border-sidebar-border">
        {panels.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveKey(key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-mono transition-colors
              ${activePanel?.key === key
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
        {ActiveContent ? <ActiveContent /> : null}
      </div>
    </div>
  );
}
