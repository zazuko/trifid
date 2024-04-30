---
"trifid-plugin-yasgui": minor
---

It is now possible to configure the default SPARQL query to use in each new YASGUI tab, by configuring the `defaultQuery` configuration field.

This feature is useful to provide a starting point for users who are not familiar with SPARQL queries and want to explore the data available in the SPARQL endpoint.

You can define the default query in order to show a specific set of triples, or to show a specific number of triples, or to show a specific set of properties, etc. based on your data model.

It can be also useful to also include common prefixes in the default query, so users can start writing their queries without having to remember the prefixes.
