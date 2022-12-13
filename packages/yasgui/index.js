import express from 'express'
import { resolve } from 'import-meta-resolve'
import url, { fileURLToPath } from 'url'
import { dirname } from 'path'

const currentDir = dirname(fileURLToPath(import.meta.url))

const trifidFactory = async (trifid) => {
  const { config, logger, render, server } = trifid
  const { template, endpointUrl, urlShortener } = config

  const endpoint = endpointUrl || '/query'
  const view = !template ? `${currentDir}/views/yasgui.hbs` : template

  // serve static files for YASGUI
  const yasguiPath = await resolve('@triply/yasgui/build/', import.meta.url)
  server.use('/yasgui-dist/', express.static(yasguiPath.replace(/^file:\/\//, '')))

  // serve static files for openlayers (maps)
  const staticUrl = new URL('static/', import.meta.url)
  const staticPath = fileURLToPath(staticUrl)
  server.use('/yasgui-static/', express.static(staticPath))

  // serve static files for custom plugins
  const pluginsUrl = new URL('plugins/', import.meta.url)
  const pluginsPath = fileURLToPath(pluginsUrl)
  server.use('/yasgui-plugins/', express.static(pluginsPath))

  return async (req, res, _next) => {
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
