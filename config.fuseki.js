'use strict'

var fs = require('fs')
var path = require('path')

var patchResponseHeaders = function (res, headers) {
  if (res.statusCode === 200) {
    // clean existings values
    var fieldList = [
      'Access-Control-Allow-Origin',
      'Cache-Control',
      'Fuseki-Request-ID',
      'Server',
      'Vary'
    ]

    if (res._headers) {
      fieldList.forEach(function (field) {
        if (field in res._headers) {
          delete res._headers[field]
        }

        if (field.toLowerCase() in res._headers) {
          delete res._headers[field.toLowerCase()]
        }
      })
    }

    // cors header
    headers['Access-Control-Allow-Origin'] = '*'

    // cache header
    headers['Cache-Control'] = 'public, max-age=120'

    // vary header
    headers['Vary'] = 'Accept'
  }

  return headers
}

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
    patchResponse: patchResponseHeaders
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
