# trifid

## 4.1.1

### Patch Changes

- 7c1c443: Fix build issue where tags were not created the expected way.

## 4.1.0

### Minor Changes

- 83487f9: The Docker image now uses node 20 as base

## 4.0.3

### Patch Changes

- Updated dependencies [7940ded]
- Updated dependencies [8b9d0dd]
  - trifid-plugin-spex@1.1.4
  - @zazuko/trifid-entity-renderer@0.6.0

## 4.0.2

### Patch Changes

- Updated dependencies [cb227a3]
- Updated dependencies [9e2019c]
- Updated dependencies [3a13457]
- Updated dependencies [1937f67]
- Updated dependencies [141786b]
  - trifid-core@2.6.3
  - @zazuko/trifid-entity-renderer@0.5.0
  - @zazuko/trifid-plugin-sparql-proxy@1.1.1

## 4.0.1

### Patch Changes

- 8d1f155: Fix build of Docker image
- Updated dependencies [db20277]
  - trifid-plugin-yasgui@2.2.4

## 4.0.0

### Major Changes

- bb80ca9: Use `@zazuko/trifid-entity-renderer` instead of `@zazuko/trifid-renderer-entity`

  You will need to do the change in your configuration file:

  ```diff
   middlewares:
     # …

     entity-renderer:
  -    module: "@zazuko/trifid-renderer-entity"
  +    module: "@zazuko/trifid-entity-renderer"
  ```

### Patch Changes

- Updated dependencies [4a4e624]
- Updated dependencies [ed223f3]
- Updated dependencies [56144fd]
  - @zazuko/trifid-entity-renderer@0.4.18

## 3.0.0

### Patch Changes

- fc317a9: Upgrade commander and some other dependencies.
- Updated dependencies [735bf99]
  - trifid-core@2.6.2
