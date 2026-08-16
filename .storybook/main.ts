import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp"
  ],
  framework: "@storybook/react-vite",
  // Deploy Storybook under the app's GitHub Pages subpath so it lives at
  // https://<user>.github.io/groove-composer/storybook/. Local dev keeps "/".
  viteFinal: (viteConfig) => {
    if (process.env.NODE_ENV === "production") {
      viteConfig.base = "/groove-composer/storybook/";
    }
    return viteConfig;
  },
};
export default config;
