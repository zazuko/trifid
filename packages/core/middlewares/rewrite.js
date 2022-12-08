import camouflageRewrite from 'camouflage-rewrite'

/**
 * Rewrite the dataset base URL.
 *
 * Configuration fields:
 *  - datasetBaseUrl (string): the base URL to rewrite
 *  - rewriteContent (boolean): rewrite response content
 *
 * Other available options are documented here: https://github.com/zazuko/camouflage-rewrite#usage
 *
 * @param {*} trifid Trifid object containing the configuration, and other utility functions.
 * @returns Express middleware.
 */
const factory = (trifid) => {
  const { config } = trifid
  const { rewriteContent, datasetBaseUrl } = config

  let rewriteContentValue = true
  if (rewriteContent !== undefined) {
    rewriteContentValue = rewriteContent
  }

  return camouflageRewrite({
    ...config,
    url: datasetBaseUrl,
    rewriteContent: rewriteContentValue
  })
}

export default factory
