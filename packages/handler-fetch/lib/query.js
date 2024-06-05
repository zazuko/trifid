// @ts-check

/**
 * Perform a SPARQL query using Oxigraph.
 *
 * @param {import('oxigraph').Store} store Oxigraph store
 * @param {string} query The query to perform
 * @returns {Promise<{
 *   response: string;
 *   contentType: 'application/sparql-results+json' | 'text/turtle' | 'text/plain' | string & Record<never, never>;
 * }>} SPARQL response.
 */
export const performOxigraphQuery = async (store, query) => {
  let contentType = 'text/plain'
  let results = 'Something went wrong.'

  const queryUpper = query.toUpperCase()
  const isConstructQuery = queryUpper.includes('CONSTRUCT') || queryUpper.includes('DESCRIBE')

  try {
    if (isConstructQuery) {
      contentType = 'text/turtle'
      results = store.query(query, {
        use_default_graph_as_union: true,
        results_format: 'text/turtle',
      })
    } else {
      contentType = 'application/sparql-results+json'
      results = store.query(query, {
        use_default_graph_as_union: true,
        results_format: 'json',
      })
    }
  } catch (error) {
    contentType = 'text/plain'
    if (error instanceof Error) {
      results = error.message
    } else {
      results = 'An error occurred while executing the query.'
    }
  }

  return {
    response: results,
    contentType,
  }
}
