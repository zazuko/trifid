// @ts-check

import { createTrifidInstance } from './utils.js'

const instance = await createTrifidInstance({ logLevel: 'debug' })
await instance.start()
