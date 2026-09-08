---
"@zazuko/trifid-entity-renderer": minor
---

Make the predicates the label loader looks for configurable through the
`labelLoader.predicates` option.

Labels were only ever looked for under `schema:name`, which does not fit
instances that model them differently. The predicates can now be configured, and
are used both to decide which terms are still missing a label and to fetch them:

```yaml
labelLoader:
  predicates:
    - http://xmlns.com/foaf/0.1/name
    - http://www.w3.org/2004/02/skos/core#prefLabel
    - http://schema.org/name
    - http://www.w3.org/2000/01/rdf-schema#label
```

The default query now selects the labels through a `{{predicates}}` placeholder,
so configuring the predicates is enough and the query does not have to be
replaced as well. Custom queries can use the same placeholder.

The default is `schema:name`, and the default query is equivalent to the
previous one, so instances that do not configure anything keep fetching labels
exactly as before.
