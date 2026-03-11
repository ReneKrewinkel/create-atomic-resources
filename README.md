> **IMPORTANT** This tool is for educational purposes only

## With npx
```shell 
# npx create-atomic-resources <destination dir>
npx create-atomic-resources ./src
```

## Manually
Clone repo with [degit](https://www.npmjs.com/package/degit) 
```shell
degit https://github.com/ReneKrewinkel/create-atomic-resources.git <destination dir>
```

## Setup
1. Add to `.storybook/preview.js`:

```javascript
import "../<destination dir>/resources/styles/main.css"
```

## UPDATE version 2.2.1
`json-to-scss` and `sass` are now automatically installed.

## UPDATE version 2.2.1
`token` and `scss` script are now automatically added to `package.json`.

4. Uncomment when using [atomic-bomb](https://github.com/ReneKrewinkel/atomic-bomb) `<destination dir>/resources/styles/main.scss`: 
```scss
/* Uncomment when using atomic-bomb */
// @use '../../components/atoms';
// @use '../../components/molecules';
// @use '../../components/organisms';
// @use '../../components/templates';
// @use '../../components/pages';
```
