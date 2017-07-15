var configTools = require('./config')
var cottonCandy = require('cotton-candy')
var cottonCandyInclude = require('cotton-candy/include')
var cottonCandySetterGetter = require('cotton-candy/setter-getter')

/**
 * Set cotton candy as default template engine with custom settings
 * @param app
 */
function init (app) {
  var resolver = configTools.resolveFilePath.bind(null, app.locals.config)

  app.engine('html', cottonCandy({
    plugins: [
      cottonCandyInclude,
      cottonCandySetterGetter
    ],
    resolve: resolver
  }))
  app.set('view engine', 'cotton-candy')
}

/**
 * Adds routes for rendering static templates
 * @param router
 * @param options
 */
init.staticViews = function (router, options) {
  if (!options) {
    return
  }

  Object.keys(options).forEach(function (urlPath) {
    var filePath = options[urlPath]

    router.get(urlPath, function (req, res) {
      res.render(filePath)
    })
  })
}

module.exports = init
