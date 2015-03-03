/* global rdf:false, React:false */
'use strict';

var dcVocab = {
  "@context": {
    "dc": "http://purl.org/dc/elements/1.1/",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
  },
  "@graph": [
    {
      "@id": "dc:contributor",
      "@type": "rdf:Property",
      "rdfs:label": {
        "@language": "en",
        "@value": "Contributor"
      }
    },
    {
      "@id": "dc:source",
      "@type": "rdf:Property",
      "rdfs:label": {
        "@language": "en",
        "@value": "Source"
      }
    },
    {
      "@id": "dc:language",
      "@type": "rdf:Property",
      "rdfs:label": {
        "@language": "en",
        "@value": "Language"
      }
    },
    {
      "@id": "dc:creator",
      "@type": "rdf:Property",
      "rdfs:label": {
        "@language": "en",
        "@value": "Creator"
      }
    },
    {
      "@id": "dc:type",
      "@type": "rdf:Property",
      "rdfs:label": {
        "@language": "en",
        "@value": "Type"
      }
    },
    {
      "@id": "dc:title",
      "@type": "rdf:Property",
      "rdfs:label": [{
        "@language": "en",
        "@value": "Title"
      },{
        "@language": "de",
        "@value": "Titel"
      }]
    },
    {
      "@id": "dc:coverage",
      "@type": "rdf:Property",
      "rdfs:label": {
        "@language": "en",
        "@value": "Coverage"
      }
    },
    {
      "@id": "dc:format",
      "@type": "rdf:Property",
      "rdfs:label": {
        "@language": "en",
        "@value": "Format"
      }
    },
    {
      "@id": "dc:relation",
      "@type": "rdf:Property",
      "rdfs:label": {
        "@language": "en",
        "@value": "Relation"
      }
    },
    {
      "@id": "dc:date",
      "@type": "rdf:Property",
      "rdfs:label": {
        "@language": "en",
        "@value": "Date"
      }
    },
    {
      "@id": "dc:identifier",
      "@type": "rdf:Property",
      "rdfs:label": {
        "@language": "en",
        "@value": "Identifier"
      }
    },
    {
      "@id": "dc:publisher",
      "@type": "rdf:Property",
      "rdfs:label": {
        "@language": "en",
        "@value": "Publisher"
      }
    },
    {
      "@id": "dc:subject",
      "@type": "rdf:Property",
      "rdfs:label": {
        "@language": "en",
        "@value": "Subject"
      }
    },
    {
      "@id": "dc:description",
      "@type": "rdf:Property",
      "rdfs:label": {
        "@language": "en",
        "@value": "Description"
      }
    },
    {
      "@id": "dc:rights",
      "@type": "rdf:Property",
      "rdfs:label": {
        "@language": "en",
        "@value": "Rights"
      }
    }
  ]
};


jsonld.promises.flatten = function (json, context) {
  return new Promise(function (resolve, reject) {
    jsonld.flatten(json, context, function (error, result) {
      if (error != null) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

jsonld.promises.expand = function (json) {
  return new Promise(function (resolve, reject) {
    jsonld.expand(json, function (error, result) {
      if (error != null) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};


var JsonLdSubjectTable = React.createClass({
  getInitialState: function () {
    var
      self = this,
      expandVocabs = [];

    if ('vocabs' in this.props) {
      this.props.vocabs.forEach(function (vocab) {
        expandVocabs.push(jsonld.promises.expand(vocab));
      });
    }

    Promise.all(expandVocabs)
      .then(function (results) {
        self.setState({vocab: Array.prototype.concat.apply([], results)});
      });

    return {vocab: []};
  },
  render: function () {
    var
      self = this,
      id,
      head,
      body,
      objects,
      rows = [];

    var getIriLabel = function (iri) {
      var
        getTermRegEx = /(#|\/)([^#\/]*)$/,
        parts = getTermRegEx.exec(iri);

      if (parts == null || parts.length === 0) {
        return null;
      }

      return parts[parts.length-1];
    };

    var getPredicateLabel = function (iri) {
      var
        vocab = self.state.vocab,
        subject,
        predicate = 'http://www.w3.org/2000/01/rdf-schema#label',
        objects,
        language = navigator.language || navigator.userLanguage;

      for(var i=0; i<vocab.length; i++) {
        subject = vocab[i];

        if (subject['@id'] === iri && predicate in subject) {
          objects = subject[predicate];

          for(var j=0; j<objects.length; j++) {
            if (!('@language' in objects[j]) || objects[j]['@language'] === language) {
              return objects[j]['@value'];
            }
          }
        }
      }

      return getIriLabel(iri);
    };

    var renderIri = function (iri, label) {
      return React.DOM.a({href: iri}, label != null ? label : iri);
    };

    var renderBlankNode = function (blankNode) {
      return React.DOM.a({href: '#' + blankNode}, blankNode);
    };

    var renderLiteral = function (literal) {
      if (typeof literal === 'string') {
        return React.DOM.span({}, literal);
      } else {
        if ('@language' in literal) {
          return React.DOM.span({}, literal['@value'] + ' @' + literal['@language']);
        } else if ('@type' in literal) {
          return React.DOM.span({},
            literal['@value'] + ' (',
            renderIri(literal['@type'], getIriLabel(literal['@type'])),
            ')');
        } else {
          return React.DOM.span({}, literal['@value'].toString());
        }
      }
    };

    var renderNode = function (node, label) {
      if (typeof node === 'object') {
        if ('@id' in node) {
          if (node['@id'].indexOf('_:') !== 0) {
            return renderIri(node['@id'], label);
          } else {
            return renderBlankNode(node['@id']);
          }
        } else {
          return renderLiteral(node);
        }
      } else {
        return renderLiteral(node);
      }
    };

    head = React.DOM.thead({},
      React.DOM.tr({},
        React.DOM.th({colSpan: 2, style: {textAlign: 'center'}}, 'subject: ', renderNode(self.props.subject))),
      React.DOM.tr({},
        React.DOM.th({style: {width: '50%'}}, 'predicate'),
        React.DOM.th({}, 'object')));

    for(var predicate in self.props.subject) {
      objects = self.props.subject[predicate];

      if (predicate.indexOf('@') === 0) {
        if (predicate === '@type') {
          predicate = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';

          objects = objects.map(function (type) {
            return {'@id': type};
          });
        } else {
          continue;
        }
      }

      objects.forEach(function (object) {
        rows.push(React.DOM.tr({key: predicate + JSON.stringify(object)},
          React.DOM.td({}, renderIri(predicate, getPredicateLabel(predicate))),
          React.DOM.td({}, renderNode(object, '@id' in object ? getIriLabel(object['@id']) : null))
        ));

      });
    }

    body = React.DOM.tbody({}, rows);

    return React.DOM.table({className: 'table table-bordered', id: self.props.subject['@id']}, head, body);
  }
});

var createJsonLdSubjectTable = React.createFactory(JsonLdSubjectTable);


var JsonLdTables = React.createClass({
  render: function () {
    var
      self = this,
      subjects,
      tables = [];

    // move blank nodes to the end
    subjects = self.props.graph
      .sort(function (a, b) {
        if (a['@id'].indexOf('_:') === 0 && b['@id'].indexOf('_:') !== 0) {
          return 1;
        } else if (a['@id'].indexOf('_:') !== 0 && b['@id'].indexOf('_:') === 0) {
          return -1;
        }

        return a['@id'].localeCompare(b['@id']);
      });

    subjects.forEach(function (subject) {
      tables.push(createJsonLdSubjectTable({
        key: subject['@id'],
        subject: subject,
        vocabs: self.props.vocabs}));
    });

    return React.DOM.div({}, tables);
  }
});

var createJsonLdTables = React.createFactory(JsonLdTables);


var getJsonLdGraph = function () {
  var
    element = document.querySelector('script[type="application/ld+json"]');

  if (element == null) {
    return Promise.reject();
  }

  return jsonld.promises.flatten(JSON.parse(element.innerHTML), {}).then(jsonld.promises.expand);
};


getJsonLdGraph()
  .then(function (graph) {
    var tables = createJsonLdTables({graph: graph, vocabs: [dcVocab]});

    React.render(tables, document.getElementById('graph'));
  })
  .catch(function (error) {
    console.error(error);
  });