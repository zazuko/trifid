/**
 * @module trifid-core/types/index.ts
 */

import type { EventEmitter } from 'node:events'

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { Logger } from 'pino'
import type { HelperDelegate } from 'handlebars'

/**
 * A bag of user-provided configuration values.
 *
 * Values come from YAML/JSON config files (after resolver expansion) and are
 * therefore not statically known: consumers must narrow them before use.
 */
export type ConfigRecord = Record<string, unknown>

/**
 * Per-request session store, decorated on the Fastify request by the core.
 */
export type SessionData = Map<string, unknown>

/**
 * A Fastify request that carries the Trifid session.
 */
export type RequestWithSession = FastifyRequest & { session: SessionData }

/**
 * The supported log levels.
 */
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent'

/**
 * The supported log formats.
 */
export type LogFormat = 'pretty' | 'json'

/**
 * Trifid Plugin Configuration.
 */
export interface TrifidPluginConfig {
  /** The order of the plugin (for loading them). */
  order?: number
  /** The NPM module of the plugin. */
  module?: string
  /** The paths to apply the plugin to. */
  paths?: string | string[]
  /** The HTTP methods to apply the plugin to. */
  methods?: string | string[]
  /** The hosts to apply the plugin to. */
  hosts?: string | string[]
  /** The plugin configuration. */
  config?: ConfigRecord
}

/**
 * Trifid server configuration.
 */
export interface TrifidServerConfig {
  /** Fastify server listener. */
  listener?: {
    /** The host to listen on. */
    host?: string
    /** The port to listen on. */
    port?: number | string
  }
  /** The log level. */
  logLevel?: LogLevel
  /** The log format. */
  logFormat?: LogFormat
  /** Server options. */
  options?: ConfigRecord
}

/**
 * Trifid configuration.
 */
export interface TrifidConfig {
  /** Fastify server. */
  server?: TrifidServerConfig
  /** Global settings. */
  globals?: ConfigRecord
  /** Template settings. */
  template?: ConfigRecord
  /** Plugins. */
  plugins?: Record<string, TrifidPluginConfig>
}

/**
 * Object that have an optional `extends` field.
 */
export interface ObjectWithExtends {
  /** The configuration to extend. */
  extends?: string[]
}

/**
 * Trifid configuration with `extends` field.
 */
export type TrifidConfigWithExtends = TrifidConfig & ObjectWithExtends

/**
 * Fastify route handler.
 */
export type FastifyRouteHandler = (
  request: FastifyRequest,
  reply: FastifyReply,
) => void | Promise<void>

/**
 * Render a view to an HTML string.
 */
export type RenderFunction = (
  request: RequestWithSession,
  templatePath: string,
  context: ConfigRecord,
  options?: ConfigRecord,
) => Promise<string>

/**
 * Register a template helper, that can be used by the template engine.
 */
export type RegisterTemplateHelper = (name: string, fn: HelperDelegate) => void

/**
 * A ready-to-use template engine instance.
 */
export interface TemplateEngineInstance {
  /** Render a view to an HTML string. */
  render: RenderFunction
  /** Register a template helper. */
  registerHelper: RegisterTemplateHelper
}

/**
 * The Fastify server instance, decorated with the Trifid locals.
 */
export type TrifidServer = FastifyInstance & { locals: Map<string, unknown> }

/**
 * Trifid Plugin Argument.
 */
export interface TrifidPluginArgument {
  /** The paths to apply the plugin to. */
  paths?: string[]
  /** The HTTP methods to apply the plugin to. */
  methods?: string[]
  /** The hosts to apply the plugin to. */
  hosts?: string[]
  /** The logger instance. */
  logger: Logger
  /** The Fastify server instance. */
  server: TrifidServer
  /** The Trifid configuration. */
  config: ConfigRecord
  /** The render function. */
  render: RenderFunction
  /** The SPARQL query function. */
  query: TrifidQuery
  /** The Trifid events emitter. */
  trifidEvents: EventEmitter
  /** Register a template helper, that can be used by the template engine. */
  registerTemplateHelper: RegisterTemplateHelper
}

/**
 * Trifid Plugin Setup.
 */
export interface TrifidPluginSetup {
  /** Default configurations for this plugin. */
  defaultConfiguration?: () => Promise<TrifidPluginConfig>
  /** Route handler. */
  routeHandler?: () => Promise<FastifyRouteHandler>
}

/**
 * Trifid Plugin.
 */
export type TrifidPlugin = (
  trifid: TrifidPluginArgument,
) => Promise<TrifidPluginSetup | void>

/**
 * Options accepted by a Trifid SPARQL query.
 */
export interface TrifidQueryOptions {
  /** The configured endpoint to query (defaults to `default`). */
  endpoint?: string
  /** Is it an ASK query? */
  ask?: boolean
  /** Is it a SELECT query? */
  select?: boolean
  /** Headers to use in the request. */
  headers?: Record<string, string>
  /** Replace strings in the response. */
  rewriteResponse?: Array<{ find: string, replace: string }>
}

/**
 * Trifid Query.
 */
export type TrifidQuery = (
  query: string,
  options?: TrifidQueryOptions,
) => Promise<unknown>
