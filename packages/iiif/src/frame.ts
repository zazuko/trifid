import jsonld from 'jsonld';

// jsonld.frame gets the schema (context) remotely, which is really expensive.
// This map is a 'cache' for that specific call
const cachedEntries = new Map<string, unknown>();
// `documentLoaders` is provided by jsonld at runtime but missing from the typings.
const nodeDocumentLoader = (jsonld as any).documentLoaders.node();

const customLoader = async (url: string, _options?: unknown) => {
  if (!cachedEntries.has(url)) {
    cachedEntries.set(url, await nodeDocumentLoader(url));
  }
  return cachedEntries.get(url);
};

const iiifFrame = {
  '@context': [
    'https://iiif.io/api/presentation/3/context.json',
    // For some reason, the OA context does not get loaded properly.
    // Those are the parts that we need from https://www.w3.org/ns/anno.jsonld
    {
      body: {
        '@type': '@id',
        '@id': 'oa:hasBody',
      },
      target: {
        '@type': '@id',
        '@id': 'oa:hasTarget',
      },
      motivation: {
        '@type': '@vocab',
        '@id': 'oa:motivatedBy',
      },
      partOf: {
        '@type': '@id',
        '@id': 'as:partOf',
      },
    },
  ],
  'type': 'Manifest',
};

/**
 * Goes from a list-like json to a tree-like json
 *
 * @param doc JSON-LD document to frame.
 */
const frame = async (doc: jsonld.JsonLdDocument): Promise<Record<string, unknown>> => {
  // The `documentLoader` option is supported at runtime but missing from the typings.
  const framed = await (jsonld.frame as any)(doc, iiifFrame, {
    documentLoader: customLoader,
  }) as Record<string, unknown>;
  framed['@context'] = 'http://iiif.io/api/presentation/3/context.json';
  return framed;
};

export default frame;
