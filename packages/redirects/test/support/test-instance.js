import { join } from 'path'
import express from 'express'
import trifid from 'trifid-core'

async function createTrifidInstance ({ configFilePath }) {
  const configFile = join(process.cwd(), configFilePath)
  const config = {
    extends: [configFile],
    server: {
      listener: {}
    }
  }
  return await trifid(config)
}

async function createApp ({ configFilePath }) {
  const instance = await createTrifidInstance({ configFilePath })
  const app = express() // The main app
  app.use('/', instance.server)
  return app
}

export { createApp }
