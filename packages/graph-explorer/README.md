# trifid-plugin-graph-explorer

[Graph Explorer](https://github.com/zazuko/graph-explorer) for [Trifid](https://github.com/zazuko/trifid).
This plugin does the static file hosting for all Graph Explorer files and renders an index page that points to the given endpoint URL.

## Quick start

Install this Trifid plugin using:

```sh
npm install trifid-plugin-graph-explorer
```

And then add in the `config.yaml` file the following part:

```yaml
plugins:
  # […] your other plugins
  yasgui:
    module: trifid-plugin-graph-explorer
    paths: # by default
      - /graph-explorer
      - /graph-explorer/
    config:
      endpointUrl: https://example.com/query
      # …other configuration fields
```

## Configuration

The following options are supported:

- `endpointUrl`: URL to the SPARQL endpoint which will be used in the YASGUI interface
- `template`: Path to an alternative template (default: `views/graph-explorer.hbs`)
- `acceptBlankNodes`: Show blank nodes
- `title`: Title of the Graph Explorer page
- `settingsPreset`: SPARQL dialect preset to use (default: `OWLStatsSettings`)

### Settings presets

Graph Explorer ships several presets that tune the SPARQL queries the data
provider issues, so the right one depends on the endpoint software and on how
the data is modelled. The supported values are:

- `OWLStatsSettings` (default): OWL/RDFS with class counts
- `OWLRDFSSettings`: OWL/RDFS without class counts
- `RDFSettings`: plain RDF, without OWL/RDFS specific assumptions
- `DBPediaSettings`: tuned for DBpedia
- `WikidataSettings`: tuned for Wikidata
- `QLeverSettings`: tuned for [QLever](https://github.com/ad-freiburg/qlever) endpoints

Trifid rejects any other value at startup, so a typo surfaces immediately
instead of silently falling back to the default.

```yaml
config:
  endpointUrl: https://example.com/query
  settingsPreset: QLeverSettings
```

Example:

```yaml
config:
  acceptBlankNodes: false
  dataLabelProperty: rdfs:label | <http://schema.org/name>
  schemaLabelProperty: rdfs:label | <http://schema.org/name>
  language: en
  languages:
    - code: en
      label: English
    - code: de
      label: German
    - code: fr
      label: French
    - code: it
      label: Italian
```
