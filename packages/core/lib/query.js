/**
 * Create a SPARQL query function that can be used inside Trifid middlewares.
 *
 * @param {import('pino').Logger} logger Logger instance.
 * @returns {import('../types/index.d.ts').TrifidQuery} Query function.
 */
export const querySparql = (logger) => {
  /**
   * Execute a SPARQL query.
   *
   * @param {string} query SPARQL query.
   * @param {Record<string, any>?} options Query options.
   * @returns {Promise<any>} Query result.
   */
  const query = async (query, options = {}) => {
    logger.debug('SPARQL query', query)

    throw new Error('SPARQL query not implemented yet')
  }
  return query
}
