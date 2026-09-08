---
"@zazuko/trifid-entity-renderer": minor
---

Make the query used by the label loader configurable through the
`labelLoader.labelQuery` option.

The label loader used a hardcoded query fetching labels from `schema:name`,
which does not fit instances that model their labels differently. The query can
now be replaced:

```yaml
labelLoader:
  chunkSize: 30
  labelQuery: |
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    CONSTRUCT {
      ?uri rdfs:label ?label .
    } WHERE {
      GRAPH ?g {
        ?uri rdfs:label ?label
        VALUES ?uri { {{iris}} }
      }
    }
```

The `{{iris}}` placeholder is replaced by the IRIs of the current chunk, as a
space separated list of `<...>` terms.

The default query is unchanged, so instances that do not configure it keep
fetching labels exactly as before.
