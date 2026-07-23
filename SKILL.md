---
name: atomic-resources-components
description: Use this skill when creating or updating UI components in projects that use create-atomic-resources, its generated CSS custom properties, Sass utilities, and preferably atomic-bomb component structure. It guides agents to import the generated resources stylesheet, use the design-token CSS variables and theme recipes instead of hard-coded visual values, use Sass utility mixins, and keep atomic-bomb barrels and component files consistent.
---

# Atomic Resources Components

Use this skill when building UI components in a project that has `create-atomic-resources` installed, especially when components are generated with `atomic-bomb`.

## Core Rule

Use the generated resource system as the source of truth. Prefer CSS custom properties from `src/resources/styles/main.css`, theme recipes from `src/resources/design/tokens.json`, and Sass helpers from `src/resources/styles` over hard-coded colors, spacing, radii, shadows, z-index values, opacity values, font sizes, and form styling.

Do not invent new raw visual values unless the token file clearly lacks the needed concept. When a value is missing and the task requires a new design value, add it to `src/resources/design/tokens.json`, regenerate `src/resources/styles/tokens/_tokens.scss` with the project `json-to-scss` command, update Sass readers/root generation if needed, then rebuild `main.css`.

## Resource Files

Expected generated files:

- `src/resources/design/tokens.json`: editable design-token source.
- `src/resources/styles/tokens/_tokens.scss`: Sass token map generated from `tokens.json`.
- `src/resources/styles/tokens/_config.scss`: Sass accessors for token groups.
- `src/resources/styles/root/_root.scss`: emits CSS custom properties.
- `src/resources/styles/main.scss`: Sass entrypoint.
- `src/resources/styles/main.css`: compiled CSS used by the app or Storybook.
- `src/resources/styles/utility/_flex.scss`: flex utility classes and mixins.
- `src/resources/styles/utility/_theme.scss`: theme recipe mixin and generated theme classes.

If paths differ, inspect the project before editing. Do not assume `src` is always the app root.

## Importing Resources

Make sure the compiled stylesheet is loaded once at the application or Storybook boundary:

```js
import "../src/resources/styles/main.css"
```

For Storybook, this usually belongs in `.storybook/preview.js` or `.storybook/preview.ts`.

For app code, place it in the top-level client entry, app shell, or framework-specific global stylesheet import location.

Do not import `main.css` inside every component.

## atomic-bomb Workflow

When asked to create a component and `atomic-bomb` is available, prefer the CLI over hand-building the folder:

```shell
atomic-bomb --type atom --name Button
atomic-bomb --type molecule --name "Field Group"
atomic-bomb --type organism --name "Login Form"
atomic-bomb --type page --name "Account Settings"
```

For domain-scoped components:

```shell
atomic-bomb --for Orders/Sales --type molecule --name "Order Card"
```

Generated atomic-bomb Sass barrels are expected at:

```text
src/components/atoms/_index.scss
src/components/molecules/_index.scss
src/components/organisms/_index.scss
src/components/templates/_index.scss
src/components/pages/_index.scss
```

`src/resources/styles/main.scss` may contain commented imports for these barrels:

```scss
//@use '../../components/atoms';
//@use '../../components/molecules';
//@use '../../components/organisms';
//@use '../../components/templates';
//@use '../../components/pages';
```

When component styles should be included globally through atomic-bomb barrels, ensure the relevant import is uncommented once. Do not duplicate component imports in unrelated Sass files.

## CSS Variable Catalog

Use variables with `var(...)`.

### Colors

Base color variables use foreground/background prefixes:

```css
color: var(--fg-black);
background-color: var(--bg-white);
background-color: var(--bg-black-muted);
```

Semantic colors:

```css
color: var(--semantic-color-danger);
color: var(--semantic-color-success);
color: var(--semantic-color-warning);
color: var(--semantic-color-info);
```

Use semantic colors for status, validation, alerts, and feedback. Use base foreground/background colors for neutral surfaces and text.

### Theme Recipes

Theme tokens live under `theme` in `src/resources/design/tokens.json`. The top-level group keys and item keys are flexible:

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
        "gap": "small",
        "fontName": "label-text",
        "fontSize": "label",
        "borderRadius": "medium",
        "cursor": "pointer",
        "width": "fit-content"
      }
    },
    "links": {},
    "headings": {}
  }
}
```

All item options are optional. Supported options:

```text
backgroundColor
hoverColor
foregroundColor
textColor
iconColor
paddingHorizontal
paddingVertical
gap
fontName
fontSize
borderRadius
cursor
width
```

Color options should reference names from `colors`. `hoverColor` can reference a color token or a generated shade token such as `bright-green-100-dark-20`; when omitted and `backgroundColor` has a configured `20` shade, the theme utility uses that shade's CSS variable. Otherwise it falls back to a computed 20% darker hover background. Spacing options should reference names from `spacing`. `fontName` accepts a name from `fonts`, or a direct CSS font-family value. `fontSize` accepts a generic or semantic name from `fontSizes`, or a direct CSS font-size value. `borderRadius` accepts a name from `borderRadius`, or a direct CSS radius. `cursor` accepts any CSS cursor value.

Generated CSS classes follow this pattern:

```css
.theme-{group}-{name}
```

For example, `theme.buttons.primary` generates `.theme-buttons-primary`.

### Typography

Font family variables:

```css
font-family: var(--main-text-regular), sans-serif;
font-family: var(--main-text-bold), sans-serif;
font-family: var(--main-text-link), sans-serif;
font-family: var(--label-text), sans-serif;
```

Font-size tokens in this resource system are stored as `rem` values. Existing generated utility classes may keep pixel-like suffixes for compatibility, such as `.main-text-regular-12`, while emitting `font-size: 0.75rem`.

Generic and semantic font-size tokens live under `fontSizes`:

```json
{
  "fontSizes": {
    "generic": { "small": "0.875rem", "medium": "1rem", "large": "1.25rem" },
    "semantic": { "caption": "small", "label": "small", "body": "medium", "title": "large" }
  }
}
```

They generate custom properties such as `--font-size-small` and `--font-size-body`. Semantic values reference the generic scale.

Avoid hard-coded font sizes in new component CSS. Prefer existing heading styles, utility classes, or add/consume a token.

### Spacing

Use spacing variables for gaps, margins, padding, and layout rhythm:

```css
gap: var(--spacing-small);
padding: var(--spacing-medium);
margin-block-end: var(--spacing-large);
```

Known variables:

```css
--spacing-small
--spacing-medium
--spacing-large
```

### Border Radius

Use radius variables for components, inputs, buttons, panels, and cards:

```css
border-radius: var(--border-radius-small);
border-radius: var(--border-radius-medium);
border-radius: var(--border-radius-large);
```

### Box Shadow

Use shadow variables for elevation:

```css
box-shadow: var(--box-shadow-light);
box-shadow: var(--box-shadow-medium);
box-shadow: var(--box-shadow-heavy);
```

Use shadows sparingly. Prefer `light` for controls and cards, `medium` for raised surfaces, and `heavy` for overlays only when appropriate.

### Z-Index

Use z-index variables for layering:

```css
z-index: var(--z-index-dropdown);
z-index: var(--z-index-sticky);
z-index: var(--z-index-modal);
z-index: var(--z-index-toast);
```

Known variables:

```css
--z-index-base
--z-index-dropdown
--z-index-sticky
--z-index-modal
--z-index-toast
```

Do not use arbitrary z-index values such as `9999`. Add a named token if a new layer is genuinely needed.

### Opacity

Use opacity variables for states and overlays:

```css
opacity: var(--opacity-disabled);
opacity: var(--opacity-muted);
background-color: rgba(0, 0, 0, var(--opacity-overlay));
```

Known variables:

```css
--opacity-disabled
--opacity-muted
--opacity-overlay
```

### Forms

Use form variables for inputs, selects, textareas, validation, and focus states:

```css
.field {
  height: var(--form-input-height);
  padding: var(--form-input-padding-y) var(--form-input-padding-x);
  border: var(--form-input-border);
  border-radius: var(--form-input-border-radius);
  background: var(--form-input-background-color);
  color: var(--form-input-text-color);
}

.field--underline {
  border: 0;
  border-bottom: var(--form-input-border-bottom);
  border-radius: 0;
}

.field:focus {
  border: var(--form-focus-border);
  outline: var(--form-focus-outline-width) solid var(--form-focus-outline-color);
}

.field--underline:focus {
  border: 0;
  border-bottom: var(--form-focus-border-bottom);
}

.field:disabled {
  border: var(--form-disabled-border);
  background: var(--form-disabled-background-color);
  color: var(--form-disabled-text-color);
  opacity: var(--opacity-disabled);
}

.field[aria-invalid="true"] {
  border: var(--form-error-border);
  color: var(--form-error-text-color);
}
```

Prefer full-border input styling with `--form-input-border`. Use `--form-input-border-bottom` when the design calls for underline-only inputs.

## Sass Utilities

When writing Sass, import utilities with `@use`:

```scss
@use '../../resources/styles/utility' as utility;

.cardHeader {
  @include utility.flex-center-center;
}
```

Available flex position mixins:

```scss
@include utility.flex-top-left;
@include utility.flex-top-center;
@include utility.flex-top-right;
@include utility.flex-center-left;
@include utility.flex-center-center;
@include utility.flex-center-right;
@include utility.flex-bottom-left;
@include utility.flex-bottom-center;
@include utility.flex-bottom-right;
```

Use these mixins instead of repeatedly writing:

```css
display: flex;
align-items: center;
justify-content: center;
```

Use the base button mixin for clickable `div`-based controls that should size to their text:

```scss
@use '../../resources/styles/utility' as utility;

.button {
  @include utility.button;
}
```

The button mixin only emits:

```css
display: inline-flex;
width: fit-content;
cursor: pointer;
```

Add padding, gaps, colors, borders, radius, and theme treatment separately.

Available component helper mixins:

```scss
@include utility.button-reset;
@include utility.button-disabled;
@include utility.button-full-width;
@include utility.button-icon(1.25rem);
@include utility.focus-ring;
@include utility.focus-ring-visible;
@include utility.interactive-transition;
@include utility.stack(small);
@include utility.cluster(medium);
@include utility.icon-size(small);
@include utility.surface;
@include utility.truncate;
@include utility.visually-hidden;
@include utility.form-field;
@include utility.form-field-focus;
@include utility.form-field-disabled;
@include utility.form-field-error;
```

Use `button-reset` for native `<button>` elements, `button-disabled` for disabled clickable controls, `focus-ring-visible` for keyboard focus, `stack` for vertical component layout, `cluster` for wrapping action rows, `truncate` for one-line overflow text, and form-field helpers for input/select/textarea states.

Theme recipes can be applied through the generic theme mixin:

```scss
@use '../../resources/styles/utility' as utility;

.button {
  @include utility.theme(buttons, primary);
  @include utility.button;
}
```

Use the mixin when a component owns its selector. Use generated `.theme-{group}-{name}` classes when markup can consume utility classes directly.

## Component Styling Pattern

For an atomic-bomb generated component, prefer colocated Sass if the template provides it:

```text
src/components/atoms/Button/
├── Button.tsx
├── _Button.style.scss
├── _index.scss
└── index.tsx
```

Example Sass:

```scss
@use '../../../resources/styles/utility' as utility;

.button {
  @include utility.flex-center-center;
  @include utility.theme(buttons, primary);
  @include utility.button;
  min-height: var(--form-input-height);
  border: var(--form-input-border);
  border-radius: var(--border-radius-medium);
  box-shadow: var(--box-shadow-light);
  font-family: var(--main-text-bold), sans-serif;
}

.button:disabled {
  opacity: var(--opacity-disabled);
}
```

Adjust relative `@use` paths based on the actual component depth. Verify path correctness instead of guessing.

## Editing Tokens

When adding or changing design-token values:

1. Edit `src/resources/design/tokens.json`.
2. Regenerate `src/resources/styles/tokens/_tokens.scss` with the project token command:

```shell
npm run token
```

If package scripts are not available, run the same `json-to-scss` command directly:

```shell
npx json-to-scss ./src/resources/design/tokens.json ./src/resources/styles/tokens/_tokens.scss
```

3. Expose new token groups in `src/resources/styles/tokens/_config.scss` when adding a new top-level group.
4. Emit root variables in `src/resources/styles/root/_root.scss` when the token should become a CSS custom property.
5. Rebuild CSS:

```shell
npm run scss
```

If package scripts are not available, run Sass directly:

```shell
npx sass --quiet --no-source-map src/resources/styles/main.scss src/resources/styles/main.css
```

6. Remove ignored source-map artifacts if Sass creates them:

```shell
rm -f src/resources/styles/main.css.map
```

7. Run tests:

```shell
npm test
```

## Validation Checklist

Before finishing component work:

- `main.css` is imported once globally.
- Component styles use token variables instead of raw colors, spacing, radii, shadows, opacity, z-index, and form values.
- Theme recipes are used for repeated component variants such as buttons, links, headings, headers, footers, and paragraphs.
- New visual primitives are added to tokens rather than hard-coded locally.
- Sass `@use` paths resolve.
- atomic-bomb component and Sass barrels are intact.
- `npm run token` or `npx json-to-scss ./src/resources/design/tokens.json ./src/resources/styles/tokens/_tokens.scss` has been run when `tokens.json` changed.
- `npx sass --quiet --no-source-map src/resources/styles/main.scss src/resources/styles/main.css` succeeds when Sass files changed.
- `npm test` passes when tests exist.
