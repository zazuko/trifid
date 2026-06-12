import { parentPort } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';
import { resolve as pathResolve } from 'node:path';

import oxigraph from 'oxigraph';

import { performOxigraphQuery } from './query.ts';

if (!parentPort) {
  throw new Error('This module must be run as a worker thread');
}
const port = parentPort;

/**
 * Configuration sent by the parent to initialize the store.
 */
interface WorkerConfig {
  graphName?: string;
  unionDefaultGraph?: boolean | string;
  url: string;
  contentType?: string;
  baseIri?: string;
}

/**
 * Fetch file content from URL or path.
 *
 * @param url URL or path to file to fetch.
 * @returns File content.
 */
const getContent = async (url: string): Promise<string> => {
  let content;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    const response = await fetch(url);
    content = await response.text();
  } else {
    const resolvedPath = pathResolve(url);
    content = await readFile(resolvedPath, 'utf8');
  }

  return content;
};

// Create a store
const store = new oxigraph.Store();
port.postMessage({
  type: 'log',
  data: 'Created store',
});

// Handle configuration
const handleConfig = async (config: WorkerConfig) => {
  const { graphName, unionDefaultGraph, url, contentType, baseIri } = config;
  let graphNameIri: string | ReturnType<typeof oxigraph.defaultGraph> | undefined = graphName;
  if ((typeof unionDefaultGraph === 'boolean' && unionDefaultGraph) || unionDefaultGraph === 'true') {
    graphNameIri = oxigraph.defaultGraph();
  }

  // Read data from file or URL
  let data;
  try {
    data = await getContent(url);
  } catch (error) {
    let errorMessage = `Something went wrong while loading data from ${url}…`;
    if (error instanceof Error) {
      errorMessage = `Error loading data from ${url}: ${error.message}`;
    }
    port.postMessage({
      type: 'log',
      data: errorMessage,
    });
    port.postMessage({
      type: 'ready',
      data: false,
    });
    return;
  }
  port.postMessage({
    type: 'log',
    data: `Loaded ${data.length} bytes of data from ${url}`,
  });
  // Load the data into the store (the configured values are forwarded as-is,
  // matching the original runtime behaviour)
  store.load(data, {
    format: contentType as string,
    base_iri: baseIri,
    to_graph_name: graphNameIri as never,
  });
  port.postMessage({
    type: 'log',
    data: 'Loaded data into store',
  });

  // Tell the parent that the worker is ready to handle queries
  port.postMessage({
    type: 'ready',
    data: true,
  });
};

// Handle query
const handleQuery = async (data: { query: string; queryId: string }) => {
  const { query, queryId } = data;
  let response: string;
  let contentType = 'text/plain';
  let success = false;

  // Perform the query and catch any errors
  try {
    const { response: storeResponse, contentType: storeContentType } = await performOxigraphQuery(store, query);
    response = storeResponse;
    contentType = storeContentType;
    success = true;
  } catch (error) {
    response = error instanceof Error ? error.message : String(error);
  }

  port.postMessage({
    type: 'query',
    data: {
      queryId,
      response,
      contentType,
      success,
    },
  });
};

port.on('message', async (event) => {
  if (!event || !event.type) {
    return;
  }

  switch (event.type) {
    case 'config':
      await handleConfig(event.data);
      break;
    case 'query':
      await handleQuery(event.data);
      break;
  }
});
