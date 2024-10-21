/**
 * Trifid Plugin Configuration.
 */
export type TrifidPluginConfig = {
    /**
     * The order of the plugin (for loading them).
     */
    order?: number;
    /**
     * The NPM module of the plugin.
     */
    module?: string;
    /**
     * The paths to apply the plugin to.
     */
    paths?: string | string[];
    /**
     * The HTTP methods to apply the plugin to.
     */
    methods?: string | string[];
    /**
     * The hosts to apply the plugin to.
     */
    hosts?: string | string[];
    /**
     * The plugin configuration.
     */
    config?: {
        [x: string]: any;
    };
};
/**
 * Trifid configuration.
 */
export type TrifidConfig = {
    /**
     * Fastify server.
     */
    server?: {
        listener?: {
            host?: string;
            port?: number | string;
        };
        logLevel?: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
        logFormat?: "pretty" | "json";
        options?: {
            [x: string]: any;
        };
    };
    /**
     * Global settings.
     */
    globals?: {
        [x: string]: any;
    };
    /**
     * Template settings.
     */
    template?: {
        [x: string]: any;
    };
    /**
     * Plugins.
     */
    plugins?: {
        [x: string]: TrifidPluginConfig;
    };
};
/**
 * Object that have an optional `extends` field.
 */
export type ObjectWithExtends = {
    /**
     * The configuration to extend.
     */
    extends?: string[];
};
/**
 * Trifid configuration with `extends` field.
 */
export type TrifidConfigWithExtends = TrifidConfig & ObjectWithExtends;
/**
 * Fastify route handler.
 */
export type FastifyRouteHandler = Function;
/**
 * Trifid Plugin Argument.
 */
export type TrifidPluginArgument = {
    /**
     * The paths to apply the plugin to.
     */
    paths?: string[];
    /**
     * The HTTP methods to apply the plugin to.
     */
    methods?: string[];
    /**
     * The hosts to apply the plugin to.
     */
    hosts?: string[];
    /**
     * The logger instance.
     */
    logger: import("pino").Logger;
    /**
     * The Fastify server instance.
     */
    server: import("fastify").FastifyInstance & {
        locals: Map<string, any>;
    };
    /**
     * The Trifid configuration.
     */
    config: {
        [x: string]: any;
    };
    /**
     * The render function.
     */
    render: (request: import("fastify").FastifyRequest & {
        session: Map<string, any>;
    }, templatePath: string, context: {
        [x: string]: any;
    }, options?: {
        [x: string]: any;
    }) => Promise<string>;
    /**
     * The SPARQL query function.
     */
    query: TrifidQuery;
    /**
     * The Trifid events emitter.
     */
    trifidEvents: import("node:events").EventEmitter;
    /**
     * Register a template helper, that can be used by the template engine.
     */
    registerTemplateHelper: (name: string, fn: import("handlebars").HelperDelegate) => void;
};
/**
 * Trifid Plugin Setup.
 */
export type TrifidPluginSetup = {
    /**
     * Default configurations for this plugin.
     */
    defaultConfiguration?: () => Promise<TrifidPluginConfig>;
    /**
     * Route handler.
     */
    routeHandler?: () => Promise<FastifyRouteHandler>;
};
/**
 * Trifid Plugin.
 */
export type TrifidPlugin = (trifid: TrifidPluginArgument) => Promise<TrifidPluginSetup | void>;
/**
 * Trifid Query.
 */
export type TrifidQuery = (query: string, options?: {
    [x: string]: any;
}) => Promise<any>;
//# sourceMappingURL=index.d.ts.map