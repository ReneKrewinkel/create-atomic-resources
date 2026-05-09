# create-atomic-resources

Creates a reusable SCSS resources setup for projects that use atomic design, Storybook, and optionally [atomic-bomb](https://github.com/ReneKrewinkel/atomic-bomb).

> **Important** This tool is for educational purposes only.

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

This creates or updates:

```text
src/
└── resources/
    ├── design/
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
        ├── main.css
        └── main.scss
```

## What It Does

The installer:

- copies the bundled `resources` directory into the destination directory
- installs `json-to-scss`, `sass`, and `prettier` as dev dependencies
- detects `pnpm-lock.yaml`, `yarn.lock`, or `package-lock.json` to choose the package manager
- defaults to `npm` when no lockfile exists
- retries npm installs with `--legacy-peer-deps` when npm reports an `ERESOLVE` peer dependency conflict
- adds resource scripts to the project `package.json`

The generated scripts are:

```json
{
  "token": "json-to-scss ./src/resources/design/tokens.json ./src/resources/styles/tokens/_tokens.scss",
  "scss": "sass --quiet ./src/resources/styles/main.scss ./src/resources/styles/main.css",
  "nice": "prettier -w ./src/**"
}
```

## Requirements

- Node.js
- npm, pnpm, or Yarn
- a `package.json` in the directory where the command is run

The command should be run from the application root, not from inside the destination folder.

## Storybook

Import the generated stylesheet in `.storybook/preview.js`:

```javascript
import "../src/resources/styles/main.css"
```

If you install into a different destination directory, adjust the import path to match that directory.

## Design Tokens

The generated tokens live in:

```text
src/resources/design/tokens.json
```

After changing `tokens.json`, rebuild the SCSS token file:

```shell
npm run token
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
