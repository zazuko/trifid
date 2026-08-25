// @ts-check

import { createTrifidInstance } from './utils.ts';

const instance = await createTrifidInstance({ logLevel: 'debug' });
await instance.start();
