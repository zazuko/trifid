export type TrifidPluginResult = {
  plugin?: any;
  pluginOptions?: any;
  routeOptions?: import("fastify").RouteOptions;
};
export type TrifidPlugin = () => Promise<TrifidPluginResult>;
