# CKAN harvester endpoint

This is a small HTTP endpoint that gathers datasets that are publishable to
opendata.swiss, transforms them to be compatible with the CKAN harvester and
outputs a format (a rigid form of RDF/XML) that the harvester can read.

The format expected by the harvester is described on
https://handbook.opendata.swiss/fr/content/glossar/bibliothek/dcat-ap-ch.html (fr/de).

In order to be considered as a "publishable" dataset by this endpoint, a
dataset must follow the following conditions:

- it **has** the `dcat:Dataset` type
- it **has one and only one** `dcterms:identifier`
- it **has** a `dcterms:creator`
- it **has** `schema:workExample` with value `<https://ld.admin.ch/application/opendataswiss>`
- it **has** `schema:creativeWorkStatus` with value `<https://ld.admin.ch/vocabulary/CreativeWorkStatus/Published>`
- it **does not have** `schema:validThrough`
- it **does not have** `schema:expires`

The endpoint copies the following properties with their original value.
Make sure they follow [the CKAN spec](https://handbook.opendata.swiss/fr/content/glossar/bibliothek/dcat-ap-ch.html).

- `dcterms:title`
- `dcterms:description`
- `dcterms:issued`
- `dcterms:modified`
- `dcat:contactPoint`
- `dcat:theme`
- `dcterms:language`
- `dcat:landingPage`
- `dcterms:spatial`
- `dcterms:coverage`
- `dcterms:temporal`
- `dcterms:keyword` (literals without a language are ignored)

The following properties are populated by the endpoint:

- `dcterms:identifier`

  If the original `dcterms:identifer` already contains an "@", it is copied
  as-is. Otherwise, an identifier is created with the shape
  `<dcterms:identifier value>@<creator slug>`, where "creator slug" is
  the last segment of the URI of the value of `dcterms:creator`.

- `dcterms:publisher`

  The original `dcterms:publisher` value is used as `rdfs:label` of the
  final `dcterms:publisher`.

- `dcterms:relation`

  Populated from `dcterms:license`.

  TODO: define valid values for license

- `dcterms:accrualPeriodicity`

  Supports both DC (http://purl.org/cld/freq/) and EU
  (http://publications.europa.eu/ontology/euvoc#Frequency) frequencies.
  DC frequencies are transformed into EU ones.

- `dcat:distribution`

  Populated from `schema:workExample`.
  Only takes work examples with a `schema:encodingFormat` into account.
  Each distribution is built in the following way, from the properties of the work example:

  - `dcterms:issued` is copied as-is
  - `dcat:mediaType` populated from `schema:encodingFormat`
  - `dcat:accessURL` populated from `schema:url`
  - `dcterms:title` populated from `schema:name`
  - `dcterms:rights` populated from `schema:identifier` of **the dataset's** `dcterms:rights`
  - `dcterms:format` populated from `schema:encodingFormat`, with the following mapping:
    - `text/html` -> `HTML`
    - `application/sparql-query` -> `SERVICE`
    - other -> `UNKNOWN`

## Usage

This should be used as a Trifid plugin.

The following options are supported:

- `endpointUrl`: URL to the SPARQL endpoint
- `user`: User to connect to the SPARQL endpoint
- `password`: Password to connect to the SPARQL endpoint

Configuring Trifid to use `@zazuko/trifid-plugin-ckan` is easy, just add the following in your configuration file:

```yaml
plugins:
  # …other plugins

  ckan:
    module: "@zazuko/trifid-plugin-ckan"
    paths: /ckan
    config:
      endpointUrl: https://some-custom-endpoint/
      # user: root
      # password: super-secret
```

and update the `config` fields with correct informations.

Do not forget to add it to your Node dependencies:

```sh
npm install @zazuko/trifid-plugin-ckan
```

With this configuration, the service will be exposed at `/ckan` and will require the `organization` query parameter, like this: `/ckan?organization=…`.

This will trigger the download of a XML file.
