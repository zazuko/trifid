import express from 'express'

function staticFiles (router, options) {
  return this.middleware.mountAll(router, options, config => {
    return express.static(config.folder)
  })
}

export default staticFiles
