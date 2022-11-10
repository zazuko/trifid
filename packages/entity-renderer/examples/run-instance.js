#!/usr/bin/env node

import { join } from 'path'
import express from 'express'




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
const cube = await createTrifidInstance('examples/config/view.yaml', 8081)
const adams = await createTrifidInstance('examples/config/adams.yaml', 8082)

// people.start()
// cube.start()
// adams.start()

const app = express();  // The main app
const PORT = 3000;

app.use('/person', people.server);
app.use('/view', cube.server);
app.use('/', adams.server);
app.listen(PORT, function(err){
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});
