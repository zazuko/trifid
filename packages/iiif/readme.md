# Trifid plugin iiif

A trifid plugin to provide data about image and audio/visual files.

It provides data using the [schema](https://iiif.io/api/presentation/3/context.json) defined by the [International Image Interoperability Framework](https://iiif.io)


## Example

Mounting the plugin in the path `/iiif`

```json
{
  "ckan": {
    "path": "/iiif",
    "endpointUrl": "http://endpoint/query",
    "user": "optional",
    "password": "optional"
  },
  "plugins": {
    "ckan": {
      "priority": 100,
      "module": "trifid-plugin-iiif"
    }
  }
}
```
