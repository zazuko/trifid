function setIri (iri) {
  return (req, res, next) => {
    req.iri = iri

    next()
  }
}

module.exports = setIri
