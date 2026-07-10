
Creates a reusable SCSS resources setup for projects that use atomic design, Storybook, and optionally [atomic-bomb](https://github.com/ReneKrewinkel/atomic-bomb).

<div align="center">
<img src="./promo-atomic-resources.png" style="width: 420px;" alt="Atomic Bomb">

![Rust](https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=flat-square)
![Neovim](https://img.shields.io/badge/Neovim-0.9%2B-57A143?logo=neovim&logoColor=white)




## Usage

Run the package from the root of the project that should receive the resources:

```shell
npx create-atomic-resources ./src
```

The command expects one argument:

```shell
npx create-atomic-resources <destination-dir>
```

Example:

```shell
npx create-atomic-resources ./src
```

For web projects, this creates or updates:

```text
src/
└── resources/
    ├── design/
    │   ├── tokens.example.json
    │   └── tokens.json
    ├── fonts/
    └── styles/
        ├── fonts/
        ├── functions/
        ├── headings/
        ├── page/
        ├── reset/
        ├── root/
        ├── tokens/
        ├── utility/
        ├── vars/
        └── main.scss
```

For Expo or React Native projects, the installer detects `expo` or
`react-native` in `package.json` and creates a native-only resource tree instead:

```text
src/
├── hooks/
│   └── useFont/
└── resources/
    ├── design/
    │   └── tokens.json
    ├── fonts/
    │   └── arial.ttf
    ├── scripts/
    │   └── tokens-to-native.mjs
    └── styles/
        ├── colors.ts
        ├── fonts.ts
        ├── index.ts
        └── main.ts
```

## What It Does

The installer:

- copies the bundled `resources` directory into the destination directory
- installs `json-to-scss`, `sass`, and `prettier` as dev dependencies for web projects
- installs only `prettier` as a dev dependency for Expo or React Native projects
- detects `pnpm-lock.yaml`, `yarn.lock`, or `package-lock.json` to choose the package manager
- defaults to `npm` when no lockfile exists
- retries npm installs with `--legacy-peer-deps` when npm reports an `ERESOLVE` peer dependency conflict
- adds resource scripts to the project `package.json`

The generated web scripts are:

```json
{
  "token": "json-to-scss ./src/resources/design/tokens.json ./src/resources/styles/tokens/_tokens.scss",
  "scss": "sass --quiet ./src/resources/styles/main.scss ./src/resources/styles/main.css",
  "nice": "prettier -w ./src/**"
}
```

The generated Expo or React Native scripts are:

```json
{
  "token:native": "node ./src/resources/scripts/tokens-to-native.mjs",
  "token-to-native": "node ./src/resources/scripts/tokens-to-native.mjs",
  "nice": "prettier -w ./src/**"
}
```

## The Design Token

The design token file is the source of truth for the generated SCSS token map:

```text
src/resources/design/tokens.json
```

The `token` script converts that JSON file into:

```text
src/resources/styles/tokens/_tokens.scss
```

The generated `_tokens.scss` file exports a `$tokens` map. `src/resources/styles/tokens/_config.scss` reads that map and exposes typed SCSS variables such as `$colors`, `$fonts`, `$headings`, `$theme`, `$spacing`, `$border-radius`, `$box-shadow`, `$semantic-colors`, `$z-index`, `$opacity`, and `$forms`.

### Token File Shape

The token file is plain JSON. Keys use the names that the bundled SCSS expects, so keep the top-level names stable unless you also update the SCSS modules that read them.

```json
{
  "unit": "rem",
  "page": {},
  "colors": [],
  "theme": {},
  "fonts": [],
  "headings": {},
  "spacing": {},
  "borderRadius": {},
  "boxShadow": {},
  "semanticColors": {},
  "zIndex": {},
  "opacity": {},
  "forms": {}
}
```

Top-level token groups:

- `unit`: the base unit label used by the design system. The bundled file uses `rem`.
- `page`: page-level defaults. `backgroundColor`, `margin`, and `padding` are used by the root/page styles.
- `colors`: an array of named color entries. Each entry has a `type`, a CSS color value in `color`, and an optional `shades` array.
- `theme`: descriptive component or content styling groups. Group keys and item keys are flexible, and all item options are optional.
- `fonts`: an array of named font entries. Each entry has a `type`, a font file `uri`, and supported `sizes`.
- `headings`: heading font metadata. It contains a shared `type`, a font `uri`, and a `variant` array with `h1` through `h6` size values.
- `spacing`: named spacing scale values.
- `borderRadius`: named radius values. The generated SCSS exposes this group as `$border-radius`.
- `boxShadow`: named CSS shadow values.
- `semanticColors`: named intent colors for UI states such as `success`, `warning`, `danger`, and `info`.
- `zIndex`: named stacking values for layers such as dropdowns, sticky elements, modals, and toasts.
- `opacity`: named opacity values for disabled, muted, and overlay states.
- `forms`: form-control tokens split into `input`, `focus`, `disabled`, and `error` groups.

### Colors

Color tokens are an array so the SCSS can generate utility classes from each entry:

```json
{
  "type": "bright-green-100",
  "color": "rgb(146, 191, 48)",
  "shades": [20, 30]
}
```

For every color entry, `src/resources/styles/tokens/_config.scss` generates:

```text
.bg-{type}
.fg-{type}
```

For example, a color with `"type": "bright-green-100"` creates `.bg-bright-green-100` and `.fg-bright-green-100`.

### Theme

Theme tokens describe reusable visual recipes that reference the color and spacing scales:

```json
{
  "theme": {
    "buttons": {
      "primary": {
        "backgroundColor": "bright-green-100",
        "foregroundColor": "black",
        "iconColor": "black",
        "paddingHorizontal": "medium",
        "paddingVertical": "small",
        "gap": "small"
      }
    },
    "links": {},
    "headings": {}
  }
}
```

Theme group keys and item keys are flexible. The example above generates a `.theme-buttons-primary` class and can also be used as a mixin:

```scss
@use './src/resources/styles/utility' as utility;

.button {
  @include utility.theme(buttons, primary);
}
```

Supported item options are optional:

```text
backgroundColor
hoverColor
foregroundColor
textColor
iconColor
paddingHorizontal
paddingVertical
gap
```

Color options should use names from `colors`. `hoverColor` may also use a generated shade name such as `bright-green-100-dark-20`; when it is omitted and `backgroundColor` is known, the hover background falls back to a 20% darker color. Spacing options should use names from `spacing`.

### Fonts

Font tokens describe available text families and sizes:

```json
{
  "type": "main-text-regular",
  "uri": "'../fonts/freesans'",
  "sizes": ["0.75rem", "0.875rem", "1rem", "1.125rem", "1.25rem"]
}
```

The `uri` points to the generated resources font path from the compiled CSS. Keep the quotes inside the JSON string when the value should be emitted as a Sass string.

### Headings

Heading tokens define the heading font and the size for each heading level:

```json
{
  "type": "heading",
  "uri": "'../fonts/freesansbold'",
  "variant": [
    { "h1": "2.625rem" },
    { "h2": "2rem" },
    { "h3": "1.75rem" },
    { "h4": "1.625rem" },
    { "h5": "1.5rem" },
    { "h6": "1.375rem" }
  ]
}
```

### Forms

Form tokens keep the default, focus, disabled, and error styles together:

```json
{
  "forms": {
    "input": {
      "height": "2.5rem",
      "padding-x": "0.75rem",
      "padding-y": "0.5rem",
      "border": "1px solid #d0d0d0",
      "border-radius": "0.5rem",
      "background-color": "#fff",
      "text-color": "#161616",
      "placeholder-color": "rgba(0, 0, 0, 0.45)"
    },
    "focus": {
      "border": "1px solid #0288d1",
      "outline-color": "rgba(2, 136, 209, 0.32)",
      "outline-width": "0.1875rem"
    },
    "disabled": {},
    "error": {}
  }
}
```

Use the same hyphenated keys that appear in the bundled example when a CSS property name needs to be represented directly.

### Example Token File

A complete example token file is included at:

```text
src/resources/design/tokens.example.json
```

Use it as a reference when changing `tokens.json`, or copy it over `tokens.json` in a generated project before running the token build.

## Requirements

- Node.js
- npm, pnpm, or Yarn
- a `package.json` in the directory where the command is run

The command should be run from the application root, not from inside the destination folder.

## Storybook

Import the generated stylesheet in `.storybook/preview.[js|ts]`:

```javascript
import "../src/resources/styles/main.css"
```

If you install into a different destination directory, adjust the import path to match that directory.

## Design Tokens

The design token file should live in:

```text
src/resources/design/tokens.json
```

After changing `tokens.json`, rebuild the SCSS token file:

```shell
npm run token
```

This runs the `json-to-scss` tooling that converts `tokens.json` into `src/resources/styles/tokens/_tokens.scss`. To run it directly:

```shell
npx json-to-scss ./src/resources/design/tokens.json ./src/resources/styles/tokens/_tokens.scss
```

Then rebuild the compiled stylesheet:

```shell
npm run scss
```

## SCSS

The main SCSS entrypoint is:

```text
src/resources/styles/main.scss
```

The compiled CSS output is:

```text
src/resources/styles/main.css
```

The bundled SCSS uses Dart Sass modules with `@use` and avoids deprecated global Sass APIs.

### Flex Mixins

The utility module exposes flex positioning mixins for common layout alignment:

```scss
@use './src/resources/styles/utility' as utility;

.toolbar {
  @include utility.flex-center-center;
}

.actions {
  @include utility.flex-top-right;
}
```

Available named mixins:

```text
flex-top-left
flex-top-center
flex-top-right
flex-center-left
flex-center-center
flex-center-right
flex-bottom-left
flex-bottom-center
flex-bottom-right
```

### Theme Mixins

The utility module also exposes a generic theme recipe mixin backed by `theme` tokens from `tokens.json`:

```scss
@use './src/resources/styles/utility' as utility;

.button {
  @include utility.theme(buttons, primary);
}
```

Theme classes are generated with the same group and item names:

```text
.theme-{group}-{name}
```

For example:

```text
.theme-buttons-primary
.theme-buttons-secondary
.theme-buttons-tertiary
```

Use the mixin when component Sass owns the selector. Use generated classes when templates can consume utility classes directly.

## With atomic-bomb

When using the generated resources together with `atomic-bomb`, uncomment the component imports in `src/resources/styles/main.scss`:

```scss
/* Uncomment when using atomic-bomb */
//@use '../../components/atoms';
//@use '../../components/molecules';
//@use '../../components/organisms';
//@use '../../components/templates';
//@use '../../components/pages';
```

Those imports point at the Sass barrel files that `atomic-bomb` creates in each component folder:

```text
src/components/atoms/_index.scss
src/components/molecules/_index.scss
src/components/organisms/_index.scss
src/components/templates/_index.scss
src/components/pages/_index.scss
```

When `atomic-bomb` creates a component, it appends that component to the matching `_index.scss` barrel. When a generated component is removed with `atomic-bomb --remove [NAME]`, the matching Sass barrel entry is removed as well, so the resource imports in `main.scss` can stay stable.

## Manual Installation

You can also clone the repository with [degit](https://www.npmjs.com/package/degit):

```shell
degit https://github.com/ReneKrewinkel/create-atomic-resources.git <destination-dir>
```

The `npx` workflow is preferred because it also installs dependencies and updates `package.json` scripts.

## Troubleshooting

### npm peer dependency conflicts

If npm reports an `ERESOLVE` peer dependency conflict while installing the helper packages, the installer retries automatically with:

```shell
npm install --save-dev --legacy-peer-deps json-to-scss sass prettier
```

This is useful in projects with strict or outdated peer dependency ranges.

### No lockfile detected

When no `pnpm-lock.yaml`, `yarn.lock`, or `package-lock.json` is found, the installer uses npm.

### Custom destination directories

The copied resources follow the destination directory you pass to the CLI. The generated package scripts currently target `./src/resources`, so if you install into another directory, update the generated `token`, `scss`, and `nice` scripts in your project `package.json`.

## Development

Check the CLI syntax:

```shell
npm test
```

Format the CLI:

```shell
npm run nice
```

Publish workflow:

```shell
npm run deploy
```

`deploy` runs `predeploy`, which checks the CLI and bumps the package patch version before pushing commits and tags.
