import type { ComponentType } from 'react';

/**
 * A single tab in the instrument sidebar. The sidebar renders whatever panels
 * it is given — so a panel can be added, removed, or reordered without touching
 * the sidebar itself. When a panel isn't provided, its tab is simply omitted.
 */
export interface SidebarPanel {
  /** Stable key used for the tab button and active-panel state. */
  key: string;
  /** Label shown on the tab button. */
  label: string;
  /** Icon shown on the tab button. */
  icon: ComponentType<{ className?: string }>;
  /** The panel body rendered when this tab is active. */
  content: ComponentType;
}
