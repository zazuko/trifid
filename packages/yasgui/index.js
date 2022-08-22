import express from 'express'

import url, { fileURLToPath } from 'url'
import { dirname } from 'path'

const currentDir = dirname(fileURLToPath(import.meta.url))

const trifidFactory = (trifid) => {
  const { config, logger, render, server } = trifid
  const { template, endpointUrl, urlShortener } = config

  if (!endpointUrl) {
    throw new Error("no value was set for required field: 'endpointUrl'")
  }

  const view = !template ? `${currentDir}/views/yasgui.hbs` : template

  const yasguiPath = new URL('node_modules/yasgui/dist/', import.meta.url).pathname
  server.use('/yasgui-dist/', express.static(yasguiPath))

  return async (req, res, next) => {
    logger.debug('Yasgui plugin was called')

    res.send(await render(view, {
      // read SPARQL endpoint URL from configuration and resolve with absoluteUrl
      endpointUrl: url.resolve(req.absoluteUrl(), endpointUrl), // eslint-disable-line
      urlShortener
    }, { title: 'YASGUI' }))
  }
}

export default trifidFactory
