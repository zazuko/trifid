function dummyMiddleware () {
  const args = arguments

  return (req, res) => {
    res.json(args)
  }
}

export default dummyMiddleware
