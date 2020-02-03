# trifid-plugin-i18n

A Trifid plugin to add i18n support to Express views.

## Usage

The plugin needs to be added to the Trifid config under the `plugins` property.
It should be loaded before the template engine.
In the following example priority 5 is used which works for the default config where the template engine uses priority 10.
The config for the [i18n](https://www.npmjs.com/package/i18n) package can be set with the property `i18n`. 
See the [i18n list of configuration options](https://www.npmjs.com/package/i18n#list-of-all-configuration-options) for more details.
Some default values are defined in the `index.js` file.  

```json
{
  "i18n": {
    "locales": ["en", "de"]
  },
  "plugins": {
    "i18n": {
      "priority": 5,
      "module": "trifid-plugin-i18n"
    }
  }
}
```
