/* global rdf:false */

'use strict';


global.rdf = require('rdf-interfaces');
require('rdf-ext')(rdf);


var
  fs = require('fs'),
  graphSplit = require('./lib/graph-split')(rdf);


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
    var mergedGraph = rdf.createGraph();

    graphs.forEach(function (graph) {
      mergedGraph.addAll(graph);
    });

    config.handlerOptions.storeOptions = {
      graph: mergedGraph,
      split: graphSplit.subjectIriSplit
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

    if ('_headers' in res) {
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
  init: init,
  HandlerClass: require('./lib/ldp-module-handler'),
  handlerOptions: {
    rdf: rdf,
    StoreClass: graphSplit.SplitStore
  }
};
