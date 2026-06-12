import { join } from 'path';
import trifid from 'trifid-core';
import entityRendererTrifidPlugin from '../index.ts';

// A fixed port is required because the entity renderer resolves its SPARQL
// endpoint against the configured host/port (it queries itself over HTTP).
const port = 3000;

export const createTrifidInstance = async (configFilePath, logLevel = 'debug', additionalConfig = {}) => {
  const configFile = join(process.cwd(), configFilePath);
  return await trifid({
    extends: [configFile],
    server: {
      logLevel,
      listener: {
        port,
        host: '0.0.0.0',
      },
    },
  }, {
    entityRenderer: {
      module: entityRendererTrifidPlugin,
      config: {
        followRedirects: true,
        ...additionalConfig,
      },
    },
  });
};
