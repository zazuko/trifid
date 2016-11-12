'use strict';

module.exports = function (config) {

  global.Promise = require('es6-promise').Promise;

  var
    absoluteUrl = require('absolute-url'),
    bodyParser = require('body-parser'),
    express = require('express'),
    handlerMiddleware = require('./lib/handler-middleware'),
    patchHeadersMiddleware = require('./lib/patch-headers-middleware'),
    morgan = require('morgan'),
    path = require('path'),
    bunyan = require('bunyan'),
    renderHtmlMiddleware = require('./lib/render-html-middleware'),
    sparqlProxy = require('./lib/sparql-proxy'),
    sparqlSearch = require('./lib/sparql-search');


  global.log = bunyan.createLogger({
    name: config.app,
    level: config.logger.level
  });

  if (!('init' in config)) {
    config.init = function () {
      return Promise.resolve();
    };
  }

  return config.init()
    .then(function () {
      var
        app = express(),
        handler = new config.HandlerClass(config.handlerOptions);

      if ('expressSettings' in config) {
        for (var key in config.expressSettings) {
          app.set(key, config.expressSettings[key]);
        }
      }

      app.use(morgan('combined'));
      app.use(patchHeadersMiddleware(config.patchHeaders));
      app.use(bodyParser.text());
      app.use(bodyParser.urlencoded({extended: false}));

      // instance files
      if (__dirname !== process.cwd()) {
        app.use(express.static(path.join(process.cwd(), './data/public/')));
      }

      // trifid files
      app.use(express.static(path.join(__dirname, './data/public/')));

      // yasgui files
      app.use('/sparql/dist/', express.static(path.resolve(require.resolve('yasgui'), '../../dist/')))

      app.use(absoluteUrl());

      if ('sparqlProxy' in config) {
        app.use(config.sparqlProxy.path, sparqlProxy(config.sparqlProxy.options));
      }

      if ('sparqlSearch' in config) {
        app.use(config.sparqlSearch.path, sparqlSearch(config.sparqlSearch.options));
      }

      app.use(renderHtmlMiddleware(handler));
      app.use(handlerMiddleware(handler));
      app.listen(config.listener.port, config.listener.hostname);

      log.info('listening on hostname:port: ' + config.listener.hostname + ':' + config.listener.port);
    })
    .catch(function (error) {
      console.error(error.stack);
    });

}