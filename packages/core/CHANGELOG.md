# trifid-core

## 4.0.1

### Patch Changes

- 6667f40: The locals plugins should use the cookies path set as `/`.

## 4.0.0

### Major Changes

- e8faa76: The `render` function requires the request as first argument.

## 3.0.0

### Major Changes

- 849fa3d: Health check is now exposed at `/healthz` instead of `/health`
- 4b515f8: Use 'plugins' instead of 'middlewares'
- 849fa3d: Trifid Plugins should return an object:

  ```js
  /** @type {import('trifid-core/types/index.js').TrifidPlugin} */
  const factory = async (trifid) => {
    return {
      defaultConfiguration: async () => {
        return {
          methods: ["GET"],
          paths: ["/hello"],
          // ...
        };
      },
      routeHandler: async () => {
        /**
         * Route handler.
         * @param {import('fastify').FastifyRequest} _request Request.
         * @param {import('fastify').FastifyReply} reply Reply.
         */
        const handler = async (_request, reply) => {
          reply.send("Hello, world!");
        };
        return handler;
      },
    };
  };

  export default factory;
  ```

  The factory should also be a promise.

  Previously, the factory was a function that returned an Express middleware.
  Since the move to Fastify, we are now returning an object with two methods: `defaultConfiguration` and `routeHandler`.
  The `routeHandler` method should return a route handler function.
  The `defaultConfiguration` method should return the default configuration for the plugin.
  This allows the user to use the plugin with the default configuration or to override it.
  This can be useful to simplify the Trifid configuration files.

- d9963cd: Remove the `rewrite` middleware

### Minor Changes

- a454dbb: Expose a `query` function that can be used in all plugins to perform a SPARQL query
- 1dd9ae7: Allow listening on a random port by using port `0`.

### Patch Changes

- 3ab5eb3: Add support for JSON-encoded and URL-encoded bodies by default
- 69d6ad0: Improve included TypeScript types.

## 2.7.1

### Patch Changes

- 371f4f8: Do not display a body in case of errors.
  This is not possible without breaking components that are using hijackresponse for now.

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
