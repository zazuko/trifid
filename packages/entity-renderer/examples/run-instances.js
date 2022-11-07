#!/usr/bin/env node

import { join } from 'path'

import trifid from 'trifid-core'
async function createTrifidInstance (filePath, port) {
  const configFile = join(process.cwd(), filePath)
  const config = {
    extends: [
      configFile
    ],
    server: {
      listener: {}
    }
  }
  config.server.listener.port = port
  return await trifid(config)
}

const people = await createTrifidInstance('examples/config/people.yaml', 8080)
const cube = await createTrifidInstance('examples/config/cube.yaml', 8081)
const adams = await createTrifidInstance('examples/config/adams.yaml', 8082)

people.start()
cube.start()
adams.start()
