const createTrifidConfig = (config, loggerSpy = []) => {
  return {
    logger: (str) => loggerSpy.push(str),
    config,
  }
}

export { createTrifidConfig }
