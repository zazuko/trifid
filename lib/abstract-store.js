'use strict';


var AbstractStore = function () {
  var self = this;

  this.match = function (iri, subject, predicate, object, callback, limit) {
    self.graph(iri, function (graph) {
      if (graph == null) {
        callback(null);
      } else {
        callback(graph.match(subject, predicate, object, limit));
      }
    });
  };

  this.merge = function (iri, graph, callback) {
    self.graph(iri, function (existing) {
      var merged = graph;

      if (existing != null) {
        merged = existing.addAll(graph);
      }

      self.add(merged, callback);
    });
  };

  this.remove = function (iri, graph, callback) {
    self.graph(iri, function (existing) {
      if (existing != null) {
        self.add(rdf.Graph.difference(existing, graph), function (added) {
          callback(added != null);
        });
      } else {
        callback(true);
      }
    });
  };

  this.removeMatches = function (iri, subject, predicate, object, callback) {
    self.graph(iri, function (existing) {
      if (existing != null) {
        self.add(iri, existing.removeMatches(subject, predicate, object), function (added) {
          callback(added != null);
        });
      } else {
        callback(true);
      }
    });
  };
};

module.exports = AbstractStore;