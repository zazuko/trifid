import defaultMiddlewares from './default.js'
import load from './loader.js'
import sort from './sort.js'
import standardize from './standardize.js'

const assembler = async (config, additionalMiddlewares = {}) => {
  const loadedMiddlewares = await load(config)

  const middlewares = {
    ...defaultMiddlewares,
    ...additionalMiddlewares,
    ...loadedMiddlewares
  }

  return sort(Object.entries(middlewares).map(m => {
    return [
      m[0],
      standardize(m[1])
    ]
  }))
}

export default assembler
