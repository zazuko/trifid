import merge from 'lodash/merge.js';

import type { EventEmitter } from 'node:events';

import type { FastifyInstance, FastifyReply, FastifyRequest, HTTPMethods } from 'fastify';
import type { Logger } from 'pino';

import { initQuery } from '../sparql.ts';
import type { SPARQLEndpointConfig } from '../sparql.ts';
import type { ConfigRecord, FastifyRouteHandler, TemplateEngineInstance } from '../../types/index.ts';
import type { StandardizedPlugin } from './standardize.ts';

/**
 *
 * @param server Fastify server instance.
 * @param globals Global settings.
 * @param plugins Plugins to apply.
 * @param logger Logger instance.
 * @param templateEngine Template engine instance.
 * @param instanceHostname Instance hostname.
 * @param trifidEvents Trifid events emitter.
 */
const apply = async (
  server: FastifyInstance,
  globals: ConfigRecord,
  plugins: Array<[string, StandardizedPlugin]>,
  logger: Logger,
  templateEngine: TemplateEngineInstance,
  instanceHostname: string,
  trifidEvents: EventEmitter,
  notFound: (request: FastifyRequest, reply: FastifyReply) => Promise<void>,
) => {
  const { query: querySparql } = initQuery(
    logger,
    globals.endpoints as Record<string, SPARQLEndpointConfig> | undefined,
    instanceHostname,
  );

  for (const [name, plugin] of plugins) {
    const { paths, hosts, methods, module, config } = plugin;

    const pluginLogger = logger.child({ name });
    const query = querySparql(logger.child({ name: `${name}:query` }));

    const pluginConfig = {
      paths,
      hosts,
      methods,
      config: merge({}, globals, config),
    };

    const { render, registerHelper } = templateEngine;
    const loadedPlugin = await module({
      ...pluginConfig,
      server,
      logger: pluginLogger,
      render,
      query,
      notFound,
      registerTemplateHelper: registerHelper,
      trifidEvents,
    });

    let routeHandler: FastifyRouteHandler | undefined;
    if (loadedPlugin) {
      if (loadedPlugin.defaultConfiguration) {
        const defaultConfiguration = await loadedPlugin.defaultConfiguration();
        if (defaultConfiguration) {
          if (defaultConfiguration.paths && pluginConfig.paths.length === 0) {
            pluginConfig.paths = defaultConfiguration.paths as string[];
          }
          if (defaultConfiguration.hosts && pluginConfig.hosts.length === 0) {
            pluginConfig.hosts = defaultConfiguration.hosts as string[];
          }
          if (defaultConfiguration.methods && pluginConfig.methods.length === 0) {
            pluginConfig.methods = defaultConfiguration.methods as string[];
          }
        }
      }

      if (loadedPlugin.routeHandler) {
        routeHandler = await loadedPlugin.routeHandler();
      }
    }

    if (!routeHandler) {
      continue;
    }

    const { hosts: pluginHosts, methods: pluginMethods, paths: pluginPaths } = pluginConfig;

    const baseRouteOptions = {
      method: pluginMethods as HTTPMethods[],
      handler: routeHandler,
    };

    if (pluginHosts.length === 0) {
      for (const path of pluginPaths) {
        logger.debug(
          `mount '${name}' plugin (methods=${baseRouteOptions.method}, path=${path})`,
        );
        server.route({
          ...baseRouteOptions,
          url: path,
        });
      }
    } else {
      for (const host of pluginHosts) {
        for (const path of pluginPaths) {
          logger.debug(
            `mount '${name}' plugin (methods=${baseRouteOptions.method}, path=${path}, host=${host})`,
          );
          server.route({
            ...baseRouteOptions,
            url: path,
            constraints: {
              host,
            },
          });
        }
      }
    }
  }
};

export default apply;
