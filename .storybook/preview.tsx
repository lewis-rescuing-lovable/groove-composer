import type { Preview } from '@storybook/react-vite'
import { DAWProvider } from '../src/stores/daw-store'
import '../src/index.css'

// Prevent any Storybook demo from persisting to the browser's real
// localStorage. We replace it with a null (no-op) provider so autosave,
// save/load/reset, and prefs writes are all inert during demos.
const nullStorage: Storage = {
  get length() { return 0; },
  clear() {},
  getItem() { return null; },
  key() { return null; },
  removeItem() {},
  setItem() {},
};
Object.defineProperty(window, 'localStorage', {
  value: nullStorage,
  configurable: true,
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },

  // Wrap every story in the DAW provider so store-backed components (TopBar,
  // Timeline, StepSequencer, SpectrumAnalyzer, sidebar panels) render with real
  // state and are fully interactive in the Storybook canvas.
  decorators: [
    (Story) => (
      <DAWProvider>
        <Story />
      </DAWProvider>
    ),
  ],
};

export default preview;
