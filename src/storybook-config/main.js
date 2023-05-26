module.exports = {
  "stories": ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/preset-create-react-app",
    "@storybook/addon-mdx-gfm",
    "storybook-addon-react-router-v6",
    "storybook-addon-jsx"
  ],
  "framework": {
    name: "@storybook/react-webpack5",
    options: {}
  },
  docs: {
    autodocs: false
  }
};