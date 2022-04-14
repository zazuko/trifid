# Trifid plugin iiif

A trifid plugin to provide data about image and audio/visual files.

It provides data using the [schema](https://iiif.io/api/presentation/3/context.json) defined by the [International Image Interoperability Framework](https://iiif.io)


## Example

Mounting the plugin

```json
{
  "iiif": {
    "path": "/*",
    "uriPrefix": "https://website",
    "endpointUrl": "https://website/query",
    "user": "optional",
    "password": "optional"
  },
  "plugins": {
    "iiif": {
      "priority": 100,
      "module": "trifid-plugin-iiif"
    }
  }
}
```

Then, 

http://localhost:8080/data/1

Will be resolved to:

https://website/data/1