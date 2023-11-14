# trifid-core

## 2.7.0

### Minor Changes

- a94543c: Improve types in general.

  `trifid.start` now returns a `Promise<import('http').Server>` instead of `void`.
  This allows to wait for the server to be ready before doing anything else.

- 552ecf9: The errors middleware is now returning the description of the status code in the body.

## 2.6.3

### Patch Changes

- cb227a3: Use toString method to convert IRI URL into a string
- 141786b: Upgrade dependencies

## 2.6.2

### Patch Changes

- 735bf99: Import trifid-core into trifid mono-repo.

## 2.6.1

### Patch Changes

- 42a309f: Upgrade yaml to 2.2.2
- 42a309f: Upgrade some dev dependencies
- 42a309f: Upgrade pino to 8.14.1
- 42a309f: Upgrade commander to 10.0.1

## 2.6.0

### Minor Changes

- 6b895c8: Publish lock file and upgrade some dependencies

## 2.5.6

### Patch Changes

- 19979b7: Have more open CORS policy
