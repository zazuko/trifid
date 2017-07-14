var configTools = require('./config')
var cottonCandy = require('cotton-candy')
var cottonCandyInclude = require('cotton-candy/include')

function init (app, config) {
  var resolver = configTools.resolveFilePath.bind(null, config)

  app.engine('html', cottonCandy({
    plugins: [
      cottonCandyInclude
    ],
    resolve: resolver
  }))
  app.set('view engine', 'cotton-candy')
}

module.exports = init
