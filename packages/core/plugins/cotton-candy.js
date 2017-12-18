const cottonCandy = require('cotton-candy')
const cottonCandyInclude = require('cotton-candy/include')
const cottonCandySetterGetter = require('cotton-candy/setter-getter')

/**
 * Set cotton candy as default template engine with custom settings
 * @param app
 */
function init (router) {
  const resolver = this.configHandler.resolvePath.bind(this.configHandler)

  router.engine('html', cottonCandy({
    plugins: [
      cottonCandyInclude,
      cottonCandySetterGetter
    ],
    resolve: resolver
  }))

  router.set('view engine', 'cotton-candy')
}

module.exports = init
