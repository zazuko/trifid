# trifid-handler-fetch

Handler for Trifid which reads the data from a URL.
[nodeify-fetch](https://www.npmjs.com/package/nodeify-fetch) is used for `http://` and `https://` URLs.
[file-fetch](https://www.npmjs.com/package/file-fetch) is used for `file://` URLs.

## Usage

Add the `trifid-handler-fetch` package to your dependencies:

    npm install trifid-handler-fetch --save

Change the `handler` property in the config like in the example below and adapt the options. 

## Example

This example config uses [The Big Bang Theory dataset](https://www.npmjs.com/package/tbbt-ld/):

```
{
  "baseConfig": "trifid:config.json",
  "handler": {
    "module": "trifid-handler-fetch",
      "options": {
        "url": "https://raw.githubusercontent.com/zazuko/tbbt-ld/master/dist/tbbt.nt",
        "contentType": "application/n-triples",
        "split": "true",
        "cache": "true"
    }
  }
}
```

## Options

- `url`: URL to the resource which contains the dataset
- `contentType`: If set, parse the content with a parser for the given media type
- `resource`: If set, the dataset will be loaded into the given Named Graph
- `split`: If true, the dataset will be split into subgraphs for each Named Node
- `cache`: Reads the resource only once at the first request and caches the dataset for other request
