import rdf from "rdf-ext";
import boundedDescriptionGraph from "./boundedDescriptionGraph.js";

function splitIntoGraphs(inputDataset) {
  const input = inputDataset.clone();

  const result = rdf.dataset();

  const allIRIs = [...input].reduce((iriSet, quad) => {
    if (quad.subject.termType !== "NamedNode") {
      return iriSet;
    }
    iriSet.add(quad.subject.value.split("#")[0]);
    return iriSet;
  }, new Set());

  allIRIs.forEach((resourceIRI) => {
    const resourceNode = rdf.namedNode(resourceIRI);
    const resourceTriples = boundedDescriptionGraph(input, resourceNode);

    resourceTriples.forEach((triple) => {
      if (triple.subject.termType !== "BlankNode") {
        input.delete(triple);
      }
    });

    result.addAll(
      resourceTriples.map((quad) =>
        rdf.quad(quad.subject, quad.predicate, quad.object, resourceNode),
      ),
    );
  });

  return result;
}

export default splitIntoGraphs;
