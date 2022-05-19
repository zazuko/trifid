function createTrifidConfig (config, loggerSpy = []) {
  return {
    logger: str => loggerSpy.push(str),
    config: config
  }
}

export { createTrifidConfig }
