/* global rdf:false */

'use strict';


global.rdf = require('rdf-ext')(rdf);


var
  fs = require('fs'),
  graphSplit = require('./lib/graph-split')(rdf),
  url = require('url');


var init = function () {
  var config = this;

  var importGraph = function (filename) {
    return new Promise(function (resolve) {
      rdf.parseTurtle(fs.readFileSync(filename).toString(), function (graph) {
        resolve(graph);
      });
    });
  };

  return Promise.all([
    importGraph('./node_modules/tbbt-ld/dist/tbbt.nt')
  ]).then(function (graphs) {
    var
      mergedGraph = rdf.createGraph(),
      searchNs = 'http://localhost:8080',
      replaceNs = url.format({
        protocol: 'http:',
        hostname: config.hostname,
        port: config.port || '',
        pathname: config.path || ''
      });

    graphs.forEach(function (graph) {
      // map namespace to listener config
      graph = rdf.utils.mapNamespaceGraph(graph, searchNs, replaceNs);

      mergedGraph.addAll(graph);
    });

    config.handlerOptions.storeOptions = {
      graph: mergedGraph,
      split: rdf.utils.splitGraphByNamedNodeSubject
    };

    return Promise.resolve();
  });
};

var patchResponseHeaders = function (res, headers) {
  if (res.statusCode === 200) {
    // clean existings values
    var fieldList = [
      'Access-Control-Allow-Origin',
      'Cache-Control',
      'Fuseki-Request-ID',
      'Server',
      'Vary'];

    if (res._headers) {
      fieldList.forEach(function (field) {
        if (field in res._headers) {
          delete res._headers[field];
        }

        if (field.toLowerCase() in res._headers) {
          delete res._headers[field.toLowerCase()];
        }
      });
    }

    // cors header
    headers['Access-Control-Allow-Origin'] = '*';

    // cache header
    headers['Cache-Control'] = 'public, max-age=120';

    // vary header
    headers['Vary'] = 'Accept';
  }

  return headers;
};

module.exports = {
  app: 'trifid-ld',
  logger: {
    level: 'debug'
  },
  // public interface visible after any reverse proxies
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
    patchResponse: patchResponseHeaders
  },
  init: init,
  HandlerClass: require('./lib/ldp-module-handler'),
  handlerOptions: {
    rdf: rdf,
    StoreClass: graphSplit.SplitStore
  }
};
