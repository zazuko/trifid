# @zazuko/trifid-plugin-ckan

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
