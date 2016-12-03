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
  HandlerClass: require('./lib/trifid-handler-sparql'),
  handlerOptions: {
    endpointUrl: 'http://localhost:3030/tbbt/sparql'
  }
}
