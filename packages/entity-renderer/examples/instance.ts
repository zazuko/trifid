import { join } from 'path';
import trifid from 'trifid-core';
import entityRendererTrifidPlugin from '../index.ts';

import type { ConfigRecord, LogLevel } from 'trifid-core';

// A fixed port is required because the entity renderer resolves its SPARQL
// endpoint against the configured host/port (it queries itself over HTTP).
const port = 3000;

export const createTrifidInstance = async (
  configFilePath: string,
  logLevel: LogLevel = 'debug',
  additionalConfig: ConfigRecord = {},
  subpath?: string,
) => {
  const configFile = join(process.cwd(), configFilePath);
  return await trifid(
    {
      extends: [configFile],
      server: {
        logLevel,
        listener: {
          port,
          host: '0.0.0.0',
        },
        ...(subpath ? { subpath } : {}),
      },
    },
    {
      entityRenderer: {
        module: entityRendererTrifidPlugin,
        config: {
          followRedirects: true,
          ...additionalConfig,
        },
      },
    },
  );
};
