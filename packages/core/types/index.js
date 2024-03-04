// @ts-check

/**
 * @module trifid-core/types/index.js
 */

/**
 * Trifid Middleware Configuration.
 *
 * @typedef {Object} TrifidMiddlewareConfig
 * @property {number} [order] The order of the middleware (for loading them).
 * @property {string} [module] The NPM module of the middleware.
 * @property {string | string[]} [paths] The paths to apply the middleware to.
 * @property {string | string[]} [methods] The HTTP methods to apply the middleware to.
 * @property {string | string[]} [hosts] The hosts to apply the middleware to.
 * @property {Object.<string, any>} [config] The middleware configuration.
 */

/**
 * Trifid configuration.
 *
 * @typedef {Object} TrifidConfig
 * @property {Object} [server] Express server.
 * @property {Object} [server.listener] Express server listener.
 * @property {string} [server.listener.host] The host to listen on.
 * @property {number|string} [server.listener.port] The port to listen on.
 * @property {"fatal"|"error"|"warn"|"info"|"debug"|"trace"|"silent"} [server.logLevel] The log level.
 * @property {Object.<string, any>} [server.express] Express settings.
 * @property {Object.<string, any>} [globals] Global settings.
 * @property {Object.<string, any>} [template] Template settings.
 * @property {Object.<string, TrifidMiddlewareConfig>} [middlewares] Middlewares.
 */

/**
 * Object that have an optional `extends` field.
 *
 * @typedef {Object} ObjectWithExtends
 * @property {string[]} [extends] The configuration to extend.
 */

/**
 * Trifid configuration with `extends` field.
 *
 * @typedef {TrifidConfig & ObjectWithExtends} TrifidConfigWithExtends
 */

/**
 * Fastify route handler.
 *
 * @typedef {Function} FastifyRouteHandler
 * @param {import('fastify').FastifyRequest} request Request.
 * @param {import('fastify').FastifyReply} reply Reply.
 * @returns {void | Promise<void>}
 */

/**
 * Trifid Middleware Argument.
 *
 * @typedef {Object} TrifidMiddlewareArgument
 * @property {string[]} [paths] The paths to apply the middleware to.
 * @property {string[]} [methods] The HTTP methods to apply the middleware to.
 * @property {string[]} [hosts] The hosts to apply the middleware to.
 * @property {import('pino').Logger} logger The logger instance.
 * @property {import('fastify').FastifyInstance & {locals: Map<string, any>}} server The Fastify server instance.
 * @property {Object.<string, any>} config The Trifid configuration.
 * @property {(templatePath: string, context: Object.<string, any>, options?: Object.<string, any>) => Promise<string>} render The render function.
 * @property {TrifidQuery} query The SPARQL query function.
 * @property {import('node:events').EventEmitter} trifidEvents The Trifid events emitter.
 * @property {(name: string, fn: import('handlebars').HelperDelegate) => void} registerTemplateHelper Register a template helper, that can be used by the template engine.
 */

/**
 * Trifid Middleware Setup.
 *
 * @typedef {Object} TrifidMiddlewareSetup
 * @property {() => Promise<TrifidMiddlewareConfig>} [defaultConfiguration] Default configurations for this plugin.
 * @property {() => Promise<FastifyRouteHandler>} [routeHandler] Route handler.
 */

/**
 * Trifid Middleware.
 *
 * @typedef {(trifid: TrifidMiddlewareArgument) => Promise<TrifidMiddlewareSetup | void>} TrifidMiddleware
 */

/**
 * Trifid Query.
 *
 * @typedef {(query: string, options?: Object.<string, any>) => Promise<any>} TrifidQuery
 */
