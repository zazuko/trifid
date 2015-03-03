'use strict';


var
  url = require('url'),
  AbstractStore = require('./abstract-store');


var subjectIriSplit = function (graph, store) {
  var
    splitted = {},
    blank = {};

  var documentIri = function (iri) {
    return iri.split('#', 2)[0];
  };

  graph.forEach(function (triple) {
    var key = documentIri(triple.subject.nominalValue);

    if (triple.subject.interfaceName == 'NamedNode') {
      if (!(key in splitted)) {
        splitted[key] = [];
      }

      splitted[key].push(triple);
    } else {
      if (!(key in blank)) {
        blank[key] = [];
      }

      blank[key].push(triple);
    }
  });

  // TODO: handle bank nodes
  /*if (Object.keys(blank).length !== 0) {
    throw 'implement blank node handling!';
  }*/

  for(var iri in splitted) { console.log(iri);
    store.add(iri, rdf.createGraph(splitted[iri]), function () {});
  }
};


var SplitStore = function (rdf, options) {
  var
    store = new rdf.InMemoryStore();

  if (!('graph' in options)) {
    throw 'graph option missing';
  }

  if (!('split' in options)) {
    throw 'split option missing';
  }

  options.split(options.graph, store);

  var mapIri = function (iri) {
    var parsed = url.parse(iri);

    if ('hostname' in options) {
      parsed.hostname = options.hostname;
    }

    if ('port' in options) {
      parsed.port = options.port;
    }

    delete parsed.host;

    return url.format(parsed);
  };

  this.graph = function (iri, callback) {
    store.graph(mapIri(iri), callback);
  };

  this.add = function (iri, graph, callback) {
    callback(null, 'read only store');
  };

  this.delete = function (iri, callback) {
    callback(false, 'read only store');
  };
};


SplitStore.prototype = new AbstractStore();
SplitStore.constructor = SplitStore;


module.exports = function (rdf) {
  return {
    SplitStore: SplitStore.bind(null, rdf),
    subjectIriSplit: subjectIriSplit
  };
};