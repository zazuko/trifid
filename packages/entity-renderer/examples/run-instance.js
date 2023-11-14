#!/usr/bin/env node

import { createTrifidInstance } from './instance.js'

const trifidInstance = await createTrifidInstance('examples/config/trifid.yaml', 'debug')

await trifidInstance.start()
