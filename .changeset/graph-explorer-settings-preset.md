---
"trifid-plugin-graph-explorer": minor
---

Add a `settingsPreset` option to select the SPARQL dialect preset, and update
`graph-explorer` to `^2.1.0`.

Graph Explorer tunes the queries its data provider issues through a settings preset.
That preset was previously hard-coded to `OWLStatsSettings`, so endpoints that need a
different dialect could not be used without overriding the whole template. It is now
configurable:

```yaml
config:
  endpointUrl: https://example.com/query
  settingsPreset: QLeverSettings
```

Supported values are `OWLStatsSettings` (the default, so existing configurations are
unaffected), `OWLRDFSSettings`, `RDFSettings`, `DBPediaSettings`, `WikidataSettings`,
and `QLeverSettings` — the last one added by `graph-explorer` 2.1.0. Any other value is
rejected when Trifid starts, so a typo surfaces immediately instead of silently falling
back to the default.
