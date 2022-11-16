import handleRedirect from './handleRedirect.js'

const DEFAULTS = {
  handleRedirects: true
}

function getMatchers ({ options = {} }) {
  const proxyConfig = Object.assign({}, DEFAULTS, options)
  const result = []
  if (proxyConfig.handleRedirects) {
    result.push(handleRedirect)
  }
  return result
}

export { getMatchers }
