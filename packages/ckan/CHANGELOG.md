# @zazuko/trifid-plugin-ckan

## 4.2.2

### Patch Changes

- 842fad6: The CKAN harvester ignored blank node distributions. All distributions are named nodes now
- f0e3b13: Fix and improve types references

## 4.2.1

### Patch Changes

- 724f2ed: Fix `requestPort` value, to handle `null` cases and simplify the logic

## 4.2.0

### Minor Changes

- 007e201: Upgrade Fastify to v5.

### Patch Changes

- 080f5d8: Harmonize author and keywords fields
- a97a6a0: Use Apache 2.0 license

## 4.1.0

### Minor Changes

- 77fcfd4: Preserve existing objects of `dcat:distribution` (re https://gitlab.ldbar.ch/bafu/visualize/-/issues/560)

## 4.0.3

### Patch Changes

- 1cafa55: Return `reply` in the `routeHandler`, in order to be compatible with the support for compression.

## 4.0.2

### Patch Changes

- 7442b22: Bump `@zazuko/env` from 2.1.1 to 2.2.0

## 4.0.1

### Patch Changes

- ffe692c: Upgrade `@tpluscode/rdf-string` from 1.1.3 to 1.2.1
- 009d545: Upgrade `sparql-http-client` to v3.0.0
- 8345cab: Upgrade `@zazuko/env` to 2.1.0
- 676f284: Fix types

## 4.0.0

### Major Changes

- 4b515f8: Use 'plugins' instead of 'middlewares'
- eedaa53: The plugin is now using the new Trifid factory, which is a breaking change.

### Minor Changes

- 0c53ff7: The SPARQL query that is made to get all datasets is now querying all graphs by default

### Patch Changes

- 69d6ad0: Improve included TypeScript types.

## 3.0.0

### Major Changes

- e6deaec: Output [europa.eu themes](https://publications.europa.eu/resource/authority/data-theme) explicitly mapped using `schema:sameAs`. Themes without a mapping are not included in the output.
- e84b484: Use new output for the `dcat:Distribution/dcterms:format`, linking to [europa.eu controlled vocabulary](https://publications.europa.eu/resource/authority/file-type)

### Minor Changes

- 4417b94: Export `dcterms:relation` from source cube

### Patch Changes

- e06cf6d: Added `foaf:page` - dataset documentation
- f916d8a: Map old and new category identifiers to the new controled vocabulary required by DCAT-AP handbook

## 2.4.3

### Patch Changes

- 5948029: Add type declarations to package
- 0ef3d8f: Correctly serialize `dcat:contactPoint` which have RDF types in addition to `vcard:Individual` or `vcard:Organization`.

## 2.4.2

### Patch Changes

- 900e1d3: Upgrade @zazuko/prefixes to 2.1.1.

## 2.4.1

### Patch Changes

- 9a55769: Remove rdf:datatype for langString

## 2.4.0

### Minor Changes

- a9e92c4: Convert legacy frequency to EU frequency

## 2.3.0

### Minor Changes

- 8bc9dfc: Improve the way frequencies are handled.

### Patch Changes

- 2938434: Use `dcterms` prefix instead of `dct`

## 2.2.1

### Patch Changes

- 239752a: Use rdf:datatype instead of xml:datatype

## 2.2.0

### Minor Changes

- 207db20: Use the `dct` prefix instead of the `dcterms` one

### Patch Changes

- e873b2f: Generated XML documents have a blank line at the end.

  This Trifid plugin will be more robust, as we created a set of tests.

## 2.1.0

### Minor Changes

- 578440c: Use Zazuko libraries, by replacing the use of `rdf-ext` with `@zazuko/env` and `@zazuko/prefixes`.
