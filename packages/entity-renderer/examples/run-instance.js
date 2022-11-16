#!/usr/bin/env node

import { join } from 'path'
import express from 'express'

import trifid from 'trifid-core'
async function createTrifidInstance (filePath) {
  const configFile = join(process.cwd(), filePath)
  const config = {
    extends: [
      configFile
    ],
    server: {
      listener: {}
    }
  }
  return await trifid(config)
}

const people = await createTrifidInstance('examples/config/people.yaml')
const adams = await createTrifidInstance('examples/config/adams.yaml')

const app = express() // The main app
const PORT = 3000

app.use('/person', people.server)
app.use('/', adams.server)
app.listen(PORT, function (err) {
  if (err) console.log(err)
  console.log('Server listening on PORT', PORT)
})
