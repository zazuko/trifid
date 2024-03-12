// @ts-check

/**
 * @module trifid-core/types/index.js
 */

/**
 * Trifid Plugin Configuration.
 *
 * @typedef {Object} TrifidPluginConfig
 * @property {number} [order] The order of the plugin (for loading them).
 * @property {string} [module] The NPM module of the plugin.
 * @property {string | string[]} [paths] The paths to apply the plugin to.
 * @property {string | string[]} [methods] The HTTP methods to apply the plugin to.
 * @property {string | string[]} [hosts] The hosts to apply the plugin to.
 * @property {Object.<string, any>} [config] The plugin configuration.
 */

/**
 * Trifid configuration.
 *
 * @typedef {Object} TrifidConfig
 * @property {Object} [server] Fastify server.
 * @property {Object} [server.listener] Fastify server listener.
 * @property {string} [server.listener.host] The host to listen on.
 * @property {number|string} [server.listener.port] The port to listen on.
 * @property {"fatal"|"error"|"warn"|"info"|"debug"|"trace"|"silent"} [server.logLevel] The log level.
 * @property {Object.<string, any>} [server.options] Server options.
 * @property {Object.<string, any>} [globals] Global settings.
 * @property {Object.<string, any>} [template] Template settings.
 * @property {Object.<string, TrifidPluginConfig>} [plugins] Plugins.
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
 * Trifid Plugin Argument.
 *
 * @typedef {Object} TrifidPluginArgument
 * @property {string[]} [paths] The paths to apply the plugin to.
 * @property {string[]} [methods] The HTTP methods to apply the plugin to.
 * @property {string[]} [hosts] The hosts to apply the plugin to.
 * @property {import('pino').Logger} logger The logger instance.
 * @property {import('fastify').FastifyInstance & {locals: Map<string, any>}} server The Fastify server instance.
 * @property {Object.<string, any>} config The Trifid configuration.
 * @property {(request: import('fastify').FastifyRequest & { session: Map<string, any> }, templatePath: string, context: Object.<string, any>, options?: Object.<string, any>) => Promise<string>} render The render function.
 * @property {TrifidQuery} query The SPARQL query function.
 * @property {import('node:events').EventEmitter} trifidEvents The Trifid events emitter.
 * @property {(name: string, fn: import('handlebars').HelperDelegate) => void} registerTemplateHelper Register a template helper, that can be used by the template engine.
 */

/**
 * Trifid Plugin Setup.
 *
 * @typedef {Object} TrifidPluginSetup
 * @property {() => Promise<TrifidPluginConfig>} [defaultConfiguration] Default configurations for this plugin.
 * @property {() => Promise<FastifyRouteHandler>} [routeHandler] Route handler.
 */

/**
 * Trifid Plugin.
 *
 * @typedef {(trifid: TrifidPluginArgument) => Promise<TrifidPluginSetup | void>} TrifidPlugin
 */

/**
 * Trifid Query.
 *
 * @typedef {(query: string, options?: Object.<string, any>) => Promise<any>} TrifidQuery
 */
