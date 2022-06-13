function setIri (iri) {
  return (req, res, next) => {
    req.iri = iri

    next()
  }
}

export default setIri
