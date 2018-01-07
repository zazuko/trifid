function dummyMiddleware () {
  const args = arguments

  return (req, res) => {
    res.json(args)
  }
}

module.exports = dummyMiddleware
