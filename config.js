'use strict'

module.exports = {
  app: 'trifid-ld',
  logger: {
    level: 'debug'
  },
  hostname: 'localhost',
  port: 8080,
  path: '',
  // listener
  listener: {
    hostname: '',
    port: 8080
  },
  expressSettings: {
    'trust proxy': 'loopback',
    'x-powered-by': null
  },
  patchHeaders: {
    static: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=120',
      'Vary': 'Accept'
    }
  },
  HandlerClass: require('./lib/trifid-handler-fs'),
  handlerOptions: {
    path: 'node_modules/tbbt-ld'
  }
}
