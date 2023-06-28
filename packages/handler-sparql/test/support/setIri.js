const setIri = (iri) => {
  return (req, _res, next) => {
    req.iri = iri;
    next();
  };
};

export default setIri;
