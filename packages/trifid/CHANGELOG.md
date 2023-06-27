# trifid

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
