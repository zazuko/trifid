import rdf from "rdf-ext";

function boundedDescriptionGraph(inputDataset, subject) {
  const input = inputDataset.clone();

  const siblings = rdf.termSet();
  input.forEach((quad) => {
    if (quad.subject.value.split("#")[0] === subject.value.split("#")[0]) {
      siblings.add(quad.subject);
    }
  });

  const descriptionWithBlankNodes = rdf.traverser(
    ({ dataset, level, quad }) =>
      level === 0 || quad.subject.termType === "BlankNode"
  );

  const result = rdf.dataset();
  siblings.forEach((subject) => {
    result.addAll(
      descriptionWithBlankNodes.match({ term: subject, dataset: input })
    );
  });
  return result;
}

export default boundedDescriptionGraph;
