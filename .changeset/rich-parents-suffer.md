---
"trifid-core": major
---

Trifid Plugins should return an object:

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
