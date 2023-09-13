#!/usr/bin/env node

import { join } from "path";
import { Command } from "commander";

import trifid from "trifid-core";

const program = new Command();

const defaultConfigurationFile = process.env.TRIFID_CONFIG ?? "config.yaml";

program
  .option("-c, --config <path>", "configuration file", defaultConfigurationFile)
  .option("-p, --port <port>", "listener port", parseInt)
  .option("--sparql-endpoint-url <url>", "SPARQL endpoint URL")
  .option(
    "--dataset-base-url <url>",
    "the base URL of the dataset to enable rewriting",
  )
  .parse(process.argv);

const opts = program.opts();
const configFile = join(process.cwd(), opts.config);

// create a minimal configuration that extends the specified one
const config = {
  extends: [configFile],
  globals: {},
  server: {
    listener: {},
  },
};

// add optional arguments to the configuration
if (opts.port) {
  config.server.listener.port = opts.port;
}
if (opts.sparqlEndpointUrl) {
  config.globals.sparqlEndpoint = {
    url: opts.sparqlEndpointUrl,
  };
}
if (opts.datasetBaseUrl) {
  config.globals.datasetBaseUrl = opts.datasetBaseUrl;
}

// load the configuration and start the server
const instance = await trifid(config);
instance.start();
