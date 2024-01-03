/**
 * Convert Oxigraph termType to SPARQL termType.
 *
 * @param {string} termType Oxigraph termType value
 * @returns {string} SPARQL termType value
 */
const convertTermType = (termType) => {
  switch (termType) {
    case 'Literal':
      return 'literal'
    case 'BlankNode':
      return 'bnode'
    case 'NamedNode':
      return 'uri'
    default:
      return 'literal'
  }
}

/**
 * Handle Oxigraph query results.
 *
 * @param {ReturnType<import('oxigraph').Store['query']>} results
 * @param {boolean} isConstructQuery
 * @returns {Promise<{
 *   raw: string | Record<string, any> | string[];
 *   response: string;
 *   contentType: 'application/sparql-results+json' | 'application/n-triples';
 *   type: 'ASK' | 'SELECT' | 'CONSTRUCT';
 * }>} SPARQL response.
 */
const handleOxigraphResult = async (results, isConstructQuery = false) => {
  let sparqlResponse = {}

  // Handle ASK queries
  if (typeof results === 'boolean') {
    sparqlResponse = {
      head: {},
      boolean: results,
    }
    return {
      raw: sparqlResponse,
      response: JSON.stringify(sparqlResponse, null, 2),
      contentType: 'application/sparql-results+json',
      type: 'ASK',
    }
  }

  // Handle empty results
  if (!results || !Array.isArray(results) || results.length === 0) {
    if (isConstructQuery) {
      return {
        raw: '',
        response: '',
        contentType: 'application/n-triples',
        type: 'CONSTRUCT',
      }
    }

    sparqlResponse = {
      head: {
        vars: [],
      },
      results: {
        bindings: [],
      },
    }
    return {
      raw: sparqlResponse,
      response: JSON.stringify(sparqlResponse, null, 2),
      contentType: 'application/sparql-results+json',
      type: 'SELECT',
    }
  }

  const headVariables = new Set()
  const bindings = []
  let isOtherThanMap = false

  // Loop over each result, and build bindings and variables
  // We assume that all results are `Map` objects for SELECT queries
  // If we get something else than `Map` objects, we assume it's a CONSTRUCT query
  for (const result of results) {
    if (result instanceof Map) {
      const binding = {}
      for (const [key, value] of result) {
        headVariables.add(key)
        binding[key] = {
          type: convertTermType(value.termType),
          value: value.value,
        }
        if (value.language) {
          binding[key]['xml:lang'] = value.language
        }
        if (value.datatype) {
          binding[key].datatype = value.datatype.value
        }
      }
      bindings.push(binding)
    } else {
      isOtherThanMap = true
      break
    }
  }

  // We got something else than `Map` objects, so we assume it's a CONSTRUCT query
  if (isOtherThanMap) {
    const quads = results.map((quad) => quad.toString())
    const quadsOutput = `${quads.join(' . \n')} .`
    return {
      raw: quads,
      response: quadsOutput,
      contentType: 'application/n-triples',
      type: 'CONSTRUCT',
    }
  }

  // Build the SPARQL response for the SELECT query
  sparqlResponse = {
    head: {
      vars: Array.from(headVariables),
    },
    results: {
      bindings,
    },
  }

  return {
    raw: sparqlResponse,
    response: JSON.stringify(sparqlResponse, null, 2),
    contentType: 'application/sparql-results+json',
    type: 'SELECT',
  }
}

/**
 * Perform a SPARQL query using Oxigraph.
 *
 * @param {import('oxigraph').Store} store Oxigraph store
 * @param {string} query The query to perform
 * @returns {Promise<{
 *   raw: string | Record<string, any> | string[];
 *   response: string;
 *   contentType: 'application/sparql-results+json' | 'application/n-triples';
 *   type: 'ASK' | 'SELECT' | 'CONSTRUCT';
 * }>} SPARQL response.
 */
export const performOxigraphQuery = async (store, query) => {
  const results = await store.query(query)
  const isConstructQuery = query.toUpperCase().includes('CONSTRUCT')
  return await handleOxigraphResult(results, isConstructQuery)
}
