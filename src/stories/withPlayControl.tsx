import { PlayControl } from './PlayControl';

/**
 * A Storybook decorator that exposes `play` and `bpm` controls in the Controls
 * panel. Toggling `play` calls the DAW's `play()` / `stop()`; changing `bpm`
 * dispatches `SET_BPM` (the store syncs it to the audio engine). This lets you
 * hear a seeded pattern at the right tempo without hunting for the app's
 * transport.
 *
 * Usage:
 *   export const MyStory: Story = {
 *     args: { play: false, bpm: 90 },
 *     argTypes: { play: { control: 'boolean' }, bpm: { control: { type: 'number', min: 40, max: 300 } } },
 *     decorators: [withPlayControl],
 *   };
 */
export function withPlayControl(Story: () => React.ReactNode, context: { args: { play?: boolean; bpm?: number } }) {
  return (
    <PlayControl play={context.args.play ?? false} bpm={context.args.bpm}>
      {Story()}
    </PlayControl>
  );
}
