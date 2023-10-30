const factory = (trifid) => {
  const { message } = trifid.config

  let messageToThrow = 'Oops, something went wrong :-('
  if (message) {
    messageToThrow = `${message}`
  }

  return (_req, _res, _next) => {
    throw new Error(messageToThrow)
  }
}

export default factory
