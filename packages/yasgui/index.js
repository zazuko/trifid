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

  const yasguiPath = await resolve('yasgui/dist/', import.meta.url)
  server.use('/yasgui-dist/', express.static(yasguiPath.replace(/^file:\/\//, '')))

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
