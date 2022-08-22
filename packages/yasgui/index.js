import express from 'express'

import url, { fileURLToPath } from 'url'
import { dirname } from 'path'

const currentDir = dirname(fileURLToPath(import.meta.url))

const trifidFactory = (trifid) => {
  const { config, logger, render, server } = trifid
  const { template, endpointUrl, urlShortener } = config

  const endpoint = endpointUrl || '/query'
  const view = !template ? `${currentDir}/views/yasgui.hbs` : template

  const yasguiPath = new URL('node_modules/yasgui/dist/', import.meta.url).pathname
  server.use('/yasgui-dist/', express.static(yasguiPath))

  return async (req, res, next) => {
    logger.debug('Yasgui plugin was called')

    const content = await render(view, {
      // read SPARQL endpoint URL from configuration and resolve with absoluteUrl
      endpointUrl: url.resolve(req.absoluteUrl(), endpoint), // eslint-disable-line
      urlShortener
    }, { title: 'YASGUI' })

    res.send(content)
  }
}

export default trifidFactory
