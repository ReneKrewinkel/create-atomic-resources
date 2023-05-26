import { Title, Subtitle, Description, Primary, Controls, Stories } from '@storybook/blocks';

import '../src/resources/styles/main.css'
//import './story-styles.css'
export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  docs: {
    page: () => (
      <>
        <Title/>
        <Subtitle/>
        <Description/>
        <Primary/>
        <Controls/>
        <Stories/>
      </>
    ),
  }
}