import absoluteUrl from 'absolute-url'
import { resolve } from 'import-meta-resolve'
import express from 'express'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const currentDir = dirname(fileURLToPath(import.meta.url))

const factory = async (trifid) => {
  const { config, server, render } = trifid
  const {
    template,
    endpointUrl,
    acceptBlankNodes: acceptBlankNodesConfig,
    dataLabelProperty: dataLabelPropertyConfig,
    schemaLabelProperty: schemaLabelPropertyConfig,
    language: languageConfig,
    languages: languagesConfig
  } = config

  const view = !template ? `${currentDir}/views/graph-explorer.hbs` : template

  // serve static files for graph-explorer
  const distPath = await resolve('graph-explorer/dist/', import.meta.url)
  server.use('/graph-explorer-assets/', express.static(distPath.replace(/^file:\/\//, '')))
  server.use('/graph-explorer-static/', express.static(`${currentDir}/static/`))

  const endpoint = endpointUrl || '/query'
  const acceptBlankNodes = !!acceptBlankNodesConfig
  const dataLabelProperty = dataLabelPropertyConfig || 'rdfs:label'
  const schemaLabelProperty = schemaLabelPropertyConfig || 'rdfs:label'
  const language = languageConfig || 'en'
  const languages = languagesConfig || [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'German' },
    { code: 'fr', label: 'French' },
    { code: 'it', label: 'Italian' }
  ]

  return async (req, res, _next) => {
    absoluteUrl.attach(req)

    const urlPathname = new URL(req.originalUrl, req.absoluteUrl()).pathname

    // redirect to trailing slash URL
    if (urlPathname.slice(-1) !== '/') {
      return res.redirect(`${urlPathname}/`)
    }

    const content = await render(view, {
      // just forward all the config as a string
      graphExplorerConfig: JSON.stringify({
        // read SPARQL endpoint URL from configuration and resolve with absoluteUrl
        endpointUrl: new URL(endpoint, req.absoluteUrl()).href,

        // all other configured options
        acceptBlankNodes,
        dataLabelProperty,
        schemaLabelProperty,
        language,
        languages
      }).replace(/'/g, "\\'"),

      // good practice: forward locals to templates
      locals: res.locals
    }, { title: 'Graph Explorer' })

    res.send(content)
  }
}

export default factory
