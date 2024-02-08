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
 * Express middleware function.
 *
 * @typedef {Function} ExpressStandardMiddleware
 * @param {import("express").Request} req The request object.
 * @param {import("express").Response} res The response object.
 * @param {import("express").NextFunction} next A callback to trigger the next middleware in the stack.
 * @returns {void | Promise<void>}
 */

/**
 * Express error-handling middleware function.
 *
 * @typedef {Function} ExpressErrorHandlingMiddleware
 * @param {any} err The error object.
 * @param {import("express").Request} req The request object.
 * @param {import("express").Response} res The response object.
 * @param {import("express").NextFunction} next A callback to trigger the next middleware in the stack.
 * @returns {void | Promise<void>}
 */

/**
 * Express middleware.
 *
 * @typedef {ExpressStandardMiddleware | ExpressErrorHandlingMiddleware} ExpressMiddleware
 */

/**
 * Trifid Middleware Argument.
 *
 * @typedef {Object} TrifidMiddlewareArgument
 * @property {import("pino").Logger} logger The logger instance.
 * @property {import("express").Express} server The Express server.
 * @property {Object.<string, any>} config The Trifid configuration.
 * @property {(templatePath: string, context: Object.<string, any>, options: Object.<string, any>) => Promise<string>} render The render function.
 * @property {TrifidQuery} query The SPARQL query function.
 * @property {import('node:events').EventEmitter} trifidEvents The Trifid events emitter.
 */

/**
 * Trifid Middleware.
 *
 * @typedef {(trifid: TrifidMiddlewareArgument) => Promise<ExpressMiddleware> | ExpressMiddleware} TrifidMiddleware
 */

/**
 * Trifid Query.
 *
 * @typedef {(query: string, options?: Object.<string, any>) => Promise<any>} TrifidQuery
 */
