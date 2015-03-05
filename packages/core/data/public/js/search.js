var context = {
  "@vocab" : "http://schema.org/"
};


var ResultTable = React.createClass({
  getInitialState: function() {
    return {
      page: 0,
      cache: {},
      details: {},
      data: []
    }
  },
  search: function () {
    var self = this;

    self.setState({cache: {}, data: []});

    self.setPage(0);
  },
  setPage: function (page) {
    var self = this;

    self.loadResults(page)
      .then(function (results) {
        self.setState({page: page, data: results});

        self.updateCache();
        self.updateDetails();
      })
      .catch(function () {
        self.setState({page: page, data: []});
      });
  },
  turnPage: function (direction, event) {
    var self = this;

    if (event != null) {
      event.preventDefault();
    }

    if (self.state.page + direction >= 0) {
      self.setPage(self.state.page + direction);
    }
  },
  updateCache: function () {
    var self = this;

    if (self.state.page > 0) {
      self.loadResults(self.state.page-1);
    }

    self.loadResults(self.state.page+1);
  },
  updateDetails: function () {
    var self = this;

    return Promise.all(self.state.data.map(function (row) {
      return self.loadDetails(row['@id']);
    }))
      .then(function (allDetails) {
        return Promise.all(allDetails.map(function (details) {
          if (!('dc:relation' in details)) {
            return Promise.resolve();
          }

          return self.loadDetails(details['dc:relation']['@id']);
        }));
      });
  },
  loadResults: function(page) {
    var
      self = this,
      searchString = $('#search-string').val();

    var doRequest = function (searchString, page) {
      return new Promise(function (resolve, reject) {
        var url = '/query?q=' + encodeURIComponent(searchString) + '&page=' + (page + 1);

        $.ajax({
          url: url,
          headers: {Accept: 'application/ld+json'},
          success: function (data) {
            jsonld.promises().compact(data, context)
              .then(function (data) {
                var cache = self.state.cache;

                if ('@graph' in data) {
                  data = data['@graph'];
                } else {
                  data = [data];
                }

                cache[page] = data;

                self.setState({cache: cache});

                resolve(data);
              })
          },
          error: function () {
            reject();
          }
        });
      });
    };

    if (page in self.state.cache) {
      return Promise.resolve(self.state.cache[page]);
    } else {
      return doRequest(searchString, page);
    }
  },
  loadDetails: function (url) {
    var self = this;

    var doRequest = function (url) {
      return new Promise(function (resolve, reject) {
        $.ajax({
          url: url,
          headers: {Accept: 'application/ld+json'},
          success: function (data) {
            jsonld.promises().compact(data, context)
              .then(function (data) {
                var details = self.state.details;

                details[url] = data;

                self.setState({details: details});

                resolve(data);
              })
          },
          error: function () {
            reject();
          }
        });
      });
    };

    if (url in self.state.details) {
      return Promise.resolve(self.state.details[url]);
    } else {
      return doRequest(url);
    }
  },
  componentDidMount: function() {
    var self = this;

    $('#search').on('click', self.search);
    $('#search-string').keypress(function (event) {
      if (event.which == 13) {
        self.search();
      }
    });
  },
  componentWillUnmount: function() {
    var self = this;

    $('#search').off('click', self.search);
  },
  render: function() {
    var self = this;

    var value = function (property) {
      if (typeof property === 'string') {
        return property;
      } else if ('@value' in property) {
        return property['@value'];
      } else if ('@id' in property) {
        return property['@id'];
      }
    };

    var getTerm = function (iri) {
      var
        getTermRegEx = /(#|\/)([^#\/]*)$/,
        parts = getTermRegEx.exec(iri);

      if (parts == null || parts.length === 0) {
        return null;
      }

      return parts[parts.length-1];
    };

    var link = function (ref, label) {
      if (ref === '') {
        return '';
      }

      if (label == null) {
        label = getTerm(ref);
      }

      return React.DOM.a({href: ref}, label);
    };


    var detail = function (id, property) {
      if (!(id in self.state.details)) {
        return '';
      }

      var details = self.state.details[id];

      if ('@graph' in details) {
        details = details['@graph'];
      }

      if (Array.isArray(details)) {
        details.forEach(function (subject) {
          if (subject['@id'].indexOf('_:') !== 0) {
            details = subject;
          }
        });
      }

      if (!(property in details)) {
        return '';
      }

      return details[property];
    };

    var rows = self.state.data.map(function (row, index) {
      var
        name = [];

      if ('givenName' in row) {
        name.push(row.givenName);
      }

      if ('familyName' in row) {
        name.push(row.familyName);
      }

      name = name.join(' ');

      return React.DOM.tr({key: row['@id']},
        React.DOM.td({}, self.state.page*self.props.resultsPerPage + index + 1),
        React.DOM.td({},
          React.DOM.a({href: row['@id']}, name)),
        React.DOM.td({}, value(detail(row['@id'], 'jobTitle')))
      );
    });

    var table = React.DOM.table({className: 'table table-bordered', id: 'results-table'},
      React.DOM.thead({},
        React.DOM.tr({},
          React.DOM.th({className: 'col-xs-1'}, 'No.'),
          React.DOM.th({className: 'col-xs-4'}, 'Name'),
          React.DOM.th({className: 'col-xs-1'}, 'Job')
        )),
      React.DOM.tbody({}, rows));

    var searchString = $('#search-string').val();

    var noEntries = React.DOM.p({}, 'no hits found');

    var pageIsNotEmpty = function (page) {
      if (!(page in self.state.cache)) {
        return false;
      }

      // there is at least one context entry, so check for a subject
      return '@id' in self.state.cache[page][0];
    };

    var pager = React.DOM.nav({},
      React.DOM.ul({className: 'pager'},
        pageIsNotEmpty(self.state.page-1) ? React.DOM.li({className: 'previous'},
          React.DOM.a({href: '#', onClick: self.turnPage.bind(self, -1)}, 'Previous')) : null,
        pageIsNotEmpty(self.state.page+1) ? React.DOM.li({className: 'next'},
          React.DOM.a({href: '#', onClick: self.turnPage.bind(self, +1)}, 'Next')) : null));

    return React.DOM.div({},
      self.state.data.length > 0 ? table : searchString != '' ? noEntries : '',
      pager);
  }
});


window.ui = {
  createResultTable: React.createFactory(ResultTable)
};
