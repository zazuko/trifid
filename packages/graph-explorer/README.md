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
- `hidePanels` : Do not show resource and connection panels
- `hideScrollBars` : Avoid scrollbars
- `hideHalo` : Prevent selecting and navigating from  nodes
- `hideNavigator` : Hide the map navigator
- `collapseNavigator` : Collapse the map navigator
- `leftPanelInitiallyOpen` : Resource panel state 
- `rightPanelInitiallyOpen` : Connection panel state
- `serializedDiagram` : Loads a previously saved diagram (see onSaveDiagram below)

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

In the template the following properties can be set to handlers reacting on user events:

- `onSaveDiagram` : When user clicks on 'Save diagram'. To obtain a serialized version of the 
  diagram, use `diagram.getModel().exportLayout()`
- `onPointerDown`, `onPointerMove`, `onPointerUp` : Mouse events on the workspace