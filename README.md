
## Configure
* Clone repo with `degit <repo url>`
* Add to `.storybook/preview.js` 

```javascript
import "../src/resources/styles/main.css"
```
* in `package.json`:
```json
{
  "scripts": {
    "token": "json-to-scss src/resources/design/tokens.json src/resources/styles/tokens/_tokens.scss"
  }
}
```

