function factory (options) {
  return {
    handle: (req, res, next) => {
      if (options.callback) {
        options.callback(req, res, next)
      }
    }
  }
}

export default factory
