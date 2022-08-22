import { render } from '@lit-labs/ssr/lib/render-with-global-dom-shim.js'
import { createReadStream } from 'fs'
import { createServer } from 'http'
import { dirname, resolve } from 'path'
import { Readable } from 'stream'
import { fileURLToPath } from 'url'
import { toQuads } from '../test/support/serialization.js'
import { cubeView } from './data/cubeView.js'
import { ResourceDescription } from '../lib/web-component/ResourceDescription.js'
import rdf from 'rdf-ext'

const __dirname = dirname(fileURLToPath(import.meta.url))

createServer(async (request, response) => {
  if (request.url === '/css') {
    const styleFile = resolve(__dirname, '../views', 'style.css')
    createReadStream(styleFile).pipe(response)
  } else {
    function * renderPage (webpage) {
      yield `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Home</title>
  <link rel="stylesheet" href="css">
</head>
<body>
<div class="container">
  `
      yield * render(webpage)
      yield `
</div>
</body>
</html>
  `
    }

    const dataset = rdf.dataset().addAll(toQuads(cubeView))
    const cf = rdf.clownface({ dataset, term: rdf.namedNode('https://ld.stadt-zuerich.ch/statistics/view/V000001') })

    const entities = await ResourceDescription(cf, {
      compactMode: true, embedBlanks: true, embedNamed: true
    })

    response.writeHead(200)
    Readable.from(renderPage(entities)).pipe(response)
  }
}).listen(8080)
console.log('http://localhost:8080')
