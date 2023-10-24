#!/usr/bin/env node

/* eslint-disable no-console */

import { join } from 'path'
import express from 'express'

import trifid from 'trifid-core'

async function createTrifidInstance (filePath) {
  const configFile = join(process.cwd(), filePath)
  const config = {
    extends: [configFile],
    server: {
      listener: {},
    },
  }
  return await trifid(config)
}

const test = await createTrifidInstance('examples/config/trifid.yaml')

const app = express() // The main app
const PORT = 3000

app.use('/', test.server)
app.listen(PORT, function (err) {
  if (err) console.log(err)
  console.log('Server listening on PORT', PORT)
})
