# trifid-plugin-i18n

A Trifid plugin to add i18n support to Trifid.

## Usage

Install this Trifid plugin using:

```sh
npm install trifid-plugin-i18n
```

The plugin needs to be added to the Trifid config under the `middlewares` property.
It should be loaded before the `locals` middleware and the template engine.
In the following example order 5 is used which works for the default config where the `locals` middleware uses a higher order value.
The config for the [i18n](https://www.npmjs.com/package/i18n) package can be set using the `config` property.
The `directory` configuration field is required, and should point to the directory where you i18n JSON files are stored.
See the [i18n list of configuration options](https://www.npmjs.com/package/i18n#list-of-all-configuration-options) for more details.
Some default values are defined in the `index.js` file.

Example of configuration:

```yaml
middlewares:
  # […] your other middlewares
  i18n:
    module: "trifid-plugin-i18n"
    order: 5
    config:
      directory: file:locales
      locales:
        - en
        - de
      # …other configuration fields
```
