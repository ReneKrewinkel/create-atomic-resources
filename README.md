
## With npx


## Manually
Clone repo with [degit](https://www.npmjs.com/package/degit) 
```shell
degit https://github.com/ReneKrewinkel/design-tokens.git
```

## Setup
1. Add to `.storybook/preview.js`:

```javascript
import "../src/resources/styles/main.css"
```

2. Install [json-to-scss](https://www.npmjs.com/package/json-to-scss):
```shell 
npm i json-to-scss
```

3. add a script to `package.json`: 
```json
{
  "scripts": {
    "token": "json-to-scss src/resources/design/tokens.json src/resources/styles/tokens/_tokens.scss"
  }
}
```

4. Uncomment when using [atomic-bomb](https://github.com/ReneKrewinkel/atomic-bomb) `src/resources/styles/main.scss`: 
```scss
/* Uncomment when using atomic-bomb */
// @import '../../components/atoms';
// @import '../../components/molecules';
// @import '../../components/organisms';
// @import '../../components/templates';
// @import '../../components/pages';
```
