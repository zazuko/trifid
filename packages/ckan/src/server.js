import dotenv from 'dotenv'
import express from 'express'
import process from 'process'
import rdf from 'rdf-ext'
import { createAPI } from './ckan.js'

dotenv.config()

const app = express()
const port = 8080
const host = '0.0.0.0'

const env = process.env

const { fetchDatasets, toXML } = createAPI({
  endpointUrl: env.STORE_QUERY_ENDPOINT,
  user: env.STORE_ENDPOINT_USERNAME,
  password: env.STORE_ENDPOINT_PASSWORD,
})

app.get('/ckan', async (req, res) => {
  const organization = req.query.organization
  if (!organization) {
    return res.status(400).send('Missing `organization` query param')
  }

  try {
    const uri = rdf.namedNode(organization)
    const dataset = await fetchDatasets(uri)
    const xml = await toXML(dataset)

    const format = 'application/rdf+xml'
    res.setHeader('Content-Type', format)

    return res.send(xml)
  } catch (e) {
    return res.status(500).send(e.toString())
  }
})

app.get('/healthz', async (req, res) => {
  return res.status(200).send('OK')
})

app.listen(port, host, () => {
  console.log(`Listening at http://${host}:${port}`)
})

process.on('SIGINT', () => {
  console.info('Application stopped')
  process.exit(0)
})
