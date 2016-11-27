'use strict'

var fs = require('fs')
var path = require('path')

module.exports = {
  app: 'trifid-ld',
  logger: {
    level: 'debug'
  },
  listener: {
    port: 8080
  },
  expressSettings: {
    'trust proxy': 'loopback',
    'x-powered-by': null
  },
  patchHeaders: {
    remove: [
      'Fuseki-Request-ID',
      'Server'
    ],
    static: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=120',
      'Vary': 'Accept'
    }
  },
  sparqlProxy: {
    path: '/sparql',
    options: {
/*
      authentication: {
        user: 'user',
        password: 'password'
      },
*/
      endpointUrl: 'http://localhost:3030/tbbt/sparql'
    }
  },
  sparqlSearch: {
    path: '/query',
    options: {
      endpointUrl: 'http://localhost:3030/tbbt/sparql',
      resultsPerPage: 5,
      queryTemplate: fs.readFileSync(path.join(__dirname, 'data/sparql/search.sparql')).toString(),
      variables: {
        'q': {
          variable: '%searchstring%',
          required: true
        }
      }
    }
  },
  HandlerClass: require('./lib/sparql-handler'),
  handlerOptions: {
    endpointUrl: 'http://localhost:3030/tbbt/sparql'
  }
}
