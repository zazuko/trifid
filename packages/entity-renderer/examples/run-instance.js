#!/usr/bin/env node

import { createTrifidInstance } from './instance.ts';

const trifidInstance = await createTrifidInstance('examples/config/trifid.yaml', 'debug');

await trifidInstance.start();
